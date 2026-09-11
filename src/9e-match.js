
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
   ・英字の見出し（WIN・LOSE・YOU・FORTUNE・FIRST・LV）は自作の線の字体（DKM_GLYPH）で描く。
     Web フォントが読めない端末でも形が変わらない（WP4#5）。
   ・見た目の乱数は DKFX.rnd()。順番と宝箱の中身だけはゲームの乱数（Math.random）。
   v10（WP15b）: 報酬のあと［確認］で約1.4秒のクロスフェードで同じ部屋へ（J31）、品物はプレゼントボックス（J54）、
   参加報酬 1,000G×x＋キューブ、LOSE の専用ジングル・ガラスの音・短調の結果曲（G03）、［RPを守る］（G15）、
   お祭りの花火（G18）、応援モード（G23）、TIPS を日本版の言い回しに（C28）。
   ══════════════════════════════════════════════════════════════ */

const DKM_LOAD_N = 56;                        // Loading...(n/56)
const DKM_PICK_MS = 5000;                     // 順番カード：放置で自動
const DKM_STREAK_MS = 18 * 3600 * 1000;       // 連勝認定時間 18時間
const DKM_LOSE3_GOLD = 3000;                  // 3連敗の応援（韓国版の 3連敗ボーナスを当作の額に）
const DKM_JOIN_GOLD = 1000;                   // 参加報酬 1,000G × クラス倍率 x
const DKM_CHEER_GOLD = 2000;                  // 応援モードで勝った時の「おうえんボーナス」
const DKM_DIA_GEM = 75;                       // ダイヤモンドクラスの勝利報酬 💎75
const DKM_GUARD_COST = 200;                   // ［RPを守る］の値段
const DKM_GUARD_FREE_LV = 5;                  // この Lv 以下は無料
const DKM_FIRST_MS = 1100;                    // 「先行」を見せる時間
const DKM_XFADE_MS = 1400;                    // 報酬 → 同じ部屋 のクロスフェード
const DKM_OK_AUTO_MS = 6000;                  // 報酬の［確認］を押さない時の自動
const DKM_LOSE_BGM_MS = 2300;                 // LOSE のジングルのあと、短調の結果曲に入るまで
const DKM_TIPS = [
  'トリプル、ライン、観光地独占で勝利するとRPが大きく上がる他、報酬も獲得できます。',
  'キューブはプレイ後の結果報酬として獲得できます。',
  'ハイランクのキューブからはより良いアイテムを獲得できます。',
  '30ターンが終わった時に、総資産がいちばん多いプレイヤーの勝利です。',
  '同じ色の都市をすべて持つと「カラー独占」。その色の通行料が2倍になります。',
  'カラー独占を3つそろえると「トリプル独占」で、その場で勝利です。',
  '1つのラインの都市をすべて持つと「ライン独占」で、その場で勝利です。',
  '観光地をすべて持つと「観光地独占」で、その場で勝利です。',
  '空色の観光地は、たくさん持つほど通行料が上がります。',
  'お祭り FESTIVAL の都市は試合の最初に決まり、通行料が2倍になります。',
  'サイコロでダブルが出ると、もう一回サイコロを振れます。',
  '無人島では「ダブルに挑戦」「保釈金」「脱出カード」から選べます。',
  '世界旅行に止まると、次のターンに希望する都市へ移動できます。',
  '［押す］を長押しするとゲージが動きます。狙った数で離すとゲージインパクト！',
  '奇数・偶数を選ぶと、その目が出ます（使える回数は決まっています）。',
  '相手の都市は買収できます。観光地とランドマークは買収できません。',
  'ランドマークを建てると通行料が大きく上がり、買収されなくなります。',
  '建物は1周すると建設可能になります。スタートを通るのが近道です。',
  'スタートにぴったり止まると「スタート建設ボーナス」。',
  'フォーチュンカードには黄金・シルバー・罰のカードがあります。',
  '国税庁に止まると、持っている建物の建設費用に応じて税金を払います。',
  '天使カードを持っていると、通行料が無料になります。',
  '連勝するほど、試合後の宝箱の中身がだんだんよくなります（最大5連勝）。',
  '獲得したアイテムはメールから確認できます。'
];
/* 線の字体（大文字の中心線。字の高さ 100。太さは描く側で決める） */
const DKM_GLYPH = {
  W:{ w:124, d:'M0 0L28 100L62 30L96 100L124 0' },
  I:{ w:0,   d:'M0 0V100' },
  N:{ w:78,  d:'M0 100V0L78 100V0' },
  L:{ w:62,  d:'M0 0V100H62' },
  O:{ w:86,  d:'M43 0C99 0 99 100 43 100C-13 100-13 0 43 0Z' },
  S:{ w:74,  d:'M70 16C62 3 48 0 37 0C15 0 4 12 4 27C4 45 22 49 38 52C56 56 72 60 72 76C72 92 58 100 38 100C22 100 8 94 2 82' },
  E:{ w:62,  d:'M62 0H0V100H62M0 50H50' },
  R:{ w:74,  d:'M0 100V0H42C82 0 82 56 42 56H0M40 56L74 100' },
  U:{ w:78,  d:'M0 0V58C0 114 78 114 78 58V0' },
  T:{ w:84,  d:'M0 0H84M42 0V100' },
  F:{ w:62,  d:'M62 0H0V100M0 50H50' },
  Y:{ w:84,  d:'M0 0L42 52L84 0M42 52V100' },
  V:{ w:84,  d:'M0 0L42 100L84 0' },
  A:{ w:88,  d:'M0 100L44 0L88 100M17 64H71' }
};
/* 宝箱・参加報酬のキューブ（id は WP12 の dkGiveCube(kind) の kind） */
const DKM_CUBE = {
  wood:  { nm:'ウッドキューブ',   c1:'#E9C08A', c2:'#A8703A', c3:'#6A4018' },
  silver:{ nm:'シルバーキューブ', c1:'#FFFFFF', c2:'#B9C6D4', c3:'#6E7C8E' },
  gold:  { nm:'ゴールドキューブ', c1:'#FFF3B0', c2:'#F2C230', c3:'#9A6A08' },
  dia:   { nm:'ダイヤキューブ',   c1:'#E8FAFF', c2:'#7FD4F5', c3:'#2A78C0' }
};
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
/* サイコロの能力（C05。無ければ 0） */
function dkmDieAb(pi){
  var a = null;
  try{ a = (typeof dkDieAb === 'function' && pi >= 0) ? dkDieAb(pi) : null; }catch(e){ a = null; }
  return a || {};
}
/* チーム戦で a と b が味方か（C03。個人戦は同じ席だけ） */
function dkmAlly(a, b){
  if(a === b) return true;
  if(!cfg.team) return false;
  try{ if(typeof dkAlly === 'function') return !!dkAlly(a, b); }catch(e){}
  return (a % 2) === (b % 2);
}
function dkmTeamOf(pi){
  try{ if(typeof dkTeamOf === 'function') return dkTeamOf(pi); }catch(e){}
  return pi % 2;
}
/* 参加報酬のキューブ（ウッド以上。上のクラスほど良い） */
function dkmCubeKind(clsId){ return (clsId === 'first' || clsId === 'dia') ? 'silver' : 'wood'; }
/* 小さなキューブの絵（CSS）。chips の ic に 'cube:wood' などを渡すとこれを出す */
function dkmCubeIcon(kind){
  var C = DKM_CUBE[kind] || DKM_CUBE.wood;
  return '<i class="dkm-cubei" style="--c1:' + C.c1 + ';--c2:' + C.c2 + ';--c3:' + C.c3 + '"></i>';
}
/* 線の字体で語を組む → { d:パス, w:幅, h:高さ }。字の高さ 100、太さ sw の中心線（外側に sw/2 はみ出す） */
function dkmWord(text, sw, track){
  var x = sw / 2, d = '', t = String(text || '').toUpperCase();
  var kern = { LT:-26, LV:-22, LY:-22, AV:-14, VA:-14, TA:-14 };
  for(var i = 0; i < t.length; i++){
    var g = DKM_GLYPH[t.charAt(i)];
    if(!g){ x += 40; continue; }
    if(i > 0) x += kern[t.charAt(i - 1) + t.charAt(i)] || 0;          // 字の組み合わせで空きすぎる所を詰める
    d += g.d.replace(/([MLHVCZ])([^MLHVCZ]*)/gi, function(all, cmd, args){
      var n = args.trim() ? args.trim().replace(/-/g, ' -').trim().split(/[\s,]+/).map(Number) : [];
      var u = cmd.toUpperCase(), out = [];
      if(u === 'H') out = n.map(function(v){ return +(v + x).toFixed(1); });
      else if(u === 'V') out = n.map(function(v){ return +(v + sw / 2).toFixed(1); });
      else out = n.map(function(v, k){ return +(v + (k % 2 ? sw / 2 : x)).toFixed(1); });
      return u + out.join(' ');
    });
    x += g.w + sw + track;
  }
  return { d:d, w:Math.max(1, x - track - sw / 2), h:100 + sw };
}
/* 線の字体の SVG。opt: sw 太さ・track 字間・face 面の色（'gold'|'silver'|色）・edge 縁の色・ol 縁の太さ・ext 厚み・side 厚みの色・hi 上の光 */
function dkmWordSVG(text, cls, opt){
  opt = opt || {};
  var sw = opt.sw || 26, track = opt.track == null ? 10 : opt.track, W = dkmWord(text, sw, track), u = dkmId();
  var ol = opt.ol == null ? 10 : opt.ol, ext = opt.ext || 0;
  var pad = ol + 4, vw = W.w + sw + pad * 2, vh = W.h + pad * 2 + ext;
  var tr = 'translate(' + pad + ' ' + pad + ')';
  var face = opt.face || 'gold', fill, defs = '';
  if(face === 'gold' || face === 'silver'){
    var st = face === 'silver'
      ? '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".44" stop-color="#E2E9F1"/><stop offset=".58" stop-color="#8E9CAE"/><stop offset=".8" stop-color="#C9D3DE"/><stop offset="1" stop-color="#F4F7FA"/>'
      : '<stop offset="0" stop-color="#FFFBE6"/><stop offset=".4" stop-color="#FFE27A"/><stop offset=".56" stop-color="#F4B81E"/><stop offset=".8" stop-color="#C98A12"/><stop offset="1" stop-color="#FFE9A0"/>';
    defs += '<linearGradient id="' + u + 'f" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="' + W.h + '">' + st + '</linearGradient>';
    fill = 'url(#' + u + 'f)';
  } else fill = face;
  var edge = opt.edge || (face === 'silver' ? '#171C24' : '#2A1604');
  var side = opt.side || (face === 'silver' ? '#46505C' : '#7A4A06');
  var P = function(stroke, w, extra){ return '<path d="' + W.d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '/>'; };
  var body = '';
  for(var k = ext; k >= 2; k -= 2) body += '<g transform="translate(0 ' + k + ')">' + P(side, sw + ol * 2) + '</g>';
  body += P(edge, sw + ol * 2) + P(fill, sw);
  if(opt.hi !== false && (face === 'gold' || face === 'silver')){
    defs += '<clipPath id="' + u + 'h"><rect x="-20" y="-20" width="' + (W.w + sw + 40) + '" height="' + (W.h * 0.42 + 20) + '"/></clipPath>';
    body += P('#FFFFFF', sw * 0.9, ' stroke-opacity=".34" clip-path="url(#' + u + 'h)"');
  }
  return '<svg class="' + (cls || 'dkm-wsvg') + '" viewBox="0 0 ' + vw.toFixed(0) + ' ' + vh.toFixed(0) + '"' + (opt.attr || '') + ' aria-hidden="true">'
    + (defs ? '<defs>' + defs + '</defs>' : '') + '<g transform="' + tr + '">' + body + '</g></svg>';
}

