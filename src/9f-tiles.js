
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 盤のマスとお金のルール（9f-tiles.js / WP5）
   ──────────────────────────────────────────────────────────────
   ・観光地（空色×2・ピンク×1）、建設ポップアップ（本家の4枚カード）、買収後の建設、
     フォーチュンカード（攻撃・防御・移動・お金）、人間の売却画面、ボーナスゲーム、
     リーチ判定（トリプル／ライン／観光地があと1マス）。
   ・宣言し直す関数（§5 WP5）：buildTiles, tollOf, monoOf, checkWin, buildHTML, buyUI,
     deedCard, maybeBuyout, parchHTML, aiBuy, chanceCard, miniGame, miniHTML, dkPayFrom。
   ・代入ラッパ：drawTile（マスの厚み・ベベル・観光地の塗り）, drawBuilding（建物 1.38倍・観光地の記念碑）。
   ・トップレベルは function 宣言と DKR_ 付きの var と、最後の初期化 IIFE だけ。
   ・宣言し直した関数は、このファイルの var を読む前に呼ばれても落ちないように書く
     （盤の描画は requestAnimationFrame から始まるので実際には後になる）。
   ・見た目の乱数は DKFX.rnd() か決まった擬似乱数。Math.random は対戦の乱数だけに使う。
   ══════════════════════════════════════════════════════════════ */

/* ══════════ 観光地の配置と名前（マップごとに自作） ══════════ */
var DKR_TOUR_SLOTS = [ { i:6, kind:'sky', g:1 }, { i:15, kind:'pink', g:4 }, { i:23, kind:'sky', g:6 } ];
var DKR_TOUR_BASE = { sky:320000, pink:420000 };
var DKR_TOUR_NAMES = {
  ice:   { 6:'氷晶の滝',   15:'オーロラ丘', 23:'雪うさぎ村' },
  world: { 6:'珊瑚の海',   15:'さくら並木', 23:'氷河クルーズ' },
  oita:  { 6:'九重の星空', 15:'湯けむり丘', 23:'姫島の浜' }
};
var DKR_SKY = '#8FD8F8', DKR_PINK = '#F6A9C9';
var DKR_BSCALE = 1.38;            /* 建物の拡大率（本家は建物がマスから大きくはみ出す） */
var DKR_o = {};                   /* 包む前の関数 */

function dkrTourName(map, i, kind){
  var tb = (map && DKR_TOUR_NAMES && DKR_TOUR_NAMES[map.id]) || null;
  if(tb && tb[i]) return tb[i];
  return kind === 'pink' ? '桃色の名所' : '空色の名所';
}
function dkrTours(G){
  var out = [];
  if(!G || !G.tiles) return out;
  for(var i = 0; i < G.tiles.length; i++){ var t = G.tiles[i]; if(t && t.tour) out.push(i); }
  return out;
}

/* ══════════ マスを作る ══════════ */
function buildTiles(map){
  var slots = [ { i:6, kind:'sky', g:1 }, { i:15, kind:'pink', g:4 }, { i:23, kind:'sky', g:6 } ];
  var tourAt = {};
  slots.forEach(function(s){ tourAt[s.i] = s; });
  var t = new Array(32).fill(null);
  t[0]  = { type:'start',   name:map.corners[0] };
  t[8]  = { type:'jail',    name:map.corners[1] };
  t[16] = { type:'olympic', name:map.corners[2] };
  t[24] = { type:'travel',  name:map.corners[3] };
  for(var k in SPECIAL){
    var i = +k, v = SPECIAL[k];
    if(tourAt[i]) continue;                            /* 6・15・23 は観光地にする（元はチャンス） */
    if(v === 'card')  t[i] = { type:'card',  name:'フォーチュン' };
    if(v === 'tax')   t[i] = { type:'tax',   name:'国税庁', rate:0.10 };
    if(v === 'bonus') t[i] = { type:'bonus', name:'ボーナス', amount:1500000 };
  }
  CITY_SLOTS.forEach(function(sl, g){
    sl.forEach(function(idx, j){
      var base = Math.round(GBASE[g] * (1 + j * 0.13));
      t[idx] = { type:'city', name:map.cities[g][j], g:g, base:base,
                 owner:-1, lv:0, landmark:false, x2:false, frozen:0, grow:1, bind:0, olym:1 };
    });
  });
  /* 観光地：type は 'city' のまま（AI とオンラインが CITY_SLOTS[t.g] を引くため g は近くの色） */
  slots.forEach(function(s){
    t[s.i] = { type:'city', tour:s.kind, name:dkrTourName(map, s.i, s.kind), g:s.g,
               base:(s.kind === 'pink' ? 420000 : 320000),
               owner:-1, lv:0, landmark:false, x2:false, frozen:0, grow:1, bind:0, olym:1, visits:0 };
  });
  /* 祭り都市：毎試合ランダムで3ヶ所が通行料2倍。観光地は祭り都市にならない */
  var cities = [];
  for(var c = 0; c < 32; c++) if(t[c] && t[c].type === 'city' && !t[c].tour) cities.push(c);
  for(var n = 0; n < 3 && cities.length; n++){
    t[cities.splice((Math.random() * cities.length) | 0, 1)[0]].x2 = true;
  }
  for(var z = 0; z < 32; z++) if(!t[z]) t[z] = { type:'card', name:'フォーチュン' };
  return t;
}

/* ══════════ 通行料 ══════════ */
/* 観光地の倍率：空色は同じ持ち主の空色の数（1→×1, 2→×2, 3→×4）、ピンクは訪問数（1+visits、最大×4） */
function dkrTourMul(tile, G){
  if(!tile || !tile.tour) return 1;
  if(tile.tour === 'pink') return Math.min(4, 1 + Math.max(0, tile.visits | 0));
  var n = 0;
  if(G && G.tiles) G.tiles.forEach(function(o){ if(o && o.tour === 'sky' && o.owner === tile.owner) n++; });
  n = Math.max(1, n);
  return n >= 3 ? 4 : (n === 2 ? 2 : 1);
}
function tollOf(tile, G){
  if(!tile || tile.type !== 'city' || tile.owner < 0) return 0;
  if(tile.frozen > 0) return 0;
  var m = 1, ow;
  if(tile.tour){
    var tv = Math.round(tile.base * 0.45);
    m = dkrTourMul(tile, G);
    if(G){
      if(G.ev && G.ev.tollX) m *= G.ev.tollX;         /* 週替わり「通行料値上げ」 */
      if(G.infl && G.infl > 1) m *= G.infl;           /* 終盤インフレ */
      ow = G.players && G.players[tile.owner];
      if(ow && ow.tollUp > 0) m *= 1.6;               /* 能力「地価高騰」 */
    }
    return Math.round(tv * m);
  }
  var v = BUILD[0].toll(tile.base);
  for(var i = 1; i <= tile.lv; i++) v += BUILD[i].toll(tile.base);
  if(tile.landmark) v += BUILD[4].toll(tile.base);
  if(tile.x2) m *= 2;                                 /* 祭り都市 */
  if(tile.olym > 1) m *= tile.olym;                   /* フェスティバル開催（最大5倍） */
  if(G){
    var idx = G.tiles ? G.tiles.indexOf(tile) : -1;
    if(hasTriple(G, tile.owner, tile.g)) m *= 2 * ((G.ev && G.ev.monoX) || 1);
    if(idx >= 0 && hasLine(G, tile.owner, Math.floor(idx / 8))) m *= 2;
    if(G.ev && G.ev.tollX) m *= G.ev.tollX;
    if(G.infl && G.infl > 1) m *= G.infl;
    ow = G.players && G.players[tile.owner];
    if(ow && ow.tollUp > 0) m *= 1.6;
  }
  return Math.round(v * m);
}

