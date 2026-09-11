/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 手番の流れ・サイコロのゲージ・マス選び（9g-turn.js / WP6）
   ──────────────────────────────────────────────────────────────
   本家（韓国版の原作と日本版）の手番に寄せる。
   ・サイコロUI：金縁のピンクの［押す］、青い丸の［奇数］［偶数］、弧のゲージ（2〜12）。
     押していない間はゲージがゆっくり往復し、クリックならその値で振る。
     長押しすると 2↔12 を1.2秒で往復し、離した値で振る。
     当たれば「止めた値±誤差」、外れれば普通の2個振り（当たる確率は能力とサイコロで上がる）。
   ・奇数／偶数は「モード切替」。大ボタンの字が変わり、合うマスが光る。回数は振った時に減らす。
   ・世界旅行：着いたターンは動かない。次の手番に旅費を払って好きなマスへ。
   ・無人島：3択（ダブルに挑戦／保釈金／脱出カード）。払う・カードはゲージなしで振って進む。
   ・国税庁：所有地の建設費用（cityValue）の合計×10%×特殊費用割引。
   ・周回は G.roundStart から数える（先手が誰でも、全員のターン数が同じになる）。
   ・マス選び：中央の案内パネル＋選べるマスだけ光る。時間切れは最善のマスを自動で選ぶ。
   ══════════════════════════════════════════════════════════════ */

const DKT_IDLE_MS  = 3000;     // 押していない時、ゲージが 2→12→2 と往復する時間
const DKT_HOLD_MS  = 1200;     // 長押し中の往復（本家の速さ）
const DKT_HOLD_MIN = 170;      // これより短い押しは「ただのクリック」
const DKT_STOP_MS  = 420;      // 止めた位置を見せる時間（×SPEED）
const DKT_PICK_MS  = 20000;    // マス選びの時間切れ（×SPEED）
const DKT_JAIL_FEE = 500000;   // 保釈金（特殊費用割引が効く）
const DKT_TRIP_MIN = 200000;   // 旅費の下限
const DKT_GW = 560, DKT_GH = 214;          // #gauge の大きさ（ステージ座標）
const DKT_GX = 528, DKT_GY = 290;          // #gauge の左上（盤の中心 x=808 に合わせる）
const DKT_ARC = { cx:280, cy:232, rx:244, ry:172, a0:Math.PI * 1.075, a1:Math.PI * 1.925 };
const DKT_FONT = '"Mochiy Pop One","Noto Sans JP",sans-serif';
var DKT_G = { inp:null, pend:null, pick:null, pickOpt:null, watch:false, drawn:false, el:null, pseq:0 };

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

/* 当たる確率：clamp(.3＋能力ゲージ×.45＋サイコロのゲージ×.01, .3, .92) */
function dktImpactP(p, die){
  var g = (die && +die.gauge) || 0;
  return Math.max(0.3, Math.min(0.92, 0.3 + statRate(p, 'gauge') * 0.45 + g * 0.01));
}
/* 当たった時の誤差 ±e：max(0, 3−floor(サイコロのゲージ/4))
   （ふつうのサイコロ ±3 → 黄金のサイコロ Lv4 で ±2・Lv7 で ±1・Lv10 でぴったり。本家「精度が上がると止めた数が必ず出る」） */
function dkGaugeErr(die){
  var g = (die && +die.gauge) || 0;
  return Math.max(0, 3 - Math.floor(g / 4));
}
/* 止めた値 v に誤差を入れて、実際に出す合計を決める（奇偶の指定があれば合う値だけ） */
function dktAimTotal(pi, v, force){
  var e = dkGaugeErr(dieOf(pi)), c = [], t;
  v = Math.max(2, Math.min(12, Math.round(+v) || 7));
  for(t = Math.max(2, v - e); t <= Math.min(12, v + e); t++) if(dktParOk(t, force)) c.push(t);
  if(!c.length) return Math.max(2, Math.min(12, v + (v < 7 ? 1 : -1)));
  return c[(Math.random() * c.length) | 0];
}
/* 当たり判定つき → {impact, target} */
function dktResolveAim(pi, v, force){
  var p = G.players[pi];
  if(Math.random() < dktImpactP(p, dieOf(pi))) return { impact:true, target:dktAimTotal(pi, v, force) };
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

/* ══════════ サイコロを振る ══════════
   doRoll(pi, force, impact, fixedTotal[, target])。4つの引数だけでも動く
   （target が落ちたら、takeRoll が控えた値 → それも無ければ CPU と同じねらいで決める） */
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
    // ダブル確定（奇数とは両立しないので、奇数の時は次に残す）＞ゲージインパクト＞ふつう
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
  var th = dvThrow(seed, a, b);
  diceAnim = { t:0, th:th, lastShake:0 };
  SFX.diceShake();
  setTimeout(function(){ SFX.diceThrow(); }, 200 * SPEED);
  await wait(th.dur);
  addFx('spark', BCX, DICE_Y - 10, 900, '#FFD24D');
  var total = a + b, isDbl = a === b;
  if(isDbl){ SFX.diceDouble(); camShake(12); }
  showChip(total, isDbl, { impact:hit, target:(hit ? (target || total) : 0) });
  await wait(isDbl ? 900 : 560);
  hideChip();
  return { a:a, b:b, total:total, isDbl:isDbl, impact:hit };
}

