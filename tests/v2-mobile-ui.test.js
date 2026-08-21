const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

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
  assert.match(html, /v2\.js\?edition=19/);
  assert.match(html, /v2\.css\?edition=13/);
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

test('field assets use the lazy loader before the main runtime starts', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const assetScript = html.indexOf('v2-assets.js');
  const runtimeScript = html.indexOf('v2.js?edition=');

  assert.ok(assetScript > 0 && assetScript < runtimeScript);
  assert.match(runtime, /createLazyImageLoader/);
  assert.doesNotMatch(runtime, /expectedAssets/);
  assert.doesNotMatch(runtime, /for \(const editionId of editionIds\)[\s\S]*tile\.image\.src = tile\.source/);
});

test('settings expose compact authenticated cloud save controls', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2-supabase-app.js', 'utf8');

  assert.match(html, /id="v2-cloud-status"/);
  assert.match(html, /id="v2-cloud-email"[^>]*autocomplete="email"/);
  assert.match(html, /id="v2-cloud-password"[^>]*autocomplete="current-password"/);
  assert.match(html, /id="v2-cloud-sign-in"/);
  assert.match(html, /id="v2-cloud-sign-up"/);
  assert.match(html, /id="v2-cloud-resend"/);
  assert.match(html, /id="v2-cloud-upload"/);
  assert.match(html, /id="v2-cloud-download"/);
  assert.match(html, /v2-auth\.js\?edition=2/);
  assert.match(html, /v2-supabase-app\.js\?edition=2/);
  assert.match(html, /v2-supabase-bundle\.js/);
  assert.match(css, /\.v2-cloud-actions/);
  assert.match(runtime, /buildCloudSaveEnvelope/);
  assert.match(runtime, /restoreCloudSaveEnvelope/);
  assert.match(runtime, /detectSessionInUrl:\s*true/);
  assert.match(runtime, /resendConfirmation/);
  assert.doesNotMatch(runtime, /innerHTML\s*=/);
});

test('battle cards use a large high-contrast type band and redraw any selected opening cards together', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');

  assert.match(html, /id="v2-battle-redraw"/);
  assert.match(html, /id="v2-battle-redraw-cancel"/);
  assert.match(runtime, /DISCIPLINE_LABELS/);
  assert.match(runtime, /CARD_ATTRIBUTE_LABELS/);
  assert.match(runtime, /v2-card-kindbar/);
  assert.match(runtime, /v2-card-attribute/);
  assert.match(runtime, /redrawOpeningCards/);
  assert.match(runtime, /battleRedrawIndices/);
  assert.match(css, /\.v2-card-kindbar[^}]*font-size:\s*(?:1[1-9]|[2-9]\d)px/);
  assert.match(css, /\.v2-card-kindbar[^}]*background:/);
  assert.match(css, /\.v2-battle-actions \{ display: grid; grid-template-columns: minmax\(0, 1\.35fr\) repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.v2-battle-actions button \{ min-width: 0;/);
  assert.match(css, /\.v2-battle-vital strong[^}]*font-size:\s*clamp\(/);
  assert.match(css, /\.v2-card[^}]*min-height:\s*118px/);
  assert.match(css, /\.v2-card-art[^}]*height:\s*60px/);
});

test('all five battle cards fit on a phone without horizontal scrolling', () => {
  const css = fs.readFileSync('v2.css', 'utf8');
  const mobile = css.match(/@media \(max-width: 700px\) \{[\s\S]*?\n\}/)?.[0] || '';

  assert.match(mobile, /\.v2-battle-hand[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(mobile, /\.v2-battle-hand[^}]*overflow-x:\s*hidden/s);
  assert.match(mobile, /\.v2-card-kindbar small[^}]*font-size:\s*(?:7|8|9)px/s);
  assert.match(mobile, /\.v2-card-copy small[^}]*display:\s*none/s);
});

test('victory disables fleeing and the first boss uses seal and mist-clearing presentation', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const battleRenderer = runtime.match(/function renderBattle\(\)[\s\S]*?\n  function resetBattleEffects/)?.[0] || '';

  assert.match(battleRenderer, /battleFlee\.disabled\s*=\s*activeBattle\.status\s*!==\s*'active'/);
  assert.match(html, /id="v2-story-visual"/);
  assert.match(html, /id="v2-watchtower-effect"/);
  assert.match(runtime, /function playWatchtowerEffect/);
  assert.match(runtime, /function drawWatchtowerFog/);
  assert.match(runtime, /watchtower-seal-release/);
  assert.match(runtime, /watchtower-crest/);
  assert.match(css, /is-seal-release/);
  assert.match(css, /is-mist-clearing/);
});

test('the compass crest is centered on the blue dial at every responsive size', () => {
  const css = fs.readFileSync('v2.css', 'utf8');
  const compassCrest = css.match(/\.v2-story-visual\[data-visual="compass"\] \.v2-story-visual-crest\s*\{[^}]+\}/)?.[0] || '';

  assert.match(compassCrest, /top:\s*39\.8%/);
  assert.match(compassCrest, /left:\s*48\.9%/);
  assert.match(compassCrest, /transform:\s*translate\(-50%,\s*-50%\)/);
});

