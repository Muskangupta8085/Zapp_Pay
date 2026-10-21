import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types/index.js';
import { IdempotencyKey } from '../models/idempotencyKey.model.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Enforces request idempotency for mutating financial operations
 */
export const enforceIdempotency = (options: { required?: boolean } = {}) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const rawKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

      if (!rawKey) {
        if (options.required) {
          return next(ApiError.badRequest('Idempotency-Key header is required for this operation.'));
        }
        return next();
      }

      const userId = req.user?.userId || 'anonymous';
      const key = rawKey.trim();
      const endpoint = req.originalUrl || req.url;

      // Hash the request body to detect payload mismatch
      const requestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(req.body || {}))
        .digest('hex');

      // Check existing key
      let record = await IdempotencyKey.findOne({ userId, key });

      if (record) {
        // Payload mismatch check: Replaying key with modified request payload
        if (record.requestHash !== requestHash) {
          return next(
            ApiError.conflict(
              'Idempotency key reuse violation: Key already used with a different request payload.'
            )
          );
        }

        // Concurrent in-flight request
        if (record.status === 'processing') {
          return next(
            ApiError.conflict(
              'A transaction with this idempotency key is currently processing. Please wait for completion.'
            )
          );
        }

        // Return cached response
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_HIT');
        res.status(record.statusCode || 200).json(record.responseBody);
        return;
      }

      // Claim key in processing state
      try {
        record = await IdempotencyKey.create({
          key,
          userId,
          endpoint,
          requestHash,
          status: 'processing',
        });
      } catch (insertErr: any) {
        // Race condition duplicate insert
        if (insertErr.code === 11000) {
          return next(
            ApiError.conflict(
              'Concurrent duplicate request detected with identical idempotency key.'
            )
          );
        }
        throw insertErr;
      }

      // Intercept response to store result
      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        const statusCode = res.statusCode;
        // Asynchronously mark completed and save response
        IdempotencyKey.updateOne(
          { _id: record._id },
          {
            $set: {
              status: 'completed',
              statusCode,
              responseBody: body,
            },
          }
        ).exec().catch((err) => console.error('Failed to cache idempotent response:', err));

        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
