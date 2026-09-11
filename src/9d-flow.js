
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 対戦前フロー（9d-flow.js / WP3）
   ──────────────────────────────────────────────────────────────
   本家どおり「クラス選択 #dkclass → マップ選択 #setup → ゲームルーム #room」
   を別々の画面にする。どの画面からも「戻る」で1つ前へ戻れる。
   ・宣言する関数：dkFlowStart dkFlowClass dkFlowMap dkFlowRoom dkClassOf
     launch roomPhase pickPhase renderMaps renderSeats（ほかは dkf* の内部関数）
   ・トップレベルの値は var（4-game.js の読み込み中に renderMaps/renderSeats が
     呼ばれるので、const/let だと一時的な死角で即エラーになる）。
   ・DOM に触る初期化は最後の IIFE の中だけ。
   ══════════════════════════════════════════════════════════════ */

/* クラス（開始資金・報酬倍率・解放Lv。数字は当作独自） */
var DKF_CLASSES = [
  { id:'eco',   nm:'エコノミー',   en:'Economy Class',  cash:10000000, x:1,   lv:1 },
  { id:'biz',   nm:'ビジネス',     en:'Business Class', cash:15000000, x:1.5, lv:2 },
  { id:'first', nm:'ファースト',   en:'First Class',    cash:20000000, x:2,   lv:4 },
  { id:'dia',   nm:'ダイヤモンド', en:'Diamond Class',  cash:30000000, x:3,   lv:7 }
];
var DKF_TURNS = [[12,'12'], [20,'20'], [30,'30']];
var DKF_TIMES = [[0,'なし'], [900,'15'], [1200,'20'], [1500,'25']];
var DKF_AIS   = [[0,'よわい'], [1,'ふつう'], [2,'つよい']];
var DKF_CPU_NM = ['ガル', 'リノ', 'ゼニ'];
var DKF_TOP3 = ['dice', 'salary', 'double'];        // おすすめアイテム（本家の並び）
var DKF_MAGIC = { rand:'warp', angel:'angel' };      // 魔法アイテム（ランダムカード／天使カード）
var DKF_ANGEL_GEM = 5;
/* 画面の状態（セーブしない） */
var DKF_S = { busy:false, roomRes:null, roomWait:false, slots:null, mapSig:'', drag:null, tick:0 };

/* ══════════ 小さな道具 ══════════ */
function dkfEsc(s){ return (typeof esc === 'function') ? esc(s) : String(s); }
function dkfLv(){ return (typeof SV === 'object' && SV && SV.lv) ? (SV.lv | 0) || 1 : 1; }
function dkfMan(n){ return Math.round(n / 10000).toLocaleString() + '万'; }
function dkfMap(id){
  var L = (typeof MAPS !== 'undefined' && MAPS) ? MAPS : [];
  for(var i = 0; i < L.length; i++) if(L[i].id === id) return L[i];
  return L[0];
}
function dkfNear(list, v){          // 選べる値のうち一番近いもの
  var best = list[0][0], d = 1e18;
  list.forEach(function(o){ var k = Math.abs(o[0] - (+v || 0)); if(k < d){ d = k; best = o[0]; } });
  return best;
}
function dkfClsOk(id){              // Lv が足りないクラスはエコノミーに戻す
  var c = dkClassOf(id);
  return (dkfLv() >= c.lv) ? c.id : 'eco';
}
function dkfMyName(){ return (typeof SV === 'object' && SV && SV.name) ? String(SV.name) : 'あなた'; }
function dkfSnd(n){ try{ if(typeof SFX === 'object' && SFX && SFX[n]) SFX[n](); }catch(e){} }
function dkfToast(ic, t, s, ms){ try{ toast('R', ic, t, s, ms || 2400); }catch(e){} }
function dkfOnlineOk(){
  return !!(window.DV_OL && window.DV_OL.lib && window.DV_OL_API && typeof window.DV_OL_API.open === 'function');
}

/* 自作の小さな絵（SVG）。絵文字に頼らない */
function dkfSvg(kind){
  if(kind === 'plane') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M60 29c0-2.2-1.8-3.4-4-3.4H41.2L27.6 6.3h-5.9l6.6 19.3H15.8l-5-6.3H6.4l3.3 12.7-3.3 12.7h4.4l5-6.3h12.5L21.7 57.7h5.9l13.6-19.3H56c2.2 0 4-1.2 4-3.4z"/></svg>';
  if(kind === 'house') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M32 7 4 31h8v25h15V40h10v16h15V31h8z"/><path fill="rgba(0,0,0,.25)" d="M27 40h10v16H27z"/></svg>';
  if(kind === 'lock') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="7" d="M20 29v-8a12 12 0 0 1 24 0v8"/><rect x="11" y="28" width="42" height="30" rx="7" fill="currentColor"/><circle cx="32" cy="41" r="4.5" fill="rgba(0,0,0,.45)"/><path d="M30 43h4v8h-4z" fill="rgba(0,0,0,.45)"/></svg>';
  if(kind === 'globe') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="5"/><path fill="none" stroke="currentColor" stroke-width="4" d="M6 32h52M32 6c-9 8-9 44 0 52M32 6c9 8 9 44 0 52M11 18h42M11 46h42"/></svg>';
  if(kind === 'left') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M42 8 16 32l26 24 6-6-19.5-18L48 14z"/></svg>';
  if(kind === 'right') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M22 8 48 32 22 56l-6-6 19.5-18L16 14z"/></svg>';
  if(kind === 'check') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M6 34l9-9 11 11L50 10l9 9-33 34z"/></svg>';
  if(kind === 'megaphone') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M8 26h10l26-14v40L18 38H8z"/><path fill="currentColor" d="M18 38l5 16h8l-4-16z" opacity=".75"/><path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" d="M50 22c4 4 4 16 0 20M55 16c7 8 7 24 0 32"/></svg>';
  if(kind === 'pen') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M44 6l14 14-30 30-17 4 4-17z"/><path fill="rgba(0,0,0,.3)" d="M15 37l12 12-10 3-5-5z"/></svg>';
  if(kind === 'card') return '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="5" width="40" height="54" rx="6" fill="currentColor"/><rect x="18" y="11" width="28" height="42" rx="3" fill="rgba(0,0,0,.28)"/><path fill="currentColor" d="M32 20l4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1z" opacity=".9"/></svg>';
  return '';
}
/* 自作の街並みシルエット（搭乗券の背景） */
function dkfSkyline(){
  return '<svg class="dkf-sky" viewBox="0 0 340 170" preserveAspectRatio="none" aria-hidden="true">'
    + '<path fill="currentColor" d="M0 170V118h14V96h10v22h8V70h18v48h6V88h12v-24l8-10 8 10v54h10V58h6V40h8v18h6v60h8V92h16v26h6V74h22v44h8V98h10V62l7-9 7 9v56h8V84h14v34h10V104h14V92h10v26h18v52z"/>'
    + '<path fill="currentColor" opacity=".55" d="M0 170v-28h22v-12h16v18h14v-24h20v26h18v-14h24v20h16v-30h14v30h20v-18h22v22h18v-26h16v26h20v-16h18v18h22v-10h14v42z"/></svg>';
}
/* 魔法・おすすめアイテムの絵（自作 SVG） */
function dkfItemArt(id){
  if(id === 'dice') return '<svg class="dkf-art" viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="dkfDw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#C9CED6"/></linearGradient></defs><rect x="18" y="20" width="58" height="58" rx="13" fill="url(#dkfDw)" stroke="#6A5A40" stroke-width="3" transform="rotate(-10 47 49)"/><g fill="#3A2C1A" transform="rotate(-10 47 49)"><circle cx="33" cy="35" r="5.5"/><circle cx="47" cy="49" r="5.5"/><circle cx="61" cy="63" r="5.5"/></g><path fill="#F2C230" stroke="#7A5206" stroke-width="2" d="M72 8l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/></svg>';
  if(id === 'salary') return '<svg class="dkf-art" viewBox="0 0 96 96" aria-hidden="true"><rect x="10" y="34" width="62" height="36" rx="5" fill="#5FAE48" stroke="#2E6A1C" stroke-width="3" transform="rotate(-8 41 52)"/><rect x="18" y="26" width="62" height="36" rx="5" fill="#7CCB5A" stroke="#2E6A1C" stroke-width="3"/><circle cx="49" cy="44" r="10" fill="#B8E89A" stroke="#2E6A1C" stroke-width="2.5"/><text x="70" y="88" font-family="Arial Black,Arial,sans-serif" font-size="30" font-weight="900" fill="#E0301C" stroke="#fff" stroke-width="5" paint-order="stroke fill" text-anchor="middle">×2</text></svg>';
  if(id === 'double') return '<svg class="dkf-art" viewBox="0 0 96 96" aria-hidden="true"><rect x="8" y="30" width="44" height="44" rx="10" fill="#fff" stroke="#6A5A40" stroke-width="3" transform="rotate(-14 30 52)"/><rect x="44" y="22" width="44" height="44" rx="10" fill="#fff" stroke="#6A5A40" stroke-width="3" transform="rotate(12 66 44)"/><g fill="#C9302C"><circle cx="22" cy="44" r="4.5"/><circle cx="37" cy="59" r="4.5"/><circle cx="58" cy="34" r="4.5"/><circle cx="73" cy="52" r="4.5"/></g></svg>';
  if(id === 'angel') return '<svg class="dkf-art" viewBox="0 0 96 96" aria-hidden="true"><path fill="#FFF7DC" stroke="#C8952F" stroke-width="3" d="M46 50C30 28 12 30 6 44c10-2 18 2 22 10-8-2-14 2-16 8 10-4 22 0 30-4zM50 50c16-22 34-20 40-6-10-2-18 2-22 10 8-2 14 2 16 8-10-4-22 0-30-4z"/><ellipse cx="48" cy="22" rx="16" ry="5" fill="none" stroke="#F2C230" stroke-width="4"/><circle cx="48" cy="54" r="9" fill="#F2C230" stroke="#7A5206" stroke-width="2.5"/></svg>';
  if(id === 'warp') return '<svg class="dkf-art" viewBox="0 0 96 96" aria-hidden="true"><rect x="20" y="8" width="56" height="80" rx="9" fill="#2E8BE0" stroke="#EAF6FF" stroke-width="4"/><path fill="none" stroke="#EAF6FF" stroke-width="5" stroke-linecap="round" d="M48 48m-4 0a4 4 0 1 1 8 0a9 9 0 1 1-18 0a14 14 0 1 1 28 0a19 19 0 1 1-38 0"/></svg>';
  return '<svg class="dkf-art" viewBox="0 0 96 96" aria-hidden="true"><rect x="22" y="10" width="52" height="76" rx="9" fill="#4A3517" stroke="#E0AE3A" stroke-width="4"/><text x="48" y="62" font-family="Arial Black,Arial,sans-serif" font-size="40" font-weight="900" fill="#F5D36B" text-anchor="middle">?</text></svg>';
}

