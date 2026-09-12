
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 盤の見た目・HUD・対戦中の通知・移動と演出のテンポ・エモート
   （9h-board.js / v9 WP7 → v10 WP14）
   ──────────────────────────────────────────────────────────────
   ・宣言し直す：所有表 v10 の 9h の分（give toast band moveSteps cutIn news alarmBand dkNotify ほか・yen yenShort）。
   ・代入ラッパ：newGame・drawLake・drawDice（前の関数を必ず呼ぶ）・celOverlay。moveSteps は宣言に置き換えた。
   ・トップレベルは function 宣言と DKB_ 付きの var と初期化 IIFE だけ。演出に Math.random は使わない。
   ・アニメの再始動は getAnimations（dkbReplay）。寸法を読む演出は次のコマへ。DOM は使い回し、変わった所だけ書く。
   ══════════════════════════════════════════════════════════════ */

var DKB_SEATS = ['Bot', 'BL', 'Top', 'TR'];
/* 自分（右下）以外の席の並び。2人＝左上（対角）、3人＝左上・右上、4人＝左下・左上・右上（J35） */
var DKB_ORDER = { 1: [], 2: ['Top'], 3: ['Top', 'TR'], 4: ['BL', 'Top', 'TR'] };
/* 札束の山の置き場（盤の外・その席の HUD のそば。ワールド座標） */
var DKB_STACK_XY = { Top: { x: 330, y: 252 }, TR: { x: 1286, y: 252 }, BL: { x: 330, y: 662 }, Bot: { x: 1286, y: 662 } };
/* 札束の山の作り置き（小さな offscreen）。論理の大きさと原点・倍率 */
var DKB_STK = { w: 260, h: 180, ox: 98, oy: 112, s: 1.5 };
/* エモート（絵文字8＋文字4。挑発の絵は入れない＝日本版と同じ判断） */
var DKB_EMO = ['😆', '😍', '😭', '😱', '🤑', '👏', '👍', '🙏', 'ナイス！', 'やられた〜', 'おさきに！', 'ありがとう'];
/* フォーチュンカード（p.fcard）の表示名 */
var DKB_FCARD = {
  angel: { ic: '🪽', nm: '天使カード', ds: '通行料を1回だけ無料にします（使うか選べます）' },
  coupon: { ic: '🎟', nm: '割引クーポン', ds: '通行料を1回だけ半額にします（使うか選べます）' },
  shield: { ic: '🛡', nm: 'シールドカード', ds: '相手の攻撃カードを1回だけ防ぎます' },
  escape: { ic: '🎫', nm: '脱出カード', ds: '閉じ込められた時、すぐに出られます' }
};
/* 建物の段の名前（日本版。4＝ランドマーク） */
var DKB_LVNM = ['土地権利書', 'マンション', 'ビル', 'ホテル', 'ランドマーク'];
/* ペンダントの発動の種類（C36）。古い p1〜p8 の既定。WP12a が足す物は it.eff で来る */
var DKB_PEND_EFF = { p1: 'pull', p2: 'bind', p3: 'grow', p4: 'toStart', p5: 'jumpBest', p6: 'jumpMine', p7: 'steal', p8: 'double' };
/* マス（都市以外）の短い説明（用語表の日本版の語） */
var DKB_TYPE_DS = {
  start: '通過しても止まっても給料がもらえます',
  jail: 'サイコロダブルが出ると脱出できます',
  olympic: '選んだ都市の通行料が上がります',
  travel: '希望する都市へ移動できます',
  card: 'フォーチュンカードを1枚引きます',
  tax: '持っている資産におうじて税金を払います',
  bonus: 'ボーナスゲームに挑戦できます',
  minigame: 'ボーナスゲームに挑戦できます'
};
/* 移動のテンポ（本家の等速録画・kr G04。×SPEED は hop が掛ける） */
/* cap＝ホップの合計の上限、all＝ホップ＋着地の間の上限。hop は rAF で1コマ（約10ms）ずつ遅れて終わるので、1.5秒に余白を残す */
var DKB_MOVE = { short: 170, mid: 150, long: 130, pass: 320, cap: 1300, all: 1300 };
var DKB_S = {
  built: false, hud: {}, band: {}, pbox: {}, seatOf: {}, piOf: {}, lastBR: -1, stackSig: '',
  potShown: null, toll: null, lake: { lv: 0, t: 0 }, errs: {}, mq: 0, chipTok: 0, plateR: null,
  imp: null, bub: null, reach: null, deferT: -1, gid: 0,
  pnls: [], pfree: [], bandTok: 0, busy: null, busyPi: -1, emo: {}, emoSel: [], emoAt: 0, emoEcho: null,
  tinfo: null, tdown: null, sal: null, mono: null, fc: null, stk: {}, alarmTok: 0, cutTok: 0,
  tiAt: null, tiTok: null, tiSize: null, tiCam: ''
};

/* ══════════ 金額の整形（日本版：「988万7500」「29万0536」「1000万」、1億から「20億1000万」） ══════════ */
function yen(n){
  n = Math.round(+n || 0);
  var neg = n < 0; n = Math.abs(n);
  var oku = Math.floor(n / 100000000), man = Math.floor((n % 100000000) / 10000), r = n % 10000, s;
  if(oku === 0) s = (man === 0) ? String(n) : (r === 0 ? man + '万' : man + '万' + String(r).padStart(4, '0'));
  else s = oku + '億' + (man ? man + '万' : '') + (r ? String(r).padStart(4, '0') : '');
  return (neg ? '-' : '') + s;
}
/* マスに出す短い金額（3〜5文字。「456万」「1.2億」「12億」） */
function yenShort(n){
  n = Math.round(+n || 0);
  var neg = n < 0 ? '-' : ''; n = Math.abs(n);
  var m = Math.round(n / 10000);
  if(n >= 100000000 || m >= 10000){
    var o = n / 100000000;
    return neg + (o >= 10 ? String(Math.round(o)) : o.toFixed(1).replace(/\.0$/, '')) + '億';
  }
  if(n >= 10000) return neg + m + '万';
  return neg + String(n);
}

/* ══════════ 小道具 ══════════ */
function dkbFast(){ return typeof SPEED === 'number' && SPEED < 0.05; }
/* CSS アニメを最初から再生し直す（強制レイアウトを起こさない。スタイルの再計算だけ） */
function dkbReplay(el, sub){
  if(!el || !el.getAnimations) return;
  try{
    var list = el.getAnimations(sub ? { subtree: true } : undefined);
    for(var i = 0; i < list.length; i++){
      var a = list[i];
      a.currentTime = 0;
      if(a.playState !== 'running') a.play();
    }
  }catch(e){}
}
/* 右下の席の人（自分。ともだちモードは手番の人間） */
function dkbMe(){
  if(DKB_S.piOf && DKB_S.piOf.Bot !== undefined) return DKB_S.piOf.Bot;
  if(G && G.players){ for(var i = 0; i < G.players.length; i++) if(G.players[i].kind !== 'cpu') return i; }
  return 0;
}
/* 対戦中で盤が見えているか（toast の振り分けに使う。メタ画面・結果の間は元のトースト） */
function dkbInMatch(){
  if(!G || !G.players || G.over) return false;
  if(typeof DKFX === 'object' && DKFX && DKFX.worldOff) return false;
  return !document.querySelector('.screen.on');
}
function dkbIsAuto(pi){ try{ return typeof dkIsAuto === 'function' ? !!dkIsAuto(pi) : !!(G.players[pi] && G.players[pi].auto); }catch(e){ return false; } }
function dkbAlly(a, b){ try{ return a !== b && typeof dkAlly === 'function' && !!dkAlly(a, b); }catch(e){ return false; } }
function dkbScale(){ try{ var k = (typeof dkScale === 'function') ? +dkScale() : 1; return (k > 0 && isFinite(k)) ? k : 1; }catch(e){ return 1; } }
/* 能力の発動（C04）。無い時・壊れた時は発動なし */
function dkbSkill(pi, when, info){
  try{
    if(typeof dkSkillRoll !== 'function') return null;
    var r = dkSkillRoll(pi, when, info);
    return (r && typeof r === 'object') ? r : null;
  }catch(e){ dkbErr('skill', e); return null; }
}
/* 能力の通知（「<キャラ名>のスペシャル能力」／外れは人間だけ「スキル未発動 2%成長します」） */
function dkbSkillNote(pi, r){
  if(!r || !G || !G.players[pi]) return;
  var p = G.players[pi], c = cardById(p.card) || {}, nm = c.nm || p.name;
  if(r.fired) dkNotify(pi, '✨', nm + 'のスペシャル能力', r.label || (nm + '専用能力発動！'), { rar: (RAR[c.rar] ? RAR[c.rar].nm : ''), ms: 2000 });
  else if(r.p > 0 && p.kind !== 'cpu') dkNotify(pi, '✨', 'スキル未発動', '2%成長します', { miss: true, ms: 1600 });
}
function dkbEl(tag, cls, html){
  var d = document.createElement(tag);
  if(cls) d.className = cls;
  if(html !== undefined && html !== null) d.innerHTML = html;
  return d;
}
function dkbTxt(el, t){ if(el && el.textContent !== t) el.textContent = t; }
function dkbErr(where, e){
  var k = where + ':' + (e && e.message);
  if(DKB_S.errs[k]) return;
  DKB_S.errs[k] = 1;
  console.error('[WP7] ' + where, e);
}
function dkbRnd(){ return (typeof DKFX === 'object' && DKFX && DKFX.rnd) ? DKFX.rnd() : 0.5; }
function dkbFmtClock(sec){
  sec = Math.max(0, sec || 0);
  var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}
/* ワールド座標 → ステージ座標（いまのカメラ） */
function dkbW2S(x, y){
  return { x: SW / 2 + (x - cam.x) * cam.z, y: SH / 2 + (y - cam.y) * cam.z };
}
/* proj の逆（ステージ座標 → 盤の p,q） */
function dkbUnproj(x, y){
  var a = (x - BCX) / KX, b = (y - BCY) / KY;
  return { p: (a + b) / 2 + S / 2, q: (b - a) / 2 + S / 2 };
}
/* 駒のワールド座標（足元） */
function dkbTokW(pi){
  var p = G && G.players[pi]; if(!p) return null;
  var r = p.render || tileCenter(p.pos);
  return { x: r.x + (p.offx || 0), y: r.y + (p.offy || 0) - (p.hopY || 0) };
}
/* 要素をワールドの点に毎フレーム合わせる（.on が外れたら止まる） */
function dkbFollow(el, getW, dy){
  var tok = {}; el._dkbTok = tok;
  var put = function(){
    var w = null;
    try{ w = getW(); }catch(e){ w = null; }
    if(!w) return;
    var s = dkbW2S(w.x, w.y + (dy || 0));
    el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
  };
  put();
  var dkbFollowStep = function(){
    if(el._dkbTok !== tok || !el.isConnected || !el.classList.contains('on')) return;
    put();
    requestAnimationFrame(dkbFollowStep);
  };
  requestAnimationFrame(dkbFollowStep);
}

/* ══════════ 席の割り当て（自分＝右下） ══════════ */
function dkbSeatMap(){
  var n = G.players.length, me = -1, i;
  var OL = window.DV_OL;
  if(OL && OL.started && Array.isArray(OL.seats)){
    for(i = 0; i < n; i++){
      var s = OL.seats[i];
      if(s && s.kind === 'human' && s.pid === OL.me && G.players[i] && G.players[i].kind !== 'cpu'){ me = i; break; }
    }
  }
  if(me < 0){
    var hum = [];
    for(i = 0; i < n; i++) if(G.players[i].kind !== 'cpu') hum.push(i);
    if(hum.length === 1) me = hum[0];
    else if(hum.length > 1){
      /* ともだちモード：右下＝手番の人間（CPU の番は直前の人のまま） */
      if(hum.indexOf(G.turn) >= 0 && !G.players[G.turn].out) me = G.turn;
      else if(hum.indexOf(DKB_S.lastBR) >= 0) me = DKB_S.lastBR;
      else me = hum[0];
    } else me = 0;
  }
  DKB_S.lastBR = me;
  var order = DKB_ORDER[n] || DKB_ORDER[4], rest = [];
  for(i = 0; i < n; i++) if(i !== me) rest.push(i);
  var seatOf = {}, piOf = {};
  seatOf[me] = 'Bot'; piOf.Bot = me;
  rest.forEach(function(pi, k){ var s2 = order[k] || DKB_SEATS[k + 1]; seatOf[pi] = s2; piOf[s2] = pi; });
  DKB_S.seatOf = seatOf; DKB_S.piOf = piOf;
  return DKB_S;
}
function dkbSeatOfPi(pi){
  if(!DKB_S.seatOf || DKB_S.seatOf[pi] === undefined){ if(G) dkbSeatMap(); }
  return DKB_S.seatOf[pi] || 'Bot';
}
function dkbStackXY(pi){ return DKB_STACK_XY[dkbSeatOfPi(pi)] || DKB_STACK_XY.Bot; }
/* 破産の札（4-game.js の bankrupt）も同じ山へ飛ぶように、STACK_POS の中身を席に合わせる */
function dkbSyncStackPos(){
  if(!G) return;
  for(var i = 0; i < G.players.length && i < STACK_POS.length; i++){
    var xy = dkbStackXY(i), u = dkbUnproj(xy.x, xy.y);
    STACK_POS[i].p = u.p; STACK_POS[i].q = u.q;
  }
}
function dkbBundles(cash){
  if(!(cash > 0)) return 0;
  return Math.max(3, Math.min(18, 3 + Math.floor(cash / 1500000)));
}

/* ══════════ 新しい試合の準備（newGame のラッパとオンラインの両方から） ══════════ */
function dkbOnNewGame(){
  if(!G) return;
  G.dkbInit = true;
  var s = 0; G.players.forEach(function(p){ s += (p.cash || 0); });
  G.pot = s;
  G.reachTiles = [];
  G.dkbLk = {};           // 席ごとの👍の数
  G.dkbLikeSent = 0;      // 自分が送った👍（1試合10回まで）
  G.dkbCpuEmo = 0;        // CPU のエモート（1試合5回まで）
  G.dkbEmoEv = '';
  DKB_S.gid++;
  DKB_S.potShown = null; DKB_S.toll = null; DKB_S.lastBR = -1; DKB_S.stackSig = '';
  DKB_S.lake = { lv: 0, t: 0 }; DKB_S.emoAt = 0; DKB_S.emoEcho = null; DKB_S.emoSel = [];
  try{
    dkbHideTransient();
    DKB_SEATS.forEach(function(seat){
      var h = DKB_S.hud[seat]; if(!h) return;
      var rb = h.querySelector('.dkb-rank'); if(rb){ rb._t = undefined; rb.classList.remove('dkb-flip'); }
      h._pi = undefined;
    });
    var ck = document.getElementById('pClock');
    if(ck){ ck.classList.remove('warn'); ck.textContent = cfg.timeLimit ? dkbFmtClock(G.clock) : '--:--'; }
    dkbEmoBarSync();
  }catch(e){ dkbErr('newgame', e); }
}
function dkbEnsureG(){
  if(!G) return;
  if(!G.dkbInit) dkbOnNewGame();
  if(typeof G.pot !== 'number' || !isFinite(G.pot)){ var s = 0; G.players.forEach(function(p){ s += (p.cash || 0); }); G.pot = s; }
  if(!Array.isArray(G.reachTiles)) G.reachTiles = [];
  if(!G.dkbLk || typeof G.dkbLk !== 'object') G.dkbLk = {};
}
function dkbHideTransient(){
  var ids = ['chip', 'dbl'];
  ids.forEach(function(id){ var e = document.getElementById(id); if(e) e.classList.remove('dkb-on', 'dkb-out'); });
  [DKB_S.imp, DKB_S.bub, DKB_S.reach, DKB_S.busy, DKB_S.tinfo, DKB_S.sal, DKB_S.mono].forEach(function(e){
    if(e) e.classList.remove('on', 'dkb-on', 'dkb-out');
  });
  DKB_S.busyPi = -1;
  DKB_S.tiAt = null; DKB_S.tiTok = null;
  DKB_SEATS.forEach(function(seat){
    var b = DKB_S.band[seat]; if(b){ clearTimeout(b._t); b.classList.remove('on', 'dkb-fade'); }
    var eb = DKB_S.emo[seat]; if(eb){ eb.q = []; clearTimeout(eb.t); while(eb.el.firstChild) eb.el.removeChild(eb.el.firstChild); }
  });
  while(DKB_S.pnls.length) dkbPanelDrop(DKB_S.pnls[0]);
  var bd = document.getElementById('band'); if(bd){ DKB_S.bandTok++; bd.classList.remove('on'); }
  var r = document.getElementById('raise'); if(r) r.classList.remove('on');
  var stg = document.getElementById('stage'); if(stg) stg.classList.remove('dkb-cel');
}

