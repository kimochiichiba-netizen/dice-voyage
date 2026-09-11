/* ダイスキングダム — 手番の流れ・サイコロのゲージ・マス選び（9g-turn.js / v10 WP13a）
   日本版の手番に寄せる：ゲージ4区間（J29）・奇数偶数は共通の回数（J28）・無人島（J14）・世界旅行（J24）・祭りは1都市（J25）・
   スタート建設ボーナス（J37）・インフレは12ターンだけ（J13）・揺らすはルールでオン（J45）・持ち時間と自動プレイ（G12・C14） */

const DKT_IDLE_MS  = 3000;     // 押していない時、ゲージが 2→12→2 と往復する時間
const DKT_HOLD_MS  = 1200;     // 長押し中の往復（本家の速さ）
const DKT_HOLD_MIN = 170;      // これより短い押しは「ただのクリック」
const DKT_STOP_MS  = 180;      // 止めた位置を見せる時間（×SPEED）。止めてから出目まで 1.3秒（本家 J46）
const DKT_THROW_MS = 1120;     // サイコロが転がる時間（×SPEED）
const DKT_CHIP_MS  = 1000;     // 出目の数字を見せる時間（×SPEED）
const DKT_PICK_MS  = 20000;    // マス選びの時間切れ（×SPEED。持ち時間のルールが無い時）
const DKT_TURN_MS  = 30000;    // 手番の持ち時間（G12。SPEED は掛けない）
const DKT_THINK_MS = 420;      // CPU が選ぶ間「〜選択中」の札を見せる時間（×SPEED）
const DKT_ZONES = [[2, 3], [4, 6], [7, 9], [10, 12]];   // ゲージの4区間（J29）
const DKT_GW = 560, DKT_GH = 214;          // #gauge の大きさ（ステージ座標）
const DKT_GX = 528, DKT_GY = 290;          // #gauge の左上（盤の中心 x=808 に合わせる）
const DKT_ARC = { cx:280, cy:232, rx:244, ry:172, a0:Math.PI * 1.075, a1:Math.PI * 1.925 };
const DKT_FONT = '"Mochiy Pop One","Noto Sans JP",sans-serif';
var DKT_G = { inp:null, pend:null, pick:null, pickOpt:null, ask:null, watch:false, drawn:false, el:null, pseq:0, base:null, tip:null };

/* ══════════ 席の見分け ══════════ */
function dktOnline(){ var O = window.DV_OL; return !!(O && O.started && G && !G.over); }
/* この端末で選ぶ席か（オンラインはその席の持ち主の端末だけ。7-online.js の isMine と同じ決まり） */
function dktMine(pi){
  if(!dktOnline()) return true;
  var O = window.DV_OL, s = O.seats && O.seats[pi];
  if(!s) return !!O.host;
  return ((s.kind === 'human' && s.alive) ? s.pid : O.hostId) === O.me;
}
/* CPU の判断で即決する席（CPU と自動プレイ中の人。C14） */
function dktCpuish(pi){ var p = G && G.players[pi]; return !p || p.kind === 'cpu' || !!p.auto; }
/* この端末で人が選ぶ（画面・リングを出す） */
function dktLocal(pi){ return !dktCpuish(pi) && dktMine(pi); }
/* 手番の持ち時間：部屋のルール（SV.rules.turnTimer・cfg.turnTimer）かオンラインの時だけ（C14） */
function dktTimerOn(){
  if(dktOnline()) return true;
  if(typeof cfg === 'object' && cfg && cfg.turnTimer) return true;
  return !!(typeof SV === 'object' && SV && SV.rules && SV.rules.turnTimer);
}
function dktCorner(k){
  var d = ['スタート', '無人島', 'ワールドフェスティバル', '世界旅行'][k];
  return String((G && G.map && G.map.corners && G.map.corners[k]) || d);
}
function dktTxt(el, s){ if(el && el.textContent !== s) el.textContent = s; }
function dktNoRoll(){ return { a:1, b:1, total:2, isDbl:false, cancelled:true }; }

/* ══════════ C14 自動プレイ ══════════
   on：その人の選択はすべて CPU の判断ですぐ決まる（画面は出さない）。why==='timeout' は「よわい」（買収・旅行・攻撃カードなし）。
   いま開いている入力（サイコロ・マス選び・この班の選択画面）もその場で閉じて CPU の判断で進める */
function dkSetAuto(pi, on, why){
  var p = G && G.players ? G.players[pi] : null; if(!p) return;
  on = !!on;
  var was = !!p.auto;
  p.auto = on;
  p.autoWeak = !!(on && why === 'timeout');
  if(on){
    var I = DKT_G.inp;
    if(I && I.pi === pi && !I.done && I.cancel) I.cancel({ tag:'auto' });
    var P = DKT_G.pick;
    if(P && P.pi === pi && !P.done) dktPickEnd(dktBestTile(pi, P.ok));
    var A = DKT_G.ask;
    if(A && A.pi === pi && !A.done) dktAskAuto(A);
  }
  if(was === on) return;
  try{ updHUD(); }catch(e){ console.error('[WP13a]', e); }
  try{ dkEmit('auto', { pi:pi, on:on, why:why || '' }); }catch(e){ console.error('[WP13a]', e); }
  if(p.kind !== 'cpu' && dktMine(pi)){
    dkNotify(pi, on ? '🤖' : '🎮', on ? '自動プレイ' : '自動プレイを終了',
      on ? (why === 'timeout' ? '時間切れのため、CPU が代わりに操作します' : 'CPU が代わりに操作します') : '自分で操作します', { ms:2000 });
  }
}
function dkIsAuto(pi){ var p = G && G.players ? G.players[pi] : null; return !!(p && p.auto); }

/* ══════════ 持ち時間のリング（CSS の回転だけで減っていく。数字は1秒ごとに書き換える） ══════════ */
/* pi あり＝この班の選択画面（DKT_G.ask の時計）、なし＝サイコロの入力（DKT_G.inp の時計） */
function dktRingHTML(pi){
  var A = DKT_G.ask, I = DKT_G.inp, C = null;
  if(pi !== undefined){ if(A && A.pi === pi && !A.done) C = A.clock; }
  else if(I && !I.done) C = I.clock;
  if(!C || C.done) return '';
  return '<div class="dkt-ring" data-ck="' + C.id + '" aria-hidden="true" style="--rg:' + DKT_TURN_MS + 'ms">'
    + '<i class="dkt-rg dkt-rg-r"><i></i></i><i class="dkt-rg dkt-rg-l"><i></i></i>'
    + '<b>' + Math.round(DKT_TURN_MS / 1000) + '</b></div>';
}
/* 時計は自分のリングだけを書き換え、試合が変わったら何もせずに止まる（前の試合の時計が次の試合の人を自動にしない） */
function dktClock(onTimeout){
  var t0 = performance.now(), g0 = G, C = { done:false, id:(DKT_G.ck = (DKT_G.ck | 0) + 1) };
  var sel = '.dkt-ring[data-ck="' + C.id + '"]';
  var tick = setInterval(function(){
    if(!G || G !== g0 || G.over){ C.stop(); return; }
    var left = Math.max(0, Math.ceil((DKT_TURN_MS - (performance.now() - t0)) / 1000));
    document.querySelectorAll(sel).forEach(function(r){
      var b = r.querySelector('b');
      if(b && b.textContent !== String(left)){ b.textContent = left; r.classList.toggle('dkt-late', left <= 5); }
    });
  }, 250);
  var to = setTimeout(function(){
    if(C.done) return;
    C.stop();
    if(!G || G !== g0 || G.over) return;
    try{ onTimeout(); }catch(e){ console.error('[WP13a] timeout', e); }
  }, DKT_TURN_MS);
  C.stop = function(){
    if(C.done) return;
    C.done = true; clearInterval(tick); clearTimeout(to);
    document.querySelectorAll(sel).forEach(function(r){ if(r.parentNode) r.parentNode.removeChild(r); });
  };
  return C;
}
/* 人の選択を1つ取る。dvAsk（オンラインでは全員にそろう）を包み、
   ほかの人が選ぶ間は札（C11 dkBusyTag）、この端末の人には持ち時間のリング、CPU は少し考えるふり */
async function dktAsk(pi, tag, local, hint, opt){
  opt = opt || {};
  var mine = dktLocal(pi), A = null, v;
  if(!mine && hint) dkBusyTag(pi, hint);
  try{
    if(dktCpuish(pi) && opt.think !== 0) await wait(DKT_THINK_MS);
    if(mine && dktTimerOn()){
      A = DKT_G.ask = { pi:pi, def:opt.def || null, done:false, clock:null };
      A.clock = dktClock(function(){ dkSetAuto(pi, true, 'timeout'); });
    }
    v = await dvAsk(pi, tag, local, hint);
  } finally {
    if(A){ A.done = true; if(A.clock) A.clock.stop(); if(DKT_G.ask === A) DKT_G.ask = null; }
    if(!mine && hint) dkBusyTag(pi, null);
  }
  return v;
}
/* 自動に切り替わった時、この班の選択画面を既定のボタンで閉じる */
function dktAskAuto(A){
  if(!A || A.done || !A.def) return;
  var b = document.querySelector('#modalBody [data-act="' + A.def + '"]');
  if(b) b.click();
}

/* ══════════ ゲージの値 ══════════ */
function dktTri(ph){ ph = ph - Math.floor(ph); return 1 - Math.abs(2 * ph - 1); }
/* 0..1 → 2..12（11マスが同じ幅になるように） */
function dktValOfU(u){ return 2 + Math.max(0, Math.min(10, Math.floor(u * 11))); }
/* いま止めたらゲージはどこか（押していない間はゆっくり、長押しは 2 から速く） */
function dktU(I, now){
  if(I.stopU !== undefined) return I.stopU;
  if(I.hold && now - I.hold >= DKT_HOLD_MIN) return dktTri((now - I.hold - DKT_HOLD_MIN) / DKT_HOLD_MS);
  return dktTri((now - I.t0) / DKT_IDLE_MS + I.ph0);
}
function dktParOk(t, force){ return !force || ((t % 2 === 0) ? 'even' : 'odd') === force; }
function dktZoneOf(v){ return v <= 3 ? 0 : v <= 6 ? 1 : v <= 9 ? 2 : 3; }
function dktWays(t){ return 6 - Math.abs(7 - t); }            // 2個振りでその合計になる組の数（1〜6）
/* 精度の効果（J29）：サイコロの極「守」か、精度のペンダント（it.prec・trg 'onGauge'） */
function dktPrecise(pi){
  var p = G && G.players[pi]; if(!p) return false;
  if(p.dieKw === 'def') return true;
  var d = dieOf(pi);
  if(d && d.kiwami === 'def') return true;
  return !!(p.pend && p.pend.some(function(it){ return it && (it.prec || it.trg === 'onGauge'); }));
}
/* サイコロのゲージインパクト値：装備のサイコロと、サイコロの能力（C05 dkDieAb.gauge）の大きい方（二重に数えない） */
function dktDieGauge(pi){
  var d = dieOf(pi), g = (d && +d.gauge) || 0, a = 0;
  try{ var ab = dkDieAb(pi); a = (ab && +ab.gauge) || 0; }catch(e){ a = 0; }
  return Math.max(g, a);
}
/* 当たる確率：clamp(.3＋能力値ゲージ×.45＋サイコロのゲージ×.01, .3, .92)（v9 の式のまま） */
function dktImpactP(pi){
  var p = G.players[pi];
  return Math.max(0.3, Math.min(0.92, 0.3 + statRate(p, 'gauge') * 0.45 + dktDieGauge(pi) * 0.01));
}
/* 止めた値 v から実際に出す合計：精度ならぴったり、それ以外は同じ区間の中から2個振りの重みで（奇偶の指定があれば合う値だけ） */
function dktAimTotal(pi, v, force){
  v = Math.max(2, Math.min(12, Math.round(+v) || 7));
  if(dktPrecise(pi) && dktParOk(v, force)) return v;
  var z = DKT_ZONES[dktZoneOf(v)], c = [], s = 0, t;
  for(t = z[0]; t <= z[1]; t++) if(dktParOk(t, force)){ c.push(t); s += dktWays(t); }
  if(!c.length) return Math.max(2, Math.min(12, v + (v < 7 ? 1 : -1)));
  var r = Math.random() * s;
  for(var k = 0; k < c.length; k++){ r -= dktWays(c[k]); if(r < 0) return c[k]; }
  return c[c.length - 1];
}
/* 当たり判定つき → {impact, target} */
function dktResolveAim(pi, v, force){
  if(Math.random() < dktImpactP(pi)) return { impact:true, target:dktAimTotal(pi, v, force) };
  return { impact:false, target:0 };
}
/* 止まると一番得をする合計（CPU がねらう値） */
function dktBestTotal(pi, force){
  var best = 7, bs = -1e18;
  for(var t = 2; t <= 12; t++){
    if(!dktParOk(t, force)) continue;
    var s = scoreLanding(pi, t);
    if(s > bs){ bs = s; best = t; }
  }
  return best;
}
function dktCpuTarget(pi, force){ return dktAimTotal(pi, dktBestTotal(pi, force), force); }

