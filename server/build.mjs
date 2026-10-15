// Bundles the server into dist/index.js for production.
// Workspace packages (@english-office/*) ship as TypeScript sources, so they are bundled in;
// regular npm dependencies stay external and are loaded from node_modules at runtime.
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const external = Object.keys(pkg.dependencies ?? {}).filter((name) => !name.startsWith('@english-office/'));

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  external,
  logLevel: 'info',
});
