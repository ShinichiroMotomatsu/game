(function exposeEditionDefinitions(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_EDITIONS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const definitions = Object.freeze({
    modern: Object.freeze({
      id: 'modern',
      label: '現代編-昼間',
      subtitle: 'MODERN · DAY',
      tileDirectory: 'day-runtime-tiles',
      tileVersion: 1,
      landmarkDirectory: 'landmarks',
      uiTheme: 'modern',
      showMapLabels: true,
      hasEncounters: false
    }),
    past: Object.freeze({
      id: 'past',
      label: '過去編-夕方',
      subtitle: 'PAST · EVENING',
      tileDirectory: 'past-evening-runtime-tiles',
      tileVersion: 2,
      landmarkDirectory: 'past-landmarks',
      landmarkSizeOverrides: Object.freeze({
        // The source sprite is tightly cropped after removing sheet-edge bleed.
        // Preserve the tower's former on-map width and shortened fantasy height.
        'tokyo-tower': Object.freeze({ widthScale: 0.59, heightScale: 0.53 })
      }),
      uiTheme: 'past',
      showMapLabels: false,
      hasEncounters: true
    })
  });

  function normalizeEdition(value) {
    return Object.hasOwn(definitions, value) ? value : 'modern';
  }

  function editionDefinition(value) {
    return definitions[normalizeEdition(value)];
  }

  function editionLandmarkImage(value, filename) {
    return `assets/v2/${editionDefinition(value).landmarkDirectory}/${filename}`;
  }

  return { editionDefinition, editionLandmarkImage, normalizeEdition };
});
