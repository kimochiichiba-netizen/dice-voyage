/* ══════════════════════════════════════════════
   ダイスボヤージュ — 宝石の守護獣8体（自動生成）
   dvG0..dvG7 = 像 240x340（左上原点）
   dvS0..dvS7 = 盤上の駒（接地点原点・上へ約68px）
   ══════════════════════════════════════════════ */

/* ───── aee02ead0833dcbac ───── */
function dvG6(ctx, T) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;
  var BR = 76, BG = 130, BB = 232;
  var DR = 18, DG = 44, DB = 107;
  var lx = -0.55, ly = -0.72, lz = 0.42;
  var ln = Math.sqrt(lx * lx + ly * ly + lz * lz);
  lx /= ln; ly /= ln; lz /= ln;

  var F = [
    { p: [96,100, 78,72, 72,124],                              n: [-0.62,-0.66,0.42] },
    { p: [144,100, 162,72, 168,124],                           n: [ 0.58,-0.63,0.52] },
    { p: [72,124, 96,100, 120,92, 106,126],                    n: [-0.44,-0.78,0.44] },
    { p: [106,126, 120,92, 134,126],                           n: [-0.06,-0.86,0.51] },
    { p: [120,92, 144,100, 168,124, 134,126],                  n: [ 0.47,-0.75,0.47] },
    { p: [72,124, 106,126, 110,152, 76,150],                   n: [-0.52,-0.30,0.80] },
    { p: [106,126, 134,126, 130,152, 110,152],                 n: [-0.10,-0.42,0.90] },
    { p: [134,126, 168,124, 164,150, 130,152],                 n: [ 0.49,-0.28,0.83] },
    { p: [76,150, 110,152, 112,178, 88,176],                   n: [-0.60,-0.08,0.79] },
    { p: [110,152, 130,152, 120,170],                          n: [ 0.05,0.90,0.43] },
    { p: [110,152, 120,170, 112,178],                          n: [-0.30,0.16,0.94] },
    { p: [130,152, 128,178, 120,170],                          n: [ 0.26,0.14,0.95] },
    { p: [130,152, 164,150, 152,176, 128,178],                 n: [ 0.57,-0.06,0.82] },
    { p: [88,176, 66,182, 98,182],                             n: [-0.50,-0.55,0.67] },
    { p: [88,176, 112,178, 128,178, 152,176, 142,182, 98,182], n: [-0.04,-0.52,0.85] },
    { p: [152,176, 174,182, 142,182],                          n: [ 0.62,-0.30,0.72] },
    { p: [66,182, 50,218, 86,225, 98,182],                     n: [-0.72,-0.22,0.66] },
    { p: [50,218, 62,258, 96,268, 86,225],                     n: [-0.78,0.06,0.62] },
    { p: [62,258, 88,282, 96,268],                             n: [-0.66,0.34,0.67] },
    { p: [174,182, 142,182, 154,225, 190,218],                 n: [ 0.70,-0.24,0.67] },
    { p: [190,218, 154,225, 144,268, 178,258],                 n: [ 0.88,0.12,0.42] },
    { p: [178,258, 144,268, 152,282],                          n: [ 0.70,0.52,0.49] },
    { p: [98,182, 142,182, 120,220],                           n: [-0.08,-0.36,0.93] },
    { p: [142,182, 154,225, 120,220],                          n: [ 0.34,-0.18,0.92] },
    { p: [154,225, 144,268, 120,220],                          n: [ 0.38,0.12,0.92] },
    { p: [144,268, 96,268, 120,220],                           n: [-0.03,0.30,0.95] },
    { p: [96,268, 86,225, 120,220],                            n: [-0.36,0.14,0.92] },
    { p: [86,225, 98,182, 120,220],                            n: [-0.32,-0.20,0.93] },
    { p: [96,268, 88,282, 104,290, 112,282],                   n: [-0.42,0.44,0.79] },
    { p: [144,268, 152,282, 136,290, 128,282],                 n: [ 0.40,0.46,0.79] },
    { p: [96,268, 112,282, 128,282, 144,268],                  n: [ 0.05,0.42,0.91] }
  ];

  var SIL = [78,72, 96,100, 120,92, 144,100, 162,72, 168,124, 174,182, 190,218,
             178,258, 152,282, 136,290, 128,282, 112,282, 104,290, 88,282,
             62,258, 50,218, 66,182, 72,124];

  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
    var d = (n[0] * lx + n[1] * ly + n[2] * lz) / m;
    /* lit side: lambert. shadow side: faint bounce light, still ordered by n.L */
    return d > 0 ? d : 0.055 * (1 + d);
  }
  function cl(v) { return v < 0 ? 0 : (v > 255 ? 255 : Math.round(v)); }
  function shade(d) {
    var k = 0.34 + 1.21 * d, r, g, b, u;
    if (k <= 1) {
      u = Math.pow((k - 0.34) / 0.66, 0.85);
      r = DR + (BR - DR) * u; g = DG + (BG - DG) * u; b = DB + (BB - DB) * u;
    } else {
      r = BR * k; g = BG * k; b = BB * k;
    }
    return 'rgb(' + cl(r) + ',' + cl(g) + ',' + cl(b) + ')';
  }
  function lift(a) {
    return cl(BR + (255 - BR) * a) + ',' + cl(BG + (255 - BG) * a) + ',' + cl(BB + (255 - BB) * a);
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (var i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath();
  }

  var bob = Math.sin(t / 2400 * Math.PI * 2) * 2.2;
  var pulse = 0.5 + 0.5 * Math.sin(t / 2600 * Math.PI * 2);
  var i, j, d;

  ctx.save();

  /* floating crystal shards, behind the statue */
  for (i = 0; i < 8; i++) {
    var a = i * (Math.PI * 2 / 8) + t / 3600;
    var rr = 88 + 12 * Math.sin(t / 2100 + i * 1.3);
    var sx = 120 + Math.cos(a) * rr * 0.92;
    var sy = 188 + Math.sin(a) * 40 + 7 * Math.sin(t / 1700 + i);
    var sz = 3.2 + 2.4 * (0.5 + 0.5 * Math.sin(i * 2.1));
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a * 1.7 + t / 2900);
    ctx.globalAlpha = 0.38 + 0.45 * (0.5 + 0.5 * Math.sin(t / 1300 + i * 0.8));
    ctx.fillStyle = shade(0.72 + 0.055 * i);
    ctx.beginPath();
    ctx.moveTo(0, -sz * 1.7);
    ctx.lineTo(sz, -sz * 0.2);
    ctx.lineTo(sz * 0.4, sz * 1.5);
    ctx.lineTo(-sz * 0.7, sz * 0.9);
    ctx.lineTo(-sz, -sz * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* polished metal pedestal */
  ctx.save();
  ctx.fillStyle = '#4a3410';
  ctx.beginPath(); ctx.ellipse(120, 306, 78, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5a1c';
  ctx.beginPath(); ctx.ellipse(120, 301, 78, 16, 0, 0, Math.PI * 2); ctx.fill();
  var gp = ctx.createLinearGradient(0, 280, 0, 312);
  gp.addColorStop(0, '#F7E2A2');
  gp.addColorStop(0.45, '#D9B457');
  gp.addColorStop(1, '#8E6516');
  ctx.fillStyle = gp;
  ctx.beginPath(); ctx.ellipse(120, 296, 78, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#A57C24';
  ctx.beginPath(); ctx.ellipse(120, 296, 62, 11, 0, 0, Math.PI * 2); ctx.fill();
  var gr = ctx.createRadialGradient(120, 296, 2, 120, 296, 60);
  gr.addColorStop(0, 'rgba(' + cl(BR * 1.4) + ',' + cl(BG * 1.4) + ',' + cl(BB * 1.4) + ',0.42)');
  gr.addColorStop(1, 'rgba(76,130,232,0)');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.ellipse(120, 296, 62, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000000';
  ctx.beginPath(); ctx.ellipse(120, 294, 44, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(120, 297, 73, 14, 0, Math.PI * 0.17, Math.PI * 0.83); ctx.stroke();
  ctx.restore();

  /* the statue */
  ctx.save();
  ctx.translate(0, bob);

  var order = [];
  for (i = 0; i < F.length; i++) {
    d = lam(F[i].n);
    order.push({ i: i, d: d });
    ctx.fillStyle = shade(d);
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 0.7;
    poly(F[i].p);
    ctx.fill();
    ctx.stroke();
  }

  /* inner glow, clipped to the silhouette */
  ctx.save();
  poly(SIL);
  ctx.clip();
  var ig = ctx.createRadialGradient(118, 208, 4, 118, 208, 118);
  ig.addColorStop(0, 'rgba(' + lift(0.46) + ',' + (0.30 + 0.14 * pulse).toFixed(3) + ')');
  ig.addColorStop(0.45, 'rgba(' + lift(0.28) + ',' + (0.11 + 0.07 * pulse).toFixed(3) + ')');
  ig.addColorStop(1, 'rgba(' + BR + ',' + BG + ',' + BB + ',0)');
  ctx.fillStyle = ig;
  ctx.fillRect(40, 60, 165, 245);
  ctx.restore();

  /* specular: shrunken similar polygons on the 3 most up-facing facets */
  order.sort(function (p, q) { return q.d - p.d; });
  var sa = [0.9, 0.72, 0.55];
  for (i = 0; i < 3; i++) {
    var fp = F[order[i].i].p, cx = 0, cy = 0, np = fp.length / 2;
    for (j = 0; j < fp.length; j += 2) { cx += fp[j]; cy += fp[j + 1]; }
    cx /= np; cy /= np;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,' + (sa[i] * (0.78 + 0.22 * pulse)).toFixed(3) + ')';
    ctx.beginPath();
    for (j = 0; j < fp.length; j += 2) {
      var px = cx + (fp[j] - cx) * 0.42;
      var py = cy + (fp[j + 1] - cy) * 0.42;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* eyes: two small glowing points only */
  for (i = 0; i < 2; i++) {
    var ex = (i === 0) ? 93 : 147, ey = 139;
    ctx.save();
    var eg = ctx.createRadialGradient(ex, ey, 0.5, ex, ey, 7.5);
    eg.addColorStop(0, 'rgba(255,255,255,' + (0.72 + 0.24 * pulse).toFixed(3) + ')');
    eg.addColorStop(0.35, 'rgba(' + lift(0.62) + ',0.55)');
    eg.addColorStop(1, 'rgba(76,130,232,0)');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex, ey, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* rim light: right-bottom contour only */
  ctx.save();
  ctx.strokeStyle = 'rgba(' + lift(0.58) + ',0.85)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(SIL[12], SIL[13]);
  for (i = 14; i <= 23; i += 2) ctx.lineTo(SIL[i], SIL[i + 1]);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

function dvS6(ctx, col, T, facing) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;
  var fc = (facing === -1) ? -1 : 1;
  var BR = 76, BG = 130, BB = 232;
  var DR = 18, DG = 44, DB = 107;
  var hx = (typeof col === 'string' ? col : '#4C82E8').replace('#', '');
  if (hx.length === 3) hx = hx.charAt(0) + hx.charAt(0) + hx.charAt(1) + hx.charAt(1) + hx.charAt(2) + hx.charAt(2);
  var CR = parseInt(hx.substring(0, 2), 16);
  var CG = parseInt(hx.substring(2, 4), 16);
  var CB = parseInt(hx.substring(4, 6), 16);
  if (!isFinite(CR)) CR = BR;
  if (!isFinite(CG)) CG = BG;
  if (!isFinite(CB)) CB = BB;

  var lx = -0.55, ly = -0.72, lz = 0.42;
  var ln = Math.sqrt(lx * lx + ly * ly + lz * lz);
  lx /= ln; ly /= ln; lz /= ln;

  var F = [
    { p: [-8,-60, -11,-68, -15,-52],                n: [-0.60,-0.64,0.48] },
    { p: [8,-60, 11,-68, 15,-52],                   n: [ 0.56,-0.61,0.56] },
    { p: [-15,-52, -8,-60, 0,-62, 0,-50],           n: [-0.42,-0.80,0.43] },
    { p: [0,-62, 8,-60, 15,-52, 0,-50],             n: [ 0.45,-0.77,0.45] },
    { p: [-15,-52, 0,-50, 0,-32, -11,-32],          n: [-0.50,-0.26,0.83] },
    { p: [0,-50, 15,-52, 11,-32, 0,-32],            n: [ 0.47,-0.24,0.85] },
    { p: [-11,-32, 0,-32, 11,-32, 13,-29, -13,-29], n: [-0.05,-0.50,0.86] },
    { p: [-13,-29, -8,-29, -11,-18, -19,-20],       n: [-0.71,-0.20,0.67] },
    { p: [-19,-20, -11,-18, -8,-3, -15,-6],         n: [-0.77,0.10,0.63] },
    { p: [8,-29, 13,-29, 19,-20, 11,-18],           n: [ 0.69,-0.22,0.69] },
    { p: [19,-20, 15,-6, 8,-3, 11,-18],             n: [ 0.75,0.12,0.65] },
    { p: [-8,-29, 8,-29, 0,-18],                    n: [-0.09,-0.38,0.92] },
    { p: [8,-29, 11,-18, 0,-18],                    n: [ 0.33,-0.16,0.93] },
    { p: [11,-18, 8,-3, 0,-18],                     n: [ 0.37,0.14,0.92] },
    { p: [8,-3, -8,-3, 0,-18],                      n: [-0.02,0.32,0.95] },
    { p: [-8,-3, -11,-18, 0,-18],                   n: [-0.35,0.16,0.92] },
    { p: [-11,-18, -8,-29, 0,-18],                  n: [-0.31,-0.22,0.92] },
    { p: [-8,-3, 8,-3, 6,0, -6,0],                  n: [ 0.04,0.44,0.90] }
  ];

  var SIL = [-11,-68, -8,-60, 0,-62, 8,-60, 11,-68, 15,-52, 11,-32, 13,-29,
             19,-20, 15,-6, 8,-3, 6,0, -6,0, -8,-3, -15,-6, -19,-20, -13,-29,
             -11,-32, -15,-52];

  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
    var d = (n[0] * lx + n[1] * ly + n[2] * lz) / m;
    /* lit side: lambert. shadow side: faint bounce light, still ordered by n.L */
    return d > 0 ? d : 0.055 * (1 + d);
  }
  function cl(v) { return v < 0 ? 0 : (v > 255 ? 255 : Math.round(v)); }
  function shade(d) {
    var k = 0.34 + 1.21 * d, r, g, b, u;
    if (k <= 1) {
      u = Math.pow((k - 0.34) / 0.66, 0.85);
      r = DR + (BR - DR) * u; g = DG + (BG - DG) * u; b = DB + (BB - DB) * u;
    } else {
      r = BR * k; g = BG * k; b = BB * k;
    }
    return 'rgb(' + cl(r) + ',' + cl(g) + ',' + cl(b) + ')';
  }
  function lift(a) {
    return cl(BR + (255 - BR) * a) + ',' + cl(BG + (255 - BG) * a) + ',' + cl(BB + (255 - BB) * a);
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (var i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath();
  }

  var bob = Math.sin(t / 2000 * Math.PI * 2) * 1.5;
  var pulse = 0.5 + 0.5 * Math.sin(t / 2600 * Math.PI * 2);
  var i, j, d;

  ctx.save();

  /* contact shadow */
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000000';
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* pedestal ring in the owner's colour */
  ctx.save();
  ctx.fillStyle = 'rgb(' + cl(CR * 0.42) + ',' + cl(CG * 0.42) + ',' + cl(CB * 0.42) + ')';
  ctx.beginPath(); ctx.ellipse(0, 1.5, 19, 6, 0, 0, Math.PI * 2); ctx.fill();
  var pg = ctx.createLinearGradient(0, -6, 0, 6);
  pg.addColorStop(0, 'rgb(' + cl(CR * 1.5 + 42) + ',' + cl(CG * 1.5 + 42) + ',' + cl(CB * 1.5 + 42) + ')');
  pg.addColorStop(1, 'rgb(' + cl(CR * 0.62) + ',' + cl(CG * 0.62) + ',' + cl(CB * 0.62) + ')');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.ellipse(0, -0.5, 19, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgb(' + cl(CR * 0.8) + ',' + cl(CG * 0.8) + ',' + cl(CB * 0.8) + ')';
  ctx.beginPath(); ctx.ellipse(0, -0.5, 13, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, 0, 17.5, 5.2, 0, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.restore();

  /* the piece */
  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(fc, 1);

  var order = [];
  for (i = 0; i < F.length; i++) {
    d = lam(F[i].n);
    order.push({ i: i, d: d });
    ctx.fillStyle = shade(d);
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 0.6;
    poly(F[i].p);
    ctx.fill();
    ctx.stroke();
  }

  /* inner glow in the owner's colour */
  ctx.save();
  poly(SIL);
  ctx.clip();
  var ig = ctx.createRadialGradient(-1, -26, 1, -1, -26, 40);
  ig.addColorStop(0, 'rgba(' + cl(CR * 1.7) + ',' + cl(CG * 1.7) + ',' + cl(CB * 1.7) + ',' + (0.36 + 0.14 * pulse).toFixed(3) + ')');
  ig.addColorStop(1, 'rgba(' + cl(CR) + ',' + cl(CG) + ',' + cl(CB) + ',0)');
  ctx.fillStyle = ig;
  ctx.fillRect(-22, -72, 44, 76);
  ctx.restore();

  /* specular on the 2 most up-facing facets */
  order.sort(function (p, q) { return q.d - p.d; });
  var sa = [0.85, 0.58];
  for (i = 0; i < 2; i++) {
    var fp = F[order[i].i].p, cx = 0, cy = 0, np = fp.length / 2;
    for (j = 0; j < fp.length; j += 2) { cx += fp[j]; cy += fp[j + 1]; }
    cx /= np; cy /= np;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,' + (sa[i] * (0.8 + 0.2 * pulse)).toFixed(3) + ')';
    ctx.beginPath();
    for (j = 0; j < fp.length; j += 2) {
      var px = cx + (fp[j] - cx) * 0.44;
      var py = cy + (fp[j + 1] - cy) * 0.44;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* eyes as glowing points */
  for (i = 0; i < 2; i++) {
    var ex = (i === 0) ? -6.5 : 6.5, ey = -44;
    ctx.save();
    var eg = ctx.createRadialGradient(ex, ey, 0.3, ex, ey, 4.2);
    eg.addColorStop(0, 'rgba(255,255,255,' + (0.7 + 0.25 * pulse).toFixed(3) + ')');
    eg.addColorStop(1, 'rgba(' + cl(CR * 1.4) + ',' + cl(CG * 1.4) + ',' + cl(CB * 1.4) + ',0)');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex, ey, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* rim light on the right-bottom contour only */
  ctx.save();
  ctx.strokeStyle = 'rgba(' + lift(0.58) + ',0.85)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(SIL[12], SIL[13]);
  for (i = 14; i <= 22; i += 2) ctx.lineTo(SIL[i], SIL[i + 1]);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

/* ───── ae4d496f794fd3814 ───── */
function dvG5(ctx, T) {
  var t = (typeof T === 'number' && isFinite(T)) ? T / 1000 : 0;
  var bob = Math.sin(t * 1.15) * 2.4;
  var pulse = 0.5 + 0.5 * Math.sin(t * 2.4166);

  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var LN = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
  LX /= LN; LY /= LN; LZ /= LN;

  var BR = [246, 230, 238], DK = [176, 144, 168];

  function cl(v) { v = Math.round(v); return v < 0 ? 0 : (v > 255 ? 255 : v); }
  function tone(n, i, k) {
    var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * LX + n[1] * LY + n[2] * LZ) / l;
    if (d < 0) d = 0;
    var v = 0.34 + 1.21 * d, r, g, b, u;
    if (v <= 1) {
      u = (v - 0.34) / 0.66;
      r = DK[0] + (BR[0] - DK[0]) * u;
      g = DK[1] + (BR[1] - DK[1]) * u;
      b = DK[2] + (BR[2] - DK[2]) * u;
    } else {
      u = (v - 1) / 0.55;
      r = BR[0] + (255 - BR[0]) * u;
      g = BR[1] + (255 - BR[1]) * u;
      b = BR[2] + (255 - BR[2]) * u;
    }
    var a = i * 1.017 + 0.4, amp = 0.55 + 0.75 * v;
    r += 8.6 * Math.sin(a) * amp;
    g += 8.6 * Math.sin(a + 2.094) * amp;
    b += 8.6 * Math.sin(a + 4.189) * amp;
    if (k !== 1) { r *= k; g *= k; b *= k; }
    return 'rgb(' + cl(r) + ',' + cl(g) + ',' + cl(b) + ')';
  }
  function trace(p) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (var j = 2; j < p.length; j += 2) ctx.lineTo(p[j], p[j + 1]);
    ctx.closePath();
  }
  function area(p) {
    var s = 0, j, k2;
    for (j = 0; j < p.length; j += 2) {
      k2 = (j + 2) % p.length;
      s += p[j] * p[k2 + 1] - p[k2] * p[j + 1];
    }
    return s / 2;
  }

  /* [頂点, 法線, 暗化係数, スペキュラのalpha] 32面 */
  var FS = [
    [[172, 240, 166, 276, 182, 270, 186, 252], [0.78, -0.30, 0.55], 1, 0],
    [[97, 151, 108, 148, 90, 86, 82, 88], [-0.72, -0.30, 0.62], 1, 0],
    [[108, 148, 120, 145, 98, 84, 90, 86], [-0.10, -0.36, 0.93], 1, 0],
    [[82, 88, 98, 84, 87, 75], [-0.42, -0.80, 0.43], 1, 0.86],
    [[143, 151, 132, 148, 150, 86, 158, 88], [0.68, -0.34, 0.65], 1, 0],
    [[132, 148, 120, 145, 142, 84, 150, 86], [0.14, -0.30, 0.94], 1, 0],
    [[158, 88, 142, 84, 153, 75], [0.38, -0.78, 0.50], 1, 0],
    [[104, 224, 120, 186, 156, 204], [0.28, -0.66, 0.70], 1, 0],
    [[104, 224, 156, 204, 172, 240], [0.80, -0.26, 0.54], 1, 0],
    [[104, 224, 172, 240, 166, 276], [0.86, 0.16, 0.48], 1, 0],
    [[104, 224, 166, 276, 140, 292], [0.56, 0.56, 0.61], 1, 0],
    [[104, 224, 140, 292, 100, 292], [0.06, 0.72, 0.69], 1, 0],
    [[104, 224, 100, 292, 74, 274], [-0.52, 0.60, 0.61], 1, 0],
    [[104, 224, 74, 274, 68, 238], [-0.84, 0.20, 0.50], 1, 0],
    [[104, 224, 68, 238, 86, 203], [-0.76, -0.32, 0.57], 1, 0],
    [[104, 224, 86, 203, 120, 186], [-0.20, -0.74, 0.64], 1, 0.60],
    [[74, 274, 100, 292, 92, 294, 60, 286], [-0.58, 0.50, 0.64], 1, 0],
    [[166, 276, 140, 292, 148, 294, 180, 286], [0.60, 0.46, 0.66], 1, 0],
    [[100, 292, 118, 292, 116, 276, 108, 268, 99, 277], [-0.30, 0.34, 0.89], 1, 0],
    [[122, 292, 140, 292, 143, 278, 133, 269, 124, 277], [0.26, 0.30, 0.92], 1, 0],
    [[113, 152, 120, 120, 147, 133], [0.25, -0.72, 0.65], 1, 0],
    [[113, 152, 147, 133, 157, 158], [0.78, -0.22, 0.58], 1, 0],
    [[113, 152, 157, 158, 146, 186], [0.72, 0.28, 0.63], 1, 0],
    [[113, 152, 146, 186, 133, 196], [0.50, 0.44, 0.75], 1, 0],
    [[113, 152, 133, 196, 120, 199], [0.22, 0.50, 0.84], 1, 0],
    [[113, 152, 120, 199, 107, 196], [-0.18, 0.52, 0.83], 1, 0],
    [[113, 152, 107, 196, 94, 186], [-0.46, 0.42, 0.78], 1, 0],
    [[113, 152, 94, 186, 83, 158], [-0.74, 0.24, 0.63], 1, 0],
    [[113, 152, 83, 158, 93, 133], [-0.82, -0.18, 0.54], 1, 0],
    [[113, 152, 93, 133, 120, 120], [-0.34, -0.68, 0.65], 1, 0.72],
    [[100, 157, 106, 155, 107, 161, 101, 163], [0.35, 0.55, -0.75], 0.50, 0],
    [[134, 155, 140, 157, 139, 163, 133, 161], [0.45, 0.50, -0.74], 0.56, 0]
  ];

  var i, j, p, cx2, cy2, sp, g, ang, rad, sx, sy, sz;

  ctx.save();

  /* 落ち影 */
  ctx.fillStyle = 'rgba(24,12,26,0.3)';
  ctx.beginPath();
  ctx.ellipse(120, 315, 66, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  /* 浮遊する結晶片 */
  for (i = 0; i < 8; i++) {
    ang = t * 0.42 + i * (Math.PI * 2 / 8);
    rad = 80 + 16 * Math.sin(i * 1.7);
    sx = 120 + Math.cos(ang) * rad;
    sy = 198 + Math.sin(ang * 0.8 + i) * 48 + Math.sin(t * 0.9 + i * 1.3) * 7;
    sz = 5.2 + 2.4 * Math.sin(i * 2.1);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang * 1.7 + i);
    ctx.globalAlpha = 0.6 + 0.25 * Math.sin(t * 1.4 + i);
    ctx.fillStyle = tone([-0.4 + 0.05 * i, -0.7, 0.55], 100 + i, 1);
    trace([0, -sz * 1.6, sz, 0, 0, sz * 1.2]);
    ctx.fill();
    ctx.fillStyle = tone([0.55, 0.25 - 0.06 * i, 0.72], 140 + i, 1);
    trace([0, -sz * 1.6, -sz * 0.8, sz * 0.2, 0, sz * 1.2]);
    ctx.fill();
    ctx.restore();
  }

  /* 磨かれた金属の台座 */
  ctx.save();
  g = ctx.createLinearGradient(0, 288, 0, 314);
  g.addColorStop(0, '#7A5A1C');
  g.addColorStop(1, '#33240A');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(120, 304, 62, 12, 0, 0, Math.PI);
  ctx.lineTo(58, 296);
  ctx.closePath();
  ctx.fill();
  g = ctx.createLinearGradient(0, 284, 0, 308);
  g.addColorStop(0, '#F6DDA2');
  g.addColorStop(0.55, '#C9A24E');
  g.addColorStop(1, '#8F6C22');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(120, 296, 62, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5D4413';
  ctx.beginPath();
  ctx.ellipse(120, 296, 45, 8.2, 0, 0, Math.PI * 2);
  ctx.fill();
  /* 守護獣の色の映り込み */
  ctx.fillStyle = 'rgba(246,230,238,0.20)';
  ctx.beginPath();
  ctx.ellipse(118, 297, 38, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  /* 手前の白いハイライトの弧 */
  ctx.strokeStyle = 'rgba(255,252,236,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(120, 296, 61, 11.4, 0, 0.45, 2.2);
  ctx.stroke();
  ctx.restore();

  /* 像本体 */
  ctx.save();
  ctx.translate(0, bob);

  /* 面の継ぎ目つぶし（下地・のちに全面が上書きされる） */
  ctx.fillStyle = 'rgb(199,171,193)';
  for (i = 0; i < FS.length; i++) { trace(FS[i][0]); ctx.fill(); }

  /* 面（すべて単色・線なし） */
  for (i = 0; i < FS.length; i++) {
    ctx.fillStyle = tone(FS[i][1], i, FS[i][2]);
    trace(FS[i][0]);
    ctx.fill();
  }

  /* スペキュラ（相似の縮小多角形） */
  for (i = 0; i < FS.length; i++) {
    if (!FS[i][3]) continue;
    p = FS[i][0]; cx2 = 0; cy2 = 0;
    for (j = 0; j < p.length; j += 2) { cx2 += p[j]; cy2 += p[j + 1]; }
    cx2 /= (p.length / 2); cy2 /= (p.length / 2);
    sp = [];
    for (j = 0; j < p.length; j += 2) {
      sp.push(cx2 + (p[j] - cx2) * 0.42, cy2 + (p[j + 1] - cy2) * 0.42);
    }
    ctx.fillStyle = 'rgba(255,255,255,' + FS[i][3] + ')';
    trace(sp);
    ctx.fill();
  }

  /* 内部の発光（シルエットでclip） */
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < FS.length; i++) {
    p = FS[i][0];
    if (area(p) < 0) {
      ctx.moveTo(p[p.length - 2], p[p.length - 1]);
      for (j = p.length - 4; j >= 0; j -= 2) ctx.lineTo(p[j], p[j + 1]);
    } else {
      ctx.moveTo(p[0], p[1]);
      for (j = 2; j < p.length; j += 2) ctx.lineTo(p[j], p[j + 1]);
    }
    ctx.closePath();
  }
  ctx.clip();
  g = ctx.createRadialGradient(116, 216, 4, 116, 216, 88);
  g.addColorStop(0, 'rgba(255,246,252,' + (0.16 + 0.14 * pulse).toFixed(3) + ')');
  g.addColorStop(0.55, 'rgba(255,238,249,' + (0.07 + 0.06 * pulse).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(255,236,247,0)');
  ctx.fillStyle = g;
  ctx.fillRect(40, 50, 180, 270);
  ctx.restore();

  /* リムライト（右下の輪郭だけ） */
  ctx.strokeStyle = 'rgba(255,251,254,0.9)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  ctx.moveTo(153, 75); ctx.lineTo(158, 88); ctx.lineTo(145, 139);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(147, 133); ctx.lineTo(157, 158); ctx.lineTo(146, 186);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(156, 204); ctx.lineTo(172, 240); ctx.lineTo(186, 252); ctx.lineTo(182, 270); ctx.lineTo(166, 276);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(166, 276); ctx.lineTo(180, 286); ctx.lineTo(148, 294);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

function dvS5(ctx, col, T, facing) {
  var t = (typeof T === 'number' && isFinite(T)) ? T / 1000 : 0;
  var bob = Math.sin(t * Math.PI) * 1.5;
  var f = (facing === -1) ? -1 : 1;

  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var LN = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
  LX /= LN; LY /= LN; LZ /= LN;

  var BR = [246, 230, 238], DK = [176, 144, 168];

  function cl(v) { v = Math.round(v); return v < 0 ? 0 : (v > 255 ? 255 : v); }
  function hex(h) {
    var s = String(h === undefined || h === null ? '#888888' : h).replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var v = parseInt(s, 16);
    if (isNaN(v)) v = 8947848;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function tone(n, i, k) {
    var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * LX + n[1] * LY + n[2] * LZ) / l;
    if (d < 0) d = 0;
    var v = 0.34 + 1.21 * d, r, g, b, u;
    if (v <= 1) {
      u = (v - 0.34) / 0.66;
      r = DK[0] + (BR[0] - DK[0]) * u;
      g = DK[1] + (BR[1] - DK[1]) * u;
      b = DK[2] + (BR[2] - DK[2]) * u;
    } else {
      u = (v - 1) / 0.55;
      r = BR[0] + (255 - BR[0]) * u;
      g = BR[1] + (255 - BR[1]) * u;
      b = BR[2] + (255 - BR[2]) * u;
    }
    var a = i * 1.153 + 0.9, amp = 0.55 + 0.75 * v;
    r += 8.6 * Math.sin(a) * amp;
    g += 8.6 * Math.sin(a + 2.094) * amp;
    b += 8.6 * Math.sin(a + 4.189) * amp;
    if (k !== 1) { r *= k; g *= k; b *= k; }
    return 'rgb(' + cl(r) + ',' + cl(g) + ',' + cl(b) + ')';
  }
  function trace(p) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (var j = 2; j < p.length; j += 2) ctx.lineTo(p[j], p[j + 1]);
    ctx.closePath();
  }
  function area(p) {
    var s = 0, j, k2;
    for (j = 0; j < p.length; j += 2) {
      k2 = (j + 2) % p.length;
      s += p[j] * p[k2 + 1] - p[k2] * p[j + 1];
    }
    return s / 2;
  }

  /* 17面（接地点が原点・上が -y） */
  var FS = [
    [[-5, -49, -13, -50, -17, -67], [-0.72, -0.32, 0.62], 1, 0],
    [[-5, -49, -17, -67, -9, -68], [-0.24, -0.44, 0.87], 1, 0.7],
    [[5, -49, 13, -50, 17, -67], [0.68, -0.36, 0.64], 1, 0],
    [[5, -49, 17, -67, 9, -68], [0.20, -0.48, 0.85], 1, 0],
    [[-4, -17, 0, -35, 20, -20], [0.34, -0.66, 0.67], 1, 0],
    [[-4, -17, 20, -20, 14, 0], [0.86, 0.12, 0.50], 1, 0],
    [[-4, -17, 14, 0, -14, 0], [0.05, 0.74, 0.67], 1, 0],
    [[-4, -17, -14, 0, -20, -20], [-0.83, 0.22, 0.51], 1, 0],
    [[-4, -17, -20, -20, 0, -35], [-0.30, -0.72, 0.62], 1, 0.62],
    [[-16, -6, -4, -4, -3, 1, -17, -1], [-0.56, 0.48, 0.68], 1, 0],
    [[16, -6, 4, -4, 3, 1, 17, -1], [0.60, 0.44, 0.66], 1, 0],
    [[-4, -45, 0, -57, 14, -48], [0.42, -0.62, 0.66], 1, 0],
    [[-4, -45, 14, -48, 12, -34], [0.80, 0.20, 0.56], 1, 0],
    [[-4, -45, 12, -34, -10, -34], [0.10, 0.68, 0.73], 1, 0],
    [[-4, -45, -10, -34, -15, -48], [-0.76, 0.26, 0.60], 1, 0],
    [[-4, -45, -15, -48, 0, -57], [-0.38, -0.70, 0.60], 1, 0.66],
    [[4, -46, 9, -45, 8, -41, 3, -42], [0.40, 0.50, -0.75], 0.58, 0]
  ];

  var c = hex(col), i, j, p, g, cx2, cy2, sp, pg;

  ctx.save();

  /* 落ち影 */
  ctx.fillStyle = 'rgba(20,10,22,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 19, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  /* プレイヤー色の台座リング */
  ctx.fillStyle = 'rgb(' + cl(c[0] * 0.4) + ',' + cl(c[1] * 0.4) + ',' + cl(c[2] * 0.4) + ')';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgb(' + cl(c[0] * 1.2 + 26) + ',' + cl(c[1] * 1.2 + 26) + ',' + cl(c[2] * 1.2 + 26) + ')';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 5.4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18.2, 4.3, 0, 0.5, 2.3);
  ctx.stroke();

  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(f, 1);

  ctx.fillStyle = 'rgb(199,171,193)';
  for (i = 0; i < FS.length; i++) { trace(FS[i][0]); ctx.fill(); }

  for (i = 0; i < FS.length; i++) {
    ctx.fillStyle = tone(FS[i][1], i, FS[i][2]);
    trace(FS[i][0]);
    ctx.fill();
  }

  for (i = 0; i < FS.length; i++) {
    if (!FS[i][3]) continue;
    p = FS[i][0]; cx2 = 0; cy2 = 0;
    for (j = 0; j < p.length; j += 2) { cx2 += p[j]; cy2 += p[j + 1]; }
    cx2 /= (p.length / 2); cy2 /= (p.length / 2);
    sp = [];
    for (j = 0; j < p.length; j += 2) {
      sp.push(cx2 + (p[j] - cx2) * 0.44, cy2 + (p[j + 1] - cy2) * 0.44);
    }
    ctx.fillStyle = 'rgba(255,255,255,' + FS[i][3] + ')';
    trace(sp);
    ctx.fill();
  }

  /* 内部の発光＝プレイヤー色 */
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < FS.length; i++) {
    p = FS[i][0];
    if (area(p) < 0) {
      ctx.moveTo(p[p.length - 2], p[p.length - 1]);
      for (j = p.length - 4; j >= 0; j -= 2) ctx.lineTo(p[j], p[j + 1]);
    } else {
      ctx.moveTo(p[0], p[1]);
      for (j = 2; j < p.length; j += 2) ctx.lineTo(p[j], p[j + 1]);
    }
    ctx.closePath();
  }
  ctx.clip();
  pg = 0.5 + 0.5 * Math.sin(t * 2.4166);
  g = ctx.createRadialGradient(-2, -24, 2, -2, -24, 30);
  g.addColorStop(0, 'rgba(' + cl(c[0] * 1.7) + ',' + cl(c[1] * 1.7) + ',' + cl(c[2] * 1.7) + ',' + (0.20 + 0.16 * pg).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(' + cl(c[0] * 1.7) + ',' + cl(c[1] * 1.7) + ',' + cl(c[2] * 1.7) + ',0)');
  ctx.fillStyle = g;
  ctx.fillRect(-24, -74, 48, 78);
  ctx.restore();

  /* リムライト（右下だけ） */
  ctx.strokeStyle = 'rgba(255,251,254,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(17, -67); ctx.lineTo(13, -50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(14, -48); ctx.lineTo(12, -34); ctx.lineTo(20, -20); ctx.lineTo(14, 0);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

/* ───── a488b71ab5f9fd0eb ───── */
function dvG3(ctx, T) {
  var t = (T || 0) / 1000;
  var L = [-0.55, -0.72, 0.42];
  var BASE = [240, 74, 90];
  var DARK = [122, 16, 32];
  var i, k, a0, a1, am;

  function nz(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function lam(v) {
    var d = v[0] * L[0] + v[1] * L[1] + v[2] * L[2];
    var amb = 0.03 * (v[2] + 1);
    return (d > 0 ? Math.pow(d, 1.55) : 0) + amb;
  }
  function hue(l) {
    var m = 0.34 + l * 1.21, u, r, g, b;
    if (m <= 1) {
      u = (m - 0.34) / 0.66;
      r = DARK[0] + (BASE[0] - DARK[0]) * u;
      g = DARK[1] + (BASE[1] - DARK[1]) * u;
      b = DARK[2] + (BASE[2] - DARK[2]) * u;
    } else {
      r = BASE[0] * m; g = BASE[1] * m; b = BASE[2] * m;
      if (r > 255) { u = r - 255; r = 255; g += u * 0.34; b += u * 0.28; }
      if (g > 255) g = 255;
      if (b > 255) b = 255;
    }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var q = 1; q < p.length; q++) ctx.lineTo(p[q][0], p[q][1]);
    ctx.closePath();
  }
  function area(p) {
    var s = 0, q, r;
    for (q = 0; q < p.length; q++) {
      r = (q + 1) % p.length;
      s += p[q][0] * p[r][1] - p[r][0] * p[q][1];
    }
    return Math.abs(s) / 2;
  }

  /* ===== 面データ 34枚（奥→手前の順に積む） ===== */
  var F = [];

  /* とぐろの内側（遠い側の胴）1面 */
  var hole = [];
  for (i = 0; i < 10; i++) {
    a0 = i * Math.PI / 5;
    hole.push([120 + 22 * Math.cos(a0), 260 + 9 * Math.sin(a0)]);
  }
  F.push({ p: hole, n: nz([0.66, -0.06, 0.74]) });

  /* とぐろのリング 10面（奥5枚を先に、手前5枚は最後） */
  var ring = [];
  for (i = 0; i < 10; i++) {
    a0 = i * Math.PI / 5;
    a1 = (i + 1) * Math.PI / 5;
    am = (a0 + a1) / 2;
    ring.push({
      p: [
        [120 + 72 * Math.cos(a0), 265 + 27 * Math.sin(a0)],
        [120 + 72 * Math.cos(a1), 265 + 27 * Math.sin(a1)],
        [120 + 22 * Math.cos(a1), 260 + 9 * Math.sin(a1)],
        [120 + 22 * Math.cos(a0), 260 + 9 * Math.sin(a0)]
      ],
      n: nz([Math.cos(am) * 0.62, Math.sin(am) * 0.5 - 0.42 + (i % 2 ? 0.16 : -0.12),
             0.66 + (i + 1) * 0.017]),
      f: Math.sin(am) > 0
    });
  }
  for (i = 0; i < 10; i++) if (!ring[i].f) F.push(ring[i]);

  /* 尾の先 1面 */
  F.push({ p: [[51.5, 256.7], [61.8, 249.1], [39, 238]], n: nz([-0.60, -0.52, 0.60]) });

  /* 胴〜首 5区間 ×（左facet／右facet）= 10面。稜線を立てるため法線は交互 */
  var spine = [
    [112, 250, 26], [104, 224, 24], [108, 198, 21],
    [124, 172, 18], [136, 148, 15], [134, 124, 12]
  ];
  for (i = 0; i < 5; i++) {
    var s0 = spine[i], s1 = spine[i + 1];
    var r0 = s0[0] + s0[2] * 0.2, r1 = s1[0] + s1[2] * 0.2;
    F.push({
      p: [[s0[0] - s0[2], s0[1]], [r0, s0[1]], [r1, s1[1]], [s1[0] - s1[2], s1[1]]],
      n: (i % 2 ? nz([-0.46 - i * 0.012, -0.60 + i * 0.016, 0.68 + i * 0.02])
                : nz([-0.78 + i * 0.014, -0.24 - i * 0.018, 0.56 + i * 0.02]))
    });
    F.push({
      p: [[r0, s0[1]], [s0[0] + s0[2], s0[1]], [s1[0] + s1[2], s1[1]], [r1, s1[1]]],
      n: (i % 2 ? nz([0.66 - i * 0.015, -0.28 - i * 0.012, 0.70 + i * 0.018])
                : nz([0.52 + i * 0.016, -0.40 + i * 0.014, 0.74 - i * 0.02]))
    });
  }

  /* 背の棘 4面 */
  var spike = [
    [[128, 222], [129, 204], [150, 208], [0.44, -0.56, 0.70]],
    [[129, 200], [136, 182], [156, 188], [0.52, -0.48, 0.66]],
    [[140, 176], [147, 158], [168, 164], [0.38, -0.64, 0.62]],
    [[149, 154], [150, 136], [170, 142], [0.63, -0.37, 0.55]]
  ];
  for (i = 0; i < 4; i++) F.push({ p: [spike[i][0], spike[i][1], spike[i][2]], n: nz(spike[i][3]) });

  /* 頭部 5面 */
  F.push({ p: [[118, 109], [153, 97], [169, 111], [142, 120]], n: nz([-0.09, -0.96, 0.29]) });
  F.push({ p: [[118, 109], [142, 120], [128, 137], [109, 125]], n: nz([-0.72, -0.08, 0.60]) });
  F.push({ p: [[118, 109], [109, 125], [84, 120], [93, 104]], n: nz([-0.46, -0.56, 0.72]) });
  F.push({ p: [[109, 127], [86, 123], [91, 137], [114, 139]], n: nz([-0.28, 0.36, 0.86]) });
  F.push({ p: [[142, 120], [169, 111], [162, 130], [137, 134]], n: nz([0.53, -0.18, 0.83]) });

  /* 角 2面 */
  F.push({ p: [[153, 97], [172, 76], [161, 99]], n: nz([0.30, -0.72, 0.60]) });
  F.push({ p: [[134, 105], [145, 74], [151, 101]], n: nz([-0.10, -0.70, 0.70]) });

  /* 目（一段暗い小さな面）1面 */
  F.push({ p: [[114, 112], [122, 109], [121, 117], [113, 116]], n: nz([0.35, 0.55, -0.72]) });

  /* とぐろ手前側 5面 */
  for (i = 0; i < 10; i++) if (ring[i].f) F.push(ring[i]);

  for (i = 0; i < F.length; i++) F[i].l = lam(F[i].n);

  /* ===== 描画 ===== */
  ctx.save();

  /* 落ち影 */
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(120, 297, 74, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  /* 磨かれた金属の台座 */
  ctx.fillStyle = 'rgba(96,66,20,1)';
  ctx.beginPath();
  ctx.ellipse(120, 309, 88, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  var gp = ctx.createLinearGradient(0, 286, 0, 314);
  gp.addColorStop(0, 'rgba(255,226,150,1)');
  gp.addColorStop(0.45, 'rgba(206,158,58,1)');
  gp.addColorStop(1, 'rgba(140,96,26,1)');
  ctx.fillStyle = gp;
  ctx.beginPath();
  ctx.ellipse(120, 300, 88, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(120, 300, 88, 13, 0, 0, Math.PI * 2);
  ctx.clip();
  var gr = ctx.createRadialGradient(120, 297, 2, 120, 297, 62);
  gr.addColorStop(0, 'rgba(240,74,90,0.32)');
  gr.addColorStop(1, 'rgba(240,74,90,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(28, 284, 184, 32);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(120, 301, 79, 10, 0, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();

  /* 像（ごくわずかに上下） */
  ctx.save();
  ctx.translate(0, Math.sin(t * 1.1) * 2.2);

  for (i = 0; i < F.length; i++) {
    var c = hue(F[i].l);
    poly(F[i].p);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.strokeStyle = c;   /* 同色 0.6px：面と面のすき間つぶし（境界線ではない） */
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  /* スペキュラ：最も上を向いた大きな面3枚に相似の縮小形 */
  var ord = [];
  for (i = 0; i < F.length; i++) if (area(F[i].p) > 210) ord.push(i);
  ord.sort(function (x, y) { return F[x].n[1] - F[y].n[1]; });
  for (k = 0; k < 3 && k < ord.length; k++) {
    var pp = F[ord[k]].p, cx = 0, cy = 0;
    for (i = 0; i < pp.length; i++) { cx += pp[i][0]; cy += pp[i][1]; }
    cx /= pp.length; cy /= pp.length;
    var sp = [];
    for (i = 0; i < pp.length; i++) {
      sp.push([cx + (pp[i][0] - cx) * 0.26 - 2.8, cy + (pp[i][1] - cy) * 0.26 - 3.2]);
    }
    poly(sp);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.60 - k * 0.13).toFixed(2) + ')';
    ctx.fill();
  }

  /* 内部の発光（2.6秒周期で脈打つ） */
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < F.length; i++) {
    var q = F[i].p;
    ctx.moveTo(q[0][0], q[0][1]);
    for (k = 1; k < q.length; k++) ctx.lineTo(q[k][0], q[k][1]);
    ctx.closePath();
  }
  ctx.clip();
  var pulse = 0.5 + 0.5 * Math.sin(t * (Math.PI * 2 / 2.6));
  var ig = ctx.createRadialGradient(114, 206, 3, 114, 206, 98);
  ig.addColorStop(0, 'rgba(255,126,153,' + (0.30 + 0.20 * pulse).toFixed(3) + ')');
  ig.addColorStop(0.5, 'rgba(255,126,153,' + (0.10 + 0.08 * pulse).toFixed(3) + ')');
  ig.addColorStop(1, 'rgba(255,126,153,0)');
  ctx.fillStyle = ig;
  ctx.fillRect(0, 0, 240, 340);
  ctx.restore();

  /* リムライト（右下の輪郭だけ） */
  ctx.strokeStyle = 'rgba(255,163,180,0.85)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  var rim = [
    [169, 111], [162, 130], [150, 136], [170, 142], [149, 154],
    [147, 158], [168, 164], [140, 176], [136, 182], [156, 188], [129, 200],
    [129, 204], [150, 208], [128, 222], [138, 248]
  ];
  ctx.moveTo(rim[0][0], rim[0][1]);
  for (i = 1; i < rim.length; i++) ctx.lineTo(rim[i][0], rim[i][1]);
  var rim2 = [[192, 265], [178, 281], [142, 291], [120, 292]];
  ctx.moveTo(rim2[0][0], rim2[0][1]);
  for (i = 1; i < rim2.length; i++) ctx.lineTo(rim2[i][0], rim2[i][1]);
  ctx.stroke();

  /* ひげ（細い直線） */
  ctx.strokeStyle = 'rgba(255,150,166,0.8)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(90, 114); ctx.lineTo(55, 101);
  ctx.moveTo(88, 122); ctx.lineTo(51, 130);
  ctx.moveTo(95, 137); ctx.lineTo(70, 153);
  ctx.stroke();

  ctx.restore();

  /* 浮遊する結晶片 8個 */
  for (i = 0; i < 8; i++) {
    var ang = t * 0.45 + i * Math.PI / 4;
    var fx = 120 + Math.cos(ang) * (84 + (i % 3) * 9);
    var fy = 186 + Math.sin(ang) * 24 + Math.sin(t * 0.8 + i) * 9 - (i % 4) * 24;
    var sc = 3.4 + (i % 3) * 1.3;
    var ro = ang * 0.7 + i;
    var shard = [[0, -1.5 * sc], [0.8 * sc, 0], [0, 1.15 * sc], [-0.7 * sc, 0]];
    ctx.beginPath();
    for (k = 0; k < 4; k++) {
      var vx = fx + shard[k][0] * Math.cos(ro) - shard[k][1] * Math.sin(ro);
      var vy = fy + shard[k][0] * Math.sin(ro) + shard[k][1] * Math.cos(ro);
      if (k === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,' + (138 + i * 9) + ',168,' + (0.30 + i * 0.045).toFixed(3) + ')';
    ctx.fill();
  }

  ctx.restore();
}

function dvS3(ctx, col, T, facing) {
  var t = (T || 0) / 1000;
  var L = [-0.55, -0.72, 0.42];
  var BASE = [240, 74, 90];
  var DARK = [122, 16, 32];
  var i, k, a0, a1, am;

  function nz(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function lam(v) {
    var d = v[0] * L[0] + v[1] * L[1] + v[2] * L[2];
    var amb = 0.03 * (v[2] + 1);
    return (d > 0 ? Math.pow(d, 1.55) : 0) + amb;
  }
  function hue(l) {
    var m = 0.34 + l * 1.21, u, r, g, b;
    if (m <= 1) {
      u = (m - 0.34) / 0.66;
      r = DARK[0] + (BASE[0] - DARK[0]) * u;
      g = DARK[1] + (BASE[1] - DARK[1]) * u;
      b = DARK[2] + (BASE[2] - DARK[2]) * u;
    } else {
      r = BASE[0] * m; g = BASE[1] * m; b = BASE[2] * m;
      if (r > 255) { u = r - 255; r = 255; g += u * 0.34; b += u * 0.28; }
      if (g > 255) g = 255;
      if (b > 255) b = 255;
    }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }
  function rgbaOf(hex, al) {
    var h = String(hex || '#F04A5A').replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var v = parseInt(h, 16);
    if (isNaN(v)) v = 15748186;
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + al + ')';
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var q = 1; q < p.length; q++) ctx.lineTo(p[q][0], p[q][1]);
    ctx.closePath();
  }
  function area(p) {
    var s = 0, q, r;
    for (q = 0; q < p.length; q++) {
      r = (q + 1) % p.length;
      s += p[q][0] * p[r][1] - p[r][0] * p[q][1];
    }
    return Math.abs(s) / 2;
  }

  /* ===== 面データ 17枚 ===== */
  var F = [];

  var hole = [];
  for (i = 0; i < 6; i++) {
    a0 = i * Math.PI / 3;
    hole.push([7 * Math.cos(a0), -10 + 3 * Math.sin(a0)]);
  }
  F.push({ p: hole, n: nz([0.62, -0.12, 0.77]) });

  var ring = [];
  for (i = 0; i < 6; i++) {
    a0 = i * Math.PI / 3;
    a1 = (i + 1) * Math.PI / 3;
    am = (a0 + a1) / 2;
    ring.push({
      p: [
        [19 * Math.cos(a0), -8 + 8 * Math.sin(a0)],
        [19 * Math.cos(a1), -8 + 8 * Math.sin(a1)],
        [7 * Math.cos(a1), -10 + 3 * Math.sin(a1)],
        [7 * Math.cos(a0), -10 + 3 * Math.sin(a0)]
      ],
      n: nz([Math.cos(am) * 0.62, Math.sin(am) * 0.5 - 0.42, 0.66 + (i + 1) * 0.017]),
      f: Math.sin(am) > 0
    });
  }
  for (i = 0; i < 6; i++) if (!ring[i].f) F.push(ring[i]);

  var spine = [[-1, -13, 10], [-6, -25, 9.5], [2, -36, 8.5], [3, -46, 7]];
  for (i = 0; i < 3; i++) {
    var s0 = spine[i], s1 = spine[i + 1];
    var r0 = s0[0] + s0[2] * 0.2, r1 = s1[0] + s1[2] * 0.2;
    F.push({
      p: [[s0[0] - s0[2], s0[1]], [r0, s0[1]], [r1, s1[1]], [s1[0] - s1[2], s1[1]]],
      n: (i % 2 ? nz([-0.46 - i * 0.03, -0.60 + i * 0.04, 0.68 + i * 0.03])
                : nz([-0.78 + i * 0.03, -0.24 - i * 0.04, 0.56 + i * 0.03]))
    });
    F.push({
      p: [[r0, s0[1]], [s0[0] + s0[2], s0[1]], [s1[0] + s1[2], s1[1]], [r1, s1[1]]],
      n: (i % 2 ? nz([0.66 - i * 0.03, -0.28 - i * 0.03, 0.70 + i * 0.04])
                : nz([0.52 + i * 0.04, -0.40 + i * 0.03, 0.74 - i * 0.04]))
    });
  }

  F.push({ p: [[-4, -53], [13, -59], [20, -48], [4, -41]], n: nz([-0.05, -0.92, 0.38]) });
  F.push({ p: [[-4, -53], [4, -41], [-16, -40], [-18, -50]], n: nz([-0.57, -0.25, 0.76]) });
  F.push({ p: [[12, -58], [19, -68], [5, -60]], n: nz([0.33, -0.70, 0.60]) });
  F.push({ p: [[4, -57], [10, -67], [-1, -56]], n: nz([-0.18, -0.82, 0.50]) });

  for (i = 0; i < 6; i++) if (ring[i].f) F.push(ring[i]);

  for (i = 0; i < F.length; i++) F[i].l = lam(F[i].n);

  /* ===== 描画 ===== */
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  /* 台座リング＝プレイヤー色 */
  ctx.fillStyle = rgbaOf(col, 0.85);
  ctx.beginPath();
  ctx.ellipse(0, -2, 21, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, -3.4, 21, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -3, 18, 5, 0, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  ctx.save();
  ctx.translate(0, Math.sin(t * Math.PI) * 1.5);
  ctx.scale(facing === -1 ? -1 : 1, 1);

  for (i = 0; i < F.length; i++) {
    var c = hue(F[i].l);
    poly(F[i].p);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  var ord = [];
  for (i = 0; i < F.length; i++) if (area(F[i].p) > 40) ord.push(i);
  ord.sort(function (x, y) { return F[x].n[1] - F[y].n[1]; });
  for (k = 0; k < 2 && k < ord.length; k++) {
    var pp = F[ord[k]].p, cx = 0, cy = 0;
    for (i = 0; i < pp.length; i++) { cx += pp[i][0]; cy += pp[i][1]; }
    cx /= pp.length; cy /= pp.length;
    var sp = [];
    for (i = 0; i < pp.length; i++) {
      sp.push([cx + (pp[i][0] - cx) * 0.32 - 1.0, cy + (pp[i][1] - cy) * 0.32 - 1.2]);
    }
    poly(sp);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.66 - k * 0.18).toFixed(2) + ')';
    ctx.fill();
  }

  /* 内部の発光＝プレイヤー色 */
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < F.length; i++) {
    var q = F[i].p;
    ctx.moveTo(q[0][0], q[0][1]);
    for (k = 1; k < q.length; k++) ctx.lineTo(q[k][0], q[k][1]);
    ctx.closePath();
  }
  ctx.clip();
  var pulse = 0.5 + 0.5 * Math.sin(t * (Math.PI * 2 / 2.6));
  var ig = ctx.createRadialGradient(0, -30, 1, 0, -30, 30);
  ig.addColorStop(0, rgbaOf(col, (0.17 + 0.13 * pulse).toFixed(3)));
  ig.addColorStop(1, rgbaOf(col, 0));
  ctx.fillStyle = ig;
  ctx.fillRect(-30, -70, 60, 74);
  ctx.restore();

  /* リムライト（右下だけ） */
  ctx.strokeStyle = 'rgba(255,163,180,0.9)';
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  var rim = [[20, -48], [10, -33], [9, -21], [19, -8], [9.5, -1], [0, 0]];
  ctx.moveTo(rim[0][0], rim[0][1]);
  for (i = 1; i < rim.length; i++) ctx.lineTo(rim[i][0], rim[i][1]);
  ctx.stroke();

  /* ひげ */
  ctx.strokeStyle = 'rgba(255,150,166,0.75)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-16, -49); ctx.lineTo(-29, -54);
  ctx.moveTo(-16, -44); ctx.lineTo(-28, -37);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

/* ───── ae10b9c883fd643c6 ───── */
function dvG2(ctx, T) {
  var TAU = Math.PI * 2;
  var lx = -0.55, ly = -0.72, lz = 0.42;
  var lm = Math.sqrt(lx * lx + ly * ly + lz * lz);
  lx /= lm; ly /= lm; lz /= lm;
  var BR = 95, BG = 214, BB = 168;   // #5FD6A8
  var DR = 23, DG = 92, DB = 70;     // #175C46

  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * lx + n[1] * ly + n[2] * lz) / m;
    return d > 0 ? d : 0;
  }
  function jade(n) {
    var k = 0.34 + 1.21 * lam(n), u, r, g, b;
    if (k <= 1) {
      u = (k - 0.34) / 0.66;
      r = DR + (BR - DR) * u; g = DG + (BG - DG) * u; b = DB + (BB - DB) * u;
    } else {
      u = (k - 1) / 0.55;
      r = BR + (255 - BR) * u * 0.92; g = BG + (255 - BG) * u * 0.92; b = BB + (255 - BB) * u * 0.92;
    }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }
  function trace(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
  }
  function addWound(p) {
    var a = 0, i, j, q = p;
    for (i = 0; i < q.length; i++) {
      j = (i + 1) % q.length;
      a += q[i][0] * q[j][1] - q[j][0] * q[i][1];
    }
    if (a < 0) q = q.slice().reverse();
    ctx.moveTo(q[0][0], q[0][1]);
    for (i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
    ctx.closePath();
  }

  // ---- 翡翠の鶴：33面（辺はすべて直線）------------------------------------
  // 接地点(0,0)・上が -y のローカル座標。配列の順番＝奥から手前への描画順。
  // n は面ごとに手で決めた向き、s はスペキュラの濃さ、e は最後に描く面（目）。
  var F = [
    // 尾羽 3面
    { p: [[-50, -112], [-50, -130], [-86, -146], [-72, -124]], n: [-0.186, -0.152, 0.971] },
    { p: [[-50, -112], [-72, -124], [-94, -124], [-74, -110]], n: [-0.694, 0.334, 0.638] },
    { p: [[-50, -112], [-74, -110], [-84, -96], [-52, -96]], n: [-0.549, 0.55, 0.629] },
    // 奥の翼 2面
    { p: [[-46, -168], [-16, -184], [4, -172]], n: [-0.113, -0.93, 0.351] },
    { p: [[-46, -168], [4, -172], [-30, -152]], n: [0.033, -0.219, 0.975] },
    // 奥の脚 2面 ＋ 奥の足 1面
    { p: [[-20, -88], [-11, -86], [-11, -44], [-17, -44]], n: [-0.585, 0.471, 0.66] },
    { p: [[-17, -44], [-11, -44], [-9, -2], [-14, -2]], n: [-0.505, 0.402, 0.764] },
    { p: [[-17, -6], [-8, -6], [-2, 0], [-23, 0]], n: [0.121, 0.198, 0.973] },
    // 胴 6面（中心 (-6,-128) からの扇）
    { p: [[-6, -128], [-52, -120], [-40, -155]], n: [-0.879, -0.022, 0.476] },
    { p: [[-6, -128], [-40, -155], [-8, -172]], n: [0.006, -0.893, 0.45] },
    { p: [[-6, -128], [-8, -172], [22, -162]], n: [-0.304, -0.858, 0.414], s: 0.5, k: 0.34 },
    { p: [[-6, -128], [22, -162], [38, -136]], n: [0.253, -0.757, 0.603] },
    { p: [[-6, -128], [38, -136], [30, -104], [4, -80]], n: [0.563, -0.415, 0.715] },
    { p: [[-6, -128], [4, -80], [-28, -88], [-52, -120]], n: [-0.272, 0.545, 0.793] },
    // 手前の脚 2面 ＋ 手前の足 1面
    { p: [[2, -88], [12, -86], [11, -46], [4, -46]], n: [0.293, -0.175, 0.94] },
    { p: [[4, -46], [11, -46], [13, -2], [7, -2]], n: [0.262, -0.27, 0.927] },
    { p: [[2, -6], [13, -6], [19, 0], [-2, 0]], n: [0.357, -0.062, 0.932] },
    // 手前の翼（半分たたむ）4面
    { p: [[-16, -126], [-46, -140], [-6, -158]], n: [-0.441, -0.192, 0.877] },
    { p: [[-16, -126], [-6, -158], [20, -142]], n: [-0.192, -0.789, 0.584], s: 0.58, k: 0.4 },
    { p: [[-16, -126], [20, -142], [10, -112], [-30, -96]], n: [0.241, -0.35, 0.905] },
    { p: [[-16, -126], [-30, -96], [-58, -112], [-46, -140]], n: [-0.348, 0.322, 0.881] },
    // 首：S字を3節×2面＝6面（尾根線が 20→42→35→16 と振れて S を作る）
    { p: [[12, -152], [34, -174], [42, -174], [20, -152]], n: [-0.83, -0.246, 0.5] },
    { p: [[20, -152], [42, -174], [50, -174], [29, -152]], n: [0.448, -0.404, 0.797] },
    { p: [[34, -174], [28, -194], [35, -194], [42, -174]], n: [-0.896, -0.057, 0.44] },
    { p: [[42, -174], [35, -194], [42, -194], [50, -174]], n: [0.376, -0.454, 0.808] },
    { p: [[28, -194], [10, -207], [16, -207], [35, -194]], n: [-0.747, -0.267, 0.609] },
    { p: [[35, -194], [16, -207], [23, -207], [42, -194]], n: [0.342, -0.553, 0.76] },
    // 頭 3面
    { p: [[23, -212], [10, -207], [12, -217], [26, -224]], n: [-0.614, -0.014, 0.789] },
    { p: [[23, -212], [26, -224], [36, -216], [34, -205]], n: [0.034, -0.96, 0.277], s: 0.52, k: 0.36 },
    { p: [[23, -212], [34, -205], [23, -207], [10, -207]], n: [0.093, -0.31, 0.946] },
    // 嘴 2面
    { p: [[34, -217], [68, -211], [36, -211]], n: [0.149, -0.517, 0.843] },
    { p: [[36, -211], [68, -211], [34, -205]], n: [0.135, 0.26, 0.956] },
    // 目：一段暗い小さな面（スペキュラの後に描く）
    { p: [[30, -213], [34, -212], [34, -208], [30, -209]], n: [0.2, 0.86, 0.47], e: 1 }
  ];

  var pulse = 0.75 + 0.25 * Math.sin(T / 2600 * TAU);
  var bob = Math.sin(T / 3400 * TAU) * 1.5;
  var spin = T * 0.00028;
  var i, k;

  // ---- 浮遊する結晶片 8個 --------------------------------------------------
  function shard(id, front) {
    var a = id * TAU / 8 + spin;
    var sa = Math.sin(a);
    if ((sa >= 0) !== front) return;
    var rr = 76 + 18 * Math.sin(id * 2.1);
    var cx = 120 + Math.cos(a) * rr;
    var cy = 176 + sa * rr * 0.5 + Math.sin(T * 0.0011 + id * 1.3) * 8;
    var sz = 4.2 + 2.0 * Math.sin(id * 1.7 + 1);
    var rt = a * 1.7 + id;
    var cs = Math.cos(rt), sn = Math.sin(rt);
    function q(dx, dy) { return [cx + dx * cs - dy * sn, cy + dx * sn + dy * cs]; }
    ctx.save();
    ctx.globalAlpha = 0.30 + 0.32 * (0.5 + 0.5 * sa);
    trace([q(0, -sz * 1.7), q(-sz, 0), q(0, sz * 1.7)]);
    ctx.fillStyle = jade([-0.62 + 0.09 * Math.sin(id), -0.55 - 0.05 * Math.cos(id * 1.4), 0.55]);
    ctx.fill();
    trace([q(0, -sz * 1.7), q(sz, 0), q(0, sz * 1.7)]);
    ctx.fillStyle = jade([0.44 + 0.10 * Math.cos(id * 0.9), -0.30 + 0.08 * Math.sin(id * 1.1), 0.84]);
    ctx.fill();
    ctx.restore();
  }

  // ---- 台座（磨かれた金属のリング）----------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(120, 301, 60, 11, 0, 0, Math.PI);
  ctx.lineTo(60, 310);
  ctx.ellipse(120, 310, 60, 11, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = '#6a4d16';
  ctx.fill();
  var gt = ctx.createLinearGradient(0, 290, 0, 312);
  gt.addColorStop(0, '#f7e6ad');
  gt.addColorStop(0.42, '#d6ac4f');
  gt.addColorStop(1, '#8d6820');
  ctx.beginPath();
  ctx.ellipse(120, 301, 60, 11, 0, 0, TAU);
  ctx.fillStyle = gt;
  ctx.fill();
  ctx.beginPath();                                   // 台座に映り込む守護獣の色
  ctx.ellipse(120, 303, 38, 6, 0, 0, TAU);
  ctx.fillStyle = 'rgba(95,214,168,0.20)';
  ctx.fill();
  ctx.beginPath();                                   // 上面手前の白い弧
  ctx.ellipse(120, 301, 55, 9, 0, 0.30 * Math.PI, 0.80 * Math.PI);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.stroke();
  ctx.beginPath();                                   // 落ち影
  ctx.ellipse(120, 297, 33, 7, 0, 0, TAU);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.restore();

  for (i = 0; i < 8; i++) shard(i, false);            // 奥の結晶片

  // ---- 像本体 --------------------------------------------------------------
  ctx.save();
  ctx.translate(120, 292 + bob);

  for (i = 0; i < F.length; i++) {                   // ① 面（すべて単色・線は引かない）
    if (F[i].e) continue;
    trace(F[i].p);
    ctx.fillStyle = jade(F[i].n);
    ctx.fill();
  }
  for (i = 0; i < F.length; i++) {                   // ② スペキュラ（相似の縮小形）
    if (!F[i].s) continue;
    var p = F[i].p, gx = 0, gy = 0, sc = F[i].k, sp = [];
    for (k = 0; k < p.length; k++) { gx += p[k][0]; gy += p[k][1]; }
    gx /= p.length; gy /= p.length;
    for (k = 0; k < p.length; k++) {
      sp.push([gx + (p[k][0] - gx) * sc - 2.4, gy + (p[k][1] - gy) * sc - 2.8]);
    }
    trace(sp);
    ctx.fillStyle = 'rgba(255,255,255,' + F[i].s + ')';
    ctx.fill();
  }
  for (i = 0; i < F.length; i++) {                   // ③ 目（照りに埋もれないよう最後）
    if (!F[i].e) continue;
    trace(F[i].p);
    ctx.fillStyle = jade(F[i].n);
    ctx.fill();
  }

  ctx.save();                                        // ④ 内部の発光
  ctx.beginPath();
  for (i = 0; i < F.length; i++) addWound(F[i].p);
  ctx.clip();
  var rg = ctx.createRadialGradient(-4, -132, 4, -4, -132, 104);
  rg.addColorStop(0, 'rgba(206,255,235,' + (0.5 * pulse).toFixed(3) + ')');
  rg.addColorStop(0.45, 'rgba(160,246,208,' + (0.22 * pulse).toFixed(3) + ')');
  rg.addColorStop(1, 'rgba(160,246,208,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(-110, -240, 200, 250);
  ctx.restore();

  ctx.lineWidth = 2.5;                               // ⑤ リムライト（右下の輪郭だけ）
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(197,252,226,0.85)';
  var rims = [
    [[23, -207], [42, -194], [50, -174], [33, -150], [38, -136], [30, -104], [4, -80], [-26, -88]],
    [[34, -205], [68, -211]],
    [[11, -46], [13, -2], [19, 0]]
  ];
  for (i = 0; i < rims.length; i++) {
    var rp = rims[i];
    ctx.beginPath();
    ctx.moveTo(rp[0][0], rp[0][1]);
    for (k = 1; k < rp.length; k++) ctx.lineTo(rp[k][0], rp[k][1]);
    ctx.stroke();
  }
  ctx.restore();

  for (i = 0; i < 8; i++) shard(i, true);            // 手前の結晶片
}

function dvS2(ctx, col, T, facing) {
  var TAU = Math.PI * 2;
  var lx = -0.55, ly = -0.72, lz = 0.42;
  var lm = Math.sqrt(lx * lx + ly * ly + lz * lz);
  lx /= lm; ly /= lm; lz /= lm;
  var BR = 95, BG = 214, BB = 168;
  var DR = 23, DG = 92, DB = 70;

  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * lx + n[1] * ly + n[2] * lz) / m;
    return d > 0 ? d : 0;
  }
  function jade(n) {
    var k = 0.34 + 1.21 * lam(n), u, r, g, b;
    if (k <= 1) {
      u = (k - 0.34) / 0.66;
      r = DR + (BR - DR) * u; g = DG + (BG - DG) * u; b = DB + (BB - DB) * u;
    } else {
      u = (k - 1) / 0.55;
      r = BR + (255 - BR) * u * 0.92; g = BG + (255 - BG) * u * 0.92; b = BB + (255 - BB) * u * 0.92;
    }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }
  function tint(f, a) {                              // プレイヤー色を明度 f で振る
    var s = String(col || '#5FD6A8').replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var r = parseInt(s.substring(0, 2), 16), g = parseInt(s.substring(2, 4), 16), b = parseInt(s.substring(4, 6), 16);
    if (!isFinite(r) || !isFinite(g) || !isFinite(b)) { r = BR; g = BG; b = BB; }
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    g = Math.max(0, Math.min(255, Math.round(g * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function trace(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
  }
  function addWound(p) {
    var a = 0, i, j, q = p;
    for (i = 0; i < q.length; i++) {
      j = (i + 1) % q.length;
      a += q[i][0] * q[j][1] - q[j][0] * q[i][1];
    }
    if (a < 0) q = q.slice().reverse();
    ctx.moveTo(q[0][0], q[0][1]);
    for (i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
    ctx.closePath();
  }

  // 15面（駒用に間引いた同じ様式）。高さ82・幅47のローカルを 0.85 倍で使う。
  var F = [
    { p: [[-13, -43], [-22, -47], [-23, -34], [-14, -28]], n: [-0.581, 0.268, 0.769] },
    { p: [[-12, -44], [-2, -49], [8, -42], [-3, -38]], n: [-0.208, -0.867, 0.453], s: 0.6, k: 0.36 },
    { p: [[-3, -38], [8, -42], [2, -30], [-10, -29], [-12, -44]], n: [0.259, -0.14, 0.956] },
    { p: [[-2, -38], [-14, -38], [-9, -50], [6, -52]], n: [-0.894, -0.087, 0.439] },
    { p: [[-2, -38], [6, -52], [13, -41], [9, -27]], n: [0.565, -0.398, 0.723] },
    { p: [[-2, -38], [9, -27], [-4, -23], [-13, -29], [-14, -38]], n: [-0.258, 0.52, 0.815] },
    { p: [[-8, -27], [-3, -27], [-2, -1], [-7, -1]], n: [-0.562, 0.179, 0.808] },
    { p: [[2, -26], [7, -26], [8, -1], [3, -1]], n: [0.443, -0.126, 0.888] },
    { p: [[-9, -3], [9, -3], [12, 0], [-12, 0]], n: [0.34, -0.148, 0.929] },
    { p: [[3, -49], [12, -60], [21, -59], [13, -49]], n: [0.443, -0.436, 0.783] },
    { p: [[12, -60], [7, -70], [16, -69], [21, -59]], n: [-0.876, 0.034, 0.481] },
    { p: [[7, -70], [6, -76], [15, -75], [16, -69]], n: [-0.251, -0.424, 0.87] },
    { p: [[5, -75], [8, -82], [17, -80], [16, -72]], n: [0.074, -0.934, 0.351], s: 0.45, k: 0.32 },
    { p: [[16, -80], [24, -76], [15, -72]], n: [0.358, -0.511, 0.782] },
    { p: [[12, -77], [15.5, -76], [15.5, -73], [12, -74]], n: [0.22, 0.88, 0.42], e: 1 }
  ];

  var bob = Math.sin(T / 2000 * TAU) * 1.5;
  var pulse = 0.75 + 0.25 * Math.sin(T / 2600 * TAU);
  var i, k;

  ctx.save();

  ctx.beginPath();                                   // 落ち影
  ctx.ellipse(0, 0, 17, 5, 0, 0, TAU);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();

  ctx.beginPath();                                   // 台座リング（プレイヤー色）
  ctx.ellipse(0, -1, 16, 5, 0, 0, Math.PI);
  ctx.lineTo(-16, 3);
  ctx.ellipse(0, 3, 16, 5, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fillStyle = tint(0.45, 1);
  ctx.fill();
  var gt = ctx.createLinearGradient(0, -6, 0, 4);
  gt.addColorStop(0, tint(1.55, 1));
  gt.addColorStop(0.45, tint(1.0, 1));
  gt.addColorStop(1, tint(0.55, 1));
  ctx.beginPath();
  ctx.ellipse(0, -1, 16, 5, 0, 0, TAU);
  ctx.fillStyle = gt;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -1, 13, 3.4, 0, 0.30 * Math.PI, 0.80 * Math.PI);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.stroke();

  ctx.save();
  ctx.translate(0, bob);
  ctx.scale((facing === -1 ? -1 : 1) * 0.85, 0.85);

  for (i = 0; i < F.length; i++) {                   // ① 面
    if (F[i].e) continue;
    trace(F[i].p);
    ctx.fillStyle = jade(F[i].n);
    ctx.fill();
  }
  for (i = 0; i < F.length; i++) {                   // ② スペキュラ
    if (!F[i].s) continue;
    var p = F[i].p, gx = 0, gy = 0, sc = F[i].k, sp = [];
    for (k = 0; k < p.length; k++) { gx += p[k][0]; gy += p[k][1]; }
    gx /= p.length; gy /= p.length;
    for (k = 0; k < p.length; k++) sp.push([gx + (p[k][0] - gx) * sc - 1.1, gy + (p[k][1] - gy) * sc - 1.3]);
    trace(sp);
    ctx.fillStyle = 'rgba(255,255,255,' + F[i].s + ')';
    ctx.fill();
  }
  for (i = 0; i < F.length; i++) {                   // ③ 目
    if (!F[i].e) continue;
    trace(F[i].p);
    ctx.fillStyle = jade(F[i].n);
    ctx.fill();
  }

  ctx.save();                                        // ④ 内部の発光（プレイヤー色）
  ctx.beginPath();
  for (i = 0; i < F.length; i++) addWound(F[i].p);
  ctx.clip();
  var rg = ctx.createRadialGradient(0, -42, 2, 0, -42, 40);
  rg.addColorStop(0, tint(1.7, (0.5 * pulse).toFixed(3)));
  rg.addColorStop(0.5, tint(1.35, (0.22 * pulse).toFixed(3)));
  rg.addColorStop(1, tint(1.35, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(-34, -88, 66, 92);
  ctx.restore();

  ctx.lineWidth = 1.6;                               // ⑤ リムライト（右下の輪郭だけ）
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(197,252,226,0.85)';
  var rims = [
    [[16, -72], [21, -59], [13, -49], [13, -41], [9, -27], [-4, -23]],
    [[15, -72], [24, -76]],
    [[7, -26], [8, -1], [12, 0]]
  ];
  for (i = 0; i < rims.length; i++) {
    var rp = rims[i];
    ctx.beginPath();
    ctx.moveTo(rp[0][0], rp[0][1]);
    for (k = 1; k < rp.length; k++) ctx.lineTo(rp[k][0], rp[k][1]);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

/* ───── a5dfe46c3f5de0313 ───── */
/* 氷晶の狐 — crystal fox, carved as flat facets. Plain JS, no libraries, no clocks. */

function dvG0(ctx, T) {
  var t = (typeof T === 'number' && isFinite(T)) ? T * 0.001 : 0;
  var i, q;

  /* key light: upper left, towards the viewer */
  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var lm = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
  LX /= lm; LY /= lm; LZ /= lm;
  /* faint bounce off the pedestal, lower right - keeps shaded facets readable */
  var FX = 0.62, FY = 0.55, FZ = 0.56;
  var fm = Math.sqrt(FX * FX + FY * FY + FZ * FZ);
  FX /= fm; FY /= fm; FZ /= fm;

  var BR = 127, BG = 216, BB = 240;      /* base   #7FD8F0 */
  var DR = 30, DG = 92, DB = 122;        /* shade  #1E5C7A  (base x0.34) */
  var HR = 226, HG = 249, HB = 255;      /* glare           (base x1.55) */

  function cl(v) { v = Math.round(v); return v < 0 ? 0 : (v > 255 ? 255 : v); }
  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * LX + n[1] * LY + n[2] * LZ) / m;    /* lambert = max(0, n.L) */
    if (d < 0) d = 0;
    var b = (n[0] * FX + n[1] * FY + n[2] * FZ) / m;
    if (b < 0) b = 0;
    d += 0.26 * b;
    return d > 1 ? 1 : d;
  }
  function fc(n) {                        /* brightness 0.34 .. 1.55 of the base */
    var k = 0.34 + 1.21 * lam(n), r, g, b, u;
    if (k <= 1) { u = (k - 0.34) / 0.66; r = DR + (BR - DR) * u; g = DG + (BG - DG) * u; b = DB + (BB - DB) * u; }
    else { u = (k - 1) / 0.55; r = BR + (HR - BR) * u; g = BG + (HG - BG) * u; b = BB + (HB - BB) * u; }
    return 'rgb(' + cl(r) + ',' + cl(g) + ',' + cl(b) + ')';
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var z = 1; z < p.length; z++) ctx.lineTo(p[z][0], p[z][1]);
    ctx.closePath();
  }
  function ell(cx, cy, rx, ry) {
    ctx.beginPath();
    for (var z = 0; z < 44; z++) {
      var a = z / 44 * Math.PI * 2, X = cx + rx * Math.cos(a), Y = cy + ry * Math.sin(a);
      if (z === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath();
  }
  function outline(p) {
    ctx.moveTo(p[0][0], p[0][1]);
    for (var z = 1; z < p.length; z++) ctx.lineTo(p[z][0], p[z][1]);
    ctx.closePath();
  }

  /* facets: [points, normal, glint].  +y is up here; the transform flips it. */
  var F = [
    [[[-38, 6], [-66, 40], [-55, 48], [-26, 16]], [-0.709, 0.555, 0.436], 0],
    [[[-66, 40], [-80, 92], [-68, 96], [-55, 48]], [-0.819, 0.427, 0.382], 0],
    [[[-80, 92], [-72, 144], [-60, 142], [-68, 96]], [-0.945, 0.079, 0.318], 0],
    [[[-72, 144], [-54, 176], [-47, 170], [-60, 142]], [-0.835, -0.352, 0.423], 0],
    [[[-26, 16], [-55, 48], [-42, 58], [-14, 30]], [0.418, -0.402, 0.815], 0],
    [[[-55, 48], [-68, 96], [-54, 100], [-42, 58]], [0.536, -0.278, 0.797], 0],
    [[[-68, 96], [-60, 142], [-48, 140], [-54, 100]], [0.56, -0.043, 0.827], 0],
    [[[-60, 142], [-47, 170], [-40, 162], [-48, 140]], [0.519, 0.273, 0.81], 0],
    [[[-54, 176], [-44, 192], [-47, 170]], [-0.082, -0.946, 0.312], 1],
    [[[-47, 170], [-44, 192], [-40, 162]], [0.169, -0.542, 0.823], 0],
    [[[-28, 0], [-48, 18], [-22, 44]], [-0.333, 0.728, 0.6], 0],
    [[[-48, 18], [-54, 50], [-22, 44]], [-0.629, 0.217, 0.747], 0],
    [[[-54, 50], [-42, 78], [-22, 44]], [-0.566, -0.436, 0.7], 0],
    [[[-42, 78], [-20, 88], [-22, 44]], [-0.235, -0.8, 0.552], 1],
    [[[-20, 88], [-6, 65], [-22, 44]], [0.169, -0.689, 0.705], 0],
    [[[-6, 65], [8, 42], [-22, 44]], [0.579, -0.239, 0.78], 0],
    [[[8, 42], [6, 0], [-22, 44]], [0.623, 0.494, 0.607], 0],
    [[[6, 0], [-28, 0], [-22, 44]], [0.207, 0.826, 0.524], 0],
    [[[-20, 88], [-4, 118], [14, 114], [24, 88], [-6, 65]], [0.222, -0.835, 0.503], 0],
    [[[-6, 65], [24, 88], [30, 54], [8, 42]], [0.635, 0.018, 0.772], 0],
    [[[8, 42], [30, 54], [38, 24], [14, 18]], [0.628, 0.693, 0.353], 0],
    [[[14, 18], [38, 24], [44, 4], [20, 2]], [0.539, 0.813, 0.218], 1],
    [[[20, 2], [44, 4], [48, 0], [6, 0]], [0.481, 0.875, 0.056], 0],
    [[[-14, 124], [-12, 148], [2, 158], [10, 134], [-2, 114]], [-0.742, -0.091, 0.664], 0],
    [[[2, 158], [20, 158], [34, 148], [22, 134], [10, 134]], [0.3, -0.664, 0.685], 0],
    [[[34, 148], [40, 136], [38, 120], [20, 112], [22, 134]], [0.813, -0.139, 0.566], 0],
    [[[10, 134], [22, 134], [20, 112], [-2, 114]], [-0.114, 0.447, 0.888], 0],
    [[[40, 136], [64, 129], [60, 123], [39, 128]], [0.579, -0.161, 0.799], 0],
    [[[39, 128], [60, 123], [62, 118], [38, 120]], [0.441, 0.42, 0.793], 0],
    [[[2, 157], [8, 196], [17, 157]], [-0.012, -0.883, 0.47], 0],
    [[[21, 157], [33, 193], [36, 146]], [0.62, -0.679, 0.394], 0]
  ];
  var SIL_T = [[-38, 6], [-66, 40], [-80, 92], [-72, 144], [-54, 176], [-44, 192], [-40, 162], [-48, 140], [-54, 100], [-42, 58], [-14, 30]];
  var SIL_B = [[48, 0], [44, 4], [38, 24], [30, 54], [24, 88], [14, 114], [20, 112], [38, 120], [62, 118], [64, 129], [40, 136], [34, 148], [33, 193], [21, 157], [17, 157], [8, 196], [2, 157], [-12, 148], [-14, 124], [-4, 118], [-20, 88], [-42, 78], [-54, 50], [-48, 18], [-28, 0]];
  var RIM = [[64, 129], [62, 118], [38, 120], [20, 112], [14, 114], [24, 88], [30, 54], [38, 24], [44, 4], [48, 0], [6, 0], [-28, 0]];

  var bob = Math.sin(t * 1.05) * 2.2;
  var pulse = 0.72 + 0.28 * Math.sin(t * (Math.PI * 2 / 2.6));

  /* floating shards */
  var SH = [];
  for (i = 0; i < 8; i++) {
    var a = t * 0.40 + i * 0.7854;
    SH.push([Math.cos(a) * (80 + (i % 3) * 12),
             40 + (i % 4) * 36 + Math.sin(t * 0.85 + i * 1.3) * 8,
             3.4 + (i % 3) * 1.9, a * 1.6 + i, Math.sin(a), i]);
  }
  function shard(s, back) {
    var cs = Math.cos(s[3]), sn = Math.sin(s[3]), z = s[2];
    var pr = [[0, -z * 1.7], [z * 0.72, 0], [0, z * 1.7], [-z * 0.72, 0]], o = [];
    for (var w = 0; w < 4; w++) {
      o.push([s[0] + pr[w][0] * cs - pr[w][1] * sn, s[1] + pr[w][0] * sn + pr[w][1] * cs]);
    }
    var lv = 0.5 + 0.46 * (0.5 + 0.5 * Math.sin(s[3])) + s[5] * 0.012;
    ctx.fillStyle = 'rgba(' + cl(BR * lv) + ',' + cl(BG * lv) + ',' + cl(BB * lv) + ',' + (back ? 0.4 : 0.8) + ')';
    poly(o); ctx.fill();
  }

  ctx.save();
  ctx.translate(120, 292);
  ctx.scale(1, -1);                        /* from here on, +y is up */

  /* ---------- polished metal pedestal ---------- */
  ctx.fillStyle = '#5E4110';                       /* side wall */
  ell(0, -16, 64, 11); ctx.fill();
  var gg = ctx.createLinearGradient(0, 2, 0, -22); /* top face */
  gg.addColorStop(0, '#F8E7A8');
  gg.addColorStop(0.5, '#CE9F35');
  gg.addColorStop(1, '#8A6113');
  ctx.fillStyle = gg;
  ell(0, -9, 64, 11); ctx.fill();
  ctx.fillStyle = '#7A5514';                       /* recess: makes it a ring */
  ell(0, -9, 45, 7); ctx.fill();
  ctx.fillStyle = 'rgba(127,216,240,0.22)';        /* the fox reflected in it */
  ell(0, -11, 40, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';      /* front highlight arc */
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (i = 0; i <= 22; i++) {
    var ah = Math.PI * (1.12 + 0.76 * i / 22);
    var hx = 55 * Math.cos(ah), hy = -9 + 9 * Math.sin(ah);
    if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
  }
  ctx.stroke();

  /* ---------- cast shadow ---------- */
  ctx.fillStyle = 'rgba(12,32,46,0.30)';
  ell(-6, -8, 48, 8); ctx.fill();

  /* ---------- shards behind ---------- */
  for (i = 0; i < 8; i++) { if (SH[i][4] < 0) shard(SH[i], 1); }

  /* ---------- the carving ---------- */
  ctx.save();
  ctx.translate(0, bob);

  for (i = 0; i < F.length; i++) { ctx.fillStyle = fc(F[i][1]); poly(F[i][0]); ctx.fill(); }

  /* inner glow, clipped to the silhouette */
  ctx.save();
  ctx.beginPath();
  outline(SIL_T);
  outline(SIL_B);
  ctx.clip();
  var rg = ctx.createRadialGradient(-4, 76, 4, -4, 76, 128);
  rg.addColorStop(0, 'rgba(216,252,255,' + (0.5 * pulse).toFixed(3) + ')');
  rg.addColorStop(0.55, 'rgba(150,232,255,' + (0.2 * pulse).toFixed(3) + ')');
  rg.addColorStop(1, 'rgba(150,232,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(-92, -10, 180, 220);
  ctx.restore();

  /* sharp glints: small similar copies inside the most up-facing facets */
  var sa = [0.86, 0.68, 0.56], si = 0;
  for (i = 0; i < F.length; i++) {
    if (!F[i][2]) { continue; }
    var p = F[i][0], o2 = [], bx = p[0][0], by = p[0][1], best = -1e9, sv;
    for (q = 0; q < p.length; q++) {          /* anchor on the corner the light hits */
      sv = p[q][1] - p[q][0];
      if (sv > best) { best = sv; bx = p[q][0]; by = p[q][1]; }
    }
    for (q = 0; q < p.length; q++) {
      o2.push([bx + (p[q][0] - bx) * 0.30, by + (p[q][1] - by) * 0.30]);
    }
    ctx.fillStyle = 'rgba(255,255,255,' + sa[si++ % 3] + ')';
    poly(o2); ctx.fill();
  }

  /* eye: one small facet, a step darker */
  ctx.fillStyle = 'rgb(16,54,76)';
  poly([[24, 138], [30, 136], [29, 132], [24, 133]]); ctx.fill();

  /* rim light on the lower right contour only */
  ctx.strokeStyle = 'rgba(228,252,255,0.9)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(RIM[0][0], RIM[0][1]);
  for (i = 1; i < RIM.length; i++) ctx.lineTo(RIM[i][0], RIM[i][1]);
  ctx.stroke();

  ctx.restore();

  /* ---------- shards in front ---------- */
  for (i = 0; i < 8; i++) { if (SH[i][4] >= 0) shard(SH[i], 0); }

  ctx.restore();
}


function dvS0(ctx, col, T, facing) {
  var t = (typeof T === 'number' && isFinite(T)) ? T * 0.001 : 0;
  var fa = (facing === -1) ? -1 : 1;
  var i, q;

  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var lm = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
  LX /= lm; LY /= lm; LZ /= lm;
  var FX = 0.62, FY = 0.55, FZ = 0.56;
  var fm = Math.sqrt(FX * FX + FY * FY + FZ * FZ);
  FX /= fm; FY /= fm; FZ /= fm;

  var BR = 127, BG = 216, BB = 240;
  var DR = 30, DG = 92, DB = 122;
  var HR = 226, HG = 249, HB = 255;

  function cl(v) { v = Math.round(v); return v < 0 ? 0 : (v > 255 ? 255 : v); }
  function hxs(r, g, b) {
    var v = (cl(r) << 16) | (cl(g) << 8) | cl(b);
    return '#' + ('00000' + v.toString(16)).slice(-6);
  }
  function hx2(h) {
    var s = String(h == null ? '#7FD8F0' : h).replace('#', '');
    if (s.length === 3) { s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2); }
    var n = parseInt(s, 16);
    if (!isFinite(n)) { n = 8378096; }
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var C = hx2(col);
  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * LX + n[1] * LY + n[2] * LZ) / m;
    if (d < 0) d = 0;
    var b = (n[0] * FX + n[1] * FY + n[2] * FZ) / m;
    if (b < 0) b = 0;
    d += 0.26 * b;
    return d > 1 ? 1 : d;
  }
  function fc(n) {
    var k = 0.34 + 1.21 * lam(n), r, g, b, u;
    if (k <= 1) { u = (k - 0.34) / 0.66; r = DR + (BR - DR) * u; g = DG + (BG - DG) * u; b = DB + (BB - DB) * u; }
    else { u = (k - 1) / 0.55; r = BR + (HR - BR) * u; g = BG + (HG - BG) * u; b = BB + (HB - BB) * u; }
    return 'rgb(' + cl(r) + ',' + cl(g) + ',' + cl(b) + ')';
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var z = 1; z < p.length; z++) ctx.lineTo(p[z][0], p[z][1]);
    ctx.closePath();
  }
  function ell(cx, cy, rx, ry) {
    ctx.beginPath();
    for (var z = 0; z < 32; z++) {
      var a = z / 32 * Math.PI * 2, X = cx + rx * Math.cos(a), Y = cy + ry * Math.sin(a);
      if (z === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath();
  }
  function outline(p) {
    ctx.moveTo(p[0][0], p[0][1]);
    for (var z = 1; z < p.length; z++) ctx.lineTo(p[z][0], p[z][1]);
    ctx.closePath();
  }

  var F = [
    [[[-38, 6], [-60, 44], [-36, 58], [-14, 30]], [-0.706, 0.559, 0.436], 0],
    [[[-60, 44], [-63, 100], [-41, 102], [-36, 58]], [-0.873, 0.304, 0.382], 0],
    [[[-63, 100], [-52, 150], [-38, 170], [-34, 138], [-41, 102]], [-0.53, -0.786, 0.318], 0],
    [[[-28, 0], [-50, 24], [-42, 78], [-22, 44]], [-0.509, 0.283, 0.813], 0],
    [[[-42, 78], [-8, 86], [-6, 65], [-22, 44]], [0.078, -0.761, 0.644], 1],
    [[[-28, 0], [-22, 44], [-6, 65], [8, 42], [6, 0]], [0.491, 0.499, 0.714], 0],
    [[[-8, 86], [-4, 118], [14, 114], [24, 88], [-6, 65]], [0.283, -0.798, 0.533], 0],
    [[[-6, 65], [24, 88], [30, 54], [8, 42]], [0.687, 0.129, 0.715], 0],
    [[[8, 42], [30, 54], [38, 24], [44, 4], [48, 0], [6, 0]], [0.585, 0.758, 0.287], 0],
    [[[-14, 124], [-12, 148], [2, 158], [16, 134], [-2, 114]], [-0.706, -0.081, 0.704], 0],
    [[[2, 158], [20, 158], [34, 148], [40, 136], [38, 120], [20, 112], [-2, 114], [16, 134]], [0.593, -0.082, 0.801], 1],
    [[[40, 136], [56, 129], [54, 119], [38, 120]], [0.377, 0.146, 0.914], 0],
    [[[2, 157], [8, 196], [17, 157]], [-0.129, -0.86, 0.494], 0],
    [[[21, 157], [33, 193], [36, 146]], [0.612, -0.67, 0.421], 0]
  ];
  var SIL_T = [[-38, 6], [-60, 44], [-63, 100], [-52, 150], [-38, 170], [-34, 138], [-41, 102], [-36, 58], [-14, 30]];
  var SIL_B = [[48, 0], [44, 4], [38, 24], [30, 54], [24, 88], [14, 114], [20, 112], [38, 120], [54, 119], [56, 129], [40, 136], [34, 148], [33, 193], [21, 157], [17, 157], [8, 196], [2, 157], [-12, 148], [-14, 124], [-4, 118], [-8, 86], [-42, 78], [-50, 24], [-28, 0]];
  var RIM = [[56, 129], [54, 119], [38, 120], [20, 112], [14, 114], [24, 88], [30, 54], [38, 24], [44, 4], [48, 0], [6, 0], [-28, 0]];

  var SC = 0.34;
  var bob = Math.sin(t * Math.PI) * 1.5;                 /* +-1.5px, 2s period */
  var pulse = 0.72 + 0.28 * Math.sin(t * (Math.PI * 2 / 2.6));

  ctx.save();

  /* contact shadow */
  ctx.fillStyle = 'rgba(10,26,38,0.30)';
  ell(0, -1, 20, 5.5); ctx.fill();

  /* pedestal ring, in the owner's colour */
  ctx.fillStyle = hxs(C[0] * 0.40, C[1] * 0.40, C[2] * 0.40);
  ell(0, -3.5, 17, 5); ctx.fill();
  var rgP = ctx.createLinearGradient(0, -9, 0, 2);
  rgP.addColorStop(0, hxs(C[0] * 1.45, C[1] * 1.45, C[2] * 1.45));
  rgP.addColorStop(1, hxs(C[0] * 0.72, C[1] * 0.72, C[2] * 0.72));
  ctx.fillStyle = rgP;
  ell(0, -2, 17, 5); ctx.fill();
  ctx.fillStyle = hxs(C[0] * 0.28, C[1] * 0.28, C[2] * 0.28);
  ell(0, -2, 11, 3); ctx.fill();

  ctx.save();
  ctx.translate(0, -bob);
  ctx.scale(fa * SC, -SC);                 /* +y up, mirrored by facing */

  for (i = 0; i < F.length; i++) { ctx.fillStyle = fc(F[i][1]); poly(F[i][0]); ctx.fill(); }

  /* inner glow in the owner's colour: says whose piece this is */
  ctx.save();
  ctx.beginPath();
  outline(SIL_T);
  outline(SIL_B);
  ctx.clip();
  var gc = cl(C[0] * 1.7) + ',' + cl(C[1] * 1.7) + ',' + cl(C[2] * 1.7);
  var rg = ctx.createRadialGradient(-2, 74, 3, -2, 74, 120);
  rg.addColorStop(0, 'rgba(' + gc + ',' + (0.52 * pulse).toFixed(3) + ')');
  rg.addColorStop(1, 'rgba(' + gc + ',0)');
  ctx.fillStyle = rg;
  ctx.fillRect(-72, -8, 144, 210);
  ctx.restore();

  /* glints */
  var sa = [0.84, 0.6], si = 0;
  for (i = 0; i < F.length; i++) {
    if (!F[i][2]) { continue; }
    var p = F[i][0], o2 = [], bx = p[0][0], by = p[0][1], best = -1e9, sv;
    for (q = 0; q < p.length; q++) {
      sv = p[q][1] - p[q][0];
      if (sv > best) { best = sv; bx = p[q][0]; by = p[q][1]; }
    }
    for (q = 0; q < p.length; q++) {
      o2.push([bx + (p[q][0] - bx) * 0.30, by + (p[q][1] - by) * 0.30]);
    }
    ctx.fillStyle = 'rgba(255,255,255,' + sa[si++ % 2] + ')';
    poly(o2); ctx.fill();
  }

  /* eye */
  ctx.fillStyle = 'rgb(18,60,84)';
  poly([[24, 137], [30, 135], [29, 131], [24, 132]]); ctx.fill();

  /* rim light, lower right only */
  ctx.strokeStyle = 'rgba(228,252,255,0.72)';
  ctx.lineWidth = 1.7 / SC;   /* 1.7px: 2.5 would be heavy on a 68px piece */
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(RIM[0][0], RIM[0][1]);
  for (i = 1; i < RIM.length; i++) ctx.lineTo(RIM[i][0], RIM[i][1]);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

/* ───── ac2d479e99e15b5ac ───── */
function dvG7(ctx, T) {
  var t = (T || 0) * 0.001;
  var BASE = [232, 160, 50];
  var DARK = [107, 60, 8];
  var lx = -0.55, ly = -0.72, lz = 0.42;
  var lm = Math.sqrt(lx * lx + ly * ly + lz * lz);
  lx /= lm; ly /= lm; lz /= lm;

  function shade(n) {
    var lam = n[0] * lx + n[1] * ly + n[2] * lz;
    if (lam < 0) lam = 0;
    var f = 0.34 + lam * 1.21;
    var r, g, b;
    if (f <= 1) {
      var u = (f - 0.34) / 0.66;
      r = DARK[0] + (BASE[0] - DARK[0]) * u;
      g = DARK[1] + (BASE[1] - DARK[1]) * u;
      b = DARK[2] + (BASE[2] - DARK[2]) * u;
    } else {
      r = BASE[0] * f; g = BASE[1] * f; b = BASE[2] * f;
    }
    return 'rgb(' + Math.round(Math.min(255, r)) + ',' + Math.round(Math.min(255, g)) + ',' + Math.round(Math.min(255, b)) + ')';
  }
  function trace(p) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (var i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath();
  }
  function inset(p, k, dx, dy) {
    var cx = 0, cy = 0, m = p.length / 2, i;
    for (i = 0; i < p.length; i += 2) { cx += p[i]; cy += p[i + 1]; }
    cx /= m; cy /= m;
    var o = [];
    for (i = 0; i < p.length; i += 2) {
      o.push(cx + (p[i] - cx) * k + dx);
      o.push(cy + (p[i + 1] - cy) * k + dy);
    }
    return o;
  }

  /* 35 facets, drawn back-to-front: head 10 / ears 4 / eyes 2 / nose 1 / torso 10 / hind legs 4 / arms 4.
     Each carries its own hand-set normal, so no two facets end up the same colour. */
  var F = [
    [[98, 82, 142, 82, 132, 110, 108, 110], [-0.089, -0.878, 0.471]],
    [[142, 82, 166, 106, 166, 138, 138, 132, 132, 110], [0.581, -0.439, 0.686]],
    [[166, 138, 146, 168, 134, 158, 138, 132], [0.348, 0.079, 0.934]],
    [[146, 168, 94, 168, 106, 158, 134, 158], [-0.222, 0.56, 0.798]],
    [[94, 168, 74, 138, 102, 132, 106, 158], [-0.591, 0.321, 0.74]],
    [[74, 138, 74, 106, 98, 82, 108, 110, 102, 132], [-0.757, -0.012, 0.653]],
    [[108, 110, 132, 110, 138, 132, 102, 132], [0.109, -0.309, 0.945]],
    [[102, 132, 138, 132, 120, 146], [-0.022, -0.585, 0.811]],
    [[138, 132, 134, 158, 106, 158, 120, 146], [0.301, 0.075, 0.951]],
    [[106, 158, 102, 132, 120, 146], [-0.437, 0.176, 0.882]],
    [[98, 82, 94, 68, 78, 70, 86, 94], [0.023, -0.826, 0.563]],
    [[86, 94, 78, 70, 72, 84], [-0.51, 0.24, 0.826]],
    [[142, 82, 146, 68, 162, 70, 154, 94], [0.691, -0.588, 0.42]],
    [[154, 94, 162, 70, 168, 84], [0.673, -0.293, 0.679]],
    [[100, 114, 110, 113, 111, 121, 101, 122], [-0.27, 0.614, 0.742]],
    [[130, 113, 140, 114, 139, 122, 129, 121], [0.184, 0.387, 0.904]],
    [[113, 138, 127, 138, 124, 147, 116, 147], [-0.002, 0.467, 0.884]],
    [[88, 166, 152, 166, 140, 196, 120, 196, 100, 196], [0.093, -0.665, 0.741]],
    [[152, 166, 178, 204, 140, 196], [0.54, -0.47, 0.698]],
    [[178, 204, 188, 252, 150, 248, 140, 196], [0.674, -0.261, 0.691]],
    [[188, 252, 168, 274, 150, 248], [0.331, 0.071, 0.941]],
    [[168, 274, 72, 274, 90, 248, 120, 248, 150, 248], [-0.196, 0.531, 0.824]],
    [[72, 274, 52, 252, 90, 248], [-0.602, 0.472, 0.644]],
    [[52, 252, 62, 204, 100, 196, 90, 248], [-0.857, 0.302, 0.417]],
    [[62, 204, 88, 166, 100, 196], [-0.481, 0.039, 0.876]],
    [[100, 196, 120, 196, 120, 248, 90, 248], [-0.248, -0.043, 0.968]],
    [[120, 196, 140, 196, 150, 248, 120, 248], [0.195, -0.122, 0.973]],
    [[56, 248, 104, 252, 108, 278, 60, 274], [0.22, -0.352, 0.91]],
    [[60, 274, 108, 278, 104, 292, 58, 292], [-0.15, 0.326, 0.933]],
    [[184, 248, 136, 252, 132, 278, 180, 274], [0.457, -0.379, 0.805]],
    [[180, 274, 132, 278, 136, 292, 182, 292], [0.091, 0.35, 0.932]],
    [[62, 204, 52, 246, 76, 252, 88, 212], [-0.482, -0.044, 0.875]],
    [[52, 246, 60, 268, 84, 262, 76, 252], [-0.443, 0.102, 0.891]],
    [[178, 204, 188, 246, 164, 252, 152, 212], [0.437, -0.262, 0.861]],
    [[188, 246, 180, 268, 156, 262, 164, 252], [0.221, 0.121, 0.968]]
  ];
  var SIL = [98, 82, 142, 82, 146, 68, 162, 70, 168, 84, 154, 94, 166, 106, 166, 138, 146, 168,
    178, 204, 188, 250, 184, 292, 56, 292, 52, 250, 62, 204,
    88, 166, 74, 138, 74, 106, 86, 94, 72, 84, 78, 70, 94, 68];
  var RIM = [166, 138, 146, 168, 178, 204, 188, 250, 184, 292, 136, 292];
  var SPEC = [0, 7, 17];
  var SPEC_K = [0.18, 0.26, 0.16];
  var SPEC_DX = [-7, -3, -9];
  var SPEC_DY = [-4, -2, -5];
  var SPEC_A = [0.72, 0.66, 0.48];

  var bob = Math.sin(t * 1.05) * 1.7;
  var pulse = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 2.6);
  var i;

  ctx.save();

  /* --- polished metal pedestal --- */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(120, 310, 84, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#553A0B';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(120, 304, 84, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#77530F';
  ctx.fill();
  var pg = ctx.createLinearGradient(0, 283, 0, 313);
  pg.addColorStop(0, '#F8E0A0');
  pg.addColorStop(0.42, '#CA9D3C');
  pg.addColorStop(1, '#7E5915');
  ctx.beginPath();
  ctx.ellipse(120, 298, 84, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(120, 298, 58, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#9C7429';
  ctx.fill();
  /* the amber colour bleeding into the metal */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(120, 298, 84, 15, 0, 0, Math.PI * 2);
  ctx.clip();
  var rg = ctx.createRadialGradient(120, 296, 2, 120, 298, 78);
  rg.addColorStop(0, 'rgba(255,186,86,0.45)');
  rg.addColorStop(1, 'rgba(255,168,58,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(34, 281, 172, 34);
  ctx.restore();
  /* highlight arc across the front of the rim */
  ctx.beginPath();
  ctx.ellipse(120, 298, 82, 13.5, 0, Math.PI * 0.17, Math.PI * 0.83);
  ctx.strokeStyle = 'rgba(255,248,222,0.72)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  /* --- cast shadow --- */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(120, 294, 66, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(28,14,2,0.3)';
  ctx.fill();
  ctx.restore();

  /* --- the carved statue --- */
  ctx.save();
  ctx.translate(0, bob);

  for (i = 0; i < F.length; i++) {
    trace(F[i][0]);
    ctx.fillStyle = shade(F[i][1]);
    ctx.fill();
  }

  /* 1. specular: tiny scaled copies inside the most up-facing facets */
  ctx.save();
  for (i = 0; i < SPEC.length; i++) {
    trace(inset(F[SPEC[i]][0], SPEC_K[i], SPEC_DX[i], SPEC_DY[i]));
    ctx.fillStyle = 'rgba(255,255,255,' + SPEC_A[i] + ')';
    ctx.fill();
  }
  ctx.restore();

  /* 2. light trapped inside the amber, pulsing on a 2.6s cycle */
  ctx.save();
  trace(SIL);
  ctx.clip();
  var ig = ctx.createRadialGradient(114, 212, 3, 114, 212, 92 + pulse * 12);
  ig.addColorStop(0, 'rgba(255,222,142,' + (0.34 + pulse * 0.16) + ')');
  ig.addColorStop(0.45, 'rgba(255,192,92,' + (0.15 + pulse * 0.08) + ')');
  ig.addColorStop(1, 'rgba(255,170,60,0)');
  ctx.fillStyle = ig;
  ctx.fillRect(45, 60, 150, 240);
  ctx.restore();

  /* 3. rim light on the lower-right contour only */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(RIM[0], RIM[1]);
  for (i = 2; i < RIM.length; i += 2) ctx.lineTo(RIM[i], RIM[i + 1]);
  ctx.strokeStyle = 'rgba(255,228,158,0.9)';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  /* --- floating crystal shards --- */
  ctx.save();
  for (i = 0; i < 8; i++) {
    var a = t * 0.32 + i * Math.PI * 0.25;
    var cx = 120 + Math.cos(a) * (86 + (i % 3) * 9);
    var cy = 180 + Math.sin(a) * 52 + Math.sin(t * 0.8 + i * 1.3) * 7;
    var s = 4 + (i % 4) * 1.4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a * 1.4 + i);
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.lineTo(s * 0.62, 0); ctx.lineTo(0, s * 0.85); ctx.closePath();
    ctx.fillStyle = 'rgba(255,214,132,' + (0.5 + (i % 3) * 0.13) + ')';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.lineTo(-s * 0.62, 0); ctx.lineTo(0, s * 0.85); ctx.closePath();
    ctx.fillStyle = 'rgba(184,116,30,' + (0.42 + (i % 4) * 0.1) + ')';
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

function dvS7(ctx, col, T, facing) {
  var t = (T || 0) * 0.001;
  var BASE = [232, 160, 50];
  var DARK = [107, 60, 8];
  var lx = -0.55, ly = -0.72, lz = 0.42;
  var lm = Math.sqrt(lx * lx + ly * ly + lz * lz);
  lx /= lm; ly /= lm; lz /= lm;

  function hex2rgb(c) {
    var s = (typeof c === 'string' ? c : '#E8A032').replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var v = parseInt(s, 16);
    if (isNaN(v)) v = 15245362;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function lift(c, k) {
    return [Math.max(0, Math.min(255, Math.round(c[0] + (255 - c[0]) * k))),
      Math.max(0, Math.min(255, Math.round(c[1] + (255 - c[1]) * k))),
      Math.max(0, Math.min(255, Math.round(c[2] + (255 - c[2]) * k)))];
  }
  function dim(c, k) { return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)]; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function shade(n) {
    var lam = n[0] * lx + n[1] * ly + n[2] * lz;
    if (lam < 0) lam = 0;
    var f = 0.34 + lam * 1.21;
    var r, g, b;
    if (f <= 1) {
      var u = (f - 0.34) / 0.66;
      r = DARK[0] + (BASE[0] - DARK[0]) * u;
      g = DARK[1] + (BASE[1] - DARK[1]) * u;
      b = DARK[2] + (BASE[2] - DARK[2]) * u;
    } else {
      r = BASE[0] * f; g = BASE[1] * f; b = BASE[2] * f;
    }
    return 'rgb(' + Math.round(Math.min(255, r)) + ',' + Math.round(Math.min(255, g)) + ',' + Math.round(Math.min(255, b)) + ')';
  }
  function trace(p) {
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    for (var i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath();
  }
  function inset(p, k, dx, dy) {
    var cx = 0, cy = 0, m = p.length / 2, i;
    for (i = 0; i < p.length; i += 2) { cx += p[i]; cy += p[i + 1]; }
    cx /= m; cy /= m;
    var o = [];
    for (i = 0; i < p.length; i += 2) {
      o.push(cx + (p[i] - cx) * k + dx);
      o.push(cy + (p[i + 1] - cy) * k + dy);
    }
    return o;
  }

  /* 18 facets: same style, fewer planes so it survives at 68px tall */
  var F = [
    [[-9, -59, 9, -59, 5, -48, -5, -48], [-0.048, -0.859, 0.51]],
    [[9, -59, 15, -50, 11, -40, 5, -48], [0.613, -0.405, 0.679]],
    [[11, -40, -11, -40, -5, -48, 5, -48], [-0.135, 0.514, 0.847]],
    [[-11, -40, -15, -50, -9, -59, -5, -48], [-0.737, 0.094, 0.669]],
    [[-9, -59, -12, -68, -20, -62, -12, -54], [0.093, -0.851, 0.517]],
    [[9, -59, 12, -68, 20, -62, 12, -54], [0.716, -0.536, 0.447]],
    [[-7, -52, -3, -52, -3, -49, -7, -49], [-0.242, 0.606, 0.758]],
    [[3, -52, 7, -52, 7, -49, 3, -49], [0.171, 0.396, 0.902]],
    [[-11, -40, 11, -40, 8, -26, -8, -26], [0.118, -0.652, 0.749]],
    [[11, -40, 18, -26, 8, -26], [0.555, -0.421, 0.718]],
    [[18, -26, 20, -8, 9, -11, 8, -26], [0.685, -0.248, 0.685]],
    [[20, -8, 16, -1, -16, -1, -9, -11, 9, -11], [-0.179, 0.555, 0.812]],
    [[-16, -1, -20, -8, -9, -11], [-0.614, 0.514, 0.6]],
    [[-20, -8, -18, -26, -8, -26, -9, -11], [-0.872, 0.325, 0.366]],
    [[-18, -26, -11, -40, -8, -26], [-0.462, 0.091, 0.882]],
    [[-8, -26, 8, -26, 9, -11, -9, -11], [-0.124, 0.035, 0.992]],
    [[-18, -26, -21, -11, -12, -8, -11, -23], [-0.47, -0.042, 0.881]],
    [[18, -26, 21, -11, 12, -8, 11, -23], [0.313, 0.11, 0.943]]
  ];
  var SIL = [-9, -59, 9, -59, 12, -68, 20, -62, 12, -54, 15, -50, 11, -40, 18, -26, 21, -11, 16, -1,
    -16, -1, -21, -11, -18, -26, -11, -40, -15, -50, -12, -54, -20, -62, -12, -68];
  var RIM = [15, -50, 11, -40, 18, -26, 21, -11, 16, -1];

  var c = hex2rgb(col);
  var bob = Math.sin(t * Math.PI) * 1.5;
  var dir = (facing === -1) ? -1 : 1;
  var i;

  ctx.save();

  /* cast shadow at the contact point */
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(26,13,2,0.3)';
  ctx.fill();

  /* pedestal ring, carrying the owner colour */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 1, 19, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgba(dim(c, 0.42), 0.95);
  ctx.fill();
  var rgd = ctx.createLinearGradient(0, -7, 0, 5);
  rgd.addColorStop(0, rgba(lift(c, 0.7), 1));
  rgd.addColorStop(0.5, rgba(c, 1));
  rgd.addColorStop(1, rgba(dim(c, 0.55), 1));
  ctx.beginPath();
  ctx.ellipse(0, -1, 19, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgd;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -1, 12, 3.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgba(dim(c, 0.68), 0.9);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -1, 18, 4.8, 0, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = 'rgba(255,252,238,0.6)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(dir, 1);

  for (i = 0; i < F.length; i++) {
    trace(F[i][0]);
    ctx.fillStyle = shade(F[i][1]);
    ctx.fill();
  }

  /* specular chips */
  ctx.save();
  trace(inset(F[0][0], 0.26, -2, -1.2));
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fill();
  trace(inset(F[8][0], 0.22, -3, -1.6));
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  ctx.restore();

  /* inner light, tinted with the owner colour */
  ctx.save();
  trace(SIL);
  ctx.clip();
  var ig = ctx.createRadialGradient(-2, -24, 1, -2, -24, 30);
  ig.addColorStop(0, rgba(lift(c, 0.55), 0.26));
  ig.addColorStop(0.5, rgba(lift(c, 0.2), 0.12));
  ig.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = ig;
  ctx.fillRect(-23, -70, 46, 70);
  ctx.restore();

  /* rim light on the lower-right contour only */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(RIM[0], RIM[1]);
  for (i = 2; i < RIM.length; i += 2) ctx.lineTo(RIM[i], RIM[i + 1]);
  ctx.strokeStyle = rgba(lift(c, 0.72), 0.82);
  ctx.lineWidth = 1.7;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

/* ───── a4fa366869a39c2e0 ───── */
function dvG1(ctx, T) {
  var t = T || 0;
  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var lm = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
  LX /= lm; LY /= lm; LZ /= lm;

  // lambert against the key light plus a weak fill, so shadow faces still differ
  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d1 = (n[0] * LX + n[1] * LY + n[2] * LZ) / m;
    var d2 = (n[0] * 0.62 + n[1] * 0.55 + n[2] * 0.56) / m;
    return (d1 > 0 ? d1 : 0) + (d2 > 0 ? d2 : 0) * 0.12;
  }
  // stretch the facet set across the whole 0.34 (#7A5410) .. 1.55 range
  function spread(list) {
    var q, n = list.length, mn = 1e9, mxv = -1e9, r = [], ord = [], v;
    for (q = 0; q < n; q++) {
      v = lam(list[q].n) * (list[q].k === undefined ? 1 : list[q].k);
      r.push(v); ord.push(q); if (v < mn) mn = v; if (v > mxv) mxv = v;
    }
    if (mxv - mn < 1e-6) mxv = mn + 1;
    ord.sort(function (x, y) { return r[x] - r[y]; });
    // blend the true lambert with its rank, so no two facets can land on one colour
    for (q = 0; q < n; q++) {
      v = 0.55 * (r[ord[q]] - mn) / (mxv - mn) + 0.45 * (n > 1 ? q / (n - 1) : 0);
      list[ord[q]].v = 0.34 + Math.pow(v, 1.35) * 1.21;
    }
  }
  function gold(v) {
    var r, g, b, u;
    if (v <= 1) {
      u = (v - 0.34) / 0.66; if (u < 0) u = 0;
      r = 122 + 120 * u; g = 84 + 110 * u; b = 16 + 32 * u;
    } else {
      u = (v - 1) / 0.55; if (u > 1) u = 1;
      r = 242 + 13 * u; g = 194 + 44 * u; b = 48 + 92 * u;
    }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }
  function addPoly(p) {
    ctx.moveTo(p[0][0], p[0][1]);
    for (var q = 1; q < p.length; q++) ctx.lineTo(p[q][0], p[q][1]);
    ctx.closePath();
  }

  // ---- body facets : straight edges only, one hand-picked normal each ----
  var F = [
    // front legs : shin front + outer plane + a broad paw slab on the plinth
    { p: [[92, 244], [112, 246], [112, 278], [88, 278]], n: [-0.31, -0.25, 0.92] },
    { p: [[92, 244], [88, 278], [78, 276], [80, 246]], n: [-0.86, -0.18, 0.48] },
    { p: [[78, 276], [88, 278], [112, 278], [116, 286], [112, 292], [74, 292]], n: [-0.24, -0.44, 0.87] },
    { p: [[148, 244], [128, 246], [128, 278], [152, 278]], n: [0.20, -0.34, 0.92] },
    { p: [[148, 244], [152, 278], [162, 276], [160, 246]], n: [0.90, -0.21, 0.41] },
    { p: [[162, 276], [152, 278], [128, 278], [124, 286], [128, 292], [166, 292]], n: [0.30, -0.40, 0.86] },
    // chest, narrower than the mane so the mane still dominates
    { p: [[104, 202], [96, 248], [84, 240], [90, 204]], n: [-0.66, -0.34, 0.67] },
    { p: [[136, 202], [144, 248], [156, 240], [150, 204]], n: [0.70, -0.28, 0.66] },
    { p: [[104, 202], [136, 202], [144, 248], [96, 248]], n: [-0.05, -0.42, 0.91], s: 0.62 }
  ];

  // ---- mane : 14 radial wedges, every one a different brightness ----
  var mcx = 120, mcy = 154, ky = 0.95, ri = 34;
  var RO = [76, 64, 80, 66, 74, 63, 78, 65, 81, 64, 77, 68, 75, 62];
  var JZ = [0.05, -0.06, 0.09, -0.03, 0.07, -0.08, 0.02, 0.10, -0.05, 0.04, -0.09, 0.03, 0.08, -0.04];
  var AW = [1.15, 0.85, 1.1, 0.9, 1.05, 0.95, 1.2, 0.8, 1.1, 0.9, 1.0, 1.0, 1.05, 0.95];
  var sp = Math.PI * 2 / 14, acc = -Math.PI / 2 - AW[0] * sp / 2;
  var i, j, a0, a1, am, ro, MO = [], o0, o1, ot;
  for (i = 0; i < 14; i++) {
    a0 = acc; a1 = acc + AW[i] * sp; am = (a0 + a1) / 2; acc = a1; ro = RO[i];
    o0 = [mcx + ro * Math.cos(a0), mcy + ro * Math.sin(a0) * ky];
    ot = [mcx + ro * 1.10 * Math.cos(am), mcy + ro * 1.10 * Math.sin(am) * ky];
    o1 = [mcx + ro * Math.cos(a1), mcy + ro * Math.sin(a1) * ky];
    MO.push([o0, ot, o1]);
    F.push({
      p: [
        [mcx + ri * Math.cos(a0), mcy + ri * Math.sin(a0) * ky],
        o0, ot, o1,
        [mcx + ri * Math.cos(a1), mcy + ri * Math.sin(a1) * ky]
      ],
      n: [Math.cos(am) * 0.78, Math.sin(am) * 0.70, 0.60 + JZ[i]],
      s: i === 0 ? 0.72 : 0
    });
  }

  // ---- head, laid over the mane so no gap shows through ----
  F.push({ p: [[95, 112], [145, 112], [158, 154], [82, 154]], n: [-0.10, -0.62, 0.78], s: 0.58 });
  F.push({ p: [[92, 120], [102, 104], [109, 126]], n: [-0.55, -0.68, 0.48] });
  F.push({ p: [[148, 120], [138, 104], [131, 126]], n: [0.58, -0.64, 0.50] });
  F.push({ p: [[82, 154], [110, 154], [113, 172], [103, 186], [86, 172]], n: [-0.52, -0.20, 0.83] });
  F.push({ p: [[158, 154], [130, 154], [127, 172], [137, 186], [154, 172]], n: [0.56, -0.14, 0.82] });
  F.push({ p: [[110, 154], [130, 154], [127, 172], [113, 172]], n: [0.04, -0.48, 0.88] });
  F.push({ p: [[103, 186], [113, 172], [127, 172], [137, 186], [120, 198]], n: [-0.02, 0.34, 0.94] });
  F.push({ p: [[97, 134], [113, 140], [112, 147], [96, 142]], n: [-0.34, -0.30, 0.89], k: 0.46 });
  F.push({ p: [[143, 134], [127, 140], [128, 147], [144, 142]], n: [0.32, -0.28, 0.90], k: 0.52 });

  // lower-right silhouette only, used by the rim light
  var RIM = MO[3].concat(MO[4], MO[5], [MO[6][0], MO[6][1]],
    [[154, 234], [156, 240], [160, 248], [162, 276], [166, 292], [124, 292]]);

  var bob = Math.sin(t * 0.00185) * 1.2;
  var pulse = 0.5 + 0.16 * Math.sin(t * Math.PI * 2 / 2600);
  var f, gx, gy, np, qx, qy;

  // ---- cast shadow ----
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(120, 318, 66, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ---- pedestal : side band ----
  ctx.save();
  var sg = ctx.createLinearGradient(0, 294, 0, 320);
  sg.addColorStop(0, '#8A5F14');
  sg.addColorStop(0.55, '#4E360C');
  sg.addColorStop(1, '#2C1E06');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(120, 297, 58, 10, 0, 0, Math.PI);
  ctx.lineTo(62, 309);
  ctx.ellipse(120, 309, 58, 10, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ---- pedestal : polished top ring ----
  ctx.save();
  var tg = ctx.createLinearGradient(0, 287, 0, 307);
  tg.addColorStop(0, '#FFE9A6');
  tg.addColorStop(0.45, '#D9A526');
  tg.addColorStop(1, '#8C6112');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.ellipse(120, 297, 58, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  var ig = ctx.createLinearGradient(0, 289, 0, 305);
  ig.addColorStop(0, '#A97C18');
  ig.addColorStop(1, '#E4BC45');
  ctx.fillStyle = ig;
  ctx.beginPath();
  ctx.ellipse(120, 297, 43, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // the guardian's gold reflected faintly in the plate
  var rf = ctx.createRadialGradient(120, 297, 0, 120, 297, 46);
  rf.addColorStop(0, 'rgba(255,226,140,0.36)');
  rf.addColorStop(1, 'rgba(255,226,140,0)');
  ctx.fillStyle = rf;
  ctx.beginPath();
  ctx.ellipse(120, 297, 46, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(120, 296, 51, 9, 0, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();

  // ---- drifting crystal chips : the half behind the statue ----
  var k, ang, rad, cxx, cyy, sc, spin, cs, sn;
  var QD = [[0, -1], [0.62, 0], [0, 1.35], [-0.62, 0]];
  for (k = 0; k < 8; k++) {
    ang = t * 0.00042 + k * (Math.PI * 2 / 8);
    if (Math.sin(ang) > 0) continue;
    rad = 84 + (k % 3) * 11;
    cxx = 120 + Math.cos(ang) * rad;
    cyy = 100 + k * 18 + Math.sin(t * 0.0011 + k * 0.9) * 8;
    sc = 0.72 + 0.3 * Math.sin(ang);
    spin = t * 0.0013 + k * 1.3;
    cs = Math.cos(spin); sn = Math.sin(spin);
    ctx.save();
    ctx.globalAlpha = 0.34 + 0.2 * sc;
    ctx.fillStyle = gold(0.9 + 0.4 * Math.sin(spin * 1.7));
    ctx.beginPath();
    for (j = 0; j < 4; j++) {
      qx = QD[j][0] * 5.4 * sc; qy = QD[j][1] * 5.4 * sc;
      if (j === 0) ctx.moveTo(cxx + qx * cs - qy * sn, cyy + qx * sn + qy * cs);
      else ctx.lineTo(cxx + qx * cs - qy * sn, cyy + qx * sn + qy * cs);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ================= the statue =================
  ctx.save();
  ctx.translate(0, bob);

  spread(F);
  for (i = 0; i < F.length; i++) {
    f = F[i];
    ctx.save();
    ctx.fillStyle = gold(f.v);
    ctx.beginPath();
    addPoly(f.p);
    ctx.fill();
    ctx.restore();
  }

  // ---- inner glow, clipped to the silhouette, pulsing on 2.6s ----
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < F.length; i++) addPoly(F[i].p);
  ctx.clip();
  var gg = ctx.createRadialGradient(116, 178, 0, 116, 178, 62);
  gg.addColorStop(0, 'rgba(250,226,152,' + pulse.toFixed(3) + ')');
  gg.addColorStop(0.5, 'rgba(248,206,96,' + (pulse * 0.34).toFixed(3) + ')');
  gg.addColorStop(1, 'rgba(242,194,48,0)');
  ctx.fillStyle = gg;
  ctx.fillRect(0, 0, 240, 340);
  ctx.restore();

  // ---- sharp speculars on the most upward faces ----
  for (i = 0; i < F.length; i++) {
    f = F[i];
    if (!f.s) continue;
    gx = 0; gy = 0; np = f.p.length;
    for (j = 0; j < np; j++) { gx += f.p[j][0]; gy += f.p[j][1]; }
    gx /= np; gy /= np;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,' + f.s.toFixed(2) + ')';
    ctx.beginPath();
    for (j = 0; j < np; j++) {
      qx = gx + (f.p[j][0] - gx) * 0.29 - 2.6;
      qy = gy + (f.p[j][1] - gy) * 0.29 - 3.0;
      if (j === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- rim light : lower-right contour only ----
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < F.length; i++) addPoly(F[i].p);
  ctx.clip();
  ctx.strokeStyle = 'rgb(253,235,164)';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(RIM[0][0], RIM[0][1]);
  for (i = 1; i < RIM.length; i++) ctx.lineTo(RIM[i][0], RIM[i][1]);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // ---- drifting crystal chips : the half in front ----
  for (k = 0; k < 8; k++) {
    ang = t * 0.00042 + k * (Math.PI * 2 / 8);
    if (Math.sin(ang) <= 0) continue;
    rad = 84 + (k % 3) * 11;
    cxx = 120 + Math.cos(ang) * rad;
    cyy = 100 + k * 18 + Math.sin(t * 0.0011 + k * 0.9) * 8;
    sc = 0.72 + 0.3 * Math.sin(ang);
    spin = t * 0.0013 + k * 1.3;
    cs = Math.cos(spin); sn = Math.sin(spin);
    ctx.save();
    ctx.globalAlpha = 0.34 + 0.2 * sc;
    ctx.fillStyle = gold(0.9 + 0.4 * Math.sin(spin * 1.7));
    ctx.beginPath();
    for (j = 0; j < 4; j++) {
      qx = QD[j][0] * 5.4 * sc; qy = QD[j][1] * 5.4 * sc;
      if (j === 0) ctx.moveTo(cxx + qx * cs - qy * sn, cyy + qx * sn + qy * cs);
      else ctx.lineTo(cxx + qx * cs - qy * sn, cyy + qx * sn + qy * cs);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function dvS1(ctx, col, T, facing) {
  var t = T || 0;
  var fc = facing === -1 ? -1 : 1;
  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var lm = Math.sqrt(LX * LX + LY * LY + LZ * LZ);
  LX /= lm; LY /= lm; LZ /= lm;

  function lam(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d1 = (n[0] * LX + n[1] * LY + n[2] * LZ) / m;
    var d2 = (n[0] * 0.62 + n[1] * 0.55 + n[2] * 0.56) / m;
    return (d1 > 0 ? d1 : 0) + (d2 > 0 ? d2 : 0) * 0.12;
  }
  function spread(list) {
    var q, n = list.length, mn = 1e9, mxv = -1e9, r = [], ord = [], v;
    for (q = 0; q < n; q++) {
      v = lam(list[q].n) * (list[q].k === undefined ? 1 : list[q].k);
      r.push(v); ord.push(q); if (v < mn) mn = v; if (v > mxv) mxv = v;
    }
    if (mxv - mn < 1e-6) mxv = mn + 1;
    ord.sort(function (x, y) { return r[x] - r[y]; });
    // blend the true lambert with its rank, so no two facets can land on one colour
    for (q = 0; q < n; q++) {
      v = 0.55 * (r[ord[q]] - mn) / (mxv - mn) + 0.45 * (n > 1 ? q / (n - 1) : 0);
      list[ord[q]].v = 0.34 + Math.pow(v, 1.35) * 1.21;
    }
  }
  function gold(v) {
    var r, g, b, u;
    if (v <= 1) {
      u = (v - 0.34) / 0.66; if (u < 0) u = 0;
      r = 122 + 120 * u; g = 84 + 110 * u; b = 16 + 32 * u;
    } else {
      u = (v - 1) / 0.55; if (u > 1) u = 1;
      r = 242 + 13 * u; g = 194 + 44 * u; b = 48 + 92 * u;
    }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }
  function ownColor() {
    var s = String(col || '#8899FF').replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var n = parseInt(s, 16);
    if (s.length !== 6 || isNaN(n)) n = 0x8899FF;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lift(c, a) {
    return 'rgba(' + Math.round(c[0] + (255 - c[0]) * 0.28) + ',' +
      Math.round(c[1] + (255 - c[1]) * 0.28) + ',' +
      Math.round(c[2] + (255 - c[2]) * 0.28) + ',' + a + ')';
  }
  function addPoly(p) {
    ctx.moveTo(p[0][0] * fc, p[0][1]);
    for (var q = 1; q < p.length; q++) ctx.lineTo(p[q][0] * fc, p[q][1]);
    ctx.closePath();
  }

  var C = ownColor();

  // ---- 17 facets : legs, chest, 8 mane wedges, head, eyes ----
  var F = [
    { p: [[-9, -20], [-2, -20], [-2, 0], [-11, 0]], n: [-0.40, -0.24, 0.88] },
    { p: [[9, -20], [2, -20], [2, 0], [11, 0]], n: [0.30, -0.32, 0.90] },
    { p: [[-7, -38], [-9.5, -20], [-14, -23], [-11, -36]], n: [-0.86, -0.26, 0.44] },
    { p: [[7, -38], [9.5, -20], [14, -23], [11, -36]], n: [0.90, -0.18, 0.40] },
    { p: [[-7, -38], [7, -38], [9.5, -20], [-9.5, -20]], n: [-0.06, -0.44, 0.90], s: 0.58 }
  ];
  var mcx = 0, mcy = -49, ky = 0.95, ri = 7;
  var RO = [18, 14, 17, 13, 18, 14, 16, 13];
  var JZ = [0.06, -0.05, 0.09, -0.03, 0.07, -0.08, 0.02, 0.10];
  var AW = [1.2, 0.85, 1.1, 0.9, 1.15, 0.85, 1.05, 0.9];
  var sp = Math.PI * 2 / 8, acc = -Math.PI / 2 - AW[0] * sp / 2;
  var i, j, a0, a1, am, ro, MO = [], o0, o1, ot;
  for (i = 0; i < 8; i++) {
    a0 = acc; a1 = acc + AW[i] * sp; am = (a0 + a1) / 2; acc = a1; ro = RO[i];
    o0 = [mcx + ro * Math.cos(a0), mcy + ro * Math.sin(a0) * ky];
    ot = [mcx + ro * 1.12 * Math.cos(am), mcy + ro * 1.12 * Math.sin(am) * ky];
    o1 = [mcx + ro * Math.cos(a1), mcy + ro * Math.sin(a1) * ky];
    MO.push([o0, ot, o1]);
    F.push({
      p: [
        [mcx + ri * Math.cos(a0), mcy + ri * Math.sin(a0) * ky],
        o0, ot, o1,
        [mcx + ri * Math.cos(a1), mcy + ri * Math.sin(a1) * ky]
      ],
      n: [Math.cos(am) * 0.78, Math.sin(am) * 0.70, 0.60 + JZ[i]],
      s: i === 0 ? 0.70 : 0
    });
  }
  F.push({ p: [[-7, -57], [7, -57], [9.5, -48], [-9.5, -48]], n: [-0.12, -0.66, 0.74], s: 0.56 });
  F.push({ p: [[-9.5, -48], [9.5, -48], [5, -38], [-5, -38]], n: [0.05, -0.16, 0.985] });
  F.push({ p: [[-7, -53.6], [-2, -51.6], [-2.4, -48.2], [-7.4, -50.2]], n: [-0.36, -0.28, 0.89], k: 0.46 });
  F.push({ p: [[7, -53.6], [2, -51.6], [2.4, -48.2], [7.4, -50.2]], n: [0.30, -0.26, 0.92], k: 0.52 });

  var RIM = MO[2].concat([MO[3][0], MO[3][1]], [[11, -36], [14, -23], [9.5, -20], [11, -1]]);

  var bob = Math.sin(t * Math.PI * 2 / 2000) * 1.5;
  var pulse = 0.5 + 0.16 * Math.sin(t * Math.PI * 2 / 2600);
  var f, gx, gy, np, qx, qy;

  // ---- cast shadow at the contact point ----
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 1, 16, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ---- pedestal ring in the owner's colour ----
  ctx.save();
  ctx.fillStyle = 'rgb(' + Math.round(C[0] * 0.34) + ',' + Math.round(C[1] * 0.34) + ',' + Math.round(C[2] * 0.34) + ')';
  ctx.beginPath();
  ctx.ellipse(0, -1, 14, 4.4, 0, 0, Math.PI);
  ctx.lineTo(-14, 3);
  ctx.ellipse(0, 3, 14, 4.4, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  var pg = ctx.createLinearGradient(0, -6, 0, 4);
  pg.addColorStop(0, lift(C, 1));
  pg.addColorStop(0.5, 'rgb(' + C[0] + ',' + C[1] + ',' + C[2] + ')');
  pg.addColorStop(1, 'rgb(' + Math.round(C[0] * 0.45) + ',' + Math.round(C[1] * 0.45) + ',' + Math.round(C[2] * 0.45) + ')');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.ellipse(0, -1, 14, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -1.4, 11.6, 3.6, 0, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();

  // ================= the statue =================
  ctx.save();
  ctx.translate(0, bob);

  spread(F);
  for (i = 0; i < F.length; i++) {
    f = F[i];
    ctx.save();
    ctx.fillStyle = gold(f.v);
    ctx.beginPath();
    addPoly(f.p);
    ctx.fill();
    ctx.restore();
  }

  // ---- inner glow in the owner's colour ----
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < F.length; i++) addPoly(F[i].p);
  ctx.clip();
  var gg = ctx.createRadialGradient(-3 * fc, -44, 0, -3 * fc, -44, 24);
  gg.addColorStop(0, lift(C, (pulse * 0.34).toFixed(3)));
  gg.addColorStop(0.6, 'rgba(' + C[0] + ',' + C[1] + ',' + C[2] + ',' + (pulse * 0.15).toFixed(3) + ')');
  gg.addColorStop(1, 'rgba(' + C[0] + ',' + C[1] + ',' + C[2] + ',0)');
  ctx.fillStyle = gg;
  ctx.fillRect(-44, -76, 88, 80);
  ctx.restore();

  // ---- speculars ----
  for (i = 0; i < F.length; i++) {
    f = F[i];
    if (!f.s) continue;
    gx = 0; gy = 0; np = f.p.length;
    for (j = 0; j < np; j++) { gx += f.p[j][0] * fc; gy += f.p[j][1]; }
    gx /= np; gy /= np;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,' + f.s.toFixed(2) + ')';
    ctx.beginPath();
    for (j = 0; j < np; j++) {
      qx = gx + (f.p[j][0] * fc - gx) * 0.28 - 1.3;
      qy = gy + (f.p[j][1] - gy) * 0.28 - 1.5;
      if (j === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- rim light : lower-right contour only ----
  ctx.save();
  ctx.beginPath();
  for (i = 0; i < F.length; i++) addPoly(F[i].p);
  ctx.clip();
  ctx.strokeStyle = 'rgb(253,235,164)';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(RIM[0][0] * fc, RIM[0][1]);
  for (i = 1; i < RIM.length; i++) ctx.lineTo(RIM[i][0] * fc, RIM[i][1]);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/* ───── a2230ff606ca062d8 ───── */
function dvG4(ctx, T) {
  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var BR = 107, BG = 94, BB = 140;
  var DR = 23, DG = 18, DB = 31;
  var t = T / 1000;
  var bob = Math.sin(t * 1.15) * 2.0;
  var pulse = 0.5 + 0.5 * Math.sin(T / 2600 * Math.PI * 2);

  function lamOf(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * LX + n[1] * LY + n[2] * LZ) / m;
    return d > 0 ? Math.pow(d, 2.0) : 0;
  }
  function faceColor(n, c) {
    var br = c ? c[0] : BR, bg = c ? c[1] : BG, bb = c ? c[2] : BB;
    var k = 0.34 + 1.21 * lamOf(n);
    var r, g, b, u;
    if (k <= 1) {
      u = (k - 0.34) / 0.66;
      r = DR + (br - DR) * u; g = DG + (bg - DG) * u; b = DB + (bb - DB) * u;
    } else {
      r = br * k; g = bg * k; b = bb * k;
    }
    return 'rgb(' + Math.round(Math.min(255, r)) + ',' + Math.round(Math.min(255, g)) + ',' + Math.round(Math.min(255, b)) + ')';
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
  }
  function fillPoly(p, style) { poly(p); ctx.fillStyle = style; ctx.fill(); }
  function strokePath(p, style, w) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.strokeStyle = style; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
  }
  function shard(idx, back) {
    var a = idx * 0.7854 + t * 0.36;
    var dep = Math.cos(a);
    if (back ? dep >= 0 : dep < 0) return;
    var sx = 116 + Math.sin(a) * (88 + (idx % 3) * 10);
    var sy = 186 + Math.cos(a * 1.7 + idx) * 58 + Math.sin(t * 0.9 + idx * 1.3) * 7;
    var r = 4 + (idx % 4) * 1.3;
    var rot = t * (0.5 + (idx % 3) * 0.22) + idx;
    var ks = [[0, -1.7], [0.72, -0.2], [0, 1.5], [-0.66, -0.28]];
    var pts = [];
    for (var q = 0; q < 4; q++) {
      var kx = ks[q][0] * r, ky = ks[q][1] * r;
      pts.push([sx + kx * Math.cos(rot) - ky * Math.sin(rot), sy + kx * Math.sin(rot) + ky * Math.cos(rot)]);
    }
    var al = back ? 0.30 : 0.58;
    fillPoly(pts, 'rgba(120,104,166,' + al + ')');
    fillPoly([pts[0], pts[1], pts[2]], 'rgba(206,193,246,' + (al * 0.7) + ')');
  }

  var F = [
    { p: [[194, 216], [204, 222], [200, 274], [190, 270]], n: [0.45, -0.45, 0.77] },
    { p: [[190, 270], [200, 274], [204, 292], [186, 292]], n: [0.38, -0.34, 0.86] },
    { p: [[140, 232], [158, 236], [155, 280], [141, 278]], n: [0.33, -0.42, 0.85] },
    { p: [[141, 278], [155, 280], [160, 292], [136, 292]], n: [0.26, -0.30, 0.92] },
    { p: [[102, 124], [110, 96], [120, 128]], n: [0.05, -0.66, 0.75] },
    { p: [[110, 128], [140, 146], [132, 190], [114, 150]], n: [-0.30, -0.80, 0.52], s: 0.34 },
    { p: [[140, 146], [172, 156], [158, 196], [132, 190]], n: [-0.12, -0.90, 0.42], s: 0.32 },
    { p: [[172, 156], [196, 150], [204, 182], [182, 202], [158, 196]], n: [0.28, -0.84, 0.47] },
    { p: [[100, 200], [132, 190], [136, 226], [104, 238]], n: [-0.36, 0.02, 0.93] },
    { p: [[132, 190], [158, 196], [160, 228], [136, 226]], n: [0.05, -0.25, 0.97] },
    { p: [[158, 196], [182, 202], [180, 230], [160, 228]], n: [0.42, -0.30, 0.86] },
    { p: [[182, 202], [204, 182], [198, 230], [180, 230]], n: [0.68, -0.42, 0.60] },
    { p: [[104, 238], [136, 226], [160, 228], [180, 230], [176, 242], [128, 246]], n: [-0.10, 0.48, 0.87] },
    { p: [[174, 170], [196, 192], [204, 146]], n: [0.55, -0.42, 0.72] },
    { p: [[174, 170], [204, 146], [195, 116]], n: [0.30, -0.70, 0.65] },
    { p: [[204, 146], [195, 116], [202, 110]], n: [0.05, -0.80, 0.60] },
    { p: [[92, 164], [114, 150], [132, 190], [100, 200], [94, 190]], n: [-0.62, -0.30, 0.72] },
    { p: [[152, 202], [198, 216], [194, 248], [154, 242]], n: [0.30, -0.45, 0.84] },
    { p: [[156, 242], [194, 248], [190, 274], [164, 272]], n: [0.40, -0.14, 0.90] },
    { p: [[164, 272], [190, 274], [194, 292], [158, 292]], n: [0.16, 0.06, 0.98] },
    { p: [[78, 136], [102, 124], [120, 128], [114, 150]], n: [-0.18, -0.92, 0.35] },
    { p: [[76, 136], [80, 96], [102, 124]], n: [-0.68, -0.62, 0.39] },
    { p: [[81, 131], [83, 108], [97, 124]], n: [-0.35, 0.25, 0.90] },
    { p: [[78, 136], [114, 150], [92, 164]], n: [-0.55, -0.20, 0.81] },
    { p: [[34, 162], [58, 150], [78, 136], [92, 164]], n: [-0.34, -0.76, 0.55], s: 0.55 },
    { p: [[34, 162], [92, 164], [94, 190], [36, 178]], n: [-0.80, 0.02, 0.60] },
    { p: [[36, 178], [94, 190], [60, 192]], n: [-0.66, 0.52, 0.54] },
    { p: [[84, 146], [95, 143], [90, 154]], n: [0.10, -0.15, 0.98], c: [52, 44, 72] },
    { p: [[48, 175], [55, 176], [51, 189]], n: [-0.50, -0.30, 0.81], c: [168, 164, 182] },
    { p: [[59, 178], [65, 179], [62, 191]], n: [-0.45, -0.15, 0.88], c: [168, 164, 182] },
    { p: [[100, 230], [138, 234], [134, 264], [102, 260]], n: [-0.02, -0.16, 0.99] },
    { p: [[102, 260], [134, 264], [132, 284], [104, 282]], n: [0.10, -0.10, 0.99] },
    { p: [[104, 282], [132, 284], [136, 292], [90, 292]], n: [-0.20, 0.22, 0.95] }
  ];

  var SIL = [[46, 164], [58, 150], [78, 136], [102, 124], [120, 128], [140, 146], [172, 156],
    [196, 150], [204, 182], [198, 230], [176, 242], [128, 246], [104, 238], [94, 190], [50, 184]];
  var RIM1 = [[196, 150], [203, 182], [199, 226], [202, 272], [203, 290]];
  var RIM2 = [[106, 238], [128, 246], [176, 242], [193, 246]];

  var i, k, f, cx, cy, sp;

  ctx.save();

  ctx.fillStyle = 'rgba(9,7,14,0.30)';
  ctx.beginPath();
  ctx.ellipse(118, 299, 70, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4d3a19';
  ctx.beginPath();
  ctx.ellipse(120, 311, 76, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(44, 298, 152, 13);
  var gp = ctx.createLinearGradient(0, 288, 0, 308);
  gp.addColorStop(0, '#f6e3ac');
  gp.addColorStop(0.5, '#c39a44');
  gp.addColorStop(1, '#7a5c26');
  ctx.fillStyle = gp;
  ctx.beginPath();
  ctx.ellipse(120, 298, 76, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(112,96,152,0.30)';
  ctx.beginPath();
  ctx.ellipse(118, 300, 50, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,251,236,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(120, 298, 76, 10, 0, Math.PI * 0.13, Math.PI * 0.87);
  ctx.stroke();

  for (i = 0; i < 8; i++) shard(i, true);

  ctx.save();
  ctx.translate(-9, bob);

  for (i = 0; i < F.length; i++) {
    fillPoly(F[i].p, faceColor(F[i].n, F[i].c));
  }
  for (i = 0; i < F.length; i++) {
    f = F[i];
    if (!f.s) continue;
    cx = 0; cy = 0;
    for (k = 0; k < f.p.length; k++) { cx += f.p[k][0]; cy += f.p[k][1]; }
    cx /= f.p.length; cy /= f.p.length;
    sp = [];
    for (k = 0; k < f.p.length; k++) {
      sp.push([cx + (f.p[k][0] - cx) * 0.30 - 2.0, cy + (f.p[k][1] - cy) * 0.30 - 3.0]);
    }
    fillPoly(sp, 'rgba(255,255,255,' + f.s + ')');
  }

  ctx.save();
  poly(SIL);
  ctx.clip();
  var rg = ctx.createRadialGradient(132, 198, 4, 132, 198, 94);
  rg.addColorStop(0, 'rgba(182,160,238,' + (0.17 + 0.14 * pulse) + ')');
  rg.addColorStop(0.55, 'rgba(148,128,204,' + (0.07 + 0.07 * pulse) + ')');
  rg.addColorStop(1, 'rgba(118,102,168,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(30, 80, 190, 220);
  ctx.restore();

  strokePath(RIM1, 'rgba(198,174,255,0.6)', 2.5);
  strokePath(RIM2, 'rgba(178,156,238,0.4)', 2.2);

  ctx.restore();

  for (i = 0; i < 8; i++) shard(i, false);

  ctx.restore();
}

function dvS4(ctx, col, T, facing) {
  var LX = -0.55, LY = -0.72, LZ = 0.42;
  var BR = 107, BG = 94, BB = 140;
  var DR = 23, DG = 18, DB = 31;
  var bob = Math.sin(T / 2000 * Math.PI * 2) * 1.5;
  var pulse = 0.5 + 0.5 * Math.sin(T / 2600 * Math.PI * 2);
  var dir = facing === -1 ? -1 : 1;

  function hx(h) {
    var s = typeof h === 'string' ? h : '';
    if (s.charAt(0) === '#') s = s.substring(1);
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var v = parseInt(s, 16);
    if (s.length !== 6 || isNaN(v)) return [150, 130, 205];
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function mul(c, k) {
    return 'rgb(' + Math.round(Math.min(255, c[0] * k)) + ',' + Math.round(Math.min(255, c[1] * k)) + ',' + Math.round(Math.min(255, c[2] * k)) + ')';
  }
  function rgba(c, k, a) {
    return 'rgba(' + Math.round(Math.min(255, c[0] * k)) + ',' + Math.round(Math.min(255, c[1] * k)) + ',' + Math.round(Math.min(255, c[2] * k)) + ',' + a + ')';
  }
  function lamOf(n) {
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    var d = (n[0] * LX + n[1] * LY + n[2] * LZ) / m;
    return d > 0 ? Math.pow(d, 1.6) : 0;
  }
  function faceColor(n, c) {
    var br = c ? c[0] : BR, bg = c ? c[1] : BG, bb = c ? c[2] : BB;
    var k = 0.34 + 1.21 * lamOf(n);
    var r, g, b, u;
    if (k <= 1) {
      u = (k - 0.34) / 0.66;
      r = DR + (br - DR) * u; g = DG + (bg - DG) * u; b = DB + (bb - DB) * u;
    } else {
      r = br * k; g = bg * k; b = bb * k;
    }
    return 'rgb(' + Math.round(Math.min(255, r)) + ',' + Math.round(Math.min(255, g)) + ',' + Math.round(Math.min(255, b)) + ')';
  }
  function poly(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
  }
  function fillPoly(p, style) { poly(p); ctx.fillStyle = style; ctx.fill(); }
  function strokePath(p, style, w) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.strokeStyle = style; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
  }

  var C = hx(col);

  var F = [
    { p: [[0, -56], [4, -66], [7, -54]], n: [0.05, -0.66, 0.75] },
    { p: [[1, -47], [8, -52], [9, -34], [2, -32]], n: [-0.30, -0.80, 0.52], s: 0.34 },
    { p: [[8, -52], [15, -49], [15, -32], [9, -34]], n: [-0.10, -0.90, 0.44], s: 0.32 },
    { p: [[15, -49], [20, -45], [21, -33], [20, -30], [15, -32]], n: [0.30, -0.84, 0.46] },
    { p: [[2, -32], [9, -34], [9, -21], [3, -22]], n: [-0.02, -0.22, 0.975] },
    { p: [[9, -34], [15, -32], [20, -30], [18, -21], [9, -21]], n: [0.48, -0.30, 0.82] },
    { p: [[3, -22], [9, -21], [18, -21], [16, -16], [4, -17]], n: [-0.10, 0.48, 0.87] },
    { p: [[16, -36], [21, -28], [22, -44]], n: [0.55, -0.42, 0.72] },
    { p: [[16, -36], [22, -44], [14, -48]], n: [0.26, -0.72, 0.64] },
    { p: [[-4, -40], [1, -47], [2, -32], [-2, -27]], n: [-0.62, -0.30, 0.72] },
    { p: [[-8, -49], [-2, -56], [7, -54], [1, -47]], n: [-0.18, -0.92, 0.35] },
    { p: [[-9, -54], [-9, -67], [-2, -56]], n: [-0.68, -0.62, 0.39] },
    { p: [[-20, -38], [-13, -43], [-8, -49], [-4, -40]], n: [-0.34, -0.76, 0.55], s: 0.55 },
    { p: [[-20, -38], [-4, -40], [-2, -27], [-13, -26]], n: [-0.80, 0.02, 0.60] },
    { p: [[-10, -44], [-5, -43], [-7, -39]], n: [0.10, -0.15, 0.98], c: [52, 44, 72] },
    { p: [[-15, -30], [-11, -29], [-13, -22]], n: [-0.50, -0.30, 0.81], c: [168, 164, 182] },
    { p: [[10, -24], [19, -26], [18, -2], [20, 0], [9, 0], [10, -2]], n: [0.34, -0.16, 0.92] },
    { p: [[-1, -23], [6, -24], [5, -2], [7, 0], [-4, 0], [-2, -2]], n: [-0.12, -0.34, 0.93] }
  ];

  var SIL = [[-17, -35], [-13, -43], [-8, -49], [-2, -56], [7, -54], [15, -49], [20, -45],
    [21, -33], [18, -21], [16, -16], [4, -17], [-2, -27]];
  var RIM1 = [[15, -49], [20, -45], [21, -33], [19, -20], [19, -2]];
  var RIM2 = [[4, -17], [16, -16], [19, -20]];

  var i, k, f, cx, cy, sp;

  ctx.save();

  ctx.fillStyle = 'rgba(8,6,12,0.30)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mul(C, 0.40);
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 19, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  var gp = ctx.createLinearGradient(0, -7, 0, 4);
  gp.addColorStop(0, mul(C, 1.45));
  gp.addColorStop(1, mul(C, 0.70));
  ctx.fillStyle = gp;
  ctx.beginPath();
  ctx.ellipse(0, -1.6, 19, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, -1.6, 19, 5.5, 0, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(dir, 1);

  for (i = 0; i < F.length; i++) {
    fillPoly(F[i].p, faceColor(F[i].n, F[i].c));
  }
  for (i = 0; i < F.length; i++) {
    f = F[i];
    if (!f.s) continue;
    cx = 0; cy = 0;
    for (k = 0; k < f.p.length; k++) { cx += f.p[k][0]; cy += f.p[k][1]; }
    cx /= f.p.length; cy /= f.p.length;
    sp = [];
    for (k = 0; k < f.p.length; k++) {
      sp.push([cx + (f.p[k][0] - cx) * 0.32 - 1.6, cy + (f.p[k][1] - cy) * 0.32 - 2.0]);
    }
    fillPoly(sp, 'rgba(255,255,255,' + f.s + ')');
  }

  ctx.save();
  poly(SIL);
  ctx.clip();
  var rg = ctx.createRadialGradient(6, -34, 1, 6, -34, 26);
  rg.addColorStop(0, rgba(C, 1.7, 0.24 + 0.16 * pulse));
  rg.addColorStop(0.55, rgba(C, 1.25, 0.10 + 0.08 * pulse));
  rg.addColorStop(1, rgba(C, 1.0, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(-24, -70, 50, 74);
  ctx.restore();

  strokePath(RIM1, 'rgba(198,174,255,0.62)', 2.5);
  strokePath(RIM2, 'rgba(178,156,238,0.5)', 1.8);

  ctx.restore();
  ctx.restore();
}