/* ══════════ 独占 ══════════ */
/* 成立している独占をひとつ返す（無ければ null）。同時に成立したら倍率の高いほう */
function monoOf(G, pi){
  var tours = dkrTours(G);
  if(tours.length && tours.every(function(i){ return G.tiles[i].owner === pi; }))
    return { kind:'tour', label:'観光地独占', col:'#7FE6FF', key:'m', x:5 };
  for(var s = 0; s < 4; s++) if(hasLine(G, pi, s))
    return { kind:'line', label:'ライン独占', col:'#FFD24D', key:'l' + s, x:3 };
  if(colorMono(G, pi) >= 3)
    return { kind:'triple', label:'トリプル独占', col:'#FFD24D', key:'t', x:2 };
  return null;
}
/* あと1マスで独占：そのマスを取れるか（空き地、または相手の街で買収できる） */
function dkrTakeable(i, pi){
  var t = G.tiles[i];
  if(!t || t.type !== 'city') return false;
  if(t.owner < 0) return true;
  if(t.owner === pi) return false;
  return !t.tour && !t.landmark;
}
/* いまのリーチを全部 [{pi, kind, label, tiles:[i]}] で返す */
function dkrReachList(){
  var list = [];
  if(!G || !G.players) return list;
  var tours = dkrTours(G);
  for(var pi = 0; pi < G.players.length; pi++){
    if(G.players[pi].out) continue;
    if(monoOf(G, pi)) continue;                      /* もう独占している人はリーチではない */
    /* トリプル：2色そろっていて、3色目があと1マス */
    if(colorMono(G, pi) === 2){
      var tt = [];
      for(var g = 0; g < CITY_SLOTS.length; g++){
        if(hasTriple(G, pi, g)) continue;
        var miss = CITY_SLOTS[g].filter(function(i){ return G.tiles[i].owner !== pi; });
        if(miss.length === 1 && dkrTakeable(miss[0], pi)) tt.push(miss[0]);
      }
      if(tt.length) list.push({ pi:pi, kind:'triple', label:'トリプル独占', tiles:tt });
    }
    /* ライン：1辺の街（観光地も含む）があと1マス */
    for(var s = 0; s < 4; s++){
      var idx = [];
      for(var k = 1; k < 8; k++){ var i2 = s * 8 + k; if(G.tiles[i2].type === 'city') idx.push(i2); }
      var mine = idx.filter(function(i){ return G.tiles[i].owner === pi; });
      var rest = idx.filter(function(i){ return G.tiles[i].owner !== pi; });
      if(idx.length > 1 && mine.length >= 2 && rest.length === 1 && dkrTakeable(rest[0], pi))
        list.push({ pi:pi, kind:'line', label:'ライン独占', tiles:[rest[0]] });
    }
    /* 観光地：あと1つ（観光地は買収できないので空き地の時だけ） */
    if(tours.length >= 2){
      var tm = tours.filter(function(i){ return G.tiles[i].owner !== pi; });
      if(tm.length === 1 && G.tiles[tm[0]].owner < 0)
        list.push({ pi:pi, kind:'tour', label:'観光地独占', tiles:[tm[0]] });
    }
  }
  return list;
}
/* リーチを WP7 の表示へ渡す。新しく出たリーチの時だけ boss の曲とニュース */
function dkrReachUpdate(){
  var list = dkrReachList();
  var prev = G.dkrReach || {}, now = {}, fresh = [];
  list.forEach(function(r){
    var key = r.pi + ':' + r.kind + ':' + r.tiles.join(',');
    now[key] = 1;
    if(!prev[key]) fresh.push(r);
  });
  G.dkrReach = now;
  try{ dkShowReach(list); }catch(e){ console.error('[WP5]', e); }
  if(fresh.length){
    try{ SFX.warn(); }catch(e){}
    try{ bgm('boss'); }catch(e){}
    fresh.forEach(function(r){
      var nm = G.players[r.pi].name;
      var ts = r.tiles.map(function(i){ return G.tiles[i].name; }).join('・');
      try{ news('🚨 ' + nm + ' が' + r.label + 'リーチ！ のこり ' + ts); }catch(e){}
    });
  }
  return list;
}

/* ══════════ 勝敗 ══════════ */
function checkWin(){
  if(!G || G.over) return false;
  var alive = G.players.filter(function(p){ return !p.out; });
  if(alive.length === 1) return finish(G.players.indexOf(alive[0]), '独り勝ち');
  /* 開始2ラウンドは事故決着させない（リーチの表示は出す） */
  var early = G.turnsLeft > cfg.turns - 2;
  if(!early){
    for(var pi = 0; pi < G.players.length; pi++){
      if(G.players[pi].out) continue;
      var m = monoOf(G, pi);
      if(m){ G.winX = m.x; G.winKind = m.kind; return finish(pi, m.label, m.col); }
    }
  }
  dkrReachUpdate();
  return false;
}

/* ══════════ 建設ポップアップ（本家 s10/r4c0：4枚のカードが最初から選ばれている） ══════════ */
var DKR_STEP_NM = ['土地権利書', '別荘', 'ビル', 'ホテル', 'ランドマーク'];

