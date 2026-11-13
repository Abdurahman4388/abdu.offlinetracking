import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import reportRoutes from './routes/report.routes.js';
import syncRoutes from './routes/sync.routes.js';
import userRoutes from './routes/user.routes.js';
import activityRoutes from './routes/activity.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/activities', activityRoutes);

  // Fallback 404 handler for unknown API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

