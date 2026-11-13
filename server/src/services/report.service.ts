import { prisma } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  CreateReportInput,
  ReportFilterOptions,
  DashboardStats,
  REPORT_PRIORITIES,
  REPORT_CATEGORIES,
  ReportPriority,
  ReportCategory,
} from '@offline-tracker/shared';

export class ReportService {
  /**
   * Retrieve filtered & paginated reports
   */
  static async getAllReports(filters: ReportFilterOptions) {
    const {
      category,
      priority,
      status,
      syncStatus,
      assignedTo,
      createdBy,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (category && category !== 'ALL') where.category = category;
    if (priority && priority !== 'ALL') where.priority = priority;
    if (status && status !== 'ALL') where.status = status;
    if (syncStatus && syncStatus !== 'ALL') where.syncStatus = syncStatus;
    if (assignedTo && assignedTo !== 'ALL') where.assignedTo = assignedTo;
    if (createdBy) where.createdBy = createdBy;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { description: { contains: q } },
        { location: { contains: q } },
        { category: { contains: q } },
        { id: { contains: q } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { reportedAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, role: true, email: true } },
          assignee: { select: { id: true, name: true, role: true, email: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    };
  }

  /**
   * Retrieve report by ID with full relations
   */
  static async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        creator: true,
        assignee: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
        syncAttempts: {
          orderBy: { attemptedAt: 'desc' },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    return report;
  }

  /**
   * Create a report with idempotency check
   */
  static async createReport(data: CreateReportInput) {
    const existing = await prisma.report.findUnique({
      where: { id: data.id },
    });

    if (existing) {
      return existing; // Idempotent return
    }

    return await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          id: data.id,
          category: data.category,
          description: data.description,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          priority: data.priority,
          status: data.status || 'DRAFT',
          syncStatus: 'SYNCHRONIZED', // It has reached the server
          imageUrl: data.imageUrl,
          createdBy: data.createdBy,
          reportedAt: new Date(data.reportedAt),
          version: data.version || 1,
        },
        include: {
          creator: true,
          assignee: true,
        },
      });

      await tx.activity.create({
        data: {
          reportId: report.id,
          activityType: report.status === 'SUBMITTED' ? 'SUBMITTED' : 'CREATED',
          description:
            report.status === 'SUBMITTED'
              ? `Report submitted for ${report.category} at ${report.location}`
              : `Draft created for ${report.category}`,
          actorId: data.createdBy,
        },
      });

      return report;
    });
  }

  /**
   * Update report (allowed in DRAFT or pending coordination)
   */
  static async updateReport(id: string, data: Partial<CreateReportInput>, actorId: string) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new AppError('Report not found', 404);
    }

    if (report.status !== 'DRAFT' && report.status !== 'SUBMITTED') {
      throw new AppError('Only DRAFT or SUBMITTED reports can be edited directly', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id },
        data: {
          category: data.category ?? report.category,
          description: data.description ?? report.description,
          location: data.location ?? report.location,
          priority: data.priority ?? report.priority,
          imageUrl: data.imageUrl ?? report.imageUrl,
          version: { increment: 1 },
        },
        include: {
          creator: true,
          assignee: true,
        },
      });

      await tx.activity.create({
        data: {
          reportId: id,
          activityType: 'EDITED',
          description: `Report details updated`,
          actorId,
        },
      });

      return updated;
    });
  }

  /**
   * Delete report (only permitted for DRAFT)
   */
  static async deleteReport(id: string, actorId: string) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new AppError('Report not found', 404);
    }

    if (report.status !== 'DRAFT') {
      throw new AppError('Only DRAFT reports can be deleted', 400);
    }

    if (report.createdBy !== actorId) {
      throw new AppError('You can only delete your own draft reports', 403);
    }

    await prisma.report.delete({ where: { id } });
    return { success: true, message: 'Draft deleted successfully' };
  }

  /**
   * Get aggregated dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const [
      total,
      draft,
      submitted,
      assigned,
      inProgress,
      resolved,
      rejected,
      byPriority,
      byCategory,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'DRAFT' } }),
      prisma.report.count({ where: { status: 'SUBMITTED' } }),
      prisma.report.count({ where: { status: 'ASSIGNED' } }),
      prisma.report.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'REJECTED' } }),
      prisma.report.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      prisma.report.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
    ]);

    const priorityDistribution: Record<ReportPriority, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    for (const item of byPriority) {
      if (item.priority in priorityDistribution) {
        priorityDistribution[item.priority as ReportPriority] = item._count.priority;
      }
    }

    const categoryDistribution: Record<ReportCategory, number> = {} as any;
    for (const cat of REPORT_CATEGORIES) {
      categoryDistribution[cat] = 0;
    }
    for (const item of byCategory) {
      if (item.category in categoryDistribution) {
        categoryDistribution[item.category as ReportCategory] = item._count.category;
      }
    }

    return {
      total,
      draft,
      submitted,
      assigned,
      inProgress,
      resolved,
      rejected,
      pendingSync: 0, // Server knows all synced records
      failedSync: 0,
      priorityDistribution,
      categoryDistribution,
    };
  }
}

