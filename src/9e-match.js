
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 対戦の入口と出口（9e-match.js / WP4）
   ──────────────────────────────────────────────────────────────
   ⑥ 対戦相手を検索中（#vs を重ねる）   … vsScreen
   ⑦ ローディング（#loading を作り直す） … loadingPhase
   ⑧ 盤の上で順番決め＋祭り都市        … dkOrderOnBoard
   ⑪ WIN / LOSE パネル（#result）      … showResult ＋ grantRewards
   ⑫ 宝箱3択 → 同じ部屋へ              … dkmChest*
   ・トップレベルは function 宣言と DKM_ 付きの定数と初期化 IIFE だけ。
   ・絵はすべて CSS / SVG で自作（本家の絵・ロゴ・キャラは使わない）。
   ・見た目の乱数は DKFX.rnd()。順番と宝箱の中身だけはゲームの乱数（Math.random）。
   ══════════════════════════════════════════════════════════════ */

const DKM_LOAD_N = 56;                        // Loading...(n/56)
const DKM_PICK_MS = 5000;                     // 順番カード：放置で自動
const DKM_STREAK_MS = 18 * 3600 * 1000;       // 連勝認定時間 18時間
const DKM_LOSE3_GOLD = 3000;                  // 3連敗の応援（当作独自）
const DKM_TIPS = [
  '同じ色の街を全部そろえると、その色の通行料が2倍になります。',
  '色の独占を3つそろえると「トリプル独占」で、その場で勝ちです。',
  '1辺の街をぜんぶ持つと「ライン独占」で、その場で勝ちです。',
  '観光地（空色とピンクのマス）を全部持つと「観光地独占」で勝ちです。',
  '空色の観光地は、2つ持つと通行料2倍、3つそろえると4倍になります。',
  'ピンクの観光地は、人が止まるたびに通行料が上がります（最大4倍）。',
  '世界旅行のマスに止まると、次のターンに好きなマスへ移動できます。',
  '監獄では「ダブルに挑戦」「お金を払う」「脱出カード」の3つから選べます。',
  '［押す］を長押しすると目盛りが2〜12を往復。狙った数で離すと近い目が出ます。',
  '奇数・偶数ボタンでモードを切り替えると、その目が必ず出ます（回数かぎり）。',
  'ダブル（ゾロ目）が出たらもう一回。ただし3回続くと監獄行きです。',
  '相手の街は「買収」で奪えます。観光地とランドマークは買収できません。',
  'ランドマークを建てると通行料が跳ね上がり、買収されなくなります。',
  '建物は1周ごとに1段ずつ解放されます。スタートを通るのが近道です。',
  '祭り都市（×2）は試合の最初に3つ決まり、最後まで通行料が2倍です。',
  '残り6ターンから通行料が毎ターン1.5倍に。負けていても諦めないこと。',
  'ボーナスのマスではミニゲーム。当てるたびに賞金の倍率が上がります。',
  'キャラクターの能力は、魔力ゲージが満タンになると使えます。',
  'アイテムはサイコロを振る前に使ってください。',
  '天使カードを持っていると、通行料を払う時に使うか聞かれます。',
  '連勝するほど、試合後の宝箱の中身が良くなります（最大5連勝）。'
];
/* 世界地図の上の金の弧（SVG の座標。viewBox 0 -90 1000 590） */
const DKM_ARCS = [
  { a:{x:872, y:168}, c:{x:540, y:-110}, b:{x:212, y:150} },
  { a:{x:872, y:168}, c:{x:690, y:-10},  b:{x:498, y:104} }
];
const DKM_CHEST_COL = [
  { nm:'red',    hi:'#FF8A6E', mid:'#D8392E', lo:'#7E1510', gem:'#7FE0FF' },
  { nm:'violet', hi:'#D9A8FF', mid:'#9A4FD6', lo:'#3E1470', gem:'#FFE27A' },
  { nm:'teal',   hi:'#8FF2DE', mid:'#22A897', lo:'#0B5650', gem:'#FF8FB0' }
];

var DKM_st = { online:false, uid:0, vsTok:0, vsRaf:0, ordTok:0, res:null };

/* ══════════ 小さな道具 ══════════ */
function dkmId(){ DKM_st.uid = (DKM_st.uid + 1) % 1e9; return 'dkm' + DKM_st.uid; }
function dkmR(){ try{ return DKFX.rnd(); }catch(e){ return 0.5; } }
function dkmSfx(n, v){ try{ if(SFX && SFX[n]) SFX[n](v); }catch(e){} }
function dkmMapNow(){ return MAPS.find(function(m){ return m.id === cfg.mapId; }) || MAPS[0]; }
function dkmSeats(){ return (cfg.seats || []).slice(0, cfg.n || 4); }
function dkmSpeed(){ return (typeof SPEED === 'number' && SPEED > 0) ? SPEED : 1; }
function dkmF(n){ return Math.round(+n || 0).toLocaleString(); }
function dkmShown(el){ return !!(el && el.isConnected && el.getClientRects().length); }
function dkmClassOf(){
  var id = cfg.cls || (typeof SV === 'object' && SV && SV.cls) || 'eco', c = null;
  try{ c = dkClassOf(id); }catch(e){ c = null; }
  return { id:id, nm:(c && c.nm) || 'エコノミー', x:(c && +c.x > 0) ? +c.x : 1 };
}
/* このブラウザの対戦がオンラインか（loadingPhase の時点の DV_OL.started と、席の名前の一致で見る） */
function dkmIsOnline(){
  var OL = window.DV_OL;
  if(!OL || !Array.isArray(OL.seats) || !OL.seats.length || !OL.me) return false;
  if(!(DKM_st.online || OL.started)) return false;
  if(!G || !G.players || OL.seats.length < G.players.length) return false;
  for(var i = 0; i < G.players.length; i++){
    if(!OL.seats[i] || OL.seats[i].name !== G.players[i].name) return false;
  }
  return true;
}
/* 自分の席。オンラインは DV_OL.seats と DV_OL.me から、オフラインは「あなた」→ 最初の人間 */
function dkmMe(){
  if(!G || !G.players) return -1;
  if(dkmIsOnline()){
    var OL = window.DV_OL;
    for(var i = 0; i < G.players.length; i++) if(OL.seats[i] && OL.seats[i].pid === OL.me) return i;
    return -1;
  }
  for(var j = 0; j < G.players.length; j++) if(G.players[j].kind === 'you') return j;
  for(var k = 0; k < G.players.length; k++) if(G.players[k].kind !== 'cpu') return k;
  return -1;
}
/* 立ち絵（あれば画像、無ければ肖像 canvas） */
function dkmPortrait(cardId, cls){
  var u = '';
  try{ u = dkCharImg(cardId) || ''; }catch(e){ u = ''; }
  if(u) return '<i class="dkm-face ' + (cls || '') + '" style="background-image:url(' + u + ')"></i>';
  return '<canvas class="dkm-face ' + (cls || '') + '" width="176" height="176" data-dkm-card="' + esc(cardId || '') + '"></canvas>';
}
function dkmPaintFaces(root){
  if(!root) return;
  root.querySelectorAll('canvas[data-dkm-card]').forEach(function(c){
    var card = cardById(c.getAttribute('data-dkm-card')) || CARDPOOL[0];
    try{ regPortrait(c, card.art, card.col, card.id); }catch(e){}
  });
}

