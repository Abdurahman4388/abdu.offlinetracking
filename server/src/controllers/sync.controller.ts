import { Request, Response, NextFunction } from 'express';
import { SyncService } from '../services/sync.service.js';

export class SyncController {
  static async syncBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { reports } = req.body;
      const result = await SyncService.processBatchSync(reports);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTelemetry(_req: Request, res: Response, next: NextFunction) {
    try {
      const telemetry = await SyncService.getSyncTelemetry();
      return res.status(200).json({
        success: true,
        data: telemetry,
      });
    } catch (error) {
      next(error);
    }
  }
}

