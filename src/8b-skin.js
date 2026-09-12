/* ══════════════════════════════════════════════════════════════
   共通スキン（8b-skin.js）— 画面の器に「背景・金枠・タブ・ボタン」の見た目をまとめて当てる
   ──────────────────────────────────────────────────────────────
   ・見た目の中身は 1w-skin.html（.sk- のCSS）。絵は window.DV_UI2（build.ps1 が assets/ui2 から入れる）。
   ・各班は dkskApply(el, opt) を1回呼ぶだけでよい。素材が無くても崩れない（CSSだけで成り立つ）。
   ・常時アニメは光の輪（1個）と粒（既定4・最大8）だけ。スマホ（DKFX.mob）では作らない。
   ・接頭辞は dksk… / DKSK_（verify.js の decl は 9-*.js だけを見るが、名前は他班とぶつけない）。
   ══════════════════════════════════════════════════════════════ */

var DKSK_MAX_ANIM  = 8;           /* 1画面の常時アニメの上限（verify.js smoke --anims 8） */
var DKSK_MAX_SPARK = 8;           /* きらめきの上限 */
var DKSK_DEF_SPARK = 3;

/* ── 素材（window.DV_UI2：名前 → URL） ── */
function dkskU(k){ try{ return (window.DV_UI2 || {})[k] || ''; }catch(e){ return ''; } }
function dkskUrl(k){ var u = dkskU(k); return u ? 'url(' + u + ')' : ''; }
function dkskHas(k){ return !!dkskU(k); }

/* ── スマホ（iPhone の画素のメモリを増やさないため、光の輪と粒を作らない） ── */
function dkskMob(){
  try{ return !!(typeof DKFX === 'object' && DKFX && (DKFX.mob || DKFX.lite || DKFX.reduced)); }
  catch(e){ return false; }
}

/* ── その画面にあと何個アニメを足せるか（1画面8個まで）──
   すでに動いている「終わらないアニメ」を数え、残りの数だけ光の輪ときらめきを作る。
   数えられない古いブラウザでは 0（＝足さない）を返す＝安全側。 */
function dkskBudget(el){
  try{
    var root = (el && el.closest && el.closest('.screen')) || document.body;
    var list = document.getAnimations ? document.getAnimations() : [];
    var n = 0;
    for(var i = 0; i < list.length; i++){
      var a = list[i];
      if(a.playState !== 'running') continue;
      var ef = a.effect;
      if(!ef || !ef.getTiming || ef.getTiming().iterations !== Infinity) continue;
      if(!ef.target || !root.contains(ef.target)) continue;
      n++;
    }
    return Math.max(0, DKSK_MAX_ANIM - n);
  }catch(e){ return 0; }
}

/* ── 小道具 ── */
function dkskSet(el, k, v){ try{ if(el && el.style && v) el.style.setProperty(k, v); }catch(e){} }
function dkskAll(root, sel){
  if(!root || !sel) return [];
  try{ return Array.prototype.slice.call(root.querySelectorAll(sel)); }catch(e){ return []; }
}
function dkskAdd(root, sel, cls){
  dkskAll(root, sel).forEach(function(n){ try{ n.classList.add.apply(n.classList, cls.split(' ')); }catch(e){} });
}

/* ── 絵を1枚置く（名前は DV_UI2 のキー。無ければ空文字＝何も出ない） ── */
function dkskPic(key, cls, style){
  var u = dkskU(key);
  if(!u) return '';
  return '<i class="sk-pic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" style="background-image:url('
    + u + ')' + (style ? ';' + style : '') + '"></i>';
}
/* ── 画面の外（レターボックスの帯）にも木目を敷く。1回だけ ── */
function dkskRootVars(){
  try{
    var r = document.documentElement;
    if(!r || !r.style || r.style.getPropertyValue('--sk-wood')) return;
    var w = dkskUrl('wood');
    if(w) r.style.setProperty('--sk-wood', w);
  }catch(e){}
}

/* ── 主役の絵を置く（名前は DV_UI2 のキー。無ければ何もしない） ── */
function dkskHero(el, key){
  if(!el) return el;
  var u = dkskUrl(key);
  if(u){ dkskSet(el, '--sk-hero', u); el.classList.add('sk-hero'); }
  return el;
}

/* ── 回る光の輪（1個だけ。スマホでは作らない） ── */
function dkskHalo(el, size){
  if(!el || dkskMob()) return null;
  try{
    if(el.querySelector(':scope > .sk-halo')) return null;
    if(dkskBudget(el) < 1) return null;
    var h = document.createElement('i');
    h.className = 'sk-halo';
    if(size) h.style.setProperty('--sk-halo-w', size);
    el.appendChild(h);
    return h;
  }catch(e){ return null; }
}

/* ── きらめきの粒（最大8個。スマホでは作らない） ── */
function dkskSpark(el, n, box){
  if(!el || dkskMob()) return 0;
  var want = Math.max(0, Math.min(DKSK_MAX_SPARK, n === undefined ? DKSK_DEF_SPARK : n | 0));
  if(!want) return 0;
  try{
    var have = el.querySelectorAll('.sk-spark').length;
    want = Math.max(0, Math.min(want, DKSK_MAX_SPARK - have, dkskBudget(el)));
    if(!want) return 0;
    box = box || { x: 0, y: 0, w: 100, h: 100 };
    for(var i = 0; i < want; i++){
      var s = document.createElement('i');
      s.className = 'sk-spark';
      s.style.left = (box.x + Math.random() * box.w) + '%';
      s.style.top  = (box.y + Math.random() * box.h) + '%';
      s.style.animationDelay = (Math.random() * 2.4).toFixed(2) + 's';
      el.appendChild(s);
    }
    return want;
  }catch(e){ return 0; }
}

