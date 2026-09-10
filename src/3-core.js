<script>
"use strict";
/* ══════════════════════════════════════════════════════════════
   ダイスボヤージュ — コア（幾何・マップ・描画）
   盤の数値は実機映像の実測から。縦潰し 0.585 / 盤中心(50.5%,53.5%)
   ══════════════════════════════════════════════════════════════ */

const SW = 1600, SH = 900;              // 固定ステージ
const S  = 882;                          // 盤（正方形）の1辺（盤空間px）
const CW = 135.4;                        // 角マスの1辺
const TW = 87.3;                         // 通常マスの幅（進行方向）
const TD = 113;                          // 通常マスの奥行き（盤内側へ）
const KX = 0.7071067811865476;           // 画面X係数
const KSQ= 0.585;                        // 縦潰し（実測）
const KY = KX * KSQ;                     // 画面Y係数
const BCX= SW * 0.505, BCY = SH * 0.535; // 盤中心（ステージpx）
const SLAB_H = 26;                       // 土台の厚み（画面px）
const TILE_H = 13;                       // マスの厚み（画面px）

/* 盤ローカル(p,q) → ステージ座標 */
function proj(p, q){
  const dx = p - S/2, dy = q - S/2;
  return { x: BCX + KX*(dx-dy), y: BCY + KY*(dx+dy) };
}

/* 32マスの矩形（盤空間・軸平行） */
function tileRect(i){
  const s = Math.floor(i/8), k = i%8;
  if(s===0){ if(k===0) return {p:S-CW, q:S-CW, w:CW, h:CW, side:0, corner:1};
             return {p:S-CW-k*TW, q:S-TD, w:TW, h:TD, side:0, corner:0}; }
  if(s===1){ if(k===0) return {p:0, q:S-CW, w:CW, h:CW, side:1, corner:1};
             return {p:0, q:S-CW-k*TW, w:TD, h:TW, side:1, corner:0}; }
  if(s===2){ if(k===0) return {p:0, q:0, w:CW, h:CW, side:2, corner:1};
             return {p:CW+(k-1)*TW, q:0, w:TW, h:TD, side:2, corner:0}; }
  if(k===0) return {p:S-CW, q:0, w:CW, h:CW, side:3, corner:1};
  return {p:S-TD, q:CW+(k-1)*TW, w:TD, h:TW, side:3, corner:0};
}
const RECTS = []; for(let i=0;i<32;i++) RECTS.push(tileRect(i));
function tileCenter(i){ const r=RECTS[i]; return proj(r.p+r.w/2, r.q+r.h/2); }
function tileQuad(i){ const r=RECTS[i];
  return [proj(r.p,r.q), proj(r.p+r.w,r.q), proj(r.p+r.w,r.q+r.h), proj(r.p,r.q+r.h)]; }

/* ══════════ マップ定義 ══════════ */
const GCOL = ['#58C6E8','#5FCF7A','#E8B93C','#E8743C','#E0508A','#8E6BE0','#E23B4A'];
const GBASE= [500000, 800000, 1100000, 1500000, 1900000, 2300000, 2800000];
/* 都市が座るマス番号（グループ順） */
const CITY_SLOTS = [[1,2,4],[5,6,9],[10,12,13],[14,17,18],[20,21,22],[25,26,28],[29,30,31]];
const SPECIAL = {3:'card', 7:'tax', 11:'card', 15:'bonus', 19:'card', 23:'tax', 27:'card'};

