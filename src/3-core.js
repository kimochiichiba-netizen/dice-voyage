<script>
"use strict";
/* ══════════════════════════════════════════════════════════════
   ダイスボヤージュ — コア（幾何・データ・描画のとりまとめ）
   実際の描き込みは 3b-art.js の dv* 関数が担当する
   ══════════════════════════════════════════════════════════════ */

const SW = 1600, SH = 900;
const S  = 888;                          // 盤（正方形）の1辺（盤空間px）
const RHO= 1.88;                         // 角マス : 通常マス（本家の実測比）
const TW = S / (2*RHO + 7);              // 通常マスの幅（進行方向）＝103.9
const CW = RHO * TW;                     // 角マスの1辺＝178.8
const TD = CW;                           // 帯の深さ。角マスと合わせて段差を無くす
const KX = 0.7071067811865476;
const KSQ= 0.650;                        // 縦潰し（実測: ひし形の横:縦 = 1.54:1）
const KY = KX * KSQ;
const BCX= SW * 0.505, BCY = SH * 0.500; // 盤中心（上頂点 4.7%・下頂点 95%）
const TILE_H = 8;                        // マスの厚み（実測 画面高の0.9%）

function proj(p, q){
  const dx = p - S/2, dy = q - S/2;
  return { x: BCX + KX*(dx-dy), y: BCY + KY*(dx+dy) };
}
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

/* ══════════ マップ ══════════ */
/* 本家の実測色。彩度25〜55%・明度55〜80%の淡い色で、ネオンや原色は1つも無い */
const GCOL = ['#79CDBD','#6BB2D2','#6DA83F','#EFAAA0','#D389C4','#D2913A','#8F6BC8','#C0564B'];
const TILE_FACE = '#E3EBEC';             // 金額を書く氷色の淡い面
const TILE_INK  = '#5E6B72';             // 金額の文字色（縁取り無し）
const GBASE= [400000, 600000, 850000, 1100000, 1450000, 1800000, 2250000, 2800000];
/* 色グループは2マスが3組・3マスが5組。本家も2〜3マス混在で、
   全部3マスだと「3色ぶん独占」が現実的に起きなくなる。 */
const CITY_SLOTS = [[1,3],[4,5],[7,9],[10,12,13],[14,17,18],[20,21,22],[25,26,28],[29,30,31]];
const SPECIAL = {2:'bonus', 6:'card', 11:'card', 15:'card', 19:'tax', 23:'card', 27:'card'};

const MAPS = [
{ id:'ice', name:'氷の洞窟', sub:'ICE CAVERN', emoji:'❄️',
  lake:['#9FE3F0','#6FC3D8','#35708A'],
  slab:{top:'#C2B8E2', side:'#6A5F96', rim:'#E6ECF6'},
  deco:'ice',
  corners:['スタート','氷の監獄','氷雪の祭典','水晶の転移門'],
  cities:[
    ['氷結の泉','霜の小屋'], ['凍り村','雪見の丘'], ['氷柱回廊','白銀通り'],
    ['銀嶺市場','蒼氷広場','凍湖港'], ['水晶坑道','極光台','氷紋宮'],
    ['氷刃城塞','静寂の樹海','蒼玉神殿'], ['極夜宮殿','永久氷河','白帝の塔'],
    ['氷王の玉座','天空氷城','原初の氷核']] },
{ id:'world', name:'世界一周', sub:'WORLD TOUR', emoji:'🌍',
  lake:['#63CBDE','#2E8CA6','#0D4A5C'],
  slab:{top:'#E8D9B0', side:'#8A7448', rim:'#F8F0DC'},
  deco:'world',
  corners:['スタート','乗り継ぎ待ち','オリンピック開催','世界旅行'],
  cities:[
    ['バリ','セブ'], ['プーケット','台北'], ['ソウル','香港'],
    ['シンガポール','ドバイ','イスタンブール'], ['カイロ','ケープタウン','リオ'],
    ['シドニー','バンクーバー','ロサンゼルス'], ['ローマ','バルセロナ','ベルリン'],
    ['ロンドン','パリ','ニューヨーク']] },
{ id:'oita', name:'大分めぐり', sub:'OITA MEGURI', emoji:'♨️',
  lake:['#A8EADA','#48AE9A','#1E6459'],
  slab:{top:'#E4D3B4', side:'#8E7A57', rim:'#F8F0DC'},
  deco:'onsen',
  corners:['スタート','大分IC 渋滞','おんせん祭り','高速フェリー'],
  cities:[
    ['佐賀関','佐伯'], ['蒲江','臼杵'], ['津久見','豊後大野'],
    ['竹田','日田','玖珠'], ['国東','杵築','日出'],
    ['中津','宇佐','豊後高田'], ['大分駅前','大分港','高崎山'],
    ['別府温泉','由布院','鉄輪地獄']] }];

