
/* ══════════════════════════════════════════════════════════════
   ダイスボヤージュ — メタ（ホーム／カード／ガチャ／ペンダント／VS）
   セーブはこのブラウザの localStorage に保存される
   ══════════════════════════════════════════════════════════════ */
const SAVE_KEY = 'dv_save_v1';
const RAR = {
  A : {nm:'A',  cls:'rA',  mul:1.00, w:68, gold: 60},
  S : {nm:'S',  cls:'rS',  mul:1.15, w:26, gold:180},
  SS: {nm:'S+', cls:'rSS', mul:1.32, w: 6, gold:600}
};

/* ── カード図鑑（守護獣8体。art が像の絵、kind が能力の型） ───────────── */
/* kind: 0=通行料を無効化 1=出目を選ぶ 2=好きなマスへ移動 3=総資産の一部を現金化 */
const CARDPOOL = [
  {id:'c01', art:0, kind:2, col:'#7FD8F0', nm:'氷晶の狐',   role:'クリスタル', rar:'A',
   line:'風より速く、盤を駆ける。',
   st:{toll:52,mini:74,special:50,fortune:58,build:48,gauge:76,buyout:44},
   sk:{nm:'霜の跳躍', ds:'好きなマスへ移動する', uses:2}},
  {id:'c02', art:2, kind:0, col:'#5FD6A8', nm:'翡翠の鶴',   role:'ジェイド',   rar:'A',
   line:'高みから、すべてを見ている。',
   st:{toll:70,mini:56,special:58,fortune:52,build:60,gauge:54,buyout:46},
   sk:{nm:'翠玉の加護', ds:'次に払う通行料が0になる', uses:2}},
  {id:'c03', art:4, kind:0, col:'#6B5E8C', nm:'黒曜の狼',   role:'オブシディアン', rar:'A',
   line:'黙って、獲物を待つ。',
   st:{toll:78,mini:60,special:44,fortune:40,build:50,gauge:64,buyout:56},
   sk:{nm:'黒曜の壁', ds:'次に払う通行料が0になる', uses:2}},

  {id:'c04', art:6, kind:3, col:'#4C82E8', nm:'蒼玉の梟',   role:'サファイア', rar:'S',
   line:'知は、いつでも金に換えられる。',
   st:{toll:58,mini:66,special:82,fortune:90,build:62,gauge:58,buyout:74},
   sk:{nm:'叡智の対価', ds:'総資産の12%を現金で受け取る', uses:2}},
  {id:'c05', art:5, kind:2, col:'#F6E6EE', nm:'真珠の兎',   role:'パール',     rar:'S',
   line:'跳べば、どこへでも。',
   st:{toll:60,mini:88,special:62,fortune:76,build:54,gauge:90,buyout:50},
   sk:{nm:'月跳び', ds:'好きなマスへ移動する', uses:3}},
  {id:'c06', art:3, kind:1, col:'#F04A5A', nm:'紅玉の竜',   role:'ルビー',     rar:'S',
   line:'すべては、我が意のままに。',
   st:{toll:86,mini:64,special:48,fortune:46,build:66,gauge:84,buyout:70},
   sk:{nm:'紅蓮の目', ds:'次のサイコロの出目を自分で選べる', uses:3}},

  {id:'c07', art:1, kind:1, col:'#F2C230', nm:'黄金の獅子', role:'ゴールド',   rar:'SS',
   line:'この盤の王は、我である。',
   st:{toll:94,mini:70,special:60,fortune:58,build:78,gauge:92,buyout:82},
   sk:{nm:'獅子の咆哮', ds:'出目を選び、さらにもう一度振れる', uses:2}},
  {id:'c08', art:7, kind:3, col:'#E8A032', nm:'琥珀の熊',   role:'アンバー',   rar:'SS',
   line:'蓄えた分だけ、強い。',
   st:{toll:72,mini:64,special:96,fortune:88,build:92,gauge:60,buyout:98},
   sk:{nm:'琥珀の蓄え', ds:'総資産の18%を現金で受け取る', uses:2}}
];
const cardById = id => CARDPOOL.find(c=>c.id===id);

