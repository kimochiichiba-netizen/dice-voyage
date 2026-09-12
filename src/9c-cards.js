
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — カード・サイコロ・図鑑・アルバム（9c-cards.js / WP2）
   ──────────────────────────────────────────────────────────────
   ・showCards / showDice を宣言し直す（8-dk.js の同名関数に後勝ち）。
   ・drawDice は代入ラッパで包む（元の関数を必ず呼び、描き足すだけ）。
   ・トップレベルは function 宣言と DKC_ 付きの var と、最後の初期化 IIFE だけ。
   ・演出の乱数は DKFX.rnd()。強化・合成の抽選だけは Math.random（台本で種を固定できる）。
   ・CSS は 1m-cards.html（#cards / #dice / .dkc- だけ）。
   ══════════════════════════════════════════════════════════════ */

/* ══════════ 定数 ══════════ */
var DKC_CAP    = { A:20, S:25, SS:30 };          // 等級ごとの Lv 上限
var DKC_MATEXP = { A:300, S:600, SS:1000 };      // 素材1枚の EXP（同じカードなら×2）
var DKC_TCOEF  = { A:1, S:1.3, SS:1.6 };         // 強化費の対象係数
var DKC_RANK   = { A:0, S:1, SS:2 };
var DKC_ROLL   = [ { k:'Success', m:1,   p:0.70 },
                   { k:'Great',   m:1.5, p:0.22 },
                   { k:'Excellent', m:2, p:0.08 } ];
var DKC_MAXMAT = 5;
var DKC_MIXCOST = { A:8000, S:20000 };           // 合成の費用（A+A→S / S+S→SS）
var DKC_DCOST  = [780, 1010, 1420, 1990, 2780, 3900, 5450, 9800, 12270];   // サイコロ Lv1→2 … 9→10（合計 39,400G）
var DKC_BOOKRW = [
  { n:6,  key:'cb6',  kind:'gold', v:5000, nm:'5,000 ゴールド' },
  { n:12, key:'cb12', kind:'gem',  v:10,   nm:'ダイヤ 10個' },
  { n:18, key:'cb18', kind:'pend', v:1,    nm:'好きなペンダント1つ' },
  { n:24, key:'cb24', kind:'title', v:'蒐集王', nm:'称号「蒐集王」' }
];
var DKC_ALBUMS = [
  { id:'al1', nm:'闘の系譜',     cards:['c01','c03','c05','c17'], rw:{ kind:'gold+gem', g:10000, d:10 }, rnm:'10,000G＋ダイヤ10' },
  { id:'al2', nm:'水鏡の静けさ', cards:['c02','c18','c20','c04'], rw:{ kind:'pend', rar:'SS' },          rnm:'S+ ペンダント' },
  { id:'al3', nm:'盗みの流儀',   cards:['c08','c11','c13','c24'], rw:{ kind:'die', id:'d4', g:30000 },    rnm:'亡者のサイコロ' },
  { id:'al4', nm:'職人組合',     cards:['c06','c22','c09','c15'], rw:{ kind:'pend', rar:'S' },           rnm:'S ペンダント' },
  { id:'al5', nm:'玉座の間',     cards:['c23','c21','c19','c14'], rw:{ kind:'card', rar:'SS' },          rnm:'S+ カード1枚' },
  { id:'al6', nm:'賭けの女神',   cards:['c07','c10','c12','c16'], rw:{ kind:'gold', g:30000 },           rnm:'30,000G' }
];
var DKC_CTABS = [
  { id:'own',   nm:'所持' }, { id:'up', nm:'強化' }, { id:'mix', nm:'合成' },
  { id:'book',  nm:'図鑑' }, { id:'album', nm:'アルバム' }
];
var DKC_DTABS = [
  { id:'dice', nm:'サイコロ' }, { id:'up', nm:'強化' }, { id:'kiwami', nm:'極' }, { id:'book', nm:'図鑑' }
];
/* サイコロの粒・軌跡・着地音（G05）：種類ごとに形と音を変える。
   tr＝軌跡（w＝太さの倍率／dash＝点線／add＝光を足す描き方） */
var DKC_DPART = {
  d0:{ k:'wood', nm:'木くず',       tr:{ w:0.8,  dash:false, add:false } },
  d1:{ k:'coin', nm:'金貨',         tr:{ w:1.15, dash:false, add:true } },
  d2:{ k:'led',  nm:'光の点',       tr:{ w:0.7,  dash:false, add:true } },
  d3:{ k:'suit', nm:'トランプの札', tr:{ w:1,    dash:true,  add:false } },
  d4:{ k:'wisp', nm:'紫の鬼火',     tr:{ w:1.3,  dash:false, add:true } }
};
/* サイコロの能力（J42）の Lv1値・MAX値。本物は WP12a の DKCORE_DIEAB（C05）。無い間だけこの表で見せる */
var DKC_DAB = { d0:{}, d1:{ fortune:[5, 20], gauge:[6, 25] }, d2:{ build:[5, 20], gauge:[5, 20], gold:[5, 20] },
                d3:{ mini:[8, 30], oddeven:[1, 1] }, d4:{ buyout:[6, 25], rp:[6, 25] } };
var DKC_ABNM = { mini:['ミニゲーム勝利', 'p'], fortune:['黄金フォーチュン', 'p'], build:['建設費用割引', 'p'], gauge:['ゲージインパクト', 'p'],
                 buyout:['買収費用割引', 'p'], gold:['ゴールドボーナス', '%'], rp:['RPボーナス', '%'], oddeven:['偶数奇数', '回'] };
/* ══════════════════════════════════════════════════════════════
   増やしたぶん（社長のご要望 2026-09-12）
   ──────────────────────────────────────────────────────────────
   DKC_DADD  サイコロ 5種→8種（粒・軌跡・着地音・色・能力を1つずつ変える）
   DKC_SKADD カードの能力 11種→20種（効き目は既にある仕掛け＝eff を使い回し、
             強さ x と発動する時 when の組み合わせと名前を変える。新しい発動は足さない）
   DKC_SKMAP カード24枚 → 能力の番号（20種を全部使い、4枚だけ同じ能力を分け合う）
   ══════════════════════════════════════════════════════════════ */
var DKC_DADD = [
  { id:'d5', nm:'桜花のサイコロ', ic:'🌸', rar:'S',  col:'#FFB7D5', gauge:6,
    ds:'黄金フォーチュンとミニゲームに強い。振ると桜が舞う。',
    ab:{ fortune:[4, 16], mini:[6, 24] },
    part:{ k:'petal', nm:'桜の花びら', tr:{ w:1, dash:false, add:false } }, tint:{ c:'#FF8FC0' } },
  { id:'d6', nm:'機巧のサイコロ', ic:'⚙️', rar:'S+', col:'#C8D8E8', gauge:10,
    ds:'建設費用を大きく削る。振ると歯車が回る。',
    ab:{ build:[7, 28], gauge:[4, 16] },
    part:{ k:'gear', nm:'歯車', tr:{ w:0.9, dash:true, add:false } }, tint:{ c:'#8FA8C0' } },
  { id:'d7', nm:'星霜のサイコロ', ic:'🌟', rar:'S+', col:'#FFE27A', gauge:7,
    ds:'ゴールドと RP のボーナスが大きい。振ると星の砂が散る。',
    ab:{ gold:[7, 28], rp:[7, 28] },
    part:{ k:'starp', nm:'星の砂', tr:{ w:1.2, dash:false, add:true } }, tint:{ c:'#FFD24D' } }
];
var DKC_SKADD = [
  { when:'own',    eff:'tollUp',   x:1.30, ic:'📈', nm:'地脈の高騰',   txt:'所有している地域の通行料が30%値上げ' },
  { when:'own',    eff:'tollUp',   x:1.50, ic:'🌋', nm:'暴騰の呪',     txt:'所有している地域の通行料が50%値上げ' },
  { when:'build',  eff:'buildCut', x:0.70, ic:'🧱', nm:'堅実な普請',   txt:'建設費用が30%割引になります' },
  { when:'build',  eff:'buildCut', x:0.25, ic:'🏗', nm:'神速の職人',   txt:'建設費用が75%割引になります' },
  { when:'buyout', eff:'buyCut',   x:0.70, ic:'🤝', nm:'値切りの舌',   txt:'買収費用が30%割引になります' },
  { when:'buyout', eff:'buyCut',   x:0.25, ic:'💼', nm:'強奪の商談',   txt:'買収費用が75%割引になります' },
  { when:'arrive', eff:'steal',    x:0.25, ic:'🗝', nm:'大盗の手',     txt:'相手の所持マーブルの25%を奪います' },
  { when:'salary', eff:'salary',   x:1.50, ic:'🌬', nm:'黄金の追い風', txt:'スタート地点を通過すると給料の150%を獲得' },
  { when:'toll',   eff:'free',     x:0,    ic:'💠', nm:'絶対防壁',     txt:'通行料が免除されます' }
];
var DKC_SKMAP = { c01:12, c02:0,  c03:4,  c04:1,  c05:9,  c06:5,  c07:7,  c08:10,
                  c09:13, c10:19, c11:2,  c12:6,  c13:17, c14:11, c15:1,  c16:10,
                  c17:9,  c18:3,  c19:16, c20:2,  c21:15, c22:14, c23:8,  c24:18 };
/* サイコロを DICE へ足し、読み込みのときに「知らない id」として落ちた分をセーブへ戻す
   （5-meta.js の loadSave は 9c より前に走る） */
function dkcAddDice(){
  if(typeof DICE === 'undefined' || !Array.isArray(DICE)) return;
  var added = 0;
  DKC_DADD.forEach(function(o){
    if(!DICE.some(function(x){ return x.id === o.id; })){
      DICE.push({ id:o.id, nm:o.nm, ic:o.ic, rar:o.rar, col:o.col, ds:o.ds, gauge:o.gauge, dbl:0, big:0 });
      added++;
    }
    if(!DKC_DPART[o.id]) DKC_DPART[o.id] = o.part;
    if(!DKC_DTINT[o.id]) DKC_DTINT[o.id] = o.tint;
    if(!DKC_DAB[o.id]) DKC_DAB[o.id] = o.ab;
    /* 対戦の中の能力（C05）も同じ表で動くようにする。無い版では画面だけ DKC_DAB で出す */
    try{ if(typeof DKCORE_DIEAB === 'object' && DKCORE_DIEAB && !DKCORE_DIEAB[o.id]) DKCORE_DIEAB[o.id] = o.ab; }catch(e){}
  });
  if(!added) return;
  /* 9b が先にペンダントを直して saveNow する。その前の写し（DKP_RAW0）から読む */
  var raw = (typeof DKP_RAW0 === 'string') ? DKP_RAW0 : null;
  if(raw === null){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){ raw = null; } }
  if(!raw) return;
  var s = null;
  try{ s = JSON.parse(raw); }catch(e){ s = null; }
  if(!s || typeof s !== 'object') return;
  var ok = function(id){ return typeof id === 'string' && DKC_DADD.some(function(x){ return x.id === id; }); }, ch = false;
  var sd = (s.dice && typeof s.dice === 'object') ? s.dice : {};
  Object.keys(sd).forEach(function(id){
    if(!ok(id) || SV.dice[id]) return;
    var v = sd[id];
    if(v && typeof v === 'object') v = v.lv;
    SV.dice[id] = Math.max(1, Math.min(10, (+v) | 0 || 1)); ch = true;
  });
  if(ok(s.die) && SV.dice[s.die] && SV.die === 'd0'){ SV.die = s.die; ch = true; }
  var kw = (s.kiwami && typeof s.kiwami === 'object') ? s.kiwami : {};
  Object.keys(kw).forEach(function(id){
    if(!ok(id) || SV.kiwami[id]) return;
    if(kw[id] === 'atk' || kw[id] === 'def'){ SV.kiwami[id] = kw[id]; ch = true; }
  });
  (Array.isArray(s.seen) ? s.seen : []).forEach(function(id){
    if(ok(id) && SV.seen.indexOf(id) < 0){ SV.seen.push(id); ch = true; }
  });
  if(ch) saveNow();
}
/* カードの能力を 11種→20種に。仕組み（DKCORE_SKILL・WP12a）が無い版では何もしない */
function dkcAddSkills(){
  var S = null;
  try{ S = (typeof DKCORE_SKILL === 'object' && DKCORE_SKILL) ? DKCORE_SKILL : null; }catch(e){ S = null; }
  if(!Array.isArray(S) || S.length < 11) return;
  if(S.length === 11) DKC_SKADD.forEach(function(o){ S.push(o); });
  if(S.length < 20) return;
  CARDPOOL.forEach(function(c){
    var k = DKC_SKMAP[c.id];
    if(typeof k === 'number' && S[k]) c.kind = k;
  });
}
/* そのカードが本当に使う能力（画面と対戦をそろえる）。仕組みが無い版は表の文をそのまま出す */
function dkcSkillOf(id){
  var c = dkcCard(id);
  if(!c) return null;
  var S = null;
  try{ S = (typeof DKCORE_SKILL === 'object' && DKCORE_SKILL) ? DKCORE_SKILL[c.kind] : null; }catch(e){ S = null; }
  var W = { toll:'通行料を払う時', own:'通行料を受け取る時', salary:'スタートを通過した時',
            start:'手番のはじめ', arrive:'マスに止まった時', build:'建設する時', buyout:'買収する時' };
  if(!S || !S.nm) return { nm:c.sk.nm, label:c.sk.nm, ds:c.sk.ds, ic:'✨', when:'対戦中' };
  var jail = '孤立地域';
  try{ if(G && G.map && G.map.corners && G.map.corners[1]) jail = G.map.corners[1]; }catch(e){}
  return { nm:c.sk.nm, label:String(S.nm).replace('{jail}', jail),
           ds:String(S.txt).replace('{jail}', jail).replace('{x}', String(S.x)),
           ic:S.ic || '✨', when:(W[S.when] || '対戦中') };
}
var DKC_DP = [];                                   // 盤の上のサイコロの粒（転がる間 8個まで・着地 16個）
var DKC_DFX = { anim:null, last:0, emit:0, land:false, burstN:0, sndN:0, maxRoll:0, spr:null, nz:null };
/* 画面の状態（セーブには入れない） */
var DKC_S = {
  tab:'own', sel:null, upSel:null, mats:{}, mixA:null, mixB:null, bookSel:null,
  dtab:'dice', dsel:null, busy:false, scroll:{}, lastC:'', lastD:'', imgs:{}, onScr:''
};

/* ══════════ 小さな道具 ══════════ */
function dkcFmt(v){ return Math.round(v || 0).toLocaleString(); }
function dkcRarNm(r){ return r === 'SS' ? 'S+' : r; }
function dkcCard(id){ return cardById(id) || null; }
function dkcOwn(id){ return (SV.cards && SV.cards[id]) || null; }
function dkcCap(c){ return DKC_CAP[c.rar] || 20; }
function dkcNeed(lv){ return 60 + lv * 20; }
function dkcCoin(){ return '<i class="dkc-ico dkcoin"></i>'; }
function dkcGemI(){ return '<i class="dkc-ico dkgem"></i>'; }
function dkcScreenOn(id){ var e = document.getElementById(id); return !!(e && e.classList.contains('on')); }
function dkcSfx(n, v){ try{ if(SFX && SFX[n]) SFX[n](v); }catch(e){} }
function dkcWarn(ttl, sub){ dkcSfx('warn'); try{ toast('L', '⚠️', esc(ttl), esc(sub || ''), 2000); }catch(e){} }
/* 等級の札（S+ / S / A） */
function dkcRar(r, cls){ return '<span class="dkc-rar dkc-g' + r + (cls ? ' ' + cls : '') + '">' + dkcRarNm(r) + '</span>'; }
/* カードの絵（立ち絵 c / コマ t） */
function dkcArt(id){ return dkCharImg(id) || ''; }
function dkcFace(id){ return dkCharImg('t' + id.slice(1)) || dkCharImg(id) || ''; }

