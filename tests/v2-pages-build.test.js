const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildPagesSite } = require('../scripts/build-pages-site.js');

test('Pages build contains the playable game without authoring source assets', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'roppongi-pages-'));
  const output = path.join(temporaryRoot, 'site');

  try {
    buildPagesSite(output);
    for (const required of [
      'index.html',
      'v2.html',
      'v2.js',
      'v2-supabase-config.public.js',
      'assets/v2/map-layout-data.js',
      'assets/v2/day-runtime-tiles/0-0.png',
      'assets/v2/past-evening-runtime-tiles/0-0.png',
      'assets/v2/past-evening-runtime-tiles/0-1.png',
      'assets/v2/past-evening-runtime-tiles/1-0.png',
      'assets/v2/past-evening-runtime-tiles/1-1.png',
      'assets/v2/landmarks/roppongi-hills.png',
      'assets/v2/past-scenes/castle-interior.png',
      'assets/v2/past-scenes/mist-citadel.png',
      'assets/v2/past-scenes/voyage-intro.png',
      'assets/v2/past-scenes/watchtower-discovery.png',
      'assets/v2/past-events/father-compass.png',
      'assets/v2/past-events/star-crest.png',
      'assets/v2/past-events/watergate-closed.png',
      'assets/v2/past-events/watergate-open.png',
      'assets/v2/past-events/compass-altar-corrupted.png',
      'assets/v2/past-events/compass-altar-restored.png'
    ]) assert.equal(fs.existsSync(path.join(output, required)), true, required);

    for (const forbidden of [
      'package.json',
      'supabase',
      'tests',
      'assets/v2/PAST_ASSET_PROMPTS.md',
      'assets/v2/past-events/harbor-setpiece-source.png',
      'assets/v2/past-events/harbor-pier-source.png',
      'assets/v2/past-events/harbor-ship-source.png',
      'assets/v2/past-events/harbor-lighthouse-source.png',
      'assets/v2/osm-road-source.json',
      'assets/v2/landmarks/roppongi-hills-source.png'
    ]) assert.equal(fs.existsSync(path.join(output, forbidden)), false, forbidden);

    for (const htmlFile of ['index.html', 'v2.html']) {
      const html = fs.readFileSync(path.join(output, htmlFile), 'utf8');
      const references = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), match => match[1]);
      for (const reference of references) {
        if (/^(?:https?:|#)/.test(reference)) continue;
        const localPath = reference.split(/[?#]/, 1)[0];
        assert.equal(fs.existsSync(path.join(output, localPath)), true, `${htmlFile}: ${localPath}`);
      }
    }

    const pending = [output];
    while (pending.length) {
      const directory = pending.pop();
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) pending.push(fullPath);
        else assert.match(entry.name, /^(?:\.nojekyll|.+\.(?:css|html|js|png))$/, fullPath);
      }
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