/* ── ペンダント（装備でステータス補正） ──────────────────── */
const PENDANTS = [
  {id:'p1', ic:'🪖', nm:'レーサーの兜',  k:'gauge',   v:14, ds:'ゲージインパクト +14'},
  {id:'p2', ic:'🎴', nm:'フォーチュン',  k:'fortune', v:14, ds:'黄金フォーチュン +14'},
  {id:'p3', ic:'🔔', nm:'幸運のベル',    k:'mini',    v:14, ds:'ミニゲーム勝利 +14'},
  {id:'p4', ic:'🧴', nm:'旅人の香水',    k:'toll',    v:14, ds:'通行料割引 +14'},
  {id:'p5', ic:'🧸', nm:'テディベア',    k:'special', v:14, ds:'特殊費用割引 +14'},
  {id:'p6', ic:'🧭', nm:'古びた羅針盤',  k:'build',   v:14, ds:'建設費用割引 +14'},
  {id:'p7', ic:'✉️', nm:'密書',          k:'buyout',  v:14, ds:'買収費用割引 +14'},
  {id:'p8', ic:'🎀', nm:'絹のリボン',    k:'all',     v:5,  ds:'すべて +5'}
];
const pendById = id => PENDANTS.find(p=>p.id===id);

/* ── セーブ ─────────────────────────────────────────── */
function defaultSave(){
  return { gold: 3000, gem: 5, lv: 1, exp: 0, plays: 0, wins: 0,
    cards: { c01:{lv:1,dup:0}, c02:{lv:1,dup:0} },
    pendants: { p3:{} },
    equip: 'c01', slots: ['p3', null, null, null],
    seen: [] };
}
let SV = defaultSave();
function loadSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw){ const o = JSON.parse(raw); if(o && o.cards) SV = Object.assign(defaultSave(), o); }
  }catch(e){}
}
function saveNow(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(SV)); }catch(e){} }
loadSave();

/* ── ステータス計算 ─────────────────────────────────── */
const STAT_KEYS = ['toll','mini','special','fortune','build','gauge','buyout'];
function cardStats(cardId, lv, slots){
  const c = cardById(cardId); if(!c) return null;
  const mul = RAR[c.rar].mul;
  const out = {};
  STAT_KEYS.forEach(k=>{
    let v = Math.round(c.st[k]*mul) + Math.round((lv-1)*1.15);
    out[k] = Math.min(120, v);
  });
  (slots||[]).forEach(pid=>{
    const p = pendById(pid); if(!p) return;
    if(p.k==='all') STAT_KEYS.forEach(k=> out[k] = Math.min(120, out[k]+p.v));
    else out[p.k] = Math.min(120, out[p.k]+p.v);
  });
  return out;
}
function ownedCards(){ return CARDPOOL.filter(c=>SV.cards[c.id]); }
function equippedCard(){ return cardById(SV.equip) || CARDPOOL[0]; }
function myStats(){ return cardStats(SV.equip, (SV.cards[SV.equip]||{lv:1}).lv, SV.slots); }
function playerLvNeed(lv){ return 60 + lv*40; }

