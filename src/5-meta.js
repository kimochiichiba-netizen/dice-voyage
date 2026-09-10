
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

/* ── カード図鑑（12枚。artは描画の元になる4体） ───────────── */
const CARDPOOL = [
  {id:'c01', art:0, col:'#4C9BE8', nm:'ミナ',    role:'氷の魔法使い', rar:'A',
   line:'凍らせてあげる。動かないでね。',
   st:{toll:62,mini:44,special:50,fortune:52,build:74,gauge:54,buyout:40},
   sk:{nm:'アイスウォール', ds:'次に払う通行料が0になる', uses:2}},
  {id:'c02', art:1, col:'#E14A5A', nm:'ガル',    role:'紅蓮の剣士',   rar:'A',
   line:'細かい話は苦手だ。ぶつかるぞ。',
   st:{toll:74,mini:60,special:40,fortune:36,build:46,gauge:64,buyout:56},
   sk:{nm:'突撃', ds:'次のサイコロの出目を自分で選べる', uses:2}},
  {id:'c03', art:2, col:'#54C06A', nm:'リノ',    role:'風の弓使い',   rar:'A',
   line:'当てるのは得意なんだ。',
   st:{toll:50,mini:78,special:54,fortune:62,build:50,gauge:80,buyout:44},
   sk:{nm:'風読み', ds:'好きなマスへ移動する', uses:2}},
  {id:'c04', art:3, col:'#E0A73C', nm:'ゼニ',    role:'黄金の商人',   rar:'A',
   line:'商売は数字だよ、お客さん。',
   st:{toll:44,mini:48,special:76,fortune:78,build:60,gauge:42,buyout:80},
   sk:{nm:'金策', ds:'総資産の8%を現金で受け取る', uses:2}},

  {id:'c05', art:0, col:'#8E6BE0', nm:'ヴェル',  role:'紫電の賢者',   rar:'S',
   line:'計算どおり、ですね。',
   st:{toll:70,mini:56,special:66,fortune:70,build:84,gauge:62,buyout:52},
   sk:{nm:'雷の理', ds:'次の建設が無料になる', uses:2}},
  {id:'c06', art:1, col:'#E8743C', nm:'バーン',  role:'業火の闘士',   rar:'S',
   line:'燃やし尽くす！',
   st:{toll:86,mini:66,special:44,fortune:44,build:56,gauge:76,buyout:70},
   sk:{nm:'業火', ds:'次のサイコロの出目を自分で選べる', uses:3}},
  {id:'c07', art:2, col:'#3FC0B0', nm:'セイル',  role:'蒼海の斥候',   rar:'S',
   line:'風向きが変わったよ。',
   st:{toll:58,mini:88,special:60,fortune:72,build:54,gauge:90,buyout:50},
   sk:{nm:'追い風', ds:'好きなマスへ移動する', uses:3}},
  {id:'c08', art:3, col:'#D8B44A', nm:'コイン',  role:'両替商',       rar:'S',
   line:'手数料はいただきますよ。',
   st:{toll:50,mini:54,special:86,fortune:84,build:66,gauge:48,buyout:90},
   sk:{nm:'両替', ds:'総資産の12%を現金で受け取る', uses:2}},

  {id:'c09', art:0, col:'#7FE6FF', nm:'アルカ',  role:'原初の氷姫',   rar:'SS',
   line:'この盤は、わたしのもの。',
   st:{toll:80,mini:62,special:72,fortune:74,build:96,gauge:70,buyout:60},
   sk:{nm:'絶対零度', ds:'相手の街を2ターン凍らせ、次の通行料も0にする', uses:2}},
  {id:'c10', art:1, col:'#FF5A44', nm:'グラム',  role:'覇竜の剣聖',   rar:'SS',
   line:'退がるという言葉はない。',
   st:{toll:96,mini:72,special:52,fortune:52,build:64,gauge:86,buyout:78},
   sk:{nm:'覇断', ds:'出目を選び、さらにもう一度振れる', uses:2}},
  {id:'c11', art:2, col:'#7DE08A', nm:'ノワ',    role:'翠嵐の狩人',   rar:'SS',
   line:'外したことは、ない。',
   st:{toll:64,mini:96,special:68,fortune:82,build:60,gauge:98,buyout:56},
   sk:{nm:'千里眼', ds:'好きなマスへ移動し、通行料を1回無効化する', uses:2}},
  {id:'c12', art:3, col:'#FFD24D', nm:'ミダス',  role:'黄金王',       rar:'SS',
   line:'触れたものは、すべて金になる。',
   st:{toll:56,mini:60,special:94,fortune:96,build:78,gauge:54,buyout:98},
   sk:{nm:'黄金律', ds:'総資産の18%を現金で受け取る', uses:2}}
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
  if(!el){ el = document.createElement('div'); el.className='screen'; el.id=id; $('#stage').appendChild(el); }
  el.innerHTML = innerHTML;
  return el;
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
    return '<div style="display:flex;align-items:center;gap:6px;margin:2px 0">'
      + '<span style="flex:0 0 96px;font-size:11px;color:#9FB6CC">'+l+'</span>'
      + '<span style="flex:1;height:8px;border-radius:4px;background:#0a1420;overflow:hidden;display:block">'
      +   '<i style="display:block;height:100%;width:'+Math.min(100,v)+'%;'
      +     'background:linear-gradient(90deg,#E08A1A,#FFD24D)"></i></span>'
      + '<span style="flex:0 0 44px;text-align:right;font-family:var(--pop);font-size:12px;color:#FFE9B5">'
      +   v + (d>0?'<span style="color:#7DE08A;font-size:10px"> +'+d+'</span>':'') + '</span>'
      + '</div>';
  }).join('');
}

