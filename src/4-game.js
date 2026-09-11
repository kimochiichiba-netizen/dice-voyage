
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — ゲーム進行・演出・CPU・画面
   ══════════════════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
let SPEED = 1;
const wait = ms => new Promise(r => setTimeout(r, Math.max(0, ms*SPEED)));
const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ══════════ ステージのフィット（横画面バグ対策の要） ══════════ */
let forcePortrait = false, portraitDir = 90;
/* 画面のふちに貼り付くとブラウザの戻るジェスチャーと喧嘩して押せなくなるので、
   ほんの少しだけ内側に置く */
const FIT_MARGIN = 0.965;
function fitStage(){
  const vp = $('#viewport'), g = window.visualViewport;
  // iOS Safari の innerHeight はツールバーの裏側まで含む。実際に見えている高さで測る
  const vw = Math.max(240, Math.min(vp ? vp.clientWidth  : window.innerWidth,
                                    g ? g.width  : window.innerWidth));
  const vh = Math.max(240, Math.min(vp ? vp.clientHeight : window.innerHeight,
                                    g ? g.height : window.innerHeight));
  const stage = $('#stage');
  const portrait = vh > vw * 1.02;
  $('#rotate').classList.toggle('on', portrait && !forcePortrait);
  let s, rot = '';
  if(portrait && forcePortrait){ s = Math.min(vh/SW, vw/SH) * FIT_MARGIN; rot = ' rotate('+portraitDir+'deg)'; }
  else { s = Math.min(vw/SW, vh/SH) * FIT_MARGIN; }
  stage.style.transform = 'translate(-50%,-50%)'+rot+' scale('+s+')';
  const c = $('#world');
  const dpr = Math.min(2, window.devicePixelRatio||1);
  if(c.width !== Math.round(SW*dpr)){ c.width = Math.round(SW*dpr); c.height = Math.round(SH*dpr); }
}
addEventListener('resize', fitStage);
addEventListener('orientationchange', ()=>{ setTimeout(fitStage,120); setTimeout(fitStage,420); });
// iOS はスクロールでツールバーが伸び縮みし、そのたび見えている高さが変わる
if(window.visualViewport){
  visualViewport.addEventListener('resize', fitStage);
  visualViewport.addEventListener('scroll', fitStage);
}
// 初回はフォントや画像の読み込みで高さが動くので、少し遅れてもう一度合わせる
setTimeout(fitStage, 300); setTimeout(fitStage, 1200);
$('#playPortrait').onclick  = ()=>{ forcePortrait = true; portraitDir =  90; fitStage(); };
$('#playPortrait2').onclick = ()=>{ forcePortrait = true; portraitDir = -90; fitStage(); };

/* ══════════ サウンド ══════════
   効果音は dvSfx（1音を2〜4層重ねた合成音）、音楽は dvMusic2（4曲・各16小節。1音を
   2〜3オシレータで重ね、フィルタ開閉・コーラス・キック連動のダッキングで厚みを出す）。
   どちらも音源ファイルを使わず Web Audio で作っている。
   ブラウザの自動再生制限があるので、最初のクリックまで AudioContext は作らない。
   ══════════════════════════════════════════ */
let AC = null, soundOn = true, SFXE = null, MUSIC = null, JING = null, audioReady = false;
let MUSICF = null, MUSICS = null;   // F=音楽ファイル版 ／ S=合成音版
let bgmOn = true, bgmVol = 0.55, sfxVol = 0.70;
function ac(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state === 'suspended'){ try{ AC.resume(); }catch(e){} }
  if(AC && !audioReady){
    audioReady = true;
    try{ SFXE = dvSfx(AC); }catch(e){ SFXE = null; }
    try{ JING = dvJingle(AC); }catch(e){ JING = null; }    // 短い曲（建設・独占など6本）
    try{ MUSICF = dvMusicFiles(AC, (window.DV_BGM || null)); }catch(e){ MUSICF = null; }
    try{ MUSICS = dvMusic2(AC); }
    catch(e){ try{ MUSICS = dvMusic(AC); }catch(e2){ MUSICS = null; } }
    MUSIC = MUSICF || MUSICS;
    try{ applyAudioPrefs(); }catch(e){}
    try{ if(MUSIC) MUSIC.play('lobby'); }catch(e){}
  }
  return AC;
}
const SFX = (function(){
  const names = ['click','hover','diceShake','diceThrow','diceLand','diceDouble','step','land',
    'coin','pay','build','landmark','buy','skill','gachaRoll','gachaRare','win','lose','tick','warn',
    /* 追加ぶん：札束・金貨・紙吹雪・衝撃波・ゲージ3種・カード出現 */
    'bill','coinBurst','confetti','shock','gaugeCharge','gaugeOk','gaugeNg','cardIn'];
  const o = {};
  names.forEach(n=>{ o[n] = function(v){
    if(!soundOn) return;
    const a = ac(); if(!a || !SFXE || typeof SFXE[n] !== 'function') return;
    try{ return SFXE[n](v); }catch(e){}      // gaugeCharge は {level,end} を返すので通す
  }; });
  o.hop = o.step; o.dice = o.diceShake; o.bad = o.lose; o.good = o.win;   // 旧名の互換
  return o;
})();
/* 場面に合わせて曲を切り替える */
/* その場面の音楽ファイルがあればファイルを、無ければ合成音を鳴らす。
   1曲だけ差し替える、という使い方ができる。 */
function bgm(name){
  if(!bgmOn) return;
  const hasFile = !!(window.DV_BGM && window.DV_BGM[name]);
  const want = (hasFile && MUSICF) ? MUSICF : MUSICS;
  if(!want) return;
  try{ if(MUSICF && want !== MUSICF) MUSICF.stop(0.4); }catch(e){}
  try{ if(MUSICS && want !== MUSICS) MUSICS.stop(0.4); }catch(e){}
  MUSIC = want;
  try{ want.play(name); }catch(e){}
}
/* ジングル（短い曲）を鳴らす。鳴っている間だけ BGM が -9dB に下がる
   name: 'build'|'landmark'|'buyout'|'bankrupt'|'mono'|'levelup'                */
