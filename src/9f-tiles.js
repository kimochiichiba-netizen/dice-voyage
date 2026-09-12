
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 盤のマスとお金のルール（9f-tiles.js / WP11・v10）
   ──────────────────────────────────────────────────────────────
   ・並び（本家ワールドと同じ位置・名前は当作）・値段表・観光地・建設（1周するまでビルまで）・
     ランドマーク・フォーチュンカード21種・ボーナスゲーム・売却・独占・チーム戦の味方の扱い。
   ・宣言する関数（所有表 v10 の WP11）：buildTiles tollOf monoOf checkWin buildHTML buyUI deedCard
     maybeBuyout parchHTML aiBuy chanceCard miniGame miniHTML dkPayFrom maxLvOf lvLockNote sellValue
     raiseCash aiBuyout cityValue。内部の関数は dkr*、変数は DKR_*。
   ・中身を書き換える（C28）：MAPS・CITY_SLOTS・SPECIAL・GBASE・GCOL・BUILD（最後の起動 IIFE）。
   ・tile.bm（C34）＝建物のビット（1マンション・2ビル・4ホテル）、lv＝最上段、ランドマークは bm===7。
     前の版のコードが lv だけを書き換えた時は dkrBmSync が bm を合わせる（tollOf・cityValue・checkWin で）。
   ・代入ラッパ：drawTile（マスの厚み・観光地・CARD の札）・drawBuilding（観光地の記念碑）・
     nextTurn（砂嵐・伝染病の残りラウンドを減らす）。
   ・見た目の乱数は DKFX.rnd() か決まった擬似乱数。Math.random は対戦の乱数だけ。
   ══════════════════════════════════════════════════════════════ */

/* ══════════ 盤の並び（J10：本家ワールドと同じ位置） ══════════ */
var DKR_SLOTS = [[1, 3], [5, 6, 7], [10, 11], [13, 15], [17, 19], [21, 22, 23], [26, 27], [29, 31]];
var DKR_SPECIAL = { 2:'bonus', 12:'card', 20:'card', 28:'card', 30:'tax' };
var DKR_GCOL = ['#79CDBD', '#6DA83F', '#6BB2D2', '#5E8FD0', '#EFAAA0', '#8F6BC8', '#D2913A', '#C0564B'];
var DKR_TOURS = [ { i:4, kind:'sky', g:1 }, { i:9, kind:'pink', g:2 }, { i:14, kind:'sky', g:3 },
                  { i:18, kind:'sky', g:4 }, { i:25, kind:'pink', g:6 } ];
var DKR_SKY_I = [4, 14, 18];
/* 値段表（J08・200万基準・万円）：c＝建設費［土地権利書,マンション,ビル,ホテル,ランドマーク］、t＝通行料の上乗せ。
   実額は ×(開始額÷200)。ランドマーク＝ホテルと同額。本家の3マップは同じ金額なので当作の3マップも同じ表 */
var DKR_PRICE = {
  1:{ c:[2, 1, 3, 5, 5],          t:[0.2, 0.6, 2, 5, 25.6] },
  3:{ c:[2.6, 1, 3, 5, 5],        t:[0.2, 0.8, 2.2, 6, 25] },
  5:{ c:[4.8, 2, 6, 10, 10],      t:[0.6, 1.8, 4.6, 12, 45] },
  6:{ c:[4.8, 2, 6, 10, 10],      t:[0.6, 1.8, 4.6, 12, 45] },
  7:{ c:[5.4, 2, 6, 10, 10],      t:[0.8, 2, 4.8, 12.4, 45] },
  10:{ c:[7.2, 3, 9, 15, 15],     t:[1.4, 3.2, 8.4, 22, 60] },
  11:{ c:[7.2, 3, 9, 15, 15],     t:[1.4, 3.2, 8.4, 22, 60] },
  13:{ c:[9.4, 4, 12, 20, 20],    t:[2, 4.6, 11.4, 27, 70] },
  15:{ c:[10, 4, 12, 20, 20],     t:[2.4, 4.8, 11.8, 28, 70] },
  17:{ c:[11.8, 5, 15, 25, 25],   t:[3.2, 7, 16.8, 38, 75] },
  19:{ c:[12.4, 5, 15, 25, 25],   t:[3.4, 7.4, 17.2, 39, 75] },
  21:{ c:[14, 6, 18, 30, 30],     t:[4.4, 8.6, 20, 46, 75] },
  22:{ c:[14.6, 6, 18, 30, 30],   t:[4.8, 9.2, 22, 47, 75] },
  23:{ c:[14.6, 6, 18, 30, 30],   t:[4.8, 9.2, 22, 47, 75] },
  26:{ c:[16.4, 7, 21, 35, 35],   t:[5.6, 12.4, 28, 60, 70] },
  27:{ c:[17, 7, 21, 35, 35],     t:[6, 13, 29, 62, 70] },
  29:{ c:[19.2, 8, 24, 40, 40],   t:[7.2, 14.8, 32, 68, 60] },
  31:{ c:[20, 8, 24, 40, 40],     t:[8, 16, 34, 70, 60] }
};
/* マップごとの名前（当作。本家の都市名の並びは写さない） */
var DKR_MAPDATA = {
  ice:   { corners:['スタート', '氷の監獄', '水晶の遺跡', '洞窟探検'],
           cities:[['氷結の泉', '霜の小屋'], ['凍り村', '雪見の丘', '氷柱回廊'], ['白銀通り', '銀嶺市場'], ['蒼氷広場', '凍湖港'],
                   ['水晶坑道', '極光台'], ['氷紋宮', '氷刃城塞', '蒼玉神殿'], ['極夜宮殿', '白帝の塔'], ['氷王の玉座', '原初の氷核']],
           tours:{ 4:'氷晶の滝', 9:'オーロラ丘', 14:'雪うさぎ村', 18:'天空氷城', 25:'永久氷河' } },
  world: { corners:[null, '無人島', 'ワールドフェスティバル', null],
           cities:[['バリ', 'セブ'], ['シンガポール', '香港', 'ドバイ'], ['台北', 'イスタンブール'], ['ソウル', 'カイロ'],
                   ['リオ', 'ケープタウン'], ['バンクーバー', 'シドニー', 'ロサンゼルス'], ['バルセロナ', 'ベルリン'], ['ロンドン', 'ニューヨーク']],
           tours:{ 4:'珊瑚の海', 9:'さくら並木', 14:'氷河クルーズ', 18:'オーロラの谷', 25:'バラの宮殿' } },
  oita:  { corners:null,
           cities:[['佐賀関', '佐伯'], ['蒲江', '臼杵', '津久見'], ['豊後大野', '竹田'], ['日田', '玖珠'],
                   ['国東', '杵築'], ['日出', '中津', '宇佐'], ['大分駅前', '大分港'], ['由布院', '別府温泉']],
           tours:{ 4:'九重の星空', 9:'湯けむり丘', 14:'姫島の浜', 18:'高崎山', 25:'鉄輪地獄めぐり' } }
};
var DKR_SKY = '#8FD8F8', DKR_PINK = '#F6A9C9';
var DKR_BSCALE = 1.38;            /* 建物の拡大率（本家は建物がマスから大きくはみ出す） */
var DKR_BYBASE = {};              /* 土地の値段 → 位置（BUILD[k].cost(t.base) の互換用。同じ値段の位置は表も同じ） */
var DKR_o = {};                   /* 包む前の関数 */

/* ══════════ 値段（C01・J08） ══════════ */
function dkrUnit(){ return ((typeof cfg === 'object' && cfg && cfg.cash > 0) ? cfg.cash : 10000000) / 200; }
function dkrRate(key, frac){ var v = 0; try{ v = dkRate(key); }catch(e){} return v > 0 ? v : Math.round((cfg.cash || 10000000) * frac); }
function dkrRowOf(t){ return (t && DKR_PRICE[t.idx]) || null; }
/* base だけが分かる時（7-online.js などが BUILD[k].cost(t.base) で呼ぶ）の表 */
function dkrRowByBase(b){
  var i = DKR_BYBASE[b];
  if(i !== undefined && DKR_PRICE[i]) return DKR_PRICE[i];
  var man = b / dkrUnit(), best = null, bd = 1e9;
  for(var k in DKR_PRICE){ var d = Math.abs(DKR_PRICE[k].c[0] - man); if(d < bd){ bd = d; best = DKR_PRICE[k]; } }
  return best;
}
/* 段 k の定価（その都市の土地の値段からの比＝開始額に比例） */
function dkrPrice(t, k){
  if(!t) return 0;
  if(t.tour) return k === 0 ? t.base : 0;
  var r = dkrRowOf(t) || dkrRowByBase(t.base);
  if(!r) return k === 0 ? t.base : 0;
  return Math.round(r.c[k] * t.base / r.c[0]);
}
function dkrTollAdd(t, k){
  var r = dkrRowOf(t) || dkrRowByBase(t.base);
  return r ? Math.round(r.t[k] * t.base / r.c[0]) : 0;
}

/* ══════════ 建物のビット（C34） ══════════ */
function dkrTop(bm){ return (bm & 4) ? 3 : (bm & 2) ? 2 : (bm & 1) ? 1 : 0; }
function dkrBits(bm){ return (bm & 1) + ((bm >> 1) & 1) + ((bm >> 2) & 1); }
/* lv だけ書き換える前の版のコード（スタートの建設・オンラインの建設・破産）に bm を合わせる */
function dkrBmSync(t){
  if(!t || t.type !== 'city') return;
  var bm = t.bm | 0, lv = Math.max(0, Math.min(3, t.lv | 0)), top;
  if(t.tour){ if(t.bm !== 0 || t.lv !== 0){ t.bm = 0; t.lv = 0; } return; }
  if(t.landmark){ if(t.bm !== 7 || t.lv !== 3){ t.bm = 7; t.lv = 3; } return; }
  top = dkrTop(bm);
  if(top === lv && t.bm === bm && t.lv === lv) return;
  if(lv <= 0) bm = 0;
  else if(lv === top + 1) bm |= 1 << (lv - 1);
  else if(lv > top) bm |= (1 << lv) - 1;
  else if(lv < top) bm = (bm & ((1 << lv) - 1)) | (1 << (lv - 1));
  t.bm = bm; t.lv = dkrTop(bm);
}
function dkrSetBm(t, bm){ t.bm = bm & 7; t.lv = dkrTop(t.bm); if(t.bm !== 7) t.landmark = false; }

/* ══════════ 観光地（J11） ══════════ */
function dkrTourName(map, i, kind){
  var d = map && DKR_MAPDATA[map.id], nm = d && d.tours && d.tours[i];
  return nm || (kind === 'pink' ? '桃色の名所' : '空色の名所');
}
function dkrTours(G){
  var out = [];
  if(!G || !G.tiles) return out;
  for(var i = 0; i < G.tiles.length; i++){ var t = G.tiles[i]; if(t && t.tour) out.push(i); }
  return out;
}
/* 同じ持ち主の水色の数（位置は決まっているので3マスだけ見る） */
function dkrSkyCount(G2, owner){
  if(!G2 || !G2.tiles || !(owner >= 0)) return 0;
  var n = 0;
  for(var k = 0; k < DKR_SKY_I.length; k++){ var t = G2.tiles[DKR_SKY_I[k]]; if(t && t.tour === 'sky' && t.owner === owner) n++; }
  return n;
}
/* 倍率：水色＝持ち数 1/2/3 で ×1/×2/×4、ピンク＝止まられた回数 0/1/2〜 で ×1/×2/×4 */
function dkrTourMul(tile, G2){
  if(!tile || !tile.tour) return 1;
  if(tile.tour === 'pink') return [1, 2, 4][Math.min(2, Math.max(0, tile.visits | 0))];
  var n = Math.max(1, dkrSkyCount(G2, tile.owner));
  return n >= 3 ? 4 : n;
}

/* ══════════ マスを作る ══════════ */
function dkrCityTile(name, g, base, idx){
  return { type:'city', name:name, g:g, base:base, idx:idx, owner:-1, lv:0, bm:0, landmark:false,
           x2:false, frozen:0, grow:1, bind:0, olym:1, sand:0, plague:0 };
}
function buildTiles(map){
  var U = dkrUnit(), t = new Array(32).fill(null);
  t[0]  = { type:'start',   name:map.corners[0] };
  t[8]  = { type:'jail',    name:map.corners[1] };
  t[16] = { type:'olympic', name:map.corners[2] };
  t[24] = { type:'travel',  name:map.corners[3] };
  for(var k in SPECIAL){
    var i = +k, v = SPECIAL[k];
    if(v === 'card')  t[i] = { type:'card',  name:'フォーチュンカード' };
    if(v === 'tax')   t[i] = { type:'tax',   name:'国税庁', rate:0.10 };
    if(v === 'bonus') t[i] = { type:'bonus', name:'ボーナスゲーム' };
  }
  DKR_BYBASE = {};
  CITY_SLOTS.forEach(function(sl, g){
    sl.forEach(function(idx, j){
      var r = DKR_PRICE[idx];
      var base = r ? Math.round(r.c[0] * U) : Math.round((GBASE[g] || 100000) * (1 + j * 0.13));
      if(DKR_BYBASE[base] === undefined) DKR_BYBASE[base] = idx;
      var nm = (map.cities && map.cities[g] && map.cities[g][j]) || ('都市' + idx);
      t[idx] = dkrCityTile(nm, g, base, idx);
    });
  });
  var land = dkrRate('tourLand', 0.05);
  DKR_TOURS.forEach(function(s){
    var o = dkrCityTile(dkrTourName(map, s.i, s.kind), s.g, land, s.i);
    o.tour = s.kind; o.visits = 0;
    t[s.i] = o;
  });
  /* 祭り都市（本家の「お祭り FESTIVAL」×2）：毎試合ランダムで3都市。観光地はならない */
  var cities = [];
  for(var c = 0; c < 32; c++) if(t[c] && t[c].type === 'city' && !t[c].tour) cities.push(c);
  for(var n = 0; n < 3 && cities.length; n++){
    t[cities.splice((Math.random() * cities.length) | 0, 1)[0]].x2 = true;
  }
  for(var z = 0; z < 32; z++) if(!t[z]) t[z] = { type:'card', name:'フォーチュンカード' };
  /* C09：マップの仕掛け（WP12 の 9k）。無い間は仮の部品がそのまま返す */
  if(typeof dkMapTiles === 'function'){
    try{ var t2 = dkMapTiles(t, map); if(Array.isArray(t2) && t2.length === 32) t = t2; }catch(e){ console.error('[WP11]', e); }
  }
  return t;
}

/* ══════════ 通行料（J08・J11） ══════════ */
function tollOf(tile, G){
  if(!tile || tile.type !== 'city' || tile.owner < 0) return 0;
  if(tile.frozen > 0) return 0;
  dkrBmSync(tile);
  var v, m = 1, ow;
  if(tile.tour){
    v = dkrRate('tourToll', 0.04);
    m = dkrTourMul(tile, G);
  } else {
    var bm = tile.bm | 0;
    v = dkrTollAdd(tile, 0);
    if(bm & 1) v += dkrTollAdd(tile, 1);
    if(bm & 2) v += dkrTollAdd(tile, 2);
    if(bm & 4) v += dkrTollAdd(tile, 3);
    if(tile.landmark) v += dkrTollAdd(tile, 4);
    if(tile.x2) m *= 2;                                 /* 祭り都市 */
    if(tile.olym > 1) m *= tile.olym;                   /* フェスティバル開催（最大5倍） */
    if(G && G.tiles){
      var idx = (typeof tile.idx === 'number' && G.tiles[tile.idx] === tile) ? tile.idx : G.tiles.indexOf(tile);
      if(hasTriple(G, tile.owner, tile.g)) m *= 2 * ((G.ev && G.ev.monoX) || 1);   /* カラー独占 */
      if(idx >= 0 && hasLine(G, tile.owner, Math.floor(idx / 8))) m *= 2;
    }
  }
  if(G){
    if(G.ev && G.ev.tollX) m *= G.ev.tollX;             /* 週替わり「通行料値上げ」 */
    if(G.infl && G.infl > 1) m *= G.infl;               /* 短縮ルールの終盤インフレ */
    ow = G.players && G.players[tile.owner];
    if(ow && ow.tollUp > 0) m *= 1.6;                   /* 能力「地価高騰」 */
  }
  if(tile.sand > 0) m *= 0.5;                           /* 砂嵐 */
  if(tile.plague > 0) m *= 0.5;                         /* 伝染病 */
  if(G && typeof dkMapToll === 'function'){
    try{ var mt = +dkMapToll(tile, G); if(mt > 0 && isFinite(mt)) m *= mt; }catch(e){ console.error('[WP11]', e); }
  }
  return Math.round(v * m);
}
/* 都市の価値（土地＋建てた建物の建設費用。国税庁・買収・総資産の元） */
function cityValue(t){
  if(!t || t.type !== 'city') return 0;
  dkrBmSync(t);
  if(t.tour) return t.base;
  var v = t.base, bm = t.bm | 0;
  if(bm & 1) v += dkrPrice(t, 1);
  if(bm & 2) v += dkrPrice(t, 2);
  if(bm & 4) v += dkrPrice(t, 3);
  if(t.landmark) v += dkrPrice(t, 4);
  return v;
}
/* 売値＝価値の半額（J52。強制売却の「半額で売却」と同じ） */
function sellValue(t){ return Math.round(cityValue(t) * 0.5); }
/* 建てられる最上段：1周する（最初の給料をもらう）まではビルまで、ホテルは1周してから（J07） */
function maxLvOf(p){ return (p && (p.laps | 0) >= 1) ? 3 : 2; }
function lvLockNote(p){ return maxLvOf(p) >= 3 ? '' : '1周すると建設可能'; }

/* ══════════ 独占 ══════════ */
/* 成立している独占をひとつ返す（無ければ null）。同時に成立したら倍率の高いほう。味方の都市も合わせる */
function monoOf(G, pi){
  var tours = dkrTours(G);
  if(tours.length && tours.every(function(i){ var o = G.tiles[i].owner; return o >= 0 && dkAlly(pi, o); }))
    return { kind:'tour', label:'観光地独占', col:'#7FE6FF', key:'m', x:5 };
  for(var s = 0; s < 4; s++) if(hasLine(G, pi, s))
    return { kind:'line', label:'ライン独占', col:'#FFD24D', key:'l' + s, x:3 };
  if(colorMono(G, pi) >= 3)
    return { kind:'triple', label:'トリプル独占', col:'#FFD24D', key:'t', x:2 };
  return null;
}
/* あと1マスで独占：そのマスを取れるか（空き地、または相手の都市で買収できる） */
function dkrTakeable(i, pi){
  var t = G.tiles[i];
  if(!t || t.type !== 'city') return false;
  if(t.owner < 0) return true;
  if(dkAlly(pi, t.owner)) return false;
  return !t.tour && !t.landmark;
}
function dkrMineT(i, pi){ var t = G.tiles[i]; return !!t && t.owner >= 0 && dkAlly(pi, t.owner); }
/* いまのリーチを全部 [{pi, kind, label, tiles:[i]}] で返す（チーム戦は同じチームで1つ） */
function dkrReachList(){
  var list = [], seen = {};
  if(!G || !G.players) return list;
  var tours = dkrTours(G);
  var add = function(pi, kind, label, tiles){
    var key = dkTeamOf(pi) + ':' + kind + ':' + tiles.join(',');
    if(seen[key]) return;
    seen[key] = 1;
    list.push({ pi:pi, kind:kind, label:label, tiles:tiles });
  };
  for(var pi = 0; pi < G.players.length; pi++){
    if(G.players[pi].out) continue;
    if(monoOf(G, pi)) continue;                      /* もう独占している人はリーチではない */
    if(colorMono(G, pi) === 2){
      var tt = [];
      for(var g = 0; g < CITY_SLOTS.length; g++){
        if(hasTriple(G, pi, g)) continue;
        var miss = CITY_SLOTS[g].filter(function(i){ return !dkrMineT(i, pi); });
        if(miss.length === 1 && dkrTakeable(miss[0], pi)) tt.push(miss[0]);
      }
      if(tt.length) add(pi, 'triple', 'トリプル独占', tt);
    }
    for(var s = 0; s < 4; s++){
      var idx = [];
      for(var k = 1; k < 8; k++){ var i2 = s * 8 + k; if(G.tiles[i2].type === 'city') idx.push(i2); }
      var mine = idx.filter(function(i){ return dkrMineT(i, pi); });
      var rest = idx.filter(function(i){ return !dkrMineT(i, pi); });
      if(idx.length > 1 && mine.length >= 2 && rest.length === 1 && dkrTakeable(rest[0], pi)) add(pi, 'line', 'ライン独占', [rest[0]]);
    }
    if(tours.length >= 2){
      var tm = tours.filter(function(i){ return !dkrMineT(i, pi); });
      if(tm.length === 1 && G.tiles[tm[0]].owner < 0) add(pi, 'tour', '観光地独占', [tm[0]]);
    }
  }
  return list;
}
/* リーチを表示の係（dkShowReach）へ渡す。新しく出たリーチの時だけ boss の曲とニュース */
function dkrReachUpdate(){
  var list = dkrReachList();
  var prev = G.dkrReach || {}, now = {}, fresh = [];
  list.forEach(function(r){
    var key = r.pi + ':' + r.kind + ':' + r.tiles.join(',');
    now[key] = 1;
    if(!prev[key]) fresh.push(r);
  });
  G.dkrReach = now;
  try{ dkShowReach(list); }catch(e){ console.error('[WP11]', e); }
  if(fresh.length){
    try{ SFX.warn(); }catch(e){}
    try{ bgm('boss'); }catch(e){}
    fresh.forEach(function(r){
      var ts = r.tiles.map(function(i){ return G.tiles[i].name; }).join('・');
      try{ news('🚨 ' + G.players[r.pi].name + ' の' + r.label + '残り都市 ' + ts); }catch(e){}
    });
  }
  return list;
}
/* カラー独占が成立した瞬間に1回だけ知らせる（C12・J50）。崩れたら、また成立した時に知らせる */
function dkrColorMonoCheck(){
  var seen = G.dkrMono || {}, now = {};
  for(var pi = 0; pi < G.players.length; pi++){
    if(G.players[pi].out) continue;
    for(var g = 0; g < CITY_SLOTS.length; g++){
      if(!hasTriple(G, pi, g)) continue;
      var key = dkTeamOf(pi) + ':' + g;
      if(now[key]) continue;
      now[key] = 1;
      if(!seen[key]){ try{ dkColorMono(pi, g); }catch(e){ console.error('[WP11]', e); } }
    }
  }
  G.dkrMono = now;
}

/* ══════════ 勝敗（J51：開始直後の例外は無い） ══════════ */
function checkWin(){
  if(!G || G.over) return false;
  G.tiles.forEach(dkrBmSync);
  var alive = G.players.filter(function(p){ return !p.out; });
  if(alive.length === 1) return finish(G.players.indexOf(alive[0]), '独り勝ち');
  dkrColorMonoCheck();
  for(var pi = 0; pi < G.players.length; pi++){
    if(G.players[pi].out) continue;
    var m = monoOf(G, pi);
    if(m){ G.winX = m.x; G.winKind = m.kind; return finish(pi, m.label, m.col); }
  }
  dkrReachUpdate();
  return false;
}

/* ══════════ 建設ポップアップ（J03：本家 s10/r4c0・v6 t0028 の形） ══════════ */
var DKR_STEP_NM = ['土地権利書', 'マンション', 'ビル', 'ホテル', 'ランドマーク'];

