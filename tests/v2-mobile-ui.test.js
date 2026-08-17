const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('mobile status preserves both HP and MP without a top HUD panel', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  assert.match(html, /id="v2-story-mp"/);
  assert.match(html, /id="v2-story-energy"/);
  assert.match(html, /id="v2-battle-player-mp"/);
  assert.doesNotMatch(html, /class="v2-hud"/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /#v2-shell\[data-theme="past"\] #v2-battle-practice\s*\{\s*display:\s*none/);
  assert.match(css, /\.v2-battle-command[\s\S]*overflow/);
});

test('edition and display controls live inside a compact settings panel', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const floatingControls = html.slice(html.indexOf('<div class="v2-floating-controls"'), html.indexOf('</div>', html.indexOf('<div class="v2-floating-controls"')) + 6);
  const settings = html.slice(html.indexOf('<section id="v2-settings"'), html.indexOf('</section>', html.indexOf('<section id="v2-settings"')) + 10);

  assert.doesNotMatch(floatingControls, /data-edition=/);
  assert.match(floatingControls, /id="v2-settings-toggle"/);
  assert.match(floatingControls, /id="v2-info-toggle"/);
  assert.match(settings, /data-edition="modern"/);
  assert.match(settings, /data-edition="past"/);
  assert.match(settings, /id="v2-toggle-collision"/);
  assert.match(css, /\.v2-settings-toggle[^}]*background:\s*transparent/s);
  assert.match(runtime, /settingsToggle\.addEventListener\('click'/);
  assert.match(runtime, /setSettingsOpen/);
});

test('the past information panel can be collapsed to reveal castle characters', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /id="v2-info-toggle"[^>]*aria-controls="v2-story-status"/);
  assert.match(css, /\.v2-story-status\.is-collapsed\s*\{\s*display:\s*none/);
  assert.match(runtime, /infoToggle\.addEventListener\('click'/);
  assert.match(runtime, /setStoryPanelVisible/);
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
  assert.match(html, /v2-input\.js\?edition=3/);
  assert.match(html, /v2\.js\?edition=5/);
  assert.match(html, /v2\.css\?edition=4/);
  assert.match(html, /id="v2-drag-guide"/);
  assert.match(css, /#v2-shell[^}]*touch-action:\s*none/s);
  assert.match(runtime, /shell\.addEventListener\('pointerdown'/);
  assert.match(runtime, /shell\.addEventListener\('pointermove'/);
  assert.match(runtime, /isMapDragOrigin/);
  assert.match(runtime, /dragMovementVector/);
});

test('the contextual action is one tappable label that stays clear of the movement cursor', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');

  assert.match(html, /<button id="v2-interaction-prompt"[^>]*type="button"/);
  assert.doesNotMatch(html, /id="v2-interact"/);
  assert.match(css, /\.v2-interaction-prompt\s*\{[^}]*cursor:\s*pointer/s);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.v2-interaction-prompt\s*\{[^}]*right:\s*max\(12px, env\(safe-area-inset-right\)\)[^}]*width:\s*min\(240px, calc\(100vw - 158px\)\)/s);
  assert.match(runtime, /interactionPrompt\.addEventListener\('click', performStoryInteraction\)/);
  assert.doesNotMatch(runtime, /interactButton/);
});
