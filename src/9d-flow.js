
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 対戦前フロー（9d-flow.js / WP3 → v10 WP15a）
   クラス選択 #dkclass → マップ選択 #setup → ゲームルーム #room（どこからでも「戻る」で1つ前へ）
   ・宣言する関数：dkFlowStart dkFlowClass dkFlowMap dkFlowRoom dkClassOf launch roomPhase pickPhase
     renderMaps renderSeats slotPicker dicePicker（ほかは dkf*）
   ・トップレベルは var（4-game.js の読み込み中に renderMaps/renderSeats が呼ばれるため）。DOM の初期化は最後の IIFE だけ。
   ・スマホ（html.fx-mob）の直し（dkfClearSetup・dkfFreeMapLater・小さな盤は CPU で描く）を引き継ぐ。常時アニメは各画面8個まで。
   ══════════════════════════════════════════════════════════════ */

/* クラス（本家の数字。x＝開始額÷200万、n＝席の数を固定、tk＝入場券）
   プレイヤーLv による鍵は付けない（最初からどのクラスでも選べる）。
   入場券が無い時は、その場で無料で1枚おわたしする（遊べない状態を作らない） */
var DKF_CLASSES = [
  { id:'easy',  nm:'イージー',     rank:'入門',   en:'Easy Mode',      cash:2000000,  x:1,   lv:1, n:2 },
  { id:'eco',   nm:'エコノミー',   rank:'初級',   en:'Economy Class',  cash:2000000,  x:1,   lv:1 },
  { id:'biz',   nm:'ビジネス',     rank:'中級',   en:'Business Class', cash:5000000,  x:2.5, lv:1, tk:'biz' },
  { id:'first', nm:'ファースト',   rank:'上級',   en:'First Class',    cash:10000000, x:5,   lv:1, tk:'first' },
  { id:'dia',   nm:'ダイヤモンド', rank:'最上級', en:'Diamond Class',  cash:10000000, x:5,   lv:1, tk:'dia', n:2, gem:75 }
];
var DKF_TK_NM = { biz:'ビジネス', first:'ファースト', dia:'ダイヤ' };
/* ルール（30ターン・25分が本家。12/20ターン・15/20分は短縮ルール＝当作） */
var DKF_TURNS = [[12,'12'], [20,'20'], [30,'30']];
var DKF_TIMES = [[0,'なし'], [900,'15'], [1200,'20'], [1500,'25']];
var DKF_AIS   = [[0,'よわい'], [1,'ふつう'], [2,'つよい']];
var DKF_SHAKE = [[0,'なし'], [1,'あり']];
var DKF_PRACTICE = [['EASY','よわい'], ['NORMAL','ふつう'], ['HARD','つよい']];
var DKF_CPU_NM = ['ガル', 'リノ', 'ゼニ'];
/* 人数（席の 🔒 と連動）と 開始マーブルの倍率（当作ルール。選んだクラスの額が基準） */
var DKF_NS   = [[2,'2人'], [3,'3人'], [4,'4人']];
var DKF_MULS = [[0.5,'×0.5'], [1,'×1'], [2,'×2'], [3,'×3']];
/* おすすめアイテム（本家の3つ。値段はクラス別） */
var DKF_TOP3 = [
  { id:'oe',  nm:'奇数/偶数アイテム', br:'奇数/偶数<br>アイテム', ds:'偶数か奇数、どちらかを選択できます（3回）' },
  { id:'sal', nm:'給料ボーナス',       br:'給料ボーナス',          ds:'最初の給料が2倍になります' },
  { id:'dbl', nm:'サイコロダブル',     br:'サイコロダブル',        ds:'最初のサイコロが必ずダブルになります' }
];
var DKF_PRICE = { easy:[500, 200, 100], eco:[500, 200, 100], biz:[700, 300, 200], first:[1000, 500, 300], dia:[1000, 500, 300] };
/* 魔法アイテム＝フォーチュンカード1枚（C08 p.fcard の4種） */
var DKF_MAGIC = [
  { id:'angel',  nm:'天使カード',     ds:'通行料が1回だけ無料になります' },
  { id:'coupon', nm:'割引クーポン',   ds:'通行料が1回だけ半額になります' },
  { id:'shield', nm:'シールドカード', ds:'相手の攻撃カードを1回だけ防ぎます' },
  { id:'escape', nm:'脱出チケット',   ds:'無人島に閉じ込められても、すぐに出られます' }
];
var DKF_RAND_G = 500;
var DKF_REDRAW_G = 300;
var DKF_ANGEL_GEM = 5;
/* マップ選択の下段の報酬（×x。9e-match.js の grantRewards と同じ数にそろえる） */
var DKF_WIN_G = 1400;
var DKF_JOIN_G = 1000;
var DKF_MAP_LINE = {
  ice:'ブロックを凍結させて滑らせちゃおう！',
  world:'世界の都市をめぐって、独占をねらおう！',
  oita:'湯けむりの大分をめぐって、温泉地を独占しよう！'
};
var DKF_TUT = [
  { t:'サイコロを振ろう',               s:'［押す］を長押しして、ねらった数で離すと近い目が出ます' },
  { t:'都市を買って建物を建てよう',     s:'止まった都市は買えます。建物が高いほど通行料も上がります' },
  { t:'独占すると、その場で勝ち',       s:'トリプル独占・ライン独占・観光地独占のどれかをねらおう' },
  { t:'最後まで遊ぶとチュートリアル完了', s:'ダイヤモンドの入場券を1枚プレゼントします' }
];
/* 自作のアイコン（SVG の中身だけ。dkfSvg が枠を付ける） */
var DKF_ICO = {
  plane:'<path fill="currentColor" d="M60 29c0-2.2-1.8-3.4-4-3.4H41.2L27.6 6.3h-5.9l6.6 19.3H15.8l-5-6.3H6.4l3.3 12.7-3.3 12.7h4.4l5-6.3h12.5L21.7 57.7h5.9l13.6-19.3H56c2.2 0 4-1.2 4-3.4z"/>',
  house:'<path fill="currentColor" d="M32 7 4 31h8v25h15V40h10v16h15V31h8z"/><path fill="rgba(0,0,0,.25)" d="M27 40h10v16H27z"/>',
  lock:'<path fill="none" stroke="currentColor" stroke-width="7" d="M20 29v-8a12 12 0 0 1 24 0v8"/><rect x="11" y="28" width="42" height="30" rx="7" fill="currentColor"/><circle cx="32" cy="41" r="4.5" fill="rgba(0,0,0,.45)"/><path d="M30 43h4v8h-4z" fill="rgba(0,0,0,.45)"/>',
  globe:'<circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="5"/><path fill="none" stroke="currentColor" stroke-width="4" d="M6 32h52M32 6c-9 8-9 44 0 52M32 6c9 8 9 44 0 52M11 18h42M11 46h42"/>',
  left:'<path fill="currentColor" d="M42 8 16 32l26 24 6-6-19.5-18L48 14z"/>',
  right:'<path fill="currentColor" d="M22 8 48 32 22 56l-6-6 19.5-18L16 14z"/>',
  check:'<path fill="currentColor" d="M6 34l9-9 11 11L50 10l9 9-33 34z"/>',
  megaphone:'<path fill="currentColor" d="M8 26h10l26-14v40L18 38H8z"/><path fill="currentColor" d="M18 38l5 16h8l-4-16z" opacity=".75"/><path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" d="M50 22c4 4 4 16 0 20M55 16c7 8 7 24 0 32"/>',
  pen:'<path fill="currentColor" d="M44 6l14 14-30 30-17 4 4-17z"/><path fill="rgba(0,0,0,.3)" d="M15 37l12 12-10 3-5-5z"/>',
  card:'<rect x="12" y="5" width="40" height="54" rx="6" fill="currentColor"/><rect x="18" y="11" width="28" height="42" rx="3" fill="rgba(0,0,0,.28)"/><path fill="currentColor" d="M32 20l4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1z" opacity=".9"/>',
  ticket:'<path fill="currentColor" d="M5 15h54v11a6 6 0 0 0 0 12v11H5V38a6 6 0 0 0 0-12z"/><path fill="rgba(0,0,0,.25)" d="M42 17h2.5v30H42z"/><path fill="rgba(255,255,255,.92)" d="M13 30.5l3.8-1 7.6 2.6 6.6-5.6 2.8.8-5.6 6.6 4.8 2.8-1.8 1.9-5.8-1.8-2.9 3.7h-1.9l.9-4.7-5.8-1.8z"/>',
  gem:'<path fill="currentColor" d="M16 8h32l12 16-28 34L4 24z"/><path fill="rgba(255,255,255,.5)" d="M16 8l6 16h20l6-16z"/><path fill="rgba(0,0,0,.2)" d="M22 24l10 34 10-34z"/>',
  crown:'<path fill="currentColor" d="M5 20l15 12 12-21 12 21 15-12-6 30H11z"/><rect x="11" y="52" width="42" height="7" rx="2" fill="currentColor"/><circle cx="32" cy="36" r="4.5" fill="rgba(0,0,0,.3)"/>',
  swap:'<path fill="currentColor" d="M44 6l14 12-14 12v-8H14v-8h30zM20 34v8h30v8H20v8L6 46z"/>',
  star:'<path fill="currentColor" d="M32 4l8.2 17.8 19.4 2.2-14.4 13.2 4 19.2L32 46.6 14.8 56.4l4-19.2L4.4 24l19.4-2.2z"/>'
};
/* 画面の状態（セーブしない） */
var DKF_S = { busy:false, roomRes:null, roomWait:false, slots:null, mapSig:'', drag:null, tick:0, freeT:0,
  ai:1, mul:1, team:false, practice:false, lastPractice:false, picking:false, randBusy:false, today:'', uid:0,
  tut:null, hintT:0 };

/* ══════════ 小さな道具 ══════════ */
function dkfEsc(s){ return (typeof esc === 'function') ? esc(s) : String(s); }
function dkfSvOk(){ return typeof SV === 'object' && !!SV; }
function dkfMan(n){ return Math.round(n / 10000).toLocaleString() + '万'; }
function dkfG(n){ return Math.round(+n || 0).toLocaleString(); }
function dkfUid(){ DKF_S.uid = (DKF_S.uid + 1) % 1e9; return DKF_S.uid; }
function dkfMap(id){
  var L = (typeof MAPS !== 'undefined' && MAPS) ? MAPS : [];
  for(var i = 0; i < L.length; i++) if(L[i].id === id) return L[i];
  return L[0];
}
function dkfNear(list, v){
  var best = list[0][0], d = 1e18;
  list.forEach(function(o){ var k = Math.abs(o[0] - (+v || 0)); if(k < d){ d = k; best = o[0]; } });
  return best;
}
function dkfMyName(){ return (dkfSvOk() && SV.name) ? String(SV.name) : 'あなた'; }
function dkfSnd(n){ try{ if(typeof SFX === 'object' && SFX && SFX[n]) SFX[n](); }catch(e){} }
function dkfToast(ic, t, s, ms){ try{ toast('R', ic, t, s, ms || 2400); }catch(e){} }
function dkfOnlineOk(){
  return !!(window.DV_OL && window.DV_OL.lib && window.DV_OL_API && typeof window.DV_OL_API.open === 'function');
}
/* 一度きりの弾み（el.animate。再生し直しでレイアウトを起こさない） */
function dkfPop(el, big){
  if(!el || !el.animate) return;
  try{ el.animate([{ transform:'scale(' + (big ? .92 : .96) + ')' }, { transform:'scale(' + (big ? 1.04 : 1.02) + ')', offset:.55 }, { transform:'scale(1)' }],
    { duration:big ? 480 : 420, easing:'cubic-bezier(.34,1.56,.64,1)' }); }catch(e){}
}
/* 背景の光は光の玉と斜めの光だけ（動く粒を作らない＝常時アニメを8個までに収める） */
function dkfAmb(el){ try{ if(typeof fxAmbient === 'function') fxAmbient(el, { motes:0 }); }catch(e){} }
function dkfNope(node, ic, t, s){
  dkfSnd('warn');
  try{ fxShake(node, 260); }catch(e){}
  dkfToast(ic, t, s, 2800);
  return false;
}

/* 入場券（C22 SV.tickets） */
function dkfTk(){
  if(!dkfSvOk()) return { biz:0, first:0, dia:0 };
  var t = SV.tickets;
  if(!t || typeof t !== 'object' || Array.isArray(t)) t = SV.tickets = {};
  ['biz', 'first', 'dia'].forEach(function(k){ var v = +t[k]; t[k] = (v > 0 && isFinite(v)) ? Math.floor(v) : 0; });
  return t;
}
/* 持ち込み品（C07 SV.carry={oe,sal,dbl,magic}。paid は払った額＝キャンセルで同じ額を返す） */
function dkfMagicOf(id){
  for(var i = 0; i < DKF_MAGIC.length; i++) if(DKF_MAGIC[i].id === id) return DKF_MAGIC[i];
  return null;
}
function dkfEmptyCarry(){ return { oe:false, sal:false, dbl:false, magic:null }; }
function dkfCarry(){
  if(!dkfSvOk()) return dkfEmptyCarry();
  var c = SV.carry;
  if(!c || typeof c !== 'object' || Array.isArray(c)) c = SV.carry = dkfEmptyCarry();
  c.oe = !!c.oe; c.sal = !!c.sal; c.dbl = !!c.dbl;
  if(!dkfMagicOf(c.magic)) c.magic = null;
  if(!c.paid || typeof c.paid !== 'object') c.paid = {};
  return c;
}
function dkfPrices(){ return DKF_PRICE[cfg.cls] || DKF_PRICE.eco; }