/* ── 画面を作る ─────────────────────────────────────── */
function mkScreen(id, innerHTML){
  let el = document.getElementById(id);
  if(!el){ el = document.createElement('div'); el.id=id; $('#stage').appendChild(el); }
  el.className = 'screen meta' + (el.classList.contains('on') ? ' on' : '');
  el.innerHTML = innerHTML;
  return el;
}
/* 上部タブ：どの画面からでも1タップで行き来できる */
const META_TABS = [
  {id:'home',  ic:'🏠', nm:'ホーム',     go:()=>showHome()},
  {id:'cards', ic:'🎴', nm:'カード',     go:()=>showCards()},
  {id:'gacha', ic:'✨', nm:'ガチャ',     go:()=>showGacha()},
  {id:'pend',  ic:'📿', nm:'ペンダント', go:()=>showPend()}
];
function tabsHTML(active){
  return '<div class="tabs">'
    + META_TABS.map(t=>'<div class="tab'+(t.id===active?' on':'')+'" data-tab="'+t.id+'">'
        + '<span class="ic">'+t.ic+'</span>'+t.nm+'</div>').join('')
    + '<button class="btn ghost back" data-tab="title" style="font-size:15px;padding:8px 18px">'
    + 'タイトル</button></div>';
}
function wireTabs(root){
  root.querySelectorAll('[data-tab]').forEach(el=>{
    el.onclick = ()=>{
      SFX.click();
      if(el.dataset.tab==='title'){ screenTo('title'); return; }
      const t = META_TABS.find(x=>x.id===el.dataset.tab);
      if(t) t.go();
    };
  });
}
function walletHTML(){
  const need = playerLvNeed(SV.lv);
  return '<div class="wallet">'
    + '<div class="cur"><span>🪙</span><b id="wGold">'+SV.gold.toLocaleString()+'</b></div>'
    + '<div class="cur"><span>💎</span><b id="wGem">'+SV.gem+'</b></div>'
    + '<div class="cur"><span>🎴</span><b>'+ownedCards().length+'/'+CARDPOOL.length+'</b></div>'
    + '<div class="lvl"><span style="font-size:12px;font-weight:900;color:#9FB6CC">Lv.</span>'
    + '<b style="font-family:var(--pop);font-size:19px;color:#FFE9B5">'+SV.lv+'</b>'
    + '<span class="xp"><i style="width:'+Math.min(100, SV.exp/need*100)+'%"></i></span></div>'
    + '</div>';
}
function statRows(st, cmp){
  return STAT_LABELS.map(([k,l])=>{
    const v = st[k], d = cmp ? v - cmp[k] : 0;
    return '<div class="strow"><span class="l">'+l+'</span>'
      + '<span class="bar"><i style="width:'+Math.min(100,v)+'%"></i></span>'
      + '<span class="v">'+v+(d>0?'<em> +'+d+'</em>':'')+'</span></div>';
  }).join('');
}

/* ── ホーム ─────────────────────────────────────────── */
function showHome(){
  const c = equippedCard(), own = SV.cards[c.id]||{lv:1};
  const st = myStats();
  const el = mkScreen('home',
    tabsHTML('home')
    + '<div class="inner">'
    + '<div class="hero hero3">'
    +   '<div class="heroPic"><span class="rk">'+RAR[c.rar].nm+' CLASS</span>'
    +     '<canvas id="homePic" width="320" height="450"></canvas></div>'
    +   '<div class="heroInfo">'
    +     '<h1>ダイスボヤージュ</h1><div class="cap">DICE VOYAGE</div>'
    +     '<div class="who"><b>'+esc(c.nm)+'</b>（'+esc(c.role)+'） Lv.'+own.lv
    +       '　「'+esc(c.line)+'」</div>'
    +     '<div class="stats dark-st">'+statRows(st, cardStats(c.id, own.lv, []))+'</div>'
    +     '<div class="modes">'
    +       '<div class="modebtn big" id="mPlay"><div class="ic">🎲</div><div class="nm">ゲーム開始</div>'
    +         '<div class="ds">CPU・ともだちと 最大4人で対戦</div></div>'
    +       '<div class="modebtn" id="mGacha"><div class="ic">✨</div><div class="nm">ガチャ</div>'
    +         '<div class="ds">新しいキャラを<br>引き当てる</div>'
    +         (SV.gold>=800?'<span class="badge">引ける</span>':'')+'</div>'
    +       '<div class="modebtn" id="mCards"><div class="ic">🎴</div><div class="nm">カード強化</div>'
    +         '<div class="ds">ステータスを<br>上げる</div></div>'
    +     '</div>'
    +   '</div>'
    +   rankPaneHTML()
    + '</div>'
    + weekBannerHTML()
    + '</div>' + walletHTML());
  regPortrait($('#homePic'), c.art, c.col);
  wireTabs(el);
  $('#mPlay').onclick  = ()=>{ SFX.click(); screenTo('setup'); };
  $('#mCards').onclick = ()=>{ SFX.click(); showCards(); };
  $('#mGacha').onclick = ()=>{ SFX.click(); showGacha(); };
  screenTo('home');
}

