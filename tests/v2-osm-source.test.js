const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.join('assets', 'v2', 'osm-road-source.json');

test('a reproducible OpenStreetMap road snapshot is stored locally', () => {
  assert.equal(fs.existsSync(sourcePath), true);
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  assert.equal(source.provider, 'OpenStreetMap');
  assert.equal(source.license, 'ODbL-1.0');
  assert.match(source.attribution, /OpenStreetMap contributors/);
  assert.deepEqual(source.bbox, [139.724, 35.65, 139.754, 35.672]);
  assert.ok(source.osmBaseTimestamp);
  assert.ok(source.elements.length > 20);
  assert.ok(source.elements.every(element =>
    Number.isInteger(element.id)
    && typeof element.tags?.highway === 'string'
    && typeof element.tags?.name === 'string'
    && element.geometry?.length >= 2
  ));
});

test('the importer contains the fixed bbox and requests geometry from Overpass', () => {
  const importer = fs.readFileSync(path.join('tools', 'import-v2-osm-roads.py'), 'utf8');
  assert.match(importer, /35\.650,139\.724,35\.672,139\.754/);
  assert.match(importer, /out geom/);
  assert.match(importer, /RoppongiRPGPrototype/);
});

test('intersection surfaces replace stacked-road junction rendering', () => {
  const layout = JSON.parse(fs.readFileSync(path.join('assets', 'v2', 'map-layout.json'), 'utf8'));
  const builder = fs.readFileSync(path.join('tools', 'build-v2-geographic-map.py'), 'utf8');
  assert.ok(layout.intersections.every(intersection =>
    intersection.style === 'intersection-surface' && intersection.radius >= 20
  ));
  assert.match(builder, /draw_intersection_surface/);
});

test('legacy geographic entrances stay removed while the story gate is runtime-only', () => {
  const layout = JSON.parse(fs.readFileSync(path.join('assets', 'v2', 'map-layout.json'), 'utf8'));
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.ok(layout.landmarks.every(landmark => landmark.entrance === undefined));
  assert.doesNotMatch(runtime, /drawEntrances|interiorMapId/);
  assert.match(runtime, /drawPastCapitalGate/);
});

test('the game visibly attributes OpenStreetMap road data', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  assert.match(html, /openstreetmap\.org\/copyright/);
  assert.match(html, /OpenStreetMap contributors/);
  assert.match(html, /ODbL/);
});

test('landmark collision data and runtime code are completely removed', () => {
  const layout = JSON.parse(fs.readFileSync(path.join('assets', 'v2', 'map-layout.json'), 'utf8'));
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const layoutBuilder = fs.readFileSync(path.join('tools', 'build-v2-osm-layout.py'), 'utf8');
  assert.equal(layout.landmarkCollisionEnabled, undefined);
  assert.ok(layout.landmarks.every(landmark => landmark.footprint === undefined));
  assert.doesNotMatch(runtime, /landmarkCollision|circleTouches|footprint/);
  assert.doesNotMatch(layoutBuilder, /landmarkCollisionEnabled/);
  assert.doesNotMatch(layoutBuilder, /landmark\["footprint"\]/);
});

test('the launcher exposes only Modern Day and Past Evening editions', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /現代編-昼間/);
  assert.match(html, /過去編-夕方/);
  assert.doesNotMatch(html, /legacy\.html|旧版/);
  assert.equal(fs.existsSync('legacy.html'), false);
});

test('the launcher offers both continue and restart entrances for Past Evening', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /href="v2\.html\?edition=past"[^>]*>[^<]*つづきから/s);
  assert.match(html, /href="v2\.html\?edition=past&amp;newGame=past"[^>]*>[^<]*はじめから/s);
});

test('the game provides a settings-panel edition switch with shared geometry', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /id="v2-settings"/);
  assert.match(html, /data-edition="modern"/);
  assert.match(html, /data-edition="past"/);
  assert.match(runtime, /setEdition/);
  const editions = fs.readFileSync('v2-editions.js', 'utf8');
  assert.match(editions, /past-evening-runtime-tiles/);
  assert.match(editions, /past-landmarks/);
  assert.equal(fs.existsSync(path.join('assets', 'v2', 'past-evening-runtime-tiles')), true);
});