/* ── 開始マーブル（部屋のルール欄。クラスの額 × 倍率）と 人数 ──
   cfg.cash に入れるので、dkRate(key)＝round(cfg.cash×率) の割合計算がそのまま効く */
function dkfNearMul(v){ return dkfNear(DKF_MULS, (v == null || !isFinite(+v)) ? 1 : +v); }
function dkfMul(){ return dkfNearMul(DKF_S.mul); }
function dkfCashOf(c){ return Math.max(10000, Math.round((c.cash * dkfMul()) / 10000) * 10000); }
/* 1対1のクラスは2人、チーム戦は4人で固定。ほかは選んだ人数（既定4人） */
function dkfNFixed(c){ return !!(c && c.n) || !!cfg.team; }
function dkfWantN(c){
  if(c && c.n) return c.n;
  if(cfg.team) return 4;
  var r = dkfRules();
  return Math.max(2, Math.min(4, (r.n | 0) || 4));
}
function dkfCpuSeat(i){ return { name:'CPU ' + DKF_CPU_NM[(i + 2) % 3], kind:'cpu', ch:-1, cardId:null }; }

/* ══════════ 絵（自作 SVG。絵文字に頼らない） ══════════ */
function dkfSvg(kind){
  return DKF_ICO[kind] ? '<svg class="dkf-ico" viewBox="0 0 64 64" aria-hidden="true">' + DKF_ICO[kind] + '</svg>' : '';
}
function dkfSkyline(){
  return '<svg class="dkf-sky" viewBox="0 0 340 170" preserveAspectRatio="none" aria-hidden="true">'
    + '<path fill="currentColor" d="M0 170V118h14V96h10v22h8V70h18v48h6V88h12v-24l8-10 8 10v54h10V58h6V40h8v18h6v60h8V92h16v26h6V74h22v44h8V98h10V62l7-9 7 9v56h8V84h14v34h10V104h14V92h10v26h18v52z"/>'
    + '<path fill="currentColor" opacity=".55" d="M0 170v-28h22v-12h16v18h14v-24h20v26h18v-14h24v20h16v-30h14v30h20v-18h22v22h18v-26h16v26h20v-16h18v18h22v-10h14v42z"/></svg>';
}
function dkfArt(inner){ return '<svg class="dkf-art" viewBox="0 0 96 96" aria-hidden="true">' + inner + '</svg>'; }
function dkfItemArt(id){
  var u = dkfUid(), R = ' transform="rotate(-7 48 48)"', T = '<text font-family="Arial Black,Arial,sans-serif" font-weight="900" text-anchor="middle" ';
  if(id === 'oe') return dkfArt('<rect x="16" y="10" width="64" height="76" rx="11" fill="#FFF8E4" stroke="#8A6A3A" stroke-width="3"' + R + '/><path d="M26 80L72 16" stroke="#C9A060" stroke-width="3" stroke-dasharray="5 5"' + R + '/>'
    + T + 'x="36" y="48" font-size="27" fill="#2E6AC8"' + R + '>奇</text>' + T + 'x="62" y="78" font-size="27" fill="#D23A2A"' + R + '>偶</text>');
  if(id === 'sal') return dkfArt('<rect x="10" y="34" width="62" height="36" rx="5" fill="#5FAE48" stroke="#2E6A1C" stroke-width="3" transform="rotate(-8 41 52)"/><rect x="18" y="26" width="62" height="36" rx="5" fill="#7CCB5A" stroke="#2E6A1C" stroke-width="3"/><circle cx="49" cy="44" r="10" fill="#B8E89A" stroke="#2E6A1C" stroke-width="2.5"/>'
    + T + 'x="70" y="88" font-size="30" fill="#E0301C" stroke="#fff" stroke-width="5" paint-order="stroke fill">×2</text>');
  if(id === 'dbl') return dkfArt('<rect x="8" y="30" width="44" height="44" rx="10" fill="#fff" stroke="#6A5A40" stroke-width="3" transform="rotate(-14 30 52)"/><rect x="44" y="22" width="44" height="44" rx="10" fill="#fff" stroke="#6A5A40" stroke-width="3" transform="rotate(12 66 44)"/><g fill="#3A2C1A"><circle cx="22" cy="44" r="4.5"/><circle cx="30" cy="52" r="4.5"/><circle cx="37" cy="59" r="4.5"/><circle cx="58" cy="34" r="4.5"/><circle cx="66" cy="43" r="4.5"/><circle cx="73" cy="52" r="4.5"/></g>');
  if(id === 'angel') return dkfArt('<path fill="#FFF7DC" stroke="#C8952F" stroke-width="3" d="M46 50C30 28 12 30 6 44c10-2 18 2 22 10-8-2-14 2-16 8 10-4 22 0 30-4zM50 50c16-22 34-20 40-6-10-2-18 2-22 10 8-2 14 2 16 8-10-4-22 0-30-4z"/><ellipse cx="48" cy="22" rx="16" ry="5" fill="none" stroke="#F2C230" stroke-width="4"/><circle cx="48" cy="54" r="9" fill="#F2C230" stroke="#7A5206" stroke-width="2.5"/>');
  if(id === 'coupon') return dkfArt('<g transform="rotate(-8 48 48)"><path fill="#FFE27A" stroke="#9A6A08" stroke-width="3" d="M8 26h80v12a8 8 0 0 0 0 16v12H8V54a8 8 0 0 0 0-16z"/><path d="M64 28v36" stroke="#9A6A08" stroke-width="2.5" stroke-dasharray="4 4"/>'
    + T + 'x="36" y="58" font-size="26" fill="#C9302C">½</text>' + T + 'x="76" y="56" font-size="15" fill="#7A4A06">OFF</text></g>');
  if(id === 'shield') return dkfArt('<defs><linearGradient id="dkfSh' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD8FF"/><stop offset="1" stop-color="#1E6AC8"/></linearGradient></defs><path fill="url(#dkfSh' + u + ')" stroke="#EAF6FF" stroke-width="4" d="M48 8l32 12v22c0 22-14 38-32 46C30 80 16 64 16 42V20z"/><path fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" d="M34 48l10 10 20-22"/>');
  if(id === 'escape') return dkfArt('<rect x="14" y="16" width="40" height="66" rx="4" fill="#8A5A2A" stroke="#3E2410" stroke-width="3"/><rect x="20" y="22" width="28" height="54" rx="2" fill="#5A3414"/><circle cx="42" cy="50" r="3.5" fill="#F2C230"/><path fill="#5FBF3A" stroke="#1E5A0C" stroke-width="3" stroke-linejoin="round" d="M56 40h14v-9l18 17-18 17v-9H56z"/>');
  return dkfArt('<rect x="22" y="10" width="52" height="76" rx="9" fill="#4A3517" stroke="#E0AE3A" stroke-width="4"/>' + T + 'x="48" y="62" font-size="40" fill="#F5D36B">?</text>');
}
/* 報酬の絵（宝箱・ダイヤ・金貨とキューブ） */
function dkfPrizeArt(kind){
  var u = dkfUid(), sp = '<path fill="#fff" d="M118 16l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>';
  var g = function(id, a, b){ return '<defs><linearGradient id="' + id + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>'; };
  var h = '<svg viewBox="0 0 140 100" aria-hidden="true">';
  if(kind === 'gem') return h + g('dkfGm', '#EAF8FF', '#1E7FD0')
    + [[40, 58, 1], [78, 64, .8], [104, 50, .7], [62, 36, .9]].map(function(o){
        var s = 20 * o[2];
        return '<path fill="url(#dkfGm' + u + ')" stroke="#EAF8FF" stroke-width="2" d="M' + (o[0] - s) + ' ' + o[1] + 'l' + (s * .5) + ' ' + (-s * .7) + 'h' + s + 'l' + (s * .5) + ' ' + (s * .7) + 'l' + (-s) + ' ' + (s * 1.2) + 'z"/>';
      }).join('') + sp + '</svg>';
  if(kind === 'cube') return h + '<g stroke="#8A6206" stroke-width="2"><ellipse cx="46" cy="80" rx="34" ry="9" fill="#8A6206"/><ellipse cx="46" cy="72" rx="34" ry="9" fill="#F2C74F"/><ellipse cx="46" cy="62" rx="34" ry="9" fill="#FFE27A"/><ellipse cx="40" cy="52" rx="28" ry="8" fill="#FFF0B0"/></g>'
    + '<g stroke="#5A3414" stroke-width="2.5" stroke-linejoin="round"><path fill="#C8955A" d="M88 34l24-10 24 10-24 10z"/><path fill="#A87438" d="M88 34v30l24 12V44z"/><path fill="#8A5A2A" d="M136 34v30l-24 12V44z"/></g></svg>';
  return h + g('dkfCh', '#FFE9A0', '#C8862A')
    + '<g fill="url(#dkfCh' + u + ')" stroke="#6B4408" stroke-width="3"><path d="M26 44c0-18 18-28 44-28s44 10 44 28z"/><rect x="26" y="44" width="88" height="44" rx="5"/></g>'
    + '<path d="M26 58h88M58 44v44M82 44v44" stroke="#8A5A10" stroke-width="3"/><rect x="62" y="50" width="16" height="18" rx="3" fill="#FFF7DC" stroke="#6B4408" stroke-width="2.5"/><circle cx="70" cy="58" r="3" fill="#6B4408"/>' + sp + '</svg>';
}
/* ペンダントの紋章（等級の色の輪＋宝石＋紋。9b の dkpGem/dkpEmblem があれば使う） */
function dkfPendArt(id){
  var p = (typeof pendById === 'function') ? pendById(id) : null;
  if(!p) return '';
  var col = null, emb = '';
  try{ col = (typeof dkpGem === 'function') ? dkpGem(id) : null; }catch(e){ col = null; }
  try{ emb = (typeof dkpEmblem === 'function') ? dkpEmblem(id) : ''; }catch(e){ emb = ''; }
  if(!col || col.length < 3) col = ['#FFF7DC', '#E0AE3A', '#6B4408'];
  if(!emb) emb = '<path fill="#FFFDF4" stroke="rgba(40,20,4,.55)" stroke-width="1.6" d="M20 4l4.6 10 10.8 1.2-8 7.4 2.2 10.6L20 27.8 10.4 33.2l2.2-10.6-8-7.4L15.4 14z"/>';
  var ring = p.rar === 'SS' ? '#F2C230' : p.rar === 'S' ? '#C9A0F0' : '#8FC4F0', g = 'dkfPg' + dkfUid();
  return '<svg class="dkf-part" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="' + g + '" cx="38%" cy="30%" r="72%">'
    + '<stop offset="0" stop-color="' + col[0] + '"/><stop offset=".55" stop-color="' + col[1] + '"/><stop offset="1" stop-color="' + col[2] + '"/></radialGradient></defs>'
    + '<circle cx="32" cy="32" r="30" fill="' + ring + '" stroke="rgba(40,20,4,.6)" stroke-width="2"/>'
    + '<circle cx="32" cy="32" r="24" fill="url(#' + g + ')" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>'
    + '<g transform="translate(12 12)">' + emb + '</g></svg>';
}
/* サイコロの絵（等角の立方体。DICE の色） */
function dkfDieArt(id){
  var d = (typeof dieById === 'function') ? dieById(id) : { col:'#E8EEF6' };
  var c = d.col || '#E8EEF6', g = 'dkfDt' + dkfUid(), S = ' stroke="#5A4630" stroke-width="2.6" stroke-linejoin="round"';
  var pip = function(x, y, r, f){ return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 0.62).toFixed(2) + '" fill="' + f + '"/>'; };
  var dk = function(x, y){ return pip(x, y, 4, '#3A2C1A'); };
  return '<svg class="dkf-dart" viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="' + c + '"/></linearGradient></defs>'
    + '<path d="M48 8L86 29L48 50L10 29Z" fill="url(#' + g + ')"' + S + '/>'
    + '<path d="M10 29L48 50L48 90L10 69Z" fill="' + c + '"' + S + '/><path d="M10 29L48 50L48 90L10 69Z" fill="rgba(0,0,0,.2)"/>'
    + '<path d="M86 29L48 50L48 90L86 69Z" fill="' + c + '"' + S + '/><path d="M86 29L48 50L48 90L86 69Z" fill="rgba(0,0,0,.08)"/>'
    + pip(48, 29, 7, '#D23A2A')
    + '<g transform="matrix(1 .55 0 1 0 0)">' + dk(20, 29) + dk(29, 39) + dk(38, 49) + '</g>'
    + '<g transform="matrix(1 -.55 0 1 0 0)">' + dk(58, 108) + dk(76, 118) + dk(67, 113) + dk(58, 128) + dk(76, 138) + '</g></svg>';
}

/* ══════════ §6 契約：クラス ══════════ */
function dkClassOf(id){
  var L = (typeof DKF_CLASSES !== 'undefined' && DKF_CLASSES) ? DKF_CLASSES : null;
  if(!L) return { id:'eco', nm:'エコノミー', rank:'初級', en:'Economy Class', cash:2000000, x:1, lv:1 };
  for(var i = 0; i < L.length; i++) if(L[i].id === id) return Object.assign({}, L[i]);
  return Object.assign({}, L[1]);
}
function dkfClsOk(id){ return dkClassOf(id).id; }      // Lv による鍵は無し（最初からどれでも選べる）
/* v9 の既定（12ターン・20分）のままのセーブを、本家の既定（30ターン・25分）へ1回だけ直す（GO-7） */
function dkfRulesV10(){
  if(!dkfSvOk()) return;
  var r = (SV.rules && typeof SV.rules === 'object') ? SV.rules : (SV.rules = {});
  if(r.v10) return;
  if(r.turns == null || +r.turns === 12) r.turns = 30;
  if(r.timeLimit == null || +r.timeLimit === 1200) r.timeLimit = 1500;
  r.v10 = 1;
  try{ saveNow(); }catch(e){}
}
function dkfRules(){ return (dkfSvOk() && SV.rules && typeof SV.rules === 'object') ? SV.rules : {}; }
/* v10 で足したキー（人数・開始マーブル）を整える。fixSave は知らないキーをそのまま残すので F5 のあとも生きる */
function dkfNormRules(){
  if(!dkfSvOk()) return null;
  var r = (SV.rules && typeof SV.rules === 'object') ? SV.rules : (SV.rules = {});
  r.n = Math.max(2, Math.min(4, (r.n | 0) || 4));
  r.cashMul = dkfNearMul(r.cashMul);
  return r;
}
/* 応援モード（C25 SV.cheer）＝CPU を1段やさしく。練習では使わない */
function dkfCheerOn(){ return !!(dkfSvOk() && SV.cheer) && !DKF_S.practice; }
function dkfEffAi(){ var a = DKF_S.ai | 0; return dkfCheerOn() ? Math.max(0, a - 1) : a; }
function dkfSyncCfg(){
  if(!dkfSvOk() || typeof cfg !== 'object') return;
  dkfRulesV10();
  var r = dkfNormRules() || {};
  var c = dkClassOf(dkfClsOk(SV.cls));
  DKF_S.mul = dkfNearMul(r.cashMul);
  cfg.cls = c.id; cfg.cash = dkfCashOf(c);
  cfg.turns = dkfNear(DKF_TURNS, r.turns == null ? 30 : r.turns);
  cfg.timeLimit = dkfNear(DKF_TIMES, r.timeLimit == null ? 1500 : r.timeLimit);
  DKF_S.ai = dkfNear(DKF_AIS, r.ai == null ? 1 : r.ai);
  DKF_S.team = !!r.team;
  cfg.ai = DKF_S.ai;
  cfg.shake = !!r.shake;
  var m = dkfMap(SV.lastMap); if(m) cfg.mapId = m.id;
}
/* cfg → セーブ（CPU の強さは応援モードで下げる前の、選んだ値） */
function dkfSaveRules(){
  if(!dkfSvOk()) return;
  SV.rules = Object.assign({}, SV.rules || {}, { turns:cfg.turns, timeLimit:cfg.timeLimit, ai:DKF_S.ai | 0,
    team:!!DKF_S.team, shake:!!cfg.shake, cashMul:dkfMul(), v10:1 });
  /* 人数は「自分で選べる時」だけ覚える（1対1・チーム戦の固定値で上書きしない） */
  if(!dkfNFixed(dkClassOf(cfg.cls))) SV.rules.n = Math.max(2, Math.min(4, cfg.n | 0));
  try{ saveNow(); }catch(e){}
}
function dkfSaveMeta(){
  if(!dkfSvOk()) return;
  dkfSaveRules();
  SV.cls = cfg.cls || 'eco';
  SV.lastMap = cfg.mapId;
  try{ saveNow(); }catch(e){}
}

/* ══════════ 入口（ホームの［入場する］） ══════════ */
function dkFlowStart(){
  dkfSyncCfg();
  DKF_S.practice = false;
  dkFlowClass();
}

/* ══════════ ③ クラス選択 #dkclass（左端にイージー、右上に［練習する］） ══════════ */
function dkfTop(opt){
  return '<div class="dkf-top">'
    + '<div class="dkback" data-dkf-go="' + opt.back + '" data-fx="pop" title="もどる"></div>'
    + '<div class="dkf-ttl" data-fx="pop">' + opt.title + '</div>'
    + (opt.right || '')
    + '</div>';
}
function dkfHomeBtn(){ return '<div class="dkf-home" role="button" data-dkf-go="home" data-fx="pop" title="ホーム">' + dkfSvg('house') + '</div>'; }
function dkfPassHTML(c, cur){
  var n = c.tk ? (dkfTk()[c.tk] | 0) : 0;
  var amt = c.id === 'dia'
    ? '<div class="dkf-pp-amt dkf-pp-dia"><b>ダイヤモンド</b></div>'
    : '<div class="dkf-pp-amt"><b>' + dkfMan(c.cash) + '</b><small>マーブル</small></div>';
  var play = c.id === 'dia' ? '1千万マーブルでゲームスタート' : c.n ? '1対1でプレイ' : 'ゲームプレイ';
  var note = c.tk ? (n > 0 ? '入場券 <em>' + n + '</em>枚' : '入場券は <em>無料</em>でおわたし')
                  : (c.id === 'easy' ? 'はじめての人むけ' : '入場券は いりません');
  var foot = c.tk ? '入場券1枚<br>消費' : '入場無料';
  return '<div class="dkf-pass dkf-t-' + c.id + (cur ? ' dkf-cur' : '') + (c.tk && !n ? ' dkf-notk' : '') + '"'
    + ' role="button" data-dkf-cls="' + c.id + '" data-fx="deal">'
    + '<div class="dkf-pass-body">'
    + '<div class="dkf-pp">'
    +   '<i class="dkf-pp-glow fx-deco"></i>'
    +   '<span class="dkf-pp-sky fx-deco">' + dkfSkyline() + '</span>'
    +   '<div class="dkf-pp-hd"><b class="dkf-pp-rank">' + c.rank + '</b>' + (c.id === 'dia' ? '' : '<span class="dkf-pp-nm">' + c.nm + '</span>')
    +     '<span class="dkf-pp-plane">' + dkfSvg(c.id === 'dia' ? 'gem' : 'plane') + '</span></div>'
    +   '<div class="dkf-pp-en fx-deco">' + c.en + '</div>'
    +   amt
    +   '<div class="dkf-pp-play">' + play + '</div>'
    +   '<div class="dkf-pp-tk">' + note + '</div>'
    +   (cur ? '<i class="fx-gloss dkf-pp-gloss"></i>' : '')
    + '</div>'
    + '<div class="dkf-pb"><span class="dkf-pb-ic">' + dkfSvg(c.tk ? 'ticket' : 'plane') + '</span><span class="dkf-pb-tx">' + foot + '</span></div>'
    + '</div>'
    + (cur ? '<span class="dkf-pass-tag">前回</span>' : '')
    + '</div>';
}
function dkFlowClass(){
  DKF_S.picking = false;               // ポップアップが差し替えられても、クラスを選べなくならないように
  var cur = dkfClsOk(dkfSvOk() ? SV.cls : 'eco'), tk = dkfTk();
  var el = dkMake('dkclass', 'quest',
      dkfTop({ back:'home', title:'<b>クラス選択</b>', right:dkfHomeBtn() })
    + '<div class="dkf-sub">'
    +   '<div class="dkf-olbtn" role="button" id="dkfOnline" data-fx="riseL" data-fx-press>'
    +     '<span class="dkf-olbtn-ic">' + dkfSvg('globe') + '</span>'
    +     '<span class="dkf-olbtn-tx"><b>オンライン対戦</b><small>ともだちと通信で遊ぶ</small></span></div>'
    +   '<div class="dkf-tkbox" data-fx="rise"><b class="dkf-tkbox-hd">入場券</b>'
    +     ['biz', 'first', 'dia'].map(function(k){
            return '<span class="dkf-tkc dkf-t-' + k + '"><i class="dkf-tkc-ic">' + dkfSvg('ticket') + '</i>'
              + '<em>' + DKF_TK_NM[k] + '</em><b>' + tk[k] + '</b></span>';
          }).join('')
    +   '</div>'
    +   '<div class="dkf-practice" role="button" id="dkfPractice" data-fx="riseR" data-fx-press><b>練習する</b><small>一人で遊ぶ</small></div>'
    + '</div>'
    + '<div class="dkf-passes" data-fx-step="60">'
    +   DKF_CLASSES.map(function(c){ return dkfPassHTML(c, c.id === cur); }).join('')
    + '</div>'
    + (typeof walletHTML === 'function' ? walletHTML() : ''));
  el.classList.add('dkf-scr', 'dkf-cls');
  dkfAmb(el);
  dkfWireNav(el);
  el.querySelectorAll('[data-dkf-cls]').forEach(function(b){
    b.onclick = function(){ dkfPickClass(b.getAttribute('data-dkf-cls'), b); };
  });
  var ol = el.querySelector('#dkfOnline');
  if(ol) ol.onclick = dkfOnline;
  var pr = el.querySelector('#dkfPractice');
  if(pr) pr.onclick = dkfPractice;
  screenTo('dkclass');
  return el;
}
async function dkfPickClass(id, node){
  if(DKF_S.picking || DKF_S.busy) return false;
  var c = dkClassOf(id);
  if(c.tk && dkfTk()[c.tk] <= 0){        // 持っていなければ その場で無料で1枚配る（遊べない状態を作らない）
    DKF_S.picking = true;
    var ok = false;
    try{ ok = await dkfGiveTicket(c); }catch(e){ console.error('[WP15a] ticket', e); }
    finally{ DKF_S.picking = false; }
    if(!ok) return false;
  }
  dkfSnd('click');
  cfg.cls = c.id; cfg.cash = dkfCashOf(c);
  if(dkfSvOk()){ SV.cls = c.id; try{ saveNow(); }catch(e){} }
  try{ fxBurst(node, { kind:'star', n:16, power:0.9 }); }catch(e){}
  DKF_S.practice = false;
  dkFlowMap();
  return true;
}
/* 入場券が無い時は、その場で無料で1枚おわたしする（本家の「クラス入場」ポップアップ） */
async function dkfGiveTicket(c){
  var r = await modal('<div class="modal dkf-mod"><div class="fx-panel parch dkf-mod-in dkf-tkbuy-in">'
    + '<b class="dkf-mod-hd">' + c.nm + 'クラス入場</b>'
    + '<div class="dkf-tkbuy"><span class="dkf-tkbuy-art dkf-t-' + c.id + '">' + dkfSvg('ticket') + '</span>'
    +   '<p>' + c.nm + 'クラスの入場券を<br>1枚おわたしします<small>入場券は1枚で1試合遊べます（無料）</small></p></div>'
    + '<div class="dkf-mod-ft"><button class="dkbtn dkf-btn-wood" data-act="no">やめる</button>'
    + '<button class="dkbtn gr dkf-btn-buy" data-act="get"><i class="dkf-ticon">' + dkfSvg('ticket') + '</i>受け取って入場</button></div>'
    + '</div></div>');
  if(r !== 'get') return false;
  dkfTk()[c.tk] += 1;
  try{ saveNow(); }catch(e){}
  try{ dkWallet(); }catch(e){}
  dkfSnd('buy');
  dkfToast('🎫', c.nm + 'の入場券を1枚もらいました', '入場する時に1枚使います', 2000);
  return true;
}
function dkfOnline(){
  if(dkfOnlineOk()){ dkfSnd('click'); try{ ac(); }catch(e){} window.DV_OL_API.open(); return; }
  dkfSnd('warn');
  dkfToast('🌐', 'オンライン対戦は使えません', window.claude
    ? 'この版では通信できません。index.html 版なら遊べます'
    : '通信の部品を読み込めませんでした。ネットにつないで開き直してください', 3000);
}
/* ［練習する］＝一人で遊ぶ（CPU×3・強さ3段。入場券・持ち込み品は使わない） */
async function dkfPractice(){
  if(DKF_S.busy || DKF_S.picking) return;
  dkfSnd('click');
  var map = dkfMap(cfg.mapId), r0 = dkfNormRules() || {};
  var turns = dkfNear(DKF_TURNS, r0.turns == null ? 30 : r0.turns);
  var n = Math.max(2, Math.min(4, (r0.n | 0) || 4));
  var r = await modal('<div class="modal dkf-mod"><div class="fx-panel parch dkf-mod-in dkf-prac-in">'
    + '<b class="dkf-mod-hd">一人で遊ぶ</b>'
    + '<p class="dkf-mod-ds">CPU ' + (n - 1) + '人とすぐに対戦します（' + dkfEsc(map ? map.name : '') + '・' + n + '人・制限ターン ' + turns + '）</p>'
    + '<div class="dkf-prac">' + DKF_PRACTICE.map(function(o, i){
        return '<button type="button" class="dkf-pbtn dkf-pbtn' + i + '" data-act="p' + i + '"><b>' + o[0] + '</b><small>CPU ' + o[1] + '</small></button>';
      }).join('') + '</div>'
    + '<div class="dkf-mod-ft"><button class="dkbtn dkf-btn-wood" data-act="no">やめる</button></div>'
    + '</div></div>');
  if(!r || r.charAt(0) !== 'p') return;
  dkfQuick(+r.slice(1) || 0);
}
function dkfQuick(ai){
  if(DKF_S.busy) return;
  try{ ac(); }catch(e){}
  dkfRulesV10();
  var r = dkfNormRules() || {};
  cfg.turns = dkfNear(DKF_TURNS, r.turns == null ? 30 : r.turns);
  cfg.timeLimit = dkfNear(DKF_TIMES, r.timeLimit == null ? 1500 : r.timeLimit);
  cfg.ai = dkfNear(DKF_AIS, ai);
  DKF_S.mul = dkfNearMul(r.cashMul);
  cfg.cls = 'eco'; cfg.cash = dkfCashOf(dkClassOf('eco'));
  cfg.team = false; cfg.cheer = false;
  cfg.shake = !!r.shake;
  cfg.n = Math.max(2, Math.min(4, (r.n | 0) || 4));      // 選んだ人数で始める（既定は4人）
  cfg.seats = [{ name:dkfMyName(), kind:'you', ch:-1, cardId:null }];
  for(var i = 1; i < 4; i++){
    cfg.seats.push(i < cfg.n ? dkfCpuSeat(i) : { name:'CPU', kind:'cpu', ch:-1, cardId:null, dkfLock:true });
  }
  DKF_S.slots = null;
  DKF_S.practice = true;
  launch({ room:false, practice:true });
}

/* ══════════ ④ マップ選択 #setup（カルーセル＋説明1行＋勝利報酬・参加報酬＋［入場］） ══════════ */
/* マップの色（lake・slab）で菱形の盤を描く。乱数は使わない */
function dkfDrawBoard(cv, map){
  if(!cv || !cv.getContext || !map) return;
  /* スマホは CPU で描く（GPU の canvas は別の層になり、上に重なるマップ名・角の札もすべて層になる） */
  var g = cv.getContext('2d', (typeof DKFX === 'object' && DKFX && DKFX.mob) ? { willReadFrequently: true } : undefined), W = cv.width, H = cv.height;
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
/* マップの説明1行（C09 dkMapInfo の line → 無ければ当作の1行） */
function dkfMapLine(id){
  var inf = null;
  try{ inf = (typeof dkMapInfo === 'function') ? dkMapInfo(id) : null; }catch(e){ inf = null; }
  return (inf && inf.line) ? String(inf.line) : (DKF_MAP_LINE[id] || '');
}
function dkfMapCardHTML(m, i){
  var today = DKF_S.today === m.id;
  return '<div class="dkf-mcard' + (today ? ' dkf-istoday' : '') + '" role="button" data-dkf-map="' + m.id + '" data-dkf-i="' + i + '"'
    + ' style="--dkf-l0:' + m.lake[0] + ';--dkf-l1:' + m.lake[1] + ';--dkf-l2:' + m.lake[2]
    + ';--dkf-st:' + m.slab.top + ';--dkf-ss:' + m.slab.side + '">'
    + '<div class="dkf-mc-fr"><div class="dkf-mc-in">'
    +   '<canvas class="dkf-mcv" width="640" height="380"></canvas>'
    +   '<span class="dkf-mc-emb">' + dkfEmblem(m) + '</span>'
    +   m.corners.map(function(c, k){ return '<span class="dkf-cn dkf-cn' + k + '">' + dkfEsc(c) + '</span>'; }).join('')
    +   '<div class="dkf-mc-nm"><b>' + dkfEsc(m.name) + '</b><i>' + dkfEsc(m.sub) + '</i></div>'
    +   '<i class="fx-gloss dkf-mc-gloss"></i>'
    + '</div></div>'
    + '<div class="dkf-mc-shade"></div>'
    + (today ? '<span class="dkf-today"><i class="dkf-today-ic">' + dkfSvg('crown') + '</i>本日のマップ</span>' : '')
    + '</div>';
}
/* 下段：勝利報酬・参加報酬（×x。ダイヤモンドの勝ちはダイヤ75個） */
function dkfRewardHTML(c){
  var x = +c.x > 0 ? +c.x : 1;
  var win = c.gem ? 'ダイヤ' + c.gem + '個' : dkfG(DKF_WIN_G * x) + 'ゴールド';
  return '<div class="dkf-rw dkf-rw-win" data-fx="riseL"><span class="dkf-rw-art fx-deco">' + dkfPrizeArt(c.gem ? 'gem' : 'chest') + '</span>'
    +   '<span class="dkf-rw-tx"><em>勝利報酬</em><b>' + win + '</b></span></div>'
    + '<div class="dkf-rw dkf-rw-join" data-fx="riseR"><span class="dkf-rw-art fx-deco">' + dkfPrizeArt('cube') + '</span>'
    +   '<span class="dkf-rw-tx"><em>参加報酬</em><b>' + dkfG(DKF_JOIN_G * x) + 'ゴールド＋<br>ウッドキューブ以上</b></span></div>';
}
function dkfMapSig(){ return (cfg.cls || '') + '|' + (cfg.mapId || '') + '|' + (DKF_S.today || ''); }
function dkfBuildMap(){
  var c = dkClassOf(cfg.cls), w = (typeof thisWeek === 'function') ? thisWeek() : null;
  try{ DKF_S.today = (typeof dkTodayMap === 'function') ? String(dkTodayMap() || '') : ''; }catch(e){ DKF_S.today = ''; }
  var el = dkMake('setup', 'quest',
      dkfTop({ back:'class',
        title:'<b>' + c.nm + '</b><span class="dkf-plate">' + dkfMan(dkfCashOf(c)) + '</span>', right:dkfHomeBtn() })
    + '<div class="dkf-ticker" data-fx="rise"><span class="dkf-tk-ic">' + dkfSvg('megaphone') + '</span>'
    +   '<div class="dkf-tk-box"><b class="dkf-tk-tx">' + (w ? ('今週のイベント：' + dkfEsc(w.nm) + ' — ' + dkfEsc(w.ds)) : '') + '</b></div></div>'
    + '<div class="dkf-stagebox">'
    +   '<div class="dkf-carousel">' + MAPS.map(dkfMapCardHTML).join('') + '</div>'
    +   '<div class="dkf-arrow dkf-arrow-l" role="button" data-dkf-step="-1" data-fx="pop" title="前のマップ">' + dkfSvg('left') + '</div>'
    +   '<div class="dkf-arrow dkf-arrow-r" role="button" data-dkf-step="1" data-fx="pop" title="次のマップ">' + dkfSvg('right') + '</div>'
    +   '<div class="dkf-dots">' + MAPS.map(function(m, i){ return '<i data-dkf-dot="' + i + '"></i>'; }).join('') + '</div>'
    + '</div>'
    + '<div class="dkf-mline" data-fx="rise"><b class="dkf-mline-tx"></b></div>'
    + '<div class="dkf-mapfoot">' + dkfRewardHTML(c) + '</div>'
    + '<div class="dkf-enter fx-primary" role="button" id="dkfMkRoom" data-fx="pop" data-fx-press><b>入場</b></div>'
    + (typeof walletHTML === 'function' ? walletHTML() : ''));
  el.classList.add('dkf-scr', 'dkf-map', 'dkf-t-' + c.id);
  el.setAttribute('data-fx-step', '60');
  dkfAmb(el);
  dkfWireNav(el);
  el.querySelectorAll('.dkf-mcard').forEach(function(card){
    var m = dkfMap(card.getAttribute('data-dkf-map'));
    try{ dkfDrawBoard(card.querySelector('canvas'), m); }catch(e){ console.error('[WP15a] board', e); }
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
    if(card.classList.contains('dkf-p0')){ dkfSnd('click'); dkfPop(card, true); return; }
    dkfGoMap(+card.getAttribute('data-dkf-i'));
  });
  var mk = el.querySelector('#dkfMkRoom');
  if(mk) mk.onclick = function(){ dkfSnd('click'); try{ ac(); }catch(e){} launch({ room:true }); };
  try{ fxRays(el.querySelector('.dkf-stagebox'), { tone:'gold' }); }catch(e){}
  DKF_S.mapSig = dkfMapSig();
  renderMaps();
  return el;
}
function dkFlowMap(){
  dkfBuildMap();
  screenTo('setup');
}
/* 起動時：旧 #setup を空にするだけ（見えない画面の canvas を起動時に作らない。開いた時に作る） */
function dkfClearSetup(){
  var el = document.getElementById('setup'); if(!el) return;
  el.innerHTML = '';
  DKF_S.mapSig = '';
}
/* マップ選択を離れたら、盤の小さな絵（canvas 640×380 ×3）の画素を返す（ワイプのあと。次に開く時に作り直す） */
function dkfFreeMapLater(){
  clearTimeout(DKF_S.freeT);
  DKF_S.freeT = setTimeout(function(){
    var el = document.getElementById('setup');
    if(!el || el.classList.contains('on')) return;
    var cvs = el.querySelectorAll('canvas.dkf-mcv'); if(!cvs.length) return;
    cvs.forEach(function(c){ c.width = 0; c.height = 0; });
    DKF_S.mapSig = '';
  }, 900);
}
/* カルーセルの並び（中央＝cfg.mapId）と説明1行。画面ができる前は何もしない */
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
  var ln = el.querySelector('.dkf-mline-tx');
  if(ln) ln.textContent = dkfMapLine(MAPS[ci] ? MAPS[ci].id : cfg.mapId);
}
function dkfGoMap(i){
  if(typeof MAPS === 'undefined' || !MAPS[i]) return;
  if(MAPS[i].id === cfg.mapId) return;
  cfg.mapId = MAPS[i].id;
  if(dkfSvOk()){ SV.lastMap = cfg.mapId; try{ saveNow(); }catch(e){} }
  DKF_S.mapSig = dkfMapSig();
  dkfSnd('click');
  renderMaps();
  var el = document.getElementById('setup');
  var card = el && el.querySelector('.dkf-mcard.dkf-p0');
  if(card) dkfPop(card, true);
  var ln = el && el.querySelector('.dkf-mline-tx');
  if(ln && ln.animate){ try{ ln.animate([{ transform:'translateY(12px)' }, { transform:'none' }], { duration:320, easing:'cubic-bezier(.16,1,.3,1)' }); }catch(e){} }
}
function dkfStepMap(d){
  if(typeof MAPS === 'undefined') return;
  var n = MAPS.length, ci = Math.max(0, MAPS.findIndex(function(m){ return m.id === cfg.mapId; }));
  dkfGoMap(((ci + d) % n + n) % n);
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
      if(b.animate){ try{ b.animate([{ transform:'translateY(26px)' }, { transform:'none' }], { duration:420, easing:'cubic-bezier(.16,1,.3,1)' }); }catch(e){} }
      var ic = el.querySelector('.dkf-tk-ic');
      if(ic && ic.animate){ try{ ic.animate([{ transform:'rotate(0)' }, { transform:'rotate(-12deg)', offset:.3 }, { transform:'rotate(10deg)', offset:.6 }, { transform:'rotate(0)' }], { duration:520 }); }catch(e){} }
    }, 5200);
  }catch(e){}
}