function buildTiles(map){
  const t = new Array(32).fill(null);
  t[0]  = {type:'start',    name:map.corners[0]};
  t[8]  = {type:'jail',     name:map.corners[1]};
  t[16] = {type:'olympic',  name:map.corners[2]};
  t[24] = {type:'travel',   name:map.corners[3]};
  for(const k in SPECIAL){
    const i = +k, v = SPECIAL[k];
    if(v==='card')  t[i] = {type:'card',  name:'チャンス'};
    if(v==='tax')   t[i] = {type:'tax',   name:'税務署', rate:0.10};
    if(v==='bonus') t[i] = {type:'bonus', name:'ボーナス', amount:1500000};
  }
  CITY_SLOTS.forEach((slots,g)=>{
    slots.forEach((idx,j)=>{
      const base = Math.round(GBASE[g] * (1 + j*0.13));
      t[idx] = { type:'city', name:map.cities[g][j], g, base,
                 owner:-1, lv:0, landmark:false, x2:false, frozen:0, grow:1, bind:0, olym:1 };
    });
  });
  // 通行料2倍マスを2つ置く（本家の ×2 マス）
  // 祭り都市：毎試合ランダムで3ヶ所が通行料2倍のまま最後まで固定される。
  // 初手の運が全員の共通の話題になり、同じ盤でも毎回ちがう試合になる。
  (function(){
    const cities = []; for(let i=0;i<32;i++) if(t[i] && t[i].type==='city') cities.push(i);
    for(let k=0;k<3 && cities.length;k++){
      t[cities.splice((Math.random()*cities.length)|0, 1)[0]].x2 = true;
    }
  })();
  return t;
}

/* 建物：0=土地 1=別荘 2=ビル 3=ホテル 4=ランドマーク */
const BUILD = [
  {nm:'土地',        ic:'🏳️', cost:b=>b,                 toll:b=>Math.round(b*0.10)},
  {nm:'別荘',        ic:'🏠', cost:b=>Math.round(b*0.5), toll:b=>Math.round(b*0.60)},
  {nm:'ビル',        ic:'🏢', cost:b=>b,                 toll:b=>Math.round(b*1.50)},
  {nm:'ホテル',      ic:'🏨', cost:b=>Math.round(b*1.6), toll:b=>Math.round(b*3.00)},
  {nm:'ランドマーク', ic:'🗼', cost:b=>Math.round(b*4.0), toll:b=>Math.round(b*10.0)}
];
function tollOf(tile, G){
  if(!tile || tile.type!=='city' || tile.owner<0) return 0;
  if(tile.frozen>0) return 0;
  let v = BUILD[0].toll(tile.base);
  for(let i=1;i<=tile.lv;i++) v += BUILD[i].toll(tile.base);
  if(tile.landmark) v += BUILD[4].toll(tile.base);
  let m = 1;
  if(tile.x2) m *= 2;                              // 祭り都市
  if(tile.olym > 1) m *= tile.olym;                // オリンピック開催（最大5倍）
  if(G){
    const i = G.tiles.indexOf(tile);
    if(hasTriple(G, tile.owner, tile.g)) m *= 2 * ((G.ev && G.ev.monoX) || 1);
    if(hasLine(G, tile.owner, Math.floor(i/8))) m *= 2;
    if(G.ev && G.ev.tollX) m *= G.ev.tollX;      // 週替わり「通行料値上げ」
    if(G.infl && G.infl > 1) m *= G.infl;        // 終盤インフレ（残り6ターンから毎ターン1.5倍）
    const ow = G.players && G.players[tile.owner];
    if(ow && ow.tollUp > 0) m *= 1.6;            // 能力「地価高騰」：自分の土地を一時的に値上げ
  }
  return Math.round(v*m);
}
/* いま何色ぶんカラー独占しているか */
function colorMono(G, pi){
  let c = 0; for(let g=0; g<7; g++) if(hasTriple(G,pi,g)) c++;
  return c;
}
/* 成立している独占をひとつ返す（無ければ null）。x は報酬倍率。
   同時に成立したときは倍率の高いほうを名乗る、が本家の決まり。 */
function monoOf(G, pi){
  const lm = G.tiles.filter(t=>t.landmark && t.owner===pi).length;
  if(lm >= 6) return { kind:'land',  label:'観光地独占', col:'#7FE6FF', key:'m', x:5 };
  for(let s=0; s<4; s++) if(hasLine(G,pi,s))
    return { kind:'line',  label:'ライン独占', col:'#FFD24D', key:'l'+s, x:3 };
  if(colorMono(G,pi) >= 3)
    return { kind:'triple', label:'トリプル独占', col:'#FFD24D', key:'t', x:2 };
  return null;
}
function cityValue(t){
  let v = t.base;
  for(let k=1;k<=t.lv;k++) v += BUILD[k].cost(t.base);
  if(t.landmark) v += BUILD[4].cost(t.base);
  return v;
}
function assetOf(G,pi){
  let a = G.players[pi].cash;
  G.tiles.forEach(t=>{ if(t.type==='city' && t.owner===pi) a += cityValue(t); });
  return a;
}
function hasTriple(G, pi, g){ return CITY_SLOTS[g].every(i => G.tiles[i].owner===pi); }
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

