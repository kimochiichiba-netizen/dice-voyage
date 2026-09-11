/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — 王宮スキン（8-dk.js）
   ──────────────────────────────────────────────────────────────
   社長が用意した5枚の絵（ホーム／ミッション／ペンダント／ショップ／サイコロ）
   に合わせて、メタ画面を作り直す。
   ・既存のファイルは書き換えない。いちばん最後に読み込んで、
     同じ名前の関数をあとから宣言し直すことで置きかえる。
   ・絵から切り出した素材は window.DV_UI に入っている（build.ps1 が入れる）。
     素材が無いときも、絵文字と CSS だけで成り立つように作る。
   ══════════════════════════════════════════════════════════════ */

/* ══════════ 素材 ══════════ */
function dkU(k){ var m = window.DV_UI || {}; return m[k] || ''; }
function dkBgCss(k){
  var u = dkU('bg-' + k);
  return u ? '--dk-bg:url(' + u + ')' : '';
}
function dkCharImg(id){
  var m = window.DV_CHARIMG || {};
  return m[id] || '';
}

/* ══════════ 画面の器 ══════════ */
/* mkScreen は className を毎回上書きするので、そのあとで .dk を足す */
function dkMake(id, bgKey, html){
  var el = mkScreen(id, html);
  el.className = 'screen meta dk dkGo' + (el.classList.contains('on') ? ' on' : '');
  el.setAttribute('style', dkBgCss(bgKey));
  return el;
}

/* 上のヘッダー（戻る・ロゴ・通貨・閉じる） */
function dkHead(logoKey, opt){
  opt = opt || {};
  var lg = dkU('logo-' + logoKey);
  var logo = lg
    ? '<div class="dklogo" style="background-image:url(' + lg + ');--dk-logo-mask:url(' + lg + ')"></div>'
    : '<div class="dklogo dktext"><b>' + esc(opt.title || 'DICE KINGDOM')
      + '</b><i>DICE KINGDOM</i></div>';
  var right = '';
  if(opt.cur !== false){
    right += '<div class="dkcur"><i class="ic dkcoin"></i><b id="dkGold">'
           + SV.gold.toLocaleString() + '</b><div class="dkplus" data-dkbuy="gold">＋</div></div>'
           + '<div class="dkcur gem"><i class="ic dkgem"></i><b id="dkGem">'
           + SV.gem + '</b><div class="dkplus" data-dkbuy="gem">＋</div></div>';
  }
  if(opt.icons) right += opt.icons;
  if(opt.close !== false) right += '<div class="dkclose" data-dkgo="' + (opt.closeTo || 'home') + '">✕</div>';
  return '<div class="dkhd">'
    + (opt.back === false ? '' : '<div class="dkback" data-dkgo="' + (opt.backTo || 'home') + '"></div>')
    + logo
    + '<div class="dkhdR">' + right + '</div>'
    + '</div>';
}

/* 左の縦タブ */
function dkTabs(list, active){
  return '<div class="dktabs">' + list.map(function(t){
    return '<div class="dktab' + (t.id === active ? ' on' : '') + '" data-dktab="' + t.id + '">'
      + '<span class="ic">' + t.ic + '</span><span class="tx">' + t.nm + '</span>'
      + (t.badge ? '<span class="nw">' + t.badge + '</span>' : '')
      + '</div>';
  }).join('') + '</div>';
}

/* きらめきを散らす（主役の絵のまわり） */
function dkSparks(root, n, box){
  if(!root) return;
  for(var i = 0; i < n; i++){
    var s = document.createElement('i');
    s.className = 'dkspark';
    s.style.left = (box.x + Math.random() * box.w) + 'px';
    s.style.top  = (box.y + Math.random() * box.h) + 'px';
    s.style.animationDelay = (Math.random() * 2.4).toFixed(2) + 's';
    s.style.transform = 'scale(' + (0.6 + Math.random() * 0.9).toFixed(2) + ')';
    root.appendChild(s);
  }
}