/* ══════════ §6 契約：クラス ══════════ */
function dkClassOf(id){
  var L = (typeof DKF_CLASSES !== 'undefined' && DKF_CLASSES) ? DKF_CLASSES : null;
  if(!L) return { id:'eco', nm:'エコノミー', en:'Economy Class', cash:10000000, x:1, lv:1 };
  for(var i = 0; i < L.length; i++) if(L[i].id === id) return Object.assign({}, L[i]);
  return Object.assign({}, L[0]);
}

/* セーブ（SV.cls / SV.rules / SV.lastMap）→ cfg */
function dkfSyncCfg(){
  if(typeof SV !== 'object' || !SV || typeof cfg !== 'object') return;
  var c = dkClassOf(dkfClsOk(SV.cls));
  cfg.cls = c.id; cfg.cash = c.cash;
  var r = SV.rules || {};
  cfg.turns = dkfNear(DKF_TURNS, r.turns == null ? 12 : r.turns);
  cfg.timeLimit = dkfNear(DKF_TIMES, r.timeLimit == null ? 1200 : r.timeLimit);
  cfg.ai = dkfNear(DKF_AIS, r.ai == null ? 1 : r.ai);
  var m = dkfMap(SV.lastMap); if(m) cfg.mapId = m.id;
}
/* cfg → セーブ */
function dkfSaveMeta(){
  if(typeof SV !== 'object' || !SV) return;
  SV.rules = Object.assign({}, SV.rules || {}, { turns:cfg.turns, timeLimit:cfg.timeLimit, ai:cfg.ai });
  SV.cls = cfg.cls || 'eco';
  SV.lastMap = cfg.mapId;
  try{ saveNow(); }catch(e){}
}

/* ══════════ 入口（ホームの［入場する］） ══════════ */
function dkFlowStart(){
  dkfSyncCfg();
  dkFlowClass();
}

/* ══════════════════════════════════════════════════════════════
   ③ クラス選択 #dkclass（本家の搭乗券を自作の意匠で）
   ══════════════════════════════════════════════════════════════ */
function dkfTop(opt){
  return '<div class="dkf-top">'
    + '<div class="dkback" data-dkf-go="' + opt.back + '" data-fx="pop" title="もどる"></div>'
    + '<div class="dkf-ttl" data-fx="pop">' + opt.title + '</div>'
    + (opt.right || '')
    + '</div>';
}
function dkfPassHTML(c, lv, cur){
  var lock = lv < c.lv;
  return '<div class="dkf-pass dkf-t-' + c.id + (lock ? ' dkf-lock' : '') + (cur ? ' dkf-cur' : '') + '"'
    + ' role="button" data-dkf-cls="' + c.id + '" data-fx="deal">'
    + '<div class="dkf-pass-body">'
    + '<div class="dkf-pp">'
    +   '<i class="dkf-pp-glow fx-deco"></i>'
    +   '<span class="dkf-pp-sky fx-deco">' + dkfSkyline() + '</span>'
    +   '<div class="dkf-pp-hd"><b>' + c.nm + '</b><span class="dkf-pp-plane">' + dkfSvg('plane') + '</span></div>'
    +   '<div class="dkf-pp-en fx-deco">' + c.en + '</div>'
    +   '<div class="dkf-pp-amt"><b>' + dkfMan(c.cash) + '</b><small>スタート資金</small></div>'
    +   '<div class="dkf-pp-play">ゲームプレイ</div>'
    +   '<i class="fx-gloss dkf-pp-gloss"></i>'
    + '</div>'
    + '<div class="dkf-pb">'
    +   '<span class="dkf-pb-rw"><i class="dkf-coin"></i>報酬 ×' + c.x + '</span>'
    +   '<span class="dkf-pb-lv">' + (c.lv <= 1 ? 'だれでも' : 'Lv' + c.lv + 'から') + '</span>'
    + '</div>'
    + '</div>'
    + (cur && !lock ? '<span class="dkf-pass-tag">前回</span>' : '')
    + (lock ? '<div class="dkf-pass-lock"><span class="dkf-lockic">' + dkfSvg('lock') + '</span>'
            + '<b>Lv' + c.lv + 'で解放</b><small>あと ' + (c.lv - lv) + ' レベル</small></div>' : '')
    + '</div>';
}
function dkFlowClass(){
  var lv = dkfLv(), cur = dkfClsOk((typeof SV === 'object' && SV) ? SV.cls : 'eco');
  var need = 60 + lv * 40, exp = (SV && SV.exp) || 0;
  var nextC = DKF_CLASSES.filter(function(c){ return c.lv > lv; })[0];
  var el = dkMake('dkclass', 'quest',
      dkfTop({ back:'home', title:'<b>クラス選択</b>',
        right:'<div class="dkf-home" role="button" data-dkf-go="home" data-fx="pop" title="ホーム">' + dkfSvg('house') + '</div>' })
    + '<div class="dkf-sub">'
    +   '<div class="dkf-olbtn" role="button" id="dkfOnline" data-fx="riseL" data-fx-press>'
    +     '<span class="dkf-olbtn-ic">' + dkfSvg('globe') + '</span>'
    +     '<span class="dkf-olbtn-tx"><b>オンライン対戦</b><small>ともだちと通信で遊ぶ</small></span></div>'
    +   '<div class="dkf-lvbox" data-fx="riseR">'
    +     '<span class="dkf-lvbox-lv"><small>Lv</small><b>' + lv + '</b></span>'
    +     '<span class="dkf-lvbox-tx"><b>' + (nextC ? ('Lv' + nextC.lv + 'で「' + nextC.nm + '」が開きます')
                                              : 'すべてのクラスが開いています') + '</b>'
    +       '<span class="dkf-lvbar"><i style="transform:scaleX(' + Math.min(1, exp / need).toFixed(3) + ')"></i></span></span>'
    +   '</div>'
    + '</div>'
    + '<div class="dkf-passes" data-fx-step="70">'
    +   DKF_CLASSES.map(function(c){ return dkfPassHTML(c, lv, c.id === cur); }).join('')
    + '</div>'
    + (typeof walletHTML === 'function' ? walletHTML() : ''));
  el.classList.add('dkf-scr', 'dkf-cls');
  dkfWireNav(el);
  el.querySelectorAll('[data-dkf-cls]').forEach(function(b){
    b.onclick = function(){ dkfPickClass(b.getAttribute('data-dkf-cls'), b); };
  });
  var ol = el.querySelector('#dkfOnline');
  if(ol) ol.onclick = dkfOnline;
  screenTo('dkclass');
  return el;
}
function dkfPickClass(id, node){
  var c = dkClassOf(id), lv = dkfLv();
  if(lv < c.lv){
    dkfSnd('warn');
    try{ fxShake(node, 260); }catch(e){}
    dkfToast('🔒', c.nm + 'は Lv' + c.lv + 'で解放', 'いまは Lv' + lv + '。対戦して経験値をためよう', 2600);
    return false;
  }
  dkfSnd('click');
  cfg.cls = c.id; cfg.cash = c.cash;
  if(typeof SV === 'object' && SV){ SV.cls = c.id; try{ saveNow(); }catch(e){} }
  try{ fxBurst(node, { kind:'star', n:16, power:0.9 }); }catch(e){}
  dkFlowMap();
  return true;
}
function dkfOnline(){
  if(dkfOnlineOk()){ dkfSnd('click'); try{ ac(); }catch(e){} window.DV_OL_API.open(); return; }
  dkfSnd('warn');
  dkfToast('🌐', 'オンライン対戦は使えません', window.claude
    ? 'この版では通信できません。index.html 版なら遊べます'
    : '通信の部品を読み込めませんでした。ネットにつないで開き直してください', 3000);
}
/* ══════════════════════════════════════════════════════════════
   ④ マップ選択 #setup（カルーセル＋クイックスタート＋ゲームルーム生成）
   ══════════════════════════════════════════════════════════════ */
