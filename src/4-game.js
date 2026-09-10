
/* ══════════════════════════════════════════════════════════════
   ダイスボヤージュ — ゲーム進行・演出・CPU・画面
   ══════════════════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
let SPEED = 1;
const wait = ms => new Promise(r => setTimeout(r, Math.max(0, ms*SPEED)));
const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ══════════ ステージのフィット（横画面バグ対策の要） ══════════ */
let forcePortrait = false, portraitDir = 90;
function fitStage(){
  const vw = window.innerWidth, vh = window.innerHeight;
  const stage = $('#stage');
  const portrait = vh > vw * 1.02;
  $('#rotate').classList.toggle('on', portrait && !forcePortrait);
  let s, rot = '';
  if(portrait && forcePortrait){ s = Math.min(vh/SW, vw/SH); rot = ' rotate('+portraitDir+'deg)'; }
  else { s = Math.min(vw/SW, vh/SH); }
  stage.style.transform = 'translate(-50%,-50%)'+rot+' scale('+s+')';
  const c = $('#world');
  const dpr = Math.min(2, window.devicePixelRatio||1);
  if(c.width !== Math.round(SW*dpr)){ c.width = Math.round(SW*dpr); c.height = Math.round(SH*dpr); }
}
addEventListener('resize', fitStage);
addEventListener('orientationchange', ()=>setTimeout(fitStage,120));
$('#playPortrait').onclick  = ()=>{ forcePortrait = true; portraitDir =  90; fitStage(); };
$('#playPortrait2').onclick = ()=>{ forcePortrait = true; portraitDir = -90; fitStage(); };

/* ══════════ サウンド ══════════
   効果音は dvSfx（1音を2〜4層重ねた合成音）、音楽は dvMusic（4曲・ベース＋パッド＋
   メロディ＋ドラム＋リバーブ）。どちらも音源ファイルを使わず Web Audio で作っている。
   ブラウザの自動再生制限があるので、最初のクリックまで AudioContext は作らない。
   ══════════════════════════════════════════ */
let AC = null, soundOn = true, SFXE = null, MUSIC = null, audioReady = false;
let bgmOn = true, bgmVol = 0.55, sfxVol = 0.70;
function ac(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state === 'suspended'){ try{ AC.resume(); }catch(e){} }
  if(AC && !audioReady){
    audioReady = true;
    try{ SFXE = dvSfx(AC); }catch(e){ SFXE = null; }
    try{
      MUSIC = dvMusicFiles(AC, (window.DV_BGM || null));   // 音楽ファイルがあれば本物を鳴らす
      if(!MUSIC) MUSIC = dvMusic(AC);                      // 無ければ合成音
    }catch(e){ try{ MUSIC = dvMusic(AC); }catch(e2){ MUSIC = null; } }
    try{ applyAudioPrefs(); }catch(e){}
    try{ if(MUSIC) MUSIC.play('lobby'); }catch(e){}
  }
  return AC;
}
const SFX = (function(){
  const names = ['click','hover','diceShake','diceThrow','diceLand','diceDouble','step','land',
    'coin','pay','build','landmark','buy','skill','gachaRoll','gachaRare','win','lose','tick','warn'];
  const o = {};
  names.forEach(n=>{ o[n] = function(v){
    if(!soundOn) return;
    const a = ac(); if(!a || !SFXE || typeof SFXE[n] !== 'function') return;
    try{ SFXE[n](v); }catch(e){}
  }; });
  o.hop = o.step; o.dice = o.diceShake; o.bad = o.lose;   // 旧名の互換
  return o;
})();
/* 場面に合わせて曲を切り替える */
function bgm(name){ try{ if(MUSIC && bgmOn) MUSIC.play(name); }catch(e){} }

/* ══════════ 設定と状態 ══════════ */
let G = null;
let cfg = { mapId:'ice', turns:30, timeLimit:1500, cash:20000000, ai:1, speed:1, n:4,
  seats:[{name:'あなた',kind:'you',ch:-1},{name:'CPU ガル',kind:'cpu',ch:-1},
         {name:'CPU リノ',kind:'cpu',ch:-1},{name:'CPU ゼニ',kind:'cpu',ch:-1}] };

function newGame(){
  const map = MAPS.find(m=>m.id===cfg.mapId) || MAPS[0];
  const pickItems = ()=>{
    const pool = ITEMS.slice();
    const out = [];
    for(let k=0;k<2;k++) out.push(pool.splice((Math.random()*pool.length)|0,1)[0].id);
    return out;
  };
  G = {
    map, tiles: buildTiles(map),
    players: cfg.seats.slice(0,cfg.n).map((s,i)=>{
      const card = cardById(s.cardId) || CARDPOOL[i % CARDPOOL.length];
      const lv = (s.kind!=='cpu' && SV.cards[card.id]) ? SV.cards[card.id].lv
               : (cfg.ai===2 ? 12 : cfg.ai===1 ? 6 : 1);
      const slots = (s.kind!=='cpu' && SV.equip===card.id) ? SV.slots : [];
      return {
        name:s.name, kind:s.kind, ch: card.art, card: card.id,
        stats: cardStats(card.id, lv, slots), cardLv: lv,
        skill: card.sk, skillKind: (card.kind===undefined ? 0 : card.kind),
        skillPow: card.rar==='SS' ? 0.18 : card.rar==='S' ? 0.12 : 0.08,
        cash:cfg.cash, pos:0, laps:0, jail:0, out:false, dblRun:0,
        odd:2, even:2, items:pickItems(),
        skillLeft: card.sk.uses, mana:0,
        freeToll:0, halfBuild:0, salaryX2:0, forceDouble:0, chooseEye:0,
        render:tileCenter(0), hopY:0, squash:1, offx:0, offy:0, face:1, jam:3
      };
    }),
    turn:0, turnsLeft:cfg.turns, over:false, winner:-1, winReason:'',
    clock: cfg.timeLimit, lastTick: 0, ev:{}
  };
  thisWeek().apply(G);          // 今週のイベントを反映（毎週月曜6時に自動で変わる）
  destPin = null; stepPreview = null; diceAnim = null; fxList.length = 0;
}

/* ══════════ 描画ループ ══════════
   背景と盤は毎フレーム描き直すと重いので、オフスクリーンにキャッシュして貼る。
   背景＝約5fpsで更新（ゆっくりした環境アニメだけなので気づかない）
   盤　＝所有・建物・凍結・所持金が変わった時だけ再描画
   ══════════════════════════════════════════ */
const cv = $('#world'); const ctx = cv.getContext('2d');

const BG_W = 2200, BG_H = 1320, BG_OX = -300, BG_OY = -210;
const BD_X = 140, BD_Y = 24, BD_W = 1330, BD_H = 880, BD_S = 1.5;
function mkLayer(w,h,s){
  const c = document.createElement('canvas');
  c.width = Math.round(w*s); c.height = Math.round(h*s);
  return c;
}
const bgL = mkLayer(BG_W, BG_H, 1), bgC = bgL.getContext('2d');
const bdL = mkLayer(BD_W, BD_H, BD_S), bdC = bdL.getContext('2d');
let bgAt = -1e9, bgKey = '', bdKey = '';

function boardSig(){
  let s = G.map.id+'|';
  for(let i=0;i<32;i++){ const t=G.tiles[i];
    s += (t.owner===undefined?'-':t.owner)+','+(t.lv||0)+(t.landmark?'L':'')+(t.frozen||0)+';'; }
  for(const p of G.players) s += (p.out?'x':Math.min(12,Math.round(p.cash/2500000)))+',';
  return s;
}
function refreshBg(map, now){
  bgC.setTransform(1,0,0,1,0,0);
  bgC.clearRect(0,0,bgL.width,bgL.height);
  bgC.setTransform(1,0,0,1,-BG_OX,-BG_OY);
  drawBackdrop(bgC, map, now);
  bgAt = now; bgKey = map.id;
}
function refreshBoard(now){
  bdC.setTransform(1,0,0,1,0,0);
  bdC.clearRect(0,0,bdL.width,bdL.height);
  bdC.setTransform(BD_S,0,0,BD_S,-BD_X*BD_S,-BD_Y*BD_S);
  drawStacks(bdC, G, now);
  drawLake(bdC, G.map, now);
  drawSlab(bdC, G.map, now);
  const list = [];
  for(let i=0;i<32;i++) list.push({y:tileCenter(i).y, i});
  list.sort((a,b)=>a.y-b.y).forEach(o=>drawTile(bdC, G, o.i, now));
  bdKey = boardSig();
}