/* ── ランキング（本家ロビーの右半分） ─────────────────── */
const RIVALS = [
  {nm:'ボン・クレー', a:31914200, like:214}, {nm:'しゅう',      a:28776500, like:188},
  {nm:'あんぱん',     a:24310900, like:151}, {nm:'たなか',      a:21085400, like:133},
  {nm:'みっちゃん',   a:18702300, like:117}, {nm:'ジェイド',    a:16240800, like: 96},
  {nm:'くり',         a:14118600, like: 82}, {nm:'れっちゃん',  a:12903100, like: 71}
];
function rankPaneHTML(){
  const me = { nm:'あなた', a: SV.gold*180 + SV.lv*900000, like: SV.wins*7+3, me:1 };
  const rows = RIVALS.concat([me]).sort((x,y)=>y.a-x.a);
  const rank = rows.findIndex(r=>r.me) + 1;
  const medal = i => i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : (i+1);
  return '<div class="rankpane">'
    + '<div class="rtab"><span class="on">全体ランキング</span><span>ともだち</span></div>'
    + '<div class="rlist">'
    + rows.slice(0,7).map((r,i)=>
        '<div class="rrow'+(r.me?' me':'')+'">'
        + '<span class="rk">'+medal(i)+'</span>'
        + '<span class="nm">'+esc(r.nm)+'</span>'
        + '<span class="as">'+yen(r.a)+'</span>'
        + '<span class="lk">👍 '+r.like+'</span></div>').join('')
    + '</div>'
    + '<div class="mileage"><b>マイレージ</b>'
    + '<span class="bar"><i style="width:'+Math.min(100, (SV.plays%10)*10)+'%"></i></span>'
    + '<span class="n">'+(SV.plays%10)+'/10</span></div>'
    + '<div class="rfoot">あなたは <b>'+rank+'位</b>　／　10戦ごとにマイレージガチャが引けます</div>'
    + '</div>';
}

