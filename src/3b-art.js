/* ══════════════════════════════════════════════
   ダイスボヤージュ — アートレイヤー（自動生成・本家参照）
   ══════════════════════════════════════════════ */

/* ───── ad4fb7d29f7626a10 ───── */
// ===== ダイスボヤージュ 演出エフェクト群（本家ゲットリッチ 氷の洞窟 準拠） =====
// すべて (x,y) 中心・k=0..1 の進行度。k>=1 は何も描かない。乱数と時刻は使わない。

// 決定的な擬似乱数（インデックスから作る）
function dvFxRnd(i){ const x = Math.sin(i*127.1+311.7)*43758.5453; return x - Math.floor(x); }

// 三次イージング（外へ勢いよく → 減速）
function dvFxEaseOut(t){ const u = 1-t; return 1-u*u*u; }

// #rgb / #rrggbb を rgba() に。解釈できない色は白でフォールバック
function dvFxRgba(col, a){
  let r=255,g=255,b=255;
  if(typeof col === 'string' && col.charAt(0) === '#'){
    let h = col.slice(1);
    if(h.length === 3){ h = h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2); }
    if(h.length >= 6){
      r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
      if(isNaN(r)||isNaN(g)||isNaN(b)){ r=255; g=255; b=255; }
    }
  }
  return 'rgba('+r+','+g+','+b+','+a.toFixed(3)+')';
}

// 色を白へ寄せる（光の芯用）
function dvFxLighten(col, m){
  let r=255,g=255,b=255;
  if(typeof col === 'string' && col.charAt(0) === '#'){
    let h = col.slice(1);
    if(h.length === 3){ h = h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2); }
    if(h.length >= 6){
      r = parseInt(h.slice(0,2),16)||0; g = parseInt(h.slice(2,4),16)||0; b = parseInt(h.slice(4,6),16)||0;
    }
  }
  r = Math.round(r+(255-r)*m); g = Math.round(g+(255-g)*m); b = Math.round(b+(255-b)*m);
  return 'rgb('+r+','+g+','+b+')';
}