/* ══════════ SVG の絵（すべて自作） ══════════ */
/* 白いサイコロ（等角図）。上＝1（赤）、左＝3、右＝5 */
function dkmDiceSVG(){
  var u = dkmId();
  var pip = function(x, y, r, fill){ return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"/>'; };
  var dark = 'url(#' + u + 'p)';
  return '<svg class="dkm-die" viewBox="-12 -12 224 242" aria-hidden="true">'
    + '<defs>'
    + '<linearGradient id="' + u + 't" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4EDF4"/></linearGradient>'
    + '<linearGradient id="' + u + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6EEF5"/><stop offset="1" stop-color="#B4C3D2"/></linearGradient>'
    + '<linearGradient id="' + u + 'r" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6D2DE"/><stop offset="1" stop-color="#8E9FB2"/></linearGradient>'
    + '<radialGradient id="' + u + 'p" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3A4A5E"/><stop offset="1" stop-color="#0E1622"/></radialGradient>'
    + '<radialGradient id="' + u + 'q" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FF6A5E"/><stop offset="1" stop-color="#9C1210"/></radialGradient>'
    + '</defs>'
    + '<g stroke-linejoin="round" stroke-width="12">'
    + '<polygon points="0,50 100,0 200,50 100,100" fill="url(#' + u + 't)" stroke="url(#' + u + 't)"/>'
    + '<polygon points="0,50 100,100 100,215 0,165" fill="url(#' + u + 'l)" stroke="url(#' + u + 'l)"/>'
    + '<polygon points="100,100 200,50 200,165 100,215" fill="url(#' + u + 'r)" stroke="url(#' + u + 'r)"/>'
    + '</g>'
    + '<path d="M-4 52 L100 -2 L204 52" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>'
    + '<g transform="matrix(1,-0.5,1,0.5,0,50)">' + pip(50, 50, 15, 'url(#' + u + 'q)') + '</g>'
    + '<g transform="matrix(1,0.5,0,1.15,0,50)">' + pip(24, 24, 9.5, dark) + pip(50, 50, 9.5, dark) + pip(76, 76, 9.5, dark) + '</g>'
    + '<g transform="matrix(1,-0.5,0,1.15,100,100)">' + pip(24, 24, 9.5, dark) + pip(76, 24, 9.5, dark) + pip(50, 50, 9.5, dark)
    +   pip(24, 76, 9.5, dark) + pip(76, 76, 9.5, dark) + '</g>'
    + '</svg>';
}
/* 地平線のシルエット（マップごと）。y=300 が地平線、幅1600 */
function dkmSkyline(mapId){
  var B = 300, d = '';
  var tri = function(x, w, h){ d += 'M' + x + ' ' + B + 'L' + (x + w / 2) + ' ' + (B - h) + 'L' + (x + w) + ' ' + B + 'Z'; };
  var rect = function(x, w, h){ d += 'M' + x + ' ' + B + 'V' + (B - h) + 'H' + (x + w) + 'V' + B + 'Z'; };
  var spire = function(x, w, h){ d += 'M' + x + ' ' + B + 'V' + (B - h * 0.72) + 'L' + (x + w / 2) + ' ' + (B - h) + 'L' + (x + w) + ' ' + (B - h * 0.72) + 'V' + B + 'Z'; };
  var dome = function(x, w, h){
    d += 'M' + x + ' ' + B + 'V' + (B - h * 0.5) + 'Q' + x + ' ' + (B - h * 0.92) + ' ' + (x + w / 2) + ' ' + (B - h * 0.92)
       + 'Q' + (x + w) + ' ' + (B - h * 0.92) + ' ' + (x + w) + ' ' + (B - h * 0.5) + 'V' + B + 'Z';
    rect(x + w / 2 - 3, 6, h);
  };
  var lattice = function(x, w, h){
    d += 'M' + x + ' ' + B + 'Q' + (x + w * 0.34) + ' ' + (B - h * 0.3) + ' ' + (x + w * 0.45) + ' ' + (B - h * 0.86)
       + 'L' + (x + w * 0.5) + ' ' + (B - h) + 'L' + (x + w * 0.55) + ' ' + (B - h * 0.86)
       + 'Q' + (x + w * 0.66) + ' ' + (B - h * 0.3) + ' ' + (x + w) + ' ' + B
       + 'L' + (x + w * 0.68) + ' ' + B + 'Q' + (x + w * 0.5) + ' ' + (B - h * 0.2) + ' ' + (x + w * 0.32) + ' ' + B + 'Z';
  };
  var clock = function(x, w, h){ rect(x, w, h * 0.78); tri(x - 4, w + 8, h * 0.22 + 0); d += 'M' + (x - 4) + ' ' + (B - h * 0.78) + 'L' + (x + w / 2) + ' ' + (B - h) + 'L' + (x + w + 4) + ' ' + (B - h * 0.78) + 'Z'; };
  var pagoda = function(x, w, h){
    var n = 4, lh = h / n;
    for(var k = 0; k < n; k++){
      var ww = w * (1 - k * 0.16), xx = x + (w - ww) / 2, y0 = B - k * lh;
      d += 'M' + (xx - 8) + ' ' + (y0 - lh * 0.35) + 'L' + (xx + ww + 8) + ' ' + (y0 - lh * 0.35) + 'L' + (xx + ww * 0.85) + ' ' + (y0 - lh * 0.62)
         + 'L' + (xx + ww * 0.15) + ' ' + (y0 - lh * 0.62) + 'Z';
      rect(xx + ww * 0.2, ww * 0.6, k * lh + lh * 0.4);
    }
    rect(x + w / 2 - 2, 4, h + 22);
  };
  var mount = function(x, w, h){ d += 'M' + x + ' ' + B + 'Q' + (x + w * 0.3) + ' ' + (B - h * 0.2) + ' ' + (x + w * 0.45) + ' ' + (B - h)
    + 'Q' + (x + w * 0.55) + ' ' + (B - h * 1.04) + ' ' + (x + w * 0.62) + ' ' + (B - h * 0.82) + 'Q' + (x + w * 0.8) + ' ' + (B - h * 0.3) + ' ' + (x + w) + ' ' + B + 'Z'; };
  var pine = function(x, w, h){ tri(x, w, h * 0.55); d += 'M' + (x + w * 0.1) + ' ' + (B - h * 0.35) + 'L' + (x + w / 2) + ' ' + (B - h) + 'L' + (x + w * 0.9) + ' ' + (B - h * 0.35) + 'Z'; };
  var crystal = function(x, w, h){
    d += 'M' + x + ' ' + B + 'L' + (x + w * 0.12) + ' ' + (B - h * 0.55) + 'L' + (x + w * 0.24) + ' ' + (B - h * 0.3) + 'L' + (x + w * 0.38) + ' ' + (B - h)
       + 'L' + (x + w * 0.52) + ' ' + (B - h * 0.42) + 'L' + (x + w * 0.66) + ' ' + (B - h * 0.78) + 'L' + (x + w * 0.8) + ' ' + (B - h * 0.25)
       + 'L' + (x + w * 0.9) + ' ' + (B - h * 0.5) + 'L' + (x + w) + ' ' + B + 'Z';
  };
  var house = function(x, w, h){ d += 'M' + x + ' ' + B + 'V' + (B - h * 0.6) + 'L' + (x + w / 2) + ' ' + (B - h) + 'L' + (x + w) + ' ' + (B - h * 0.6) + 'V' + B + 'Z'; };
  var torii = function(x, w, h){
    rect(x + w * 0.14, w * 0.1, h * 0.82); rect(x + w * 0.76, w * 0.1, h * 0.82);
    d += 'M' + (x - 6) + ' ' + (B - h * 0.9) + 'Q' + (x + w / 2) + ' ' + (B - h * 1.02) + ' ' + (x + w + 6) + ' ' + (B - h * 0.9) + 'V' + (B - h * 0.8) + 'H' + (x - 6) + 'Z';
    d += 'M' + (x + w * 0.06) + ' ' + (B - h * 0.66) + 'H' + (x + w * 0.94) + 'V' + (B - h * 0.59) + 'H' + (x + w * 0.06) + 'Z';
  };
  var back = '', lights = [];
  var win = function(x, w, h, n){
    for(var k = 0; k < n; k++) lights.push({ x:x + 4 + dkmR() * Math.max(2, w - 12), y:B - 10 - dkmR() * Math.max(6, h - 24) });
  };
  if(mapId === 'ice'){
    mount(-40, 520, 170); mount(1080, 600, 190); back = d; d = '';
    crystal(40, 180, 150); pine(250, 60, 120); pine(300, 50, 95); spire(380, 46, 210); spire(436, 34, 160);
    rect(420, 110, 70); spire(500, 40, 180); crystal(560, 120, 90);
    crystal(960, 130, 100); spire(1080, 44, 190); rect(1060, 120, 80); spire(1150, 36, 150);
    pine(1220, 58, 110); pine(1270, 46, 86); crystal(1340, 220, 160); pine(1540, 60, 100);
    win(420, 110, 70, 5); win(1060, 120, 80, 5);
  } else if(mapId === 'oita'){
    mount(-60, 640, 200); mount(460, 380, 120); mount(1000, 660, 220); back = d; d = '';
    pagoda(80, 110, 190); house(220, 70, 60); house(300, 80, 70); torii(410, 120, 110); house(560, 70, 50);
    rect(980, 60, 90); rect(1052, 20, 250); rect(1040, 44, 40); house(1100, 80, 70); house(1190, 70, 56);
    rect(1270, 90, 110); rect(1370, 70, 80); pagoda(1450, 100, 170);
    win(220, 70, 50, 3); win(300, 80, 60, 3); win(1270, 90, 100, 6); win(1370, 70, 70, 4); win(980, 60, 80, 4);
  } else {
    mount(-80, 520, 110); mount(1180, 520, 130); back = d; d = '';
    tri(40, 190, 120); tri(170, 130, 82); dome(330, 110, 120); rect(310, 12, 150); rect(448, 12, 150);
    lattice(480, 120, 270); rect(610, 40, 150); rect(655, 30, 110); rect(1000, 34, 120);
    clock(1040, 46, 240); dome(1100, 130, 140); rect(1240, 44, 170); rect(1290, 30, 120);
    pagoda(1340, 90, 160); tri(1460, 150, 96);
    win(610, 40, 140, 6); win(655, 30, 100, 4); win(1000, 34, 110, 4); win(1240, 44, 160, 7); win(1290, 30, 110, 4);
  }
  return { back:back, front:d, lights:lights };
}
function dkmSkylineSVG(mapId, refl){
  var s = dkmSkyline(mapId), u = dkmId();
  var lit = refl ? '' : s.lights.map(function(p, k){
    return '<rect class="dkm-lw' + (k % 3) + '" x="' + p.x.toFixed(1) + '" y="' + p.y.toFixed(1) + '" width="5" height="7" rx="1"/>';
  }).join('');
  return '<svg class="' + (refl ? 'dkm-ld-refl' : 'dkm-ld-city') + '" viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden="true">'
    + '<defs><linearGradient id="' + u + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--dkm-sil-hi)"/><stop offset="1" style="stop-color:var(--dkm-sil)"/></linearGradient></defs>'
    + '<path d="' + s.back + '" style="fill:var(--dkm-sil-back)"/>'
    + '<path d="' + s.front + '" fill="url(#' + u + 'f)"/>'
    + '<g fill="#FFD58A">' + lit + '</g>'
    + '</svg>';
}
/* 水色の世界地図（等距円筒の簡略形。viewBox 0 -90 1000 590） */
function dkmWorldSVG(){
  var u = dkmId();
  var land = [
    'M58 96L140 62L232 56L302 72L332 112L302 150L272 170L256 210L226 236L202 262L186 246L172 212L130 190L100 152L70 132Z',
    'M330 40L382 34L402 60L372 90L342 80Z',
    'M232 272L272 266L312 292L322 332L298 382L272 430L252 452L242 410L236 362L222 312Z',
    'M452 82L500 66L540 76L546 106L522 126L490 136L466 126L456 106Z', 'M432 88L446 84L448 104L436 108Z',
    'M456 162L520 152L572 172L592 212L576 262L556 312L530 362L506 372L490 322L476 272L452 232L442 192Z',
    'M540 72L622 50L722 54L822 70L902 96L932 132L902 162L862 176L832 212L792 232L762 252L732 232L702 208L662 212L622 192L592 162L562 136L546 106Z',
    'M662 212L692 216L702 252L682 278L666 248Z', 'M878 144L892 150L898 184L886 190L880 170Z',
    'M780 332L842 316L892 336L902 372L872 402L822 406L786 386L772 356Z'
  ].join('');
  var isle = '<ellipse cx="762" cy="272" rx="16" ry="7"/><ellipse cx="800" cy="286" rx="20" ry="7"/><ellipse cx="832" cy="276" rx="12" ry="6"/>';
  var grid = '';
  for(var gx = 0; gx <= 1000; gx += 100) grid += '<path d="M' + gx + ' -60V480"/>';
  for(var gy = 0; gy <= 480; gy += 80) grid += '<path d="M0 ' + gy + 'H1000"/>';
  var arcs = '', dots = '', pins = '';
  DKM_ARCS.forEach(function(A, i){
    var p = 'M' + A.a.x + ' ' + A.a.y + 'Q' + A.c.x + ' ' + A.c.y + ' ' + A.b.x + ' ' + A.b.y;
    arcs += '<path class="dkm-arc-glow" d="' + p + '"/><path class="dkm-arc" d="' + p + '" stroke="url(#' + u + 'a)"/>';
    for(var k = 0; k < 7; k++) dots += '<circle class="dkm-arcdot' + (k === 0 ? ' head' : '') + '" data-arc="' + i + '" data-ph="' + (k / 7).toFixed(3) + '" r="' + (k === 0 ? 9 : 5.5) + '" cx="0" cy="0"/>';
    pins += '<g class="dkm-pin" transform="translate(' + A.b.x + ' ' + A.b.y + ')"><circle class="dkm-pin-ring" r="18"/><circle r="8" fill="url(#' + u + 'g)" stroke="#6B4408" stroke-width="2"/></g>';
  });
  pins += '<g class="dkm-pin me" transform="translate(' + DKM_ARCS[0].a.x + ' ' + DKM_ARCS[0].a.y + ')"><circle class="dkm-pin-ring" r="22"/><circle class="dkm-pin-ring r2" r="22"/>'
        + '<circle r="11" fill="url(#' + u + 'g)" stroke="#6B4408" stroke-width="2.5"/></g>';
  return '<svg class="dkm-world" viewBox="0 -90 1000 590" aria-hidden="true">'
    + '<defs>'
    + '<linearGradient id="' + u + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8F4FF"/><stop offset=".45" stop-color="#6ED2F2"/><stop offset="1" stop-color="#2A92C8"/></linearGradient>'
    + '<pattern id="' + u + 'd" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.7" fill="#FFFFFF" fill-opacity=".5"/></pattern>'
    + '<linearGradient id="' + u + 'a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#FFC93A"/><stop offset="1" stop-color="#FFF6C8"/></linearGradient>'
    + '<radialGradient id="' + u + 'g" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#FFFBE0"/><stop offset=".5" stop-color="#FFD24D"/><stop offset="1" stop-color="#B8800E"/></radialGradient>'
    + '<clipPath id="' + u + 'c"><path d="' + land + '"/>' + isle + '</clipPath>'
    + '</defs>'
    + '<g class="dkm-grid">' + grid + '</g>'
    + '<g fill="#0B4A72" transform="translate(0 12)"><path d="' + land + '"/>' + isle + '</g>'
    + '<g fill="#155F8C" transform="translate(0 6)"><path d="' + land + '"/>' + isle + '</g>'
    + '<g fill="url(#' + u + 'l)" stroke="#E9FBFF" stroke-width="2" stroke-linejoin="round"><path d="' + land + '"/>' + isle + '</g>'
    + '<g clip-path="url(#' + u + 'c)"><rect x="0" y="-90" width="1000" height="590" fill="url(#' + u + 'd)"/>'
    +   '<rect class="dkm-world-shine" x="-260" y="-90" width="200" height="590" fill="#FFFFFF" fill-opacity=".45"/></g>'
    + arcs + pins + dots
    + '</svg>';
}
/* FORTUNE CARD の裏（クリーム地に紅の唐草。中央に帯） viewBox 0 0 170 240 */
function dkmFortuneSVG(){
  var u = dkmId();
  var scroll = 'M0 18C-12 18-17 6-10-2C-4-9 8-7 7 3C6 9 0 9 0 5M0 18C12 18 22 10 26 0C30-10 40-12 44-4C48 3 42 9 37 6';
  var motif = '<g fill="none" stroke="#C8364E" stroke-width="2.4" stroke-linecap="round">'
    + '<path d="' + scroll + '"/><path d="M-2 22C-8 34-2 44 8 44" /><circle cx="44" cy="-4" r="2.4" fill="#C8364E" stroke="none"/></g>';
  var place = function(x, y, sx, sy, r){ return '<use href="#' + u + 'm" transform="translate(' + x + ' ' + y + ') scale(' + sx + ' ' + sy + ') rotate(' + (r || 0) + ')"/>'; };
  var border = '';
  for(var k = 0; k < 6; k++){
    border += '<circle cx="' + (22 + k * 25.2) + '" cy="16" r="3" fill="#E7869A"/><circle cx="' + (22 + k * 25.2) + '" cy="224" r="3" fill="#E7869A"/>';
  }
  return '<svg class="dkm-fsvg" viewBox="0 0 170 240" aria-hidden="true">'
    + '<defs>'
    + '<radialGradient id="' + u + 'b" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#FFFBF3"/><stop offset=".6" stop-color="#FCE8E0"/><stop offset="1" stop-color="#F3C6C4"/></radialGradient>'
    + '<linearGradient id="' + u + 'n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E6"/><stop offset="1" stop-color="#F7D9B6"/></linearGradient>'
    + '<g id="' + u + 'm">' + motif + '</g>'
    + '<pattern id="' + u + 'q" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M4 14c0-6 8-6 8 0s-6 5-6 1M18 5c4 0 5 5 1 6M24 23c-4 0-5-5-1-6M14 26c2-3 5-3 6 0" fill="none" stroke="#E7869A" stroke-width="1.2" stroke-linecap="round"/></pattern>'
    + '</defs>'
    + '<rect x="3" y="3" width="164" height="234" rx="13" fill="url(#' + u + 'b)" stroke="#D65A70" stroke-width="5"/>'
    + '<rect x="12" y="12" width="146" height="216" rx="7" fill="url(#' + u + 'q)" opacity=".6"/>'
    + '<rect x="11" y="11" width="148" height="218" rx="8" fill="none" stroke="#E8A0AE" stroke-width="1.6"/>'
    + '<rect x="15" y="15" width="140" height="210" rx="6" fill="none" stroke="#D65A70" stroke-width="1" stroke-dasharray="3 3"/>'
    + border
    + place(40, 52, 1, 1) + place(130, 52, -1, 1) + place(40, 188, 1, -1) + place(130, 188, -1, -1)
    + '<g stroke="#D65A70" stroke-width="1.5" fill="none"><path d="M85 34C70 50 70 70 85 84C100 70 100 50 85 34Z"/><path d="M85 206C70 190 70 170 85 156C100 170 100 190 85 206Z"/></g>'
    + '<rect x="12" y="104" width="146" height="32" fill="url(#' + u + 'n)" stroke="#C8364E" stroke-width="1.6"/>'
    + '<path d="M12 104l-6 16 6 16M158 104l6 16-6 16" fill="#E7869A"/>'
    + '<text x="85" y="128" text-anchor="middle" font-family="Bungee,\'Mochiy Pop One\',sans-serif" font-size="21" fill="#B82640" letter-spacing="1">FORTUNE</text>'
    + '<circle cx="85" cy="68" r="6" fill="#F2C230" stroke="#B8800E" stroke-width="1.5"/><circle cx="85" cy="172" r="6" fill="#F2C230" stroke="#B8800E" stroke-width="1.5"/>'
    + '</svg>';
}
/* 宝箱（赤・紫・青緑）。ふたは .dkm-lid（開くと transform で持ち上がる） viewBox 0 0 220 190 */
function dkmChestSVG(ci){
  var C = DKM_CHEST_COL[ci % 3], u = dkmId();
  var band = function(x){ return '<rect x="' + x + '" y="84" width="16" height="78" fill="url(#' + u + 'g)" stroke="#6B4408" stroke-width="1.5"/>'; };
  var rv = function(x, y){ return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#FFF3C8" stroke="#8A6314" stroke-width="1"/>'; };
  return '<svg class="dkm-csvg" viewBox="0 0 220 190" aria-hidden="true">'
    + '<defs>'
    + '<linearGradient id="' + u + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.hi + '"/><stop offset=".35" stop-color="' + C.mid + '"/><stop offset="1" stop-color="' + C.lo + '"/></linearGradient>'
    + '<linearGradient id="' + u + 'd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.hi + '"/><stop offset=".6" stop-color="' + C.mid + '"/><stop offset="1" stop-color="' + C.lo + '"/></linearGradient>'
    + '<linearGradient id="' + u + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3C8"/><stop offset=".35" stop-color="#F5D36B"/><stop offset=".7" stop-color="#C8952F"/><stop offset="1" stop-color="#7C5410"/></linearGradient>'
    + '<radialGradient id="' + u + 'w" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFBE0"/><stop offset=".45" stop-color="#FFE27A" stop-opacity=".85"/><stop offset="1" stop-color="#FFC93A" stop-opacity="0"/></radialGradient>'
    + '</defs>'
    + '<ellipse cx="110" cy="172" rx="92" ry="12" fill="#000" fill-opacity=".35"/>'
    + '<ellipse class="dkm-cglow" cx="110" cy="84" rx="92" ry="44" fill="url(#' + u + 'w)"/>'
    + '<rect x="22" y="84" width="176" height="80" rx="8" fill="url(#' + u + 'b)" stroke="#2A1604" stroke-width="3"/>'
    + '<path d="M26 110H194M26 136H194" stroke="#000" stroke-opacity=".18" stroke-width="2"/>'
    + band(42) + band(162)
    + '<rect x="22" y="154" width="176" height="10" rx="3" fill="url(#' + u + 'g)" stroke="#6B4408" stroke-width="1.5"/>'
    + rv(50, 150) + rv(170, 150)
    + '<g class="dkm-lid">'
    +   '<path d="M20 86Q20 30 110 26Q200 30 200 86Z" fill="url(#' + u + 'd)" stroke="#2A1604" stroke-width="3"/>'
    +   '<path d="M40 40Q110 22 180 40" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>'
    +   '<path d="M42 84V38Q48 32 58 30V84Z M162 84V30Q172 32 178 38V84Z" fill="url(#' + u + 'g)" stroke="#6B4408" stroke-width="1.5"/>'
    +   '<rect x="18" y="80" width="184" height="10" rx="4" fill="url(#' + u + 'g)" stroke="#6B4408" stroke-width="1.5"/>'
    +   '<circle cx="110" cy="40" r="9" fill="' + C.gem + '" stroke="#FFFFFF" stroke-width="2"/><circle cx="107" cy="37" r="3" fill="#fff" fill-opacity=".85"/>'
    + '</g>'
    + '<path d="M94 82H126V108Q110 122 94 108Z" fill="url(#' + u + 'g)" stroke="#5A3A04" stroke-width="2"/>'
    + '<circle cx="110" cy="96" r="4.5" fill="#2A1604"/><path d="M108 98L106 108H114L112 98Z" fill="#2A1604"/>'
    + '</svg>';
}
/* 月桂冠のメダル。icon: crown|triple|line|tour|ticket|lv|pend|gift  viewBox 0 0 120 120 */
function dkmLaurelSVG(icon){
  var u = dkmId(), leaves = '';
  for(var k = 0; k < 7; k++){
    var a = (208 + k * 21) * Math.PI / 180, x = 60 + Math.cos(a) * 46, y = 64 + Math.sin(a) * 46, r = (a * 180 / Math.PI) + 90;
    leaves += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="5.5" ry="11" transform="rotate(' + r.toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
    var b = (332 - k * 21) * Math.PI / 180, x2 = 60 + Math.cos(b) * 46, y2 = 64 + Math.sin(b) * 46, r2 = (b * 180 / Math.PI) + 90;
    leaves += '<ellipse cx="' + x2.toFixed(1) + '" cy="' + y2.toFixed(1) + '" rx="5.5" ry="11" transform="rotate(' + r2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ')"/>';
  }
  var ic = {
    crown:'<path d="M38 74V52L48 62L60 44L72 62L82 52V74Z" fill="#FFF3C8" stroke="#6B4408" stroke-width="2.5" stroke-linejoin="round"/>',
    triple:'<g fill="#FFF3C8" stroke="#6B4408" stroke-width="2.2" stroke-linejoin="round"><path d="M36 76V62L44 55L52 62V76Z"/><path d="M52 76V56L60 48L68 56V76Z" fill="#FF8A6E"/><path d="M68 76V62L76 55L84 62V76Z"/></g>',
    line:'<g fill="#FFF3C8" stroke="#6B4408" stroke-width="2.2"><rect x="34" y="60" width="14" height="14" rx="2"/><rect x="53" y="60" width="14" height="14" rx="2" fill="#FFD24D"/><rect x="72" y="60" width="14" height="14" rx="2"/></g><path d="M36 54H84" stroke="#6B4408" stroke-width="3" stroke-linecap="round"/>',
    tour:'<path d="M60 40L66 56H80L68 64L73 80L60 70L47 80L52 64L40 56H54Z" fill="#8FD8F8" stroke="#0B3C74" stroke-width="2.2" stroke-linejoin="round"/>',
    ticket:'<path d="M36 50H84V58Q78 62 84 66V74H36V66Q42 62 36 58Z" fill="#FFF3C8" stroke="#6B4408" stroke-width="2.2"/><path d="M50 52V72" stroke="#6B4408" stroke-width="2" stroke-dasharray="3 3"/>',
    lv:'<text x="60" y="73" text-anchor="middle" font-family="Bungee,sans-serif" font-size="26" fill="#FFF3C8" stroke="#6B4408" stroke-width="2.5" paint-order="stroke">LV</text>',
    pend:'<path d="M60 44L74 58L60 80L46 58Z" fill="#B07CE8" stroke="#3E1470" stroke-width="2.2" stroke-linejoin="round"/><path d="M60 44L66 58L60 80" fill="#E0C8FF" fill-opacity=".6"/>',
    gift:'<rect x="40" y="54" width="40" height="24" rx="3" fill="#FF8A6E" stroke="#6B4408" stroke-width="2.2"/><rect x="37" y="48" width="46" height="9" rx="2" fill="#FFD24D" stroke="#6B4408" stroke-width="2"/><path d="M60 48V78" stroke="#6B4408" stroke-width="3"/>'
  }[icon] || '';
  return '<svg class="dkm-lsvg" viewBox="0 0 120 120" aria-hidden="true">'
    + '<defs><radialGradient id="' + u + 'm" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#FFF7DC"/><stop offset=".45" stop-color="#F0CE72"/><stop offset=".8" stop-color="#C8952F"/><stop offset="1" stop-color="#7C5410"/></radialGradient>'
    + '<linearGradient id="' + u + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C8"/><stop offset="1" stop-color="#C8952F"/></linearGradient></defs>'
    + '<g fill="url(#' + u + 'f)" stroke="#7C5410" stroke-width="1.2">' + leaves + '</g>'
    + '<circle cx="60" cy="62" r="31" fill="url(#' + u + 'm)" stroke="#5A3A04" stroke-width="3"/>'
    + '<circle cx="60" cy="62" r="25" fill="none" stroke="#FFF3C8" stroke-opacity=".6" stroke-width="1.5"/>'
    + ic
    + '<path d="M48 96L60 88L72 96" fill="none" stroke="#C9302C" stroke-width="6" stroke-linecap="round"/>'
    + '</svg>';
}
/* 金貨の山（WIN の両脇） viewBox 0 0 300 190 */
function dkmCoinPileSVG(flip){
  var u = dkmId(), g = '';
  var coin = function(x, y){ return '<g transform="translate(' + x + ' ' + y + ')"><path d="M-26 0V7A26 9 0 0 0 26 7V0Z" fill="#9A6A08"/><ellipse rx="26" ry="9" fill="url(#' + u + 'c)" stroke="#7A5206" stroke-width="1.5"/><ellipse rx="18" ry="5.5" fill="none" stroke="#FFF3C8" stroke-opacity=".7" stroke-width="1.2"/></g>'; };
  var stacks = [[46, 176, 7], [100, 180, 11], [156, 182, 14], [212, 180, 9], [262, 178, 5]];
  stacks.forEach(function(s){ for(var k = 0; k < s[2]; k++) g += coin(s[0] + (k % 2 ? 1.5 : -1.5), s[1] - k * 8); });
  var loose = '<g transform="translate(128 58) rotate(-28)"><ellipse rx="26" ry="26" fill="url(#' + u + 'r)" stroke="#7A5206" stroke-width="2"/><path d="M-12 8V-6L-6 0L0-10L6 0L12-6V8Z" fill="#9A6A08"/></g>'
            + '<g transform="translate(206 84) rotate(20)"><ellipse rx="22" ry="22" fill="url(#' + u + 'r)" stroke="#7A5206" stroke-width="2"/></g>';
  return '<svg class="dkm-pile" viewBox="0 0 300 190" aria-hidden="true"' + (flip ? ' style="transform:scaleX(-1)"' : '') + '>'
    + '<defs><linearGradient id="' + u + 'c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF9D8"/><stop offset=".45" stop-color="#FFD95A"/><stop offset="1" stop-color="#C98A12"/></linearGradient>'
    + '<radialGradient id="' + u + 'r" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFF9D8"/><stop offset=".5" stop-color="#FFD24D"/><stop offset="1" stop-color="#A9761A"/></radialGradient></defs>'
    + g + loose + '</svg>';
}
/* 立体の見出し文字（WIN＝金・LOSE＝銀・RESULT＝金小）。SVG で塗るので Chrome でも潰れない */
function dkmTitleSVG(text, tone){
  var u = dkmId(), fs = text.length > 4 ? 124 : 168, y = 160;
  var face = tone === 'silver'
    ? '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".42" stop-color="#E2E9F1"/><stop offset=".56" stop-color="#8E9CAE"/><stop offset=".78" stop-color="#C9D3DE"/><stop offset="1" stop-color="#F4F7FA"/>'
    : '<stop offset="0" stop-color="#FFFBE6"/><stop offset=".38" stop-color="#FFE27A"/><stop offset=".55" stop-color="#F4B81E"/><stop offset=".8" stop-color="#C98A12"/><stop offset="1" stop-color="#FFE9A0"/>';
  var side = tone === 'silver' ? '#46505C' : '#7A4A06', edge = tone === 'silver' ? '#171C24' : '#2A1604';
  var ext = '';
  for(var k = 14; k >= 2; k -= 2) ext += '<text x="350" y="' + (y + k) + '" fill="' + side + '" stroke="' + side + '" stroke-width="22" stroke-linejoin="round">' + esc(text) + '</text>';
  return '<svg class="dkm-tsvg" viewBox="0 0 700 220" aria-hidden="true">'
    + '<defs><linearGradient id="' + u + 'f" x1="0" y1="0" x2="0" y2="1">' + face + '</linearGradient>'
    + '<clipPath id="' + u + 'h"><rect x="0" y="0" width="700" height="' + (y - fs * 0.38) + '"/></clipPath></defs>'
    + '<g font-family="Bungee,\'Mochiy Pop One\',sans-serif" font-size="' + fs + '" text-anchor="middle" letter-spacing="6">'
    + ext
    + '<text x="350" y="' + y + '" fill="' + edge + '" stroke="' + edge + '" stroke-width="22" stroke-linejoin="round">' + esc(text) + '</text>'
    + '<text x="350" y="' + y + '" fill="url(#' + u + 'f)" stroke="' + (tone === 'silver' ? '#FFFFFF' : '#FFF4C0') + '" stroke-width="3">' + esc(text) + '</text>'
    + '<text x="350" y="' + y + '" fill="#FFFFFF" fill-opacity=".38" clip-path="url(#' + u + 'h)">' + esc(text) + '</text>'
    + '</g></svg>';
}
/* 画面の四隅のガラスのヒビ（破片は clip-path、動きは transform だけ） */
function dkmCrackHTML(corner){
  var shards = [
    '0 0,46% 0,30% 22%,0 34%', '46% 0,78% 0,52% 30%,30% 22%', '0 34%,30% 22%,22% 58%,0 70%',
    '30% 22%,52% 30%,44% 60%,22% 58%', '78% 0,100% 0,100% 18%,52% 30%', '0 70%,22% 58%,14% 100%,0 100%'
  ];
  var sh = shards.map(function(p, k){ return '<i class="dkm-shard s' + k + '" style="clip-path:polygon(' + p + ')"></i>'; }).join('');
  var main = 'M0 0L34 20L58 46L92 58L130 76L168 84L214 104L252 110'
    + 'M58 46L66 86L88 118L96 160L92 204L100 240'
    + 'M34 20L78 18L120 30L166 22L210 6L236 0'
    + 'M92 58L118 104L150 128L160 170L156 200'
    + 'M66 86L36 110L14 138L0 150'
    + 'M120 30L150 50L196 52L240 64L300 60'
    + 'M130 76L178 128L212 140';
  var ring = 'M22 44L44 36L58 46M40 70L66 62L80 76M78 112L108 98L126 112M140 58L160 42L178 50M112 150L140 142M184 96L200 118'
    + 'M8 12L16 8M14 26L24 18M26 8L30 0';
  var lines = '<svg class="dkm-crack-lines" viewBox="0 0 340 240" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round">'
    + '<path class="glow" d="' + main + '"/><path class="line" d="' + main + '"/><path class="line thin" d="' + ring + '"/>'
    + '<circle cx="4" cy="4" r="10" fill="#FFFFFF" fill-opacity=".5"/>'
    + '</g></svg>';
  return '<div class="dkm-crack ' + corner + '" aria-hidden="true">' + sh + lines + '</div>';
}

/* ══════════ ⑥ 対戦相手を検索中（#vs を重ねる） ══════════
   暗幕＋全幅の金リボン＋水色の世界地図と金の弧（粒が弧の上を進む）。
   約1.2秒後に各席の名前が「入場」で順に弾む（0.6秒）。終わったら .on を外す。 */
function dkmVsHTML(seats){
  var plates = seats.map(function(s, i){
    var tag = s.kind === 'cpu' ? 'CPU' : (s.kind === 'you' ? 'YOU' : 'P' + (i + 1));
    return '<div class="dkm-vs-seat" style="--c:' + PCOL[i % 4] + ';--i:' + i + '">'
      + '<i class="dkm-vs-gem"></i><b>' + esc(s.name || ('P' + (i + 1))) + '</b>'
      + '<em>' + tag + '</em><span class="dkm-vs-in">入場</span></div>';
  }).join('');
  return '<div class="dkm-vs-veil"></div>'
    + '<div class="dkm-vs-glow fx-deco" aria-hidden="true"></div>'
    + '<div class="dkm-vs-mapbox fx-deco" aria-hidden="true">' + dkmWorldSVG() + '</div>'
    + '<div class="dkm-vs-band"><i class="dkm-vs-edge t"><u></u></i><i class="dkm-vs-edge b"><u></u></i>'
    +   '<b class="dkm-vs-txt s1">対戦相手を検索中<span class="dkm-dots"><i>・</i><i>・</i><i>・</i></span></b>'
    +   '<b class="dkm-vs-txt s2">対戦相手が見つかりました！</b></div>'
    + '<div class="dkm-vs-seats">' + plates + '</div>';
}
function dkmArcPt(A, t){
  var v = 1 - t;
  return { x:v * v * A.a.x + 2 * v * t * A.c.x + t * t * A.b.x, y:v * v * A.a.y + 2 * v * t * A.c.y + t * t * A.b.y };
}
function dkmArcStop(){ if(DKM_st.vsRaf){ cancelAnimationFrame(DKM_st.vsRaf); DKM_st.vsRaf = 0; } }
/* 弧の上の金の粒を transform で進める（rAF は画面が閉じたら止まる） */
function dkmArcRun(el, tok){
  dkmArcStop();
  var dots = Array.prototype.slice.call(el.querySelectorAll('.dkm-arcdot'));
  var place = function(t){
    dots.forEach(function(d){
      var A = DKM_ARCS[+d.getAttribute('data-arc') || 0];
      var u = (t * 0.62 + (+d.getAttribute('data-ph') || 0)) % 1;
      var e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      var p = dkmArcPt(A, e), s = 0.5 + Math.sin(u * Math.PI) * 0.7;
      d.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
    });
  };
  place(0.35);
  if(DKFX.reduced) return;
  var t0 = performance.now();
  var dkmArcStep = function(now){
    if(tok !== DKM_st.vsTok || !el.classList.contains('on')){ DKM_st.vsRaf = 0; return; }
    place(Math.max(0, ((now || performance.now()) - t0) / 1000));
    DKM_st.vsRaf = requestAnimationFrame(dkmArcStep);
  };
  DKM_st.vsRaf = requestAnimationFrame(dkmArcStep);
}
async function vsScreen(){
  var el = document.getElementById('vs');
  if(!el) return;
  var tok = ++DKM_st.vsTok;
  var seats = dkmSeats();
  el.className = 'dkm-vs';
  el.innerHTML = dkmVsHTML(seats);
  el.classList.add('on');
  dkmSfx('skill');
  dkmArcRun(el, tok);
  /* 開始からの経過で待つ（タイマーが遅れても合計がのびない）：1.15秒で入場、1.73秒で閉じ始め、1.82秒で終わり */
  var t0 = performance.now(), sp = dkmSpeed();
  var until = function(ms){ return new Promise(function(r){ setTimeout(r, Math.max(0, ms * sp - (performance.now() - t0))); }); };
  await until(1150);
  if(tok !== DKM_st.vsTok) return;
  el.classList.add('dkm-found');
  dkmSfx('cardIn');
  var plates = el.querySelectorAll('.dkm-vs-seat');
  var step = 480 / Math.max(1, plates.length);
  plates.forEach(function(p, i){
    setTimeout(function(){
      if(tok !== DKM_st.vsTok) return;
      p.classList.add('in');
      dkmSfx('coin');
    }, i * step * sp);
  });
  await until(1730);
  if(tok !== DKM_st.vsTok) return;
  plates.forEach(function(p){ p.classList.add('in'); });
  el.classList.add('dkm-out');
  await until(1820);
  if(tok !== DKM_st.vsTok) return;
  dkmArcStop();
  el.classList.remove('on', 'dkm-found', 'dkm-out');
  el.innerHTML = '';
}

/* ══════════ ⑦ ローディング（#loading を作り直す） ══════════
   自作の一枚絵（夜空・流れ星・名所風のシルエット・水面の反射・白い大きなサイコロ）＋
   マップ名の袋文字＋黄色の TIP 1行＋最下段の Loading...(n/56)。バーは scaleX で伸ばす。
   オンライン（runGame）からも呼ぶので cfg だけを見る。 */
function dkmLoadHTML(map){
  var stars = [[], [], []];
  for(var k = 0; k < 120; k++){
    var x = dkmR() * 1600, y = dkmR() * 470, r = 0.6 + dkmR() * (k % 9 === 0 ? 2.2 : 1.2);
    stars[k % 3].push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(2) + '"/>');
  }
  var sky = '<svg class="dkm-ld-stars" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">'
    + stars.map(function(s, i){ return '<g class="dkm-tw' + i + '" fill="#FFFFFF">' + s.join('') + '</g>'; }).join('')
    + '</svg>';
  var tip = DKM_TIPS[(dkmR() * DKM_TIPS.length) | 0];
  var theme = (map.id === 'oita') ? 'oita' : (map.id === 'world') ? 'world' : 'ice';
  return '<div class="dkm-ld-scene fx-deco ' + theme + '" aria-hidden="true">'
    + '<i class="dkm-ld-sky"></i>' + sky + '<i class="dkm-ld-moon"></i>'
    + '<i class="dkm-ld-shoot s1"></i><i class="dkm-ld-shoot s2"></i><i class="dkm-ld-shoot s3"></i>'
    + '<div class="dkm-ld-horizon">' + dkmSkylineSVG(map.id, false) + '</div>'
    + '<div class="dkm-ld-water"><div class="dkm-ld-reflbox">' + dkmSkylineSVG(map.id, true) + '</div>'
    +   '<i class="dkm-ld-glint g1"></i><i class="dkm-ld-glint g2"></i><i class="dkm-ld-glint g3"></i><i class="dkm-ld-glint g4"></i></div>'
    + '<div class="dkm-ld-diceref">' + dkmDiceSVG() + '</div>'
    + '<div class="dkm-ld-dice"><i class="dkm-ld-halo"></i>' + dkmDiceSVG() + '</div>'
    + '<i class="dkm-ld-spark k1"></i><i class="dkm-ld-spark k2"></i><i class="dkm-ld-spark k3"></i>'
    + '</div>'
    + '<div class="dkm-ld-name"><b>' + esc(map.name) + '</b><i>' + esc(map.sub || '') + '</i></div>'
    + '<div class="dkm-ld-tip"><em>TIP</em><span>' + esc(tip) + '</span></div>'
    + '<div class="dkm-ld-foot"><span class="dkm-ld-count">Loading...(0/' + DKM_LOAD_N + ') 0%</span>'
    +   '<div class="dkm-ld-bar"><i style="transform:scaleX(0)"></i><b style="transform:translateX(0px)"></b></div></div>';
}
function dkmLoadSet(el, n){
  var k = Math.max(0, Math.min(1, n / DKM_LOAD_N));
  var bar = el.querySelector('.dkm-ld-bar i'), tip = el.querySelector('.dkm-ld-bar b'), c = el.querySelector('.dkm-ld-count');
  if(bar) bar.style.transform = 'scaleX(' + k.toFixed(4) + ')';
  if(tip) tip.style.transform = 'translateX(' + (k * 880).toFixed(1) + 'px)';
  if(c) c.textContent = 'Loading...(' + n + '/' + DKM_LOAD_N + ') ' + Math.round(k * 100) + '%';
}
async function loadingPhase(){
  DKM_st.online = !!(window.DV_OL && window.DV_OL.started);
  var el = document.getElementById('loading');
  if(!el) return;
  var map = dkmMapNow();
  el.className = 'screen dk dkm-load' + (el.classList.contains('on') ? ' on' : '');
  el.removeAttribute('style');
  el.innerHTML = dkmLoadHTML(map);
  screenTo('loading');
  var n = 0, tick = -1;
  while(n < DKM_LOAD_N){
    n = Math.min(DKM_LOAD_N, n + 1 + ((dkmR() * 3) | 0));
    dkmLoadSet(el, n);
    var q = Math.floor(n / DKM_LOAD_N * 5);
    if(q !== tick){ tick = q; dkmSfx('tick'); }
    await wait(22 + ((dkmR() * 26) | 0));
  }
  dkmLoadSet(el, DKM_LOAD_N);
  el.classList.add('dkm-done');
  await wait(280);
}

