import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/db.js';

const app = createApp();

describe('Backend API & Workflow Tests', () => {
  beforeAll(async () => {
    // Database is already seeded
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('Offline Field Issue Tracker');
  });

  it('GET /api/users should return simulated demo users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    const roles = res.body.data.map((u: any) => u.role);
    expect(roles).toContain('FIELD_WORKER');
    expect(roles).toContain('COORDINATOR');
  });

  it('GET /api/reports/stats should return dashboard metrics', async () => {
    const res = await request(app).get('/api/reports/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(5);
    expect(res.body.data.priorityDistribution).toBeDefined();
    expect(res.body.data.categoryDistribution).toBeDefined();
  });

  it('POST /api/reports should create a report with idempotency', async () => {
    const newReport = {
      id: 'a0000000-0000-0000-0000-000000000001',
      category: 'Water Supply',
      description: 'Test pipe burst at Central Station hydrant',
      location: 'Central Station Hydrant 4',
      priority: 'High',
      status: 'SUBMITTED',
      createdBy: 'usr-tech-001',
      reportedAt: new Date().toISOString(),
      version: 1,
    };

    const res1 = await request(app).post('/api/reports').send(newReport);
    expect(res1.status).toBe(201);
    expect(res1.body.data.id).toBe(newReport.id);

    // Resend same payload - should succeed idempotently
    const res2 = await request(app).post('/api/reports').send(newReport);
    expect(res2.status).toBe(201);
    expect(res2.body.data.id).toBe(newReport.id);
  });

  it('PATCH /api/reports/:id/status should reject invalid workflow transitions', async () => {
    // Attempt invalid transition: DRAFT or SUBMITTED -> RESOLVED directly without ASSIGNED/IN_PROGRESS
    const res = await request(app)
      .patch('/api/reports/9f8b4c21-7e3a-4a1d-b8d2-5a1e8c9f0003/status')
      .send({
        targetStatus: 'RESOLVED',
        actorId: 'usr-coord-001',
        resolutionNotes: 'Attempting invalid shortcut resolution',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid status transition');
  });

  it('PATCH /api/reports/:id/status should require rejection reason when rejecting', async () => {
    const res = await request(app)
      .patch('/api/reports/9f8b4c21-7e3a-4a1d-b8d2-5a1e8c9f0003/status')
      .send({
        targetStatus: 'REJECTED',
        actorId: 'usr-coord-001',
        // missing rejectionReason
      });

    expect(res.status).toBe(400); // Fails zod validation
  });

  it('POST /api/sync/reports should accept batch offline reports idempotently', async () => {
    const batchPayload = {
      reports: [
        {
          id: 'b0000000-0000-0000-0000-000000000002',
          category: 'Electricity',
          description: 'Fallen power line across secondary road in West Zone',
          location: 'West Zone Road 9',
          priority: 'Critical',
          status: 'SUBMITTED',
          syncStatus: 'PENDING',
          createdBy: 'usr-tech-001',
          reportedAt: new Date().toISOString(),
          version: 1,
        },
      ],
      clientTimestamp: new Date().toISOString(),
    };

    const res = await request(app).post('/api/sync/reports').send(batchPayload);
    expect(res.status).toBe(200);
    expect(res.body.data.processed).toBe(1);
    expect(res.body.data.results[0].status).toBe('synced');
  });
});