/* ── カード ─────────────────────────────────────────── */
let cardSel = null;
function showCards(){
  cardSel = cardSel && SV.cards[cardSel] ? cardSel : SV.equip;
  const el = mkScreen('cards',
    tabsHTML('cards')
    + '<div class="inner">'
    + '<div class="metahd"><h2>カード</h2>'
    +   '<span class="note">同じカードが重なると強化に使えます</span></div>'
    + '<div class="cardwrap"><div id="cardDetail"></div>'
    +   '<div class="cardgrid" id="cardGrid"></div></div>'
    + '</div>' + walletHTML());
  wireTabs(el);
  drawCardGrid(); drawCardDetail();
  screenTo('cards');
}
function drawCardGrid(){
  const g = $('#cardGrid'); g.innerHTML = '';
  CARDPOOL.forEach(c=>{
    const o = SV.cards[c.id];
    const d = document.createElement('div');
    d.className = 'minicard ' + RAR[c.rar].cls + (o?'':' locked') + (cardSel===c.id?' sel':'');
    d.innerHTML = '<span class="rr">'+RAR[c.rar].nm+'</span>'
      + (SV.equip===c.id?'<span class="eq">装備</span>':'')
      + '<canvas width="150" height="150"></canvas>'
      + '<div class="b"><div class="n">'+(o?esc(c.nm):'？？？')+'</div>'
      + '<div class="l">'+(o?('Lv.'+o.lv+(o.dup?' ×'+o.dup:'')):'未所持')+'</div></div>';
    if(o) regPortrait(d.querySelector('canvas'), c.art, c.col);
    d.onclick = ()=>{ if(!o) return; SFX.click(); cardSel = c.id; drawCardGrid(); drawCardDetail(); };
    g.appendChild(d);
  });
}
function upCost(lv){ return 300 + lv*260; }
function drawCardDetail(){
  const c = cardById(cardSel), o = SV.cards[cardSel];
  if(!c || !o){ $('#cardDetail').innerHTML=''; return; }
  const st = cardStats(c.id, o.lv, SV.equip===c.id ? SV.slots : []);
  const cost = upCost(o.lv), canUp = o.lv<30 && o.dup>0 && SV.gold>=cost;
  $('#cardDetail').innerHTML =
    '<div class="cardDetail"><div class="in">'
    + '<canvas id="cdPic" width="330" height="420"></canvas>'
    + '<h3>'+esc(c.nm)+' <span style="font-size:16px;color:#FFD24D">Lv.'+o.lv+'</span></h3>'
    + '<div class="role">'+RAR[c.rar].nm+' CLASS ／ '+esc(c.role)+'</div>'
    + '<div class="skill"><b>'+esc(c.sk.nm)+'（1ゲーム'+c.sk.uses+'回）</b>'+esc(c.sk.ds)+'</div>'
    + '<div style="margin-top:9px">'+statRows(st)+'</div>'
    + '<div style="display:flex;gap:9px;margin-top:12px">'
    +   '<button class="btn ghost" id="cdEquip" style="flex:1;font-size:16px;padding:9px 0"'
    +     (SV.equip===c.id?' disabled':'')+'>'+(SV.equip===c.id?'装備中':'装備する')+'</button>'
    +   '<button class="btn gold" id="cdUp" style="flex:1.3;font-size:16px;padding:9px 0"'
    +     (canUp?'':' disabled')+'>強化 🪙'+cost+' ／ 同カード×1</button>'
    + '</div>'
    + '<div style="font-size:11.5px;color:#8FA9C4;margin-top:6px;text-align:center">'
    +   (o.lv>=30 ? 'レベル最大' : (o.dup>0 ? '重なり '+o.dup+' 枚' : 'ガチャで同じカードを引くと強化できます'))+'</div>'
    + '</div></div>';
  regPortrait($('#cdPic'), c.art, c.col);
  $('#cdEquip').onclick = ()=>{ SV.equip = c.id; saveNow(); SFX.click(); drawCardGrid(); drawCardDetail(); };
  $('#cdUp').onclick = ()=>{
    if(!canUp) return;
    SV.gold -= cost; o.dup--; o.lv++;
    saveNow(); SFX.build(); drawCardGrid(); drawCardDetail();
    const w = $('#wGold'); if(w) w.textContent = SV.gold.toLocaleString();
    toast('R','⬆','強化成功', c.nm+' が Lv.'+o.lv+' になりました', 2200);
  };
}