/* ══════════ 音（6-*.js は読むだけなので、ここで合成して SFX と JING に足す） ══════════ */
function dkmAudio(){
  if(typeof soundOn !== 'undefined' && !soundOn) return null;
  var a = null; try{ a = ac(); }catch(e){ a = null; }
  if(!a || !a.createGain) return null;
  if(a.state === 'suspended'){ try{ var rp = a.resume(); if(rp && rp.catch) rp.catch(function(){}); }catch(e){} }
  return a;
}
function dkmVol(k){ return Math.max(0, Math.min(1, (typeof sfxVol === 'number' ? sfxVol : 0.7))) * k; }
function dkmNoise(a){
  if(DKM_st.nz && DKM_st.nz.sampleRate === a.sampleRate) return DKM_st.nz;
  var n = Math.floor(a.sampleRate * 1.2), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0), s = 20260912;
  for(var i = 0; i < n; i++){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; d[i] = ((s >>> 0) / 4294967296) * 2 - 1; }
  DKM_st.nz = b;
  return b;
}
/* 1音（音色・周波数の移り・音量の山） */
function dkmTone(a, out, t, o){
  var os = a.createOscillator(), g = a.createGain();
  os.type = o.type || 'sine';
  os.frequency.setValueAtTime(o.f, t);
  if(o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
  if(o.det) os.detune.value = o.det;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.v, t + (o.a || 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  var node = os;
  if(o.lp){ var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); if(o.lp2) f.frequency.exponentialRampToValueAtTime(o.lp2, t + o.dur); node.connect(f); node = f; }
  node.connect(g); g.connect(out);
  os.start(t); os.stop(t + o.dur + 0.05);
  os.onended = function(){ try{ os.disconnect(); g.disconnect(); }catch(e){} };
}
function dkmNz(a, out, t, o){
  var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = dkmNoise(a); s.playbackRate.value = o.rate || 1;
  f.type = o.type || 'highpass'; f.frequency.setValueAtTime(o.f, t); f.Q.value = o.q || 0.8;
  if(o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.v, t + (o.a || 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t, (o.off || 0) % 1); s.stop(t + o.dur + 0.05);
  s.onended = function(){ try{ s.disconnect(); f.disconnect(); g.disconnect(); }catch(e){} };
}
function dkmOut(a, v){
  var g = a.createGain(); g.gain.value = v; g.connect(a.destination);
  setTimeout(function(){ try{ g.disconnect(); }catch(e){} }, 4000);
  return g;
}
/* LOSE のジングル（2.4秒）：短調の和音が3段で下がり、低い音で終わる */
function dkmLoseJingle(m){
  var a = dkmAudio(); if(!a) return 0;
  var out = dkmOut(a, dkmVol(0.55)), t = a.currentTime + 0.03;
  var ch = [[440, 523.3, 659.3], [392, 466.2, 587.3], [349.2, 415.3, 523.3], [220, 261.6, 329.6]];
  ch.forEach(function(c, k){
    var tt = t + k * 0.36, last = k === ch.length - 1, dur = last ? 1.3 : 0.52;
    c.forEach(function(f, i){
      dkmTone(a, out, tt, { type:'sawtooth', f:f, f2:f * (last ? 0.985 : 0.97), dur:dur, v:0.07, a:0.02, det:(i - 1) * 6, lp:last ? 1600 : 1900, lp2:last ? 420 : 700 });
      dkmTone(a, out, tt, { type:'triangle', f:f / 2, dur:dur, v:0.05, a:0.02 });
    });
  });
  dkmTone(a, out, t, { type:'sine', f:110, f2:55, dur:2.3, v:0.16, a:0.04 });
  dkmTone(a, out, t + 1.08, { type:'sine', f:880, f2:820, dur:1.1, v:0.035, a:0.01 });
  try{ if(m && typeof m.duck === 'function') m.duck(0.3548, 2.4); }catch(e){}
  return 2.4;
}
/* ガラスの割れる音：白いノイズの破裂＋高い澄んだ音が散る（0.7秒） */
function dkmGlassSfx(){
  var a = dkmAudio(); if(!a) return;
  var out = dkmOut(a, dkmVol(0.5)), t = a.currentTime + 0.01;
  dkmNz(a, out, t, { type:'highpass', f:2600, f2:5200, dur:0.22, v:0.5, a:0.002 });
  dkmNz(a, out, t + 0.02, { type:'bandpass', f:5200, f2:2400, q:3, dur:0.5, v:0.22, a:0.004, off:0.3 });
  var fs = [4186, 5274, 3520, 6272, 4699, 7040, 3951, 5588], ts = [0, 0.03, 0.07, 0.1, 0.15, 0.2, 0.27, 0.35];
  fs.forEach(function(f, i){ dkmTone(a, out, t + ts[i], { type:'sine', f:f, f2:f * 0.96, dur:0.16 + (i % 3) * 0.08, v:0.07 - i * 0.005, a:0.002 }); });
  dkmTone(a, out, t, { type:'triangle', f:180, f2:70, dur:0.18, v:0.12, a:0.003 });
}
/* 花火の打ち上げ：ひゅるる（上がる笛）→ ぱん（はじけ） */
function dkmFireSfx(){
  var a = dkmAudio(); if(!a) return;
  var out = dkmOut(a, dkmVol(0.42)), t = a.currentTime + 0.01;
  dkmTone(a, out, t, { type:'sine', f:520, f2:1900, dur:0.34, v:0.06, a:0.03 });
  dkmNz(a, out, t, { type:'bandpass', f:1200, f2:3600, q:4, dur:0.32, v:0.05, a:0.02 });
  dkmNz(a, out, t + 0.34, { type:'lowpass', f:2400, f2:300, dur:0.4, v:0.5, a:0.002, off:0.5 });
  dkmTone(a, out, t + 0.34, { type:'sine', f:140, f2:50, dur:0.3, v:0.2, a:0.003 });
  for(var i = 0; i < 6; i++) dkmNz(a, out, t + 0.42 + i * 0.05, { type:'highpass', f:3000 + i * 400, dur:0.05, v:0.12, a:0.002, off:i * 0.11 });
}
/* JING.play を包んで 'lose' を足す（6d-jingle.js は6本だけ） */
function dkmPatchJing(J){
  if(!J || J.dkmLose || typeof J.play !== 'function') return J;
  var p0 = J.play, l0 = J.length;
  J.play = function(nm, m){ if(nm === 'lose') return dkmLoseJingle(m); return p0.apply(J, arguments); };
  if(typeof l0 === 'function') J.length = function(nm){ return nm === 'lose' ? 2.4 : l0.apply(J, arguments); };
  J.dkmLose = true;
  return J;
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
    + dkmWordSVG('FORTUNE', 'dkm-fword', { sw:24, track:14, face:'#B82640', edge:'#FFF6E6', ol:6, hi:false, attr:' x="18" y="108" width="134" height="24"' })
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
    lv:dkmWordSVG('LV', 'dkm-lvword', { sw:30, track:12, face:'#FFF3C8', edge:'#6B4408', ol:9, hi:false, attr:' x="36" y="48" width="48" height="28"' }),
    gem:'<path d="M60 42L78 56L60 82L42 56Z" fill="#8FD8F8" stroke="#0B3C74" stroke-width="2.4" stroke-linejoin="round"/><path d="M42 56H78M60 42L54 56L60 82L66 56Z" fill="none" stroke="#0B3C74" stroke-width="1.4" stroke-linejoin="round"/><path d="M60 42L66 56H78Z" fill="#E6F8FF" fill-opacity=".7"/>',
    cube:'<path d="M60 40L80 50V72L60 82L40 72V50Z" fill="#F2C230" stroke="#6B4408" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 50L60 60L80 50M60 60V82" fill="none" stroke="#6B4408" stroke-width="2"/><path d="M60 40L80 50L60 60L40 50Z" fill="#FFF3C8"/>',
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
  /* 線の字体（DKM_GLYPH）で太い立体文字にする。字の中心線を太く塗り、縁・厚み・上の光を重ねる */
  return dkmWordSVG(text, 'dkm-tsvg', { sw:text.length > 4 ? 30 : 34, track:text.length > 4 ? 12 : 16,
    face:tone === 'silver' ? 'silver' : 'gold', ol:11, ext:16 });
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
  /* 検索中は下の画面（部屋など）を隠す：暗幕の下で動く飾りを数えない・スマホの層を増やさない */
  var stg = document.getElementById('stage'); if(stg) stg.classList.add('dkm-vsc');
  var unhide = function(){ if(stg && tok === DKM_st.vsTok) stg.classList.remove('dkm-vsc'); };
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
  unhide();
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
    + '<i class="dkm-ld-shoot s1"></i>'
    + '<div class="dkm-ld-horizon">' + dkmSkylineSVG(map.id, false) + '</div>'
    + '<div class="dkm-ld-water"><div class="dkm-ld-reflbox">' + dkmSkylineSVG(map.id, true) + '</div>'
    +   '<div class="dkm-ld-glints"><i class="dkm-ld-glint g1"></i><i class="dkm-ld-glint g2"></i><i class="dkm-ld-glint g3"></i><i class="dkm-ld-glint g4"></i></div></div>'
    + '<div class="dkm-ld-diceref">' + dkmDiceSVG() + '</div>'
    + '<div class="dkm-ld-dice"><i class="dkm-ld-halo"></i>' + dkmDiceSVG() + '</div>'
    + '<i class="dkm-ld-spark k1"></i>'
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
      + '<b class="dkm-ff-big">先行</b><em class="dkm-ff-rib fx-deco">' + dkmWordSVG('FIRST', 'dkm-ribword', { sw:26, track:12, face:'#FFF6E2', edge:'#6A0E0A', ol:8, hi:false }) + '</em>'
      + '<span class="dkm-ff-nm" style="--c:' + PCOL[pi % 4] + '">' + nm + '</span></div>';
  }
  return '<div class="dkm-ff"><i class="dkm-ff-stripe" style="--c:' + PCOL[pi % 4] + '"></i>'
    + '<b class="dkm-ff-no">' + (rk + 1) + '</b><em class="dkm-ff-lb">番目</em>'
    + '<span class="dkm-ff-nm" style="--c:' + PCOL[pi % 4] + '">' + nm + '</span></div>';
}
/* 応援モードの試合か（C25：SV.cheer===1。部屋が cfg.cheer を立てた時も同じ。オンラインは無し） */
function dkmCheerNow(){
  if(dkmIsOnline()) return false;
  return !!((typeof SV === 'object' && SV && +SV.cheer === 1) || cfg.cheer);
}
/* 細い棒を ms で右から縮める（void offsetWidth で CSS を再始動しない。el.animate を使う） */
function dkmBarRun(bar, ms){
  if(!bar || !bar.animate) return null;
  if(bar._dkmA){ try{ bar._dkmA.cancel(); }catch(e){} }
  try{ bar._dkmA = bar.animate([{ transform:'scaleX(1)' }, { transform:'scaleX(0)' }], { duration:Math.max(60, ms), easing:'linear', fill:'forwards' }); }
  catch(e){ bar._dkmA = null; }
  return bar._dkmA;
}
function dkmBarStop(bar){ if(bar && bar._dkmA){ try{ bar._dkmA.cancel(); }catch(e){} bar._dkmA = null; } }
/* 弾ませる（入場の keyframe を JS で1回だけ。0% で opacity を下げない） */
function dkmBounce(el, from){
  if(!el || !el.animate || DKFX.reduced) return null;
  var base = from || '';
  try{
    return el.animate([{ transform:base + ' translateY(18px) scale(.84)' }, { transform:base + ' scale(1.08)', offset:0.6 }, { transform:base + ' scale(1)' }],
      { duration:380, easing:'cubic-bezier(.34,1.56,.64,1)' });
  }catch(e){ return null; }
}
function dkmOrdHTML(n, cheer){
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
    +   '<span class="dkm-ord-timer"><i></i></span>'
    +   (cheer ? '<span class="dkm-ord-cheer"><i>応援モード</i>CPU が1段やさしくなっています</span>' : '') + '</div>'
    + '<div class="dkm-ord-row">' + cards + '</div>'
    + '<div class="dkm-spot-tag" aria-hidden="false"><b>お祭り</b><em>×2</em><span></span></div>'
    + '<div class="dkm-fest" aria-hidden="true"><span class="dkm-fest-w">' + dkmWordSVG('FESTIVAL', 'dkm-festword', { sw:30, track:12, face:'gold', ol:10, ext:10 }) + '</span>'
    +   '<em class="dkm-fest-x">×2</em></div>';
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
  d.innerHTML = '<i class="dkm-you-tail"></i><b>' + dkmWordSVG('YOU', 'dkm-youword', { sw:30, track:12, face:'#4A2A04', edge:'#FFF3C8', ol:8, hi:false }) + '</b>';
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
  var cheer = dkmCheerNow();
  G.dkmCheer = cheer;                  // この試合が応援モードか（試合後の grantRewards が見る）
  el.innerHTML = dkmOrdHTML(n, cheer);
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
      var pickMs = DKM_PICK_MS * (dkmSpeed() < 0.2 ? dkmSpeed() : 1);
      dkmBarRun(timer.querySelector('i'), pickMs);
      var picked = await new Promise(function(res){
        var done = false;
        var fin = function(k){ if(done) return; done = true; clearTimeout(to); cards.forEach(function(c){ c.onclick = null; }); res(k); };
        cards.forEach(function(c, k){ if(owner[k] < 0) c.onclick = function(){ if(owner[k] < 0) fin(k); }; });
        var to = setTimeout(function(){ var f = freeCards(); fin(f[(dkmR() * f.length) | 0]); }, pickMs);
        DKM_st.ordFin = fin;
      });
      el.classList.remove('choosing'); dkmBarStop(timer.querySelector('i'));
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
  await wait(DKM_FIRST_MS);
  if(!alive()){ el.remove(); if(you) you.remove(); return; }
  /* 4) 祭り都市にスポット */
  var fest = [];
  G.tiles.forEach(function(t, i){ if(t && t.x2) fest.push(i); });
  el.classList.add('cards-out');
  await wait(240);
  if(fest.length && alive()){
    el.classList.add('spot');
    ttl.textContent = 'お祭り FESTIVAL'; sub.textContent = '通行料が ×2 になる都市が決まりました';
    var spot = el.querySelector('.dkm-spot'), tag = el.querySelector('.dkm-spot-tag'), stamp = el.querySelector('.dkm-fest');
    var lastF = Math.min(fest.length, 3) - 1;
    for(var f = 0; f < fest.length; f++){
      if(!alive()) break;
      var pt = dkmTileScreen(fest[f]);
      spot.style.transform = 'translate(' + (pt.x - 1800).toFixed(1) + 'px,' + (pt.y - 1100).toFixed(1) + 'px)';
      var tx = Math.max(150, Math.min(1450, pt.x)), ty = Math.max(150, pt.y - 96);
      tag.style.left = tx.toFixed(0) + 'px'; tag.style.top = ty.toFixed(0) + 'px';
      tag.querySelector('span').textContent = G.tiles[fest[f]].name;
      dkmBounce(tag, 'translate(-50%,-100%)');
      if(f === 0) el.classList.add('spot-on');
      dkmFireSfx();                                          // 打ち上げの音（ひゅるる → ぱん）
      await wait(f === 0 ? 300 : 360);
      try{ fxBurst({ x:pt.x, y:pt.y - 30 }, { kind:'star', n:10, power:0.9 }); }catch(e){}
      if(f === lastF && stamp){                              // 3都市目で「FESTIVAL ×2」（札と都市に重ならない高さへ）
        var far = function(c){ return Math.min(Math.abs(c + 45 - (ty - 30)), Math.abs(c + 45 - pt.y)); };
        stamp.style.top = (far(330) >= far(560) ? 330 : 560) + 'px';
        stamp.classList.add('on');
        dkmBounce(stamp, 'translateX(-50%)');
        try{ fxBurst(stamp, { kind:'conf', n:16, power:1.1 }); }catch(e){}
        dkmSfx('gachaRare');
      }
      await wait(f === lastF ? 700 : 420);
    }
    await wait(220);
  }
  /* 5) 片付け */
  el.classList.add('out');
  if(you) you.classList.add('out');
  await wait(220);
  if(el.parentNode) el.parentNode.removeChild(el);
  if(you && you.parentNode) you.parentNode.removeChild(you);
  if(G === g0){ G.turn = first; G.roundStart = first; try{ updHUD(); }catch(e){ console.error('[WP15b]', e); } }
}

/* ══════════ 対戦後の報酬（1試合1回だけ） ══════════
   参加報酬＝1,000G × クラス倍率 x（開始額÷200万。オンラインは×1）＋キューブ（dkGiveCube・ウッド以上）。
   ゴールドにサイコロの能力 dkDieAb(me).gold（%）を足す。ダイヤモンドクラスの勝ちは💎75。
   連勝：勝つと+1（前の勝ちから18時間を超えていたら1から）、負けると0。3連敗ごとに応援3,000G と、次の1試合は応援モード
   （SV.cheer=1。応援モードで勝つと おうえんボーナス +2,000G。試合が終わったら0に戻す）。勝った時の品物は宝箱（プレゼントボックス）。
   最後に 'match:end' を送り、chips の行を受け取る（RP の行を先頭に、最大4行）。 */
function dkmIsRpChip(c){ return !!c && (/RP/.test(String(c.v)) || /リーグ|RP/.test(String(c.label))); }
function grantRewards(won){
  if(!G) return null;
  if(G.rewarded) return G.dkmInfo || null;
  G.rewarded = true;
  won = !!won;
  var online = dkmIsOnline(), me = dkmMe(), cl = dkmClassOf();
  var x = online ? 1 : cl.x;
  var dieP = Math.max(0, +dkmDieAb(me).gold || 0);
  var join = Math.round(DKM_JOIN_GOLD * x), dieGold = Math.round(join * dieP / 100), exp = won ? 40 : 14;
  var cheerMatch = !online && !!(G.dkmCheer === undefined ? dkmCheerNow() : G.dkmCheer);
  var cheerBonus = (won && cheerMatch) ? DKM_CHEER_GOLD : 0;
  var gem = (won && !online && cl.id === 'dia') ? DKM_DIA_GEM : 0;
  var lv0 = SV.lv;
  SV.exp += exp; SV.plays = (SV.plays | 0) + 1; if(won) SV.wins = (SV.wins | 0) + 1;
  try{
    if(SV.stat){ SV.stat.plays = (SV.stat.plays | 0) + 1; if(won) SV.stat.wins = (SV.stat.wins | 0) + 1; }
    var td = DKCORE_today(); td.plays = (td.plays | 0) + 1; if(won) td.wins = (td.wins | 0) + 1;
    var wk = DKCORE_week(); wk.plays = (wk.plays | 0) + 1; if(won) wk.wins = (wk.wins | 0) + 1;
  }catch(e){ console.error('[WP15b]', e); }
  var up = 0;
  while(SV.exp >= playerLvNeed(SV.lv)){ SV.exp -= playerLvNeed(SV.lv); SV.lv++; up++; }
  var now = Date.now(), lose3 = 0, nextCheer = false;
  if(won){
    var keep = (SV.streak | 0) > 0 && (now - (+SV.streakAt || 0)) <= DKM_STREAK_MS;
    SV.streak = keep ? (SV.streak | 0) + 1 : 1;
    SV.streakAt = now; SV.lstreak = 0;
  } else {
    SV.streak = 0;
    SV.lstreak = (SV.lstreak | 0) + 1;
    if(SV.lstreak % 3 === 0){ lose3 = DKM_LOSE3_GOLD; nextCheer = !online; }
  }
  if(!online) SV.cheer = nextCheer ? 1 : 0;          // 応援モードは3連敗の次の1試合だけ
  var gold = join + dieGold + cheerBonus + lose3;
  SV.gold += gold;
  if(gem) SV.gem = (+SV.gem || 0) + gem;
  var cubeKind = dkmCubeKind(online ? 'eco' : cl.id), cube = null;
  try{ cube = (typeof dkGiveCube === 'function') ? dkGiveCube(cubeKind) : null; }catch(e){ console.error('[WP15b]', e); cube = null; }
  saveNow();
  var payload = { won:won, me:me, winner:G.winner, reason:G.winReason, winX:G.winX || 1, cls:cl.id, x:x,
    mapId:(G.map && G.map.id) || cfg.mapId, n:G.players.length, online:online,
    humans:G.players.filter(function(p){ return p.kind !== 'cpu'; }).length, cheer:cheerMatch,
    team:cfg.team ? dkmTeamOf(G.winner) : undefined, chips:[] };
  try{ dkEmit('match:end', payload); }catch(e){ console.error('[WP15b]', e); }
  var ext = (Array.isArray(payload.chips) ? payload.chips : []).filter(function(c){ return c && (c.label || c.v !== undefined); })
    .map(function(c){ return { ic:String(c.ic == null ? '' : c.ic), label:String(c.label == null ? '' : c.label), v:(c.v == null ? '' : String(c.v)) }; });
  saveNow();
  if(up){ try{ jingle('levelup'); }catch(e){} }
  /* 行の順：RP（リーグ）→ 自分の行（キューブ・おうえん・ダイヤ・3連敗）→ ほかの班の行。最大4行 */
  var mine = [{ ic:'cube:' + cubeKind, label:DKM_CUBE[cubeKind].nm, v:'+1' }];
  if(cheerBonus) mine.push({ ic:'🎉', label:'おうえんボーナス', v:'+' + dkmF(cheerBonus) });
  if(gem) mine.push({ ic:'💎', label:'勝利報酬', v:'+' + gem });
  if(lose3) mine.push({ ic:'🎁', label:'3連敗の応援', v:'+' + dkmF(lose3) });
  var rpI = -1;
  for(var ci = 0; ci < ext.length; ci++){ if(dkmIsRpChip(ext[ci])){ rpI = ci; break; } }
  var rpChip = rpI >= 0 ? ext.splice(rpI, 1)[0] : null;
  var chips = (rpChip ? [rpChip] : []).concat(mine, ext).slice(0, 4);
  var info = { won:won, me:me, gold:gold, join:join, dieGold:dieGold, dieP:dieP, exp:exp, lv:SV.lv, lv0:lv0, lvUp:up, x:x,
    cls:cl.id, clsNm:online ? 'オンライン' : cl.nm, streak:SV.streak | 0, lstreak:SV.lstreak | 0,
    cheerMatch:cheerMatch, cheerBonus:cheerBonus, nextCheer:nextCheer, lose3:lose3, gem:gem,
    cube:{ kind:cubeKind, got:cube }, online:online, chips:chips, rpAt:rpChip ? 0 : -1 };
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
        + (cfg.team ? '<i class="dkm-rteam t' + dkmTeamOf(r.i) + '">' + (dkmTeamOf(r.i) ? 'B' : 'A') + '</i>' : '')
        + '<span class="dkm-rnm"><b>' + esc(p.name) + '</b>' + (p.out ? '<em>破産</em>' : '<em>' + esc(card.nm) + '</em>') + '</span>'
        + '<b class="dkm-rv" data-v="' + Math.max(0, r.a) + '">0</b></div>';
    }).join('') + '</div>';
}
function dkmStarsHTML(s){
  var h = '';
  for(var k = 1; k <= 5; k++) h += '<i class="' + (k <= s ? 'on' : '') + '">★</i>';
  return '<span class="dkm-stars" aria-label="連勝 ' + s + '">' + h + '</span>';
}
/* chips の行（最大4行・1行ずつ。ic が 'cube:種類' ならキューブの絵） */
function dkmChipHTML(c, k){
  var ic = String(c.ic || '');
  var icH = ic.indexOf('cube:') === 0 ? dkmCubeIcon(ic.slice(5)) : '<i class="dkm-chip-ic">' + esc(ic) + '</i>';
  return '<div class="dkm-chip" data-dkm-chip="' + k + '">' + icH + '<span>' + esc(c.label) + '</span><b>' + esc(c.v) + '</b></div>';
}
/* 行の文字が入りきらない時は字を小さくし（16px まで）、それでも入らなければ2行にする（切らない。GO-2） */
function dkmFitChips(root){
  if(!root) return;
  root.querySelectorAll('.dkm-chip span').forEach(function(s){
    s.style.fontSize = ''; s.classList.remove('two');
    var fs = parseFloat(getComputedStyle(s).fontSize) || 22, n = 0;
    while(s.scrollWidth > s.clientWidth + 1 && fs > 16 && n < 8){ fs -= 1; n++; s.style.fontSize = fs + 'px'; }
    if(s.scrollWidth > s.clientWidth + 1) s.classList.add('two');
  });
}
function dkmResHTML(R){
  var mode = R.mode, info = R.info, W = G.players[G.winner];
  var mp = R.me >= 0 ? G.players[R.me] : W, mc = cardById(mp.card) || CARDPOOL[0];
  var reason = dkmReasonShort(G.winReason);
  if(mode !== 'watch' && info) return dkmResHTML2(R, W, mp, mc, reason);
  /* 観戦（CPU だけの試合）：RESULT と勝者だけ。［確認］で同じ部屋へ */
  var tag = esc(reason) + (G.winX > 1 && String(G.winReason).indexOf('独占') >= 0 ? ' x' + G.winX : '');
  return '<div class="dkm-res-veil"></div>'
    + '<div class="dkm-hero"><span class="dkm-hero-t fx-deco">' + dkmTitleSVG('RESULT', 'gold') + '</span></div>'
    + '<div class="dkm-reason"><b>' + tag + '</b><span>' + esc(W.name) + ' の勝利</span></div>'
    + '<div class="dkm-panel watch"><i class="dkm-panel-edge"></i>'
    +   '<div class="dkm-pl"><div class="dkm-me">' + dkmPortrait(mp.card, 'dkm-me-face')
    +     '<span class="dkm-me-tx"><b>' + esc(mp.name) + '</b><em>' + esc(mc.nm) + '</em></span><span class="dkm-cls">観戦</span></div>'
    +     '<div class="dkm-watch"><b>' + esc(W.name) + ' の勝利</b><span>' + esc(G.winReason || '') + '</span>'
    +     '<em>CPU だけの試合なので、報酬はありません</em></div></div>'
    +   '<div class="dkm-pr"><div class="dkm-bonus"><b>RESULT</b></div>'
    +     '<div class="dkm-medals n1">' + dkmMedal(dkmReasonIcon(G.winReason), reason, G.winX > 1 ? 'x' + G.winX : '') + '</div>' + dkmRankHTML(R) + '</div>'
    +   '<div class="dkm-pb"><div class="dkm-pb-l wide"><div class="dkm-pb-hd"><b>観戦モード</b></div>'
    +     '<span class="dkm-pb-ds">席に「あなた」を入れると、勝ち負けの報酬がもらえます。</span></div></div></div>'
    + '<div class="dkm-res-btns">' + dkmBtn(R.online ? 'home' : 'ok', 'gr dkm-prime', R.online ? 'ホームへ' : '確認') + '</div>';
}
function dkmBtn(act, cls, txt, extra){
  return '<button type="button" class="dkm-btn ' + cls + '" data-dkm-act="' + act + '" data-fx-press><span class="dkm-btn-tx">' + txt + '</span>'
    + '<i class="dkm-btn-shine"></i>' + (extra || '') + '</button>';
}
/* WIN / LOSE のパネル（日本版の並び：左に自分・ゴールド・経験値・行、右に BONUS!・メダル・全体ランキング、
   下の帯に 連勝／報酬選択の宝箱（負けは 連敗／RPを守る）） */
