const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createTypewriterLine,
  revealTypewriterLine,
  tickTypewriterLine,
  typewriterText
} = require('../v2-dialogue.js');

test('dialogue appears one Japanese character at a time', () => {
  const initial = createTypewriterLine('王都へようこそ');
  const first = tickTypewriterLine(initial);
  const second = tickTypewriterLine(first);

  assert.equal(typewriterText(initial), '');
  assert.equal(typewriterText(first), '王');
  assert.equal(typewriterText(second), '王都');
  assert.equal(second.complete, false);
});

test('a tap reveals the whole current line without selecting the next line', () => {
  const initial = createTypewriterLine('星の羅針盤を持つ者よ');
  const revealed = revealTypewriterLine(tickTypewriterLine(initial));

  assert.equal(typewriterText(revealed), '星の羅針盤を持つ者よ');
  assert.equal(revealed.complete, true);
});

test('typewriter counts a surrogate-pair character as one glyph', () => {
  const first = tickTypewriterLine(createTypewriterLine('⚔️剣'));
  assert.equal(typewriterText(first), '⚔');
});