function jingle(name){
  if(!soundOn) return 0;
  const a = ac(); if(!a || !JING) return 0;
  try{ return JING.play(name, bgmOn ? MUSIC : null); }catch(e){ return 0; }
}

/* ══════════ 設定と状態 ══════════ */
let G = null;
let cfg = { mapId:'ice', turns:12, timeLimit:1200, cash:10000000, ai:1, speed:1, n:4,
  seats:[{name:'あなた',kind:'you',ch:-1},{name:'CPU ガル',kind:'cpu',ch:-1},
         {name:'CPU リノ',kind:'cpu',ch:-1},{name:'CPU ゼニ',kind:'cpu',ch:-1}] };

function newGame(){
  const map = MAPS.find(m=>m.id===cfg.mapId) || MAPS[0];
  // 待機部屋で買った物は「この1試合ぶんの持ち込み」。ここで受け取って手ぶらに戻す。
  // （戻さないと、一度買えば毎試合ずっと無料で持ち込めてしまう）
  const myBag = (SV.bag && SV.bag.length) ? SV.bag.slice(0,3) : [];
  const pickItems = (isMe)=>{
    const pool = ITEMS.slice();
    const out = [];
    if(isMe && myBag.length) out.push.apply(out, myBag);
    for(let k=out.length;k<2;k++) out.push(pool.splice((Math.random()*pool.length)|0,1)[0].id);
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
        odd:2, even:2, items:pickItems(s.kind!=='cpu'),
        skillLeft: card.sk.uses, mana:0,
        freeToll:0, halfBuild:0, salaryX2:0, forceDouble:0, chooseEye:0, tollUp:0,
        render:tileCenter(0), hopY:0, squash:1, offx:0, offy:0, face:1, jam:3,
        pend: (s.kind!=='cpu')
          ? SV.slots.map(pendById).filter(Boolean)
          : (function(){ const n = cfg.ai===2 ? 3 : cfg.ai===1 ? 2 : 1, pool = PENDANTS.slice(), out=[];
              for(let k=0;k<n && pool.length;k++) out.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
              return out; })(),
        pboost: {}
      };
    }),
    turn:0, turnsLeft:cfg.turns, over:false, winner:-1, winReason:'', alarm:null, infl:1, reach:-1, winX:1,
    clock: cfg.timeLimit, lastTick: 0, ev:{}
  };
  thisWeek().apply(G);          // 今週のイベントを反映（毎週月曜6時に自動で変わる）
  if(myBag.length){ SV.bag = []; saveNow(); }   // 持ち込みは使い切り
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
  celOverlay(ctx, now);      // 独占カットイン（画面座標）
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
function regPortrait(el, chId, col, cardId){ if(el) portraits.push({el, chId, col, cardId}); }
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
    dvPort(o.chId, c, T + o.chId*430, o.cardId);
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

/* 相手の席の札束が自分の方へ雪崩れ込む。本家のレビューが面白さの核と書いた瞬間。
   数字が先に動くと札は「あとから飛ぶ飾り」になってしまうので、必ず札→数字の順にする */
function moneyFly(fromPi, toPi, heavy){
  const a = G.players[fromPi].render || tileCenter(G.players[fromPi].pos);
  const s = STACK_POS[toPi], b = proj(s.p, s.q);
  addFx('bill', a.x, a.y, 900, PCOL[toPi], null, false, {from:a, to:b});
  addFx('shockring', a.x, a.y + 6, 700, '#FFD8A0', null, false, {r: heavy ? 260 : 190});
  addFx('coinburst', b.x, b.y - 8, 950);
  addFx('starburst', b.x, b.y - 20, 700, '#FFE9A8', null, false, {r:70});
  SFX.coin();
  setTimeout(()=>SFX.coin(), 260*SPEED);
  setTimeout(()=>SFX.coin(), 480*SPEED);
}
/* 独占カットイン（キャンバスに直接描く） */
function celOverlay(ctx2, now){
  if(!celOverlay.on) return;
  if(celOverlay.t0 === null || celOverlay.t0 === undefined) celOverlay.t0 = now;
  const T = now - celOverlay.t0;
  if(T > celOverlay.ms){ celOverlay.on = false; celOverlay.t0 = null; return; }
  dvCelebrate(ctx2, T, celOverlay.lines, SW, SH);
}
function showCelebrate(lines, ms){
  celOverlay.on = true; celOverlay.t0 = null;
  celOverlay.lines = lines; celOverlay.ms = (ms || 2800) * SPEED;
}