test('the battle interface is touch-first and only loaded by the shared game page', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  assert.match(html, /id="v2-battle"/);
  assert.match(html, /id="v2-battle-hand"/);
  assert.match(html, /id="v2-battle-resolve"/);
  assert.match(html, /id="v2-battle-practice"/);
  assert.match(html, /id="v2-battle-effects"/);
  assert.match(html, /id="v2-battle-damage-flash"/);
  assert.match(html, /v2-battle\.js/);
  assert.match(html, /v2-past-world\.js/);
});

test('battle effects visibly distinguish weakness and received damage', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const styles = fs.readFileSync('v2.css', 'utf8');
  assert.match(runtime, /playBattleEffects/);
  assert.match(runtime, /is-weak/);
  assert.match(runtime, /is-player-hit/);
  assert.match(styles, /v2-weakness-burst/);
  assert.match(styles, /v2-player-damage-flash/);
  assert.match(styles, /v2-enemy-hit/);
  assert.match(runtime, /v2-combat-impact/);
  assert.match(styles, /v2-impact-burst/);
  assert.match(styles, /v2-slash-trail/);
  assert.match(runtime, /dataset\.hpState\s*=\s*hpCondition/);
  assert.match(styles, /data-hp-state="warning"/);
  assert.match(styles, /data-hp-state="danger"/);
});

test('the enemy plays a graphical face-up intent card for the reading game', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const styles = fs.readFileSync('v2.css', 'utf8');
  assert.match(html, /id="v2-battle-intent-icon"/);
  assert.match(html, /id="v2-battle-intent-hint"/);
  assert.match(runtime, /dataset\.intent/);
  assert.match(runtime, /看破成功/);
  assert.match(styles, /v2-enemy-intent-card/);
  assert.match(styles, /v2-card-art/);
  assert.match(styles, /v2-card-frame/);
});

test('enemy intent is hidden unless the eye card revealed it and full energy resolves immediately', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(runtime, /intentRevealed/);
  assert.match(runtime, /予兆不明/);
  assert.match(runtime, /readyToResolve/);
  assert.match(runtime, /resolveSelectedAction/);
});

test('encounters use a full-screen classic RPG transition before battle', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const styles = fs.readFileSync('v2.css', 'utf8');
  assert.match(html, /id="v2-encounter-transition"/);
  assert.match(runtime, /playEncounterTransition/);
  assert.match(styles, /v2-encounter-vortex/);
  assert.match(styles, /v2-encounter-close/);
});

test('the opening fantasy presentation does not reveal the memory premise', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.doesNotMatch(html, /思い出せない|過去の記憶|記憶の霧/);
  assert.doesNotMatch(runtime, /fillText\(['"]思い出せない場所/);
});

test('Past Evening map build clips roads to an island and draws ports at coastal road ends', () => {
  const builder = fs.readFileSync(path.join('tools', 'build-v2-geographic-map.py'), 'utf8');
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(builder, /past_land_mask/);
  assert.match(builder, /draw_past_ports/);
  assert.match(builder, /HARBOR_PIER_SOURCE_PATH/);
  assert.match(builder, /HARBOR_SHIP_SOURCE_PATH/);
  assert.match(builder, /HARBOR_LIGHTHOUSE_SOURCE_PATH/);
  assert.match(builder, /pier_sprite\.rotate/);
  assert.doesNotMatch(builder, /ship_sprite\.rotate|lighthouse_sprite\.rotate/);
  assert.match(builder, /composite_upright_harbor_prop/);
  assert.match(builder, /Image\.Resampling\.LANCZOS/);
  assert.match(builder, /alpha_composite/);
  assert.match(builder, /ImageChops\.multiply/);
  for (const name of ['harbor-pier-source.png', 'harbor-ship-source.png', 'harbor-lighthouse-source.png']) {
    assert.equal(fs.existsSync(path.join('assets', 'v2', 'past-events', name)), true, name);
  }
  assert.match(html, /road-collision-past-data\.js/);
  assert.match(runtime, /V2_ROAD_COLLISION_PAST/);
});

test('future events can unlock memory fog through a stable game event API', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(runtime, /window\.V2_GAME_EVENTS/);
  assert.match(runtime, /completeMemoryEvent/);
  assert.match(runtime, /roppongi-past-memory-stage/);
});