/* ══════════ 絵文字に頼らない小さなアイコン（SVG。色は #dkcDefs のグラデ） ══════════ */
function dkcSvg(k){
  var S = '<svg class="dkc-svg" viewBox="0 0 48 48" aria-hidden="true">', E = '</svg>', ink = 'stroke="#2A1604" stroke-width="2.4" stroke-linejoin="round"';
  if(k === 'cards') return S
    + '<rect x="6" y="11" width="21" height="29" rx="4" transform="rotate(-13 16 25)" fill="url(#dkcGw)" ' + ink + '/>'
    + '<rect x="18" y="7" width="23" height="32" rx="4" fill="url(#dkcGg)" ' + ink + '/>'
    + '<path d="M29.5 14.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8z" fill="#FFF7DC" stroke="#7A4A06" stroke-width="1.2"/>' + E;
  if(k === 'up') return S
    + '<path d="M24 5L42 24H31V42H17V24H6Z" fill="url(#dkcGe)" ' + ink + '/>'
    + '<path d="M24 11L34 22" stroke="#E6FFC8" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"/>' + E;
  if(k === 'mix') return S
    + '<rect x="4" y="16" width="16" height="23" rx="3" transform="rotate(-18 12 27)" fill="url(#dkcGb)" ' + ink + '/>'
    + '<rect x="28" y="16" width="16" height="23" rx="3" transform="rotate(18 36 27)" fill="url(#dkcGp)" ' + ink + '/>'
    + '<path d="M24 3l3.2 7.4 7.8 1-5.8 5.3 1.6 7.8L24 20.5l-6.8 4 1.6-7.8L13 11.4l7.8-1z" fill="url(#dkcGg)" ' + ink + '/>' + E;
  if(k === 'book') return S
    + '<path d="M24 13C18 8.5 10 8.5 4 11V40C10 37.5 18 37.5 24 42Z" fill="url(#dkcGp)" ' + ink + '/>'
    + '<path d="M24 13C30 8.5 38 8.5 44 11V40C38 37.5 30 37.5 24 42Z" fill="url(#dkcGb)" ' + ink + '/>'
    + '<path d="M9 17C13 15.6 17 15.8 20 17.4M9 23C13 21.6 17 21.8 20 23.4M28 17.4C31 15.8 35 15.6 39 17M28 23.4C31 21.8 35 21.6 39 23" stroke="#FFF1D0" stroke-width="1.8" fill="none" opacity=".75"/>' + E;
  if(k === 'album') return S
    + '<rect x="7" y="5" width="34" height="38" rx="5" fill="url(#dkcGr)" ' + ink + '/>'
    + '<rect x="12" y="11" width="10" height="12" rx="2" fill="url(#dkcGg)" stroke="#5A3A04" stroke-width="1.4"/>'
    + '<rect x="26" y="11" width="10" height="12" rx="2" fill="url(#dkcGg)" stroke="#5A3A04" stroke-width="1.4"/>'
    + '<rect x="12" y="27" width="10" height="12" rx="2" fill="url(#dkcGg)" stroke="#5A3A04" stroke-width="1.4"/>'
    + '<rect x="26" y="27" width="10" height="12" rx="2" fill="#3A0D0A" stroke="#5A3A04" stroke-width="1.4"/>' + E;
  if(k === 'dice') return S
    + '<path d="M24 5L42 14L24 23L6 14Z" fill="#FFF7EE" ' + ink + '/>'
    + '<path d="M6 14L24 23V43L6 34Z" fill="#F2C8C4" ' + ink + '/>'
    + '<path d="M42 14L24 23V43L42 34Z" fill="#D89AA2" ' + ink + '/>'
    + '<ellipse cx="24" cy="14" rx="3.6" ry="2.1" fill="#C9302C"/>'
    + '<circle cx="11" cy="22" r="2" fill="#8E1410"/><circle cx="19" cy="34" r="2" fill="#8E1410"/>'
    + '<circle cx="29" cy="25" r="2" fill="#6A0E0C"/><circle cx="37" cy="31" r="2" fill="#6A0E0C"/><circle cx="33" cy="28" r="2" fill="#6A0E0C"/>' + E;
  if(k === 'kiwami') return S
    + '<path d="M5 36L8 14L17 24L24 7L31 24L40 14L43 36Z" fill="url(#dkcGg)" ' + ink + '/>'
    + '<rect x="5" y="35" width="38" height="7" rx="2" fill="url(#dkcGw)" ' + ink + '/>'
    + '<path d="M24 20L28 26L24 32L20 26Z" fill="url(#dkcGr)" stroke="#5A0A08" stroke-width="1.4"/>' + E;
  if(k === 'pend') return S
    + '<path d="M14 6Q24 22 34 6" fill="none" stroke="#C8952F" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M24 17L36 28L24 44L12 28Z" fill="url(#dkcGb)" ' + ink + '/>'
    + '<path d="M24 20L31 28L24 31L17 28Z" fill="#EAF8FF" opacity=".7"/>' + E;
  if(k === 'crown') return S
    + '<path d="M6 34L9 13L18 23L24 8L30 23L39 13L42 34Z" fill="url(#dkcGg)" ' + ink + '/>'
    + '<circle cx="24" cy="26" r="3.4" fill="url(#dkcGr)" stroke="#5A0A08" stroke-width="1.2"/>'
    + '<path d="M8 38H40" stroke="#7A4A06" stroke-width="4" stroke-linecap="round"/>' + E;
  if(k === 'lock') return S
    + '<path d="M15 21V15a9 9 0 0118 0v6" fill="none" stroke="#C8952F" stroke-width="4.2" stroke-linecap="round"/>'
    + '<rect x="10" y="20" width="28" height="22" rx="5" fill="url(#dkcGg)" ' + ink + '/>'
    + '<circle cx="24" cy="29" r="3" fill="#3A2405"/><path d="M24 30V36" stroke="#3A2405" stroke-width="3" stroke-linecap="round"/>' + E;
  if(k === 'shop') return S
    + '<path d="M7 18H41L38 42H10Z" fill="url(#dkcGw)" ' + ink + '/>'
    + '<path d="M16 18V13a8 8 0 0116 0v5" fill="none" stroke="#2A1604" stroke-width="3"/>'
    + '<path d="M18 26h12" stroke="#FFF1D0" stroke-width="2.4" stroke-linecap="round"/>' + E;
  if(k === 'sword') return S
    + '<path d="M36 6L42 6L42 12L20 34L14 28Z" fill="url(#dkcGr)" ' + ink + '/>'
    + '<path d="M11 25L23 37M13 35L7 41" stroke="#2A1604" stroke-width="4" stroke-linecap="round"/>' + E;
  if(k === 'shield') return S
    + '<path d="M24 5L40 11V23C40 33 33 40 24 43C15 40 8 33 8 23V11Z" fill="url(#dkcGb)" ' + ink + '/>'
    + '<path d="M24 11V37M14 20H34" stroke="#EAF8FF" stroke-width="2.4" opacity=".7"/>' + E;
  return S + E;
}
/* SVG のグラデ定義（ドキュメントに1回だけ置く） */
function dkcDefs(){
  if(document.getElementById('dkcDefs')) return;
  var g = function(id, a, b, c){
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/>'
      + '<stop offset=".5" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient>';
  };
  var d = document.createElement('div');
  d.id = 'dkcDefs'; d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  d.innerHTML = '<svg width="0" height="0"><defs>'
    + g('dkcGg', '#FFF3C8', '#F2C230', '#A9761A') + g('dkcGw', '#E8C98A', '#A8752A', '#5A3A0A')
    + g('dkcGe', '#D8FFB0', '#5FBF3A', '#22610E') + g('dkcGb', '#CDEBFF', '#2E8BE0', '#0B2C5E')
    + g('dkcGp', '#F0DDFF', '#9A62E0', '#3E1480') + g('dkcGr', '#FFB6A8', '#C9302C', '#5A0A08')
    + '</defs></svg>';
  document.body.appendChild(d);
}

/* ══════════════════════════════════════════════════════════════
   カード：強化（経験値）・合成・図鑑・アルバムの計算
   ══════════════════════════════════════════════════════════════ */
/* いまの lv/exp に add の EXP を足したらどうなるか（上限で止め、余りは捨てる） */
function dkcSim(id, add){
  var c = dkcCard(id), o = dkcOwn(id);
  var lv = o ? o.lv : 1, exp = o ? (o.exp || 0) : 0, cap = c ? dkcCap(c) : 20;
  if(lv >= cap) return { lv:lv, exp:exp, capped:true, wasted:add, up:0 };
  exp += Math.max(0, Math.round(add));
  var from = lv;
  while(lv < cap && exp >= dkcNeed(lv)){ exp -= dkcNeed(lv); lv++; }
  var wasted = 0;
  if(lv >= cap){ wasted = exp; exp = 0; }
  return { lv:lv, exp:exp, capped:lv >= cap, wasted:wasted, up:lv - from };
}
/* 素材1枚の EXP と費用 */
function dkcMatExp(tid, mid){ var m = dkcCard(mid); return m ? DKC_MATEXP[m.rar] * (mid === tid ? 2 : 1) : 0; }
function dkcMatCost(tid, mid){
  var t = dkcCard(tid), m = dkcCard(mid); if(!t || !m) return 0;
  var d = DKC_RANK[m.rar] - DKC_RANK[t.rar];
  return Math.round(800 * DKC_TCOEF[t.rar] * (d < 0 ? 0.7 : d === 0 ? 1 : 1.8));
}
/* 素材の候補（重なりのあるカード）。同じカードを先頭、あとは等級の高い順 */
function dkcMatList(tid){
  return CARDPOOL.filter(function(c){ var o = dkcOwn(c.id); return o && (o.dup | 0) > 0; })
    .sort(function(a, b){
      if(a.id === tid) return -1; if(b.id === tid) return 1;
      return (DKC_RANK[b.rar] - DKC_RANK[a.rar]) || (a.id < b.id ? -1 : 1);
    });
}
function dkcMatN(){ var n = 0; Object.keys(DKC_S.mats).forEach(function(k){ n += DKC_S.mats[k] | 0; }); return n; }
/* 選んだ素材を、今の持ち数に合わせて整える（重なりが減った・対象が変わった時） */
function dkcMatClean(){
  Object.keys(DKC_S.mats).forEach(function(k){
    var o = dkcOwn(k), n = DKC_S.mats[k] | 0;
    n = Math.min(n, o ? (o.dup | 0) : 0);
    if(n > 0) DKC_S.mats[k] = n; else delete DKC_S.mats[k];
  });
  var over = dkcMatN() - DKC_MAXMAT;
  Object.keys(DKC_S.mats).reverse().forEach(function(k){
    while(over > 0 && DKC_S.mats[k] > 0){ DKC_S.mats[k]--; over--; }
    if(!DKC_S.mats[k]) delete DKC_S.mats[k];
  });
}
/* 強化の見積もり：{ok, reason, n, base, cost, res:{Success,Great,Excellent}} */
function dkcUpPlan(tid){
  var c = dkcCard(tid), o = dkcOwn(tid);
  var p = { ok:false, reason:'', n:0, base:0, cost:0, res:{} };
  if(!c || !o){ p.reason = 'このカードを持っていません'; return p; }
  var cap = dkcCap(c);
  if(o.lv >= cap){ p.reason = o.lv > cap ? ('Lv.' + o.lv + ' は ' + dkcRarNm(c.rar) + 'クラスの上限 Lv.' + cap + ' をこえています。これ以上は強化できません')
                                         : ('Lv.' + cap + '（' + dkcRarNm(c.rar) + 'クラスの上限）です。合成で上の等級をめざせます'); p.max = true; return p; }
  Object.keys(DKC_S.mats).forEach(function(k){
    var n = DKC_S.mats[k] | 0; if(n <= 0) return;
    p.n += n; p.base += dkcMatExp(tid, k) * n; p.cost += dkcMatCost(tid, k) * n;
  });
  DKC_ROLL.forEach(function(r){ p.res[r.k] = dkcSim(tid, p.base * r.m); });
  if(p.n <= 0){ p.reason = '素材を1枚以上えらんでください（重なりのカードが素材になります）'; return p; }
  if(SV.gold < p.cost){ p.reason = 'ゴールドが ' + dkcFmt(p.cost - SV.gold) + ' 足りません'; return p; }
  p.ok = true;
  return p;
}
function dkcRoll(){
  var r = Math.random(), acc = 0;
  for(var i = 0; i < DKC_ROLL.length; i++){ acc += DKC_ROLL[i].p; if(r < acc) return DKC_ROLL[i]; }
  return DKC_ROLL[0];
}
/* 初めて上限に届いたら、等級ごとにペンダントを1つ（A→A／S→S／S+→S+）。1枚につき1回 */
function dkcRandPend(rar){
  var pool = PENDANTS.filter(function(p){ return p.rar === rar; });
  if(!pool.length) pool = PENDANTS.slice();
  return pool[(Math.random() * pool.length) | 0];
}
function dkcCmax(id){
  var c = dkcCard(id), o = dkcOwn(id);
  if(!c || !o || o.lv < dkcCap(c)) return null;
  if(!SV.book || !SV.book.claim) SV.book = { claim:{} };
  var key = 'cmax_' + id;
  if(SV.book.claim[key]) return null;
  SV.book.claim[key] = 1;
  var p = dkcRandPend(c.rar);
  var g = dkGivePend(p.id);
  return { pend:p, got:g };
}
/* 強化を実行（ゴールドと素材を先に払ってセーブ。演出はそのあと） */
function dkcDoUp(tid){
  var plan = dkcUpPlan(tid);
  if(!plan.ok) return null;
  var o = dkcOwn(tid), from = o.lv, fromExp = o.exp || 0;
  var roll = dkcRoll();
  var gain = Math.round(plan.base * roll.m);
  var sim = dkcSim(tid, gain);
  var used = [];
  Object.keys(DKC_S.mats).forEach(function(k){
    var n = DKC_S.mats[k] | 0, m = dkcOwn(k);
    if(n > 0 && m){ m.dup = Math.max(0, (m.dup | 0) - n); used.push({ id:k, n:n }); }
  });
  SV.gold -= plan.cost;
  o.lv = sim.lv; o.exp = sim.exp;
  DKC_S.mats = {};
  var cm = dkcCmax(tid);
  saveNow();
  dkEmit('card:up', { id:tid, from:from, to:o.lv, grade:roll.k });
  return { id:tid, from:from, fromExp:fromExp, to:o.lv, exp:o.exp, grade:roll.k, mul:roll.m, gain:gain,
           cost:plan.cost, used:used, cmax:cm, wasted:sim.wasted };
}

/* ── 合成 ── */
function dkcMixElig(id){
  var c = dkcCard(id), o = dkcOwn(id);
  if(!c || !o) return { ok:false, why:'未所持' };
  if(c.rar === 'SS') return { ok:false, why:'S+ は最高の等級' };
  if(o.lv < dkcCap(c)) return { ok:false, why:'Lv.' + dkcCap(c) + ' で合成できます' };
  if(SV.equip === id) return { ok:false, why:'装着中は素材にできません' };
  return { ok:true, why:'' };
}
function dkcNextRar(r){ return r === 'A' ? 'S' : r === 'S' ? 'SS' : null; }
/* 狙いの確率：k 回目は max(k×10%, 1/S+の種類数)、10回目で確定（ペンダントの S→S+ と同じ考え） */
function dkcAimP(){
  var n = ((SV.pity && SV.pity.card) | 0) + 1, pool = CARDPOOL.filter(function(c){ return c.rar === 'SS'; }).length || 1;
  return n >= 10 ? 1 : Math.max(n * 0.1, 1 / pool);
}
function dkcMixPlan(){
  var a = DKC_S.mixA, b = DKC_S.mixB, p = { ok:false, reason:'', rar:null, next:null, cost:0 };
  var ea = a ? dkcMixElig(a) : null, eb = b ? dkcMixElig(b) : null;
  if(!a || !b || !ea.ok || !eb.ok){ p.reason = '上限 Lv に達した同じ等級のカードを2枚えらんでください'; return p; }
  var ca = dkcCard(a), cb = dkcCard(b);
  if(a === b){ p.reason = 'ちがうカードを2枚えらんでください'; return p; }
  if(ca.rar !== cb.rar){ p.reason = '同じ等級どうしでしか合成できません'; return p; }
  p.rar = ca.rar; p.next = dkcNextRar(ca.rar); p.cost = DKC_MIXCOST[ca.rar] || 0;
  if(SV.gold < p.cost){ p.reason = 'ゴールドが ' + dkcFmt(p.cost - SV.gold) + ' 足りません'; return p; }
  p.ok = true;
  return p;
}
/* 素材を1枚使う：重なりがあれば Lv.1 の1枚が残り、無ければ消える（図鑑には「見た」で残す） */
function dkcConsume(id){
  var o = dkcOwn(id); if(!o) return;
  if(!Array.isArray(SV.seen)) SV.seen = [];
  if(SV.seen.indexOf(id) < 0) SV.seen.push(id);
  if((o.dup | 0) > 0){ o.dup--; o.lv = 1; o.exp = 0; }
  else { delete SV.cards[id]; if(SV.locks) delete SV.locks[id]; }
}
function dkcGiveCard(id){
  var had = !!dkcOwn(id);
  if(had) SV.cards[id].dup = (SV.cards[id].dup | 0) + 1;
  else SV.cards[id] = { lv:1, dup:0, exp:0 };
  return { id:id, fresh:!had };
}
function dkcDoMix(){
  var plan = dkcMixPlan(); if(!plan.ok) return null;
  var a = DKC_S.mixA, b = DKC_S.mixB, pool = CARDPOOL.filter(function(c){ return c.rar === plan.next; });
  var got = null, aim = null, hit = false, pBefore = 0;
  if(plan.next === 'SS' && SV.aim && SV.aim.card && dkcCard(SV.aim.card) && dkcCard(SV.aim.card).rar === 'SS'){
    aim = SV.aim.card; pBefore = dkcAimP();
    hit = (pBefore >= 1) || (Math.random() < pBefore);
    if(hit){ got = dkcCard(aim); SV.pity.card = 0; }
    else {
      var others = pool.filter(function(c){ return c.id !== aim; });
      got = others[(Math.random() * others.length) | 0];
      SV.pity.card = ((SV.pity.card | 0) + 1);
    }
  } else {
    got = pool[(Math.random() * pool.length) | 0];
  }
  SV.gold -= plan.cost;
  dkcConsume(a); dkcConsume(b);
  var g = dkcGiveCard(got.id);
  if(!dkcOwn(SV.equip)) SV.equip = got.id;
  DKC_S.mixA = null; DKC_S.mixB = null;
  saveNow();
  dkEmit('card:mix', { a:a, b:b, got:got.id, rar:plan.next, aim:aim, hit:hit, pity:(SV.pity.card | 0) });
  return { a:a, b:b, got:got.id, fresh:g.fresh, rar:plan.next, aim:aim, hit:hit, p:pBefore, cost:plan.cost };
}

/* ── 図鑑・アルバム ── */
function dkcSeenN(){ return CARDPOOL.filter(function(c){ return dkBookState(c.id) !== 'unseen'; }).length; }
function dkcClaimed(key){ return !!(SV.book && SV.book.claim && SV.book.claim[key]); }
function dkcSetClaim(key){ if(!SV.book || typeof SV.book !== 'object') SV.book = { claim:{} }; if(!SV.book.claim) SV.book.claim = {}; SV.book.claim[key] = 1; }
function dkcAlbumHave(al){ return al.cards.filter(function(id){ return !!dkcOwn(id); }).length; }
/* 入手先（等級ごと・アルバムの報酬も） */
function dkcWhere(c){
  var s = c.rar === 'A' ? 'カードパック（ガチャ）・キューブ・対戦のごほうび'
        : c.rar === 'S' ? 'カードパック（ガチャ）・キューブ・A と A の合成'
        : 'スペシャル／プレミアムカードパック・S と S の合成';
  var al = DKC_ALBUMS.filter(function(a){ return a.cards.indexOf(c.id) >= 0; })[0];
  return s + (al ? '（アルバム「' + al.nm + '」の1枚）' : '');
}
/* ══════════════════════════════════════════════════════════════
   サイコロ：強化・極・図鑑の計算と、canvas で描くサイコロの絵
   ══════════════════════════════════════════════════════════════ */
var DKC_DTINT = { d1:{ c:'#F2B21C' }, d2:{ c:'#23C2F0' }, d3:{ c:'#E8436A' }, d4:{ c:'#8A58F0', dark:0.42 } };
var DKC_DBOOK = [ { n:3, key:'db3', nm:'3,000 ゴールド' }, { n:5, key:'db5', nm:'サイコロ強化費 −20%（ずっと）' },
                  { n:8, key:'db8', nm:'ダイヤ 30' } ];
function dkcDie(id){ return DICE.filter(function(d){ return d.id === id; })[0] || null; }
function dkcDieOwn(id){ return !!(SV.dice && SV.dice[id]); }
function dkcDieLv(id){ return Math.max(1, Math.min(10, (SV.dice && SV.dice[id]) | 0 || 1)); }
function dkcDieN(){ return DICE.filter(function(d){ return dkcDieOwn(d.id); }).length; }
/* 次の Lv へ上げる費用（図鑑5種の報酬を受け取っていれば ×0.8） */
function dkcDieCost(lv){
  if(lv >= 10) return 0;
  return Math.round(DKC_DCOST[lv - 1] * (dkcClaimed('db5') ? 0.8 : 1));
}
function dkcDieRest(lv){ var s = 0; for(var l = lv; l < 10; l++) s += dkcDieCost(l); return s; }
/* サイコロの能力（J42）：Lv1値・MAX値と、いまの Lv の値 */
function dkcDieRows(id, lv){
  return dkcAbList(id).map(function(r){
    var nm = DKC_ABNM[r[0]];
    return { k:r[0], l:nm[0], u:nm[1], a:r[1], b:r[2], cur:dkcAbAt(r[1], r[2], lv),
             c:(r[0] === 'gold' || r[0] === 'fortune') ? 'gd' : (r[0] === 'rp' || r[0] === 'oddeven') ? 'rd' : 'bl' };
  });
}
function dkcAbTx(v, u){ return (u === '回' ? '+' : '') + v + u; }
/* canvas でサイコロを描いて data URL にする（ゲームと同じ dvDie。等級ごとに色を変える） */
function dkcDieImg(id, px, face){
  var key = id + ':' + px + ':' + (face || 5);
  if(DKC_S.imgs[key] !== undefined) return DKC_S.imgs[key];
  var url = '';
  try{
    var c = document.createElement('canvas'); c.width = px; c.height = px;
    var g = c.getContext('2d');
    g.save(); g.translate(px / 2, px * 0.47); dvDie(g, face || 5, 0, px * 0.52); g.restore();
    var t = DKC_DTINT[id];
    if(t){
      var c2 = document.createElement('canvas'); c2.width = px; c2.height = px;
      var h = c2.getContext('2d');
      h.drawImage(c, 0, 0);
      h.globalCompositeOperation = 'color'; h.fillStyle = t.c; h.fillRect(0, 0, px, px);
      if(t.dark){ h.globalCompositeOperation = 'multiply'; h.globalAlpha = t.dark; h.fillStyle = '#2A1E5A'; h.fillRect(0, 0, px, px); h.globalAlpha = 1; }
      h.globalCompositeOperation = 'destination-in'; h.drawImage(c, 0, 0);
      c = c2;
    }
    url = c.toDataURL('image/png');
  }catch(e){ url = ''; }
  DKC_S.imgs[key] = url;
  return url;
}
function dkcDieUp(id){
  var d = dkcDie(id); if(!d) return null;
  if(!dkcDieOwn(id)) return { err:'まだ持っていません（ショップで購入できます）' };
  var lv = dkcDieLv(id);
  if(lv >= 10) return { err:'Lv.10（最大）です' };
  var cost = dkcDieCost(lv);
  if(SV.gold < cost) return { err:'ゴールドが ' + dkcFmt(cost - SV.gold) + ' 足りません' };
  SV.gold -= cost; SV.dice[id] = lv + 1;
  saveNow();
  dkEmit('dice:up', { id:id, lv:lv + 1 });
  return { id:id, from:lv, to:lv + 1, cost:cost };
}

