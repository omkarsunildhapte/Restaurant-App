import app from './app.js';
import { config } from '@config/env.config.js';
import { Logger } from '@utils/logger.utils.js';

app.listen(config.port, () => {
  Logger.info(`API (${config.appEnv}) listening on http://localhost:${config.port}`);
});
