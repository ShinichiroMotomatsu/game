const path = require('node:path');
const fs = require('node:fs');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '..');

buildSync({
  entryPoints: [path.join(root, 'src', 'v2-supabase-bundle.js')],
  outfile: path.join(root, 'v2-supabase-bundle.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser'
});

const output = path.join(root, 'v2-supabase-bundle.js');
fs.writeFileSync(output, fs.readFileSync(output, 'utf8').replace(/[ \t]+$/gm, ''));
