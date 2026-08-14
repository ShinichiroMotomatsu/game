const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const layout = require(path.join('..', 'assets', 'v2', 'map-layout.json'));

function squaredDistanceToSegment(point, start, end) {
  const segmentX = end[0] - start[0];
  const segmentY = end[1] - start[1];
  const squaredLength = segmentX ** 2 + segmentY ** 2;
  if (squaredLength === 0) return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2;
  const projection = Math.max(0, Math.min(1,
    ((point[0] - start[0]) * segmentX + (point[1] - start[1]) * segmentY) / squaredLength
  ));
  const closestX = start[0] + projection * segmentX;
  const closestY = start[1] + projection * segmentY;
  return (point[0] - closestX) ** 2 + (point[1] - closestY) ** 2;
}

function distanceFromPointToRoad(point, road) {
  let best = Number.POSITIVE_INFINITY;
  for (const points of road.paths || [road.points]) {
    for (let index = 1; index < points.length; index++) {
      best = Math.min(best, squaredDistanceToSegment(point, points[index - 1], points[index]));
    }
  }
  return Math.sqrt(best);
}

const roadById = new Map(layout.roads.map(road => [road.id, road]));

test('the map is north-up and contains the requested physical road network', () => {
  assert.equal(layout.orientation, 'north-up');
  assert.deepEqual(layout.roads.map(road => road.id), [
    'roppongi-dori',
    'gaien-higashi',
    'route-1',
    'azabu-dori',
    'sakura-asa-dori',
    'tokyo-tower-dori',
    'route-301'
  ]);
  assert.ok(layout.roads.every(road => road.osmWayIds.length > 0 && road.paths.length > 0));
  assert.equal(layout.roadSource.provider, 'OpenStreetMap');
});

test('all map text is declared as runtime labels instead of baked map artwork', () => {
  const labels = new Map(layout.labels.map(label => [label.text, label]));
  const expectedLabels = [
    '六本木通り', '外苑東通り', '国道1号線', '麻布通り', '桜麻通り',
    '東京タワー通り', '都道301号線', '六本木交差点', '飯倉片町', '飯倉'
  ];
  for (const text of expectedLabels) {
    assert.equal(labels.get(text)?.renderMode, 'dynamic', `${text} must be a dynamic label`);
    assert.ok(Array.isArray(labels.get(text)?.point), `${text} must have a world position`);
  }
});