/* ══════════ ⑧ 盤の上で順番決め（newGame のあとに呼ぶ） ══════════
   順番そのものは最初に Math.random で決める（本家も「カード選びは見た目だけ」）。
   だからオンラインの各端末で呼んでも、乱数の消費は同じ回数でずれない。
   人間の席から順に1枚ずつ選ぶ（5秒で自動）→ 青い✓ → めくる → 金の「先行」→ YOU →
   祭り都市（×2）に順にスポット。cfg.seats の並びは変えず、G.turn と G.roundStart に先手を入れる。 */
function dkmOrdClear(){
  document.querySelectorAll('#dkmOrder, .dkm-you').forEach(function(n){ if(n.parentNode) n.parentNode.removeChild(n); });
}
function dkmOrdFront(pi, rk){
  var p = G.players[pi], nm = esc(p ? p.name : '');
  if(rk === 0){
    return '<div class="dkm-ff gold"><i class="dkm-ff-burst"></i><i class="dkm-ff-ring"></i>'
      + '<b class="dkm-ff-big">先行</b><em class="dkm-ff-rib fx-deco">FIRST</em>'
      + '<span class="dkm-ff-nm" style="--c:' + PCOL[pi % 4] + '">' + nm + '</span></div>';
  }
  return '<div class="dkm-ff"><i class="dkm-ff-stripe" style="--c:' + PCOL[pi % 4] + '"></i>'
    + '<b class="dkm-ff-no">' + (rk + 1) + '</b><em class="dkm-ff-lb">番目</em>'
    + '<span class="dkm-ff-nm" style="--c:' + PCOL[pi % 4] + '">' + nm + '</span></div>';
}
function dkmOrdHTML(n){
  var cards = '';
  for(var k = 0; k < n; k++){
    cards += '<div class="dkm-fslot" style="--i:' + k + '">'
      + '<button type="button" class="dkm-fcard" data-dkm-card="' + k + '" aria-label="カード' + (k + 1) + '">'
      +   '<span class="dkm-fc-in"><span class="dkm-fc-face dkm-fc-back"><span class="fx-deco">' + dkmFortuneSVG() + '</span><i class="dkm-fc-gloss"></i></span>'
      +   '<span class="dkm-fc-face dkm-fc-front"></span></span>'
      +   '<svg class="dkm-check" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="#0B2C5E" fill-opacity=".35"/>'
      +     '<path d="M26 62L50 86L96 34" fill="none" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>'
      +     '<path d="M26 62L50 86L96 34" fill="none" stroke="#2E8BE0" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      + '</button><span class="dkm-owner"></span></div>';
  }
  return '<div class="dkm-ord-veil"></div><div class="dkm-spot" aria-hidden="true"></div>'
    + '<div class="dkm-ord-head"><b class="dkm-ord-ttl">順番を決める</b><span class="dkm-ord-sub">カードを選択してください</span>'
    +   '<span class="dkm-ord-timer"><i></i></span></div>'
    + '<div class="dkm-ord-row">' + cards + '</div>'
    + '<div class="dkm-spot-tag" aria-hidden="false"><b>祭り都市</b><em>×2</em><span></span></div>';
}
/* 画面（ステージ座標）でのマスの位置。カメラの行き先（tx/ty/tz）で計算する */
function dkmTileScreen(i){
  var c = tileCenter(i), z = cam.tz || 1;
  return { x:SW / 2 + (c.x - cam.tx) * z, y:SH / 2 + (c.y - cam.ty) * z - TILE_H };
}
/* 自分の HUD の横に金の YOU（吹き出しのしっぽは HUD 側） */
function dkmYouBadge(me){
  if(me < 0) return null;
  var x = 1190, y = 800, left = true;
  try{
    var hud = fxHudOf(me);
    if(hud && dkmShown(hud)){
      var r = hud.getBoundingClientRect();
      var a = DKFX.toStage(r.left, r.top), b = DKFX.toStage(r.right, r.bottom);
      var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      left = cx > 800;
      x = left ? Math.min(a.x, b.x) - 64 : Math.max(a.x, b.x) + 64;
      y = cy;
    }
  }catch(e){}
  x = Math.max(70, Math.min(1530, x)); y = Math.max(70, Math.min(830, y));
  var d = document.createElement('div');
  d.className = 'dkm-you ' + (left ? 'tail-r' : 'tail-l');
  d.style.left = x.toFixed(0) + 'px'; d.style.top = y.toFixed(0) + 'px';
  d.innerHTML = '<i class="dkm-you-tail"></i><b>YOU</b>';
  var st = document.getElementById('stage'); if(st) st.appendChild(d);
  return d;
}
async function dkOrderOnBoard(){
  if(!G || !G.players || !G.players.length) return;
  var g0 = G, tok = ++DKM_st.ordTok;
  var n = G.players.length;
  /* 1) 順番を決める（ゲームの乱数を n-1 回だけ使う） */
  var order = G.players.map(function(p, i){ return i; });
  for(var s = n - 1; s > 0; s--){ var j = (Math.random() * (s + 1)) | 0, t = order[s]; order[s] = order[j]; order[j] = t; }
  var rankOf = {}; order.forEach(function(pi, k){ rankOf[pi] = k; });
  var first = order[0];
  G.turn = first; G.roundStart = first;
  var alive = function(){ return tok === DKM_st.ordTok && G === g0; };
  /* 2) 重ね表示 */
  dkmOrdClear();
  var st = document.getElementById('stage'); if(!st) return;
  var el = document.createElement('div');
  el.id = 'dkmOrder'; el.className = 'dkm-order';
  el.innerHTML = dkmOrdHTML(n);
  st.appendChild(el);
  var me = dkmMe(), online = dkmIsOnline();
  var you = dkmYouBadge(me);
  var cards = Array.prototype.slice.call(el.querySelectorAll('.dkm-fcard'));
  var slots = Array.prototype.slice.call(el.querySelectorAll('.dkm-fslot'));
  var owner = new Array(n).fill(-1);
  var ttl = el.querySelector('.dkm-ord-ttl'), sub = el.querySelector('.dkm-ord-sub'), timer = el.querySelector('.dkm-ord-timer');
  dkmSfx('cardIn');
  var pickers = [];
  G.players.forEach(function(p, i){ if(p.kind !== 'cpu') pickers.push(i); });
  G.players.forEach(function(p, i){ if(p.kind === 'cpu') pickers.push(i); });
  var humans = pickers.filter(function(i){ return G.players[i].kind !== 'cpu'; }).length;
  var clickable = function(pi){ return online ? pi === me : G.players[pi].kind !== 'cpu'; };
  var pickCard = function(k, pi){
    owner[k] = pi;
    var c = cards[k];
    c.classList.add('picked'); c.disabled = true;
    var tag = slots[k].querySelector('.dkm-owner');
    tag.textContent = G.players[pi].name; tag.style.setProperty('--c', PCOL[pi % 4]);
    slots[k].classList.add('owned');
    dkmSfx('click');
  };
  var freeCards = function(){ var f = []; owner.forEach(function(o, k){ if(o < 0) f.push(k); }); return f; };
  for(var q = 0; q < pickers.length; q++){
    if(!alive()){ el.remove(); if(you) you.remove(); return; }
    var pi = pickers[q], p = G.players[pi];
    var free = freeCards(); if(!free.length) break;
    if(clickable(pi)){
      ttl.textContent = '順番を決める';
      sub.textContent = (humans > 1 ? p.name + ' さん、' : '') + 'カードを選択してください';
      el.classList.add('choosing');
      timer.classList.remove('run'); void timer.offsetWidth; timer.classList.add('run');
      var picked = await new Promise(function(res){
        var done = false;
        var fin = function(k){ if(done) return; done = true; clearTimeout(to); cards.forEach(function(c){ c.onclick = null; }); res(k); };
        cards.forEach(function(c, k){ if(owner[k] < 0) c.onclick = function(){ if(owner[k] < 0) fin(k); }; });
        var to = setTimeout(function(){ var f = freeCards(); fin(f[(dkmR() * f.length) | 0]); }, DKM_PICK_MS * (dkmSpeed() < 0.2 ? dkmSpeed() : 1));
        DKM_st.ordFin = fin;
      });
      el.classList.remove('choosing'); timer.classList.remove('run');
      if(!alive()){ el.remove(); if(you) you.remove(); return; }
      pickCard(picked, pi);
      await wait(260);
    } else {
      sub.textContent = p.name + ' が選んでいます…';
      await wait(360 + ((dkmR() * 220) | 0));
      if(!alive()){ el.remove(); if(you) you.remove(); return; }
      free = freeCards();
      pickCard(free[(dkmR() * free.length) | 0], pi);
      await wait(180);
    }
  }
  DKM_st.ordFin = null;
  /* 3) めくる */
  ttl.textContent = '順番が決まりました！'; sub.textContent = '';
  await wait(300);
  for(var k = 0; k < n; k++){
    if(!alive()) break;
    if(owner[k] < 0) continue;
    cards[k].querySelector('.dkm-fc-front').innerHTML = dkmOrdFront(owner[k], rankOf[owner[k]]);
    cards[k].classList.add('flip');
    dkmSfx('cardIn');
    await wait(150);
  }
  await wait(480);
  if(!alive()){ el.remove(); if(you) you.remove(); return; }
  var fk = owner.indexOf(first);
  if(fk >= 0){
    slots[fk].classList.add('first');
    slots.forEach(function(sl, k){ if(k !== fk) sl.classList.add('dim'); });
    try{ fxRays(slots[fk], { fast:true }); }catch(e){}
    try{ fxBurst(cards[fk], { kind:'star', n:22, power:1.2 }); }catch(e){}
    dkmSfx('gachaRare');
  }
  sub.textContent = G.players[first].name + ' が先行です';
  if(you) you.classList.add('pop');
  await wait(1150);
  if(!alive()){ el.remove(); if(you) you.remove(); return; }
  /* 4) 祭り都市にスポット */
  var fest = [];
  G.tiles.forEach(function(t, i){ if(t && t.x2) fest.push(i); });
  el.classList.add('cards-out');
  await wait(240);
  if(fest.length && alive()){
    el.classList.add('spot');
    ttl.textContent = '祭り都市'; sub.textContent = '通行料が ×2 になる街が決まりました';
    var spot = el.querySelector('.dkm-spot'), tag = el.querySelector('.dkm-spot-tag');
    for(var f = 0; f < fest.length; f++){
      if(!alive()) break;
      var pt = dkmTileScreen(fest[f]);
      spot.style.transform = 'translate(' + (pt.x - 1800).toFixed(1) + 'px,' + (pt.y - 1100).toFixed(1) + 'px)';
      var tx = Math.max(150, Math.min(1450, pt.x)), ty = Math.max(150, pt.y - 96);
      tag.style.left = tx.toFixed(0) + 'px'; tag.style.top = ty.toFixed(0) + 'px';
      tag.querySelector('span').textContent = G.tiles[fest[f]].name;
      tag.classList.remove('go'); void tag.offsetWidth; tag.classList.add('go');
      if(f === 0) el.classList.add('spot-on');
      await wait(f === 0 ? 120 : 260);
      try{ fxBurst({ x:pt.x, y:pt.y }, { kind:'star', n:14, power:0.8 }); }catch(e){}
      dkmSfx('coin');
      await wait(460);
    }
    await wait(220);
  }
  /* 5) 片付け */
  el.classList.add('out');
  if(you) you.classList.add('out');
  await wait(220);
  if(el.parentNode) el.parentNode.removeChild(el);
  if(you && you.parentNode) you.parentNode.removeChild(you);
  if(G === g0){ G.turn = first; G.roundStart = first; try{ updHUD(); }catch(e){ console.error('[WP4]', e); } }
}

