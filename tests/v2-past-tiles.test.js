const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function pngDimensions(file) {
  const png = fs.readFileSync(file);
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

test('past runtime tiles were generated from the final road-composited map', () => {
  const manifest = JSON.parse(fs.readFileSync('assets/v2/past-evening-runtime-tiles/manifest.json', 'utf8'));

  assert.equal(manifest.source, 'assets/v2/roppongi-roads-past-evening.png');
  assert.equal(sha256(manifest.source), manifest.sourceSha256);
  assert.deepEqual(Object.keys(manifest.tiles).sort(), ['0-0.png', '0-1.png', '1-0.png', '1-1.png']);
  for (const [filename, expectedHash] of Object.entries(manifest.tiles)) {
    const tile = path.join('assets/v2/past-evening-runtime-tiles', filename);
    assert.equal(sha256(tile), expectedHash, filename);
    assert.deepEqual(pngDimensions(tile), [3010, 2090], `${filename} must be an equal quadrant`);
  }

  const builder = fs.readFileSync('tools/build-v2-geographic-map.py', 'utf8');
  assert.match(builder, /build_runtime_tiles\(PAST_MAP_PATH/);
});

test('past tile and runtime scripts use the current cache versions', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  assert.match(html, /v2-editions\.js\?edition=4/);
  assert.match(html, /v2\.js\?edition=18/);
});