/* ══════════ 下の帯：縦ホイールで横に動かす・続きのフェード・再描画でも位置を保つ ══════════ */
function dkcStrip(root){
  if(!root) return;
  root.querySelectorAll('.dkc-strip').forEach(function(w){
    var row = w.querySelector('.dkc-row'); if(!row) return;
    var upd = function(){
      var max = row.scrollWidth - row.clientWidth;
      w.classList.toggle('dkc-mL', row.scrollLeft > 4);
      w.classList.toggle('dkc-mR', max > 4 && row.scrollLeft < max - 4);
    };
    row.addEventListener('wheel', function(e){
      var dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? row.clientWidth : 1);
      if(Math.abs(dy) <= Math.abs(e.deltaX)) return;
      var max = row.scrollWidth - row.clientWidth; if(max <= 0) return;
      var to = Math.max(0, Math.min(max, row.scrollLeft + dy));
      if(to === row.scrollLeft) return;
      e.preventDefault();
      row.scrollLeft = to;
      upd();
    }, { passive:false });
    row.addEventListener('scroll', upd, { passive:true });
    upd(); setTimeout(upd, 320); setTimeout(upd, 700);
  });
}
function dkcKeep(root){
  if(!root) return;
  root.querySelectorAll('[data-dkc-sk]').forEach(function(e){
    DKC_S.scroll[e.getAttribute('data-dkc-sk')] = { l:e.scrollLeft, t:e.scrollTop };
  });
}
function dkcRestore(root){
  if(!root) return;
  var apply = function(){
    root.querySelectorAll('[data-dkc-sk]').forEach(function(e){
      if(e._dkcSet || !e.isConnected || !e.clientWidth) return;
      var v = DKC_S.scroll[e.getAttribute('data-dkc-sk')];
      if(v){ e.scrollLeft = v.l; e.scrollTop = v.t; }
      else {
        var on = e.querySelector('.on');
        if(on && e.scrollWidth > e.clientWidth) e.scrollLeft = Math.max(0, on.offsetLeft - (e.clientWidth - on.offsetWidth) / 2);
      }
      e._dkcSet = true;
      e.dispatchEvent(new Event('scroll'));
    });
  };
  apply(); setTimeout(apply, 300); setTimeout(apply, 680);
}
/* 入場の印（ヘッダーとタブ）。本文は HTML 側で data-fx を付ける */
function dkcFxMarks(el){
  el.querySelectorAll('.dkhd > *').forEach(function(n){ if(!n.hasAttribute('data-fx')) n.setAttribute('data-fx', 'pop'); });
  el.querySelectorAll('.dktab').forEach(function(n){ n.setAttribute('data-fx', 'riseL'); n.setAttribute('data-fx-press', ''); });
}
/* ══════════════════════════════════════════════════════════════
   お手本の絵に寄せる（社長 2026-09-12・S2）：共通スキン（8b-skin.js）をこの画面に当てる
   ・背景は静止の1枚（カード＝書斎／サイコロ＝金の広間）。タブとボタンは .sk- の見た目。
   ・主役のまわりに光の輪1個ときらめき1〜2個だけ足す。dkskBudget が1画面8個を超えさせない。
     サイコロ画面は元から動く物が1つ多い（台座で跳ねるサイコロ）ので、きらめきを1個にして余裕を残す。
     スマホ（DKFX.mob）では dkskHalo/dkskSpark が何も作らない＝動く層を増やさない。
   ・金の彫り枠は 1m-cards.html 側で「重ねる飾り」として描く（frame は false）。
     .sk-frame の border-image を当てると枠の太さぶん器の中身が細くなるため。
   ・素材が無い時も何も起きないだけ（dkskUrl が空なら CSS 変数を置かない）。
   ══════════════════════════════════════════════════════════════ */
function dkcSkin(el, which){
  if(!el || typeof dkskApply !== 'function') return;
  try{
    dkskApply(el, {
      bg:       which === 'dice' ? 'hall' : 'study',
      frame:    false,
      frameDark:false,
      tabs:     '.dktabs',
      btns:     '.dkbtn',
      halo:     '.dkc-stage',
      haloSize: '88%',
      spark:    which === 'dice' ? 1 : 2,
      sparkSel: '.dkc-stage',
      sparkBox: { x:20, y:14, w:60, h:56 }
    });
    if(typeof dkskUrl === 'function'){
      [['--dkc-wood', 'wood'], ['--dkc-candle', 'deco-candle'], ['--dkc-globe', 'deco-globe'],
       ['--dkc-clamp', 'deco-clamp'], ['--dkc-crest', 'paper-crest'], ['--dkc-paper', 'paper'],
       ['--dkc-fleur', 'deco-fleur']].forEach(function(p){
        var u = dkskUrl(p[1]);
        if(u) el.style.setProperty(p[0], u);
      });
    }
    dkcOrn(el);
  }catch(e){}
}
/* 太い彫り枠の四隅に金の飾りを1つずつ置く（止まった絵・指は素通し＝押せる物をふさがない） */
function dkcOrn(el){
  if(!el) return;
  try{
    el.querySelectorAll('.dkc-det,.dkc-bottom,.dkc-bookL,.dkc-dbtop').forEach(function(n){
      if(n.querySelector('.dkc-orn')) return;
      var f = document.createDocumentFragment();
      ['tl', 'tr', 'bl', 'br'].forEach(function(k){
        var i = document.createElement('i');
        i.className = 'dkc-orn dkc-o' + k;
        i.setAttribute('aria-hidden', 'true');
        f.appendChild(i);
      });
      n.appendChild(f);
      /* 空いた面は紙の透かしで埋める（無地の黒い板を出さない）。中身より後ろに敷く */
      if(n.classList.contains('dkc-det')){
        var w = document.createElement('i');
        w.className = 'dkc-wmk';
        w.setAttribute('aria-hidden', 'true');
        n.appendChild(w);
      }
    });
  }catch(e){}
}
function dkcTabs(list, active, icons, badges){
  return dkTabs(list.map(function(t, i){
    return { id:t.id, nm:t.nm, ic:dkcSvg(icons[i]), badge:(badges && badges[t.id]) || '' };
  }), active);
}
/* ══════════════════════════════════════════════════════════════
   カード画面の部品
   ══════════════════════════════════════════════════════════════ */
function dkcSortOwn(a, b){
  var oa = dkcOwn(a.id), ob = dkcOwn(b.id);
  return (DKC_RANK[b.rar] - DKC_RANK[a.rar]) || ((ob ? ob.lv : 0) - (oa ? oa.lv : 0)) || (a.id < b.id ? -1 : 1);
}
function dkcOwnedList(){ return CARDPOOL.filter(function(c){ return !!dkcOwn(c.id); }).sort(dkcSortOwn); }
/* 大きいカード（等級色の放射グラデ＋multiply で白地をなじませる） */
function dkcBigCard(c, lv, opt){
  opt = opt || {};
  var img = dkcArt(c.id), st = opt.state || 'own';
  var art = (img && st !== 'unseen') ? ' style="background-image:url(' + img + '),var(--dkc-rg)"' : '';
  /* 等級バッジは .in の外に出す（.in は角丸で切り取るので、中に置くと枠の角に食い込ませられない）。
     写真額（銀＋金）と上の金具は「止まった絵」を重ねるだけ＝常時アニメは増えない */
  return '<div class="dkc-big fx-card r' + c.rar + ' dkc-s' + st + (opt.cls ? ' ' + opt.cls : '') + '"' + (opt.id ? ' id="' + opt.id + '"' : '') + '>'
    + '<div class="in">'
    +   '<div class="dkc-bighd"><b class="dkc-bignm">' + esc(c.nm) + '</b></div>'
    +   '<div class="dkc-art dkc-a' + c.rar + '"' + art + '>'
    +     (img ? '' : '<span class="dkc-ph">' + esc(c.nm.slice(0, 1)) + '</span>')
    +     (st === 'own' ? '<span class="dkc-lvhex"><i>Lv</i><b class="dkc-lvn">' + lv + '</b></span>' : '')
    +   '</div>'
    +   '<div class="dkc-bigft">' + esc(c.role) + '</div>'
    + '</div><div class="fx-gloss"></div>'
    + '<i class="dkc-frm" aria-hidden="true"></i><i class="dkc-clp" aria-hidden="true"></i>'
    + '<span class="dkc-cbg">' + dkcRar(c.rar) + '</span></div>';
}
/* 封をされたカード（まだ出会っていない。名前も能力値も出さない） */
function dkcSealCard(opt){
  opt = opt || {};
  return '<div class="dkc-big dkc-seal' + (opt.cls ? ' ' + opt.cls : '') + '">'
    + '<div class="dkc-sealin"><i class="dkc-sealq"></i><b>？？？</b></div>'
    + '<i class="dkc-frm" aria-hidden="true"></i></div>';
}
/* 下の帯・一覧の小さいカード */
function dkcItem(c, opt){
  opt = opt || {};
  var o = dkcOwn(c.id), st = opt.state || (o ? 'own' : dkBookState(c.id));
  var face = dkcFace(c.id), lv = o ? o.lv : 1, cap = dkcCap(c);
  var bg = (st !== 'unseen' && face) ? ' style="background-image:url(' + face + '),var(--dkc-rg)"' : '';
  var h = '<div class="dkc-item dkc-r' + (st === 'unseen' ? 'X' : c.rar) + ' dkc-s' + st + (opt.on ? ' on' : '') + (opt.dim ? ' dkc-dim' : '') + '"'
    + (opt.attr ? ' ' + opt.attr : '') + ' data-fx-press>';
  if(opt.eq !== false && SV.equip === c.id && o) h += '<span class="dkc-eq">装着中</span>';
  if(opt.pick) h += '<span class="dkc-pk">' + opt.pick + '</span>';
  h += '<div class="dkc-face"' + bg + '>' + (st === 'unseen' ? '<i class="dkc-sealq"></i>' : '')
    +  (o && (o.dup | 0) > 0 && opt.dup !== false ? '<span class="dkc-dup">×' + o.dup + '</span>' : '')
    +  (st !== 'unseen' ? '<span class="dkc-irar">' + dkcRarNm(c.rar) + '</span>' : '') + '</div>';
  if(st === 'own') h += '<span class="dkc-ilv">' + (lv >= cap ? '<em>MAX</em>' : '') + 'Lv.' + lv + '</span>';
  else if(st === 'seen') h += '<span class="dkc-ilv dkc-miss">未所持</span>';
  else h += '<span class="dkc-ilv dkc-miss">？？？</span>';
  h += '<span class="dkc-inm">' + (st === 'unseen' ? '？？？' : esc(c.nm)) + '</span>';
  if(opt.why) h += '<span class="dkc-why2">' + esc(opt.why) + '</span>';
  return h + '</div>';
}
function dkcBottom(list, mode, fn){
  /* お手本の帯は空きでも「絵の入った受け皿」が並ぶ。枚数が少ない時の縞の空き板を埋める（押せない飾り） */
  var pad = '';
  for(var pi = list.length; pi < 8; pi++) pad += '<i class="dkc-item dkc-empty2" aria-hidden="true"></i>';
  return '<div class="dkdark dkbottom dkc-bottom" data-fx="rise">'
    + '<span class="cnt dkc-cnt">所持<br>カード<br><b>' + dkcOwnedList().length + '/' + CARDPOOL.length + '</b></span>'
    + '<div class="dkc-strip"><div class="dkrow dkc-row" data-dkc-sk="c-' + mode + '" data-fx-step="30">'
    + list.map(fn).join('') + pad
    + '</div><i class="dkc-fade dkc-fl"></i><i class="dkc-fade dkc-fr"></i></div></div>';
}
/* 能力値7本：名前は dkStatLabels（A は1本目が「孤立地域脱出成功」）、基本値＋装着中のサイコロの青い +N（J58・C05） */
function dkcStatBars(c, lv){
  var st = cardStats(c.id, lv, []) || {}, plus = dkcDiePlus(), labs = null;
  try{ labs = dkStatLabels(c.id); }catch(e){ labs = null; }
  if(!Array.isArray(labs) || !labs.length) labs = STAT_LABELS;
  /* お手本の右パネルは「太いバー＋袋文字の数字」。共通スキンの .sk-bar2 / .sk-barrow.big を使う
     （金＝80以上・緑＝60以上・青＝それ未満。色の分け方は前と同じ） */
  return '<div class="dkc-stats">' + labs.map(function(kv){
    var v = Math.round(st[kv[0]] || 0), pl = plus[kv[0]] | 0, w = Math.min(100, v);
    return '<div class="st dkc-st sk-barrow big"><span class="l nm">' + esc(kv[1]) + '</span>'
      + '<span class="sk-bar2' + (v >= 100 ? '' : v >= 85 ? ' green' : ' blue') + '"><i style="--sk-v:' + w + '%"></i>'
      + (pl ? '<u class="dkc-plb" style="left:' + w + '%;width:' + Math.max(0, Math.min(100 - w, pl)) + '%"></u>' : '') + '</span>'
      + '<b class="vl">' + v + (pl ? '<em class="dkc-plus">+' + pl + '</em>' : '') + '</b></div>';
  }).join('') + '</div>';
}
/* DKCORE_DIEAB[id] がどの形でも [[key, Lv1値, MAX値]] にそろえる（無ければ DKC_DAB） */
function dkcAbList(id){
  var T = null, out = [];
  try{ if(typeof DKCORE_DIEAB === 'object' && DKCORE_DIEAB) T = DKCORE_DIEAB[id]; }catch(e){ T = null; }
  if(!T || typeof T !== 'object') T = DKC_DAB[id] || {};
  var push = function(k, a, b){
    if(!DKC_ABNM[k]) return;
    a = +a || 0; b = (b === undefined || b === null) ? a : (+b || 0);
    if(a || b) out.push([k, a, b]);
  };
  if(Array.isArray(T)) T.forEach(function(r){
    if(Array.isArray(r)) push(r[0], r[1], r[2]);
    else if(r) push(r.k || r.key, r.lv1 !== undefined ? r.lv1 : r.a, r.max !== undefined ? r.max : (r.lv10 !== undefined ? r.lv10 : r.b));
  });
  else Object.keys(T).forEach(function(k){
    var v = T[k];
    if(Array.isArray(v)) push(k, v[0], v[v.length - 1]);
    else if(v && typeof v === 'object') push(k, v.lv1 !== undefined ? v.lv1 : v.min, v.max !== undefined ? v.max : v.lv10);
    else push(k, v, v);
  });
  return out;
}
/* その Lv の値（Lv1 と Lv10 を直線で結ぶ） */
function dkcAbAt(a, b, lv){ lv = Math.max(1, Math.min(10, (lv | 0) || 1)); return Math.round(a + (b - a) * (lv - 1) / 9); }
/* 装着中のサイコロが能力値に足す分 {key:+N} */
function dkcDiePlus(){
  var id = SV.die, o = {};
  if(!dkcDieOwn(id)) return o;
  var lv = dkcDieLv(id);
  dkcAbList(id).forEach(function(r){ o[r[0]] = dkcAbAt(r[1], r[2], lv); });
  return o;
}

/* ── 所持 ── */
function dkcTabOwn(){
  var list = dkcOwnedList();
  if(!DKC_S.sel || !dkcOwn(DKC_S.sel)) DKC_S.sel = dkcOwn(SV.equip) ? SV.equip : list[0].id;
  var c = dkcCard(DKC_S.sel), o = dkcOwn(c.id), cap = dkcCap(c), eq = SV.equip === c.id;
  var need = dkcNeed(o.lv), max = o.lv >= cap, dp = dkcDiePlus(), dd = dkcDie(SV.die);
  var html = '<div class="dkmain dkc-main">'
    + '<div class="dkstage dkc-stage" data-fx="hero"><div class="fx-rays"></div><i class="dkc-floor"></i>'
    +   dkcBigCard(c, o.lv, { id:'dkcBig' }) + '</div>'
    + '<div class="dkdark dkdet dkc-det" data-fx="riseR">'
    +   '<div class="hd">' + dkcRar(c.rar, 'r') + '<span class="nm">' + esc(c.nm) + '</span>'
    +     '<span class="lv">Lv.' + o.lv + '<small>/' + Math.max(cap, o.lv) + '</small></span></div>'
    +   '<div class="dkc-exprow"><span class="dkc-expl">EXP</span>'
    +     '<span class="dkbar gd dkc-expb"><i style="width:' + (max ? 100 : Math.round((o.exp || 0) / need * 100)) + '%"></i></span>'
    +     '<b>' + (max ? 'MAX' : dkcFmt(o.exp || 0) + '/' + dkcFmt(need)) + '</b></div>'
    +   (function(){
          var sk = dkcSkillOf(c.id) || { label:c.sk.nm, ds:c.sk.ds, when:'対戦中' };
          return '<div class="ef dkc-ef dkc-skef"><span class="ic">' + dkcSvg('mix') + '</span><div>'
            + '<b>' + esc(sk.label) + '</b><i class="dkc-skwhen">' + esc(sk.when) + '</i>'
            + '<p>' + esc(sk.ds) + '</p></div></div>';
        })()
    +   '<div class="line dkc-line">「' + esc(c.line) + '」</div>'
    +   dkcStatBars(c, o.lv)
    +   (Object.keys(dp).length && dd ? '<p class="dkc-plnote">青い <em>+N</em> は装着中の' + esc(dd.nm) + '（Lv.' + dkcDieLv(dd.id) + '）の上乗せ</p>' : '')
    +   '<div class="btns">'
    +     '<button class="dkbtn gd dkc-bt" id="dkcToUp"' + (max ? ' disabled' : '') + '>' + (max ? '上限 Lv' : '強化する') + '</button>'
    +     '<button class="dkbtn gr dkc-bt" id="dkcEquip"' + (eq ? ' disabled' : '') + '>' + (eq ? '装着中' : '装着') + '</button>'
    +   '</div>'
    + '</div></div>'
    + dkcBottom(list, 'own', function(x){ return dkcItem(x, { on:x.id === c.id, attr:'data-dkc-pick="' + x.id + '"' }); });
  return {
    html: html,
    wire: function(el){
      el.querySelectorAll('[data-dkc-pick]').forEach(function(b){
        b.onclick = function(){ if(DKC_S.busy) return; dkcSfx('click'); DKC_S.sel = b.getAttribute('data-dkc-pick'); showCards(); };
      });
      var up = el.querySelector('#dkcToUp');
      if(up) up.onclick = function(){ dkcSfx('click'); DKC_S.upSel = c.id; DKC_S.mats = {}; DKC_S.tab = 'up'; showCards(); };
      var eqb = el.querySelector('#dkcEquip');
      if(eqb) eqb.onclick = function(){
        if(SV.equip === c.id) return;
        SV.equip = c.id; saveNow(); dkcSfx('click');
        try{ toast('R', '🎴', esc(c.nm), '装着しました', 1500); }catch(e){}
        showCards();
        var big = document.getElementById('dkcBig'); if(big){ fxBurst(big, { kind:'star', n:14 }); }
      };
    }
  };
}

