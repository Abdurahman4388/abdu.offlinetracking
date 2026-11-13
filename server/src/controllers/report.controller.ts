import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';
import { WorkflowService } from '../services/workflow.service.js';

export class ReportController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReportService.getAllReports(req.query as any);
      return res.status(200).json({
        success: true,
        data: result.reports,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getReportById(req.params.id);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.createReport(req.body);
      return res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.body.actorId || req.body.createdBy;
      const report = await ReportService.updateReport(req.params.id, req.body, actorId);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = (req.query.actorId as string) || (req.headers['x-actor-id'] as string);
      const result = await ReportService.deleteReport(req.params.id, actorId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async stats(_req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await ReportService.getDashboardStats();
      return res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await WorkflowService.transitionStatus(req.params.id, {
        targetStatus: req.body.targetStatus,
        actorId: req.body.actorId,
        rejectionReason: req.body.rejectionReason,
        resolutionNotes: req.body.resolutionNotes,
        reopenReason: req.body.reopenReason,
      });
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await WorkflowService.assignReport(
        req.params.id,
        req.body.assignedTo,
        req.body.actorId
      );
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
