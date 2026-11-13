import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Clearing existing database tables...');
  await prisma.syncAttempt.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Creating demo users...');
  const worker1 = await prisma.user.create({
    data: {
      id: 'usr-tech-001',
      name: 'Tariq Al-Mansoor',
      email: 'tariq.mansoor@nilepixel.local',
      role: 'FIELD_WORKER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      id: 'usr-tech-002',
      name: 'Amina Yusuf',
      email: 'amina.yusuf@nilepixel.local',
      role: 'FIELD_WORKER',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    },
  });

  const coordinator1 = await prisma.user.create({
    data: {
      id: 'usr-coord-001',
      name: 'John Mwangi',
      email: 'john.mwangi@nilepixel.local',
      role: 'COORDINATOR',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
  });

  const coordinator2 = await prisma.user.create({
    data: {
      id: 'usr-coord-002',
      name: 'Sarah Chen',
      email: 'sarah.chen@nilepixel.local',
      role: 'COORDINATOR',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
  });

  console.log('[Seed] Seeding sample infrastructure reports...');

  // Report 1: Electricity transformer blowout (IN_PROGRESS)
  const rep1 = await prisma.report.create({
    data: {
      id: '9f8b4c21-7e3a-4a1d-b8d2-5a1e8c9f0001',
      category: 'Electricity',
      description: 'Distribution transformer blowout affecting Industrial Zone substation B. Sparks observed, oil leaking from secondary cooling radiator.',
      location: 'Substation B-12, Sector 4 Industrial Park, East Nile',
      latitude: 15.5527,
      longitude: 32.5322,
      priority: 'Critical',
      status: 'IN_PROGRESS',
      syncStatus: 'SYNCHRONIZED',
      createdBy: worker1.id,
      assignedTo: worker2.id,
      reportedAt: new Date(Date.now() - 4 * 3600 * 1000), // 4 hours ago
      version: 3,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        reportId: rep1.id,
        activityType: 'CREATED',
        description: 'Report created by Field Worker Tariq Al-Mansoor',
        actorId: worker1.id,
        createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      },
      {
        reportId: rep1.id,
        activityType: 'SUBMITTED',
        description: 'Submitted to regional coordination center',
        actorId: worker1.id,
        createdAt: new Date(Date.now() - 3.8 * 3600 * 1000),
      },
      {
        reportId: rep1.id,
        activityType: 'ASSIGNED',
        description: `Assigned to Senior Technician Amina Yusuf by John Mwangi`,
        actorId: coordinator1.id,
        createdAt: new Date(Date.now() - 3 * 3600 * 1000),
      },
      {
        reportId: rep1.id,
        activityType: 'STATUS_CHANGED',
        description: 'Status updated to IN_PROGRESS: Technicians arrived on-site with backup power generator and replacement bushings.',
        actorId: worker2.id,
        createdAt: new Date(Date.now() - 1.5 * 3600 * 1000),
      },
    ],
  });

  // Report 2: Water Supply Main burst (ASSIGNED)
  const rep2 = await prisma.report.create({
    data: {
      id: '9f8b4c21-7e3a-4a1d-b8d2-5a1e8c9f0002',
      category: 'Water Supply',
      description: 'High-pressure water main pipeline fracture near pumping station #3. Low water pressure affecting 4,000 residents in North Sector.',
      location: 'Pipeline Junction 14, Pumping Station 3, North Sector',
      latitude: 15.5921,
      longitude: 32.5401,
      priority: 'High',
      status: 'ASSIGNED',
      syncStatus: 'SYNCHRONIZED',
      createdBy: worker2.id,
      assignedTo: worker1.id,
      reportedAt: new Date(Date.now() - 6 * 3600 * 1000),
      version: 2,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        reportId: rep2.id,
        activityType: 'CREATED',
        description: 'Report created by Field Worker Amina Yusuf',
        actorId: worker2.id,
        createdAt: new Date(Date.now() - 6 * 3600 * 1000),
      },
      {
        reportId: rep2.id,
        activityType: 'SUBMITTED',
        description: 'Synchronized from offline device and submitted to queue',
        actorId: worker2.id,
        createdAt: new Date(Date.now() - 5.5 * 3600 * 1000),
      },
      {
        reportId: rep2.id,
        activityType: 'ASSIGNED',
        description: 'Assigned to technician Tariq Al-Mansoor by Coordinator Sarah Chen',
        actorId: coordinator2.id,
        createdAt: new Date(Date.now() - 4.5 * 3600 * 1000),
      },
    ],
  });

  // Report 3: Roads sinkhole (SUBMITTED)
  const rep3 = await prisma.report.create({
    data: {
      id: '9f8b4c21-7e3a-4a1d-b8d2-5a1e8c9f0003',
      category: 'Roads and Transportation',
      description: 'Dangerous depression and sinkhole forming on right lane of Ring Road overpass after heavy stormwater runoff.',
      location: 'Ring Road km 18, Southbound Overpass',
      latitude: 15.5204,
      longitude: 32.4988,
      priority: 'Critical',
      status: 'SUBMITTED',
      syncStatus: 'SYNCHRONIZED',
      createdBy: worker1.id,
      reportedAt: new Date(Date.now() - 1 * 3600 * 1000),
      version: 1,
    },
  });

  await prisma.activity.create({
    data: {
      reportId: rep3.id,
      activityType: 'SUBMITTED',
      description: 'Report submitted by Tariq Al-Mansoor via mobile client',
      actorId: worker1.id,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000),
    },
  });

  // Report 4: Healthcare generator failure (RESOLVED)
  const rep4 = await prisma.report.create({
    data: {
      id: '9f8b4c21-7e3a-4a1d-b8d2-5a1e8c9f0004',
      category: 'Healthcare Infrastructure',
      description: 'Backup diesel generator for ICU ward failed automatic transfer switch test during scheduled load inspection.',
      location: 'Al-Amal District Children Hospital, Service Bay 2',
      latitude: 15.5678,
      longitude: 32.5211,
      priority: 'Critical',
      status: 'RESOLVED',
      syncStatus: 'SYNCHRONIZED',
      createdBy: worker2.id,
      assignedTo: worker1.id,
      resolutionNotes: 'Replaced faulty relay in automatic transfer switch, cleaned fuel injectors, and completed full 45-minute continuous load test.',
      reportedAt: new Date(Date.now() - 24 * 3600 * 1000),
      version: 4,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        reportId: rep4.id,
        activityType: 'SUBMITTED',
        description: 'Emergency report submitted',
        actorId: worker2.id,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        reportId: rep4.id,
        activityType: 'ASSIGNED',
        description: 'Priority assigned to Tariq Al-Mansoor',
        actorId: coordinator1.id,
        createdAt: new Date(Date.now() - 23 * 3600 * 1000),
      },
      {
        reportId: rep4.id,
        activityType: 'STATUS_CHANGED',
        description: 'Maintenance started on-site',
        actorId: worker1.id,
        createdAt: new Date(Date.now() - 20 * 3600 * 1000),
      },
      {
        reportId: rep4.id,
        activityType: 'RESOLVED',
        description: 'Issue marked resolved by John Mwangi after validation',
        actorId: coordinator1.id,
        createdAt: new Date(Date.now() - 18 * 3600 * 1000),
      },
    ],
  });

  // Report 5: Public safety guardrail (REJECTED)
  const rep5 = await prisma.report.create({
    data: {
      id: '9f8b4c21-7e3a-4a1d-b8d2-5a1e8c9f0005',
      category: 'Public Safety',
      description: 'Damaged guardrail along canal bridge embankment.',
      location: 'Canal Crossing Bridge 7',
      priority: 'Low',
      status: 'REJECTED',
      syncStatus: 'SYNCHRONIZED',
      createdBy: worker1.id,
      rejectionReason: 'Duplicate submission of already scheduled municipal project #CIVIC-8921. Work already underway by Dept of Highways.',
      reportedAt: new Date(Date.now() - 12 * 3600 * 1000),
      version: 2,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        reportId: rep5.id,
        activityType: 'SUBMITTED',
        description: 'Report submitted by Tariq Al-Mansoor',
        actorId: worker1.id,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
      },
      {
        reportId: rep5.id,
        activityType: 'REJECTED',
        description: 'Report rejected by Sarah Chen: Duplicate submission of civic project #CIVIC-8921',
        actorId: coordinator2.id,
        createdAt: new Date(Date.now() - 10 * 3600 * 1000),
      },
    ],
  });

  // Create initial sync attempts telemetry
  await prisma.syncAttempt.createMany({
    data: [
      {
        reportId: rep1.id,
        attemptNumber: 1,
        result: 'SUCCESS',
        clientPayload: JSON.stringify({ id: rep1.id, category: rep1.category }),
        attemptedAt: new Date(Date.now() - 3.8 * 3600 * 1000),
      },
      {
        reportId: rep2.id,
        attemptNumber: 1,
        result: 'FAILED',
        errorMessage: 'Connection timed out during peak cell tower congestion',
        attemptedAt: new Date(Date.now() - 5.8 * 3600 * 1000),
      },
      {
        reportId: rep2.id,
        attemptNumber: 2,
        result: 'SUCCESS',
        clientPayload: JSON.stringify({ id: rep2.id, category: rep2.category }),
        attemptedAt: new Date(Date.now() - 5.5 * 3600 * 1000),
      },
      {
        reportId: rep3.id,
        attemptNumber: 1,
        result: 'SUCCESS',
        attemptedAt: new Date(Date.now() - 1 * 3600 * 1000),
      },
    ],
  });

  console.log('[Seed] Database successfully populated with realistic demo records!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