function dkcUpDefault(list){
  var ok = function(id){ var c = dkcCard(id), o = dkcOwn(id); return !!(c && o && o.lv < dkcCap(c)); };
  if(DKC_S.sel && ok(DKC_S.sel)) return DKC_S.sel;
  if(ok(SV.equip)) return SV.equip;
  for(var i = 0; i < list.length; i++) if(ok(list[i].id)) return list[i].id;
  return (DKC_S.sel && dkcOwn(DKC_S.sel)) ? DKC_S.sel : list[0].id;
}
/* ── 強化 ── */function dkcTabUp(){
  var list = dkcOwnedList();
  if(!DKC_S.upSel || !dkcOwn(DKC_S.upSel)) DKC_S.upSel = dkcUpDefault(list);
  dkcMatClean();
  var tid = DKC_S.upSel, c = dkcCard(tid), o = dkcOwn(tid), cap = dkcCap(c);
  if(o.lv >= cap) DKC_S.mats = {};
  var plan = dkcUpPlan(tid), n = dkcMatN(), need = dkcNeed(o.lv), maxed = o.lv >= cap;
  var s = plan.res.Success || { lv:o.lv, exp:o.exp || 0 }, ex = plan.res.Excellent || s;
  var now = maxed ? 100 : Math.round((o.exp || 0) / need * 100);
  var tgt = maxed ? 100 : (s.lv > o.lv ? 100 : Math.round(s.exp / need * 100));
  var slots = '', fill = [];
  Object.keys(DKC_S.mats).forEach(function(k){ for(var i = 0; i < (DKC_S.mats[k] | 0); i++) fill.push(k); });
  for(var i = 0; i < DKC_MAXMAT; i++){
    var mid = fill[i];
    if(mid){
      var mc = dkcCard(mid);
      slots += '<div class="dkc-slot dkc-r' + mc.rar + ' dkc-fill" data-dkc-unmat="' + mid + '" data-fx-press>'
        + '<div class="dkc-face" style="background-image:url(' + dkcFace(mid) + '),var(--dkc-rg)"></div>'
        + (mid === tid ? '<span class="dkc-x2">×2</span>' : '') + '</div>';
    } else slots += '<div class="dkc-slot dkc-empty"><i></i></div>';
  }
  var mats = dkcMatList(tid), rows = '';
  mats.forEach(function(m){
    var mo = dkcOwn(m.id), k = DKC_S.mats[m.id] | 0;
    rows += '<div class="dkc-mrow dkc-r' + m.rar + (k ? ' on' : '') + '">'
      + '<div class="dkc-face sm" style="background-image:url(' + dkcFace(m.id) + '),var(--dkc-rg)"></div>'
      + '<div class="dkc-mtx"><b>' + esc(m.nm) + '</b><span>' + dkcRar(m.rar, 'sm') + 'EXP ' + dkcFmt(dkcMatExp(tid, m.id))
      + (m.id === tid ? '<em>×2</em>' : '') + '<i class="dkc-sep"></i>' + dkcCoin() + dkcFmt(dkcMatCost(tid, m.id)) + '</span></div>'
      + '<span class="dkc-have">×' + mo.dup + '</span>'
      + '<div class="dkc-pm"><button class="dkc-pmb" data-dkc-mat="-' + m.id + '"' + (k <= 0 || maxed ? ' disabled' : '') + ' aria-label="へらす">−</button>'
      + '<b>' + k + '</b><button class="dkc-pmb" data-dkc-mat="+' + m.id + '"' + (k >= mo.dup || n >= DKC_MAXMAT || maxed ? ' disabled' : '') + ' aria-label="ふやす">＋</button></div>'
      + '</div>';
  });
  if(!mats.length) rows = '<div class="dkc-none"><p>素材になる「重なり」がありません。<br>同じカードを2枚目から引くと、それが素材になります。</p>'
    + '<button class="dkbtn gr dkc-bt" id="dkcGoGacha">ガチャへ</button></div>';
  if(maxed) rows = '<div class="dkc-none"><p>' + esc(plan.reason) + '</p>' + (c.rar !== 'SS' ? '<button class="dkbtn gr dkc-bt" id="dkcGoMix">合成へ</button>' : '') + '</div>';
  var planH = '';
  if(maxed) planH = '<div class="dkc-planrow dkc-full"><span>このカードは上限 Lv です</span></div>';
  else if(n > 0) planH = '<div class="dkc-planrow"><span>予想 EXP</span><b>+' + dkcFmt(plan.base) + '</b>'
      + '<small>Great +' + dkcFmt(plan.base * 1.5) + '／Excellent +' + dkcFmt(plan.base * 2) + '</small></div>'
    + '<div class="dkc-planrow"><span>予想 Lv</span><b>' + o.lv + ' → ' + s.lv + '</b>'
      + '<small>' + (ex.lv > s.lv ? 'Excellent なら Lv.' + ex.lv : (s.capped ? '上限 Lv に届きます' : '')) + '</small></div>'
    + '<div class="dkc-planrow"><span>費用</span><b>' + dkcCoin() + dkcFmt(plan.cost) + '</b><small>素材 ' + n + ' 枚</small></div>'
    + ((plan.res.Success && plan.res.Success.wasted > 0) ? '<div class="dkc-note">上限をこえる EXP ' + dkcFmt(plan.res.Success.wasted) + ' はむだになります</div>' : '');
  else planH = '<div class="dkc-planrow dkc-full"><span>素材をえらぶと、予想 EXP・Lv・費用が出ます</span></div>';
  var html = '<div class="dkmain dkc-main">'
    + '<div class="dkstage dkc-stage dkc-upst" data-fx="hero"><div class="fx-rays"></div><i class="dkc-floor"></i>'
    +   '<div class="dkc-upcard">' + dkcBigCard(c, o.lv, { id:'dkcBig', cls:'dkc-mid' }) + '</div>'
    +   '<div class="dkc-upinfo">'
    +     '<div class="dkc-lvto"><span>Lv.<b id="dkcLvNow">' + o.lv + '</b></span>'
    +       (maxed ? '<span class="dkc-maxtag">MAX</span>' : '<i class="dkc-arw"></i><span class="dkc-lvnx">Lv.<b>' + s.lv + '</b></span>') + '</div>'
    +     '<div class="dkc-expbar"><i style="width:' + now + '%"></i><em style="left:' + now + '%;width:' + Math.max(0, tgt - now) + '%"></em></div>'
    +     '<div class="dkc-exptx">' + (maxed ? 'MAX' : 'EXP ' + dkcFmt(o.exp || 0) + ' / ' + dkcFmt(need)) + '</div>'
    +     '<div class="dkc-slots" id="dkcSlots">' + slots + '</div>'
    +     '<div class="dkc-odds"><span class="dkc-os"><b>Success</b><small>×1・70%</small></span><span class="dkc-og"><b>Great</b><small>×1.5・22%</small></span>'
    +       '<span class="dkc-oe"><b>Excellent</b><small>×2・8%</small></span></div>'
    +   '</div></div>'
    + '<div class="dkdark dkdet dkc-det dkc-updet" data-fx="riseR">'
    +   '<div class="dkc-mhd"><b>素材</b><small>最大5枚・同じカードは EXP×2</small><em>' + n + '/5</em></div>'
    +   '<div class="dkc-mats" data-dkc-sk="mats">' + rows + '</div>'
    +   '<div class="dkc-plan">' + planH + '</div>'
    +   '<div class="btns"><button class="dkbtn gd dkc-bt fx-primary" id="dkcUpGo"' + (plan.ok ? '' : ' disabled') + '>強化する</button></div>'
    +   (plan.ok ? '' : '<div class="dkc-why" id="dkcUpWhy">' + esc(plan.reason) + '</div>')
    + '</div></div>'
    + dkcBottom(list, 'up', function(x){ return dkcItem(x, { on:x.id === tid, attr:'data-dkc-pick="' + x.id + '"' }); });
  return {
    html: html,
    wire: function(el){
      el.querySelectorAll('[data-dkc-pick]').forEach(function(b){
        b.onclick = function(){ if(DKC_S.busy) return; dkcSfx('click'); DKC_S.upSel = DKC_S.sel = b.getAttribute('data-dkc-pick'); DKC_S.mats = {}; showCards(); };
      });
      el.querySelectorAll('[data-dkc-mat]').forEach(function(b){
        b.onclick = function(){
          if(DKC_S.busy) return;
          var v = b.getAttribute('data-dkc-mat'), id = v.slice(1), m = dkcOwn(id);
          if(!m) return;
          var k = DKC_S.mats[id] | 0;
          if(v.charAt(0) === '+'){ if(k < (m.dup | 0) && dkcMatN() < DKC_MAXMAT) DKC_S.mats[id] = k + 1; }
          else if(k > 0){ DKC_S.mats[id] = k - 1; if(!DKC_S.mats[id]) delete DKC_S.mats[id]; }
          dkcSfx('click'); showCards();
        };
      });
      el.querySelectorAll('[data-dkc-unmat]').forEach(function(b){
        b.onclick = function(){
          if(DKC_S.busy) return;
          var id = b.getAttribute('data-dkc-unmat');
          if(DKC_S.mats[id] > 0){ DKC_S.mats[id]--; if(!DKC_S.mats[id]) delete DKC_S.mats[id]; }
          dkcSfx('click'); showCards();
        };
      });
      var gg = el.querySelector('#dkcGoGacha');
      if(gg) gg.onclick = function(){ dkcSfx('click'); showGacha('card'); };
      var gm = el.querySelector('#dkcGoMix');
      if(gm) gm.onclick = function(){ dkcSfx('click'); DKC_S.tab = 'mix'; showCards(); };
      var go = el.querySelector('#dkcUpGo');
      if(go) go.onclick = function(){ dkcRunUp(tid); };
    }
  };
}
/* ── 合成 ── */
function dkcTabMix(){
  var list = dkcOwnedList();
  if(DKC_S.mixA && !dkcMixElig(DKC_S.mixA).ok) DKC_S.mixA = null;
  if(DKC_S.mixB && !dkcMixElig(DKC_S.mixB).ok) DKC_S.mixB = null;
  var plan = dkcMixPlan(), a = DKC_S.mixA ? dkcCard(DKC_S.mixA) : null, b = DKC_S.mixB ? dkcCard(DKC_S.mixB) : null;
  var rar = a ? a.rar : (b ? b.rar : null), next = rar ? dkcNextRar(rar) : null;
  var elig = list.filter(function(x){ return dkcMixElig(x.id).ok; }).length;
  var slot = function(c, k){
    if(!c) return '<div class="dkc-mixslot dkc-empty"><i></i><span>' + k + '枚目</span></div>';
    return '<div class="dkc-mixslot" data-dkc-unmix="' + c.id + '" data-fx-press>' + dkcBigCard(c, dkcOwn(c.id).lv, { cls:'dkc-sm' }) + '</div>';
  };
  var aim = (SV.aim && SV.aim.card) ? dkcCard(SV.aim.card) : null;
  var res;
  if(next === 'SS' && aim){
    var ast = dkBookState(aim.id);
    res = '<div class="dkc-mixres dkc-aimres">' + (ast === 'unseen' ? dkcSealCard({ cls:'dkc-sm' }) : dkcBigCard(aim, 1, { cls:'dkc-sm', state:'seen' }))
      + '<span class="dkc-aimtag">狙い</span></div>';
  } else {
    res = '<div class="dkc-mixres"><div class="dkc-big dkc-sm dkc-back dkc-b' + (next || 'X') + '"><div class="dkc-backin"><i class="dkc-sealq"></i>'
      + '<b>' + (next ? dkcRarNm(next) : '？') + '</b></div></div></div>';
  }
  var aimH = '';
  if(next === 'SS'){
    var left = 10 - ((SV.pity && SV.pity.card) | 0);
    aimH = '<div class="dkc-aim"><div class="dkc-aimhd"><b>狙い</b><span>' + (aim ? (dkBookState(aim.id) === 'unseen' ? '？？？' : esc(aim.nm)) : 'おまかせ（狙わない）') + '</span>'
      + '<button class="dkbtn gr dkc-bt2" id="dkcAim">えらぶ</button></div>'
      + (aim ? '<div class="dkc-aimp">今回 <b>' + Math.round(dkcAimP() * 100) + '%</b> で狙いのカード<small>あと ' + Math.max(1, left) + ' 回で確定（出たら数え直し）</small></div>'
             : '<div class="dkc-aimp"><small>S+ を1枚えらぶと、1回目10%・2回目20%…10回目で必ず出ます</small></div>')
      + '</div>';
  }
  var html = '<div class="dkmain dkc-main">'
    + '<div class="dkstage dkc-stage dkc-mixst" data-fx="hero"><div class="fx-rays"></div><i class="dkc-floor"></i>'
    +   '<div class="dkc-mixrow">' + slot(a, 1) + '<i class="dkc-plus"></i>' + slot(b, 2) + '<i class="dkc-arw2"></i>' + res + '</div>'
    +   '<div class="dkc-warn">合成した2枚はなくなります（重なりがあれば Lv.1 の1枚が残ります）。できるカードは Lv.1 からです。</div>'
    + '</div>'
    + '<div class="dkdark dkdet dkc-det dkc-mixdet" data-fx="riseR">'
    +   '<div class="dkc-mhd"><b>合成</b><small>上限 Lv の同じ等級2枚 → 1段上を1枚</small><button class="dkp-oddsb" id="dkcOdds">提供割合</button></div>'
    +   '<div class="dkc-mixtbl"><div><span>A ＋ A</span><b>→ S</b><em>' + dkcCoin() + dkcFmt(DKC_MIXCOST.A) + '</em><small>A は Lv.20 で合成できます</small></div>'
    +     '<div><span>S ＋ S</span><b>→ S+</b><em>' + dkcCoin() + dkcFmt(DKC_MIXCOST.S) + '</em><small>S は Lv.25 で合成できます</small></div></div>'
    +   aimH
    +   '<div class="dkc-planrow"><span>合成できるカード</span><b>' + elig + ' 枚</b></div>'
    +   '<div class="dkc-planrow"><span>費用</span><b>' + (plan.ok || plan.cost ? dkcCoin() + dkcFmt(plan.cost) : '—') + '</b></div>'
    +   dkcLeftLine(next, aim)
    +   '<div class="btns"><button class="dkbtn gd dkc-bt fx-primary" id="dkcMixGo"' + (plan.ok ? '' : ' disabled') + '>合成する</button></div>'
    +   (plan.ok ? '' : '<div class="dkc-why">' + esc(plan.reason) + '</div>')
    + '</div></div>'
    + dkcBottom(list, 'mix', function(x){
        var e = dkcMixElig(x.id), on = (x.id === DKC_S.mixA || x.id === DKC_S.mixB);
        return dkcItem(x, { on:on, dim:!e.ok, why:e.ok ? '' : e.why, pick:on ? (x.id === DKC_S.mixA ? '1' : '2') : '', attr:'data-dkc-pick="' + x.id + '"' });
      });
  return {
    html: html,
    wire: function(el){
      el.querySelectorAll('[data-dkc-pick]').forEach(function(b){
        b.onclick = function(){
          if(DKC_S.busy) return;
          var id = b.getAttribute('data-dkc-pick'), e = dkcMixElig(id);
          if(!e.ok){ dkcWarn('このカードは合成に使えません', e.why); fxShake(b, 220); return; }
          if(DKC_S.mixA === id){ DKC_S.mixA = null; }
          else if(DKC_S.mixB === id){ DKC_S.mixB = null; }
          else {
            var ref = DKC_S.mixA || DKC_S.mixB, rc = ref ? dkcCard(ref) : null;
            if(rc && rc.rar !== dkcCard(id).rar){ DKC_S.mixA = id; DKC_S.mixB = null; }
            else if(!DKC_S.mixA) DKC_S.mixA = id;
            else if(!DKC_S.mixB) DKC_S.mixB = id;
            else DKC_S.mixB = id;
          }
          dkcSfx('click'); showCards();
        };
      });
      el.querySelectorAll('[data-dkc-unmix]').forEach(function(b){
        b.onclick = function(){
          if(DKC_S.busy) return;
          var id = b.getAttribute('data-dkc-unmix');
          if(DKC_S.mixA === id) DKC_S.mixA = null; if(DKC_S.mixB === id) DKC_S.mixB = null;
          dkcSfx('click'); showCards();
        };
      });
      var am = el.querySelector('#dkcAim');
      if(am) am.onclick = function(){ dkcAimModal(); };
      var od = el.querySelector('#dkcOdds');
      if(od) od.onclick = function(){ if(DKC_S.busy) return; dkcSfx('click'); dkcOdds(); };
      var go = el.querySelector('#dkcMixGo');
      if(go) go.onclick = function(){ dkcRunMix(); };
    }
  };
}