function dkmResHTML2(R, W, mp, mc, reason){
  var info = R.info, win = R.mode === 'win';
  var h = '<div class="dkm-res-veil"></div>';
  if(!win) h += dkmCrackHTML('tl') + dkmCrackHTML('tr') + dkmCrackHTML('bl') + dkmCrackHTML('br');
  h += '<div class="dkm-hero">'
    + (win ? '<span class="dkm-pile-l fx-deco">' + dkmCoinPileSVG(false) + '</span><span class="dkm-pile-r fx-deco">' + dkmCoinPileSVG(true) + '</span>' : '')
    + '<span class="dkm-hero-t fx-deco">' + dkmTitleSVG(win ? 'WIN' : 'LOSE', win ? 'gold' : 'silver') + '</span></div>';
  h += '<div class="dkm-reason"><b>' + esc(reason) + (G.winX > 1 && String(G.winReason).indexOf('独占') >= 0 ? ' x' + G.winX : '') + '</b>'
    + '<span>' + esc(W.name) + (cfg.team ? ' のチームの勝利' : ' の勝利') + '</span></div>';
  var need = playerLvNeed(SV.lv), k = Math.max(0, Math.min(1, SV.exp / need)), tm = cfg.team ? dkmTeamOf(R.me) : -1;
  var L = '<div class="dkm-me">' + dkmPortrait(mp.card, 'dkm-me-face')
    + '<span class="dkm-me-tx"><b>' + esc(mp.name) + '</b><em>' + esc(mc.nm) + '</em></span>'
    + (tm >= 0 ? '<span class="dkm-cls team t' + tm + '">チーム' + (tm ? 'B' : 'A') + '</span>' : '')
    + '<span class="dkm-cls">' + esc(info.clsNm) + '</span></div>'
    + '<div class="dkm-gold"><i class="dkm-coin"></i><span class="dkm-lb">ゴールド</span>'
    + (info.dieP > 0 ? '<em class="dkm-gold-tag">サイコロ +' + info.dieP + '%</em>' : '')
    + '<b class="dkm-gold-v" data-v="' + info.gold + '">+0</b></div>'
    + '<div class="dkm-exp"><span class="dkm-lb">経験値</span><b>+' + info.exp + '</b>'
    + '<span class="dkm-expbar"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i></span><em class="dkm-lv">Lv.' + SV.lv + '</em></div>'
    + '<div class="dkm-chips">' + info.chips.map(dkmChipHTML).join('') + '</div>';
  var medals = [];
  if(win) medals.push(dkmMedal(dkmReasonIcon(G.winReason), reason, G.winX > 1 ? 'x' + G.winX : ''));
  medals.push(dkmMedal('ticket', info.clsNm, '×' + info.x));
  if(info.lvUp) medals.push(dkmMedal('lv', 'レベルボーナス', 'Lv.' + info.lv));
  else if(info.gem) medals.push(dkmMedal('gem', 'ダイヤ', '+' + info.gem));
  else if(info.cheerBonus) medals.push(dkmMedal('gift', 'おうえん', '+' + dkmF(info.cheerBonus)));
  else medals.push(dkmMedal('cube', 'キューブ', '+1'));
  var Rr = '<div class="dkm-bonus ' + (win ? '' : 'gray') + '"><b>' + (win ? 'BONUS!' : 'RESULT') + '</b></div>'
    + '<div class="dkm-medals n' + Math.min(3, medals.length) + '">' + medals.slice(0, 3).join('') + '</div>' + dkmRankHTML(R);
  var B;
  if(win){
    var s = Math.max(1, Math.min(5, info.streak));
    B = '<div class="dkm-streak win"><i class="dkm-cup"></i><span class="dkm-st-tx"><b>' + info.streak + ' 連勝中！</b><em>連勝認定時間 18 時間</em></span></div>'
      + '<div class="dkm-pb-l"><div class="dkm-pb-hd"><b>★報酬選択</b>' + dkmStarsHTML(s) + '</div>'
      + '<span class="dkm-pb-ds">最大5連勝まで<br>報酬がだんだんよくなります</span></div>'
      + '<div class="dkm-pb-cbox"><div class="dkm-pb-chests">' + [0, 1, 2].map(function(i){
        return '<button type="button" class="dkm-bchest c' + i + '" data-dkm-chest="' + i + '" aria-label="宝箱' + (i + 1) + '"><span class="fx-deco">' + dkmChestSVG(i) + '</span></button>';
      }).join('') + '</div><span class="dkm-pb-hint">希望する箱を選択してください</span></div>';
  } else {
    var free = (SV.lv | 0) <= DKM_GUARD_FREE_LV, rp = info.rpAt >= 0 ? info.chips[info.rpAt] : null;
    R.guardable = !rp || /^[-−]/.test(String(rp.v).trim());
    B = '<div class="dkm-streak lose"><i class="dkm-cup gray"></i><span class="dkm-st-tx"><b>' + info.lstreak + ' 連敗</b>'
      + '<em>' + (info.nextCheer ? '次の試合は応援モード！' : '3連敗で応援モード') + '</em></span></div>'
      + '<div class="dkm-guard"><span class="dkm-guard-tx"><b>RPを守る</b><em>' + (R.guardable ? '負けて減った RP を元に戻します' : 'RP は減っていません') + '</em></span>'
      + dkmBtn('guard', 'gd dkm-guard-btn', R.guardable ? 'RPを守る（' + (free ? '無料' : dkmF(DKM_GUARD_COST) + 'G') + '）' : 'RP 減少なし') + '</div>';
  }
  h += '<div class="dkm-panel ' + R.mode + '"><i class="dkm-panel-edge"></i>'
    + '<div class="dkm-pl">' + L + '</div><div class="dkm-pr">' + Rr + '</div><div class="dkm-pb ' + R.mode + '">' + B + '</div></div>';
  if(!win) h += '<div class="dkm-res-btns">' + dkmBtn(R.online ? 'home' : 'ok', 'gr dkm-prime', R.online ? 'ホームへ' : '確認') + '</div>';
  return h;
}
function showResult(){
  if(!G || G.winner < 0 || !G.players || !G.players[G.winner]) return;
  var el = document.getElementById('result');
  if(!el) return;
  if(G.dkmResShown && el.classList.contains('on') && DKM_st.res && DKM_st.res.g === G) return;
  G.dkmResShown = true;
  var me = dkmMe(), online = dkmIsOnline();
  /* チーム戦はチームで WIN/LOSE */
  var won = me >= 0 && (cfg.team ? dkmAlly(me, G.winner) : G.winner === me);
  var mode = me < 0 ? 'watch' : (won ? 'win' : 'lose');
  var info = me >= 0 ? grantRewards(won) : null;
  if(DKM_st.res && DKM_st.res.timers) DKM_st.res.timers.forEach(clearTimeout);
  var R = DKM_st.res = { g:G, me:me, mode:mode, info:info, online:online, lock:false, claimed:false, stage:null, timers:[],
    guarded:false, guardable:false, prizes:(mode === 'win' && G.dkmPrizes) ? G.dkmPrizes : null };
  if(mode === 'win' && !R.prizes) R.prizes = G.dkmPrizes = dkmPrizes(info.streak);
  /* LOSE は対戦の曲を止めて、専用ジングル → 短調の結果曲（dkmResPlay）。ほかは結果の曲 */
  if(mode === 'lose'){ try{ if(typeof MUSIC !== 'undefined' && MUSIC && MUSIC.stop) MUSIC.stop(0.35); }catch(e){} }
  else bgm('result');
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
  var gb = el.querySelector('[data-dkm-act="guard"]');
  if(gb && !R.guardable) gb.disabled = true;
  screenTo('result');
  dkmFitChips(el);
  R.timers.push(setTimeout(function(){ if(DKM_st.res === R) dkmFitChips(el); }, 320));   // 画面の切り替えの後にもう一度
  dkmResPlay(el, R);
}
/* 登場の演出（数字が回る・閃光・紙吹雪・ヒビ） */
function dkmResPlay(el, R){
  var hero = el.querySelector('.dkm-hero');
  try{ var ry = fxRays(hero, { tone:R.mode === 'lose' ? 'silver' : 'gold', fast:R.mode === 'win' }); if(ry) ry.classList.add('dkm-hero-rays'); }catch(e){}
  var later = function(fn, ms){ R.timers.push(setTimeout(function(){ if(DKM_st.res !== R) return; try{ fn(); }catch(e){ console.error('[WP15b]', e); } }, ms)); };
  if(R.mode === 'win'){
    dkmSfx('win');
    later(function(){ fxFlash(); fxBurst(el.querySelector('.dkm-hero-t'), { kind:'conf', n:60, power:1.4 }); dkmSfx('confetti'); }, 160);
    later(function(){ fxBurst(el.querySelector('.dkm-pile-l'), { kind:'coin', n:10, power:0.9 }); fxBurst(el.querySelector('.dkm-pile-r'), { kind:'coin', n:10, power:0.9 }); }, 420);
  } else if(R.mode === 'lose'){
    /* G03：専用ジングル（下降の和音）→ ヒビが入る瞬間にガラスの割れる音 → 短調・遅めの結果曲 */
    try{ if(typeof JING !== 'undefined' && JING) dkmPatchJing(JING); jingle('lose'); }catch(e){}
    later(function(){ fxFlash(); dkmSfx('glass'); el.querySelectorAll('.dkm-crack').forEach(function(c){ fxShake(c, 260); }); }, 120);
    later(function(){
      var rs = document.getElementById('result');
      if(!R.minor && rs && rs.classList.contains('on') && R.g === G){ R.minor = true; bgm('result', { minor:true, tempo:0.8 }); }
    }, DKM_LOSE_BGM_MS);
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
  if(act === 'guard'){ dkmGuard(b); return; }
  if(act === 'chest'){ dkmChestOpen(-1); return; }
  dkmResNav(act === 'home' ? 'home' : 'room');
}
/* G15：［RPを守る］（Lv5以下は無料）。dkEmit('rp:guard',{cost}) で WP16 が直前の −10 を戻す。行を「RP ±0（守った）」に */
function dkmGuard(b){
  var R = DKM_st.res;
  if(!R || R.lock || R.guarded || R.mode !== 'lose' || !R.guardable) return;
  var cost = (SV.lv | 0) <= DKM_GUARD_FREE_LV ? 0 : DKM_GUARD_COST;
  if((SV.gold | 0) < cost){
    try{ toast('R', '💰', 'ゴールドが足りません', 'RPを守るには ' + dkmF(cost) + ' ゴールドが必要です', 2400); }catch(e){}
    dkmSfx('warn');
    return;
  }
  R.guarded = true;
  SV.gold -= cost;
  saveNow();
  try{ dkEmit('rp:guard', { cost:cost }); }catch(e){ console.error('[WP15b]', e); }
  var info = R.info, chips = info.chips, at = info.rpAt, chip = { ic:'🛡️', label:'RP', v:'±0（守った）' };
  if(at >= 0) chips[at] = chip;
  else { if(chips.length >= 4) chips.length = 3; chips.unshift(chip); at = info.rpAt = 0; }
  var el = document.getElementById('result'), box = el && el.querySelector('.dkm-chips');
  if(box){
    box.innerHTML = chips.map(dkmChipHTML).join('');
    box.classList.add('fixed');
    dkmFitChips(box);
    var row = box.querySelector('[data-dkm-chip="' + at + '"]');
    if(row){ row.classList.add('guarded'); dkmBounce(row); }
  }
  if(b){
    b.disabled = true;
    var tx = b.querySelector('.dkm-btn-tx'); if(tx) tx.textContent = 'RPを守りました';
    try{ fxBurst(b, { kind:'star', n:12, power:0.8 }); }catch(e){}
  }
  var gt = el && el.querySelector('.dkm-guard-tx em'); if(gt) gt.textContent = cost ? dkmF(cost) + ' ゴールドで RP を守りました' : '無料で RP を守りました';
  dkmSfx(cost ? 'coin' : 'gaugeOk');
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
    try{ toast('R', '🎁', '宝箱の報酬はメールから確認できます', dkmPrizeText(pz), 2400); }catch(e){}
  }
  if(where === 'home' || R.online){ showHome(); return; }
  dkmGoRoom(el);
}
/* J31：約1.4秒のクロスフェードで同じ部屋へ。結果の中身を一時の膜へ移して部屋を出し、膜を opacity で消す。
   金色のワイプははさまない（本家は溶けるように切り替わる）。スマホ・動きを減らす設定は膜を作らずに切り替える */