/* 人間の手番：入力UI → 振る。能力はここから使う */
function takeRoll(pi){
  var p = G.players[pi];
  if(p.kind === 'cpu') return aiRoll(pi);
  return dkRollInput(pi).then(function(o){
    if(o && o.tag === 'skill') return Promise.resolve(useSkill(pi)).then(function(){
      // 能力で監獄へ飛んだ・破産した・決着した時は、もう振らない
      if(!G || G.over || p.out || p.jail > 0 || p.travel) return { a:1, b:1, total:2, isDbl:false, cancelled:true };
      return takeRoll(pi);
    });
    if(!o || o.tag !== 'roll') return { a:1, b:1, total:2, isDbl:false, cancelled:true };
    var force = o.force || null, fixed = 0;
    if(o.eye && p.chooseEye > 0){ p.chooseEye--; fixed = o.eye; force = null; }
    if(force === 'odd'){ if(p.odd > 0) p.odd--; else force = null; }
    if(force === 'even'){ if(p.even > 0) p.even--; else force = null; }
    var imp = !!o.impact && !fixed, tg = imp ? (o.target || 0) : 0;
    DKT_G.pend = { pi:pi, target:tg };           // doRoll を包む人が引数を落としても届くように
    return doRoll(pi, force, imp, fixed, tg);
  });
}

/* ══════════ サイコロの入力UI（takeRoll とオンラインの両方から使う） ══════════
   → Promise<{tag:'roll', force, impact, target, eye, v} | {tag:'skill'} | 外から渡された値>
   状態は書き換えない（奇偶の回数・出目えらびの回数は呼んだ側が減らす） */
function dkRollInput(pi){
  var p = G.players[pi];
  var old = DKT_G.inp;
  if(old && !old.done){ old.done = true; dktUnwire(old); }     // 前の入力は置き去りにする（二重に動かさない）
  return new Promise(function(res){
    var die = dieOf(pi);
    var I = { pi:pi, force:null, hold:0, t0:performance.now(), ph0:Math.random(), e:dkGaugeErr(die),
              pImp:dktImpactP(p, die), done:false, stopU:undefined, hit:null, chg:null };
    DKT_G.inp = I;
    stepPreview = { from:p.pos, max:12, parity:null };
    gaugeOn = true;
    var close = function(){ if(I.done) return false; I.done = true; dktUnwire(I); return true; };
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
  });
}
/* 待っている入力を外から閉じる（オンラインで持ち物を使った時など） */
function dktInputCancel(val){ var I = DKT_G.inp; if(I && I.cancel) I.cancel(val); }

