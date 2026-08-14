const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('mobile HUD exposes compact controls and both HP and MP', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  assert.match(html, /id="v2-story-mp"/);
  assert.match(html, /id="v2-story-energy"/);
  assert.match(html, /id="v2-battle-player-mp"/);
  assert.match(html, /class="v2-label-compact"/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /\.v2-label-full\s*\{\s*display:\s*none/);
  assert.match(css, /#v2-shell\[data-theme="past"\] #v2-battle-practice\s*\{\s*display:\s*none/);
  assert.match(css, /\.v2-battle-command[\s\S]*overflow/);
});

test('mobile battle cards show MP cost and disable unaffordable magic', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(runtime, /v2-card-mp-cost/);
  assert.match(runtime, /card\.mpCost/);
  assert.match(runtime, /remainingMp/);
});