// 4芒星（きらめき）のパス。sharp が小さいほど棘が細い
function dvFxStarPath(ctx, r, sharp){
  const inr = r*sharp;
  ctx.beginPath();
  for(let i=0;i<8;i++){
    const a = i*Math.PI/4 - Math.PI/2;
    const rad = (i%2===0) ? r : inr;
    const px = Math.cos(a)*rad, py = Math.sin(a)*rad;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
}

// ---- 着地の白い放射閃光（本家: 約200ms で scale 0→1.8 / opacity 1→0）----
function dvFxLand(ctx, x, y, k){
  if(k >= 1 || k < 0) return;
  const e = dvFxEaseOut(k);
  const s = 0.05 + 1.75*e;          // 0 → 1.8
  const a = Math.pow(1-k, 1.4);     // 1 → 0
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';

  // 1) 床にへばりつく光（アイソメなので縦を潰す）
  ctx.save();
  ctx.scale(1, 0.52);
  const gr = ctx.createRadialGradient(0,0,0, 0,0, 62*s);
  gr.addColorStop(0,   'rgba(255,255,255,'+(0.95*a).toFixed(3)+')');
  gr.addColorStop(0.28,'rgba(214,246,255,'+(0.62*a).toFixed(3)+')');
  gr.addColorStop(0.65,'rgba(126,214,255,'+(0.22*a).toFixed(3)+')');
  gr.addColorStop(1,   'rgba(126,214,255,0)');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(0,0,62*s,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // 2) 放射スパイク（横に長い菱形を回転配置）
  ctx.save();
  ctx.scale(1, 0.62);
  ctx.globalAlpha = a;
  for(let i=0;i<16;i++){
    const ang = (i/16)*Math.PI*2 + dvFxRnd(i)*0.22;
    const len = (30 + 42*dvFxRnd(i+40)) * s;
    const w   = (2.2 + 3.4*dvFxRnd(i+80)) * (1-k*0.75);
    ctx.save();
    ctx.rotate(ang);
    const lg = ctx.createLinearGradient(0,0,len,0);
    lg.addColorStop(0,  'rgba(255,255,255,0.95)');
    lg.addColorStop(0.5,'rgba(206,242,255,0.55)');
    lg.addColorStop(1,  'rgba(150,220,255,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(len*0.35, -w);
    ctx.lineTo(len, 0);
    ctx.lineTo(len*0.35, w);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 3) 広がる細いリング
  ctx.save();
  ctx.scale(1, 0.5);
  ctx.globalAlpha = a*0.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(0.8, 4.5*(1-k));
  ctx.beginPath(); ctx.arc(0,0, 58*e + 6, 0, Math.PI*2); ctx.stroke();
  ctx.restore();

  // 4) 中心の白コア（最初だけ強く）
  const core = Math.max(0, 1-k*2.2);
  if(core > 0){
    ctx.globalAlpha = core;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, 16*(0.5+e), 9*(0.5+e), 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ---- 取得/建設時の光の柱（下が太く上が細い半透明の台形＋上端に光の玉）----
function dvFxPillar(ctx, x, y, k, col){
  if(k >= 1 || k < 0) return;
  const c = col || '#7fe6ff';
  const grow = dvFxEaseOut(Math.min(1, k/0.30));
  const fade = k < 0.55 ? 1 : Math.pow(1-(k-0.55)/0.45, 1.3);
  const H  = 220 * grow;
  const wB = 44 * (0.55 + 0.45*grow) * (1 - 0.25*k);  // 下（太い）
  const wT = wB * 0.34;                                // 上（細い）
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = fade;

  // 足元の光だまり
  const fg = ctx.createRadialGradient(0,0,0, 0,0, wB*1.9);
  fg.addColorStop(0, dvFxRgba(dvFxLighten(c,0.7), 0.85));
  fg.addColorStop(0.5, dvFxRgba(c, 0.35));
  fg.addColorStop(1, dvFxRgba(c, 0));
  ctx.save(); ctx.scale(1,0.45);
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.arc(0,0, wB*1.9, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // 台形の柱（下が濃く上が薄い）
  const pg = ctx.createLinearGradient(0, 0, 0, -H);
  pg.addColorStop(0,   dvFxRgba(c, 0.62));
  pg.addColorStop(0.35,dvFxRgba(c, 0.34));
  pg.addColorStop(0.8, dvFxRgba(c, 0.12));
  pg.addColorStop(1,   dvFxRgba(c, 0));
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.moveTo(-wB/2, 0);
  ctx.lineTo(-wT/2, -H);
  ctx.lineTo( wT/2, -H);
  ctx.lineTo( wB/2, 0);
  ctx.closePath(); ctx.fill();

  // 内側の白い芯
  const cg = ctx.createLinearGradient(0, 0, 0, -H);
  cg.addColorStop(0,  'rgba(255,255,255,0.85)');
  cg.addColorStop(0.6,'rgba(255,255,255,0.28)');
  cg.addColorStop(1,  'rgba(255,255,255,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(-wB*0.17, 0);
  ctx.lineTo(-wT*0.16, -H);
  ctx.lineTo( wT*0.16, -H);
  ctx.lineTo( wB*0.17, 0);
  ctx.closePath(); ctx.fill();

  // 上端の光の玉（少しだけ脈打つ）
  if(grow > 0.15){
    const pulse = 1 + 0.18*Math.sin(k*Math.PI*5);
    const R = 15*pulse*(0.6+0.4*grow);
    const og = ctx.createRadialGradient(0,-H,0, 0,-H,R*2.4);
    og.addColorStop(0,   'rgba(255,255,255,0.95)');
    og.addColorStop(0.35, dvFxRgba(dvFxLighten(c,0.45), 0.6));
    og.addColorStop(1,    dvFxRgba(c, 0));
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.arc(0,-H, R*2.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = fade*0.9;
    ctx.beginPath(); ctx.arc(0,-H, R*0.45, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = fade;
  }

  // 柱に沿って昇る粒
  for(let i=0;i<7;i++){
    const ph = (k*1.5 + dvFxRnd(i+11)) % 1;
    const py = -H*ph;
    const pwid = wB*0.5*(1-ph*0.66);
    const px = (dvFxRnd(i+31)*2-1)*pwid;
    const pa = fade*(1-ph)*0.9;
    if(pa <= 0) continue;
    ctx.globalAlpha = pa;
    ctx.fillStyle = dvFxLighten(c, 0.6);
    ctx.beginPath(); ctx.arc(px, py, 1.4+2.2*dvFxRnd(i+51), 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ---- 地面を走る衝撃波リング（アイソメなので横長の楕円）----
function dvFxRing(ctx, x, y, k, col){
  if(k >= 1 || k < 0) return;
  const c = col || '#8fe8ff';
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.scale(1, 0.5);   // アイソメの床に寝かせる

  // 内側のうっすら塗り（最初だけ）
  const early = Math.max(0, 1-k*1.8);
  if(early > 0){
    const rr = 20 + 90*dvFxEaseOut(k);
    const fg = ctx.createRadialGradient(0,0,rr*0.2, 0,0,rr);
    fg.addColorStop(0, dvFxRgba(c, 0));
    fg.addColorStop(0.72, dvFxRgba(c, 0.16*early));
    fg.addColorStop(1, dvFxRgba(c, 0));
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.fill();
  }

  // 2重のリング（内側が少し遅れて出る）
  for(let n=0;n<2;n++){
    const kk = n === 0 ? k : (k-0.20)/0.80;
    if(kk <= 0 || kk >= 1) continue;
    const e = dvFxEaseOut(kk);
    const r = 14 + (n===0 ? 108 : 76)*e;
    const a = Math.pow(1-kk, 1.5) * (n===0 ? 0.95 : 0.6);
    ctx.globalAlpha = a;
    ctx.lineWidth = Math.max(0.7, (n===0 ? 8 : 4.5)*(1-kk));
    ctx.strokeStyle = dvFxLighten(c, 0.55);
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
    // 芯の白線
    ctx.globalAlpha = a*0.7;
    ctx.lineWidth = Math.max(0.5, 2.4*(1-kk));
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
  }
  ctx.restore();
}

// ---- 星形のきらめきが弾ける ----
function dvFxSpark(ctx, x, y, k, col){
  if(k >= 1 || k < 0) return;
  const c = col || '#ffe066';
  const e = dvFxEaseOut(k);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<11;i++){
    const ang  = (i/11)*Math.PI*2 + dvFxRnd(i+3)*0.5;
    const dist = (34 + 68*dvFxRnd(i+13)) * e;
    const px = Math.cos(ang)*dist;
    const py = Math.sin(ang)*dist*0.62 - 16*e*dvFxRnd(i+23); // 少しだけ上へ舞う
    const life = Math.min(1, k/(0.55+0.4*dvFxRnd(i+33)));
    if(life >= 1) continue;
    const size = (5.5 + 6.5*dvFxRnd(i+43)) * (1-life) * (0.4+0.6*e);
    const a = Math.pow(1-life, 1.2);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dvFxRnd(i+53)*Math.PI + k*1.2);
    ctx.globalAlpha = a;
    // 星の周りのにじみ
    const gg = ctx.createRadialGradient(0,0,0, 0,0, size*2.6);
    gg.addColorStop(0, dvFxRgba(dvFxLighten(c,0.7), 0.55));
    gg.addColorStop(1, dvFxRgba(c, 0));
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(0,0,size*2.6,0,Math.PI*2); ctx.fill();
    // 4芒星本体
    ctx.fillStyle = dvFxLighten(c, 0.35);
    dvFxStarPath(ctx, size*2.1, 0.22); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = a*0.9;
    dvFxStarPath(ctx, size*1.1, 0.3); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ---- 独占祝勝時の白い噴煙柱 ----
function dvFxSteam(ctx, x, y, k){
  if(k >= 1 || k < 0) return;
  ctx.save();
  ctx.translate(x, y);

  // 足元の吹き出し（床に広がる白）
  const base = Math.max(0, 1-k*1.6);
  if(base > 0){
    ctx.save(); ctx.scale(1,0.42);
    const bg = ctx.createRadialGradient(0,0,0, 0,0, 52+40*dvFxEaseOut(k));
    bg.addColorStop(0, 'rgba(255,255,255,'+(0.7*base).toFixed(3)+')');
    bg.addColorStop(0.6,'rgba(236,248,255,'+(0.3*base).toFixed(3)+')');
    bg.addColorStop(1, 'rgba(225,245,255,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0,0, 52+40*dvFxEaseOut(k), 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // 昇る煙の塊（下から順に時間差で出る）
  for(let i=0;i<16;i++){
    const p = (k - i*0.042) / 0.62;
    if(p <= 0 || p >= 1) continue;
    const ep = dvFxEaseOut(p);
    const rise = 168 * ep;
    const sway = Math.sin(p*2.6 + dvFxRnd(i)*6.28) * (10 + 16*ep) * (dvFxRnd(i+7) > 0.5 ? 1 : -1);
    const r = (13 + 22*dvFxRnd(i+17)) * (0.45 + 1.15*ep);
    const a = Math.sin(Math.PI*Math.min(1,p*1.15)) * 0.5 * (1 - k*0.35);
    if(a <= 0) continue;
    const px = sway*0.6, py = -rise;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0,   'rgba(255,255,255,'+(a).toFixed(3)+')');
    g.addColorStop(0.55,'rgba(246,252,255,'+(a*0.55).toFixed(3)+')');
    g.addColorStop(1,   'rgba(228,244,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ---- 盤上に浮かび上がる金額（金グラデ＋濃茶の太い袋文字・上へ昇ってフェード）----
function dvFxNumber(ctx, x, y, k, txt, col, big){
  if(k >= 1 || k < 0) return;
  const s = (txt === undefined || txt === null) ? '' : String(txt);
  if(!s) return;
  const fs = big ? 46 : 32;
  const e  = dvFxEaseOut(k);
  const rise = (big ? 74 : 54) * e;                       // 上へ昇る
  // 出だしはポンと跳ねる → すぐ等倍
  let sc;
  if(k < 0.16)      sc = 0.45 + (1.22-0.45)*(k/0.16);
  else if(k < 0.30) sc = 1.22 - 0.22*((k-0.16)/0.14);
  else              sc = 1.0;
  const alpha = k < 0.10 ? (k/0.10) : (k > 0.72 ? Math.pow(1-(k-0.72)/0.28, 1.2) : 1);
  if(alpha <= 0) return;

  ctx.save();
  ctx.translate(x, y - rise);
  ctx.scale(sc, sc);
  ctx.globalAlpha = alpha;
  ctx.font = '400 ' + fs + 'px "Mochiy Pop One", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  // 下に落ちる影
  ctx.save();
  ctx.globalAlpha = alpha*0.45;
  ctx.fillStyle = 'rgba(20,10,4,0.85)';
  ctx.fillText(s, 0, fs*0.14);
  ctx.restore();

  // 濃茶の袋文字（外→内で2度描いて縁を締める）
  ctx.strokeStyle = '#3a2008';
  ctx.lineWidth = big ? 9 : 7;
  ctx.strokeText(s, 0, 0);
  ctx.strokeStyle = '#5a3510';
  ctx.lineWidth = big ? 4.5 : 3.5;
  ctx.strokeText(s, 0, 0);

  // 本体（既定は金グラデ。col 指定時はその色を軸にした縦グラデ）
  const top = -fs*0.62, bot = fs*0.62;
  const g = ctx.createLinearGradient(0, top, 0, bot);
  if(col){
    g.addColorStop(0,    dvFxLighten(col, 0.72));
    g.addColorStop(0.45, dvFxLighten(col, 0.12));
    g.addColorStop(0.62, col);
    g.addColorStop(1,    dvFxLighten(col, 0.45));
  }else{
    g.addColorStop(0,    '#fffdf0');
    g.addColorStop(0.32, '#ffe98a');
    g.addColorStop(0.52, '#ffc93c');
    g.addColorStop(0.66, '#f39c12');
    g.addColorStop(1,    '#ffe9a0');
  }
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(255,214,110,0.9)';
  ctx.shadowBlur = big ? 14 : 9;
  ctx.fillText(s, 0, 0);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0,0,0,0)';

  // 上端のハイライト（丸ゴシックの艶）
  ctx.save();
  ctx.beginPath();
  ctx.rect(-fs*s.length, top, fs*s.length*2, fs*0.42);
  ctx.clip();
  ctx.globalAlpha = alpha*0.55;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(s, 0, 0);
  ctx.restore();

  ctx.restore();
}

/* ───── a8ce0fceaccb687bb ───── */
// マス1枚（天面＋側面）を本家ゲットリッチ風に描く
function dvTile(ctx, quad, opt) {
  if (!ctx || !quad || quad.length < 4) return;
  var o = opt || {};
  var H = (typeof o.h === 'number') ? o.h : 13;
  var T = (typeof o.t === 'number') ? o.t : 0;   // 発光の脈動用（省略可）
  var dim = !!o.dim;

  // ---------- 色ユーティリティ ----------
  function _dvHex(c) {
    if (typeof c !== 'string') return [210, 216, 228];
    var s = c.trim().replace(/^#/, '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s.slice(0, 6), 16);
    if (isNaN(n)) return [210, 216, 228];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function _dvMix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  // amt>0 で白寄せ、amt<0 で暗部色寄せ（真っ黒でなく青みの暗色へ落とすのが本家の質感）
  function _dvSh(c, amt) {
    return amt >= 0 ? _dvMix(c, [255, 255, 255], amt) : _dvMix(c, [10, 16, 34], -amt);
  }
  function _dvC(c, a) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a === undefined ? 1 : a) + ')';
  }

  var topC = _dvHex(o.top || '#e8ecf3');
  var sideC = _dvHex(o.side || '#4c5a7c');
  var bandC = o.band ? _dvHex(o.band) : null;
  var glowC = o.glow ? _dvHex(o.glow) : null;
  if (dim) { // 抵当・凍結は彩度と明度を落として奥へ引っ込める
    topC = _dvMix(topC, [86, 100, 128], 0.55);
    sideC = _dvMix(sideC, [40, 50, 74], 0.5);
    if (bandC) bandC = _dvMix(bandC, [78, 92, 120], 0.55);
  }

  // ---------- 幾何：角丸平行四辺形 ----------
  // 各頂点で「前の辺へr」「次の辺へr」の2点を作り、頂点を制御点にした二次曲線で丸める
  function _dvGeom(pts) {
    var A = [], B = [], i, n = pts.length;
    for (i = 0; i < n; i++) {
      var cur = pts[i], pv = pts[(i + n - 1) % n], nx = pts[(i + 1) % n];
      var v1x = pv.x - cur.x, v1y = pv.y - cur.y, l1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
      var v2x = nx.x - cur.x, v2y = nx.y - cur.y, l2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
      var r = Math.min(7, l1 * 0.18, l2 * 0.18);   // 辺長の18%と7pxの小さい方
      A.push({ x: cur.x + v1x / l1 * r, y: cur.y + v1y / l1 * r });
      B.push({ x: cur.x + v2x / l2 * r, y: cur.y + v2y / l2 * r });
    }
    return { A: A, B: B };
  }
  function _dvTrace(pts, g, dy) {
    var n = pts.length, i;
    dy = dy || 0;
    ctx.beginPath();
    ctx.moveTo(g.A[0].x, g.A[0].y + dy);
    for (i = 0; i < n; i++) {
      ctx.quadraticCurveTo(pts[i].x, pts[i].y + dy, g.B[i].x, g.B[i].y + dy);
      var a = g.A[(i + 1) % n];
      ctx.lineTo(a.x, a.y + dy);
    }
    ctx.closePath();
  }
  // 角の円弧を等分サンプル（側面のスカートを天面の丸みにぴったり合わせるため）
  function _dvArc(p0, c, p1, steps) {
    var out = [], i, t, u;
    for (i = 0; i <= steps; i++) {
      t = i / steps; u = 1 - t;
      out.push({ x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y });
    }
    return out;
  }

  var P = [];
  for (var qi = 0; qi < 4; qi++) P.push({ x: quad[qi].x, y: quad[qi].y });
  var G = _dvGeom(P);
  var cx = (P[0].x + P[1].x + P[2].x + P[3].x) / 4;
  var cy = (P[0].y + P[1].y + P[2].y + P[3].y) / 4;

  // 各辺の外向き法線（時計回り／反時計回りどちらでも正しく外を向く）
  var edges = [];
  for (var i2 = 0; i2 < 4; i2++) {
    var a = P[i2], b = P[(i2 + 1) % 4];
    var ex = b.x - a.x, ey = b.y - a.y, el = Math.sqrt(ex * ex + ey * ey) || 1;
    var nx2 = ey / el, ny2 = -ex / el;
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (nx2 * (mx - cx) + ny2 * (my - cy) < 0) { nx2 = -nx2; ny2 = -ny2; }
    edges.push({ i: i2, nx: nx2, ny: ny2, mx: mx, my: my });
  }
  // 上辺（白ハイライト）と下辺（わずかな陰）
  var topEdge = 0, botEdge = 0;
  for (var i3 = 1; i3 < 4; i3++) {
    if (edges[i3].my < edges[topEdge].my) topEdge = i3;
    if (edges[i3].my > edges[botEdge].my) botEdge = i3;
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ---------- 1) 盤面への落ち影 ----------
  ctx.save();
  ctx.globalAlpha = dim ? 0.28 : 0.42;
  ctx.shadowColor = 'rgba(3,8,22,0.85)';
  ctx.shadowBlur = Math.max(6, H * 0.9);
  ctx.shadowOffsetY = Math.max(2, H * 0.35);
  _dvTrace(P, G, H);
  ctx.fillStyle = 'rgba(4,10,24,0.9)';
  ctx.fill();
  ctx.restore();

  // ---------- 2) 側面（角のスカート → 辺の面 の順） ----------
  // 角のスイープ：丸み部分の真下を埋めて天面の輪郭と側面をつなぐ
  for (var v = 0; v < 4; v++) {
    var ePrev = edges[(v + 3) % 4], eNext = edges[v];
    if (ePrev.ny <= 0.01 && eNext.ny <= 0.01) continue;   // 手前を向いていない角は見えない
    var arc = _dvArc(G.A[v], P[v], G.B[v], 8);
    var anx = (ePrev.nx + eNext.nx) / 2;
    var tA = Math.max(0, Math.min(1, (anx + 1) / 2));
    var colA = _dvSh(sideC, -0.32 + 0.36 * tA);
    ctx.beginPath();
    ctx.moveTo(arc[0].x, arc[0].y);
    for (var k = 1; k < arc.length; k++) ctx.lineTo(arc[k].x, arc[k].y);
    for (var k2 = arc.length - 1; k2 >= 0; k2--) ctx.lineTo(arc[k2].x, arc[k2].y + H);
    ctx.closePath();
    var gA = ctx.createLinearGradient(arc[0].x, arc[0].y, arc[0].x, arc[0].y + H);
    gA.addColorStop(0, _dvC(_dvSh(colA, 0.10)));
    gA.addColorStop(1, _dvC(_dvSh(colA, -0.30)));
    ctx.fillStyle = gA;
    ctx.fill();
  }
  // 辺の面：手前（下）を向く辺だけ。法線のx成分で明暗2段階（右下向き=明／左下向き=暗）
  var vis = [];
  for (var e2 = 0; e2 < 4; e2++) if (edges[e2].ny > 0.01) vis.push(edges[e2]);
  vis.sort(function (p, q) { return p.my - q.my; });   // 奥から手前へ
  for (var vi = 0; vi < vis.length; vi++) {
    var E = vis[vi];
    var s0 = G.B[E.i], s1 = G.A[(E.i + 1) % 4];
    var t2 = Math.max(0, Math.min(1, (E.nx + 1) / 2));
    var col = _dvSh(sideC, -0.32 + 0.36 * t2);
    ctx.beginPath();
    ctx.moveTo(s0.x, s0.y);
    ctx.lineTo(s1.x, s1.y);
    ctx.lineTo(s1.x, s1.y + H);
    ctx.lineTo(s0.x, s0.y + H);
    ctx.closePath();
    var gS = ctx.createLinearGradient(E.mx, E.my, E.mx, E.my + H);
    gS.addColorStop(0, _dvC(_dvSh(col, 0.13)));
    gS.addColorStop(0.55, _dvC(col));
    gS.addColorStop(1, _dvC(_dvSh(col, -0.32)));
    ctx.fillStyle = gS;
    ctx.fill();
  }
  // 最下部の締まり線
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = _dvC(_dvSh(sideC, -0.55));
  ctx.lineWidth = 1;
  _dvTrace(P, G, H);
  ctx.stroke();
  ctx.restore();

  // ---------- 3) 天面 ----------
  var gT = ctx.createLinearGradient(edges[topEdge].mx, edges[topEdge].my, edges[botEdge].mx, edges[botEdge].my);
  gT.addColorStop(0, _dvC(_dvSh(topC, 0.16)));
  gT.addColorStop(0.45, _dvC(topC));
  gT.addColorStop(1, _dvC(_dvSh(topC, -0.12)));
  _dvTrace(P, G, 0);
  ctx.fillStyle = gT;
  ctx.fill();

  // 帯（外周側28%）は天面でクリップしてから敷く
  if (bandC && o.bandQuad && o.bandQuad.length >= 4) {
    var BQ = [];
    for (var bi = 0; bi < 4; bi++) BQ.push({ x: o.bandQuad[bi].x, y: o.bandQuad[bi].y });
    var BG = _dvGeom(BQ);
    ctx.save();
    _dvTrace(P, G, 0);
    ctx.clip();
    _dvTrace(BQ, BG, 0);
    var bmT = { x: 0, y: 1e9 }, bmB = { x: 0, y: -1e9 };
    for (var bj = 0; bj < 4; bj++) {
      var bm = { x: (BQ[bj].x + BQ[(bj + 1) % 4].x) / 2, y: (BQ[bj].y + BQ[(bj + 1) % 4].y) / 2 };
      if (bm.y < bmT.y) bmT = bm;
      if (bm.y > bmB.y) bmB = bm;
    }
    var gB = ctx.createLinearGradient(bmT.x, bmT.y, bmB.x, bmB.y);
    gB.addColorStop(0, _dvC(_dvSh(bandC, 0.18)));
    gB.addColorStop(1, _dvC(_dvSh(bandC, -0.14)));
    ctx.fillStyle = gB;
    ctx.fill();
    // 帯の内側（マス中心に最も近い辺）に細い暗線を1本
    var innerIdx = 0, innerD = 1e9;
    for (var bk = 0; bk < 4; bk++) {
      var mx2 = (BQ[bk].x + BQ[(bk + 1) % 4].x) / 2, my3 = (BQ[bk].y + BQ[(bk + 1) % 4].y) / 2;
      var d = (mx2 - cx) * (mx2 - cx) + (my3 - cy) * (my3 - cy);
      if (d < innerD) { innerD = d; innerIdx = bk; }
    }
    ctx.beginPath();
    ctx.moveTo(BQ[innerIdx].x, BQ[innerIdx].y);
    ctx.lineTo(BQ[(innerIdx + 1) % 4].x, BQ[(innerIdx + 1) % 4].y);
    ctx.strokeStyle = _dvC(_dvSh(bandC, -0.45), 0.75);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // 光沢：上半分だけ白を薄く重ねる
  ctx.save();
  _dvTrace(P, G, 0);
  ctx.clip();
  var gG = ctx.createLinearGradient(edges[topEdge].mx, edges[topEdge].my, edges[botEdge].mx, edges[botEdge].my);
  gG.addColorStop(0, 'rgba(255,255,255,' + (dim ? 0.05 : 0.15) + ')');
  gG.addColorStop(0.44, 'rgba(255,255,255,' + (dim ? 0.015 : 0.05) + ')');
  gG.addColorStop(0.56, 'rgba(255,255,255,0)');
  gG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gG;
  ctx.fill();
  // 上辺の白ハイライト／下辺のわずかな陰（クリップ内なので角の外へはみ出さない）
  var eT = edges[topEdge], eB = edges[botEdge];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(P[eT.i].x, P[eT.i].y);
  ctx.lineTo(P[(eT.i + 1) % 4].x, P[(eT.i + 1) % 4].y);
  ctx.strokeStyle = 'rgba(255,255,255,' + (dim ? 0.28 : 0.6) + ')';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(P[eB.i].x, P[eB.i].y);
  ctx.lineTo(P[(eB.i + 1) % 4].x, P[(eB.i + 1) % 4].y);
  ctx.strokeStyle = 'rgba(12,20,40,0.22)';
  ctx.stroke();
  ctx.restore();

  // 縁のベベル線（1〜2px）
  _dvTrace(P, G, 0);
  ctx.strokeStyle = _dvC(_dvSh(topC, 0.4), dim ? 0.3 : 0.55);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  _dvTrace(P, G, 0);
  ctx.strokeStyle = _dvC(_dvSh(sideC, -0.35), 0.35);
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ---------- 4) ハイライト発光（手番の目的地など） ----------
  if (glowC) {
    var pulse = 0.62 + 0.38 * Math.sin(T / 340);
    ctx.save();
    _dvTrace(P, G, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = _dvC(glowC, 0.07 * pulse);
    ctx.fill();
    ctx.shadowColor = _dvC(glowC, 0.9);
    ctx.shadowBlur = 14;
    ctx.strokeStyle = _dvC(_dvSh(glowC, 0.35), 0.75 * pulse);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/* ───── a961cd14c4422d818 ───── */
function dvSlab(ctx, outer, inner, cols, T) {
  if (!ctx || !outer || !inner || outer.length < 4 || inner.length < 4) return;

  var _t = (typeof T === 'number' ? T : 0);
  var _c = cols || {};
  var TOP = _c.top || '#C2B8E2';
  var SIDE = _c.side || '#8E86B4';
  var RIM = _c.rim || '#E2E8F2';
  var DEPTH = 26;          // 押し出し厚み（本家 L53 の側面とほぼ同じ）
  var i, j, k, e;

  // ---- 決定的擬似乱数（Math.random禁止のため）----
  function _dvRnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ---- 色ユーティリティ ----
  function _dvRgb(h) {
    var s = String(h || '#000000').replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var n = parseInt(s, 16);
    if (isNaN(n)) n = 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // amt>0 で白へ、amt<0 で黒へ寄せる
  function _dvSh(h, amt, a) {
    var c = _dvRgb(h), o = [0, 0, 0], q;
    for (q = 0; q < 3; q++) o[q] = amt >= 0 ? Math.round(c[q] + (255 - c[q]) * amt) : Math.round(c[q] * (1 + amt));
    return 'rgba(' + o[0] + ',' + o[1] + ',' + o[2] + ',' + (a === undefined ? 1 : a) + ')';
  }

  // ---- 幾何ユーティリティ ----
  function _dvCen(p) { var x = 0, y = 0, q; for (q = 0; q < 4; q++) { x += p[q].x; y += p[q].y; } return { x: x / 4, y: y / 4 }; }
  function _dvL(p, q, u) { return { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u }; }
  function _dvIns(p, c, d) {
    var dx = c.x - p.x, dy = c.y - p.y, m = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: p.x + dx / m * d, y: p.y + dy / m * d };
  }
  function _dvSub(pts, dy) { // beginPathせずサブパスだけ足す（even-odd用）
    var q, o = dy || 0;
    ctx.moveTo(pts[0].x, pts[0].y + o);
    for (q = 1; q < pts.length; q++) ctx.lineTo(pts[q].x, pts[q].y + o);
    ctx.closePath();
  }
  function _dvPoly(pts, dy) { ctx.beginPath(); _dvSub(pts, dy); }

  var OC = _dvCen(outer), IC = _dvCen(inner);

  // 内周の頂点順が外周とズレていても装飾が破綻しないよう、角度で対応付ける
  var IN = [];
  for (k = 0; k < 4; k++) {
    var ang = Math.atan2(outer[k].y - OC.y, outer[k].x - OC.x), best = 0, bd = 1e9;
    for (j = 0; j < 4; j++) {
      var a2 = Math.atan2(inner[j].y - IC.y, inner[j].x - IC.x);
      var dd = Math.abs(((a2 - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (dd < bd) { bd = dd; best = j; }
    }
    IN.push(inner[best]);
  }

  var minY = Infinity, maxY = -Infinity;
  for (i = 0; i < 4; i++) { if (outer[i].y < minY) minY = outer[i].y; if (outer[i].y > maxY) maxY = outer[i].y; }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ============ 1. 側面下端の濃紺の落ち影（最背面） ============
  for (e = 0; e < 4; e++) {
    var s0 = outer[e], s1 = outer[(e + 1) % 4];
    var mx = (s0.x + s1.x) / 2, my = (s0.y + s1.y) / 2;
    if (my <= OC.y + 0.5) continue;                 // 下向きの辺だけ
    var sy = my + DEPTH;
    var gS = ctx.createLinearGradient(mx, sy, mx, sy + 22);
    gS.addColorStop(0, 'rgba(10,18,48,0.55)');
    gS.addColorStop(0.5, 'rgba(10,18,48,0.22)');
    gS.addColorStop(1, 'rgba(10,18,48,0)');
    ctx.fillStyle = gS;
    ctx.beginPath();
    ctx.moveTo(s0.x, s0.y + DEPTH);
    ctx.lineTo(s1.x, s1.y + DEPTH);
    ctx.lineTo(s1.x + 6, s1.y + DEPTH + 20);
    ctx.lineTo(s0.x - 6, s0.y + DEPTH + 20);
    ctx.closePath();
    ctx.fill();
  }

  // ============ 2. 押し出し側面（手前下向きの面だけ） ============
  for (e = 0; e < 4; e++) {
    var a = outer[e], b = outer[(e + 1) % 4];
    var ex = b.x - a.x, ey = b.y - a.y;
    var nx = ey, ny = -ex;                           // 法線候補
    var cx = (a.x + b.x) / 2 - OC.x, cy = (a.y + b.y) / 2 - OC.y;
    if (nx * cx + ny * cy < 0) { nx = -nx; ny = -ny; } // 外向きに揃える
    var nl = Math.sqrt(nx * nx + ny * ny) || 1; nx /= nl; ny /= nl;
    if (ny <= 0.05) continue;                        // 上向きの面は見えない

    var dark = nx < 0;                               // 左下向きの面は一段暗く
    var my2 = (a.y + b.y) / 2;
    var gF = ctx.createLinearGradient(0, my2, 0, my2 + DEPTH);
    gF.addColorStop(0, _dvSh(SIDE, dark ? -0.28 : 0.14));
    gF.addColorStop(0.40, _dvSh(SIDE, dark ? -0.48 : -0.04));
    gF.addColorStop(1, _dvSh(SIDE, dark ? -0.70 : -0.44));
    ctx.fillStyle = gF;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + DEPTH); ctx.lineTo(a.x, a.y + DEPTH);
    ctx.closePath();
    ctx.fill();

    // 側面の縦リブ（本家の押し出し面に見える等間隔の割り）
    var flen = Math.sqrt(ex * ex + ey * ey);
    var rn = Math.max(4, Math.round(flen / 46));
    ctx.lineWidth = 1;
    ctx.strokeStyle = _dvSh(SIDE, -0.45, 0.35);
    ctx.beginPath();
    for (k = 1; k < rn; k++) {
      var p = _dvL(a, b, k / rn);
      ctx.moveTo(p.x, p.y + 4); ctx.lineTo(p.x, p.y + DEPTH - 2);
    }
    ctx.stroke();
    ctx.strokeStyle = _dvSh(RIM, 0, 0.16);
    ctx.beginPath();
    for (k = 1; k < rn; k++) {
      var p2 = _dvL(a, b, k / rn);
      ctx.moveTo(p2.x + 1, p2.y + 4); ctx.lineTo(p2.x + 1, p2.y + DEPTH - 2);
    }
    ctx.stroke();

    // 側面の底エッジ（濃紺のキワ）
    ctx.strokeStyle = 'rgba(22,30,66,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(a.x, a.y + DEPTH); ctx.lineTo(b.x, b.y + DEPTH); ctx.stroke();
  }

  // ============ 3. 天面リング（even-odd）縦グラデ：上辺が暗く下辺が明るい ============
  var gT = ctx.createLinearGradient(0, minY, 0, maxY);
  gT.addColorStop(0, _dvSh(TOP, -0.40));
  gT.addColorStop(0.26, _dvSh(TOP, -0.20));
  gT.addColorStop(0.58, _dvSh(TOP, -0.02));
  gT.addColorStop(0.86, _dvSh(TOP, 0.13));
  gT.addColorStop(1, _dvSh(TOP, 0.18));
  ctx.beginPath(); _dvSub(outer, 0); _dvSub(IN, 0);
  ctx.fillStyle = gT;
  ctx.fill('evenodd');

  // 天面の奥側だけさらに沈める（奥行き感）
  var gD = ctx.createLinearGradient(0, minY, 0, minY + (maxY - minY) * 0.55);
  gD.addColorStop(0, 'rgba(52,44,104,0.42)');
  gD.addColorStop(1, 'rgba(52,44,104,0)');
  ctx.beginPath(); _dvSub(outer, 0); _dvSub(IN, 0);
  ctx.fillStyle = gD;
  ctx.fill('evenodd');

  // ============ 4. リングに沿う繰り返し装飾（二重線＋等間隔の短い溝＋鋲） ============
  var sweep = ((_t / 4600) % 1 + 1) % 1;             // ゆっくり一周する光の帯（Tのみ使用）
  // リングに沿う一本線（外周比 r の位置を辺の端から端まで引く）
  var _dvBand = function (pA0, pA1, pB0, pB1, r, style, w) {
    var pA = _dvL(pA0, pA1, r), pB = _dvL(pB0, pB1, r);
    ctx.strokeStyle = style; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.stroke();
  };
  for (e = 0; e < 4; e++) {
    var o0 = outer[e], o1 = outer[(e + 1) % 4], i0 = IN[e], i1 = IN[(e + 1) % 4];

    // --- 二重線（外寄りの明線＋その内側の暗線）---
    _dvBand(o0, i0, o1, i1, 0.12, _dvSh(RIM, 0, 0.55), 1.6);
    _dvBand(o0, i0, o1, i1, 0.175, _dvSh(TOP, -0.42, 0.45), 1);
    _dvBand(o0, i0, o1, i1, 0.80, _dvSh(TOP, -0.38, 0.35), 1);
    _dvBand(o0, i0, o1, i1, 0.855, _dvSh(RIM, 0, 0.40), 1.2);

    // --- 等間隔の短い溝 ---
    var elen = Math.sqrt((o1.x - o0.x) * (o1.x - o0.x) + (o1.y - o0.y) * (o1.y - o0.y));
    var n = Math.max(6, Math.round(elen / 34));

    // 溝は暗線・明線をそれぞれ1パスにまとめて描く（stroke呼び出し削減）
    ctx.lineWidth = 3;
    ctx.strokeStyle = _dvSh(TOP, -0.46, 0.42);
    ctx.beginPath();
    for (k = 0; k < n; k++) {
      var u2 = (k + 0.5) / n;
      var po = _dvL(o0, o1, u2), pi = _dvL(i0, i1, u2);
      var gA = _dvL(po, pi, 0.26), gB = _dvL(po, pi, 0.37);
      var jit = (_dvRnd(e * 17 + k) - 0.5) * 0.6;    // ごく僅かな不揃い（決定的）
      ctx.moveTo(gA.x + jit, gA.y); ctx.lineTo(gB.x + jit, gB.y);
    }
    ctx.stroke();

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = _dvSh(RIM, 0, 0.5);
    ctx.beginPath();
    for (k = 0; k < n; k++) {
      var u3 = (k + 0.5) / n;
      var po2 = _dvL(o0, o1, u3), pi2 = _dvL(i0, i1, u3);
      var hA = _dvL(po2, pi2, 0.26), hB = _dvL(po2, pi2, 0.37);
      var jit2 = (_dvRnd(e * 17 + k) - 0.5) * 0.6;
      ctx.moveTo(hA.x + 1.4 + jit2, hA.y - 0.8); ctx.lineTo(hB.x + 1.4 + jit2, hB.y - 0.8);
    }
    ctx.stroke();

    // --- 鋲（2つおき）。影は一括、頭は光の帯が通るときだけ明るくなる ---
    ctx.fillStyle = _dvSh(TOP, -0.50, 0.35);
    ctx.beginPath();
    for (k = 0; k < n; k += 2) {
      var u4 = (k + 0.5) / n;
      var sp = _dvL(_dvL(o0, o1, u4), _dvL(i0, i1, u4), 0.62);
      var r0 = 2.8 + _dvRnd(e * 31 + k) * 0.5;
      ctx.moveTo(sp.x + r0, sp.y + 1); ctx.arc(sp.x, sp.y + 1, r0, 0, Math.PI * 2);
    }
    ctx.fill();
    for (k = 0; k < n; k += 2) {
      var u5 = (k + 0.5) / n;
      var st = _dvL(_dvL(o0, o1, u5), _dvL(i0, i1, u5), 0.62);
      var dif = Math.abs(((((e + u5) / 4 - sweep) % 1) + 1.5) % 1 - 0.5);
      var glow = Math.max(0, 1 - dif / 0.09);
      var rr = 2.0 + _dvRnd(e * 31 + k) * 0.5;
      ctx.fillStyle = _dvSh(RIM, 0.25 * glow, 0.55 + 0.40 * glow);
      ctx.beginPath(); ctx.arc(st.x, st.y, rr, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ============ 5. 外周の面取り（明るい細い縁） ============
  var bev2 = [];
  for (i = 0; i < 4; i++) bev2.push(_dvIns(outer[i], OC, 7));   // 面取り幅7px
  ctx.beginPath(); _dvSub(outer, 0); _dvSub(bev2, 0);
  var gB2 = ctx.createLinearGradient(0, minY, 0, maxY);
  gB2.addColorStop(0, _dvSh(RIM, -0.22, 0.85));
  gB2.addColorStop(0.55, _dvSh(RIM, 0.05, 0.95));
  gB2.addColorStop(1, _dvSh(RIM, 0.35, 1));
  ctx.fillStyle = gB2;
  ctx.fill('evenodd');

  ctx.strokeStyle = _dvSh(RIM, 0.55, 0.95); ctx.lineWidth = 1.2;
  _dvPoly(outer, 0); ctx.stroke();                       // 一番外のハイライト
  ctx.strokeStyle = _dvSh(SIDE, -0.35, 0.55); ctx.lineWidth = 1;
  _dvPoly(bev2, 0); ctx.stroke();                        // 面取りの内側の落ち込み

  // ============ 6. 内周（湖側）の細い明るい縁＋落ち込み ============
  var lip = [];
  for (i = 0; i < 4; i++) lip.push(_dvIns(IN[i], IC, -5));  // 天面側へ5px広げた線
  ctx.beginPath(); _dvSub(lip, 0); _dvSub(IN, 0);
  var gI = ctx.createLinearGradient(0, minY, 0, maxY);
  gI.addColorStop(0, _dvSh(RIM, -0.10, 0.75));
  gI.addColorStop(1, _dvSh(RIM, 0.30, 0.90));
  ctx.fillStyle = gI;
  ctx.fill('evenodd');

  ctx.strokeStyle = _dvSh(RIM, 0.45, 0.9); ctx.lineWidth = 1.4;
  _dvPoly(IN, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,44,88,0.45)'; ctx.lineWidth = 2;
  _dvPoly(IN, 2.5); ctx.stroke();                        // 湖へ落ちる影

  ctx.restore();
}

/* ───── aced04bfa7f680dec ───── */
function dvLake(ctx, pts, cols, T, label, sub){
  if(!ctx || !pts || pts.length < 4) return;

  // ===== 小道具（すべて dvL_ 接頭辞・関数内に閉じる） =====
  function dvL_rnd(i){ const x = Math.sin(i*127.1+311.7)*43758.5453; return x - Math.floor(x); }
  function dvL_hex(h){
    h = String(h||'#000000').replace('#','');
    if(h.length===3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    const n = parseInt(h,16)||0;
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  function dvL_mix(h1,h2,t){
    const a=dvL_hex(h1), b=dvL_hex(h2);
    return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  }
  function dvL_rgb(c){ return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')'; }
  function dvL_rgba(c,a){ return 'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+a+')'; }

  // 明・中・暗（未指定なら本家 L53 の氷の洞窟から実測した色）
  const CL = (cols && cols[0]) || '#9EE4F2';  // 中心の明るい水色
  const CM = (cols && cols[1]) || '#6FC5D8';  // 中間
  const CD = (cols && cols[2]) || '#3E9EB3';  // 外周の沈んだ色
  const cL = dvL_hex(CL), cM = dvL_hex(CM), cD = dvL_hex(CD);

  const p0=pts[0], p1=pts[1], p2=pts[2], p3=pts[3];

  // ひし形の内側を uv(0..1) で扱う。遠近の付いた盤でも模様が水面に寝てくれる
  function dvL_uv(u,v){
    const ax = p0.x+(p1.x-p0.x)*u, ay = p0.y+(p1.y-p0.y)*u;
    const bx = p3.x+(p2.x-p3.x)*u, by = p3.y+(p2.y-p3.y)*u;
    return { x: ax+(bx-ax)*v, y: ay+(by-ay)*v };
  }
  function dvL_path(){
    ctx.beginPath();
    ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y);
    ctx.lineTo(p2.x,p2.y); ctx.lineTo(p3.x,p3.y);
    ctx.closePath();
  }

  const cx=(p0.x+p1.x+p2.x+p3.x)/4, cy=(p0.y+p1.y+p2.y+p3.y)/4;
  let R=0, minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
  for(let i=0;i<4;i++){
    const d=Math.hypot(pts[i].x-cx, pts[i].y-cy); if(d>R) R=d;
    if(pts[i].x<minX) minX=pts[i].x; if(pts[i].x>maxX) maxX=pts[i].x;
    if(pts[i].y<minY) minY=pts[i].y; if(pts[i].y>maxY) maxY=pts[i].y;
  }
  const spanX = Math.max(1, maxX-minX);
  const spanY = Math.max(1, maxY-minY);
  if(R<=0) return;

  ctx.save();
  dvL_path();
  ctx.clip();

  // ひし形は横長なので、グラデも同じ比率に潰して使う（真円だと上下の縁が暗くならない）
  function dvL_ellipseFill(stops, cyOff, r0, r1){
    ctx.save();
    ctx.translate(cx, cy + spanY*(cyOff||0));
    ctx.scale(spanX*0.5, spanY*0.5);
    const gr = ctx.createRadialGradient(0,0,r0, 0,0,r1);
    for(let i=0;i<stops.length;i++) gr.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle=gr; ctx.fillRect(-2.4,-2.4,4.8,4.8);
    ctx.restore();
  }

  // ===== 1. 土台：中心が明るい放射グラデ（外周に向かって沈む） =====
  dvL_ellipseFill([
    [0.00, dvL_rgb(dvL_mix(CL,'#FFFFFF',0.16))],
    [0.22, dvL_rgb(cL)],
    [0.48, dvL_rgb(dvL_mix(CL,CM,0.55))],
    [0.72, dvL_rgb(cM)],
    [0.90, dvL_rgb(dvL_mix(CM,CD,0.72))],
    [1.00, dvL_rgb(cD)]
  ], -0.04, 0.03, 1.02);

  // ===== 2. 奥→手前の照り（手前の水面がわずかに明るい） =====
  const farM  = { x:(p0.x+p1.x)/2, y:(p0.y+p1.y)/2 };
  const nearM = { x:(p2.x+p3.x)/2, y:(p2.y+p3.y)/2 };
  const gs = ctx.createLinearGradient(farM.x, farM.y, nearM.x, nearM.y);
  gs.addColorStop(0, 'rgba(255,255,255,0)');
  gs.addColorStop(1, 'rgba(255,255,255,0.07)');
  ctx.fillStyle=gs; ctx.fillRect(minX-2, minY-2, spanX+4, spanY+4);

  // ===== 3. 乳白色のもや（氷の霞） =====
  dvL_ellipseFill([
    [0.00,'rgba(255,255,255,0.10)'],
    [0.55,'rgba(255,255,255,0.035)'],
    [1.00,'rgba(255,255,255,0)']
  ], 0, 0, 0.66);

  // ===== 4. 乳白色の渦（決定的な数式・T でゆっくり回る） =====
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(let i=0;i<10;i++){
    const uc  = 0.14 + dvL_rnd(i*3+1)*0.72;
    const vc  = 0.12 + dvL_rnd(i*3+2)*0.76;
    const rad = 0.085 + dvL_rnd(i*3+3)*0.135;
    const ph  = dvL_rnd(i+41)*6.2832;
    const spin= (0.55 + dvL_rnd(i+71)*0.9) * (dvL_rnd(i+91)<0.5 ? -1 : 1);
    const rot = T*0.000045*spin + ph;
    ctx.beginPath();
    for(let k=0;k<=54;k++){
      const th = k/54*6.2832;
      const rr = rad*(1 + 0.34*Math.sin(3*th+rot) + 0.18*Math.sin(5*th-rot*1.7) + 0.09*Math.sin(7*th+ph));
      const q = dvL_uv(uc + Math.cos(th)*rr*1.15, vc + Math.sin(th)*rr*0.85);
      if(k) ctx.lineTo(q.x,q.y); else ctx.moveTo(q.x,q.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,'+(0.030+dvL_rnd(i+111)*0.035).toFixed(3)+')';
    ctx.fill();
    ctx.lineWidth = Math.max(1, R*(0.005+dvL_rnd(i+121)*0.012));
    ctx.strokeStyle = 'rgba(255,255,255,'+(0.070+dvL_rnd(i+151)*0.075).toFixed(3)+')';
    ctx.stroke();
  }

  // ===== 5. 氷の割れ目（細い白のひび） =====
  for(let i=0;i<8;i++){
    let u = 0.08 + dvL_rnd(i*5+201)*0.82;
    let v = 0.08 + dvL_rnd(i*5+202)*0.82;
    let a = dvL_rnd(i*5+203)*6.2832;
    const seg = (0.045 + dvL_rnd(i*5+204)*0.045);
    ctx.beginPath();
    const s0 = dvL_uv(u,v); ctx.moveTo(s0.x, s0.y);
    for(let k=1;k<=5;k++){
      a += (dvL_rnd(i*17+k+301)-0.5)*1.4;
      u += Math.cos(a)*seg; v += Math.sin(a)*seg*0.78;
      const q = dvL_uv(u,v); ctx.lineTo(q.x,q.y);
    }
    ctx.lineWidth = Math.max(1, R*0.0035);
    ctx.strokeStyle = 'rgba(255,255,255,'+(0.07+dvL_rnd(i+331)*0.07).toFixed(3)+')';
    ctx.stroke();
  }

  // ===== 6. さざ波（横方向にゆっくり流れる） =====
  const flow = (T*0.00007) % 1;
  for(let i=0;i<11;i++){
    const v  = 0.07 + i*0.079 + dvL_rnd(i+391)*0.028;
    const u0 = dvL_rnd(i+401)*0.34;
    const u1 = Math.min(0.98, u0 + 0.30 + dvL_rnd(i+402)*0.52);
    const amp= (0.005 + 0.011*dvL_rnd(i+403)) * (0.45 + 0.55*Math.sin(Math.PI*v));
    const sp = 0.7 + dvL_rnd(i+431)*0.8;
    const A  = dvL_uv(u0,v), B = dvL_uv(u1,v);
    for(let pass=0; pass<2; pass++){
      const a = pass ? 0.05 : (0.055 + dvL_rnd(i+461)*0.055);
      const base = pass ? dvL_mix(CD,'#00304A',0.5) : [255,255,255];
      // 両端が消えるよう線自体をグラデにする（定規で引いた線に見せないため）
      const gl = ctx.createLinearGradient(A.x,A.y,B.x,B.y);
      gl.addColorStop(0,    dvL_rgba(base,0));
      gl.addColorStop(0.30, dvL_rgba(base,a));
      gl.addColorStop(0.70, dvL_rgba(base,a));
      gl.addColorStop(1,    dvL_rgba(base,0));
      ctx.beginPath();
      for(let k=0;k<=44;k++){
        const u  = u0 + (u1-u0)*k/44;
        const th = u*7.0 + flow*6.2832*sp + i*0.85;
        const vv = v + Math.sin(th)*amp + Math.sin(th*0.43+i)*amp*0.5 + (pass ? 0.007 : 0);
        const q  = dvL_uv(u, vv);
        if(k) ctx.lineTo(q.x,q.y); else ctx.moveTo(q.x,q.y);
      }
      ctx.lineWidth = Math.max(1, R*(pass?0.0045:0.0035));
      ctx.strokeStyle = gl;
      ctx.stroke();
    }
  }

  // ===== 7. 白いきらめき粒子（周期2〜3秒で .2↔.9 に明滅） =====
  for(let i=0;i<30;i++){
    const u = 0.05 + dvL_rnd(i*7+501)*0.90;
    const v = 0.05 + dvL_rnd(i*7+502)*0.90;
    const per = 2000 + dvL_rnd(i+521)*1000;
    const ph  = dvL_rnd(i+541)*6.2832;
    let k = 0.5 + 0.5*Math.sin(T/per*6.2832 + ph);
    k = k*k*k;                       // 明滅を鋭くして「またたき」にする
    const al = 0.2 + 0.7*k;
    const q = dvL_uv(u,v);
    const s = R*(0.008 + dvL_rnd(i+561)*0.014) * (0.5 + 0.5*k);
    // にじみ
    const gg = ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,s*2.6);
    gg.addColorStop(0,'rgba(255,255,255,'+(al*0.5).toFixed(3)+')');
    gg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gg;
    ctx.beginPath(); ctx.arc(q.x,q.y,s*2.6,0,6.2832); ctx.fill();
    // 4方向の星
    ctx.beginPath();
    ctx.moveTo(q.x, q.y-s);
    ctx.quadraticCurveTo(q.x, q.y, q.x+s*0.62, q.y);
    ctx.quadraticCurveTo(q.x, q.y, q.x, q.y+s);
    ctx.quadraticCurveTo(q.x, q.y, q.x-s*0.62, q.y);
    ctx.quadraticCurveTo(q.x, q.y, q.x, q.y-s);
    ctx.closePath();
    ctx.fillStyle='rgba(255,255,255,'+al.toFixed(3)+')';
    ctx.fill();
  }

  // ===== 8. 盤の縁からの落ち影（内側が暗い・奥ほど濃い） =====
  const shadeC = dvL_mix(CD, '#001E30', 0.58);
  // ひし形の形に沿って外周だけ沈ませる（辺ごとに4枚貼ると角に継ぎ目が出るので1枚で）
  dvL_ellipseFill([
    [0.00, dvL_rgba(shadeC,0)],
    [0.50, dvL_rgba(shadeC,0.03)],
    [0.78, dvL_rgba(shadeC,0.16)],
    [0.93, dvL_rgba(shadeC,0.34)],
    [1.00, dvL_rgba(shadeC,0.50)]
  ], 0, 0.18, 1.05);

  // 奥側の壁からの落ち影を上乗せ（奥が暗く手前が明るい）
  const gd = ctx.createLinearGradient(farM.x, farM.y, nearM.x, nearM.y);
  gd.addColorStop(0,    dvL_rgba(shadeC,0.22));
  gd.addColorStop(0.38, dvL_rgba(shadeC,0.03));
  gd.addColorStop(1,    dvL_rgba(shadeC,0));
  ctx.fillStyle=gd; ctx.fillRect(minX-2, minY-2, spanX+4, spanY+4);

  // 水際の白い泡立ち（奥の辺ほど強い）
  const eys=[];
  for(let e=0;e<4;e++){ const A=pts[e],B=pts[(e+1)%4]; eys.push((A.y+B.y)/2); }
  const yLo=Math.min.apply(null,eys), yHi=Math.max.apply(null,eys);
  for(let e=0;e<4;e++){
    const A=pts[e], B=pts[(e+1)%4];
    const t = (yHi-yLo) > 0.001 ? (eys[e]-yLo)/(yHi-yLo) : 0.5;
    ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y);
    ctx.lineWidth=Math.max(1,R*0.007);
    ctx.strokeStyle='rgba(226,246,255,'+(0.07+0.13*(1-t)).toFixed(3)+')';
    ctx.stroke();
  }

  // ===== 9. 中央の透かしロゴ =====
  if(label){
    let fs = spanX*0.050;
    ctx.font = '900 '+fs.toFixed(1)+'px "Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
    const w = ctx.measureText(label).width;
    if(w > spanX*0.44 && w > 0) fs *= (spanX*0.44)/w;   // 長い名前でもはみ出さない
    const ty = cy - fs*0.12;

    ctx.save();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.translate(cx, ty);
    ctx.transform(1,0,-0.085,1,0,0);                    // わずかに斜体
    ctx.font = '900 '+fs.toFixed(1)+'px "Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
    ctx.shadowColor = 'rgba(210,210,210,0.30)';         // 外側のにじみ
    ctx.shadowBlur  = fs*0.30;
    ctx.lineJoin='round'; ctx.miterLimit=2;
    ctx.lineWidth = fs*0.20;
    ctx.strokeStyle = 'rgba(190,190,190,0.16)';         // #7FD9F0 の太縁
    ctx.strokeText(label, 0, 0);
    ctx.shadowBlur = 0;
    ctx.lineWidth = fs*0.12;
    ctx.strokeStyle = 'rgba(200,200,200,0.20)';
    ctx.strokeText(label, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillText(label, 0, 0);
    ctx.restore();

    if(sub){
      const fs2 = fs*0.42;
      ctx.save();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.translate(cx, ty + fs*0.86);
      ctx.transform(1,0,-0.085,1,0,0);
      ctx.font = '700 '+fs2.toFixed(1)+'px "Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
      ctx.lineJoin='round'; ctx.miterLimit=2;
      ctx.lineWidth = fs2*0.26;
      ctx.strokeStyle = 'rgba(200,200,200,0.22)';
      ctx.strokeText(sub, 0, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillText(sub, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

/* ───── a5c2ce72a34f6c5c0 ───── */
/* ===== 建物4段階（氷の洞窟トーン） 共通ヘルパーは接頭辞 _dv ===== */

// 決定的な擬似乱数（毎フレーム同じ絵にするため、時刻や乱数関数は使わない）
function _dvRnd(i){ const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// hex → rgb 配列
function _dvRgb(hex){
  let h = String(hex == null ? '#6cc6ff' : hex).replace('#', '').trim();
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const n = parseInt(h, 16);
  if (!isFinite(n)) return [108, 198, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function _dvCss(c, a){ return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }
// l>0 で白へ、l<0 で黒へ寄せる
function _dvTone(hex, l, a){
  const c = _dvRgb(hex), o = [0,0,0];
  for (let i = 0; i < 3; i++) o[i] = l >= 0 ? c[i] + (255 - c[i]) * l : c[i] * (1 + l);
  return _dvCss(o, a);
}
// 2色の混合（氷色へ寄せる用）
function _dvMix(hex, hex2, t, a){
  const c = _dvRgb(hex), d = _dvRgb(hex2), o = [0,0,0];
  for (let i = 0; i < 3; i++) o[i] = c[i] + (d[i] - c[i]) * t;
  return _dvCss(o, a);
}
// 上と同じ計算で hex を返す版（結果をさらに調色したい時に使う）
function _dvHex(c){
  let s = '#';
  for (let i = 0; i < 3; i++){
    const v = Math.max(0, Math.min(255, Math.round(c[i]))).toString(16);
    s += v.length < 2 ? '0' + v : v;
  }
  return s;
}
function _dvToneHex(hex, l){
  const c = _dvRgb(hex), o = [0,0,0];
  for (let i = 0; i < 3; i++) o[i] = l >= 0 ? c[i] + (255 - c[i]) * l : c[i] * (1 + l);
  return _dvHex(o);
}
function _dvMixHex(hex, hex2, t){
  const c = _dvRgb(hex), d = _dvRgb(hex2), o = [0,0,0];
  for (let i = 0; i < 3; i++) o[i] = c[i] + (d[i] - c[i]) * t;
  return _dvHex(o);
}
// 横グラデ（左＝明・右＝暗の面光源を作る）
function _dvHG(ctx, x0, x1, c0, c1){
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
}
// 縦グラデ
function _dvVG(ctx, y0, y1, c0, c1){
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
}
function _dvRR(ctx, x, y, w, h, r){
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
// 接地部の濃い落ち影（本家はどの建物にもこれが入る）
function _dvShadow(ctx, rx, ry, a){
  ctx.save();
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
  g.addColorStop(0, 'rgba(4,10,26,' + a + ')');
  g.addColorStop(0.55, 'rgba(4,10,26,' + (a * 0.55) + ')');
  g.addColorStop(1, 'rgba(4,10,26,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// 等角の箱：正面（明）＋右面（暗）＋上面（中）＋濃色の輪郭
function _dvBox(ctx, cx, yb, w, h, d, cF, cR, cT, line){
  const l = cx - w / 2, r = cx + w / 2, t = yb - h;
  const dx = d * 0.62, dy = -d * 0.42;
  ctx.lineJoin = 'round'; ctx.lineWidth = 1;
  // 上面
  ctx.beginPath(); ctx.moveTo(l, t); ctx.lineTo(l + dx, t + dy); ctx.lineTo(r + dx, t + dy); ctx.lineTo(r, t); ctx.closePath();
  ctx.fillStyle = cT; ctx.fill(); if (line){ ctx.strokeStyle = line; ctx.stroke(); }
  // 右面（影側）
  ctx.beginPath(); ctx.moveTo(r, t); ctx.lineTo(r + dx, t + dy); ctx.lineTo(r + dx, yb + dy); ctx.lineTo(r, yb); ctx.closePath();
  ctx.fillStyle = cR; ctx.fill(); if (line){ ctx.strokeStyle = line; ctx.stroke(); }
  // 正面
  ctx.beginPath(); ctx.rect(l, t, w, h);
  ctx.fillStyle = cF; ctx.fill(); if (line){ ctx.strokeStyle = line; ctx.stroke(); }
}
// 左端のリムライト（氷の洞窟の青い環境光）
function _dvRim(ctx, x, yTop, yBot, a){
  ctx.save();
  ctx.strokeStyle = 'rgba(190,235,255,' + a + ')'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yBot); ctx.stroke();
  ctx.restore();
}
// 窓の光をまとめて1回のshadowBlurで描く
function _dvGlowFill(ctx, pathFn, fill, glow, blur){
  ctx.save();
  ctx.shadowColor = glow; ctx.shadowBlur = blur;
  ctx.fillStyle = fill;
  pathFn();
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.restore();
}

/* ---------- 別荘：小さな切妻の家（高さ約42px） ---------- */
function dvVilla(ctx, col, T){
  ctx.save();
  const line = _dvMix(col, '#07121f', 0.80, 0.95);
  const wallL = _dvMix(col, '#f4f9ff', 0.80);   // 左＝明るい漆喰
  const wallR = _dvMix(col, '#20364e', 0.42);   // 右＝影
  const roofR = _dvTone(col, -0.34);

  _dvShadow(ctx, 20, 7, 0.62);

  // 石の土台（雪をかぶった基壇）
  _dvBox(ctx, 0, 0, 32, 5, 7,
    _dvHG(ctx, -16, 16, '#b9cbdc', '#6d8298'),
    '#55697f', '#d7e6f3', line);

  // 本体（壁）
  _dvBox(ctx, 0, -5, 26, 19, 6,
    _dvHG(ctx, -13, 13, wallL, wallR),
    _dvMix(col, '#16283c', 0.55), _dvMix(col, '#e6f2ff', 0.62), line);

  // 木組みの横桟（ロッジ感）
  ctx.strokeStyle = _dvMix(col, '#0d1d2e', 0.62, 0.55); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-13, -14.5); ctx.lineTo(13, -14.5); ctx.stroke();

  // 切妻屋根：右斜面（影）
  const ax = 0, ay = -38, el = -16, er = 16, ey = -24, dx = 6 * 0.62, dy = -6 * 0.42;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dx, ay + dy); ctx.lineTo(er + dx, ey + dy); ctx.lineTo(er, ey); ctx.closePath();
  ctx.fillStyle = roofR; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  // 切妻屋根：正面三角（明）
  ctx.beginPath(); ctx.moveTo(el, ey); ctx.lineTo(ax, ay); ctx.lineTo(er, ey); ctx.closePath();
  ctx.fillStyle = _dvHG(ctx, el, er, _dvTone(col, 0.44), _dvTone(col, -0.10)); ctx.fill(); ctx.stroke();
  // 左斜面の雪（氷の洞窟なので棟に積雪）
  ctx.beginPath(); ctx.moveTo(el, ey); ctx.lineTo(ax, ay); ctx.lineTo(ax, ay + 4.5); ctx.lineTo(el + 4.5, ey); ctx.closePath();
  ctx.fillStyle = 'rgba(236,247,255,0.88)'; ctx.fill();
  // 棟のハイライト
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(el + 1, ey - 1); ctx.lineTo(ax, ay + 1); ctx.stroke();

  // 破風の板（ペディメント）
  ctx.strokeStyle = _dvTone(col, -0.55); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(el - 1, ey + 1); ctx.lineTo(ax, ay - 1); ctx.lineTo(er + 1, ey + 1); ctx.stroke();

  // 煙突（右屋根の上）
  const chX = 8.5, chY = -38 + (chX / 16) * 14;
  _dvBox(ctx, chX, chY, 5, 12, 4, _dvHG(ctx, chX - 2.5, chX + 2.5, '#9fb2c6', '#5d7188'), '#4a5d73', '#d3e3f2', line);
  // 煙（Tで決定的に流す）
  ctx.save();
  for (let i = 0; i < 3; i++){
    const ph = ((T * 0.00035) + i * 0.34) % 1;
    ctx.globalAlpha = (1 - ph) * 0.32;
    ctx.fillStyle = '#e8f4ff';
    ctx.beginPath(); ctx.arc(chX + Math.sin(ph * 3.4 + i) * 3, chY - 13 - ph * 12, 1.6 + ph * 3.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.restore();

  // ドア（暖色の光が漏れる）
  ctx.fillStyle = _dvTone(col, -0.62); _dvRR(ctx, -3.6, -16, 7.2, 11, 3); ctx.fill();
  ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  _dvGlowFill(ctx, function(){ _dvRR(ctx, -2.4, -14.4, 4.8, 9.4, 2.2); }, 'rgba(255,226,160,0.92)', 'rgba(255,196,96,0.9)', 6);

  // 窓（左右2つ・格子入り）
  _dvGlowFill(ctx, function(){
    ctx.beginPath();
    ctx.rect(-10.5, -21, 5.4, 5.4);
    ctx.rect(5.1, -21, 5.4, 5.4);
  }, 'rgba(255,232,176,0.95)', 'rgba(255,190,90,0.85)', 7);
  ctx.strokeStyle = _dvTone(col, -0.65); ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-7.8, -21); ctx.lineTo(-7.8, -15.6); ctx.moveTo(-10.5, -18.3); ctx.lineTo(-5.1, -18.3);
  ctx.moveTo(7.8, -21); ctx.lineTo(7.8, -15.6); ctx.moveTo(5.1, -18.3); ctx.lineTo(10.5, -18.3);
  ctx.stroke();

  _dvRim(ctx, -13, -24, -5, 0.5);
  ctx.restore();
}

/* ---------- ビル：中層タワー（高さ約72px） ---------- */
function dvTowerB(ctx, col, T){
  ctx.save();
  const line = _dvMix(col, '#07121f', 0.80, 0.95);
  const facL = _dvMix(col, '#eaf4ff', 0.52);
  const facR = _dvMix(col, '#12243a', 0.52);

  _dvShadow(ctx, 18, 6.5, 0.6);

  // 基壇
  _dvBox(ctx, 0, 0, 30, 5, 8,
    _dvHG(ctx, -15, 15, '#b4c6d8', '#687d93'), '#51657a', '#d5e5f3', line);

  // 低層部（エントランス）
  _dvBox(ctx, 0, -5, 26, 8, 7,
    _dvHG(ctx, -13, 13, _dvTone(col, 0.34), _dvTone(col, -0.22)),
    _dvTone(col, -0.44), _dvTone(col, 0.20), line);

  // 主塔
  _dvBox(ctx, 0, -13, 22, 34, 6,
    _dvHG(ctx, -11, 11, facL, facR),
    _dvMix(col, '#0e1e30', 0.60), _dvMix(col, '#dcecfb', 0.55), line);

  // セットバック（中段）
  _dvBox(ctx, 0, -47, 16, 15, 5,
    _dvHG(ctx, -8, 8, facL, facR),
    _dvMix(col, '#0e1e30', 0.60), _dvMix(col, '#dcecfb', 0.55), line);

  // 塔屋
  _dvBox(ctx, 0, -62, 9, 6, 4,
    _dvHG(ctx, -4.5, 4.5, _dvTone(col, 0.40), _dvTone(col, -0.16)),
    _dvTone(col, -0.42), _dvTone(col, 0.30), line);

  // 冠のライン（所有者色の帯）
  ctx.fillStyle = _dvTone(col, 0.15);
  ctx.fillRect(-11, -48.6, 22, 2.2);
  ctx.fillRect(-8, -62.6, 16, 2);

  // 窓格子：正面（一部だけ点灯）
  const litFront = [];
  for (let r = 0; r < 7; r++){
    for (let c = 0; c < 4; c++){
      const i = r * 4 + c;
      const x = -9 + c * 4.6, y = -17 - r * 4.6;
      if (_dvRnd(i) > 0.42) litFront.push([x, y, i]);
      else { ctx.fillStyle = _dvMix(col, '#0a1726', 0.72); ctx.fillRect(x, y, 3.2, 3.2); }
    }
  }
  for (let r = 0; r < 3; r++){
    for (let c = 0; c < 3; c++){
      const i = 40 + r * 3 + c, x = -6.4 + c * 4.6, y = -50 - r * 4.4;
      if (_dvRnd(i) > 0.45) litFront.push([x, y, i]);
      else { ctx.fillStyle = _dvMix(col, '#0a1726', 0.72); ctx.fillRect(x, y, 3.2, 3.2); }
    }
  }
  // 点灯窓（明滅は T の正弦で決定的に）
  ctx.save();
  ctx.shadowColor = 'rgba(255,208,120,0.9)'; ctx.shadowBlur = 6;
  for (let k = 0; k < litFront.length; k++){
    const w = litFront[k];
    const b = 0.55 + 0.45 * Math.sin(T * 0.0012 + w[2] * 1.7);
    ctx.fillStyle = 'rgba(255,231,168,' + (0.45 + b * 0.5).toFixed(3) + ')';
    ctx.fillRect(w[0], w[1], 3.2, 3.2);
  }
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.restore();

  // 右面の窓（影側なので暗い）
  for (let r = 0; r < 7; r++){
    const wx = 12.3, wy = -17 - r * 4.6 - 0.9;
    ctx.fillStyle = _dvRnd(r + 200) > 0.62 ? 'rgba(255,222,150,0.5)' : _dvMix(col, '#000814', 0.6, 0.85);
    ctx.fillRect(wx, wy, 2.2, 3.0);
  }

  // アンテナ＋航空障害灯（明滅）
  ctx.strokeStyle = _dvTone(col, -0.55); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(0, -68); ctx.lineTo(0, -76); ctx.stroke();
  const blink = 0.35 + 0.65 * Math.abs(Math.sin(T * 0.0022));
  ctx.save();
  ctx.shadowColor = 'rgba(255,110,110,0.95)'; ctx.shadowBlur = 8 * blink;
  ctx.fillStyle = 'rgba(255,140,130,' + (0.5 + blink * 0.5).toFixed(3) + ')';
  ctx.beginPath(); ctx.arc(0, -77, 1.7, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.restore();

  // エントランスの灯り
  _dvGlowFill(ctx, function(){ _dvRR(ctx, -4.5, -11.5, 9, 6.5, 1.6); }, 'rgba(255,236,190,0.9)', 'rgba(255,200,110,0.85)', 6);

  _dvRim(ctx, -11, -47, -13, 0.45);
  _dvRim(ctx, -8, -62, -47, 0.4);
  ctx.restore();
}

/* ---------- ホテル：横に広い高層（高さ約88px） ---------- */
function dvHotel(ctx, col, T){
  ctx.save();
  const line = _dvMix(col, '#07121f', 0.80, 0.95);
  const facL = _dvMix(col, '#f0f7ff', 0.58);
  const dark = _dvMix(col, '#122238', 0.55);

  _dvShadow(ctx, 32, 9, 0.62);

  // 基壇（ポディウム）
  _dvBox(ctx, 0, 0, 58, 7, 10,
    _dvHG(ctx, -29, 29, '#bacce0', '#677c93'), '#4f6379', '#d8e8f6', line);

  // 左右のウイング（横に広いシルエットを作る）
  _dvBox(ctx, -22, -7, 14, 30, 6,
    _dvHG(ctx, -29, -15, facL, dark), _dvMix(col, '#0d1c2e', 0.6), _dvMix(col, '#e2f0ff', 0.55), line);
  _dvBox(ctx, 22, -7, 14, 34, 6,
    _dvHG(ctx, 15, 29, facL, dark), _dvMix(col, '#0d1c2e', 0.6), _dvMix(col, '#e2f0ff', 0.55), line);

  // 主棟
  _dvBox(ctx, 0, -7, 36, 47, 8,
    _dvHG(ctx, -18, 18, facL, dark), _dvMix(col, '#0d1c2e', 0.62), _dvMix(col, '#e2f0ff', 0.58), line);

  // バルコニーの横帯（ホテルらしさの決め手）
  for (let r = 0; r < 6; r++){
    const y = -12 - r * 7;
    ctx.fillStyle = _dvMix(col, '#07121f', 0.55, 0.55);
    ctx.fillRect(-18, y, 36, 3.4);
    // 帯の上のガラス（部屋の灯り）
    const lit = [];
    for (let c = 0; c < 6; c++){
      const i = r * 6 + c, x = -16.4 + c * 5.6;
      if (_dvRnd(i + 11) > 0.4) lit.push([x, y - 3.4, i]);
      else { ctx.fillStyle = _dvMix(col, '#0a1726', 0.7); ctx.fillRect(x, y - 3.4, 4.2, 3.4); }
    }
    ctx.save(); ctx.shadowColor = 'rgba(255,210,130,0.85)'; ctx.shadowBlur = 5;
    for (let k = 0; k < lit.length; k++){
      const w = lit[k], b = 0.55 + 0.45 * Math.sin(T * 0.001 + w[2] * 2.1);
      ctx.fillStyle = 'rgba(255,234,180,' + (0.45 + b * 0.5).toFixed(3) + ')';
      ctx.fillRect(w[0], w[1], 4.2, 3.4);
    }
    ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.restore();
    // 手すりのハイライト
    ctx.strokeStyle = 'rgba(226,242,255,0.4)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-18, y + 0.5); ctx.lineTo(18, y + 0.5); ctx.stroke();
  }
  // ウイングの窓
  ctx.fillStyle = _dvMix(col, '#0a1726', 0.68);
  for (let r = 0; r < 4; r++){
    ctx.fillRect(-27, -14 - r * 6.5, 3.6, 4);
    ctx.fillRect(-21.5, -14 - r * 6.5, 3.6, 4);
    ctx.fillRect(18, -14 - r * 6.5, 3.6, 4);
    ctx.fillRect(23.5, -14 - r * 6.5, 3.6, 4);
  }
  ctx.save(); ctx.shadowColor = 'rgba(255,210,130,0.8)'; ctx.shadowBlur = 5;
  for (let r = 0; r < 4; r++){
    if (_dvRnd(r + 60) > 0.45){ ctx.fillStyle = 'rgba(255,232,176,0.9)'; ctx.fillRect(-27, -14 - r * 6.5, 3.6, 4); }
    if (_dvRnd(r + 70) > 0.45){ ctx.fillStyle = 'rgba(255,232,176,0.9)'; ctx.fillRect(23.5, -14 - r * 6.5, 3.6, 4); }
  }
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.restore();

  // コーニス（軒）と屋上パラペット
  _dvBox(ctx, 0, -54, 40, 4, 9,
    _dvHG(ctx, -20, 20, _dvTone(col, 0.42), _dvTone(col, -0.12)),
    _dvTone(col, -0.4), _dvTone(col, 0.34), line);

  // 屋上の看板（支柱＋発光するフレーム＋文字バー）
  ctx.strokeStyle = _dvTone(col, -0.5); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-12, -58); ctx.lineTo(-12, -63); ctx.moveTo(12, -58); ctx.lineTo(12, -63); ctx.stroke();
  const sg = 0.6 + 0.4 * Math.sin(T * 0.0016);
  ctx.save();
  ctx.fillStyle = _dvMix(col, '#0b1726', 0.45);
  _dvRR(ctx, -17, -75, 34, 13, 3); ctx.fill();
  ctx.shadowColor = _dvTone(col, 0.25, 0.9); ctx.shadowBlur = 10 * sg;
  ctx.strokeStyle = _dvTone(col, 0.45, 0.6 + sg * 0.4); ctx.lineWidth = 1.8;
  _dvRR(ctx, -17, -75, 34, 13, 3); ctx.stroke();
  ctx.shadowBlur = 6 * sg; ctx.shadowColor = 'rgba(255,240,200,0.9)';
  ctx.fillStyle = 'rgba(255,244,214,' + (0.7 + sg * 0.3).toFixed(3) + ')';
  ctx.fillRect(-12, -71.5, 9, 2.4); ctx.fillRect(-1, -71.5, 13, 2.4); ctx.fillRect(-12, -67.4, 20, 2.4);
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.restore();

  // 屋上の尖塔（高さの頂点＝約-88）
  ctx.fillStyle = _dvTone(col, 0.35);
  ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(3.2, -76); ctx.lineTo(-3.2, -76); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  ctx.save();
  ctx.shadowColor = 'rgba(200,240,255,0.95)'; ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(236,250,255,0.95)';
  ctx.beginPath(); ctx.arc(0, -88.5, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.restore();

  // 玄関ホール（ガラス張り・暖色の光）
  ctx.fillStyle = _dvTone(col, -0.62); _dvRR(ctx, -11, -15, 22, 8, 1.5); ctx.fill();
  ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  _dvGlowFill(ctx, function(){ _dvRR(ctx, -9.6, -14.2, 19.2, 6.6, 1.2); }, 'rgba(255,231,178,0.82)', 'rgba(255,198,110,0.75)', 5);
  ctx.strokeStyle = _dvTone(col, -0.62, 0.8); ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-3.2, -14.2); ctx.lineTo(-3.2, -7.6); ctx.moveTo(3.2, -14.2); ctx.lineTo(3.2, -7.6);
  ctx.stroke();
  // 庇（キャノピー）：薄い板を前へ張り出させる
  ctx.fillStyle = _dvHG(ctx, -16, 16, _dvTone(col, 0.55), _dvTone(col, 0.02));
  ctx.beginPath(); ctx.moveTo(-16, -18.4); ctx.lineTo(16, -18.4); ctx.lineTo(14.5, -15.6); ctx.lineTo(-14.5, -15.6); ctx.closePath();
  ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = _dvTone(col, -0.5); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-14, -15.6); ctx.lineTo(-14, -7); ctx.moveTo(14, -15.6); ctx.lineTo(14, -7); ctx.stroke();
  // 玄関前の絨毯（濃色で控えめに）
  ctx.fillStyle = _dvTone(col, -0.42, 0.9);
  ctx.beginPath(); ctx.moveTo(-5.5, -7); ctx.lineTo(5.5, -7); ctx.lineTo(7.5, -0.5); ctx.lineTo(-7.5, -0.5); ctx.closePath(); ctx.fill();

  _dvRim(ctx, -18, -54, -7, 0.5);
  ctx.restore();
}

/* ---------- ランドマーク：発光する巨大クリスタル塔（高さ約120px） ---------- */
function dvLandmark(ctx, col, T){
  ctx.save();
  const line = _dvMix(col, '#02101f', 0.86, 0.95);
  const cry = _dvMixHex(col, '#63cbff', 0.62);   // 所有者色を氷青へ寄せた結晶色
  const pulse = 0.55 + 0.45 * Math.sin(T * 0.0014);
  const glowC = _dvTone(cry, 0.35);

  // 接地の濃い落ち影＋足元の青い発光プール
  _dvShadow(ctx, 40, 12, 0.68);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.scale(1, 0.30);
  const pg = ctx.createRadialGradient(0, 0, 2, 0, 0, 42);
  pg.addColorStop(0, _dvTone(_dvMixHex(col, cry, 0.5), 0.4, 0.30 * pulse + 0.14));
  pg.addColorStop(1, _dvTone(_dvMixHex(col, cry, 0.5), 0.4, 0));
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  // 氷の台座（2段の石壇。上段は所有者色）
  _dvBox(ctx, 0, 0, 56, 6, 13,
    _dvHG(ctx, -28, 28, '#c6d9ec', '#5f7492'), '#475972', '#dcebf8', line);
  _dvBox(ctx, 0, -6, 40, 5, 10,
    _dvHG(ctx, -20, 20, _dvTone(col, 0.40), _dvTone(col, -0.26)),
    _dvTone(col, -0.48), _dvTone(col, 0.26), line);
  // 台座の縁の発光ライン
  ctx.strokeStyle = _dvTone(cry, 0.5, 0.55 * pulse + 0.25); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-20, -11.2); ctx.lineTo(20, -11.2); ctx.stroke();

  // クリスタルの束（奥＝暗く小さく → 手前＝明るく大きく）
  _dvShard(ctx, cry, line, -21, -9, 9.0, 36, 0.55, -7, 0.24);
  _dvShard(ctx, cry, line, 23, -9, 9.5, 48, 0.60, 8, 0.20);
  _dvShard(ctx, cry, line, -13, -10, 10.5, 64, 0.85, -5, 0.09);
  _dvShard(ctx, cry, line, 14, -10, 11.0, 78, 0.90, 6, 0.06);
  _dvShard(ctx, cry, line, 0, -11, 13.0, 109, 1.00, 0, 0);   // 主結晶：頂点 y=-120
  // 足元の小さな氷片（シルエットの裾を崩す）
  _dvShard(ctx, cry, line, -27, -5, 4.5, 15, 0.5, -3, 0.26);
  _dvShard(ctx, cry, line, 29, -5, 4.0, 12, 0.5, 3, 0.28);
  _dvShard(ctx, cry, line, 6, -6, 3.6, 11, 0.5, 2, 0.18);

  // 天へ伸びる半透明の光柱（明滅）
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bA = 0.14 + 0.18 * pulse;
  const bg = ctx.createLinearGradient(0, -118, 0, -300);
  bg.addColorStop(0, _dvTone(cry, 0.55, bA));
  bg.addColorStop(0.45, _dvTone(cry, 0.45, bA * 0.45));
  bg.addColorStop(1, _dvTone(cry, 0.45, 0));
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-4.5, -118); ctx.lineTo(4.5, -118); ctx.lineTo(21, -300); ctx.lineTo(-21, -300); ctx.closePath(); ctx.fill();
  // 芯の細い光条
  const bg2 = ctx.createLinearGradient(0, -118, 0, -250);
  bg2.addColorStop(0, 'rgba(242,253,255,' + (0.40 * pulse + 0.18).toFixed(3) + ')');
  bg2.addColorStop(1, 'rgba(242,253,255,0)');
  ctx.fillStyle = bg2;
  ctx.beginPath(); ctx.moveTo(-1.8, -118); ctx.lineTo(1.8, -118); ctx.lineTo(6, -250); ctx.lineTo(-6, -250); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  // 頂点のフレア＋横に伸びる光芒
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const fr = 17 + 5 * pulse;
  const fg = ctx.createRadialGradient(0, -118, 0, 0, -118, fr);
  fg.addColorStop(0, 'rgba(255,255,255,' + (0.70 * pulse + 0.22).toFixed(3) + ')');
  fg.addColorStop(0.32, _dvTone(cry, 0.5, 0.32 * pulse));
  fg.addColorStop(1, _dvTone(cry, 0.5, 0));
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.arc(0, -118, fr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,' + (0.30 * pulse + 0.12).toFixed(3) + ')';
  ctx.beginPath();
  ctx.moveTo(-26 - 6 * pulse, -118); ctx.lineTo(0, -120.6); ctx.lineTo(26 + 6 * pulse, -118); ctx.lineTo(0, -115.4);
  ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  // 足元から立ちのぼる光のリング（控えめに1本）
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const rp = (T * 0.00024) % 1;
  ctx.globalAlpha = Math.sin(rp * Math.PI) * 0.22;
  ctx.strokeStyle = glowC; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(0, -9 - rp * 34, 24 * (1 - rp * 0.5), 24 * (1 - rp * 0.5) * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  // 浮遊する粒子（決定的乱数＋Tで上昇）
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++){
    const s1 = _dvRnd(i), s2 = _dvRnd(i + 41), s3 = _dvRnd(i + 83);
    const ph = ((T * 0.00016 * (0.6 + s3 * 0.8)) + s1) % 1;
    const y = -4 - ph * 124;
    const spread = 30 * (1 - ph * 0.5);
    const x = (s2 * 2 - 1) * spread + Math.sin(T * 0.0011 + i * 1.9) * 3.0;
    ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.8;
    const sz = 0.9 + s3 * 1.4;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.95)' : glowC;
    ctx.beginPath();
    ctx.moveTo(x, y - sz * 1.8); ctx.lineTo(x + sz, y); ctx.lineTo(x, y + sz * 1.8); ctx.lineTo(x - sz, y);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  ctx.restore();
}

// クリスタル1本：左facet＝明・右facet＝暗・稜線が発光。tiltで頂点をずらし束に表情を出す
function _dvShard(ctx, cry, line, cx, yb, bw, h, k, tilt, dim){
  const apexX = cx + (tilt || 0), apex = yb - h;
  const midY = yb - h * 0.56, midW = bw * 0.60;
  const mx = (apexX - cx) * 0.5;
  const d = dim || 0;
  const back = '#0e2136';
  ctx.save();
  ctx.lineJoin = 'round';

  // 左面（光源側＝明るい）
  ctx.beginPath();
  ctx.moveTo(cx - bw, yb); ctx.lineTo(cx - midW + mx, midY); ctx.lineTo(apexX, apex); ctx.lineTo(cx + 0.5, yb);
  ctx.closePath();
  ctx.fillStyle = _dvVG(ctx, apex, yb,
    _dvMixHex(_dvToneHex(cry, 0.80), back, d), _dvMixHex(_dvToneHex(cry, 0.18), back, d + 0.08));
  ctx.fill();
  ctx.strokeStyle = line; ctx.lineWidth = 1.1; ctx.stroke();

  // 右面（影側＝暗い）
  ctx.beginPath();
  ctx.moveTo(cx + bw, yb); ctx.lineTo(cx + midW + mx, midY); ctx.lineTo(apexX, apex); ctx.lineTo(cx + 0.5, yb);
  ctx.closePath();
  ctx.fillStyle = _dvVG(ctx, apex, yb,
    _dvMixHex(_dvToneHex(cry, -0.02), back, d), _dvMixHex(_dvToneHex(cry, -0.46), back, d + 0.06));
  ctx.fill(); ctx.stroke();

  // 内部の光の芯（下から上へ抜ける）
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.20, yb); ctx.lineTo(cx - bw * 0.12 + mx, midY); ctx.lineTo(apexX, apex);
  ctx.lineTo(cx + bw * 0.14 + mx, midY); ctx.lineTo(cx + bw * 0.22, yb);
  ctx.closePath();
  ctx.fillStyle = _dvVG(ctx, apex, yb,
    'rgba(255,255,255,' + (0.80 * k * (1 - d)).toFixed(3) + ')', _dvTone(cry, 0.4, 0.04));
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  // ファセット（結晶の割れ目）
  ctx.strokeStyle = _dvTone(cry, -0.55, 0.5); ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - bw, yb); ctx.lineTo(cx - midW + mx, midY);
  ctx.moveTo(cx + bw, yb); ctx.lineTo(cx + midW + mx, midY);
  ctx.stroke();
  // 左稜線のハイライト
  ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 * k * (1 - d)).toFixed(3) + ')'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.88, yb - 1.5); ctx.lineTo(cx - midW * 0.94 + mx, midY); ctx.lineTo(apexX - 0.4, apex + 2.5);
  ctx.stroke();

  // 先端の発光
  ctx.shadowColor = _dvTone(cry, 0.55, 0.95); ctx.shadowBlur = 11 * k * (1 - d);
  ctx.fillStyle = 'rgba(246,253,255,' + (0.9 * k * (1 - d * 0.6)).toFixed(3) + ')';
  ctx.beginPath(); ctx.arc(apexX, apex + 1.6, 1.2 + k, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.restore();
}

/* ───── aeceea012f1a59c07 ───── */
// ===== 背景（盤の外の世界） =====
// 骨格: 放射グラデ空 → 奥/中/手前の3層 → 光条 → 粒子 → ビネット → 盤の受け影

function _dvbRnd(i){ const x = Math.sin(i*127.1+311.7)*43758.5453; return x - Math.floor(x); }

// 0..1 を a..b へ
function _dvbLerp(a,b,t){ return a + (b-a)*t; }

// テーマ別の色（本家L53の氷窟＝上が明るい水色、下は濃紺）
function _dvbPalette(theme){
  if(theme === 'world'){
    return {
      skyTop:'#0a1240', skyMid:'#101d52', skyLo:'#02050f',
      glowIn:'rgba(96,146,238,0.30)', glowMid:'rgba(46,80,168,0.15)',
      far:['#22326e','#16224f','rgba(150,185,255,0.28)'],
      mid:['#151f4c','#0d1436','rgba(130,165,240,0.22)'],
      near:['#070b22','#03050f','rgba(110,145,220,0.20)'],
      ray:'rgba(178,206,255,', mote:'rgba(206,224,255,',
      vig:'rgba(1,2,10,', shadow:'rgba(0,0,8,',
      halo:'rgba(80,130,225,'
    };
  }
  if(theme === 'onsen'){
    return {
      skyTop:'#4b2f63', skyMid:'#a55a5a', skyLo:'#2a1730',
      glowIn:'rgba(255,186,110,0.42)', glowMid:'rgba(214,104,86,0.20)',
      far:['#7a4d78','#5c3a63','rgba(255,206,150,0.32)'],
      mid:['#4a2c55','#331d3e','rgba(255,180,120,0.26)'],
      near:['#241226','#140a17','rgba(255,160,110,0.22)'],
      ray:'rgba(255,206,150,', mote:'rgba(255,222,178,',
      vig:'rgba(12,4,16,', shadow:'rgba(20,6,20,',
      halo:'rgba(255,170,110,'
    };
  }
  return {
    skyTop:'#16456f', skyMid:'#0d2c50', skyLo:'#020814',
    glowIn:'rgba(120,214,255,0.20)', glowMid:'rgba(40,110,175,0.09)',
    far:['#8ed2ef','#4b8fbc','rgba(215,246,255,0.40)'],
    mid:['#4f9ecb','#1b4f7d','rgba(190,236,255,0.34)'],
    near:['#0c3251','#010710','rgba(158,228,255,0.42)'],
    ray:'rgba(186,234,255,', mote:'rgba(220,246,255,',
    vig:'rgba(1,5,14,', shadow:'rgba(0,3,12,',
    halo:'rgba(80,186,255,'
  };
}

// --- 空：縦グラデ＋上方光源の放射グラデ＋地平のかすみ帯 ---
function _dvbSky(ctx,P,T,SW,SH,cx,cy){
  ctx.save();
  const g = ctx.createLinearGradient(0,0,0,SH);
  g.addColorStop(0, P.skyTop);
  g.addColorStop(0.44, P.skyMid);
  g.addColorStop(1, P.skyLo);
  ctx.fillStyle = g;
  ctx.fillRect(0,0,SW,SH);
  // 上から差す主光源（ゆっくり呼吸）
  const breathe = 0.86 + 0.14*Math.sin(T/3400);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = breathe;
  const rg = ctx.createRadialGradient(cx, -SH*0.18, 30, cx, cy-SH*0.10, SW*0.78);
  rg.addColorStop(0, P.glowIn);
  rg.addColorStop(0.42, P.glowMid);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0,0,SW,SH);
  // 地平のかすみ帯（奥の壁がぼうっと光る）
  const hz = ctx.createLinearGradient(0, SH*0.30, 0, SH*0.80);
  hz.addColorStop(0, P.halo + '0)');
  hz.addColorStop(0.42, P.halo + '0.17)');
  hz.addColorStop(1, P.halo + '0)');
  ctx.globalAlpha = 0.75*breathe;
  ctx.fillStyle = hz;
  ctx.fillRect(0,SH*0.30,SW,SH*0.50);
  ctx.restore();
}

// --- 氷柱1本（結晶シャード）dir:1=床から / -1=天井から ---
function _dvbIcePillar(ctx,x,by,w,h,dir,seed,colA,colB,edge,alpha,full){
  const hw = w*0.5;
  const tipX = x + (_dvbRnd(seed*3.1+1)-0.5)*w*0.7;
  const ty = by - dir*h;
  const my = by - dir*h*(0.55+_dvbRnd(seed*1.7+4)*0.22);
  const lx = x - hw, rx = x + hw;
  const mlx = x - hw*(0.80+_dvbRnd(seed*2.3+5)*0.18);
  const mrx = x + hw*(0.78+_dvbRnd(seed*2.7+9)*0.20);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(lx, by);
  ctx.lineTo(mlx, my);
  ctx.lineTo(tipX, ty);
  ctx.lineTo(mrx, my);
  ctx.lineTo(rx, by);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, by, tipX, ty);
  g.addColorStop(0, colB);
  g.addColorStop(0.62, colA);
  g.addColorStop(1, colA);
  ctx.fillStyle = g;
  ctx.fill();
  // 光る面（左半分のファセット）
  ctx.beginPath();
  ctx.moveTo(tipX, ty);
  ctx.lineTo(mlx, my);
  ctx.lineTo(_dvbLerp(lx,x,0.30), by);
  ctx.lineTo(_dvbLerp(x,tipX,0.45), _dvbLerp(by,ty,0.60));
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.fill();
  // 稜線（巨大な手前氷柱では線が引っかき傷に見えるので描かない）
  if(!(full && h > 430)){
    ctx.beginPath();
    ctx.moveTo(mlx, my); ctx.lineTo(tipX, ty); ctx.lineTo(mrx, my);
    ctx.strokeStyle = edge;
    ctx.lineWidth = full ? 2.6 : 1.1;
    ctx.stroke();
  }
  ctx.restore();
}

// --- 氷柱の列（1層分・株立ちのクラスター） ---
function _dvbIceRow(ctx,P,T,SW,SH,cx,o){
  const col = P[o.tone];
  const full = (o.tone === 'near');
  for(let i=0;i<o.n;i++){
    const r1=_dvbRnd(o.seed+i*4.1), r2=_dvbRnd(o.seed+i*4.1+1), r3=_dvbRnd(o.seed+i*4.1+2);
    let x;
    if(o.edgeOnly){
      const side = (i%2===0) ? -1 : 1;
      const t = _dvbRnd(o.seed+i*7.3);
      x = (side<0) ? _dvbLerp(-90, SW*0.27, t*t) : _dvbLerp(SW+90, SW*0.73, t*t);
    } else {
      x = _dvbLerp(o.x0, o.x1, (i+0.5)/o.n + (r1-0.5)*0.7/o.n);
    }
    x += Math.sin(T/6400 + i*1.9)*o.sway;
    const h = _dvbLerp(o.hMin,o.hMax,r2*r2);
    const w = _dvbLerp(o.wMin,o.wMax,r3);
    // 中央（盤の裏）は薄めて可読性を守る
    const cf = 0.30 + 0.70*Math.min(1, Math.abs(x-cx)/(SW*0.30));
    const a2 = o.alpha*cf*(0.72+0.28*_dvbRnd(o.seed+i*9.7));
    // 株立ち：小さい相方を添えて「群れ」に見せる
    const sub = 1 + Math.floor(_dvbRnd(o.seed+i*11.3)*2);
    for(let k=sub;k>=1;k--){
      const sx = x + (_dvbRnd(o.seed+i*13.7+k)-0.5)*w*2.8;
      const sh = h*(0.38+_dvbRnd(o.seed+i*17.1+k)*0.40);
      const sw = w*(0.42+_dvbRnd(o.seed+i*19.3+k)*0.34);
      _dvbIcePillar(ctx,sx,o.by+(_dvbRnd(o.seed+i*23.1+k)-0.5)*12,sw,sh,o.dir,o.seed+i*7+k,col[0],col[1],col[2],a2*0.76,full);
    }
    _dvbIcePillar(ctx,x,o.by,w,h,o.dir,o.seed+i,col[0],col[1],col[2],a2,full);
    // 先端のにじみ（控えめ）
    const ty = o.by - o.dir*h;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    const tw = w*0.9;
    const tg = ctx.createRadialGradient(x,ty,0,x,ty,tw);
    tg.addColorStop(0, P.mote+(0.13*cf).toFixed(3)+')');
    tg.addColorStop(1, P.mote+'0)');
    ctx.fillStyle = tg;
    ctx.fillRect(x-tw,ty-tw,tw*2,tw*2);
    ctx.restore();
  }
}

// --- 光る氷晶のかたまり（画面端のアクセント） ---
function _dvbCrystals(ctx,P,T,SW,SH,cx){
  ctx.save();
  for(let i=0;i<6;i++){
    const side = (i%2===0)?-1:1;
    const t = _dvbRnd(i*6.1+2);
    const x = (side<0) ? _dvbLerp(SW*0.02, SW*0.17, t) : _dvbLerp(SW*0.98, SW*0.83, t);
    const y = _dvbLerp(SH*0.60, SH*0.92, _dvbRnd(i*6.1+3));
    const h = _dvbLerp(70, 190, _dvbRnd(i*6.1+4));
    const w = h*0.34;
    const pulse = 0.55 + 0.45*Math.sin(T/(1700+i*430) + i);
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha = 0.62;
    ctx.beginPath();
    ctx.moveTo(x, y-h);
    ctx.lineTo(x+w*0.5, y-h*0.70);
    ctx.lineTo(x+w*0.34, y);
    ctx.lineTo(x-w*0.34, y);
    ctx.lineTo(x-w*0.5, y-h*0.70);
    ctx.closePath();
    const g = ctx.createLinearGradient(x,y,x,y-h);
    g.addColorStop(0,'rgba(20,80,132,0.92)');
    g.addColorStop(0.6,'rgba(70,170,232,0.92)');
    g.addColorStop(1,'rgba(176,228,255,0.95)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle='rgba(206,246,255,0.5)'; ctx.lineWidth=1.2; ctx.stroke();
    // 中央の面（宝石らしい稜）
    ctx.beginPath();
    ctx.moveTo(x, y-h); ctx.lineTo(x, y);
    ctx.moveTo(x-w*0.5, y-h*0.70); ctx.lineTo(x, y-h*0.54); ctx.lineTo(x+w*0.5, y-h*0.70);
    ctx.strokeStyle='rgba(230,252,255,0.35)'; ctx.lineWidth=1; ctx.stroke();
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha = 1;
    const gg = ctx.createRadialGradient(x,y-h*0.55,0,x,y-h*0.55,h*1.6);
    gg.addColorStop(0,'rgba(110,205,255,'+(0.20*pulse).toFixed(3)+')');
    gg.addColorStop(1,'rgba(120,220,255,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(x-h*1.6,y-h*2.2,h*3.2,h*3.2);
  }
  ctx.restore();
}

// --- 稜線シルエット（world の島影 / onsen の山影） ---
function _dvbRidge(ctx,SW,SH,o){
  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.beginPath();
  ctx.moveTo(-30, SH+30);
  ctx.lineTo(-30, o.baseY);
  const step = (SW+60)/o.seg;
  for(let i=0;i<=o.seg;i++){
    const x = -30 + i*step;
    const n = _dvbRnd(o.seed+i*3.7)*0.62 + _dvbRnd(o.seed+i*1.31)*0.38;
    const y = o.baseY - Math.pow(n, o.sharp)*o.amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(SW+30, SH+30);
  ctx.closePath();
  const g = ctx.createLinearGradient(0,o.baseY-o.amp,0,SH);
  g.addColorStop(0, o.colA);
  g.addColorStop(1, o.colB);
  ctx.fillStyle = g;
  ctx.fill();
  // 稜線のふち光（逆光）
  ctx.beginPath();
  for(let i=0;i<=o.seg;i++){
    const x = -30 + i*step;
    const n = _dvbRnd(o.seed+i*3.7)*0.62 + _dvbRnd(o.seed+i*1.31)*0.38;
    const y = o.baseY - Math.pow(n, o.sharp)*o.amp;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.strokeStyle = o.rim;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}

// --- 星（world） ---
function _dvbStars(ctx,P,T,SW,SH){
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<150;i++){
    const x = _dvbRnd(i*3.3+7)*SW;
    const y = _dvbRnd(i*3.3+8)*SH*0.58;
    const r = 0.5 + _dvbRnd(i*3.3+9)*1.5;
    const tw = 0.30 + 0.70*Math.abs(Math.sin(T/(1100+_dvbRnd(i*3.3+10)*2400) + i));
    ctx.fillStyle = P.mote + (0.85*tw).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
    if(r>1.5){
      ctx.fillStyle = P.mote + (0.16*tw).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x,y,r*3.4,0,Math.PI*2); ctx.fill();
    }
  }
  // 月
  const mx = SW*0.80, my = SH*0.17;
  const mg = ctx.createRadialGradient(mx,my,4,mx,my,120);
  mg.addColorStop(0,'rgba(238,246,255,0.95)');
  mg.addColorStop(0.14,'rgba(200,224,255,0.45)');
  mg.addColorStop(1,'rgba(120,170,255,0)');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(mx,my,120,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// --- 地平の海の弧（world） ---
function _dvbSeaArc(ctx,P,T,SW,SH,cx){
  const R = SW*1.25, hy = SH*0.50, ccy = hy + R;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, ccy, R, -Math.PI/2-0.95, -Math.PI/2+0.95);
  ctx.lineTo(SW+40, SH+40);
  ctx.lineTo(-40, SH+40);
  ctx.closePath();
  const g = ctx.createLinearGradient(0,hy,0,SH);
  g.addColorStop(0,'rgba(46,96,182,0.95)');
  g.addColorStop(0.35,'rgba(18,44,108,0.96)');
  g.addColorStop(1,'rgba(2,6,20,0.98)');
  ctx.fillStyle = g;
  ctx.fill();
  // 水平線のふち光
  ctx.beginPath();
  ctx.arc(cx, ccy, R, -Math.PI/2-0.95, -Math.PI/2+0.95);
  ctx.strokeStyle = 'rgba(186,228,255,0.85)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // 月光の道（柔らかい縦の広がり）
  ctx.globalCompositeOperation='lighter';
  ctx.save();
  ctx.translate(SW*0.80, hy + SH*0.16);
  ctx.scale(1, 2.4);
  const mgz = ctx.createRadialGradient(0,0,2,0,0,SH*0.11);
  mgz.addColorStop(0,'rgba(178,218,255,' + (0.20+0.06*Math.sin(T/2200)).toFixed(3) + ')');
  mgz.addColorStop(1,'rgba(178,218,255,0)');
  ctx.fillStyle = mgz;
  ctx.beginPath(); ctx.arc(0,0,SH*0.11,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

// --- 夕日（onsen） ---
function _dvbSun(ctx,P,T,SW,SH,cx){
  const sx = SW*0.34, sy = SH*0.46;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const pulse = 0.88 + 0.12*Math.sin(T/2600);
  const g = ctx.createRadialGradient(sx,sy,6,sx,sy,SH*0.62);
  g.addColorStop(0,'rgba(255,238,196,' + (0.95*pulse).toFixed(3) + ')');
  g.addColorStop(0.06,'rgba(255,196,118,' + (0.75*pulse).toFixed(3) + ')');
  g.addColorStop(0.30,'rgba(232,124,88,' + (0.26*pulse).toFixed(3) + ')');
  g.addColorStop(1,'rgba(180,70,90,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx,sy,SH*0.62,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// --- 湯けむり（onsen） ---
function _dvbSteam(ctx,P,T,SW,SH,cx){
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<9;i++){
    const bx = _dvbLerp(SW*0.04, SW*0.96, _dvbRnd(i*5.7+2));
    const speed = 0.010 + _dvbRnd(i*5.7+3)*0.014;
    for(let k=0;k<8;k++){
      const ph = (T*speed*0.06 + k*0.125 + _dvbRnd(i*5.7+k)) % 1;
      const y = SH*1.02 - ph*SH*0.55;
      const x = bx + Math.sin(ph*4.4 + i*2.1 + T/2600)*46;
      const r = _dvbLerp(26, 96, ph);
      const a = 0.20*(1-ph)*(0.55+0.45*Math.sin(T/1800+i));
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(255,232,208,' + a.toFixed(3) + ')');
      g.addColorStop(1,'rgba(255,210,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

// --- 3層の奥行き（テーマで中身を差し替え） ---
function _dvbLayers(ctx,theme,P,T,SW,SH,cx,cy){
  if(theme === 'ice'){
    // 奥：地平の氷林（小さく淡い）
    _dvbIceRow(ctx,P,T,SW,SH,cx,{seed:11,n:22,x0:-50,x1:SW+50,by:SH*0.575,hMin:80,hMax:230,wMin:14,wMax:40,alpha:0.26,dir:1,tone:'far',sway:2});
    // 奥：天井から下がる氷
    _dvbIceRow(ctx,P,T,SW,SH,cx,{seed:37,n:15,x0:-50,x1:SW+50,by:-4,hMin:70,hMax:210,wMin:12,wMax:34,alpha:0.22,dir:-1,tone:'far',sway:2});
    // 中：氷壁
    _dvbIceRow(ctx,P,T,SW,SH,cx,{seed:59,n:14,x0:-70,x1:SW+70,by:SH*0.760,hMin:190,hMax:400,wMin:30,wMax:78,alpha:0.40,dir:1,tone:'mid',sway:3});
    _dvbIceRow(ctx,P,T,SW,SH,cx,{seed:83,n:11,x0:-70,x1:SW+70,by:-10,hMin:150,hMax:340,wMin:26,wMax:68,alpha:0.32,dir:-1,tone:'mid',sway:3});
    _dvbCrystals(ctx,P,T,SW,SH,cx);
    // 手前：画面端に濃く大きい氷柱（額縁）
    _dvbIceRow(ctx,P,T,SW,SH,cx,{seed:131,n:9,by:SH*1.10,hMin:380,hMax:780,wMin:52,wMax:126,alpha:0.92,dir:1,tone:'near',sway:1,edgeOnly:true});
    _dvbIceRow(ctx,P,T,SW,SH,cx,{seed:167,n:7,by:-16,hMin:260,hMax:560,wMin:44,wMax:108,alpha:0.86,dir:-1,tone:'near',sway:1,edgeOnly:true});
    return;
  }
  if(theme === 'world'){
    _dvbStars(ctx,P,T,SW,SH);
    _dvbSeaArc(ctx,P,T,SW,SH,cx);
    _dvbRidge(ctx,SW,SH,{baseY:SH*0.560,amp:110,seg:22,seed:21,sharp:2.4,alpha:0.55,colA:P.far[0],colB:P.far[1],rim:P.far[2]});
    _dvbRidge(ctx,SW,SH,{baseY:SH*0.730,amp:200,seg:13,seed:44,sharp:2.8,alpha:0.80,colA:P.mid[0],colB:P.mid[1],rim:P.mid[2]});
    _dvbRidge(ctx,SW,SH,{baseY:SH*1.030,amp:340,seg:7,seed:77,sharp:3.4,alpha:1,colA:P.near[0],colB:P.near[1],rim:P.near[2]});
    return;
  }
  // onsen：夕日＋3重の山影＋湯けむり
  _dvbSun(ctx,P,T,SW,SH,cx);
  _dvbRidge(ctx,SW,SH,{baseY:SH*0.520,amp:110,seg:22,seed:13,sharp:2.0,alpha:0.40,colA:P.far[0],colB:P.far[1],rim:P.far[2]});
  _dvbRidge(ctx,SW,SH,{baseY:SH*0.660,amp:180,seg:14,seed:57,sharp:2.4,alpha:0.66,colA:P.mid[0],colB:P.mid[1],rim:P.mid[2]});
  _dvbRidge(ctx,SW,SH,{baseY:SH*1.030,amp:330,seg:8,seed:91,sharp:3.2,alpha:0.94,colA:P.near[0],colB:P.near[1],rim:P.near[2]});
  _dvbSteam(ctx,P,T,SW,SH,cx);
}

// --- 光条（god ray）ゆっくり明滅 ---
function _dvbRays(ctx,P,T,SW,SH,ox,oy,count){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<count;i++){
    const r1=_dvbRnd(i*7.7+3), r2=_dvbRnd(i*7.7+11), r3=_dvbRnd(i*7.7+19);
    const x0 = ox + (r1*2-1)*SW*0.58;
    const len = SH*(0.72+r2*0.58);
    const sway = Math.sin(T/5200 + i*1.7)*20;
    const x1 = x0 + (r3*2-1)*SW*0.20 + sway;
    const wTop = 6 + r2*16;
    const wBot = 46 + r3*104;
    const pulse = 0.42 + 0.58*Math.abs(Math.sin(T/(2600+i*520) + i*0.8));
    ctx.beginPath();
    ctx.moveTo(x0-wTop, oy);
    ctx.lineTo(x0+wTop, oy);
    ctx.lineTo(x1+wBot, oy+len);
    ctx.lineTo(x1-wBot, oy+len);
    ctx.closePath();
    const g = ctx.createLinearGradient(x0,oy,x1,oy+len);
    g.addColorStop(0, P.ray + (0.30*pulse).toFixed(3) + ')');
    g.addColorStop(0.35, P.ray + (0.15*pulse).toFixed(3) + ')');
    g.addColorStop(1, P.ray + '0)');
    ctx.fillStyle = g;
    ctx.fill();
    // 芯を重ねて柔らかく
    ctx.beginPath();
    ctx.moveTo(x0-wTop*0.4, oy);
    ctx.lineTo(x0+wTop*0.4, oy);
    ctx.lineTo(x1+wBot*0.45, oy+len*0.9);
    ctx.lineTo(x1-wBot*0.45, oy+len*0.9);
    ctx.closePath();
    const g2 = ctx.createLinearGradient(x0,oy,x1,oy+len*0.9);
    g2.addColorStop(0, P.ray + (0.18*pulse).toFixed(3) + ')');
    g2.addColorStop(1, P.ray + '0)');
    ctx.fillStyle = g2;
    ctx.fill();
  }
  ctx.restore();
}

// --- 浮遊する光の粒子 ---
function _dvbMotes(ctx,P,T,SW,SH,n,rise){
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const span = SH + 90;
  for(let i=0;i<n;i++){
    const bx = _dvbRnd(i*5.3+1)*SW;
    const sp = (0.004 + _dvbRnd(i*5.3+2)*0.016)*rise;
    const y0 = _dvbRnd(i*5.3+3)*span;
    let y = y0 - T*sp;
    y = ((y % span) + span) % span - 45;
    const x = bx + Math.sin(T/(1900+i*61) + i)*16;
    const r = 0.6 + _dvbRnd(i*5.3+4)*2.1;
    const a = (0.22 + 0.58*Math.abs(Math.sin(T/(1000+i*137) + i*2.3))) * (0.35+0.65*_dvbRnd(i*5.3+6));
    ctx.fillStyle = P.mote + a.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    if(r > 1.7){
      ctx.fillStyle = P.mote + (a*0.18).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x,y,r*4,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

// --- 四隅のビネット ---
function _dvbVignette(ctx,P,SW,SH,cx,cy){
  ctx.save();
  const g = ctx.createRadialGradient(cx,cy,SH*0.16,cx,cy,SW*0.80);
  g.addColorStop(0, P.vig + '0)');
  g.addColorStop(0.34, P.vig + '0.12)');
  g.addColorStop(0.62, P.vig + '0.46)');
  g.addColorStop(0.84, P.vig + '0.76)');
  g.addColorStop(1, P.vig + '0.94)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,SW,SH);
  // 上下の締め
  const t = ctx.createLinearGradient(0,0,0,SH*0.22);
  t.addColorStop(0, P.vig + '0.58)');
  t.addColorStop(1, P.vig + '0)');
  ctx.fillStyle = t; ctx.fillRect(0,0,SW,SH*0.22);
  const b = ctx.createLinearGradient(0,SH,0,SH*0.74);
  b.addColorStop(0, P.vig + '0.66)');
  b.addColorStop(1, P.vig + '0)');
  ctx.fillStyle = b; ctx.fillRect(0,SH*0.74,SW,SH*0.26);
  ctx.restore();
}

// --- 盤の後光＋真下の落ち影 ---
function _dvbBoardShadow(ctx,P,T,SW,SH,cx,cy){
  ctx.save();
  // 後光（盤を浮かせる）
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.88 + 0.12*Math.sin(T/3100);
  const hg = ctx.createRadialGradient(cx,cy,SH*0.05,cx,cy,SW*0.42);
  hg.addColorStop(0, P.halo + (0.17*pulse).toFixed(3) + ')');
  hg.addColorStop(0.45, P.halo + (0.06*pulse).toFixed(3) + ')');
  hg.addColorStop(1, P.halo + '0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0,0,SW,SH);
  ctx.restore();

  ctx.save();
  // 落ち影（つぶした円）
  ctx.translate(cx, cy + SH*0.175);
  ctx.scale(1, 0.30);
  const r = SW*0.35;
  const sg = ctx.createRadialGradient(0,0,r*0.06,0,0,r);
  sg.addColorStop(0, P.shadow + '0.60)');
  sg.addColorStop(0.50, P.shadow + '0.32)');
  sg.addColorStop(1, P.shadow + '0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

// ===== 本体 =====
function dvBackdrop(ctx, theme, T, SW, SH, cx, cy){
  const P = _dvbPalette(theme);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0,0,0,0)';

  _dvbSky(ctx,P,T,SW,SH,cx,cy);
  _dvbLayers(ctx,theme,P,T,SW,SH,cx,cy);

  if(theme === 'onsen'){
    _dvbRays(ctx,P,T,SW,SH,SW*0.34,-SH*0.05,6);
    _dvbMotes(ctx,P,T,SW,SH,70,1.0);
  } else if(theme === 'world'){
    _dvbRays(ctx,P,T,SW,SH,SW*0.78,-SH*0.20,4);
    _dvbMotes(ctx,P,T,SW,SH,60,0.6);
  } else {
    _dvbRays(ctx,P,T,SW,SH,cx,-SH*0.12,9);
    _dvbMotes(ctx,P,T,SW,SH,90,1.0);
  }

  _dvbVignette(ctx,P,SW,SH,cx,cy);
  _dvbBoardShadow(ctx,P,T,SW,SH,cx,cy);

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ───── ad4d16a6a3fe86c17 ───── */
/* ダイスボヤージュ 駒キャラ（2頭身・4種）
   dvChar(ctx,id,col,T,facing): (0,0)が接地点・上方向へ約64px */
function dvCharLegacy(ctx, id, col, T, facing){
  var i = (((id|0)%4)+4)%4;
  var f = facing < 0 ? -1 : 1;
  var bob  = Math.sin(T*0.0031416)*1.5;            // 呼吸（周期2秒・±1.5px）
  var sway = Math.sin(T*0.0031416 + i*1.7)*0.7;    // 腕のゆれ
  var cyc  = 2600 + i*430;                          // まばたき周期（個体差）
  var P = {
    col : col || '#88aacc',
    lite: dvc_sh(col, 0.30), lite2: dvc_sh(col, 0.58), dark: dvc_sh(col,-0.28),
    ink : dvc_sh(col,-0.62), skin:'#ffe2c4', skinS:'#eebd96',
    blink: (((T + i*911) % cyc) < 130) ? 1 : 0,
    sway : sway
  };

  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.miterLimit = 2;

  // 足元の照り返し（氷の洞窟の青い光）
  var gl = ctx.createRadialGradient(0,-3,1, 0,-3,21);
  gl.addColorStop(0,'rgba(150,226,255,0.28)');
  gl.addColorStop(1,'rgba(150,226,255,0)');
  ctx.fillStyle = gl;
  ctx.beginPath(); ctx.ellipse(0,-3,21,9,0,0,Math.PI*2); ctx.fill();

  // 接地影
  ctx.fillStyle = 'rgba(6,18,32,0.32)';
  ctx.beginPath(); ctx.ellipse(0,0,14.5,4.4,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(6,18,32,0.16)';
  ctx.beginPath(); ctx.ellipse(0,0.4,19,6,0,0,Math.PI*2); ctx.fill();

  ctx.translate(0, bob);
  ctx.scale(f, 1);

  if      (i===0) dvc_mage(ctx,P);
  else if (i===1) dvc_knight(ctx,P);
  else if (i===2) dvc_archer(ctx,P);
  else            dvc_merchant(ctx,P);

  ctx.restore();
}

/* ---------- 小道具 ---------- */
function dvc_rnd(i){ var x = Math.sin(i*127.1 + 311.7)*43758.5453; return x - Math.floor(x); }

function dvc_rgb(c){
  var s = String(c||'#88aacc').replace('#','');
  if(s.length===3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
  var n = parseInt(s,16);
  if(!isFinite(n)) return [136,170,204];
  return [(n>>16)&255,(n>>8)&255,n&255];
}
/* t>0で白寄り・t<0で黒寄り */
function dvc_sh(c,t){
  var r = dvc_rgb(c), w = t>=0?255:0, a = Math.abs(t);
  return 'rgb('+Math.round(r[0]+(w-r[0])*a)+','+Math.round(r[1]+(w-r[1])*a)+','+Math.round(r[2]+(w-r[2])*a)+')';
}
/* 2色を混ぜる（プレイヤー色を各キャラのテーマ色になじませる） */
function dvc_mix(c1,c2,t){
  var a = dvc_rgb(c1), b = dvc_rgb(c2);
  return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')';
}
function dvc_ell(ctx,x,y,rx,ry,doStroke){
  ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill();
  if(doStroke!==false) ctx.stroke();
}
/* 背側のリムライト（氷の反射） */
function dvc_rim(ctx,pts,w,alpha){
  ctx.save();
  ctx.globalAlpha = alpha===undefined?0.55:alpha;
  ctx.strokeStyle = '#cdeeff'; ctx.lineWidth = w||1.6; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(pts[0],pts[1]);
  for(var k=2;k<pts.length;k+=4) ctx.quadraticCurveTo(pts[k],pts[k+1],pts[k+2],pts[k+3]);
  ctx.stroke();
  ctx.restore();
}
/* 4方向のきらめき */
function dvc_spark(ctx,x,y,r,c){
  ctx.save(); ctx.fillStyle=c||'#ffffff';
  ctx.beginPath();
  ctx.moveTo(x,y-r); ctx.quadraticCurveTo(x+r*0.22,y-r*0.22,x+r,y);
  ctx.quadraticCurveTo(x+r*0.22,y+r*0.22,x,y+r);
  ctx.quadraticCurveTo(x-r*0.22,y+r*0.22,x-r,y);
  ctx.quadraticCurveTo(x-r*0.22,y-r*0.22,x,y-r);
  ctx.fill(); ctx.restore();
}
/* 素の頭（肌）。顔は dvc_face で別に描く */
function dvc_headBase(ctx,P){
  var g = ctx.createLinearGradient(-8,-52,10,-28);
  g.addColorStop(0,'#fff2e2'); g.addColorStop(0.6,P.skin); g.addColorStop(1,P.skinS);
  ctx.fillStyle = g; ctx.strokeStyle = '#a9754f'; ctx.lineWidth = 1.5;
  dvc_ell(ctx,1.5,-40,13,12.4);
}
/* 目・ほお・口 */
function dvc_face(ctx,P,mouth){
  var cy = -40;
  if(P.blink){
    ctx.strokeStyle='#242b3d'; ctx.lineWidth=1.7;
    ctx.beginPath();
    ctx.moveTo(-5.2,cy); ctx.quadraticCurveTo(-3,cy+1.2,-0.8,cy);
    ctx.moveTo(3.8,cy);  ctx.quadraticCurveTo(6,cy+1.2,8.2,cy);
    ctx.stroke();
  }else{
    ctx.fillStyle='#242b3d';
    ctx.beginPath(); ctx.ellipse(-3,cy,1.8,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6,cy,1.8,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(-3.7,cy-1.1,0.75,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.3,cy-1.1,0.75,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.6;
    ctx.beginPath(); ctx.arc(-2.2,cy+1.3,0.45,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(6.8,cy+1.3,0.45,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  }
  // ほお
  ctx.save(); ctx.globalAlpha=0.32; ctx.fillStyle='#ff8b9a';
  ctx.beginPath(); ctx.ellipse(-6.2,cy+3.6,2.4,1.4,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9.2,cy+3.6,2.4,1.4,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // 口（小さな曲線）
  ctx.strokeStyle='#8d4141'; ctx.lineWidth=1.1;
  ctx.beginPath();
  if(mouth==='o'){ ctx.ellipse(1.6,cy+5.2,1.5,1.8,0,0,Math.PI*2); ctx.fillStyle='#8d4141'; ctx.fill(); }
  else { ctx.moveTo(-0.6,cy+4.4); ctx.quadraticCurveTo(1.6,cy+6.6,3.8,cy+4.4); ctx.stroke(); }
}

/* ---------- id0：青いマントの魔法使い ---------- */
function dvc_mage(ctx,P){
  var s = P.sway, acc = dvc_mix(P.col,'#3f6fd8',0.35);

  // 杖（体の後ろから）
  ctx.strokeStyle='#6b4526'; ctx.lineWidth=3.1;
  ctx.beginPath(); ctx.moveTo(18,-2); ctx.lineTo(16,-53); ctx.stroke();
  ctx.strokeStyle='#a2724a'; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.moveTo(17.2,-4); ctx.lineTo(15.4,-51); ctx.stroke();

  // 靴
  ctx.fillStyle='#3c4159'; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  dvc_ell(ctx,-5,-2.6,4.2,2.8); dvc_ell(ctx,5.5,-2.6,4.2,2.8);

  // ローブ本体（裾が波打つ台形）
  var rg = ctx.createLinearGradient(-10,-34,12,-2);
  rg.addColorStop(0,P.lite2); rg.addColorStop(0.45,P.col); rg.addColorStop(1,P.dark);
  ctx.fillStyle=rg; ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-8,-30);
  ctx.quadraticCurveTo(-14,-16,-15.5,-3.5);
  ctx.quadraticCurveTo(-10,-1,-5,-3.5);
  ctx.quadraticCurveTo(1,-1,6,-3.5);
  ctx.quadraticCurveTo(12,-1,16,-3.5);
  ctx.quadraticCurveTo(14,-18,10,-30);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // 前立ての明るい帯
  ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle=P.lite2;
  ctx.beginPath();
  ctx.moveTo(0,-29); ctx.lineTo(4,-29); ctx.quadraticCurveTo(5.5,-16,6,-4);
  ctx.quadraticCurveTo(3,-2.5,0.5,-4); ctx.quadraticCurveTo(0.5,-16,0,-29);
  ctx.fill(); ctx.restore();

  // 後ろ腕
  ctx.fillStyle=P.dark; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-7,-29); ctx.quadraticCurveTo(-13,-25,-12,-17-s);
  ctx.quadraticCurveTo(-8,-16,-6,-22); ctx.closePath(); ctx.fill(); ctx.stroke();

  // マント（肩掛け）
  ctx.fillStyle=acc; ctx.strokeStyle=P.ink;
  ctx.beginPath();
  ctx.moveTo(-11,-30.5); ctx.quadraticCurveTo(1.5,-36,12.5,-30.5);
  ctx.quadraticCurveTo(10,-21,2,-22.5); ctx.quadraticCurveTo(-7,-21,-11,-30.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 留め金
  ctx.fillStyle='#ffd76a'; ctx.strokeStyle='#a5761b'; ctx.lineWidth=1;
  dvc_ell(ctx,1.5,-30,2.4,2.4);

  // 前腕（杖を握る）
  ctx.fillStyle=P.lite; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(6,-29); ctx.quadraticCurveTo(15,-27,16.4,-19+s);
  ctx.quadraticCurveTo(12,-16.5,8,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=P.skin; ctx.strokeStyle='#a9754f';
  dvc_ell(ctx,16.6,-18.5+s,2.7,2.7);

  // 頭
  dvc_headBase(ctx,P);
  dvc_face(ctx,P);
  // 白いひげ
  ctx.fillStyle='#f4f8ff'; ctx.strokeStyle='#b7c7da'; ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(-6,-32.5); ctx.quadraticCurveTo(1.6,-33.5,9,-32.5);
  ctx.quadraticCurveTo(9,-25,2.5,-22.5); ctx.quadraticCurveTo(-4.5,-25.5,-6,-32.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // とんがり帽（つば＋先が前に垂れる円錐）
  ctx.fillStyle=P.dark; ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.ellipse(1.5,-49.5,12.5,4.2,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  var hg = ctx.createLinearGradient(-8,-58,12,-52);
  hg.addColorStop(0,P.dark); hg.addColorStop(0.45,P.col); hg.addColorStop(1,P.lite2);
  ctx.fillStyle=hg; ctx.strokeStyle=P.ink;
  ctx.beginPath();
  ctx.moveTo(-8,-50.5);
  ctx.quadraticCurveTo(-5,-59,2.5,-65);
  ctx.quadraticCurveTo(9,-68.5,12,-62);
  ctx.quadraticCurveTo(9,-61,6,-58);
  ctx.quadraticCurveTo(9,-54,9.8,-50.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 帽子の帯と星
  ctx.fillStyle='#ffd76a'; ctx.strokeStyle='#a5761b'; ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(-7.6,-51.4); ctx.quadraticCurveTo(1.2,-55.6,9.4,-51.4);
  ctx.quadraticCurveTo(1.2,-48.6,-7.6,-51.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  dvc_spark(ctx,-1.5,-52.8,2.5,'#fff6cf');
  dvc_spark(ctx,12.6,-62.6,2.2,'#fff6cf');

  // リムライト
  dvc_rim(ctx,[-8,-50.5, -5.5,-58, 2.5,-65], 1.7, 0.62);
  dvc_rim(ctx,[-11,-31, -15,-18, -15.5,-5], 1.5, 0.35);

  // 杖の水晶（最後に光らせる）
  var og = ctx.createRadialGradient(15.6,-56,0.5, 15.6,-56,10);
  og.addColorStop(0,'rgba(255,255,255,0.95)');
  og.addColorStop(0.3,'rgba(150,236,255,0.75)');
  og.addColorStop(1,'rgba(90,190,255,0)');
  ctx.fillStyle=og; ctx.beginPath(); ctx.arc(15.6,-56,10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#e6f9ff'; ctx.strokeStyle='#4aa8d8'; ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(15.6,-61); ctx.lineTo(19.2,-56); ctx.lineTo(15.6,-51); ctx.lineTo(12,-56);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

/* ---------- id1：赤い鎧の剣士 ---------- */
function dvc_knight(ctx,P){
  var s = P.sway;
  var steel = '#c3cfe4', steelD = '#7b89a6';
  var gold = '#ffd257', goldD = '#a5761b';

  // 剣（背中側に担ぐ）
  ctx.save();
  ctx.translate(-12.5,-24); ctx.rotate(-0.2);
  var bg = ctx.createLinearGradient(-4,0,4,0);
  bg.addColorStop(0,'#8d9db8'); bg.addColorStop(0.4,'#f4f9ff'); bg.addColorStop(1,'#7f8ea9');
  ctx.fillStyle=bg; ctx.strokeStyle='#4e5b76'; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-3.6,-3); ctx.lineTo(3.6,-3); ctx.lineTo(3.6,-27);
  ctx.lineTo(0,-35); ctx.lineTo(-3.6,-27); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.save(); ctx.globalAlpha=0.75; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(-1.6,-5); ctx.lineTo(-1.6,-26); ctx.stroke(); ctx.restore();
  ctx.fillStyle=gold; ctx.strokeStyle=goldD; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(-8,-3.6); ctx.lineTo(8,-3.6); ctx.lineTo(6,0.4); ctx.lineTo(-6,0.4); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle='#7c4a2a'; ctx.strokeStyle='#4a2a15'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.rect(-1.8,0,3.6,6.5); ctx.fill(); ctx.stroke();
  ctx.fillStyle=gold; ctx.strokeStyle=goldD; dvc_ell(ctx,0,7.6,2.3,2.3);
  ctx.restore();

  // 靴（金属ブーツ）
  ctx.fillStyle=steelD; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(-9,-10); ctx.lineTo(-2,-10); ctx.lineTo(-1.6,-1.8);
  ctx.quadraticCurveTo(-5,0.4,-9.4,-1.8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2.5,-10); ctx.lineTo(9.5,-10); ctx.lineTo(10,-1.8);
  ctx.quadraticCurveTo(6,0.4,2.1,-1.8); ctx.closePath(); ctx.fill(); ctx.stroke();

  // 胴（胸当て）
  var tg = ctx.createLinearGradient(-11,-32,10,-10);
  tg.addColorStop(0,P.lite2); tg.addColorStop(0.5,P.col); tg.addColorStop(1,P.dark);
  ctx.fillStyle=tg; ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-10.5,-30);
  ctx.quadraticCurveTo(-12,-20,-9,-13);
  ctx.lineTo(9.5,-13);
  ctx.quadraticCurveTo(12.5,-20,11,-30);
  ctx.quadraticCurveTo(1.5,-27,-10.5,-30);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 腰当て
  ctx.fillStyle=P.dark;
  ctx.beginPath();
  ctx.moveTo(-9.5,-14); ctx.lineTo(10,-14); ctx.lineTo(8.5,-8.5);
  ctx.quadraticCurveTo(0.5,-6.5,-8,-8.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 胸のV字と宝石
  ctx.strokeStyle=gold; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-7,-27.5); ctx.lineTo(0.5,-19.5); ctx.lineTo(8,-27.5); ctx.stroke();
  ctx.fillStyle='#8ff0ff'; ctx.strokeStyle='#2c86ad'; ctx.lineWidth=1.1;
  ctx.beginPath();
  ctx.moveTo(0.5,-25.5); ctx.lineTo(3,-22.5); ctx.lineTo(0.5,-19.6); ctx.lineTo(-2,-22.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // ベルト
  ctx.fillStyle='#5b4327'; ctx.strokeStyle='#2f2113'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.rect(-9.5,-15.5,19.5,3); ctx.fill(); ctx.stroke();
  ctx.fillStyle=gold; ctx.strokeStyle=goldD; ctx.lineWidth=1;
  ctx.beginPath(); ctx.rect(-1,-16,4,4); ctx.fill(); ctx.stroke();

  // 後ろ腕（剣を握る）
  ctx.fillStyle=P.dark; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-8,-28); ctx.quadraticCurveTo(-14,-26,-13,-19-s);
  ctx.quadraticCurveTo(-9,-18,-7,-23); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=steel; ctx.strokeStyle=steelD; dvc_ell(ctx,-12.8,-19.5-s,3,3);
  // 前腕（拳を握る）
  ctx.fillStyle=P.lite; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(9,-28); ctx.quadraticCurveTo(15,-25,14,-17+s);
  ctx.quadraticCurveTo(10,-16,8.5,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=steel; ctx.strokeStyle=steelD; dvc_ell(ctx,13.6,-16.5+s,3.2,3.2);

  // 肩当て（大きく張り出す＝剣士のシルエット）
  var pg = ctx.createLinearGradient(0,-36,0,-24);
  pg.addColorStop(0,dvc_sh(P.col,0.5)); pg.addColorStop(1,P.dark);
  ctx.fillStyle=pg; ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-15.5,-27.5); ctx.quadraticCurveTo(-16,-35.5,-8,-34.5);
  ctx.quadraticCurveTo(-4.5,-33.5,-4,-27.5);
  ctx.quadraticCurveTo(-10,-25.5,-15.5,-27.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(16.5,-27.5); ctx.quadraticCurveTo(17,-35.5,9,-34.5);
  ctx.quadraticCurveTo(5.5,-33.5,5,-27.5);
  ctx.quadraticCurveTo(11,-25.5,16.5,-27.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle=gold; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(-15,-28.6); ctx.quadraticCurveTo(-10,-26.8,-4.4,-28.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16,-28.6); ctx.quadraticCurveTo(11,-26.8,5.4,-28.6); ctx.stroke();

  // 頭
  dvc_headBase(ctx,P);
  dvc_face(ctx,P);

  // 兜（額まで覆う＋鼻当て＋頬当て）
  var hg = ctx.createLinearGradient(-12,-56,12,-40);
  hg.addColorStop(0,'#e7eefb'); hg.addColorStop(0.5,steel); hg.addColorStop(1,steelD);
  ctx.fillStyle=hg; ctx.strokeStyle='#54607c'; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-12,-40);
  ctx.quadraticCurveTo(-12.5,-55,1.5,-55.5);
  ctx.quadraticCurveTo(15.5,-55,15,-40);
  ctx.quadraticCurveTo(12,-42.5,9,-44.5);
  ctx.quadraticCurveTo(1.5,-47.5,-6,-44.5);
  ctx.quadraticCurveTo(-9.5,-42.5,-12,-40);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 頬当て
  ctx.beginPath();
  ctx.moveTo(-11.8,-43); ctx.quadraticCurveTo(-13.5,-35,-9.5,-31.5);
  ctx.quadraticCurveTo(-7,-35,-7.5,-43); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(14.8,-43); ctx.quadraticCurveTo(16.5,-35,12.5,-31.5);
  ctx.quadraticCurveTo(10,-35,10.5,-43); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 鼻当て
  ctx.beginPath();
  ctx.moveTo(0.2,-46); ctx.lineTo(3.2,-46); ctx.lineTo(2.8,-34.5);
  ctx.quadraticCurveTo(1.7,-33.4,0.6,-34.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 前立て（クレスト）
  ctx.fillStyle=gold; ctx.strokeStyle=goldD; ctx.lineWidth=1.3;
  ctx.beginPath();
  ctx.moveTo(-5,-54.5); ctx.quadraticCurveTo(1.5,-63,8,-54.2);
  ctx.quadraticCurveTo(1.5,-57.5,-5,-54.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  // なびく羽根飾り
  ctx.fillStyle=dvc_mix(P.col,'#ff4d4d',0.45); ctx.strokeStyle=P.ink; ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(-2.5,-57.8);
  ctx.quadraticCurveTo(-10.5,-58,-13.5,-49.5);
  ctx.quadraticCurveTo(-9.5,-51.5,-6.5,-52);
  ctx.quadraticCurveTo(-4,-54,-2.5,-57.8);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  dvc_rim(ctx,[-12,-41, -12.5,-53, 0,-55.3], 1.7, 0.65);
  dvc_rim(ctx,[-15.4,-28.5, -15.5,-34, -8.5,-34.4], 1.5, 0.5);
}

/* ---------- id2：緑のフードの弓使い ---------- */
function dvc_archer(ctx,P){
  var s = P.sway, acc = dvc_mix(P.col,'#2f7d4a',0.4);

  // 背中のマント
  ctx.fillStyle=dvc_sh(acc,-0.2); ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-7,-33);
  ctx.quadraticCurveTo(-17,-24,-16,-6);
  ctx.quadraticCurveTo(-11,-3,-6,-6);
  ctx.quadraticCurveTo(-7,-20,-3,-30);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // 矢筒（背中）
  ctx.save();
  ctx.translate(-11,-28); ctx.rotate(-0.42);
  ctx.fillStyle='#8b5a2b'; ctx.strokeStyle='#4d2f14'; ctx.lineWidth=1.3;
  ctx.beginPath(); ctx.rect(-4.2,-6,8.4,18); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='#c8a97a'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(-4.2,1); ctx.lineTo(4.2,1); ctx.stroke();
  ctx.strokeStyle='#5c3a1c'; ctx.lineWidth=1.7;
  ctx.beginPath();
  ctx.moveTo(-2.4,-6); ctx.lineTo(-2.4,-17); ctx.moveTo(0.4,-6); ctx.lineTo(0.4,-20);
  ctx.moveTo(3.2,-6); ctx.lineTo(3.2,-15.5); ctx.stroke();
  ctx.fillStyle='#f4faff'; ctx.strokeStyle='#b9cbdd'; ctx.lineWidth=0.9;
  ctx.beginPath(); ctx.moveTo(-2.4,-17.5); ctx.lineTo(-5.2,-13.5); ctx.lineTo(-2.4,-12.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0.4,-20.5); ctx.lineTo(-2.4,-16.5); ctx.lineTo(0.4,-15.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3.2,-16); ctx.lineTo(0.4,-12); ctx.lineTo(3.2,-11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();

  // 靴
  ctx.fillStyle='#7a5230'; ctx.strokeStyle='#3f2a15'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(-8.5,-11); ctx.lineTo(-2.2,-11); ctx.lineTo(-1.8,-2);
  ctx.quadraticCurveTo(-5.5,0.2,-9,-2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2.6,-11); ctx.lineTo(9,-11); ctx.lineTo(9.5,-2);
  ctx.quadraticCurveTo(6,0.2,2.2,-2); ctx.closePath(); ctx.fill(); ctx.stroke();

  // チュニック
  var tg = ctx.createLinearGradient(-10,-33,9,-8);
  tg.addColorStop(0,P.lite2); tg.addColorStop(0.5,P.col); tg.addColorStop(1,P.dark);
  ctx.fillStyle=tg; ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-9,-31);
  ctx.quadraticCurveTo(-11.5,-21,-10,-9);
  ctx.quadraticCurveTo(-4,-11.5,1,-9.5);
  ctx.quadraticCurveTo(6.5,-11.5,11,-9);
  ctx.quadraticCurveTo(12.5,-21,10,-31);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // ベルト＋斜め帯
  ctx.fillStyle='#6b4526'; ctx.strokeStyle='#3b2412'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.rect(-10.2,-17.5,21,3.2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#8b5a2b';
  ctx.beginPath();
  ctx.moveTo(-8.5,-30); ctx.lineTo(-4.5,-30.5); ctx.lineTo(8,-15.5); ctx.lineTo(4,-15); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle='#ffd257'; ctx.strokeStyle='#a5761b'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.rect(-1.5,-18,4,4.2); ctx.fill(); ctx.stroke();

  // 後ろ腕（弦を引く）
  ctx.fillStyle=P.dark; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-7,-29); ctx.quadraticCurveTo(-2,-27,1,-23-s);
  ctx.quadraticCurveTo(-3,-21,-6.5,-24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=P.skin; ctx.strokeStyle='#a9754f'; dvc_ell(ctx,1.6,-23-s,2.6,2.6);

  // 弓（前手で構える・大きな弧）
  var bcx = 8, bcy = -27, br = 17.5, ba = 1.32;
  ctx.strokeStyle='#3f2712'; ctx.lineWidth=5.2; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(bcx,bcy,br,-ba,ba); ctx.stroke();
  ctx.strokeStyle='#a4682f'; ctx.lineWidth=3.2;
  ctx.beginPath(); ctx.arc(bcx,bcy,br,-ba,ba); ctx.stroke();
  ctx.save(); ctx.globalAlpha=0.5; ctx.strokeStyle='#e6c08a'; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.arc(bcx,bcy,br+1.2,-ba+0.12,ba-0.12); ctx.stroke(); ctx.restore();
  // 弦
  var bx = bcx+br*Math.cos(ba), by = br*Math.sin(ba);
  ctx.strokeStyle='#e8f3ff'; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.moveTo(bx,bcy-by); ctx.lineTo(bx-0.6,bcy); ctx.lineTo(bx,bcy+by); ctx.stroke();
  // 握り
  ctx.fillStyle='#5b3a1c'; ctx.strokeStyle='#331e0c'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.rect(bcx+br-2.4,-30.5,4,7); ctx.fill(); ctx.stroke();

  // 前腕
  ctx.fillStyle=P.lite; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(8,-30); ctx.quadraticCurveTo(17,-30.5,22,-27.5+s*0.5);
  ctx.quadraticCurveTo(17,-24,9,-25.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=P.skin; ctx.strokeStyle='#a9754f'; dvc_ell(ctx,22.5,-27+s*0.5,2.9,2.9);

  // 頭
  dvc_headBase(ctx,P);
  dvc_face(ctx,P);

  // フード（後ろのたれ＋前のふち）
  ctx.fillStyle=dvc_sh(acc,-0.12); ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-6,-53);
  ctx.quadraticCurveTo(-19,-52,-20.5,-40);
  ctx.quadraticCurveTo(-14,-44,-9,-44.5);
  ctx.quadraticCurveTo(-7,-48,-6,-53);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  var fg = ctx.createLinearGradient(-12,-54,12,-38);
  fg.addColorStop(0,dvc_sh(acc,0.28)); fg.addColorStop(1,dvc_sh(acc,-0.25));
  ctx.fillStyle=fg; ctx.strokeStyle=P.ink;
  ctx.beginPath();
  ctx.moveTo(-13,-38);
  ctx.quadraticCurveTo(-14,-56,1.5,-56.5);
  ctx.quadraticCurveTo(16,-56,15.5,-37.5);
  ctx.quadraticCurveTo(12.5,-41,9,-44);
  ctx.quadraticCurveTo(1.5,-48.5,-7,-44);
  ctx.quadraticCurveTo(-10.5,-41,-13,-38);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // フードの横たれ
  ctx.beginPath();
  ctx.moveTo(-13,-40); ctx.quadraticCurveTo(-15,-32,-11,-29);
  ctx.quadraticCurveTo(-8.5,-33,-9,-41); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15.4,-40); ctx.quadraticCurveTo(17,-32,13,-29);
  ctx.quadraticCurveTo(10.5,-33,11,-41); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 前髪
  ctx.fillStyle='#5f4326'; ctx.strokeStyle='#3a2814'; ctx.lineWidth=1.1;
  ctx.beginPath();
  ctx.moveTo(-7.5,-44.5); ctx.quadraticCurveTo(1.5,-49,9.5,-44.5);
  ctx.quadraticCurveTo(6,-43,2,-44); ctx.quadraticCurveTo(-3,-42.6,-7.5,-44.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 首のスカーフ
  ctx.fillStyle=dvc_sh(acc,0.35); ctx.strokeStyle=P.ink; ctx.lineWidth=1.3;
  ctx.beginPath();
  ctx.moveTo(-8,-31.5); ctx.quadraticCurveTo(1.5,-28,10,-31.5);
  ctx.quadraticCurveTo(1.5,-25.5,-8,-31.5); ctx.closePath(); ctx.fill(); ctx.stroke();

  dvc_rim(ctx,[-13,-39, -14,-53, 1,-56.3], 1.7, 0.62);
  dvc_rim(ctx,[-9,-32, -11.5,-21, -10,-10], 1.5, 0.4);
}

/* ---------- id3：金の王冠の商人 ---------- */
function dvc_merchant(ctx,P){
  var s = P.sway, gold = '#ffd257', goldL = '#fff0b0', goldD = '#a5761b';

  // 背中のマント
  ctx.fillStyle=dvc_sh(P.col,-0.35); ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-6,-33);
  ctx.quadraticCurveTo(-19,-26,-18,-5);
  ctx.quadraticCurveTo(-12,-2,-6,-5.5);
  ctx.quadraticCurveTo(-8,-20,-2,-31);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle=gold; ctx.lineWidth=1.3;
  ctx.beginPath(); ctx.moveTo(-17.6,-6.5); ctx.quadraticCurveTo(-12,-3.2,-6.4,-6.6); ctx.stroke();

  // 靴
  ctx.fillStyle='#4a3a5c'; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  dvc_ell(ctx,-5,-2.6,4.4,2.9); dvc_ell(ctx,5.8,-2.6,4.4,2.9);

  // 胴（丸いおなか）
  var bg = ctx.createLinearGradient(-11,-32,10,-4);
  bg.addColorStop(0,P.lite2); bg.addColorStop(0.5,P.col); bg.addColorStop(1,P.dark);
  ctx.fillStyle=bg; ctx.strokeStyle=P.ink; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-8.5,-31);
  ctx.quadraticCurveTo(-14,-20,-11,-7);
  ctx.quadraticCurveTo(1.5,-4,12,-7);
  ctx.quadraticCurveTo(14.5,-20,9.5,-31);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // ボタン
  ctx.fillStyle=gold; ctx.strokeStyle=goldD; ctx.lineWidth=1;
  dvc_ell(ctx,1.5,-26,1.5,1.5); dvc_ell(ctx,1.8,-21,1.5,1.5); dvc_ell(ctx,2.1,-16,1.5,1.5);
  // ベルト
  ctx.fillStyle='#4b3a24'; ctx.strokeStyle='#2a1e11'; ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(-11.6,-13.5); ctx.quadraticCurveTo(1.5,-10.5,12.8,-13.5);
  ctx.lineTo(12.4,-10); ctx.quadraticCurveTo(1.5,-7,-11.8,-10); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle=gold; ctx.strokeStyle=goldD; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.rect(-1.5,-13.6,5,4.6); ctx.fill(); ctx.stroke();

  // 後ろ腕
  ctx.fillStyle=P.dark; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-7,-29); ctx.quadraticCurveTo(-14,-25,-13,-16-s);
  ctx.quadraticCurveTo(-9,-15,-6.5,-21); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=P.skin; ctx.strokeStyle='#a9754f'; dvc_ell(ctx,-12.8,-15.5-s,2.7,2.7);

  // 毛皮の襟
  ctx.fillStyle='#fbf6e6'; ctx.strokeStyle='#c9bd9c'; ctx.lineWidth=1.3;
  ctx.beginPath();
  ctx.moveTo(-10,-30.5);
  ctx.quadraticCurveTo(-6,-34.5,-1,-31.5);
  ctx.quadraticCurveTo(4,-34.5,11,-30.5);
  ctx.quadraticCurveTo(4,-26,-1,-28);
  ctx.quadraticCurveTo(-6,-26,-10,-30.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // 前腕（袋を持つ）
  ctx.fillStyle=P.lite; ctx.strokeStyle=P.ink; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(8,-29); ctx.quadraticCurveTo(15.5,-27.5,16.5,-21+s);
  ctx.quadraticCurveTo(11.5,-19.5,9,-23); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=P.skin; ctx.strokeStyle='#a9754f'; dvc_ell(ctx,16.6,-20+s,2.8,2.8);

  // コイン袋（ふくらんだ麻袋＋口を縛った紐）
  var sg = ctx.createLinearGradient(11,-19,24,-2);
  sg.addColorStop(0,'#e0c396'); sg.addColorStop(0.55,'#c2a06c'); sg.addColorStop(1,'#8d6a3c');
  ctx.fillStyle=sg; ctx.strokeStyle='#5b3f1f'; ctx.lineWidth=1.6;
  ctx.beginPath();
  ctx.moveTo(13.5,-17.5);
  ctx.quadraticCurveTo(5,-13,7,-5);
  ctx.quadraticCurveTo(11,-0.5,18,-1.2);
  ctx.quadraticCurveTo(26,-3,25,-11);
  ctx.quadraticCurveTo(24,-16,19.5,-17.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 口の縛り
  ctx.strokeStyle='#5b3f1f'; ctx.lineWidth=1.8;
  ctx.beginPath(); ctx.moveTo(13.2,-17.2); ctx.quadraticCurveTo(16.5,-14.4,19.8,-17.2); ctx.stroke();
  ctx.strokeStyle=goldD; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(13.4,-15.8); ctx.quadraticCurveTo(16.5,-13,19.6,-15.8); ctx.stroke();
  // はみ出す金貨
  ctx.fillStyle=goldL; ctx.strokeStyle=goldD; ctx.lineWidth=1.1;
  dvc_ell(ctx,15.5,-8.5,3.6,3.6);
  dvc_ell(ctx,21,-6.5,2.8,2.8);
  ctx.strokeStyle=goldD; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(13.4,-10.2); ctx.lineTo(17.6,-6.8);
  ctx.moveTo(19.4,-7.6); ctx.lineTo(22.6,-5.4); ctx.stroke();

  // 頭
  dvc_headBase(ctx,P);
  // 髪（王冠の下からのぞく）
  ctx.fillStyle='#7c4a20'; ctx.strokeStyle='#4a2b11'; ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(-12.5,-42); ctx.quadraticCurveTo(-13.5,-53,1.5,-53.5);
  ctx.quadraticCurveTo(15,-53,14.5,-41.5);
  ctx.quadraticCurveTo(12.5,-46,8.5,-47);
  ctx.quadraticCurveTo(1.5,-50,-6,-46.5);
  ctx.quadraticCurveTo(-10.5,-45,-12.5,-42);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12.4,-44); ctx.quadraticCurveTo(-15,-36,-11.5,-32);
  ctx.quadraticCurveTo(-9,-37,-9.5,-45); ctx.closePath(); ctx.fill(); ctx.stroke();
  dvc_face(ctx,P);
  // 片眼鏡
  ctx.strokeStyle=gold; ctx.lineWidth=1.3;
  ctx.beginPath(); ctx.arc(6,-40,4.2,0,Math.PI*2); ctx.stroke();
  ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle='#ffffff';
  ctx.beginPath(); ctx.arc(6,-40,4,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.strokeStyle=goldD; ctx.lineWidth=0.9;
  ctx.beginPath(); ctx.moveTo(9.6,-38.2); ctx.quadraticCurveTo(12,-34,10.5,-30.5); ctx.stroke();

  // 王冠
  var cg = ctx.createLinearGradient(-10,-60,12,-48);
  cg.addColorStop(0,goldL); cg.addColorStop(0.5,gold); cg.addColorStop(1,goldD);
  ctx.fillStyle=cg; ctx.strokeStyle='#8a5f14'; ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-11,-49.5);
  ctx.lineTo(-9.5,-60.5); ctx.lineTo(-4,-54.5);
  ctx.lineTo(1.5,-62.5);  ctx.lineTo(7,-54.5);
  ctx.lineTo(12.5,-60.5); ctx.lineTo(14,-49.5);
  ctx.quadraticCurveTo(1.5,-45.5,-11,-49.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 冠の帯と宝石
  ctx.fillStyle='#ff5f7a'; ctx.strokeStyle='#8c2338'; ctx.lineWidth=1;
  dvc_ell(ctx,1.5,-50.5,2.2,2.2);
  ctx.fillStyle='#6fe0ff'; ctx.strokeStyle='#2c86ad';
  dvc_ell(ctx,-6,-49.6,1.5,1.5); dvc_ell(ctx,9,-49.6,1.5,1.5);
  ctx.fillStyle=goldL; ctx.strokeStyle='#8a5f14';
  dvc_ell(ctx,-9.5,-61.4,1.5,1.5); dvc_ell(ctx,1.5,-63.4,1.7,1.7); dvc_ell(ctx,12.5,-61.4,1.5,1.5);

  dvc_rim(ctx,[-11,-49.5, -12,-56, -9.5,-60.5], 1.6, 0.6);
  dvc_rim(ctx,[-9,-31, -13,-20, -11,-8], 1.5, 0.4);
  // きらめき（決定的な位置）
  ctx.save(); ctx.globalAlpha=0.85;
  dvc_spark(ctx, 20+dvc_rnd(3)*2, -20-dvc_rnd(7)*3, 2.4, '#fff3c4');
  dvc_spark(ctx, 8+dvc_rnd(11)*2, -60-dvc_rnd(5)*2, 1.8, '#fff3c4');
  ctx.restore();
}

/* ───── a56ac6c2d1f109950 ───── */
function dvDie(ctx, face, spin, size){
  // ---- 引数の正規化 ----
  const dvTAU = Math.PI * 2;
  const dvS  = (typeof size === 'number' && size > 0) ? size : 52;
  const dvF  = Math.max(1, Math.min(6, Math.round(face || 1)));
  const dvSP = (typeof spin === 'number' && isFinite(spin) && spin > 0) ? spin : 0;

  // 決定的な擬似乱数（毎フレーム同じ絵になるよう Math.random / Date.now は使わない）
  function dvRnd(i){ const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ---- 幾何：上面ひし形は 横:縦 = 1:0.585 のアイソメ ----
  const TX = dvS * 0.600;   // 上面ひし形の半幅
  const TY = TX  * 0.585;   // 上面ひし形の半高
  const HH = TX  * 1.06;    // 側面の縦の高さ

  // 上面が dvF のとき、手前左・手前右に出る目（対面の和=7 を満たす本物の配置）
  const LRT = [null, [2,3], [6,3], [2,6], [2,1], [1,3], [2,4]];
  const fL = LRT[dvF][0], fR = LRT[dvF][1];

  // 立方体の頂点（中心が 0,0）
  const vN  = {x: 0,   y: -TY - HH/2};
  const vE  = {x: TX,  y: -HH/2};
  const vW  = {x:-TX,  y: -HH/2};
  const vS  = {x: 0,   y:  TY - HH/2};
  const vEb = {x: TX,  y:  HH/2};
  const vWb = {x:-TX,  y:  HH/2};
  const vSb = {x: 0,   y:  TY + HH/2};

  // ---- 角丸ポリゴン（辺の中点から arcTo で角を丸める）----
  function dvPoly(pts, r){
    const n = pts.length;
    let mn = 1e9;
    for(let i = 0; i < n; i++){
      const a = pts[i], b = pts[(i+1)%n];
      const d = Math.sqrt((b.x-a.x)*(b.x-a.x) + (b.y-a.y)*(b.y-a.y));
      if(d < mn) mn = d;
    }
    const rr = Math.max(0, Math.min(r, mn * 0.48));
    ctx.beginPath();
    ctx.moveTo((pts[n-1].x + pts[0].x)/2, (pts[n-1].y + pts[0].y)/2);
    for(let i = 0; i < n; i++){
      const p = pts[i], q = pts[(i+1)%n];
      ctx.arcTo(p.x, p.y, (p.x+q.x)/2, (p.y+q.y)/2, rr);
    }
    ctx.closePath();
  }

  // 面を重心方向へ縮める（角丸の胴体を縁として覗かせ、丸い立方体に見せる）
  function dvIn(pts, k){
    let cx = 0, cy = 0;
    for(let i = 0; i < pts.length; i++){ cx += pts[i].x; cy += pts[i].y; }
    cx /= pts.length; cy /= pts.length;
    const o = [];
    for(let i = 0; i < pts.length; i++) o.push({x: cx + (pts[i].x-cx)*k, y: cy + (pts[i].y-cy)*k});
    return o;
  }

  // 目の並び（面ローカル -1..1）
  function dvLay(v){
    const k = 0.50;
    if(v === 1) return [[0,0]];
    if(v === 2) return [[-k,-k],[k,k]];
    if(v === 3) return [[-k,-k],[0,0],[k,k]];
    if(v === 4) return [[-k,-k],[k,-k],[-k,k],[k,k]];
    if(v === 5) return [[-k,-k],[k,-k],[0,0],[-k,k],[k,k]];
    return [[-k,-0.60],[-k,0],[-k,0.60],[k,-0.60],[k,0],[k,0.60]];
  }

  // 面ローカル→画面 の行列を掛けてピップを描く（円が面の平行四辺形に沿って歪む）
  function dvPips(m, v, rad, col, halo){
    const L  = dvLay(v);
    const rr = (v === 6) ? rad * 0.82 : rad;
    ctx.save();
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    for(let i = 0; i < L.length; i++){
      const u = L[i][0], w = L[i][1];
      if(halo){ // 上面のピップは白っぽい縁に囲まれている（本家の特徴）
        ctx.beginPath(); ctx.arc(u, w, rr * 1.15, 0, dvTAU);
        ctx.fillStyle = 'rgba(255,255,255,0.50)'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(u, w, rr, 0, dvTAU);
      ctx.fillStyle = col; ctx.fill();
      ctx.beginPath(); ctx.arc(u - rr*0.20, w - rr*0.26, rr*0.46, 0, dvTAU);
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
    }
    ctx.restore();
  }

  // ---- 立方体一体を描く（残像でも使い回す）----
  function dvPaint(alpha, ang, ox, oy, sq){
    const sil = [vN, vE, vEb, vSb, vWb, vW];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ox, oy);
    if(ang) ctx.rotate(ang);
    if(sq !== 1) ctx.scale(1, sq);

    // 1) 胴体（角丸の立方体シルエット）: 左上が明るい淡ピンク→右下がローズ
    let g = ctx.createLinearGradient(-TX, vN.y, TX, vSb.y);
    g.addColorStop(0.00, '#FFF2ED');
    g.addColorStop(0.28, '#FAD2CD');
    g.addColorStop(0.62, '#EDAEB1');
    g.addColorStop(1.00, '#BE7683');
    dvPoly(sil, dvS * 0.15); ctx.fillStyle = g; ctx.fill();

    // 2) 手前左の面（光源が左上なので明るい）
    const fl = dvIn([vW, vS, vSb, vWb], 0.90);
    g = ctx.createLinearGradient(0, vW.y, 0, vSb.y);
    g.addColorStop(0.00, '#FBDBD6');
    g.addColorStop(0.55, '#EDB4B4');
    g.addColorStop(1.00, '#CE8C95');
    dvPoly(fl, dvS * 0.11); ctx.fillStyle = g; ctx.fill();

    // 3) 手前右の面（陰側なので一段暗い）
    const fr = dvIn([vS, vE, vEb, vSb], 0.90);
    g = ctx.createLinearGradient(0, vE.y, 0, vSb.y);
    g.addColorStop(0.00, '#EEBEBD');
    g.addColorStop(0.55, '#D89BA1');
    g.addColorStop(1.00, '#AC707E');
    dvPoly(fr, dvS * 0.11); ctx.fillStyle = g; ctx.fill();

    // 4) 上面プレート（本家は一段くぼんだ白いプレート＋細い暗紫の輪郭）
    const tp = dvIn([vN, vE, vS, vW], 0.86);
    g = ctx.createLinearGradient(0, vN.y, 0, vS.y);
    g.addColorStop(0.00, '#FFFDFB');
    g.addColorStop(0.50, '#FFEBE1');
    g.addColorStop(1.00, '#F6D0C7');
    dvPoly(tp, dvS * 0.13); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = dvS * 0.022;
    ctx.strokeStyle = 'rgba(122,84,94,0.55)';
    ctx.stroke();
    ctx.save();                         // プレートは一段くぼんでいるので上側に内影
    ctx.clip();
    const ps = ctx.createLinearGradient(0, vN.y, 0, vN.y + TY * 1.3);
    ps.addColorStop(0, 'rgba(150,96,108,0.22)');
    ps.addColorStop(1, 'rgba(150,96,108,0)');
    ctx.fillStyle = ps;
    ctx.fillRect(-TX, vN.y, TX * 2, TY * 1.4);
    ctx.restore();

    // 5) 左上のスペキュラ（シルエットで切り抜いて艶を出す）
    ctx.save();
    dvPoly(sil, dvS * 0.15); ctx.clip();
    const rg = ctx.createRadialGradient(-TX*0.40, -TY*0.55 - HH/2, 0, -TX*0.40, -TY*0.55 - HH/2, dvS*0.55);
    rg.addColorStop(0, 'rgba(255,255,255,0.42)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(-TX*1.2, vN.y, TX*2.4, (vSb.y - vN.y));
    ctx.restore();

    // 6) ピップ（上面は大きく、側面は面に沿って歪む）
    dvPips([TX/2*0.86, -TY/2*0.86, TX/2*0.86, TY/2*0.86, 0, -HH/2], dvF, 0.31, '#C86B7A', true);
    dvPips([TX/2*0.90,  TY/2*0.90, 0, HH/2*0.90, -TX/2, TY/2], fL, 0.29, '#B4606F', false);
    dvPips([TX/2*0.90, -TY/2*0.90, 0, HH/2*0.90,  TX/2, TY/2], fR, 0.29, '#9C5263', false);

    // 7) 上の稜線のリムライト（W→N→E）
    const rim = dvIn([vN, vE, vS, vW], 0.95);
    ctx.beginPath();
    ctx.moveTo(rim[3].x, rim[3].y);
    ctx.lineTo(rim[0].x, rim[0].y);
    ctx.lineTo(rim[1].x, rim[1].y);
    ctx.lineWidth = dvS * 0.05;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.40)';
    ctx.stroke();

    // 8) 手前の縦稜線に軽い陰（2面の折れを立たせる）
    ctx.beginPath();
    ctx.moveTo(vS.x, vS.y + dvS*0.05);
    ctx.lineTo(vSb.x, vSb.y - dvS*0.07);
    ctx.lineWidth = dvS * 0.055;
    ctx.strokeStyle = 'rgba(120,70,80,0.13)';
    ctx.stroke();

    // 9) 全体の輪郭
    dvPoly(sil, dvS * 0.15);
    ctx.lineWidth = dvS * 0.03;
    ctx.strokeStyle = 'rgba(116,64,74,0.30)';
    ctx.stroke();

    ctx.restore();
  }

  // ---- 描画本体 ----
  ctx.save();

  const ph  = dvSP * dvTAU;                                  // 位相（0と1で連続）
  const amp = Math.min(1, dvSP * 8);                         // 静止からの立ち上がり
  const ang = ph;                                            // 転がりの回転角
  const bob = -Math.abs(Math.sin(ph)) * dvS * 0.16 * amp;    // 跳ね上がり
  const sq  = 1 - 0.09 * Math.sin(ph * 2) * amp;             // つぶれ

  // 接地影
  ctx.save();
  ctx.translate(0, TY + HH/2 + dvS * 0.08);
  ctx.scale(1, 0.32);
  const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, TX * 1.05);
  sh.addColorStop(0, 'rgba(28,24,46,0.26)');
  sh.addColorStop(1, 'rgba(28,24,46,0)');
  ctx.beginPath(); ctx.arc(0, 0, TX * 1.05, 0, dvTAU);
  ctx.fillStyle = sh; ctx.fill();
  ctx.restore();

  // 転がり中の残像
  if(dvSP > 0.02){
    dvPaint(0.25, ang - 0.30, -dvS * 0.10, bob + dvS * 0.05, sq);
    dvPaint(0.13, ang - 0.60, -dvS * 0.19, bob + dvS * 0.10, sq);
  }

  // 本体
  dvPaint(1, ang, 0, bob, sq);

  // 転がり中の黄色いきらめき（本家は光の粒が舞う）
  if(dvSP > 0.02){
    for(let i = 0; i < 7; i++){
      const a  = dvRnd(i) * dvTAU + ph * 1.7;
      const rr = dvS * (0.72 + dvRnd(i + 40) * 0.40);
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.55;
      const ss = dvS * 0.05 * (0.6 + dvRnd(i + 80) * 0.9);
      ctx.save();
      ctx.globalAlpha = amp * (0.30 + 0.45 * dvRnd(i + 120));
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -ss);
      ctx.quadraticCurveTo( ss*0.22, -ss*0.22,  ss, 0);
      ctx.quadraticCurveTo( ss*0.22,  ss*0.22,  0,  ss);
      ctx.quadraticCurveTo(-ss*0.22,  ss*0.22, -ss, 0);
      ctx.quadraticCurveTo(-ss*0.22, -ss*0.22,  0, -ss);
      ctx.closePath();
      ctx.fillStyle = '#FFE27A';
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ───── a894778f329419772 ───── */
/* ===== 盤外の札束と盤上の小道具（本家「氷の洞窟」の質感に寄せる） ===== */

/* 決定的な擬似乱数（Math.random 禁止のため） */
function dv_rnd(i){ const x = Math.sin(i*127.1+311.7)*43758.5453; return x - Math.floor(x); }

/* 落ち影：横長のにじんだ楕円 */
function dv_shadow(ctx, cx, cy, rx, ry, a){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry/rx);
  const g = ctx.createRadialGradient(0,0,0, 0,0,rx);
  g.addColorStop(0,   'rgba(5,12,30,'+a+')');
  g.addColorStop(0.5, 'rgba(5,12,30,'+(a*0.62)+')');
  g.addColorStop(1,   'rgba(5,12,30,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0,0,rx,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

/* 角丸ポリゴン（アイソメのひし形を角丸にするのに使う） */
function dv_roundPoly(ctx, pts, r){
  const n = pts.length;
  ctx.beginPath();
  for(let i=0;i<n;i++){
    const p0=pts[(i-1+n)%n], p1=pts[i], p2=pts[(i+1)%n];
    const d1=Math.hypot(p1[0]-p0[0], p1[1]-p0[1]) || 1;
    const d2=Math.hypot(p2[0]-p1[0], p2[1]-p1[1]) || 1;
    const r1=Math.min(r, d1*0.5), r2=Math.min(r, d2*0.5);
    const ax=p1[0]+(p0[0]-p1[0])*r1/d1, ay=p1[1]+(p0[1]-p1[1])*r1/d1;
    const bx=p1[0]+(p2[0]-p1[0])*r2/d2, by=p1[1]+(p2[1]-p1[1])*r2/d2;
    if(i===0) ctx.moveTo(ax,ay); else ctx.lineTo(ax,ay);
    ctx.quadraticCurveTo(p1[0],p1[1], bx,by);
  }
  ctx.closePath();
}

/* 角丸長方形パス */
function dv_roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w*0.5, h*0.5);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.lineTo(x+w-rr, y); ctx.quadraticCurveTo(x+w, y, x+w, y+rr);
  ctx.lineTo(x+w, y+h-rr); ctx.quadraticCurveTo(x+w, y+h, x+w-rr, y+h);
  ctx.lineTo(x+rr, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-rr);
  ctx.lineTo(x, y+rr); ctx.quadraticCurveTo(x, y, x+rr, y);
  ctx.closePath();
}

/* 4方向にとがったキラリ（ひし形の光） */
function dv_sparkle(ctx, x, y, s, a){
  if(a<=0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x,y);
  const g = ctx.createRadialGradient(0,0,0, 0,0,s*1.6);
  g.addColorStop(0,'rgba(255,255,255,0.9)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,s*1.6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();
  ctx.moveTo(0,-s); ctx.quadraticCurveTo(s*0.16,-s*0.16, s,0);
  ctx.quadraticCurveTo(s*0.16,s*0.16, 0,s);
  ctx.quadraticCurveTo(-s*0.16,s*0.16, -s,0);
  ctx.quadraticCurveTo(-s*0.16,-s*0.16, 0,-s);
  ctx.fill();
  ctx.restore();
}

/* 札束ひとつ（アイソメの直方体）。cy は天面ひし形の中心Y */
function dv_bundle(ctx, cx, cy, W, H, bh, drawTop, seed){
  const lx=cx-W, rx=cx+W, by=cy+H;

  /* 右面（右下向き・やや暗い） */
  ctx.beginPath();
  ctx.moveTo(cx,by); ctx.lineTo(rx,cy); ctx.lineTo(rx,cy+bh); ctx.lineTo(cx,by+bh);
  ctx.closePath();
  let g = ctx.createLinearGradient(cx,by, rx,cy+bh);
  g.addColorStop(0,'#726c7c'); g.addColorStop(1,'#5b5468');
  ctx.fillStyle=g; ctx.fill();

  /* 左面（左下向き・明るい） */
  ctx.beginPath();
  ctx.moveTo(lx,cy); ctx.lineTo(cx,by); ctx.lineTo(cx,by+bh); ctx.lineTo(lx,cy+bh);
  ctx.closePath();
  g = ctx.createLinearGradient(lx,cy, cx,by+bh);
  g.addColorStop(0,'#a7a1ab'); g.addColorStop(1,'#847d8e');
  ctx.fillStyle=g; ctx.fill();

  /* 紙幣の縞（一枚一枚の小口） */
  ctx.save();
  ctx.lineWidth = 0.8;
  for(let k=1;k<4;k++){
    const t = bh*k/4;
    ctx.strokeStyle = 'rgba(255,255,255,'+(0.20 - k*0.03)+')';
    ctx.beginPath(); ctx.moveTo(lx,cy+t); ctx.lineTo(cx,by+t); ctx.lineTo(rx,cy+t); ctx.stroke();
    ctx.strokeStyle = 'rgba(28,24,40,0.28)';
    ctx.beginPath(); ctx.moveTo(lx,cy+t+0.9); ctx.lineTo(cx,by+t+0.9); ctx.lineTo(rx,cy+t+0.9); ctx.stroke();
  }
  ctx.restore();

  /* 中央の黒い帯（手前の角に巻いた札帯）。一番上の束だけ濃く */
  ctx.save();
  ctx.globalAlpha = drawTop ? 1 : 0.40;
  ctx.fillStyle = '#302c3b';
  const s0=0.76, s1=0.90;
  ctx.beginPath();
  ctx.moveTo(lx+(cx-lx)*s0, cy+(by-cy)*s0);
  ctx.lineTo(lx+(cx-lx)*s1, cy+(by-cy)*s1);
  ctx.lineTo(lx+(cx-lx)*s1, cy+(by-cy)*s1+bh);
  ctx.lineTo(lx+(cx-lx)*s0, cy+(by-cy)*s0+bh);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#25212e';
  ctx.beginPath();
  ctx.moveTo(cx+(rx-cx)*0.10, by+(cy-by)*0.10);
  ctx.lineTo(cx+(rx-cx)*0.24, by+(cy-by)*0.24);
  ctx.lineTo(cx+(rx-cx)*0.24, by+(cy-by)*0.24+bh);
  ctx.lineTo(cx+(rx-cx)*0.10, by+(cy-by)*0.10+bh);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  /* 稜線 */
  ctx.strokeStyle='rgba(255,255,255,0.30)'; ctx.lineWidth=0.9;
  ctx.beginPath(); ctx.moveTo(lx,cy); ctx.lineTo(cx,by); ctx.lineTo(rx,cy); ctx.stroke();

  if(!drawTop) return;

  /* 天面：角丸のひし形＝一番上のお札 */
  dv_roundPoly(ctx, [[cx,cy-H],[rx,cy],[cx,by],[lx,cy]], 3.4);
  g = ctx.createLinearGradient(cx,cy-H, cx,by);
  g.addColorStop(0,'#f2f5fa'); g.addColorStop(0.55,'#dbe1ec'); g.addColorStop(1,'#b8c0d0');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(80,86,104,0.55)'; ctx.lineWidth=0.9; ctx.stroke();

  /* 透かし窓（肖像のところ） */
  const k=0.55;
  dv_roundPoly(ctx, [[cx,cy-H*k],[cx+W*k,cy],[cx,cy+H*k],[cx-W*k,cy]], 1.6);
  g = ctx.createLinearGradient(cx,cy-H*k, cx,cy+H*k);
  g.addColorStop(0,'#bcc8d8'); g.addColorStop(1,'#96a5b9');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=0.8; ctx.stroke();

  /* 天面のきらめき（位置は seed から決定的に） */
  ctx.save();
  ctx.globalAlpha=0.75;
  ctx.fillStyle='#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - W*0.42 + dv_rnd(seed)*2, cy - H*0.18, W*0.20, H*0.20, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

/* =====================================================================
   dvMoneyStack : 盤の外に積む札束の山
   n = 段数 0..12（資産の可視化）。(0,0) 接地・上へ伸びる
   ===================================================================== */
function dvMoneyStack(ctx, n, T){
  ctx.save();

  T = +T || 0;
  n = Math.max(0, Math.min(12, Math.round(+n || 0)));
  const W = 13.4, H = W*0.585;          /* 敷き詰め用の格子 */
  const GW = W - 0.9, GH = GW*0.585;    /* 描画用（継ぎ目を出す） */
  const BH = 7.0;                       /* 札束1段の高さ */

  if(n <= 0){ ctx.restore(); return; }

  /* 3列（奥ほど高い階段）に段数を配る */
  const order = [2,1,2,0,2,1];
  const hs = [0,0,0];
  for(let i=0;i<n;i++) hs[order[i%6]]++;

  const offX = -1.5*W, offY = -2*H;

  /* 山全体の落ち影 */
  dv_shadow(ctx, 0, -2.1*H, 2.5*W, 1.55*H*2, 0.36);

  /* 奥（r=2）から手前（r=0）へ、各列は左奥→右手前の順で描く */
  for(let r=2;r>=0;r--){
    for(let c=0;c<=1;c++){
      const h = hs[r];
      if(h<=0) continue;
      const px = (r+c)*W + offX;
      const py = (-r+c)*H + offY;
      for(let k=0;k<h;k++){
        const topY = py - (k+1)*BH;
        dv_bundle(ctx, px, topY, GW, GH, BH, k===h-1, r*7+c*13+k);
      }
    }
  }

  /* 山が大きいときは光がこぼれる */
  if(n>=8){
    const a = 0.35 + 0.35*Math.sin(T/430);
    dv_sparkle(ctx, 1.4*W, -2*H - hs[2]*BH - 3, 3.6, a*0.9);
    dv_sparkle(ctx, 0.2*W, -3.4*H - hs[2]*BH + 2, 2.6, (0.7-a*0.5));
  }

  ctx.restore();
}

/* =====================================================================
   dvChest : 宝箱（ボーナスマス用）。(0,0)接地・高さ約34px
   ===================================================================== */
function dvChest(ctx, T){
  ctx.save();

  T = +T || 0;
  const W  = 15, H = W*0.585;    /* 天面ひし形（＝箱の上ぶち） */
  const BODY = 14;               /* 箱の胴の高さ */
  const LH   = 10.5;             /* ふたの盛り上がり */
  const WL = W + 1.6, HL = WL*0.585;  /* ふたは胴より少しはみ出す */
  const cy = -H - BODY;          /* 胴の上ぶちひし形の中心Y（接地は 0） */
  const by = cy + H;             /* 手前の角 */
  const lx = -W, rx = W;

  dv_shadow(ctx, 0, -H*0.85, W*1.55, H*2.2, 0.40);

  /* --- 胴：右面（暗い） --- */
  ctx.beginPath();
  ctx.moveTo(0,by); ctx.lineTo(rx,cy); ctx.lineTo(rx,cy+BODY); ctx.lineTo(0,by+BODY);
  ctx.closePath();
  let g = ctx.createLinearGradient(0,by, rx,cy+BODY);
  g.addColorStop(0,'#6a3d1e'); g.addColorStop(1,'#46250f');
  ctx.fillStyle=g; ctx.fill();

  /* --- 胴：左面（明るい） --- */
  ctx.beginPath();
  ctx.moveTo(lx,cy); ctx.lineTo(0,by); ctx.lineTo(0,by+BODY); ctx.lineTo(lx,cy+BODY);
  ctx.closePath();
  g = ctx.createLinearGradient(lx,cy, 0,by+BODY);
  g.addColorStop(0,'#a2632f'); g.addColorStop(1,'#6b3a17');
  ctx.fillStyle=g; ctx.fill();

  /* 板目（横に走る木の継ぎ目） */
  ctx.save();
  ctx.lineWidth=0.9;
  for(let k=1;k<3;k++){
    const t = BODY*k/3;
    ctx.strokeStyle='rgba(30,14,4,0.32)';
    ctx.beginPath(); ctx.moveTo(lx,cy+t); ctx.lineTo(0,by+t); ctx.lineTo(rx,cy+t); ctx.stroke();
    ctx.strokeStyle='rgba(255,205,150,0.13)';
    ctx.beginPath(); ctx.moveTo(lx,cy+t+1); ctx.lineTo(0,by+t+1); ctx.lineTo(rx,cy+t+1); ctx.stroke();
  }
  ctx.restore();

  /* 金の縦バンド（両面に1本ずつ） */
  const dvc_band = function(ax,ay,bx2,by2,s0,s1,hgt){
    ctx.beginPath();
    ctx.moveTo(ax+(bx2-ax)*s0, ay+(by2-ay)*s0);
    ctx.lineTo(ax+(bx2-ax)*s1, ay+(by2-ay)*s1);
    ctx.lineTo(ax+(bx2-ax)*s1, ay+(by2-ay)*s1+hgt);
    ctx.lineTo(ax+(bx2-ax)*s0, ay+(by2-ay)*s0+hgt);
    ctx.closePath();
    const gg = ctx.createLinearGradient(0, ay-4, 0, ay+hgt+4);
    gg.addColorStop(0,'#ffe79a'); gg.addColorStop(0.42,'#e0ab3c'); gg.addColorStop(1,'#8d6014');
    ctx.fillStyle=gg; ctx.fill();
    ctx.strokeStyle='rgba(70,44,8,0.45)'; ctx.lineWidth=0.7; ctx.stroke();
  };
  dvc_band(lx,cy, 0,by, 0.17,0.26, BODY);
  dvc_band(0,by, rx,cy, 0.74,0.83, BODY);

  /* 胴の下ぶち（金の足） */
  ctx.save();
  ctx.lineWidth=1.3; ctx.lineJoin='round';
  g = ctx.createLinearGradient(lx,0, rx,0);
  g.addColorStop(0,'#a97a1a'); g.addColorStop(0.5,'#ffe08a'); g.addColorStop(1,'#a97a1a');
  ctx.strokeStyle=g;
  ctx.beginPath(); ctx.moveTo(lx,cy+BODY); ctx.lineTo(0,by+BODY); ctx.lineTo(rx,cy+BODY); ctx.stroke();
  ctx.restore();

  /* --- ふた：手前2辺を通って奥へゆるく盛り上がるドーム --- */
  const ly = cy + 1.2;                 /* ふたの下ぶち（胴に少しかぶる） */
  const bly = ly + HL;
  const peakY = ly - LH;
  const cpY = ly - LH/0.75;            /* 3次ベジエの頂点が peakY になる制御点 */

  ctx.beginPath();
  ctx.moveTo(-WL, ly);
  ctx.lineTo(0, bly);
  ctx.lineTo(WL, ly);
  ctx.bezierCurveTo(WL*0.86, cpY, -WL*0.86, cpY, -WL, ly);
  ctx.closePath();
  g = ctx.createLinearGradient(0, peakY, 0, bly);
  g.addColorStop(0,'#d6924f'); g.addColorStop(0.26,'#ab6832');
  g.addColorStop(0.62,'#834b1f'); g.addColorStop(1,'#5a300f');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(38,18,4,0.55)'; ctx.lineWidth=1; ctx.stroke();

  /* ふたの丸みを出すハイライトの弧 */
  ctx.save();
  ctx.globalAlpha=0.45; ctx.lineWidth=2.0; ctx.lineCap='round';
  ctx.strokeStyle='#eeb073';
  ctx.beginPath();
  ctx.moveTo(-WL+4.5, ly-1.6);
  ctx.bezierCurveTo(-WL*0.72, cpY+3.0, WL*0.72, cpY+3.0, WL-4.5, ly-1.6);
  ctx.stroke();
  ctx.restore();

  /* ふたを前後に走る金の帯 */
  ctx.beginPath();
  ctx.moveTo(-3.0, peakY+1.4);
  ctx.lineTo( 3.0, peakY+1.4);
  ctx.lineTo( 3.0, bly-2.8);
  ctx.lineTo( 0,   bly);
  ctx.lineTo(-3.0, bly-2.8);
  ctx.closePath();
  g = ctx.createLinearGradient(-3.0,0, 3.0,0);
  g.addColorStop(0,'#a97a1a'); g.addColorStop(0.38,'#ffe79a'); g.addColorStop(1,'#c8901f');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(70,44,8,0.42)'; ctx.lineWidth=0.7; ctx.stroke();

  /* ふたの下ぶち（金の縁・手前2辺） */
  ctx.save();
  ctx.lineWidth=1.7; ctx.lineJoin='round';
  g = ctx.createLinearGradient(-WL,0, WL,0);
  g.addColorStop(0,'#b8860f'); g.addColorStop(0.5,'#ffe79a'); g.addColorStop(1,'#b8860f');
  ctx.strokeStyle=g;
  ctx.beginPath(); ctx.moveTo(-WL,ly); ctx.lineTo(0,bly); ctx.lineTo(WL,ly); ctx.stroke();
  ctx.restore();

  /* 錠前（手前の角にぶら下がる） */
  ctx.save();
  ctx.translate(0, bly - 0.6);
  dv_roundRect(ctx, -4.0, -2.0, 8.0, 7.8, 2.0);
  g = ctx.createLinearGradient(0,-2.0, 0,5.8);
  g.addColorStop(0,'#fff0b8'); g.addColorStop(0.45,'#e6b243'); g.addColorStop(1,'#8f6114');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(60,38,6,0.55)'; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle='#3a2405';
  ctx.beginPath(); ctx.arc(0,1.1,1.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-0.85,1.4); ctx.lineTo(0.85,1.4); ctx.lineTo(0.45,4.3); ctx.lineTo(-0.45,4.3);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  /* ふたのすきまから漏れる金色の光 */
  ctx.save();
  ctx.globalAlpha = 0.34 + 0.20*Math.sin(T/520);
  g = ctx.createLinearGradient(0, ly-3, 0, bly);
  g.addColorStop(0,'rgba(255,232,150,0)');
  g.addColorStop(1,'rgba(255,240,175,0.95)');
  ctx.strokeStyle=g; ctx.lineWidth=1.3; ctx.lineJoin='round';
  ctx.beginPath(); ctx.moveTo(-WL+3, ly+0.9); ctx.lineTo(0, bly+0.9); ctx.lineTo(WL-3, ly+0.9); ctx.stroke();
  ctx.restore();

  /* きらめき */
  for(let i=0;i<3;i++){
    const a = 0.22 + 0.55*Math.sin(T/430 + i*2.1);
    dv_sparkle(ctx,
      (dv_rnd(i*3+1)-0.5)*W*1.7,
      peakY - 1 - dv_rnd(i*3+2)*8,
      1.7 + dv_rnd(i*3+3)*1.6, a);
  }

  ctx.restore();
}

/* =====================================================================
   dvCardIcon : チャンスマスの「?」カード。浮いて回る。高さ約30px
   ===================================================================== */
function dvCardIcon(ctx, T){
  ctx.save();

  T = +T || 0;
  const bob  = Math.sin(T/560)*2.4;          /* 上下の浮き */
  const spin = Math.cos(T/780);              /* 縦軸まわりの回転 */
  const absS = Math.abs(spin);
  const HW = 11.0, HH = 12.0;                /* カードの半分の幅・高さ */
  const cy  = -6 - HH + bob;                 /* カード中心（下端 -6+bob、上端 -30+bob） */

  /* 地面の影（浮くほど小さく薄く） */
  const k = 1 - (bob+2.4)/9.5;
  dv_shadow(ctx, 0, -1.5, 9.5*(0.66+0.30*k)*(0.45+0.55*absS)+2.5, 5.2*(0.66+0.30*k), 0.30*(0.6+0.4*k));

  /* 後光 */
  ctx.save();
  ctx.globalAlpha = 0.28 + 0.12*Math.sin(T/430);
  const gg = ctx.createRadialGradient(0,cy,0, 0,cy,20);
  gg.addColorStop(0,'rgba(255,233,168,0.95)');
  gg.addColorStop(1,'rgba(255,233,168,0)');
  ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(0,cy,20,0,Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(0, cy);
  ctx.rotate(-0.06);
  ctx.scale(Math.max(0.05, absS), 1);

  /* 厚み（回っている最中に見える小口） */
  const edge = 1.1;
  ctx.fillStyle = '#b99a56';
  dv_roundRect(ctx, -HW+edge*0.4, -HH+0.6, HW*2, HH*2, 2.6);
  ctx.fill();

  if(spin >= 0){
    /* 表：クリーム色の札に金縁と「?」 */
    dv_roundRect(ctx, -HW, -HH, HW*2, HH*2, 2.6);
    let g = ctx.createLinearGradient(0,-HH, 0,HH);
    g.addColorStop(0,'#fdf8ea'); g.addColorStop(0.55,'#f0e6cd'); g.addColorStop(1,'#d9c9a4');
    ctx.fillStyle=g; ctx.fill();
    g = ctx.createLinearGradient(-HW,0, HW,0);
    g.addColorStop(0,'#c8901f'); g.addColorStop(0.45,'#ffe79a'); g.addColorStop(1,'#c8901f');
    ctx.strokeStyle=g; ctx.lineWidth=1.35; ctx.stroke();

    dv_roundRect(ctx, -HW+2.4, -HH+2.4, HW*2-4.8, HH*2-4.8, 1.6);
    ctx.strokeStyle='rgba(190,150,70,0.55)'; ctx.lineWidth=0.7; ctx.stroke();

    ctx.save();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='bold 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText('?', 0, 0.9);
    ctx.fillStyle='#2f5486';
    ctx.fillText('?', 0, 0);
    ctx.restore();

    /* 角の小さな飾り */
    ctx.fillStyle='rgba(200,144,31,0.7)';
    for(let i=0;i<4;i++){
      const sx = (i%2)?1:-1, sy = (i<2)?-1:1;
      ctx.beginPath(); ctx.arc(sx*(HW-3.6), sy*(HH-3.6), 0.9, 0, Math.PI*2); ctx.fill();
    }
  }else{
    /* 裏：氷色の紋様 */
    dv_roundRect(ctx, -HW, -HH, HW*2, HH*2, 2.6);
    let g = ctx.createLinearGradient(0,-HH, 0,HH);
    g.addColorStop(0,'#4f9ad8'); g.addColorStop(0.5,'#2f6fb5'); g.addColorStop(1,'#1c4a84');
    ctx.fillStyle=g; ctx.fill();
    g = ctx.createLinearGradient(-HW,0, HW,0);
    g.addColorStop(0,'#c8901f'); g.addColorStop(0.45,'#ffe79a'); g.addColorStop(1,'#c8901f');
    ctx.strokeStyle=g; ctx.lineWidth=1.35; ctx.stroke();

    dv_roundRect(ctx, -HW+2.6, -HH+2.6, HW*2-5.2, HH*2-5.2, 1.6);
    ctx.strokeStyle='rgba(190,224,255,0.55)'; ctx.lineWidth=0.8; ctx.stroke();
    ctx.fillStyle='rgba(190,224,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(0,-4.6); ctx.lineTo(3.4,0); ctx.lineTo(0,4.6); ctx.lineTo(-3.4,0);
    ctx.closePath(); ctx.fill();
    /* 氷の粒 */
    ctx.fillStyle='rgba(190,224,255,0.45)';
    for(let i=0;i<4;i++){
      const sx=(i%2)?1:-1, sy=(i<2)?-1:1;
      ctx.beginPath();
      ctx.moveTo(sx*4.4, sy*7.2-1.5); ctx.lineTo(sx*5.9, sy*7.2);
      ctx.lineTo(sx*4.4, sy*7.2+1.5); ctx.lineTo(sx*2.9, sy*7.2);
      ctx.closePath(); ctx.fill();
    }
  }

  /* 表面のつや */
  ctx.save();
  ctx.globalAlpha=0.22;
  dv_roundRect(ctx, -HW+1.2, -HH+1.2, HW*2-2.4, HH*0.85, 2.0);
  ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.restore();

  ctx.restore();

  /* 真横を向いた瞬間の白い光の筋 */
  if(absS < 0.14){
    ctx.save();
    ctx.globalAlpha = (0.14-absS)/0.14 * 0.85;
    ctx.fillStyle='#ffffff';
    dv_roundRect(ctx, -1.2, cy-HH, 2.4, HH*2, 1.2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/* =====================================================================
   dvPin : 目的地マーカーのしずく型ピン。明滅する
   col = ピンの色（CSSの色文字列）
   ===================================================================== */
function dvPin(ctx, col, T){
  ctx.save();

  T = +T || 0;
  col = col || '#ff4d6d';
  const bob  = Math.sin(T/380)*1.8;
  const puls = ((T % 1300) / 1300);
  const blink = 0.45 + 0.45*Math.sin(T/300);

  const tipY  = -2.0 - bob;
  const headY = -23.5 - bob;
  const R = 8.0;

  /* 接地の影 */
  dv_shadow(ctx, 0, -1.2, 8.5, 4.4, 0.34);

  /* 広がる波紋 */
  ctx.save();
  ctx.globalAlpha = (1-puls)*0.55;
  ctx.strokeStyle = col; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, -1.2, 4 + 13*puls, (4 + 13*puls)*0.52, 0, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();

  /* 外側の明滅グロー */
  ctx.save();
  ctx.globalAlpha = blink*0.55;
  ctx.strokeStyle = col; ctx.lineWidth = 5;
  ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(0, tipY);
  ctx.bezierCurveTo(-3.4, tipY-9, -R, headY+R*0.72, -R, headY);
  ctx.arc(0, headY, R, Math.PI, 0, false);
  ctx.bezierCurveTo(R, headY+R*0.72, 3.4, tipY-9, 0, tipY);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  /* 本体 */
  ctx.beginPath();
  ctx.moveTo(0, tipY);
  ctx.bezierCurveTo(-3.4, tipY-9, -R, headY+R*0.72, -R, headY);
  ctx.arc(0, headY, R, Math.PI, 0, false);
  ctx.bezierCurveTo(R, headY+R*0.72, 3.4, tipY-9, 0, tipY);
  ctx.closePath();
  ctx.fillStyle = col; ctx.fill();

  /* 下側に落とす陰 */
  ctx.save();
  ctx.clip();
  let g = ctx.createLinearGradient(0, headY-R, 0, tipY);
  g.addColorStop(0,   'rgba(255,255,255,0.0)');
  g.addColorStop(0.55,'rgba(0,0,0,0.0)');
  g.addColorStop(1,   'rgba(0,0,0,0.30)');
  ctx.fillStyle=g;
  ctx.fillRect(-R-2, headY-R-2, R*2+4, (tipY-headY)+R+6);
  /* 左上の受け光 */
  g = ctx.createRadialGradient(-R*0.35, headY-R*0.45, 0, -R*0.35, headY-R*0.45, R*1.5);
  g.addColorStop(0,'rgba(255,255,255,0.75)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;
  ctx.fillRect(-R-2, headY-R-2, R*2+4, R*3);
  ctx.restore();

  /* 白い縁取り */
  ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(0, tipY);
  ctx.bezierCurveTo(-3.4, tipY-9, -R, headY+R*0.72, -R, headY);
  ctx.arc(0, headY, R, Math.PI, 0, false);
  ctx.bezierCurveTo(R, headY+R*0.72, 3.4, tipY-9, 0, tipY);
  ctx.closePath();
  ctx.stroke();

  /* 中央の白い穴 */
  ctx.beginPath(); ctx.arc(0, headY, 3.5, 0, Math.PI*2);
  g = ctx.createLinearGradient(0, headY-3.5, 0, headY+3.5);
  g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#dfe7f2');
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.20)'; ctx.lineWidth=0.8; ctx.stroke();

  /* 頭のてっぺんのきらめき */
  dv_sparkle(ctx, R*0.62, headY - R*0.72, 2.6, blink*0.9);

  ctx.restore();
}

/* ══════════════════════════════════════════════════════════════
   ダイスボヤージュ — 演出エフェクト 第2弾
   札束 / 金貨 / 衝撃波 / 紙吹雪 / 4方向スター / 光条 / 土煙
   ＋ 独占成立カットイン dvCelebrate

   ・すべて決定論（Math.random / Date.now / new Date は使わない）。
     ばらつきは fx の通し番号 f.i（無ければ座標）と進行度 k から作る。
   ・関数の外に変数を置かない。
   ・3b-art.js の dvFxRnd / dvFxRgba / dvFxLighten を再利用するので、
     このコードは 3b-art.js の末尾（または dvFxNumber の後ろ）へ置く。
   ══════════════════════════════════════════════════════════════ */

/* ───── 共有の小道具 ───── */

/* 4方向スター（本家の独占演出の背景に約40個ある形）
   長い横棒＋縦棒＋短い斜め8本。r は横棒の片側の長さ。
   hue を上げる（0..1）と白飛びせず色みが残る＝紫・青の星に使う。 */
function dvStarburst(ctx, x, y, r, col, a, rot, hue){
  if(!(a > 0) || !(r > 0)) return;
  const c = col || '#FFFFFF';
  const wl = 1 - Math.max(0, Math.min(1, hue || 0));   // hue を上げると色みが残る
  const sat = 0.40 + 0.60 * wl;                        // 色つきの星は白飛びさせない
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot || 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a;

  /* 中心のにじみ */
  const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.46);
  gg.addColorStop(0,    dvFxRgba(dvFxLighten(c, 0.9 * wl), 0.95 * sat));
  gg.addColorStop(0.26, dvFxRgba(dvFxLighten(c, 0.4 * wl), 0.42 * sat));
  gg.addColorStop(1,    dvFxRgba(c, 0));
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2); ctx.fill();

  /* 棘。中心から len まで伸びる細い菱形を2枚（表裏）で1本の棒にする */
  const spike = function(ang, len, wid, alpha){
    ctx.save();
    ctx.rotate(ang);
    const lg = ctx.createLinearGradient(0, 0, len, 0);
    lg.addColorStop(0,    dvFxRgba(dvFxLighten(c, 0.95 * wl), 0.98 * alpha * sat));
    lg.addColorStop(0.22, dvFxRgba(dvFxLighten(c, 0.5 * wl),  0.72 * alpha * sat));
    lg.addColorStop(1,    dvFxRgba(c, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.20, -wid);
    ctx.lineTo(len, 0);
    ctx.lineTo(len * 0.20,  wid);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  const HW = Math.max(1.1, r * 0.052);          // 横棒の太さ
  spike(0,            r,        HW,        1);
  spike(Math.PI,      r,        HW,        1);
  spike(-Math.PI / 2, r * 0.60, HW * 0.92, 0.95);
  spike( Math.PI / 2, r * 0.60, HW * 0.92, 0.95);
  for(let i = 0; i < 8; i++){
    spike(Math.PI / 8 + i * Math.PI / 4, r * 0.19, HW * 0.55, 0.7);
  }

  /* 芯の白い点 */
  ctx.globalAlpha = a * wl * wl;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(0, 0, Math.max(0.8, r * 0.05), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* 暖色のレンズフレアの筋（横に長い光の帯）。len は片側の長さ */
function dvLightRay(ctx, x, y, len, thick, col, a, rot){
  if(!(a > 0) || !(len > 0)) return;
  const c = col || '#FFD9A0';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot || 0);
  ctx.globalCompositeOperation = 'lighter';

  /* 帯の本体（中央が濃く両端が消える） */
  const bg = ctx.createLinearGradient(-len, 0, len, 0);
  bg.addColorStop(0,    dvFxRgba(c, 0));
  bg.addColorStop(0.28, dvFxRgba(c, 0.24 * a));
  bg.addColorStop(0.5,  dvFxRgba(dvFxLighten(c, 0.75), 0.85 * a));
  bg.addColorStop(0.72, dvFxRgba(c, 0.24 * a));
  bg.addColorStop(1,    dvFxRgba(c, 0));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(-len * 0.34, -thick);
  ctx.lineTo( len * 0.34, -thick);
  ctx.lineTo( len, 0);
  ctx.lineTo( len * 0.34,  thick);
  ctx.lineTo(-len * 0.34,  thick);
  ctx.closePath(); ctx.fill();

  /* 芯の細い白線 */
  const cg = ctx.createLinearGradient(-len, 0, len, 0);
  cg.addColorStop(0,   'rgba(255,255,255,0)');
  cg.addColorStop(0.5, 'rgba(255,255,255,' + (0.9 * a).toFixed(3) + ')');
  cg.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(-len, -Math.max(0.6, thick * 0.16), len * 2, Math.max(1.2, thick * 0.32));

  /* 中央のふくらみ */
  const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, thick * 3.4);
  rg.addColorStop(0,   dvFxRgba(dvFxLighten(c, 0.9), 0.8 * a));
  rg.addColorStop(0.4, dvFxRgba(c, 0.28 * a));
  rg.addColorStop(1,   dvFxRgba(c, 0));
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(0, 0, thick * 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* 紙幣1枚。原点が中心、w×h の紙。band は留め帯の色 */
function dvBillNote(ctx, w, h, band){
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0,    '#FFFEF6');
  g.addColorStop(0.42, '#F7F2DC');
  g.addColorStop(0.72, '#E9E2C4');
  g.addColorStop(1,    '#D3CDB2');
  ctx.fillStyle = g;
  ctx.beginPath();
  if(ctx.roundRect){ ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(3, h * 0.2)); }
  else { ctx.rect(-w / 2, -h / 2, w, h); }
  ctx.fill();
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'rgba(90,72,30,0.55)';
  ctx.stroke();
  /* 内側の飾り枠 */
  ctx.strokeStyle = 'rgba(150,120,50,0.45)';
  ctx.lineWidth = 0.7;
  ctx.strokeRect(-w / 2 + w * 0.09, -h / 2 + h * 0.16, w * 0.82, h * 0.68);
  /* 肖像の窓 */
  ctx.fillStyle = 'rgba(150,128,70,0.30)';
  ctx.beginPath(); ctx.ellipse(-w * 0.24, 0, w * 0.11, h * 0.26, 0, 0, Math.PI * 2); ctx.fill();
  /* 留め帯 */
  ctx.fillStyle = band || '#C8484C';
  ctx.fillRect(w * 0.08, -h / 2, w * 0.13, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(w * 0.08, -h / 2, w * 0.04, h);
  /* 額面の金の点 */
  ctx.fillStyle = 'rgba(214,168,40,0.9)';
  ctx.beginPath(); ctx.arc(w * 0.32, -h * 0.02, Math.max(1, h * 0.13), 0, Math.PI * 2); ctx.fill();
}

/* 金貨1枚。縦回転で幅が縮む（edge-on）ように見せる */
function dvCoin(ctx, r, spin){
  const sx = Math.abs(Math.cos(spin));
  ctx.save();
  ctx.scale(Math.max(0.10, sx), 1);
  /* 縁 */
  ctx.fillStyle = '#A9760E';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  /* 面 */
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0,    '#FFF6C8');
  g.addColorStop(0.42, '#F5C63A');
  g.addColorStop(1,    '#C98D16');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.fill();
  /* ハイライト */
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.ellipse(-r * 0.24, -r * 0.32, r * 0.30, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  /* 厚み（edge-on のとき側面が見える） */
  if(sx < 0.55){
    ctx.fillStyle = '#8E620B';
    ctx.fillRect(-Math.max(0.7, r * 0.10), -r * 0.94, Math.max(1.4, r * 0.20), r * 1.88);
  }
}

/* ══════════════════════════════════════════════════════════════
   dvFx2 — fxList の1件を描く。既存の drawFx から呼ぶ。
   f : {kind,x,y,t,dur,col,txt,big, ...opt}   k : 0..1
   opt で from/to（{x,y}）, w/h（画面サイズ）, r（大きさ）, rot, n を渡せる。
   扱える kind なら true、知らない kind なら false を返す。
   ══════════════════════════════════════════════════════════════ */
function dvFx2(ctx, f, k, dt){
  if(!f || !(k >= 0) || k >= 1) return false;
  const kind = f.kind;

  /* 決定論の種：通し番号 f.i があればそれ、無ければ座標から作る */
  const seed = (typeof f.i === 'number')
    ? (f.i * 1.7 + 0.31)
    : ((f.x || 0) * 0.0173 + (f.y || 0) * 0.0411 + (f.dur || 1) * 0.00097);
  const rnd = function(j){ return dvFxRnd(seed * 4.13 + j * 1.618 + 7.77); };
  const easeOut = function(t){ const u = 1 - t; return 1 - u * u * u; };
  const smooth  = function(t){ return t * t * (3 - 2 * t); };

  /* ───────────── 1) 札束が飛ぶ ───────────── */
  if(kind === 'bill'){
    const ax = (f.from && f.from.x !== undefined) ? f.from.x : f.x;
    const ay = (f.from && f.from.y !== undefined) ? f.from.y : f.y;
    const bx = (f.to && f.to.x !== undefined) ? f.to.x : (f.tx !== undefined ? f.tx : f.x);
    const by = (f.to && f.to.y !== undefined) ? f.to.y : (f.ty !== undefined ? f.ty : f.y - 200);
    const band = f.col || '#C8484C';
    const dx = bx - ax, dy = by - ay;
    const L  = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / L, ny = dx / L;                    // 進行方向の法線
    const n  = 12 + Math.floor(rnd(1) * 6.999);         // 12〜18枚
    const FLY = 0.58;                                   // 1枚あたりの飛行時間（k比）
    ctx.save();
    for(let i = 0; i < n; i++){
      const t0 = (i / n) * 0.30 + rnd(i + 2) * 0.10;    // 時間差でばらける
      const p  = (k - t0) / FLY;
      if(p <= 0) continue;

      if(p < 1){
        const e   = smooth(p);
        const sgn = (i % 2 === 0) ? 1 : -1;
        const bow = (30 + 110 * rnd(i + 7)) * sgn;      // 弧の深さ
        const sp  = (rnd(i + 13) * 2 - 1) * 30;         // 横のばらけ
        const cx  = ax + dx * 0.5 + nx * (bow + sp);
        const cy  = ay + dy * 0.5 + ny * (bow + sp) - (46 + 44 * rnd(i + 17));
        const u   = 1 - e;
        const px  = u * u * ax + 2 * u * e * cx + e * e * bx;
        const py  = u * u * ay + 2 * u * e * cy + e * e * by;
        const rot = (rnd(i + 19) * 6.283) + p * (5.0 + 4.0 * rnd(i + 23)) * sgn;
        const flip = Math.cos(p * (8 + 7 * rnd(i + 29)) + rnd(i + 31) * 6.283);
        const sc  = 0.80 + 0.34 * rnd(i + 37);
        const a   = p < 0.10 ? p / 0.10 : (p > 0.92 ? (1 - p) / 0.08 : 1);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.globalAlpha = Math.max(0, a);
        /* 落ち影（紙のふちの濃い線） */
        ctx.save();
        ctx.scale(Math.max(0.12, Math.abs(flip)) * sc, sc);
        ctx.globalAlpha = Math.max(0, a) * 0.30;
        ctx.fillStyle = 'rgba(20,12,4,0.9)';
        ctx.fillRect(-16 + 1.6, -9 + 2.2, 32, 18);
        ctx.globalAlpha = Math.max(0, a);
        dvBillNote(ctx, 32, 18, band);
        ctx.restore();
        ctx.restore();
      } else {
        /* 着地：ぱっと消えて金貨の粒になる */
        const q = (p - 1) / 0.30;
        if(q >= 1) continue;
        const eq = easeOut(q);
        ctx.save();
        ctx.translate(bx, by);
        ctx.globalAlpha = Math.pow(1 - q, 1.4);
        for(let m = 0; m < 3; m++){
          const ang = rnd(i * 3 + m + 41) * 6.283;
          const d   = (10 + 34 * rnd(i * 3 + m + 47)) * eq;
          const gx  = Math.cos(ang) * d;
          const gy  = Math.sin(ang) * d * 0.62 - 26 * eq * (0.4 + rnd(i * 3 + m + 53));
          ctx.save();
          ctx.translate(gx, gy);
          dvCoin(ctx, 4.2 + 2.2 * rnd(i * 3 + m + 59), q * 7 + rnd(i + 61) * 3);
          ctx.restore();
        }
        /* 受け取り側の光 */
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.pow(1 - q, 2) * 0.5;
        const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, 40 * (0.4 + eq));
        fg.addColorStop(0,   'rgba(255,240,180,0.9)');
        fg.addColorStop(0.5, 'rgba(255,206,90,0.35)');
        fg.addColorStop(1,   'rgba(255,206,90,0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(0, 0, 40 * (0.4 + eq), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    return true;
  }

  /* ───────────── 2) 金貨が弾け飛ぶ ───────────── */
  if(kind === 'coinburst'){
    const n = 24;
    const GND = 0.62;                                   // 地面に着く時点
    ctx.save();
    ctx.translate(f.x, f.y);
    for(let i = 0; i < n; i++){
      const t0 = rnd(i + 3) * 0.16;
      const p  = (k - t0) / (1 - t0);
      if(p <= 0) continue;
      const ang  = (i / n) * 6.283 + rnd(i + 11) * 0.42;
      const reach = 46 + 118 * rnd(i + 17);
      const hi    = 68 + 92 * rnd(i + 23);
      const px = Math.cos(ang) * reach * easeOut(p);
      let hgt;
      if(p < GND){
        const u = p / GND;
        hgt = Math.sin(Math.PI * u) * hi;
      } else {
        const u = (p - GND) / (1 - GND);
        hgt = Math.sin(Math.PI * Math.min(1, u * 1.25)) * hi * 0.26;   // 跳ね返り
      }
      const py = Math.sin(ang) * reach * easeOut(p) * 0.38 - hgt;
      const a  = p > 0.80 ? Math.pow((1 - p) / 0.20, 1.2) : 1;
      if(a <= 0) continue;
      /* 影（地面） */
      ctx.save();
      ctx.globalAlpha = a * 0.26 * Math.max(0.15, 1 - hgt / 160);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(px, Math.sin(ang) * reach * easeOut(p) * 0.38, 6, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      /* 本体 */
      ctx.save();
      ctx.translate(px, py);
      ctx.globalAlpha = a;
      ctx.rotate((rnd(i + 29) * 2 - 1) * 0.5);
      dvCoin(ctx, 6.5 + 4.0 * rnd(i + 31), p * (11 + 9 * rnd(i + 37)) + rnd(i + 41) * 6.283);
      ctx.restore();
      /* きらり */
      if(rnd(i + 43) > 0.55){
        dvStarburst(ctx, px, py, (7 + 6 * rnd(i + 47)),
                    '#FFE9A0', a * 0.6 * (0.4 + 0.6 * Math.abs(Math.sin(p * 9 + i))), 0);
      }
    }
    ctx.restore();
    return true;
  }

  /* ───────────── 3) 地面を走る衝撃波（アイソメ：縦に潰した楕円・2重） ───────────── */
  if(kind === 'shockring'){
    const c = f.col || '#FFE7A8';
    const R = f.r || 210;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.scale(1, 0.42);                                  // 床に寝かせる
    for(let n = 0; n < 2; n++){
      const kk = n === 0 ? k : (k - 0.16) / 0.84;
      if(kk <= 0 || kk >= 1) continue;
      const e  = easeOut(kk);
      const r  = 16 + (n === 0 ? R : R * 0.66) * e;
      const a  = Math.pow(1 - kk, 1.6) * (n === 0 ? 1 : 0.66);
      const wd = Math.max(1.2, (n === 0 ? 15 : 9) * (1 - kk * 0.85));
      /* 前縁の厚い光 */
      const rg = ctx.createRadialGradient(0, 0, Math.max(0, r - wd * 2.4), 0, 0, r + wd);
      rg.addColorStop(0,    dvFxRgba(c, 0));
      rg.addColorStop(0.55, dvFxRgba(c, 0.42 * a));
      rg.addColorStop(0.88, dvFxRgba(dvFxLighten(c, 0.7), 0.95 * a));
      rg.addColorStop(1,    dvFxRgba(c, 0));
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(0, 0, r + wd, 0, Math.PI * 2); ctx.fill();
      /* 芯の白線 */
      ctx.globalAlpha = a * 0.85;
      ctx.lineWidth = Math.max(0.8, wd * 0.30);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    /* 押し出された空気の薄い面（最初だけ） */
    const early = Math.max(0, 1 - k * 2.1);
    if(early > 0){
      const rr = 24 + R * 0.7 * easeOut(k);
      const fg = ctx.createRadialGradient(0, 0, rr * 0.15, 0, 0, rr);
      fg.addColorStop(0,    dvFxRgba(c, 0.20 * early));
      fg.addColorStop(0.75, dvFxRgba(c, 0.10 * early));
      fg.addColorStop(1,    dvFxRgba(c, 0));
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return true;
  }

  /* ───────────── 4) 紙吹雪（画面の上から降る・4色） ───────────── */
  if(kind === 'confetti'){
    const W = f.w || 1600, H = f.h || 900;
    const cols = ['#FF5A6E', '#FFD24D', '#5FC7F5', '#7DE08A'];
    const n = f.n || 96;
    ctx.save();
    for(let i = 0; i < n; i++){
      const t0 = rnd(i + 5) * 0.34;
      const p  = (k - t0) / (1 - t0);
      if(p <= 0) continue;
      const sp = 0.72 + 0.62 * rnd(i + 9);               // 落ちる速さ
      const y  = -40 + p * (H + 90) * sp;
      if(y > H + 40) continue;
      const swA = 16 + 34 * rnd(i + 13);
      const swF = 2.2 + 3.4 * rnd(i + 17);
      const x  = rnd(i) * W + Math.sin(p * swF * 6.283 + rnd(i + 21) * 6.283) * swA;
      const w  = 7 + 8 * rnd(i + 25);
      const h  = w * (0.5 + 0.5 * rnd(i + 29));
      const spin = p * (5 + 9 * rnd(i + 33)) * 6.283 + rnd(i + 37) * 6.283;
      const a  = p > 0.88 ? (1 - p) / 0.12 : 1;
      if(a <= 0) continue;
      const c  = cols[i & 3];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rnd(i + 41) * 2 - 1) * 0.6 + p * (rnd(i + 43) * 2 - 1) * 2.2);
      const fl = Math.cos(spin);                         // 紙が翻る
      ctx.scale(1, Math.max(0.06, Math.abs(fl)));
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      /* 裏面は暗く（ひらひら感） */
      if(fl < 0){
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.fillRect(-w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(-w / 2, -h / 2, w, h * 0.34);
      }
      ctx.restore();
    }
    ctx.restore();
    return true;
  }

  /* ───────────── 5) 4方向スター ───────────── */
  if(kind === 'starburst'){
    const R = f.r || (f.big ? 90 : 46);
    const c = f.col || '#FFF3C0';
    const gr = k < 0.18 ? easeOut(k / 0.18) : 1;
    const a  = k < 0.10 ? (k / 0.10) : Math.pow(1 - (k - 0.10) / 0.90, 1.5);
    const pulse = 0.86 + 0.14 * Math.sin(k * Math.PI * 6);
    dvStarburst(ctx, f.x, f.y, R * gr * pulse, c, a, (f.rot || 0) + k * 0.35);
    return true;
  }

  /* ───────────── 6) 暖色のレンズフレアの筋 ───────────── */
  if(kind === 'lightray'){
    const L = f.r || 420;
    const c = f.col || '#FFCE96';
    const gr = k < 0.22 ? easeOut(k / 0.22) : 1;
    const a  = k < 0.12 ? (k / 0.12) : Math.pow(1 - (k - 0.12) / 0.88, 1.4);
    dvLightRay(ctx, f.x, f.y, L * (0.35 + 0.65 * gr),
               Math.max(2, (f.big ? 15 : 9) * (0.6 + 0.4 * gr)), c, a, f.rot || 0);
    return true;
  }

  /* ───────────── 7) 建設の土煙（低く広がって薄れる） ───────────── */
  if(kind === 'smoke'){
    const n = 15;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(1, 0.52);                                  // 床に沿って低く広がる
    for(let i = 0; i < n; i++){
      const t0 = rnd(i + 3) * 0.26;
      const p  = (k - t0) / (1 - t0);
      if(p <= 0 || p >= 1) continue;
      const e  = easeOut(p);
      const ang = (i / n) * 6.283 + rnd(i + 7) * 0.7;
      const d   = (18 + 104 * rnd(i + 11)) * e;
      const px  = Math.cos(ang) * d;
      const py  = Math.sin(ang) * d * 0.9 - (10 + 26 * rnd(i + 13)) * e;
      const r   = (12 + 20 * rnd(i + 17)) * (0.42 + 1.15 * e);
      const a   = Math.sin(Math.PI * Math.min(1, p * 1.1)) * 0.42;
      if(a <= 0) continue;
      const tone = 0.5 + 0.5 * rnd(i + 19);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0,    'rgba(' + Math.round(214 + 22 * tone) + ',' + Math.round(200 + 20 * tone) + ',' + Math.round(176 + 20 * tone) + ',' + a.toFixed(3) + ')');
      g.addColorStop(0.55, 'rgba(196,182,158,' + (a * 0.5).toFixed(3) + ')');
      g.addColorStop(1,    'rgba(180,166,142,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
    /* 足元に残る土の輪 */
    const base = Math.max(0, 1 - k * 1.9);
    if(base > 0){
      const rr = 26 + 96 * easeOut(k);
      const bg = ctx.createRadialGradient(0, 0, rr * 0.3, 0, 0, rr);
      bg.addColorStop(0,    'rgba(150,130,100,0)');
      bg.addColorStop(0.72, 'rgba(168,150,120,' + (0.22 * base).toFixed(3) + ')');
      bg.addColorStop(1,    'rgba(168,150,120,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return true;
  }

  return false;
}

/* ══════════════════════════════════════════════════════════════
   dvCelebrate — 独占成立のカットイン（本家の実測値に寄せた版）
   T     : 演出開始からの経過ミリ秒
   lines : ['おめでとうございます！','トリプル独占','独占ボーナス x2倍']
   W, H  : 画面サイズ
   ══════════════════════════════════════════════════════════════ */
function dvCelebrate(ctx, T, lines, W, H){
  const t  = Math.max(0, T || 0);
  const L  = lines || [];
  const l1 = L[0] || 'おめでとうございます！';
  const l2 = L[1] || 'トリプル独占';
  const l3 = (L[2] === undefined) ? '独占ボーナス x2倍' : L[2];
  const rnd = function(j){ return dvFxRnd(j * 1.618 + 3.33); };
  const easeOut = function(u){ const v = 1 - u; return 1 - v * v * v; };

  /* 実際の字の高さを測って、指定の字高ぴったりに合わせる */
  const fit = function(txt, targetH, weight){
    let fs = targetH;
    for(let n = 0; n < 3; n++){
      ctx.font = weight + ' ' + fs.toFixed(2) + 'px "Noto Sans JP","Mochiy Pop One",sans-serif';
      const m = ctx.measureText(txt);
      const h = (m.actualBoundingBoxAscent !== undefined && m.actualBoundingBoxDescent !== undefined)
        ? (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) : (fs * 0.72);
      if(!(h > 0)) break;
      fs = fs * targetH / h;
    }
    return fs;
  };

  const inK  = Math.min(1, t / 380);                     // 出だしの寄り
  const pop  = 0.86 + 0.14 * easeOut(inK);
  const fade = Math.min(1, t / 160);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2.4;

  /* ── 背景：中央から広がる暖色の後光 ── */
  ctx.save();
  ctx.globalAlpha = fade;
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, W * 0.62);
  bg.addColorStop(0,    'rgba(255,214,140,0.30)');
  bg.addColorStop(0.34, 'rgba(180,110,40,0.20)');
  bg.addColorStop(0.72, 'rgba(30,14,40,0.34)');
  bg.addColorStop(1,    'rgba(12,6,20,0.52)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  /* ── 背景：4方向スター 約40個（白〜金）＋紫と青 十数個 ── */
  ctx.save();
  ctx.globalAlpha = fade;
  for(let i = 0; i < 40; i++){
    const sx = (0.04 + 0.92 * rnd(i * 3 + 1)) * W;
    const sy = (0.06 + 0.88 * rnd(i * 3 + 2)) * H;
    /* 文字の帯（中央付近）は薄くして、字を邪魔しない */
    const near = 1 - Math.min(1, Math.abs(sy - H * 0.5) / (H * 0.30));
    const gold = rnd(i * 3 + 3);
    const col  = gold < 0.42 ? '#FFFFFF' : (gold < 0.78 ? '#FFE9A8' : '#FFC64A');
    const r    = (0.008 + 0.032 * Math.pow(rnd(i + 60), 1.7)) * W;
    const tw   = 0.55 + 0.45 * Math.sin(t * 0.006 + i * 1.9);   // またたき
    const grow = easeOut(Math.min(1, (t - i * 12) / 420));
    if(grow <= 0) continue;
    dvStarburst(ctx, sx, sy, r * grow * (0.8 + 0.2 * tw), col,
                (0.42 + 0.5 * tw) * (1 - near * 0.55), i * 0.7);
  }
  for(let i = 0; i < 14; i++){
    const sx = (0.05 + 0.90 * rnd(i * 5 + 101)) * W;
    const sy = (0.07 + 0.86 * rnd(i * 5 + 102)) * H;
    const col = (i % 2 === 0) ? '#9B7BE8' : '#6EA8FF';
    const r   = (0.013 + 0.030 * rnd(i + 130)) * W;
    const tw  = 0.5 + 0.5 * Math.sin(t * 0.005 + i * 2.4 + 1.2);
    const grow = easeOut(Math.min(1, (t - 120 - i * 16) / 460));
    if(grow <= 0) continue;
    dvStarburst(ctx, sx, sy, r * grow, col, (0.70 + 0.30 * tw), i * 1.3 + 0.4, 0.95);
  }
  ctx.restore();

  /* ── 背景：暖色のレンズフレアの筋 2本 ── */
  ctx.save();
  ctx.globalAlpha = fade;
  dvLightRay(ctx, W * 0.50, H * 0.315, W * 0.52 * (0.4 + 0.6 * easeOut(inK)),
             H * 0.020, '#FFB86A', 0.75, -0.045);
  dvLightRay(ctx, W * 0.50, H * 0.688, W * 0.44 * (0.4 + 0.6 * easeOut(Math.min(1, t / 520))),
             H * 0.014, '#FFD9A0', 0.55, 0.030);
  ctx.restore();

  /* ── 版面：3行を縦に積む ── */
  const h1 = H * 0.075, h2 = H * 0.185, h3 = H * 0.070;
  const y1 = H * 0.500 - h2 * 0.5 - h1 * 0.62;
  const y2 = H * 0.500 + h2 * 0.42;
  const y3 = H * 0.500 + h2 * 0.5 + h3 * 1.22;

  ctx.save();
  ctx.translate(W * 0.5, H * 0.5);
  ctx.scale(pop, pop);
  ctx.translate(-W * 0.5, -H * 0.5);
  ctx.globalAlpha = fade;

  /* ── 1行目：ベタ白＋濃縁＋暖色のにじみ ── */
  (function(){
    const fs = fit(l1, h1, '900');
    ctx.save();
    ctx.translate(W * 0.5, y1);
    ctx.font = '900 ' + fs.toFixed(2) + 'px "Noto Sans JP","Mochiy Pop One",sans-serif';
    /* 外側の暖色のにじみ */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#FCE4D8';
    ctx.shadowBlur = Math.max(6, fs * 0.42);
    ctx.lineWidth = Math.max(4, fs * 0.13);
    ctx.strokeStyle = 'rgba(252,228,216,0.85)';
    ctx.strokeText(l1, 0, 0);
    ctx.restore();
    /* 下に落ちる影（+3px） */
    ctx.fillStyle = 'rgba(24,0,0,0.55)';
    ctx.fillText(l1, 0, 3);
    /* 3px の濃縁 → ベタ白 */
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#180000';
    ctx.strokeText(l1, 0, 0);
    ctx.fillStyle = '#FCFCFC';
    ctx.fillText(l1, 0, 0);
    ctx.restore();
  })();

  /* ── 2行目：画面で最大。銀グラデ＋濃赤の二重縁＋アーチ＋約-3°傾き ── */
  (function(){
    const fs = fit(l2, h2, '900');
    ctx.save();
    ctx.translate(W * 0.5, y2);
    ctx.rotate(-3 * Math.PI / 180);
    ctx.font = '900 ' + fs.toFixed(2) + 'px "Noto Sans JP","Mochiy Pop One",sans-serif';
    ctx.textAlign = 'left';

    const chars = l2.split('');
    const ws = chars.map(function(c){ return ctx.measureText(c).width; });
    let total = 0; for(let i = 0; i < ws.length; i++) total += ws[i];
    const arch = fs * 0.055;                              // わずかなアーチ
    const top = -fs * 0.80, bot = fs * 0.16;
    let cx = -total / 2;

    for(let i = 0; i < chars.length; i++){
      const w = ws[i];
      const u = (ws.length === 1) ? 0.5 : ((cx + w / 2 + total / 2) / total);
      const dy = -arch * (1 - Math.pow(2 * u - 1, 2));    // 中央が上がる
      const rot = (2 * u - 1) * 0.030;                    // 接線ぶんだけ傾ける
      ctx.save();
      ctx.translate(cx + w / 2, dy);
      ctx.rotate(rot);
      const c = chars[i];

      /* 右下の灰の影 */
      ctx.fillStyle = '#606060';
      ctx.fillText(c, -w / 2 + fs * 0.058, fs * 0.058);

      /* 外縁：太い濃赤（8〜10px） */
      ctx.lineWidth = Math.max(8, Math.min(10, fs * 0.062));
      ctx.strokeStyle = '#3C0000';
      ctx.strokeText(c, -w / 2, 0);
      /* 内縁：中間赤 */
      ctx.lineWidth = Math.max(3.5, Math.min(6, fs * 0.034));
      ctx.strokeStyle = '#C0392B';
      ctx.strokeText(c, -w / 2, 0);

      /* 塗り：縦グラデ（上1/3に強いハイライト） */
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0,    '#FFFFFF');
      g.addColorStop(0.30, '#FFFFFF');
      g.addColorStop(0.34, '#E4E4E4');
      g.addColorStop(0.72, '#E4E4E4');
      g.addColorStop(1,    '#D8D8D8');
      ctx.fillStyle = g;
      ctx.fillText(c, -w / 2, 0);
      ctx.restore();
      cx += w;
    }
    ctx.restore();
  })();

  /* ── 3行目：金グラデ＋紺の縁。「x2倍」だけ1.3倍 ── */
  (function(){
    if(!l3) return;
    /* 「x2倍」「×2倍」のような末尾の倍率だけ大きくする */
    let head = l3, tail = '';
    const m = l3.match(/[xX×]\s*[0-9０-９]+\s*倍?\s*$/);
    if(m){ tail = m[0]; head = l3.slice(0, l3.length - tail.length); }

    const fsA = fit(head || l3, h3, '900');
    const fsB = fsA * 1.3;
    ctx.save();
    ctx.translate(W * 0.5, y3);
    ctx.textAlign = 'left';
    ctx.font = '900 ' + fsA.toFixed(2) + 'px "Noto Sans JP","Mochiy Pop One",sans-serif';
    const wA = head ? ctx.measureText(head).width : 0;
    ctx.font = '900 ' + fsB.toFixed(2) + 'px "Noto Sans JP","Mochiy Pop One",sans-serif';
    const wB = tail ? ctx.measureText(tail).width : 0;
    let x = -(wA + wB) / 2;

    const put = function(txt, fs, baseShift){
      if(!txt) return;
      ctx.font = '900 ' + fs.toFixed(2) + 'px "Noto Sans JP","Mochiy Pop One",sans-serif';
      const w = ctx.measureText(txt).width;
      ctx.save();
      ctx.translate(x + w / 2, baseShift);
      /* 影 */
      ctx.fillStyle = 'rgba(10,10,30,0.5)';
      ctx.fillText(txt, -w / 2 + fs * 0.03, fs * 0.04);
      /* 紺の縁 3px */
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#181830';
      ctx.strokeText(txt, -w / 2, 0);
      /* 金グラデ */
      const g = ctx.createLinearGradient(0, -fs * 0.78, 0, fs * 0.16);
      g.addColorStop(0,    '#F6F0A0');
      g.addColorStop(0.46, '#CCE454');
      g.addColorStop(1,    '#E0B020');
      ctx.fillStyle = g;
      ctx.fillText(txt, -w / 2, 0);
      ctx.restore();
      x += w;
    };
    put(head, fsA, 0);
    put(tail, fsB, 0);
    ctx.restore();
  })();

  ctx.restore();   // pop
  ctx.restore();   // 全体
}
