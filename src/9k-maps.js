
/* ダイスキングダム — マップの仕掛け（9k-maps.js / WP12b）
   氷の洞窟＝氷の結晶（建設／凍結）・凍結ブロック（滑った数だけ通行料が上がる）・カード「凍結ブロック破壊」、
   大分めぐり＝湯けむりルーレット、世界一周＝なし。ボーナスゲームの舞台3種。C09 の本物（dkMap*）と
   drawTile・moveSteps・turnBig のラッパ。自動の人に画面を出さない（C14）。Math.random は対戦の乱数だけ。 */

/* ── 定数 ── */
var DKG_CRYSTAL_AT = [12, 28];
var DKG_ROULETTE_AT = 30;
var DKG_ICE_MAX = 3;
var DKG_ICE_START = 4;
var DKG_SLIDE_MAX = 6;
var DKG_TAU = Math.PI * 2;
var DKG_ICE_TXT = '凍結ブロックに到着すると滑ります';
var DKG_BUSY_ICE = '相手がブロックを凍結させています';
var DKG_RL_FX = [
  { id:'x2',     nm:'出目2倍',     col:'#E2A42A', ds:'次のサイコロの目が2倍' },
  { id:'start',  nm:'スタートへ',   col:'#3FA88C', ds:'スタートへ移動' },
  { id:'back',   nm:'逆に進む',     col:'#7A64C8', ds:'次は逆向きに進む' },
  { id:'ferry',  nm:'高速フェリー', col:'#3C86C8', ds:'次のターンに好きなマスへ' },
  { id:'dark',   nm:'停電',         col:'#56607A', ds:'いちばん高い都市の通行料が2ターン0' },
  { id:'donate', nm:'募金',         col:'#D2503E', ds:'最下位へ募金' }
];
var DKG_RL_TG = [
  { id:'all',    nm:'みんな' },
  { id:'others', nm:'自分以外' },
  { id:'top',    nm:'1位だけ' },
  { id:'last',   nm:'最下位だけ' },
  { id:'me',     nm:'自分だけ' }
];
var DKG_RL_TGCOL = ['#FFF3D6', '#FFE2C4', '#FFF8E6', '#FFE9CF', '#FFF0DA'];
var DKG_o = {};

/* ── 小さな道具 ── */
function dkgMapId(){ return (G && G.map && G.map.id) || ''; }
function dkgIced(t){ return !!(t && t.ice !== undefined && t.ice !== null && t.ice !== false && t.ice !== -1); }
function dkgAuto(pi){
  var p = G && G.players ? G.players[pi] : null;
  if(!p || p.kind === 'cpu') return true;
  try{ return typeof dkIsAuto === 'function' && !!dkIsAuto(pi); }catch(e){ return false; }
}
function dkgBusy(pi, txt){ try{ if(typeof dkBusyTag === 'function') dkBusyTag(pi, txt); }catch(e){ console.error('[WP12b]', e); } }
function dkgNote(pi, ic, title, sub, ms){
  try{ if(typeof dkNotify === 'function'){ dkNotify(pi, ic, title, sub, { ms:(ms || 2200) }); return; } }catch(e){ console.error('[WP12b]', e); }
  toast('R', ic, title, sub, ms);
}
function dkgSetPick(tag, note){ try{ if(typeof dktSetPick === 'function') dktSetPick(tag, note); }catch(e){} }
function dkgCorner(k){ return (G && G.map && G.map.corners && G.map.corners[k]) || ''; }
function dkgFxName(fx){ return (fx.id === 'ferry' && dkgCorner(3)) ? dkgCorner(3) : fx.nm; }
function dkgSfx(k){ try{ if(SFX && typeof SFX[k] === 'function') SFX[k](); }catch(e){} }
function dkgRing(i, col){ var c = tileCenter(i); addFx('ring', c.x, c.y, 700, col); addFx('spark', c.x, c.y - 26, 900, col); }
function dkgFreezable(i){
  var t = G && G.tiles ? G.tiles[i] : null;
  if(!t || i % 8 === 0) return false;
  if(t.type === 'crystal' || t.type === 'roulette') return false;
  return !dkgIced(t);
}
function dkgFreezeList(){ var o = []; for(var i = 0; i < 32; i++) if(dkgFreezable(i)) o.push(i); return o; }
function dkgChain(i){
  var path = [], n = 0, k = i;
  while(n < 31 && dkgIced(G.tiles[k])){ n++; k = (k + 1) % 32; path.push(k); }
  return { n:n, stop:k, path:path };
}
function dkgMul(n){ n = Math.max(0, Math.min(DKG_SLIDE_MAX, n | 0)); return 1 + 0.1 * n * (n + 3); }
function dkgMulTxt(n){ return dkgMul(n).toFixed(1); }
function dkgRankOf(top){
  var best = -1, bv = 0;
  G.players.forEach(function(q, i){
    if(q.out) return;
    var v = assetOf(G, i);
    if(best < 0 || (top ? v > bv : v < bv)){ best = i; bv = v; }
  });
  return best;
}
function dkgAlly(a, b){ try{ return typeof dkAlly === 'function' ? !!dkAlly(a, b) : a === b; }catch(e){ return a === b; } }

