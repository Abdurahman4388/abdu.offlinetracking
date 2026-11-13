import { z } from 'zod';
import {
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
  SYNC_STATUSES,
} from '../constants/index.js';

export const createReportSchema = z.object({
  id: z.string().uuid({ message: 'Report ID must be a valid UUID' }),
  category: z.enum(REPORT_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid infrastructure category' }),
  }),
  description: z
    .string()
    .min(5, { message: 'Description must be at least 5 characters long' })
    .max(2000, { message: 'Description cannot exceed 2000 characters' }),
  location: z
    .string()
    .min(3, { message: 'Location must be at least 3 characters long' })
    .max(255, { message: 'Location cannot exceed 255 characters' }),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  priority: z.enum(REPORT_PRIORITIES, {
    errorMap: () => ({ message: 'Please select a valid priority level' }),
  }),
  status: z.enum(REPORT_STATUSES).default('DRAFT'),
  syncStatus: z.enum(SYNC_STATUSES).default('PENDING'),
  imageUrl: z.string().nullable().optional(),
  createdBy: z.string().min(1, { message: 'Creator ID is required' }),
  reportedAt: z.string().datetime({ offset: true }).or(z.string().min(10)),
  version: z.number().int().positive().default(1),
});

export const updateReportSchema = createReportSchema.partial().omit({ id: true });

export const statusTransitionSchema = z.object({
  targetStatus: z.enum(REPORT_STATUSES),
  actorId: z.string().min(1, { message: 'Actor ID is required' }),
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters').optional(),
  resolutionNotes: z.string().min(5, 'Resolution notes must be at least 5 characters').optional(),
  reopenReason: z.string().min(5, 'Reopen reason must be at least 5 characters').optional(),
}).refine((data) => {
  if (data.targetStatus === 'REJECTED' && !data.rejectionReason) {
    return false;
  }
  if (data.targetStatus === 'RESOLVED' && !data.resolutionNotes) {
    return false;
  }
  return true;
}, {
  message: 'Appropriate documentation (notes/reason) is required for this status change',
});

export const assignReportSchema = z.object({
  assignedTo: z.string().min(1, { message: 'Technician/Assignee ID is required' }),
  actorId: z.string().min(1, { message: 'Actor ID is required' }),
});

export const batchSyncSchema = z.object({
  reports: z.array(createReportSchema),
  clientTimestamp: z.string().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type AssignReportInput = z.infer<typeof assignReportSchema>;
export type BatchSyncInput = z.infer<typeof batchSyncSchema>;

