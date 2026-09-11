
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 盤の見た目と演出（9h-board.js / WP7）
   ──────────────────────────────────────────────────────────────
   ・宣言し直す：updHUD fillHUD showChip hideChip turnBig pill payToll moneyFly raiseBanner
     finish celebrate pendFire drawStacks drawDestPin salary marquee dkShowReach
   ・代入ラッパ：moveSteps newGame（§5）と drawLake drawDice（社長指示の中央演出）。
     drawDice は WP2 も包むので、必ず前の関数を呼んでから足すだけにする。
   ・トップレベルは function 宣言と DKB_ 付きの var と初期化 IIFE だけ。DOM は IIFE の中で触る。
   ・演出の乱数は Math.random を使わない（対戦の乱数・自動対戦の種を乱さない）。
   ══════════════════════════════════════════════════════════════ */

var DKB_SEATS = ['Bot', 'BL', 'Top', 'TR'];
/* 自分（右下）以外の席の並び。2人戦は左上との対角 */
var DKB_ORDER = { 1: [], 2: ['Top'], 3: ['Top', 'BL'], 4: ['BL', 'Top', 'TR'] };
/* 札束の山の置き場（盤の外・その席の HUD のそば。ワールド座標） */
var DKB_STACK_XY = { Top: { x: 330, y: 252 }, TR: { x: 1286, y: 252 }, BL: { x: 330, y: 662 }, Bot: { x: 1286, y: 662 } };
var DKB_S = {
  built: false, hud: {}, band: {}, pbox: {}, seatOf: {}, piOf: {}, lastBR: -1, stackSig: '',
  potShown: null, toll: null, lake: { lv: 0, t: 0 }, errs: {}, mq: 0, chipTok: 0, plateR: null,
  imp: null, dmsg: null, bub: null, reach: null, like: null, deferT: -1, gid: 0
};

/* ══════════ 小道具 ══════════ */
function dkbFast(){ return typeof SPEED === 'number' && SPEED < 0.05; }
function dkbEl(tag, cls, html){
  var d = document.createElement(tag);
  if(cls) d.className = cls;
  if(html !== undefined && html !== null) d.innerHTML = html;
  return d;
}
function dkbTxt(el, t){ if(el && el.textContent !== t) el.textContent = t; }
function dkbErr(where, e){
  var k = where + ':' + (e && e.message);
  if(DKB_S.errs[k]) return;
  DKB_S.errs[k] = 1;
  console.error('[WP7] ' + where, e);
}
function dkbRnd(){ return (typeof DKFX === 'object' && DKFX && DKFX.rnd) ? DKFX.rnd() : 0.5; }
function dkbFmtClock(sec){
  sec = Math.max(0, sec || 0);
  var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}
/* ワールド座標 → ステージ座標（いまのカメラ） */
function dkbW2S(x, y){
  return { x: SW / 2 + (x - cam.x) * cam.z, y: SH / 2 + (y - cam.y) * cam.z };
}
/* proj の逆（ステージ座標 → 盤の p,q） */
function dkbUnproj(x, y){
  var a = (x - BCX) / KX, b = (y - BCY) / KY;
  return { p: (a + b) / 2 + S / 2, q: (b - a) / 2 + S / 2 };
}
/* 駒のワールド座標（足元） */
function dkbTokW(pi){
  var p = G && G.players[pi]; if(!p) return null;
  var r = p.render || tileCenter(p.pos);
  return { x: r.x + (p.offx || 0), y: r.y + (p.offy || 0) - (p.hopY || 0) };
}
/* 要素をワールドの点に毎フレーム合わせる（.on が外れたら止まる） */
function dkbFollow(el, getW, dy){
  var tok = {}; el._dkbTok = tok;
  var put = function(){
    var w = null;
    try{ w = getW(); }catch(e){ w = null; }
    if(!w) return;
    var s = dkbW2S(w.x, w.y + (dy || 0));
    el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
  };
  put();
  var dkbFollowStep = function(){
    if(el._dkbTok !== tok || !el.isConnected || !el.classList.contains('on')) return;
    put();
    requestAnimationFrame(dkbFollowStep);
  };
  requestAnimationFrame(dkbFollowStep);
}

/* ══════════ 席の割り当て（自分＝右下） ══════════ */
function dkbSeatMap(){
  var n = G.players.length, me = -1, i;
  var OL = window.DV_OL;
  if(OL && OL.started && Array.isArray(OL.seats)){
    for(i = 0; i < n; i++){
      var s = OL.seats[i];
      if(s && s.kind === 'human' && s.pid === OL.me && G.players[i] && G.players[i].kind !== 'cpu'){ me = i; break; }
    }
  }
  if(me < 0){
    var hum = [];
    for(i = 0; i < n; i++) if(G.players[i].kind !== 'cpu') hum.push(i);
    if(hum.length === 1) me = hum[0];
    else if(hum.length > 1){
      /* ともだちモード：右下＝手番の人間（CPU の番は直前の人のまま） */
      if(hum.indexOf(G.turn) >= 0 && !G.players[G.turn].out) me = G.turn;
      else if(hum.indexOf(DKB_S.lastBR) >= 0) me = DKB_S.lastBR;
      else me = hum[0];
    } else me = 0;
  }
  DKB_S.lastBR = me;
  var order = DKB_ORDER[n] || DKB_ORDER[4], rest = [];
  for(i = 0; i < n; i++) if(i !== me) rest.push(i);
  var seatOf = {}, piOf = {};
  seatOf[me] = 'Bot'; piOf.Bot = me;
  rest.forEach(function(pi, k){ var s2 = order[k] || DKB_SEATS[k + 1]; seatOf[pi] = s2; piOf[s2] = pi; });
  DKB_S.seatOf = seatOf; DKB_S.piOf = piOf;
  return DKB_S;
}
function dkbSeatOfPi(pi){
  if(!DKB_S.seatOf || DKB_S.seatOf[pi] === undefined){ if(G) dkbSeatMap(); }
  return DKB_S.seatOf[pi] || 'Bot';
}
function dkbStackXY(pi){ return DKB_STACK_XY[dkbSeatOfPi(pi)] || DKB_STACK_XY.Bot; }
/* 破産の札（4-game.js の bankrupt）も同じ山へ飛ぶように、STACK_POS の中身を席に合わせる */
function dkbSyncStackPos(){
  if(!G) return;
  for(var i = 0; i < G.players.length && i < STACK_POS.length; i++){
    var xy = dkbStackXY(i), u = dkbUnproj(xy.x, xy.y);
    STACK_POS[i].p = u.p; STACK_POS[i].q = u.q;
  }
}
function dkbBundles(cash){
  if(!(cash > 0)) return 0;
  return Math.max(3, Math.min(18, 3 + Math.floor(cash / 1500000)));
}

/* ══════════ 新しい試合の準備（newGame のラッパとオンラインの両方から） ══════════ */
function dkbOnNewGame(){
  if(!G) return;
  G.dkbInit = true;
  var s = 0; G.players.forEach(function(p){ s += (p.cash || 0); });
  G.pot = s;
  G.reachTiles = [];
  G.dkbLikes = 0;
  DKB_S.gid++;
  DKB_S.potShown = null; DKB_S.toll = null; DKB_S.lastBR = -1; DKB_S.stackSig = '';
  DKB_S.lake = { lv: 0, t: 0 };
  try{
    dkbHideTransient();
    DKB_SEATS.forEach(function(seat){
      var h = DKB_S.hud[seat]; if(!h) return;
      var rb = h.querySelector('.dkb-rank'); if(rb){ rb._t = undefined; rb.classList.remove('dkb-flip'); }
      h._pi = undefined;
    });
    var ck = document.getElementById('pClock');
    if(ck){ ck.classList.remove('warn'); ck.textContent = cfg.timeLimit ? dkbFmtClock(G.clock) : '--:--'; }
    if(DKB_S.like) DKB_S.like.querySelector('b').textContent = '0';
  }catch(e){ dkbErr('newgame', e); }
}
function dkbEnsureG(){
  if(!G) return;
  if(!G.dkbInit) dkbOnNewGame();
  if(typeof G.pot !== 'number' || !isFinite(G.pot)){ var s = 0; G.players.forEach(function(p){ s += (p.cash || 0); }); G.pot = s; }
  if(!Array.isArray(G.reachTiles)) G.reachTiles = [];
}
function dkbHideTransient(){
  var ids = ['chip', 'dbl'];
  ids.forEach(function(id){ var e = document.getElementById(id); if(e) e.classList.remove('dkb-on', 'dkb-out'); });
  [DKB_S.imp, DKB_S.dmsg, DKB_S.bub, DKB_S.reach].forEach(function(e){ if(e) e.classList.remove('on', 'dkb-on', 'dkb-out'); });
  DKB_SEATS.forEach(function(seat){
    var b = DKB_S.band[seat]; if(b){ clearTimeout(b._t); b.classList.remove('on', 'dkb-fade'); }
    var pb = DKB_S.pbox[seat]; if(pb) pb.innerHTML = '';
  });
  var r = document.getElementById('raise'); if(r) r.classList.remove('on');
  var stg = document.getElementById('stage'); if(stg) stg.classList.remove('dkb-cel');
}

