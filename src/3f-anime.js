/* ══════════════════════════════════════════════════════════════════
   dvAnime(ctx, id, T)  —  ゲットリッチ風 S+ キャラクターカード
   canvas 240 x 340 / Canvas2D 手続き描画のみ / 外部依存なし
   Math.random / Date.now 不使用（T のみで決定論的）
   id : 0..7  （女性 1,2,4,6 ／ 男性 0,3,5,7）
   ══════════════════════════════════════════════════════════════════ */
function dvAnime(ctx, id, T) {

  /* ---------- 入力の正規化 ---------- */
  var i = (((id | 0) % 8) + 8) % 8;
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;

  /* ---------- 顔の基準系（顔の高さ FH を 1.0 とする） ---------- */
  var W = 240, H = 340;
  var CX = 120;                       /* 顔の中心線           */
  var YT = 56;                        /* 頭蓋トップ  u = 0.00 */
  var YC = 183;                       /* あご先      u = 1.00 */
  var FH = YC - YT;                   /* = 127                */
  function U(u) { return YT + FH * u; }

  /* ══════════ 8人ぶんの造形テーブル ══════════
     sk: 肌[base, shadow, line, blush]
     hr: 髪[dark, mid, light, hilight, line]
     ey: 瞳[deep, mid, light, ring]
     cl: 服[main, shadow, light, gold, goldDark, accent]
     bg: 背景[top, bottom, glow]                                */
  var DEF = [
    /* 0 アーサー王 : 男・金髪・碧眼・銀鎧＋金縁 */
    { nm: 'ARTHUR', fem: 0, hs: 0, os: 0,
      sk: ['#F7DCC4', '#E2B597', '#B47D5F', '#E39A86'],
      hr: ['#8A5E12', '#D9A32E', '#F2CE6A', '#FFF3C4', '#674307'],
      ey: ['#123A73', '#2E7BC4', '#9CDCF6', '#0A1F45'],
      cl: ['#C9D2E4', '#8D98B4', '#F4F8FF', '#E8C25A', '#8E6614', '#2B4E8E'],
      bg: ['#2A3E78', '#0E1430', '#7FA6FF'] },

    /* 1 アリス : 女・金髪ロング・青い瞳・白と黒のドレス */
    { nm: 'ALICE', fem: 1, hs: 1, os: 1,
      sk: ['#FDE5D6', '#EFC2AD', '#C68D74', '#F79CA4'],
      hr: ['#A2761F', '#EBC45C', '#F9E39C', '#FFFAE0', '#7A5610'],
      ey: ['#144E8C', '#3E9AE0', '#B4E8FC', '#0B2A55'],
      cl: ['#F7F3F7', '#D2CAD8', '#FFFFFF', '#E8C25A', '#946213', '#241C2E'],
      bg: ['#6E3E7E', '#1A1030', '#FFB4E6'] },

    /* 2 セレネ : 女・銀髪姫カット・紫の瞳・紺の魔術師服 */
    { nm: 'SELENE', fem: 1, hs: 2, os: 2,
      sk: ['#FDEBE2', '#EDCDC4', '#C6968E', '#EE9CA8'],
      hr: ['#77809F', '#B6C0DE', '#E6EDFF', '#FFFFFF', '#59617F'],
      ey: ['#3E1D6B', '#7A45C4', '#D3B4F7', '#22103E'],
      cl: ['#2A2E52', '#171A34', '#4E5687', '#D7C27A', '#7E6826', '#EDEFFA'],
      bg: ['#241C4E', '#080A1C', '#9AD8FF'] },

    /* 3 ノクト : 男・黒髪・紅い瞳・黒コート＋赤裏地 */
    { nm: 'NOCT', fem: 0, hs: 3, os: 3,
      sk: ['#F0D2BC', '#D8AA8E', '#A9755A', '#D98E80'],
      hr: ['#141726', '#282E47', '#4A5480', '#8B95C8', '#080A13'],
      ey: ['#6B0F1E', '#C22334', '#F58C93', '#3A0710'],
      cl: ['#20222E', '#101119', '#3C4054', '#B23A3A', '#661C1C', '#8E1B26'],
      bg: ['#3A1420', '#0A0608', '#FF6A78'] },

    /* 4 リン : 女・桃髪ツインテール・緑の瞳・セーラー */
    { nm: 'RIN', fem: 1, hs: 4, os: 4,
      sk: ['#FEE7DA', '#F0C4B0', '#C99079', '#FA96A2'],
      hr: ['#C15A82', '#F294B6', '#FFC4D8', '#FFEEF5', '#8C3A5D'],
      ey: ['#124C2E', '#2FA05E', '#A2EEBE', '#08301C'],
      cl: ['#FBFBFE', '#D4DAEA', '#FFFFFF', '#F2C24A', '#94741A', '#2E5FA8'],
      bg: ['#1E5E86', '#07202E', '#8FF2E2'] },

    /* 5 ガイ : 男・赤髪・琥珀の瞳・革鎧＋毛皮 */
    { nm: 'GAI', fem: 0, hs: 5, os: 5,
      sk: ['#E9BE99', '#CE9A73', '#966444', '#CE8264'],
      hr: ['#8A2E14', '#D3562A', '#F08A4F', '#FFC48C', '#59190A'],
      ey: ['#7A3D06', '#D98A16', '#F9D682', '#472102'],
      cl: ['#6E4A2E', '#472D19', '#9A6C44', '#C9A055', '#75581E', '#DACCB4'],
      bg: ['#6E3A18', '#170C05', '#FFB86A'] },

    /* 6 ユキ : 女・黒髪ストレート・金の瞳・赤い和装 */
    { nm: 'YUKI', fem: 1, hs: 6, os: 6,
      sk: ['#FDEDE4', '#EED0C6', '#C79890', '#F09AA6'],
      hr: ['#1A1522', '#2E2740', '#524668', '#9A8EBE', '#0E0B14'],
      ey: ['#7A5A06', '#D6A81A', '#F8E694', '#4A3403'],
      cl: ['#B32436', '#7A1122', '#DE5A66', '#EDC96A', '#8E6A1B', '#F8F2E8'],
      bg: ['#5E1428', '#12030A', '#FF9AB4'] },

    /* 7 レイ : 男・青銀髪・翠の瞳・白い貴族服＋金 */
    { nm: 'REI', fem: 0, hs: 7, os: 7,
      sk: ['#F6DCC8', '#DFB69C', '#B07E63', '#DA9080'],
      hr: ['#2E5C86', '#5E9BC9', '#A3D6F0', '#E8F9FF', '#1B3C5C'],
      ey: ['#0B4A52', '#1F9AA6', '#9AEAEA', '#052B31'],
      cl: ['#F3F1EB', '#CECABF', '#FFFFFF', '#E4BE55', '#8E6C1A', '#28407A'],
      bg: ['#14545E', '#03181C', '#8FF6FF'] }
  ];

  var P  = DEF[i];
  var SK = P.sk, HR = P.hr, EY = P.ey, CL = P.cl, BG = P.bg;
  var FEM = (P.fem === 1);

  /* ══════════ 決定論アニメーション（T のみ） ══════════ */
  var cyc = 3400 + i * 170;
  var bp = t % cyc;
  var open = 1;
  if (bp < 150) { open = 1 - 0.95 * Math.sin(Math.PI * (bp / 150)); }
  if (bp > cyc - 300 && bp < cyc - 150) {
    open = Math.min(open, 1 - 0.9 * Math.sin(Math.PI * ((bp - (cyc - 300)) / 150)));
  }
  if (open < 0.03) { open = 0.03; }
  var sway   = Math.sin(t / 900 + i) * 1.9;          /* 後ろ髪の揺れ */
  var sway2  = Math.sin(t / 780 + i + 1.1) * 1.2;    /* 前髪の揺れ   */
  var breath = Math.sin(t / 1600 + i * 0.7) * 0.9;   /* 呼吸         */
  var shine  = ((t / 22) + i * 90) % 560;            /* 金の走査光   */

  /* ══════════ 色ユーティリティ ══════════ */
  function hx(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(h, a) { var c = hx(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function shade(h, f) {
    var c = hx(h), k;
    for (k = 0; k < 3; k++) { c[k] = Math.max(0, Math.min(255, Math.round(c[k] * f))); }
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  function mix(h1, h2, f) {
    var a = hx(h1), b = hx(h2), c = [0, 0, 0], k;
    for (k = 0; k < 3; k++) { c[k] = Math.round(a[k] + (b[k] - a[k]) * f); }
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  function lg(x0, y0, x1, y1, st) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1), k;
    for (k = 0; k < st.length; k++) { g.addColorStop(st[k][0], st[k][1]); }
    return g;
  }
  function rg(x, y, r0, r1, st) {
    var g = ctx.createRadialGradient(x, y, r0, x, y, r1), k;
    for (k = 0; k < st.length; k++) { g.addColorStop(st[k][0], st[k][1]); }
    return g;
  }
  function hash(n) { var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

  /* ══════════ 形状ユーティリティ ══════════ */
  function el(x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
  }
  function fel(x, y, rx, ry, rot, c, a) {
    ctx.save(); if (a != null) { ctx.globalAlpha = a; }
    el(x, y, rx, ry, rot); ctx.fillStyle = c; ctx.fill(); ctx.restore();
  }
  function qline(x0, y0, cx1, cy1, x1, y1, c, w, a) {
    ctx.save(); if (a != null) { ctx.globalAlpha = a; }
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx1, cy1, x1, y1);
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }
  /* 房（毛束）: 根元幅 w → 先端 1点 に絞る涙型。bow で法線方向へふくらむ */
  function lock(x0, y0, x1, y1, w, bow, col, a) {
    var dx = x1 - x0, dy = y1 - y0;
    var L = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / L, ny = dx / L;
    var mx = (x0 + x1) * 0.5 + nx * bow, my = (y0 + y1) * 0.5 + ny * bow;
    ctx.save(); if (a != null) { ctx.globalAlpha = a; }
    ctx.beginPath();
    ctx.moveTo(x0 - nx * w * 0.5, y0 - ny * w * 0.5);
    ctx.quadraticCurveTo(mx - nx * w * 0.62, my - ny * w * 0.62, x1, y1);
    ctx.quadraticCurveTo(mx + nx * w * 0.62, my + ny * w * 0.62, x0 + nx * w * 0.5, y0 + ny * w * 0.5);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
  }
  /* 4条スパークル */
  function spark(x, y, r, c, a) {
    ctx.save(); ctx.globalAlpha = (a == null ? 1 : a); ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + r * 0.18, y - r * 0.18, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.18, y + r * 0.18, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.18, y + r * 0.18, x - r, y);
    ctx.quadraticCurveTo(x - r * 0.18, y - r * 0.18, x, y - r);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  /* 金の縁取り（走査光つき） */
  function goldStroke() {
    var y = shine - 60;
    return lg(0, y - 90, 0, y + 90, [
      [0,    CL[4]],
      [0.34, CL[3]],
      [0.50, '#FFF6D0'],
      [0.66, CL[3]],
      [1,    CL[4]]
    ]);
  }

  /* ══════════ 主要パス（塗らずに path だけ作る＝リムライトで再利用） ══════════ */
  var HW = FEM ? 48 : 51;             /* 頬骨の半幅   */
  var NW = FEM ? 15 : 19;             /* 首の半幅     */
  var SW = FEM ? 62 : 74;             /* 肩の半幅     */

  var JW = FEM ? 0.62 : 0.72;   /* エラの張り     */
  var CW = FEM ? 0.19 : 0.30;   /* あご先の丸み   */
  function pathFace() {
    ctx.beginPath();
    ctx.moveTo(CX, YT);
    ctx.bezierCurveTo(CX + HW * 0.66, YT,        CX + HW,        U(0.14), CX + HW,        U(0.34));
    ctx.bezierCurveTo(CX + HW,        U(0.46),   CX + HW * 0.94, U(0.60), CX + HW * JW,   U(0.72));
    ctx.bezierCurveTo(CX + HW * JW * 0.70, U(0.87), CX + HW * CW, YC - 2, CX,             YC);
    ctx.bezierCurveTo(CX - HW * CW,   YC - 2,    CX - HW * JW * 0.70, U(0.87), CX - HW * JW, U(0.72));
    ctx.bezierCurveTo(CX - HW * 0.94, U(0.60),   CX - HW,        U(0.46), CX - HW,        U(0.34));
    ctx.bezierCurveTo(CX - HW,        U(0.14),   CX - HW * 0.66, YT,      CX,             YT);
    ctx.closePath();
  }
  function pathNeck() {
    ctx.beginPath();
    ctx.moveTo(CX - NW, U(0.82));
    ctx.bezierCurveTo(CX - NW - 1, 208, CX - NW - 3, 224, CX - NW - 8, 242);
    ctx.lineTo(CX + NW + 8, 242);
    ctx.bezierCurveTo(CX + NW + 3, 224, CX + NW + 1, 208, CX + NW, U(0.82));
    ctx.closePath();
  }
  function pathBody() {
    var sw = SW + breath * 0.4;
    ctx.beginPath();
    ctx.moveTo(CX - 15, 214);
    ctx.bezierCurveTo(CX - 34, 226, CX - sw * 0.74, 236, CX - sw, 270);
    ctx.bezierCurveTo(CX - sw - 7, 298, CX - sw - 11, 320, CX - sw - 13, 340);
    ctx.lineTo(CX + sw + 13, 340);
    ctx.bezierCurveTo(CX + sw + 11, 320, CX + sw + 7, 298, CX + sw, 270);
    ctx.bezierCurveTo(CX + sw * 0.74, 236, CX + 34, 226, CX + 15, 214);
    ctx.closePath();
  }
  /* 髪のヘルメット（頭頂部）: 顔より ex px 外側 */
  function pathSkull(ex) {
    var hw = HW + (ex == null ? 6 : ex);
    ctx.beginPath();
    ctx.moveTo(CX - hw, U(0.44));
    ctx.bezierCurveTo(CX - hw,        U(0.10), CX - hw * 0.62, YT - 14, CX,      YT - 14);
    ctx.bezierCurveTo(CX + hw * 0.62, YT - 14, CX + hw,        U(0.10), CX + hw, U(0.44));
    ctx.bezierCurveTo(CX + hw * 0.70, U(0.24), CX - hw * 0.70, U(0.24), CX - hw, U(0.44));
    ctx.closePath();
  }

  /* ══════════ ① 背景 ══════════ */
  function drawBG() {
    ctx.save();
    ctx.fillStyle = lg(0, 0, 0, H, [
      [0,    mix(BG[0], '#FFFFFF', 0.10)],
      [0.42, BG[0]],
      [1,    BG[1]]
    ]);
    ctx.fillRect(0, 0, W, H);

    /* 頭の後ろの発光 */
    ctx.fillStyle = rg(CX, U(0.35), 8, 138, [
      [0,   rgba(BG[2], 0.55)],
      [0.5, rgba(BG[2], 0.18)],
      [1,   rgba(BG[2], 0)]
    ]);
    ctx.fillRect(0, 0, W, H);

    /* 放射光（うっすら） */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(CX, U(0.30));
    var k;
    for (k = 0; k < 9; k++) {
      var a0 = (k / 9) * Math.PI * 2 + t / 14000;
      ctx.save(); ctx.rotate(a0);
      ctx.globalAlpha = 0.028 + 0.016 * Math.sin(t / 1700 + k);
      ctx.fillStyle = rgba(BG[2], 1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -300); ctx.lineTo(10, -300); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    /* ボケ玉 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (k = 0; k < 16; k++) {
      var bx = hash(k * 3.1 + i * 11) * W;
      var by = hash(k * 5.7 + i * 7 + 3) * H;
      var br = 3 + hash(k * 2.3 + i) * 11;
      ctx.globalAlpha = 0.05 + 0.07 * hash(k * 7.7 + i * 3);
      ctx.fillStyle = rgba(BG[2], 1);
      el(bx, by + Math.sin(t / 2400 + k) * 3, br, br, 0); ctx.fill();
    }
    ctx.restore();

    /* 足元の影 */
    fel(CX, 336, 96, 16, 0, 'rgba(0,0,0,0.34)', 1);
    ctx.restore();
  }

  /* ══════════ ② 後ろ髪（シルエット） ══════════ */
  function pathHairBack() {
    var hs = P.hs, s = sway;
    ctx.beginPath();
    if (hs === 0) {                                   /* 男・短め */
      ctx.moveTo(CX - HW - 9, U(0.30));
      ctx.bezierCurveTo(CX - HW - 12, U(0.72), CX - HW - 4, 196, CX - 34, 206);
      ctx.lineTo(CX + 34, 206);
      ctx.bezierCurveTo(CX + HW + 4, 196, CX + HW + 12, U(0.72), CX + HW + 9, U(0.30));
      ctx.bezierCurveTo(CX + 30, YT - 22, CX - 30, YT - 22, CX - HW - 9, U(0.30));
    } else if (hs === 1) {                            /* アリス・超ロング波 */
      ctx.moveTo(CX - 52, U(0.20));
      ctx.bezierCurveTo(CX - 86 + s, 150, CX - 92 + s, 220, CX - 80 + s * 1.6, 274);
      ctx.bezierCurveTo(CX - 74, 310, CX - 88, 322, CX - 84, 340);
      ctx.lineTo(CX + 84, 340);
      ctx.bezierCurveTo(CX + 88, 322, CX + 74, 310, CX + 80 - s * 1.6, 274);
      ctx.bezierCurveTo(CX + 92 - s, 220, CX + 86 - s, 150, CX + 52, U(0.20));
      ctx.bezierCurveTo(CX + 30, YT - 26, CX - 30, YT - 26, CX - 52, U(0.20));
    } else if (hs === 2) {                            /* セレネ・銀の姫カット */
      ctx.moveTo(CX - 50, U(0.20));
      ctx.bezierCurveTo(CX - 76 + s, 140, CX - 78, 240, CX - 74, 340);
      ctx.lineTo(CX + 74, 340);
      ctx.bezierCurveTo(CX + 78, 240, CX + 76 - s, 140, CX + 50, U(0.20));
      ctx.bezierCurveTo(CX + 30, YT - 24, CX - 30, YT - 24, CX - 50, U(0.20));
    } else if (hs === 3) {                            /* ノクト・中・毛先とがり */
      ctx.moveTo(CX - HW - 10, U(0.28));
      ctx.bezierCurveTo(CX - 68 + s, 150, CX - 66, 200, CX - 58, 232);
      ctx.lineTo(CX - 40, 216); ctx.lineTo(CX - 26, 240);
      ctx.lineTo(CX + 26, 240); ctx.lineTo(CX + 40, 216); ctx.lineTo(CX + 58, 232);
      ctx.bezierCurveTo(CX + 66, 200, CX + 68 - s, 150, CX + HW + 10, U(0.28));
      ctx.bezierCurveTo(CX + 30, YT - 24, CX - 30, YT - 24, CX - HW - 10, U(0.28));
    } else if (hs === 4) {                            /* リン・ツインテール台 */
      ctx.moveTo(CX - HW - 8, U(0.30));
      ctx.bezierCurveTo(CX - 62, 160, CX - 52, 200, CX - 34, 216);
      ctx.lineTo(CX + 34, 216);
      ctx.bezierCurveTo(CX + 52, 200, CX + 62, 160, CX + HW + 8, U(0.30));
      ctx.bezierCurveTo(CX + 30, YT - 24, CX - 30, YT - 24, CX - HW - 8, U(0.30));
    } else if (hs === 5) {                            /* ガイ・野性的なトゲ */
      ctx.moveTo(CX - HW - 12, U(0.30));
      ctx.lineTo(CX - 68 + s, 168); ctx.lineTo(CX - 54, 152); ctx.lineTo(CX - 58, 204);
      ctx.lineTo(CX - 38, 186); ctx.lineTo(CX - 30, 218);
      ctx.lineTo(CX + 30, 218); ctx.lineTo(CX + 38, 186); ctx.lineTo(CX + 58, 204);
      ctx.lineTo(CX + 54, 152); ctx.lineTo(CX + 68 - s, 168); ctx.lineTo(CX + HW + 12, U(0.30));
      ctx.bezierCurveTo(CX + 30, YT - 22, CX - 30, YT - 22, CX - HW - 12, U(0.30));
    } else if (hs === 6) {                            /* ユキ・黒ストレート */
      ctx.moveTo(CX - 48, U(0.18));
      ctx.bezierCurveTo(CX - 72 + s, 130, CX - 70, 250, CX - 68, 340);
      ctx.lineTo(CX + 68, 340);
      ctx.bezierCurveTo(CX + 70, 250, CX + 72 - s, 130, CX + 48, U(0.18));
      ctx.bezierCurveTo(CX + 30, YT - 24, CX - 30, YT - 24, CX - 48, U(0.18));
    } else {                                          /* 7 レイ・整った中 */
      ctx.moveTo(CX - HW - 9, U(0.30));
      ctx.bezierCurveTo(CX - 62 + s, 150, CX - 58, 194, CX - 44, 222);
      ctx.lineTo(CX + 44, 222);
      ctx.bezierCurveTo(CX + 58, 194, CX + 62 - s, 150, CX + HW + 9, U(0.30));
      ctx.bezierCurveTo(CX + 30, YT - 24, CX - 30, YT - 24, CX - HW - 9, U(0.30));
    }
    ctx.closePath();
  }

  function drawHairBack() {
    ctx.save();
    pathHairBack();
    ctx.fillStyle = lg(0, YT - 20, 0, 320, [
      [0,    HR[1]],
      [0.34, HR[0]],
      [1,    shade(HR[0], 0.62)]
    ]);
    ctx.fill();
    /* 後ろ髪の中に房の陰影を数本 */
    ctx.save();
    pathHairBack(); ctx.clip();
    var k, n = 7;
    for (k = 0; k < n; k++) {
      var fx = CX - 78 + (156 / (n - 1)) * k;
      var f1 = fx + (fx - CX) * 0.22 + sway * 0.5;
      lock(fx, U(0.16), f1, 300 + hash(k + i * 5) * 40, 13, (k % 2 ? 8 : -8), shade(HR[0], 0.74), 0.55);
      qline(fx, U(0.22), f1 - 3, 220, f1, 320, HR[4], 1.1, 0.30);
    }
    ctx.restore();
    ctx.restore();
  }

  /* ══════════ ③ 首 ══════════ */
  function drawNeck() {
    ctx.save();
    pathNeck();
    ctx.fillStyle = lg(0, U(0.82), 0, 242, [[0, SK[1]], [0.55, SK[0]], [1, SK[1]]]);
    ctx.fill();
    /* あごの落ち影（首の上 4割） */
    ctx.save(); pathNeck(); ctx.clip();
    ctx.fillStyle = rgba(SK[2], 0.42);
    ctx.beginPath();
    ctx.moveTo(CX - NW - 2, U(0.82) - 2);
    ctx.bezierCurveTo(CX - 12, U(0.98), CX + 12, U(0.98), CX + NW + 2, U(0.82) - 2);
    ctx.lineTo(CX + NW + 2, U(0.82) - 6); ctx.lineTo(CX - NW - 2, U(0.82) - 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(SK[1], 0.55);
    ctx.fillRect(CX - NW - 8, U(0.82) - 4, (NW + 8) * 2, 12);
    ctx.restore();
    /* 首すじの線 */
    qline(CX - 6, 206, CX - 7, 222, CX - 9, 236, SK[2], 1.1, 0.28);
    ctx.restore();
  }

  /* ══════════ ④ 顔 ══════════ */
  function drawFace() {
    ctx.save();

    /* ベース */
    pathFace();
    ctx.fillStyle = lg(CX - HW, YT, CX + HW * 0.4, YC, [
      [0,    mix(SK[0], SK[1], 0.30)],
      [0.32, SK[0]],
      [0.80, SK[0]],
      [1,    mix(SK[0], SK[1], 0.45)]
    ]);
    ctx.fill();

    /* 顔の中だけに陰を落とす */
    ctx.save(); pathFace(); ctx.clip();

    /* 前髪の落ち影（額） */
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = SK[1];
    ctx.beginPath();
    ctx.moveTo(CX - HW - 2, YT - 4);
    ctx.lineTo(CX + HW + 2, YT - 4);
    ctx.lineTo(CX + HW + 2, U(0.30));
    ctx.bezierCurveTo(CX + 24, U(0.42), CX + 10, U(0.24), CX - 4, U(0.40));
    ctx.bezierCurveTo(CX - 18, U(0.28), CX - 30, U(0.44), CX - HW - 2, U(0.30));
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    /* 両こめかみの陰 */
    ctx.fillStyle = lg(CX - HW, 0, CX - HW * 0.42, 0, [[0, rgba(SK[1], 0.62)], [1, rgba(SK[1], 0)]]);
    ctx.fillRect(CX - HW - 2, YT, HW, FH);
    ctx.fillStyle = lg(CX + HW, 0, CX + HW * 0.42, 0, [[0, rgba(SK[1], 0.55)], [1, rgba(SK[1], 0)]]);
    ctx.fillRect(CX + 2, YT, HW, FH);

    /* あご下の陰 */
    ctx.fillStyle = lg(0, U(0.86), 0, YC, [[0, rgba(SK[1], 0)], [1, rgba(SK[1], 0.60)]]);
    ctx.fillRect(CX - HW, U(0.84), HW * 2, FH * 0.20);

    /* ハイライト（額とほお） */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = rg(CX - 10, U(0.30), 2, 34, [[0, '#FFFFFF'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(CX - 46, U(0.10), 74, 60);
    ctx.restore();

    /* ほお赤み */
    var ba = FEM ? 0.34 : 0.16;
    fel(CX - 31, U(0.760), 15, 8.0, -0.10, rgba(SK[3], ba), 1);
    fel(CX + 31, U(0.760), 15, 8.0,  0.10, rgba(SK[3], ba), 1);
    if (FEM) {
      var q;
      for (q = 0; q < 3; q++) {
        qline(CX - 37 + q * 5, U(0.735), CX - 35 + q * 5, U(0.755), CX - 33 + q * 5, U(0.775), rgba(SK[3], 0.42), 1.0, 1);
        qline(CX + 33 + q * 5, U(0.775), CX + 35 + q * 5, U(0.755), CX + 37 + q * 5, U(0.735), rgba(SK[3], 0.42), 1.0, 1);
      }
    }
    ctx.restore();  /* clip 解除 */

    /* 輪郭線（あご側だけ細く） */
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = SK[2];
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(CX - HW * 0.985, U(0.40));
    ctx.bezierCurveTo(CX - HW, U(0.46), CX - HW * 0.94, U(0.60), CX - HW * JW, U(0.72));
    ctx.bezierCurveTo(CX - HW * JW * 0.70, U(0.87), CX - HW * CW, YC - 2, CX, YC);
    ctx.bezierCurveTo(CX + HW * CW, YC - 2, CX + HW * JW * 0.70, U(0.87), CX + HW * JW, U(0.72));
    ctx.bezierCurveTo(CX + HW * 0.94, U(0.60), CX + HW, U(0.46), CX + HW * 0.985, U(0.40));
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  /* ══════════ ⑤ 耳 ══════════ */
  function drawEars() {
    var s;
    for (s = -1; s <= 1; s += 2) {
      var ex = CX + s * (HW - 2.0), ey = U(0.615);
      fel(ex, ey, 5.0, 9.4, s * 0.16, SK[0], 1);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = SK[2]; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(ex + s * 1.2, ey - 5);
      ctx.quadraticCurveTo(ex - s * 1.4, ey, ex + s * 0.8, ey + 4);
      ctx.stroke();
      ctx.restore();
      fel(ex + s * 1.2, ey + 5, 2.9, 3.4, 0, rgba(SK[1], 0.55), 1);
    }
  }

  /* ══════════ ⑥ 目（本体） ══════════ */
  var LASH = shade(HR[0], FEM ? 0.52 : 0.46);
  var EYX  = FEM ? 24.5 : 26.0;         /* 目の中心の左右オフセット */
  var EYY  = FEM ? U(0.600) : U(0.610); /* 目の中心の高さ           */
  var IW   = FEM ? 13.2 : 12.6;         /* 目の半幅                 */
  var IH   = FEM ? 11.2 : 8.8;          /* 目の半高                 */
  var IRX  = FEM ? 10.2 : 9.2;          /* 虹彩 rx                  */
  var IRY  = FEM ? 11.6 : 8.6;          /* 虹彩 ry                  */
  var LT   = FEM ? 1.0 : 0.45;          /* まつげの太さ係数         */

  function pathSclera(ex, s) {
    ctx.beginPath();
    ctx.moveTo(ex - s * IW * 0.96, EYY + IH * 0.22);
    ctx.bezierCurveTo(ex - s * IW * 0.55, EYY - IH * 1.06,
                      ex + s * IW * 0.28, EYY - IH * 1.22,
                      ex + s * IW * 1.04, EYY - IH * 0.34);
    ctx.bezierCurveTo(ex + s * IW * 0.86, EYY + IH * 0.74,
                      ex + s * IW * 0.10, EYY + IH * 1.02,
                      ex - s * IW * 0.55, EYY + IH * 0.80);
    ctx.bezierCurveTo(ex - s * IW * 0.80, EYY + IH * 0.66,
                      ex - s * IW * 0.96, EYY + IH * 0.46,
                      ex - s * IW * 0.96, EYY + IH * 0.22);
    ctx.closePath();
  }

  function drawEye(s) {
    var ex = CX + s * EYX;
    var ix = ex + s * 1.1, iy = EYY - IH * 0.06;

    /* (1) 眼窩の影 */
    fel(ex, EYY - IH * 0.75, IW * 1.15, IH * 0.9, 0, rgba(SK[1], 0.30), 1);

    ctx.save();
    /* まばたき: 下まぶたを軸に縦つぶし */
    var piv = EYY + IH * 0.86;
    ctx.translate(0, piv); ctx.scale(1, open); ctx.translate(0, -piv);

    /* (2) 白目 */
    ctx.save();
    pathSclera(ex, s);
    ctx.fillStyle = lg(0, EYY - IH, 0, EYY + IH, [
      [0,   '#CFC7DA'],
      [0.4, '#F5F1F8'],
      [1,   '#FFFFFF']
    ]);
    ctx.fill();

    /* (3) まぶたの落ち影（白目の中） */
    pathSclera(ex, s); ctx.clip();
    ctx.fillStyle = rgba('#5A4A78', 0.30);
    ctx.beginPath();
    ctx.moveTo(ex - s * IW * 1.1, EYY - IH * 1.3);
    ctx.lineTo(ex + s * IW * 1.2, EYY - IH * 1.3);
    ctx.lineTo(ex + s * IW * 1.2, EYY - IH * 0.20);
    ctx.bezierCurveTo(ex + s * IW * 0.3, EYY + IH * 0.10,
                      ex - s * IW * 0.5, EYY - IH * 0.10,
                      ex - s * IW * 1.1, EYY - IH * 0.55);
    ctx.closePath(); ctx.fill();

    /* --- 虹彩は白目でクリップしたまま描く --- */
    /* (4) 虹彩ベース */
    el(ix, iy, IRX, IRY, 0);
    ctx.fillStyle = rg(ix, iy + IRY * 0.42, 1, IRY * 1.35, [
      [0,    EY[2]],
      [0.34, EY[1]],
      [0.74, EY[0]],
      [1,    EY[3]]
    ]);
    ctx.fill();

    /* (5) 虹彩の外リング */
    ctx.save(); ctx.globalAlpha = 0.92;
    el(ix, iy, IRX, IRY, 0);
    ctx.strokeStyle = EY[3]; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.restore();

    /* (6) 虹彩の繊維 */
    ctx.save(); ctx.globalAlpha = 0.34; ctx.strokeStyle = EY[3]; ctx.lineWidth = 0.9;
    var k;
    for (k = 0; k < 12; k++) {
      var a = (k / 12) * Math.PI * 2 + 0.26;
      ctx.beginPath();
      ctx.moveTo(ix + Math.cos(a) * IRX * 0.36, iy + Math.sin(a) * IRY * 0.36);
      ctx.lineTo(ix + Math.cos(a) * IRX * 0.92, iy + Math.sin(a) * IRY * 0.92);
      ctx.stroke();
    }
    ctx.restore();

    /* (7) 虹彩下部の反射光（三日月） */
    fel(ix, iy + IRY * 0.42, IRX * 0.70, IRY * 0.33, 0, rgba(EY[2], 0.62), 1);
    fel(ix, iy + IRY * 0.56, IRX * 0.46, IRY * 0.18, 0, rgba('#FFFFFF', 0.34), 1);

    /* (8) 瞳孔 */
    el(ix, iy, FEM ? 4.2 : 4.0, FEM ? 5.6 : 4.9, 0);
    ctx.fillStyle = lg(0, iy - 6, 0, iy + 6, [[0, '#0C0714'], [1, '#241636']]);
    ctx.fill();
    /* (9) 瞳孔ふちのにじみ */
    ctx.save(); ctx.globalAlpha = 0.45;
    el(ix, iy, FEM ? 5.4 : 5.0, FEM ? 7.0 : 6.2, 0);
    ctx.strokeStyle = EY[3]; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();

    ctx.restore();  /* 白目クリップ解除 */

    /* (10) 大ハイライト（左上） */
    var hx1 = ix - s * IRX * 0.44, hy1 = iy - IRY * 0.48;
    fel(hx1, hy1, FEM ? 4.3 : 3.5, FEM ? 4.6 : 3.7, 0, 'rgba(255,255,255,0.97)', 1);
    fel(hx1 - s * 3.0, hy1 + 2.8, 1.7, 1.9, 0, 'rgba(255,255,255,0.80)', 1);

    /* (11) 小ハイライト（右下） */
    fel(ix + s * IRX * 0.36, iy + IRY * 0.52, FEM ? 2.6 : 2.1, FEM ? 2.4 : 2.0, 0, 'rgba(255,255,255,0.72)', 1);

    /* (12) きらめき */
    if (FEM) { spark(ix + s * IRX * 0.60, iy - IRY * 0.78, 3.2, '#FFFFFF', 0.82); }

    /* (13) 上まつげ（太い塗り形状） */
    ctx.beginPath();
    ctx.moveTo(ex - s * IW * 0.99, EYY + IH * 0.16);
    ctx.bezierCurveTo(ex - s * IW * 0.55, EYY - IH * (1.10 + 0.16 * LT),
                      ex + s * IW * 0.28, EYY - IH * (1.26 + 0.20 * LT),
                      ex + s * IW * (1.10 + 0.14 * LT), EYY - IH * (0.46 + 0.26 * LT));
    ctx.bezierCurveTo(ex + s * IW * 0.88, EYY - IH * (0.44 + 0.10 * LT),
                      ex + s * IW * 0.24, EYY - IH * (0.86 + 0.06 * LT),
                      ex - s * IW * 0.58, EYY - IH * (0.56 + 0.04 * LT));
    ctx.bezierCurveTo(ex - s * IW * 0.82, EYY - IH * 0.34,
                      ex - s * IW * 0.97, EYY - IH * 0.04,
                      ex - s * IW * 0.99, EYY + IH * 0.16);
    ctx.closePath();
    ctx.fillStyle = lg(0, EYY - IH * 1.4, 0, EYY, [[0, mix(LASH, HR[0], 0.42)], [1, LASH]]);
    ctx.fill();

    /* (14) 目尻のまつげ */
    var sp;
    for (sp = 0; sp < 3; sp++) {
      var bx = ex + s * IW * (0.86 + sp * 0.10);
      var by = EYY - IH * (0.66 + sp * 0.10);
      lock(bx, by,
           bx + s * (4.0 + sp * 1.5) * (0.6 + 0.4 * LT), by - (3.0 + sp * 2.0) * (0.5 + 0.5 * LT),
           (2.7 - sp * 0.5) * (0.7 + 0.3 * LT), s * 1.1, LASH, 1);
    }
    /* 目頭側の短いまつげ */
    if (FEM) {
      lock(ex - s * IW * 0.72, EYY - IH * 0.70, ex - s * IW * 0.98, EYY - IH * 1.16, 2.4, 0, LASH, 0.9);
    }

    /* (15) 下まつげ */
    ctx.save(); ctx.globalAlpha = FEM ? 0.62 : 0.42;
    ctx.strokeStyle = mix(LASH, SK[2], 0.35); ctx.lineWidth = FEM ? 1.5 : 1.2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex + s * IW * 1.02, EYY - IH * 0.28);
    ctx.quadraticCurveTo(ex + s * IW * 0.80, EYY + IH * 0.80, ex + s * IW * 0.34, EYY + IH * 0.96);
    ctx.stroke();
    ctx.restore();
    if (FEM) {
      lock(ex + s * IW * 0.86, EYY + IH * 0.62, ex + s * IW * 1.02, EYY + IH * 1.18, 2.0, 0, LASH, 0.7);
    }

    /* (16) 目頭（涙丘） */
    fel(ex - s * IW * 0.86, EYY + IH * 0.30, 2.2, 2.6, 0, rgba(SK[3], 0.70), 1);

    ctx.restore(); /* まばたき解除 */

    /* (17) 二重線 */
    ctx.save(); ctx.globalAlpha = FEM ? 0.40 : 0.52;
    ctx.strokeStyle = SK[2]; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - s * IW * 0.70, EYY - IH * (0.72 + 0.30 * LT));
    ctx.quadraticCurveTo(ex + s * IW * 0.18, EYY - IH * (1.60 + 0.36 * LT),
                         ex + s * IW * 1.02, EYY - IH * (0.86 + 0.20 * LT));
    ctx.stroke();
    ctx.restore();

    /* (18) アイシャドウ */
    if (FEM) {
      fel(ex, EYY - IH * 1.30, IW * 0.95, IH * 0.46, 0, rgba(SK[3], 0.20), 1);
    }
  }

  /* ══════════ ⑦ 眉 ══════════ */
  function drawBrow(s) {
    var by = FEM ? U(0.415) : U(0.440);
    var bw = FEM ? 3.4 : 5.0;
    var col = shade(HR[0], FEM ? 0.90 : 0.76);
    /* 女性: 細く弧を描く／男性: 太く水平に近い（キリッと） */
    if (FEM) {
      lock(CX + s * 12, by + 2.4, CX + s * 37, by - 1.4, bw, s * -2.0, col, 0.94);
    } else {
      lock(CX + s * 11, by + 1.0, CX + s * 39, by - 0.2, bw, s * -0.8, col, 0.96);
    }
    /* 眉の毛流れ */
    ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = shade(HR[0], 0.65); ctx.lineWidth = 0.8;
    var k;
    for (k = 0; k < 4; k++) {
      var px = CX + s * (14 + k * 6);
      ctx.beginPath(); ctx.moveTo(px, by + 2.0 - k * 0.6); ctx.lineTo(px + s * 4, by - 0.4 - k * 0.7); ctx.stroke();
    }
    ctx.restore();
  }

  /* ══════════ ⑧ 鼻・口 ══════════ */
  function drawNoseMouth() {
    var ny = U(0.795);
    /* 鼻の影 */
    ctx.save(); ctx.globalAlpha = 0.50; ctx.fillStyle = SK[1];
    ctx.beginPath();
    ctx.moveTo(CX + 1.4, ny - 4.4);
    ctx.quadraticCurveTo(CX + 5.4, ny - 0.6, CX + 1.8, ny + 1.2);
    ctx.quadraticCurveTo(CX - 0.4, ny - 1.6, CX + 1.4, ny - 4.4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    /* 鼻すじの線 */
    qline(CX + 3.4, ny - 3.0, CX + 5.2, ny - 0.2, CX + 1.0, ny + 1.0, SK[2], 1.2, FEM ? 0.45 : 0.62);
    /* 鼻先のハイライト */
    fel(CX + 2.4, ny - 2.4, 1.3, 1.7, 0, 'rgba(255,255,255,0.50)', 1);

    /* 口 */
    var my = U(0.893), mw = FEM ? 7.0 : 9.8;
    var LIP  = FEM ? '#C9767E' : '#B27668';
    var LIPD = shade(LIP, 0.66);
    if (FEM) {
      /* 下唇の面 */
      fel(CX, my + 2.2, mw * 0.72, 1.9, 0, rgba(LIP, 0.32), 1);
      fel(CX - mw * 0.10, my + 1.9, mw * 0.26, 0.8, 0, 'rgba(255,255,255,0.26)', 1);
    }
    /* 口の線（中央でわずかに下がる） */
    ctx.save();
    ctx.strokeStyle = LIPD; ctx.lineWidth = FEM ? 1.5 : 1.7; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(CX - mw, my - 0.4);
    ctx.quadraticCurveTo(CX - mw * 0.35, my + 1.9, CX, my + 1.1);
    ctx.quadraticCurveTo(CX + mw * 0.35, my + 1.9, CX + mw, my - 0.4);
    ctx.stroke();
    ctx.restore();
    /* 口角 */
    fel(CX - mw, my - 0.3, 1.1, 1.1, 0, rgba(LIPD, 0.8), 1);
    fel(CX + mw, my - 0.3, 1.1, 1.1, 0, rgba(LIPD, 0.8), 1);
    /* あごの陰 */
    fel(CX, U(0.955), 6, 2.2, 0, rgba(SK[1], 0.40), 1);
  }

  /* ══════════ ⑨ 前髪・サイド髪 ══════════ */
  function drawHairFront() {
    var hs = P.hs, k;

    /* --- 頭のかぶり（ヘルメット） --- */
    ctx.save();
    pathSkull(6);
    ctx.fillStyle = lg(CX - HW, YT - 14, CX + HW * 0.5, U(0.60), [
      [0,    HR[2]],
      [0.34, HR[1]],
      [1,    HR[0]]
    ]);
    ctx.fill();
    ctx.restore();

    /* --- 毛流れの線（かぶりの中だけ） --- */
    ctx.save();
    pathSkull(6); ctx.clip();
    ctx.globalAlpha = 0.30; ctx.strokeStyle = HR[4]; ctx.lineWidth = 1;
    for (k = 0; k < 9; k++) {
      var lx = CX - HW + (HW * 2 / 8) * k;
      ctx.beginPath();
      ctx.moveTo(CX + (lx - CX) * 0.22, YT - 10);
      ctx.quadraticCurveTo(lx, U(0.18), lx + (lx - CX) * 0.16, U(0.52));
      ctx.stroke();
    }
    ctx.restore();

    /* --- 天使の輪（前髪の上に乗せる＝立体感の要） --- */
    /* 頭の丸みに沿って波打つ帯（上辺と下辺を別々の波でつなぐ） */
    function bandPath(cy, th, amp, n) {
      var q, x, y;
      ctx.beginPath();
      for (q = 0; q <= n; q++) {
        x = CX - HW + (HW * 2 / n) * q;
        y = cy + Math.pow((x - CX) / HW, 2) * 16 + Math.sin(q * 1.9 + i) * amp;
        if (q === 0) { ctx.moveTo(x, y - th * 0.5); } else { ctx.lineTo(x, y - th * 0.5); }
      }
      for (q = n; q >= 0; q--) {
        x = CX - HW + (HW * 2 / n) * q;
        y = cy + Math.pow((x - CX) / HW, 2) * 16 + Math.sin(q * 1.9 + i) * amp;
        ctx.lineTo(x, y + th * 0.5);
      }
      ctx.closePath();
    }
    function angelRing() {
      var ry = U(0.185);
      ctx.save();
      pathSkull(14); ctx.clip();
      ctx.globalAlpha = 0.20; ctx.fillStyle = HR[2]; bandPath(ry + 1, 12, 3.4, 7); ctx.fill();
      ctx.globalAlpha = 0.50; ctx.fillStyle = HR[3]; bandPath(ry,     5.2, 3.8, 7); ctx.fill();
      ctx.globalAlpha = 0.26; ctx.fillStyle = '#FFFFFF'; bandPath(ry - 0.6, 2.0, 3.8, 7); ctx.fill();
      /* 第2の輪（弱い・下側） */
      ctx.globalAlpha = 0.20; ctx.fillStyle = HR[2]; bandPath(U(0.40), 5.0, 2.4, 5); ctx.fill();
      ctx.restore();
    }

    /* --- 前髪の房（スタイル別） --- */
    var base = HR[1], dark = HR[0], lite = HR[2], ln = HR[4];

    /* 一房の前髪: [根元dx, 根元u, 先端dx, 先端u, 根元幅, ふくらみ] を配列で */
    function bangs(list) {
      var q;
      for (q = 0; q < list.length; q++) {
        var b = list[q];
        var rx = CX + b[0], ry = U(b[1]);
        var tx = CX + b[2] + sway2 * (b[2] / 46), ty = U(b[3]);
        var w = b[4], bow = b[5];
        lock(rx, ry, tx, ty, w, bow, base, 1);                      /* ベース     */
        lock(rx, ry, tx, ty - 5, w * 0.40, bow * 0.55, lite, 0.42); /* ハイライト */
        lock(rx + 2, ry + 6, tx + 2, ty + 1, w * 0.26, bow, dark, 0.44); /* 影    */
        qline(rx, ry + 3, (rx + tx) * 0.5 + bow * 0.9, (ry + ty) * 0.5, tx, ty, ln, 1.1, 0.32);
      }
    }
    /* 顔の横に落ちる長い髪 */
    function sideLock(s, rdx, ru, tdx, ty, w, bow) {
      var rx = CX + rdx, ry = U(ru), tx = CX + tdx + sway * s * 0.6;
      lock(rx, ry, tx, ty, w, bow, base, 1);
      lock(rx, ry, tx - s * 2, ty - 42, w * 0.36, bow * 0.6, lite, 0.38);
      qline(rx + s * 2, ry + 6, (rx + tx) * 0.5 + bow, (ry + ty) * 0.5, tx + s * 2, ty - 8, ln, 1.2, 0.30);
    }

    if (hs === 0) {                       /* 男・七三で右へ流す（額が出る） */
      bangs([[ 18, -0.03, -36, 0.38, 21,  12], [ 30, -0.01,  -6, 0.31, 16,   8],
             [ 36,  0.02,  34, 0.42, 17,  -7], [ 48,  0.10,  58, 0.54, 12,  -6],
             [-26,  0.02, -52, 0.36, 15,   7], [-46,  0.10, -58, 0.52, 12,  -5]]);
    } else if (hs === 1) {                /* アリス・センター分け＋長いサイド */
      bangs([[ -4, -0.05, -30, 0.44, 18,   9], [  4, -0.05,  30, 0.44, 18,  -9],
             [-26, -0.01, -46, 0.34, 14,   6], [ 26, -0.01,  46, 0.34, 14,  -6],
             [-42,  0.06, -56, 0.44, 12,   4], [ 42,  0.06,  56, 0.44, 12,  -4],
             [ -9,  0.00, -15, 0.29,  9,   3], [  9,  0.00,  15, 0.29,  9,  -3]]);
      sideLock(-1, -48, 0.14, -62, 268, 14, -11);
      sideLock( 1,  48, 0.14,  62, 268, 14,  11);
    } else if (hs === 2) {                /* セレネ・ぱっつん＋姫カット */
      for (k = 0; k < 7; k++) {
        var bx = -44 + (88 / 6) * k;
        bangs([[bx * 0.30, -0.02, bx, 0.34 + Math.abs(k - 3) * 0.028, 15, (k - 3) * 1.7]]);
      }
      sideLock(-1, -50, 0.12, -56, 252, 15, -4);
      sideLock( 1,  50, 0.12,  56, 252, 15,  4);
      /* 姫カットの切りそろえた毛先 */
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(CX - 63, 244); ctx.lineTo(CX - 47, 240); ctx.lineTo(CX - 49, 252); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CX + 63, 244); ctx.lineTo(CX + 47, 240); ctx.lineTo(CX + 49, 252); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (hs === 3) {                /* ノクト・片目にかかる乱れ髪 */
      bangs([[ 36, -0.02, -28, 0.56, 22,  18], [ 22, -0.02,  -2, 0.44, 17,  12],
             [  0,  0.00, -40, 0.42, 16,  10], [-28,  0.02, -52, 0.34, 14,   6],
             [ 44,  0.06,  56, 0.44, 13,  -6], [-46,  0.10, -58, 0.50, 11,  -4]]);
    } else if (hs === 4) {                /* リン・ツインテール */
      /* 尾（顔より後ろに見えるよう先に） */
      var s2;
      for (s2 = -1; s2 <= 1; s2 += 2) {
        var tx = CX + s2 * 58, ty = U(0.20);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.bezierCurveTo(tx + s2 * 34, ty + 8, tx + s2 * 44 + sway * s2, 176,
                          tx + s2 * 26 + sway * s2 * 1.6, 236);
        ctx.bezierCurveTo(tx + s2 * 14, 268, tx + s2 * 30, 286, tx + s2 * 10, 300);
        ctx.bezierCurveTo(tx - s2 * 6, 258, tx - s2 * 2, 206, tx - s2 * 6, ty + 14);
        ctx.closePath();
        ctx.fillStyle = lg(tx, ty, tx + s2 * 30, 300, [[0, HR[2]], [0.4, HR[1]], [1, HR[0]]]);
        ctx.fill();
        ctx.clip();
        for (k = 0; k < 4; k++) {
          lock(tx + s2 * (k * 6 - 6), ty + 10,
               tx + s2 * (24 - k * 5) + sway * s2, 260 + k * 12, 8, s2 * 10, shade(HR[0], 0.80), 0.5);
        }
        lock(tx + s2 * 10, ty + 10, tx + s2 * 34, 190, 7, s2 * 8, HR[3], 0.45);
        ctx.restore();
        /* リボン */
        var rbx = tx + s2 * 4, rby = ty + 6;
        fel(rbx, rby, 5, 5, 0, CL[5], 1);
        lock(rbx, rby, rbx - s2 * 16, rby - 11, 12, -4, CL[5], 1);
        lock(rbx, rby, rbx + s2 * 15, rby - 12, 12,  4, CL[5], 1);
        lock(rbx, rby, rbx - s2 * 10, rby + 17, 8, -3, shade(CL[5], 0.8), 1);
        fel(rbx, rby, 3, 3, 0, CL[3], 1);
      }
      bangs([[ -9, -0.05, -30, 0.44, 17,   8], [  9, -0.05,  30, 0.44, 17,  -8],
             [-30, -0.01, -48, 0.36, 14,   5], [ 30, -0.01,  48, 0.36, 14,  -5],
             [  0,  0.00,   3, 0.40, 12,   0], [-44,  0.08, -56, 0.44, 11,   3],
             [ 44,  0.08,  56, 0.44, 11,  -3]]);
      /* アホ毛 */
      qline(CX - 2, YT - 13, CX + 6 + sway2 * 2, YT - 27, CX - 6 + sway2 * 3, YT - 35, base, 3.2, 1);
    } else if (hs === 5) {                /* ガイ・逆立つ野性 */
      /* 後ろへ流れる不規則なトゲ */
      var SPK = [[-46, -70, 24], [-30, -58, 6], [-16, -46, 30], [-2, -34, 12],
                 [ 12, -30, 34], [ 26, -44, 10], [ 40, -62, 26], [ 52, -78, 8]];
      for (k = 0; k < SPK.length; k++) {
        var gx = SPK[k][0], gt = SPK[k][1], gu = SPK[k][2];
        var tipx = CX + gx + (gx < 0 ? -gu : gu) * 0.9;
        var tipy = YT - 8 - gu * 0.55 + hash(k + i) * 5;
        lock(CX + gx * 0.46, U(0.14), tipx, tipy, 13 - Math.abs(k - 3.5) * 0.9, gt * 0.22, base, 1);
        lock(CX + gx * 0.46, U(0.14), tipx - (gx < 0 ? -3 : 3), tipy + 6, 5.0, gt * 0.16, lite, 0.42);
        qline(CX + gx * 0.46, U(0.16), CX + gx * 0.9, YT - 4, tipx, tipy, ln, 1.1, 0.30);
      }
      bangs([[ 24, -0.02, -22, 0.36, 18,  12], [  2,  0.00, -44, 0.32, 15,   8],
             [ 34,  0.02,  40, 0.36, 15,  -7], [-34,  0.06, -56, 0.42, 12,   4],
             [ 48,  0.10,  58, 0.46, 11,  -5]]);
    } else if (hs === 6) {                /* ユキ・黒ぱっつん＋長いサイド */
      for (k = 0; k < 8; k++) {
        var yx = -46 + (92 / 7) * k;
        bangs([[yx * 0.26, -0.03, yx, 0.335 + Math.abs(k - 3.5) * 0.016, 14.5, (k - 3.5) * 1.3]]);
      }
      sideLock(-1, -48, 0.10, -54, 302, 15, -3);
      sideLock( 1,  48, 0.10,  54, 302, 15,  3);
    } else {                              /* 7 レイ・七三の整った前髪 */
      bangs([[ 10, -0.05, -36, 0.42, 20,  13], [ 26, -0.02,   2, 0.34, 16,   9],
             [ 38,  0.02,  44, 0.40, 15,  -7], [ 50,  0.10,  58, 0.50, 11,  -5],
             [-16,  0.00, -50, 0.34, 15,   7], [-44,  0.08, -56, 0.46, 11,  -4]]);
    }

    angelRing();   /* 前髪の上にハイライトを乗せて一体化させる */
  }

  /* ══════════ ⑩ 服 ══════════ */
  function drawCloth() {
    var os = P.os, k, s;
    var sw = SW + breath * 0.4;

    /* 共通のシルエット */
    ctx.save();
    pathBody();
    ctx.fillStyle = lg(CX - sw, 220, CX + sw * 0.6, 340, [
      [0,    CL[1]],
      [0.30, CL[0]],
      [0.62, CL[0]],
      [1,    CL[1]]
    ]);
    ctx.fill();
    ctx.save(); pathBody(); ctx.clip();

    /* 共通: 上面の受け光と裾の落ち込み */
    ctx.fillStyle = lg(0, 226, 0, 268, [[0, rgba(CL[2], 0.55)], [1, rgba(CL[2], 0)]]);
    ctx.fillRect(CX - sw - 14, 224, (sw + 14) * 2, 50);
    ctx.fillStyle = lg(0, 300, 0, 340, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.34)']]);
    ctx.fillRect(CX - sw - 14, 300, (sw + 14) * 2, 40);
    /* 首の落ち影 */
    fel(CX, 224, 30, 14, 0, 'rgba(0,0,0,0.30)', 1);

    if (os === 0) {                                  /* ── 鎧（アーサー） ── */
      /* 胸当ての中央稜線 */
      ctx.fillStyle = lg(CX - 26, 0, CX + 26, 0, [[0, CL[1]], [0.5, CL[2]], [1, CL[1]]]);
      ctx.beginPath();
      ctx.moveTo(CX - 30, 248); ctx.lineTo(CX, 236); ctx.lineTo(CX + 30, 248);
      ctx.lineTo(CX + 24, 340); ctx.lineTo(CX - 24, 340); ctx.closePath(); ctx.fill();
      /* 青い布 */
      ctx.fillStyle = CL[5];
      ctx.beginPath();
      ctx.moveTo(CX - 20, 240); ctx.lineTo(CX, 268); ctx.lineTo(CX + 20, 240);
      ctx.lineTo(CX + 12, 232); ctx.lineTo(CX - 12, 232); ctx.closePath(); ctx.fill();
      /* 金の縁 */
      ctx.strokeStyle = goldStroke(); ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(CX - 32, 250); ctx.lineTo(CX, 236); ctx.lineTo(CX + 32, 250); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CX - 26, 300); ctx.lineTo(CX + 26, 300); ctx.stroke();
      /* 板金の分割線 */
      ctx.strokeStyle = rgba(CL[1], 0.9); ctx.lineWidth = 1.6;
      for (k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(CX - 44 - k * 3, 278 + k * 20);
        ctx.quadraticCurveTo(CX, 288 + k * 20, CX + 44 + k * 3, 278 + k * 20);
        ctx.stroke();
      }
    } else if (os === 1) {                           /* ── ドレス（アリス） ── */
      /* 黒のボディス */
      ctx.fillStyle = lg(0, 250, 0, 340, [[0, CL[5]], [1, shade(CL[5], 1.6)]]);
      ctx.beginPath();
      ctx.moveTo(CX - 34, 258); ctx.quadraticCurveTo(CX, 246, CX + 34, 258);
      ctx.lineTo(CX + 40, 340); ctx.lineTo(CX - 40, 340); ctx.closePath(); ctx.fill();
      /* 白いパフスリーブ */
      for (s = -1; s <= 1; s += 2) {
        fel(CX + s * (sw - 6), 276, 24, 22, s * 0.2, CL[0], 1);
        fel(CX + s * (sw - 10), 268, 15, 12, s * 0.2, CL[2], 0.7);
        ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = CL[1]; ctx.lineWidth = 1.4;
        for (k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(CX + s * (sw - 20 + k * 9), 262);
          ctx.quadraticCurveTo(CX + s * (sw - 16 + k * 9), 280, CX + s * (sw - 22 + k * 9), 294);
          ctx.stroke();
        }
        ctx.restore();
      }
      /* コルセットの編み上げ（金） */
      ctx.strokeStyle = goldStroke(); ctx.lineWidth = 1.8;
      for (k = 0; k < 4; k++) {
        var yy = 278 + k * 15;
        ctx.beginPath(); ctx.moveTo(CX - 14, yy); ctx.lineTo(CX + 14, yy + 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(CX + 14, yy); ctx.lineTo(CX - 14, yy + 8); ctx.stroke();
      }
    } else if (os === 2) {                           /* ── 魔術師のローブ（セレネ） ── */
      /* 白い内側 */
      ctx.fillStyle = CL[5];
      ctx.beginPath();
      ctx.moveTo(CX - 18, 244); ctx.lineTo(CX, 300); ctx.lineTo(CX + 18, 244); ctx.closePath(); ctx.fill();
      /* 立ち襟 */
      for (s = -1; s <= 1; s += 2) {
        ctx.fillStyle = lg(0, 220, 0, 276, [[0, CL[2]], [1, CL[1]]]);
        ctx.beginPath();
        ctx.moveTo(CX + s * 14, 246);
        ctx.quadraticCurveTo(CX + s * 30, 226, CX + s * 34, 202);
        ctx.quadraticCurveTo(CX + s * 46, 224, CX + s * 42, 266);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = goldStroke(); ctx.lineWidth = 2; ctx.stroke();
      }
      /* 星 */
      for (k = 0; k < 3; k++) {
        spark(CX - 34 + k * 34, 306 + (k % 2) * 12, 5, CL[3], 0.85);
      }
    } else if (os === 3) {                           /* ── 黒コート（ノクト） ── */
      /* 赤い裏地 */
      ctx.fillStyle = CL[5];
      ctx.beginPath();
      ctx.moveTo(CX - 26, 240); ctx.lineTo(CX, 292); ctx.lineTo(CX + 26, 240);
      ctx.lineTo(CX + 18, 232); ctx.lineTo(CX - 18, 232); ctx.closePath(); ctx.fill();
      /* 立てた襟 */
      for (s = -1; s <= 1; s += 2) {
        ctx.fillStyle = lg(0, 210, 0, 280, [[0, CL[2]], [1, CL[1]]]);
        ctx.beginPath();
        ctx.moveTo(CX + s * 12, 250);
        ctx.quadraticCurveTo(CX + s * 34, 224, CX + s * 40, 196);
        ctx.quadraticCurveTo(CX + s * 54, 226, CX + s * 46, 274);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(CL[3], 0.85); ctx.lineWidth = 1.8; ctx.stroke();
      }
      /* 銀のベルト */
      ctx.fillStyle = CL[2];
      ctx.save(); ctx.translate(CX, 306); ctx.rotate(-0.14);
      ctx.fillRect(-58, -6, 116, 11);
      ctx.fillStyle = CL[3]; ctx.fillRect(-9, -8, 18, 15);
      ctx.restore();
    } else if (os === 4) {                           /* ── セーラー（リン） ── */
      /* 青いセーラー襟 */
      ctx.fillStyle = lg(0, 236, 0, 318, [[0, mix(CL[5], '#FFFFFF', 0.20)], [1, CL[5]]]);
      ctx.beginPath();
      ctx.moveTo(CX - 20, 236);
      ctx.lineTo(CX - sw + 4, 262);
      ctx.lineTo(CX - sw + 16, 322);
      ctx.lineTo(CX + sw - 16, 322);
      ctx.lineTo(CX + sw - 4, 262);
      ctx.lineTo(CX + 20, 236);
      ctx.lineTo(CX, 286);
      ctx.closePath(); ctx.fill();
      /* 白い2本線 */
      ctx.strokeStyle = CL[2]; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.9;
      for (k = 0; k < 2; k++) {
        ctx.beginPath();
        ctx.moveTo(CX - 22 - k * 4, 244 + k * 6);
        ctx.lineTo(CX - sw + 10 + k * 4, 268 + k * 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CX + 22 + k * 4, 244 + k * 6);
        ctx.lineTo(CX + sw - 10 - k * 4, 268 + k * 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      /* 胸のリボン */
      fel(CX, 268, 5.5, 5, 0, CL[3], 1);
      lock(CX, 268, CX - 18, 258, 13, -4, CL[3], 1);
      lock(CX, 268, CX + 18, 258, 13,  4, CL[3], 1);
      lock(CX, 270, CX - 10, 300, 9, -3, shade(CL[3], 0.82), 1);
      lock(CX, 270, CX + 9,  302, 9,  3, shade(CL[3], 0.82), 1);
      fel(CX, 268, 3, 2.8, 0, '#FFF3C8', 0.9);
    } else if (os === 5) {                           /* ── 革鎧＋毛皮（ガイ） ── */
      /* 毛皮の襟 */
      ctx.fillStyle = CL[5];
      ctx.beginPath();
      ctx.moveTo(CX - sw - 6, 288);
      for (k = 0; k <= 18; k++) {
        var fx2 = CX - sw - 6 + (sw * 2 + 12) / 18 * k;
        var fy2 = 250 + Math.sin(k * 1.7 + i) * 7 + Math.abs(k - 9) * 1.6;
        ctx.lineTo(fx2, fy2);
      }
      ctx.lineTo(CX + sw + 6, 288);
      ctx.lineTo(CX + 24, 300); ctx.lineTo(CX - 24, 300);
      ctx.closePath(); ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = shade(CL[5], 0.72); ctx.lineWidth = 1.2;
      for (k = 0; k < 14; k++) {
        var hxp = CX - sw + k * (sw * 2 / 13);
        ctx.beginPath(); ctx.moveTo(hxp, 262); ctx.lineTo(hxp + 3, 288); ctx.stroke();
      }
      ctx.restore();
      /* 革のベルト */
      ctx.fillStyle = shade(CL[0], 0.7);
      ctx.save(); ctx.translate(CX, 316); ctx.rotate(0.10);
      ctx.fillRect(-64, -7, 128, 13);
      ctx.fillStyle = CL[3]; ctx.fillRect(-10, -9, 20, 17);
      ctx.restore();
      /* 肩の金属板 */
      fel(CX - sw + 4, 278, 26, 20, -0.24, CL[3], 1);
      fel(CX - sw + 2, 274, 17, 11, -0.24, mix(CL[3], '#FFFFFF', 0.45), 0.75);
    } else if (os === 6) {                           /* ── 和装（ユキ） ── */
      /* 白い襦袢 */
      ctx.fillStyle = CL[5];
      ctx.beginPath();
      ctx.moveTo(CX - 40, 244); ctx.lineTo(CX, 306); ctx.lineTo(CX + 40, 244);
      ctx.lineTo(CX + 28, 236); ctx.lineTo(CX - 28, 236); ctx.closePath(); ctx.fill();
      /* 赤い着物の合わせ */
      for (s = -1; s <= 1; s += 2) {
        ctx.fillStyle = lg(0, 240, 0, 340, [[0, CL[2]], [0.4, CL[0]], [1, CL[1]]]);
        ctx.beginPath();
        ctx.moveTo(CX + s * 26, 240);
        ctx.lineTo(CX + s * (sw + 12), 268);
        ctx.lineTo(CX + s * (sw + 14), 340);
        ctx.lineTo(CX + s * 4, 340);
        ctx.lineTo(CX + s * 6, 300);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(CL[3], 0.8); ctx.lineWidth = 1.6; ctx.stroke();
      }
      /* 金の桜 */
      for (k = 0; k < 5; k++) {
        var sx2 = CX - 52 + hash(k * 4.4 + i) * 104;
        var sy2 = 284 + hash(k * 2.2 + i + 9) * 46;
        var pp;
        ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = CL[3];
        for (pp = 0; pp < 5; pp++) {
          var aa = pp * Math.PI * 2 / 5;
          el(sx2 + Math.cos(aa) * 3.2, sy2 + Math.sin(aa) * 3.2, 2.2, 1.5, aa); ctx.fill();
        }
        ctx.restore();
      }
    } else {                                         /* ── 貴族服（レイ） ── */
      /* 紺の内側 */
      ctx.fillStyle = CL[5];
      ctx.beginPath();
      ctx.moveTo(CX - 22, 240); ctx.lineTo(CX, 296); ctx.lineTo(CX + 22, 240); ctx.closePath(); ctx.fill();
      /* 白いクラヴァット */
      ctx.fillStyle = CL[2];
      ctx.beginPath();
      ctx.moveTo(CX - 12, 236);
      ctx.quadraticCurveTo(CX, 258, CX + 12, 236);
      ctx.quadraticCurveTo(CX + 8, 276, CX, 284);
      ctx.quadraticCurveTo(CX - 8, 276, CX - 12, 236);
      ctx.closePath(); ctx.fill();
      /* 襟 */
      for (s = -1; s <= 1; s += 2) {
        ctx.fillStyle = lg(0, 232, 0, 300, [[0, CL[2]], [1, CL[1]]]);
        ctx.beginPath();
        ctx.moveTo(CX + s * 12, 234);
        ctx.lineTo(CX + s * 42, 250);
        ctx.lineTo(CX + s * 26, 306);
        ctx.lineTo(CX + s * 8, 274);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = goldStroke(); ctx.lineWidth = 2; ctx.stroke();
      }
      /* 金ボタン2列 */
      for (k = 0; k < 3; k++) {
        fel(CX - 30, 296 + k * 15, 3.4, 3.4, 0, CL[3], 1);
        fel(CX + 30, 296 + k * 15, 3.4, 3.4, 0, CL[3], 1);
      }
      /* 肩章 */
      for (s = -1; s <= 1; s += 2) {
        ctx.fillStyle = goldStroke();
        ctx.beginPath();
        ctx.moveTo(CX + s * (sw - 26), 258);
        ctx.lineTo(CX + s * (sw + 6), 266);
        ctx.lineTo(CX + s * (sw + 2), 282);
        ctx.lineTo(CX + s * (sw - 28), 272);
        ctx.closePath(); ctx.fill();
        for (k = 0; k < 5; k++) {
          qline(CX + s * (sw - 24 + k * 7), 276, CX + s * (sw - 24 + k * 7), 288,
                CX + s * (sw - 26 + k * 7), 298, CL[3], 2, 0.9);
        }
      }
    }

    /* 共通: 布のしわ（すべての服に4本） */
    ctx.save();
    ctx.globalAlpha = 0.22; ctx.strokeStyle = shade(CL[1], 0.6); ctx.lineWidth = 2;
    for (k = 0; k < 4; k++) {
      var wx = CX - sw * 0.7 + (sw * 1.4 / 3) * k;
      ctx.beginPath();
      ctx.moveTo(wx, 286 + (k % 2) * 12);
      ctx.quadraticCurveTo(wx + 8, 310, wx + 2, 340);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); /* clip */

    /* 肩の上のふち（服の外側にも見える光） */
    ctx.save();
    ctx.globalAlpha = 0.55; ctx.strokeStyle = CL[2]; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX - 30, 228);
    ctx.bezierCurveTo(CX - sw * 0.74, 236, CX - sw + 2, 250, CX - sw - 1, 272);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CX + 30, 228);
    ctx.bezierCurveTo(CX + sw * 0.74, 236, CX + sw - 2, 250, CX + sw + 1, 272);
    ctx.stroke();
    ctx.restore();

    /* 肩当て（鎧のみ、シルエットの外側に張り出す） */
    if (os === 0) {
      for (s = -1; s <= 1; s += 2) {
        var px = CX + s * (sw - 12), py = 262;
        /* 肩を包む1枚板 */
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px - s * 30, py + 30);
        ctx.bezierCurveTo(px - s * 32, py - 12, px + s * 8, py - 26, px + s * 26, py - 6);
        ctx.bezierCurveTo(px + s * 34, py + 8, px + s * 33, py + 26, px + s * 30, py + 42);
        ctx.quadraticCurveTo(px, py + 52, px - s * 30, py + 30);
        ctx.closePath();
        ctx.fillStyle = lg(px - s * 30, py - 24, px + s * 26, py + 44,
          [[0, CL[2]], [0.34, CL[0]], [1, CL[1]]]);
        ctx.fill();
        ctx.strokeStyle = goldStroke(); ctx.lineWidth = 2.6; ctx.stroke();
        /* 板の分割線 */
        ctx.strokeStyle = rgba(CL[1], 0.9); ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px - s * 28, py + 20);
        ctx.quadraticCurveTo(px + s * 4, py + 30, px + s * 31, py + 18);
        ctx.stroke();
        ctx.restore();
        /* 肩の宝石 */
        fel(px, py + 2, 5.6, 6.4, 0, CL[5], 1);
        fel(px - s * 1.8, py, 2.4, 2.8, 0, '#CFE6FF', 0.9);
        ctx.save(); ctx.strokeStyle = CL[3]; ctx.lineWidth = 1.5;
        el(px, py + 2, 7.0, 7.8, 0); ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
  }

  /* ══════════ ⑪ 装飾（キャラ固有） ══════════ */
  function drawAccessory() {
    var k, s;
    if (i === 0) {                          /* 王冠（サークレット）＋青い宝玉 */
      ctx.save();
      ctx.strokeStyle = goldStroke(); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(CX - HW - 4, U(0.30));
      ctx.quadraticCurveTo(CX, U(0.16), CX + HW + 4, U(0.30));
      ctx.stroke();
      ctx.restore();
      for (k = -1; k <= 1; k += 2) {
        lock(CX + k * 26, U(0.22), CX + k * 28, U(0.10), 6, 0, CL[3], 1);
      }
      lock(CX, U(0.185), CX, U(0.05), 8, 0, CL[3], 1);
      fel(CX, U(0.215), 6.5, 7.5, 0, CL[5], 1);
      fel(CX - 2, U(0.198), 2.6, 3, 0, '#D8ECFF', 0.95);
      ctx.save(); ctx.strokeStyle = CL[4]; ctx.lineWidth = 1.4; el(CX, U(0.215), 7.6, 8.6, 0); ctx.stroke(); ctx.restore();
    } else if (i === 1) {                   /* 黒いカチューシャ＋リボン＋チョーカー */
      ctx.save();
      ctx.strokeStyle = CL[5]; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(CX - HW - 6, U(0.26));
      ctx.quadraticCurveTo(CX, U(0.06), CX + HW + 6, U(0.26));
      ctx.stroke();
      ctx.strokeStyle = rgba(CL[2], 0.5); ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(CX - HW - 4, U(0.25));
      ctx.quadraticCurveTo(CX, U(0.07), CX + HW + 4, U(0.25));
      ctx.stroke();
      ctx.restore();
      /* 左のリボン */
      var rx0 = CX - 34, ry0 = U(0.12);
      lock(rx0, ry0, rx0 - 17, ry0 - 10, 12, -4, CL[5], 1);
      lock(rx0, ry0, rx0 + 3, ry0 - 15, 11,  4, CL[5], 1);
      fel(rx0 - 5, ry0 - 3, 4, 4, 0, CL[3], 1);
      /* チョーカー */
      ctx.save(); ctx.strokeStyle = CL[5]; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(CX - NW - 6, 230); ctx.quadraticCurveTo(CX, 238, CX + NW + 6, 230); ctx.stroke();
      ctx.restore();
      fel(CX, 236, 4, 4.6, 0, CL[3], 1);
      /* 真珠のイヤリング */
      for (s = -1; s <= 1; s += 2) {
        fel(CX + s * (HW + 1), U(0.74), 3.2, 3.6, 0, '#FFFFFF', 0.95);
        fel(CX + s * (HW + 1) - 1, U(0.735), 1.2, 1.4, 0, '#FFFFFF', 1);
      }
    } else if (i === 2) {                   /* 三日月の髪飾り＋星のイヤリング */
      ctx.save();
      ctx.translate(CX - 36, U(0.14)); ctx.rotate(-0.3);
      ctx.fillStyle = CL[3];
      ctx.beginPath();
      ctx.arc(0, 0, 10, Math.PI * 0.28, Math.PI * 1.72, false);
      ctx.arc(4.5, 0, 8.4, Math.PI * 1.72, Math.PI * 0.28, true);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      spark(CX - 24, U(0.06), 5, '#FFFFFF', 0.9);
      for (s = -1; s <= 1; s += 2) {
        qline(CX + s * (HW + 1), U(0.70), CX + s * (HW + 1), U(0.76), CX + s * (HW + 1), U(0.80), CL[3], 1.4, 0.9);
        spark(CX + s * (HW + 1), U(0.84), 4.2, CL[3], 0.95);
      }
    } else if (i === 3) {                   /* 髪留め＋イヤーカフ＋首の帯 */
      ctx.save();
      ctx.translate(CX + 34, U(0.20)); ctx.rotate(0.42);
      ctx.fillStyle = CL[2]; ctx.fillRect(-11, -3, 22, 6);
      ctx.fillStyle = CL[3]; ctx.fillRect(-11, -3, 7, 6);
      ctx.restore();
      for (s = -1; s <= 1; s += 2) {
        ctx.save(); ctx.strokeStyle = CL[2]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(CX + s * (HW + 1), U(0.56), 5, -0.6, 2.2); ctx.stroke(); ctx.restore();
      }
      ctx.save(); ctx.strokeStyle = shade(CL[0], 0.7); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(CX - NW - 5, 228); ctx.quadraticCurveTo(CX, 236, CX + NW + 5, 228); ctx.stroke();
      ctx.restore();
      fel(CX + 6, 234, 4.4, 4.4, 0, CL[3], 1);
    } else if (i === 4) {                   /* ハートの髪留め＋星のピン＋チョーカー */
      var hxx = CX - 40, hyy = U(0.30);
      ctx.save(); ctx.fillStyle = CL[3]; ctx.translate(hxx, hyy); ctx.rotate(-0.2);
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-8, -2, -5, -8, 0, -4);
      ctx.bezierCurveTo(5, -8, 8, -2, 0, 5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      spark(CX + 38, U(0.24), 5, '#FFFFFF', 0.85);
      ctx.save(); ctx.strokeStyle = CL[5]; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(CX - NW - 5, 230); ctx.quadraticCurveTo(CX, 237, CX + NW + 5, 230); ctx.stroke();
      ctx.restore();
    } else if (i === 5) {                   /* 額のバンダナ＋牙のネックレス＋頬の傷 */
      ctx.save();
      ctx.fillStyle = shade(CL[0], 0.62);
      ctx.beginPath();
      ctx.moveTo(CX - HW - 6, U(0.30));
      ctx.quadraticCurveTo(CX, U(0.16), CX + HW + 6, U(0.30));
      ctx.quadraticCurveTo(CX, U(0.30), CX - HW - 6, U(0.40));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = CL[3]; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(CX - HW - 4, U(0.32)); ctx.quadraticCurveTo(CX, U(0.20), CX + HW + 4, U(0.32));
      ctx.stroke();
      ctx.restore();
      lock(CX + HW + 2, U(0.32), CX + HW + 16, U(0.52), 7, 4, shade(CL[0], 0.62), 1);
      /* 牙 */
      ctx.save(); ctx.strokeStyle = shade(CL[5], 0.8); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(CX - 22, 236); ctx.quadraticCurveTo(CX, 254, CX + 22, 236); ctx.stroke();
      ctx.restore();
      lock(CX, 250, CX + 2, 266, 6, 0, CL[5], 1);
      /* 頬の傷 */
      qline(CX + 30, U(0.60), CX + 33, U(0.66), CX + 30, U(0.72), rgba(SK[2], 0.8), 1.6, 1);
    } else if (i === 6) {                   /* 簪（かんざし）＋赤い花 */
      ctx.save(); ctx.translate(CX + 36, U(0.16)); ctx.rotate(0.5);
      ctx.strokeStyle = CL[3]; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(26, 10); ctx.stroke();
      ctx.restore();
      for (k = 0; k < 3; k++) {
        qline(CX + 40 + k * 6, U(0.20), CX + 41 + k * 6, U(0.28), CX + 40 + k * 6, U(0.34), CL[3], 1.2, 0.9);
        fel(CX + 40 + k * 6, U(0.36), 2.6, 3, 0, CL[0], 1);
      }
      /* 花 */
      var fx3 = CX - 38, fy3 = U(0.18);
      for (k = 0; k < 6; k++) {
        var aa2 = k * Math.PI / 3;
        fel(fx3 + Math.cos(aa2) * 5.4, fy3 + Math.sin(aa2) * 5.4, 4.2, 3.0, aa2, CL[0], 1);
      }
      fel(fx3, fy3, 3.2, 3.2, 0, CL[3], 1);
      fel(fx3 - 1, fy3 - 1, 1.2, 1.2, 0, '#FFFBE8', 1);
    } else {                                /* 7 金のサークレット＋耳飾り＋ブローチ */
      ctx.save();
      ctx.strokeStyle = goldStroke(); ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(CX - HW - 2, U(0.32));
      ctx.quadraticCurveTo(CX, U(0.20), CX + HW + 2, U(0.32));
      ctx.stroke();
      ctx.restore();
      fel(CX, U(0.255), 4.6, 5.4, 0, CL[5], 1);
      fel(CX - 1.4, U(0.243), 1.8, 2.1, 0, '#DDEBFF', 0.95);
      for (s = -1; s <= 1; s += 2) {
        fel(CX + s * (HW + 1), U(0.74), 2.6, 3.0, 0, CL[3], 1);
      }
      /* 胸のブローチ */
      fel(CX, 262, 7, 8, 0, CL[3], 1);
      fel(CX, 262, 4, 4.8, 0, CL[5], 1);
      fel(CX - 1.2, 260, 1.6, 1.9, 0, '#E4F2FF', 0.95);
    }
  }

  /* ══════════ ⑫ 仕上げ1: リムライト（逆光の輪郭） ══════════ */
  function drawRim() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    /* 右上からの光しか当たらないよう、斜めにクリップ */
    ctx.beginPath();
    ctx.moveTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W - 78, H); ctx.lineTo(W - 44, 0);
    ctx.closePath(); ctx.clip();
    ctx.strokeStyle = rgba(BG[2], 0.75);
    ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (ctx.shadowBlur != null) { ctx.shadowColor = rgba(BG[2], 0.9); ctx.shadowBlur = 7; }
    pathHairBack(); ctx.stroke();
    pathBody();     ctx.stroke();
    pathSkull(6);   ctx.stroke();
    ctx.lineWidth = 1.4; ctx.globalAlpha = 0.45;
    pathNeck(); ctx.stroke();
    ctx.restore();

    /* 左からの弱い補助光 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(38, 0); ctx.lineTo(64, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,240,215,0.34)'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    pathHairBack(); ctx.stroke();
    pathBody();     ctx.stroke();
    ctx.restore();
  }

  /* ══════════ ⑬ 仕上げ2: ブルーム＋色収差 ══════════ */
  function drawBloomChroma() {
    /* ブルーム: 自分自身を少し拡大して加算合成 */
    if (ctx.canvas && typeof ctx.drawImage === 'function') {
      try {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.11;
        ctx.drawImage(ctx.canvas, -3, -4, W + 6, H + 8);
        ctx.globalAlpha = 0.06;
        ctx.drawImage(ctx.canvas, -7, -9, W + 14, H + 18);
        ctx.restore();
      } catch (e) { /* 自分自身を読めない環境では何もしない */ }
    }
    /* 色収差: シルエットを赤／シアンで左右にずらして screen 合成 */
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
    ctx.translate(-1.2, 0);
    ctx.strokeStyle = 'rgba(255,40,90,0.26)';
    pathHairBack(); ctx.stroke(); pathBody(); ctx.stroke();
    ctx.translate(2.4, 0);
    ctx.strokeStyle = 'rgba(40,170,255,0.26)';
    pathHairBack(); ctx.stroke(); pathBody(); ctx.stroke();
    ctx.restore();
  }

  /* ══════════ ⑭ 仕上げ3: 紙のノイズ＋周辺減光＋金枠 ══════════ */
  function drawFinish() {
    /* 周辺減光 */
    ctx.save();
    ctx.fillStyle = rg(CX, 150, 60, 230, [
      [0,    'rgba(0,0,0,0)'],
      [0.62, 'rgba(0,0,0,0.10)'],
      [1,    'rgba(0,0,0,0.40)']
    ]);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* 紙のノイズ（決定論） */
    ctx.save();
    var k;
    for (k = 0; k < 1100; k++) {
      var nx = hash(k * 1.7 + i * 31) * W;
      var ny = hash(k * 2.9 + i * 17 + 5) * H;
      var na = hash(k * 3.3 + i * 7 + 11);
      ctx.fillStyle = (na > 0.5)
        ? 'rgba(255,252,242,' + (0.030 + na * 0.045).toFixed(3) + ')'
        : 'rgba(20,14,30,'   + (0.030 + na * 0.055).toFixed(3) + ')';
      ctx.fillRect(nx | 0, ny | 0, 1, 1);
    }
    /* 紙の繊維 */
    ctx.globalAlpha = 0.035; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
    for (k = 0; k < 40; k++) {
      var fx4 = hash(k * 5.1 + i * 3) * W, fy4 = hash(k * 6.3 + i * 5) * H;
      ctx.beginPath(); ctx.moveTo(fx4, fy4); ctx.lineTo(fx4 + 6 + hash(k) * 10, fy4 + 2); ctx.stroke();
    }
    ctx.restore();

    /* 金のカード枠 */
    ctx.save();
    ctx.strokeStyle = goldStroke();
    ctx.lineWidth = 5; ctx.lineJoin = 'miter';
    ctx.strokeRect(2.5, 2.5, W - 5, H - 5);
    ctx.strokeStyle = 'rgba(60,38,6,0.75)'; ctx.lineWidth = 1;
    ctx.strokeRect(5.5, 5.5, W - 11, H - 11);
    ctx.strokeStyle = 'rgba(255,246,208,0.55)'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    /* 四隅の飾り */
    var cs = [[8, 8], [W - 8, 8], [8, H - 8], [W - 8, H - 8]];
    for (k = 0; k < 4; k++) {
      ctx.save();
      ctx.translate(cs[k][0], cs[k][1]); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = CL[3]; ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = 'rgba(255,250,220,0.85)'; ctx.fillRect(-1.6, -1.6, 3.2, 3.2);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     描画の実行（重ね順がすべて）
     ══════════════════════════════════════════════════════════════ */
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  drawBG();            /* 1  背景                        */
  drawHairBack();      /* 2  後ろ髪                      */
  drawNeck();          /* 3  首                          */
  drawCloth();         /* 4  肩・服                      */
  drawFace();          /* 5  顔                          */
  drawEars();          /* 6  耳                          */
  drawEye(-1);         /* 7  目（向かって左）            */
  drawEye(1);          /* 8  目（向かって右）            */
  drawBrow(-1);        /* 9  眉                          */
  drawBrow(1);
  drawNoseMouth();     /* 10 鼻・口                      */
  drawHairFront();     /* 11 前髪＋サイド髪＋天使の輪    */
  drawAccessory();     /* 12 装飾                        */
  drawRim();           /* 13 仕上げ1 リムライト          */
  drawBloomChroma();   /* 14 仕上げ2 ブルーム＋色収差    */
  drawFinish();        /* 15 仕上げ3 ノイズ＋減光＋金枠  */

  ctx.restore();
}