/* ══════════ 対戦後の報酬（1試合1回だけ） ══════════
   ゴールド＝(勝ち1,400／負け480)×クラス倍率（オンラインは×1）。経験値は今までどおり。
   連勝：勝つと+1（前の勝ちから18時間を超えていたら1から）、負けると0。3連敗ごとに応援3,000G。
   ペンダントは dkGivePend（勝ち35%／負け15%）。最後に 'match:end' を送り、chips の行を受け取る。 */
function grantRewards(won){
  if(!G) return null;
  if(G.rewarded) return G.dkmInfo || null;
  G.rewarded = true;
  won = !!won;
  var online = dkmIsOnline(), me = dkmMe(), cl = dkmClassOf();
  var x = online ? 1 : cl.x;
  var gold = Math.round((won ? 1400 : 480) * x), exp = won ? 40 : 14;
  var lv0 = SV.lv;
  SV.gold += gold; SV.exp += exp; SV.plays = (SV.plays | 0) + 1; if(won) SV.wins = (SV.wins | 0) + 1;
  try{
    if(SV.stat){ SV.stat.plays = (SV.stat.plays | 0) + 1; if(won) SV.stat.wins = (SV.stat.wins | 0) + 1; }
    var td = DKCORE_today(); td.plays = (td.plays | 0) + 1; if(won) td.wins = (td.wins | 0) + 1;
    var wk = DKCORE_week(); wk.plays = (wk.plays | 0) + 1; if(won) wk.wins = (wk.wins | 0) + 1;
  }catch(e){ console.error('[WP4]', e); }
  var up = 0;
  while(SV.exp >= playerLvNeed(SV.lv)){ SV.exp -= playerLvNeed(SV.lv); SV.lv++; up++; }
  var now = Date.now(), cheer = 0;
  if(won){
    var keep = (SV.streak | 0) > 0 && (now - (+SV.streakAt || 0)) <= DKM_STREAK_MS;
    SV.streak = keep ? (SV.streak | 0) + 1 : 1;
    SV.streakAt = now; SV.lstreak = 0;
  } else {
    SV.streak = 0;
    SV.lstreak = (SV.lstreak | 0) + 1;
    if(SV.lstreak % 3 === 0){ cheer = DKM_LOSE3_GOLD; SV.gold += cheer; }
  }
  var pend = null;
  if(Math.random() < (won ? 0.35 : 0.15)){
    var pp = PENDANTS[(Math.random() * PENDANTS.length) | 0];
    try{ pend = dkGivePend(pp.id); }catch(e){ pend = null; }
  }
  saveNow();
  var payload = { won:won, me:me, winner:G.winner, reason:G.winReason, winX:G.winX || 1, cls:cl.id, x:x,
    mapId:(G.map && G.map.id) || cfg.mapId, n:G.players.length, online:online,
    humans:G.players.filter(function(p){ return p.kind !== 'cpu'; }).length, chips:[] };
  try{ dkEmit('match:end', payload); }catch(e){ console.error('[WP4]', e); }
  var chips = (Array.isArray(payload.chips) ? payload.chips : []).filter(function(c){ return c && (c.label || c.v !== undefined); })
    .map(function(c){ return { ic:String(c.ic == null ? '' : c.ic), label:String(c.label == null ? '' : c.label), v:(c.v == null ? '' : String(c.v)) }; });
  saveNow();
  if(up){ try{ jingle('levelup'); }catch(e){} }
  var info = { won:won, me:me, gold:gold, exp:exp, lv:SV.lv, lv0:lv0, lvUp:up, x:x, cls:cl.id, clsNm:online ? 'オンライン' : cl.nm,
    streak:SV.streak | 0, lstreak:SV.lstreak | 0, cheer:cheer, pend:pend, online:online, chips:chips };
  G.dkmInfo = info;
  return info;
}