/* マップの色（lake・slab）で菱形の盤を描く。乱数は使わない */
function dkfDrawBoard(cv, map){
  if(!cv || !cv.getContext || !map) return;
  var g = cv.getContext('2d'), W = cv.width, H = cv.height;
  var cx = W / 2, cy = H * 0.40, A = W * 0.40, B = A * 0.5, D = 24, w = 0.17, L = (1 - 2 * w) / 7;
  var P = function(u, v){ return [cx + (u - v) * A, cy - B + (u + v) * B]; };
  var poly = function(pts, fill, stroke, lw){
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for(var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    if(fill){ g.fillStyle = fill; g.fill(); }
    if(stroke){ g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
  };
  var quad = function(u0, u1, v0, v1){ return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]; };
  g.clearRect(0, 0, W, H);
  /* 影 */
  var sh = g.createRadialGradient(cx, cy + B + D, 10, cx, cy + B + D, A * 1.05);
  sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.beginPath(); g.ellipse(cx, cy + B * 0.72 + D, A * 1.02, B * 0.62, 0, 0, Math.PI * 2); g.fill();
  /* 厚み（左右の側面） */
  var l = P(0, 1), b = P(1, 1), r = P(1, 0);
  poly([l, b, [b[0], b[1] + D], [l[0], l[1] + D]], map.slab.side);
  poly([b, r, [r[0], r[1] + D], [b[0], b[1] + D]], map.slab.side);
  poly([b, r, [r[0], r[1] + D], [b[0], b[1] + D]], 'rgba(255,255,255,.14)');
  poly([l, b, [b[0], b[1] + D], [l[0], l[1] + D]], 'rgba(0,0,0,.18)');
  /* 盤の天面 */
  var top = g.createLinearGradient(0, cy - B, 0, cy + B);
  top.addColorStop(0, map.slab.rim); top.addColorStop(1, map.slab.top);
  poly(quad(0, 1, 0, 1), top, map.slab.rim, 3);
  /* 湖（中央の水面） */
  var lk = g.createRadialGradient(cx, cy, 6, cx, cy, A * 0.6);
  lk.addColorStop(0, map.lake[0]); lk.addColorStop(0.55, map.lake[1]); lk.addColorStop(1, map.lake[2]);
  poly(quad(w, 1 - w, w, 1 - w), lk, 'rgba(255,255,255,.55)', 2);
  g.save();
  g.globalAlpha = 0.35; g.strokeStyle = '#fff'; g.lineWidth = 2;
  [[0.36, 0.44], [0.55, 0.52], [0.46, 0.66]].forEach(function(o){
    var p = P(o[0], o[1]); g.beginPath(); g.ellipse(p[0], p[1], 34, 7, 0, 0, Math.PI * 2); g.stroke();
  });
  g.restore();
  /* テーマの飾り（氷＝結晶／世界＝大陸／大分＝湯けむり） */
  if(map.deco === 'ice'){
    [[0.4, 0.42, 1], [0.58, 0.47, 0.8], [0.47, 0.6, 0.65]].forEach(function(o){
      var p = P(o[0], o[1]), s = 30 * o[2];
      poly([[p[0], p[1] - s * 1.6], [p[0] + s * 0.42, p[1] - s * 0.3], [p[0], p[1] + s * 0.15], [p[0] - s * 0.42, p[1] - s * 0.3]], '#EAFBFF', '#6FC3D8', 2);
      poly([[p[0], p[1] - s * 1.6], [p[0] + s * 0.42, p[1] - s * 0.3], [p[0], p[1] + s * 0.15]], 'rgba(90,170,210,.45)');
    });
  } else if(map.deco === 'world'){
    g.fillStyle = '#6DA83F'; g.strokeStyle = '#3E6A1C'; g.lineWidth = 2;
    [[0.42, 0.44, 40, 16], [0.58, 0.56, 30, 12]].forEach(function(o){
      var p = P(o[0], o[1]); g.beginPath(); g.ellipse(p[0], p[1], o[2], o[3], -0.3, 0, Math.PI * 2); g.fill(); g.stroke();
    });
    g.strokeStyle = 'rgba(255,236,160,.9)'; g.lineWidth = 3; g.setLineDash([6, 6]);
    var a = P(0.42, 0.44), c = P(0.58, 0.56);
    g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + c[0]) / 2, a[1] - 60, c[0], c[1]); g.stroke();
    g.setLineDash([]);
  } else {
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.lineCap = 'round';
    [0.42, 0.5, 0.58].forEach(function(u, i){
      var p = P(u, 1 - u);
      g.beginPath(); g.moveTo(p[0], p[1]);
      g.bezierCurveTo(p[0] - 14, p[1] - 18, p[0] + 14, p[1] - 30, p[0], p[1] - 48 - i * 4); g.stroke();
    });
    g.fillStyle = '#8E7A57';
    [[0.4, 0.62], [0.62, 0.4]].forEach(function(o){ var p = P(o[0], o[1]); g.beginPath(); g.ellipse(p[0], p[1], 16, 7, 0, 0, Math.PI * 2); g.fill(); });
  }
  /* マス（32） */
  var grp = {};
  (typeof CITY_SLOTS !== 'undefined' ? CITY_SLOTS : []).forEach(function(s, gi){ s.forEach(function(i){ grp[i] = gi; }); });
  var sp = (typeof SPECIAL !== 'undefined') ? SPECIAL : {};
  var gc = (typeof GCOL !== 'undefined') ? GCOL : ['#79CDBD'];
  var e = 0.006;
  for(var i = 0; i < 32; i++){
    var s = (i / 8) | 0, k = i % 8, q;
    if(k === 0){
      q = s === 0 ? quad(1 - w, 1, 1 - w, 1) : s === 1 ? quad(0, w, 1 - w, 1) : s === 2 ? quad(0, w, 0, w) : quad(1 - w, 1, 0, w);
    } else {
      var a0 = w + (k - 1) * L, a1 = w + k * L;
      q = s === 0 ? quad(1 - a1, 1 - a0, 1 - w, 1) : s === 1 ? quad(0, w, 1 - a1, 1 - a0)
        : s === 2 ? quad(a0, a1, 0, w) : quad(1 - w, 1, a0, a1);
    }
    /* 少し内側へ寄せて隙間を作る */
    var mx = (q[0][0] + q[2][0]) / 2, my = (q[0][1] + q[2][1]) / 2;
    q = q.map(function(p){ return [p[0] + (mx - p[0]) * e * 14, p[1] + (my - p[1]) * e * 14]; });
    var col;
    if(k === 0) col = '#FFE9A8';
    else if(grp[i] !== undefined) col = gc[grp[i] % gc.length];
    else if(sp[i] === 'tax') col = '#CFC6B4';
    else if(sp[i] === 'bonus') col = '#FFD24D';
    else col = '#F4EEDC';
    poly(q, col, 'rgba(40,30,20,.35)', 1.2);
    if(k === 0){
      var cc = [mx, my];
      g.fillStyle = '#C8952F'; g.beginPath(); g.ellipse(cc[0], cc[1], 13, 7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFF7DC'; g.beginPath(); g.ellipse(cc[0], cc[1] - 2, 7, 3.5, 0, 0, Math.PI * 2); g.fill();
    } else if(grp[i] !== undefined && (i % 3 === 1)){
      /* 小さな建物 */
      var hx = mx, hy = my - 3, hs = 7;
      poly([[hx - hs, hy], [hx, hy + hs * 0.5], [hx, hy - hs], [hx - hs, hy - hs * 1.5]], 'rgba(255,255,255,.92)');
      poly([[hx, hy + hs * 0.5], [hx + hs, hy], [hx + hs, hy - hs * 1.5], [hx, hy - hs]], 'rgba(210,214,222,.95)');
      poly([[hx - hs, hy - hs * 1.5], [hx, hy - hs], [hx + hs, hy - hs * 1.5], [hx, hy - hs * 2.4]], gc[grp[i] % gc.length], 'rgba(0,0,0,.35)', 1);
    }
  }
}
function dkfEmblem(map){
  if(map.deco === 'ice') return '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#EAFBFF" stroke-width="5" stroke-linecap="round" fill="none"><path d="M32 6v52M9 19l46 26M9 45l46-26"/><path d="M24 10l8 8 8-8M24 54l8-8 8 8M8 29l11 3-3 11M56 35l-11-3 3-11M8 35l11-3-3-11M56 29l-11 3 3 11"/></g></svg>';
  if(map.deco === 'world') return dkfSvg('globe');
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="50" rx="24" ry="8" fill="none" stroke="#fff" stroke-width="5"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M20 40c-6-8 6-12 0-22M32 40c-6-8 6-12 0-24M44 40c-6-8 6-12 0-22"/></g></svg>';
}
function dkfMapCardHTML(m, i){
  var hot = (m.cities && m.cities[m.cities.length - 1]) ? m.cities[m.cities.length - 1].join('・') : '';
  return '<div class="dkf-mcard" role="button" data-dkf-map="' + m.id + '" data-dkf-i="' + i + '"'
    + ' style="--dkf-l0:' + m.lake[0] + ';--dkf-l1:' + m.lake[1] + ';--dkf-l2:' + m.lake[2]
    + ';--dkf-st:' + m.slab.top + ';--dkf-ss:' + m.slab.side + '">'
    + '<div class="dkf-mc-fr"><div class="dkf-mc-in">'
    +   '<canvas class="dkf-mcv" width="640" height="380"></canvas>'
    +   '<span class="dkf-mc-emb">' + dkfEmblem(m) + '</span>'
    +   m.corners.map(function(c, k){ return '<span class="dkf-cn dkf-cn' + k + '">' + dkfEsc(c) + '</span>'; }).join('')
    +   '<div class="dkf-mc-nm"><b>' + dkfEsc(m.name) + '</b><i>' + dkfEsc(m.sub) + '</i></div>'
    +   '<div class="dkf-mc-hot"><em>目玉</em><span>' + dkfEsc(hot) + '</span></div>'
    +   '<i class="fx-gloss dkf-mc-gloss"></i>'
    + '</div></div>'
    + '<div class="dkf-mc-shade"></div>'
    + '</div>';
}
function dkfMapSig(){ return (cfg.cls || '') + '|' + (cfg.mapId || ''); }
function dkfBuildMap(){
  var c = dkClassOf(cfg.cls), w = (typeof thisWeek === 'function') ? thisWeek() : null;
  var el = dkMake('setup', 'quest',
      dkfTop({ back:'class',
        title:'<b>' + c.nm + '</b><span class="dkf-plate">' + dkfMan(c.cash) + '</span>',
        right:'<div class="dkf-home" role="button" data-dkf-go="home" data-fx="pop" title="ホーム">' + dkfSvg('house') + '</div>' })
    + '<div class="dkf-ticker" data-fx="rise"><span class="dkf-tk-ic">' + dkfSvg('megaphone') + '</span>'
    +   '<div class="dkf-tk-box"><b class="dkf-tk-tx">' + (w ? ('今週のイベント：' + dkfEsc(w.nm) + ' — ' + dkfEsc(w.ds)) : '') + '</b></div></div>'
    + '<div class="dkf-stagebox">'
    +   '<div class="dkf-carousel">' + MAPS.map(dkfMapCardHTML).join('') + '</div>'
    +   '<div class="dkf-arrow dkf-arrow-l" role="button" data-dkf-step="-1" data-fx="pop" title="前のマップ">' + dkfSvg('left') + '</div>'
    +   '<div class="dkf-arrow dkf-arrow-r" role="button" data-dkf-step="1" data-fx="pop" title="次のマップ">' + dkfSvg('right') + '</div>'
    +   '<div class="dkf-dots">' + MAPS.map(function(m, i){ return '<i data-dkf-dot="' + i + '"></i>'; }).join('') + '</div>'
    + '</div>'
    + '<div class="dkf-mapfoot">'
    +   '<div class="dkf-quick" role="button" id="dkfQuick" data-fx="riseL" data-fx-press>'
    +     '<b>クイックスタート</b><small>CPU3人とすぐ対戦</small></div>'
    +   '<div class="dkf-mkroom fx-primary green" role="button" id="dkfMkRoom" data-fx="riseR" data-fx-press>'
    +     '<span class="dkf-mkroom-ic">' + dkfSvg('card') + '</span>'
    +     '<span class="dkf-mkroom-tx"><b>ゲームルーム生成</b><small>ルールと席を決めてあそぶ</small></span></div>'
    + '</div>'
    + (typeof walletHTML === 'function' ? walletHTML() : ''));
  el.classList.add('dkf-scr', 'dkf-map', 'dkf-t-' + c.id);
  el.setAttribute('data-fx-step', '60');
  dkfWireNav(el);
  el.querySelectorAll('.dkf-mcard').forEach(function(card){
    var m = dkfMap(card.getAttribute('data-dkf-map'));
    try{ dkfDrawBoard(card.querySelector('canvas'), m); }catch(e){ console.error('[WP3] board', e); }
  });
  el.querySelectorAll('[data-dkf-step]').forEach(function(b){
    b.onclick = function(){ dkfStepMap(+b.getAttribute('data-dkf-step')); };
  });
  var car = el.querySelector('.dkf-carousel');
  car.addEventListener('pointerdown', function(e){ DKF_S.drag = { x:e.clientX, y:e.clientY, moved:false }; });
  car.addEventListener('pointerup', function(e){
    var d = DKF_S.drag; if(!d) return;
    var dx = e.clientX - d.x;
    if(Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(e.clientY - d.y)){ d.moved = true; dkfStepMap(dx < 0 ? 1 : -1); }
  });
  car.addEventListener('pointercancel', function(){ DKF_S.drag = null; });
  car.addEventListener('click', function(e){
    var d = DKF_S.drag; DKF_S.drag = null;
    if(d && d.moved) return;
    var card = e.target.closest ? e.target.closest('.dkf-mcard') : null;
    if(!card) return;
    if(card.classList.contains('dkf-p0')){ dkfSnd('click'); dkfLand(card); return; }
    dkfGoMap(+card.getAttribute('data-dkf-i'));
  });
  var q = el.querySelector('#dkfQuick'); if(q) q.onclick = dkfQuick;
  var mk = el.querySelector('#dkfMkRoom'); if(mk) mk.onclick = function(){ dkfSnd('click'); try{ ac(); }catch(e){} launch({ room:true }); };
  try{ fxRays(el.querySelector('.dkf-stagebox'), { tone:'gold' }); }catch(e){}
  DKF_S.mapSig = dkfMapSig();
  renderMaps();
  return el;
}
function dkFlowMap(){
  dkfBuildMap();
  screenTo('setup');
}
/* カルーセルの並び（中央＝cfg.mapId）を反映する。画面ができる前は何もしない */
function renderMaps(){
  var el = document.getElementById('setup');
  var car = el && el.querySelector ? el.querySelector('.dkf-carousel') : null;
  if(!car || typeof MAPS === 'undefined') return;
  var n = MAPS.length, ci = Math.max(0, MAPS.findIndex(function(m){ return m.id === cfg.mapId; }));
  car.querySelectorAll('.dkf-mcard').forEach(function(card){
    var i = +card.getAttribute('data-dkf-i'), p = ((i - ci) % n + n) % n;
    var pos = p === 0 ? 'dkf-p0' : (p === 1 ? 'dkf-pr' : (p === n - 1 ? 'dkf-pl' : 'dkf-ph'));
    card.classList.remove('dkf-p0', 'dkf-pl', 'dkf-pr', 'dkf-ph');
    card.classList.add(pos);
    card.setAttribute('aria-current', p === 0 ? 'true' : 'false');
  });
  el.querySelectorAll('[data-dkf-dot]').forEach(function(d){ d.classList.toggle('on', +d.getAttribute('data-dkf-dot') === ci); });
}
function dkfGoMap(i){
  if(typeof MAPS === 'undefined' || !MAPS[i]) return;
  if(MAPS[i].id === cfg.mapId) return;
  cfg.mapId = MAPS[i].id;
  if(typeof SV === 'object' && SV){ SV.lastMap = cfg.mapId; try{ saveNow(); }catch(e){} }
  DKF_S.mapSig = dkfMapSig();
  dkfSnd('click');
  renderMaps();
  var el = document.getElementById('setup');
  var card = el && el.querySelector('.dkf-mcard.dkf-p0');
  if(card) dkfLand(card);
}
function dkfStepMap(d){
  if(typeof MAPS === 'undefined') return;
  var n = MAPS.length, ci = Math.max(0, MAPS.findIndex(function(m){ return m.id === cfg.mapId; }));
  dkfGoMap(((ci + d) % n + n) % n);
}
function dkfLand(card){
  card.classList.remove('dkf-land'); void card.offsetWidth; card.classList.add('dkf-land');
  clearTimeout(card._dkfT); card._dkfT = setTimeout(function(){ card.classList.remove('dkf-land'); }, 520);
}
/* 流れる案内（今週のイベント ⇄ 切り替えの時刻）。画面が変わると dkEvery が止める */
function dkfTickerStart(){
  var el = document.getElementById('setup'); if(!el) return;
  var box = el.querySelector('.dkf-tk-box'); if(!box || typeof thisWeek !== 'function') return;
  var w = thisWeek();
  var lines = ['今週のイベント：' + w.nm + ' — ' + w.ds,
    '毎週 月曜 朝6時にイベントが変わります（のこり ' + (typeof weekEndsIn === 'function' ? weekEndsIn() : '') + '）'];
  DKF_S.tick = 0;
  try{
    dkEvery('dkfTicker', function(){
      var b = box.querySelector('.dkf-tk-tx'); if(!b || !b.isConnected){ dkEvery('dkfTicker', null); return; }
      DKF_S.tick = (DKF_S.tick + 1) % lines.length;
      b.textContent = lines[DKF_S.tick];
      b.classList.remove('dkf-tk-in'); void b.offsetWidth; b.classList.add('dkf-tk-in');
    }, 5200);
  }catch(e){}
}
/* クイックスタート：あなた＋CPU3人・保存済みルールで、部屋を飛ばして始める */
function dkfQuick(){
  if(DKF_S.busy) return;
  dkfSnd('click'); try{ ac(); }catch(e){}
  var r = (typeof SV === 'object' && SV && SV.rules) || {};
  cfg.turns = dkfNear(DKF_TURNS, r.turns == null ? cfg.turns : r.turns);
  cfg.timeLimit = dkfNear(DKF_TIMES, r.timeLimit == null ? cfg.timeLimit : r.timeLimit);
  cfg.ai = dkfNear(DKF_AIS, r.ai == null ? cfg.ai : r.ai);
  cfg.n = 4;
  cfg.seats = [{ name:dkfMyName(), kind:'you', ch:-1, cardId:null }].concat(DKF_CPU_NM.map(function(nm){
    return { name:'CPU ' + nm, kind:'cpu', ch:-1, cardId:null };
  }));
  DKF_S.slots = null;
  launch({ room:false });
}

