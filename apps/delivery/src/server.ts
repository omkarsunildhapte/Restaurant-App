import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { SERVER } from '@constants/server.constants';

const browserDistFolder = join(import.meta.dirname, SERVER.BROWSER_DIST);

/**
 * Host headers the SSR engine accepts (SSRF protection): comma-separated NG_ALLOWED_HOSTS, e.g.
 * NG_ALLOWED_HOSTS=delivery.example.com,delivery-staging.example.com. Merged with
 * security.allowedHosts in angular.json.
 */
const allowedHosts = (process.env[SERVER.ALLOWED_HOSTS_ENV] ?? SERVER.DEFAULT_ALLOWED_HOSTS)
  .split(SERVER.ALLOWED_HOSTS_SEPARATOR)
  .map((host) => host.trim())
  .filter(Boolean);

const app = express();
const angularApp = new AngularNodeAppEngine({ allowedHosts });

/** Static files from /browser (content-hashed, so long-lived caching is safe). */
app.use(express.static(browserDistFolder, { maxAge: SERVER.STATIC_MAX_AGE, index: false, redirect: false }));

/** Everything else is rendered by Angular. */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/** Starts the server when run directly (or under PM2) on PORT, default 4003 (4000 is the API). */
if (isMainModule(import.meta.url) || process.env[SERVER.PM2_ENV]) {
  const port = process.env[SERVER.PORT_ENV] || SERVER.DEFAULT_PORT;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/** Request handler used by the Angular CLI (dev-server and build). */
export const reqHandler = createNodeRequestHandler(app);
