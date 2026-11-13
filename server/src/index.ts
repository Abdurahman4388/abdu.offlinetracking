import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`[Offline Field Issue Tracker API] Running at http://localhost:${config.port}`);
  console.log(`[Environment] ${config.nodeEnv}`);
});

