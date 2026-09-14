const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../family-game.js');
function act(s, name, value) { return G.reduce(s, {name, value}); }
function reachPool(mode = 'normal') {
  let s = G.initial(mode);
  for (const a of ['start','sea','arrive','bath','leaveTown','tide','waitTide','walk','pool']) s = act(s,a);
  return s;
}
test('both modes complete chapter through observations without forced hint order', () => {
  for (const mode of ['normal','child']) {
    let s = reachPool(mode);
    assert.equal(s.scene,'pool');
    s = act(s,'view','high');
    for (const n of [2,0,1]) s = act(s,'light',n);
    assert.equal(s.found.length,0, 'must shade the reflection first');
    s = act(s,'shade');
    for (const n of [2,0,1]) s = act(s,'light',n);
    assert.equal(s.scene,'discovery');
    for (const a of ['return','inn','finish']) s = act(s,a);
    assert.equal(s.scene,'end');
    assert.equal(s.entries.includes('stars'),true);
    assert.equal(s.entries.includes('family'),true);
    assert.equal(s.mode,mode);
    assert.deepEqual(G.restore(JSON.stringify(s)),s);
  }
});
test('wrong and repeated inputs cannot skip scenes or create duplicate rewards',()=>{
  let s=G.initial();
  assert.deepEqual(act(s,'finish'),s);
  s=reachPool();
  s=act(s,'view','side');
  s=act(s,'shade');
  assert.equal(s.shaded,false);
  s=act(s,'view','high'); s=act(s,'shade');
  s=act(s,'light',0); s=act(s,'light',0); s=act(s,'light',99);
  assert.deepEqual(s.found,[0]);
  assert.deepEqual(act(s,'view','invalid'),s);
});
test('optional discoveries, clues and hints survive mode switches and save reload',()=>{
  let s=act(G.initial(),'start');
  for(const a of ['cloud','sea','sea','arrive','market','bath','leaveTown','tide','waitTide','walk','pool','hint','hint','hint','hint','compare']) s=act(s,a);
  s=act(s,'mode','child');
  assert.equal(s.hint,3); assert.equal(s.compared,true);
  assert.equal(s.entries.filter(x=>x==='island').length,1);
  assert.equal(s.entries.includes('snack'),true);
  assert.equal(G.restore(JSON.stringify(s)).mode,'child');
  assert.deepEqual(act(s,'mode','bad'),s);
});
test('reload validates schema and rejects impossible progression without throwing',()=>{
  for(const raw of [null,'bad','null','{}','[]',JSON.stringify({...G.initial(),scene:'unknown'}),JSON.stringify({...G.initial(),version:99}),JSON.stringify({...G.initial(),found:[99]}),JSON.stringify({...G.initial(),entries:['<script>']})]) assert.equal(G.restore(raw),null);
  assert.equal(G.restore(JSON.stringify({...G.initial(),scene:'end'})),null);
  assert.equal(G.restore(JSON.stringify({...reachPool(),found:[0,0]})),null);
});
test('required town and tide discoveries gate movement, journal opens independent of progress',()=>{
  let s=act(G.initial(),'start'); s=act(s,'arrive');
  assert.equal(s.scene,'town');
  assert.equal(act(s,'leaveTown').scene,'town');
  s=act(s,'bath'); s=act(s,'leaveTown');
  assert.equal(act(s,'waitTide').scene,'shore');
  s=act(s,'tide'); s=act(s,'waitTide');
  assert.equal(s.scene,'road');
  assert.deepEqual(act(s,'unknown'),s);
});