function dkrDisc(p){ return statMul(p, 'build', 0.3) * (p.halfBuild > 0 ? 0.5 : 1) * ((G.ev && G.ev.buildX) || 1); }
function dkrFull(t, k){ return k === 0 ? t.base : BUILD[k].cost(t.base); }
function dkrCost(t, k, disc){ return Math.round(dkrFull(t, k) * disc); }
function dkrColOf(t){ return t.tour ? (t.tour === 'pink' ? '#F6A9C9' : '#8FD8F8') : GCOL[t.g]; }
function dkrArtKeyOf(t){
  if(t.tour) return 'tour-' + t.tour;
  if(t.landmark) return 'b4';
  return 'b' + Math.max(0, Math.min(3, t.lv | 0));
}
/* 建てられる段の一覧。mode = 'city' | 'lm'（3段そろった後のランドマーク） | 'tour' */
function dkrSteps(i, pi){
  var t = G.tiles[i], p = G.players[pi], own = t.owner === pi, disc = dkrDisc(p), mx = maxLvOf(p);
  var mk = function(k, have, can, lock){ return { k:k, have:have, can:can, lock:lock, cost:dkrCost(t, k, disc), full:dkrFull(t, k) }; };
  if(t.tour) return { mode:'tour', steps:[ mk(0, own, !own, false) ] };
  if(own && t.lv >= 3 && !t.landmark) return { mode:'lm', steps:[ mk(4, false, true, false) ] };
  var out = [ mk(0, own, !own, false) ];
  for(var k = 1; k <= 3; k++){
    var have = own && t.lv >= k;
    out.push(mk(k, have, !have && k <= mx, !have && k > mx));
  }
  return { mode:'city', steps:out };
}
/* 最初から選んでおく段：下から順に、払える分だけ（途中で足りなくなったらそこまで） */
function dkrPresel(i, pi){
  var p = G.players[pi], S = dkrSteps(i, pi), sum = 0, out = [];
  for(var n = 0; n < S.steps.length; n++){
    var s = S.steps[n];
    if(s.have) continue;
    if(!s.can) break;
    if(sum + s.cost > p.cash) break;
    sum += s.cost; out.push(s.k);
  }
  return out;
}
function dkrLockText(p, k){
  var need = Math.max(1, k - 1 - (p.laps | 0));
  return 'あと' + need + '周で解放';
}
function buildHTML(i, pi, opt){
  var t = G.tiles[i], p = G.players[pi], S = dkrSteps(i, pi);
  var pre = (opt && opt.presel) ? dkrPresel(i, pi) : [];
  var col = dkrColOf(t), pc = PCOL[pi] || '#E14A5A';
  var cls = 'deed dkr-build' + (S.mode === 'lm' ? ' dkr-lm' : '') + (S.mode === 'tour' ? ' dkr-tp dkr-' + t.tour : '');
  var sub = S.mode === 'lm' ? 'ランドマーク建設' : (S.mode === 'tour' ? (t.tour === 'pink' ? 'ピンクの観光地' : '空色の観光地') : '');
  var h = '<div class="modal"><div class="' + cls + '" data-dkr-i="' + i + '" data-dkr-pi="' + pi + '">'
    + '<div class="dhd"><span class="dkr-medal" style="--dkr-g:' + col + '"><i></i></span>'
    + '<div class="dkr-ttl"><b>' + esc(t.name) + '</b>' + (sub ? '<em>' + sub + '</em>' : '') + '</div>'
    + '<button class="dkr-x" data-act="no" aria-label="閉じる">✕</button></div>'
    + '<div class="dbd"><div class="buildgrid dkr-n' + S.steps.length + '">';
  S.steps.forEach(function(s){
    var c = 'bcard' + (s.have ? ' own' : '') + (!s.can && !s.have ? ' dis' : '') + (pre.indexOf(s.k) >= 0 ? ' sel' : '');
    var art = t.tour ? 'tour-' + t.tour : 'b' + s.k;
    h += '<div class="' + c + '" data-k="' + s.k + '" data-c="' + s.cost + '" data-dkr-full="' + s.full + '">'
      + '<div class="dkr-cap">' + (t.tour ? '観光地' : DKR_STEP_NM[s.k]) + '</div>'
      + '<div class="dkr-art"><canvas data-dkr-art="' + art + '" data-dkr-col="' + pc + '" width="16" height="12"></canvas></div>'
      + '<div class="pr">' + (s.have ? '所有' : yenShort(s.full)) + '</div>'
      + '<i class="dkr-chk" aria-hidden="true"></i>'
      + (s.lock ? '<div class="dkr-lock">' + dkrLockText(p, s.k) + '</div>' : '')
      + '</div>';
  });
  var note;
  if(S.mode === 'tour') note = '観光地は建物を建てられず、買収もされません。空色は持っている数、ピンクは訪問数で通行料が上がります。';
  else if(S.mode === 'lm') note = '3段そろった街だけに建てられます。ランドマークは買収されません。';
  else {
    var mx = maxLvOf(p);
    note = mx >= 3 ? '選んだ段までまとめて建てます。カードを押すと選び直せます。'
                   : 'いまは「' + BUILD[mx].nm + '」まで。スタートを通るたびに1段ずつ増えます。';
  }
  if(p.halfBuild > 0) note += '　建設割引券が効いています（半額）。';
  h += '</div><div class="sums">'
    + '<div class="dkr-row"><span>建設費用</span><i aria-hidden="true"></i><b id="dkrFull">0</b></div>'
    + '<div class="dkr-row dkr-disc"><span>建設費用割引</span><i aria-hidden="true"></i><b id="dkrDisc">0</b></div>'
    + '<button class="dkr-buy" id="bOk" data-act="ok"><span class="dkr-bl">購入</span>'
    +   '<span class="dkr-bill" aria-hidden="true"></span><em id="bSum">0</em></button>'
    + '<div class="dkr-row dkr-toll"><span>通行料</span><i aria-hidden="true"></i><b id="dkrToll">0</b></div>'
    + '</div><p class="dkr-note">' + note + '</p>'
    + '</div></div></div>';
  return h;
}
/* 選んだ段で建てたあとの通行料（タイルを一瞬だけ書き換えて tollOf に聞き、必ず戻す） */
function dkrTollAfter(i, pi, sel){
  var t = G.tiles[i], o = t.owner, l = t.lv, m = t.landmark;
  try{
    if(sel.length){
      t.owner = pi;
      sel.forEach(function(k){ if(k >= 1 && k <= 3) t.lv = Math.max(t.lv, k); if(k === 4) t.landmark = true; });
    }
    return tollOf(t, G);
  } finally { t.owner = o; t.lv = l; t.landmark = m; }
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
  var put = function(id, v){ var e = panel.querySelector('#' + id); if(e){ e.textContent = v; e.style.color = ''; } };
  put('dkrFull', yen(full));
  put('dkrDisc', full - cost > 0 ? '-' + yen(full - cost) : '0');
  put('bSum', yen(cost));
  put('dkrToll', yen(sel.length ? dkrTollAfter(i, pi, sel) : tollOf(t, G)));
  var ok = panel.querySelector('#bOk');
  if(ok) ok.disabled = !sel.length || cost > p.cash;
  panel.classList.toggle('dkr-poor', cost > p.cash);
}
/* 押せないカードを押した時の小さな揺れ（位置は変えない） */
function dkrNudge(el){ try{ if(typeof fxShake === 'function') fxShake(el, 200); }catch(e){} }
/* 自前のモーダルを閉じる（WP0 の modal と同じ 170ms の退場。閉じる間に別の中身が入ったらそれは閉じない） */
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
/* 人間が選ぶ：選んだ段の配列（小さい順）か []（閉じた） */
function dkrPickBuild(pi, i){
  return new Promise(function(res){
    var t = G.tiles[i], own = t.owner === pi;
    var first = dkrOpenModal(buildHTML(i, pi, { presel:true }));
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
        if(!pickable(cd)){ dkrNudge(cd); return; }
        if(cd.classList.contains('sel')){
          /* 外す：土地を外したら全部、ほかはその段から上を外す */
          cards.forEach(function(c){ var kk = +c.getAttribute('data-k'); if(k === 0 || kk >= k) c.classList.remove('sel'); });
        } else {
          if(k > 0 && k < 4){
            if(!own){ var c0 = cardOf(0); if(pickable(c0)) c0.classList.add('sel'); }
            for(var j = (own ? t.lv + 1 : 1); j < k; j++){ var cj = cardOf(j); if(pickable(cj)) cj.classList.add('sel'); }
          }
          cd.classList.add('sel');
        }
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
/* 選んだ段を実際に建てる（お金を払う → 建物 → 権利証 → 勝敗） */
async function dkrApplyBuild(pi, i, sel){
  var t = G.tiles[i], p = G.players[pi], own = t.owner === pi;
  if(!sel || !sel.length || p.out || G.over) return;
  if(t.owner >= 0 && !own) return;
  var disc = dkrDisc(p), spend = 0;
  sel.forEach(function(k){ spend += dkrCost(t, k, disc); });
  if(spend > p.cash) return;
  if(p.halfBuild > 0) p.halfBuild--;
  give(pi, -spend);
  if(sel.indexOf(0) >= 0 || own) t.owner = pi;
  if(!t.tour){
    [1, 2, 3].forEach(function(k){ if(sel.indexOf(k) >= 0) t.lv = Math.max(t.lv, k); });
    if(sel.indexOf(4) >= 0 && t.lv >= 3) t.landmark = true;
  }
  boardChanged();
  await growAnim(i);
  await deedCard(i, spend);
  checkWin();
}
async function buyUI(pi, i){
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p || t.type !== 'city') return;
  var own = t.owner === pi;
  if(!own && t.owner >= 0) return;
  if(own && t.tour) return;                        /* 自分の観光地では何も開かない */
  if(own && t.landmark){ toast('R', '🗼', 'ランドマーク完成済み', t.name + ' はこれ以上建てられません', 1800); return; }
  var S = dkrSteps(i, pi);
  if(!S.steps.some(function(s){ return s.can; })){
    toast('R', '🔒', 'いまは建てられません', 'スタートを通るたびに建てられる段が1つ増えます', 1700);
    return;
  }
  var sel = await dvAsk(pi, 'build', function(){ return dkrPickBuild(pi, i); }, '買うか考えています');
  if(!Array.isArray(sel) || !sel.length) return;
  await dkrApplyBuild(pi, i, sel);
}

/* ══════════ 権利証（押さなくても約0.9秒で自動的に消える） ══════════ */
async function deedCard(i, paid){
  var t = G && G.tiles && G.tiles[i], st = document.getElementById('stage');
  if(!t || !st) return;
  var own = t.owner, tours = dkrTours(G);
  var lvNm = t.tour ? '観光地' : t.landmark ? 'ランドマーク' : (t.lv > 0 ? BUILD[t.lv].nm : '土地');
  var same = t.tour
    ? tours.filter(function(j){ return G.tiles[j].owner === own; }).length + ' / ' + tours.length
    : CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner === own; }).length + ' / ' + CITY_SLOTS[t.g].length;
  var el = document.createElement('div');
  el.className = 'dkr-deedfx';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="deedcard dkr-auto" style="--dkr-g:' + dkrColOf(t) + ';--dkr-o:' + (PCOL[own] || '#C9302C') + '">'
    + '<div class="body"><div class="cap">TITLE DEED ・ 権利証</div>'
    + '<h4>' + esc(t.name) + '</h4>'
    + '<div class="dkr-dart"><canvas data-dkr-art="' + dkrArtKeyOf(t) + '" data-dkr-col="' + (PCOL[own] || '#E14A5A') + '" width="16" height="12"></canvas></div>'
    + '<div class="rows">'
    +   '<div><span>建物</span><b>' + lvNm + '</b></div>'
    +   '<div><span>支払った額</span><b>' + yen(paid || 0) + '</b></div>'
    +   '<div><span>新しい通行料</span><b>' + yen(tollOf(t, G)) + '</b></div>'
    +   '<div><span>' + (t.tour ? '観光地の所有' : '同じ色の所有') + '</span><b>' + same + '</b></div>'
    + '</div></div><i class="seal dkr-wax"><b></b></i></div>';
  st.appendChild(el);
  dkrPaintAll(el);
  try{ SFX.cardIn(); }catch(e){}
  await wait(900);
  el.classList.add('dkr-out');
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, Math.max(20, 300 * SPEED));
}