function dktEl(){
  var E = DKT_G.el;
  if(E && E.ui && E.ui.isConnected) return E;
  var q = function(s){ return document.querySelector(s); };
  E = DKT_G.el = { ui:q('#diceui'), push:q('#push'), odd:q('#odd'), even:q('#even'), oddN:q('#oddN'),
    evenN:q('#evenN'), sk:q('#skillBtn'), cap:q('#diceui .dkt-cap'), lbl:q('#push .dkt-pl'), sub:q('#push .dkt-ps') };
  return E;
}
function dktShowDice(I){
  var E = dktEl(); if(!E.ui) return;
  DKT_G.watch = false;
  E.ui.classList.remove('dkt-watch', 'dkt-hit', 'dkt-miss');
  dktSyncUI(I);
  E.ui.classList.add('on');
  E.ui.classList.remove('dkt-in'); void E.ui.offsetWidth; E.ui.classList.add('dkt-in');
}
function dktSyncUI(I){
  var E = dktEl(), p = G.players[I.pi];
  if(E.oddN) E.oddN.textContent = p.odd;
  if(E.evenN) E.evenN.textContent = p.even;
  if(E.odd){ E.odd.classList.toggle('dim', !(p.odd > 0)); E.odd.classList.toggle('dkt-on', I.force === 'odd'); }
  if(E.even){ E.even.classList.toggle('dim', !(p.even > 0)); E.even.classList.toggle('dkt-on', I.force === 'even'); }
  if(E.push) E.push.classList.toggle('dkt-mode', !!I.force);
  var t = I.force === 'odd' ? '奇数' : I.force === 'even' ? '偶数' : '押す';
  if(E.lbl && E.lbl.textContent !== t){
    E.lbl.textContent = t;
    E.lbl.classList.remove('dkt-swap'); void E.lbl.offsetWidth; E.lbl.classList.add('dkt-swap');
  }
  if(E.sub) E.sub.textContent = I.force ? 'モードで振る' : '長押しでねらう';
  if(E.cap) E.cap.innerHTML = 'インパクト <b>' + Math.round(I.pImp * 100) + '%</b><span class="dkt-dot"></span>'
    + '誤差 <b>' + (I.e > 0 ? '±' + I.e : 'なし') + '</b>';
}
function dktHideInput(){
  var I = DKT_G.inp;
  if(I && I.chg){ try{ I.chg.end(); }catch(e){} I.chg = null; }
  DKT_G.inp = null; gaugeOn = false;
  var E = dktEl();
  if(E.ui) E.ui.classList.remove('on', 'dkt-in', 'dkt-hit', 'dkt-miss', 'dkt-watch');
  if(E.push) E.push.classList.remove('dkt-hold');
  DKT_G.watch = false;
}
function dktWire(I){
  var E = dktEl();
  if(!E.push) return;
  E.push.onclick = function(){
    if(I.done || I.fired) return;
    try{ SFX.click(); }catch(e){}
    I.roll(dktU(I, performance.now()));
  };
  I.onDown = function(ev){
    if(I.done || (ev && ev.button > 0)) return;
    I.hold = performance.now();
    E.push.classList.add('dkt-hold');
    try{ E.push.setPointerCapture(ev.pointerId); }catch(e){}
  };
  I.onUp = function(){
    if(I.done || !I.hold){ I.hold = 0; return; }
    var now = performance.now(), long = now - I.hold >= DKT_HOLD_MIN, u = dktU(I, now);
    I.hold = 0; E.push.classList.remove('dkt-hold');
    if(I.chg){ try{ I.chg.end(); }catch(e){} I.chg = null; }
    if(long){ I.fired = true; I.roll(u); }             // 長押し：離した値。短い押しは onclick に任せる
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
  if(E.sk) E.sk.onclick = function(){ if(E.sk.disabled || I.done) return; I.cancel({ tag:'skill' }); };
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
/* 奇数／偶数：押すとモード、もう一度押すと解除。回数はここでは減らさない */
function dktToggle(I, par){
  if(I.done) return;
  var p = G.players[I.pi], E = dktEl(), btn = (par === 'odd') ? E.odd : E.even;
  if(I.force === par) I.force = null;
  else {
    if(!(((par === 'odd') ? p.odd : p.even) > 0)){ try{ SFX.warn(); }catch(e){} if(btn) fxShake(btn, 260); return; }
    I.force = par;
  }
  try{ SFX.click(); }catch(e){}
  if(stepPreview) stepPreview.parity = I.force;
  dktSyncUI(I);
  if(I.force && btn) fxBurst(btn, { kind:'star', n:8, power:0.5 });
}
/* 止めた瞬間の手応え（当たりは金の粒と「ゲージインパクト！」） */
function dktStopFx(I, aim){
  var E = dktEl();
  if(E.ui) E.ui.classList.add(aim.impact ? 'dkt-hit' : 'dkt-miss');
  if(!aim.impact) return;
  var at = dktTipPt(I.stopU);
  try{ SFX.gaugeOk(); }catch(e){}
  fxBurst(at, { kind:'star', n:16, power:0.9 });
  fxPopText({ x:808, y:DKT_GY + 46 }, 'ゲージインパクト！', { tone:'gold', size:40 });
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
/* CPU の手番：ボタンは隠して、ゲージだけ「ねらっている」ように動かす */
function dktWatch(on){
  if(DKT_G.watch === on) return;
  DKT_G.watch = on;
  var E = dktEl(); if(!E.ui) return;
  E.ui.classList.toggle('dkt-watch', on);
  if(on && E.cap && G && G.players[G.turn]){
    E.cap.innerHTML = '<b style="color:' + PCOL[G.turn] + '">' + esc(G.players[G.turn].name) + '</b> がねらっています';
  }
}

/* ══════════ ゲージを描く（毎フレーム。#gauge に 2倍の解像度で） ══════════ */
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
  var now = performance.now(), k = gcv.width / DKT_GW, A = DKT_ARC;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, gcv.width, gcv.height);
  g.setTransform(k, 0, 0, k, 0, 0);
  var u = I ? dktU(I, now) : dktTri(now / 1800);
  var force = I ? I.force : null, e = I ? I.e : 0, v = dktValOfU(u);
  var holding = !!(I && I.hold && now - I.hold >= DKT_HOLD_MIN);
  var stop = !!(I && I.stopU !== undefined);
  if(holding && I && !I.chg){ try{ I.chg = SFX.gaugeCharge() || null; }catch(err){ I.chg = null; } }
  if(I && I.chg && I.chg.level){ try{ I.chg.level(u); }catch(err){} }
  var span = A.a1 - A.a0, au = A.a0 + span * u;
  var arc = function(r, a0, a1){ g.beginPath(); g.ellipse(A.cx, A.cy, A.rx + r, A.ry + r, 0, a0, a1); };
  g.lineCap = 'round';
  // 落ち影 → 金の縁 → 溝
  g.lineWidth = 48; g.strokeStyle = 'rgba(0,0,0,.34)';
  g.beginPath(); g.ellipse(A.cx, A.cy + 7, A.rx, A.ry, 0, A.a0, A.a1); g.stroke();
  var gold = g.createLinearGradient(0, 40, 0, 200);
  gold.addColorStop(0, '#FFF6D0'); gold.addColorStop(0.3, '#E8B94A'); gold.addColorStop(0.62, '#8A5A0C'); gold.addColorStop(1, '#F3D583');
  g.lineWidth = 44; g.strokeStyle = gold; arc(0, A.a0, A.a1); g.stroke();
  var trk = g.createLinearGradient(0, 50, 0, 200);
  trk.addColorStop(0, '#454B5C'); trk.addColorStop(1, '#171A23');
  g.lineWidth = 34; g.strokeStyle = trk; arc(0, A.a0, A.a1); g.stroke();
  // 11マス：奇偶モードで合わない数字は暗く、誤差の範囲はうっすら明るく
  g.lineCap = 'butt';
  for(var s = 0; s < 11; s++){
    var tv = s + 2, c0 = A.a0 + span * s / 11, c1 = A.a0 + span * (s + 1) / 11, col = null;
    if(force && !dktParOk(tv, force)) col = 'rgba(0,0,0,.5)';
    else if(I && !stop && e > 0 && Math.abs(tv - v) <= e) col = 'rgba(255,255,255,.17)';
    if(col){ g.lineWidth = 30; g.strokeStyle = col; arc(0, c0 + 0.004, c1 - 0.004); g.stroke(); }
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
    g.lineWidth = 24; g.strokeStyle = fill; arc(0, A.a0, au); g.stroke();
    g.restore();
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.55)';
    arc(-7, A.a0 + 0.02, Math.max(A.a0 + 0.02, au - 0.02)); g.stroke();
  }
  // 区切り線
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 2; g.lineCap = 'butt';
  for(s = 1; s < 11; s++){
    var ad = A.a0 + span * s / 11, ca = Math.cos(ad), sa = Math.sin(ad);
    g.beginPath();
    g.moveTo(A.cx + ca * (A.rx - 16), A.cy + sa * (A.ry - 16));
    g.lineTo(A.cx + ca * (A.rx + 16), A.cy + sa * (A.ry + 16));
    g.stroke();
  }
  // 端の 2 と 12
  g.font = '20px ' + DKT_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 4; g.strokeStyle = 'rgba(40,24,4,.9)'; g.fillStyle = '#FFE9B0';
  var ex0 = A.cx + Math.cos(A.a0) * (A.rx - 36), ey0 = A.cy + Math.sin(A.a0) * (A.ry - 36);
  var ex1 = A.cx + Math.cos(A.a1) * (A.rx - 36), ey1 = A.cy + Math.sin(A.a1) * (A.ry - 36);
  g.strokeText('2', ex0, ey0); g.fillText('2', ex0, ey0);
  g.strokeText('12', ex1, ey1); g.fillText('12', ex1, ey1);
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
  g.font = (v >= 10 ? '24px ' : '29px ') + DKT_FONT;
  g.fillText(String(v), hx, hy + 2);
}