/* ══════════════════════════════════════════════════════════════
   対戦の開始（二度押し防止つき）
   ══════════════════════════════════════════════════════════════ */
async function launch(opts){
  opts = opts || {};
  if(DKF_S.busy) return false;
  if(opts.room){
    DKF_S.roomWait = true;
    var ok;
    try{ ok = await roomPhase(); } finally { DKF_S.roomWait = false; }
    if(!ok){ dkFlowMap(); return false; }
    if(DKF_S.busy) return false;
  }
  DKF_S.busy = true;
  try{
    if(typeof cfg.speed === 'number' && cfg.speed > 0) SPEED = cfg.speed;
    dkfSaveMeta();
    await pickPhase();
    await vsScreen();
    await loadingPhase();
    await hideAllScreens();
    newGame();
    camReset(); updHUD();
    await dkOrderOnBoard();
    bgm('game');
    var w = thisWeek();
    await band('ゲームスタート！', G.map.name + ' — のこり ' + cfg.turns + ' ターン', 1400);
    await cutIn('THIS WEEK', w.ic + ' ' + w.nm, w.ds);
    turnLoop();
    return true;
  }catch(e){
    console.error('[WP3] launch', e);
    if(!G || G.over !== false) try{ dkFlowMap(); }catch(e2){}
    return false;
  }finally{
    DKF_S.busy = false;
  }
}
function dkFlowRoom(){ return launch({ room:true }); }

