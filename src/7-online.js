/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — オンライン対戦（7-online.js）
   ──────────────────────────────────────────────────────────────
   ・サーバを持たない。ブラウザ同士を直接つなぐ（WebRTC / PeerJS）。
     合図（シグナリング）だけ PeerJS の公開ブローカーを借りる。鍵も登録も不要。
   ・盤面は送らない。「誰が何をしたか」だけを送り、各端末が同じ手順で同じ結果を出す。
     そのため乱数はホストが決めた種から全員で共有する（xorshift32）。
     さらに操作1つごとに種を振り直すので、片側だけで起きた乱数消費（演出など）が
     次の操作までに必ず消える＝ズレが積み上がらない。
   ・オンラインを使わないときは、既存コードに一切さわらない（差し替えは開始時だけ）。
   ・Artifact 版（game.html）は外部接続が止められるので、読み込み失敗＝黙ってオフライン。
   ・Date.now / new Date は使わない。
   ══════════════════════════════════════════════════════════════ */
function dvOnlineBoot(){

  var PEER_URL  = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
  /* 読み上げやすい字だけ。0/1/O/I/L は入れない */
  var ALPHA     = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var IDPREFIX  = 'dvkg';        // 公開ブローカー上での当ゲームの名前空間
  var MAXSEAT   = 4;
  var TURN_TAGS = ['roll','skill','item','cpuitem'];

  var OL = {
    lib:false, peer:null, me:'', hostId:'', host:false, code:'',
    conns:{},            // ホスト: 相手pid -> connection ／ ゲスト: ホストだけ
    hostConn:null,
    members:[],          // ロビーの顔ぶれ [{pid,name,ready,prof}]
    seats:[],            // 試合中の席 [{name,kind,pid,alive,prof}]
    prof:null,
    on:false,            // ロビーに入っている
    started:false,       // 試合が始まっている
    seed:0, week:0,
    nextSeq:0,           // ホストが配る通し番号
    applySeq:0,          // 自分が次に適用する番号
    gap:{},              // 飛んできた先の操作の置き場
    w:null,              // いま待っている選択 {seat,tags,res}
    rng:null, real:Math.random,
    diceQ:null,
    orig:{},
    waitBox:null,
    resyncing:false,
    seen:{}, beatIn:0, beatOut:0, wantN:0    // 生存確認（performance.now はこの端末の中だけで使う）
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
  function toHost(msg){
    if(OL.host) onData(OL.me, msg); else sendTo(OL.hostConn, msg);
  }

  function wire(conn){
    OL.seen[conn.peer] = nowMs();
    conn.on('data', function(m){
      OL.seen[conn.peer] = nowMs();
      try{ onData(conn.peer, m); }catch(e){}
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
      if(OL.started) note('ホストとの接続が切れました', 'ここからはCPUが進めます');
      else leave(true);
    }
  }

  /* ══════════ ロビー ══════════ */
  function myProfile(name){
    var id = (typeof SV !== 'undefined' && SV.equip) ? SV.equip : CARDPOOL[0].id;
    var o  = (typeof SV !== 'undefined' && SV.cards && SV.cards[id]) ? SV.cards[id] : {lv:1};
    /* ペンダントの強化値とサイコロの Lv も配る（端末ごとの保存データで確率がずれないように） */
    var hasSV = (typeof SV !== 'undefined' && SV);
    var pendLv = {};
    if(hasSV && SV.slots) SV.slots.slice(0,4).forEach(function(pid){
      var q = SV.pendants && SV.pendants[pid];
      if(pid) pendLv[pid] = Math.max(1, Math.min(8, (q && (q.lv | 0)) || 1));
    });
    var dieId = (hasSV && SV.die && SV.dice && SV.dice[SV.die]) ? SV.die : 'd0';
    var dieLv = (hasSV && SV.dice && SV.dice[dieId]) ? Math.max(1, Math.min(10, (SV.dice[dieId] | 0) || 1)) : 1;
    return {
      name: String(name||'プレイヤー').slice(0,10),
      cardId: id, lv: o.lv || 1,
      slots: (typeof SV !== 'undefined' && SV.slots) ? SV.slots.slice(0,4) : [],
      bag:   (typeof SV !== 'undefined' && SV.bag)   ? SV.bag.slice(0,3)   : [],
      die:   (typeof SV !== 'undefined' && SV.die)   ? SV.die              : 'd0',
      pendLv: pendLv, dieId: dieId, dieLv: dieLv
    };
  }

  function openOnline(){
    if(!OL.lib) return;
    var nm = (typeof SV !== 'undefined' && SV.name) ? SV.name : 'あなた';
    var el = mkScreen('online',
      '<div style="max-width:680px;margin:0 auto;padding:28px 8px;text-align:center">'
      + '<h2 style="font-family:var(--pop);font-size:30px;color:#FFE9B5;margin:0 0 6px">オンラインで遊ぶ</h2>'
      + '<p style="color:#9FB6CC;font-size:13.5px;margin:0 0 22px;line-height:1.8">'
      +   '合言葉を伝えるだけで、はなれた友達と同じ盤で遊べます。<br>'
      +   'アプリの登録も、アカウントもいりません。最大4人・足りない席はCPUが入ります。</p>'
      + '<div style="margin:0 0 20px"><label style="color:#9FB6CC;font-size:13px;margin-right:8px">なまえ</label>'
      +   '<input id="olName" type="text" maxlength="10" value="' + esc(nm) + '" '
      +   'style="font-size:16px;padding:8px 12px;border-radius:8px;border:1px solid #33507a;'
      +   'background:#0b1729;color:#EAF2FF;width:190px;text-align:center"></div>'
      + '<div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">'
      +   '<button class="btn gold" id="olHost">部屋をつくる</button>'
      +   '<button class="btn gold" id="olJoin">部屋に入る</button></div>'
      + '<div id="olJoinBox" style="display:none;margin-top:20px">'
      +   '<div style="color:#9FB6CC;font-size:13px;margin-bottom:8px">友達から聞いた4文字を入れてください</div>'
      +   '<input id="olCode" type="text" maxlength="4" placeholder="KAME" '
      +   'style="font-family:var(--pop);font-size:34px;letter-spacing:12px;padding:8px 10px 8px 22px;'
      +   'width:230px;text-align:center;text-transform:uppercase;border-radius:10px;'
      +   'border:1px solid #33507a;background:#0b1729;color:#FFD24D">'
      +   '<div style="margin-top:14px"><button class="btn gold" id="olGo">つなぐ</button></div>'
      +   '<div id="olMsg" style="color:#9FB6CC;font-size:13px;margin-top:12px;min-height:20px"></div></div>'
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
    el.querySelector('#olBack').onclick = function(){ SFX.click(); leave(false); screenTo('title'); };
    screenTo('online');
  }

  function nameNow(){
    var i = document.getElementById('olName');
    return i && i.value ? i.value.slice(0,10) : 'プレイヤー';
  }

  function startHost(){
    OL.prof = myProfile(nameNow());
    tryHost(0);
  }
  /* 部屋がつくれなかった時。黙ってタイトルへ戻すと「押しても何も起きない」に見えるので理由を出す。
     （待ち合わせ場所＝PeerJS の公開ブローカーが落ちている時にここへ来る） */
  function hostFailed(){
    leave(false); screenTo('title');
    note('部屋がつくれませんでした', '待ち合わせ場所につながりません。少し待ってからもう一度どうぞ');
  }
  function tryHost(tries){
    if(tries > 6){ hostFailed(); return; }
    var code = mkCode();
    var p;
    try{ p = new Peer(IDPREFIX + code, {debug:0}); }catch(e){ hostFailed(); return; }
    var settled = false;
    p.on('open', function(id){
      if(settled) return; settled = true;
      OL.peer = p; OL.me = id; OL.hostId = id; OL.host = true; OL.code = code; OL.on = true;
      OL.members = [{pid:id, name:OL.prof.name, ready:true, prof:OL.prof}];
      startBeat();
      p.on('connection', function(c){
        if(OL.started || OL.members.length >= MAXSEAT){ try{ c.close(); }catch(e){} return; }
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
    OL.on = false; OL.started = false;
    stopBeat(); OL.seen = {};
    uninstall();
    try{ if(OL.peer) OL.peer.destroy(); }catch(e){}
    OL.peer = null; OL.conns = {}; OL.hostConn = null; OL.members = []; OL.seats = [];
    OL.w = null; OL.gap = {}; OL.nextSeq = 0; OL.applySeq = 0;
    if(!silent){ /* 何も出さない（静かに戻す） */ }
  }

  function pushRoom(){
    if(!OL.host) return;
    bcast({t:'room', code:OL.code, members:OL.members.map(function(m){
      return {pid:m.pid, name:m.name, ready:m.ready};
    })});
    renderRoom();
  }

  function showRoom(){ renderRoom(); screenTo('olroom'); }

  function renderRoom(){
    var i, rows = '';
    var list = OL.members;
    for(i=0;i<MAXSEAT;i++){
      var m = list[i];
      var col = PCOL[i];
      if(m){
        rows += '<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;margin:7px 0;'
             + 'border-radius:10px;background:rgba(12,26,46,.75);border:1px solid #24406a">'
             + '<span style="width:12px;height:12px;border-radius:50%;background:' + col + '"></span>'
             + '<b style="flex:1;text-align:left;color:#EAF2FF;font-size:15px">' + esc(m.name)
             + (m.pid === OL.me ? '<span style="color:#8FA9C4;font-size:12px">（あなた）</span>' : '') + '</b>'
             + '<span style="font-size:12.5px;color:' + (m.ready ? '#7DE08A' : '#FFD24D') + '">'
             + (m.ready ? '準備OK' : '接続中…') + '</span></div>';
      } else {
        rows += '<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;margin:7px 0;'
             + 'border-radius:10px;background:rgba(12,26,46,.35);border:1px dashed #24406a;opacity:.6">'
             + '<span style="width:12px;height:12px;border-radius:50%;background:' + col + ';opacity:.4"></span>'
             + '<b style="flex:1;text-align:left;color:#8FA9C4;font-size:14px">空席</b>'
             + '<span style="font-size:12.5px;color:#8FA9C4">CPUが入ります</span></div>';
      }
    }
    var el = mkScreen('olroom',
      '<div style="max-width:640px;margin:0 auto;padding:22px 8px;text-align:center">'
      + '<div style="color:#9FB6CC;font-size:13px;margin-bottom:4px">あいことば</div>'
      + '<div style="font-family:var(--pop);font-size:58px;letter-spacing:14px;color:#FFD24D;'
      +   'text-shadow:0 4px 0 rgba(0,0,0,.5);margin-bottom:6px;padding-left:14px">' + esc(OL.code) + '</div>'
      + '<div style="color:#8FA9C4;font-size:12.5px;margin-bottom:20px">'
      +   'この4文字を友達に伝えてください（電話でも口頭でもOK）</div>'
      + rows
      + (OL.host
          ? '<div style="margin-top:16px;color:#9FB6CC;font-size:13px">'
            + '人数　'
            + [2,3,4].map(function(v){
                return '<button class="btn ghost olN" data-n="' + v + '"'
                  + (wantN() === v ? ' style="border-color:#FFD24D;color:#FFD24D"' : '')
                  + '>' + v + '人</button>';
              }).join(' ')
            + '<div style="margin-top:6px;font-size:12px">'
            + '人が足りない席はCPUが入ります（いまは人が ' + list.length + ' 人）</div></div>'
          : '')
      + '<div style="margin-top:22px;display:flex;gap:14px;justify-content:center">'
      +   '<button class="btn ghost" id="olQuit">やめる</button>'
      +   (OL.host ? '<button class="btn gold" id="olStart">はじめる</button>'
                   : '<span style="align-self:center;color:#9FB6CC;font-size:13px">'
                     + 'ホストが「はじめる」を押すまで待ってください</span>')
      + '</div></div>');
    el.querySelector('#olQuit').onclick = function(){ SFX.click(); leave(false); screenTo('title'); };
    if(OL.host){
      el.querySelector('#olStart').onclick = function(){ SFX.click(); hostStart(); };
      el.querySelectorAll('.olN').forEach(function(b){
        b.onclick = function(){ SFX.click(); OL.wantN = +b.dataset.n; renderRoom(); };
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
    var info = {
      t:'start',
      seed: ((OL.real()*4294967296) >>> 0),
      week: weekIndexRaw(),
      seats: seats,
      cfg: {mapId:cfg.mapId, turns:cfg.turns, timeLimit:cfg.timeLimit, cash:cfg.cash, ai:cfg.ai, n:n}
    };
    bcast(info);
    beginGame(info);
  }

  function weekIndexRaw(){
    return OL.orig.weekIndex ? OL.orig.weekIndex() : weekIndex();
  }

  function beginGame(info){
    OL.seed = info.seed >>> 0;
    OL.week = info.week;
    OL.seats = info.seats;
    OL.nextSeq = 0; OL.applySeq = 0; OL.gap = {}; OL.w = null;
    cfg.mapId = info.cfg.mapId; cfg.turns = info.cfg.turns; cfg.timeLimit = info.cfg.timeLimit;
    cfg.cash = info.cfg.cash; cfg.ai = info.cfg.ai; cfg.n = info.cfg.n;
    cfg.seats = OL.seats.map(function(s){
      return {name:s.name, kind:(s.kind === 'cpu' ? 'cpu' : 'human'), ch:-1, cardId:s.prof.cardId};
    });
    OL.started = true;
    install();
    reseed(0);
    runGame();
  }

  function mySeat(){
    for(var i=0;i<OL.seats.length;i++) if(OL.seats[i].alive && OL.seats[i].pid === OL.me) return i;
    return -1;
  }
  function ownerOf(seat){
    var s = OL.seats[seat];
    if(!s) return OL.hostId;
    return (s.kind === 'human' && s.alive) ? s.pid : OL.hostId;
  }
  function isMine(seat){ return ownerOf(seat) === OL.me; }

  async function runGame(){
    SPEED = cfg.speed;
    await loadingPhase();
    await hideAllScreens();
    newGame();
    camReset(); updHUD(); bgm('game');
    var w = thisWeek();
    await band('オンライン対戦スタート！', G.map.name + ' — のこり ' + cfg.turns + ' ターン', 1400);
    await cutIn('THIS WEEK', w.ic + ' ' + w.nm, w.ds);
    turnLoop();
  }

  /* ══════════ 受信 ══════════ */
  function onData(pid, m){
    if(!m || !m.t) return;
    if(m.t === 'hb') return;
    if(m.t === 'hello'){
      if(!OL.host || OL.started) return;
      var found = false, i;
      for(i=0;i<OL.members.length;i++) if(OL.members[i].pid === pid) found = true;
      if(!found && OL.members.length < MAXSEAT)
        OL.members.push({pid:pid, name:m.prof.name, ready:true, prof:m.prof});
      pushRoom();
      return;
    }
    if(m.t === 'room'){
      OL.code = m.code;
      OL.members = m.members.map(function(x){ return {pid:x.pid, name:x.name, ready:x.ready, prof:null}; });
      renderRoom();
      return;
    }
    if(m.t === 'start'){ if(!OL.host) beginGame(m); return; }
    if(m.t === 'do'){                       // ゲストの操作 → ホストが番号を打って全員へ
      if(!OL.host) return;
      stamp(m.seat, m.tag, m.v);
      return;
    }
    if(m.t === 'act'){ applyAct(m.a); return; }
    if(m.t === 'need'){
      if(!OL.host) return;
      sendTo(OL.conns[pid], {t:'state', seq:OL.applySeq, snap:snapshot()});
      return;
    }
    if(m.t === 'state'){ restore(m.snap, m.seq); return; }
  }

  /* ══════════ 操作の番号づけと適用 ══════════ */
  function stamp(seat, tag, v){
    var a = {seq:OL.nextSeq++, seat:seat, tag:tag, v:v, h:hashState()};
    bcast({t:'act', a:a});
    applyAct(a);
  }
  function ctl(tag, v){ if(OL.host) stamp(-1, tag, v); }

  function applyAct(a){
    if(!OL.started) return;
    if(a.seq < OL.applySeq) return;                       // 二重に来た
    if(a.seq > OL.applySeq){                              // 番号が飛んだ
      OL.gap[a.seq] = a;
      askResync();
      return;
    }
    if(!OL.host && a.h !== undefined && a.h !== hashState()){
      askResync();                                        // 盤面がずれた
    }
    OL.applySeq = a.seq + 1;
    reseed(a.seq);                                        // ここで全端末の乱数がそろう
    if(a.seat < 0){ doCtl(a); drain(); return; }
    var w = OL.w;
    if(w && w.seat === a.seat && w.tags.indexOf(a.tag) >= 0){
      OL.w = null; hideWait();
      w.res(a);
    } else {
      askResync();
    }
    drain();
  }
  function drain(){
    var nx = OL.gap[OL.applySeq];
    if(nx){ delete OL.gap[OL.applySeq]; applyAct(nx); }
  }
  function doCtl(a){
    if(a.tag === 'drop'){
      var i = a.v, s = OL.seats[i];
      if(s && s.alive){
        s.alive = false; s.kind = 'cpu';
        if(G && G.players[i]) G.players[i].kind = 'cpu';
        if(cfg.seats[i]) cfg.seats[i].kind = 'cpu';
        note(s.name + ' さんの接続が切れました', 'この席はCPUが引き継ぎます');
        renderItems();
      }
      if(OL.host && OL.w && OL.w.seat === i) setTimeout(function(){ fallback(OL.w); }, 60);
      return;
    }
    if(a.tag === 'timeup'){ if(G && !G.over) timeUp(); return; }
  }
  function fallback(w){
    if(!w || !OL.host || OL.w !== w) return;
    var tag = w.tags[0], v = null;
    if(tag === 'roll'){ v = cpuRollChoice(w.seat); tag = 'roll'; }
    else if(tag === 'tile')   v = -1;
    else if(tag === 'build')  v = [];
    else if(tag === 'buyout') v = false;
    else if(tag === 'mini')   v = {c:'stop', s:1000000};
    else if(tag === 'jam')    v = false;
    stamp(w.seat, tag, v);
  }

  function askResync(){
    if(OL.host || OL.resyncing) return;
    OL.resyncing = true;
    sendTo(OL.hostConn, {t:'need'});
    setTimeout(function(){ OL.resyncing = false; }, 1500);
  }

  /* ══════════ 盤面の要約と丸ごと同期 ══════════ */
  function hashState(){
    if(!G) return 0;
    var h = 2166136261, i, t, p;
    var add = function(n){ h = Math.imul(h ^ (n|0), 16777619) >>> 0; };
    for(i=0;i<G.tiles.length;i++){
      t = G.tiles[i];
      add(i); add((t.owner === undefined ? -1 : t.owner) + 2);
      add(t.lv|0); add(t.landmark?1:0); add(t.frozen|0); add(t.olym|0);
    }
    for(i=0;i<G.players.length;i++){
      p = G.players[i];
      add(Math.round(p.cash/1000)); add(p.pos|0); add(p.laps|0);
      add(p.jail|0); add(p.out?1:0); add(p.items.length);
    }
    add(G.turn|0); add(G.turnsLeft|0); add(Math.round(G.infl*10));
    return h >>> 0;
  }
  function snapshot(){
    if(!G) return null;
    return {
      tiles: G.tiles.map(function(t){
        return {o:(t.owner === undefined ? -1 : t.owner), l:t.lv|0, m:t.landmark?1:0,
                f:t.frozen|0, y:t.olym|0, x:t.x2?1:0};
      }),
      players: G.players.map(function(p){
        return {c:p.cash, p:p.pos, la:p.laps, j:p.jail, o:p.out?1:0, d:p.dblRun,
                od:p.odd, ev:p.even, it:p.items.slice(), sl:p.skillLeft, mn:p.mana,
                ft:p.freeToll, hb:p.halfBuild, sx:p.salaryX2, fd:p.forceDouble,
                ce:p.chooseEye, tu:p.tollUp, jm:p.jam, k:p.kind};
      }),
      turn:G.turn, left:G.turnsLeft, infl:G.infl, over:G.over?1:0, clock:G.clock
    };
  }
  function restore(s, seq){
    if(!s || !G) return;
    var i;
    for(i=0;i<s.tiles.length && i<G.tiles.length;i++){
      var a = s.tiles[i], t = G.tiles[i];
      if(t.type !== 'city') continue;
      t.owner = a.o; t.lv = a.l; t.landmark = !!a.m; t.frozen = a.f; t.olym = a.y; t.x2 = !!a.x;
    }
    for(i=0;i<s.players.length && i<G.players.length;i++){
      var b = s.players[i], p = G.players[i];
      p.cash = b.c; p.pos = b.p; p.laps = b.la; p.jail = b.j; p.out = !!b.o; p.dblRun = b.d;
      p.odd = b.od; p.even = b.ev; p.items = b.it.slice(); p.skillLeft = b.sl; p.mana = b.mn;
      p.freeToll = b.ft; p.halfBuild = b.hb; p.salaryX2 = b.sx; p.forceDouble = b.fd;
      p.chooseEye = b.ce; p.tollUp = b.tu; p.jam = b.jm; p.kind = b.k;
    }
    G.turn = s.turn; G.turnsLeft = s.left; G.infl = s.infl; G.clock = s.clock;
    OL.applySeq = seq; OL.gap = {};
    boardChanged(); updHUD(); renderItems();
    note('同期しなおしました', '盤面をホストに合わせました');
    OL.resyncing = false;
  }

  /* ══════════ 待ちの表示 ══════════ */
  function waitEl(){
    if(!OL.waitBox){
      var d = document.createElement('div');
      d.id = 'olwait';
      d.style.cssText = 'position:absolute;left:50%;bottom:86px;transform:translateX(-50%);'
        + 'padding:9px 20px;border-radius:999px;background:rgba(8,18,34,.92);border:1px solid #33507a;'
        + 'color:#EAF2FF;font-size:14px;z-index:60;display:none;pointer-events:none;'
        + 'box-shadow:0 6px 18px rgba(0,0,0,.5)';
      var host = document.getElementById('stage') || document.body;
      host.appendChild(d);
      OL.waitBox = d;
    }
    return OL.waitBox;
  }
  function showWait(seat, msg){
    var s = OL.seats[seat];
    var e = waitEl();
    e.innerHTML = '⏳ <b style="color:' + PCOL[seat] + '">' + esc(s ? s.name : '相手')
      + '</b> さんが' + esc(msg || '考えています') + '…';
    e.style.display = 'block';
  }
  function hideWait(){ if(OL.waitBox) OL.waitBox.style.display = 'none'; }
  function note(a, b){ toast('L', '📡', a, b || '', 2600); }

  /* ══════════ 選択を1つ取る（ここが同期の入口） ══════════ */
  function waitFor(seat, tags){
    return new Promise(function(res){ OL.w = {seat:seat, tags:tags, res:res}; });
  }
  function sendAct(seat, tag, v){
    var pr = waitFor(seat, [tag]);
    if(OL.host) stamp(seat, tag, v); else sendTo(OL.hostConn, {t:'do', seat:seat, tag:tag, v:v});
    return pr;
  }
  /* 自分の席なら local() を動かして結果を配る。よその席なら黙って待つ。 */
  async function ask(seat, tag, local, hint){
    if(isMine(seat)){
      var v = await local();
      var a = await sendAct(seat, tag, v);
      return a.v;
    }
    showWait(seat, hint);
    var b = await waitFor(seat, [tag]);
    hideWait();
    return b.v;
  }
  /* §6 の契約 dvAsk：人間や CPU の選択を1つ取る。
     オンライン中は、選ぶ人の端末で local() を動かし、その結果を全員に配る（値は JSON にできる物だけ）。 */
  window.dvAsk = function(seat, tag, local, hint){
    if(OL.started && G && !G.over) return ask(seat, tag, function(){ return Promise.resolve().then(local); }, hint);
    return Promise.resolve().then(local);
  };
  /* §6 の契約 dvQueueDice：オンライン中は、振る人の端末で目を決めて OL.diceQ に積む */
  window.dvQueueDice = function(seat, force, impact, target){
    if(!(OL.started && G && !G.over)) return Promise.resolve();
    return ask(seat, 'dice', function(){ return Promise.resolve(preRoll(seat, force, impact, target)); },
      'サイコロを振っています').then(function(v){ OL.diceQ = Array.isArray(v) ? v.slice() : null; });
  };

  /* ══════════ 差し替える関数たち ══════════ */
  function install(){
    if(OL.orig.installed) return;
    OL.orig = {
      installed:true, random:Math.random,
      rollPair:window.rollPair, takeRoll:window.takeRoll, jailTurn:window.jailTurn,
      pickTile:window.pickTile, maybeBuyout:window.maybeBuyout, buyUI:window.buyUI,
      aiBuy:window.aiBuy,
      miniGame:window.miniGame, shakePhase:window.shakePhase, useItem:window.useItem,
      tickClock:window.tickClock, weekIndex:window.weekIndex, newGame:window.newGame,
      finish:window.finish
    };
    OL.real = OL.orig.random;
    Math.random        = sharedRandom;
    window.rollPair    = olRollPair;
    window.takeRoll    = olTakeRoll;
    window.jailTurn    = olJailTurn;
    window.pickTile    = olPickTile;
    window.maybeBuyout = olMaybeBuyout;
    window.buyUI       = olBuyUI;
    window.aiBuy       = olBuyUI;        // CPUの買う・建てるもホストが決めて全員へ配る
    window.miniGame    = olMiniGame;
    window.shakePhase  = olShakePhase;
    window.useItem     = olUseItem;
    window.tickClock   = olTickClock;
    window.weekIndex   = function(){ return OL.week; };
    window.newGame     = olNewGame;
    window.finish      = olFinish;
  }
  function uninstall(){
    if(!OL.orig.installed) return;
    Math.random        = OL.orig.random;
    window.rollPair    = OL.orig.rollPair;
    window.takeRoll    = OL.orig.takeRoll;
    window.jailTurn    = OL.orig.jailTurn;
    window.pickTile    = OL.orig.pickTile;
    window.maybeBuyout = OL.orig.maybeBuyout;
    window.buyUI       = OL.orig.buyUI;
    window.aiBuy       = OL.orig.aiBuy;
    window.miniGame    = OL.orig.miniGame;
    window.shakePhase  = OL.orig.shakePhase;
    window.useItem     = OL.orig.useItem;
    window.tickClock   = OL.orig.tickClock;
    window.weekIndex   = OL.orig.weekIndex;
    window.newGame     = OL.orig.newGame;
    window.finish      = OL.orig.finish;
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

  /* 週替わりイベントは端末の時計に依存させない（ホストの値を全員が使う） */

  function olTickClock(dt){
    if(!G || G.over || !cfg.timeLimit) return;
    if(!G.running) return;
    G.clock -= dt/1000;
    if(G.clock <= 0){ G.clock = 0; if(!G.over && OL.host) ctl('timeup'); }
    var m = Math.floor(G.clock/60), s = Math.floor(G.clock%60);
    var el = $('#pClock');
    var txt = m + ':' + String(s).padStart(2,'0');
    if(el.textContent !== txt){ el.textContent = txt; if(G.clock < 60) el.classList.add('warn'); }
  }

  /* 席ごとの持ち物は「自分の保存データ」ではなく、配られた情報から作る */
  function olNewGame(){
    var map = MAPS.find(function(m){ return m.id === cfg.mapId; }) || MAPS[0];
    G = {
      map: map, tiles: buildTiles(map),
      players: OL.seats.slice(0, cfg.n).map(function(s, i){
        var pr = s.prof;
        var card = cardById(pr.cardId) || CARDPOOL[i % CARDPOOL.length];
        var slots = (s.kind === 'cpu') ? [] : pr.slots;
        var items = pr.bag.slice(0, 3);
        var pool = ITEMS.slice();
        while(items.length < 2 && pool.length)
          items.push(pool.splice((Math.random()*pool.length)|0, 1)[0].id);
        var pend;
        if(s.kind === 'cpu'){
          var n = cfg.ai === 2 ? 3 : cfg.ai === 1 ? 2 : 1, pp = PENDANTS.slice();
          pend = [];
          for(var k=0;k<n && pp.length;k++) pend.push(pp.splice((Math.random()*pp.length)|0, 1)[0]);
        } else pend = slots.map(pendById).filter(Boolean);
        return {
          name:s.name, kind:(s.kind === 'cpu' ? 'cpu' : 'human'), ch:card.art, card:card.id,
          stats:cardStats(card.id, pr.lv, slots), cardLv:pr.lv,
          skill:card.sk, skillKind:(card.kind === undefined ? 0 : card.kind),
          skillPow:(card.rar === 'SS' ? 0.18 : card.rar === 'S' ? 0.12 : 0.08),
          cash:cfg.cash, pos:0, laps:0, jail:0, out:false, dblRun:0,
          odd:2, even:2, items:items,
          skillLeft:card.sk.uses, mana:0,
          freeToll:0, halfBuild:0, salaryX2:0, forceDouble:0, chooseEye:0, tollUp:0,
          render:tileCenter(0), hopY:0, squash:1, offx:0, offy:0, face:1, jam:3,
          pend:pend, pboost:{},
          pendLv:(s.kind === 'cpu') ? {} : (pr.pendLv || {}),
          dieId:(s.kind === 'cpu') ? 'd0' : (pr.dieId || pr.die || 'd0'),
          dieLv:(s.kind === 'cpu') ? 1 : Math.max(1, Math.min(10, (pr.dieLv | 0) || 1))
        };
      }),
      turn:0, turnsLeft:cfg.turns, over:false, winner:-1, winReason:'', alarm:null,
      infl:1, reach:-1, winX:1, clock:cfg.timeLimit, lastTick:0, ev:{}
    };
    thisWeek().apply(G);
    destPin = null; stepPreview = null; diceAnim = null; fxList.length = 0;
  }

  /* ── サイコロを振る（手番の人だけが決めて、目そのものを配る） ──
     1組目の決め方は doRoll と同じ順：ダブル確定 → ゲージインパクト（合計＝target）→ ふつう */
  function preRoll(pi, force, impact, target){
    var p = G.players[pi], die = dieOf(pi);
    var wantDbl = p.forceDouble > 0 && force !== 'odd';
    var first = wantDbl ? OL.orig.rollPair(force, true, die)
      : (impact && target >= 2 && target <= 12) ? dkGaugePair(target, die, force)
      : OL.orig.rollPair(force, false, die);
    return [ first, OL.orig.rollPair(force, false, DICE[0]) ];
  }
  function cpuRollChoice(pi){
    var p = G.players[pi], force = null;
    if(cfg.ai >= 1 && (p.odd > 0 || p.even > 0)){
      var so = bestParity(pi,'odd'), se = bestParity(pi,'even'), sn = avgScore(pi);
      if(p.odd > 0 && so > sn + (cfg.ai === 2 ? 6 : 16) && so >= se) force = 'odd';
      else if(p.even > 0 && se > sn + (cfg.ai === 2 ? 6 : 16)) force = 'even';
    }
    var impact = cfg.ai === 2 ? Math.random() < 0.55 : cfg.ai === 1 ? Math.random() < 0.3 : Math.random() < 0.1;
    /* CPU は「一番得をする合計」をねらう（当たれば誤差の範囲で出る） */
    var target = (impact && typeof dktCpuTarget === 'function') ? dktCpuTarget(pi, force) : 0;
    var eye = (p.chooseEye > 0 && typeof dktBestTotal === 'function') ? dktBestTotal(pi, null) : 0;
    if(eye){ force = null; impact = false; target = 0; }
    return {force:force, impact:impact, eye:eye, target:target, dice:preRoll(pi, force, impact, target)};
  }

  /* 手番の人の操作を1つ取る（能力・アイテム・サイコロのどれか） */
  function localTurnAction(pi){
    var p = G.players[pi];
    if(p.kind === 'cpu'){
      return (async function(){
        stepPreview = {from:p.pos, max:12};
        gaugeSweet = 0.5; gaugeHalf = 0.055 + statRate(p,'gauge')*0.075;
        gaugeOn = true; $('#diceui').classList.add('on');
        await wait(750);
        if(p.mana >= 100 && p.skillLeft > 0 && cfg.ai >= 1 && Math.random() < 0.7)
          return {tag:'skill', v:1};
        if(cfg.ai >= 1 && p.items.length && Math.random() < 0.25){
          var k = (Math.random()*p.items.length)|0, id = p.items[k];
          if(id === 'angel' || id === 'half' || id === 'salary' || id === 'double')
            return {tag:'cpuitem', v:k};
        }
        return {tag:'roll', v:cpuRollChoice(pi)};
      })();
    }
    /* 人間：9g-turn.js のサイコロUI（長押しゲージ・奇数/偶数のモード）で決め、目まで決めてから配る */
    return new Promise(function(res){
      OL.localPick = function(o){ OL.localPick = null; dktInputCancel(o); };
      dkRollInput(pi).then(function(o){
        OL.localPick = null;
        if(o && o.tag === 'skill'){ res({tag:'skill', v:1}); return; }
        if(o && o.tag === 'item'){ res(o); return; }
        o = o || {};
        var eye = o.eye || 0, force = eye ? null : (o.force || null);
        var impact = !eye && !!o.impact, target = impact ? (o.target || 0) : 0;
        res({tag:'roll', v:{force:force, impact:impact, eye:eye, target:target,
                            dice:preRoll(pi, force, impact, target)}});
      });
    });
  }

  async function applyRoll(pi, v){
    var p = G.players[pi];
    gaugeOn = false; $('#diceui').classList.remove('on'); stepPreview = null;
    if(v.force === 'odd')  p.odd--;
    if(v.force === 'even') p.even--;
    var fixed = 0;
    if(p.chooseEye > 0){ p.chooseEye--; fixed = v.eye || 0; }
    OL.diceQ = (v.dice || []).slice();
    try { return await doRoll(pi, v.force, !!v.impact, fixed, v.target || 0); }
    finally { OL.diceQ = null; }
  }

  function applyCpuItem(pi, k){
    var p = G.players[pi], id = p.items[k];
    if(!id) return;
    p.items.splice(k, 1); renderItems();
    var it = itemById(id);
    toast('L', it.ic, 'CPUがアイテム使用', it.nm, 2000);
    if(id === 'angel')  p.freeToll++;
    if(id === 'half')   p.halfBuild++;
    if(id === 'salary') p.salaryX2++;
    if(id === 'double') p.forceDouble++;
  }

  async function olTakeRoll(pi){
    var guard = 0;
    while(guard++ < 12){
      var a;
      if(isMine(pi)){
        var o = await localTurnAction(pi);
        a = await sendAct(pi, o.tag, o.v);
      } else {
        showWait(pi, 'サイコロを振ろうとしています');
        $('#skillBtn').onclick = null;
        a = await waitFor(pi, TURN_TAGS);
        hideWait();
      }
      if(a.tag === 'skill'){ await useSkill(pi); continue; }
      if(a.tag === 'item'){ await OL.orig.useItem(pi, a.v); continue; }
      if(a.tag === 'cpuitem'){ applyCpuItem(pi, a.v); continue; }
      return await applyRoll(pi, a.v);
    }
    return applyRoll(pi, {force:null, impact:false, eye:0, dice:preRoll(pi, null)});
  }

  /* 無人島は 9g-turn.js の jailTurn に任せる（3択は dvAsk、サイコロは dvQueueDice で全員にそろう） */
  function olJailTurn(pi){ return OL.orig.jailTurn(pi); }

  function olPickTile(pi, msg, filter){
    return ask(pi, 'tile',
      function(){ return OL.orig.pickTile(pi, msg, filter); },
      'マスを選んでいます');
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

  function olShakePhase(me){
    return ask(me, 'jam',
      function(){ return OL.orig.shakePhase(me); },
      '建設をじゃまするか考えています');
  }

  /* 買収は本体の maybeBuyout に任せる（確認は dvAsk(pi,'buyout') で全員にそろう） */
  function olMaybeBuyout(pi, i){ return OL.orig.maybeBuyout(pi, i); }

  /* 建てる：どれを選んだかだけを配り、計算は各端末で同じようにやる */
  function pickBuild(pi, i){
    var t = G.tiles[i], p = G.players[pi];
    var own = t.owner === pi;
    return new Promise(function(res){
      var wrap = $('#modalWrap'), body = $('#modalBody');
      body.innerHTML = buildHTML(i, pi);
      wrap.classList.add('on');
      var sel = [];
      var has = function(k){ return sel.indexOf(k) >= 0; };
      var sumEl = body.querySelector('#bSum');
      var cards = Array.from(body.querySelectorAll('.bcard'));
      /* 本家どおり、最初から選ばれている札（.bcard.sel）から始める */
      cards.forEach(function(c){
        if(c.classList.contains('sel') && !c.classList.contains('dis') && !c.classList.contains('own')) sel.push(+c.dataset.k);
      });
      var costOf = function(k){ return +cards.find(function(c){ return +c.dataset.k === k; }).dataset.c; };
      var recalc = function(){
        var s = 0, j;
        for(j=0;j<sel.length;j++) s += costOf(sel[j]);
        sumEl.textContent = yen(s);
        body.querySelector('#bOk').disabled = (sel.length === 0 || s > p.cash);
        sumEl.style.color = s > p.cash ? '#C0261A' : '#B2411C';
      };
      cards.forEach(function(cd){
        var k = +cd.dataset.k;
        if(cd.classList.contains('dis') || cd.classList.contains('own')) return;
        cd.onclick = function(){
          if(k > 0 && !own && !has(0)){
            sel.push(0); cards.find(function(c){ return +c.dataset.k === 0; }).classList.add('sel');
          }
          if(k > 0 && k < 4){
            for(var j = (own ? t.lv+1 : 1); j < k; j++){
              var cc = cards.find(function(c){ return +c.dataset.k === j; });
              if(cc && !cc.classList.contains('own') && !has(j)){ sel.push(j); cc.classList.add('sel'); }
            }
          }
          if(has(k)){ sel.splice(sel.indexOf(k), 1); cd.classList.remove('sel'); }
          else { sel.push(k); cd.classList.add('sel'); }
          SFX.click(); recalc();
        };
      });
      recalc();
      body.querySelectorAll('[data-act]').forEach(function(b){
        b.onclick = function(){
          SFX.click(); wrap.classList.remove('on');
          res(b.dataset.act === 'ok' ? sel.slice().sort() : []);
        };
      });
    });
  }
  function planBuild(pi, i){
    /* CPUの手（ホストだけが計算して配る）。元の aiBuy と同じ考え方 */
    var t = G.tiles[i], p = G.players[pi], lvl = cfg.ai;
    var own = t.owner === pi;
    var disc = statMul(p,'build',0.3) * (p.halfBuild > 0 ? 0.5 : 1) * ((G.ev && G.ev.buildX) || 1);
    var reserve = [300000, 180000, 90000][lvl];
    var sel = [], spend = 0, lvTarget = t.lv, k, c;
    /* 観光地は建物を建てられない＝土地だけ（ほかの観光地を持っていれば無理をしてでも買う） */
    if(t.tour){
      if(own) return [];
      var tp = Math.round(t.base*disc);
      var mineT = G.tiles.filter(function(x){ return x.tour && x.owner === pi; }).length;
      return (p.cash - tp >= (mineT >= 1 ? 0 : reserve)) ? [0] : [];
    }
    if(!own){
      var price = Math.round(t.base*disc);
      var mineG = CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner === pi; }).length;
      var urgent = mineG >= 1 || G.players.some(function(q, qi){
        return qi !== pi && !q.out &&
          CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner === qi; }).length >= 2; });
      if(p.cash - price < (urgent ? 0 : reserve)) return [];
      sel.push(0); spend += price;
    }
    var near = CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner === pi; }).length;
    var block = G.players.some(function(q, qi){
      return qi !== pi && !q.out &&
        CITY_SLOTS[t.g].filter(function(j){ return G.tiles[j].owner === qi; }).length >= 2; });
    var aggr = (near >= 1 || block) ? 1 : 0;
    var mx = maxLvOf(p);
    for(k = (own ? t.lv+1 : 1); k <= mx; k++){
      c = Math.round(BUILD[k].cost(t.base)*disc);
      /* 蓄えは崩してよいが、所持金より多くは払えない（0円が下限。ここが無いと所持金がマイナスになった） */
      if(p.cash - spend - c < Math.max(0, reserve - aggr*1500000)) break;
      if(lvl === 0 && k > 1) break;
      if(lvl === 1 && k > 2 && !aggr) break;
      spend += c; lvTarget = k; sel.push(k);
    }
    if(lvl === 2 && lvTarget === 3 && near >= 1){
      c = Math.round(BUILD[4].cost(t.base)*disc);
      if(p.cash - spend - c > reserve){ sel.push(4); }
    }
    return sel;
  }
  async function olBuyUI(pi, i){
    var t = G.tiles[i], p = G.players[pi];
    var own = t.owner === pi;
    var cpu = p.kind === 'cpu';
    if(!own && t.owner >= 0) return;
    if(own && t.landmark){
      if(!cpu) toast('R','🗼','ランドマーク完成済み', t.name + ' はこれ以上建てられません', 1800);
      return;
    }
    var sel = await ask(pi, 'build', function(){
      return cpu ? Promise.resolve(planBuild(pi, i)) : pickBuild(pi, i);
    }, cpu ? '建てる場所を考えています' : '買うか考えています');
    if(!sel || !sel.length) return;
    var disc = statMul(p,'build',0.3) * (p.halfBuild > 0 ? 0.5 : 1) * ((G.ev && G.ev.buildX) || 1);
    var has = function(k){ return sel.indexOf(k) >= 0; };
    var spend = 0, j;
    for(j=0;j<sel.length;j++){
      var k = sel[j];
      spend += (k === 0) ? Math.round(t.base*disc) : Math.round(BUILD[k].cost(t.base)*disc);
    }
    /* 人間プレイヤーは「ゆらす」で邪魔できる（CPUの建設だけ） */
    if(cpu){
      var me = G.players.findIndex(function(q){ return q.kind !== 'cpu' && !q.out; });
      if(me >= 0 && me !== pi && G.players[me].jam > 0){
        var jammed = await olShakePhase(me);
        if(jammed){
          var top = -1;
          for(j=0;j<sel.length;j++) if(sel[j] > 0 && sel[j] < 4 && sel[j] > top) top = sel[j];
          sel = sel.filter(function(k2){ return k2 !== 4 && k2 !== top; });
          spend = Math.round(spend*0.5);
          if(!sel.length){ toast('L','✋','じゃま成功！','建設を止めました', 2200); return; }
        }
      }
    }
    if(spend > p.cash) return;                 // 念のため：所持金を超える投資はしない
    if(p.halfBuild > 0) p.halfBuild--;
    give(pi, -spend);
    if(has(0) || own) t.owner = pi;
    [1,2,3].forEach(function(k){ if(has(k)) t.lv = Math.max(t.lv, k); });
    if(has(4)) t.landmark = true;
    if(cpu){
      toast('L','🏗',(has(0) ? '購入' : '建設') + '：' + t.name, yen(spend) + ' を投資しました', 2000);
      news(p.name + ' が ' + t.name + ' に ' + yen(spend) + ' を投資！');
      await growAnim(i);
    } else {
      await growAnim(i);
      await deedCard(i, spend);
    }
    checkWin();
  }

  /* ボーナスゲームは本体の miniGame に任せる（人間の入力は dvAsk(pi,'mini') で全員にそろう） */
  function olMiniGame(pi){ return OL.orig.miniGame(pi); }

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
    apply:applyAct, hash:hashState, snap:snapshot, seed:function(s, q){ OL.seed = s; reseed(q||0); },
    rng:function(){ return OL.rng; }, mkCode:mkCode, cleanCode:cleanCode, leave:leave
  };
}
dvOnlineBoot();
