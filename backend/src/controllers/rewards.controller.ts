import { Request, Response } from 'express';
import { RewardsService } from '../services/rewards.service.js';

export class RewardsController {
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const data = await RewardsService.getOverview(userId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to fetch rewards overview',
      });
    }
  }

  static async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const result = await RewardsService.checkInDaily(userId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to check in',
      });
    }
  }

  static async claimMission(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { missionKey } = req.params;
      const result = await RewardsService.claimMission(userId, missionKey);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to claim mission reward',
      });
    }
  }

  static async openMysteryBox(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const result = await RewardsService.openMysteryBox(userId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to open mystery box',
      });
    }
  }

  static async claimAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const result = await RewardsService.claimAll(userId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to claim rewards',
      });
    }
  }
}