/* ── ガチャ ─────────────────────────────────────────── */
function rollRarity(){
  const t = RAR.A.w + RAR.S.w + RAR.SS.w;
  let r = Math.random()*t;
  if((r -= RAR.SS.w) < 0) return 'SS';
  if((r -= RAR.S.w) < 0) return 'S';
  return 'A';
}
function drawOne(){
  const rar = rollRarity();
  const f = featureCard();
  // 今週の注目カードは出やすさ2倍（同レアリティの中で2枚ぶんとして数える）
  const pool = CARDPOOL.filter(c=>c.rar===rar);
  if(f.rar===rar) pool.push(f);
  return pool[(Math.random()*pool.length)|0];
}
function grant(c){
  if(SV.cards[c.id]) SV.cards[c.id].dup++;
  else SV.cards[c.id] = {lv:1, dup:0};
  // 低確率でペンダントも
  if(Math.random()<0.18){
    const p = PENDANTS[(Math.random()*PENDANTS.length)|0];
    if(!SV.pendants[p.id]) SV.pendants[p.id] = {};
  }
}
function showGacha(){
  const el = mkScreen('gacha',
    tabsHTML('gacha')
    + '<div class="inner">'
    + '<div class="metahd"><h2>ガチャ</h2>'
    +   '<span class="note">ペンダントも一定確率で手に入ります</span></div>'
    + '<div class="stage" id="gStage"><div class="orb"></div></div>'
    + '<div class="btns">'
    +   '<button class="btn ghost" id="g1" style="font-size:20px;padding:12px 34px">1回 🪙800</button>'
    +   '<button class="btn gold" id="g10" style="font-size:20px;padding:12px 34px">10回 🪙7,200</button>'
    + '</div>'
    + '<div class="rates">出現率　S+ 6%　／　S 26%　／　A 68%　'
    +   '<br>すでに持っているカードは「重なり」になり、カードの強化に使えます。</div>'
    + '</div>' + walletHTML());
  wireTabs(el);
  $('#g1').onclick  = ()=>doGacha(1);
  $('#g10').onclick = ()=>doGacha(10);
  screenTo('gacha');
}
async function doGacha(n){
  const cost = n===1 ? 800 : 7200;
  if(SV.gold < cost){ toast('R','🪙','ゴールドが足りません','ゲームに勝つと増えます',2200); SFX.bad(); return; }
  SV.gold -= cost;
  const got = [];
  for(let i=0;i<n;i++){ const c = drawOne(); grant(c); got.push(c); }
  saveNow();
  const st = $('#gStage');
  st.innerHTML = '<div class="orb"></div>';
  SFX.skill();
  await wait(500);
  st.innerHTML = '<div class="pulls" id="gPulls"></div>';
  const box = $('#gPulls');
  for(let i=0;i<got.length;i++){
    const c = got[i];
    const d = document.createElement('div');
    d.className = 'pullcard ' + RAR[c.rar].cls;
    d.style.animationDelay = (i*70)+'ms';
    d.innerHTML = '<canvas width="150" height="180"></canvas>'
      + '<div class="b">'+esc(c.nm)+'<i>'+RAR[c.rar].nm+'</i></div>';
    regPortrait(d.querySelector('canvas'), c.art, c.col);
    box.appendChild(d);
    if(c.rar==='SS'){ SFX.win(); } else SFX.coin();
    await wait(120);
  }
  const w = $('#wGold'); if(w) w.textContent = SV.gold.toLocaleString();
}

/* ── ペンダント ─────────────────────────────────────── */
function showPend(){
  const el = mkScreen('pend',
    tabsHTML('pend')
    + '<div class="inner">'
    + '<div class="metahd"><h2>ペンダント</h2>'
    +   '<span class="note">4つまで装備できます</span></div>'
    + '<div class="pendwrap">'
    +   '<div><div class="slots" id="pSlots"></div>'
    +     '<div style="margin-top:14px" id="pStats"></div></div>'
    +   '<div class="pendgrid" id="pGrid"></div>'
    + '</div>'
    + '</div>' + walletHTML());
  wireTabs(el);
  drawPend();
  screenTo('pend');
}
function drawPend(){
  const s = $('#pSlots'); s.innerHTML = '';
  SV.slots.forEach((pid,i)=>{
    const p = pendById(pid);
    const d = document.createElement('div');
    d.className = 'slot' + (p?' on':'');
    d.innerHTML = p ? (p.ic + '<span class="nm">'+esc(p.nm)+'</span>') : '＋';
    d.onclick = ()=>{ if(!p) return; SV.slots[i]=null; saveNow(); SFX.click(); drawPend(); };
    s.appendChild(d);
  });
  const g = $('#pGrid'); g.innerHTML = '';
  PENDANTS.forEach(p=>{
    const have = !!SV.pendants[p.id];
    const eq = SV.slots.indexOf(p.id)>=0;
    const d = document.createElement('div');
    d.className = 'pend' + (have?'':' no') + (eq?' eq':'');
    d.innerHTML = '<div class="ic">'+p.ic+'</div><div class="nm">'+esc(have?p.nm:'？？？')+'</div>'
      + '<div class="ef">'+(have?esc(p.ds):'未所持')+'</div>';
    d.onclick = ()=>{
      if(!have || eq) return;
      const k = SV.slots.indexOf(null);
      if(k<0){ toast('R','📿','枠がいっぱいです','外してから付けてください',1900); return; }
      SV.slots[k] = p.id; saveNow(); SFX.click(); drawPend();
    };
    g.appendChild(d);
  });
  const c = equippedCard(), o = SV.cards[c.id]||{lv:1};
  $('#pStats').innerHTML = '<div class="pan"><div class="in">'
    + '<h3>'+esc(c.nm)+' の合計ステータス</h3>'
    + statRows(cardStats(c.id,o.lv,SV.slots), cardStats(c.id,o.lv,[])) + '</div></div>';
}

