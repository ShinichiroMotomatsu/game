(function exposeQuestCompass(root, factory) {
  const sideQuestApi = typeof module === 'object' && module.exports
    ? require('./v2-past-sidequests.js')
    : root?.V2_PAST_SIDEQUESTS;
  const campaignApi = typeof module === 'object' && module.exports
    ? require('./v2-past-campaign.js')
    : root?.V2_PAST_CAMPAIGN;
  const storyApi = typeof module === 'object' && module.exports
    ? require('./v2-past-story.js')
    : root?.V2_PAST_STORY;
  const api = factory(sideQuestApi, campaignApi, storyApi);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_QUEST_COMPASS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, (sideQuestApi, campaignApi, storyApi) => {
  if (!sideQuestApi || !campaignApi || !storyApi) {
    throw new Error('Past quest data is required for the main-quest compass.');
  }

  const { SIDE_QUESTS } = sideQuestApi;
  const { WATCHTOWER_SEALS, canLearnFirstMagic } = campaignApi;
  const { PAST_INTERACTIONS } = storyApi;
  const interactionsById = new Map(PAST_INTERACTIONS.map(interaction => [interaction.id, interaction]));

  const TARGET_LABELS = Object.freeze({
    'capital-gate': '王都ロプンギア',
    'castle-door': '蜘蛛守の王城',
    king: 'アルディオン王',
    'castle-exit': '城下町への出口',
    'capital-exit': '新大陸の街道',
    'old-watchtower': '古い見張り台',
    'road-mage': '旅の魔導士リゼ',
    'crossroads-gate': '交差路の街クアドラ',
    'crossroads-merchant': '東西商会の番頭',
    'crossroads-guide': '水路番の娘',
    'crossroads-guard': '四門衛兵',
    'crossroads-dungeon-door': '四門水路',
    'crossroads-boss-altar': '北の祭壇',
    'crossroads-dungeon-exit': 'クアドラへの出口',
    'crossroads-town-exit': '街道への出口',
    'mist-citadel-gate': '霧の城塞都市ヴェイル',
    'mist-patrol-captain': '巡回兵セラ',
    'mist-bell-keeper': '鐘守ミナ',
    'mist-mask-artisan': '仮面職人イオ',
    'mist-bell-tower-door': '無響の鐘楼',
    'mist-bell-altar': '霧鐘の祭壇',
    'mist-tower-exit': '城塞都市への出口',
    'mist-citadel-exit': '北の街道への出口'
  });

  const CROSSROADS_CLUE_TARGETS = Object.freeze([
    Object.freeze({ clueId: 'merchant-timing', interactionId: 'crossroads-merchant' }),
    Object.freeze({ clueId: 'reverse-gates', interactionId: 'crossroads-guide' }),
    Object.freeze({ clueId: 'underground-bell', interactionId: 'crossroads-guard' })
  ]);

  const MIST_CLUE_TARGETS = Object.freeze([
    Object.freeze({ clueId: 'lost-patrol', interactionId: 'mist-patrol-captain' }),
    Object.freeze({ clueId: 'night-bell', interactionId: 'mist-bell-keeper' }),
    Object.freeze({ clueId: 'masked-assembly', interactionId: 'mist-mask-artisan' })
  ]);

  const KING_PHASES = new Set([
    'arrival',
    'seek-king',
    'first-mission-report',
    'first-mission-complete',
    'second-mission-report',
    'second-mission-complete',
    'third-mission-report'
  ]);

  function targetForInteraction(interactionId, label = TARGET_LABELS[interactionId]) {
    const interaction = interactionsById.get(interactionId);
    if (!interaction) return null;
    return {
      interactionId,
      area: interaction.area,
      point: [...interaction.point],
      radius: interaction.radius,
      label: label || interaction.label
    };
  }

  function virtualTarget(interactionId, area, point, label, radius = 56) {
    return { interactionId, area, point: [...point], radius, label };
  }

  function firstMissionFieldTarget(campaign = {}) {
    if (campaign.bossDefeated) return targetForInteraction('capital-gate');
    if (!campaign.watchtowerReached) return targetForInteraction('old-watchtower');
    if (canLearnFirstMagic(campaign)) return targetForInteraction('road-mage');
    const hasSpark = Array.isArray(campaign.ownedCards) && campaign.ownedCards.includes('spark');
    const sealCount = Array.isArray(campaign.sealFragments) ? campaign.sealFragments.length : 0;
    if (!hasSpark || sealCount < WATCHTOWER_SEALS) {
      return virtualTarget('west-road-search', 'overworld', [170, 495], '西の港街道の魔物', 72);
    }
    return targetForInteraction('old-watchtower');
  }

  function firstMissingClueTarget(progress, candidates) {
    const collected = new Set(Array.isArray(progress) ? progress : []);
    const next = candidates.find(candidate => !collected.has(candidate.clueId));
    return next ? targetForInteraction(next.interactionId) : null;
  }

  function mainQuestCompassTarget(story = {}, campaign = {}) {
    const phase = story.phase || 'arrival';
    const area = story.area || 'overworld';
    if (phase === 'third-mission-complete') return null;

    const sideQuest = SIDE_QUESTS.find(quest => quest.dungeonId === area);
    if (sideQuest) return targetForInteraction(`${sideQuest.id}-exit`, '地上への出口');

    if (area === 'crossroads-dungeon') {
      if (phase === 'second-mission' && (story.crossroadsClues?.length || 0) >= 2) {
        return targetForInteraction('crossroads-boss-altar');
      }
      return targetForInteraction('crossroads-dungeon-exit');
    }

    if (area === 'crossroads-town') {
      if (phase === 'second-mission') {
        if ((story.crossroadsClues?.length || 0) >= 2) return targetForInteraction('crossroads-dungeon-door');
        return firstMissingClueTarget(story.crossroadsClues, CROSSROADS_CLUE_TARGETS);
      }
      return targetForInteraction('crossroads-town-exit');
    }

    if (area === 'mist-bell-tower') {
      if (phase === 'third-mission' && (story.mistClues?.length || 0) >= 2) {
        return targetForInteraction('mist-bell-altar');
      }
      return targetForInteraction('mist-tower-exit');
    }

    if (area === 'mist-citadel') {
      if (phase === 'third-mission') {
        if ((story.mistClues?.length || 0) >= 2) return targetForInteraction('mist-bell-tower-door');
        return firstMissingClueTarget(story.mistClues, MIST_CLUE_TARGETS);
      }
      return targetForInteraction('mist-citadel-exit');
    }

    if (area === 'castle') {
      return KING_PHASES.has(phase) ? targetForInteraction('king') : targetForInteraction('castle-exit');
    }

    if (area === 'castle-town') {
      return KING_PHASES.has(phase) ? targetForInteraction('castle-door') : targetForInteraction('capital-exit');
    }

    if (area !== 'overworld') return null;
    if (KING_PHASES.has(phase)) return targetForInteraction('capital-gate');
    if (phase === 'first-mission') return firstMissionFieldTarget(campaign);
    if (phase === 'second-mission') return targetForInteraction('crossroads-gate');
    if (phase === 'third-mission') return targetForInteraction('mist-citadel-gate');
    return null;
  }

  function questCompassBearing(position, targetPoint, coordinateScale = 1) {
    const playerX = Number(position?.x);
    const playerY = Number(position?.y);
    const targetX = Number(targetPoint?.[0]);
    const targetY = Number(targetPoint?.[1]);
    const parsedScale = Number(coordinateScale);
    if (![playerX, playerY, targetX, targetY].every(Number.isFinite)) return null;
    const scale = Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : 1;
    const deltaX = targetX * scale - playerX;
    const deltaY = targetY * scale - playerY;
    const distance = Math.hypot(deltaX, deltaY);
    const bearing = distance === 0
      ? 0
      : (Math.atan2(deltaX, -deltaY) * 180 / Math.PI + 360) % 360;
    return { bearing, distance };
  }

  return {
    mainQuestCompassTarget,
    questCompassBearing
  };
});