/* カードの割り当て（画面は出さない）。あなた＝SV.equip／ともだち＝部屋で選んだ物／CPU＝強さの等級 */
function dkfOwned(id){ return !!(typeof SV === 'object' && SV && SV.cards && SV.cards[id]); }
function dkfTier(){ return cfg.ai === 2 ? ['SS', 'S'] : cfg.ai === 1 ? ['S', 'A'] : ['A']; }
function dkfAssignCards(){
  var n = cfg.n, seats = cfg.seats, taken = {};
  var pool = function(f){ return CARDPOOL.filter(function(c){ return !taken[c.id] && f(c); }); };
  var rnd = function(list){ return list[(Math.random() * list.length) | 0]; };
  for(var i = 0; i < n; i++){
    var s = seats[i]; if(!s || s.kind !== 'you') continue;
    var id = dkfOwned(SV.equip) ? SV.equip : ((typeof ownedCards === 'function' && ownedCards()[0]) || CARDPOOL[0]).id;
    if(taken[id]){ var o = pool(function(c){ return dkfOwned(c.id); })[0] || pool(function(){ return true; })[0]; id = o.id; }
    s.cardId = id; taken[id] = 1;
  }
  for(i = 0; i < n; i++){
    s = seats[i]; if(!s || s.kind !== 'human') continue;
    if(!(s.cardId && !taken[s.cardId] && cardById(s.cardId) && (dkfOwned(s.cardId) || s.trial))){
      var mine = pool(function(c){ return dkfOwned(c.id); });
      var pick = mine[0], tr = false;
      if(!pick){ pick = pool(function(c){ return c.rar === 'A'; })[0] || pool(function(){ return true; })[0]; tr = true; }
      s.cardId = pick.id; s.trial = tr;
    }
    taken[s.cardId] = 1;
  }
  var tier = dkfTier();
  for(i = 0; i < n; i++){
    s = seats[i]; if(!s || s.kind !== 'cpu') continue;
    var cc = s.cardId && cardById(s.cardId);
    if(!(cc && !taken[cc.id] && tier.indexOf(cc.rar) >= 0)){
      var free = pool(function(c){ return tier.indexOf(c.rar) >= 0; });
      if(!free.length) free = pool(function(){ return true; });
      s.cardId = (rnd(free) || CARDPOOL[i % CARDPOOL.length]).id;
    }
    taken[s.cardId] = 1;
  }
}
async function pickPhase(){
  dkfAssignCards();
}

/* ══════════════════════════════════════════════════════════════
   ⑤ ゲームルーム #room（左ページ＝アイテムと装着／右ページ＝ルールと席）
   ══════════════════════════════════════════════════════════════ */