/* 合計 total になる2個の目。オンラインの目の配布でも使うので rollPair は呼ばない */
function dkGaugePair(total, die, force){
  var t = Math.max(2, Math.min(12, Math.round(+total) || 7));
  if(!dktParOk(t, force)) t += (t < 7 ? 1 : -1);
  var D = die || DICE[0];
  if(t % 2 === 0 && (+D.dbl || 0) > 0 && Math.random() < D.dbl) return [t / 2, t / 2];
  var lo = Math.max(1, t - 6), hi = Math.min(6, t - 1);
  var a = lo + ((Math.random() * (hi - lo + 1)) | 0);
  return [a, t - a];
}
/* オンラインで配られた目（無ければ null） */
function dktTakeQ(){
  var O = window.DV_OL;
  if(O && O.started && O.diceQ && O.diceQ.length){
    var q = O.diceQ.shift();
    if(q && q.length === 2) return q;
  }
  return null;
}
function dktDropQ(){ var O = window.DV_OL; if(O && O.diceQ) O.diceQ = null; }

/* ══════════ 奇数・偶数（共通の回数・J28・C07） ══════════ */
function dktOeN(p){ return Math.max(0, Math.min(p.odd | 0, p.even | 0)); }
/* 使う：両方1ずつ減らし、ボタンの上に「-1」 */
function dktOeUse(pi, force){
  var p = G.players[pi];
  if(!(dktOeN(p) > 0)) return false;
  p.odd = Math.max(0, (p.odd | 0) - 1); p.even = Math.max(0, (p.even | 0) - 1); p.oeHad = 1;
  if(dktLocal(pi)){ try{ fxPopText({ x:808, y:548 }, '-1', { tone:'ruby', size:36 }); }catch(e){ console.error('[WP13a]', e); } }
  return true;
}
/* 使い切ったあとの追加購入（💎5、2回目から 💎10 で3回ぶん）。ダイヤは選んだ人の端末だけで減らす */
async function dktOeBuy(pi){
  var p = G.players[pi], n = p.oeBuy | 0, price = n >= 1 ? 10 : 5;
  var ok = await dktAsk(pi, 'oebuy', function(){
    return dktCpuish(pi) ? false : dktOeUI(pi, price);
  }, '奇数・偶数アイテムを購入中', { def:'no', think:0 });
  if(ok !== true || !G || G.over) return false;
  p.odd = (p.odd | 0) + 3; p.even = (p.even | 0) + 3; p.oeBuy = n + 1; p.oeHad = 1;
  try{ SFX.good(); }catch(e){}
  dkNotify(pi, '🎲', '奇数/偶数アイテム', '3回ぶん追加しました', { ms:1800 });
  try{ updHUD(); }catch(e){ console.error('[WP13a]', e); }
  return true;
}
function dktOeUI(pi, price){
  var gem = (typeof SV === 'object' && SV) ? (SV.gem | 0) : 0, can = gem >= price;
  var h = '<div class="modal dkt-mod dkt-oebuy">' + dktRingHTML(pi)
    + '<div class="dkt-rib dkt-blue"><b>奇数/偶数アイテム</b></div>'
    + '<p class="dkt-lead">奇数・偶数アイテムすべて使用<br><em>追加購入可能</em></p>'
    + '<div class="dkt-oepk">' + dktSvg('oe') + '<div><b>奇数/偶数 ×3</b><span>このゲームのあいだ使えます</span></div></div>'
    + '<div class="dkt-fee"><span>価格</span><b>' + dktSvg('gem') + price + '</b><i>所持 ' + gem + '</i></div>'
    + '<div class="dkt-btns">'
    +   '<button type="button" class="dkt-btn dkt-no" data-act="no">やめる</button>'
    +   (can ? '<button type="button" class="dkt-btn dkt-go" data-act="buy">購入<small>ダイヤ ' + price + '</small></button>'
             : '<div class="dkt-btn dkt-go dkt-dis">ダイヤが足りません</div>')
    + '</div></div>';
  return modal(h).then(function(a){
    if(a !== 'buy' || !(SV.gem >= price)) return false;
    SV.gem -= price;
    try{ saveNow(); }catch(e){ console.error('[WP13a]', e); }
    try{ dkWallet(); }catch(e){ console.error('[WP13a]', e); }
    return true;
  });
}

/* ══════════ サイコロを振る ══════════
   doRoll(pi, force, impact, fixedTotal[, target])。4つの引数だけでも動く
   （target が落ちたら、takeRoll／aiRoll が控えた値 → それも無ければ CPU と同じねらいで決める） */
async function doRoll(pi, force, impact, fixedTotal, target){
  var p = G.players[pi];
  gaugeOn = false; dktHideInput(); stepPreview = null;
  var die = dieOf(pi);
  if(!(target >= 2) && DKT_G.pend && DKT_G.pend.pi === pi) target = DKT_G.pend.target;
  DKT_G.pend = null;
  var a, b, hit = false;
  if(fixedTotal){
    a = Math.max(1, Math.min(6, Math.floor(fixedTotal / 2)));
    b = fixedTotal - a;
    if(b > 6){ b = 6; a = fixedTotal - 6; }
    // 2 と 12 以外はダブルにしない（選んだ目でもう一回振れてしまうのを防ぐ）
    if(a === b && fixedTotal > 2 && fixedTotal < 12){ a--; b++; }
  } else {
    // サイコロダブル（持ち込み・能力。奇数とは両立しないので、奇数の時は次に残す）＞ゲージインパクト＞ふつう
    var wantDbl = p.forceDouble > 0 && force !== 'odd', pr;
    if(wantDbl){ pr = rollPair(force, true, die); p.forceDouble--; }
    else if(impact){
      pr = dktTakeQ();
      if(!pr){
        if(!(target >= 2 && target <= 12)) target = dktCpuTarget(pi, force);
        pr = dkGaugePair(target, die, force);
      }
      hit = true;
    } else pr = rollPair(force, false, die);
    a = pr[0]; b = pr[1];
  }
  dktDropQ();
  var seed = (pi * 7919 + G.turnsLeft * 131 + a * 13 + b * 7 + p.pos) % 100000;
  // 栄光の光：振る瞬間に判定してダブルにする
  if(!fixedTotal && a !== b && pendOf(pi, 'onRoll')){
    if(await pendFire(pi, 'onRoll')) b = a;
  }
  var th = dktFastThrow(dvThrow(seed, a, b));
  diceAnim = { t:0, th:th, lastShake:0 };
  SFX.diceShake();
  setTimeout(function(){ SFX.diceThrow(); }, 130 * SPEED);
  await wait(th.dur);
  addFx('spark', BCX, DICE_Y - 10, 900, '#FFD24D');
  var total = a + b, isDbl = a === b;
  if(isDbl){ SFX.diceDouble(); camShake(12); }
  showChip(total, isDbl, { impact:hit, target:(hit ? (target || total) : 0) });
  await wait(DKT_CHIP_MS);
  hideChip();
  return { a:a, b:b, total:total, isDbl:isDbl, impact:hit };
}
/* dvThrow の転がり（1.5〜1.9秒）を本家の速さに縮める。drawDice・frame が見るのは th.at と th.dur だけ */
function dktFastThrow(th){
  if(!th || typeof th.at !== 'function' || !(th.dur > DKT_THROW_MS)) return th;
  var src = th, k = th.dur / DKT_THROW_MS, o = Object.assign({}, th);
  o.dur = DKT_THROW_MS;
  o.at = function(t){ return src.at(Math.min(src.dur, t * k)); };
  return o;
}

/* 人間の手番：入力UI → 振る */
function takeRoll(pi){
  var p = G.players[pi];
  if(p.kind === 'cpu' || dkIsAuto(pi)) return aiRoll(pi);
  return dkRollInput(pi).then(function(o){
    if(!G || G.over || p.out) return dktNoRoll();
    if(o && o.tag === 'auto') return aiRoll(pi);
    if(o && o.tag === 'oebuy') return dktOeBuy(pi).then(function(){
      if(!G || G.over || p.out) return dktNoRoll();
      return takeRoll(pi);
    });
    if(!o || o.tag !== 'roll') return dktNoRoll();
    var force = o.force || null, fixed = 0;
    if(o.eye && p.chooseEye > 0){ p.chooseEye--; fixed = o.eye; force = null; }
    if(force && !dktOeUse(pi, force)) force = null;
    var imp = !!o.impact && !fixed, tg = imp ? (o.target || 0) : 0;
    DKT_G.pend = { pi:pi, target:tg };           // doRoll を包む人が引数を落としても届くように
    return doRoll(pi, force, imp, fixed, tg);
  });
}

/* ══════════ サイコロの入力UI（takeRoll とオンラインの両方から使う） ══════════
   → Promise<{tag:'roll', force, impact, target, eye, v} | {tag:'auto'} | {tag:'oebuy'} | 外から渡された値>
   状態は書き換えない（奇偶の回数・出目えらびの回数は呼んだ側が減らす） */
function dkRollInput(pi){
  var p = G.players[pi];
  var old = DKT_G.inp;
  if(old && !old.done){ old.done = true; dktUnwire(old); if(old.clock) old.clock.stop(); }
  if(dktOeN(p) > 0) p.oeHad = 1;
  return new Promise(function(res){
    var I = { pi:pi, force:null, hold:0, t0:performance.now(), ph0:Math.random(), pImp:dktImpactP(pi), prec:dktPrecise(pi),
              done:false, stopU:undefined, hit:null, chg:null, clock:null };
    DKT_G.inp = I;
    stepPreview = { from:p.pos, max:12, parity:null };
    gaugeOn = true;
    var close = function(){
      if(I.done) return false;
      I.done = true; dktUnwire(I);
      if(I.clock){ I.clock.stop(); I.clock = null; }
      return true;
    };
    I.cancel = function(val){ if(!close()) return; dktHideInput(); res(val); };
    I.roll = async function(u){
      if(!close()) return;
      I.stopU = u;
      var v = dktValOfU(u);
      var aim = dktResolveAim(pi, v, I.force);
      I.hit = aim.impact;
      dktStopFx(I, aim);
      var eye = 0;
      if(p.chooseEye > 0){ await wait(160); dktHideInput(); eye = await chooseEye(); }
      else await wait(DKT_STOP_MS);
      if(DKT_G.inp === I) dktHideInput();
      res({ tag:'roll', force:(eye ? null : I.force), impact:(eye ? false : aim.impact),
            target:(eye ? 0 : aim.target), eye:eye, v:v });
    };
    dktShowDice(I);
    dktWire(I);
    if(dktTimerOn() && dktLocal(pi)){
      I.clock = dktClock(function(){ dkSetAuto(pi, true, 'timeout'); });
      var E = dktEl(); if(E.ui) E.ui.insertAdjacentHTML('beforeend', dktRingHTML());
    }
  });
}
/* 待っている入力を外から閉じる（オンラインで持ち物を使った時など） */
function dktInputCancel(val){ var I = DKT_G.inp; if(I && I.cancel) I.cancel(val); }