/* ══════════ HUD ══════════ */
function rank(){
  return G.players.map((p,i)=>({i, a: p.out ? -1 : assetOf(G,i)})).sort((x,y)=>y.a-x.a);
}
function updHUD(){
  if(!G) return;
  const rk = rank();
  const rankOf = pi => rk.findIndex(r=>r.i===pi)+1;
  // 本家は自分の席が必ず右下。残り3人を 左下 → 左上 → 右上 に置く
  const me = (function(){ const i = G.players.findIndex(p=>p.kind!=='cpu'); return i>=0 ? i : G.turn; })();
  const rest = G.players.map(function(p,i){ return i; }).filter(function(i){ return i!==me; });
  const seat = { Bot: me, BL: rest[0], Top: rest[1], TR: rest[2] };
  const badge = { Bot:'rBot', BL:'rBL', Top:'rTop', TR:'rTR' };
  const box   = { Bot:'hudBot', BL:'hudBL', Top:'hudTop', TR:'hudTR' };
  ['Bot','BL','Top','TR'].forEach(function(k){
    const pi = seat[k], el = $('#'+box[k]), bd = $('#'+badge[k]);
    if(pi === undefined || pi === null){ if(el) el.style.display='none'; if(bd) bd.style.display='none'; return; }
    if(el) el.style.display='';
    if(bd) bd.style.display='';
    fillHUD(k, pi, k==='Bot' ? 'bot' : 'top');
    const r = rankOf(pi), out = !!G.players[pi].out;
    if(bd){
      bd.innerHTML = (out ? '破' : r) + '<span>' + (out ? '産' : '位') + '</span>';
      bd.className = 'rankbadge' + ((k==='BL'||k==='TR') ? ' sm' : '') + (r===1 && !out ? ' red' : '');
    }
    if(el){
      el.classList.toggle('out', out);
      el.style.borderRadius = '14px';
      el.style.boxShadow = (G.turn===pi && !out)
        ? '0 0 0 3px rgba(255,224,138,.85), 0 0 26px rgba(255,210,77,.5)' : '';
    }
  });
  $('#pTurn').textContent = G.turnsLeft;
  const ie = $('#pInfl');
  if(ie){
    const on = G.infl > 1;
    ie.classList.toggle('on', on);
    ie.textContent = on ? '通行料 ×' + inflTxt() : '';
  }
  $('#pGoal').textContent = yen(rk[0].a);
  $('#pGoalL').textContent = G.players[rk[0].i].name;
  if(!cfg.timeLimit) $('#pClock').textContent = '--:--';

  const sh = $('#sideHud');
  if(sh){ sh.innerHTML = '';
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
  }); }

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
  const lv = $('#f'+sfx+'Lvl'); if(lv) lv.textContent = (p.laps+1);
  const pic = $('#f'+sfx+'Pic');
  if(pic.dataset.ch !== String(p.ch) || pic.dataset.col !== PCOL[pi] || pic.dataset.card !== String(p.card||'')){
    pic.dataset.ch = p.ch; pic.dataset.col = PCOL[pi]; pic.dataset.card = p.card||'';
    const ex = portraits.find(o=>o.el===pic);
    if(ex){ ex.chId = p.ch; ex.col = PCOL[pi]; ex.cardId = p.card; } else regPortrait(pic, p.ch, PCOL[pi], p.card);
  }
  rollNum($('#f'+sfx+'Cash'), p.cash);
  rollNum($('#f'+sfx+'Asset'), assetOf(G,pi));
  const mana = Math.min(100, p.mana);
  const gg = $('#f'+sfx+'Gauge'), gt = $('#f'+sfx+'Gtx');
  if(gg) gg.style.width = mana+'%';
  if(gt) gt.textContent = ch.skill.nm+' '+mana+'%';
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
    itemBar.style.cssText = 'position:absolute;left:1.2%;top:34%;z-index:84;display:flex;'
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
function sellValue(t){
  let v = Math.round(t.base*0.6);
  for(let k=1;k<=t.lv;k++) v += Math.round(BUILD[k].cost(t.base)*0.6);
  if(t.landmark) v += Math.round(BUILD[4].cost(t.base)*0.6);
  return v;
}
function raiseCash(pi, need){
  const p = G.players[pi];
  const mine = G.tiles.map((t,i)=>({t,i})).filter(o=>o.t.type==='city'&&o.t.owner===pi);
  mine.sort((a,b)=>a.t.base-b.t.base);
  // 全部売っても届かないなら、1つも売らずに破産する。
  // 先に売ってしまうと街が市場へ散って、取り立てた相手の手に何も残らない（本家は債権者が受け取る）
  let pot = p.cash;
  for(const o of mine) pot += sellValue(o.t);
  if(pot < need) return false;
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
/* 装備しているサイコロ（人間だけ。CPUはふつうのサイコロ） */
function dieOf(pi){
  const p = G && G.players[pi];
  if(!p || p.kind==="cpu") return DICE[0];
  // 持っていないサイコロの効果は効かせない（セーブを書き換えられても素のサイコロに戻す）
  if(!(SV.dice && SV.dice[SV.die])) return DICE[0];
  return dieById(SV.die);
}
function rollPair(force, forceDouble, die){
  let a,b;
  const D = die || DICE[0];
  if(forceDouble){ a = 1+((Math.random()*6)|0); b = a; return [a,b]; }
  const eye = ()=>{
    let v = 1+((Math.random()*6)|0);
    // 大きい目が出やすいサイコロは、2回振って大きいほうを一定確率で採る
    if(D.big > 0 && Math.random() < D.big*0.55) v = Math.max(v, 1+((Math.random()*6)|0));
    return v;
  };
  a = eye(); b = eye();
  if(D.dbl > 0 && a !== b && Math.random() < D.dbl) b = a;   // ゾロ目補正

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
    [a,b] = rollPair(force, p.forceDouble>0, dieOf(pi));
    if(p.forceDouble>0) p.forceDouble--;
    if(impact){
      const c = rollPair(force, false);
      if(scoreLanding(pi, c[0]+c[1]) > scoreLanding(pi, a+b)){ a=c[0]; b=c[1]; }
      toast('R','🎯','ゲージインパクト成功！','出目をコントロールしました',1800);
    }
  }
  const seed = (pi*7919 + G.turnsLeft*131 + a*13 + b*7 + G.players[pi].pos) % 100000;
  // 栄光の光：振る瞬間に判定してゾロ目にする
  if(!fixedTotal && a!==b && pendOf(pi,'onRoll')){
    if(await pendFire(pi,'onRoll')){ b = a; }
  }
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
  // 催眠の香水：同じマスに相手がいたら
  if(G.players.some((q,j)=>j!==pi && !q.out && q.pos===p.pos)) await pendFire(pi,'onSameTile');
  await wait(180);
}
function salary(pi){
  const p = G.players[pi];
  let amt = Math.round((600000 + p.laps*200000) * ((G.ev && G.ev.salaryX) || 1));
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
  // 監獄にいる駒は、マスの効果を受けない（買う・建てる・通行料も発生しない）
  if(G.players[pi].jail > 0 && G.players[pi].pos === 8) return;
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
    // 本家は「スタートにピタリ到着すると好きな所有地に建物を1つ追加建設できる」
    await band('スタートにぴったり！','好きな自分の街を1段そだてられます',1400);
    const mine0 = [];
    for(let z=0; z<32; z++){ const tz = G.tiles[z];
      if(tz.type==='city' && tz.owner===pi && !tz.landmark) mine0.push(z); }
    if(mine0.length){
      const d0 = (p.kind==='cpu')
        ? mine0.reduce((a,b)=> tollOf(G.tiles[b],G) > tollOf(G.tiles[a],G) ? b : a)
        : await pickTile(pi,'そだてる街を選んでください',
            z=>G.tiles[z].type==='city' && G.tiles[z].owner===pi && !G.tiles[z].landmark);
      if(d0>=0){ const tz = G.tiles[d0];
        if(tz.lv>=3) tz.landmark = true; else tz.lv = Math.min(3, tz.lv+1);
        await growAnim(d0); }
    } else { give(pi, 600000); toast('R','💴','街がまだありません','かわりに 60万 を受け取りました',2000); }
  }
  else if(t.type === 'jail'){
    p.jail = 3; p.dblRun = 0; SFX.bad(); camShake(10);
    await band(G.map.corners[1]+'に閉じ込められました！','3ターンのあいだ移動できません（ゾロ目で脱出）',1800);
  }
  else if(t.type === 'olympic'){
    // オリンピック開催：費用を払って自分の街の通行料を上げる。
    // 重ねるほど倍率が上がり最大5倍（本家の一番わかりやすい逆転手段）。
    const mine = [];
    for(let z=0; z<32; z++){ const tz=G.tiles[z];
      if(tz.type==='city' && tz.owner===pi && tz.olym < 5) mine.push(z); }
    if(!mine.length){
      await band('オリンピック開催地','開催できる自分の街がありません',1500);
    } else {
      const cost = Math.round(Math.max(150000, assetOf(G,pi)*0.05) * statMul(p,'special',0.4));
      if(p.cash < cost){
        await band('オリンピック開催','費用 '+yen(cost)+' が足りません',1600);
      } else {
        await band('オリンピック開催！','費用 '+yen(cost)+' で自分の街の通行料を上げられます',1600);
        const d = (p.kind==='cpu')
          ? mine.reduce((a,b)=> tollOf(G.tiles[b],G) > tollOf(G.tiles[a],G) ? b : a)
          : await pickTile(pi,'開催する街を選んでください',
              z=>G.tiles[z].type==='city' && G.tiles[z].owner===pi && G.tiles[z].olym < 5);
        if(d>=0){
          give(pi, -cost);
          const tz = G.tiles[d];
          tz.olym = Math.min(5, tz.olym + 1);
          boardChanged(); SFX.landmark(); camShake(10);
          addFx('pillar', tileCenter(d).x, tileCenter(d).y, 1000, '#FFD24D');
          raiseBanner('通行料 ×' + tz.olym + '！');
          toast('R','🏟','オリンピック開催', tz.name+' の通行料が ×'+tz.olym+' になりました', 2400);
          news('🏟 '+p.name+' が '+tz.name+' でオリンピックを開催！ 通行料 ×'+tz.olym);
        }
      }
    }
  }
  else if(t.type === 'travel'){
    await band(G.map.corners[2]+'に到着','行きたいマスを1つ選べます',1200);
    // 黄金フリーパス：選ばずに最適マスへ跳ぶ
    if(await pendFire(pi,'onTravel',{pick:true}) === 'jumped'){ await resolve(pi); return; }
    const dest = (p.kind==='cpu') ? aiPickTravel(pi) : await pickTile(pi,'行き先を選んでください');
    if(dest>=0 && dest!==i){ await jumpTo(pi, dest); await resolve(pi); return; }
  }
  else if(t.type === 'minigame'){
    await miniGame(pi);
  }
  else if(t.type === 'bonus'){
    // 本家のボーナスゲームは「賭けて2倍→4倍→8倍、1回でも外すと全没収」
    await miniGame(pi);
  }
  else if(t.type === 'tax'){
    const amt = Math.round(assetOf(G,pi) * t.rate * statMul(p,'special',0.4));
    if(!payFrom(pi, amt)) { await bankrupt(pi, -1); return; }
    give(pi, -amt);
    toast('L','🧾','税金','総資産に応じて '+yen(amt)+' を納めました',1900);
  }
  else if(t.type === 'card'){ await chanceCard(pi); }
  else if(t.type === 'city'){
    // 幸運のトランポリン：自分の街に止まったとき同じ辺の別の街へ跳ぶ
    if(t.owner === pi && (await pendFire(pi,'onOwnLand')) === 'jumped'){ await resolve(pi); return; }
    if(t.owner < 0 || t.owner === pi){
      if(p.kind==='cpu') await aiBuy(pi, i); else await buyUI(pi, i);
    } else {
      await payToll(pi, i);
      if(G.over || G.players[pi].out) return;
      // シュプリューデル：ランドマークの持ち主が束縛を仕掛ける
      if(t.landmark) await pendFire(t.owner, 'onTollGet', {tile:i});
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
  if(t.bind){ amt = Math.round(amt * 2); t.bind = 0;
    toast('L','💧','束縛','シュプリューデルで通行料が2倍になりました', 2200); }
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
  moneyFly(pi, owner, amt > 3000000);   // 先に札束を飛ばす
  await wait(420);                      // 札が着いてから数字が増える
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
  moneyFly(pi, t.owner, true);
  t.owner = pi;
  SFX.buy();
  addFx('pillar', tileCenter(i).x, tileCenter(i).y, 900, PCOL[pi]);
  addFx('spark', tileCenter(i).x, tileCenter(i).y-30, 900, '#FFD24D');
  jingle('buyout');
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
    + '<div class="sign">Dice Kingdom 商工会</div>'
    + '<div class="btnrow" style="justify-content:center">'
    + '<button class="btn ghost" data-act="no">やめる</button>'
    + '<button class="btn gold" data-act="ok">買収する</button></div>'
    + '</div></div>';
}

/* 何段目まで建てられるか。スタートを1周するごとに1段ずつ解放される */
function maxLvOf(p){ return Math.max(1, Math.min(3, (p.laps||0) + 1)); }
function lvLockNote(p){
  const m = maxLvOf(p);
  if(m >= 3) return '';
  return '　🔒 いまは「'+BUILD[m].nm+'」まで（スタートを通るたびに1段ずつ増えます）';
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
  const mx = maxLvOf(p);
  for(let k=1;k<=3;k++)
    steps.push({k, nm:BUILD[k].nm, ic:BUILD[k].ic, cost:Math.round(BUILD[k].cost(t.base)*disc),
      have: own && t.lv>=k, can: k <= mx});
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
    + '色を3つぶん独占（トリプル独占）・1辺の街ぜんぶ（ライン独占）・ランドマーク6つ（観光地独占）の'
    + 'どれかが成立した瞬間に勝ちです。'
    + lvLockNote(p)
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
  jingle(G.tiles[i].landmark ? 'landmark' : 'build');
  const c = tileCenter(i);
  if(t.landmark){ SFX.landmark(); news('🗼 '+G.players[t.owner].name+' が '+t.name+' にランドマークを建設！'); }
  addFx('pillar', c.x, c.y, 950, t.landmark ? '#7FE6FF' : PCOL[t.owner]);
  addFx('ring', c.x, c.y, 700, '#FFD24D');
  addFx('spark', c.x, c.y-26, 900, '#FFF3C0');
  addFx('smoke', c.x, c.y+4, 1100);                                        // 建設の土煙
  addFx('shockring', c.x, c.y+4, 620, '#FFE7A8', null, false, {r:150});
  if(t.landmark) addFx('starburst', c.x, c.y-70, 900, '#FFFFFF', null, false, {r:120});
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
  // ペンダントの判定（建設したとき／ランドマークが建ったとき）
  if(t.owner>=0 && !growAnim._busy){
    growAnim._busy = true;
    try{
      await pendFire(t.owner, 'onBuild', {tile:i});
      if(t.landmark) await pendFire(t.owner, 'onLandmark', {tile:i});
    } finally { growAnim._busy = false; }
  }
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
      // 賭け金を払えないなら破産。ここだけ払えない時の処理が無く、無一文でも無料で賭けられた
      if(!payFrom(pi, stake)){ await bankrupt(pi, -1); return; }
      give(pi, -stake);
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
  const alive = G.players.filter(p=>!p.out);
  if(alive.length === 1) return finish(G.players.indexOf(alive[0]),'独り勝ち');
  // 開始2ラウンドは事故決着させない（3色独占が偶然そろうことはまず無いが保険）
  if(G.turnsLeft > cfg.turns - 2) return false;
  for(let pi=0; pi<G.players.length; pi++){
    if(G.players[pi].out) continue;
    const m = monoOf(G, pi);
    if(m){ G.winX = m.x; return finish(pi, m.label, m.col); }
  }
  // 「あと1色で独占」を全員に知らせる。ここからが本番になる
  for(let pi=0; pi<G.players.length; pi++){
    if(G.players[pi].out) continue;
    if(colorMono(G,pi) === 2 && G.reach !== pi){
      G.reach = pi;
      SFX.warn(); camShake(10);
      bgm('boss');
      alarmBand(G.players[pi].name+' 独占リーチ！', 'あと1色そろえられたら負け。買収して崩せ！');
      news('🚨 '+G.players[pi].name+' がカラー独占2色。あと1色で勝たれます');
    }
  }
  return false;
}
/* 独占が今もその形のまま続いているか */
function sameMono(al){
  if(G.players[al.pi].out) return false;
  const m = monoOf(G, al.pi);
  return !!m && m.key === al.key;
}
function raiseAlarm(pi, m){
  G.alarm = { pi, kind:m.kind, label:m.label, col:m.col, key:m.key };
  const nm = G.players[pi].name;
  SFX.bad(); camShake(13);
  news('🚨 '+nm+' が「'+m.label+'」に到達！ 次の '+nm+' の手番までに崩さないと敗北！');
  alarmBand(nm+' 「'+m.label+'」', 'その街を買収して崩せ！ 崩せなければ '+nm+' の勝ち');
  updHUD();
}
function dropAlarm(){
  if(!G.alarm) return;
  const nm = G.players[G.alarm.pi].name, lb = G.alarm.label;
  G.alarm = null;
  SFX.good();
  news('✋ '+nm+' の「'+lb+'」を阻止！ 勝負はまだ続く');
  alarmBand('独占を阻止！', lb+' は崩れました');
  updHUD();
}
/* 独占者の手番が回ってきた時に呼ぶ。維持されていたらそこで決着 */
function alarmTick(pi){
  if(!G.alarm || G.alarm.pi !== pi) return false;
  if(!sameMono(G.alarm)){ dropAlarm(); return false; }
  const al = G.alarm; G.alarm = null;
  return finish(pi, al.label, al.col);
}
function alarmBand(a, b){
  const el = $('#alarm'); if(!el) return;
  el.querySelector('.a').textContent = a;
  el.querySelector('.b').textContent = b;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  setTimeout(()=>el.classList.remove('on'), 2600*SPEED);
}
async function bankrupt(pi, toPi){
  const p = G.players[pi];
  const left = Math.max(0, p.cash);      // 残った現金も債権者のもの（本家と同じ）
  p.out = true; p.cash = 0;
  G.tiles.forEach(t=>{ if(t.type==='city' && t.owner===pi){
    if(toPi>=0){ t.owner = toPi; } else { t.owner=-1; t.lv=0; t.landmark=false; }
  }});
  if(toPi>=0 && left>0) give(toPi, left);
  SFX.bad(); camShake(14); jingle('bankrupt');
  if(toPi >= 0){                       // 破産＝全財産が勝者の席へ雪崩れ込む
    const sa = STACK_POS[pi],  a2 = proj(sa.p, sa.q);
    const sb = STACK_POS[toPi], b2 = proj(sb.p, sb.q);
    for(let w=0; w<3; w++)
      setTimeout(function(){ addFx('bill', a2.x, a2.y, 1000, PCOL[toPi], null, false, {from:a2, to:b2}); }, w*220);
    addFx('coinburst', b2.x, b2.y-8, 1200);
  }
  news('！！ '+p.name+' が破産しました ！！');
  await band(p.name+' が破産しました',
    toPi>=0 ? '持っていた街は '+G.players[toPi].name+' のものに' : '街は市場に戻りました', 2000);
  checkWin();
}
function finish(pi, reason, col){
  if(String(reason).indexOf('独占') >= 0) jingle('mono');
  showCelebrate(['おめでとうございます！', reason, G.players[pi].name + ' の勝ち！'], 2800);
  addFx('confetti', SW/2, 0, 3000, null, null, false, {scr:true, w:SW, h:SH, n:110});
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
  if(!G || G.winner < 0 || !G.players[G.winner]) return;
  bgm('result');
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
    if(p.tollUp > 0) p.tollUp--;   // 地価高騰の期限
    p.mana = Math.min(100, p.mana + 34);
    updHUD();
    await turnBig(pi);

    if(p.jail > 0){ await jailTurn(pi); nextTurn(); if(G.turnsLeft<=0){ timeUp(); break; } continue; }

    let again = true, guard = 0;
    // p.out を毎回みる：通行料で破産した人がゾロ目でもう一度振ってしまうのを止める
    while(again && !G.over && !p.out && guard++ < 4){
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
        if(p.out) break;                 // 破産した人はもう振らない（街も買えない）
        if(p.jail > 0) break;            // 監獄に入ったら、ゾロ目でももう一度は振れない
        toast('R','🎲','ゾロ目！','もう一回サイコロを振れます', 1700);
        again = true;
      } else {
        p.dblRun = 0;
        await moveSteps(pi, r.total);
        await resolve(pi);
        if(p.out) break;                 // 破産した人はもう振らない
      }
      // SSカードの「追加でもう一回振れる」。ここが無いと extraRoll は加算されるだけで効かなかった
      if(!again && !G.over && !p.out && p.jail<=0 && p.extraRoll > 0){
        p.extraRoll--;
        toast('R','🔮','追加のサイコロ','もう一回サイコロを振れます', 1700);
        again = true;
      }
    }
    if(G.over) break;
    nextTurn();
    if(G.turnsLeft <= 0){ timeUp(); break; }
    if(G.turnsLeft === INFL_FROM) bgm('tense');   // インフレ開始と同時に曲を切り替える
    await wait(240);
  }
  G.running = false;
}
const INFL_FROM = 6;      // 残りこのターン数を切ったらインフレ開始（韓国版の公式値）
const INFL_STEP = 1.5;    // 1ターンごとの倍率（韓国版の公式値）
function inflTxt(){ return Math.round((G.infl||1)*10)/10; }   // 表示だけ0.1刻みに丸める
function nextTurn(){
  const n = G.players.length;
  const before = G.turnsLeft;
  for(let k=1;k<=n;k++){
    const j = (G.turn + k) % n;
    if(!G.players[j].out){
      if(j <= G.turn) G.turnsLeft--;
      G.turn = j; break;
    }
  }
  // 終盤インフレ。序盤の差を「1回踏むだけ」で無効化できるので、
  // 負けている人が最後まで降りなくなる（本家が後から足した仕掛け）
  if(G.turnsLeft < before && G.turnsLeft <= INFL_FROM && G.turnsLeft > 0){
    // 倍率そのものは丸めない。毎ターン0.1刻みに丸めると誤差が積もって
    // 12ターン制の最終ターンが ×11.4 のはずが ×12（+5.4%）になってしまう
    G.infl = G.infl * INFL_STEP;
    raiseBanner('通行料 ×' + inflTxt() + '！');
    news('🔥 のこり' + G.turnsLeft + 'ターン — 通行料が ×' + inflTxt() + ' になりました');
    SFX.warn(); camShake(9);
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
    gaugeHalf = 0.055 + (statOf(p,'gauge') + dieOf(pi).gauge)/100*0.075;   // ステータス＋サイコロが枠の広さに効く
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

/* ══════════════════════════════════════════════════════════════
   ペンダントの発動
   本家と同じく「毎回判定して、発動したかどうかを必ず見せる」。
   外れ続けると確率が少しずつ積み上がる（救済）。
   ══════════════════════════════════════════════════════════════ */
function pendOf(pi, trg){
  const p = G.players[pi];
  if(!p || !p.pend) return null;
  return p.pend.find(x => x && x.trg === trg) || null;
}
async function pendFire(pi, trg, arg){
  const p = G.players[pi];
  const it = pendOf(pi, trg);
  if(!it) return false;
  p.pboost = p.pboost || {};
  const boost = p.pboost[it.id] || 0;
  const rate = Math.min(0.95, it.p + boost);
  const hit = Math.random() < rate;
  const pct = Math.round(rate*100), add = Math.round(boost*100);
  if(!hit){
    p.pboost[it.id] = boost + 0.02;
    if(p.kind !== 'cpu')
      toast('R', it.ic, 'スキル未発動', it.nm+'　次は +2% 成長します（'+pct+'%）', 1800);
    return false;
  }
  p.pboost[it.id] = 0;
  SFX.skill(); camShake(7);
  toast('R', it.ic, PEND_RAR[it.rar].nm+'ペンダント発動！',
        it.nm+'　'+pct+'%'+(add?'（+'+add+'%）':''), 2400);
  const c = p.render || tileCenter(p.pos);
  addFx('ring', c.x, c.y, 700, PEND_RAR[it.rar].c);
  addFx('spark', c.x, c.y-30, 900, PEND_RAR[it.rar].c);

  /* ── 効果 ── */
  if(it.id==='p1'){                       // 稲妻放電器：同じ辺の相手を引き寄せる
    const side = Math.floor(p.pos/8);
    for(let j=0;j<G.players.length;j++){
      const q = G.players[j];
      if(j===pi || q.out) continue;
      if(Math.floor(q.pos/8) === side){
        await band('稲妻放電器！', G.players[j].name+' を引き寄せました', 1300);
        await jumpTo(j, p.pos);
        break;
      }
    }
  }
  if(it.id==='p2' && arg && arg.tile!==undefined){   // シュプリューデル：束縛
    const t = G.tiles[arg.tile];
    if(t) t.bind = 1;
    await band('シュプリューデル！', '次の移動でもう一度 通行料を取ります', 1300);
  }
  if(it.id==='p3'){                       // 概要設計図面：別の街がもう1段
    const mine = G.tiles.map((t,i)=>({t,i}))
      .filter(o=>o.t.type==='city' && o.t.owner===pi && o.t.lv<3 && o.i!==(arg&&arg.tile));
    if(mine.length){
      const o = mine[(Math.random()*mine.length)|0];
      o.t.lv++;
      await growAnim(o.i);
      toast('R','📐','設計図面','　'+o.t.name+' が1段育ちました', 2200);
    }
  }
  if(it.id==='p4'){                       // 大家の建物基礎：スタートへ
    const n = G.tiles.filter(t=>t.type==='city'&&t.owner===pi&&t.lv>0).length;
    if(n>=3){ await jumpTo(pi, 0); p.laps++; salary(pi); }
  }
  if(it.id==='p5' && arg && arg.pick){    // 黄金フリーパス：即座に最適マスへ
    const d = aiPickTravel(pi);
    if(d>=0){ await jumpTo(pi, d); return 'jumped'; }
  }
  if(it.id==='p6'){                       // 幸運のトランポリン：同じ辺の自分の街へ
    const side = Math.floor(p.pos/8);
    const same = [];
    for(let k=0;k<8;k++){ const i=side*8+k;
      if(i!==p.pos && G.tiles[i].type==='city' && G.tiles[i].owner===pi) same.push(i); }
    if(same.length){ await jumpTo(pi, same[(Math.random()*same.length)|0]); return 'jumped'; }
  }
  if(it.id==='p7'){                       // 催眠の香水：所持金を奪う
    const other = G.players.findIndex((q,j)=>j!==pi && !q.out && q.pos===p.pos);
    if(other>=0){
      const amt = Math.round(G.players[other].cash*0.20);
      if(amt>0){ give(other, -amt); give(pi, amt);
        await band('催眠の香水！', G.players[other].name+' から '+yen(amt)+' を奪いました', 1400); }
    }
  }
  return true;
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
  // ── ここから追加分（本家のS+カード41枚の効果を型にしたもの）──
  if(k===4){
    // 強奪：相手全員から所持金の一部を奪う
    const rate = 0.10 + p.skillPow*0.5;
    let got = 0;
    G.players.forEach((q,qi)=>{
      if(qi===pi || q.out) return;
      const v = Math.round(q.cash * rate);
      if(v<=0) return;
      give(qi, -v); got += v;
      const cq = q.render || tileCenter(q.pos);
      addFx('spark', cq.x, cq.y-24, 900, PCOL[pi]);
    });
    if(got>0){ give(pi, got); SFX.coin();
      toast('R','💰','強奪', yen(got)+' を奪いました', 2200);
      news(p.name+' が全員から '+yen(got)+' を奪った！'); }
  }
  if(k===5){
    // 無料増築：自分の街をひとつ、ただで一段上げる
    const mine = [];
    for(let i=0;i<32;i++){ const t=G.tiles[i];
      if(t.type==='city' && t.owner===pi && !t.landmark) mine.push(i); }
    if(mine.length){
      let d;
      if(p.kind==='cpu'){ d = mine.reduce((a,b)=> tollOf(G.tiles[b],G) > tollOf(G.tiles[a],G) ? b : a); }
      else d = await pickTile(pi,'ただで建てる街を選んでください',
            i=>G.tiles[i].type==='city' && G.tiles[i].owner===pi && !G.tiles[i].landmark);
      if(d>=0){
        const t = G.tiles[d];
        if(t.lv>=3) t.landmark = true; else t.lv++;
        await growAnim(d);
        toast('R','🏗','無料建設', t.name+' が育ちました', 2200);
      }
    } else toast('L','🏗','建てる街がありません','まず街を買いましょう',1900);
  }
  if(k===6){
    // 給料：その場で給料を受け取り、次の給料も2倍になる
    const amt = Math.round(600000 + p.laps*200000);
    give(pi, amt); p.salaryX2++;
    SFX.coin(); toast('R','💴','臨時収入', yen(amt)+'／次の給料も2倍', 2200);
  }
  if(k===7){ p.forceDouble++; toast('R','✌️','ゾロ目確定','次のサイコロは必ずゾロ目です',2000); }
  if(k===8){
    // 地価高騰：自分の全所有地の通行料が2ターン1.6倍
    p.tollUp = 2; boardChanged();
    raiseBanner('地価高騰！');
    toast('R','📈','地価高騰','自分の街の通行料が2ターン 1.6倍', 2300);
    news(p.name+' の街の通行料が跳ね上がった！');
  }
  if(k===9){
    // 妨害：一番資産のある相手を監獄へ送る
    let tgt = -1, bv = -1;
    G.players.forEach((q,qi)=>{ if(qi!==pi && !q.out && !q.jail){
      const v = assetOf(G,qi); if(v>bv){ bv=v; tgt=qi; } } });
    if(tgt>=0){
      await jumpTo(tgt, 8); G.players[tgt].jail = 3; G.players[tgt].dblRun = 0;
      SFX.bad(); camShake(12);
      toast('R','⛓','妨害', G.players[tgt].name+' を'+G.map.corners[1]+'へ送りました', 2300);
      news(p.name+' が '+G.players[tgt].name+' を'+G.map.corners[1]+'へ送り込んだ！');
    } else toast('L','⛓','送る相手がいません','—',1800);
  }
  if(k===10){
    // 宝箱：金額は運。当たれば一気に逆転する
    const base = Math.max(400000, Math.round(assetOf(G,pi)*0.10));
    const mul = [0.6, 1, 1, 1.6, 2.6][(Math.random()*5)|0];
    const amt = Math.round(base*mul);
    give(pi, amt); SFX.gachaRare();
    const c2 = p.render || tileCenter(p.pos);
    addFx('spark', c2.x, c2.y-30, 1100, '#FFD24D');
    toast('R','🎁','宝箱', yen(amt)+' が出ました'+(mul>=2.6?'（大当たり！）':''), 2400);
  }
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
  // 「出目を選ぶ」能力／サイコロ改造は人間だけでなく CPU も使える。
  // ここが無いと kind1 のカードは CPU が撃っても何も起きないまま回数だけ減っていた
  if(p.chooseEye > 0){
    p.chooseEye--;
    let best = 2, bs = -1e9;
    for(let n=2;n<=12;n++){ const sc = scoreLanding(pi,n); if(sc > bs){ bs = sc; best = n; } }
    gaugeOn = false; $('#diceui').classList.remove('on');
    return doRoll(pi, null, false, best);
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
  const reserve = [300000, 180000, 90000][lvl];
  let spend = 0, lvTarget = t.lv, land = false, lm = false;
  if(!own){
    const price = Math.round(t.base*disc);
    const mineG  = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
    const urgent = mineG >= 1 || G.players.some(function(q,qi){ return qi!==pi && !q.out &&
      CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner===qi; }).length >= 2; });
    if(p.cash - price < (urgent ? 0 : reserve)) return;   // 独占阻止なら全財産を使ってでも買う
    land = true; spend += price;
  }
  const near = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
  // 誰かがこの色で2つ持っている＝あと1つで独占。そこは意地でも押さえる
  const block = G.players.some((q,qi)=> qi!==pi && !q.out &&
    CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===qi).length >= 2);
  const aggr = (near>=1 || block) ? 1 : 0;
  const mxAi = maxLvOf(p);
  for(let k = (own? t.lv+1 : 1); k<=mxAi; k++){
    const c = Math.round(BUILD[k].cost(t.base)*disc);
    // 独占がかかっている色は蓄えを崩してでも建てる。ただし所持金より多くは払えない（0円が下限）
    const floor = Math.max(0, reserve - aggr*1500000);
    if(p.cash - spend - c < floor) break;
    if(lvl===0 && k>1) break;
    if(lvl===1 && k>2 && !aggr) break;
    spend += c; lvTarget = k;
  }
  // ランドマークは「すでに3段そろっている街へ、もう一度到着した時」だけ。
  // 人間のUI（buildHTML の can: own && t.lv>=3）と同じ規則。ここを揃えないと
  // CPU だけ未所有の土地から1回の到着でランドマークまで建ててしまう
  if(lvl===2 && own && t.lv>=3 && !t.landmark && near>=1){
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
  if(spend > p.cash) return;              // 念のため：所持金を超える投資はしない
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
  // 相手が2マス持っている色は、独占される前に奪って崩す
  const dangerG = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===t.owner).length >= 2;
  if(dangerG && t.owner !== pi && p.cash >= cost) return true;
  const near = CITY_SLOTS[t.g].filter(j=>G.tiles[j].owner===pi).length;
  const reserve = [300000, 180000, 90000][lvl];
  if(p.cash - cost < reserve) return false;
  if(near >= 1) return true;                      // 同じ色を持っているなら揃えに行く
  return lvl>=1 && Math.random()<0.35;            // それ以外もときどき奪う
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
    const cols = Math.min(6, Math.max(3, list.length));
    grid.style.gridTemplateColumns = 'repeat('+cols+',1fr)';
    // 2段になる枚数からはカードを小さくする（大きいままだと2段目が画面の外に出る）
    grid.classList.toggle('many', list.length > cols);
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
      regPortrait(d.querySelector('canvas'), c.art, c.col, c.id);
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
  '同じ色の街を全部そろえると、その色の通行料が2倍になります。',
  '色の独占を3つそろえると「トリプル独占」でその場で勝ちです。',
  '同じ色をあと1つで独占される時は、その街を買収して崩すのが唯一の防ぎ方です。',
  'ランドマークを6つ持つと「観光地独占」で勝ちです（報酬5倍）。',
  '1辺の街をぜんぶ持つと「ライン独占」で勝ちです（報酬3倍）。',
  '建物は1周ごとに1段ずつ解放されます。スタートを通るのが近道です。',
  '残り6ターンから通行料が毎ターン1.5倍。負けていても最後まで諦めないこと。',
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
  if(!await roomPhase()){ screenTo('setup'); return; }   // 待機部屋でもどるを押したら設定へ
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
/* 歯車を押した時だけ音量スライダーを出す */
(function(){
  const g = $('#gearBtn'), bar = $('#audiobar');
  if(g && bar) g.onclick = ()=>{ SFX.click(); bar.classList.toggle('on'); };
})();
function applyAudioPrefs(){
  soundOn = sfxVol > 0.001;
  $('#sfxBtn').classList.toggle('off', !soundOn);
  $('#bgmBtn').classList.toggle('off', !bgmOn || bgmVol < 0.001);
  const v = bgmOn ? bgmVol : 0;
  try{ if(MUSICF) MUSICF.setVolume(v); }catch(e){}
  try{ if(MUSICS) MUSICS.setVolume(v); }catch(e){}
  if(SFXE && SFXE.setVolume) SFXE.setVolume(sfxVol);
  if(JING && JING.setVolume) JING.setVolume(sfxVol);   // ジングルは効果音側の音量に従う
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
/* 選択欄に「今の設定」を入れる。
   cfg の値が選択肢に無いと selectedIndex=-1 になって欄が真っ白になり、
   さらに onchange が一度も走らないので表示と実際の設定が食い違う（実測で確認）。
   無い値なら先頭を選び直して cfg 側も合わせる。 */
function setOpt(sel, v, apply){
  const el = $(sel); if(!el) return;
  el.value = String(v);
  if(el.selectedIndex < 0){ el.selectedIndex = 0; if(apply) apply(el.value); }
}
setOpt('#optTurns',   cfg.turns,     v => cfg.turns = +v);
setOpt('#optCash',    cfg.cash,      v => cfg.cash = +v);
setOpt('#optAI',      cfg.ai,        v => cfg.ai = +v);
setOpt('#optPlayers', cfg.n,         v => { cfg.n = +v; renderSeats(); });
setOpt('#optTime',    cfg.timeLimit, v => cfg.timeLimit = +v);
setOpt('#optSpeed',   cfg.speed,     v => { cfg.speed = +v; SPEED = cfg.speed; });
setOpt('#optArt',     ART_STYLE,     v => { setArtStyle(v); refreshArt(); });

try{
  const boot = st => { if(st && st.cfg){ Object.assign(cfg, st.cfg); renderMaps(); renderSeats(); } };
  if(window.claude && window.claude.hot){
    window.claude.hot.snapshot(()=>({cfg}));
    window.claude.hot.ready ? window.claude.hot.ready(boot) : boot(window.claude.hot.data||{});
  }
}catch(e){}
