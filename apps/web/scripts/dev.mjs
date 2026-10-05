import { context } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const apiBaseUrl = process.env.ERP_API_BASE_URL ?? '';
const port = Number(process.env.WEB_PORT ?? 3001);
const host = '127.0.0.1';

const server = await context({
  entryPoints: [join(appDirectory, 'src', 'index.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outdir: join(appDirectory, 'public', 'assets', 'build'),
  define: {
    __APTA_API_BASE_URL__: JSON.stringify(apiBaseUrl),
  },
});

await server.serve({
  host,
  port,
  servedir: join(appDirectory, 'public'),
});

console.info(`Web app running at http://${host}:${port}`);