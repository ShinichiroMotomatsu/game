(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FamilyGame = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const scenes = ['title','train','town','shore','road','rest','pool','discovery','return','inn','end'];
  const entryIds = ['island','cloud','snack','warmth','tide','path','stars','family'];
  function initial(mode = 'normal') {
    return {version:1, mode:mode==='child'?'child':'normal', scene:'title', entries:[], view:'side', shaded:false, found:[], hint:0, compared:false};
  }
  function restore(raw) {
    try {
      const s=JSON.parse(raw);
      if (!s || s.version!==1 || !scenes.includes(s.scene) || !['normal','child'].includes(s.mode) || !['side','low','high'].includes(s.view)) return null;
      if (!Array.isArray(s.entries) || s.entries.some(x=>!entryIds.includes(x)) || new Set(s.entries).size!==s.entries.length) return null;
      if (!Array.isArray(s.found) || s.found.some(x=>![0,1,2].includes(x)) || new Set(s.found).size!==s.found.length) return null;
      if (typeof s.shaded!=='boolean' || typeof s.compared!=='boolean' || !Number.isInteger(s.hint) || s.hint<0 || s.hint>3) return null;
      const n=scenes.indexOf(s.scene);
      if (n>=3 && !s.entries.includes('warmth')) return null;
      if (n>=4 && !s.entries.includes('tide')) return null;
      if (n>=5 && !s.entries.includes('path')) return null;
      if (n>=7 && (s.found.length!==3 || !s.entries.includes('stars'))) return null;
      if (n===10 && !s.entries.includes('family')) return null;
      return {...initial(s.mode), scene:s.scene, entries:[...s.entries], view:s.view, shaded:s.shaded, found:[...s.found], hint:s.hint, compared:s.compared};
    } catch { return null; }
  }
  function reduce(state, action) {
    const s={...state, entries:[...state.entries], found:[...state.found]};
    const add=id=>{if(!s.entries.includes(id))s.entries.push(id);};
    const a=action.name;
    if(a==='mode') {if(['normal','child'].includes(action.value))s.mode=action.value; return s;}
    switch(s.scene) {
      case 'title': if(a==='start')s.scene='train'; break;
      case 'train':
        if(a==='sea')add('island');
        if(a==='cloud')add('cloud');
        if(a==='arrive')s.scene='town'; break;
      case 'town':
        if(a==='market')add('snack');
        if(a==='bath')add('warmth');
        if(a==='leaveTown' && s.entries.includes('warmth'))s.scene='shore'; break;
      case 'shore':
        if(a==='tide')add('tide');
        if(a==='waitTide' && s.entries.includes('tide'))s.scene='road'; break;
      case 'road': if(a==='walk'){add('path'); s.scene='rest';} break;
      case 'rest': if(a==='pool')s.scene='pool'; break;
      case 'pool':
        if(a==='view' && ['side','low','high'].includes(action.value)){s.view=action.value;s.shaded=false;}
        if(a==='compare')s.compared=true;
        if(a==='hint')s.hint=Math.min(3,s.hint+1);
        if(a==='shade' && s.view==='high')s.shaded=true;
        if(a==='light' && s.shaded && s.view==='high' && [0,1,2].includes(action.value) && !s.found.includes(action.value))s.found.push(action.value);
        if(s.found.length===3){add('stars');s.scene='discovery';} break;
      case 'discovery': if(a==='return')s.scene='return'; break;
      case 'return': if(a==='inn')s.scene='inn'; break;
      case 'inn': if(a==='finish'){add('family');s.scene='end';} break;
      default: break;
    }
    return s;
  }
  return {initial,restore,reduce};
});