/* ── C09 契約の本物 ── */
function dkMapTiles(t, map){
  if(!t || !map) return t;
  try{
    var i, k;
    if(map.id === 'ice'){
      if(t.some(function(x){ return x && x.type === 'crystal'; })) return t;
      var used = {};
      DKG_CRYSTAL_AT.forEach(function(want){
        var at = (t[want] && t[want].type === 'card') ? want : dkgNearCard(t, want, used);
        if(at < 0) return;
        used[at] = 1;
        t[at] = { type:'crystal', name:'氷の結晶' };
      });
      if(!t.some(dkgIced)){
        for(var s = 0; s < 4 && s < DKG_ICE_START; s++){
          var c = [];
          for(k = 1; k < 8; k++){ i = s * 8 + k; if(t[i] && t[i].type === 'city' && !t[i].tour) c.push(i); }
          if(c.length) t[c[(Math.random() * c.length) | 0]].ice = true;
        }
      }
    } else if(map.id === 'oita'){
      if(t.some(function(x){ return x && x.type === 'roulette'; })) return t;
      var ti = (t[DKG_ROULETTE_AT] && t[DKG_ROULETTE_AT].type === 'tax') ? DKG_ROULETTE_AT : -1;
      for(i = 0; ti < 0 && i < t.length; i++) if(t[i] && t[i].type === 'tax') ti = i;
      if(ti >= 0) t[ti] = { type:'roulette', name:'湯けむりルーレット' };
    }
  }catch(e){ console.error('[WP12b]', e); }
  return t;
}
function dkgNearCard(t, want, used){
  var best = -1, bd = 99;
  for(var i = 0; i < t.length; i++){
    if(!t[i] || t[i].type !== 'card' || used[i]) continue;
    var d = Math.abs(i - want);
    if(d < bd){ bd = d; best = i; }
  }
  return best;
}
function dkMapToll(tile, g){
  var n = tile ? (tile.slide | 0) : 0;
  return n > 0 ? dkgMul(n) : 1;
}
function dkMapInfo(id){
  var m = null;
  for(var i = 0; i < MAPS.length; i++) if(MAPS[i].id === id){ m = MAPS[i]; break; }
  var nm = (m && m.name) || '';
  var cn = (m && m.corners) || [];
  if(id === 'ice') return { name:nm, gimmick:'氷の結晶', line:'ブロックを凍結させて滑らせちゃおう!',
    help:'「氷の結晶」のマスに止まると［建設］か［凍結］を選べます。'
      + '建設＝そのラインの自分の都市に建設、または空いた都市を購入。'
      + '凍結＝好きなブロックを最大3マス凍らせます（凍らせ直すと、前に凍らせたブロックは溶けます）。'
      + '凍結ブロックに到着すると、つながった凍結ブロックの先まで滑り、滑った先の通行料が上がります（1マス ×1.4・2マス ×2.0・3マス ×2.8）。'
      + 'フォーチュンカード「凍結ブロック破壊」で凍結ブロックを1つ壊せます。' };
  if(id === 'oita'){
    var don = 0;
    try{ don = dkRate('donate'); }catch(e){ don = 0; }
    return { name:nm, gimmick:'湯けむりルーレット', line:'湯けむりルーレットで運命が変わる!',
      help:'「湯けむりルーレット」のマスに止まると、ルーレットで［効果］と［対象］が決まります。'
        + '効果＝出目2倍（次のサイコロの目が2倍）・スタートへ・逆に進む（次は逆向きに進む）・'
        + (cn[3] || '高速フェリー') + '（次のターンに好きなマスへ）・停電（いちばん高い都市の通行料が2ターン0）・募金（最下位へ ' + yen(don) + '）。'
        + '対象＝みんな・自分以外・1位だけ・最下位だけ・自分だけ。このマップに国税庁はありません。' };
  }
  return { name:nm, gimmick:'', line:'仕掛けのない、いちばん基本のマップ',
    help:'マップの仕掛けはありません。国税庁（スタートの2つ手前）に止まると、所有する都市の建設費用の10%を納めます。' };
}
/* ボーナスゲームの舞台（WP11）。draw は dkrMiniDraw と同じ引数（ctx, w, h, {mode:'idle'|'run'|'win'|'lose', side:'L'|'R', k}, T） */
function dkMapBonus(id){
  if(id === 'ice') return { title:'氷の上を渡る', a:'左の氷', b:'右の氷', draw:dkgBonusIce,
    say:{ ask:'どちらの氷を渡る？', run:'氷の上を走った……', win:'渡りきった！', lose:'氷が割れた！' } };
  if(id === 'oita') return { title:'湯おけの宝さがし', a:'左の湯おけ', b:'右の湯おけ', draw:dkgBonusOnsen,
    say:{ ask:'お宝はどちらの湯おけ？', run:'湯おけを開けた……', win:'お宝発見！', lose:'からっぽ…' } };
  if(id === 'world') return { title:'コインの表裏', a:'表', b:'裏', draw:dkgBonusCoin,
    say:{ ask:'表か裏か？', run:'コインを投げた……', win:'当たり！', lose:'はずれ…' } };
  return null;
}
function dkMapCards(id){
  if(id !== 'ice') return [];
  return [{ id:'dkgBreak', grp:'atk', gold:false, rank:'silver', nm:'凍結ブロック破壊', ds:'凍結ブロックを選択して破壊できます',
            run:dkgBreakCard }];
}
function dkMapResolve(pi, t, depth){
  try{
    if(!G || !G.players || !G.players[pi]) return Promise.resolve(0);
    var p = G.players[pi];
    if(!t) t = G.tiles[p.pos];
    var fresh = dkgSlideTake(pi);
    if(!t || (depth | 0) >= 3 || G.over || p.out) return Promise.resolve(0);
    var id = dkgMapId();
    if(id === 'ice'){
      if(t.type === 'crystal') return dkgSafe(dkgCrystal(pi));
      if(!fresh && dkgIced(t)) return dkgSafe(dkgSlide(pi));
    } else if(id === 'oita' && t.type === 'roulette') return dkgSafe(dkgRoulette(pi));
  }catch(e){ console.error('[WP12b]', e); }
  return Promise.resolve(0);
}
function dkgSafe(pr){
  return Promise.resolve(pr).then(function(v){ return (v === 1 || v === 2) ? v : 0; },
    function(e){ console.error('[WP12b]', e); return 1; });
}
/* ── 凍結ブロックで滑る ── */
function dkgSlideTake(pi){
  var s = G.dkgSlide;
  if(!s) return false;
  var p = G.players[pi];
  if(s.fresh && s.pi === pi && p && p.pos === s.i && s.at === (G.turnSerial | 0)){ s.fresh = false; return true; }
  dkgSlideClear();
  return false;
}
function dkgSlideClear(){
  var s = G && G.dkgSlide;
  if(!s) return;
  G.dkgSlide = null;
  var t = G.tiles && G.tiles[s.i];
  if(t && t.slide){ t.slide = 0; boardChanged(); }
}
async function dkgSlide(pi){
  var p = G.players[pi], ch = dkgChain(p.pos);
  if(!ch.n || !ch.path.length) return 0;
  var n = Math.min(DKG_SLIDE_MAX, ch.n);
  dkgSfx('warn');
  await band(DKG_ICE_TXT, n + 'マス滑ります　滑った先の通行料 ×' + dkgMulTxt(n), 1300);
  if(G.over || p.out) return 1;
  await dkgGlide(pi, ch.path);
  if(G.over || p.out) return 1;
  var st = G.tiles[p.pos];
  st.slide = n;
  G.dkgSlide = { pi:pi, i:p.pos, at:(G.turnSerial | 0), fresh:true };
  boardChanged();
  dkgRing(p.pos, '#CFF4FF');
  dkgSfx('land');
  if(st.type === 'city' && st.owner >= 0 && !dkgAlly(st.owner, pi)){ try{ raiseBanner('通行料 ×' + dkgMulTxt(n) + '！'); }catch(e){} }
  news('🧊 ' + p.name + ' が凍結ブロックで ' + n + 'マス滑った！');
  return 2;
}
function dkgGlide(pi, path){
  return new Promise(function(res){
    var p = G.players[pi], g0 = G;
    if(!p || !path.length){ res(); return; }
    var pts = [tileCenter(p.pos)];
    path.forEach(function(k){ pts.push(tileCenter(k)); });
    var D = Math.max(1, 190 * SPEED * path.length), t0 = null, done = false, seg0 = -1;
    p.moving = true;
    var fin = function(){
      if(done) return;
      done = true;
      if(G !== g0){ res(); return; }
      var last = path[path.length - 1];
      p.pos = last;
      if(last === 0) p.laps = (p.laps | 0) + 1;
      p.render = tileCenter(last); p.hopY = 0; p.moving = false;
      res();
    };
    var step = function(now){
      if(done) return;
      if(G !== g0 || G.over){ fin(); return; }
      if(t0 === null) t0 = now;
      var k = Math.min(1, (now - t0) / D), e = 1 - (1 - k) * (1 - k);
      var f = e * path.length, seg = Math.min(path.length - 1, Math.floor(f)), u = Math.min(1, f - seg);
      var A = pts[seg], B = pts[seg + 1];
      p.render = { x:A.x + (B.x - A.x) * u, y:A.y + (B.y - A.y) * u }; p.hopY = 0;
      p.face = (B.x >= A.x) ? 1 : -1;
      if(seg !== seg0){
        seg0 = seg;
        camTo(B.x, B.y, 1.45);
        addFx('spark', A.x, A.y - 10, 520, '#E8FAFF');
        dkgSfx('step');
      }
      if(k >= 1){ fin(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(fin, D + 400);
  });
}

/* ── 氷の結晶：建設か凍結 ── */
function dkgBuildList(pi, at){
  var s = Math.floor(at / 8), out = [];
  for(var k = 1; k < 8; k++){
    var i = s * 8 + k, t = G.tiles[i];
    if(!t || t.type !== 'city' || t.tour) continue;
    if(t.owner < 0 || (t.owner === pi && !t.landmark)) out.push(i);
  }
  return out;
}
function dkgNextCost(pi, i){
  var t = G.tiles[i];
  try{
    if(t.owner < 0) return t.base;
    if((t.lv | 0) < 3) return BUILD[(t.lv | 0) + 1].cost(t.base);
    return BUILD[4].cost(t.base);
  }catch(e){ return t.base; }
}
function dkgAiBuildTile(pi, list){
  var p = G.players[pi], best = -1, bs = -1e18;
  list.forEach(function(i){
    var t = G.tiles[i];
    if(dkgNextCost(pi, i) > p.cash) return;
    var s = (t.owner === pi ? tollOf(t, G) * 1.5 + 1e6 : 0) + t.base;
    if(s > bs){ bs = s; best = i; }
  });
  return best;
}
function dkgAiIce(pi){
  var own = [];
  for(var i = 0; i < 32; i++){
    var t = G.tiles[i];
    if(t && t.type === 'city' && t.owner >= 0 && dkgAlly(t.owner, pi) && !(t.frozen > 0)) own.push(i);
  }
  own.sort(function(a, b){ return tollOf(G.tiles[b], G) - tollOf(G.tiles[a], G) || a - b; });
  var ok = function(k){ var t = G.tiles[k]; return !!t && (dkgFreezable(k) || t.ice === pi) && k % 8 !== 0 && t.type !== 'crystal' && t.type !== 'roulette'; };
  for(var n = 0; n < own.length; n++){
    var c = own[n], tiles = [];
    for(var d = 1; d <= DKG_ICE_MAX; d++){ var k = (c - d + 32) % 32; if(!ok(k)) break; tiles.push(k); }
    if(tiles.length) return { tiles:tiles, gain:tollOf(G.tiles[c], G) * (dkgMul(tiles.length) - 1) * tiles.length / DKG_ICE_MAX };
  }
  return { tiles:[], gain:0 };
}
function dkgAiCrystal(pi, at){
  var ice = dkgAiIce(pi), bl = dkgBuildList(pi, at), bt = bl.length ? dkgAiBuildTile(pi, bl) : -1;
  var bg = 0;
  if(bt >= 0){ var t = G.tiles[bt]; bg = t.owner < 0 ? t.base * 0.4 : BUILD[Math.min(3, (t.lv | 0) + 1)].toll(t.base); }
  if(ice.tiles.length && ice.gain >= bg) return { c:'freeze', tiles:ice.tiles };
  if(bt >= 0) return { c:'build', tile:bt };
  if(ice.tiles.length) return { c:'freeze', tiles:ice.tiles };
  return { c:'none' };
}
async function dkgCrystal(pi){
  var p = G.players[pi], at = p.pos, auto = dkgAuto(pi);
  var bl = dkgBuildList(pi, at), canB = bl.length > 0, canF = dkgFreezeList().length > 0;
  var c0 = tileCenter(at);
  addFx('pillar', c0.x, c0.y, 900, '#9FE8FF');
  dkgSfx('cardIn');
  if(!canB && !canF){ await band('氷の結晶', '建設も凍結もできません', 1300); return 1; }
  var dec = await dvAsk(pi, 'crystal', function(){
    return auto ? dkgAiCrystal(pi, at) : dkgCrystalUI(pi, canB, canF, at);
  }, '氷の結晶を選んでいます');
  dec = (dec && typeof dec === 'object') ? dec : { c:'none' };
  if(G.over || p.out) return 1;
  if(dec.c === 'build' && canB) await dkgDoBuild(pi, at, bl, dec);
  else if(dec.c === 'freeze' && canF) await dkgDoFreeze(pi, dec);
  return 1;
}
async function dkgDoBuild(pi, at, list, dec){
  var p = G.players[pi], d;
  if(dkgAuto(pi)) d = (list.indexOf(dec.tile) >= 0) ? dec.tile : dkgAiBuildTile(pi, list);
  else {
    dkgSetPick('氷の結晶', '所有しているエリアの中から選択したエリアに建設することができます');
    dkgBusy(pi, '都市購入中');
    try{ d = await pickTile(pi, '建設するエリアを選択してください', function(z){ return list.indexOf(z) >= 0; }); }
    finally { dkgBusy(pi, null); }
  }
  if(!(d >= 0) || list.indexOf(d) < 0 || G.over || p.out) return;
  dkgRing(d, '#9FE8FF');
  if(dkgAuto(pi)) await aiBuy(pi, d); else await buyUI(pi, d);
}
async function dkgDoFreeze(pi, dec){
  var p = G.players[pi], n = 0, i;
  dkgBusy(pi, DKG_BUSY_ICE);
  try{
    var old = [];
    for(i = 0; i < 32; i++) if(G.tiles[i].ice === pi) old.push(i);
    if(old.length){ old.forEach(function(k){ dkgMeltAt(k, true); }); boardChanged(); await wait(220); }
    if(dkgAuto(pi)){
      var list = Array.isArray(dec.tiles) ? dec.tiles : [];
      for(i = 0; i < list.length && n < DKG_ICE_MAX; i++){
        if(!dkgFreezable(list[i])) continue;
        await dkgFreezeAt(pi, list[i]); n++;
      }
    } else {
      for(i = 0; i < DKG_ICE_MAX && !G.over; i++){
        if(!dkgFreezeList().length) break;
        dkgSetPick('凍結', '凍らせるブロックを選んでください（' + (i + 1) + '／' + DKG_ICE_MAX + '）');
        var d = await pickTile(pi, 'ブロックを凍らせる', dkgFreezable);
        if(!(d >= 0) || !dkgFreezable(d)) break;
        await dkgFreezeAt(pi, d); n++;
      }
    }
  } finally { dkgBusy(pi, null); }
  if(n) news('🧊 ' + p.name + ' がブロックを ' + n + 'マス凍結させた！');
}
async function dkgFreezeAt(pi, i){
  G.tiles[i].ice = pi;
  boardChanged();
  dkgRing(i, '#DFF7FF');
  dkgSfx('tick');
  await wait(240);
}
function dkgMeltAt(i, quiet){
  var t = G.tiles[i];
  if(!t) return;
  delete t.ice;
  if(!quiet){ boardChanged(); }
  var c = tileCenter(i);
  addFx('steam', c.x, c.y - 8, 700);
}
function dkgOpenModal(html){
  var wrap = document.getElementById('modalWrap'), body = document.getElementById('modalBody');
  if(!wrap || !body) return null;
  if(window.DKFX) DKFX.mseq = (DKFX.mseq | 0) + 1;
  body.innerHTML = html;
  wrap.classList.remove('fx-closing');
  wrap.classList.add('on');
  return body.firstElementChild;
}
function dkgCloseModal(first){
  var wrap = document.getElementById('modalWrap'), body = document.getElementById('modalBody');
  if(!wrap || !body) return;
  var ms = ((window.DKFX && DKFX.reduced) ? 0 : 170) * ((typeof SPEED === 'number' && SPEED > 0) ? SPEED : 1);
  var fin = function(){ wrap.classList.remove('fx-closing'); if(body.firstElementChild === first) wrap.classList.remove('on'); };
  if(ms < 1){ fin(); return; }
  wrap.classList.add('fx-closing');
  setTimeout(fin, ms);
}
function dkgCrystalHTML(canB, canF){
  var opt = function(key, title, desc, btn, on, cls){
    return '<div class="dkg-opt' + (on ? '' : ' dkg-no') + '">'
      + '<div class="dkg-art"><canvas data-dkg-art="' + key + '" width="16" height="12"></canvas></div>'
      + '<div class="dkg-ot">' + title + '</div><p>' + desc + '</p>'
      + '<button class="dkg-btn' + (cls || '') + '" data-act="' + key + '"' + (on ? '' : ' disabled') + '>' + btn + '</button></div>';
  };
  return '<div class="modal"><div class="dkg-cry">'
    + '<div class="dkg-hd"><i class="dkg-hic" aria-hidden="true"></i><b>氷の結晶</b></div>'
    + '<div class="dkg-opts">'
    +   opt('build', '建設', canB ? 'このラインの自分の都市に建設、<br>または空いた都市を購入します' : 'このラインに建設できる都市がありません', '建設する', canB, '')
    +   opt('freeze', '凍結', 'ブロックを最大3マス凍らせます<br>到着した人は滑ります', '凍結させる', canF, ' dkg-blue')
    + '</div>'
    + '<button class="dkg-cancel" data-act="none">キャンセル</button>'
    + '</div></div>';
}
function dkgCrystalUI(pi, canB, canF, at){
  return new Promise(function(res){
    var first = dkgOpenModal(dkgCrystalHTML(canB, canF));
    if(!first){ res(dkgAiCrystal(pi, at)); return; }
    dkgPaintAll(first);
    var done = false, tm = 0;
    var end = function(v){
      if(done) return;
      done = true; clearTimeout(tm);
      dkgCloseModal(first);
      res(v);
    };
    first.querySelectorAll('[data-act]').forEach(function(b){
      b.onclick = function(){
        if(done || b.disabled) return;
        dkgSfx('click');
        end({ c:b.getAttribute('data-act') });
      };
    });
    tm = setTimeout(function(){ var a = dkgAiCrystal(pi, at); end({ c:a.c }); }, 20000 * SPEED + 50);
  });
}

/* ── フォーチュンカード「凍結ブロック破壊」 ── */
function dkgAiBreak(pi, list){
  var best = list[0], bs = -1e18, p = G.players[pi];
  list.forEach(function(i){
    var ch = dkgChain(i), st = G.tiles[ch.stop], s = 0;
    if(st && st.type === 'city' && st.owner >= 0) s = (dkgAlly(st.owner, pi) ? -1 : 1) * tollOf(st, G) * dkgMul(ch.n);
    s -= ((i - p.pos + 32) % 32) * 1000;
    if(s > bs){ bs = s; best = i; }
  });
  return best;
}
async function dkgBreakCard(pi){
  var list = [];
  for(var i = 0; i < 32; i++) if(dkgIced(G.tiles[i])) list.push(i);
  if(!list.length){ dkgNote(pi, '🧊', '凍結ブロック破壊', '破壊できる凍結ブロックがありません', 1800); return; }
  var d;
  if(dkgAuto(pi)) d = dkgAiBreak(pi, list);
  else {
    dkgSetPick('凍結ブロック破壊', '凍結ブロックを選択して破壊できます');
    d = await pickTile(pi, '破壊する凍結ブロックを選んでください', function(z){ return list.indexOf(z) >= 0; });
  }
  if(!(d >= 0) || list.indexOf(d) < 0) return;
  dkgMeltAt(d, false);
  var c = tileCenter(d);
  addFx('ring', c.x, c.y, 800, '#FFFFFF');
  addFx('spark', c.x, c.y - 20, 900, '#CFF4FF');
  camShake(6);
  dkgSfx('shock');
  dkgNote(pi, '🧊', '凍結ブロック破壊', G.tiles[d].name + ' の凍結ブロックを破壊しました', 2000);
  await wait(300);
}
/* ── 湯けむりルーレット（効果 × 対象） ── */
async function dkgRoulette(pi){
  var p = G.players[pi], auto = dkgAuto(pi);
  var e = (Math.random() * DKG_RL_FX.length) | 0, g = (Math.random() * DKG_RL_TG.length) | 0;
  var c0 = tileCenter(p.pos);
  addFx('steam', c0.x, c0.y - 10, 1100);
  dkgBusy(pi, '湯けむりルーレットを回しています');
  var v;
  try{
    v = await dvAsk(pi, 'roulette', function(){
      return auto ? { ok:1, e:e, g:g } : dkgRouletteUI(pi, e, g);
    }, '湯けむりルーレットを回しています');
  } finally { dkgBusy(pi, null); }
  if(v && typeof v === 'object' && v.e >= 0 && v.e < DKG_RL_FX.length && v.g >= 0 && v.g < DKG_RL_TG.length){ e = v.e | 0; g = v.g | 0; }
  if(G.over || p.out) return 1;
  if(p.kind === 'cpu') await dkgRouletteSpec(pi, e, g);
  return dkgRouletteApply(pi, e, g);
}
function dkgTargets(pi, id){
  var alive = [];
  G.players.forEach(function(q, i){ if(!q.out) alive.push(i); });
  if(id === 'all') return alive;
  if(id === 'others') return alive.filter(function(i){ return i !== pi; });
  if(id === 'me') return alive.indexOf(pi) >= 0 ? [pi] : [];
  var r = dkgRankOf(id === 'top');
  return r >= 0 ? [r] : [];
}
function dkgBestCity(pj){
  var best = -1, bs = 0;
  for(var i = 0; i < 32; i++){
    var t = G.tiles[i];
    if(!t || t.type !== 'city' || t.owner !== pj || t.frozen > 0) continue;
    var s = tollOf(t, G);
    if(best < 0 || s > bs){ best = i; bs = s; }
  }
  return best;
}
function dkgTag(pj, txt, col){
  var q = G.players[pj]; if(!q) return;
  var c = q.render || tileCenter(q.pos);
  addFx('num', c.x, c.y - 74, 1500, col, txt, false);
}
async function dkgRouletteApply(pi, e, g){
  var p = G.players[pi], fx = DKG_RL_FX[e], tg = DKG_RL_TG[g], fnm = dkgFxName(fx);
  var who = dkgTargets(pi, tg.id), last = dkgRankOf(false);
  if(fx.id === 'donate') who = who.filter(function(j){ return j !== last; });
  if(fx.id === 'start' || fx.id === 'ferry') who = who.filter(function(j){ return !(G.players[j].jail > 0); });
  var names = who.map(function(j){ return G.players[j].name; }).join('・');
  dkgSfx(who.length ? 'coinBurst' : 'warn');
  await band('湯けむりルーレット', fnm + '　×　' + tg.nm + (names ? '（' + names + '）' : ''), 1500);
  if(!who.length){ dkgNote(pi, '♨️', fnm, '対象になる人がいません', 1800); return 1; }
  var moved = false, i, q;
  switch(fx.id){
  case 'x2':
    who.forEach(function(j){ q = G.players[j]; q.dkgX2 = true; q.dkgRev = false; dkgTag(j, '出目2倍', '#FFD24D'); });
    break;
  case 'back':
    who.forEach(function(j){ q = G.players[j]; q.dkgRev = true; q.dkgX2 = false; dkgTag(j, '逆に進む', '#C8B8FF'); });
    break;
  case 'ferry':
    who.forEach(function(j){
      q = G.players[j]; q.travel = true;
      if(typeof q.travelFree === 'number') q.travelFree++; else q.travelFree = true;
      dkgTag(j, fnm, '#9FD8FF');
    });
    break;
  case 'dark':
    who.forEach(function(j){
      var d = dkgBestCity(j);
      if(d < 0) return;
      G.tiles[d].frozen = 2;
      dkgRing(d, '#8FE8FF');
    });
    boardChanged();
    dkgSfx('bad');
    break;
  case 'donate':
    var amt = 0;
    try{ amt = dkRate('donate'); }catch(err){ amt = 0; }
    who.forEach(function(j){
      q = G.players[j];
      var a = Math.max(0, Math.min(q.cash, amt));
      if(a > 0 && last >= 0 && !G.players[last].out){ give(j, -a); give(last, a); }
    });
    if(last >= 0) dkgTag(last, '募金', '#FFB0A0');
    break;
  case 'start':
    for(i = 0; i < who.length; i++){
      var j = who[i];
      if(j === pi || G.players[j].out) continue;
      await jumpTo(j, 0, { salary:false });
    }
    if(who.indexOf(pi) >= 0 && !p.out && p.pos !== 0){ await jumpTo(pi, 0, { salary:false }); moved = true; }
    break;
  }
  try{ updHUD(); }catch(err){}
  dkgNote(pi, '♨️', fnm + '（' + tg.nm + '）', names, 2000);
  news('♨️ 湯けむりルーレット：' + fnm + ' × ' + tg.nm);
  return moved ? 2 : 1;
}
function dkgWheelHTML(){
  var ring = function(list, cls, cols){
    var N = list.length, seg = 360 / N, stops = [], lab = '';
    for(var k = 0; k < N; k++){
      stops.push(cols[k] + ' ' + (k * seg).toFixed(2) + 'deg ' + ((k + 1) * seg).toFixed(2) + 'deg');
      lab += '<i style="transform:rotate(' + (k * seg + seg / 2).toFixed(2) + 'deg)"><b>' + esc(list[k]) + '</b></i>';
    }
    var lines = [];
    for(var m = 0; m < N; m++) lines.push('rgba(255,236,190,.9) ' + (m * seg - 0.6).toFixed(2) + 'deg ' + (m * seg + 0.6).toFixed(2) + 'deg');
    return '<div class="dkg-ring ' + cls + '" style="background:conic-gradient(from 0deg,' + lines.map(function(s, k){
      return s + ',' + stops[k]; }).join(',') + ')">' + lab + '</div>';
  };
  var fxn = DKG_RL_FX.map(dkgFxName), fxc = DKG_RL_FX.map(function(f){ return f.col; });
  var tgn = DKG_RL_TG.map(function(t){ return t.nm; });
  return '<div class="dkg-wh">' + ring(fxn, 'dkg-r0', fxc) + ring(tgn, 'dkg-r1', DKG_RL_TGCOL)
    + '<div class="dkg-hub"><b>♨</b></div><i class="dkg-ptr" aria-hidden="true"></i></div>';
}
function dkgWheel(el, N){
  var W = { a:0, raf:0, on:false, last:0 };
  var put = function(){ if(el) el.style.transform = 'rotate(' + W.a.toFixed(2) + 'deg)'; };
  W.free = function(){
    if(!el) return;
    W.on = true; W.last = 0;
    var spin = function(now){
      if(!W.on || !el.isConnected) return;
      if(W.last) W.a += Math.min(40, now - W.last) * 0.62;
      W.last = now; put();
      W.raf = requestAnimationFrame(spin);
    };
    W.raf = requestAnimationFrame(spin);
  };
  W.kill = function(){ W.on = false; cancelAnimationFrame(W.raf); };
  W.stopAt = function(k, ms){
    W.kill();
    return new Promise(function(res){
      if(!el){ res(); return; }
      var seg = 360 / N, want = (360 - (k * seg + seg / 2)) % 360;
      var from = W.a, base = from + 720, to = base + ((want - (base % 360)) % 360 + 360) % 360;
      var D = Math.max(1, (ms || 1400) * SPEED), t0 = null, done = false;
      var fin = function(){ if(done) return; done = true; W.a = to % 360; put(); res(); };
      var step = function(now){
        if(done) return;
        if(!el.isConnected){ fin(); return; }
        if(t0 === null) t0 = now;
        var u = Math.min(1, (now - t0) / D), e2 = 1 - Math.pow(1 - u, 3);
        W.a = from + (to - from) * e2; put();
        if(u >= 1){ fin(); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      setTimeout(fin, D + 400);
    });
  };
  return W;
}
function dkgRouletteHTML(){
  return '<div class="modal"><div class="dkg-rl">'
    + '<div class="dkg-hd"><i class="dkg-hic" aria-hidden="true">♨</i><b>湯けむりルーレット</b></div>'
    + '<div class="dkg-rlb">' + dkgWheelHTML()
    +   '<div class="dkg-rlside">'
    +     '<div class="dkg-step on" data-s="0"><span>1</span><b>効果</b><em>？</em></div>'
    +     '<div class="dkg-step" data-s="1"><span>2</span><b>対象</b><em>？</em></div>'
    +     '<p class="dkg-rlnote">STOP を押すと、外の輪（効果）が止まります</p>'
    +     '<button class="dkg-btn dkg-stop" data-act="stop">STOP</button>'
    +   '</div>'
    + '</div></div></div>';
}
function dkgRouletteUI(pi, e, g){
  return new Promise(function(res){
    var first = dkgOpenModal(dkgRouletteHTML());
    if(!first){ res({ ok:1, e:e, g:g }); return; }
    var q = function(s){ return first.querySelector(s); };
    var w0 = dkgWheel(q('.dkg-r0'), DKG_RL_FX.length), w1 = dkgWheel(q('.dkg-r1'), DKG_RL_TG.length);
    var btn = q('[data-act="stop"]'), note = q('.dkg-rlnote'), steps = first.querySelectorAll('.dkg-step');
    var stage = 0, busy = false, done = false, tm = 0;
    var end = function(){
      if(done) return;
      done = true; clearTimeout(tm); w0.kill(); w1.kill();
      dkgCloseModal(first);
      res({ ok:1, e:e, g:g });
    };
    var show = function(k, txt){
      var s = steps[k]; if(!s) return;
      s.querySelector('em').textContent = txt;
      s.classList.add('dkg-set'); s.classList.remove('on');
      if(steps[k + 1]) steps[k + 1].classList.add('on');
    };
    var arm = function(){ clearTimeout(tm); tm = setTimeout(function(){ press(); }, 6000 * SPEED + 40); };
    var press = function(){
      if(busy || done) return;
      if(!first.isConnected || !G || G.over){ end(); return; }
      busy = true; btn.disabled = true; clearTimeout(tm);
      dkgSfx('click');
      if(stage === 0){
        w0.stopAt(e, 1500).then(function(){
          dkgSfx('coin');
          show(0, dkgFxName(DKG_RL_FX[e]));
          note.textContent = 'もう一度 STOP を押すと、内の輪（対象）が止まります';
          stage = 1; w1.free(); busy = false; btn.disabled = false; arm();
        });
      } else {
        w1.stopAt(g, 1300).then(function(){
          dkgSfx('coinBurst');
          show(1, DKG_RL_TG[g].nm);
          note.textContent = dkgFxName(DKG_RL_FX[e]) + ' × ' + DKG_RL_TG[g].nm + '！';
          setTimeout(end, 800 * SPEED + 20);
        });
      }
    };
    btn.onclick = press;
    w0.free();
    arm();
  });
}
async function dkgRouletteSpec(pi, e, g){
  var st = document.getElementById('stage');
  if(!st) return;
  var el = document.createElement('div');
  el.className = 'dkg-spec';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="dkg-spwho" style="--dkg-pc:' + (PCOL[pi] || '#3E8FE0') + '">' + esc(G.players[pi].name) + ' の湯けむりルーレット</div>'
    + dkgWheelHTML() + '<div class="dkg-spres">…</div>';
  st.appendChild(el);
  var w0 = dkgWheel(el.querySelector('.dkg-r0'), DKG_RL_FX.length), w1 = dkgWheel(el.querySelector('.dkg-r1'), DKG_RL_TG.length);
  w0.free(); w1.free();
  try{
    await wait(300);
    await w0.stopAt(e, 650);
    await w1.stopAt(g, 550);
    var r = el.querySelector('.dkg-spres');
    if(r) r.textContent = dkgFxName(DKG_RL_FX[e]) + ' × ' + DKG_RL_TG[g].nm;
    dkgSfx('coin');
    await wait(520);
  } finally {
    w0.kill(); w1.kill();
    el.classList.add('dkg-out');
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 230 * SPEED + 20);
  }
}
/* ── 盤の絵 ── */
function dkgHash(i, k){ var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); }
function dkgLin(ctx, x0, y0, x1, y1, cols){
  var g = ctx.createLinearGradient(x0, y0, x1, y1), n = cols.length - 1;
  cols.forEach(function(c, k){ g.addColorStop(n ? k / n : 0, c); });
  return g;
}
function dkgOv(ctx, x, y, rx, ry, f){ ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, DKG_TAU); ctx.fillStyle = f; ctx.fill(); }
function dkgInnerQuad(i, f){
  var r = RECTS[i], p = r.p, q = r.q, w = r.w, h = r.h;
  if(r.side === 0) return [proj(p, q), proj(p + w, q), proj(p + w, q + h * (1 - f)), proj(p, q + h * (1 - f))];
  if(r.side === 1) return [proj(p + w * f, q), proj(p + w, q), proj(p + w, q + h), proj(p + w * f, q + h)];
  if(r.side === 2) return [proj(p, q + h * f), proj(p + w, q + h * f), proj(p + w, q + h), proj(p, q + h)];
  return [proj(p, q), proj(p + w * (1 - f), q), proj(p + w * (1 - f), q + h), proj(p, q + h)];
}
function dkgInnerPt(i){
  var r = RECTS[i], cx = r.p + r.w / 2, cy = r.q + r.h / 2;
  if(r.side === 0) return proj(cx, r.q + r.h * 0.2);
  if(r.side === 1) return proj(r.p + r.w * 0.8, cy);
  if(r.side === 2) return proj(cx, r.q + r.h * 0.8);
  return proj(r.p + r.w * 0.2, cy);
}
function dkgTopBot(q){
  var top = q[0], bot = q[0];
  q.forEach(function(p){ if(p.y < top.y) top = p; if(p.y > bot.y) bot = p; });
  return { top:top, bot:bot };
}
function dkgFace(ctx, i, cols, glow){
  var q = shrinkQuad(tileQuad(i), 4), tb = dkgTopBot(q), c = centroid(q);
  ctx.save();
  polyPath(ctx, q); ctx.clip();
  ctx.fillStyle = dkgLin(ctx, tb.top.x, tb.top.y, tb.bot.x, tb.bot.y, cols);
  ctx.fillRect(c.x - 140, c.y - 140, 280, 280);
  var rg = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 64);
  rg.addColorStop(0, glow); rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg; ctx.fillRect(c.x - 80, c.y - 80, 160, 160);
  ctx.restore();
  ctx.save(); polyPath(ctx, q); ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  return c;
}
function dkgCyl(ctx, cy, rx, ry, hh, side, top, rim){
  ctx.beginPath();
  ctx.moveTo(-rx, cy - hh); ctx.lineTo(-rx, cy);
  ctx.ellipse(0, cy, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(rx, cy - hh);
  ctx.ellipse(0, cy - hh, rx, ry, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, -rx, 0, rx, 0, side); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, cy - hh, rx, ry, 0, 0, DKG_TAU);
  ctx.fillStyle = dkgLin(ctx, 0, cy - hh - ry, 0, cy - hh + ry, top); ctx.fill();
  if(rim){ ctx.lineWidth = 1.6; ctx.strokeStyle = rim; ctx.stroke(); }
}
function dkgSpark(ctx, x, y, r, col){
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = col || '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.16, -r * 0.16, r, 0); ctx.quadraticCurveTo(r * 0.16, r * 0.16, 0, r);
  ctx.quadraticCurveTo(-r * 0.16, r * 0.16, -r, 0); ctx.quadraticCurveTo(-r * 0.16, -r * 0.16, 0, -r);
  ctx.fill(); ctx.restore();
}
function dkgShard(ctx, cx, top, bot, w, lean){
  var sh = top + w * 1.5;
  ctx.beginPath(); ctx.moveTo(cx + lean, top); ctx.lineTo(cx - w, sh); ctx.lineTo(cx - w, bot); ctx.lineTo(cx, bot + w * 0.55); ctx.lineTo(cx + lean * 0.4, sh + 2); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, cx - w, top, cx, bot, ['#9ADCFA', '#3E98D8', '#1C5A9E']); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + lean, top); ctx.lineTo(cx + lean * 0.4, sh + 2); ctx.lineTo(cx, bot + w * 0.55); ctx.lineTo(cx + w, bot); ctx.lineTo(cx + w, sh); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, cx, top, cx + w, bot, ['#FFFFFF', '#CFF3FF', '#7CCBF0']); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + lean, top); ctx.lineTo(cx - w, sh); ctx.lineTo(cx - w, bot); ctx.lineTo(cx, bot + w * 0.55); ctx.lineTo(cx + w, bot); ctx.lineTo(cx + w, sh); ctx.closePath();
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(14,52,104,.7)'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - w * 0.55, sh + 3); ctx.lineTo(cx - w * 0.55, bot - 3);
  ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
}
function dkgPaintCrystal(ctx, x, y, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(8,24,52,.36)'; ctx.beginPath(); ctx.ellipse(3, 3, 32, 11, 0, 0, DKG_TAU); ctx.fill();
  var glow = ctx.createRadialGradient(0, -44, 4, 0, -44, 52);
  glow.addColorStop(0, 'rgba(190,244,255,.75)'); glow.addColorStop(1, 'rgba(120,210,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(-56, -100, 112, 104);
  dkgCyl(ctx, 0, 28, 10, 8, ['#4E5C7C', '#C8D4E8', '#8E9CB8', '#46526E'], ['#FFFFFF', '#DCE6F4'], 'rgba(40,52,80,.6)');
  dkgCyl(ctx, -8, 21, 7.5, 6, ['#8A6314', '#FFE9A0', '#E0B448', '#7A5410'], ['#FFF8DC', '#F2D27A'], 'rgba(92,63,6,.7)');
  dkgShard(ctx, -13, -50, -18, 6, -5);
  dkgShard(ctx, 14, -46, -18, 6, 6);
  dkgShard(ctx, 0, -84, -16, 10, 0);
  dkgSpark(ctx, 2, -86, 7, '#FFFFFF');
  dkgSpark(ctx, -18, -54, 4, 'rgba(255,255,255,.9)');
  ctx.restore();
}
function dkgPaintTub(ctx, x, y, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(40,20,8,.34)'; ctx.beginPath(); ctx.ellipse(3, 5, 44, 17, 0, 0, DKG_TAU); ctx.fill();
  dkgCyl(ctx, 2, 40, 24, 9, ['#5A3412', '#D8A868', '#B07A3A', '#4E2C0E'], ['#E8C890', '#C8965A'], 'rgba(70,40,12,.8)');
  ctx.save(); ctx.translate(0, -7); ctx.scale(1, 0.6);
  var N = DKG_RL_FX.length, R = 34;
  for(var k = 0; k < N; k++){
    var a0 = -Math.PI / 2 + k * DKG_TAU / N, a1 = a0 + DKG_TAU / N;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath();
    ctx.fillStyle = DKG_RL_FX[k].col; ctx.fill();
    ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,236,190,.95)'; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, R, 0, DKG_TAU); ctx.lineWidth = 3; ctx.strokeStyle = '#F2C88A'; ctx.stroke();
  var hub = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
  hub.addColorStop(0, '#FFFFFF'); hub.addColorStop(1, '#E8B462');
  dkgOv(ctx, 0, 0, 10, 10, hub);
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-6, -33); ctx.lineTo(6, -33); ctx.lineTo(0, -21); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, 0, -33, 0, -21, ['#FFF6D0', '#E8A21E']); ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = '#6A3A08'; ctx.stroke();
  ctx.lineCap = 'round';
  [[-16, 0], [0, 3], [16, 0]].forEach(function(w, n){
    ctx.beginPath();
    ctx.moveTo(w[0], -30);
    ctx.bezierCurveTo(w[0] - 9, -40 - w[1], w[0] + 9, -48 - w[1], w[0] - 2, -60 - w[1]);
    ctx.lineWidth = 6 - n % 2; ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
  });
  ctx.restore();
}
function dkgDrawCrystalTile(ctx, i){
  var c = dkgFace(ctx, i, ['#DDF6FF', '#8ED2F4', '#5B8EDC'], 'rgba(255,255,255,.7)');
  var q = shrinkQuad(tileQuad(i), 4);
  ctx.save(); polyPath(ctx, q); ctx.clip();
  for(var k = 0; k < 6; k++) dkgSpark(ctx, c.x + (dkgHash(i, k) - 0.5) * 80, c.y + (dkgHash(i, k + 9) - 0.5) * 50, 2.5 + dkgHash(i, k + 3) * 3, 'rgba(255,255,255,.85)');
  ctx.restore();
  dkgPaintCrystal(ctx, c.x, c.y + 14, 0.92);
}
function dkgDrawRouletteTile(ctx, i){
  var c = dkgFace(ctx, i, ['#FFF3DA', '#F6D39A', '#E0A460'], 'rgba(255,250,235,.8)');
  dkgPaintTub(ctx, c.x, c.y + 8, 0.92);
}
function dkgSnowBadge(ctx, x, y, r, col){
  ctx.save(); ctx.translate(x, y);
  dkgOv(ctx, 0, 0, r + 2.5, r + 2.5, col);
  var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#BFE6FA');
  dkgOv(ctx, 0, 0, r, r, g);
  ctx.strokeStyle = '#2E78B8'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for(var k = 0; k < 6; k++){
    var a = k * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a), L = r * 0.78;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ca * L, sa * L);
    ctx.moveTo(ca * L * 0.55 - sa * r * 0.2, sa * L * 0.55 + ca * r * 0.2); ctx.lineTo(ca * L * 0.72, sa * L * 0.72);
    ctx.lineTo(ca * L * 0.55 + sa * r * 0.2, sa * L * 0.55 - ca * r * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}