/* ══════════ DOM を作る（初回の updHUD か起動時） ══════════ */
function dkbHudHTML(seat){
  return '<div class="dkb-pwrap">'
    + '<div class="dkb-por" role="button" tabindex="0" aria-label="プレイヤーの情報">'
    +   '<div class="dkb-pin"><canvas width="224" height="224"></canvas></div>'
    +   '<b class="dkb-rar">A</b><b class="dkb-lv">1</b>'
    + '</div>'
    + (seat === 'Bot' ? '' : '<span class="dkb-ab">能力</span>')
    + '<i class="dkb-turn">手番</i>'
    + '<button type="button" class="dkb-auto" aria-label="自動プレイ">自動</button>'
    + '</div>'
    + '<div class="dkb-col">'
    +   '<div class="dkb-name"><span class="dkb-nm">—</span>'
    +     '<button type="button" class="dkb-lk" aria-label="いいね"><i>👍</i><b>0</b></button></div>'
    +   '<div class="dkb-row dkb-ra"><span class="dkb-k">総資産</span><b class="dkb-asset">0</b></div>'
    +   '<div class="dkb-row dkb-rc"><span class="dkb-k">マーブル</span><b class="dkb-cash">0</b></div>'
    +   '<div class="dkb-jam">邪魔できる回数：<b>3</b></div>'
    +   '<span class="dkb-tm"></span>'
    + '</div>'
    + '<div class="dkb-rank"><b>1</b><small>位</small></div>';
}
/* HUD の席の人（data-pi） */
function dkbHudPi(h){ return (h && h.hasAttribute('data-pi')) ? +h.getAttribute('data-pi') : -1; }
function dkbBuild(){
  if(DKB_S.built) return;
  var st = document.getElementById('stage'); if(!st) return;
  DKB_S.built = true;
  var world = document.getElementById('world');
  var vg = dkbEl('div', 'dkb-vignette'); vg.setAttribute('aria-hidden', 'true');
  if(world && world.nextSibling) st.insertBefore(vg, world.nextSibling); else st.appendChild(vg);

  DKB_SEATS.forEach(function(seat){
    var h = dkbEl('div', 'hud dkb-hud dkb-' + seat, dkbHudHTML(seat));
    h.id = 'dkbHud' + seat; h.setAttribute('data-seat', seat); h.style.display = 'none';
    st.appendChild(h); DKB_S.hud[seat] = h;
    var por = h.querySelector('.dkb-por');
    var open = function(){ var pi = dkbHudPi(h); if(pi >= 0){ try{ SFX.click(); }catch(e){} dkbInfo(pi); } };
    por.addEventListener('click', open);
    por.addEventListener('keydown', function(ev){ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); open(); } });
    /* 👍：相手の札を押すと、その人にいいね（1試合10回まで）。自分の札は数を見せるだけ */
    h.querySelector('.dkb-lk').addEventListener('click', function(){ var pi = dkbHudPi(h); if(pi >= 0) dkbSendLike(pi); });
    /* 自動：自分の札の［自動］を押すと手動に戻る */
    h.querySelector('.dkb-auto').addEventListener('click', function(){
      var pi = dkbHudPi(h); if(pi < 0 || pi !== dkbMe() || !G || G.players[pi].kind === 'cpu') return;
      try{ SFX.click(); }catch(e){}
      dkbSetAuto(pi, false);
    });
    var b = dkbEl('div', 'pill dkb-band dkb-b' + seat, '<i class="dkb-bar">▲</i><b class="dkb-bnum">0</b>');
    b.setAttribute('aria-hidden', 'true'); st.appendChild(b); DKB_S.band[seat] = b;
    var pb = dkbEl('div', 'dkb-pbox dkb-p' + seat); st.appendChild(pb); DKB_S.pbox[seat] = pb;
    var em = dkbEl('div', 'dkb-emo dkb-e' + seat); em.setAttribute('aria-live', 'polite'); st.appendChild(em);
    DKB_S.emo[seat] = { el: em, q: [], t: 0 };
  });
  /* #skillBtn（DOM の約束）は自分の席の肖像の下の「能力」札にする。押すと能力の説明（盤は変えない。J33・J47） */
  var sk = document.getElementById('skillBtn');
  if(sk){
    sk.classList.remove('skillbtn', 'ready'); sk.classList.add('dkb-skill'); sk.textContent = '能力'; sk.disabled = false;
    DKB_S.hud.Bot.querySelector('.dkb-pwrap').appendChild(sk);
    /* 人が押した時だけ説明を開く（自動対戦の .click() ではモーダルを出さない） */
    sk.addEventListener('click', function(ev){ if(ev && ev.isTrusted && G && !G.over){ try{ SFX.click(); }catch(e){} dkbInfo(dkbMe()); } });
  }

  /* プレート：上に「時間 mm:ss 制限ターン N」、下に場の総額 */
  var pl = document.getElementById('plate');
  if(pl){
    pl.innerHTML = '<div class="hd"><span class="dkb-pk">時間</span><span class="timer" id="pClock">'
      + (cfg.timeLimit ? dkbFmtClock(cfg.timeLimit) : '--:--') + '</span>'
      + '<span class="dkb-pk">制限ターン</span><em id="pTurn">' + (cfg.turns || 30) + '</em>'
      + '<span class="infl" id="pInfl"></span></div>'
      + '<div class="bd" id="pGoal">' + yen((cfg.cash || 0) * (cfg.n || 4)) + '</div>';
  }
  /* 出目・ダブル・ゲージインパクト・吹き出し */
  var chip = document.getElementById('chip');
  if(chip) chip.innerHTML = '<i class="dkb-rays"></i><i class="dkb-rays2"></i><i class="dkb-disc"></i><b class="dkb-num">7</b>';
  var dbl = document.getElementById('dbl'); if(dbl) dbl.textContent = '×ダブル';
  DKB_S.imp = dkbEl('div', 'dkb-imp', '<i>カード<br>効果</i><b>ゲージインパクト</b>'); st.appendChild(DKB_S.imp);
  DKB_S.bub = dkbEl('div', 'dkb-bub'); st.appendChild(DKB_S.bub);
  DKB_S.reach = dkbEl('div', 'dkb-reach', '<div class="dkb-rbang">!</div><div class="dkb-rband"><span></span><b></b><em>FORTUNE!</em></div>');
  st.appendChild(DKB_S.reach);
  var rz = document.getElementById('raise'); if(rz) rz.innerHTML = '<b>通行料値上げ！</b>';
  /* 他の人が選ぶ間の札（暗い角丸・白字・3つの点。J34）・マスの情報・給料の丸札・カラー独占 */
  DKB_S.busy = dkbEl('div', 'dkb-busy', '<div class="dkb-bin2"><span class="dkb-bt"></span><i class="dkb-dots"><b></b><b></b><b></b></i></div>');
  DKB_S.busy.setAttribute('aria-live', 'polite'); st.appendChild(DKB_S.busy);
  DKB_S.tinfo = dkbEl('div', 'dkb-tinfo'); st.appendChild(DKB_S.tinfo);
  DKB_S.sal = dkbEl('div', 'dkb-sal', '<b><small>給料</small><span>0</span></b>'); st.appendChild(DKB_S.sal);
  DKB_S.mono = dkbEl('div', 'dkb-mono', '<b>カラー独占</b>'); st.appendChild(DKB_S.mono);

  /* 左端の「？ ゲットアイテム」と、持っているフォーチュンカード */
  var gi = dkbEl('button', 'dkb-getitem', '<b>？</b><span>ゲットアイテム</span>');
  gi.type = 'button'; gi.addEventListener('click', function(){ try{ SFX.click(); }catch(e){} dkbItemsPanel(); });
  st.appendChild(gi);
  DKB_S.fc = dkbEl('button', 'dkb-fcard', '<i></i><span></span>');
  DKB_S.fc.type = 'button'; DKB_S.fc.setAttribute('aria-label', '持っているフォーチュンカード');
  DKB_S.fc.addEventListener('click', function(){ try{ SFX.click(); }catch(e){} dkbItemsPanel(); });
  st.appendChild(DKB_S.fc);

  /* ⏸・エモートを付け直す（12種から4個まで選んで［送る］。G06） */
  var mn = document.getElementById('menu');
  if(mn){ mn.onclick = null; mn.addEventListener('click', function(){ try{ SFX.click(); }catch(e){} dkbMenu(); }); mn.setAttribute('aria-label', 'メニュー'); }
  var eb = document.getElementById('emotebtn');
  if(eb){
    eb.onclick = null; eb.setAttribute('aria-label', 'エモート');
    eb.addEventListener('click', function(){
      var bar = document.getElementById('emotebar'); if(!bar) return;
      var on = !bar.classList.contains('on');
      if(on){ DKB_S.emoSel = []; dkbEmoBarSync(); }
      bar.classList.toggle('on', on);
      try{ SFX.click(); }catch(e){}
    });
  }
  var bar = document.getElementById('emotebar');
  if(bar){
    bar.innerHTML = '<div class="dkb-emgrid">' + DKB_EMO.map(function(e, k){
      return '<button type="button" class="dkb-emb' + (e.length > 2 ? ' dkb-emt' : '') + '" data-e="' + k + '"><span>' + esc(e) + '</span><i></i></button>';
    }).join('') + '</div><div class="dkb-emfoot"><span class="dkb-emcnt">0/4</span>'
      + '<button type="button" class="dkb-emsend">送る</button></div>';
    Array.prototype.forEach.call(bar.querySelectorAll('.dkb-emb'), function(btn){
      btn.addEventListener('click', function(){
        var e = DKB_EMO[+btn.getAttribute('data-e')], sel = DKB_S.emoSel, k = sel.indexOf(e);
        if(k >= 0) sel.splice(k, 1);
        else if(sel.length < 4) sel.push(e);
        else { try{ SFX.warn(); }catch(er){} return; }
        try{ SFX.click(); }catch(er){}
        dkbEmoBarSync();
      });
    });
    bar.querySelector('.dkb-emsend').addEventListener('click', function(){
      var list = DKB_S.emoSel.slice(); if(!list.length) return;
      if(dkbSendEmote(list)){ DKB_S.emoSel = []; bar.classList.remove('on'); }
      dkbEmoBarSync();
    });
  }
  /* 盤のマスを押すと情報（J59）。マスを選ぶ場面（pickTile）の間は何もしない */
  if(world){
    world.addEventListener('pointerdown', function(){ DKB_S.tdown = { t: performance.now(), pick: dkbPicking() }; });
    world.addEventListener('click', function(ev){ try{ dkbTileClick(ev); }catch(e){ dkbErr('tinfo', e); } });
  }
  /* マスの情報は、パネルの外を押すと閉じる（開いていない間は何もしない） */
  document.addEventListener('pointerdown', function(ev){ try{ dkbTileOutside(ev); }catch(e){ dkbErr('tinfo-out', e); } }, true);
}
/* プレートの位置（ステージ座標）。浮き数字をよけるのに使う */
function dkbPlateRect(){
  if(DKB_S.plateR) return DKB_S.plateR;
  var pl = document.getElementById('plate'); if(!pl || !pl.offsetWidth) return null;
  var w = pl.offsetWidth, h = pl.offsetHeight, l = pl.offsetLeft - w / 2, t = pl.offsetTop;
  DKB_S.plateR = { l: l, t: t, r: l + w, b: t + h };
  return DKB_S.plateR;
}