/* ══════════ キャラクター（7ステータス制・本家準拠） ══════════ */
/* 数値は 0..100。ゲーム内の各種計算に実際に効く */
const CHARS = [
  { id:0, name:'ミナ', role:'氷の魔法使い', col:'#4C9BE8',
    line:'凍らせてあげる。動かないでね。',
    stats:{ toll:72, mini:48, special:55, fortune:60, build:88, gauge:62, buyout:44 },
    skill:{ nm:'アイスウォール', desc:'次に払う通行料が0になる。1ゲーム2回まで。', uses:2 } },
  { id:1, name:'ガル', role:'紅蓮の剣士', col:'#E14A5A',
    line:'細かい話は苦手だ。ぶつかるぞ。',
    stats:{ toll:88, mini:70, special:44, fortune:40, build:52, gauge:74, buyout:66 },
    skill:{ nm:'突撃', desc:'次のサイコロの出目を自分で選べる。1ゲーム2回まで。', uses:2 } },
  { id:2, name:'リノ', role:'風の弓使い', col:'#54C06A',
    line:'当てるのは得意なんだ。',
    stats:{ toll:56, mini:92, special:62, fortune:74, build:58, gauge:95, buyout:50 },
    skill:{ nm:'風読み', desc:'好きなマスへ移動する。1ゲーム2回まで。', uses:2 } },
  { id:3, name:'ゼニ', role:'黄金の商人', col:'#E0A73C',
    line:'商売は数字だよ、お客さん。',
    stats:{ toll:50, mini:55, special:90, fortune:92, build:70, gauge:48, buyout:94 },
    skill:{ nm:'金策', desc:'総資産の8%を現金で受け取る。1ゲーム2回まで。', uses:2 } }
];
const STAT_LABELS = [
  ['toll','通行料割引'], ['mini','ミニゲーム勝利'], ['special','特殊費用割引'],
  ['fortune','黄金フォーチュン'], ['build','建設費用割引'], ['gauge','ゲージインパクト'],
  ['buyout','買収費用割引']
];
/* ステータス → 実際の倍率。p.stats（カード＋ペンダント合成後）を優先して読む */
function statOf(p, key){
  if(p && p.stats && typeof p.stats[key]==='number') return Math.max(0, Math.min(120, p.stats[key]));
  return 50;   // p.stats が無い時の既定値（カードは必ず stats を持つ）
}
function statMul(p, key, maxCut){          // 割引系：0..maxCut の割引
  return 1 - (statOf(p,key)/100) * maxCut;
}
function statRate(p, key){                 // 確率系：0..1
  return statOf(p,key)/100;
}

/* ══════════ 持ち込みアイテム（本家の「アイテム」相当） ══════════ */
const ITEMS = [
  { id:'angel',  nm:'天使カード',    ic:'🪽', desc:'次に払う通行料が1回だけ無料になる' },
  { id:'dice',   nm:'サイコロ改造',  ic:'🎲', desc:'次のサイコロの出目を自分で選べる' },
  { id:'warp',   nm:'ワープ札',      ic:'🌀', desc:'好きなマスへ移動する' },
  { id:'half',   nm:'建設割引券',    ic:'🏗', desc:'次の建設が半額になる' },
  { id:'freeze', nm:'凍結ブロック',  ic:'🧊', desc:'相手の街を2ターン凍らせる（通行料0）' },
  { id:'salary', nm:'給料2倍券',     ic:'💴', desc:'次のスタート通過の給料が2倍' },
  { id:'double', nm:'ダブルチャンス',ic:'✌️', desc:'次のサイコロが必ずゾロ目になる' },
];
function itemById(id){ return ITEMS.find(o=>o.id===id); }

/* ══════════ サイコロ（装備して出目そのものを変える） ══════════ */
const DICE = [
  { id:'d0', nm:'ふつうのサイコロ', ic:'🎲', rar:'A',  col:'#E8EEF6',
    ds:'なんの細工もない、木のサイコロ。', gauge:0, dbl:0, big:0 },
  { id:'d1', nm:'黄金のサイコロ',   ic:'🥇', rar:'S',  col:'#FFD24D',
    ds:'ゲージインパクトの当たり枠が広がる（＋12）。', gauge:12, dbl:0, big:0 },
  { id:'d2', nm:'LEDサイコロ',      ic:'💡', rar:'S',  col:'#7FE6FF',
    ds:'ゾロ目が出やすくなる（＋9%）。もう一回振れる。', gauge:0, dbl:0.09, big:0 },
  { id:'d3', nm:'トランプサイコロ', ic:'🃏', rar:'S+', col:'#FF8FB0',
    ds:'大きい目が出やすい（＋1.1マス）。遠くまで一気に進む。', gauge:0, dbl:0, big:1 },
  { id:'d4', nm:'亡者のサイコロ',   ic:'💀', rar:'S+', col:'#B58CFF',
    ds:'ゾロ目＋6%、ゲージ＋8。強いが、目が荒れる。', gauge:8, dbl:0.06, big:0.5 }
];
function dieById(id){ return DICE.find(d=>d.id===id) || DICE[0]; }

/* ══════════ カメラ ══════════ */
const cam = {x:BCX, y:BCY, z:1, tx:BCX, ty:BCY, tz:1, shake:0};
function camTo(x,y,z){ cam.tx=x; cam.ty=y; cam.tz=z; }
function camReset(){ camTo(BCX,BCY,1); }
function camShake(v){ cam.shake = Math.max(cam.shake, v); }
function camStep(dt){
  const k = 1 - Math.pow(0.0016, dt);
  cam.x += (cam.tx-cam.x)*k; cam.y += (cam.ty-cam.y)*k; cam.z += (cam.tz-cam.z)*k;
  cam.shake *= Math.pow(0.02, dt);
  if(cam.shake < 0.2) cam.shake = 0;
}

/* ══════════ 描画のとりまとめ ══════════ */
/* 4辺とも文字が読める向きになる回転。向かい合う辺は同じ角度でよい
   （アイソメでは、辺0と辺2・辺1と辺3が画面上で同じ傾きになるため） */
const SIDE_ROT = [0, -Math.PI/2, 0, -Math.PI/2];