/* 合成ボタンの上の「あと n 回で確定」（G13。S → S+ か、狙いを決めている時） */
function dkcLeftLine(next, aim){
  if(next !== 'SS' && !aim) return '';
  var left = 10 - ((SV.pity && SV.pity.card) | 0);
  return '<div class="dkc-left">' + (aim ? 'S+ の狙い：あと <b>' + Math.max(1, left) + '</b> 回で確定（今回 <b>' + Math.round(dkcAimP() * 100) + '%</b>）'
                                       : '狙いを決めると、10回目で確定') + '</div>';
}
/* 合成の提供割合（A→S・S→S+ と、狙いの確率の表） */
function dkcOdds(){
  var S1 = CARDPOOL.filter(function(c){ return c.rar === 'S'; }), SS = CARDPOOL.filter(function(c){ return c.rar === 'SS'; });
  var it = function(L, r){ return L.map(function(c){ return { kind:'card', id:c.id, nm:c.nm, rar:r, p:1 / L.length }; }); };
  var cur = (SV.aim && SV.aim.card) ? ((SV.pity && SV.pity.card) | 0) + 1 : 0;
  var o = { title:'カード合成　提供割合', blocks:[
    { hd:'A ＋ A → S', items:it(S1, 'S') },
    { hd:'S ＋ S → S+（狙いなし）', items:it(SS, 'SS') },
    { hd:'S ＋ S → S+ の狙い', table:{ head:['回数', '狙いが出る確率'], rows:dkpAimRows(SS.length, cur) },
      notes:['k 回目に狙いが出る確率 ＝ k × 10% と 1 ÷ ' + SS.length + '（S+ の種類数）の大きい方', '10回目は必ず狙いが出ます。狙いが出たら数え直します',
             '再合成（ダイヤでやり直し）は回数に数えません'] } ] };
  modal(dkpOddsHTML(o));
}
/* 再合成（J57）：同じ抽選表でもう1枚。天井（SV.pity.card）には数えない */
function dkcRemixRoll(res){
  var pool = CARDPOOL.filter(function(c){ return c.rar === res.rar; });
  if(res.aim && res.rar === 'SS'){
    if(res.p >= 1 || Math.random() < res.p) return dkcCard(res.aim);
    var others = pool.filter(function(c){ return c.id !== res.aim; });
    return others[(Math.random() * others.length) | 0] || pool[0];
  }
  return pool[(Math.random() * pool.length) | 0] || dkcCard(res.got);
}
async function dkcRemix(res, cost){
  if(SV.gem < cost){ dkcWarn('ダイヤが足りません', '再合成には ダイヤ ' + cost + ' が要ります'); return null; }
  var c1 = dkcCard(res.got), c2 = dkcRemixRoll(res);
  if(!c1 || !c2) return null;
  SV.gem -= cost;
  saveNow();
  try{ dkWallet(); }catch(e){}
  dkcSfx('gachaRoll');
  var act = await modal('<div class="modal dkc-modal"><div class="dkc-mbox dkc-wide">'
    + '<div class="fx-ribbon gold"><b>どちらのカードを取りますか？</b></div>'
    + '<div class="dkc-pick2">' + [c1, c2].map(function(c, i){
        return '<div class="dkc-pk2"><span class="dkc-pk2t">' + (i ? '再合成' : '1回目') + '</span>' + dkcBigCard(c, 1, { cls:'dkc-sm' })
          + '<button class="dkbtn ' + (i ? 'gd' : 'gr') + ' dkc-bt" data-act="k' + (i + 1) + '">これにする</button></div>';
      }).join('') + '</div>'
    + '<p class="dkc-mp">選ばなかったカードはなくなります。再合成は天井の回数に数えません。</p></div></div>');
  var pick = (act === 'k2') ? c2 : c1;
  if(pick.id !== c1.id){
    var o = dkcOwn(c1.id);
    if(o){
      if(res.fresh){ delete SV.cards[c1.id]; if(SV.locks) delete SV.locks[c1.id]; }
      else o.dup = Math.max(0, (o.dup | 0) - 1);
    }
    dkcGiveCard(c2.id);
    if(!dkcOwn(SV.equip)) SV.equip = c2.id;
  }
  saveNow();
  dkMarkSeen(c2.id);
  dkEmit('card:remix', { first:c1.id, second:c2.id, pick:pick.id, cost:cost, pity:(SV.pity.card | 0) });
  if(dkcScreenOn('cards')){ DKC_S.sel = pick.id; DKC_S.tab = 'own'; showCards(); }
  try{ toast('R', '🎴', esc(pick.nm), dkcRarNm(pick.rar) + 'クラスを Lv.1 で手に入れました', 2000); }catch(e){}
  return pick.id;
}

/* ── 図鑑 ── */
function dkcTabBook(){
  var n = dkcSeenN();
  if(!DKC_S.bookSel || !dkcCard(DKC_S.bookSel)) DKC_S.bookSel = CARDPOOL[0].id;
  var sel = dkcCard(DKC_S.bookSel), ss = dkBookState(sel.id), so = dkcOwn(sel.id);
  var ms = DKC_BOOKRW.map(function(r){
    var got = dkcClaimed(r.key), can = !got && n >= r.n;
    var ic = r.kind === 'gold' ? dkcCoin() : r.kind === 'gem' ? dkcGemI() : r.kind === 'pend' ? dkcSvg('pend') : dkcSvg('crown');
    return '<div class="dkc-ms' + (got ? ' dkc-got' : can ? ' dkc-can' : '') + '" style="--p:' + (r.n / 24).toFixed(4) + '">'
      + '<div class="dkc-msic">' + ic + '</div><b>' + r.n + '枚</b>'
      + (can ? '<button class="dkbtn gr dkc-bt2" data-dkc-bclaim="' + r.key + '">受け取る</button>'
             : '<span class="dkc-msnm">' + (got ? '受取済' : esc(r.nm)) + '</span>')
      + '</div>';
  }).join('');
  var grid = CARDPOOL.map(function(c){
    return dkcItem(c, { on:c.id === sel.id, eq:false, dup:false, attr:'data-dkc-book="' + c.id + '"', state:dkBookState(c.id) });
  }).join('');
  var det;
  if(ss === 'unseen'){
    det = '<div class="hd"><span class="nm">？？？</span><span class="lv dkc-lvq">未発見</span></div>'
      + '<div class="dkc-bookcard">' + dkcSealCard({ cls:'dkc-mid' }) + '</div>'
      + '<div class="dkc-booktx"><p>まだ出会っていないカードです。</p>'
      + '<p>キューブで引いたり、対戦で相手が使っていたりすると記録されます。はじめて出会うと 200G。</p></div>';
  } else {
    det = '<div class="hd">' + dkcRar(sel.rar, 'r') + '<span class="nm">' + esc(sel.nm) + '</span>'
      + '<span class="lv' + (so ? '' : ' dkc-lvq') + '">' + (so ? 'Lv.' + so.lv + (so.dup ? ' ×' + so.dup : '') : '未所持') + '</span></div>'
      + '<div class="dkc-bookcard">' + dkcBigCard(sel, so ? so.lv : 1, { cls:'dkc-mid', state:ss }) + '</div>'
      + '<div class="dkc-booktx"><p><b>入手先</b>' + esc(dkcWhere(sel)) + '</p>'
      + (so ? (function(){ var sk = dkcSkillOf(sel.id) || { label:sel.sk.nm, ds:sel.sk.ds, when:'対戦中' };
                return '<p><b>スキル</b>' + esc(sk.label) + '：' + esc(sk.ds) + '（' + esc(sk.when) + '）</p>'; })()
            : '<p>持つとスキルと能力値が見られます。</p>') + '</div>'
      + (so ? '<div class="btns"><button class="dkbtn gd dkc-bt" id="dkcBookView">このカードを見る</button></div>' : '');
  }
  var html = '<div class="dkdark dkc-bookL" data-fx="rise">'
    + '<div class="dkc-mhd"><b>カード図鑑</b><small>見つけたカード</small><em><span id="dkcBookN">' + n + '</span>/' + CARDPOOL.length + '</em></div>'
    + '<div class="dkc-msbar"><div class="dkc-mstrack"><i style="width:' + (n / 24 * 100) + '%"></i></div>' + ms + '</div>'
    + '<div class="dkc-grid" data-fx-step="22">' + grid + '</div>'
    + '</div>'
    + '<div class="dkdark dkdet dkc-det dkc-bookR" data-fx="riseR">' + det + '</div>';
  return {
    html: html,
    wire: function(el){
      el.querySelectorAll('[data-dkc-book]').forEach(function(b){
        b.onclick = function(){ dkcSfx('click'); DKC_S.bookSel = b.getAttribute('data-dkc-book'); showCards(); };
      });
      el.querySelectorAll('[data-dkc-bclaim]').forEach(function(b){
        b.onclick = function(){ dkcClaimBook(b.getAttribute('data-dkc-bclaim'), b); };
      });
      var v = el.querySelector('#dkcBookView');
      if(v) v.onclick = function(){ dkcSfx('click'); DKC_S.sel = sel.id; DKC_S.tab = 'own'; showCards(); };
    }
  };
}

/* ── アルバム（そろえた4枚はなくならない） ── */
function dkcTabAlbum(){
  var cards = DKC_ALBUMS.map(function(al, i){
    var have = dkcAlbumHave(al), got = dkcClaimed(al.id), can = !got && have >= 4;
    var rwic = al.rw.kind === 'pend' ? dkcSvg('pend') : al.rw.kind === 'die' ? dkcSvg('dice') : al.rw.kind === 'card' ? dkcSvg('cards')
             : al.rw.kind === 'gold+gem' ? dkcCoin() + dkcGemI() : dkcCoin();
    return '<div class="dkc-album' + (got ? ' dkc-got' : can ? ' dkc-can' : '') + '" data-fx="deal">'
      + '<div class="dkc-alhd"><span class="dkc-alno">' + (i + 1) + '</span><b>' + esc(al.nm) + '</b><em>' + have + '/4</em></div>'
      + '<div class="dkc-alcards">' + al.cards.map(function(id){
          var c = dkcCard(id); return dkcItem(c, { eq:false, dup:false });
        }).join('') + '</div>'
      + '<div class="dkc-alft"><span class="dkc-rw">' + rwic + '<b>' + esc(al.rnm) + '</b></span>'
      + (got ? '<span class="dkc-stamp">受取済</span>'
             : '<button class="dkbtn ' + (can ? 'gd fx-primary' : 'gr') + ' dkc-bt2" data-dkc-album="' + al.id + '"' + (can ? '' : ' disabled') + '>'
               + (can ? '受け取る' : 'あと ' + (4 - have) + ' 枚') + '</button>')
      + '</div></div>';
  }).join('');
  var html = '<div class="dkc-albwrap">'
    + '<div class="dkc-albnote" data-fx="rise"><b>アルバム</b><span>決まった4枚をそろえると、ごほうびを1回受け取れます。そろえたカードはなくなりません。</span></div>'
    + '<div class="dkc-albums" data-fx-step="60">' + cards + '</div></div>';
  return {
    html: html,
    wire: function(el){
      el.querySelectorAll('[data-dkc-album]').forEach(function(b){
        b.onclick = function(){ dkcClaimAlbum(b.getAttribute('data-dkc-album'), b); };
      });
    }
  };
}

/* ══════════ カード画面（本体） ══════════ */
function showCards(tab){
  var el0 = document.getElementById('cards');
  var entering = (DKC_S.onScr !== 'cards') || !el0;
  if(typeof tab === 'string' && DKC_CTABS.some(function(t){ return t.id === tab; })) DKC_S.tab = tab;
  else if(entering) DKC_S.tab = 'own';
  if(entering){ DKC_S.scroll = {}; DKC_S.mats = {}; DKC_S.mixA = DKC_S.mixB = null; DKC_S.busy = false; DKC_S.lastC = ''; }
  else dkcKeep(el0);
  var swap = !entering && DKC_S.lastC && DKC_S.lastC !== DKC_S.tab;
  if(swap){ DKC_S.scroll = {}; }
  DKC_S.lastC = DKC_S.tab;
  var T = DKC_S.tab, part;
  if(T === 'up') part = dkcTabUp();
  else if(T === 'mix') part = dkcTabMix();
  else if(T === 'book') part = dkcTabBook();
  else if(T === 'album') part = dkcTabAlbum();
  else part = dkcTabOwn();
  var n = dkcSeenN(), badges = {};
  var bk = DKC_BOOKRW.filter(function(r){ return !dkcClaimed(r.key) && n >= r.n; }).length;
  var ab = DKC_ALBUMS.filter(function(a){ return !dkcClaimed(a.id) && dkcAlbumHave(a) >= 4; }).length;
  if(bk) badges.book = '!'; if(ab) badges.album = '!';
  var el = dkMake('cards', 'shop',
      dkHead('cards', { title:'キャラクターカード' })
    + dkcTabs(DKC_CTABS, T, ['cards', 'up', 'mix', 'book', 'album'], badges)
    + '<div class="dkbody dkc-body dkc-t' + T + (T === 'book' || T === 'album' ? '' : ' dkcol') + (swap ? ' dkc-swap' : '') + '">' + part.html + '</div>');
  el.classList.add('dkc-scr');
  try{ dkpLogo(el, 'カード', 'キャラクター'); }catch(e){}
  dkWire(el, function(id){ if(DKC_S.busy) return; DKC_S.tab = id; showCards(); });
  dkcFxMarks(el);
  try{ part.wire(el); }catch(e){ console.error('[WP2]', e); }
  dkcStrip(el);
  screenTo('cards');
  dkcSkin(el, 'cards');
  dkcRestore(el);
}
/* ══════════════════════════════════════════════════════════════
   カードの演出（強化・合成・受け取り）
   ══════════════════════════════════════════════════════════════ */