/* ══════════ ⑪ WIN / LOSE パネル（#result を作り直す。半透明で盤を透かす） ══════════ */
function dkmReasonShort(r){
  r = String(r || '');
  if(r.indexOf('・') >= 0) r = r.split('・').pop();
  return r;
}
function dkmReasonIcon(r){
  r = String(r || '');
  return r.indexOf('トリプル') >= 0 ? 'triple' : r.indexOf('ライン') >= 0 ? 'line' : r.indexOf('観光地') >= 0 ? 'tour' : 'crown';
}
function dkmMedal(icon, label, sub){
  return '<div class="dkm-medal"><span class="fx-deco">' + dkmLaurelSVG(icon) + '</span>'
    + '<b>' + esc(label) + '</b>' + (sub ? '<em>' + esc(sub) + '</em>' : '') + '</div>';
}
function dkmRankHTML(R){
  var rk = rank();
  return '<div class="dkm-rank"><div class="dkm-rank-hd"><b>全体ランキング</b></div>'
    + rk.map(function(r, k){
      var p = G.players[r.i], card = cardById(p.card) || { nm:'' };
      return '<div class="dkm-rrow' + (r.i === R.me ? ' me' : '') + (p.out ? ' out' : '') + '" style="--c:' + PCOL[r.i % 4] + ';--k:' + k + '">'
        + '<i class="dkm-rno n' + (k + 1) + '">' + (k + 1) + '</i>'
        + '<span class="dkm-rnm"><b>' + esc(p.name) + '</b>' + (p.out ? '<em>破産</em>' : '<em>' + esc(card.nm) + '</em>') + '</span>'
        + '<b class="dkm-rv" data-v="' + Math.max(0, r.a) + '">0</b></div>';
    }).join('') + '</div>';
}
function dkmStarsHTML(s){
  var h = '';
  for(var k = 1; k <= 5; k++) h += '<i class="' + (k <= s ? 'on' : '') + '">★</i>';
  return '<span class="dkm-stars" aria-label="連勝 ' + s + '">' + h + '</span>';
}
function dkmResHTML(R){
  var mode = R.mode, info = R.info, W = G.players[G.winner];
  var mp = R.me >= 0 ? G.players[R.me] : W, mc = cardById(mp.card) || CARDPOOL[0];
  var reason = dkmReasonShort(G.winReason);
  var h = '<div class="dkm-res-veil"></div>';
  if(mode === 'lose') h += dkmCrackHTML('tl') + dkmCrackHTML('tr') + dkmCrackHTML('bl') + dkmCrackHTML('br');
  h += '<div class="dkm-hero">'
    + (mode === 'win' ? '<span class="dkm-pile-l fx-deco">' + dkmCoinPileSVG(false) + '</span><span class="dkm-pile-r fx-deco">' + dkmCoinPileSVG(true) + '</span>' : '')
    + '<span class="dkm-hero-t fx-deco">' + dkmTitleSVG(mode === 'win' ? 'WIN' : mode === 'lose' ? 'LOSE' : 'RESULT', mode === 'lose' ? 'silver' : 'gold') + '</span></div>';
  h += '<div class="dkm-reason"><b>' + esc(reason) + (G.winX > 1 && String(G.winReason).indexOf('独占') >= 0 ? ' x' + G.winX : '') + '</b>'
    + '<span>' + esc(W.name) + ' の勝ち</span></div>';
  /* 左の列 */
  var L = '<div class="dkm-me">' + dkmPortrait(mp.card, 'dkm-me-face')
    + '<span class="dkm-me-tx"><b>' + esc(mp.name) + '</b><em>' + esc(mc.nm) + '</em></span>'
    + (info ? '<span class="dkm-cls">' + esc(info.clsNm) + '</span>' : '<span class="dkm-cls">観戦</span>') + '</div>';
  if(info){
    var need = playerLvNeed(SV.lv), k = Math.max(0, Math.min(1, SV.exp / need));
    L += '<div class="dkm-gold"><i class="dkm-coin"></i><span class="dkm-lb">' + (info.won ? 'ゴールド' : '参加報酬') + '</span>'
      + '<b class="dkm-gold-v" data-v="' + info.gold + '">+0</b></div>'
      + '<div class="dkm-exp"><span class="dkm-lb">経験値</span><b>+' + info.exp + '</b>'
      + '<span class="dkm-expbar"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i></span><em class="dkm-lv">Lv.' + SV.lv + '</em></div>';
    var mine = [];
    if(info.pend){ var pd0 = pendById(info.pend.id); mine.push({ ic:pd0 ? pd0.ic : '📿', label:pd0 ? pd0.nm : 'ペンダント', v:info.pend.fresh ? 'NEW' : '+1' }); }
    if(info.cheer) mine.push({ ic:'🎁', label:'3連敗の応援', v:'+' + dkmF(info.cheer) });
    L += '<div class="dkm-chips">' + mine.concat(info.chips).slice(0, 4).map(function(c){
      return '<div class="dkm-chip"><i>' + esc(c.ic) + '</i><span>' + esc(c.label) + '</span><b>' + esc(c.v) + '</b></div>';
    }).join('') + '</div>';
    if(info.won){
      L += '<div class="dkm-streak win"><i class="dkm-cup"></i><b>' + (info.streak >= 2 ? info.streak + '連勝中！' : '連勝スタート！') + '</b>'
        + '<span>連勝認定時間 18時間</span></div>';
    } else {
      L += '<div class="dkm-streak lose"><i class="dkm-cup gray"></i><b>' + (info.cheer ? '3連敗の応援 +' + dkmF(info.cheer) + 'G' : info.lstreak + '連敗') + '</b>'
        + '<span>' + (info.cheer ? 'つぎこそ勝とう！' : '3連敗ごとに応援 3,000G') + '</span></div>';
    }
  } else {
    L += '<div class="dkm-watch"><b>' + esc(W.name) + ' の勝ち</b><span>' + esc(G.winReason || '') + '</span>'
      + '<em>CPU だけの試合なので、報酬はありません</em></div>';
  }
  /* 右の列 */
  var medals = [];
  if(info){
    if(info.won) medals.push(dkmMedal(dkmReasonIcon(G.winReason), reason, G.winX > 1 ? 'x' + G.winX : ''));
    medals.push(dkmMedal('ticket', info.clsNm, '×' + info.x));
    if(info.lvUp) medals.push(dkmMedal('lv', '新レベル', 'Lv.' + info.lv));
    else if(info.pend) medals.push(dkmMedal('pend', 'ペンダント', info.pend.fresh ? 'NEW' : '+1'));
    else if(info.cheer) medals.push(dkmMedal('gift', '応援', '+' + dkmF(info.cheer)));
  } else {
    medals.push(dkmMedal(dkmReasonIcon(G.winReason), reason, G.winX > 1 ? 'x' + G.winX : ''));
  }
  var Rr = '<div class="dkm-bonus ' + (mode === 'lose' ? 'gray' : '') + '"><b>' + (mode === 'lose' ? 'RESULT' : 'BONUS!') + '</b></div>'
    + '<div class="dkm-medals n' + Math.min(3, medals.length) + '">' + medals.slice(0, 3).join('') + '</div>'
    + dkmRankHTML(R);
  /* 下の帯 */
  var B;
  if(mode === 'win'){
    var s = Math.max(1, Math.min(5, info.streak));
    B = '<div class="dkm-pb-l"><div class="dkm-pb-hd"><b>★報酬選択</b>' + dkmStarsHTML(s) + '</div>'
      + '<span class="dkm-pb-ds">最大5連勝まで報酬がだんだんよくなります</span>'
      + '<span class="dkm-pb-hint">希望する箱を選択してください</span></div>'
      + '<div class="dkm-pb-chests">' + [0, 1, 2].map(function(i){
        return '<button type="button" class="dkm-bchest c' + i + '" data-dkm-chest="' + i + '" aria-label="宝箱' + (i + 1) + '"><span class="fx-deco">' + dkmChestSVG(i) + '</span></button>';
      }).join('') + '</div>';
  } else if(mode === 'lose'){
    B = '<div class="dkm-pb-l wide"><div class="dkm-pb-hd"><b>勝者 ' + esc(W.name) + '</b></div>'
      + '<span class="dkm-pb-ds">' + esc(G.winReason || '') + '。連勝すると試合後の宝箱の中身が良くなります。</span></div>';
  } else {
    B = '<div class="dkm-pb-l wide"><div class="dkm-pb-hd"><b>観戦モード</b></div>'
      + '<span class="dkm-pb-ds">席に「あなた」を入れると、勝ち負けの報酬がもらえます。</span></div>';
  }
  h += '<div class="dkm-panel ' + mode + '"><i class="dkm-panel-edge"></i>'
    + '<div class="dkm-pl">' + L + '</div><div class="dkm-pr">' + Rr + '</div><div class="dkm-pb">' + B + '</div></div>';
  /* ボタン */
  var btn = function(act, cls, txt){ return '<button type="button" class="dkm-btn ' + cls + '" data-dkm-act="' + act + '" data-fx-press><span class="dkm-btn-tx">' + txt + '</span><i class="dkm-btn-shine"></i></button>'; };
  h += '<div class="dkm-res-btns">'
    + (mode === 'win' && !R.online ? btn('chest', 'gd dkm-prime', '報酬を選ぶ') : '')
    + (R.online ? '' : btn('room', mode === 'win' ? 'gr' : 'gr dkm-prime', 'もう一回（部屋へ）'))
    + btn('home', 'wd', 'ホームへ') + '</div>';
  return h;
}
function showResult(){
  if(!G || G.winner < 0 || !G.players || !G.players[G.winner]) return;
  var el = document.getElementById('result');
  if(!el) return;
  if(G.dkmResShown && el.classList.contains('on') && DKM_st.res && DKM_st.res.g === G) return;
  G.dkmResShown = true;
  bgm('result');
  var me = dkmMe(), online = dkmIsOnline();
  var mode = me < 0 ? 'watch' : (G.winner === me ? 'win' : 'lose');
  var info = me >= 0 ? grantRewards(mode === 'win') : null;
  if(DKM_st.res && DKM_st.res.timers) DKM_st.res.timers.forEach(clearTimeout);
  var R = DKM_st.res = { g:G, me:me, mode:mode, info:info, online:online, lock:false, claimed:false, stage:null, timers:[],
    prizes:(mode === 'win' && G.dkmPrizes) ? G.dkmPrizes : null };
  if(mode === 'win' && !R.prizes) R.prizes = G.dkmPrizes = dkmPrizes(info.streak);
  el.className = 'screen dk dkm-res dkm-' + mode + (el.classList.contains('on') ? ' on' : '');
  el.removeAttribute('style');
  el.innerHTML = dkmResHTML(R);
  dkmPaintFaces(el);
  el.querySelectorAll('[data-dkm-act]').forEach(function(b){
    b.onclick = function(){ dkmResAct(b.getAttribute('data-dkm-act'), b); };
  });
  el.querySelectorAll('[data-dkm-chest]').forEach(function(b){
    b.onclick = function(){ dkmChestOpen(+b.getAttribute('data-dkm-chest')); };
  });
  screenTo('result');
  dkmResPlay(el, R);
}
/* 登場の演出（数字が回る・閃光・紙吹雪・ヒビ） */
function dkmResPlay(el, R){
  var hero = el.querySelector('.dkm-hero');
  try{ var ry = fxRays(hero, { tone:R.mode === 'lose' ? 'silver' : 'gold', fast:R.mode === 'win' }); if(ry) ry.classList.add('dkm-hero-rays'); }catch(e){}
  var later = function(fn, ms){ R.timers.push(setTimeout(function(){ if(DKM_st.res !== R) return; try{ fn(); }catch(e){ console.error('[WP4]', e); } }, ms)); };
  if(R.mode === 'win'){
    dkmSfx('win');
    later(function(){ fxFlash(); fxBurst(el.querySelector('.dkm-hero-t'), { kind:'conf', n:60, power:1.4 }); dkmSfx('confetti'); }, 160);
    later(function(){ fxBurst(el.querySelector('.dkm-pile-l'), { kind:'coin', n:10, power:0.9 }); fxBurst(el.querySelector('.dkm-pile-r'), { kind:'coin', n:10, power:0.9 }); }, 420);
  } else if(R.mode === 'lose'){
    dkmSfx('lose');
    later(function(){ fxFlash(); dkmSfx('shock'); el.querySelectorAll('.dkm-crack').forEach(function(c){ fxShake(c, 260); }); }, 120);
  } else dkmSfx('win');
  var gv = el.querySelector('.dkm-gold-v');
  if(gv) later(function(){ fxCount(gv, +gv.getAttribute('data-v') || 0, { from:0, dur:900, fmt:function(v){ return '+' + dkmF(v); } }).then(function(){ dkmSfx('coin'); }); }, 380);
  el.querySelectorAll('.dkm-rv').forEach(function(v, k){
    later(function(){ fxCount(v, +v.getAttribute('data-v') || 0, { from:0, dur:1000, fmt:yen }); }, 560 + k * 260);
  });
}
function dkmResAct(act, b){
  var R = DKM_st.res;
  if(!R || R.lock) return;
  if(act === 'chest'){ dkmChestOpen(-1); return; }
  dkmResNav(act);
}
/* 部屋へ／ホームへ（二度押しを止める。宝箱を選ばずに進んだら1つ自動で受け取る） */
function dkmResNav(where){
  var R = DKM_st.res;
  if(!R || R.lock) return;
  R.lock = true;
  R.timers.forEach(clearTimeout); R.timers = [];
  var el = document.getElementById('result');
  if(el) el.querySelectorAll('button').forEach(function(b){ b.disabled = true; });
  dkmSfx('click');
  if(R.mode === 'win' && !R.claimed && R.prizes){
    R.claimed = true;
    var pz = R.prizes[(Math.random() * R.prizes.length) | 0];
    dkmApplyPrize(pz);
    try{ toast('R', '🎁', '宝箱の報酬を受け取りました', dkmPrizeText(pz), 2400); }catch(e){}
  }
  if(where === 'room' && !R.online) dkFlowRoom();
  else showHome();
}