function dkgDrawIce(ctx, G2, i, t){
  var city = t.type === 'city';
  var q = city ? shrinkQuad(dkgInnerQuad(i, 0.28), 2) : shrinkQuad(tileQuad(i), 4);
  var tb = dkgTopBot(q), c = centroid(q);
  ctx.save();
  polyPath(ctx, q); ctx.clip();
  ctx.fillStyle = dkgLin(ctx, tb.top.x, tb.top.y, tb.bot.x, tb.bot.y, ['rgba(255,255,255,.99)', 'rgba(242,252,255,.97)', 'rgba(206,238,252,.96)']);
  ctx.fillRect(c.x - 140, c.y - 140, 280, 280);
  var gl = ctx.createLinearGradient(c.x - 40, c.y - 30, c.x + 40, c.y + 30);
  gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.45, 'rgba(255,255,255,.95)'); gl.addColorStop(0.55, 'rgba(190,236,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl; ctx.fillRect(c.x - 140, c.y - 140, 280, 280);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(c.x - 34, c.y + 12); ctx.lineTo(c.x - 10, c.y - 14); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(c.x - 16, c.y + 18); ctx.lineTo(c.x + 4, c.y - 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(96,160,210,.7)'; ctx.lineWidth = 1.1;
  for(var k = 0; k < 4; k++){
    var a = dkgHash(i, k) * DKG_TAU, L = 14 + dkgHash(i, k + 5) * 18;
    var mx = c.x + Math.cos(a) * L * 0.5 + (dkgHash(i, k + 7) - 0.5) * 6, my = c.y + Math.sin(a) * L * 0.35;
    ctx.beginPath(); ctx.moveTo(c.x + (dkgHash(i, k + 2) - 0.5) * 10, c.y + (dkgHash(i, k + 4) - 0.5) * 6);
    ctx.lineTo(mx, my); ctx.lineTo(c.x + Math.cos(a) * L, c.y + Math.sin(a) * L * 0.62); ctx.stroke();
  }
  var A = tileCenter(i), B = tileCenter((i + 1) % 32), dx = B.x - A.x, dy = B.y - A.y, dl = Math.hypot(dx, dy) || 1;
  dx /= dl; dy /= dl;
  ctx.strokeStyle = 'rgba(36,112,184,.85)'; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
  for(var n = 0; n < 2; n++){
    var ox = c.x + dx * (n * 12 - 2), oy = c.y + dy * (n * 12 - 2);
    ctx.beginPath();
    ctx.moveTo(ox - dx * 6 - dy * 7, oy - dy * 6 + dx * 7); ctx.lineTo(ox + dx * 3, oy + dy * 3); ctx.lineTo(ox - dx * 6 + dy * 7, oy - dy * 6 - dx * 7);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save(); polyPath(ctx, q);
  ctx.strokeStyle = 'rgba(120,212,255,.9)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.98)'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
  if(city){
    var r = RECTS[i], sg = outSign(r.side), mw = ((r.side === 0 || r.side === 2) ? r.w : r.h) * 0.9;
    ctx.save(); polyPath(ctx, tileQuad(i)); ctx.clip();
    planeText(ctx, r.p + r.w / 2, r.q + r.h / 2, SIDE_ROT[r.side], t.name, 16, '#FFFFFF', '#2E6E9E', 4.5, -sg * 13, mw);
    ctx.restore();
  }
  var bp = dkgInnerPt(i);
  dkgSnowBadge(ctx, bp.x, bp.y, 9, (typeof t.ice === 'number' && PCOL[t.ice]) ? PCOL[t.ice] : '#FFFFFF');
}
function dkgDrawSlide(ctx, i, t){
  var c = centroid(tileQuad(i)), txt = '×' + dkgMulTxt(t.slide);
  ctx.save();
  ctx.font = '400 19px "Mochiy Pop One", sans-serif';
  var w = ctx.measureText(txt).width + 22, h = 30, x = c.x - w / 2, y = c.y - 44;
  _dvRR(ctx, x, y, w, h, 15);
  ctx.fillStyle = dkgLin(ctx, 0, y, 0, y + h, ['#FFF6C8', '#F2C230', '#B87F12']); ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = '#5C3F06'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#4A3206'; ctx.strokeText(txt, c.x, y + h / 2 + 1);
  ctx.fillStyle = '#FFF8E0'; ctx.fillText(txt, c.x, y + h / 2 + 1);
  ctx.restore();
}
function dkgPaintAll(root){
  if(!root || !root.querySelectorAll) return;
  root.querySelectorAll('canvas[data-dkg-art]').forEach(function(cv){
    if(cv._dkgDone) return;
    var w = cv.clientWidth, h = cv.clientHeight;
    if(!(w > 0 && h > 0)) return;
    cv._dkgDone = 1;
    var k = 1;
    try{ k = Math.max(0.5, Math.min(DKFX.mob ? 1 : 1.5, DKFX.scale() * (window.devicePixelRatio || 1))); }catch(e){ k = 1; }
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    var ctx = cv.getContext('2d', DKFX && DKFX.mob ? { willReadFrequently:true } : undefined);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    try{ dkgArt(ctx, w, h, cv.getAttribute('data-dkg-art')); }catch(e){ console.error('[WP12b]', e); }
  });
}
function dkgPaintBlock(ctx, x, y, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(8,30,60,.3)'; ctx.beginPath(); ctx.ellipse(0, 8, 70, 20, 0, 0, DKG_TAU); ctx.fill();
  var T = [[0, -60], [62, -30], [0, 0], [-62, -30]];
  ctx.beginPath(); ctx.moveTo(-62, -30); ctx.lineTo(0, 0); ctx.lineTo(0, 44); ctx.lineTo(-62, 14); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, -62, -30, 0, 44, ['#7CC6EE', '#3E8ED0', '#245C9E']); ctx.fill();
  ctx.beginPath(); ctx.moveTo(62, -30); ctx.lineTo(0, 0); ctx.lineTo(0, 44); ctx.lineTo(62, 14); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, 62, -30, 0, 44, ['#DDF6FF', '#9AD8F6', '#5AA6DC']); ctx.fill();
  ctx.beginPath(); ctx.moveTo(T[0][0], T[0][1]); for(var n = 1; n < 4; n++) ctx.lineTo(T[n][0], T[n][1]); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, -40, -60, 40, 0, ['#FFFFFF', '#E6F8FF', '#B8E4FA']); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-38, 0); ctx.lineTo(-20, -20); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(24, 20); ctx.lineTo(40, 2); ctx.stroke();
  ctx.save(); ctx.translate(0, -30); ctx.scale(1, 0.5); dkgSnowBadge(ctx, 0, 0, 20, '#7CC6EE'); ctx.restore();
  ctx.restore();
}
function dkgArt(ctx, w, h, key){
  var s = Math.min(w / 330, h / 172);
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(s, s);
  var fl = ctx.createRadialGradient(0, 60, 10, 0, 60, 170);
  fl.addColorStop(0, 'rgba(255,255,255,.75)'); fl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fl; ctx.beginPath(); ctx.ellipse(0, 62, 170, 30, 0, 0, DKG_TAU); ctx.fill();
  for(var k = 0; k < 9; k++) dkgSpark(ctx, (dkgHash(k, 1) - 0.5) * 300, (dkgHash(k, 2) - 0.5) * 140, 2 + dkgHash(k, 3) * 4, 'rgba(255,255,255,.8)');
  if(key === 'build'){
    dkgPaintCrystal(ctx, -58, 64, 1.18);
    ctx.save(); ctx.translate(58, 64);
    ctx.fillStyle = 'rgba(8,24,52,.3)'; ctx.beginPath(); ctx.ellipse(2, 3, 40, 12, 0, 0, DKG_TAU); ctx.fill();
    var tier = function(y0, hw, hh, c1, c2){
      ctx.beginPath(); ctx.moveTo(-hw, y0); ctx.lineTo(hw, y0); ctx.lineTo(hw * 0.86, y0 - hh); ctx.lineTo(-hw * 0.86, y0 - hh); ctx.closePath();
      ctx.fillStyle = dkgLin(ctx, -hw, 0, hw, 0, [c1, c2, c1]); ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(40,36,80,.6)'; ctx.stroke();
    };
    tier(0, 34, 26, '#7A76B8', '#D6D2F4'); tier(-26, 28, 24, '#8682C4', '#E2DEF8'); tier(-50, 21, 22, '#928ED0', '#EEEAFF');
    ctx.restore();
    dkgShard(ctx, 58, -46, -6, 9, 0);
  } else {
    dkgPaintBlock(ctx, 0, 34, 1.05);
    ctx.save(); ctx.translate(92, -18);
    ctx.beginPath(); ctx.arc(0, -16, 20, 0, DKG_TAU);
    ctx.fillStyle = dkgLin(ctx, 0, -36, 0, 4, ['#FFD9A0', '#F2851E']); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#8E4212'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, 16); ctx.lineTo(8, 0); ctx.closePath(); ctx.fillStyle = '#F2851E'; ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-1, -26, 3.6, 0, DKG_TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, -22); ctx.lineTo(2, -13); ctx.lineTo(9, -10); ctx.moveTo(2, -13); ctx.lineTo(-6, -7); ctx.moveTo(-1, -19); ctx.lineTo(-9, -16); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
/* ── ボーナスゲームの舞台 ── */
function dkgStage(ctx, w, h, fn){
  var s = Math.max(w / 440, h / 240);
  ctx.save();
  ctx.translate((w - 440 * s) / 2, (h - 240 * s) / 2); ctx.scale(s, s);
  try{ fn(); } finally { ctx.restore(); }
}
function dkgSt(st){
  st = st || {};
  return { mode:(st.mode || 'idle'), side:(st.side === 'R' ? 'R' : 'L'), k:Math.max(0, Math.min(1, +st.k || 0)) };
}
function dkgRays(ctx, x, y, k, col){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(var r = 0; r < 12; r++){
    var an = r / 12 * DKG_TAU + k * 0.7;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * 260, y + Math.sin(an) * 260);
    ctx.lineTo(x + Math.cos(an + 0.15) * 260, y + Math.sin(an + 0.15) * 260); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function dkgVignette(ctx, k){
  var rv = ctx.createRadialGradient(220, 120, 80, 220, 120, 280);
  rv.addColorStop(0, 'rgba(200,0,30,0)'); rv.addColorStop(1, 'rgba(200,0,30,' + (0.45 * k).toFixed(3) + ')');
  ctx.fillStyle = rv; ctx.fillRect(0, 0, 440, 240);
}
/* ── 世界一周：コインの表裏 ── */
function dkgCoinFace(ctx, r, face){
  var g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#FFF8D2'); g.addColorStop(0.45, '#F2C230'); g.addColorStop(1, '#A8700E');
  dkgOv(ctx, 0, 0, r, r, g);
  ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#8A5A08'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, DKG_TAU); ctx.lineWidth = r * 0.05; ctx.strokeStyle = 'rgba(255,246,200,.85)'; ctx.stroke();
  ctx.fillStyle = 'rgba(120,76,8,.55)';
  for(var n = 0; n < 24; n++){ var a = n / 24 * DKG_TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.89, Math.sin(a) * r * 0.89, r * 0.035, 0, DKG_TAU); ctx.fill(); }
  ctx.save(); ctx.translate(0, -r * 0.08);
  var emb = function(dx, dy, col){
    ctx.save(); ctx.translate(dx, dy); ctx.fillStyle = col; ctx.beginPath();
    if(face === 'omote'){
      ctx.moveTo(-r * 0.44, r * 0.18); ctx.lineTo(-r * 0.5, -r * 0.3); ctx.lineTo(-r * 0.24, -r * 0.06); ctx.lineTo(0, -r * 0.4);
      ctx.lineTo(r * 0.24, -r * 0.06); ctx.lineTo(r * 0.5, -r * 0.3); ctx.lineTo(r * 0.44, r * 0.18); ctx.closePath();
    } else {
      for(var s = 0; s < 10; s++){ var aa = -Math.PI / 2 + s * Math.PI / 5, rr = s % 2 ? r * 0.2 : r * 0.46; ctx[s ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr, Math.sin(aa) * rr); }
      ctx.closePath();
    }
    ctx.fill(); ctx.restore();
  };
  emb(1.5, 1.5, 'rgba(110,68,6,.8)'); emb(0, 0, '#FFE58A');
  ctx.restore();
  ctx.font = '900 ' + (r * 0.36).toFixed(1) + 'px "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(110,68,6,.85)'; ctx.fillText(face === 'omote' ? '表' : '裏', 1, r * 0.55 + 1);
  ctx.fillStyle = '#FFF2B8'; ctx.fillText(face === 'omote' ? '表' : '裏', 0, r * 0.55);
}
function dkgCoin(ctx, x, y, r, sx, face){
  var ax = Math.max(0.05, Math.abs(sx)), ew = r * 0.17 * Math.sqrt(Math.max(0, 1 - ax * ax));
  ctx.save(); ctx.translate(x, y);
  if(ew > 0.5){
    ctx.beginPath(); ctx.ellipse((sx >= 0 ? -1 : 1) * ew, 0, r * ax, r, 0, 0, DKG_TAU);
    ctx.fillStyle = dkgLin(ctx, 0, -r, 0, r, ['#E8B040', '#7A4A06', '#E8B040']); ctx.fill();
  }
  ctx.save(); ctx.scale(ax, 1); dkgCoinFace(ctx, r, face); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, r * ax, r, 0, 0, DKG_TAU); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(-r * 0.3 * ax, -r * 0.45, r * 0.5 * ax, r * 0.22, -0.4, 0, DKG_TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
}
function dkgPlaque(ctx, x, y, txt, face, lit, dim){
  ctx.save(); ctx.translate(x, y);
  if(lit){ ctx.shadowColor = 'rgba(255,230,120,.95)'; ctx.shadowBlur = 16; }
  _dvRR(ctx, -54, -24, 108, 48, 14);
  ctx.fillStyle = dkgLin(ctx, 0, -24, 0, 24, face === 'omote' ? ['#FFF3C8', '#E8B84A', '#9A6A12'] : ['#F4F6FA', '#B8C2D2', '#6E7A8E']); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2.5; ctx.strokeStyle = face === 'omote' ? '#5C3F06' : '#3A4458'; ctx.stroke();
  ctx.save(); ctx.translate(-24, 0); dkgCoin(ctx, 0, 0, 15, 1, face); ctx.restore();
  ctx.font = '900 26px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,24,4,.8)'; ctx.strokeText(txt, 18, 1);
  ctx.fillStyle = '#FFFFFF'; ctx.fillText(txt, 18, 1);
  if(dim){ _dvRR(ctx, -54, -24, 108, 48, 14); ctx.fillStyle = 'rgba(20,10,30,.45)'; ctx.fill(); }
  ctx.restore();
}
function dkgBonusCoin(ctx, w, h, st, T){
  st = dkgSt(st); T = T || 0;
  dkgStage(ctx, w, h, function(){
    var k = st.k, mine = st.side === 'L' ? 'omote' : 'ura', other = mine === 'omote' ? 'ura' : 'omote';
    ctx.fillStyle = dkgLin(ctx, 0, 0, 0, 240, ['#22367A', '#16205A', '#0A0E2C']); ctx.fillRect(0, 0, 440, 240);
    ctx.save(); ctx.globalAlpha = 0.16; ctx.strokeStyle = '#A8C8FF'; ctx.lineWidth = 1.2;
    for(var m = 0; m < 4; m++){ ctx.beginPath(); ctx.ellipse(220, 100, 16 + m * 30, 88, 0, 0, DKG_TAU); ctx.stroke(); }
    for(var l = -2; l <= 2; l++){ var yy = 100 + l * 30, rx = Math.sqrt(Math.max(0, 1 - Math.pow(l * 30 / 88, 2))) * 106; ctx.beginPath(); ctx.ellipse(220, yy, rx, 5, 0, 0, DKG_TAU); ctx.stroke(); }
    ctx.restore();
    var sp = ctx.createRadialGradient(220, 30, 10, 220, 130, 200);
    sp.addColorStop(0, 'rgba(255,236,170,.42)'); sp.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = sp; ctx.fillRect(0, 0, 440, 240);
    ctx.beginPath(); ctx.ellipse(220, 232, 196, 40, 0, 0, DKG_TAU);
    ctx.fillStyle = dkgLin(ctx, 0, 192, 0, 272, ['#C8243A', '#8E1024', '#4A0612']); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#E8C060'; ctx.stroke();
    var done = st.mode === 'win' || st.mode === 'lose';
    dkgPlaque(ctx, 74, 206, '表', 'omote', st.mode !== 'idle' && st.side === 'L' && st.mode !== 'lose', done && st.side === 'L' && st.mode === 'lose');
    dkgPlaque(ctx, 366, 206, '裏', 'ura', st.mode !== 'idle' && st.side === 'R' && st.mode !== 'lose', done && st.side === 'R' && st.mode === 'lose');
    var x = 220, y, sx, face;
    if(st.mode === 'run'){ y = 156 - Math.sin(k * Math.PI) * 112; var a = k * Math.PI * 7; sx = Math.cos(a); face = sx >= 0 ? 'omote' : 'ura'; }
    else if(done){ y = 156 - Math.abs(Math.sin(k * DKG_TAU)) * (1 - k) * 18; sx = 1; face = st.mode === 'win' ? mine : other; }
    else { y = 118 + Math.sin(T * 0.004) * 5; var b = T * 0.0032; sx = Math.cos(b); face = sx >= 0 ? 'omote' : 'ura'; }
    var hgt = Math.max(0, 156 - y);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.4 - hgt / 400).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(x, 204, 40 - hgt / 8, 9 - hgt / 30, 0, 0, DKG_TAU); ctx.fill();
    if(st.mode === 'win') dkgRays(ctx, x, y, k, 'rgba(255,236,170,.14)');
    if(st.mode === 'run'){
      ctx.strokeStyle = 'rgba(255,230,150,.35)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, Math.min(200, y + 60)); ctx.stroke();
    }
    dkgCoin(ctx, x, y, 46, sx, face);
    if(st.mode === 'win'){ dkgSpark(ctx, x - 64, y - 30, 10, '#FFF6C8'); dkgSpark(ctx, x + 60, y - 12, 8, '#FFF6C8'); dkgSpark(ctx, x - 20, y - 64, 7, '#FFFFFF'); }
    if(st.mode === 'lose') dkgVignette(ctx, k);
  });
}
/* ── 氷の洞窟：氷の上を渡る ── */
function dkgKid(ctx, x, y, s, run, k){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,20,40,.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 18, 5, 0, 0, DKG_TAU); ctx.fill();
  var sw = run ? Math.sin(k * Math.PI * 10) * 6 : 0;
  ctx.strokeStyle = '#2A2A44'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(-6 - sw, 0); ctx.moveTo(5, -12); ctx.lineTo(6 + sw, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(-17, -40, -19, -18, -16, -9); ctx.lineTo(16, -9); ctx.bezierCurveTo(19, -18, 17, -40, 0, -46); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, -16, -46, 16, -9, ['#FF7A6A', '#D83A3A', '#8E1A24']); ctx.fill();
  ctx.lineWidth = 1.8; ctx.strokeStyle = '#5A0E14'; ctx.stroke();
  ctx.strokeStyle = '#8E1A24'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-14, -34); ctx.lineTo(-20 + sw * 0.6, -20); ctx.moveTo(14, -34); ctx.lineTo(20 - sw * 0.6, -20); ctx.stroke();
  ctx.fillStyle = '#F2C230'; _dvRR(ctx, -12, -38, 24, 6, 3); ctx.fill();
  dkgOv(ctx, 0, -50, 13, 13, '#C8303A');
  ctx.beginPath(); ctx.arc(0, -50, 13, 0, DKG_TAU); ctx.lineWidth = 4; ctx.strokeStyle = '#F4F4F4'; ctx.stroke();
  dkgOv(ctx, 0, -49, 9, 9, dkgLin(ctx, 0, -58, 0, -40, ['#FFEEDC', '#F2C8A8']));
  ctx.fillStyle = '#2A1020'; ctx.beginPath(); ctx.arc(-3.4, -50, 1.7, 0, DKG_TAU); ctx.arc(3.4, -50, 1.7, 0, DKG_TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,120,.55)'; ctx.beginPath(); ctx.arc(-6, -46, 2.2, 0, DKG_TAU); ctx.arc(6, -46, 2.2, 0, DKG_TAU); ctx.fill();
  ctx.restore();
}
function dkgFloe(ctx, x, y, sc, lit, crack){
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  dkgOv(ctx, 0, 4, 30, 10, 'rgba(0,20,40,.4)');
  ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-30, 5); ctx.ellipse(0, 5, 30, 10, 0, Math.PI, 0, true); ctx.lineTo(30, 0); ctx.closePath();
  ctx.fillStyle = '#5AA6D8'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 30, 10, 0, 0, DKG_TAU);
  ctx.fillStyle = dkgLin(ctx, -30, -10, 30, 10, lit ? ['#FFFFFF', '#E0FFF4', '#9AF0D8'] : ['#FFFFFF', '#DDF4FF', '#9CCFEE']); ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = lit ? '#4FE0C0' : 'rgba(255,255,255,.9)'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(-4, -6); ctx.stroke();
  if(crack){
    ctx.strokeStyle = 'rgba(20,60,100,.9)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-22, 2); ctx.lineTo(-8, -3); ctx.lineTo(2, 3); ctx.lineTo(12, -4); ctx.lineTo(24, 1);
    ctx.moveTo(2, 3); ctx.lineTo(4, 9); ctx.stroke();
  }
  ctx.restore();
}
function dkgBonusIce(ctx, w, h, st, T){
  st = dkgSt(st); T = T || 0;
  dkgStage(ctx, w, h, function(){
    var k = st.k, n;
    ctx.fillStyle = dkgLin(ctx, 0, 0, 0, 240, ['#16466E', '#0B2A48', '#061A30']); ctx.fillRect(0, 0, 440, 240);
    var ex = ctx.createRadialGradient(220, 56, 6, 220, 56, 110);
    ex.addColorStop(0, 'rgba(220,250,255,.95)'); ex.addColorStop(0.4, 'rgba(150,220,255,.45)'); ex.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = ex; ctx.fillRect(90, 0, 260, 150);
    ctx.fillStyle = '#082036';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(118, 0); ctx.lineTo(92, 36); ctx.lineTo(66, 78); ctx.lineTo(38, 120); ctx.lineTo(0, 140); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(440, 0); ctx.lineTo(322, 0); ctx.lineTo(348, 36); ctx.lineTo(374, 78); ctx.lineTo(402, 120); ctx.lineTo(440, 140); ctx.closePath(); ctx.fill();
    for(n = 0; n < 14; n++){
      var ix = 8 + n * 31 + dkgHash(n, 1) * 8, il = 14 + dkgHash(n, 2) * 24;
      ctx.beginPath(); ctx.moveTo(ix - 7, 0); ctx.lineTo(ix + 7, 0); ctx.lineTo(ix + 1, il); ctx.closePath();
      ctx.fillStyle = dkgLin(ctx, 0, 0, 0, il, ['#E8FAFF', 'rgba(150,210,255,.35)']); ctx.fill();
    }
    [[40, 110, 18], [398, 104, 16], [70, 60, 10], [370, 58, 11]].forEach(function(c){ dkgShard(ctx, c[0], c[1] - c[2] * 3, c[1], c[2] * 0.4, 0); });
    ctx.beginPath(); ctx.moveTo(66, 70); ctx.quadraticCurveTo(220, 60, 374, 70); ctx.lineTo(392, 90); ctx.lineTo(48, 90); ctx.closePath();
    ctx.fillStyle = dkgLin(ctx, 0, 62, 0, 90, ['#F4FCFF', '#A8D8F0']); ctx.fill();
    ctx.fillStyle = dkgLin(ctx, 0, 88, 0, 198, ['#0E5478', '#08324E', '#05223A']); ctx.fillRect(0, 88, 440, 112);
    ctx.lineWidth = 1.4;
    for(n = 0; n < 6; n++){
      var ry = 100 + n * 16;
      ctx.strokeStyle = 'rgba(160,220,255,' + (0.12 + n * 0.02).toFixed(2) + ')';
      ctx.beginPath();
      for(var px = 0; px <= 440; px += 20){ var wy = ry + Math.sin(px * 0.05 + T * 0.002 + n) * 2; if(px) ctx.lineTo(px, wy); else ctx.moveTo(px, wy); }
      ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, 200); ctx.quadraticCurveTo(220, 186, 440, 200); ctx.lineTo(440, 240); ctx.lineTo(0, 240); ctx.closePath();
    ctx.fillStyle = dkgLin(ctx, 0, 188, 0, 240, ['#F6FCFF', '#BCDDF0']); ctx.fill();
    var paths = { L:[[164, 172], [148, 142], [134, 112]], R:[[276, 172], [292, 142], [306, 112]] };
    var lose = st.mode === 'lose', win = st.mode === 'win';
    ['L', 'R'].forEach(function(sd){
      paths[sd].forEach(function(pt, j){
        var mineP = sd === st.side, crack = lose && mineP && j === 1;
        var bob = Math.sin(T * 0.003 + j + (sd === 'L' ? 0 : 2)) * 1.4 + (crack ? k * 8 : 0);
        dkgFloe(ctx, pt[0], pt[1] + bob, 1 - j * 0.16, win && mineP, crack);
      });
    });
    ctx.font = '900 20px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['L', 106, '◀'], ['R', 334, '▶']].forEach(function(a){
      ctx.fillStyle = a[0] === 'L' ? '#8FF0D8' : '#D2B8FF';
      ctx.fillText(a[2], a[1], 214);
    });
    var P = paths[st.side];
    if(st.mode === 'run'){
      var e = 1 - Math.pow(1 - k, 2), tx = 220 + (P[1][0] - 220) * e, ty = 214 + (P[1][1] - 214) * e - Math.sin(e * Math.PI) * 16;
      dkgKid(ctx, tx, ty, 1 - e * 0.2, true, k);
    } else if(win){
      dkgRays(ctx, P[2][0], 80, k, 'rgba(200,255,240,.12)');
      dkgKid(ctx, P[2][0] + (st.side === 'L' ? -6 : 6), 82, 0.72, false, 0);
      dkgSpark(ctx, P[2][0] - 30, 60, 9, '#FFFFFF'); dkgSpark(ctx, P[2][0] + 28, 70, 7, '#E0FFF6');
    } else if(lose){
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, 440, P[1][1] + 4); ctx.clip();
      dkgKid(ctx, P[1][0], P[1][1] + 2 + k * 40, 0.82, false, 0);
      ctx.restore();
      ctx.fillStyle = 'rgba(210,240,255,.85)';
      for(n = 0; n < 9; n++){
        var an = -Math.PI / 2 + (n - 4) * 0.34, rr = 10 + k * 34;
        ctx.beginPath(); ctx.arc(P[1][0] + Math.cos(an) * rr, P[1][1] + Math.sin(an) * rr * 0.8, 3.2 * (1 - k * 0.5), 0, DKG_TAU); ctx.fill();
      }
      dkgVignette(ctx, k);
    } else {
      dkgKid(ctx, 220, 216, 1, false, 0);
    }
  });
}
/* ── 大分めぐり：湯おけの宝さがし ── */
function dkgBucket(ctx, x, y, lift, tilt){
  ctx.save(); ctx.translate(x, y - lift); ctx.rotate(tilt);
  ctx.beginPath(); ctx.moveTo(-42, 0); ctx.lineTo(-32, -54); ctx.lineTo(32, -54); ctx.lineTo(42, 0); ctx.closePath();
  ctx.fillStyle = dkgLin(ctx, -42, 0, 42, 0, ['#8A5A2A', '#E8C28A', '#D8A868', '#7A4A1E']); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#5A3412'; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,52,18,.45)'; ctx.lineWidth = 1.2;
  for(var n = -3; n <= 3; n++){ ctx.beginPath(); ctx.moveTo(n * 11, 0); ctx.lineTo(n * 8.4, -54); ctx.stroke(); }
  [[-14, 0.66], [-40, 0.9]].forEach(function(b){
    var hw = 32 + (42 - 32) * (1 - (-b[0]) / 54);
    _dvRR(ctx, -hw - 1, b[0] - 5, hw * 2 + 2, 7, 3);
    ctx.fillStyle = dkgLin(ctx, 0, b[0] - 5, 0, b[0] + 2, ['#F2B880', '#B8642C', '#7A3A12']); ctx.fill();
  });
  ctx.beginPath(); ctx.ellipse(0, -54, 32, 8, 0, 0, DKG_TAU);
  ctx.fillStyle = dkgLin(ctx, 0, -62, 0, -46, ['#F6DCA8', '#D8A868']); ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#6A3E14'; ctx.stroke();
  dkgOv(ctx, 0, -28, 11, 11, 'rgba(200,52,40,.85)');
  ctx.font = '900 15px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFF6E0'; ctx.fillText('ゆ', 0, -27);
  ctx.restore();
}
function dkgSteam(ctx, x, y, T, a){
  ctx.save(); ctx.lineCap = 'round';
  for(var n = 0; n < 3; n++){
    var ph = T * 0.0016 + n * 2.1, off = Math.sin(ph) * 8;
    ctx.beginPath(); ctx.moveTo(x + (n - 1) * 14, y);
    ctx.bezierCurveTo(x + (n - 1) * 14 - 12 + off, y - 20, x + (n - 1) * 14 + 12 - off, y - 38, x + (n - 1) * 14 + off, y - 58);
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(255,255,255,' + (0.14 * a).toFixed(3) + ')'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,' + (0.32 * a).toFixed(3) + ')'; ctx.stroke();
  }
  ctx.restore();
}
function dkgBonusOnsen(ctx, w, h, st, T){
  st = dkgSt(st); T = T || 0;
  dkgStage(ctx, w, h, function(){
    var k = st.k, n;
    ctx.fillStyle = dkgLin(ctx, 0, 0, 0, 160, ['#171540', '#2C2258', '#4A3466']); ctx.fillRect(0, 0, 440, 170);
    for(n = 0; n < 22; n++){
      var tw = 0.45 + 0.55 * Math.abs(Math.sin(T * 0.0012 + n * 1.3));
      dkgSpark(ctx, dkgHash(n, 4) * 440, dkgHash(n, 5) * 90, 1.4 + dkgHash(n, 6) * 2.4, 'rgba(255,250,230,' + tw.toFixed(2) + ')');
    }
    var mg = ctx.createRadialGradient(364, 42, 4, 364, 42, 56);
    mg.addColorStop(0, 'rgba(255,246,216,.7)'); mg.addColorStop(1, 'rgba(255,246,216,0)');
    ctx.fillStyle = mg; ctx.fillRect(300, 0, 130, 110);
    dkgOv(ctx, 364, 42, 16, 16, '#FFF6D8');
    ctx.beginPath(); ctx.moveTo(0, 122); ctx.lineTo(64, 76); ctx.lineTo(118, 102); ctx.lineTo(190, 52); ctx.lineTo(258, 94); ctx.lineTo(330, 70); ctx.lineTo(440, 110); ctx.lineTo(440, 170); ctx.lineTo(0, 170); ctx.closePath();
    ctx.fillStyle = '#241C44'; ctx.fill();
    for(n = 0; n < 23; n++){
      var fx = n * 20;
      ctx.fillStyle = dkgLin(ctx, fx, 0, fx + 18, 0, ['#4E5A2E', '#8E9A5A', '#56622E']);
      ctx.fillRect(fx + 1, 104, 18, 64);
      ctx.fillStyle = 'rgba(30,36,14,.5)'; ctx.fillRect(fx + 1, 124, 18, 2); ctx.fillRect(fx + 1, 148, 18, 2);
    }
    ctx.fillStyle = dkgLin(ctx, 0, 100, 0, 110, ['#7A5A2E', '#4A3414']); ctx.fillRect(0, 100, 440, 8);
    [[34, 92], [406, 92]].forEach(function(L){
      var lg = ctx.createRadialGradient(L[0], L[1], 2, L[0], L[1], 46);
      lg.addColorStop(0, 'rgba(255,190,110,.75)'); lg.addColorStop(1, 'rgba(255,160,80,0)');
      ctx.fillStyle = lg; ctx.fillRect(L[0] - 50, L[1] - 50, 100, 100);
      ctx.fillStyle = '#3A2410'; ctx.fillRect(L[0] - 1.5, L[1] - 30, 3, 12);
      ctx.beginPath(); ctx.ellipse(L[0], L[1], 13, 17, 0, 0, DKG_TAU);
      ctx.fillStyle = dkgLin(ctx, L[0] - 13, 0, L[0] + 13, 0, ['#B82A1E', '#FF6A40', '#B82A1E']); ctx.fill();
      ctx.strokeStyle = 'rgba(80,16,8,.6)'; ctx.lineWidth = 1;
      for(var r = -2; r <= 2; r++){ ctx.beginPath(); ctx.ellipse(L[0], L[1] + r * 5.5, 13 - Math.abs(r) * 1.4, 1.2, 0, 0, DKG_TAU); ctx.stroke(); }
    });
    ctx.fillStyle = dkgLin(ctx, 0, 164, 0, 240, ['#9AA0B8', '#6E7490', '#4A4E66']); ctx.fillRect(0, 164, 440, 76);
    ctx.strokeStyle = 'rgba(40,44,64,.4)'; ctx.lineWidth = 1.2;
    [178, 198, 222].forEach(function(yy){ ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(440, yy); ctx.stroke(); });
    for(n = -6; n <= 6; n++){ ctx.beginPath(); ctx.moveTo(220 + n * 22, 164); ctx.lineTo(220 + n * 56, 240); ctx.stroke(); }
    dkgSteam(ctx, 110, 172, T, 1); dkgSteam(ctx, 330, 176, T + 900, 1); dkgSteam(ctx, 220, 168, T + 1800, 0.8);
    var cxL = 142, cxR = 298, base = 214, sel = st.side === 'L' ? cxL : cxR, oth = st.side === 'L' ? cxR : cxL;
    var lift = 0, tilt = 0, dir = st.side === 'L' ? -1 : 1;
    if(st.mode === 'run'){ var e = Math.sin(k * Math.PI * 0.5); lift = e * 26; tilt = dir * e * 0.12; }
    else if(st.mode === 'win' || st.mode === 'lose'){ lift = 26 + k * 30; tilt = dir * (0.12 + k * 0.28); }
    ctx.fillStyle = 'rgba(20,16,40,.4)';
    ctx.beginPath(); ctx.ellipse(oth, base + 2, 46, 10, 0, 0, DKG_TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sel, base + 2, 46 - lift / 4, 10 - lift / 14, 0, 0, DKG_TAU); ctx.fill();
    if(st.mode === 'win'){
      dkgRays(ctx, sel, base - 10, k, 'rgba(255,228,150,.13)');
      for(n = 0; n < 7; n++){
        var cx = sel - 24 + (n % 4) * 16 + (n > 3 ? 8 : 0), cy = base - 4 - (n > 3 ? 8 : 0);
        ctx.beginPath(); ctx.ellipse(cx, cy, 10, 4.5, 0, 0, DKG_TAU);
        ctx.fillStyle = dkgLin(ctx, 0, cy - 5, 0, cy + 5, ['#FFF6C8', '#F2C230', '#A8700E']); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = '#7A4A06'; ctx.stroke();
      }
      for(n = 0; n < 5; n++){
        var ca = -Math.PI / 2 + (n - 2) * 0.42, cr = 20 + k * 60;
        dkgCoin(ctx, sel + Math.cos(ca) * cr, base - 20 + Math.sin(ca) * cr, 7, Math.cos(k * 9 + n), 'omote');
      }
      dkgSpark(ctx, sel - 34, base - 58, 9, '#FFF6C8'); dkgSpark(ctx, sel + 30, base - 44, 7, '#FFFFFF');
    } else if(st.mode === 'lose'){
      ctx.fillStyle = 'rgba(190,230,255,.8)';
      for(n = 0; n < 8; n++){
        var da = -Math.PI / 2 + (n - 3.5) * 0.36, dr = 8 + k * 38;
        ctx.beginPath(); ctx.arc(sel + Math.cos(da) * dr, base - 6 + Math.sin(da) * dr * 0.8, 3 * (1 - k * 0.5), 0, DKG_TAU); ctx.fill();
      }
      dkgSteam(ctx, sel, base - 6, T, 1.6);
    }
    dkgBucket(ctx, oth, base, 0, 0);
    dkgBucket(ctx, sel, base, lift, tilt);
    ctx.font = '900 20px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8FF0D8'; ctx.fillText('◀', cxL - 70, 214);
    ctx.fillStyle = '#D2B8FF'; ctx.fillText('▶', cxR + 70, 214);
    if(st.mode === 'lose') dkgVignette(ctx, k);
  });
}
/* ── ルーレットの「逆に進む」 ── */
async function dkgBack(pi, n){
  var p = G.players[pi], g0 = G;
  try{ destPin = ((p.pos - n) % 32 + 32) % 32; }catch(e){}
  camTo(tileCenter(p.pos).x, tileCenter(p.pos).y, 1.45);
  dkgTag(pi, '逆に進む', '#C8B8FF');
  try{
    for(var k = 0; k < n; k++){
      if(G !== g0 || G.over || p.out) break;
      var from = tileCenter(p.pos), np = (p.pos + 31) % 32;
      p.pos = np;
      var to = tileCenter(np);
      camTo(to.x, to.y, 1.45);
      await hop(p, from, to, 158);
    }
  } finally { try{ destPin = null; }catch(e){} }
  await wait(180);
}
function dkgSweep(){
  if(!G || !G.tiles || !G.players) return;
  var ch = false;
  for(var i = 0; i < 32; i++){
    var t = G.tiles[i];
    if(t && typeof t.ice === 'number' && (!G.players[t.ice] || G.players[t.ice].out)){ delete t.ice; ch = true; }
  }
  if(ch) boardChanged();
}

