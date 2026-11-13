import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export class UserController {
  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
      });
      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

export class ActivityController {
  static async getReportActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const activities = await prisma.activity.findMany({
        where: { reportId: req.params.id },
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, role: true, email: true },
          },
        },
      });
      return res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentActivities(_req: Request, res: Response, next: NextFunction) {
    try {
      const activities = await prisma.activity.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, role: true },
          },
          report: {
            select: { id: true, category: true, location: true, status: true },
          },
        },
      });
      return res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }
}