function dkmGoRoom(el){
  var st = document.getElementById('stage'), xf = null;
  if(el && st && !DKFX.mob && !DKFX.reduced && el.animate){
    xf = document.createElement('div');
    xf.className = 'dkm-xfade ' + Array.prototype.filter.call(el.classList, function(c){ return /^dkm-/.test(c) || c === 'chest'; }).join(' ');
    xf.setAttribute('aria-hidden', 'true');
    while(el.firstChild) xf.appendChild(el.firstChild);
    st.appendChild(xf);
    DKM_st.xf = xf;
  }
  var w0 = (typeof wiping !== 'undefined') ? wiping : false;
  try{ if(xf) wiping = true; dkFlowRoom(); }
  catch(e){ console.error('[WP15b]', e); }
  finally{ if(xf) wiping = w0; }
  if(!xf) return;
  var kill = function(){ if(xf.parentNode) xf.parentNode.removeChild(xf); if(DKM_st.xf === xf) DKM_st.xf = null; };
  var a = null;
  try{ a = xf.animate([{ opacity:1 }, { opacity:0 }], { duration:DKM_XFADE_MS, easing:'ease-in-out', fill:'forwards' }); }catch(e){ a = null; }
  if(a) a.onfinish = kill;
  setTimeout(kill, DKM_XFADE_MS + 300);
}