/* ══════════ 盤の上の目印（毎フレーム・盤の座標） ══════════
   ・マス選び中：選べないマスを暗く、選べるマスを光らせる
   ・サイコロの前：1〜12 の金の札。奇偶モードは合うマスが黄色く光り、ゲージの値のマスが白く光る */
function drawSteps(ctx, G){
  if(DKT_G.pick) dktDrawPick(ctx, G);
  if(!stepPreview) return;
  var sp = stepPreview, I = DKT_G.inp, now = performance.now();
  var force = I ? I.force : (sp.parity || null);
  var v = I ? dktValOfU(dktU(I, now)) : 0, e = I ? I.e : 0;
  var pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
  var d, i, r, par, ok;
  for(d = 2; d <= sp.max; d++){
    i = (sp.from + d) % 32; par = (d % 2 === 0) ? 'even' : 'odd'; ok = !force || force === par;
    if(force && ok) dktTileFill(ctx, i, 'rgba(255,232,96,' + (0.28 + 0.24 * pulse).toFixed(3) + ')', 'rgba(255,246,190,.85)');
    if(v && ok && d >= v - e && d <= v + e)
      dktTileFill(ctx, i, 'rgba(255,255,255,' + (d === v ? 0.42 : 0.16) + ')', d === v ? '#FFFFFF' : null);
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
  var many = P.ok.length >= 16;          // ほぼ全部選べる時（旅行・ワープ）は、塗りを薄くして縁を光らせる
  var fa = many ? (0.05 + 0.1 * pulse) : (0.14 + 0.22 * pulse);
  for(var i = 0; i < 32; i++){
    if(!P.okSet[i]) dktTileFill(ctx, i, 'rgba(10,8,24,.55)', null);
    else if(i === P.hover) dktTileFill(ctx, i, 'rgba(255,240,150,.55)', '#FFFFFF');
    else dktTileFill(ctx, i, 'rgba(255,214,90,' + fa.toFixed(3) + ')',
                     'rgba(255,226,120,' + (0.5 + 0.45 * pulse).toFixed(3) + ')');
  }
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
function dktFestName(){ return String((G && G.map && G.map.corners[2]) || '祭典').replace(/開催$/, ''); }
/* 次の pickTile に付ける題名（同じ手番の中だけ有効） */
function dktSetPick(tag, note){ DKT_G.pickOpt = { tag:tag, note:note || null, at:(G ? (G.turnSerial | 0) : 0) }; }
function dktTakePickOpt(msg){
  var o = DKT_G.pickOpt; DKT_G.pickOpt = null;
  if(o && G && o.at === (G.turnSerial | 0)) return o;
  var m = String(msg || ''), tag = 'マスを選ぶ';
  if(/凍らせ/.test(m)) tag = '凍結';
  else if(/ワープ/.test(m)) tag = 'ワープ';
  else if(/移動先/.test(m)) tag = '移動';
  else if(/ただで建て/.test(m)) tag = '無料建設';
  else if(/開催/.test(m)) tag = dktFestName();
  else if(/そだて/.test(m)) tag = G.map.corners[0];
  else if(/行き先/.test(m)) tag = G.map.corners[3];
  return { tag:tag, note:null };
}
/* 時間切れの時に選ぶマス */
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
function pickTile(pi, msg, filter){
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
    var opt = dktTakePickOpt(msg);
    camReset();
    var P = DKT_G.pick = { pi:pi, ok:ok, okSet:okSet, hover:-1, t0:performance.now(), g:G,
      dur:Math.max(400, DKT_PICK_MS * SPEED), res:res, msg:msg, opt:opt, done:false, seq:++DKT_G.pseq };
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
  var b = dktBestTile(P.pi, P.ok);
  toast('R', '⏱', '時間切れ', ((G.tiles[b] && G.tiles[b].name) || 'マス') + ' を選びました', 1800);
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
  if(n){ n.textContent = 'そのマスは選べません。光っているマスを選んでください'; }
  P.el.classList.add('dkt-bad'); fxShake(P.el, 280);
  clearTimeout(P.badT);
  P.badT = setTimeout(function(){
    if(P.done || !P.el) return;
    P.el.classList.remove('dkt-bad');
    if(n) n.textContent = (P.opt && P.opt.note) || '光っているマスをタップしてください';
  }, 1600);
}
function dktPickPanel(P){
  var st = document.getElementById('stage'); if(!st) return;
  var el = st.querySelector(':scope > .dkt-pick');
  if(!el){ el = document.createElement('div'); el.className = 'dkt-pick'; st.appendChild(el); }
  el.classList.remove('dkt-out', 'dkt-bad', 'dkt-late');
  el.dataset.seq = P.seq;
  el.innerHTML = '<div class="dkt-pk-tag"><b>' + esc(P.opt.tag) + '</b></div>'
    + '<div class="dkt-pk-msg">' + esc(P.msg || 'マスを選んでください') + '</div>'
    + '<div class="dkt-pk-note">' + esc(P.opt.note || '光っているマスをタップしてください') + '</div>'
    + '<div class="dkt-pk-foot">'
    +   '<div class="dkt-pk-bar"><i style="animation-duration:' + Math.round(P.dur) + 'ms"></i></div>'
    +   '<span class="dkt-pk-sec">のこり <b>' + Math.ceil(P.dur / 1000) + '</b> 秒</span>'
    +   '<button type="button" class="dkt-pk-x">キャンセル</button>'
    + '</div>';
  el.querySelector('.dkt-pk-x').onclick = function(){ try{ SFX.click(); }catch(e){} dktPickEnd(-1); };
  P.el = el;
  el.classList.remove('dkt-on'); void el.offsetWidth; el.classList.add('dkt-on');
}
function dktPickClose(P){
  var el = P.el; if(!el) return;
  clearTimeout(P.badT);
  el.classList.add('dkt-out');
  setTimeout(function(){
    if(el.dataset.seq === String(P.seq)){ el.classList.remove('dkt-on', 'dkt-out'); el.innerHTML = ''; }
  }, Math.max(20, 180 * Math.min(1, SPEED)));
}

/* ══════════ 無人島（監獄） ══════════ */
function dktJailFee(p){ return Math.round(DKT_JAIL_FEE * statMul(p, 'special', 0.4)); }
function dktCpuJail(p, fee){
  if(p.escapeTix > 0) return 'card';
  if(p.cash >= fee * 3) return 'pay';
  return 'dbl';
}
function dktJailUI(pi, fee){
  var p = G.players[pi], tix = +p.escapeTix || 0, canPay = p.cash >= fee;
  var h = '<div class="modal dkt-mod dkt-jail">'
    + '<div class="dkt-rib"><b>' + esc(G.map.corners[1]) + '</b></div>'
    + '<p class="dkt-lead">脱出方法を選んでください　<em>のこり ' + (p.jail | 0) + ' ターン</em></p>'
    + '<div class="dkt-opts">'
    + '<button type="button" class="dkt-opt" data-act="dbl">' + dktSvg('dice') + '<b>ダブルに挑戦</b><i>ダブルが出れば脱出</i></button>'
    + (canPay
        ? '<button type="button" class="dkt-opt dkt-gold" data-act="pay">' + dktSvg('coin') + '<b>保釈金を払う</b><i class="dkt-amt">' + yen(fee) + '</i></button>'
        : '<div class="dkt-opt dkt-off">' + dktSvg('coin') + '<b>保釈金を払う</b><i>所持金が足りません（' + yen(fee) + '）</i></div>')
    + (tix > 0 ? '<button type="button" class="dkt-opt dkt-blue" data-act="card">' + dktSvg('ticket') + '<b>脱出カード</b><i>のこり ' + tix + ' 枚</i></button>' : '')
    + '</div>'
    + '<p class="dkt-foot">保釈金・カードで出た時は、ゲージなしでサイコロを振ってそのまま進みます</p>'
    + '</div>';
  return modal(h);
}
async function jailTurn(pi){
  var p = G.players[pi];
  var jc = tileCenter(8);
  dktFocus(jc.x, jc.y, 1.3);
  var fee = dktJailFee(p);
  G.phase = 'jail';
  await band(G.map.corners[1] + ' — あと ' + p.jail + ' ターン', '脱出方法を選んでください', 1100);
  var how = await dvAsk(pi, 'jail', function(){
    return (p.kind === 'cpu') ? dktCpuJail(p, fee) : dktJailUI(pi, fee);
  }, '脱出方法を選んでいます');
  if(how === 'card' && !(p.escapeTix > 0)) how = 'dbl';
  if(how === 'pay' && p.cash < fee) how = 'dbl';
  if(how !== 'card' && how !== 'pay') how = 'dbl';
  camReset();                                  // サイコロは盤の中央に落ちるので、寄ったままだと見えない
  if(how === 'card' || how === 'pay'){
    if(how === 'card'){ p.escapeTix = (typeof p.escapeTix === 'number') ? Math.max(0, p.escapeTix - 1) : 0; }
    else give(pi, -fee);
    p.jail = 0; p.dblRun = 0;
    SFX.good();
    await band(how === 'card' ? '脱出カードを使いました' : '保釈金 ' + yen(fee) + ' を払いました',
               'ゲージなしでサイコロを振って出発します', 1200);
    await dvQueueDice(pi, null, false, 0);
    var r0 = await doRoll(pi, null, false);
    if(G.over) return;
    await moveSteps(pi, r0.total); await resolve(pi);
    return;
  }
  await dvQueueDice(pi, null, false, 0);
  var r = await doRoll(pi, null, false);
  if(G.over) return;
  if(r.isDbl){
    p.jail = 0; p.dblRun = 0;
    await band('脱出成功！', 'ダブルが出たので、そのまま進みます', 1300);
    await moveSteps(pi, r.total); await resolve(pi);
    return;
  }
  p.jail--;
  if(p.jail <= 0) toast('R', '🔓', '次のターンから動けます', '', 1700);
  camReset();
}

/* ══════════ 世界旅行（着いた次の手番に使う） ══════════
   → 'done'（旅行した）／'skip'（取り消した＝1回休み）／'roll'（旅費が無いので普通に振る） */
function dktTravelCost(p){
  return Math.round(Math.max(DKT_TRIP_MIN, p.cash * 0.03) * statMul(p, 'special', 0.4));
}
function dktTravelUI(pi, cost, free){
  var h = '<div class="modal dkt-mod dkt-trav">'
    + '<div class="dkt-rib dkt-blue"><b>' + esc(G.map.corners[3]) + '</b></div>'
    + dktSvg('portal')
    + '<p class="dkt-lead">好きなマスへひとっ飛びできます</p>'
    + '<div class="dkt-fee"><span>旅費</span><b>' + (free ? '無料' : yen(cost)) + '</b>'
    +   (free ? '<i>旅行招待券</i>' : '') + '</div>'
    + '<div class="dkt-btns">'
    +   '<button type="button" class="dkt-btn dkt-no" data-act="no">取り消す<small>このターンは1回休み</small></button>'
    +   '<button type="button" class="dkt-btn dkt-go" data-act="go">行き先を選ぶ</button>'
    + '</div></div>';
  return modal(h).then(function(a){ return a === 'go'; });
}
async function dkTravelTurn(pi){
  var p = G.players[pi];
  p.travel = false;
  var free = !!p.travelFree, cost = free ? 0 : dktTravelCost(p), nm = G.map.corners[3];
  var tc = tileCenter(24);
  dktFocus(tc.x, tc.y, 1.3);
  G.phase = 'travel';
  if(p.cash < cost){
    await band('旅費 ' + yen(cost) + ' が足りません', 'このターンは普通にサイコロを振ります', 1300);
    camReset();
    return 'roll';
  }
  var go = await dvAsk(pi, 'travel', function(){
    return (p.kind === 'cpu') ? true : dktTravelUI(pi, cost, free);
  }, '行き先を考えています');
  var dest = -1;
  if(go){
    if(p.kind === 'cpu'){
      dest = aiPickTravel(pi);
      if(dest === 24 || dest < 0){ var all = []; for(var i = 0; i < 32; i++) if(i !== 24 && i !== 8) all.push(i); dest = dktBestTile(pi, all); }
    } else {
      dktSetPick(nm, '観光地とランドマークは買収できません');
      dest = await pickTile(pi, '行き先を選んでください', function(i){ return i !== 24; });
    }
  }
  if(!go || !(dest >= 0) || dest === 24){
    await band('旅行を取り消しました', 'このターンは1回休みです', 1200);
    camReset();
    return 'skip';
  }
  if(cost > 0) give(pi, -cost);
  if(free){ if(typeof p.travelFree === 'number') p.travelFree = Math.max(0, p.travelFree - 1); else p.travelFree = false; }
  news(p.name + ' が ' + nm + ' から ' + G.tiles[dest].name + ' へ旅立ちました');
  await jumpTo(pi, dest);
  await resolve(pi);
  return 'done';
}

/* ══════════ 国税庁・観光地の訪問 ══════════ */
function dktTaxOf(pi){
  var sum = 0;
  G.tiles.forEach(function(t){ if(t.type === 'city' && t.owner === pi) sum += cityValue(t); });
  return Math.round(sum * 0.10 * statMul(G.players[pi], 'special', 0.4));
}
function dktVisit(t){ if(t && t.tour === 'pink'){ t.visits = (t.visits | 0) + 1; boardChanged(); } }

/* ══════════ マスの解決 ══════════ */
async function resolveInner(pi){
  var p = G.players[pi], i = p.pos, t = G.tiles[i];
  var c = tileCenter(i);
  dktFocus(c.x, c.y, 1.55);
  await wait(160);

  if(t.type === 'start'){
    // 本家：スタートにぴったり到着すると、好きな自分の街に1段建てられる
    await band('スタートにぴったり！', '好きな自分の街を1段そだてられます', 1400);
    var grow = function(z){ var tz = G.tiles[z]; return tz.type === 'city' && tz.owner === pi && !tz.landmark && !tz.tour; };
    var mine0 = [];
    for(var z = 0; z < 32; z++) if(grow(z)) mine0.push(z);
    if(mine0.length){
      var d0;
      if(p.kind === 'cpu') d0 = mine0.reduce(function(a, b){ return tollOf(G.tiles[b], G) > tollOf(G.tiles[a], G) ? b : a; });
      else { dktSetPick(G.map.corners[0], '光っている自分の街が1段育ちます'); d0 = await pickTile(pi, 'そだてる街を選んでください', grow); }
      if(d0 >= 0){ var t0 = G.tiles[d0];
        if(t0.lv >= 3) t0.landmark = true; else t0.lv = Math.min(3, t0.lv + 1);
        await growAnim(d0); }
    } else { give(pi, 600000); toast('R', '💴', '街がまだありません', 'かわりに 60万 を受け取りました', 2000); }
  }
  else if(t.type === 'jail'){
    p.jail = 3; p.dblRun = 0; p.travel = false; SFX.bad(); camShake(10);
    await band(G.map.corners[1] + 'に閉じ込められました！',
      'ダブル・保釈金 ' + yen(dktJailFee(p)) + (p.escapeTix > 0 ? '・脱出カード' : '') + ' で出られます（最大3ターン）', 1800);
  }
  else if(t.type === 'olympic'){
    // フェスティバル：費用を払って自分の街の通行料を上げる（重ねるほど上がり、最大5倍）。観光地は対象外
    var fest = dktFestName();
    var can = function(z){ var tz = G.tiles[z]; return tz.type === 'city' && tz.owner === pi && tz.olym < 5 && !tz.tour; };
    var mine = [];
    for(var z2 = 0; z2 < 32; z2++) if(can(z2)) mine.push(z2);
    if(!mine.length){
      await band(fest + ' の会場', '開催できる自分の街がありません', 1500);
    } else {
      var cost = Math.round(Math.max(150000, assetOf(G, pi) * 0.05) * statMul(p, 'special', 0.4));
      if(p.cash < cost){
        await band(fest + ' を開催できません', '費用 ' + yen(cost) + ' が足りません', 1600);
      } else {
        await band(fest + ' を開催！', '費用 ' + yen(cost) + ' で自分の街の通行料を上げられます', 1600);
        var d;
        if(p.kind === 'cpu') d = mine.reduce(function(a, b){ return tollOf(G.tiles[b], G) > tollOf(G.tiles[a], G) ? b : a; });
        else { dktSetPick(fest, '開催した街の通行料が上がります（最大 ×5）'); d = await pickTile(pi, '開催する街を選んでください', can); }
        if(d >= 0){
          give(pi, -cost);
          var tz = G.tiles[d];
          tz.olym = Math.min(5, tz.olym + 1);
          boardChanged(); SFX.landmark(); camShake(10);
          addFx('pillar', tileCenter(d).x, tileCenter(d).y, 1000, '#FFD24D');
          raiseBanner('通行料 ×' + tz.olym + '！');
          toast('R', '🎪', fest, tz.name + ' の通行料が ×' + tz.olym + ' になりました', 2400);
          news(p.name + ' が ' + tz.name + ' で' + fest + 'を開催！ 通行料 ×' + tz.olym);
        }
      }
    }
  }
  else if(t.type === 'travel'){
    // 黄金フリーパス：その場で最適なマスへ跳ぶ（ペンダントの効果）
    if(await pendFire(pi, 'onTravel', { pick:true }) === 'jumped'){ await resolve(pi); return; }
    p.travel = true;
    await band(G.map.corners[3] + 'に到着', '次のターンに利用することができます', 1500);
  }
  else if(t.type === 'minigame' || t.type === 'bonus'){
    await miniGame(pi);
  }
  else if(t.type === 'tax'){
    var amt = dktTaxOf(pi);
    if(amt > 0){
      if(!(await dkPayFrom(pi, amt, -1))){ await bankrupt(pi, -1); return; }
      give(pi, -amt);
      toast('L', '🧾', t.name, '所有地の建設費用の10%　' + yen(amt) + ' を納めました', 1900);
    } else toast('L', '🧾', t.name, '土地を持っていないので、納める税はありません', 1700);
  }
  else if(t.type === 'card'){ await chanceCard(pi); }
  else if(t.type === 'city'){
    // 幸運のトランポリン：自分の街に止まったとき同じ辺の別の街へ跳ぶ
    if(t.owner === pi && (await pendFire(pi, 'onOwnLand')) === 'jumped'){ dktVisit(t); await resolve(pi); return; }
    if(t.owner < 0 || t.owner === pi){
      if(p.kind === 'cpu') await aiBuy(pi, i); else await buyUI(pi, i);
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

/* ══════════ ターン進行 ══════════ */
async function turnLoop(){
  var g0 = G;
  if(!g0 || g0.dktLoop) return;              // 同じ試合でループが2本にならない（もう一回の二度押し）
  g0.dktLoop = true;
  g0.running = true;
  // 前の試合の入力が残っていたら片付ける（途中でやめて始め直した時）
  try{
    if(DKT_G.pick && DKT_G.pick.g !== g0) dktPickEnd(-1);
    var pe = document.getElementById('pickeye'); if(pe) pe.classList.remove('on');
    if(DKT_G.inp && !DKT_G.inp.done){ DKT_G.inp.done = true; dktUnwire(DKT_G.inp); dktHideInput(); }
  }catch(e){ console.error('[WP6]', e); }
  try{
    while(G === g0 && !g0.over){
      var pi = G.turn, p = G.players[pi];
      if(p.out){ nextTurn(); if(G.turnsLeft <= 0){ timeUp(); break; } continue; }
      G.turnSerial = (G.turnSerial | 0) + 1;
      p.dktTurns = (p.dktTurns | 0) + 1;
      G.tiles.forEach(function(t){ if(t.frozen > 0) t.frozen--; });
      if(p.tollUp > 0) p.tollUp--;
      p.mana = Math.min(100, p.mana + 34);
      updHUD();
      await turnBig(pi);
      if(G !== g0 || g0.over) break;
      if(p.jail > 0){
        p.travel = false;
        await jailTurn(pi);
      } else {
        var mode = 'roll';
        if(p.travel) mode = await dkTravelTurn(pi);
        if(mode === 'roll' && G === g0 && !g0.over && !p.out) await dktRollPhase(pi, g0);
      }
      if(G !== g0 || g0.over) break;
      var before = G.turnsLeft;
      nextTurn();
      if(G.turnsLeft <= 0){ timeUp(); break; }
      if(before !== G.turnsLeft && G.turnsLeft === INFL_FROM) bgm('tense');   // インフレ開始と同時に曲を切り替える
      await wait(240);
    }
  } finally {
    g0.dktLoop = false;
    if(G === g0) g0.running = false;
  }
}
/* サイコロ → 移動 → マス。ダブルはもう一回（3回続くと監獄） */
async function dktRollPhase(pi, g0){
  var p = G.players[pi];
  var again = true, guard = 0;
  while(again && G === g0 && !G.over && !p.out && guard++ < 4){
    again = false;
    G.phase = 'wait';
    updHUD();
    var r = await takeRoll(pi);
    if(G !== g0 || G.over || !r || r.cancelled || p.out) break;
    // 振る前に能力・持ち物のワープで監獄へ入った／世界旅行マスに着いた → このターンは動かない
    if(p.jail > 0 || p.travel) break;
    G.phase = 'move';
    if(r.isDbl){
      p.dblRun++;
      if(p.dblRun >= 3){
        await band('ダブル 3回！', G.map.corners[1] + 'へ送られます', 1700);
        await jumpTo(pi, 8); p.jail = 3; p.dblRun = 0; p.travel = false; break;
      }
      await moveSteps(pi, r.total);
      await resolve(pi);
      if(G !== g0 || G.over || p.out) break;
      if(p.jail > 0 || p.travel) break;      // 監獄に入った／旅行は次のターン → ダブルでも終わり
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
      toast('R', '🔮', '追加のサイコロ', 'もう一回サイコロを振れます', 1700);
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
  // 終盤インフレ（残り6ターンから毎ターン1.5倍）
  if(G.turnsLeft < before && G.turnsLeft <= INFL_FROM && G.turnsLeft > 0){
    G.infl = G.infl * INFL_STEP;
    raiseBanner('通行料 ×' + inflTxt() + '！');
    news('🔥 のこり' + G.turnsLeft + 'ターン — 通行料が ×' + inflTxt() + ' になりました');
    SFX.warn(); camShake(9);
  }
  camReset(); updHUD();
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
  if(kind === 'portal') return '<svg class="dkt-art" viewBox="0 0 160 110" aria-hidden="true">'
    + '<defs><radialGradient id="dktPg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="#9CE8FF"/><stop offset=".75" stop-color="#2E8BE0"/><stop offset="1" stop-color="#0B2C5E"/></radialGradient>'
    + '<linearGradient id="dktPr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6D0"/><stop offset=".5" stop-color="#E0AE3A"/><stop offset="1" stop-color="#6B4408"/></linearGradient></defs>'
    + '<ellipse cx="80" cy="96" rx="58" ry="10" fill="rgba(0,0,0,.35)"/>'
    + '<ellipse cx="80" cy="56" rx="54" ry="40" fill="url(#dktPg)" stroke="url(#dktPr)" stroke-width="8"/>'
    + '<ellipse cx="80" cy="56" rx="34" ry="24" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-dasharray="10 8"/>'
    + '<ellipse cx="80" cy="56" rx="18" ry="12" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="3"/>'
    + '<path d="M80 44l3.5 7 7.6 1.1-5.5 5.4 1.3 7.6L80 61.5l-6.9 3.6 1.3-7.6-5.5-5.4 7.6-1.1z" fill="#FFF4B8"/>'
    + '<circle cx="36" cy="22" r="3" fill="#FFF4B8"/><circle cx="128" cy="30" r="2.4" fill="#FFF4B8"/><circle cx="118" cy="12" r="1.8" fill="#FFFFFF"/></svg>';
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
    if(typeof gcv !== 'undefined' && gcv){ gcv.width = DKT_GW * 2; gcv.height = DKT_GH * 2; }
    var ui = document.getElementById('diceui'), push = document.getElementById('push');
    if(ui && push){
      if(!ui.querySelector('.dkt-halo')){
        var h = document.createElement('div'); h.className = 'dkt-halo'; h.setAttribute('aria-hidden', 'true');
        ui.insertBefore(h, push);
      }
      if(!ui.querySelector('.dkt-cap')){
        var c = document.createElement('div'); c.className = 'dkt-cap'; ui.appendChild(c);
      }
      push.setAttribute('type', 'button');
      push.innerHTML = '<b class="dkt-pl">押す</b><i class="dkt-ps">長押しでねらう</i>';
    }
    ['odd', 'even'].forEach(function(id){ var b = document.getElementById(id); if(b) b.setAttribute('type', 'button'); });
    DKT_G.el = null;
  }catch(e){ console.error('[WP6]', e); }
})();