/* ── ホーム ─────────────────────────────────────────── */
function showHome(){
  const c = equippedCard(), own = SV.cards[c.id]||{lv:1};
  const st = myStats();
  mkScreen('home',
    '<div class="inner">'
    + '<div class="hero">'
    +   '<div class="heroPic"><span class="rk">'+RAR[c.rar].nm+' CLASS</span>'
    +     '<canvas id="homePic" width="330" height="420"></canvas></div>'
    +   '<div class="heroInfo">'
    +     '<h1>ダイスボヤージュ</h1><div class="cap">DICE VOYAGE</div>'
    +     '<div class="line"><b style="color:#FFE9B5">'+esc(c.nm)+'</b>（'+esc(c.role)+'） Lv.'+own.lv
    +       '　「'+esc(c.line)+'」</div>'
    +     '<div class="stats">'+statRows(st, cardStats(c.id, own.lv, []))+'</div>'
    +   '</div>'
    + '</div>'
    + '<div class="modes">'
    +   '<div class="modebtn big" id="mPlay"><div class="ic">🎲</div><div class="nm">ゲーム開始</div>'
    +     '<div class="ds">CPU・ともだちと<br>最大4人で対戦</div></div>'
    +   '<div class="modebtn" id="mCards"><div class="ic">🎴</div><div class="nm">カード</div>'
    +     '<div class="ds">強化してステータスを<br>上げる</div></div>'
    +   '<div class="modebtn gold" id="mGacha"><div class="ic">✨</div><div class="nm">ガチャ</div>'
    +     '<div class="ds">新しいキャラを<br>引き当てる</div>'
    +     (SV.gold>=800?'<span class="badge">引ける</span>':'')+'</div>'
    +   '<div class="modebtn" id="mPend"><div class="ic">📿</div><div class="nm">ペンダント</div>'
    +     '<div class="ds">4枠に装備して<br>能力を底上げ</div></div>'
    + '</div>'
    + weekBannerHTML()
    + '</div>' + walletHTML());
  regPortrait($('#homePic'), c.art, c.col);
  $('#mPlay').onclick  = ()=>{ SFX.click(); screenTo('setup'); };
  $('#mCards').onclick = ()=>{ SFX.click(); showCards(); };
  $('#mGacha').onclick = ()=>{ SFX.click(); showGacha(); };
  $('#mPend').onclick  = ()=>{ SFX.click(); showPend(); };
  screenTo('home');
}

/* ── カード ─────────────────────────────────────────── */
let cardSel = null;
function showCards(){
  cardSel = cardSel && SV.cards[cardSel] ? cardSel : SV.equip;
  mkScreen('cards',
    '<div class="inner">'
    + '<div class="metahd"><h2>カード</h2>'
    +   '<span style="font-size:13px;color:#9FB6CC">同じカードが重なると強化に使えます</span>'
    +   '<span class="sp"><button class="btn ghost" id="cBack">ホームへ</button></span></div>'
    + '<div class="cardwrap"><div id="cardDetail"></div>'
    +   '<div class="cardgrid" id="cardGrid"></div></div>'
    + '</div>' + walletHTML());
  $('#cBack').onclick = ()=>{ SFX.click(); showHome(); };
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
  mkScreen('gacha',
    '<div class="inner">'
    + '<div class="metahd"><h2>ガチャ</h2>'
    +   '<span style="font-size:13px;color:#9FB6CC">ペンダントも一定確率で手に入ります</span>'
    +   '<span class="sp"><button class="btn ghost" id="gBack">ホームへ</button></span></div>'
    + '<div class="stage" id="gStage"><div class="orb"></div></div>'
    + '<div class="btns">'
    +   '<button class="btn ghost" id="g1" style="font-size:20px;padding:12px 34px">1回 🪙800</button>'
    +   '<button class="btn gold" id="g10" style="font-size:20px;padding:12px 34px">10回 🪙7,200</button>'
    + '</div>'
    + '<div class="rates">出現率　S+ 6%　／　S 26%　／　A 68%　'
    +   '<br>すでに持っているカードは「重なり」になり、カードの強化に使えます。</div>'
    + '</div>' + walletHTML());
  $('#gBack').onclick = ()=>{ SFX.click(); showHome(); };
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
  mkScreen('pend',
    '<div class="inner">'
    + '<div class="metahd"><h2>ペンダント</h2>'
    +   '<span style="font-size:13px;color:#9FB6CC">4つまで装備できます</span>'
    +   '<span class="sp"><button class="btn ghost" id="pBack">ホームへ</button></span></div>'
    + '<div class="pendwrap">'
    +   '<div><div class="slots" id="pSlots"></div>'
    +     '<div style="margin-top:14px" id="pStats"></div></div>'
    +   '<div class="pendgrid" id="pGrid"></div>'
    + '</div>'
    + '</div>' + walletHTML());
  $('#pBack').onclick = ()=>{ SFX.click(); showHome(); };
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
  $('#pStats').innerHTML = '<div style="background:rgba(8,18,32,.7);border:1px solid #2F4A6D;'
    + 'border-radius:12px;padding:11px 12px">'
    + '<div style="font-size:12px;font-weight:900;color:#FFD24D;margin-bottom:6px">'
    +   esc(c.nm)+' の合計ステータス</div>'
    + statRows(cardStats(c.id,o.lv,SV.slots), cardStats(c.id,o.lv,[])) + '</div>';
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
