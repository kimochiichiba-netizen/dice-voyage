
/* ══════════════════════════════════════════════════════════════
   ダイスボヤージュ — ゲーム進行・演出・CPU・画面
   ══════════════════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
let SPEED = 1;                       // アニメ速度倍率（大きいほど遅い）
const wait = ms => new Promise(r => setTimeout(r, Math.max(0, ms*SPEED)));

/* ══════════ ステージのフィット（横画面バグ対策の要） ══════════ */
let forcePortrait = false, portraitDir = 90;
function fitStage(){
  const vw = window.innerWidth, vh = window.innerHeight;
  const stage = $('#stage');
  const portrait = vh > vw * 1.02;
  if(portrait && !forcePortrait){
    $('#rotate').classList.add('on');
  } else {
    $('#rotate').classList.remove('on');
  }
  let s, rot = '';
  if(portrait && forcePortrait){
    s = Math.min(vh/SW, vw/SH);          // 90°回して詰める
    rot = ' rotate('+portraitDir+'deg)';
  } else {
    s = Math.min(vw/SW, vh/SH);
  }
  stage.style.transform = 'translate(-50%,-50%)'+rot+' scale('+s+')';
  const c = $('#world');
  const dpr = Math.min(2, window.devicePixelRatio||1);
  if(c.width !== Math.round(SW*dpr)){
    c.width = Math.round(SW*dpr); c.height = Math.round(SH*dpr);
  }
}
addEventListener('resize', fitStage);
addEventListener('orientationchange', ()=>setTimeout(fitStage,120));
$('#playPortrait').onclick  = ()=>{ forcePortrait = true; portraitDir =  90; fitStage(); };
$('#playPortrait2').onclick = ()=>{ forcePortrait = true; portraitDir = -90; fitStage(); };

/* ══════════ サウンド（合成・外部ファイルなし） ══════════ */
let AC = null, soundOn = true;
function ac(){ if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return AC; }
function beep(f, dur, type, vol, slide){
  if(!soundOn) return; const a = ac(); if(!a) return;
  if(a.state==='suspended') a.resume();
  const o = a.createOscillator(), g = a.createGain();
  o.type = type||'sine'; o.frequency.setValueAtTime(f, a.currentTime);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,slide), a.currentTime+dur);
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.exponentialRampToValueAtTime(vol||0.14, a.currentTime+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+dur);
  o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+dur+0.02);
}
function noise(dur, vol){
  if(!soundOn) return; const a = ac(); if(!a) return;
  const n = a.sampleRate*dur, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/n, 2.2);
  const src = a.createBufferSource(); src.buffer = buf;
  const g = a.createGain(); g.gain.value = vol||0.12;
  src.connect(g); g.connect(a.destination); src.start();
}
const SFX = {
  hop:   ()=>beep(520, .06, 'square', .06, 700),
  land:  ()=>{ noise(.13,.16); beep(160,.12,'sine',.12,90); },
  dice:  ()=>{ noise(.05,.09); },
  coin:  ()=>{ beep(880,.09,'triangle',.11); setTimeout(()=>beep(1320,.13,'triangle',.10),70); },
  pay:   ()=>{ beep(300,.16,'sawtooth',.09,140); },
  build: ()=>{ beep(420,.1,'triangle',.11); setTimeout(()=>beep(630,.12,'triangle',.11),90);
               setTimeout(()=>beep(840,.18,'triangle',.10),190); },
  bad:   ()=>{ beep(200,.28,'sawtooth',.11,90); },
  win:   ()=>{ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.4,'triangle',.13),i*130)); },
  click: ()=>beep(700,.04,'square',.05)
};

/* ══════════ 状態 ══════════ */
let G = null, cfg = { mapId:'ice', turns:30, cash:20000000, ai:1, speed:1,
  seats:[{name:'あなた',kind:'you'},{name:'CPU アオ',kind:'cpu'},
         {name:'CPU ミドリ',kind:'cpu'},{name:'CPU キイロ',kind:'cpu'}], n:4 };

function newGame(){
  const map = MAPS.find(m=>m.id===cfg.mapId) || MAPS[0];
  G = {
    map, tiles: buildTiles(map),
    players: cfg.seats.slice(0,cfg.n).map((s,i)=>({
      name:s.name, kind:s.kind, cash:cfg.cash, pos:0, laps:0, jail:0, out:false,
      dblRun:0, odd:2, even:2, freeToll:0, bonusBuild:0,
      render:tileCenter(0), hopY:0, squash:1, offx:0, offy:0
    })),
    turn:0, turnsLeft:cfg.turns, phase:'idle', over:false, winner:-1, winReason:''
  };
}

