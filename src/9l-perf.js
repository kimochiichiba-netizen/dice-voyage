
/* ══ 性能（WP10）：盤と部品の作り置き・BGM の録音・自動の控えめ。Math.random は使わない ══ */
var DKK_S, DKK_B, DKK_O;

function dkkS(){
  if(!DKK_S) DKK_S = { bgMs: 600000, g: null, bmode: '', ord: null, cy: null, h: { a: 0, b: 0 }, sa: 0, sb: 0, hs: { a: 0, b: 0 },
    stk: [], sbx: {}, stkDirty: true, stkDefer: false, lst: [], pool: [], rc: [], spr: {}, bdg: {}, tp: {}, fok: null, fokT: 0,
    part: {}, pbox: {}, die: {}, dieId: '', pf: { last: 0, t0: 0, n: 0, sum: 0, bad: 0, done: false }, visT: 0, warm: {}, artGen: 0,
    tsig: null, chg: [], box: [], bm: [150, 340, 150, 90], pmax: 0.5, bdT: 0, cap: 0, dT: 0, n: { bg: 0, bd: 0, pat: 0, inv: 0, many: 0 } };
  return DKK_S;
}
/* 手の空いた時に（bg＝急がない仕事） */
function dkkLater(fn, bg){
  var ric = window.requestIdleCallback;
  if(bg){ setTimeout(function(){ try{ if(ric){ ric(function(){ fn(); }); return; } }catch(e){} fn(); }, 100); return; }
  try{ if(ric){ ric(function(){ fn(); }, { timeout: 300 }); return; } }catch(e){}
  setTimeout(fn, 16);
}
function dkkSteps(list){
  var i = 0, run = function(){
    var t0 = performance.now();
    while(i < list.length && performance.now() - t0 < 10){ try{ list[i](); }catch(e){} i++; }
    if(i < list.length) dkkLater(run);
  };
  dkkLater(run);
}
function dkkMob(){ return typeof DKFX === 'object' && !!DKFX && !!DKFX.mob; }
function dkkGame(){ return !!G && !G.over; }
function dkkBusy(){ return dkkGame() && typeof DKFX === 'object' && !!DKFX && !DKFX.worldOff; }
/* 字の読み込み中は字を焼き込まない */
function dkkFontNow(){ try{ return !document.fonts || document.fonts.status === 'loaded'; }catch(e){ return true; } }
function dkkFontOk(){ var S = DKK_S || dkkS(); if(S.fok === null) S.fok = dkkFontNow(); return S.fok; }
function dkkCanvas(w, h){ var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function dkkByY(a, b){ return a.y - b.y; }
/* ゲージ（9g の drawGauge）は 60〜90 コマ/秒まで（120Hz 以上の画面で描き過ぎない） */
function dkkGauge(S, now, dt){ var d = now - (S.gT || 0); if(!(d > 0 && d < 16 - dt / 2)){ S.gT = now; drawGauge(now); } }

/* ══ 描画ループ ══ */
function frame(now){
  var S = DKK_S || dkkS();
  /* スマホは 60 コマ/秒で足りる（画面が 120Hz・160Hz でも描き過ぎない。dt は次の回にまとめて渡る） */
  if(S.cap && now - S.dT < S.cap){ requestAnimationFrame(frame); return; }
  S.dT = now;
  var dt = Math.min(50, now - last); last = now;
  camStep(dt / 1000);
  dkkPerf(S, now);
  if(now - S.fokT > 500){ S.fokT = now; S.fok = dkkFontNow(); }
  if(now - S.visT > 1000){ S.visT = now; if(typeof DKFX === 'object' && DKFX) DKFX.vg = (DKFX.vg | 0) + 1; }
  if(typeof DKFX === 'object' && DKFX && DKFX.worldOff){ // 不透明な画面の下：盤は描かず作り置きだけ（DKFX.scrSync）
    try{ if(dkkGame() && G.tiles && G.map){ if(bgKey !== G.map.id) refreshBg(G.map, now); else if(S.g !== G || bdKey === '') refreshBoard(now); } }catch(e){}
    dkkGauge(S, now, dt); paintPortraits(now); tickClock(dt);
    requestAnimationFrame(frame);
    return;
  }
  var dpr = cv.width / SW, i, t, o, n = 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, SW, SH);
  var sh = cam.shake, ox = sh ? (Math.sin(now * 0.09) * sh) : 0, oy = sh ? (Math.cos(now * 0.13) * sh) : 0;
  var map = G ? G.map : (MAPS.find(function(m){ return m.id === cfg.mapId; }) || MAPS[0]);
  if(bgKey !== map.id || now - bgAt > S.bgMs) refreshBg(map, now);
  ctx.save();
  ctx.translate(SW / 2 + ox, SH / 2 + oy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  ctx.drawImage(bgL, BG_OX, BG_OY, BG_W, BG_H);
  if(G){
    if(S.g !== G || bdKey === ''){ S.n.inv++; refreshBoard(now); } else dkkRedraw(now);
    dkkStacks(S, now);
    ctx.drawImage(bdL, BD_X, BD_Y, BD_W, BD_H);
    layoutTokens();
    dkkOrder();
    var list = S.lst, pool = S.pool; // 入れ物は使い回す
    list.length = 0;
    for(i = 0; i < 32; i++){ t = G.tiles[i]; if(t && t.type === 'city' && t.owner >= 0 && dkkLive(t)){ o = pool[n] || (pool[n] = {}); n++; o.y = S.cy[i] + 0.4; o.i = i; o.b = 1; list.push(o); } }
    for(i = 0; i < G.players.length; i++){ var p = G.players[i]; if(!p.out){ o = pool[n] || (pool[n] = {}); n++; o.y = (p.render ? p.render.y : S.cy[p.pos]) + 0.8; o.i = i; o.b = 0; list.push(o); } }
    list.sort(dkkByY);
    S.bmode = 'live';
    try{ for(i = 0; i < list.length; i++){ if(list[i].b) drawBuilding(ctx, G, list[i].i, now); else drawToken(ctx, G, list[i].i, now); } }
    finally{ S.bmode = ''; }
    dkkTags(ctx);
    drawSteps(ctx, G);
    drawDestPin(ctx, now);
    drawDice(ctx, now);
    drawFx(ctx, dt);
  }
  ctx.restore();
  if(diceAnim){
    diceAnim.t += dt / SPEED;
    var th = diceAnim.th;
    if(th){
      var st = th.at(Math.max(0, Math.min(diceAnim.t, th.dur)));
      if(st && st.shake > 0.30 && (diceAnim.lastShake || 0) <= 0.30){ camShake(7 + st.shake * 16); SFX.diceLand(st.shake); }
      diceAnim.lastShake = st ? st.shake : 0;
      if(diceAnim.t > th.dur + 460) diceAnim = null;
    } else if(diceAnim.t > 1600) diceAnim = null;
  }
  celOverlay(ctx, now);
  dkkGauge(S, now, dt);
  paintPortraits(now);
  tickClock(dt);
  requestAnimationFrame(frame);
}
/* 毎フレーム描く建物：育ち中とランドマーク */
function dkkLive(t){ return (t.grow !== undefined && t.grow !== 1) || (!!t.landmark && !t.tour); }
function dkkOrder(){
  var S = DKK_S, a = [], i;
  if(!S.ord){
    S.cy = [];
    for(i = 0; i < 32; i++){ S.cy[i] = tileCenter(i).y; a.push(i); }
    S.ord = a.sort(function(x, y){ return S.cy[x] - S.cy[y]; });
  }
  return S.ord;
}

/* ══ 卓・盤キャッシュ（札束は別） ══ */
function refreshBg(map, now){
  bgC.setTransform(1, 0, 0, 1, 0, 0);
  bgC.clearRect(0, 0, bgL.width, bgL.height);
  bgC.setTransform(1, 0, 0, 1, -BG_OX, -BG_OY);
  drawBackdrop(bgC, map, now);
  bgAt = now; bgKey = map.id;
  (DKK_S || dkkS()).n.bg++;
}
function refreshBoard(now){
  var S = DKK_S || dkkS(), ord = dkkOrder(), i, t;
  if(S.g !== G){ S.stkDefer = true; for(i = 0; i < S.stk.length; i++) if(S.stk[i]) S.stk[i].on = false; }   // 新しい試合：札束は次のフレームで
  bdC.setTransform(1, 0, 0, 1, 0, 0);
  bdC.clearRect(0, 0, bdL.width, bdL.height);
  bdC.setTransform(BD_S, 0, 0, BD_S, -BD_X * BD_S, -BD_Y * BD_S);
  drawLake(bdC, G.map, now);
  drawSlab(bdC, G.map, now);
  for(i = 0; i < 32; i++) drawTile(bdC, G, ord[i], now);
  S.bmode = 'cache';
  try{ for(i = 0; i < 32; i++){ t = G.tiles[ord[i]]; if(t && t.type === 'city' && t.owner >= 0) drawBuilding(bdC, G, ord[i], now); } }
  finally{ S.bmode = ''; }
  bdKey = boardSig(); S.sa = S.h.a; S.sb = S.h.b;
  S.g = G; S.stkDirty = true; S.n.bd++; S.bdT = now;
  dkkScan();                                          // マスごとの印をそろえる（次からは変わった所だけ）
}
function dkkNum(v){
  if(v === undefined || v === null || v === false) return -7;
  if(v === true) return 1;
  if(typeof v === 'number') return Math.round(v * 100) | 0;
  v = String(v); return v.length * 131 + v.charCodeAt(0);
}
function dkkH(H, v){ v = dkkNum(v); H.a = Math.imul(H.a ^ v, 16777619); H.b = (Math.imul(H.b ^ v, 2246822507) + (H.b >>> 13)) | 0; }
/* 盤の見た目の印（C18。所持金は入れない） */
function dkkSig(){
  var H = DKK_S.h, i, t, P = G.players;
  H.a = -2128831035; H.b = 40503;
  dkkH(H, G.infl || 1); dkkH(H, (G.ev && G.ev.tollX) || 1); dkkH(H, (G.ev && G.ev.monoX) || 1);
  for(i = 0; i < 32; i++){
    t = G.tiles[i];
    if(!t){ dkkH(H, -99); continue; }
    dkkH(H, t.owner); dkkH(H, t.lv); dkkH(H, t.bm); dkkH(H, t.landmark); dkkH(H, t.x2); dkkH(H, t.olym); dkkH(H, t.frozen);
    dkkH(H, t.tour); dkkH(H, t.visits); dkkH(H, t.ice); dkkH(H, t.slide); dkkH(H, t.sand); dkkH(H, t.plague);
    dkkH(H, (t.grow !== undefined && t.grow !== 1) ? 1 : 0);
  }
  for(i = 0; i < P.length; i++) dkkH(H, (P[i].out ? 1 : 0) + (P[i].tollUp > 0 ? 2 : 0));
}
function boardSig(){ var H = (DKK_S || dkkS()).h; dkkSig(); return G.map.id + ':' + (H.a >>> 0).toString(36) + '.' + (H.b >>> 0).toString(36); }

/* ══ 変わったマスだけ描き直す（32マス全部の描き直しは 40〜160ms の「長いタスク」になるため） ══ */
function dkkTsig(t, g){                                // マス1つの見た目の印（C18 と同じ項目）
  var h = g;
  if(!t) return Math.imul(h ^ 7, 16777619);
  h = Math.imul(h ^ dkkNum(t.owner), 16777619); h = Math.imul(h ^ dkkNum(t.lv), 16777619);
  h = Math.imul(h ^ dkkNum(t.bm), 16777619); h = Math.imul(h ^ dkkNum(t.landmark), 16777619);
  h = Math.imul(h ^ dkkNum(t.x2), 16777619); h = Math.imul(h ^ dkkNum(t.olym), 16777619);
  h = Math.imul(h ^ dkkNum(t.frozen), 16777619); h = Math.imul(h ^ dkkNum(t.tour), 16777619);
  h = Math.imul(h ^ dkkNum(t.visits), 16777619); h = Math.imul(h ^ dkkNum(t.ice), 16777619);
  h = Math.imul(h ^ dkkNum(t.slide), 16777619); h = Math.imul(h ^ dkkNum(t.sand), 16777619);
  h = Math.imul(h ^ dkkNum(t.plague), 16777619);
  h = Math.imul(h ^ ((t.grow !== undefined && t.grow !== 1) ? 1 : 0), 16777619);
  /* マスに書く数字そのもの（独占・ライン・観光地・イベント・インフレで変わる）＝ tollOf と同じ物を見る */
  if(t.type === 'city' && t.owner >= 0 && typeof tollOf === 'function'){
    try{ h = Math.imul(h ^ (tollOf(t, G) | 0), 16777619); }catch(e){}
  }
  return h;
}
/* 変わったマスを集める（1フレーム1回） */
function dkkScan(){
  var S = DKK_S, sg = S.tsig || (S.tsig = new Int32Array(32)), chg = S.chg, g = -2128831035, i, h;
  g = Math.imul(g ^ dkkNum(G.infl || 1), 16777619);
  g = Math.imul(g ^ dkkNum((G.ev && G.ev.tollX) || 1), 16777619);
  g = Math.imul(g ^ dkkNum((G.ev && G.ev.monoX) || 1), 16777619);
  chg.length = 0;
  for(i = 0; i < 32; i++){ h = dkkTsig(G.tiles[i], g); if(sg[i] !== h){ sg[i] = h; chg.push(i); } }
  return chg.length;
}
/* マスと建物が入る四角（盤の座標・広めに取る） */
function dkkBox(i){
  var S = DKK_S || dkkS(), B = S.box, m = S.bm, q, x0, y0, x1, y1, k;
  if(B[i]) return B[i];
  q = tileQuad(i); x0 = y0 = 1e9; x1 = y1 = -1e9;
  for(k = 0; k < 4; k++){
    if(q[k].x < x0) x0 = q[k].x; if(q[k].x > x1) x1 = q[k].x;
    if(q[k].y < y0) y0 = q[k].y; if(q[k].y > y1) y1 = q[k].y;
  }
  return (B[i] = { x0: x0 - m[0], y0: y0 - m[1], x1: x1 + m[2], y1: y1 + m[3] });   // 建物は上へ最大 325px（ランドマーク）
}
function dkkRedraw(now){
  var S = DKK_S, n = dkkScan();
  if(!n) return;
  /* 変わったマスが多い時だけ全部作り直す（広さの上限 S.pmax でも止まる） */
  if(n > 16 || !dkkPatch(now)){ S.n.many++; refreshBoard(now); }
}
/* 変わったマスの周りだけ描き直す。絵は「最初に作った時刻」で描くので継ぎ目は出ない */
function dkkPatch(now){
  var S = DKK_S, chg = S.chg, ord = dkkOrder(), T = S.bdT, s = BD_S, lst = S.plst || (S.plst = []), i, k, b, t;
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  if(!(T > 0) || !bdKey) return false;
  for(i = 0; i < chg.length; i++){
    b = dkkBox(chg[i]);
    if(b.x0 < x0) x0 = b.x0; if(b.y0 < y0) y0 = b.y0; if(b.x1 > x1) x1 = b.x1; if(b.y1 > y1) y1 = b.y1;
  }
  if(x0 < BD_X) x0 = BD_X; if(y0 < BD_Y) y0 = BD_Y;
  if(x1 > BD_X + BD_W) x1 = BD_X + BD_W; if(y1 > BD_Y + BD_H) y1 = BD_Y + BD_H;
  if(!(x1 > x0 && y1 > y0)){ S.n.pat++; return true; }                       // 盤キャッシュの外＝直す所が無い
  x0 = BD_X + Math.floor((x0 - BD_X) * s) / s; y0 = BD_Y + Math.floor((y0 - BD_Y) * s) / s;   // 画素の境目にそろえる
  x1 = BD_X + Math.ceil((x1 - BD_X) * s) / s; y1 = BD_Y + Math.ceil((y1 - BD_Y) * s) / s;
  if((x1 - x0) * (y1 - y0) > BD_W * BD_H * S.pmax) return false;             // 広すぎる時は全部作り直す方が速い
  lst.length = 0;
  for(i = 0; i < 32; i++){ k = ord[i]; b = dkkBox(k); if(b.x1 > x0 && b.x0 < x1 && b.y1 > y0 && b.y0 < y1) lst.push(k); }
  bdC.save();
  bdC.setTransform(s, 0, 0, s, -BD_X * s, -BD_Y * s);
  bdC.beginPath(); bdC.rect(x0, y0, x1 - x0, y1 - y0); bdC.clip();
  bdC.clearRect(x0, y0, x1 - x0, y1 - y0);
  try{
    drawLake(bdC, G.map, T); drawSlab(bdC, G.map, T);
    for(i = 0; i < lst.length; i++) drawTile(bdC, G, lst[i], T);
    S.bmode = 'cache';
    for(i = 0; i < lst.length; i++){ t = G.tiles[lst[i]]; if(t && t.type === 'city' && t.owner >= 0) drawBuilding(bdC, G, lst[i], T); }
  }catch(e){ S.bmode = ''; bdC.restore(); return false; }
  S.bmode = '';
  bdC.restore();
  S.rect = { x0: x0, y0: y0, x1: x1, y1: y1, n: lst.length };
  bdKey = boardSig(); S.sa = S.h.a; S.sb = S.h.b; S.n.pat++;
  return true;
}
/* 見えているか（offsetParent を読まない＝レイアウトを起こさない。H12） */
function dkkElOn(el){
  var n = el, i = 0;
  for(; n && n.nodeType === 1 && i < 40; n = n.parentElement, i++){
    if(n.hidden) return false;
    if(n.id === 'modalWrap') return n.classList.contains('on');
    if(n.classList && n.classList.contains('screen')) return n.classList.contains('on');
    if(n.id === 'stage') break;
  }
  return !(typeof DKFX === 'object' && DKFX && DKFX.worldOff);
}

/* ══ 札束（C16：盤は作り直さない。1人ずつ、色のある所だけの絵） ══ */
function dkkStacksChanged(){ (DKK_S || dkkS()).stkDirty = true; }
function dkkStackXY(i){
  try{ if(typeof dkbStackXY === 'function'){ var q = dkbStackXY(i); if(q && typeof q.x === 'number') return q; } }catch(e){}
  var s = STACK_POS[i] || STACK_POS[0]; return proj(s.p, s.q);
}
function dkkStacks(S, now){
  var k = Math.min(BD_S, Math.max(1, cv.width / SW)), P = G.players, H = S.hs, i, p, xy, b;
  if(S.stkDefer){ S.stkDefer = false; return; }
  for(i = 0; i < 4; i++){
    b = S.stk[i] || (S.stk[i] = { c: null, on: false, a: 0, b: 0 });
    p = P[i]; H.a = 7; H.b = 11; dkkH(H, k);
    if(p && !p.out){ xy = dkkStackXY(i); dkkH(H, xy.x); dkkH(H, xy.y); dkkH(H, typeof dkbBundles === 'function' ? dkbBundles(p.cash) : Math.round((p.cash || 0) / 2500000)); dkkH(H, (p.items || []).length); }
    if(S.stkDirty || H.a !== b.a || H.b !== b.b){ b.a = H.a; b.b = H.b; dkkStackPaint(b, i, k, now); }
    if(b.on) ctx.drawImage(b.c, b.x, b.y, b.w, b.h);
  }
  S.stkDirty = false;
}
function dkkStackPaint(b, i, k, now){
  var P = G.players, S = DKK_S, j, only = [], c, g, x, p = P[i], fg, key;
  b.on = false;
  if(i >= P.length || p.out) return;
  var xy = dkkStackXY(i), x0 = Math.floor(xy.x - 170), y0 = Math.floor(xy.y - 230), m = 0.5;
  for(j = 0; j < P.length; j++) only.push(j === i ? p : { out: true, cash: 0, items: [] });
  fg = { players: only, map: G.map, tiles: G.tiles, turn: G.turn };
  key = (typeof dkbBundles === 'function' ? dkbBundles(p.cash) : 0) + '|' + Math.min(4, (p.items || []).length);
  if(!(key in S.sbx)){                              // 形ごとに1回だけ、粗い絵で範囲を測る（読み取りを小さく）
    c = dkkCanvas(430 * m, 360 * m); g = c.getContext('2d', { willReadFrequently: true });
    g.setTransform(m, 0, 0, m, -x0 * m, -y0 * m);
    try{ drawStacks(g, fg, now); }catch(e){}
    x = dkkAlphaBox(g, c.width, c.height, 2); c.width = c.height = 1;
    S.sbx[key] = x && { x: x.x / m, y: x.y / m, w: x.w / m, h: x.h / m };
  }
  if(!(x = S.sbx[key])) return;
  b.c = b.c || document.createElement('canvas'); b.c.width = Math.ceil(x.w * k); b.c.height = Math.ceil(x.h * k);
  g = b.c.getContext('2d'); g.setTransform(k, 0, 0, k, -(x0 + x.x) * k, -(y0 + x.y) * k);
  try{ drawStacks(g, fg, now); }catch(e){ console.error('[WP10] stacks', e); }
  b.x = x0 + x.x; b.y = y0 + x.y; b.w = x.w; b.h = x.h; b.on = true;
}
/* 色のある範囲（p＝余白） */
function dkkAlphaBox(g, W, H, p){
  var d = new Uint32Array(g.getImageData(0, 0, W, H).data.buffer), x0 = W, y0 = H, x1 = -1, y1 = -1, x, y, r;
  for(y = 0; y < H; y++){ r = y * W; for(x = 0; x < W; x++) if(d[r + x] > 0x3ffffff){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; y1 = y; } }
  if(x1 < 0) return null;
  x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(W - 1, x1 + p); y1 = Math.min(H - 1, y1 + p);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/* ══ 建物（C18：tile.bm で並べる。bmode 'cache' 盤用／'live' 毎フレーム用／'' 全部） ══ */
var DKK_PARTS = [[], ['v'], ['t'], ['v', 't'], ['h'], ['v', 'h'], ['t', 'h'], ['v', 't', 'h']];
function dkkPartsOf(t){
  var b = t.bm;
  if(typeof b === 'number' && b >= 0 && b <= 7) return DKK_PARTS[b | 0];
  return DKK_PARTS[(t.lv >= 1 ? 1 : 0) | (t.lv >= 2 ? 2 : 0) | (t.lv >= 3 ? 4 : 0)];
}
function drawBuilding(ctx, G, i, T){
  var t = G.tiles[i]; if(!t || t.type !== 'city' || t.owner < 0) return;
  var md = (DKK_S || dkkS()).bmode, gr0 = (t.grow === undefined ? 1 : t.grow), live = gr0 !== 1 || !!t.landmark;
  if((md === 'cache' && live) || (md === 'live' && !live)) return;
  var r = RECTS[i], ax = r.p + r.w / 2, ay = r.q + r.h / 2;
  if(r.side === 0) ay = r.q + r.h * 0.13;
  if(r.side === 2) ay = r.q + r.h * 0.87;
  if(r.side === 1) ax = r.p + r.w * 0.87;
  if(r.side === 3) ax = r.p + r.w * 0.13;
  var o = proj(ax, ay), col = PCOL[t.owner], grow = gr0 * 0.86;
  if(t.landmark){ // 光の柱
    var pulse = 0.55 + 0.45 * Math.sin(T * 0.0022);
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createLinearGradient(0, 0, 0, -112);
    g.addColorStop(0, 'rgba(140,230,255,' + (0.24 * pulse).toFixed(3) + ')');
    g.addColorStop(.45, 'rgba(140,230,255,' + (0.10 * pulse).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(140,230,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-5, -112); ctx.lineTo(5, -112); ctx.lineTo(15, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  var along = (r.side === 0 || r.side === 2) ? 'p' : 'q', span = (along === 'p') ? r.w : r.h;
  var put = function(f, sc, key){
    var oo = proj(along === 'p' ? ax + span * f : ax, along === 'q' ? ay + span * f : ay);
    ctx.save(); ctx.translate(oo.x, oo.y); ctx.scale(grow * sc, grow * sc);
    dkkPart(ctx, key, col, T);
    ctx.restore();
  };
  if(t.landmark){ put(0, 1.05, 'lm'); return; }
  var L = dkkPartsOf(t), n = L.length, k;
  if(n){ for(k = 0; k < n; k++) put(((k + 1) / (n + 1) - 0.5) * 0.70, 0.78, L[k]); return; }
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(grow, grow);  // 更地：所有を示す小さな旗
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(20, -21); ctx.lineTo(0, -15); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function dkkPartFn(key){ return key === 'v' ? dvVilla : key === 't' ? dvTowerB : key === 'h' ? dvHotel : dvLandmark; }
/* 部品は描く先の細かさで作り置く */
function dkkPart(ctx, key, col, T){
  var m = ctx.getTransform(), q = Math.max(0.5, Math.min(4, Math.round(Math.sqrt(m.a * m.a + m.b * m.b) * 10) / 10)), sp = dkkPartSpr(key, col, T, q);
  if(sp) ctx.drawImage(sp.c, sp.x, sp.y, sp.w, sp.h); else dkkPartFn(key)(ctx, col, T);
}
/* 範囲は時刻を変えて重ねた絵で測る */
function dkkPartBox(key, col, T){
  var S = DKK_S, b = S.pbox[key];
  if(b) return b;
  var sc = 1, W = 300, H = 420, ox = 150, oy = 360, c = dkkCanvas(W, H), k, g = c.getContext('2d', { willReadFrequently: true });
  try{ for(k = 0; k < 7; k++){ g.setTransform(sc, 0, 0, sc, ox, oy); dkkPartFn(key)(g, col, T + k * 1100); } }catch(e){ return null; }
  k = dkkAlphaBox(g, W, H, 0); c.width = c.height = 1;
  return k ? (S.pbox[key] = { x: (k.x - ox) / sc - 6, y: (k.y - oy) / sc - 8, w: k.w / sc + 12, h: k.h / sc + 14 }) : null;
}
function dkkPartSpr(key, col, T, q){
  var S = DKK_S || dkkS(), k = key + col + q, bb, c, g;
  if(S.part[k]) return S.part[k];
  if(!(bb = dkkPartBox(key, col, T))) return null;
  c = dkkCanvas(bb.w * q, bb.h * q); g = c.getContext('2d');
  g.setTransform(q, 0, 0, q, -bb.x * q, -bb.y * q);
  try{ dkkPartFn(key)(g, col, T); }catch(e){ return null; }
  return (S.part[k] = { c: c, x: bb.x, y: bb.y, w: c.width / q, h: c.height / q });
}
/* 作り置きを捨てる（C18）：'token'／'building'（盤も）／'die'／無し＝全部 */
function dkkInvalidate(kind){
  var S = DKK_S || dkkS(), all = !kind || kind === 'all';
  if(all || kind === 'token' || kind === 'text'){ S.spr = {}; S.bdg = {}; S.tp = {}; S.fok = null; }
  if(all || kind === 'die') S.die = {};
  if(all || kind === 'building'){ S.part = {}; try{ boardChanged(); }catch(e){} }
  if(all){ S.stkDirty = true; bgKey = ''; }
}

/* ══ コマ（C17：同じマスの名前札は dkkTags が縦に並べる） ══ */
function drawToken(ctx, G, pi, T){
  var p = G.players[pi]; if(!p || p.out) return;
  var S = DKK_S || dkkS(), pos = p.render || tileCenter(p.pos), sq = p.squash || 1, tg;
  ctx.save(); ctx.translate(pos.x + (p.offx || 0), pos.y + (p.offy || 0) - (p.hopY || 0));
  if(G.turn === pi && !G.over) dkkRing(ctx, T, pi);
  ctx.save(); ctx.scale(1 / sq, sq);
  dvChar(ctx, p.ch, PCOL[pi], T + pi * 700, p.face || 1, p.card);
  ctx.restore();
  if(!dkkShared(G, pi)){
    tg = S.spr['t' + pi]; // 席ごとに1枚
    if(!tg || tg.n !== p.name) tg = S.spr['t' + pi] = dkkTagSpr(p.name, pi);
    if(tg) ctx.drawImage(tg.c, -tg.w / 2, -78 - tg.h / 2, tg.w, tg.h); else dkkTagRaw(ctx, p.name, pi);
  }
  ctx.restore();
}
function dkkShared(G, pi){
  var p = G.players[pi], k, q;
  if(p.moving) return false;
  for(k = 0; k < G.players.length; k++){ q = G.players[k]; if(k !== pi && !q.out && !q.moving && q.pos === p.pos) return true; }
  return false;
}
function dkkRing(ctx, T, pi){
  var S = DKK_S, pu = 0.55 + 0.45 * Math.sin(T * 0.005), a0 = (T * 0.0022) % 6.283, c = S.spr.glow, lv = Math.round(pu * 32);
  if(!c){ // 足元の光
    c = S.spr.glow = dkkCanvas(168, 76);
    var g = c.getContext('2d'), gr;
    g.setTransform(2, 0, 0, 2, 84, 32);
    gr = g.createRadialGradient(0, 3, 2, 0, 3, 42);
    gr.addColorStop(0, 'rgba(255,236,150,0.5)'); gr.addColorStop(.6, 'rgba(255,212,77,0.22)'); gr.addColorStop(1, 'rgba(255,212,77,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 3, 42, 19, 0, 0, 6.283); g.fill();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pu;
  ctx.drawImage(c, -42, -16, 84, 38);
  ctx.restore();
  ctx.save();
  ctx.lineWidth = 5; ctx.strokeStyle = S.rc[lv] || (S.rc[lv] = 'rgba(255,240,170,' + (0.65 + 0.3 * lv / 32).toFixed(3) + ')');
  ctx.beginPath(); ctx.ellipse(0, 3, 30, 13, 0, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.ellipse(0, 3, 30, 13, 0, a0, a0 + 2.1); ctx.stroke();
  /* 手番の人は「席の色」の輪も足す（本家は誰の番かを足元の色で見せる） */
  ctx.lineWidth = 4;
  ctx.strokeStyle = (typeof PCOL !== 'undefined' && PCOL[pi]) ? PCOL[pi] : '#FFD24D';
  ctx.beginPath(); ctx.ellipse(0, 3.5, 37, 16, 0, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath(); ctx.ellipse(0, 3.5, 34, 14.4, 0, 0, 6.283); ctx.stroke();
  ctx.restore();
}
function dkkTagRaw(ctx, name, pi){
  ctx.save();
  ctx.translate(0, -78);
  ctx.font = '900 13px "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  var w = ctx.measureText(name).width + 14;
  ctx.fillStyle = 'rgba(8,16,28,.78)';
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w / 2, -10, w, 20, 7); ctx.fill(); } else ctx.fillRect(-w / 2, -10, w, 20);
  ctx.strokeStyle = PCOL[pi]; ctx.lineWidth = 2;
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w / 2, -10, w, 20, 7); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.fillText(name, 0, 1);
  ctx.restore();
}
function dkkTagSpr(name, pi){
  if(!dkkFontOk()) return null;
  var c = document.createElement('canvas'), g = c.getContext('2d'), W;
  g.font = '900 13px "Noto Sans JP", sans-serif';
  W = Math.ceil(g.measureText(name).width + 18);
  c.width = W * 3; c.height = 72;
  g = c.getContext('2d'); g.setTransform(3, 0, 0, 3, W * 1.5, 270);
  dkkTagRaw(g, name, pi);
  return { c: c, w: W, h: 24, n: name };
}
/* 同じマスに2人以上の時の名前札（9h と同じ見た目） */
function dkkTags(ctx){
  var S = DKK_S, by = {}, P = G.players, i, p, k, a, key, sp, c;
  for(i = 0; i < P.length; i++){ p = P[i]; if(!p.out && !p.moving) (by[p.pos] || (by[p.pos] = [])).push(i); }
  for(k in by){
    a = by[k]; if(a.length < 2) continue;
    c = tileCenter(+k); key = a.join(','); sp = S.tp[key];
    if(!sp || sp.G !== G) sp = S.tp[key] = dkkTagPanel(null, a);
    if(sp) ctx.drawImage(sp.c, c.x + sp.x, c.y + sp.y, sp.w, sp.h);
    else { ctx.save(); ctx.translate(c.x, c.y); dkkTagPanel(ctx, a); ctx.restore(); }
  }
}
/* ctx が null なら絵を作って返す */
function dkkTagPanel(ctx, arr){
  var n = arr.length, lo = 1e9, hi = -1e9, maxw = 0, own = !ctx, cv0 = null, sc = 3;
  if(own){ if(!dkkFontOk()) return null; cv0 = document.createElement('canvas'); ctx = cv0.getContext('2d'); }
  ctx.font = '900 13px "Noto Sans JP", sans-serif';
  arr.forEach(function(pi, j){
    var w = ctx.measureText(G.players[pi].name).width + 14, off = (j - (n - 1) / 2) * 26;
    lo = Math.min(lo, off - w / 2); hi = Math.max(hi, off + w / 2); maxw = Math.max(maxw, w);
  });
  /* 絵のコマ（高さ92px）に名前札がかぶらないよう、札は頭より上に置く */
  var W = Math.max(hi - lo + 6, maxw + 26), H = n * 21 + 6, x0 = (lo + hi) / 2 - W / 2, y0 = -104 - H;
  if(own){ cv0.width = Math.ceil((W + 4) * sc); cv0.height = Math.ceil((H + 4) * sc); ctx = cv0.getContext('2d'); ctx.setTransform(sc, 0, 0, sc, (2 - x0) * sc, (2 - y0) * sc); }
  ctx.save();
  ctx.font = '900 13px "Noto Sans JP", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(10,8,4,.92)';
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x0, y0, W, H, 8); ctx.fill(); } else ctx.fillRect(x0, y0, W, H);
  ctx.strokeStyle = 'rgba(214,166,64,.9)'; ctx.lineWidth = 1.5;
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x0, y0, W, H, 8); ctx.stroke(); }
  arr.forEach(function(pi, j){
    var yy = y0 + 13.5 + 21 * (n - 1 - j);
    ctx.fillStyle = PCOL[pi]; ctx.beginPath(); ctx.arc(x0 + 11, yy, 5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.fillText(G.players[pi].name, x0 + 21, yy + 0.5);
  });
  ctx.restore();
  return own ? { c: cv0, x: x0 - 2, y: y0 - 2, w: cv0.width / sc, h: cv0.height / sc, G: G } : null;
}

/* ══ 金の丸数字（作り置き） ══ */
function goldBadge(ctx, x, y, txt, r){
  var sp = dkkBadgeSpr(txt, r);
  if(sp) ctx.drawImage(sp.c, x - sp.h, y - sp.h, sp.h * 2, sp.h * 2); else dkkBadgeRaw(ctx, x, y, txt, r);
}
function dkkBadgeRaw(ctx, x, y, txt, r){
  ctx.save(); ctx.translate(x, y);
  var g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#FFF6C8'); g.addColorStop(.45, '#F2C230'); g.addColorStop(1, '#B87F12');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = '#5C3F06'; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -r * 0.38, r * 0.55, r * 0.3, 0, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
  ctx.font = '400 ' + (r * 1.15) + 'px "Mochiy Pop One", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3.2; ctx.lineJoin = 'round'; ctx.strokeStyle = '#4A3206';
  ctx.strokeText(txt, 0, 1); ctx.fillStyle = '#FFF8E0'; ctx.fillText(txt, 0, 1);
  ctx.restore();
}
function dkkBadgeSpr(txt, r){
  var S = DKK_S || dkkS(), m = S.bdg[r] || (S.bdg[r] = {}), h = r + 4, c, g;
  if(m[txt]) return m[txt];
  if(!dkkFontOk()) return null;
  c = dkkCanvas(h * 6, h * 6); g = c.getContext('2d');
  g.setTransform(3, 0, 0, 3, h * 3, h * 3);
  dkkBadgeRaw(g, 0, 0, txt, r);
  return (m[txt] = { c: c, h: h });
}

/* ══ サイコロ（面は作り置き。装備したサイコロの色で＝WP2#2） ══ */
function dkkDie(ctx, face, spin, size){
  var S = DKK_S || dkkS(), TAU = Math.PI * 2, i;
  var s = (typeof size === 'number' && size > 0) ? size : 52, f = Math.max(1, Math.min(6, Math.round(face || 1)));
  var sp = (typeof spin === 'number' && isFinite(spin) && spin > 0) ? spin : 0;
  var TX = s * 0.6, TY = TX * 0.585, HH = TX * 1.06, ph = sp * TAU, amp = Math.min(1, sp * 8);
  var bob = -Math.abs(Math.sin(ph)) * s * 0.16 * amp, sq = 1 - 0.09 * Math.sin(ph * 2) * amp, b = dkkDieSpr(S.dieId || 'd0', f, s);
  if(!b){ DKK_O.dvDie.apply(this, arguments); return; }
  ctx.save();
  ctx.save(); ctx.translate(0, TY + HH / 2 + s * 0.08); ctx.scale(1, 0.32);   // 接地影
  var g = ctx.createRadialGradient(0, 0, 0, 0, 0, TX * 1.05);
  g.addColorStop(0, 'rgba(28,24,46,0.26)'); g.addColorStop(1, 'rgba(28,24,46,0)');
  ctx.beginPath(); ctx.arc(0, 0, TX * 1.05, 0, TAU); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  if(sp > 0.02){ dkkDieBlit(ctx, b, 0.25, ph - 0.30, -s * 0.10, bob + s * 0.05, sq); dkkDieBlit(ctx, b, 0.13, ph - 0.60, -s * 0.19, bob + s * 0.10, sq); }
  dkkDieBlit(ctx, b, 1, ph, 0, bob, sq);
  if(sp > 0.02){ // きらめき
    for(i = 0; i < 7; i++){
      var a = dkkRnd(i) * TAU + ph * 1.7, rr = s * (0.72 + dkkRnd(i + 40) * 0.40), ss = s * 0.05 * (0.6 + dkkRnd(i + 80) * 0.9);
      ctx.save();
      ctx.globalAlpha = amp * (0.30 + 0.45 * dkkRnd(i + 120));
      ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr * 0.55); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -ss);
      ctx.quadraticCurveTo(ss * 0.22, -ss * 0.22, ss, 0); ctx.quadraticCurveTo(ss * 0.22, ss * 0.22, 0, ss);
      ctx.quadraticCurveTo(-ss * 0.22, ss * 0.22, -ss, 0); ctx.quadraticCurveTo(-ss * 0.22, -ss * 0.22, 0, -ss);
      ctx.closePath(); ctx.fillStyle = '#FFE27A'; ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
function dkkRnd(i){ var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function dkkDieBlit(ctx, b, a, ang, ox, oy, sq){
  ctx.save(); ctx.globalAlpha = a; ctx.translate(ox, oy);
  if(ang) ctx.rotate(ang);
  if(sq !== 1) ctx.scale(1, sq);
  ctx.drawImage(b.c, b.x, b.y, b.w, b.h);
  ctx.restore();
}
/* 面：元の dvDie（接地影は抜く）。ほかは色だけ替える */
function dkkDieSpr(id, f, s){
  var S = DKK_S, k = id + '|' + f + '|' + s, d = null, c, g, a;
  if(S.die[k]) return S.die[k];
  if(id !== 'd0'){ try{ d = dieById(id); }catch(e){} }
  if(d && d.id === id && d.col){
    if(!(a = dkkDieSpr('d0', f, s))) return null;
    c = dkkCanvas(a.c.width, a.c.height); g = c.getContext('2d');
    g.drawImage(a.c, 0, 0);
    g.globalCompositeOperation = 'color'; g.fillStyle = d.col; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(a.c, 0, 0);
    return (S.die[k] = { c: c, x: a.x, y: a.y, w: a.w, h: a.h });
  }
  var TX = s * 0.6, w = TX * 2 + 8, h = TX * 1.17 + TX * 1.06 + 8, sc = dkkMob() ? 2 : 2.5, n = 0;
  c = dkkCanvas(w * sc, h * sc); g = c.getContext('2d');
  g.setTransform(sc, 0, 0, sc, (w / 2) * sc, (h / 2) * sc);
  var rg = g.createRadialGradient;
  g.createRadialGradient = function(){ var q = rg.apply(g, arguments); if(n++ === 0) q.addColorStop = function(){}; return q; };
  try{ DKK_O.dvDie(g, f, 0, s); }catch(e){ return null; }
  return (S.die[k] = { c: c, x: -w / 2, y: -h / 2, w: w, h: h });
}

/* ══ 肖像（見えているかは世代ごとに1回。絵は変わった時だけ） ══ */
function paintPortraits(T){
  if(T - portAt < 70) return;
  portAt = T;
  var vg = (typeof DKFX === 'object' && DKFX) ? (DKFX.vg | 0) : 0, ag = (DKK_S || dkkS()).artGen, i, o, im;
  for(i = portraits.length - 1; i >= 0; i--){
    o = portraits[i];
    if(!o.el.isConnected){ if(!o._dkkGone) o._dkkGone = T; else if(T - o._dkkGone > 5000) portraits.splice(i, 1); continue; }
    o._dkkGone = 0;
    if(o._dkkVg !== vg){ o._dkkVg = vg; o._dkkV = dkkElOn(o.el); }
    if(!o._dkkV) continue;
    var W = o.el.width, H = o.el.height, s = Math.min(W / 240, H / 340), c;
    im = null;
    try{ im = _dvImg(_dvKeyPort(o.cardId)); }catch(e){}
    if(im && o._dkkIm === im && o._dkkW === W && o._dkkH === H && o._dkkAt === ag) continue;
    o._dkkIm = im; o._dkkW = W; o._dkkH = H; o._dkkAt = ag;
    c = o.el.getContext('2d');
    c.clearRect(0, 0, W, H);
    c.save(); c.translate((W - 240 * s) / 2, (H - 340 * s) / 2); c.scale(s, s);
    dvPort(o.chId, c, T + o.chId * 430, o.cardId);
    c.restore();
  }
}

/* ══ 重い端末は自動で「控えめ」（G14：2秒ごとの平均が3回続けて28ms超） ══ */
function dkkPerf(S, now){
  var P = S.pf, raw = now - (P.last || now), avg;
  P.last = now;
  if(P.done || typeof DKFX !== 'object' || !DKFX || DKFX.lite || DKFX.worldOff || !G || G.over || !G.running || document.hidden || !(raw > 0) || raw > 250){
    P.t0 = now; P.n = 0; P.sum = 0; if(raw > 250) P.bad = 0;
    return;
  }
  P.n++; P.sum += raw;
  if(now - P.t0 < 2000) return;
  avg = P.sum / P.n; P.t0 = now; P.n = 0; P.sum = 0;
  if(avg <= 28){ P.bad = 0; return; }
  if(++P.bad < 3) return;
  P.done = true;
  try{ DKFX.setLite(true); }catch(e){}
  try{ toast('R', '⚙️', '演出を「控えめ」にしました', '動きが重いので自動で切り替えました。設定で戻せます', 3600); }catch(e){}
  try{ dkEmit('fx:autolite', { lite: true }); }catch(e){}
}

/* ══ 見えない間の下ごしらえ ══ */
function dkkWarm(){
  var S = DKK_S;
  if(dkkGame()) return;
  var map = MAPS.find(function(m){ return m.id === cfg.mapId; }) || MAPS[0], steps = [], G0 = null, now = performance.now(), ord = dkkOrder(), k;
  steps.push(function(){ if(!dkkGame() && bgKey !== map.id) refreshBg(map, performance.now()); });
  steps.push(dkkPreTok);
  if(!S.warm[map.id]){
    S.warm[map.id] = 1;
    steps.push(function(){
      if(dkkGame() || !(G0 = dkkDummy(map))) return;
      bdC.setTransform(1, 0, 0, 1, 0, 0); bdC.clearRect(0, 0, bdL.width, bdL.height);
      bdC.setTransform(BD_S, 0, 0, BD_S, -BD_X * BD_S, -BD_Y * BD_S);
      drawLake(bdC, map, now); drawSlab(bdC, map, now);
      bdKey = ''; S.g = null;
    });
    for(k = 0; k < 32; k += 8) (function(k0){
      steps.push(function(){ if(!G0 || dkkGame()) return; for(var j = k0; j < k0 + 8; j++) drawTile(bdC, G0, ord[j], now); bdKey = ''; S.g = null; });
    })(k);
    steps.push(function(){ for(var d = 1; d <= 12; d++){ dkkBadgeSpr(String(d), 14); dkkBadgeSpr(String(d), 19); } });
  }
  dkkSteps(steps);
}
function dkkDummy(map){ // 対戦の乱数を進めない
  var R = Math.random, t = null;
  Math.random = function(){ return 0.5; };
  try{ t = buildTiles(map); }catch(e){ t = null; } finally{ Math.random = R; }
  return t ? { map: map, tiles: t, players: [], turn: 0, ev: {}, infl: 1, over: true } : null;
}
function dkkPreTok(){
  var S = DKK_S;
  try{
    (cfg.seats || []).slice(0, cfg.n || 4).forEach(function(s, i){
      var c = (s && s.cardId && typeof cardById === 'function') ? cardById(s.cardId) : null, tg = S.spr['t' + i];
      if((c = c || CARDPOOL[i % CARDPOOL.length])) _dvImg(_dvKeyTok(c.id));
      if(s && s.name && (!tg || tg.n !== s.name)) S.spr['t' + i] = dkkTagSpr(s.name, i);
    });
  }catch(e){}
}

/* ══ BGM（J23・C32）：dvMusic2 を偽の AudioContext に載せ1周を録る（尾は頭に足す）。できるまでは合成。録音は IndexedDB へ ══ */
function bgm(name, opt){
  if(!bgmOn) return;
  var want = (window.DV_BGM && window.DV_BGM[name] && MUSICF) ? MUSICF : MUSICS;
  if(!want) return;
  try{ if(MUSICF && want !== MUSICF) MUSICF.stop(0.4); }catch(e){}
  try{ if(MUSICS && want !== MUSICS) MUSICS.stop(0.4); }catch(e){}
  MUSIC = want;
  try{ want.play(name, opt); }catch(e){}
}
function dkkB(){
  if(!DKK_B) DKK_B = { live: null, ac: null, out: null, vol: 1, cur: '', liveOn: false, liveAt: 0, liveName: '', src: null, srcG: null,
    cache: {}, lru: [], q: [], busy: null, db: null, hash: '', max: 2, fail: {}, stored: {},
    bpm: { lobby: 108, room: 100, game: 124, tense: 140, boss: 146, gacha: 128, win: 150, result: 96 }, tonic: { lobby: 0, room: 5, gacha: 2, win: 0, result: 0 } };
  return DKK_B;
}
function dkkBgmKey(name, opt){
  var tp = (opt && +opt.tempo > 0) ? Math.round(+opt.tempo * 100) / 100 : 1;
  return name + ((opt && opt.minor) ? '|m' : '') + (tp !== 1 ? '|t' + tp : '');
}
function dkkMusicWrap(live, ac){
  var B = DKK_B || dkkB();
  B.live = live; B.ac = ac; B.max = dkkMob() ? 2 : 4;
  B.out = ac.createGain(); B.out.gain.value = B.vol; B.out.connect(ac.destination);
  var ramp = function(fn){ var g = B.out.gain, now = ac.currentTime; try{ g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); fn(g, now); }catch(e){ g.value = B.vol; } };
  return {
    play: function(name, opt){ dkkBgmPlay(name, opt); },
    stop: function(f){ dkkBgmStop(f); },
    setVolume: function(v){ B.vol = Math.max(0, Math.min(1, +v || 0)); try{ live.setVolume(v); }catch(e){} ramp(function(g, now){ g.linearRampToValueAtTime(B.vol, now + 0.08); }); },
    duck: function(amt, sec){
      try{ live.duck(amt, sec); }catch(e){}
      var a = Math.max(0.02, Math.min(1, amt || 1)), hold = Math.max(0, sec || 0);
      ramp(function(g, now){ g.linearRampToValueAtTime(B.vol * a, now + 0.06); g.setValueAtTime(B.vol * a, now + 0.06 + hold); g.linearRampToValueAtTime(B.vol, now + 0.41 + hold); });
    },
    get volume(){ return B.vol; },
    get current(){ return B.cur ? B.cur.split('|')[0] : null; }
  };
}
function dkkBgmPlay(name, opt){
  var B = DKK_B || dkkB(), key = dkkBgmKey(name, opt), e = B.cache[key], mi = !!(opt && opt.minor), tp = (opt && +opt.tempo > 0) ? +opt.tempo : 1;
  if(!B.live || (B.cur === key && (B.src || B.liveOn || (B.busy && B.busy.key === key)))) return;
  B.cur = key;
  if(e && e.buf){ dkkBgmUse(key); dkkBgmStart(e, 0.8, false); return; }
  dkkBgmSrcOff(0.8);
  if(B.stored[dkkBgmId({ key: key })]){ if(B.liveOn){ try{ B.live.stop(0.8); }catch(err){} B.liveOn = false; } dkkBgmNeed(key, name, mi, tp, true); return; } // 保存済み
  dkkBgmLive(name); // 合成で鳴らし裏で録音
  dkkBgmNeed(key, name, mi, tp, true);
}
function dkkBgmLive(name){
  var B = DKK_B, restart = !(B.liveOn && B.liveName === name);
  try{ B.live.play(name); }catch(err){}
  if(restart) B.liveAt = B.ac.currentTime + 0.06;
  B.liveOn = true; B.liveName = name;
}
function dkkBgmStop(f){
  var B = DKK_B || dkkB();
  B.cur = '';
  try{ if(B.live) B.live.stop(f); }catch(e){}
  B.liveOn = false; B.liveName = '';
  dkkBgmSrcOff(f === undefined ? 0.8 : Math.max(0.01, f));
}
function dkkBgmStart(e, fade, align){
  var B = DKK_B, ac = B.ac, now = ac.currentTime, s = ac.createBufferSource(), g = ac.createGain();
  if(ac.state === 'suspended'){ try{ ac.resume(); }catch(err){} }
  s.buffer = e.buf; s.loop = true; s.loopStart = 0; s.loopEnd = e.buf.duration; s.playbackRate.value = e.rate || 1;
  g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(1, now + fade);
  s.connect(g); g.connect(B.out);
  s.start(now, align ? (((now - B.liveAt - e.w) % e.L) + e.L) % e.L : 0);
  dkkBgmSrcOff(fade);
  if(B.liveOn){ try{ B.live.stop(fade); }catch(err){} B.liveOn = false; B.liveName = ''; }
  B.src = s; B.srcG = g;
}
function dkkBgmSrcOff(fade){
  var B = DKK_B || dkkB(); if(!B.src) return;
  var s = B.src, g = B.srcG, now = B.ac.currentTime;
  B.src = null; B.srcG = null;
  s.onended = function(){ try{ s.disconnect(); g.disconnect(); }catch(e){} };
  try{ g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0.0001, now + fade); s.stop(now + fade + 0.05); }
  catch(e){ try{ s.stop(); }catch(e2){} }
}
/* 録音ができた：その曲なら入れ替える（合成と拍をそろえる） */
function dkkBgmReady(key){
  var B = DKK_B, e = B.cache[key];
  if(!e || !e.buf || B.cur !== key || B.src || !B.ac) return;
  if(B.liveOn && B.liveName === e.name && !e.vr) dkkBgmStart(e, 0.15, true); else dkkBgmStart(e, 0.8, false);
}
function dkkBgmUse(key){ var B = DKK_B, i = B.lru.indexOf(key); if(i >= 0) B.lru.splice(i, 1); B.lru.push(key); }
function dkkBgmPut(key, e){
  var B = DKK_B, i = 0, k;
  B.cache[key] = e; dkkBgmUse(key);
  while(B.lru.length > B.max && i < B.lru.length){ k = B.lru[i]; if(k === B.cur){ i++; continue; } B.lru.splice(i, 1); delete B.cache[k]; }
}
/* hi＝今の曲（先頭へ）。save='idb'＝先回り */
function dkkBgmNeed(key, name, minor, tempo, hi, save){
  var B = DKK_B || dkkB(), i, job;
  if((B.cache[key] && B.cache[key].buf) || B.fail[key]) return;
  if(B.busy && B.busy.key === key){ if(hi) B.busy.keep = true; return; }
  for(i = 0; i < B.q.length; i++){ if(B.q[i].key === key){ if(hi){ B.q[i].keep = true; B.q.unshift(B.q.splice(i, 1)[0]); } return; } }
  job = { key: key, name: name, minor: !!minor, tempo: tempo || 1, keep: save !== 'idb' };
  if(hi) B.q.unshift(job); else B.q.push(job);
  dkkLater(dkkBgmPump, !hi);
}
function dkkBgmPump(){
  var B = DKK_B || dkkB();
  if(B.busy || !B.q.length) return;
  if((B.q[0].r || B.q[0].key !== B.cur) && dkkBusy()){ if(!B.pt) B.pt = setTimeout(function(){ B.pt = 0; dkkBgmPump(); }, 1000); return; } // 録音と先回りは盤が隠れている時だけ（読み出しはいつでも）
  var job = B.q.shift(), id = dkkBgmId(job);
  B.busy = job;
  var want = function(){ return job.keep || B.cur === job.key; };
  var fin = function(e){
    B.busy = null;
    if(e){
      e.key = job.key; e.name = job.name; e.vr = job.minor || job.tempo !== 1; e.w = 0;
      if(want()) dkkBgmPut(job.key, e);
      if(B.cur === job.key) dkkBgmReady(job.key);
    } else if(e === null){ B.fail[job.key] = 1; if(B.cur === job.key && !B.src && !B.liveOn && B.live) dkkBgmLive(job.name); }
    dkkLater(dkkBgmPump, true);
  };
  var done2 = function(e){
    if(e) dkkToI16(e.buf, function(a, b){ B.stored[id] = 1; dkkIdbDo('readwrite', function(st){ return st.put({ L: e.L, rate: e.rate, sr: e.buf.sampleRate, n: e.buf.length, a: a, b: b }, id); }); });
    fin(e);
  };
  var load = function(rec){
    if(rec && rec.n && rec.a && rec.b) dkkFromI16(rec, B.cur !== job.key, function(buf){ if(buf) fin({ buf: buf, L: rec.L, rate: rec.rate }); else rend(); });
    else rend();
  };
  var rend = function(){
    if(!dkkBusy()){ dkkBgmRender(job, done2); return; }
    job.r = 1; B.busy = null; B.q.unshift(job);       // 盤が見えている間は合成で鳴らしておく
    if(B.cur === job.key && !B.src && !B.liveOn && B.live) dkkBgmLive(job.name);
    dkkBgmPump();
  };
  if(job.r){ rend(); return; }
  if(want()){ dkkIdbDo('readonly', function(st){ return st.get(id); }).then(load); return; }
  dkkIdbDo('readonly', function(st){ return st.count(id); }).then(function(n){   // 先回り：保存済みなら読まない
    if(!n){ rend(); return; }
    if(!want()){ fin(undefined); return; }
    dkkIdbDo('readonly', function(st){ return st.get(id); }).then(load);
  });
}
function dkkBgmId(job){ // 合成エンジンが変わったら別の名前
  var B = DKK_B, s = '', h = -2128831035, i;
  if(!B.hash){
    try{ s = String((DKK_O && DKK_O.dvMusic2) || ''); }catch(e){}
    for(i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    B.hash = (h >>> 0).toString(36) + s.length.toString(36);
  }
  return 'v1|' + B.hash + '|' + job.key;
}
function dkkBgmRender(job, done){
  var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if(!OAC || !DKK_O || !DKK_O.dvMusic2){ done(null); return; }
  var B = DKK_B, rate = 32000, spb0 = 60 / (B.bpm[job.name] || 60), len = Math.ceil((0.06 + 64 * spb0 + 3.4) * rate), oc;
  try{ oc = new OAC(2, len, rate); }catch(e){ done(null); return; }
  var clk = { t: 0 }, cap = { spb: 0 }, px = dkkFakeAC(oc, clk, dkkFreqMap(job), cap), m, tk = null, si = window.setInterval;
  /* 出だしのフェードは録らない（最初の GainNode を 1 に） */
  try{ window.setInterval = function(fn){ tk = fn; return 0; }; m = DKK_O.dvMusic2(px); px.arm = 1; if(m) m.play(job.name); }
  catch(e){ tk = null; }
  finally{ window.setInterval = si; }
  var L = 64 * (cap.spb > 0 ? cap.spb : spb0), end = 0.06 + L - 0.12, total = len / rate, nx = 0.5, bad = false;
  if(!tk || 0.06 + L + 3.0 > total){ done(null); return; }
  /* 音符は録音の進みに合わせて 0.5 秒ずつ作る */
  var sched = function(upTo){ try{ while(!bad && clk.t < end && clk.t < upTo){ clk.t = Math.min(end, clk.t + 0.1); tk(); } }catch(e){ bad = true; } };
  var nxt = function(){ dkkLater(go, B.cur !== job.key); };
  var go = function(){ sched(nx + 0.9); nx += 0.5; if(nx < total - 0.01) oc.suspend(nx).then(nxt); oc.resume(); };
  sched(nx + 0.4);
  oc.suspend(nx).then(nxt);
  oc.startRendering().then(function(buf){ if(bad) done(null); else dkkBgmLoop(job, buf, L, rate, done); }, function(){ done(null); });
}
function dkkBgmLoop(job, buf, L, rate, done){
  try{
    var n = Math.round(L * rate), s0 = Math.round(0.06 * rate), tail = Math.max(0, Math.min(buf.length - (s0 + n), Math.round(3 * rate)));
    var out = dkkNewBuf(2, n, rate), c, i, src, dst;
    for(c = 0; c < 2; c++){
      src = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)); dst = out.getChannelData(c);
      dst.set(src.subarray(s0, s0 + n));
      for(i = 0; i < tail; i++) dst[i] += src[s0 + n + i];
    }
    done({ buf: out, L: L, rate: job.tempo || 1 });
  }catch(e){ done(null); }
}
function dkkNewBuf(ch, n, rate){
  try{ return new AudioBuffer({ numberOfChannels: ch, length: n, sampleRate: rate }); }
  catch(e){ var O = window.OfflineAudioContext || window.webkitOfflineAudioContext; return new O(ch, 1, rate).createBuffer(ch, n, rate); }
}
/* 偽の AudioContext（時計はこちらが進める） */
function dkkFakeAC(oc, clk, fm, cap){
  var P = { destination: oc.destination, sampleRate: oc.sampleRate, state: 'running', resume: function(){ return Promise.resolve(); } };
  Object.defineProperty(P, 'currentTime', { get: function(){ return clk.t; } });
  ['createBiquadFilter', 'createConvolver', 'createDynamicsCompressor', 'createWaveShaper', 'createBufferSource',
   'createBuffer', 'createPeriodicWave', 'createStereoPanner', 'createChannelMerger', 'createChannelSplitter', 'createConstantSource']
    .forEach(function(k){ if(typeof oc[k] === 'function') P[k] = oc[k].bind(oc); });
  P.createGain = function(){ var g = oc.createGain(); if(P.arm){ P.arm = 0; dkkWrapParam(g, 'gain', function(){ return 1; }, null); } return g; };
  P.createOscillator = function(){ var o = oc.createOscillator(); if(fm) dkkWrapParam(o, 'frequency', fm, null); return o; };
  P.createDelay = function(mx){ var d = oc.createDelay(mx); if(mx >= 1) dkkWrapParam(d, 'delayTime', null, function(v){ cap.spb = v / 0.75; }); return d; };
  return P;
}
function dkkWrapParam(node, prop, fm, onSet){
  var r = node[prop], f = fm || function(v){ return v; }, w = {};
  ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime'].forEach(function(k){ w[k] = function(v, t){ r[k](f(v), t); return w; }; });
  w.setTargetAtTime = function(v, t, c){ r.setTargetAtTime(f(v), t, c); return w; };
  w.cancelScheduledValues = function(t){ r.cancelScheduledValues(t); return w; };
  Object.defineProperty(w, 'value', { get: function(){ return r.value; }, set: function(v){ r.value = f(v); if(onSet) onSet(v); } });
  Object.defineProperty(node, prop, { value: w, configurable: true });
}
/* 短調（長3・6・7度を半音下げる）と遅い曲（上げて録り遅く再生） */
function dkkFreqMap(job){
  var tn = DKK_B.tonic[job.name], mi = job.minor && tn !== undefined, k = 1 / (job.tempo || 1), dn = Math.pow(2, -1 / 12);
  if(!mi && k === 1) return null;
  var pc = function(f){ var m = 69 + 12 * Math.log2(f / 440), r = Math.round(m); return Math.abs(m - r) > 0.06 ? -1 : ((r - tn) % 12 + 12) % 12; };
  return function(f){
    if(!(f > 0)) return f;
    var g = f, q;
    if(mi && f >= 20){ q = pc(f); if(q < 0) q = pc(f / 2.76); if(q < 0) q = pc(f / 5.4); if(q === 4 || q === 9 || q === 11) g = f * dn; }
    return g * k;
  };
}
function dkkIdb(){ // 保存済みの名前も覚える
  var B = DKK_B || dkkB();
  return B.db || (B.db = new Promise(function(res){
    try{
      if(!window.indexedDB){ res(null); return; }
      var rq = indexedDB.open('dk-bgm', 1);
      rq.onupgradeneeded = function(){ try{ rq.result.createObjectStore('s'); }catch(e){} };
      rq.onsuccess = function(){
        var db = rq.result;
        try{ var k = db.transaction('s').objectStore('s').getAllKeys(); k.onsuccess = function(){ (k.result || []).forEach(function(x){ B.stored[x] = 1; }); res(db); }; k.onerror = function(){ res(db); }; }
        catch(e){ res(db); }
      };
      rq.onerror = rq.onblocked = function(){ res(null); };
    }catch(e){ res(null); }
  }));
}
function dkkIdbDo(mode, fn){
  return dkkIdb().then(function(db){
    if(!db) return null;
    return new Promise(function(res){
      try{ var rq = fn(db.transaction('s', mode).objectStore('s')); rq.onsuccess = function(){ res(rq.result === undefined ? null : rq.result); }; rq.onerror = function(){ res(null); }; }
      catch(e){ res(null); }
    });
  });
}
function dkkToI16(buf, cb){
  var n = buf.length, a = new Int16Array(n), b = new Int16Array(n), c0 = buf.getChannelData(0), c1 = buf.getChannelData(buf.numberOfChannels > 1 ? 1 : 0), i = 0;
  var q = function(x){ return x <= -1 ? -32767 : x >= 1 ? 32767 : (x * 32767) | 0; };
  var step = function(){
    var t0 = performance.now(), e;
    while(i < n && performance.now() - t0 < 5){ e = Math.min(n, i + 32768); for(; i < e; i++){ a[i] = q(c0[i]); b[i] = q(c1[i]); } }
    if(i < n) dkkLater(step, true); else cb(a, b);
  };
  dkkLater(step, true);
}
function dkkFromI16(rec, bg, cb){
  var buf, c0, c1, i = 0, n = rec.n, k = 1 / 32767;
  try{ buf = dkkNewBuf(2, n, rec.sr || 32000); }catch(e){ cb(null); return; }
  c0 = buf.getChannelData(0); c1 = buf.getChannelData(1);
  var step = function(){
    var t0 = performance.now(), e;
    while(i < n && performance.now() - t0 < 5){ e = Math.min(n, i + 32768); for(; i < e; i++){ c0[i] = rec.a[i] * k; c1[i] = rec.b[i] * k; } }
    if(i < n) dkkLater(step, bg); else cb(buf);
  };
  dkkLater(step, bg);
}
function dkkBgmAhead(list){ // 次の曲を先に録音
  dkkIdb().then(function(db){
    if(db) list.forEach(function(it){ var o = it[1] || null; dkkBgmNeed(dkkBgmKey(it[0], o), it[0], !!(o && o.minor), (o && o.tempo) || 1, false, 'idb'); });
  });
}

/* ══ 起動 ══ */
(function(){
  try{
    dkkS(); dkkB();
    DKK_S.cap = dkkMob() ? 15.5 : 0;                  // スマホは 60 コマ/秒で描く
    DKK_O = DKK_O || {};
    drawToken.dkkTags = true;
    if(typeof dvMusic2 === 'function' && !dvMusic2._dkk){ // 録音用は DKK_O.dvMusic2
      DKK_O.dvMusic2 = dvMusic2;
      dvMusic2 = function(ac){ var m = DKK_O.dvMusic2(ac); try{ return m ? dkkMusicWrap(m, ac) : m; }catch(e){ console.error('[WP10] bgm', e); return m; } };
      dvMusic2._dkk = true;
    }
    if(typeof dvDie === 'function' && !dvDie._dkk){ DKK_O.dvDie = dvDie; dvDie = dkkDie; dvDie._dkk = true; }
    if(typeof drawDice === 'function' && !drawDice._dkk){ // 振る人のサイコロ
      DKK_O.drawDice = drawDice;
      drawDice = function(ctx2, T){
        var S = DKK_S, prev = S.dieId;
        try{ S.dieId = (diceAnim && G && G.players && typeof dieOf === 'function') ? ((dieOf(G.turn) || {}).id || '') : ''; }catch(e){ S.dieId = ''; }
        try{ return DKK_O.drawDice.apply(this, arguments); } finally { S.dieId = prev; }
      };
      drawDice._dkk = true;
    }
    if(typeof refreshArt === 'function' && !refreshArt._dkk){ // 肖像を描き直す
      DKK_O.refreshArt = refreshArt;
      refreshArt = function(){ DKK_S.artGen++; return DKK_O.refreshArt.apply(this, arguments); };
      refreshArt._dkk = true;
    }
    try{ if(document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function(){ dkkInvalidate('text'); }); }catch(e){}
    dkOn('screen', function(p){ // 下ごしらえ・曲の先回り
      if(!p || !p.changed) return;
      if(p.id === 'setup' || p.id === 'room' || p.id === 'loading' || p.id === 'dkclass') setTimeout(dkkWarm, 350);
      if(p.id === 'room' || p.id === 'setup') dkkBgmAhead([['game'], ['win'], ['result'], ['result', { minor: true, tempo: 0.8 }]]);
    });
    setTimeout(function(){ dkkLater(dkkWarm); dkkIdb(); }, 250); // 最初の描画のあと
  }catch(e){ console.error('[WP10]', e); }
})();