test('the PNG builder contains no text-rendering path and the runtime consumes labels', () => {
  const builder = fs.readFileSync(path.join('tools', 'build-v2-geographic-map.py'), 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.doesNotMatch(builder, /ImageFont|draw_road_label|draw\.text/);
  assert.match(runtime, /mapLayout\.labels/);
  assert.match(runtime, /drawMapLabels/);
});

test('Roppongi Crossing is shared by Roppongi-dori and Gaien-higashi', () => {
  const crossing = layout.intersections.find(item => item.id === 'roppongi-crossing');
  assert.ok(crossing);
  assert.equal(crossing.crosswalks, 4);
  assert.equal(crossing.label, '六本木交差点');
  assert.ok(distanceFromPointToRoad(crossing.point, roadById.get('roppongi-dori')) <= crossing.radius);
  assert.ok(distanceFromPointToRoad(crossing.point, roadById.get('gaien-higashi')) <= crossing.radius);
});

test('Iikura-katamachi and Iikura are separate labelled junctions', () => {
  const katamachi = layout.intersections.find(item => item.id === 'iikura-katamachi');
  const iikura = layout.intersections.find(item => item.id === 'iikura');
  assert.equal(katamachi?.label, '飯倉片町');
  assert.equal(iikura?.label, '飯倉');
  assert.notDeepEqual(katamachi.point, iikura.point);
  for (const junction of [katamachi, iikura]) {
    for (const roadId of junction.roads) {
      assert.ok(distanceFromPointToRoad(junction.point, roadById.get(roadId)) <= junction.radius,
        `${junction.id} must lie on ${roadId}`);
    }
  }
});

test('the required landmark sites declare their named approach roads', () => {
  const requiredContacts = new Map([
    ['roppongi-hills', new Set(['roppongi-dori'])],
    ['tokyo-midtown', new Set(['gaien-higashi'])],
    ['azabudai-hills', new Set(['gaien-higashi', 'route-1'])],
    ['tokyo-tower', new Set(['tokyo-tower-dori'])]
  ]);

  for (const [site, requiredRoads] of requiredContacts) {
    const siteParts = layout.landmarks.filter(landmark => landmark.site === site);
    assert.ok(siteParts.length > 0, `${site} must have at least one map part`);
    const declaredRoads = new Set(siteParts.flatMap(part => part.touches));
    assert.deepEqual(declaredRoads, requiredRoads);
  }
});

test('Roppongi Hills artwork is shifted right and down clear of Roppongi-dori', () => {
  const landmark = layout.landmarks.find(item => item.id === 'roppongi-hills');
  assert.deepEqual(
    { anchor: landmark.anchor, mapOffset: landmark.mapOffset },
    { anchor: [281, 581], mapOffset: [20, 55] }
  );
});

test('Tokyo Midtown artwork sits at the closest road-clear position beside Gaien-higashi', () => {
  const landmark = layout.landmarks.find(item => item.id === 'tokyo-midtown');
  assert.deepEqual(
    { anchor: landmark.anchor, mapOffset: landmark.mapOffset },
    { anchor: [337, 240], mapOffset: [-24, 0] }
  );
});

test('both Azabudai Hills parts sit just above Gaien-higashi without overlapping it', () => {
  const parts = Object.fromEntries(
    layout.landmarks
      .filter(item => item.site === 'azabudai-hills')
      .map(item => [item.id, { anchor: item.anchor, mapOffset: item.mapOffset }])
  );
  assert.deepEqual(parts, {
    'azabudai-hills': { anchor: [863, 533], mapOffset: [50, -8] },
    'azabudai-garden-plaza': { anchor: [888, 561], mapOffset: [0, -38] }
  });
});

test('Tokyo Tower artwork moves left and down clear of Tokyo Tower-dori', () => {
  const landmark = layout.landmarks.find(item => item.id === 'tokyo-tower');
  assert.deepEqual(
    { anchor: landmark.anchor, mapOffset: landmark.mapOffset },
    { anchor: [1052, 683], mapOffset: [-24, 44] }
  );
});

test('Tokyo Midtown is north of Roppongi Crossing and stays clear of Roppongi-dori', () => {
  const midtown = layout.landmarks.find(landmark => landmark.id === 'tokyo-midtown');
  const crossing = layout.intersections.find(intersection => intersection.id === 'roppongi-crossing');
  assert.ok(midtown.anchor[1] < crossing.point[1]);
  assert.deepEqual(midtown.mapOffset, [-24, 0]);
});

test('Azabudai Hills is split into tower and garden parts across both road fronts', () => {
  const parts = layout.landmarks.filter(landmark => landmark.site === 'azabudai-hills');
  assert.deepEqual(parts.map(part => part.id), ['azabudai-hills', 'azabudai-garden-plaza']);
  assert.deepEqual(parts.map(part => part.touches), [['gaien-higashi'], ['route-1']]);
});

test('landmarks keep the expected north-up relative positions', () => {
  const crossing = layout.intersections.find(item => item.id === 'roppongi-crossing').point;
  const landmarks = new Map(layout.landmarks.map(landmark => [landmark.id, landmark]));
  assert.ok(landmarks.get('roppongi-hills').anchor[1] > crossing[1]);
  assert.ok(landmarks.get('tokyo-midtown').anchor[1] < crossing[1]);
  assert.ok(landmarks.get('tokyo-tower').anchor[0] > landmarks.get('azabudai-hills').anchor[0]);
  assert.ok(landmarks.get('zojoji').anchor[1] > landmarks.get('tokyo-tower').anchor[1]);
});