/* ══════════ 対戦の開始（二度押し防止つき） ══════════ */
function dkfTicketOk(c){ return !c.tk || dkfTk()[c.tk] > 0; }
function dkfUseTicket(c){
  if(!c.tk) return false;
  var t = dkfTk(); if(t[c.tk] <= 0) return false;
  t[c.tk] -= 1;
  try{ saveNow(); }catch(e){}
  return true;
}
async function launch(opts){
  opts = opts || {};
  if(DKF_S.busy) return false;
  if(opts.room){
    DKF_S.practice = false;
    DKF_S.roomWait = true;
    var ok;
    try{ ok = await roomPhase(); } finally { DKF_S.roomWait = false; }
    if(!ok){ dkFlowMap(); return false; }
    if(DKF_S.busy) return false;
  }
  var practice = !!(opts.practice || DKF_S.practice);
  var cls = dkClassOf(cfg.cls), used = false;
  DKF_S.busy = true;
  try{
    if(!practice && !dkfTicketOk(cls)){
      dkfSnd('warn');
      dkfToast('🎫', cls.nm + 'の入場券がありません', 'クラス選択で入場券を用意してください', 2800);
      dkFlowClass();
      return false;
    }
    if(typeof cfg.speed === 'number' && cfg.speed > 0) SPEED = cfg.speed;
    if(!practice){
      if(cls.n) cfg.team = false;
      dkfSaveMeta();
      cfg.cheer = dkfCheerOn();
      cfg.ai = dkfEffAi();
    } else cfg.cheer = false;
    await pickPhase();
    await vsScreen();
    await loadingPhase();
    await hideAllScreens();
    if(!practice) used = dkfUseTicket(cls);
    /* 持ち込み品は newGame（WP12 の dkInitPlayers）が受け取り、この1試合で使い切る。練習は持ち込まない */
    var keep = null;
    if(practice && dkfSvOk()){ keep = SV.carry; SV.carry = dkfEmptyCarry(); }
    try{ newGame(); }
    finally{
      if(dkfSvOk()) SV.carry = practice ? keep : dkfEmptyCarry();
      try{ saveNow(); }catch(e){}
    }
    used = false;
    camReset(); updHUD();
    DKF_S.lastPractice = practice;
    await dkOrderOnBoard();
    bgm('game');
    await band('ゲームスタート！', G.map.name + ' — 制限ターン ' + cfg.turns, 1400);
    dkfTutStart();
    turnLoop();
    return true;
  }catch(e){
    console.error('[WP15a] launch', e);
    if(used){ dkfTk()[cls.tk] += 1; try{ saveNow(); }catch(e2){} }      // 始められなかった時は入場券を返す
    if(!G || G.over !== false) try{ dkFlowMap(); }catch(e2){}
    return false;
  }finally{
    DKF_S.busy = false;
  }
}
/* 結果のあとの「同じ部屋へ」。練習のあとはクラス選択へ（練習には部屋が無い） */
function dkFlowRoom(){
  if(DKF_S.lastPractice){ DKF_S.lastPractice = false; DKF_S.practice = false; dkFlowClass(); return Promise.resolve(false); }
  return launch({ room:true });
}

