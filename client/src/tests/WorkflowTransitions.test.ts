import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS,
  ReportStatus,
} from '@offline-tracker/shared';

describe('Workflow State Machine Transition Rules', () => {
  it('should allow DRAFT -> SUBMITTED', () => {
    expect(isValidStatusTransition('DRAFT', 'SUBMITTED')).toBe(true);
  });

  it('should disallow invalid transitions from DRAFT', () => {
    const invalidFromDraft: ReportStatus[] = [
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
      'REJECTED',
    ];
    for (const target of invalidFromDraft) {
      expect(isValidStatusTransition('DRAFT', target)).toBe(false);
    }
  });

  it('should allow SUBMITTED -> ASSIGNED and SUBMITTED -> REJECTED', () => {
    expect(isValidStatusTransition('SUBMITTED', 'ASSIGNED')).toBe(true);
    expect(isValidStatusTransition('SUBMITTED', 'REJECTED')).toBe(true);
  });

  it('should disallow skipping straight to RESOLVED from SUBMITTED', () => {
    expect(isValidStatusTransition('SUBMITTED', 'RESOLVED')).toBe(false);
  });

  it('should allow ASSIGNED -> IN_PROGRESS and ASSIGNED -> REJECTED', () => {
    expect(isValidStatusTransition('ASSIGNED', 'IN_PROGRESS')).toBe(true);
    expect(isValidStatusTransition('ASSIGNED', 'REJECTED')).toBe(true);
  });

  it('should allow IN_PROGRESS -> RESOLVED', () => {
    expect(isValidStatusTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
  });

  it('should allow RESOLVED -> ASSIGNED (Reopen transition)', () => {
    expect(isValidStatusTransition('RESOLVED', 'ASSIGNED')).toBe(true);
  });

  it('should treat REJECTED as a terminal state with no next transitions', () => {
    const allStatuses: ReportStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
    ];
    for (const target of allStatuses) {
      expect(isValidStatusTransition('REJECTED', target)).toBe(false);
    }
    expect(VALID_STATUS_TRANSITIONS.REJECTED.length).toBe(0);
  });
});

