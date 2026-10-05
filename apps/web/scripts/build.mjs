import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const appDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDirectory = join(appDirectory, 'public');
const outputDirectory = join(appDirectory, 'dist');
const apiBaseUrl = process.env.ERP_API_BASE_URL ?? '';

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(publicDirectory, outputDirectory, {
  recursive: true,
  filter: (source) => {
    const relativePath = relative(publicDirectory, source);
    return relativePath !== join('assets', 'build') &&
      !relativePath.startsWith(`${join('assets', 'build')}${sep}`);
  },
});

await build({
  entryPoints: [join(appDirectory, 'src', 'index.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outdir: join(outputDirectory, 'assets', 'build'),
  define: {
    __APTA_API_BASE_URL__: JSON.stringify(apiBaseUrl),
  },
});

console.log(`Web build written to ${outputDirectory}`);