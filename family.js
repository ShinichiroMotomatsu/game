/* Standalone chapter: no external services, fonts or image requests. */
(() => {
  'use strict';
  const G=window.FamilyGame, A=window.FamilyArt;
  const KEY='umi-no-osora.chapter1.v1', PREF='umi-no-osora.settings.v1';
  const $=id=>document.getElementById(id);
  let saved=null, prefs={music:false,voice:false};
  try {saved=G.restore(localStorage.getItem(KEY)); const p=JSON.parse(localStorage.getItem(PREF)); if(p)prefs={music:p.music===true,voice:p.voice===true};} catch { /* Storage may be unavailable in private browsers. */ }
  let state=G.initial(saved?.mode), feedback='', bathView=false, lastFocus=null;
  let audio=null, timer=null, melodyStep=0, audioNodes=[];
  const child=()=>state.mode==='child';
  const t=(normal,kids)=>child()?kids:normal;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const has=id=>state.entries.includes(id);
  const button=(label,action,value='',cls='')=>`<button class="${cls}" data-action="${action}"${value!==''?` data-value="${value}"`:''}>${label}</button>`;
  const spot=(label,action,x,y,done=false,value='')=>`<button class="hotspot${done?' collected':''}" style="left:${x}%;top:${y}%" data-action="${action}"${value!==''?` data-value="${value}"`:''}>${label}${done?' ✓':''}</button>`;
  const sceneNames={title:'旅のはじまり',train:'海を望む列車',town:'湯けむりの町',shore:'道を待つ浜',road:'海の上の道',rest:'途中の休憩',pool:'潮だまり',discovery:'うみのおそら',return:'帰り道',inn:'宿のあかり',end:'第一章 おわり'};
  const sceneKids={title:'たびの はじまり',train:'うみの れっしゃ',town:'あったかい まち',shore:'はまべ',road:'うみの うえの みち',rest:'ひとやすみ',pool:'みずたまり',discovery:'うみのおそら',return:'かえりみち',inn:'おやど',end:'ひとつめの たび おわり'};
  const entries={
    island:{who:'父のスケッチ',kidWho:'おとうさんの え',style:'father',title:'車窓の向こうの島',kidTitle:'うみの むこうの しま',text:'列車の窓から見えた、小さな島。弟が「いってみたい」と指をさした。',kids:'まどから しまが みえた。\n「いってみたい！」'},
    cloud:{who:'次男・3歳の絵／母が代筆',kidWho:'おとうとの え・おかあさんが かいた ことば',style:'crayon',title:'おおきな おさかな',kidTitle:'おおきな おさかな',text:'魚に見えた雲。島よりずっと大きく描かれている。',kids:'おそらに おさかなが いたよ。'},
    snack:{who:'母の絵とことば',kidWho:'おかあさんの えと ことば',style:'mother',title:'四人で食べたおやつ',kidTitle:'みんなの おやつ',text:'湯気の立つおいものおやつを、四人で分けた。小さい手が、いちばん大きなかけらに伸びた。',kids:'ほかほかの おいも。\nみんなで わけて たべたよ。'},
    warmth:{who:'母の絵／兄弟の問い',kidWho:'おかあさんの え・ふたりの はてな',style:'mother',title:'砂なのに、おふろ',kidTitle:'すななのに おふろ',text:'「海のそばなのに、どうして砂があったかいの？」その問いを、手帳に持ち帰る。',kids:'すなは ぽかぽか。\nうみの そこも あったかいのかな？'},
    tide:{who:'長男・6歳の観察',kidWho:'おにいちゃんの かんさつ',style:'father',title:'海だったところに道',kidTitle:'うみが みちに なった',text:'朝は水の中だった石が、今は顔を出している。道をつくったのは、潮の変化だった。',kids:'おみずが へっている！\nすなの みちが でてきた。'},
    path:{who:'父の地図',kidWho:'おとうさんの ちず',style:'father',title:'今日、歩いたところ',kidTitle:'きょう あるいた みち',text:'島までは、まだ少し先。今日はこの場所まで。続きを描く日は、いつになるだろう。',kids:'きょうは ここまで。\nしまへの つづきは また こんど。'},
    stars:{who:'次男・3歳の絵／母が代筆・長男が位置を記録',kidWho:'おとうとの え・おかあさんが かいた ことば',style:'crayon',title:'うみのおそら',kidTitle:'うみのおそら',text:'おとうさんと うみの うえを あるいた。\nおみずの なかに おほしさまが いた。',kids:'おとうさんと うみの うえを あるいた。\nおみずに おほしさまが いた。'},
    family:{who:'母の絵／四人の一日',kidWho:'おかあさんの え・みんなの いちにち',style:'mother',title:'届かなかった島と、見つけた星',kidTitle:'みんなで みつけた',text:'渡り切れなかったけれど、四人で見つけたものがある。あの島へ行く日も、このページは残しておこう。',kids:'しまには また いこう。\nきょうは みんなで ほしを みつけた。'}
  };
  function save(){
    if(state.scene==='title')return;
    saved=state;
    try{localStorage.setItem(KEY,JSON.stringify(state));$('save-status').textContent=t('この端末に保存しました','この ブラウザに ほぞんしたよ');}
    catch{$('save-status').textContent=t('保存できません。画面を閉じると進行が失われます','ほぞん できません。この がめんを とじないでね');}
  }
  function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(prefs));}catch{ /* Gameplay remains available. */ }}
  function stopMusic(){clearInterval(timer);timer=null;for(const n of audioNodes){try{n.stop();}catch{}}audioNodes=[];if(audio?.state==='running')audio.suspend().catch(()=>{});}
  function music(){
    if(!prefs.music||document.hidden)return stopMusic();
    try{
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      audio.resume().catch(()=>{});if(timer)return;
      const notes=[60,64,67,71,69,67,64,62,60,64,67,74,71,67,64,62];
      const tick=()=>{
        if(document.hidden)return;
        const now=audio.currentTime, note=notes[melodyStep++%notes.length];
        for(const [m,vol] of [[note,.032],[note-12,.016]]){
          const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=440*2**((m-69)/12);
          gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(vol,now+.07);gain.gain.exponentialRampToValueAtTime(.0001,now+1.7);
          osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+1.8);audioNodes.push(osc);
          osc.onended=()=>{osc.disconnect();gain.disconnect();audioNodes=audioNodes.filter(n=>n!==osc);};
        }
      };tick();timer=setInterval(tick,850);
    }catch{prefs.music=false;savePrefs();feedback=t('このブラウザでは音楽を再生できません。','この ブラウザでは おとを だせません。');}
  }
  function speak(text){
    if(!('speechSynthesis' in window)){feedback=t('このブラウザは読み上げに対応していません。','この ブラウザでは よみあげが つかえません。');render(false);return;}
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=child()?.8:.94;speechSynthesis.speak(u);
  }
  function sceneData(){
    let title='',copy='',who='',line='',goal='',spots='',actions='',tag=t('家族の旅 · 1年目','かぞくの たび'),artScene=state.scene;
    switch(state.scene){
      case 'train':
        title=t('海のむこうへ。','うみの むこうへ。');copy=t('車輪の音が、少し軽くなった。窓いっぱいに海が広がる。\n今日から四人で、南の海辺の町へ。','ガタン ゴトン。\nまどの むこうに うみが ひろがった！');who=t('次男 · 3歳','おとうと');line='あっ！ あそこ、しま？';goal=t('窓の外をタップして、旅の発見を手帳へ。','まどの そとを タップしてみよう。');
        spots=spot(t('遠くの島','しま'),'sea',71,41,has('island'))+spot(t('魚みたいな雲','くも'),'cloud',22,21,has('cloud'));
        actions=button(t('海辺の町へ到着する →','まちに ついた！ →'),'arrive','','primary');break;
      case 'town':
        title=bathView?t('砂なのに、おふろ。','すななのに おふろ。'):t('湯けむりと、潮の香り。','ぽかぽかの まち。');
        copy=bathView?t('砂に包まれると、体の奥までぽかぽかする。海を眺めながら、四つの顔が並んだ。','すなの おふろは ぽかぽか。\nみんなで うみを みている。'):t('駅を出ると、風がほんのりしょっぱい。\nまずは、この町ならではの砂風呂へ。','れっしゃを おりたよ。\nすなの おふろに いってみよう。');
        who=bathView?t('長男 · 6歳','おにいちゃん'):t('母','おかあさん');line=bathView?t('海の底も、あったかいのかな？','うみの そこも あったかいのかな？'):t('おふろのあと、島への道を見に行こう。','おふろの あと、しまへの みちを みにいこう。');goal=t('砂風呂を楽しんだら、浜辺へ。おやつの寄り道も。','すなぶろに はいったら はまべへ。');artScene=bathView?'bath':'town';
        spots=bathView?'':spot(t('砂風呂','すなぶろ'),'bath',23,51,has('warmth'))+spot(t('町のおやつ','おやつ'),'market',77,60,has('snack'));
        actions=(bathView?button(t('町をもう少し歩く','まちを あるく'),'townView'):'')+(has('warmth')?button(t('島への道を見に行く →','はまべへ いこう →'),'leaveTown','','primary'):button(t('砂風呂に入る','すなぶろに はいる'),'bath','','primary'));break;
      case 'shore':
        title=t('あの島まで、歩ける？','しままで あるける？');copy=t('さっきまで海だったところに、砂がのぞいている。浜の案内人が、道の現れる時間を教えてくれた。','さっきは うみだったのに、\nすなが みえてきたよ。');who=t('浜の案内人','はまの ひと');line=t('潮が引くと、道が顔を出します。今日は途中の広い場所まで。帰りの分も残して歩きましょう。','おみずが へると、みちが でるよ。\nきょうは とちゅうまで。かえりも あるからね。');goal=has('tide')?t('変化を記録できた。道が現れるのを待とう。','みちが でるのを まとう。'):t('浜の石を調べて、朝と今を見比べよう。','はまの いしを しらべよう。');
        spots=spot(t('水の跡がある石','いし'),'tide',32,74,has('tide'));actions=has('tide')?button(t('潮が引くのを待つ →','みちを まつ →'),'waitTide','','primary'):button(t('石の水の跡を調べる','いしを みる'),'tide','','primary');break;
      case 'road':
        title=t('海の上に、道ができた。','うみの うえに みち！');copy=t('両側から波の音がする。島へ続く砂の道を、四人の歩幅で進む。\n父は小さな次男を抱き上げた。','すなの みちが つながった！\nおとうとは おとうさんに だっこ。');who=t('次男','おとうと');line='うみの うえ、あるいてる！';goal=t('道の途中の休憩場所まで歩こう。','ひとやすみする ばしょまで いこう。');spots=spot(t('砂の道を進む','あるく'),'walk',55,62);actions=button(t('家族と歩く →','みんなで あるく →'),'walk','','primary');break;
      case 'rest':
        title=t('小さな目に、見えたもの。','なにか ひかった！');copy=t('少し歩いて、ひと休み。島はまだ先にある。\n父の腕の中から、次男が水辺を指さした。','すこし あるいて ひとやすみ。\nおとうとが みずを ゆびさした。');who=t('次男','おとうと');line='そこ！ ぴかって した。';goal=t('足元の潮だまりを調べよう。','あしもとの みずを みてみよう。');spots=spot(t('潮だまり','みずたまり'),'pool',49,81);actions=button(t('何が光ったのか調べる →','ひかりを さがす →'),'pool','','primary');break;
      case 'pool':
        title=t('さっきの光は、どこへいった？','ひかりは どこ？');copy=state.shaded?t('水面を覆っていた空の反射が薄くなった。白い小石の近くに、小さな光が残っている。','そらの きらきらが へったよ。\nみずの なかの ひかりを タップしよう。'):t('水面には、空が映っている。次男が見た光も、ただの反射だったのだろうか。','おみずに おそらが うつってる。\nさっきの ひかりは どこかな？');goal=state.shaded?t(`水底の光を記録する · ${state.found.length} / 3`,`ひかりを みつけよう · ${state.found.length} / 3`):t('見る場所を変え、手帳の絵を比べよう。','みる ばしょを かえてみよう。');
        tag=t('観察 · 潮だまり','よく みてみよう');
        if(state.shaded)spots=[[40,47,'✧'],[58,36,'◇'],[66,62,'☆']].map(([x,y,symbol],i)=>`<button class="hotspot light ${state.found.includes(i)?'collected':''}" style="left:${x}%;top:${y}%" data-action="light" data-value="${i}" aria-label="${t('水底の光','みずの ひかり')} ${i+1}" aria-pressed="${state.found.includes(i)}">${state.found.includes(i)?'✓':symbol}</button>`).join('');
        actions=`<div class="action-row">${[['side',t('横から','よこ')],['low',t('しゃがむ','しゃがむ')],['high',t('上から','うえ')]].map(([v,l])=>`<button data-action="view" data-value="${v}" aria-pressed="${state.view===v}">${l}</button>`).join('')}</div>`;
        if(state.view==='high'&&!state.shaded)actions+=button(t('家族と日陰をつくって見る','みんなで かげを つくる'),'shade','','primary');
        actions+=`<div class="utility">${button(t('手帳の絵を比べる','えを くらべる'),'compare')}${button(t('家族に聞く','ヒントを きく'),'hint')}</div>`;break;
      case 'discovery':
        title='うみのおそら。';copy=t('空の映り込みが動いても、水底の三つの光はそこに残った。\n四人とも、しばらく何も言わずに見ていた。','おみずの なかに、ほし みたいな ひかり。\nみんなにも みえた！');who=t('次男','おとうと');line='うみの おそらだ。';goal=t('発見が手帳に残った。帰りの時間を確かめよう。','てちょうに かいたよ。そろそろ かえろう。');actions=button(t('光を手帳に残して、帰る →','てちょうに かいて かえろう →'),'return','','primary');break;
      case 'return':
        title=t('今日は、ここまで。','きょうは ここまで。');copy=t('島までは、まだ距離がある。抱っこした腕も、歩いた足も、そろそろ休ませたい。\n帰りの時間を確かめて、町へ戻ることにした。','しまは まだ とおいね。\nきょうは ここで かえろう。');who=t('長男','おにいちゃん');line=t('今度は、あの島まで行こうね。','こんどは あの しままで いこうね。');goal=t('歩けた道も、見つけた光も、今日の冒険。','きょうの ぼうけんを おやどで かこう。');actions=button(t('もう一度、島を眺める','もういちど しまを みる'),'lookBack')+button(t('宿へ帰る →','おやどへ かえる →'),'inn','','primary');break;
      case 'inn':
        title=t('四人で、一ページ。','みんなの てちょう。');copy=t('机に手帳を広げる。父は道を描き、母は四人の姿を描いた。兄は光の場所を確かめ、弟は黄色のクレヨンを握る。','おとうさんは ちず。おかあさんは みんなの え。\nおにいちゃんは ひかりの ばしょ。\nおとうとは おおきな おほしさま。');who=t('母','おかあさん');line=t('それぞれ、違うものを覚えているんだね。','みんな、ちがう えに なったね。');goal=t('今日の記録を完成させよう。','きょうの てちょうを しあげよう。');actions=button(t('今日の手帳を完成させる →','てちょうを しあげる →'),'finish','','primary');break;
      case 'end':
        title=t('この道の続きは、いつか。','つづきは また こんど。');copy=t('島には届かなかった。けれど、海の中に星を見つけた。\nいつか二人が、自分の足でこの道の続きを歩く。その日も、今日のページはここにある。','しまには また いこう。\nきょうの ほしは てちょうの なか。\nいつか じぶんの あしで、あの しまへ。');goal=t('第一章クリア。家族の手帳はいつでも読み返せます。','ひとつめの たび、おしまい！ てちょうを よんでみよう。');actions=button(t('完成した旅の手帳を開く','できた てちょうを ひらく'),'journal','','primary')+button(t('タイトルへ','はじめの がめんへ'),'title');break;
    }
    return {title,copy,who,line,goal,spots,actions,tag,artScene};
  }
  function render(moveFocus=true){
    const focused=document.activeElement?.dataset;
    const previousControl=focused?.action?{action:focused.action,value:focused.value}:null;
    document.body.classList.toggle('child',child());
    $('journal-button').textContent=t('手帳','てちょう');$('settings-button').textContent=t('設定','せってい');
    if(state.scene==='title'){
      $('game').innerHTML=`<div class="chapter"><span>A LITTLE JOURNEY, A WIDER WORLD</span><b>01</b></div><div class="scene title-scene">${A.art('title')}<span class="scene-tag">${t('海辺からはじまる、家族の12年','うみべから はじまる ぼうけん')}</span></div><section class="title-copy"><p class="eyebrow">${t('第一章　潮だまりの星空','ひとつめの たび')}</p><h1>うみのおそら</h1><p>${t('届かなかった島と、見つけた星。<br>四人の歩幅で、旅をしよう。','うみの うえを あるいてみよう。<br>かぞくで みつける、ちいさな ふしぎ。')}</p></section><div class="family-strip"><span>${t('父','おとうさん')}</span><span>${t('母','おかあさん')}</span><span>${t('長男 6歳','あに 6さい')}</span><span>${t('次男 3歳','おとうと 3さい')}</span></div><div class="actions"><div class="mode-picker">${modeButtons()}</div>${saved?button(t('つづきから','つづきから'),'continue','','primary'):''}${button(saved?t('はじめから遊ぶ','はじめから'):t('旅に出る →','たびに でる →'),saved?'restart':'start','',saved?'':'primary')}<p class="journal-intro">${t('タップで探索 · 自動保存 · 途中でモード変更できます。<br>短編の第一章を最後まで遊べます。','きになる ところを タップしてね。<br>よみあげは「せってい」で えらべるよ。')}</p></div>`;
    }else{
      const d=sceneData();
      $('game').innerHTML=`<div class="chapter"><span>${t('第一章 ／ 潮だまりの星空','ひとつめの たび')}</span><b>${esc(child()?sceneKids[state.scene]:sceneNames[state.scene])}</b></div><div class="scene">${A.art(d.artScene,state)}<span class="scene-tag">${d.tag}</span>${d.spots}</div><section class="story"><p class="eyebrow">${t('家族で見つける、世界のかけら','みんなで みつけよう')}</p><h1>${d.title}</h1><p>${d.copy}</p>${d.line?`<div class="dialogue"><b>${d.who}</b><p>${d.line}</p></div>`:''}${feedback?`<div class="feedback" role="status">${esc(feedback)}</div>`:''}${state.scene==='end'?'<div class="end-stamp">TRAVEL JOURNAL<strong>第一章</strong>COMPLETE</div>':''}<p class="objective">${d.goal}</p></section><div class="actions">${d.actions}<div class="utility"><span class="hint-count">${t('長男 6歳 · 次男 3歳','あに 6さい・おとうと 3さい')}</span>${button(t('▷ 読み上げ','▷ よんで'),'read')}</div></div>`;
    }
    if(moveFocus){$('game').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
    else if(previousControl && !$('overlay').open){
      const next=[...$('game').querySelectorAll('[data-action]')].find(b=>b.dataset.action===previousControl.action&&b.dataset.value===previousControl.value);
      (next||$('game')).focus({preventScroll:true});
    }
  }
  function modeButtons(){return `<button data-action="mode" data-value="normal" aria-pressed="${!child()}">通常<small>じっくり観察して遊ぶ</small></button><button data-action="mode" data-value="child" aria-pressed="${child()}">こども<small>やさしい ことばと ヒント</small></button>`;}
  function open(title,html){
    if(!$('overlay').open)lastFocus=document.activeElement;
    $('dialog-title').textContent=title;$('dialog-body').innerHTML=html;
    if(!$('overlay').open)$('overlay').showModal();
    $('overlay').scrollTop=0;
  }
  function close(){ $('overlay').close(); if('speechSynthesis'in window)speechSynthesis.cancel();if(lastFocus?.isConnected)lastFocus.focus();else $('game').focus({preventScroll:true}); }
  function journal(){
    const data=state.scene==='title'&&saved?saved:state;
    open(t('家族の旅の手帳','かぞくの たびの てちょう'),`<p class="journal-intro">${t('海辺の旅 · 長男6歳、次男3歳<br>書いた人も、見えた景色も、それぞれ。','うみべの たび。みんなで かいたよ。')}</p>${data.entries.length?data.entries.map(id=>{const e=entries[id];return `<article class="journal-entry ${e.style}"><span class="meta">${child()?e.kidWho:e.who}</span>${A.sketch(id)}<h3>${child()?e.kidTitle:e.title}</h3><p>${esc(child()?e.kids:e.text).replace(/\n/g,'<br>')}</p>${id==='stars'?`<p class="meta">${t('光の位置：左の光 → 右上の光 → 右下の光。長男の観察を併記。','ひかりは みっつ。ひだり・みぎうえ・みぎした。')}</p>`:''}</article>`;}).join(''):`<p>${t('まだ白いページ。旅先で気になるものを調べてみよう。','まだ まっしろ。たびで みつけたものを かこう。')}</p>`}${button(t('▷ 手帳を読み上げる','▷ てちょうを よんで'),'readDialog')}`);
  }
  function settings(){open(t('旅の設定','せってい'),`<div class="setting"><strong>${t('遊び方','あそびかた')}</strong><div class="mode-picker">${modeButtons()}</div><p>${t('途中で切り替えても、発見と進行はそのままです。','かえても、みつけたものは のこるよ。')}</p></div><div class="setting"><label><input type="checkbox" id="music-toggle" ${prefs.music?'checked':''}>${t('音楽（小さな旅の旋律）','おんがく')}</label><label><input type="checkbox" id="voice-toggle" ${prefs.voice?'checked':''}>${t('場面の文章を自動で読み上げる','ことばを じどうで よむ')}</label><p>${t('読み上げは端末の日本語音声を使います。声や対応状況はブラウザによって異なります。','こえが でないときは、おとなに きいてね。')}</p></div><div class="setting"><p>${t('セーブはこの端末・ブラウザ内です。別のスマホへ移す場合は「セーブを書き出す」を使ってください。','つづきは この ブラウザに のこるよ。')}</p>${button(t('セーブを書き出す','セーブを かきだす'),'export')}<label>${t('セーブを読み込む','セーブを よみこむ')}<input id="import-save" type="file" accept="application/json,.json" style="width:160px;height:auto;font-size:11px"></label></div>${button(t('タイトルへ戻る','はじめの がめんへ'),'title')}<p class="journal-intro">指宿旅行に着想を得た創作です。海の光や道の形は架空のものです。</p>`);}
  function compare(){
    open(t('同じ小石を、違う場所から','おなじ いしを さがそう'),`<div class="compare-grid"><div class="compare-card"><svg viewBox="0 0 600 400" aria-label="横から見た絵">${A.pool('side',false)}</svg><p>${t('長男：横から。空が大きく映っている。','よこから。そらが うつってる。')}</p></div><div class="compare-card"><svg viewBox="0 0 600 400" aria-label="上から見た絵">${A.pool('high',false)}</svg><p>${t('次男：抱っこで上から。白い小石は同じ場所。','うえから。しろい いしは おなじ。')}</p></div></div><p class="journal-intro">${t('どちらの絵にもある、動かない目印は？','どっちにも あるのは なあに？')}</p><div class="compare-answer">${button(t('空の映り込み','そらの きらきら'),'answer','sky')}${button(t('白い小石','しろい いし'),'answer','stone')}</div><p id="compare-feedback" role="status" class="journal-intro"></p>`);
  }
  function action(name,value){
    if(name==='read'){speak($('game').querySelector('.story')?.innerText||$('game').innerText);return;}
    if(name==='readDialog'){speak($('dialog-body').innerText);return;}
    if(name==='journal'){journal();return;}
    if(name==='settings'){settings();return;}
    if(name==='compare'){state=G.reduce(state,{name});save();compare();return;}
    if(name==='answer'){$('compare-feedback').textContent=value==='stone'?t('そう。小石は動かず、空の映り込みだけが変わる。上から見て、家族で日陰をつくってみよう。','そう！ いしは おなじ。\n「うえ」から みて、かげを つくろう。'):t('空の映り込みは、見る場所によって変わるよ。水の底の目印を探そう。','きらきらは うごくよ。みずの そこの ものは？');return;}
    if(name==='restart'){open(t('新しい旅を始める','はじめから あそぶ'),`<p class="journal-intro">${t('この端末の家族旅行編の記録を、新しい旅で置き換えます。残したい場合は設定から書き出してください。','いまの たびを けして、はじめから あそぶ？')}</p>${button(t('新しい旅を始める','はじめから'),'confirmRestart','','primary')}${button(t('今の記録を残す','やめる'),'cancel')}`);return;}
    if(name==='cancel'){close();return;}
    if(name==='export'){
      const data=state.scene==='title'?saved:state;
      if(!data){open('セーブ', '<p>まだ記録がありません。旅に出てから書き出せます。</p>');return;}
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='umi-no-osora-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
    if(name==='title'){if($('overlay').open)close();state=G.initial(state.mode);feedback='';bathView=false;render();if('speechSynthesis'in window)speechSynthesis.cancel();return;}
    const before=state.scene;
    feedback='';
    if(name==='continue'){state=G.restore(JSON.stringify(saved))||G.initial(state.mode);}
    else if(name==='confirmRestart'){close();state=G.reduce(G.initial(state.mode),{name:'start'});}
    else if(name==='townView'){bathView=false;}
    else {state=G.reduce(state,{name,value:name==='light'?Number(value):value});}
    if(name==='mode' && $('overlay').open)settings();
    const feedbacks={sea:t('弟「あそこ、いってみたい！」\n父が手帳に島の輪郭を描いた。','「しまに いきたい！」\nてちょうに しまを かいたよ。'),cloud:t('魚みたいな雲。次男がクレヨンで大きく描いた。','おさかな みたいな くも！\nてちょうに かいたよ。'),market:t('ほかほかのおいものおやつを、四人で分けた。母の絵が手帳に増えた。','ほかほかの おいも！\nみんなで わけて たべたよ。'),tide:t('朝は水に隠れていた石が見える。\n兄「水が減ったんだ。だから道も出てくるんだね」','あさは おみずの なかだった いし。\nいまは みえる！ おみずが へったんだ。'),lookBack:t('次男は父の肩にもたれて、島を見ている。\n母「今日のところまで、地図に描いておこう」','おとうとは だっこで しまを みている。\n「また こようね」')};
    if(feedbacks[name])feedback=feedbacks[name];
    if(name==='bath')bathView=true;
    if(name==='view')feedback=value==='high'?t('ここなら底が見やすい。まだ明るい反射が残る。家族と日陰をつくってみよう。','ここなら みえそう！\nみんなで かげを つくってみよう。'):value==='low'?t('低くなると、空の反射が広がる。弟はもっと高いところから見ていた。','そらが いっぱい うつった。\nおとうとは もっと うえから みていたね。'):t('横からだと空ばかり。見る高さを変えたらどうだろう。','よこからだと おそらばかり。\nちがう ばしょから みよう。');
    if(name==='hint')feedback=[t('弟は、どこから見ていたかな？','おとうとは どこから みてた？'),t('抱っこされて、上から見ていた。手帳の絵も比べてみよう。','だっこで うえから みてたね。'),t('「上から」を選び、家族と日陰をつくろう。残った三つの光をタップして記録しよう。','「うえ」を おして、かげを つくろう。\nひかりを みっつ タップしよう。')][state.hint-1];
    save();render(before!==state.scene);if(name==='start'||name==='continue'||name==='confirmRestart')music();
    if(prefs.voice){const d=sceneData();speak(feedback||`${d.title}。${d.copy}。${d.line}。${d.goal}`);}
  }
  document.addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(b)action(b.dataset.action,b.dataset.value);});
  $('journal-button').addEventListener('click',journal);$('settings-button').addEventListener('click',settings);$('close-dialog').addEventListener('click',close);
  $('overlay').addEventListener('cancel',event=>{event.preventDefault();close();});
  document.addEventListener('change',async event=>{
    if(event.target.id==='music-toggle'){prefs.music=event.target.checked;savePrefs();music();}
    if(event.target.id==='voice-toggle'){prefs.voice=event.target.checked;savePrefs();if(prefs.voice)speak(t('読み上げをオンにしました。','よみあげを はじめるよ。'));else if('speechSynthesis'in window)speechSynthesis.cancel();}
    if(event.target.id==='import-save'){
      const f=event.target.files[0];if(!f)return;
      if(f.size>50000){open('セーブ', '<p>このゲームの小さなセーブファイルを選んでください。</p>');return;}
      try{const imported=G.restore(await f.text());if(!imported)throw Error('invalid');
        // Review the replacement before changing the current local progress.
        open(t('セーブを読み込む','セーブを よみこむ'),`<p class="journal-intro">${esc(sceneNames[imported.scene])} ／ ${imported.entries.length}ページ。<br>${t('今の記録をこのセーブで置き換えますか？','いまの たびを この セーブに かえる？')}</p><button id="confirm-import" class="primary">${t('読み込む','よみこむ')}</button>${button(t('やめる','やめる'),'cancel')}`);
        $('confirm-import').onclick=()=>{state=imported;bathView=false;feedback='';close();save();render();};
      }catch{open('セーブ', '<p>読み込めませんでした。第一章のセーブファイルを選んでください。今の記録は残っています。</p>');}
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();if('speechSynthesis'in window)speechSynthesis.cancel();}else music();});
  render(false);
})();
