(function exposePastStory(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_STORY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
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
    })
  });

  const TOWN_BUILDINGS = Object.freeze([
    Object.freeze({ id: 'royal-castle', type: 'castle', label: '蜘蛛守の王城', icon: '♜', rect: Object.freeze([430, 60, 540, 260]), color: '#8d4850' }),
    Object.freeze({ id: 'weapon-shop', type: 'weapon', label: '武器屋「鉄蜘蛛」', icon: '⚔', rect: Object.freeze([90, 150, 260, 190]), color: '#8c4a32' }),
    Object.freeze({ id: 'armor-shop', type: 'armor', label: '防具屋「銀の殻」', icon: '⬟', rect: Object.freeze([1050, 150, 260, 190]), color: '#465b74' }),
    Object.freeze({ id: 'item-shop', type: 'item', label: '道具屋「旅支度」', icon: '⚗', rect: Object.freeze([90, 420, 260, 190]), color: '#556c3d' }),
    Object.freeze({ id: 'inn', type: 'inn', label: '宿屋「夕映え亭」', icon: '☾', rect: Object.freeze([1050, 420, 260, 190]), color: '#7c5136' }),
    Object.freeze({ id: 'card-shop', type: 'card', label: 'カード屋「星札堂」', icon: '✦', rect: Object.freeze([90, 690, 260, 190]), color: '#63467e' })
  ]);

  const CASTLE_NPCS = Object.freeze([
    Object.freeze({ id: 'king', role: 'king', name: 'アルディオン王', point: Object.freeze([500, 150]) }),
    Object.freeze({ id: 'soldier-left', role: 'soldier', name: '王城兵', point: Object.freeze([365, 300]) }),
    Object.freeze({ id: 'soldier-right', role: 'soldier', name: '王城兵', point: Object.freeze([635, 300]) }),
    Object.freeze({ id: 'soldier-door', role: 'soldier', name: '門衛', point: Object.freeze([420, 610]) })
  ]);

  const STORY_DIALOGUES = Object.freeze({
    arrival: Object.freeze({
      id: 'arrival',
      onComplete: 'arrival-complete',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', text: '長い航海の末、船は新大陸の西の港へたどり着いた。' }),
        Object.freeze({ speaker: '地の文', text: '港の先には、巨大な城を中心に築かれた王都ロプンギアが見える。まずは王都へ向かおう。' })
      ])
    }),
    'king-audience': Object.freeze({
      id: 'king-audience',
      onComplete: 'king-audience-complete',
      lines: Object.freeze([
        Object.freeze({ speaker: '王城兵', text: '旅人よ、王の御前である。無礼のないように。' }),
        Object.freeze({ speaker: 'アルディオン王', text: 'よくぞ新大陸へ来てくれた。今、この国には見過ごせぬ異変が起きている。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '西の港街道に魔物が集まり、夜ごと紫の光が海岸の古い見張り台から立ちのぼるのだ。' }),
        Object.freeze({ speaker: 'アルディオン王', text: 'まずは西の港街道を調べ、異変の原因を突き止めてほしい。' }),
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
      lines: Object.freeze([
        Object.freeze({ speaker: 'アルディオン王', text: '紫霧の番人を退けたか。西の港街道にも、ようやく人の往来が戻るだろう。' }),
        Object.freeze({ speaker: 'アルディオン王', text: '見張り台に残された紋章についてはこちらでも調べよう。まずはよく休むがよい。' })
      ])
    }),
    'soldier-greeting': Object.freeze({
      id: 'soldier-greeting',
      lines: Object.freeze([
        Object.freeze({ speaker: '王城兵', text: '王都の外では魔物が増えている。出発前に城下町で装備を整えるといい。' })
      ])
    }),
    'watchtower-locked': Object.freeze({
      id: 'watchtower-locked',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', text: '古い見張り台は紫の結界に閉ざされている。結界には四つのくぼみがある。' }),
        Object.freeze({ speaker: '地の文', text: '西の港街道を徘徊する魔物が、結界を解く封印片を持っているようだ。' })
      ])
    }),
    'watchtower-cleared': Object.freeze({
      id: 'watchtower-cleared',
      lines: Object.freeze([
        Object.freeze({ speaker: '地の文', text: '紫霧の番人が崩れ落ち、見張り台を覆っていた霧が晴れていく。' }),
        Object.freeze({ speaker: '地の文', text: '床には見覚えのない紋章が刻まれていた。異変の調査結果を王へ報告しよう。' })
      ])
    })
  });

  const PAST_INTERACTIONS = Object.freeze([
    Object.freeze({ id: 'capital-gate', area: 'overworld', point: PAST_START.capitalGatePoint, radius: 46, label: '王都ロプンギアへ入る', targetArea: 'castle-town', spawn: PAST_AREAS['castle-town'].spawn }),
    Object.freeze({ id: 'old-watchtower', area: 'overworld', point: Object.freeze([145, 515]), radius: 46, label: '古い見張り台を調べる', actionId: 'watchtower' }),
    Object.freeze({ id: 'frost-card-chest', area: 'overworld', point: Object.freeze([245, 500]), radius: 28, label: '青い宝箱を開ける', actionId: 'discover-card:frost', cardId: 'frost' }),
    Object.freeze({ id: 'mend-card-chest', area: 'overworld', point: Object.freeze([90, 570]), radius: 28, label: '白い宝箱を開ける', actionId: 'discover-card:mend', cardId: 'mend' }),
    Object.freeze({ id: 'castle-door', area: 'castle-town', point: Object.freeze([700, 360]), radius: 60, label: '王城へ入る', targetArea: 'castle', spawn: PAST_AREAS.castle.spawn }),
    Object.freeze({ id: 'capital-exit', area: 'castle-town', point: Object.freeze([700, 950]), radius: 55, label: '新大陸の街道へ戻る', targetArea: 'overworld', spawn: PAST_START.capitalGatePoint }),
    Object.freeze({ id: 'castle-exit', area: 'castle', point: Object.freeze([500, 720]), radius: 52, label: '城下町へ戻る', targetArea: 'castle-town', spawn: Object.freeze([700, 425]) }),
    Object.freeze({ id: 'king', area: 'castle', point: Object.freeze([500, 190]), radius: 90, label: '王と話す', dialogueId: 'king-audience' }),
    Object.freeze({ id: 'soldier-left', area: 'castle', point: Object.freeze([365, 330]), radius: 65, label: '兵士と話す', dialogueId: 'soldier-greeting' }),
    Object.freeze({ id: 'soldier-right', area: 'castle', point: Object.freeze([635, 330]), radius: 65, label: '兵士と話す', dialogueId: 'soldier-greeting' }),
    Object.freeze({ id: 'weapon-shop', area: 'castle-town', point: Object.freeze([385, 245]), radius: 58, label: '武器屋で買い物する', serviceId: 'weapon' }),
    Object.freeze({ id: 'armor-shop', area: 'castle-town', point: Object.freeze([1015, 245]), radius: 58, label: '防具屋で買い物する', serviceId: 'armor' }),
    Object.freeze({ id: 'item-shop', area: 'castle-town', point: Object.freeze([385, 515]), radius: 58, label: '道具屋で買い物する', serviceId: 'item' }),
    Object.freeze({ id: 'inn', area: 'castle-town', point: Object.freeze([1015, 515]), radius: 58, label: '宿屋に泊まる', serviceId: 'inn' }),
    Object.freeze({ id: 'card-shop', area: 'castle-town', point: Object.freeze([385, 785]), radius: 58, label: 'カード屋で買い物する', serviceId: 'card' })
  ]);

  function createPastStory(saved = {}) {
    const area = Object.hasOwn(PAST_AREAS, saved.area) ? saved.area : 'overworld';
    const phase = ['arrival', 'seek-king', 'first-mission', 'first-mission-complete'].includes(saved.phase) ? saved.phase : 'arrival';
    const parsedGold = Number(saved.gold);
    return {
      area,
      phase,
      gold: Number.isFinite(parsedGold) && parsedGold >= 0 ? Math.floor(parsedGold) : 0,
      arrivalSeen: Boolean(saved.arrivalSeen || phase !== 'arrival'),
      royalRewardClaimed: Boolean(saved.royalRewardClaimed || phase === 'first-mission' || phase === 'first-mission-complete')
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
    if (eventId === 'king-audience-complete' && !state.royalRewardClaimed) {
      return {
        ...state,
        phase: 'first-mission',
        gold: state.gold + 300,
        royalRewardClaimed: true
      };
    }
    if (eventId === 'watchtower-boss-defeated' && state.phase === 'first-mission') {
      return { ...state, phase: 'first-mission-complete' };
    }
    return state;
  }

  function storyObjective(state) {
    if (state.phase === 'arrival') return '西の港から王都ロプンギアへ向かう';
    if (state.phase === 'seek-king') return '蜘蛛守の王城で王に謁見する';
    if (state.phase === 'first-mission') return '西の港街道で起きている異変を調べる';
    return '古い見張り台の調査結果を王に報告する';
  }

  function storyAllowsEncounters(state) {
    return state.phase === 'first-mission' || state.phase === 'first-mission-complete';
  }

  function activatePastInteraction(state, interactionId) {
    const interaction = PAST_INTERACTIONS.find(item => item.id === interactionId && item.area === state.area);
    if (!interaction) return { state, spawn: null, dialogue: null, serviceId: null, actionId: null };
    if (interaction.targetArea) {
      return {
        state: { ...state, area: interaction.targetArea },
        spawn: interaction.spawn,
        dialogue: null,
        serviceId: null,
        actionId: null
      };
    }
    const dialogueId = interaction.id === 'king' && state.phase === 'first-mission-complete'
      ? 'king-mission-complete'
      : interaction.id === 'king' && state.royalRewardClaimed
        ? 'king-reminder'
        : interaction.dialogueId;
    return {
      state,
      spawn: null,
      dialogue: STORY_DIALOGUES[dialogueId] || null,
      serviceId: interaction.serviceId || null,
      actionId: interaction.actionId || null
    };
  }

  function nearbyPastInteraction(area, position, scale = 1) {
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const interaction of PAST_INTERACTIONS) {
      if (interaction.area !== area) continue;
      const coordinateScale = area === 'overworld' ? scale : 1;
      const x = interaction.point[0] * coordinateScale;
      const y = interaction.point[1] * coordinateScale;
      const distance = Math.hypot(position.x - x, position.y - y);
      if (distance <= interaction.radius * coordinateScale && distance < closestDistance) {
        closest = interaction;
        closestDistance = distance;
      }
    }
    return closest;
  }

  function canStandInPastArea(areaId, x, y, radius = 0) {
    const area = PAST_AREAS[areaId];
    if (!area?.width || !area?.height) return false;
    const margin = 34 + radius;
    if (x < margin || y < margin || x > area.width - margin || y > area.height - margin) return false;
    if (areaId !== 'castle-town') return true;
    return TOWN_BUILDINGS.every(building => {
      const [left, top, width, height] = building.rect;
      const padding = radius + 8;
      return x < left - padding || x > left + width + padding || y < top - padding || y > top + height + padding;
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

  return {
    CASTLE_NPCS,
    PAST_AREAS,
    PAST_INTERACTIONS,
    PAST_START,
    STORY_DIALOGUES,
    TOWN_BUILDINGS,
    activatePastInteraction,
    addStoryGold,
    canStandInPastArea,
    completeStoryEvent,
    createPastStory,
    nearestWalkablePoint,
    nearbyPastInteraction,
    storyAllowsEncounters,
    storyObjective
  };
});
