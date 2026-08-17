const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('mobile HUD preserves both HP and MP without exposing the edition switch', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  assert.match(html, /id="v2-story-mp"/);
  assert.match(html, /id="v2-story-energy"/);
  assert.match(html, /id="v2-battle-player-mp"/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /#v2-shell\[data-theme="past"\] #v2-battle-practice\s*\{\s*display:\s*none/);
  assert.match(css, /\.v2-battle-command[\s\S]*overflow/);
});

test('edition and display controls live inside a compact settings panel', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const hud = html.slice(html.indexOf('<header class="v2-hud">'), html.indexOf('</header>') + 9);
  const settings = html.slice(html.indexOf('<section id="v2-settings"'), html.indexOf('</section>', html.indexOf('<section id="v2-settings"')) + 10);

  assert.doesNotMatch(hud, /data-edition=/);
  assert.match(hud, /id="v2-settings-toggle"/);
  assert.match(settings, /data-edition="modern"/);
  assert.match(settings, /data-edition="past"/);
  assert.match(settings, /id="v2-toggle-collision"/);
  assert.match(css, /\.v2-settings-toggle[^}]*background:\s*transparent/s);
  assert.match(runtime, /settingsToggle\.addEventListener\('click'/);
  assert.match(runtime, /setSettingsOpen/);
});

test('mobile battle cards show MP cost and disable unaffordable magic', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(runtime, /v2-card-mp-cost/);
  assert.match(runtime, /card\.mpCost/);
  assert.match(runtime, /remainingMp/);
});

test('the map accepts pointer dragging as a touch joystick on iPhone-sized screens', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /v2-input\.js\?edition=2/);
  assert.match(html, /v2\.js\?edition=2/);
  assert.match(html, /v2\.css\?edition=2/);
  assert.match(html, /id="v2-drag-guide"/);
  assert.match(css, /#v2-shell[^}]*touch-action:\s*none/s);
  assert.match(runtime, /shell\.addEventListener\('pointerdown'/);
  assert.match(runtime, /shell\.addEventListener\('pointermove'/);
  assert.match(runtime, /isMapDragOrigin/);
  assert.match(runtime, /dragMovementVector/);
});