/* 作り直した後の財布を「前の値」から回す（コインが飛んで着いてから数える） */
function dkcWalletFx(from, old, kinds){
  try{
    var root = document.getElementById('cards') && dkcScreenOn('cards') ? document.getElementById('cards') : document.getElementById('dice');
    var put = function(sel, v){ if(!root) return; root.querySelectorAll(sel).forEach(function(e){ e.textContent = Number(v).toLocaleString(); }); };
    var list = [];
    if(SV.gold !== old.g){ put('#dkGold', old.g); list.push('gold'); }
    if(SV.gem !== old.d){ put('#dkGem', old.d); list.push('gem'); }
    if(!list.length){ dkWallet(); return; }
    list.forEach(function(k){
      var to = fxWalletEl(k), up = (k === 'gold' ? SV.gold > old.g : SV.gem > old.d);
      if(up) fxCoins(from, to, { kind:(k === 'gem' ? 'gem' : 'coin'), n:(k === 'gem' ? 8 : 14) }).then(function(){ dkWallet(); });
      else { fxCoins(to, from, { kind:(k === 'gem' ? 'gem' : 'coin'), n:6, dur:520 }); dkWallet(); }
    });
  }catch(e){ console.error('[WP2]', e); try{ dkWallet(); }catch(e2){} }
}
function dkcMedal(p){ return '<span class="fx-medal dkc-medal dkc-p' + p.rar + '">' + dkcSvg('pend') + '</span>'; }
function dkcRunUp(tid){
  if(DKC_S.busy) return;
  var plan = dkcUpPlan(tid);
  if(!plan.ok){ dkcWarn('強化できません', plan.reason); return; }
  var el = document.getElementById('cards');
  var slots = el ? Array.prototype.slice.call(el.querySelectorAll('.dkc-slot.dkc-fill')) : [];
  var big = document.getElementById('dkcBig');
  var old = { g:SV.gold, d:SV.gem };
  var res = dkcDoUp(tid);
  if(!res) return;
  DKC_S.busy = true;
  if(el) el.classList.add('dkc-busy');
  dkcUpFx(res, slots, big, old).catch(function(e){ console.error('[WP2]', e); }).then(function(){
    DKC_S.busy = false;
    if(dkcScreenOn('cards')) showCards();
    if(res.cmax) dkcCmaxModal(res);
  });
}
async function dkcUpFx(res, slots, big, old){
  var btn = document.getElementById('dkcUpGo');
  if(btn) fxCoins(fxWalletEl('gold'), btn, { kind:'coin', n:6, dur:520 });
  try{ dkWallet(); }catch(e){}
  var bp = fxPt(big);
  slots.forEach(function(s, i){
    var p = fxPt(s);
    try{ s.animate([{ transform:'translate(0,0) scale(1)' }, { transform:'translate(' + (bp.x - p.x).toFixed(1) + 'px,' + (bp.y - p.y).toFixed(1) + 'px) scale(.2)' }],
      { duration:420, delay:i * 70, easing:'cubic-bezier(.4,0,1,1)', fill:'forwards' }); }catch(e){}
  });
  dkcSfx('cardIn');
  await fxWait(420 + slots.length * 70);
  if(big){ fxBurst(big, { kind:'star', n:22, power:1.1 }); fxShake(big, 240); }
  dkcSfx('build');
  var g = res.grade;
  var txt = g === 'Excellent' ? 'EXCELLENT!!' : g === 'Great' ? 'GREAT!' : 'SUCCESS';
  if(g === 'Excellent'){
    fxFlash(); dkcSfx('gachaRare');
    var st = big && big.closest('.dkc-stage'), r = st && st.querySelector('.fx-rays');
    if(r){ r.classList.add('fast'); r.classList.add('dkc-hot'); }
    if(big) fxBurst(big, { kind:'conf', n:40, power:1.4 });
  } else if(g === 'Great'){ if(big) fxBurst(big, { kind:'conf', n:22 }); dkcSfx('coin'); }
  var stg = big && big.closest('.dkc-stage'), sp = stg ? fxPt(stg) : { x:612, y:400 };
  var lvto = document.querySelector('#cards .dkc-lvto'); if(lvto) lvto.classList.add('dkc-fin');
  var pt = fxPopText({ x:sp.x, y:bp.y - 40 }, txt, { tone:(g === 'Great' ? 'emer' : 'gold'), size:(g === 'Excellent' ? 84 : g === 'Great' ? 72 : 58) });
  if(pt && g !== 'Success' && pt.animate){
    try{ pt.animate([{ transform:'translateY(0)' }, { transform:'translateY(-34px)' }, { transform:'translateY(0)' }, { transform:'translateY(-14px)' }, { transform:'translateY(0)' }],
      { duration:(g === 'Excellent' ? 760 : 600), easing:'ease-out', composite:'add' }); }catch(e){}
  }
  fxPopText({ x:sp.x, y:bp.y + 70 }, '+' + dkcFmt(res.gain) + ' EXP', { tone:'emer', size:40 });
  var fmt = function(v){ return String(Math.round(v)); };
  [document.getElementById('dkcLvNow'), big && big.querySelector('.dkc-lvn')].forEach(function(e){
    if(e && res.to !== res.from) fxCount(e, res.to, { from:res.from, dur:720, fmt:fmt });
  });
  if(res.to > res.from){ try{ jingle('levelup'); }catch(e){} }
  await fxWait(g === 'Excellent' ? 1500 : 1200);
}
function dkcCmaxModal(res){
  var c = dkcCard(res.id), p = res.cmax && res.cmax.pend; if(!c || !p) return;
  var dup = res.cmax.got && !res.cmax.got.fresh;
  modal('<div class="modal dkc-modal"><div class="dkc-mbox">'
    + '<div class="fx-ribbon gold"><b>上限 Lv 到達！</b></div>'
    + '<p class="dkc-mp">' + esc(c.nm) + ' が ' + dkcRarNm(c.rar) + 'クラスの上限 Lv.' + res.to + ' に届きました。ごほうびのペンダントです。</p>'
    + '<div class="dkc-rwbig">' + dkcMedal(p) + '<div><b>' + esc(p.nm) + '</b><span>' + dkcRarNm(p.rar) + (dup ? ' ・ 重なり＋1' : ' ・ NEW') + '</span></div></div>'
    + '<div class="btnrow dkc-mbtns"><button class="dkbtn gd dkc-bt" data-act="ok">受け取る</button></div></div></div>');
  setTimeout(function(){ var m = document.querySelector('#modalWrap .dkc-rwbig'); if(m){ fxBurst(m, { kind:'star', n:18 }); } }, 260);
}
function dkcRunMix(){
  if(DKC_S.busy) return;
  var plan = dkcMixPlan();
  if(!plan.ok){ dkcWarn('合成できません', plan.reason); return; }
  var el = document.getElementById('cards');
  var slots = el ? Array.prototype.slice.call(el.querySelectorAll('.dkc-mixslot:not(.dkc-empty)')) : [];
  var resEl = el ? el.querySelector('.dkc-mixres') : null;
  var btn = document.getElementById('dkcMixGo');
  var res = dkcDoMix();
  if(!res) return;
  DKC_S.busy = true;
  if(el) el.classList.add('dkc-busy');
  (async function(){
    try{
      if(btn) fxCoins(fxWalletEl('gold'), btn, { kind:'coin', n:6, dur:520 });
      dkWallet();
      var rp = fxPt(resEl);
      slots.forEach(function(s, i){
        var p = fxPt(s);
        try{ s.animate([{ transform:'none' }, { transform:'translate(' + (rp.x - p.x).toFixed(1) + 'px,' + (rp.y - p.y).toFixed(1) + 'px) scale(.35) rotate(' + (i ? 14 : -14) + 'deg)' }],
          { duration:520, easing:'cubic-bezier(.55,0,.9,.4)', fill:'forwards' }); }catch(e){}
      });
      if(resEl){ try{ resEl.animate([{ transform:'scale(1)' }, { transform:'scale(1.08) rotate(2deg)' }, { transform:'scale(.96) rotate(-2deg)' }, { transform:'scale(1)' }],
        { duration:520, easing:'ease-in-out', composite:'add' }); }catch(e){} }
      dkcSfx('gachaRoll');
      await fxWait(520);
      fxFlash();
      if(resEl){ fxBurst(resEl, { kind:'star', n:30, power:1.3 }); }
      if(res.rar === 'SS'){ dkcSfx('gachaRare'); if(resEl) fxBurst(resEl, { kind:'conf', n:36, power:1.3 }); }
      else dkcSfx('coin');
      await fxWait(300);
    }catch(e){ console.error('[WP2]', e); }
    DKC_S.busy = false;
    DKC_S.sel = res.got;
    if(dkcScreenOn('cards')) showCards();
    dkcMixModal(res);
  })();
}
async function dkcMixModal(res){
  var c = dkcCard(res.got); if(!c) return;
  var aimTx = '';
  if(res.aim){
    aimTx = res.hit ? '<div class="dkc-hit">狙い的中！</div>'
      : '<div class="dkc-miss2">狙いはまだ … あと ' + Math.max(1, 10 - ((SV.pity && SV.pity.card) | 0)) + ' 回で確定</div>';
  }
  var cost = res.rar === 'SS' ? 40 : 20, can = SV.gem >= cost;
  var act = await modal('<div class="modal dkc-modal"><div class="dkc-mbox">'
    + '<div class="fx-ribbon ' + (res.rar === 'SS' ? 'gold' : 'blue') + '"><b>合成成功！</b></div>'
    + '<div class="dkc-mcard">' + dkcBigCard(c, 1, { cls:'dkc-sm' }) + '</div>'
    + '<p class="dkc-mp">' + dkcRarNm(c.rar) + 'クラス「' + esc(c.nm) + '」を Lv.1 で手に入れました' + (res.fresh ? '（NEW）' : '（重なり＋1）') + '</p>'
    + aimTx
    + '<div class="btnrow dkc-mbtns"><button class="dkbtn gr dkc-bt" data-act="view">カードを見る</button>'
    + '<button class="dkbtn dkc-bt dkc-remix" data-act="remix"' + (can ? '' : ' disabled') + '>再合成 ' + dkcGemI() + cost + '</button>'
    + '<button class="dkbtn gd dkc-bt" data-act="ok">とじる</button></div>'
    + '<p class="dkc-rmnote">再合成：ダイヤ ' + cost + ' でもう1回引き、2枚から1枚を選べます（1回だけ・天井に数えない）</p></div></div>');
  if(act === 'remix'){ await dkcRemix(res, cost); return; }
  if(act === 'view' && dkcScreenOn('cards')){ DKC_S.sel = c.id; DKC_S.tab = 'own'; showCards(); }
}
async function dkcAimModal(){
  var ss = CARDPOOL.filter(function(c){ return c.rar === 'SS'; });
  var cur = SV.aim && SV.aim.card;
  var items = ss.map(function(c){
    var st = dkBookState(c.id), face = dkcFace(c.id);
    return '<button class="dkc-aimop dkc-rSS' + (cur === c.id ? ' on' : '') + (st === 'unseen' ? ' dkc-sunseen' : '') + '" data-act="' + c.id + '">'
      + '<i class="dkc-face"' + (st !== 'unseen' && face ? ' style="background-image:url(' + face + '),var(--dkc-rg)"' : '') + '>'
      + (st === 'unseen' ? '<i class="dkc-sealq"></i>' : '') + '</i>'
      + '<b>' + (st === 'unseen' ? '？？？' : esc(c.nm)) + '</b></button>';
  }).join('');
  var act = await modal('<div class="modal dkc-modal"><div class="dkc-mbox dkc-wide">'
    + '<div class="fx-ribbon gold"><b>狙いの S+ をえらぶ</b></div>'
    + '<p class="dkc-mp">S と S の合成で、狙ったカードが出やすくなります。1回目10%、2回目20% … 10回目で必ず出ます。</p>'
    + '<div class="dkc-aimgrid">' + items + '</div>'
    + '<div class="btnrow dkc-mbtns"><button class="dkbtn gr dkc-bt" data-act="none">おまかせ</button>'
    + '<button class="dkbtn gy dkc-bt" data-act="cancel">やめる</button></div></div></div>');
  if(!act || act === 'cancel') return;
  if(!SV.aim || typeof SV.aim !== 'object') SV.aim = { pend:null, card:null };
  SV.aim.card = (act === 'none') ? null : act;
  saveNow();
  if(dkcScreenOn('cards')) showCards();
}
/* 図鑑の一括報酬 */
function dkcClaimBook(key, btn){
  if(DKC_S.busy) return;
  var r = DKC_BOOKRW.filter(function(x){ return x.key === key; })[0];
  if(!r || dkcClaimed(key) || dkcSeenN() < r.n) return;
  if(r.kind === 'pend'){ dkcPendChoice(key); return; }
  var from = fxPt(btn), old = { g:SV.gold, d:SV.gem };
  dkcSetClaim(key);
  if(r.kind === 'gold') SV.gold += r.v;
  else if(r.kind === 'gem') SV.gem += r.v;
  else if(r.kind === 'title') SV.title = r.v;
  saveNow();
  dkcSfx('coin');
  showCards();
  dkcWalletFx(from, old);
  fxBurst(from, { kind:(r.kind === 'gem' ? 'gem' : r.kind === 'gold' ? 'coin' : 'star'), n:16 });
  if(r.kind === 'title'){ fxFlash(); dkcSfx('gachaRare'); fxPopText({ x:800, y:420 }, '称号「' + r.v + '」', { tone:'gold', size:64 }); }
  try{ toast('R', '📖', '図鑑 ' + r.n + '枚のごほうび', esc(r.nm), 2000); }catch(e){}
}
async function dkcPendChoice(key){
  var items = PENDANTS.map(function(p){
    var o = SV.pendants && SV.pendants[p.id];
    return '<button class="dkc-aimop dkc-pop" data-act="' + p.id + '">' + dkcMedal(p)
      + '<b>' + esc(p.nm) + '</b><small>' + dkcRarNm(p.rar) + (o ? ' ・ 所持' : '') + '</small></button>';
  }).join('');
  var act = await modal('<div class="modal dkc-modal"><div class="dkc-mbox dkc-wide">'
    + '<div class="fx-ribbon gold"><b>好きなペンダントを1つ</b></div>'
    + '<p class="dkc-mp">図鑑18枚のごほうびです。持っているペンダントなら重なり（強化の素材）になります。</p>'
    + '<div class="dkc-aimgrid dkc-pgrid">' + items + '</div>'
    + '<div class="btnrow dkc-mbtns"><button class="dkbtn gy dkc-bt" data-act="cancel">あとで</button></div></div></div>');
  if(!act || act === 'cancel' || !pendById(act) || dkcClaimed(key)) return;
  dkcSetClaim(key);
  var g = dkGivePend(act), p = pendById(act);
  saveNow();
  dkcSfx('coin');
  if(dkcScreenOn('cards')) showCards();
  fxBurst({ x:800, y:420 }, { kind:'star', n:24, power:1.2 });
  try{ toast('R', '📿', esc(p.nm), (g && !g.fresh) ? '重なり＋1' : '手に入れました', 2000); }catch(e){}
}
/* アルバムの報酬 */
function dkcClaimAlbum(id, btn){
  if(DKC_S.busy) return;
  var al = DKC_ALBUMS.filter(function(a){ return a.id === id; })[0];
  if(!al || dkcClaimed(id) || dkcAlbumHave(al) < 4) return;
  var from = fxPt(btn), old = { g:SV.gold, d:SV.gem }, rw = al.rw, show = null;
  dkcSetClaim(id);
  if(rw.kind === 'gold+gem'){ SV.gold += rw.g; SV.gem += rw.d; }
  else if(rw.kind === 'gold'){ SV.gold += rw.g; }
  else if(rw.kind === 'pend'){ var p = dkcRandPend(rw.rar), g = dkGivePend(p.id); show = { t:'pend', p:p, dup:!!(g && !g.fresh) }; }
  else if(rw.kind === 'die'){
    if(!dkcDieOwn(rw.id)){ SV.dice[rw.id] = 1; show = { t:'die', id:rw.id }; }
    else { SV.gold += rw.g; show = { t:'dieg', id:rw.id, g:rw.g }; }
  } else if(rw.kind === 'card'){
    var pool = CARDPOOL.filter(function(c){ return c.rar === rw.rar; });
    var fresh = pool.filter(function(c){ return !dkcOwn(c.id); });
    var pick = (fresh.length ? fresh : pool)[(Math.random() * (fresh.length ? fresh.length : pool.length)) | 0];
    var gc = dkcGiveCard(pick.id); show = { t:'card', c:pick, fresh:gc.fresh };
  }
  saveNow();
  dkcSfx('coin');
  showCards();
  dkcWalletFx(from, old);
  fxBurst(from, { kind:'star', n:20, power:1.1 });
  if(show){
    var body = '';
    if(show.t === 'pend') body = '<div class="dkc-rwbig">' + dkcMedal(show.p) + '<div><b>' + esc(show.p.nm) + '</b><span>' + dkcRarNm(show.p.rar) + (show.dup ? ' ・ 重なり＋1' : ' ・ NEW') + '</span></div></div>';
    else if(show.t === 'die') body = '<div class="dkc-rwbig"><img class="dkc-dimg" alt="" src="' + dkcDieImg(show.id, 160) + '"><div><b>' + esc(dkcDie(show.id).nm) + '</b><span>NEW ・ Lv.1</span></div></div>';
    else if(show.t === 'dieg') body = '<div class="dkc-rwbig"><img class="dkc-dimg" alt="" src="' + dkcDieImg(show.id, 160) + '"><div><b>' + dkcFmt(show.g) + ' ゴールド</b><span>' + esc(dkcDie(show.id).nm) + ' はもう持っているため</span></div></div>';
    else if(show.t === 'card') body = '<div class="dkc-mcard">' + dkcBigCard(show.c, 1, { cls:'dkc-sm' }) + '</div><p class="dkc-mp">' + dkcRarNm(show.c.rar) + '「' + esc(show.c.nm) + '」' + (show.fresh ? '（NEW）' : '（重なり＋1）') + '</p>';
    modal('<div class="modal dkc-modal"><div class="dkc-mbox"><div class="fx-ribbon gold"><b>アルバム「' + esc(al.nm) + '」</b></div>'
      + body + '<div class="btnrow dkc-mbtns"><button class="dkbtn gd dkc-bt" data-act="ok">受け取る</button></div></div></div>');
  } else {
    try{ toast('R', '📕', 'アルバム「' + esc(al.nm) + '」', esc(al.rnm) + ' を受け取りました', 2200); }catch(e){}
  }
}
/* ══════════════════════════════════════════════════════════════
   サイコロ画面
   ══════════════════════════════════════════════════════════════ */
