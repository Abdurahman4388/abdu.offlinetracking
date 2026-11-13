import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import {
  createReportSchema,
  statusTransitionSchema,
  assignReportSchema,
} from '@offline-tracker/shared';

const router = Router();

// Statistics route before :id parameter
router.get('/stats', ReportController.stats);

// Standard CRUD
router.get('/', ReportController.list);
router.get('/:id', ReportController.getById);
router.post('/', validateBody(createReportSchema), ReportController.create);
router.put('/:id', ReportController.update);
router.delete('/:id', ReportController.delete);

// Workflow state transition & assignment
router.patch('/:id/status', validateBody(statusTransitionSchema), ReportController.updateStatus);
router.patch('/:id/assign', validateBody(assignReportSchema), ReportController.assign);

export default router;

