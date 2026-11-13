import { describe, it, expect } from 'vitest';
import {
  createReportSchema,
  statusTransitionSchema,
  batchSyncSchema,
} from '@offline-tracker/shared';

describe('Data Validation & Schema Engine', () => {
  const validReport = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    category: 'Water Supply',
    description: 'Main pump station flange fracture with high pressure spray',
    location: 'North Zone Pumping Station 2',
    priority: 'High',
    status: 'SUBMITTED',
    syncStatus: 'PENDING',
    createdBy: 'usr-tech-001',
    reportedAt: new Date().toISOString(),
    version: 1,
  };

  it('should validate a valid infrastructure report payload', () => {
    const result = createReportSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it('should reject reports with short or empty descriptions', () => {
    const invalid = { ...validReport, description: 'Fix' };
    const result = createReportSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 5 characters');
    }
  });

  it('should reject reports with short location strings', () => {
    const invalid = { ...validReport, location: 'ab' };
    const result = createReportSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 3 characters');
    }
  });

  it('should reject invalid infrastructure categories', () => {
    const invalid = { ...validReport, category: 'Alien Invasion' };
    const result = createReportSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid priorities', () => {
    const invalid = { ...validReport, priority: 'UltraUrgent' };
    const result = createReportSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should require a rejectionReason when transitioning to REJECTED', () => {
    const invalidTransition = {
      targetStatus: 'REJECTED',
      actorId: 'usr-coord-001',
      // missing rejectionReason
    };
    const result = statusTransitionSchema.safeParse(invalidTransition);
    expect(result.success).toBe(false);

    const validTransition = {
      targetStatus: 'REJECTED',
      actorId: 'usr-coord-001',
      rejectionReason: 'Duplicate entry of public works ticket #501',
    };
    expect(statusTransitionSchema.safeParse(validTransition).success).toBe(true);
  });

  it('should require resolutionNotes when transitioning to RESOLVED', () => {
    const invalidTransition = {
      targetStatus: 'RESOLVED',
      actorId: 'usr-coord-001',
    };
    expect(statusTransitionSchema.safeParse(invalidTransition).success).toBe(false);

    const validTransition = {
      targetStatus: 'RESOLVED',
      actorId: 'usr-coord-001',
      resolutionNotes: 'Replaced electrical fuse and completed grounding test',
    };
    expect(statusTransitionSchema.safeParse(validTransition).success).toBe(true);
  });

  it('should validate batch synchronization payloads', () => {
    const batch = {
      reports: [validReport],
      clientTimestamp: new Date().toISOString(),
    };
    const result = batchSyncSchema.safeParse(batch);
    expect(result.success).toBe(true);
  });
});