function dktEl(){
  var E = DKT_G.el;
  if(E && E.ui && E.ui.isConnected) return E;
  var q = function(s){ return document.querySelector(s); };
  E = DKT_G.el = { ui:q('#diceui'), push:q('#push'), odd:q('#odd'), even:q('#even'), oddN:q('#oddN'), gauge:q('#gauge'),
    evenN:q('#evenN'), sk:q('#skillBtn'), cap:q('#diceui .dkt-cap'), lbl:q('#push .dkt-pl'), sub:q('#push .dkt-ps'),
    tagA:q('#diceui .dkt-oeA'), tagB:q('#diceui .dkt-oeB') };
  return E;
}
function dktShowDice(I){
  var E = dktEl(); if(!E.ui) return;
  DKT_G.watch = false;
  E.ui.classList.remove('dkt-watch', 'dkt-hit', 'dkt-miss');
  dktSyncUI(I);
  var was = E.ui.classList.contains('on');
  E.ui.classList.add('on');
  if(!was) dktEnter(E);
}
/* 出てくる時の動き（el.animate。終わったら残らないので、スマホで層が残らない） */
function dktEnter(E){
  var F = (typeof DKFX === 'object' && DKFX) ? DKFX : {};
  if(F.reduced) return;
  var go = function(el, kf, o){ if(el && el.animate){ try{ el.animate(kf, o); }catch(e){ console.error('[WP13a]', e); } } };
  var spring = 'cubic-bezier(.34,1.56,.64,1)', out = 'cubic-bezier(.16,1,.3,1)';
  if(!F.lite) go(E.push, [{ transform:'scale(.86)' }, { transform:'scale(1.06)', offset:0.6 }, { transform:'scale(1)' }], { duration:420, easing:spring });
  if(F.mob) return;          // スマホ：ゲージ・奇数偶数・案内の入場は出さない（iPhone の層を増やさない。1k-fx.html）
  go(E.odd, [{ transform:'translateX(-30px) scale(.9)' }, { transform:'none' }], { duration:380, delay:60, easing:out, fill:'backwards' });
  go(E.even, [{ transform:'translateX(30px) scale(.9)' }, { transform:'none' }], { duration:380, delay:60, easing:out, fill:'backwards' });
  go(E.gauge, [{ transform:'translateY(16px) scale(.94)' }, { transform:'none' }], { duration:360, easing:out });
  go(E.cap, [{ transform:'translateX(-50%) translateY(10px) scale(.9)' }, { transform:'translateX(-50%)' }],
     { duration:360, delay:120, easing:out, fill:'backwards' });
}
function dktSyncUI(I){
  var E = dktEl(), p = G.players[I.pi], n = dktOeN(p), loc = dktLocal(I.pi);
  var buy = !(n > 0) && !!p.oeHad && loc && !dktOnline();
  dktTxt(E.oddN, String(n)); dktTxt(E.evenN, String(n));
  [E.odd, E.even].forEach(function(b, k){
    if(!b) return;
    b.classList.toggle('dim', !(n > 0));
    b.classList.toggle('dkt-buy', buy);
    b.classList.toggle('dkt-on', I.force === (k ? 'even' : 'odd'));
  });
  if(E.ui) E.ui.classList.toggle('dkt-oe0', !(n > 0) && !!p.oeHad && loc);
  dktTxt(E.tagA, '奇数・偶数アイテムすべて使用');
  dktTxt(E.tagB, buy ? '追加購入可能' : '');
  if(E.push) E.push.classList.toggle('dkt-mode', !!I.force);
  var t = I.force === 'odd' ? '奇数' : I.force === 'even' ? '偶数' : '押す';
  if(E.lbl && E.lbl.textContent !== t){
    E.lbl.textContent = t;
    if(E.lbl.animate && !(typeof DKFX === 'object' && DKFX && DKFX.reduced)){
      try{ E.lbl.animate([{ transform:'scale(.6)' }, { transform:'scale(1.15)', offset:0.6 }, { transform:'scale(1)' }],
                         { duration:320, easing:'cubic-bezier(.34,1.56,.64,1)' }); }catch(e){ console.error('[WP13a]', e); }
    }
  }
  dktTxt(E.sub, I.force ? n + '個残り' : '長押しでねらう');
  if(E.cap) E.cap.innerHTML = 'ゲージインパクト <b>' + Math.round(I.pImp * 100) + '%</b>'
    + (I.prec ? '<span class="dkt-dot"></span>精度 <b>ぴったり</b>' : '');
}
function dktHideInput(){
  var I = DKT_G.inp;
  if(I && I.chg){ try{ I.chg.end(); }catch(e){} I.chg = null; }
  if(I && I.clock){ I.clock.stop(); I.clock = null; }
  DKT_G.inp = null; gaugeOn = false;
  var E = dktEl();
  if(E.ui) E.ui.classList.remove('on', 'dkt-hit', 'dkt-miss', 'dkt-watch', 'dkt-oe0');
  if(E.push) E.push.classList.remove('dkt-hold');
  DKT_G.watch = false;
}
/* モーダル・カットイン・マス選び・出目えらびの間は［押す］を受けない（持ち物とサイコロが同じ手番に両方動く競合 WP7#1） */
function dktBlocked(){
  if(DKT_G.pick) return true;
  return !!document.querySelector('#modalWrap.on, #skillcut.on, #pickeye.on');
}
function dktWire(I){
  var E = dktEl();
  if(!E.push) return;
  E.push.onclick = function(){
    if(I.done || I.fired || dktBlocked()) return;
    try{ SFX.click(); }catch(e){}
    I.roll(dktU(I, performance.now()));
  };
  I.onDown = function(ev){
    if(I.done || (ev && ev.button > 0) || dktBlocked()) return;
    I.hold = performance.now();
    E.push.classList.add('dkt-hold');
    try{ E.push.setPointerCapture(ev.pointerId); }catch(e){}
  };
  I.onUp = function(){
    if(I.done || !I.hold){ I.hold = 0; return; }
    var now = performance.now(), long = now - I.hold >= DKT_HOLD_MIN, u = dktU(I, now);
    I.hold = 0; E.push.classList.remove('dkt-hold');
    if(I.chg){ try{ I.chg.end(); }catch(e){} I.chg = null; }
    if(long && !dktBlocked()){ I.fired = true; I.roll(u); }     // 長押し：離した値。短い押しは onclick に任せる
  };
  I.onCancel = function(){
    I.hold = 0; E.push.classList.remove('dkt-hold');
    if(I.chg){ try{ I.chg.end(); }catch(e){} I.chg = null; }
  };
  E.push.addEventListener('pointerdown', I.onDown);
  E.push.addEventListener('pointerup', I.onUp);
  E.push.addEventListener('pointercancel', I.onCancel);
  if(E.odd)  E.odd.onclick  = function(){ dktToggle(I, 'odd'); };
  if(E.even) E.even.onclick = function(){ dktToggle(I, 'even'); };
  if(E.sk) E.sk.onclick = function(){ if(E.sk.disabled || I.done) return; try{ SFX.click(); }catch(e){} dktSkillInfo(I.pi); };
}
function dktUnwire(I){
  var E = dktEl();
  if(E.push){
    E.push.onclick = null; E.push.classList.remove('dkt-hold');
    if(I && I.onDown){
      E.push.removeEventListener('pointerdown', I.onDown);
      E.push.removeEventListener('pointerup', I.onUp);
      E.push.removeEventListener('pointercancel', I.onCancel);
    }
  }
  if(E.odd) E.odd.onclick = null;
  if(E.even) E.even.onclick = null;
  if(E.sk) E.sk.onclick = null;
}
/* 奇数／偶数：押すとモード、もう一度押すと解除。使い切っていたら追加購入（回数はここでは減らさない） */
function dktToggle(I, par){
  if(I.done || dktBlocked()) return;
  var p = G.players[I.pi], E = dktEl(), btn = (par === 'odd') ? E.odd : E.even;
  if(I.force === par) I.force = null;
  else {
    if(!(dktOeN(p) > 0)){
      if(p.oeHad && dktLocal(I.pi) && !dktOnline()){ try{ SFX.click(); }catch(e){} I.cancel({ tag:'oebuy' }); return; }
      try{ SFX.warn(); }catch(e){}
      if(btn) fxShake(btn, 260);
      return;
    }
    I.force = par;
  }
  try{ SFX.click(); }catch(e){}
  if(stepPreview) stepPreview.parity = I.force;
  dktSyncUI(I);
  if(I.force && btn) fxBurst(btn, { kind:'star', n:8, power:0.5 });
}
/* ［能力］の札：能力の説明だけ（J33。押しても盤は変わらない） */
function dktSkillInfo(pi){
  var p = G && G.players[pi]; if(!p) return;
  var c = (typeof cardById === 'function' && cardById(p.card)) || null, sk = p.skill || (c && c.sk) || null;
  dkNotify(pi, '✨', ((c && c.nm) || p.name) + ' の能力',
    sk ? (sk.nm + '：' + (sk.ds || '')) : '決まった時に確率で自動で発動します', { ms:2600 });
}
/* 止めた瞬間の手応え（当たりは金の粒と「ゲージインパクト！」。中央のプレートに重ならない高さ＝GO-3） */
function dktStopFx(I, aim){
  var E = dktEl();
  if(E.ui) E.ui.classList.add(aim.impact ? 'dkt-hit' : 'dkt-miss');
  if(!aim.impact) return;
  var at = dktTipPt(I.stopU);
  try{ SFX.gaugeOk(); }catch(e){}
  fxBurst(at, { kind:'star', n:16, power:0.9 });
  fxPopText({ x:808, y:DKT_GY + 118 }, 'ゲージインパクト！', { tone:'gold', size:40 });
}
/* カメラを寄せる。盤の外（背景の継ぎ目）が見えないように、寄せる先を卓の内側に収める */
function dktFocus(x, y, z){
  var hw = SW / 2 / z, hh = SH / 2 / z;       // 卓（茶の台）は盤の座標で x 28〜1572・y 16〜884
  var cx = Math.max(28 + hw, Math.min(1572 - hw, x));
  var cy = Math.max(16 + hh, Math.min(884 - hh, y));
  camTo(cx, cy, z);
}
/* ゲージの先端のステージ座標 */
function dktTipPt(u){
  var A = DKT_ARC, a = A.a0 + (A.a1 - A.a0) * (u || 0);
  return { x:DKT_GX + A.cx + Math.cos(a) * A.rx, y:DKT_GY + A.cy + Math.sin(a) * A.ry };
}
/* CPU・自動プレイの手番：ボタンは隠して、ゲージだけ「ねらっている」ように動かす */
function dktWatch(on){
  if(DKT_G.watch === on) return;
  DKT_G.watch = on;
  var E = dktEl(); if(!E.ui) return;
  E.ui.classList.toggle('dkt-watch', on);
  if(on && E.cap && G && G.players[G.turn]){
    var q = G.players[G.turn];
    E.cap.innerHTML = '<b style="color:' + PCOL[G.turn] + '">' + esc(q.name) + '</b>'
      + (q.kind !== 'cpu' && q.auto ? '（自動プレイ）' : '') + ' がねらっています';
  }
}

/* スマホ：ゲージの画素を盤の canvas と同じ細かさ（ステージの縮尺×devicePixelRatio、1〜2倍）に合わせる。
   iPhone 横は 1.25 倍で足りる（2倍の 1120×428 は要らない） */