test('settings offer an inherited chapter restart without erasing growth', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /id="v2-inherited-restart"/);
  assert.match(html, /成長を引き継いで最初から/);
  assert.match(runtime, /newGame=inherit/);
  assert.match(runtime, /restartCampaignKeepingGrowth/);
  assert.match(runtime, /createPastStory\(\{ gold: storyState\.gold \}\)/);
});

test('all merchants share the sell list, highlight equipped gear, and ask before selling', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');

  assert.match(html, /id="v2-shop-confirm"/);
  assert.match(html, /id="v2-shop-confirm-accept"/);
  assert.match(html, /id="v2-shop-confirm-cancel"/);
  assert.match(runtime, /productsOwnedForSale\(campaignState\)/);
  assert.match(runtime, /requestSaleConfirmation/);
  assert.doesNotMatch(runtime, /shopSell\.disabled = activeServiceId === 'card'/);
  assert.match(runtime, /is-equipped/);
  assert.match(css, /\.v2-shop-item\.is-equipped/);
  const request = runtime.match(/function requestSaleConfirmation\([\s\S]*?\n  function confirmPendingSale/)?.[0] || '';
  const confirm = runtime.match(/function confirmPendingSale\([\s\S]*?\n  function renderService/)?.[0] || '';
  assert.doesNotMatch(request, /sellProduct\(/);
  assert.match(confirm, /sellProduct\(/);
});

test('settings include past-quest debug completion controls', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');

  assert.match(html, /id="v2-quest-debug"/);
  assert.match(html, /data-debug-quest="watchtower"/);
  assert.match(html, /data-debug-quest="crossroads"/);
  assert.match(html, /data-debug-quest="mist-citadel"/);
  assert.match(runtime, /setDebugQuestCompletion/);
  assert.match(runtime, /savePastCampaign\(\)/);
  assert.match(runtime, /savePastStory\(\)/);
});

test('shop tabs and inn fade remain touch-sized on mobile', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const css = fs.readFileSync('v2.css', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');

  assert.match(html, /class="v2-shop-tabs"/);
  assert.match(css, /\.v2-shop-tabs button[^}]*min-height:\s*44px/s);
  assert.match(css, /\.v2-rest-transition\.is-active/);
  assert.match(runtime, /playInnRestTransition/);
  assert.match(runtime, /productsForShop/);
  assert.match(runtime, /sellProduct/);
});

test('the bag exposes every owned weapon and armor as an equipment action', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');

  assert.match(runtime, /campaignState\.ownedEquipment/);
  assert.match(runtime, /equipProduct\(campaignState, product\.id\)/);
  assert.match(runtime, /装備する/);
});

test('the waterway draws detailed tiles and raster altar and watergates without showing the boss early', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const eventsRenderer = runtime.match(/function drawCrossroadsDungeonEvents\(\)[\s\S]*?\n  function drawTownBuildingLabel/)?.[0] || '';
  const locationAssets = runtime.match(/function requiredAssetKeysForLocation\(\)[\s\S]*?\n  function loadAssetsInBackground/)?.[0] || '';

  assert.match(runtime, /buildDungeonTileSprite/);
  assert.match(eventsRenderer, /drawDungeonAltar/);
  assert.match(eventsRenderer, /CROSSROADS_WATERGATES/);
  assert.match(eventsRenderer, /campaignState\.crossroadsBossDefeated/);
  assert.match(runtime, /pastEventImages\.get\(`watergate-\$\{open \? 'open' : 'closed'\}`\)/);
  assert.match(runtime, /gate\.rotationQuarterTurns \* Math\.PI \/ 2/);
  assert.match(runtime, /pastEventImages\.get\(`compass-altar-\$\{restored \? 'restored' : 'corrupted'\}`\)/);
  assert.doesNotMatch(runtime.match(/function drawWatergate\([\s\S]*?\n  function drawDungeonAltar/)?.[0] || '', /fillRect|strokeRect/);
  assert.doesNotMatch(runtime.match(/function drawDungeonAltar\([\s\S]*?\n  function drawCrossroadsDungeonEvents/)?.[0] || '', /ellipse|fillRect|strokeRect/);
  assert.doesNotMatch(eventsRenderer, /crossroads-sentinel/);
  assert.doesNotMatch(locationAssets, /enemyAssetKey\('crossroads-sentinel'\)/);
  assert.match(runtime, /crossroads-altar-awaken/);
  assert.match(runtime, /is-altar-awakening/);
});

test('chapter three has a lazy-loaded fog city renderer and a bell-tower boss interaction', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(runtime, /sceneAssetKey\('mist-citadel'\)/);
  assert.match(runtime, /function drawMistCitadel/);
  assert.match(runtime, /mist-bell-warden/);
  assert.match(runtime, /mistInvestigationResult/);
  assert.match(runtime, /midtown-memory-restored/);
});

test('browser Supabase config contains only the project URL and publishable key', () => {
  const config = fs.readFileSync('v2-supabase-config.public.js', 'utf8');
  const context = { globalThis: {} };
  vm.runInNewContext(config, context);
  const publicConfig = context.globalThis.ROPPONGI_SUPABASE_CONFIG;

  assert.deepEqual(Array.from(Object.keys(publicConfig)).sort(), ['publishableKey', 'url']);
  assert.equal(publicConfig.url, 'https://xnromcineefyabmrnaro.supabase.co');
  assert.match(publicConfig.publishableKey, /^sb_publishable_[A-Za-z0-9_-]+$/);
});