function polyPath(ctx, pts){
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}
function centroid(pts){ let x=0,y=0; pts.forEach(p=>{x+=p.x;y+=p.y}); return {x:x/pts.length,y:y/pts.length}; }
function shade(col, f){
  let r,g,b;
  if(col[0] === '#'){
    const n = parseInt(col.slice(1),16); r=(n>>16)&255; g=(n>>8)&255; b=n&255;
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
function toHex(col){
  if(col[0]==='#') return col;
  const m = col.match(/\d+/g); if(!m) return '#888888';
  return '#'+m.slice(0,3).map(v=>('0'+(+v).toString(16)).slice(-2)).join('');
}
/* 2色を混ぜる（未所有のマスは区画色の色相を保ったまま彩度だけ落とす） */
function mixHex(a, b, f){
  const A = a.replace('#',''), B = b.replace('#','');
  const p = n => [0,2,4].map(k=>parseInt(n.substr(k,2),16));
  const x = p(A), y = p(B);
  return '#' + x.map((v,k)=>('0'+Math.round(v+(y[k]-v)*f).toString(16)).slice(-2)).join('');
}
/* マスに出す金額は3〜5文字に丸める（本家は必ず「456万」の形。
   全桁だと「3527万3800」で9文字になり、隣のマスへはみ出す） */
function yenShort(n){
  n = Math.round(n);
  if(n >= 100000000) return (n/100000000).toFixed(1).replace(/\.0$/,'') + '億';
  if(n >= 10000)     return Math.round(n/10000) + '万';
  return String(n);
}
/* マスの四隅を重心へ少し縮める（板と板のあいだに土台の溝を作る） */
function shrinkQuad(q, d){
  const cx = (q[0].x+q[1].x+q[2].x+q[3].x)/4, cy = (q[0].y+q[1].y+q[2].y+q[3].y)/4;
  return q.map(p=>{ const dx=cx-p.x, dy=cy-p.y, L=Math.hypot(dx,dy)||1;
    return { x: p.x + dx/L*d, y: p.y + dy/L*d }; });
}
/* 盤平面に沿った文字 */
function planeText(ctx, p, q, rot, txt, size, fill, stroke, sw, oy, maxw){
  const o = proj(p,q);
  const c = Math.cos(rot), s = Math.sin(rot);
  const e1 = { x: KX*( c - s), y: KY*( c + s) };
  const e2 = { x: KX*(-s - c), y: KY*(-s + c) };
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.transform(e1.x, e1.y, e2.x, e2.y, 0, 0);
  ctx.font = '900 '+size+'px "Noto Sans JP", sans-serif';
  // マスの幅に収まらない名前は、収まるまで字を小さくする
  if(maxw){
    const w = ctx.measureText(txt).width;
    if(w > maxw){ size = Math.max(9, size * maxw / w);
      ctx.font = '900 '+size.toFixed(1)+'px "Noto Sans JP", sans-serif'; }
  }
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const dy = oy || 0;
  if(stroke){ ctx.lineWidth=sw||3; ctx.strokeStyle=stroke; ctx.lineJoin='round'; ctx.strokeText(txt,0,dy); }
  ctx.fillStyle = fill; ctx.fillText(txt,0,dy);
  ctx.restore();
}
/* マスの帯。本家は「湖側の内寄り」に色帯があり、その上に都市名と建物が乗る。
   外側に残る淡い面には金額だけを書く。 */
function bandQuad(i, f){
  const r = RECTS[i], p=r.p, q=r.q, w=r.w, h=r.h;
  if(r.side===0) return [proj(p,q+h*(1-f)),proj(p+w,q+h*(1-f)),proj(p+w,q+h),proj(p,q+h)];
  if(r.side===1) return [proj(p,q),proj(p+w*f,q),proj(p+w*f,q+h),proj(p,q+h)];
  if(r.side===2) return [proj(p,q),proj(p+w,q),proj(p+w,q+h*f),proj(p,q+h*f)];
  return [proj(p+w*(1-f),q),proj(p+w,q),proj(p+w,q+h),proj(p+w*(1-f),q+h)];
}
/* 盤の外へ向かう向きが、文字座標系の +y か -y か */
function outSign(side){ return (side===0 || side===3) ? 1 : -1; }

function drawBackdrop(ctx, map, T){
  dvBackdrop(ctx, map.deco, T, SW, SH, BCX, BCY);
  drawTable(ctx, T);
}
/* 盤が載っている卓。本家は濃いウォールナットのテーブルを斜め上から見た絵で、
   盤の周りだけスポットで明るく、四隅は落としてある（舞台照明）。
   ここを暗い紺にしていたので、盤が闇に浮いて安っぽく見えていた。 */
function drawTable(ctx, T){
  ctx.save();
  // 木地
  ctx.fillStyle = '#3A2617'; ctx.fillRect(0,0,SW,SH);
  // 盤の周りだけを照らすスポット（実測: 盤際 #604437 → 四隅 #201210）
  const rg = ctx.createRadialGradient(BCX, BCY-40, SW*0.10, BCX, BCY-40, SW*0.78);
  rg.addColorStop(0,   '#6A4A38');
  rg.addColorStop(0.34,'#604437');
  rg.addColorStop(0.66,'#3F281C');
  rg.addColorStop(1,   '#201210');
  ctx.fillStyle = rg; ctx.fillRect(0,0,SW,SH);
  // 木目。盤の右下辺とほぼ平行（画面上で約-30°）に流れる直線
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1;
  for(let k=-26; k<=26; k++){
    const off = k*38 + Math.sin(k*2.7)*11;
    ctx.strokeStyle = (k % 3 === 0) ? '#7A5A40' : '#2A1A10';
    ctx.beginPath();
    ctx.moveTo(-200, SH*0.5 + off + 200*0.577);
    ctx.lineTo(SW+200, SH*0.5 + off - (SW+200)*0.577 + SW*0.577);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 四隅のビネット
  const vg = ctx.createRadialGradient(BCX, BCY, SW*0.30, BCX, BCY, SW*0.80);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(0,0,SW,SH);
  // 盤の下2辺の外側にだけ落ちる柔らかい影
  const sh = ctx.createRadialGradient(BCX, BCY + KY*S*0.55, SW*0.06, BCX, BCY + KY*S*0.55, SW*0.42);
  sh.addColorStop(0,'rgba(10,6,4,0.55)'); sh.addColorStop(1,'rgba(10,6,4,0)');
  ctx.fillStyle = sh; ctx.fillRect(0, BCY, SW, SH-BCY);
  ctx.restore();
}

function drawLake(ctx, map, T){
  const inset = TD;         // 実測: 水面の幅 ÷ 盤の幅 = 0.65
  const pts=[proj(inset,inset),proj(S-inset,inset),proj(S-inset,S-inset),proj(inset,S-inset)];
  // 本家の水面は水色ではなく無彩色のグレー。ここが派手だと盤の主役を食う
  dvLake(ctx, pts, ['#A6A6A6','#969696','#7C7C7E'], T, 'ダイスボヤージュ', '◇ '+map.name);
  // 本家の水面のロゴは同じ灰色の凹凸だけ（実効不透明度8%程度）
}
function drawSlab(ctx, map, T){
  const OH = 42, IN = TD - 3;   // 木の土台は盤の外へ 約2%（実測）
  const outer=[proj(-OH,-OH),proj(S+OH,-OH),proj(S+OH,S+OH),proj(-OH,S+OH)];
  const inner=[proj(IN,IN),proj(S-IN,IN),proj(S-IN,S-IN),proj(IN,S-IN)];
  dvSlab(ctx, outer, inner, map.slab, T);
}

function drawTile(ctx, G, i, T){
  const t = G.tiles[i], r = RECTS[i], q = tileQuad(i);
  let top, side, band = null, glow = null, label = t.name, sub = '';
  if(t.type==='city'){
    // 本家は所有者の色をマスに一切出さない。変わるのは建物と数字だけ。
    // マスの大半が区画色で、外側の縁にだけ金額用の淡いパネルが乗る。
    top  = GCOL[t.g];
    side = mixHex(GCOL[t.g], '#6E8494', 0.34);
    band = TILE_FACE;
    const mulx = (t.x2 ? 2 : 1) * (t.olym > 1 ? t.olym : 1);
    sub  = (t.owner>=0 ? yenShort(tollOf(t,G)) : yenShort(t.base)) + (mulx > 1 ? ' X'+mulx : '');
    if(t.landmark) glow = '#7FE6FF';
  }
  else if(t.type==='card'){ top='#EAF0F8'; side=mixHex('#EAF0F8','#6E8494',0.30); }
  else if(t.type==='tax'){ top='#D7DEE6'; side=mixHex('#D7DEE6','#6E8494',0.30); }
  else if(t.type==='bonus'){ top='#F7E7B4'; side=mixHex('#F7E7B4','#6E8494',0.30); glow='#FFD24D'; }
  else if(t.type==='start'){ top='#E2E9EE'; side=mixHex('#E2E9EE','#6E8494',0.30); }
  else { top='#CFE7F2'; side=mixHex('#CFE7F2','#6E8494',0.30); }

  // 本家はマス同士が隙間なく接し、境目は1pxのシームだけ
  dvTile(ctx, shrinkQuad(q, 1), { top, side, h: t.corner ? TILE_H+3 : TILE_H,
                   band, bandQuad: band ? bandQuad(i, 0.28) : null,
                   glow, dim: t.frozen>0, t:T });

  // 本家は「白い文字＋濃い縁」。逆にすると盤の上でまったく読めなくなる
  const rot = SIDE_ROT[r.side];
  const cx = r.p + r.w/2, cy = r.q + r.h/2;
  if(t.type==='start'){
    planeText(ctx, cx, cy, rot, 'START', 34, '#FFFFFF', '#41506380', 8);
    planeText(ctx, cx, cy, rot, 'START', 34, '#FFFFFF', null, 0);
  } else if(t.corner){
    const cc = tileCenter(i);
    ctx.save();
    ctx.font = '900 27px "Noto Sans JP", sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineJoin='round';
    ctx.lineWidth = 7; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(t.name, cc.x, cc.y+34);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#3A1008'; ctx.strokeText(t.name, cc.x, cc.y+34);
    const gr = ctx.createLinearGradient(0, cc.y+22, 0, cc.y+46);
    gr.addColorStop(0,'#FFF1DC'); gr.addColorStop(1,'#E8563A');
    ctx.fillStyle = gr; ctx.fillText(t.name, cc.x, cc.y+34);
    ctx.restore();
  } else {
    // 本家は「都市名＝色帯の上に白の小さい字」「金額＝淡い面に大きい灰字（縁なし）」。
    // 金額のほうが名前より大きいのが本家の見え方。
    const sg = outSign(r.side);
    const mw = ((r.side===0||r.side===2) ? r.w : r.h) * 0.90;
    ctx.save(); polyPath(ctx, q); ctx.clip();          // 隣のマスへはみ出させない
    planeText(ctx, cx, cy, rot, label, 17, '#FFFFFF', '#2B3A47', 4.5, -sg*13, mw);
    if(sub) planeText(ctx, cx, cy, rot, sub, 19, TILE_INK, null, 0, sg*27, mw);
    ctx.restore();
  }
  // 角マスのアイコン
  const c = centroid(q);
  if(t.corner){
    ctx.save(); ctx.translate(c.x, c.y+6);
    if(t.type==='olympic') dvChest(ctx, T);
    else {
      ctx.font='40px serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText(t.type==='jail'?'🏝️':t.type==='travel'?'✈️':'🚩', 0, -4);
    }
    ctx.restore();
  }
  if(t.type==='card'){ ctx.save(); ctx.translate(c.x, c.y+4); dvCardIcon(ctx, T); ctx.restore(); }
  if(t.type==='tax'){ iconOn(ctx,c,'🧾',26); }
  if(t.type==='bonus'){ iconOn(ctx,c,'💰',26); }
  // ×2 バッジ

  // 凍結
  if(t.frozen>0){
    ctx.save(); ctx.globalAlpha=.55; polyPath(ctx,q);
    ctx.fillStyle='#BFE8FF'; ctx.fill();
    ctx.restore();
    iconOn(ctx,c,'🧊',24);
  }
}
function iconOn(ctx,c,ic,sz){
  ctx.save(); ctx.translate(c.x,c.y-4); ctx.font=sz+'px serif';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ic,0,0); ctx.restore();
}
/* 金の丸バッジ（歩数・×2 など。本家の金丸数字） */
function goldBadge(ctx, x, y, txt, r){
  ctx.save(); ctx.translate(x,y);
  const g = ctx.createLinearGradient(0,-r,0,r);
  g.addColorStop(0,'#FFF6C8'); g.addColorStop(.45,'#F2C230'); g.addColorStop(1,'#B87F12');
  ctx.beginPath(); ctx.arc(0,0,r,0,6.283);
  ctx.fillStyle=g; ctx.fill();
  ctx.lineWidth=2.2; ctx.strokeStyle='#5C3F06'; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-r*0.38, r*0.55, r*0.3, 0,0,6.283);
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fill();
  ctx.font='400 '+(r*1.15)+'px "Mochiy Pop One", sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.lineWidth=3.2; ctx.lineJoin='round'; ctx.strokeStyle='#4A3206';
  ctx.strokeText(txt,0,1); ctx.fillStyle='#FFF8E0'; ctx.fillText(txt,0,1);
  ctx.restore();
}

/* 建物 */
function drawBuilding(ctx, G, i, T){
  const t = G.tiles[i]; if(t.type!=='city' || t.owner<0) return;
  const r = RECTS[i];
  let ax=r.p+r.w/2, ay=r.q+r.h/2;
  if(r.side===0) ay = r.q + r.h*0.13;
  if(r.side===2) ay = r.q + r.h*0.87;
  if(r.side===1) ax = r.p + r.w*0.87;
  if(r.side===3) ax = r.p + r.w*0.13;
  const o = proj(ax, ay);
  const col = PCOL[t.owner];
  const grow = (t.grow===undefined ? 1 : t.grow) * 0.86;
  // ランドマークは常時、天へ伸びる光の柱を立てる（本家の一番目立つ絵）
  if(t.landmark){
    const pulse = 0.55 + 0.45*Math.sin(T*0.0022);
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.globalCompositeOperation = 'lighter';
    // 柱は「そこが特別だ」と分かれば十分。高くて濃いと盤が見えなくなる
    const g = ctx.createLinearGradient(0,0,0,-112);
    g.addColorStop(0,'rgba(140,230,255,'+(0.24*pulse).toFixed(3)+')');
    g.addColorStop(.45,'rgba(140,230,255,'+(0.10*pulse).toFixed(3)+')');
    g.addColorStop(1,'rgba(140,230,255,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(-15,0); ctx.lineTo(-5,-112); ctx.lineTo(5,-112); ctx.lineTo(15,0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 本家は「建てた分だけ小さい建物がマスに横一列に並ぶ」。
  // 1マス1個の巨大モデルだと盤が見えなくなり、育てた実感も出ない。
  const along = (r.side===0 || r.side===2) ? 'p' : 'q';
  const span  = (along==='p') ? r.w : r.h;
  function put(f, sc, fn){
    const bx = (along==='p') ? ax + span*f : ax;
    const by = (along==='q') ? ay + span*f : ay;
    const oo = proj(bx, by);
    ctx.save(); ctx.translate(oo.x, oo.y); ctx.scale(grow*sc, grow*sc);
    fn(ctx, col, T);
    ctx.restore();
  }
  if(t.landmark){
    put(0, 1.05, dvLandmark);
  } else if(t.lv > 0){
    const list = [];
    if(t.lv >= 1) list.push(dvVilla);
    if(t.lv >= 2) list.push(dvTowerB);
    if(t.lv >= 3) list.push(dvHotel);
    const n = list.length;
    list.forEach(function(fn, k){
      put(((k+1)/(n+1) - 0.5) * 0.70, 0.78, fn);
    });
  } else {
    // 更地：所有を示す小さな旗
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(grow, grow);
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-26); ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath();
    ctx.moveTo(0,-26); ctx.lineTo(20,-21); ctx.lineTo(0,-15); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

/* コマ */
const PCOL = ['#E14A5A','#3E8FE0','#54C06A','#E0A73C'];
function drawToken(ctx, G, pi, T){
  const p = G.players[pi]; if(p.out) return;
  const pos = p.render || tileCenter(p.pos);
  const hop = p.hopY||0, sq = p.squash||1;
  const x = pos.x + (p.offx||0), y = pos.y + (p.offy||0) - hop;
  ctx.save(); ctx.translate(x, y);
  // 手番リング（誰の番かを絵で分かるようにする。本家の足元の光る輪）
  if(G.turn===pi && !G.over){
    const pu = 0.55 + 0.45*Math.sin(T*0.005);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0,3,2,0,3,42);
    g.addColorStop(0,'rgba(255,236,150,'+(0.5*pu).toFixed(3)+')');
    g.addColorStop(.6,'rgba(255,212,77,'+(0.22*pu).toFixed(3)+')');
    g.addColorStop(1,'rgba(255,212,77,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.ellipse(0,3,42,19,0,0,6.283); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.lineWidth=5;
    ctx.strokeStyle='rgba(255,240,170,'+(0.65+0.3*pu).toFixed(3)+')';
    ctx.beginPath(); ctx.ellipse(0,3,30,13,0,0,6.283); ctx.stroke();
    ctx.lineWidth=2;
    ctx.strokeStyle='rgba(255,255,255,.9)';
    const a0 = (T*0.0022)%6.283;
    ctx.beginPath(); ctx.ellipse(0,3,30,13,0,a0,a0+2.1); ctx.stroke();
    ctx.restore();
  }
  ctx.save(); ctx.scale(1/sq, sq);
  dvChar(ctx, p.ch, PCOL[pi], T + pi*700, p.face||1);
  ctx.restore();
  // 名前ラベル
  ctx.save();
  ctx.translate(0,-78);
  ctx.font='900 13px "Noto Sans JP", sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const w = ctx.measureText(p.name).width + 14;
  ctx.fillStyle='rgba(8,16,28,.78)';
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w/2,-10,w,20,7); ctx.fill(); }
  else ctx.fillRect(-w/2,-10,w,20);
  ctx.strokeStyle=PCOL[pi]; ctx.lineWidth=2;
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w/2,-10,w,20,7); ctx.stroke(); }
  ctx.fillStyle='#fff'; ctx.fillText(p.name,0,1);
  ctx.restore();
  ctx.restore();
}