function dktGaugeFit(){
  var k = (typeof cv !== 'undefined' && cv && cv.width) ? Math.max(1, Math.min(2, cv.width / 1600)) : 1;
  var w = Math.round(DKT_GW * k);
  if(gcv.width !== w){ gcv.width = w; gcv.height = Math.round(DKT_GH * k); }
}
function dktArcPath(g, r, a0, a1){ var A = DKT_ARC; g.beginPath(); g.ellipse(A.cx, A.cy, A.rx + r, A.ry + r, 0, a0, a1); }
function dktCellA(v){ var A = DKT_ARC; return A.a0 + (A.a1 - A.a0) * (v - 2) / 11; }     // 目 v の区画の始まりの角度
/* ゲージの動かない部分（影・金の縁・溝・4区間・目盛り・端の数字）を作り置く（大きさが変わった時だけ描き直す） */
function dktGaugeBase(k){
  var B = DKT_G.base;
  if(B && B.w === gcv.width && B.h === gcv.height) return B.c;
  var c = (B && B.c) || document.createElement('canvas');
  c.width = gcv.width; c.height = gcv.height;
  /* スマホは #gauge と同じく CPU で描く（GPU の絵を毎フレーム貼ると #gauge が層になり、上の HUD まで層になる。4-game.js の gctx） */
  var mob = (typeof DKFX === 'object' && DKFX && DKFX.mob) || (typeof dvMobile === 'function' && dvMobile());
  var g = c.getContext('2d', mob ? { willReadFrequently:true } : undefined), A = DKT_ARC, span = A.a1 - A.a0, s;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  g.setTransform(k, 0, 0, k, 0, 0);
  g.lineCap = 'round';
  g.lineWidth = 48; g.strokeStyle = 'rgba(0,0,0,.34)';
  g.beginPath(); g.ellipse(A.cx, A.cy + 7, A.rx, A.ry, 0, A.a0, A.a1); g.stroke();
  var gold = g.createLinearGradient(0, 40, 0, 200);
  gold.addColorStop(0, '#FFF6D0'); gold.addColorStop(0.3, '#E8B94A'); gold.addColorStop(0.62, '#8A5A0C'); gold.addColorStop(1, '#F3D583');
  g.lineWidth = 44; g.strokeStyle = gold; dktArcPath(g, 0, A.a0, A.a1); g.stroke();
  var trk = g.createLinearGradient(0, 50, 0, 200);
  trk.addColorStop(0, '#4A5163'); trk.addColorStop(1, '#171A23');
  g.lineWidth = 34; g.strokeStyle = trk; dktArcPath(g, 0, A.a0, A.a1); g.stroke();
  // 4区間：交互に明るさを変えた溝（本家の灰色の4つの区切り）
  g.lineCap = 'butt';
  DKT_ZONES.forEach(function(z, zi){
    g.lineWidth = 30; g.strokeStyle = (zi % 2) ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.12)';
    dktArcPath(g, 0, dktCellA(z[0]) + 0.004, dktCellA(z[1] + 1) - 0.004); g.stroke();
  });
  // 1目ごとの細い目盛り（区間の境目は毎フレームの金の目盛りで描く）
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1.5;
  for(s = 1; s < 11; s++){
    if(s === 2 || s === 5 || s === 8) continue;
    var ad = A.a0 + span * s / 11, ca = Math.cos(ad), sa = Math.sin(ad);
    g.beginPath();
    g.moveTo(A.cx + ca * (A.rx - 12), A.cy + sa * (A.ry - 12));
    g.lineTo(A.cx + ca * (A.rx + 12), A.cy + sa * (A.ry + 12));
    g.stroke();
  }
  // 端の 2 と 12
  g.font = '20px ' + DKT_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 4; g.strokeStyle = 'rgba(40,24,4,.9)'; g.fillStyle = '#FFE9B0';
  var ex0 = A.cx + Math.cos(A.a0) * (A.rx - 36), ey0 = A.cy + Math.sin(A.a0) * (A.ry - 36);
  var ex1 = A.cx + Math.cos(A.a1) * (A.rx - 36), ey1 = A.cy + Math.sin(A.a1) * (A.ry - 36);
  g.strokeText('2', ex0, ey0); g.fillText('2', ex0, ey0);
  g.strokeText('12', ex1, ey1); g.fillText('12', ex1, ey1);
  DKT_G.base = { w:c.width, h:c.height, c:c };
  return c;
}
/* ══════════ ゲージを描く（毎フレーム。作り置きの上に、区間の明かり・塗り・区切り・先端だけ） ══════════ */
function drawGauge(T){
  if(typeof gcv === 'undefined' || !gcv || !gctx) return;
  var I = DKT_G.inp, on = !!gaugeOn && !!G;
  dktWatch(on && !I);
  var g = gctx;
  if(!on){
    if(DKT_G.drawn){ g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, gcv.width, gcv.height); DKT_G.drawn = false; }
    return;
  }
  DKT_G.drawn = true;
  if(typeof DKFX === 'object' && DKFX && DKFX.mob) dktGaugeFit();
  var now = performance.now(), k = gcv.width / DKT_GW, A = DKT_ARC;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, gcv.width, gcv.height);
  g.drawImage(dktGaugeBase(k), 0, 0);
  g.setTransform(k, 0, 0, k, 0, 0);
  var u = I ? dktU(I, now) : dktTri(now / 1800);
  var force = I ? I.force : null, v = dktValOfU(u);
  var holding = !!(I && I.hold && now - I.hold >= DKT_HOLD_MIN);
  var stop = !!(I && I.stopU !== undefined);
  if(holding && I && !I.chg){ try{ I.chg = SFX.gaugeCharge() || null; }catch(err){ I.chg = null; } }
  if(I && I.chg && I.chg.level){ try{ I.chg.level(u); }catch(err){} }
  var span = A.a1 - A.a0, au = A.a0 + span * u, s;
  g.lineCap = 'butt';
  // 奇偶モードで合わない目は暗く
  if(force){
    g.lineWidth = 30; g.strokeStyle = 'rgba(0,0,0,.5)';
    for(s = 2; s <= 12; s++) if(!dktParOk(s, force)){ dktArcPath(g, 0, dktCellA(s) + 0.004, dktCellA(s + 1) - 0.004); g.stroke(); }
  }
  // 当たったら出る範囲（止めている区間。精度はその1目）を明るく
  if(I && !(stop && I.hit === false)){
    var zr = I.prec ? [v, v] : DKT_ZONES[dktZoneOf(v)];
    g.lineWidth = 30; g.strokeStyle = (stop && I.hit) ? 'rgba(255,214,90,.5)' : 'rgba(255,255,255,.2)';
    dktArcPath(g, 0, dktCellA(zr[0]) + 0.004, dktCellA(zr[1] + 1) - 0.004); g.stroke();
  }
  // 塗り（ピンク／当たりは金／外れは灰）
  var fill;
  if(stop && I.hit === false) fill = '#8F98A8';
  else {
    fill = g.createLinearGradient(A.cx - A.rx, 0, A.cx + A.rx, 0);
    if(stop && I.hit){ fill.addColorStop(0, '#FFF3B0'); fill.addColorStop(1, '#F2B01E'); }
    else { fill.addColorStop(0, '#FFB8E2'); fill.addColorStop(0.5, '#FF5CB0'); fill.addColorStop(1, '#E0137A'); }
  }
  g.lineCap = 'round';
  if(u > 0.004){
    g.save();
    g.shadowColor = (stop && I.hit) ? 'rgba(255,210,80,.95)' : 'rgba(255,80,170,.85)';
    g.shadowBlur = holding ? 22 : 12;
    g.lineWidth = 24; g.strokeStyle = fill; dktArcPath(g, 0, A.a0, au); g.stroke();
    g.restore();
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.55)';
    dktArcPath(g, -7, A.a0 + 0.02, Math.max(A.a0 + 0.02, au - 0.02)); g.stroke();
  }
  // 区間の境目（金の太い目盛り。塗りの上に出す）
  g.lineCap = 'round';
  [4, 7, 10].forEach(function(bv){
    var ad = dktCellA(bv), ca = Math.cos(ad), sa = Math.sin(ad);
    g.beginPath();
    g.moveTo(A.cx + ca * (A.rx - 20), A.cy + sa * (A.ry - 20));
    g.lineTo(A.cx + ca * (A.rx + 20), A.cy + sa * (A.ry + 20));
    g.lineWidth = 7; g.strokeStyle = 'rgba(40,24,4,.9)'; g.stroke();
    g.lineWidth = 3.5; g.strokeStyle = '#FFE08A'; g.stroke();
  });
  // 先端＝値の金貨（後ろに光、長押し中は大きな光と回る星）
  var hx = A.cx + Math.cos(au) * A.rx, hy = A.cy + Math.sin(au) * A.ry, R = holding ? 50 : 40;
  var rg = g.createRadialGradient(hx, hy, 8, hx, hy, R);
  if(stop && I.hit){ rg.addColorStop(0, 'rgba(255,248,200,1)'); rg.addColorStop(0.45, 'rgba(255,214,90,.75)'); rg.addColorStop(1, 'rgba(255,200,60,0)'); }
  else { rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.42, 'rgba(255,190,228,.8)'); rg.addColorStop(1, 'rgba(255,120,200,0)'); }
  g.fillStyle = rg; g.beginPath(); g.arc(hx, hy, R, 0, 6.2832); g.fill();
  if(holding && !(typeof DKFX === 'object' && DKFX.reduced)){
    g.save(); g.translate(hx, hy); g.rotate(now * 0.012); g.fillStyle = 'rgba(255,250,220,.95)';
    for(var q = 0; q < 4; q++){ g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -46); g.lineTo(4, -22); g.lineTo(-4, -22); g.closePath(); g.fill(); }
    g.restore();
  }
  g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.arc(hx, hy + 3, 25, 0, 6.2832); g.fill();
  var cg = g.createRadialGradient(hx - 7, hy - 9, 2, hx, hy, 25);
  cg.addColorStop(0, '#FFFBE0'); cg.addColorStop(0.45, '#FFE27A'); cg.addColorStop(0.8, '#F2B01E'); cg.addColorStop(1, '#B87F12');
  g.fillStyle = cg; g.beginPath(); g.arc(hx, hy, 24, 0, 6.2832); g.fill();
  g.lineWidth = 2.5; g.strokeStyle = '#7A4A06'; g.stroke();
  g.fillStyle = (force && !dktParOk(v, force)) ? '#9A7A50' : '#4A2604';
  g.font = (v >= 10 ? '24px ' : '29px ') + DKT_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(v), hx, hy + 2);
}

/* ══════════ 盤の上の目印（毎フレーム・盤の座標） ══════════
   ・マス選び中：選べないマスを暗く、選べるマスを光らせる
   ・サイコロの前：1〜12 の金の札。奇偶モードは合うマスが黄色く光り、止めている区間のマスが白く光る
   ・無人島の人の手番：残りターンの吹き出し */