let last = 0;
function frame(now){
  const dt = Math.min(50, now - last); last = now;
  camStep(dt/1000);
  const dpr = cv.width / SW;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,SW,SH);
  const sh = cam.shake;
  const ox = sh ? (Math.sin(now*0.09)*sh) : 0, oy = sh ? (Math.cos(now*0.13)*sh) : 0;
  const map = G ? G.map : (MAPS.find(m=>m.id===cfg.mapId)||MAPS[0]);

  if(now - bgAt > 220 || bgKey !== map.id) refreshBg(map, now);

  ctx.save();
  ctx.translate(SW/2+ox, SH/2+oy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  ctx.drawImage(bgL, BG_OX, BG_OY, BG_W, BG_H);
  if(G){
    const sig = boardSig();
    if(sig !== bdKey) refreshBoard(now);
    ctx.drawImage(bdL, BD_X, BD_Y, BD_W, BD_H);
    layoutTokens();
    const list = [];
    for(let i=0;i<32;i++) if(G.tiles[i].type==='city' && G.tiles[i].owner>=0)
      list.push({y:tileCenter(i).y+0.4, f:()=>drawBuilding(ctx,G,i,now)});
    G.players.forEach((p,i)=>{ if(!p.out)
      list.push({y:(p.render?p.render.y:tileCenter(p.pos).y)+0.8, f:()=>drawToken(ctx,G,i,now)}); });
    list.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
    drawSteps(ctx, G);
    drawDestPin(ctx, now);
    drawDice(ctx, now);
    drawFx(ctx, dt);
  }
  ctx.restore();
  if(diceAnim){
    diceAnim.t += dt / SPEED;
    const th = diceAnim.th;
    if(th){
      const st = th.at(Math.max(0, Math.min(diceAnim.t, th.dur)));
      // バウンドの瞬間に画面を揺らして音を鳴らす（手応えの正体）
      if(st && st.shake > 0.30 && (diceAnim.lastShake || 0) <= 0.30){
        camShake(7 + st.shake*16);
        SFX.diceLand(st.shake);
      }
      diceAnim.lastShake = st ? st.shake : 0;
      if(diceAnim.t > th.dur + 460) diceAnim = null;
    } else if(diceAnim.t > 1600) diceAnim = null;
  }
  drawGauge(now);
  paintPortraits(now);
  tickClock(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function boardChanged(){ bdKey = ''; }

function layoutTokens(){
  const by = {};
  G.players.forEach((p,i)=>{ if(p.out) return; (by[p.pos] = by[p.pos]||[]).push(i); });
  Object.keys(by).forEach(k=>{
    const arr = by[k];
    arr.forEach((pi,j)=>{
      const p = G.players[pi];
      if(arr.length===1){ p.offx=0; p.offy=0; }
      else { p.offx = (j - (arr.length-1)/2) * 26; p.offy = (j%2)*8; }
      if(!p.moving) p.render = tileCenter(p.pos);
    });
  });
}

/* ══════════ 肖像キャンバス ══════════ */
const portraits = [];
function regPortrait(el, chId, col){ if(el) portraits.push({el, chId, col}); }
let portAt = -1e9;
function paintPortraits(T){
  if(T - portAt < 70) return;      // 肖像は約14fpsで十分（重い描画なので間引く）
  portAt = T;
  for(const o of portraits){
    if(!o.el.isConnected || !o.el.offsetParent) continue;
    const c = o.el.getContext('2d');
    const W = o.el.width, H = o.el.height;
    c.clearRect(0,0,W,H);
    c.save();
    const s = Math.min(W/240, H/340);
    c.translate((W - 240*s)/2, (H - 340*s)/2);
    c.scale(s, s);
    dvPort(o.chId, c, T + o.chId*430);
    c.restore();
  }
}

/* ══════════ パワーゲージ ══════════ */
const gcv = $('#gauge'), gctx = gcv.getContext('2d');
let gaugeOn = false, gaugeSweet = 0.5, gaugePhase = 0, gaugeHalf = 0.085;
function drawGauge(T){
  if(!gaugeOn){ gctx.clearRect(0,0,gcv.width,gcv.height); return; }
  gaugePhase = (Math.sin(T*0.0034) + 1) / 2;
  const W = gcv.width, H = gcv.height;
  gctx.clearRect(0,0,W,H);
  const cx = W/2, cy = H*0.97, RX = W*0.45, RY = H*0.82;
  const A0 = Math.PI*1.06, A1 = Math.PI*1.94;
  gctx.lineCap = 'round'; gctx.lineWidth = 22;
  gctx.strokeStyle = 'rgba(30,44,62,.78)';
  gctx.beginPath(); gctx.ellipse(cx,cy,RX,RY,0,A0,A1); gctx.stroke();
  gctx.lineWidth = 16;
  gctx.strokeStyle = 'rgba(120,150,180,.5)';
  gctx.beginPath(); gctx.ellipse(cx,cy,RX,RY,0,A0,A1); gctx.stroke();
  const sA = A0 + (A1-A0)*(gaugeSweet-gaugeHalf), eA = A0 + (A1-A0)*(gaugeSweet+gaugeHalf);
  const gg = gctx.createLinearGradient(cx-RX,0,cx+RX,0);
  gg.addColorStop(0,'#FF8AE0'); gg.addColorStop(1,'#F2C230');
  gctx.strokeStyle = gg; gctx.lineWidth = 18;
  gctx.beginPath(); gctx.ellipse(cx,cy,RX,RY,0,sA,eA); gctx.stroke();
  const hA = A0 + (A1-A0)*gaugePhase;
  const hx = cx + Math.cos(hA)*RX, hy = cy + Math.sin(hA)*RY;
  const g = gctx.createRadialGradient(hx,hy,1,hx,hy,30);
  g.addColorStop(0,'rgba(255,255,225,1)'); g.addColorStop(.4,'rgba(255,246,192,.85)');
  g.addColorStop(1,'rgba(255,240,150,0)');
  gctx.fillStyle=g; gctx.beginPath(); gctx.arc(hx,hy,30,0,6.283); gctx.fill();
  gctx.fillStyle='#fff'; gctx.beginPath(); gctx.arc(hx,hy,7.5,0,6.283); gctx.fill();
}

/* ══════════ 時間 ══════════ */
function tickClock(dt){
  if(!G || G.over || !cfg.timeLimit) return;
  if(!G.running) return;
  G.clock -= dt/1000;
  if(G.clock <= 0){ G.clock = 0; if(!G.over) timeUp(); }
  const m = Math.floor(G.clock/60), s = Math.floor(G.clock%60);
  const el = $('#pClock');
  const txt = m+':'+String(s).padStart(2,'0');
  if(el.textContent !== txt){ el.textContent = txt; if(G.clock<60) el.classList.add('warn'); }
}

/* ══════════ HUD ══════════ */
function rank(){
  return G.players.map((p,i)=>({i, a: p.out ? -1 : assetOf(G,i)})).sort((x,y)=>y.a-x.a);
}
function updHUD(){
  if(!G) return;
  const rk = rank();
  const rankOf = pi => rk.findIndex(r=>r.i===pi)+1;
  const cur = G.turn;
  const lead = rk[0].i === cur ? (rk[1] ? rk[1].i : cur) : rk[0].i;
  fillHUD('Top', lead, 'top');
  fillHUD('Bot', cur,  'bot');
  $('#rTop').innerHTML = rankOf(lead)+'<span>位</span>';
  $('#rBot').innerHTML = rankOf(cur)+'<span>位</span>';
  $('#rTop').className = 'rankbadge' + (rankOf(lead)===1 ? ' red' : '');
  $('#rBot').className = 'rankbadge' + (rankOf(cur)===1 ? ' red' : '');
  $('#pTurn').textContent = G.turnsLeft;
  $('#pGoal').textContent = yen(rk[0].a);
  $('#pGoalL').textContent = G.players[rk[0].i].name;
  if(!cfg.timeLimit) $('#pClock').textContent = '--:--';

  const sh = $('#sideHud'); sh.innerHTML = '';
  rk.forEach((r,k)=>{
    const p = G.players[r.i];
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:7px;background:rgba(10,20,34,.78);'
      +'border:1px solid #2f4a6d;border-left:5px solid '+PCOL[r.i]+';border-radius:9px;padding:5px 9px;'
      +'font-size:13px;font-weight:900;min-width:224px;'+(p.out?'opacity:.4;':'')
      +(G.turn===r.i?'box-shadow:0 0 0 2px rgba(255,224,138,.75);':'');
    d.innerHTML = '<span style="font-family:var(--pop);font-size:15px;color:#FFE08A">'+(k+1)+'</span>'
      + '<span style="width:11px;height:11px;border-radius:50%;background:'+PCOL[r.i]+'"></span>'
      + '<span style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">'+esc(p.name)+'</span>'
      + '<span style="font-family:var(--pop);font-size:14px;color:#9FD8F8">'+(p.out?'破産':yen(r.a))+'</span>';
    sh.appendChild(d);
  });

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
  const jn = $('#jamN'); if(jn && G.players[G.turn]) jn.textContent = (G.players.find(p=>p.kind!=='cpu')||{jam:0}).jam;
  renderItems();
}
function fillHUD(sfx, pi, cls){
  const p = G.players[pi], ch = { skill: p.skill };
  $('#f'+sfx+'Name').textContent = p.name;
  $('#f'+sfx+'Name').style.background = 'linear-gradient(90deg,'+PCOL[pi]+','+shade(PCOL[pi],-.45)+')';
  $('#f'+sfx+'Cls').textContent = cls==='bot' ? '手番' : (p.kind==='cpu' ? 'CPU' : 'P'+(pi+1));
  $('#f'+sfx+'Lvl').textContent = (p.laps+1);
  const pic = $('#f'+sfx+'Pic');
  if(pic.dataset.ch !== String(p.ch) || pic.dataset.col !== PCOL[pi]){
    pic.dataset.ch = p.ch; pic.dataset.col = PCOL[pi];
    const ex = portraits.find(o=>o.el===pic);
    if(ex){ ex.chId = p.ch; ex.col = PCOL[pi]; } else regPortrait(pic, p.ch, PCOL[pi]);
  }
  rollNum($('#f'+sfx+'Cash'), p.cash);
  rollNum($('#f'+sfx+'Asset'), assetOf(G,pi));
  const mana = Math.min(100, p.mana);
  $('#f'+sfx+'Gauge').style.width = mana+'%';
  $('#f'+sfx+'Gtx').textContent = ch.skill.nm+' '+mana+'%';
  if(cls==='bot'){
    const b = $('#skillBtn');
    const ready = mana>=100 && p.skillLeft>0 && p.kind!=='cpu' && G.phase==='wait';
    b.disabled = !ready;
    b.classList.toggle('ready', ready);
    b.textContent = '能力 ×'+p.skillLeft;
  }
}
function rollNum(el, to){
  const from = +(el.dataset.v||0);
  if(from === to){ el.textContent = yen(to); return; }
  el.dataset.v = to;
  let t0 = null; const D = 700*SPEED;
  requestAnimationFrame(function step(now){
    if(t0 === null) t0 = now;
    const k = Math.max(0, Math.min(1,(now-t0)/D)), e = 1-Math.pow(1-k,3);
    el.textContent = yen(from + (to-from)*e);
    if(k<1) requestAnimationFrame(step); else el.textContent = yen(to);
  });
}

/* ══════════ アイテムバー ══════════ */
let itemBar = null;
function renderItems(){
  if(!itemBar){
    itemBar = document.createElement('div');
    itemBar.id = 'itembar';
    itemBar.style.cssText = 'position:absolute;right:1%;bottom:31%;z-index:84;display:flex;'
      + 'flex-direction:column;gap:6px;align-items:flex-end';
    $('#stage').appendChild(itemBar);
  }
  const p = G.players[G.turn];
  itemBar.innerHTML = '';
  if(!p || p.kind==='cpu' || p.out){ return; }
  p.items.forEach((id, k)=>{
    const it = itemById(id); if(!it) return;
    const b = document.createElement('button');
    b.style.cssText = 'display:flex;align-items:center;gap:8px;border:2px solid #E0AE33;border-radius:11px;'
      + 'background:linear-gradient(#33445f,#16233a);color:#fff;font-family:var(--jp);font-weight:900;'
      + 'font-size:12.5px;padding:6px 11px 6px 8px;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.45);'
      + 'white-space:nowrap';
    b.innerHTML = '<span style="font-size:21px">'+it.ic+'</span><span>'+esc(it.nm)+'</span>';
    b.title = it.desc;
    b.onclick = ()=>useItem(G.turn, k);
    itemBar.appendChild(b);
  });
}
async function useItem(pi, k){
  const p = G.players[pi];
  if(G.phase!=='wait') { toast('R','⏳','いまは使えません','サイコロを振る前に使ってください',1600); return; }
  const it = itemById(p.items[k]); if(!it) return;
  SFX.skill();
  p.items.splice(k,1);
  renderItems();
  await cutIn('ITEM', it.nm, it.desc);
  if(it.id==='angel')  p.freeToll++;
  if(it.id==='half')   p.halfBuild++;
  if(it.id==='salary') p.salaryX2++;
  if(it.id==='double') p.forceDouble++;
  if(it.id==='dice')   p.chooseEye++;
  if(it.id==='warp'){
    const d = await pickTile(pi,'ワープ先を選んでください');
    if(d>=0){ await jumpTo(pi,d); await resolve(pi); }
  }
  if(it.id==='freeze'){
    const d = await pickTile(pi,'凍らせる街を選んでください',
      i=>G.tiles[i].type==='city' && G.tiles[i].owner>=0 && G.tiles[i].owner!==pi);
    if(d>=0){ G.tiles[d].frozen = 2;
      addFx('ring', tileCenter(d).x, tileCenter(d).y, 700, '#8FE8FF');
      toast('R','🧊','凍結', G.tiles[d].name+' の通行料が2ターン0になります',2200); }
  }
  updHUD();
}

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
  d.style.cssText += (pi === G.turn) ? 'right:2%;bottom:13%;' : 'left:2%;top:14%;';
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
async function turnBig(pi){
  const p = G.players[pi];
  $('#turnbigT').textContent = p.name;
  $('#turnbigT').style.color = PCOL[pi];
  const _c = cardById(p.card);
  $('#turnbigS').textContent = (_c ? _c.role : '') + ' — のこり '+G.turnsLeft+' ターン';
  const el = $('#turnbig'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  await wait(900);
  el.classList.remove('on');
}
async function cutIn(t1, t2, t3){
  $('#scT1').textContent = t1; $('#scT2').textContent = t2; $('#scT3').textContent = t3||'';
  const el = $('#skillcut'); el.classList.add('on');
  const b = el.querySelector('.band'); b.style.animation='none'; void b.offsetWidth; b.style.animation='';
  await wait(1300);
  el.classList.remove('on');
}
function showChip(n, isDouble){
  const c = $('#chip');
  c.textContent = n; c.classList.remove('hide','pop');
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
  });
}

/* ══════════ お金 ══════════ */
function give(pi, amount){
  G.players[pi].cash += amount;
  pill(pi, amount);
  const c = G.players[pi].render || tileCenter(G.players[pi].pos);
  addFloat(c.x, c.y-84, (amount>=0?'+':'')+yen(amount), amount>=0?null:'#CFE0F0', true);
  if(amount>=0) SFX.coin(); else SFX.pay();
  updHUD();
}
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
function payFrom(pi, amt){ const p=G.players[pi]; return p.cash>=amt ? true : raiseCash(pi, amt); }

/* ══════════ サイコロ ══════════ */
function rollPair(force, forceDouble){
  let a,b;
  if(forceDouble){ a = 1+((Math.random()*6)|0); b = a; return [a,b]; }
  a = 1+((Math.random()*6)|0); b = 1+((Math.random()*6)|0);
  if(force){
    let guard=0;
    while(((a+b)%2===0?'even':'odd') !== force && guard++<80){
      a = 1+((Math.random()*6)|0); b = 1+((Math.random()*6)|0);
    }
  }
  return [a,b];
}
async function doRoll(pi, force, impact, fixedTotal){
  const p = G.players[pi];
  gaugeOn = false; $('#diceui').classList.remove('on'); stepPreview = null;
  let a,b;
  if(fixedTotal){
    a = Math.max(1, Math.min(6, Math.floor(fixedTotal/2)));
    b = fixedTotal - a;
    if(b>6){ b=6; a=fixedTotal-6; }
  } else {
    [a,b] = rollPair(force, p.forceDouble>0);
    if(p.forceDouble>0) p.forceDouble--;
    if(impact){
      const c = rollPair(force, false);
      if(scoreLanding(pi, c[0]+c[1]) > scoreLanding(pi, a+b)){ a=c[0]; b=c[1]; }
      toast('R','🎯','ゲージインパクト成功！','出目をコントロールしました',1800);
    }
  }
  const seed = (pi*7919 + G.turnsLeft*131 + a*13 + b*7 + G.players[pi].pos) % 100000;
  const th = dvThrow(seed, a, b);
  diceAnim = {t:0, th, lastShake:0};
  SFX.diceShake();
  setTimeout(()=>SFX.diceThrow(), 200*SPEED);
  await wait(th.dur);
  addFx('spark', BCX, DICE_Y-10, 900, '#FFD24D');
  const total = a+b, isDbl = a===b;
  if(isDbl){ SFX.diceDouble(); camShake(12); }
  showChip(total, isDbl);
  await wait(isDbl ? 900 : 560);
  hideChip();
  return {a,b,total,isDbl};
}
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
  if(t.type==='card') return 22;
  if(t.type==='travel') return 45;
  if(t.type==='minigame') return 48;
  return 10;
}
/* 出目えらび（能力・アイテム用） */
function chooseEye(){
  return new Promise(res=>{
    const box = $('#pickeye');
    box.innerHTML = '<div class="cap">出したい目を選んでください</div>';
    for(let n=2;n<=12;n++){
      const b = document.createElement('button');
      b.textContent = n;
      b.onclick = ()=>{ SFX.click(); box.classList.remove('on'); res(n); };
      box.appendChild(b);
    }
    box.classList.add('on');
  });
}

