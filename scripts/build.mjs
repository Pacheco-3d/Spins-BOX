import { build } from 'esbuild';
await build({
  absWorkingDir: new URL('../', import.meta.url).pathname,
  entryPoints: ['src/app.js'],
  outfile: 'dist/game.js',
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['es2022'],
  legalComments: 'inline',
});
console.log('3D compilado: dist/game.js');