/* ══════════ 買収（観光地・ランドマークは不可。半額クーポンが効く。買収のあと建てられる） ══════════ */
function dkrBuyoutCost(t, p){
  return Math.round(cityValue(t) * 2 * statMul(p, 'buyout', 0.3) * ((p.halfBuyout > 0) ? 0.5 : 1));
}
async function maybeBuyout(pi, i){
  var t = G.tiles[i], p = G.players[pi];
  if(!t || !p || t.type !== 'city' || t.tour || t.landmark) return;
  if(t.owner < 0 || t.owner === pi || p.out || G.over) return;
  var owner = t.owner, half = p.halfBuyout > 0;
  var cost = dkrBuyoutCost(t, p);
  if(p.cash < cost) return;
  var yes = await dvAsk(pi, 'buyout', async function(){
    if(p.kind === 'cpu') return !!aiBuyout(pi, i, cost);
    return (await modal(parchHTML(t, cost, G.players[owner].name, { half:half, full:Math.round(cost * (half ? 2 : 1)), pi:pi }))) === 'ok';
  }, '買収するか考えています');
  if(!yes) return;
  if(G.over || p.out || t.owner !== owner || p.cash < cost) return;
  if(half) p.halfBuyout--;
  give(pi, -cost); give(owner, cost);
  moneyFly(pi, owner, true);
  t.owner = pi;
  boardChanged();
  try{ SFX.buy(); }catch(e){}
  var c = tileCenter(i);
  addFx('pillar', c.x, c.y, 900, PCOL[pi]);
  addFx('spark', c.x, c.y - 30, 900, '#FFD24D');
  addFx('shockring', c.x, c.y + 4, 620, '#FFE7A8', null, false, { r:170 });
  jingle('buyout');
  news(p.name + ' が ' + t.name + ' を買収！ 持ち主が変わりました');
  await dkrSealFx(i, pi, owner, cost);
  if(checkWin()) return;
  /* 買収したあとは建物も建てられる（本家「인수한 후에는 건물 건설도 가능」） */
  if(p.kind === 'cpu') await aiBuy(pi, i); else await buyUI(pi, i);
}
/* 買収の確認（羊皮紙の証書）。7-online.js は3引数で呼ぶ */
function parchHTML(t, cost, ownerName, opt){
  opt = opt || {};
  var pi = (typeof opt.pi === 'number') ? opt.pi : (G ? G.turn : 0);
  var art = t ? dkrArtKeyOf(t) : 'b0';
  var price = opt.half
    ? '<s>' + yen(opt.full || cost * 2) + '</s><b>' + yen(cost) + '</b><em class="dkr-half">買収半額クーポン</em>'
    : '<b>' + yen(cost) + '</b>';
  return '<div class="modal"><div class="parch dkr-pc">'
    + '<i class="dkr-ribbon" aria-hidden="true"></i>'
    + '<h3>買 収 証 書</h3>'
    + '<div class="dkr-pcart"><canvas data-dkr-art="' + art + '" data-dkr-col="' + (PCOL[t && t.owner >= 0 ? t.owner : pi] || '#3E8FE0') + '" width="16" height="12"></canvas></div>'
    + '<div class="amt">' + esc(t ? t.name : '') + '</div>'
    + '<p>この街を <b>' + esc(ownerName) + '</b> より譲り受けるものとする。<br>対価は建設費用の2倍とする。</p>'
    + '<div class="dkr-price"><span>買収額</span>' + price + '</div>'
    + '<div class="sign">Dice Kingdom 商工会</div>'
    + '<div class="dkr-pcbtn">'
    +   '<button class="dkr-btn dkr-gray" data-act="no">やめる</button>'
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

/* ══════════ CPU の購入・建設（観光地は土地だけ。揃う時は蓄えを崩してでも買う） ══════════ */
async function aiBuy(pi, i){
  var t = G.tiles[i], p = G.players[pi], lvl = cfg.ai;
  if(!t || !p || t.type !== 'city' || p.out) return;
  var own = t.owner === pi;
  if(!own && t.owner >= 0) return;
  var disc = dkrDisc(p);
  var reserve = [300000, 180000, 90000][lvl] || 180000;
  if(t.tour){
    if(own) return;
    var price = Math.round(t.base * disc), tours = dkrTours(G);
    var mineT = tours.filter(function(j){ return G.tiles[j].owner === pi; }).length;
    var sky2 = t.tour === 'sky' && tours.some(function(j){ return j !== i && G.tiles[j].tour === 'sky' && G.tiles[j].owner === pi; });
    var block = G.players.some(function(q, qi){ return qi !== pi && !q.out &&
      tours.filter(function(j){ return G.tiles[j].owner === qi; }).length >= tours.length - 1; });
    var urgent = (mineT >= tours.length - 1) || sky2 || block;
    if(p.cash - price < (urgent ? 0 : reserve)) return;
    if(price > p.cash) return;
    if(p.halfBuild > 0) p.halfBuild--;
    give(pi, -price);
    t.owner = pi;
    boardChanged();
    toast('L', '🎡', '観光地を購入：' + t.name, yen(price) + ' で手に入れました', 2000);
    news(p.name + ' が観光地 ' + t.name + ' を購入！');
    await growAnim(i);
    checkWin();
    return;
  }
  var spend = 0, lvTarget = t.lv, land = false, lm = false;
  var nearOf = function(qi){ return CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner === qi; }).length; };
  if(!own){
    var pr = Math.round(t.base * disc);
    var urgentC = nearOf(pi) >= 1 || G.players.some(function(q, qi){ return qi !== pi && !q.out && nearOf(qi) >= 2; });
    if(p.cash - pr < (urgentC ? 0 : reserve)) return;   /* 独占阻止・そろえる時は全財産を使ってでも買う */
    land = true; spend += pr;
  }
  var near = nearOf(pi);
  var blockC = G.players.some(function(q, qi){ return qi !== pi && !q.out && nearOf(qi) >= 2; });
  var aggr = (near >= 1 || blockC) ? 1 : 0;
  var mx = maxLvOf(p);
  for(var k = (own ? t.lv + 1 : 1); k <= mx; k++){
    var c = Math.round(BUILD[k].cost(t.base) * disc);
    var floor = Math.max(0, reserve - aggr * 1500000);
    if(p.cash - spend - c < floor) break;
    if(lvl === 0 && k > 1) break;
    if(lvl === 1 && k > 2 && !aggr) break;
    spend += c; lvTarget = k;
  }
  /* ランドマークは「3段そろった街へ、もう一度到着した時」だけ（人間の UI と同じ規則） */
  if(lvl === 2 && own && t.lv >= 3 && !t.landmark && near >= 1){
    var cl = Math.round(BUILD[4].cost(t.base) * disc);
    if(p.cash - spend - cl > reserve){ spend += cl; lm = true; }
  }
  if(spend === 0) return;
  var me = G.players.findIndex(function(q){ return q.kind !== 'cpu' && !q.out; });
  if(me >= 0 && me !== pi && G.players[me].jam > 0 && (lvTarget > t.lv || lm)){
    var jammed = await shakePhase(me);
    if(jammed){
      lvTarget = Math.max(t.lv, lvTarget - 1);
      spend = Math.round(spend * 0.5); lm = false;
      if(lvTarget <= t.lv && !land){ toast('L', '✋', 'じゃま成功！', '建設を止めました', 2200); return; }
    }
  }
  if(spend > p.cash) return;
  if(p.halfBuild > 0) p.halfBuild--;
  give(pi, -spend);
  if(land || own) t.owner = pi;
  t.lv = Math.max(t.lv, lvTarget);
  if(lm && t.lv >= 3) t.landmark = true;
  boardChanged();
  toast('L', '🏗', (land ? '購入' : '建設') + '：' + t.name, yen(spend) + ' を投資しました', 2000);
  news(p.name + ' が ' + t.name + ' に ' + yen(spend) + ' を投資！');
  await growAnim(i);
  checkWin();
}

