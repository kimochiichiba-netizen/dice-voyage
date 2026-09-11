
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 演出の土台（9-fx.js / WP0）
   ──────────────────────────────────────────────────────────────
   ・§8 の演出API（fx*）、§7 のイベント（dkOn/dkEmit）、§6 の契約スタブ。
   ・modal / dkCount / dkWallet / dkBurst / rollNum / dkWire を宣言し直す。
   ・screenTo と newGame を代入ラッパで包む。
   ・トップレベルは function 宣言と var DKFX と初期化 IIFE だけ。
     DOM に触る初期化は最後の IIFE の中（1ファイルの例外で後ろの初期化を止めないため）。
   ・見た目の乱数は Math.random を使わない（対戦の乱数・自動対戦の種を乱さないため）。
   ══════════════════════════════════════════════════════════════ */

var DKFX = {
  reduced: false,          // 端末の「視差効果を減らす」
  lite: false,             // 設定「演出：控えめ」（localStorage 'dv_fx'）
  skip: false,             // 早送り中（fxWait が 1/4 になる）
  cv: null, ctx: null, k: 1, parts: [], raf: 0, last: 0, spr: null,
  timers: {}, o: {}, mseq: 0, seed: 0,
  press: '.dkbtn,.btn,.dktab,.dkrb,.dkitem,.dkic,.dkback,.dkclose,.dkplus,.dkstabs .s,.dktab2 .t,'
       + '.mapcard,.chcard,.ocard,.rm-go,.rm-item,.rm-mbtn,.dk-enter,.dk-rb,.fx-seg button,[data-fx-press]',
  autoSel: '.dkhd > *, .dktab, .dkrb, .dkitem, .dkgood, .dkq, .dkday, .dkrk, .dkhero',

  /* 見た目専用の乱数（xorshift32） */
  rnd: function(){
    var s = DKFX.seed || ((performance.now() * 1000) >>> 0) || 0x9E3779B9;
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    DKFX.seed = s; return s / 4294967296;
  },
  stage: function(){ return document.getElementById('stage'); },
  small: function(){ try{ return matchMedia('(max-height:560px)').matches; }catch(e){ return false; } },
  shown: function(el){ return !!(el && el.isConnected && el.getClientRects().length); },
  fmt: function(v){ return Math.round(v).toLocaleString(); },
  parseNum: function(t){
    var s = String(t == null ? '' : t), neg = /^\s*-/.test(s);
    var n = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    return neg ? -n : n;
  },
  /* ステージの拡大率（回転していても正しく出す） */
  lin: function(){
    var st = DKFX.stage(); if(!st) return null;
    var tf = getComputedStyle(st).transform;
    var m = (tf && tf !== 'none') ? new DOMMatrix(tf) : new DOMMatrix();
    return m;
  },
  scale: function(){ var m = DKFX.lin(); return m ? (Math.hypot(m.a, m.b) || 1) : 1; },
  /* 画面の座標 → ステージ座標（1600×900） */
  toStage: function(cx, cy){
    var st = DKFX.stage(); if(!st) return { x:800, y:450 };
    var r = st.getBoundingClientRect(), m = DKFX.lin();
    var inv = new DOMMatrix([m.a, m.b, m.c, m.d, 0, 0]).inverse();
    var p = inv.transformPoint(new DOMPoint(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2)));
    return { x: p.x + 800, y: p.y + 450 };
  },
  layer: function(){
    var L = document.getElementById('fxLayer');
    if(!L){
      var st = DKFX.stage(); if(!st) return document.body;
      L = document.createElement('div'); L.id = 'fxLayer'; L.className = 'fx-layer';
      L.setAttribute('aria-hidden', 'true'); st.appendChild(L);
    }
    return L;
  },
  stopTimers: function(all){
    var T = DKFX.timers;
    Object.keys(T).forEach(function(k){ if(all || !T[k].keep){ clearInterval(T[k].h); delete T[k]; } });
  },
  setLite: function(on){
    DKFX.lite = !!on;
    try{ localStorage.setItem('dv_fx', DKFX.lite ? 'lite' : 'std'); }catch(e){}
    document.documentElement.classList.toggle('fx-lite', DKFX.lite);
  },
  bumpNum: function(el, up){
    el.classList.remove('fx-up', 'fx-dn');
    el.classList.add('fx-bump', up ? 'fx-up' : 'fx-dn');
    clearTimeout(el._fxBumpT);
    el._fxBumpT = setTimeout(function(){ el.classList.remove('fx-bump'); }, 260);
    clearTimeout(el._fxUpT);
    el._fxUpT = setTimeout(function(){ el.classList.remove('fx-up', 'fx-dn'); }, 400);
  },
  poke: function(el){      // 的が弾む（再生し直しでレイアウトを起こさない WAAPI）
    if(!el || !el.animate || DKFX.reduced) return;
    var kf = [{ transform:'scale(1)' }, { transform:'scale(1.16)' }, { transform:'scale(1)' }];
    try{ el.animate(kf, { duration:150, easing:'cubic-bezier(.34,1.56,.64,1)', composite:'add' }); }
    catch(e){ try{ el.animate(kf, { duration:150 }); }catch(e2){} }
  },

  /* ── 共有 canvas（バースト・コイン・紙吹雪） ── */
  ensure: function(){
    var st = DKFX.stage(); if(!st) return null;
    var cv = document.getElementById('fxCanvas');
    if(!cv){
      cv = document.createElement('canvas'); cv.id = 'fxCanvas'; cv.setAttribute('aria-hidden', 'true');
      st.appendChild(cv);
    }
    var k = Math.max(0.5, Math.min(1, DKFX.scale() * (window.devicePixelRatio || 1)));
    if(cv !== DKFX.cv || Math.abs(k - DKFX.k) > 0.01 || !DKFX.ctx){
      DKFX.cv = cv; DKFX.k = k;
      cv.width = Math.round(1600 * k); cv.height = Math.round(900 * k);
      DKFX.ctx = cv.getContext('2d');
    }
    if(!DKFX.spr) DKFX.sprites();
    return DKFX.ctx;
  },
  sprites: function(){
    var mk = function(){ var c = document.createElement('canvas'); c.width = 48; c.height = 48; return c; };
    var S = {}, c, g, gr, TAU = Math.PI * 2;
    c = mk(); g = c.getContext('2d');                                   // コイン（王冠の刻印）
    gr = g.createRadialGradient(18, 15, 2, 24, 24, 23);
    gr.addColorStop(0, '#FFF9D8'); gr.addColorStop(.35, '#FFD95A'); gr.addColorStop(.75, '#D69A14'); gr.addColorStop(1, '#8A5E06');
    g.fillStyle = gr; g.beginPath(); g.arc(24, 24, 22, 0, TAU); g.fill();
    g.lineWidth = 2.5; g.strokeStyle = '#7A5206'; g.stroke();
    g.beginPath(); g.arc(24, 24, 16, 0, TAU); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,240,180,.8)'; g.stroke();
    g.fillStyle = '#9A6A08'; g.beginPath();
    g.moveTo(15, 30); g.lineTo(15, 19); g.lineTo(19.5, 24); g.lineTo(24, 16); g.lineTo(28.5, 24); g.lineTo(33, 19); g.lineTo(33, 30);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(17, 14, 7, 4, -0.6, 0, TAU); g.fill();
    S.coin = c;
    c = mk(); g = c.getContext('2d');                                   // ジェム（サファイア）
    gr = g.createLinearGradient(0, 4, 0, 44);
    gr.addColorStop(0, '#EAF8FF'); gr.addColorStop(.45, '#6FC6F5'); gr.addColorStop(1, '#1E7FD0');
    g.fillStyle = gr; g.beginPath();
    g.moveTo(24, 4); g.lineTo(44, 18); g.lineTo(36, 44); g.lineTo(12, 44); g.lineTo(4, 18); g.closePath(); g.fill();
    g.lineWidth = 2; g.strokeStyle = '#0B3C74'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(24, 8); g.lineTo(38, 18); g.lineTo(24, 22); g.lineTo(10, 18); g.closePath(); g.fill();
    S.gem = c;
    c = mk(); g = c.getContext('2d');                                   // スター（4方向のきらめき）
    gr = g.createRadialGradient(24, 24, 0, 24, 24, 22);
    gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(.25, 'rgba(255,236,160,.85)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(24, 24, 22, 0, TAU); g.fill();
    g.fillStyle = '#FFFDF0'; g.beginPath();
    g.moveTo(24, 2); g.lineTo(27, 21); g.lineTo(46, 24); g.lineTo(27, 27); g.lineTo(24, 46); g.lineTo(21, 27); g.lineTo(2, 24); g.lineTo(21, 21);
    g.closePath(); g.fill();
    S.star = c;
    S.conf = ['#C9302C', '#2E8BE0', '#5FBF3A', '#F2C230', '#FFFFFF'];
    DKFX.spr = S;
  },
  push: function(q){
    var P = DKFX.parts;
    if(P.length >= 160){
      for(var i = 0; i < P.length && P.length >= 160; i++){ if(P[i].mode === 'b'){ P.splice(i, 1); i--; } }
    }
    P.push(q);
    if(!DKFX.raf){ DKFX.last = performance.now(); DKFX.raf = requestAnimationFrame(DKFX.tick); }
  },
  clearParts: function(){
    var P = DKFX.parts; DKFX.parts = [];
    P.forEach(function(q){ if(q.mode === 'c' && q.done) q.done(); });
    if(DKFX.ctx) DKFX.ctx.clearRect(0, 0, DKFX.cv.width, DKFX.cv.height);
  },
  tick: function(){
    var F = DKFX; F.raf = 0;
    var ctx = F.ctx; if(!ctx) return;
    var now = performance.now(), dt = Math.max(0, Math.min(50, now - (F.last || now))); F.last = now;
    ctx.setTransform(F.k, 0, 0, F.k, 0, 0);
    ctx.clearRect(0, 0, 1600, 900);
    var keep = [];
    for(var i = 0; i < F.parts.length; i++){
      var q = F.parts[i], alive = false;
      try{ alive = (q.mode === 'c') ? F.stepCoin(q, now, ctx) : F.stepBurst(q, dt, ctx); }catch(e){ alive = false; }
      if(alive) keep.push(q);
    }
    F.parts = keep;
    ctx.globalCompositeOperation = 'source-over';
    if(keep.length) F.raf = requestAnimationFrame(F.tick);
    else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, F.cv.width, F.cv.height); F.last = 0; }
  },
  draw: function(ctx, q, x, y, sz, rot){
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalCompositeOperation = q.add ? 'lighter' : 'source-over';
    if(q.kind === 'conf'){ ctx.fillStyle = q.col; ctx.fillRect(-sz / 2, -sz * 0.3, sz, sz * 0.6); }
    else {
      if(q.kind === 'coin') ctx.scale(Math.max(0.18, Math.abs(Math.cos(q.spin))), 1);
      ctx.drawImage(DKFX.spr[q.kind] || DKFX.spr.star, -sz / 2, -sz / 2, sz, sz);
    }
    ctx.restore();
  },
  stepBurst: function(q, dt, ctx){
    q.age += dt;
    if(q.age >= q.life) return false;
    q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt;
    q.vx *= 0.995; q.rot += q.vr * dt; q.spin += q.vs * dt;
    var e = q.age / q.life, s = e < 0.1 ? 0.5 + e * 5 : (e > 0.7 ? 1 - (e - 0.7) / 0.3 : 1);
    DKFX.draw(ctx, q, q.x, q.y, q.sz * Math.max(0, s), q.rot);
    return true;
  },
  stepCoin: function(q, now, ctx){
    var e = (now - q.t0) / q.dur;
    if(e < 0) return true;
    if(e >= 1){ if(q.done) q.done(); return false; }
    var x, y;
    if(e < 0.22){
      var a = 1 - Math.pow(1 - e / 0.22, 3);
      x = q.fx + (q.bx - q.fx) * a; y = q.fy + (q.by - q.fy) * a;
    } else {
      var u = Math.pow((e - 0.22) / 0.78, 3), v = 1 - u;
      x = v * v * q.bx + 2 * v * u * q.cx + u * u * q.tx;
      y = v * v * q.by + 2 * v * u * q.cy + u * u * q.ty;
    }
    q.spin += 0.012 * 16;
    DKFX.draw(ctx, q, x, y, q.sz * (1 - 0.35 * e), q.rot + e * 2);
    return true;
  },

  /* ── タイトルの演出層（r3 §8-1） ── */
  titleFx: function(){
    var t = document.getElementById('title');
    if(!t || t.querySelector(':scope > .fx-tlayer')) return;
    var L = document.createElement('div');
    L.className = 'fx-tlayer'; L.setAttribute('aria-hidden', 'true');
    var h = '<div class="fx-tbg"></div>';
    [[455, 95], [1180, 110], [240, 610]].forEach(function(p, i){
      h += '<i class="fx-twinkle" style="left:' + p[0] + 'px;top:' + p[1] + 'px;animation-delay:' + (-i * 0.9).toFixed(1) + 's"></i>';
    });
    h += '<div class="fx-tglare"><i></i></div>';
    h += '<div class="fx-tglow fx-g1"><i></i></div><div class="fx-tglow fx-g2"><i></i></div>';
    for(var i = 0; i < 10; i++){
      h += '<i class="fx-mote" style="left:' + (4 + DKFX.rnd() * 92).toFixed(1) + '%;top:' + (70 + DKFX.rnd() * 28).toFixed(1)
         + '%;animation-duration:' + (7 + DKFX.rnd() * 5).toFixed(1) + 's;animation-delay:-' + (DKFX.rnd() * 9).toFixed(1) + 's"></i>';
    }
    L.innerHTML = h;
    t.insertBefore(L, t.firstChild);
  },
  /* ── 押した場所から波紋（#stage に委任1本） ── */
  ripple: function(e){
    try{
      if(DKFX.reduced) return;
      var t = e.target && e.target.closest ? e.target.closest(DKFX.press) : null;
      if(!t || t.disabled) return;
      if(getComputedStyle(t).position === 'static') return;     // position を勝手に変えない（1d-polish の事故の再発防止）
      var host = t.querySelector(':scope > .fx-riphost');
      if(!host){
        host = document.createElement('span'); host.className = 'fx-riphost'; host.setAttribute('aria-hidden', 'true');
        t.appendChild(host);
      }
      var p = DKFX.toStage(e.clientX, e.clientY), c = fxPt(t);
      var r = document.createElement('i'); r.className = 'fx-rip';
      r.style.left = (p.x - (c.x - t.offsetWidth / 2)).toFixed(1) + 'px';
      r.style.top  = (p.y - (c.y - t.offsetHeight / 2)).toFixed(1) + 'px';
      host.appendChild(r);
      var kill = function(){ if(r.parentNode) r.parentNode.removeChild(r); };
      r.addEventListener('animationend', kill);
      setTimeout(kill, 700);
    }catch(err){}
  }
};