const MAPS = [
{
  id:'ice', name:'氷の洞窟', sub:'ICE CAVERN', emoji:'❄️',
  sky:['#173a63','#0B1E3A','#04080f'],
  lake:['#9FE3F0','#6FC3D8','#35708A'],
  slab:{top:'#C2B8E2', side:'#5E5488', rim:'#E2E8F2'},
  deco:'ice',
  corners:['スタート','氷の監獄','水晶の遺跡','洞窟探検'],
  cities:[
    ['氷結の泉','霜の小屋','凍り村'],
    ['雪見の丘','氷柱回廊','白銀通り'],
    ['銀嶺市場','蒼氷広場','凍湖港'],
    ['水晶坑道','極光台','氷紋宮'],
    ['氷刃城塞','静寂の樹海','蒼玉神殿'],
    ['極夜宮殿','永久氷河','白帝の塔'],
    ['氷王の玉座','天空氷城','原初の氷核']
  ]
},
{
  id:'world', name:'世界一周', sub:'WORLD TOUR', emoji:'🌍',
  sky:['#22417a','#0E1435','#04060f'],
  lake:['#63CBDE','#2E8CA6','#0D4A5C'],
  slab:{top:'#E8D9B0','side':'#8A7448', rim:'#F6EDD6'},
  deco:'world',
  corners:['スタート','乗り継ぎ待ち','世界旅行','免税ショップ'],
  cities:[
    ['バリ','セブ','プーケット'],
    ['台北','ソウル','香港'],
    ['シンガポール','ドバイ','イスタンブール'],
    ['カイロ','ケープタウン','リオデジャネイロ'],
    ['シドニー','バンクーバー','ロサンゼルス'],
    ['ローマ','バルセロナ','ベルリン'],
    ['ロンドン','パリ','ニューヨーク']
  ]
},
{
  id:'oita', name:'大分めぐり', sub:'OITA MEGURI', emoji:'♨️',
  sky:['#5b2f52','#2A1533','#0b0510'],
  lake:['#A8EADA','#48AE9A','#1E6459'],
  slab:{top:'#E4D3B4', side:'#8E7A57', rim:'#F5EAD5'},
  deco:'onsen',
  corners:['スタート','大分IC 渋滞','高速フェリー','関あじ関さば市場'],
  cities:[
    ['佐賀関','佐伯','蒲江'],
    ['臼杵','津久見','豊後大野'],
    ['竹田','日田','玖珠'],
    ['国東','杵築','日出'],
    ['中津','宇佐','豊後高田'],
    ['大分駅前','大分港','高崎山'],
    ['別府温泉','由布院','鉄輪地獄']
  ]
}];

/* マップ → 32マスのデータ配列 */
function buildTiles(map){
  const t = new Array(32).fill(null);
  t[0]  = {type:'start',    name:map.corners[0]};
  t[8]  = {type:'jail',     name:map.corners[1]};
  t[16] = {type:'travel',   name:map.corners[2]};
  t[24] = {type:'adventure',name:map.corners[3]};
  for(const [k,v] of Object.entries(SPECIAL)){
    const i = +k;
    if(v==='card')  t[i] = {type:'card',  name:'チャンス'};
    if(v==='tax')   t[i] = {type:'tax',   name:'税務署', rate:0.10};
    if(v==='bonus') t[i] = {type:'bonus', name:'ボーナス', amount:1500000};
  }
  CITY_SLOTS.forEach((slots,g)=>{
    slots.forEach((idx,j)=>{
      const base = Math.round(GBASE[g] * (1 + j*0.13));
      t[idx] = { type:'city', name:map.cities[g][j], g, base,
                 owner:-1, lv:0, landmark:false };
    });
  });
  return t;
}

/* 建物の段階：0=更地 1=別荘 2=ビル 3=ホテル 4=ランドマーク */
const BUILD = [
  {nm:'土地',      ic:'🏳️', cost:b=>b,          toll:b=>Math.round(b*0.10)},
  {nm:'別荘',      ic:'🏠', cost:b=>Math.round(b*0.5), toll:b=>Math.round(b*0.60)},
  {nm:'ビル',      ic:'🏢', cost:b=>b,                 toll:b=>Math.round(b*1.50)},
  {nm:'ホテル',    ic:'🏨', cost:b=>Math.round(b*1.6), toll:b=>Math.round(b*3.00)},
  {nm:'ランドマーク',ic:'🗼', cost:b=>Math.round(b*4.0), toll:b=>Math.round(b*10.0)}
];
function tollOf(tile, G){
  if(tile.type!=='city' || tile.owner<0) return 0;
  let v = BUILD[0].toll(tile.base);
  for(let i=1;i<=tile.lv;i++) v += BUILD[i].toll(tile.base);
  if(tile.landmark) v = BUILD[4].toll(tile.base) + v;
  let m = 1;
  if(G){
    if(hasTriple(G, tile.owner, tile.g)) m *= 2;
    if(hasLine(G, tile.owner, Math.floor(idxOf(G,tile)/8))) m *= 2;
  }
  return Math.round(v*m);
}
function idxOf(G,tile){ return G.tiles.indexOf(tile); }
function priceOf(tile){ // 更地の購入価格
  return tile.base;
}
function assetOf(G,pi){
  let a = G.players[pi].cash;
  G.tiles.forEach(t=>{ if(t.type==='city' && t.owner===pi){
    a += t.base;
    for(let i=1;i<=t.lv;i++) a += BUILD[i].cost(t.base);
    if(t.landmark) a += BUILD[4].cost(t.base);
  }});
  return a;
}
function hasTriple(G, pi, g){
  return CITY_SLOTS[g].every(i => G.tiles[i].owner===pi);
}
function hasLine(G, pi, side){
  const idxs=[]; for(let k=1;k<8;k++){ const i=side*8+k; if(G.tiles[i].type==='city') idxs.push(i); }
  return idxs.length>0 && idxs.every(i=>G.tiles[i].owner===pi);
}
function yen(n){
  n = Math.round(n);
  const neg = n<0; n = Math.abs(n);
  const man = Math.floor(n/10000), r = n%10000;
  let s;
  if(man===0) s = String(n);
  else s = r===0 ? man+'万' : man+'万'+String(r).padStart(4,'0');
  return (neg?'-':'')+s;
}