/* ── 起動：描画・移動・手番のラッパ ── */
(function(){
  try{
    DKG_o.drawTile = drawTile;
    drawTile = function(ctx, G2, i, T){
      var r = DKG_o.drawTile.apply(this, arguments);
      var t = G2 && G2.tiles && G2.tiles[i];
      if(!t) return r;
      try{
        if(t.type === 'crystal') dkgDrawCrystalTile(ctx, i);
        else if(t.type === 'roulette') dkgDrawRouletteTile(ctx, i);
        if(dkgIced(t)) dkgDrawIce(ctx, G2, i, t);
        if(t.slide > 0) dkgDrawSlide(ctx, i, t);
      }catch(e){ console.error('[WP12b]', e); }
      return r;
    };
    DKG_o.moveSteps = moveSteps;
    moveSteps = function(pi, n){
      var p = (G && G.players) ? G.players[pi] : null, a = Array.prototype.slice.call(arguments);
      if(p && p.dkgRev && n > 0){ p.dkgRev = false; return dkgBack(pi, n); }
      if(p && p.dkgX2 && n > 0){ p.dkgX2 = false; a[1] = n * 2; dkgTag(pi, '出目2倍 ' + n + '→' + (n * 2), '#FFD24D'); }
      return DKG_o.moveSteps.apply(this, a);
    };
    DKG_o.turnBig = turnBig;
    turnBig = async function(pi){
      try{ dkgSlideClear(); dkgSweep(); }catch(e){ console.error('[WP12b]', e); }
      if(G && G.map && G.map.id === 'ice' && !G.dkgIntro){
        G.dkgIntro = 1;
        if(G.tiles.some(dkgIced)) await band(DKG_ICE_TXT, '', 1500);
      }
      return DKG_o.turnBig.apply(this, arguments);
    };
  }catch(e){ console.error('[WP12b]', e); }
})();
