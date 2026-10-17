import { Request, Response } from 'express';
import { HomeService } from '../services/home.service.js';

export class HomeController {
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const data = await HomeService.getDashboard(userId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to load home dashboard' });
    }
  }

  static async getTickers(_req: Request, res: Response): Promise<void> {
    try {
      const { tickers } = await HomeService.getDashboard();
      res.status(200).json({ success: true, data: tickers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to load tickers' });
    }
  }

  static async getNetworkStatus(_req: Request, res: Response): Promise<void> {
    try {
      const { networkStatus } = await HomeService.getDashboard();
      res.status(200).json({ success: true, data: networkStatus });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to load network status' });
    }
  }

  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const unreadOnly = req.query.unread === 'true';
      const data = await HomeService.getNotifications(userId, unreadOnly);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch notifications' });
    }
  }

  static async markNotificationRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      const updated = await HomeService.markNotificationRead(userId, id);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update notification' });
    }
  }

  static async markAllNotificationsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      await HomeService.markAllNotificationsRead(userId);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to mark all as read' });
    }
  }
}