/* ══════════ DOM を作る（初回の updHUD か起動時） ══════════ */
function dkbHudHTML(seat){
  return '<div class="dkb-pwrap">'
    + '<div class="dkb-por" role="button" tabindex="0" aria-label="プレイヤーの情報">'
    +   '<div class="dkb-pin"><canvas width="224" height="224"></canvas></div>'
    +   '<b class="dkb-rar">A</b><b class="dkb-lv">1</b>'
    + '</div>'
    + (seat === 'Bot' ? '' : '<span class="dkb-ab">能力</span>')
    + '<i class="dkb-turn">手番</i>'
    + '</div>'
    + '<div class="dkb-col">'
    +   '<div class="dkb-name"><span class="dkb-nm">—</span></div>'
    +   '<div class="dkb-row dkb-ra"><span class="dkb-k">総資産</span><b class="dkb-asset">0</b></div>'
    +   '<div class="dkb-row dkb-rc"><span class="dkb-k">所持金</span><b class="dkb-cash">0</b></div>'
    +   '<div class="dkb-gauge"><span class="dkb-gbar"><i></i></span><span class="dkb-gtx">能力 0%</span></div>'
    +   '<div class="dkb-jam">邪魔できる回数：<b>3</b></div>'
    + '</div>'
    + '<div class="dkb-rank"><b>1</b><small>位</small></div>';
}
function dkbBuild(){
  if(DKB_S.built) return;
  var st = document.getElementById('stage'); if(!st) return;
  DKB_S.built = true;
  var world = document.getElementById('world');
  var vg = dkbEl('div', 'dkb-vignette'); vg.setAttribute('aria-hidden', 'true');
  if(world && world.nextSibling) st.insertBefore(vg, world.nextSibling); else st.appendChild(vg);

  DKB_SEATS.forEach(function(seat){
    var h = dkbEl('div', 'hud dkb-hud dkb-' + seat, dkbHudHTML(seat));
    h.id = 'dkbHud' + seat; h.setAttribute('data-seat', seat); h.style.display = 'none';
    st.appendChild(h); DKB_S.hud[seat] = h;
    var por = h.querySelector('.dkb-por');
    var open = function(){ if(h.hasAttribute('data-pi')){ try{ SFX.click(); }catch(e){} dkbInfo(+h.getAttribute('data-pi')); } };
    por.addEventListener('click', open);
    por.addEventListener('keydown', function(ev){ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); open(); } });
    var b = dkbEl('div', 'pill dkb-band dkb-b' + seat, '<i class="dkb-bar">▲</i><b class="dkb-bnum">0</b>');
    b.setAttribute('aria-hidden', 'true'); st.appendChild(b); DKB_S.band[seat] = b;
    var pb = dkbEl('div', 'dkb-pbox dkb-p' + seat); st.appendChild(pb); DKB_S.pbox[seat] = pb;
  });
  /* 能力ボタンは自分の席の肖像の下へ移す（id・onclick はそのまま） */
  var sk = document.getElementById('skillBtn');
  if(sk){ sk.classList.remove('skillbtn'); sk.classList.add('dkb-skill'); DKB_S.hud.Bot.querySelector('.dkb-pwrap').appendChild(sk); }

  /* プレート：上に「時間 mm:ss 制限ターン N」、下に場の総額 */
  var pl = document.getElementById('plate');
  if(pl){
    pl.innerHTML = '<div class="hd"><span class="dkb-pk">時間</span><span class="timer" id="pClock">'
      + (cfg.timeLimit ? dkbFmtClock(cfg.timeLimit) : '--:--') + '</span>'
      + '<span class="dkb-pk">制限ターン</span><em id="pTurn">' + (cfg.turns || 12) + '</em>'
      + '<span class="infl" id="pInfl"></span></div>'
      + '<div class="bd" id="pGoal">' + yen((cfg.cash || 0) * (cfg.n || 4)) + '</div>';
  }
  /* 出目・ダブル・ゲージインパクト・吹き出し */
  var chip = document.getElementById('chip');
  if(chip) chip.innerHTML = '<i class="dkb-rays"></i><i class="dkb-rays2"></i><i class="dkb-disc"></i><b class="dkb-num">7</b>';
  var dbl = document.getElementById('dbl'); if(dbl) dbl.textContent = '×ダブル';
  DKB_S.imp = dkbEl('div', 'dkb-imp', '<i>カード<br>効果</i><b>ゲージインパクト</b>'); st.appendChild(DKB_S.imp);
  DKB_S.dmsg = dkbEl('div', 'dkb-dmsg', '<b>ダブルボーナス！</b><span>もう一回！サイコロを振ります</span>'); st.appendChild(DKB_S.dmsg);
  DKB_S.bub = dkbEl('div', 'dkb-bub'); st.appendChild(DKB_S.bub);
  DKB_S.reach = dkbEl('div', 'dkb-reach', '<div class="dkb-rbang">!</div><div class="dkb-rband"><span></span><b></b><em>FORTUNE!</em></div>');
  st.appendChild(DKB_S.reach);
  var rz = document.getElementById('raise'); if(rz) rz.innerHTML = '<b>通行料値上げ！</b>';

  /* 左端の「？ ゲットアイテム」と右端の👍 */
  var gi = dkbEl('button', 'dkb-getitem', '<b>？</b><span>ゲットアイテム</span>');
  gi.type = 'button'; gi.addEventListener('click', function(){ try{ SFX.click(); }catch(e){} dkbItemsPanel(); });
  st.appendChild(gi);
  DKB_S.like = dkbEl('button', 'dkb-like', '<i>👍</i><b>0</b>');
  DKB_S.like.type = 'button'; DKB_S.like.setAttribute('aria-label', 'いいねを送る');
  DKB_S.like.addEventListener('click', function(){ try{ SFX.click(); }catch(e){} dkbEmote(DKB_S.piOf.Bot !== undefined ? DKB_S.piOf.Bot : 0, '👍'); });
  st.appendChild(DKB_S.like);

  /* ⏸・絵文字を付け直す */
  var mn = document.getElementById('menu');
  if(mn){ mn.onclick = null; mn.addEventListener('click', function(){ try{ SFX.click(); }catch(e){} dkbMenu(); }); mn.setAttribute('aria-label', 'メニュー'); }
  var eb = document.getElementById('emotebtn');
  if(eb){ eb.onclick = null; eb.addEventListener('click', function(){ var bar = document.getElementById('emotebar'); if(bar) bar.classList.toggle('on'); try{ SFX.click(); }catch(e){} }); }
  Array.prototype.forEach.call(document.querySelectorAll('#emotebar button'), function(btn){
    btn.onclick = null;
    btn.addEventListener('click', function(){
      dkbEmote(DKB_S.piOf.Bot !== undefined ? DKB_S.piOf.Bot : 0, btn.getAttribute('data-e') || btn.textContent);
      var bar = document.getElementById('emotebar'); if(bar) bar.classList.remove('on');
      try{ SFX.click(); }catch(e){}
    });
  });
}
/* プレートの位置（ステージ座標）。浮き数字をよけるのに使う */
function dkbPlateRect(){
  if(DKB_S.plateR) return DKB_S.plateR;
  var pl = document.getElementById('plate'); if(!pl || !pl.offsetWidth) return null;
  var w = pl.offsetWidth, h = pl.offsetHeight, l = pl.offsetLeft - w / 2, t = pl.offsetTop;
  DKB_S.plateR = { l: l, t: t, r: l + w, b: t + h };
  return DKB_S.plateR;
}

/* ══════════ HUD ══════════ */
function updHUD(){
  if(!G) return;
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  dkbEnsureG();
  var rk = rank();
  var rankOf = function(pi){ for(var k = 0; k < rk.length; k++) if(rk[k].i === pi) return k + 1; return rk.length; };
  dkbSeatMap();
  DKB_SEATS.forEach(function(seat){
    var el = DKB_S.hud[seat]; if(!el) return;
    var pi = DKB_S.piOf[seat];
    if(pi === undefined || !G.players[pi]){
      if(el.style.display !== 'none') el.style.display = 'none';
      el.removeAttribute('data-pi');
      return;
    }
    if(el.style.display) el.style.display = '';
    if(el.getAttribute('data-pi') !== String(pi)) el.setAttribute('data-pi', String(pi));
    fillHUD(seat, pi, seat === 'Bot' ? 'bot' : 'top');
    var p = G.players[pi], out = !!p.out, r = rankOf(pi);
    var rb = el.querySelector('.dkb-rank');
    var key = (out ? '破' : String(r)) + '|' + pi;
    if(rb && rb._t !== key){
      rb.innerHTML = '<b>' + (out ? '破' : r) + '</b><small>' + (out ? '産' : '位') + '</small>';
      /* 順位が変わった時だけ回す（席の入れ替えや試合開始では回さない） */
      if(rb._t !== undefined && String(rb._t).split('|')[1] === String(pi) && !dkbFast() && !DKFX.reduced){
        rb.classList.remove('dkb-flip'); void rb.offsetWidth; rb.classList.add('dkb-flip');
      }
      rb._t = key;
    }
    el.classList.toggle('dkb-out', out);
    el.classList.toggle('dkb-myturn', G.turn === pi && !out && !G.over);
  });

  /* プレート */
  dkbTxt(document.getElementById('pTurn'), String(Math.max(0, G.turnsLeft)));
  var ie = document.getElementById('pInfl');
  if(ie){ var on = G.infl > 1; ie.classList.toggle('on', on); dkbTxt(ie, on ? '通行料 ×' + inflTxt() : ''); }
  var ck = document.getElementById('pClock');
  if(ck){ if(!cfg.timeLimit) dkbTxt(ck, '--:--'); else if(!G.running) dkbTxt(ck, dkbFmtClock(G.clock)); }
  var pg = document.getElementById('pGoal');
  if(pg && DKB_S.potShown !== G.pot){
    var from = (DKB_S.potShown === null) ? G.pot : DKB_S.potShown;
    DKB_S.potShown = G.pot;
    if(from === G.pot || dkbFast()) pg.textContent = yen(G.pot);
    else fxCount(pg, G.pot, { from: from, dur: 700 * SPEED, fmt: yen });
  }

  /* 札束の山：席・束の数・持ち物の数が変わったら盤を描き直す */
  var sig = '';
  G.players.forEach(function(p, i){ sig += dkbSeatOfPi(i) + (p.out ? 'x' : dkbBundles(p.cash)) + '.' + ((p.items || []).length) + ';'; });
  if(sig !== DKB_S.stackSig){ DKB_S.stackSig = sig; dkbSyncStackPos(); boardChanged(); }
  renderItems();
}
function fillHUD(sfx, pi, cls){
  var el = DKB_S.hud[sfx]; if(!el || !G || !G.players[pi]) return;
  var p = G.players[pi], c = cardById(p.card) || {};
  var q = el._q || (el._q = {
    nm: el.querySelector('.dkb-nm'), cash: el.querySelector('.dkb-cash'), asset: el.querySelector('.dkb-asset'),
    gbar: el.querySelector('.dkb-gbar i'), gtx: el.querySelector('.dkb-gtx'), jam: el.querySelector('.dkb-jam b'),
    rar: el.querySelector('.dkb-rar'), lv: el.querySelector('.dkb-lv'), cv: el.querySelector('canvas') });
  var asset = assetOf(G, pi);
  if(el._pi !== pi){
    el._pi = pi;
    el.style.setProperty('--pc', PCOL[pi]);
    el.style.setProperty('--pcd', shade(PCOL[pi], -0.5));
    /* 席の人が変わった時は数字を回さずに置き換える */
    q.cash.dataset.v = p.cash; q.cash.textContent = yen(p.cash);
    q.asset.dataset.v = asset; q.asset.textContent = yen(asset);
  }
  dkbTxt(q.nm, p.name);
  var rr = RAR[c.rar] ? c.rar : 'A';
  dkbTxt(q.rar, RAR[rr] ? RAR[rr].nm : 'A');
  var rc = 'dkb-rar dkb-r' + rr; if(q.rar.className !== rc) q.rar.className = rc;
  dkbTxt(q.lv, String(p.cardLv || 1));
  var pic = q.cv;
  if(pic && (pic.dataset.ch !== String(p.ch) || pic.dataset.col !== PCOL[pi] || pic.dataset.card !== String(p.card || ''))){
    pic.dataset.ch = p.ch; pic.dataset.col = PCOL[pi]; pic.dataset.card = p.card || '';
    var ex = portraits.find(function(o){ return o.el === pic; });
    if(ex){ ex.chId = p.ch; ex.col = PCOL[pi]; ex.cardId = p.card; } else regPortrait(pic, p.ch, PCOL[pi], p.card);
  }
  rollNum(q.cash, p.cash);
  rollNum(q.asset, asset);
  el.classList.toggle('dkb-long', yen(Math.max(p.cash, asset)).length > 9);
  var mana = Math.max(0, Math.min(100, Math.round(p.mana || 0)));
  var tf = 'scaleX(' + (mana / 100).toFixed(3) + ')';
  if(q.gbar && q.gbar.style.transform !== tf) q.gbar.style.transform = tf;
  dkbTxt(q.gtx, '能力 ' + mana + '%');
  dkbTxt(q.jam, String(p.jam === undefined || p.jam === null ? 0 : p.jam));
  if(cls === 'bot'){
    var b = document.getElementById('skillBtn');
    if(b){
      var ready = mana >= 100 && p.skillLeft > 0 && p.kind !== 'cpu' && G.phase === 'wait' && G.turn === pi && !G.over;
      b.disabled = !ready;
      b.classList.toggle('ready', ready);
      dkbTxt(b, '能力 ×' + Math.max(0, p.skillLeft | 0));
    }
  }
}

