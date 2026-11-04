import { readFile, mkdir, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const [html, css, code] = await Promise.all(['index.html','src/style.css','dist/game.js'].map(file=>readFile(new URL(file, root),'utf8')));
const notices = await readFile(new URL('THIRD_PARTY_NOTICES.md', root), 'utf8');
// A self-contained edition: no imports, server, network requests or external assets.
const output = html.replace(/<link rel="stylesheet" href="\.?\/?src\/style\.css">/,()=>`<style>${css}</style>`)
  .replace(/<script type="module" src="\.?\/?dist\/game\.js"><\/script>/,()=>`<script type="module">${code.replace(/<\/script/gi,'<\\/script')}</script>`)
  .replace('</head>', () => `<!--\n${notices.replace(/-->/g, '-- >')}\n-->\n</head>`)
  .replace(/href="\.?\/?" aria-label="Spins-BOX, início"/, 'href="" aria-label="Spins-BOX, início"');
await mkdir(new URL('dist/',root),{recursive:true});
await writeFile(new URL('dist/Spins-BOX.html',root),output);
console.log('Exportado: dist/Spins-BOX.html — abra diretamente no navegador.');