/* ── VS 画面 ─────────────────────────────────────────── */
const VS_TIPS = [
  'ペンダントはあなたの勝利の女神様！　4つ全部つけて挑もう。',
  '同じ数字の目を出すと「ダブル」が発生し、続けてサイコロを振れます。',
  '旅行のマスに止まると、行きたいところへ移動できます。',
  '相手がキャッチする時にじゃまができます。',
  'トリプル独占をそろえると、その場で勝ちになります。'
];
async function vsScreen(){
  const el = $('#vs');
  const me = cfg.seats.find(s=>s.kind!=='cpu') || cfg.seats[0];
  const foe = cfg.seats.slice(0,cfg.n).find(s=>s!==me) || cfg.seats[1];
  const cm = cardById(me.cardId)||CARDPOOL[0], cf = cardById(foe.cardId)||CARDPOOL[1];
  el.innerHTML =
    '<div class="row">'
    + '<div class="side"><canvas id="vsA" width="300" height="330"></canvas>'
    +   '<div class="nm">'+esc(me.name)+'</div><div class="rl">'+esc(cm.nm)+' ／ '+esc(cm.role)+'</div></div>'
    + '<div class="vsmark">VS</div>'
    + '<div class="side r"><canvas id="vsB" width="300" height="330"></canvas>'
    +   '<div class="nm">'+esc(foe.name)+'</div><div class="rl">'+esc(cf.nm)+' ／ '+esc(cf.role)+'</div></div>'
    + '</div>'
    + '<div class="tip"><b>TIP</b>'+esc(VS_TIPS[(Math.random()*VS_TIPS.length)|0])+'</div>';
  regPortrait($('#vsA'), cm.art, cm.col);
  regPortrait($('#vsB'), cf.art, cf.col);
  el.classList.add('on');
  SFX.skill();
  await wait(2000);
  el.classList.remove('on');
}

/* ── 対戦後の報酬 ───────────────────────────────────── */
async function grantRewards(won){
  const gold = won ? 1400 : 480;
  const exp  = won ? 40 : 14;
  SV.gold += gold; SV.exp += exp; SV.plays++; if(won) SV.wins++;
  let up = 0;
  while(SV.exp >= playerLvNeed(SV.lv)){ SV.exp -= playerLvNeed(SV.lv); SV.lv++; up++; }
  let pend = null;
  if(Math.random() < (won?0.35:0.15)){
    const p = PENDANTS[(Math.random()*PENDANTS.length)|0];
    if(!SV.pendants[p.id]){ SV.pendants[p.id] = {}; pend = p; }
  }
  saveNow();
  await modal('<div class="modal"><div class="reward"><div class="in">'
    + '<h3>'+(won?'勝利報酬':'参加報酬')+'</h3>'
    + '<div class="items">'
    +   '<div class="it"><div class="ic">🪙</div><div class="v">+'+gold.toLocaleString()+'</div>'
    +     '<div class="l">ゴールド</div></div>'
    +   '<div class="it"><div class="ic">⭐</div><div class="v">+'+exp+'</div><div class="l">経験値</div></div>'
    +   (up?'<div class="it"><div class="ic">🆙</div><div class="v">Lv.'+SV.lv+'</div>'
    +     '<div class="l">レベルアップ</div></div>':'')
    +   (pend?'<div class="it"><div class="ic">'+pend.ic+'</div><div class="v" style="font-size:14px">'
    +     esc(pend.nm)+'</div><div class="l">ペンダント</div></div>':'')
    + '</div>'
    + '<div class="btnrow" style="justify-content:center;margin-top:14px">'
    + '<button class="btn gold" data-act="ok">受け取る</button></div>'
    + '</div></div></div>');
}

/* ══════════════════════════════════════════════════════════════
   週替わりイベント
   毎週【月曜 朝6時】を境に、今週のイベントと注目カードが自動で切り替わる。
   サーバも定期実行も要らない（端末の日付から週番号を出しているだけ）。
   ══════════════════════════════════════════════════════════════ */