/* ══════════ 描画ループ ══════════ */
const cv = $('#world'); const ctx = cv.getContext('2d');
let last = 0;
function frame(now){
  const dt = Math.min(50, now - last); last = now;
  camStep(dt/1000);
  const dpr = cv.width / SW;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,SW,SH);
  if(G){
    ctx.save();
    ctx.translate(SW/2, SH/2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
    drawBackdrop(ctx, G.map, now);
    drawLake(ctx, G.map, now);
    drawSlab(ctx, G.map);
    layoutTokens();
    const list = [];
    for(let i=0;i<32;i++) list.push({y:tileCenter(i).y, f:()=>drawTile(ctx,G,i,now)});
    for(let i=0;i<32;i++) if(G.tiles[i].type==='city' && G.tiles[i].owner>=0)
      list.push({y:tileCenter(i).y+0.4, f:()=>drawBuilding(ctx,G,i,now)});
    G.players.forEach((p,i)=>{ if(!p.out)
      list.push({y:(p.render?p.render.y:tileCenter(p.pos).y)+0.8, f:()=>drawToken(ctx,G,i,now)}); });
    list.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
    drawSteps(ctx, G);
    drawDice(ctx, now);
    drawFlashes(ctx, dt); drawParts(ctx, dt); drawFloats(ctx, dt);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(SW/2, SH/2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
    drawBackdrop(ctx, MAPS[0], now);
    ctx.restore();
  }
  if(diceAnim){ diceAnim.t += dt; if(diceAnim.t > diceAnim.dur + 420) diceAnim = null; }
  drawGauge(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* 同じマスに重なったコマをずらす */
function layoutTokens(){
  const by = {};
  G.players.forEach((p,i)=>{ if(p.out) return; (by[p.pos] = by[p.pos]||[]).push(i); });
  Object.values(by).forEach(arr=>{
    arr.forEach((pi,k)=>{
      const p = G.players[pi];
      if(arr.length===1){ p.offx=0; p.offy=0; }
      else { p.offx = (k - (arr.length-1)/2) * 22; p.offy = (k%2)*7; }
      if(!p.moving) p.render = tileCenter(p.pos);
    });
  });
}

/* ══════════ パワーゲージ ══════════ */
const gcv = $('#gauge'), gctx = gcv.getContext('2d');
let gaugeOn = false, gaugeSweet = 0.5, gaugePhase = 0;
function drawGauge(T){
  if(!gaugeOn){ gctx.clearRect(0,0,gcv.width,gcv.height); return; }
  gaugePhase = (Math.sin(T*0.0034) + 1) / 2;
  const W = gcv.width, H = gcv.height;
  gctx.clearRect(0,0,W,H);
  const cx = W/2, cy = H*0.97, RX = W*0.45, RY = H*0.82;
  const A0 = Math.PI*1.06, A1 = Math.PI*1.94;
  gctx.lineCap = 'round';
  gctx.lineWidth = 22;
  gctx.strokeStyle = 'rgba(74,90,100,.62)';
  gctx.beginPath(); gctx.ellipse(cx,cy,RX,RY,0,A0,A1); gctx.stroke();
  // スイートスポット
  const sA = A0 + (A1-A0)*(gaugeSweet-0.075), eA = A0 + (A1-A0)*(gaugeSweet+0.075);
  gctx.strokeStyle = 'rgba(243,114,221,.95)';
  gctx.beginPath(); gctx.ellipse(cx,cy,RX,RY,0,sA,eA); gctx.stroke();
  // ヘッド
  const hA = A0 + (A1-A0)*gaugePhase;
  const hx = cx + Math.cos(hA)*RX, hy = cy + Math.sin(hA)*RY;
  const g = gctx.createRadialGradient(hx,hy,1,hx,hy,26);
  g.addColorStop(0,'rgba(255,255,220,1)'); g.addColorStop(.4,'rgba(255,246,192,.9)');
  g.addColorStop(1,'rgba(255,240,150,0)');
  gctx.fillStyle=g; gctx.beginPath(); gctx.arc(hx,hy,26,0,6.283); gctx.fill();
  gctx.fillStyle='#fff'; gctx.beginPath(); gctx.arc(hx,hy,7,0,6.283); gctx.fill();
}

/* ══════════ HUD ══════════ */
function rank(){
  return G.players.map((p,i)=>({i, a: p.out ? -1 : assetOf(G,i)}))
    .sort((x,y)=>y.a-x.a);
}
function updHUD(){
  if(!G) return;
  const rk = rank();
  const rankOf = pi => rk.findIndex(r=>r.i===pi)+1;
  const cur = G.turn;
  const lead = rk[0].i === cur ? (rk[1] ? rk[1].i : cur) : rk[0].i;
  fillHUD('Top', lead, rankOf(lead), 'top');
  fillHUD('Bot', cur,  rankOf(cur),  'bot');
  $('#rTop').innerHTML = rankOf(lead)+'<span>位</span>';
  $('#rBot').innerHTML = rankOf(cur)+'<span>位</span>';
  $('#rTop').className = 'rankbadge' + (rankOf(lead)===1 ? ' red' : '');
  $('#rBot').className = 'rankbadge' + (rankOf(cur)===1 ? ' red' : '');
  $('#pTurn').textContent = G.turnsLeft;
  $('#pGoal').textContent = yen(rk[0].a);
  $('#pGoalL').textContent = G.players[rk[0].i].name;
  // サイド一覧
  const sh = $('#sideHud'); sh.innerHTML = '';
  rk.forEach((r,k)=>{
    const p = G.players[r.i];
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:7px;background:rgba(10,20,34,.72);'
      +'border:1px solid #2f4a6d;border-left:5px solid '+PCOL[r.i]+';border-radius:9px;padding:5px 9px;'
      +'font-size:13px;font-weight:900;min-width:212px;'+(p.out?'opacity:.4;':'')
      +(G.turn===r.i?'box-shadow:0 0 0 2px rgba(255,224,138,.75);':'');
    d.innerHTML = '<span style="font-family:var(--pop);font-size:15px;color:#FFE08A">'+(k+1)+'</span>'
      + '<span style="font-size:17px">'+PICO[r.i]+'</span>'
      + '<span style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">'+esc(p.name)+'</span>'
      + '<span style="font-family:var(--pop);font-size:14px;color:#9FD8F8">'+(p.out?'破産':yen(r.a))+'</span>';
    sh.appendChild(d);
  });
  // 凡例（グループの持ち主）
  const lg = $('#legend'); lg.innerHTML = '';
  CITY_SLOTS.forEach((slots,g)=>{
    const owners = slots.map(i=>G.tiles[i].owner);
    const uni = owners.every(o=>o>=0 && o===owners[0]) ? owners[0] : -1;
    const got = owners.filter(o=>o>=0).length;
    const d = document.createElement('div');
    d.innerHTML = '<i style="background:'+GCOL[g]+'"></i>'
      + '<span style="color:'+(uni>=0?PCOL[uni]:'#CBDCEE')+'">'+got+'/3</span>';
    lg.appendChild(d);
  });
}
function fillHUD(sfx, pi, rk, cls){
  const p = G.players[pi];
  $('#f'+sfx+'Name').textContent = p.name;
  $('#f'+sfx+'Name').style.background = 'linear-gradient(90deg,'+PCOL[pi]+','+shade(PCOL[pi],-.4)+')';
  $('#f'+sfx+'Face').style.borderColor = PCOL[pi];
  $('#f'+sfx+'Face').lastChild.nodeValue = PICO[pi];
  $('#f'+sfx+'Cls').textContent = cls==='bot' ? '手番' : (p.kind==='cpu' ? 'CPU' : 'P'+(pi+1));
  rollNum($('#f'+sfx+'Cash'), p.cash);
  rollNum($('#f'+sfx+'Asset'), assetOf(G,pi));
  const cities = G.tiles.filter(t=>t.type==='city' && t.owner===pi).length;
  $('#f'+sfx+'Gauge').style.width = Math.min(100, cities/21*100)+'%';
}
/* 数字のローリング表示 */
function rollNum(el, to){
  const from = +(el.dataset.v||0);
  if(from === to){ el.textContent = yen(to); return; }
  el.dataset.v = to;
  let t0 = null; const D = 700*SPEED;
  function step(now){
    if(t0 === null) t0 = now;                 // 最初のフレームを基準にする（時計の混在を避ける）
    const k = Math.max(0, Math.min(1,(now-t0)/D)), e = 1-Math.pow(1-k,3);
    el.textContent = yen(from + (to-from)*e);
    if(k<1) requestAnimationFrame(step); else el.textContent = yen(to);
  }
  requestAnimationFrame(step);
}
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ══════════ 演出ヘルパ ══════════ */
function toast(side, icon, title, sub, ms){
  const box = $(side==='L' ? '#toastL' : '#toastR');
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = '<div class="ic">'+icon+'</div><div class="tx"><b>'+esc(title)+'</b>'
    + (sub?'<i>'+esc(sub)+'</i>':'') + '</div>';
  box.appendChild(d);
  setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(), 260); }, (ms||2200)*SPEED);
}
function pill(pi, amount){
  const up = amount >= 0;
  const d = document.createElement('div');
  d.className = 'pill ' + (up?'up':'dn');
  d.innerHTML = '<span class="ar">'+(up?'▲':'▼')+'</span><em>'+yen(Math.abs(amount))+'</em>';
  const bottom = (pi === G.turn);
  d.style.cssText += bottom ? 'right:2%;bottom:13%;' : 'left:2%;top:14%;';
  $('#stage').appendChild(d);
  setTimeout(()=>{ d.classList.add('fade'); setTimeout(()=>d.remove(), 480); }, 900*SPEED);
}
async function band(title, sub, ms){
  $('#bandT').textContent = title;
  $('#bandS').textContent = sub||'';
  $('#band').classList.add('on');
  await wait(ms||1500);
  $('#band').classList.remove('on');
}
function showChip(n, isDouble){
  const c = $('#chip');
  c.textContent = n; c.classList.remove('hide'); c.classList.remove('pop');
  void c.offsetWidth; c.classList.add('pop');
  if(isDouble){ const d=$('#dbl'); d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop'); }
}
function hideChip(){
  $('#chip').classList.remove('pop'); $('#chip').classList.add('hide');
  $('#dbl').classList.remove('pop'); $('#dbl').style.transform='translateX(-50%) scale(0)';
}
function modal(html){
  return new Promise(res=>{
    const wrap = $('#modalWrap'), body = $('#modalBody');
    body.innerHTML = html;
    wrap.classList.add('on');
    body.querySelectorAll('[data-act]').forEach(b=>{
      b.onclick = ()=>{ SFX.click(); wrap.classList.remove('on'); res(b.dataset.act); };
    });
    wrap._res = res;
  });
}
function closeModal(){ $('#modalWrap').classList.remove('on'); }

/* ══════════ お金 ══════════ */
function give(pi, amount, why){
  G.players[pi].cash += amount;
  pill(pi, amount);
  const c = G.players[pi].render || tileCenter(G.players[pi].pos);
  addFloat(c.x, c.y-70, (amount>=0?'+':'')+yen(amount), amount>=0?'#FFD24D':'#FFFFFF', true);
  if(amount>=0) SFX.coin(); else SFX.pay();
  updHUD();
}
/* 支払えない時：建物を売って現金化 → それでも無理なら破産 */
function raiseCash(pi, need){
  const p = G.players[pi];
  const mine = G.tiles.map((t,i)=>({t,i})).filter(o=>o.t.type==='city'&&o.t.owner===pi);
  mine.sort((a,b)=>a.t.base-b.t.base);
  for(const o of mine){
    while(p.cash < need && (o.t.lv>0 || o.t.landmark)){
      if(o.t.landmark){ p.cash += Math.round(BUILD[4].cost(o.t.base)*0.6); o.t.landmark=false; }
      else { p.cash += Math.round(BUILD[o.t.lv].cost(o.t.base)*0.6); o.t.lv--; }
    }
    if(p.cash >= need) return true;
  }
  for(const o of mine){
    if(p.cash >= need) return true;
    p.cash += Math.round(o.t.base*0.6); o.t.owner=-1; o.t.lv=0; o.t.landmark=false;
  }
  return p.cash >= need;
}

/* ══════════ サイコロ ══════════ */
function rollPair(force){
  let a = 1+Math.floor(Math.random()*6), b = 1+Math.floor(Math.random()*6);
  if(force){
    let guard = 0;
    while(((a+b)%2 === 0 ? 'even':'odd') !== force && guard++ < 60){
      a = 1+Math.floor(Math.random()*6); b = 1+Math.floor(Math.random()*6);
    }
  }
  return [a,b];
}
async function doRoll(pi, force, impact){
  gaugeOn = false; $('#diceui').classList.remove('on');
  stepPreview = null;
  let [a,b] = rollPair(force);
  if(impact){
    // ゲージインパクト：2回振って有利な方を採用
    const c = rollPair(force);
    const s1 = scoreLanding(pi, a+b), s2 = scoreLanding(pi, c[0]+c[1]);
    if(s2 > s1){ a=c[0]; b=c[1]; }
    toast('R','🎯','ゲージインパクト成功！','出目をコントロールしました',1800);
  }
  diceAnim = {t:0, dur:820, a, b};
  const tick = setInterval(()=>SFX.dice(), 70);
  await wait(880);
  clearInterval(tick);
  const cc = tileCenter(G.players[pi].pos);
  addFlash(BCX, BCY+30);
  burst(BCX, BCY+30, 46, ['#FFD24D','#FFF3C0','#7FD9F0','#F372DD','#FFFFFF']);
  SFX.land();
  const total = a+b, isDbl = a===b;
  showChip(total, isDbl);
  await wait(isDbl ? 780 : 520);
  hideChip();
  return {a,b,total,isDbl};
}
/* CPU / インパクト判定用：その出目で進んだ結果の良さ */
function scoreLanding(pi, n){
  const to = (G.players[pi].pos + n) % 32;
  const t = G.tiles[to];
  if(t.type==='city'){
    if(t.owner<0) return 60 + t.base/200000;
    if(t.owner===pi) return 40;
    return -tollOf(t,G)/120000;
  }
  if(t.type==='jail') return -70;
  if(t.type==='tax') return -25;
  if(t.type==='bonus') return 50;
  if(t.type==='card') return 20;
  if(t.type==='travel') return 45;
  if(t.type==='adventure') return 45;
  return 10;
}

/* ══════════ 移動 ══════════ */
function hop(p, from, to, dur){
  return new Promise(res=>{
    p.moving = true;
    let t0 = null; const D = dur*SPEED;
    requestAnimationFrame(function step(now){
      if(t0 === null) t0 = now;
      const k = Math.max(0, Math.min(1,(now-t0)/D));
      p.render = { x: from.x+(to.x-from.x)*k, y: from.y+(to.y-from.y)*k };
      p.hopY = Math.sin(k*Math.PI)*36;
      if(k<1) requestAnimationFrame(step);
      else {
        p.render = to; p.hopY = 0; p.moving = false; p.squash = 1.22;
        SFX.hop();
        let t1 = null;
        requestAnimationFrame(function un(n2){
          if(t1 === null) t1 = n2;
          const k2 = Math.max(0, Math.min(1,(n2-t1)/(140*SPEED)));
          p.squash = 1.22 + (1-1.22)*k2;
          if(k2<1) requestAnimationFrame(un); else p.squash = 1;
        });
        res();
      }
    });
  });
}
async function moveSteps(pi, n){
  const p = G.players[pi];
  camTo(tileCenter(p.pos).x, tileCenter(p.pos).y, 1.42);
  for(let k=0;k<n;k++){
    const from = tileCenter(p.pos);
    const np = (p.pos+1) % 32;
    p.pos = np;
    const to = tileCenter(np);
    camTo(to.x, to.y, 1.42);
    if(np===0) p.laps++;
    await hop(p, from, to, 158);
    if(np===0 && k < n-1) salary(pi);
  }
  await wait(180);
}
function salary(pi){
  const amt = 2000000 + G.players[pi].laps*500000;
  give(pi, amt, 'salary');
  toast('R','🚩','スタート通過','給料 '+yen(amt)+' を受け取りました',1800);
}
async function jumpTo(pi, idx){
  const p = G.players[pi];
  const from = tileCenter(p.pos); p.pos = idx;
  const to = tileCenter(idx);
  camTo(to.x, to.y, 1.42);
  burst(from.x, from.y, 26, ['#7FD9F0','#FFFFFF','#F372DD']);
  await hop(p, from, to, 520);
}

/* ══════════ マスの解決 ══════════ */
let resolveDepth = 0;
async function resolve(pi){
  if(resolveDepth > 3) return;            // ワープの連鎖を止める安全弁
  resolveDepth++;
  try { await resolveInner(pi); } finally { resolveDepth--; }
}
async function resolveInner(pi){
  const p = G.players[pi], i = p.pos, t = G.tiles[i];
  const c = tileCenter(i);
  camTo(c.x, c.y, 1.5);
  await wait(160);

  if(t.type === 'start'){
    const amt = 4000000;
    give(pi, amt); await band('スタートにぴったり！','給料が2倍になりました', 1300);
  }
  else if(t.type === 'jail'){
    p.jail = 3; p.dblRun = 0;
    SFX.bad();
    await band(G.map.corners[1]+'に閉じ込められました！','3ターンのあいだ移動できません（ゾロ目で脱出）', 1800);
  }
  else if(t.type === 'travel'){
    await band(G.map.corners[2]+'に到着','行きたいマスを1つ選べます', 1200);
    const dest = (p.kind==='cpu') ? aiPickTravel(pi) : await pickTile(pi, '行き先を選んでください');
    if(dest>=0 && dest!==i){ await jumpTo(pi, dest); await resolve(pi); return; }
  }
  else if(t.type === 'adventure'){
    p.bonusBuild++;
    const amt = 1000000 + Math.floor(Math.random()*3)*500000;
    give(pi, amt);
    await band(G.map.corners[3]+'に到着','建設1回ぶんが無料になります（次の建設で使用）', 1500);
  }
  else if(t.type === 'bonus'){
    give(pi, t.amount);
    toast('R','💰','ボーナス', yen(t.amount)+' を受け取りました', 1900);
  }
  else if(t.type === 'tax'){
    const amt = Math.round(assetOf(G,pi) * t.rate);
    if(!payFrom(pi, amt)) { await bankrupt(pi, -1); return; }
    give(pi, -amt);
    toast('L','🧾','税金', '総資産の10%（'+yen(amt)+'）を納めました', 1900);
  }
  else if(t.type === 'card'){
    await chanceCard(pi);
  }
  else if(t.type === 'city'){
    if(t.owner < 0){
      if(p.kind==='cpu') await aiBuy(pi, i); else await buyUI(pi, i);
    } else if(t.owner === pi){
      if(p.kind==='cpu') await aiBuy(pi, i); else await buyUI(pi, i);
    } else {
      await payToll(pi, i);
      if(G.over || G.players[pi].out) return;
      await maybeBuyout(pi, i);
    }
  }
  if(checkWin()) return;
  camReset();
}
function payFrom(pi, amt){
  const p = G.players[pi];
  if(p.cash >= amt) return true;
  return raiseCash(pi, amt);
}
async function payToll(pi, i){
  const t = G.tiles[i], owner = t.owner;
  let amt = tollOf(t, G);
  const p = G.players[pi];
  if(p.freeToll > 0){
    p.freeToll--;
    toast('R','🪽','天使カードを使用','通行料 '+yen(amt)+' → 無料', 2000);
    await wait(900); return;
  }
  const extra = [];
  if(hasTriple(G, owner, t.g)) extra.push('トリプル独占 ×2');
  if(hasLine(G, owner, Math.floor(i/8))) extra.push('ライン独占 ×2');
  await band('通行料 '+yen(amt), extra.length ? extra.join(' / ') : (G.players[owner].name+' に支払います'), 1400);
  if(!payFrom(pi, amt)){ await bankrupt(pi, owner); return; }
  give(pi, -amt); give(owner, amt);
  await wait(500);
}
async function maybeBuyout(pi, i){
  const t = G.tiles[i], p = G.players[pi];
  if(t.landmark) return;
  const cost = Math.round(cityValue(t) * 2);
  if(p.cash < cost) return;
  let yes;
  if(p.kind==='cpu') yes = aiBuyout(pi, i, cost);
  else yes = (await modal(deedHTML(i, '買収', cost,
      G.players[t.owner].name+' の街を2倍の値段で買い取れます。'))) === 'ok';
  if(!yes) return;
  give(pi, -cost); give(t.owner, cost);
  t.owner = pi;
  SFX.build();
  burst(tileCenter(i).x, tileCenter(i).y, 40, ['#FFD24D','#FFFFFF','#F372DD']);
  toast('R','📜','買収成立', t.name+' を手に入れました', 2100);
  checkWin();
}
function cityValue(t){
  let v = t.base;
  for(let k=1;k<=t.lv;k++) v += BUILD[k].cost(t.base);
  if(t.landmark) v += BUILD[4].cost(t.base);
  return v;
}

/* ══════════ 購入・建設 UI ══════════ */
function deedHTML(i, actLabel, price, note){
  const t = G.tiles[i];
  return '<div class="modal"><div class="deed">'
    + '<div class="dhd"><span class="sw" style="background:'+GCOL[t.g]+'"></span>'
    + '<b>'+esc(t.name)+'</b><span>通行料 '+yen(tollOf(t,G))+'</span></div>'
    + '<div class="dbd"><p style="font-size:15px;line-height:1.7">'+esc(note||'')+'</p>'
    + '<div class="sums"><span>'+actLabel+'費用</span><em>'+yen(price)+'</em></div>'
    + '<div class="btnrow"><button class="btn ghost" data-act="no">やめる</button>'
    + '<button class="btn gold" data-act="ok">'+actLabel+'する</button></div>'
    + '</div></div></div>';
}
function buildHTML(i, pi){
  const t = G.tiles[i], p = G.players[pi];
  const own = t.owner === pi;
  let html = '<div class="modal"><div class="deed">'
    + '<div class="dhd"><span class="sw" style="background:'+GCOL[t.g]+'"></span><b>'+esc(t.name)+'</b>'
    + '<span>いまの通行料 '+yen(tollOf(t,G))+'</span></div><div class="dbd">'
    + '<div class="buildgrid">';
  const steps = [];
  if(!own) steps.push({k:0, nm:'土地', ic:'🏳️', cost:priceOf(t), have:false, can:true});
  else steps.push({k:0, nm:'土地', ic:'🏳️', cost:0, have:true, can:false});
  for(let k=1;k<=3;k++){
    steps.push({k, nm:BUILD[k].nm, ic:BUILD[k].ic, cost:BUILD[k].cost(t.base),
      have: own && t.lv>=k, can: true});
  }
  steps.push({k:4, nm:'ランドマーク', ic:'🗼', cost:BUILD[4].cost(t.base),
    have: t.landmark, can: own && t.lv>=3 && !t.landmark});
  steps.forEach(s=>{
    const cls = 'bcard' + (s.have?' own':'') + (!s.can?' dis':'');
    const toll = s.k===0 ? BUILD[0].toll(t.base) : BUILD[s.k].toll(t.base);
    html += '<div class="'+cls+'" data-k="'+s.k+'"><div class="ico">'+s.ic+'</div>'
      + '<div class="nm">'+s.nm+'</div>'
      + '<div class="pr">'+(s.have?'所有ずみ':yen(s.cost))+'</div>'
      + '<div class="tl">通行料 +'+yen(toll)+'</div></div>';
  });
  html += '</div>'
    + '<div class="sums"><span>選んだぶんの合計</span><em id="bSum">0</em></div>'
    + '<div style="font-size:12.5px;color:#6b5a3c;margin-top:6px">'
    + '同じ色を3つそろえる（トリプル独占）か、1辺の街をぜんぶ持つ（ライン独占）と<b>その場で勝ち</b>。'
    + (p.bonusBuild>0 ? '　🎁 建設1回ぶん無料券あり' : '') + '</div>'
    + '<div class="btnrow"><button class="btn ghost" data-act="no">やめる</button>'
    + '<button class="btn gold" data-act="ok" id="bOk">建てる</button></div>'
    + '</div></div></div>';
  return html;
}
async function buyUI(pi, i){
  const t = G.tiles[i], p = G.players[pi];
  const own = t.owner === pi;
  if(!own && t.owner>=0) return;
  if(own && t.landmark){ toast('R','🗼','ランドマーク完成済み', t.name+'はこれ以上建てられません',1800); return; }
  return new Promise(res=>{
    const wrap = $('#modalWrap'), body = $('#modalBody');
    body.innerHTML = buildHTML(i, pi);
    wrap.classList.add('on');
    const sel = new Set();
    const sumEl = body.querySelector('#bSum');
    const cards = Array.from(body.querySelectorAll('.bcard'));
    function cost(k){ return k===0 ? priceOf(t) : BUILD[k].cost(t.base); }
    function recalc(){
      let s = 0; sel.forEach(k=>s += cost(k));
      if(p.bonusBuild>0 && sel.size>0){
        const mx = Math.max(...Array.from(sel).map(k=>cost(k)));
        s -= mx;
      }
      sumEl.textContent = yen(s);
      body.querySelector('#bOk').disabled = (sel.size===0 || s > p.cash);
      sumEl.style.color = s > p.cash ? '#C0261A' : '#B2411C';
    }
    cards.forEach(cd=>{
      const k = +cd.dataset.k;
      const have = cd.classList.contains('own');
      if(have){ cd.classList.add('dis'); return; }
      if(!own && k>0){ /* 土地を買わないと建てられない */ }
      cd.onclick = ()=>{
        if(k>0 && !own && !sel.has(0)){ sel.add(0); cards.find(c=>+c.dataset.k===0)?.classList.add('sel'); }
        if(k>0 && t.lv < k-1 && !sel.has(k-1) && k<4){
          for(let j=(own?t.lv+1:1); j<k; j++){
            sel.add(j); cards.find(c=>+c.dataset.k===j)?.classList.add('sel');
          }
        }
        if(sel.has(k)){ sel.delete(k); cd.classList.remove('sel'); }
        else { sel.add(k); cd.classList.add('sel'); }
        SFX.click(); recalc();
      };
    });
    recalc();
    body.querySelectorAll('[data-act]').forEach(b=>{
      b.onclick = async ()=>{
        SFX.click(); wrap.classList.remove('on');
        if(b.dataset.act==='ok' && sel.size){
          let s = 0; sel.forEach(k=>s += cost(k));
          if(p.bonusBuild>0){ s -= Math.max(...Array.from(sel).map(k=>cost(k))); p.bonusBuild--; }
          give(pi, -s);
          if(sel.has(0) || own) t.owner = pi;
          [1,2,3].forEach(k=>{ if(sel.has(k)) t.lv = Math.max(t.lv, k); });
          if(sel.has(4)) t.landmark = true;
          await growAnim(i);
          checkWin();
        }
        res();
      };
    });
  });
}
async function growAnim(i){
  const t = G.tiles[i]; t.grow = 0;
  SFX.build();
  const c = tileCenter(i);
  burst(c.x, c.y-30, 30, ['#FFD24D','#FFFFFF','#7FD9F0']);
  let t0 = null; const D = 380*SPEED;
  await new Promise(res=>{
    requestAnimationFrame(function step(now){
      if(t0 === null) t0 = now;
      const k = Math.max(0, Math.min(1,(now-t0)/D));
      t.grow = k<0.7 ? (k/0.7)*1.16 : 1.16 + (1-1.16)*((k-0.7)/0.3);
      if(k<1) requestAnimationFrame(step); else { t.grow = 1; res(); }
    });
  });
  updHUD();
}
/* 盤上のマスを選ばせる */
function pickTile(pi, msg, filter){
  return new Promise(res=>{
    toast('R','🌀', msg, 'マスをタップしてください', 6000);
    camReset();
    const c = $('#world');
    function onClick(ev){
      // offsetX/Y は要素のローカル座標（回転・拡大を考慮）なので縦画面回転でも正しい
      const sx = (ev.offsetX / c.clientWidth) * SW;
      const sy = (ev.offsetY / c.clientHeight) * SH;
      // カメラ逆変換
      const wx = (sx - SW/2)/cam.z + cam.x, wy = (sy - SH/2)/cam.z + cam.y;
      let best = -1, bd = 1e9;
      for(let i=0;i<32;i++){
        const t = tileCenter(i), d = (t.x-wx)**2 + (t.y-wy)**2;
        if(d < bd){ bd = d; best = i; }
      }
      if(bd > 90*90) return;
      if(filter && !filter(best)) return;
      c.removeEventListener('pointerdown', onClick);
      SFX.click(); res(best);
    }
    c.addEventListener('pointerdown', onClick);
    setTimeout(()=>{ c.removeEventListener('pointerdown', onClick); res(-1); }, 12000*SPEED);
  });
}

/* ══════════ チャンスカード ══════════ */
const CARDS = [
  {t:'臨時収入',   d:'思わぬ収入がありました', f:async pi=>{ give(pi, 2000000); }},
  {t:'大当たり',   d:'大きな配当が入りました', f:async pi=>{ give(pi, 5000000); }},
  {t:'修繕費',     d:'建物の修理代を払います', f:async pi=>{ const a=1500000;
      if(!payFrom(pi,a)) return bankrupt(pi,-1); give(pi,-a); }},
  {t:'スタートへ', d:'スタートまで戻って給料を受け取ります', f:async pi=>{
      await jumpTo(pi,0); G.players[pi].laps++; salary(pi); }},
  {t:'天使カード', d:'次の通行料が1回だけ無料になります', f:async pi=>{
      G.players[pi].freeToll++; }},
  {t:'ワープ',     d:'好きなマスへ移動できます', f:async pi=>{
      const p=G.players[pi];
      const d = p.kind==='cpu' ? aiPickTravel(pi) : await pickTile(pi,'行き先を選んでください');
      if(d>=0){ await jumpTo(pi,d); await resolve(pi); } }},
  {t:'監獄行き',   d:'氷の監獄へ送られます', f:async pi=>{
      await jumpTo(pi,8); G.players[pi].jail=3; SFX.bad(); }},
  {t:'建設バーゲン',d:'建設1回ぶんが無料になります', f:async pi=>{ G.players[pi].bonusBuild++; }},
  {t:'みんなから', d:'全員から 100万 ずつ受け取ります', f:async pi=>{
      let s=0; G.players.forEach((q,j)=>{ if(j!==pi && !q.out){
        const a=Math.min(1000000,q.cash); q.cash-=a; s+=a; } });
      give(pi, s); }},
  {t:'ダイス追加', d:'奇数・偶数ボタンが1回ずつ増えます', f:async pi=>{
      G.players[pi].odd++; G.players[pi].even++; }}
];
async function chanceCard(pi){
  const c = CARDS[Math.floor(Math.random()*CARDS.length)];
  if(G.players[pi].kind!=='cpu'){
    await modal('<div class="modal"><div class="dark"><h3>❓ チャンスカード</h3>'
      + '<div class="big">'+esc(c.t)+'</div><p>'+esc(c.d)+'</p>'
      + '<div class="btnrow" style="justify-content:center;margin-top:16px">'
      + '<button class="btn gold" data-act="ok">OK</button></div></div></div>');
  } else {
    toast('L','❓','チャンスカード', c.t+' — '+c.d, 2000);
    await wait(900);
  }
  await c.f(pi);
}

/* ══════════ 勝敗 ══════════ */
function checkWin(){
  if(G.over) return false;
  for(let pi=0; pi<G.players.length; pi++){
    if(G.players[pi].out) continue;
    for(let g=0; g<7; g++) if(hasTriple(G,pi,g)) return finish(pi, 'トリプル独占', GCOL[g]);
    for(let s=0; s<4; s++) if(hasLine(G,pi,s)) return finish(pi, 'ライン独占');
  }
  const alive = G.players.filter(p=>!p.out);
  if(alive.length === 1) return finish(G.players.indexOf(alive[0]), '独り勝ち');
  return false;
}
async function bankrupt(pi, toPi){
  const p = G.players[pi];
  p.out = true; p.cash = 0;
  G.tiles.forEach(t=>{ if(t.type==='city' && t.owner===pi){
    if(toPi>=0){ t.owner = toPi; } else { t.owner=-1; t.lv=0; t.landmark=false; }
  }});
  SFX.bad();
  await band(p.name+' が破産しました', toPi>=0 ? '持っていた街は '+G.players[toPi].name+' のものに' : '街は市場に戻りました', 2000);
  checkWin();
}
function finish(pi, reason, col){
  G.over = true; G.winner = pi; G.winReason = reason; G.phase = 'over';
  celebrate(pi, reason, col);
  return true;
}
async function celebrate(pi, reason, col){
  SFX.win();
  $('#cel1').textContent = 'おめでとうございます！';
  $('#cel2').textContent = reason;
  $('#cel3').textContent = G.players[pi].name + ' の勝ち！';
  $('#celebrate').classList.add('on');
  const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  for(let k=0;k<7;k++){
    burst(200 + Math.random()*1200, 260 + Math.random()*380, 34,
      ['#FFD24D','#FFF3C0','#F372DD','#7FD9F0','#FFFFFF', col||'#E23B4A']);
    await wait(150);
  }
  await wait(2200);
  $('#celebrate').classList.remove('on');
  showResult();
}
function showResult(){
  const rk = rank();
  $('#resWin').textContent = G.players[G.winner].name + ' の勝利！';
  $('#resReason').textContent = '勝ち方：' + G.winReason;
  const tb = $('#resRows'); tb.innerHTML = '';
  rk.forEach((r,k)=>{
    const p = G.players[r.i];
    let est = 0;
    G.tiles.forEach(t=>{ if(t.type==='city' && t.owner===r.i) est += cityValue(t); });
    const tr = document.createElement('tr');
    tr.innerHTML = '<td style="color:'+PCOL[r.i]+'">'+(k+1)+'</td>'
      + '<td>'+PICO[r.i]+' '+esc(p.name)+(p.out?' <small style="color:#E8747E">破産</small>':'')+'</td>'
      + '<td>'+yen(p.cash)+'</td><td>'+yen(est)+'</td><td><em>'+yen(Math.max(0,r.a))+'</em></td>';
    tb.appendChild(tr);
  });
  screenTo('result');
}

/* ══════════ ターン進行 ══════════ */
async function turnLoop(){
  while(!G.over){
    const pi = G.turn, p = G.players[pi];
    if(p.out){ nextTurn(); continue; }
    updHUD();
    toast('R', PICO[pi], p.name + ' のターン', '残り '+G.turnsLeft+' ターン', 1500);
    await wait(500);

    if(p.jail > 0){
      const esc2 = await jailTurn(pi);
      if(!esc2){ nextTurn(); continue; }
    }
    let again = true, guard = 0;
    while(again && !G.over && guard++ < 4){
      again = false;
      const r = await takeRoll(pi);
      if(G.over) break;
      if(r.isDbl){
        p.dblRun++;
        if(p.dblRun >= 3){
          await band('ゾロ目 3回！', G.map.corners[1]+'へ送られます', 1700);
          await jumpTo(pi, 8); G.players[pi].jail = 3; p.dblRun = 0; break;
        }
        await moveSteps(pi, r.total);
        await resolve(pi);
        if(G.over) break;
        toast('R','🎲','ゾロ目！','もう一回サイコロを振れます', 1700);
        again = true;
      } else {
        p.dblRun = 0;
        await moveSteps(pi, r.total);
        await resolve(pi);
      }
    }
    if(G.over) break;
    nextTurn();
    if(G.turnsLeft <= 0){ timeUp(); break; }
    await wait(260);
  }
}
function nextTurn(){
  const n = G.players.length;
  for(let k=1;k<=n;k++){
    const j = (G.turn + k) % n;
    if(!G.players[j].out){
      if(j <= G.turn) G.turnsLeft--;
      G.turn = j; break;
    }
  }
  camReset(); updHUD();
}
function timeUp(){
  const rk = rank();
  finish(rk[0].i, 'ターン終了・総資産1位');
}
async function jailTurn(pi){
  const p = G.players[pi];
  camTo(tileCenter(8).x, tileCenter(8).y, 1.5);
  await band(G.map.corners[1]+' — あと '+p.jail+' ターン', 'ゾロ目が出れば脱出できます', 1400);
  const r = await doRoll(pi, null, false);
  if(r.isDbl){
    p.jail = 0;
    await band('脱出成功！', 'ゾロ目でここから出られます', 1300);
    await moveSteps(pi, r.total); await resolve(pi);
    return false;
  }
  p.jail--;
  if(p.jail<=0) toast('R','🔓','次のターンから動けます','', 1700);
  camReset();
  return false;
}
/* 人間 or CPU のサイコロ操作 */
function takeRoll(pi){
  const p = G.players[pi];
  if(p.kind === 'cpu') return aiRoll(pi);
  return new Promise(res=>{
    stepPreview = {from:p.pos, max:12};
    gaugeSweet = 0.22 + Math.random()*0.56;
    gaugeOn = true;
    $('#diceui').classList.add('on');
    $('#oddN').textContent = p.odd; $('#evenN').textContent = p.even;
    $('#odd').classList.toggle('dim', p.odd<=0);
    $('#even').classList.toggle('dim', p.even<=0);
    const done = async (force)=>{
      $('#push').onclick = null; $('#odd').onclick = null; $('#even').onclick = null;
      const impact = Math.abs(gaugePhase - gaugeSweet) < 0.085;
      if(force==='odd') p.odd--; if(force==='even') p.even--;
      res(await doRoll(pi, force, impact));
    };
    $('#push').onclick = ()=>{ SFX.click(); done(null); };
    $('#odd').onclick  = ()=>{ if(p.odd>0){ SFX.click(); done('odd'); } };
    $('#even').onclick = ()=>{ if(p.even>0){ SFX.click(); done('even'); } };
  });
}

/* ══════════ CPU ══════════ */
async function aiRoll(pi){
  const p = G.players[pi];
  stepPreview = {from:p.pos, max:12};
  gaugeSweet = 0.5; gaugeOn = true; $('#diceui').classList.add('on');
  await wait(700);
  const lvl = cfg.ai;
  let force = null;
  if(lvl >= 1 && (p.odd>0 || p.even>0)){
    const so = bestParity(pi,'odd'), se = bestParity(pi,'even'), sn = avgScore(pi);
    if(p.odd>0 && so > sn + (lvl===2?6:16) && so >= se) { force='odd'; p.odd--; }
    else if(p.even>0 && se > sn + (lvl===2?6:16)) { force='even'; p.even--; }
  }
  const impact = lvl===2 ? Math.random()<0.55 : lvl===1 ? Math.random()<0.3 : Math.random()<0.1;
  return doRoll(pi, force, impact);
}
function avgScore(pi){ let s=0; for(let n=2;n<=12;n++) s += scoreLanding(pi,n)*(6-Math.abs(7-n))/36; return s; }
function bestParity(pi, par){
  let s=0, w=0;
  for(let n=2;n<=12;n++){
    if((n%2===0?'even':'odd')!==par) continue;
    const p = (6-Math.abs(7-n))/36; s += scoreLanding(pi,n)*p; w += p;
  }
  return w? s/w : 0;
}
async function aiBuy(pi, i){
  const t = G.tiles[i], p = G.players[pi], lvl = cfg.ai;
  const own = t.owner === pi;
  const reserve = [6000000, 3500000, 1800000][lvl];
  let spend = 0, lvTarget = t.lv, land = false, lm = false;
  if(!own){
    if(p.cash - priceOf(t) < reserve) return;
    land = true; spend += priceOf(t);
  }
  // 同じ色をそろえられるなら積極的に
  const near = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
  const aggr = near>=1 ? 1 : 0;
  for(let k = (own? t.lv+1 : 1); k<=3; k++){
    const c = BUILD[k].cost(t.base);
    if(p.cash - spend - c < reserve - aggr*1500000) break;
    if(lvl===0 && k>1) break;
    if(lvl===1 && k>2 && !aggr) break;
    spend += c; lvTarget = k;
  }
  if(lvl===2 && lvTarget===3 && p.cash - spend - BUILD[4].cost(t.base) > reserve && near>=1){
    spend += BUILD[4].cost(t.base); lm = true;
  }
  if(spend === 0) return;
  if(p.bonusBuild>0){ spend = Math.round(spend*0.75); p.bonusBuild--; }
  give(pi, -spend);
  if(land || own) t.owner = pi;
  t.lv = Math.max(t.lv, lvTarget);
  if(lm) t.landmark = true;
  toast('L','🏗',(land?'購入':'建設')+'：'+t.name, yen(spend)+' を投資しました', 2000);
  await growAnim(i);
  checkWin();
}
function aiBuyout(pi, i, cost){
  const t = G.tiles[i], p = G.players[pi], lvl = cfg.ai;
  if(lvl===0) return false;
  const near = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
  const reserve = [6000000, 3500000, 1800000][lvl];
  if(p.cash - cost < reserve) return false;
  if(near >= 2) return true;                      // 独占に王手
  return lvl===2 && near>=1 && Math.random()<0.6;
}
function aiPickTravel(pi){
  let best = -1, bs = -1e9;
  for(let i=0;i<32;i++){
    const t = G.tiles[i];
    let s = 0;
    if(t.type==='city'){
      const near = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
      if(t.owner<0) s = 50 + near*40 + t.base/150000;
      else if(t.owner===pi) s = 25 + near*20;
      else s = -tollOf(t,G)/100000 + (G.players[pi].cash > cityValue(t)*2 ? 30+near*30 : 0);
    } else if(t.type==='bonus') s = 40;
    else if(t.type==='card') s = 22;
    else if(t.type==='jail') s = -999;
    else if(t.type==='start') s = 35;
    else s = 10;
    if(s > bs){ bs = s; best = i; }
  }
  return best;
}

/* ══════════ 画面遷移 ══════════ */
function screenTo(id){
  $$('.screen').forEach(s=>s.classList.toggle('on', s.id===id));
}
function hideAllScreens(){ $$('.screen').forEach(s=>s.classList.remove('on')); }

/* マップ選択 */
function renderMaps(){
  const box = $('#mapList'); box.innerHTML = '';
  MAPS.forEach(m=>{
    const d = document.createElement('div');
    d.className = 'mapcard' + (m.id===cfg.mapId ? ' sel' : '');
    d.innerHTML = '<div class="thumb" style="background:radial-gradient(90% 90% at 50% 30%,'
      + m.sky[0]+','+m.sky[1]+')">'+m.emoji+'</div>'
      + '<div class="nm">'+esc(m.name)+'<i>'+esc(m.sub)+'</i></div>';
    d.onclick = ()=>{ cfg.mapId = m.id; SFX.click(); renderMaps(); };
    box.appendChild(d);
  });
}
function renderSeats(){
  const box = $('#seatList'); box.innerHTML = '';
  for(let i=0;i<4;i++){
    const s = cfg.seats[i];
    const d = document.createElement('div');
    d.className = 'seat' + (i >= cfg.n ? ' off' : '');
    d.innerHTML = '<span class="dot" style="background:'+PCOL[i]+'"></span>'
      + '<span style="font-size:19px">'+PICO[i]+'</span>'
      + '<input type="text" id="sn'+i+'" value="'+esc(s.name)+'" maxlength="10">'
      + '<select id="sk'+i+'">'
      + '<option value="you"'+(s.kind==='you'?' selected':'')+'>あなた</option>'
      + '<option value="human"'+(s.kind==='human'?' selected':'')+'>ともだち</option>'
      + '<option value="cpu"'+(s.kind==='cpu'?' selected':'')+'>CPU</option></select>';
    box.appendChild(d);
    d.querySelector('#sn'+i).oninput = e => cfg.seats[i].name = e.target.value || ('プレイヤー'+(i+1));
    d.querySelector('#sk'+i).onchange = e => {
      cfg.seats[i].kind = e.target.value;
      if(e.target.value==='cpu' && /^あなた|プレイヤー/.test(cfg.seats[i].name)){
        cfg.seats[i].name = 'CPU ' + ['アカ','アオ','ミドリ','キイロ'][i];
        renderSeats();
      }
    };
  }
}

/* ══════════ 順番決め ══════════ */
async function orderPhase(){
  screenTo('order');
  const box = $('#orderCards'); box.innerHTML = '';
  const n = cfg.n;
  const nums = Array.from({length:n}, (_,i)=>i+1);
  for(let i=nums.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [nums[i],nums[j]]=[nums[j],nums[i]]; }
  const picked = new Array(n).fill(null);
  let humanSeat = cfg.seats.slice(0,n).findIndex(s=>s.kind!=='cpu');
  $('#orderWho').textContent = humanSeat>=0
    ? cfg.seats[humanSeat].name + ' さん、カードを1枚えらんでください'
    : 'CPU 同士が順番を決めています…';
  const cards = [];
  for(let i=0;i<n;i++){
    const c = document.createElement('div');
    c.className = 'ocard';
    c.innerHTML = '<div class="b">🎴</div><div class="f"><span>'+nums[i]+'</span></div>';
    box.appendChild(c); cards.push(c);
  }
  await new Promise(res=>{
    let taken = 0;
    const reveal = (idx)=>{
      if(cards[idx].classList.contains('flip')) return;
      cards[idx].classList.add('flip'); SFX.click();
      picked[taken] = nums[idx]; taken++;
      if(taken >= n){ setTimeout(res, 900); }
      else if(humanSeat<0 || taken > humanSeat){ setTimeout(()=>autoPick(), 520); }
    };
    const autoPick = ()=>{
      const free = cards.map((c,k)=>k).filter(k=>!cards[k].classList.contains('flip'));
      if(free.length) reveal(free[(Math.random()*free.length)|0]);
    };
    cards.forEach((c,k)=>c.onclick = ()=>{ if(humanSeat>=0) reveal(k); });
    if(humanSeat<0) setTimeout(autoPick, 600);
  });
  // 引いた番号の小さい順に手番
  const seatOrder = cfg.seats.slice(0,n).map((s,i)=>({i, v:picked[i] ?? (i+1)}))
                      .sort((a,b)=>a.v-b.v).map(o=>o.i);
  cfg.seats = seatOrder.map(i=>cfg.seats[i]).concat(cfg.seats.slice(n));
}

/* ══════════ 起動 ══════════ */
$('#toSetup').onclick = ()=>{ SFX.click(); ac(); screenTo('setup'); };
$('#backTitle').onclick = ()=>{ SFX.click(); screenTo('title'); };
$('#optPlayers').onchange = e => { cfg.n = +e.target.value; renderSeats(); };
$('#optTurns').onchange   = e => cfg.turns = +e.target.value;
$('#optCash').onchange    = e => cfg.cash  = +e.target.value;
$('#optAI').onchange      = e => cfg.ai    = +e.target.value;
$('#optSpeed').onchange   = e => { cfg.speed = +e.target.value; SPEED = cfg.speed; };

$('#startGame').onclick = async ()=>{
  SFX.click(); ac();
  SPEED = cfg.speed;
  await orderPhase();
  hideAllScreens();
  newGame();
  camReset(); updHUD();
  await band('ゲームスタート！', G.map.name + ' — 残り ' + cfg.turns + ' ターン', 1600);
  turnLoop();
};
$('#againSame').onclick = async ()=>{
  SFX.click(); hideAllScreens(); newGame(); camReset(); updHUD();
  await band('もう一回！', G.map.name, 1200); turnLoop();
};
$('#againSetup').onclick = ()=>{ SFX.click(); screenTo('setup'); };

$('#sound').onclick = ()=>{ soundOn = !soundOn; $('#sound').textContent = soundOn?'🔊':'🔇'; SFX.click(); };
$('#menu').onclick = async ()=>{
  if(!G) return;
  const r = await modal('<div class="modal"><div class="dark"><h3>⏸ メニュー</h3>'
    + '<p>ゲームを中断してタイトルに戻りますか？</p>'
    + '<div class="btnrow" style="justify-content:center;margin-top:16px">'
    + '<button class="btn ghost" data-act="no">つづける</button>'
    + '<button class="btn red" data-act="ok">タイトルへ</button></div></div></div>');
  if(r==='ok'){ G.over = true; screenTo('title'); }
};
$('#emotebtn').onclick = ()=>{ $('#emotebar').classList.toggle('on'); SFX.click(); };
$$('#emotebar button').forEach(b=>b.onclick = ()=>{
  const box = $('#emoteflow');
  const s = document.createElement('span'); s.className='emo'; s.textContent = b.dataset.e;
  box.appendChild(s);
  while(box.children.length > 5) box.firstChild.remove();
  setTimeout(()=>s.remove(), 4000);
  $('#emotebar').classList.remove('on'); SFX.click();
});

/* ティッカー */
const TIPS = [
  '同じ色の街を3つそろえると「トリプル独占」でその場で勝ち！',
  '1辺の街をぜんぶ持つと「ライン独占」でその場で勝ち！',
  '奇数・偶数ボタンを押すと、かならずその出目が出ます（回数かぎり）',
  'ゲージが光っているところで「押す」と、出目をコントロールできます',
  'ゾロ目が出たらもう一回。ただし3回続くと氷の監獄行き',
  '相手の街には「買収」で乗り込める。値段は2倍です',
  'ランドマークを建てると通行料が跳ね上がり、買収されなくなります'
];
let tipI = 0;
setInterval(()=>{ tipI = (tipI+1)%TIPS.length; $('#tickerText').textContent = TIPS[tipI]; }, 9000);
$('#tickerText').textContent = TIPS[0];

/* 初期化 */
renderMaps(); renderSeats(); fitStage();
$('#optTurns').value = cfg.turns; $('#optCash').value = cfg.cash;
$('#optAI').value = cfg.ai; $('#optPlayers').value = cfg.n;

/* Artifact の再公開でも設定を持ち越す */
try{
  const boot = st => { if(st && st.cfg){ Object.assign(cfg, st.cfg); renderMaps(); renderSeats(); } };
  if(window.claude && window.claude.hot){
    window.claude.hot.snapshot(()=>({cfg}));
    window.claude.hot.ready ? window.claude.hot.ready(boot) : boot(window.claude.hot.data||{});
  }
}catch(e){}
</script>