/* ══════════ フォーチュンカード（攻撃・防御・移動・お金。黄金カードは金の枠） ══════════ */
var DKR_CARDS = [
  { id:'fsell',      grp:'atk',   gold:true,  nm:'強制売却',       ds:'相手の街を1つ選び、市場へ売らせる（ランドマーク・観光地は選べない）' },
  { id:'swap',       grp:'atk',   gold:true,  nm:'都市チェンジ',   ds:'自分の街1つと、相手の街1つを入れ替える' },
  { id:'dark',       grp:'atk',   gold:false, nm:'停電',           ds:'相手の街を1つ選び、2ターンのあいだ通行料を0にする' },
  { id:'angel',      grp:'def',   gold:true,  nm:'天使',           ds:'次に払う通行料が1回だけ無料になる' },
  { id:'halfToll',   grp:'def',   gold:false, nm:'通行料半額',     ds:'次に払う通行料が1回だけ半分になる' },
  { id:'halfBuyout', grp:'def',   gold:false, nm:'買収半額',       ds:'次の買収が1回だけ半額になる' },
  { id:'escape',     grp:'def',   gold:false, nm:'脱出チケット',   ds:'閉じ込められても、すぐに出られる' },
  { id:'travel',     grp:'move',  gold:true,  nm:'旅行招待券',     ds:'次の手番に、好きなマスへ無料で旅行できる' },
  { id:'start',      grp:'move',  gold:false, nm:'スタートへ',     ds:'スタートへ移動して給料を受け取る' },
  { id:'island',     grp:'move',  gold:false, nm:'無人島へ',       ds:'閉じ込めのマスへ送られる（3ターン）', bad:true },
  { id:'fest',       grp:'move',  gold:false, nm:'フェスティバルへ', ds:'フェスティバルのマスへ移動する' },
  { id:'tax',        grp:'move',  gold:false, nm:'国税庁へ',       ds:'国税庁へ移動して税金を納める', bad:true },
  { id:'donate',     grp:'money', gold:false, nm:'寄付',           ds:'ほかの全員に 30万 ずつ寄付する', bad:true },
  { id:'gouge',      grp:'money', gold:false, nm:'ぼったくり',     ds:'次に受け取る通行料が1回だけ2倍になる' },
  { id:'bonus',      grp:'money', gold:false, nm:'臨時収入',       ds:'思わぬ収入 200万 を受け取る' }
];
var DKR_GRP = { atk:'攻撃', def:'防御', move:'移動', money:'お金' };

