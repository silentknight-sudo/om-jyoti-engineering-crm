import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app';

// Entry point for platforms that run a persistent Node process (Cloud Run,
// local dev via `bun run dev`, Railway, a plain VM, etc.). Vercel deploys
// this project differently — see api/[...slug].ts, which reuses the same
// Express app as a serverless function instead of calling listen() here.

// Cloud Run (and most such platforms) injects its own PORT env var and only
// routes traffic to that port — hardcoding 3000 here would make the app
// unreachable in production even though it starts up "successfully".
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Om Jyoti CRM backend running on http://localhost:${PORT}`);
  });
}

startServer();