/* ══════════ カメラ ══════════ */
const cam = {x:BCX, y:BCY, z:1, tx:BCX, ty:BCY, tz:1};
function camTo(x,y,z){ cam.tx=x; cam.ty=y; cam.tz=z; }
function camReset(){ camTo(BCX,BCY,1); }
function camStep(dt){
  const k = 1 - Math.pow(0.0016, dt);
  cam.x += (cam.tx-cam.x)*k; cam.y += (cam.ty-cam.y)*k; cam.z += (cam.tz-cam.z)*k;
}

/* ══════════ 描画ユーティリティ ══════════ */
function polyPath(ctx, pts){
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}
function centroid(pts){ let x=0,y=0; pts.forEach(p=>{x+=p.x;y+=p.y}); return {x:x/pts.length,y:y/pts.length}; }
/* 下向きの辺だけ真下へ押し出して側面を描く */
function extrude(ctx, pts, h, col, colDark){
  const c = centroid(pts);
  for(let i=0;i<pts.length;i++){
    const a = pts[i], b = pts[(i+1)%pts.length];
    const my = (a.y+b.y)/2;
    if(my <= c.y + 0.2) continue;
    ctx.beginPath();
    ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(b.x,b.y+h); ctx.lineTo(a.x,a.y+h);
    ctx.closePath();
    // 左下向きの面は少し暗く
    ctx.fillStyle = (b.x < a.x) ? colDark : col;
    ctx.fill();
  }
}
/* #rrggbb と rgb(r,g,b) の両方を受ける（shade の戻り値を再度 shade できるように） */
function shade(col, f){
  let r,g,b;
  if(col[0] === '#'){
    const n = parseInt(col.slice(1),16);
    r=(n>>16)&255; g=(n>>8)&255; b=n&255;
  } else {
    const m = col.match(/-?\d+(\.\d+)?/g);
    if(!m || m.length < 3) return col;
    r=+m[0]; g=+m[1]; b=+m[2];
  }
  if(f>=0){ r+= (255-r)*f; g+=(255-g)*f; b+=(255-b)*f; }
  else { r*=(1+f); g*=(1+f); b*=(1+f); }
  const c = v => Math.max(0, Math.min(255, v|0));
  return 'rgb('+c(r)+','+c(g)+','+c(b)+')';
}
/* 盤平面に沿った文字（横組みを盤面へシアー変形） */
function planeText(ctx, p, q, rot, txt, size, fill, stroke, sw){
  const o = proj(p,q);
  const c = Math.cos(rot), s = Math.sin(rot);
  // 盤空間ベクトル (cos,sin) と (-sin,cos) を画面へ投影して基底にする
  const e1 = { x: KX*( c - s), y: KY*( c + s) };
  const e2 = { x: KX*(-s - c), y: KY*(-s + c) };
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.transform(e1.x, e1.y, e2.x, e2.y, 0, 0);
  ctx.font = '900 '+size+'px "Noto Sans JP", sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  if(stroke){ ctx.lineWidth=sw||3; ctx.strokeStyle=stroke; ctx.lineJoin='round'; ctx.strokeText(txt,0,0); }
  ctx.fillStyle = fill; ctx.fillText(txt,0,0);
  ctx.restore();
}