/* ── 能力バーの1行を作る（金＝gold／緑＝green／青＝blue） ── */
function dkskBar(name, pct, tone, value){
  var p = Math.max(0, Math.min(100, Number(pct) || 0));
  var cls = 'sk-bar' + (tone && tone !== 'gold' ? ' ' + tone : '');
  return '<div class="sk-barrow">'
       +   (name ? '<span class="nm">' + name + '</span>' : '')
       +   '<span class="' + cls + '"><i style="--sk-v:' + p + '%"></i></span>'
       +   (value ? '<b class="vl">' + value + '</b>' : '')
       + '</div>';
}

/* ── 等級バッジ（台座は絵・文字は CSS で重ねる＝焼き込みの文字は使わない） ── */
function dkskBadge(rank){
  var r = String(rank || '').toUpperCase();
  var tone = r === 'B' ? ' bronze' : (r === 'A' ? ' silver' : '');
  /* 台座の絵は「その要素の style」に入れる。1w-skin.html の
     .sk-badge[style*="--sk-badge"]::before{display:none} が効いて、
     絵が無い時だけ金の角丸（代わりの台座）が出る＝お手本の印章が四角に負けない */
  var u = dkskUrl('badge-base');
  return '<span class="sk-badge' + (r.length > 1 ? ' s2' : '') + tone + '"'
       + (u ? ' style="--sk-badge:' + u + '"' : '') + '><b>' + r + '</b></span>';
}

/* ══════════════════════════════════════════════════════════════
   dkskApply(el, opt) — 画面の器にまとめて当てる
     opt.bg     : 'study' | 'shop' | 'hall' | 'page'（assets/ui2 の bg2-*）
     opt.frame  : 羊皮紙の金枠を当てるセレクタ（既定 '.dkpar'）。false で枠を当てない
     opt.frameDark : 暗い面の金枠を当てるセレクタ（既定 '.dkdark,.fx-panel'）
     opt.tabs   : タブに当てるセレクタ（既定 '.dktabs'）。false で当てない
     opt.btns   : ボタンに当てるセレクタ（既定 '.dkbtn'）。false で当てない
     opt.hero   : { sel:'…', key:'hero2-pend' } 主役の絵
     opt.halo   : 光の輪を付ける要素のセレクタ（スマホでは作らない）
     opt.spark  : きらめきの数（既定0。付けるなら 1〜8）
     opt.sparkSel : きらめきを入れる要素のセレクタ（既定 opt.halo と同じ）
   返り値は el（そのまま繋げて書ける）
   ══════════════════════════════════════════════════════════════ */
function dkskApply(el, opt){
  if(!el || !el.style) return el;
  opt = opt || {};
  try{
    /* 1. 画面の地（静止の1枚） */
    if(opt.bg !== false){
      var bg = dkskUrl('bg2-' + (opt.bg || 'study'));
      if(bg){ dkskSet(el, '--sk-bg', bg); el.classList.add('sk-bg'); }
    }
    /* 2. 共通の素材を CSS 変数で配る（中の .sk- がこれを読む） */
    dkskSet(el, '--sk-frame', dkskUrl('frame-gold'));
    dkskSet(el, '--sk-paper', dkskUrl('paper'));
    dkskSet(el, '--sk-badge', dkskUrl('badge-base'));
    dkskSet(el, '--sk-fleur', dkskUrl('deco-fleur'));
    dkskSet(el, '--sk-cush', dkskUrl('deco-cushion'));
    dkskSet(el, '--sk-coins', dkskUrl('ico-coins'));
    dkskSet(el, '--sk-gems', dkskUrl('ico-gems'));
    dkskRootVars();
    /* 3. 既存の器に見た目を当てる（作りは壊さず class を足すだけ） */
    if(opt.frame !== false){
      dkskAdd(el, opt.frame || '.dkpar', 'sk-frame paper');
      dkskAdd(el, opt.frameDark || '.dkdark,.fx-panel', 'sk-frame dark');
    }
    if(opt.tabs !== false){
      dkskAll(el, opt.tabs || '.dktabs').forEach(function(t){
        t.classList.add('sk-tabs');
        dkskAll(t, '.dktab').forEach(function(n){ n.classList.add('sk-tab'); });
      });
    }
    if(opt.btns !== false){
      dkskAll(el, opt.btns || '.dkbtn').forEach(function(b){
        b.classList.add('sk-btn');
        if(b.classList.contains('gd')) b.classList.add('gold');
        else if(b.classList.contains('gy')) b.classList.add('gray');
        else b.classList.add('green');
      });
    }
    /* 4. 主役の絵・光の輪・きらめき */
    if(opt.hero && opt.hero.sel){
      dkskAll(el, opt.hero.sel).forEach(function(n){ dkskHero(n, opt.hero.key); });
    }
    if(opt.halo) dkskAll(el, opt.halo).forEach(function(n){ dkskHalo(n, opt.haloSize); });
    if(opt.spark){
      dkskAll(el, opt.sparkSel || opt.halo || '.sk-hero').forEach(function(n){
        dkskSpark(n, opt.spark, opt.sparkBox);
      });
    }
  }catch(e){}
  return el;
}