/* cfg → 部屋の4席（1席目はあなた固定。空き席は 🔒） */
function dkfRoomInit(){
  var n = Math.max(1, Math.min(4, (cfg.n | 0) || 1));
  var you = null, rest = [];
  (cfg.seats || []).slice(0, n).forEach(function(s){
    if(!s) return;
    if(s.kind === 'you' && !you) you = s; else rest.push(s);
  });
  if(!you) you = { name:dkfMyName(), kind:'you', ch:-1, cardId:null };
  var slots = [you];
  rest.forEach(function(s){
    if(slots.length >= 4) return;
    if(s.kind !== 'human') s.kind = 'cpu';
    slots.push(s);
  });
  while(slots.length < 4) slots.push({ kind:'lock', name:'', ch:-1, cardId:null });
  slots.forEach(function(s, i){                 // CPU の顔ぶれは部屋を開くたびに引き直す
    if(s.kind !== 'cpu') return;
    s.cardId = null;
    if(!/^CPU/.test(s.name || '')) s.name = 'CPU ' + DKF_CPU_NM[(i + 2) % 3];
  });
  DKF_S.slots = slots;
  dkfSyncSeats();
}
/* 部屋の4席 → cfg.seats（使う席を前に詰める）と cfg.n、カードの割り当て */
function dkfSyncSeats(){
  if(!DKF_S.slots) return;
  var act = DKF_S.slots.filter(function(s){ return s.kind !== 'lock'; });
  var fill = DKF_S.slots.filter(function(s){ return s.kind === 'lock'; }).map(function(){
    return { name:'CPU', kind:'cpu', ch:-1, cardId:null, dkfLock:true };
  });
  cfg.seats = act.concat(fill);
  cfg.n = act.length;
  dkfAssignCards();
}
function roomPhase(){
  return new Promise(function(resolve){
    var done = false;
    DKF_S.roomRes = function(v){ if(done) return; done = true; DKF_S.roomRes = null; resolve(!!v); };
    dkfRoomInit();
    dkfBuildRoom();
    try{ bgm('room'); }catch(e){}
    screenTo('room');
  });
}
function dkfBuildRoom(){
  var c = dkClassOf(cfg.cls), map = dkfMap(cfg.mapId);
  var bgq = (typeof dkU === 'function') ? dkU('bg-quest') : '';
  var el = dkMake('room', 'quest',
      '<div class="dkf-rhd">'
    +   '<div class="dkf-rmap" role="button" data-dkf-go="map" data-fx="pop" title="マップを選びなおす">'
    +     '<span class="dkf-rmap-ic">' + dkfEmblem(map) + '</span><b>' + dkfEsc(map.name) + '</b></div>'
    +   '<div class="dkf-rmode" data-fx="pop"><b>個人戦</b></div>'
    +   '<div class="dkf-rcls" data-fx="pop"><b>' + c.nm + '</b><span class="dkf-plate">' + dkfMan(c.cash) + '</span></div>'
    +   '<div class="dkf-rx" role="button" data-dkf-go="map" data-fx="pop" title="マップ選択へ"><i></i></div>'
    + '</div>'
    + '<div class="dkf-book">'
    +   '<div class="dkf-page dkf-lpage" data-fx="riseL"></div>'
    +   '<i class="dkf-seam fx-deco"></i>'
    +   '<div class="dkf-page dkf-rpage" data-fx="riseR">'
    +     '<div class="dkf-rules"></div>'
    +     '<div class="dkf-seats" data-fx-step="80"></div>'
    +     '<div class="dkf-rfoot">'
    +       '<div class="dkf-add" role="button" id="dkfAdd" data-fx-press><small>ゲーム友だち</small><b>＋追加</b></div>'
    +       '<div class="dkf-go fx-primary" role="button" id="dkfGo" data-fx="pop" data-fx-press><b>ゲームスタート</b><small class="dkf-go-sub"></small></div>'
    +     '</div>'
    +   '</div>'
    +   '<i class="dkf-curl fx-deco"></i>'
    + '</div>'
    + (typeof walletHTML === 'function' ? walletHTML() : ''));
  el.classList.add('dkf-scr', 'dkf-room', 'dkf-t-' + c.id);
  if(bgq) el.style.setProperty('--dk-room-bg', 'url(' + bgq + ')');
  dkfWireNav(el);
  var add = el.querySelector('#dkfAdd');
  if(add) add.onclick = function(){
    if(dkfOnlineOk()){ dkfSnd('click'); window.DV_OL_API.open(); return; }
    dkfSnd('click');
    dkfToast('👥', 'この端末で ともだちと遊べます', '席を押して「ともだち」にすると交代で遊べます', 2800);
    var s = el.querySelector('.dkf-seat.dkf-k-cpu, .dkf-seat.dkf-k-lock');
    if(s) dkfPulse(s);
  };
  var go = el.querySelector('#dkfGo');
  if(go) go.onclick = function(){ dkfRoomStart(go); };
  dkfRenderLeft();
  dkfRenderRules();
  renderSeats();
  return el;
}
function dkfPulse(node){
  node.classList.remove('dkf-pulse'); void node.offsetWidth; node.classList.add('dkf-pulse');
  clearTimeout(node._dkfP); node._dkfP = setTimeout(function(){ node.classList.remove('dkf-pulse'); }, 700);
}
function dkfRoomExit(){
  var r = DKF_S.roomRes;
  if(r && DKF_S.roomWait){ r(false); return; }     // 待っている launch が dkFlowMap() へ戻す
  if(r) r(false);
  dkFlowMap();
}
function dkfRoomStart(node){
  if(cfg.n < 2){
    dkfSnd('warn');
    try{ fxShake(node, 240); }catch(e){}
    dkfToast('👥', '2人から遊べます', '席を押して CPU か ともだちを入れてください', 2600);
    return;
  }
  var r = DKF_S.roomRes;
  if(!r || DKF_S.busy) return;                   // 二度押し
  dkfSnd('click'); try{ ac(); }catch(e){}
  node.classList.add('dkf-going');
  var waiting = DKF_S.roomWait;
  r(true);
  if(!waiting) launch({ room:false });            // roomPhase() を直接開いた時も始められるように
}

/* ── 左ページ：おすすめアイテム・魔法アイテム・装着情報 ── */
function dkfItemTile(id){
  var it = itemById(id); if(!it) return '';
  var g = shopPrice(id), got = SV.bag.indexOf(id) >= 0;
  var no = !got && (SV.bag.length >= BAG_MAX || SV.gold < g);
  return '<div class="dkf-item' + (got ? ' dkf-got' : '') + (no ? ' dkf-no' : '') + '" role="button" data-dkf-buy="' + id + '" data-fx-press>'
    + '<div class="dkf-item-tl">' + dkfItemArt(id) + '<b>' + dkfEsc(it.nm) + '</b>'
    +   (got ? '<span class="dkf-chk">' + dkfSvg('check') + '</span>' : '') + '</div>'
    + '<div class="dkf-price"><i class="dkf-coin"></i><b>' + g.toLocaleString() + '</b></div>'
    + '</div>';
}
function dkfRenderLeft(){
  var room = document.getElementById('room');
  var pg = room && room.querySelector ? room.querySelector('.dkf-lpage') : null;
  if(!pg || typeof SV !== 'object' || !SV) return;
  var mags = SV.bag.filter(function(id){ return id === DKF_MAGIC.rand || id === DKF_MAGIC.angel; });
  var m0 = mags[0] ? itemById(mags[0]) : null;
  var randG = shopPrice(DKF_MAGIC.rand);
  var randGot = SV.bag.indexOf(DKF_MAGIC.rand) >= 0, angGot = SV.bag.indexOf(DKF_MAGIC.angel) >= 0;
  var randNo = !randGot && (SV.bag.length >= BAG_MAX || SV.gold < randG);
  var angNo = !angGot && (SV.bag.length >= BAG_MAX || SV.gem < DKF_ANGEL_GEM);
  var c = cardById(SV.equip) || equippedCard(), o = SV.cards[c.id] || { lv:1 };
  var st = cardStats(c.id, o.lv, SV.slots) || {};
  var img = (typeof dkCharImg === 'function') ? dkCharImg(c.id) : '';
  var die = dieById(SV.die), dlv = (SV.dice && SV.dice[die.id]) || 1;
  var pend = '';
  for(var i = 0; i < 4; i++){
    var p = pendById(SV.slots[i]);
    var plv = p && SV.pendants[p.id] ? (SV.pendants[p.id].lv || 1) : 1;
    pend += '<div class="dkf-pslot' + (p ? ' dkf-r' + p.rar : ' dkf-empty') + '" role="button" data-dkf-slot="' + i + '"'
      + ' title="' + (p ? dkfEsc(p.nm) : (i + 1) + '番目の枠') + '">'
      + (p ? '<span class="dkf-pslot-ic">' + p.ic + '</span><i>+' + (plv - 1) + '</i>' : '<span class="dkf-pslot-plus">＋</span>')
      + '</div>';
  }
  var bars = STAT_LABELS.map(function(kv){
    var v = st[kv[0]] || 0;
    return '<div class="dkf-st"><span class="dkf-st-l">' + kv[1] + '</span>'
      + '<span class="dkf-st-t"><i style="transform:scaleX(' + Math.min(1, v / 100).toFixed(3) + ')"></i></span>'
      + '<span class="dkf-st-v">' + v + '</span></div>';
  }).join('');
  pg.innerHTML =
      '<div class="dkf-sec">'
    +   '<div class="dkf-sechd"><span class="dkf-tab"><b>おすすめアイテム</b></span><span class="dkf-hint">アイテムはゲーム内で使えます</span></div>'
    +   '<div class="dkf-items">' + DKF_TOP3.map(dkfItemTile).join('') + '</div>'
    + '</div>'
    + '<div class="dkf-sec">'
    +   '<div class="dkf-sechd"><span class="dkf-tab"><b>魔法アイテム</b></span><span class="dkf-hint">持ち込みは ' + SV.bag.length + '/' + BAG_MAX + ' 個</span></div>'
    +   '<div class="dkf-magic">'
    +     '<div class="dkf-fcard' + (m0 ? ' dkf-on' : '') + '">' + dkfItemArt(m0 ? m0.id : '') + '<b>' + (m0 ? dkfEsc(m0.nm) : '未装着') + '</b>'
    +       (mags.length > 1 ? '<span class="dkf-fcnt">×' + mags.length + '</span>' : '') + '</div>'
    +     '<div class="dkf-mtx"><b>フォーチュンカード<br><em>' + mags.length + '</em> 枚 装着中</b><span>対戦で使えます</span></div>'
    +     '<div class="dkf-mbtns">'
    +       '<div class="dkf-mb dkf-mb-blue' + (randGot ? ' dkf-got' : '') + (randNo ? ' dkf-no' : '') + '" role="button" data-dkf-buy="' + DKF_MAGIC.rand + '" data-fx-press>'
    +         '<b>ランダムカード</b><span class="dkf-price"><i class="dkf-coin"></i><b>' + (randGot ? '返品' : randG.toLocaleString()) + '</b></span></div>'
    +       '<div class="dkf-mb dkf-mb-gold' + (angGot ? ' dkf-got' : '') + (angNo ? ' dkf-no' : '') + '" role="button" data-dkf-gem="' + DKF_MAGIC.angel + '" data-fx-press>'
    +         '<b>天使カード</b><span class="dkf-price"><i class="dkf-gemic"></i><b>' + (angGot ? '返品' : DKF_ANGEL_GEM) + '</b></span></div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="dkf-sec dkf-sec-eq">'
    +   '<div class="dkf-sechd"><span class="dkf-tab"><b>装着情報</b></span><span class="dkf-hint">タッチで付けかえ</span></div>'
    +   '<div class="dkf-eq">'
    +     '<div class="dkf-eqcard dkf-r' + c.rar + '" role="button" id="dkfEqCard">'
    +       '<span class="dkf-eqimg"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>'
    +         (img ? '' : '<canvas width="240" height="340"></canvas>') + '</span>'
    +       '<span class="dkf-eqlv">' + o.lv + '</span><span class="dkf-chg">変更</span></div>'
    +     '<div class="dkf-eqr">'
    +       '<div class="dkf-eqtop">'
    +         '<div class="dkf-pends">' + pend + '</div>'
    +         '<div class="dkf-eqdice" role="button" id="dkfEqDice" style="--dkf-dc:' + die.col + '">'
    +           '<span class="dkf-dice"><span class="dkf-die dkf-die-a"></span><span class="dkf-die dkf-die-b"></span></span>'
    +           '<span class="dkf-eqdice-tx"><b>' + dkfEsc(die.nm) + '</b><i>Lv.' + dlv + '</i></span></div>'
    +       '</div>'
    +       '<div class="dkf-stats">' + bars + '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>';
  if(!img){ var cv = pg.querySelector('.dkf-eqimg canvas'); if(cv) regPortrait(cv, c.art, c.col, c.id); }
  pg.querySelectorAll('[data-dkf-buy]').forEach(function(b){
    b.onclick = function(){ dkfBuy(b.getAttribute('data-dkf-buy'), false); };
  });
  pg.querySelectorAll('[data-dkf-gem]').forEach(function(b){
    b.onclick = function(){ dkfBuy(b.getAttribute('data-dkf-gem'), true); };
  });
  pg.querySelectorAll('[data-dkf-slot]').forEach(function(b){
    b.onclick = function(){ dkfSnd('click'); slotPicker(+b.getAttribute('data-dkf-slot'), dkfAfterEquip); };
  });
  var ec = pg.querySelector('#dkfEqCard'); if(ec) ec.onclick = function(){ dkfCardPick(0); };
  var ed = pg.querySelector('#dkfEqDice'); if(ed) ed.onclick = function(){ dkfSnd('click'); dicePicker(dkfAfterEquip); };
}
function dkfAfterEquip(){ dkfSyncSeats(); dkfRenderLeft(); renderSeats(); }
function dkfBuy(id, gem){
  var it = itemById(id); if(!it) return;
  var price = gem ? DKF_ANGEL_GEM : shopPrice(id), at = SV.bag.indexOf(id);
  if(at >= 0){
    SV.bag.splice(at, 1);
    var back = gem ? price : Math.round(price * 0.7);
    if(gem) SV.gem += back; else SV.gold += back;
    try{ saveNow(); }catch(e){}
    dkfSnd('click');
    dkfToast('↩', it.nm + ' を返品しました', (gem ? 'ダイヤ ' : 'ゴールド ') + back.toLocaleString() + ' を返しました', 1800);
    dkfRenderLeft(); try{ dkWallet(); }catch(e){}
    return;
  }
  if(SV.bag.length >= BAG_MAX){ dkfSnd('warn'); dkfToast('🎒', 'いっぱいです', '持ち込みは ' + BAG_MAX + ' 個までです', 2000); return; }
  if(gem ? SV.gem < price : SV.gold < price){
    dkfSnd('warn');
    dkfToast(gem ? '💎' : '🪙', gem ? 'ダイヤが足りません' : 'ゴールドが足りません',
      gem ? '出席簿とミッションでもらえます' : '対戦するとたまります', 2000);
    return;
  }
  if(gem) SV.gem -= price; else SV.gold -= price;
  SV.bag.push(id);
  try{ saveNow(); }catch(e){}
  dkfSnd('buy');
  dkfRenderLeft();
  var room = document.getElementById('room');
  var tile = room && room.querySelector('[data-dkf-' + (gem ? 'gem' : 'buy') + '="' + id + '"]');
  try{ dkWallet(); }catch(e){}
  if(tile){
    try{
      fxCoins(fxWalletEl(gem ? 'gem' : 'gold'), tile, { kind:gem ? 'gem' : 'coin', n:6, dur:560 })
        .then(function(){ if(tile.isConnected) fxBurst(tile, { kind:'star', n:12, power:0.8 }); });
    }catch(e){}
  }
}

