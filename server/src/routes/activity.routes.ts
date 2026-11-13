import { Router } from 'express';
import { ActivityController } from '../controllers/user.controller.js';

const router = Router();

router.get('/recent', ActivityController.getRecentActivities);
router.get('/reports/:id', ActivityController.getReportActivities);

export default router;
