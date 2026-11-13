import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { batchSyncSchema } from '@offline-tracker/shared';

const router = Router();

router.post('/reports', validateBody(batchSyncSchema), SyncController.syncBatch);
router.get('/status', SyncController.getTelemetry);

export default router;

