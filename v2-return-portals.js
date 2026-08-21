(function exposeReturnPortals(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_RETURN_PORTALS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const PHASES = Object.freeze([
    'arrival',
    'seek-king',
    'first-mission',
    'first-mission-report',
    'first-mission-complete',
    'second-mission',
    'second-mission-report',
    'second-mission-complete',
    'third-mission',
    'third-mission-report',
    'third-mission-complete'
  ]);

  const RETURN_PORTAL_NODES = Object.freeze([
    Object.freeze({
      id: 'capital',
      name: '王都ロプンギア',
      unknownName: '西岸の基準点',
      area: 'castle-town',
      overworldPoint: Object.freeze([307, 503]),
      localPoint: Object.freeze([700, 665]),
      arrivalPoint: Object.freeze([700, 705]),
      interactionRadius: 78,
      discoveryPhase: 'arrival',
      restorationFlag: 'crossroadsBossDefeated',
      note: '初回調査の基準点。港と王都を結ぶ道を測量した。'
    }),
    Object.freeze({
      id: 'quadra',
      name: '交差路の街クアドラ',
      unknownName: '中央の中継地（推定）',
      area: 'crossroads-town',
      overworldPoint: Object.freeze([416, 354]),
      localPoint: Object.freeze([600, 520]),
      arrivalPoint: Object.freeze([600, 565]),
      interactionRadius: 78,
      discoveryPhase: 'second-mission',
      restorationFlag: 'crossroadsBossDefeated',
      note: '二度目の調査で四門水路の保守路を記録。修理は水路番へ託す。'
    }),
    Object.freeze({
      id: 'veil',
      name: '城塞都市ヴェイル',
      unknownName: '北方の中継地（未確認）',
      area: 'mist-citadel',
      overworldPoint: Object.freeze([337, 240]),
      localPoint: Object.freeze([800, 940]),
      arrivalPoint: Object.freeze([800, 955]),
      interactionRadius: 78,
      discoveryPhase: 'third-mission',
      restorationFlag: 'mistBossDefeated',
      note: '霧鐘と地下の巻上げ機を調査。現地の鐘守へ点検箇所を伝えた。'
    })
  ]);

  const RETURN_PORTAL_LINKS = Object.freeze([
    Object.freeze({ id: 'capital-quadra', from: 'capital', to: 'quadra' }),
    Object.freeze({ id: 'quadra-veil', from: 'quadra', to: 'veil' })
  ]);

  const FATHER_MAP_MARKERS = Object.freeze([
    Object.freeze({
      id: 'watchtower-blue-star',
      name: '古い見張り台の青星紋',
      overworldPoint: Object.freeze([145, 515]),
      revealFlag: 'bossDefeated',
      note: '新しい筆跡。安全に引き返せる見張り台として再調査されている。'
    }),
    Object.freeze({
      id: 'quadra-blue-star',
      name: '四門水路の青星紋',
      overworldPoint: Object.freeze([416, 354]),
      revealFlag: 'crossroadsBossDefeated',
      note: '「道は場所ではなく、人と人を結ぶ」と追記されている。'
    }),
    Object.freeze({
      id: 'veil-blue-star',
      name: '霧鐘の青星紋',
      overworldPoint: Object.freeze([337, 240]),
      revealFlag: 'mistBossDefeated',
      note: 'エルドの調査線に、ノアの保守路の写しが重ねられている。'
    })
  ]);

  function phaseIndex(phase) {
    const index = PHASES.indexOf(phase);
    return index < 0 ? 0 : index;
  }

  function phaseReached(current, required) {
    return phaseIndex(current) >= phaseIndex(required);
  }

  function nodeStatus(node, story, campaign) {
    const discovered = node.id === 'capital'
      || phaseReached(story?.phase, node.discoveryPhase)
      || Boolean(campaign?.[node.restorationFlag]);
    if (!discovered) return 'unknown';
    if (campaign?.[node.restorationFlag]) return 'restored';
    if (node.id === 'capital') return 'offline';
    return 'corrupted';
  }

  function createReturnPortalAtlas(story = {}, campaign = {}) {
    const nodes = RETURN_PORTAL_NODES.map(node => {
      const status = nodeStatus(node, story, campaign);
      const discovered = status !== 'unknown';
      return {
        ...node,
        overworldPoint: [...node.overworldPoint],
        localPoint: [...node.localPoint],
        arrivalPoint: [...node.arrivalPoint],
        displayName: discovered ? node.name : node.unknownName,
        discovered,
        restored: status === 'restored',
        status,
        note: discovered ? node.note : 'エルドの推定線のみ。現地確認はまだない。'
      };
    });
    const nodesById = new Map(nodes.map(node => [node.id, node]));
    const links = RETURN_PORTAL_LINKS.map(link => {
      const from = nodesById.get(link.from);
      const to = nodesById.get(link.to);
      const restored = from.restored && to.restored;
      const status = restored
        ? 'restored'
        : (!from.discovered || !to.discovered ? 'hypothesis' : 'offline');
      return { ...link, status, restored };
    });
    const markers = FATHER_MAP_MARKERS
      .filter(marker => Boolean(campaign?.[marker.revealFlag]))
      .map(marker => ({ ...marker, overworldPoint: [...marker.overworldPoint] }));
    return { nodes, links, markers };
  }

  function returnPortalRoute(atlas, fromId, toId) {
    if (!atlas || !fromId || !toId || fromId === toId) return null;
    const restoredNodes = new Set((atlas.nodes || []).filter(node => node.restored).map(node => node.id));
    if (!restoredNodes.has(fromId) || !restoredNodes.has(toId)) return null;
    const links = (atlas.links || []).filter(link => link.restored);
    const queue = [[fromId]];
    const visited = new Set([fromId]);
    while (queue.length) {
      const path = queue.shift();
      const current = path[path.length - 1];
      for (const link of links) {
        const next = link.from === current ? link.to : link.to === current ? link.from : null;
        if (!next || visited.has(next)) continue;
        const nextPath = [...path, next];
        if (next === toId) return nextPath;
        visited.add(next);
        queue.push(nextPath);
      }
    }
    return null;
  }

  function nearbyReturnPortal(atlas, area, point) {
    const x = Number(point?.[0]);
    const y = Number(point?.[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return (atlas?.nodes || []).find(node => node.restored
      && node.area === area
      && Math.hypot(x - node.localPoint[0], y - node.localPoint[1]) <= node.interactionRadius) || null;
  }

  function atlasNodeAtCanvasPoint(atlas, point, canvas, world, radius = 22) {
    const x = Number(point?.[0]);
    const y = Number(point?.[1]);
    const canvasWidth = Number(canvas?.width);
    const canvasHeight = Number(canvas?.height);
    const worldWidth = Number(world?.width);
    const worldHeight = Number(world?.height);
    if (![x, y, canvasWidth, canvasHeight, worldWidth, worldHeight].every(Number.isFinite)) return null;
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const node of atlas?.nodes || []) {
      const nodeX = node.overworldPoint[0] / worldWidth * canvasWidth;
      const nodeY = node.overworldPoint[1] / worldHeight * canvasHeight;
      const distance = Math.hypot(x - nodeX, y - nodeY);
      if (distance <= radius && distance < closestDistance) {
        closest = node;
        closestDistance = distance;
      }
    }
    return closest;
  }

  function enemyIsLocallyObservable(player, enemy, maximumDistance = 260) {
    const playerX = Number(player?.x);
    const playerY = Number(player?.y);
    const enemyX = Number(enemy?.x);
    const enemyY = Number(enemy?.y);
    const distance = Number(maximumDistance);
    if (![playerX, playerY, enemyX, enemyY, distance].every(Number.isFinite) || distance < 0) return false;
    return enemy?.active !== false && Math.hypot(playerX - enemyX, playerY - enemyY) <= distance;
  }

  return {
    FATHER_MAP_MARKERS,
    RETURN_PORTAL_LINKS,
    RETURN_PORTAL_NODES,
    atlasNodeAtCanvasPoint,
    createReturnPortalAtlas,
    enemyIsLocallyObservable,
    nearbyReturnPortal,
    returnPortalRoute
  };
});