/* ══════════ お金の帯（その人の HUD の上。増えたら橙↑・減ったら青↓、数字はパラパラ回る） ══════════ */
function pill(pi, amount){
  if(!G || !G.players[pi] || !amount) return;
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var seat = dkbSeatOfPi(pi), el = DKB_S.band[seat]; if(!el) return;
  var up = amount >= 0, cash = G.players[pi].cash;
  el.classList.toggle('dkb-up', up); el.classList.toggle('dkb-dn', !up);
  dkbTxt(el.querySelector('.dkb-bar'), up ? '▲' : '▼');
  var num = el.querySelector('.dkb-bnum');
  var showing = el.classList.contains('on') && !el.classList.contains('dkb-fade');
  var from = (showing && num.dataset.v !== undefined) ? +num.dataset.v : cash - amount;
  num.dataset.v = cash;
  if(!showing){
    el.classList.remove('dkb-fade', 'on');
    if(!dkbFast()) void el.offsetWidth;
    el.classList.add('on');
  }
  if(dkbFast()) num.textContent = yen(cash);
  else fxCount(num, cash, { from: from, dur: 700 * SPEED, fmt: yen, bump: false });
  if(!dkbFast()) fxFloatTag(num, yen(Math.abs(amount)), up);
  clearTimeout(el._t);
  el._t = setTimeout(function(){
    el.classList.add('dkb-fade');
    el._t = setTimeout(function(){ el.classList.remove('on', 'dkb-fade'); }, 300 * SPEED + 20);
  }, 1500 * SPEED);
}

/* ══════════ 発動パネル（HUD の横から滑り込む。金の見出し＋左にアイコン＋効果1行） ══════════ */
function dkbPanel(pi, icon, title, sub, opt){
  opt = opt || {};
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var seat = G ? dkbSeatOfPi(pi) : 'Bot', box = DKB_S.pbox[seat]; if(!box) return null;
  var d = dkbEl('div', 'dkb-pnl' + (opt.miss ? ' dkb-miss' : ''),
    '<i class="dkb-pic">' + esc(icon || '✨') + (opt.rar ? '<small>' + esc(opt.rar) + '</small>' : '') + '</i>'
    + '<div class="dkb-ptx"><b>' + esc(title || '') + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>');
  box.appendChild(d);
  while(box.children.length > 2) box.removeChild(box.firstChild);
  setTimeout(function(){
    d.classList.add('out');
    setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, 220 * SPEED + 20);
  }, (opt.ms || 2300) * SPEED);
  return d;
}

/* ══════════ 手番の見出し（500ms×SPEED） ══════════ */
async function turnBig(pi){
  var p = G && G.players[pi]; if(!p) return;
  var el = document.getElementById('turnbig'), t = document.getElementById('turnbigT'), s = document.getElementById('turnbigS');
  if(el){
    t.textContent = p.name; t.style.color = '';
    el.style.setProperty('--pc', PCOL[pi]);
    el.style.setProperty('--pcd', shade(PCOL[pi], -0.55));
    var c = cardById(p.card);
    s.textContent = (c ? c.role + '　' : '') + 'のこり ' + G.turnsLeft + ' ターン';
    el.classList.remove('on');
    if(!dkbFast()) void el.offsetWidth;
    el.classList.add('on');
  }
  await wait(500);
  if(el) el.classList.remove('on');
}

/* ══════════ 出目 ══════════ */
/* WP6 の doRoll は showChip(total, isDbl, {impact, target}) で呼ぶ。旧 doRoll（引数2つ）の時だけ、
   止まったゲージの位置から推し量る（振る瞬間に gaugeOn=false になるので gaugePhase は押した時の値のまま） */
function dkbGuessImpact(){
  try{
    var p = G && G.players[G.turn];
    if(p && p.jail > 0) return false;
    return typeof gaugePhase === 'number' && typeof gaugeSweet === 'number' && Math.abs(gaugePhase - gaugeSweet) < gaugeHalf;
  }catch(e){ return false; }
}
function showChip(n, isDouble, opt){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  opt = (opt && typeof opt === 'object') ? opt : {};
  var imp = (typeof opt.impact === 'boolean') ? opt.impact : dkbGuessImpact();
  var tok = ++DKB_S.chipTok;
  var c = document.getElementById('chip'), d = document.getElementById('dbl'), im = DKB_S.imp;
  if(c){
    var num = c.querySelector('.dkb-num'); if(num) num.textContent = n;
    c.classList.toggle('dkb-gold', !!imp);
    c.classList.toggle('dkb-two', String(n).length > 1);
    c.classList.remove('dkb-on', 'dkb-out');
    if(!dkbFast()) void c.offsetWidth;
    c.classList.add('dkb-on');
  }
  if(d){
    d.textContent = '×ダブル';
    d.classList.remove('dkb-on', 'dkb-out');
    if(isDouble){ if(!dkbFast()) void d.offsetWidth; d.classList.add('dkb-on'); }
  }
  if(im){
    im.classList.remove('dkb-on', 'dkb-out');
    if(imp){ if(!dkbFast()) void im.offsetWidth; im.classList.add('dkb-on'); }
  }
  if(isDouble) dkbDoubleMsg(tok);
  if(!dkbFast()){
    try{
      fxBurst({ x: 800, y: 376 }, { kind: 'star', n: imp ? 18 : 8, power: imp ? 1.15 : 0.7 });
      if(imp) fxBurst({ x: 800, y: 376 }, { kind: 'coin', n: 10, power: 0.9 });
    }catch(e){ dkbErr('chipfx', e); }
  }
}
function hideChip(){
  var tok = DKB_S.chipTok;
  var list = [document.getElementById('chip'), document.getElementById('dbl'), DKB_S.imp];
  list.forEach(function(e){ if(e && e.classList.contains('dkb-on')) e.classList.add('dkb-out'); });
  setTimeout(function(){
    if(DKB_S.chipTok !== tok) return;
    list.forEach(function(e){ if(e) e.classList.remove('dkb-on', 'dkb-out'); });
  }, 200 * SPEED + 20);
}
function dkbDoubleMsg(tok){
  var el = DKB_S.dmsg; if(!el) return;
  var p = G && G.players[G.turn];
  var a = 'ダブルボーナス！', b = 'もう一回！サイコロを振ります';
  if(p && p.jail > 0){ a = 'ダブル！'; b = 'ここから脱出できます'; }
  else if(p && p.dblRun >= 2){ a = 'ダブル3回…'; b = ((G.map && G.map.corners && G.map.corners[1]) || '監獄') + 'へ送られます'; }
  el.innerHTML = '<b>' + esc(a) + '</b><span>' + esc(b) + '</span>';
  el.classList.remove('dkb-on', 'dkb-out');
  if(!dkbFast()) void el.offsetWidth;
  el.classList.add('dkb-on');
  clearTimeout(el._t);
  el._t = setTimeout(function(){
    el.classList.add('dkb-out');
    setTimeout(function(){ el.classList.remove('dkb-on', 'dkb-out'); }, 200 * SPEED + 20);
  }, 1700 * SPEED);
}

/* ══════════ 通行料値上げ！（そのマスの画面位置） ══════════ */
/* at：マス番号か {x,y}（ワールド座標）。無ければ、育てている最中のマス（growAnim が grow=0 にする）
   → 直前に立てた光の柱 → 盤の上の中央、の順で探す */
function dkbRaiseAt(at){
  if(typeof at === 'number' && at >= 0 && at < 32) return tileCenter(at);
  if(at && typeof at.x === 'number' && typeof at.y === 'number') return { x: at.x, y: at.y };
  if(!G) return null;
  for(var i = 0; i < 32; i++){ var t = G.tiles[i]; if(t && t.type === 'city' && t.grow === 0) return tileCenter(i); }
  for(var k = fxList.length - 1; k >= 0 && k >= fxList.length - 8; k--){
    var f = fxList[k];
    if(f && f.kind === 'pillar' && f.t < 120) return { x: f.x, y: f.y };
  }
  return null;
}
function raiseBanner(txt, at){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = document.getElementById('raise'); if(!el) return;
  var w = dkbRaiseAt(at);
  el.innerHTML = '<b>' + esc(txt || '通行料値上げ！') + '</b>';
  el.classList.remove('on');
  if(!dkbFast()) void el.offsetWidth;
  el.classList.add('on');
  if(w) dkbFollow(el, function(){ return w; }, -72);
  else { el._dkbTok = null; el.style.transform = 'translate(800px,200px)'; }
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('on'); }, 1400 * SPEED);
}

/* ══════════ 通行料 ══════════ */
/* 札束は2段で飛ぶ：払う人の山 → 湖の中央（札束の山と金額） → 受け取る人の山。
   7-online.js は moneyFly(pi, owner, true) と3引数で呼ぶ（戻り値は使わない）。 */
function moneyFly(fromPi, toPi, heavy, amt){
  if(!G || !G.players[fromPi] || !G.players[toPi]) return Promise.resolve();
  var a = dkbStackXY(fromPi), c = { x: BCX, y: BCY + 6 }, b = dkbStackXY(toPi);
  var dur = Math.max(260, 760 * SPEED);
  addFx('bill', a.x, a.y, dur, PCOL[toPi], null, false, { from: a, to: c });
  addFx('shockring', a.x, a.y + 6, Math.max(220, 620 * SPEED), '#FFD8A0', null, false, { r: heavy ? 230 : 170 });
  DKB_S.toll = { t0: performance.now(), amt: (typeof amt === 'number' ? amt : 0), heavy: !!heavy,
    dur: Math.max(900, 1700 * SPEED), n: heavy ? 7 : 5 };
  try{ SFX.coin(); }catch(e){}
  return new Promise(function(res){
    setTimeout(function(){
      addFx('bill', c.x, c.y, dur, PCOL[toPi], null, false, { from: c, to: b });
      try{ SFX.coin(); }catch(e){}
      setTimeout(function(){
        addFx('coinburst', b.x, b.y - 8, Math.max(300, 950 * SPEED));
        addFx('starburst', b.x, b.y - 20, Math.max(260, 700 * SPEED), '#FFE9A8', null, false, { r: 70 });
        try{ SFX.coin(); }catch(e){}
        res();
      }, 520 * SPEED);
    }, 640 * SPEED);
  });
}
/* 払う駒の頭上の吹き出し（割引の時は青） */
function dkbBubble(pi, label, amt, blue){
  var el = DKB_S.bub; if(!el) return;
  el.className = 'dkb-bub on' + (blue ? ' dkb-blue' : '');
  el.innerHTML = '<div class="dkb-bin"><span>' + esc(label) + '</span><b>' + esc(yen(amt)) + '</b></div>';
  dkbFollow(el, function(){ return dkbTokW(pi); }, -52);
}
function dkbBubbleOff(){ if(DKB_S.bub) DKB_S.bub.classList.remove('on'); }
/* 天使カードを使うか（人間だけモーダルで聞く。CPU は使う） */
function dkbAskAngel(pi, amt){
  var p = G.players[pi];
  return dvAsk(pi, 'angel', function(){
    if(!p || p.kind === 'cpu') return true;
    return modal('<div class="modal"><div class="dkb-mpanel fx-panel dkb-angel">'
      + '<h3>天使カード</h3>'
      + '<p>通行料：<b class="dkb-am">' + esc(yen(amt)) + '</b> → <b class="dkb-free">無料</b></p>'
      + '<p>天使カードを使用しますか？</p>'
      + '<div class="dkb-mbtns"><button class="btn ghost" data-act="cancel">キャンセル</button>'
      + '<button class="btn gold" data-act="use">使用</button></div></div></div>')
      .then(function(a){ return a === 'use'; });
  }, '天使カードを使うか選んでいます…').then(function(v){ return !!v; });
}
async function payToll(pi, i){
  var t = G.tiles[i], owner = t.owner, p = G.players[pi], ow = G.players[owner];
  if(t.frozen > 0){ dkbPanel(pi, '🧊', '凍結中', t.name + ' の通行料は0です'); await wait(700); return; }
  var amt = Math.round(tollOf(t, G) * statMul(p, 'toll', 0.35));
  var notes = [];
  if(t.bind){ amt = Math.round(amt * 2); t.bind = 0; notes.push('束縛 ×2'); }
  if(ow && ow.gouge > 0){ ow.gouge--; amt = Math.round(amt * 2); notes.push('ぼったくり ×2'); }
  /* 天使カード：人間には「通行料○○→無料／使用しますか」と聞く */
  if(p.freeToll > 0){
    var use = await dkbAskAngel(pi, amt);
    if(G.over) return;
    if(use){
      p.freeToll--;
      await cutIn('ITEM', '天使カード', '通行料 ' + yen(amt) + ' → 無料');
      return;
    }
  }
  var disc = false;
  if(p.halfToll > 0){ p.halfToll--; amt = Math.round(amt / 2); disc = true; }
  news(p.name + ' → ' + (ow ? ow.name : '') + ' に通行料 ' + yen(amt) + (notes.length ? '（' + notes.join('・') + '）' : '') + '！');
  /* 盤全体を見せてから吹き出し → 支払い → 札束 */
  camTo(BCX, BCY, 1);
  await wait(300);
  dkbBubble(pi, disc ? '割引 通行料' : (notes.length ? '通行料 ' + notes.join('・') : '通行料'), amt, disc);
  try{ SFX.pay(); }catch(e){}
  await wait(650);
  var ok = await dkPayFrom(pi, amt, owner);
  if(!ok){ dkbBubbleOff(); await bankrupt(pi, owner); return; }
  await moneyFly(pi, owner, amt > 3000000, amt);
  dkbBubbleOff();
  give(pi, -amt); give(owner, amt);
  camShake(8);
  await wait(500);
}