/* 数字がパラパラと増える */
function dkCount(el, to, ms){
  if(!el) return;
  var from = parseInt(String(el.textContent).replace(/[^0-9]/g, ''), 10) || 0;
  if(from === to){ el.textContent = to.toLocaleString(); return; }
  var t0 = 0, dur = ms || 620;
  function step(t){
    if(!t0) t0 = t;
    var k = Math.min(1, (t - t0) / dur);
    k = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * k).toLocaleString();
    if(k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function dkWallet(){
  dkCount(document.getElementById('dkGold'), SV.gold);
  var g = document.getElementById('dkGem'); if(g) g.textContent = SV.gem;
  var wg = document.getElementById('wGold'); if(wg) wg.textContent = SV.gold.toLocaleString();
  var wm = document.getElementById('wGem');  if(wm) wm.textContent = SV.gem;
}


/* 報酬を受け取ったとき、その場からコインが弾ける */
function dkBurst(el, ic, n){
  var st = document.getElementById("stage"); if(!st) return;
  var r  = (el || st).getBoundingClientRect(), s = st.getBoundingClientRect();
  var sc = s.width / 1600 || 1;
  var cx = (r.left + r.width / 2 - s.left) / sc, cy = (r.top + r.height / 2 - s.top) / sc;
  for(var i = 0; i < (n || 12); i++){
    var b = document.createElement("div");
    b.className = "dkburst"; b.textContent = ic || "🪙";
    var a = (Math.PI * 2 * i) / (n || 12) + Math.random() * 0.5;
    var d = 90 + Math.random() * 130;
    b.style.left = (cx - 17) + "px"; b.style.top = (cy - 17) + "px";
    b.style.setProperty("--bx", Math.cos(a) * d + "px");
    b.style.setProperty("--by", (Math.sin(a) * d - 40) + "px");
    b.style.animationDelay = (i * 0.022).toFixed(3) + "s";
    st.appendChild(b);
    (function(x){ setTimeout(function(){ if(x.parentNode) x.parentNode.removeChild(x); }, 1400); })(b);
  }
}

/* 画面の行き先 */
function dkGo(id){
  SFX.click();
  if(id === 'home')  return showHome();
  if(id === 'cards') return showCards();
  if(id === 'gacha') return showGacha();
  if(id === 'pend')  return showPend();
  if(id === 'dice')  return showDice();
  if(id === 'shop')  return showShop();
  if(id === 'quest') return showQuest();
  if(id === 'daily') return showDaily();
  if(id === 'news')  return showNews();
  if(id === 'play')  return screenTo('setup');
  if(id === 'title') return screenTo('title');
}

/* クリックの配線（画面を作ったら必ず最後に呼ぶ） */
function dkWire(el, onTab){
  el.querySelectorAll('[data-dkgo]').forEach(function(b){
    b.onclick = function(){ dkGo(b.dataset.dkgo); };
  });
  el.querySelectorAll('[data-dkbuy]').forEach(function(b){
    b.onclick = function(){ SFX.click(); showShop(); };
  });
  el.querySelectorAll('[data-dktab]').forEach(function(b){
    b.onclick = function(){ SFX.click(); if(onTab) onTab(b.dataset.dktab); };
  });
}

/* ══════════════════════════════════════════════════════════════
   ホーム
   ══════════════════════════════════════════════════════════════ */
const DK_LEFT = [
  {id:'cards', ic:'🎴', nm:'カード'},
  {id:'dice',  ic:'🎲', nm:'サイコロ'},
  {id:'pend',  ic:'📿', nm:'ペンダント'},
  {id:'gacha', ic:'🧊', nm:'キューブ'},
  {id:'shop',  ic:'🛒', nm:'ショップ'}
];
const DK_RIGHT = [
  {id:'quest', ic:'📜', nm:'ミッション'},
  {id:'news',  ic:'📣', nm:'イベント'},
  {id:'daily', ic:'📅', nm:'出席簿'},
  {id:'play',  ic:'🤝', nm:'ともだち'},
  {id:'title', ic:'⏏️', nm:'タイトル'}
];

/* 順位表は見せかけ（サーバを持たないので、遊んだ回数から作る） */
function dkRank(){
  var me = { nm: (SV.name || 'あなた'), sc: 1500000 + SV.gold % 90000 + SV.lv * 1200, me:true,
             card: SV.equip };
  var names = ['リョウタ','アオイ','ユウ','ミナ','ソラ','ハルト'];
  var rest = names.slice(0, 4).map(function(n, i){
    return { nm:n, sc: 1490000 + ((i * 7919 + SV.plays * 131) % 52000), me:false,
             card: CARDPOOL[(i * 5 + 3) % CARDPOOL.length].id };
  });
  return rest.concat([me]).sort(function(a, b){ return b.sc - a.sc; }).slice(0, 5);
}

function showHome(){
  var c  = cardById(SV.equip) || CARDPOOL[0];
  var lv = (SV.cards[SV.equip] || {lv:1}).lv;
  var img = dkCharImg(SV.equip);
  var rows = dkRank().map(function(r, i){
    var ci = dkCharImg(r.card);
    return '<div class="dkrk' + (i === 0 ? ' top' : '') + (r.me ? ' me' : '') + '">'
      + '<span class="no">' + (i < 3 ? ['🥇','🥈','🥉'][i] : (i + 1)) + '</span>'
      + '<span class="fc"' + (ci ? ' style="background-image:url(' + ci + ')"' : '') + '></span>'
      + '<span class="nm">' + esc(r.nm) + '</span>'
      + '<span class="sc">🏆 ' + r.sc.toLocaleString() + '</span>'
      + '</div>';
  }).join('');

  var mile = SV.plays % 20;
  var el = dkMake('home', 'home',
      dkHead('home', { back:false, close:false, cur:false,
        icons:'<div class="dkic" data-dkgo="news">✉️<i class="dot"></i></div>'
            + '<div class="dkic" data-dkgo="title">⚙️</div>' })
    + '<div class="dkev" data-dkgo="news"><span class="dkmg">📣</span>'
    + '<span class="tx">新イベント「王国の旅路」開催中！豪華報酬を手に入れよう！</span>'
    + '<span class="ar">›</span></div>'

    + '<div class="dkrail left">' + DK_LEFT.map(function(t){
        return '<div class="dkrb" data-dkgo="' + t.id + '"><span class="ic">' + t.ic + '</span>'
             + '<span class="tx">' + t.nm + '</span></div>'; }).join('') + '</div>'
    + '<div class="dkrail right">' + DK_RIGHT.map(function(t){
        var b = (t.id === 'daily' && canDaily()) || (t.id === 'quest' && questReady());
        return '<div class="dkrb" data-dkgo="' + t.id + '"><span class="ic">' + t.ic + '</span>'
             + '<span class="tx">' + t.nm + '</span>' + (b ? '<i class="nw">!</i>' : '') + '</div>';
      }).join('') + '</div>'

    + '<div class="dkhome">'
    +   '<div class="dkcard">'
    +     '<div class="frame">'
    +       '<div class="hd"><span class="rar dkrar">' + esc(c.rar) + '</span>'
    +         '<span class="nm">' + esc(c.nm) + '</span></div>'
    +       '<div class="pic"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>'
    +         (img ? '' : '<span class="ph">' + esc(c.nm.slice(0, 1)) + '</span>')
    +         '<span class="lv">' + lv + '</span></div>'
    +       '<div class="ft"><span class="sh">🛡️</span><b>' + esc(SV.name || 'あなた') + '</b>'
    +         '<span class="sw" data-dkgo="cards">🔄</span></div>'
    +     '</div>'
    +     '<button class="dkbtn gd enter" id="dkEnter">入場する</button>'
    +   '</div>'
    +   '<div class="dkside">'
    +     '<div class="dktab2"><span class="t on">友だちランキング</span>'
    +       '<span class="t">全体ランキング</span>'
    +       '<span class="q" data-dkgo="news">❓<i>ランキング<br>報酬</i></span></div>'
    +     '<div class="dkrks">' + rows + '</div>'
    +     '<div class="dkmile"><span class="l">マイレージ</span>'
    +       '<span class="dkbar gd"><i style="width:' + (mile / 20 * 100) + '%"></i>'
    +       '<em>' + mile + '/20 マイレージを貯めてガチャ</em></span>'
    +       '<span class="key">🔑 ' + (SV.gem % 7) + '</span></div>'
    +   '</div>'
    + '</div>'
    + walletHTML());

  dkWire(el);
  var go = document.getElementById('dkEnter');
  if(go) go.onclick = function(){ SFX.click(); screenTo('setup'); };
  dkSparks(el.querySelector('.dkcard .pic'), 7, {x:10, y:10, w:300, h:360});
  screenTo('home');
  bgm('lobby');
}

/* ══════════════════════════════════════════════════════════════
   ミッション
   ══════════════════════════════════════════════════════════════ */
let dkQuestTab = 'daily';
const DK_QTABS = [
  {id:'daily',  ic:'🪶', nm:'デイリー'},
  {id:'weekly', ic:'📅', nm:'ウィークリー'},
  {id:'trophy', ic:'🏆', nm:'実績'}
];
/* 週替わり・実績は、既存のミッションを別の目標値で見せる */
function dkQuestList(tab){
  if(tab === 'weekly'){
    return QUESTS.map(function(q){
      return { id:'w_' + q.id, nm:q.nm.replace(/^\d+/, function(m){ return String(m * 3); }),
               need:q.need * 3, get:q.get, rw:{ g:(q.rw.g || 0) * 3, d:(q.rw.d || 0) * 2 } };
    });
  }
  if(tab === 'trophy'){
    return QUESTS.map(function(q){
      return { id:'t_' + q.id, nm:q.nm.replace(/^\d+/, function(m){ return String(m * 10); }),
               need:q.need * 10, get:q.get, rw:{ g:(q.rw.g || 0) * 10, d:(q.rw.d || 0) * 5 } };
    });
  }
  return QUESTS;
}
function dkQDesc(nm){
  if(/対戦|プレイ/.test(nm)) return "ほかのプレイヤーと遊ぼう。";
  if(/勝/.test(nm))          return "1位をとろう。";
  if(/あつめる/.test(nm))    return "キューブやショップで手に入る。";
  if(/育てる/.test(nm))      return "同じカードを重ねてLvを上げよう。";
  if(/ペンダント/.test(nm))  return "4つの枠すべてに装備しよう。";
  return "クリアすると報酬がもらえる。";
}
function dkQIcon(nm){
  if(/勝/.test(nm))        return '🏆';
  if(/対戦|プレイ/.test(nm)) return '🎲';
  if(/カード/.test(nm))     return '🎴';
  if(/ペンダント/.test(nm)) return '📿';
  return '📜';
}
function showQuest(){
  var list = dkQuestList(dkQuestTab);
  var done = 0;
  var rowsHTML = list.map(function(q, i){
    var cur = Math.min(q.need, q.get(SV) || 0);
    var ok  = cur >= q.need, got = !!SV.qdone[q.id];
    if(got) done++;
    return '<div class="dkq" style="animation-delay:' + (i * .05 + .1).toFixed(2) + 's">'
      + '<div class="ic">' + dkQIcon(q.nm) + '</div>'
      + '<div class="mid"><div class="nm">' + esc(q.nm) + '</div>'
      +   '<div class="ds">' + esc(dkQDesc(q.nm)) + '</div>'
      +   '<div class="prog"><span class="dkbar' + (ok ? '' : ' bl') + '">'
      +     '<i style="width:' + (cur / q.need * 100) + '%"></i></span>'
      +     '<b>' + cur + '/' + q.need + '</b></div></div>'
      + '<div class="rw">'
      +   (q.rw.g ? '<div class="c"><div class="i">🪙</div><div class="v">×' + q.rw.g.toLocaleString() + '</div></div>' : '')
      +   (q.rw.d ? '<div class="c"><div class="i">💎</div><div class="v">×' + q.rw.d + '</div></div>' : '')
      + '</div>'
      + (got ? '<button class="dkbtn gy" disabled>受取済</button>'
             : ok ? '<button class="dkbtn gr" data-dkq="' + q.id + '">受け取る</button>'
                  : '<button class="dkbtn gy">進行中</button>')
      + '</div>';
  }).join('');

  var any = list.some(function(q){ return !SV.qdone[q.id] && (q.get(SV) || 0) >= q.need; });
  var el = dkMake('quest', 'quest',
      dkHead('quest', {})
    + dkTabs(DK_QTABS, dkQuestTab)
    + '<div class="dkbody">'
    +   '<div class="dkpar dkqbox">'
    +     '<div class="dkqhd dkttl ink">ミッションをクリアして、豪華な報酬を手に入れよう！</div>'
    +     '<div class="dkqlist">' + rowsHTML + '</div>'
    +     '<button class="dkbtn gd all" id="dkAll"' + (any ? '' : ' disabled') + '>🎁 一括受取</button>'
    +   '</div>'
    +   '<div class="dkdark dkqside">'
    +     '<div class="hd dkttl">デイリーコンプリート報酬</div>'
    +     '<p>すべてのミッションをクリアして、<br>特別な報酬を手に入れよう！</p>'
    +     '<div class="chest"' + (dkU('hero-chest') ? ' style="background-image:url(' + dkU('hero-chest') + ')"' : '') + '>'
    +       (dkU('hero-chest') ? '' : '🎁') + '</div>'
    +     '<div class="ft"><span>達成状況</span>'
    +       '<span class="dkbar gd"><i style="width:' + (done / Math.max(1, list.length) * 100) + '%"></i></span>'
    +       '<b>' + done + '/' + list.length + '</b></div>'
    +   '</div>'
    + '</div>');

  dkWire(el, function(id){ dkQuestTab = id; showQuest(); });
  el.querySelectorAll('[data-dkq]').forEach(function(b){
    b.onclick = function(){ dkTakeQuest(b.dataset.dkq, list); };
  });
  var all = document.getElementById('dkAll');
  if(all) all.onclick = function(){
    if(all.disabled) return;
    list.forEach(function(q){
      if(!SV.qdone[q.id] && (q.get(SV) || 0) >= q.need) dkTakeQuest(q.id, list, true);
    });
    saveNow(); SFX.coin();
    dkBurst(all, '🪙', 22);
    toast('R', '🎁', 'まとめて受け取りました', '報酬を手に入れた', 1800);
    setTimeout(showQuest, 520);
  };
  dkSparks(el.querySelector('.dkqside'), 6, {x:24, y:120, w:300, h:220});
  screenTo('quest');
}
function dkTakeQuest(id, list, quiet){
  var q = list.find(function(x){ return x.id === id; });
  if(!q || SV.qdone[q.id]) return;
  if((q.get(SV) || 0) < q.need) return;
  SV.qdone[q.id] = 1;
  if(q.rw.g) SV.gold += q.rw.g;
  if(q.rw.d) SV.gem  += q.rw.d;
  if(quiet) return;
  saveNow(); SFX.coin(); dkWallet();
  dkBurst(document.getElementById('dkGold'), q.rw.d ? '💎' : '🪙', 14);
  toast('R', '🎁', esc(q.nm), '報酬を受け取りました', 1700);
  showQuest();
}

/* ══════════════════════════════════════════════════════════════
   ペンダント
   ══════════════════════════════════════════════════════════════ */
let dkPendSel = null;
const DK_PTABS = [
  {id:'pend', ic:'📿', nm:'ペンダント'},
  {id:'have', ic:'🧰', nm:'所持品'},
  {id:'mix',  ic:'⚗️', nm:'合成'},
  {id:'book', ic:'📖', nm:'図鑑'}
];
function dkPendOf(id){ return PENDANTS.find(function(p){ return p.id === id; }) || PENDANTS[0]; }
function showPend(){
  var own = PENDANTS.filter(function(p){ return SV.pendants[p.id]; });
  if(!own.length) own = [PENDANTS[0]];
  if(!dkPendSel || !own.some(function(p){ return p.id === dkPendSel; })) dkPendSel = own[0].id;
  var p  = dkPendOf(dkPendSel);
  var lv = ((SV.pendants[p.id] || {}).lv) || 1;
  var eq = SV.slots.indexOf(p.id) >= 0;
  var hero = dkU('hero-pend');

  var listHTML = own.map(function(o){
    var l = ((SV.pendants[o.id] || {}).lv) || 1;
    return '<div class="dkitem' + (o.id === dkPendSel ? ' on' : '') + '" data-dkp="' + o.id + '">'
      + (SV.slots.indexOf(o.id) >= 0 ? '<span class="eq">装備中</span>' : '')
      + '<span class="pic">' + o.ic + '</span>'
      + '<span class="lv">Lv.' + l + '</span>'
      + '<span class="nm">' + esc(o.nm) + '</span></div>';
  }).join('');

  var el = dkMake('pend', 'pend',
      dkHead('pend', {})
    + dkTabs(DK_PTABS, 'pend')
    + '<div class="dkbody dkcol">'
    +   '<div class="dkmain">'
    +     '<div class="dkstage">'
    +       '<div class="cap">運命を<br>その胸に。</div>'
    +       '<div class="dkhero"' + (hero ? ' style="background-image:url(' + hero + ');left:6%;top:2%;width:76%;height:92%">'
                                         : ' style="left:20%;top:14%;width:52%;height:62%;font-size:190px;text-align:center">')
    +         (hero ? '' : p.ic) + '</div>'
    +     '</div>'
    +     '<div class="dkdark dkdet">'
    +       '<div class="hd"><span class="dkrar r">' + esc(p.rar) + '</span>'
    +         '<span class="nm">' + esc(p.nm) + '</span>'
    +         '<span class="lv">Lv.' + lv + '</span></div>'
    +       '<div class="ef"><span class="ic">✨</span><div><b>' + esc(p.nm) + 'の力</b>'
    +         '<p>' + esc(p.ds) + '</p></div></div>'
    +       '<div class="st"><span class="l">🪙 発動のしやすさ</span>'
    +         '<span class="dkbar gd"><i style="width:' + Math.round(p.p * 100) + '%"></i></span>'
    +         '<b>' + Math.round(p.p * 100) + '%</b></div>'
    +       '<div class="st"><span class="l">🍀 幸運ボーナス</span>'
    +         '<span class="dkbar"><i style="width:' + Math.min(100, lv * 15) + '%"></i></span>'
    +         '<b>+' + (lv * 3) + '%</b></div>'
    +       '<div class="btns">'
    +         '<button class="dkbtn gd" id="dkUp">強化する</button>'
    +         '<button class="dkbtn gr" id="dkEq"' + (eq ? ' disabled' : '') + '>'
    +           (eq ? '装備中' : '装備する') + '</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="dkdark dkbottom"><span class="cnt">所持<br>ペンダント<br><b>'
    +     own.length + '/' + PENDANTS.length + '</b></span>'
    +     '<div class="dkrow">' + listHTML + '</div></div>'
    + '</div>');

  dkWire(el, function(id){ if(id !== 'pend') toast('L', '🚧', 'ただいま準備中', 'もう少しお待ちください', 1500); });
  el.querySelectorAll('[data-dkp]').forEach(function(b){
    b.onclick = function(){ SFX.click(); dkPendSel = b.dataset.dkp; showPend(); };
  });
  var up = document.getElementById('dkUp');
  if(up) up.onclick = function(){
    var cost = 300 + lv * 260;
    if(SV.gold < cost){ toast('L', '🪙', 'ゴールドが足りません', '必要 ' + cost.toLocaleString() + 'G', 1600); return; }
    SV.gold -= cost;
    if(!SV.pendants[p.id]) SV.pendants[p.id] = {};
    SV.pendants[p.id].lv = lv + 1;
    saveNow(); SFX.coin(); dkWallet();
    dkBurst(up, '⭐', 14);
    toast('R', '📿', esc(p.nm), 'Lv.' + (lv + 1) + ' になりました', 1600);
    showPend();
  };
  var eqb = document.getElementById('dkEq');
  if(eqb) eqb.onclick = function(){
    if(eq) return;
    var i = SV.slots.indexOf(null);
    if(i < 0) i = 0;
    SV.slots[i] = p.id; saveNow(); SFX.click();
    toast('R', '📿', esc(p.nm), '装備しました', 1500);
    showPend();
  };
  dkSparks(el.querySelector('.dkstage'), 9, {x:40, y:30, w:520, h:420});
  screenTo('pend');
}

/* ══════════════════════════════════════════════════════════════
   サイコロ
   ══════════════════════════════════════════════════════════════ */
let dkDiceSel = null;
const DK_DTABS = [
  {id:'dice', ic:'🎲', nm:'サイコロ'},
  {id:'up',   ic:'⬆️', nm:'強化'},
  {id:'evo',  ic:'⭐', nm:'進化'},
  {id:'book', ic:'📖', nm:'図鑑'}
];
function showDice(){
  var own = DICE.filter(function(d){ return SV.dice[d.id]; });
  if(!own.length){ SV.dice.d0 = 1; own = [DICE[0]]; }
  if(!dkDiceSel || !own.some(function(d){ return d.id === dkDiceSel; })) dkDiceSel = SV.die || own[0].id;
  var d  = dieById(dkDiceSel);
  var lv = SV.dice[d.id] || 1;
  var eq = SV.die === d.id;
  var hero = dkU('hero-dice');

  var listHTML = DICE.map(function(o){
    var have = !!SV.dice[o.id];
    return '<div class="dkitem' + (o.id === dkDiceSel ? ' on' : '') + (have ? '' : ' lock') + '"'
      + ' data-dkd="' + o.id + '">'
      + (SV.die === o.id ? '<span class="eq">装備中</span>' : '')
      + '<span class="pic" style="color:' + o.col + '">' + (have ? o.ic : '🔒') + '</span>'
      + '<span class="lv">' + (have ? 'Lv.' + (SV.dice[o.id] || 1) : '未所持') + '</span>'
      + '<span class="nm">' + esc(o.nm) + '</span></div>';
  }).join('');

  var bars = [
    ['⚔️ 出目の大きさ', Math.round((d.big || 0) * 60 + 20), 'rd', '+' + Math.round((d.big || 0) * 22) + '%'],
    ['🎯 ゲージの当たり', Math.min(100, (d.gauge || 0) * 5 + 20), 'bl', '+' + (d.gauge || 0)],
    ['🎲 ゾロ目の出やすさ', Math.min(100, (d.dbl || 0) * 500 + 18), 'gd', '+' + Math.round((d.dbl || 0) * 100) + '%'],
    ['🍀 育ち具合', Math.min(100, lv * 16), '', 'Lv.' + lv]
  ].map(function(b){
    return '<div class="st"><span class="l">' + b[0] + '</span>'
      + '<span class="dkbar ' + b[2] + '"><i style="width:' + b[1] + '%"></i></span>'
      + '<b>' + b[3] + '</b></div>';
  }).join('');

  var el = dkMake('dice', 'dice',
      dkHead('dice', {})
    + dkTabs(DK_DTABS, 'dice')
    + '<div class="dkbody dkcol">'
    +   '<div class="dkmain">'
    +     '<div class="dkstage">'
    +       '<div class="cap">運が、<br>世界を動かす。</div>'
    +       '<div class="dkhero"' + (hero ? ' style="background-image:url(' + hero + ');left:4%;top:4%;width:82%;height:88%">'
                                         : ' style="left:22%;top:16%;width:50%;height:58%;font-size:180px;text-align:center">')
    +         (hero ? '' : d.ic) + '</div>'
    +     '</div>'
    +     '<div class="dkdark dkdet">'
    +       '<div class="hd"><span class="dkrar r">' + esc(d.rar) + '</span>'
    +         '<span class="nm">' + esc(d.nm) + '</span>'
    +         '<span class="lv">Lv.' + lv + '</span></div>'
    +       '<div class="ef"><span class="ic">🎲</span><div><b>サイコロの力</b>'
    +         '<p>' + esc(d.ds) + '</p></div></div>'
    +       bars
    +       '<div class="btns"><button class="dkbtn gd" id="dkDup">強化する</button>'
    +         '<button class="dkbtn gr" id="dkDeq"' + (eq ? ' disabled' : '') + '>'
    +         (eq ? '装備中' : '装備する') + '</button></div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="dkdark dkbottom"><span class="cnt">所持<br>サイコロ<br><b>'
    +     own.length + '/' + DICE.length + '</b></span>'
    +     '<div class="dkrow">' + listHTML + '</div></div>'
    + '</div>');

  dkWire(el, function(id){ if(id !== 'dice') toast('L', '🚧', 'ただいま準備中', 'もう少しお待ちください', 1500); });
  el.querySelectorAll('[data-dkd]').forEach(function(b){
    b.onclick = function(){ SFX.click(); dkDiceSel = b.dataset.dkd; showDice(); };
  });
  var up = document.getElementById('dkDup');
  if(up) up.onclick = function(){
    if(!SV.dice[d.id]){ toast('L', '🔒', 'まだ持っていません', 'キューブで手に入ります', 1600); return; }
    var cost = 400 + lv * 320;
    if(SV.gold < cost){ toast('L', '🪙', 'ゴールドが足りません', '必要 ' + cost.toLocaleString() + 'G', 1600); return; }
    SV.gold -= cost; SV.dice[d.id] = lv + 1;
    saveNow(); SFX.coin(); dkWallet();
    dkBurst(up, '⭐', 14);
    toast('R', '🎲', esc(d.nm), 'Lv.' + (lv + 1) + ' になりました', 1600);
    showDice();
  };
  var eqb = document.getElementById('dkDeq');
  if(eqb) eqb.onclick = function(){
    if(eq) return;
    if(!SV.dice[d.id]){ toast('L', '🔒', 'まだ持っていません', 'キューブで手に入ります', 1600); return; }
    SV.die = d.id; saveNow(); SFX.click();
    toast('R', '🎲', esc(d.nm), '装備しました', 1500);
    showDice();
  };
  dkSparks(el.querySelector('.dkstage'), 9, {x:40, y:30, w:520, h:400});
  screenTo('dice');
}

/* ══════════════════════════════════════════════════════════════
   ショップ（ゴールドで買う。現実のお金は使いません）
   ══════════════════════════════════════════════════════════════ */
let dkShopTab = 'osusume';
const DK_STABS = [
  {id:'osusume', ic:'👑', nm:'おすすめ'},
  {id:'card',    ic:'🎴', nm:'カード'},
  {id:'gem',     ic:'💎', nm:'ダイヤ'}
];
function dkGoods(tab){
  if(tab === 'card') return [
    { k:'goods-card', ic:'🎴', nm:'カードチケット', ds:'カードが1枚もらえます。',  pay:'gem', cost:8,   act:'card' },
    { k:'goods-card', ic:'🎴', nm:'10連チケット',   ds:'カードが10枚もらえます。', pay:'gem', cost:70,  act:'card10' },
    { k:'goods-gold', ic:'🪙', nm:'小さな金貨袋',   ds:'ゴールドが増えます。',     pay:'gem', cost:3,   act:'gold' }
  ];
  if(tab === 'gem') return [
    { k:'goods-gem',  ic:'💎', nm:'ダイヤ小袋', ds:'ゴールドをダイヤに替えます。', pay:'gold', cost:2400,  act:'gem5' },
    { k:'goods-gem',  ic:'💎', nm:'ダイヤ袋',   ds:'まとめて替えるとお得です。',   pay:'gold', cost:8600,  act:'gem20' },
    { k:'goods-gold', ic:'🪙', nm:'大きな金貨袋', ds:'ゴールドがどっさり。',       pay:'gem', cost:11,    act:'goldBig' }
  ];
  return [
    { k:'goods-card', ic:'🎴', nm:'プレミアムカード', ds:'特別な仲間との出会いが、あなたを待っています。',
      pay:'gem', cost:8, act:'card', tag:'限定' },
    { k:'goods-gold', ic:'🪙', nm:'ゴールドパック',   ds:'冒険に必要なゴールドをお得に獲得できます。',
      pay:'gem', cost:3, act:'gold' },
    { k:'goods-gem',  ic:'💎', nm:'ダイヤパック',     ds:'ダイスキングダムの特別なアイテムに使えます。',
      pay:'gold', cost:2400, act:'gem5' }
  ];
}
function showShop(){
  var list = dkGoods(dkShopTab);
  var clerk = dkU('hero-clerk');
  var cards = list.map(function(g, i){
    var u = dkU(g.k);
    var can = (g.pay === 'gem') ? SV.gem >= g.cost : SV.gold >= g.cost;
    return '<div class="dkgood" style="animation-delay:' + (i * .07 + .08).toFixed(2) + 's">'
      + (g.tag ? '<span class="tag">' + esc(g.tag) + '</span>' : '')
      + '<div class="pic"' + (u ? ' style="background-image:url(' + u + ')"' : '') + '>'
      +   (u ? '' : '<span class="ph">' + g.ic + '</span>') + '</div>'
      + '<div class="nm">' + esc(g.nm) + '</div>'
      + '<div class="ds">' + esc(g.ds) + '</div>'
      + '<div class="pr"><span class="c">' + (g.pay === 'gem' ? '💎' : '🪙') + ' '
      +   g.cost.toLocaleString() + '</span></div>'
      + '<button class="dkbtn gr" data-dks="' + g.act + '" data-dkc="' + g.cost + '" data-dkp="'
      +   g.pay + '"' + (can ? '' : ' disabled') + '>' + (can ? '購入' : 'たりない') + '</button>'
      + '</div>';
  }).join('');

  var el = dkMake('shop', 'shop',
      dkHead('shop', {})
    + '<div class="dkbody dkshop">'
    +   (clerk ? '<div class="dkclerk" style="background-image:url(' + clerk + ')"></div>' : '')
    +   '<div class="dkshopmain">'
    +     '<div class="dkstabs">' + DK_STABS.map(function(t){
            return '<span class="s' + (t.id === dkShopTab ? ' on' : '') + '" data-dktab="' + t.id + '">'
                 + t.ic + ' ' + t.nm + '</span>'; }).join('')
    +       '<span class="note">運が出会う、<br>特別なアイテムたち。</span></div>'
    +     '<div class="dkgoods">' + cards + '</div>'
    +   '</div>'
    + '</div>');

  dkWire(el, function(id){ dkShopTab = id; showShop(); });
  el.querySelectorAll('[data-dks]').forEach(function(b){
    b.onclick = function(){ dkBuy(b.dataset.dks, +b.dataset.dkc, b.dataset.dkp); };
  });
  screenTo('shop');
}
function dkBuy(act, cost, pay){
  if(pay === 'gem' && SV.gem < cost){ toast('L', '💎', 'ダイヤが足りません', '必要 ' + cost, 1600); return; }
  if(pay === 'gold' && SV.gold < cost){ toast('L', '🪙', 'ゴールドが足りません', '必要 ' + cost.toLocaleString() + 'G', 1600); return; }
  if(pay === 'gem') SV.gem -= cost; else SV.gold -= cost;
  var msg = '';
  if(act === 'card'){    var c = drawOne(); grant(c); msg = esc(c.nm) + ' を手に入れた'; }
  else if(act === 'card10'){ for(var i = 0; i < 10; i++) grant(drawOne()); msg = 'カードを10枚 手に入れた'; }
  else if(act === 'gold'){    SV.gold += 60000;  msg = '60,000 ゴールド'; }
  else if(act === 'goldBig'){ SV.gold += 260000; msg = '260,000 ゴールド'; }
  else if(act === 'gem5'){    SV.gem  += 5;      msg = 'ダイヤ5個'; }
  else if(act === 'gem20'){   SV.gem  += 20;     msg = 'ダイヤ20個'; }
  saveNow(); SFX.coin(); dkWallet();
  dkBurst(document.getElementById('dkGold'), '✨', 18);
  toast('R', '🛒', '購入しました', msg, 1800);
  showShop();
}

/* ══════════════════════════════════════════════════════════════
   出席簿
   ══════════════════════════════════════════════════════════════ */
function showDaily(){
  var day = (SV.dailyN || 0) % 7;
  var cells = DAILY.map(function(d, i){
    var got = i < day, now = (i === day && canDaily());
    return '<div class="dkday' + (got ? ' got' : '') + (now ? ' now' : '') + '"'
      + ' style="animation-delay:' + (i * .06 + .1).toFixed(2) + 's">'
      + '<div class="dd">' + (i + 1) + '日目</div>'
      + '<div class="di">' + d.ic + '</div>'
      + '<div class="dn">' + esc(d.nm) + ' ×' + d.v + '</div>'
      + (got ? '<div class="chk">受取済</div>' : '')
      + (now ? '<div class="today">今日</div>' : '')
      + '</div>';
  }).join('');

  var el = dkMake('daily', 'quest',
      dkHead('daily', { title:'出席簿' })
    + '<div class="dkbody">'
    +   '<div class="dkpar dkdaily">'
    +     '<div class="dkqhd dkttl ink">毎日ログインして、7日ぶんの報酬を受け取ろう！</div>'
    +     '<div class="dkdays">' + cells + '</div>'
    +     '<button class="dkbtn gd all" id="dGet"' + (canDaily() ? '' : ' disabled') + '>'
    +       (canDaily() ? '今日のぶんを受け取る' : '今日はもう受け取りました') + '</button>'
    +   '</div>'
    + '</div>');

  dkWire(el);
  var b = document.getElementById('dGet');
  if(b) b.onclick = async function(){
    if(!canDaily()) return;
    var d = DAILY[day];
    SV.dailyAt = todayKey(); SV.dailyN = (SV.dailyN || 0) + 1;
    if(d.ic === '🪙') SV.gold += d.v;
    if(d.ic === '💎') SV.gem  += d.v;
    if(d.ic === '📿'){ var p = PENDANTS[(Math.random() * PENDANTS.length) | 0];
                       if(!SV.pendants[p.id]) SV.pendants[p.id] = {}; }
    if(d.ic === '✨'){ grant(drawOne()); }
    saveNow(); SFX.coin(); dkWallet();
    dkBurst(b, d.ic, 16);
    await modal('<div class="modal"><div class="reward"><div class="in">'
      + '<h3>出席ボーナス</h3><div class="items"><div class="it">'
      + '<div class="ic">' + d.ic + '</div><div class="v">×' + d.v + '</div><div class="l">' + esc(d.nm) + '</div>'
      + '</div></div><div class="btnrow" style="justify-content:center;margin-top:12px">'
      + '<button class="btn gold" data-act="ok">受け取る</button></div></div></div></div>');
    showDaily();
  };
  screenTo('daily');
}

/* ══════════════════════════════════════════════════════════════
   王宮スキンのカード画面
   ══════════════════════════════════════════════════════════════ */
let dkCardSel = null;
let dkCardTab = 'own';
const DK_CTABS = [
  {id:'own',  ic:'🎴', nm:'所持'},
  {id:'book', ic:'📖', nm:'図鑑'},
  {id:'up',   ic:'⬆️', nm:'強化'}
];
function showCards(){
  var list = (dkCardTab === 'book') ? CARDPOOL : CARDPOOL.filter(function(c){ return SV.cards[c.id]; });
  if(!list.length) list = [CARDPOOL[0]];
  if(!dkCardSel || !list.some(function(c){ return c.id === dkCardSel; })) dkCardSel = SV.equip || list[0].id;

  var c   = cardById(dkCardSel) || list[0];
  var own = SV.cards[c.id];
  var lv  = own ? own.lv : 1;
  var dup = own ? own.dup : 0;
  var eq  = (SV.equip === c.id);
  var img = dkCharImg(c.id);
  var st  = cardStats(c.id, lv, SV.slots) || {};
  var cost = upCost(lv);

  var bars = STAT_LABELS.map(function(kv){
    var v = st[kv[0]] || 0;
    return '<div class="st"><span class="l">' + esc(kv[1]) + '</span>'
      + '<span class="dkbar' + (v >= 80 ? ' gd' : v >= 60 ? '' : ' bl') + '">'
      + '<i style="width:' + Math.min(100, v) + '%"></i></span>'
      + '<b>' + v + '</b></div>';
  }).join('');

  var listHTML = list.map(function(o){
    var mine = SV.cards[o.id];
    var ti = dkCharImg('t' + o.id.slice(1)) || dkCharImg(o.id);
    return '<div class="dkitem' + (o.id === dkCardSel ? ' on' : '') + (mine ? '' : ' lock') + '"'
      + ' data-dkc="' + o.id + '">'
      + (SV.equip === o.id ? '<span class="eq">装備中</span>' : '')
      + '<span class="pic"' + (mine && ti ? ' style="background-image:url(' + ti + ')"' : '') + '>'
      +   (mine ? (ti ? '' : '🎴') : '🔒') + '</span>'
      + '<span class="lv">' + (mine ? 'Lv.' + mine.lv + (mine.dup ? ' ×' + mine.dup : '') : '未所持') + '</span>'
      + '<span class="nm">' + esc(o.nm) + '</span></div>';
  }).join('');

  var el = dkMake('cards', 'shop',
      dkHead('cards', { title:'カード' })
    + dkTabs(DK_CTABS, dkCardTab)
    + '<div class="dkbody dkcol">'
    +   '<div class="dkmain">'
    +     '<div class="dkstage dkcardstage">'
    +       '<div class="cap">その手に、<br>運命を。</div>'
    +       '<div class="dkbigcard">'
    +         '<div class="hd"><span class="rar dkrar">' + esc(c.rar) + '</span>'
    +           '<span class="nm">' + esc(c.nm) + '</span></div>'
    +         '<div class="pic"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>'
    +           (img ? '' : '<span class="ph">' + esc(c.nm.slice(0, 1)) + '</span>')
    +           '<span class="lv">' + lv + '</span></div>'
    +         '<div class="ft">' + esc(c.role) + '</div>'
    +       '</div>'
    +     '</div>'
    +     '<div class="dkdark dkdet">'
    +       '<div class="hd"><span class="dkrar r">' + esc(c.rar) + '</span>'
    +         '<span class="nm">' + esc(c.nm) + '</span>'
    +         '<span class="lv">Lv.' + lv + '</span></div>'
    +       '<div class="ef"><span class="ic">✨</span><div><b>' + esc(c.sk.nm) + '</b>'
    +         '<p>' + esc(c.sk.ds) + '（1試合 ' + c.sk.uses + '回）</p></div></div>'
    +       '<div class="line">「' + esc(c.line) + '」</div>'
    +       bars
    +       '<div class="btns">'
    +         '<button class="dkbtn gd" id="dkCup"' + (own && lv < 30 ? '' : ' disabled') + '>'
    +           '強化 ' + (own && lv < 30 ? '🪙' + cost.toLocaleString() : 'できません') + '</button>'
    +         '<button class="dkbtn gr" id="dkCeq"' + (eq || !own ? ' disabled' : '') + '>'
    +           (eq ? '装備中' : own ? '装備する' : '未所持') + '</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="dkdark dkbottom"><span class="cnt">所持<br>カード<br><b>'
    +     ownedCards().length + '/' + CARDPOOL.length + '</b></span>'
    +     '<div class="dkrow">' + listHTML + '</div></div>'
    + '</div>');

  dkWire(el, function(id){ dkCardTab = id; showCards(); });
  el.querySelectorAll('[data-dkc]').forEach(function(b){
    b.onclick = function(){ SFX.click(); dkCardSel = b.dataset.dkc; showCards(); };
  });
  var up = document.getElementById('dkCup');
  if(up) up.onclick = function(){
    if(!own || lv >= 30) return;
    if(dup <= 0){ SFX.warn && SFX.warn();
      toast('L', '⬆️', '重なりが足りません', '同じカードをもう1枚引くと強化できます', 2200); return; }
    if(SV.gold < cost){ toast('L', '🪙', 'ゴールドが足りません', '必要 ' + cost.toLocaleString() + 'G', 1800); return; }
    SV.gold -= cost; own.dup--; own.lv++;
    saveNow(); SFX.coin(); dkWallet(); dkBurst(up, '⭐', 16);
    toast('R', '🎴', esc(c.nm), 'Lv.' + own.lv + ' になりました', 1700);
    showCards();
  };
  var eqb = document.getElementById('dkCeq');
  if(eqb) eqb.onclick = function(){
    if(eq || !own) return;
    SV.equip = c.id; saveNow(); SFX.click();
    toast('R', '🎴', esc(c.nm), '装備しました', 1500);
    showCards();
  };
  dkSparks(el.querySelector('.dkcardstage'), 8, {x:40, y:30, w:480, h:400});
  screenTo('cards');
}

/* ══════════════════════════════════════════════════════════════
   キューブ（ガチャ）
   ══════════════════════════════════════════════════════════════ */
let dkLane = 'premium';
function showGacha(){
  var L = LANES[dkLane] || LANES.premium;
  var free = (dkLane === 'premium' && freeLeft() === 0);
  var tabs = Object.keys(LANES).map(function(k){
    return { id:k, ic:(k === 'normal' ? '🧊' : k === 'special' ? '💠' : '👑'), nm:LANES[k].nm };
  });

  var el = dkMake('gacha', 'quest',
      dkHead('gacha', { title:'キューブ' })
    + dkTabs(tabs, dkLane)
    + '<div class="dkbody">'
    +   '<div class="dkstage dkcube">'
    +     '<div class="cap">ひと振りが、<br>運命を変える。</div>'
    +     '<div class="stage" id="gStage"><div class="orb"></div></div>'
    +   '</div>'
    +   '<div class="dkdark dkdet">'
    +     '<div class="hd"><span class="dkrar r">' + (dkLane === 'premium' ? '👑' : dkLane === 'special' ? '💠' : '🧊') + '</span>'
    +       '<span class="nm">' + esc(L.nm) + '</span></div>'
    +     '<div class="ef"><span class="ic">🎁</span><div><b>このキューブの中身</b>'
    +       '<p>' + esc(L.ds) + '<br>ペンダントとサイコロも、まれに出ます。</p></div></div>'
    +     '<div class="st"><span class="l">S+ が出る割合</span>'
    +       '<span class="dkbar gd"><i style="width:' + Math.min(100, L.w.SS * 600) + '%"></i></span>'
    +       '<b>' + (L.w.SS * 100).toFixed(0) + '%</b></div>'
    +     '<div class="st"><span class="l">S が出る割合</span>'
    +       '<span class="dkbar bl"><i style="width:' + Math.min(100, L.w.S * 180) + '%"></i></span>'
    +       '<b>' + (L.w.S * 100).toFixed(0) + '%</b></div>'
    +     '<div class="st"><span class="l">A が出る割合</span>'
    +       '<span class="dkbar"><i style="width:' + Math.min(100, L.w.A * 110) + '%"></i></span>'
    +       '<b>' + (L.w.A * 100).toFixed(0) + '%</b></div>'
    +     (dkLane === 'premium'
        ? '<div class="free" id="gFree">' + (free ? 'いま無料で引けます' : '次の無料まで ' + mmss(freeLeft())) + '</div>'
        : '<div class="free">持っているカードが出たら「重なり」になり、強化に使えます。</div>')
    +     '<div class="btns">'
    +       '<button class="dkbtn gr" data-lane="' + dkLane + '" data-n="1">'
    +         (free ? '無料で1回' : '1回 ' + L.cur + L.one.toLocaleString()) + '</button>'
    +       '<button class="dkbtn gd" data-lane="' + dkLane + '" data-n="5">'
    +         '5連 ' + L.cur + L.five.toLocaleString() + '</button>'
    +     '</div>'
    +   '</div>'
    + '</div>');

  dkWire(el, function(id){ dkLane = id; showGacha(); });
  el.querySelectorAll('[data-lane]').forEach(function(b){
    b.onclick = function(){ doGacha(b.dataset.lane, +b.dataset.n); };
  });
  if(gachaTimer) clearInterval(gachaTimer);
  gachaTimer = setInterval(function(){
    var f = document.getElementById('gFree');
    if(!f){ clearInterval(gachaTimer); gachaTimer = null; return; }
    var ms = freeLeft();
    f.textContent = ms === 0 ? 'いま無料で引けます' : '次の無料まで ' + mmss(ms);
  }, 1000);
  bgm('gacha');
  screenTo('gacha');
}


/* 待機部屋にも宮殿の背景を渡す。roomPhase は既存のままなので、
   画面ができたあとに背景だけ差し込む（見た目だけの上乗せ） */
function dkRoomSkin(){
  var el = document.getElementById("room"); if(!el) return;
  var u = dkU("bg-quest");
  if(u) el.style.setProperty("--dk-room-bg", "url(" + u + ")");
  /* 座席の顔をカードの絵にする（手描きのアバターだと24人の絵柄と合わないため） */
  el.querySelectorAll(".rm-seat .fc canvas.sp").forEach(function(cv){
    var id = cv.dataset.card, img = id ? dkCharImg(id) : "";
    if(!img) return;
    var fc = cv.parentNode;
    fc.classList.add("dkpic");
    fc.style.backgroundImage = "url(" + img + ")";
  });
}
/* 座席は待機部屋が開いたあとに描き直されるので、出てきた瞬間に差し替える。
   childList だけを見るので、こちらが class と style を足しても呼び戻されない。 */
function dkRoomWatch(){
  var el = document.getElementById("room"); if(!el || el._dkObs) return;
  el._dkObs = new MutationObserver(function(){ dkRoomSkin(); });
  el._dkObs.observe(el, { childList:true, subtree:true });
}
if(typeof roomPhase === "function"){
  var _dkRoomPhase = roomPhase;
  roomPhase = function(){
    var p = _dkRoomPhase.apply(this, arguments);
    setTimeout(function(){ dkRoomSkin(); dkRoomWatch(); }, 30);
    setTimeout(dkRoomSkin, 320); setTimeout(dkRoomSkin, 900);
    return p;
  };
}


/* ══════════════════════════════════════════════════════════════
   タイトル画面に、社長の絵を差し込む
   ──────────────────────────────────────────────────────────────
   絵が読めなかったときは dk-noimg を付けて、元の文字だけの画面に戻す。
   「絵が出ないから遊べない」を作らないための保険。
   ══════════════════════════════════════════════════════════════ */
function dkTitleArt(){
  var t = document.getElementById("title"); if(!t) return;
  var big = dkU("title"), sm = dkU("title-sm");
  if(!big){ t.classList.add("dk-noimg"); return; }
  t.style.setProperty("--dk-title", "url(" + big + ")");
  if(sm) t.style.setProperty("--dk-title-sm", "url(" + sm + ")");
  /* 実際に読めたかを確かめる。読めなければ文字の画面へ戻す */
  var probe = new Image();
  probe.onerror = function(){ t.classList.add("dk-noimg"); };
  probe.src = big;
}
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", dkTitleArt);
} else { dkTitleArt(); }

</script>