function dkrCardById(id){ for(var n = 0; n < DKR_CARDS.length; n++) if(DKR_CARDS[n].id === id) return DKR_CARDS[n]; return null; }
function dkrCardName(c){
  var cn = (G && G.map && G.map.corners) || ['', '無人島', 'フェスティバル', ''];
  if(c.id === 'island') return cn[1] + 'へ';
  if(c.id === 'fest') return cn[2] + 'へ';
  return c.nm;
}
function dkrCardDesc(c){
  var cn = (G && G.map && G.map.corners) || ['', '無人島', 'フェスティバル', ''];
  if(c.id === 'island') return cn[1] + 'へ送られ、3ターン動けない';
  if(c.id === 'fest') return cn[2] + 'のマスへ移動する';
  return c.ds;
}
/* 黄金フォーチュン（能力値）1pあたり 0.35% で黄金カードが出やすくなる */
function dkrDrawCard(p){
  var ev = (G && G.ev) || {};
  var goldP = Math.min(0.6, 0.12 + statOf(p, 'fortune') * 0.0035 + (ev.luck || 0) * 0.3);
  var lucky = Math.random() < (statRate(p, 'fortune') * 0.3 + (ev.luck || 0));
  var pool;
  if(Math.random() < goldP) pool = DKR_CARDS.filter(function(c){ return c.gold; });
  else {
    pool = DKR_CARDS.filter(function(c){ return !c.gold; });
    if(lucky) pool = pool.filter(function(c){ return !c.bad; });
  }
  return pool[(Math.random() * pool.length) | 0];
}
function dkrCardInner(c){
  return '<div class="dkr-fwrap' + (c.gold ? ' dkr-gold' : '') + ' dkr-g-' + c.grp + '">'
    + (c.gold ? '<i class="dkr-frays" aria-hidden="true"></i>' : '')
    + '<div class="dkr-fcard">'
    +   '<div class="dkr-fback"><div class="dkr-fbk"><b>FORTUNE</b><i>CARD</i></div></div>'
    +   '<div class="dkr-ffront">'
    +     '<div class="dkr-fhd"><span class="dkr-fkind">' + DKR_GRP[c.grp] + '</span><b>' + esc(dkrCardName(c)) + '</b></div>'
    +     '<div class="dkr-fart"><canvas data-dkr-art="card-' + c.id + '" width="16" height="12"></canvas></div>'
    +     '<p class="dkr-fds">' + esc(dkrCardDesc(c)) + '</p>'
    +     (c.gold ? '<em class="dkr-fgold">GOLDEN</em>' : '')
    +   '</div>'
    + '</div></div>';
}
function dkrCardHTML(c){
  return '<div class="modal"><div class="dkr-fort">' + dkrCardInner(c)
    + '<button class="dkr-btn dkr-goldbtn dkr-fok" data-act="ok">確認</button></div></div>';
}
/* CPU が引いた時：押さなくてよい小さなカードを約1秒だけ見せる */
async function dkrCpuCard(pi, c){
  var st = document.getElementById('stage');
  if(!st) return;
  var el = document.createElement('div');
  el.className = 'dkr-cpucard';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="dkr-cpuwho" style="--dkr-o:' + (PCOL[pi] || '#3E8FE0') + '">' + esc(G.players[pi].name) + '</div>' + dkrCardInner(c);
  st.appendChild(el);
  dkrPaintAll(el);
  await wait(1100);
  el.classList.add('dkr-out');
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, Math.max(20, 300 * SPEED));
}
async function chanceCard(pi){
  var p = G.players[pi];
  if(!p || p.out) return;
  var c = dkrDrawCard(p);
  try{ SFX.cardIn(); }catch(e){}
  if(p.kind !== 'cpu'){
    await dvAsk(pi, 'fortune', function(){ return modal(dkrCardHTML(c)); }, 'フォーチュンカードを見ています');
  } else {
    await dkrCpuCard(pi, c);
  }
  news('🎴 ' + p.name + ' がフォーチュンカード「' + dkrCardName(c) + '」を引いた');
  await dkrCardEffect(pi, c);
  try{ updHUD(); }catch(e){}
}
/* 相手の街（破産していない人の街） */
function dkrOthersCities(pi, opt){
  opt = opt || {};
  var out = [];
  for(var i = 0; i < 32; i++){
    var t = G.tiles[i];
    if(!t || t.type !== 'city' || t.owner < 0 || t.owner === pi) continue;
    if(G.players[t.owner] && G.players[t.owner].out) continue;
    if(opt.noLm && t.landmark) continue;
    if(opt.noTour && t.tour) continue;
    if(opt.noFrozen && t.frozen > 0) continue;
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
/* 相手の独占を崩す価値（その色で2つ以上持っている相手の街は高い） */
function dkrThreat(i){
  var t = G.tiles[i];
  if(t.tour) return 0;
  var n = CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner === t.owner; }).length;
  return n >= 2 ? 3000000 : 0;
}
function dkrTileFx(i, col){
  var c = tileCenter(i);
  addFx('ring', c.x, c.y, 700, col || '#FFD24D');
  addFx('spark', c.x, c.y - 26, 900, col || '#FFF3C0');
}
async function dkrCardEffect(pi, c){
  var p = G.players[pi], cpu = p.kind === 'cpu', d, t, cand, mine, theirs;
  switch(c.id){
  case 'fsell':
    cand = dkrOthersCities(pi, { noLm:true, noTour:true });
    if(!cand.length){ toast('L', '🎴', '強制売却', '売らせられる街がありません', 1800); return; }
    d = cpu ? dkrBest(cand, function(i){ return dkrThreat(i) + cityValue(G.tiles[i]); })
            : await pickTile(pi, '売らせる街を選んでください', function(z){ return cand.indexOf(z) >= 0; });
    if(!(d >= 0) || cand.indexOf(d) < 0){ toast('L', '🎴', '強制売却', '選ばなかったので使いませんでした', 1800); return; }
    t = G.tiles[d];
    var ow = t.owner, val = sellValue(t);
    t.owner = -1; t.lv = 0; t.landmark = false;
    boardChanged();
    if(ow >= 0 && !G.players[ow].out) give(ow, val);
    var sc = tileCenter(d);
    addFx('smoke', sc.x, sc.y + 4, 1100);
    addFx('shockring', sc.x, sc.y + 4, 620, '#FFB27A', null, false, { r:160 });
    try{ SFX.bad(); }catch(e){}
    camShake(9);
    toast('L', '🔨', '強制売却', t.name + ' が市場に戻りました', 2100);
    news('🔨 ' + p.name + ' の強制売却！ ' + t.name + ' が市場に戻った');
    return;
  case 'swap':
    mine = dkrOwned(pi).filter(function(i){ return !G.tiles[i].landmark && !G.tiles[i].tour; });
    theirs = dkrOthersCities(pi, { noLm:true, noTour:true });
    if(!mine.length || !theirs.length){ toast('L', '🎴', '都市チェンジ', '入れ替えられる街がありません', 1800); return; }
    var a, b;
    if(cpu){
      a = dkrBest(mine, function(i){ return -cityValue(G.tiles[i]) - (CITY_SLOTS[G.tiles[i].g].filter(function(j){ return G.tiles[j].owner === pi; }).length >= 2 ? 5e6 : 0); });
      b = dkrBest(theirs, function(i){ var tt = G.tiles[i];
        return cityValue(tt) + dkrThreat(i) + CITY_SLOTS[tt.g].filter(function(j){ return G.tiles[j].owner === pi; }).length * 2000000; });
    } else {
      a = await pickTile(pi, '渡す自分の街を選んでください', function(z){ return mine.indexOf(z) >= 0; });
      if(!(a >= 0) || mine.indexOf(a) < 0){ toast('L', '🎴', '都市チェンジ', '選ばなかったので使いませんでした', 1800); return; }
      b = await pickTile(pi, 'もらう相手の街を選んでください', function(z){ return theirs.indexOf(z) >= 0; });
      if(!(b >= 0) || theirs.indexOf(b) < 0){ toast('L', '🎴', '都市チェンジ', '選ばなかったので使いませんでした', 1800); return; }
    }
    var ob = G.tiles[b].owner;
    G.tiles[a].owner = ob; G.tiles[b].owner = pi;
    boardChanged();
    dkrTileFx(a, PCOL[ob]); dkrTileFx(b, PCOL[pi]);
    try{ SFX.buy(); }catch(e){}
    toast('L', '🔄', '都市チェンジ', G.tiles[a].name + ' と ' + G.tiles[b].name + ' を入れ替えました', 2200);
    news('🔄 ' + p.name + ' が ' + G.tiles[b].name + ' を手に入れた（都市チェンジ）');
    return;
  case 'dark':
    cand = dkrOthersCities(pi, { noFrozen:true });
    if(!cand.length){ toast('L', '🎴', '停電', '止められる街がありません', 1800); return; }
    d = cpu ? dkrBest(cand, function(i){ return tollOf(G.tiles[i], G); })
            : await pickTile(pi, '停電させる街を選んでください', function(z){ return cand.indexOf(z) >= 0; });
    if(!(d >= 0) || cand.indexOf(d) < 0){ toast('L', '🎴', '停電', '選ばなかったので使いませんでした', 1800); return; }
    G.tiles[d].frozen = 2;
    boardChanged();
    dkrTileFx(d, '#8FE8FF');
    try{ SFX.bad(); }catch(e){}
    toast('L', '⚡', '停電', G.tiles[d].name + ' の通行料が2ターン0になります', 2200);
    return;
  case 'angel':
    p.freeToll = (p.freeToll | 0) + 1;
    toast('L', '🪽', '天使カード', '次に払う通行料が無料になります', 2000);
    return;
  case 'halfToll':
    p.halfToll = (p.halfToll | 0) + 1;
    toast('L', '🎟', '通行料半額', '次に払う通行料が半分になります', 2000);
    return;
  case 'halfBuyout':
    p.halfBuyout = (p.halfBuyout | 0) + 1;
    toast('L', '🎟', '買収半額', '次の買収が半額になります', 2000);
    return;
  case 'escape':
    p.escapeTix = (p.escapeTix | 0) + 1;
    toast('L', '🎫', '脱出チケット', '閉じ込められても、すぐに出られます', 2000);
    return;
  case 'travel':
    p.travel = true; p.travelFree = true;
    toast('L', '✈', '旅行招待券', '次の手番に好きなマスへ無料で旅行できます', 2200);
    return;
  case 'start':
    await jumpTo(pi, 0);
    p.laps++;
    salary(pi);
    return;
  case 'island':
    await jumpTo(pi, 8);
    p.jail = 3; p.dblRun = 0;
    try{ SFX.bad(); }catch(e){}
    camShake(10);
    toast('L', '🏝', dkrCardName(c), '3ターンのあいだ動けません', 2000);
    return;
  case 'fest':
    await jumpTo(pi, 16);
    await resolve(pi);
    return;
  case 'tax':
    await jumpTo(pi, 19);
    await resolve(pi);
    return;
  case 'donate':
    var others = [];
    G.players.forEach(function(q, j){ if(j !== pi && !q.out) others.push(j); });
    if(!others.length) return;
    var each = 300000, total = each * others.length;
    if(!(await dkPayFrom(pi, total, -1))){ await bankrupt(pi, -1); return; }
    give(pi, -total);
    others.forEach(function(j){ give(j, each); });
    toast('L', '💝', '寄付', 'ほかの全員に ' + yen(each) + ' ずつ寄付しました', 2100);
    return;
  case 'gouge':
    p.gouge = (p.gouge | 0) + 1;
    toast('L', '💰', 'ぼったくり', '次に受け取る通行料が2倍になります', 2000);
    return;
  case 'bonus':
    give(pi, 2000000);
    var bc = p.render || tileCenter(p.pos);
    addFx('coinburst', bc.x, bc.y - 20, 1000);
    return;
  }
}

