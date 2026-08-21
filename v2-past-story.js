(function exposePastStory(root, factory) {
  const sideQuestApi = typeof module === 'object' && module.exports
    ? require('./v2-past-sidequests.js')
    : root?.V2_PAST_SIDEQUESTS;
  const api = factory(sideQuestApi);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_STORY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, sideQuestApi => {
  if (!sideQuestApi) throw new Error('Past sidequest data is required.');
  const { SIDE_DUNGEONS, SIDE_QUESTS, sideQuestDungeonPointIsWalkable } = sideQuestApi;
  const CROSSROADS_DUNGEON_LAYOUT = (() => {
    const columns = 60;
    const rowCount = 45;
    const tileSize = 60;
    const grid = Array.from({ length: rowCount }, () => Array(columns).fill('#'));
    const carve = (left, top, right, bottom) => {
      for (let row = top; row <= bottom; row += 1) {
        for (let column = left; column <= right; column += 1) grid[row][column] = '.';
      }
    };

    carve(29, 1, 32, 43);
    carve(24, 19, 37, 27);
    carve(24, 38, 37, 43);
    carve(4, 22, 55, 24);
    carve(3, 17, 12, 29);
    carve(47, 17, 56, 29);
    carve(8, 13, 29, 15);
    carve(5, 6, 14, 16);
    carve(32, 9, 52, 11);
    carve(45, 4, 55, 14);
    carve(10, 31, 29, 33);
    carve(4, 30, 14, 40);
    carve(32, 34, 52, 36);
    carve(47, 31, 56, 41);

    for (let row = 1; row <= 43; row += 1) {
      grid[row][18] = '~';
      grid[row][41] = '~';
    }
    for (let column = 1; column <= 58; column += 1) {
      grid[17][column] = '~';
      grid[29][column] = '~';
    }
    grid[14][18] = '=';
    grid[23][18] = '=';
    grid[32][18] = '=';
    grid[10][41] = '=';
    grid[23][41] = '=';
    grid[35][41] = '=';
    grid[17][30] = '=';
    grid[17][31] = '=';
    grid[29][30] = '=';
    grid[29][31] = '=';
    grid[2][30] = 'A';
    grid[42][30] = '>';

    return Object.freeze({
      columns,
      tileSize,
      rows: Object.freeze(grid.map(row => row.join('')))
    });
  })();

  const CROSSROADS_CLUE_IDS = Object.freeze(['merchant-timing', 'reverse-gates', 'underground-bell']);
  const MIST_CLUE_IDS = Object.freeze(['lost-patrol', 'night-bell', 'masked-assembly']);
  const BROTHER_MESSAGE_PHASES = Object.freeze([
    'second-mission-report', 'second-mission-complete',
    'third-mission', 'third-mission-report', 'third-mission-complete'
  ]);
  const BROTHER_RESCUE_PHASES = Object.freeze(['third-mission-report', 'third-mission-complete']);
  const CROSSROADS_WATERGATES = Object.freeze([
    Object.freeze({ id: 'north-watergate', direction: 'north', name: '北の水門', point: Object.freeze([1830, 1050]), rotationQuarterTurns: 0 }),
    Object.freeze({ id: 'east-watergate', direction: 'east', name: '東の水門', point: Object.freeze([2490, 1410]), rotationQuarterTurns: 1 }),
    Object.freeze({ id: 'south-watergate', direction: 'south', name: '南の水門', point: Object.freeze([1830, 1770]), rotationQuarterTurns: 2 }),
    Object.freeze({ id: 'west-watergate', direction: 'west', name: '西の水門', point: Object.freeze([1110, 1410]), rotationQuarterTurns: 3 })
  ]);

  const PAST_START = Object.freeze({
    area: 'overworld',
    point: Object.freeze([70, 540]),
    capitalGatePoint: Object.freeze([307, 503])
  });

  const PAST_AREAS = Object.freeze({
    overworld: Object.freeze({ id: 'overworld', name: '新大陸・西岸', spawn: PAST_START.point }),
    'castle-town': Object.freeze({
      id: 'castle-town', name: '王都ロプンギア 城下町', width: 1400, height: 1000,
      spawn: Object.freeze([700, 875])
    }),
    castle: Object.freeze({
      id: 'castle', name: '蜘蛛守の王城', width: 1000, height: 760,
      spawn: Object.freeze([500, 645])
    }),
    'crossroads-town': Object.freeze({
      id: 'crossroads-town', name: '交差路の街クアドラ', width: 1200, height: 900,
      spawn: Object.freeze([600, 795])
    }),
    'crossroads-dungeon': Object.freeze({
      id: 'crossroads-dungeon', name: '四門水路',
      width: CROSSROADS_DUNGEON_LAYOUT.columns * CROSSROADS_DUNGEON_LAYOUT.tileSize,
      height: CROSSROADS_DUNGEON_LAYOUT.rows.length * CROSSROADS_DUNGEON_LAYOUT.tileSize,
      spawn: Object.freeze([1830, 2550])
    }),
    'mist-citadel': Object.freeze({
      id: 'mist-citadel', name: '霧の城塞都市ヴェイル', width: 1600, height: 1100,
      spawn: Object.freeze([800, 995])
    }),
    'mist-bell-tower': Object.freeze({
      id: 'mist-bell-tower', name: '無響の鐘楼', width: 1800, height: 1400,
      spawn: Object.freeze([900, 1260])
    }),
    ...Object.fromEntries(Object.values(SIDE_DUNGEONS).map(dungeon => [dungeon.id, Object.freeze({
      id: dungeon.id,
      name: dungeon.name,
      width: dungeon.width,
      height: dungeon.height,
      spawn: dungeon.spawn
    })]))
  });

  const TOWN_BUILDINGS = Object.freeze([
    Object.freeze({ id: 'royal-castle', type: 'castle', label: '蜘蛛守の王城', icon: '♜', rect: Object.freeze([400, 8, 600, 502]), color: '#8d4850', labelPoint: Object.freeze([700, 520]) }),
    Object.freeze({ id: 'weapon-shop', type: 'weapon', label: '武器屋「鉄蜘蛛」', icon: '⚔', rect: Object.freeze([35, 75, 310, 280]), color: '#8c4a32', labelPoint: Object.freeze([230, 385]) }),
    Object.freeze({ id: 'armor-shop', type: 'armor', label: '防具屋「銀の殻」', icon: '⬟', rect: Object.freeze([1055, 85, 310, 280]), color: '#465b74', labelPoint: Object.freeze([1240, 390]) }),
    Object.freeze({ id: 'item-shop', type: 'item', label: '道具屋「旅支度」', icon: '⚗', rect: Object.freeze([35, 430, 320, 215]), color: '#556c3d', labelPoint: Object.freeze([215, 680]) }),
    Object.freeze({ id: 'inn', type: 'inn', label: '宿屋「夕映え亭」', icon: '☾', rect: Object.freeze([1055, 440, 310, 250]), color: '#7c5136', labelPoint: Object.freeze([1180, 725]) }),
    Object.freeze({ id: 'card-shop', type: 'card', label: 'カード屋「星札堂」', icon: '✦', rect: Object.freeze([35, 710, 320, 250]), color: '#63467e', labelPoint: Object.freeze([385, 865]) })
  ]);

  const TOWN_WALLS = Object.freeze([
    Object.freeze({ id: 'wall-west', rect: Object.freeze([0, 0, 95, 1000]) }),
    Object.freeze({ id: 'wall-east', rect: Object.freeze([1305, 0, 95, 1000]) }),
    Object.freeze({ id: 'wall-north-west', rect: Object.freeze([0, 0, 560, 115]) }),
    Object.freeze({ id: 'wall-north-east', rect: Object.freeze([840, 0, 560, 115]) }),
    Object.freeze({ id: 'wall-south-west', rect: Object.freeze([0, 885, 620, 115]) }),
    Object.freeze({ id: 'wall-south-east', rect: Object.freeze([780, 885, 620, 115]) })
  ]);

  const TOWN_COLLISION_RECTS = Object.freeze([
    ...TOWN_BUILDINGS.map(building => building.rect),
    ...TOWN_WALLS.map(wall => wall.rect)
  ]);

  const CASTLE_COLLISION_RECTS = Object.freeze([
    Object.freeze([0, 0, 112, 760]),
    Object.freeze([888, 0, 112, 760]),
    Object.freeze([112, 0, 278, 105]),
    Object.freeze([610, 0, 278, 105]),
    Object.freeze([360, 70, 280, 150]),
    Object.freeze([112, 105, 72, 165]),
    Object.freeze([816, 105, 72, 165]),
    Object.freeze([112, 285, 72, 185]),
    Object.freeze([816, 285, 72, 185]),
    Object.freeze([0, 655, 390, 105]),
    Object.freeze([610, 655, 390, 105])
  ]);

  const CROSSROADS_TOWN_COLLISION_RECTS = Object.freeze([
    Object.freeze([0, 0, 115, 900]), Object.freeze([1085, 0, 115, 900]),
    Object.freeze([0, 0, 1200, 85]),
    Object.freeze([0, 820, 500, 80]), Object.freeze([700, 820, 500, 80]),
    Object.freeze([115, 95, 260, 240]), Object.freeze([825, 95, 260, 240]),
    Object.freeze([115, 615, 275, 205]), Object.freeze([810, 615, 275, 205])
  ]);

  const CROSSROADS_BUILDINGS = Object.freeze([
    Object.freeze({ id: 'crossroads-weapon-shop', type: 'weapon', label: '武器屋「四方鍛冶」', icon: '⚔', labelPoint: Object.freeze([285, 365]), servicePoint: Object.freeze([315, 370]) }),
    Object.freeze({ id: 'crossroads-armor-shop', type: 'armor', label: '防具屋「水竜の鱗」', icon: '⬟', labelPoint: Object.freeze([915, 365]), servicePoint: Object.freeze([875, 370]) }),
    Object.freeze({ id: 'crossroads-item-shop', type: 'item', label: '道具屋「四つ辻」', icon: '⚗', labelPoint: Object.freeze([285, 590]), servicePoint: Object.freeze([270, 580]) }),
    Object.freeze({ id: 'crossroads-inn', type: 'inn', label: '宿屋「道しるべ亭」', icon: '☾', labelPoint: Object.freeze([930, 590]), servicePoint: Object.freeze([940, 580]) }),
    Object.freeze({ id: 'crossroads-card-shop', type: 'card', label: 'カード屋「羅針札」', icon: '✦', labelPoint: Object.freeze([760, 690]), servicePoint: Object.freeze([750, 665]) })
  ]);

  const MIST_CITADEL_COLLISION_RECTS = Object.freeze([
    Object.freeze([0, 0, 90, 1100]), Object.freeze([1510, 0, 90, 1100]),
    Object.freeze([0, 0, 1600, 80]),
    Object.freeze([0, 1020, 700, 80]), Object.freeze([900, 1020, 700, 80]),
    Object.freeze([160, 230, 350, 230]), Object.freeze([1090, 230, 350, 230]),
    Object.freeze([150, 540, 370, 275]), Object.freeze([1080, 540, 370, 275]),
    Object.freeze([600, 70, 400, 310]), Object.freeze([600, 660, 400, 220])
  ]);

  const MIST_TOWER_COLLISION_RECTS = Object.freeze([
    Object.freeze([0, 0, 95, 1400]), Object.freeze([1705, 0, 95, 1400]),
    Object.freeze([0, 0, 1800, 80]),
    Object.freeze([0, 1320, 760, 80]), Object.freeze([1040, 1320, 760, 80]),
    Object.freeze([280, 280, 360, 260]), Object.freeze([1160, 280, 360, 260]),
    Object.freeze([280, 780, 360, 250]), Object.freeze([1160, 780, 360, 250]),
    Object.freeze([760, 500, 280, 340])
  ]);

  const MIST_BUILDINGS = Object.freeze([
    Object.freeze({ id: 'mist-weapon-shop', type: 'weapon', label: '武器屋「薄明鍛冶」', icon: '⚔', labelPoint: Object.freeze([335, 480]), servicePoint: Object.freeze([335, 480]) }),
    Object.freeze({ id: 'mist-armor-shop', type: 'armor', label: '防具屋「銀糸」', icon: '⬟', labelPoint: Object.freeze([1265, 480]), servicePoint: Object.freeze([1265, 480]) }),
    Object.freeze({ id: 'mist-item-shop', type: 'item', label: '道具屋「灯守」', icon: '⚗', labelPoint: Object.freeze([335, 840]), servicePoint: Object.freeze([335, 840]) }),
    Object.freeze({ id: 'mist-inn', type: 'inn', label: '宿屋「明け鐘亭」', icon: '☾', labelPoint: Object.freeze([1265, 840]), servicePoint: Object.freeze([1265, 840]) }),
    Object.freeze({ id: 'mist-card-shop', type: 'card', label: 'カード屋「響札房」', icon: '✦', labelPoint: Object.freeze([800, 890]), servicePoint: Object.freeze([800, 900]) })
  ]);

  const TOWN_NPCS = Object.freeze([
    Object.freeze({ id: 'town-mapmaker', role: 'villager', sprite: 'villager-man', name: '地図師見習いノル', point: Object.freeze([540, 585]), patrol: Object.freeze({ axis: 'x', distance: 36, periodMs: 5600, phase: 0.1 }), dialogueId: 'town-mapmaker' }),
    Object.freeze({ id: 'town-shopper', role: 'villager', sprite: 'villager-woman', name: '買い物帰りの女性', point: Object.freeze([865, 585]), patrol: Object.freeze({ axis: 'y', distance: 34, periodMs: 6200, phase: 0.55 }), dialogueId: 'town-shopper' }),
    Object.freeze({ id: 'town-traveler', role: 'villager', sprite: 'villager-man', name: '港帰りの旅人', point: Object.freeze([700, 785]), patrol: Object.freeze({ axis: 'x', distance: 42, periodMs: 6800, phase: 0.8 }), dialogueId: 'town-traveler' }),
    Object.freeze({ id: 'town-florist', role: 'villager', sprite: 'villager-woman', name: '花売りの娘', point: Object.freeze([700, 610]), patrol: Object.freeze({ axis: 'y', distance: 30, periodMs: 5200, phase: 0.3 }), dialogueId: 'town-florist' })
  ]);

  const CASTLE_NPCS = Object.freeze([
    Object.freeze({ id: 'king', role: 'king', sprite: 'king', name: 'アルディオン王', point: Object.freeze([500, 165]), facing: 'down' }),
    Object.freeze({ id: 'soldier-left', role: 'soldier', sprite: 'soldier', name: '王城兵', point: Object.freeze([355, 320]), patrol: Object.freeze({ axis: 'y', distance: 24, periodMs: 6000, phase: 0.1 }) }),
    Object.freeze({ id: 'soldier-right', role: 'soldier', sprite: 'soldier', name: '王城兵', point: Object.freeze([645, 320]), patrol: Object.freeze({ axis: 'y', distance: 24, periodMs: 6000, phase: 0.6 }) }),
    Object.freeze({ id: 'soldier-door', role: 'soldier', sprite: 'soldier', name: '門衛', point: Object.freeze([420, 610]), patrol: Object.freeze({ axis: 'x', distance: 34, periodMs: 5400, phase: 0.25 }) })
  ]);

  const CROSSROADS_NPCS = Object.freeze([
    Object.freeze({ id: 'crossroads-merchant', role: 'villager', sprite: 'villager-man', name: '東西商会の番頭', point: Object.freeze([420, 500]), patrol: Object.freeze({ axis: 'y', distance: 24, periodMs: 6200, phase: 0.2 }), dialogueId: 'crossroads-merchant' }),
    Object.freeze({ id: 'crossroads-guide', role: 'villager', sprite: 'villager-woman', name: '水路番の娘', point: Object.freeze([770, 390]), patrol: Object.freeze({ axis: 'x', distance: 28, periodMs: 6500, phase: 0.5 }), dialogueId: 'crossroads-guide' }),
    Object.freeze({ id: 'crossroads-guard', role: 'soldier', sprite: 'soldier', name: '四門衛兵', point: Object.freeze([600, 250]), patrol: Object.freeze({ axis: 'x', distance: 32, periodMs: 7000, phase: 0.8 }), dialogueId: 'crossroads-guard' })
  ]);

  const MIST_CITADEL_NPCS = Object.freeze([
    Object.freeze({ id: 'mist-patrol-captain', clueId: 'lost-patrol', role: 'soldier', sprite: 'soldier', name: '帰還した巡回兵セラ', point: Object.freeze([500, 470]), patrol: Object.freeze({ axis: 'y', distance: 20, periodMs: 7200, phase: 0.15 }), dialogueId: 'mist-clue-patrol' }),
    Object.freeze({ id: 'mist-bell-keeper', clueId: 'night-bell', role: 'villager', sprite: 'villager-woman', name: '鐘守ミナ', point: Object.freeze([800, 400]), patrol: Object.freeze({ axis: 'x', distance: 24, periodMs: 7600, phase: 0.5 }), dialogueId: 'mist-clue-bell' }),
    Object.freeze({ id: 'mist-mask-artisan', clueId: 'masked-assembly', role: 'villager', sprite: 'villager-man', name: '仮面職人イオ', point: Object.freeze([1100, 470]), patrol: Object.freeze({ axis: 'y', distance: 22, periodMs: 7000, phase: 0.8 }), dialogueId: 'mist-clue-assembly' }),
    Object.freeze({ id: 'mist-resident', role: 'villager', sprite: 'villager-woman', name: '霧都の住民', point: Object.freeze([1045, 760]), patrol: Object.freeze({ axis: 'x', distance: 24, periodMs: 6800, phase: 0.3 }), dialogueId: 'mist-resident' })
  ]);

  const BROTHER_NPCS = Object.freeze([
    Object.freeze({
      id: 'brother-veil', brotherStage: 'veil', area: 'mist-citadel', role: 'brother',
      sprite: 'younger-brother', name: '弟ノア', point: Object.freeze([800, 560]), facing: 'down', dialogueId: 'brother-veil'
    }),
    Object.freeze({
      id: 'brother-capital', brotherStage: 'capital', area: 'castle-town', role: 'brother',
      sprite: 'younger-brother', name: '弟ノア', point: Object.freeze([820, 620]), facing: 'left', dialogueId: 'brother-capital'
    }),
    Object.freeze({
      id: 'brother-quadra', brotherStage: 'quadra', area: 'crossroads-town', role: 'brother',
      sprite: 'younger-brother', name: '弟ノア', point: Object.freeze([675, 520]), facing: 'down', dialogueId: 'brother-quadra'
    })
  ]);

  const SIDE_QUEST_DIALOGUES = Object.freeze({
    'sidequest-board-open': Object.freeze({ id: 'sidequest-board-open', lines: Object.freeze([
      Object.freeze({ speaker: 'クアドラ依頼板', text: '四門水路の復旧で三地方への道が開いた。「紫泥の沼の薬路」「氷灯の回廊」「熔火の避難路」の調査人を募る、とある。' }),
      Object.freeze({ speaker: '主人公', text: 'どの依頼にも、父が使っていた青い星の印が添えられている。急ぐ順番は決められていない。三つとも手掛かりを追ってみよう。' }),
      Object.freeze({ speaker: '地の文', text: '三つのサブクエストが始まった。推奨レベルは順に6・9・14。準備に合わせ、好きな順で挑戦できる。' })
    ]) }),
    'sidequest-board-active': Object.freeze({ id: 'sidequest-board-active', lines: Object.freeze([
      Object.freeze({ speaker: 'クアドラ依頼板', text: '三地方の調査は継続中だ。地図の青い星印を頼りに、紫泥の沼・霜降りの谷・熔火の裂谷へ向かおう。' })
    ]) }),
    'sidequest-board-complete': Object.freeze({ id: 'sidequest-board-complete', lines: Object.freeze([
      Object.freeze({ speaker: 'クアドラ依頼板', text: '三地方の道はすべて復旧した。孤立していた集落同士の往来も戻り、依頼書には感謝の印が連なっている。' })
    ]) }),
    'twin-star-vow': Object.freeze({ id: 'twin-star-vow', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '三片の旅日誌を時の順に並べると、頁の星印が一つの光の道を描いた。' }),
      Object.freeze({ speaker: '主人公', text: '父は地図を作る旅で、灯守の薬師ミラと出会い、誰かのもとへ帰る道を知ったんだ。' }),
      Object.freeze({ speaker: '地の文', visualId: 'twin-star-vow', text: '青星紋と、同じ大きさの琥珀の星が短い道で結ばれ、「双星紋」が浮かぶ。エルドとミラは主従ではなく、同じ地図を描く二人だった。' }),
      Object.freeze({ speaker: '父の旅日誌', text: '二人の旅はここで終わらない。共に帰る場所から、新しい一枚の地図が始まる。' }),
      Object.freeze({ speaker: '主人公', text: '父が僕とノアに、同じ地図を違うように読めと残した理由が少し分かった。違う役目でも、帰る場所を重ねれば一つの道になるんだ。' })
    ]) }),
    'fire-rat-chief-awakening': Object.freeze({ id: 'fire-rat-chief-awakening', onComplete: 'sidequest-midboss-awaken:fire-rat-chief', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '黒曜石の足場を抜けると、熔岩の向こうへ続く道を火鼠の群れが塞いでいる。長の腰には、熱を寄せつけない革の長靴が結ばれている。' }),
      Object.freeze({ speaker: '主人公', text: 'あの長靴があれば熔岩を渡れる。まず火鼠の長を退けよう。' })
    ]) }),
    'fire-rat-chief-cleared': Object.freeze({ id: 'fire-rat-chief-cleared', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '火鼠の長が逃げ去り、「火鼠の長靴」を手に入れた。魔法の毛皮が熱を逃がし、熔岩の上を歩けるようになった。' })
    ]) }),
    ...Object.fromEntries(SIDE_QUESTS.flatMap(quest => {
      const hazardLine = quest.id === 'sunken-shrine'
        ? '毒泥は一歩ごとに命を削る。白い浄化石を結ぶ短い道を見極めよう。'
        : quest.id === 'ice-lantern'
          ? '氷床では足が滑り、ぬくもりが失われる。灯火を継いで奥へ進もう。'
          : 'まず黒曜石の安全地帯を進み、熔岩を越す手段を探そう。';
      return [
        [`${quest.id}-entrance`, Object.freeze({ id: `${quest.id}-entrance`, lines: Object.freeze([
          Object.freeze({ speaker: '地の文', text: `${quest.title}へ続く古道に、父の青い星印が刻まれている。${hazardLine}` })
        ]) })],
        [`${quest.id}-boss-awakening`, Object.freeze({ id: `${quest.id}-boss-awakening`, onComplete: `sidequest-boss-awaken:${quest.id}`, lines: Object.freeze([
          Object.freeze({ speaker: '地の文', text: `最奥の祭壇には、地図師エルドの道筋と灯守の薬師の灯火が一枚の地図に重ねられている。その上を異形の力が覆っている。` }),
          Object.freeze({ speaker: '主人公', text: '父の足跡を隠しているものを退け、ここに結ばれた道を取り戻す。' })
        ]) })],
        [`${quest.id}-boss-stable`, Object.freeze({ id: `${quest.id}-boss-stable`, lines: Object.freeze([
          Object.freeze({ speaker: '地の文', text: `${quest.title}の祭壇は穏やかな光をたたえている。刻まれた父の旅日誌を読み返した。` }),
          ...quest.journalLines.map(text => Object.freeze({ speaker: '父の旅日誌', text }))
        ]) })],
        [`${quest.id}-cleared`, Object.freeze({ id: `${quest.id}-cleared`, lines: Object.freeze([
          Object.freeze({ speaker: '地の文', text: `${quest.title}の異変が鎮まり、祭壇の裏から父の旅日誌・第${quest.journalOrder}片が現れた。` }),
          ...quest.journalLines.map(text => Object.freeze({ speaker: '父の旅日誌', text }))
        ]) })]
      ];
    }))
  });

  const STORY_DIALOGUES = Object.freeze({
    ...SIDE_QUEST_DIALOGUES,
    arrival: Object.freeze({
      id: 'arrival',
      onComplete: 'arrival-complete',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', visualId: 'voyage', text: '父である地図師エルドは、夕映えの新大陸へ旅立ったまま消息を絶った。主人公を乗せた船は今、その足跡を追って西の海を進んでいる。' }),
        Object.freeze({ speaker: '主人公', visualId: 'compass', text: '父が残した星の羅針盤……。どれだけ船が揺れても、針と中央に丸い光を持つ青い八芒星は新大陸だけを指している。父があの島にいるなら、必ず見つけ出す。' }),
        Object.freeze({ speaker: '地の文', visualId: 'voyage', text: 'やがて船は新大陸の西の港へたどり着いた。港の先に見える王都ロプンギアで、まず父の手掛かりを探そう。' })
      ])
    }),
    'capital-arrival': Object.freeze({
      id: 'capital-arrival',
      onComplete: 'capital-arrival-complete',
      lines: Object.freeze([
        Object.freeze({ speaker: '主人公', text: '港からここへ来る途中に見えた、あの異形の生き物は何だったんだ……。獣とも違う。' }),
        Object.freeze({ speaker: '王都兵', text: '旅人は魔物を見るのが初めてか。この新大陸では、街道の外だけでなく近ごろは城門の近くにも現れる。' }),
        Object.freeze({ speaker: '主人公', text: '魔物……。新大陸へ来るまで、あんな生き物は一度も見たことがなかった。' }),
        Object.freeze({ speaker: '王都兵', text: '詳しい話は王から聞くといい。まずは城下町を抜け、北の王城へ向かうんだ。' })
      ])
    }),
    'capital-rescue': Object.freeze({
      id: 'capital-rescue',
      onComplete: 'capital-arrival-complete',
      lines: Object.freeze([
        Object.freeze({ speaker: '王都兵', text: '危ないところだったな。港の見回り中に魔物の気配を見つけ、駆けつけたんだ。王都まで運んでおいた。' }),
        Object.freeze({ speaker: '主人公', text: '魔物……？ あの異形の生き物を、そう呼ぶのか。新大陸へ来るまで一度も見たことがない。' }),
        Object.freeze({ speaker: '王都兵', text: 'この大陸では昔から知られた存在だ。だが最近は数が増え、街道まで荒らしている。' }),
        Object.freeze({ speaker: '主人公', text: '父は、こんな生き物がいる土地を一人で進んだのか……。' }),
        Object.freeze({ speaker: '王都兵', text: '父上の手掛かりを探すなら、まず王に会うといい。北の王城へ案内状を出しておこう。' })
      ])
    }),
    'king-audience': Object.freeze({
      id: 'king-audience',
      onComplete: 'king-audience-complete',
      lines: Object.freeze([
        Object.freeze({ speaker: '王城兵', text: '旅人よ、王の御前である。無礼のないように。' }),
        Object.freeze({ speaker: 'アルディオン王', text: 'その青い八芒星の羅針盤……。かつて我が国の地図を作った地図師エルドのものだな。おぬしは、あの者の子か。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '父の行方について話したい。だが今、この国には見過ごせぬ異変が起きている。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '西の港街道に魔物が集まり、夜ごと紫の光が海岸の古い見張り台から立ちのぼるのだ。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '西の港街道を調べ、異変の原因を突き止めてほしい。見張り台は、エルドも調べていた場所だ。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '支度金として300Gを授けよう。城下町で武器や防具、カードを整えてから向かうがよい。' })
      ])
    }),
    'king-reminder': Object.freeze({
      id: 'king-reminder',
      lines: Object.freeze([
        Object.freeze({ speaker: 'アルディオン王', text: '西の港街道と、海岸の古い見張り台を調べてくれ。よい報せを待っている。' })
      ])
    }),
    'king-mission-complete': Object.freeze({
      id: 'king-mission-complete',
      onComplete: 'first-mission-report-complete',
      lines: Object.freeze([
        Object.freeze({ speaker: 'アルディオン王', text: '紫霧の番人を退けたか。西の港街道にも、ようやく人の往来が戻るだろう。' }),
        Object.freeze({ speaker: 'アルディオン王', text: 'あれは地図師エルド個人の旅印、「青星紋」に相違ない。父は確かに、あの見張り台へ立ち寄っている。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '若きエルドは霧で道を失った夜、地図にもない集落の青い玻璃の灯に救われた。そして集落から八方へ伸びる帰り道を測り、孤立を終わらせた。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '住民が贈った青い玻璃を、どの方角も等しい八芒に仕立てたのが青星紋の始まりだ。八方の先には待つ人がいて、中央の丸い光は必ず帰る場所を表すという。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '城の記録をさらに調べておこう。今日はよく休むがよい。最初の任務、見事であった。' })
      ])
    }),
    'king-after-first-mission': Object.freeze({
      id: 'king-after-first-mission',
      lines: Object.freeze([
        Object.freeze({ speaker: 'アルディオン王', text: '父の足跡について記録を調べている。次の手掛かりが見つかるまで、王都で旅支度を整えておくがよい。' })
      ])
    }),
    'king-crossroads-mission': Object.freeze({
      id: 'king-crossroads-mission',
      onComplete: 'crossroads-mission-start',
      lines: Object.freeze([
        Object.freeze({ speaker: 'アルディオン王', text: '見張り台の金属箱から、エルドの筆でクアドラへ続く街道と、四門水路の古い保守路を描いた地図片が見つかった。' }),
        Object.freeze({ speaker: 'アルディオン王', text: 'この数日、大陸中央のあの街から荷馬車も伝令も来なくなった。交通の要所が沈黙すれば国中が分断される。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '道中では紫泥の沼、古樹の山林、霜降りの谷、黄砂の荒野、熔火の裂谷に異なる魔物が現れる。交差路の街へ向かい、街道が止まった原因を調べてほしい。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '父エルドも、街の地下にある四門水路の古い地図を残している。各地形に合う札を見極めて進むのだ。' })
      ])
    }),
    'crossroads-arrival': Object.freeze({
      id: 'crossroads-arrival',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', text: '四つの街道が大きな羅針盤広場で交わる、交差路の街クアドラへ着いた。' }),
        Object.freeze({ speaker: '地の文', text: '本来は交通と交易の声が絶えない街だが、今は地下から響く水音だけが広場を満たしている。' })
      ])
    }),
    'crossroads-merchant': Object.freeze({ id: 'crossroads-merchant', onComplete: 'crossroads-clue:merchant-timing', lines: Object.freeze([
      Object.freeze({ speaker: '東西商会の番頭', text: '三日前、地下水路の流れが突然逆向きになり、地鳴りとともに四つの水門が閉じた。荷馬車も舟荷も動かせず、街の倉は空になりかけている。' }),
      Object.freeze({ speaker: '東西商会の番頭', text: '妙なのは、鐘が三度鳴る時刻だけ水が止まり、その直後に魔物が現れることだ。偶然とは思えない。' }),
      Object.freeze({ speaker: '東西商会の番頭', text: '水路の武具庫には、昔の街道守が使った剣が残っているはずだ。見つけたなら遠慮なく使ってくれ。' })
    ]) }),
    'crossroads-guide': Object.freeze({ id: 'crossroads-guide', onComplete: 'crossroads-clue:reverse-gates', lines: Object.freeze([
      Object.freeze({ speaker: '水路番の娘', text: '四門水路の方位核は、北の祭壇から四つの水門へ水の力を分ける仕組みなの。でも今は核が脈打つたび、水圧が逆流して街全体を揺らしている。' }),
      Object.freeze({ speaker: '水路番の娘', text: '中央広間から枝道をたどり、北の祭壇を調べて。エルドの記録では、祭壇の制御盤が水門すべてを動かす鍵よ。' })
    ]) }),
    'crossroads-guard': Object.freeze({ id: 'crossroads-guard', onComplete: 'crossroads-clue:underground-bell', lines: Object.freeze([
      Object.freeze({ speaker: '四門衛兵', text: '北門脇の階段が四門水路への入口だ。調査隊は祭壇の手前で、誰もいないはずの石壁から響く金属音を聞いて引き返した。' }),
      Object.freeze({ speaker: '四門衛兵', text: '四つの水門が閉じたままでは地下の水圧が街を持ち上げてしまう。祭壇の異変を止めてくれ。' })
    ]) }),
    'crossroads-merchant-restored': Object.freeze({ id: 'crossroads-merchant-restored', lines: Object.freeze([
      Object.freeze({ speaker: '東西商会の番頭', text: '四つの水門が開き、東西の荷馬車も港からの舟荷も戻ってきた。クアドラの市場が、ようやく息を吹き返したよ。' })
    ]) }),
    'crossroads-guide-restored': Object.freeze({ id: 'crossroads-guide-restored', lines: Object.freeze([
      Object.freeze({ speaker: '水路番の娘', text: '方位核は正常な速さで回っているわ。地下水路の音も、昔のように穏やかになった。助けてくれてありがとう。' }),
      Object.freeze({ speaker: '水路番の娘', text: 'そういえば、青灰色の外套を着た若い地図読みがあなたを追ってきたわ。エルドの保守路の写しを確かめると、北の霧へ急いでいった。' })
    ]) }),
    'crossroads-guard-restored': Object.freeze({ id: 'crossroads-guard-restored', lines: Object.freeze([
      Object.freeze({ speaker: '四門衛兵', text: '水門はすべて開いた。街道の見回りも再開できる。あなたが取り戻した道を、今度は我々が守ろう。' })
    ]) }),
    'crossroads-altar-awakening': Object.freeze({ id: 'crossroads-altar-awakening', onComplete: 'crossroads-altar-awaken', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '北の祭壇には、四つの水門と中央の方位核を結ぶ古い水路図が刻まれている。' }),
      Object.freeze({ speaker: '主人公', text: '方位核に紫の魔力が絡みつき、水の向きを逆転させている……。せき止められた水圧が、地下水路を暴れさせていたのか。' }),
      Object.freeze({ speaker: '地の文', text: '星の羅針盤を祭壇へかざすと、四つの水門の刻印が順に輝き、石床の奥から巨大な歯車の音が響いた。' }),
      Object.freeze({ speaker: '謎の声', text: '方位核への干渉を検知。水路守護機兵、排除命令を実行する。' })
    ]) }),
    'crossroads-altar-stable': Object.freeze({ id: 'crossroads-altar-stable', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '祭壇の方位核は正常な光をたたえ、四方へ穏やかな水音を送り出している。' })
    ]) }),
    'crossroads-boss-cleared': Object.freeze({ id: 'crossroads-boss-cleared', onComplete: 'crossroads-boss-defeated', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '守護機兵に絡んでいた紫の魔力が消え、地下水路の逆流が止まった。四つの水門が一つずつ開き、澄んだ水が本来の流れを取り戻していく。' }),
      Object.freeze({ speaker: '主人公', text: '流れは元へ戻った。でも、紫の魔力だけが北の霧へ吸い込まれていく……。水路の暴走は、あの場所へ力を送るためだったのか。' }),
      Object.freeze({ speaker: '地の文', text: '祭壇の裏には、地図師エルドの筆跡で「道は場所ではなく、人と人を結ぶ」と刻まれていた。' }),
      Object.freeze({ speaker: '地の文', visualId: 'brothers-message', text: 'その下で青星紋が淡く光り、隠されていた薄い金属板が開く。書き出しには「我が息子たちへ」とある。' }),
      Object.freeze({ speaker: '父エルドの記録', text: 'お前たちは、同じ地図をきっと違うように読む。一人が先に道を歩き、もう一人が見落とされた道を拾う。二人の見た景色を重ねた時、青星は本当の行き先を示すだろう。' }),
      Object.freeze({ speaker: '主人公', text: '息子たち……僕だけじゃない。故郷の書庫で父の記録を調べている弟ノアにも、父はこの言葉を残したんだ。' }),
      Object.freeze({ speaker: '主人公', text: '危険に巻き込みたくなくて一人で海を渡った。でも父は、最初から僕ら二人が違う道を見つけると信じていたのか。' })
    ]) }),
    'king-crossroads-report': Object.freeze({ id: 'king-crossroads-report', onComplete: 'crossroads-report-complete', lines: Object.freeze([
      Object.freeze({ speaker: 'アルディオン王', text: '四つの門が開き、交易路に人が戻ったと報せが届いた。国を結ぶ道を取り戻した功、見事である。' }),
      Object.freeze({ speaker: 'アルディオン王', text: 'エルドが二人の息子へ残した言葉も見つけたか。あの者は地図に道だけでなく、その先にいる人々を描こうとしていた。' })
    ]) }),
    'king-crossroads-reminder': Object.freeze({ id: 'king-crossroads-reminder', lines: Object.freeze([
      Object.freeze({ speaker: 'アルディオン王', text: '交差路の街クアドラへ向かい、止まった四つの街道を取り戻してくれ。' })
    ]) }),
    'king-after-crossroads': Object.freeze({ id: 'king-after-crossroads', onComplete: 'mist-mission-start', lines: Object.freeze([
      Object.freeze({ speaker: 'アルディオン王', text: '交易路は再び動き始めた。だが水路から逃れた紫の光は、北の城塞都市ヴェイルを覆う霧へ流れ込んだ。' }),
      Object.freeze({ speaker: 'アルディオン王', text: 'クアドラからもう一つ報せがある。青灰色の外套を着た若い地図読みが、おぬしの弟を名乗り、復旧した街道を北へ向かったそうだ。' }),
      Object.freeze({ speaker: '主人公', text: 'ノアが新大陸へ……。僕が直した道をたどってきたのか。追い返すより先に、霧の中で見失うわけにはいかない。' }),
      Object.freeze({ speaker: '旅の魔導士リゼ', text: '王命を待つだけでは遅いわ。霧から逃げてきた巡回兵、夜だけ鳴る鐘、仮面を着けた住民。その三つの手掛かりのうち、気になるものから追いましょう。' }),
      Object.freeze({ speaker: '主人公', text: '父の羅針盤も北を指している。誰かに頼まれたからじゃない。あの霧の向こうに何があるのか、自分で確かめたい。' })
    ]) }),
    'king-mist-reminder': Object.freeze({ id: 'king-mist-reminder', lines: Object.freeze([
      Object.freeze({ speaker: 'アルディオン王', text: '城塞都市ヴェイルの三つの噂から、真実につながる二つを選び取るのだ。父の羅針盤が示す道を、自分の目で確かめてくれ。' })
    ]) }),
    'mist-citadel-arrival': Object.freeze({ id: 'mist-citadel-arrival', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '白い霧に閉ざされた城塞都市ヴェイルへ入った。鐘楼へ続く正門は固く閉ざされ、街の人々は互いの顔を確かめるように歩いている。' }),
      Object.freeze({ speaker: '旅の魔導士リゼ', text: '手掛かりは三つ。全部を追う必要はないわ。二つを結びつければ、鐘楼へ入る道と番人の癖が見えるはずよ。' })
    ]) }),
    'mist-clue-patrol': Object.freeze({ id: 'mist-clue-patrol', onComplete: 'mist-clue:lost-patrol', lines: Object.freeze([
      Object.freeze({ speaker: '帰還した巡回兵セラ', text: '仲間は霧の中で姿を消したんじゃない。鐘が鳴るたび同じ曲がり角へ戻されていた。私は壁の傷を数えて、ようやく輪から抜けた。' }),
      Object.freeze({ speaker: '主人公', text: '霧は道を隠すだけでなく、歩いた記憶まで惑わせるのか。壁の傷をたどれば、鐘楼の保守路へ近づけそうだ。' })
    ]) }),
    'mist-clue-bell': Object.freeze({ id: 'mist-clue-bell', onComplete: 'mist-clue:night-bell', lines: Object.freeze([
      Object.freeze({ speaker: '鐘守ミナ', text: '鳴っているのは大鐘ではないの。誰も触れていない小さな帰還鐘が、夜ごと地下から答えている。音は鐘楼の裏階段で一番強くなるわ。' }),
      Object.freeze({ speaker: '旅の魔導士リゼ', text: '音に魔力を重ねて道を作っている。炎で共鳴を乱せば、番人の結界も崩せるかもしれない。' })
    ]) }),
    'mist-clue-assembly': Object.freeze({ id: 'mist-clue-assembly', onComplete: 'mist-clue:masked-assembly', lines: Object.freeze([
      Object.freeze({ speaker: '仮面職人イオ', text: '仮面は顔を隠すためじゃない。鐘の音に名前を奪われないためのものだ。集会では、鐘楼の地下へ続く音響路を見張っている。' }),
      Object.freeze({ speaker: '主人公', text: '人々は怪しい儀式をしていたんじゃない。自分たちを守りながら、侵入口を封じていたのか。' })
    ]) }),
    'mist-resident': Object.freeze({ id: 'mist-resident', lines: Object.freeze([
      Object.freeze({ speaker: '霧都の住民', text: '霧の中では、知っている道ほど疑いなさい。鐘楼へ行くなら、街で二つ以上の証言を結びつけることだ。' }),
      Object.freeze({ speaker: '霧都の住民', text: '少し前にも、地図筒を何本も抱えた若者が鐘楼の外壁を調べていた。古い排水路に帰り道を作ると言っていたよ。' })
    ]) }),
    'mist-tower-entry': Object.freeze({ id: 'mist-tower-entry', onComplete: 'brother-rescue-complete', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '二つの証言が重なり、霧の中に鐘楼へ続く道が浮かび上がった。選んだ手掛かりによって、侵入路と協力者が変わる。' }),
      Object.freeze({ speaker: '地の文', text: '鐘楼へ踏み込んだ瞬間、背後の床が崩れ、霧が来た道を塗りつぶした。星の羅針盤は激しく回り、帰る方角を失っている。' }),
      Object.freeze({ speaker: '弟ノア', visualId: 'brother-rescue', text: '兄さん、聞こえる？　父の保守路は正門だけじゃない。排水路の古い巻上げ機を動かせば、そこに帰り道を固定できる！' }),
      Object.freeze({ speaker: '主人公', text: 'ノア……本当に海を渡ってきたのか。どうしてここまで。' }),
      Object.freeze({ speaker: '弟ノア', visualId: 'brother-rescue', text: '兄さんが西の街道を直して、四つの水門を開いたから、ここまで来られた。だから今度は、僕が兄さんの帰り道を作る。' }),
      Object.freeze({ speaker: '弟ノア', text: '巻上げ機は僕が押さえる。番人を倒すのは兄さんの役目だ。帰ったら、勝手に来たことはいくらでも叱られるよ。' })
    ]) }),
    'mist-tower-reentry': Object.freeze({ id: 'mist-tower-reentry', lines: Object.freeze([
      Object.freeze({ speaker: '弟ノア', text: '帰還路は固定してある。霧が濃くなっても、巻上げ機につないだ青い縄をたどれば街へ戻れるよ。' })
    ]) }),
    'mist-bell-awakening': Object.freeze({ id: 'mist-bell-awakening', onComplete: 'mist-bell-awaken', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '鐘楼の最上部で、星の羅針盤がひとりでに回り始めた。霧鐘の内部から、羅針盤と同じ光が応える。' }),
      Object.freeze({ speaker: '主人公', text: '父の道具に反応している……いや、僕自身を待っていたような光だ。' }),
      Object.freeze({ speaker: '弟ノア', text: '帰還路はまだつながっている。ここは僕が支えるから、兄さんは前だけを見て。' }),
      Object.freeze({ speaker: '謎の声', text: '帰還者を確認。閉ざされた道を守るため、霧鐘の番人を起動する。' })
    ]) }),
    'mist-boss-cleared': Object.freeze({ id: 'mist-boss-cleared', onComplete: 'mist-boss-defeated', lines: Object.freeze([
      Object.freeze({ speaker: '地の文', text: '番人が沈黙すると、鐘は初めて澄んだ音を響かせた。街を覆っていた霧がほどけ、塔と庭園が夕空の下へ姿を現す。' }),
      Object.freeze({ speaker: '旅の魔導士リゼ', text: 'この番人は侵入者を呼び込んだのではなく、何かを外へ出さないために目覚めたみたい。異変の原因は、もっと奥にある。' }),
      Object.freeze({ speaker: '弟ノア', text: '巻上げ機のそばで、父の筆跡がある別の保守図を見つけた。僕は街へ戻って写しを作る。兄さんは王へ報告して。' })
    ]) }),
    'king-mist-report': Object.freeze({ id: 'king-mist-report', onComplete: 'mist-report-complete', lines: Object.freeze([
      Object.freeze({ speaker: 'アルディオン王', text: 'ヴェイルの霧が晴れ、北方との往来が戻った。三つの噂から真実を選び取った判断、見事であった。' }),
      Object.freeze({ speaker: 'アルディオン王', text: '先に道を歩く兄と、見落とされた保守路を拾う弟。エルドの言葉どおり、二人の見た景色が重なって霧の道を開いたのだな。' }),
      Object.freeze({ speaker: 'アルディオン王', text: '鐘楼がエルドの羅針盤だけでなく、おぬし自身へ反応したことは気に掛かる。次の記録が届くまで、その羅針盤を手放してはならぬ。' })
    ]) }),
    'king-after-mist': Object.freeze({ id: 'king-after-mist', lines: Object.freeze([
      Object.freeze({ speaker: 'アルディオン王', text: '北の霧は晴れた。だが東の高地では、二つの都市が互いの姿を見失いつつあるという。' }),
      Object.freeze({ speaker: 'アルディオン王', text: 'ノアはクアドラで各地の古地図を重ねている。次の道では、おぬしが進み、弟が別の場所から見落としを拾うことになるだろう。' })
    ]) }),
    'brother-veil': Object.freeze({ id: 'brother-veil', lines: Object.freeze([
      Object.freeze({ speaker: '弟ノア', text: '兄さんが鐘楼へいる間、僕は排水路と巻上げ機を調べる。戦う力はなくても、帰り道なら守れる。' }),
      Object.freeze({ speaker: '主人公', text: '無茶をしたのはお互い様か。終わったら、どうやって海を渡ったのか全部聞かせてもらう。' })
    ]) }),
    'brother-capital': Object.freeze({ id: 'brother-capital', lines: Object.freeze([
      Object.freeze({ speaker: '弟ノア', text: '王への報告が終わるまで、僕は城の記録庫で父の保守図を照合している。兄さんと同じ道を歩くためじゃない。見落とされた道を拾うために来たんだ。' })
    ]) }),
    'brother-quadra': Object.freeze({ id: 'brother-quadra', lines: Object.freeze([
      Object.freeze({ speaker: '弟ノア', text: 'クアドラなら四方から地図と旅人の話が集まる。僕はここを拠点にするよ。必要な時は別の街にも先回りして、兄さんが見えない側の道を確かめる。' }),
      Object.freeze({ speaker: '弟ノア', text: '父の青星紋は一人を同じ方角へ縛る印じゃない。違う方向へ進んでも、中央の帰る場所を忘れないための印なんだと思う。' })
    ]) }),
    'first-magic': Object.freeze({
      id: 'first-magic',
      lines: Object.freeze([
        Object.freeze({ speaker: '旅の魔導士リゼ', text: 'ひとりで魔物に立ち向かったの？ なかなかやるじゃない。けれど、あの紫の結界は剣だけでは破れないわ。' }),
        Object.freeze({ speaker: '主人公', text: '魔法……？ 新大陸へ来るまで、そんな力が本当に存在するなんて知らなかった。' }),
        Object.freeze({ speaker: '旅の魔導士リゼ', text: 'この火花の札をあげる。魔法は力任せに使うものじゃない。心を静めて、誰かを信じたときに応えてくれるの。' }),
        Object.freeze({ speaker: '地の文', text: '初めての魔法カード「火花」と、MPを回復する「まほうの雫」を手に入れた。' })
      ])
    }),
    'first-magic-before': Object.freeze({
      id: 'first-magic-before',
      lines: Object.freeze([
        Object.freeze({ speaker: '旅の魔導士リゼ', text: 'その札には、まだ戦いの熱が宿っていないわ。まずは剣と守りで魔物に立ち向かってみなさい。' }),
        Object.freeze({ speaker: '旅の魔導士リゼ', text: '一度でも自分の力で勝てたなら、ここへ戻ってきて。あなたの札に眠る火花を起こしてあげる。' })
      ])
    }),
    'first-magic-after': Object.freeze({
      id: 'first-magic-after',
      lines: Object.freeze([
        Object.freeze({ speaker: '旅の魔導士リゼ', text: '火花の札は、紫の結界を崩す切り札になるわ。MPが足りないときは、まほうの雫か「集中」の札を使うのよ。' })
      ])
    }),
    'soldier-greeting': Object.freeze({
      id: 'soldier-greeting',
      lines: Object.freeze([
        Object.freeze({ speaker: '王城兵', text: '王都の外では魔物が増えている。出発前に城下町で装備を整えるといい。' })
      ])
    }),
    'town-mapmaker': Object.freeze({
      id: 'town-mapmaker',
      lines: Object.freeze([
        Object.freeze({ speaker: '地図師見習いノル', text: '星の羅針盤を持っているのかい？ 師匠のエルドも、同じように街道を一歩ずつ地図へ刻んでいたよ。' })
      ])
    }),
    'town-shopper': Object.freeze({
      id: 'town-shopper',
      lines: Object.freeze([
        Object.freeze({ speaker: '買い物帰りの女性', text: '初めて街道へ出るなら、銅の剣と皮の鎧、それにやくそうを二つ。ちょうど300Gで揃うわよ。' })
      ])
    }),
    'town-traveler': Object.freeze({
      id: 'town-traveler',
      lines: Object.freeze([
        Object.freeze({ speaker: '港帰りの旅人', text: '西の街道で紫の霧を見た。王に会うまでは、むやみに城門の外へ出ないほうがいい。' })
      ])
    }),
    'town-florist': Object.freeze({
      id: 'town-florist',
      lines: Object.freeze([
        Object.freeze({ speaker: '花売りの娘', text: '中央広場の泉は旅人の目印なの。迷ったら泉へ戻れば、どの店にも行けるわ。' })
      ])
    }),
    'watchtower-locked': Object.freeze({
      id: 'watchtower-locked',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', text: '古い見張り台は紫の結界に閉ざされている。結界には四つのくぼみと、中央に魔法を注ぐための青い受け口がある。' }),
        Object.freeze({ speaker: '地の文', text: '西の港街道を徘徊する魔物から四つの封印片を集め、魔法の力を得る必要がありそうだ。' })
      ])
    }),
    'watchtower-seal-release': Object.freeze({
      id: 'watchtower-seal-release',
      onComplete: 'watchtower-seal-release',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', text: '四つの封印片が見張り台のくぼみへ吸い込まれ、青い八芒星の羅針盤が強く震え始めた。' }),
        Object.freeze({ speaker: '主人公', text: '羅針盤の光が、紫の霧を押し返している……。封印が解ける！' })
      ])
    }),
    'watchtower-cleared': Object.freeze({
      id: 'watchtower-cleared',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', text: '紫霧の番人が崩れ落ち、見張り台を覆っていた霧が晴れていく。' }),
        Object.freeze({ speaker: '主人公', text: '外から何者かが入り込んだ跡はない。ここに眠っていた古い仕組みが、父の羅針盤に反応して目覚めたのか……。' }),
        Object.freeze({ speaker: '地の文', visualId: 'watchtower-crest', text: '床の金属箱には、父の羅針盤とまったく同じ、等しい八つの光と中央の丸を持つ青い印が刻まれていた。父は確かにここへ来ていた。' }),
        Object.freeze({ speaker: '王都兵', text: '見張り台の霧が晴れたのを見て迎えに来た。王がお待ちだ。報告のため王城へ戻ろう。' })
      ])
    })
  });

  const PAST_INTERACTIONS = Object.freeze([
    Object.freeze({ id: 'capital-gate', area: 'overworld', point: PAST_START.capitalGatePoint, radius: 46, label: '王都ロプンギアへ入る', targetArea: 'castle-town', spawn: PAST_AREAS['castle-town'].spawn, dialogueOnEnter: 'capital-arrival' }),
    Object.freeze({ id: 'old-watchtower', area: 'overworld', point: Object.freeze([145, 515]), radius: 46, label: '古い見張り台を調べる', actionId: 'watchtower', unlockAfter: 'king-audience' }),
    Object.freeze({ id: 'road-mage', area: 'overworld', point: Object.freeze([205, 460]), radius: 34, label: '旅の魔導士と話す', actionId: 'learn-first-magic' }),
    Object.freeze({ id: 'frost-card-chest', area: 'overworld', point: Object.freeze([58, 248]), radius: 28, label: '青い宝箱を開ける', actionId: 'discover-card:frost', cardId: 'frost', unlockAfter: 'watchtower-boss' }),
    Object.freeze({ id: 'mend-card-chest', area: 'overworld', point: Object.freeze([108, 318]), radius: 28, label: '白い宝箱を開ける', actionId: 'discover-card:mend', cardId: 'mend', unlockAfter: 'watchtower-boss' }),
    Object.freeze({ id: 'crossroads-gate', area: 'overworld', point: Object.freeze([416, 354]), radius: 42, label: '交差路の街クアドラへ入る', targetArea: 'crossroads-town', spawn: PAST_AREAS['crossroads-town'].spawn, unlockAfter: 'first-mission-complete', dialogueOnEnter: 'crossroads-arrival' }),
    Object.freeze({ id: 'castle-door', area: 'castle-town', point: Object.freeze([700, 515]), radius: 72, label: '王城へ入る', targetArea: 'castle', spawn: PAST_AREAS.castle.spawn }),
    Object.freeze({ id: 'capital-exit', area: 'castle-town', point: Object.freeze([700, 950]), radius: 55, label: '新大陸の街道へ戻る', targetArea: 'overworld', spawn: PAST_START.capitalGatePoint }),
    Object.freeze({ id: 'castle-exit', area: 'castle', point: Object.freeze([500, 720]), radius: 52, label: '城下町へ戻る', targetArea: 'castle-town', spawn: Object.freeze([700, 575]) }),
    Object.freeze({ id: 'king', area: 'castle', point: Object.freeze([500, 190]), radius: 90, label: '王と話す', dialogueId: 'king-audience' }),
    Object.freeze({ id: 'soldier-left', area: 'castle', point: Object.freeze([365, 330]), radius: 65, label: '兵士と話す', dialogueId: 'soldier-greeting' }),
    Object.freeze({ id: 'soldier-right', area: 'castle', point: Object.freeze([635, 330]), radius: 65, label: '兵士と話す', dialogueId: 'soldier-greeting' }),
    Object.freeze({ id: 'soldier-door', area: 'castle', point: Object.freeze([420, 610]), radius: 72, label: '門衛と話す', dialogueId: 'soldier-greeting' }),
    ...TOWN_NPCS.map(npc => Object.freeze({ id: npc.id, area: 'castle-town', point: npc.point, radius: 54, label: `${npc.name}と話す`, dialogueId: npc.dialogueId })),
    ...CROSSROADS_NPCS.map(npc => Object.freeze({ id: npc.id, area: 'crossroads-town', point: npc.point, radius: 54, label: `${npc.name}と話す`, dialogueId: npc.dialogueId })),
    ...CROSSROADS_BUILDINGS.map(building => Object.freeze({
      id: building.id,
      area: 'crossroads-town',
      point: building.servicePoint,
      radius: building.type === 'card' ? 78 : 72,
      label: `${building.label}を利用する`,
      serviceId: building.type
    })),
    Object.freeze({ id: 'crossroads-town-exit', area: 'crossroads-town', point: Object.freeze([600, 835]), radius: 58, label: '街道へ戻る', targetArea: 'overworld', spawn: Object.freeze([416, 354]) }),
    Object.freeze({ id: 'crossroads-dungeon-door', area: 'crossroads-town', point: Object.freeze([600, 145]), radius: 62, label: '四門水路へ降りる', targetArea: 'crossroads-dungeon', spawn: PAST_AREAS['crossroads-dungeon'].spawn }),
    Object.freeze({ id: 'crossroads-dungeon-exit', area: 'crossroads-dungeon', point: Object.freeze([1830, 2550]), radius: 48, label: '交差路の街へ戻る', targetArea: 'crossroads-town', spawn: Object.freeze([600, 185]) }),
    Object.freeze({ id: 'armory-coffer', area: 'crossroads-dungeon', point: Object.freeze([570, 2130]), radius: 42, label: '武具庫の宝箱を開ける', actionId: 'dungeon-treasure:armory-coffer' }),
    Object.freeze({ id: 'merchant-cache', area: 'crossroads-dungeon', point: Object.freeze([3150, 2130]), radius: 42, label: '商人の備蓄箱を開ける', actionId: 'dungeon-treasure:merchant-cache' }),
    Object.freeze({ id: 'rune-coffer', area: 'crossroads-dungeon', point: Object.freeze([570, 630]), radius: 42, label: '方位石の宝箱を開ける', actionId: 'dungeon-treasure:rune-coffer' }),
    Object.freeze({ id: 'crossroads-boss-altar', area: 'crossroads-dungeon', point: Object.freeze([1830, 150]), radius: 66, label: '北の祭壇を調べる', actionId: 'crossroads-boss' }),
    Object.freeze({ id: 'quadra-sidequest-board', area: 'crossroads-town', point: Object.freeze([600, 690]), radius: 68, label: '旅人の依頼板を読む', actionId: 'sidequest-board', unlockAfter: 'crossroads-boss' }),
    ...SIDE_QUESTS.map(quest => Object.freeze({
      id: quest.entranceInteractionId,
      area: 'overworld',
      point: quest.overworldPoint,
      radius: 38,
      label: `${quest.title}へ入る`,
      targetArea: quest.dungeonId,
      spawn: SIDE_DUNGEONS[quest.dungeonId].spawn,
      unlockAfter: 'crossroads-boss',
      dialogueOnEnter: `${quest.id}-entrance`,
      sideQuestId: quest.id
    })),
    ...SIDE_QUESTS.flatMap(quest => [
      Object.freeze({
        id: `${quest.id}-exit`, area: quest.dungeonId,
        point: SIDE_DUNGEONS[quest.dungeonId].spawn, radius: 50,
        label: '地上の街道へ戻る', targetArea: 'overworld', spawn: quest.overworldPoint,
        sideQuestId: quest.id
      }),
      Object.freeze({
        id: `${quest.id}-boss-altar`, area: quest.dungeonId,
        point: Object.freeze([1350, 150]), radius: 72,
        label: '最奥の祭壇を調べる', actionId: `sidequest-boss:${quest.id}`,
        sideQuestId: quest.id
      })
    ]),
    Object.freeze({
      id: 'fire-rat-chief', area: 'molten-crown-caldera', point: Object.freeze([1350, 1050]), radius: 70,
      label: '火鼠の群れを調べる', actionId: 'sidequest-midboss:fire-rat-chief', sideQuestId: 'molten-crown'
    }),
    Object.freeze({
      id: 'molten-sluice-west', area: 'molten-crown-caldera', point: Object.freeze([630, 930]), radius: 58,
      label: '西の冷却水門を動かす', actionId: 'sidequest-sluice:west', sideQuestId: 'molten-crown'
    }),
    Object.freeze({
      id: 'molten-sluice-east', area: 'molten-crown-caldera', point: Object.freeze([2070, 930]), radius: 58,
      label: '東の冷却水門を動かす', actionId: 'sidequest-sluice:east', sideQuestId: 'molten-crown'
    }),
    Object.freeze({ id: 'mist-citadel-gate', area: 'overworld', point: Object.freeze([337, 240]), radius: 44, label: '霧の城塞都市へ入る', targetArea: 'mist-citadel', spawn: PAST_AREAS['mist-citadel'].spawn, unlockAfter: 'third-mission', dialogueOnEnter: 'mist-citadel-arrival' }),
    Object.freeze({ id: 'mist-citadel-exit', area: 'mist-citadel', point: Object.freeze([800, 1040]), radius: 58, label: '北の街道へ戻る', targetArea: 'overworld', spawn: Object.freeze([337, 240]) }),
    Object.freeze({ id: 'mist-bell-tower-door', area: 'mist-citadel', point: Object.freeze([800, 410]), radius: 70, label: '霧の向こうの鐘楼へ入る', targetArea: 'mist-bell-tower', spawn: PAST_AREAS['mist-bell-tower'].spawn, unlockAfter: 'mist-clues', dialogueOnEnter: 'mist-tower-entry' }),
    ...MIST_CITADEL_NPCS.map(npc => Object.freeze({ id: npc.id, area: 'mist-citadel', point: npc.point, radius: 56, label: `${npc.name}と話す`, dialogueId: npc.dialogueId })),
    ...BROTHER_NPCS.map(npc => Object.freeze({
      id: npc.id, area: npc.area, point: npc.point, radius: 58,
      label: `${npc.name}と話す`, dialogueId: npc.dialogueId, brotherStage: npc.brotherStage
    })),
    ...MIST_BUILDINGS.map(building => Object.freeze({
      id: building.id,
      area: 'mist-citadel',
      point: building.servicePoint,
      radius: building.type === 'card' ? 78 : 72,
      label: `${building.label}を利用する`,
      serviceId: building.type
    })),
    Object.freeze({ id: 'mist-tower-exit', area: 'mist-bell-tower', point: Object.freeze([900, 1340]), radius: 58, label: '城塞都市へ戻る', targetArea: 'mist-citadel', spawn: Object.freeze([800, 420]) }),
    Object.freeze({ id: 'bell-armory', area: 'mist-bell-tower', point: Object.freeze([450, 650]), radius: 46, label: '鐘楼の武具箱を開ける', actionId: 'dungeon-treasure:bell-armory' }),
    Object.freeze({ id: 'fog-cache', area: 'mist-bell-tower', point: Object.freeze([1350, 650]), radius: 46, label: '霧払いの備蓄箱を開ける', actionId: 'dungeon-treasure:fog-cache' }),
    Object.freeze({ id: 'mist-bell-altar', area: 'mist-bell-tower', point: Object.freeze([900, 150]), radius: 78, label: '霧鐘の祭壇を調べる', actionId: 'mist-bell-boss' }),
    Object.freeze({ id: 'weapon-shop', area: 'castle-town', point: Object.freeze([230, 385]), radius: 84, label: '武器屋で買い物する', serviceId: 'weapon' }),
    Object.freeze({ id: 'armor-shop', area: 'castle-town', point: Object.freeze([1240, 390]), radius: 84, label: '防具屋で買い物する', serviceId: 'armor' }),
    Object.freeze({ id: 'item-shop', area: 'castle-town', point: Object.freeze([215, 680]), radius: 84, label: '道具屋で買い物する', serviceId: 'item' }),
    Object.freeze({ id: 'inn', area: 'castle-town', point: Object.freeze([1180, 725]), radius: 92, label: '宿屋に泊まる', serviceId: 'inn' }),
    Object.freeze({ id: 'card-shop', area: 'castle-town', point: Object.freeze([195, 950]), radius: 210, label: 'カード屋で買い物する', serviceId: 'card' })
  ]);

  function createPastStory(saved = {}) {
    const area = Object.hasOwn(PAST_AREAS, saved.area) ? saved.area : 'overworld';
    const phase = ['arrival', 'seek-king', 'first-mission', 'first-mission-report', 'first-mission-complete', 'second-mission', 'second-mission-report', 'second-mission-complete', 'third-mission', 'third-mission-report', 'third-mission-complete'].includes(saved.phase) ? saved.phase : 'arrival';
    const parsedGold = Number(saved.gold);
    const hasCapitalArrivalFlag = Object.hasOwn(saved, 'capitalArrivalSeen');
    const capitalArrivalSeen = hasCapitalArrivalFlag
      ? Boolean(saved.capitalArrivalSeen)
      : area !== 'overworld' || !['arrival', 'seek-king'].includes(phase);
    const brotherMessageSeen = Object.hasOwn(saved, 'brotherMessageSeen')
      ? Boolean(saved.brotherMessageSeen)
      : BROTHER_MESSAGE_PHASES.includes(phase);
    const brotherRescueSeen = Object.hasOwn(saved, 'brotherRescueSeen')
      ? Boolean(saved.brotherRescueSeen)
      : BROTHER_RESCUE_PHASES.includes(phase);
    return {
      area,
      phase,
      gold: Number.isFinite(parsedGold) && parsedGold >= 0 ? Math.floor(parsedGold) : 0,
      arrivalSeen: Boolean(saved.arrivalSeen || phase !== 'arrival'),
      tutorialRescueSeen: Boolean(saved.tutorialRescueSeen),
      capitalArrivalSeen,
      royalRewardClaimed: Boolean(saved.royalRewardClaimed || !['arrival', 'seek-king'].includes(phase)),
      brotherMessageSeen: brotherMessageSeen || brotherRescueSeen,
      brotherRescueSeen,
      crossroadsClues: [...new Set(Array.isArray(saved.crossroadsClues) ? saved.crossroadsClues.filter(id => CROSSROADS_CLUE_IDS.includes(id)) : [])],
      mistClues: [...new Set(Array.isArray(saved.mistClues) ? saved.mistClues.filter(id => MIST_CLUE_IDS.includes(id)) : [])]
    };
  }

  function addStoryGold(state, amount) {
    const safeAmount = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    return { ...state, gold: state.gold + safeAmount };
  }

  function completeStoryEvent(state, eventId) {
    if (eventId === 'arrival-complete' && state.phase === 'arrival') {
      return { ...state, phase: 'seek-king', arrivalSeen: true };
    }
    if (eventId === 'arrival-rescue-complete' && state.phase === 'seek-king' && !state.tutorialRescueSeen) {
      return { ...state, tutorialRescueSeen: true };
    }
    if (eventId === 'capital-arrival-complete' && !state.capitalArrivalSeen) {
      return { ...state, capitalArrivalSeen: true };
    }
    if (eventId === 'king-audience-complete' && !state.royalRewardClaimed) {
      return {
        ...state,
        phase: 'first-mission',
        gold: state.gold + 300,
        royalRewardClaimed: true
      };
    }
    if (eventId === 'watchtower-boss-defeated' && state.phase === 'first-mission') {
      return { ...state, phase: 'first-mission-report' };
    }
    if (eventId === 'first-mission-report-complete' && state.phase === 'first-mission-report') {
      return { ...state, phase: 'first-mission-complete' };
    }
    if (eventId === 'crossroads-mission-start' && state.phase === 'first-mission-complete') return { ...state, phase: 'second-mission' };
    if (eventId.startsWith('crossroads-clue:') && state.phase === 'second-mission') {
      const clueId = eventId.slice('crossroads-clue:'.length);
      if (!CROSSROADS_CLUE_IDS.includes(clueId) || state.crossroadsClues.includes(clueId)) return state;
      return { ...state, crossroadsClues: [...state.crossroadsClues, clueId] };
    }
    if (eventId === 'crossroads-boss-defeated' && state.phase === 'second-mission') {
      return { ...state, phase: 'second-mission-report', brotherMessageSeen: true };
    }
    if (eventId === 'crossroads-report-complete' && state.phase === 'second-mission-report') return { ...state, phase: 'second-mission-complete' };
    if (eventId === 'mist-mission-start' && state.phase === 'second-mission-complete') return { ...state, phase: 'third-mission' };
    if (eventId === 'brother-rescue-complete' && state.phase === 'third-mission' && !state.brotherRescueSeen) {
      return { ...state, brotherMessageSeen: true, brotherRescueSeen: true };
    }
    if (eventId.startsWith('mist-clue:') && state.phase === 'third-mission') {
      const clueId = eventId.slice('mist-clue:'.length);
      if (!MIST_CLUE_IDS.includes(clueId) || state.mistClues.includes(clueId)) return state;
      return { ...state, mistClues: [...state.mistClues, clueId] };
    }
    if (eventId === 'mist-boss-defeated' && state.phase === 'third-mission') {
      return { ...state, phase: 'third-mission-report', brotherMessageSeen: true, brotherRescueSeen: true };
    }
    if (eventId === 'mist-report-complete' && state.phase === 'third-mission-report') return { ...state, phase: 'third-mission-complete' };
    return state;
  }

  function storyObjective(state) {
    if (state.phase === 'arrival') return '西の港から王都ロプンギアへ向かう';
    if (state.phase === 'seek-king') return '蜘蛛守の王城で王に謁見する';
    if (state.phase === 'first-mission') return '西の港街道で起きている異変を調べる';
    if (state.phase === 'first-mission-report') return '古い見張り台の調査結果を王に報告する';
    if (state.phase === 'first-mission-complete') return '王から父の足跡につながる次の依頼を受ける';
    if (state.phase === 'second-mission') {
      const clueCount = state.crossroadsClues.length;
      return clueCount < 2 ? `交差路の街で異変の証言を集める（${clueCount}/2）` : '証言をもとに四門水路の祭壇を調べる';
    }
    if (state.phase === 'second-mission-report') return '街の復旧と、父が二人の息子へ残した記録を王へ報告する';
    if (state.phase === 'second-mission-complete') return '王と話し、北の霧へ向かう理由を確かめる';
    if (state.phase === 'third-mission') {
      const clueCount = state.mistClues.length;
      return clueCount < 2 ? `城塞都市ヴェイルで霧と鐘の証言を集める（${clueCount}/2）` : '二つの証言を結び、無響の鐘楼を調べる';
    }
    if (state.phase === 'third-mission-report') return '霧鐘の番人を退けたことを王へ報告する';
    if (state.phase === 'third-mission-complete') return '晴れた北の空と、羅針盤が示す次の道を確かめる';
    return '父の足跡について王城の調査を待つ';
  }

  function storyAllowsEncounters(state) {
    return !['arrival', 'seek-king'].includes(state.phase);
  }

  function storyEncounterMode(state, encounterId) {
    if (storyAllowsEncounters(state)) {
      const mistRegion = encounterId.startsWith('route-mist-');
      const laterRegion = encounterId.startsWith('route-') && !mistRegion;
      const secondChapterOpen = ['second-mission', 'second-mission-report', 'second-mission-complete', 'third-mission', 'third-mission-report', 'third-mission-complete'].includes(state.phase);
      const thirdChapterOpen = ['third-mission', 'third-mission-report', 'third-mission-complete'].includes(state.phase);
      if (mistRegion && !thirdChapterOpen) return 'hidden';
      if (laterRegion && !secondChapterOpen) return 'hidden';
      return 'normal';
    }
    const isTutorial = state.phase === 'seek-king'
      && !state.tutorialRescueSeen
      && !state.capitalArrivalSeen
      && encounterId === 'road-mist-east';
    return isTutorial ? 'tutorial' : 'hidden';
  }

  function storyNpcIsAvailable(state, npc) {
    if (!npc?.brotherStage) return true;
    if (!state.brotherMessageSeen || !state.brotherRescueSeen) return false;
    if (npc.brotherStage === 'veil') return state.phase === 'third-mission';
    if (npc.brotherStage === 'capital') return state.phase === 'third-mission-report';
    if (npc.brotherStage === 'quadra') return state.phase === 'third-mission-complete';
    return false;
  }

  function storyUnlocksInteraction(state, interaction) {
    if (!interaction) return false;
    if (interaction.brotherStage) return storyNpcIsAvailable(state, interaction);
    if (interaction.unlockAfter === 'king-audience') return storyAllowsEncounters(state);
    if (interaction.unlockAfter === 'first-mission-complete') return ['second-mission', 'second-mission-report', 'second-mission-complete', 'third-mission', 'third-mission-report', 'third-mission-complete'].includes(state.phase);
    if (interaction.unlockAfter === 'crossroads-boss') return ['second-mission-report', 'second-mission-complete', 'third-mission', 'third-mission-report', 'third-mission-complete'].includes(state.phase);
    if (interaction.id === 'crossroads-dungeon-door') return state.crossroadsClues.length >= 2 || !['second-mission'].includes(state.phase);
    if (interaction.unlockAfter === 'third-mission') return ['third-mission', 'third-mission-report', 'third-mission-complete'].includes(state.phase);
    if (interaction.unlockAfter === 'mist-clues') return state.mistClues.length >= 2 || ['third-mission-report', 'third-mission-complete'].includes(state.phase);
    return true;
  }

  function activatePastInteraction(state, interactionId) {
    const interaction = PAST_INTERACTIONS.find(item => item.id === interactionId && item.area === state.area);
    if (!interaction || !storyUnlocksInteraction(state, interaction)) {
      return { state, spawn: null, dialogue: null, serviceId: null, actionId: null };
    }
    if (interaction.targetArea) {
      const dialogueId = interaction.id === 'mist-bell-tower-door' && state.brotherRescueSeen
        ? 'mist-tower-reentry'
        : interaction.dialogueOnEnter;
      const dialogue = interaction.id === 'capital-gate' && state.capitalArrivalSeen
        ? null
        : STORY_DIALOGUES[dialogueId] || null;
      return {
        state: { ...state, area: interaction.targetArea },
        spawn: interaction.spawn,
        dialogue,
        serviceId: null,
        actionId: null
      };
    }
    const crossroadsRestored = ['second-mission-report', 'second-mission-complete', 'third-mission', 'third-mission-report', 'third-mission-complete'].includes(state.phase);
    const crossroadsNpc = CROSSROADS_NPCS.some(npc => npc.id === interaction.id);
    let dialogueId = interaction.dialogueId;
    if (crossroadsNpc && crossroadsRestored) dialogueId = `${interaction.dialogueId}-restored`;
    if (interaction.id === 'king') {
      const royalDialogues = {
        'first-mission-report': 'king-mission-complete',
        'first-mission-complete': 'king-crossroads-mission',
        'second-mission': 'king-crossroads-reminder',
        'second-mission-report': 'king-crossroads-report',
        'second-mission-complete': 'king-after-crossroads',
        'third-mission': 'king-mist-reminder',
        'third-mission-report': 'king-mist-report',
        'third-mission-complete': 'king-after-mist'
      };
      dialogueId = royalDialogues[state.phase] || (state.royalRewardClaimed ? 'king-reminder' : interaction.dialogueId);
    }
    return {
      state,
      spawn: null,
      dialogue: STORY_DIALOGUES[dialogueId] || null,
      serviceId: interaction.serviceId || null,
      actionId: interaction.actionId || null
    };
  }

  function nearbyPastInteraction(area, position, scale = 1, isAvailable = () => true, dynamicPoints = null) {
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const interaction of PAST_INTERACTIONS) {
      if (interaction.area !== area || !isAvailable(interaction)) continue;
      const coordinateScale = area === 'overworld' ? scale : 1;
      const dynamicPoint = dynamicPoints?.get?.(interaction.id) || interaction.point;
      const x = dynamicPoint[0] * coordinateScale;
      const y = dynamicPoint[1] * coordinateScale;
      const distance = Math.hypot(position.x - x, position.y - y);
      if (distance <= interaction.radius * coordinateScale && distance < closestDistance) {
        closest = interaction;
        closestDistance = distance;
      }
    }
    return closest;
  }

  function canStandInPastArea(areaId, x, y, radius = 0, keyItems = []) {
    const area = PAST_AREAS[areaId];
    if (!area?.width || !area?.height) return false;
    if (areaId === 'crossroads-dungeon') return dungeonPointIsWalkable(x, y, radius);
    if (SIDE_DUNGEONS[areaId]) return sideQuestDungeonPointIsWalkable(areaId, x, y, radius, keyItems);
    const margin = 34 + radius;
    if (x < margin || y < margin || x > area.width - margin || y > area.height - margin) return false;
    const collisionRects = areaId === 'castle-town'
      ? TOWN_COLLISION_RECTS
      : areaId === 'castle'
        ? CASTLE_COLLISION_RECTS
        : areaId === 'crossroads-town'
          ? CROSSROADS_TOWN_COLLISION_RECTS
          : areaId === 'mist-citadel'
            ? MIST_CITADEL_COLLISION_RECTS
            : areaId === 'mist-bell-tower'
              ? MIST_TOWER_COLLISION_RECTS
              : [];
    return collisionRects.every(rect => {
      const [left, top, width, height] = rect;
      const padding = radius + 8;
      return x < left - padding || x > left + width + padding || y < top - padding || y > top + height + padding;
    });
  }

  function dungeonPointIsWalkable(x, y, radius = 0) {
    const { columns, rows, tileSize } = CROSSROADS_DUNGEON_LAYOUT;
    const samples = [
      [x, y], [x - radius, y], [x + radius, y], [x, y - radius], [x, y + radius],
      [x - radius, y - radius], [x + radius, y - radius], [x - radius, y + radius], [x + radius, y + radius]
    ];
    return samples.every(([sampleX, sampleY]) => {
      const column = Math.floor(sampleX / tileSize);
      const row = Math.floor(sampleY / tileSize);
      if (column < 0 || row < 0 || column >= columns || row >= rows.length) return false;
      return ['.', '=', '>', 'A'].includes(rows[row][column]);
    });
  }

  function nearestWalkablePoint(point, isWalkable, maxRadius = 256, step = 8) {
    if (isWalkable(point[0], point[1])) return [...point];
    for (let radius = step; radius <= maxRadius; radius += step) {
      for (let offset = -radius; offset <= radius; offset += step) {
        const candidates = [
          [point[0] + offset, point[1] - radius],
          [point[0] + radius, point[1] + offset],
          [point[0] - offset, point[1] + radius],
          [point[0] - radius, point[1] - offset]
        ];
        for (const candidate of candidates) {
          if (isWalkable(candidate[0], candidate[1])) return candidate;
        }
      }
    }
    return [...point];
  }

  function mistInvestigationResult(state) {
    const clues = new Set(Array.isArray(state?.mistClues) ? state.mistClues : []);
    if (clues.has('lost-patrol') && clues.has('night-bell')) {
      return { approach: '壁の傷を数えて保守路を進む', ally: '巡回兵セラ', bossWeakness: '炎' };
    }
    if (clues.has('lost-patrol') && clues.has('masked-assembly')) {
      return { approach: '仮面で名を守り、音響路を進む', ally: '仮面職人イオ', bossWeakness: '氷' };
    }
    if (clues.has('night-bell') && clues.has('masked-assembly')) {
      return { approach: '帰還鐘の響きを追って裏階段を進む', ally: '鐘守ミナ', bossWeakness: '炎' };
    }
    return { approach: '', ally: '', bossWeakness: '' };
  }

  function setDebugQuestCompletion(story, campaign, questId, completed) {
    const nextStory = { ...story };
    const nextCampaign = { ...campaign };
    if (questId === 'watchtower') {
      if (completed) {
        nextCampaign.bossDefeated = true;
        nextCampaign.watchtowerReached = true;
        if (!['second-mission', 'second-mission-report', 'second-mission-complete', 'third-mission', 'third-mission-report', 'third-mission-complete'].includes(nextStory.phase)) {
          nextStory.phase = 'first-mission-complete';
        }
      } else {
        nextStory.phase = 'first-mission';
        nextStory.crossroadsClues = [];
        nextStory.mistClues = [];
        nextStory.brotherMessageSeen = false;
        nextStory.brotherRescueSeen = false;
        nextCampaign.bossDefeated = false;
        nextCampaign.crossroadsBossDefeated = false;
        nextCampaign.mistBossDefeated = false;
        nextCampaign.watchtowerReached = false;
        nextCampaign.sealFragments = [];
      }
      return { story: nextStory, campaign: nextCampaign };
    }
    if (questId === 'crossroads') {
      nextCampaign.bossDefeated = true;
      nextCampaign.watchtowerReached = true;
      nextCampaign.crossroadsBossDefeated = Boolean(completed);
      nextStory.brotherMessageSeen = Boolean(completed);
      nextStory.brotherRescueSeen = false;
      if (!completed) {
        nextCampaign.mistBossDefeated = false;
        nextStory.crossroadsClues = [];
        nextStory.mistClues = [];
      }
      nextStory.phase = completed ? 'second-mission-complete' : 'second-mission';
      return { story: nextStory, campaign: nextCampaign };
    }
    if (questId === 'mist-citadel') {
      nextCampaign.bossDefeated = true;
      nextCampaign.crossroadsBossDefeated = true;
      nextCampaign.mistBossDefeated = Boolean(completed);
      nextStory.brotherMessageSeen = true;
      nextStory.brotherRescueSeen = Boolean(completed);
      if (!completed) nextStory.mistClues = [];
      nextStory.phase = completed ? 'third-mission-complete' : 'third-mission';
      return { story: nextStory, campaign: nextCampaign };
    }
    return { story, campaign };
  }

  return {
    BROTHER_NPCS,
    CASTLE_COLLISION_RECTS,
    CASTLE_NPCS,
    CROSSROADS_BUILDINGS,
    CROSSROADS_CLUE_IDS,
    CROSSROADS_DUNGEON_LAYOUT,
    CROSSROADS_NPCS,
    CROSSROADS_WATERGATES,
    MIST_BUILDINGS,
    MIST_CITADEL_COLLISION_RECTS,
    MIST_CITADEL_NPCS,
    MIST_CLUE_IDS,
    MIST_TOWER_COLLISION_RECTS,
    PAST_AREAS,
    PAST_INTERACTIONS,
    PAST_START,
    STORY_DIALOGUES,
    TOWN_BUILDINGS,
    TOWN_NPCS,
    TOWN_WALLS,
    activatePastInteraction,
    addStoryGold,
    canStandInPastArea,
    completeStoryEvent,
    createPastStory,
    dungeonPointIsWalkable,
    nearestWalkablePoint,
    nearbyPastInteraction,
    mistInvestigationResult,
    setDebugQuestCompletion,
    storyAllowsEncounters,
    storyEncounterMode,
    storyNpcIsAvailable,
    storyUnlocksInteraction,
    storyObjective
  };
});