/* ══════════ 移動 ══════════ */
function hop(p, from, to, dur){
  return new Promise(res=>{
    p.moving = true; p.face = (to.x >= from.x) ? 1 : -1;
    let t0 = null; const D = dur*SPEED;
    requestAnimationFrame(function step(now){
      if(t0 === null) t0 = now;
      const k = Math.max(0, Math.min(1,(now-t0)/D));
      p.render = { x: from.x+(to.x-from.x)*k, y: from.y+(to.y-from.y)*k };
      p.hopY = Math.sin(k*Math.PI)*38;
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
  camTo(tileCenter(p.pos).x, tileCenter(p.pos).y, 1.45);
  for(let k=0;k<n;k++){
    const from = tileCenter(p.pos);
    const np = (p.pos+1) % 32;
    p.pos = np;
    const to = tileCenter(np);
    camTo(to.x, to.y, 1.45);
    if(np===0) p.laps++;
    await hop(p, from, to, 158);
    if(np===0 && k < n-1) salary(pi);
  }
  await wait(180);
}
function salary(pi){
  const p = G.players[pi];
  let amt = Math.round((2000000 + p.laps*500000) * ((G.ev && G.ev.salaryX) || 1));
  if(p.salaryX2>0){ amt *= 2; p.salaryX2--; toast('R','💴','給料2倍券','給料が2倍になりました',1900); }
  give(pi, amt);
  toast('R','🚩','スタート通過','給料 '+yen(amt)+' を受け取りました',1800);
}
async function jumpTo(pi, idx){
  const p = G.players[pi];
  const from = tileCenter(p.pos); p.pos = idx;
  const to = tileCenter(idx);
  camTo(to.x, to.y, 1.45);
  addFx('ring', from.x, from.y, 600, '#B58CFF');
  await hop(p, from, to, 540);
  addFx('land', to.x, to.y, 320);
}

/* ══════════ マスの解決 ══════════ */
let resolveDepth = 0;
async function resolve(pi){
  if(resolveDepth > 3) return;
  resolveDepth++;
  try { await resolveInner(pi); } finally { resolveDepth--; }
}
async function resolveInner(pi){
  const p = G.players[pi], i = p.pos, t = G.tiles[i];
  const c = tileCenter(i);
  camTo(c.x, c.y, 1.55);
  await wait(160);

  if(t.type === 'start'){
    give(pi, 4000000); await band('スタートにぴったり！','給料が2倍になりました',1300);
  }
  else if(t.type === 'jail'){
    p.jail = 3; p.dblRun = 0; SFX.bad(); camShake(10);
    await band(G.map.corners[1]+'に閉じ込められました！','3ターンのあいだ移動できません（ゾロ目で脱出）',1800);
  }
  else if(t.type === 'travel'){
    await band(G.map.corners[2]+'に到着','行きたいマスを1つ選べます',1200);
    const dest = (p.kind==='cpu') ? aiPickTravel(pi) : await pickTile(pi,'行き先を選んでください');
    if(dest>=0 && dest!==i){ await jumpTo(pi, dest); await resolve(pi); return; }
  }
  else if(t.type === 'minigame'){
    await miniGame(pi);
  }
  else if(t.type === 'bonus'){
    give(pi, t.amount);
    addFx('pillar', c.x, c.y, 900, '#FFD24D');
    toast('R','💰','ボーナス', yen(t.amount)+' を受け取りました',1900);
  }
  else if(t.type === 'tax'){
    const amt = Math.round(assetOf(G,pi) * t.rate * statMul(p,'special',0.4));
    if(!payFrom(pi, amt)) { await bankrupt(pi, -1); return; }
    give(pi, -amt);
    toast('L','🧾','税金','総資産に応じて '+yen(amt)+' を納めました',1900);
  }
  else if(t.type === 'card'){ await chanceCard(pi); }
  else if(t.type === 'city'){
    if(t.owner < 0 || t.owner === pi){
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
async function payToll(pi, i){
  const t = G.tiles[i], owner = t.owner, p = G.players[pi];
  if(t.frozen>0){ toast('R','🧊','凍結中', t.name+' の通行料は0です',1800); await wait(700); return; }
  let amt = Math.round(tollOf(t, G) * statMul(p,'toll',0.35));
  if(p.freeToll > 0){
    p.freeToll--;
    await cutIn('ITEM','天使カード','通行料 '+yen(amt)+' → 無料');
    return;
  }
  const extra = [];
  if(t.x2) extra.push('×2マス');
  if(hasTriple(G, owner, t.g)) extra.push('トリプル独占 ×2');
  if(hasLine(G, owner, Math.floor(i/8))) extra.push('ライン独占 ×2');
  news(p.name+' → '+G.players[owner].name+' に通行料 '+yen(amt)+'！');
  await band('通行料 '+yen(amt), extra.length ? extra.join(' / ') : (G.players[owner].name+' に支払います'), 1400);
  if(!payFrom(pi, amt)){ await bankrupt(pi, owner); return; }
  give(pi, -amt); give(owner, amt);
  camShake(8);
  await wait(500);
}
async function maybeBuyout(pi, i){
  const t = G.tiles[i], p = G.players[pi];
  if(t.landmark) return;
  const cost = Math.round(cityValue(t) * 2 * statMul(p,'buyout',0.3));
  if(p.cash < cost) return;
  let yes;
  if(p.kind==='cpu') yes = aiBuyout(pi, i, cost);
  else yes = (await modal(parchHTML(t, cost, G.players[t.owner].name))) === 'ok';
  if(!yes) return;
  give(pi, -cost); give(t.owner, cost);
  t.owner = pi;
  SFX.buy();
  addFx('pillar', tileCenter(i).x, tileCenter(i).y, 900, PCOL[pi]);
  addFx('spark', tileCenter(i).x, tileCenter(i).y-30, 900, '#FFD24D');
  toast('R','📜','買収成立', t.name+' を手に入れました',2100);
  news(G.players[pi].name+' が '+t.name+' を買収！ 持ち主が変わりました');
  checkWin();
}
function parchHTML(t, cost, ownerName){
  return '<div class="modal"><div class="parch">'
    + '<h3>買 収 証 書</h3>'
    + '<p>下記の物件を <b>'+esc(ownerName)+'</b> より譲り受けるものとする。<br>'
    + '対価は評価額の2倍とする。</p>'
    + '<div class="amt">'+esc(t.name)+'</div>'
    + '<p style="margin-top:0">買収額 <b style="font-size:20px">'+yen(cost)+'</b></p>'
    + '<div class="sign">Dice Voyage 商工会</div>'
    + '<div class="btnrow" style="justify-content:center">'
    + '<button class="btn ghost" data-act="no">やめる</button>'
    + '<button class="btn gold" data-act="ok">買収する</button></div>'
    + '</div></div>';
}

/* ══════════ 購入・建設 ══════════ */
function buildHTML(i, pi){
  const t = G.tiles[i], p = G.players[pi];
  const own = t.owner === pi;
  const disc = statMul(p,'build',0.3) * (p.halfBuild>0 ? 0.5 : 1) * ((G.ev && G.ev.buildX) || 1);
  let html = '<div class="modal"><div class="deed">'
    + '<div class="dhd"><span class="sw" style="background:'+GCOL[t.g]+'"></span><b>'+esc(t.name)+'</b>'
    + '<span>いまの通行料 '+yen(tollOf(t,G))+'</span></div><div class="dbd">'
    + '<div class="buildgrid">';
  const steps = [];
  steps.push({k:0, nm:'土地', ic:'🏳️', cost:Math.round(t.base*disc), have:own, can:!own});
  for(let k=1;k<=3;k++)
    steps.push({k, nm:BUILD[k].nm, ic:BUILD[k].ic, cost:Math.round(BUILD[k].cost(t.base)*disc),
      have: own && t.lv>=k, can:true});
  steps.push({k:4, nm:'ランドマーク', ic:'🗼', cost:Math.round(BUILD[4].cost(t.base)*disc),
    have:t.landmark, can: own && t.lv>=3 && !t.landmark});
  steps.forEach(s=>{
    const cls = 'bcard' + (s.have?' own':'') + (!s.can?' dis':'');
    html += '<div class="'+cls+'" data-k="'+s.k+'" data-c="'+s.cost+'"><div class="ico">'+s.ic+'</div>'
      + '<div class="nm">'+s.nm+'</div>'
      + '<div class="pr">'+(s.have?'所有ずみ':yen(s.cost))+'</div>'
      + '<div class="tl">通行料 +'+yen(BUILD[s.k].toll(t.base))+'</div></div>';
  });
  html += '</div>'
    + '<div class="sums"><span>選んだぶんの合計</span><em id="bSum">0</em></div>'
    + '<div style="font-size:12.5px;color:#6b5a3c;margin-top:6px">'
    + '同じ色を3つそろえる（トリプル独占）か、1辺の街をぜんぶ持つ（ライン独占）と<b>その場で勝ち</b>。'
    + (p.halfBuild>0 ? '　🏗 建設割引券 適用中（半額）' : '') + '</div>'
    + '<div class="btnrow"><button class="btn ghost" data-act="no">やめる</button>'
    + '<button class="btn gold" data-act="ok" id="bOk">建てる</button></div>'
    + '</div></div></div>';
  return html;
}
async function buyUI(pi, i){
  const t = G.tiles[i], p = G.players[pi];
  const own = t.owner === pi;
  if(!own && t.owner>=0) return;
  if(own && t.landmark){ toast('R','🗼','ランドマーク完成済み', t.name+' はこれ以上建てられません',1800); return; }
  return new Promise(res=>{
    const wrap = $('#modalWrap'), body = $('#modalBody');
    body.innerHTML = buildHTML(i, pi);
    wrap.classList.add('on');
    const sel = new Set();
    const sumEl = body.querySelector('#bSum');
    const cards = Array.from(body.querySelectorAll('.bcard'));
    const costOf = k => +cards.find(c=>+c.dataset.k===k).dataset.c;
    function recalc(){
      let s = 0; sel.forEach(k=>s += costOf(k));
      sumEl.textContent = yen(s);
      body.querySelector('#bOk').disabled = (sel.size===0 || s > p.cash);
      sumEl.style.color = s > p.cash ? '#C0261A' : '#B2411C';
    }
    cards.forEach(cd=>{
      const k = +cd.dataset.k;
      if(cd.classList.contains('dis') || cd.classList.contains('own')) return;
      cd.onclick = ()=>{
        if(k>0 && !own && !sel.has(0)){ sel.add(0); cards.find(c=>+c.dataset.k===0).classList.add('sel'); }
        if(k>0 && k<4){
          for(let j=(own?t.lv+1:1); j<k; j++){
            const cc = cards.find(c=>+c.dataset.k===j);
            if(cc && !cc.classList.contains('own')){ sel.add(j); cc.classList.add('sel'); }
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
          let s = 0; sel.forEach(k=>s += costOf(k));
          if(p.halfBuild>0) p.halfBuild--;
          give(pi, -s);
          if(sel.has(0) || own) t.owner = pi;
          [1,2,3].forEach(k=>{ if(sel.has(k)) t.lv = Math.max(t.lv, k); });
          if(sel.has(4)) t.landmark = true;
          await growAnim(i);
          await deedCard(i, s);
          checkWin();
        }
        res();
      };
    });
  });
}
/* 権利証カード（傾いた紙を差し出す本家の演出） */
async function deedCard(i, paid){
  const t = G.tiles[i];
  const lvNm = t.landmark ? 'ランドマーク' : t.lv>0 ? BUILD[t.lv].nm : '土地';
  await modal('<div class="modal"><div class="deedcard">'
    + '<div class="body">'
    + '<div class="cap" style="background:linear-gradient(90deg,'+GCOL[t.g]+','+shade(GCOL[t.g],-.45)+')">'
    +   'TITLE DEED ／ 権利証</div>'
    + '<h4>'+esc(t.name)+'</h4>'
    + '<div class="rows">'
    +   '<div><span>いまの建物</span><b>'+esc(lvNm)+'</b></div>'
    +   '<div><span>支払った額</span><b>'+yen(paid)+'</b></div>'
    +   '<div><span>これからの通行料</span><b>'+yen(tollOf(t,G))+'</b></div>'
    +   '<div><span>同じ色の所有</span><b>'
    +     CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===t.owner).length+' / 3</b></div>'
    + '</div>'
    + '<div class="btnrow" style="justify-content:center;padding:4px 16px 16px">'
    + '<button class="btn gold" data-act="ok">受け取る</button></div>'
    + '</div><div class="seal">📜</div></div></div>');
}
/* 通行料が上がった瞬間に、盤の上へ赤い袋文字で知らせる（本家の「通行料値上げ！」） */
function raiseBanner(txt){
  const el = $('#raise'); if(!el) return;
  el.textContent = txt || '通行料値上げ！';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  setTimeout(()=>el.classList.remove('on'), 1400*SPEED);
}
async function growAnim(i){
  const t = G.tiles[i]; t.grow = 0;
  raiseBanner(G.tiles[i].landmark ? 'ランドマーク！' : '通行料値上げ！');
  SFX.build();
  const c = tileCenter(i);
  if(t.landmark){ SFX.landmark(); news('🗼 '+G.players[t.owner].name+' が '+t.name+' にランドマークを建設！'); }
  addFx('pillar', c.x, c.y, 950, t.landmark ? '#7FE6FF' : PCOL[t.owner]);
  addFx('ring', c.x, c.y, 700, '#FFD24D');
  addFx('spark', c.x, c.y-26, 900, '#FFF3C0');
  camShake(5);
  let t0 = null; const D = 400*SPEED;
  await new Promise(res=>{
    requestAnimationFrame(function step(now){
      if(t0 === null) t0 = now;
      const k = Math.max(0, Math.min(1,(now-t0)/D));
      t.grow = k<0.7 ? (k/0.7)*1.18 : 1.18 + (1-1.18)*((k-0.7)/0.3);
      if(k<1) requestAnimationFrame(step); else { t.grow = 1; res(); }
    });
  });
  updHUD();
}
function pickTile(pi, msg, filter){
  return new Promise(res=>{
    toast('R','🌀', msg, 'マスをタップしてください', 8000);
    camReset();
    const c = $('#world');
    const done = (v)=>{ c.removeEventListener('pointerdown', onClick); destPin=null; res(v); };
    function onClick(ev){
      const sx = (ev.offsetX / c.clientWidth) * SW;
      const sy = (ev.offsetY / c.clientHeight) * SH;
      const wx = (sx - SW/2)/cam.z + cam.x, wy = (sy - SH/2)/cam.z + cam.y;
      let best = -1, bd = 1e9;
      for(let i=0;i<32;i++){
        const t = tileCenter(i), d = (t.x-wx)*(t.x-wx) + (t.y-wy)*(t.y-wy);
        if(d < bd){ bd = d; best = i; }
      }
      if(bd > 92*92) return;
      if(filter && !filter(best)) return;
      SFX.click(); done(best);
    }
    c.addEventListener('pointerdown', onClick);
    setTimeout(()=>done(-1), 14000*SPEED);
  });
}

/* ══════════ ミニゲーム「悪夢の洞窟脱出」 ══════════ */
function miniHTML(stake, round, mult, hist, win){
  const cells = hist.map(h=>'<div style="padding:3px 0;font-family:var(--pop);font-size:15px;color:'
    +(h==='L'?'#8FD8E8':'#FFC48A')+'">'+(h==='L'?'左':'右')+'</div>').join('');
  const stakes = [500000,1000000,1500000].map(v=>
    '<div class="mgstake'+(v===stake?' on':'')+'" data-v="'+v+'">'+yen(v)+'</div>').join('');
  return '<div class="modal"><div class="mg">'
    + '<div class="mghd">悪夢の洞窟脱出</div>'
    + '<div class="mgbody">'
    +   '<div class="mgleft">'
    +     '<div class="mgcap">最近の結果</div><div class="mghist">'+(cells||'<div style="color:#a98">—</div>')+'</div>'
    +   '</div>'
    +   '<div class="mgstage" id="mgStage">'
    +     '<div class="mground">'
    +       [1,2,3].map(r=>'<span class="'+(r<round?'won':r===round?'now':'')+'">'+r+'<i>GAME</i></span>').join('')
    +     '</div>'
    +     '<div class="mgart" id="mgArt">🕯️</div>'
    +     '<div class="mgmsg" id="mgMsg">どちらの通路に逃げる？</div>'
    +   '</div>'
    +   '<div class="mgright">'
    +     '<div class="mgcap">ゲーム費用</div><div class="mgstakes" id="mgStakes">'+stakes+'</div>'
    +     '<div class="mgcap">ボーナス倍率</div><div class="mgbig">×'+mult+'</div>'
    +     '<div class="mgcap">獲得できる金額</div><div class="mgbig gold">'+yen(win)+'</div>'
    +   '</div>'
    + '</div>'
    + '<div class="mgfoot">'
    +   '<button class="mgarrow" data-act="L">◀</button>'
    +   '<button class="mgstop" data-act="stop">STOP<i>報酬をもらう</i></button>'
    +   '<button class="mgarrow" data-act="R">▶</button>'
    + '</div>'
    + '</div></div>';
}
async function miniGame(pi){
  const p = G.players[pi];
  await band('悪夢の洞窟脱出','左右どちらかの通路を選んで逃げきろう！',1500);
  let stake = 1000000, round = 1, mult = 2 * ((G.ev && G.ev.miniX) || 1), hist = [], banked = 0;
  const wrap = $('#modalWrap'), body = $('#modalBody');
  const rate = 0.5 + statRate(p,'mini')*0.22;       // ミニゲーム勝利ステータスが当たりやすさに効く
  const cpu = p.kind === 'cpu';

  function render(){
    body.innerHTML = miniHTML(stake, round, mult, hist, stake*mult);
    wrap.classList.add('on');
    body.querySelectorAll('.mgstake').forEach(el=>{
      el.onclick = ()=>{ if(round>1) return; stake = +el.dataset.v; SFX.click(); render(); };
    });
  }
  render();

  while(round <= 3){
    let choice;
    if(cpu){ await wait(900); choice = Math.random()<0.5 ? 'L' : 'R'; }
    else {
      choice = await new Promise(res=>{
        body.querySelectorAll('[data-act]').forEach(b=>{
          b.onclick = ()=>{ SFX.click(); res(b.dataset.act); };
        });
      });
    }
    if(choice === 'stop'){ break; }
    // 判定
    const win = Math.random() < rate;
    const art = body.querySelector('#mgArt'), msg = body.querySelector('#mgMsg');
    if(art){ art.textContent = choice==='L' ? '🏃‍♂️💨' : '💨🏃'; }
    if(msg){ msg.textContent = '……'; }
    await wait(650);
    hist.unshift(win ? choice : (choice==='L'?'R':'L'));
    if(hist.length>6) hist.pop();
    if(!win){
      if(art) art.textContent = '💀';
      if(msg){ msg.textContent = 'つかまった！ 賭け金を失いました'; msg.style.color='#FF8A7A'; }
      SFX.bad(); camShake(9);
      await wait(1200);
      wrap.classList.remove('on');
      if(payFrom(pi, stake)){ give(pi, -stake); }
      toast('L','💀','脱出失敗', yen(stake)+' を失いました',2200);
      return;
    }
    if(art) art.textContent = '✨🏃‍♂️';
    if(msg){ msg.textContent = '逃げきった！ 倍率アップ'; msg.style.color='#7DE08A'; }
    SFX.coin();
    banked = stake*mult;
    await wait(850);
    round++; mult *= 2;
    if(round>3) break;
    render();
    if(cpu){
      // CPU は倍率3以上で降りやすい
      const greedy = cfg.ai===2 ? 0.6 : cfg.ai===1 ? 0.45 : 0.3;
      if(Math.random() > greedy) break;
    }
  }
  wrap.classList.remove('on');
  const prize = banked || 0;
  if(prize>0){
    news('🕯️ '+p.name+' がミニゲームで '+yen(prize)+' を獲得！');
    give(pi, prize);
    addFx('pillar', tileCenter(p.pos).x, tileCenter(p.pos).y, 1000, '#FFD24D');
    await cutIn('MINI GAME','脱出成功！', yen(prize)+' を獲得');
  } else {
    toast('L','🕯️','脱出中止','何も得られませんでした',1800);
  }
}

/* 相手が建物を建てている間に「ゆらす」で邪魔できる（本家の妨害操作） */
function shakePhase(me){
  return new Promise(res=>{
    const el = $('#shake'); if(!el){ res(false); return; }
    const p = G.players[me];
    $('#jamLeft').textContent = p.jam;
    el.classList.add('on');
    let done = false;
    const finish = (v)=>{ if(done) return; done = true; el.classList.remove('on');
      $('#shakeBtn').onclick = null; res(v); };
    $('#shakeBtn').onclick = ()=>{
      if(p.jam<=0){ finish(false); return; }
      p.jam--; SFX.skill(); camShake(11);
      const win = Math.random() < 0.45 + statRate(p,'mini')*0.25;
      updHUD();
      if(win) SFX.bad();
      finish(win);
    };
    setTimeout(()=>finish(false), 1700*SPEED);
  });
}

/* ══════════ チャンスカード ══════════ */
const CARDS = [
  {t:'臨時収入',   ic:'💰', d:'思わぬ収入がありました（+200万）', f:async pi=>give(pi,2000000)},
  {t:'大当たり',   ic:'🎉', d:'大きな配当が入りました（+500万）', f:async pi=>give(pi,5000000)},
  {t:'修繕費',     ic:'🔧', d:'建物の修理代を払います（-150万）', f:async pi=>{
      const a=1500000; if(!payFrom(pi,a)) return bankrupt(pi,-1); give(pi,-a); }},
  {t:'スタートへ', ic:'🚩', d:'スタートまで戻って給料を受け取ります', f:async pi=>{
      await jumpTo(pi,0); G.players[pi].laps++; salary(pi); }},
  {t:'天使カード', ic:'🪽', d:'アイテム「天使カード」を手に入れた', f:async pi=>addItem(pi,'angel')},
  {t:'ワープ札',   ic:'🌀', d:'アイテム「ワープ札」を手に入れた',   f:async pi=>addItem(pi,'warp')},
  {t:'凍結ブロック',ic:'🧊', d:'アイテム「凍結ブロック」を手に入れた', f:async pi=>addItem(pi,'freeze')},
  {t:'サイコロ改造',ic:'🎲', d:'アイテム「サイコロ改造」を手に入れた', f:async pi=>addItem(pi,'dice')},
  {t:'監獄行き',   ic:'🧊', d:'氷の監獄へ送られます', f:async pi=>{
      await jumpTo(pi,8); G.players[pi].jail=3; SFX.bad(); }},
  {t:'建設バーゲン',ic:'🏗', d:'アイテム「建設割引券」を手に入れた', f:async pi=>addItem(pi,'half')},
  {t:'みんなから', ic:'🤝', d:'全員から 100万 ずつ受け取ります', f:async pi=>{
      let s=0; G.players.forEach((q,j)=>{ if(j!==pi && !q.out){
        const a=Math.min(1000000,q.cash); q.cash-=a; s+=a; } }); give(pi,s); }},
  {t:'ダイス追加', ic:'✌️', d:'奇数・偶数ボタンが1回ずつ増えます', f:async pi=>{
      G.players[pi].odd++; G.players[pi].even++; }}
];
function addItem(pi, id){
  const p = G.players[pi];
  if(p.items.length>=4){ toast('R','🎒','持ち物がいっぱい','アイテムを使ってから拾ってください',1900); return; }
  p.items.push(id); renderItems();
}
async function chanceCard(pi){
  const p = G.players[pi];
  // 黄金フォーチュンが高いほど良いカードを引きやすい
  const lucky = Math.random() < (statRate(p,'fortune')*0.55 + ((G.ev && G.ev.luck) || 0));
  let pool = CARDS;
  if(lucky) pool = CARDS.filter(c=>c.t!=='修繕費' && c.t!=='監獄行き');
  const c = pool[(Math.random()*pool.length)|0];
  if(p.kind!=='cpu'){
    await modal('<div class="modal"><div class="deedcard">'
      + '<div class="body">'
      + '<div class="cap" style="background:linear-gradient(90deg,#7A4BC8,#3D2470)">CHANCE CARD</div>'
      + '<h4>'+c.ic+' '+esc(c.t)+'</h4>'
      + '<div class="rows"><div><span>効果</span></div></div>'
      + '<p style="padding:0 16px 14px;font-size:14px;line-height:1.75;text-align:center">'+esc(c.d)+'</p>'
      + '<div class="btnrow" style="justify-content:center;padding:0 16px 16px">'
      + '<button class="btn gold" data-act="ok">OK</button></div>'
      + '</div><div class="seal">'+c.ic+'</div></div></div>');
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
    for(let g=0; g<7; g++) if(hasTriple(G,pi,g)) return finish(pi,'トリプル独占', GCOL[g]);
    for(let s=0; s<4; s++) if(hasLine(G,pi,s)) return finish(pi,'ライン独占');
  }
  const alive = G.players.filter(p=>!p.out);
  if(alive.length === 1) return finish(G.players.indexOf(alive[0]),'独り勝ち');
  return false;
}
async function bankrupt(pi, toPi){
  const p = G.players[pi];
  p.out = true; p.cash = 0;
  G.tiles.forEach(t=>{ if(t.type==='city' && t.owner===pi){
    if(toPi>=0){ t.owner = toPi; } else { t.owner=-1; t.lv=0; t.landmark=false; }
  }});
  SFX.bad(); camShake(14);
  news('！！ '+p.name+' が破産しました ！！');
  await band(p.name+' が破産しました',
    toPi>=0 ? '持っていた街は '+G.players[toPi].name+' のものに' : '街は市場に戻りました', 2000);
  checkWin();
}
function finish(pi, reason, col){
  bgm('win');
  news('🏆 '+G.players[pi].name+' が「'+reason+'」で勝利！');
  G.over = true; G.winner = pi; G.winReason = reason; G.running = false;
  celebrate(pi, reason, col);
  return true;
}
async function celebrate(pi, reason, col){
  SFX.win();
  $('#cel1').textContent = 'おめでとうございます！';
  $('#cel2').textContent = reason;
  $('#cel3').textContent = G.players[pi].name + ' の勝ち！';
  const l4 = $('#cel4'); if(l4) l4.textContent = 'FORTUNE!';
  $('#celebrate').classList.add('on');
  const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  camShake(16);
  // 盤の下辺から噴煙柱が一斉に立ち上がる（本家の独占演出）
  for(let k=0;k<9;k++) addFx('steam', 210 + k*150, 760, 2000);
  for(let k=0;k<8;k++){
    const x = 260 + Math.random()*1080, y = 300 + Math.random()*320;
    addFx('steam', x, y+150, 1700);
    addFx('spark', x, y, 1000, col||'#FFD24D');
    addFx('ring', x, y+60, 800, '#FFF3C0');
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
      + '<td>'+esc(p.name)+' <small style="color:#8fa6c0">'+esc((cardById(p.card)||{nm:''}).nm)+'</small>'
      + (p.out?' <small style="color:#E8747E">破産</small>':'')+'</td>'
      + '<td>'+yen(p.cash)+'</td><td>'+yen(est)+'</td><td><em>'+yen(Math.max(0,r.a))+'</em></td>';
    tb.appendChild(tr);
  });
  bgm('lobby');
  screenTo('result');
  const meSeat = G.players.findIndex(p=>p.kind!=='cpu');
  grantRewards(meSeat>=0 && G.winner===meSeat);
}

/* ══════════ ターン進行 ══════════ */
async function turnLoop(){
  G.running = true;
  while(!G.over){
    const pi = G.turn, p = G.players[pi];
    if(p.out){ nextTurn(); continue; }
    // 凍結の解除
    G.tiles.forEach(t=>{ if(t.frozen>0) t.frozen--; });
    p.mana = Math.min(100, p.mana + 34);
    updHUD();
    await turnBig(pi);

    if(p.jail > 0){ await jailTurn(pi); nextTurn(); if(G.turnsLeft<=0){ timeUp(); break; } continue; }

    let again = true, guard = 0;
    while(again && !G.over && guard++ < 4){
      again = false;
      G.phase = 'wait';
      updHUD();
      const r = await takeRoll(pi);
      G.phase = 'move';
      if(G.over) break;
      if(r.isDbl){
        p.dblRun++;
        if(p.dblRun >= 3){
          await band('ゾロ目 3回！', G.map.corners[1]+'へ送られます', 1700);
          await jumpTo(pi, 8); p.jail = 3; p.dblRun = 0; break;
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
    if(G.turnsLeft === 8) bgm('tense');
    await wait(240);
  }
  G.running = false;
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
function timeUp(){ const rk = rank(); finish(rk[0].i, 'ターン終了・総資産1位'); }
async function jailTurn(pi){
  const p = G.players[pi];
  camTo(tileCenter(8).x, tileCenter(8).y, 1.55);
  await band(G.map.corners[1]+' — あと '+p.jail+' ターン','ゾロ目が出れば脱出できます',1400);
  const r = await doRoll(pi, null, false);
  if(r.isDbl){
    p.jail = 0;
    await band('脱出成功！','ゾロ目でここから出られます',1300);
    await moveSteps(pi, r.total); await resolve(pi);
    return;
  }
  p.jail--;
  if(p.jail<=0) toast('R','🔓','次のターンから動けます','',1700);
  camReset();
}
function takeRoll(pi){
  const p = G.players[pi];
  if(p.kind === 'cpu') return aiRoll(pi);
  return new Promise(res=>{
    stepPreview = {from:p.pos, max:12};
    gaugeSweet = 0.22 + Math.random()*0.56;
    gaugeHalf = 0.055 + statRate(p,'gauge')*0.075;   // ゲージインパクトのステータスが枠の広さに効く
    gaugeOn = true;
    $('#diceui').classList.add('on');
    $('#oddN').textContent = p.odd; $('#evenN').textContent = p.even;
    $('#odd').classList.toggle('dim', p.odd<=0);
    $('#even').classList.toggle('dim', p.even<=0);
    const clear = ()=>{ $('#push').onclick=null; $('#odd').onclick=null; $('#even').onclick=null;
      $('#skillBtn').onclick=null; };
    const done = async (force)=>{
      clear();
      const impact = Math.abs(gaugePhase - gaugeSweet) < gaugeHalf;
      if(force==='odd') p.odd--; if(force==='even') p.even--;
      let fixed = 0;
      if(p.chooseEye>0){ p.chooseEye--; gaugeOn=false; $('#diceui').classList.remove('on');
        fixed = await chooseEye(); }
      res(await doRoll(pi, force, impact, fixed));
    };
    $('#push').onclick = ()=>{ SFX.click(); done(null); };
    $('#odd').onclick  = ()=>{ if(p.odd>0){ SFX.click(); done('odd'); } };
    $('#even').onclick = ()=>{ if(p.even>0){ SFX.click(); done('even'); } };
    $('#skillBtn').onclick = async ()=>{
      if($('#skillBtn').disabled) return;
      clear(); gaugeOn=false; $('#diceui').classList.remove('on');
      await useSkill(pi);
      res(await takeRoll(pi));
    };
  });
}

/* ══════════ 能力 ══════════ */
async function useSkill(pi){
  const p = G.players[pi];
  const card = cardById(p.card) || CARDPOOL[0];
  p.skillLeft--; p.mana = 0;
  SFX.skill(); camShake(9);
  const c = p.render || tileCenter(p.pos);
  addFx('pillar', c.x, c.y, 1100, PCOL[pi]);
  addFx('ring', c.x, c.y, 800, PCOL[pi]);
  await cutIn(card.role, p.skill.nm, p.skill.ds);
  const k = p.skillKind;
  if(k===0){
    p.freeToll++;
    if(card.rar==='SS'){
      const d = (p.kind==='cpu')
        ? (()=>{ let b=-1,bv=-1; for(let i=0;i<32;i++){ const t=G.tiles[i];
            if(t.type==='city'&&t.owner>=0&&t.owner!==pi){ const v=tollOf(t,G); if(v>bv){bv=v;b=i;} } } return b; })()
        : await pickTile(pi,'凍らせる街を選んでください',
            i=>G.tiles[i].type==='city'&&G.tiles[i].owner>=0&&G.tiles[i].owner!==pi);
      if(d>=0){ G.tiles[d].frozen = 2;
        addFx('ring', tileCenter(d).x, tileCenter(d).y, 700, '#8FE8FF');
        toast('R','🧊','凍結', G.tiles[d].name+' の通行料が2ターン0になります', 2200); }
    }
  }
  if(k===1){ p.chooseEye++; if(card.rar==='SS') p.extraRoll = (p.extraRoll||0)+1; }
  if(k===2){
    if(card.rar==='SS') p.freeToll++;
    const d = (p.kind==='cpu') ? aiPickTravel(pi) : await pickTile(pi,'移動先を選んでください');
    if(d>=0){ await jumpTo(pi,d); await resolve(pi); }
  }
  if(k===3) give(pi, Math.round(assetOf(G,pi)*p.skillPow));
  updHUD();
}

/* ══════════ CPU ══════════ */
async function aiRoll(pi){
  const p = G.players[pi];
  stepPreview = {from:p.pos, max:12};
  gaugeSweet = 0.5; gaugeHalf = 0.055 + statRate(p,'gauge')*0.075;
  gaugeOn = true; $('#diceui').classList.add('on');
  await wait(750);
  // 能力・アイテムを使うか
  if(p.mana>=100 && p.skillLeft>0 && cfg.ai>=1 && Math.random()<0.7){
    gaugeOn=false; $('#diceui').classList.remove('on');
    await useSkill(pi);
    return aiRoll(pi);
  }
  if(cfg.ai>=1 && p.items.length && Math.random()<0.25){
    const k = (Math.random()*p.items.length)|0;
    const id = p.items[k];
    if(id==='angel'||id==='half'||id==='salary'||id==='double'){
      p.items.splice(k,1); renderItems();
      const it = itemById(id);
      toast('L', it.ic, 'CPUがアイテム使用', it.nm, 2000);
      if(id==='angel') p.freeToll++; if(id==='half') p.halfBuild++;
      if(id==='salary') p.salaryX2++; if(id==='double') p.forceDouble++;
    }
  }
  let force = null;
  if(cfg.ai>=1 && (p.odd>0 || p.even>0)){
    const so = bestParity(pi,'odd'), se = bestParity(pi,'even'), sn = avgScore(pi);
    if(p.odd>0 && so > sn + (cfg.ai===2?6:16) && so >= se) { force='odd'; p.odd--; }
    else if(p.even>0 && se > sn + (cfg.ai===2?6:16)) { force='even'; p.even--; }
  }
  const impact = cfg.ai===2 ? Math.random()<0.55 : cfg.ai===1 ? Math.random()<0.3 : Math.random()<0.1;
  return doRoll(pi, force, impact, 0);
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
  const disc = statMul(p,'build',0.3) * (p.halfBuild>0 ? 0.5 : 1) * ((G.ev && G.ev.buildX) || 1);
  const reserve = [6000000, 3500000, 1800000][lvl];
  let spend = 0, lvTarget = t.lv, land = false, lm = false;
  if(!own){
    const price = Math.round(t.base*disc);
    if(p.cash - price < reserve) return;
    land = true; spend += price;
  }
  const near = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
  const aggr = near>=1 ? 1 : 0;
  for(let k = (own? t.lv+1 : 1); k<=3; k++){
    const c = Math.round(BUILD[k].cost(t.base)*disc);
    if(p.cash - spend - c < reserve - aggr*1500000) break;
    if(lvl===0 && k>1) break;
    if(lvl===1 && k>2 && !aggr) break;
    spend += c; lvTarget = k;
  }
  if(lvl===2 && lvTarget===3 && near>=1){
    const c = Math.round(BUILD[4].cost(t.base)*disc);
    if(p.cash - spend - c > reserve){ spend += c; lm = true; }
  }
  if(spend === 0) return;
  // 人間プレイヤーは「ゆらす」で邪魔できる
  const me = G.players.findIndex(q=>q.kind!=='cpu' && !q.out);
  if(me>=0 && me!==pi && G.players[me].jam>0){
    const jammed = await shakePhase(me);
    if(jammed){
      lvTarget = Math.max(t.lv, lvTarget-1);
      spend = Math.round(spend*0.5); lm = false;
      if(lvTarget<=t.lv && !land) { toast('L','✋','じゃま成功！','建設を止めました',2200); return; }
    }
  }
  if(p.halfBuild>0) p.halfBuild--;
  give(pi, -spend);
  if(land || own) t.owner = pi;
  t.lv = Math.max(t.lv, lvTarget);
  if(lm) t.landmark = true;
  toast('L','🏗',(land?'購入':'建設')+'：'+t.name, yen(spend)+' を投資しました', 2000);
  news(p.name+' が '+t.name+' に '+yen(spend)+' を投資！');
  await growAnim(i);
  checkWin();
}
function aiBuyout(pi, i, cost){
  const t = G.tiles[i], p = G.players[pi], lvl = cfg.ai;
  if(lvl===0) return false;
  const near = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
  const reserve = [6000000, 3500000, 1800000][lvl];
  if(p.cash - cost < reserve) return false;
  if(near >= 2) return true;
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
    else if(t.type==='minigame') s = 38;
    else if(t.type==='card') s = 22;
    else if(t.type==='jail') s = -999;
    else if(t.type==='start') s = 35;
    else s = 10;
    if(s > bs){ bs = s; best = i; }
  }
  return best;
}

/* ══════════ 画面 ══════════ */
/* 切り替えは一瞬で入れ替えず、金色のワイプを1枚はさむ。
   これがあるだけで「間」ができて安っぽさが消える。 */
let wiping = false;
function screenTo(id){
  if(wiping){ $$('.screen').forEach(s=>s.classList.toggle('on', s.id===id)); return; }
  const w = $('#wipe');
  const cur = $$('.screen').find(s=>s.classList.contains('on'));
  if(!cur || cur.id===id){ $$('.screen').forEach(s=>s.classList.toggle('on', s.id===id)); return; }
  wiping = true;
  w.classList.add('on','go');
  setTimeout(()=>{ $$('.screen').forEach(s=>s.classList.toggle('on', s.id===id)); }, 250);
  setTimeout(()=>{ w.classList.remove('on','go'); wiping = false; }, 620);
}
function hideAllScreens(){
  const w = $('#wipe');
  w.classList.add('on','go');
  return new Promise(res=>{
    setTimeout(()=>{ $$('.screen').forEach(s=>s.classList.remove('on')); res(); }, 300);
    setTimeout(()=>{ w.classList.remove('on','go'); }, 640);
  });
}

function renderMaps(){
  const box = $('#mapList'); box.innerHTML = '';
  MAPS.forEach(m=>{
    const d = document.createElement('div');
    d.className = 'mapcard' + (m.id===cfg.mapId ? ' sel' : '');
    d.innerHTML = '<div class="thumb" style="background:radial-gradient(90% 90% at 50% 30%,'
      + (m.deco==='ice'?'#173a63,#0B1E3A':m.deco==='world'?'#22417a,#0E1435':'#5b2f52,#2A1533')+')">'
      + m.emoji+'</div><div class="nm">'+esc(m.name)+'<i>'+esc(m.sub)+'</i></div>';
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
      + '<input type="text" id="sn'+i+'" value="'+esc(s.name)+'" maxlength="10">'
      + '<select id="sk'+i+'">'
      + '<option value="you"'+(s.kind==='you'?' selected':'')+'>あなた</option>'
      + '<option value="human"'+(s.kind==='human'?' selected':'')+'>ともだち</option>'
      + '<option value="cpu"'+(s.kind==='cpu'?' selected':'')+'>CPU</option></select>';
    box.appendChild(d);
    d.querySelector('#sn'+i).oninput = e => cfg.seats[i].name = e.target.value || ('プレイヤー'+(i+1));
    d.querySelector('#sk'+i).onchange = e => { cfg.seats[i].kind = e.target.value; };
  }
}

/* キャラクター選択 */
function statBar(v, hi){
  return '<div style="display:flex;align-items:center;gap:6px;margin:2px 0">'
    + '<span style="flex:0 0 88px;font-size:10.5px;color:'+(hi?'#FFD24D':'#9FB6CC')+'">'+hi+'</span>'
    + '<span style="flex:1;height:7px;border-radius:4px;background:#0a1420;overflow:hidden;display:block">'
    +   '<i style="display:block;height:100%;width:'+v+'%;background:linear-gradient(90deg,#E08A1A,#FFD24D)"></i>'
    + '</span>'
    + '<span style="flex:0 0 24px;text-align:right;font-family:var(--pop);font-size:11px;color:#FFE9B5">'+v+'</span>'
    + '</div>';
}
async function pickPhase(){
  screenTo('pick');
  const grid = $('#pickGrid');
  const taken = new Set();
  const humans = [];
  for(let i=0;i<cfg.n;i++) if(cfg.seats[i].kind!=='cpu') humans.push(i);

  function draw(activeSeat){
    grid.innerHTML = '';
    const mine = ownedCards();
    const list = mine.length ? mine : [CARDPOOL[0]];
    grid.style.gridTemplateColumns = 'repeat('+Math.min(5, Math.max(3, list.length))+',1fr)';
    list.forEach(c=>{
      const o = SV.cards[c.id] || {lv:1};
      const st = cardStats(c.id, o.lv, SV.equip===c.id ? SV.slots : []);
      const d = document.createElement('div');
      d.className = 'chcard' + (taken.has(c.id) ? ' taken' : '');
      d.innerHTML = '<div class="tag">'+RAR[c.rar].nm+' ／ Lv.'+o.lv+'</div>'
        + '<div class="body">'
        + '<canvas width="240" height="340"></canvas>'
        + '<div class="nm">'+esc(c.nm)+'</div>'
        + '<div class="role">'+esc(c.role)+'　「'+esc(c.line)+'」</div>'
        + '<div class="ab"><b>'+esc(c.sk.nm)+'（'+c.sk.uses+'回）</b>'+esc(c.sk.ds)+'</div>'
        + '<div class="stw">'+statRows(st)+'</div>'
        + '</div>';
      regPortrait(d.querySelector('canvas'), c.art, c.col);
      d.onclick = ()=>{ if(taken.has(c.id)) return; SFX.click(); pickOne(activeSeat, c.id); };
      grid.appendChild(d);
    });
  }
  let resolveAll;
  const done = new Promise(r=>resolveAll=r);
  let hi = 0;
  function fillCpus(){
    for(let i=0;i<cfg.n;i++){
      if(cfg.seats[i].cardId) continue;
      const tier = cfg.ai===2 ? ['SS','S'] : cfg.ai===1 ? ['S','A'] : ['A'];
      let free = CARDPOOL.filter(c=>!taken.has(c.id) && tier.indexOf(c.rar)>=0);
      if(!free.length) free = CARDPOOL.filter(c=>!taken.has(c.id));
      const pick = free[(Math.random()*free.length)|0] || CARDPOOL[i%CARDPOOL.length];
      cfg.seats[i].cardId = pick.id; taken.add(pick.id);
    }
  }
  function nextHuman(){
    if(hi >= humans.length){ fillCpus(); resolveAll(); return; }
    const seat = humans[hi];
    $('#pickWho').innerHTML = '<b style="color:'+PCOL[seat]+'">'+esc(cfg.seats[seat].name)
      + '</b> さん、カードを選んでください　'
      + '<span style="color:#8FA9C4;font-size:13px">（ガチャで増やせます）</span>';
    draw(seat);
  }
  function pickOne(seat, cardId){
    cfg.seats[seat].cardId = cardId; taken.add(cardId);
    hi++; nextHuman();
  }
  for(let i=0;i<cfg.n;i++) cfg.seats[i].cardId = null;
  if(humans.length===0){ $('#pickWho').textContent='CPU がカードを選んでいます…';
    fillCpus(); await wait(700); resolveAll(); }
  else nextHuman();
  await done;
}

/* ローディング */
const TIPS = [
  '同じ色の街を3つそろえると「トリプル独占」でその場で勝ちです。',
  '1辺の街をぜんぶ持つと「ライン独占」でその場で勝ちです。',
  '奇数・偶数ボタンを押すと、かならずその出目が出ます（回数かぎり）。',
  'ゲージが光っているところで「押す」と、出目をコントロールできます。',
  'ゾロ目が出たらもう一回。ただし3回続くと監獄行きです。',
  '相手の街には「買収」で乗り込めます。値段は評価額の2倍です。',
  'ランドマークを建てると通行料が跳ね上がり、買収されなくなります。',
  '角の「悪夢の洞窟」ではミニゲームに挑戦できます。当たるたび倍率が2倍に。',
  'キャラクターの能力は魔力ゲージが満タンになると使えます。',
  'アイテムはサイコロを振る前に使ってください。'
];
async function loadingPhase(){
  const map = MAPS.find(m=>m.id===cfg.mapId) || MAPS[0];
  $('#loadArt').textContent = map.emoji;
  $('#loadTitle').textContent = map.name;
  $('#loadTip').textContent = TIPS[(Math.random()*TIPS.length)|0];
  screenTo('loading');
  const bar = $('#loadBar'), pct = $('#loadPct');
  for(let v=0; v<=100; v+=4){
    bar.style.width = v+'%'; pct.textContent = v+'%';
    if(v%20===0) SFX.tick();
    await wait(28);
  }
  await wait(220);
}

/* 順番決め */
async function orderPhase(){
  screenTo('order');
  const box = $('#orderCards'); box.innerHTML = '';
  const n = cfg.n;
  const nums = Array.from({length:n}, (_,i)=>i+1);
  for(let i=nums.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=nums[i]; nums[i]=nums[j]; nums[j]=t; }
  const picked = new Array(n).fill(null);
  const humanSeat = cfg.seats.slice(0,n).findIndex(s=>s.kind!=='cpu');
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
      if(taken >= n) setTimeout(res, 950);
      else setTimeout(autoPick, 520);
    };
    const autoPick = ()=>{
      const free = cards.map((c,k)=>k).filter(k=>!cards[k].classList.contains('flip'));
      if(free.length) reveal(free[(Math.random()*free.length)|0]);
    };
    cards.forEach((c,k)=>c.onclick = ()=>{ if(humanSeat>=0 && taken===0) reveal(k); });
    if(humanSeat<0) setTimeout(autoPick, 700);
  });
  const seatOrder = cfg.seats.slice(0,n).map((s,i)=>({i, v:picked[i] != null ? picked[i] : (i+1)}))
                      .sort((a,b)=>a.v-b.v).map(o=>o.i);
  cfg.seats = seatOrder.map(i=>cfg.seats[i]).concat(cfg.seats.slice(n));
}

/* ══════════ 起動 ══════════ */
$('#toSetup').onclick = ()=>{ SFX.click(); ac(); screenTo('setup'); };
$('#backTitle').onclick = ()=>{ SFX.click(); screenTo('title'); };
$('#optPlayers').onchange = e => { cfg.n = +e.target.value; renderSeats(); };
$('#optTurns').onchange   = e => cfg.turns = +e.target.value;
$('#optTime').onchange    = e => cfg.timeLimit = +e.target.value;
$('#optCash').onchange    = e => cfg.cash  = +e.target.value;
$('#optAI').onchange      = e => cfg.ai    = +e.target.value;
$('#optSpeed').onchange   = e => { cfg.speed = +e.target.value; SPEED = cfg.speed; };
$('#optArt').onchange     = e => { setArtStyle(e.target.value); refreshArt(); SFX.click(); };

async function launch(){
  SPEED = cfg.speed;
  await pickPhase();
  await vsScreen();
  await loadingPhase();
  await orderPhase();
  await hideAllScreens();
  newGame();
  camReset(); updHUD();
  bgm('game');
  const w = thisWeek();
  await band('ゲームスタート！', G.map.name + ' — のこり ' + cfg.turns + ' ターン', 1400);
  await cutIn('THIS WEEK', w.ic + ' ' + w.nm, w.ds);
  turnLoop();
}
$('#startGame').onclick = ()=>{ SFX.click(); ac(); launch(); };
$('#againSame').onclick = async ()=>{
  SFX.click(); await hideAllScreens(); newGame(); camReset(); updHUD();
  await band('もう一回！', G.map.name, 1200); turnLoop();
};
$('#againSetup').onclick = ()=>{ SFX.click(); screenTo('setup'); };

/* ── 音量バー（音楽と効果音を別々に） ── */
function applyAudioPrefs(){
  soundOn = sfxVol > 0.001;
  $('#sfxBtn').classList.toggle('off', !soundOn);
  $('#bgmBtn').classList.toggle('off', !bgmOn || bgmVol < 0.001);
  if(MUSIC) MUSIC.setVolume(bgmOn ? bgmVol : 0);
  if(SFXE && SFXE.setVolume) SFXE.setVolume(sfxVol);
  try{ localStorage.setItem('dv_audio', JSON.stringify({bgmOn,bgmVol,sfxVol})); }catch(e){}
}
try{
  const a = JSON.parse(localStorage.getItem('dv_audio')||'null');
  if(a){ bgmOn=!!a.bgmOn; bgmVol=+a.bgmVol||0; sfxVol=+a.sfxVol||0;
    $('#bgmVol').value = Math.round(bgmVol*100); $('#sfxVol').value = Math.round(sfxVol*100); }
}catch(e){}
$('#bgmBtn').onclick = ()=>{ bgmOn = !bgmOn; applyAudioPrefs(); SFX.click(); };
$('#sfxBtn').onclick = ()=>{ sfxVol = sfxVol>0.001 ? 0 : 0.7; $('#sfxVol').value = sfxVol*100;
  applyAudioPrefs(); SFX.click(); };
$('#bgmVol').oninput = e => { bgmVol = e.target.value/100; bgmOn = bgmVol>0.001; applyAudioPrefs(); };
$('#sfxVol').oninput = e => { sfxVol = e.target.value/100; applyAudioPrefs(); };
applyAudioPrefs();
$('#menu').onclick = async ()=>{
  if(!G) return;
  const r = await modal('<div class="modal"><div class="dark"><h3>⏸ メニュー</h3>'
    + '<p>ゲームを中断してタイトルに戻りますか？</p>'
    + '<div class="btnrow" style="justify-content:center;margin-top:16px">'
    + '<button class="btn ghost" data-act="no">つづける</button>'
    + '<button class="btn red" data-act="ok">タイトルへ</button></div></div></div>');
  if(r==='ok'){ G.over = true; G.running=false; screenTo('title'); }
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

/* 上部の帯：本家と同じく「誰が何をしたか」が流れる実況テロップ。
   試合中は実況、それ以外は遊び方のヒントを出す。 */
const NEWS = [];
function news(txt){
  NEWS.push(txt);
  if(NEWS.length > 12) NEWS.shift();
  const el = $('#tickerText');
  el.textContent = txt;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
}
/* 他のプレイヤーの当たりが流れ続ける（本家の上部テロップ）。
   これが無いと「一人で遊んでいる練習台」に見えてしまう。 */
const MARQ_NM = ['ボン・クレー','しゅう','あんぱん','たなか','みっちゃん','ジェイド','くり',
  'れっちゃん','shino','はるお','ちゅーすけ','イナバ','もこ','ren','claire','波平','さっちん',
  'jade','мaru','ゆうき'];
const MARQ_EV = ['S+クラス守護獣 獲得おめでとう！','Sクラスペンダント 獲得おめでとう！',
  'S+ペンダント 獲得！ 50ダイヤ獲得！','トリプル独占で勝利！','ミニゲームで 800万 獲得！',
  'ランドマークを建設！','マイレージガチャで S+ を引き当てました！'];
let marqI = 0;
function marquee(){
  const n = MARQ_NM[(marqI*7+3) % MARQ_NM.length];
  const e = MARQ_EV[(marqI*5+1) % MARQ_EV.length];
  marqI++;
  return n + ' ' + e;
}
let tipI = 0;
setInterval(()=>{
  const el = $('#tickerText');
  const inGame = G && !G.over && G.running;
  if(inGame && NEWS.length){ el.textContent = NEWS[(tipI++) % NEWS.length]; }
  else if(inGame){ tipI = (tipI+1) % TIPS.length; el.textContent = TIPS[tipI]; }
  else { el.textContent = marquee(); }
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
}, 5200);
$('#tickerText').textContent = TIPS[0];

renderMaps(); renderSeats(); fitStage();
$('#optTurns').value = cfg.turns; $('#optCash').value = cfg.cash;
$('#optAI').value = cfg.ai; $('#optPlayers').value = cfg.n; $('#optTime').value = cfg.timeLimit;
$('#optArt').value = ART_STYLE;

try{
  const boot = st => { if(st && st.cfg){ Object.assign(cfg, st.cfg); renderMaps(); renderSeats(); } };
  if(window.claude && window.claude.hot){
    window.claude.hot.snapshot(()=>({cfg}));
    window.claude.hot.ready ? window.claude.hot.ready(boot) : boot(window.claude.hot.data||{});
  }
}catch(e){}