/* ══════════ ⑫ 宝箱3択 ══════════
   中身は s=min(連勝,5) で良くなる（当作独自：ゴールド 600s〜1,500s、ダイヤ s-1〜s+1、s≥4 なら S以上のカード）。 */
function dkmPrizes(streak){
  var s = Math.max(1, Math.min(5, streak | 0));
  var gold = function(){ return Math.round((600 * s + Math.random() * 900 * s) / 10) * 10; };
  var list = [{ kind:'gold', v:gold() }, { kind:'gem', v:Math.max(1, s - 1 + ((Math.random() * 3) | 0)) }];
  if(s >= 4){
    var pool = CARDPOOL.filter(function(c){ return c.rar === 'S' || c.rar === 'SS'; });
    list.push({ kind:'card', id:pool[(Math.random() * pool.length) | 0].id });
  } else list.push({ kind:'gold', v:gold() });
  for(var i = list.length - 1; i > 0; i--){ var j = (Math.random() * (i + 1)) | 0, t = list[i]; list[i] = list[j]; list[j] = t; }
  return list;
}
function dkmPrizeText(pz){
  if(pz.kind === 'gold') return dkmF(pz.v) + ' ゴールド';
  if(pz.kind === 'gem') return pz.v + ' ダイヤ';
  var c = cardById(pz.id); return (c ? c.nm : 'カード') + '（' + (c ? RAR[c.rar].nm : '') + '）';
}
function dkmApplyPrize(pz){
  if(!pz || pz.applied) return;
  pz.applied = true;
  if(pz.kind === 'gold') SV.gold += pz.v;
  else if(pz.kind === 'gem') SV.gem += pz.v;
  else if(pz.kind === 'card'){ try{ pz.got = grant(cardById(pz.id)); }catch(e){ console.error('[WP4]', e); } }
  saveNow();
}
function dkmPrizeHTML(pz){
  if(pz.kind === 'card'){
    var c = cardById(pz.id) || CARDPOOL[0];
    return '<div class="dkm-prz card ' + RAR[c.rar].cls + '">' + dkmPortrait(c.id, 'dkm-prz-face')
      + '<b>' + esc(c.nm) + '</b><em>' + RAR[c.rar].nm + ' カード</em></div>';
  }
  return '<div class="dkm-prz ' + pz.kind + '"><i class="' + (pz.kind === 'gem' ? 'dkm-gemi' : 'dkm-coin') + '"></i>'
    + '<b>+' + dkmF(pz.v) + '</b><em>' + (pz.kind === 'gem' ? 'ダイヤ' : 'ゴールド') + '</em></div>';
}
function dkmChestOpen(pick){
  var R = DKM_st.res, el = document.getElementById('result');
  if(!R || !el || R.mode !== 'win' || R.lock) return;
  if(!R.stage){
    var st = document.createElement('div');
    st.className = 'dkm-cstage';
    var s = Math.max(1, Math.min(5, R.info.streak));
    var btn = function(act, cls, txt){ return '<button type="button" class="dkm-btn ' + cls + '" data-dkm-act="' + act + '" data-fx-press><span class="dkm-btn-tx">' + txt + '</span><i class="dkm-btn-shine"></i><i class="dkm-auto"></i></button>'; };
    st.innerHTML = '<div class="dkm-cs-veil"></div><div class="dkm-cs-light fx-deco"></div>'
      + '<div class="dkm-cs-head"><div class="dkm-cs-rib"><b>★報酬選択</b></div>'
      +   '<span class="dkm-cs-sub">最大5連勝まで報酬がだんだんよくなります</span>' + dkmStarsHTML(s) + '</div>'
      + '<div class="dkm-cs-wallet"><span><i class="dkm-coin"></i><b class="dkm-cs-gold">' + dkmF(SV.gold) + '</b></span>'
      +   '<span><i class="dkm-gemi"></i><b class="dkm-cs-gem">' + dkmF(SV.gem) + '</b></span></div>'
      + '<div class="dkm-cs-row">' + [0, 1, 2].map(function(i){
        return '<div class="dkm-cs-slot c' + i + '" style="--i:' + i + '"><button type="button" class="dkm-cs-chest" data-dkm-pick="' + i + '" aria-label="宝箱' + (i + 1) + '">'
          + '<span class="fx-deco">' + dkmChestSVG(i) + '</span></button><div class="dkm-cs-prize"></div></div>';
      }).join('') + '</div>'
      + '<div class="dkm-cs-hint">希望する箱を選択してください</div>'
      + '<div class="dkm-cs-btns">' + (R.online ? '' : btn('room', 'gr', 'もう一回（部屋へ）')) + btn('home', 'wd', 'ホームへ') + '</div>';
    el.appendChild(st);
    el.classList.add('chest');
    R.stage = st;
    st.querySelectorAll('[data-dkm-pick]').forEach(function(b){ b.onclick = function(){ dkmChestPick(+b.getAttribute('data-dkm-pick')); }; });
    st.querySelectorAll('[data-dkm-act]').forEach(function(b){ b.onclick = function(){ dkmResAct(b.getAttribute('data-dkm-act'), b); }; });
    try{ fxRays(st.querySelector('.dkm-cs-light'), { tone:'gold' }); }catch(e){}
    dkmSfx('cardIn');
  }
  if(pick >= 0) setTimeout(function(){ dkmChestPick(pick); }, 260);
}
async function dkmChestPick(i){
  var R = DKM_st.res;
  if(!R || !R.stage || R.claimed || R.lock || !R.prizes || !R.prizes[i]) return;
  R.claimed = true;
  var st = R.stage, slots = st.querySelectorAll('.dkm-cs-slot'), pz = R.prizes[i];
  st.classList.add('picked');
  st.querySelectorAll('.dkm-cs-chest').forEach(function(b){ b.disabled = true; });
  var g0 = SV.gold, m0 = SV.gem;
  dkmApplyPrize(pz);
  var slot = slots[i], chest = slot.querySelector('.dkm-cs-chest');
  slot.classList.add('sel');
  dkmSfx('gachaRoll');
  fxShake(chest, 360);
  await fxWait(380);
  if(DKM_st.res !== R) return;
  slot.classList.add('open');
  slot.querySelector('.dkm-cs-prize').innerHTML = dkmPrizeHTML(pz);
  dkmPaintFaces(slot);
  fxFlash();
  fxBurst(chest, { kind:pz.kind === 'gem' ? 'gem' : pz.kind === 'card' ? 'star' : 'coin', n:26, power:1.3 });
  dkmSfx('coinBurst');
  st.querySelector('.dkm-cs-hint').textContent = dkmPrizeText(pz) + ' を手に入れました！';
  if(pz.kind === 'gold' || pz.kind === 'gem'){
    var tgt = st.querySelector(pz.kind === 'gem' ? '.dkm-cs-gem' : '.dkm-cs-gold');
    await fxCoins(slot.querySelector('.dkm-cs-prize'), tgt, { kind:pz.kind === 'gem' ? 'gem' : 'coin', n:14 });
    if(DKM_st.res !== R) return;
    await fxCount(tgt, pz.kind === 'gem' ? SV.gem : SV.gold, { from:pz.kind === 'gem' ? m0 : g0, dur:800 });
  } else await fxWait(700);
  if(DKM_st.res !== R) return;
  /* ほかの2つの中身も見せる */
  for(var k = 0; k < slots.length; k++){
    if(k === i) continue;
    await fxWait(240);
    if(DKM_st.res !== R) return;
    slots[k].classList.add('open', 'other');
    slots[k].querySelector('.dkm-cs-prize').innerHTML = dkmPrizeHTML(R.prizes[k]);
    dkmPaintFaces(slots[k]);
    dkmSfx('cardIn');
  }
  /* 少し見せてから部屋へ（ボタンで先に進める） */
  st.classList.add('done');
  var go = st.querySelector('[data-dkm-act="' + (R.online ? 'home' : 'room') + '"]');
  if(go){ go.classList.add('dkm-prime', 'counting'); var au = go.querySelector('.dkm-auto'); if(au){ void au.offsetWidth; au.classList.add('run'); } }
  R.timers.push(setTimeout(function(){
    var rs = document.getElementById('result');
    if(DKM_st.res === R && !R.lock && rs && rs.classList.contains('on')) dkmResNav(R.online ? 'home' : 'room');
  }, 3200));
}

