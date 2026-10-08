// Vercel serverless entry point. Vercel deploys everything under /api as
// individual serverless functions rather than running a persistent Node
// process, so this does NOT call app.listen() — it reuses the same Express
// app as server.ts (the entry used by platforms that do run a persistent
// process, e.g. Cloud Run) and hands it directly to Vercel's Node runtime.
// An Express app is already a valid (req, res) request handler, so no
// wrapping is needed. The `[...slug]` catch-all filename makes Vercel route
// every /api/* request here, matching the app's own /api/v1/* routes.
import { app } from '../server/app';

export default app;