/* ══════════ §7 イベント ══════════
   ハンドラは同期で動かし、1つずつ try/catch で隔離する。登録表は関数の持ち物に置く
   （読み込みの途中で呼ばれても壊れないように）。dkOn は「解除する関数」を返す */
function dkOn(name, fn){
  if(typeof fn !== 'function') return function(){};
  var R = dkOn._r || (dkOn._r = {});
  (R[name] || (R[name] = [])).push(fn);
  return function(){ var a = R[name]; if(!a) return; var i = a.indexOf(fn); if(i >= 0) a.splice(i, 1); };
}
function dkEmit(name, payload){
  var R = dkOn._r, a = R && R[name];
  if(a && a.length){
    a.slice().forEach(function(fn){
      try{ fn(payload); }catch(e){ console.error('[dkEmit ' + name + ']', e); }
    });
  }
  return payload;
}

/* ══════════ §8 演出API ══════════ */
/* 要素（またはセレクタ）か {x,y} → ステージ座標の中心点 */
function fxPt(a){
  if(typeof a === 'string') a = document.querySelector(a);
  if(a && a.nodeType === 1){
    if(!a.getClientRects().length) return { x:800, y:450 };     // 隠れている要素は画面の真ん中
    var b = a.getBoundingClientRect();
    return DKFX.toStage(b.left + b.width / 2, b.top + b.height / 2);
  }
  if(a && typeof a.x === 'number' && typeof a.y === 'number') return { x:a.x, y:a.y };
  return { x:800, y:450 };
}
/* メタ画面の演出の待ち（対戦中は wait() を使う）。skip の時は 1/4 */
function fxWait(ms){
  return new Promise(function(r){ setTimeout(r, Math.max(0, (ms || 0) * ((DKFX && DKFX.skip) ? 0.25 : 1))); });
}
/* 画面の入場。[data-fx] を DOM の順に 45ms 間隔（data-fx-step で変更、10個で頭打ち）。
   値 rise|riseL|riseR|pop|popBig|deal|hero|none。[data-fx] が1つも無い画面は既定のセレクタで付ける */