/* ══════════ 給料（場の総額に足す） ══════════ */
function salary(pi){
  var p = G.players[pi];
  var amt = Math.round((600000 + p.laps * 200000) * ((G.ev && G.ev.salaryX) || 1));
  var x2 = false;
  if(p.salaryX2 > 0){ amt *= 2; p.salaryX2--; x2 = true; }
  dkbEnsureG();
  G.pot = (G.pot || 0) + amt;
  give(pi, amt);
  dkbPanel(pi, x2 ? '💴' : '🚩', x2 ? '給料2倍券' : 'スタート通過', '給料 ' + yen(amt) + ' を受け取りました', { ms: 1900 });
}

/* ══════════ 決着（文字は canvas 版だけ。DOM は閃光・噴煙だけ） ══════════ */
function finish(pi, reason, col){
  if(G.over && G.winner >= 0) return true;
  var mono = String(reason).indexOf('独占') >= 0;
  if(mono) jingle('mono');
  var l3 = mono ? '独占ボーナス x' + (G.winX || 1) + '倍' : G.players[pi].name + ' の勝ち！';
  showCelebrate(['おめでとうございます！', reason, l3], 2800);
  if(G.map && G.map.deco === 'ice') dkbIceShards();
  else addFx('confetti', SW / 2, 0, 3000, null, null, false, { scr: true, w: SW, h: SH, n: 110 });
  bgm('win');
  news('🏆 ' + G.players[pi].name + ' が「' + reason + '」で勝利！');
  G.over = true; G.winner = pi; G.winReason = reason; G.running = false;
  try{ dkbHideTransient(); }catch(e){ dkbErr('finish', e); }
  celebrate(pi, reason, col);
  return true;
}
/* 氷の洞窟は紙吹雪のかわりに氷片（共有 canvas の宝石の粒＋白い星） */
function dkbIceShards(){
  if(dkbFast() || DKFX.reduced) return;
  var pts = [[260, 180], [1340, 170], [560, 120], [1060, 130], [360, 420], [1250, 430], [800, 90]];
  pts.forEach(function(xy, k){
    setTimeout(function(){
      try{
        fxBurst({ x: xy[0], y: xy[1] }, { kind: 'gem', n: 14, power: 1.25, gravity: 0.0024 });
        fxBurst({ x: xy[0], y: xy[1] }, { kind: 'star', n: 6, power: 0.8 });
      }catch(e){ dkbErr('ice', e); }
    }, k * 170);
  });
}
async function celebrate(pi, reason, col){
  try{ SFX.win(); }catch(e){}
  var el = document.getElementById('celebrate'), stg = document.getElementById('stage');
  if(el) el.classList.add('on');
  if(stg) stg.classList.add('dkb-cel');
  var f = document.getElementById('flash');
  if(f){ f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  camShake(16);
  var ice = G.map && G.map.deco === 'ice';
  for(var k = 0; k < 9; k++) addFx('steam', 210 + k * 150, 760, 2000);
  for(var j = 0; j < 8; j++){
    var x = 260 + dkbRnd() * 1080, y = 300 + dkbRnd() * 320;
    addFx('steam', x, y + 150, 1700);
    addFx('spark', x, y, 1000, ice ? '#BFF2FF' : (col || '#FFD24D'));
    addFx('ring', x, y + 60, 800, ice ? '#E6FAFF' : '#FFF3C0');
    await wait(150);
  }
  await wait(2200);
  if(el) el.classList.remove('on');
  if(stg) stg.classList.remove('dkb-cel');
  showResult();
}

/* ══════════ ペンダントの発動（効果は 4-game.js の写し。見せ方だけ持ち主の HUD の横へ） ══════════ */
async function pendFire(pi, trg, arg){
  var p = G.players[pi];
  var it = pendOf(pi, trg);
  if(!it) return false;
  p.pboost = p.pboost || {};
  var boost = p.pboost[it.id] || 0;
  var rate = Math.min(0.95, it.p + boost);
  var hit = Math.random() < rate;
  var pct = Math.round(rate * 100), add = Math.round(boost * 100);
  var rar = PEND_RAR[it.rar] || { nm: 'A', c: '#8FB2D8' };
  if(!hit){
    p.pboost[it.id] = boost + 0.02;
    if(p.kind !== 'cpu') dkbPanel(pi, it.ic, 'スキル未発動', '2%成長します', { miss: true, rar: rar.nm, ms: 1900 });
    return false;
  }
  p.pboost[it.id] = 0;
  SFX.skill(); camShake(7);
  dkbPanel(pi, it.ic, rar.nm + 'ペンダント発動！', it.nm + '　' + pct + '%' + (add ? '（+' + add + '%）' : ''), { rar: rar.nm, ms: 2400 });
  var c = p.render || tileCenter(p.pos);
  addFx('ring', c.x, c.y, 700, rar.c);
  addFx('spark', c.x, c.y - 30, 900, rar.c);

  /* ── 効果 ── */
  if(it.id === 'p1'){                       // 稲妻放電器：同じ辺の相手を引き寄せる
    var side = Math.floor(p.pos / 8);
    for(var j = 0; j < G.players.length; j++){
      var q = G.players[j];
      if(j === pi || q.out || q.jail > 0) continue;
      if(Math.floor(q.pos / 8) === side){
        await band('稲妻放電器！', G.players[j].name + ' を引き寄せました', 1300);
        await jumpTo(j, p.pos);
        break;
      }
    }
  }
  if(it.id === 'p2' && arg && arg.tile !== undefined){   // シュプリューデル：束縛
    var t2 = G.tiles[arg.tile];
    if(t2) t2.bind = 1;
    await band('シュプリューデル！', '次の移動でもう一度 通行料を取ります', 1300);
  }
  if(it.id === 'p3'){                       // 概要設計図面：別の街がもう1段
    var mine = G.tiles.map(function(t, i){ return { t: t, i: i }; })
      .filter(function(o){ return o.t.type === 'city' && o.t.owner === pi && o.t.lv < 3 && o.i !== (arg && arg.tile); });
    if(mine.length){
      var o = mine[(Math.random() * mine.length) | 0];
      o.t.lv++;
      await growAnim(o.i);
      dkbPanel(pi, '📐', '設計図面', o.t.name + ' が1段育ちました', { ms: 2200 });
    }
  }
  if(it.id === 'p4'){                       // 大家の建物基礎：スタートへ
    var n = G.tiles.filter(function(t){ return t.type === 'city' && t.owner === pi && t.lv > 0; }).length;
    if(n >= 3){ await jumpTo(pi, 0); p.laps++; salary(pi); }
  }
  if(it.id === 'p5' && arg && arg.pick){    // 黄金フリーパス：即座に最適マスへ
    var d = aiPickTravel(pi);
    if(d >= 0){ await jumpTo(pi, d); return 'jumped'; }
  }
  if(it.id === 'p6'){                       // 幸運のトランポリン：同じ辺の自分の街へ
    var side6 = Math.floor(p.pos / 8), same = [];
    for(var k = 0; k < 8; k++){ var i6 = side6 * 8 + k;
      if(i6 !== p.pos && G.tiles[i6].type === 'city' && G.tiles[i6].owner === pi) same.push(i6); }
    if(same.length){ await jumpTo(pi, same[(Math.random() * same.length) | 0]); return 'jumped'; }
  }
  if(it.id === 'p7'){                       // 催眠の香水：所持金を奪う
    var other = G.players.findIndex(function(q2, j2){ return j2 !== pi && !q2.out && q2.pos === p.pos; });
    if(other >= 0){
      var amt = Math.round(G.players[other].cash * 0.20);
      if(amt > 0){ give(other, -amt); give(pi, amt);
        await band('催眠の香水！', G.players[other].name + ' から ' + yen(amt) + ' を奪いました', 1400); }
    }
  }
  return true;
}

/* ══════════ リーチ（新しいものだけ中央に出す。残り都市は drawDestPin が毎フレーム描く） ══════════ */
function dkShowReach(list){
  if(!G) return;
  dkbEnsureG();
  var ok = (Array.isArray(list) ? list : []).filter(function(o){
    return o && typeof o.pi === 'number' && G.players[o.pi] && Array.isArray(o.tiles);
  });
  var key = function(o){ return o.pi + '|' + (o.kind || '') + '|' + (o.label || ''); };
  var prev = G.reachTiles || [];
  var fresh = ok.filter(function(o){ return !prev.some(function(q){ return key(q) === key(o); }); });
  G.reachTiles = ok;
  if(fresh.length) dkbReachCut(fresh[0]);
}
function dkbReachLabel(o){
  if(o.label) return String(o.label).replace(/リーチ$/, '');
  return o.kind === 'line' ? 'ライン独占' : o.kind === 'tour' ? '観光地独占' : 'トリプル独占';
}
function dkbReachCut(o){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = DKB_S.reach; if(!el) return;
  var p = G.players[o.pi];
  el.querySelector('.dkb-rband span').textContent = (p ? p.name : '') + ' があと1マス！';
  el.querySelector('.dkb-rband b').textContent = dkbReachLabel(o);
  el.classList.remove('on');
  if(!dkbFast()) void el.offsetWidth;
  el.classList.add('on');
  try{ SFX.warn(); }catch(e){}
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('on'); }, 1800 * SPEED);
}

/* ══════════ 上のテロップ（試合の外）：実在の人名・架空の他人の当たりは出さない ══════════ */
function marquee(){
  var out = [];
  try{ var w = thisWeek(); if(w) out.push('今週のイベント「' + w.nm + '」　' + w.ds); }catch(e){}
  try{
    if(typeof SV === 'object' && SV){
      var st = SV.stat || {};
      out.push('あなたの通算成績　' + (st.plays || SV.plays || 0) + '戦 ' + (st.wins || SV.wins || 0) + '勝');
    }
  }catch(e){}
  try{ (TIPS || []).forEach(function(t){ out.push('ヒント：' + t); }); }catch(e){}
  if(!out.length) out.push('ダイスキングダムへようこそ！');
  var s = out[DKB_S.mq % out.length];
  DKB_S.mq++;
  return s;
}