/* ══════════ 初期化 ══════════ */
(function(){
  try{
    /* TIPS は const なので中身だけ入れ替える（重複を消し、今のルールに書き直した版） */
    if(typeof TIPS !== 'undefined' && TIPS && TIPS.splice) TIPS.splice.apply(TIPS, [0, TIPS.length].concat(DKM_TIPS));
    /* 旧リザルト（青い表・#resRows・#againSame）とローディング・VS の中身を片付けておく */
    var r = document.getElementById('result');
    if(r){ r.className = 'screen dk dkm-res' + (r.classList.contains('on') ? ' on' : ''); r.innerHTML = ''; }
    var l = document.getElementById('loading');
    if(l){ l.className = 'screen dk dkm-load' + (l.classList.contains('on') ? ' on' : ''); l.innerHTML = ''; }
    var v = document.getElementById('vs');
    if(v){ v.classList.remove('on'); v.innerHTML = ''; }
    var o = document.getElementById('order');
    if(o) o.innerHTML = '';
    /* リザルト以外の画面へ移ったら、リザルトの予約（自動で部屋へ・数字の回転）を取り消す */
    dkOn('screen', function(p){
      var R = DKM_st.res;
      if(R && p && p.id !== 'result' && R.timers && R.timers.length){ R.timers.forEach(clearTimeout); R.timers = []; }
    });
  }catch(e){ console.error('[WP4]', e); }
})();