/* ══════════ ⑫ 宝箱3択 → 「おめでとうございます」→［確認］ ══════════
   中身は s=min(連勝,5) で良くなる品物（当作の表：キューブ シルバー→ゴールド→ダイヤ、ペンダント、
   ゴールドキー／ビジネス入場券／S以上のカード）。品物はプレゼントボックス（dkMail）へ送る（J54）。 */
function dkmCubeTier(s){ return s >= 5 ? 'dia' : s >= 3 ? 'gold' : 'silver'; }
function dkmPrizes(streak){
  var s = Math.max(1, Math.min(5, streak | 0));
  var pd = PENDANTS[(Math.random() * PENDANTS.length) | 0];
  var list = [{ kind:'cube', id:dkmCubeTier(s) }, { kind:'pend', id:pd.id }];
  if(s >= 4){
    var pool = CARDPOOL.filter(function(c){ return c.rar === 'S' || c.rar === 'SS'; });
    list.push({ kind:'card', id:pool[(Math.random() * pool.length) | 0].id });
  } else list.push(s === 3 ? { kind:'ticket', id:'biz' } : { kind:'key', id:'key' });
  for(var i = list.length - 1; i > 0; i--){ var j = (Math.random() * (i + 1)) | 0, t = list[i]; list[i] = list[j]; list[j] = t; }
  return list;
}
function dkmPrizeName(pz){
  if(pz.kind === 'cube') return (DKM_CUBE[pz.id] || DKM_CUBE.wood).nm;
  if(pz.kind === 'pend'){ var p = pendById(pz.id); return p ? p.nm : 'ペンダント'; }
  if(pz.kind === 'card'){ var c = cardById(pz.id); return c ? c.nm : 'キャラクターカード'; }
  if(pz.kind === 'ticket') return 'ビジネス入場券';
  if(pz.kind === 'key') return 'ゴールドキー';
  if(pz.kind === 'gold') return dkmF(pz.v) + ' ゴールド';
  if(pz.kind === 'gem') return pz.v + ' ダイヤ';
  return '';
}
function dkmPrizeSub(pz){
  if(pz.kind === 'card'){ var c = cardById(pz.id); return (c ? RAR[c.rar].nm + 'クラス' : '') + ' カード'; }
  if(pz.kind === 'pend') return 'ペンダント（1個）';
  if(pz.kind === 'ticket') return '入場券（1枚）';
  if(pz.kind === 'gold' || pz.kind === 'gem') return '財布へ';
  return '1個';
}
function dkmPrizeText(pz){ return dkmPrizeName(pz) + (pz.kind === 'gold' || pz.kind === 'gem' ? '' : '（' + dkmPrizeSub(pz).replace(/（|）/g, '') + '）'); }
function dkmPrizeIsItem(pz){ return !!pz && pz.kind !== 'gold' && pz.kind !== 'gem'; }
function dkmApplyPrize(pz){
  if(!pz || pz.applied) return;
  pz.applied = true;
  if(pz.kind === 'gold'){ SV.gold += pz.v; saveNow(); return; }
  if(pz.kind === 'gem'){ SV.gem += pz.v; saveNow(); return; }
  try{ pz.mail = dkMail({ ic:'🎁', nm:'宝箱の報酬：' + dkmPrizeName(pz), item:{ kind:pz.kind, id:pz.id } }); }
  catch(e){ console.error('[WP15b]', e); }
}
function dkmPrizeHTML(pz){
  var art = '', cls = 'k-' + pz.kind;
  if(pz.kind === 'card'){ var c = cardById(pz.id) || CARDPOOL[0]; art = dkmPortrait(c.id, 'dkm-prz-face'); cls += ' ' + RAR[c.rar].cls; }
  else if(pz.kind === 'cube') art = dkmCubeIcon(pz.id);
  else if(pz.kind === 'pend'){ var p = pendById(pz.id); art = '<i class="dkm-prz-ic">' + esc(p ? p.ic : '📿') + '</i>'; }
  else if(pz.kind === 'ticket') art = '<span class="dkm-prz-medal">' + dkmLaurelSVG('ticket') + '</span>';
  else if(pz.kind === 'key') art = '<span class="dkm-prz-medal">' + dkmLaurelSVG('crown') + '</span>';
  else art = '<i class="' + (pz.kind === 'gem' ? 'dkm-gemi' : 'dkm-coin') + '"></i>';
  return '<div class="dkm-prz ' + cls + '">' + art + '<b>' + esc(dkmPrizeName(pz)) + '</b><em>' + esc(dkmPrizeSub(pz)) + '</em></div>';
}
function dkmChestOpen(pick){
  var R = DKM_st.res, el = document.getElementById('result');
  if(!R || !el || R.mode !== 'win' || R.lock) return;
  if(!R.stage){
    var st = document.createElement('div');
    st.className = 'dkm-cstage';
    var s = Math.max(1, Math.min(5, R.info.streak));
    st.innerHTML = '<div class="dkm-cs-veil"></div><div class="dkm-cs-light fx-deco"></div>'
      + '<div class="dkm-cs-head"><div class="dkm-cs-rib"><b>★報酬選択</b></div>'
      +   '<span class="dkm-cs-sub">最大5連勝まで報酬がだんだんよくなります</span>' + dkmStarsHTML(s) + '</div>'
      + '<div class="dkm-cs-row">' + [0, 1, 2].map(function(i){
        return '<div class="dkm-cs-slot c' + i + '" style="--i:' + i + '"><button type="button" class="dkm-cs-chest" data-dkm-pick="' + i + '" aria-label="宝箱' + (i + 1) + '">'
          + '<span class="fx-deco">' + dkmChestSVG(i) + '</span></button><div class="dkm-cs-prize"></div></div>';
      }).join('') + '</div>'
      + '<div class="dkm-cs-hint">希望する箱を選択してください</div>'
      + '<div class="dkm-cs-btns">' + dkmBtn(R.online ? 'home' : 'ok', 'gr dkm-cs-ok', R.online ? 'ホームへ' : '確認', '<i class="dkm-auto"></i>') + '</div>';
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
  fxBurst(chest, { kind:pz.kind === 'gem' ? 'gem' : pz.kind === 'gold' ? 'coin' : 'star', n:26, power:1.3 });
  dkmSfx('coinBurst');
  st.querySelector('.dkm-cs-hint').textContent = dkmPrizeText(pz) + ' を獲得しました！';
  await fxWait(700);
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
  /* 「おめでとうございます」→「獲得したアイテムはメールから確認できます」→［確認］（押さなければ自動） */
  st.classList.add('done');
  var rib = st.querySelector('.dkm-cs-rib'), rb = rib && rib.querySelector('b');
  if(rib){ rib.classList.add('red'); if(rb) rb.textContent = 'おめでとうございます'; dkmBounce(rib); }
  st.querySelector('.dkm-cs-hint').textContent = dkmPrizeIsItem(pz) ? '獲得したアイテムはメールから確認できます' : dkmPrizeText(pz) + ' を財布に入れました';
  dkmSfx('cardIn');
  var go = st.querySelector('.dkm-cs-ok');
  if(go){ go.classList.add('dkm-prime', 'counting'); dkmBarRun(go.querySelector('.dkm-auto'), DKM_OK_AUTO_MS); }
  R.timers.push(setTimeout(function(){
    var rs = document.getElementById('result');
    if(DKM_st.res === R && R.g === G && !R.lock && rs && rs.classList.contains('on')) dkmResNav(R.online ? 'home' : 'room');
  }, DKM_OK_AUTO_MS));
}

/* ══════════ 初期化 ══════════ */
(function(){
  try{
    /* TIPS は const なので中身だけ入れ替える（日本版の言い回し・今のルールに書き直した版。C28） */
    if(typeof TIPS !== 'undefined' && TIPS && TIPS.splice) TIPS.splice.apply(TIPS, [0, TIPS.length].concat(DKM_TIPS));
    /* G03：JING.play に 'lose' を足す（JING は最初のクリックで ac() が dvJingle から作るので、作る関数を包む） */
    if(typeof dvJingle === 'function' && !dvJingle.dkmWrap){
      var DKM_j0 = dvJingle;
      dvJingle = function(){ return dkmPatchJing(DKM_j0.apply(this, arguments)); };
      dvJingle.dkmWrap = true;
    }
    if(typeof JING !== 'undefined' && JING) dkmPatchJing(JING);
    /* ガラスの割れる音・花火の打ち上げを SFX に足す */
    if(typeof SFX === 'object' && SFX){
      if(!SFX.glass) SFX.glass = function(){ try{ dkmGlassSfx(); }catch(e){} };
      if(!SFX.firework) SFX.firework = function(){ try{ dkmFireSfx(); }catch(e){} };
    }
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
  }catch(e){ console.error('[WP15b]', e); }
})();