/* ── 右ページ：ルール（.fx-seg） ── */
function dkfSegHTML(key, label, list, cur){
  var ci = Math.max(0, list.findIndex(function(o){ return o[0] === cur; }));
  return '<div class="dkf-rule dkf-rule-' + key + '"><span class="dkf-rule-lb">' + label + '</span>'
    + '<div class="fx-seg dkf-seg" data-dkf-rule="' + key + '" style="--dkf-n:' + list.length + ';--dkf-i:' + ci + '">'
    + '<i class="thumb"></i>'
    + list.map(function(o, i){
        return '<button type="button" data-dkf-v="' + o[0] + '" aria-pressed="' + (i === ci ? 'true' : 'false') + '">' + o[1] + '</button>';
      }).join('')
    + '</div></div>';
}
function dkfRenderRules(){
  var room = document.getElementById('room');
  var box = room && room.querySelector ? room.querySelector('.dkf-rules') : null;
  if(!box) return;
  box.innerHTML = '<div class="dkf-rules-hd"><span class="dkf-tab"><b>ルール</b></span></div>'
    + '<div class="dkf-rules-row">'
    +   dkfSegHTML('turns', 'ターン数', DKF_TURNS, cfg.turns)
    +   dkfSegHTML('time', '制限時間（分）', DKF_TIMES, cfg.timeLimit)
    +   dkfSegHTML('ai', 'CPUの強さ', DKF_AIS, cfg.ai)
    + '</div>';
  box.querySelectorAll('.dkf-seg button').forEach(function(b){
    b.onclick = function(){
      var seg = b.parentNode, key = seg.getAttribute('data-dkf-rule'), v = +b.getAttribute('data-dkf-v');
      dkfSetRule(key, v);
      var btns = seg.querySelectorAll('button');
      btns.forEach(function(x, i){
        var on = x === b; x.setAttribute('aria-pressed', on ? 'true' : 'false');
        if(on) seg.style.setProperty('--dkf-i', i);
      });
    };
  });
}
function dkfSetRule(key, v){
  if(key === 'turns') cfg.turns = v;
  else if(key === 'time') cfg.timeLimit = v;
  else if(key === 'ai') cfg.ai = v;
  if(typeof SV === 'object' && SV){
    SV.rules = Object.assign({}, SV.rules || {}, { turns:cfg.turns, timeLimit:cfg.timeLimit, ai:cfg.ai });
    try{ saveNow(); }catch(e){}
  }
  dkfSnd('click');
  if(key === 'ai' && DKF_S.slots){
    DKF_S.slots.forEach(function(s){ if(s.kind === 'cpu') s.cardId = null; });
    dkfSyncSeats(); renderSeats();
  }
}