/* ══════════ HUD（変わった所だけ書く。手番の光はクラス。#legend は出さない。J22・J61・H10・H11） ══════════ */
function updHUD(){
  if(!G) return;
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  dkbEnsureG();
  var rk = rank();
  var rankOf = function(pi){ for(var k = 0; k < rk.length; k++) if(rk[k].i === pi) return k + 1; return rk.length; };
  dkbSeatMap();
  DKB_SEATS.forEach(function(seat){
    var el = DKB_S.hud[seat]; if(!el) return;
    var pi = DKB_S.piOf[seat];
    if(pi === undefined || !G.players[pi]){
      if(el.style.display !== 'none') el.style.display = 'none';
      if(el.hasAttribute('data-pi')) el.removeAttribute('data-pi');
      return;
    }
    if(el.style.display) el.style.display = '';
    if(el.getAttribute('data-pi') !== String(pi)) el.setAttribute('data-pi', String(pi));
    fillHUD(seat, pi, seat === 'Bot' ? 'bot' : 'top');
    var p = G.players[pi], out = !!p.out, r = rankOf(pi);
    var rb = el._rb || (el._rb = el.querySelector('.dkb-rank'));
    var key = (out ? '破' : String(r)) + '|' + pi;
    if(rb && rb._t !== key){
      rb.innerHTML = '<b>' + (out ? '破' : r) + '</b><small>' + (out ? '産' : '位') + '</small>';
      /* 順位が変わった時だけ回す（席の入れ替えや試合開始では回さない） */
      if(rb._t !== undefined && String(rb._t).split('|')[1] === String(pi) && !dkbFast() && !DKFX.reduced){
        if(rb.classList.contains('dkb-flip')) dkbReplay(rb); else rb.classList.add('dkb-flip');
      }
      rb._t = key;
    }
    el.classList.toggle('dkb-out', out);
    el.classList.toggle('dkb-myturn', G.turn === pi && !out && !G.over);
  });

  /* プレート */
  dkbTxt(document.getElementById('pTurn'), String(Math.max(0, G.turnsLeft)));
  var ie = document.getElementById('pInfl');
  if(ie){ var on = G.infl > 1; ie.classList.toggle('on', on); dkbTxt(ie, on ? '通行料 ×' + inflTxt() : ''); }
  var ck = document.getElementById('pClock');
  if(ck){ if(!cfg.timeLimit) dkbTxt(ck, '--:--'); else if(!G.running) dkbTxt(ck, dkbFmtClock(G.clock)); }
  var pg = document.getElementById('pGoal');
  if(pg && DKB_S.potShown !== G.pot){
    var from = (DKB_S.potShown === null) ? G.pot : DKB_S.potShown;
    DKB_S.potShown = G.pot;
    if(from === G.pot || dkbFast()){ pg._dkbCnt = null; dkbTxt(pg, yen(G.pot)); }
    else dkbCount(pg, from, G.pot, 800 * SPEED);
  }

  /* 札束の山：席・束の数・フォーチュンカードの数が変わった時だけ（C16：盤の作り直しは dkkStacksChanged が無い時だけ） */
  var sig = '';
  G.players.forEach(function(p, i){ sig += dkbSeatOfPi(i) + (p.out ? 'x' : dkbBundles(p.cash)) + '.' + dkbCardsOf(p) + ';'; });
  if(sig !== DKB_S.stackSig){
    DKB_S.stackSig = sig; dkbSyncStackPos();
    if(typeof dkkStacksChanged === 'function') dkkStacksChanged(); else boardChanged();
  }
  dkbFcardSync();
}
function dkbTeam(pi){ try{ return typeof dkTeamOf === 'function' ? dkTeamOf(pi) : pi % 2; }catch(e){ return pi % 2; } }
/* HUD の金額：同じ値なら書かない。変わったら 0.8秒（×SPEED）で回す */
function dkbRoll(el, to){
  if(!el) return;
  var cur = el.dataset.v;
  if(cur !== undefined && +cur === to) return;
  var from = (cur === undefined) ? to : +cur;
  el.dataset.v = to;
  if(from === to || dkbFast()){ el._dkbCnt = null; dkbTxt(el, yen(to)); }
  else dkbCount(el, from, to, 800 * SPEED);
}
/* 数字を回す：30コマ/秒で書き、寸法は読まない（J22「数字の回転は30fpsで十分」・H11） */
function dkbCount(el, from, to, dur){
  var tok = {}; el._dkbCnt = tok;
  var t0 = performance.now();
  var fin = function(){ if(el._dkbCnt === tok){ el._dkbCnt = null; dkbTxt(el, yen(to)); } };
  var step = function(ts){
    if(el._dkbCnt !== tok) return;
    var now = performance.now(), k = (now - t0) / dur;
    if(k >= 1){ fin(); return; }
    /* 書くのは 1/30秒の区切りが変わったコマだけ。コマの時刻で決めるので、回っている数字は全部同じコマで書く（レイアウト1回） */
    var slot = Math.floor((typeof ts === 'number' ? ts : now) / 33.3);
    if(slot !== el._dkbSlot){ el._dkbSlot = slot; dkbTxt(el, yen(from + (to - from) * (1 - Math.pow(1 - Math.max(0, k), 4)))); }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  setTimeout(fin, dur + 250);
}
function fillHUD(sfx, pi, cls){
  var el = DKB_S.hud[sfx]; if(!el || !G || !G.players[pi]) return;
  var p = G.players[pi], c = cardById(p.card) || {};
  var q = el._q || (el._q = {
    nm: el.querySelector('.dkb-nm'), cash: el.querySelector('.dkb-cash'), asset: el.querySelector('.dkb-asset'),
    jam: el.querySelector('.dkb-jam b'), rar: el.querySelector('.dkb-rar'), lv: el.querySelector('.dkb-lv'),
    cv: el.querySelector('canvas'), tm: el.querySelector('.dkb-tm'), lk: el.querySelector('.dkb-lk b') });
  var asset = assetOf(G, pi);
  if(el._pi !== pi){
    el._pi = pi;
    el.style.setProperty('--pc', PCOL[pi]);
    el.style.setProperty('--pcd', shade(PCOL[pi], -0.5));
    /* 席の人が変わった時は数字を回さずに置き換える */
    q.cash.dataset.v = p.cash; q.cash.textContent = yen(p.cash);
    q.asset.dataset.v = asset; q.asset.textContent = yen(asset);
  }
  dkbTxt(q.nm, p.name);
  var rr = RAR[c.rar] ? c.rar : 'A';
  dkbTxt(q.rar, RAR[rr] ? RAR[rr].nm : 'A');
  var rc = 'dkb-rar dkb-r' + rr; if(q.rar.className !== rc) q.rar.className = rc;
  dkbTxt(q.lv, String(p.cardLv || 1));                 // 丸数字＝カードの Lv（J47）
  var pic = q.cv;
  if(pic && (pic.dataset.ch !== String(p.ch) || pic.dataset.col !== PCOL[pi] || pic.dataset.card !== String(p.card || ''))){
    pic.dataset.ch = p.ch; pic.dataset.col = PCOL[pi]; pic.dataset.card = p.card || '';
    var ex = portraits.find(function(o){ return o.el === pic; });
    if(ex){ ex.chId = p.ch; ex.col = PCOL[pi]; ex.cardId = p.card; } else regPortrait(pic, p.ch, PCOL[pi], p.card);
  }
  dkbRoll(q.cash, p.cash);
  dkbRoll(q.asset, asset);
  el.classList.toggle('dkb-long', yen(Math.max(p.cash, asset)).length > 9);
  /* 「邪魔できる回数」は揺らす（当作ルール）の時だけ（J45）。魔力ゲージは出さない（J33） */
  var shake = !!cfg.shake;
  el.classList.toggle('dkb-shake', shake);
  if(shake) dkbTxt(q.jam, String(p.jam === undefined || p.jam === null ? 0 : p.jam));
  /* チーム戦の札（Red Team／Blue Team） */
  var tm = cfg.team ? (dkbTeam(pi) === 1 ? 'Blue Team' : 'Red Team') : '';
  dkbTxt(q.tm, tm);
  el.classList.toggle('dkb-team', !!tm);
  el.classList.toggle('dkb-tblue', !!tm && dkbTeam(pi) === 1);
  /* 👍 の数。相手の札は押すといいね */
  dkbTxt(q.lk, String((G.dkbLk && G.dkbLk[pi]) | 0));
  el.classList.toggle('dkb-lkon', pi !== dkbMe());
  /* 自動プレイ中の人間に［自動］（自分の札は押すと手動に戻る） */
  el.classList.toggle('dkb-isauto', p.kind !== 'cpu' && dkbIsAuto(pi));
  /* 名札の枠（C24） */
  var fr = '';
  try{ fr = String((typeof dkFrameOf === 'function' && dkFrameOf(pi)) || ''); }catch(e){ fr = ''; }
  if((el.getAttribute('data-frame') || '') !== fr){ if(fr) el.setAttribute('data-frame', fr); else el.removeAttribute('data-frame'); }
  if(cls === 'bot'){
    var b = document.getElementById('skillBtn');
    if(b){
      if(b.disabled) b.disabled = false;
      if(b.classList.contains('ready')) b.classList.remove('ready');
      dkbTxt(b, '能力');
    }
  }
}

/* ══════════ お金の帯（その人の HUD の上。増えたら橙↑・減ったら青↓、数字はパラパラ回る） ══════════ */
function pill(pi, amount){
  if(!G || !G.players[pi] || !amount) return false;
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var seat = dkbSeatOfPi(pi), el = DKB_S.band[seat]; if(!el) return false;
  var up = amount >= 0, cash = G.players[pi].cash;
  el.classList.toggle('dkb-up', up); el.classList.toggle('dkb-dn', !up);
  var bar = el._bar || (el._bar = el.querySelector('.dkb-bar')), num = el._num || (el._num = el.querySelector('.dkb-bnum'));
  dkbTxt(bar, up ? '▲' : '▼');
  var showing = el.classList.contains('on') && !el.classList.contains('dkb-fade');
  var from = (showing && num.dataset.v !== undefined) ? +num.dataset.v : cash - amount;
  num.dataset.v = cash;
  if(!showing){
    if(el.classList.contains('dkb-fade')) el.classList.remove('dkb-fade');   // 消える途中なら入場のアニメに戻る
    if(el.classList.contains('on')) dkbReplay(el); else el.classList.add('on');
  }
  if(dkbFast()){ num._dkbCnt = null; dkbTxt(num, yen(cash)); }
  else dkbCount(num, from, cash, 800 * SPEED);
  if(!dkbFast()) dkbFtag(el, yen(Math.abs(amount)), up);       // 浮き数字は帯の中（HUD 側。WP7#4）
  clearTimeout(el._t);
  el._t = setTimeout(function(){
    el.classList.add('dkb-fade');
    el._t = setTimeout(function(){ el.classList.remove('on', 'dkb-fade'); }, 300 * SPEED + 20);
  }, 1500 * SPEED);
  return true;
}

/* ══════════ 対戦中の通知（J36・C10）：HUD の角の通知パネル（同時に2枚まで）と暗い帯（#band・1本） ══════════ */
function dkbPanelDrop(d){
  if(!d) return;
  var k = DKB_S.pnls.indexOf(d); if(k >= 0) DKB_S.pnls.splice(k, 1);
  clearTimeout(d._t); clearTimeout(d._t2);
  if(d.parentNode) d.parentNode.removeChild(d);
  if(DKB_S.pfree.length < 3 && DKB_S.pfree.indexOf(d) < 0) DKB_S.pfree.push(d);
}
/* 持ち主の HUD の角から滑り込むパネル（金の見出し＋白字の説明＋アイコン）。DOM は使い回す */
function dkbPanel(pi, icon, title, sub, opt){
  opt = opt || {};
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var seat = G ? dkbSeatOfPi(pi) : 'Bot', box = DKB_S.pbox[seat]; if(!box) return null;
  while(DKB_S.pnls.length >= 2) dkbPanelDrop(DKB_S.pnls[0]);
  var d = DKB_S.pfree.pop() || dkbEl('div', 'dkb-pnl',
    '<i class="dkb-pic"><span></span><small></small></i><div class="dkb-ptx"><b></b><span></span></div>');
  d.className = 'dkb-pnl' + (opt.miss ? ' dkb-miss' : '');
  var ic = String(icon == null ? '' : icon);
  if(!ic || /^\s*</.test(ic)) ic = '✨';                     // 画面用の SVG などは絵文字に置き換える
  d.querySelector('.dkb-pic > span').textContent = ic;
  var sm = d.querySelector('.dkb-pic > small'); sm.textContent = opt.rar || ''; sm.hidden = !opt.rar;
  d.querySelector('.dkb-ptx > b').textContent = title || '';
  var sp = d.querySelector('.dkb-ptx > span'); sp.textContent = sub || ''; sp.hidden = !sub;
  box.appendChild(d);                                          // 入れ直すと入場のアニメは最初から
  DKB_S.pnls.push(d);
  d._t = setTimeout(function(){
    d.classList.add('out');
    d._t2 = setTimeout(function(){ dkbPanelDrop(d); }, 220 * SPEED + 20);
  }, (opt.ms || 2300) * SPEED);
  return d;
}
/* C10：対戦中の通知。opt.band＝暗い帯、それ以外＝pi の HUD の角。対戦の外では元のトースト */
function dkNotify(pi, icon, title, sub, opt){
  opt = (opt && typeof opt === 'object') ? opt : {};
  if(!G || !G.players || G.over){ dkbToastDom('R', icon || '', title || '', sub || '', opt.ms); return null; }
  if(opt.band){ dkbBand(title, sub, opt.ms || 1500); return null; }
  if(typeof pi !== 'number' || !G.players[pi]) pi = (typeof G.turn === 'number' && G.players[G.turn]) ? G.turn : 0;
  return dkbPanel(pi, icon, title, sub, opt);
}
/* 暗い半透明の角丸の帯（1本だけ。新しい帯が来たら書き換え、古い帯の時間切れでは消さない） */
function dkbBand(title, sub, ms){
  var el = document.getElementById('band'); if(!el) return Promise.resolve();
  var tok = ++DKB_S.bandTok;
  dkbTxt(document.getElementById('bandT'), String(title == null ? '' : title));
  var s = document.getElementById('bandS');
  if(s){ dkbTxt(s, String(sub == null ? '' : sub)); if(s.hidden !== !sub) s.hidden = !sub; }
  if(el.classList.contains('on')) dkbReplay(el); else el.classList.add('on');
  return wait(ms || 1500).then(function(){ if(DKB_S.bandTok === tok) el.classList.remove('on'); });
}
async function band(title, sub, ms){ await dkbBand(title, sub, ms); }
/* toast：対戦中は dkNotify（手番の人の HUD の角）へ回す。メタ画面・結果の間は 4-game.js の toast と同じ */
function toast(side, icon, title, sub, ms){
  if(dkbInMatch()){ dkNotify(G.turn, icon, title, sub, { ms: ms }); return; }
  dkbToastDom(side, icon, title, sub, ms);
}
function dkbToastDom(side, icon, title, sub, ms){
  var box = document.querySelector(side === 'L' ? '#toastL' : '#toastR'); if(!box) return;
  var d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = '<div class="ic">' + icon + '</div><div class="tx"><b>' + esc(title) + '</b>'
    + (sub ? '<i>' + esc(sub) + '</i>' : '') + '</div>';
  box.appendChild(d);
  setTimeout(function(){ d.classList.add('out'); setTimeout(function(){ d.remove(); }, 260); }, (ms || 2200) * SPEED);
}
/* C11：他の人が選ぶ間の札（駒の上。同時に1個。text が null なら消す） */
function dkBusyTag(pi, text){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = DKB_S.busy; if(!el) return;
  if(!text || !G || G.over || typeof pi !== 'number' || !G.players[pi]){
    if(pi === undefined || pi === null || pi === DKB_S.busyPi || !text){ el.classList.remove('on'); DKB_S.busyPi = -1; }
    return;
  }
  DKB_S.busyPi = pi;
  dkbTxt(el.querySelector('.dkb-bt'), String(text));
  if(!el.classList.contains('on')) el.classList.add('on');
  dkbFollow(el, function(){ return DKB_S.busyPi === pi ? dkbTokW(pi) : null; }, -96);
}
/* 能力・アイテム・ボーナスのカットイン（4-game.js の写し。再始動は getAnimations） */
async function cutIn(t1, t2, t3){
  var a = document.getElementById('scT1'), b = document.getElementById('scT2'), c = document.getElementById('scT3');
  if(a) a.textContent = t1; if(b) b.textContent = t2; if(c) c.textContent = t3 || '';
  var el = document.getElementById('skillcut');
  if(!el){ await wait(1300); return; }
  var tok = ++DKB_S.cutTok;
  if(el.classList.contains('on')) dkbReplay(el, true); else el.classList.add('on');
  await wait(1300);
  if(DKB_S.cutTok === tok) el.classList.remove('on');
}
/* 上のテロップ（試合中の出来事。12件まで） */
function news(txt){
  NEWS.push(txt);
  if(NEWS.length > 12) NEWS.shift();
  var el = document.getElementById('tickerText'); if(!el) return;
  el.textContent = txt;
  dkbReplay(el);
}
/* 独占の警報（4-game.js の写し） */
function alarmBand(a, b){
  var el = document.getElementById('alarm'); if(!el) return;
  var qa = el.querySelector('.a'), qb = el.querySelector('.b');
  if(qa) qa.textContent = a; if(qb) qb.textContent = b;
  var tok = ++DKB_S.alarmTok;
  if(el.classList.contains('on')) dkbReplay(el, true); else el.classList.add('on');
  setTimeout(function(){ if(DKB_S.alarmTok === tok) el.classList.remove('on'); }, 2600 * SPEED);
}

/* ══════════ 手番の大見出し：本家に無いので出さない（手番は HUD の光だけ。J46） ══════════ */
async function turnBig(pi){ return; }

/* ══════════ 出目 ══════════ */
/* WP6 の doRoll は showChip(total, isDbl, {impact, target}) で呼ぶ。旧 doRoll（引数2つ）の時だけ、
   止まったゲージの位置から推し量る（振る瞬間に gaugeOn=false になるので gaugePhase は押した時の値のまま） */
function dkbGuessImpact(){
  try{
    var p = G && G.players[G.turn];
    if(p && p.jail > 0) return false;
    return typeof gaugePhase === 'number' && typeof gaugeSweet === 'number' && Math.abs(gaugePhase - gaugeSweet) < gaugeHalf;
  }catch(e){ return false; }
}
/* 出目の札を出す（ふだんは白銀、ダブルは金＋「×ダブル」＋回る光。J48）。再始動は getAnimations */
function dkbShowOn(el){
  if(!el) return;
  if(el.classList.contains('dkb-out')) el.classList.remove('dkb-out');   // 消える途中なら入場のアニメに戻る
  if(el.classList.contains('dkb-on')) dkbReplay(el); else el.classList.add('dkb-on');
}
function dkbShowOff(el){
  if(el && el.classList.contains('dkb-on')) el.classList.remove('dkb-on');
  if(el && el.classList.contains('dkb-out')) el.classList.remove('dkb-out');
}
function showChip(n, isDouble, opt){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  opt = (opt && typeof opt === 'object') ? opt : {};
  var imp = (typeof opt.impact === 'boolean') ? opt.impact : dkbGuessImpact();
  var tok = ++DKB_S.chipTok;
  var c = document.getElementById('chip'), d = document.getElementById('dbl'), im = DKB_S.imp;
  if(c){
    var num = c._num || (c._num = c.querySelector('.dkb-num')); if(num) dkbTxt(num, String(n));
    c.classList.toggle('dkb-gold', !!isDouble);
    c.classList.toggle('dkb-two', String(n).length > 1);
    dkbShowOn(c);
  }
  if(d){
    dkbTxt(d, '×ダブル');
    if(isDouble) dkbShowOn(d); else dkbShowOff(d);
  }
  if(im){ if(imp) dkbShowOn(im); else dkbShowOff(im); }
  if(isDouble) dkbDoubleMsg(tok);
  /* 粒は次のコマの頭で出す（共有 canvas の準備がステージの寸法を読むので、DOM を書いた直後に呼ぶと強制レイアウトになる） */
  if(!dkbFast()){
    var big = !!(imp || isDouble), dbl2 = !!isDouble;
    dkbNextFrame(function(){
      fxBurst({ x: 800, y: 376 }, { kind: 'star', n: big ? 16 : 8, power: big ? 1.1 : 0.7 });
      if(dbl2) fxBurst({ x: 800, y: 376 }, { kind: 'coin', n: 10, power: 0.9 });
    });
  }
}
/* 寸法を読む演出（粒・浮き札・コイン）は次のコマの頭へ回す（同じコマの中でまとめて1回のレイアウトで済む） */
function dkbNextFrame(fn){
  requestAnimationFrame(function(){ try{ fn(); }catch(e){ dkbErr('frame-fx', e); } });
}
function hideChip(){
  var tok = DKB_S.chipTok;
  var list = [document.getElementById('chip'), document.getElementById('dbl'), DKB_S.imp];
  list.forEach(function(e){ if(e && e.classList.contains('dkb-on') && !e.classList.contains('dkb-out')) e.classList.add('dkb-out'); });
  setTimeout(function(){
    if(DKB_S.chipTok !== tok) return;
    list.forEach(dkbShowOff);
  }, 200 * SPEED + 20);
}
/* ダブルのあとの暗い帯（本家「ダブルボーナス！ もう一回！サイコロを振ります」）。3回目は 9g の帯に任せる */
function dkbDoubleMsg(tok){
  var p = G && G.players[G.turn];
  if(p && !(p.jail > 0) && p.dblRun >= 2) return;
  var a = 'ダブルボーナス！', b = 'もう一回！サイコロを振ります';
  if(p && p.jail > 0){ a = 'ダブル！'; b = 'ここから脱出できます'; }
  dkbBand(a, b, 1500);
}

/* ══════════ 通行料値上げ！（そのマスの画面位置） ══════════ */
/* at：マス番号か {x,y}（ワールド座標）。無ければ、育てている最中のマス（growAnim が grow=0 にする）
   → 直前に立てた光の柱 → 盤の上の中央、の順で探す */
function dkbRaiseAt(at){
  if(typeof at === 'number' && at >= 0 && at < 32) return tileCenter(at);
  if(at && typeof at.x === 'number' && typeof at.y === 'number') return { x: at.x, y: at.y };
  if(!G) return null;
  for(var i = 0; i < 32; i++){ var t = G.tiles[i]; if(t && t.type === 'city' && t.grow === 0) return tileCenter(i); }
  for(var k = fxList.length - 1; k >= 0 && k >= fxList.length - 8; k--){
    var f = fxList[k];
    if(f && f.kind === 'pillar' && f.t < 120) return { x: f.x, y: f.y };
  }
  return null;
}
/* opt.tone==='blue' はランドマーク（青い大きな字・約1秒。C13・J09） */
function raiseBanner(txt, at, opt){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = document.getElementById('raise'); if(!el) return;
  opt = (opt && typeof opt === 'object') ? opt : {};
  var blue = opt.tone === 'blue';
  var w = dkbRaiseAt(at);
  el.innerHTML = '<b>' + esc(txt || '通行料値上げ！') + '</b>';   // 中の字を作り直すので入場のアニメは最初から
  el.classList.toggle('dkb-blue', blue);
  if(!el.classList.contains('on')) el.classList.add('on');
  if(w) dkbFollow(el, function(){ return w; }, -72);
  else { el._dkbTok = null; el.style.transform = 'translate(800px,200px)'; }
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('on'); }, (blue ? 1000 : 1400) * SPEED);
}
/* C12：色の組をそろえた瞬間、駒の上に水色の「カラー独占」を約1秒（J50） */
function dkColorMono(pi, g){
  if(!G || !G.players || !G.players[pi] || G.over) return;
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = DKB_S.mono; if(!el) return;
  el.innerHTML = '<b>カラー独占</b>';
  var col = (typeof GCOL !== 'undefined' && GCOL && typeof g === 'number' && GCOL[g]) ? GCOL[g] : '';
  el.style.setProperty('--gc', col || '#7FE6FF');
  if(!el.classList.contains('on')) el.classList.add('on');
  dkbFollow(el, function(){ return dkbTokW(pi); }, -118);
  if(!dkbFast()){ try{ SFX.landmark(); }catch(e){} }
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('on'); }, 1100 * SPEED);
}

/* ══════════ 通行料 ══════════ */
/* 札束は2段で飛ぶ：払う人の山 → 湖の中央（札束の山と金額） → 受け取る人の山。
   7-online.js は moneyFly(pi, owner, true) と3引数で呼ぶ（戻り値は使わない）。 */
function moneyFly(fromPi, toPi, heavy, amt){
  if(!G || !G.players[fromPi] || !G.players[toPi]) return Promise.resolve();
  var a = dkbStackXY(fromPi), c = { x: BCX, y: BCY + 6 }, b = dkbStackXY(toPi);
  var dur = Math.max(220, 620 * SPEED);
  addFx('bill', a.x, a.y, dur, PCOL[toPi], null, false, { from: a, to: c });
  addFx('shockring', a.x, a.y + 6, Math.max(220, 560 * SPEED), '#FFD8A0', null, false, { r: heavy ? 230 : 170 });
  DKB_S.toll = { t0: performance.now(), amt: (typeof amt === 'number' ? amt : 0), heavy: !!heavy,
    dur: Math.max(800, 1400 * SPEED), n: heavy ? 7 : 5 };
  try{ SFX.coin(); }catch(e){}
  return new Promise(function(res){
    setTimeout(function(){
      addFx('bill', c.x, c.y, dur, PCOL[toPi], null, false, { from: c, to: b });
      try{ SFX.coin(); }catch(e){}
      setTimeout(function(){
        addFx('coinburst', b.x, b.y - 8, Math.max(300, 900 * SPEED));
        addFx('starburst', b.x, b.y - 20, Math.max(260, 650 * SPEED), '#FFE9A8', null, false, { r: 70 });
        try{ SFX.coin(); }catch(e){}
        res();
      }, 450 * SPEED);
    }, 500 * SPEED);
  });
}
/* 払う駒の頭上の吹き出し（割引の時は青） */
function dkbBubble(pi, label, amt, blue){
  var el = DKB_S.bub; if(!el) return;
  el.className = 'dkb-bub on' + (blue ? ' dkb-blue' : '');
  el.innerHTML = '<div class="dkb-bin"><span>' + esc(label) + '</span><b>' + esc(yen(amt)) + '</b></div>';
  dkbFollow(el, function(){ return dkbTokW(pi); }, -52);
}
function dkbBubbleOff(){ if(DKB_S.bub) DKB_S.bub.classList.remove('on'); }
/* フォーチュンカード（天使＝無料・割引クーポン＝半額）を使うか。自動の人と CPU は画面を出さずに使う（C14・C27） */
function dkbAskCard(pi, tag, amt){
  var p = G.players[pi];
  var nm = tag === 'coupon' ? '割引クーポン' : '天使カード';
  var after = tag === 'coupon' ? yen(Math.round(amt / 2)) : '無料';
  var auto = !p || p.kind === 'cpu' || dkbIsAuto(pi);
  var local = auto ? function(){ return true; } : function(){
    return modal('<div class="modal"><div class="dkb-mpanel fx-panel dkb-angel">'
      + '<h3>' + esc(nm) + '</h3>'
      + '<p>通行料：<b class="dkb-am">' + esc(yen(amt)) + '</b> → <b class="dkb-free">' + esc(after) + '</b></p>'
      + '<p>' + esc(nm) + 'を使用しますか？</p>'
      + '<div class="dkb-mbtns"><button class="btn ghost" data-act="cancel">キャンセル</button>'
      + '<button class="btn gold" data-act="use">使用</button></div></div></div>')
      .then(function(a){ return a === 'use'; });
  };
  var r;
  try{ r = dvAsk(pi, tag, local, nm + 'を使うか選んでいます…'); }catch(e){ dkbErr('ask', e); r = local(); }
  return Promise.resolve(r).then(function(v){ return !!v; }, function(e){ dkbErr('ask', e); return false; });
}
async function payToll(pi, i){
  var t = G.tiles[i], owner = t ? t.owner : -1, p = G.players[pi], ow = G.players[owner];
  if(!t || !p || !ow || owner === pi) return;
  /* チーム戦：味方の都市は払わない（C03） */
  if(dkbAlly(pi, owner)){ dkbBand('味方の土地', t.name + ' の通行料はかかりません', 1300); await wait(700); return; }
  if(t.frozen > 0){ dkNotify(pi, '⚡', '停電中', t.name + ' の通行料は0です', { ms: 1600 }); await wait(700); return; }
  var amt = Math.round(tollOf(t, G) * statMul(p, 'toll', 0.35));
  var notes = [];
  if(t.bind){ amt = Math.round(amt * 2); t.bind = 0; notes.push('束縛 ×2'); }
  if(ow.gouge > 0){ ow.gouge--; amt = Math.round(amt * 2); notes.push('ぼったくり ×2'); }
  if(p.pay2 > 0){ p.pay2--; amt = Math.round(amt * 2); notes.push('×2'); }
  /* 能力（C04）：持ち主の 'own'（地価高騰 +15%）→ 払う人の 'toll'（通行料免除） */
  var so = dkbSkill(owner, 'own', { tile: i, pi: pi });
  if(so && so.fired) amt = Math.round(amt * 1.15);
  if(so) dkbSkillNote(owner, so);
  var sp = dkbSkill(pi, 'toll', { tile: i, owner: owner });
  if(sp) dkbSkillNote(pi, sp);
  if(sp && sp.fired){ news(p.name + ' の能力で ' + t.name + ' の通行料が免除！'); await wait(700); return; }
  /* フォーチュンカード：天使（無料）→ 割引クーポン（半額）。v9 の freeToll・halfToll も通す */
  if(p.fcard === 'angel' || p.freeToll > 0){
    var use = await dkbAskCard(pi, 'angel', amt);
    if(G.over) return;
    if(use){
      if(p.fcard === 'angel') p.fcard = null; else p.freeToll--;
      dkNotify(pi, '🪽', '天使カード', '通行料：' + yen(amt) + ' → 無料', { ms: 2000 });
      news(p.name + ' が天使カードで通行料を無料にした');
      updHUD();
      await wait(600);
      return;
    }
  }
  var disc = false;
  if(p.fcard === 'coupon'){
    var useC = await dkbAskCard(pi, 'coupon', amt);
    if(G.over) return;
    if(useC){ p.fcard = null; amt = Math.round(amt / 2); disc = true; updHUD(); }
  } else if(p.halfToll > 0){ p.halfToll--; amt = Math.round(amt / 2); disc = true; }
  news(p.name + ' → ' + ow.name + ' に通行料 ' + yen(amt) + (notes.length ? '（' + notes.join('・') + '）' : '') + '！');
  /* 盤全体を見せてから吹き出し → 支払い → 札束（本家の通行料の支払い全体 約1.6秒） */
  camTo(BCX, BCY, 1);
  await wait(150);
  dkbBubble(pi, disc ? '割引 通行料' : (notes.length ? '通行料 ' + notes.join('・') : '通行料'), amt, disc);
  try{ SFX.pay(); }catch(e){}
  await wait(350);
  var ok = await dkPayFrom(pi, amt, owner);
  if(!ok){ dkbBubbleOff(); await bankrupt(pi, owner); return; }
  await moneyFly(pi, owner, amt > 3000000 * dkbScale(), amt);
  dkbBubbleOff();
  give(pi, -amt); give(owner, amt);
  camShake(8);
  dkbCpuReact(pi, owner, amt);
  await wait(150);
}

