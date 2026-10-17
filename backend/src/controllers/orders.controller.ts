import { Request, Response } from 'express';
import { OrdersService } from '../services/orders.service.js';

export class OrdersController {
  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status, type, asset, search, limit, page } = req.query;

      const result = await OrdersService.getOrders(userId, {
        status: status as string,
        type: type as string,
        asset: asset as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        page: page ? parseInt(page as string, 10) : 1,
      });

      res.status(200).json({
        success: true,
        data: result.orders,
        total: result.total,
        summary: result.summary,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve orders',
      });
    }
  }

  static async getOrderDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const order = await OrdersService.getOrderById(userId, id);
      res.status(200).json({ success: true, data: order });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve order details',
      });
    }
  }

  static async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const result = await OrdersService.cancelOrder(userId, id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to cancel order',
      });
    }
  }

  static async exportOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const format = (req.body.format || req.query.format || 'PDF') as 'PDF' | 'CSV';
      const range = (req.body.range || req.query.range || 'all') as string;

      const exportData = await OrdersService.exportOrders(userId, format, range);
      res.status(200).json({
        success: true,
        message: `Statement generated in ${format} format for ${range}`,
        data: exportData,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to export orders',
      });
    }
  }
}