/* ══════════ 札束の山（盤のキャッシュに描く。席の HUD のそば） ══════════ */
/* 束は盤の向き（p,q）に寝かせた直方体。下の段から埋めて、上ほど少ない山にする */
/* 3×2 のマスに、奥の列ほど高く積む（段々の山）。[p, q, 段, 通し番号] */
var DKB_PILE = (function(){
  var s = [[0,0,0],[1,0,0],[2,0,0],[0,1,0],[1,1,0],[2,1,0],
           [0,0,1],[1,0,1],[2,0,1],[1,1,1],
           [1,0,2],[0,0,2],[2,0,2],
           [1,0,3],
           [0,1,1],[2,1,1],
           [1,1,2],
           [1,0,4]];
  s.forEach(function(x, k){ x.push(k); });
  return s;
})();
/* 山を描く（原点が山の中心）。base があれば持ち主の色の台座を敷く */
function dkbPileDraw(ctx, n, band, base){
  var Lp = 47, Wp = 29;
  if(base){
    ctx.save();
    ctx.transform(KX, KY, -KX, KY, 0, 0);
    var x0 = -1.5 * Lp - 7, y0 = -Wp - 7, w = 3 * Lp + 14, h = 2 * Wp + 14;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 3, y0 + 4, w, h);
    var g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
    g.addColorStop(0, shade(base, 0.25)); g.addColorStop(1, shade(base, -0.35));
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = '#E8B23A'; ctx.lineWidth = 2.2; ctx.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
    ctx.strokeStyle = 'rgba(255,240,190,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);
    ctx.restore();
  }
  DKB_PILE.slice(0, n).sort(function(a, b){
    return ((a[0] * Lp + a[1] * Wp) - (b[0] * Lp + b[1] * Wp)) || (a[2] - b[2]);
  }).forEach(function(s){
    var bp = (s[0] - 1.5) * Lp + 1.5, bq = (s[1] - 1) * Wp + 1.5;
    dkbBundle(ctx, KX * (bp - bq), KY * (bp + bq), band, s[2], s[3]);
  });
}
function dkbBundle(ctx, ox, oy, col, lvl, idx){
  var L = 44, W = 26, H = 15;
  ctx.save();
  ctx.translate(ox, oy - lvl * H);
  /* 側面（手前の2面） */
  var P = function(p, q){ return { x: KX * (p - q), y: KY * (p + q) }; };
  var a = P(L, 0), b = P(L, W), c = P(0, W);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y + H); ctx.lineTo(a.x, a.y + H); ctx.closePath();
  ctx.fillStyle = '#AEB5BE'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y + H); ctx.lineTo(c.x, c.y + H); ctx.closePath();
  ctx.fillStyle = '#D6DBE1'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.8;
  for(var k = 2; k < H; k += 2.4){
    ctx.beginPath(); ctx.moveTo(c.x, c.y + k); ctx.lineTo(b.x, b.y + k); ctx.lineTo(a.x, a.y + k); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(40,50,64,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(c.x, c.y + H); ctx.lineTo(b.x, b.y + H); ctx.lineTo(a.x, a.y + H); ctx.stroke();
  /* 上の面（紙幣の絵） */
  ctx.save();
  ctx.transform(KX, KY, -KX, KY, 0, 0);
  var g = ctx.createLinearGradient(0, 0, L, W);
  g.addColorStop(0, '#FFFFFB'); g.addColorStop(1, '#E4EAE0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, L, W);
  ctx.strokeStyle = 'rgba(60,70,60,.45)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, L - 1, W - 1);
  ctx.strokeStyle = 'rgba(96,130,96,.55)'; ctx.lineWidth = 1.1; ctx.strokeRect(4, 3.5, L - 8, W - 7);
  ctx.fillStyle = 'rgba(96,140,100,.35)';
  ctx.beginPath(); ctx.ellipse(L * 0.5, W * 0.5, 6.5, 5, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = 'rgba(120,150,120,.5)'; ctx.fillRect(L - 12, 6, 5, 3); ctx.fillRect(7, W - 9, 5, 3);
  /* 帯（持ち主の色） */
  ctx.fillStyle = col; ctx.fillRect(L * 0.5 - 4, 0, 8, W);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(L * 0.5 - 4, 0, 2, W);
  ctx.restore();
  /* 帯が側面にも回る */
  var m0 = P(L * 0.5 - 4, W), m1 = P(L * 0.5 + 4, W);
  ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.lineTo(m1.x, m1.y + H); ctx.lineTo(m0.x, m0.y + H); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  if(idx % 4 === 1){ ctx.fillStyle = 'rgba(255,240,190,.9)'; ctx.beginPath(); ctx.arc(P(L * 0.8, W * 0.3).x, P(L * 0.8, W * 0.3).y, 1.6, 0, 6.283); ctx.fill(); }
  ctx.restore();
}
function dkbGoldCard(ctx, ox, oy, k){
  ctx.save();
  ctx.translate(ox, oy);
  ctx.transform(KX, KY, -KX, KY, 0, 0);
  ctx.rotate(-0.12 + k * 0.09);
  var w = 22, h = 30;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(2, 2, w, h);
  var g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#FFF6C8'); g.addColorStop(0.35, '#F2C230'); g.addColorStop(0.7, '#C88A12'); g.addColorStop(1, '#FFE27A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#6B4408'; ctx.lineWidth = 1.2; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.fillStyle = '#8A5A08';
  ctx.beginPath();
  for(var i = 0; i < 10; i++){
    var r = (i % 2) ? 3.2 : 7, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawStacks(ctx, G, T){
  if(!G || !G.players) return;
  G.players.forEach(function(p, i){
    if(p.out) return;
    var xy = dkbStackXY(i), n = dkbBundles(p.cash);
    ctx.save();
    ctx.translate(xy.x, xy.y);
    /* 落ち影 */
    var sh = ctx.createRadialGradient(0, 14, 4, 0, 14, 92);
    sh.addColorStop(0, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(0, 14, 92, 46, 0, 0, 6.283); ctx.fill();
    if(n > 0) dkbPileDraw(ctx, n, '#EEE4C6', PCOL[i]);
    var k = Math.min(4, (p.items || []).length);
    for(var j = 0; j < k; j++) dkbGoldCard(ctx, 70 + j * 16, -4 + j * 9, j);
    ctx.restore();
  });
}

/* ══════════ 盤の上の一時マーカー（行き先ピン・リーチの残り都市・名前札の重なり） ══════════ */
function drawDestPin(ctx, T){
  try{ dkbCamClamp(); dkbFixFloats(); }catch(e){ dkbErr('cam', e); }
  if(DKB_S.lake.lv > 0.01){ DKB_S.deferT = T; return; }   // 湖の演出中は drawDice のラッパで描く
  dkbMarks(ctx, T);
}
function dkbMarks(ctx, T){
  if(!G) return;
  if(destPin !== null && destPin !== undefined){
    var c = tileCenter(destPin);
    ctx.save(); ctx.translate(c.x, c.y - 6); dvPin(ctx, '#7DE08A', T); ctx.restore();
    ctx.save(); ctx.translate(c.x, c.y - 30 - Math.sin(T / 380) * 1.8);
    dkbStar(ctx, 0, 0, 5.2, '#FFFFFF'); ctx.restore();
  }
  if(G.reachTiles && G.reachTiles.length){ try{ dkbReachMarks(ctx, T); }catch(e){ dkbErr('reach', e); } }
  try{ dkbNameStacks(ctx); }catch(e){ dkbErr('names', e); }
}
function dkbStar(ctx, x, y, r, col){
  ctx.beginPath();
  for(var i = 0; i < 10; i++){
    var rr = (i % 2) ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
/* 残り都市：橙の「！」と「○○独占残り都市」の札 */
function dkbReachMarks(ctx, T){
  var seen = {};
  G.reachTiles.forEach(function(o){
    var label = dkbReachLabel(o) + '残り都市';
    (o.tiles || []).forEach(function(i){
      if(typeof i !== 'number' || i < 0 || i > 31 || seen[i]) return;
      seen[i] = 1;
      var c = tileCenter(i), bob = Math.sin(T / 260 + i) * 4, y = c.y - 58 + bob;
      ctx.save();
      ctx.translate(c.x, y);
      /* ！の三角 */
      var pu = 0.6 + 0.4 * Math.sin(T / 180 + i);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var gl = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
      gl.addColorStop(0, 'rgba(255,170,40,' + (0.55 * pu).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,170,40,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(19, 13); ctx.lineTo(-19, 13); ctx.closePath();
      var g = ctx.createLinearGradient(0, -20, 0, 13); g.addColorStop(0, '#FFD27A'); g.addColorStop(1, '#F07A12');
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
      ctx.fillStyle = '#5A1E00'; ctx.font = '900 20px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 2);
      /* 札 */
      ctx.font = '900 13px "Noto Sans JP", sans-serif';
      var w = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(40,16,2,.86)';
      if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w / 2, -44, w, 20, 7); ctx.fill(); } else ctx.fillRect(-w / 2, -44, w, 20);
      ctx.strokeStyle = '#F29A2A'; ctx.lineWidth = 1.5;
      if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w / 2, -44, w, 20, 7); ctx.stroke(); }
      ctx.fillStyle = '#FFE0A8'; ctx.fillText(label, 0, -33);
      ctx.restore();
    });
  });
}
/* 同じマスに2人以上いる時、名前札を縦に並べ直す（元の札の上に不透明な札をかぶせる） */
function dkbNameStacks(ctx){
  var by = {};
  G.players.forEach(function(p, i){ if(p.out || p.moving) return; (by[p.pos] = by[p.pos] || []).push(i); });
  Object.keys(by).forEach(function(k){
    var arr = by[k]; if(arr.length < 2) return;
    var c = tileCenter(+k);
    ctx.save();
    ctx.font = '900 13px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var lo = 1e9, hi = -1e9, maxw = 0;
    arr.forEach(function(pi, j){
      var w = ctx.measureText(G.players[pi].name).width + 14, off = (j - (arr.length - 1) / 2) * 26;
      lo = Math.min(lo, off - w / 2); hi = Math.max(hi, off + w / 2); maxw = Math.max(maxw, w);
    });
    var W = Math.max(hi - lo + 6, maxw + 26), rowH = 21, H = arr.length * rowH + 6;
    var x0 = c.x + (lo + hi) / 2 - W / 2, bottom = c.y + 8 - 78 + 11 + 2, y0 = bottom - H;
    ctx.fillStyle = 'rgba(10,8,4,.92)';
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x0, y0, W, H, 8); ctx.fill(); } else ctx.fillRect(x0, y0, W, H);
    ctx.strokeStyle = 'rgba(214,166,64,.9)'; ctx.lineWidth = 1.5;
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x0, y0, W, H, 8); ctx.stroke(); }
    arr.forEach(function(pi, j){
      var y = y0 + 3 + rowH * (arr.length - 1 - j) + rowH / 2;
      ctx.fillStyle = PCOL[pi]; ctx.beginPath(); ctx.arc(x0 + 11, y, 5, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(G.players[pi].name, x0 + 21, y + 0.5);
    });
    ctx.restore();
  });
}
/* カメラが卓の外（背景の継ぎ目）を映さないよう、寄った時の行き先を内側に寄せる */
function dkbCamClamp(){
  if(!cam || !(cam.tz > 1.001)) return;
  var hw = SW / 2 / cam.tz, hh = SH / 2 / cam.tz, m = 14;
  cam.tx = Math.max(hw + m, Math.min(SW - hw - m, cam.tx));
  cam.ty = Math.max(hh + m, Math.min(SH - hh - m, cam.ty));
}
/* 浮き数字（give の addFloat）が中央プレートの裏や画面の上端に隠れないようにずらす */
function dkbFixFloats(){
  if(!fxList.length) return;
  var pr = dkbPlateRect(), z = cam.tz || 1;
  for(var i = fxList.length - 1; i >= 0 && i >= fxList.length - 12; i--){
    var f = fxList[i];
    if(!f || f.kind !== 'num' || f.dkbFix) continue;
    f.dkbFix = 1;
    var sx = SW / 2 + (f.x - cam.tx) * z, sy = SH / 2 + (f.y - cam.ty) * z, ny = sy;
    if(pr && sx > pr.l - 230 && sx < pr.r + 230 && sy > pr.t - 90 && sy < pr.b + 60) ny = pr.b + 96;
    if(ny < 130) ny = 130;
    if(ny !== sy) f.y = cam.ty + (ny - SH / 2) / z;
  }
}

/* ══════════ 湖（盤の中央）：ふだんの景色（キャッシュ）と、振っている間だけ動く層 ══════════ */
function dkbLakePts(){
  if(!DKB_S.lakePts) DKB_S.lakePts = [proj(TD, TD), proj(S - TD, TD), proj(S - TD, S - TD), proj(TD, S - TD)];
  return DKB_S.lakePts;
}
function dkbPoly(ctx, pts){
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for(var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}
function dkbH(i){ return dvFxRnd(i * 1.37 + 0.71); }
/* 湖の中の点（u,v は 0..1） */
function dkbLakeUV(u, v){
  var p = dkbLakePts();
  var ax = p[0].x + (p[1].x - p[0].x) * u, ay = p[0].y + (p[1].y - p[0].y) * u;
  var bx = p[3].x + (p[2].x - p[3].x) * u, by = p[3].y + (p[2].y - p[3].y) * u;
  return { x: ax + (bx - ax) * v, y: ay + (by - ay) * v };
}
/* 自作の紋章「DICE KINGDOM」（盾・王冠・サイコロ2つ・月桂樹・リボン）を湖の面に寝かせて彫る */
function dkbCrest(ctx, st){
  ctx.save();
  ctx.translate(BCX, BCY + 4);
  ctx.scale(1, KSQ * 1.02);
  var pass = function(dx, dy, col, stroke){
    ctx.save(); ctx.translate(dx, dy);
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineJoin = 'round';
    /* 月桂樹 */
    for(var sgn = -1; sgn <= 1; sgn += 2){
      for(var k = 0; k < 7; k++){
        var a = Math.PI * (0.62 + k * 0.105), r = 128;
        var x = sgn * Math.cos(a) * r * -1, y = Math.sin(a) * r * 0.9 - 6;
        ctx.save(); ctx.translate(x, y); ctx.rotate(sgn * (a - Math.PI / 2) + (sgn < 0 ? Math.PI : 0) * 0);
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 15, sgn * (0.9 - k * 0.12), 0, 6.283); stroke ? ctx.stroke() : ctx.fill();
        ctx.restore();
      }
    }
    /* 盾 */
    ctx.beginPath();
    ctx.moveTo(-74, -70); ctx.lineTo(74, -70); ctx.lineTo(74, 6);
    ctx.bezierCurveTo(74, 52, 30, 78, 0, 96); ctx.bezierCurveTo(-30, 78, -74, 52, -74, 6); ctx.closePath();
    ctx.lineWidth = 7; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-58, -56); ctx.lineTo(58, -56); ctx.lineTo(58, 4);
    ctx.bezierCurveTo(58, 40, 24, 62, 0, 76); ctx.bezierCurveTo(-24, 62, -58, 40, -58, 4); ctx.closePath();
    ctx.lineWidth = 2.5; ctx.stroke();
    /* 王冠 */
    ctx.beginPath();
    ctx.moveTo(-46, -78); ctx.lineTo(-52, -118); ctx.lineTo(-26, -96); ctx.lineTo(0, -128); ctx.lineTo(26, -96);
    ctx.lineTo(52, -118); ctx.lineTo(46, -78); ctx.closePath();
    stroke ? (ctx.lineWidth = 3, ctx.stroke()) : ctx.fill();
    [-52, 0, 52].forEach(function(x, i){ ctx.beginPath(); ctx.arc(x, i === 1 ? -132 : -122, 6, 0, 6.283); stroke ? ctx.stroke() : ctx.fill(); });
    /* サイコロ2つ */
    [[-24, -8, -0.28, 5], [26, 18, 0.22, 3]].forEach(function(d){
      ctx.save(); ctx.translate(d[0], d[1]); ctx.rotate(d[2]);
      if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-22, -22, 44, 44, 9); } else { ctx.beginPath(); ctx.rect(-22, -22, 44, 44); }
      ctx.lineWidth = 3.5; ctx.stroke();
      var pip = d[3] === 5 ? [[-11,-11],[11,-11],[0,0],[-11,11],[11,11]] : [[-11,-11],[0,0],[11,11]];
      pip.forEach(function(q){ ctx.beginPath(); ctx.arc(q[0], q[1], 4.2, 0, 6.283); ctx.fill(); });
      ctx.restore();
    });
    /* リボンと文字 */
    ctx.beginPath();
    ctx.moveTo(-150, 88); ctx.lineTo(150, 88); ctx.lineTo(136, 108); ctx.lineTo(150, 128); ctx.lineTo(-150, 128);
    ctx.lineTo(-136, 108); ctx.closePath(); ctx.lineWidth = 3; ctx.stroke();
    ctx.font = '400 30px "Bungee","Mochiy Pop One",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DICE KINGDOM', 0, 110);
    ctx.restore();
  };
  pass(2, 2.5, st.lo, false);
  pass(-1, -1.2, st.hi, true);
  pass(0, 0, st.fill, false);
  ctx.restore();
}
function dkbLakeSkin(ctx, map, T){
  var deco = map && map.deco, pts = dkbLakePts();
  var cx = BCX, cy = BCY, i, k;
  ctx.save();
  dkbPoly(ctx, pts); ctx.clip();
  var fillR = function(stops){
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.66);
    var g = ctx.createRadialGradient(0, -10, 10, 0, 0, 470);
    stops.forEach(function(s){ g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g; ctx.fillRect(-700, -700, 1400, 1400);
    ctx.restore();
  };
  var rim = function(col){
    [[44, 0.16], [24, 0.2], [8, 0.32]].forEach(function(w){
      ctx.lineWidth = w[0]; ctx.strokeStyle = col.replace('A', w[1]); dkbPoly(ctx, pts); ctx.stroke();
    });
  };
  if(deco === 'world'){
    /* 乾いた砂の窪地 */
    fillR([[0, '#F4E6BE'], [0.5, '#E6CC94'], [0.82, '#CFAE72'], [1, '#A98752']]);
    ctx.lineCap = 'round';
    for(k = 1; k <= 8; k++){
      ctx.save(); ctx.translate(cx, cy + 8); ctx.scale(1, 0.62);
      var rr = 34 + k * 46;
      ctx.beginPath();
      for(i = 0; i <= 64; i++){
        var a = i / 64 * 6.283, w = Math.sin(a * 5 + k * 1.7) * 4;
        var x = Math.cos(a) * (rr + w), y = Math.sin(a) * (rr + w);
        if(i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(150,108,58,.2)'; ctx.stroke();
      ctx.translate(0, -3); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,246,222,.26)'; ctx.stroke();
      ctx.restore();
    }
    for(i = 0; i < 34; i++){
      var pp = dkbLakeUV(0.12 + dkbH(i) * 0.76, 0.12 + dkbH(i + 50) * 0.76);
      ctx.fillStyle = (i % 3) ? 'rgba(150,128,96,.55)' : 'rgba(250,240,214,.7)';
      ctx.beginPath(); ctx.ellipse(pp.x, pp.y, 2 + dkbH(i + 90) * 3.5, 1.3 + dkbH(i + 91) * 2, 0, 0, 6.283); ctx.fill();
    }
    rim('rgba(92,62,28,A)');
    dkbCrest(ctx, { fill: 'rgba(134,94,46,.28)', hi: 'rgba(255,248,226,.5)', lo: 'rgba(96,64,28,.42)' });
  } else if(deco === 'onsen'){
    /* 湯の湖（乳白の翡翠色）と縁の岩 */
    fillR([[0, '#EAFCF5'], [0.45, '#B2EADA'], [0.8, '#6CC6AE'], [1, '#3C9884']]);
    for(k = 0; k < 6; k++){
      ctx.save(); ctx.translate(cx + (dkbH(k) - 0.5) * 300, cy + (dkbH(k + 9) - 0.5) * 160); ctx.scale(1, 0.6);
      var gw = ctx.createRadialGradient(0, 0, 0, 0, 0, 70 + dkbH(k + 4) * 50);
      gw.addColorStop(0, 'rgba(255,255,255,.34)'); gw.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 6.283); ctx.fill(); ctx.restore();
    }
    rim('rgba(20,80,70,A)');
    for(var e2 = 0; e2 < 4; e2++){
      var A = pts[e2], B = pts[(e2 + 1) % 4];
      for(k = 0; k < 10; k++){
        var t = (k + 0.5) / 10 + (dkbH(e2 * 20 + k) - 0.5) * 0.05;
        var px = A.x + (B.x - A.x) * t, py = A.y + (B.y - A.y) * t;
        px += (cx - px) * 0.035; py += (cy - py) * 0.07;
        var rx = 13 + dkbH(e2 * 31 + k) * 11, ry = rx * 0.6;
        var gs = ctx.createRadialGradient(px - rx * 0.3, py - ry * 0.5, 1, px, py, rx);
        gs.addColorStop(0, '#D8D4CA'); gs.addColorStop(0.6, '#9A968C'); gs.addColorStop(1, '#5E5A52');
        ctx.fillStyle = gs; ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(40,36,30,.35)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    dkbCrest(ctx, { fill: 'rgba(255,255,255,.3)', hi: 'rgba(255,255,255,.55)', lo: 'rgba(26,96,82,.38)' });
  } else {
    /* 氷の湖（ひび・霜） */
    fillR([[0, '#F8FEFF'], [0.48, '#D6F1F8'], [0.84, '#A4DAEA'], [1, '#76BCD4']]);
    for(k = 0; k < 12; k++){
      var fp = dkbLakeUV(0.15 + dkbH(k + 200) * 0.7, 0.15 + dkbH(k + 230) * 0.7);
      ctx.save(); ctx.translate(fp.x, fp.y); ctx.scale(1, 0.6);
      var gf = ctx.createRadialGradient(0, 0, 0, 0, 0, 40 + dkbH(k + 260) * 60);
      gf.addColorStop(0, 'rgba(255,255,255,.5)'); gf.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(0, 0, 100, 0, 6.283); ctx.fill(); ctx.restore();
    }
    for(k = 0; k < 10; k++){
      var sp = dkbLakeUV(0.1 + dkbH(k + 300) * 0.8, 0.1 + dkbH(k + 330) * 0.8);
      var ang = dkbH(k + 360) * 6.283, x0 = sp.x, y0 = sp.y;
      ctx.beginPath(); ctx.moveTo(x0, y0);
      for(i = 0; i < 5; i++){
        ang += (dkbH(k * 7 + i + 400) - 0.5) * 1.3;
        x0 += Math.cos(ang) * (18 + dkbH(k * 9 + i) * 26); y0 += Math.sin(ang) * (10 + dkbH(k * 5 + i) * 14);
        ctx.lineTo(x0, y0);
      }
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
      ctx.save(); ctx.translate(1, 1.2); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(70,140,170,.4)'; ctx.stroke(); ctx.restore();
    }
    rim('rgba(40,110,140,A)');
    dkbCrest(ctx, { fill: 'rgba(255,255,255,.42)', hi: 'rgba(255,255,255,.72)', lo: 'rgba(64,136,166,.42)' });
  }
  ctx.restore();
}
/* 振っている間は満ちて、サイコロが止まったら 0.6秒で引く */
function dkbLakeStep(T){
  var L = DKB_S.lake;
  var dt = L.t ? Math.max(0, Math.min(60, T - L.t)) : 16; L.t = T;
  var da = (typeof diceAnim !== 'undefined') ? diceAnim : null;
  var rolling = !!(da && da.th && da.t < da.th.dur);
  if(rolling) L.lv = Math.min(1, L.lv + dt / 350);
  else if(L.lv > 0) L.lv = Math.max(0, L.lv - dt / 600);
  return L.lv;
}
function dkbDolphin(ctx, x, y, ang, s, a){
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha = a;
  var g = ctx.createLinearGradient(0, -14, 0, 10);
  g.addColorStop(0, '#2C66AE'); g.addColorStop(0.55, '#5CA8E2'); g.addColorStop(1, '#EEF8FF');
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(12,40,80,.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-3, -12); ctx.quadraticCurveTo(-9, -27, -16, -24); ctx.lineTo(-13, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-31, -3); ctx.lineTo(-44, -13); ctx.quadraticCurveTo(-39, -3, -45, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(35, 0);
  ctx.bezierCurveTo(27, -12, -6, -15, -26, -5); ctx.lineTo(-33, -2);
  ctx.bezierCurveTo(-27, 3, -10, 11, 12, 9); ctx.bezierCurveTo(24, 8, 32, 5, 35, 0); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 6); ctx.quadraticCurveTo(0, 17, -7, 15); ctx.lineTo(-2, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(8, -8, 12, 2.4, -0.15, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#0B1E36'; ctx.beginPath(); ctx.arc(22, -3, 1.9, 0, 6.283); ctx.fill();
  ctx.restore();
}
function dkbSplash(ctx, x, y, k, a){
  if(k <= 0 || k >= 1) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.5);
  ctx.globalAlpha = a * (1 - k);
  ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(0, 0, 8 + k * 34, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 4 + k * 18, 0, 6.283); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a * (1 - k); ctx.fillStyle = '#EFFBFF';
  for(var i = 0; i < 6; i++){
    var ang = -Math.PI * (0.15 + i * 0.14), r = 10 + k * 26;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 1.3 - k * 10, 2.6 * (1 - k * 0.5), 0, 6.283); ctx.fill();
  }
  ctx.restore();
}
function dkbLakeFx(ctx, T){
  var lv = dkbLakeStep(T);
  if(lv <= 0.01 || !G || !G.map) return false;
  var e = lv * lv * (3 - 2 * lv), mode = G.map.deco, pts = dkbLakePts();
  var cx = BCX, cy = BCY + 22, rot = T * 0.0032, i, k;
  ctx.save();
  dkbPoly(ctx, pts); ctx.clip();
  if(mode === 'world'){
    ctx.save(); ctx.globalAlpha = e;
    ctx.translate(cx, cy); ctx.scale(1, 0.64);
    var g = ctx.createRadialGradient(0, 0, 10, 0, 0, 520);
    g.addColorStop(0, '#C4F6FF'); g.addColorStop(0.3, '#58CBEA'); g.addColorStop(0.7, '#1C88C6'); g.addColorStop(1, '#0C4F8E');
    ctx.fillStyle = g; ctx.fillRect(-700, -700, 1400, 1400);
    ctx.lineCap = 'round';
    for(k = 0; k < 5; k++){
      ctx.beginPath();
      for(i = 0; i <= 30; i++){
        var u = i / 30, a = rot * 2 + k * 1.2566 + u * 3.5, r = 24 + u * 380 * (0.55 + 0.45 * e);
        if(i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 24; ctx.stroke();
      ctx.strokeStyle = 'rgba(232,252,255,.6)'; ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.setLineDash([18, 14]); ctx.lineDashOffset = -T * 0.05;
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 92, 0, 6.283); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  } else if(mode === 'onsen'){
    ctx.save(); ctx.globalAlpha = e;
    ctx.translate(cx, cy); ctx.scale(1, 0.64);
    var go = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
    go.addColorStop(0, 'rgba(255,255,255,.88)'); go.addColorStop(0.35, 'rgba(206,252,238,.72)');
    go.addColorStop(0.75, 'rgba(112,212,186,.58)'); go.addColorStop(1, 'rgba(58,158,138,.4)');
    ctx.fillStyle = go; ctx.fillRect(-700, -700, 1400, 1400);
    /* 湯が沸き立つ波紋（中心から外へ） */
    for(k = 0; k < 6; k++){
      var ph2 = ((T * 0.0009 + k / 6) % 1);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - ph2)).toFixed(3) + ')';
      ctx.lineWidth = 3 + (1 - ph2) * 7;
      ctx.beginPath(); ctx.arc(0, 0, 40 + ph2 * 370, 0, 6.283); ctx.stroke();
    }
    for(i = 0; i < 30; i++){
      var ba = dkbH(i + 500) * 6.283 + rot * 0.4, br = 50 + dkbH(i + 520) * 330, ph = ((T * 0.0022 + dkbH(i + 540)) % 1);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.45 * (1 - ph)).toFixed(3) + ')';
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - ph)).toFixed(3) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(Math.cos(ba) * br, Math.sin(ba) * br - ph * 14, 4 + ph * 12, 0, 6.283); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  } else {
    ctx.save(); ctx.globalAlpha = e;
    ctx.translate(cx, cy); ctx.scale(1, 0.64);
    var gi = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
    gi.addColorStop(0, 'rgba(255,255,255,.9)'); gi.addColorStop(0.4, 'rgba(206,246,255,.66)');
    gi.addColorStop(0.8, 'rgba(120,200,236,.5)'); gi.addColorStop(1, 'rgba(80,160,210,.38)');
    ctx.fillStyle = gi; ctx.fillRect(-700, -700, 1400, 1400);
    /* 氷晶の渦（白い吹雪の筋） */
    ctx.lineCap = 'round';
    for(k = 0; k < 4; k++){
      ctx.beginPath();
      for(i = 0; i <= 26; i++){
        var uu = i / 26, a2 = rot * 1.6 + k * 1.5708 + uu * 3.8, r2 = 20 + uu * 360 * (0.5 + 0.5 * e);
        if(i) ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2); else ctx.moveTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 26; ctx.stroke();
      ctx.strokeStyle = 'rgba(236,252,255,.72)'; ctx.lineWidth = 4; ctx.stroke();
    }
    for(i = 0; i < 44; i++){
      var f = i / 44, aa = rot * (1.5 - f * 0.7) + i * 2.39996, rr = (40 + f * 350) * (0.45 + 0.55 * e);
      ctx.save(); ctx.translate(Math.cos(aa) * rr, Math.sin(aa) * rr); ctx.rotate(aa + Math.PI / 2);
      var sc = 1.0 + dkbH(i + 600) * 1.1;
      ctx.scale(sc, sc);
      var gs = ctx.createLinearGradient(0, -15, 0, 15);
      gs.addColorStop(0, '#FFFFFF'); gs.addColorStop(1, '#8FE0FF');
      ctx.fillStyle = gs; ctx.globalAlpha = e * (0.95 - f * 0.35);
      ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(5, -6); ctx.lineTo(5, 6); ctx.lineTo(0, 15); ctx.lineTo(-5, 6); ctx.lineTo(-5, -6); ctx.closePath();
      ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = e;
    for(k = 0; k < 10; k++){
      var sa = k * 0.628 + rot * 0.5, L1 = 40 + 70 * e;
      ctx.save(); ctx.rotate(sa);
      ctx.beginPath(); ctx.moveTo(62, -7); ctx.lineTo(62 + L1, 0); ctx.lineTo(62, 7); ctx.closePath();
      ctx.fillStyle = 'rgba(230,250,255,.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,200,230,.8)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  /* きらめき */
  for(i = 0; i < 12; i++){
    var sp = dkbLakeUV(0.15 + dkbH(i + 700) * 0.7, 0.15 + dkbH(i + 730) * 0.7);
    var tw = 0.5 + 0.5 * Math.sin(T * 0.012 + i * 1.7);
    ctx.globalAlpha = e * tw * 0.9;
    dkbStar(ctx, sp.x, sp.y, 3 + tw * 5, '#FFFFFF');
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if(mode === 'world'){
    for(i = 0; i < 3; i++){
      var per = 1300, tt = T + i * 433, u2 = (tt % per) / per, cyc = Math.floor(tt / per);
      var A = i * 2.1 + cyc * 0.93;
      var sx = cx + Math.cos(A) * 250, sy = cy + Math.sin(A) * 150;
      var ex = cx + Math.cos(A + 0.95) * 130, ey = cy + Math.sin(A + 0.95) * 80;
      var hgt = 110 * (0.6 + 0.4 * e);
      var x = sx + (ex - sx) * u2, y = sy + (ey - sy) * u2 - Math.sin(u2 * Math.PI) * hgt;
      var vx = ex - sx, vy = (ey - sy) - Math.cos(u2 * Math.PI) * Math.PI * hgt;
      var al = e * (u2 < 0.08 ? u2 / 0.08 : (u2 > 0.92 ? (1 - u2) / 0.08 : 1));
      dkbSplash(ctx, sx, sy, u2 / 0.3, e);
      dkbSplash(ctx, ex, ey, (u2 - 0.7) / 0.3, e);
      dkbDolphin(ctx, x, y, Math.atan2(vy, vx), 1.3, al);
    }
  }
  dkbRedrawNear(ctx, T);
  if(mode === 'onsen'){
    for(i = 0; i < 9; i++){
      var pa = i * 0.7 + 0.3, pr2 = 50 + (i % 3) * 60;
      var bx = cx + Math.cos(pa) * pr2, by = cy + Math.sin(pa) * pr2 * 0.6;
      for(k = 0; k < 7; k++){
        var t2 = ((T * 0.07 + k * 40 + i * 37) % 280) / 280;
        var px = bx + Math.sin(t2 * 6 + i) * 20, py = by - t2 * 300 * e, sz = 24 + t2 * 72;
        var al2 = e * 0.5 * (1 - t2) * (t2 < 0.12 ? t2 / 0.12 : 1);
        if(al2 <= 0.01) continue;
        var gw = ctx.createRadialGradient(px, py, 0, px, py, sz);
        gw.addColorStop(0, 'rgba(255,255,255,' + al2.toFixed(3) + ')'); gw.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(px, py, sz, 0, 6.283); ctx.fill();
      }
    }
  }
  return true;
}
/* 湖の手前の2辺の建物・駒は、湖の演出の上へもう一度描く（盤のキャッシュは作り直さない） */
function dkbRedrawNear(ctx, T){
  var list = [], i;
  for(i = 0; i < 32; i++){
    var s = i >> 3; if(s !== 0 && s !== 3) continue;
    var t = G.tiles[i];
    if(t && t.type === 'city' && t.owner >= 0) list.push({ y: tileCenter(i).y + 0.4, i: i, b: true });
  }
  G.players.forEach(function(p, pi){
    if(p.out) return;
    var sd = p.pos >> 3;
    if(sd !== 0 && sd !== 3 && p.pos !== 8 && !p.moving) return;
    var r = p.render || tileCenter(p.pos);
    list.push({ y: r.y + 0.8, pi: pi });
  });
  list.sort(function(a, b){ return a.y - b.y; }).forEach(function(o){
    if(o.b) drawBuilding(ctx, G, o.i, T); else drawToken(ctx, G, o.pi, T);
  });
}
/* 通行料：湖の中央に札束の山と半透明の大きな金額 */
function dkbTollPile(ctx, T){
  var tl = DKB_S.toll; if(!tl) return;
  var el = performance.now() - tl.t0, D = tl.dur;
  if(el > D){ DKB_S.toll = null; return; }
  var k = el / D;
  var grow = k < 0.24 ? 0 : k < 0.4 ? (k - 0.24) / 0.16 : k < 0.56 ? 1 : k < 0.86 ? 1 - (k - 0.56) / 0.3 : 0;
  if(grow > 0){
    ctx.save();
    ctx.translate(BCX, BCY + 10);
    var sc = 0.55 + 0.45 * grow; ctx.scale(sc, sc);
    ctx.globalAlpha = Math.min(1, grow * 1.5);
    var sh = ctx.createRadialGradient(0, 14, 4, 0, 14, 96);
    sh.addColorStop(0, 'rgba(0,0,0,.4)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(0, 14, 96, 48, 0, 0, 6.283); ctx.fill();
    dkbPileDraw(ctx, tl.n, '#E8C15A', null);
    ctx.restore();
  }
  var ta = k < 0.2 ? 0 : k < 0.3 ? (k - 0.2) / 0.1 : k < 0.86 ? 1 : Math.max(0, (0.97 - k) / 0.11);
  if(ta > 0 && tl.amt > 0){
    var txt = yen(tl.amt), pop = 1 + 0.3 * Math.max(0, 1 - Math.max(0, k - 0.2) / 0.1);
    ctx.save();
    ctx.translate(BCX, BCY + 104); ctx.scale(pop, pop);
    ctx.font = '400 66px "Mochiy Pop One","Noto Sans JP",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.globalAlpha = ta * 0.86;
    ctx.lineWidth = 13; ctx.strokeStyle = 'rgba(36,22,6,.6)'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
}

/* ══════════ ⏸ メニュー（ホームに戻る）・絵文字・持ち物・プレイヤー情報 ══════════ */
async function dkbMenu(){
  if(!G || G.over) return;
  var r = await modal('<div class="modal"><div class="dkb-mpanel fx-panel dkb-menu">'
    + '<h3>メニュー</h3><p>ホームに戻りますか？<br><small>この試合はここで終わりになります</small></p>'
    + '<div class="dkb-mbtns"><button class="btn ghost" data-act="no">つづける</button>'
    + '<button class="btn red" data-act="home">ホームへ</button></div></div></div>');
  if(r === 'home') dkbQuit();
}
function dkbQuit(){
  if(!G) return;
  G.over = true; G.running = false;
  try{ gaugeOn = false; stepPreview = null; destPin = null; }catch(e){}
  ['push', 'odd', 'even', 'skillBtn', 'shakeBtn'].forEach(function(id){ var e = document.getElementById(id); if(e) e.onclick = null; });
  ['diceui', 'modalWrap', 'pickeye', 'shake', 'emotebar', 'celebrate'].forEach(function(id){ var e = document.getElementById(id); if(e) e.classList.remove('on'); });
  try{ dkbHideTransient(); celOverlay.on = false; camReset(); }catch(e){ dkbErr('quit', e); }
  try{ if(window.DV_OL && window.DV_OL.started && window.DV_OL_API && window.DV_OL_API.leave) window.DV_OL_API.leave(false); }catch(e){ dkbErr('quit-ol', e); }
  try{ bgm('lobby'); }catch(e){}
  showHome();
}
function dkbEmote(pi, e){
  var box = document.getElementById('emoteflow'); if(!box || !e) return;
  var seat = G ? dkbSeatOfPi(pi) : 'Bot';
  box.className = 'dkb-ef' + seat;
  var s = dkbEl('span', 'emo'); s.textContent = e;
  box.appendChild(s);
  while(box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 4000);
  if((e === '👍' || e === '👏') && G){
    G.dkbLikes = (G.dkbLikes || 0) + 1;
    if(DKB_S.like){ var b = DKB_S.like.querySelector('b'); b.textContent = String(G.dkbLikes); DKFX.poke(DKB_S.like); }
  }
}
function dkbItemsPanel(){
  if(!G) return;
  var me = DKB_S.piOf.Bot !== undefined ? DKB_S.piOf.Bot : 0, p = G.players[me];
  var rows = ((p && p.items) || []).map(function(id){ return itemById(id); }).filter(Boolean).map(function(it){
    return '<div class="dkb-itr"><i>' + esc(it.ic) + '</i><div><b>' + esc(it.nm) + '</b><span>' + esc(it.desc) + '</span></div></div>';
  }).join('');
  modal('<div class="modal"><div class="dkb-mpanel fx-panel dkb-items">'
    + '<h3>ゲットアイテム</h3>'
    + (rows || '<p class="dkb-empty">いま持っているアイテムはありません</p>')
    + '<p class="dkb-note">待機部屋で買う・チャンスカードで拾うと増えます。サイコロを振る前に左のボタンから使えます。</p>'
    + '<div class="dkb-mbtns"><button class="btn gold" data-act="close">とじる</button></div></div></div>');
}
function dkbInfo(pi){
  if(!G || !G.players[pi]) return;
  var p = G.players[pi], c = cardById(p.card) || {}, st = p.stats || {};
  var rr = RAR[c.rar] ? c.rar : 'A';
  var bars = STAT_LABELS.map(function(kl){
    var v = Math.max(0, Math.min(120, Math.round(+st[kl[0]] || 0)));
    return '<div class="dkb-bar7"><span>' + esc(kl[1]) + '</span><i><em style="transform:scaleX(' + (Math.min(100, v) / 100).toFixed(3)
      + ')"></em></i><b>' + v + '</b></div>';
  }).join('');
  var pend = '';
  for(var k = 0; k < 4; k++){
    var it = p.pend && p.pend[k];
    pend += it ? '<div class="dkb-pd"><i>' + esc(it.ic) + '</i><span>' + esc(it.nm) + '</span></div>'
               : '<div class="dkb-pd dkb-none"><i>◇</i><span>なし</span></div>';
  }
  var sk = p.skill || c.sk || { nm: '', ds: '' };
  var html = '<div class="modal"><div class="dkb-info fx-panel" style="--pc:' + PCOL[pi] + ';--pcd:' + shade(PCOL[pi], -0.55) + '">'
    + '<div class="dkb-ihd"><b>' + esc(p.name) + '</b><span>' + esc(c.nm || '') + '</span></div>'
    + '<div class="dkb-ibd"><div class="dkb-icard"><canvas width="240" height="340"></canvas>'
    + '<b class="dkb-rar dkb-r' + rr + '">' + esc(RAR[rr] ? RAR[rr].nm : 'A') + '</b><b class="dkb-lv">Lv' + (p.cardLv || 1) + '</b></div>'
    + '<div class="dkb-istat">' + bars + '<div class="dkb-ipend">' + pend + '</div>'
    + '<div class="dkb-iskill"><b>' + esc(sk.nm || '') + '</b><span>' + esc(sk.ds || '') + '</span>'
    + '<em>のこり ' + Math.max(0, p.skillLeft | 0) + ' 回</em></div></div></div>'
    + '<div class="dkb-mbtns"><button class="btn gold" data-act="close">とじる</button></div></div></div>';
  var pr = modal(html);
  var cv = document.querySelector('#modalBody .dkb-icard canvas');
  if(cv) regPortrait(cv, p.ch, PCOL[pi], p.card);
  pr.then(function(){
    for(var j = portraits.length - 1; j >= 0; j--) if(portraits[j].el === cv) portraits.splice(j, 1);
  });
  return pr;
}

/* ══════════ 起動：代入ラッパと DOM ══════════ */
/* スマホ：盤のまわりの減光（.dkb-vignette と同じ radial-gradient(125% 100%, 透明 56% → rgba(10,5,0,.46) 100%)）を
   盤の canvas に描く。DOM の膜は画面いっぱいの層（iPhone で約49MB）になるので出さない（1k-fx.html）。
   暗くなるのは楕円の外＝四隅の 296×97 の内側だけなので、1/4 の大きさで作った絵から四隅 300×100 を貼る */
function dkbVignette(g){
  var V = DKB_S.vg;
  if(!V){
    V = DKB_S.vg = document.createElement('canvas'); V.width = 400; V.height = 225;
    var c = V.getContext('2d');
    c.setTransform(1, 0, 0, 0.45, 0, 0);            // 横の半径 2000・縦の半径 900 の楕円を、縦を 0.45 倍した円で描く
    var gr = c.createRadialGradient(200, 250, 0, 200, 250, 500);
    gr.addColorStop(0, 'rgba(10,5,0,0)'); gr.addColorStop(0.56, 'rgba(10,5,0,0)'); gr.addColorStop(1, 'rgba(10,5,0,.46)');
    c.fillStyle = gr; c.fillRect(0, 0, 400, 500);
  }
  var k = (typeof cv !== 'undefined' && cv && cv.width) ? cv.width / 1600 : 1;
  g.save();
  g.setTransform(k, 0, 0, k, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(V, 0, 0, 75, 25, 0, 0, 300, 100);
  g.drawImage(V, 325, 0, 75, 25, 1300, 0, 300, 100);
  g.drawImage(V, 0, 200, 75, 25, 0, 800, 300, 100);
  g.drawImage(V, 325, 200, 75, 25, 1300, 800, 300, 100);
  g.restore();
}
var DKB_O = {};
(function(){
  try{
    DKB_O.newGame = newGame;
    newGame = function(){
      var r = DKB_O.newGame.apply(this, arguments);
      try{ dkbOnNewGame(); }catch(e){ dkbErr('newGame', e); }
      return r;
    };
    DKB_O.moveSteps = moveSteps;
    moveSteps = function(pi, n){
      try{ var p = G && G.players[pi]; if(p && n > 0) destPin = (p.pos + n) % 32; }catch(e){}
      var r;
      try{ r = DKB_O.moveSteps.apply(this, arguments); }catch(e){ destPin = null; throw e; }
      return Promise.resolve(r).then(function(v){ destPin = null; return v; }, function(e){ destPin = null; throw e; });
    };
    DKB_O.drawLake = drawLake;
    drawLake = function(ctx, map, T){
      var r = DKB_O.drawLake.apply(this, arguments);
      try{ dkbLakeSkin(ctx, map, T); }catch(e){ dkbErr('lake', e); }
      return r;
    };
    DKB_O.celOverlay = celOverlay;
    celOverlay = function(ctx2, now){
      var r = DKB_O.celOverlay.apply(this, arguments);
      try{ if(G && typeof DKFX === 'object' && DKFX && DKFX.mob) dkbVignette(ctx2); }catch(e){ dkbErr('vignette', e); }
      return r;
    };
    DKB_O.drawDice = drawDice;
    drawDice = function(ctx, T){
      var on = false;
      try{ if(G) on = dkbLakeFx(ctx, T); }catch(e){ dkbErr('lakefx', e); }
      if(on || DKB_S.deferT >= 0){ try{ dkbMarks(ctx, T); }catch(e){ dkbErr('marks', e); } DKB_S.deferT = -1; }
      try{ dkbTollPile(ctx, T); }catch(e){ dkbErr('pile', e); }
      return DKB_O.drawDice.apply(this, arguments);
    };
  }catch(e){ console.error('[WP7]', e); }
  try{
    dkbBuild();
    try{ if(typeof refreshArt === 'function') boardChanged(); }catch(e){}
  }catch(e){ console.error('[WP7]', e); }
})();