/* ══════════ 給料（開始マーブルの15%×週の倍率、給料ボーナスは最初の1回×2、能力×1.2。J06・C19） ══════════ */
function salary(pi){
  var p = G && G.players[pi]; if(!p || p.out) return 0;
  var base = 0;
  try{ base = (typeof dkRate === 'function') ? +dkRate('salary') : 0; }catch(e){ base = 0; }
  if(!(base > 0)) base = Math.round((cfg.cash || 10000000) * 0.15);
  var amt = Math.round(base * ((G.ev && G.ev.salaryX) || 1)), bonus = false;
  if(!p.dkbSal1){ p.dkbSal1 = 1; if(p.carry && p.carry.sal){ amt *= 2; bonus = true; } }
  if(p.salaryX2 > 0){ amt *= 2; p.salaryX2--; bonus = true; }
  var sk = dkbSkill(pi, 'salary', { amt: amt });
  if(sk && sk.fired) amt = Math.round(amt * 1.2);
  if(sk) dkbSkillNote(pi, sk);
  dkbEnsureG();
  G.pot = (G.pot || 0) + amt;
  give(pi, amt);
  if(bonus) dkNotify(pi, '💴', '給料ボーナス', '給料が2倍になりました', { ms: 1800 });
  dkbSalTag(amt);
  return amt;
}
/* スタートの近くの青い丸札「給料 150万」（トーストは出さない） */
function dkbSalTag(amt){
  if(dkbFast() || !G) return;
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = DKB_S.sal; if(!el) return;
  dkbTxt(el.querySelector('span'), yen(amt));
  var b = el.querySelector('b');
  if(el.classList.contains('on')) dkbReplay(b); else el.classList.add('on');
  var w = tileCenter(0);
  dkbFollow(el, function(){ return w; }, -64);
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('on'); }, 1300 * SPEED + 200);
}

/* ══════════ お金（浮き数字は HUD の帯の横。盤の上には重ねない。WP7#4） ══════════ */
function give(pi, amount){
  var p = G.players[pi];
  p.cash += amount;
  var shown = false;
  try{ shown = pill(pi, amount); }catch(e){ dkbErr('pill', e); }
  if(!shown && amount && !dkbFast()){
    var c = p.render || tileCenter(p.pos);
    addFloat(c.x, c.y - 84, (amount >= 0 ? '+' : '') + yen(amount), amount >= 0 ? null : '#CFE0F0', true);
  }
  try{ if(amount >= 0) SFX.coin(); else SFX.pay(); }catch(e){}
  updHUD();
}

/* ══════════ 移動（1マス 2〜4マス170ms・10以上130ms・ほか150ms、スタート通過の1マス320ms、1回1.5秒まで。G04） ══════════ */
/* カメラの寄せ先を卓の内側（x 28〜1572・y 16〜884）に収める（WP6#5） */
function dkbCamTo(x, y, z){
  var hw = SW / 2 / z, hh = SH / 2 / z;
  camTo(Math.max(28 + hw, Math.min(1572 - hw, x)), Math.max(16 + hh, Math.min(884 - hh, y)), z);
}
/* 1マスごとの時間（負の値＝スタート通過の1マス） */
function dkbStepDurs(pos0, n){
  var base = n >= 10 ? DKB_MOVE.long : (n >= 2 && n <= 4) ? DKB_MOVE.short : DKB_MOVE.mid;
  var out = [], tot = 0, fixed = 0, pos = pos0, k;
  for(k = 0; k < n; k++){
    pos = (pos + 1) % 32;
    var pass = (pos === 0 && k < n - 1);
    out.push(pass ? -DKB_MOVE.pass : base);
    tot += pass ? DKB_MOVE.pass : base; if(pass) fixed += DKB_MOVE.pass;
  }
  if(tot > DKB_MOVE.cap && tot > fixed){
    var f = Math.max(0.4, (DKB_MOVE.cap - fixed) / (tot - fixed));
    tot = fixed;
    for(k = 0; k < n; k++) if(out[k] > 0){ out[k] = Math.round(out[k] * f); tot += out[k]; }
  }
  return { d: out, tot: tot };
}
/* スタートを通る1マス：給料（salary はここ）と、スタートから HUD へ飛ぶコイン */
function dkbPassStart(pi){
  var amt = salary(pi);
  if(dkbFast() || !(amt > 0)) return;
  var c = tileCenter(0), s = dkbW2S(c.x, c.y);
  /* 行き先はその席の肖像（ステージ座標で決まっている。HUD の寸法は読まない） */
  var to = { Top: { x: 66, y: 64 }, TR: { x: 1534, y: 64 }, BL: { x: 66, y: 816 }, Bot: { x: 1534, y: 816 } }[dkbSeatOfPi(pi)] || { x: 800, y: 450 };
  dkbNextFrame(function(){ fxCoins({ x: s.x, y: s.y }, to, { n: 10, dur: 620, spread: 40 }); });
}
/* 帯の上の小さな ▲80万／▼17万：帯の中に置く（最新の1つだけ・DOM は使い回し・寸法を読まない） */
function dkbFtag(band, txt, up){
  var pool = band._ft || (band._ft = []);
  var old = band.querySelector('.dkb-ftag');
  if(old){ clearTimeout(old._t); band.removeChild(old); pool.push(old); }
  var t = pool.pop() || document.createElement('i');
  t.className = 'dkb-ftag ' + (up ? 'up' : 'dn');
  t.textContent = (up ? '▲' : '▼') + txt;
  band.appendChild(t);
  t._t = setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); if(pool.length < 3 && pool.indexOf(t) < 0) pool.push(t); }, 950);
}
async function moveSteps(pi, n){
  var p = G && G.players[pi]; if(!p) return;
  n = Math.max(0, Math.floor(+n || 0));
  if(n > 0) destPin = (p.pos + n) % 32;
  try{
    var plan = dkbStepDurs(p.pos, n), g0 = G;
    var spd = (typeof SPEED === 'number' && SPEED > 0) ? SPEED : 1, oSum = 0, oN = 0;
    var c0 = tileCenter(p.pos); dkbCamTo(c0.x, c0.y, 1.45);
    for(var k = 0; k < n; k++){
      if(G !== g0) break;
      var from = tileCenter(p.pos), np = (p.pos + 1) % 32;
      p.pos = np;
      var to = tileCenter(np);
      dkbCamTo(to.x, to.y, 1.45);
      if(np === 0) p.laps++;
      var d = plan.d[k];
      if(d < 0){ d = -d; dkbPassStart(pi); }
      /* hop はコマの境目で始まり・終わるので1マスごとに少し遅れる。それまでの平均の遅れを引いて頼む（1マスの見た目の時間と合計を守る） */
      var dd = Math.max(Math.round(d * 0.6), Math.round(d - Math.min(12, oN ? oSum / oN : 0)));   // 1回の詰まりで縮めすぎない
      var th = performance.now();
      await hop(p, from, to, dd);
      oSum += Math.max(0, (performance.now() - th) / spd - dd); oN++;
    }
    // 催眠の香水：同じマスに相手がいたら
    if(G === g0 && G.players.some(function(q, j){ return j !== pi && !q.out && q.pos === p.pos; })) await pendFire(pi, 'onSameTile');
    await wait(Math.max(0, Math.min(180, DKB_MOVE.all - plan.tot)));
  } finally { destPin = null; }
}

/* ══════════ 決着（文字は canvas 版だけ。DOM は閃光・噴煙だけ） ══════════ */
function finish(pi, reason, col){
  if(G.over && G.winner >= 0) return true;
  var mono = String(reason).indexOf('独占') >= 0;
  if(mono) jingle('mono');
  var l3 = mono ? '独占ボーナス x' + (G.winX || 1) + '倍' : G.players[pi].name + ' WIN!';
  showCelebrate(['おめでとうございます！', reason, l3], 2000);      // 決着カットイン 約2.0秒（J46）
  if(G.map && G.map.deco === 'ice') dkbIceShards();
  else addFx('confetti', SW / 2, 0, 3000, null, null, false, { scr: true, w: SW, h: SH, n: 110 });
  bgm('win');
  news('🏆 ' + G.players[pi].name + ' が「' + reason + '」で勝利！');
  G.over = true; G.winner = pi; G.winReason = reason; G.running = false;
  try{ dkbHideTransient(); }catch(e){ dkbErr('finish', e); }
  celebrate(pi, reason, col);
  return true;
}
/* 氷の洞窟は紙吹雪のかわりに氷片（共有 canvas の宝石の粒＋白い星） */
function dkbIceShards(){
  if(dkbFast() || DKFX.reduced) return;
  var pts = [[260, 180], [1340, 170], [560, 120], [1060, 130], [360, 420], [1250, 430], [800, 90]];
  pts.forEach(function(xy, k){
    setTimeout(function(){
      try{
        fxBurst({ x: xy[0], y: xy[1] }, { kind: 'gem', n: 14, power: 1.25, gravity: 0.0024 });
        fxBurst({ x: xy[0], y: xy[1] }, { kind: 'star', n: 6, power: 0.8 });
      }catch(e){ dkbErr('ice', e); }
    }, k * 170);
  });
}
/* 決着：カットイン 2.0秒（×SPEED）→ 0.15秒で WIN パネル（showResult）。本家は 約2.0秒→0.2秒（J46） */
async function celebrate(pi, reason, col){
  var g0 = G, t0 = performance.now();
  try{ SFX.win(); }catch(e){}
  var el = document.getElementById('celebrate'), stg = document.getElementById('stage');
  if(el) el.classList.add('on');
  if(stg) stg.classList.add('dkb-cel');
  var f = document.getElementById('flash');
  if(f){ if(f.classList.contains('go')) dkbReplay(f); else f.classList.add('go'); }
  camShake(16);
  var ice = G.map && G.map.deco === 'ice';
  for(var k = 0; k < 9; k++) addFx('steam', 210 + k * 150, 760, 1800);
  for(var j = 0; j < 6; j++){
    var x = 260 + dkbRnd() * 1080, y = 300 + dkbRnd() * 320;
    addFx('steam', x, y + 150, 1500);
    addFx('spark', x, y, 900, ice ? '#BFF2FF' : (col || '#FFD24D'));
    addFx('ring', x, y + 60, 700, ice ? '#E6FAFF' : '#FFF3C0');
    await wait(150);
  }
  var rest = 2000 * SPEED - (performance.now() - t0);
  if(rest > 0) await new Promise(function(r){ setTimeout(r, rest); });
  if(el) el.classList.remove('on');
  await wait(150);
  if(stg) stg.classList.remove('dkb-cel');
  if(G === g0 && !(g0 && g0.dkbQuit)) showResult();
}

/* ══════════ ペンダントの発動（効果は 4-game.js の写し。見せ方だけ持ち主の HUD の横へ） ══════════ */
async function pendFire(pi, trg, arg){
  var p = G.players[pi];
  var it = pendOf(pi, trg);
  if(!it) return false;
  p.pboost = p.pboost || {};
  var boost = p.pboost[it.id] || 0;
  var rate = Math.min(0.95, it.p + boost);
  var hit = Math.random() < rate;
  var pct = Math.round(rate * 100), add = Math.round(boost * 100);
  var rar = PEND_RAR[it.rar] || { nm: 'A', c: '#8FB2D8' };
  if(!hit){
    p.pboost[it.id] = boost + 0.02;
    if(p.kind !== 'cpu') dkbPanel(pi, it.ic, 'スキル未発動', '2%成長します', { miss: true, rar: rar.nm, ms: 1900 });
    return false;
  }
  p.pboost[it.id] = 0;
  SFX.skill(); camShake(7);
  dkbPanel(pi, it.ic, rar.nm + 'ペンダント発動！', it.nm + '　' + pct + '%' + (add ? '（+' + add + '%）' : ''), { rar: rar.nm, ms: 2400 });
  var c = p.render || tileCenter(p.pos);
  /* 光の色は等級ではなく属性（WP16a の dkpElem。c=[明,中,暗]）。借りている id ではなく、そのペンダント自身（pid）で引く */
  var ec = rar.c;
  try{ if(typeof dkpElem === 'function'){ var el = dkpElem(it.pid || it.id); if(el && el.c && el.c[0]) ec = el.c[0]; } }catch(e){}
  addFx('ring', c.x, c.y, 700, ec);
  addFx('spark', c.x, c.y - 30, 900, ec);

  /* ── 効果（C36：種類は it.eff で分ける。古い p1〜p8 は DKB_PEND_EFF が既定を当てる。
        知らない種類は通知だけ出して盤は変えない＝新しいペンダントが増えても落ちない）
        eff が「借りているペンダントの id」（WP12a の p9〜p16 は eff:'p8' のように書く）の時は、
        先に DKB_PEND_EFF で本当の種類へ直す。直さないと種類が見つからず通知だけで終わる ── */
  var eff = DKB_PEND_EFF[it.eff] || it.eff || DKB_PEND_EFF[it.id] || '', amt;
  if(eff === 'pull'){                       // 同じ辺の相手を自分のマスへ引き寄せる
    var side = Math.floor(p.pos / 8);
    for(var j = 0; j < G.players.length; j++){
      var q = G.players[j];
      if(j === pi || q.out || q.jail > 0) continue;
      if(Math.floor(q.pos / 8) === side){
        await band(it.nm + '！', G.players[j].name + ' を引き寄せました', 1300);
        await jumpTo(j, p.pos);
        break;
      }
    }
  }
  if(eff === 'bind' && arg && arg.tile !== undefined){   // 束縛：次の移動でもう一度 通行料
    var t2 = G.tiles[arg.tile];
    if(t2) t2.bind = 1;
    await band(it.nm + '！', '次の移動でもう一度 通行料を取ります', 1300);
  }
  if(eff === 'grow'){                       // 自分の別の都市がもう1段
    var mine = G.tiles.map(function(t, i){ return { t: t, i: i }; })
      .filter(function(o){ return o.t.type === 'city' && o.t.owner === pi && o.t.lv < 3 && o.i !== (arg && arg.tile); });
    if(mine.length){
      var o = mine[(Math.random() * mine.length) | 0];
      o.t.lv++;
      await growAnim(o.i);
      dkbPanel(pi, it.ic, it.nm, o.t.name + ' が1段育ちました', { ms: 2200 });
    }
  }
  if(eff === 'toStart'){                    // スタートへ移動して給料
    var n = G.tiles.filter(function(t){ return t.type === 'city' && t.owner === pi && t.lv > 0; }).length;
    if(n >= 3){
      var lp = p.laps;
      await jumpTo(pi, 0, { salary: false });
      if(p.laps === lp) p.laps++;            // jumpTo がスタートをまたいだ数を足していない時だけ（C31）
      salary(pi);
    }
  }
  if(eff === 'jumpBest' && arg && arg.pick){ // 選ばずに一番得なマスへ
    var d = aiPickTravel(pi);
    if(d >= 0){ await jumpTo(pi, d); return 'jumped'; }
  }
  if(eff === 'jumpMine'){                   // 同じ辺の自分の別の都市へ
    var side6 = Math.floor(p.pos / 8), same = [];
    for(var k = 0; k < 8; k++){ var i6 = side6 * 8 + k;
      if(i6 !== p.pos && G.tiles[i6].type === 'city' && G.tiles[i6].owner === pi) same.push(i6); }
    if(same.length){ await jumpTo(pi, same[(Math.random() * same.length) | 0]); return 'jumped'; }
  }
  if(eff === 'steal'){                      // 同じマスの相手のマーブルを奪う
    var other = G.players.findIndex(function(q2, j2){ return j2 !== pi && !q2.out && q2.pos === p.pos; });
    if(other >= 0){
      amt = Math.round(G.players[other].cash * (it.v > 0 ? it.v : 0.20));
      if(amt > 0){ give(other, -amt); give(pi, amt);
        await band(it.nm + '！', G.players[other].name + ' から ' + yen(amt) + ' を奪いました', 1400); }
    }
  }
  if(eff === 'cash'){                       // 臨時収入（開始マーブルの割合）
    amt = Math.round((cfg.cash || 10000000) * (it.v > 0 ? it.v : 0.1));
    dkbEnsureG(); G.pot = (G.pot || 0) + amt; give(pi, amt);
    dkNotify(pi, it.ic, it.nm, yen(amt) + ' を受け取りました', { ms: 1800 });
  }
  if(eff === 'freeToll'){ p.freeToll = (p.freeToll | 0) + 1; dkNotify(pi, it.ic, it.nm, '次の通行料が1回だけ無料になります', { ms: 1800 }); }
  if(eff === 'halfToll'){ p.halfToll = (p.halfToll | 0) + 1; dkNotify(pi, it.ic, it.nm, '次の通行料が1回だけ半額になります', { ms: 1800 }); }
  if(eff === 'halfBuild'){ p.halfBuild = (p.halfBuild | 0) + 1; dkNotify(pi, it.ic, it.nm, '次の建設費用が半額になります', { ms: 1800 }); }
  if(eff === 'halfBuyout'){ p.halfBuyout = (p.halfBuyout | 0) + 1; dkNotify(pi, it.ic, it.nm, '次の買収費用が半額になります', { ms: 1800 }); }
  if(eff === 'tollUp'){ p.tollUp = (p.tollUp | 0) + 1; dkNotify(pi, it.ic, it.nm, '自分の都市の通行料が上がります', { ms: 1800 }); }
  if(eff === 'gouge'){ p.gouge = (p.gouge | 0) + 1; dkNotify(pi, it.ic, it.nm, '次に受け取る通行料が2倍になります', { ms: 1800 }); }
  if(eff === 'shield' || eff === 'escape' || eff === 'angel' || eff === 'coupon'){
    var fc = eff === 'angel' ? 'angel' : eff === 'coupon' ? 'coupon' : eff;   // C08：持てるフォーチュンカードは1枚
    if(!p.fcard){ p.fcard = fc; try{ dkbFcardSync(); }catch(e){} }
    dkNotify(pi, it.ic, it.nm, (DKB_FCARD[fc] ? DKB_FCARD[fc].nm : 'フォーチュンカード') + ' を受け取りました', { ms: 1800 });
  }
  return true;
}

