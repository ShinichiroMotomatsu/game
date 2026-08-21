(function exposePastSideQuests(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_SIDEQUESTS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const TILE_SIZE = 60;
  const COLUMNS = 45;
  const ROWS = 30;
  const MAX_WARMTH = 8;
  const POISON_DAMAGE = 2;
  const COLD_DAMAGE = 2;

  function buildDungeonRows(hazardTile, { ice = false, lava = false } = {}) {
    const grid = Array.from({ length: ROWS }, () => Array(COLUMNS).fill('#'));
    const carve = (left, top, right, bottom, tile = '.') => {
      for (let row = top; row <= bottom; row += 1) {
        for (let column = left; column <= right; column += 1) grid[row][column] = tile;
      }
    };

    // A long central route with three large lateral loops makes every dungeon
    // roughly three desktop viewports wide and three tall without forcing one path.
    carve(20, 1, 24, 28);
    carve(3, 22, 41, 25);
    carve(3, 13, 41, 17);
    carve(3, 5, 41, 9);
    carve(3, 19, 10, 27);
    carve(34, 19, 41, 27);
    carve(3, 10, 11, 18);
    carve(33, 10, 41, 18);
    carve(3, 2, 12, 11);
    carve(32, 2, 41, 11);
    carve(10, 7, 20, 9);
    carve(24, 6, 34, 8);
    carve(10, 15, 20, 17);
    carve(24, 13, 34, 15);
    carve(10, 23, 20, 25);
    carve(24, 22, 34, 24);

    if (hazardTile === 'P') {
      carve(4, 23, 18, 24, 'P');
      carve(26, 14, 40, 16, 'P');
      carve(4, 6, 18, 8, 'P');
      carve(21, 18, 23, 21, 'P');
      grid[24][8] = 'C';
      grid[15][37] = 'C';
      grid[7][8] = 'C';
    }

    if (ice) {
      carve(4, 23, 18, 24, 'I');
      carve(26, 14, 40, 16, 'I');
      carve(4, 6, 18, 8, 'I');
      carve(21, 18, 23, 21, 'I');
      grid[24][8] = 'B';
      grid[15][37] = 'B';
      grid[7][8] = 'B';
      grid[20][22] = 'B';
    }

    if (lava) {
      carve(3, 5, 19, 9, 'L');
      carve(25, 5, 41, 9, 'L');
      carve(20, 10, 24, 13, 'L');
      // The fire-rat chief waits before the first mandatory lava crossing.
      grid[17][22] = 'M';
      grid[15][10] = 'S';
      grid[15][34] = 'S';
    }

    grid[27][22] = '>';
    grid[2][22] = 'A';
    return Object.freeze(grid.map(row => row.join('')));
  }

  const SIDE_DUNGEONS = Object.freeze({
    'poison-sanctum': Object.freeze({
      id: 'poison-sanctum', name: '紫泥に沈む祠', biome: 'poison', tileSize: TILE_SIZE,
      rows: buildDungeonRows('P'), columns: COLUMNS, width: COLUMNS * TILE_SIZE, height: ROWS * TILE_SIZE,
      spawn: Object.freeze([22.5 * TILE_SIZE, 27.5 * TILE_SIZE]), hazardTiles: Object.freeze(['P']),
      samples: Object.freeze({ poison: Object.freeze([8.5 * TILE_SIZE, 23.5 * TILE_SIZE]) })
    }),
    'ice-lantern-cavern': Object.freeze({
      id: 'ice-lantern-cavern', name: '氷灯の回廊', biome: 'ice', tileSize: TILE_SIZE,
      rows: buildDungeonRows('I', { ice: true }), columns: COLUMNS, width: COLUMNS * TILE_SIZE, height: ROWS * TILE_SIZE,
      spawn: Object.freeze([22.5 * TILE_SIZE, 27.5 * TILE_SIZE]), hazardTiles: Object.freeze(['I']),
      samples: Object.freeze({ ice: Object.freeze([8.5 * TILE_SIZE, 23.5 * TILE_SIZE]), brazier: Object.freeze([8.5 * TILE_SIZE, 24.5 * TILE_SIZE]) })
    }),
    'molten-crown-caldera': Object.freeze({
      id: 'molten-crown-caldera', name: '熔火の王冠', biome: 'lava', tileSize: TILE_SIZE,
      rows: buildDungeonRows('L', { lava: true }), columns: COLUMNS, width: COLUMNS * TILE_SIZE, height: ROWS * TILE_SIZE,
      spawn: Object.freeze([22.5 * TILE_SIZE, 27.5 * TILE_SIZE]), hazardTiles: Object.freeze(['L']),
      samples: Object.freeze({ lava: Object.freeze([22.5 * TILE_SIZE, 11.5 * TILE_SIZE]), midboss: Object.freeze([22.5 * TILE_SIZE, 17.5 * TILE_SIZE]) })
    })
  });

  const SIDE_QUESTS = Object.freeze([
    Object.freeze({
      id: 'sunken-shrine', title: '紫泥に沈む祠', recommendedLevel: 6, unlockAfter: 'crossroads-boss',
      dungeonId: 'poison-sanctum', entranceInteractionId: 'sunken-shrine-entrance',
      overworldPoint: Object.freeze([145, 500]), journalOrder: 1,
      bossEncounterId: 'sidequest-sunken-shrine-boss', bossEnemyId: 'miasma-root',
      rewardCardId: 'purify', rewardKeyItemId: 'swamp-ward-charm',
      journalLines: Object.freeze([
        '地図師エルドは、孤立した沼の集落へ薬を届ける灯守の薬師ミラと出会った。',
        '安全な道を描く者と、道の先で命を守る者。二人が初めて同じ地図へ印を重ねた日、離れていた人々の往来が戻った。',
        '父は記した。「地図は土地を測るためだけのものではない。人と人を結ぶ約束なのだ」と。'
      ])
    }),
    Object.freeze({
      id: 'ice-lantern', title: '氷灯の回廊', recommendedLevel: 9, unlockAfter: 'crossroads-boss',
      dungeonId: 'ice-lantern-cavern', entranceInteractionId: 'ice-lantern-entrance',
      overworldPoint: Object.freeze([293, 416]), journalOrder: 2,
      bossEncounterId: 'sidequest-ice-lantern-boss', bossEnemyId: 'glacier-beast',
      rewardCardId: 'sunfire', rewardEquipmentId: 'lampkeeper-cloak',
      journalLines: Object.freeze([
        '吹雪で分かたれた二つの村を結ぶため、地図師エルドは道標を、灯守の薬師ミラは消えない火を受け持った。',
        '夜の雪原で二つの小さな灯が寄り添うのを見て、二人は「同じ場所へ帰ろう」と互いを信じる約束を交わした。',
        '父の手記には、道順よりも先に、ミラが灯した火の位置が丁寧に描かれている。'
      ])
    }),
    Object.freeze({
      id: 'molten-crown', title: '熔火の王冠', recommendedLevel: 14, unlockAfter: 'crossroads-boss',
      dungeonId: 'molten-crown-caldera', entranceInteractionId: 'molten-crown-entrance',
      overworldPoint: Object.freeze([405, 338]), journalOrder: 3,
      bossEncounterId: 'sidequest-molten-crown-boss', bossEnemyId: 'crown-drake',
      rewardCardId: 'starflare', rewardEquipmentId: 'twin-star-sword',
      journalLines: Object.freeze([
        '争っていた二つの集落を救うため、地図師エルドと灯守の薬師ミラは、双方が使える一つの避難路を完成させた。',
        '熔岩が冷えた夜、二人は互いの星を刻んだ「双星の羅針盤」を作り、これからの道を共に歩く誓いで結ばれた。',
        '最後の頁には「道の終わりではなく、共に帰る場所から新しい地図は始まる」とある。'
      ])
    })
  ]);

  const SIDE_DUNGEON_ENCOUNTERS = Object.freeze([
    Object.freeze({ id: 'sidequest-poison-slime', dungeonId: 'poison-sanctum', enemyId: 'miasma-slime', speed: 22, patrol: Object.freeze([[510, 1450], [780, 1450], [900, 1390]]) }),
    Object.freeze({ id: 'sidequest-marsh-leech', dungeonId: 'poison-sanctum', enemyId: 'marsh-leech', speed: 18, patrol: Object.freeze([[2070, 930], [2250, 930], [2370, 870]]) }),
    Object.freeze({ id: 'sidequest-spore-mandrake', dungeonId: 'poison-sanctum', enemyId: 'spore-mandrake', speed: 16, patrol: Object.freeze([[450, 450], [690, 450], [810, 390]]) }),
    Object.freeze({ id: 'sidequest-sunken-shrine-boss', dungeonId: 'poison-sanctum', enemyId: 'miasma-root', boss: true, patrol: Object.freeze([[1350, 150]]) }),

    Object.freeze({ id: 'sidequest-ice-wisp', dungeonId: 'ice-lantern-cavern', enemyId: 'ice-wisp', speed: 24, patrol: Object.freeze([[510, 1450], [780, 1450], [900, 1390]]) }),
    Object.freeze({ id: 'sidequest-snow-wolf', dungeonId: 'ice-lantern-cavern', enemyId: 'snow-wolf', speed: 27, patrol: Object.freeze([[2070, 930], [2250, 930], [2370, 870]]) }),
    Object.freeze({ id: 'sidequest-frost-beetle', dungeonId: 'ice-lantern-cavern', enemyId: 'frost-beetle', speed: 17, patrol: Object.freeze([[450, 450], [690, 450], [810, 390]]) }),
    Object.freeze({ id: 'sidequest-ice-lantern-boss', dungeonId: 'ice-lantern-cavern', enemyId: 'glacier-beast', boss: true, patrol: Object.freeze([[1350, 150]]) }),

    Object.freeze({ id: 'sidequest-lava-lizard', dungeonId: 'molten-crown-caldera', enemyId: 'lava-lizard', speed: 25, patrol: Object.freeze([[510, 1450], [780, 1450], [900, 1390]]) }),
    Object.freeze({ id: 'sidequest-ash-bat', dungeonId: 'molten-crown-caldera', enemyId: 'ash-bat', speed: 30, patrol: Object.freeze([[2070, 930], [2250, 930], [2370, 870]]) }),
    Object.freeze({ id: 'sidequest-obsidian-golem', dungeonId: 'molten-crown-caldera', enemyId: 'obsidian-golem', speed: 14, patrol: Object.freeze([[450, 450], [690, 450], [810, 390]]) }),
    Object.freeze({ id: 'sidequest-fire-rat-chief', dungeonId: 'molten-crown-caldera', enemyId: 'fire-rat-chief', midboss: true, patrol: Object.freeze([[1350, 1050]]) }),
    Object.freeze({ id: 'sidequest-molten-crown-boss', dungeonId: 'molten-crown-caldera', enemyId: 'crown-drake', boss: true, patrol: Object.freeze([[1350, 150]]) })
  ]);

  const SIDE_QUEST_KEY_ITEMS = Object.freeze({
    'swamp-ward-charm': Object.freeze({
      id: 'swamp-ward-charm', name: '沼守りの護符',
      description: '浄化された祠の石を収めた護符。紫泥の毒を防ぐ。'
    }),
    'fire-rat-boots': Object.freeze({
      id: 'fire-rat-boots', name: '火鼠の長靴',
      description: '魔法の毛皮が熱を逃がす長靴。熔岩の上を歩ける。'
    })
  });
  const QUEST_IDS = new Set(SIDE_QUESTS.map(quest => quest.id));
  const KEY_ITEM_IDS = new Set(Object.keys(SIDE_QUEST_KEY_ITEMS));

  function uniqueAllowed(values, allowed) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.filter(value => allowed.has(value)))];
  }

  function createSideQuestProgress(saved = {}) {
    const acceptedQuestIds = uniqueAllowed(saved.acceptedQuestIds, QUEST_IDS);
    const completedQuestIds = uniqueAllowed(saved.completedQuestIds, QUEST_IDS)
      .sort((left, right) => SIDE_QUESTS.findIndex(quest => quest.id === left) - SIDE_QUESTS.findIndex(quest => quest.id === right));
    for (const questId of completedQuestIds) {
      if (!acceptedQuestIds.includes(questId)) acceptedQuestIds.push(questId);
    }
    const journalFragments = [...new Set(completedQuestIds
      .map(questId => SIDE_QUESTS.find(quest => quest.id === questId)?.journalOrder)
      .filter(Boolean))].sort((left, right) => left - right);
    const keyItems = uniqueAllowed(saved.keyItems, KEY_ITEM_IDS);
    return {
      acceptedQuestIds,
      completedQuestIds,
      journalFragments,
      keyItems,
      cooledSluiceIds: Array.isArray(saved.cooledSluiceIds)
        ? [...new Set(saved.cooledSluiceIds.filter(id => ['west', 'east'].includes(id)))]
        : [],
      twinStarVowUnlocked: completedQuestIds.length === SIDE_QUESTS.length,
      twinStarVowSeen: Boolean(saved.twinStarVowSeen && completedQuestIds.length === SIDE_QUESTS.length)
    };
  }

  function sideQuestStatus(progress, questId, crossroadsBossDefeated) {
    if (!QUEST_IDS.has(questId) || !crossroadsBossDefeated) return 'locked';
    if (progress.completedQuestIds.includes(questId)) return 'completed';
    if (progress.acceptedQuestIds.includes(questId)) return 'active';
    return 'available';
  }

  function isNearActiveSideQuestEntrance(progress, crossroadsBossDefeated, x, y, scale = 1, radius = 42) {
    const safeScale = Math.max(0.01, Number(scale) || 1);
    const safeRadius = Math.max(0, Number(radius) || 0) * safeScale;
    return SIDE_QUESTS.some(quest => {
      const status = sideQuestStatus(progress, quest.id, crossroadsBossDefeated);
      if (status !== 'active' && status !== 'completed') return false;
      return Math.hypot(x - quest.overworldPoint[0] * safeScale, y - quest.overworldPoint[1] * safeScale) <= safeRadius;
    });
  }

  function acceptAvailableSideQuests(progress, crossroadsBossDefeated) {
    if (!crossroadsBossDefeated) return progress;
    const acceptedQuestIds = SIDE_QUESTS.map(quest => quest.id);
    if (acceptedQuestIds.every(id => progress.acceptedQuestIds.includes(id))) return progress;
    return createSideQuestProgress({ ...progress, acceptedQuestIds });
  }

  function completeSideQuest(progress, questId) {
    if (!QUEST_IDS.has(questId) || progress.completedQuestIds.includes(questId)) return progress;
    return createSideQuestProgress({
      ...progress,
      acceptedQuestIds: [...progress.acceptedQuestIds, questId],
      completedQuestIds: [...progress.completedQuestIds, questId]
    });
  }

  function markTwinStarVowSeen(progress) {
    if (!progress.twinStarVowUnlocked || progress.twinStarVowSeen) return progress;
    return { ...progress, twinStarVowSeen: true };
  }

  function grantSideQuestKeyItem(progress, keyItemId) {
    if (!KEY_ITEM_IDS.has(keyItemId) || progress.keyItems.includes(keyItemId)) return progress;
    return createSideQuestProgress({ ...progress, keyItems: [...progress.keyItems, keyItemId] });
  }

  function activateCooledSluice(progress, sluiceId) {
    if (!['west', 'east'].includes(sluiceId) || !progress.keyItems.includes('fire-rat-boots') || progress.cooledSluiceIds.includes(sluiceId)) {
      return progress;
    }
    return createSideQuestProgress({ ...progress, cooledSluiceIds: [...progress.cooledSluiceIds, sluiceId] });
  }

  function cooledSluiceDestination(progress, sluiceId) {
    if (!['west', 'east'].includes(sluiceId) || progress.cooledSluiceIds.length < 2) return null;
    return sluiceId === 'west' ? [2070, 930] : [630, 930];
  }

  function dungeonTileAt(dungeonId, x, y) {
    const dungeon = SIDE_DUNGEONS[dungeonId];
    if (!dungeon) return '#';
    const column = Math.floor(x / dungeon.tileSize);
    const row = Math.floor(y / dungeon.tileSize);
    if (row < 0 || column < 0 || row >= dungeon.rows.length || column >= dungeon.columns) return '#';
    return dungeon.rows[row][column];
  }

  function tileCanBeEntered(tile, keyItems = []) {
    if (tile === '#' || tile === '~') return false;
    if (tile === 'L') return keyItems.includes('fire-rat-boots');
    return true;
  }

  function sideQuestDungeonPointIsWalkable(dungeonId, x, y, radius = 0, keyItems = []) {
    const samples = [
      [x, y], [x - radius, y], [x + radius, y], [x, y - radius], [x, y + radius],
      [x - radius, y - radius], [x + radius, y - radius], [x - radius, y + radius], [x + radius, y + radius]
    ];
    return samples.every(([sampleX, sampleY]) => tileCanBeEntered(dungeonTileAt(dungeonId, sampleX, sampleY), keyItems));
  }

  function resolveDungeonStep({ dungeonId, tile, hp, warmth = MAX_WARMTH, keyItems = [] }) {
    const safeHp = Math.max(1, Math.floor(Number(hp) || 1));
    const safeWarmth = Math.max(0, Math.min(MAX_WARMTH, Math.floor(Number(warmth) || 0)));
    if (dungeonId === 'poison-sanctum' && tile === 'P' && !keyItems.includes('swamp-ward-charm')) {
      const damage = Math.min(POISON_DAMAGE, safeHp - 1);
      return { hp: safeHp - damage, warmth: safeWarmth, damage, message: damage ? `毒泥でHPが${damage}減った。` : '' };
    }
    if (dungeonId === 'ice-lantern-cavern') {
      if (tile === 'B') return { hp: safeHp, warmth: MAX_WARMTH, damage: 0, message: '灯火でぬくもりが戻った。' };
      if (tile === 'I') {
        const nextWarmth = Math.max(0, safeWarmth - 1);
        const damage = nextWarmth === 0 ? Math.min(COLD_DAMAGE, safeHp - 1) : 0;
        return { hp: safeHp - damage, warmth: nextWarmth, damage, message: damage ? `凍気でHPが${damage}減った。` : '' };
      }
    }
    return { hp: safeHp, warmth: safeWarmth, damage: 0, message: '' };
  }

  function createSideDungeonEnemies(dungeonId) {
    return SIDE_DUNGEON_ENCOUNTERS
      .filter(encounter => encounter.dungeonId === dungeonId && !encounter.boss && !encounter.midboss)
      .map(encounter => ({
        ...encounter,
        patrol: encounter.patrol.map(point => [...point]),
        speed: encounter.speed || 0,
        x: encounter.patrol[0][0],
        y: encounter.patrol[0][1],
        patrolIndex: encounter.patrol.length > 1 ? 1 : 0,
        active: true,
        respawnAt: 0
      }));
  }

  function sideQuestForArea(areaId) {
    return SIDE_QUESTS.find(quest => quest.dungeonId === areaId) || null;
  }

  function sideQuestForEncounter(encounterId) {
    return SIDE_QUESTS.find(quest => quest.bossEncounterId === encounterId) || null;
  }

  function sideQuestObjective(progress, areaId) {
    const quest = sideQuestForArea(areaId);
    if (!quest) return '四門水路の復旧後、クアドラの依頼板を確認する';
    if (!progress.acceptedQuestIds.includes(quest.id)) return '四門水路の復旧後、クアドラの依頼板を確認する';
    if (progress.completedQuestIds.includes(quest.id)) return `${quest.title}で見つけた父の手記を読み返す`;
    if (quest.id === 'molten-crown' && !progress.keyItems.includes('fire-rat-boots')) return '火鼠の長を倒し、熔岩を渡れる長靴を得る';
    if (quest.id === 'ice-lantern') return '灯火をつなぎ、回廊最奥の番獣を退ける';
    if (quest.id === 'sunken-shrine') return '毒泥を避け、沈んだ祠の瘴根を断つ';
    return '熔岩の王冠を越え、最奥の竜を退ける';
  }

  function isSideQuestArea(areaId) {
    return Boolean(SIDE_DUNGEONS[areaId]);
  }

  return {
    COLD_DAMAGE,
    MAX_WARMTH,
    POISON_DAMAGE,
    SIDE_DUNGEONS,
    SIDE_DUNGEON_ENCOUNTERS,
    SIDE_QUEST_KEY_ITEMS,
    SIDE_QUESTS,
    activateCooledSluice,
    acceptAvailableSideQuests,
    cooledSluiceDestination,
    completeSideQuest,
    createSideDungeonEnemies,
    createSideQuestProgress,
    dungeonTileAt,
    grantSideQuestKeyItem,
    isNearActiveSideQuestEntrance,
    isSideQuestArea,
    markTwinStarVowSeen,
    resolveDungeonStep,
    sideQuestDungeonPointIsWalkable,
    sideQuestForArea,
    sideQuestForEncounter,
    sideQuestObjective,
    sideQuestStatus,
    tileCanBeEntered
  };
});
