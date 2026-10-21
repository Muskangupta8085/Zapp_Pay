import { AuditLog } from '../models/auditLog.model.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function logAdminAction(
  req: AuthenticatedRequest,
  action: string,
  targetResource: string,
  options?: {
    resourceId?: string;
    status?: 'Success' | 'Failed';
    details?: Record<string, any>;
  }
): Promise<void> {
  try {
    if (!req.user) return;
    const ipHeader = req.headers['x-forwarded-for'];
    const ipAddress = typeof ipHeader === 'string' ? ipHeader.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      adminId: req.user.userId,
      adminName: req.user.email ? req.user.email.split('@')[0] : 'Admin User',
      adminEmail: req.user.email || 'admin@zappay.com',
      adminRole: req.user.role,
      action,
      targetResource,
      resourceId: options?.resourceId,
      ipAddress,
      userAgent,
      status: options?.status || 'Success',
      details: options?.details,
    });
  } catch (err) {
    console.error('Failed to record admin audit log:', err);
  }
}