/* ══════════ リーチ（新しいものだけ中央に出す。残り都市は drawDestPin が毎フレーム描く） ══════════ */
function dkShowReach(list){
  if(!G) return;
  dkbEnsureG();
  var ok = (Array.isArray(list) ? list : []).filter(function(o){
    return o && typeof o.pi === 'number' && G.players[o.pi] && Array.isArray(o.tiles);
  });
  var key = function(o){ return o.pi + '|' + (o.kind || '') + '|' + (o.label || ''); };
  var prev = G.reachTiles || [];
  var fresh = ok.filter(function(o){ return !prev.some(function(q){ return key(q) === key(o); }); });
  G.reachTiles = ok;
  if(fresh.length){
    /* 自分（と味方）のリーチを先に見せる */
    var me = dkbMe(), first = fresh[0];
    for(var k = 0; k < fresh.length; k++) if(fresh[k].pi === me || dkbAlly(me, fresh[k].pi)){ first = fresh[k]; break; }
    dkbReachCut(first);
    for(var j = 0; j < fresh.length; j++){
      var fp = G.players[fresh[j].pi];
      if(fp && fp.kind === 'cpu'){ dkbCpuEmote(fresh[j].pi, 'reach'); break; }   // 同じ出来事では1人だけ
    }
  }
}
function dkbReachLabel(o){
  if(o.label) return String(o.label).replace(/リーチ$/, '');
  return o.kind === 'line' ? 'ライン独占' : o.kind === 'tour' ? '観光地独占' : 'トリプル独占';
}
/* 自分（ともだちモードは手番の人間・チーム戦は味方も）のリーチは緑の FORTUNE!、相手は赤の WARNING（J49・WP5#4） */
function dkbReachCut(o){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = DKB_S.reach; if(!el) return;
  var p = G.players[o.pi], me = dkbMe(), mine = (o.pi === me) || dkbAlly(me, o.pi);
  el.querySelector('.dkb-rband span').textContent = (p ? p.name : '') + ' があと1マス！';
  el.querySelector('.dkb-rband b').textContent = dkbReachLabel(o);
  el.querySelector('.dkb-rband em').textContent = mine ? 'FORTUNE!' : 'WARNING';
  el.classList.toggle('dkb-warn', !mine);
  if(el.classList.contains('on')) dkbReplay(el, true); else el.classList.add('on');
  try{ SFX.warn(); }catch(e){}
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('on'); }, 1800 * SPEED);
}

/* ══════════ 上のテロップ（試合の外）：実在の人名・架空の他人の当たりは出さない ══════════ */
function marquee(){
  var out = [];
  try{ var w = thisWeek(); if(w) out.push('今週のイベント「' + w.nm + '」　' + w.ds); }catch(e){}
  try{
    if(typeof SV === 'object' && SV){
      var st = SV.stat || {};
      out.push('あなたの通算成績　' + (st.plays || SV.plays || 0) + '戦 ' + (st.wins || SV.wins || 0) + '勝');
    }
  }catch(e){}
  try{ (TIPS || []).forEach(function(t){ out.push('ヒント：' + t); }); }catch(e){}
  if(!out.length) out.push('ダイスキングダムへようこそ！');
  var s = out[DKB_S.mq % out.length];
  DKB_S.mq++;
  return s;
}