/* ── 右ページ：4席 ── */
function dkfSeatHTML(s, i){
  var k = s.kind;
  if(k === 'lock'){
    return '<div class="rm-seat dkf-seat dkf-k-lock" role="button" data-dkf-seat="' + i + '" data-fx="riseR">'
      + '<span class="dkf-slock">' + dkfSvg('lock') + '</span>'
      + '<b class="dkf-slock-tx">あいている席</b><small class="dkf-slock-sub">タップで CPU を入れる</small></div>';
  }
  var cc = cardById(s.cardId) || CARDPOOL[i % CARDPOOL.length];
  var tag = k === 'you' ? '<span class="dkf-stag-ic">' + dkfSvg('house') + '</span><b>部屋主</b>'
          : k === 'cpu' ? '<span class="dkf-stag-cpu">CPU</span><b>' + DKF_AIS[cfg.ai][1] + '</b>'
          : '<span class="dkf-stag-fr">' + dkfSvg('pen') + '</span><b>ともだち</b>';
  var btns = k === 'cpu' ? '<span class="dkf-shint">タップで ともだちに</span>'
    : '<span class="dkf-sbtns">'
      + (k === 'human' ? '<span class="dkf-sb" role="button" data-dkf-name="' + i + '">' + dkfSvg('pen') + '<b>名前</b></span>' : '')
      + '<span class="dkf-sb" role="button" data-dkf-card="' + i + '">' + dkfSvg('card') + '<b>カード</b></span></span>';
  return '<div class="rm-seat dkf-seat dkf-k-' + (k === 'human' ? 'fr' : k) + '" role="button" data-dkf-seat="' + i + '" data-fx="riseR">'
    + '<div class="dkf-stag">' + tag + '</div>'
    + '<div class="fc"><canvas class="sp" data-art="' + cc.art + '" data-col="' + cc.col + '" data-card="' + cc.id + '" width="200" height="220"></canvas></div>'
    + '<div class="dkf-snm"><b>' + dkfEsc(s.name || '') + '</b><i>' + dkfEsc(cc.nm) + '（' + RAR[cc.rar].nm + '）'
    +   (s.trial ? '<em>おためし</em>' : '') + '</i></div>'
    + btns
    + '</div>';
}
function renderSeats(){
  var room = document.getElementById('room');
  var box = room && room.querySelector ? room.querySelector('.dkf-seats') : null;
  if(!box || typeof DKF_S !== 'object' || !DKF_S || !DKF_S.slots) return;
  box.innerHTML = DKF_S.slots.map(dkfSeatHTML).join('');
  box.querySelectorAll('canvas.sp').forEach(function(cv){
    if(!(typeof dkCharImg === 'function' && dkCharImg(cv.getAttribute('data-card'))))
      regPortrait(cv, +cv.getAttribute('data-art'), cv.getAttribute('data-col'), cv.getAttribute('data-card'));
  });
  box.querySelectorAll('[data-dkf-seat]').forEach(function(p){
    p.onclick = function(){ dkfCycleSeat(+p.getAttribute('data-dkf-seat')); };
  });
  box.querySelectorAll('[data-dkf-name]').forEach(function(b){
    b.onclick = function(e){ e.stopPropagation(); dkfEditName(+b.getAttribute('data-dkf-name')); };
  });
  box.querySelectorAll('[data-dkf-card]').forEach(function(b){
    b.onclick = function(e){ e.stopPropagation(); dkfCardPick(+b.getAttribute('data-dkf-card')); };
  });
  dkfRenderGo();
}
function dkfRenderGo(){
  var room = document.getElementById('room');
  var go = room && room.querySelector ? room.querySelector('#dkfGo') : null;
  if(!go) return;
  var off = cfg.n < 2;
  go.classList.toggle('dkf-off', off);
  go.setAttribute('aria-disabled', off ? 'true' : 'false');
  var sub = go.querySelector('.dkf-go-sub');
  if(sub) sub.textContent = off ? 'もう1人入れてください' : cfg.n + '人で対戦';
}
/* 席を押すたびに CPU → ともだち → 🔒 → CPU（1席目はあなた固定＝カードを変える） */
function dkfCycleSeat(i){
  if(!DKF_S.slots || !DKF_S.slots[i]) return;
  if(i === 0){ dkfCardPick(0); return; }
  var s = DKF_S.slots[i];
  if(s.kind === 'cpu'){ s.kind = 'human'; s.name = 'ともだち' + (i + 1); s.cardId = null; s.trial = false; }
  else if(s.kind === 'human'){ s.kind = 'lock'; s.cardId = null; s.trial = false; }
  else { s.kind = 'cpu'; s.name = 'CPU ' + DKF_CPU_NM[(i + 2) % 3]; s.cardId = null; s.trial = false; }
  dkfSnd(s.kind === 'lock' ? 'click' : 'cardIn');
  dkfSyncSeats();
  renderSeats();
  var room = document.getElementById('room');
  var p = room && room.querySelector('[data-dkf-seat="' + i + '"]');
  if(p) dkfPulse(p);
}
async function dkfEditName(i){
  var s = DKF_S.slots && DKF_S.slots[i]; if(!s || s.kind !== 'human') return;
  dkfSnd('click');
  var p = modal('<div class="modal dkf-mod"><div class="fx-panel parch dkf-mod-in dkf-name-in">'
    + '<b class="dkf-mod-hd">' + (i + 1) + '番目の席の なまえ</b>'
    + '<input class="dkf-name-inp" type="text" maxlength="8" value="' + dkfEsc(s.name || '') + '" aria-label="なまえ">'
    + '<div class="dkf-mod-ft"><button class="dkbtn dkf-btn-wood" data-act="no">やめる</button>'
    + '<button class="dkbtn gr" data-act="ok">決める</button></div></div></div>');
  var inp = document.querySelector('#modalBody .dkf-name-inp');
  if(inp){
    try{ inp.focus(); inp.select(); }catch(e){}
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ var ok = document.querySelector('#modalBody [data-act="ok"]'); if(ok) ok.click(); }
    });
  }
  var r = await p;
  if(r === 'ok' && inp){
    var v = String(inp.value || '').replace(/\s+/g, ' ').trim().slice(0, 8);
    if(v) s.name = v;
    renderSeats();
  }
}
async function dkfCardPick(i){
  var s = DKF_S.slots && DKF_S.slots[i]; if(!s || s.kind === 'lock' || s.kind === 'cpu') return;
  dkfSnd('click');
  var used = {};
  DKF_S.slots.forEach(function(o, k){ if(k !== i && o.kind !== 'lock' && o.cardId) used[o.cardId] = k + 1; });
  var list = ownedCards().slice();
  if(i !== 0 && !list.some(function(c){ return !used[c.id]; }))
    list = list.concat(CARDPOOL.filter(function(c){ return c.rar === 'A' && !dkfOwned(c.id); }));
  var cur = (i === 0) ? SV.equip : s.cardId;
  var tiles = list.map(function(c){
    var o = SV.cards[c.id], img = (typeof dkCharImg === 'function') ? dkCharImg(c.id) : '';
    var u = used[c.id];
    return '<div class="dkf-pc dkf-r' + c.rar + (c.id === cur ? ' dkf-sel' : '') + (u ? ' dkf-used' : '') + '"'
      + (u ? '' : ' data-act="pick:' + c.id + '"') + '>'
      + '<span class="dkf-pc-img"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>'
      + (img ? '' : '<b>' + dkfEsc(c.nm.slice(0, 1)) + '</b>') + '</span>'
      + '<b class="dkf-pc-nm">' + dkfEsc(c.nm) + '</b>'
      + '<i class="dkf-pc-lv">' + RAR[c.rar].nm + (o ? ' ／ Lv.' + o.lv : ' ／ おためし') + '</i>'
      + (u ? '<span class="dkf-pc-used">' + u + '番の席</span>' : '')
      + '</div>';
  }).join('');
  var r = await modal('<div class="modal dkf-mod"><div class="fx-panel parch dkf-mod-in dkf-pick-in">'
    + '<b class="dkf-mod-hd">' + (i === 0 ? 'あなたの' : dkfEsc(s.name) + ' の') + 'カードを選ぶ</b>'
    + '<div class="dkf-pick-grid">' + tiles + '</div>'
    + '<div class="dkf-mod-ft"><button class="dkbtn gd" data-act="close">閉じる</button></div></div></div>');
  if(!r || r.indexOf('pick:') !== 0) return;
  var id = r.slice(5); if(used[id] || !cardById(id)) return;
  if(i === 0){ SV.equip = dkfOwned(id) ? id : SV.equip; try{ saveNow(); }catch(e){} }
  else { s.cardId = id; s.trial = !dkfOwned(id); }
  dkfSyncSeats();
  dkfRenderLeft();
  renderSeats();
}

/* 戻る・ホームの配線（data-dkf-go） */
function dkfWireNav(el){
  el.querySelectorAll('[data-dkf-go]').forEach(function(b){
    b.onclick = function(){
      var to = b.getAttribute('data-dkf-go');
      dkfSnd('click');
      if(to === 'home') return (typeof showHome === 'function') ? showHome() : screenTo('home');
      if(to === 'class') return dkFlowClass();
      if(to === 'map') return dkfRoomExit();
    };
  });
}
/* ホームの［入場する］が旧 screenTo('setup') のままなら dkFlowStart に付けかえる
   （WP9 の showHome が dkFlowStart を配線していれば何もしない） */
function dkfWireEnter(){
  var go = document.getElementById('dkEnter');
  if(!go || typeof go.onclick !== 'function') return;
  if(!/screenTo\(\s*['"]setup['"]\s*\)/.test(String(go.onclick))) return;
  go.onclick = function(){ dkfSnd('click'); try{ ac(); }catch(e){} dkFlowStart(); };
}

/* ══════════ 起動 ══════════ */
(function(){
  try{
    dkfSyncCfg();
    dkfBuildMap();                       // 旧 #setup（select・#mapList・#seatList）を消してマップ選択を作っておく
    dkOn('screen', function(e){
      if(!e || e.id !== 'setup') return;
      if(e.changed && DKF_S.mapSig !== dkfMapSig()) dkfBuildMap();
      if(e.changed) dkfTickerStart();
    });
    if(typeof showHome === 'function'){
      var home0 = showHome;
      showHome = function(){
        var r = home0.apply(this, arguments);
        try{ dkfWireEnter(); }catch(err){ console.error('[WP3]', err); }
        return r;
      };
    }
    document.addEventListener('keydown', function(e){
      var s = document.getElementById('setup'), mw = document.getElementById('modalWrap');
      if(!s || !s.classList.contains('on') || (mw && mw.classList.contains('on'))) return;
      if(e.key === 'ArrowLeft') dkfStepMap(-1);
      else if(e.key === 'ArrowRight') dkfStepMap(1);
    });
  }catch(e){ console.error('[WP3]', e); }
})();