/* サイコロの能力（C05）。5（%）で来ても 0.05（割合）で来ても同じにする */
function dkrAb(pi, key){
  var a = null;
  try{ a = dkDieAb(pi); }catch(e){}
  var v = a ? (+a[key] || 0) : 0;
  if(v > 1) v = v / 100;
  return Math.max(0, Math.min(0.6, v));
}
/* 能力の発動（C04）：'build'・'buyout' はこの班が呼んで dkNotify で知らせる。発動したら費用を半額にする */
function dkrSkill(pi, when){
  var r = null;
  try{ r = dkSkillRoll(pi, when); }catch(e){ console.error('[WP11]', e); }
  if(!r || !r.fired) return null;
  var p = G.players[pi];
  try{ dkNotify(pi, '✨', r.label || ((p ? p.name : '') + 'のスペシャル能力'),
    when === 'buyout' ? '買収費用が半額になりました' : '建設費用が半額になりました', { ms:1800 }); }catch(e){}
  return r;
}
/* 建設費の倍率（能力値・建設割引券・週イベント・サイコロの能力・スキル） */
function dkrDisc(pi, skill){
  var p = G.players[pi];
  return statMul(p, 'build', 0.3) * (p.halfBuild > 0 ? 0.5 : 1) * ((G.ev && G.ev.buildX) || 1)
    * (1 - dkrAb(pi, 'build')) * (skill ? 0.5 : 1);
}
function dkrCost(t, k, disc){ return Math.round(dkrPrice(t, k) * disc); }
function dkrColOf(t){ return t.tour ? (t.tour === 'pink' ? DKR_PINK : DKR_SKY) : (GCOL[t.g] || '#79CDBD'); }
function dkrArtKeyOf(t){ if(t.tour) return 'tour-' + t.tour; if(t.landmark) return 'b4'; return 'b' + dkrTop(t.bm | 0); }
/* 自分の都市か、チーム戦の味方の都市（止まった人が建てて払う。持ち主は味方のまま） */
function dkrOwnSide(t, pi){ return !!t && t.owner >= 0 && dkAlly(pi, t.owner); }
/* 建てられる段の一覧。mode＝'city'｜'lm'（3建物がそろった後のランドマーク）｜'tour' */
function dkrSteps(i, pi, disc){
  var t = G.tiles[i], p = G.players[pi], side = dkrOwnSide(t, pi), mx = maxLvOf(p);
  if(typeof disc !== 'number') disc = dkrDisc(pi, false);
  dkrBmSync(t);
  var bm = t.bm | 0;
  var mk = function(k, have, can, lock){ return { k:k, have:have, can:can, lock:lock, cost:dkrCost(t, k, disc), full:dkrPrice(t, k) }; };
  if(t.tour) return { mode:'tour', steps:[ mk(0, side, !side, false) ] };
  if(side && bm === 7 && !t.landmark) return { mode:'lm', steps:[ mk(4, false, true, false) ] };
  var out = [ mk(0, side, !side, false) ];
  for(var k = 1; k <= 3; k++){
    var have = !!(bm & (1 << (k - 1)));
    out.push(mk(k, have, !have && k <= mx, !have && k > mx));
  }
  return { mode:'city', steps:out };
}
/* 最初から選んでおく段（本家は払える分に全部チェックが付いて出る）。土地権利書が買えない時は何も選ばない */
function dkrPresel(S, cash){
  var sum = 0, out = [];
  S.steps.forEach(function(s){
    if(s.have || !s.can || sum + s.cost > cash) return;
    sum += s.cost; out.push(s.k);
  });
  if(S.mode !== 'lm' && S.steps[0].can && out.indexOf(0) < 0) return [];
  return out;
}
function dkrStepCard(s, pre, pc, landNeed, cash){
  var poor = !s.have && s.can && (s.cost + (s.k === 0 ? 0 : landNeed) > cash);
  var must = s.k === 0 && !s.have;
  var c = 'bcard' + (s.have ? ' own' : '') + ((!s.can && !s.have) || poor ? ' dis' : '') + (poor ? ' dkr-nomoney' : '')
    + (s.lock ? ' dkr-locked' : '') + (pre.indexOf(s.k) >= 0 ? ' sel' : '') + (must ? ' dkr-must' : '');
  return '<div class="' + c + '" data-k="' + s.k + '" data-c="' + s.cost + '" data-dkr-full="' + s.full + '">'
    + '<div class="dkr-cap">' + DKR_STEP_NM[s.k] + '</div>'
    + '<div class="dkr-art"><canvas data-dkr-art="b' + s.k + '" data-dkr-col="' + pc + '" width="16" height="12"></canvas></div>'
    + (must ? '<em class="dkr-mustag">必須建設地</em>' : '')
    + '<div class="pr">' + (s.have ? '所有中' : yen(s.full)) + '</div>'
    + '<i class="dkr-chk" aria-hidden="true"></i>'
    + (s.lock ? '<div class="dkr-lock"><b>1</b><span>1周すると<br>建設可能</span></div>' : '')
    + '</div>';
}
/* 観光地：左に絵のカード、右に本家の「通行料」表（J11） */
function dkrTourBody(t, pi, S, pre, cash){
  var pink = t.tour === 'pink', toll = dkrRate('tourToll', 0.04), s = S.steps[0];
  var cur = pink ? Math.min(2, t.visits | 0) : Math.min(2, dkrSkyCount(G, pi));
  var labels = pink ? ['1回目の訪問', '2回目の訪問', '3回目以降'] : ['一カ所所有', '二カ所所有', '三カ所所有'];
  var poor = !s.have && s.can && s.cost > cash;
  var c = 'bcard dkr-tcard' + (s.have ? ' own' : '') + ((!s.can && !s.have) || poor ? ' dis' : '') + (pre.indexOf(0) >= 0 ? ' sel' : '');
  var rows = labels.map(function(l, n){
    return '<div class="dkr-ttr' + (n === cur ? ' dkr-now' : '') + '"><span>' + l + '</span><b>' + yen(toll * [1, 2, 4][n]) + '</b></div>';
  }).join('');
  return '<div class="dkr-tbody">'
    + '<div class="' + c + '" data-k="0" data-c="' + s.cost + '" data-dkr-full="' + s.full + '">'
    +   '<div class="dkr-cap">' + (pink ? 'ピンクの観光地' : '水色の観光地') + '</div>'
    +   '<div class="dkr-art"><canvas data-dkr-art="tour-' + t.tour + '" data-dkr-col="' + (PCOL[pi] || '#E14A5A') + '" width="16" height="12"></canvas></div>'
    +   '<div class="pr">' + (s.have ? '所有中' : yen(s.full)) + '</div><i class="dkr-chk" aria-hidden="true"></i>'
    + '</div>'
    + '<div class="dkr-ttab"><div class="dkr-tth">通行料</div>' + rows
    +   '<p>' + (pink ? '止まられるたびに上がります' : '同じ人が持つ水色の数で上がります') + '・買収されません</p></div>'
    + '</div>';
}
function buildHTML(i, pi, opt){
  opt = opt || {};
  var t = G.tiles[i], p = G.players[pi];
  var disc = (typeof opt.disc === 'number') ? opt.disc : dkrDisc(pi, false);
  var S = dkrSteps(i, pi, disc), pre = opt.presel ? dkrPresel(S, p.cash) : [];
  var land = S.steps[0], landNeed = (S.mode === 'city' && land.can) ? land.cost : 0;
  var col = dkrColOf(t), pc = PCOL[t.owner >= 0 ? t.owner : pi] || '#E14A5A';
  var ally = t.owner >= 0 && t.owner !== pi;
  var sub = S.mode === 'lm' ? 'ランドマーク' : S.mode === 'tour' ? '観光地' : (ally ? '味方の都市' : '');
  var cls = 'deed dkr-build dkr-m-' + S.mode + (S.mode === 'lm' ? ' dkr-lm' : '') + (t.tour ? ' dkr-tp dkr-' + t.tour : '');
  var h = '<div class="modal"><div class="' + cls + '" data-dkr-i="' + i + '" data-dkr-pi="' + pi + '" data-dkr-mode="' + S.mode + '">'
    + (S.mode === 'lm' ? '<div class="dkr-bubble">ランドマークにアップグレードしてください<small>(通行料値上げ/買収防御効果)</small></div>' : '')
    + '<div class="dhd"><span class="dkr-medal" style="--dkr-g:' + col + '"><i></i></span>'
    + '<div class="dkr-ttl"><b>' + esc(t.name) + '</b>' + (sub ? '<em>' + sub + '</em>' : '') + '</div>'
    + '<button class="dkr-x" data-act="no" aria-label="閉じる">✕</button></div>'
    + '<div class="dbd">';
  if(S.mode === 'tour') h += dkrTourBody(t, pi, S, pre, p.cash);
  else {
    h += '<div class="buildgrid dkr-n' + S.steps.length + '">';
    S.steps.forEach(function(s){ h += dkrStepCard(s, pre, pc, landNeed, p.cash); });
    h += '</div>';
  }
  var row = function(label, id, cls2){
    return '<div class="dkr-row' + (cls2 ? ' ' + cls2 : '') + '"><span>' + label + '</span><i aria-hidden="true"></i><b id="' + id + '">0</b></div>';
  };
  h += '<div class="sums">'
    + row('建設費用', 'dkrFull')
    + row('建設費用割引', 'dkrDisc', 'dkr-disc')
    + '<button class="dkr-buy" id="bOk" data-act="ok"><span class="dkr-bl">購入</span>'
    +   '<span class="dkr-bill" aria-hidden="true"></span><em id="bSum">0</em></button>'
    + (S.mode !== 'tour' ? row('通行料', 'dkrToll', 'dkr-toll') : '')
    + row('購入後の残りマーブル', 'dkrLeft', 'dkr-left')
    + '</div></div></div></div>';
  return h;
}
/* 選んだ段で建てたあとの通行料（タイルを一瞬だけ書き換えて tollOf に聞き、必ず戻す） */
function dkrTollAfter(i, pi, sel){
  var t = G.tiles[i], o = t.owner, l = t.lv, b = t.bm, m = t.landmark;
  try{
    if(sel.length){
      if(t.owner < 0) t.owner = pi;
      var bm = t.bm | 0;
      sel.forEach(function(k){ if(k >= 1 && k <= 3) bm |= 1 << (k - 1); });
      t.bm = bm; t.lv = dkrTop(bm);
      if(sel.indexOf(4) >= 0 && bm === 7) t.landmark = true;
    }
    return tollOf(t, G);
  } finally { t.owner = o; t.lv = l; t.bm = b; t.landmark = m; }
}
/* 表示の同期（buyUI からも、7-online.js の pickBuild のクリックからも呼ばれる） */
function dkrBuildSync(root){
  if(!root || !G) return;
  var panel = (root.classList && root.classList.contains('dkr-build')) ? root : (root.querySelector ? root.querySelector('.dkr-build') : null);
  if(!panel) return;
  var i = +panel.getAttribute('data-dkr-i'), pi = +panel.getAttribute('data-dkr-pi');
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p) return;
  var sel = [], full = 0, cost = 0;
  panel.querySelectorAll('.bcard.sel').forEach(function(c){
    sel.push(+c.getAttribute('data-k'));
    full += +c.getAttribute('data-dkr-full') || 0;
    cost += +c.getAttribute('data-c') || 0;
  });
  var put = function(id, v){ var e = panel.querySelector('#' + id); if(e && e.textContent !== v) e.textContent = v; };
  put('dkrFull', yen(full));
  put('dkrDisc', full - cost > 0 ? '-' + yen(full - cost) : '0');
  put('bSum', yen(cost));
  put('dkrToll', yen(sel.length ? dkrTollAfter(i, pi, sel) : tollOf(t, G)));
  put('dkrLeft', yen(p.cash - cost));
  var needLand = panel.getAttribute('data-dkr-mode') === 'city' && t.owner < 0 && sel.indexOf(0) < 0;
  var ok = panel.querySelector('#bOk');
  if(ok) ok.disabled = !sel.length || cost > p.cash || needLand;
  panel.classList.toggle('dkr-poor', cost > p.cash);
}
/* 押せないカードを押した時の小さな揺れ（位置は変えない） */
function dkrNudge(el){ try{ if(typeof fxShake === 'function') fxShake(el, 200); }catch(e){} }
/* 自前のモーダルを閉じる（modal と同じ 170ms の退場。閉じる間に別の中身が入ったらそれは閉じない） */
function dkrCloseModal(first){
  var wrap = document.getElementById('modalWrap'), body = document.getElementById('modalBody');
  if(!wrap || !body) return;
  var ms = ((window.DKFX && DKFX.reduced) ? 0 : 170) * ((typeof SPEED === 'number' && SPEED > 0) ? SPEED : 1);
  var fin = function(){
    wrap.classList.remove('fx-closing');
    if(body.firstElementChild === first) wrap.classList.remove('on');
  };
  if(ms < 1){ fin(); return; }
  wrap.classList.add('fx-closing');
  setTimeout(fin, ms);
}
function dkrOpenModal(html){
  var wrap = document.getElementById('modalWrap'), body = document.getElementById('modalBody');
  if(window.DKFX) DKFX.mseq = (DKFX.mseq | 0) + 1;
  body.innerHTML = html;
  wrap.classList.remove('fx-closing');
  wrap.classList.add('on');
  return body.firstElementChild;
}
/* 人間が選ぶ：選んだ段の配列（小さい順）か []（閉じた）。土地権利書は必須なので外せない */
function dkrPickBuild(pi, i, disc){
  return new Promise(function(res){
    var first = dkrOpenModal(buildHTML(i, pi, { presel:true, disc:disc }));
    var panel = first.querySelector('.dkr-build');
    var cards = Array.prototype.slice.call(panel.querySelectorAll('.bcard'));
    var cardOf = function(k){ for(var n = 0; n < cards.length; n++) if(+cards[n].getAttribute('data-k') === k) return cards[n]; return null; };
    var pickable = function(c){ return c && !c.classList.contains('own') && !c.classList.contains('dis'); };
    var done = false;
    cards.forEach(function(cd){
      var k = +cd.getAttribute('data-k');
      cd.onclick = function(){
        if(done) return;
        try{ SFX.click(); }catch(e){}
        if(!pickable(cd) || (k === 0 && cd.classList.contains('sel'))){ dkrNudge(cd); return; }
        cd.classList.toggle('sel');
        if(k > 0 && k < 4 && cd.classList.contains('sel')){ var c0 = cardOf(0); if(pickable(c0)) c0.classList.add('sel'); }
        dkrBuildSync(panel);
      };
    });
    dkrBuildSync(panel);
    var finish = function(v){ if(done) return; done = true; dkrCloseModal(first); res(v); };
    panel.querySelectorAll('[data-act]').forEach(function(b){
      b.onclick = function(){
        if(done || b.disabled) return;
        try{ SFX.click(); }catch(e){}
        if(b.getAttribute('data-act') === 'ok'){
          finish(cards.filter(function(c){ return c.classList.contains('sel'); })
                      .map(function(c){ return +c.getAttribute('data-k'); }).sort(function(a, b2){ return a - b2; }));
        } else finish([]);
      };
    });
  });
}
/* 選んだ段を実際に建てる（払う → ビットを立てる → 伸びる演出 → 勝敗）。払った額を返す */
async function dkrApplyBuild(pi, i, sel, disc){
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p || !sel || !sel.length || p.out || G.over) return 0;
  var side = dkrOwnSide(t, pi);
  if(t.owner >= 0 && !side) return 0;
  var S = dkrSteps(i, pi, disc), ok = {};
  S.steps.forEach(function(s){ if(s.can) ok[s.k] = s.cost; });
  sel = sel.filter(function(k, n){ return ok[k] !== undefined && sel.indexOf(k) === n; });
  if(!sel.length || (S.mode !== 'lm' && t.owner < 0 && sel.indexOf(0) < 0)) return 0;
  var spend = 0;
  sel.forEach(function(k){ spend += ok[k]; });
  if(spend > p.cash) return 0;
  if(p.halfBuild > 0) p.halfBuild--;
  give(pi, -spend);
  if(t.owner < 0) t.owner = pi;
  var lm = false;
  if(!t.tour){
    var bm = t.bm | 0;
    sel.forEach(function(k){ if(k >= 1 && k <= 3) bm |= 1 << (k - 1); if(k === 4 && (t.bm | 0) === 7) lm = true; });
    dkrSetBm(t, bm);
    if(lm) t.landmark = true;
  }
  boardChanged();
  var ga = growAnim(i);
  if(lm){ try{ raiseBanner('ランドマーク', i, { tone:'blue' }); }catch(e){ console.error('[WP11]', e); } }
  if(t.tour === 'sky') dkrSkyStageFx(t.owner, i);
  await ga;
  checkWin();
  return spend;
}
async function buyUI(pi, i){
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p || t.type !== 'city' || p.out || G.over) return;
  var side = dkrOwnSide(t, pi);
  if(t.owner >= 0 && !side) return;
  dkrBmSync(t);
  if(side && t.tour) return;                           /* 自分（味方）の観光地では何も開かない */
  if(side && t.landmark){ dkNotify(pi, '🗼', 'これ以上、建設できません', t.name + ' はランドマークです', { ms:1500 }); return; }
  if(!dkrSteps(i, pi).steps.some(function(s){ return s.can; })){
    dkNotify(pi, '🔒', 'これ以上、建設できません', lvLockNote(p), { ms:1500 });
    return;
  }
  var sk = dkrSkill(pi, 'build'), disc = dkrDisc(pi, !!sk);
  var auto = p.kind === 'cpu' || dkIsAuto(pi);
  if(auto) dkBusyTag(pi, '都市購入中');
  var sel;
  try{
    sel = await dvAsk(pi, 'build', function(){ return auto ? dkrPlanBuild(pi, i, disc) : dkrPickBuild(pi, i, disc); }, '買うか考えています');
  } finally { if(auto) dkBusyTag(pi, null); }
  if(!Array.isArray(sel) || !sel.length) return;
  await dkrApplyBuild(pi, i, sel, disc);
}
/* 権利証カードは出さない（本家に無い。budgets の決まり）。7-online.js が呼ぶので名前だけ残す */
function deedCard(i, paid){ return Promise.resolve(); }

/* ══════════ CPU・自動プレイの建設 ══════════ */
function dkrLvlOf(p){ return p.kind === 'cpu' ? (cfg.ai | 0) : 1; }
/* 同じ色で味方が持っている数（相手の数は qi で数える） */
function dkrNear(g, qi){ return CITY_SLOTS[g] ? CITY_SLOTS[g].filter(function(j){ var o = G.tiles[j].owner; return o >= 0 && dkAlly(qi, o); }).length : 0; }
function dkrPlanBuild(pi, i, disc){
  var t = G.tiles[i], p = G.players[pi], lvl = dkrLvlOf(p), sc = dkScale();
  if(!t || !p || t.type !== 'city') return [];
  var side = dkrOwnSide(t, pi);
  if(t.owner >= 0 && !side) return [];
  var reserve = ([300000, 180000, 90000][lvl] || 180000) * sc;
  var S = dkrSteps(i, pi, disc);
  if(S.mode === 'tour'){
    if(side) return [];
    var price = S.steps[0].cost, tours = dkrTours(G);
    var mineT = tours.filter(function(j){ return dkrMineT(j, pi); }).length;
    var block = G.players.some(function(q, qi){ return !dkAlly(pi, qi) && !q.out &&
      tours.filter(function(j){ return dkrMineT(j, qi); }).length >= tours.length - 1; });
    var urgent = mineT >= 1 || block;
    return (price <= p.cash && p.cash - price >= (urgent ? 0 : reserve)) ? [0] : [];
  }
  if(S.mode === 'lm'){
    /* ランドマークは一番の見せ場。弱い CPU でも、余裕があるなら建てる */
    var cl = S.steps[0].cost;
    return (p.cash - cl > reserve * (lvl >= 1 ? 1 : 1.5)) ? [4] : [];
  }
  var sel = [], spend = 0;
  if(!side){
    var pr = S.steps[0].cost;
    var urgentC = dkrNear(t.g, pi) >= 1 || G.players.some(function(q, qi){ return !dkAlly(pi, qi) && !q.out && dkrNear(t.g, qi) >= 2; });
    if(pr > p.cash || p.cash - pr < (urgentC ? 0 : reserve)) return [];
    sel.push(0); spend += pr;
  }
  var near = dkrNear(t.g, pi);
  var blockC = G.players.some(function(q, qi){ return !dkAlly(pi, qi) && !q.out && dkrNear(t.g, qi) >= 2; });
  var aggr = (near >= 1 || blockC) ? 1 : 0;
  for(var k = 1; k <= 3; k++){
    var s = S.steps[k];
    if(!s || s.have) continue;
    if(!s.can) break;
    var floor = Math.max(0, reserve - aggr * 1500000 * sc);
    if(p.cash - spend - s.cost < floor) break;
    if(lvl === 0 && k > 1) break;
    /* ふつうの CPU も、手元が厚いならホテル（3段目）まで建てる（最上段が一度も出ないのを直す） */
    if(lvl === 1 && k > 2 && !aggr && (p.cash - spend - s.cost) < reserve * 3) break;
    sel.push(k); spend += s.cost;
  }
  return sel;
}
async function aiBuy(pi, i){
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p || t.type !== 'city' || p.out || G.over) return;
  var side = dkrOwnSide(t, pi);
  if(t.owner >= 0 && !side) return;
  dkrBmSync(t);
  if(side && (t.tour || t.landmark)) return;
  if(!dkrSteps(i, pi).steps.some(function(s){ return s.can; })) return;
  var sk = dkrSkill(pi, 'build'), disc = dkrDisc(pi, !!sk);
  var sel = dkrPlanBuild(pi, i, disc);
  if(!sel.length) return;
  dkBusyTag(pi, '都市購入中');
  try{ await wait(380); } finally { dkBusyTag(pi, null); }
  if(G.over || p.out) return;
  /* 揺らす（J45：部屋のルールでオンの時だけ） */
  var me = G.players.findIndex(function(q){ return q.kind !== 'cpu' && !q.out; });
  if(cfg.shake && me >= 0 && me !== pi && G.players[me].jam > 0 && sel.some(function(k){ return k > 0; })){
    var jammed = await shakePhase(me);
    if(jammed){
      var top = Math.max.apply(null, sel);
      sel = sel.filter(function(k){ return k === 0 || k !== top; });
      dkNotify(me, '✋', 'じゃま成功！', '建設をひとつ止めました', { ms:1800 });
      if(!sel.length) return;
    }
  }
  var paid = await dkrApplyBuild(pi, i, sel, disc);
  if(paid > 0){
    dkNotify(pi, t.tour ? '🎡' : '🏗', (sel.indexOf(0) >= 0 ? '購入：' : '建設：') + t.name, yen(paid) + ' を投資しました', { ms:1800 });
    news(p.name + ' が ' + t.name + ' に ' + yen(paid) + ' を投資！');
  }
}