/* ══════════ 札束の山（盤のキャッシュに描く。席の HUD のそば） ══════════ */
/* 束は盤の向き（p,q）に寝かせた直方体。下の段から埋めて、上ほど少ない山にする */
/* 3×2 のマスに、奥の列ほど高く積む（段々の山）。[p, q, 段, 通し番号] */
var DKB_PILE = (function(){
  var s = [[0,0,0],[1,0,0],[2,0,0],[0,1,0],[1,1,0],[2,1,0],
           [0,0,1],[1,0,1],[2,0,1],[1,1,1],
           [1,0,2],[0,0,2],[2,0,2],
           [1,0,3],
           [0,1,1],[2,1,1],
           [1,1,2],
           [1,0,4]];
  s.forEach(function(x, k){ x.push(k); });
  return s;
})();
/* 山を描く（原点が山の中心）。base があれば持ち主の色の台座を敷く */
function dkbPileDraw(ctx, n, band, base){
  var Lp = 47, Wp = 29;
  if(base){
    ctx.save();
    ctx.transform(KX, KY, -KX, KY, 0, 0);
    var x0 = -1.5 * Lp - 7, y0 = -Wp - 7, w = 3 * Lp + 14, h = 2 * Wp + 14;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 3, y0 + 4, w, h);
    var g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
    g.addColorStop(0, shade(base, 0.25)); g.addColorStop(1, shade(base, -0.35));
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = '#E8B23A'; ctx.lineWidth = 2.2; ctx.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
    ctx.strokeStyle = 'rgba(255,240,190,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);
    ctx.restore();
  }
  DKB_PILE.slice(0, n).sort(function(a, b){
    return ((a[0] * Lp + a[1] * Wp) - (b[0] * Lp + b[1] * Wp)) || (a[2] - b[2]);
  }).forEach(function(s){
    var bp = (s[0] - 1.5) * Lp + 1.5, bq = (s[1] - 1) * Wp + 1.5;
    dkbBundle(ctx, KX * (bp - bq), KY * (bp + bq), band, s[2], s[3]);
  });
}
function dkbBundle(ctx, ox, oy, col, lvl, idx){
  var L = 44, W = 26, H = 15;
  ctx.save();
  ctx.translate(ox, oy - lvl * H);
  /* 側面（手前の2面） */
  var P = function(p, q){ return { x: KX * (p - q), y: KY * (p + q) }; };
  var a = P(L, 0), b = P(L, W), c = P(0, W);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y + H); ctx.lineTo(a.x, a.y + H); ctx.closePath();
  ctx.fillStyle = '#AEB5BE'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y + H); ctx.lineTo(c.x, c.y + H); ctx.closePath();
  ctx.fillStyle = '#D6DBE1'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.8;
  for(var k = 2; k < H; k += 2.4){
    ctx.beginPath(); ctx.moveTo(c.x, c.y + k); ctx.lineTo(b.x, b.y + k); ctx.lineTo(a.x, a.y + k); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(40,50,64,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(c.x, c.y + H); ctx.lineTo(b.x, b.y + H); ctx.lineTo(a.x, a.y + H); ctx.stroke();
  /* 上の面（紙幣の絵） */
  ctx.save();
  ctx.transform(KX, KY, -KX, KY, 0, 0);
  var g = ctx.createLinearGradient(0, 0, L, W);
  g.addColorStop(0, '#FFFFFB'); g.addColorStop(1, '#E4EAE0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, L, W);
  ctx.strokeStyle = 'rgba(60,70,60,.45)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, L - 1, W - 1);
  ctx.strokeStyle = 'rgba(96,130,96,.55)'; ctx.lineWidth = 1.1; ctx.strokeRect(4, 3.5, L - 8, W - 7);
  ctx.fillStyle = 'rgba(96,140,100,.35)';
  ctx.beginPath(); ctx.ellipse(L * 0.5, W * 0.5, 6.5, 5, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = 'rgba(120,150,120,.5)'; ctx.fillRect(L - 12, 6, 5, 3); ctx.fillRect(7, W - 9, 5, 3);
  /* 帯（持ち主の色） */
  ctx.fillStyle = col; ctx.fillRect(L * 0.5 - 4, 0, 8, W);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(L * 0.5 - 4, 0, 2, W);
  ctx.restore();
  /* 帯が側面にも回る */
  var m0 = P(L * 0.5 - 4, W), m1 = P(L * 0.5 + 4, W);
  ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.lineTo(m1.x, m1.y + H); ctx.lineTo(m0.x, m0.y + H); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  if(idx % 4 === 1){ ctx.fillStyle = 'rgba(255,240,190,.9)'; ctx.beginPath(); ctx.arc(P(L * 0.8, W * 0.3).x, P(L * 0.8, W * 0.3).y, 1.6, 0, 6.283); ctx.fill(); }
  ctx.restore();
}
function dkbGoldCard(ctx, ox, oy, k){
  ctx.save();
  ctx.translate(ox, oy);
  ctx.transform(KX, KY, -KX, KY, 0, 0);
  ctx.rotate(-0.12 + k * 0.09);
  var w = 22, h = 30;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(2, 2, w, h);
  var g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#FFF6C8'); g.addColorStop(0.35, '#F2C230'); g.addColorStop(0.7, '#C88A12'); g.addColorStop(1, '#FFE27A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#6B4408'; ctx.lineWidth = 1.2; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.fillStyle = '#8A5A08';
  ctx.beginPath();
  for(var i = 0; i < 10; i++){
    var r = (i % 2) ? 3.2 : 7, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* 金のカードの数（持ち物＋フォーチュンカード。4枚まで） */
function dkbCardsOf(p){ return Math.min(4, ((p && p.items) || []).length + ((p && p.fcard) ? 1 : 0)); }
/* 1人ぶんの山を小さな offscreen に作り置き（束の数・カードの数・色が変わった時だけ描き直す。C16） */
function dkbStackCv(i, p){
  var n = dkbBundles(p.cash), k = dkbCardsOf(p), key = n + '|' + k + '|' + PCOL[i];
  var c = DKB_S.stk[i];
  if(c && c.key === key) return c;
  var S = DKB_STK, cv = (c && c.cv) || document.createElement('canvas');
  var W = Math.round(S.w * S.s), H = Math.round(S.h * S.s);
  if(cv.width !== W) cv.width = W;
  if(cv.height !== H) cv.height = H;
  var g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  g.setTransform(S.s, 0, 0, S.s, S.ox * S.s, S.oy * S.s);
  /* 落ち影 */
  var sh = g.createRadialGradient(0, 14, 4, 0, 14, 92);
  sh.addColorStop(0, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.beginPath(); g.ellipse(0, 14, 92, 46, 0, 0, 6.283); g.fill();
  if(n > 0) dkbPileDraw(g, n, '#EEE4C6', PCOL[i]);
  for(var j = 0; j < k; j++) dkbGoldCard(g, 70 + j * 16, -4 + j * 9, j);
  c = DKB_S.stk[i] = { key: key, cv: cv };
  return c;
}
function drawStacks(ctx, G, T){
  if(!G || !G.players) return;
  var S = DKB_STK;
  G.players.forEach(function(p, i){
    if(p.out) return;
    var xy = dkbStackXY(i), c = dkbStackCv(i, p);
    ctx.drawImage(c.cv, xy.x - S.ox, xy.y - S.oy, S.w, S.h);
  });
}

/* ══════════ 盤の上の一時マーカー（行き先ピン・リーチの残り都市・名前札の重なり） ══════════ */
function drawDestPin(ctx, T){
  try{ dkbCamClamp(); dkbFixFloats(); }catch(e){ dkbErr('cam', e); }
  if(DKB_S.lake.lv > 0.01){ DKB_S.deferT = T; return; }   // 湖の演出中は drawDice のラッパで描く
  dkbMarks(ctx, T);
}
function dkbMarks(ctx, T){
  if(!G) return;
  if(destPin !== null && destPin !== undefined){
    var c = tileCenter(destPin);
    ctx.save(); ctx.translate(c.x, c.y - 6); dvPin(ctx, '#7DE08A', T); ctx.restore();
    ctx.save(); ctx.translate(c.x, c.y - 30 - Math.sin(T / 380) * 1.8);
    dkbStar(ctx, 0, 0, 5.2, '#FFFFFF'); ctx.restore();
  }
  if(G.reachTiles && G.reachTiles.length){ try{ dkbReachMarks(ctx, T); }catch(e){ dkbErr('reach', e); } }
  try{ dkbNameStacks(ctx); }catch(e){ dkbErr('names', e); }
}
function dkbStar(ctx, x, y, r, col){
  ctx.beginPath();
  for(var i = 0; i < 10; i++){
    var rr = (i % 2) ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
/* 残り都市：橙の「！」と「○○独占残り都市」の札 */
function dkbReachMarks(ctx, T){
  var seen = {};
  G.reachTiles.forEach(function(o){
    var label = dkbReachLabel(o) + '残り都市';
    (o.tiles || []).forEach(function(i){
      if(typeof i !== 'number' || i < 0 || i > 31 || seen[i]) return;
      seen[i] = 1;
      var c = tileCenter(i), bob = Math.sin(T / 260 + i) * 4, y = c.y - 58 + bob;
      ctx.save();
      ctx.translate(c.x, y);
      /* ！の三角 */
      var pu = 0.6 + 0.4 * Math.sin(T / 180 + i);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var gl = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
      gl.addColorStop(0, 'rgba(255,170,40,' + (0.55 * pu).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,170,40,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(19, 13); ctx.lineTo(-19, 13); ctx.closePath();
      var g = ctx.createLinearGradient(0, -20, 0, 13); g.addColorStop(0, '#FFD27A'); g.addColorStop(1, '#F07A12');
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
      ctx.fillStyle = '#5A1E00'; ctx.font = '900 20px "Noto Sans JP", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 2);
      /* 札 */
      ctx.font = '900 13px "Noto Sans JP", sans-serif';
      var w = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(40,16,2,.86)';
      if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w / 2, -44, w, 20, 7); ctx.fill(); } else ctx.fillRect(-w / 2, -44, w, 20);
      ctx.strokeStyle = '#F29A2A'; ctx.lineWidth = 1.5;
      if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-w / 2, -44, w, 20, 7); ctx.stroke(); }
      ctx.fillStyle = '#FFE0A8'; ctx.fillText(label, 0, -33);
      ctx.restore();
    });
  });
}
/* 同じマスに2人以上いる時、名前札を縦に並べ直す（元の札の上に不透明な札をかぶせる）。
   WP10 の drawToken が縦並びを描く時（drawToken.dkkTags===true）はかぶせ描きしない（C17） */
function dkbNameStacks(ctx){
  if(typeof drawToken === 'function' && drawToken.dkkTags === true) return;
  var by = {};
  G.players.forEach(function(p, i){ if(p.out || p.moving) return; (by[p.pos] = by[p.pos] || []).push(i); });
  Object.keys(by).forEach(function(k){
    var arr = by[k]; if(arr.length < 2) return;
    var c = tileCenter(+k);
    ctx.save();
    ctx.font = '900 13px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var lo = 1e9, hi = -1e9, maxw = 0;
    arr.forEach(function(pi, j){
      var w = ctx.measureText(G.players[pi].name).width + 14, off = (j - (arr.length - 1) / 2) * 26;
      lo = Math.min(lo, off - w / 2); hi = Math.max(hi, off + w / 2); maxw = Math.max(maxw, w);
    });
    var W = Math.max(hi - lo + 6, maxw + 26), rowH = 21, H = arr.length * rowH + 6;
    var x0 = c.x + (lo + hi) / 2 - W / 2, bottom = c.y + 8 - 78 + 11 + 2, y0 = bottom - H;
    ctx.fillStyle = 'rgba(10,8,4,.92)';
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x0, y0, W, H, 8); ctx.fill(); } else ctx.fillRect(x0, y0, W, H);
    ctx.strokeStyle = 'rgba(214,166,64,.9)'; ctx.lineWidth = 1.5;
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x0, y0, W, H, 8); ctx.stroke(); }
    arr.forEach(function(pi, j){
      var y = y0 + 3 + rowH * (arr.length - 1 - j) + rowH / 2;
      ctx.fillStyle = PCOL[pi]; ctx.beginPath(); ctx.arc(x0 + 11, y, 5, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(G.players[pi].name, x0 + 21, y + 0.5);
    });
    ctx.restore();
  });
}
/* カメラが卓の外（背景の継ぎ目）を映さないよう、寄った時の行き先を卓の内側（x 28〜1572・y 16〜884）に収める（WP6#5） */
function dkbCamClamp(){
  if(!cam || !(cam.tz > 1.001)) return;
  var hw = SW / 2 / cam.tz, hh = SH / 2 / cam.tz;
  cam.tx = Math.max(28 + hw, Math.min(1572 - hw, cam.tx));
  cam.ty = Math.max(16 + hh, Math.min(884 - hh, cam.ty));
}
/* 浮き数字（addFloat）が中央プレートの裏・画面の上端に隠れないように、また同じ所に2つ重ならないようにずらす */
function dkbFixFloats(){
  if(!fxList.length) return;
  var pr = dkbPlateRect(), z = cam.tz || 1, lo = Math.max(0, fxList.length - 16), i, k, f, o;
  var w2s = function(q){ return { x: SW / 2 + (q.x - cam.tx) * z, y: SH / 2 + (q.y - cam.ty) * z }; };
  for(i = lo; i < fxList.length; i++){
    f = fxList[i];
    if(!f || f.kind !== 'num' || f.dkbFix) continue;
    f.dkbFix = 1;
    var s = w2s(f), ny = s.y;
    if(pr && s.x > pr.l - 230 && s.x < pr.r + 230 && s.y > pr.t - 90 && s.y < pr.b + 60) ny = pr.b + 96;
    if(ny < 130) ny = 130;
    for(k = lo; k < fxList.length; k++){
      o = fxList[k];
      if(!o || o === f || o.kind !== 'num' || !o.dkbFix || o.t > 900) continue;
      var so = w2s(o);
      if(Math.abs(so.x - s.x) < 170 && Math.abs(so.y - ny) < 52) ny = so.y + 56;
    }
    if(ny !== s.y) f.y = cam.ty + (ny - SH / 2) / z;
  }
}

/* ══════════ 湖（盤の中央）：ふだんの景色（キャッシュ）と、振っている間だけ動く層 ══════════ */
function dkbLakePts(){
  if(!DKB_S.lakePts) DKB_S.lakePts = [proj(TD, TD), proj(S - TD, TD), proj(S - TD, S - TD), proj(TD, S - TD)];
  return DKB_S.lakePts;
}
function dkbPoly(ctx, pts){
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for(var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}
function dkbH(i){ return dvFxRnd(i * 1.37 + 0.71); }
/* 湖の中の点（u,v は 0..1） */
function dkbLakeUV(u, v){
  var p = dkbLakePts();
  var ax = p[0].x + (p[1].x - p[0].x) * u, ay = p[0].y + (p[1].y - p[0].y) * u;
  var bx = p[3].x + (p[2].x - p[3].x) * u, by = p[3].y + (p[2].y - p[3].y) * u;
  return { x: ax + (bx - ax) * v, y: ay + (by - ay) * v };
}
/* 自作の紋章「DICE KINGDOM」（盾・王冠・サイコロ2つ・月桂樹・リボン）を湖の面に寝かせて彫る */
function dkbCrest(ctx, st){
  ctx.save();
  ctx.translate(BCX, BCY + 4);
  ctx.scale(1, KSQ * 1.02);
  var pass = function(dx, dy, col, stroke){
    ctx.save(); ctx.translate(dx, dy);
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineJoin = 'round';
    /* 月桂樹 */
    for(var sgn = -1; sgn <= 1; sgn += 2){
      for(var k = 0; k < 7; k++){
        var a = Math.PI * (0.62 + k * 0.105), r = 128;
        var x = sgn * Math.cos(a) * r * -1, y = Math.sin(a) * r * 0.9 - 6;
        ctx.save(); ctx.translate(x, y); ctx.rotate(sgn * (a - Math.PI / 2) + (sgn < 0 ? Math.PI : 0) * 0);
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 15, sgn * (0.9 - k * 0.12), 0, 6.283); stroke ? ctx.stroke() : ctx.fill();
        ctx.restore();
      }
    }
    /* 盾 */
    ctx.beginPath();
    ctx.moveTo(-74, -70); ctx.lineTo(74, -70); ctx.lineTo(74, 6);
    ctx.bezierCurveTo(74, 52, 30, 78, 0, 96); ctx.bezierCurveTo(-30, 78, -74, 52, -74, 6); ctx.closePath();
    ctx.lineWidth = 7; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-58, -56); ctx.lineTo(58, -56); ctx.lineTo(58, 4);
    ctx.bezierCurveTo(58, 40, 24, 62, 0, 76); ctx.bezierCurveTo(-24, 62, -58, 40, -58, 4); ctx.closePath();
    ctx.lineWidth = 2.5; ctx.stroke();
    /* 王冠 */
    ctx.beginPath();
    ctx.moveTo(-46, -78); ctx.lineTo(-52, -118); ctx.lineTo(-26, -96); ctx.lineTo(0, -128); ctx.lineTo(26, -96);
    ctx.lineTo(52, -118); ctx.lineTo(46, -78); ctx.closePath();
    stroke ? (ctx.lineWidth = 3, ctx.stroke()) : ctx.fill();
    [-52, 0, 52].forEach(function(x, i){ ctx.beginPath(); ctx.arc(x, i === 1 ? -132 : -122, 6, 0, 6.283); stroke ? ctx.stroke() : ctx.fill(); });
    /* サイコロ2つ */
    [[-24, -8, -0.28, 5], [26, 18, 0.22, 3]].forEach(function(d){
      ctx.save(); ctx.translate(d[0], d[1]); ctx.rotate(d[2]);
      if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(-22, -22, 44, 44, 9); } else { ctx.beginPath(); ctx.rect(-22, -22, 44, 44); }
      ctx.lineWidth = 3.5; ctx.stroke();
      var pip = d[3] === 5 ? [[-11,-11],[11,-11],[0,0],[-11,11],[11,11]] : [[-11,-11],[0,0],[11,11]];
      pip.forEach(function(q){ ctx.beginPath(); ctx.arc(q[0], q[1], 4.2, 0, 6.283); ctx.fill(); });
      ctx.restore();
    });
    /* リボンと文字 */
    ctx.beginPath();
    ctx.moveTo(-150, 88); ctx.lineTo(150, 88); ctx.lineTo(136, 108); ctx.lineTo(150, 128); ctx.lineTo(-150, 128);
    ctx.lineTo(-136, 108); ctx.closePath(); ctx.lineWidth = 3; ctx.stroke();
    ctx.font = '400 30px "Bungee","Mochiy Pop One",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DICE KINGDOM', 0, 110);
    ctx.restore();
  };
  pass(2, 2.5, st.lo, false);
  pass(-1, -1.2, st.hi, true);
  pass(0, 0, st.fill, false);
  ctx.restore();
}
function dkbLakeSkin(ctx, map, T){
  var deco = map && map.deco, pts = dkbLakePts();
  var cx = BCX, cy = BCY, i, k;
  ctx.save();
  dkbPoly(ctx, pts); ctx.clip();
  var fillR = function(stops){
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.66);
    var g = ctx.createRadialGradient(0, -10, 10, 0, 0, 470);
    stops.forEach(function(s){ g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g; ctx.fillRect(-700, -700, 1400, 1400);
    ctx.restore();
  };
  var rim = function(col){
    [[44, 0.16], [24, 0.2], [8, 0.32]].forEach(function(w){
      ctx.lineWidth = w[0]; ctx.strokeStyle = col.replace('A', w[1]); dkbPoly(ctx, pts); ctx.stroke();
    });
  };
  if(deco === 'world'){
    /* 乾いた砂の窪地 */
    fillR([[0, '#F4E6BE'], [0.5, '#E6CC94'], [0.82, '#CFAE72'], [1, '#A98752']]);
    ctx.lineCap = 'round';
    for(k = 1; k <= 8; k++){
      ctx.save(); ctx.translate(cx, cy + 8); ctx.scale(1, 0.62);
      var rr = 34 + k * 46;
      ctx.beginPath();
      for(i = 0; i <= 64; i++){
        var a = i / 64 * 6.283, w = Math.sin(a * 5 + k * 1.7) * 4;
        var x = Math.cos(a) * (rr + w), y = Math.sin(a) * (rr + w);
        if(i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(150,108,58,.2)'; ctx.stroke();
      ctx.translate(0, -3); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,246,222,.26)'; ctx.stroke();
      ctx.restore();
    }
    for(i = 0; i < 34; i++){
      var pp = dkbLakeUV(0.12 + dkbH(i) * 0.76, 0.12 + dkbH(i + 50) * 0.76);
      ctx.fillStyle = (i % 3) ? 'rgba(150,128,96,.55)' : 'rgba(250,240,214,.7)';
      ctx.beginPath(); ctx.ellipse(pp.x, pp.y, 2 + dkbH(i + 90) * 3.5, 1.3 + dkbH(i + 91) * 2, 0, 0, 6.283); ctx.fill();
    }
    rim('rgba(92,62,28,A)');
    dkbCrest(ctx, { fill: 'rgba(134,94,46,.16)', hi: 'rgba(255,248,226,.3)', lo: 'rgba(96,64,28,.26)' });
  } else if(deco === 'onsen'){
    /* 湯の湖（乳白の翡翠色）と縁の岩 */
    fillR([[0, '#EAFCF5'], [0.45, '#B2EADA'], [0.8, '#6CC6AE'], [1, '#3C9884']]);
    for(k = 0; k < 6; k++){
      ctx.save(); ctx.translate(cx + (dkbH(k) - 0.5) * 300, cy + (dkbH(k + 9) - 0.5) * 160); ctx.scale(1, 0.6);
      var gw = ctx.createRadialGradient(0, 0, 0, 0, 0, 70 + dkbH(k + 4) * 50);
      gw.addColorStop(0, 'rgba(255,255,255,.34)'); gw.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 6.283); ctx.fill(); ctx.restore();
    }
    rim('rgba(20,80,70,A)');
    for(var e2 = 0; e2 < 4; e2++){
      var A = pts[e2], B = pts[(e2 + 1) % 4];
      for(k = 0; k < 10; k++){
        var t = (k + 0.5) / 10 + (dkbH(e2 * 20 + k) - 0.5) * 0.05;
        var px = A.x + (B.x - A.x) * t, py = A.y + (B.y - A.y) * t;
        px += (cx - px) * 0.035; py += (cy - py) * 0.07;
        var rx = 13 + dkbH(e2 * 31 + k) * 11, ry = rx * 0.6;
        var gs = ctx.createRadialGradient(px - rx * 0.3, py - ry * 0.5, 1, px, py, rx);
        gs.addColorStop(0, '#D8D4CA'); gs.addColorStop(0.6, '#9A968C'); gs.addColorStop(1, '#5E5A52');
        ctx.fillStyle = gs; ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(40,36,30,.35)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    dkbCrest(ctx, { fill: 'rgba(255,255,255,.18)', hi: 'rgba(255,255,255,.32)', lo: 'rgba(26,96,82,.24)' });
  } else {
    /* 氷の湖（ひび・霜） */
    fillR([[0, '#EAFAFF'], [0.42, '#BCE8F6'], [0.80, '#7FC4DE'], [1, '#4A97B9']]);
    for(k = 0; k < 12; k++){
      var fp = dkbLakeUV(0.15 + dkbH(k + 200) * 0.7, 0.15 + dkbH(k + 230) * 0.7);
      ctx.save(); ctx.translate(fp.x, fp.y); ctx.scale(1, 0.6);
      var gf = ctx.createRadialGradient(0, 0, 0, 0, 0, 40 + dkbH(k + 260) * 60);
      gf.addColorStop(0, 'rgba(255,255,255,.5)'); gf.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(0, 0, 100, 0, 6.283); ctx.fill(); ctx.restore();
    }
    for(k = 0; k < 10; k++){
      var sp = dkbLakeUV(0.1 + dkbH(k + 300) * 0.8, 0.1 + dkbH(k + 330) * 0.8);
      var ang = dkbH(k + 360) * 6.283, x0 = sp.x, y0 = sp.y;
      ctx.beginPath(); ctx.moveTo(x0, y0);
      for(i = 0; i < 5; i++){
        ang += (dkbH(k * 7 + i + 400) - 0.5) * 1.3;
        x0 += Math.cos(ang) * (18 + dkbH(k * 9 + i) * 26); y0 += Math.sin(ang) * (10 + dkbH(k * 5 + i) * 14);
        ctx.lineTo(x0, y0);
      }
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
      ctx.save(); ctx.translate(1, 1.2); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(70,140,170,.4)'; ctx.stroke(); ctx.restore();
    }
    rim('rgba(40,110,140,A)');
    dkbCrest(ctx, { fill: 'rgba(255,255,255,.22)', hi: 'rgba(255,255,255,.38)', lo: 'rgba(64,136,166,.24)' });
  }

  /* ══ 水面の見せ方（本家：内側から光る・白い渦・きらめき・縁の建物の映り込み） ══
     すべて作り置きの盤キャンバスに描くので毎コマの重さは増えず、スマホでも「止まった絵」のまま。
     色と位置は dkbH（決まった乱数）と盤の形だけで決まるので、部分描き直し（dkkPatch）でも同じ絵になる。 */
  var wet = (deco !== 'world');
  var wc  = wet ? (deco === 'onsen' ? [255, 252, 236] : [214, 246, 255]) : [255, 240, 206];
  var wrgba = function(c, al){ return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al + ')'; };
  var whexA = function(h, al){
    var v = parseInt(String(h || '#ffffff').replace('#', ''), 16) || 0;
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + al + ')';
  };

  /* 1) 内側から発光する水面 */
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(cx, cy + 6); ctx.scale(1, 0.60);
  var wg = ctx.createRadialGradient(0, -30, 12, 0, 0, 430);
  wg.addColorStop(0, wrgba(wc, wet ? 0.18 : 0.14));
  wg.addColorStop(0.42, wrgba(wc, wet ? 0.06 : 0.05));
  wg.addColorStop(1, wrgba(wc, 0));
  ctx.fillStyle = wg; ctx.fillRect(-700, -700, 1400, 1400);
  ctx.restore();

  /* 2) 白い渦模様（3本。中心からゆるく外へ巻く） */
  if(wet){
    ctx.save();
    ctx.translate(cx, cy + 10); ctx.scale(1, 0.60);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for(var wk = 0; wk < 3; wk++){
      var wa0 = wk * 2.094 + 0.4;
      ctx.beginPath();
      for(var wi = 0; wi <= 46; wi++){
        var wu = wi / 46, waa = wa0 + wu * 3.9, wrr = (62 + wk * 26) + wu * (238 + wk * 24);
        var wx = Math.cos(waa) * wrr, wy = Math.sin(waa) * wrr;
        if(wi) ctx.lineTo(wx, wy); else ctx.moveTo(wx, wy);
      }
      ctx.lineWidth = 17; ctx.strokeStyle = wrgba(wc, 0.13); ctx.stroke();
      ctx.lineWidth = 6;  ctx.strokeStyle = wrgba(wc, 0.26); ctx.stroke();
      ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.stroke();
    }
    ctx.restore();
  }

  /* 3) 縁の建物の映り込み（水面の上側 2辺だけ。画面の下へ伸ばす） */
  if(wet && typeof G === 'object' && G && G.tiles){
    ctx.save();
    for(var ri = 0; ri < 32; ri++){
      var rc = RECTS[ri]; if(!rc || (rc.side !== 1 && rc.side !== 2)) continue;
      var rt = G.tiles[ri]; if(!rt) continue;
      var rcol = (rt.type === 'city' && typeof GCOL !== 'undefined') ? GCOL[rt.g] : '#D7E6F0';
      var rp = (rc.side === 2) ? proj(rc.p + rc.w / 2, TD) : proj(TD, rc.q + rc.h / 2);
      var rh = 26 + dkbH(ri + 500) * 24, rw = 13 + dkbH(ri + 520) * 11;
      var rg2 = ctx.createLinearGradient(0, rp.y, 0, rp.y + rh);
      rg2.addColorStop(0, whexA(rcol, 0.34));
      rg2.addColorStop(0.55, whexA(rcol, 0.14));
      rg2.addColorStop(1, whexA(rcol, 0));
      ctx.fillStyle = rg2;
      ctx.fillRect(rp.x - rw / 2, rp.y, rw, rh);
      /* さざ波で映り込みを崩す */
      ctx.strokeStyle = wrgba(wc, 0.22); ctx.lineWidth = 1.3;
      ctx.beginPath();
      for(var rk = 1; rk <= 3; rk++){
        var ry2 = rp.y + rh * (rk / 4.2);
        ctx.moveTo(rp.x - rw * 0.62, ry2); ctx.lineTo(rp.x + rw * 0.62, ry2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* 4) きらめき粒子（4方向の小さな星） */
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#FFFFFF';
  for(var si = 0; si < 30; si++){
    var sp2 = dkbLakeUV(0.08 + dkbH(si + 600) * 0.84, 0.08 + dkbH(si + 640) * 0.84);
    var sr = 2.2 + dkbH(si + 680) * 4.4;
    ctx.globalAlpha = 0.28 + dkbH(si + 700) * 0.55;
    ctx.beginPath();
    ctx.moveTo(sp2.x, sp2.y - sr);
    ctx.quadraticCurveTo(sp2.x + sr * 0.22, sp2.y - sr * 0.22, sp2.x + sr, sp2.y);
    ctx.quadraticCurveTo(sp2.x + sr * 0.22, sp2.y + sr * 0.22, sp2.x, sp2.y + sr);
    ctx.quadraticCurveTo(sp2.x - sr * 0.22, sp2.y + sr * 0.22, sp2.x - sr, sp2.y);
    ctx.quadraticCurveTo(sp2.x - sr * 0.22, sp2.y - sr * 0.22, sp2.x, sp2.y - sr);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}
/* 振っている間は満ちて、サイコロが止まったら 0.6秒で引く */
function dkbLakeStep(T){
  var L = DKB_S.lake;
  var dt = L.t ? Math.max(0, Math.min(60, T - L.t)) : 16; L.t = T;
  var da = (typeof diceAnim !== 'undefined') ? diceAnim : null;
  var rolling = !!(da && da.th && da.t < da.th.dur);
  if(rolling) L.lv = Math.min(1, L.lv + dt / 350);
  else if(L.lv > 0) L.lv = Math.max(0, L.lv - dt / 600);
  return L.lv;
}
function dkbDolphin(ctx, x, y, ang, s, a){
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.globalAlpha = a;
  var g = ctx.createLinearGradient(0, -14, 0, 10);
  g.addColorStop(0, '#2C66AE'); g.addColorStop(0.55, '#5CA8E2'); g.addColorStop(1, '#EEF8FF');
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(12,40,80,.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-3, -12); ctx.quadraticCurveTo(-9, -27, -16, -24); ctx.lineTo(-13, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-31, -3); ctx.lineTo(-44, -13); ctx.quadraticCurveTo(-39, -3, -45, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(35, 0);
  ctx.bezierCurveTo(27, -12, -6, -15, -26, -5); ctx.lineTo(-33, -2);
  ctx.bezierCurveTo(-27, 3, -10, 11, 12, 9); ctx.bezierCurveTo(24, 8, 32, 5, 35, 0); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 6); ctx.quadraticCurveTo(0, 17, -7, 15); ctx.lineTo(-2, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(8, -8, 12, 2.4, -0.15, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#0B1E36'; ctx.beginPath(); ctx.arc(22, -3, 1.9, 0, 6.283); ctx.fill();
  ctx.restore();
}
function dkbSplash(ctx, x, y, k, a){
  if(k <= 0 || k >= 1) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.5);
  ctx.globalAlpha = a * (1 - k);
  ctx.lineWidth = 3; ctx.strokeStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(0, 0, 8 + k * 34, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 4 + k * 18, 0, 6.283); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a * (1 - k); ctx.fillStyle = '#EFFBFF';
  for(var i = 0; i < 6; i++){
    var ang = -Math.PI * (0.15 + i * 0.14), r = 10 + k * 26;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 1.3 - k * 10, 2.6 * (1 - k * 0.5), 0, 6.283); ctx.fill();
  }
  ctx.restore();
}
function dkbLakeFx(ctx, T){
  var lv = dkbLakeStep(T);
  if(lv <= 0.01 || !G || !G.map) return false;
  var e = lv * lv * (3 - 2 * lv), mode = G.map.deco, pts = dkbLakePts();
  var cx = BCX, cy = BCY + 22, rot = T * 0.0032, i, k;
  ctx.save();
  dkbPoly(ctx, pts); ctx.clip();
  if(mode === 'world'){
    ctx.save(); ctx.globalAlpha = e;
    ctx.translate(cx, cy); ctx.scale(1, 0.64);
    var g = ctx.createRadialGradient(0, 0, 10, 0, 0, 520);
    g.addColorStop(0, '#C4F6FF'); g.addColorStop(0.3, '#58CBEA'); g.addColorStop(0.7, '#1C88C6'); g.addColorStop(1, '#0C4F8E');
    ctx.fillStyle = g; ctx.fillRect(-700, -700, 1400, 1400);
    ctx.lineCap = 'round';
    for(k = 0; k < 5; k++){
      ctx.beginPath();
      for(i = 0; i <= 30; i++){
        var u = i / 30, a = rot * 2 + k * 1.2566 + u * 3.5, r = 24 + u * 380 * (0.55 + 0.45 * e);
        if(i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 24; ctx.stroke();
      ctx.strokeStyle = 'rgba(232,252,255,.6)'; ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.setLineDash([18, 14]); ctx.lineDashOffset = -T * 0.05;
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 92, 0, 6.283); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  } else if(mode === 'onsen'){
    ctx.save(); ctx.globalAlpha = e;
    ctx.translate(cx, cy); ctx.scale(1, 0.64);
    var go = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
    go.addColorStop(0, 'rgba(255,255,255,.88)'); go.addColorStop(0.35, 'rgba(206,252,238,.72)');
    go.addColorStop(0.75, 'rgba(112,212,186,.58)'); go.addColorStop(1, 'rgba(58,158,138,.4)');
    ctx.fillStyle = go; ctx.fillRect(-700, -700, 1400, 1400);
    /* 湯が沸き立つ波紋（中心から外へ） */
    for(k = 0; k < 6; k++){
      var ph2 = ((T * 0.0009 + k / 6) % 1);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - ph2)).toFixed(3) + ')';
      ctx.lineWidth = 3 + (1 - ph2) * 7;
      ctx.beginPath(); ctx.arc(0, 0, 40 + ph2 * 370, 0, 6.283); ctx.stroke();
    }
    for(i = 0; i < 30; i++){
      var ba = dkbH(i + 500) * 6.283 + rot * 0.4, br = 50 + dkbH(i + 520) * 330, ph = ((T * 0.0022 + dkbH(i + 540)) % 1);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.45 * (1 - ph)).toFixed(3) + ')';
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - ph)).toFixed(3) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(Math.cos(ba) * br, Math.sin(ba) * br - ph * 14, 4 + ph * 12, 0, 6.283); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  } else {
    ctx.save(); ctx.globalAlpha = e;
    ctx.translate(cx, cy); ctx.scale(1, 0.64);
    var gi = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
    gi.addColorStop(0, 'rgba(255,255,255,.9)'); gi.addColorStop(0.4, 'rgba(206,246,255,.66)');
    gi.addColorStop(0.8, 'rgba(120,200,236,.5)'); gi.addColorStop(1, 'rgba(80,160,210,.38)');
    ctx.fillStyle = gi; ctx.fillRect(-700, -700, 1400, 1400);
    /* 氷晶の渦（白い吹雪の筋） */
    ctx.lineCap = 'round';
    for(k = 0; k < 4; k++){
      ctx.beginPath();
      for(i = 0; i <= 26; i++){
        var uu = i / 26, a2 = rot * 1.6 + k * 1.5708 + uu * 3.8, r2 = 20 + uu * 360 * (0.5 + 0.5 * e);
        if(i) ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2); else ctx.moveTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 26; ctx.stroke();
      ctx.strokeStyle = 'rgba(236,252,255,.72)'; ctx.lineWidth = 4; ctx.stroke();
    }
    for(i = 0; i < 44; i++){
      var f = i / 44, aa = rot * (1.5 - f * 0.7) + i * 2.39996, rr = (40 + f * 350) * (0.45 + 0.55 * e);
      ctx.save(); ctx.translate(Math.cos(aa) * rr, Math.sin(aa) * rr); ctx.rotate(aa + Math.PI / 2);
      var sc = 1.0 + dkbH(i + 600) * 1.1;
      ctx.scale(sc, sc);
      var gs = ctx.createLinearGradient(0, -15, 0, 15);
      gs.addColorStop(0, '#FFFFFF'); gs.addColorStop(1, '#8FE0FF');
      ctx.fillStyle = gs; ctx.globalAlpha = e * (0.95 - f * 0.35);
      ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(5, -6); ctx.lineTo(5, 6); ctx.lineTo(0, 15); ctx.lineTo(-5, 6); ctx.lineTo(-5, -6); ctx.closePath();
      ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = e;
    for(k = 0; k < 10; k++){
      var sa = k * 0.628 + rot * 0.5, L1 = 40 + 70 * e;
      ctx.save(); ctx.rotate(sa);
      ctx.beginPath(); ctx.moveTo(62, -7); ctx.lineTo(62 + L1, 0); ctx.lineTo(62, 7); ctx.closePath();
      ctx.fillStyle = 'rgba(230,250,255,.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,200,230,.8)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  /* きらめき */
  for(i = 0; i < 12; i++){
    var sp = dkbLakeUV(0.15 + dkbH(i + 700) * 0.7, 0.15 + dkbH(i + 730) * 0.7);
    var tw = 0.5 + 0.5 * Math.sin(T * 0.012 + i * 1.7);
    ctx.globalAlpha = e * tw * 0.9;
    dkbStar(ctx, sp.x, sp.y, 3 + tw * 5, '#FFFFFF');
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if(mode === 'world'){
    for(i = 0; i < 3; i++){
      var per = 1300, tt = T + i * 433, u2 = (tt % per) / per, cyc = Math.floor(tt / per);
      var A = i * 2.1 + cyc * 0.93;
      var sx = cx + Math.cos(A) * 250, sy = cy + Math.sin(A) * 150;
      var ex = cx + Math.cos(A + 0.95) * 130, ey = cy + Math.sin(A + 0.95) * 80;
      var hgt = 110 * (0.6 + 0.4 * e);
      var x = sx + (ex - sx) * u2, y = sy + (ey - sy) * u2 - Math.sin(u2 * Math.PI) * hgt;
      var vx = ex - sx, vy = (ey - sy) - Math.cos(u2 * Math.PI) * Math.PI * hgt;
      var al = e * (u2 < 0.08 ? u2 / 0.08 : (u2 > 0.92 ? (1 - u2) / 0.08 : 1));
      dkbSplash(ctx, sx, sy, u2 / 0.3, e);
      dkbSplash(ctx, ex, ey, (u2 - 0.7) / 0.3, e);
      dkbDolphin(ctx, x, y, Math.atan2(vy, vx), 1.3, al);
    }
  }
  dkbRedrawNear(ctx, T);
  if(mode === 'onsen'){
    for(i = 0; i < 9; i++){
      var pa = i * 0.7 + 0.3, pr2 = 50 + (i % 3) * 60;
      var bx = cx + Math.cos(pa) * pr2, by = cy + Math.sin(pa) * pr2 * 0.6;
      for(k = 0; k < 7; k++){
        var t2 = ((T * 0.07 + k * 40 + i * 37) % 280) / 280;
        var px = bx + Math.sin(t2 * 6 + i) * 20, py = by - t2 * 300 * e, sz = 24 + t2 * 72;
        var al2 = e * 0.5 * (1 - t2) * (t2 < 0.12 ? t2 / 0.12 : 1);
        if(al2 <= 0.01) continue;
        var gw = ctx.createRadialGradient(px, py, 0, px, py, sz);
        gw.addColorStop(0, 'rgba(255,255,255,' + al2.toFixed(3) + ')'); gw.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(px, py, sz, 0, 6.283); ctx.fill();
      }
    }
  }
  return true;
}
/* 湖の手前の2辺の建物・駒は、湖の演出の上へもう一度描く（盤のキャッシュは作り直さない） */
function dkbRedrawNear(ctx, T){
  var list = [], i;
  for(i = 0; i < 32; i++){
    var s = i >> 3; if(s !== 0 && s !== 3) continue;
    var t = G.tiles[i];
    if(t && t.type === 'city' && t.owner >= 0) list.push({ y: tileCenter(i).y + 0.4, i: i, b: true });
  }
  G.players.forEach(function(p, pi){
    if(p.out) return;
    var sd = p.pos >> 3;
    if(sd !== 0 && sd !== 3 && p.pos !== 8 && !p.moving) return;
    var r = p.render || tileCenter(p.pos);
    list.push({ y: r.y + 0.8, pi: pi });
  });
  list.sort(function(a, b){ return a.y - b.y; }).forEach(function(o){
    if(o.b) drawBuilding(ctx, G, o.i, T); else drawToken(ctx, G, o.pi, T);
  });
}
/* 通行料：湖の中央に札束の山と半透明の大きな金額 */
function dkbTollPile(ctx, T){
  var tl = DKB_S.toll; if(!tl) return;
  var el = performance.now() - tl.t0, D = tl.dur;
  if(el > D){ DKB_S.toll = null; return; }
  var k = el / D;
  var grow = k < 0.24 ? 0 : k < 0.4 ? (k - 0.24) / 0.16 : k < 0.56 ? 1 : k < 0.86 ? 1 - (k - 0.56) / 0.3 : 0;
  if(grow > 0){
    ctx.save();
    ctx.translate(BCX, BCY + 10);
    var sc = 0.55 + 0.45 * grow; ctx.scale(sc, sc);
    ctx.globalAlpha = Math.min(1, grow * 1.5);
    var sh = ctx.createRadialGradient(0, 14, 4, 0, 14, 96);
    sh.addColorStop(0, 'rgba(0,0,0,.4)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(0, 14, 96, 48, 0, 0, 6.283); ctx.fill();
    dkbPileDraw(ctx, tl.n, '#E8C15A', null);
    ctx.restore();
  }
  var ta = k < 0.2 ? 0 : k < 0.3 ? (k - 0.2) / 0.1 : k < 0.86 ? 1 : Math.max(0, (0.97 - k) / 0.11);
  if(ta > 0 && tl.amt > 0){
    var txt = yen(tl.amt), pop = 1 + 0.3 * Math.max(0, 1 - Math.max(0, k - 0.2) / 0.1);
    ctx.save();
    ctx.translate(BCX, BCY + 104); ctx.scale(pop, pop);
    ctx.font = '400 66px "Mochiy Pop One","Noto Sans JP",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.globalAlpha = ta * 0.86;
    ctx.lineWidth = 13; ctx.strokeStyle = 'rgba(36,22,6,.6)'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
}

/* ══════════ ⏸ メニュー（ホームに戻る）・絵文字・持ち物・プレイヤー情報 ══════════ */
async function dkbMenu(){
  if(!G || G.over) return;
  var r = await modal('<div class="modal"><div class="dkb-mpanel fx-panel dkb-menu">'
    + '<h3>メニュー</h3><p>ホームに戻りますか？<br><small>この試合はここで終わりになります</small></p>'
    + '<div class="dkb-mbtns"><button class="btn ghost" data-act="no">つづける</button>'
    + '<button class="btn red" data-act="home">ホームへ</button></div></div></div>');
  if(r === 'home') dkbQuit();
}
function dkbQuit(){
  if(!G) return;
  G.over = true; G.running = false; G.dkbQuit = true;
  try{ gaugeOn = false; stepPreview = null; destPin = null; }catch(e){}
  ['push', 'odd', 'even', 'skillBtn', 'shakeBtn'].forEach(function(id){ var e = document.getElementById(id); if(e) e.onclick = null; });
  ['diceui', 'modalWrap', 'pickeye', 'shake', 'emotebar', 'celebrate'].forEach(function(id){ var e = document.getElementById(id); if(e) e.classList.remove('on'); });
  try{ dkbHideTransient(); celOverlay.on = false; camReset(); }catch(e){ dkbErr('quit', e); }
  try{ if(window.DV_OL && window.DV_OL.started && window.DV_OL_API && window.DV_OL_API.leave) window.DV_OL_API.leave(false); }catch(e){ dkbErr('quit-ol', e); }
  try{ bgm('lobby'); }catch(e){}
  showHome();
}
/* ══════════ エモート（12種から4個まで選んで［送る］。送った人の HUD の脇に 0.25秒ずつ・5個まで。G06・C15） ══════════ */
function dkbEmoBarSync(){
  var bar = document.getElementById('emotebar'); if(!bar || !bar.querySelector('.dkb-emgrid')) return;
  var sel = DKB_S.emoSel || [];
  Array.prototype.forEach.call(bar.querySelectorAll('.dkb-emb'), function(btn){
    var k = sel.indexOf(DKB_EMO[+btn.getAttribute('data-e')]);
    btn.classList.toggle('on', k >= 0);
    dkbTxt(btn.querySelector('i'), k >= 0 ? String(k + 1) : '');
  });
  dkbTxt(bar.querySelector('.dkb-emcnt'), sel.length + '/4');
  var sb = bar.querySelector('.dkb-emsend'); if(sb && sb.classList.contains('dkb-dis') !== !sel.length) sb.classList.toggle('dkb-dis', !sel.length);
}
/* 自分のエモートを送る（3秒に1回）。自分の画面にすぐ出し、オンラインは WP13 の dvSendEmote で配る */
function dkbSendEmote(list){
  if(!G || G.over || !Array.isArray(list) || !list.length) return false;
  var now = performance.now(), me = dkbMe();
  if(now - DKB_S.emoAt < 3000){ dkNotify(me, '⏳', 'エモートは3秒に1回です', '', { ms: 1200 }); return false; }
  DKB_S.emoAt = now;
  list = list.slice(0, 4);
  DKB_S.emoEcho = { key: me + ':' + list.join('|'), t: now };
  dkEmoteShow(me, list, true);
  try{ if(typeof window.dvSendEmote === 'function') window.dvSendEmote(me, list.slice()); }catch(e){ dkbErr('emote-send', e); }
  return true;
}
/* C15：seat（席＝G.players の番号）の HUD の脇にエモートを並べる。知らない語は出さない */
function dkEmoteShow(seat, list, local){
  if(!G || !G.players || !G.players[seat]) return;
  list = (Array.isArray(list) ? list : [list]).filter(function(e){ return DKB_EMO.indexOf(e) >= 0; }).slice(0, 4);
  if(!list.length) return;
  var ek = seat + ':' + list.join('|');
  if(!local && DKB_S.emoEcho && DKB_S.emoEcho.key === ek && performance.now() - DKB_S.emoEcho.t < 2500) return;   // 自分の送信の折り返し
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var box = DKB_S.emo[dkbSeatOfPi(seat)]; if(!box) return;
  list.forEach(function(e){ box.q.push(e); });
  if(!box.t) dkbEmoPump(box);
}
function dkbEmoPump(box){
  var e = box.q.shift();
  if(e === undefined){ box.t = 0; return; }
  var el = box.el;
  var s = (box.free && box.free.pop()) || document.createElement('span');
  s.className = 'dkb-em' + (e.length > 2 ? ' dkb-emtx' : '');
  s.textContent = e;
  el.appendChild(s);
  while(el.children.length > 5) dkbEmoDrop(box, el.firstChild);
  clearTimeout(s._t);
  s._t = setTimeout(function(){ dkbEmoDrop(box, s); }, 3000);
  box.t = setTimeout(function(){ dkbEmoPump(box); }, 250);
}
function dkbEmoDrop(box, s){
  if(!s) return;
  clearTimeout(s._t);
  if(s.parentNode) s.parentNode.removeChild(s);
  if(!box.free) box.free = [];
  if(box.free.length < 6 && box.free.indexOf(s) < 0) box.free.push(s);
}
/* CPU のエモート：出来事で送る（1試合5回まで・同じ出来事では1人だけ・乱数を使わない） */
function dkbCpuEmote(pi, kind){
  if(!G || G.over || dkbFast()) return;
  var p = G.players[pi]; if(!p || p.kind !== 'cpu' || p.out) return;
  if((G.dkbCpuEmo | 0) >= 5) return;
  var ev = (G.turnSerial | 0) + ':' + kind;
  if(G.dkbEmoEv === ev) return;
  G.dkbEmoEv = ev; G.dkbCpuEmo = (G.dkbCpuEmo | 0) + 1;
  var sets = { pay: [['😭'], ['やられた〜'], ['😱', '😭']], gain: [['🤑'], ['ありがとう'], ['😆', '👏']], reach: [['おさきに！'], ['😆']] };
  var s = sets[kind] || sets.gain;
  dkEmoteShow(pi, s[((G.turnSerial | 0) + pi) % s.length], true);
}
/* 大きな通行料：払った CPU は悲しみ、受け取った CPU は喜ぶ */
function dkbCpuReact(payer, owner, amt){
  if(!(amt >= 1000000 * dkbScale())) return;
  var P = G.players[payer], O = G.players[owner];
  if(P && P.kind === 'cpu') dkbCpuEmote(payer, 'pay');
  else if(O && O.kind === 'cpu') dkbCpuEmote(owner, 'gain');
}

/* ══════════ 👍（相手の札を押すと、その人にいいね。1試合10回まで。C15・G21） ══════════ */
function dkbSendLike(pi){
  if(!G || G.over || !G.players[pi]) return;
  var me = dkbMe(); if(pi === me) return;
  if((G.dkbLikeSent | 0) >= 10){ dkNotify(me, '👍', 'いいねは1試合10回までです', '', { ms: 1400 }); return; }
  G.dkbLikeSent = (G.dkbLikeSent | 0) + 1;
  try{ SFX.click(); }catch(e){}
  dkLikeShow(pi, ((G.dkbLk && G.dkbLk[pi]) | 0) + 1);
  try{ if(typeof window.dvSendLike === 'function') window.dvSendLike(pi); }catch(e){ dkbErr('like-send', e); }
}
/* C15：seat の👍の数を n にする（通信の折り返しで同じ数が来ても増えない） */
function dkLikeShow(seat, n){
  if(!G || !G.players || !G.players[seat]) return;
  dkbEnsureG();
  n = Math.max(0, Math.floor(+n || 0));
  var old = G.dkbLk[seat] | 0;
  G.dkbLk[seat] = n;
  var h = DKB_S.hud[dkbSeatOfPi(seat)];
  if(h && dkbHudPi(h) === seat){
    dkbTxt(h.querySelector('.dkb-lk b'), String(n));
    if(n > old && !dkbFast() && typeof DKFX === 'object' && DKFX.poke) DKFX.poke(h.querySelector('.dkb-lk'));
  }
}

/* ══════════ 自動プレイ（J60・C14。強さは「ふつう」） ══════════ */
function dkbSetAuto(pi, on){
  if(!G || !G.players[pi]) return;
  try{ if(typeof dkSetAuto === 'function') dkSetAuto(pi, !!on, 'user'); else G.players[pi].auto = !!on; }catch(e){ dkbErr('auto', e); }
  dkNotify(pi, on ? '🤖' : '✋', on ? '自動プレイ' : '手動に戻しました',
    on ? 'CPU の判断で代わりに進めます（HUD の［自動］で戻せます）' : '', { ms: 1800 });
  updHUD();
}

/* ══════════ ゲットアイテム（持っているフォーチュンカード1枚。#itembar のかわりに左端に出す。C08） ══════════ */
function dkbFcardSync(){
  var el = DKB_S.fc; if(!el || !G) return;
  var p = G.players[dkbMe()], f = p && !p.out && p.fcard ? DKB_FCARD[p.fcard] : null;
  el.classList.toggle('on', !!f);
  if(f){ dkbTxt(el.querySelector('i'), f.ic); dkbTxt(el.querySelector('span'), f.nm); }
}
function dkbItemsPanel(){
  if(!G) return;
  var p = G.players[dkbMe()], rows = [];
  var row = function(ic, nm, ds){ return '<div class="dkb-itr"><i>' + esc(ic) + '</i><div><b>' + esc(nm) + '</b><span>' + esc(ds) + '</span></div></div>'; };
  if(p && p.fcard && DKB_FCARD[p.fcard]){ var f = DKB_FCARD[p.fcard]; rows.push(row(f.ic, f.nm, f.ds)); }
  ((p && p.items) || []).forEach(function(id){ var it = itemById(id); if(it) rows.push(row(it.ic, it.nm, it.desc)); });
  modal('<div class="modal"><div class="dkb-mpanel fx-panel dkb-items">'
    + '<h3>ゲットアイテム</h3>'
    + (rows.join('') || '<p class="dkb-empty">いま持っているフォーチュンカードはありません</p>')
    + '<p class="dkb-note">フォーチュンカードは1枚まで持てます。通行料や攻撃・閉じ込めの時に使うか聞かれます。</p>'
    + '<div class="dkb-mbtns"><button class="btn gold" data-act="close">閉じる</button></div></div></div>');
}

/* ══════════ プレイヤー情報（能力値は基本値＋青い +N、自分に［自動プレイ］、相手に［ゲーム友達 +追加］。J58・J60） ══════════ */
function dkbInfo(pi){
  if(!G || !G.players[pi]) return;
  var p = G.players[pi], c = cardById(p.card) || {};
  var rr = RAR[c.rar] ? c.rar : 'A';
  var names = {}, split = null;
  STAT_LABELS.forEach(function(kl){ names[kl[0]] = kl[1]; });
  try{ (dkStatLabels(p.card) || []).forEach(function(kl){ if(kl && kl[0]) names[kl[0]] = kl[1]; }); }catch(e){}
  try{ split = dkStatSplit(pi); }catch(e){ split = null; }
  if(!Array.isArray(split) || !split.length){
    var st0 = p.stats || {};
    split = STAT_LABELS.map(function(kl){ return { key: kl[0], base: +st0[kl[0]] || 0, plus: 0 }; });
  }
  var bars = split.map(function(s){
    var base = Math.max(0, Math.min(120, Math.round(+s.base || 0))), plus = Math.max(0, Math.round(+s.plus || 0));
    var wb = Math.min(100, base), wp = Math.min(100 - wb, plus);
    return '<div class="dkb-bar7"><span>' + esc(names[s.key] || s.key) + '</span><i><em style="transform:scaleX(' + (wb / 100).toFixed(3) + ')"></em>'
      + (wp > 0 ? '<u style="left:' + wb + '%;width:' + wp + '%"></u>' : '') + '</i>'
      + '<b>' + base + (plus > 0 ? '<small>+' + plus + '</small>' : '') + '</b></div>';
  }).join('');
  var ns = 4;
  try{ ns = Math.max(0, Math.min(4, (typeof dkPendSlots === 'function' ? +dkPendSlots(p.card) : 4) || 0)); }catch(e){ ns = 4; }
  var pend = '';
  for(var k = 0; k < 4; k++){
    var it = p.pend && p.pend[k];
    pend += (k >= ns) ? '<div class="dkb-pd dkb-none"><i>🔒</i><span>—</span></div>'
      : it ? '<div class="dkb-pd"><i>' + esc(it.ic) + '</i><span>' + esc(it.nm) + '</span></div>'
      : '<div class="dkb-pd dkb-none"><i>◇</i><span>未装着</span></div>';
  }
  var sk = p.skill || c.sk || { nm: '', ds: '' };
  var ab = null; try{ ab = (typeof dkDieAb === 'function') ? dkDieAb(pi) : null; }catch(e){ ab = null; }
  var pct = function(v){ v = +v || 0; return Math.round(v <= 1 ? v * 100 : v); };
  var bonus = (ab && (ab.gold > 0 || ab.rp > 0))
    ? '<p class="dkb-ibonus">ボーナス効果　<b>GOLD ' + pct(ab.gold) + '%</b>　<b>RP ' + pct(ab.rp) + '%</b></p>' : '';
  var me = dkbMe(), mine = (pi === me && p.kind !== 'cpu');
  var act = mine ? '<button class="btn dkb-bblue" data-act="auto">' + (dkbIsAuto(pi) ? '自動プレイをやめる' : '自動プレイ') + '</button>'
                 : '<button class="btn dkb-bpink" data-act="friend">ゲーム友達 +追加</button>';
  var html = '<div class="modal"><div class="dkb-info fx-panel" style="--pc:' + PCOL[pi] + ';--pcd:' + shade(PCOL[pi], -0.55) + '">'
    + '<div class="dkb-ihd"><b>' + esc(p.name) + '</b><span>' + esc(c.nm || '') + '</span></div>'
    + '<div class="dkb-ibd"><div class="dkb-icard"><canvas width="240" height="340"></canvas>'
    + '<b class="dkb-rar dkb-r' + rr + '">' + esc(RAR[rr] ? RAR[rr].nm : 'A') + '</b><b class="dkb-lv">Lv' + (p.cardLv || 1) + '</b></div>'
    + '<div class="dkb-istat">' + bars + '<div class="dkb-ipend">' + pend + '</div>'
    + '<div class="dkb-iskill"><b>' + esc(sk.nm || '能力') + '</b><span>' + esc(sk.ds || '') + '</span></div>' + bonus + '</div></div>'
    + '<div class="dkb-mbtns">' + act + '<button class="btn gold" data-act="close">閉じる</button></div></div></div>';
  var pr = modal(html);
  var cv = document.querySelector('#modalBody .dkb-icard canvas');
  if(cv) regPortrait(cv, p.ch, PCOL[pi], p.card);
  pr.then(function(a){
    for(var j = portraits.length - 1; j >= 0; j--) if(portraits[j].el === cv) portraits.splice(j, 1);
    if(a === 'auto') dkbSetAuto(pi, !dkbIsAuto(pi));
    else if(a === 'friend') dkbAddFriend(pi);
  });
  return pr;
}
/* ゲーム友達に追加（CPU は追加できない。人は SV.friends に名前だけ残す＝9j の形 {name,at,n}） */
function dkbAddFriend(pi){
  var p = G && G.players[pi]; if(!p) return;
  var me = dkbMe();
  if(p.kind === 'cpu'){ dkNotify(me, '🤝', 'CPU はゲーム友達に追加できません', 'オンライン対戦の相手を追加できます', { ms: 1800 }); return; }
  try{
    if(typeof SV === 'object' && SV){
      if(!Array.isArray(SV.friends)) SV.friends = [];
      var nm = String(p.name || '').slice(0, 10);
      if(nm && !SV.friends.some(function(f){ return f && f.name === nm; })){
        SV.friends.unshift({ name: nm, at: Date.now(), n: 0 });
        if(SV.friends.length > 100) SV.friends.length = 100;
        if(typeof saveNow === 'function') saveNow();
      }
    }
  }catch(e){ dkbErr('friend', e); }
  dkNotify(me, '🤝', 'ゲーム友達に追加しました', p.name, { ms: 1800 });
}

/* ══════════ マスの情報（持ち主・建物・現在の通行料・買収費用・ここまでNマス。J59） ══════════ */
function dkbPicking(){
  try{ if(typeof DKT_G !== 'undefined' && DKT_G && DKT_G.pick) return true; }catch(e){}
  return !!document.querySelector('#stage > .dkt-pick:not(.dkt-out)');
}
function dkbInQuad(q, x, y){
  var s = 0;
  for(var k = 0; k < 4; k++){
    var a = q[k], b = q[(k + 1) % 4], cr = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if(cr !== 0){ var sg = cr > 0 ? 1 : -1; if(s === 0) s = sg; else if(s !== sg) return false; }
  }
  return true;
}
function dkbTileAtEv(ev){
  var c = document.getElementById('world'); if(!c) return -1;
  var sx = (ev.offsetX / (c.clientWidth || SW)) * SW, sy = (ev.offsetY / (c.clientHeight || SH)) * SH;
  var wx = (sx - SW / 2) / cam.z + cam.x, wy = (sy - SH / 2) / cam.z + cam.y;
  for(var i = 0; i < 32; i++) if(dkbInQuad(tileQuad(i), wx, wy)) return i;
  return -1;
}
function dkbTileClick(ev){
  var td = DKB_S.tdown;
  if(td && td.pick && performance.now() - td.t < 2000) return;       // 選ぶ場面で押した指の続き
  if(!G || G.over || dkbPicking()) return;
  var mw = document.getElementById('modalWrap'); if(mw && mw.classList.contains('on')) return;
  var i = dkbTileAtEv(ev);
  if(i < 0 || i === DKB_S.tiAt){ dkbTileInfoClose(); return; }        // 盤の外・同じマスをもう一度 → 閉じる
  dkbTileInfo(i);
}
/* パネルの外を押したら閉じる（盤の上は dkbTileClick が別のマスへ付け替える） */
function dkbTileOutside(ev){
  if(DKB_S.tiAt === null || !DKB_S.tinfo) return;
  var tg = ev && ev.target;
  if(tg && (DKB_S.tinfo.contains(tg) || tg.id === 'world')) return;
  dkbTileInfoClose();
}
function dkbTileInfoClose(){
  DKB_S.tiAt = null; DKB_S.tiTok = null;
  if(DKB_S.tinfo) DKB_S.tinfo.classList.remove('on');
}
function dkbTypeName(t){
  var m = { start: 'スタート', jail: '無人島', olympic: 'ワールドフェスティバル', travel: '世界旅行',
    card: 'フォーチュンカード', tax: '国税庁', bonus: 'ボーナスゲーム', minigame: 'ボーナスゲーム' };
  return m[t.type] || '特殊マス';
}
/* 段 k（0土地権利書・1マンション・2ビル・3ホテル・4ランドマーク）の通行料。
   WP11 の表（dkrTollAdd）が無い版では、写したマスを tollOf に通して測る */
function dkbTollAt(t, k){
  try{
    if(typeof dkrTollAdd === 'function'){
      var v = 0;
      for(var j = 0; j <= k; j++) v += (+dkrTollAdd(t, j) || 0);
      return Math.round(v);
    }
    var c = {}, q;
    for(q in t) c[q] = t[q];
    c.owner = 0; c.frozen = 0; c.x2 = false; c.olym = 1; c.sand = 0; c.plague = 0; c.idx = -1;
    c.bm = k >= 3 ? 7 : k >= 2 ? 3 : k >= 1 ? 1 : 0; c.lv = Math.min(3, k); c.landmark = k >= 4;
    return Math.round(tollOf(c, null)) || 0;
  }catch(e){ return 0; }
}
/* 段 k の値段（建設費用。0＝土地権利書の値段） */
function dkbPriceAt(t, k){
  try{ if(typeof dkrPrice === 'function') return Math.round(+dkrPrice(t, k)) || 0; }catch(e){}
  return k === 0 ? (t.base | 0) : 0;
}
/* いま建っている段（0〜3、ランドマークは4） */
function dkbLvOf(t){
  if(t.landmark) return 4;
  try{ if(typeof dkrTop === 'function') return dkrTop(t.bm | 0); }catch(e){}
  return Math.max(0, Math.min(3, t.lv | 0));
}
/* 色グループ：同じ色の都市の数と、1つずつの持ち主の色の丸（押したマスは金の輪） */
function dkbGroupHTML(t){
  if(t.tour) return '<em class="dkb-tgr"><u style="background:' + (t.tour === 'pink' ? '#F6A9C9' : '#8FD8F8') + '"></u>観光地</em>';
  var dots = '', n = 0;
  for(var i = 0; i < 32; i++){
    var q = G.tiles[i];
    if(!q || q.type !== 'city' || q.tour || q.g !== t.g) continue;
    n++;
    dots += '<i' + (q === t ? ' class="dkb-tgme"' : '') + ' style="background:'
      + (q.owner >= 0 ? PCOL[q.owner] : 'rgba(255,255,255,.22)') + '"></i>';
  }
  if(!n) return '';
  return '<em class="dkb-tgr"><u style="background:' + ((typeof GCOL !== 'undefined' && GCOL[t.g]) || '#79CDBD') + '"></u>'
    + '同じ色 ' + n + '都市' + dots + '</em>';
}
function dkbTileInfo(i){
  try{ dkbBuild(); }catch(e){ dkbErr('build', e); }
  var el = DKB_S.tinfo, t = G && G.tiles[i]; if(!el || !t) return;
  var me = dkbMe(), mp = G.players[me], d = mp ? (i - mp.pos + 32) % 32 : 0, rows = [], lvs = '', help = '', k;
  if(t.type === 'city'){
    var own = (t.owner >= 0) ? G.players[t.owner] : null, now = dkbLvOf(t);
    rows.push(['持ち主', own ? own.name : 'なし']);
    rows.push(['建物', own ? (DKB_LVNM[now] || '土地権利書') : '—']);
    var toll = '—';
    try{ if(own) toll = (t.frozen > 0) ? '0（停電中）' : yen(tollOf(t, G)); }catch(e){ toll = '—'; }
    rows.push(['現在の通行料', toll]);
    var bo = '—';
    if(own && (t.tour || t.landmark)) bo = '買収できません';
    else if(own && t.owner === me) bo = '自分の都市';
    else if(own){
      try{ bo = yen(typeof dkrBuyoutCost === 'function' ? dkrBuyoutCost(t, me) : cityValue(t) * 2); }catch(e){ bo = '—'; }
    }
    rows.push(['買収費用', bo]);
    if(t.tour) help = '観光地は買収されません。全部そろえると観光地独占で勝ちです';
    else {
      lvs = '<p class="dkb-tlvh"><span>建物</span><u>建設</u><b>通行料</b></p>';
      for(k = 0; k < 5; k++){
        lvs += '<p class="dkb-tlv' + ((own && k === now) ? ' on' : '') + '"><span>' + esc(DKB_LVNM[k]) + '</span>'
          + '<u>' + esc(yen(dkbPriceAt(t, k))) + '</u><b>' + esc(yen(dkbTollAt(t, k))) + '</b></p>';
      }
    }
  } else {
    rows.push(['マス', dkbTypeName(t)]);
    help = DKB_TYPE_DS[t.type] || '';
    try{
      if(!help && typeof dkMapInfo === 'function'){
        var mi = dkMapInfo((typeof dkTodayMap === 'function') ? dkTodayMap() : (cfg && cfg.mapId));
        if(mi && mi.help) help = String(mi.help);
      }
    }catch(e){}
  }
  el.innerHTML = '<div class="dkb-tin"><div class="dkb-tihd"><b class="dkb-tnm">' + esc(t.name || '') + '</b>'
    + (t.type === 'city' ? dkbGroupHTML(t) : '') + '</div>'
    + '<span class="dkb-tdist">' + (d === 0 ? 'いまここにいます' : 'ここまで<em>' + d + '</em>マス') + '</span>'
    + rows.map(function(r){ return '<p><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></p>'; }).join('')
    + (lvs ? '<div class="dkb-tlvs">' + lvs + '</div>' : '')
    + (help ? '<span class="dkb-thelp">' + esc(help) + '</span>' : '')
    + '<div class="dkb-tbtns"><button type="button" class="btn gold dkb-tclose" data-act="close">閉じる</button></div></div>';
  var cb = el.querySelector('.dkb-tclose');
  if(cb) cb.addEventListener('click', function(){ try{ SFX.click(); }catch(e){} dkbTileInfoClose(); });
  if(!el.classList.contains('on')) el.classList.add('on');
  DKB_S.tiAt = i;
  var box = el.firstChild;                                 // 開いた時に1回だけ寸法を読む（毎コマは読まない）
  DKB_S.tiSize = { w: (box && box.offsetWidth) || 372, h: (box && box.offsetHeight) || 280 };
  dkbTiFollow();
  try{ SFX.click(); }catch(e){}
}
/* 押したマスの上に置く。ステージ（1600×900）の外へはみ出さないように寄せ、上に入らない時は下へ回す */
function dkbTiPlace(){
  var el = DKB_S.tinfo, i = DKB_S.tiAt;
  if(!el || i === null) return;
  var w = tileCenter(i), s = dkbW2S(w.x, w.y), r = DKB_S.tiSize || { w: 372, h: 280 };
  var x = Math.max(r.w / 2 + 10, Math.min(1590 - r.w / 2, s.x));
  var top = s.y - 34 - r.h, below = false;                 // ふだんはマスの上（下端が s.y-34）
  if(top < 8){ top = s.y + 30; below = true; }              // 上に入らないマスは下へ回す
  /* ステージ（0〜900）から出さず、下の HUD（👍や名札を押せる所）にもかぶせない */
  top = Math.max(8, Math.min(776 - r.h, top));
  el.classList.toggle('dkb-tibelow', below);
  /* 上に出す時の基準は下端（CSS bottom:0）、下に出す時は上端（.dkb-tibelow は top:0） */
  el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (below ? top : top + r.h).toFixed(1) + 'px)';
}
/* カメラが動いた時だけ置き直す（止まっている間は何も書かない＝スマホで層を増やさない） */
function dkbTiFollow(){
  var tok = {}; DKB_S.tiTok = tok; DKB_S.tiCam = '';
  var step = function(){
    if(DKB_S.tiTok !== tok || DKB_S.tiAt === null) return;
    var sig = cam.x.toFixed(1) + ',' + cam.y.toFixed(1) + ',' + cam.z.toFixed(3);
    if(sig !== DKB_S.tiCam){ DKB_S.tiCam = sig; dkbTiPlace(); }
    requestAnimationFrame(step);
  };
  step();
}

/* ══════════ 起動：代入ラッパと DOM ══════════ */
/* スマホ：盤のまわりの減光（.dkb-vignette と同じ radial-gradient(125% 100%, 透明 56% → rgba(10,5,0,.46) 100%)）を
   盤の canvas に描く。DOM の膜は画面いっぱいの層（iPhone で約49MB）になるので出さない（1k-fx.html）。
   暗くなるのは楕円の外＝四隅の 296×97 の内側だけなので、1/4 の大きさで作った絵から四隅 300×100 を貼る */
function dkbVignette(g){
  var V = DKB_S.vg;
  if(!V){
    V = DKB_S.vg = document.createElement('canvas'); V.width = 400; V.height = 225;
    var c = V.getContext('2d');
    c.setTransform(1, 0, 0, 0.45, 0, 0);            // 横の半径 2000・縦の半径 900 の楕円を、縦を 0.45 倍した円で描く
    var gr = c.createRadialGradient(200, 250, 0, 200, 250, 500);
    gr.addColorStop(0, 'rgba(10,5,0,0)'); gr.addColorStop(0.56, 'rgba(10,5,0,0)'); gr.addColorStop(1, 'rgba(10,5,0,.46)');
    c.fillStyle = gr; c.fillRect(0, 0, 400, 500);
  }
  var k = (typeof cv !== 'undefined' && cv && cv.width) ? cv.width / 1600 : 1;
  g.save();
  g.setTransform(k, 0, 0, k, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(V, 0, 0, 75, 25, 0, 0, 300, 100);
  g.drawImage(V, 325, 0, 75, 25, 1300, 0, 300, 100);
  g.drawImage(V, 0, 200, 75, 25, 0, 800, 300, 100);
  g.drawImage(V, 325, 200, 75, 25, 1300, 800, 300, 100);
  g.restore();
}
var DKB_O = {};
(function(){
  try{
    DKB_O.newGame = newGame;
    newGame = function(){
      var r = DKB_O.newGame.apply(this, arguments);
      try{ dkbOnNewGame(); }catch(e){ dkbErr('newGame', e); }
      return r;
    };
    DKB_O.drawLake = drawLake;
    drawLake = function(ctx, map, T){
      var r = DKB_O.drawLake.apply(this, arguments);
      try{ dkbLakeSkin(ctx, map, T); }catch(e){ dkbErr('lake', e); }
      return r;
    };
    DKB_O.celOverlay = celOverlay;
    celOverlay = function(ctx2, now){
      var r = DKB_O.celOverlay.apply(this, arguments);
      try{ if(G && typeof DKFX === 'object' && DKFX && DKFX.mob) dkbVignette(ctx2); }catch(e){ dkbErr('vignette', e); }
      return r;
    };
    DKB_O.drawDice = drawDice;
    drawDice = function(ctx, T){
      var on = false;
      try{ if(G) on = dkbLakeFx(ctx, T); }catch(e){ dkbErr('lakefx', e); }
      if(on || DKB_S.deferT >= 0){ try{ dkbMarks(ctx, T); }catch(e){ dkbErr('marks', e); } DKB_S.deferT = -1; }
      try{ dkbTollPile(ctx, T); }catch(e){ dkbErr('pile', e); }
      return DKB_O.drawDice.apply(this, arguments);
    };
  }catch(e){ console.error('[WP7]', e); }
  try{
    dkbBuild();
    try{ if(typeof refreshArt === 'function') boardChanged(); }catch(e){}
  }catch(e){ console.error('[WP7]', e); }
})();