/* 盤外の札束（資産の可視化） */
const STACK_POS = [
  {p:-150, q:S*0.30}, {p:S+150, q:S*0.70}, {p:S*0.30, q:-150}, {p:S*0.70, q:S+150}
];
function drawStacks(ctx, G, T){
  G.players.forEach((p,i)=>{
    if(p.out) return;
    const n = Math.max(0, Math.min(12, Math.round(p.cash/2500000)));
    if(n<=0) return;
    const s = STACK_POS[i], o = proj(s.p, s.q);
    ctx.save(); ctx.translate(o.x, o.y);
    billStack(ctx, n, PCOL[i], T);
    ctx.restore();
  });
}
/* 札束の山：アイソメの天面ひし形＋紙幣の縞＋所有者色の帯 */
function billStack(ctx, n, col, T){
  const BW = 34, BH = 34*KSQ, TH = 9;        // 1束の天面半幅・半高・厚み
  const cols = 3, per = Math.ceil(n/ (cols)) ;
  ctx.save();
  // 落ち影
  ctx.fillStyle='rgba(0,0,0,.34)';
  ctx.beginPath(); ctx.ellipse(0, 4, BW*2.0, BH*2.0, 0,0,6.283); ctx.fill();
  const put = (gx, gy, lvl)=>{
    const px = (gx-gy)*BW*0.92, py = (gx+gy)*BH*0.92 - lvl*TH;
    // 側面
    ctx.beginPath();
    ctx.moveTo(px-BW, py); ctx.lineTo(px, py+BH); ctx.lineTo(px, py+BH+TH); ctx.lineTo(px-BW, py+TH);
    ctx.closePath(); ctx.fillStyle='#B9BFC9'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px+BW, py); ctx.lineTo(px, py+BH); ctx.lineTo(px, py+BH+TH); ctx.lineTo(px+BW, py+TH);
    ctx.closePath(); ctx.fillStyle='#8F97A4'; ctx.fill();
    // 紙幣の縞（側面）
    ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1;
    for(let k=1;k<TH;k+=3){
      ctx.beginPath(); ctx.moveTo(px-BW, py+k); ctx.lineTo(px, py+BH+k); ctx.lineTo(px+BW, py+k);
      ctx.stroke();
    }
    // 天面
    ctx.beginPath();
    ctx.moveTo(px, py-BH); ctx.lineTo(px+BW, py); ctx.lineTo(px, py+BH); ctx.lineTo(px-BW, py);
    ctx.closePath();
    const g = ctx.createLinearGradient(px-BW, py-BH, px+BW, py+BH);
    g.addColorStop(0,'#FFFDF4'); g.addColorStop(1,'#DCE0E8');
    ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.28)'; ctx.lineWidth=1.2; ctx.stroke();
    // 所有者色の帯（束を留めるバンド）
    ctx.save(); ctx.beginPath();
    ctx.moveTo(px, py-BH); ctx.lineTo(px+BW, py); ctx.lineTo(px, py+BH); ctx.lineTo(px-BW, py);
    ctx.closePath(); ctx.clip();
    ctx.fillStyle=col;
    ctx.beginPath();
    ctx.moveTo(px-BW*0.30, py-BH*0.30); ctx.lineTo(px+BW*0.70, py+BH*0.70);
    ctx.lineTo(px+BW*0.42, py+BH*1.2); ctx.lineTo(px-BW*0.58, py+BH*0.2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // 金のきらめき
    ctx.fillStyle='rgba(255,232,150,.85)';
    ctx.beginPath(); ctx.arc(px+BW*0.35, py-BH*0.1, 1.7, 0, 6.283); ctx.fill();
  };
  let left = n;
  for(let lvl=0; lvl<4 && left>0; lvl++){
    for(let gy=0; gy<2 && left>0; gy++){
      for(let gx=0; gx<2 && left>0; gx++){ put(gx, gy, lvl); left--; }
    }
  }
  ctx.restore();
}