function dkcDItem(d, on){
  var own = dkcDieOwn(d.id), lv = dkcDieLv(d.id);
  return '<div class="dkc-item dkc-ditem' + (on ? ' on' : '') + (own ? '' : ' dkc-dim') + '" data-dkc-die="' + d.id + '" data-fx-press>'
    + (SV.die === d.id && own ? '<span class="dkc-eq">装着中</span>' : '')
    + '<div class="dkc-dface"><img alt="" src="' + dkcDieImg(d.id, 128) + '">' + (own ? '' : '<i class="dkc-lk">' + dkcSvg('lock') + '</i>') + '</div>'
    + '<span class="dkc-ilv' + (own ? '' : ' dkc-miss') + '">' + (own ? (lv >= 10 ? '<em>MAX</em>' : '') + 'Lv.' + lv : '未所持') + '</span>'
    + '<span class="dkc-inm">' + esc(d.nm) + '</span></div>';
}
function dkcDBottom(sel){
  return '<div class="dkdark dkbottom dkc-bottom" data-fx="rise">'
    + '<span class="cnt dkc-cnt">所持<br>サイコロ<br><b>' + dkcDieN() + '/' + DICE.length + '</b></span>'
    + '<div class="dkc-strip"><div class="dkrow dkc-row" data-dkc-sk="d-row" data-fx-step="30">'
    + DICE.map(function(d){ return dkcDItem(d, d.id === sel); }).join('')
    + '</div><i class="dkc-fade dkc-fl"></i><i class="dkc-fade dkc-fr"></i></div></div>';
}
/* 台座の上で跳ねるサイコロ（Lv5 から軌跡、Lv10 で着地の床が光る。ゲームの演出の見本） */
function dkcPedestal(d, lv, kw){
  var img = dkcDieImg(d.id, 220);
  return '<div class="dkc-ped dkc-pl' + (lv >= 10 ? '10' : lv >= 5 ? '5' : '1') + (kw ? ' dkc-kw' + kw : '') + '" id="dkcPed">'
    + '<i class="dkc-pedring"></i><i class="dkc-pedtop"></i><i class="dkc-pedglow"></i>'
    + '<div class="dkc-hop">'
    +   '<img class="dkc-pdie" alt="" src="' + img + '">'
    + '</div>'
    + (kw ? '<span class="dkc-kwtag">' + (kw === 'atk' ? '攻の極' : '守の極') + '</span>' : '')
    + '</div>';
}
function dkcDieBars(id, lv){
  var rows = dkcDieRows(id, lv);
  if(!rows.length) return '<div class="dkc-dbars dkc-dnone">能力値の上乗せはありません（木のサイコロ）</div>';
  var tone = { gd:'', bl:' blue', rd:' green' };
  return '<div class="dkc-dbars"><div class="dkc-abhd"><span>サイコロの能力</span><em>Lv1値 / MAX値</em></div>' + rows.map(function(r){
    return '<div class="st dkc-st sk-barrow big"><span class="l nm">' + esc(r.l) + '</span>'
      + '<span class="sk-bar2' + (tone[r.c] || '') + '"><i style="--sk-v:' + Math.max(4, Math.min(100, Math.round(r.cur / Math.max(1, r.b) * 100))) + '%"></i></span>'
      + '<b class="vl">' + (r.u === '回' ? '+' : '') + r.a + ' / ' + dkcAbTx(r.b, r.u) + '</b></div>';
  }).join('') + '</div>';
}
function dkcDieHd(d, own, lv){
  return '<div class="hd">' + dkcRar(d.rar === 'S+' ? 'SS' : d.rar, 'r') + '<span class="nm">' + esc(d.nm) + '</span>'
    + '<span class="lv' + (own ? '' : ' dkc-lvq') + '">' + (own ? 'Lv.' + lv + '<small>/10</small>' : '未所持') + '</span></div>';
}
function dkcSelDie(){
  if(!DKC_S.dsel || !dkcDie(DKC_S.dsel)) DKC_S.dsel = dkcDieOwn(SV.die) ? SV.die : 'd0';
  return dkcDie(DKC_S.dsel);
}
/* ── サイコロ ── */
function dkcTabDice(){
  var d = dkcSelDie(), own = dkcDieOwn(d.id), lv = own ? dkcDieLv(d.id) : 1, eq = SV.die === d.id;
  var kw = (own && lv >= 10 && SV.kiwami) ? SV.kiwami[d.id] : null;
  var hero = dkU('hero-dice');
  /* 主役の絵のまわりに光の輪（回る1個は共通スキン、外側の2重は止まった絵） */
  var stage = hero
    ? '<div class="dkc-hero" style="background-image:url(' + hero + ')"></div>'
      + '<i class="dkc-rings" aria-hidden="true"></i>'
      + '<div class="dkc-cap"><b>運が、</b><b>世界を動かす。</b></div>'
    : dkcPedestal(d, lv, kw);
  var btns = own
    ? '<button class="dkbtn gd dkc-bt" id="dkcDToUp"' + (lv >= 10 ? ' disabled' : '') + '>' + (lv >= 10 ? 'Lv.10（最大）' : '強化する') + '</button>'
      + '<button class="dkbtn gr dkc-bt" id="dkcDEquip"' + (eq ? ' disabled' : '') + '>' + (eq ? '装着中' : '装着') + '</button>'
    : '<button class="dkbtn gd dkc-bt" id="dkcDToUp" disabled>強化する</button>'
      + '<button class="dkbtn gr dkc-bt" id="dkcDShop">ショップへ</button>';
  var html = '<div class="dkmain dkc-main">'
    + '<div class="dkstage dkc-stage dkc-dst" data-fx="hero">' + stage + '</div>'
    + '<div class="dkdark dkdet dkc-det dkc-ddet" data-fx="riseR">'
    +   dkcDieHd(d, own, lv)
    +   '<div class="ef dkc-ef"><span class="ic dkc-dic"><img alt="" src="' + dkcDieImg(d.id, 96) + '"></span><div><b>サイコロの力</b>'
    +     '<p>' + esc(d.ds) + '</p></div></div>'
    +   '<div class="dkc-dnote">' + (own ? (lv >= 10 ? (kw ? '極：' + (kw === 'atk' ? '攻（出目の大きさ +15%）' : '守（ゲージの当たり +2）') : 'Lv.10！「極」タブで特性を付けられます')
                                               : 'Lv.10 で最大の力。いまは Lv.' + lv + ' ぶんの力です')
                                     : '未所持（ショップで購入）。買うと Lv.1 の力から始まります') + '</div>'
    +   dkcDieBars(d.id, lv)
    +   dkcGrowRow(own, lv, d.id)
    +   '<div class="btns">' + btns + '</div>'
    +   (own ? '' : '<div class="dkc-why">まだ持っていないので強化できません。ショップで購入できます。</div>')
    + '</div></div>'
    + dkcDBottom(d.id);
  return { html:html, wire:function(el){
    dkcWireDice(el);
    var up = el.querySelector('#dkcDToUp');
    if(up) up.onclick = function(){ if(!dkcDieOwn(d.id)) return; dkcSfx('click'); DKC_S.dtab = 'up'; showDice(); };
    var eqb = el.querySelector('#dkcDEquip');
    if(eqb) eqb.onclick = function(){
      if(!dkcDieOwn(d.id) || SV.die === d.id) return;
      SV.die = d.id; saveNow(); dkcSfx('click');
      try{ dkkInvalidate('die'); }catch(e){}
      try{ toast('R', '🎲', esc(d.nm), '装着しました', 1500); }catch(e){}
      showDice();
    };
    var sh = el.querySelector('#dkcDShop');
    if(sh) sh.onclick = function(){ dkcSfx('click'); dkcGoShop(); };
  } };
}
/* 育ち具合：小さな丸10個 → お手本の「太いバー」（節目 Lv.5 / Lv.10 は刻み目で見せる） */
function dkcGrowRow(own, lv, id){
  var pn = (DKC_DPART[id] || DKC_DPART.d0).nm;
  var nx = !own ? '買うと Lv.1 から育てられます' : lv < 5 ? '次の節目：Lv.5 で転がる間に' + pn : lv < 10 ? '次の節目：Lv.10 で着地に' + pn + '16個・専用の音・極' : '最大まで育ちました';
  return '<div class="dkc-grow"><div class="dkc-growhd"><b>育ち具合</b><span>' + nx + '</span></div>'
    + '<div class="sk-barrow big dkc-growbar">'
    +   '<span class="sk-bar2"><i style="--sk-v:' + (own ? lv * 10 : 0) + '%"></i>'
    +     '<u class="dkc-gmk dkc-gm5" aria-hidden="true"></u><u class="dkc-gmk dkc-gm10" aria-hidden="true"></u></span>'
    +   '<b class="vl">' + (own ? 'Lv.' + lv : 'Lv.—') + '<small>/10</small></b></div>'
    + (own && lv < 10 ? '<div class="dkc-growft">Lv.10 まで ' + dkcCoin() + dkcFmt(dkcDieRest(lv)) + '（失敗なし）</div>' : '') + '</div>';
}
function dkcGoShop(){  try{ if(showShop.length === 0 && typeof dkShopTab !== 'undefined') dkShopTab = 'osusume'; }catch(e){}
  showShop('dice');
}
function dkcWireDice(el){
  el.querySelectorAll('[data-dkc-die]').forEach(function(b){
    b.onclick = function(){ if(DKC_S.busy) return; dkcSfx('click'); DKC_S.dsel = b.getAttribute('data-dkc-die'); showDice(); };
  });
}
/* ── 強化（ゴールドだけ・失敗なし・Lv10 まで） ── */
function dkcTabDUp(){
  var d = dkcSelDie(), own = dkcDieOwn(d.id), lv = own ? dkcDieLv(d.id) : 1;
  var kw = (own && lv >= 10 && SV.kiwami) ? SV.kiwami[d.id] : null;
  var cost = dkcDieCost(lv), rest = dkcDieRest(lv), nx = Math.min(10, lv + 1);
  var A = dkcDieRows(d.id, lv), pn = (DKC_DPART[d.id] || DKC_DPART.d0).nm;
  var why = !own ? '未所持（ショップで購入）なので強化できません' : lv >= 10 ? 'Lv.10（最大）です' : SV.gold < cost ? 'ゴールドが ' + dkcFmt(cost - SV.gold) + ' 足りません' : '';
  var pips = '';
  for(var i = 1; i <= 10; i++) pips += '<i class="dkc-pip' + (i <= lv ? ' on' : '') + (i === 5 || i === 10 ? ' dkc-mk' : '') + '"></i>';
  var tbl = A.length ? '<div class="dkc-dtbl"><div class="dkc-dth"><span>能力</span><b>いま</b><b>Lv.' + nx + '</b><b>MAX</b></div>'
    + A.map(function(r){
      return '<div class="dkc-dtr"><span>' + esc(r.l) + '</span><b>' + dkcAbTx(r.cur, r.u) + '</b>'
        + '<b class="dkc-nx">' + (lv >= 10 ? '—' : dkcAbTx(dkcAbAt(r.a, r.b, nx), r.u)) + '</b><b class="dkc-mx">' + dkcAbTx(r.b, r.u) + '</b></div>';
    }).join('') + '</div>'
    : '<div class="dkc-dtbl dkc-dnone">能力値の上乗せはありません。Lv が上がると、振った時の演出が変わります</div>';
  var html = '<div class="dkmain dkc-main">'
    + '<div class="dkstage dkc-stage dkc-dped" data-fx="hero"><div class="fx-rays"></div>'
    +   dkcPedestal(d, lv, kw)
    +   '<div class="dkc-pips">' + pips + '</div>'
    +   '<div class="dkc-mile"><span class="' + (lv >= 5 ? 'on' : '') + '"><b>Lv.5</b>転がる間に' + pn + '</span>'
    +     '<span class="' + (lv >= 10 ? 'on' : '') + '"><b>Lv.10</b>着地で' + pn + '16個・専用の音</span>'
    +     '<button class="dkbtn gr dkc-bt2 dkc-fxbtn" id="dkcFxPrev">演出を見る</button></div>'
    + '</div>'
    + '<div class="dkdark dkdet dkc-det dkc-ddet" data-fx="riseR">'
    +   dkcDieHd(d, own, lv)
    +   tbl
    +   '<div class="dkc-planrow"><span>次の Lv</span><b>' + (own && lv < 10 ? dkcCoin() + dkcFmt(cost) : '—') + '</b>'
    +     '<small>' + (dkcClaimed('db5') ? '図鑑のごほうびで −20%' : '失敗しません') + '</small></div>'
    +   '<div class="dkc-planrow"><span>Lv.10 まで</span><b>' + (own ? dkcCoin() + dkcFmt(rest) : '—') + '</b></div>'
    +   '<div class="dkc-kwnote"><b>強化</b>ゴールドだけで上がり、失敗しません。Lv.5 で転がる間に' + pn + '、Lv.10 で着地に' + pn + '16個と専用の音、「極」が解放されます。</div>'
    +   '<div class="btns"><button class="dkbtn gd dkc-bt fx-primary" id="dkcDUp"' + (why ? ' disabled' : '') + '>強化する</button>'
    +     (own ? '' : '<button class="dkbtn gr dkc-bt" id="dkcDShop">ショップへ</button>') + '</div>'
    +   (why ? '<div class="dkc-why">' + esc(why) + '</div>' : '')
    + '</div></div>'
    + dkcDBottom(d.id);
  return { html:html, wire:function(el){
    dkcWireDice(el);
    var b = el.querySelector('#dkcDUp');
    if(b) b.onclick = function(){ dkcRunDieUp(d.id); };
    var fp = el.querySelector('#dkcFxPrev');
    if(fp) fp.onclick = function(){ if(DKC_S.busy) return; dkcFxPreview(d.id); };
    var sh = el.querySelector('#dkcDShop');
    if(sh) sh.onclick = function(){ dkcSfx('click'); dkcGoShop(); };
  } };
}
/* ── 極（Lv10 で解放。攻と守を無料で付け替え） ── */
function dkcTabKiwami(){
  var d = dkcSelDie(), own = dkcDieOwn(d.id), lv = own ? dkcDieLv(d.id) : 1;
  var kw = (own && lv >= 10 && SV.kiwami) ? SV.kiwami[d.id] : null, open = own && lv >= 10;
  var base = dkDieStats(d.id, 10, null), ka = dkDieStats(d.id, 10, 'atk'), kd = dkDieStats(d.id, 10, 'def');
  var r1 = function(v){ return Math.round(v * 10) / 10; };
  var opt = function(k, nm, ic, eff, a, b){
    return '<button class="dkc-kwopt dkc-k' + k + (kw === k ? ' on' : '') + '" data-dkc-kw="' + k + '"' + (open ? '' : ' disabled') + '>'
      + '<i class="dkc-kwic">' + dkcSvg(ic) + '</i><b>' + nm + '</b><span>' + eff + '</span>'
      + (a === b ? '<em class="dkc-kwsame">このサイコロでは変化なし</em>' : '<em>' + a + ' → ' + b + '</em>') + (kw === k ? '<i class="dkc-kwon">付けている</i>' : '') + '</button>';
  };
  var why = !own ? '未所持（ショップで購入）です' : lv < 10 ? 'Lv.10 で解放されます（いま Lv.' + lv + '）' : '';
  var html = '<div class="dkmain dkc-main">'
    + '<div class="dkstage dkc-stage dkc-dped" data-fx="hero"><div class="fx-rays' + (open ? '' : ' silver') + '"></div>'
    +   dkcPedestal(d, lv, kw)
    +   '<div class="dkc-kwcap">' + (open ? (kw ? (kw === 'atk' ? '攻の極' : '守の極') + ' をまとっています' : '特性をえらんでください') : '極は Lv.10 のサイコロだけ') + '</div>'
    + '</div>'
    + '<div class="dkdark dkdet dkc-det dkc-ddet" data-fx="riseR">'
    +   dkcDieHd(d, own, lv)
    +   '<div class="dkc-kwdesc">Lv.10 まで育てたサイコロに、特性を1つ付けられます。<b>何度でも無料</b>で付け替えできます。</div>'
    +   '<div class="dkc-kwopts">'
    +     opt('atk', '攻の極', 'sword', '出目の大きさ ＋15%', '+' + r1(base.big * 55) + '%', '+' + r1(ka.big * 55) + '%')
    +     opt('def', '守の極', 'shield', 'ゲージの当たり ＋2', '+' + r1(base.gauge), '+' + r1(kd.gauge))
    +   '</div>'
    +   '<div class="dkc-kwnote"><b>対戦では</b>攻の極は大きい目が出やすくなり、守の極はゲージの当たり枠が広がります。</div>'
    +   '<div class="dkc-mhd dkc-mhd2"><b>いまの力</b></div>' + dkcDieBars(d.id, lv, kw)
    +   (why ? '<div class="dkc-why">' + esc(why) + '</div>' : '')
    + '</div></div>'
    + dkcDBottom(d.id);
  return { html:html, wire:function(el){
    dkcWireDice(el);
    el.querySelectorAll('[data-dkc-kw]').forEach(function(b){
      b.onclick = function(){ dkcSetKiwami(d.id, b.getAttribute('data-dkc-kw'), b); };
    });
  } };
}
/* ── 図鑑（Lv1 と Lv10 の比較） ── */
function dkcTabDBook(){
  var n = dkcDieN();
  var rw = DKC_DBOOK.map(function(r){
    var got = dkcClaimed(r.key), can = !got && n >= r.n;
    return '<div class="dkc-drw' + (got ? ' dkc-got' : can ? ' dkc-can' : '') + '"><b>' + r.n + '種</b><span>' + esc(r.nm) + '</span>'
      + (can ? '<button class="dkbtn gd dkc-bt2 fx-primary" data-dkc-dclaim="' + r.key + '">受け取る</button>'
             : '<em>' + (got ? '受取済' : 'あと ' + (r.n - n) + ' 種') + '</em>') + '</div>';
  }).join('');
  var cards = DICE.map(function(d){
    var own = dkcDieOwn(d.id), lv = own ? dkcDieLv(d.id) : 0;
    var ab = dkcAbList(d.id), pt = DKC_DPART[d.id] || DKC_DPART.d0;
    return '<div class="dkc-dcard' + (own ? '' : ' dkc-dlock') + '" data-fx="deal">'
      + '<div class="dkc-dchd">' + dkcRar(d.rar === 'S+' ? 'SS' : d.rar, 'sm') + '<b>' + esc(d.nm) + '</b></div>'
      + '<div class="dkc-dcimg"><img alt="" src="' + dkcDieImg(d.id, 160) + '">' + (own ? '' : '<i class="dkc-lk">' + dkcSvg('lock') + '</i>') + '</div>'
      + '<div class="dkc-dcst">' + (own ? 'Lv.' + lv + (lv >= 10 ? '（最大）' : '') : '未所持') + '</div>'
      + '<p class="dkc-dcds">' + esc(d.ds) + '</p>'
      + '<div class="dkc-dcmp"><div class="dkc-dch"><span>能力</span><b>Lv.1 → Lv.10</b></div>'
      + (ab.length ? ab.map(function(r){ var nm = DKC_ABNM[r[0]];
          return '<div class="dkc-dcr"><span>' + esc(nm[0]) + '</span><b>' + (nm[1] === '回' ? '+' : '') + r[1] + ' → <em class="dkc-mx">' + dkcAbTx(r[2], nm[1]) + '</em></b></div>'; }).join('')
        : '<div class="dkc-dcr"><span>能力の上乗せなし</span></div>')
      + '</div>'
      + '<div class="dkc-dfx"><i class="dkc-dfxi">' + [0, 1, 2].map(function(i){ return '<img alt="" src="' + dkcDSprUrl(pt.k, i) + '">'; }).join('') + '</i>'
      +   '<span><b>Lv.5</b>転がる間に' + esc(pt.nm) + '</span><span><b>Lv.10</b>着地で16個＋音</span></div>'
      + (own ? '<button class="dkbtn gd dkc-bt2" data-dkc-dgo="' + d.id + '">' + (lv >= 10 ? '極へ' : '強化へ') + '</button>'
             : '<button class="dkbtn gr dkc-bt2" data-dkc-dshop="' + d.id + '">ショップで購入</button>')
      + '</div>';
  }).join('');
  var html = '<div class="dkc-dbwrap">'
    + '<div class="dkdark dkc-dbtop" data-fx="rise"><div class="dkc-mhd"><b>サイコロ図鑑</b><small>持っているサイコロ</small><em>' + n + '/' + DICE.length + '</em></div>'
    + '<div class="dkc-drws">' + rw + '</div></div>'
    + '<div class="dkc-dcards" data-fx-step="70">' + cards + '</div></div>';
  return { html:html, wire:function(el){
    el.querySelectorAll('[data-dkc-dclaim]').forEach(function(b){ b.onclick = function(){ dkcClaimDBook(b.getAttribute('data-dkc-dclaim'), b); }; });
    el.querySelectorAll('[data-dkc-dshop]').forEach(function(b){ b.onclick = function(){ dkcSfx('click'); dkcGoShop(); }; });
    el.querySelectorAll('[data-dkc-dgo]').forEach(function(b){ b.onclick = function(){
      var id = b.getAttribute('data-dkc-dgo'); if(!dkcDieOwn(id)) return;
      dkcSfx('click'); DKC_S.dsel = id; DKC_S.dtab = dkcDieLv(id) >= 10 ? 'kiwami' : 'up'; showDice(); }; });
  } };
}
/* ══════════ サイコロ画面（本体） ══════════ */
function showDice(tab){
  var el0 = document.getElementById('dice');
  var entering = (DKC_S.onScr !== 'dice') || !el0;
  if(typeof tab === 'string' && DKC_DTABS.some(function(t){ return t.id === tab; })) DKC_S.dtab = tab;
  else if(entering) DKC_S.dtab = 'dice';
  if(entering){ DKC_S.scroll = {}; DKC_S.busy = false; DKC_S.lastD = ''; DKC_S.dsel = null; }
  else dkcKeep(el0);
  var swap = !entering && DKC_S.lastD && DKC_S.lastD !== DKC_S.dtab;
  DKC_S.lastD = DKC_S.dtab;
  var T = DKC_S.dtab, part;
  if(T === 'up') part = dkcTabDUp();
  else if(T === 'kiwami') part = dkcTabKiwami();
  else if(T === 'book') part = dkcTabDBook();
  else part = dkcTabDice();
  var n = dkcDieN(), badges = {};
  if(DKC_DBOOK.some(function(r){ return !dkcClaimed(r.key) && n >= r.n; })) badges.book = '!';
  var el = dkMake('dice', 'dice',
      dkHead('dice', {})
    + dkcTabs(DKC_DTABS, T, ['dice', 'up', 'kiwami', 'book'], badges)
    + '<div class="dkbody dkc-body dkc-t' + T + (T === 'book' ? '' : ' dkcol') + (swap ? ' dkc-swap' : '') + '">' + part.html + '</div>');
  el.classList.add('dkc-scr');
  dkWire(el, function(id){ if(DKC_S.busy) return; DKC_S.dtab = id; showDice(); });
  dkcFxMarks(el);
  try{ part.wire(el); }catch(e){ console.error('[WP2]', e); }
  dkcStrip(el);
  screenTo('dice');
  dkcSkin(el, 'dice');
  dkcRestore(el);
}
/* サイコロの演出 */
function dkcRunDieUp(id){
  if(DKC_S.busy) return;
  var btn = document.getElementById('dkcDUp'), ped = document.getElementById('dkcPed');
  var old = { g:SV.gold, d:SV.gem };
  var r = dkcDieUp(id);
  if(!r){ return; }
  if(r.err){ dkcWarn('強化できません', r.err); if(btn) fxShake(btn, 220); return; }
  DKC_S.busy = true;
  (async function(){
    try{
      fxCoins(fxWalletEl('gold'), ped || btn, { kind:'coin', n:8, dur:560 });
      dkWallet();
      await fxWait(520);
      var die = ped && ped.querySelector('.dkc-hop');
      if(die){ try{ die.animate([{ transform:'translateY(0) scale(1)' }, { transform:'translateY(-70px) scale(1.12) rotate(20deg)' }, { transform:'translateY(0) scale(.94,1.06)' }, { transform:'translateY(0) scale(1)' }],
        { duration:560, easing:'cubic-bezier(.3,1.4,.5,1)', composite:'add' }); }catch(e){} }
      dkcSfx('build');
      if(ped) fxBurst(ped, { kind:'star', n:24, power:1.2 });
      fxPopText(ped || { x:560, y:420 }, 'Lv.' + r.to + '!', { tone:'gold', size:(r.to >= 10 ? 96 : 72) });
      try{ dkkInvalidate('die'); }catch(e){}
      if(r.to === 5) setTimeout(function(){ fxPopText({ x:560, y:620 }, '転がる間に' + (DKC_DPART[id] || DKC_DPART.d0).nm + 'が出るように！', { tone:'emer', size:36 }); }, 380);
      if(r.to >= 10){
        fxFlash(); dkcSfx('gachaRare'); dkcDieSnd(id);
        if(ped) fxBurst(ped, { kind:'conf', n:44, power:1.4 });
        setTimeout(function(){ fxPopText({ x:560, y:620 }, '極 解放！', { tone:'ruby', size:48 }); }, 420);
      }
      try{ jingle('levelup'); }catch(e){}
      await fxWait(r.to >= 10 ? 1300 : 950);
    }catch(e){ console.error('[WP2]', e); }
    DKC_S.busy = false;
    if(dkcScreenOn('dice')) showDice();
  })();
}
function dkcSetKiwami(id, kw, btn){
  if(DKC_S.busy || (kw !== 'atk' && kw !== 'def')) return;
  if(!dkcDieOwn(id) || dkcDieLv(id) < 10){ dkcWarn('まだ付けられません', 'Lv.10 で解放されます'); return; }
  if(!SV.kiwami || typeof SV.kiwami !== 'object') SV.kiwami = {};
  if(SV.kiwami[id] === kw) return;
  SV.kiwami[id] = kw; saveNow();
  dkcSfx('skill');
  var at = fxPt(btn);
  showDice();
  fxBurst(at, { kind:'star', n:18 });
  var ped = document.getElementById('dkcPed'); if(ped){ fxBurst(ped, { kind:'conf', n:18 }); }
  try{ toast('R', '👑', (kw === 'atk' ? '攻の極' : '守の極'), esc(dkcDie(id).nm) + ' に付けました', 1600); }catch(e){}
}
function dkcClaimDBook(key, btn){
  var r = DKC_DBOOK.filter(function(x){ return x.key === key; })[0];
  if(!r || dkcClaimed(key) || dkcDieN() < r.n) return;
  var from = fxPt(btn), old = { g:SV.gold, d:SV.gem };
  dkcSetClaim(key);
  if(key === 'db3') SV.gold += 3000;
  if(key === 'db8') SV.gem += 30;
  saveNow(); dkcSfx('coin');
  showDice();
  dkcWalletFx(from, old);
  fxBurst(from, { kind:'star', n:18 });
  try{ toast('R', '📖', 'サイコロ図鑑 ' + r.n + '種', esc(r.nm), 2000); }catch(e){}
}
/* ══════════════════════════════════════════════════════════════
   盤の上のサイコロ：人間が振っていて Lv5 以上なら光の軌跡、Lv10 なら着地で床が光る
   （drawDice の代入ラッパから呼ぶ。diceAnim が無い時は何もしない。乱数は使わない）
   ══════════════════════════════════════════════════════════════ */
