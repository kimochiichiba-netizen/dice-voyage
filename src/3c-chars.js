/* ══════════════════════════════════════════════
   ダイスボヤージュ — キャラクター8体（自動生成）
   dvP0..dvP7 = 肖像 240x340（左上原点）
   dvT0..dvT7 = 盤上のコマ（接地点原点・上へ72px）
   ══════════════════════════════════════════════ */

/* ───── a69bc3a9e1746d540 ───── */
/* ミオ / 商会のお嬢様 : dvP4 (bust portrait 240x340) + dvT4 (board token) */

function dvP4(ctx, T) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;

  /* ---------- palette (3-tone cel) ---------- */
  var SKIN = '#FDE7DA', SKIN_SH = '#EDC3AC', SKIN_LN = '#C88F76', BLUSH = '#F9A8A8';
  var H_D = '#AE7C1E', H_M = '#EBC154', H_L = '#F8E098', H_H = '#FFF8D2', H_LN = '#7A5711';
  var G_D = '#96670F', G_M = '#EAC45C', G_L = '#FFF3B8';
  var W_B = '#FFFFFF', W_S = '#E1DDEC', W_L = '#A9A3C0';
  var I_D = '#0F5C36', I_M = '#2E9E5F', I_L = '#95EEB4', I_LN = '#08301F';
  var LIP = '#CE7A77', LIP_D = '#A94F52';
  var GEM = '#34C486', GEM_D = '#0F6244', GEM_L = '#D6FFEC';

  var CX = 120;

  /* ---------- deterministic animation from T ---------- */
  var bp = t % 3300, open = 1;
  if (bp < 130) { open = 1 - 0.96 * Math.sin(Math.PI * (bp / 130)); }
  if (open < 0) { open = 0; }
  var sw = Math.sin(t / 820) * 1.9;          /* drill sway */
  var sw2 = Math.sin(t / 820 + 0.9) * 1.2;   /* bang sway  */

  /* ---------- tiny helpers (all local) ---------- */
  function p4ell(x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  function p4lock(ax, ay, c1x, c1y, tx, ty, c2x, c2y, bx, by, f) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(c1x, c1y, tx, ty);
    ctx.quadraticCurveTo(c2x, c2y, bx, by);
    ctx.closePath();
    ctx.fillStyle = f;
    ctx.fill();
  }
  /* draws fn() once as-is (right half) and once x-mirrored -> perfect symmetry */
  function p4both(fn) {
    var s;
    for (s = 1; s >= -1; s -= 2) {
      ctx.save();
      if (s < 0) { ctx.translate(2 * CX, 0); ctx.scale(-1, 1); }
      fn(s);
      ctx.restore();
    }
  }
  /* inverted-egg face outline, symmetric by construction */
  function p4face() {
    ctx.beginPath();
    ctx.moveTo(CX, 52);
    ctx.bezierCurveTo(CX + 30, 52, CX + 44, 76, CX + 44, 108);
    ctx.bezierCurveTo(CX + 44, 134, CX + 35, 152, CX + 17, 168);
    ctx.bezierCurveTo(CX + 10, 173, CX + 5, 175, CX, 175);
    ctx.bezierCurveTo(CX - 5, 175, CX - 10, 173, CX - 17, 168);
    ctx.bezierCurveTo(CX - 35, 152, CX - 44, 134, CX - 44, 108);
    ctx.bezierCurveTo(CX - 44, 76, CX - 30, 52, CX, 52);
    ctx.closePath();
  }
  /* hair helmet: outer silhouette + pointed centre-parted bang edge */
  function p4hair(dy) {
    var d = dy || 0;
    ctx.beginPath();
    ctx.moveTo(CX, 68 + d);
    ctx.quadraticCurveTo(CX + 9, 66 + d, CX + 15, 88 + d);
    ctx.quadraticCurveTo(CX + 21, 76 + d, CX + 29, 99 + d);
    ctx.quadraticCurveTo(CX + 36, 88 + d, CX + 43, 115 + d);
    ctx.quadraticCurveTo(CX + 49, 102 + d, CX + 54, 134 + d);
    ctx.bezierCurveTo(CX + 64, 98 + d, CX + 58, 44 + d, CX + 28, 24 + d);
    ctx.bezierCurveTo(CX + 16, 15 + d, CX - 16, 15 + d, CX - 28, 24 + d);
    ctx.bezierCurveTo(CX - 58, 44 + d, CX - 64, 98 + d, CX - 54, 134 + d);
    ctx.quadraticCurveTo(CX - 49, 102 + d, CX - 43, 115 + d);
    ctx.quadraticCurveTo(CX - 36, 88 + d, CX - 29, 99 + d);
    ctx.quadraticCurveTo(CX - 21, 76 + d, CX - 15, 88 + d);
    ctx.quadraticCurveTo(CX - 9, 66 + d, CX, 68 + d);
    ctx.closePath();
  }

  /* =========================================================
     0. soft contact shadow
     ========================================================= */
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#2B2340';
  p4ell(CX, 334, 86, 16, 0);
  ctx.fill();
  ctx.restore();

  /* =========================================================
     1. back hair mass (behind everything)
     ========================================================= */
  ctx.save();
  var bg = ctx.createLinearGradient(0, 20, 0, 250);
  bg.addColorStop(0, H_D);
  bg.addColorStop(1, '#8E6414');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(CX, 20);
  ctx.bezierCurveTo(CX + 52, 24, CX + 70, 74, CX + 66, 136);
  ctx.bezierCurveTo(CX + 63, 186, CX + 74, 214, CX + 60, 244);
  ctx.lineTo(CX - 60, 244);
  ctx.bezierCurveTo(CX - 74, 214, CX - 63, 186, CX - 66, 136);
  ctx.bezierCurveTo(CX - 70, 74, CX - 52, 24, CX, 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = H_LN;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();

  /* =========================================================
     2. dress / shoulders
     ========================================================= */
  ctx.save();

  /* stand-up collar behind the neck */
  ctx.beginPath();
  ctx.moveTo(CX - 34, 214);
  ctx.bezierCurveTo(CX - 40, 186, CX - 30, 166, CX - 16, 164);
  ctx.lineTo(CX + 16, 164);
  ctx.bezierCurveTo(CX + 30, 166, CX + 40, 186, CX + 34, 214);
  ctx.closePath();
  ctx.fillStyle = W_S;
  ctx.fill();
  ctx.strokeStyle = W_L;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  /* neck */
  ctx.beginPath();
  ctx.moveTo(CX - 13, 160);
  ctx.lineTo(CX - 14, 206);
  ctx.lineTo(CX + 14, 206);
  ctx.lineTo(CX + 13, 160);
  ctx.closePath();
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.strokeStyle = SKIN_LN;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  /* under-chin cast shadow */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX - 14, 160);
  ctx.lineTo(CX + 14, 160);
  ctx.lineTo(CX + 14, 186);
  ctx.quadraticCurveTo(CX, 176, CX - 14, 186);
  ctx.closePath();
  ctx.fillStyle = SKIN_SH;
  ctx.fill();
  ctx.restore();

  /* torso silhouette */
  ctx.beginPath();
  ctx.moveTo(CX - 18, 198);
  ctx.bezierCurveTo(CX - 44, 204, CX - 66, 216, CX - 80, 240);
  ctx.bezierCurveTo(CX - 92, 262, CX - 94, 300, CX - 96, 340);
  ctx.lineTo(CX + 96, 340);
  ctx.bezierCurveTo(CX + 94, 300, CX + 92, 262, CX + 80, 240);
  ctx.bezierCurveTo(CX + 66, 216, CX + 44, 204, CX + 18, 198);
  ctx.closePath();
  var dg = ctx.createLinearGradient(0, 200, 0, 340);
  dg.addColorStop(0, W_B);
  dg.addColorStop(0.55, W_B);
  dg.addColorStop(1, W_S);
  ctx.fillStyle = dg;
  ctx.fill();
  ctx.strokeStyle = W_L;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  /* cel shadow on the dress (one step) */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX - 18, 198);
  ctx.bezierCurveTo(CX - 44, 204, CX - 66, 216, CX - 80, 240);
  ctx.bezierCurveTo(CX - 92, 262, CX - 94, 300, CX - 96, 340);
  ctx.lineTo(CX + 96, 340);
  ctx.bezierCurveTo(CX + 94, 300, CX + 92, 262, CX + 80, 240);
  ctx.bezierCurveTo(CX + 66, 216, CX + 44, 204, CX + 18, 198);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = W_S;
  ctx.beginPath();
  ctx.moveTo(CX - 96, 340);
  ctx.lineTo(CX - 96, 266);
  ctx.bezierCurveTo(CX - 60, 292, CX - 40, 320, CX - 38, 340);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(CX + 96, 340);
  ctx.lineTo(CX + 96, 266);
  ctx.bezierCurveTo(CX + 60, 292, CX + 40, 320, CX + 38, 340);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* decolletage (skin V) */
  ctx.beginPath();
  ctx.moveTo(CX - 30, 202);
  ctx.quadraticCurveTo(CX - 18, 200, CX - 14, 202);
  ctx.lineTo(CX + 14, 202);
  ctx.quadraticCurveTo(CX + 18, 200, CX + 30, 202);
  ctx.quadraticCurveTo(CX + 16, 232, CX, 250);
  ctx.quadraticCurveTo(CX - 16, 232, CX - 30, 202);
  ctx.closePath();
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.strokeStyle = SKIN_LN;
  ctx.lineWidth = 2;
  ctx.stroke();

  /* gold trim along the V */
  ctx.strokeStyle = G_M;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(CX - 32, 200);
  ctx.quadraticCurveTo(CX - 17, 232, CX, 251);
  ctx.quadraticCurveTo(CX + 17, 232, CX + 32, 200);
  ctx.stroke();
  ctx.strokeStyle = G_L;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(CX - 31, 202);
  ctx.quadraticCurveTo(CX - 16, 231, CX, 248);
  ctx.quadraticCurveTo(CX + 16, 231, CX + 31, 202);
  ctx.stroke();
  ctx.restore();

  /* front collar wings + epaulettes (mirrored) */
  p4both(function () {
    ctx.save();
    /* collar wing */
    ctx.beginPath();
    ctx.moveTo(CX + 12, 200);
    ctx.lineTo(CX + 44, 206);
    ctx.lineTo(CX + 30, 232);
    ctx.closePath();
    ctx.fillStyle = W_B;
    ctx.fill();
    ctx.strokeStyle = W_L;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CX + 14, 204);
    ctx.lineTo(CX + 40, 209);
    ctx.strokeStyle = G_M;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    /* epaulette (gold shoulder piece) */
    ctx.beginPath();
    ctx.moveTo(CX + 40, 216);
    ctx.bezierCurveTo(CX + 58, 212, CX + 76, 224, CX + 82, 244);
    ctx.quadraticCurveTo(CX + 72, 238, CX + 64, 248);
    ctx.quadraticCurveTo(CX + 56, 238, CX + 48, 246);
    ctx.quadraticCurveTo(CX + 42, 234, CX + 40, 216);
    ctx.closePath();
    var eg = ctx.createLinearGradient(CX + 40, 212, CX + 76, 250);
    eg.addColorStop(0, G_L);
    eg.addColorStop(0.5, G_M);
    eg.addColorStop(1, G_D);
    ctx.fillStyle = eg;
    ctx.fill();
    ctx.strokeStyle = G_D;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CX + 46, 218);
    ctx.quadraticCurveTo(CX + 62, 218, CX + 72, 230);
    ctx.strokeStyle = G_L;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  /* jewel brooch */
  ctx.save();
  p4ell(CX, 246, 15, 17, 0);
  var brg = ctx.createLinearGradient(CX - 15, 230, CX + 15, 264);
  brg.addColorStop(0, G_L);
  brg.addColorStop(0.55, G_M);
  brg.addColorStop(1, G_D);
  ctx.fillStyle = brg;
  ctx.fill();
  ctx.strokeStyle = G_D;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  p4ell(CX, 246, 8.5, 10.5, 0);
  var gmg = ctx.createLinearGradient(CX, 236, CX, 257);
  gmg.addColorStop(0, GEM_D);
  gmg.addColorStop(0.5, GEM);
  gmg.addColorStop(1, GEM_L);
  ctx.fillStyle = gmg;
  ctx.fill();
  ctx.strokeStyle = GEM_D;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#FFFFFF';
  p4ell(CX - 3, 241, 2.6, 3.4, -0.4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  /* gold bodice lacing + lace hem, so the lower third is not empty */
  ctx.save();
  var k, y0, y1, w0, w1;
  ctx.lineCap = 'round';
  /* corset centre panel */
  ctx.beginPath();
  ctx.moveTo(CX - 17, 262);
  ctx.lineTo(CX + 17, 262);
  ctx.lineTo(CX + 23, 340);
  ctx.lineTo(CX - 23, 340);
  ctx.closePath();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = W_S;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = G_M;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  /* X lacing */
  ctx.strokeStyle = G_D;
  ctx.lineWidth = 2;
  for (k = 0; k < 4; k++) {
    y0 = 272 + k * 18;
    y1 = y0 + 14;
    w0 = 12 + k * 1.6;
    w1 = 13.4 + k * 1.6;
    ctx.beginPath();
    ctx.moveTo(CX - w0, y0);
    ctx.lineTo(CX + w1, y1);
    ctx.moveTo(CX + w0, y0);
    ctx.lineTo(CX - w1, y1);
    ctx.stroke();
  }
  /* lace frill across the bust line */
  ctx.beginPath();
  ctx.moveTo(CX - 78, 268);
  for (k = 0; k < 12; k++) {
    ctx.quadraticCurveTo(CX - 78 + k * 13 + 6.5, 282, CX - 78 + (k + 1) * 13, 268);
  }
  ctx.strokeStyle = W_L;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();

  /* =========================================================
     3. face
     ========================================================= */
  ctx.save();
  p4face();
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.strokeStyle = SKIN_LN;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  /* cel shading inside the face */
  ctx.save();
  p4face();
  ctx.clip();
  /* bang cast shadow on the forehead */
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = SKIN_SH;
  p4hair(8);
  ctx.fill();
  /* jaw / cheek side shadow */
  ctx.globalAlpha = 0.35;
  p4both(function () {
    ctx.beginPath();
    ctx.moveTo(CX + 48, 90);
    ctx.quadraticCurveTo(CX + 40, 130, CX + 20, 168);
    ctx.lineTo(CX + 48, 178);
    ctx.closePath();
    ctx.fillStyle = SKIN_SH;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  /* ears (mirrored) */
  p4both(function () {
    ctx.beginPath();
    ctx.moveTo(CX + 42, 110);
    ctx.quadraticCurveTo(CX + 55, 112, CX + 52, 128);
    ctx.quadraticCurveTo(CX + 48, 138, CX + 40, 134);
    ctx.closePath();
    ctx.fillStyle = SKIN;
    ctx.fill();
    ctx.strokeStyle = SKIN_LN;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CX + 45, 116);
    ctx.quadraticCurveTo(CX + 50, 120, CX + 47, 128);
    ctx.strokeStyle = SKIN_SH;
    ctx.lineWidth = 2;
    ctx.stroke();
    /* gold drop earring */
    ctx.beginPath();
    ctx.moveTo(CX + 47, 134);
    ctx.lineTo(CX + 47, 142);
    ctx.strokeStyle = G_M;
    ctx.lineWidth = 2;
    ctx.stroke();
    p4ell(CX + 47, 147, 4, 5.4, 0);
    ctx.fillStyle = G_M;
    ctx.fill();
    ctx.strokeStyle = G_D;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = G_L;
    p4ell(CX + 45.6, 145, 1.2, 1.8, 0);
    ctx.fill();
  });

  /* blush */
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = BLUSH;
  p4both(function () {
    p4ell(CX + 29, 142, 13, 7.5, -0.12);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  /* nose : a 2px tick only */
  ctx.save();
  ctx.strokeStyle = SKIN_LN;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(CX + 3, 139);
  ctx.lineTo(CX + 0.5, 144);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  /* mouth : small confident smile */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX - 7, 155);
  ctx.quadraticCurveTo(CX, 154, CX + 7, 155);
  ctx.quadraticCurveTo(CX + 2, 163, CX, 163);
  ctx.quadraticCurveTo(CX - 2, 163, CX - 7, 155);
  ctx.closePath();
  ctx.fillStyle = LIP_D;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(CX - 5.4, 155.6);
  ctx.quadraticCurveTo(CX, 155, CX + 5.4, 155.6);
  ctx.quadraticCurveTo(CX, 158, CX - 5.4, 155.6);
  ctx.closePath();
  ctx.fillStyle = '#FFF6F4';
  ctx.fill();
  ctx.strokeStyle = LIP;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(CX - 9, 153.4);
  ctx.quadraticCurveTo(CX, 155.6, CX + 9, 153.4);
  ctx.stroke();
  ctx.restore();

  /* eyebrows (mirrored) */
  p4both(function () {
    ctx.beginPath();
    ctx.moveTo(CX + 8, 90);
    ctx.quadraticCurveTo(CX + 21, 77, CX + 34, 83);
    ctx.strokeStyle = '#B07F22';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.stroke();
  });

  /* eyes (mirrored, blink by squashing onto the lower lid) */
  p4both(function () {
    var ICX = CX + 10.5, ICY = 119;   /* inner corner */
    var OCX = CX + 32, OCY = 107;     /* outer corner */
    var PIV = 124;                    /* blink pivot = lower lid */

    ctx.save();
    ctx.translate(0, PIV);
    ctx.scale(1, open);
    ctx.translate(0, -PIV);

    /* eye socket path */
    function socket() {
      ctx.beginPath();
      ctx.moveTo(ICX, ICY);
      ctx.quadraticCurveTo(CX + 19, 87, OCX, OCY);
      ctx.quadraticCurveTo(CX + 20, 144, ICX, ICY);
      ctx.closePath();
    }

    /* white of the eye */
    socket();
    ctx.fillStyle = '#FDFCFF';
    ctx.fill();

    /* iris, clipped to the socket */
    ctx.save();
    socket();
    ctx.clip();
    var icx = CX + 20.5, icy = 113;
    p4ell(icx, icy, 10, 13.2, 0);
    var ig = ctx.createLinearGradient(icx, icy - 13, icx, icy + 13);
    ig.addColorStop(0, I_D);
    ig.addColorStop(0.45, I_M);
    ig.addColorStop(1, I_L);
    ctx.fillStyle = ig;
    ctx.fill();
    /* upper darkening inside the iris */
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = I_LN;
    ctx.beginPath();
    ctx.ellipse(icx, icy - 6.5, 10, 6.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    /* pupil */
    p4ell(icx, icy + 0.6, 4.4, 5.9, 0);
    ctx.fillStyle = '#10241C';
    ctx.fill();
    /* iris rim */
    p4ell(icx, icy, 10, 13.2, 0);
    ctx.strokeStyle = I_LN;
    ctx.lineWidth = 2;
    ctx.stroke();
    /* big highlight (upper-left of the iris) */
    ctx.fillStyle = '#FFFFFF';
    p4ell(icx - 3.6, icy - 5.4, 3.9, 4.3, -0.3);
    ctx.fill();
    /* small highlight (lower-right) */
    ctx.globalAlpha = 0.9;
    p4ell(icx + 4.4, icy + 6.2, 1.8, 2, 0);
    ctx.fill();
    ctx.globalAlpha = 1;
    /* light bounce along the bottom rim */
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = I_L;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(icx, icy, 9, 0.35 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();

    /* upper lid : thin at the inner side, thick at the outer side */
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4A2E2A';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(ICX, ICY);
    ctx.quadraticCurveTo(CX + 19, 87, OCX, OCY);
    ctx.stroke();
    ctx.lineWidth = 5.2;
    ctx.beginPath();
    ctx.moveTo(CX + 20, 99.6);
    ctx.quadraticCurveTo(CX + 27, 98, OCX, OCY);
    ctx.stroke();

    /* lower lid : thin, outer third only */
    ctx.strokeStyle = '#9A6A5C';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CX + 18, 126.8);
    ctx.quadraticCurveTo(CX + 27, 121, OCX, OCY + 1);
    ctx.stroke();

    /* lashes at the outer corner */
    ctx.strokeStyle = '#4A2E2A';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(OCX - 2, OCY + 1);
    ctx.quadraticCurveTo(CX + 37, 102, CX + 40, 98);
    ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(OCX - 4, OCY + 3);
    ctx.quadraticCurveTo(CX + 35, 106, CX + 38, 104);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(OCX - 6, OCY + 5);
    ctx.quadraticCurveTo(CX + 32, 110, CX + 35, 109);
    ctx.stroke();

    ctx.restore();

    /* closed-eye line while blinking */
    if (open < 0.5) {
      ctx.save();
      ctx.globalAlpha = 1 - open * 2;
      ctx.strokeStyle = '#4A2E2A';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(CX + 9, 121);
      ctx.quadraticCurveTo(CX + 21, 127, CX + 32, 118);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  });
  ctx.restore();

  /* =========================================================
     4. front hair
     ========================================================= */
  ctx.save();
  p4hair(0);
  var hg = ctx.createLinearGradient(0, 18, 0, 138);
  hg.addColorStop(0, H_D);
  hg.addColorStop(0.45, H_M);
  hg.addColorStop(1, H_L);
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = H_LN;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.stroke();

  /* strands + light band, clipped inside the helmet */
  ctx.save();
  p4hair(0);
  ctx.clip();

  p4both(function () {
    /* shadow strands (darker) */
    p4lock(CX + 2, 40, CX + 34, 46, CX + 44 + sw2, 114,
           CX + 24, 76, CX + 2, 58, H_D);
    p4lock(CX + 20, 30, CX + 52, 52, CX + 56 + sw2, 122,
           CX + 44, 74, CX + 22, 46, H_D);
    /* light strands */
    p4lock(CX + 4, 46, CX + 24, 56, CX + 27 + sw2, 102,
           CX + 16, 74, CX + 4, 60, H_L);
    p4lock(CX + 30, 34, CX + 50, 58, CX + 50 + sw2, 108,
           CX + 42, 72, CX + 30, 48, H_L);
    /* crown separation line */
    ctx.beginPath();
    ctx.moveTo(CX + 1, 34);
    ctx.quadraticCurveTo(CX + 26, 52, CX + 40, 108);
    ctx.strokeStyle = H_D;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  /* one wavy light band across the top */
  var lb = ctx.createLinearGradient(CX - 46, 0, CX + 48, 0);
  lb.addColorStop(0, 'rgba(255,248,210,0)');
  lb.addColorStop(0.5, 'rgba(255,248,210,0.8)');
  lb.addColorStop(1, 'rgba(255,248,210,0)');
  ctx.fillStyle = lb;
  ctx.beginPath();
  ctx.moveTo(CX - 46, 62);
  ctx.bezierCurveTo(CX - 28, 40, CX + 28, 40, CX + 48, 58);
  ctx.lineTo(CX + 48, 69);
  ctx.bezierCurveTo(CX + 28, 51, CX - 28, 51, CX - 46, 73);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();

  /* =========================================================
     5. drills (縦ロール) + gold hair ornaments
     ========================================================= */
  p4both(function () {
    var i, cx, cy, r, ry;
    ctx.save();

    /* side lock running from the temple into the drill */
    p4lock(CX + 26, 60, CX + 62, 74, CX + 68, 150,
           CX + 56, 108, CX + 40, 74, H_M);

    /* backing cone so no gaps show through */
    ctx.beginPath();
    ctx.moveTo(CX + 44, 112);
    ctx.bezierCurveTo(CX + 76, 122, CX + 86, 190, CX + 76 + sw, 262);
    ctx.quadraticCurveTo(CX + 68 + sw, 278, CX + 62 + sw, 256);
    ctx.bezierCurveTo(CX + 64, 196, CX + 52, 150, CX + 40, 124);
    ctx.closePath();
    ctx.fillStyle = H_D;
    ctx.fill();
    ctx.strokeStyle = H_LN;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    for (i = 0; i < 7; i++) {
      r = 23 - i * 1.5;
      ry = r * 0.62;
      cx = CX + 68 + i * 1.4 + sw * (0.25 + i * 0.2);
      cy = 138 + i * 21;

      /* dark separation behind each coil */
      ctx.save();
      p4ell(cx - 1, cy + 3, r + 1.6, ry + 1.6, 0.2);
      ctx.fillStyle = H_LN;
      ctx.fill();
      ctx.restore();

      /* coil body */
      p4ell(cx, cy, r, ry, 0.2);
      var cg = ctx.createLinearGradient(cx - r * 0.7, cy - ry, cx + r * 0.5, cy + ry);
      cg.addColorStop(0, H_H);
      cg.addColorStop(0.35, H_L);
      cg.addColorStop(0.72, H_M);
      cg.addColorStop(1, H_D);
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.strokeStyle = H_LN;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      /* crescent shadow on the coil's underside */
      ctx.save();
      p4ell(cx, cy, r, ry, 0.2);
      ctx.clip();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = H_D;
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.1, cy + ry * 0.85, r * 1.05, ry * 0.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      /* spiral highlight sweeping over the top-left of each coil */
      ctx.save();
      ctx.strokeStyle = H_H;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2.8 - i * 0.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.62, ry * 0.55, 0.2, Math.PI * 0.9, Math.PI * 1.75);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    /* gold ribbon-clip where the drill starts */
    ctx.save();
    ctx.translate(CX + 50, 96);
    ctx.rotate(0.34);
    ctx.beginPath();
    ctx.moveTo(-20, -2);
    ctx.quadraticCurveTo(-11, -15, 0, -4.5);
    ctx.quadraticCurveTo(11, -15, 20, -2);
    ctx.quadraticCurveTo(11, 12, 0, 4.5);
    ctx.quadraticCurveTo(-11, 12, -20, -2);
    ctx.closePath();
    var rg = ctx.createLinearGradient(-20, -12, 20, 12);
    rg.addColorStop(0, G_L);
    rg.addColorStop(0.5, G_M);
    rg.addColorStop(1, G_D);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = G_D;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, -3);
    ctx.quadraticCurveTo(-9, -9, -4, -4);
    ctx.strokeStyle = G_L;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    p4ell(0, 0, 5, 5, 0);
    var rgg = ctx.createLinearGradient(0, -5, 0, 5);
    rgg.addColorStop(0, GEM_L);
    rgg.addColorStop(0.5, GEM);
    rgg.addColorStop(1, GEM_D);
    ctx.fillStyle = rgg;
    ctx.fill();
    ctx.strokeStyle = GEM_D;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  });

  /* small gold tiara at the crown */
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  /* small spikes, under the band */
  p4both(function () {
    ctx.beginPath();
    ctx.moveTo(CX + 6, 46);
    ctx.lineTo(CX + 10, 37);
    ctx.lineTo(CX + 14, 47);
    ctx.closePath();
    ctx.moveTo(CX + 20, 50);
    ctx.lineTo(CX + 24, 42);
    ctx.lineTo(CX + 28, 51);
    ctx.closePath();
    ctx.fillStyle = G_M;
    ctx.fill();
    ctx.strokeStyle = G_D;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  });
  /* slim circlet band */
  ctx.strokeStyle = G_D;
  ctx.lineWidth = 5.6;
  ctx.beginPath();
  ctx.moveTo(CX - 36, 55);
  ctx.quadraticCurveTo(CX, 32, CX + 36, 55);
  ctx.stroke();
  ctx.strokeStyle = G_M;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(CX - 36, 55);
  ctx.quadraticCurveTo(CX, 32, CX + 36, 55);
  ctx.stroke();
  ctx.strokeStyle = G_L;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(CX - 29, 51);
  ctx.quadraticCurveTo(CX, 35, CX + 29, 51);
  ctx.stroke();
  p4ell(CX, 37, 5.2, 5.8, 0);
  var tgg = ctx.createLinearGradient(CX, 31, CX, 43);
  tgg.addColorStop(0, GEM_L);
  tgg.addColorStop(0.5, GEM);
  tgg.addColorStop(1, GEM_D);
  ctx.fillStyle = tgg;
  ctx.fill();
  ctx.strokeStyle = GEM_D;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.85;
  p4ell(CX - 1.6, 34.6, 1.5, 1.9, -0.4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}


function dvT4(ctx, col, T, facing) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;
  var c = (typeof col === 'string' && col.charAt(0) === '#') ? col : '#E0566B';
  var f = (facing === -1) ? -1 : 1;

  var SKIN = '#FDE7DA', SKIN_LN = '#C88F76';
  var H_D = '#AE7C1E', H_M = '#EBC154', H_L = '#F8E098', H_LN = '#7A5711';
  var G_M = '#EAC45C', G_D = '#96670F';
  var W_B = '#FFFFFF', W_S = '#E1DDEC', W_L = '#A9A3C0';

  /* hex -> shaded hex (k<1 darker, k>1 lighter) */
  function t4sh(hex, k) {
    var h = hex.replace('#', ''), i, v = [0, 0, 0], o = '#';
    if (h.length === 3) { h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    for (i = 0; i < 3; i++) {
      v[i] = parseInt(h.substr(i * 2, 2), 16);
      if (!isFinite(v[i])) { v[i] = 128; }
      v[i] = Math.max(0, Math.min(255, Math.round(v[i] * k)));
      o += (v[i] < 16 ? '0' : '') + v[i].toString(16);
    }
    return o;
  }
  function t4ell(x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  function t4both(fn) {
    var s;
    for (s = 1; s >= -1; s -= 2) {
      ctx.save();
      ctx.scale(s, 1);
      fn(s);
      ctx.restore();
    }
  }

  var cD = t4sh(c, 0.62);
  var bob = Math.sin(t * Math.PI / 1000) * 1.5;

  /* ground shadow (never bobs) */
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = '#241A2E';
  t4ell(0, 0, 15, 4.6, 0);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.save();
  ctx.scale(f, 1);
  ctx.translate(0, bob);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  /* back hair */
  ctx.beginPath();
  ctx.moveTo(0, -66);
  ctx.bezierCurveTo(16, -66, 20, -50, 18, -34);
  ctx.lineTo(-18, -34);
  ctx.bezierCurveTo(-20, -50, -16, -66, 0, -66);
  ctx.closePath();
  ctx.fillStyle = H_D;
  ctx.fill();
  ctx.strokeStyle = H_LN;
  ctx.lineWidth = 2;
  ctx.stroke();

  /* legs */
  t4both(function () {
    ctx.beginPath();
    ctx.moveTo(3, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(8, -2);
    ctx.lineTo(2.5, -2);
    ctx.closePath();
    ctx.fillStyle = SKIN;
    ctx.fill();
    ctx.strokeStyle = SKIN_LN;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1.6, -3.5);
    ctx.lineTo(9.2, -3.5);
    ctx.quadraticCurveTo(10.4, 0, 6, 0);
    ctx.lineTo(1.6, 0);
    ctx.closePath();
    ctx.fillStyle = G_M;
    ctx.fill();
    ctx.strokeStyle = G_D;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });

  /* skirt */
  ctx.beginPath();
  ctx.moveTo(-7, -27);
  ctx.bezierCurveTo(-13, -20, -16, -13, -16, -6);
  ctx.quadraticCurveTo(-8, -2, 0, -3);
  ctx.quadraticCurveTo(8, -2, 16, -6);
  ctx.bezierCurveTo(16, -13, 13, -20, 7, -27);
  ctx.closePath();
  var sg = ctx.createLinearGradient(0, -27, 0, -3);
  sg.addColorStop(0, W_B);
  sg.addColorStop(1, W_S);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = W_L;
  ctx.lineWidth = 2;
  ctx.stroke();
  /* player-colour hem band */
  ctx.beginPath();
  ctx.moveTo(-15.6, -8.4);
  ctx.quadraticCurveTo(-8, -4.2, 0, -5.2);
  ctx.quadraticCurveTo(8, -4.2, 15.6, -8.4);
  ctx.lineTo(16, -6);
  ctx.quadraticCurveTo(8, -2, 0, -3);
  ctx.quadraticCurveTo(-8, -2, -16, -6);
  ctx.closePath();
  ctx.fillStyle = c;
  ctx.fill();
  ctx.strokeStyle = cD;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  /* arms */
  t4both(function () {
    ctx.beginPath();
    ctx.moveTo(7, -36);
    ctx.quadraticCurveTo(13, -33, 13, -25);
    ctx.strokeStyle = W_B;
    ctx.lineWidth = 5.4;
    ctx.stroke();
    ctx.strokeStyle = W_L;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(9.6, -35.6);
    ctx.quadraticCurveTo(15.4, -33, 15.4, -25.6);
    ctx.stroke();
    t4ell(13, -22.6, 3, 3.2, 0);
    ctx.fillStyle = SKIN;
    ctx.fill();
    ctx.strokeStyle = SKIN_LN;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });

  /* bodice */
  ctx.beginPath();
  ctx.moveTo(-9, -39);
  ctx.quadraticCurveTo(-10, -32, -7, -26);
  ctx.lineTo(7, -26);
  ctx.quadraticCurveTo(10, -32, 9, -39);
  ctx.closePath();
  ctx.fillStyle = W_B;
  ctx.fill();
  ctx.strokeStyle = W_L;
  ctx.lineWidth = 2;
  ctx.stroke();
  /* player-colour sash + gold trim */
  ctx.beginPath();
  ctx.moveTo(-9.2, -30);
  ctx.lineTo(9.2, -30);
  ctx.lineTo(8, -25.6);
  ctx.lineTo(-8, -25.6);
  ctx.closePath();
  ctx.fillStyle = c;
  ctx.fill();
  ctx.strokeStyle = cD;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  t4ell(0, -27.8, 2.2, 2.2, 0);
  ctx.fillStyle = G_M;
  ctx.fill();
  ctx.strokeStyle = G_D;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  /* collar */
  ctx.beginPath();
  ctx.moveTo(-6, -39);
  ctx.lineTo(0, -33);
  ctx.lineTo(6, -39);
  ctx.strokeStyle = G_M;
  ctx.lineWidth = 2;
  ctx.stroke();

  /* neck */
  ctx.beginPath();
  ctx.moveTo(-3.4, -42);
  ctx.lineTo(-3.4, -37);
  ctx.lineTo(3.4, -37);
  ctx.lineTo(3.4, -42);
  ctx.closePath();
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.strokeStyle = SKIN_LN;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  /* head */
  t4ell(0, -52, 13, 13.4, 0);
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.strokeStyle = SKIN_LN;
  ctx.lineWidth = 2;
  ctx.stroke();

  /* eyes + mouth only */
  t4both(function () {
    t4ell(5, -52.4, 2.7, 3.6, 0);
    var eg = ctx.createLinearGradient(5, -56, 5, -49);
    eg.addColorStop(0, '#0F5C36');
    eg.addColorStop(1, '#77DC9C');
    ctx.fillStyle = eg;
    ctx.fill();
    ctx.strokeStyle = '#3A2622';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    t4ell(4, -54, 1.1, 1.3, 0);
    ctx.fill();
  });
  ctx.strokeStyle = '#B76A66';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2, -46.4);
  ctx.quadraticCurveTo(0, -44.6, 2, -46.4);
  ctx.stroke();

  /* front hair : centre-parted bangs with pointed tips */
  ctx.beginPath();
  ctx.moveTo(0, -46);
  ctx.quadraticCurveTo(2, -47.6, 3.6, -43.6);
  ctx.quadraticCurveTo(6, -47, 8.6, -41.6);
  ctx.quadraticCurveTo(11.6, -45, 13.4, -39.6);
  ctx.bezierCurveTo(16.6, -50, 12, -66, 0, -66);
  ctx.bezierCurveTo(-12, -66, -16.6, -50, -13.4, -39.6);
  ctx.quadraticCurveTo(-11.6, -45, -8.6, -41.6);
  ctx.quadraticCurveTo(-6, -47, -3.6, -43.6);
  ctx.quadraticCurveTo(-2, -47.6, 0, -46);
  ctx.closePath();
  var thg = ctx.createLinearGradient(0, -67, 0, -40);
  thg.addColorStop(0, H_D);
  thg.addColorStop(0.5, H_M);
  thg.addColorStop(1, H_L);
  ctx.fillStyle = thg;
  ctx.fill();
  ctx.strokeStyle = H_LN;
  ctx.lineWidth = 2;
  ctx.stroke();
  /* light band */
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = '#FFF8D2';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-8, -57);
  ctx.quadraticCurveTo(0, -62.5, 8, -57.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  /* drills : the silhouette that says "ミオ" */
  t4both(function () {
    var i, cx, cy, r;
    for (i = 0; i < 4; i++) {
      r = 6.6 - i * 0.9;
      cx = 15.5 + i * 0.5;
      cy = -50 + i * 6.4;
      t4ell(cx, cy, r, r * 0.62, 0.2);
      var dg = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.5, cy + r);
      dg.addColorStop(0, '#FFF8D2');
      dg.addColorStop(0.4, H_L);
      dg.addColorStop(1, H_D);
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.strokeStyle = H_LN;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    /* gold clip at the drill root */
    t4ell(12, -56.6, 3.6, 2.4, -0.5);
    ctx.fillStyle = G_M;
    ctx.fill();
    ctx.strokeStyle = G_D;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });

  ctx.restore();
}

/* ───── a46a95df4a15928fd ───── */
function dvP3(ctx, T) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;

  /* ---------- palette ---------- */
  var SK = '#FDE7DA', SKS = '#EDC3AC', SKO = '#C0866A', BLU = '#F9A8A8';
  var HR = '#D6392F', HRD = '#8B1E1B', HRL = '#F4735C', HRB = '#FFAF92', HRO = '#611310';
  var LSH = '#4A1410';
  var AR = '#A83028', ARS = '#78201C', ARL = '#C9564A', ARO = '#4E100F';
  var SC = '#2F2C35', SCS = '#1B1920', SCL = '#4C4855', SCO = '#100E15';
  var GD = '#DCB463', GDS = '#A57C2C';
  var LTH = '#4B3126';

  /* ---------- geometry ---------- */
  var FCX = 120, FTOP = 52, FH = 123, FCHIN = FTOP + FH;   /* chin = 175 */
  var EYY = FTOP + Math.round(FH * 0.52);                  /* eye line = 116 */
  var EYX = 25;

  /* ---------- animation, derived from T only ---------- */
  var bc = t % 3600, open = 1;
  if (bc < 60) { open = 1 - bc / 60; }
  else if (bc < 130) { open = (bc - 60) / 70; }
  if (open < 0) open = 0;
  if (open > 1) open = 1;
  var sway = Math.sin(t / 820) * 1.9 + Math.sin(t / 430) * 0.7;
  var swayS = Math.sin(t / 1100) * 2.6;

  /* ---------- local helpers ---------- */
  function p3sp(ax, ay, c1x, c1y, tx, ty, c2x, c2y, bx, by) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(c1x, c1y, tx, ty);
    ctx.quadraticCurveTo(c2x, c2y, bx, by);
    ctx.closePath();
  }
  function p3facePath() {
    ctx.beginPath();
    ctx.moveTo(FCX, FTOP);
    ctx.bezierCurveTo(FCX + 34, FTOP, FCX + 53, FTOP + 30, FCX + 53, FTOP + 50);
    ctx.bezierCurveTo(FCX + 53, FTOP + 74, FCX + 42, FTOP + 94, FCX + 26, FTOP + 109);
    ctx.bezierCurveTo(FCX + 19, FTOP + 118, FCX + 10, FCHIN, FCX, FCHIN);
    ctx.bezierCurveTo(FCX - 10, FCHIN, FCX - 19, FTOP + 118, FCX - 26, FTOP + 109);
    ctx.bezierCurveTo(FCX - 42, FTOP + 94, FCX - 53, FTOP + 74, FCX - 53, FTOP + 50);
    ctx.bezierCurveTo(FCX - 53, FTOP + 30, FCX - 34, FTOP, FCX, FTOP);
    ctx.closePath();
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  /* ============ 0. ground shadow ============ */
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#2B1B22';
  ctx.beginPath();
  ctx.ellipse(120, 331, 92, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* ============ 1. back hair ============ */
  ctx.save();
  var gBack = ctx.createLinearGradient(0, 14, 0, 150);
  gBack.addColorStop(0, HRL);
  gBack.addColorStop(0.45, HR);
  gBack.addColorStop(1, HRD);
  ctx.fillStyle = gBack;
  ctx.strokeStyle = HRO;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(58, 150);
  ctx.bezierCurveTo(46, 116, 48, 70, 78, 48);
  ctx.bezierCurveTo(104, 28, 142, 30, 164, 50);
  ctx.bezierCurveTo(190, 72, 190, 116, 182, 150);
  ctx.bezierCurveTo(176, 126, 176, 96, 166, 78);
  ctx.bezierCurveTo(150, 54, 92, 54, 74, 78);
  ctx.bezierCurveTo(64, 96, 64, 126, 58, 150);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  var spikes = [
    [72, 62, 52, 40, 44, 20, 74, 44, 96, 44],
    [92, 50, 92, 30, 84, 18, 116, 32, 122, 44],
    [118, 44, 128, 28, 146, 19, 138, 36, 150, 46],
    [146, 46, 168, 30, 188, 30, 166, 44, 172, 60],
    [166, 58, 190, 56, 204, 74, 180, 66, 184, 84],
    [70, 74, 44, 66, 32, 80, 58, 78, 60, 92]
  ];
  for (var si = 0; si < spikes.length; si++) {
    var sp = spikes[si];
    var wgt = (100 - sp[5]) / 90;
    if (wgt < 0) wgt = 0;
    p3sp(sp[0], sp[1], sp[2] + sway * wgt, sp[3], sp[4] + sway * 1.6 * wgt, sp[5],
      sp[6] + sway * wgt, sp[7], sp[8], sp[9]);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  /* ============ 2. standing collar, behind the neck ============ */
  ctx.save();
  ctx.strokeStyle = ARO;
  ctx.lineWidth = 2.4;
  for (var cs = -1; cs <= 1; cs += 2) {
    ctx.save();
    ctx.translate(FCX, 0);
    ctx.scale(cs, 1);
    ctx.fillStyle = ARS;
    ctx.beginPath();
    ctx.moveTo(-16, 216);
    ctx.lineTo(-40, 172);
    ctx.quadraticCurveTo(-26, 162, -8, 170);
    ctx.lineTo(-6, 216);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  /* ============ 3. neck ============ */
  ctx.save();
  ctx.fillStyle = SK;
  ctx.strokeStyle = SKO;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(103, 148);
  ctx.lineTo(100, 200);
  ctx.lineTo(140, 200);
  ctx.lineTo(137, 148);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(100, 150);
  ctx.lineTo(100, 200);
  ctx.lineTo(140, 200);
  ctx.lineTo(140, 150);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = SKS;
  ctx.beginPath();
  ctx.moveTo(96, 150);
  ctx.quadraticCurveTo(120, 190, 144, 150);
  ctx.lineTo(144, 144);
  ctx.lineTo(96, 144);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();

  /* ============ 4. torso, red leather armour ============ */
  ctx.save();
  ctx.fillStyle = SCS;
  ctx.beginPath();
  ctx.moveTo(96, 198);
  ctx.quadraticCurveTo(62, 210, 44, 246);
  ctx.quadraticCurveTo(32, 270, 30, 340);
  ctx.lineTo(210, 340);
  ctx.quadraticCurveTo(208, 270, 196, 246);
  ctx.quadraticCurveTo(178, 210, 144, 198);
  ctx.closePath();
  ctx.fill();

  var gBody = ctx.createLinearGradient(0, 210, 0, 340);
  gBody.addColorStop(0, ARL);
  gBody.addColorStop(0.35, AR);
  gBody.addColorStop(1, ARS);
  ctx.strokeStyle = ARO;
  ctx.lineWidth = 2.6;
  for (var bs = -1; bs <= 1; bs += 2) {
    ctx.save();
    ctx.translate(FCX, 0);
    ctx.scale(bs, 1);
    ctx.fillStyle = gBody;
    ctx.beginPath();
    ctx.moveTo(-8, 212);
    ctx.quadraticCurveTo(-40, 216, -60, 248);
    ctx.quadraticCurveTo(-76, 274, -78, 340);
    ctx.lineTo(-12, 340);
    ctx.quadraticCurveTo(-10, 292, -6, 262);
    ctx.lineTo(-8, 212);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = ARL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, 232);
    ctx.quadraticCurveTo(-50, 258, -54, 336);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  ctx.fillStyle = LTH;
  ctx.strokeStyle = '#2C1A12';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(104, 236);
  ctx.lineTo(136, 236);
  ctx.lineTo(134, 340);
  ctx.lineTo(106, 340);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GD;
  ctx.strokeStyle = GDS;
  ctx.lineWidth = 1.6;
  for (var st = 0; st < 3; st++) {
    ctx.beginPath();
    ctx.arc(120, 258 + st * 30, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  /* ============ 5. pauldrons ============ */
  ctx.save();
  var gPa = ctx.createLinearGradient(0, 216, 0, 276);
  gPa.addColorStop(0, ARL);
  gPa.addColorStop(0.5, AR);
  gPa.addColorStop(1, ARS);
  for (var ps = -1; ps <= 1; ps += 2) {
    ctx.save();
    ctx.translate(FCX, 0);
    ctx.scale(ps, 1);
    ctx.fillStyle = gPa;
    ctx.strokeStyle = ARO;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-88, 250);
    ctx.quadraticCurveTo(-99, 268, -89, 285);
    ctx.quadraticCurveTo(-62, 293, -46, 278);
    ctx.quadraticCurveTo(-40, 262, -43, 248);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = GD;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-88, 282);
    ctx.quadraticCurveTo(-63, 290, -47, 275);
    ctx.stroke();
    ctx.strokeStyle = ARO;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-46, 214);
    ctx.quadraticCurveTo(-84, 221, -92, 249);
    ctx.quadraticCurveTo(-72, 261, -42, 253);
    ctx.quadraticCurveTo(-36, 232, -46, 214);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = ARL;
    ctx.beginPath();
    ctx.moveTo(-50, 218);
    ctx.quadraticCurveTo(-78, 226, -84, 245);
    ctx.quadraticCurveTo(-68, 233, -46, 229);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = GD;
    ctx.strokeStyle = GDS;
    ctx.lineWidth = 1.4;
    for (var rv = 0; rv < 3; rv++) {
      ctx.beginPath();
      ctx.arc(-78 + rv * 13, 234 + rv * 5, 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();

  /* ============ 6. black scarf, drawn over the pauldron ============ */
  ctx.save();
  ctx.strokeStyle = SCO;
  ctx.lineWidth = 2.6;
  var gScarf = ctx.createLinearGradient(0, 184, 0, 232);
  gScarf.addColorStop(0, SCL);
  gScarf.addColorStop(0.4, SC);
  gScarf.addColorStop(1, SCS);
  ctx.fillStyle = gScarf;
  ctx.beginPath();
  ctx.moveTo(88, 200);
  ctx.quadraticCurveTo(120, 178, 154, 198);
  ctx.quadraticCurveTo(158, 216, 150, 226);
  ctx.quadraticCurveTo(120, 208, 92, 224);
  ctx.quadraticCurveTo(85, 214, 88, 200);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SC;
  ctx.beginPath();
  ctx.moveTo(147, 202);
  ctx.quadraticCurveTo(180, 216 + swayS, 197, 266 + swayS * 1.4);
  ctx.quadraticCurveTo(191, 292 + swayS, 183, 308 + swayS * 1.7);
  ctx.quadraticCurveTo(181, 284 + swayS, 172, 274 + swayS);
  ctx.quadraticCurveTo(168, 238 + swayS, 139, 222);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = SCL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(154, 214);
  ctx.quadraticCurveTo(180, 232 + swayS, 188, 276 + swayS);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = SCL;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(96, 202);
  ctx.quadraticCurveTo(120, 186, 148, 202);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  /* ============ 7. face ============ */
  ctx.save();
  ctx.fillStyle = SK;
  ctx.strokeStyle = SKO;
  ctx.lineWidth = 2.4;
  p3facePath();
  ctx.fill();
  ctx.stroke();
  for (var es = -1; es <= 1; es += 2) {
    ctx.save();
    ctx.translate(FCX, 0);
    ctx.scale(es, 1);
    ctx.fillStyle = SK;
    ctx.beginPath();
    ctx.moveTo(48, 118);
    ctx.quadraticCurveTo(62, 116, 60, 132);
    ctx.quadraticCurveTo(58, 146, 44, 144);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  p3facePath();
  ctx.clip();
  ctx.fillStyle = SKS;
  ctx.globalAlpha = 0.62;
  ctx.beginPath();
  ctx.moveTo(56, 44);
  ctx.lineTo(186, 44);
  ctx.lineTo(186, 90);
  ctx.quadraticCurveTo(120, 106, 56, 88);
  ctx.closePath();
  ctx.fill();
  for (var fs = -1; fs <= 1; fs += 2) {
    ctx.save();
    ctx.translate(FCX, 0);
    ctx.scale(fs, 1);
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.quadraticCurveTo(44, 110, 30, 158);
    ctx.lineTo(56, 176);
    ctx.lineTo(60, 60);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(94, 156);
  ctx.quadraticCurveTo(120, 180, 146, 156);
  ctx.lineTo(150, 182);
  ctx.lineTo(90, 182);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = BLU;
  for (var ks = -1; ks <= 1; ks += 2) {
    ctx.beginPath();
    ctx.ellipse(FCX + ks * 33, 137, 13, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  /* ============ 8. face features ============ */
  function p3eye(s) {
    var o = open;
    ctx.save();
    ctx.translate(FCX + s * EYX, EYY);
    ctx.scale(s, 1);                 /* local +x points outward */

    ctx.beginPath();
    ctx.moveTo(-12.5, 4 * o);
    ctx.quadraticCurveTo(-6, -16 * o, 1, -17 * o);
    ctx.quadraticCurveTo(8, -15 * o, 12.5, -4 * o);
    ctx.quadraticCurveTo(7, 10 * o, -1, 14 * o);
    ctx.quadraticCurveTo(-8, 11 * o, -12.5, 4 * o);
    ctx.closePath();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#FBF4EE';
    ctx.fillRect(-18, -24, 36, 44);
    var gIris = ctx.createLinearGradient(0, -15 * o, 0, 13 * o);
    gIris.addColorStop(0, '#8E4708');
    gIris.addColorStop(0.45, '#C9800F');
    gIris.addColorStop(1, '#FFD261');
    ctx.fillStyle = gIris;
    ctx.beginPath();
    ctx.ellipse(0, -1 * o, 10, 14 * o, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(74,32,4,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -1 * o, 10, 14 * o, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2B1405';
    ctx.beginPath();
    ctx.ellipse(0, -0.5 * o, 4.5, 6.3 * o, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(58,20,10,0.40)';
    ctx.beginPath();
    ctx.ellipse(0, -17 * o, 15, 8 * o, 0, 0, Math.PI * 2);
    ctx.fill();
    var hx = -4.2 * s;               /* highlights stay on one screen side */
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(hx, -6.5 * o, 3.4, 3.4 * o, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(-hx * 1.05, 5.6 * o, 1.5, 1.5 * o, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.strokeStyle = LSH;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-12.5, 4 * o);
    ctx.quadraticCurveTo(-6, -16 * o, 1, -17 * o);
    ctx.quadraticCurveTo(8, -15 * o, 12.5, -4 * o);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(2, -17 * o);
    ctx.quadraticCurveTo(8.5, -15 * o, 13, -4.5 * o);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(74,20,16,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, 13.5 * o);
    ctx.quadraticCurveTo(5, 11 * o, 11, -1 * o);
    ctx.stroke();
    ctx.strokeStyle = LSH;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(11, -5.5 * o);
    ctx.quadraticCurveTo(16, -10 * o, 20, -13 * o);
    ctx.stroke();
    ctx.restore();
  }
  function p3brow(s) {
    ctx.save();
    ctx.translate(FCX + s * EYX, EYY - 28);
    ctx.scale(s, 1);
    ctx.fillStyle = '#BC4E3E';
    ctx.beginPath();
    ctx.moveTo(-14, 5);
    ctx.quadraticCurveTo(-3, -3, 14, -7);
    ctx.quadraticCurveTo(3, 1, -13, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  p3brow(-1);
  p3brow(1);
  p3eye(-1);
  p3eye(1);

  ctx.strokeStyle = 'rgba(192,134,106,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(126, 137);
  ctx.quadraticCurveTo(128, 142, 123, 143);
  ctx.stroke();

  ctx.fillStyle = '#6E2A2C';
  ctx.beginPath();
  ctx.moveTo(106, 155);
  ctx.quadraticCurveTo(120, 168, 135, 150);
  ctx.quadraticCurveTo(120, 156, 106, 155);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8E3A34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(106, 155);
  ctx.quadraticCurveTo(120, 168, 135, 150);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(126, 152.5);
  ctx.lineTo(132.5, 150.5);
  ctx.lineTo(128.5, 159);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(199,140,122,0.55)';
  ctx.lineWidth = 4.4;
  ctx.beginPath();
  ctx.moveTo(148, 127);
  ctx.lineTo(159, 139);
  ctx.stroke();
  ctx.strokeStyle = '#B96A5E';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(148, 127);
  ctx.lineTo(159, 139);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(151.5, 136.5);
  ctx.lineTo(156.5, 130.5);
  ctx.stroke();
  ctx.restore();

  /* ============ 9. front hair ============ */
  ctx.save();
  var gFr = ctx.createLinearGradient(0, 40, 0, 104);
  gFr.addColorStop(0, HRD);
  gFr.addColorStop(0.45, HR);
  gFr.addColorStop(1, HRL);
  ctx.fillStyle = gFr;
  ctx.strokeStyle = HRO;
  ctx.lineWidth = 2.4;
  var sw = sway * 0.5;
  ctx.beginPath();
  ctx.moveTo(56, 76);
  ctx.quadraticCurveTo(56, 48, 84, 40);
  ctx.quadraticCurveTo(120, 30, 158, 42);
  ctx.quadraticCurveTo(184, 52, 187, 78);
  ctx.quadraticCurveTo(188, 82, 186 + sw, 84);
  ctx.quadraticCurveTo(176, 74, 172, 62);
  ctx.quadraticCurveTo(170, 78, 165 + sw, 88);
  ctx.quadraticCurveTo(156, 74, 151, 60);
  ctx.quadraticCurveTo(149, 72, 144 + sw, 80);
  ctx.quadraticCurveTo(136, 70, 131, 60);
  ctx.quadraticCurveTo(129, 68, 124 + sw, 74);
  ctx.quadraticCurveTo(117, 68, 111, 60);
  ctx.quadraticCurveTo(109, 70, 104 + sw, 78);
  ctx.quadraticCurveTo(97, 70, 91, 60);
  ctx.quadraticCurveTo(89, 74, 85 + sw, 84);
  ctx.quadraticCurveTo(78, 74, 73, 62);
  ctx.quadraticCurveTo(71, 78, 65 + sw, 90);
  ctx.quadraticCurveTo(58, 84, 56, 76);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  var loose = [
    [113, 48, 122, 78, 112 + sw * 1.6, 110, 128, 76, 130, 50],
    [148, 50, 160, 76, 168 + sw * 1.6, 104, 158, 74, 140, 52]
  ];
  for (var li = 0; li < loose.length; li++) {
    var L = loose[li];
    p3sp(L[0], L[1], L[2], L[3], L[4], L[5], L[6], L[7], L[8], L[9]);
    ctx.fill();
    ctx.stroke();
  }
  var sides = [
    [72, 58, 58, 104, 56 + sw * 1.4, 152, 72, 108, 84, 66],
    [170, 60, 182, 104, 186 + sw * 1.4, 148, 172, 106, 158, 66]
  ];
  for (var di = 0; di < sides.length; di++) {
    var D = sides[di];
    p3sp(D[0], D[1], D[2], D[3], D[4], D[5], D[6], D[7], D[8], D[9]);
    ctx.fill();
    ctx.stroke();
  }

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = HRB;
  ctx.beginPath();
  ctx.moveTo(74, 52);
  ctx.quadraticCurveTo(96, 40, 120, 44);
  ctx.quadraticCurveTo(146, 48, 166, 58);
  ctx.quadraticCurveTo(148, 58, 122, 55);
  ctx.quadraticCurveTo(96, 51, 74, 52);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(80, 60);
  ctx.quadraticCurveTo(104, 50, 130, 54);
  ctx.quadraticCurveTo(106, 60, 82, 66);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();

  ctx.restore();
}


function dvT3(ctx, col, T, facing) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;
  var f = (facing < 0) ? -1 : 1;

  function t3shade(hex, k) {
    var s = String(hex == null ? '#D6392F' : hex).replace('#', '');
    if (s.length === 3) {
      s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    }
    var n = parseInt(s, 16);
    if (s.length !== 6 || !isFinite(n)) n = 14039855;
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (k < 1) {
      r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k);
    } else {
      var u = k - 1;
      r = Math.round(r + (255 - r) * u);
      g = Math.round(g + (255 - g) * u);
      b = Math.round(b + (255 - b) * u);
    }
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  var CC = (typeof col === 'string' && col) ? col : '#D6392F';
  var CD = t3shade(CC, 0.55), CL = t3shade(CC, 1.35);
  var SK = '#FDE7DA', SKO = '#C0866A';
  var HR = '#D6392F', HRD = '#8B1E1B', HRL = '#F4735C', HRO = '#611310';
  var AR = '#A83028', ARS = '#78201C', ARO = '#4E100F';
  var SC = '#2F2C35', SCO = '#100E15';
  var BT = '#3D2A20', BTO = '#241610';

  var bob = Math.sin(t * Math.PI / 1000) * 1.5;   /* 2s period */
  var tail = Math.sin(t / 320) * 2.2;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  /* contact shadow + owner colour ring (stay on the ground) */
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#1E1418';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = CC;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 4.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = CL;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, -0.8, 13, 4.2, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(f, 1);                 /* local +x is the way he faces */

  /* scarf tail, behind the body */
  ctx.save();
  ctx.fillStyle = SC;
  ctx.strokeStyle = SCO;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-6, -44);
  ctx.quadraticCurveTo(-19, -46 + tail, -23, -30 + tail);
  ctx.quadraticCurveTo(-18, -34, -15, -27 + tail);
  ctx.quadraticCurveTo(-14, -38, -4, -38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  /* boots */
  ctx.save();
  ctx.fillStyle = BT;
  ctx.strokeStyle = BTO;
  ctx.lineWidth = 1.8;
  for (var bs = -1; bs <= 1; bs += 2) {
    ctx.beginPath();
    ctx.moveTo(bs * 2, -16);
    ctx.lineTo(bs * 10, -16);
    ctx.lineTo(bs * 11, -2);
    ctx.quadraticCurveTo(bs * 11, 1, bs * 8, 1);
    ctx.lineTo(bs * 2, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  /* trousers */
  ctx.save();
  ctx.fillStyle = '#35323D';
  ctx.strokeStyle = '#1D1B23';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-10, -32);
  ctx.lineTo(10, -32);
  ctx.lineTo(11, -14);
  ctx.lineTo(1.5, -14);
  ctx.lineTo(0, -22);
  ctx.lineTo(-1.5, -14);
  ctx.lineTo(-11, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  /* belt in the player's colour */
  ctx.save();
  ctx.fillStyle = CC;
  ctx.strokeStyle = CD;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-11, -34);
  ctx.lineTo(11, -34);
  ctx.lineTo(11, -28);
  ctx.lineTo(-11, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  /* torso */
  ctx.save();
  var gt = ctx.createLinearGradient(0, -48, 0, -30);
  gt.addColorStop(0, '#C4463A');
  gt.addColorStop(1, ARS);
  ctx.fillStyle = gt;
  ctx.strokeStyle = ARO;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, -46);
  ctx.quadraticCurveTo(-15, -36, -11, -30);
  ctx.lineTo(11, -30);
  ctx.quadraticCurveTo(15, -36, 13, -46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CC;
  ctx.strokeStyle = CD;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.lineTo(5, -39);
  ctx.lineTo(0, -34);
  ctx.lineTo(-5, -39);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  /* arms */
  ctx.save();
  for (var as = -1; as <= 1; as += 2) {
    ctx.fillStyle = AR;
    ctx.strokeStyle = ARO;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(as * 12, -46);
    ctx.quadraticCurveTo(as * 19, -42, as * 18, -32);
    ctx.quadraticCurveTo(as * 14, -30, as * 12, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3D2A20';
    ctx.strokeStyle = '#241610';
    ctx.beginPath();
    ctx.arc(as * 16.6, -29.8, 2.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  /* scarf round the neck */
  ctx.save();
  ctx.fillStyle = SC;
  ctx.strokeStyle = SCO;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-9, -47);
  ctx.quadraticCurveTo(0, -52, 9, -47);
  ctx.quadraticCurveTo(10, -42, 8, -41);
  ctx.quadraticCurveTo(0, -45, -8, -41);
  ctx.quadraticCurveTo(-10, -42, -9, -47);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  /* head */
  ctx.save();
  ctx.fillStyle = SK;
  ctx.strokeStyle = SKO;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -56, 12, 12.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -56, 12, 12.4, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#EDC3AC';
  ctx.beginPath();
  ctx.ellipse(0, -42, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  /* face: eyes + mouth only */
  ctx.save();
  for (var ee = -1; ee <= 1; ee += 2) {
    ctx.fillStyle = '#FFD261';
    ctx.beginPath();
    ctx.ellipse(ee * 5, -54, 2.7, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2B1405';
    ctx.beginPath();
    ctx.ellipse(ee * 5, -54.4, 1.6, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4A1410';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ee * 5 - 2.9, -56.4);
    ctx.quadraticCurveTo(ee * 5, -58.6, ee * 5 + 2.9, -56.4);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ee * 5 - 1.4, -55.4, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#7E2C2C';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-3.4, -47.6);
  ctx.quadraticCurveTo(0.5, -44.8, 4.4, -48.6);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(1.6, -48.2);
  ctx.lineTo(3.6, -48.6);
  ctx.lineTo(2.3, -46.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#D07E72';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(9, -53);
  ctx.lineTo(10.6, -48.6);
  ctx.stroke();
  ctx.restore();

  /* red spiky hair: the silhouette is his name tag */
  ctx.save();
  var gh = ctx.createLinearGradient(0, -74, 0, -48);
  gh.addColorStop(0, HRL);
  gh.addColorStop(0.5, HR);
  gh.addColorStop(1, HRD);
  ctx.fillStyle = gh;
  ctx.strokeStyle = HRO;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12.6, -52);
  ctx.quadraticCurveTo(-22, -56, -20, -62);
  ctx.quadraticCurveTo(-15, -60, -14, -63);
  ctx.quadraticCurveTo(-17, -69, -12, -70);
  ctx.quadraticCurveTo(-9, -66, -6, -66);
  ctx.quadraticCurveTo(-6, -72, 0, -72);
  ctx.quadraticCurveTo(2, -68, 5, -67);
  ctx.quadraticCurveTo(8, -72, 13, -69);
  ctx.quadraticCurveTo(11, -65, 12, -63);
  ctx.quadraticCurveTo(19, -66, 20, -59);
  ctx.quadraticCurveTo(15, -58, 12.8, -52);
  ctx.quadraticCurveTo(11, -58, 7, -59);
  ctx.quadraticCurveTo(5, -62, 2, -59);
  ctx.quadraticCurveTo(-1, -62, -4, -59);
  ctx.quadraticCurveTo(-7, -63, -10, -59);
  ctx.quadraticCurveTo(-12, -56, -12.6, -52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#FFAF92';
  ctx.beginPath();
  ctx.moveTo(-9, -64);
  ctx.quadraticCurveTo(0, -68, 9, -64);
  ctx.quadraticCurveTo(0, -65, -9, -62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();

  ctx.restore();   /* bob + facing */
  ctx.restore();   /* outermost */
}

/* ───── a3de07e3b0650131d ───── */
/* ユキ / 氷の姫巫女 ------------------------------------------------------- */

function dvP0(ctx, T) {
  var cx = 120;                 /* 顔の中心x（左右対称の軸） */
  var fyTop = 38, fyChin = 176; /* 顔（肌）の上端・あご先 */
  var fh = fyChin - fyTop;      /* 138 */
  var hw = (fh / 1.15) / 2;     /* 顔の半幅 = 60 */
  var eCy = 112, eDx = 28;      /* 目の中心y / 中心からの左右オフセット */
  var eW = 28, eH = 37;         /* 目の幅・高さ */
  var ehw = eW / 2, ehh = eH / 2;

  var SKIN = '#FDE7DA', SKIN_S = '#EDC3AC', SKIN_LN = '#D2997C';
  var HAIR = '#CFEAF8', HAIR_S = '#98C9E4', HAIR_D = '#7FB0D0', HAIR_H = '#F4FDFF', HAIR_LN = '#4E80A0';
  var BROW = '#77A6C6', LID = '#3A4E66';
  var W_C = '#FBFDFF', W_S = '#D2E3F1', B_C = '#4A86C8', B_S = '#2E5C93', B_H = '#86BCEA', LN_C = '#26496F';
  var ICE = '#E4F9FF', ICE_S = '#8ADAF4', ICE_LN = '#3E8FB5';

  var sw = Math.sin(T / 900) * 2.4;          /* 髪のゆれ */
  var sw2 = Math.sin(T / 1250 + 1.2) * 3.4;  /* アホ毛のゆれ */
  var bt = T % 3600, bk = 1;                 /* まばたき */
  if (bt < 130) { bk = Math.abs(bt - 65) / 65; if (bk < 0.05) bk = 0.05; }

  /* 片側だけ描いてxを反転して2回呼ぶ＝左右対称の担保 */
  function dvP0_mirror(fn) {
    fn();
    ctx.save();
    ctx.translate(cx * 2, 0);
    ctx.scale(-1, 1);
    fn();
    ctx.restore();
  }

  function dvP0_face() {
    ctx.beginPath();
    ctx.moveTo(cx, fyTop);
    ctx.bezierCurveTo(cx + hw * 0.62, fyTop, cx + hw, fyTop + fh * 0.20, cx + hw, fyTop + fh * 0.45);
    ctx.bezierCurveTo(cx + hw, fyTop + fh * 0.60, cx + hw * 0.88, fyTop + fh * 0.74, cx + hw * 0.62, fyTop + fh * 0.86);
    ctx.bezierCurveTo(cx + hw * 0.42, fyTop + fh * 0.95, cx + hw * 0.20, fyChin, cx, fyChin);
    ctx.bezierCurveTo(cx - hw * 0.20, fyChin, cx - hw * 0.42, fyTop + fh * 0.95, cx - hw * 0.62, fyTop + fh * 0.86);
    ctx.bezierCurveTo(cx - hw * 0.88, fyTop + fh * 0.74, cx - hw, fyTop + fh * 0.60, cx - hw, fyTop + fh * 0.45);
    ctx.bezierCurveTo(cx - hw, fyTop + fh * 0.20, cx - hw * 0.62, fyTop, cx, fyTop);
    ctx.closePath();
  }

  function dvP0_backHair() {
    ctx.beginPath();
    ctx.moveTo(cx, 18);
    ctx.bezierCurveTo(cx - 52, 18, cx - 78, 54, cx - 77, 98);
    ctx.bezierCurveTo(cx - 86, 156, cx - 96, 236, cx - 84 + sw, 344);
    ctx.lineTo(cx + 84 + sw, 344);
    ctx.bezierCurveTo(cx + 96, 236, cx + 86, 156, cx + 77, 98);
    ctx.bezierCurveTo(cx + 78, 54, cx + 52, 18, cx, 18);
    ctx.closePath();
  }

  function dvP0_bangs() {
    ctx.beginPath();
    ctx.moveTo(cx - 76, 74);
    ctx.bezierCurveTo(cx - 74, 32, cx - 40, 19, cx, 19);
    ctx.bezierCurveTo(cx + 40, 19, cx + 74, 32, cx + 76, 74);
    ctx.quadraticCurveTo(cx + 72, 70, cx + 64, 82);
    ctx.quadraticCurveTo(cx + 57, 68, cx + 46, 77);
    ctx.quadraticCurveTo(cx + 36, 66, cx + 24, 85);
    ctx.quadraticCurveTo(cx + 12, 70, cx, 79);
    ctx.quadraticCurveTo(cx - 12, 70, cx - 24, 85);
    ctx.quadraticCurveTo(cx - 36, 66, cx - 46, 77);
    ctx.quadraticCurveTo(cx - 57, 68, cx - 64, 82);
    ctx.quadraticCurveTo(cx - 72, 70, cx - 76, 74);
    ctx.closePath();
  }

  /* 顔の横を流れる長い房（右側だけ定義／先は尖らせる） */
  function dvP0_sideLock() {
    ctx.beginPath();
    ctx.moveTo(cx + 44, 44);
    ctx.bezierCurveTo(cx + 76, 62, cx + 86, 140, cx + 82 + sw, 226);
    ctx.bezierCurveTo(cx + 78 + sw * 1.5, 272, cx + 72 + sw * 2, 300, cx + 62 + sw * 2.4, 324);
    ctx.bezierCurveTo(cx + 67 + sw * 1.4, 288, cx + 65 + sw, 244, cx + 61, 186);
    ctx.bezierCurveTo(cx + 59, 140, cx + 55, 92, cx + 46, 54);
    ctx.closePath();
  }

  function dvP0_shard(x, yb, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, yb - h);
    ctx.lineTo(x + w / 2, yb - h * 0.42);
    ctx.lineTo(x, yb);
    ctx.lineTo(x - w / 2, yb - h * 0.42);
    ctx.closePath();
    var g = ctx.createLinearGradient(x, yb - h, x, yb);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.45, ICE);
    g.addColorStop(1, ICE_S);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ICE_LN;
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x, yb - h + 3);
    ctx.lineTo(x, yb - 3);
    ctx.stroke();
    ctx.restore();
  }

  /* ---- 目（右目だけ定義。ミラーで左目に） ---- */
  function dvP0_eye() {
    var ex = cx + eDx, ey = eCy;

    if (bk < 0.30) {                       /* まばたき：閉じた線 */
      ctx.lineCap = 'round';
      ctx.strokeStyle = LID;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(ex - ehw, ey + 1);
      ctx.quadraticCurveTo(ex, ey + 8, ex + ehw + 2, ey - 3);
      ctx.stroke();
      ctx.lineWidth = 2.2;
      for (var q = 0; q < 3; q++) {
        ctx.beginPath();
        ctx.moveTo(ex + ehw - 1, ey - 2 - q);
        ctx.quadraticCurveTo(ex + ehw + 4, ey - 6 - q * 2, ex + ehw + 5 + q * 1.8, ey - 10 - q * 2.5);
        ctx.stroke();
      }
      return;
    }

    ctx.save();
    ctx.translate(0, ey);
    ctx.scale(1, bk);
    ctx.translate(0, -ey);

    /* 白目のシルエット */
    ctx.beginPath();
    ctx.moveTo(ex - ehw, ey + 3);
    ctx.bezierCurveTo(ex - ehw + 1, ey - ehh * 0.80, ex + ehw * 0.45, ey - ehh, ex + ehw, ey - ehh * 0.55);
    ctx.bezierCurveTo(ex + ehw + 1, ey - ehh * 0.05, ex + ehw * 0.80, ey + ehh * 0.78, ex + ehw * 0.10, ey + ehh);
    ctx.bezierCurveTo(ex - ehw * 0.55, ey + ehh * 0.98, ex - ehw * 0.98, ey + ehh * 0.55, ex - ehw, ey + 3);
    ctx.closePath();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ex - ehw - 6, ey - ehh - 6, eW + 12, eH + 12);
    ctx.fillStyle = '#DCE8F2';
    ctx.beginPath();
    ctx.ellipse(ex, ey - ehh - 1, ehw + 5, ehh * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    var irx = 11.5, iry = 15.5, ix = ex + 0.5, iy = ey + 1.5;
    var gi = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);   /* 上が濃く下が明るい縦グラデ */
    gi.addColorStop(0, '#3E93C9');
    gi.addColorStop(0.55, '#6BC3E8');
    gi.addColorStop(1, '#BFF0FF');
    ctx.fillStyle = gi;
    ctx.beginPath();
    ctx.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2C6E9B';
    ctx.beginPath();
    ctx.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#EAFCFF';
    ctx.beginPath();
    ctx.ellipse(ix, iy + iry * 0.52, irx * 0.60, iry * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#17527A';
    ctx.beginPath();
    ctx.ellipse(ix, iy + 0.5, irx * 0.45, iry * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();                                   /* 大ハイライト（左上） */
    ctx.ellipse(ix - irx * 0.42, iy - iry * 0.44, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();                                   /* 小ハイライト（右下） */
    ctx.ellipse(ix + irx * 0.42, iy + iry * 0.42, 2.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();                                     /* clip 解除 */

    /* 上まぶた：外側を太く */
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = LID;
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(ex - ehw - 0.5, ey + 2);
    ctx.bezierCurveTo(ex - ehw + 1, ey - ehh * 0.85, ex + ehw * 0.45, ey - ehh - 1, ex + ehw + 1.5, ey - ehh * 0.48);
    ctx.stroke();
    ctx.fillStyle = LID;
    ctx.beginPath();
    ctx.moveTo(ex + ehw * 0.25, ey - ehh - 1.2);
    ctx.quadraticCurveTo(ex + ehw * 0.9, ey - ehh - 0.4, ex + ehw + 2.5, ey - ehh * 0.34);
    ctx.quadraticCurveTo(ex + ehw * 0.85, ey - ehh * 0.44, ex + ehw * 0.25, ey - ehh * 0.52);
    ctx.closePath();
    ctx.fill();

    /* まつげ（女性なので目尻から2本） */
    ctx.strokeStyle = LID;
    ctx.lineWidth = 2.2;
    for (var i = 0; i < 2; i++) {
      var ly = ey - ehh * (0.44 + i * 0.20);
      ctx.beginPath();
      ctx.moveTo(ex + ehw - 2, ly);
      ctx.quadraticCurveTo(ex + ehw + 2.5, ly - 2.4 - i * 1.2, ex + ehw + 4 + i * 1.6, ly - 5.5 - i * 1.8);
      ctx.stroke();
    }

    /* 下まぶた：下1/3だけ細く */
    ctx.strokeStyle = '#C58C86';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex - ehw * 0.10, ey + ehh * 0.96);
    ctx.quadraticCurveTo(ex + ehw * 0.7, ey + ehh * 0.80, ex + ehw + 1, ey + ehh * 0.22);
    ctx.stroke();

    ctx.restore();                                     /* まばたきスケール解除 */
  }

  function dvP0_brow() {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = BROW;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(cx + eDx - 13, eCy - 24);
    ctx.quadraticCurveTo(cx + eDx + 1, eCy - 30.5, cx + eDx + 14, eCy - 23);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------------------------------------------- */
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  /* 足元のごく薄い影 */
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#2B4A66';
  ctx.beginPath();
  ctx.ellipse(cx, 334, 104, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* ---- 後ろ髪 ---- */
  var gb = ctx.createLinearGradient(0, 20, 0, 344);
  gb.addColorStop(0, HAIR_D);
  gb.addColorStop(0.45, HAIR_S);
  gb.addColorStop(1, HAIR);
  dvP0_backHair();
  ctx.fillStyle = gb;
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#41708F';
  ctx.stroke();
  ctx.save();                    /* 後ろ髪の中の影と光の帯（シルエットでクリップ） */
  dvP0_backHair();
  ctx.clip();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#5E90B4';
  ctx.beginPath();
  ctx.ellipse(cx, 150, 58, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = HAIR_H;
  ctx.beginPath();
  ctx.moveTo(cx - 74, 208);
  ctx.bezierCurveTo(cx - 46, 190, cx + 46, 190, cx + 74, 210);
  ctx.bezierCurveTo(cx + 46, 202, cx - 46, 202, cx - 74, 220);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* ---- 首 ---- */
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.moveTo(cx - 18, 150);
  ctx.lineTo(cx - 21, 222);
  ctx.lineTo(cx + 21, 222);
  ctx.lineTo(cx + 18, 150);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = SKIN_S;
  ctx.beginPath();
  ctx.moveTo(cx - 20, 152);
  ctx.quadraticCurveTo(cx, 186, cx + 20, 152);
  ctx.lineTo(cx + 20, 148);
  ctx.lineTo(cx - 20, 148);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* ---- 服（白の巫女装束） ---- */
  var gw = ctx.createLinearGradient(0, 210, 0, 344);
  gw.addColorStop(0, W_C);
  gw.addColorStop(1, W_S);
  ctx.beginPath();
  ctx.moveTo(16, 344);
  ctx.bezierCurveTo(20, 292, 40, 250, 78, 232);
  ctx.bezierCurveTo(96, 216, 106, 208, 108, 196);
  ctx.lineTo(132, 196);
  ctx.bezierCurveTo(134, 208, 144, 216, 162, 232);
  ctx.bezierCurveTo(200, 250, 220, 292, 224, 344);
  ctx.closePath();
  ctx.fillStyle = gw;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#A8C4DA';
  ctx.stroke();

  /* 青の千早（肩当て）を左右対称に */
  dvP0_mirror(function () {
    var gbl = ctx.createLinearGradient(150, 230, 210, 344);
    gbl.addColorStop(0, B_H);
    gbl.addColorStop(0.35, B_C);
    gbl.addColorStop(1, B_S);
    ctx.beginPath();
    ctx.moveTo(224, 344);
    ctx.bezierCurveTo(220, 292, 200, 250, 162, 232);
    ctx.bezierCurveTo(150, 227, 142, 222, 138, 214);
    ctx.bezierCurveTo(150, 226, 162, 242, 168, 266);
    ctx.bezierCurveTo(174, 296, 174, 322, 172, 344);
    ctx.closePath();
    ctx.fillStyle = gbl;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = LN_C;
    ctx.stroke();
    /* 肩の光 */
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#CFE6FF';
    ctx.beginPath();
    ctx.moveTo(150, 232);
    ctx.quadraticCurveTo(170, 248, 176, 272);
    ctx.quadraticCurveTo(166, 250, 146, 238);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  /* 襟（白のあわせ＋青の縁） */
  dvP0_mirror(function () {
    ctx.beginPath();
    ctx.moveTo(cx + 4, 202);
    ctx.lineTo(cx + 22, 198);
    ctx.lineTo(cx + 16, 276);
    ctx.lineTo(cx + 2, 266);
    ctx.closePath();
    ctx.fillStyle = W_C;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#A8C4DA';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 16, 200);
    ctx.lineTo(cx + 22, 198);
    ctx.lineTo(cx + 16, 276);
    ctx.lineTo(cx + 11, 272);
    ctx.closePath();
    ctx.fillStyle = B_C;
    ctx.fill();
  });

  /* ---- 毛皮の襟 ---- */
  var fn = 15, fi, ft, fa, fx, fy, fr;
  ctx.save();
  for (fi = 0; fi <= fn; fi++) {           /* 影の層 */
    ft = fi / fn;
    fa = Math.PI * (0.03 + 0.94 * ft);
    fx = cx - 74 * Math.cos(fa);
    fy = 228 + 32 * Math.sin(fa);
    fr = 11 + 4 * Math.sin(Math.PI * ft);
    ctx.fillStyle = '#C9DDEC';
    ctx.beginPath();
    ctx.ellipse(fx, fy + 5, fr, fr, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (fi = 0; fi <= fn; fi++) {           /* 白い層（房ごとに輪郭） */
    ft = fi / fn;
    fa = Math.PI * (0.03 + 0.94 * ft);
    fx = cx - 74 * Math.cos(fa);
    fy = 228 + 32 * Math.sin(fa);
    fr = 11 + 4 * Math.sin(Math.PI * ft);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(fx, fy, fr, fr * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#B7D0E2';
    ctx.stroke();
  }
  ctx.globalAlpha = 0.75;
  for (fi = 0; fi <= fn; fi++) {           /* ふわっとしたハイライト */
    ft = fi / fn;
    fa = Math.PI * (0.03 + 0.94 * ft);
    fx = cx - 74 * Math.cos(fa);
    fy = 228 + 32 * Math.sin(fa);
    fr = 11 + 4 * Math.sin(Math.PI * ft);
    ctx.fillStyle = '#F2F9FF';
    ctx.beginPath();
    ctx.ellipse(fx - fr * 0.2, fy - fr * 0.35, fr * 0.55, fr * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* 胸の帯 */
  var gsash = ctx.createLinearGradient(0, 304, 0, 332);
  gsash.addColorStop(0, B_H);
  gsash.addColorStop(0.4, B_C);
  gsash.addColorStop(1, B_S);
  ctx.beginPath();
  ctx.moveTo(40, 306);
  ctx.quadraticCurveTo(cx, 316, 200, 306);
  ctx.lineTo(200, 330);
  ctx.quadraticCurveTo(cx, 340, 40, 330);
  ctx.closePath();
  ctx.fillStyle = gsash;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = LN_C;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 2;
  ctx.strokeStyle = ICE;
  ctx.beginPath();
  ctx.moveTo(44, 312);
  ctx.quadraticCurveTo(cx, 322, 196, 312);
  ctx.stroke();
  ctx.restore();

  /* ---- 氷のペンダント ---- */
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#9FB9CC';
  ctx.beginPath();
  ctx.moveTo(cx - 30, 250);
  ctx.quadraticCurveTo(cx, 284, cx + 30, 250);
  ctx.stroke();
  dvP0_shard(cx, 300, 17, 30);

  /* ---- 顔 ---- */
  dvP0_face();
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = SKIN_LN;
  ctx.stroke();

  ctx.save();                     /* 顔の中の影（前髪の落ち影＋こめかみ） */
  dvP0_face();
  ctx.clip();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = SKIN_S;
  ctx.beginPath();
  ctx.moveTo(cx - hw - 4, fyTop - 6);
  ctx.lineTo(cx + hw + 4, fyTop - 6);
  ctx.lineTo(cx + hw + 4, 76);
  ctx.quadraticCurveTo(cx + 40, 88, cx + 18, 80);
  ctx.quadraticCurveTo(cx - 6, 88, cx - 30, 79);
  ctx.quadraticCurveTo(cx - 52, 87, cx - hw - 4, 76);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.32;
  dvP0_mirror(function () {
    ctx.beginPath();
    ctx.ellipse(cx + hw + 4, 118, 16, 48, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 0.30;
  ctx.beginPath();                /* あご下の陰 */
  ctx.ellipse(cx, fyChin + 4, 26, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* 頬の赤み */
  ctx.save();
  dvP0_mirror(function () {
    var gcx = cx + 34, gcy = 133;
    var gr = ctx.createRadialGradient(gcx, gcy, 1, gcx, gcy, 17);
    gr.addColorStop(0, 'rgba(249,168,168,0.62)');
    gr.addColorStop(1, 'rgba(249,168,168,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(gcx, gcy, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  /* 鼻＝小さな影だけ */
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = SKIN_S;
  ctx.beginPath();
  ctx.ellipse(cx, 143, 3.4, 1.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* 目 */
  dvP0_mirror(dvP0_eye);

  /* 口（おっとりした微笑み） */
  ctx.strokeStyle = '#C97C79';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - 8.5, 156.5);
  ctx.quadraticCurveTo(cx, 162, cx + 8.5, 156.5);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = SKIN_S;
  ctx.beginPath();
  ctx.ellipse(cx, 164, 6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* ---- 顔まわりの髪（サイドの房） ---- */
  var gs = ctx.createLinearGradient(0, 46, 0, 324);
  gs.addColorStop(0, HAIR_S);
  gs.addColorStop(0.4, HAIR);
  gs.addColorStop(1, HAIR_H);
  dvP0_mirror(function () {
    dvP0_sideLock();
    ctx.fillStyle = gs;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = HAIR_LN;
    ctx.stroke();
    ctx.save();
    dvP0_sideLock();
    ctx.clip();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = HAIR_S;
    ctx.beginPath();
    ctx.ellipse(cx + 56, 200, 11, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = HAIR_H;
    ctx.beginPath();
    ctx.ellipse(cx + 78, 152, 5.5, 44, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  /* ---- 前髪（ぱっつん） ---- */
  var gf = ctx.createLinearGradient(0, 19, 0, 92);
  gf.addColorStop(0, HAIR_S);
  gf.addColorStop(0.55, HAIR);
  gf.addColorStop(1, '#B9DDF2');
  dvP0_bangs();
  ctx.fillStyle = gf;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = HAIR_LN;
  ctx.stroke();

  ctx.save();                     /* 前髪の影と光の帯 */
  dvP0_bangs();
  ctx.clip();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = HAIR_S;
  ctx.beginPath();
  ctx.ellipse(cx + 70, 58, 16, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 70, 58, 16, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.30;
  var bsi, bsd, bsg;
  for (bsi = 0; bsi < 4; bsi++) {          /* 房の分かれ目 */
    bsd = [-52, -20, 20, 52][bsi];
    bsg = bsd < 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + bsd, 22);
    ctx.quadraticCurveTo(cx + bsd + bsg * 8, 54, cx + bsd + bsg * 3, 92);
    ctx.quadraticCurveTo(cx + bsd + bsg * 15, 54, cx + bsd + bsg * 6, 22);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = HAIR_H;
  ctx.beginPath();
  ctx.moveTo(cx - 58, 68);
  ctx.bezierCurveTo(cx - 38, 54, cx - 14, 50, cx, 52);
  ctx.bezierCurveTo(cx + 14, 50, cx + 38, 54, cx + 58, 68);
  ctx.bezierCurveTo(cx + 38, 63, cx + 14, 60, cx, 62);
  ctx.bezierCurveTo(cx - 14, 60, cx - 38, 63, cx - 58, 68);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* 眉 */
  dvP0_mirror(dvP0_brow);

  /* アホ毛 */
  ctx.beginPath();
  ctx.moveTo(cx + 10, 29);
  ctx.quadraticCurveTo(cx - 8 + sw2, 5, cx - 31 + sw2 * 1.6, 12);
  ctx.quadraticCurveTo(cx - 8 + sw2, 12, cx + 6, 33);
  ctx.closePath();
  ctx.fillStyle = HAIR;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = HAIR_LN;
  ctx.stroke();

  /* ---- 氷の結晶のティアラ ---- */
  var gt = ctx.createLinearGradient(0, 34, 0, 62);
  gt.addColorStop(0, '#FFFFFF');
  gt.addColorStop(1, ICE_S);
  ctx.beginPath();
  ctx.moveTo(cx - 49, 60);
  ctx.quadraticCurveTo(cx, 32, cx + 49, 60);
  ctx.quadraticCurveTo(cx, 40, cx - 49, 60);
  ctx.closePath();
  ctx.fillStyle = gt;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = ICE_LN;
  ctx.stroke();
  dvP0_mirror(function () {
    dvP0_shard(cx + 25, 47, 11, 20);
    dvP0_shard(cx + 42, 55, 8, 14);
  });
  dvP0_shard(cx, 41, 15, 27);

  ctx.restore();
}

/* ------------------------------------------------------------------ */

function dvT0(ctx, col, T, facing) {
  var CO = (typeof col === 'string' && col.charAt(0) === '#') ? col : '#4A86C8';

  function dvT0_dark(hex, f) {
    var h = hex.replace('#', '');
    if (h.length === 3) { h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    var n = parseInt(h, 16);
    if (isNaN(n)) { return '#2E5C93'; }
    var r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
    var g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
    var b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  var SKIN = '#FDE7DA', SKIN_LN = '#D2997C';
  var HAIR = '#CFEAF8', HAIR_S = '#98C9E4', HAIR_H = '#F4FDFF', HAIR_LN = '#4E80A0';
  var W_C = '#FBFDFF', B_C = '#4A86C8', B_S = '#2E5C93', LN_C = '#26496F';
  var ICE = '#E4F9FF', ICE_LN = '#3E8FB5';
  var CO_D = dvT0_dark(CO, 0.62);

  var bob = Math.sin(T * Math.PI / 1000) * 1.5;   /* 周期2秒の呼吸 */

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  /* 接地点の影 */
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#1E3A52';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.scale(facing < 0 ? -0.88 : 0.88, 0.88);   /* 全高が約72pxに収まる倍率 */
  ctx.translate(0, -bob);

  /* 後ろ髪（長いストレート） */
  ctx.beginPath();
  ctx.moveTo(0, -72);
  ctx.bezierCurveTo(-14, -72, -19, -62, -18, -52);
  ctx.bezierCurveTo(-19, -38, -17, -26, -15, -16);
  ctx.lineTo(15, -16);
  ctx.bezierCurveTo(17, -26, 19, -38, 18, -52);
  ctx.bezierCurveTo(19, -62, 14, -72, 0, -72);
  ctx.closePath();
  ctx.fillStyle = HAIR_S;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = HAIR_LN;
  ctx.stroke();

  /* 足 */
  ctx.fillStyle = W_C;
  ctx.strokeStyle = '#A8C4DA';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(-6, -3, 5, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(6, -3, 5, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  /* 袴（青） */
  ctx.beginPath();
  ctx.moveTo(-10, -26);
  ctx.lineTo(10, -26);
  ctx.lineTo(14, -5);
  ctx.lineTo(-14, -5);
  ctx.closePath();
  ctx.fillStyle = B_C;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = LN_C;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = B_S;
  ctx.beginPath();
  ctx.moveTo(2, -26);
  ctx.lineTo(10, -26);
  ctx.lineTo(14, -5);
  ctx.lineTo(5, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* 上半身（白） */
  ctx.beginPath();
  ctx.moveTo(-11, -41);
  ctx.lineTo(11, -41);
  ctx.lineTo(10, -24);
  ctx.lineTo(-10, -24);
  ctx.closePath();
  ctx.fillStyle = W_C;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#9FBBD2';
  ctx.stroke();

  /* 袖 */
  ctx.fillStyle = W_C;
  ctx.strokeStyle = '#9FBBD2';
  ctx.beginPath();
  ctx.ellipse(-14, -32, 4.5, 8, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(14, -32, 4.5, 8, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  /* プレイヤー色（帯＋袖口＋胸元の石） */
  ctx.fillStyle = CO;
  ctx.fillRect(-11, -29, 22, 5.5);
  ctx.fillStyle = CO_D;
  ctx.fillRect(-11, -24.5, 22, 1.6);
  ctx.fillStyle = CO;
  ctx.beginPath();
  ctx.ellipse(-14, -25, 4.4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(14, -25, 4.4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -35, 2.6, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  /* 毛皮の襟 */
  var ti;
  for (ti = -2; ti <= 2; ti++) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ti * 5.0, -40.5 + Math.abs(ti) * 0.8, 3.7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* 顔 */
  ctx.beginPath();
  ctx.ellipse(0, -56, 15, 15.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = SKIN_LN;
  ctx.stroke();

  /* サイドの房（顔の横） */
  ctx.fillStyle = HAIR;
  ctx.strokeStyle = HAIR_LN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, -66);
  ctx.quadraticCurveTo(-19, -50, -14, -30);
  ctx.quadraticCurveTo(-11, -46, -8, -62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(13, -66);
  ctx.quadraticCurveTo(19, -50, 14, -30);
  ctx.quadraticCurveTo(11, -46, 8, -62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  /* 前髪（ぱっつん・シルエットで誰か分かるように） */
  ctx.beginPath();
  ctx.moveTo(-15, -57);
  ctx.bezierCurveTo(-16, -70, -8, -74, 0, -74);
  ctx.bezierCurveTo(8, -74, 16, -70, 15, -57);
  ctx.quadraticCurveTo(11, -62, 7, -56);
  ctx.quadraticCurveTo(3, -62, -1, -56);
  ctx.quadraticCurveTo(-6, -62, -10, -57);
  ctx.quadraticCurveTo(-13, -62, -15, -57);
  ctx.closePath();
  ctx.fillStyle = HAIR;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = HAIR_LN;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = HAIR_H;
  ctx.beginPath();
  ctx.ellipse(-1, -66, 8, 2.4, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* 顔（目2つ＋口） */
  ctx.fillStyle = '#2E4A66';
  ctx.beginPath();
  ctx.ellipse(-5.6, -53, 2.7, 3.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5.6, -53, 2.7, 3.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8FDCF7';
  ctx.beginPath();
  ctx.ellipse(-5.6, -52, 1.6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5.6, -52, 1.6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-6.5, -54.4, 1, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4.7, -54.4, 1, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#F9A8A8';
  ctx.beginPath();
  ctx.ellipse(-10, -49, 3, 1.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10, -49, 3, 1.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#C97C79';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2, -47.5);
  ctx.quadraticCurveTo(0, -45.5, 2, -47.5);
  ctx.stroke();

  /* 氷のティアラ */
  ctx.lineWidth = 2;
  ctx.strokeStyle = ICE_LN;
  ctx.beginPath();
  ctx.moveTo(-11, -66);
  ctx.quadraticCurveTo(0, -73, 11, -66);
  ctx.stroke();
  var tp = [[0, -70, 5, 9], [-8, -67, 3.6, 6], [8, -67, 3.6, 6]];
  for (ti = 0; ti < 3; ti++) {
    var px = tp[ti][0], py = tp[ti][1], pwx = tp[ti][2], ph = tp[ti][3];
    ctx.beginPath();
    ctx.moveTo(px, py - ph);
    ctx.lineTo(px + pwx / 2, py - ph * 0.42);
    ctx.lineTo(px, py);
    ctx.lineTo(px - pwx / 2, py - ph * 0.42);
    ctx.closePath();
    ctx.fillStyle = ICE;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = ICE_LN;
    ctx.stroke();
  }

  ctx.restore();
}

/* ───── ad3b50fced692dc76 ───── */
/* ══════════════════════════════════════════════════════════════
   レン — 蒼銀の騎士 (男性)
   dvP1(ctx,T)          … バストアップ肖像 240x340 (左上原点)
   dvT1(ctx,col,T,face) … 盤上コマ 2.5頭身 (接地点原点・上へ72px)
   素のJS / 乱数・時刻APIなし / ctx状態はsave-restoreで完全復帰
   ══════════════════════════════════════════════════════════════ */

function dvP1(ctx, T){
  T = T || 0;

  /* ---- 決定的ゆらぎ（Math.random禁止のため） ---- */
  function p1r(i){ var x = Math.sin(i*127.1 + 311.7)*43758.5453; return x - Math.floor(x); }

  /* ---- パレット ---- */
  var SKIN='#FDE7DA', SKSH='#EDC3AC', SKLN='#C4886C', BLUSH='#F9A8A8';
  var HAIR='#25407C', HRSH='#152447', HRLT='#3F63A8', HRBD='#7C9EE0', HRLN='#0D162F';
  var IR_T='#154A9E', IR_B='#63C6F7', IR_R='#0E2350', PUP='#101C38';
  var SIL ='#CBD6E4', SISH='#8F9FB8', SIHI='#F4F8FF', SILN='#4E5C72';
  var CAP ='#2F6BD0', CASH='#1B3F8B', CAHI='#5D9BEE', CALN='#132759';
  var CLO ='#26304A', CLSH='#161D30', CLLN='#0B0F1C';
  var GEM ='#8CEBFF', GEMD='#2E9FC9';

  /* ---- 顔の基準寸法 ---- */
  var CX=120, FT=52, FH=123, FW=107, HW=FW/2;   // 逆さ卵：幅107 × 高さ123 (1.15W)
  var EY  = FT + FH*0.52;                        // 目の中心 y ≒ 116（顔の縦52%）
  var EX  = 27;                                  // 目の中心の左右オフセット（間隔＝目幅1つ分）
  var EW=27.5;                                   // 目：幅27.5(顔幅26%) 高さ32.5(顔高26%)

  /* ---- アニメーション（Tのみから生成） ---- */
  var bc  = T % 3600;
  var open= bc < 120 ? Math.max(0.05, 1 - Math.sin(Math.PI*bc/120)) : 1;   // まばたき120ms
  var sw1 = Math.sin(T/900)*1.7;          // 前髪の揺れ
  var sw2 = Math.sin(T/640 + 1.2)*1.1;
  var brt = Math.sin(T/1500)*1.0;         // 呼吸（肩）

  ctx.save();

  /* ══ 0. 足元のごく薄い影 ══ */
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#243049';
  ctx.beginPath(); ctx.ellipse(CX, 334, 92, 13, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  /* ---- 汎用：先の尖った髪の房 ---- */
  function strand(ax,ay, c1x,c1y, tx,ty, c2x,c2y, bx,by, colA, colB){
    var g = ctx.createLinearGradient((ax+bx)/2,(ay+by)/2, tx,ty);
    g.addColorStop(0, colA); g.addColorStop(1, colB);
    ctx.beginPath();
    ctx.moveTo(ax,ay);
    ctx.quadraticCurveTo(c1x,c1y, tx,ty);
    ctx.quadraticCurveTo(c2x,c2y, bx,by);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
  }

  /* ---- 髪シルエット（後ろ髪＝クリップにも使う） ---- */
  function hairSil(){
    ctx.beginPath();
    ctx.moveTo(60,146);
    ctx.bezierCurveTo(46,118, 48,50, 96,27);
    ctx.bezierCurveTo(122,14, 170,28, 184,63);
    ctx.bezierCurveTo(192,92, 188,122, 179,148);
    ctx.bezierCurveTo(158,156, 82,156, 60,146);
    ctx.closePath();
  }

  /* ══ 1. マント（体の後ろ） ══ */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(76,204);
  ctx.bezierCurveTo(26,220, 4,278, 0,340);
  ctx.lineTo(62,340);
  ctx.bezierCurveTo(58,280, 68,234, 90,212);
  ctx.closePath();
  ctx.moveTo(164,204);
  ctx.bezierCurveTo(214,220, 236,278, 240,340);
  ctx.lineTo(178,340);
  ctx.bezierCurveTo(182,280, 172,234, 150,212);
  ctx.closePath();
  var gC = ctx.createLinearGradient(0,200, 0,340);
  gC.addColorStop(0, CAHI); gC.addColorStop(0.45, CAP); gC.addColorStop(1, CASH);
  ctx.fillStyle = gC; ctx.fill();
  ctx.lineJoin='round'; ctx.lineWidth=2.4; ctx.strokeStyle=CALN; ctx.stroke();
  ctx.restore();

  /* ══ 2. 後ろ髪 ══ */
  ctx.save();
  hairSil();
  var gH = ctx.createLinearGradient(0,20, 0,175);
  gH.addColorStop(0, HRLT); gH.addColorStop(0.45, HAIR); gH.addColorStop(1, HRSH);
  ctx.fillStyle = gH; ctx.fill();
  ctx.lineJoin='round'; ctx.lineWidth=2.6; ctx.strokeStyle=HRLN; ctx.stroke();
  ctx.restore();

  /* ══ 3. 首 ══ */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(102,150); ctx.lineTo(99,196);
  ctx.lineTo(141,196); ctx.lineTo(138,150);
  ctx.closePath();
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.lineWidth=2.2; ctx.strokeStyle=SKLN; ctx.stroke();
  // あご下の影
  ctx.beginPath();
  ctx.moveTo(100,158);
  ctx.quadraticCurveTo(120,186, 140,158);
  ctx.lineTo(140,150); ctx.lineTo(100,150);
  ctx.closePath();
  ctx.fillStyle = SKSH; ctx.fill();
  ctx.restore();

  /* ══ 4. 胴（インナー＋肩） ══ */
  ctx.save();
  ctx.translate(0, brt*0.6);
  ctx.beginPath();
  ctx.moveTo(96,192);
  ctx.bezierCurveTo(72,200, 50,226, 44,264);
  ctx.lineTo(40,340); ctx.lineTo(200,340); ctx.lineTo(196,264);
  ctx.bezierCurveTo(190,226, 168,200, 144,192);
  ctx.closePath();
  var gB = ctx.createLinearGradient(0,192, 0,340);
  gB.addColorStop(0, CLO); gB.addColorStop(1, CLSH);
  ctx.fillStyle = gB; ctx.fill();
  ctx.lineJoin='round'; ctx.lineWidth=2.4; ctx.strokeStyle=CLLN; ctx.stroke();

  // 胸の銀プレート（V字）
  ctx.beginPath();
  ctx.moveTo(84,224);
  ctx.bezierCurveTo(100,246, 108,272, 120,300);
  ctx.bezierCurveTo(132,272, 140,246, 156,224);
  ctx.bezierCurveTo(140,214, 100,214, 84,224);
  ctx.closePath();
  var gP = ctx.createLinearGradient(84,214, 156,300);
  gP.addColorStop(0, SIHI); gP.addColorStop(0.5, SIL); gP.addColorStop(1, SISH);
  ctx.fillStyle = gP; ctx.fill();
  ctx.lineWidth=2.2; ctx.strokeStyle=SILN; ctx.stroke();
  // プレートの影1段
  ctx.beginPath();
  ctx.moveTo(120,300); ctx.bezierCurveTo(132,272, 140,246, 156,224);
  ctx.bezierCurveTo(150,221, 142,220, 134,220);
  ctx.bezierCurveTo(130,250, 126,274, 120,300);
  ctx.closePath();
  ctx.fillStyle = SISH; ctx.fill();

  // 立ち襟（左右）
  function collar(dir){
    ctx.save(); ctx.translate(CX,0); ctx.scale(dir,1);
    ctx.beginPath();
    ctx.moveTo(4,206);
    ctx.lineTo(30,170);
    ctx.bezierCurveTo(42,180, 48,196, 48,212);
    ctx.bezierCurveTo(34,214, 16,212, 4,206);
    ctx.closePath();
    var g = ctx.createLinearGradient(0,170, 48,214);
    g.addColorStop(0, CAP); g.addColorStop(1, CASH);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineJoin='round'; ctx.lineWidth=2.2; ctx.strokeStyle=CALN; ctx.stroke();
    ctx.restore();
  }
  collar(1); collar(-1);

  // 肩当て（銀）左右
  function pauldron(dir){
    ctx.save(); ctx.translate(CX,0); ctx.scale(dir,1);
    ctx.beginPath();
    ctx.moveTo(30,212);
    ctx.bezierCurveTo(64,206, 96,228, 100,268);
    ctx.bezierCurveTo(88,282, 56,280, 38,262);
    ctx.bezierCurveTo(30,246, 28,226, 30,212);
    ctx.closePath();
    var g = ctx.createLinearGradient(34,206, 96,278);
    g.addColorStop(0, SIHI); g.addColorStop(0.42, SIL); g.addColorStop(1, SISH);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineJoin='round'; ctx.lineWidth=2.4; ctx.strokeStyle=SILN; ctx.stroke();
    // 影1段
    ctx.beginPath();
    ctx.moveTo(46,268); ctx.bezierCurveTo(66,278, 88,278, 100,268);
    ctx.bezierCurveTo(99,278, 92,282, 82,282);
    ctx.bezierCurveTo(66,282, 52,276, 46,268);
    ctx.closePath();
    ctx.fillStyle = SISH; ctx.fill();
    // ハイライト1段
    ctx.beginPath();
    ctx.moveTo(38,222); ctx.bezierCurveTo(56,214, 76,222, 86,238);
    ctx.bezierCurveTo(76,232, 56,228, 40,234);
    ctx.closePath();
    ctx.fillStyle = SIHI; ctx.fill();
    // 蒼の縁飾り
    ctx.beginPath();
    ctx.moveTo(34,258); ctx.bezierCurveTo(52,274, 84,278, 99,266);
    ctx.lineWidth=3.4; ctx.strokeStyle=CAP; ctx.stroke();
    ctx.restore();
  }
  pauldron(1); pauldron(-1);

  // 喉元の宝珠
  ctx.beginPath(); ctx.ellipse(120,214, 9,10, 0, 0, Math.PI*2);
  var gG = ctx.createLinearGradient(112,206, 128,224);
  gG.addColorStop(0, GEM); gG.addColorStop(1, GEMD);
  ctx.fillStyle = gG; ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle=SILN; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(116,210, 3,3.6, -0.5, 0, Math.PI*2);
  ctx.fillStyle='#FFFFFF'; ctx.globalAlpha=0.85; ctx.fill(); ctx.globalAlpha=1;
  ctx.restore();

  /* ══ 5. 耳（顔より先＝顔の下に隠れる側） ══ */
  function ear(dir){
    ctx.save(); ctx.translate(CX,0); ctx.scale(dir,1);
    ctx.beginPath();
    ctx.moveTo(HW-7,110);
    ctx.bezierCurveTo(HW+6,108, HW+8,124, HW+1,134);
    ctx.bezierCurveTo(HW-5,138, HW-8,126, HW-7,110);
    ctx.closePath();
    ctx.fillStyle = SKIN; ctx.fill();
    ctx.lineWidth=2.2; ctx.strokeStyle=SKLN; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(HW-2,116); ctx.quadraticCurveTo(HW+4,122, HW-1,132);
    ctx.lineWidth=1.8; ctx.strokeStyle=SKSH; ctx.stroke();
    ctx.restore();
  }
  ear(1); ear(-1);

  /* ══ 6. 顔（逆さ卵） ══ */
  function facePath(){
    ctx.beginPath();
    ctx.moveTo(CX, FT);
    ctx.bezierCurveTo(CX+HW*0.82, FT+2,       CX+HW, FT+FH*0.24, CX+HW, FT+FH*0.40);
    ctx.bezierCurveTo(CX+HW,      FT+FH*0.57,  CX+HW*0.88, FT+FH*0.74, CX+HW*0.55, FT+FH*0.90);
    ctx.bezierCurveTo(CX+HW*0.35, FT+FH*0.972, CX+HW*0.17, FT+FH, CX, FT+FH);
    ctx.bezierCurveTo(CX-HW*0.17, FT+FH,       CX-HW*0.35, FT+FH*0.972, CX-HW*0.55, FT+FH*0.90);
    ctx.bezierCurveTo(CX-HW*0.88, FT+FH*0.74,  CX-HW, FT+FH*0.57, CX-HW, FT+FH*0.40);
    ctx.bezierCurveTo(CX-HW,      FT+FH*0.24,  CX-HW*0.82, FT+2, CX, FT);
    ctx.closePath();
  }
  ctx.save();
  facePath();
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.lineJoin='round'; ctx.lineWidth=2.3; ctx.strokeStyle=SKLN; ctx.stroke();

  // 顔の影（前髪の落ち影＋頬の側面）— 顔内にクリップ
  ctx.save();
  facePath(); ctx.clip();
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = SKSH;
  ctx.beginPath();                                  // 前髪の落ち影（斜めの毛先に沿う）
  ctx.moveTo(CX-HW-2, 92);
  ctx.bezierCurveTo(86, 82, 112, 78, 136, 80);
  ctx.bezierCurveTo(152, 82, 164, 92, CX+HW+2, 106);
  ctx.lineTo(CX+HW+2, FT-8); ctx.lineTo(CX-HW-2, FT-8);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();                                  // 左右の側面影
  ctx.moveTo(CX-HW, FT+FH*0.30);
  ctx.bezierCurveTo(CX-HW+10, FT+FH*0.55, CX-HW+12, FT+FH*0.72, CX-HW*0.60, FT+FH*0.90);
  ctx.lineTo(CX-HW-4, FT+FH*0.92); ctx.lineTo(CX-HW-4, FT+FH*0.30);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(CX+HW, FT+FH*0.30);
  ctx.bezierCurveTo(CX+HW-10, FT+FH*0.55, CX+HW-12, FT+FH*0.72, CX+HW*0.60, FT+FH*0.90);
  ctx.lineTo(CX+HW+4, FT+FH*0.92); ctx.lineTo(CX+HW+4, FT+FH*0.30);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // 頬の赤み（男性なので薄く）
  function blush(dir){
    ctx.save(); ctx.translate(CX,0); ctx.scale(dir,1);
    ctx.globalAlpha = 0.16; ctx.fillStyle = BLUSH;
    ctx.beginPath(); ctx.ellipse(38, EY+18, 12, 6.5, -0.12, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  blush(1); blush(-1);

  // 鼻（2pxの短い線のみ）
  ctx.beginPath();
  ctx.moveTo(CX+5, EY+22); ctx.lineTo(CX+1, EY+25);
  ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle=SKLN; ctx.stroke();

  // 口（小さく・口角わずかに上げる）
  var MW = EW*0.6;
  ctx.beginPath();
  ctx.moveTo(CX-MW/2, EY+39);
  ctx.quadraticCurveTo(CX, EY+43.5, CX+MW/2, EY+38);
  ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.strokeStyle=SKLN; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CX-2, EY+45); ctx.quadraticCurveTo(CX+1, EY+46.5, CX+4, EY+45);
  ctx.lineWidth=1.6; ctx.strokeStyle=SKSH; ctx.stroke();
  ctx.restore();

  /* ══ 7. 目（片側を描いて反転） ══ */
  function eyeAperture(){
    ctx.beginPath();
    ctx.moveTo(-13, 5);
    ctx.bezierCurveTo(-10,-20,  2,-26, 13,-11);
    ctx.bezierCurveTo(  7, 9, -4, 13.5, -13, 5);
    ctx.closePath();
  }
  function eye(dir){
    ctx.save();
    ctx.translate(CX + dir*EX, EY);
    ctx.scale(dir*1.10, 1.12);

    /* 眉：細い弧（髪より少し明るい）目の高さの0.9倍だけ上 */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-12.5,-22.5);
    ctx.bezierCurveTo(-5,-28.5, 6,-31.5, 15.5,-29.5);
    ctx.lineTo(15.2,-26.4);
    ctx.bezierCurveTo(6,-28.4, -4,-25.4, -12.2,-18.6);
    ctx.closePath();
    ctx.fillStyle = HRLT; ctx.fill();
    ctx.restore();

    /* まぶたの開き（下まぶたを軸に閉じる） */
    ctx.save();
    ctx.translate(0, 7); ctx.scale(1, open); ctx.translate(0, -7);

    // 白目
    ctx.save();
    eyeAperture(); ctx.clip();
    ctx.fillStyle = '#F7F5FA';
    ctx.fillRect(-16,-30, 32, 48);
    ctx.fillStyle = '#D8D5E4';                       // 上まぶたの落ち影
    ctx.beginPath();
    ctx.moveTo(-16,-30); ctx.lineTo(16,-30); ctx.lineTo(16,-12);
    ctx.bezierCurveTo(4,-19, -8,-17, -16,-12);
    ctx.closePath(); ctx.fill();

    // 虹彩（縦長・上濃→下明の縦グラデ）
    var gI = ctx.createLinearGradient(0,-17, 0, 9);
    gI.addColorStop(0, IR_T); gI.addColorStop(0.55, '#2E7FD6'); gI.addColorStop(1, IR_B);
    ctx.beginPath(); ctx.ellipse(0,-4, 10.5, 13, 0, 0, Math.PI*2);
    ctx.fillStyle = gI; ctx.fill();
    ctx.lineWidth=1.8; ctx.strokeStyle=IR_R; ctx.stroke();
    // 瞳孔（虹彩の45%）
    ctx.beginPath(); ctx.ellipse(0,-4, 4.7, 5.9, 0, 0, Math.PI*2);
    ctx.fillStyle = PUP; ctx.fill();
    // 下側の反射光
    ctx.beginPath(); ctx.ellipse(0, 4.5, 6.5, 3.2, 0, 0, Math.PI*2);
    ctx.globalAlpha=0.55; ctx.fillStyle='#BFF0FF'; ctx.fill(); ctx.globalAlpha=1;
    // 大ハイライト（左上）／小ハイライト（右下）
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(-4.6,-9.2, 3.7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 4.8, 2.6, 1.6, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // 上まぶた（外太・内細のテーパー）
    ctx.beginPath();
    ctx.moveTo(-13.6, 4.4);
    ctx.bezierCurveTo(-10,-20, 2,-26, 13.4,-11.4);
    ctx.lineTo(14.2,-6.0);
    ctx.bezierCurveTo(1.5,-19.5, -9,-15, -13.0, 6.2);
    ctx.closePath();
    ctx.fillStyle = '#101B36'; ctx.fill();

    // 下まぶた（下1/3だけ・細線）
    ctx.beginPath();
    ctx.moveTo(-1.5, 12.4); ctx.quadraticCurveTo(6, 10.6, 11.6,-1);
    ctx.lineWidth=1.5; ctx.lineCap='round'; ctx.strokeStyle='#4A5878'; ctx.stroke();

    // まつげ（男性は1本＋極短1本）
    ctx.beginPath();
    ctx.moveTo(11.6,-9.2); ctx.quadraticCurveTo(16.5,-12.5, 19.6,-15.6);
    ctx.lineWidth=2.8; ctx.lineCap='round'; ctx.strokeStyle='#101B36'; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12.4,-5.4); ctx.lineTo(16.2,-6.2);
    ctx.lineWidth=1.8; ctx.stroke();

    ctx.restore();  // open scale
    ctx.restore();  // eye transform
  }
  eye(1); eye(-1);

  /* ══ 8. 前髪（房を重ねて斜めに流す） ══ */
  ctx.save();

  //      ax,ay = 根元左  bx,by = 根元右  tx,ty = 毛先  cu = ふくらみ
  var bang = [
    [ 48, 50,  84, 30,   56, 128,  11],
    [ 60, 38,  96, 25,   72,  88,   8],
    [ 74, 29, 110, 23,   94,  71,   5],
    [ 90, 24, 126, 25,  116,  77,  -3],
    [106, 23, 142, 32,  138,  73,  -7],
    [122, 26, 156, 42,  158,  81, -10],
    [138, 33, 170, 56,  174, 106, -12],
    [154, 46, 186, 74,  188, 134, -13]
  ];
  var tip = [];
  for (var i=0; i<bang.length; i++){
    var sw = (i<4 ? sw1 : sw2) * (0.55 + p1r(i)*0.85);
    tip.push([bang[i][4] + sw*1.8, bang[i][5]]);
  }

  // 8-a. 房の集合シルエット（地肌が透けないベタ＋毛先のギザギザ）
  function bangMass(){
    ctx.beginPath();
    ctx.moveTo(52, 74);
    ctx.bezierCurveTo(54, 34, 96, 19, 122, 21);
    ctx.bezierCurveTo(158, 23, 186, 40, 190, 74);
    ctx.lineTo(tip[7][0], tip[7][1]);
    for (var m=6; m>=0; m--){
      var nx = (tip[m][0] + tip[m+1][0])/2;
      var ny = Math.min(tip[m][1], tip[m+1][1]) - 6;
      ctx.quadraticCurveTo(nx, ny, tip[m][0], tip[m][1]);
    }
    ctx.closePath();
  }
  bangMass();
  var gBase = ctx.createLinearGradient(0, 21, 0, 122);
  gBase.addColorStop(0, HAIR); gBase.addColorStop(1, HRSH);
  ctx.fillStyle = gBase; ctx.fill();

  // 8-b. 房（右へ流れる。毛先は必ず尖らせる）
  for (var j=0; j<bang.length; j++){
    var b  = bang[j];
    var ax=b[0], ay=b[1], bx=b[2], by=b[3], tx=tip[j][0], ty=tip[j][1], cu=b[6];
    strand(ax, ay,
           ax + (tx-ax)*0.45 - cu, ay + (ty-ay)*0.58,
           tx, ty,
           bx + (tx-bx)*0.45 + cu*0.7, by + (ty-by)*0.58,
           bx, by,
           (j%2 ? '#101E44' : '#22397A'), (j%2 ? '#33559B' : '#4E78C4'));
  }
  // 分け目に沿う一番手前の房（斜め流れを強調）
  strand(88, 22, 124, 50, 152, 84, 134, 48, 118, 24, HAIR, HRBD);
  strand(58, 42, 62, 64, 64,  86, 78, 62, 90, 30, '#16274F', '#3A5FAE');

  // 8-c. シルエットにだけ暗い輪郭線（房の内側には線を引かない）
  bangMass();
  ctx.lineJoin='round'; ctx.lineWidth=2.4; ctx.strokeStyle=HRLN; ctx.stroke();

  // こめかみの長い房・跳ねた毛先（これらは独立したシルエット）
  function loose(ax,ay,c1x,c1y,tx,ty,c2x,c2y,bx,by,ca,cb){
    strand(ax,ay,c1x,c1y,tx,ty,c2x,c2y,bx,by,ca,cb);
    ctx.beginPath();
    ctx.moveTo(ax,ay); ctx.quadraticCurveTo(c1x,c1y,tx,ty);
    ctx.quadraticCurveTo(c2x,c2y,bx,by);
    ctx.lineWidth=2.2; ctx.strokeStyle=HRLN; ctx.stroke();
  }
  loose( 54, 96,  47,120,  56,142,  68,120,  78,100, HRSH, HAIR);
  loose(188,100, 196,126, 188,148, 174,126, 164,104, HRSH, HAIR);
  loose(156, 30, 174, 12, 188, 14, 174, 24, 164, 36, HAIR, HRBD);
  ctx.restore();

  /* ══ 9. 髪トップの光の帯（少し波打つ帯を1本） ══ */
  ctx.save();
  hairSil(); ctx.clip();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = HRBD;
  ctx.beginPath();
  ctx.moveTo(66, 56);
  ctx.bezierCurveTo(86, 36, 130, 27, 172, 47);
  ctx.bezierCurveTo(173, 52, 173, 54, 172, 57);
  ctx.bezierCurveTo(132, 42, 92, 50, 71, 66);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.restore();
}


function dvT1(ctx, col, T, facing){
  T = T || 0;
  col = col || '#3F8BE0';
  var f = (facing === -1) ? -1 : 1;

  var SKIN='#FDE7DA', SKLN='#C4886C';
  var HAIR='#25407C', HRSH='#152447', HRLT='#4A6FB4', HRLN='#0D162F';
  var SIL ='#CBD6E4', SISH='#8F9FB8', SILN='#4E5C72';
  var CAP ='#2F6BD0', CALN='#132759';
  var CLO ='#26304A', CLLN='#0B0F1C';

  var bob = Math.sin(T*Math.PI/1000)*1.5;   // 周期2秒・±1.5px

  ctx.save();

  /* 接地影（呼吸で動かさない） */
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = '#101828';
  ctx.beginPath(); ctx.ellipse(0, 0, 15, 4.6, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.translate(0, bob);
  ctx.scale(f, 1);
  ctx.lineJoin = 'round';

  /* マント（後ろ） */
  ctx.beginPath();
  ctx.moveTo(-11,-45);
  ctx.bezierCurveTo(-20,-37, -21,-18, -18,-7);
  ctx.bezierCurveTo(-4,-3, 13,-3, 18,-8);
  ctx.bezierCurveTo(21,-20, 20,-37, 11,-45);
  ctx.closePath();
  var gc = ctx.createLinearGradient(0,-46, 0,-6);
  gc.addColorStop(0, '#5D9BEE'); gc.addColorStop(0.5, CAP); gc.addColorStop(1, '#24559F');
  ctx.fillStyle = gc; ctx.fill();
  ctx.lineWidth=1.8; ctx.strokeStyle=CALN; ctx.stroke();

  /* 脚（ブーツ） */
  ctx.beginPath();
  ctx.moveTo(-8,-18); ctx.lineTo(-8,-2);
  ctx.quadraticCurveTo(-8,0, -5.6,0); ctx.lineTo(-1.6,0);
  ctx.quadraticCurveTo(-1,0, -1,-2); ctx.lineTo(-1,-18);
  ctx.closePath();
  ctx.moveTo(1,-18); ctx.lineTo(1,-2);
  ctx.quadraticCurveTo(1,0, 3.4,0); ctx.lineTo(7.4,0);
  ctx.quadraticCurveTo(8,0, 8,-2); ctx.lineTo(8,-18);
  ctx.closePath();
  ctx.fillStyle = CLO; ctx.fill();
  ctx.lineWidth=1.8; ctx.strokeStyle=CLLN; ctx.stroke();

  /* 胴（プレイヤー色を差し込む） */
  ctx.beginPath();
  ctx.moveTo(-11,-42);
  ctx.bezierCurveTo(-14,-32, -13,-22, -11,-15);
  ctx.lineTo(11,-15);
  ctx.bezierCurveTo(13,-22, 14,-32, 11,-42);
  ctx.closePath();
  ctx.fillStyle = CLO; ctx.fill();
  ctx.lineWidth=1.9; ctx.strokeStyle=CLLN; ctx.stroke();
  // 前立て＝プレイヤー色
  ctx.beginPath();
  ctx.moveTo(-5,-42); ctx.lineTo(5,-42);
  ctx.bezierCurveTo(5,-30, 4,-20, 0,-15);
  ctx.bezierCurveTo(-4,-20, -5,-30, -5,-42);
  ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth=1.4; ctx.strokeStyle=CLLN; ctx.stroke();

  // 胸の銀プレート（V字・小）
  ctx.beginPath();
  ctx.moveTo(-8,-40); ctx.lineTo(-3.5,-40);
  ctx.bezierCurveTo(-3,-33, -2,-28, 0,-25);
  ctx.bezierCurveTo(2,-28, 3,-33, 3.5,-40);
  ctx.lineTo(8,-40);
  ctx.bezierCurveTo(7.5,-31, 5,-24, 0,-20);
  ctx.bezierCurveTo(-5,-24, -7.5,-31, -8,-40);
  ctx.closePath();
  var gsp = ctx.createLinearGradient(-8,-42, 8,-20);
  gsp.addColorStop(0,'#F4F8FF'); gsp.addColorStop(0.55, SIL); gsp.addColorStop(1, SISH);
  ctx.fillStyle = gsp; ctx.fill();
  ctx.lineWidth=1.4; ctx.strokeStyle=SILN; ctx.stroke();
  // ベルト
  ctx.beginPath();
  ctx.moveTo(-12,-17.5); ctx.lineTo(12,-17.5);
  ctx.lineWidth=3.2; ctx.lineCap='butt'; ctx.strokeStyle='#3B2A1E'; ctx.stroke();
  ctx.beginPath(); ctx.rect(-2.4,-19.4, 4.8, 4);
  ctx.fillStyle = SIL; ctx.fill();
  ctx.lineWidth=1.1; ctx.strokeStyle=SILN; ctx.stroke();

  /* 腕 */
  ctx.beginPath();
  ctx.moveTo(-11,-40); ctx.bezierCurveTo(-17,-36, -18,-26, -15,-19);
  ctx.lineTo(-10,-21); ctx.bezierCurveTo(-12,-27, -11,-34, -8,-38);
  ctx.closePath();
  ctx.moveTo(11,-40); ctx.bezierCurveTo(17,-36, 18,-26, 15,-19);
  ctx.lineTo(10,-21); ctx.bezierCurveTo(12,-27, 11,-34, 8,-38);
  ctx.closePath();
  ctx.fillStyle = CLO; ctx.fill();
  ctx.lineWidth=1.7; ctx.strokeStyle=CLLN; ctx.stroke();

  /* 肩当て（銀） */
  function tPauldron(d){
    ctx.save(); ctx.scale(d,1);
    ctx.beginPath(); ctx.ellipse(11,-39, 7.5, 5.6, -0.35, 0, Math.PI*2);
    var g = ctx.createLinearGradient(4,-44, 18,-33);
    g.addColorStop(0,'#F4F8FF'); g.addColorStop(0.5, SIL); g.addColorStop(1, SISH);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth=1.7; ctx.strokeStyle=SILN; ctx.stroke();
    ctx.restore();
  }
  tPauldron(1); tPauldron(-1);

  /* 頭（円に近い逆さ卵） */
  ctx.beginPath();
  ctx.ellipse(0, -56, 12.6, 14.2, 0, 0, Math.PI*2);
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.lineWidth=1.9; ctx.strokeStyle=SKLN; ctx.stroke();

  /* 髪（シルエットで誰か分かるように：斜め前髪＋跳ね） */
  ctx.beginPath();
  ctx.moveTo(-13.0,-57);
  ctx.bezierCurveTo(-15.4,-68, -6,-73.5, 2,-72.6);
  ctx.bezierCurveTo(11.5,-71.5, 14.8,-64, 14.2,-55);
  ctx.bezierCurveTo(12.6,-60.5, 10,-63, 6,-62);        // 右のえぐれ
  ctx.bezierCurveTo(1,-58.5, -5,-57.5, -9.5,-60);      // 斜めに流れる前髪の縁
  ctx.bezierCurveTo(-11,-60.4, -12.2,-59, -13.0,-57);
  ctx.closePath();
  var gh = ctx.createLinearGradient(0,-73, 0,-55);
  gh.addColorStop(0, HRLT); gh.addColorStop(0.55, HAIR); gh.addColorStop(1, HRSH);
  ctx.fillStyle = gh; ctx.fill();
  ctx.lineWidth=1.8; ctx.strokeStyle=HRLN; ctx.stroke();
  // 跳ねた毛先（右へ1本）
  ctx.beginPath();
  ctx.moveTo(8,-69); ctx.quadraticCurveTo(18,-73.5, 22,-68);
  ctx.quadraticCurveTo(17,-67.5, 11,-63.5); ctx.closePath();
  ctx.fillStyle = HAIR; ctx.fill();
  ctx.lineWidth=1.5; ctx.strokeStyle=HRLN; ctx.stroke();
  // もみあげ（左右・短い尖り）
  ctx.beginPath();
  ctx.moveTo(-12.6,-60); ctx.quadraticCurveTo(-13.6,-54, -11.6,-49);
  ctx.quadraticCurveTo(-10.4,-54, -9.4,-58); ctx.closePath();
  ctx.moveTo(13.6,-58); ctx.quadraticCurveTo(14.4,-53, 12.4,-48);
  ctx.quadraticCurveTo(11.4,-53, 10.4,-57); ctx.closePath();
  ctx.fillStyle = HRSH; ctx.fill();
  ctx.lineWidth=1.4; ctx.strokeStyle=HRLN; ctx.stroke();
  // 光の帯
  ctx.save();
  ctx.globalAlpha = 0.45; ctx.fillStyle = '#7C9EE0';
  ctx.beginPath();
  ctx.moveTo(-8.5,-65); ctx.quadraticCurveTo(0,-70.5, 9,-66);
  ctx.quadraticCurveTo(0,-67.8, -7.5,-62.5); ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* 顔（目2つ＋口だけ） */
  function tEye(d){
    ctx.save(); ctx.scale(d,1);
    ctx.beginPath(); ctx.ellipse(5.0,-51.5, 2.9, 3.9, 0, 0, Math.PI*2);
    ctx.fillStyle = '#12203F'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(5.0,-50.4, 2.0, 2.5, 0, 0, Math.PI*2);
    ctx.fillStyle = '#3E9BE8'; ctx.fill();
    ctx.beginPath(); ctx.arc(3.9,-53.2, 1.25, 0, Math.PI*2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.restore();
  }
  tEye(1); tEye(-1);
  ctx.beginPath();
  ctx.moveTo(-2.2,-45.4); ctx.quadraticCurveTo(0,-43.6, 2.2,-45.4);
  ctx.lineWidth=1.4; ctx.lineCap='round'; ctx.strokeStyle=SKLN; ctx.stroke();

  ctx.restore();
}

/* ───── a96d8f2559c7eda95 ───── */
// ============================================================
//  ソラ / 翠風の狩人  (Sora - Hunter of the Emerald Wind)
//  dvP5 : bust portrait 240 x 340  (0,0 = top-left)
//  dvT5 : board token, (0,0) = ground contact point, ~72px tall
// ============================================================

function dvP5(ctx, T) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;

  // ---- deterministic helper (no Math.random, no Date) ----
  function p5r(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function p5ell(x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }

  // ---- palette : base / shadow / light / outline(-45% lightness) ----
  var SKIN = '#FDE7DA', SKIN_S = '#EDC3AC', SKIN_O = '#B8836A';
  var CHEEK = '#F9A8A8';
  var HAIR = '#B6DC58', HAIR_S = '#7FA733', HAIR_D = '#65872A', HAIR_O = '#48671A';
  var CAPE = '#2F7D4E', CAPE_S = '#1B5133', CAPE_L = '#51A56D', CAPE_O = '#123720';
  var HOOD = '#276B43', HOOD_S = '#17482D', HOOD_L = '#3F8F5C';
  var TUNIC = '#EADFC4', TUNIC_S = '#C4B492', TUNIC_O = '#8A7854';
  var LTHR = '#8C5A2E', LTHR_S = '#5D3818', LTHR_O = '#3A2210';
  var IRIS_D = '#4C8B2B', IRIS_M = '#7DC24A', IRIS_L = '#BCEB74', IRIS_O = '#2C4E17';
  var LASH = '#3E5A1C';
  var MOUTH = '#B4705F';

  // ---- geometry ----
  var cx = 120;
  var faceTop = 46, chinY = 174;
  var faceW = 114, faceH = chinY - faceTop;        // 128
  var hw2 = faceW / 2;                             // 57
  var fcy = (faceTop + chinY) / 2;
  var eyeY = 115;                                  // ~54% down the face
  var eyeHW = 13.8, eyeHH = 14.6;
  var eyeDX = 27;                                  // eye centre offset (gap == one eye width)

  // ---- animation, all derived from T ----
  var sway = Math.sin(t / 820) * 2.0;
  var sway2 = Math.sin(t / 820 + 1.1) * 1.5;
  var sway3 = Math.sin(t / 640 + 0.4) * 1.2;
  var bc = t % 3400;
  var bk = 1;
  if (bc >= 0 && bc < 120) {
    bk = 1 - Math.sin(Math.PI * (bc / 120));
    if (bk < 0.05) bk = 0.05;
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ============ 0. contact shadow ============
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#20301A';
  p5ell(cx, 333, 86, 13, 0); ctx.fill();
  ctx.globalAlpha = 0.07;
  p5ell(cx, 330, 58, 9, 0); ctx.fill();
  ctx.restore();

  // ============ 1. back hair (short, spiky ends) ============
  function p5backHair() {
    ctx.beginPath();
    ctx.moveTo(50, 146);
    ctx.bezierCurveTo(38, 116, 45, 31, 120, 16);
    ctx.bezierCurveTo(195, 31, 202, 116, 190, 146);
    // the gathered hair draws out into a tied tuft
    ctx.quadraticCurveTo(205, 160, 212 + sway, 198 + sway * 0.6);
    ctx.quadraticCurveTo(201, 183, 193, 181);
    ctx.quadraticCurveTo(203, 173, 200 + sway2 * 0.6, 157 + sway2);
    ctx.quadraticCurveTo(190, 165, 181, 167);
    ctx.lineTo(170, 150);
    ctx.lineTo(159, 186);
    ctx.lineTo(146, 160);
    ctx.lineTo(120, 192);
    ctx.lineTo(94, 160);
    ctx.lineTo(81, 186);
    ctx.lineTo(68, 152);
    ctx.lineTo(55, 180);
    ctx.closePath();
  }
  p5backHair();
  var gBack = ctx.createLinearGradient(0, 18, 0, 192);
  gBack.addColorStop(0, HAIR_D);
  gBack.addColorStop(0.55, HAIR_S);
  gBack.addColorStop(1, HAIR_D);
  ctx.fillStyle = gBack;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = HAIR_O;
  ctx.stroke();

  // ============ 2. leather hair tie at the gather point ============
  ctx.save();
  ctx.translate(193, 164);
  ctx.rotate(0.78);
  ctx.beginPath();
  ctx.moveTo(-7.5, -5.5); ctx.lineTo(7.5, -5.5); ctx.lineTo(7.5, 5.5); ctx.lineTo(-7.5, 5.5);
  ctx.closePath();
  ctx.fillStyle = LTHR; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = LTHR_O; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7.5, 0); ctx.lineTo(7.5, 0);
  ctx.lineWidth = 1.3; ctx.strokeStyle = LTHR_S; ctx.stroke();
  ctx.restore();

  // ============ 3. hood, lowered behind the neck ============
  ctx.save();
  ctx.translate(0, -12);   // shoulders sit closer to the jaw
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(70, 190);
  ctx.bezierCurveTo(48, 208, 42, 244, 60, 268);
  ctx.quadraticCurveTo(120, 292, 180, 268);
  ctx.bezierCurveTo(198, 244, 192, 208, 170, 190);
  ctx.quadraticCurveTo(120, 172, 70, 190);
  ctx.closePath();
  var gHood = ctx.createLinearGradient(0, 175, 0, 285);
  gHood.addColorStop(0, HOOD_L);
  gHood.addColorStop(0.4, HOOD);
  gHood.addColorStop(1, HOOD_S);
  ctx.fillStyle = gHood; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = CAPE_O; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(78, 196); ctx.quadraticCurveTo(70, 226, 80, 254);
  ctx.moveTo(162, 196); ctx.quadraticCurveTo(170, 226, 160, 254);
  ctx.lineWidth = 2; ctx.strokeStyle = HOOD_S; ctx.stroke();
  ctx.restore();

  // ============ 4. torso : cape, tunic, leather ============
  function p5torso() {
    ctx.beginPath();
    ctx.moveTo(120, 194);
    ctx.lineTo(95, 204);
    ctx.quadraticCurveTo(52, 214, 29, 251);
    ctx.quadraticCurveTo(14, 280, 10, 356);
    ctx.lineTo(230, 356);
    ctx.quadraticCurveTo(226, 280, 211, 251);
    ctx.quadraticCurveTo(188, 214, 145, 204);
    ctx.closePath();
  }
  ctx.save();
  p5torso();
  var gCape = ctx.createLinearGradient(0, 200, 0, 356);
  gCape.addColorStop(0, CAPE_L);
  gCape.addColorStop(0.35, CAPE);
  gCape.addColorStop(1, CAPE_S);
  ctx.fillStyle = gCape; ctx.fill();

  ctx.save();
  p5torso();
  ctx.clip();

  // tunic V
  ctx.beginPath();
  ctx.moveTo(93, 206);
  ctx.quadraticCurveTo(104, 252, 120, 288);
  ctx.quadraticCurveTo(136, 252, 147, 206);
  ctx.lineTo(120, 198);
  ctx.closePath();
  ctx.fillStyle = TUNIC; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = TUNIC_O; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(120, 200);
  ctx.quadraticCurveTo(134, 250, 120, 288);
  ctx.quadraticCurveTo(136, 252, 147, 206);
  ctx.closePath();
  ctx.globalAlpha = 0.75; ctx.fillStyle = TUNIC_S; ctx.fill(); ctx.globalAlpha = 1;

  // cape front panels
  ctx.beginPath();
  ctx.moveTo(95, 205);
  ctx.quadraticCurveTo(82, 262, 58, 356);
  ctx.lineTo(4, 356); ctx.lineTo(4, 210); ctx.closePath();
  ctx.moveTo(145, 205);
  ctx.quadraticCurveTo(158, 262, 182, 356);
  ctx.lineTo(236, 356); ctx.lineTo(236, 210); ctx.closePath();
  ctx.fillStyle = CAPE; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = CAPE_O; ctx.stroke();

  // fold shadows
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = CAPE_S;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(52, 268); ctx.quadraticCurveTo(44, 306, 40, 356);
  ctx.moveTo(196, 274); ctx.quadraticCurveTo(202, 308, 204, 356);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // lit rim along the panel edges
  ctx.beginPath();
  ctx.moveTo(98, 208); ctx.quadraticCurveTo(86, 262, 63, 354);
  ctx.moveTo(142, 208); ctx.quadraticCurveTo(154, 262, 177, 354);
  ctx.lineWidth = 3; ctx.strokeStyle = CAPE_L; ctx.stroke();

  // leather baldric (quiver strap)
  ctx.beginPath();
  ctx.moveTo(68, 214);
  ctx.quadraticCurveTo(120, 272, 178, 356);
  ctx.lineWidth = 17; ctx.strokeStyle = LTHR; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(61, 220); ctx.quadraticCurveTo(113, 277, 171, 361);
  ctx.moveTo(75, 208); ctx.quadraticCurveTo(127, 266, 185, 351);
  ctx.lineWidth = 3; ctx.strokeStyle = LTHR_O; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 218); ctx.quadraticCurveTo(122, 273, 176, 354);
  ctx.lineWidth = 1.6; ctx.strokeStyle = LTHR_S; ctx.stroke();
  // buckle
  ctx.save();
  ctx.translate(126, 280); ctx.rotate(0.86);
  ctx.beginPath();
  ctx.moveTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(9, 7); ctx.lineTo(-9, 7); ctx.closePath();
  ctx.fillStyle = '#E3B454'; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = '#6E4C12'; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, -3); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.lineTo(-4, 3); ctx.closePath();
  ctx.fillStyle = LTHR_S; ctx.fill(); ctx.stroke();
  ctx.restore();

  ctx.restore();  // end torso clip

  p5torso();
  ctx.lineWidth = 2.6; ctx.strokeStyle = CAPE_O; ctx.stroke();
  ctx.restore();

  // shoulder pads (mirrored)
  function p5pad(sx) {
    ctx.save();
    ctx.translate(cx, 0); ctx.scale(sx, 1);
    ctx.beginPath();
    ctx.moveTo(-32, 214);
    ctx.quadraticCurveTo(-68, 216, -87, 246);
    ctx.quadraticCurveTo(-76, 266, -46, 260);
    ctx.quadraticCurveTo(-31, 248, -32, 214);
    ctx.closePath();
    var gp = ctx.createLinearGradient(-88, 210, -40, 264);
    gp.addColorStop(0, '#A26C39');
    gp.addColorStop(1, LTHR_S);
    ctx.fillStyle = gp; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = LTHR_O; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-81, 238); ctx.quadraticCurveTo(-58, 230, -37, 234);
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#C08C4C'; ctx.stroke();
    ctx.restore();
  }
  p5pad(1); p5pad(-1);

  // cape collar
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(90, 210);
  ctx.quadraticCurveTo(120, 195, 150, 210);
  ctx.quadraticCurveTo(152, 227, 139, 235);
  ctx.quadraticCurveTo(120, 224, 101, 235);
  ctx.quadraticCurveTo(88, 227, 90, 210);
  ctx.closePath();
  ctx.fillStyle = CAPE_L; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = CAPE_O; ctx.stroke();
  ctx.restore();

  // brass clasp
  ctx.save();
  p5ell(120, 218, 9, 9, 0);
  var gCl = ctx.createLinearGradient(112, 210, 128, 227);
  gCl.addColorStop(0, '#F6D98A');
  gCl.addColorStop(1, '#A97D2C');
  ctx.fillStyle = gCl; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = '#6E4C12'; ctx.stroke();
  p5ell(120, 218, 4, 4, 0);
  ctx.fillStyle = CAPE; ctx.fill();
  ctx.lineWidth = 1.4; ctx.stroke();
  ctx.restore();
  ctx.restore();  // end shoulders/torso group

  // ============ 5. neck ============
  function p5neck() {
    ctx.beginPath();
    ctx.moveTo(98, 144);
    ctx.lineTo(97, 199);
    ctx.quadraticCurveTo(120, 212, 143, 199);
    ctx.lineTo(142, 144);
    ctx.closePath();
  }
  ctx.save();
  p5neck();
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = SKIN_O; ctx.stroke();
  ctx.save();
  p5neck(); ctx.clip();
  ctx.beginPath();
  ctx.moveTo(90, 136);
  ctx.quadraticCurveTo(120, 190, 150, 136);
  ctx.lineTo(150, 128); ctx.lineTo(90, 128);
  ctx.closePath();
  ctx.fillStyle = SKIN_S; ctx.fill();
  ctx.restore();
  ctx.restore();

  // ============ 6. ears (mirrored) ============
  function p5ear(sx) {
    ctx.save();
    ctx.translate(cx, 0); ctx.scale(sx, 1);
    ctx.beginPath();
    ctx.moveTo(51, 106);
    ctx.quadraticCurveTo(64, 102, 62, 118);
    ctx.quadraticCurveTo(59, 132, 49, 128);
    ctx.closePath();
    ctx.fillStyle = SKIN; ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = SKIN_O; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(54, 112); ctx.quadraticCurveTo(59, 116, 55, 124);
    ctx.lineWidth = 1.8; ctx.strokeStyle = SKIN_S; ctx.stroke();
    ctx.restore();
  }
  p5ear(1); p5ear(-1);

  // ============ 7. face ============
  function p5face() {
    ctx.beginPath();
    ctx.moveTo(cx, faceTop);
    ctx.bezierCurveTo(cx + hw2 * 0.96, faceTop + 3, cx + hw2, fcy + 3, cx + hw2 * 0.72, chinY - 34);
    ctx.bezierCurveTo(cx + hw2 * 0.55, chinY - 12, cx + 23, chinY, cx, chinY);
    ctx.bezierCurveTo(cx - 23, chinY, cx - hw2 * 0.55, chinY - 12, cx - hw2 * 0.72, chinY - 34);
    ctx.bezierCurveTo(cx - hw2, fcy + 3, cx - hw2 * 0.96, faceTop + 3, cx, faceTop);
    ctx.closePath();
  }
  ctx.save();
  p5face();
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = SKIN_O; ctx.stroke();

  ctx.save();
  p5face(); ctx.clip();
  // shade cast by the fringe
  ctx.beginPath();
  ctx.moveTo(48, 38); ctx.lineTo(194, 38); ctx.lineTo(194, 90);
  ctx.quadraticCurveTo(178, 110, 170, 90);
  ctx.quadraticCurveTo(156, 106, 149, 86);
  ctx.quadraticCurveTo(136, 106, 130, 86);
  ctx.quadraticCurveTo(116, 108, 108, 86);
  ctx.quadraticCurveTo(96, 104, 88, 84);
  ctx.quadraticCurveTo(76, 106, 68, 88);
  ctx.quadraticCurveTo(58, 100, 48, 82);
  ctx.closePath();
  ctx.globalAlpha = 0.85; ctx.fillStyle = SKIN_S; ctx.fill(); ctx.globalAlpha = 1;
  // cheek-side shade, both sides
  ctx.beginPath();
  ctx.moveTo(54, 62); ctx.quadraticCurveTo(70, 118, 60, 154); ctx.lineTo(46, 154); ctx.lineTo(46, 62); ctx.closePath();
  ctx.moveTo(186, 62); ctx.quadraticCurveTo(170, 118, 180, 154); ctx.lineTo(194, 154); ctx.lineTo(194, 62); ctx.closePath();
  ctx.globalAlpha = 0.5; ctx.fillStyle = SKIN_S; ctx.fill();
  // faint blush (male : light)
  ctx.globalAlpha = 0.17; ctx.fillStyle = CHEEK;
  p5ell(cx - 35, 134, 16, 7.5, -0.12); ctx.fill();
  p5ell(cx + 35, 134, 16, 7.5, 0.12); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();

  // ============ 8. eyes (one side, mirrored) ============
  function p5eye(sx) {
    ctx.save();
    ctx.translate(cx, 0); ctx.scale(sx, 1);
    var ex = eyeDX, ey = eyeY, hw = eyeHW, hh = eyeHH * bk;

    function p5ap() {
      ctx.beginPath();
      ctx.moveTo(ex - hw, ey + 3 * bk);
      ctx.quadraticCurveTo(ex - 2, ey - (hh + 5 * bk), ex + hw, ey - 6.5 * bk);
      ctx.quadraticCurveTo(ex - 1, ey + hh * 1.02, ex - hw, ey + 3 * bk);
      ctx.closePath();
    }

    p5ap();
    ctx.fillStyle = '#FBFCF6'; ctx.fill();

    ctx.save();
    p5ap(); ctx.clip();
    // sclera shade under the lid
    ctx.beginPath();
    ctx.rect(ex - hw - 2, ey - 42, hw * 2 + 4, 42 - eyeHH * 0.5);
    ctx.fillStyle = '#DBE2D1'; ctx.fill();

    var irx = 10.4, iry = 14.0, icy = ey + 1;
    p5ell(ex, icy, irx, iry, 0);
    var gIr = ctx.createLinearGradient(0, icy - iry, 0, icy + iry);
    gIr.addColorStop(0, IRIS_O);
    gIr.addColorStop(0.30, IRIS_D);
    gIr.addColorStop(0.74, IRIS_M);
    gIr.addColorStop(1, IRIS_L);
    ctx.fillStyle = gIr; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = IRIS_O; ctx.stroke();
    // pupil
    p5ell(ex, icy + 0.5, irx * 0.45, iry * 0.45, 0);
    ctx.fillStyle = '#22380F'; ctx.fill();
    // big highlight, upper-left of the iris
    p5ell(ex - 4.0, icy - 6.2, irx * 0.33, irx * 0.33, 0);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    // small highlight, lower-right
    p5ell(ex + 3.9, icy + 7.0, irx * 0.15, irx * 0.15, 0);
    ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();

    // upper lash line : tapered, thin inside -> thick outside
    ctx.beginPath();
    ctx.moveTo(ex - hw, ey + 3 * bk);
    ctx.quadraticCurveTo(ex - 2, ey - (hh + 5 * bk), ex + hw + 1.5, ey - 7.5 * bk);
    ctx.lineTo(ex + hw - 1, ey - 7.5 * bk + 5.2);
    ctx.quadraticCurveTo(ex - 2, ey - (hh + 5 * bk) + 4.8, ex - hw + 1.2, ey + 3 * bk + 1.5);
    ctx.closePath();
    ctx.fillStyle = LASH; ctx.fill();

    // lower lid, outer third only
    ctx.beginPath();
    ctx.moveTo(ex + 2, ey + hh * 0.85);
    ctx.quadraticCurveTo(ex + hw * 0.72, ey + hh * 0.78, ex + hw - 0.5, ey + hh * 0.05);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#82A05B'; ctx.stroke();

    // single lash flick at the outer corner (male)
    ctx.beginPath();
    ctx.moveTo(ex + hw - 1, ey - 4 * bk);
    ctx.quadraticCurveTo(ex + hw + 4, ey - 8, ex + hw + 6.5, ey - 11);
    ctx.lineWidth = 2.6; ctx.strokeStyle = LASH; ctx.stroke();

    ctx.restore();
  }
  p5eye(1); p5eye(-1);

  // ============ 9. nose & smile ============
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + 4, 135);
  ctx.quadraticCurveTo(cx + 7.5, 140, cx + 2, 142);
  ctx.lineWidth = 2; ctx.globalAlpha = 0.5; ctx.strokeStyle = SKIN_O; ctx.stroke();
  ctx.globalAlpha = 1;

  function p5mouth() {
    ctx.beginPath();
    ctx.moveTo(cx - 9.5, 150);
    ctx.quadraticCurveTo(cx, 154.4, cx + 9.5, 150);
    ctx.quadraticCurveTo(cx + 1, 162, cx - 9.5, 150);
    ctx.closePath();
  }
  p5mouth();
  ctx.fillStyle = MOUTH; ctx.fill();
  ctx.lineWidth = 1.8; ctx.strokeStyle = '#8A4438'; ctx.stroke();
  ctx.save();
  p5mouth(); ctx.clip();
  ctx.beginPath();
  ctx.moveTo(cx - 11, 148.5);
  ctx.quadraticCurveTo(cx, 153.3, cx + 11, 148.5);
  ctx.lineTo(cx + 11, 144); ctx.lineTo(cx - 11, 144);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.restore();
  ctx.restore();

  // ============ 10. front hair : fringe sheet + soft depth + sheen ============
  function p5fringe() {
    ctx.beginPath();
    ctx.moveTo(53 + sway3 * 0.5, 132);                     // left side-lock tip
    ctx.quadraticCurveTo(57, 90, 61, 55);
    ctx.quadraticCurveTo(76, 19, 118, 17);
    ctx.quadraticCurveTo(163, 19, 179, 57);
    ctx.quadraticCurveTo(186, 96, 188 - sway3 * 0.5, 134); // right side-lock tip
    // fringe edge, right -> left : shallow slits, pointed tips
    ctx.quadraticCurveTo(181, 106, 177, 80);
    ctx.quadraticCurveTo(173, 94, 167 + sway * 0.5, 103);
    ctx.quadraticCurveTo(161, 90, 157, 77);
    ctx.quadraticCurveTo(152, 88, 146 + sway * 0.45, 97);
    ctx.quadraticCurveTo(141, 84, 137, 71);
    ctx.quadraticCurveTo(133, 86, 128 + sway2 * 0.5, 96);
    ctx.quadraticCurveTo(123, 84, 119, 74);
    ctx.quadraticCurveTo(114, 88, 108 + sway2 * 0.45, 98);
    ctx.quadraticCurveTo(103, 84, 99, 73);
    ctx.quadraticCurveTo(94, 86, 89 + sway * 0.45, 94);
    ctx.quadraticCurveTo(84, 82, 80, 75);
    ctx.quadraticCurveTo(76, 90, 71 + sway * 0.4, 101);
    ctx.quadraticCurveTo(66, 92, 62, 82);
    ctx.closePath();
  }
  ctx.save();
  p5fringe();
  var gFr = ctx.createLinearGradient(0, 17, 0, 132);
  gFr.addColorStop(0, HAIR_S);
  gFr.addColorStop(0.45, HAIR);
  gFr.addColorStop(1, '#CBE97A');
  ctx.fillStyle = gFr; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = HAIR_O; ctx.stroke();

  // soft depth inside the fringe (no hard lines)
  ctx.save();
  p5fringe(); ctx.clip();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = HAIR_S;
  var sh = [
    [60, 34, 54, 82, 53, 132, 70, 86],
    [96, 20, 86, 56, 80, 58, 102, 52],
    [126, 18, 124, 56, 121, 62, 136, 52],
    [156, 22, 168, 60, 176, 70, 172, 58],
    [174, 32, 184, 84, 188, 134, 180, 78]
  ];
  for (var i = 0; i < sh.length; i++) {
    var q = sh[i], j = (p5r(i) - 0.5) * 2.0;
    ctx.beginPath();
    ctx.moveTo(q[0], q[1]);
    ctx.quadraticCurveTo(q[2], q[3], q[4] + j, q[5]);
    ctx.quadraticCurveTo(q[6], q[7], q[0] + 12, q[1] + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // light band over the crown (two crescents following the dome)
  var gBand = ctx.createLinearGradient(56, 0, 188, 0);
  gBand.addColorStop(0, 'rgba(226,244,158,0)');
  gBand.addColorStop(0.22, 'rgba(232,248,176,0.5)');
  gBand.addColorStop(0.5, 'rgba(244,252,206,0.72)');
  gBand.addColorStop(0.78, 'rgba(232,248,176,0.5)');
  gBand.addColorStop(1, 'rgba(226,244,158,0)');
  ctx.fillStyle = gBand;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.bezierCurveTo(74, 42, 95, 30, 122, 31);
  ctx.bezierCurveTo(150, 32, 170, 44, 180, 64);
  ctx.bezierCurveTo(168, 52, 149, 44, 124, 43);
  ctx.bezierCurveTo(97, 42, 76, 51, 64, 64);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(76, 73);
  ctx.bezierCurveTo(89, 59, 108, 53, 128, 54);
  ctx.bezierCurveTo(148, 55, 162, 61, 170, 72);
  ctx.bezierCurveTo(159, 66, 143, 61, 126, 60);
  ctx.bezierCurveTo(105, 59, 87, 65, 76, 73);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();

  // loose locks framing the cheeks + one cowlick
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(72, 40);
  ctx.quadraticCurveTo(56, 84, 51 + sway3, 140 + sway3 * 0.6);
  ctx.quadraticCurveTo(60, 92, 64, 44);
  ctx.closePath();
  var gLk = ctx.createLinearGradient(52, 40, 62, 140);
  gLk.addColorStop(0, HAIR_S);
  gLk.addColorStop(1, HAIR);
  ctx.fillStyle = gLk; ctx.fill();
  ctx.lineWidth = 2.3; ctx.strokeStyle = HAIR_O; ctx.stroke();
  // matching lock on the right
  ctx.beginPath();
  ctx.moveTo(168, 40);
  ctx.quadraticCurveTo(184, 84, 189 - sway3, 142 - sway3 * 0.6);
  ctx.quadraticCurveTo(180, 92, 176, 44);
  ctx.closePath();
  var gRk = ctx.createLinearGradient(188, 40, 178, 142);
  gRk.addColorStop(0, HAIR_S);
  gRk.addColorStop(1, HAIR);
  ctx.fillStyle = gRk; ctx.fill();
  ctx.stroke();
  // ahoge : thin cowlick off the crown
  ctx.beginPath();
  ctx.moveTo(128, 21);
  ctx.quadraticCurveTo(150, 8, 165 + sway * 1.6, 15 + sway * 0.6);
  ctx.quadraticCurveTo(148, 13, 133, 25);
  ctx.closePath();
  ctx.fillStyle = HAIR; ctx.fill();
  ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  // ============ 11. eyebrows, over the hair so the face stays readable ============
  function p5brow(sx) {
    ctx.save();
    ctx.translate(cx, 0); ctx.scale(sx, 1);
    var ex = eyeDX, ey = eyeY;
    ctx.beginPath();
    ctx.moveTo(ex - 12.5, ey - 23);
    ctx.quadraticCurveTo(ex + 1, ey - 31, ex + 15, ey - 28.5);
    ctx.quadraticCurveTo(ex + 1, ey - 26.5, ex - 12, ey - 19.5);
    ctx.closePath();
    ctx.fillStyle = '#93BE43'; ctx.fill();
    ctx.lineWidth = 1.4; ctx.strokeStyle = '#66892A'; ctx.stroke();
    ctx.restore();
  }
  p5brow(1); p5brow(-1);

  ctx.restore();
}


function dvT5(ctx, col, T, facing) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;
  var f = (facing === -1) ? -1 : 1;
  var acc = (typeof col === 'string' && col.length > 3) ? col : '#7BC24A';

  var HAIR = '#B6DC58', HAIR_S = '#7FA733', HAIR_D = '#65872A', HAIR_O = '#48671A';
  var SKIN = '#FDE7DA', SKIN_S = '#EDC3AC', SKIN_O = '#B8836A';
  var CAPE = '#2F7D4E', CAPE_S = '#1B5133', CAPE_L = '#51A56D', CAPE_O = '#123720';
  var TUNIC = '#EADFC4', TUNIC_O = '#8A7854';
  var LTHR = '#8C5A2E', LTHR_O = '#3A2210';

  var bob = Math.sin(t * Math.PI / 1000) * 1.5;   // 2s period, +-1.5px
  var sway = Math.sin(t / 760) * 1.6;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ---- ground shadow, pinned to the contact point ----
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = '#101A0C';
  ctx.beginPath();
  ctx.ellipse(0, -1, 16, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.translate(0, -bob);
  ctx.scale(f, 1);

  // ---- boots ----
  ctx.save();
  ctx.fillStyle = LTHR; ctx.strokeStyle = LTHR_O; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, -16); ctx.lineTo(-2.5, -16); ctx.lineTo(-2.5, -3);
  ctx.quadraticCurveTo(-2.5, 0, -6, 0); ctx.lineTo(-12, 0);
  ctx.quadraticCurveTo(-14, 0, -13, -4); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2.5, -16); ctx.lineTo(11, -16); ctx.lineTo(12, -4);
  ctx.quadraticCurveTo(13, 0, 10, 0); ctx.lineTo(4, 0);
  ctx.quadraticCurveTo(2.5, 0, 2.5, -3); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();

  // ---- lowered hood behind the shoulders ----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-11, -44);
  ctx.quadraticCurveTo(-19, -34, -14, -24);
  ctx.quadraticCurveTo(0, -18, 14, -24);
  ctx.quadraticCurveTo(19, -34, 11, -44);
  ctx.closePath();
  ctx.fillStyle = CAPE_S; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = CAPE_O; ctx.stroke();
  ctx.restore();

  // ---- cape / body ----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-9, -43);
  ctx.quadraticCurveTo(-19, -38, -19, -22);
  ctx.quadraticCurveTo(-19, -13, -16, -9);
  ctx.quadraticCurveTo(-8, -12, 0, -9);
  ctx.quadraticCurveTo(8, -12, 16, -9);
  ctx.quadraticCurveTo(19, -13, 19, -22);
  ctx.quadraticCurveTo(19, -38, 9, -43);
  ctx.closePath();
  var gB = ctx.createLinearGradient(0, -44, 0, -9);
  gB.addColorStop(0, CAPE_L);
  gB.addColorStop(0.45, CAPE);
  gB.addColorStop(1, CAPE_S);
  ctx.fillStyle = gB; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = CAPE_O; ctx.stroke();

  // tunic V
  ctx.beginPath();
  ctx.moveTo(-6, -42);
  ctx.quadraticCurveTo(-2, -28, 0, -20);
  ctx.quadraticCurveTo(2, -28, 6, -42);
  ctx.closePath();
  ctx.fillStyle = TUNIC; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = TUNIC_O; ctx.stroke();

  // player-colour baldric
  ctx.beginPath();
  ctx.moveTo(-9, -39);
  ctx.quadraticCurveTo(0, -30, 11, -19);
  ctx.lineWidth = 5.5; ctx.strokeStyle = acc; ctx.stroke();
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();

  // player-colour shoulder trim
  ctx.beginPath();
  ctx.moveTo(-10, -43);
  ctx.quadraticCurveTo(0, -47, 10, -43);
  ctx.lineWidth = 4; ctx.strokeStyle = acc; ctx.stroke();
  ctx.lineWidth = 1.4; ctx.strokeStyle = CAPE_O; ctx.stroke();

  // belt
  ctx.beginPath();
  ctx.moveTo(-15, -18);
  ctx.quadraticCurveTo(0, -14, 15, -18);
  ctx.lineWidth = 4; ctx.strokeStyle = LTHR; ctx.stroke();
  ctx.lineWidth = 1.4; ctx.strokeStyle = LTHR_O; ctx.stroke();
  ctx.restore();

  // ---- neck ----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-4, -49); ctx.lineTo(4, -49); ctx.lineTo(4, -42); ctx.lineTo(-4, -42);
  ctx.closePath();
  ctx.fillStyle = SKIN_S; ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(0, 2);   // keeps the whole token inside ~72px
  // ---- ponytail behind the head ----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-12, -64);
  ctx.quadraticCurveTo(-21, -60, -22 - sway * 0.6, -48 - sway * 0.4);
  ctx.quadraticCurveTo(-17, -51, -12, -52);
  ctx.closePath();
  ctx.fillStyle = HAIR_D; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = HAIR_O; ctx.stroke();
  ctx.restore();

  // ---- head ----
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -57, 13.5, 14.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = SKIN_O; ctx.stroke();
  ctx.restore();

  // ---- hair : cap + pointed fringe ----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-14, -53);
  ctx.quadraticCurveTo(-16, -72, 0, -73);
  ctx.quadraticCurveTo(16, -72, 14, -53);
  ctx.quadraticCurveTo(13, -59, 11, -65);
  ctx.quadraticCurveTo(9, -57, 5, -52);
  ctx.quadraticCurveTo(3, -61, 1, -66);
  ctx.quadraticCurveTo(-1, -56, -4, -51);
  ctx.quadraticCurveTo(-7, -62, -9, -66);
  ctx.quadraticCurveTo(-11, -57, -13, -55);
  ctx.closePath();
  var gH = ctx.createLinearGradient(0, -74, 0, -50);
  gH.addColorStop(0, HAIR_S);
  gH.addColorStop(0.5, HAIR);
  gH.addColorStop(1, '#CBE97A');
  ctx.fillStyle = gH; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = HAIR_O; ctx.stroke();
  // sheen
  ctx.beginPath();
  ctx.ellipse(0, -67, 8.5, 2.3, -0.08, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(240,251,190,0.8)'; ctx.fill();
  // ahoge
  ctx.beginPath();
  ctx.moveTo(2, -70);
  ctx.quadraticCurveTo(9, -77, 14 + sway * 0.5, -74);
  ctx.quadraticCurveTo(8, -72, 5, -69);
  ctx.closePath();
  ctx.fillStyle = HAIR; ctx.fill();
  ctx.lineWidth = 1.8; ctx.strokeStyle = HAIR_O; ctx.stroke();
  ctx.restore();

  // ---- face : two eyes + a smile ----
  ctx.save();
  ctx.fillStyle = '#3E5A1C';
  ctx.beginPath(); ctx.ellipse(-5.4, -55, 2.6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5.4, -55, 2.6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.ellipse(-6.3, -56.5, 1.05, 1.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4.5, -56.5, 1.05, 1.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2.8, -48.6);
  ctx.quadraticCurveTo(0, -45.9, 2.8, -48.6);
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#9A4E4A'; ctx.stroke();
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

/* ───── a7ff0991ebb3b9c83 ───── */
/* ===== ルナ / 星読みの魔女 ===============================================
   dvP2(ctx, T)            : bust-up portrait  240 x 340 (origin = top-left)
   dvT2(ctx, col, T, face) : board token, origin = ground contact point
   plain JS / no globals / no Math.random / no Date
   ====================================================================== */

function dvP2(ctx, T) {
  var t = (T || 0);

  /* ---------- tiny helpers (prefix P_) ---------- */
  function P_mul(hex, k) {                        // scale a hex colour
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function P_ln(hex) { return P_mul(hex, 0.55); }  // outline = colour lightness -45%
  function P_lerp(a, b, u) { return a + (b - a) * u; }
  function P_ell(x, y, rx, ry, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  /* tapered strand: flat root of width w at (ax,ay) -> sharp tip at (tx,ty) */
  function P_strand(ax, ay, w, kx, ky, tx, ty, fill) {
    ctx.beginPath();
    ctx.moveTo(ax - w * 0.5, ay);
    ctx.quadraticCurveTo(kx - w * 0.32, ky, tx, ty);
    ctx.quadraticCurveTo(kx + w * 0.34, ky, ax + w * 0.5, ay);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  function P_star4(x, y, r, rot, fill) {          // sparkle
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.16, -r * 0.16, r, 0);
    ctx.quadraticCurveTo(r * 0.16, r * 0.16, 0, r);
    ctx.quadraticCurveTo(-r * 0.16, r * 0.16, -r, 0);
    ctx.quadraticCurveTo(-r * 0.16, -r * 0.16, 0, -r);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  }
  function P_star5(x, y, r, rot, fill, line) {    // solid 5-point star
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 === 0) ? r : r * 0.45;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.restore();
  }

  /* ---------- palette (3 tones per material) ---------- */
  var SKIN = '#FDE7DA', SKIN_SH = '#EDC3AC', BLUSH = '#F9A8A8', SKIN_LN = '#D19878';
  var H_ROOT = '#33205C', H_BASE = '#7A4BC4', H_TIP = '#B98CEE', H_HI = '#E0C8FC';
  var H_LN = P_ln(H_BASE), BROW = '#A278DF';
  var ROBE_A = '#6B44A8', ROBE_B = '#3A2262', ROBE_LN = P_ln(ROBE_A);
  var DARK = '#281A3E', DARK_LN = P_ln(DARK);
  var GOLD = '#F0C24B', GOLD_D = '#A87A17', GOLD_L = '#FFE9A6';
  var IRIS_T = '#B8800E', IRIS_B = '#FFD972', PUP = '#452705';
  var LASH = '#3A2145';

  /* ---------- face metrics ---------- */
  var FX = 120, FY = 131, FRX = 38, FRY = 44;   // face 76 x 88, top y=87, chin y=175
  var EW = 18.5, EH = 24.5;                     // eye box (24%W / 28%H)
  var EY = 133, EDX = 17.6;                     // eye centre y, dx (gap = 1 eye width)
  var BROWY = 112;

  /* blink: 3400ms cycle, 120ms shut */
  var ph = t % 3400, blink = 1;
  if (ph < 120) blink = Math.abs(ph / 120 - 0.5) * 2;
  var sway = Math.sin(t / 900) * 2.6;
  var sway2 = Math.sin(t / 900 + 0.9) * 1.4;

  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  /* ============ 0. soft ground shadow ============ */
  ctx.save(); ctx.globalAlpha = 0.13; ctx.fillStyle = '#2B1A47';
  P_ell(120, 331, 92, 12, 0); ctx.fill();
  ctx.restore();

  /* ============ 1. back hair mass ============ */
  (function () {
    var g = ctx.createLinearGradient(0, 74, 0, 218);
    g.addColorStop(0, H_ROOT); g.addColorStop(0.55, H_BASE); g.addColorStop(1, P_mul(H_BASE, 0.74));
    ctx.beginPath();
    ctx.moveTo(64, 128);
    ctx.bezierCurveTo(62, 82, 90, 64, 120, 64);
    ctx.bezierCurveTo(150, 64, 178, 82, 176, 128);
    ctx.bezierCurveTo(178, 168, 174, 196, 168, 214);
    ctx.lineTo(151, 200); ctx.lineTo(136, 216); ctx.lineTo(120, 201);
    ctx.lineTo(104, 216); ctx.lineTo(89, 200); ctx.lineTo(72, 214);
    ctx.bezierCurveTo(66, 196, 62, 168, 64, 128);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = H_LN; ctx.lineWidth = 2.4; ctx.stroke();
  })();

  /* ============ 2. robe / body ============ */
  (function () {
    var g = ctx.createLinearGradient(0, 190, 0, 340);
    g.addColorStop(0, ROBE_A); g.addColorStop(1, ROBE_B);
    ctx.beginPath();
    ctx.moveTo(20, 340);
    ctx.bezierCurveTo(22, 300, 27, 258, 40, 236);
    ctx.bezierCurveTo(53, 214, 76, 201, 103, 195);
    ctx.lineTo(137, 195);
    ctx.bezierCurveTo(164, 201, 187, 214, 200, 236);
    ctx.bezierCurveTo(213, 258, 218, 300, 220, 340);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = ROBE_LN; ctx.lineWidth = 2.6; ctx.stroke();

    // black inner robe (chest V)
    ctx.beginPath();
    ctx.moveTo(120, 198);
    ctx.bezierCurveTo(100, 216, 92, 264, 90, 340);
    ctx.lineTo(150, 340);
    ctx.bezierCurveTo(148, 264, 140, 216, 120, 198);
    ctx.closePath();
    ctx.fillStyle = DARK; ctx.fill();
    ctx.strokeStyle = DARK_LN; ctx.lineWidth = 2.2; ctx.stroke();

    // gold trim along the opening (mirrored)
    function P_trim(side) {
      ctx.save(); ctx.translate(120, 0); ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(0, 198); ctx.bezierCurveTo(20, 216, 28, 264, 30, 340);
      ctx.lineTo(37, 340); ctx.bezierCurveTo(35, 260, 26, 212, 4, 194);
      ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
      ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    }
    P_trim(-1); P_trim(1);

    // shoulder pauldrons (mirrored)
    function P_pauld(side) {
      ctx.save(); ctx.translate(120, 0); ctx.scale(side, 1);
      var pg = ctx.createLinearGradient(0, 200, 0, 250);
      pg.addColorStop(0, '#4E3180'); pg.addColorStop(1, DARK);
      ctx.beginPath();
      ctx.moveTo(28, 202);
      ctx.bezierCurveTo(56, 205, 78, 219, 86, 240);
      ctx.bezierCurveTo(76, 250, 44, 250, 30, 240);
      ctx.closePath();
      ctx.fillStyle = pg; ctx.fill();
      ctx.strokeStyle = DARK_LN; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, 240); ctx.bezierCurveTo(44, 250, 76, 250, 86, 240);
      ctx.lineTo(88, 246); ctx.bezierCurveTo(76, 257, 42, 257, 28, 246);
      ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
      ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.4; ctx.stroke();
      P_star5(50, 222, 6.2, 0, GOLD_L, GOLD_D);
      ctx.restore();
    }
    P_pauld(-1); P_pauld(1);
  })();

  /* ============ 3. neck ============ */
  (function () {
    ctx.beginPath();
    ctx.moveTo(108, 158); ctx.lineTo(132, 158);
    ctx.bezierCurveTo(134, 180, 138, 190, 140, 196);
    ctx.lineTo(100, 196);
    ctx.bezierCurveTo(102, 190, 106, 180, 108, 158);
    ctx.closePath();
    ctx.fillStyle = SKIN; ctx.fill();
    ctx.strokeStyle = P_ln(SKIN); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = SKIN_SH; ctx.globalAlpha = 0.85;
    P_ell(120, 157, 30, 18, 0); ctx.fill();
    ctx.restore();
  })();

  /* ============ 4. stand-up collar + pendant ============ */
  (function () {
    ctx.beginPath();
    ctx.moveTo(92, 200);
    ctx.bezierCurveTo(94, 166, 112, 156, 120, 156);
    ctx.bezierCurveTo(128, 156, 146, 166, 148, 200);
    ctx.bezierCurveTo(140, 190, 100, 190, 92, 200);
    ctx.closePath();
    ctx.fillStyle = DARK; ctx.fill();
    ctx.strokeStyle = DARK_LN; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(92, 200); ctx.bezierCurveTo(100, 190, 140, 190, 148, 200);
    ctx.lineTo(146, 206); ctx.bezierCurveTo(138, 197, 102, 197, 94, 206);
    ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.4; ctx.stroke();
    function P_wing(side) {
      ctx.save(); ctx.translate(120, 0); ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(2, 200); ctx.lineTo(32, 205); ctx.lineTo(16, 240);
      ctx.closePath();
      ctx.fillStyle = '#4E3180'; ctx.fill();
      ctx.strokeStyle = DARK_LN; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.restore();
    }
    P_wing(-1); P_wing(1);
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(120, 206); ctx.lineTo(120, 242); ctx.stroke();
    ctx.beginPath(); ctx.arc(120, 252, 11, 0, Math.PI * 2);
    ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(120, 252, 7.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2B1A47'; ctx.fill();
    P_star5(120, 252, 5.6, 0, GOLD_L, null);
  })();

  /* ============ 5. face ============ */
  (function () {
    ctx.beginPath();                              // inverted egg
    ctx.moveTo(FX - FRX, FY - 8);
    ctx.bezierCurveTo(FX - FRX - 1, FY - 36, FX - 23, FY - FRY, FX, FY - FRY);
    ctx.bezierCurveTo(FX + 23, FY - FRY, FX + FRX + 1, FY - 36, FX + FRX, FY - 8);
    ctx.bezierCurveTo(FX + FRX - 2, FY + 18, FX + 19, FY + FRY - 4, FX, FY + FRY);
    ctx.bezierCurveTo(FX - 19, FY + FRY - 4, FX - FRX + 2, FY + 18, FX - FRX, FY - 8);
    ctx.closePath();
    ctx.fillStyle = SKIN; ctx.fill();
    ctx.strokeStyle = P_ln(SKIN); ctx.lineWidth = 2.3; ctx.stroke();

    ctx.save(); ctx.clip();
    ctx.globalAlpha = 0.55; ctx.fillStyle = SKIN_SH;   // one shade step only
    ctx.beginPath();                                    // shadow cast by the fringe
    ctx.moveTo(70, 78); ctx.lineTo(170, 78); ctx.lineTo(170, 120);
    ctx.bezierCurveTo(152, 132, 140, 118, 120, 124);
    ctx.bezierCurveTo(100, 130, 88, 118, 70, 126);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.4;                              // jaw shading
    P_ell(FX - 41, FY + 6, 12, 30, 0.15); ctx.fill();
    P_ell(FX + 41, FY + 6, 12, 30, -0.15); ctx.fill();
    ctx.restore();
  })();

  /* ---- blush (mirrored) ---- */
  function P_blush(side) {
    ctx.save(); ctx.translate(FX, 0); ctx.scale(side, 1);
    ctx.globalAlpha = 0.5; ctx.fillStyle = BLUSH;
    P_ell(27, 149, 12.5, 7, -0.12); ctx.fill();
    ctx.save();                                    // hatching stays inside the blush
    P_ell(27, 149, 12.5, 7, -0.12); ctx.clip();
    ctx.globalAlpha = 0.6; ctx.strokeStyle = BLUSH; ctx.lineWidth = 1.4;
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(21 + i * 6, 143 + i * 1.4);
      ctx.lineTo(26 + i * 6, 156 + i * 1.4);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  /* ---- eye: one function, mirrored (side -1 = screen-left) ---- */
  function P_eye(side, open) {
    var w = EW, h = EH;
    ctx.save();
    ctx.translate(FX + side * EDX, EY);
    ctx.scale(side, 1);                     // local +x always points at the temple

    var icy = h * 0.08, ocy = -h * 0.16;    // inner / outer corner
    var topPeak = -h * 0.52, botPeak = h * 0.42;
    function P_cy(iy, oy, pk) { return (8 * pk - iy - oy) / 6; }   // exact bezier apex

    ctx.save();
    ctx.beginPath();                        // eye socket (fixed almond)
    ctx.moveTo(-w * 0.5, icy);
    var c1 = P_cy(icy, ocy, topPeak);
    ctx.bezierCurveTo(-w * 0.30, c1, w * 0.14, c1, w * 0.5, ocy);
    var c2 = P_cy(ocy, icy, botPeak);
    ctx.bezierCurveTo(w * 0.22, c2, -w * 0.20, c2, -w * 0.5, icy);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#F7F2FA'; ctx.fillRect(-w, -h, w * 2, h * 2);   // sclera
    ctx.fillStyle = '#D6C9E2'; ctx.globalAlpha = 0.8;               // lid shade
    P_ell(0, -h * 0.62, w * 0.78, h * 0.34, 0); ctx.fill();
    ctx.globalAlpha = 1;

    var irx = w * 0.41, iry = h * 0.42, ix = -w * 0.02, iy = -h * 0.01;
    var ig = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);     // 2-stop vertical
    ig.addColorStop(0, P_mul(IRIS_T, 0.7)); ig.addColorStop(0.45, IRIS_T);
    ig.addColorStop(1, IRIS_B);
    P_ell(ix, iy, irx, iry, 0); ctx.fillStyle = ig; ctx.fill();
    P_ell(ix, iy, irx, iry, 0);
    ctx.strokeStyle = P_mul(IRIS_T, 0.5); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.save(); P_ell(ix, iy, irx, iry, 0); ctx.clip();
    ctx.globalAlpha = 0.7; ctx.fillStyle = '#FFF0BE';
    P_ell(ix, iy + iry * 0.55, irx * 0.8, iry * 0.42, 0); ctx.fill();
    ctx.restore();
    P_ell(ix, iy, irx * 0.45, iry * 0.45, 0); ctx.fillStyle = PUP; ctx.fill();

    // highlights: `side` folded in so the light source stays screen-upper-left
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ix + side * (-irx * 0.34), iy - iry * 0.36, iry * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(ix + side * (irx * 0.40), iy + iry * 0.40, iry * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // skin-coloured lid slides down as `open` shrinks (narrowing + blinking)
    var u = 1 - open;
    var lIcy = icy + u * h * 0.10, lOcy = ocy + u * h * 0.30;
    var lPk = P_lerp(topPeak, h * 0.18, u);
    var lc = P_cy(lIcy, lOcy, lPk);
    ctx.beginPath();
    ctx.moveTo(-w * 0.7, -h * 1.4); ctx.lineTo(-w * 0.7, lIcy);
    ctx.bezierCurveTo(-w * 0.30, lc, w * 0.14, lc, w * 0.7, lOcy);
    ctx.lineTo(w * 0.7, -h * 1.4);
    ctx.closePath(); ctx.fillStyle = SKIN; ctx.fill();
    ctx.restore();                          // release clip

    // lower lid: thin, outer 2/3 only
    ctx.beginPath();
    ctx.moveTo(w * 0.40, ocy + h * 0.18);
    ctx.bezierCurveTo(w * 0.20, c2, -w * 0.04, c2 * 0.98, -w * 0.26, h * 0.30);
    ctx.strokeStyle = P_mul(LASH, 1.7); ctx.lineWidth = 1.5; ctx.stroke();

    // upper lid: filled taper — thick at the temple, thin at the nose
    ctx.beginPath();
    ctx.moveTo(-w * 0.52, lIcy);
    ctx.bezierCurveTo(-w * 0.30, lc, w * 0.14, lc, w * 0.52, lOcy);
    ctx.bezierCurveTo(w * 0.34, lOcy + 5.4, w * 0.06, lc + 4.4, -w * 0.30, lc + 2.6);
    ctx.lineTo(-w * 0.52, lIcy + 1.5);
    ctx.closePath(); ctx.fillStyle = LASH; ctx.fill();

    // eyelashes at the outer corner (female: 3)
    var lx = w * 0.50, ly = lOcy;
    var las = [[7.6, -6.2, 2.6], [7.2, -1.4, 2.1], [5.4, 2.8, 1.7]];
    for (var i = 0; i < las.length; i++) {
      ctx.beginPath();
      ctx.moveTo(lx - 1, ly - 1 + i * 1.2);
      ctx.quadraticCurveTo(lx + las[i][0] * 0.55, ly + las[i][1] * 0.35,
        lx + las[i][0], ly + las[i][1]);
      ctx.lineTo(lx + las[i][0] * 0.5, ly + las[i][1] * 0.5 + las[i][2]);
      ctx.closePath(); ctx.fillStyle = LASH; ctx.fill();
    }
    ctx.restore();
  }

  /* ---- eyebrow (mirrored) ---- */
  function P_brow(side, dy, arch) {
    ctx.save();
    ctx.translate(FX + side * EDX, BROWY + dy); ctx.scale(side, 1);
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(-9, 3.2);
    ctx.quadraticCurveTo(-1, -3.6 + arch, 10.5, 0.4 + arch * 0.5);
    ctx.lineTo(10.5, 1.8 + arch * 0.5);
    ctx.quadraticCurveTo(-1, -0.8 + arch, -9, 6.6);
    ctx.closePath();
    ctx.fillStyle = BROW; ctx.fill();
    ctx.restore();
  }

  /* ---- face parts ---- */
  P_blush(-1); P_blush(1);
  P_eye(-1, blink);                 // open eye
  P_eye(1, 0.38 * blink);           // narrowed, mischievous eye

  ctx.save();                       // nose: a 2px hint only
  ctx.globalAlpha = 0.7; ctx.strokeStyle = SKIN_LN; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(120.6, 147.6); ctx.lineTo(123.4, 150.2); ctx.stroke();
  ctx.restore();

  (function () {                    // mouth: small open smirk
    ctx.beginPath();
    ctx.moveTo(115.2, 160.4);
    ctx.quadraticCurveTo(120.8, 158.9, 126.6, 157.5);
    ctx.quadraticCurveTo(124.8, 166.2, 120.4, 165.9);
    ctx.quadraticCurveTo(116.7, 165.5, 115.2, 160.4);
    ctx.closePath();
    ctx.fillStyle = '#8C3852'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#E4788D'; P_ell(121, 166, 4, 2.2, 0); ctx.fill();
    ctx.fillStyle = '#FFF7FA';
    ctx.beginPath();
    ctx.moveTo(115.2, 160.4); ctx.quadraticCurveTo(120.8, 158.9, 126.6, 157.5);
    ctx.lineTo(126.6, 159.8); ctx.quadraticCurveTo(120.8, 161.2, 115.2, 162.6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(115.0, 160.4); ctx.quadraticCurveTo(120.8, 158.9, 126.8, 157.4);
    ctx.strokeStyle = SKIN_LN; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.75;      // smirk lift on the winking side
    ctx.beginPath();
    ctx.moveTo(126.8, 157.6); ctx.quadraticCurveTo(129.6, 156.8, 130.0, 154.6);
    ctx.strokeStyle = SKIN_LN; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.restore();
  })();

  /* ============ 6. fringe (one silhouette + tips, no gaps) ============ */
  (function () {
    var s = sway2;
    var g = ctx.createLinearGradient(0, 76, 0, 150);
    g.addColorStop(0, H_ROOT); g.addColorStop(0.5, H_BASE); g.addColorStop(1, H_TIP);
    ctx.beginPath();
    ctx.moveTo(72, 120);
    ctx.bezierCurveTo(70, 84, 94, 66, 120, 66);
    ctx.bezierCurveTo(146, 66, 170, 84, 168, 120);
    // shallow, irregular pointed edge, right -> left (deep notches read as fangs)
    ctx.quadraticCurveTo(170, 140, 165 + s * 1.2, 158);   // right side lock tip
    ctx.quadraticCurveTo(160, 138, 156, 126);
    ctx.quadraticCurveTo(154, 132, 147 - s, 137);         // tip
    ctx.quadraticCurveTo(144, 129, 140, 121);
    ctx.quadraticCurveTo(138, 128, 131 - s * 0.6, 134);   // tip
    ctx.quadraticCurveTo(128, 126, 125, 118);             // centre part
    ctx.quadraticCurveTo(120, 126, 115 + s * 0.6, 132);   // tip
    ctx.quadraticCurveTo(111, 127, 108, 120);
    ctx.quadraticCurveTo(105, 130, 99 + s, 136);          // tip
    ctx.quadraticCurveTo(93, 130, 89, 123);
    ctx.quadraticCurveTo(80, 138, 75 + s * 1.2, 158);     // left side lock tip
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = H_LN; ctx.lineWidth = 2.3; ctx.stroke();

    // second layer of front locks: darker value, no inner outlines
    var gd = ctx.createLinearGradient(0, 86, 0, 152);
    gd.addColorStop(0, P_mul(H_ROOT, 1.05)); gd.addColorStop(1, P_mul(H_BASE, 0.9));
    ctx.save(); ctx.globalAlpha = 0.9;
    P_strand(101, 86, 24, 96 + s, 108, 99 + s * 1.2, 124, gd);
    P_strand(139, 86, 24, 144 - s, 108, 141 - s * 1.2, 123, gd);
    P_strand(120, 84, 17, 123 - s * 0.5, 108, 121 - s, 136, gd);
    ctx.restore();

    // light band across the crown of the fringe
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = H_HI;
    ctx.beginPath();
    ctx.moveTo(84, 104);
    ctx.bezierCurveTo(100, 96, 140, 96, 156, 105);
    ctx.bezierCurveTo(153, 111, 150, 113, 148, 114);
    ctx.bezierCurveTo(136, 105, 104, 105, 90, 112);
    ctx.closePath(); ctx.fill(); ctx.restore();
  })();

  /* ---- eyebrows sit over the fringe (standard anime readability) ---- */
  P_brow(-1, 0, 0);
  P_brow(1, 2.2, 1.6);

  /* ============ 7. twintails (in front of the shoulders) ============ */
  function P_tail(side, sw) {
    ctx.save(); ctx.translate(FX, 118); ctx.scale(side, 1);
    var g = ctx.createLinearGradient(0, -6, 0, 184);
    g.addColorStop(0, H_ROOT); g.addColorStop(0.42, H_BASE);
    g.addColorStop(1, P_mul(H_TIP, 0.93));
    ctx.beginPath();                              // tapered tail, flared outward
    ctx.moveTo(28, -6);
    ctx.bezierCurveTo(58, -6, 76, 14, 80 + sw, 50);
    ctx.bezierCurveTo(88 + sw, 96, 94 + sw, 130, 88 + sw * 1.8, 174);
    ctx.bezierCurveTo(74 + sw * 1.5, 146, 62 + sw, 108, 52, 70);
    ctx.bezierCurveTo(46, 40, 30, 14, 28, -6);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = H_LN; ctx.lineWidth = 2.4; ctx.stroke();

    ctx.save(); ctx.clip();                       // shading stays inside the silhouette
    ctx.globalAlpha = 0.5;                        // inner-edge shadow (volume)
    ctx.fillStyle = P_mul(H_BASE, 0.55);
    ctx.beginPath();
    ctx.moveTo(28, -8);
    ctx.bezierCurveTo(46, 30, 60, 100, 90, 178);
    ctx.lineTo(70, 168);
    ctx.bezierCurveTo(44, 100, 32, 30, 14, -8);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.45; ctx.fillStyle = H_HI;  // light band, upper outer
    ctx.beginPath();
    ctx.moveTo(42, 24);
    ctx.bezierCurveTo(60, 28, 70 + sw * 0.5, 44, 74 + sw * 0.6, 64);
    ctx.bezierCurveTo(64 + sw * 0.6, 50, 52, 40, 40, 40);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  P_tail(-1, sway); P_tail(1, -sway);

  /* ============ 8. ribbons ============ */
  function P_ribbon(side, sw) {
    ctx.save(); ctx.translate(FX + side * 51, 124); ctx.scale(side, 1);
    ctx.rotate(sw * 0.012);
    ctx.beginPath();                                   // hanging tails
    ctx.moveTo(-4, 4); ctx.quadraticCurveTo(-12, 20, -8, 38);
    ctx.lineTo(2, 34); ctx.quadraticCurveTo(0, 18, 4, 4);
    ctx.closePath(); ctx.fillStyle = P_mul(GOLD, 0.82); ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 4); ctx.quadraticCurveTo(14, 20, 16, 40);
    ctx.lineTo(6, 38); ctx.quadraticCurveTo(4, 20, -2, 6);
    ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath();                                   // upper loop
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(6, -20, 28, -22, 33, -9);
    ctx.bezierCurveTo(36, 1, 15, 5, 0, 0);
    ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();                                   // lower loop
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(4, 12, 22, 19, 29, 10);
    ctx.bezierCurveTo(33, 3, 14, -3, 0, 0);
    ctx.closePath(); ctx.fillStyle = P_mul(GOLD, 0.86); ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = GOLD_L;
    P_ell(18, -12, 8, 3.2, -0.22); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = P_mul(GOLD, 0.9); ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 2; ctx.stroke();
    P_star5(0, 0, 4.4, 0, GOLD_L, null);
    ctx.restore();
  }
  P_ribbon(-1, sway); P_ribbon(1, -sway);

  /* ============ 9. witch hat ============ */
  (function () {
    ctx.save();
    ctx.translate(120, 97); ctx.rotate(-0.12);
    var cg = ctx.createLinearGradient(-30, -70, 42, 0);
    cg.addColorStop(0, '#402A69'); cg.addColorStop(0.5, '#31204F'); cg.addColorStop(1, '#1D1231');
    function P_cone() {
      ctx.beginPath();
      ctx.moveTo(-31, -6);
      ctx.bezierCurveTo(-18, -52, 14, -68, 42, -72);
      ctx.bezierCurveTo(38, -58, 34, -28, 31, -6);
      ctx.closePath();
    }
    P_cone(); ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = DARK_LN; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.save(); P_cone(); ctx.clip();                   // gold hat band
    ctx.beginPath();
    ctx.moveTo(-34, -8); ctx.quadraticCurveTo(0, -4, 34, -14);
    ctx.lineTo(34, -28); ctx.quadraticCurveTo(0, -18, -34, -22);
    ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.restore();

    var bg = ctx.createLinearGradient(0, -20, 0, 10);    // brim
    bg.addColorStop(0, '#4A2F79'); bg.addColorStop(0.6, '#31204F'); bg.addColorStop(1, '#1D1231');
    ctx.beginPath(); ctx.ellipse(0, -6, 70, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = DARK_LN; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.32; ctx.fillStyle = '#8A69C9';
    P_ell(-6, -11, 56, 6, 0); ctx.fill(); ctx.restore();

    P_star5(20, -36, 7.2, 0.15, GOLD, GOLD_D);
    P_star5(6, -52, 4.6, -0.3, GOLD_L, null);
    P_star5(34, -56, 3.4, 0.4, GOLD_L, null);
    ctx.beginPath(); ctx.arc(42, -72, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = GOLD; ctx.fill();
    ctx.restore();
  })();

  /* ============ 10. floating sparkles ============ */
  (function () {
    var sp = [[30, 118, 6], [210, 136, 5], [24, 214, 4.4], [216, 208, 5.6],
    [52, 62, 4.2], [192, 52, 5], [150, 300, 4.4], [86, 304, 3.8]];
    ctx.save();
    for (var i = 0; i < sp.length; i++) {
      var a = 0.30 + 0.42 * (0.5 + 0.5 * Math.sin(t / 470 + i * 1.7));
      ctx.globalAlpha = a;
      P_star4(sp[i][0], sp[i][1], sp[i][2] * (0.8 + 0.3 * a), i * 0.6, '#FFF0BE');
    }
    ctx.restore();
  })();

  ctx.restore();
}


/* =====================================================================
   dvT2 : board token — 2.5-head chibi, origin = ground contact point
   ===================================================================== */
function dvT2(ctx, col, T, facing) {
  var t = (T || 0), f = (facing === -1) ? -1 : 1;
  var c = (typeof col === 'string' && col.charAt(0) === '#' && col.length === 7) ? col : '#8B5CD6';

  function K_mul(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function K_ln(hex) { return K_mul(hex, 0.55); }
  function K_star(x, y, r, rot, fill) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 === 0) ? r : r * 0.45;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  }

  var SKIN = '#FDE7DA', SKIN_LN = '#D19878';
  var H_ROOT = '#3B2668', H_BASE = '#7A4BC4', H_TIP = '#B98CEE', H_LN = '#2A1745';
  var DARK = '#281A3E', DARK_LN = '#150B20';
  var GOLD = '#F0C24B', GOLD_D = '#A87A17';

  var bob = Math.sin(t * Math.PI / 1000) * 1.5;   // 2s period, +/-1.5px
  var sw = Math.sin(t / 760) * 1.6;

  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  /* contact shadow (does not bob) */
  ctx.save(); ctx.globalAlpha = 0.26; ctx.fillStyle = '#1B1030';
  ctx.beginPath(); ctx.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.9;              // owner-colour ring
  ctx.beginPath(); ctx.ellipse(0, -0.5, 15, 5, 0, 0, Math.PI * 2);
  ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.restore();

  ctx.translate(0, bob);
  ctx.scale(f, 1);

  /* ---- body / robe (drawn first so the tails can hang in front) ---- */
  (function () {
    var g = ctx.createLinearGradient(0, -32, 0, -1);
    g.addColorStop(0, '#6B44A8'); g.addColorStop(1, '#331E56');
    ctx.beginPath();
    ctx.moveTo(-8, -33); ctx.lineTo(8, -33);
    ctx.bezierCurveTo(14, -24, 17, -10, 17, -2);
    ctx.quadraticCurveTo(0, 2, -17, -2);
    ctx.bezierCurveTo(-17, -10, -14, -24, -8, -33);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = K_ln('#6B44A8'); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();                               // owner-colour front panel
    ctx.moveTo(0, -32);
    ctx.bezierCurveTo(-6, -24, -7, -10, -7, -1.6);
    ctx.quadraticCurveTo(0, 0.4, 7, -1.6);
    ctx.bezierCurveTo(7, -10, 6, -24, 0, -32);
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = K_ln(c); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath();                               // gold hem
    ctx.moveTo(-17, -3.4); ctx.quadraticCurveTo(0, 0.8, 17, -3.4);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.beginPath();                               // collar
    ctx.moveTo(-9, -32); ctx.quadraticCurveTo(0, -28, 9, -32);
    ctx.lineTo(8, -35); ctx.quadraticCurveTo(0, -31, -8, -35);
    ctx.closePath(); ctx.fillStyle = DARK; ctx.fill();
    K_star(0, -25, 3.4, 0, GOLD);
  })();

  /* ---- twintails: hang in front of the shoulders so the silhouette reads ---- */
  function K_tail(side) {
    ctx.save(); ctx.scale(side, 1);
    var g = ctx.createLinearGradient(0, -54, 0, -6);
    g.addColorStop(0, H_ROOT); g.addColorStop(0.45, H_BASE); g.addColorStop(1, H_TIP);
    ctx.beginPath();
    ctx.moveTo(8, -55);
    ctx.bezierCurveTo(17, -54, 19 + sw * 0.3, -42, 19 + sw * 0.4, -30);
    ctx.bezierCurveTo(19 + sw * 0.5, -20, 17 + sw * 0.7, -13, 15 + sw * 0.8, -6);
    ctx.bezierCurveTo(13 + sw * 0.7, -16, 11, -30, 7, -44);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = H_LN; ctx.lineWidth = 1.7; ctx.stroke();
    ctx.save(); ctx.clip();                        // inner shadow for volume
    ctx.globalAlpha = 0.42; ctx.fillStyle = K_mul(H_BASE, 0.55);
    ctx.beginPath();
    ctx.moveTo(7, -46); ctx.bezierCurveTo(12, -32, 14, -18, 16, -5);
    ctx.lineTo(9, -8); ctx.bezierCurveTo(7, -22, 4, -34, 2, -46);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  K_tail(-1); K_tail(1);

  /* ---- head ---- */
  ctx.beginPath(); ctx.ellipse(0, -44, 15, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.strokeStyle = SKIN_LN; ctx.lineWidth = 1.8; ctx.stroke();

  /* ---- fringe: one silhouette, shallow pointed tips ---- */
  (function () {
    var g = ctx.createLinearGradient(0, -60, 0, -40);
    g.addColorStop(0, H_ROOT); g.addColorStop(1, H_BASE);
    ctx.beginPath();
    ctx.moveTo(-15, -45);
    ctx.bezierCurveTo(-16, -58, -8, -60, 0, -60);
    ctx.bezierCurveTo(8, -60, 16, -58, 15, -45);
    ctx.quadraticCurveTo(14, -41, 12, -37);        // right side lock
    ctx.quadraticCurveTo(10, -46, 8.5, -50);
    ctx.quadraticCurveTo(7, -48, 4, -45.5);        // tip
    ctx.quadraticCurveTo(2, -49, 0, -52);
    ctx.quadraticCurveTo(-2.5, -49, -5, -45.5);    // tip
    ctx.quadraticCurveTo(-7, -48, -9, -51);
    ctx.quadraticCurveTo(-11, -43, -13, -37);      // left side lock
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = H_LN; ctx.lineWidth = 1.7; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#E0C8FC';  // light band
    ctx.beginPath();
    ctx.moveTo(-10, -54); ctx.quadraticCurveTo(0, -58, 10, -54);
    ctx.quadraticCurveTo(0, -55.5, -10, -51.5);
    ctx.closePath(); ctx.fill(); ctx.restore();
  })();

  /* ---- face: two eyes + mouth only ---- */
  (function () {
    ctx.beginPath(); ctx.ellipse(-5.6, -41, 2.6, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3A2145'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6.3, -42.3, 1.1, 1.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.ellipse(-5.1, -39.8, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD972'; ctx.fill(); ctx.restore();
    ctx.beginPath();                               // narrowed / winking eye
    ctx.moveTo(3.0, -40.2); ctx.quadraticCurveTo(5.6, -43.8, 8.2, -40.2);
    ctx.strokeStyle = '#3A2145'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();                               // mouth
    ctx.moveTo(-1.8, -36.2); ctx.quadraticCurveTo(0.4, -34.0, 2.6, -36.6);
    ctx.strokeStyle = '#A8465F'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#F9A8A8';
    ctx.beginPath(); ctx.ellipse(-10.0, -37.6, 3, 1.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10.0, -37.6, 3, 1.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  })();

  /* ---- ribbons (cover the tail roots) ---- */
  function K_ribbon(side) {
    ctx.save(); ctx.translate(side * 10.5, -50); ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(2, -6.5, 8.6, -7.4, 9.6, -2);
    ctx.bezierCurveTo(10.4, 2.6, 4.6, 3.6, 0, 0);
    ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(1, 4.6, 7, 7.2, 8.8, 2.8);
    ctx.bezierCurveTo(9.6, -0.9, 3.6, -2.7, 0, 0);
    ctx.closePath(); ctx.fillStyle = K_mul(GOLD, 0.86); ctx.fill();
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_D; ctx.fill();
    ctx.restore();
  }
  K_ribbon(-1); K_ribbon(1);

  /* ---- witch hat (tip lands at about -72 including the bob) ---- */
  (function () {
    ctx.save(); ctx.translate(0, -56); ctx.rotate(-0.12);
    var g = ctx.createLinearGradient(-10, -13, 11, 0);
    g.addColorStop(0, '#3B2660'); g.addColorStop(1, '#1E1333');
    function K_cone() {
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.bezierCurveTo(-6, -9, 5, -12, 13, -12.5);
      ctx.bezierCurveTo(11, -9, 10, -4, 10, 0);
      ctx.closePath();
    }
    K_cone(); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = DARK_LN; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 18.5, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#33204F'; ctx.fill();
    ctx.strokeStyle = DARK_LN; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.save(); K_cone(); ctx.clip();               // owner-colour hat band
    ctx.beginPath();
    ctx.moveTo(-12, -1); ctx.quadraticCurveTo(0, 1, 12, -3.6);
    ctx.lineTo(12, -6.8); ctx.quadraticCurveTo(0, -2.7, -12, -4.6);
    ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    ctx.restore();
    K_star(5.2, -8, 2.9, 0.2, GOLD);
    ctx.restore();
  })();

  ctx.restore();
}

/* ───── a9d0e71851fa58e0b ───── */
/* ===========================================================
   サクラ / 桜花の剣姫
   dvP6(ctx, T)              : バストアップ肖像 240 x 340（左上原点）
   dvT6(ctx, col, T, facing) : 盤上コマ 2.5頭身（(0,0)=接地点・上へ約72px）
   =========================================================== */

function dvP6(ctx, T) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;

  /* ---- 骨格の数値 ---------------------------------------- */
  var CX = 120;      // 顔の中心線
  var FTOP = 58;     // 肌の頭頂
  var FCHIN = 176;   // あご
  var FHW = 45;      // 顔の半幅（頬骨）— 顔幅90 / 顔高118 ≒ 1:1.31
  var EY = 120;      // 目の中心 y = FTOP + 0.52 * 顔高
  var EX = 142;      // 右目の中心 x（間隔 22 = 目幅1つぶん）
  var EW = 11;       // 目の半幅（幅22 = 顔幅の24%／高27 = 顔高の23%）

  /* ---- 色（輪郭線＝各部位の暗色） ------------------------- */
  var SK = '#FDE7DA', SKS = '#EDC3AC', SKL = '#C99B84';
  var HR = '#F4AEC8', HRS = '#DA8DAB', HRD = '#B96A8B', HRL = '#FFDCE9', HRO = '#9C4F70';
  var IR_T = '#B3416A', IR_M = '#DA6E92', IR_B = '#F896B2', PUP = '#4E1730', LID = '#6E2340';
  var WH = '#FDF9F8', WHS = '#E7D8DC', WHO = '#A98D97';
  var PK = '#F3AFC6', PKS = '#D2809F', PKO = '#A6597A';
  var GD = '#E9C777', GDS = '#B7913F';

  /* ---- T から作る決定的な動き ---------------------------- */
  var sway = Math.sin(t / 900) * 2.0;                  // 毛先の揺れ
  var bt = ((t % 3400) + 3400) % 3400;                  // まばたき周期 3.4 秒
  var open = bt < 120 ? Math.abs(bt - 60) / 60 : 1;     // 120ms かけて閉じ開き
  if (open < 0.05) open = 0.05;

  /* ---- 内部ヘルパー（p6 接頭辞で閉じ込め） ---------------- */
  function p6mirror(fn) {
    // 片側を描く関数を x=CX で反転して2回呼ぶ（左右対称の担保）
    fn();
    ctx.save();
    ctx.translate(CX * 2, 0);
    ctx.scale(-1, 1);
    fn();
    ctx.restore();
  }
  function p6grad(x0, y0, x1, y1, a, b) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, a); g.addColorStop(1, b); return g;
  }
  function p6lock(rx, ry, w, tx, ty, c1x, c1y, c2x, c2y) {
    // 房：根元(rx±w) から先端(tx,ty) へ。先は必ず尖る
    ctx.beginPath();
    ctx.moveTo(rx - w, ry);
    ctx.quadraticCurveTo(c1x, c1y, tx, ty);
    ctx.quadraticCurveTo(c2x, c2y, rx + w, ry);
    ctx.closePath();
  }
  function p6leaf(ax, ay, bx, by, c1x, c1y, c2x, c2y) {
    // 両端が尖った毛束
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(c1x, c1y, bx, by);
    ctx.quadraticCurveTo(c2x, c2y, ax, ay);
    ctx.closePath();
  }
  function p6sakura(scale, petalTop, petalBot, edge) {
    // 桜（原点中心・半径 16*scale）
    for (var k = 0; k < 5; k++) {
      ctx.save();
      ctx.rotate(-0.45 + k * (Math.PI * 2 / 5));
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-6.5, -6, -8, -13, -3, -16);
      ctx.lineTo(0, -12.6);
      ctx.lineTo(3, -16);
      ctx.bezierCurveTo(8, -13, 6.5, -6, 0, 0);
      ctx.closePath();
      var pg = ctx.createLinearGradient(0, 0, 0, -16);
      pg.addColorStop(0, petalBot); pg.addColorStop(1, petalTop);
      ctx.fillStyle = pg; ctx.fill();
      ctx.strokeStyle = edge; ctx.lineWidth = 1.8 / scale; ctx.stroke();
      ctx.restore();
    }
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  /* =========================================================
     1. 足元のごく薄い影
     ========================================================= */
  ctx.save();
  var sg = ctx.createRadialGradient(CX, 333, 4, CX, 333, 88);
  sg.addColorStop(0, 'rgba(110,60,85,0.18)');
  sg.addColorStop(1, 'rgba(110,60,85,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(CX, 333, 88, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* =========================================================
     2. 肩の後ろへ回り込む髪（首の脇に背景が抜けないようにする土台）
     ========================================================= */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(62, 150);
  ctx.bezierCurveTo(46, 190, 42, 228, 46 + sway, 270);
  ctx.quadraticCurveTo(60 + sway, 250, 72 + sway, 268);
  ctx.quadraticCurveTo(88 + sway, 246, 102 + sway, 266);
  ctx.quadraticCurveTo(112 + sway, 250, CX, 264);
  ctx.quadraticCurveTo(128 + sway, 250, 138 + sway, 266);
  ctx.quadraticCurveTo(152 + sway, 246, 168 + sway, 268);
  ctx.quadraticCurveTo(180 + sway, 250, 194 + sway, 270);
  ctx.bezierCurveTo(198, 228, 194, 190, 178, 150);
  ctx.closePath();
  ctx.fillStyle = p6grad(CX, 150, CX, 268, HRD, HRS);
  ctx.fill();
  ctx.strokeStyle = HRO; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.restore();

  /* =========================================================
     3. 後ろ髪（ボブのシルエット）
     ========================================================= */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX, 22);
  ctx.bezierCurveTo(174, 22, 195, 72, 193, 122);
  ctx.bezierCurveTo(192, 156, 191, 190, 190 + sway, 226);
  ctx.quadraticCurveTo(184 + sway, 212, 177 + sway, 214);
  ctx.quadraticCurveTo(171 + sway, 226, 164 + sway, 222);
  ctx.quadraticCurveTo(157 + sway, 202, 151 + sway, 206);
  ctx.quadraticCurveTo(145 + sway, 218, 138 + sway, 214);
  ctx.quadraticCurveTo(131 + sway, 198, 125 + sway, 202);
  ctx.quadraticCurveTo(122 + sway, 208, CX, 210);
  ctx.quadraticCurveTo(118 - sway, 208, 115 - sway, 202);
  ctx.quadraticCurveTo(109 - sway, 198, 102 - sway, 214);
  ctx.quadraticCurveTo(95 - sway, 218, 89 - sway, 206);
  ctx.quadraticCurveTo(83 - sway, 202, 76 - sway, 222);
  ctx.quadraticCurveTo(69 - sway, 226, 63 - sway, 214);
  ctx.quadraticCurveTo(56 - sway, 212, 50 - sway, 226);
  ctx.bezierCurveTo(49, 190, 48, 156, 47, 122);
  ctx.bezierCurveTo(45, 72, 66, 22, CX, 22);
  ctx.closePath();
  ctx.fillStyle = p6grad(CX, 22, CX, 226, HRD, HR);
  ctx.fill();
  ctx.strokeStyle = HRO; ctx.lineWidth = 2.4; ctx.stroke();
  // 顔の後ろは一段暗く（影1段）
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = HRS;
  ctx.beginPath();
  ctx.ellipse(CX, 138, 50, 56, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();

  /* =========================================================
     4. 羽織（薄いピンク）
     ========================================================= */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX, 202);
  ctx.bezierCurveTo(84, 204, 48, 218, 33, 254);
  ctx.bezierCurveTo(23, 282, 18, 314, 15, 340);
  ctx.lineTo(225, 340);
  ctx.bezierCurveTo(222, 314, 217, 282, 207, 254);
  ctx.bezierCurveTo(192, 218, 156, 204, CX, 202);
  ctx.closePath();
  ctx.fillStyle = p6grad(CX, 206, CX, 340, '#FDE8EF', '#EEB2CA');
  ctx.fill();
  ctx.strokeStyle = '#C0819C'; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = PKS; ctx.lineWidth = 2.2;
  p6mirror(function () {
    ctx.beginPath();
    ctx.moveTo(182, 246);
    ctx.quadraticCurveTo(199, 292, 203, 340);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  /* =========================================================
     5. 首
     ========================================================= */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(104, 158);
  ctx.lineTo(101, 208);
  ctx.lineTo(139, 208);
  ctx.lineTo(136, 158);
  ctx.closePath();
  ctx.fillStyle = SK; ctx.fill();
  ctx.strokeStyle = SKL; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = SKS;
  ctx.beginPath();
  ctx.ellipse(CX, 158, 30, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  /* =========================================================
     6. 体（白と桜色の和装鎧）
     ========================================================= */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX, 195);
  ctx.bezierCurveTo(97, 197, 69, 204, 54, 232);
  ctx.bezierCurveTo(42, 262, 35, 302, 33, 340);
  ctx.lineTo(207, 340);
  ctx.bezierCurveTo(205, 302, 198, 262, 186, 232);
  ctx.bezierCurveTo(171, 204, 143, 197, CX, 195);
  ctx.closePath();
  ctx.fillStyle = p6grad(CX, 199, CX, 340, WH, WHS);
  ctx.fill();
  ctx.strokeStyle = WHO; ctx.lineWidth = 2.4; ctx.stroke();
  // 胸当ての影1段（左右対称）
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = WHS;
  p6mirror(function () {
    ctx.beginPath();
    ctx.moveTo(186, 232);
    ctx.bezierCurveTo(196, 266, 202, 302, 204, 340);
    ctx.lineTo(174, 340);
    ctx.bezierCurveTo(176, 300, 172, 264, 163, 240);
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();

  /* --- 和装の衿（外=桜色 / 内=白 / 縁=金） --- */
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = PKS; ctx.lineWidth = 23;
  ctx.beginPath(); ctx.moveTo(71, 208); ctx.lineTo(CX, 302); ctx.lineTo(169, 208); ctx.stroke();
  ctx.strokeStyle = PK; ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(72, 206); ctx.lineTo(CX, 298); ctx.lineTo(168, 206); ctx.stroke();
  ctx.strokeStyle = WH; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(87, 203); ctx.lineTo(CX, 285); ctx.lineTo(153, 203); ctx.stroke();
  ctx.strokeStyle = GD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(92, 201); ctx.lineTo(CX, 278); ctx.lineTo(148, 201); ctx.stroke();
  ctx.restore();

  /* --- 衿合わせの下から覗く下着 --- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX - 13, 292);
  ctx.lineTo(CX + 13, 292);
  ctx.lineTo(CX + 9, 312);
  ctx.lineTo(CX - 9, 312);
  ctx.closePath();
  ctx.fillStyle = p6grad(CX, 292, CX, 312, PK, PKS);
  ctx.fill();
  ctx.strokeStyle = PKO; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  /* --- 帯（下端） --- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(48, 306); ctx.lineTo(192, 306); ctx.lineTo(198, 340); ctx.lineTo(42, 340);
  ctx.closePath();
  ctx.fillStyle = p6grad(CX, 306, CX, 340, PK, PKS);
  ctx.fill();
  ctx.strokeStyle = PKO; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.strokeStyle = GD; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(51, 316); ctx.lineTo(190, 316); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(45, 334); ctx.lineTo(196, 334); ctx.stroke();
  // 帯の桜紋
  ctx.save();
  ctx.translate(CX, 325);
  p6sakura(0.55, '#FFFFFF', '#FBD9E5', GDS);
  ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = GD; ctx.fill();
  ctx.restore();
  ctx.restore();

  /* --- 肩当て（白の冠板 + 桜色の板札3段 + 金の縁） --- */
  ctx.save();
  p6mirror(function () {
    for (var i = 0; i < 3; i++) {
      var yy = 221 + i * 15;
      ctx.beginPath();
      ctx.moveTo(146, yy + 4);
      ctx.quadraticCurveTo(177, yy - 9, 203, yy + 15);
      ctx.lineTo(199, yy + 27);
      ctx.quadraticCurveTo(175, yy + 7, 144, yy + 17);
      ctx.closePath();
      ctx.fillStyle = p6grad(146, yy, 203, yy + 27, PK, PKS);
      ctx.fill();
      ctx.strokeStyle = PKO; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.strokeStyle = GD; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(147, yy + 4);
      ctx.quadraticCurveTo(177, yy - 8, 202, yy + 15);
      ctx.stroke();
    }
    // 冠板（白）
    ctx.beginPath();
    ctx.moveTo(142, 222);
    ctx.quadraticCurveTo(172, 197, 203, 222);
    ctx.quadraticCurveTo(197, 234, 176, 223);
    ctx.quadraticCurveTo(157, 213, 144, 233);
    ctx.closePath();
    ctx.fillStyle = p6grad(142, 199, 203, 233, WH, WHS);
    ctx.fill();
    ctx.strokeStyle = WHO; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = GD; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(143, 222); ctx.quadraticCurveTo(172, 198, 202, 222);
    ctx.stroke();
  });
  ctx.restore();

  /* =========================================================
     7. 顔（逆さ卵）
     ========================================================= */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX, FTOP);
  ctx.bezierCurveTo(CX + 30, FTOP, CX + FHW, 86, CX + FHW, 116);
  ctx.bezierCurveTo(CX + FHW, 142, CX + 33, 160, CX, FCHIN);
  ctx.bezierCurveTo(CX - 33, 160, CX - FHW, 142, CX - FHW, 116);
  ctx.bezierCurveTo(CX - FHW, 86, CX - 30, FTOP, CX, FTOP);
  ctx.closePath();
  ctx.fillStyle = SK; ctx.fill();
  ctx.strokeStyle = SKL; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = SKS;
  // 輪郭内側の影（左右対称）
  p6mirror(function () {
    ctx.beginPath();
    ctx.moveTo(CX + FHW + 3, 84);
    ctx.quadraticCurveTo(CX + 35, 120, CX + 30, 158);
    ctx.lineTo(CX + FHW + 5, 158);
    ctx.closePath();
    ctx.fill();
  });
  // 前髪の落ち影
  ctx.beginPath();
  ctx.moveTo(CX - FHW - 2, 54);
  ctx.quadraticCurveTo(CX, 112, CX + FHW + 2, 54);
  ctx.lineTo(CX + FHW + 2, 50);
  ctx.lineTo(CX - FHW - 2, 50);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();

  /* --- 頬の赤み（女性は濃く） --- */
  ctx.save();
  p6mirror(function () {
    var bg = ctx.createRadialGradient(CX + 28, 145, 1, CX + 28, 145, 16);
    bg.addColorStop(0, 'rgba(249,150,160,0.68)');
    bg.addColorStop(1, 'rgba(249,150,160,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(CX + 28, 145, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(236,128,142,0.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(CX + 22, 148); ctx.lineTo(CX + 27, 141); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX + 29, 149); ctx.lineTo(CX + 34, 142); ctx.stroke();
  });
  ctx.restore();

  /* --- 眉（髪より少し明るい色・細い弧） --- */
  function p6brow() {
    ctx.beginPath();
    ctx.moveTo(EX - 10, EY - 20);
    ctx.quadraticCurveTo(EX + 1, EY - 29, EX + 12, EY - 26);
    ctx.strokeStyle = '#D585A8'; ctx.lineWidth = 3.2; ctx.stroke();
  }
  ctx.save(); p6mirror(p6brow); ctx.restore();

  /* --- 目 --- */
  function p6eyeShape() {
    ctx.beginPath();
    ctx.moveTo(EX - EW, EY + 3);
    ctx.bezierCurveTo(EX - 7, EY - 21, EX + 3, EY - 22, EX + EW, EY - 4);
    ctx.bezierCurveTo(EX + 8, EY + 13, EX - 1, EY + 17, EX - EW, EY + 3);
    ctx.closePath();
  }
  function p6eye() {
    ctx.save();
    // まばたきは下まぶたを固定して上まぶたが降りる
    ctx.translate(EX, EY + 11);
    ctx.scale(1, open);
    ctx.translate(-EX, -(EY + 11));

    p6eyeShape();
    ctx.fillStyle = '#FDF4F6'; ctx.fill();

    ctx.save();
    p6eyeShape(); ctx.clip();
    var ix = EX + 1, iy = EY - 1, irx = 9, iry = 12.5;
    // 2) 虹彩：上が濃く下が明るい縦グラデ
    var ig = ctx.createLinearGradient(ix, iy - iry, ix, iy + iry);
    ig.addColorStop(0, IR_T); ig.addColorStop(0.55, IR_M); ig.addColorStop(1, IR_B);
    ctx.beginPath(); ctx.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2);
    ctx.fillStyle = ig; ctx.fill();
    ctx.strokeStyle = 'rgba(78,23,48,0.5)'; ctx.lineWidth = 1.6; ctx.stroke();
    // 3) 瞳孔（虹彩の45%）
    ctx.beginPath(); ctx.ellipse(ix, iy + 0.5, irx * 0.45, iry * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = PUP; ctx.fill();
    // まぶたの落ち影
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#3B1024';
    ctx.beginPath(); ctx.ellipse(ix, iy - iry - 1.5, irx + 3, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // 4) 大ハイライト（左上・虹彩の32%）
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(ix - 3.6, iy - 4.6, 3.6, 0, Math.PI * 2); ctx.fill();
    // 5) 小ハイライト（右下・虹彩の14%）
    ctx.beginPath(); ctx.arc(ix + 4.2, iy + 5.4, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 1) 上まぶた：外側を太く
    ctx.strokeStyle = LID;
    ctx.beginPath();
    ctx.moveTo(EX - EW, EY + 3);
    ctx.bezierCurveTo(EX - 7, EY - 21, EX + 3, EY - 22, EX + EW, EY - 4);
    ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(EX - 1, EY - 15.5);
    ctx.quadraticCurveTo(EX + 6, EY - 14, EX + EW + 0.5, EY - 4.5);
    ctx.lineWidth = 5.2; ctx.stroke();

    // 6) 下まぶた（目の下1/3だけ・細く）
    ctx.strokeStyle = '#B0688A'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(EX + 2, EY + 15.4);
    ctx.quadraticCurveTo(EX + 7.5, EY + 13.5, EX + EW, EY - 3.5);
    ctx.stroke();

    // 7) まつげ（目尻から外へ3本・女性は長め）
    ctx.strokeStyle = LID; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(EX + 8, EY - 8); ctx.lineTo(EX + 17.5, EY - 14.5); ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(EX + 9.5, EY - 5); ctx.lineTo(EX + 18, EY - 8.5); ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(EX + 10.5, EY - 2); ctx.lineTo(EX + 17, EY - 2.5); ctx.stroke();

    ctx.restore();
  }
  ctx.save(); p6mirror(p6eye); ctx.restore();

  /* --- 鼻（2px の短い線だけ） --- */
  ctx.save();
  ctx.strokeStyle = 'rgba(201,155,132,0.95)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(CX + 4, 145); ctx.lineTo(CX + 1.5, 149.5); ctx.stroke();
  ctx.restore();

  /* --- 口（目幅の60%・凛とした小さな笑み） --- */
  ctx.save();
  ctx.strokeStyle = '#C4677E'; ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(CX - 6.6, 159);
  ctx.quadraticCurveTo(CX, 164.6, CX + 6.6, 159);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(237,195,172,0.9)'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(CX - 3, 166.5); ctx.quadraticCurveTo(CX, 168, CX + 3, 166.5); ctx.stroke();
  ctx.restore();

  /* =========================================================
     8. 顔まわりの毛束（根元は前髪の下に隠れる）
     ========================================================= */
  ctx.save();
  p6mirror(function () {
    ctx.beginPath();
    ctx.moveTo(158, 66);
    ctx.quadraticCurveTo(157, 128, 169 + sway, 180);
    ctx.quadraticCurveTo(194, 132, 186, 66);
    ctx.closePath();
    ctx.fillStyle = p6grad(158, 66, 176, 180, HRS, HR);
    ctx.fill();
    ctx.strokeStyle = HRO; ctx.lineWidth = 2.2; ctx.stroke();
  });
  ctx.restore();

  /* =========================================================
     9. 前髪（1枚のシルエット＋内部は塗り分けだけ）
     ========================================================= */
  function p6cap() {
    ctx.beginPath();
    ctx.moveTo(46, 110);
    var s2 = sway * 0.5;
    // 房の先端 6 本（先はすべて尖らせる／目にはかからない高さ）
    ctx.quadraticCurveTo(48, 136, 61 + s2, 144);
    ctx.quadraticCurveTo(68 + s2, 124, 74, 94);
    ctx.quadraticCurveTo(80 + s2, 92, 86 + s2, 100);
    ctx.quadraticCurveTo(92, 92, 98, 88);
    ctx.quadraticCurveTo(104 + s2, 88, 110 + s2, 96);
    ctx.quadraticCurveTo(116, 88, 122, 84);
    ctx.quadraticCurveTo(128 + s2, 86, 134 + s2, 94);
    ctx.quadraticCurveTo(140, 86, 146, 86);
    ctx.quadraticCurveTo(152 + s2, 90, 158 + s2, 98);
    ctx.quadraticCurveTo(166, 94, 172, 94);
    ctx.quadraticCurveTo(182 + s2, 112, 185 + s2, 140);
    ctx.quadraticCurveTo(192, 124, 194, 108);
    // 頭のシルエットへ戻る
    ctx.bezierCurveTo(196, 60, 172, 20, CX, 20);
    ctx.bezierCurveTo(68, 20, 44, 60, 46, 112);
    ctx.closePath();
  }
  ctx.save();
  p6cap();
  ctx.fillStyle = p6grad(CX, 20, CX, 146, HRD, HR);   // 根元は暗く、毛先は明るく
  ctx.fill();
  ctx.strokeStyle = HRO; ctx.lineWidth = 2.4; ctx.stroke();

  // 内部の房：輪郭線は引かず、塗りの濃淡だけで分ける
  ctx.save();
  p6cap(); ctx.clip();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = HRD;
  p6lock(88, 24, 15, 68, 106, 74, 60, 96, 62); ctx.fill();
  p6lock(152, 24, 15, 172, 112, 154, 60, 176, 62); ctx.fill();
  p6lock(118, 22, 11, 106, 88, 110, 54, 126, 52); ctx.fill();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = HRL;
  p6lock(106, 28, 10, 121, 96, 106, 62, 124, 58); ctx.fill();
  p6lock(138, 28, 11, 146, 98, 136, 64, 154, 60); ctx.fill();
  p6lock(74, 32, 9, 60, 118, 62, 66, 80, 66); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // 髪トップの光の帯（少し波打つ・頭幅の約30%）
  ctx.save();
  p6cap(); ctx.clip();
  ctx.globalAlpha = 0.62;
  ctx.beginPath();
  ctx.moveTo(66, 74);
  ctx.bezierCurveTo(82, 52, 156, 50, 176, 70);
  ctx.bezierCurveTo(168, 71, 158, 64, 145, 65);
  ctx.bezierCurveTo(131, 66, 120, 58, 107, 60);
  ctx.bezierCurveTo(94, 62, 84, 58, 73, 74);
  ctx.closePath();
  ctx.fillStyle = p6grad(66, 50, 176, 74, '#FFFFFF', '#FFEAF2');
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();

  /* --- 前髪に重ねる長い房 3 本（両端が尖る／目にはかけない） --- */
  ctx.save();
  var s4 = sway * 0.6;
  var hang = [
    /* ax, ay,  bx, by,  c1x,c1y, c2x,c2y */
    [120, 38, 122 + s4, 118, 113, 80, 131, 78],
    [86, 42, 72 + s4, 130, 72, 90, 89, 88],
    [154, 42, 168 + s4, 130, 168, 90, 151, 88]
  ];
  for (var hi = 0; hi < hang.length; hi++) {
    var h = hang[hi];
    p6leaf(h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]);
    ctx.fillStyle = p6grad(h[0], h[1], h[2], h[3], HRS, HR);
    ctx.fill();
    ctx.globalAlpha = hi === 0 ? 1 : 0.6;
    ctx.strokeStyle = HRO; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  /* --- 眉を薄く重ねる（透ける前髪） --- */
  ctx.save();
  ctx.globalAlpha = 0.45;
  p6mirror(p6brow);
  ctx.globalAlpha = 1;
  ctx.restore();

  /* =========================================================
     10. 肩に落ちる毛束（両端が尖った房）
     ========================================================= */
  ctx.save();
  p6mirror(function () {
    p6leaf(176, 126, 190 + sway * 0.6, 230, 170, 182, 200, 176);
    ctx.fillStyle = p6grad(176, 126, 190, 230, HR, HRL);
    ctx.fill();
    ctx.strokeStyle = HRO; ctx.lineWidth = 2.1; ctx.stroke();
    p6leaf(162, 142, 170 + sway * 0.6, 206, 157, 176, 179, 172);
    ctx.fillStyle = p6grad(162, 142, 170, 206, HRS, HR);
    ctx.fill();
    ctx.strokeStyle = HRO; ctx.lineWidth = 1.9; ctx.stroke();
  });
  ctx.restore();

  /* =========================================================
     11. 桜の花飾り（片側）
     ========================================================= */
  ctx.save();
  ctx.translate(60, 92);
  ctx.rotate(-0.18);
  p6sakura(1, '#FFF3F7', '#F5A2C2', '#C4718F');
  ctx.beginPath(); ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
  ctx.fillStyle = '#FBE08A'; ctx.fill();
  ctx.strokeStyle = GDS; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.strokeStyle = '#E4B75E'; ctx.lineWidth = 1.2;
  for (var s3 = 0; s3 < 5; s3++) {
    var a3 = s3 * 1.2566 + 0.3;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a3) * 6.8, Math.sin(a3) * 6.8); ctx.stroke();
  }
  ctx.restore();
  // 小さなつぼみ 2 つ
  ctx.save();
  ctx.fillStyle = '#F6B3CB'; ctx.strokeStyle = '#C4718F'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(44, 106, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(76, 74, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();

  /* --- 舞う花びら（T で位置が決まる） --- */
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#FFD3E2';
  for (var q = 0; q < 4; q++) {
    var px = 24 + q * 62 + Math.sin(t / 1100 + q * 2.1) * 9;
    var py = 26 + ((t / 26 + q * 82) % 306);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.sin(t / 700 + q) * 1.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-3.4, -3, -4, -6.5, -1.5, -8);
    ctx.lineTo(0, -6.3);
    ctx.lineTo(1.5, -8);
    ctx.bezierCurveTo(4, -6.5, 3.4, -3, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.restore();
}


/* ===========================================================
   盤上のコマ（2.5頭身デフォルメ全身）
   =========================================================== */
function dvT6(ctx, col, T, facing) {
  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;
  var f = (facing === -1) ? -1 : 1;
  var C = (typeof col === 'string' && col.charAt(0) === '#') ? col : '#F49AC1';

  var HR = '#F4AEC8', HRS = '#DA8DAB', HRD = '#B96A8B', HRO = '#9C4F70';
  var SK = '#FDE7DA', SKL = '#C99B84';
  var WH = '#FDF9F8', WHO = '#A98D97';
  var PK = '#F3AFC6', PKS = '#D2809F', PKO = '#A6597A';

  function t6grad(x0, y0, x1, y1, a, b) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, a); g.addColorStop(1, b); return g;
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  /* 接地点の影（呼吸では動かさない） */
  ctx.save();
  ctx.fillStyle = 'rgba(60,30,45,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* 呼吸 ±1.5px・周期2秒 → 向き */
  ctx.translate(0, Math.sin(t * Math.PI / 1000) * 1.5);
  ctx.scale(f, 1);

  /* --- 羽織（背面） --- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.bezierCurveTo(-14, -44, -19.0, -33, -18.5, -15);
  ctx.lineTo(18.5, -15);
  ctx.bezierCurveTo(19.0, -33, 14, -44, 0, -45);
  ctx.closePath();
  ctx.fillStyle = t6grad(0, -45, 0, -15, '#FDE8EF', '#EDB0C9');
  ctx.fill();
  ctx.strokeStyle = '#C0819C'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();

  /* --- 脚 / 白のブーツ（折り返しにプレイヤー色） --- */
  ctx.save();
  for (var lg = -1; lg <= 1; lg += 2) {
    ctx.beginPath();
    ctx.moveTo(lg * 2.2, -18);
    ctx.lineTo(lg * 8.2, -18);
    ctx.lineTo(lg * 8.6, -3.5);
    ctx.quadraticCurveTo(lg * 8.6, -0.7, lg * 5.4, -0.7);
    ctx.lineTo(lg * 2.4, -0.7);
    ctx.quadraticCurveTo(lg * 1.6, -0.7, lg * 1.8, -3.5);
    ctx.closePath();
    ctx.fillStyle = t6grad(0, -18, 0, 0, WH, '#E7D8DC');
    ctx.fill();
    ctx.strokeStyle = WHO; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lg * 1.95, -12.6); ctx.lineTo(lg * 8.5, -12.6);
    ctx.lineTo(lg * 8.6, -8.2); ctx.lineTo(lg * 1.9, -8.2);
    ctx.closePath();
    ctx.fillStyle = C; ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,55,0.5)'; ctx.lineWidth = 1.1; ctx.stroke();
  }
  ctx.restore();

  /* --- 草摺（鎧のスカート） --- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-10, -31);
  ctx.lineTo(10, -31);
  ctx.quadraticCurveTo(14, -22, 14.5, -14);
  ctx.lineTo(-14.5, -14);
  ctx.quadraticCurveTo(-14, -22, -10, -31);
  ctx.closePath();
  ctx.fillStyle = t6grad(0, -31, 0, -14, PK, PKS);
  ctx.fill();
  ctx.strokeStyle = PKO; ctx.lineWidth = 1.7; ctx.stroke();
  ctx.strokeStyle = 'rgba(166,89,122,0.65)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-4.6, -30); ctx.lineTo(-5.4, -14.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4.6, -30); ctx.lineTo(5.4, -14.5); ctx.stroke();
  ctx.restore();

  /* --- 胴（白）+ 桜色の衿 + プレイヤー色の帯 --- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-9, -43);
  ctx.quadraticCurveTo(-11, -36, -10.5, -29);
  ctx.lineTo(10.5, -29);
  ctx.quadraticCurveTo(11, -36, 9, -43);
  ctx.closePath();
  ctx.fillStyle = t6grad(0, -43, 0, -29, WH, '#EBDCE0');
  ctx.fill();
  ctx.strokeStyle = WHO; ctx.lineWidth = 1.7; ctx.stroke();
  ctx.strokeStyle = PK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-7.5, -43.5); ctx.lineTo(0, -33); ctx.lineTo(7.5, -43.5); ctx.stroke();
  ctx.strokeStyle = PKO; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-7.5, -43.5); ctx.lineTo(0, -33); ctx.lineTo(7.5, -43.5); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10.8, -33.4); ctx.lineTo(10.8, -33.4);
  ctx.lineTo(10.4, -27.6); ctx.lineTo(-10.4, -27.6);
  ctx.closePath();
  ctx.fillStyle = C; ctx.fill();
  ctx.strokeStyle = 'rgba(70,40,55,0.55)'; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.restore();

  /* --- 腕と手 --- */
  ctx.save();
  for (var am = -1; am <= 1; am += 2) {
    ctx.beginPath();
    ctx.moveTo(am * 8.5, -41.5);
    ctx.quadraticCurveTo(am * 14, -37, am * 12.5, -28);
    ctx.lineTo(am * 8.6, -28.6);
    ctx.quadraticCurveTo(am * 9.6, -36, am * 5.8, -40.5);
    ctx.closePath();
    ctx.fillStyle = t6grad(0, -41, 0, -28, WH, '#E8DADE');
    ctx.fill();
    ctx.strokeStyle = WHO; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(am * 12, -26.5, 3, 0, Math.PI * 2);
    ctx.fillStyle = SK; ctx.fill();
    ctx.strokeStyle = SKL; ctx.lineWidth = 1.3; ctx.stroke();
  }
  ctx.restore();

  /* --- 肩当て --- */
  ctx.save();
  for (var sh = -1; sh <= 1; sh += 2) {
    ctx.beginPath();
    ctx.ellipse(sh * 9.8, -41.5, 6.4, 4.4, sh * -0.35, 0, Math.PI * 2);
    ctx.fillStyle = t6grad(0, -46, 0, -37, PK, PKS);
    ctx.fill();
    ctx.strokeStyle = PKO; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();

  /* --- 後ろ髪（ボブのシルエット＝誰か分かる形） --- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -71.4);
  ctx.bezierCurveTo(13, -71.4, 19.0, -66, 19.0, -55);
  ctx.bezierCurveTo(19.0, -48, 18.5, -43, 17.5, -38);
  ctx.quadraticCurveTo(13.5, -43, 10, -37.5);
  ctx.quadraticCurveTo(6, -43, 2.5, -38.5);
  ctx.quadraticCurveTo(0.5, -43, 0, -40);
  ctx.quadraticCurveTo(-0.5, -43, -2.5, -38.5);
  ctx.quadraticCurveTo(-6, -43, -10, -37.5);
  ctx.quadraticCurveTo(-13.5, -43, -17.5, -38);
  ctx.bezierCurveTo(-18.5, -43, -19.0, -48, -19.0, -55);
  ctx.bezierCurveTo(-19.0, -66, -13, -71.4, 0, -71.4);
  ctx.closePath();
  ctx.fillStyle = t6grad(0, -71.4, 0, -38, HRD, HR);
  ctx.fill();
  ctx.strokeStyle = HRO; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.restore();

  /* --- 顔 --- */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -69);
  ctx.bezierCurveTo(9, -69, 13, -63, 13, -56);
  ctx.bezierCurveTo(13, -47, 7.5, -42, 0, -42);
  ctx.bezierCurveTo(-7.5, -42, -13, -47, -13, -56);
  ctx.bezierCurveTo(-13, -63, -9, -69, 0, -69);
  ctx.closePath();
  ctx.fillStyle = SK; ctx.fill();
  ctx.strokeStyle = SKL; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();

  /* --- 顔は目2つ＋口だけに省略 --- */
  ctx.save();
  for (var ey = -1; ey <= 1; ey += 2) {
    ctx.beginPath();
    ctx.ellipse(ey * 5.4, -53.5, 2.7, 3.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5C2038'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ey * 5.4, -52.2, 1.9, 2.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E77E9F'; ctx.fill();
    ctx.beginPath();
    ctx.arc(ey * 5.4 - 1, -55.2, 1.25, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.fillStyle = 'rgba(249,150,160,0.5)';
    ctx.beginPath();
    ctx.ellipse(ey * 9.5, -49.4, 2.6, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#B8586F'; ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-1.7, -47.6);
  ctx.quadraticCurveTo(0, -45.8, 1.7, -47.6);
  ctx.stroke();
  ctx.restore();

  /* --- 前髪（1枚のシルエット・先は尖らせる） --- */
  function t6cap() {
    ctx.beginPath();
    ctx.moveTo(-18.7, -57);
    ctx.bezierCurveTo(-19.0, -68, -13, -71.4, 0, -71.4);
    ctx.bezierCurveTo(13, -71.4, 19.0, -68, 18.7, -57);
    ctx.quadraticCurveTo(19, -50, 16.5, -45);
    ctx.quadraticCurveTo(13, -55, 10, -59);
    ctx.quadraticCurveTo(7, -56, 4, -59.5);
    ctx.quadraticCurveTo(0, -63, -3.5, -62);
    ctx.quadraticCurveTo(-7, -58, -10, -60);
    ctx.quadraticCurveTo(-14, -57, -15, -59);
    ctx.quadraticCurveTo(-18, -50, -17, -45);
    ctx.quadraticCurveTo(-19, -50, -18.7, -57);
    ctx.closePath();
  }
  ctx.save();
  t6cap();
  ctx.fillStyle = t6grad(0, -71.4, 0, -46, HRD, HR);
  ctx.fill();
  ctx.strokeStyle = HRO; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.save();
  t6cap(); ctx.clip();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(-11, -63);
  ctx.bezierCurveTo(-7, -70, 7, -70, 11, -64);
  ctx.bezierCurveTo(6, -65.5, 2, -66.5, -2, -65);
  ctx.bezierCurveTo(-6, -63.5, -8, -66, -11, -63);
  ctx.closePath();
  ctx.fillStyle = '#FFE8F0'; ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = HRD;
  ctx.beginPath();
  ctx.moveTo(-13, -72); ctx.quadraticCurveTo(-19, -62, -17, -45);
  ctx.quadraticCurveTo(-12, -56, -8, -71);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();

  /* --- 顔まわりの毛束 --- */
  ctx.save();
  for (var sl = -1; sl <= 1; sl += 2) {
    ctx.beginPath();
    ctx.moveTo(sl * 12.5, -62);
    ctx.quadraticCurveTo(sl * 13, -50, sl * 14.5, -38);
    ctx.quadraticCurveTo(sl * 19.0, -50, sl * 18.5, -62);
    ctx.closePath();
    ctx.fillStyle = t6grad(0, -62, 0, -38, HRS, HR);
    ctx.fill();
    ctx.strokeStyle = HRO; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();

  /* --- 桜の花飾り（片側） --- */
  ctx.save();
  ctx.translate(-15.2, -63);
  for (var fk = 0; fk < 5; fk++) {
    ctx.save();
    ctx.rotate(-0.4 + fk * (Math.PI * 2 / 5));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-2.8, -2.6, -3.5, -5.6, -1.3, -6.9);
    ctx.lineTo(0, -5.4);
    ctx.lineTo(1.3, -6.9);
    ctx.bezierCurveTo(3.5, -5.6, 2.8, -2.6, 0, 0);
    ctx.closePath();
    ctx.fillStyle = '#FFF1F6'; ctx.fill();
    ctx.strokeStyle = '#C4718F'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
  ctx.fillStyle = '#FBE08A'; ctx.fill();
  ctx.strokeStyle = '#B7913F'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/* ───── a6f56b5dee6ed18d2 ───── */
/* ============================================================
   ジン / 黄金の両替商  —  Canvas 2D character art
   dvP7(ctx, T)               : bust portrait  240 x 340 (origin = top-left)
   dvT7(ctx, col, T, facing)  : board token    max 44 x 72 (origin = feet)
   ============================================================ */

function dvP7(ctx, T) {
  ctx.save();

  /* ---------- local helpers (prefix p7, all closed inside) ---------- */
  function p7dk(hex, f) {                       // darken: lightness x f
    var n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round(((n >> 16) & 255) * f) + ',' +
                    Math.round(((n >> 8) & 255) * f) + ',' +
                    Math.round((n & 255) * f) + ')';
  }
  function p7r(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function p7ell(x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  /* draw one side, then the same shape mirrored -> guaranteed symmetry */
  function p7pair(fn) { fn(1); fn(-1); }
  /* one 房: a lens pointed at BOTH ends (bang tip below, spike tip above) */
  function p7lock(bx, by, tx, ty, w) {
    var dx = tx - bx, dy = ty - by, L = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / L, ny = dx / L;
    var ax = bx + dx * 0.34, ay = by + dy * 0.34;
    var mx2 = bx + dx * 0.74, my2 = by + dy * 0.74;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.bezierCurveTo(ax + nx * w, ay + ny * w, mx2 + nx * w * 0.8, my2 + ny * w * 0.8, tx, ty);
    ctx.bezierCurveTo(mx2 - nx * w * 0.8, my2 - ny * w * 0.8, ax - nx * w, ay - ny * w, bx, by);
    ctx.closePath();
  }
  function p7leaf(x, y, ang, len, wid) {        // one highlight segment
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.quadraticCurveTo(-len * 0.05, -wid, len / 2, 0);
    ctx.quadraticCurveTo(-len * 0.05, wid, -len / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;

  /* ---------- palette: base + 1 shadow + 1 highlight per material ---------- */
  var SKIN = '#FDE7DA', SKIN_S = '#EDC3AC', BLUSH = '#F9A8A8';
  var SKIN_LN = p7dk('#EDC3AC', 0.66);
  var HAIR = '#E7D8AE', HAIR_S = '#AC9560', HAIR_L = '#FCF6E2', HAIR_R = '#826E42';
  var HAIR_LN = p7dk('#E7D8AE', 0.64);
  var COAT = '#242634', COAT_S = '#13151D', COAT_L = '#3D4155';
  var COAT_LN = '#0A0B11';
  var GOLD = '#E9B840', GOLD_L = '#FCEBA6', GOLD_S = '#A5761A', GOLD_LN = '#66470C';
  var SHIRT = '#EFE5CE', SHIRT_S = '#CFC0A2';
  var LID = '#3B2818';

  /* ---------- geometry ---------- */
  var cx = 120;      // face centre
  var fyT = 60;      // top of the skin
  var fyB = 175;     // chin  -> face is 100 wide x 115 tall (h = 1.15 w)
  var eyY = 120;     // eye centre = 52% down the face
  var eyDX = 24;     // eye centre offset (inner corners 24 apart = 1 eye width)
  var eW = 12;       // eye half width  (24 = 24% of the face width)
  var eH = 15;       // eye half height (30 = 26% of the face height)

  /* ---------- animation, derived from T only ---------- */
  var bp = ((t % 3400) + 3400) % 3400;
  var open = (bp < 120) ? Math.abs(Math.cos(Math.PI * (bp / 120))) : 1;  // blink 120ms every 3.4s
  if (open < 0.05) open = 0.05;
  var sway = Math.sin(t / 900) * 1.8;          // hair tips
  var sway2 = Math.sin(t / 820 + 0.8) * 2.4;   // the lock on the forehead

  /* ================= 0. faint ground shadow ================= */
  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.fillStyle = '#241A10';
  p7ell(120, 335, 96, 12, 0);
  ctx.fill();
  ctx.restore();

  /* ================= shared paths ================= */
  function p7facePath() {                       // inverted egg, male jaw
    ctx.beginPath();
    ctx.moveTo(cx, fyT);
    ctx.bezierCurveTo(cx + 30, fyT, cx + 48, 79, cx + 48, 100);
    ctx.bezierCurveTo(cx + 48, 116, cx + 45, 126, cx + 39, 134);   // cheekbone -> jaw corner
    ctx.bezierCurveTo(cx + 32, 149, cx + 21, 163, cx + 10, 172);
    ctx.bezierCurveTo(cx + 6, 175, cx - 6, 175, cx - 10, 172);
    ctx.bezierCurveTo(cx - 21, 163, cx - 32, 149, cx - 39, 134);
    ctx.bezierCurveTo(cx - 45, 126, cx - 48, 116, cx - 48, 100);
    ctx.bezierCurveTo(cx - 48, 79, cx - 30, fyT, cx, fyT);
    ctx.closePath();
  }

  /* bang tips on the hairline; each one is also the base of a 房 */
  var HB = [[82, 80], [97, 77], [113, 74], [128, 75], [145, 78], [158, 80]];
  var HT = [[66, 32], [86, 20], [108, 16], [132, 16], [152, 21], [170, 42]];   // spike tips

  function p7hairPath() {                       // slicked back: 2 crests, jagged hairline
    ctx.beginPath();
    ctx.moveTo(71, 120);                                  // left sideburn tip
    ctx.lineTo(62, 94);
    ctx.quadraticCurveTo(55, 62, 70, 38 + sway * 0.3);
    ctx.quadraticCurveTo(82, 22, 103, 21 + sway * 0.5);   // crest 1
    ctx.quadraticCurveTo(114, 19, 122, 27);               // notch
    ctx.quadraticCurveTo(136, 16 + sway * 0.5, 157, 25);  // crest 2
    ctx.quadraticCurveTo(175, 34, 181, 62);
    ctx.quadraticCurveTo(186, 84, 177, 104);
    ctx.lineTo(169, 120);                                 // right sideburn tip
    ctx.lineTo(167, 100);
    ctx.quadraticCurveTo(167, 88, 163, 76);
    ctx.lineTo(HB[5][0], HB[5][1]); ctx.lineTo(152, 68);
    ctx.lineTo(HB[4][0], HB[4][1]); ctx.lineTo(136, 63);
    ctx.lineTo(HB[3][0], HB[3][1]); ctx.lineTo(cx, 60.5); // widow's peak
    ctx.lineTo(HB[2][0], HB[2][1]); ctx.lineTo(105, 62);
    ctx.lineTo(HB[1][0], HB[1][1]); ctx.lineTo(89, 66);
    ctx.lineTo(HB[0][0], HB[0][1]); ctx.lineTo(77, 72);
    ctx.quadraticCurveTo(73, 86, 73, 100);
    ctx.closePath();
  }

  function p7hairBackPath() {                   // swept-back volume behind the head
    ctx.beginPath();
    ctx.moveTo(80, 58);
    ctx.bezierCurveTo(62, 78, 57, 106, 62, 126);
    ctx.lineTo(52, 146);                        // back-swept tip
    ctx.lineTo(74, 138);
    ctx.bezierCurveTo(88, 150, 152, 150, 166, 138);
    ctx.lineTo(188, 146);
    ctx.lineTo(178, 126);
    ctx.bezierCurveTo(183, 106, 178, 78, 160, 58);
    ctx.closePath();
  }

  /* ================= 1. hair behind the head ================= */
  ctx.save();
  p7hairBackPath();
  ctx.fillStyle = HAIR_R;
  ctx.fill();
  ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  ctx.strokeStyle = HAIR_LN;
  ctx.stroke();
  ctx.restore();

  /* ================= 2. coat / body ================= */
  ctx.save();
  function p7torso() {
    ctx.beginPath();
    ctx.moveTo(102, 192);
    ctx.bezierCurveTo(78, 197, 58, 209, 46, 228);
    ctx.bezierCurveTo(33, 248, 25, 288, 19, 342);
    ctx.lineTo(221, 342);
    ctx.bezierCurveTo(215, 288, 207, 248, 194, 228);
    ctx.bezierCurveTo(182, 209, 162, 197, 138, 192);
    ctx.closePath();
  }
  p7torso();
  ctx.fillStyle = COAT; ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = COAT_L;                                   // flat shoulder highlight
  p7pair(function (s) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 40, 204);
    ctx.bezierCurveTo(cx + s * 62, 212, cx + s * 78, 238, cx + s * 86, 270);
    ctx.lineTo(cx + s * 70, 274);
    ctx.bezierCurveTo(cx + s * 62, 244, cx + s * 52, 224, cx + s * 34, 214);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = COAT_S;                                   // flat bottom shade
  ctx.beginPath();
  ctx.moveTo(14, 314);
  ctx.bezierCurveTo(66, 300, 174, 300, 226, 314);
  ctx.lineTo(226, 346); ctx.lineTo(14, 346);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* standing collar wings, behind the neck */
  function p7collar(s) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 4, 210);
    ctx.lineTo(cx + s * 22, 198);
    ctx.bezierCurveTo(cx + s * 29, 180, cx + s * 34, 166, cx + s * 42, 155);
    ctx.lineTo(cx + s * 25, 152);
    ctx.bezierCurveTo(cx + s * 18, 168, cx + s * 12, 190, cx + s * 6, 210);
    ctx.closePath();
    ctx.fillStyle = COAT_S; ctx.fill();
    ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.strokeStyle = COAT_LN; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 24, 154);
    ctx.bezierCurveTo(cx + s * 17, 170, cx + s * 11, 190, cx + s * 5, 208);
    ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.strokeStyle = GOLD; ctx.stroke();
  }
  p7pair(p7collar);

  /* neck */
  ctx.beginPath();
  ctx.moveTo(105, 154);
  ctx.bezierCurveTo(103, 174, 101, 188, 100, 204);
  ctx.lineTo(140, 204);
  ctx.bezierCurveTo(139, 188, 137, 174, 135, 154);
  ctx.closePath();
  ctx.fillStyle = SKIN_S; ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();                                          // hard cel edge: lit lower neck
  ctx.moveTo(94, 186);
  ctx.bezierCurveTo(110, 182, 130, 182, 146, 186);
  ctx.lineTo(146, 210); ctx.lineTo(94, 210);
  ctx.closePath();
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2.2; ctx.strokeStyle = SKIN_LN;
  ctx.beginPath();
  ctx.moveTo(105, 158);
  ctx.bezierCurveTo(103, 176, 101, 188, 100, 204);
  ctx.moveTo(135, 158);
  ctx.bezierCurveTo(137, 176, 139, 188, 140, 204);
  ctx.stroke();

  /* shirt V */
  ctx.beginPath();
  ctx.moveTo(104, 196); ctx.lineTo(136, 196); ctx.lineTo(cx, 250);
  ctx.closePath();
  ctx.fillStyle = SHIRT; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(131, 197); ctx.lineTo(cx + 3, 246); ctx.lineTo(136, 197);
  ctx.closePath();
  ctx.fillStyle = SHIRT_S; ctx.fill();

  /* gold necktie */
  var tieG = ctx.createLinearGradient(107, 194, 133, 256);
  tieG.addColorStop(0, GOLD_L); tieG.addColorStop(0.45, GOLD); tieG.addColorStop(1, GOLD_S);
  ctx.beginPath();
  ctx.moveTo(110, 195); ctx.lineTo(130, 195);
  ctx.lineTo(132, 217); ctx.lineTo(108, 217);
  ctx.closePath();
  ctx.fillStyle = tieG; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = GOLD_LN; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(112, 217); ctx.lineTo(128, 217);
  ctx.lineTo(132, 244); ctx.lineTo(cx, 260); ctx.lineTo(108, 244);
  ctx.closePath();
  ctx.fillStyle = tieG; ctx.fill();
  ctx.strokeStyle = GOLD_LN; ctx.stroke();

  /* lapels */
  function p7lapel(s) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 3, 256);
    ctx.lineTo(cx + s * 27, 196);
    ctx.bezierCurveTo(cx + s * 33, 182, cx + s * 40, 173, cx + s * 52, 168);
    ctx.lineTo(cx + s * 72, 200);
    ctx.bezierCurveTo(cx + s * 62, 226, cx + s * 40, 248, cx + s * 14, 266);
    ctx.closePath();
    ctx.fillStyle = COAT; ctx.fill();
    ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.strokeStyle = COAT_LN; ctx.stroke();
    ctx.beginPath();                                        // gold edge trim
    ctx.moveTo(cx + s * 5, 252);
    ctx.lineTo(cx + s * 28, 198);
    ctx.bezierCurveTo(cx + s * 34, 185, cx + s * 41, 177, cx + s * 51, 172);
    ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.strokeStyle = GOLD; ctx.stroke();
  }
  p7pair(p7lapel);

  /* epaulettes along the shoulder line */
  function p7epaul(s) {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + s * 44, 208);
    ctx.bezierCurveTo(cx + s * 66, 218, cx + s * 80, 238, cx + s * 88, 262);
    ctx.lineWidth = 11; ctx.strokeStyle = GOLD_S; ctx.stroke();
    ctx.lineWidth = 6.5; ctx.strokeStyle = GOLD; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 45, 205);
    ctx.bezierCurveTo(cx + s * 65, 214, cx + s * 78, 234, cx + s * 85, 257);
    ctx.lineWidth = 2; ctx.strokeStyle = GOLD_L; ctx.stroke();
    for (var i = 0; i < 3; i++) {
      var u = 0.2 + i * 0.3, iu = 1 - u;
      var bx = iu * iu * iu * (cx + s * 44) + 3 * iu * iu * u * (cx + s * 66) +
               3 * iu * u * u * (cx + s * 80) + u * u * u * (cx + s * 88);
      var by = iu * iu * iu * 208 + 3 * iu * iu * u * 218 +
               3 * iu * u * u * 238 + u * u * u * 262;
      p7ell(bx, by, 3.2, 3.2, 0);
      ctx.fillStyle = GOLD_L; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = GOLD_LN; ctx.stroke();
    }
  }
  p7pair(p7epaul);

  /* double-breasted buttons */
  p7pair(function (s) {
    for (var i = 0; i < 2; i++) {
      var by = 288 + i * 28;
      p7ell(cx + s * 22, by, 5.4, 5.4, 0);
      ctx.fillStyle = GOLD; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = GOLD_LN; ctx.stroke();
      p7ell(cx + s * 22 - 1.7, by - 1.7, 1.8, 1.8, 0);
      ctx.fillStyle = GOLD_L; ctx.fill();
    }
  });
  ctx.restore();

  /* ================= 3. ears ================= */
  ctx.save();
  p7pair(function (s) {
    p7ell(cx + s * 47, 126, 6.4, 11.5, s * 0.16);
    ctx.fillStyle = SKIN; ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = SKIN_LN; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 49, 120);
    ctx.quadraticCurveTo(cx + s * 44, 126, cx + s * 48, 132);
    ctx.lineWidth = 1.8; ctx.strokeStyle = SKIN_S; ctx.stroke();
  });
  ctx.restore();

  /* ================= 4. face ================= */
  ctx.save();
  p7facePath();
  ctx.fillStyle = SKIN; ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.5;                                    // shadow cast by the hair
  ctx.fillStyle = SKIN_S;
  ctx.beginPath();
  ctx.moveTo(58, 54); ctx.lineTo(186, 54);
  ctx.lineTo(176, 108);
  ctx.quadraticCurveTo(174, 92, 166, 82);
  ctx.lineTo(160, 88); ctx.lineTo(153, 76);
  ctx.lineTo(146, 86); ctx.lineTo(137, 71);
  ctx.lineTo(129, 83); ctx.lineTo(cx, 69);
  ctx.lineTo(112, 82); ctx.lineTo(104, 70);
  ctx.lineTo(96, 85);  ctx.lineTo(88, 74);
  ctx.lineTo(81, 88);  ctx.lineTo(74, 82);
  ctx.quadraticCurveTo(66, 94, 64, 110);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.4;                                    // jaw side shade
  p7pair(function (s) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 50, 98);
    ctx.bezierCurveTo(cx + s * 44, 122, cx + s * 36, 146, cx + s * 19, 165);
    ctx.lineTo(cx + s * 33, 177);
    ctx.lineTo(cx + s * 56, 116);
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalAlpha = 0.13;                                   // blush (male = light)
  ctx.fillStyle = BLUSH;
  p7pair(function (s) { p7ell(cx + s * 31, 138, 12, 5, 0); ctx.fill(); });
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.lineWidth = 2.5; ctx.strokeStyle = SKIN_LN;
  p7facePath(); ctx.stroke();
  ctx.restore();

  /* ================= 5. eyebrows: thin, angled, cool ================= */
  ctx.save();
  ctx.fillStyle = '#B49A60';
  p7pair(function (s) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 12, 102);
    ctx.quadraticCurveTo(cx + s * 25, 90.5, cx + s * 40, 93.5);
    ctx.quadraticCurveTo(cx + s * 27, 95, cx + s * 13, 105);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  /* ================= 6. eyes ================= */
  function p7eye(ex, ey, s) {
    var hi = eH * open;
    function shape() {
      ctx.beginPath();
      ctx.moveTo(ex - s * eW, ey + 3);                                        // inner corner (low)
      ctx.bezierCurveTo(ex - s * 8, ey - hi * 0.8, ex + s * 4, ey - hi, ex + s * eW, ey - 7);
      ctx.bezierCurveTo(ex + s * 7, ey + hi * 0.68, ex - s * 5, ey + hi * 0.86, ex - s * eW, ey + 3);
      ctx.closePath();
    }

    ctx.save();
    shape();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#FCF6F3';
    ctx.fillRect(ex - 22, ey - 26, 44, 52);
    ctx.fillStyle = '#DFC4BB';                                                // socket shade
    ctx.fillRect(ex - 22, ey - 26, 44, 26 - hi * 0.42);

    var irx = ex + s * 1, iry = ey + 1;
    var g = ctx.createLinearGradient(irx, iry - 13, irx, iry + 13);
    g.addColorStop(0, '#7A4E05'); g.addColorStop(0.46, '#DFAB2C'); g.addColorStop(1, '#FFE798');
    p7ell(irx, iry, 10.5, 13, 0);
    ctx.fillStyle = g; ctx.fill();
    ctx.save();                                                               // bright cel band, lower iris
    p7ell(irx, iry, 10.5, 13, 0); ctx.clip();
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#FFF2C0';
    ctx.fillRect(irx - 12, iry + 6, 24, 9);
    ctx.restore();
    p7ell(irx, iry, 10.5, 13, 0);
    ctx.lineWidth = 2; ctx.strokeStyle = '#5A3A04'; ctx.stroke();
    p7ell(irx, iry, 4.7, 5.9, 0);                                             // pupil = 45% of iris
    ctx.fillStyle = '#291A05'; ctx.fill();
    p7ell(irx - 4.2, iry - 5.2, 3.6, 3.6, 0);                                 // big highlight, upper-left
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    p7ell(irx + 4.6, iry + 5.6, 1.7, 1.7, 0);                                 // small highlight, lower-right
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.restore();                                                            // un-clip

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = LID;
    ctx.beginPath();                                                          // upper lid, thin
    ctx.moveTo(ex - s * eW, ey + 3);
    ctx.bezierCurveTo(ex - s * 8, ey - hi * 0.8, ex + s * 4, ey - hi, ex + s * eW, ey - 7);
    ctx.lineWidth = 3.2; ctx.stroke();
    ctx.beginPath();                                                          // ...thicker outward
    ctx.moveTo(ex + s * 0.5, ey - hi * 0.95);
    ctx.quadraticCurveTo(ex + s * 8, ey - hi * 0.7, ex + s * (eW + 0.5), ey - 7);
    ctx.lineWidth = 5.4; ctx.stroke();
    ctx.beginPath();                                                          // lower lid, lower third
    ctx.moveTo(ex + s * 9, ey + hi * 0.48);
    ctx.quadraticCurveTo(ex + s * 2, ey + hi * 0.86, ex - s * 6, ey + hi * 0.66);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#8B6A46'; ctx.stroke();
    ctx.beginPath();                                                          // one lash (male)
    ctx.moveTo(ex + s * (eW - 1), ey - 7);
    ctx.quadraticCurveTo(ex + s * (eW + 4), ey - 11, ex + s * (eW + 9), ey - 15);
    ctx.lineWidth = 3.2; ctx.strokeStyle = LID; ctx.stroke();
    ctx.restore();
  }
  p7eye(cx + eyDX, eyY, 1);
  p7eye(cx - eyDX, eyY, -1);

  /* ================= 7. nose & mouth ================= */
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.strokeStyle = SKIN_LN;
  ctx.beginPath();
  ctx.moveTo(126, 140);
  ctx.quadraticCurveTo(124, 146, 121, 148);
  ctx.stroke();
  ctx.globalAlpha = 0.28; ctx.fillStyle = SKIN_S;
  p7ell(cx + 1, 150, 7.5, 2.6, 0); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#BE6E62'; ctx.lineWidth = 2.2;              // thin, amused smile
  ctx.beginPath();
  ctx.moveTo(112, 160.5);
  ctx.quadraticCurveTo(120, 165, 128, 158.5);
  ctx.stroke();
  ctx.lineWidth = 2.4; ctx.strokeStyle = '#D8968A';
  ctx.beginPath();
  ctx.moveTo(126.5, 159.5);
  ctx.quadraticCurveTo(129.5, 158, 130.5, 155);
  ctx.stroke();
  ctx.restore();

  /* ================= 8. hair in front: overlapping opaque 房 ================= */
  ctx.save();
  p7hairPath();
  var hg = ctx.createLinearGradient(96, 108, 146, 20);
  hg.addColorStop(0, HAIR_S); hg.addColorStop(0.55, HAIR); hg.addColorStop(1, '#F2E7C6');
  ctx.fillStyle = hg; ctx.fill();

  ctx.save();
  p7hairPath();
  ctx.clip();

  /* dark roots along the hairline */
  ctx.globalAlpha = 0.32; ctx.fillStyle = HAIR_R;
  ctx.beginPath();
  ctx.moveTo(62, 118); ctx.lineTo(73, 100);
  ctx.quadraticCurveTo(73, 86, 77, 72);
  ctx.lineTo(82, 80); ctx.lineTo(89, 66);
  ctx.lineTo(97, 77); ctx.lineTo(105, 62);
  ctx.lineTo(113, 74); ctx.lineTo(cx, 60.5);
  ctx.lineTo(128, 75); ctx.lineTo(136, 63);
  ctx.lineTo(145, 78); ctx.lineTo(152, 68);
  ctx.lineTo(158, 80); ctx.lineTo(163, 76);
  ctx.quadraticCurveTo(167, 88, 167, 100);
  ctx.lineTo(178, 118); ctx.lineTo(180, 98);
  ctx.quadraticCurveTo(174, 78, 157, 66);
  ctx.quadraticCurveTo(142, 56, cx, 54);
  ctx.quadraticCurveTo(98, 56, 83, 66);
  ctx.quadraticCurveTo(66, 78, 60, 98);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
  /* outer locks first so the centre ones lie on top */
  var LKC = ['#FFFBEF', '#C9B37C', '#F6EDD2', '#DAC48E', '#B49A60', '#9C8349'];
  var order = [0, 5, 1, 4, 2, 3];
  for (var q = 0; q < order.length; q++) {
    var li = order[q];
    var jit = sway * (0.5 + p7r(li) * 0.8);
    ctx.fillStyle = LKC[li];
    p7lock(HB[li][0], HB[li][1], HT[li][0] + jit, HT[li][1] + sway * 0.4, 14);
    ctx.fill();
  }
  /* two side locks sweeping down past the temples */
  ctx.fillStyle = '#B9A473';
  p7lock(73, 106, 63 + sway * 0.6, 62, 8); ctx.fill();
  ctx.fillStyle = '#9C8349';
  p7lock(167, 106, 178 + sway * 0.6, 72, 8); ctx.fill();

  /* one broken band of light across the crown */
  ctx.globalAlpha = 0.45; ctx.fillStyle = '#FFFDF3';
  p7leaf(95, 51 + sway * 0.3, -0.60, 21, 3.8);
  p7leaf(124, 42 + sway * 0.3, -0.04, 25, 4.4);
  p7leaf(152, 50 + sway * 0.3, 0.44, 19, 3.4);
  ctx.globalAlpha = 1;
  ctx.restore();                                     // un-clip the hair

  ctx.lineWidth = 2.3; ctx.lineJoin = 'round';
  ctx.strokeStyle = HAIR_LN;
  p7hairPath(); ctx.stroke();                        // outline on the silhouette only

  /* the one lock that falls on the forehead */
  ctx.beginPath();
  ctx.moveTo(103, 63);
  ctx.bezierCurveTo(108 + sway2 * 0.3, 76, 116 + sway2 * 0.7, 88, 127 + sway2, 103);
  ctx.bezierCurveTo(126 + sway2 * 0.6, 86, 124 + sway2 * 0.3, 70, 121, 56);
  ctx.closePath();
  var lg = ctx.createLinearGradient(105, 62, 127, 103);
  lg.addColorStop(0, '#E2D2A4'); lg.addColorStop(0.45, '#FAF3DE'); lg.addColorStop(1, '#FFFBEF');
  ctx.fillStyle = lg; ctx.fill();
  ctx.lineWidth = 1.8; ctx.strokeStyle = '#A88F55'; ctx.stroke();
  ctx.restore();

  /* ================= 9. monocle ================= */
  ctx.save();
  var mx = cx - eyDX, my = eyY, mr = 16.5;
  p7ell(mx, my, mr, mr, 0);
  ctx.fillStyle = 'rgba(255,250,225,0.12)'; ctx.fill();
  ctx.lineWidth = 3.2; ctx.strokeStyle = GOLD_S; ctx.stroke();
  ctx.lineWidth = 1.7; ctx.strokeStyle = GOLD; ctx.stroke();
  ctx.beginPath();
  ctx.arc(mx, my, mr, Math.PI * 1.06, Math.PI * 1.52);
  ctx.lineWidth = 1.5; ctx.strokeStyle = GOLD_L; ctx.stroke();
  ctx.save();                                          // lens glint
  p7ell(mx, my, mr - 1.6, mr - 1.6, 0); ctx.clip();
  ctx.globalAlpha = 0.22; ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(mx - 18, my + 4); ctx.lineTo(mx - 4, my - 19);
  ctx.lineTo(mx + 2.5, my - 19); ctx.lineTo(mx - 11.5, my + 4);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  p7ell(mx - 17, my + 7, 3.2, 3.2, 0);                 // hinge
  ctx.fillStyle = GOLD; ctx.fill();
  ctx.lineWidth = 1.3; ctx.strokeStyle = GOLD_LN; ctx.stroke();
  var c0x = mx - 18, c0y = my + 10, c1x = mx - 32, c1y = my + 42,
      c2x = mx - 34, c2y = my + 76, c3x = mx - 26, c3y = my + 100;
  ctx.beginPath();
  ctx.moveTo(c0x, c0y);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, c3x, c3y);
  ctx.lineWidth = 2.4; ctx.strokeStyle = GOLD_S; ctx.stroke();
  ctx.lineWidth = 1.1; ctx.strokeStyle = GOLD_L; ctx.stroke();
  for (var k = 1; k <= 5; k++) {
    var u2 = k / 6, iu2 = 1 - u2;
    var px = iu2 * iu2 * iu2 * c0x + 3 * iu2 * iu2 * u2 * c1x +
             3 * iu2 * u2 * u2 * c2x + u2 * u2 * u2 * c3x;
    var py = iu2 * iu2 * iu2 * c0y + 3 * iu2 * iu2 * u2 * c1y +
             3 * iu2 * u2 * u2 * c2y + u2 * u2 * u2 * c3y;
    p7ell(px, py, 2.2, 2.2, 0);
    ctx.fillStyle = GOLD; ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}


/* ============================================================ */

function dvT7(ctx, col, T, facing) {
  ctx.save();

  function t7dk(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round(((n >> 16) & 255) * f) + ',' +
                    Math.round(((n >> 8) & 255) * f) + ',' +
                    Math.round((n & 255) * f) + ')';
  }
  function t7ell(x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  function t7pair(fn) { fn(1); fn(-1); }
  function t7lock(bx, by, tx, ty, w) {           // pointed at both ends
    var dx = tx - bx, dy = ty - by, L = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / L, ny = dx / L;
    var ax = bx + dx * 0.34, ay = by + dy * 0.34;
    var mx2 = bx + dx * 0.74, my2 = by + dy * 0.74;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.bezierCurveTo(ax + nx * w, ay + ny * w, mx2 + nx * w * 0.8, my2 + ny * w * 0.8, tx, ty);
    ctx.bezierCurveTo(mx2 - nx * w * 0.8, my2 - ny * w * 0.8, ax - nx * w, ay - ny * w, bx, by);
    ctx.closePath();
  }

  var t = (typeof T === 'number' && isFinite(T)) ? T : 0;
  var f = (facing === -1) ? -1 : 1;
  var PC = (typeof col === 'string' && /^#[0-9a-fA-F]{6}$/.test(col)) ? col : '#E9B840';
  var PC_D = t7dk(PC, 0.58);

  var SKIN = '#FDE7DA', SKIN_S = '#EDC3AC', SKIN_LN = t7dk('#EDC3AC', 0.66);
  var HAIR = '#E7D8AE', HAIR_LN = t7dk('#E7D8AE', 0.64);
  var COAT = '#242634', COAT_L = '#3D4155', COAT_LN = '#0A0B11';
  var GOLD = '#E9B840', GOLD_L = '#FCEBA6', GOLD_LN = '#66470C';

  /* contact shadow, drawn before the bob so it stays on the ground */
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = '#161008';
  t7ell(0, 0, 15.5, 5, 0);
  ctx.fill();
  ctx.restore();

  ctx.translate(0, Math.sin(t * Math.PI / 1000) * 1.5);   // breathing: 2s period, +/-1.5px
  ctx.scale(f, 1);

  /* ---- boots ---- */
  ctx.save();
  ctx.lineJoin = 'round';
  t7pair(function (s) {
    ctx.beginPath();
    ctx.moveTo(s * 2.4, -14);
    ctx.lineTo(s * 8.8, -14);
    ctx.lineTo(s * 9.4, -2.6);
    ctx.quadraticCurveTo(s * 9.4, -0.6, s * 7.4, -0.6);
    ctx.lineTo(s * 2.4, -0.6);
    ctx.quadraticCurveTo(s * 1.4, -0.6, s * 1.8, -3);
    ctx.closePath();
    ctx.fillStyle = COAT; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = COAT_LN; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 2.1, -11.4); ctx.lineTo(s * 9.1, -11.4);
    ctx.lineWidth = 2; ctx.strokeStyle = GOLD; ctx.stroke();
  });
  ctx.restore();

  /* ---- long coat ---- */
  ctx.save();
  function t7coat() {
    ctx.beginPath();
    ctx.moveTo(-11, -45);
    ctx.bezierCurveTo(-15, -34, -16.5, -22, -15.5, -9);
    ctx.lineTo(15.5, -9);
    ctx.bezierCurveTo(16.5, -22, 15, -34, 11, -45);
    ctx.closePath();
  }
  t7coat();
  ctx.fillStyle = COAT; ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = COAT_L;
  ctx.beginPath();
  ctx.moveTo(3, -47); ctx.lineTo(13, -45);
  ctx.lineTo(18, -9); ctx.lineTo(8, -9);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = PC;                                   // player colour on the hem
  ctx.fillRect(-19, -15, 38, 6.5);
  ctx.fillStyle = PC_D;
  ctx.fillRect(-19, -10.6, 38, 2.2);
  ctx.restore();
  ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.strokeStyle = COAT_LN;
  t7coat(); ctx.stroke();

  /* player-colour collar + gold tie */
  ctx.beginPath();
  ctx.moveTo(-10.5, -46); ctx.lineTo(0, -32); ctx.lineTo(10.5, -46);
  ctx.lineTo(5, -48); ctx.lineTo(0, -41.5); ctx.lineTo(-5, -48);
  ctx.closePath();
  ctx.fillStyle = PC; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = PC_D; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2.6, -41.5); ctx.lineTo(2.6, -41.5);
  ctx.lineTo(2.2, -36); ctx.lineTo(0, -30); ctx.lineTo(-2.2, -36);
  ctx.closePath();
  ctx.fillStyle = GOLD; ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = GOLD_LN; ctx.stroke();
  for (var b = 0; b < 2; b++) {
    t7ell(6.5, -27 + b * 8, 1.9, 1.9, 0);
    ctx.fillStyle = GOLD; ctx.fill();
    ctx.lineWidth = 0.9; ctx.strokeStyle = GOLD_LN; ctx.stroke();
  }
  /* arms */
  t7pair(function (s) {
    ctx.beginPath();
    ctx.moveTo(s * 10.5, -44);
    ctx.quadraticCurveTo(s * 18, -35, s * 16, -20);
    ctx.quadraticCurveTo(s * 12, -20, s * 10.5, -26);
    ctx.closePath();
    ctx.fillStyle = COAT; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = COAT_LN; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 11.4, -25); ctx.lineTo(s * 16.2, -23.5);
    ctx.lineWidth = 2.4; ctx.strokeStyle = GOLD; ctx.stroke();
  });
  ctx.restore();

  /* ---- head ---- */
  ctx.save();
  function t7face() {
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.bezierCurveTo(8, -70, 13, -64.5, 13, -57);
    ctx.bezierCurveTo(13, -50, 9, -44, 0, -42.5);
    ctx.bezierCurveTo(-9, -44, -13, -50, -13, -57);
    ctx.bezierCurveTo(-13, -64.5, -8, -70, 0, -70);
    ctx.closePath();
  }
  t7face();
  ctx.fillStyle = SKIN; ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.5; ctx.fillStyle = SKIN_S;
  ctx.fillRect(-15, -72, 30, 10.5);
  ctx.globalAlpha = 0.14; ctx.fillStyle = '#F9A8A8';
  t7ell(-7.5, -50.5, 3.8, 2, 0); ctx.fill();
  t7ell(7.5, -50.5, 3.8, 2, 0); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = SKIN_LN;
  t7face(); ctx.stroke();

  /* face = 2 eyes + a mouth only */
  var eo = 1.5;
  t7pair(function (s) {
    var ex = eo + s * 5.6;
    t7ell(ex, -54.5, 3.2, 4.3, 0);
    ctx.fillStyle = '#3B2818'; ctx.fill();
    t7ell(ex, -54, 2.3, 3.3, 0);
    ctx.fillStyle = GOLD; ctx.fill();
    t7ell(ex - 0.9, -55.4, 1.1, 1.1, 0);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
  });
  ctx.strokeStyle = '#B49A60'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  t7pair(function (s) {
    ctx.beginPath();
    ctx.moveTo(eo + s * 2.6, -60);
    ctx.quadraticCurveTo(eo + s * 6, -62.2, eo + s * 8.8, -61);
    ctx.stroke();
  });
  ctx.strokeStyle = '#BE6E62'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(eo - 2.4, -47.6);
  ctx.quadraticCurveTo(eo + 0.6, -45.9, eo + 3.4, -48.3);
  ctx.stroke();
  ctx.restore();

  /* ---- slicked-back platinum hair: the silhouette identifies him ---- */
  ctx.save();
  function t7hair() {
    ctx.beginPath();
    ctx.moveTo(-12.5, -58);                        // back-side lock
    ctx.lineTo(-20.5, -52);                        // swept-back tail, sharp tip
    ctx.lineTo(-14.5, -60);
    ctx.quadraticCurveTo(-16.5, -67, -7, -70);     // crest 1
    ctx.quadraticCurveTo(-2, -72, 1, -68.5);
    ctx.quadraticCurveTo(5.5, -73, 12.5, -67);     // crest 2
    ctx.quadraticCurveTo(15.5, -64.5, 14, -58);
    ctx.lineTo(12.5, -56);
    ctx.quadraticCurveTo(12.5, -61.5, 9.5, -64.5); // jagged hairline
    ctx.lineTo(7, -61); ctx.lineTo(3.5, -66);
    ctx.lineTo(0, -62); ctx.lineTo(-3.5, -66.5);
    ctx.lineTo(-6.5, -62); ctx.lineTo(-9.5, -65);
    ctx.quadraticCurveTo(-11.5, -62, -12.5, -58);
    ctx.closePath();
  }
  t7hair();
  ctx.fillStyle = HAIR; ctx.fill();
  ctx.save();
  t7hair(); ctx.clip();
  var tlk = [[-9.5, -65, -14.5, -68.5, 3.2], [-3.5, -66.5, -3, -71.5, 3.4],
             [3.5, -66, 5, -71, 3.4], [9.5, -64.5, 13.5, -66.5, 3.0]];
  var tlc = ['#FFFBEF', '#C9B37C', '#F6EDD2', '#AC9459'];
  for (var i = 0; i < tlk.length; i++) {
    ctx.fillStyle = tlc[i];
    t7lock(tlk[i][0], tlk[i][1], tlk[i][2], tlk[i][3], tlk[i][4]);
    ctx.fill();
  }
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#FFFDF3';   // small highlight streak
  ctx.beginPath();
  ctx.moveTo(-11, -65);
  ctx.quadraticCurveTo(-5, -70.5, 6, -69.5);
  ctx.quadraticCurveTo(-4, -67.5, -9.5, -63);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.strokeStyle = HAIR_LN;
  t7hair(); ctx.stroke();

  /* the one lock on the forehead */
  ctx.beginPath();
  ctx.moveTo(-2.5, -67.5);
  ctx.quadraticCurveTo(2.5, -62.5, 7, -55.5);
  ctx.quadraticCurveTo(4, -63, 1.5, -68.5);
  ctx.closePath();
  ctx.fillStyle = '#FCF6E2'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = HAIR_LN; ctx.stroke();
  ctx.restore();

  /* ---- monocle ---- */
  ctx.save();
  t7ell(eo + 5.6, -54.5, 4.9, 4.9, 0);
  ctx.fillStyle = 'rgba(255,250,225,0.14)'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = GOLD_LN; ctx.stroke();
  ctx.lineWidth = 0.9; ctx.strokeStyle = GOLD_L; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(eo + 10.4, -52.5);
  ctx.quadraticCurveTo(eo + 13.5, -46.5, eo + 10, -41.5);
  ctx.lineWidth = 1.1; ctx.strokeStyle = GOLD; ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/* ── 呼び分け（3b-art.js の旧 dvChar を上書きする） ── */
function dvPort(id, ctx, T){
  const F = [dvP0,dvP1,dvP2,dvP3,dvP4,dvP5,dvP6,dvP7];
  const f = F[((id|0)%8+8)%8];
  if(f){ try{ f(ctx, T||0); }catch(e){} }
}
function dvChar(ctx, id, col, T, facing){
  const F = [dvT0,dvT1,dvT2,dvT3,dvT4,dvT5,dvT6,dvT7];
  const f = F[((id|0)%8+8)%8];
  if(f){ try{ f(ctx, col, T||0, facing||1); }catch(e){} }
}
