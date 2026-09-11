/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — オンライン対戦（7-online.js / v10 WP13b）
   ──────────────────────────────────────────────────────────────
   ・サーバを持たない。ブラウザ同士を直接つなぐ（WebRTC / PeerJS）。
     合図（シグナリング）だけ PeerJS の公開ブローカーを借りる。鍵も登録も不要。
   ・盤面は送らない。「誰が何を選んだか」だけを送り、各端末が同じ手順で同じ結果を出す。
     乱数はホストが決めた種から全員で共有する（xorshift32）。操作1つごとに種を振り直す。
   ・操作には通し番号を打つ。先に届いた操作は「その選択の所まで手順が来た時」に使う
     （端末ごとに演出の速さが違っても、同じ所で同じ操作を使う＝ずれない）。
   ・操作には host の盤面の要約（hash）と、前の操作から変わった所（差分）を付ける。
     要約が合わない端末は、その場で host の盤面に合わせ直す（往復なし）。
   ・人間の選択の期限は30秒（SPEED は掛けない）。切れたら host がその席を「自動」にして、
     CPU の判断で続ける。自動の席・抜けた席は host が決める（待たない）。
   ・エモートといいねは、手順とは別の軽い知らせで配る（3秒に1回・いいね1試合10回）。
   ・4人まで。5人目は入れない（観戦者は作らない）。
   ・オンラインを使わないときは、既存コードに一切さわらない（差し替えは開始時だけ）。
   ・Artifact 版（game.html）は外部接続が止められるので、読み込み失敗＝黙ってオフライン。
   ・Date.now / new Date は使わない。
   ══════════════════════════════════════════════════════════════ */