function drawSteps(ctx, G){
  if(DKT_G.pick) dktDrawPick(ctx, G);
  dktJailTip(ctx, G);
  if(!stepPreview) return;
  var sp = stepPreview, I = DKT_G.inp, now = performance.now();
  var force = I ? I.force : (sp.parity || null);
  var v = I ? dktValOfU(dktU(I, now)) : 0, zr = v ? (I.prec ? [v, v] : DKT_ZONES[dktZoneOf(v)]) : null;
  var pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
  var d, i, r, par, ok;
  for(d = 2; d <= sp.max; d++){
    i = (sp.from + d) % 32; par = (d % 2 === 0) ? 'even' : 'odd'; ok = !force || force === par;
    if(force && ok) dktTileFill(ctx, i, 'rgba(255,232,96,' + (0.28 + 0.24 * pulse).toFixed(3) + ')', 'rgba(255,246,190,.85)');
    if(zr && ok && d >= zr[0] && d <= zr[1])
      dktTileFill(ctx, i, 'rgba(255,255,255,' + (d === v ? 0.42 : 0.18) + ')', d === v ? '#FFFFFF' : null);
  }
  for(d = 1; d <= sp.max; d++){
    i = (sp.from + d) % 32; r = RECTS[i];
    par = (d % 2 === 0) ? 'even' : 'odd'; ok = d >= 2 && (!force || force === par);
    var ax = r.p + r.w / 2, ay = r.q + r.h / 2;
    if(r.side === 0) ay = r.q + r.h + 26; if(r.side === 2) ay = r.q - 26;
    if(r.side === 1) ax = r.p - 26;       if(r.side === 3) ax = r.p + r.w + 26;
    var o = proj(ax, ay);
    ctx.save();
    if(!ok) ctx.globalAlpha = 0.38;
    goldBadge(ctx, o.x, o.y, String(d), (d === v) ? 19 : 14);
    ctx.restore();
  }
}
function dktTileFill(ctx, i, fill, stroke){
  var q = tileQuad(i);
  ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y);
  for(var k = 1; k < 4; k++) ctx.lineTo(q[k].x, q[k].y);
  ctx.closePath();
  if(fill){ ctx.fillStyle = fill; ctx.fill(); }
  if(stroke){ ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function dktDrawPick(ctx, G){
  var P = DKT_G.pick, now = performance.now(), pulse = 0.5 + 0.5 * Math.sin(now * 0.007);
  var many = P.ok.length >= 16;          // ほぼ全部選べる時（旅行）は、塗りを薄くして縁を光らせる
  var fa = many ? (0.05 + 0.1 * pulse) : (0.14 + 0.22 * pulse);
  for(var i = 0; i < 32; i++){
    if(!P.okSet[i]) dktTileFill(ctx, i, 'rgba(10,8,24,.55)', null);
    else if(i === P.hover) dktTileFill(ctx, i, 'rgba(255,240,150,.55)', '#FFFFFF');
    else dktTileFill(ctx, i, 'rgba(255,214,90,' + fa.toFixed(3) + ')',
                     'rgba(255,226,120,' + (0.5 + 0.45 * pulse).toFixed(3) + ')');
  }
}
/* 無人島の吹き出し「N サイコロダブルが 出ると脱出 ターン残っています」（J14。絵は作り置き） */
function dktJailTip(ctx, G){
  if(!G || G.over) return;
  var p = G.players[G.turn];
  if(!p || p.out || !(p.jail > 0) || p.pos !== 8) return;
  var c = tileCenter(8);
  ctx.drawImage(dktTipImg(p.jail | 0), c.x - 136, c.y - 196, 272, 96);
}
function dktTipImg(n){
  var T = DKT_G.tip;
  if(T && T.n === n) return T.c;
  var S = 2, W = 272, H = 96, c = (T && T.c) || document.createElement('canvas');
  c.width = W * S; c.height = H * S;
  var g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  g.setTransform(S, 0, 0, S, 0, 0);
  var rr = function(x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = 'rgba(0,0,0,.35)'; rr(4, 6, W - 8, H - 22, 14); g.fill();
  var bg = g.createLinearGradient(0, 0, 0, H - 20);
  bg.addColorStop(0, 'rgba(30,48,86,.96)'); bg.addColorStop(1, 'rgba(12,20,40,.96)');
  g.fillStyle = bg; rr(2, 2, W - 8, H - 22, 14); g.fill();
  g.lineWidth = 2.5; g.strokeStyle = '#9FC8F2'; g.stroke();
  g.beginPath(); g.moveTo(W / 2 - 14, H - 21); g.lineTo(W / 2, H - 4); g.lineTo(W / 2 + 12, H - 21); g.closePath();
  g.fillStyle = 'rgba(12,20,40,.96)'; g.fill(); g.stroke();
  g.fillStyle = 'rgba(12,20,40,.96)'; g.fillRect(W / 2 - 13, H - 24, 24, 4);
  g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = '50px ' + DKT_FONT; g.lineWidth = 6; g.strokeStyle = '#0B1A33'; g.fillStyle = '#FFE27A';
  g.strokeText(String(n), 40, 40); g.fillText(String(n), 40, 40);
  g.textAlign = 'left'; g.font = '900 17px "Noto Sans JP",sans-serif'; g.fillStyle = '#EAF4FF';
  g.fillText('サイコロダブルが', 74, 22); g.fillText('出ると脱出', 74, 42); g.fillText('ターン残っています', 74, 62);
  DKT_G.tip = { n:n, c:c };
  return c;
}

/* ══════════ マスを選ぶ ══════════ */
function dktInQuad(q, x, y){
  var inside = false;
  for(var a = 0, b = q.length - 1; a < q.length; b = a++){
    if(((q[a].y > y) !== (q[b].y > y)) && (x < (q[b].x - q[a].x) * (y - q[a].y) / ((q[b].y - q[a].y) || 1e-9) + q[a].x)) inside = !inside;
  }
  return inside;
}
function dktTileAt(ev){
  var c = document.getElementById('world'); if(!c) return -1;
  var sx = (ev.offsetX / (c.clientWidth || SW)) * SW, sy = (ev.offsetY / (c.clientHeight || SH)) * SH;
  var wx = (sx - SW / 2) / cam.z + cam.x, wy = (sy - SH / 2) / cam.z + cam.y;
  for(var i = 0; i < 32; i++) if(dktInQuad(tileQuad(i), wx, wy)) return i;
  var best = -1, bd = 1e9;
  for(i = 0; i < 32; i++){ var t = tileCenter(i), d = (t.x - wx) * (t.x - wx) + (t.y - wy) * (t.y - wy); if(d < bd){ bd = d; best = i; } }
  return (bd <= 92 * 92) ? best : -1;
}
function dktFestName(){ return dktCorner(2).replace(/開催$/, ''); }
/* 祭りの角の呼び名（J25・J18。氷の洞窟は「水晶の祝福」。商標に触れる語は使わない） */
function dktFest(){
  var ice = !!(G && G.map && G.map.id === 'ice'), nm = ice ? '水晶の祝福' : dktFestName();
  return { name:nm, msg:ice ? '水晶に祝福される都市を選択してください' : '開催する都市を選択してください' };
}
/* 次の pickTile に付ける題名（同じ手番の中だけ有効） */
function dktSetPick(tag, note){ DKT_G.pickOpt = { tag:tag, note:note || null, at:(G ? (G.turnSerial | 0) : 0) }; }
function dktTakePickOpt(msg){
  var o = DKT_G.pickOpt; DKT_G.pickOpt = null;
  if(o && G && o.at === (G.turnSerial | 0)) return o;
  var m = String(msg || ''), tag = 'エリアを選ぶ';
  if(/凍らせ|凍結/.test(m)) tag = '凍結';
  else if(/ワープ|移動/.test(m)) tag = '移動する';
  else if(/ただで建て|建設/.test(m)) tag = '建設';
  else if(/開催|祝福/.test(m)) tag = dktFest().name;
  else if(/売らせ|売却/.test(m)) tag = '強制売却';
  else if(/停電/.test(m)) tag = '停電';
  else if(/渡す|もらう|交換/.test(m)) tag = '都市交換';
  else if(/行き先|希望する都市/.test(m)) tag = dktCorner(3) + 'へ移動';
  return { tag:tag, note:null };
}
/* 時間切れ・自動の時に選ぶマス */
function dktBestTile(pi, ok){
  if(!ok || !ok.length) return -1;
  if(ok.length >= 20){ var a = aiPickTravel(pi); if(ok.indexOf(a) >= 0) return a; }
  var best = ok[0], bs = -1e18;
  ok.forEach(function(i){
    var t = G.tiles[i], s = 0;
    if(t && t.type === 'city') s = (t.owner >= 0 ? tollOf(t, G) : 0) + cityValue(t) * 0.1;
    if(s > bs){ bs = s; best = i; }
  });
  return best;
}
function pickTile(pi, msg, filter){ return dktPick(pi, msg, filter); }
/* dvAsk の中から選ぶ時はこちら（オンラインは pickTile が dvAsk で包まれているので、包む前の pickTile＝DV_OL.orig を使い、包みを重ねない） */
function dktPickLocal(pi, msg, filter){
  if(!dktOnline()) return pickTile(pi, msg, filter);
  var O = window.DV_OL;
  return (O.orig && typeof O.orig.pickTile === 'function') ? O.orig.pickTile(pi, msg, filter) : dktPick(pi, msg, filter);
}
function dktPick(pi, msg, filter){
  if(DKT_G.pick) dktPickEnd(-1);
  return new Promise(function(res){
    if(!G){ res(-1); return; }
    var ok = [], okSet = {}, i;
    for(i = 0; i < 32; i++){
      var y = false;
      try{ y = !filter || !!filter(i); }catch(e){ y = false; }
      if(y){ ok.push(i); okSet[i] = 1; }
    }
    if(!ok.length){ res(-1); return; }
    if(dktCpuish(pi)){ DKT_G.pickOpt = null; res(dktBestTile(pi, ok)); return; }    // 自動プレイの人は即決（G12）
    var opt = dktTakePickOpt(msg), tm = dktTimerOn() && dktLocal(pi);
    camReset();
    var P = DKT_G.pick = { pi:pi, ok:ok, okSet:okSet, hover:-1, t0:performance.now(), g:G, tm:tm,
      dur:(tm ? DKT_TURN_MS : Math.max(400, DKT_PICK_MS * SPEED)), res:res, msg:msg, opt:opt, done:false, seq:++DKT_G.pseq };
    dktPickPanel(P);
    var c = document.getElementById('world');
    P.onDown = function(ev){
      var t = dktTileAt(ev);
      if(t < 0) return;
      if(!okSet[t]){ dktPickBad(P); return; }
      try{ SFX.click(); }catch(e){}
      dktPickEnd(t);
    };
    P.onMove = function(ev){
      var t = dktTileAt(ev), h = (t >= 0 && okSet[t]) ? t : -1;
      if(h !== P.hover){ P.hover = h; destPin = (h >= 0) ? h : null; if(c) c.style.cursor = (h >= 0) ? 'pointer' : ''; }
    };
    if(c){ c.addEventListener('pointerdown', P.onDown); c.addEventListener('pointermove', P.onMove); }
    P.timer = setTimeout(function(){ dktPickTimeout(P); }, P.dur);
    P.tick = setInterval(function(){
      if(!G || G.over || G !== P.g){ dktPickEnd(-1); return; }   // 試合が終わった・新しい試合になった
      dktPickSec(P);
    }, 250);
    var st = document.getElementById('stage'); if(st) st.classList.add('dkt-picking');
  });
}
function dktPickEnd(v){
  var P = DKT_G.pick; if(!P || P.done) return;
  P.done = true; DKT_G.pick = null;
  clearTimeout(P.timer); clearInterval(P.tick);
  var c = document.getElementById('world');
  if(c){ c.removeEventListener('pointerdown', P.onDown); c.removeEventListener('pointermove', P.onMove); c.style.cursor = ''; }
  destPin = null;
  var st = document.getElementById('stage'); if(st) st.classList.remove('dkt-picking');
  dktPickClose(P);
  if(v >= 0 && G){ var tc = tileCenter(v); try{ addFx('ring', tc.x, tc.y, 600, '#FFE08A'); }catch(e){} }
  P.res(v);
}
function dktPickTimeout(P){
  if(P.done || !G) return;
  if(P.tm){ dkSetAuto(P.pi, true, 'timeout'); if(P.done) return; }       // 持ち時間のルール：自動に切り替えて最善のマス
  var b = dktBestTile(P.pi, P.ok);
  dkNotify(P.pi, '⏱', '時間切れ', ((G.tiles[b] && G.tiles[b].name) || 'エリア') + ' を選びました', { ms:1800 });
  dktPickEnd(b);
}
function dktPickSec(P){
  if(!P.el) return;
  var s = P.el.querySelector('.dkt-pk-sec b');
  var left = Math.max(0, Math.ceil((P.dur - (performance.now() - P.t0)) / 1000));
  if(s && s.textContent !== String(left)){ s.textContent = left; P.el.classList.toggle('dkt-late', left <= 5); }
}
function dktPickBad(P){
  try{ SFX.warn(); }catch(e){}
  if(!P.el) return;
  var n = P.el.querySelector('.dkt-pk-note');
  if(n){ n.textContent = 'そのエリアは選べません。光っているエリアを選択してください'; }
  P.el.classList.add('dkt-bad'); fxShake(P.el, 280);
  clearTimeout(P.badT);
  P.badT = setTimeout(function(){
    if(P.done || !P.el) return;
    P.el.classList.remove('dkt-bad');
    if(n) n.textContent = (P.opt && P.opt.note) || '光っているエリアをタッチしてください';
  }, 1600);
}
function dktPickPanel(P){
  var st = document.getElementById('stage'); if(!st) return;
  var el = st.querySelector(':scope > .dkt-pick');
  if(!el){ el = document.createElement('div'); el.className = 'dkt-pick'; st.appendChild(el); }
  el.classList.remove('dkt-out', 'dkt-bad', 'dkt-late');
  el.dataset.seq = P.seq;
  el.innerHTML = '<div class="dkt-pk-tag"><b>' + esc(P.opt.tag) + '</b></div>'
    + '<div class="dkt-pk-msg">' + esc(P.msg || 'エリアを選択してください') + '</div>'
    + '<div class="dkt-pk-note">' + esc(P.opt.note || '光っているエリアをタッチしてください') + '</div>'
    + '<div class="dkt-pk-foot">'
    +   '<div class="dkt-pk-bar"><i style="animation-duration:' + Math.round(P.dur) + 'ms"></i></div>'
    +   '<span class="dkt-pk-sec">のこり <b>' + Math.ceil(P.dur / 1000) + '</b> 秒</span>'
    +   '<button type="button" class="dkt-pk-x">キャンセル</button>'
    + '</div>';
  el.querySelector('.dkt-pk-x').onclick = function(){ try{ SFX.click(); }catch(e){} dktPickEnd(-1); };
  P.el = el;
  el.classList.add('dkt-on');
  if(el.animate && !(typeof DKFX === 'object' && DKFX && DKFX.reduced)){
    try{ el.animate([{ transform:'translateY(14px) scale(.88)' }, { transform:'translateY(-2px) scale(1.03)', offset:0.6 }, { transform:'none' }],
                    { duration:380, easing:'cubic-bezier(.34,1.56,.64,1)' }); }catch(e){ console.error('[WP13a]', e); }
  }
}
function dktPickClose(P){
  var el = P.el; if(!el) return;
  clearTimeout(P.badT);
  el.classList.add('dkt-out');
  setTimeout(function(){
    if(el.dataset.seq === String(P.seq)){ el.classList.remove('dkt-on', 'dkt-out'); el.innerHTML = ''; }
  }, Math.max(20, 180 * Math.min(1, SPEED)));
}

/* ══════════ 無人島（J14） ══════════ */
function dktJailFee(p){ return Math.round(dkRate('bail') * statMul(p, 'special', 0.4)); }
function dktCpuJail(p, fee){
  if(p.fcard === 'escape') return 'card';
  if(p.cash >= fee * 3) return 'pay';
  return 'dbl';
}
function dktJailUI(pi, fee){
  var p = G.players[pi], nm = dktCorner(1), cut = Math.max(0, dkRate('bail') - fee), canPay = p.cash >= fee;
  var h = '<div class="modal dkt-mod dkt-jail">' + dktRingHTML(pi)
    + '<div class="dkt-rib"><b>' + esc(nm) + 'を脱出</b></div>'
    + '<div class="dkt-rows">'
    +   '<button type="button" class="dkt-row" data-act="dbl"><span class="dkt-rico">' + dktSvg('dice') + '<em>サイコロダブル</em></span>'
    +     '<span class="dkt-rtx"><b>サイコロダブルを出す</b></span></button>'
    +   (canPay ? '<button type="button" class="dkt-row dkt-gold" data-act="pay">' : '<div class="dkt-row dkt-off">')
    +     '<span class="dkt-rico">' + dktSvg('coin') + '<em>マーブル</em></span>'
    +     '<span class="dkt-rtx"><b>脱出費用を支払う</b><span class="dkt-fee2"><strong>' + yen(fee) + '</strong>'
    +       (cut > 0 ? '<small>特殊費用割引 <i>' + yen(cut) + '</i></small>' : '') + '</span>'
    +       (canPay ? '' : '<small class="dkt-short">マーブルが足りません</small>') + '</span>'
    +   (canPay ? '</button>' : '</div>')
    +   (p.fcard === 'escape'
          ? '<button type="button" class="dkt-row dkt-blue" data-act="card"><span class="dkt-rico">' + dktSvg('ticket') + '<em>脱出カード</em></span>'
          + '<span class="dkt-rtx"><b>' + esc(nm) + '脱出カード使用</b><small>(フォーチュンカードを所持している場合のみ)</small></span></button>'
          : '')
    + '</div>'
    + '<p class="dkt-foot">脱出方法を選択してください</p>'
    + '</div>';
  return modal(h);
}
/* Aクラスの能力値「孤立地域脱出成功」（p.stats.escape）で、サイコロダブルの確率を上げる */
function dktEscapeBoost(pi){
  var p = G.players[pi];
  if(!p.stats || typeof p.stats.escape !== 'number' || p.forceDouble > 0) return;
  if(Math.random() < statRate(p, 'escape') * 0.3) p.forceDouble = (p.forceDouble | 0) + 1;
}
async function jailTurn(pi){
  var p = G.players[pi];
  var jc = tileCenter(8);
  dktFocus(jc.x, jc.y, 1.3);
  var fee = dktJailFee(p);
  G.phase = 'jail';
  await wait(700);                             // 残りターンの吹き出し（drawSteps）を見せる
  var how = await dktAsk(pi, 'jail', function(){
    return dktCpuish(pi) ? dktCpuJail(p, fee) : dktJailUI(pi, fee);
  }, '脱出方法選択中', { def:'dbl' });
  if(how === 'card' && p.fcard !== 'escape') how = 'dbl';
  if(how === 'pay' && p.cash < fee) how = 'dbl';
  if(how !== 'card' && how !== 'pay') how = 'dbl';
  camReset();                                  // サイコロは盤の中央に落ちるので、寄ったままだと見えない
  if(how === 'card' || how === 'pay'){
    if(how === 'card') p.fcard = null;
    else give(pi, -fee);
    p.jail = 0; p.dblRun = 0;
    SFX.good();
    await band(how === 'card' ? dktCorner(1) + '脱出カードを使いました' : '脱出費用 ' + yen(fee) + ' を支払いました',
               'ゲージなしでサイコロを振って出発します', 1200);
    await dvQueueDice(pi, null, false, 0);
    var r0 = await doRoll(pi, null, false);
    if(G.over) return;
    await moveSteps(pi, r0.total); await resolve(pi);
    return;
  }
  dktEscapeBoost(pi);
  await dvQueueDice(pi, null, false, 0);
  var r = await doRoll(pi, null, false);
  if(G.over) return;
  if(r.isDbl){
    p.jail = 0; p.dblRun = 0;
    await band('脱出成功！', 'サイコロダブルが出たので、そのまま進みます', 1300);
    await moveSteps(pi, r.total); await resolve(pi);
    return;
  }
  p.jail--;
  if(p.jail <= 0) dkNotify(pi, '🔓', '次のターンから動けます', '', { ms:1700 });
  camReset();
}

/* ══════════ 世界旅行（着いた次の手番に使う・J24・J18） ══════════
   → 'done'（旅行した）／'roll'（旅行費用が無い・やめた＝普通に振る） */
function dktTravelCost(p){ return Math.round(dkRate('travel') * statMul(p, 'special', 0.4)); }
async function dkTravelTurn(pi){
  var p = G.players[pi];
  p.travel = false;
  var free = !!p.travelFree, base = dkRate('travel'), cost = free ? 0 : dktTravelCost(p), nm = dktCorner(3);
  var tc = tileCenter(24);
  dktFocus(tc.x, tc.y, 1.3);
  G.phase = 'travel';
  if(p.cash < cost){
    await band('旅行費用 ' + yen(cost) + ' が足りません', 'このターンはサイコロを振ります', 1300);
    camReset();
    return 'roll';
  }
  var ok = function(i){ return i !== 24; };          // 世界旅行のマス自身は選べない
  var dest = -1;
  if(dktCpuish(pi)){
    if(!p.autoWeak){                                  // 時間切れの自動（よわい）は旅行しない
      dkBusyTag(pi, '移動エリア選択中');
      await wait(DKT_THINK_MS);
      dkBusyTag(pi, null);
      dest = aiPickTravel(pi);
      if(!(dest >= 0) || !ok(dest) || dest === 8){
        var all = []; for(var i = 0; i < 32; i++) if(ok(i) && i !== 8) all.push(i);
        dest = dktBestTile(pi, all);
      }
    }
  } else {
    dktSetPick(nm + 'へ移動', free ? '旅行費用 無料（旅行招待券）'
      : '旅行費用 ' + yen(cost) + (base > cost ? '（特殊費用割引 ' + yen(base - cost) + '）' : ''));
    if(!dktLocal(pi)) dkBusyTag(pi, '移動エリア選択中');
    dest = await pickTile(pi, '希望する都市を選択してください', ok);
    dkBusyTag(pi, null);
  }
  if(!(dest >= 0) || !ok(dest)){
    await band('旅行をやめました', 'このターンはサイコロを振ります', 1100);
    camReset();
    return 'roll';
  }
  if(cost > 0) give(pi, -cost);
  if(free){ if(typeof p.travelFree === 'number') p.travelFree = Math.max(0, p.travelFree - 1); else p.travelFree = false; }
  news(p.name + ' が ' + nm + ' から ' + G.tiles[dest].name + ' へ旅立ちました');
  await jumpTo(pi, dest, { salary:true });
  await resolve(pi);
  return 'done';
}

/* ══════════ ワープ（C31）：jumpTo(pi, idx, {salary}) ══════════
   opt を渡した時だけ、スタートをまたいだら laps+1、salary ならその時に給料（スタートぴったり＝idx 0 は resolveInner が払う）。
   opt なし（昔の呼び方）は周回も給料も触らない（呼んだ側が laps++・salary する） */
async function jumpTo(pi, idx, opt){
  var p = G.players[pi];
  idx = (((idx | 0) % 32) + 32) % 32;
  var from0 = p.pos, from = tileCenter(from0);
  var cross = !!(opt && typeof opt === 'object') && idx !== from0 && (idx < from0 || idx === 0);
  p.pos = idx;
  var to = tileCenter(idx);
  camTo(to.x, to.y, 1.45);
  addFx('ring', from.x, from.y, 600, '#B58CFF');
  await hop(p, from, to, 540);
  addFx('land', to.x, to.y, 320);
  if(cross){
    p.laps = (p.laps | 0) + 1;
    if(opt.salary && idx !== 0) salary(pi);
  }
}

/* ══════════ 国税庁・観光地の訪問 ══════════ */
function dktTaxOf(pi){
  var sum = 0;
  G.tiles.forEach(function(t){ if(t.type === 'city' && t.owner === pi) sum += cityValue(t); });
  return Math.round(sum * 0.10 * statMul(G.players[pi], 'special', 0.4));
}
function dktVisit(t){ if(t && t.tour === 'pink'){ t.visits = (t.visits | 0) + 1; boardChanged(); } }

/* ══════════ キャラの能力（J33・C04）：決まった時機に確率で自動発動 ══════════
   発動は dkSkillRoll（WP12）が判定する。効果は r.apply()（あれば）を待つ。'arrive' の「奪う」は相手の所持の15% */
function dktSkillShow(pi, r){
  var p = G.players[pi], c = (typeof cardById === 'function' && cardById(p.card)) || null;
  var nm = (c && c.nm) || p.name;
  if(r.fired) dkNotify(pi, '✨', nm + 'のスペシャル能力', r.label || '発動！', { ms:1900 });
  else if(dktLocal(pi)) dkNotify(pi, '💫', 'スキル未発動', '2%成長します', { ms:1500 });
}
function dktSkillRoll(pi, when, info){
  var r = null;
  try{ r = dkSkillRoll(pi, when, info || {}); }catch(e){ console.error('[WP13a] dkSkillRoll', e); r = null; }
  if(!r || !r.kind) return null;
  dktSkillShow(pi, r);
  return r;
}
/* 手番の最初（'start'） */
async function dktTurnSkill(pi){
  var r = dktSkillRoll(pi, 'start', {});
  if(r && r.fired && typeof r.apply === 'function') await r.apply();
}
/* 相手のいるマスに着いた時（'arrive'） */
async function dktArrive(pi){
  var p = G.players[pi], foes = [];
  G.players.forEach(function(q, j){ if(j !== pi && !q.out && q.pos === p.pos && !dkAlly(pi, j)) foes.push(j); });
  if(!foes.length) return;
  var r = dktSkillRoll(pi, 'arrive', { tile:p.pos, foes:foes });
  if(!r || !r.fired) return;
  if(typeof r.apply === 'function'){ await r.apply(); return; }
  var got = 0;
  foes.forEach(function(j){ var v = Math.round(Math.max(0, G.players[j].cash) * 0.15); if(v > 0){ give(j, -v); got += v; } });
  if(got > 0) give(pi, got);
}

/* ══════════ マスの解決 ══════════ */
async function resolveInner(pi){
  var p = G.players[pi], i = p.pos, t = G.tiles[i];
  var c = tileCenter(i);
  dktFocus(c.x, c.y, 1.55);
  await wait(160);
  // C09 マップの仕掛け：0 続ける／1 済んだ／2 駒が動いた（resolve で呼び直す。resolve が深さ3で止める）
  if(typeof dkMapResolve === 'function'){
    var mr = 0;
    try{ mr = await dkMapResolve(pi, t, resolveDepth); }catch(e){ console.error('[WP13a] dkMapResolve', e); mr = 0; }
    if(!G || G.over || p.out) return;
    if(mr === 2){ await resolve(pi); return; }
    if(mr === 1){ if(checkWin()) return; camReset(); return; }
    i = p.pos; t = G.tiles[i];
  }
  await dktArrive(pi);
  if(G.over || p.out) return;

  if(t.type === 'start'){
    // J06・J37：ぴったり止まったら給料 → 自分の都市を1つ選んで建設ポップアップ（C19：ぴったりの給料はここで払う）
    salary(pi);
    var can0 = function(z){ var tz = G.tiles[z]; return tz && tz.type === 'city' && tz.owner === pi && !tz.landmark && !tz.tour; };
    var mine0 = [];
    for(var z = 0; z < 32; z++) if(can0(z)) mine0.push(z);
    if(mine0.length){
      await wait(300);
      var d0 = await dktAsk(pi, 'start', function(){
        if(dktCpuish(pi)) return mine0.reduce(function(a, b){ return tollOf(G.tiles[b], G) > tollOf(G.tiles[a], G) ? b : a; });
        dktSetPick('スタート建設ボーナス', '所有しているエリアの中から選択したエリアに建設することができます');
        return dktPickLocal(pi, '建設するエリアを選択してください', can0);
      }, '建設エリア選択中');
      d0 = (typeof d0 === 'number') ? d0 : -1;
      if(d0 >= 0 && can0(d0) && !G.over){
        if(dktCpuish(pi)) await aiBuy(pi, d0); else await buyUI(pi, d0);
      }
    }
  }
  else if(t.type === 'jail'){
    p.jail = 3; p.dblRun = 0; p.travel = false; SFX.bad(); camShake(10);
    await band(dktCorner(1) + 'に閉じ込められました!', '3ターンの間、移動できません', 1800);
  }
  else if(t.type === 'olympic' || t.type === 'fest'){
    await dktFestival(pi);
  }
  else if(t.type === 'travel'){
    // 黄金フリーパス：その場で最適なマスへ跳ぶ（ペンダントの効果）
    if(await pendFire(pi, 'onTravel', { pick:true }) === 'jumped'){ await resolve(pi); return; }
    p.travel = true;
    await band(dktCorner(3) + 'に到着', '次のターンに利用することができます', 1500);
  }
  else if(t.type === 'minigame' || t.type === 'bonus'){
    await miniGame(pi);
  }
  else if(t.type === 'tax'){
    var amt = dktTaxOf(pi);
    if(amt > 0){
      if(!(await dkPayFrom(pi, amt, -1))){ await bankrupt(pi, -1); return; }
      give(pi, -amt);
      dkNotify(pi, '🧾', t.name, '所有地の建設費用の10%　' + yen(amt) + ' を納めました', { ms:1900 });
    } else dkNotify(pi, '🧾', t.name, '土地を持っていないので、納める税はありません', { ms:1700 });
  }
  else if(t.type === 'card'){ await chanceCard(pi); }
  else if(t.type === 'city'){
    // 幸運のトランポリン：自分の都市に止まったとき同じ辺の別の都市へ跳ぶ
    if(t.owner === pi && (await pendFire(pi, 'onOwnLand')) === 'jumped'){ dktVisit(t); await resolve(pi); return; }
    var ally = t.owner >= 0 && t.owner !== pi && dkAlly(pi, t.owner);
    if(t.owner < 0 || t.owner === pi || ally){           // 味方の都市も建設ポップアップ（C03）
      if(dktCpuish(pi)) await aiBuy(pi, i); else await buyUI(pi, i);
    } else {
      await payToll(pi, i);
      if(G.over || G.players[pi].out){ dktVisit(t); return; }
      if(t.landmark) await pendFire(t.owner, 'onTollGet', { tile:i });
      await maybeBuyout(pi, i);
    }
    dktVisit(t);                      // ピンクの観光地は、止まるたびに通行料が上がる
  }
  if(checkWin()) return;
  camReset();
}
/* 祭りの角（J25・G10）：開催都市は常に1つ。前の都市は ×1 に戻し、新しい都市は ×min(5, 1＋全体の開催回数) */
async function dktFestival(pi){
  var p = G.players[pi], F = dktFest();
  if(G.festN === undefined){ G.festN = 0; G.festTile = -1; }
  var can = function(z){ var tz = G.tiles[z]; return tz && tz.type === 'city' && tz.owner === pi && !tz.tour; };
  var mine = [];
  for(var z = 0; z < 32; z++) if(can(z)) mine.push(z);
  if(!mine.length){ await band(F.name, '開催できる都市がありません', 1400); return; }
  var base = dkRate('host'), cost = Math.round(base * statMul(p, 'special', 0.4));
  var fee = '開催費用 ' + yen(cost) + (base > cost ? '（特殊費用割引 ' + yen(base - cost) + '）' : '');
  if(p.cash < cost){ await band(F.name + 'を開催できません', fee + ' が足りません', 1500); return; }
  var d;
  if(dktCpuish(pi)){
    dkBusyTag(pi, '開催都市選択中');
    await wait(DKT_THINK_MS);
    dkBusyTag(pi, null);
    d = mine.reduce(function(a, b){ return tollOf(G.tiles[b], G) > tollOf(G.tiles[a], G) ? b : a; });
  } else {
    dktSetPick(F.name, fee + '。開催した都市の通行料が上がります（最大 ×5）');
    if(!dktLocal(pi)) dkBusyTag(pi, '開催都市選択中');
    d = await pickTile(pi, F.msg, can);
    dkBusyTag(pi, null);
  }
  if(!(d >= 0) || !can(d) || p.cash < cost) return;
  give(pi, -cost);
  var prev = G.festTile;
  G.festN = (G.festN | 0) + 1;
  if(prev >= 0 && prev !== d && G.tiles[prev]){
    G.tiles[prev].olym = 1;                                  // 前の開催都市は元に戻す（光の柱が消える）
    var pc = tileCenter(prev);
    addFx('ring', pc.x, pc.y, 700, '#9AA6BC');
    addFx('smoke', pc.x, pc.y + 4, 900);
  }
  var tz = G.tiles[d];
  tz.olym = Math.min(5, 1 + G.festN);
  G.festTile = d;
  boardChanged(); SFX.landmark(); camShake(10);
  addFx('pillar', tileCenter(d).x, tileCenter(d).y, 1000, '#FFD24D');
  raiseBanner('通行料 ×' + tz.olym + '！');
  dkNotify(pi, '🎪', F.name, tz.name + ' の通行料が ×' + tz.olym + ' になりました', { ms:2400 });
  news(p.name + ' が ' + tz.name + ' で' + F.name + '！ 通行料 ×' + tz.olym);
}

/* ══════════ ターン進行 ══════════ */
function dktInfl(){ return cfg.turns === 12; }              // 終盤インフレは短縮ルール（12ターン）だけ（J13）
async function turnLoop(){
  var g0 = G;
  if(!g0 || g0.dktLoop) return;              // 同じ試合でループが2本にならない（もう一回の二度押し）
  g0.dktLoop = true;
  g0.running = true;
  if(g0.festN === undefined){ g0.festN = 0; g0.festTile = -1; }
  // 前の試合の入力が残っていたら片付ける（途中でやめて始め直した時）
  try{
    if(DKT_G.pick && DKT_G.pick.g !== g0) dktPickEnd(-1);
    var pe = document.getElementById('pickeye'); if(pe) pe.classList.remove('on');
    if(DKT_G.inp && !DKT_G.inp.done){ DKT_G.inp.done = true; dktUnwire(DKT_G.inp); dktHideInput(); }
    if(DKT_G.ask && !DKT_G.ask.done){ DKT_G.ask.done = true; if(DKT_G.ask.clock) DKT_G.ask.clock.stop(); DKT_G.ask = null; }
  }catch(e){ console.error('[WP13a]', e); }
  try{
    while(G === g0 && !g0.over){
      var pi = G.turn, p = G.players[pi];
      if(p.out){ nextTurn(); if(G.turnsLeft <= 0){ timeUp(); break; } continue; }
      G.turnSerial = (G.turnSerial | 0) + 1;
      p.dktTurns = (p.dktTurns | 0) + 1;
      G.tiles.forEach(function(t){ if(t.frozen > 0) t.frozen--; });
      if(p.tollUp > 0) p.tollUp--;
      // 持ち込み品「サイコロダブル」（C07 p.carry.dbl）は最初の手番の出目で効く
      if(p.dktTurns === 1 && p.carry && p.carry.dbl && !(p.forceDouble > 0)) p.forceDouble = 1;
      updHUD();
      await turnBig(pi);
      if(G !== g0 || g0.over) break;
      await dktTurnSkill(pi);
      if(G !== g0 || g0.over) break;
      if(!p.out){
        if(p.jail > 0){
          p.travel = false;
          await jailTurn(pi);
        } else {
          var mode = 'roll';
          if(p.travel) mode = await dkTravelTurn(pi);
          if(mode === 'roll' && G === g0 && !g0.over && !p.out) await dktRollPhase(pi, g0);
        }
      }
      if(G !== g0 || g0.over) break;
      var before = G.turnsLeft;
      nextTurn();
      if(G.turnsLeft <= 0){ timeUp(); break; }
      if(dktInfl() && before !== G.turnsLeft && G.turnsLeft === INFL_FROM) bgm('tense');   // インフレ開始と同時に曲を切り替える
      await wait(240);
    }
  } finally {
    g0.dktLoop = false;
    if(G === g0) g0.running = false;
  }
}
/* サイコロ → 移動 → マス。ダブルはもう一回（3回続くと無人島） */
async function dktRollPhase(pi, g0){
  var p = G.players[pi];
  var again = true, guard = 0;
  while(again && G === g0 && !G.over && !p.out && guard++ < 4){
    again = false;
    G.phase = 'wait';
    updHUD();
    var r = await takeRoll(pi);
    if(G !== g0 || G.over || !r || r.cancelled || p.out) break;
    // 振る前に無人島へ入った／世界旅行マスに着いた → このターンは動かない
    if(p.jail > 0 || p.travel) break;
    G.phase = 'move';
    if(r.isDbl){
      p.dblRun++;
      if(p.dblRun >= 3){
        await band('連続ダブル3回！', dktCorner(1) + 'へ送られます', 1700);
        await jumpTo(pi, 8); p.jail = 3; p.dblRun = 0; p.travel = false; break;
      }
      await moveSteps(pi, r.total);
      await resolve(pi);
      if(G !== g0 || G.over || p.out) break;
      if(p.jail > 0 || p.travel) break;      // 無人島に入った／旅行は次のターン → ダブルでも終わり
      again = true;
    } else {
      p.dblRun = 0;
      await moveSteps(pi, r.total);
      await resolve(pi);
      if(p.out) break;
    }
    // SSカードの「追加でもう一回振れる」
    if(!again && G === g0 && !G.over && !p.out && p.jail <= 0 && !p.travel && p.extraRoll > 0){
      p.extraRoll--;
      dkNotify(pi, '🔮', '追加のサイコロ', 'もう一回サイコロを振れます', { ms:1700 });
      again = true;
    }
  }
}
/* 次の人へ。周回は G.roundStart から数えるので、先手が誰でも全員のターン数が同じ */
function nextTurn(){
  var n = G.players.length, before = G.turnsLeft;
  var rs = (((G.roundStart | 0) % n) + n) % n;
  var rel = function(x){ return (x - rs + n) % n; };
  var old = G.turn;
  for(var k = 1; k <= n; k++){
    var j = (old + k) % n;
    if(!G.players[j].out){
      if(rel(j) <= rel(old)) G.turnsLeft--;
      G.turn = j; break;
    }
  }
  // 終盤インフレ（短縮ルールの12ターンだけ。残り6ターンから毎ターン1.5倍）
  if(dktInfl() && G.turnsLeft < before && G.turnsLeft <= INFL_FROM && G.turnsLeft > 0){
    G.infl = G.infl * INFL_STEP;
    raiseBanner('通行料 ×' + inflTxt() + '！');
    news('🔥 のこり' + G.turnsLeft + 'ターン — 通行料が ×' + inflTxt() + ' になりました');
    SFX.warn(); camShake(9);
  }
  camReset(); updHUD();
}

/* ══════════ CPU・自動プレイのサイコロ ══════════
   ねらう合計＝一番得をする目。当たる確率＝dktImpactP×強さ（よわい .6／ふつう 1／つよい 1.3）で、人間と同じ区間の決まり */
function dktAiLv(pi){
  var p = G.players[pi];
  if(p.kind === 'cpu') return Math.max(0, Math.min(2, cfg.ai | 0));
  return p.autoWeak ? 0 : 1;
}
async function aiRoll(pi){
  var p = G.players[pi], lv = dktAiLv(pi);
  stepPreview = { from:p.pos, max:12, parity:null };
  gaugeOn = true;
  var E = dktEl(); if(E.ui) E.ui.classList.add('on');
  await wait(750);
  if(!G || G.over || p.out) return dktNoRoll();
  // 出目えらび（能力）：一番得をする目
  if(p.chooseEye > 0){
    p.chooseEye--;
    var best = dktBestTotal(pi, null);
    gaugeOn = false; dktHideInput();
    return doRoll(pi, null, false, best);
  }
  var force = null;
  if(lv >= 1 && dktOeN(p) > 0){
    var so = bestParity(pi, 'odd'), se = bestParity(pi, 'even'), sn = avgScore(pi), m = (lv === 2) ? 6 : 16;
    if(so > sn + m && so >= se) force = 'odd';
    else if(se > sn + m) force = 'even';
    if(force && !dktOeUse(pi, force)) force = null;
  }
  if(force && stepPreview) stepPreview.parity = force;
  var imp = Math.random() < dktImpactP(pi) * [0.6, 1, 1.3][lv];
  var tg = imp ? dktCpuTarget(pi, force) : 0;
  DKT_G.pend = { pi:pi, target:tg };
  return doRoll(pi, force, imp, 0, tg);
}
/* CPU がその目で止まった時の点（直書きの金額は開始額に比例させる＝J16 dkScale） */
function scoreLanding(pi, n){
  var p = G.players[pi], t = G.tiles[(p.pos + n) % 32], k = Math.max(0.05, +dkScale() || 1);
  if(t.type === 'city'){
    if(t.owner < 0) return 60 + t.base / (200000 * k);
    if(t.owner === pi || dkAlly(pi, t.owner)) return 40;
    return -tollOf(t, G) / (120000 * k);
  }
  if(t.type === 'jail') return -70;
  if(t.type === 'tax') return -25;
  if(t.type === 'bonus') return 50;
  if(t.type === 'card') return 22;
  if(t.type === 'travel') return 45;
  if(t.type === 'minigame') return 48;
  if(t.type === 'start') return 30;
  return 10;
}
/* C08：対戦中の持ち物は p.fcard（WP14 の #itembar）だけで、旧アイテムは使わない。
   何もしないで返すので、持ち物の演出を待つ間にサイコロが振れる競合（WP7#1）も起きない */
function useItem(pi, k){ return Promise.resolve(); }
/* 揺らす（J45）：部屋のルール「揺らす（当作ルール）」がオンの時だけ。自動プレイの人は揺らさない */
function shakePhase(me){
  return new Promise(function(res){
    var el = document.getElementById('shake'), p = G && G.players[me];
    if(!el || !cfg.shake || !p || p.out || p.kind === 'cpu' || p.auto || !(p.jam > 0)){ res(false); return; }
    el.innerHTML = '<b>相手が建物を設置中！</b><i>揺らすをタッチして邪魔しましょう（残り回数 <em id="jamLeft">' + (p.jam | 0) + '</em>）</i>'
      + '<button type="button" id="shakeBtn">揺らす</button>';
    var btn = document.getElementById('shakeBtn'), done = false;
    var fin = function(v){ if(done) return; done = true; el.classList.remove('on'); if(btn) btn.onclick = null; res(v); };
    el.classList.add('on');
    btn.onclick = function(){
      if(!(p.jam > 0)){ fin(false); return; }
      p.jam--; SFX.skill(); camShake(11);
      var win = Math.random() < 0.45 + statRate(p, 'mini') * 0.25;
      updHUD();
      if(win) SFX.bad();
      fin(win);
    };
    setTimeout(function(){ fin(false); }, 1700 * SPEED);
  });
}

/* ══════════ 絵（SVG。絵文字にたよらない） ══════════ */
function dktSvg(kind){
  if(kind === 'dice') return '<svg class="dkt-ic" viewBox="0 0 80 80" aria-hidden="true">'
    + '<defs><linearGradient id="dktDg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F6D6E6"/></linearGradient></defs>'
    + '<g transform="rotate(-12 27 45)"><rect x="8" y="26" width="38" height="38" rx="9" fill="url(#dktDg)" stroke="#7A1440" stroke-width="3"/>'
    + '<circle cx="18" cy="36" r="4" fill="#D21A6A"/><circle cx="27" cy="45" r="4" fill="#D21A6A"/><circle cx="36" cy="54" r="4" fill="#D21A6A"/></g>'
    + '<g transform="rotate(14 54 32)"><rect x="36" y="14" width="36" height="36" rx="9" fill="url(#dktDg)" stroke="#7A1440" stroke-width="3"/>'
    + '<circle cx="46" cy="24" r="3.6" fill="#D21A6A"/><circle cx="62" cy="24" r="3.6" fill="#D21A6A"/>'
    + '<circle cx="46" cy="40" r="3.6" fill="#D21A6A"/><circle cx="62" cy="40" r="3.6" fill="#D21A6A"/></g></svg>';
  if(kind === 'coin') return '<svg class="dkt-ic" viewBox="0 0 80 80" aria-hidden="true">'
    + '<defs><linearGradient id="dktCg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6D0"/><stop offset=".45" stop-color="#F2C230"/><stop offset="1" stop-color="#A9761A"/></linearGradient></defs>'
    + '<g stroke="#6B4408" stroke-width="2.5">'
    + '<path d="M14 58v8c0 5 12 9 26 9s26-4 26-9v-8" fill="#C8952F"/><ellipse cx="40" cy="58" rx="26" ry="9" fill="url(#dktCg)"/>'
    + '<path d="M14 45v8c0 5 12 9 26 9s26-4 26-9v-8" fill="#C8952F"/><ellipse cx="40" cy="45" rx="26" ry="9" fill="url(#dktCg)"/>'
    + '<path d="M14 32v8c0 5 12 9 26 9s26-4 26-9v-8" fill="#C8952F"/><ellipse cx="40" cy="32" rx="26" ry="9" fill="url(#dktCg)"/></g>'
    + '<path d="M40 25l2.4 4.6 5 .8-3.6 3.5.9 5-4.7-2.4-4.7 2.4.9-5-3.6-3.5 5-.8z" fill="#FFF8DC" stroke="#8A5A0C" stroke-width="1.2"/></svg>';
  if(kind === 'ticket') return '<svg class="dkt-ic" viewBox="0 0 80 80" aria-hidden="true">'
    + '<defs><linearGradient id="dktTg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8F0FF"/><stop offset="1" stop-color="#5AAEF0"/></linearGradient></defs>'
    + '<g transform="rotate(-10 40 40)"><path d="M8 24h64v11a6 6 0 0 0 0 12v11H8V47a6 6 0 0 0 0-12z" fill="url(#dktTg)" stroke="#0B2C5E" stroke-width="3"/>'
    + '<path d="M52 26v30" stroke="#0B2C5E" stroke-width="2" stroke-dasharray="4 4"/>'
    + '<path d="M26 34h8l-3-4m3 4l-3 4M22 46h12" stroke="#0B2C5E" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle cx="62" cy="41" r="5" fill="#FFD44A" stroke="#6B4408" stroke-width="1.6"/></g></svg>';
  if(kind === 'gem') return '<svg class="dkt-gem" viewBox="0 0 40 36" aria-hidden="true">'
    + '<defs><linearGradient id="dktGm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8FBFF"/><stop offset=".5" stop-color="#5FD0F5"/><stop offset="1" stop-color="#1E6FB8"/></linearGradient></defs>'
    + '<path d="M8 3h24l7 10-19 21L1 13z" fill="url(#dktGm)" stroke="#0B3A66" stroke-width="2" stroke-linejoin="round"/>'
    + '<path d="M1 13h38M14 3l-4 10 10 21 10-21-4-10" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.4"/></svg>';
  if(kind === 'oe') return '<svg class="dkt-ic" viewBox="0 0 96 64" aria-hidden="true">'
    + '<defs><radialGradient id="dktOb" cx="45%" cy="35%" r="65%"><stop offset="0" stop-color="#9EDCFF"/><stop offset=".55" stop-color="#2E8BE0"/><stop offset="1" stop-color="#0B2C5E"/></radialGradient></defs>'
    + '<circle cx="28" cy="32" r="24" fill="url(#dktOb)" stroke="#E8F4FF" stroke-width="3"/><circle cx="68" cy="32" r="24" fill="url(#dktOb)" stroke="#E8F4FF" stroke-width="3"/>'
    + '<text x="28" y="40" text-anchor="middle" font-family="Mochiy Pop One,Noto Sans JP,sans-serif" font-size="22" fill="#fff" stroke="#0B2C5E" stroke-width="4" paint-order="stroke">奇</text>'
    + '<text x="68" y="40" text-anchor="middle" font-family="Mochiy Pop One,Noto Sans JP,sans-serif" font-size="22" fill="#fff" stroke="#0B2C5E" stroke-width="4" paint-order="stroke">偶</text></svg>';
  return '';
}

/* ══════════ 能力：残り回数が0なら何もしない（ともだちモードで回数がマイナスになっていた） ══════════ */
var DKT_useSkill0 = (typeof useSkill === 'function') ? useSkill : null;
if(DKT_useSkill0){
  useSkill = function(pi){
    var p = G && G.players && G.players[pi];
    if(!p || !(p.skillLeft > 0)) return Promise.resolve();
    return DKT_useSkill0.apply(this, arguments);
  };
}

/* ══════════ 起動：サイコロUIの部品をそろえる ══════════ */
(function(){
  try{
    if(typeof gcv !== 'undefined' && gcv){
      var gk = (typeof DKFX === 'object' && DKFX && DKFX.mob) ? 1 : 2;     // スマホは描く時に dktGaugeFit が合わせる
      gcv.width = DKT_GW * gk; gcv.height = DKT_GH * gk;
    }
    var ui = document.getElementById('diceui'), push = document.getElementById('push');
    if(ui && push){
      if(!ui.querySelector('.dkt-halo')){
        var h = document.createElement('div'); h.className = 'dkt-halo'; h.setAttribute('aria-hidden', 'true');
        ui.insertBefore(h, push);
      }
      if(!ui.querySelector('.dkt-cap')){
        var c = document.createElement('div'); c.className = 'dkt-cap'; ui.appendChild(c);
      }
      if(!ui.querySelector('.dkt-oeA')){
        ui.insertAdjacentHTML('beforeend', '<div class="dkt-oetag dkt-oeA" aria-hidden="true"></div><div class="dkt-oetag dkt-oeB" aria-hidden="true"></div>');
      }
      push.setAttribute('type', 'button');
      push.innerHTML = '<b class="dkt-pl">押す</b><i class="dkt-ps">長押しでねらう</i>';
    }
    ['odd', 'even'].forEach(function(id){ var b = document.getElementById(id); if(b) b.setAttribute('type', 'button'); });
    DKT_G.el = null;
  }catch(e){ console.error('[WP13a]', e); }
})();
