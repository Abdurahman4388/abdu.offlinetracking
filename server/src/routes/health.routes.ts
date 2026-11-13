import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Offline Field Issue Tracker API',
    version: '1.0.0',
    mode: 'online',
  });
});

export default router;
