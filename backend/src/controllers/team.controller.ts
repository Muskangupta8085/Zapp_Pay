import { Request, Response } from 'express';
import { TeamService } from '../services/team.service.js';

export class TeamController {
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const data = await TeamService.getTeamOverview(userId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve team data',
      });
    }
  }

  static async claimCommission(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const result = await TeamService.claimCommission(userId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to claim affiliate commission',
      });
    }
  }

  static async boostMember(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { memberId } = req.params;
      const result = await TeamService.boostMember(userId, memberId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to boost team member',
      });
    }
  }
}