/* ══════════ 買収（観光地・ランドマークは不可。味方の都市は買収しない。買収のあと建てられる） ══════════ */
function dkrBuyoutCost(t, pi, skill){
  var p = G.players[pi];
  return Math.round(cityValue(t) * 2 * statMul(p, 'buyout', 0.3) * (1 - dkrAb(pi, 'buyout'))
    * (skill ? 0.5 : 1) * ((p.halfBuyout > 0) ? 0.5 : 1));
}
async function maybeBuyout(pi, i){
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p || t.type !== 'city' || p.out || G.over) return;
  if(t.owner < 0 || t.owner === pi) return;
  /* 停電は止まると終わる（本家「止まると終了」） */
  if(t.frozen > 0 && t.dkrDark){ t.frozen = 0; t.dkrDark = 0; boardChanged(); }
  /* チーム戦：味方の都市は買収しない。代わりに止まった人が払って建てられる（G01） */
  if(dkAlly(pi, t.owner)){
    if(p.kind === 'cpu') await aiBuy(pi, i); else await buyUI(pi, i);
    return;
  }
  if(t.tour || t.landmark) return;
  var owner = t.owner, half = p.halfBuyout > 0;
  if(p.cash < dkrBuyoutCost(t, pi, true)) return;       /* 半額でも買えない時は能力を回さない */
  var sk = dkrSkill(pi, 'buyout'), cost = dkrBuyoutCost(t, pi, !!sk);
  if(p.cash < cost) return;
  var auto = p.kind === 'cpu' || dkIsAuto(pi);
  var yes = await dvAsk(pi, 'buyout', async function(){
    if(auto) return !!aiBuyout(pi, i, cost);
    var full = Math.round(cityValue(t) * 2 * statMul(p, 'buyout', 0.3) * (1 - dkrAb(pi, 'buyout')));
    return (await modal(parchHTML(t, cost, G.players[owner].name, { half:half, skill:!!sk, full:full, pi:pi }))) === 'ok';
  }, '買収するか考えています');
  if(!yes) return;
  if(G.over || p.out || t.owner !== owner || p.cash < cost) return;
  if(half) p.halfBuyout--;
  give(pi, -cost); give(owner, cost);
  try{ moneyFly(pi, owner, true, cost); }catch(e){}
  t.owner = pi;
  boardChanged();
  try{ SFX.buy(); }catch(e){}
  var c = tileCenter(i);
  addFx('pillar', c.x, c.y, 900, PCOL[pi]);
  addFx('spark', c.x, c.y - 30, 900, '#FFD24D');
  addFx('shockring', c.x, c.y + 4, 620, '#FFE7A8', null, false, { r:170 });
  try{ jingle('buyout'); }catch(e){}
  news(p.name + ' が ' + t.name + ' を買収！ 持ち主が変わりました');
  await dkrSealFx(i, pi, owner, cost);
  if(checkWin()) return;
  /* 買収したあとは建物も建てられる（本家「買収後は通常の建設ルールで建てられる」） */
  if(p.kind === 'cpu') await aiBuy(pi, i); else await buyUI(pi, i);
}
/* 買収の確認（羊皮紙の証書）。7-online.js は3引数で呼ぶ */
function parchHTML(t, cost, ownerName, opt){
  opt = opt || {};
  var pi = (typeof opt.pi === 'number') ? opt.pi : (G ? G.turn : 0);
  var art = t ? dkrArtKeyOf(t) : 'b0';
  var off = opt.half || opt.skill;
  var price = off
    ? '<s>' + yen(opt.full || cost * 2) + '</s><b>' + yen(cost) + '</b><em class="dkr-half">' + (opt.skill ? 'スペシャル能力' : '買収半額') + '</em>'
    : '<b>' + yen(cost) + '</b>';
  return '<div class="modal"><div class="parch dkr-pc">'
    + '<i class="dkr-ribbon" aria-hidden="true"></i>'
    + '<h3>買 収 証 書</h3>'
    + '<div class="dkr-pcart"><canvas data-dkr-art="' + art + '" data-dkr-col="' + (PCOL[t && t.owner >= 0 ? t.owner : pi] || '#3E8FE0') + '" width="16" height="12"></canvas></div>'
    + '<div class="amt">' + esc(t ? t.name : '') + '</div>'
    + '<p>この都市を <b>' + esc(ownerName) + '</b> から買収します。<br>買収費用は建設費用の2倍です。</p>'
    + '<div class="dkr-price"><span>買収費用</span>' + price + '</div>'
    + '<div class="sign">Dice Kingdom 商工会</div>'
    + '<div class="dkr-pcbtn">'
    +   '<button class="dkr-btn dkr-gray" data-act="no">キャンセル</button>'
    +   '<button class="dkr-btn dkr-red" data-act="ok">買収する</button>'
    + '</div>'
    + '<i class="dkr-wax dkr-pcseal" aria-hidden="true"><b></b></i>'
    + '</div></div>';
}
/* 買収成立：証書に封蝋が押され、自動で閉じる（押さなくてよい） */
async function dkrSealFx(i, pi, fromPi, cost){
  var st = document.getElementById('stage'), t = G.tiles[i];
  if(!st || !t) return;
  var el = document.createElement('div');
  el.className = 'dkr-sealfx';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="parch dkr-pc dkr-mini" style="--dkr-o:' + (PCOL[pi] || '#C9302C') + '">'
    + '<i class="dkr-ribbon"></i><h3>買 収 成 立</h3>'
    + '<div class="dkr-pcart"><canvas data-dkr-art="' + dkrArtKeyOf(t) + '" data-dkr-col="' + (PCOL[pi] || '#E14A5A') + '" width="16" height="12"></canvas></div>'
    + '<div class="amt">' + esc(t.name) + '</div>'
    + '<p><b>' + esc(G.players[fromPi] ? G.players[fromPi].name : '') + '</b> → <b>' + esc(G.players[pi].name) + '</b>　' + yen(cost) + '</p>'
    + '<i class="dkr-wax dkr-stamp"><b></b></i></div>';
  st.appendChild(el);
  dkrPaintAll(el);
  await wait(420);
  try{ SFX.shock(); }catch(e){}
  try{ camShake(6); }catch(e){}
  try{ fxBurst(el.querySelector('.dkr-stamp') || { x:800, y:450 }, { kind:'star', n:10, power:0.8 }); }catch(e){}
  await wait(620);
  el.classList.add('dkr-out');
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, Math.max(20, 300 * SPEED));
}
/* CPU（と自動プレイ）の買収判断。味方・観光地・ランドマークは買わない。時間切れの自動（autoWeak）は買収しない */
function aiBuyout(pi, i, cost){
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p || t.owner < 0 || dkAlly(pi, t.owner) || t.tour || t.landmark) return false;
  if(p.autoWeak) return false;
  var lvl = dkrLvlOf(p);
  if(lvl === 0 || p.cash < cost) return false;
  if(dkrNear(t.g, t.owner) >= 2) return true;        /* 相手があと1つで独占：奪って崩す */
  var reserve = ([300000, 180000, 90000][lvl] || 180000) * dkScale();
  if(p.cash - cost < reserve) return false;
  if(dkrNear(t.g, pi) >= 1) return true;              /* 同じ色を持っているならそろえに行く */
  return Math.random() < 0.35;
}

/* ══════════ フォーチュンカード（J04・J27・G08・G20）：黄金7・シルバー8・罰6＝21種（運命のルーレットは日本マップ専用なので無し） ══════════
   名前と説明の @1＝孤立の角（無人島）・@2＝祭りの角・@3＝旅行の角・@H＝祭りの開催の名前・@F＝祭りの名前・@D＝募金の額 */
var DKR_CARDS = [
  { id:'angel',    tier:'gold',   hold:true, nm:'天使',         ds:'通行料を1回無料にするか、相手の攻撃を1回防ぐ。持っておける' },
  { id:'coupon',   tier:'gold',   hold:true, nm:'割引クーポン', ds:'払う通行料を1回だけ半額にする。持っておける' },
  { id:'invite',   tier:'gold',   nm:'@3招待状', ds:'@3へ移動し、次のターンに好きなマスへ無料で旅行できる' },
  { id:'swap',     tier:'gold',   atk:true, nm:'都市交換', ds:'自分の都市1つと相手の都市1つを入れ替える（ランドマーク・観光地は選べない）' },
  { id:'fsell',    tier:'gold',   atk:true, nm:'強制売却', ds:'相手の都市を1つ選び、半額で売却させる（ランドマーク・観光地は選べない）' },
  { id:'plague',   tier:'gold',   atk:true, nm:'伝染病', ds:'相手の都市を選ぶと、その色の相手の都市の通行料が3ラウンド半額になる' },
  { id:'meteor',   tier:'gold',   atk:true, nm:'隕石落下', ds:'色を1つ選ぶと、その色の相手の都市の一番高い建物が1段こわれる（ランドマークは無事）' },
  { id:'shield',   tier:'silver', hold:true, nm:'シールド', ds:'相手の攻撃を1回防ぐ。持っておける' },
  { id:'escape',   tier:'silver', hold:true, nm:'@1脱出', ds:'@1からすぐに脱出できる。持っておける' },
  { id:'bonusgo',  tier:'silver', nm:'ボーナスゲーム移動', ds:'ボーナスゲームへ移動して挑戦する（スタートを通ると給料）' },
  { id:'start',    tier:'silver', nm:'スタートに移動', ds:'スタートへ移動して、給料とスタート建設ボーナスを受け取る' },
  { id:'festhost', tier:'silver', nm:'@H', ds:'移動せずに、自分の都市1つで@Fを開催する' },
  { id:'quake',    tier:'silver', atk:true, nm:'地震', ds:'建物のある都市1つの建物が1段こわれる。自分の都市のこともある（ランドマークは無事）' },
  { id:'dark',     tier:'silver', atk:true, nm:'停電', ds:'相手の都市1つの通行料が5ラウンド0になる（誰かが止まると終わる）' },
  { id:'sand',     tier:'silver', atk:true, nm:'砂嵐', ds:'相手の都市1つの通行料が5ラウンドのあいだ半額になる' },
  { id:'festsee',  tier:'bad',    nm:'@2観覧', ds:'@Fの開催都市へ移動する' },
  { id:'taxgo',    tier:'bad',    nm:'強制徴収', ds:'国税庁へ移動して税金を納める' },
  { id:'pay2',     tier:'bad',    nm:'2倍支払い', ds:'次に払う通行料が2倍になる' },
  { id:'donate',   tier:'bad',    nm:'募金', ds:'全員が最下位のプレイヤーに@Dずつ払う' },
  { id:'citygive', tier:'bad',    nm:'都市寄付', ds:'自分の都市1つを、選んだ相手に寄付する' },
  { id:'island',   tier:'bad',    nm:'@1サバイバル', ds:'@1へ移動する（3ターンのあいだ移動できない）' }
];
var DKR_TIER = { gold:'黄金', silver:'シルバー', bad:'罰' };
var DKR_HOLDV = { angel:4, shield:3, coupon:2, escape:1 };   /* 1枚しか持てない時に残す順（C08） */
var DKR_S = { deck:null };

function dkrFestNm(){ var m = G && G.map; return (m && m.id === 'ice') ? '水晶の祝福' : ((m && m.corners && m.corners[2]) || 'フェスティバル'); }
function dkrFill(s){
  var cn = (G && G.map && G.map.corners) || ['', '無人島', 'ワールドフェスティバル', '世界旅行'];
  var ice = G && G.map && G.map.id === 'ice';
  return String(s).replace(/@1/g, cn[1]).replace(/@2/g, cn[2]).replace(/@3/g, cn[3])
    .replace(/@H/g, ice ? '水晶の祝福' : cn[2] + '開催').replace(/@F/g, dkrFestNm())
    .replace(/@D/g, yen(dkrRate('donate', 0.05)));
}
function dkrCardName(c){ return dkrFill(c.nm); }
function dkrCardDesc(c){ return dkrFill(c.ds); }
function dkrCardById(id){
  var n;
  for(n = 0; n < DKR_CARDS.length; n++) if(DKR_CARDS[n].id === id) return DKR_CARDS[n];
  var d = DKR_S.deck || [];
  for(n = 0; n < d.length; n++) if(d[n].id === id) return d[n];
  return null;
}
/* 山＝21種＋マップのカード（C09 dkMapCards：{id, tier|gold|bad, nm, ds, run(pi)→Promise, art}） */
function dkrDeck(){
  var d = DKR_CARDS.slice(), ex = null;
  try{ ex = dkMapCards((G && G.map && G.map.id) || cfg.mapId); }catch(e){ console.error('[WP11]', e); }
  (Array.isArray(ex) ? ex : []).forEach(function(c){
    if(!c || !c.id || d.some(function(x){ return x.id === c.id; })) return;
    d.push({ id:String(c.id), tier:(c.tier === 'gold' || c.gold) ? 'gold' : (c.tier === 'bad' || c.bad) ? 'bad' : 'silver',
      nm:String(c.nm || c.name || 'フォーチュンカード'), ds:String(c.ds || c.desc || ''), atk:!!c.atk, map:true,
      run:(typeof c.run === 'function') ? c.run : null, art:c.art || null });
  });
  DKR_S.deck = d;
  return d;
}
/* 引く：21種から均等。黄金フォーチュン（能力値・サイコロの能力・週イベント）が効くと黄金に変わる */
function dkrDrawCard(pi){
  var p = G.players[pi], ev = G.ev || {}, deck = dkrDeck();
  var c = deck[(Math.random() * deck.length) | 0], golden = false;
  var luck = Math.min(0.6, statRate(p, 'fortune') * 0.3 + dkrAb(pi, 'fortune') + (ev.luck || 0) * 0.3);
  if(c.tier !== 'gold' && Math.random() < luck){
    var gp = deck.filter(function(x){ return x.tier === 'gold'; });
    if(gp.length){ c = gp[(Math.random() * gp.length) | 0]; golden = true; }
  }
  return { card:c, golden:golden };
}
function dkrCardInner(c, golden){
  return '<div class="dkr-fwrap dkr-t-' + c.tier + '">'
    + (c.tier === 'gold' ? '<i class="dkr-frays" aria-hidden="true"></i>' : '')
    + '<div class="dkr-fcard">'
    +   '<div class="dkr-fback"><div class="dkr-fbk"><b>FORTUNE</b><i>CARD</i></div></div>'
    +   '<div class="dkr-ffront">'
    +     '<div class="dkr-frib"><b>' + esc(dkrCardName(c)) + '</b></div>'
    +     '<span class="dkr-ftier">' + DKR_TIER[c.tier] + '</span>'
    +     '<div class="dkr-fart"><i class="dkr-fst s1"></i><i class="dkr-fst s2"></i><i class="dkr-fst s3"></i>'
    +       '<canvas data-dkr-art="card-' + esc(c.art || c.id) + '" width="16" height="12"></canvas></div>'
    +     '<p class="dkr-fds">' + esc(dkrCardDesc(c)) + '</p>'
    +   '</div>'
    + '</div>'
    + (golden ? '<div class="dkr-fgold"><i>カード<br>効果</i><b>黄金フォーチュン 獲得！</b></div>' : '')
    + '</div>';
}
function dkrCardHTML(c, golden){
  return '<div class="modal"><div class="dkr-fort">' + dkrCardInner(c, golden)
    + '<button class="dkr-btn dkr-orange dkr-fok" data-act="ok">閉じる</button></div></div>';
}
/* CPU・自動プレイの人が引いた時：押さなくてよいカードを約1秒だけ見せる（#modalWrap は使わない） */
async function dkrCpuCard(pi, c, golden){
  var st = document.getElementById('stage');
  if(!st) return;
  var el = document.createElement('div');
  el.className = 'dkr-cpucard';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="dkr-cpuwho" style="--dkr-o:' + (PCOL[pi] || '#3E8FE0') + '">' + esc(G.players[pi].name) + '</div>' + dkrCardInner(c, golden);
  st.appendChild(el);
  dkrPaintAll(el);
  await wait(1000);
  el.classList.add('dkr-out');
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, Math.max(20, 300 * SPEED));
}
async function chanceCard(pi){
  var p = G.players[pi];
  if(!p || p.out || G.over) return;
  var d = dkrDrawCard(pi), c = (d && d.card) ? d.card : d, golden = !!(d && d.golden);
  if(!c) return;
  try{ SFX.cardIn(); }catch(e){}
  if(p.kind === 'cpu' || dkIsAuto(pi)) await dkrCpuCard(pi, c, golden);
  else await dvAsk(pi, 'fortune', function(){ return modal(dkrCardHTML(c, golden)); }, 'フォーチュンカードを見ています');
  news('🎴 ' + p.name + ' がフォーチュンカード「' + dkrCardName(c) + '」を引いた');
  await dkrCardEffect(pi, c);
  try{ updHUD(); }catch(e){}
}