function dvOnlineBoot(){

  var PEER_URL  = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
  /* 読み上げやすい字だけ。0/1/O/I/L は入れない */
  var ALPHA     = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var IDPREFIX  = 'dvkg';        // 公開ブローカー上での当ゲームの名前空間
  var MAXSEAT   = 4;             // 本家どおり4人まで（観戦者は作らない）
  var TURN_TAGS = ['roll','skill','item','cpuitem'];
  var WAIT_MS   = 30000;         // 人間の選択の期限（本家の持ち時間。SPEED は掛けない）
  var GRACE_MS  = 1500;          // host の見張りは本人の端末の期限より少しあと（通信の遅れのぶん）
  var EMO_GAP   = 3000;          // エモートは3秒に1回
  var EMO_MAX   = 4;             // 1回に選べるエモートの数
  var LIKE_MAX  = 10;            // いいねは1試合10回
  var MISS_MAX  = 6;             // 手順のずれが続いたら、先の操作を捨てて合わせ直す
  /* host が配るルール（無い項目は null を送り、ゲスト側の古い値を消す） */
  var CFG_KEYS  = ['mapId','turns','timeLimit','cash','ai','n','team','shake','turnTimer','cls'];
  /* 盤面の差分に入れない物（見た目だけ・大きくて変わらない物・端末ごとの時計） */
  var SKIP_P = { render:1, hopY:1, squash:1, offx:1, offy:1, face:1, stats:1, skill:1, pend:1, pendLv:1, ch:1 };
  var SKIP_G = { map:1, tiles:1, players:1, phase:1, running:1, dktLoop:1, dkbInit:1, dkbLikes:1,
                 lastTick:1, clock:1, alarm:1, olLikes:1 };
  /* 期限切れ・抜けた時に host が代わりに出す答え（CPU の弱い判断。null/false は「やめる」） */
  var FALLBACK = { tile:-1, build:[], buyout:false, mini:{ c:'stop' }, jam:false, jail:'dbl', travel:false,
                   fortune:'ok', angel:true, coupon:true, guard:true, oebuy:false,
                   swap:null, bonus3:null, crystal:null, roulette:null, start:null };

  var OL = {
    lib:false, peer:null, me:'', hostId:'', host:false, code:'',
    conns:{},            // ホスト: 相手pid -> connection ／ ゲスト: ホストだけ
    hostConn:null,
    members:[],          // ロビーの顔ぶれ [{pid,name,ready,prof}]
    seats:[],            // 試合中の席 [{name,kind,pid,alive,prof}]
    prof:null, rules:null,
    on:false,            // ロビーに入っている
    started:false,       // 試合が始まっている
    trying:false,        // 部屋をつくっている途中
    seed:0, week:0,
    nextSeq:0,           // ホストが配る通し番号
    recvSeq:0,           // 次に受け取る番号（ここまでは列 q に並んでいる）
    applySeq:0,          // 次に使う番号
    dataN:0,             // 使った「選択」の数（ゲストの答えがどの選択の物かを見る）
    q:[], gap:{}, doQ:{},
    w:null,              // いま待っている選択
    rng:null, real:Math.random,
    diceQ:null,
    orig:{},
    waitBox:null, waitOf:null, waitT:0, busySeat:-1,
    resyncing:false, pumping:false, applying:false,
    mir:null, heals:0, miss:0,
    autoPend:{}, inLocal:{}, localPick:null,
    emoAt:{}, likes:{}, likeG:null, tuSent:false,
    cfg0:null, hooked:false, waitMs:WAIT_MS,
    seen:{}, beatIn:0, beatOut:0, wantN:0
  };

  /* ══════════ 生存確認 ══════════
     ブラウザを閉じられた時は close イベントが来ないことがあるので、
     2.5秒ごとの合図が 9秒とだえたら「切れた」とみなす。 */
  function nowMs(){ return (window.performance && performance.now) ? performance.now() : 0; }
  function startBeat(){
    stopBeat();
    OL.beatOut = setInterval(function(){
      if(OL.host) bcast({t:'hb'}); else sendTo(OL.hostConn, {t:'hb'});
    }, 2500);
    OL.beatIn = setInterval(function(){
      var t = nowMs(), k;
      if(OL.host){
        for(k in OL.conns){
          if(!OL.seen[k]) OL.seen[k] = t;
          if(t - OL.seen[k] > 9000) gone(k);
        }
      } else if(OL.seen[OL.hostId] && t - OL.seen[OL.hostId] > 12000){
        OL.seen[OL.hostId] = t;
        note('ホストと連絡が取れません', 'つながり直すのを待っています');
      }
    }, 2000);
  }
  function stopBeat(){
    if(OL.beatOut) clearInterval(OL.beatOut);
    if(OL.beatIn)  clearInterval(OL.beatIn);
    OL.beatOut = 0; OL.beatIn = 0;
  }

  /* ══════════ 共有乱数（xorshift32） ══════════ */
  function xs32(seed){
    var s = seed >>> 0; if(s === 0) s = 0x9E3779B9;
    return function(){
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }
  function mix(a, b){
    var h = (a ^ 0x9E3779B9) >>> 0;
    h = (h + ((b + 0x85EBCA6B) >>> 0)) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 0x2545F491) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 0x27D4EB2D) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }
  function reseed(seq){ OL.rng = xs32(mix(OL.seed, seq)); }
  function sharedRandom(){ return OL.rng ? OL.rng() : OL.real(); }

  /* ══════════ 合言葉 ══════════ */
  function mkCode(){
    var s = '';
    for(var i=0;i<4;i++) s += ALPHA.charAt((OL.real()*ALPHA.length)|0);
    return s;
  }
  function cleanCode(s){
    s = String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    s = s.replace(/O/g,'').replace(/I/g,'').replace(/L/g,'').replace(/0/g,'').replace(/1/g,'');
    return s.slice(0,4);
  }

  /* ══════════ PeerJS の読み込み（失敗したら黙って何もしない） ══════════ */
  function loadPeer(done){
    if(window.Peer){ OL.lib = true; done(true); return; }
    var fired = false;
    var fin = function(ok){ if(fired) return; fired = true; OL.lib = !!(ok && window.Peer); done(OL.lib); };
    var s = document.createElement('script');
    s.src = PEER_URL; s.async = true;
    s.onload  = function(){ fin(true); };
    s.onerror = function(){ fin(false); };
    document.head.appendChild(s);
    setTimeout(function(){ fin(!!window.Peer); }, 7000);
  }

  /* ══════════ 送受信 ══════════ */
  function sendTo(conn, msg){ try{ if(conn && conn.open) conn.send(msg); }catch(e){} }
  function bcast(msg, exceptPid){
    for(var k in OL.conns){ if(k !== exceptPid) sendTo(OL.conns[k], msg); }
  }

  function wire(conn){
    OL.seen[conn.peer] = nowMs();
    conn.on('data', function(m){
      OL.seen[conn.peer] = nowMs();
      try{ onData(conn.peer, m); }catch(e){ console.error('[WP13b]', e); }
    });
    conn.on('close', function(){ gone(conn.peer); });
    conn.on('error', function(){ gone(conn.peer); });
    /* PeerJS の close が来ないブラウザもあるので、接続そのものの状態も見る */
    try{
      var pc = conn.peerConnection;
      if(pc) pc.oniceconnectionstatechange = function(){
        var s = pc.iceConnectionState;
        /* disconnected は一時的に出るだけで戻ることが多い。切断とみなさない
           （ここで切ると、つながっている相手を試合中に蹴ってしまう）。
           本当に落ちた時は failed／closed か、生存確認の途絶で拾う。 */
        if(s === 'failed' || s === 'closed') gone(conn.peer);
      };
    }catch(e){}
  }
  function gone(pid){
    if(OL.host){
      if(!OL.conns[pid] && !OL.started) return;
      if(OL.conns[pid]){ try{ OL.conns[pid].close(); }catch(e){} delete OL.conns[pid]; }
      delete OL.seen[pid];
      var i;
      for(i=OL.members.length-1;i>=0;i--) if(OL.members[i].pid === pid) OL.members.splice(i,1);
      if(OL.started){
        for(i=0;i<OL.seats.length;i++)
          if(OL.seats[i].pid === pid && OL.seats[i].alive) ctl('drop', i);
      } else pushRoom();
    } else if(pid === OL.hostId){
      if(OL.started){
        /* host が居ないと誰も手順を進められない。止まった盤を見せ続けず、ここで終える */
        note('ホストとの接続が切れました', 'この対戦はここで終わりです');
        if(typeof dkbQuit === 'function'){ try{ dkbQuit(); }catch(e){ console.error('[WP13b]', e); } }
        if(OL.on || OL.started){ try{ if(G){ G.over = true; G.running = false; } }catch(e){} leave(true); goHome(); }
      } else {
        leave(true);
        backToEntry('ホストとの接続が切れました。もう一度つないでください。');
      }
    }
  }

  /* ══════════ ロビー ══════════ */
  function prim(v){ return (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') ? v : (v ? 1 : 0); }
  function myProfile(name){
    var hasSV = (typeof SV !== 'undefined' && SV);
    var id = (hasSV && SV.equip) ? SV.equip : CARDPOOL[0].id;
    var o  = (hasSV && SV.cards && SV.cards[id]) ? SV.cards[id] : {lv:1};
    /* ペンダントの強化値・サイコロの Lv と極も配る（端末ごとの保存データで確率がずれないように） */
    var pendLv = {};
    if(hasSV && SV.slots) SV.slots.slice(0,4).forEach(function(pid){
      var q = SV.pendants && SV.pendants[pid];
      if(pid) pendLv[pid] = Math.max(1, Math.min(8, (q && (q.lv | 0)) || 1));
    });
    var dieId = (hasSV && SV.die && SV.dice && SV.dice[SV.die]) ? SV.die : 'd0';
    var dieLv = (hasSV && SV.dice && SV.dice[dieId]) ? Math.max(1, Math.min(10, (SV.dice[dieId] | 0) || 1)) : 1;
    var kw = (hasSV && dieLv >= 10 && SV.kiwami && typeof SV.kiwami[dieId] === 'string') ? SV.kiwami[dieId] : null;
    /* 持ち込み品（部屋で買った物。C07 の SV.carry={oe,sal,dbl,magic}） */
    var c = hasSV ? SV.carry : null, carry = null;
    if(c && typeof c === 'object'){
      carry = { oe:prim(c.oe), sal:prim(c.sal), dbl:prim(c.dbl),
                magic:(typeof c.magic === 'string' && c.magic) ? c.magic.slice(0, 12) : null };
      if(!carry.oe && !carry.sal && !carry.dbl && !carry.magic) carry = null;
    }
    return {
      name: String(name||'プレイヤー').slice(0,10),
      cardId: id, lv: o.lv || 1,
      slots: (hasSV && SV.slots) ? SV.slots.slice(0,4) : [],
      bag:   (hasSV && SV.bag)   ? SV.bag.slice(0,3)   : [],
      die:   (hasSV && SV.die)   ? SV.die              : 'd0',
      pendLv: pendLv, dieId: dieId, dieLv: dieLv, dieKw: kw,
      carry: carry,
      rp: hasSV ? (SV.rp | 0) : 0             // ともだちランキング（リーグ）に出す
    };
  }

  function goHome(){ if(typeof showHome === 'function') showHome(); else screenTo('title'); }
  /* 入口の画面（#online）へ戻して、理由を出す */
  function backToEntry(msg){
    var el = document.getElementById('online');
    if(!el){ goHome(); if(msg) note('オンライン', msg); return; }
    screenTo('online');
    var jb = el.querySelector('#olJoinBox'), m = el.querySelector('#olMsg');
    if(jb && jb.style.display === 'none') jb.style.display = 'block';
    if(m) m.textContent = msg || '';
  }
  function hostMsg(t, bad){
    var m = document.getElementById('olHostMsg');
    if(m){ m.textContent = t || ''; m.classList.toggle('bad', !!bad); }
  }

  function openOnline(){
    if(!OL.lib) return;
    styleOnce();
    var nm = (typeof SV !== 'undefined' && SV.name) ? SV.name : 'あなた';
    var el = mkScreen('online',
      '<div style="max-width:680px;margin:0 auto;padding:28px 8px;text-align:center">'
      + '<h2 style="font-family:var(--pop);font-size:30px;color:#FFE9B5;margin:0 0 6px">オンラインで遊ぶ</h2>'
      + '<p style="color:#9FB6CC;font-size:16px;margin:0 0 22px;line-height:1.8">'
      +   '合言葉を伝えるだけで、はなれた友達と同じ盤で遊べます。<br>'
      +   'アプリの登録も、アカウントもいりません。最大4人・足りない席はCPUが入ります。</p>'
      + '<div style="margin:0 0 20px"><label style="color:#9FB6CC;font-size:16px;margin-right:8px">なまえ</label>'
      +   '<input id="olName" type="text" maxlength="10" value="' + esc(nm) + '" '
      +   'style="font-size:18px;padding:8px 12px;border-radius:8px;border:1px solid #33507a;'
      +   'background:#0b1729;color:#EAF2FF;width:190px;text-align:center"></div>'
      + '<div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">'
      +   '<button class="btn gold" id="olHost">部屋をつくる</button>'
      +   '<button class="btn gold" id="olJoin">部屋に入る</button></div>'
      + '<div id="olHostMsg" class="ol-hmsg" role="status" aria-live="polite"></div>'
      + '<div id="olJoinBox" style="display:none;margin-top:20px">'
      +   '<div style="color:#9FB6CC;font-size:16px;margin-bottom:8px">友達から聞いた4文字を入れてください</div>'
      +   '<input id="olCode" type="text" maxlength="4" placeholder="KAME" '
      +   'style="font-family:var(--pop);font-size:34px;letter-spacing:12px;padding:8px 10px 8px 22px;'
      +   'width:230px;text-align:center;text-transform:uppercase;border-radius:10px;'
      +   'border:1px solid #33507a;background:#0b1729;color:#FFD24D">'
      +   '<div style="margin-top:14px"><button class="btn gold" id="olGo">つなぐ</button></div>'
      +   '<div id="olMsg" style="color:#9FB6CC;font-size:16px;margin-top:12px;min-height:20px"></div></div>'
      + '<div style="margin-top:26px"><button class="btn ghost" id="olBack">もどる</button></div>'
      + '</div>');
    el.querySelector('#olHost').onclick = function(){ SFX.click(); startHost(); };
    el.querySelector('#olJoin').onclick = function(){
      SFX.click();
      el.querySelector('#olJoinBox').style.display = 'block';
      el.querySelector('#olCode').focus();
    };
    el.querySelector('#olGo').onclick = function(){
      var c = cleanCode(el.querySelector('#olCode').value);
      if(c.length !== 4){ SFX.warn(); el.querySelector('#olMsg').textContent = '4文字で入れてください（0・1・O・I・L は使いません）'; return; }
      SFX.click(); el.querySelector('#olMsg').textContent = 'つないでいます…';
      startGuest(c);
    };
    el.querySelector('#olBack').onclick = function(){ SFX.click(); leave(false); goHome(); };
    screenTo('online');
  }

  function nameNow(){
    var i = document.getElementById('olName');
    return i && i.value ? i.value.slice(0,10) : 'プレイヤー';
  }

  function startHost(){
    if(OL.trying || OL.on) return;
    OL.trying = true;
    hostMsg('部屋をつくっています…', false);
    OL.prof = myProfile(nameNow());
    tryHost(0);
  }
  /* 部屋がつくれなかった時（待ち合わせ場所＝PeerJS の公開ブローカーが落ちている時など）。
     タイトルへ飛ばさず、入口（#online）に理由を出す。「部屋をつくる」をもう一度押せる。 */
  function hostFailed(){
    OL.trying = false;
    leave(true);
    var el = document.getElementById('online');
    var why = '部屋がつくれませんでした。待ち合わせ場所（つなぐための案内役）に届きません。少し待ってからもう一度どうぞ。';
    if(el && el.querySelector('#olHostMsg')){ screenTo('online'); hostMsg(why, true); }
    else goHome();
    note('部屋がつくれませんでした', '待ち合わせ場所につながりません');
  }
  function tryHost(tries){
    if(tries > 6){ hostFailed(); return; }
    var code = mkCode();
    var p;
    try{ p = new Peer(IDPREFIX + code, {debug:0}); }catch(e){ hostFailed(); return; }
    var settled = false;
    p.on('open', function(id){
      if(settled) return; settled = true;
      OL.trying = false; hostMsg('', false);
      OL.peer = p; OL.me = id; OL.hostId = id; OL.host = true; OL.code = code; OL.on = true;
      OL.members = [{pid:id, name:OL.prof.name, ready:true, prof:OL.prof}];
      startBeat();
      p.on('connection', function(c){
        /* 自分＋つながっている人で満員なら入れない（5人目は入れない・観戦者は作らない） */
        if(OL.started || Object.keys(OL.conns).length + 1 >= MAXSEAT){
          c.on('open', function(){
            sendTo(c, {t:'full', started:OL.started ? 1 : 0});
            setTimeout(function(){ try{ c.close(); }catch(e){} }, 600);
          });
          return;
        }
        OL.conns[c.peer] = c;
        wire(c);                                 // data は open 前でも取りこぼさない
      });
      showRoom();
    });
    p.on('error', function(){
      if(settled){ return; }
      settled = true;
      try{ p.destroy(); }catch(e){}
      tryHost(tries + 1);            // 合言葉がぶつかった等 → 別の合言葉で取り直す
    });
  }

  function startGuest(code){
    OL.prof = myProfile(nameNow());
    var p = null, settled = false;
    /* つながらない理由は1つではない。ぜんぶ「合言葉が違う」と言うと直しようがないので、
       起きたことをそのまま出す。
         peer-unavailable        … その部屋が無い（打ち間違い／相手がまだ部屋をつくっていない）
         reach                   … 部屋は見つかったが回線がつながらない（NAT越えに失敗）
         browser-incompatible    … このブラウザが WebRTC に対応していない
         その他（network 等）    … 待ち合わせ場所（ブローカー）につながらない */
    function fail(why){
      if(settled) return;
      var m = document.getElementById('olMsg');
      if(m){
        if(why === 'peer-unavailable')
          m.textContent = 'その合言葉の部屋が見つかりません。4文字を確かめてください（相手がまだ「部屋をつくる」を押していないのかもしれません）。';
        else if(why === 'reach')
          m.textContent = '部屋は見つかりましたが、回線がつながりませんでした。ケータイの回線や会社・学校のネットだとつながらないことがあります。Wi-Fi でお試しください。';
        else if(why === 'browser-incompatible')
          m.textContent = 'このブラウザはオンライン対戦に対応していません。Chrome か Safari の新しい版でお試しください。';
        else
          m.textContent = '待ち合わせ場所につながりません。少し待ってからもう一度どうぞ。';
      }
      try{ if(p) p.destroy(); }catch(e){}
    }
    try{ p = new Peer({debug:0}); }catch(e){ fail('browser-incompatible'); return; }
    p.on('open', function(id){
      OL.peer = p; OL.me = id; OL.host = false; OL.code = code;
      OL.hostId = IDPREFIX + code;
      var c = p.connect(OL.hostId, {reliable:true});
      OL.hostConn = c; OL.conns[OL.hostId] = c;
      wire(c);                                   // data は open 前でも取りこぼさない
      var t = setTimeout(function(){ fail('reach'); }, 12000);
      c.on('open', function(){
        settled = true; clearTimeout(t);
        OL.on = true;
        startBeat();
        sendTo(c, {t:'hello', prof:OL.prof});
        showRoom();
      });
      c.on('error', function(){ clearTimeout(t); fail('reach'); });
    });
    p.on('error', function(e){ fail(e && e.type); });
  }

  function leave(silent){
    /* 自分が選んでいる途中の画面（ポップアップ・エリア選び・サイコロ）を閉じてから抜ける */
    var w0 = OL.w;
    if(w0 && !w0.done && w0.mine){ w0.cancelled = true; cancelLocal(w0); }
    OL.on = false; OL.started = false; OL.trying = false;
    stopBeat(); OL.seen = {};
    uninstall();
    try{ if(OL.peer) OL.peer.destroy(); }catch(e){}
    OL.peer = null; OL.conns = {}; OL.hostConn = null; OL.members = []; OL.seats = []; OL.rules = null;
    resetSeq();
    hideWait();
    restoreCfg();                     // 部屋（オフライン）の設定をオンラインの前に戻す
    if(!silent){ /* 何も出さない（静かに戻す） */ }
  }

  /* 部屋に出すルール（host のもの） */
  function rulesNow(){
    var map = (typeof MAPS !== 'undefined') ? (MAPS.find(function(m){ return m.id === cfg.mapId; }) || MAPS[0]) : null;
    return { map:(map && map.name) || '', turns:cfg.turns | 0, min:Math.round((cfg.timeLimit | 0) / 60),
             team:!!cfg.team && wantN() === 4, shake:!!cfg.shake };
  }
  function rulesText(R){
    if(!R) return '';
    var a = [];
    if(R.map) a.push(R.map);
    a.push('制限ターン ' + R.turns);
    if(R.min > 0) a.push('時間 ' + R.min + '分');
    if(R.team) a.push('チーム戦');
    if(R.shake) a.push('揺らすあり');
    return a.join('・');
  }

  function pushRoom(){
    if(!OL.host) return;
    bcast({t:'room', code:OL.code, rules:rulesNow(), members:OL.members.map(function(m){
      return {pid:m.pid, name:m.name, ready:m.ready};
    })});
    renderRoom();
  }

  function showRoom(){ renderRoom(); screenTo('olroom'); }

  function renderRoom(){
    styleOnce();
    var i, rows = '';
    var list = OL.members;
    for(i=0;i<MAXSEAT;i++){
      var m = list[i];
      var col = PCOL[i];
      if(m){
        rows += '<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;margin:7px 0;'
             + 'border-radius:10px;background:rgba(12,26,46,.75);border:1px solid #24406a">'
             + '<span style="width:12px;height:12px;border-radius:50%;background:' + col + '"></span>'
             + '<b style="flex:1;text-align:left;color:#EAF2FF;font-size:18px">' + esc(m.name)
             + (m.pid === OL.me ? '<span style="color:#8FA9C4;font-size:16px">（あなた）</span>' : '') + '</b>'
             + '<span style="font-size:16px;color:' + (m.ready ? '#7DE08A' : '#FFD24D') + '">'
             + (m.ready ? '準備OK' : '接続中…') + '</span></div>';
      } else {
        rows += '<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;margin:7px 0;'
             + 'border-radius:10px;background:rgba(12,26,46,.35);border:1px dashed #24406a;opacity:.6">'
             + '<span style="width:12px;height:12px;border-radius:50%;background:' + col + ';opacity:.4"></span>'
             + '<b style="flex:1;text-align:left;color:#8FA9C4;font-size:17px">待機中</b>'
             + '<span style="font-size:16px;color:#8FA9C4">CPUが入ります</span></div>';
      }
    }
    var R = OL.host ? rulesNow() : OL.rules;
    var el = mkScreen('olroom',
      '<div style="max-width:640px;margin:0 auto;padding:22px 8px;text-align:center">'
      + '<div style="color:#9FB6CC;font-size:16px;margin-bottom:4px">あいことば</div>'
      + '<div style="font-family:var(--pop);font-size:58px;letter-spacing:14px;color:#FFD24D;'
      +   'text-shadow:0 4px 0 rgba(0,0,0,.5);margin-bottom:6px;padding-left:14px">' + esc(OL.code) + '</div>'
      + '<div style="color:#8FA9C4;font-size:16px;margin-bottom:20px">'
      +   'この4文字を友達に伝えてください（電話でも口頭でもOK）</div>'
      + rows
      /* ルールの行。host は人数の下の1行にまとめる（行を増やすとボタンが画面の下にはみ出す） */
      + ((R && !OL.host) ? '<div class="ol-rules" style="margin-top:12px;font-size:20px;font-weight:700;color:#F4E3BD">ルール　' + esc(rulesText(R)) + '</div>' : '')
      + (OL.host
          ? '<div style="margin-top:16px;color:#9FB6CC;font-size:16px">'
            + '人数　'
            + [2,3,4].map(function(v){
                return '<button class="btn ghost olN" data-n="' + v + '"'
                  + (wantN() === v ? ' style="border-color:#FFD24D;color:#FFD24D"' : '')
                  + '>' + v + '人</button>';
              }).join(' ')
            + '<div class="ol-rules" style="margin-top:6px;font-size:16px">'
            + esc(rulesText(R)) + '　足りない席はCPU</div></div>'
          : '')
      + '<div style="margin-top:22px;display:flex;gap:14px;justify-content:center">'
      +   '<button class="btn ghost" id="olQuit">やめる</button>'
      +   (OL.host ? '<button class="btn gold" id="olStart">はじめる</button>'
                   : '<span style="align-self:center;color:#9FB6CC;font-size:16px">'
                     + 'ホストが「はじめる」を押すまで待ってください</span>')
      + '</div></div>');
    el.querySelector('#olQuit').onclick = function(){ SFX.click(); leave(false); goHome(); };
    if(OL.host){
      el.querySelector('#olStart').onclick = function(){ SFX.click(); hostStart(); };
      el.querySelectorAll('.olN').forEach(function(b){
        b.onclick = function(){ SFX.click(); OL.wantN = +b.dataset.n; pushRoom(); };
      });
    }
  }
  /* 何人でやるか。指定が無ければ「人の数（最低2人）」 */
  function wantN(){
    var base = Math.max(2, Math.min(MAXSEAT, OL.members.length));
    if(!OL.wantN) return base;
    return Math.max(base, Math.min(MAXSEAT, OL.wantN));
  }

  /* ══════════ 試合の開始（ホストが席を決めて配る） ══════════ */
  function hostStart(){
    if(!OL.host || OL.started) return;
    var i, taken = {}, seats = [];
    for(i=0;i<OL.members.length && i<MAXSEAT;i++){
      var m = OL.members[i];
      taken[m.prof.cardId] = 1;
      seats.push({name:m.prof.name, kind:'human', pid:m.pid, alive:true, prof:m.prof});
    }
    var n = wantN();
    var cpuName = ['CPU ガル','CPU リノ','CPU ゼニ','CPU ハク'];
    var free = CARDPOOL.filter(function(c){ return !taken[c.id]; });
    for(i=seats.length;i<n;i++){
      var c = free.length ? free.splice((OL.real()*free.length)|0,1)[0] : CARDPOOL[i % CARDPOOL.length];
      seats.push({name:cpuName[i % 4], kind:'cpu', pid:OL.hostId, alive:true,
        prof:{name:cpuName[i % 4], cardId:c.id, lv:(cfg.ai === 2 ? 12 : cfg.ai === 1 ? 6 : 1),
              slots:[], bag:[], die:'d0'}});
    }
    var rc = {};
    CFG_KEYS.forEach(function(k){ var v = cfg[k]; rc[k] = (v === undefined) ? null : v; });
    rc.n = n;
    if(n !== 4) rc.team = false;              // チーム戦は4人（席0,2 対 1,3）の時だけ
    var info = {
      t:'start',
      seed: ((OL.real()*4294967296) >>> 0),
      week: weekIndexRaw(),
      seats: seats,
      cfg: rc
    };
    bcast(info);
    beginGame(info);
  }

  function weekIndexRaw(){
    return OL.orig.weekIndex ? OL.orig.weekIndex() : weekIndex();
  }

  /* オンラインの前の設定を覚えておき、終わったら戻す（部屋の席が「あなた＋ともだち」に化けないように） */
  function saveCfg(){
    if(OL.cfg0) return;                       // まだ戻していない（前の試合の結果から続けて始めた）
    try{ OL.cfg0 = JSON.parse(JSON.stringify(cfg)); }catch(e){ OL.cfg0 = null; }
  }
  function restoreCfg(){
    var c = OL.cfg0; if(!c) return;
    OL.cfg0 = null;
    try{
      var sp = cfg.speed;
      Object.keys(cfg).forEach(function(k){ if(!(k in c)) delete cfg[k]; });
      Object.keys(c).forEach(function(k){ cfg[k] = c[k]; });
      if(sp !== undefined) cfg.speed = sp;    // アニメの速さは端末の設定のまま
    }catch(e){ console.error('[WP13b]', e); }
  }
  function hookScreens(){
    if(OL.hooked || typeof dkOn !== 'function') return;
    OL.hooked = true;
    dkOn('screen', function(p){
      if(!p || !OL.cfg0 || OL.started) return;
      if(['home','title','dkclass','setup','room','map'].indexOf(p.id) >= 0) restoreCfg();
    });
  }

  function beginGame(info){
    saveCfg();
    hookScreens();
    OL.seed = info.seed >>> 0;
    OL.week = info.week;
    OL.seats = info.seats;
    resetSeq();
    var c = info.cfg || {};
    Object.keys(c).forEach(function(k){
      if(k === 'speed' || k === 'seats') return;
      if(c[k] === null) delete cfg[k]; else cfg[k] = c[k];
    });
    /* cfg.seats は画面の表示用（VS 画面の YOU など）。p.kind は全端末で同じ 'human' */
    cfg.seats = OL.seats.map(function(s){
      return {name:s.name, kind:(s.kind === 'cpu' ? 'cpu' : (s.pid === OL.me ? 'you' : 'human')), ch:-1, cardId:s.prof.cardId};
    });
    OL.likes = {}; OL.emoAt = {}; OL.likeG = null; OL.tuSent = false;
    OL.started = true;
    install();
    reseed(0);
    runGame();
  }

  function mySeat(){
    for(var i=0;i<OL.seats.length;i++){
      var s = OL.seats[i];
      if(s && s.alive && s.kind === 'human' && s.pid === OL.me) return i;
    }
    return -1;
  }
  /* その席を決めるのはどの端末か。CPU・抜けた席・自動の席は host（host は自動の席を待たない） */
  function ownerOf(seat){
    var s = OL.seats[seat];
    if(!s || s.kind !== 'human' || !s.alive) return OL.hostId;
    var p = G && G.players && G.players[seat];
    if(p && p.auto) return OL.hostId;
    return s.pid;
  }
  function isMine(seat){ return ownerOf(seat) === OL.me; }
  /* その席の人がこの端末にいるか（自動かどうかは問わない） */
  function seatHere(seat){ var s = OL.seats[seat]; return !!(s && s.kind === 'human' && s.alive && s.pid === OL.me); }

  async function runGame(){
    SPEED = cfg.speed;
    try{ await vsScreen(); }catch(e){ console.error('[WP13b]', e); }
    await loadingPhase();
    await hideAllScreens();
    reseed(0);                        // 演出で消えた乱数をそろえてから盤を作る
    newGame();
    camReset(); updHUD();
    try{ await dkOrderOnBoard(); }catch(e){ console.error('[WP13b]', e); }   // 順番は最初の乱数で決まる（全端末で同じ）
    if(!G || G.over || !OL.started) return;
    bgm('game');
    var w = thisWeek();
    await band('オンライン対戦スタート！', G.map.name + ' — 制限ターン ' + cfg.turns, 1400);
    await cutIn('THIS WEEK', w.ic + ' ' + w.nm, w.ds);
    turnLoop();
  }

  /* ══════════ 受信 ══════════ */
  function onData(pid, m){
    if(!m || !m.t) return;
    var t = m.t;
    if(t === 'hb') return;
    if(t === 'hello'){
      if(!OL.host || OL.started) return;
      var found = false, i;
      for(i=0;i<OL.members.length;i++) if(OL.members[i].pid === pid) found = true;
      if(!found){
        if(OL.members.length >= MAXSEAT){              // 同時に入ってきた5人目
          sendTo(OL.conns[pid], {t:'full', started:0});
          var cc = OL.conns[pid];
          delete OL.conns[pid];
          setTimeout(function(){ try{ if(cc) cc.close(); }catch(e){} }, 600);
          return;
        }
        OL.members.push({pid:pid, name:String((m.prof && m.prof.name) || 'プレイヤー').slice(0,10), ready:true, prof:m.prof || {}});
      }
      pushRoom();
      return;
    }
    if(t === 'full'){
      if(OL.host) return;
      leave(true);
      backToEntry(m.started ? 'その部屋はもう対戦が始まっています。' : 'その部屋は満員です（4人まで）。別の部屋をつくってください。');
      return;
    }
    if(t === 'room'){
      OL.code = m.code;
      OL.rules = m.rules || null;
      OL.members = (m.members || []).map(function(x){ return {pid:x.pid, name:x.name, ready:x.ready, prof:null}; });
      renderRoom();
      return;
    }
    if(t === 'start'){ if(!OL.host) beginGame(m); return; }
    if(t === 'do'){ hostDo(pid, m); return; }
    if(t === 'auto'){ if(OL.host) hostAuto(pid, m); return; }
    if(t === 'emo'){ gotEmo(pid, m); return; }
    if(t === 'like'){ gotLike(pid, m); return; }
    if(t === 'act'){ if(!OL.host) enqueue(m.a); return; }
    if(t === 'need'){
      if(!OL.host || !OL.started) return;
      sendTo(OL.conns[pid], {t:'state', seq:OL.recvSeq, n:OL.dataN, f:flatten()});
      return;
    }
    if(t === 'state'){ if(!OL.host) restoreState(m); return; }
  }

  /* ══════════ 操作の番号づけと適用 ══════════ */
  function resetSeq(){
    OL.nextSeq = 0; OL.recvSeq = 0; OL.applySeq = 0; OL.dataN = 0;
    OL.q = []; OL.gap = {}; OL.doQ = {}; OL.autoPend = {}; OL.inLocal = {};
    if(OL.w){ clearTimeout(OL.w.timer); clearTimeout(OL.w.own); OL.w.done = true; }   // 前の試合の待ちは捨てる
    OL.w = null; OL.mir = null; OL.heals = 0; OL.miss = 0; OL.localPick = null; OL.resyncing = false;
  }
  /* host が番号を打って全員へ。選択（seat>=0）には盤面の要約と差分を付ける */
  function stamp(seat, tag, v){
    var a = {seq:OL.nextSeq++, seat:seat, tag:tag, v:v, k:OL.dataN};
    if(seat >= 0 && G){
      a.h = hashState();
      var cur = flatten();
      if(!OL.mir) a.f = cur;
      else { var d = diffFlat(OL.mir, cur); if(d) a.d = d; }
      OL.mir = cur;
    }
    bcast({t:'act', a:a});
    enqueue(a);
  }
  function ctl(tag, v){ if(OL.host) stamp(-1, tag, v); }

  /* 届いた操作を番号順に並べる（飛んだ番号は置いておく） */
  function enqueue(a){
    if(!OL.started || !a || typeof a.seq !== 'number') return;
    if(a.seq < OL.recvSeq) return;                        // 二重に来た
    if(a.seq > OL.recvSeq){ OL.gap[a.seq] = a; askResync(); return; }
    OL.q.push(a); OL.recvSeq++;
    while(OL.gap[OL.recvSeq]){ var nx = OL.gap[OL.recvSeq]; delete OL.gap[OL.recvSeq]; OL.q.push(nx); OL.recvSeq++; }
    pump();
  }
  /* 手順が次の選択まで来ていれば、並んでいる操作を使う */
  function pump(){
    if(OL.pumping) return;
    OL.pumping = true;
    try{
      while(OL.started && OL.q.length){
        var w = OL.w;
        if(!w || w.done) break;                           // まだその選択の所まで来ていない
        var a = OL.q[0];
        if(a.seat < 0){ OL.q.shift(); OL.applySeq = a.seq + 1; doCtl(a); continue; }
        if(a.seat === w.seat && w.tags.indexOf(a.tag) >= 0){
          OL.q.shift(); OL.applySeq = a.seq + 1; OL.miss = 0;
          consume(a, w);
          continue;
        }
        if(drift(w, a)) continue;
        break;
      }
    } finally { OL.pumping = false; }
  }
  function consume(a, w){
    OL.dataN++;
    for(var k in OL.doQ) if(+k < OL.dataN) delete OL.doQ[k];
    if(a.f) OL.mir = a.f;
    else if(a.d && OL.mir){ for(var key in a.d) OL.mir[key] = a.d[key]; }
    if(!OL.host && a.h !== undefined && a.h !== hashState()) heal(a);
    reseed(a.seq);                                        // ここで全端末の乱数がそろう
    finishW(w, a);
  }
  function finishW(w, a){
    w.done = true;
    clearTimeout(w.timer); clearTimeout(w.own);
    if(OL.w === w) OL.w = (w.outer && !w.outer.done) ? w.outer : null;
    if(OL.waitOf === w) hideWait();
    w.res(a);
  }
  /* 手順がずれた（盤面のずれで、ある端末だけ別の選択に来た）。
     まず盤面を合わせてもらい、自分の選択は既定の答えで進めて次の選択で合わせ直す。
     何度もずれる時は、先の操作のほうを捨てる。→ 先頭を捨てたら true */
  function drift(w, a){
    OL.miss++;
    askResync();
    if(OL.miss >= MISS_MAX){ OL.q.shift(); OL.applySeq = a.seq + 1; OL.miss = 0; return true; }
    var v = null;
    try{ v = fallbackValue(w); }catch(e){ v = null; }
    if(w.mine){ w.cancelled = true; cancelLocal(w); }
    finishW(w, {seq:a.seq, seat:w.seat, tag:w.tags[0], v:v, local:true});
    return false;
  }
  function doCtl(a){
    if(a.tag === 'drop'){
      var i = a.v | 0, s = OL.seats[i];
      if(s && s.alive){
        s.alive = false; s.kind = 'cpu';
        if(G && G.players[i]){ G.players[i].kind = 'cpu'; G.players[i].auto = false; }
        if(cfg.seats && cfg.seats[i]) cfg.seats[i].kind = 'cpu';
        note(s.name + ' さんの接続が切れました', 'この席はCPUが引き継ぎます');
        try{ renderItems(); }catch(e){}
      }
      var w = OL.w;
      if(w && !w.done && w.seat === i){
        if(w.mine){ w.cancelled = true; cancelLocal(w); }
        if(OL.host) hostAnswer(w);
      }
      return;
    }
    if(a.tag === 'auto'){ applyAuto(a.v); return; }
    if(a.tag === 'timeup'){
      var w0 = OL.w;
      if(w0 && !w0.done){
        w0.cancelled = true;
        if(w0.mine) cancelLocal(w0);
        w0.done = true; clearTimeout(w0.timer); clearTimeout(w0.own);
        OL.w = null;
      }
      hideWait();
      if(G && !G.over) timeUp();
      return;
    }
  }

  /* ══════════ 自動プレイ（G12・J60・C14） ══════════ */
  function applyAuto(v){
    v = v || {};
    var s = v.s | 0, p = G && G.players && G.players[s];
    delete OL.autoPend[s];
    if(!p || p.out) return;
    var on = !!v.on, was = !!p.auto;
    OL.applying = true;
    try{
      var f = OL.orig.dkSetAuto || (typeof dkSetAuto === 'function' ? dkSetAuto : null);
      if(f) f(s, on, v.why || 'manual'); else p.auto = on;
    }catch(e){ console.error('[WP13b]', e); }
    finally{ OL.applying = false; }
    if(was !== !!p.auto){
      if(seatHere(s)){
        note(on ? '自動プレイになりました' : '手動に戻しました',
             on ? (v.why === 'timeout' ? '30秒のあいだ操作が無かったので、CPUが代わりに進めます' : 'HUD の［自動］を押すと手動に戻せます') : '');
      } else if(on && OL.seats[s]){
        note(OL.seats[s].name + ' さんが自動プレイになりました', v.why === 'timeout' ? '時間切れのため、CPUが代わりに進めます' : '');
      }
    }
    /* 自動になった席の選択を待っていたら、host が代わりに答える（本人の画面は閉じる） */
    var w = OL.w;
    if(p.auto && w && !w.done && w.seat === s){
      if(w.mine){ w.cancelled = true; cancelLocal(w); }
      if(OL.host) hostAnswer(w);
    }
  }
  function requestAuto(seat, on, why){
    if(!OL.started) return;
    var m = {t:'auto', s:seat, on:on ? 1 : 0, why:String(why || 'manual').slice(0, 12)};
    if(OL.host) hostAuto(OL.me, m); else sendTo(OL.hostConn, m);
  }
  function hostAuto(pid, m){
    if(!OL.host || !OL.started || !G || !m) return;
    var si = m.s | 0, s = OL.seats[si], p = G.players[si];
    if(!s || !p || s.kind !== 'human' || !s.alive || p.out) return;
    if(s.pid !== pid) return;                             // よその席は切り替えられない
    var on = !!m.on;
    if(OL.autoPend[si] === on) return;
    if(OL.autoPend[si] === undefined && !!p.auto === on) return;
    OL.autoPend[si] = on;
    ctl('auto', {s:si, on:on ? 1 : 0, why:m.why || 'manual'});
  }
  /* 画面の［自動プレイ］や手番のリングから呼ばれる。オンラインでは host に頼み、全員が同じ所で切り替える */
  function olSetAuto(pi, on, why){
    if(OL.applying || !(OL.started && G && !G.over))
      return OL.orig.dkSetAuto ? OL.orig.dkSetAuto(pi, on, why) : undefined;
    if(!seatHere(pi)) return;                             // よその席は host が決める
    requestAuto(pi, !!on, why || 'manual');
  }

  /* ══════════ host の期限と代わりの答え ══════════ */
  function armDeadline(w){
    if(!OL.host || w.mine || w.done) return;
    var s = OL.seats[w.seat], p = G && G.players && G.players[w.seat];
    if(!s || s.kind !== 'human' || !s.alive || (p && p.auto)) return;
    w.timer = setTimeout(function(){ hostTimeout(w); }, (OL.waitMs || WAIT_MS) + GRACE_MS);
  }
  function hostTimeout(w){
    if(!OL.started || OL.w !== w || w.done) return;
    var s = w.seat, p = G && G.players && G.players[s];
    if(p && !p.auto && OL.autoPend[s] !== true){
      OL.autoPend[s] = true;
      ctl('auto', {s:s, on:1, why:'timeout'});          // → applyAuto → hostAnswer
    }
    if(OL.w === w && !w.done) hostAnswer(w);
  }
  /* 自分の端末の期限（本人が放置した時。host は自分の席もここで見る） */
  function ownTimer(w){
    var s = OL.seats[w.seat], p = G && G.players && G.players[w.seat];
    if(!s || s.kind !== 'human' || !s.alive || !p || p.auto || p.kind === 'cpu') return;
    w.own = setTimeout(function(){
      if(!w.done && !w.cancelled && OL.started) requestAuto(w.seat, true, 'timeout');
    }, OL.waitMs || WAIT_MS);
  }
  function hostAnswer(w){
    if(!OL.host || !w || w.done || w.sent) return;
    var v = null;
    try{ v = fallbackValue(w); }catch(e){ console.error('[WP13b]', e); v = null; }
    w.sent = true;
    stamp(w.seat, w.tags[0], jsonSafe(v));
  }
  function fallbackValue(w){
    var tag = w.tags[0], s = w.seat;
    if(TURN_TAGS.indexOf(tag) >= 0) return cpuRollChoice(s);
    if(tag === 'dice'){
      if(w.pure){ try{ return w.pure(); }catch(e){} }
      return preRoll(s, null, false, 0);
    }
    if(tag === 'sell') return sellFallback(s);
    if(Object.prototype.hasOwnProperty.call(FALLBACK, tag)) return jsonSafe(FALLBACK[tag]);
    return null;
  }
  /* 払えない時：いちばん安い都市を1つ売る（足りなければ次の問いでまた1つ） */
  function sellFallback(pi){
    var best = -1, bv = 1e18;
    for(var i = 0; i < G.tiles.length; i++){
      var t = G.tiles[i];
      if(!t || t.type !== 'city' || t.owner !== pi) continue;
      var v = 0;
      try{ v = (typeof sellValue === 'function') ? sellValue(t) : (t.base || 0); }catch(e){ v = t.base || 0; }
      if(v < bv){ bv = v; best = i; }
    }
    return best >= 0 ? {sell:[best]} : {bankrupt:true};
  }
  /* ゲストの答え：その選択の番（k）の物だけ受け取る。host がまだその選択に来ていなければ置いておく */
  function hostDo(pid, m){
    if(!OL.host || !OL.started || !m) return;
    var si = m.seat | 0;
    if(ownerOf(si) !== pid) return;                       // その席の持ち主だけ（自動・抜けた席は host）
    var k = (typeof m.k === 'number') ? m.k : OL.dataN;
    if(k < OL.dataN) return;                              // もう決まった選択（期限切れのあとに届いた等）
    OL.doQ[k] = {seat:si, tag:m.tag, v:m.v};
    takeDo(OL.w);
  }
  function takeDo(w){
    if(!OL.host || !w || w.done || w.sent) return;
    var m = OL.doQ[OL.dataN];
    if(!m || m.seat !== w.seat || w.tags.indexOf(m.tag) < 0) return;
    delete OL.doQ[OL.dataN];
    w.sent = true;
    stamp(m.seat, m.tag, m.v);
  }

  function askResync(){
    if(OL.host || OL.resyncing) return;
    OL.resyncing = true;
    sendTo(OL.hostConn, {t:'need'});
    setTimeout(function(){ OL.resyncing = false; }, 1500);
  }

  /* ══════════ 盤面の要約・差分・合わせ直し ══════════ */
  function hashState(){
    if(!G || !G.tiles) return 0;
    var h = 2166136261, i, t, p;
    var add = function(n){ h = Math.imul(h ^ (n | 0), 16777619) >>> 0; };
    var num = function(v){ return (v === undefined || v === null || v === false) ? -1 : (v === true ? 1 : (+v || 0)); };
    var str = function(s){ s = (s === undefined || s === null) ? '' : String(s); add(s.length + 1); for(var k = 0; k < s.length; k++) add(s.charCodeAt(k)); };
    for(i=0;i<G.tiles.length;i++){
      t = G.tiles[i];
      add(i); add((t.owner === undefined ? -1 : t.owner) + 2);
      add(t.lv | 0); add(t.landmark ? 1 : 0); add(t.frozen | 0); add(t.olym | 0);
      add(num(t.bm) + 2); add(num(t.ice) + 2); add(t.visits | 0);
      add(t.slide ? 1 : 0); add(t.sand ? 1 : 0); add(num(t.plague) + 2);
    }
    for(i=0;i<G.players.length;i++){
      p = G.players[i];
      add(Math.round((+p.cash || 0) / 1000)); add(p.pos | 0); add(p.laps | 0);
      add(p.jail | 0); add(p.out ? 1 : 0); add(p.items ? p.items.length : 0);
      add(p.odd | 0); add(p.even | 0); add(num(p.team) + 2); str(p.fcard);
      add(p.auto ? 1 : 0); add(p.forceDouble | 0); add(p.pay2 | 0); add(p.travel ? 1 : 0); add(p.escapeTix | 0);
    }
    add(G.turn | 0); add(G.turnsLeft | 0); add(Math.round((+G.infl || 1) * 10));
    add(num(G.festN) + 2); add(num(G.festTile) + 2); add(G.oeShared ? 1 : 0);
    return h >>> 0;
  }
  /* 盤面を「t<番号>.<項目>」「p<席>.<項目>」「g.<項目>」の平らな表にする。
     数・文字・真偽・null はそのまま、配列や物は JSON（頭に \u0001）。新しい項目も自動で入る */
  function flatVal(v){
    if(v === null) return null;
    var ty = typeof v;
    if(ty === 'number') return isFinite(v) ? v : 0;
    if(ty === 'string' || ty === 'boolean') return v;
    if(ty !== 'object') return undefined;
    if(v.nodeType || v === window) return undefined;
    try{ return '\u0001' + JSON.stringify(v); }catch(e){ return undefined; }
  }
  function unflat(v){ return (typeof v === 'string' && v.charCodeAt(0) === 1) ? JSON.parse(v.slice(1)) : v; }
  function flatten(){
    var o = {}, own = Object.prototype.hasOwnProperty, k, v;
    if(!G || !G.tiles) return o;
    G.tiles.forEach(function(t, i){
      for(k in t){ if(!own.call(t, k)) continue; v = flatVal(t[k]); if(v !== undefined) o['t' + i + '.' + k] = v; }
    });
    G.players.forEach(function(p, i){
      for(k in p){ if(!own.call(p, k) || SKIP_P[k]) continue; v = flatVal(p[k]); if(v !== undefined) o['p' + i + '.' + k] = v; }
    });
    for(k in G){ if(!own.call(G, k) || SKIP_G[k]) continue; v = flatVal(G[k]); if(v !== undefined) o['g.' + k] = v; }
    return o;
  }
  function diffFlat(a, b){
    var d = null;
    for(var k in b){ if(b[k] !== a[k]){ if(!d) d = {}; d[k] = b[k]; } }
    return d;
  }
  function restoreFlat(f){
    if(!f || !G || !G.tiles) return;
    var k, m, obj, key, v;
    for(k in f){
      m = /^([tpg])(\d*)\.(.+)$/.exec(k); if(!m) continue;
      key = m[3];
      if(m[1] === 't') obj = G.tiles[+m[2]];
      else if(m[1] === 'p'){ if(SKIP_P[key]) continue; obj = G.players[+m[2]]; }
      else { if(SKIP_G[key]) continue; obj = G; }
      if(!obj) continue;
      try{ v = unflat(f[k]); }catch(e){ continue; }
      obj[key] = v;
    }
  }
  function refreshAll(){
    try{ boardChanged(); }catch(e){}
    try{ updHUD(); }catch(e){}
    try{ if(typeof renderItems === 'function') renderItems(); }catch(e){}
  }
  /* 要約が合わない：host の盤面の写し（差分を積んだもの）に合わせる。それでも合わなければ丸ごと */
  function heal(a){
    if(OL.mir){
      restoreFlat(OL.mir);
      OL.heals++;
      refreshAll();
      if(hashState() === a.h) return;
    }
    askResync();
  }
  function restoreState(m){
    if(!m || !G || !m.f){ OL.resyncing = false; return; }
    OL.mir = m.f;
    restoreFlat(m.f);
    OL.recvSeq = OL.applySeq = (m.seq | 0);
    OL.dataN = (m.n | 0);
    OL.q = []; OL.gap = {};
    refreshAll();
    note('同期しなおしました', '盤面をホストに合わせました');
    OL.resyncing = false;
  }
  function jsonSafe(v){
    if(v === undefined) return null;
    try{ return JSON.parse(JSON.stringify(v)); }catch(e){ return null; }
  }

  /* ══════════ 待ちの表示（#olwait：だれが何を選んでいるか・のこり秒のリング） ══════════ */
  var CSS = ''
    + '#olwait{position:absolute;left:50%;bottom:96px;z-index:60;display:none;pointer-events:none;align-items:center;gap:14px;'
    +   'transform:translateX(-50%);padding:9px 28px 9px 10px;border-radius:999px;white-space:nowrap;'
    +   'background:linear-gradient(180deg,#34568E 0%,#18305C 52%,#0A1634 100%);border:3px solid #D9A93E;'
    +   'box-shadow:0 0 0 2px rgba(24,12,0,.6),0 12px 26px rgba(0,0,0,.55),inset 0 2px 0 rgba(255,240,190,.4),inset 0 -6px 12px rgba(0,0,0,.35);'
    +   'color:#FFF6E0;font:900 22px/1.25 var(--pop,"Mochiy Pop One"),"Noto Sans JP",sans-serif;text-shadow:0 2px 0 rgba(0,0,0,.6)}'
    + '#olwait.on{display:flex;animation:olwIn .34s cubic-bezier(.2,1.5,.4,1) both}'
    + '#olwait .olw-t b{display:inline-block;margin-right:2px;padding:1px 12px 3px;border-radius:10px;color:#FFFFFF;'
    +   'background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(0,0,0,.18)),var(--olc,#C9302C);'
    +   'box-shadow:0 2px 0 rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.45);text-shadow:0 2px 0 rgba(0,0,0,.55)}'
    + '@media (max-height:560px){#olwait{font-size:26px;bottom:104px}#olwait .olw-r{width:54px;height:54px}'
    +   '#olwait .olw-r svg{left:5px;top:5px;width:44px;height:44px}#olwait .olw-r i{font-size:21px}}'
    + '#olwait .olw-r{position:relative;flex:none;width:46px;height:46px;border-radius:50%;'
    +   'background:radial-gradient(circle at 34% 28%,#FFF8DA,#EAB94A 46%,#8A5A0C 100%);'
    +   'box-shadow:0 2px 0 rgba(0,0,0,.4),inset 0 -3px 5px rgba(0,0,0,.35)}'
    + '#olwait .olw-r svg{position:absolute;left:4px;top:4px;width:38px;height:38px;transform:rotate(-90deg)}'
    + '#olwait .olw-r circle{fill:none;stroke-width:5}'
    + '#olwait .olw-r .k{stroke:rgba(40,22,4,.55)}'
    + '#olwait .olw-r .f{stroke:#3FA2FF;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:0;'
    +   'animation:olwRing var(--olw-ms,30000ms) linear var(--olw-d,0ms) forwards}'
    + '#olwait .olw-r i{position:absolute;inset:0;display:grid;place-items:center;font:900 18px/1 "Noto Sans JP",sans-serif;'
    +   'font-style:normal;color:#3A2405;text-shadow:0 1px 0 rgba(255,250,220,.6)}'
    + '#olwait.late{border-color:#FF7A5A}'
    + '#olwait.late .olw-r .f{stroke:#FF5A5A}'
    + '@keyframes olwIn{from{transform:translateX(-50%) scale(.7)}to{transform:translateX(-50%) scale(1)}}'
    + '@keyframes olwRing{to{stroke-dashoffset:100}}'
    + 'html.fx-mob #olwait.on,html.fx-mob #olwait .olw-r .f{animation:none}'
    + '.ol-hmsg{grid-column:1 / -1;min-height:30px;margin:6px 0 0;font:900 20px/1.5 "Noto Sans JP",sans-serif;color:#FFE3A8;text-align:center}'
    + '.ol-hmsg.bad{color:#FFB9A6}'
    + '.ol-rules{margin-top:12px}';
  function styleOnce(){
    if(document.getElementById('olStyle')) return;
    var st = document.createElement('style');
    st.id = 'olStyle'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function waitEl(){
    if(!OL.waitBox || !OL.waitBox.isConnected){
      styleOnce();
      var d = document.createElement('div');
      d.id = 'olwait';
      d.setAttribute('role', 'status');
      var host = document.getElementById('stage') || document.body;
      host.appendChild(d);
      OL.waitBox = d;
    }
    return OL.waitBox;
  }
  function busy(seat, text){
    if(typeof dkBusyTag !== 'function') return;
    try{ dkBusyTag(seat, text); }catch(e){ console.error('[WP13b]', e); }
  }
  /* よその人間の選択を待つ間だけ出す（CPU・自動の席は host がすぐ決めるので出さない） */
  function showWait(seat, msg, w){
    var s = OL.seats[seat], p = G && G.players && G.players[seat];
    if(!s || s.kind !== 'human' || !s.alive || (p && p.auto)) return;
    var e = waitEl();
    var ms = OL.waitMs || WAIT_MS;
    var used = w ? Math.max(0, Math.min(ms, nowMs() - w.t0)) : 0;
    e.style.setProperty('--olc', PCOL[seat] || '#FFD24D');
    e.innerHTML = '<span class="olw-r" style="--olw-ms:' + ms + 'ms;--olw-d:-' + Math.round(used) + 'ms" aria-hidden="true">'
      + '<svg viewBox="0 0 38 38"><circle class="k" cx="19" cy="19" r="16" pathLength="100"/>'
      + '<circle class="f" cx="19" cy="19" r="16" pathLength="100"/></svg><i>' + Math.ceil((ms - used) / 1000) + '</i></span>'
      + '<span class="olw-t"><b>' + esc(s.name) + '</b> さんが' + esc(msg || '考えています') + '…</span>';
    e.classList.remove('late');
    e.classList.add('on');
    OL.waitOf = w || null;
    busy(seat, (s.name || '') + ' さんが' + (msg || '考えています'));
    OL.busySeat = seat;
    clearInterval(OL.waitT);
    var t0 = nowMs() - used, num = e.querySelector('.olw-r i');
    OL.waitT = setInterval(function(){
      var left = Math.max(0, Math.ceil((ms - (nowMs() - t0)) / 1000));
      if(num && num.textContent !== String(left)) num.textContent = left;
      e.classList.toggle('late', left <= 5);
    }, 250);
  }
  function hideWait(){
    clearInterval(OL.waitT); OL.waitT = 0;
    if(OL.waitBox) OL.waitBox.classList.remove('on', 'late');
    OL.waitOf = null;
    if(OL.busySeat >= 0){ busy(OL.busySeat, null); OL.busySeat = -1; }
  }
  function note(a, b){ toast('L', '📡', a, b || '', 2600); }

  /* ══════════ 選択を1つ取る（ここが同期の入口） ══════════ */
  /* 待ちを登録する。先に届いていた操作・ゲストの答えがあれば、ここで使う */
  function waitFor(seat, tags, local, mine, opt){
    var w = {seat:seat, tags:tags, local:local || null, pure:(opt && opt.pure) || null, mine:!!mine,
             k:OL.dataN, t0:nowMs(), done:false, cancelled:false, sent:false, timer:0, own:0, res:null, outer:null};
    w.pr = new Promise(function(r){ w.res = r; });
    if(OL.w && !OL.w.done) w.outer = OL.w;
    OL.w = w;
    armDeadline(w);
    pump();
    if(!w.done) takeDo(w);
    return w;
  }
  function send(w, tag, v){
    if(!w || w.done || w.sent) return;
    w.sent = true;
    v = jsonSafe(v);
    if(OL.host) stamp(w.seat, tag, v);
    else sendTo(OL.hostConn, {t:'do', seat:w.seat, tag:tag, v:v, k:w.k});
  }
  /* 本人の画面の選択を閉じる（期限切れ・自動・抜けた時。答えは host が出す） */
  function cancelLocal(w){
    try{
      if(OL.localPick){ var f = OL.localPick; OL.localPick = null; f({tag:'cancel'}); }
      if(typeof DKT_G === 'object' && DKT_G && DKT_G.pick && typeof dktPickEnd === 'function') dktPickEnd(-1);
      var pe = document.getElementById('pickeye');
      if(pe && pe.classList.contains('on')){ var b0 = pe.querySelector('button'); if(b0) b0.click(); }
      var mw = document.getElementById('modalWrap');
      if(mw && mw.classList.contains('on')){
        var bs = Array.prototype.slice.call(mw.querySelectorAll('[data-act]')).filter(function(b){ return !b.disabled; });
        var pref = ['no', 'cancel', 'close', 'stop', 'skip', 'ok'], pick = null;
        for(var i = 0; i < pref.length && !pick; i++){
          for(var j = 0; j < bs.length; j++) if(bs[j].getAttribute('data-act') === pref[i]){ pick = bs[j]; break; }
        }
        if(!pick) for(var k = 0; k < bs.length; k++) if(bs[k].getAttribute('data-act') !== 'bankrupt'){ pick = bs[k]; break; }
        if(pick) pick.click();
      }
    }catch(e){ console.error('[WP13b]', e); }
  }
  /* 自分の席なら local() を動かして結果を配る。よその席なら待つ。
     自分の端末で選んでいる途中の小さな選択（local の中の dvAsk）は配らずにその場で決める */
  async function ask(seat, tag, local, hint, opt){
    if((OL.inLocal[seat] | 0) > 0) return Promise.resolve().then(local);
    var mine = isMine(seat);
    var w = waitFor(seat, [tag], local, mine, opt);
    if(!w.done){
      if(!mine) showWait(seat, hint, w);
      else runLocal(w, tag, local);
    }
    var a = await w.pr;
    if(!a.local) reseed(a.seq);        // 待っている間に消えた乱数を捨てて、全端末で同じ所から続ける
    return a.v;
  }
  function runLocal(w, tag, local){
    var s = w.seat, p = G && G.players && G.players[s];
    ownTimer(w);
    if(p && p.auto) autoWatch(w);
    OL.inLocal[s] = (OL.inLocal[s] | 0) + 1;
    var out = function(){ OL.inLocal[s] = Math.max(0, (OL.inLocal[s] | 0) - 1); };
    Promise.resolve().then(local).then(function(v){
      out();
      if(!w.done && !w.cancelled) send(w, tag, v);
    }, function(e){
      out();
      console.error('[WP13b]', e);
      if(!w.done && !w.cancelled) send(w, tag, fallbackValue(w));
    });
  }

  /* ══════════ 自動の人に画面を出さない（C14 の安全網） ══════════
     自動の席の選択で、その選択が開いた画面（ポップアップ・エリア選び・出目えらび）が
     1秒たっても開いたままなら、閉じて CPU の弱い判断で答える。
     選択より前から開いていた画面（ボーナスゲームの台など）は数えない。 */
  var AUTO_UI_MS = 1000;
  function uiSig(){
    var mw = document.getElementById('modalWrap'), body = document.getElementById('modalBody');
    var on = !!(mw && mw.classList.contains('on'));
    var pk = (typeof DKT_G === 'object' && DKT_G && DKT_G.pick) ? DKT_G.pick : null;
    var pe = document.getElementById('pickeye');
    return { m:on ? ((body || mw).firstElementChild || mw) : null, p:pk ? (pk.seq || pk) : null,
             e:!!(pe && pe.classList.contains('on')) };
  }
  function uiNew(s0){
    var s = uiSig();
    return !!((s.m && s.m !== s0.m) || (s.p && s.p !== s0.p) || (s.e && !s0.e) || OL.localPick);
  }
  function autoWatch(w){
    var s0 = uiSig(), t0 = nowMs();
    var iv = setInterval(function(){
      if(w.done || w.sent || w.cancelled || !OL.started){ clearInterval(iv); return; }
      if(nowMs() - t0 < AUTO_UI_MS || !uiNew(s0)) return;
      clearInterval(iv);
      w.cancelled = true;
      cancelLocal(w);
      send(w, w.tags[0], fallbackValue(w));
    }, 200);
  }
  /* オフライン：自動の席で画面が開いたら、同じように閉じて答える（dvAsk の約束の安全網） */
  function autoGuard(seat, tag, run){
    var w = {seat:seat, tags:[tag]};
    return new Promise(function(res){
      var done = false, s0 = uiSig(), t0 = nowMs();
      var fin = function(v){ if(done) return; done = true; clearInterval(iv); res(v); };
      var iv = setInterval(function(){
        if(done) return;
        if(!G || G.over){ fin(fallbackValue(w)); return; }
        if(nowMs() - t0 < AUTO_UI_MS || !uiNew(s0)) return;
        cancelLocal(w);
        fin(fallbackValue(w));
      }, 200);
      Promise.resolve().then(run).then(fin, function(e){ console.error('[WP13b]', e); fin(fallbackValue(w)); });
    });
  }
  function autoSeat(seat){
    var p = G && !G.over && G.players && G.players[seat];
    if(!p || p.kind === 'cpu') return false;
    try{ return (typeof dkIsAuto === 'function') ? !!dkIsAuto(seat) : !!p.auto; }catch(e){ return !!p.auto; }
  }

  /* §6 の契約 dvAsk：人間や CPU の選択を1つ取る。
     オンライン中は、選ぶ人の端末で local() を動かし、その結果を全員に配る（値は JSON にできる物だけ）。
     オフラインは元の dvAsk（9g-turn.js が宣言し直していればそれ）に任せる */
  OL.baseAsk = window.dvAsk;
  OL.baseDice = window.dvQueueDice;
  window.dvAsk = function(seat, tag, local, hint){
    if(OL.started && G && !G.over) return ask(seat, tag, local, hint);
    var base = OL.baseAsk;
    var run = function(){ return (typeof base === 'function') ? base(seat, tag, local, hint) : Promise.resolve().then(local); };
    return autoSeat(seat) ? autoGuard(seat, tag, run) : run();
  };
  /* §6 の契約 dvQueueDice：オンライン中は、振る人の端末で目を決めて OL.diceQ に積む */
  window.dvQueueDice = function(seat, force, impact, target){
    if(!(OL.started && G && !G.over)){
      return (typeof OL.baseDice === 'function') ? Promise.resolve(OL.baseDice(seat, force, impact, target)) : Promise.resolve();
    }
    var pure = function(){ return preRoll(seat, force, impact, target); };
    return ask(seat, 'dice', function(){ return pure(); }, 'サイコロを振っています', {pure:pure})
      .then(function(v){ OL.diceQ = Array.isArray(v) ? v.slice() : null; });
  };
  /* この端末がその席の選択を決めるか（オフラインは全部この端末）。SV を動かす処理を本人だけにする時に使う */
  window.dvIsMine = function(seat){ return (OL.started && G && !G.over) ? isMine(seat) : true; };

  /* ══════════ 差し替える関数たち ══════════ */
  function usesAsk(fn){
    try{ return /\bdvAsk\s*\(/.test(Function.prototype.toString.call(fn)); }catch(e){ return false; }
  }
  function install(){
    if(OL.orig.installed) return;
    OL.orig = {
      installed:true, random:Math.random,
      rollPair:window.rollPair, takeRoll:window.takeRoll, pickTile:window.pickTile,
      shakePhase:window.shakePhase, useItem:window.useItem, tickClock:window.tickClock,
      weekIndex:window.weekIndex, newGame:window.newGame, finish:window.finish, dkSetAuto:window.dkSetAuto
    };
    OL.real = OL.orig.random;
    Math.random        = sharedRandom;
    window.rollPair    = olRollPair;
    window.takeRoll    = olTakeRoll;
    /* 中で dvAsk を使う版なら、そのまま任せる（包むと同じ選択を2回配ってしまう） */
    if(typeof OL.orig.pickTile === 'function' && !usesAsk(OL.orig.pickTile)) window.pickTile = olPickTile;
    if(typeof OL.orig.shakePhase === 'function' && !usesAsk(OL.orig.shakePhase)) window.shakePhase = olShakePhase;
    window.useItem     = olUseItem;
    window.tickClock   = olTickClock;
    /* 週替わりは端末の時計に依存させない（ホストの週を全員が使う。時刻を渡した時はその時刻で） */
    window.weekIndex   = function(t){ return (typeof t === 'number' && OL.orig.weekIndex) ? OL.orig.weekIndex(t) : OL.week; };
    window.newGame     = olNewGame;
    window.finish      = olFinish;
    if(typeof OL.orig.dkSetAuto === 'function') window.dkSetAuto = olSetAuto;
  }
  function uninstall(){
    if(!OL.orig.installed) return;
    var O = OL.orig;
    Math.random = O.random;
    ['rollPair','takeRoll','pickTile','shakePhase','useItem','tickClock','weekIndex','newGame','finish','dkSetAuto']
      .forEach(function(k){ if(O[k] !== undefined) window[k] = O[k]; });
    OL.orig = {}; OL.rng = null; OL.diceQ = null;
    hideWait();
  }

  function olFinish(pi, reason, col){
    var r = OL.orig.finish(pi, reason, col);
    OL.started = false;
    uninstall();
    return r;
  }

  /* サイコロ：配られた目があればそれを使う（各端末で振り直さない） */
  function olRollPair(force, forceDouble, die){
    if(OL.diceQ && OL.diceQ.length) return OL.diceQ.shift();
    return OL.orig.rollPair(force, forceDouble, die);
  }

  /* 時間切れは host が決めて全員へ（各端末の時計のずれで決着の場所が変わらないように） */
  function olTickClock(dt){
    if(!G || G.over || !cfg.timeLimit || !G.running) return;
    if(G.clock - dt / 1000 > 0) return OL.orig.tickClock(dt);
    G.clock = 0;
    if(OL.host && !OL.tuSent){ OL.tuSent = true; ctl('timeup'); }
    var el = document.getElementById('pClock');
    if(el && el.textContent !== '0:00'){ el.textContent = '0:00'; el.classList.add('warn'); }
  }

  /* 席ごとの持ち物は「自分の保存データ」ではなく、配られた情報から作る。
     初期化は C07 の dkInitPlayers（持ち込み・奇数/偶数・フォーチュンカード）に任せる。ITEMS と奇数/偶数2回は配らない */
  function olNewGame(){
    var map = MAPS.find(function(m){ return m.id === cfg.mapId; }) || MAPS[0];
    var seats = OL.seats.slice(0, cfg.n);
    G = {
      map: map, tiles: buildTiles(map),
      players: seats.map(function(s, i){
        var pr = s.prof || {};
        var cpu = s.kind === 'cpu';
        var card = cardById(pr.cardId) || CARDPOOL[i % CARDPOOL.length];
        var slots = cpu ? [] : (Array.isArray(pr.slots) ? pr.slots : []);
        var pend;
        if(cpu){
          var n = cfg.ai === 2 ? 3 : cfg.ai === 1 ? 2 : 1, pp = PENDANTS.slice();
          pend = [];
          for(var k=0;k<n && pp.length;k++) pend.push(pp.splice((Math.random()*pp.length)|0, 1)[0]);
        } else pend = slots.map(pendById).filter(Boolean);
        return {
          name:s.name, kind:(cpu ? 'cpu' : 'human'), ch:card.art, card:card.id,
          stats:cardStats(card.id, pr.lv || 1, slots), cardLv:pr.lv || 1,
          skill:card.sk, skillKind:(card.kind === undefined ? 0 : card.kind),
          skillPow:(card.rar === 'SS' ? 0.18 : card.rar === 'S' ? 0.12 : 0.08),
          cash:cfg.cash, pos:0, laps:0, jail:0, out:false, dblRun:0,
          odd:0, even:0, items:[],
          skillLeft:card.sk.uses, mana:0,
          freeToll:0, halfBuild:0, salaryX2:0, forceDouble:0, chooseEye:0, tollUp:0,
          render:tileCenter(0), hopY:0, squash:1, offx:0, offy:0, face:1, jam:3,
          pend:pend, pboost:{},
          pendLv:cpu ? {} : (pr.pendLv || {}),
          dieId:cpu ? 'd0' : (pr.dieId || pr.die || 'd0'),
          dieLv:cpu ? 1 : Math.max(1, Math.min(10, (pr.dieLv | 0) || 1)),
          dieKw:cpu ? null : (pr.dieKw || null),
          fcard:null, pay2:0, skillP:0, auto:false, autoWeak:false
        };
      }),
      turn:0, turnsLeft:cfg.turns, over:false, winner:-1, winReason:'', alarm:null,
      infl:1, reach:-1, winX:1, clock:cfg.timeLimit, lastTick:0, ev:{}
    };
    thisWeek().apply(G);                  // オフラインの newGame と同じ順（今週 → 持ち込み）
    var carry = seats.map(function(s){ return (s.kind === 'human' && s.prof && s.prof.carry) ? s.prof.carry : null; });
    try{ if(typeof dkInitPlayers === 'function') dkInitPlayers(G, carry); }catch(e){ console.error('[WP13b]', e); }
    var eq = true;
    G.players.forEach(function(p, i){
      if(!Array.isArray(p.items)) p.items = [];
      if(p.fcard === undefined) p.fcard = null;
      if(p.carry === undefined) p.carry = carry[i] || null;
      if(p.pay2 === undefined) p.pay2 = 0;
      if(p.skillP === undefined) p.skillP = 0;
      if(p.auto === undefined) p.auto = false;
      if(cfg.team && p.team === undefined) p.team = i % 2;
      if((p.odd | 0) !== (p.even | 0)) eq = false;
    });
    if(G.oeShared === undefined && eq) G.oeShared = true;
    useUpCarry();
    destPin = null; stepPreview = null; diceAnim = null; fxList.length = 0;
  }
  /* 自分の持ち込み品はこの試合で使い切り（オフラインの newGame が SV.bag を空にするのと同じ） */
  function useUpCarry(){
    try{
      var me = mySeat(); if(me < 0) return;
      var pr = OL.seats[me] && OL.seats[me].prof;
      if(!pr || !pr.carry || typeof SV !== 'object' || !SV || !SV.carry || typeof SV.carry !== 'object') return;
      Object.keys(SV.carry).forEach(function(k){
        SV.carry[k] = (k === 'magic') ? null : (typeof SV.carry[k] === 'boolean' ? false : 0);
      });
      if(typeof saveNow === 'function') saveNow();
    }catch(e){ console.error('[WP13b]', e); }
  }

  /* ── サイコロを振る（手番の人だけが決めて、目そのものを配る） ──
     1組目の決め方は doRoll と同じ順：ダブル確定 → ゲージインパクト（合計＝target）→ ふつう */
  function preRoll(pi, force, impact, target){
    var p = G.players[pi], die = dieOf(pi);
    var roll = OL.orig.rollPair || rollPair;       // 配られた目の列ではなく、本物の2個振り
    var wantDbl = p.forceDouble > 0 && force !== 'odd';
    var first = wantDbl ? roll(force, true, die)
      : (impact && target >= 2 && target <= 12) ? dkGaugePair(target, die, force)
      : roll(force, false, die);
    return [ first, roll(force, false, DICE[0]) ];
  }
  /* CPU・自動の人の振り方（ねらいの強さ .6/1/1.3。時間切れの自動は弱く、奇数/偶数を使わない） */
  function cpuRollChoice(pi){
    var p = G.players[pi], force = null;
    var lvl = (p.kind === 'cpu') ? (cfg.ai | 0) : (p.autoWeak ? 0 : 1);
    lvl = Math.max(0, Math.min(2, lvl));
    if(lvl >= 1 && (p.odd | 0) > 0 && (p.even | 0) > 0 && typeof bestParity === 'function' && typeof avgScore === 'function'){
      var so = bestParity(pi, 'odd'), se = bestParity(pi, 'even'), sn = avgScore(pi), mg = (lvl === 2 ? 6 : 16);
      if(so > sn + mg && so >= se) force = 'odd';
      else if(se > sn + mg) force = 'even';
    }
    var pImp = (typeof dktImpactP === 'function') ? dktImpactP(p, dieOf(pi)) : 0.3;
    var impact = Math.random() < Math.min(0.97, pImp * [0.6, 1, 1.3][lvl]);
    var target = (impact && typeof dktCpuTarget === 'function') ? dktCpuTarget(pi, force) : 0;
    var eye = (p.chooseEye > 0 && typeof dktBestTotal === 'function') ? dktBestTotal(pi, null) : 0;
    if(eye){ force = null; impact = false; target = 0; }
    return {force:force, impact:impact, eye:eye, target:target, dice:preRoll(pi, force, impact, target),
            pp:{odd:p.odd | 0, even:p.even | 0}};
  }

  /* 手番の人の操作を1つ取る（サイコロ・能力のどれか）。w が先に決まったら何もしない */
  function localTurnAction(pi, w){
    var p = G.players[pi];
    if(p.kind === 'cpu' || p.auto){
      return (async function(){
        stepPreview = {from:p.pos, max:12};
        gaugeOn = true; try{ $('#diceui').classList.add('on'); }catch(e){}
        await wait(750);
        if(w.done || w.cancelled) return null;
        return {tag:'roll', v:cpuRollChoice(pi)};
      })();
    }
    /* 人間：9g-turn.js のサイコロUI（長押しゲージ・奇数/偶数のモード）で決め、目まで決めてから配る。
       UI の中の小さな選択（奇数/偶数の追加購入 'oebuy' など）は配らずに決め、回数は pp で一緒に配る */
    OL.inLocal[pi] = (OL.inLocal[pi] | 0) + 1;
    return new Promise(function(res){
      var fin = function(x){ OL.inLocal[pi] = Math.max(0, (OL.inLocal[pi] | 0) - 1); res(x); };
      OL.localPick = function(o){ OL.localPick = null; try{ dktInputCancel(o); }catch(e){} };
      Promise.resolve(dkRollInput(pi)).then(function(o){
        OL.localPick = null;
        if(w.done || w.cancelled || !o || o.tag === 'cancel'){ fin(null); return; }
        if(o.tag === 'skill'){ fin({tag:'skill', v:1}); return; }
        if(o.tag === 'item'){ fin(o); return; }
        var eye = o.eye || 0, force = eye ? null : (o.force || null);
        var impact = !eye && !!o.impact, target = impact ? (o.target || 0) : 0;
        fin({tag:'roll', v:{force:force, impact:impact, eye:eye, target:target,
                            dice:preRoll(pi, force, impact, target), pp:{odd:p.odd | 0, even:p.even | 0}}});
      }, function(e){ console.error('[WP13b]', e); fin(null); });
    });
  }
  async function turnAct(pi){
    var mine = isMine(pi);
    var w = waitFor(pi, TURN_TAGS, null, mine);
    if(!w.done){
      if(!mine){
        showWait(pi, 'サイコロを振ろうとしています', w);
        try{ $('#skillBtn').onclick = null; }catch(e){}
      } else {
        ownTimer(w);
        localTurnAction(pi, w).then(function(o){
          if(w.done || w.cancelled) return;
          if(!o){ if(isMine(pi)) send(w, 'roll', cpuRollChoice(pi)); return; }
          send(w, o.tag, o.v);
        }, function(e){
          console.error('[WP13b]', e);
          if(!w.done && !w.cancelled) send(w, 'roll', cpuRollChoice(pi));
        });
      }
    }
    var a = await w.pr;
    if(!a.local) reseed(a.seq);
    return a;
  }

  async function applyRoll(pi, v){
    var p = G.players[pi];
    v = v || {};
    gaugeOn = false; try{ $('#diceui').classList.remove('on'); }catch(e){} stepPreview = null;
    /* UI の中で奇数/偶数を買い足した人は、その回数に合わせる（本人の端末で決まった数） */
    if(v.pp && typeof v.pp === 'object'){
      p.odd = Math.max(0, Math.min(99, v.pp.odd | 0));
      p.even = Math.max(0, Math.min(99, v.pp.even | 0));
    }
    var force = (v.force === 'odd' || v.force === 'even') ? v.force : null;
    if(force){
      if(!((p[force] | 0) > 0)) force = null;
      else { p.odd = Math.max(0, (p.odd | 0) - 1); p.even = Math.max(0, (p.even | 0) - 1); }   // 奇数/偶数は共通の回数（両方−1）
    }
    var fixed = 0;
    if(v.eye && p.chooseEye > 0){ p.chooseEye--; fixed = v.eye | 0; force = null; }
    OL.diceQ = Array.isArray(v.dice) ? v.dice.slice() : null;
    try { return await doRoll(pi, force, !!v.impact && !fixed, fixed, v.target || 0); }
    finally { OL.diceQ = null; }
  }

  function applyCpuItem(pi, k){
    var p = G.players[pi], id = p.items && p.items[k];
    if(!id) return;
    p.items.splice(k, 1); renderItems();
    var it = itemById(id);
    if(it) toast('L', it.ic, 'CPUがアイテム使用', it.nm, 2000);
    if(id === 'angel')  p.freeToll++;
    if(id === 'half')   p.halfBuild++;
    if(id === 'salary') p.salaryX2++;
    if(id === 'double') p.forceDouble++;
  }

  function cancelled(){ return {a:1, b:1, total:2, isDbl:false, cancelled:true}; }
  async function olTakeRoll(pi){
    var p = G.players[pi], guard = 0;
    while(guard++ < 12){
      if(!G || G.over || p.out) return cancelled();
      var a = await turnAct(pi);
      if(!G || G.over || p.out) return cancelled();
      if(a.tag === 'skill'){
        await useSkill(pi);
        /* 能力で監獄へ飛んだ・破産した・決着した時は、もう振らない（9g-turn.js の takeRoll と同じ） */
        if(!G || G.over || p.out || p.jail > 0 || p.travel) return cancelled();
        continue;
      }
      if(a.tag === 'item'){
        await OL.orig.useItem(pi, a.v);
        if(!G || G.over || p.out || p.jail > 0) return cancelled();
        continue;
      }
      if(a.tag === 'cpuitem'){ applyCpuItem(pi, a.v); continue; }
      return await applyRoll(pi, a.v);
    }
    return cancelled();
  }

  function olPickTile(pi, msg, filter){
    return ask(pi, 'tile',
      function(){ return OL.orig.pickTile(pi, msg, filter); },
      'エリアを選んでいます');
  }

  function olUseItem(pi, k){
    if(!isMine(pi)) return Promise.resolve();
    if(OL.localPick && G && G.phase === 'wait'){
      var f = OL.localPick; OL.localPick = null;
      f({tag:'item', v:k});
      return Promise.resolve();
    }
    return OL.orig.useItem(pi, k);
  }

  /* 揺らす（妨害）：押したかどうかと当たりを配る。回数は全端末で同じように減らす */
  function olShakePhase(me){
    var p = G.players[me], before = p ? (p.jam | 0) : 0;
    return ask(me, 'jam', function(){
      return Promise.resolve(OL.orig.shakePhase(me)).then(function(win){
        return {w:!!win, u:!!(p && (p.jam | 0) < before)};
      });
    }, '揺らすか考えています').then(function(v){
      if(v && typeof v === 'object'){ if(p) p.jam = Math.max(0, before - (v.u ? 1 : 0)); return !!v.w; }
      return !!v;
    });
  }

  /* ══════════ エモートといいね（C15・G06・G21） ══════════
     手順とは別の軽い知らせ。送った本人の端末ですぐ出し、host が部屋の全員へ配る。
     CPU など、この端末の人でない席は、各端末が同じ出来事で同じように出す（配らない）。 */
  function freshCounts(){ if(OL.likeG !== G){ OL.likeG = G; OL.likes = {}; OL.emoAt = {}; } }
  function cleanEmo(list){
    if(!Array.isArray(list)) list = [list];
    var out = [];
    for(var i = 0; i < list.length && out.length < EMO_MAX; i++){
      var e = list[i];
      if(typeof e !== 'string') continue;
      e = e.replace(/[<>&"'`]/g, '').slice(0, 12);
      if(e) out.push(e);
    }
    return out;
  }
  function emoOk(seat){
    var t = nowMs(), last = OL.emoAt[seat];
    if(last !== undefined && t - last < EMO_GAP) return false;
    OL.emoAt[seat] = t;
    return true;
  }
  function showEmo(seat, list){
    if(typeof dkEmoteShow !== 'function') return;
    try{ dkEmoteShow(seat, list.slice()); }catch(e){ console.error('[WP13b]', e); }
  }
  function likeN(seat){ return OL.likes[seat] | 0; }
  function likeTotal(){ var s = 0; for(var k in OL.likes) s += OL.likes[k] | 0; return s; }
  function showLike(seat){
    if(typeof dkLikeShow !== 'function') return;
    try{ dkLikeShow(seat, likeN(seat), likeTotal()); }catch(e){ console.error('[WP13b]', e); }
  }
  function onlineNow(){ return !!(OL.started && G && !G.over); }
  /* window.dvSendEmote(seat, list)：seat＝送る人の席。4個まで・3秒に1回。出したら true */
  window.dvSendEmote = function(seat, list){
    freshCounts();
    seat = seat | 0; list = cleanEmo(list);
    if(!list.length || !emoOk(seat)) return false;
    showEmo(seat, list);
    if(onlineNow() && seatHere(seat)){
      var m = {t:'emo', s:seat, e:list};
      if(OL.host) bcast(m); else sendTo(OL.hostConn, m);
    }
    return true;
  };
  /* window.dvSendLike(seat)：seat＝いいねを送る人の席。1試合10回まで。
     全員の端末で dkLikeShow(seat, その人の累計, 部屋の合計)。送れたら true */
  window.dvSendLike = function(seat){
    freshCounts();
    seat = seat | 0;
    if(likeN(seat) >= LIKE_MAX) return false;
    OL.likes[seat] = likeN(seat) + 1;
    showLike(seat);
    if(onlineNow() && seatHere(seat)){
      var m = {t:'like', s:seat};
      if(OL.host) bcast(m); else sendTo(OL.hostConn, m);
    }
    return true;
  };
  function gotEmo(pid, m){
    if(!onlineNow() || !m) return;
    freshCounts();
    var si = m.s | 0, list = cleanEmo(m.e);
    if(!list.length) return;
    if(OL.host){
      var s = OL.seats[si];
      if(!s || s.pid !== pid) return;                    // 他人の席のふりはできない
      if(!emoOk(si)) return;
      showEmo(si, list);
      bcast({t:'emo', s:si, e:list}, pid);
    } else if(!seatHere(si)) showEmo(si, list);
  }
  function gotLike(pid, m){
    if(!onlineNow() || !m) return;
    freshCounts();
    var si = m.s | 0;
    if(OL.host){
      var s = OL.seats[si];
      if(!s || s.pid !== pid || likeN(si) >= LIKE_MAX) return;
      OL.likes[si] = likeN(si) + 1;
      showLike(si);
      bcast({t:'like', s:si}, pid);
    } else if(!seatHere(si) && likeN(si) < LIKE_MAX){
      OL.likes[si] = likeN(si) + 1;
      showLike(si);
    }
  }

  /* ══════════ タイトルにボタンを足す（読み込めた時だけ） ══════════ */
  function addButton(){
    /* Artifact 版は外への接続が止められている。ボタンを出さない＝黙ってCPU対戦のまま。 */
    if(window.claude) return;
    var go = document.querySelector('#title .go');
    if(!go || document.getElementById('toOnline')) return;
    var b = document.createElement('button');
    b.className = 'btn ghost';
    b.id = 'toOnline';
    b.textContent = 'オンラインで遊ぶ';
    b.style.marginLeft = '14px';
    b.onclick = function(){ SFX.click(); ac(); openOnline(); };
    go.appendChild(b);
  }

  loadPeer(function(ok){ if(ok) addButton(); });

  /* テスト用の入口（通信をモックに差し替えて検証するときだけ使う） */
  window.DV_OL = OL;
  window.DV_OL_API = {
    open:openOnline, host:startHost, join:startGuest, begin:beginGame,
    apply:enqueue, hash:hashState, snap:flatten, restore:restoreFlat,
    seed:function(s, q){ OL.seed = s; reseed(q||0); },
    rng:function(){ return OL.rng; }, mkCode:mkCode, cleanCode:cleanCode, leave:leave,
    profile:myProfile, onData:onData, reset:resetSeq, gone:gone,
    waitFor:function(seat, tags){ return waitFor(seat, tags, null, false).pr; },
    mySeat:mySeat, isMine:isMine, ownerOf:ownerOf, auto:requestAuto, room:showRoom,
    showWait:function(seat, msg){ showWait(seat, msg, null); }, hideWait:hideWait
  };
}
dvOnlineBoot();