function dkcRgba(hex, a){
  var h = String(hex || '#FFD24D').replace('#', '');
  if(h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  var n = parseInt(h, 16) || 0;
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
}
function dkcDiceFx(ctx){
  if(!diceAnim || !diceAnim.th || typeof diceAnim.th.at !== 'function' || !G || !G.players) return;
  var p = G.players[G.turn];
  if(!p || p.kind === 'cpu') return;
  var d = dieOf(G.turn), lv = (d && d.lv) | 0;
  if(lv < 5) return;
  var th = diceAnim.th, t = diceAnim.t || 0, dd = dkcDie(d.id), col = (dd && dd.col) || '#FFD24D';
  if(d.id === 'd0') col = '#FFE7A0';
  var X = DICE_X, Y = DICE_Y, part = DKC_DPART[d.id] || DKC_DPART.d0;
  if(DKC_DFX.anim !== diceAnim){ DKC_DFX.anim = diceAnim; DKC_DFX.emit = 0; DKC_DFX.land = false; DKC_DFX.maxRoll = 0; }
  /* 光の軌跡（放り投げてから着地まで）：少し前の位置をつないだ光の帯 */
  if(t > 180 && t < th.dur){
    var pts = [], wk = lv >= 10 ? 1.25 : 1;
    for(var k = 0; k <= 9; k++){
      var tt = t - k * 16;
      if(tt < 180) break;
      var st = th.at(tt);
      if(!st || !st.d) break;
      pts.push(st.d.map(function(q){ return { x:X + q.x, y:Y + q.y - (q.z || 0) }; }));
    }
    /* 軌跡もサイコロごとに変える（太さ・点線・光の足し方） */
    var TR = part.tr || { w:1, dash:false, add:true };
    ctx.save();
    ctx.globalCompositeOperation = TR.add ? 'lighter' : 'source-over';
    ctx.lineCap = 'round';
    for(var i = 0; i < 2; i++){
      for(var k2 = 1; k2 < pts.length; k2++){
        if(TR.dash && (k2 % 2 === 0)) continue;
        var a0 = pts[k2 - 1][i], a1 = pts[k2][i];
        if(!a0 || !a1) continue;
        var f = 1 - k2 / pts.length;
        ctx.strokeStyle = dkcRgba(col, 0.6 * f);
        ctx.lineWidth = (30 * f + 4) * wk * TR.w;
        ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
        ctx.strokeStyle = dkcRgba('#FFFFFF', 0.55 * f);
        ctx.lineWidth = (9 * f + 1) * wk * TR.w;
        ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
      }
    }
    ctx.restore();
    /* 転がる間の粒（G05・Lv5〜・同時に8個まで） */
    var cur = th.at(t);
    if(cur && cur.d && cur.d.length && t - DKC_DFX.emit >= 70){
      var roll = 0;
      for(var r = 0; r < DKC_DP.length; r++) if(DKC_DP[r].roll) roll++;
      if(roll < 8){
        DKC_DFX.emit = t;
        var w0 = cur.d[(DKFX.rnd() * cur.d.length) | 0];
        dkcSpawn(part, X + w0.x, Y + w0.y - (w0.z || 0), false, roll, 8);
        if(roll + 1 > DKC_DFX.maxRoll) DKC_DFX.maxRoll = roll + 1;
      }
    }
  }
  /* Lv10：着地（目が決まる閃光の瞬間）で床が光り、画面が軽く揺れ、粒16個と専用の着地音（1回だけ） */
  if(lv >= 10){
    var now = th.at(Math.max(0, Math.min(t, th.dur)));
    if(!diceAnim._dkcT0 && now && now.flash > 0.3){
      diceAnim._dkcT0 = t;
      try{ camShake(6); }catch(e){}
      if(!DKC_DFX.land && now.d && now.d.length){
        DKC_DFX.land = true;
        var per = Math.ceil(16 / now.d.length), n = 0;
        for(var j = 0; j < now.d.length && n < 16; j++){
          for(var q2 = 0; q2 < per && n < 16; q2++, n++) dkcSpawn(part, X + now.d[j].x, Y + now.d[j].y, true, n, 16);
        }
        DKC_DFX.burstN = n; DKC_DFX.sndN++;
        dkcDieSnd(d.id);
      }
    }
    if(diceAnim._dkcT0){
      var e = (t - diceAnim._dkcT0) / 620;
      if(e >= 0 && e < 1 && now && now.d){
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for(var j2 = 0; j2 < now.d.length; j2++){
          var w = now.d[j2], cx = X + w.x, cy = Y + w.y + 6;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42);
          var R = 36 + e * 130;
          var g2 = ctx.createRadialGradient(0, 0, 4, 0, 0, R);
          g2.addColorStop(0, dkcRgba('#FFFFFF', 0.75 * (1 - e)));
          g2.addColorStop(0.4, dkcRgba(col, 0.55 * (1 - e)));
          g2.addColorStop(1, dkcRgba(col, 0));
          ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.fill();
          ctx.lineWidth = 5 * (1 - e); ctx.strokeStyle = dkcRgba(col, 0.8 * (1 - e));
          ctx.beginPath(); ctx.arc(0, 0, 30 + e * 150, 0, 6.2832); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    }
  }
}
/* 粒を1つ足す（見た目の乱数は DKFX.rnd。合わせて 24 個まで） */
function dkcSpawn(part, x, y, burst, i, n){
  var a, sp;
  if(burst){ a = (Math.PI * 2 * i) / n + (DKFX.rnd() - 0.5) * 0.5; sp = 0.12 + DKFX.rnd() * 0.12; }
  else { a = -Math.PI / 2 + (DKFX.rnd() - 0.5) * 1.6; sp = 0.03 + DKFX.rnd() * 0.05; }
  DKC_DP.push({ x:x, y:y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp * (burst ? 0.6 : 1) - (burst ? 0.08 : 0.02), g:burst ? 0.0004 : 0.00005,
    rot:DKFX.rnd() * 6.28, vr:(DKFX.rnd() - 0.5) * 0.01, age:0, life:burst ? 700 + DKFX.rnd() * 250 : 480 + DKFX.rnd() * 200,
    sz:burst ? 22 + DKFX.rnd() * 10 : 14 + DKFX.rnd() * 8, img:dkcDSpr(part.k, i), add:(part.k === 'led' || part.k === 'wisp'), roll:!burst });
  if(DKC_DP.length > 24) DKC_DP.shift();
}
/* 粒を動かして描く（drawDice のあと＝サイコロの上。粒が無い時は何もしない） */
function dkcDiceParts(ctx){
  if(!DKC_DP.length){ DKC_DFX.last = 0; return; }
  var now = performance.now(), dt = DKC_DFX.last ? Math.min(50, now - DKC_DFX.last) : 16;
  DKC_DFX.last = now;
  var k = dt / ((typeof SPEED === 'number' && SPEED > 0) ? SPEED : 1);
  ctx.save();
  for(var i = DKC_DP.length - 1; i >= 0; i--){
    var q = DKC_DP[i];
    q.age += k;
    if(q.age >= q.life){ DKC_DP.splice(i, 1); continue; }
    q.x += q.vx * k; q.y += q.vy * k; q.vy += q.g * k; q.rot += q.vr * k;
    var e = q.age / q.life;
    ctx.globalAlpha = Math.max(0, e < 0.15 ? e / 0.15 : 1 - (e - 0.15) / 0.85);
    ctx.globalCompositeOperation = q.add ? 'lighter' : 'source-over';
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
    ctx.drawImage(q.img, -q.sz / 2, -q.sz / 2, q.sz, q.sz);
    ctx.restore();
  }
  ctx.restore();
}
/* 粒の絵（32px の作り置き。種類ごとに1枚、トランプは4枚） */
function dkcDSpr(k, i){
  var S = DKC_DFX.spr || (DKC_DFX.spr = {}), key = k === 'suit' ? 'suit' + ((i | 0) % 4) : k;
  if(S[key]) return S[key];
  var c = document.createElement('canvas'); c.width = 32; c.height = 32;
  var g = c.getContext('2d'), gr;
  if(k === 'coin'){
    gr = g.createRadialGradient(13, 11, 2, 16, 16, 15);
    gr.addColorStop(0, '#FFF9D8'); gr.addColorStop(0.4, '#FFD95A'); gr.addColorStop(0.8, '#D69A14'); gr.addColorStop(1, '#8A5E06');
    g.fillStyle = gr; g.beginPath(); g.arc(16, 16, 14, 0, 6.2832); g.fill();
    g.lineWidth = 2; g.strokeStyle = '#7A5206'; g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,240,180,.85)'; g.beginPath(); g.arc(16, 16, 9.5, 0, 6.2832); g.stroke();
  } else if(k === 'led'){
    gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.25, '#BFF4FF'); gr.addColorStop(0.6, 'rgba(35,194,240,.55)'); gr.addColorStop(1, 'rgba(35,194,240,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  } else if(k === 'wisp'){
    gr = g.createRadialGradient(16, 19, 1, 16, 16, 15);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.3, '#E9D6FF'); gr.addColorStop(0.65, 'rgba(138,88,240,.75)'); gr.addColorStop(1, 'rgba(138,88,240,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(16, 1); g.bezierCurveTo(24, 10, 29, 16, 26, 23); g.bezierCurveTo(23, 30, 9, 30, 6, 23);
    g.bezierCurveTo(3, 16, 9, 10, 16, 1); g.fill();
  } else if(k === 'petal'){
    gr = g.createRadialGradient(13, 10, 1, 16, 16, 15);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.35, '#FFD8EA'); gr.addColorStop(1, '#F27BAE');
    g.fillStyle = gr; g.strokeStyle = '#C94F86'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(16, 2); g.bezierCurveTo(27, 8, 28, 22, 16, 30);
    g.bezierCurveTo(4, 22, 5, 8, 16, 2); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(201,79,134,.6)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(16, 6); g.lineTo(16, 27); g.stroke();
  } else if(k === 'gear'){
    g.fillStyle = '#C8D8E8'; g.strokeStyle = '#41566B'; g.lineWidth = 1.8;
    g.beginPath();
    for(var t2 = 0; t2 < 16; t2++){
      var an = Math.PI * t2 / 8, rr = (t2 % 2) ? 9.5 : 14;
      var px = 16 + rr * Math.cos(an), py = 16 + rr * Math.sin(an);
      if(t2) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#41566B'; g.beginPath(); g.arc(16, 16, 4.2, 0, 6.2832); g.fill();
  } else if(k === 'starp'){
    gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.3, '#FFF0B8'); gr.addColorStop(0.7, 'rgba(255,210,77,.6)'); gr.addColorStop(1, 'rgba(255,210,77,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#FFFDF0';
    g.beginPath();
    g.moveTo(16, 1); g.lineTo(18.4, 13.6); g.lineTo(31, 16); g.lineTo(18.4, 18.4); g.lineTo(16, 31);
    g.lineTo(13.6, 18.4); g.lineTo(1, 16); g.lineTo(13.6, 13.6);
    g.closePath(); g.fill();
  } else if(k === 'suit'){
    var j = (i | 0) % 4;
    g.fillStyle = '#FFFFFF'; g.strokeStyle = '#3A2405'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(8, 3); g.lineTo(24, 3); g.quadraticCurveTo(28, 3, 28, 7); g.lineTo(28, 25); g.quadraticCurveTo(28, 29, 24, 29);
    g.lineTo(8, 29); g.quadraticCurveTo(4, 29, 4, 25); g.lineTo(4, 7); g.quadraticCurveTo(4, 3, 8, 3); g.fill(); g.stroke();
    g.fillStyle = (j === 1 || j === 2) ? '#E8436A' : '#2A1604';
    g.font = 'bold 19px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(['♠', '♥', '♦', '♣'][j], 16, 17);
  } else {
    g.fillStyle = '#C98B4F'; g.strokeStyle = '#5A3A18'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(4, 14); g.lineTo(22, 6); g.lineTo(28, 16); g.lineTo(10, 25); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(90,58,24,.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(9, 15); g.lineTo(22, 10); g.stroke();
  }
  S[key] = c;
  return c;
}
/* サイコロごとの専用の着地音（G05・Lv10。今の効果音の音程とフィルタを変えた合成） */
function dkcDieSnd(id){
  try{
    if(typeof soundOn !== 'undefined' && !soundOn) return;
    var a = (typeof AC !== 'undefined') ? AC : null;
    if(!a || !a.createOscillator || a.state === 'closed') return;
    var t = a.currentTime + 0.01, out = a.createGain();
    out.gain.value = (typeof sfxVol === 'number') ? sfxVol : 0.7;
    out.connect(a.destination);
    var tone = function(type, f, f2, dur, v, at){
      var o = a.createOscillator(), gn = a.createGain(), t0 = t + (at || 0);
      o.type = type; o.frequency.setValueAtTime(f, t0);
      if(f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(v, t0 + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gn); gn.connect(out); o.start(t0); o.stop(t0 + dur + 0.02);
    };
    var nz = function(f, q, dur, v, at){
      var b = DKC_DFX.nz;
      if(!b || b.sampleRate !== a.sampleRate){
        b = a.createBuffer(1, Math.floor(a.sampleRate * 0.6), a.sampleRate);
        var ch = b.getChannelData(0);
        for(var i = 0; i < ch.length; i++) ch[i] = DKFX.rnd() * 2 - 1;
        DKC_DFX.nz = b;
      }
      var s = a.createBufferSource(), fl = a.createBiquadFilter(), gn = a.createGain(), t0 = t + (at || 0);
      s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
      gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(v, t0 + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(fl); fl.connect(gn); gn.connect(out); s.start(t0); s.stop(t0 + dur + 0.02);
    };
    if(id === 'd1'){ tone('sine', 1320, 0, 0.5, 0.16); tone('sine', 3643, 0, 0.3, 0.05); tone('sine', 1760, 0, 0.45, 0.12, 0.07); tone('sine', 4858, 0, 0.25, 0.04, 0.07); }
    else if(id === 'd2'){ tone('square', 880, 1760, 0.09, 0.05); tone('sine', 2640, 0, 0.22, 0.08, 0.08); tone('triangle', 1320, 0, 0.2, 0.06, 0.12); }
    else if(id === 'd3'){ nz(3200, 1.2, 0.07, 0.12); tone('triangle', 660, 990, 0.14, 0.1, 0.05); nz(2400, 1.5, 0.06, 0.08, 0.12); }
    else if(id === 'd4'){ tone('sine', 330, 110, 0.6, 0.12); tone('triangle', 165, 82, 0.7, 0.08); nz(600, 0.8, 0.5, 0.05); }
    else if(id === 'd5'){ tone('sine', 1175, 0, 0.42, 0.1); tone('sine', 1760, 0, 0.34, 0.06, 0.06); nz(3400, 2.2, 0.18, 0.04, 0.02); }
    else if(id === 'd6'){ nz(1800, 3.5, 0.05, 0.14); nz(1100, 2.8, 0.05, 0.1, 0.07); tone('square', 220, 160, 0.1, 0.05, 0.13); }
    else if(id === 'd7'){ tone('triangle', 2093, 0, 0.55, 0.1); tone('sine', 2637, 0, 0.4, 0.06, 0.07); tone('sine', 3136, 0, 0.3, 0.04, 0.14); }
    else { tone('triangle', 220, 120, 0.2, 0.14); nz(1400, 1.2, 0.04, 0.1); tone('sine', 440, 300, 0.12, 0.05, 0.05); }
    setTimeout(function(){ try{ out.disconnect(); }catch(e){} }, 1500);
  }catch(e){}
}
/* 粒の絵を画面（図鑑・見本）でも使う（盤と同じ作り置きを data URL に。1枚ずつ覚える） */
function dkcDSprUrl(k, i){ var c = dkcDSpr(k, i); return c._u || (c._u = c.toDataURL()); }
/* サイコロ画面の見本（台座のサイコロが跳ね、Lv5 の粒8個・Lv10 の着地16個と音。一度きりの動きなので常時アニメは増えない） */
function dkcFxPreview(id){
  var ped = document.getElementById('dkcPed'); if(!ped) return;
  var part = DKC_DPART[id] || DKC_DPART.d0, lv = dkcDieOwn(id) ? dkcDieLv(id) : 10;
  var hop = ped.querySelector('.dkc-hop');
  if(hop && hop.animate && !DKFX.reduced){
    try{ hop.animate([{ transform:'translateY(0)' }, { transform:'translateY(-120px) rotate(-160deg)', offset:0.4 }, { transform:'translateY(0) rotate(-300deg) scale(1.08,.9)', offset:0.58 },
      { transform:'translateY(-24px) rotate(-340deg)', offset:0.72 }, { transform:'translateY(0) rotate(-360deg)' }], { duration:900, easing:'cubic-bezier(.3,.9,.5,1)' }); }catch(e){}
  }
  dkcSfx('diceShake', 0.8);
  if(lv < 5){ try{ toast('R', '🎲', 'Lv.5 から演出が変わります', 'Lv.5 で転がる間に' + part.nm + '、Lv.10 で着地に16個と専用の音', 2200); }catch(e){} return; }
  var P = fxPt(ped.querySelector('.dkc-pdie') || ped), lay = DKFX.layer();
  var mk = function(i, n, burst){
    var s = document.createElement('i');
    s.className = 'dkc-fxp';
    s.innerHTML = '<img alt="" src="' + dkcDSprUrl(part.k, i) + '">';
    s.style.left = P.x.toFixed(1) + 'px'; s.style.top = (P.y + (burst ? 60 : -20)).toFixed(1) + 'px';
    lay.appendChild(s);
    var a = burst ? Math.PI * 2 * i / n : -Math.PI / 2 + (i - n / 2) * 0.35, r = burst ? 150 + (i % 3) * 34 : 90 + (i % 2) * 30;
    var mx = Math.cos(a) * r, my = Math.sin(a) * r * (burst ? 0.55 : 1);
    try{
      var an = s.animate([{ transform:'translate(-50%,-50%) scale(.4)', opacity:0 },
        { transform:'translate(calc(-50% + ' + (mx * 0.5).toFixed(0) + 'px),calc(-50% + ' + (my * 0.5 - 20).toFixed(0) + 'px)) scale(1) rotate(90deg)', opacity:1, offset:0.35 },
        { transform:'translate(calc(-50% + ' + mx.toFixed(0) + 'px),calc(-50% + ' + (my + 30).toFixed(0) + 'px)) scale(.7) rotate(200deg)', opacity:0 }],
        { duration:burst ? 900 : 720, delay:burst ? 520 : i * 70, easing:'cubic-bezier(.2,.8,.4,1)', fill:'both' });
      an.onfinish = function(){ if(s.parentNode) s.parentNode.removeChild(s); };
    }catch(e){}
    setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 2400);
  };
  for(var i = 0; i < 8; i++) mk(i, 8, false);
  if(lv >= 10){
    for(var j = 0; j < 16; j++) mk(j, 16, true);
    setTimeout(function(){ dkcDieSnd(id); fxFlash(); }, 520);
  }
}
/* 対戦の終わりに、全員のカードを「見た」にする */
function dkcSeenMatch(){
  if(!G || !G.players) return;
  G.players.forEach(function(p){ if(p && typeof p.card === 'string') dkMarkSeen(p.card); });
}

/* ══════════ 初期化 ══════════ */
(function(){
  try{
    dkcAddDice();
    dkcAddSkills();
  }catch(e){ console.error('[WP16a]', e); }
  try{
    dkcDefs();
    if(typeof drawDice === 'function' && !drawDice._dkcWrap){
      var DKC_dd0 = drawDice;
      drawDice = function(ctx, T){
        try{ dkcDiceFx(ctx, T); }catch(e){}
        var r = DKC_dd0.apply(this, arguments);
        try{ dkcDiceParts(ctx); }catch(e){}
        return r;
      };
      drawDice._dkcWrap = true;
    }
    dkOn('match:end', function(info){ dkcSeenMatch(info); });
    dkOn('screen', function(p){ DKC_S.onScr = p && p.id; });
  }catch(e){ console.error('[WP2]', e); }
})();