/* ══════════ 支払い（CPU は自動で売る。人間は売る街を選ぶ画面） ══════════ */
async function dkPayFrom(pi, amt, toPi){
  var p = G && G.players && G.players[pi];
  if(!p) return false;
  amt = Math.max(0, Math.round(+amt || 0));
  if(p.cash >= amt) return true;
  if(p.kind === 'cpu') return raiseCash(pi, amt);
  var guard = 0;
  while(p.cash < amt && guard++ < 40){
    if(!dkrOwned(pi).length) return false;
    var v = await dvAsk(pi, 'sell', function(){ return dkrSellPick(pi, amt, toPi); }, '売る街を選んでいます');
    if(!v || v.bankrupt) return false;
    var list = (Array.isArray(v.sell) ? v.sell : []).filter(function(i){
      var t = G.tiles[i]; return t && t.type === 'city' && t.owner === pi; });
    list.forEach(function(i){ dkrSellTile(pi, i); });
    try{ updHUD(); }catch(e){}
  }
  return p.cash >= amt;
}
/* 街を建物ごと市場へ売る（売値は建設費用の6割＝既存の sellValue） */
function dkrSellTile(pi, i){
  var t = G.tiles[i], val = sellValue(t);
  t.owner = -1; t.lv = 0; t.landmark = false;
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
  return t.lv > 0 ? BUILD[t.lv].nm : '土地';
}
function dkrSellHTML(pi, amt, toPi, rows, pre, enough){
  var p = G.players[pi], need = amt - p.cash;
  var to = (toPi >= 0 && G.players[toPi]) ? G.players[toPi].name + ' への支払い' : '支払い';
  var h = '<div class="modal"><div class="dkr-sell">'
    + '<div class="dkr-shd"><b>お金が足りません</b><span>' + esc(to) + '</span></div>'
    + '<div class="dkr-need">'
    +   '<div><span>支払う額</span><b>' + yen(amt) + '</b></div>'
    +   '<div><span>所持金</span><b>' + yen(p.cash) + '</b></div>'
    +   '<div class="dkr-short"><span>不足額</span><b>' + yen(need) + '</b></div>'
    + '</div><div class="dkr-slist">';
  rows.forEach(function(o){
    var t = G.tiles[o.i];
    h += '<div class="dkr-srow' + (pre.indexOf(o.i) >= 0 ? ' on' : '') + (enough ? '' : ' dkr-noop') + '" data-dkr-i="' + o.i + '" data-dkr-v="' + o.v + '">'
      + '<i class="dkr-sw" style="--dkr-g:' + dkrColOf(t) + '"></i>'
      + '<span class="dkr-snm">' + esc(t.name) + '</span><span class="dkr-slv">' + dkrLvName(t) + '</span>'
      + '<b class="dkr-sv">' + yen(o.v) + '</b><i class="dkr-sck" aria-hidden="true"></i></div>';
  });
  h += '</div><div class="dkr-sfoot">'
    + '<div class="dkr-ssum"><span>売る合計</span><b id="dkrSellSum">0</b></div>'
    + '<button class="dkr-btn dkr-gray" data-act="bankrupt">破産する</button>'
    + '<button class="dkr-btn dkr-red" data-act="sell" id="dkrSellOk">売る</button>'
    + '</div><p class="dkr-note">' + (enough
      ? '売った街は建物ごと市場に戻り、建設費用の6割を受け取ります。押して選び直せます。'
      : '全部売っても足りません。破産すると、持っている街は支払い先のものになります。')
    + '</p></div></div>';
  return h;
}
function dkrSellPick(pi, amt, toPi){
  return new Promise(function(res){
    var p = G.players[pi], need = amt - p.cash;
    var rows = dkrOwned(pi).map(function(i){ return { i:i, v:sellValue(G.tiles[i]) }; })
                           .sort(function(a, b){ return a.v - b.v; });
    var total = rows.reduce(function(s, o){ return s + o.v; }, 0), enough = total >= need;
    var pre = [];
    if(enough){
      var one = rows.filter(function(o){ return o.v >= need; })[0];     /* 1つで足りるなら一番安いそれ */
      if(one) pre = [one.i];
      else { var s = 0; rows.forEach(function(o){ if(s < need){ pre.push(o.i); s += o.v; } }); }
    }
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

/* ══════════ ボーナスゲーム「悪夢の洞窟脱出」（本家 v3k/t50） ══════════ */
function dkrTurnKey(){
  return (G && typeof G.turnSerial === 'number') ? G.turnSerial : ('t' + (G ? G.turnsLeft : 0) + '_' + (G ? G.turn : 0));
}
function miniHTML(stake, round, mult, hist, win, opt){
  opt = opt || {};
  var pi = (typeof opt.pi === 'number') ? opt.pi : (G ? G.turn : 0);
  var p = G && G.players ? G.players[pi] : null;
  var cash = p ? p.cash : Infinity, lock = round > 1 || !!opt.cpu;
  var cells = (hist || []).slice(0, 6).map(function(h){
    return '<div class="mgh ' + (h === 'L' ? 'dkr-l' : 'dkr-r') + '">' + (h === 'L' ? '左' : '右') + '</div>'; }).join('')
    || '<div class="mgh dkr-none">なし</div>';
  var stakes = [1500000, 1000000, 500000].map(function(v){
    var off = v > cash && v !== stake;
    return '<div class="mgstake' + (v === stake ? ' on' : '') + (off ? ' dkr-off' : '') + '" data-v="' + v + '">' + yen(v) + '</div>';
  }).join('');
  var badges = [1, 2, 3].map(function(r){
    var won = r < round, now = r === round;
    return '<span class="' + (won ? 'won' : now ? 'now' : '') + '"><b>' + (won ? 'WIN' : ['1st', '2nd', '3rd'][r - 1]) + '</b><i>GAME</i></span>';
  }).join('');
  var dis = opt.cpu ? ' disabled' : '';
  return '<div class="modal"><div class="mg dkr-mg">'
    + '<div class="mghd"><b>悪夢の洞窟脱出</b></div>'
    + '<div class="mgbody">'
    +   '<div class="mgleft">'
    +     '<div class="mgwho"><div class="mgname">' + esc(p ? p.name : '') + '</div>'
    +       '<div class="mgpic"><canvas data-dkr-port="' + pi + '" width="16" height="16"></canvas></div></div>'
    +     '<div class="mgcap">最近の結果</div><div class="mghist">' + cells + '</div>'
    +   '</div>'
    +   '<div class="mgstage" id="mgStage">'
    +     '<div class="mground">' + badges + '</div>'
    +     '<div class="mgart" id="mgArt"><canvas data-dkr-art="mini" width="16" height="12"></canvas></div>'
    +     '<div class="mgmsg" id="mgMsg">' + (opt.cpu ? esc(p ? p.name : '') + ' が挑戦中' : 'どちらの通路に逃げる？') + '</div>'
    +   '</div>'
    +   '<div class="mgright">'
    +     '<div class="mgcap">ゲーム費用</div><div class="mgstakes' + (lock ? ' dkr-lockd' : '') + '" id="mgStakes">' + stakes + '</div>'
    +     '<div class="mgcap">ボーナス倍率</div><div class="mgbig" id="mgMult">x' + mult + '</div>'
    +     '<div class="mgcap">獲得できる金額</div><div class="mgbig gold" id="mgWin">' + yen(win) + '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="mgfoot">'
    +   '<button class="mgarrow dkr-al" data-act="L"' + dis + ' aria-label="左の通路"><i></i></button>'
    +   '<button class="mgstop" data-act="stop"' + dis + '>STOP<i>報酬をもらう</i></button>'
    +   '<button class="mgarrow dkr-ar" data-act="R"' + dis + ' aria-label="右の通路"><i></i></button>'
    + '</div></div></div>';
}
async function miniGame(pi){
  var p = G.players[pi];
  if(!p || p.out) return;
  var key = dkrTurnKey();
  if(p.cash < 500000){ await band('悪夢の洞窟脱出', '所持金が50万に満たないので挑戦できません', 1300); return; }
  if(p.bonusTurn === key){ await band('悪夢の洞窟脱出', '同じターンに2回は挑戦できません', 1300); return; }
  p.bonusTurn = key;
  await band('悪夢の洞窟脱出', '左右どちらかの通路を選んで逃げきろう！', 1500);
  var cpu = p.kind === 'cpu';
  var stake = p.cash >= 1000000 ? 1000000 : 500000;
  var round = 1, mult = 2 * ((G.ev && G.ev.miniX) || 1), banked = 0;
  var hist = p.dkrMini = (Array.isArray(p.dkrMini) ? p.dkrMini : []);
  var rate = 0.5 + statRate(p, 'mini') * 0.22;
  var first = null;
  var q = function(sel){ return first ? first.querySelector(sel) : null; };
  var setStake = function(v){
    stake = v;
    if(!first) return;
    first.querySelectorAll('.mgstake').forEach(function(s){ s.classList.toggle('on', +s.getAttribute('data-v') === v); });
    var w = q('#mgWin'); if(w) w.textContent = yen(stake * mult);
  };
  var render = function(){
    first = dkrOpenModal(miniHTML(stake, round, mult, hist, stake * mult, { pi:pi, cpu:cpu }));
    first.querySelectorAll('.mgstake').forEach(function(s){
      s.onclick = function(){
        if(round > 1 || cpu || s.classList.contains('dkr-off')) return;
        var v = +s.getAttribute('data-v');
        if(v > p.cash) return;
        try{ SFX.click(); }catch(e){}
        setStake(v);
      };
    });
  };
  render();
  while(round <= 3){
    var v = await dvAsk(pi, 'mini', async function(){
      if(cpu){ await wait(900); return { c:(Math.random() < 0.5 ? 'L' : 'R'), s:stake }; }
      var c = await new Promise(function(res){
        first.querySelectorAll('[data-act]').forEach(function(b){
          b.onclick = function(){ if(b.disabled) return; try{ SFX.click(); }catch(e){} res(b.getAttribute('data-act')); };
        });
      });
      return { c:c, s:stake };
    }, '通路を選んでいます');
    if(round === 1 && v && v.s && v.s !== stake && v.s <= p.cash) setStake(v.s);
    if(!v || v.c === 'stop') break;
    var win = Math.random() < rate;
    first.querySelectorAll('[data-act]').forEach(function(b){ b.disabled = true; });
    var art = q('#mgArt canvas'), msg = q('#mgMsg');
    dkrMiniAnim(art, 'run', v.c);
    if(msg){ msg.textContent = (v.c === 'L' ? '左' : '右') + 'の通路へ走った……'; msg.className = 'mgmsg'; }
    await wait(650);
    hist.unshift(win ? v.c : (v.c === 'L' ? 'R' : 'L'));
    if(hist.length > 6) hist.length = 6;
    if(!win){
      dkrMiniAnim(art, 'lose', v.c);
      if(msg){ msg.textContent = 'つかまった！ 賭け金を失いました'; msg.className = 'mgmsg dkr-bad'; }
      try{ SFX.bad(); }catch(e){}
      camShake(9);
      await wait(1200);
      dkrCloseModal(first);
      if(!(await dkPayFrom(pi, stake, -1))){ await bankrupt(pi, -1); return; }
      give(pi, -stake);
      toast('L', '💀', '脱出失敗', yen(stake) + ' を失いました', 2200);
      return;
    }
    dkrMiniAnim(art, 'win', v.c);
    if(msg){ msg.textContent = '逃げきった！ 倍率アップ'; msg.className = 'mgmsg dkr-good'; }
    var bd = first.querySelectorAll('.mground span')[round - 1];
    if(bd){ bd.className = 'won'; bd.innerHTML = '<b>WIN</b><i>GAME</i>'; }
    try{ SFX.coin(); }catch(e){}
    banked = stake * mult;
    await wait(850);
    round++; mult *= 2;
    if(round > 3) break;
    render();
    if(cpu){
      var greedy = cfg.ai === 2 ? 0.6 : cfg.ai === 1 ? 0.45 : 0.3;
      if(Math.random() > greedy) break;
    }
  }
  if(first) dkrCloseModal(first);
  var prize = banked || 0;
  if(prize > 0){
    news('🕯️ ' + p.name + ' がボーナスゲームで ' + yen(prize) + ' を獲得！');
    give(pi, prize);
    addFx('pillar', tileCenter(p.pos).x, tileCenter(p.pos).y, 1000, '#FFD24D');
    await cutIn('BONUS GAME', '脱出成功！', yen(prize) + ' を獲得');
  } else {
    toast('L', '🕯️', '脱出中止', '何も得られませんでした', 1800);
  }
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
  if(key === 'mini'){ dkrMiniDraw(ctx, w, h, (cv && cv._dkrMini) || null, 0); return; }
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
  else if(tour){ fn = pink ? function(c2, cl, t2){ dkrPinkMon(c2, cl, t2, 2); } : dkrSkyMon; hgt = pink ? 72 : 90; wid = 60; }
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
/* 観光地の記念碑：空色＝白い灯台と空色のドーム（光が回る） */
function dkrSkyMon(ctx, col, T){
  var line = '#1B3A55';
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
  var v = Math.min(3, Math.max(0, t.visits | 0));
  var s = grow * (t.tour === 'pink' ? (0.92 + 0.12 * v) : 1.0);
  ctx.save();
  ctx.translate(A.o.x, A.o.y);
  ctx.scale(s, s);
  var pulse = 0.5 + 0.5 * Math.sin(T * 0.003 + i);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.scale(1, 0.4);
  var gl = ctx.createRadialGradient(0, 0, 2, 0, 0, 40);
  var c0 = t.tour === 'pink' ? '255,160,200' : '150,225,255';
  gl.addColorStop(0, 'rgba(' + c0 + ',' + (0.30 + 0.20 * pulse).toFixed(3) + ')');
  gl.addColorStop(1, 'rgba(' + c0 + ',0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if(t.tour === 'pink') dkrPinkMon(ctx, col, T, v); else dkrSkyMon(ctx, col, T);
  ctx.restore();
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
  var paint = function(k, T){ ctx.setTransform(k0, 0, 0, k0, 0, 0); ctx.clearRect(0, 0, w, h); cv._dkrMini.k = k; dkrMiniDraw(ctx, w, h, cv._dkrMini, T); };
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

/* ══════════ 起動：MAPS の書き換え・描画のラッパ・ポップアップの絵 ══════════ */
(function(){
  try{
    /* オリンピックは商標の心配があるので、世界一周の祭りの角は「ワールドフェスティバル」 */
    MAPS.forEach(function(m){
      if(m.id === 'world' && m.corners) m.corners[2] = 'ワールドフェスティバル';
      m.tours = DKR_TOUR_SLOTS.map(function(s){ return { i:s.i, kind:s.kind, name:dkrTourName(m, s.i, s.kind) }; });
    });
    /* drawTile：厚み（2段の側面）→ 元のマス（観光地は自前）→ 面取り・建物の群れ */
    DKR_o.drawTile = drawTile;
    drawTile = function(ctx, G2, i, T){
      var t = G2 && G2.tiles && G2.tiles[i];
      if(!t) return DKR_o.drawTile.apply(this, arguments);
      try{ dkrPlinth(ctx, i, t); }catch(e){ console.error('[WP5]', e); }
      var r;
      if(t.tour) r = dkrDrawTour(ctx, G2, i, T);
      else r = DKR_o.drawTile.apply(this, arguments);
      try{ dkrBevel(ctx, i, t); dkrCubes(ctx, i, t); }catch(e){ console.error('[WP5]', e); }
      return r;
    };
    /* drawBuilding：建物を 1.38倍（ランドマークは 1.22倍）、観光地は記念碑 */
    DKR_o.drawBuilding = drawBuilding;
    drawBuilding = function(ctx, G2, i, T){
      var t = G2 && G2.tiles && G2.tiles[i];
      if(t && t.tour){
        if(t.tour === 'pink' && t._dkrV !== (t.visits | 0)){ t._dkrV = t.visits | 0; try{ boardChanged(); }catch(e){} }
        if(t.owner >= 0){ try{ dkrMonumentAt(ctx, G2, i, T); }catch(e){} }
        return;
      }
      if(!t || t.type !== 'city' || t.owner < 0) return DKR_o.drawBuilding.apply(this, arguments);
      var A = dkrAnchor(i), s = t.landmark ? 1.22 : DKR_BSCALE;
      ctx.save();
      ctx.translate(A.o.x, A.o.y); ctx.scale(s, s); ctx.translate(-A.o.x, -A.o.y);
      try{ return DKR_o.drawBuilding.apply(this, arguments); } finally { ctx.restore(); }
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
  }catch(e){ console.error('[WP5]', e); }
})();