/* 盤上の一時マーカー */
let stepPreview = null;
function drawSteps(ctx, G){
  if(!stepPreview) return;
  for(let d=1; d<=stepPreview.max; d++){
    const i=(stepPreview.from+d)%32, r=RECTS[i];
    let ax=r.p+r.w/2, ay=r.q+r.h/2;
    if(r.side===0) ay=r.q+r.h+26; if(r.side===2) ay=r.q-26;
    if(r.side===1) ax=r.p-26;      if(r.side===3) ax=r.p+r.w+26;
    const o=proj(ax,ay);
    goldBadge(ctx, o.x, o.y, String(d), 14);
  }
}
let destPin = null;
function drawDestPin(ctx, T){
  if(destPin===null) return;
  const c = tileCenter(destPin);
  ctx.save(); ctx.translate(c.x, c.y-6); dvPin(ctx, '#7DE08A', T); ctx.restore();
}

/* サイコロ：dvThrow が計算した「溜め→放り投げ→転がり→2回バウンド→静止」を描く */
let diceAnim = null;
const DICE_X = BCX, DICE_Y = BCY + 34;
function drawDice(ctx, T){
  if(!diceAnim || !diceAnim.th) return;
  const th = diceAnim.th;
  const st = th.at(Math.max(0, Math.min(diceAnim.t, th.dur)));
  if(!st || !st.d) return;
  // 影（高いほど小さく薄く）
  st.d.forEach(d=>{
    const k = Math.max(0.12, 1 - (d.z||0)/260);
    ctx.save();
    ctx.globalAlpha = 0.34*k;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(DICE_X + d.x, DICE_Y + d.y, 30*k, 14*k, 0, 0, 6.283);
    ctx.fill();
    ctx.restore();
  });
  // 粉じん
  if(st.dust > 0.03){
    st.d.forEach((d,i)=>{
      ctx.save(); ctx.globalAlpha = 0.30*st.dust;
      ctx.fillStyle = '#DCEAF6';
      for(let k=0;k<7;k++){
        const a = k/7*6.283 + i*1.1;
        const r = 16 + st.dust*38;
        ctx.beginPath();
        ctx.ellipse(DICE_X+d.x+Math.cos(a)*r, DICE_Y+d.y+Math.sin(a)*r*0.42,
                    4+st.dust*5, 2.4+st.dust*3, 0, 0, 6.283);
        ctx.fill();
      }
      ctx.restore();
    });
  }
  // 本体（回転が速いときは残像を重ねる）
  st.d.forEach(d=>{
    ctx.save();
    ctx.translate(DICE_X + d.x, DICE_Y + d.y - (d.z||0));
    ctx.rotate(d.rot || 0);
    const sc = d.scale || 1;
    ctx.scale(sc, sc);
    const bl = d.blur || 0;
    if(bl > 0.06){
      ctx.save(); ctx.globalAlpha = 0.26*bl; ctx.rotate(-0.30*bl);
      dvDie(ctx, ((d.face)%6)+1, d.spin||0, 56); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.14*bl; ctx.rotate(0.26*bl);
      dvDie(ctx, ((d.face+2)%6)+1, d.spin||0, 56); ctx.restore();
    }
    dvDie(ctx, d.face, d.spin||0, 56);
    ctx.restore();
  });
  // 着地の閃光
  if(st.flash > 0.02){
    st.d.forEach(d=>{
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = st.flash;
      const R = 30 + st.flash*90;
      const g = ctx.createRadialGradient(DICE_X+d.x, DICE_Y+d.y, 2, DICE_X+d.x, DICE_Y+d.y, R);
      g.addColorStop(0,'rgba(255,255,255,.95)');
      g.addColorStop(.45,'rgba(190,235,255,.45)');
      g.addColorStop(1,'rgba(190,235,255,0)');
      ctx.fillStyle = g;
      ctx.save(); ctx.translate(DICE_X+d.x, DICE_Y+d.y); ctx.scale(1,.5);
      ctx.beginPath(); ctx.arc(0,0,R,0,6.283); ctx.fill(); ctx.restore();
      ctx.restore();
    });
  }
}

/* エフェクト管理 */
const fxList = [];
function addFx(kind, x, y, dur, col, txt, big){
  fxList.push({kind, x, y, t:0, dur, col, txt, big});
}
function drawFx(ctx, dt){
  for(let i=fxList.length-1;i>=0;i--){
    const f = fxList[i]; f.t += dt;
    const k = f.t/f.dur;
    if(k>=1){ fxList.splice(i,1); continue; }
    if(f.kind==='land')   dvFxLand(ctx, f.x, f.y, k);
    else if(f.kind==='pillar') dvFxPillar(ctx, f.x, f.y, k, f.col);
    else if(f.kind==='ring')   dvFxRing(ctx, f.x, f.y, k, f.col);
    else if(f.kind==='spark')  dvFxSpark(ctx, f.x, f.y, k, f.col);
    else if(f.kind==='steam')  dvFxSteam(ctx, f.x, f.y, k);
    else if(f.kind==='num')    dvFxNumber(ctx, f.x, f.y, k, f.txt, f.col, f.big);
  }
}
function addFloat(x,y,txt,col,big){ addFx('num', x, y, 1500, col, txt, big); }