function fxEnter(el){
  if(!el || el.nodeType !== 1 || DKFX.reduced) return;
  var list = el.querySelectorAll('[data-fx]'), auto = false;
  if(!list.length){ list = el.querySelectorAll(DKFX.autoSel); auto = true; }
  var base = parseInt(el.getAttribute('data-fx-step'), 10) || 45, i = 0, maxD = 0;
  Array.prototype.forEach.call(list, function(n){
    var kind;
    if(auto){
      if(n.matches('.dkhd > *')) kind = 'pop';
      else if(n.matches('.dkhero')) kind = 'hero';
      else if(n.matches('.dktab, .dkrail.left .dkrb')) kind = 'riseL';
      else if(n.matches('.dkrail.right .dkrb, .dkq, .dkrk')) kind = 'riseR';
      else if(n.matches('.dkgood, .dkday')) kind = 'deal';
      else kind = 'rise';
      n.setAttribute('data-fx', kind);
    } else kind = n.getAttribute('data-fx') || 'rise';
    if(kind === 'none') return;
    var host = n.closest('[data-fx-step]');
    var step = (host && host !== el) ? (parseInt(host.getAttribute('data-fx-step'), 10) || base) : base;
    var d = Math.min(i, 10) * step; i++;
    if(d > maxD) maxD = d;
    n.style.setProperty('--fx-d', d + 'ms');
  });
  el.classList.remove('fx-in');
  void el.offsetWidth;
  el.classList.add('fx-in');
  clearTimeout(el._fxInT);
  el._fxInT = setTimeout(function(){ el.classList.remove('fx-in'); }, maxD + 1100);
}
/* 光の玉・斜めの光・金の粒を1層だけ（画面の背景より上、中身より下） */
function fxAmbient(el, opt){
  if(!el || el.nodeType !== 1 || DKFX.reduced || el.id === 'title') return null;
  var a = el.querySelector(':scope > .fx-amb');
  if(a) return a;
  opt = opt || {};
  var n = (opt.motes === undefined) ? 12 : Math.max(0, opt.motes | 0);
  if(DKFX.lite || DKFX.small()) n = Math.min(n, 6);
  a = document.createElement('div');
  a.className = 'fx-amb'; a.setAttribute('aria-hidden', 'true');
  var h = '<i class="fx-blob"></i><i class="fx-blob fx-b2"></i><i class="fx-ray"></i>';
  for(var i = 0; i < n; i++){
    h += '<i class="fx-mote" style="left:' + (5 + DKFX.rnd() * 90).toFixed(1) + '%;top:' + (60 + DKFX.rnd() * 40).toFixed(1)
       + '%;animation-duration:' + (7 + DKFX.rnd() * 5).toFixed(1) + 's;animation-delay:-' + (DKFX.rnd() * 10).toFixed(1) + 's"></i>';
  }
  a.innerHTML = h;
  el.insertBefore(a, el.firstChild);
  return a;
}
/* 放射光を parent の先頭に入れて返す（重複なし） */
function fxRays(parent, opt){
  if(!parent || parent.nodeType !== 1) return null;
  opt = opt || {};
  var r = parent.querySelector(':scope > .fx-rays');
  if(!r){
    r = document.createElement('div'); r.className = 'fx-rays'; r.setAttribute('aria-hidden', 'true');
    parent.insertBefore(r, parent.firstChild);
  }
  r.classList.toggle('silver', opt.tone === 'silver');
  r.classList.toggle('fast', !!opt.fast);
  return r;
}
/* 画面全体が一瞬光る（控えめ・reduced では何もしない） */
function fxFlash(){
  if(DKFX.reduced || DKFX.lite) return;
  var st = DKFX.stage(); if(!st) return;
  var f = st.querySelector(':scope > .fx-flash');
  if(!f){ f = document.createElement('div'); f.className = 'fx-flash'; f.setAttribute('aria-hidden', 'true'); st.appendChild(f); }
  f.classList.remove('go');
  requestAnimationFrame(function(){ f.classList.add('go'); });
  clearTimeout(f._t); f._t = setTimeout(function(){ f.classList.remove('go'); }, 200);
}
/* 揺らす（元の transform に足し算するので位置はずれない） */
function fxShake(el, ms){
  if(!el || !el.animate || DKFX.reduced) return null;
  ms = ms || 220;
  var kf = [{ transform:'translate(0,0)' }, { transform:'translate(-6px,2px)' }, { transform:'translate(5px,-3px)' },
            { transform:'translate(-4px,1px)' }, { transform:'translate(3px,-1px)' }, { transform:'translate(0,0)' }];
  try{ return el.animate(kf, { duration:ms, easing:'linear', composite:'add' }); }
  catch(e){ try{ return el.animate(kf, { duration:ms, easing:'linear' }); }catch(e2){ return null; } }
}
/* その位置に袋文字の札を出し、600ms 後に上へ消える */
function fxPopText(at, text, opt){
  opt = opt || {};
  var p = fxPt(at), d = document.createElement('div');
  d.className = 'fx-poptext ' + (opt.tone === 'ruby' ? 'ruby' : opt.tone === 'emer' ? 'emer' : 'gold');
  d.style.left = p.x.toFixed(1) + 'px'; d.style.top = p.y.toFixed(1) + 'px';
  var b = document.createElement('b'); b.textContent = String(text == null ? '' : text);
  b.style.fontSize = (opt.size || 44) + 'px';
  d.appendChild(b);
  DKFX.layer().appendChild(d);
  setTimeout(function(){ d.classList.add('out'); }, 600);
  setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, 1100);
  return d;
}
/* 数字の横に小さい ▲+80万（緑）/▼-17万（赤）を出して上へ消す */
function fxFloatTag(el, text, up){
  if(!el) return null;
  var c = fxPt(el), w = el.offsetWidth || 0, h = el.offsetHeight || 0;
  var d = document.createElement('div');
  d.className = 'fx-floattag ' + (up === false ? 'dn' : 'up');
  d.textContent = (up === false ? '▼' : '▲') + String(text == null ? '' : text);
  d.style.left = (c.x + w / 2 + 6).toFixed(1) + 'px'; d.style.top = (c.y - h / 2).toFixed(1) + 'px';
  DKFX.layer().appendChild(d);
  setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, 950);
  return d;
}
/* 数字が回って弾む。easeOutQuart、着地で .fx-bump、増えたら .fx-up・減ったら .fx-dn */
function fxCount(el, to, opt){
  opt = opt || {};
  return new Promise(function(res){
    if(!el){ res(); return; }
    var fmt = opt.fmt || DKFX.fmt;
    var from = (typeof opt.from === 'number') ? opt.from : DKFX.parseNum(el.textContent);
    to = +to || 0;
    var dur = (opt.dur === undefined) ? 900 : +opt.dur;
    var bump = opt.bump !== false;
    var tok = {}; el._fxTok = tok;
    if(el._fxRes){ var pr = el._fxRes; el._fxRes = null; pr(); }
    var finish = function(){
      if(el._fxTok !== tok) return;
      el._fxTok = null; el._fxRes = null;
      el.textContent = fmt(to);
      el.classList.remove('fx-counting');
      if(bump && from !== to && !DKFX.reduced) DKFX.bumpNum(el, to > from);
      res();
    };
    if(from === to || !(dur > 0) || DKFX.reduced || !DKFX.shown(el)){ finish(); return; }
    el._fxRes = res;
    el.classList.add('fx-counting');
    var t0 = performance.now();
    var step = function(){
      if(el._fxTok !== tok) return;
      var k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      if(k >= 1){ finish(); return; }
      el.textContent = fmt(from + (to - from) * e);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(finish, dur + 250);          // タブが裏に回って rAF が止まっても必ず着地させる
  });
}
/* その場で弾ける粒（共有 canvas・160個まで） */
function fxBurst(at, opt){
  if(DKFX.reduced) return;
  opt = opt || {};
  var ctx = DKFX.ensure(); if(!ctx) return;
  var p = fxPt(at || DKFX.stage());
  var kind = opt.kind || 'star', n = (opt.n === undefined) ? 18 : Math.max(0, opt.n | 0);
  if(DKFX.lite) n = Math.ceil(n / 2);
  var pow = opt.power || 1, gr = (opt.gravity === undefined) ? 0.0016 : opt.gravity;
  for(var i = 0; i < n; i++){
    var a = (Math.PI * 2 * i) / Math.max(1, n) + (DKFX.rnd() - 0.5) * 0.7;
    var sp = (0.35 + DKFX.rnd() * 0.45) * pow;
    var sz = kind === 'coin' ? 26 + DKFX.rnd() * 10 : kind === 'gem' ? 22 + DKFX.rnd() * 9
           : kind === 'conf' ? 10 + DKFX.rnd() * 7 : 16 + DKFX.rnd() * 16;
    DKFX.push({ mode:'b', kind:kind, x:p.x, y:p.y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 0.18 * pow,
      g:(kind === 'star' ? gr * 0.5 : gr), age:0, life:700 + DKFX.rnd() * 300, sz:sz,
      rot:DKFX.rnd() * 6.28, vr:(DKFX.rnd() - 0.5) * 0.02, spin:DKFX.rnd() * 6.28, vs:0.01 + DKFX.rnd() * 0.01,
      add:(kind === 'star'), col:opt.color || DKFX.spr.conf[(DKFX.rnd() * 5) | 0] });
  }
}
/* コインが財布へ飛ぶ。最後の1枚の着弾で resolve */
function fxCoins(from, to, opt){
  opt = opt || {};
  return new Promise(function(res){
    var done = false, fin = function(){ if(done) return; done = true; try{ if(opt.onDone) opt.onDone(); }catch(e){ console.error('[fxCoins]', e); } res(); };
    var ctx = DKFX.reduced ? null : DKFX.ensure();
    if(!ctx){ fin(); return; }
    var a = fxPt(from || DKFX.stage()), tgt = (to && to.nodeType === 1) ? to : null, b = fxPt(to);
    var kind = opt.kind || 'coin', n = Math.max(1, (opt.n === undefined ? 14 : opt.n) | 0);
    if(DKFX.lite) n = Math.max(1, Math.ceil(n / 2));
    var spread = opt.spread === undefined ? 70 : opt.spread, dur = (opt.dur || 720) * (DKFX.skip ? 0.25 : 1);
    var stag = (opt.stagger === undefined ? 28 : opt.stagger) * (DKFX.skip ? 0.25 : 1);
    var now = performance.now(), left = n, lastSfx = 0;
    var hit = function(i){
      try{ if(opt.onHit) opt.onHit(i); }catch(e){ console.error('[fxCoins]', e); }
      if(tgt) DKFX.poke(tgt);
      if(i % 3 === 0){ fxBurst(b, { kind:'star', n:3, power:0.4 }); }
      var t = performance.now();
      if(i % 3 === 0 && t - lastSfx >= 60){ lastSfx = t; try{ SFX.coin(); }catch(e){} }
      if(--left <= 0) fin();
    };
    for(var i = 0; i < n; i++){
      var ang = DKFX.rnd() * Math.PI * 2, rr = spread * (0.4 + DKFX.rnd() * 0.6);
      var bx = a.x + Math.cos(ang) * rr, by = a.y + Math.sin(ang) * rr;
      (function(idx){
        DKFX.push({ mode:'c', kind:kind, t0:now + idx * stag, dur:dur, fx:a.x, fy:a.y, bx:bx, by:by,
          cx:(bx + b.x) / 2, cy:(by + b.y) / 2 - (160 + DKFX.rnd() * 80), tx:b.x, ty:b.y,
          sz:(kind === 'gem' ? 30 : 32), rot:DKFX.rnd() * 6.28, spin:DKFX.rnd() * 6.28,
          done:function(){ this.done = null; hit(idx); } });
      })(i);
    }
    setTimeout(fin, n * stag + dur + 600);
  });
}
/* 財布の数字（王宮ヘッダー → 常設バー → 右上の点） */
function fxWalletEl(kind){
  var ids = (kind === 'gem') ? ['dkGem', 'wGem'] : ['dkGold', 'wGold'];
  for(var j = 0; j < ids.length; j++){
    var list = document.querySelectorAll('#' + ids[j]);
    for(var i = 0; i < list.length; i++) if(DKFX.shown(list[i])) return list[i];
  }
  return { x:1440, y:40 };
}
/* 対戦中、その人の HUD（.hud[data-pi] があればそれ、無ければ名前帯で引く） */
function fxHudOf(pi){
  var el = document.querySelector('.hud[data-pi="' + pi + '"]');
  if(el) return el;
  if(!G || !G.players || !G.players[pi]) return null;
  var nm = String(G.players[pi].name), keys = ['Bot', 'Top', 'TR', 'BL'], loose = null;
  for(var i = 0; i < keys.length; i++){
    var n = document.getElementById('f' + keys[i] + 'Name'), h = document.getElementById('hud' + keys[i]);
    if(!n || !h) continue;
    var t = (n.textContent || '').trim();
    if(t === nm) return h;
    if(!loose && t.indexOf(nm) >= 0) loose = h;
  }
  return loose;
}
/* 同じ key の前のタイマーを止めてから張る。画面が変わると止まる（{keep:true} なら残る） */
function dkEvery(key, fn, ms, opt){
  var T = DKFX.timers;
  if(T[key]){ clearInterval(T[key].h); delete T[key]; }
  if(typeof fn !== 'function') return null;
  var h = setInterval(function(){ try{ fn(); }catch(e){ console.error('[dkEvery ' + key + ']', e); } }, Math.max(16, ms | 0));
  T[key] = { h:h, keep:!!(opt && opt.keep) };
  return key;
}

/* ══════════ 置き換える関数 ══════════ */
/* モーダル：[data-act] で閉じる。閉じる演出 170ms×SPEED、閉じている間は二度押し不可、.on を外してから resolve */
function modal(html){
  return new Promise(function(res){
    var wrap = document.getElementById('modalWrap'), body = document.getElementById('modalBody');
    if(!wrap || !body){ res(null); return; }
    var F = (typeof DKFX === 'object' && DKFX) ? DKFX : { mseq:0, reduced:false };
    var seq = ++F.mseq;
    body.innerHTML = html;
    var first = body.firstElementChild;
    wrap.classList.remove('fx-closing');
    wrap.classList.add('on');
    var closing = false;
    body.querySelectorAll('[data-act]').forEach(function(b){
      b.onclick = function(){
        if(closing) return;
        closing = true;
        try{ SFX.click(); }catch(e){}
        var act = b.dataset.act;
        var fin = function(){
          wrap.classList.remove('fx-closing');
          /* 閉じている間に別のモーダルや建設パネルが開いていたら、それは閉じない */
          if(F.mseq === seq && body.firstElementChild === first) wrap.classList.remove('on');
          res(act);
        };
        var ms = (F.reduced ? 0 : 170) * ((typeof SPEED === 'number' && SPEED > 0) ? SPEED : 1);
        if(ms < 1){ fin(); return; }
        wrap.classList.add('fx-closing');
        setTimeout(fin, ms);
      };
    });
  });
}
/* 数字がパラパラと増える（旧 dkCount と同じ引数） */
function dkCount(el, to, ms){
  if(!el) return Promise.resolve();
  return fxCount(el, to, { dur: ms || 620 });
}
/* 財布の数字をすべて更新（#dkGold/#dkGem/#wGold/#wGem。画面ごとに同じ id があるので全部） */
function dkWallet(){
  if(typeof SV !== 'object' || !SV) return;
  var put = function(sel, v){
    document.querySelectorAll(sel).forEach(function(el){
      if(DKFX.shown(el)) fxCount(el, v, { dur:620 });
      else { el._fxTok = null; el.classList.remove('fx-counting'); el.textContent = v.toLocaleString(); }
    });
  };
  put('#dkGold', SV.gold); put('#wGold', SV.gold);
  put('#dkGem', SV.gem);   put('#wGem', SV.gem);
}
/* 報酬を受け取ったとき、その場から粒が弾ける（絵文字で種類を決める） */
function dkBurst(el, ic, n){
  var kind = (ic === '🪙') ? 'coin' : (ic === '💎') ? 'gem' : (ic === '⭐' || ic === '✨') ? 'star' : 'conf';
  fxBurst(el || DKFX.stage(), { kind:kind, n:(n || 12) });
}
/* HUD の金額（yen 表示・dataset.v・700×SPEED を維持） */
function rollNum(el, to){
  if(!el) return;
  var from = +(el.dataset.v || 0);
  if(from === to){ el.textContent = yen(to); return; }
  el.dataset.v = to;
  fxCount(el, to, { from:from, dur:700 * SPEED, fmt:yen });
}
/* クリックの配線（画面を作ったら必ず最後に呼ぶ）。data-dkbuy="gold|gem" → showShop('osusume'|'gem') */
function dkWire(el, onTab){
  if(!el) return;
  el.querySelectorAll('[data-dkgo]').forEach(function(b){
    b.onclick = function(){ dkGo(b.dataset.dkgo); };
  });
  el.querySelectorAll('[data-dkbuy]').forEach(function(b){
    b.onclick = function(){
      try{ SFX.click(); }catch(e){}
      var tab = (b.dataset.dkbuy === 'gem') ? 'gem' : 'osusume';
      /* まだ引数を受けない旧 showShop の間だけ、開くタブを先に合わせておく */
      if(showShop.length === 0 && typeof dkShopTab !== 'undefined') dkShopTab = tab;
      showShop(tab);
    };
  });
  el.querySelectorAll('[data-dktab]').forEach(function(b){
    b.onclick = function(){ try{ SFX.click(); }catch(e){} if(onTab) onTab(b.dataset.dktab); };
  });
}

/* ══════════ §6 契約スタブ（持ち主の本物が後ろのファイルで宣言されると自動で置き換わる） ══════════ */
// ==== DK CONTRACT STUBS BEGIN ====
function dkFlowStart(){ screenTo('setup'); }
function dkFlowMap(){ screenTo('setup'); }
function dkFlowRoom(){ screenTo('setup'); }
function dkClassOf(id){ return { id:'eco', nm:'エコノミー', cash:cfg.cash, x:1, lv:1 }; }
function dkOrderOnBoard(){ return Promise.resolve(); }
function dvAsk(seat, tag, local, hint){ return Promise.resolve().then(local); }
function dvQueueDice(seat, force, impact, target){ return Promise.resolve(); }
function dkGaugePair(total, die, force){ return rollPair(force, false, die); }
function dkPayFrom(pi, amt, toPi){ return Promise.resolve(payFrom(pi, amt)); }
function dkShowReach(list){ if(G) G.reachTiles = list; }
// ==== DK CONTRACT STUBS END ====

/* ══════════ 包む関数 ══════════ */
/* screenTo：毎回 fxAmbient、画面が変わった時だけ fxEnter、そして 'screen' イベント */
DKFX.o.screenTo = screenTo;
screenTo = function(id){
  var cur = document.querySelector('.screen.on');
  var changed = !cur || cur.id !== id;
  var was = (typeof wiping !== 'undefined') ? wiping : false;
  var r = DKFX.o.screenTo.apply(this, arguments);
  try{
    if(changed) DKFX.stopTimers(false);
    var el = document.getElementById(id);
    if(el){
      fxAmbient(el);
      if(changed){
        var wipeNow = (typeof wiping !== 'undefined') && wiping && !was;
        clearTimeout(el._fxEnterT);
        el._fxEnterT = setTimeout(function(){ el._fxEnterT = 0; fxEnter(el); }, wipeNow ? 250 : 0);
      }
    }
    dkEmit('screen', { id:id, changed:changed });
  }catch(e){ console.error('[WP0]', e); }
  return r;
};
/* newGame：前の画面の演出タイマーと粒を片付ける（p.pendLv などは 9a-core.js のラッパが入れる） */
DKFX.o.newGame = newGame;
newGame = function(){
  try{ DKFX.stopTimers(false); DKFX.clearParts(); }catch(e){ console.error('[WP0]', e); }
  return DKFX.o.newGame.apply(this, arguments);
};

/* ══════════ 起動 ══════════ */
(function(){
  try{
    try{ var v = localStorage.getItem('dv_fx'); DKFX.lite = (v === 'lite' || v === '1' || v === 'true'); }catch(e){}
    var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    DKFX.reduced = !!(mq && mq.matches);
    if(mq && mq.addEventListener) mq.addEventListener('change', function(){ DKFX.reduced = !!mq.matches; });
    document.documentElement.classList.toggle('fx-lite', DKFX.lite);
    var st = DKFX.stage();
    if(st){
      DKFX.ensure();
      if(!st.querySelector(':scope > .fx-flash')){
        var f = document.createElement('div'); f.className = 'fx-flash'; f.id = 'fxFlash'; f.setAttribute('aria-hidden', 'true');
        st.appendChild(f);
      }
      DKFX.layer();
      st.addEventListener('pointerdown', DKFX.ripple, true);
    }
    DKFX.titleFx();
    window.addEventListener('resize', function(){ try{ if(DKFX.cv) DKFX.ensure(); }catch(e){} });
    document.addEventListener('visibilitychange', function(){ if(document.hidden) DKFX.clearParts(); });
  }catch(e){ console.error('[WP0]', e); }
})();
