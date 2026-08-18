(function exposeDialogue(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_DIALOGUE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function createTypewriterLine(text = '') {
    const characters = Array.from(String(text));
    return Object.freeze({ characters, visibleCount: 0, complete: characters.length === 0 });
  }

  function tickTypewriterLine(line, amount = 1) {
    const visibleCount = Math.min(line.characters.length, line.visibleCount + Math.max(1, amount));
    return Object.freeze({
      characters: line.characters,
      visibleCount,
      complete: visibleCount >= line.characters.length
    });
  }

  function revealTypewriterLine(line) {
    return Object.freeze({
      characters: line.characters,
      visibleCount: line.characters.length,
      complete: true
    });
  }

  function typewriterText(line) {
    return line.characters.slice(0, line.visibleCount).join('');
  }

  return { createTypewriterLine, revealTypewriterLine, tickTypewriterLine, typewriterText };
});