/* ══════════ 背景 ══════════ */
function drawBackdrop(ctx, map, T){
  const g = ctx.createRadialGradient(BCX, SH*0.22, 60, BCX, SH*0.5, SW*0.78);
  g.addColorStop(0, map.sky[0]); g.addColorStop(.55, map.sky[1]); g.addColorStop(1, map.sky[2]);
  ctx.fillStyle=g; ctx.fillRect(-600,-500, SW+1200, SH+1000);

  if(map.deco==='ice'){
    for(let i=0;i<14;i++){
      const seed=i*97.13, x=-260 + ((seed*137)%2100), w=48+((seed*31)%110), hh=250+((seed*53)%520);
      const yb = 120 + ((seed*17)%700);
      const gg=ctx.createLinearGradient(x,yb-hh,x,yb);
      gg.addColorStop(0,'rgba(150,214,244,.30)'); gg.addColorStop(1,'rgba(20,60,110,.10)');
      ctx.fillStyle=gg; ctx.beginPath();
      ctx.moveTo(x, yb); ctx.lineTo(x+w/2, yb-hh); ctx.lineTo(x+w, yb); ctx.closePath(); ctx.fill();
    }
  } else if(map.deco==='world'){
    ctx.save(); ctx.globalAlpha=.5;
    for(let i=0;i<90;i++){
      const sd=i*61.7, x=-300+((sd*173)%2300), y=-200+((sd*97)%1300);
      const r=.8+((sd*13)%18)/10;
      ctx.fillStyle='rgba(255,255,255,'+(.25+((sd*7)%60)/140)+')';
      ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill();
    }
    ctx.restore();
    const gg=ctx.createLinearGradient(0,SH*0.86,0,SH+300);
    gg.addColorStop(0,'rgba(70,176,200,.30)'); gg.addColorStop(1,'rgba(8,40,60,0)');
    ctx.fillStyle=gg; ctx.beginPath(); ctx.ellipse(BCX, SH*1.35, SW*0.92, SH*0.52, 0,0,6.283); ctx.fill();
  } else {
    // 湯けむり + 山影
    ctx.fillStyle='rgba(20,10,30,.55)';
    ctx.beginPath(); ctx.moveTo(-300,SH*0.52);
    ctx.lineTo(220,SH*0.24); ctx.lineTo(520,SH*0.46); ctx.lineTo(900,SH*0.18);
    ctx.lineTo(1330,SH*0.44); ctx.lineTo(1900,SH*0.30); ctx.lineTo(1900,SH+300); ctx.lineTo(-300,SH+300);
    ctx.closePath(); ctx.fill();
    for(let i=0;i<9;i++){
      const sd=i*83.7, x=-100+((sd*151)%1800);
      const ph=(T*0.00016 + i*0.37)%1;
      const y=SH*0.62 - ph*440, r=40+ph*110;
      ctx.fillStyle='rgba(255,240,250,'+(0.14*(1-ph))+')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
  }
  // ビネット
  const v=ctx.createRadialGradient(BCX,BCY,SH*0.3,BCX,BCY,SW*0.75);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.62)');
  ctx.fillStyle=v; ctx.fillRect(-600,-500, SW+1200, SH+1000);
}

