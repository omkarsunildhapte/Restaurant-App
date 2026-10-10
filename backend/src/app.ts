import express, { type Application } from 'express';
import { corsMiddleware } from '@config/cors.config.js';
import { RouteManager } from '@config/router.config.js';
import { errorMiddleware } from '@middleware/error.middleware.js';

/** The Express app without a listening socket, so tests can run it on a random port. */
const app: Application = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(corsMiddleware);

RouteManager.register(app);

app.use(errorMiddleware);

export default app;