/* ── カードの効果で使う部品 ── */
/* 相手の都市（味方・破産した人の都市は入れない） */
function dkrOthersCities(pi, opt){
  opt = opt || {};
  var out = [];
  for(var i = 0; i < 32; i++){
    var t = G.tiles[i];
    if(!t || t.type !== 'city' || t.owner < 0 || dkAlly(pi, t.owner)) continue;
    if(G.players[t.owner] && G.players[t.owner].out) continue;
    if(opt.noLm && t.landmark) continue;
    if(opt.noTour && t.tour) continue;
    if(opt.noFrozen && t.frozen > 0) continue;
    if(opt.built && !((t.bm | 0) > 0)) continue;
    out.push(i);
  }
  return out;
}
function dkrOwned(pi){
  var out = [];
  for(var i = 0; i < 32; i++){ var t = G.tiles[i]; if(t && t.type === 'city' && t.owner === pi) out.push(i); }
  return out;
}
function dkrBest(list, score){
  var b = -1, bs = -1e18;
  list.forEach(function(i){ var s = score(i); if(s > bs){ bs = s; b = i; } });
  return b;
}
/* 相手の独占を崩す価値（その色で2つ以上持っている相手の都市は高い） */
function dkrThreat(i){
  var t = G.tiles[i];
  if(!t || t.tour || t.owner < 0) return 0;
  return dkrNear(t.g, t.owner) >= 2 ? 3000000 * dkScale() : 0;
}
function dkrTileFx(i, col){
  var c = tileCenter(i);
  addFx('ring', c.x, c.y, 700, col || '#FFD24D');
  addFx('spark', c.x, c.y - 26, 900, col || '#FFF3C0');
}
/* マスを選ぶ：人間は pickTile、CPU と自動プレイは score の一番高いマス */
async function dkrChoose(pi, cand, msg, score){
  if(!cand.length) return -1;
  var p = G.players[pi];
  if(p.kind === 'cpu' || dkIsAuto(pi)) return dkrBest(cand, score);
  var d = await pickTile(pi, msg, function(z){ return cand.indexOf(z) >= 0; });
  return (d >= 0 && cand.indexOf(d) >= 0) ? d : -1;
}
function dkrMiss(pi, c, why){ dkNotify(pi, '🎴', dkrCardName(c), why, { ms:1700 }); }
/* 移動（C31）。前の版の jumpTo（周回を数えない）の時は、スタートをまたいだ分をここで足す。idx 0 の給料は resolveInner */
async function dkrJump(pi, idx, sal){
  var p = G.players[pi];
  if(!p || p.out || G.over || !(idx >= 0 && idx < 32)) return;
  var from = p.pos, laps0 = p.laps | 0, cross = idx !== from && idx <= from;
  await jumpTo(pi, idx, { salary:!!sal });
  if(cross && (p.laps | 0) === laps0 && !p.out){
    p.laps = laps0 + 1;
    if(sal && idx !== 0) salary(pi);
  }
}
function dkrFindType(type){ for(var i = 0; i < 32; i++) if(G.tiles[i] && G.tiles[i].type === type) return i; return -1; }
/* 建物が1段こわれる（growAnim の逆＝沈む＋土煙）。apply で段を下げる */
async function dkrSinkAnim(i, apply){
  var t = G.tiles[i], g0 = G, c = tileCenter(i);
  addFx('smoke', c.x, c.y + 4, 1100);
  addFx('shockring', c.x, c.y + 4, 620, '#D8B48A', null, false, { r:150 });
  try{ SFX.bad(); }catch(e){}
  try{ camShake(7); }catch(e){}
  var D = Math.max(1, 380 * SPEED), t0 = null;
  await new Promise(function(res){
    requestAnimationFrame(function step(now){
      if(G !== g0){ res(); return; }
      if(t0 === null) t0 = now;
      var k = Math.max(0, Math.min(1, (now - t0) / D));
      t.grow = 1 - 0.82 * k * k;
      if(k < 1) requestAnimationFrame(step); else res();
    });
  });
  if(G !== g0) return;
  apply();
  t.grow = 1;
  boardChanged();
}
/* 一番高い建物を1段こわす（ランドマークには効かない）。こわれたら true */
async function dkrDowngrade(i){
  var t = G.tiles[i];
  dkrBmSync(t);
  if(!t || t.landmark || t.tour) return false;
  var bm = t.bm | 0, top = dkrTop(bm);
  if(!top) return false;
  await dkrSinkAnim(i, function(){ dkrSetBm(t, bm & ~(1 << (top - 1))); });
  return true;
}
/* 盾が割れる演出（小さな重ね。transform と opacity だけ） */
async function dkrShieldFx(pi, cardId){
  var st = document.getElementById('stage');
  if(!st) return;
  var el = document.createElement('div');
  el.className = 'dkr-shieldfx' + (cardId === 'angel' ? ' dkr-angel' : '');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="dkr-shw" style="--dkr-o:' + (PCOL[pi] || '#3E8FE0') + '"><i class="dkr-sh1"></i><i class="dkr-sh2"></i>'
    + '<b>' + esc(G.players[pi].name) + ' が防いだ！</b></div>';
  st.appendChild(el);
  try{ SFX.shock(); }catch(e){}
  await wait(380);
  el.classList.add('dkr-crack');
  try{ fxBurst(el.querySelector('.dkr-shw') || { x:800, y:450 }, { kind:'star', n:12, power:0.9 }); }catch(e){}
  await wait(520);
  el.classList.add('dkr-out');
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, Math.max(20, 280 * SPEED));
}
function dkrGuardHTML(tgtPi, atkPi, c){
  var q = G.players[tgtPi], card = dkrCardById(q.fcard) || { id:q.fcard, tier:'gold', nm:String(q.fcard) };
  var nm = dkrCardName(card);
  return '<div class="modal"><div class="dkr-ask dkr-guard">'
    + '<div class="dkr-askhd"><b>' + esc(nm) + 'カード</b></div>'
    + '<div class="dkr-askart"><canvas data-dkr-art="card-' + esc(card.id) + '" width="16" height="12"></canvas></div>'
    + '<p><b>' + esc(G.players[atkPi].name) + '</b> の「' + esc(dkrCardName(c)) + '」を受けました</p>'
    + '<p class="dkr-askq">' + esc(nm) + 'カードを使用しますか？</p>'
    + '<div class="dkr-pcbtn"><button class="dkr-btn dkr-blue" data-act="cancel">キャンセル</button>'
    + '<button class="dkr-btn dkr-orange" data-act="use">使用</button></div></div></div>';
}
/* 攻撃を受ける人がシールドか天使を持っていれば「防ぎますか」（'guard'）。防いだら true */
async function dkrGuard(atkPi, tgtPi, c){
  if(!(tgtPi >= 0) || tgtPi === atkPi) return false;
  var q = G.players[tgtPi];
  if(!q || q.out || (q.fcard !== 'shield' && q.fcard !== 'angel')) return false;
  var use = await dvAsk(tgtPi, 'guard', function(){
    if(q.kind === 'cpu' || dkIsAuto(tgtPi)) return true;
    return modal(dkrGuardHTML(tgtPi, atkPi, c)).then(function(a){ return a === 'use'; });
  }, '防ぐか選んでいます');
  if(!use || (q.fcard !== 'shield' && q.fcard !== 'angel')) return false;
  var used = q.fcard;
  q.fcard = null;
  await dkrShieldFx(tgtPi, used);
  dkNotify(tgtPi, '🛡', dkrCardName(dkrCardById(used)) + 'で防ぎました', dkrCardName(c) + ' は効きませんでした', { ms:1900 });
  try{ updHUD(); }catch(e){}
  return true;
}
function dkrSwapHTML(pi, oldId, c){
  var o = dkrCardById(oldId) || { id:oldId, tier:'gold', nm:String(oldId), ds:'' };
  var mini = function(card, label){
    return '<div class="dkr-swc dkr-t-' + card.tier + '"><em>' + label + '</em>'
      + '<div class="dkr-swart"><canvas data-dkr-art="card-' + esc(card.id) + '" width="16" height="12"></canvas></div>'
      + '<b>' + esc(dkrCardName(card)) + '</b><span>' + esc(dkrCardDesc(card)) + '</span></div>';
  };
  return '<div class="modal"><div class="dkr-ask dkr-swap">'
    + '<div class="dkr-askhd"><b>フォーチュンカードは1枚まで</b></div>'
    + '<p>持っておけるカードは1枚だけです。どちらを残しますか？</p>'
    + '<div class="dkr-swrow">' + mini(o, '持っているカード') + mini(c, '新しいカード') + '</div>'
    + '<div class="dkr-pcbtn"><button class="dkr-btn dkr-blue" data-act="old">持っている方を残す</button>'
    + '<button class="dkr-btn dkr-orange" data-act="new">新しい方にする</button></div></div></div>';
}
/* 持っておけるカード（C08：p.fcard に1枚。満杯なら 'swap' で入れ替えるか聞く） */
async function dkrHold(pi, c){
  var p = G.players[pi], nm = dkrCardName(c);
  if(!p.fcard){
    p.fcard = c.id;
    dkNotify(pi, '🎴', nm, 'カードを持っておきます（1枚まで）', { ms:1600 });
    try{ updHUD(); }catch(e){}
    return;
  }
  if(p.fcard === c.id){ dkNotify(pi, '🎴', nm, '同じカードを持っているので捨てました', { ms:1500 }); return; }
  var oldId = p.fcard, auto = p.kind === 'cpu' || dkIsAuto(pi);
  var v = await dvAsk(pi, 'swap', function(){
    if(auto) return (DKR_HOLDV[c.id] || 0) > (DKR_HOLDV[oldId] || 0) ? 'new' : 'old';
    return modal(dkrSwapHTML(pi, oldId, c));
  }, 'カードを入れ替えるか選んでいます');
  if(v === 'new' && p.fcard === oldId){
    p.fcard = c.id;
    dkNotify(pi, '🎴', nm, 'カードを入れ替えました', { ms:1500 });
  } else dkNotify(pi, '🎴', dkrCardName(dkrCardById(oldId) || c), '持っているカードを残しました', { ms:1500 });
  try{ updHUD(); }catch(e){}
}
/* 祭りの開催（本家「開催都市は常に1つ」。WP13 の G.festN・festTile に合わせる） */
async function dkrFestHost(pi, c){
  var cand = [];
  for(var i = 0; i < 32; i++){ var t = G.tiles[i]; if(t && t.type === 'city' && t.owner === pi && !t.tour && (t.olym | 0) < 5) cand.push(i); }
  if(!cand.length){ dkrMiss(pi, c, '開催できる自分の都市がありません'); return; }
  var d = await dkrChoose(pi, cand, '開催する都市を選択してください', function(z){ return tollOf(G.tiles[z], G); });
  if(d < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
  G.tiles.forEach(function(t2, j){ if(j !== d && t2 && t2.type === 'city' && t2.olym > 1) t2.olym = 1; });
  var tz = G.tiles[d];
  if(typeof G.festN === 'number'){ G.festN++; tz.olym = Math.min(5, 1 + G.festN); }
  else tz.olym = Math.min(5, Math.max(2, (tz.olym | 0) + 1));
  G.festTile = d;
  boardChanged();
  var cc = tileCenter(d);
  addFx('pillar', cc.x, cc.y, 1000, '#FFD24D');
  try{ SFX.landmark(); }catch(e){}
  try{ raiseBanner('通行料 ×' + tz.olym + '！', d); }catch(e){}
  dkNotify(pi, '🎪', dkrFestNm(), tz.name + ' の通行料が ×' + tz.olym + ' になりました', { ms:2000 });
  news(G.players[pi].name + ' が ' + tz.name + ' で' + dkrFestNm() + 'を開催！ 通行料 ×' + tz.olym);
}
/* 都市寄付の相手：チーム戦なら味方、ほかは総資産が一番少ない相手 */
function dkrGiveTarget(pi){
  var best = -1, bs = 1e18;
  G.players.forEach(function(q, j){
    if(j === pi || q.out) return;
    var s = assetOf(G, j) - (dkAlly(pi, j) ? 1e15 : 0);
    if(s < bs){ bs = s; best = j; }
  });
  return best;
}
function dkrGiveHTML(pi, i, list){
  return '<div class="modal"><div class="dkr-ask dkr-give">'
    + '<div class="dkr-askhd"><b>都市寄付</b></div>'
    + '<p><b>' + esc(G.tiles[i].name) + '</b> を寄付する相手を選択してください</p>'
    + '<div class="dkr-gvrow">' + list.map(function(j){
        var q = G.players[j];
        return '<button class="dkr-gv" data-act="' + j + '" style="--dkr-o:' + (PCOL[j] || '#3E8FE0') + '">'
          + '<b>' + esc(q.name) + '</b><span>総資産 ' + yen(assetOf(G, j)) + '</span></button>';
      }).join('') + '</div></div></div>';
}
/* 砂嵐・伝染病・停電の長さ（ラウンド。停電は手番ごとに減る frozen なので人数を掛ける） */
function dkrAliveN(){ return Math.max(1, G.players.filter(function(q){ return !q.out; }).length); }

async function dkrCardEffect(pi, c){
  var p = G.players[pi], cpu = p.kind === 'cpu' || dkIsAuto(pi), d, t, cand, ow;
  if(c.hold){ await dkrHold(pi, c); return; }
  if(c.atk && p.autoWeak){ dkrMiss(pi, c, '自動プレイ中なので使いませんでした'); return; }
  if(c.run){ try{ await c.run(pi); }catch(e){ console.error('[WP11]', e); } return; }
  switch(c.id){
  case 'fsell':
    cand = dkrOthersCities(pi, { noLm:true, noTour:true });
    if(!cand.length){ dkrMiss(pi, c, '売却させられる都市がありません'); return; }
    d = await dkrChoose(pi, cand, '売却するエリアを選択してください', function(i){ return dkrThreat(i) + cityValue(G.tiles[i]); });
    if(d < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
    t = G.tiles[d]; ow = t.owner;
    if(await dkrGuard(pi, ow, c)) return;
    var val = sellValue(t);
    t.owner = -1; dkrSetBm(t, 0); t.landmark = false;
    boardChanged();
    if(ow >= 0 && !G.players[ow].out) give(ow, val);
    var sc = tileCenter(d);
    addFx('smoke', sc.x, sc.y + 4, 1100);
    addFx('shockring', sc.x, sc.y + 4, 620, '#FFB27A', null, false, { r:160 });
    try{ SFX.bad(); }catch(e){}
    camShake(9);
    dkNotify(pi, '🔨', '強制売却', t.name + ' を半額で売却させました', { ms:1900 });
    news('🔨 ' + p.name + ' の強制売却！ ' + t.name + ' が市場に戻った');
    return;
  case 'swap':
    var mine = dkrOwned(pi).filter(function(i){ return !G.tiles[i].landmark && !G.tiles[i].tour; });
    var theirs = dkrOthersCities(pi, { noLm:true, noTour:true });
    if(!mine.length || !theirs.length){ dkrMiss(pi, c, '入れ替えられる都市がありません'); return; }
    var a = await dkrChoose(pi, mine, '渡す自分の都市を選択してください', function(i){
      return -cityValue(G.tiles[i]) - (dkrNear(G.tiles[i].g, pi) >= 2 ? 5e6 : 0); });
    if(a < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
    var b = await dkrChoose(pi, theirs, 'もらう相手の都市を選択してください', function(i){
      return cityValue(G.tiles[i]) + dkrThreat(i) + dkrNear(G.tiles[i].g, pi) * 2000000 * dkScale(); });
    if(b < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
    var ob = G.tiles[b].owner;
    if(await dkrGuard(pi, ob, c)) return;
    G.tiles[a].owner = ob; G.tiles[b].owner = pi;
    boardChanged();
    dkrTileFx(a, PCOL[ob]); dkrTileFx(b, PCOL[pi]);
    try{ SFX.buy(); }catch(e){}
    dkNotify(pi, '🔄', '都市交換', G.tiles[a].name + ' と ' + G.tiles[b].name + ' を入れ替えました', { ms:2000 });
    news('🔄 ' + p.name + ' が ' + G.tiles[b].name + ' を手に入れた（都市交換）');
    return;
  case 'plague':
    cand = dkrOthersCities(pi, { noLm:true, noTour:true });
    if(!cand.length){ dkrMiss(pi, c, '対象の都市がありません'); return; }
    d = await dkrChoose(pi, cand, '伝染病を広める都市を選択してください', function(i){ return tollOf(G.tiles[i], G) * (1 + dkrNear(G.tiles[i].g, G.tiles[i].owner)); });
    if(d < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
    ow = G.tiles[d].owner;
    if(await dkrGuard(pi, ow, c)) return;
    var hit = CITY_SLOTS[G.tiles[d].g].filter(function(j){ var tj = G.tiles[j]; return tj.owner === ow && !tj.landmark; });
    hit.forEach(function(j){ G.tiles[j].plague = 3; dkrTileFx(j, '#B6E36A'); });
    boardChanged();
    try{ SFX.bad(); }catch(e){}
    dkNotify(pi, '🦠', '伝染病', hit.length + ' 都市の通行料が3ラウンド半額になります', { ms:2000 });
    news('🦠 ' + p.name + ' の伝染病！ ' + G.players[ow].name + ' の都市の通行料が下がった');
    return;
  case 'meteor':
    var tg = dkrOthersCities(pi, { noLm:true, noTour:true, built:true });
    if(!tg.length){ dkrMiss(pi, c, 'こわせる建物がありません'); return; }
    var grpScore = function(i){ var g = G.tiles[i].g, s = 0; tg.forEach(function(j){ if(G.tiles[j].g === g) s += dkrPrice(G.tiles[j], dkrTop(G.tiles[j].bm | 0)); }); return s; };
    d = await dkrChoose(pi, tg, '隕石を落とす色の都市を選択してください', grpScore);
    if(d < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
    var grp = G.tiles[d].g, hitT = tg.filter(function(j){ return G.tiles[j].g === grp; }), owners = [], n2 = 0;
    hitT.forEach(function(j){ if(owners.indexOf(G.tiles[j].owner) < 0) owners.push(G.tiles[j].owner); });
    for(var oi = 0; oi < owners.length; oi++){
      if(await dkrGuard(pi, owners[oi], c)) continue;
      for(var hj = 0; hj < hitT.length; hj++){ if(G.tiles[hitT[hj]].owner === owners[oi] && await dkrDowngrade(hitT[hj])) n2++; }
    }
    if(n2){
      dkNotify(pi, '☄', '隕石落下', n2 + ' 都市の建物が1段こわれました', { ms:2000 });
      news('☄ ' + p.name + ' の隕石落下！ 建物がこわれた');
    }
    return;
  case 'quake':
    cand = [];
    for(var qi = 0; qi < 32; qi++){ var tq = G.tiles[qi]; if(tq && tq.type === 'city' && tq.owner >= 0 && !tq.tour && !tq.landmark && (tq.bm | 0) > 0 && !G.players[tq.owner].out) cand.push(qi); }
    if(!cand.length){ dkrMiss(pi, c, 'こわれる建物がありませんでした'); return; }
    d = cand[(Math.random() * cand.length) | 0];
    ow = G.tiles[d].owner;
    try{ camShake(12); }catch(e){}
    if(ow !== pi && await dkrGuard(pi, ow, c)) return;
    if(await dkrDowngrade(d)){
      dkNotify(pi, '🌋', '地震', G.tiles[d].name + ' の建物が1段こわれました', { ms:2000 });
      news('🌋 地震！ ' + G.tiles[d].name + ' の建物がこわれた');
    }
    return;
  case 'dark':
    cand = dkrOthersCities(pi, { noLm:true, noTour:true, noFrozen:true });
    if(!cand.length){ dkrMiss(pi, c, '停電させられる都市がありません'); return; }
    d = await dkrChoose(pi, cand, '停電させる都市を選択してください', function(i){ return tollOf(G.tiles[i], G); });
    if(d < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
    if(await dkrGuard(pi, G.tiles[d].owner, c)) return;
    G.tiles[d].frozen = 5 * dkrAliveN(); G.tiles[d].dkrDark = 1;
    boardChanged();
    dkrTileFx(d, '#8FE8FF');
    try{ SFX.bad(); }catch(e){}
    dkNotify(pi, '⚡', '停電', G.tiles[d].name + ' の通行料が5ラウンド0になります', { ms:2000 });
    return;
  case 'sand':
    cand = dkrOthersCities(pi, { noLm:true, noTour:true });
    if(!cand.length){ dkrMiss(pi, c, '対象の都市がありません'); return; }
    d = await dkrChoose(pi, cand, '砂嵐を起こす都市を選択してください', function(i){ return tollOf(G.tiles[i], G); });
    if(d < 0){ dkrMiss(pi, c, '選ばなかったので使いませんでした'); return; }
    if(await dkrGuard(pi, G.tiles[d].owner, c)) return;
    G.tiles[d].sand = 5;
    boardChanged();
    dkrTileFx(d, '#E8C27A');
    try{ SFX.bad(); }catch(e){}
    dkNotify(pi, '🌪', '砂嵐', G.tiles[d].name + ' の通行料が5ラウンド半額になります', { ms:2000 });
    return;
  case 'invite':
    await dkrJump(pi, 24, true);
    if(p.out || G.over) return;
    await resolve(pi);
    p.travelFree = true;
    return;
  case 'bonusgo':
    d = dkrFindType('bonus');
    if(d < 0){ dkrMiss(pi, c, 'ボーナスゲームのマスがありません'); return; }
    await dkrJump(pi, d, true);
    if(!p.out && !G.over) await resolve(pi);
    return;
  case 'start':
    await dkrJump(pi, 0, true);
    if(!p.out && !G.over) await resolve(pi);
    return;
  case 'festhost':
    await dkrFestHost(pi, c);
    return;
  case 'festsee':
    d = (typeof G.festTile === 'number' && G.tiles[G.festTile] && G.tiles[G.festTile].olym > 1) ? G.festTile : -1;
    if(d < 0){ var mo = 1; G.tiles.forEach(function(t3, j){ if(t3 && t3.type === 'city' && t3.olym > mo){ mo = t3.olym; d = j; } }); }
    if(d < 0) d = 16;
    await dkrJump(pi, d, true);
    if(!p.out && !G.over) await resolve(pi);
    return;
  case 'taxgo':
    d = dkrFindType('tax');
    if(d >= 0){ await dkrJump(pi, d, true); if(!p.out && !G.over) await resolve(pi); return; }
    var sum = 0;
    G.tiles.forEach(function(t4){ if(t4.type === 'city' && t4.owner === pi) sum += cityValue(t4); });
    var amt = Math.round(sum * 0.10 * statMul(p, 'special', 0.4));
    if(amt > 0){
      if(!(await dkPayFrom(pi, amt, -1))){ await bankrupt(pi, -1); return; }
      give(pi, -amt);
      dkNotify(pi, '🧾', '強制徴収', '所有地の価値の10%　' + yen(amt) + ' を納めました', { ms:1900 });
    } else dkrMiss(pi, c, '都市を持っていないので納める税はありません');
    return;
  case 'pay2':
    p.pay2 = 1;
    dkNotify(pi, '💸', '2倍支払い', '次に払う通行料が2倍になります', { ms:1800 });
    return;
  case 'donate':
    var alive = [];
    G.players.forEach(function(q, j){ if(!q.out) alive.push(j); });
    if(alive.length < 2) return;
    var last = alive.reduce(function(x, y){ return assetOf(G, y) < assetOf(G, x) ? y : x; });
    var each = dkrRate('donate', 0.05), got = 0;
    for(var k = 0; k < alive.length; k++){
      var j2 = alive[k];
      if(j2 === last || G.players[j2].out || G.players[last].out || G.over) continue;
      if(G.players[j2].cash < each && !(await dkPayFrom(j2, each, last))){ await bankrupt(j2, last); continue; }
      if(G.over) break;
      give(j2, -each); give(last, each); got += each;
    }
    dkNotify(pi, '💝', '募金', G.players[last].name + ' に ' + yen(got) + ' 集まりました', { ms:2000 });
    news('💝 募金！ ' + G.players[last].name + ' に全員から ' + yen(each) + ' ずつ');
    return;
  case 'citygive':
    var own2 = dkrOwned(pi).filter(function(i){ return !G.tiles[i].landmark && !G.tiles[i].tour; });
    if(!own2.length) own2 = dkrOwned(pi).filter(function(i){ return !G.tiles[i].landmark; });
    var to = [];
    G.players.forEach(function(q, j){ if(j !== pi && !q.out) to.push(j); });
    if(!own2.length || !to.length){ dkrMiss(pi, c, '寄付できる都市がありません'); return; }
    if(cpu) dkBusyTag(pi, '都市寄付選択中');
    var tgt = -1;
    try{
      d = await dkrChoose(pi, own2, '寄付する都市を選択してください', function(i){ return -cityValue(G.tiles[i]); });
      if(d < 0) d = dkrBest(own2, function(i){ return -cityValue(G.tiles[i]); });
      tgt = await dvAsk(pi, 'citygive', function(){
        return cpu ? dkrGiveTarget(pi) : modal(dkrGiveHTML(pi, d, to)).then(function(a){ return +a; });
      }, '寄付する相手を選んでいます');
    } finally { if(cpu) dkBusyTag(pi, null); }
    tgt = +tgt;
    if(!(tgt >= 0) || tgt === pi || !G.players[tgt] || G.players[tgt].out) tgt = dkrGiveTarget(pi);
    if(tgt < 0) return;
    G.tiles[d].owner = tgt;
    boardChanged();
    dkrTileFx(d, PCOL[tgt]);
    try{ SFX.pay(); }catch(e){}
    dkNotify(pi, '🎁', '都市寄付', G.tiles[d].name + ' を ' + G.players[tgt].name + ' に寄付しました', { ms:2000 });
    news('🎁 ' + p.name + ' が ' + G.tiles[d].name + ' を ' + G.players[tgt].name + ' に寄付');
    return;
  case 'island':
    await dkrJump(pi, 8, false);
    if(!p.out && !G.over) await resolve(pi);
    return;
  }
}

/* ══════════ 支払い・売却（J52・G11）：CPU と自動プレイは自動で売る。人間は売るエリアを選ぶ画面 ══════════ */
async function dkPayFrom(pi, amt, toPi){
  var p = G && G.players && G.players[pi];
  if(!p) return false;
  amt = Math.max(0, Math.round(+amt || 0));
  if(p.cash >= amt) return true;
  if(p.kind === 'cpu' || dkIsAuto(pi)) return raiseCash(pi, amt);
  var guard = 0;
  while(p.cash < amt && guard++ < 40){
    if(!dkrOwned(pi).length) return false;
    var v = await dvAsk(pi, 'sell', function(){ return dkrSellPick(pi, amt, toPi); }, '売却するエリアを選んでいます');
    if(!v || v.bankrupt) return false;
    var list = (Array.isArray(v.sell) ? v.sell : []).filter(function(i){
      var t = G.tiles[i]; return t && t.type === 'city' && t.owner === pi; });
    list.forEach(function(i){ dkrSellTile(pi, i); });
    try{ updHUD(); }catch(e){}
  }
  return p.cash >= amt;
}
/* 足りない分を売って作る（CPU）。全部売っても届かない時は1つも売らずに false（街は債権者へ＝本家どおり） */
function raiseCash(pi, need){
  var p = G.players[pi];
  if(p.cash >= need) return true;
  var pot = p.cash;
  dkrOwned(pi).forEach(function(i){ pot += sellValue(G.tiles[i]); });
  if(pot < need) return false;
  dkrSellPlan(pi, need - p.cash).forEach(function(i){ dkrSellTile(pi, i); });
  return p.cash >= need;
}
/* 不足を満たす最小の組（売値の合計が一番小さい組。同じなら都市の数が少ない組。独占に関係しない・通行料の安い順が先） */
function dkrSellPlan(pi, need){
  if(!(need > 0)) return [];
  var list = dkrOwned(pi).map(function(i){
    var t = G.tiles[i];
    return { i:i, v:sellValue(t), mono:(!t.tour && hasTriple(G, pi, t.g)) ? 1 : 0, toll:tollOf(t, G) };
  });
  list.sort(function(a, b){ return (a.mono - b.mono) || (a.toll - b.toll) || (a.v - b.v); });
  var total = list.reduce(function(s, o){ return s + o.v; }, 0), n = list.length, k;
  if(total < need) return list.map(function(o){ return o.i; });
  if(n <= 16){
    var best = 0, bs = Infinity, bc = Infinity, bp = Infinity;
    for(var m = 1; m < (1 << n); m++){
      var s = 0, c = 0, pen = 0;
      for(k = 0; k < n; k++) if(m & (1 << k)){ s += list[k].v; c++; pen += list[k].mono; }
      if(s < need) continue;
      if(s < bs || (s === bs && (c < bc || (c === bc && pen < bp)))){ bs = s; bc = c; bp = pen; best = m; }
    }
    return list.filter(function(o, k2){ return best & (1 << k2); }).map(function(o){ return o.i; });
  }
  var pick = [], s2 = 0;
  list.forEach(function(o){ if(s2 < need){ pick.push(o); s2 += o.v; } });
  pick.slice().sort(function(a, b){ return b.v - a.v; }).forEach(function(o){
    if(s2 - o.v >= need){ pick.splice(pick.indexOf(o), 1); s2 -= o.v; }
  });
  var one = list.filter(function(o){ return o.v >= need; }).sort(function(a, b){ return a.v - b.v; })[0];
  if(one && one.v < s2) return [one.i];
  return pick.map(function(o){ return o.i; });
}
/* 都市を建物ごと市場へ売る（売値＝価値の半額） */
function dkrSellTile(pi, i){
  var t = G.tiles[i], val = sellValue(t);
  t.owner = -1; dkrSetBm(t, 0); t.landmark = false; t.sand = 0; t.plague = 0;
  boardChanged();
  give(pi, val);
  var c = tileCenter(i);
  addFx('smoke', c.x, c.y + 4, 900);
  addFx('ring', c.x, c.y, 600, '#FFD24D');
  news(G.players[pi].name + ' が ' + t.name + ' を ' + yen(val) + ' で売却');
}
function dkrLvName(t){
  if(t.tour) return '観光地';
  if(t.landmark) return 'ランドマーク';
  var bm = t.bm | 0;
  return bm ? DKR_STEP_NM[dkrTop(bm)] + (dkrBits(bm) > 1 ? ' ほか' : '') : '土地権利書';
}
function dkrSellHTML(pi, amt, toPi, rows, pre, enough){
  var p = G.players[pi], need = amt - p.cash;
  var to = (toPi >= 0 && G.players[toPi]) ? G.players[toPi].name + ' への支払い' : '支払い';
  var h = '<div class="modal"><div class="dkr-sell">'
    + '<div class="dkr-shd"><b>マーブルが足りません</b><span>' + esc(to) + '</span></div>'
    + '<div class="dkr-need">'
    +   '<div><span>支払う額</span><b>' + yen(amt) + '</b></div>'
    +   '<div><span>マーブル</span><b>' + yen(p.cash) + '</b></div>'
    +   '<div class="dkr-short"><span>不足額</span><b>' + yen(need) + '</b></div>'
    + '</div>'
    + '<div class="dkr-shead"><span>売却するエリアを選択してください</span>'
    +   (enough ? '<button class="dkr-auto" type="button">おまかせで選ぶ</button>' : '') + '</div>'
    + '<div class="dkr-slist">';
  rows.forEach(function(o){
    var t = G.tiles[o.i];
    h += '<div class="dkr-srow' + (pre.indexOf(o.i) >= 0 ? ' on' : '') + (enough ? '' : ' dkr-noop') + '" data-dkr-i="' + o.i + '" data-dkr-v="' + o.v + '">'
      + '<i class="dkr-sw" style="--dkr-g:' + dkrColOf(t) + '"></i>'
      + '<span class="dkr-snm">' + esc(t.name) + '</span><span class="dkr-slv">' + dkrLvName(t) + '</span>'
      + '<b class="dkr-sv">' + yen(o.v) + '</b><i class="dkr-sck" aria-hidden="true"></i></div>';
  });
  h += '</div><div class="dkr-sfoot">'
    + '<div class="dkr-ssum"><span>売却の合計</span><b id="dkrSellSum">0</b></div>'
    + '<button class="dkr-btn dkr-gray" data-act="bankrupt">破産する</button>'
    + '<button class="dkr-btn dkr-red" data-act="sell" id="dkrSellOk">売却</button>'
    + '</div><p class="dkr-note">' + (enough
      ? '売却したエリアは建物ごと市場に戻り、価値の半額を受け取ります。'
      : '全部売却しても足りません。破産すると、持っている都市は支払い先のものになります。')
    + '</p></div></div>';
  return h;
}
function dkrSellPick(pi, amt, toPi){
  return new Promise(function(res){
    var p = G.players[pi], need = amt - p.cash;
    var rows = dkrOwned(pi).map(function(i){ return { i:i, v:sellValue(G.tiles[i]) }; })
                           .sort(function(a, b){ return a.v - b.v; });
    var total = rows.reduce(function(s, o){ return s + o.v; }, 0), enough = total >= need;
    var pre = enough ? dkrSellPlan(pi, need) : [];
    var first = dkrOpenModal(dkrSellHTML(pi, amt, toPi, rows, pre, enough));
    var panel = first.querySelector('.dkr-sell'), done = false;
    var sync = function(){
      var sum = 0;
      panel.querySelectorAll('.dkr-srow.on').forEach(function(r){ sum += +r.getAttribute('data-dkr-v') || 0; });
      var e = panel.querySelector('#dkrSellSum'); if(e) e.textContent = yen(sum);
      var ok = panel.querySelector('#dkrSellOk'); if(ok) ok.disabled = !enough || sum < need;
      panel.classList.toggle('dkr-ok', enough && sum >= need);
    };
    panel.querySelectorAll('.dkr-srow').forEach(function(r){
      r.onclick = function(){
        if(done) return;
        try{ SFX.click(); }catch(e){}
        if(!enough){ dkrNudge(r); return; }
        r.classList.toggle('on'); sync();
      };
    });
    var au = panel.querySelector('.dkr-auto');
    if(au) au.onclick = function(){
      if(done) return;
      try{ SFX.click(); }catch(e){}
      var plan = dkrSellPlan(pi, need);
      panel.querySelectorAll('.dkr-srow').forEach(function(r){ r.classList.toggle('on', plan.indexOf(+r.getAttribute('data-dkr-i')) >= 0); });
      sync();
    };
    sync();
    panel.querySelectorAll('[data-act]').forEach(function(b){
      b.onclick = function(){
        if(done || b.disabled) return;
        try{ SFX.click(); }catch(e){}
        done = true;
        dkrCloseModal(first);
        if(b.getAttribute('data-act') === 'sell'){
          var sel = [];
          panel.querySelectorAll('.dkr-srow.on').forEach(function(r){ sel.push(+r.getAttribute('data-dkr-i')); });
          res({ sell:sel });
        } else res({ bankrupt:true });
      };
    });
  });
}

/* ══════════ ボーナスゲーム（J26・G07）：賭け金は開始額の15/10/5%、×2→×4→×8・STOP、3連勝で好きな特殊マスへ ══════════
   舞台はマップの仕掛け（C09 dkMapBonus(id)→{title, a, b, draw(ctx, w, h, st, T)}。st＝{mode:'idle'|'run'|'win'|'lose', side:'L'|'R', k:0〜1}）。
   無い間は当作の洞窟の舞台。当たる確率は3種で同じ */
function dkrTurnKey(){
  return (G && typeof G.turnSerial === 'number') ? G.turnSerial : ('t' + (G ? G.turnsLeft : 0) + '_' + (G ? G.turn : 0));
}
function dkrStakes(){ return [dkrRate('stake2', 0.15), dkrRate('stake1', 0.10), dkrRate('stake0', 0.05)]; }
function dkrBonusDef(){
  var b = null;
  try{ b = dkMapBonus((G && G.map && G.map.id) || cfg.mapId); }catch(e){ console.error('[WP11]', e); }
  if(!b || typeof b !== 'object') b = null;
  return { title:String((b && b.title) || '洞窟脱出'), a:String((b && b.a) || '左の通路'), b:String((b && b.b) || '右の通路'),
           draw:(b && typeof b.draw === 'function') ? b.draw : null };
}
function miniHTML(stake, round, mult, hist, win, opt){
  opt = opt || {};
  var pi = (typeof opt.pi === 'number') ? opt.pi : (G ? G.turn : 0);
  var p = G && G.players ? G.players[pi] : null, B = opt.def || dkrBonusDef();
  var cash = p ? p.cash : Infinity, lock = round > 1 || !!opt.cpu;
  var cells = (hist || []).slice(0, 6).map(function(h){
    return '<div class="mgh ' + (h === 'L' ? 'dkr-l' : 'dkr-r') + '">' + esc(h === 'L' ? B.a : B.b) + '</div>'; }).join('')
    || '<div class="mgh dkr-none">なし</div>';
  var stakes = dkrStakes().map(function(v){
    var off = v > cash && v !== stake;
    return '<div class="mgstake' + (v === stake ? ' on' : '') + (off ? ' dkr-off' : '') + '" data-v="' + v + '">' + yen(v) + '</div>';
  }).join('');
  var badges = [1, 2, 3].map(function(r){
    var won = r < round, now = r === round;
    return '<span class="' + (won ? 'won' : now ? 'now' : '') + '"><b>' + (won ? 'WIN' : ['1st', '2nd', '3rd'][r - 1]) + '</b><i>GAME</i></span>';
  }).join('');
  var dis = opt.cpu ? ' disabled' : '';
  return (opt.view ? '<div class="mg dkr-mg dkr-mgview">' : '<div class="modal"><div class="mg dkr-mg">')
    + '<div class="mghd"><b>ボーナスゲーム</b><em>' + esc(B.title) + '</em></div>'
    + '<div class="mgbody">'
    +   '<div class="mgleft">'
    +     '<div class="mgwho"><div class="mgname">' + esc(p ? p.name : '') + '</div>'
    +       '<div class="mgpic"><canvas data-dkr-port="' + pi + '" width="16" height="16"></canvas></div></div>'
    +     '<div class="mgcap">最近の結果</div><div class="mghist">' + cells + '</div>'
    +   '</div>'
    +   '<div class="mgstage" id="mgStage">'
    +     '<div class="mground">' + badges + '</div>'
    +     '<div class="mgart" id="mgArt"><canvas data-dkr-art="mini" width="16" height="12"></canvas></div>'
    +     '<div class="mgmsg" id="mgMsg">' + (opt.cpu ? esc(p ? p.name : '') + ' が挑戦中' : '「' + esc(B.a) + '」と「' + esc(B.b) + '」どちらにする？') + '</div>'
    +   '</div>'
    +   '<div class="mgright">'
    +     '<div class="mgcap">ゲーム費用</div><div class="mgstakes' + (lock ? ' dkr-lockd' : '') + '" id="mgStakes">' + stakes + '</div>'
    +     '<div class="mgcap">ボーナス倍率</div><div class="mgbig" id="mgMult">x' + mult + '</div>'
    +     '<div class="mgcap">獲得できる金額</div><div class="mgbig gold" id="mgWin">' + yen(win) + '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="mgfoot">'
    +   '<button class="mgarrow dkr-al" data-act="L"' + dis + '><i></i><span>' + esc(B.a) + '</span></button>'
    +   '<button class="mgstop" data-act="stop"' + dis + '>STOP<i>報酬をもらう</i></button>'
    +   '<button class="mgarrow dkr-ar" data-act="R"' + dis + '><span>' + esc(B.b) + '</span><i></i></button>'
    + '</div></div>' + (opt.view ? '' : '</div>');
}
async function miniGame(pi){
  var p = G.players[pi];
  if(!p || p.out || G.over) return;
  var key = dkrTurnKey(), stakes = dkrStakes();
  if(p.cash < stakes[2]){ await band('ボーナスゲーム', 'マーブルが ' + yen(stakes[2]) + ' に満たないので挑戦できません', 1100); return; }
  if(p.bonusTurn === key){ await band('ボーナスゲーム', '同じターンに2回は挑戦できません', 1100); return; }
  p.bonusTurn = key;
  var B = dkrBonusDef(), auto = p.kind === 'cpu' || dkIsAuto(pi);
  DKR_S.mb = B;
  await band('ボーナスゲーム', B.title + '　2つのうち1つを当てよう！', 1100);
  var stake = p.cash >= stakes[1] ? stakes[1] : stakes[2];
  var round = 1, mult = 2 * ((G.ev && G.ev.miniX) || 1), banked = 0, wins = 0;
  var hist = p.dkrMini = (Array.isArray(p.dkrMini) ? p.dkrMini : []);
  var rate = Math.min(0.9, 0.5 + statRate(p, 'mini') * 0.22 + dkrAb(pi, 'mini'));
  var first = null, host = null, st = document.getElementById('stage');
  var q = function(sel){ return first ? first.querySelector(sel) : null; };
  var setStake = function(v){
    stake = v;
    if(!first) return;
    first.querySelectorAll('.mgstake').forEach(function(s){ s.classList.toggle('on', +s.getAttribute('data-v') === v); });
    var w = q('#mgWin'); if(w) w.textContent = yen(stake * mult);
  };
  /* CPU と自動プレイの人は #modalWrap を使わず、押さなくてよい重ねで見せる */
  var render = function(){
    var html = miniHTML(stake, round, mult, hist, stake * mult, { pi:pi, cpu:auto, view:auto, def:B });
    if(auto){
      if(!host && st){ host = document.createElement('div'); host.className = 'dkr-mghost'; host.setAttribute('aria-hidden', 'true'); st.appendChild(host); }
      if(!host) return;
      host.innerHTML = html; first = host.firstElementChild; dkrPaintAll(host);
      return;
    }
    first = dkrOpenModal(html);
    first.querySelectorAll('.mgstake').forEach(function(s){
      s.onclick = function(){
        if(round > 1 || s.classList.contains('dkr-off')) return;
        var v = +s.getAttribute('data-v');
        if(v > p.cash) return;
        try{ SFX.click(); }catch(e){}
        setStake(v);
      };
    });
  };
  var close = function(){
    if(host){ var h2 = host; h2.classList.add('dkr-out'); setTimeout(function(){ if(h2.parentNode) h2.parentNode.removeChild(h2); }, Math.max(20, 280 * SPEED)); host = null; }
    else if(first) dkrCloseModal(first);
  };
  render();
  while(round <= 3){
    var v = await dvAsk(pi, 'mini', async function(){
      if(auto){ await wait(700); return { c:(Math.random() < 0.5 ? 'L' : 'R'), s:stake }; }
      var c = await new Promise(function(res){
        first.querySelectorAll('[data-act]').forEach(function(b){
          b.onclick = function(){ if(b.disabled) return; try{ SFX.click(); }catch(e){} res(b.getAttribute('data-act')); };
        });
      });
      return { c:c, s:stake };
    }, '選んでいます');
    if(G.over || p.out){ close(); return; }
    if(round === 1 && v && v.s && v.s !== stake && v.s <= p.cash && stakes.indexOf(v.s) >= 0) setStake(v.s);
    if(!v || v.c === 'stop') break;
    var win = Math.random() < rate;
    if(first) first.querySelectorAll('[data-act]').forEach(function(b){ b.disabled = true; });
    var art = q('#mgArt canvas'), msg = q('#mgMsg');
    dkrMiniAnim(art, 'run', v.c, B);
    if(msg){ msg.textContent = '「' + (v.c === 'L' ? B.a : B.b) + '」を選んだ……'; msg.className = 'mgmsg'; }
    await wait(650);
    hist.unshift(win ? v.c : (v.c === 'L' ? 'R' : 'L'));
    if(hist.length > 6) hist.length = 6;
    if(!win){
      dkrMiniAnim(art, 'lose', v.c, B);
      if(msg){ msg.textContent = 'はずれ！ 賭けたマーブルを失いました'; msg.className = 'mgmsg dkr-bad'; }
      try{ SFX.bad(); }catch(e){}
      camShake(9);
      await wait(1100);
      close();
      if(!(await dkPayFrom(pi, stake, -1))){ await bankrupt(pi, -1); return; }
      give(pi, -stake);
      dkNotify(pi, '💀', 'ボーナスゲーム', yen(stake) + ' を失いました', { ms:1900 });
      return;
    }
    wins++;
    dkrMiniAnim(art, 'win', v.c, B);
    if(msg){ msg.textContent = 'あたり！ 倍率アップ'; msg.className = 'mgmsg dkr-good'; }
    var bd = first ? first.querySelectorAll('.mground span')[round - 1] : null;
    if(bd){ bd.className = 'won'; bd.innerHTML = '<b>WIN</b><i>GAME</i>'; }
    try{ SFX.coin(); }catch(e){}
    banked = stake * mult;
    await wait(850);
    round++; mult *= 2;
    if(round > 3) break;
    render();
    if(auto){
      var greedy = p.kind === 'cpu' ? (cfg.ai === 2 ? 0.6 : cfg.ai === 1 ? 0.45 : 0.3) : 0.4;
      if(Math.random() > greedy) break;
    }
  }
  close();
  var prize = banked || 0;
  if(prize > 0){
    news('🎲 ' + p.name + ' がボーナスゲームで ' + yen(prize) + ' を獲得！');
    give(pi, prize);
    addFx('pillar', tileCenter(p.pos).x, tileCenter(p.pos).y, 1000, '#FFD24D');
    await cutIn('BONUS GAME', wins >= 3 ? '3連勝！' : 'ボーナスゲーム成功！', yen(prize) + ' を獲得');
    if(wins >= 3) await dkrBonus3(pi);
  } else {
    dkNotify(pi, '🎲', 'ボーナスゲーム', '挑戦をやめました', { ms:1500 });
  }
}
/* 3連勝ボーナス：好きな特殊マスへ移動（給料なし）→ そのマスの効果 */
function dkrBonus3HTML(pi){
  return '<div class="modal"><div class="dkr-ask dkr-b3">'
    + '<div class="dkr-askhd"><b>3連勝ボーナス！</b></div>'
    + '<div class="dkr-b3art" aria-hidden="true"><i>WIN</i><i>WIN</i><i>WIN</i></div>'
    + '<p>好きな特殊マスへ移動できます</p><p class="dkr-askq">（スタートを通っても給料はありません）</p>'
    + '<div class="dkr-pcbtn"><button class="dkr-btn dkr-blue" data-act="no">移動しない</button>'
    + '<button class="dkr-btn dkr-orange" data-act="go">マスを選ぶ</button></div></div></div>';
}
function dkrBonus3Pick(pi, cand){
  var p = G.players[pi], own = dkrOwned(pi).length;
  var pref = [];
  if(!p.autoWeak) pref.push(dkrFindType('travel'));
  if(own) pref.push(dkrFindType('start'), dkrFindType('olympic'));
  pref.push(dkrFindType('card'));
  for(var n = 0; n < pref.length; n++) if(pref[n] >= 0 && cand.indexOf(pref[n]) >= 0) return pref[n];
  return -1;
}
async function dkrBonus3(pi){
  var p = G.players[pi];
  if(!p || p.out || G.over) return;
  var cand = [];
  for(var i = 0; i < 32; i++){ var t = G.tiles[i]; if(t && t.type !== 'city' && t.type !== 'jail' && i !== p.pos) cand.push(i); }
  if(!cand.length) return;
  var auto = p.kind === 'cpu' || dkIsAuto(pi);
  var d = await dvAsk(pi, 'bonus3', async function(){
    if(auto) return dkrBonus3Pick(pi, cand);
    if((await modal(dkrBonus3HTML(pi))) !== 'go') return -1;
    var z = await pickTile(pi, '移動する特殊マスを選択してください', function(k){ return cand.indexOf(k) >= 0; });
    return (z >= 0 && cand.indexOf(z) >= 0) ? z : -1;
  }, '移動するマスを選んでいます');
  d = +d;
  if(!(d >= 0) || cand.indexOf(d) < 0 || p.out || G.over) return;
  await dkrJump(pi, d, false);
  if(!p.out && !G.over) await resolve(pi);
}

/* ══════════ 絵（すべて canvas に自作。ポップアップの canvas は差し込まれた時に塗る） ══════════ */
function dkrPaintAll(root){
  if(!root || !root.querySelectorAll) return;
  root.querySelectorAll('canvas[data-dkr-art],canvas[data-dkr-port]').forEach(function(c){
    if(c._dkrDone) return;
    try{ dkrPaintCanvas(c); }catch(e){ console.error('[WP5]', e); }
  });
}
function dkrPaintCanvas(c){
  var w = c.clientWidth, h = c.clientHeight;
  if(!(w > 0 && h > 0)) return;                 /* まだ配置されていない（次の変化で塗る） */
  var sc = 1;
  try{ sc = (window.DKFX && DKFX.scale) ? DKFX.scale() : 1; }catch(e){}
  var k = Math.max(1, Math.min(2, sc * (window.devicePixelRatio || 1)));
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  var ctx = c.getContext('2d');
  ctx.setTransform(k, 0, 0, k, 0, 0);
  c._dkrDone = true; c._dkrK = k;
  if(c.hasAttribute('data-dkr-port')) dkrPaintPort(ctx, w, h, +c.getAttribute('data-dkr-port'));
  else dkrPaintArt(ctx, w, h, c.getAttribute('data-dkr-art') || '', c.getAttribute('data-dkr-col') || '#E14A5A', c);
}
function dkrPaintPort(ctx, w, h, pi){
  var p = G && G.players && G.players[pi];
  var g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#7A3A5E'); g.addColorStop(1, '#2A0F22');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if(!p) return;
  ctx.save();
  /* 顔が真ん中に来るように、肖像（240×340）の上の余白を少し切って横いっぱいに広げる */
  var s = Math.max(w / 240, h / 250);
  ctx.translate((w - 240 * s) / 2, -44 * s);
  ctx.scale(s, s);
  try{ dvPort(p.ch, ctx, 0, p.card); }catch(e){}
  ctx.restore();
  var v = ctx.createLinearGradient(0, h * 0.6, 0, h);
  v.addColorStop(0, 'rgba(20,4,14,0)'); v.addColorStop(1, 'rgba(20,4,14,.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
}
function dkrPaintArt(ctx, w, h, key, col, cv){
  if(key === 'mini'){ dkrMiniPaint(ctx, w, h, (cv && cv._dkrMini) || null, 0); return; }
  if(key.indexOf('card-') === 0){ dkrCardArt(ctx, w, h, key.slice(5)); return; }
  dkrBuildArt(ctx, w, h, key, col);
}
/* 等角の台（芝・雪・桃色の石） */
function dkrPlot(ctx, cx, cy, hw, hh, cs){
  var d = Math.max(5, hh * 0.28);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - hw, cy); ctx.lineTo(cx, cy + hh); ctx.lineTo(cx, cy + hh + d); ctx.lineTo(cx - hw, cy + d); ctx.closePath();
  ctx.fillStyle = _dvTone(cs[2], 0.10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, cy + hh); ctx.lineTo(cx + hw, cy); ctx.lineTo(cx + hw, cy + d); ctx.lineTo(cx, cy + hh + d); ctx.closePath();
  ctx.fillStyle = _dvTone(cs[2], -0.22); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, cy - hh); ctx.lineTo(cx + hw, cy); ctx.lineTo(cx, cy + hh); ctx.lineTo(cx - hw, cy); ctx.closePath();
  var g = ctx.createLinearGradient(cx - hw, cy - hh, cx + hw, cy + hh);
  g.addColorStop(0, cs[0]); g.addColorStop(1, cs[1]);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - hw + 3, cy); ctx.lineTo(cx, cy - hh + 2); ctx.lineTo(cx + hw - 3, cy); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,20,10,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - hw, cy + d); ctx.lineTo(cx, cy + hh + d); ctx.lineTo(cx + hw, cy + d); ctx.stroke();
  ctx.restore();
}
/* 建設カード・証書の絵（土地／別荘／ビル／ホテル／ランドマーク／観光地） */
function dkrBuildArt(ctx, w, h, key, col){
  var tour = key.indexOf('tour-') === 0, pink = key === 'tour-pink';
  var cx = w / 2, gy = h * 0.74, hw = Math.min(w * 0.40, h * 0.66), hh = hw * 0.5;
  var halo = ctx.createRadialGradient(cx, gy - h * 0.25, 4, cx, gy - h * 0.25, Math.max(w, h) * 0.62);
  halo.addColorStop(0, 'rgba(255,255,255,.75)'); halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
  dkrPlot(ctx, cx, gy, hw, hh, tour ? (pink ? ['#FFF0F6', '#F7BBD2', '#C07494'] : ['#EEFAFF', '#A9DDF5', '#5E97B8'])
                                    : ['#C3EA86', '#6DB443', '#7A5530']);
  var T = 1500, fn = null, hgt = 60, wid = 40;
  if(key === 'b1'){ fn = dvVilla; hgt = 46; wid = 38; }
  else if(key === 'b2'){ fn = dvTowerB; hgt = 80; wid = 40; }
  else if(key === 'b3'){ fn = dvHotel; hgt = 92; wid = 64; }
  else if(key === 'b4'){ fn = dvLandmark; hgt = 124; wid = 60; }
  else if(tour){ fn = pink ? function(c2, cl, t2){ dkrPinkMon(c2, cl, t2, 2); } : function(c2, cl, t2){ dkrSkyMon(c2, cl, t2, 2); }; hgt = pink ? 72 : 90; wid = 60; }
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  ctx.translate(cx, gy + hh * 0.15);
  if(fn){
    var s = Math.min((gy - h * 0.06) / hgt, (w * 0.78) / wid);
    ctx.scale(s, s);
    try{ fn(ctx, col, T); }catch(e){}
  } else {
    var s0 = Math.min(h / 110, w / 120);
    ctx.scale(s0, s0);
    dkrFlagArt(ctx, col);
  }
  ctx.restore();
}
/* 土地権利書：芝の上に所有者色の旗と杭 */
function dkrFlagArt(ctx, col){
  ctx.save();
  _dvShadow(ctx, 16, 5, 0.45);
  ctx.strokeStyle = '#6B4A26'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  [-26, 26].forEach(function(x){ ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, -4); ctx.stroke(); });
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-26, -1); ctx.quadraticCurveTo(0, 6, 26, -1); ctx.stroke();
  var pole = ctx.createLinearGradient(-2, 0, 2, 0);
  pole.addColorStop(0, '#FFF3C8'); pole.addColorStop(1, '#A9761A');
  ctx.fillStyle = pole; ctx.fillRect(-2, -64, 4, 66);
  ctx.beginPath(); ctx.arc(0, -66, 4, 0, Math.PI * 2); ctx.fillStyle = '#F5D36B'; ctx.fill();
  ctx.strokeStyle = '#6B4408'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -62); ctx.bezierCurveTo(16, -70, 26, -54, 42, -60);
  ctx.lineTo(42, -34); ctx.bezierCurveTo(26, -28, 16, -44, 2, -36); ctx.closePath();
  var g = ctx.createLinearGradient(2, -62, 42, -34);
  g.addColorStop(0, _dvTone(col, 0.35)); g.addColorStop(1, _dvTone(col, -0.25));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = _dvTone(col, -0.55); ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.arc(20, -49, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/* 観光地の記念碑：水色＝白い灯台と水色のドーム。同じ持ち主の水色の数（G17）で3段：1＝灯台だけ・2＝旗・3＝回る光 */
function dkrSkyMon(ctx, col, T, stage){
  var line = '#1B3A55', stg = stage || 1;
  ctx.save();
  _dvShadow(ctx, 24, 8, 0.55);
  _dvBox(ctx, 0, 0, 36, 7, 9, _dvHG(ctx, -18, 18, '#FFFFFF', '#A7CBE0'), '#6F95B0', '#F2FAFF', line);
  ctx.beginPath(); ctx.moveTo(-12, -7); ctx.lineTo(12, -7); ctx.lineTo(8, -54); ctx.lineTo(-8, -54); ctx.closePath();
  ctx.fillStyle = _dvHG(ctx, -12, 12, '#FFFFFF', '#AFD2E6'); ctx.fill();
  ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  for(var k = 0; k < 3; k++){
    var y0 = -16 - k * 13, y1 = y0 - 5;
    var w0 = 12 - (y0 + 7) / -47 * 4, w1 = 12 - (y1 + 7) / -47 * 4;
    ctx.beginPath(); ctx.moveTo(-w0, y0); ctx.lineTo(w0, y0); ctx.lineTo(w1, y1); ctx.lineTo(-w1, y1); ctx.closePath();
    ctx.fillStyle = _dvHG(ctx, -12, 12, '#7FD3F7', '#2E8BC0'); ctx.fill();
  }
  ctx.fillStyle = '#E8F6FF';
  ctx.beginPath(); ctx.ellipse(0, -54, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = line; ctx.stroke();
  ctx.save();
  ctx.shadowColor = 'rgba(160,230,255,.95)'; ctx.shadowBlur = 8;
  ctx.fillStyle = _dvHG(ctx, -7, 7, '#E6FBFF', '#64C6EE');
  ctx.fillRect(-7, -66, 14, 12);
  ctx.restore();
  ctx.strokeStyle = line; ctx.strokeRect(-7, -66, 14, 12);
  ctx.beginPath(); ctx.arc(0, -66, 9, Math.PI, 0);
  ctx.fillStyle = _dvHG(ctx, -9, 9, '#8FE0FF', '#1E7FC0'); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.beginPath(); ctx.ellipse(-3, -70, 3, 1.6, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6B4408'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -75); ctx.lineTo(0, -90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(13, -86); ctx.lineTo(0, -82); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = _dvTone(col, -0.5); ctx.stroke();
  if(stg >= 2){
    [-15, 15].forEach(function(x){
      ctx.strokeStyle = '#6B4408'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, -3); ctx.lineTo(x, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, -30); ctx.lineTo(x + (x < 0 ? -11 : 11), -26); ctx.lineTo(x, -22); ctx.closePath();
      ctx.fillStyle = x < 0 ? '#7FD3F7' : col; ctx.fill();
    });
  }
  if(stg >= 3){
    var a = (T * 0.0011) % (Math.PI * 2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for(var n = 0; n < 2; n++){
      var an = a + n * Math.PI;
      var bx = Math.cos(an) * 48, by = Math.sin(an) * 12;
      var g = ctx.createLinearGradient(0, -60, bx, -60 + by);
      g.addColorStop(0, 'rgba(210,245,255,.38)'); g.addColorStop(1, 'rgba(210,245,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, -61); ctx.lineTo(bx, -60 + by - 5); ctx.lineTo(bx, -60 + by + 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  _dvRim(ctx, -11, -54, -8, 0.5);
  ctx.restore();
}
/* 観光地の記念碑：ピンク＝桃色の屋根の城門（訪問数で大きくなる） */
function dkrPinkMon(ctx, col, T, visits){
  var line = '#5A1E38';
  ctx.save();
  _dvShadow(ctx, 30, 9, 0.55);
  _dvBox(ctx, 0, 0, 56, 6, 10, _dvHG(ctx, -28, 28, '#FFF3F8', '#D9A3BA'), '#A86A86', '#FFF7FB', line);
  [-19, 19].forEach(function(x){
    _dvBox(ctx, x, -6, 14, 30, 6, _dvHG(ctx, x - 7, x + 7, '#FFFFFF', '#E3B6C9'), '#B98299', '#FFF0F6', line);
    ctx.beginPath(); ctx.moveTo(x - 10, -36); ctx.lineTo(x + 2, -58); ctx.lineTo(x + 13, -36); ctx.closePath();
    ctx.fillStyle = _dvHG(ctx, x - 10, x + 13, '#FF9CC2', '#C2346C'); ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,190,.95)'; ctx.fillRect(x - 3, -26, 5, 7);
    ctx.strokeStyle = '#6B4408'; ctx.beginPath(); ctx.moveTo(x + 2, -58); ctx.lineTo(x + 2, -68); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, -68); ctx.lineTo(x + 12, -65); ctx.lineTo(x + 2, -62); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  });
  _dvBox(ctx, 0, -6, 24, 22, 7, _dvHG(ctx, -12, 12, '#FFFFFF', '#EAC2D3'), '#C28CA4', '#FFF2F8', line);
  ctx.beginPath(); ctx.moveTo(-14, -28); ctx.lineTo(0, -44); ctx.lineTo(14, -28); ctx.closePath();
  ctx.fillStyle = _dvHG(ctx, -14, 14, '#FFB3D0', '#D2467E'); ctx.fill(); ctx.strokeStyle = line; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-6, -15); ctx.arc(0, -15, 6, Math.PI, 0); ctx.lineTo(6, -6); ctx.closePath();
  ctx.fillStyle = '#6A2244'; ctx.fill();
  ctx.save(); ctx.translate(0, -33); ctx.scale(0.5, 0.5);
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -14, 0, -6); ctx.bezierCurveTo(8, -14, 14, -2, 0, 8);
  ctx.fillStyle = '#FFD24D'; ctx.fill(); ctx.strokeStyle = '#8A5A08'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  var nv = Math.min(3, Math.max(0, visits | 0));
  for(var k = 0; k < nv + 1; k++){
    var ph = ((T * 0.0004) + k * 0.33) % 1;
    ctx.globalAlpha = (1 - ph) * 0.8;
    ctx.fillStyle = '#FF8FB8';
    var hx = -22 + k * 15 + Math.sin(ph * 6 + k) * 3, hy = -48 - ph * 26;
    ctx.beginPath(); ctx.moveTo(hx, hy + 3); ctx.bezierCurveTo(hx - 5, hy - 1, hx - 3, hy - 5, hx, hy - 2);
    ctx.bezierCurveTo(hx + 3, hy - 5, hx + 5, hy - 1, hx, hy + 3); ctx.fill();
  }
  ctx.globalAlpha = 1;
  _dvRim(ctx, -12, -28, -6, 0.45);
  ctx.restore();
}

/* ══════════ 盤の描画（マスの厚み・ベベル・観光地・建物の群れ） ══════════ */
function dkrAnchor(i){
  var r = RECTS[i], ax = r.p + r.w / 2, ay = r.q + r.h / 2;
  if(r.side === 0) ay = r.q + r.h * 0.13;
  if(r.side === 2) ay = r.q + r.h * 0.87;
  if(r.side === 1) ax = r.p + r.w * 0.87;
  if(r.side === 3) ax = r.p + r.w * 0.13;
  return { ax:ax, ay:ay, o:proj(ax, ay), r:r };
}
/* dvTile と同じ角丸（辺長の18%と7pxの小さい方） */
function dkrGeom(P){
  var A = [], B = [], n = P.length;
  for(var i = 0; i < n; i++){
    var cur = P[i], pv = P[(i + n - 1) % n], nx = P[(i + 1) % n];
    var v1x = pv.x - cur.x, v1y = pv.y - cur.y, l1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
    var v2x = nx.x - cur.x, v2y = nx.y - cur.y, l2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
    var r = Math.min(7, l1 * 0.18, l2 * 0.18);
    A.push({ x:cur.x + v1x / l1 * r, y:cur.y + v1y / l1 * r });
    B.push({ x:cur.x + v2x / l2 * r, y:cur.y + v2y / l2 * r });
  }
  return { A:A, B:B };
}
function dkrTraceAdd(ctx, P, g, dy){
  var n = P.length;
  ctx.moveTo(g.A[0].x, g.A[0].y + dy);
  for(var i = 0; i < n; i++){
    ctx.quadraticCurveTo(P[i].x, P[i].y + dy, g.B[i].x, g.B[i].y + dy);
    var a = g.A[(i + 1) % n];
    ctx.lineTo(a.x, a.y + dy);
  }
  ctx.closePath();
}
function dkrTrace(ctx, P, g, dy){ ctx.beginPath(); dkrTraceAdd(ctx, P, g, dy); }
function dkrTopCol(t){
  if(t.type === 'city') return t.tour ? (t.tour === 'pink' ? '#F6A9C9' : '#8FD8F8') : GCOL[t.g];
  if(t.type === 'card') return '#EAF0F8';
  if(t.type === 'tax') return '#D7DEE6';
  if(t.type === 'bonus') return '#F7E7B4';
  if(t.type === 'start') return '#E2E9EE';
  return '#CFE7F2';
}
/* 側面の下段（厚みを倍にして、上段＝明るい面・下段＝濃い石の2段の陰影にする）。マスより先に描く */
function dkrPlinth(ctx, i, t){
  var R = RECTS[i], q = shrinkQuad(tileQuad(i), 1), g = dkrGeom(q);
  var H = R.corner ? TILE_H + 3 : TILE_H, E = R.corner ? 9 : 7;
  var base = mixHex(toHex(dkrTopCol(t)), '#2B3446', 0.5);
  var minX = 1e9, maxX = -1e9, bot = q[0];
  q.forEach(function(p){ if(p.x < minX) minX = p.x; if(p.x > maxX) maxX = p.x; if(p.y > bot.y) bot = p; });
  var sp = Math.max(0.02, Math.min(0.98, (bot.x - minX) / Math.max(1, maxX - minX)));
  ctx.save();
  for(var j = E; j >= 0; j--){
    var f = j / E;
    var gr = ctx.createLinearGradient(minX, 0, maxX, 0);
    var cL = mixHex(base, '#0A0F1C', 0.18 + 0.30 * f), cR = mixHex(base, '#FFFFFF', Math.max(0, 0.16 - 0.14 * f));
    gr.addColorStop(0, cL); gr.addColorStop(Math.max(0, sp - 0.02), cL);
    gr.addColorStop(Math.min(1, sp + 0.02), cR); gr.addColorStop(1, cR);
    dkrTrace(ctx, q, g, H + j);
    ctx.fillStyle = gr; ctx.fill();
  }
  dkrTrace(ctx, q, g, H + 1);
  ctx.strokeStyle = 'rgba(255,244,220,.32)'; ctx.lineWidth = 1; ctx.stroke();
  dkrTrace(ctx, q, g, H + E + 0.5);
  ctx.strokeStyle = 'rgba(6,10,20,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}
/* 天面の面取り（上＝光、下＝陰）と内側の細いハイライト。マスの後に描く */
function dkrBevel(ctx, i, t){
  var q = shrinkQuad(tileQuad(i), 1), g = dkrGeom(q);
  var inner = shrinkQuad(q, 5), gi = dkrGeom(inner);
  var top = q[0], bot = q[0];
  q.forEach(function(p){ if(p.y < top.y) top = p; if(p.y > bot.y) bot = p; });
  ctx.save();
  dkrTrace(ctx, q, g, 0); ctx.clip();
  ctx.beginPath(); dkrTraceAdd(ctx, q, g, 0); dkrTraceAdd(ctx, inner, gi, 0);
  var gr = ctx.createLinearGradient(top.x, top.y, bot.x, bot.y);
  gr.addColorStop(0, 'rgba(255,255,255,.46)'); gr.addColorStop(0.46, 'rgba(255,255,255,.12)');
  gr.addColorStop(0.54, 'rgba(16,26,48,.06)'); gr.addColorStop(1, 'rgba(16,26,48,.32)');
  ctx.fillStyle = gr; ctx.fill('evenodd');
  dkrTrace(ctx, inner, gi, 0);
  ctx.strokeStyle = 'rgba(255,255,255,.30)'; ctx.lineWidth = 1; ctx.stroke();
  var rg = ctx.createRadialGradient(top.x, top.y + 16, 2, top.x, top.y + 16, 80);
  rg.addColorStop(0, 'rgba(255,255,255,.20)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg; ctx.fillRect(top.x - 90, top.y - 10, 180, 120);
  ctx.restore();
}
/* 建物の群れ：白と水色の小さな立方体（盤のキャッシュに描くので毎フレームの負担にならない） */
function dkrCube(ctx, x, y, s, col){
  var hw = s, hh = s * 0.5, hgt = s * 1.15;
  ctx.beginPath(); ctx.moveTo(x - hw, y - hgt); ctx.lineTo(x, y + hh - hgt); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath();
  ctx.fillStyle = '#BFE3F7'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y + hh - hgt); ctx.lineTo(x + hw, y - hgt); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.closePath();
  ctx.fillStyle = '#7FA9C8'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y - hh - hgt); ctx.lineTo(x + hw, y - hgt); ctx.lineTo(x, y + hh - hgt); ctx.lineTo(x - hw, y - hgt); ctx.closePath();
  ctx.fillStyle = mixHex('#FFFFFF', toHex(col), 0.16); ctx.fill();
  ctx.strokeStyle = 'rgba(20,40,64,.55)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x - hw, y - hgt); ctx.lineTo(x - hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x + hw, y); ctx.lineTo(x + hw, y - hgt);
  ctx.lineTo(x, y - hh - hgt); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,232,170,.9)';
  ctx.fillRect(x - hw * 0.62, y - hgt * 0.62, hw * 0.34, hgt * 0.26);
}
function dkrCubes(ctx, i, t){
  if(!t || t.type !== 'city' || t.tour || t.owner < 0 || t.landmark || !(t.lv >= 1)) return;
  var A = dkrAnchor(i), r = A.r;
  var along = (r.side === 0 || r.side === 2) ? 'p' : 'q', span = along === 'p' ? r.w : r.h;
  var inward = (r.side === 0 || r.side === 3) ? 1 : -1;
  var spots = [[-0.42, 6], [0.42, 6], [-0.30, 22], [0.30, 22]];
  var n = Math.min(4, t.lv + 1), col = PCOL[t.owner] || '#E14A5A';
  var pts = [];
  for(var k = 0; k < n; k++){
    var off = spots[k][0] * span, dep = spots[k][1] * inward;
    var bx = along === 'p' ? A.ax + off : A.ax + dep, by = along === 'q' ? A.ay + off : A.ay + dep;
    var o = proj(bx, by);
    pts.push({ x:o.x, y:o.y, s:5.5 + ((_dvRnd(i * 7 + k) * 2.5) | 0) + t.lv * 0.6 });
  }
  pts.sort(function(a, b){ return a.y - b.y; });
  ctx.save();
  pts.forEach(function(p){
    ctx.fillStyle = 'rgba(4,10,24,.28)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, p.s * 1.3, p.s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    dkrCube(ctx, p.x, p.y, p.s, col);
  });
  ctx.restore();
}
/* 盤平面に沿って描く（planeText と同じ座標変換） */
function dkrPlaneDo(ctx, p, q, rot, fn){
  var o = proj(p, q), c = Math.cos(rot), s = Math.sin(rot);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.transform(KX * (c - s), KY * (c + s), KX * (-s - c), KY * (-s + c), 0, 0);
  try{ fn(ctx); } finally { ctx.restore(); }
}
/* 観光地のマス：空色 #8FD8F8／ピンク #F6A9C9。「観光地」の字と通行料×倍率 */
function dkrDrawTour(ctx, G2, i, T){
  var t = G2.tiles[i], r = RECTS[i], q = tileQuad(i), sky = t.tour !== 'pink';
  var top = sky ? '#8FD8F8' : '#F6A9C9';
  dvTile(ctx, shrinkQuad(q, 1), { top:top, side:mixHex(top, '#6E8494', 0.34), h:TILE_H,
    band:sky ? '#E8F7FE' : '#FDECF3', bandQuad:bandQuad(i, 0.28), glow:null, dim:t.frozen > 0, t:T });
  var rot = SIDE_ROT[r.side], cx = r.p + r.w / 2, cy = r.q + r.h / 2, sg = outSign(r.side);
  var mw = ((r.side === 0 || r.side === 2) ? r.w : r.h) * 0.90;
  var ink = sky ? '#1C5878' : '#7A2450';
  ctx.save();
  polyPath(ctx, q); ctx.clip();
  dkrPlaneDo(ctx, cx, cy, rot, function(c2){
    c2.translate(0, -sg * 58);
    c2.globalAlpha = 0.9;
    c2.fillStyle = 'rgba(255,255,255,.78)';
    c2.strokeStyle = sky ? 'rgba(30,110,160,.55)' : 'rgba(160,50,100,.55)';
    c2.lineWidth = 1.5;
    c2.beginPath();
    if(sky){
      for(var k = 0; k < 12; k++){
        var a = k * Math.PI / 6 - Math.PI / 2, rr = (k % 2) ? 5 : 14;
        c2[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c2.closePath();
    } else {
      for(var m = 0; m < 5; m++){
        var b = m * Math.PI * 2 / 5 - Math.PI / 2;
        c2.moveTo(0, 0);
        c2.ellipse(Math.cos(b) * 7, Math.sin(b) * 7, 7, 4.6, b, 0, Math.PI * 2);
      }
    }
    c2.fill(); c2.stroke();
    c2.fillStyle = sky ? '#FFF6C8' : '#FFE08A';
    c2.beginPath(); c2.arc(0, 0, sky ? 3 : 3.4, 0, Math.PI * 2); c2.fill();
  });
  planeText(ctx, cx, cy, rot, '観光地', 13, '#FFFFFF', ink, 4, -sg * 36, mw);
  planeText(ctx, cx, cy, rot, t.name, 17, '#FFFFFF', '#2B3A47', 4.5, -sg * 13, mw);
  var mul = dkrTourMul(t, G2);
  var sub = t.owner >= 0 ? yenShort(tollOf(t, G2)) + (mul > 1 ? ' ×' + mul : '') : yenShort(t.base);
  planeText(ctx, cx, cy, rot, sub, 19, ink, null, 0, sg * 27, mw);
  ctx.restore();
  if(t.frozen > 0){
    ctx.save(); ctx.globalAlpha = 0.55; polyPath(ctx, q); ctx.fillStyle = '#BFE8FF'; ctx.fill(); ctx.restore();
  }
}
/* 持ち主のいる観光地に記念碑（ピンクは訪問数で大きくなる）。毎フレーム */
function dkrMonumentAt(ctx, G2, i, T){
  var t = G2.tiles[i], A = dkrAnchor(i);
  var col = PCOL[t.owner] || '#E14A5A';
  var grow = (t.grow === undefined ? 1 : t.grow);
  var v = Math.min(3, Math.max(0, t.visits | 0)), stg = t.tour === 'pink' ? 0 : Math.max(1, Math.min(3, dkrSkyCount(G2, t.owner)));
  var s = grow * (t.tour === 'pink' ? (0.92 + 0.12 * Math.min(2, v)) : [0.84, 1.0, 1.16][stg - 1]);
  var pulse = 0.5 + 0.5 * Math.sin(T * 0.003 + i);
  var gs = dkrMonGlow(t.tour), sp = dkrMonSprite(t.tour, t.tour === 'pink' ? v : stg, col);
  ctx.save();
  ctx.translate(A.o.x, A.o.y);
  ctx.scale(s, s);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.6 + 0.4 * pulse;
  ctx.drawImage(gs, -40, -16, 80, 32);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.drawImage(sp, -DKR_MONBOX.ox, -DKR_MONBOX.oy, DKR_MONBOX.w, DKR_MONBOX.h);
  ctx.restore();
}
/* 記念碑の作り置き（毎フレームのグラデーション作りをやめる。種類・段・持ち主の色ごとに1枚） */
var DKR_MONBOX = { w:128, h:132, ox:64, oy:112, k:1.5 };
var DKR_MON = {};
function dkrMonSprite(kind, stage, col){
  var key = kind + ':' + stage + ':' + col, c = DKR_MON[key];
  if(c) return c;
  var B = DKR_MONBOX;
  c = document.createElement('canvas');
  c.width = Math.round(B.w * B.k); c.height = Math.round(B.h * B.k);
  var x = c.getContext('2d');
  x.setTransform(B.k, 0, 0, B.k, B.ox * B.k, B.oy * B.k);
  if(kind === 'pink') dkrPinkMon(x, col, 0, stage); else dkrSkyMon(x, col, 1200, stage);
  DKR_MON[key] = c;
  return c;
}
function dkrMonGlow(kind){
  var key = 'glow:' + kind, c = DKR_MON[key];
  if(c) return c;
  c = document.createElement('canvas'); c.width = 80; c.height = 32;
  var x = c.getContext('2d'), c0 = kind === 'pink' ? '255,160,200' : '150,225,255';
  x.setTransform(1, 0, 0, 0.4, 40, 16);
  var gl = x.createRadialGradient(0, 0, 2, 0, 0, 40);
  gl.addColorStop(0, 'rgba(' + c0 + ',.5)'); gl.addColorStop(1, 'rgba(' + c0 + ',0)');
  x.fillStyle = gl; x.beginPath(); x.arc(0, 0, 40, 0, Math.PI * 2); x.fill();
  DKR_MON[key] = c;
  return c;
}

/* ══════════ フォーチュンカードの絵（200×130 の枠で描いて、canvas に合わせて拡大） ══════════ */
function dkrPoly(ctx, a){ ctx.beginPath(); ctx.moveTo(a[0], a[1]); for(var n = 2; n < a.length; n += 2) ctx.lineTo(a[n], a[n + 1]); ctx.closePath(); }
function dkrFS(ctx, fill, lw, line){
  ctx.fillStyle = fill; ctx.fill();
  if(lw){ ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = line || '#3A2410'; ctx.stroke(); }
}
function dkrLin(ctx, x0, y0, x1, y1, cs){
  var g = ctx.createLinearGradient(x0, y0, x1, y1);
  cs.forEach(function(c, n){ g.addColorStop(n / (cs.length - 1), c); });
  return g;
}
function dkrCirc(ctx, x, y, r){ ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function dkrSpark(ctx, x, y, r, col){
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(r * 0.22, -r * 0.22); ctx.lineTo(r, 0); ctx.lineTo(r * 0.22, r * 0.22);
  ctx.lineTo(0, r); ctx.lineTo(-r * 0.22, r * 0.22); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.22, -r * 0.22); ctx.closePath();
  ctx.fillStyle = col || '#FFF6C8'; ctx.fill();
  ctx.restore();
}
function dkrText(ctx, t, x, y, size, fill, line, lw){
  ctx.font = '400 ' + size + 'px "Mochiy Pop One","Noto Sans JP",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if(line){ ctx.lineWidth = lw || 5; ctx.strokeStyle = line; ctx.strokeText(t, x, y); }
  ctx.fillStyle = fill; ctx.fillText(t, x, y);
}
function dkrHouse(ctx, x, y, s, roof){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(60,30,10,.2)'; ctx.beginPath(); ctx.ellipse(0, 1, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
  dkrPoly(ctx, [-15, 0, 15, 0, 15, -20, -15, -20]); dkrFS(ctx, dkrLin(ctx, -15, 0, 15, 0, ['#FFFFFF', '#D9E2EA']), 2, '#3A2410');
  dkrPoly(ctx, [-20, -18, 0, -35, 20, -18]); dkrFS(ctx, dkrLin(ctx, 0, -35, 0, -18, [_dvToneHex(roof, 0.3), roof, _dvToneHex(roof, -0.3)]), 2, '#3A2410');
  ctx.fillStyle = '#7A4A26'; ctx.fillRect(-4, -11, 8, 11);
  ctx.fillStyle = '#FFE7A0'; ctx.fillRect(6, -15, 6, 6); ctx.fillRect(-12, -15, 6, 6);
  ctx.restore();
}
function dkrCoin(ctx, x, y, r){
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.18, r, r * 0.9, 0, 0, Math.PI * 2); ctx.fillStyle = '#9A6A08'; ctx.fill();
  dkrCirc(ctx, x, y, r); dkrFS(ctx, dkrLin(ctx, x - r, y - r, x + r, y + r, ['#FFF6C8', '#F5CE4A', '#C8901F']), 1.5, '#6B4408');
  dkrCirc(ctx, x, y, r * 0.66); ctx.strokeStyle = 'rgba(255,250,220,.8)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function dkrCoinStack(ctx, x, y, n, r){
  for(var k = 0; k < n; k++){
    var cy = y - k * r * 0.42;
    ctx.beginPath(); ctx.ellipse(x, cy + r * 0.2, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = '#A6760E'; ctx.fill();
    ctx.strokeStyle = '#6B4408'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, cy, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = dkrLin(ctx, x - r, cy, x + r, cy, ['#FFF3B8', '#F5CE4A', '#C8901F']); ctx.fill(); ctx.stroke();
  }
}
function dkrTicket(ctx, cA, cB){
  _dvRR(ctx, -74, -40, 148, 80, 12); dkrFS(ctx, dkrLin(ctx, 0, -40, 0, 40, cA), 3, cB);
  ctx.save(); ctx.globalCompositeOperation = 'destination-out';
  dkrCirc(ctx, -74, 0, 12); ctx.fill(); dkrCirc(ctx, 74, 0, 12); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-36, -34); ctx.lineTo(-36, 34); ctx.stroke(); ctx.restore();
  _dvRR(ctx, -68, -34, 136, 68, 9); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
}
function dkrHeart(ctx, x, y, s, fill){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-26, -2, -16, -24, 0, -10); ctx.bezierCurveTo(16, -24, 26, -2, 0, 14); ctx.closePath();
  dkrFS(ctx, fill || dkrLin(ctx, 0, -20, 0, 14, ['#FF9AB0', '#E8304E', '#A81632']), 2.2, '#5A0A18');
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-8, -8, 4, 2.4, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function dkrCardArt(ctx, w, h, id){
  var s = Math.min(w / 200, h / 130);
  ctx.save();
  ctx.translate((w - 200 * s) / 2, (h - 130 * s) / 2);
  ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  var ink = '#3A2410', k, a;
  id = { invite:'travel', coupon:'halfToll', festhost:'fest', festsee:'fest', taxgo:'tax', pay2:'gouge' }[id] || id;
  if(id === 'fsell'){
    dkrHouse(ctx, 84, 112, 1.9, '#E4432E');
    ctx.save(); ctx.translate(84, 84); ctx.rotate(-0.22);
    _dvRR(ctx, -34, -12, 68, 24, 5); ctx.lineWidth = 4; ctx.strokeStyle = '#D01E12'; ctx.stroke();
    dkrText(ctx, 'SOLD', 0, 1, 17, '#D01E12'); ctx.restore();
    dkrPoly(ctx, [118, 44, 126, 30, 128, 46, 142, 40, 132, 52, 146, 58, 130, 60, 134, 74, 122, 62, 112, 70, 114, 56, 100, 52]);
    dkrFS(ctx, dkrLin(ctx, 100, 30, 146, 74, ['#FFF6C8', '#FFD24D']), 2, '#B8860B');
    ctx.save(); ctx.translate(152, 34); ctx.rotate(-0.75);
    _dvRR(ctx, -5, 0, 10, 62, 4); dkrFS(ctx, dkrLin(ctx, -5, 0, 5, 0, ['#C8864A', '#7A4A1E']), 2, ink);
    _dvRR(ctx, -26, -16, 52, 26, 7); dkrFS(ctx, dkrLin(ctx, 0, -16, 0, 10, ['#D89A5A', '#8A4E1E', '#5A2E0E']), 2.5, ink);
    ctx.fillStyle = '#F2C230'; ctx.fillRect(-26, -16, 7, 26); ctx.fillRect(19, -16, 7, 26);
    ctx.restore();
  } else if(id === 'swap'){
    dkrHouse(ctx, 50, 112, 1.5, '#3E8FE0');
    dkrHouse(ctx, 150, 112, 1.5, '#E4432E');
    var arc = function(x0, y0, cx0, cy0, x1, y1, col, hx, hy, ang){
      ctx.lineWidth = 13; ctx.strokeStyle = ink;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx0, cy0, x1, y1); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = col; ctx.stroke();
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
      dkrPoly(ctx, [0, -13, 16, 0, 0, 13]); dkrFS(ctx, col, 2.5, ink); ctx.restore();
    };
    arc(62, 48, 100, 2, 132, 40, '#F5A43A', 136, 44, 0.9);
    arc(138, 82, 100, 124, 68, 88, '#5FBF3A', 64, 84, 3.9);
  } else if(id === 'dark'){
    var bg = ctx.createRadialGradient(100, 70, 6, 100, 70, 70);
    bg.addColorStop(0, 'rgba(60,70,120,.85)'); bg.addColorStop(1, 'rgba(20,24,50,0)');
    ctx.fillStyle = bg; dkrCirc(ctx, 100, 70, 70); ctx.fill();
    [[46, 54, 30, 64], [80, 34, 38, 84], [122, 60, 32, 58]].forEach(function(b, n){
      ctx.beginPath(); ctx.rect(b[0], b[1], b[2], b[3]); dkrFS(ctx, dkrLin(ctx, b[0], 0, b[0] + b[2], 0, ['#34466E', '#1C2744']), 2, '#0B1226');
      for(var r2 = 0; r2 < 5; r2++) for(var c2 = 0; c2 < 2; c2++){
        ctx.fillStyle = (n === 1 && r2 === 1 && c2 === 0) ? 'rgba(255,220,140,.5)' : '#475A84';
        ctx.fillRect(b[0] + 6 + c2 * (b[2] / 2 - 2), b[1] + 8 + r2 * 11, 7, 6);
      }
    });
    dkrPoly(ctx, [118, 4, 86, 62, 106, 62, 90, 124, 142, 46, 118, 46, 136, 4]);
    dkrFS(ctx, dkrLin(ctx, 86, 4, 142, 124, ['#FFFBD0', '#FFE14A', '#F59A1A']), 3, '#6B3A04');
    dkrSpark(ctx, 60, 30, 9); dkrSpark(ctx, 160, 88, 8); dkrSpark(ctx, 150, 22, 6);
  } else if(id === 'angel'){
    var gl = ctx.createRadialGradient(100, 70, 4, 100, 70, 72);
    gl.addColorStop(0, 'rgba(255,252,220,.95)'); gl.addColorStop(1, 'rgba(255,252,220,0)');
    ctx.fillStyle = gl; dkrCirc(ctx, 100, 70, 72); ctx.fill();
    var wing = function(){
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-20, -34, -62, -44, -82, -20); ctx.bezierCurveTo(-68, -16, -64, -8, -74, -2);
      ctx.bezierCurveTo(-60, 2, -56, 8, -64, 14); ctx.bezierCurveTo(-46, 18, -30, 18, 0, 10); ctx.closePath();
      dkrFS(ctx, dkrLin(ctx, -80, -30, 0, 14, ['#FFFFFF', '#E6F2FF', '#B8D4F0']), 2.5, '#5A7AA0');
      ctx.strokeStyle = 'rgba(90,122,160,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-10, 2); ctx.quadraticCurveTo(-40, -8, -66, -4);
      ctx.moveTo(-8, 8); ctx.quadraticCurveTo(-36, 6, -58, 12); ctx.stroke();
    };
    ctx.save(); ctx.translate(98, 80); wing(); ctx.restore();
    ctx.save(); ctx.translate(102, 80); ctx.scale(-1, 1); wing(); ctx.restore();
    dkrHeart(ctx, 100, 82, 1.1);
    ctx.save(); ctx.shadowColor = 'rgba(255,210,80,.9)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.ellipse(100, 28, 26, 8, 0, 0, Math.PI * 2);
    ctx.lineWidth = 7; ctx.strokeStyle = '#F5CE4A'; ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(100, 28, 26, 8, 0, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#FFF6C8'; ctx.stroke();
  } else if(id === 'halfToll' || id === 'halfBuyout'){
    ctx.save(); ctx.translate(100, 66); ctx.rotate(-0.12);
    if(id === 'halfToll') dkrTicket(ctx, ['#FFD27A', '#F59A1A', '#C8600E'], '#7A3A06');
    else dkrTicket(ctx, ['#D8C0FF', '#9A6AE8', '#5E34B0'], '#2E1466');
    if(id === 'halfToll'){ dkrCoin(ctx, -56, 0, 13); dkrText(ctx, '50%', 20, -6, 38, '#FFFFFF', '#7A3A06', 7); dkrText(ctx, 'OFF', 20, 24, 17, '#FFF3D6', '#7A3A06', 4); }
    else { dkrHouse(ctx, -55, 14, 0.9, '#E4432E'); dkrText(ctx, '½', 22, -2, 50, '#FFFFFF', '#2E1466', 7); dkrText(ctx, '買収', 22, 28, 15, '#F2E8FF', '#2E1466', 4); }
    ctx.restore();
    dkrSpark(ctx, 170, 22, 8); dkrSpark(ctx, 30, 110, 7);
  } else if(id === 'escape'){
    ctx.save(); ctx.translate(100, 70); ctx.rotate(0.1);
    dkrTicket(ctx, ['#FFF3C8', '#F2C230', '#B8862A'], '#6B4408');
    dkrText(ctx, 'EXIT', 26, 0, 30, '#FFFFFF', '#6B4408', 6);
    ctx.restore();
    ctx.save(); ctx.translate(62, 64); ctx.rotate(-0.5);
    dkrCirc(ctx, -18, 0, 15); dkrFS(ctx, dkrLin(ctx, -30, -12, -6, 12, ['#FFF6C8', '#E0AE3A', '#8A6206']), 2.5, '#4A3004');
    ctx.globalCompositeOperation = 'destination-out'; dkrCirc(ctx, -18, 0, 6); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    dkrCirc(ctx, -18, 0, 6); ctx.strokeStyle = '#4A3004'; ctx.lineWidth = 2; ctx.stroke();
    dkrPoly(ctx, [-4, -4, 40, -4, 40, 4, -4, 4]); dkrFS(ctx, '#E0AE3A', 2, '#4A3004');
    dkrPoly(ctx, [28, 4, 34, 4, 34, 14, 28, 14]); dkrFS(ctx, '#E0AE3A', 2, '#4A3004');
    dkrPoly(ctx, [18, 4, 24, 4, 24, 11, 18, 11]); dkrFS(ctx, '#E0AE3A', 2, '#4A3004');
    ctx.restore();
  } else if(id === 'travel'){
    ctx.save();
    dkrCirc(ctx, 96, 104, 44); ctx.save(); ctx.clip();
    ctx.fillStyle = dkrLin(ctx, 52, 60, 140, 148, ['#9FE3FF', '#3E97E6', '#1656A8']); ctx.fillRect(40, 50, 120, 110);
    ctx.fillStyle = '#6DC848';
    ctx.beginPath(); ctx.ellipse(78, 92, 20, 12, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(118, 118, 18, 10, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(100, 74, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(96, 104, 44, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    dkrCirc(ctx, 96, 104, 44); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0B2C5E'; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.moveTo(24, 70); ctx.quadraticCurveTo(60, 14, 126, 36); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(146, 40); ctx.rotate(-0.28);
    dkrPoly(ctx, [-6, -2, 12, -26, 20, -26, 10, -2]); dkrFS(ctx, '#D8E6F2', 2, '#2A3A4E');
    dkrPoly(ctx, [-6, 2, 12, 24, 20, 24, 10, 2]); dkrFS(ctx, '#B8CCDE', 2, '#2A3A4E');
    ctx.beginPath(); ctx.ellipse(0, 0, 36, 8, 0, 0, Math.PI * 2); dkrFS(ctx, dkrLin(ctx, 0, -8, 0, 8, ['#FFFFFF', '#DCE8F2']), 2, '#2A3A4E');
    dkrPoly(ctx, [-30, -2, -38, -18, -30, -18, -22, -4]); dkrFS(ctx, '#3E8FE0', 2, '#2A3A4E');
    ctx.fillStyle = '#3E8FE0'; for(k = 0; k < 5; k++){ dkrCirc(ctx, -12 + k * 8, -1, 1.8); ctx.fill(); }
    ctx.restore();
  } else if(id === 'start'){
    ctx.save();
    ctx.fillStyle = dkrLin(ctx, 56, 0, 64, 0, ['#FFF3C8', '#A9761A']); ctx.fillRect(56, 18, 7, 100);
    dkrCirc(ctx, 59.5, 16, 5); dkrFS(ctx, '#F5D36B', 1.5, '#6B4408');
    ctx.beginPath(); ctx.moveTo(63, 22); ctx.bezierCurveTo(90, 10, 116, 34, 150, 22); ctx.lineTo(150, 72);
    ctx.bezierCurveTo(116, 84, 90, 60, 63, 72); ctx.closePath();
    ctx.save(); ctx.clip();
    for(var yy = 0; yy < 6; yy++) for(var xx = 0; xx < 8; xx++){
      ctx.fillStyle = ((xx + yy) % 2) ? '#1A1A22' : '#FFFFFF';
      ctx.fillRect(63 + xx * 11.5, 8 + yy * 13 + Math.sin(xx * 0.9) * 5, 11.6, 13.2);
    }
    ctx.restore();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#1A1A22'; ctx.stroke();
    _dvRR(ctx, 70, 96, 110, 26, 8); dkrFS(ctx, dkrLin(ctx, 0, 96, 0, 122, ['#8FD2FF', '#2E8BE0', '#1656A8']), 2.5, '#0B2C5E');
    dkrText(ctx, 'START', 125, 110, 17, '#FFFFFF', '#0B2C5E', 4);
    ctx.restore();
  } else if(id === 'island'){
    var sun = ctx.createRadialGradient(40, 32, 2, 40, 32, 26);
    sun.addColorStop(0, '#FFF6C8'); sun.addColorStop(0.5, '#FFD24D'); sun.addColorStop(1, 'rgba(255,210,77,0)');
    ctx.fillStyle = sun; dkrCirc(ctx, 40, 32, 26); ctx.fill();
    ctx.beginPath(); ctx.ellipse(100, 104, 92, 24, 0, 0, Math.PI * 2); dkrFS(ctx, dkrLin(ctx, 0, 80, 0, 128, ['#8FE0F0', '#2E9AC8']), 2, '#155A7A');
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
    [[30, 110], [150, 116], [60, 120]].forEach(function(p2){ ctx.beginPath(); ctx.moveTo(p2[0], p2[1]); ctx.quadraticCurveTo(p2[0] + 8, p2[1] - 5, p2[0] + 16, p2[1]); ctx.stroke(); });
    ctx.beginPath(); ctx.ellipse(104, 98, 46, 13, 0, 0, Math.PI * 2); dkrFS(ctx, dkrLin(ctx, 0, 86, 0, 110, ['#FFF0C0', '#E8C27A']), 2, '#9A6A2A');
    ctx.lineWidth = 8; ctx.strokeStyle = '#7A4A1E';
    ctx.beginPath(); ctx.moveTo(100, 96); ctx.quadraticCurveTo(104, 64, 120, 42); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#A8703E'; ctx.stroke();
    for(k = 0; k < 5; k++){
      a = -2.6 + k * 0.62;
      ctx.save(); ctx.translate(120, 42); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -12, 38, 2); ctx.quadraticCurveTo(18, -2, 0, 0);
      dkrFS(ctx, dkrLin(ctx, 0, -10, 38, 2, ['#9BE06A', '#3E9A2A']), 2, '#1E5A12'); ctx.restore();
    }
    dkrCirc(ctx, 116, 48, 4); dkrFS(ctx, '#7A4A1E'); dkrCirc(ctx, 124, 47, 4); dkrFS(ctx, '#7A4A1E');
  } else if(id === 'fest'){
    ctx.strokeStyle = '#6B4A26'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(10, 24); ctx.quadraticCurveTo(100, 44, 190, 24); ctx.stroke();
    var pc = ['#E4432E', '#F2C230', '#3E8FE0', '#5FBF3A', '#D068B8'];
    for(k = 0; k < 9; k++){
      var px = 18 + k * 20, py = 24 + Math.sin((k + 0.5) / 9 * Math.PI) * 17;
      dkrPoly(ctx, [px - 6, py, px + 6, py, px, py + 12]); dkrFS(ctx, pc[k % 5], 1, 'rgba(0,0,0,.35)');
    }
    [[40, 56, '#FF8FB8'], [160, 52, '#FFD24D'], [100, 36, '#8FE0FF']].forEach(function(f){
      ctx.save(); ctx.translate(f[0], f[1]); ctx.strokeStyle = f[2]; ctx.lineWidth = 3;
      for(var r3 = 0; r3 < 12; r3++){ var an = r3 * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(an) * 6, Math.sin(an) * 6); ctx.lineTo(Math.cos(an) * 18, Math.sin(an) * 18); ctx.stroke(); }
      ctx.fillStyle = '#FFFFFF'; dkrCirc(ctx, 0, 0, 3); ctx.fill(); ctx.restore();
    });
    ctx.save();
    dkrPoly(ctx, [56, 120, 100, 62, 144, 120]); ctx.save(); ctx.clip();
    for(k = 0; k < 8; k++){ ctx.fillStyle = (k % 2) ? '#FFFFFF' : '#E4432E'; ctx.fillRect(56 + k * 11, 60, 11, 62); }
    ctx.restore();
    dkrPoly(ctx, [56, 120, 100, 62, 144, 120]); ctx.lineWidth = 2.5; ctx.strokeStyle = '#5A0A06'; ctx.stroke();
    dkrPoly(ctx, [92, 120, 100, 100, 108, 120]); dkrFS(ctx, '#5A1A12');
    ctx.strokeStyle = '#6B4408'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(100, 62); ctx.lineTo(100, 46); ctx.stroke();
    dkrPoly(ctx, [100, 46, 114, 50, 100, 55]); dkrFS(ctx, '#F2C230', 1.2, '#6B4408');
    ctx.restore();
  } else if(id === 'tax'){
    ctx.beginPath(); ctx.rect(34, 108, 132, 10); dkrFS(ctx, '#C9CED8', 2, '#3A4050');
    ctx.beginPath(); ctx.rect(42, 100, 116, 9); dkrFS(ctx, '#DDE2EA', 2, '#3A4050');
    [56, 82, 108, 134].forEach(function(x){
      ctx.beginPath(); ctx.rect(x - 1, 54, 12, 46); dkrFS(ctx, dkrLin(ctx, x, 0, x + 12, 0, ['#FFFFFF', '#C6CEDA']), 1.8, '#3A4050');
    });
    ctx.beginPath(); ctx.rect(42, 46, 116, 10); dkrFS(ctx, '#E8ECF2', 2, '#3A4050');
    dkrPoly(ctx, [36, 46, 100, 12, 164, 46]); dkrFS(ctx, dkrLin(ctx, 0, 12, 0, 46, ['#FFFFFF', '#D2D8E2']), 2.2, '#3A4050');
    dkrCirc(ctx, 100, 34, 10); dkrFS(ctx, dkrLin(ctx, 90, 24, 110, 44, ['#FFF6C8', '#E0AE3A']), 1.8, '#6B4408');
    dkrText(ctx, '税', 100, 35, 12, '#6B3A08');
    dkrCoin(ctx, 168, 96, 12); dkrCoin(ctx, 180, 84, 10);
  } else if(id === 'donate'){
    dkrHeart(ctx, 100, 60, 2.4);
    dkrCoin(ctx, 46, 100, 13); dkrCoin(ctx, 154, 100, 13); dkrCoin(ctx, 100, 112, 11);
    dkrSpark(ctx, 150, 26, 9); dkrSpark(ctx, 52, 30, 7);
  } else if(id === 'gouge'){
    ctx.beginPath(); ctx.moveTo(84, 40); ctx.bezierCurveTo(40, 60, 44, 122, 100, 122); ctx.bezierCurveTo(156, 122, 160, 60, 116, 40); ctx.closePath();
    dkrFS(ctx, dkrLin(ctx, 50, 40, 150, 122, ['#E8B86A', '#B8742A', '#7A4414']), 3, '#4A2408');
    dkrPoly(ctx, [84, 40, 76, 22, 92, 28, 100, 16, 108, 28, 124, 22, 116, 40]); dkrFS(ctx, '#C8864A', 2.5, '#4A2408');
    ctx.beginPath(); ctx.ellipse(100, 40, 18, 5, 0, 0, Math.PI * 2); dkrFS(ctx, '#E0303C', 2, '#5A0A10');
    dkrText(ctx, '×2', 100, 86, 34, '#FFE14A', '#4A2408', 7);
    dkrCoin(ctx, 44, 112, 11); dkrCoin(ctx, 160, 110, 12);
    dkrSpark(ctx, 150, 36, 9); dkrSpark(ctx, 46, 50, 7);
  } else if(id === 'shield'){
    var sg = ctx.createRadialGradient(100, 66, 6, 100, 66, 74);
    sg.addColorStop(0, 'rgba(210,236,255,.95)'); sg.addColorStop(1, 'rgba(210,236,255,0)');
    ctx.fillStyle = sg; dkrCirc(ctx, 100, 66, 74); ctx.fill();
    var shp = function(s){
      ctx.beginPath(); ctx.moveTo(100, 66 - 54 * s);
      ctx.bezierCurveTo(100 + 30 * s, 66 - 44 * s, 100 + 50 * s, 66 - 46 * s, 100 + 58 * s, 66 - 48 * s);
      ctx.bezierCurveTo(100 + 58 * s, 66 + 6 * s, 100 + 38 * s, 66 + 38 * s, 100, 66 + 56 * s);
      ctx.bezierCurveTo(100 - 38 * s, 66 + 38 * s, 100 - 58 * s, 66 + 6 * s, 100 - 58 * s, 66 - 48 * s);
      ctx.bezierCurveTo(100 - 50 * s, 66 - 46 * s, 100 - 30 * s, 66 - 44 * s, 100, 66 - 54 * s); ctx.closePath();
    };
    shp(1); dkrFS(ctx, dkrLin(ctx, 42, 12, 158, 122, ['#FFFFFF', '#9FD0F5', '#2E7FD0', '#123E80']), 4, '#0B2C5E');
    shp(0.78); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
    ctx.save(); ctx.translate(100, 62); ctx.beginPath();
    for(k = 0; k < 10; k++){ var rs = (k % 2) ? 10 : 24, as = k * Math.PI / 5 - Math.PI / 2; ctx[k ? 'lineTo' : 'moveTo'](Math.cos(as) * rs, Math.sin(as) * rs); }
    ctx.closePath(); dkrFS(ctx, dkrLin(ctx, 0, -24, 0, 24, ['#FFF6C8', '#F5CE4A', '#C8901F']), 2.5, '#6B4408'); ctx.restore();
    dkrSpark(ctx, 160, 26, 9); dkrSpark(ctx, 38, 34, 7);
  } else if(id === 'bonusgo'){
    var die = function(x, y, s, r, dots){
      ctx.save(); ctx.translate(x, y); ctx.rotate(r);
      _dvRR(ctx, -s, -s, s * 2, s * 2, s * 0.35);
      dkrFS(ctx, dkrLin(ctx, -s, -s, s, s, ['#FFFFFF', '#E6ECF4', '#B8C4D4']), 2.5, '#3A4050');
      ctx.fillStyle = '#E4432E';
      dots.forEach(function(d2){ dkrCirc(ctx, d2[0] * s, d2[1] * s, s * 0.17); ctx.fill(); });
      ctx.restore();
    };
    die(74, 72, 26, -0.25, [[-0.5, -0.5], [0, 0], [0.5, 0.5]]);
    die(128, 64, 24, 0.3, [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]);
    dkrCoin(ctx, 40, 108, 12); dkrCoin(ctx, 160, 106, 13); dkrCoin(ctx, 100, 114, 11);
    dkrText(ctx, 'BONUS', 100, 22, 20, '#FFE14A', '#6B3A04', 5);
    dkrSpark(ctx, 172, 40, 8);
  } else if(id === 'quake'){
    ctx.fillStyle = dkrLin(ctx, 0, 84, 0, 128, ['#C89A68', '#7A5230']); ctx.fillRect(12, 86, 176, 38);
    ctx.strokeStyle = '#3A2410'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(60, 86); ctx.lineTo(74, 100); ctx.lineTo(66, 110); ctx.lineTo(84, 124);
    ctx.moveTo(132, 86); ctx.lineTo(120, 102); ctx.lineTo(136, 114); ctx.stroke();
    ctx.save(); ctx.translate(100, 90); ctx.rotate(0.18); dkrHouse(ctx, 0, 0, 1.6, '#E4432E'); ctx.restore();
    ctx.strokeStyle = 'rgba(90,50,20,.7)'; ctx.lineWidth = 3;
    [[40, 40], [158, 44]].forEach(function(q){ ctx.beginPath(); ctx.moveTo(q[0] - 10, q[1]); ctx.lineTo(q[0] - 4, q[1] - 8); ctx.lineTo(q[0] + 2, q[1]); ctx.lineTo(q[0] + 8, q[1] - 8); ctx.stroke(); });
    ctx.fillStyle = '#9A7048';
    [[30, 78], [170, 80], [52, 66], [148, 68]].forEach(function(q){ dkrCirc(ctx, q[0], q[1], 4); ctx.fill(); });
  } else if(id === 'sand'){
    for(k = 0; k < 6; k++){
      var ty = 20 + k * 17, tw = 66 - k * 11;
      ctx.beginPath(); ctx.ellipse(100 + Math.sin(k * 1.3) * 8, ty, tw, 6 + (5 - k) * 0.6, 0, 0, Math.PI * 2);
      ctx.lineWidth = 6; ctx.strokeStyle = ['#F2D08A', '#E8B868', '#DCA052', '#D08C40', '#C27A30', '#B06A24'][k]; ctx.stroke();
    }
    ctx.fillStyle = 'rgba(176,112,40,.55)';
    [[30, 60, 3], [170, 50, 4], [150, 96, 3], [44, 100, 4], [64, 30, 2], [140, 24, 3]].forEach(function(q){ dkrCirc(ctx, q[0], q[1], q[2]); ctx.fill(); });
    dkrHouse(ctx, 162, 124, 0.9, '#3E8FE0');
  } else if(id === 'plague'){
    var vir = function(x, y, r, c1, c2){
      ctx.save(); ctx.translate(x, y);
      for(var s2 = 0; s2 < 8; s2++){
        var a3 = s2 * Math.PI / 4;
        ctx.beginPath(); ctx.moveTo(Math.cos(a3) * r, Math.sin(a3) * r); ctx.lineTo(Math.cos(a3) * (r + 8), Math.sin(a3) * (r + 8));
        ctx.lineWidth = 3; ctx.strokeStyle = c2; ctx.stroke();
        dkrCirc(ctx, Math.cos(a3) * (r + 9), Math.sin(a3) * (r + 9), 3.2); ctx.fillStyle = c2; ctx.fill();
      }
      dkrCirc(ctx, 0, 0, r); dkrFS(ctx, dkrLin(ctx, -r, -r, r, r, [c1, c2]), 2, '#1E4A10');
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.18, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1E3A10'; dkrCirc(ctx, -r * 0.3, -r * 0.05, r * 0.12); ctx.fill(); dkrCirc(ctx, r * 0.3, -r * 0.05, r * 0.12); ctx.fill();
      ctx.restore();
    };
    dkrHouse(ctx, 100, 124, 1.5, '#8F6BC8');
    vir(54, 50, 20, '#C8F07A', '#5FAE2A'); vir(148, 40, 16, '#E6F7A0', '#7AB83A'); vir(152, 94, 12, '#C8F07A', '#5FAE2A');
  } else if(id === 'meteor'){
    ctx.save(); ctx.translate(122, 58); ctx.rotate(-0.62);
    var mt = ctx.createLinearGradient(0, 0, 110, 0);
    mt.addColorStop(0, 'rgba(255,200,80,.95)'); mt.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = mt; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(110, -5); ctx.lineTo(110, 5); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill();
    ctx.restore();
    dkrCirc(ctx, 118, 62, 18); dkrFS(ctx, dkrLin(ctx, 104, 48, 134, 78, ['#B08A6A', '#6A4A30', '#3A2616']), 2.5, '#1E120A');
    ctx.fillStyle = 'rgba(0,0,0,.25)'; dkrCirc(ctx, 112, 58, 4); ctx.fill(); dkrCirc(ctx, 124, 68, 3); ctx.fill();
    ctx.save(); ctx.translate(70, 122); ctx.rotate(-0.12); dkrHouse(ctx, 0, 0, 1.4, '#3E8FE0'); ctx.restore();
    dkrSpark(ctx, 98, 88, 10, '#FFE7A0'); dkrSpark(ctx, 86, 76, 6, '#FFF6C8');
  } else if(id === 'citygive'){
    dkrHouse(ctx, 64, 114, 1.6, '#E4432E');
    ctx.save(); ctx.translate(64, 58);
    ctx.beginPath(); ctx.ellipse(-10, 0, 11, 7, -0.5, 0, Math.PI * 2); ctx.ellipse(10, 0, 11, 7, 0.5, 0, Math.PI * 2);
    dkrFS(ctx, '#FFD24D', 2, '#8A5A08'); dkrCirc(ctx, 0, 0, 5); dkrFS(ctx, '#F5A43A', 2, '#8A5A08');
    ctx.restore();
    ctx.lineWidth = 11; ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(104, 80); ctx.quadraticCurveTo(128, 54, 150, 70); ctx.stroke();
    ctx.lineWidth = 7; ctx.strokeStyle = '#5FBF3A'; ctx.stroke();
    ctx.save(); ctx.translate(154, 74); ctx.rotate(0.7); dkrPoly(ctx, [0, -12, 16, 0, 0, 12]); dkrFS(ctx, '#5FBF3A', 2.5, ink); ctx.restore();
    dkrHeart(ctx, 164, 108, 0.9);
    dkrSpark(ctx, 150, 30, 8);
  } else {
    dkrCoinStack(ctx, 66, 112, 5, 17);
    dkrCoinStack(ctx, 100, 116, 8, 18);
    dkrCoinStack(ctx, 136, 112, 4, 17);
    dkrCoin(ctx, 44, 44, 13); dkrCoin(ctx, 160, 34, 12);
    dkrSpark(ctx, 120, 20, 9); dkrSpark(ctx, 70, 26, 7); dkrSpark(ctx, 174, 72, 6);
  }
  ctx.restore();
}

/* ══════════ ボーナスゲームの舞台（洞窟・2つの通路・逃げる人・悪夢の目） ══════════ */
function dkrMiniRunner(ctx, x, y, s, run, k){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
  var st = run ? Math.sin(k * Math.PI * 8) * 6 : 0;
  ctx.strokeStyle = '#2A1020'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(-7 - st, 0); ctx.moveTo(5, -12); ctx.lineTo(7 + st, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.bezierCurveTo(-18, -44, -22, -20, -20, -10); ctx.lineTo(20, -10); ctx.bezierCurveTo(22, -20, 18, -44, 0, -52); ctx.closePath();
  dkrFS(ctx, dkrLin(ctx, -20, -52, 20, -10, ['#D2507E', '#8E2A4A', '#4A0E24']), 2, '#1E0612');
  dkrCirc(ctx, 0, -54, 11); dkrFS(ctx, dkrLin(ctx, 0, -65, 0, -43, ['#FFEEDC', '#F2C8A8']), 2, '#3A1A12');
  ctx.beginPath(); ctx.arc(0, -55, 13, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 6; ctx.strokeStyle = '#8E2A4A'; ctx.stroke();
  ctx.fillStyle = '#2A1020'; dkrCirc(ctx, -4, -54, 1.8); ctx.fill(); dkrCirc(ctx, 4, -54, 1.8); ctx.fill();
  var lg = ctx.createRadialGradient(18, -26, 1, 18, -26, 18);
  lg.addColorStop(0, 'rgba(255,240,170,1)'); lg.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = lg; dkrCirc(ctx, 18, -26, 18); ctx.fill();
  _dvRR(ctx, 14, -32, 8, 11, 2); dkrFS(ctx, '#FFE7A0', 1.5, '#6B4408');
  ctx.restore();
}
function dkrMiniDraw(ctx, w, h, st, T){
  st = st || { mode:'idle', side:'L', k:0 };
  var s = Math.max(w / 440, h / 240);
  ctx.save();
  ctx.translate((w - 440 * s) / 2, (h - 240 * s) / 2);
  ctx.scale(s, s);
  var bg = ctx.createLinearGradient(0, 0, 0, 240);
  bg.addColorStop(0, '#2C1644'); bg.addColorStop(0.6, '#1A0C2A'); bg.addColorStop(1, '#0C0614');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 440, 240);
  ctx.fillStyle = '#140A20';
  dkrPoly(ctx, [0, 0, 440, 0, 440, 30, 400, 44, 360, 26, 310, 40, 260, 22, 210, 38, 160, 20, 110, 42, 60, 24, 0, 40]); ctx.fill();
  ctx.strokeStyle = 'rgba(190,130,230,.35)'; ctx.lineWidth = 2; ctx.stroke();
  for(var e = 0; e < 3; e++){
    var ex = [160, 280, 222][e], ey = [66, 58, 46][e];
    var bl = 0.45 + 0.55 * Math.abs(Math.sin((T || 0) * 0.0015 + e * 1.7));
    ctx.save(); ctx.shadowColor = 'rgba(255,60,90,.9)'; ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(255,70,100,' + (0.55 * bl).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(ex - 7, ey, 4, 2.2, 0.2, 0, Math.PI * 2); ctx.ellipse(ex + 7, ey, 4, 2.2, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  var fl = ctx.createRadialGradient(220, 250, 20, 220, 250, 250);
  fl.addColorStop(0, '#4A2A3E'); fl.addColorStop(1, 'rgba(20,10,24,0)');
  ctx.fillStyle = fl; ctx.fillRect(0, 150, 440, 90);
  var tunnel = function(cx, col, lit){
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, 132, 62, 82, 0, 0, Math.PI * 2);
    ctx.fillStyle = dkrLin(ctx, cx - 62, 50, cx + 62, 214, ['#4A3A5A', '#2A1E36', '#140C1C']); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, 138, 44, 66, 0, 0, Math.PI * 2);
    var ig = ctx.createRadialGradient(cx, 150, 4, cx, 140, 70);
    ig.addColorStop(0, lit ? '#FFFBE0' : '#05020A'); ig.addColorStop(0.5, lit ? 'rgba(255,230,150,.9)' : '#0A0512'); ig.addColorStop(1, '#1A1024');
    ctx.fillStyle = ig; ctx.fill();
    ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
  };
  var litL = st.mode === 'win' && st.side === 'L', litR = st.mode === 'win' && st.side === 'R';
  tunnel(92, '#4FE0C0', litL);
  tunnel(348, '#B58CFF', litR);
  ctx.save(); ctx.translate(92, 34); dkrPoly(ctx, [10, -10, 10, 10, -8, 0]); dkrFS(ctx, '#8FF0D8', 2, '#0E3A30'); ctx.restore();
  ctx.save(); ctx.translate(348, 34); dkrPoly(ctx, [-10, -10, -10, 10, 8, 0]); dkrFS(ctx, '#D2B8FF', 2, '#2A1466'); ctx.restore();
  [[26, 78], [414, 78]].forEach(function(tp, n){
    ctx.fillStyle = '#5A3A22'; ctx.fillRect(tp[0] - 3, tp[1], 6, 26);
    var fk = 1 + 0.12 * Math.sin((T || 0) * 0.02 + n * 2);
    var tg = ctx.createRadialGradient(tp[0], tp[1] - 6, 1, tp[0], tp[1] - 6, 30);
    tg.addColorStop(0, 'rgba(255,210,120,.65)'); tg.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = tg; dkrCirc(ctx, tp[0], tp[1] - 6, 30); ctx.fill();
    ctx.save(); ctx.translate(tp[0], tp[1]); ctx.scale(1, fk);
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(10, -6, 0, 0); ctx.quadraticCurveTo(-10, -6, 0, -24);
    ctx.fillStyle = dkrLin(ctx, 0, -24, 0, 0, ['#FFF6C8', '#FFB84A', '#E0501C']); ctx.fill(); ctx.restore();
  });
  var dir = st.side === 'R' ? 1 : -1, k = Math.max(0, Math.min(1, st.k || 0));
  if(st.mode === 'win'){
    var cxw = st.side === 'R' ? 348 : 92;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for(var r = 0; r < 10; r++){
      var an = r / 10 * Math.PI * 2 + k * 0.6;
      ctx.fillStyle = 'rgba(255,236,170,' + (0.16 * (1 - k * 0.3)).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(cxw, 138); ctx.lineTo(cxw + Math.cos(an) * 220, 138 + Math.sin(an) * 220);
      ctx.lineTo(cxw + Math.cos(an + 0.16) * 220, 138 + Math.sin(an + 0.16) * 220); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    dkrMiniRunner(ctx, cxw - dir * 10, 200, 0.95 - 0.15 * k, false, 0);
    dkrSpark(ctx, cxw - 50, 70, 10); dkrSpark(ctx, cxw + 46, 90, 8); dkrSpark(ctx, cxw - 20, 40, 7);
  } else if(st.mode === 'lose'){
    var cxl = st.side === 'R' ? 348 : 92;
    dkrMiniRunner(ctx, cxl - dir * 18, 204, 0.9, false, 0);
    ctx.save();
    var mo = -60 + 70 * k;
    ctx.fillStyle = 'rgba(8,2,10,.92)';
    ctx.beginPath(); ctx.moveTo(cxl - 150, -10); ctx.quadraticCurveTo(cxl, mo + 140, cxl + 150, -10); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'rgba(255,40,70,1)'; ctx.shadowBlur = 16; ctx.fillStyle = '#FF3A5A';
    ctx.beginPath(); ctx.ellipse(cxl - 30, mo + 70, 16, 8, 0.3, 0, Math.PI * 2); ctx.ellipse(cxl + 30, mo + 70, 16, 8, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1A0612'; ctx.strokeStyle = '#6A1030'; ctx.lineWidth = 2;
    [-60, 60].forEach(function(dx){
      ctx.beginPath(); ctx.moveTo(cxl + dx, mo + 80); ctx.quadraticCurveTo(cxl + dx * 1.1, mo + 140, cxl + dx * 0.6, mo + 168);
      ctx.quadraticCurveTo(cxl + dx * 0.8, mo + 130, cxl + dx * 0.7, mo + 84); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
    var rv = ctx.createRadialGradient(220, 120, 80, 220, 120, 280);
    rv.addColorStop(0, 'rgba(200,0,30,0)'); rv.addColorStop(1, 'rgba(200,0,30,' + (0.45 * k).toFixed(3) + ')');
    ctx.fillStyle = rv; ctx.fillRect(0, 0, 440, 240);
  } else {
    var x = 220 + (st.mode === 'run' ? dir * 120 * k : 0);
    var sc = st.mode === 'run' ? 1 - 0.18 * k : 1;
    if(st.mode === 'run'){
      ctx.fillStyle = 'rgba(210,190,220,.35)';
      for(var d = 0; d < 4; d++){ var dk = Math.max(0, k - d * 0.12); dkrCirc(ctx, 220 + dir * 120 * dk - dir * 18, 202 - d * 3, 5 + d * 3 * (1 - k)); ctx.fill(); }
    }
    dkrMiniRunner(ctx, x, 204, sc, st.mode === 'run', k);
  }
  ctx.restore();
}
/* 舞台を動かす（SPEED で縮む・止まっている要素なら止める・最大120コマ） */
function dkrMiniAnim(cv, mode, side){
  if(!cv || !cv.getContext) return;
  cv._dkrMini = { mode:mode, side:side, k:0 };
  var tok = {}; cv._dkrTok = tok;
  var sp = (typeof SPEED === 'number' && SPEED > 0) ? SPEED : 1;
  var dur = (mode === 'run' ? 620 : 820) * sp;
  var w = cv.clientWidth, h = cv.clientHeight;
  if(!(w > 0 && h > 0)) return;
  var k0 = cv.width / w || 1, ctx = cv.getContext('2d');
  var paint = function(k, T){ ctx.setTransform(k0, 0, 0, k0, 0, 0); ctx.clearRect(0, 0, w, h); cv._dkrMini.k = k; dkrMiniPaint(ctx, w, h, cv._dkrMini, T); };
  if((window.DKFX && DKFX.reduced) || dur < 30){ paint(1, 0); return; }
  var t0 = null, n = 0;
  var step = function(ts){
    if(cv._dkrTok !== tok || !cv.isConnected) return;
    if(t0 === null) t0 = ts;
    var k = Math.min(1, (ts - t0) / dur);
    paint(k, ts);
    if(k < 1 && ++n < 120) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ══════════ ボーナスゲームの舞台（マップの仕掛けの絵があればそれ、無ければ洞窟） ══════════ */
function dkrMiniPaint(ctx, w, h, st, T){
  var B = DKR_S.mb;
  if(B && B.draw){
    try{ B.draw(ctx, w, h, st || { mode:'idle', side:'L', k:0 }, T || 0); return; }catch(e){ console.error('[WP11]', e); }
  }
  dkrMiniDraw(ctx, w, h, st, T);
}

/* ══════════ 盤の上の小物（伝染病・砂嵐・停電の印、水色の段が上がる瞬間） ══════════ */
function dkrMarks(ctx, i, t){
  if(!t || t.type !== 'city' || !(t.sand > 0 || t.plague > 0 || (t.dkrDark && t.frozen > 0))) return;
  var c = centroid(tileQuad(i));
  if(t.plague > 0) iconOn(ctx, { x:c.x - 14, y:c.y }, '🦠', 22);
  if(t.sand > 0) iconOn(ctx, { x:c.x + 14, y:c.y }, '🌪', 22);
  if(t.dkrDark && t.frozen > 0) iconOn(ctx, { x:c.x, y:c.y - 18 }, '⚡', 22);
}
/* 記念碑が一瞬ふくらむ（growAnim と同じ短い演出。grow は毎フレーム読むので盤の作り直しは要らない） */
function dkrPop(t){
  var g0 = G, t0 = null, D = Math.max(1, 420 * SPEED);
  requestAnimationFrame(function step(now){
    if(G !== g0){ t.grow = 1; return; }
    if(t0 === null) t0 = now;
    var k = Math.max(0, Math.min(1, (now - t0) / D));
    t.grow = k < 0.6 ? 0.7 + 0.5 * k / 0.6 : 1.2 - 0.2 * (k - 0.6) / 0.4;
    if(k < 1) requestAnimationFrame(step); else t.grow = 1;
  });
}
/* 水色の観光地の持ち数が2・3に上がった瞬間（G17） */
function dkrSkyStageFx(owner, i){
  if(!G || !(owner >= 0)) return;
  var n = dkrSkyCount(G, owner);
  if(n < 2) return;
  DKR_SKY_I.forEach(function(j){
    var t = G.tiles[j];
    if(!t || t.owner !== owner) return;
    var c = tileCenter(j);
    addFx('ring', c.x, c.y, 700, '#8FE0FF');
    addFx('spark', c.x, c.y - 30, 800, '#E8FAFF');
    if(j !== i) dkrPop(t);
  });
  dkNotify(owner, '🗼', '水色の観光地が' + (n >= 3 ? '三' : '二') + 'カ所', '通行料 ×' + (n >= 3 ? 4 : 2) + '・記念碑が大きくなりました', { ms:1800 });
}
/* 都市の建物の作り置き（持ち主・段が変わった時だけ描き直す。C18 で性能の班が部品の作り置きに置き換えるまでのつなぎ） */
var DKR_BLD = {};
var DKR_BLDBOX = { w:240, h:210, ox:120, oy:170, k:1.25 };
function dkrBldSprite(i, t, A, s){
  var key = (t.bm | 0) + ':' + (t.lv | 0) + ':' + t.owner + ':' + s, S = DKR_BLD[i];
  if(S && S.key === key) return S;
  var B = DKR_BLDBOX, c = (S && S.c) || document.createElement('canvas');
  c.width = Math.round(B.w * B.k); c.height = Math.round(B.h * B.k);
  var x = c.getContext('2d');
  if(!x) return null;
  x.setTransform(B.k, 0, 0, B.k, (B.ox - A.o.x) * B.k, (B.oy - A.o.y) * B.k);
  x.translate(A.o.x, A.o.y); x.scale(s, s); x.translate(-A.o.x, -A.o.y);
  try{ DKR_o.drawBuilding(x, G, i, 0); }catch(e){ console.error('[WP11]', e); return null; }
  S = DKR_BLD[i] = { key:key, c:c, w:B.w, h:B.h, ox:B.ox, oy:B.oy };
  return S;
}
/* BUILD[k].cost(base)・toll(base) の中身（引数は前の版と同じ。2つ目にタイルを渡してもよい） */
function dkrPriceByBase(k, base, t){
  var tile = (t && typeof t === 'object') ? t : null;
  if(tile && tile.tour) return k === 0 ? tile.base : 0;
  var r = (tile && dkrRowOf(tile)) || dkrRowByBase(base);
  return r ? Math.round(r.c[k] * base / r.c[0]) : (k === 0 ? base : 0);
}
function dkrTollByBase(k, base, t){
  var tile = (t && typeof t === 'object') ? t : null;
  var r = (tile && dkrRowOf(tile)) || dkrRowByBase(base);
  return r ? Math.round(r.t[k] * base / r.c[0]) : 0;
}

/* ══════════ 起動：盤の並び・値段・名前の書き換え（C28）・描画のラッパ・ポップアップの絵 ══════════ */
(function(){
  try{
    /* 並び（J10）：const の束縛はそのままで中身だけ入れ替える（最初の newGame より前） */
    CITY_SLOTS.length = 0;
    DKR_SLOTS.forEach(function(s){ CITY_SLOTS.push(s.slice()); });
    Object.keys(SPECIAL).forEach(function(k){ delete SPECIAL[k]; });
    Object.keys(DKR_SPECIAL).forEach(function(k){ SPECIAL[k] = DKR_SPECIAL[k]; });
    GCOL.length = 0;
    DKR_GCOL.forEach(function(c){ GCOL.push(c); });
    GBASE.length = 0;
    DKR_SLOTS.forEach(function(s){ GBASE.push(Math.round(DKR_PRICE[s[0]].c[0] * 50000)); });
    /* マップの名前（J05）：世界一周の角＝無人島・ワールドフェスティバル、氷の洞窟の角＝水晶の遺跡・洞窟探検 */
    MAPS.forEach(function(m){
      var d = DKR_MAPDATA[m.id];
      if(d){
        if(d.corners) d.corners.forEach(function(nm, k){ if(nm) m.corners[k] = nm; });
        if(d.cities) m.cities = d.cities.map(function(g){ return g.slice(); });
      } else if(m.cities && m.cities.length !== DKR_SLOTS.length){
        var flat = [].concat.apply([], m.cities);
        m.cities = DKR_SLOTS.map(function(s, g){ return s.map(function(x, j){ return flat[(g * 3 + j) % Math.max(1, flat.length)] || ('都市' + x); }); });
      }
      m.tours = DKR_TOURS.map(function(s){ return { i:s.i, kind:s.kind, name:dkrTourName(m, s.i, s.kind) }; });
    });
    /* 建物（J03・J08）：本家の名前と位置の値段表 */
    BUILD.forEach(function(b, k){
      b.nm = DKR_STEP_NM[k] || b.nm;
      b.cost = function(base, t){ return dkrPriceByBase(k, base, t); };
      b.toll = function(base, t){ return dkrTollByBase(k, base, t); };
    });
    /* drawTile：厚み（2段の側面）→ 元のマス（観光地は自前・カードのマスは札「CARD」）→ 面取り・建物の群れ・印 */
    DKR_o.drawTile = drawTile;
    drawTile = function(ctx, G2, i, T){
      var t = G2 && G2.tiles && G2.tiles[i];
      if(!t) return DKR_o.drawTile.apply(this, arguments);
      try{ dkrPlinth(ctx, i, t); }catch(e){ console.error('[WP11]', e); }
      var r, nm0 = t.name;
      if(t.tour) r = dkrDrawTour(ctx, G2, i, T);
      else {
        if(t.type === 'card') t.name = 'CARD';
        try{ r = DKR_o.drawTile.apply(this, arguments); } finally { t.name = nm0; }
      }
      try{ dkrBevel(ctx, i, t); dkrCubes(ctx, i, t); dkrMarks(ctx, i, t); }catch(e){ console.error('[WP11]', e); }
      return r;
    };
    /* drawBuilding：建物を 1.38倍（ランドマークは 1.22倍）、観光地は記念碑（ピンクは訪問数・水色は持ち数で大きく） */
    DKR_o.drawBuilding = drawBuilding;
    drawBuilding = function(ctx, G2, i, T){
      var t = G2 && G2.tiles && G2.tiles[i];
      if(t && t.tour){
        if(t.tour === 'pink' && t._dkrV !== (t.visits | 0)){ t._dkrV = t.visits | 0; try{ boardChanged(); }catch(e){} }
        if(t.owner >= 0){ try{ dkrMonumentAt(ctx, G2, i, T); }catch(e){ console.error('[WP11]', e); } }
        return;
      }
      if(!t || t.type !== 'city' || t.owner < 0) return DKR_o.drawBuilding.apply(this, arguments);
      var A = dkrAnchor(i), s = t.landmark ? 1.22 : DKR_BSCALE;
      /* 伸びる途中・ランドマーク（光の柱が動く）以外は、都市ごとの作り置きを貼る（毎フレームの建物の描き直しをやめる） */
      if(G2 === G && !t.landmark && (t.grow === undefined || t.grow === 1)){
        var sp = dkrBldSprite(i, t, A, s);
        if(sp){ ctx.drawImage(sp.c, A.o.x - sp.ox, A.o.y - sp.oy, sp.w, sp.h); return; }
      }
      ctx.save();
      ctx.translate(A.o.x, A.o.y); ctx.scale(s, s); ctx.translate(-A.o.x, -A.o.y);
      try{ return DKR_o.drawBuilding.apply(this, arguments); } finally { ctx.restore(); }
    };
    /* nextTurn：ラウンドが進んだら砂嵐・伝染病の残りを1減らす（停電は手番ごとに減る frozen） */
    DKR_o.nextTurn = nextTurn;
    nextTurn = function(){
      var before = G ? G.turnsLeft : 0;
      var r = DKR_o.nextTurn.apply(this, arguments);
      try{
        if(G && G.tiles && G.turnsLeft !== before){
          var ch = false;
          G.tiles.forEach(function(t){
            if(!t) return;
            if(t.sand > 0){ t.sand--; ch = true; }
            if(t.plague > 0){ t.plague--; ch = true; }
            if(t.dkrDark && !(t.frozen > 0)){ t.dkrDark = 0; ch = true; }
          });
          if(ch) boardChanged();
        }
      }catch(e){ console.error('[WP11]', e); }
      return r;
    };
    /* ポップアップの canvas は差し込まれた瞬間に塗る（7-online.js が作る建設パネルでも絵が出る） */
    var body = document.getElementById('modalBody');
    if(body){
      new MutationObserver(function(){
        dkrPaintAll(body);
        var b = body.querySelector('.dkr-build');
        if(b && !b._dkrSynced){ b._dkrSynced = 1; dkrBuildSync(b); }
      }).observe(body, { childList:true, subtree:true });
      body.addEventListener('click', function(e){
        var c = e.target && e.target.closest ? e.target.closest('.dkr-build .bcard') : null;
        if(c) dkrBuildSync(c.closest('.dkr-build'));
      });
    }
  }catch(e){ console.error('[WP11]', e); }
})();