/* ══════════ 湖（盤の内側） ══════════ */
function drawLake(ctx, map, T){
  const inset = TD;
  const pts=[proj(inset,inset),proj(S-inset,inset),proj(S-inset,S-inset),proj(inset,S-inset)];
  polyPath(ctx,pts);
  const c = centroid(pts);
  const g = ctx.createRadialGradient(c.x, c.y-30, 20, c.x, c.y, 430);
  g.addColorStop(0, map.lake[0]); g.addColorStop(.5, map.lake[1]); g.addColorStop(1, map.lake[2]);
  ctx.fillStyle=g; ctx.fill();
  ctx.save(); ctx.clip();
  // ゆらぎ
  ctx.globalAlpha=.16;
  for(let i=0;i<5;i++){
    const ph = Math.sin(T*0.0006 + i*1.2);
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.5;
    ctx.beginPath();
    for(let k=0;k<=40;k++){
      const t=k/40, x=c.x-380+760*t, y=c.y-120+i*58 + Math.sin(t*7 + T*0.0011 + i)*7*ph;
      k?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha=1;
  // きらめき
  for(let i=0;i<26;i++){
    const sd=i*57.3;
    const x=c.x-360+((sd*131)%720), y=c.y-150+((sd*89)%300);
    const a=(Math.sin(T*0.002 + i)*0.5+0.5)*0.85;
    ctx.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';
    ctx.beginPath(); ctx.arc(x,y,1.6+a*1.8,0,6.283); ctx.fill();
  }
  ctx.restore();
  // 中央ロゴ
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='400 60px "Mochiy Pop One", sans-serif';
  ctx.lineWidth=9; ctx.lineJoin='round'; ctx.strokeStyle='rgba(140,225,248,.55)';
  ctx.strokeText('ダイスボヤージュ',0,-8);
  ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillText('ダイスボヤージュ',0,-8);
  ctx.font='900 24px "Noto Sans JP", sans-serif';
  ctx.fillStyle='rgba(190,235,255,.55)'; ctx.fillText('◇ '+map.name,0,38);
  ctx.restore();
}

/* ══════════ 土台スラブ ══════════ */
function drawSlab(ctx, map){
  const OH = 17, IN = TD - 2;
  const out=[proj(-OH,-OH),proj(S+OH,-OH),proj(S+OH,S+OH),proj(-OH,S+OH)];
  extrude(ctx, out, SLAB_H, map.slab.side, shade(map.slab.side,-0.3));
  // リング（even-odd）
  ctx.beginPath();
  ctx.moveTo(out[0].x,out[0].y); out.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
  const inn=[proj(IN,IN),proj(S-IN,IN),proj(S-IN,S-IN),proj(IN,S-IN)];
  ctx.moveTo(inn[0].x,inn[0].y); inn.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
  const c=centroid(out);
  const g=ctx.createLinearGradient(c.x, c.y-360, c.x, c.y+360);
  g.addColorStop(0, shade(map.slab.top,-0.16)); g.addColorStop(1, map.slab.top);
  ctx.fillStyle=g; ctx.fill('evenodd');
  ctx.lineWidth=2.5; ctx.strokeStyle=map.slab.rim;
  polyPath(ctx,out); ctx.stroke();
}

/* ══════════ マス ══════════ */
const SIDE_ROT = [0, Math.PI/2, Math.PI, -Math.PI/2];
function drawTile(ctx, G, i, T){
  const t = G.tiles[i], r = RECTS[i], q = tileQuad(i);
  let top, dark, label = t.name, sub = '';
  if(t.type==='city'){
    const gc = GCOL[t.g];
    if(t.owner>=0){ top = shade(PCOL[t.owner], .10); dark = shade(PCOL[t.owner], -.35); }
    else { top = '#EEF3F8'; dark = '#8C9AAA'; }
    sub = t.owner>=0 ? yen(tollOf(t,G)) : yen(priceOf(t));
  } else if(t.type==='card'){ top='#E3E9F1'; dark='#8b97a6'; }
  else if(t.type==='tax'){ top='#C7CFDA'; dark='#7c8794'; }
  else if(t.type==='bonus'){ top='#FFE9A8'; dark='#a8873c'; }
  else { top='#DCE6F2'; dark='#7c8ba0'; }
  if(t.type==='start'){ top='#F2F6FA'; dark='#8493a6'; }

  // 側面
  extrude(ctx, q, TILE_H, dark, shade(dark,-0.22));
  // 天面
  polyPath(ctx,q);
  const c = centroid(q);
  const g = ctx.createLinearGradient(c.x, c.y-40, c.x, c.y+40);
  g.addColorStop(0, shade(top, .12)); g.addColorStop(1, shade(top, -.06));
  ctx.fillStyle=g; ctx.fill();
  ctx.lineWidth=1.6; ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.stroke();

  // 都市：グループ色の帯（外周側）
  if(t.type==='city'){
    const b = bandQuad(i, 0.30);
    polyPath(ctx,b); ctx.fillStyle=GCOL[t.g]; ctx.fill();
    ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.stroke();
  }

  // 文字
  const rot = SIDE_ROT[r.side];
  const cx = r.p + r.w/2, cy = r.q + r.h/2;
  if(t.type==='start'){
    planeText(ctx, cx, cy, rot, 'START', 30, '#5a6a7d', '#ffffff', 6);
  } else if(t.corner){
    planeText(ctx, cx, cy-6, rot, t.name, 22, '#2b3a4d', '#ffffff', 5);
  } else {
    // 名前は盤の内側寄り、金額は色帯（外周側）の手前に置く
    const dIn = 6, dPr = 15;
    let nx=cx, ny=cy, px=cx, py=cy;
    if(r.side===0){ ny=cy-dIn; py=cy+dPr; }
    if(r.side===2){ ny=cy+dIn; py=cy-dPr; }
    if(r.side===1){ nx=cx+dIn; px=cx-dPr; }
    if(r.side===3){ nx=cx-dIn; px=cx+dPr; }
    planeText(ctx, nx, ny, rot, label, 19, '#1b2733', '#ffffff', 4.5);
    if(sub) planeText(ctx, px, py, rot, sub, 17.5, '#7a4300', '#fffbe8', 4);
  }
  // 角マスのアイコン
  if(t.corner){
    const ic = t.type==='jail'?'🧊':t.type==='travel'?'🌀':t.type==='adventure'?'⛏️':'🚩';
    ctx.save(); ctx.translate(c.x, c.y-30); ctx.font='36px serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ic,0,0); ctx.restore();
  }
  if(t.type==='card'){ iconOn(ctx,c,'❓',26); }
  if(t.type==='tax'){ iconOn(ctx,c,'🧾',24); }
  if(t.type==='bonus'){ iconOn(ctx,c,'💰',24); }
}
function iconOn(ctx,c,ic,sz){
  ctx.save(); ctx.translate(c.x,c.y-6); ctx.font=sz+'px serif';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ic,0,0); ctx.restore();
}
/* マスの外周寄りの帯 */
function bandQuad(i, f){
  const r = RECTS[i];
  let p=r.p,q=r.q,w=r.w,h=r.h;
  if(r.side===0) return [proj(p,q+h*(1-f)),proj(p+w,q+h*(1-f)),proj(p+w,q+h),proj(p,q+h)];
  if(r.side===1) return [proj(p,q),proj(p+w*f,q),proj(p+w*f,q+h),proj(p,q+h)];
  if(r.side===2) return [proj(p,q),proj(p+w,q),proj(p+w,q+h*f),proj(p,q+h*f)];
  return [proj(p+w*(1-f),q),proj(p+w,q),proj(p+w,q+h),proj(p+w*(1-f),q+h)];
}

/* ══════════ 建物 ══════════ */
function drawBuilding(ctx, G, i, T){
  const t = G.tiles[i]; if(t.type!=='city' || t.owner<0) return;
  const r = RECTS[i];
  // 盤内側寄りに立てる
  let ax=r.p+r.w/2, ay=r.q+r.h/2;
  if(r.side===0) ay = r.q + r.h*0.20;
  if(r.side===2) ay = r.q + r.h*0.80;
  if(r.side===1) ax = r.p + r.w*0.80;
  if(r.side===3) ax = r.p + r.w*0.20;
  const o = proj(ax, ay);
  const col = PCOL[t.owner];
  const grow = t.grow===undefined ? 1 : t.grow;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(grow, grow);
  if(t.landmark) landmark(ctx, col, T);
  else {
    const n = t.lv;
    if(n>=1) hut(ctx, -26, 0, col);
    if(n>=2) tower(ctx, 2, 0, col, 54);
    if(n>=3) tower(ctx, 28, 0, shade(col,.2), 76);
  }
  ctx.restore();
}
function hut(ctx,x,y,col){
  ctx.fillStyle=shade(col,-.15);
  ctx.fillRect(x-13,y-22,26,22);
  ctx.fillStyle=shade(col,.28);
  ctx.beginPath(); ctx.moveTo(x-17,y-22); ctx.lineTo(x,y-38); ctx.lineTo(x+17,y-22); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillRect(x-5,y-15,10,9);
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1.4; ctx.strokeRect(x-13,y-22,26,22);
}
function tower(ctx,x,y,col,h){
  const w=24;
  const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);
  g.addColorStop(0,shade(col,-.25)); g.addColorStop(.45,shade(col,.18)); g.addColorStop(1,shade(col,-.4));
  ctx.fillStyle=g; ctx.fillRect(x-w/2, y-h, w, h);
  ctx.fillStyle='rgba(255,255,255,.5)';
  for(let r=0;r<Math.floor(h/16);r++) for(let c2=0;c2<2;c2++)
    ctx.fillRect(x-8+c2*11, y-h+9+r*16, 6, 7);
  ctx.fillStyle=shade(col,.45); ctx.fillRect(x-w/2-3, y-h-5, w+6, 6);
  ctx.strokeStyle='rgba(0,0,0,.32)'; ctx.lineWidth=1.4; ctx.strokeRect(x-w/2,y-h,w,h);
}
function landmark(ctx,col,T){
  const pulse = 0.82 + Math.sin(T*0.0026)*0.18;
  ctx.save();
  ctx.shadowColor='rgba(120,225,255,'+(0.5*pulse)+')'; ctx.shadowBlur=26;
  const h=104;
  const g=ctx.createLinearGradient(0,-h,0,0);
  g.addColorStop(0,'#CFF3FF'); g.addColorStop(.5,shade(col,.35)); g.addColorStop(1,shade(col,-.35));
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.moveTo(0,-h); ctx.lineTo(17,-h*0.62); ctx.lineTo(12,0);
  ctx.lineTo(-12,0); ctx.lineTo(-17,-h*0.62); ctx.closePath(); ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.moveTo(-3,-h+6); ctx.lineTo(4,-h*0.6); ctx.lineTo(-1,0); ctx.lineTo(-6,-h*0.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle=shade(col,-.25); ctx.fillRect(-22,-6,44,8);
  ctx.fillStyle='#FFE08A'; ctx.font='900 15px "Noto Sans JP",sans-serif';
  ctx.textAlign='center'; ctx.fillText('★',0,-h-6);
  ctx.restore();
}

/* ══════════ コマ ══════════ */
const PCOL = ['#E14A5A','#3E8FE0','#54C06A','#E0A73C'];
const PICO = ['🐧','🦊','🐻','🐰'];
function drawToken(ctx, G, pi, T){
  const p = G.players[pi]; if(p.out) return;
  const pos = p.render || tileCenter(p.pos);
  const bob = Math.sin(T*0.004 + pi*1.7)*2.2;
  const hop = p.hopY||0, sq = p.squash||1;
  const x = pos.x + (p.offx||0), y = pos.y + (p.offy||0) - hop + bob;
  ctx.save(); ctx.translate(x, y);
  // 影
  ctx.fillStyle='rgba(0,0,0,.34)';
  ctx.beginPath(); ctx.ellipse(0, hop*0.15, 17*(1-hop/260), 7*(1-hop/260), 0,0,6.283); ctx.fill();
  ctx.scale(1/sq, sq);
  // 台座
  const g=ctx.createLinearGradient(0,-44,0,0);
  g.addColorStop(0,shade(PCOL[pi],.35)); g.addColorStop(1,shade(PCOL[pi],-.3));
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(-15,0); ctx.lineTo(-11,-26); ctx.quadraticCurveTo(0,-34,11,-26); ctx.lineTo(15,0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1.6; ctx.stroke();
  // 顔
  ctx.font='30px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(PICO[pi], 0, -44);
  // 手番リング
  if(G.turn===pi && G.phase!=='over'){
    ctx.strokeStyle='rgba(255,230,120,'+(0.55+0.35*Math.sin(T*0.006))+')';
    ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.ellipse(0,2,22,9,0,0,6.283); ctx.stroke();
  }
  ctx.restore();
}

/* ══════════ 盤上の浮遊テキスト ══════════ */
const floats = [];
function addFloat(x,y,txt,col,big){ floats.push({x,y,txt,col,t:0,big:!!big}); }
function drawFloats(ctx, dt){
  for(let i=floats.length-1;i>=0;i--){
    const f=floats[i]; f.t+=dt;
    const k=f.t/1400;
    if(k>=1){ floats.splice(i,1); continue; }
    ctx.save();
    ctx.globalAlpha = k<0.75 ? 1 : (1-(k-0.75)/0.25);
    ctx.translate(f.x, f.y - k*58);
    ctx.font='400 '+(f.big?46:30)+'px "Mochiy Pop One", sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=f.big?8:6; ctx.lineJoin='round'; ctx.strokeStyle='rgba(28,18,4,.9)';
    ctx.strokeText(f.txt,0,0);
    ctx.fillStyle=f.col; ctx.fillText(f.txt,0,0);
    ctx.restore();
  }
}
/* 紙吹雪 */
const parts = [];
function burst(x,y,n,cols){
  for(let i=0;i<n;i++){
    const a=Math.random()*6.283, sp=1.6+Math.random()*5.2;
    parts.push({x,y,vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-3.4, t:0,
      c:cols[(Math.random()*cols.length)|0], r:Math.random()*6.283, s:3+Math.random()*5});
  }
}
function drawParts(ctx, dt){
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i]; p.t+=dt;
    if(p.t>1500){ parts.splice(i,1); continue; }
    const f=dt/16.67;
    p.x+=p.vx*f; p.y+=p.vy*f; p.vy+=0.22*f; p.vx*=0.995; p.r+=0.14*f;
    ctx.save(); ctx.globalAlpha=Math.max(0,1-p.t/1500);
    ctx.translate(p.x,p.y); ctx.rotate(p.r);
    ctx.fillStyle=p.c; ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.7);
    ctx.restore();
  }
}
/* 着地の閃光 */
const flashes=[];
function addFlash(x,y){ flashes.push({x,y,t:0}); }
function drawFlashes(ctx,dt){
  for(let i=flashes.length-1;i>=0;i--){
    const f=flashes[i]; f.t+=dt; const k=f.t/300;
    if(k>=1){ flashes.splice(i,1); continue; }
    ctx.save(); ctx.globalAlpha=(1-k)*0.9; ctx.translate(f.x,f.y);
    const R=18+k*90;
    const g=ctx.createRadialGradient(0,0,2,0,0,R);
    g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(.5,'rgba(190,235,255,.5)');
    g.addColorStop(1,'rgba(190,235,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,R,0,6.283); ctx.fill();
    ctx.restore();
  }
}
/* 歩数プレビュー番号 */
let stepPreview = null;   // {from, max}
function drawSteps(ctx, G){
  if(!stepPreview) return;
  for(let d=1; d<=stepPreview.max; d++){
    const i=(stepPreview.from+d)%32, r=RECTS[i];
    // マスの外側へ押し出した位置
    let ax=r.p+r.w/2, ay=r.q+r.h/2;
    if(r.side===0) ay=r.q+r.h+24; if(r.side===2) ay=r.q-24;
    if(r.side===1) ax=r.p-24;      if(r.side===3) ax=r.p+r.w+24;
    const o=proj(ax,ay);
    ctx.save(); ctx.translate(o.x,o.y);
    ctx.font='400 19px "Mochiy Pop One", sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=5; ctx.lineJoin='round'; ctx.strokeStyle='rgba(10,20,36,.85)';
    ctx.strokeText(d,0,0); ctx.fillStyle='#fff'; ctx.fillText(d,0,0);
    ctx.restore();
  }
}
/* 転がるサイコロ */
let diceAnim = null;  // {t, dur, a, b, x, y}
function drawDice(ctx, T){
  if(!diceAnim) return;
  const k = Math.min(1, diceAnim.t/diceAnim.dur);
  const ease = 1-Math.pow(1-k,3);
  const cx = BCX, cy = BCY - 120 + ease*150;
  for(let d=0; d<2; d++){
    const sp = d? -1: 1;
    const x = cx + sp*(46 + (1-ease)*70), y = cy + (1-ease)*(-180) + Math.sin(k*9+d)*(1-ease)*40;
    const rot = (1-ease)*14*sp + T*0.0006*sp*(1-ease)*8;
    const face = k<1 ? 1+((Math.floor(T/70)+d)%6) : (d? diceAnim.b : diceAnim.a);
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(1+(1-ease)*0.25,1+(1-ease)*0.25);
    dieFace(ctx, face);
    ctx.restore();
  }
}
function dieFace(ctx, n){
  const s=52, r=11;
  const g=ctx.createLinearGradient(-s/2,-s/2,s/2,s/2);
  g.addColorStop(0,'#FFFFFF'); g.addColorStop(1,'#E6D2D6');
  ctx.fillStyle=g;
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(-s/2,-s/2,s,s,r);
  else ctx.rect(-s/2,-s/2,s,s);
  ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle='rgba(0,0,0,.22)'; ctx.stroke();
  const P={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],
    4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
    6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]};
  ctx.fillStyle='#C8566B';
  (P[n]||P[1]).forEach(([a,b])=>{
    ctx.beginPath(); ctx.arc(a*13, b*13, 5.4, 0, 6.283); ctx.fill();
  });
}