/* カードの割り当て。あなた＝SV.equip／ともだち＝部屋で選んだ物／CPU＝強さの等級 */
function dkfOwned(id){ return !!(dkfSvOk() && SV.cards && SV.cards[id]); }
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

/* ══════════ ⑤ ゲームルーム #room（左ページ＝アイテムと装着／右ページ＝ルールと席） ══════════ */
/* セーブのルールと cfg → 部屋の4席（1席目はあなた。空き席は 🔒。1対1のクラスは2席、チーム戦は4席） */
function dkfRoomInit(){
  var c = dkClassOf(cfg.cls), r = dkfNormRules() || dkfRules();
  DKF_S.practice = false;
  DKF_S.ai = dkfNear(DKF_AIS, r.ai == null ? DKF_S.ai : r.ai);
  DKF_S.team = !!r.team;
  DKF_S.mul = dkfNearMul(r.cashMul);
  cfg.turns = dkfNear(DKF_TURNS, r.turns == null ? 30 : r.turns);
  cfg.timeLimit = dkfNear(DKF_TIMES, r.timeLimit == null ? 1500 : r.timeLimit);
  cfg.shake = !!r.shake;
  cfg.cash = dkfCashOf(c);
  cfg.team = DKF_S.team && !c.n;
  cfg.cheer = dkfCheerOn();
  cfg.ai = dkfEffAi();
  var you = null, rest = [];
  (cfg.seats || []).forEach(function(s){             // 前の試合の席を引き継ぐ（詰め物の CPU は数えない）
    if(!s || s.dkfLock) return;
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
  var want = dkfWantN(c);                            // 人数（1対1は2・チーム戦は4・ほかは選んだ人数）
  for(var i = 1; i < 4; i++){
    if(i < want){ if(slots[i].kind === 'lock') slots[i] = dkfCpuSeat(i); }
    else slots[i] = { kind:'lock', name:'', ch:-1, cardId:null };
  }
  slots.forEach(function(s, k){                      // CPU の顔ぶれは部屋を開くたびに引き直す
    if(s.kind !== 'cpu') return;
    s.cardId = null;
    if(!/^CPU/.test(s.name || '')) s.name = 'CPU ' + DKF_CPU_NM[(k + 2) % 3];
  });
  DKF_S.slots = slots;
  dkfSyncSeats();
}
/* 部屋の席 → cfg.seats（使う席を前に詰める。チーム戦は席の番号がそのままチーム＝席0,2 対 1,3）と cfg.n */
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
function dkfModeHTML(c){
  if(c.n) return '<div class="dkf-rmode dkf-rmode-1v1" data-fx="pop"><b>1対1</b></div>';
  var t = cfg.team ? 1 : 0;
  return '<div class="dkf-rmode" data-fx="pop"><div class="fx-seg dkf-seg dkf-mseg" data-dkf-mode style="--dkf-n:2;--dkf-i:' + t + '">'
    + '<i class="thumb"></i>'
    + '<button type="button" data-dkf-v="0" aria-pressed="' + (t ? 'false' : 'true') + '">個人戦</button>'
    + '<button type="button" data-dkf-v="1" aria-pressed="' + (t ? 'true' : 'false') + '">チーム戦</button></div></div>';
}
function dkfBuildRoom(){
  var c = dkClassOf(cfg.cls), map = dkfMap(cfg.mapId);
  var bgq = (typeof dkU === 'function') ? dkU('bg-quest') : '';
  var el = dkMake('room', 'quest',
      '<div class="dkf-rhd">'
    +   '<div class="dkf-rmap" role="button" data-dkf-go="map" data-fx="pop" title="マップを選びなおす">'
    +     '<span class="dkf-rmap-ic">' + dkfEmblem(map) + '</span><b>' + dkfEsc(map.name) + '</b></div>'
    +   dkfModeHTML(c)
    +   '<div class="dkf-rcls" data-fx="pop"><b>' + c.nm + '</b><span class="dkf-plate">' + dkfMan(cfg.cash) + '</span></div>'
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
  dkfAmb(el);
  dkfWireNav(el);
  var add = el.querySelector('#dkfAdd');
  if(add) add.onclick = function(){
    if(dkfOnlineOk()){ dkfSnd('click'); window.DV_OL_API.open(); return; }
    dkfSnd('click');
    dkfToast('👥', 'この端末で ともだちと遊べます', '席を押して「ともだち」にすると交代で遊べます', 2800);
    var s = el.querySelector('.dkf-seat.dkf-k-cpu, .dkf-seat.dkf-k-lock');
    if(s) dkfPop(s);
  };
  var go = el.querySelector('#dkfGo');
  if(go) go.onclick = function(){ dkfRoomStart(go); };
  el.querySelectorAll('[data-dkf-mode] button').forEach(function(b){
    b.onclick = function(){ dkfSetMode(+b.getAttribute('data-dkf-v') === 1); };
  });
  dkfRenderLeft();
  dkfRenderRules();
  renderSeats();
  return el;
}
/* 個人戦 ⇄ チーム戦（4人固定・席1＋3 対 2＋4） */
function dkfSetMode(team){
  var c = dkClassOf(cfg.cls);
  if(c.n){ dkfSnd('warn'); dkfToast('👥', c.nm + 'は1対1のクラスです', 'チーム戦はほかのクラスで遊べます', 2400); return; }
  team = !!team;
  if(team === !!cfg.team) return;
  dkfSnd('click');
  cfg.team = team; DKF_S.team = team;
  if(team && DKF_S.slots){
    DKF_S.slots.forEach(function(s, i){
      if(i > 0 && s.kind === 'lock'){ DKF_S.slots[i] = { name:'CPU ' + DKF_CPU_NM[(i + 2) % 3], kind:'cpu', ch:-1, cardId:null }; }
    });
  }
  var room = document.getElementById('room');
  var seg = room && room.querySelector('[data-dkf-mode]');
  if(seg){
    seg.style.setProperty('--dkf-i', team ? 1 : 0);
    seg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', (+x.getAttribute('data-dkf-v') === 1) === team ? 'true' : 'false'); });
  }
  dkfSyncSeats();
  renderSeats();
  dkfRenderRules();              // 人数はチーム戦のあいだ4人で固定になる
  dkfSaveRules();
  var box = room && room.querySelector('.dkf-seats');
  if(box) dkfPop(box);
}
function dkfRoomExit(){
  var r = DKF_S.roomRes;
  if(r && DKF_S.roomWait){ r(false); return; }     // 待っている launch が dkFlowMap() へ戻す
  if(r) r(false);
  dkFlowMap();
}
function dkfRoomStart(node){
  var c = dkClassOf(cfg.cls);
  if(cfg.n < 2) return dkfNope(node, '👥', '2人から遊べます', '席を押して CPU か ともだちを入れてください');
  if(cfg.team && cfg.n !== 4) return dkfNope(node, '👥', 'チーム戦は4人で遊びます', '席を押して CPU か ともだちを入れてください');
  if(!dkfTicketOk(c)) return dkfNope(node, '🎫', c.nm + 'の入場券がありません', 'クラス選択で入場券を用意してください');
  var r = DKF_S.roomRes;
  if(!r || DKF_S.busy) return;                   // 二度押し
  dkfSnd('click'); try{ ac(); }catch(e){}
  node.classList.add('dkf-going');
  var waiting = DKF_S.roomWait;
  r(true);
  if(!waiting) launch({ room:false });            // roomPhase() を直接開いた時も始められるように
}

/* ── 左ページ：おすすめアイテム・魔法アイテム・装着情報 ── */
function dkfItemTile(it, k){
  var carry = dkfCarry(), got = !!carry[it.id], g = dkfPrices()[k];
  var no = !got && SV.gold < g;
  var shown = got ? (+carry.paid[it.id] || g) : g;
  return '<div class="dkf-item dkf-it-' + it.id + (got ? ' dkf-got' : '') + (no ? ' dkf-no' : '') + '" role="button" data-dkf-buy="' + it.id + '" data-fx-press>'
    + '<div class="dkf-item-tl">' + dkfItemArt(it.id) + '<b>' + it.br + '</b>'
    +   (got ? '<span class="dkf-chk">' + dkfSvg('check') + '</span>' : '') + '</div>'
    + '<div class="dkf-price"><i class="dkf-coin"></i><b>' + dkfG(shown) + '</b></div>'
    + '</div>';
}
function dkfSlotsN(cardId){               // C06（A＝2・S/S+＝4）
  var n = 4;
  try{ if(typeof dkPendSlots === 'function') n = dkPendSlots(cardId); }catch(e){ n = 4; }
  n = (+n) | 0;
  return Math.max(0, Math.min(4, n || 0));
}
function dkfRenderLeft(){
  var room = document.getElementById('room');
  var pg = room && room.querySelector ? room.querySelector('.dkf-lpage') : null;
  if(!pg || !dkfSvOk()) return;
  var carry = dkfCarry(), m0 = dkfMagicOf(carry.magic);
  var randG = carry.magic ? DKF_REDRAW_G : DKF_RAND_G;
  var angOn = carry.magic === 'angel';
  var c = cardById(SV.equip) || equippedCard(), o = SV.cards[c.id] || { lv:1 };
  var nS = dkfSlotsN(c.id);
  var img = (typeof dkCharImg === 'function') ? dkCharImg(c.id) : '';
  var die = dieById(SV.die), dlv = (SV.dice && SV.dice[die.id]) || 1;
  var pend = '';
  for(var i = 0; i < 4; i++){
    var p = pendById(SV.slots[i]), lk = i >= nS;
    var plv = p && SV.pendants[p.id] ? (SV.pendants[p.id].lv || 1) : 1;
    pend += '<div class="dkf-pslot' + (p ? ' dkf-r' + p.rar : ' dkf-empty') + (lk ? ' dkf-plock' : '') + '" role="button" data-dkf-slot="' + i + '"'
      + ' title="' + (lk ? 'Sクラス以上のカードで開放' : p ? dkfEsc(p.nm) : (i + 1) + '番目の枠') + '">'
      + (p ? '<span class="dkf-pslot-ic">' + dkfPendArt(p.id) + '</span><i>+' + (plv - 1) + '</i>' : (lk ? '' : '<span class="dkf-pslot-plus">＋</span>'))
      + (lk ? '<span class="dkf-pslot-lk">' + dkfSvg('lock') + '</span>' : '')
      + '</div>';
  }
  if(nS < 4) pend += '<span class="dkf-plock-tag" style="--dkf-k:' + nS + '">Sクラス以上で<br>スロット' + (4 - nS) + '個開放</span>';
  /* 能力値：名前は dkStatLabels、基本値＋上乗せ（青い +N） */
  var labels = null;
  try{ labels = (typeof dkStatLabels === 'function') ? dkStatLabels(c.id) : null; }catch(e){ labels = null; }
  if(!Array.isArray(labels) || !labels.length) labels = STAT_LABELS;
  var base = cardStats(c.id, o.lv, []) || {}, tot = cardStats(c.id, o.lv, SV.slots.slice(0, nS)) || base;
  var bars = labels.map(function(kv){
    var v = base[kv[0]] || 0, plus = Math.max(0, (tot[kv[0]] || 0) - v);
    return '<div class="dkf-st"><span class="dkf-st-l">' + dkfEsc(kv[1]) + '</span>'
      + '<span class="dkf-st-t"><i style="transform:scaleX(' + Math.min(1, (v + plus) / 100).toFixed(3) + ')"></i></span>'
      + '<span class="dkf-st-v">' + v + (plus ? '<em>+' + plus + '</em>' : '') + '</span></div>';
  }).join('');
  pg.innerHTML =
      '<div class="dkf-sec">'
    +   '<div class="dkf-sechd"><span class="dkf-tab"><b>おすすめアイテム</b></span><span class="dkf-hint" id="dkfHint">アイテムはゲーム内で使用できます</span></div>'
    +   '<div class="dkf-items">' + DKF_TOP3.map(dkfItemTile).join('') + '</div>'
    + '</div>'
    + '<div class="dkf-sec">'
    +   '<div class="dkf-sechd"><span class="dkf-tab"><b>魔法アイテム</b></span></div>'
    +   '<div class="dkf-magic">'
    +     '<div class="dkf-fcard' + (m0 ? ' dkf-on dkf-fc-' + m0.id : '') + '" role="button" id="dkfFcard" data-fx-press>'
    +       (m0 ? '<span class="dkf-fc-top">装着中</span>' : '') + dkfItemArt(m0 ? m0.id : '') + '<b>' + (m0 ? m0.nm : '未装着') + '</b></div>'
    +     '<div class="dkf-mtx"><b>フォーチュンカード1枚<br>装着してゲームに<br>参加ができます</b></div>'
    +     '<div class="dkf-mbtns">'
    +       '<div class="dkf-mb dkf-mb-blue' + (SV.gold < randG ? ' dkf-no' : '') + '" role="button" id="dkfRand" data-fx-press>'
    +         '<b>ランダムカード</b><span class="dkf-price"><i class="dkf-coin"></i><b>' + dkfG(randG) + '</b></span></div>'
    +       '<div class="dkf-mb dkf-mb-gold' + (angOn ? ' dkf-got' : '') + (!angOn && SV.gem < DKF_ANGEL_GEM ? ' dkf-no' : '') + '" role="button" id="dkfAngel" data-fx-press>'
    +         '<b>天使カード</b><span class="dkf-price"><small>すぐ購入</small><i class="dkf-gemic"></i><b>' + DKF_ANGEL_GEM + '</b></span></div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="dkf-sec dkf-sec-eq">'
    +   '<div class="dkf-sechd"><span class="dkf-tab"><b>装着情報</b></span><span class="dkf-hint">タッチすると変更できます</span></div>'
    +   '<div class="dkf-eq">'
    +     '<div class="dkf-eqcard dkf-r' + c.rar + '" role="button" id="dkfEqCard">'
    +       '<span class="dkf-eqimg"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>'
    +         (img ? '' : '<canvas width="240" height="340"></canvas>') + '</span>'
    +       '<span class="dkf-eqlv">' + o.lv + '</span><span class="dkf-chg">変更</span></div>'
    +     '<div class="dkf-eqr">'
    +       '<div class="dkf-eqtop">'
    +         '<div class="dkf-pends">' + pend + '</div>'
    +         '<div class="dkf-eqdice" role="button" id="dkfEqDice">'
    +           '<span class="dkf-dice">' + dkfDieArt(die.id) + '</span>'
    +           '<span class="dkf-eqdice-tx"><b>' + dkfEsc(die.nm) + '</b><i>Lv.' + dlv + '</i></span><span class="dkf-chg">変更</span></div>'
    +       '</div>'
    +       '<div class="dkf-stats">' + bars + '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>';
  if(!img){ var cv = pg.querySelector('.dkf-eqimg canvas'); if(cv) regPortrait(cv, c.art, c.col, c.id); }
  pg.querySelectorAll('[data-dkf-buy]').forEach(function(b){
    b.onclick = function(){ dkfBuyItem(b.getAttribute('data-dkf-buy'), b); };
  });
  var rb = pg.querySelector('#dkfRand'); if(rb) rb.onclick = function(){ dkfRandCard(); };
  var ab = pg.querySelector('#dkfAngel'); if(ab) ab.onclick = function(){ dkfBuyAngel(ab); };
  var fc = pg.querySelector('#dkfFcard');
  if(fc) fc.onclick = function(){
    var mm = dkfMagicOf(dkfCarry().magic);
    dkfSnd('click');
    if(mm) dkfToast('🃏', mm.nm + 'を装着中', mm.ds, 2200);
    else dkfToast('🃏', 'フォーチュンカードは未装着です', 'ランダムカードか天使カードで1枚装着できます', 2400);
  };
  pg.querySelectorAll('[data-dkf-slot]').forEach(function(b){
    b.onclick = function(){ dkfSnd('click'); slotPicker(+b.getAttribute('data-dkf-slot'), dkfAfterEquip); };
  });
  var ec = pg.querySelector('#dkfEqCard'); if(ec) ec.onclick = function(){ dkfCardPick(0); };
  var ed = pg.querySelector('#dkfEqDice'); if(ed) ed.onclick = function(){ dkfSnd('click'); dicePicker(dkfAfterEquip); };
}
function dkfAfterEquip(){ dkfSyncSeats(); dkfRenderLeft(); renderSeats(); }
/* 見出しの横の説明を少しの間だけ差し替える（本家の吹き出しの代わり） */
function dkfHint(txt){
  var h = document.getElementById('dkfHint'); if(!h) return;
  h.textContent = txt;
  clearTimeout(DKF_S.hintT);
  DKF_S.hintT = setTimeout(function(){ var x = document.getElementById('dkfHint'); if(x) x.textContent = 'アイテムはゲーム内で使用できます'; }, 2600);
}
function dkfFly(tile, gem){
  try{ dkWallet(); }catch(e){}
  if(!tile) return;
  try{
    fxCoins(fxWalletEl(gem ? 'gem' : 'gold'), tile, { kind:gem ? 'gem' : 'coin', n:6, dur:560 })
      .then(function(){ if(tile.isConnected) fxBurst(tile, { kind:'star', n:12, power:0.8 }); });
  }catch(e){}
}
/* おすすめアイテム：押すと購入、もう一度押すとキャンセル（払った額を全額返す） */
function dkfBuyItem(id, node){
  var k = -1;
  for(var i = 0; i < DKF_TOP3.length; i++) if(DKF_TOP3[i].id === id) k = i;
  if(k < 0 || !dkfSvOk()) return;
  var it = DKF_TOP3[k], carry = dkfCarry(), g = dkfPrices()[k];
  if(carry[id]){
    var back = +carry.paid[id] || g;
    carry[id] = false; delete carry.paid[id];
    SV.gold += back;
    try{ saveNow(); }catch(e){}
    dkfSnd('click');
    dkfToast('↩', it.nm + 'をキャンセルしました', 'ゴールド ' + dkfG(back) + ' を返しました', 1800);
    dkfRenderLeft(); try{ dkWallet(); }catch(e){}
    return;
  }
  if(SV.gold < g) return dkfNope(node, '🪙', 'ゴールドが足りません', it.nm + 'は ' + dkfG(g) + 'ゴールドです');
  SV.gold -= g; carry[id] = true; carry.paid[id] = g;
  try{ saveNow(); }catch(e){}
  dkfSnd('buy');
  dkfRenderLeft();
  dkfHint(it.ds);
  var room = document.getElementById('room');
  dkfFly(room && room.querySelector('[data-dkf-buy="' + id + '"]'), false);
}
/* ランダムカード（500。装着中なら300）：4種から1枚。［選択］か［再購入 300］（再購入すると獲得したカードは消える） */
function dkfDrawMagic(){ return DKF_MAGIC[(Math.random() * DKF_MAGIC.length) | 0].id; }
function dkfRandHTML(id){
  var m = dkfMagicOf(id) || DKF_MAGIC[0];
  return '<div class="modal dkf-mod"><div class="fx-panel parch dkf-mod-in dkf-rand-in">'
    + '<div class="dkf-rand-hd"><b class="dkf-mod-hd dkf-rand-ttl">' + m.nm + '</b>'
    +   '<button type="button" class="dkf-mod-x" data-act="ok" aria-label="とじる"><i></i></button></div>'
    + '<div class="dkf-rand-bd">'
    +   '<div class="dkf-rand-card dkf-fc-' + m.id + '"><span class="dkf-fc-top">フォーチュン</span>' + dkfItemArt(m.id) + '<b>' + m.nm + '</b></div>'
    +   '<div class="dkf-rand-tx"><b class="dkf-rand-got">“' + m.nm + '”獲得!</b>'
    +     '<span class="dkf-rand-ds">' + m.ds + '</span>'
    +     '<em>気に入らないと再購入!</em><small>再購入すると獲得したカードは消えます</small></div>'
    + '</div>'
    + '<div class="dkf-mod-ft dkf-rand-ft"><button class="dkbtn gr dkf-rand-ok" data-act="ok">選択</button>'
    + '<button type="button" class="dkbtn dkf-btn-orange" id="dkfReRand"><span>再購入</span><i class="dkf-coin"></i><b>' + DKF_REDRAW_G + '</b></button></div>'
    + '</div></div>';
}
function dkfRandPaint(id){
  var body = document.getElementById('modalBody'); if(!body) return;
  var m = dkfMagicOf(id) || DKF_MAGIC[0];
  var card = body.querySelector('.dkf-rand-card');
  if(card){
    card.className = 'dkf-rand-card dkf-fc-' + m.id;
    card.innerHTML = '<span class="dkf-fc-top">フォーチュン</span>' + dkfItemArt(m.id) + '<b>' + m.nm + '</b>';
    if(card.animate){ try{ card.animate([{ transform:'scaleX(1)' }, { transform:'scaleX(.06)', offset:.45 }, { transform:'scaleX(1)' }], { duration:420, easing:'ease-in-out' }); }catch(e){} }
  }
  var t = body.querySelector('.dkf-rand-ttl'); if(t) t.textContent = m.nm;
  var g = body.querySelector('.dkf-rand-got'); if(g) g.textContent = '“' + m.nm + '”獲得!';
  var d = body.querySelector('.dkf-rand-ds'); if(d) d.textContent = m.ds;
}
async function dkfRandCard(){
  if(DKF_S.randBusy || !dkfSvOk()) return;
  var carry = dkfCarry(), price = carry.magic ? DKF_REDRAW_G : DKF_RAND_G;
  var room = document.getElementById('room'), btn = room && room.querySelector('#dkfRand');
  if(SV.gold < price) return dkfNope(btn, '🪙', 'ゴールドが足りません', 'ランダムカードは ' + dkfG(price) + 'ゴールドです');
  DKF_S.randBusy = true;
  try{
    SV.gold -= price;
    carry.magic = dkfDrawMagic();
    try{ saveNow(); }catch(e){}
    try{ dkWallet(); }catch(e){}
    dkfSnd('cardIn');
    dkfRenderLeft();
    var p = modal(dkfRandHTML(carry.magic));
    var re = document.querySelector('#modalBody #dkfReRand');
    if(re) re.onclick = function(){
      var cc = dkfCarry();
      if(SV.gold < DKF_REDRAW_G){ dkfSnd('warn'); try{ fxShake(re, 240); }catch(e){} dkfToast('🪙', 'ゴールドが足りません', '再購入は ' + DKF_REDRAW_G + 'ゴールドです', 2200); return; }
      SV.gold -= DKF_REDRAW_G;
      cc.magic = dkfDrawMagic();
      try{ saveNow(); }catch(e){}
      try{ dkWallet(); }catch(e){}
      dkfSnd('cardIn');
      dkfRandPaint(cc.magic);
      dkfRenderLeft();
    };
    await p;
  }catch(e){ console.error('[WP15a] rand', e); }
  finally{ DKF_S.randBusy = false; }
  dkfRenderLeft();
  var fc = room && room.querySelector('#dkfFcard');
  if(fc){ dkfPop(fc, true); try{ fxBurst(fc, { kind:'star', n:14, power:0.9 }); }catch(e){} }
}
/* 天使カード すぐ購入（ダイヤ5） */
function dkfBuyAngel(node){
  if(!dkfSvOk()) return;
  var carry = dkfCarry(), m = dkfMagicOf('angel');
  if(carry.magic === 'angel'){ dkfSnd('click'); dkfToast('😇', '天使カードを装着中です', m.ds, 2000); return; }
  if(SV.gem < DKF_ANGEL_GEM) return dkfNope(node, '💎', 'ダイヤが足りません', '出席簿とミッションでもらえます');
  var had = dkfMagicOf(carry.magic);
  SV.gem -= DKF_ANGEL_GEM; carry.magic = 'angel';
  try{ saveNow(); }catch(e){}
  dkfSnd('buy');
  dkfRenderLeft();
  if(had) dkfToast('😇', '天使カードを装着しました', had.nm + 'は外れました', 2200);
  var room = document.getElementById('room');
  dkfFly(room && room.querySelector('#dkfFcard'), true);
}

/* ── 右ページ：ルール（.fx-seg。短縮ルール・終盤インフレは札で分かるように） ── */
function dkfSegHTML(key, label, list, cur, off){
  var ci = Math.max(0, list.findIndex(function(o){ return o[0] === cur; }));
  return '<div class="dkf-rule dkf-rule-' + key + '"><span class="dkf-rule-lb">' + label + '</span>' + dkfSegOnly(key, list, ci, off) + '</div>';
}
function dkfSegOnly(key, list, ci, off){
  return '<div class="fx-seg dkf-seg' + (off ? ' dkf-seg-off' : '') + '" data-dkf-rule="' + key + '" style="--dkf-n:' + list.length + ';--dkf-i:' + ci + '">'
    + '<i class="thumb"></i>'
    + list.map(function(o, i){
        return '<button type="button" data-dkf-v="' + o[0] + '" aria-pressed="' + (i === ci ? 'true' : 'false') + '">' + o[1] + '</button>';
      }).join('')
    + '</div>';
}
function dkfRuleChips(){
  var short = cfg.turns < 30 || cfg.timeLimit === 900 || cfg.timeLimit === 1200;
  return (short ? '<span class="dkf-rchip dkf-rchip-short">短縮ルール（当作）</span>' : '')
    + (cfg.turns === 12 ? '<span class="dkf-rchip dkf-rchip-infl">終盤インフレ（当作ルール）</span>' : '')
    + (cfg.shake ? '<span class="dkf-rchip dkf-rchip-shake">揺らす（当作ルール）</span>' : '');
}
function dkfCheerHTML(){
  if(!dkfCheerOn()) return '';
  return '<span class="dkf-cheer"><i class="dkf-cheer-ic">' + dkfSvg('star') + '</i>'
    + '<span class="dkf-cheer-tx"><b>応援モード</b><small>CPU が1段よわい</small></span></span>';
}
function dkfRenderRules(){
  var room = document.getElementById('room');
  var box = room && room.querySelector ? room.querySelector('.dkf-rules') : null;
  if(!box) return;
  var nFix = dkfNFixed(dkClassOf(cfg.cls));
  box.innerHTML = '<div class="dkf-rules-hd"><span class="dkf-tab"><b>ルール</b></span><span class="dkf-rchips">' + dkfRuleChips() + '</span></div>'
    + '<div class="dkf-rules-row">'
    +   dkfSegHTML('turns', 'ターン数', DKF_TURNS, cfg.turns)
    +   dkfSegHTML('time', '制限時間（分）', DKF_TIMES, cfg.timeLimit)
    +   dkfSegHTML('ai', 'CPUの強さ', DKF_AIS, DKF_S.ai | 0)
    + '</div>'
    + '<div class="dkf-rules-row">'
    +   dkfSegHTML('n', '人数', DKF_NS, Math.max(2, Math.min(4, cfg.n | 0)), nFix)
    +   dkfSegHTML('cash', '開始マーブル（当作ルール）', DKF_MULS, dkfMul())
    +   dkfSegHTML('shake', '揺らす', DKF_SHAKE, cfg.shake ? 1 : 0)
    +   dkfCheerHTML()
    + '</div>';
  box.querySelectorAll('.dkf-seg button').forEach(function(b){
    b.onclick = function(){
      var seg = b.parentNode, key = seg.getAttribute('data-dkf-rule'), v = +b.getAttribute('data-dkf-v');
      if(dkfSetRule(key, v) === false) return;
      seg.querySelectorAll('button').forEach(function(x, i){
        var on = x === b; x.setAttribute('aria-pressed', on ? 'true' : 'false');
        if(on) seg.style.setProperty('--dkf-i', i);
      });
      var ch = box.querySelector('.dkf-rchips');
      if(ch) ch.innerHTML = dkfRuleChips();
    };
  });
}
/* 人数（①）：席の 🔒 を開け閉めして cfg.n とそろえる */
function dkfSetN(n){
  var c = dkClassOf(cfg.cls);
  if(dkfNFixed(c)){
    dkfSnd('warn');
    dkfToast('👥', c.n ? c.nm + 'は1対1のクラスです' : 'チーム戦は4人で遊びます', '人数はほかの遊び方で選べます', 2400);
    return false;
  }
  var S = DKF_S.slots;
  if(!S) return false;
  n = Math.max(2, Math.min(4, n | 0));
  for(var i = 1; i < 4; i++){
    if(i < n){ if(S[i].kind === 'lock') S[i] = dkfCpuSeat(i); }
    else S[i] = { kind:'lock', name:'', ch:-1, cardId:null };
  }
  dkfSyncSeats();
  renderSeats();
  var box = document.querySelector('#room .dkf-seats');
  if(box) dkfPop(box);
  return true;
}
/* 開始マーブル（③）：クラスの額 × 倍率を cfg.cash に入れ、上の札も書き換える */
function dkfSetMul(v){
  DKF_S.mul = dkfNearMul(v);
  cfg.cash = dkfCashOf(dkClassOf(cfg.cls));
  var pl = document.querySelector('#room .dkf-rcls .dkf-plate');
  if(pl){ pl.textContent = dkfMan(cfg.cash); dkfPop(pl); }
  var info = document.querySelector('#room .dkf-cinfo');
  if(info) renderSeats();
}
/* 席を押して人数が変わった時に、人数の帯をそろえる */
function dkfSyncNSeg(){
  var seg = document.querySelector('#room .dkf-seg[data-dkf-rule="n"]');
  if(!seg) return;
  var n = Math.max(2, Math.min(4, cfg.n | 0)), ci = 0;
  DKF_NS.forEach(function(o, i){ if(o[0] === n) ci = i; });
  seg.style.setProperty('--dkf-i', ci);
  seg.querySelectorAll('button').forEach(function(x, i){ x.setAttribute('aria-pressed', i === ci ? 'true' : 'false'); });
}
function dkfSetRule(key, v){
  if(key === 'n'){ if(dkfSetN(v) === false) return false; }
  else if(key === 'cash') dkfSetMul(v);
  else if(key === 'turns') cfg.turns = v;
  else if(key === 'time') cfg.timeLimit = v;
  else if(key === 'ai'){ DKF_S.ai = v; cfg.ai = dkfEffAi(); }
  else if(key === 'shake') cfg.shake = !!v;
  dkfSaveRules();
  dkfSnd('click');
  if(key === 'ai' && DKF_S.slots){
    DKF_S.slots.forEach(function(s){ if(s.kind === 'cpu') s.cardId = null; });
    dkfSyncSeats(); renderSeats();
  }
  return true;
}

/* ── 右ページ：席（白い札＋左の色タグ。チーム戦は赤チーム2人・VS・青チーム2人） ── */
function dkfSeatHTML(s, i, tm){
  var k = s.kind, team = tm === 0 || tm === 1, tcls = team ? ' dkf-tm' + tm : '';
  if(k === 'lock'){
    return '<div class="rm-seat dkf-seat dkf-k-lock' + tcls + '" role="button" data-dkf-seat="' + i + '" data-fx="riseR">'
      + '<span class="dkf-slock">' + dkfSvg('lock') + '</span>'
      + '<b class="dkf-slock-tx">あいている席</b><small class="dkf-slock-sub">タップで CPU を入れる</small></div>';
  }
  var cc = cardById(s.cardId) || CARDPOOL[i % CARDPOOL.length];
  var tag = k === 'you' ? '<span class="dkf-stag-ic">' + dkfSvg('house') + '</span><b>部屋主</b>'
          : k === 'cpu' ? '<span class="dkf-stag-cpu">CPU</span><b>' + DKF_AIS[cfg.ai | 0][1] + '</b>'
          : '<span class="dkf-stag-fr">' + dkfSvg('pen') + '</span><b>ともだち</b>';
  var btns = k === 'cpu' ? '<span class="dkf-shint">タップで ともだちに</span>'
    : '<span class="dkf-sbtns">'
      + (k === 'you' && team ? '<span class="dkf-sb dkf-sb-team" role="button" data-dkf-team="1">' + dkfSvg('swap') + '<b>チーム<br>変更</b></span>' : '')
      + (k === 'human' ? '<span class="dkf-sb" role="button" data-dkf-name="' + i + '">' + dkfSvg('pen') + '<b>名前</b></span>' : '')
      + '<span class="dkf-sb" role="button" data-dkf-card="' + i + '">' + dkfSvg('card') + '<b>カード</b></span></span>';
  return '<div class="rm-seat dkf-seat dkf-k-' + (k === 'human' ? 'fr' : k) + tcls + '" role="button" data-dkf-seat="' + i + '" data-fx="riseR">'
    + '<div class="dkf-stag">' + tag + '</div>'
    + '<div class="fc"><canvas class="sp" data-art="' + cc.art + '" data-col="' + cc.col + '" data-card="' + cc.id + '" width="200" height="220"></canvas></div>'
    + '<div class="dkf-snm"><b>' + dkfEsc(s.name || '') + '</b><i>' + dkfEsc(cc.nm) + '（' + RAR[cc.rar].nm + '）'
    +   (s.trial ? '<em>おためし</em>' : '') + '</i></div>'
    + btns
    + '</div>';
}
/* 1対1のクラスの説明（本家の「★ダイヤモンドクラスとは?」。案内役の絵は使わない） */
function dkfClassInfoHTML(c){
  var lines = c.id === 'dia'
    ? ['勝利ボーナスはダイヤモンド', '1対1でプレイ', '参加報酬は ゴールド／キューブ']
    : ['はじめての人むけの入門クラス', '1対1でプレイ', dkfMan(cfg.cash) + 'マーブルでゲームスタート'];
  return '<div class="dkf-cinfo dkf-t-' + c.id + '">'
    + '<div class="dkf-cinfo-hd"><i class="dkf-cinfo-star">' + dkfSvg('star') + '</i><b>' + c.nm + (c.id === 'dia' ? 'クラス' : '') + 'とは？</b>'
    +   (c.gem ? '<span class="dkf-cinfo-rw"><em>勝利報酬</em><i class="dkf-gemic"></i><b>' + c.gem + '</b></span>' : '') + '</div>'
    + '<ol>' + lines.map(function(t, i){ return '<li><em>' + (i + 1) + '.</em>' + t + '</li>'; }).join('') + '</ol>'
    + '</div>';
}
function renderSeats(){
  var room = document.getElementById('room');
  var box = room && room.querySelector ? room.querySelector('.dkf-seats') : null;
  if(!box || typeof DKF_S !== 'object' || !DKF_S || !DKF_S.slots) return;
  var c = dkClassOf(cfg.cls), team = !!cfg.team && !c.n, S = DKF_S.slots, h;
  if(c.n) h = dkfSeatHTML(S[0], 0, -1) + dkfSeatHTML(S[1], 1, -1) + dkfClassInfoHTML(c);
  else if(team) h = [0, 2, 1, 3].map(function(i){ return dkfSeatHTML(S[i], i, i % 2); }).join('') + '<span class="dkf-vs fx-deco">VS</span>';
  else h = S.map(function(s, i){ return dkfSeatHTML(s, i, -1); }).join('');
  box.innerHTML = h;
  box.classList.toggle('dkf-team', team);
  box.classList.toggle('dkf-one', !!c.n);
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
  box.querySelectorAll('[data-dkf-team]').forEach(function(b){
    b.onclick = function(e){ e.stopPropagation(); dkfSwapTeam(); };
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
  if(sub) sub.textContent = off ? 'もう1人入れてください' : cfg.team ? 'チーム戦 2対2' : cfg.n === 2 ? '1対1で対戦' : cfg.n + '人で対戦';
}
/* 席を押すたびに CPU → ともだち → 🔒 → CPU（1席目はあなた＝カードを変える。チーム戦・1対1は 🔒 にしない） */
function dkfCycleSeat(i){
  if(!DKF_S.slots || !DKF_S.slots[i]) return;
  if(i === 0){ dkfCardPick(0); return; }
  var c = dkClassOf(cfg.cls);
  if(c.n && i > 1) return;
  var noLock = !!c.n || !!cfg.team;
  var s = DKF_S.slots[i];
  if(s.kind === 'cpu'){ s.kind = 'human'; s.name = 'ともだち' + (i + 1); s.cardId = null; s.trial = false; }
  else if(s.kind === 'human' && !noLock){ s.kind = 'lock'; s.cardId = null; s.trial = false; }
  else { s.kind = 'cpu'; s.name = 'CPU ' + DKF_CPU_NM[(i + 2) % 3]; s.cardId = null; s.trial = false; }
  dkfSnd(s.kind === 'lock' ? 'click' : 'cardIn');
  dkfSyncSeats();
  renderSeats();
  dkfSyncNSeg();                 // 席の 🔒 と「人数」を連動させる
  dkfSaveRules();
  var room = document.getElementById('room');
  var p = room && room.querySelector('[data-dkf-seat="' + i + '"]');
  if(p) dkfPop(p);
}
/* チーム戦の［チーム 変更］：味方（席3）と相手（席2）を入れ替える */
function dkfSwapTeam(){
  var S = DKF_S.slots; if(!S || !cfg.team) return;
  var t = S[1]; S[1] = S[2]; S[2] = t;
  dkfSnd('cardIn');
  dkfSyncSeats();
  renderSeats();
  var room = document.getElementById('room');
  ['1', '2'].forEach(function(k){ var p = room && room.querySelector('[data-dkf-seat="' + k + '"]'); if(p) dkfPop(p); });
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

/* ══════════ ペンダントの枠・サイコロの付け替え（王宮のモーダル。WP3#4） ══════════ */
function slotPicker(slot, after){
  slot = Math.max(0, Math.min(3, slot | 0));
  var done = function(){ try{ if(after) after(); }catch(e){ console.error('[WP15a] slot', e); } };
  if(!dkfSvOk()) return Promise.resolve(null);
  var nS = dkfSlotsN(SV.equip);
  if(slot >= nS){
    dkfSnd('warn');
    dkfToast('🔒', (slot + 1) + '番目の枠はまだ使えません', 'Sクラス以上のカードを装着すると スロット' + (4 - nS) + '個開放', 2600);
    return Promise.resolve(null);
  }
  var owned = PENDANTS.filter(function(p){ return SV.pendants && SV.pendants[p.id]; });
  var cur = pendById(SV.slots[slot]);
  var tiles = '<div class="dkf-ptile dkf-ptile-off" data-act="off"><span class="dkf-ptile-art dkf-ptile-x"><i></i></span><b>外す</b><em>空き枠にする</em></div>'
    + owned.map(function(p){
        var at = SV.slots.indexOf(p.id), lv = (SV.pendants[p.id] && SV.pendants[p.id].lv) || 1;
        return '<div class="dkf-ptile dkf-r' + p.rar + (at === slot ? ' dkf-sel' : '') + '" data-act="p:' + p.id + '">'
          + '<span class="dkf-ptile-art">' + dkfPendArt(p.id) + '</span>'
          + '<b>' + dkfEsc(p.nm) + '</b>'
          + '<em><i class="dkf-rar dkf-rar-' + p.rar + '">' + RAR[p.rar].nm + '</i>+' + (lv - 1) + '</em>'
          + (at >= 0 && at !== slot ? '<span class="dkf-ptile-used">' + (at + 1) + '番に装着中</span>' : '')
          + (at === slot ? '<span class="dkf-ptile-on">装着中</span>' : '')
          + '</div>';
      }).join('');
  var body = owned.length ? '<div class="dkf-pgrid">' + tiles + '</div>'
    : '<p class="dkf-mod-empty">まだペンダントを持っていません。<br>ガチャか対戦の報酬で手に入ります。</p>';
  var p = modal('<div class="modal dkf-mod"><div class="fx-panel parch dkf-mod-in dkf-slot-in">'
    + '<b class="dkf-mod-hd">' + (slot + 1) + '番目の枠に付けるペンダント</b>'
    + body
    + '<p class="dkf-mod-ds">' + (cur ? '<b>' + dkfEsc(cur.nm) + '</b>' + dkfEsc(cur.ds) : '空き枠です。付けたいペンダントを選んでください') + '</p>'
    + '<div class="dkf-mod-ft"><button class="dkbtn gd" data-act="close">閉じる</button></div>'
    + '</div></div>');
  return p.then(function(r){
    if(r === 'off'){ SV.slots[slot] = null; try{ saveNow(); }catch(e){} }
    else if(r && r.indexOf('p:') === 0){
      var id = r.slice(2);
      if(pendById(id) && SV.pendants[id]){
        var at = SV.slots.indexOf(id);
        if(at >= 0 && at !== slot) SV.slots[at] = SV.slots[slot] || null;     // ほかの枠の物は入れ替える（二重装着にしない）
        SV.slots[slot] = id;
        try{ saveNow(); }catch(e){}
        dkfSnd('cardIn');
      }
    }
    done();
    return r;
  });
}
function dicePicker(after){
  var done = function(){ try{ if(after) after(); }catch(e){ console.error('[WP15a] dice', e); } };
  if(!dkfSvOk()) return Promise.resolve(null);
  var tiles = DICE.map(function(d){
    var have = !!(SV.dice && SV.dice[d.id]), lv = have ? (SV.dice[d.id] | 0) || 1 : 0, rr = d.rar === 'S+' ? 'SS' : d.rar;
    return '<div class="dkf-dtile dkf-r' + rr + (SV.die === d.id ? ' dkf-sel' : '') + (have ? '' : ' dkf-dnone') + '"'
      + (have ? ' data-act="d:' + d.id + '"' : ' role="button" data-dkf-die="' + d.id + '"') + '>'
      + '<span class="dkf-dtile-art">' + dkfDieArt(d.id) + '</span>'
      + '<b>' + dkfEsc(d.nm) + '</b>'
      + '<em>' + (have ? '<i class="dkf-rar dkf-rar-' + rr + '">' + d.rar + '</i>Lv.' + lv : '未所持') + '</em>'
      + (SV.die === d.id ? '<span class="dkf-ptile-on">装着中</span>' : '')
      + '</div>';
  }).join('');
  var cur = dieById(SV.die);
  var p = modal('<div class="modal dkf-mod"><div class="fx-panel parch dkf-mod-in dkf-dice-in">'
    + '<b class="dkf-mod-hd">使うサイコロを選ぶ</b>'
    + '<div class="dkf-dgrid">' + tiles + '</div>'
    + '<p class="dkf-mod-ds"><b>' + dkfEsc(cur.nm) + '</b>' + dkfEsc(cur.ds) + '</p>'
    + '<div class="dkf-mod-ft"><button class="dkbtn gd" data-act="close">閉じる</button></div>'
    + '</div></div>');
  document.querySelectorAll('#modalBody [data-dkf-die]').forEach(function(b){
    b.onclick = function(){
      var d = dieById(b.getAttribute('data-dkf-die'));
      dkfSnd('warn');
      try{ fxShake(b, 220); }catch(e){}
      dkfToast('🎲', 'まだ持っていません', d.nm + 'はガチャで手に入ります', 2200);
    };
  });
  return p.then(function(r){
    if(r && r.indexOf('d:') === 0){
      var id = r.slice(2);
      if(SV.dice && SV.dice[id]){ SV.die = id; try{ saveNow(); }catch(e){} dkfSnd('cardIn'); }
    }
    done();
    return r;
  });
}

/* ══════════ チュートリアル（J53）：未完了の人の最初の1試合だけ、盤の上に短い案内（操作は止めない）。
   試合を終えたら tutorial=1・ダイヤモンドの入場券+1（2回目は無い） ══════════ */
function dkfTutPending(){
  if(!dkfSvOk()) return false;
  if(SV.tutorial === 0) return true;
  if(SV.tutorial === undefined || SV.tutorial === null) return !((SV.plays | 0) > 0);
  return false;
}
function dkfMeIdx(){
  if(!G || !G.players) return -1;
  for(var i = 0; i < G.players.length; i++) if(G.players[i] && G.players[i].kind === 'you') return i;
  return -1;
}
function dkfTutStart(){
  dkfTutStop();
  DKF_S.tut = null;
  if(!dkfTutPending() || !G) return;
  var me = dkfMeIdx(); if(me < 0) return;
  DKF_S.tut = { g:G, me:me, step:0, shown:-1, hideAt:0 };
  try{ dkEvery('dkfTut', dkfTutTick, 600, { keep:true }); }catch(e){}
}
function dkfTutTick(){
  var T = DKF_S.tut;
  if(!T || !G || G !== T.g || G.over){ dkfTutStop(); return; }
  if(T.shown >= 0){
    if(Date.now() >= T.hideAt){ dkfTutHide(); T.shown = -1; T.step++; }
    return;
  }
  if(T.step >= DKF_TUT.length){ try{ dkEvery('dkfTut', null); }catch(e){} return; }
  if(document.querySelector('.screen.on')) return;           // 画面（ミニゲームなど）が出ている間は待つ
  var p = G.players[T.me]; if(!p) return;
  var ok = false;
  if(T.step === 0) ok = G.turn === T.me;
  else if(T.step === 1) ok = (p.pos | 0) !== 0 || (p.laps | 0) > 0;
  else if(T.step === 2) ok = (G.tiles || []).some(function(t){ return t && t.owner === T.me; }) || (cfg.turns - G.turnsLeft) >= 2;
  else ok = (cfg.turns - G.turnsLeft) >= 3;
  if(ok) dkfTutShow(T.step);
}
function dkfTutShow(k){
  var T = DKF_S.tut, st = document.getElementById('stage');
  if(!T || !st || !DKF_TUT[k]) return;
  var el = document.getElementById('dkfTut');
  if(!el){ el = document.createElement('div'); el.id = 'dkfTut'; el.className = 'dkf-tut'; el.setAttribute('aria-live', 'polite'); st.appendChild(el); }
  var s = DKF_TUT[k];
  el.innerHTML = '<span class="dkf-tut-ic">' + dkfSvg('star') + '</span>'
    + '<span class="dkf-tut-tx"><em>チュートリアル ' + (k + 1) + '/' + DKF_TUT.length + '</em><b>' + s.t + '</b><small>' + s.s + '</small></span>';
  el.classList.add('on');
  if(el.animate){ try{ el.animate([{ transform:'translateX(-50%) translateY(-16px) scale(.96)' }, { transform:'translateX(-50%) translateY(0) scale(1)' }],
    { duration:340, easing:'cubic-bezier(.34,1.56,.64,1)' }); }catch(e){} }
  T.shown = k; T.hideAt = Date.now() + 7000;
}
function dkfTutHide(){ var el = document.getElementById('dkfTut'); if(el) el.classList.remove('on'); }
function dkfTutStop(){ try{ dkEvery('dkfTut', null); }catch(e){} dkfTutHide(); }
/* 'match:end'（grantRewards）で完了。chips に1行足す（C20）。grantRewards は match:end の前に plays を増やすので plays は見ない */
function dkfTutDone(payload){
  var T = DKF_S.tut;
  if(!T || !G || T.g !== G) return;
  DKF_S.tut = null;
  dkfTutStop();
  if(!dkfSvOk() || SV.tutorial === 1) return;
  if(payload && payload.me !== undefined && payload.me !== T.me) return;
  SV.tutorial = 1;
  dkfTk().dia += 1;
  try{ saveNow(); }catch(e){}
  if(payload && Array.isArray(payload.chips)) payload.chips.push({ ic:'🎫', label:'ダイヤ入場券', v:'+1' });
}

/* 戻る・ホームの配線（data-dkf-go）と常設バー（walletHTML）の＋ */
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
  el.querySelectorAll('.wallet').forEach(function(w){
    try{ dkWire(w); }catch(e){ console.error('[WP15a] wallet', e); }
  });
}
/* ホームの［入場する］が旧 screenTo('setup') のままなら dkFlowStart に付けかえる */
function dkfWireEnter(){
  var go = document.getElementById('dkEnter');
  if(!go || typeof go.onclick !== 'function') return;
  if(!/screenTo\(\s*['"]setup['"]\s*\)/.test(String(go.onclick))) return;
  go.onclick = function(){ dkfSnd('click'); try{ ac(); }catch(e){} dkFlowStart(); };
}
/* v9 の部屋で買った持ち込み（SV.bag）は v10 の対戦で使わないので、1回だけ払い戻す（損をさせない） */
function dkfRefundBag(){
  if(!dkfSvOk() || !Array.isArray(SV.bag) || !SV.bag.length) return;
  var g = 0, d = 0;
  SV.bag.forEach(function(id){
    if(id === 'angel') d += DKF_ANGEL_GEM;
    else g += (typeof shopPrice === 'function') ? (+shopPrice(id) || 0) : 0;
  });
  SV.bag = [];
  SV.gold = (SV.gold | 0) + g; SV.gem = (SV.gem | 0) + d;
  try{ saveNow(); }catch(e){}
  if(g || d) setTimeout(function(){ dkfToast('↩', '前の版の持ち込みアイテムを払い戻しました', (g ? 'ゴールド ' + dkfG(g) : '') + (g && d ? '・' : '') + (d ? 'ダイヤ ' + d : ''), 3200); }, 1200);
}

/* ══════════ 起動 ══════════ */
(function(){
  try{
    dkfSyncCfg();
    cfg.team = false;                    // チーム戦は部屋で選んだ時だけ（オンライン・練習に持ち込まない）
    dkfRefundBag();
    dkfClearSetup();
    dkOn('screen', function(e){
      if(!e) return;
      if(e.changed) dkfTutHide();
      if(e.id !== 'setup'){ if(e.changed) dkfFreeMapLater(); return; }
      if(e.changed && DKF_S.mapSig !== dkfMapSig()) dkfBuildMap();
      if(e.changed) dkfTickerStart();
    });
    dkOn('match:end', function(p){ try{ dkfTutDone(p); }catch(err){ console.error('[WP15a] tut', err); } });
    if(typeof showHome === 'function'){
      var home0 = showHome;
      showHome = function(){
        var r = home0.apply(this, arguments);
        try{ dkfWireEnter(); }catch(err){ console.error('[WP15a]', err); }
        return r;
      };
    }
    document.addEventListener('keydown', function(e){
      var s = document.getElementById('setup'), mw = document.getElementById('modalWrap');
      if(!s || !s.classList.contains('on') || (mw && mw.classList.contains('on'))) return;
      if(e.key === 'ArrowLeft') dkfStepMap(-1);
      else if(e.key === 'ArrowRight') dkfStepMap(1);
    });
  }catch(e){ console.error('[WP15a]', e); }
})();