function weekIndex(){
  // 1970-01-05(月) 06:00 を起点にした通し週番号
  const base = Date.UTC(1970,0,5,6,0,0);
  return Math.floor((Date.now() - base) / (7*24*3600*1000));
}
const WEEKLY = [
  {id:'gold',  ic:'🪙', nm:'ゴールドラッシュ', ds:'スタート通過の給料が2倍になる週',
   apply:g=>{ g.ev = {salaryX:2}; }},
  {id:'sale',  ic:'🏗', nm:'建設バーゲン',     ds:'建設費用が2割引きになる週',
   apply:g=>{ g.ev = {buildX:0.8}; }},
  {id:'toll',  ic:'💰', nm:'通行料値上げ',     ds:'すべての通行料が1.3倍になる週',
   apply:g=>{ g.ev = {tollX:1.3}; }},
  {id:'luck',  ic:'🍀', nm:'幸運のフォーチュン', ds:'チャンスカードで良い効果が出やすい週',
   apply:g=>{ g.ev = {luck:0.45}; }},
  {id:'mini',  ic:'🕯️', nm:'洞窟フィーバー',   ds:'ミニゲームの倍率が最初から×4の週',
   apply:g=>{ g.ev = {miniX:2}; }},
  {id:'dice',  ic:'🎲', nm:'ダイス増量',       ds:'奇数・偶数ボタンが2回ずつ増える週',
   apply:g=>{ g.ev = {}; g.players.forEach(p=>{ p.odd+=2; p.even+=2; }); }},
  {id:'mono',  ic:'👑', nm:'独占ウィーク',     ds:'トリプル独占の通行料がさらに1.5倍の週',
   apply:g=>{ g.ev = {monoX:1.5}; }}
];
function thisWeek(){ return WEEKLY[((weekIndex()%WEEKLY.length)+WEEKLY.length)%WEEKLY.length]; }
function featureCard(){ return CARDPOOL[((weekIndex()*3)%CARDPOOL.length+CARDPOOL.length)%CARDPOOL.length]; }
function weekEndsIn(){
  const base = Date.UTC(1970,0,5,6,0,0);
  const ms = (weekIndex()+1)*(7*24*3600*1000) + base - Date.now();
  const d = Math.floor(ms/86400000), h = Math.floor(ms%86400000/3600000);
  return d+'日'+h+'時間';
}
function weekBannerHTML(){
  const w = thisWeek(), f = featureCard();
  return '<div style="display:flex;align-items:center;gap:14px;margin-top:16px;padding:11px 16px;'
    + 'border-radius:14px;border:2px solid #D3A22C;'
    + 'background:linear-gradient(90deg,rgba(107,78,18,.9),rgba(28,20,6,.85))">'
    + '<span style="font-size:32px">'+w.ic+'</span>'
    + '<span style="flex:1"><b style="display:block;font-size:16px;color:#FFE9B5">今週のイベント：'
    +   esc(w.nm)+'</b>'
    + '<i style="font-style:normal;font-size:12.5px;color:#CBDCEE">'+esc(w.ds)
    +   '　／　残り '+weekEndsIn()+'（毎週 月曜 朝6時に切替）</i></span>'
    + '<span style="text-align:center;padding:5px 12px;border-radius:10px;background:rgba(6,14,26,.7);'
    +   'border:1px solid #3D5578">'
    + '<b style="display:block;font-size:11px;color:#8FA9C4">注目カード</b>'
    + '<i style="font-style:normal;font-size:14px;font-weight:900;color:#FFD24D">'+esc(f.nm)+' ×2</i></span>'
    + '</div>';
}

/* ── 既存フローへの接続 ─────────────────────────────── */
$('#toSetup').onclick = ()=>{ SFX.click(); ac(); showHome(); };
$('#backTitle').onclick = ()=>{ SFX.click(); showHome(); };
$('#againSetup').onclick = ()=>{ SFX.click(); showHome(); };
</script>
