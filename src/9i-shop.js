
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — ショップ・ミッション・出席簿（9i-shop.js / v9 WP8 → v10 WP16b）
   ──────────────────────────────────────────────────────────────
   ・宣言し直す関数：showShop(tab), dkGoods, dkBuy, showQuest, dkQuestList,
     dkTakeQuest, questReady, showDaily（関数宣言は後勝ち）。
   ・購読するイベント：match:end / card:up / pend:up / dice:up / shop:buy
     （日・週・通算の回数はここで数える。SV.today / SV.wk / SV.stat）
   ・v10：入場券（C22）を売る・ミッションと出席簿で配る。「実績」→「限定ミッション」（SV.lmq）。出席簿は28日（J41）。
   ・両替の無限増殖は「レート差（売り6,000G／買い30,000G）」と
     「ゴールド→ダイヤは1日1回・5💎まで」の両方でふさぐ。
   ・トップレベルは function 宣言と DKS_ の var と、最後の初期化 IIFE だけ。常時アニメは各画面8個まで。
   ══════════════════════════════════════════════════════════════ */

/* ══════════ 数字の決まり ══════════ */
var DKS_H = 3600000, DKS_DAYMS = 86400000;
var DKS_POT_MS = 4 * 3600000, DKS_POT_G = 800;          // 金貨のつぼ：4時間ごとに 800G
var DKS_MINE_D = 2, DKS_PICKS = 3;                        // ダイヤ鉱山：1日1回 2💎＋つるはし3回
var DKS_MAP_MS = 7 * 86400000;                            // 宝の地図：7日ごと
var DKS_D2G = 6000, DKS_G2D = 30000, DKS_G2D_MAX = 5;     // 両替のレート
var DKS_PED_P = 0.12, DKS_PED_MS = 30 * 60000, DKS_PED_MAX = 2, DKS_PED_GEM_MIN = 20000;
var DKS_RUN_OFF = 0.8;                                    // 同じ品を続けて買うと 20%OFF
var DKS_CHEST = { g:3000, d:3 };                          // デイリーコンプリートの宝箱

var DKS_TABS = [
  { id:'osusume', ic:'👑', nm:'おすすめ' },
  { id:'free',    ic:'🎁', nm:'むりょう' },
  { id:'ticket',  ic:'🎫', nm:'入場券' },
  { id:'dice',    ic:'🎲', nm:'サイコロ' },
  { id:'card',    ic:'🎴', nm:'キャラクターカード' },
  { id:'gem',     ic:'💎', nm:'財貨' }
];
var DKS_PED_TAB = { id:'peddler', ic:'🏮', nm:'行商人' };

/* サイコロの二本立て（ダイヤで今すぐ／プレイヤーLvでゴールド） */
var DKS_DICE = [
  { id:'d1', gem:60,  lv:5,  gold:260000 },
  { id:'d2', gem:80,  lv:8,  gold:360000 },
  { id:'d3', gem:130, lv:11, gold:600000 },
  { id:'d4', gem:160, lv:14, gold:750000 }
];
/* カードのタブ */
var DKS_CARDS = [
  { id:'cc1',  act:'card1',  pay:'gem', base:15,  nm:'カードチケット',     ds:'カードが1枚もらえる。持っていれば重なりになる。', art:'card' },
  { id:'cc10', act:'card10', pay:'gem', base:130, nm:'カードチケット×10', ds:'1枚あたり13ダイヤ。まとめて買うと13%お得。', art:'card10' },
  { id:'ccs',  act:'cardS',  pay:'gem', base:60,  nm:'S以上確定チケット',  ds:'SかS+のカードが必ず1枚。', art:'cardS' }
];
/* 日替わりの候補（朝5時に4つ選ぶ） */
var DKS_DEALS = [
  { id:'dc1',  act:'card1',  pay:'gem',  base:15,    step:1,   nm:'カードチケット',     ds:'カードが1枚もらえる', art:'card' },
  { id:'dc3',  act:'card3',  pay:'gem',  base:45,    step:1,   nm:'カードチケット×3',  ds:'カードが3枚もらえる', art:'card' },
  { id:'dc10', act:'card10', pay:'gem',  base:130,   step:1,   nm:'カードチケット×10', ds:'カードが10枚もらえる', art:'card10' },
  { id:'dcs',  act:'cardS',  pay:'gem',  base:60,    step:1,   nm:'S以上確定チケット',  ds:'SかS+のカードが1枚', art:'cardS' },
  { id:'dcg',  act:'card1',  pay:'gold', base:12000, step:100, nm:'カード1枚（金貨）',  ds:'ゴールドで買えるカード', art:'card' },
  { id:'dpb',  act:'pend',   pay:'gem',  base:40,    step:1,   nm:'ペンダントの小箱',   ds:'ペンダントが1つ入っている', art:'pend' },
  { id:'dpg',  act:'pend',   pay:'gold', base:40000, step:500, nm:'ペンダントの小箱',   ds:'ゴールドで買える小箱', art:'pend' }
];
/* 行商人の品（相場の40〜60%引き。ダイヤは 1💎=20,000G より安く売らない） */
var DKS_PEDS = [
  { id:'pc5', act:'card5', pay:'gem',  base:75,    step:1,    nm:'カードチケット×5',  ds:'カードが5枚', art:'card10' },
  { id:'pcs', act:'cardS', pay:'gem',  base:60,    step:1,    nm:'S以上確定チケット', ds:'SかS+が1枚', art:'cardS' },
  { id:'ppb', act:'pend',  pay:'gold', base:40000, step:500,  nm:'ペンダントの小箱',  ds:'ペンダントが1つ', art:'pend' },
  { id:'pgm', act:'gem3',  pay:'gold', base:90000, step:1000, gems:3, nm:'ダイヤ×3', ds:'ダイヤが3個', art:'gem' }
];
/* 入場券（C22 SV.tickets={biz,first,dia}。クラスの入場で1枚使う＝WP15）。ビジネス550G・ファースト3,000G は本家の値 */
var DKS_TK = [
  { id:'tkb1', tk:'biz',   n:1, pay:'gold', base:550,  nm:'ビジネス入場券',     ds:'ビジネスクラス（500万）に1回入場' },
  { id:'tkb5', tk:'biz',   n:5, pay:'gold', base:2500, nm:'ビジネス入場券×5',   ds:'1枚あたり500G。まとめてお得' },
  { id:'tkf1', tk:'first', n:1, pay:'gold', base:3000, nm:'ファースト入場券',   ds:'ファーストクラス（1000万）に1回入場' },
  { id:'tkd1', tk:'dia',   n:1, pay:'gem',  base:50,   nm:'ダイヤモンド入場券', ds:'ダイヤモンドクラス（1対1）に1回入場' }
];
var DKS_TKCOL = { biz:'#6FB8F5', first:'#F2C230', dia:'#9ED8FF' };
var DKS_FRCOL = { bronze:'#D08A4E', silver:'#D5DEE8', gold:'#FFD44A' };
var DKS_EX_SELL = [1, 10, 50];                            // ダイヤ→ゴールドの束

/* ══════════ ミッション ══════════ */
var DKS_QTABS = [
  { id:'daily',  ic:'🪶', nm:'デイリー' },
  { id:'weekly', ic:'📅', nm:'ウィークリー' },
  { id:'limit',  ic:'🏅', nm:'限定ミッション' }
];
var DKS_QD = [
  { id:'d1', ic:'🎲', nm:'対戦を3回する',             need:3, unit:'回', go:'play',  ds:'きょう対戦した回数。',     get:function(c){ return c.t.plays; }, rw:{ g:2000 } },
  { id:'d2', ic:'🏆', nm:'1回勝つ',                   need:1, unit:'回', go:'play',  ds:'きょう1位になった回数。', get:function(c){ return c.t.wins; },  rw:{ g:3000 } },
  { id:'d3', ic:'🎴', nm:'カードを1回強化する',       need:1, unit:'回', go:'cards', ds:'カード画面の強化で進む。', get:function(c){ return c.t.cup; },   rw:{ d:2 } },
  { id:'d4', ic:'📿', nm:'ペンダントかサイコロを強化', need:1, unit:'回', go:'pend',  ds:'どちらを強化しても進む。', get:function(c){ return (c.t.ptry | 0) + (c.t.dup | 0); }, rw:{ g:2000 } },
  { id:'d5', ic:'🛒', nm:'ショップで1回買う',         need:1, unit:'回', go:'shop',  ds:'両替と無料の品は数えない。', get:function(c){ return c.t.buy; }, rw:{ d:2 } }
];
var DKS_QW = [
  { id:'w1', ic:'🎲', nm:'対戦を10回する',       need:10, unit:'回', go:'play',  ds:'今週の対戦回数。',     get:function(c){ return c.w.plays; }, rw:{ g:8000, tk:'biz' } },
  { id:'w2', ic:'🏆', nm:'5回勝つ',             need:5,  unit:'回', go:'play',  ds:'今週1位になった回数。', get:function(c){ return c.w.wins; },  rw:{ d:12 } },
  { id:'w3', ic:'🎴', nm:'カードを3回強化する', need:3,  unit:'回', go:'cards', ds:'カード画面の強化で進む。', get:function(c){ return c.w.cup; }, rw:{ g:6000 } },
  { id:'w4', ic:'📿', nm:'ペンダントを +1 にする', need:1, unit:'回', go:'pend', ds:'強化に成功すると進む。', get:function(c){ return c.w.pup; },  rw:{ d:8 } },
  { id:'w5', ic:'🛒', nm:'ショップで3回買う',   need:3,  unit:'回', go:'shop',  ds:'両替と無料の品は数えない。', get:function(c){ return c.w.buy; }, rw:{ g:5000 } }
];
/* 限定ミッション（J55）：系統ごとに1段ずつ。今の段をクリアすると次の段が開く（SV.lmq＝系統→今の段の番号）。
   報酬に入場券（tk）と名札の枠（fr：銅・銀・金）を入れる（G22）。数字は当作 */
var DKS_LM = [
  { s:'play', ic:'🎲', nm:'通算%回 対戦する',        unit:'回', go:'play',     st:[10, 50, 100, 300],
    rw:[{ g:5000 }, { g:20000, tk:'biz' }, { d:30, fr:'bronze' }, { d:60, tk:'first' }], get:function(c){ return Math.max(c.st.plays | 0, SV.plays | 0); } },
  { s:'win',  ic:'🏆', nm:'通算%回 勝つ',            unit:'回', go:'play',     st:[5, 25, 50, 150],
    rw:[{ g:8000 }, { d:30 }, { d:50, fr:'silver' }, { d:100, fr:'gold' }], get:function(c){ return Math.max(c.st.wins | 0, SV.wins | 0); } },
  { s:'card', ic:'🎴', nm:'カードを%種あつめる',     unit:'種', go:'gacha',    st:[6, 12, 24],
    rw:[{ d:10 }, { d:20 }, { g:50000, tk:'dia' }], get:function(){ return dksOwnCards(); } },
  { s:'clv',  ic:'⭐', nm:'カードを Lv% にする',     unit:'Lv', go:'cards',    st:[10, 20, 30],
    rw:[{ g:10000 }, { d:20 }, { pend:'SS' }], get:function(){ return dksMaxCardLv(); } },
  { s:'pend', ic:'📿', nm:'ペンダントを%種あつめる', unit:'種', go:'pend',     st:[4, 8],
    rw:[{ d:10 }, { d:25 }], get:function(){ return dksOwnPends(); } },
  { s:'pup',  ic:'💠', nm:'ペンダントを +% にする',  unit:'段', go:'pend',     st:[3, 5, 7],
    rw:[{ g:10000 }, { g:20000 }, { g:30000, tk:'first' }], get:function(){ return dksMaxPendPlus(); } },
  { s:'dice', ic:'🎲', nm:'サイコロを%種あつめる',   unit:'種', go:'diceshop', st:[3, 5],
    rw:[{ d:15 }, { d:25 }], get:function(){ return dksOwnDice(); } },
  { s:'dlv',  ic:'💎', nm:'サイコロを Lv% にする',   unit:'Lv', go:'dice',     st:[5, 10],
    rw:[{ g:15000 }, { g:40000 }], get:function(){ return dksMaxDieLv(); } }
];
/* 旧「実績」（t1〜t9）を受け取っていた人は、その段まで進めておく（同じ報酬を二度もらわない。1回だけ） */
var DKS_LMOLD = { t1:['play', 1], t2:['win', 1], t3:['card', 1], t4:['card', 2], t5:['clv', 2], t6:['pend', 1], t7:['pup', 2], t8:['dice', 1], t9:['dlv', 1] };
var DKS_PLACE = {
  play:     { nm:'対戦へ行く',       tip:'対戦すると進みます。' },
  cards:    { nm:'カード画面へ',     tip:'カード画面の「強化」で進みます。' },
  pend:     { nm:'ペンダント画面へ', tip:'ペンダント画面の「強化」で進みます。' },
  dice:     { nm:'サイコロ画面へ',   tip:'サイコロ画面の「強化」で上がります。' },
  shop:     { nm:'ショップへ',       tip:'ショップのおすすめ・カード・サイコロで買うと進みます。' },
  gacha:    { nm:'ガチャへ',         tip:'ガチャを引くとカードが集まります。' },
  diceshop: { nm:'サイコロを見る',   tip:'ショップの「サイコロ」タブで買えます。' }
};

/* ══════════ 画面の状態（保存しない） ══════════ */
var DKS_tab = 'osusume', DKS_qtab = 'daily', DKS_run = null, DKS_busy = false;
var DKS_seed = 0, DKS_mseq = 0, DKS_g2dN = 1, DKS_focus = '', DKS_ready = '', DKS_gr0 = null;

/* ══════════ 小さな道具 ══════════ */
function dksN(v){ return (Math.round(+v || 0)).toLocaleString(); }
function dksCur(pay){ return pay === 'gem' ? '<i class="dkgem dks-ci"></i>' : '<i class="dkcoin dks-ci"></i>'; }
function dksPrice(pay, v){ return dksCur(pay) + '<span>' + dksN(v) + '</span>'; }
function dksHMS(ms){
  ms = Math.max(0, ms);
  var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  return (h ? h + ':' : '') + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
}
function dksLong(ms){
  ms = Math.max(0, ms);
  var d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000);
  return d > 0 ? d + '日' + h + '時間' : dksHMS(ms);
}
function dksOn(){ var s = document.querySelector('.screen.on'); return s ? s.id : ''; }
function dksSfx(n){ try{ if(SFX && SFX[n]) SFX[n](); }catch(e){} }
/* 文字列の種 → 32bit（FNV-1a）と、種から作る固定の乱数（mulberry32） */
function dksHash(s){
  var h = 2166136261 >>> 0; s = String(s);
  for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function dksMul(seed){
  var a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0; var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* ショップの中の乱数（対戦の Math.random を乱さない。オンラインの共有乱数にも触れない） */
function dksRnd(){
  var s = DKS_seed || ((Date.now() ^ 0x5bd1e995) >>> 0) || 1;
  s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
  DKS_seed = s; return s / 4294967296;
}
/* 行商人が来るかのくじ（台本から差し替えられるように関数にしておく） */
function dksPedRoll(){ return dksRnd(); }

/* ── 日付の鍵 ── */
/* ショップの1日は朝5時で切り替わる。todayKey を通すので、台本で todayKey を差し替えれば日付が進む */
function dksDay(t){ return todayKey((typeof t === 'number' ? t : Date.now()) - 5 * DKS_H); }
function dksNextReset(){
  var now = Date.now(), d = new Date(now - 5 * DKS_H);
  d.setHours(0, 0, 0, 0);
  return d.getTime() + DKS_DAYMS + 5 * DKS_H;
}
function dksNextMidnight(){ var d = new Date(Date.now()); d.setHours(24, 0, 0, 0); return d.getTime(); }
function dksToday(){
  if(typeof DKCORE_today === 'function') return DKCORE_today();
  var k = todayKey();
  if(!SV.today || SV.today.key !== k) SV.today = { key:k, plays:0, wins:0, cup:0, pup:0, buy:0 };
  return SV.today;
}
function dksWeek(){
  if(typeof DKCORE_week === 'function') return DKCORE_week();
  var k = weekIndex();
  if(!SV.wk || SV.wk.key !== k) SV.wk = { key:k, plays:0, wins:0, cup:0, pup:0, buy:0 };
  return SV.wk;
}
function dksStat(){ if(!SV.stat || typeof SV.stat !== 'object') SV.stat = {}; return SV.stat; }
function dksAdd(o, k, n){ o[k] = ((+o[k] | 0) || 0) + (n || 1); }

/* ── 集計（実績の目標） ── */
function dksOwnCards(){ return CARDPOOL.filter(function(c){ return SV.cards && SV.cards[c.id]; }).length; }
function dksMaxCardLv(){
  var m = 1;
  Object.keys(SV.cards || {}).forEach(function(id){ var o = SV.cards[id]; if(o && (o.lv | 0) > m) m = o.lv | 0; });
  return Math.min(30, m);
}
function dksOwnPends(){ return PENDANTS.filter(function(p){ return SV.pendants && SV.pendants[p.id]; }).length; }
function dksMaxPendPlus(){
  var m = 0;
  Object.keys(SV.pendants || {}).forEach(function(id){ var o = SV.pendants[id]; var lv = (o && (o.lv | 0)) || 1; if(lv - 1 > m) m = lv - 1; });
  return Math.min(7, m);
}
function dksOwnDice(){ return DICE.filter(function(d){ return SV.dice && SV.dice[d.id]; }).length; }
function dksMaxDieLv(){
  var m = 1;
  Object.keys(SV.dice || {}).forEach(function(id){ var v = SV.dice[id] | 0; if(v > m) m = v; });
  return Math.min(10, m);
}

/* ══════════ 回数を数える（イベント） ══════════ */
/* match:end：観戦（人間がいない）は数えない。chips に行商人の行を足す */
function dksOnMatch(e){
  DKS_mseq++;
  e = e || {};
  if(e.me === -1 || e.humans === 0) return;
  var t = dksToday(), w = dksWeek(), st = dksStat();
  dksAdd(t, 'plays'); dksAdd(w, 'plays'); dksAdd(st, 'plays');
  if(e.won){ dksAdd(t, 'wins'); dksAdd(w, 'wins'); dksAdd(st, 'wins'); }
  var ped = dksPedArrive(false);
  if(ped && Array.isArray(e.chips)) e.chips.push({ ic:'🏮', label:'行商人が来た', v:'30分', k:'ped' });
  saveNow();
}
function dksOnCardUp(){ dksAdd(dksToday(), 'cup'); dksAdd(dksWeek(), 'cup'); dksAdd(dksStat(), 'cup'); saveNow(); }
function dksOnPendUp(e){
  dksAdd(dksToday(), 'ptry');
  if(e && e.ok){ dksAdd(dksToday(), 'pup'); dksAdd(dksWeek(), 'pup'); dksAdd(dksStat(), 'pup'); }
  saveNow();
}
function dksOnDiceUp(){ dksAdd(dksToday(), 'dup'); dksAdd(dksWeek(), 'dup'); dksAdd(dksStat(), 'dup'); saveNow(); }
/* 両替（ex_）と無料の品は「買った回数」に数えない（元手0で達成できてしまうため） */
function dksOnBuy(e){
  if(!e || /^ex_/.test(String(e.act || ''))) return;
  dksAdd(dksToday(), 'buy'); dksAdd(dksWeek(), 'buy'); dksAdd(dksStat(), 'buy');
  saveNow();
}

/* ══════════ ショップの保存の器 ══════════ */
function dksShop(){
  var s = SV.shop;
  if(!s || typeof s !== 'object'){
    s = SV.shop = { day:'', dbought:{}, freeGoldAt:0, mineDay:'', mapAt:0, peddler:null, pedDay:'', pedN:0, sellDay:'', sellN:0 };
  }
  if(!s.dbought || typeof s.dbought !== 'object') s.dbought = {};
  var k = dksDay();
  if(s.day !== k){ s.day = k; s.dbought = {}; }
  return s;
}

/* ══════════ 行商人 ══════════ */
/* 来ている行商人（期限切れは null）。WP9 のホームの帯もこれを使ってよい */
function dksPeddler(){
  var s = SV.shop, p = s && s.peddler;
  if(!p || typeof p !== 'object' || !Array.isArray(p.items) || !(+p.until > Date.now())) return null;
  return p;
}
function dksPedItem(g, rng){
  var off = 0.4 + Math.round(rng() * 4) * 0.05;                    // 40〜60%
  var cost = Math.max(g.step, Math.round(g.base * (1 - off) / g.step) * g.step);
  if(g.gems) cost = Math.max(cost, g.gems * DKS_PED_GEM_MIN);      // ダイヤは 1💎=20,000G より安くしない
  return { id:g.id, act:g.act, pay:g.pay, base:g.base, cost:cost, nm:g.nm,
           off:Math.round((1 - cost / g.base) * 100), bought:false };
}
/* 対戦のあと 12% で来る（1日2回まで・30分）。force=true なら必ず来る */
function dksPedArrive(force){
  var s = dksShop(), now = Date.now(), day = dksDay();
  if(s.pedDay !== day){ s.pedDay = day; s.pedN = 0; }
  if(dksPeddler()) return null;
  if((s.pedN | 0) >= DKS_PED_MAX) return null;
  if(!force && !(dksPedRoll() < DKS_PED_P)) return null;
  s.pedN = (s.pedN | 0) + 1;
  var rng = dksMul(dksHash('ped:' + now + ':' + s.pedN)), pool = DKS_PEDS.slice(), items = [];
  while(items.length < 3 && pool.length){ items.push(dksPedItem(pool.splice((rng() * pool.length) | 0, 1)[0], rng)); }
  s.peddler = { at:now, until:now + DKS_PED_MS, items:items };
  return s.peddler;
}

/* ══════════ 品ぞろえ ══════════ */
/* 今日の4品（朝5時に入れ替え）。todayKey を種にした固定の乱数なので、再読み込みしても同じ */
function dksDeals(){
  var s = dksShop(), rng = dksMul(dksHash('deal:' + s.day)), pool = DKS_DEALS.slice(), out = [];
  while(out.length < 4 && pool.length){
    var g = pool.splice((rng() * pool.length) | 0, 1)[0];
    var off = 0.2 + Math.round(rng() * 6) * 0.05;                  // 20〜50%引き
    var cost = Math.max(g.step, Math.round(g.base * (1 - off) / g.step) * g.step);
    out.push(Object.assign({}, g, { key:'deal:' + g.id, cost:cost, off:Math.round((1 - cost / g.base) * 100), limited:true }));
  }
  return out;
}
function dksHave(pay){ return pay === 'gem' ? (SV.gem | 0) : (SV.gold | 0); }
function dksFin(g){
  if(g.state) return g;
  if(g.cost > dksHave(g.pay)){ g.state = 'short'; g.why = (g.pay === 'gem' ? 'ダイヤ' : 'ゴールド') + 'が足りません'; }
  else g.state = 'ok';
  return g;
}
/* タブの品物を、いまの値段と状態（ok / short / done / lock）つきで返す */
function dkGoods(tab){
  tab = tab || DKS_tab;
  var s = dksShop(), out = [];
  if(tab === 'osusume'){
    dksDeals().forEach(function(g){
      if(s.dbought[g.key]){ g.state = 'done'; g.why = '今日は購入済みです'; }
      out.push(dksFin(g));
    });
  } else if(tab === 'card'){
    DKS_CARDS.forEach(function(c){
      var run = !!(DKS_run && DKS_run.key === 'card:' + c.id);
      var cost = run ? Math.round(c.base * DKS_RUN_OFF) : c.base;
      out.push(dksFin(Object.assign({}, c, { key:'card:' + c.id, cost:cost, off:run ? 20 : 0, run:run })));
    });
  } else if(tab === 'dice'){
    DKS_DICE.forEach(function(d){
      var die = dieById(d.id), own = !!(SV.dice && SV.dice[d.id]);
      var a = { key:'dice:' + d.id + ':gem', id:d.id, act:'die', die:d.id, pay:'gem', cost:d.gem, base:d.gem, nm:die.nm, ds:die.ds, art:'die' };
      var b = { key:'dice:' + d.id + ':gold', id:d.id, act:'die', die:d.id, pay:'gold', cost:d.gold, base:d.gold, nm:die.nm, ds:die.ds, art:'die', lv:d.lv };
      if(own){ a.state = b.state = 'done'; a.why = b.why = 'もう持っています'; }
      else if((SV.lv | 0) < d.lv){ b.state = 'lock'; b.why = 'プレイヤーLv' + d.lv + 'で解放（いまLv' + (SV.lv | 0) + '）'; }
      out.push(dksFin(a), dksFin(b));
    });
  } else if(tab === 'ticket'){
    var tks = (SV.tickets && typeof SV.tickets === 'object') ? SV.tickets : {};
    DKS_TK.forEach(function(t){
      out.push(dksFin({ key:'tk:' + t.id, id:t.id, act:'tk', tk:t.tk, n:t.n, pay:t.pay, cost:t.base, base:t.base, nm:t.nm,
        ds:t.ds + '（いま ' + (tks[t.tk] | 0) + '枚）', art:'tk' }));
    });
  } else if(tab === 'gem'){
    DKS_EX_SELL.forEach(function(n){
      out.push(dksFin({ key:'ex:d2g:' + n, act:'ex_d2g', pay:'gem', cost:n, base:n, give:n * DKS_D2G, n:n,
        nm:'ダイヤ' + n + '個 → ' + dksN(n * DKS_D2G) + 'G' }));
    });
    var n2 = Math.max(1, Math.min(DKS_G2D_MAX, DKS_g2dN | 0));
    var gb = { key:'ex:g2d', act:'ex_g2d', pay:'gold', cost:n2 * DKS_G2D, base:n2 * DKS_G2D, give:n2, n:n2,
               nm:'ゴールド → ダイヤ' + n2 + '個' };
    if(s.dbought['ex:g2d']){ gb.state = 'done'; gb.why = '今日はもう交換しました（朝5時にもどります）'; }
    out.push(dksFin(gb));
  } else if(tab === 'peddler'){
    var p = dksPeddler();
    if(p) p.items.forEach(function(it){
      var d = DKS_PEDS.find(function(x){ return x.id === it.id; }) || {};
      var g = Object.assign({}, d, { key:'ped:' + it.id, act:it.act, pay:it.pay, cost:it.cost, base:it.base, off:it.off, nm:it.nm || d.nm });
      if(it.bought){ g.state = 'done'; g.why = 'この品はもう買いました'; }
      out.push(dksFin(g));
    });
  }
  return out;
}
function dksTabOfKey(k){
  k = String(k || '');
  if(k.indexOf('deal:') === 0) return 'osusume';
  if(k.indexOf('card:') === 0) return 'card';
  if(k.indexOf('dice:') === 0) return 'dice';
  if(k.indexOf('ex:') === 0)   return 'gem';
  if(k.indexOf('ped:') === 0)  return 'peddler';
  if(k.indexOf('tk:') === 0)   return 'ticket';
  return '';
}
function dksFind(key){
  var t = dksTabOfKey(key);
  return t ? (dkGoods(t).find(function(g){ return g.key === key; }) || null) : null;
}

/* ══════════ 渡す ══════════ */
/* S以上のカードを1枚（rar==='SS' ならS+だけ） */
function dksDrawS(rar){
  var ss = CARDPOOL.filter(function(c){ return c.rar === 'SS'; }), s = CARDPOOL.filter(function(c){ return c.rar === 'S'; });
  var from = (rar === 'SS' || (Math.random() < 0.2 && ss.length)) ? ss : s;
  if(!from.length) from = CARDPOOL;
  return from[(Math.random() * from.length) | 0];
}
function dksNewGot(){ return { gold:0, gem:0, cards:[], pend:[], dice:[], tk:[], fr:[] }; }
/* grant のおまけ（ペンダント・サイコロ・2,000G）も got に写す */
function dksGiveCards(n, sOnly, got){
  for(var i = 0; i < n; i++){
    var c = sOnly ? dksDrawS(sOnly) : drawOne();
    var r = grant(c) || {};
    got.cards.push({ c:c, r:r });
    if(r.pend && pendById(r.pend.id)) got.pend.push({ p:pendById(r.pend.id), r:r.pend });
    if(r.die && r.die.id) got.dice.push(r.die.id);
    if(r.gold) got.gold += r.gold;
  }
}
function dksGive(g){
  var got = dksNewGot();
  if(g.act === 'card1') dksGiveCards(1, false, got);
  else if(g.act === 'card3') dksGiveCards(3, false, got);
  else if(g.act === 'card5') dksGiveCards(5, false, got);
  else if(g.act === 'card10') dksGiveCards(10, false, got);
  else if(g.act === 'cardS') dksGiveCards(1, true, got);
  else if(g.act === 'pend'){
    var p = PENDANTS[(Math.random() * PENDANTS.length) | 0];
    got.pend.push({ p:p, r:dkGivePend(p.id) });
  }
  else if(g.act === 'gem3'){ SV.gem += 3; got.gem += 3; }
  else if(g.act === 'ex_d2g'){ SV.gold += g.give; got.gold += g.give; }
  else if(g.act === 'ex_g2d'){ SV.gem += g.give; got.gem += g.give; }
  else if(g.act === 'die'){ if(!SV.dice[g.die]) SV.dice[g.die] = 1; got.dice.push(g.die); }
  else if(g.act === 'tk'){ if(dkhGrant({ kind:'ticket', id:g.tk, n:g.n })) got.tk.push({ id:g.tk, n:g.n }); }
  return got;
}

/* ══════════ 買う ══════════ */
/* act ＝品物の鍵（'deal:dc3' / 'card:cc1' / 'dice:d1:gold' / 'ex:d2g:10' / 'ex:g2d' / 'ped:pc5'）。
   cost と pay は旧呼び出しとの互換のために受けるだけで、値段は必ずこちらで計算し直す。
   el は押したボタン（演出の起点）。戻り値 {ok, why?, got?} */
function dkBuy(act, cost, pay, el){
  var g = dksFind(act);
  if(!g){ dksNo(el, '🛒', 'この品は今は買えません', ''); return { ok:false, why:'none' }; }
  if(g.state === 'done' || g.state === 'lock'){
    dksNo(el, g.state === 'lock' ? '🔒' : '✅', g.why, '');
    return { ok:false, why:g.state };
  }
  if(g.state === 'short'){
    var lack = g.cost - dksHave(g.pay), u = (g.pay === 'gem' ? '💎' : 'G');
    dksNo(el, g.pay === 'gem' ? '💎' : '🪙', g.why, '必要 ' + dksN(g.cost) + u + '（あと ' + dksN(lack) + u + '）');
    return { ok:false, why:'short' };
  }
  var before = { gold:SV.gold, gem:SV.gem };
  if(g.pay === 'gem') SV.gem -= g.cost; else SV.gold -= g.cost;
  var s = dksShop();
  if(g.key.indexOf('deal:') === 0 || g.key === 'ex:g2d') s.dbought[g.key] = (s.dbought[g.key] | 0) + 1;
  if(g.key.indexOf('ped:') === 0){
    var pd = dksPeddler();
    if(pd) pd.items.forEach(function(it){ if('ped:' + it.id === g.key) it.bought = true; });
  }
  DKS_run = (g.key.indexOf('card:') === 0) ? { key:g.key } : null;
  var got = dksGive(g);
  saveNow();
  dkEmit('shop:buy', { act:g.act, pay:g.pay, cost:g.cost, key:g.key });
  dksBuyFx(el, g, got, before);
  return { ok:true, got:got, cost:g.cost, pay:g.pay };
}
/* 押せない時の手ごたえ（揺れ＋理由のトースト） */
function dksNo(el, ic, title, sub){
  if(el && el.nodeType === 1) fxShake(el, 260);
  dksSfx('bad');
  try{ toast('L', ic, esc(title || ''), esc(sub || ''), 1800); }catch(e){}
}

/* ══════════ むりょう ══════════ */
function dksFreeState(){
  var s = dksShop(), now = Date.now();
  var potLeft = DKS_POT_MS - (now - (+s.freeGoldAt || 0));
  var mapLeft = DKS_MAP_MS - (now - (+s.mapAt || 0));
  var dug = (s.mineDay === s.day);
  return { pot:potLeft <= 0, potLeft:potLeft, map:mapLeft <= 0, mapLeft:mapLeft,
           mine:!dug, picks:dug ? Math.max(0, DKS_PICKS - (s.minePick | 0)) : 0,
           mineGot:dug ? (s.mineGot | 0) : 0, rocks:dug ? String(s.mineRocks || '') : '' };
}
/* もらえる物があるか（赤い●）。WP9 のホームのレールもこれを使ってよい */
function dksFreeReady(){ var f = dksFreeState(); return !!(f.pot || f.map || f.mine || f.picks > 0); }
/* kind: 'pot'（金貨のつぼ）| 'mine'（鉱山に入る）| 'pick'（つるはし）| 'map'（宝の地図） */
function dksClaim(kind, el){
  var s = dksShop(), f = dksFreeState(), now = Date.now(), got = dksNewGot(), title = '';
  var before = { gold:SV.gold, gem:SV.gem };
  if(kind === 'pot'){
    if(!f.pot){ dksNo(el, '🏺', 'まだたまっていません', 'あと ' + dksHMS(f.potLeft)); return { ok:false }; }
    s.freeGoldAt = now; SV.gold += DKS_POT_G; got.gold = DKS_POT_G; title = '金貨のつぼ';
  } else if(kind === 'mine'){
    if(!f.mine){ dksNo(el, '⛏️', '今日はもう鉱山に入りました', '朝5時に新しい鉱脈が出ます'); return { ok:false }; }
    s.mineDay = s.day; s.minePick = 0; s.mineGot = 0; s.mineRocks = '';
    SV.gem += DKS_MINE_D; got.gem = DKS_MINE_D; title = 'ダイヤ鉱山';
  } else if(kind === 'pick'){
    if(f.mine){ dksNo(el, '⛏️', 'まず鉱山に入ろう', 'つるはしは鉱山に入ると使えます'); return { ok:false }; }
    if(f.picks <= 0){ dksNo(el, '⛏️', 'つるはしを使い切りました', '朝5時にまた3回使えます'); return { ok:false }; }
    var hit = dksRnd() < 0.5 ? 1 : 0;
    s.minePick = (s.minePick | 0) + 1; s.mineGot = (s.mineGot | 0) + hit; s.mineRocks = String(s.mineRocks || '') + hit;
    if(hit){ SV.gem += 1; got.gem = 1; }
    title = hit ? 'ダイヤを掘り当てた！' : '';
  } else if(kind === 'map'){
    if(!f.map){ dksNo(el, '🗺️', '地図はまだ届いていません', 'あと ' + dksLong(f.mapLeft)); return { ok:false }; }
    s.mapAt = now; dksGiveCards(1, true, got); title = '宝の地図';
  } else return { ok:false };
  saveNow();
  dksFreeFx(el, kind, got, before, title);
  return { ok:true, got:got };
}

/* ══════════ 演出 ══════════ */
function dksAt(el){
  if(el && el.nodeType === 1 && el.isConnected){
    var box = el.closest('.dks-good,.dks-die,.dks-exrow,.dks-exbox,.dks-free,.dks-q,.dks-day,.dks-chestbox') || el;
    return fxPt(box);
  }
  return { x:800, y:450 };
}
function dksShowWallet(b){
  if(!b) return;
  document.querySelectorAll('#dkGold,#wGold').forEach(function(e){ e._fxTok = null; e.classList.remove('fx-counting'); e.textContent = dksN(b.gold); });
  document.querySelectorAll('#dkGem,#wGem').forEach(function(e){ e._fxTok = null; e.classList.remove('fx-counting'); e.textContent = dksN(b.gem); });
}
/* 手に入ったお金を財布へ飛ばし、画面を作り直してから数字を回す。品物があれば王宮の報酬モーダル */
async function dksAfter(at, got, before, title, redraw, noModal){
  var ps = [];
  if(got.gold > 0) ps.push(fxCoins(at, fxWalletEl('gold'), { kind:'coin', n:Math.min(16, 7 + Math.round(got.gold / 25000)) }));
  if(got.gem > 0)  ps.push(fxCoins(at, fxWalletEl('gem'),  { kind:'gem',  n:Math.min(14, 4 + got.gem) }));
  if(ps.length) await Promise.all(ps);
  if(redraw) redraw();
  dksShowWallet(before);
  dkWallet();
  if(!noModal && (got.cards.length || got.pend.length || got.dice.length || (got.tk || []).length || (got.fr || []).length))
    await dksRewardModal(title || '手に入れた！', dksItemsOf(got), '');
}
async function dksBuyFx(el, g, got, before){
  DKS_busy = true;
  try{
    var at = dksAt(el);
    if(g.cost > 0) await fxCoins(fxWalletEl(g.pay === 'gem' ? 'gem' : 'gold'), at,
      { kind:g.pay === 'gem' ? 'gem' : 'coin', n:6, spread:34, dur:520, stagger:36 });
    dksSfx('buy');
    fxBurst(at, { kind:'star', n:16, power:1.1 });
    await dksAfter(at, got, before, '購入しました', function(){ if(dksOn() === 'shop') showShop(DKS_tab); });
  }catch(e){ console.error('[WP8]', e); }
  DKS_busy = false;
}
async function dksFreeFx(el, kind, got, before, title){
  DKS_busy = true;
  try{
    var at = dksAt(el);
    if(kind === 'pick'){
      var rock = el && el.nodeType === 1 ? el : null;
      if(rock){ rock.classList.add('dks-hit'); fxShake(rock, 200); }
      dksSfx(got.gem ? 'coinBurst' : 'land');
      fxBurst(at, { kind:got.gem ? 'gem' : 'conf', n:got.gem ? 10 : 8, power:0.8, color:'#8A7A62' });
      if(got.gem) fxPopText(at, '💎 +1', { tone:'gold', size:40 });
      await fxWait(260);
    } else {
      dksSfx('coinBurst');
      fxBurst(at, { kind:kind === 'mine' ? 'gem' : 'coin', n:18, power:1.1 });
    }
    await dksAfter(at, got, before, title, function(){ if(dksOn() === 'shop') showShop(DKS_tab); });
  }catch(e){ console.error('[WP8]', e); }
  DKS_busy = false;
}

/* ── CSS で描く小さな絵（絵文字だけに頼らない） ── */
function dksArt(kind, o){
  o = o || {};
  var st = o.c ? ' style="--c:' + o.c + '"' : '';
  var h = '<i class="dks-a dks-a-' + kind + ' fx-deco" aria-hidden="true"' + st + '><b></b>';
  if(kind === 'pend' && o.ic) h += '<em>' + o.ic + '</em>';
  if(kind === 'die') h += '<s></s>';
  if(kind === 'fan') h += '<b></b><b></b>';
  return h + '</i>';
}
function dksRarCol(r){ r = dkNormRar(r); return r === 'SS' ? '#F2C230' : r === 'S' ? '#B07CE8' : '#6FB8F5'; }
function dksItemsOf(got){
  var items = [];
  if(got.gold) items.push({ art:'coin', v:'+' + dksN(got.gold), l:'ゴールド' });
  if(got.gem)  items.push({ art:'gem',  v:'+' + dksN(got.gem),  l:'ダイヤ' });
  got.cards.forEach(function(x){
    var fresh = !!(x.r && x.r.card && x.r.card.fresh);
    items.push({ card:x.c, v:x.c.nm, l:fresh ? (RAR[x.c.rar] ? RAR[x.c.rar].nm : '') + 'カード' : '重なり +1', rar:x.c.rar, fresh:fresh });
  });
  got.pend.forEach(function(x){
    var fresh = !!(x.r && x.r.fresh);
    items.push({ pend:x.p, v:x.p.nm, l:fresh ? 'ペンダント' : '重なり +1（素材' + ((x.r && x.r.dup) | 0) + '個）', rar:x.p.rar, fresh:fresh });
  });
  got.dice.forEach(function(id){ var d = dieById(id); items.push({ die:d, v:d.nm, l:'サイコロ', rar:d.rar, fresh:true }); });
  (got.tk || []).forEach(function(x){ items.push({ art:'tk', c:DKS_TKCOL[x.id], v:dkhTkNm(x.id) + (x.n > 1 ? ' ×' + x.n : ''), l:'入場券' }); });
  (got.fr || []).forEach(function(id){ items.push({ art:'frame', c:DKS_FRCOL[id], v:dkhFrNm(id), l:'名札の枠', fresh:true }); });
  return items;
}
function dksItemHTML(it, i){
  var art, r = it.rar ? dkNormRar(it.rar) : '';
  if(it.card){
    var u = dkCharImg(it.card.id);
    art = '<i class="dks-cpic r' + r + ' fx-deco" aria-hidden="true"' + (u ? ' style="background-image:url(' + u + ')"' : '') + '>'
        + (u ? '' : '<b>' + esc(it.card.nm.slice(0, 1)) + '</b>') + '</i>';
  } else if(it.pend) art = dksArt('pend', { c:dksRarCol(it.pend.rar), ic:it.pend.ic });
  else if(it.die) art = dksArt('die', { c:it.die.col });
  else art = dksArt(it.art, { c:it.c });
  return '<div class="dks-it' + (r ? ' r' + r : '') + '" style="--i:' + i + '">' + art
    + (r ? '<span class="dks-rr">' + (r === 'SS' ? 'S+' : r) + '</span>' : '')
    + '<div class="v">' + esc(it.v) + '</div><div class="l">' + esc(it.l) + '</div>'
    + (it.fresh ? '<span class="fx-new">NEW!</span>' : '') + '</div>';
}
/* 王宮の報酬モーダル（放射光・リボン・1つずつ弾む中身） */
function dksRewardModal(title, items, sub){
  var html = '<div class="modal dks-modal dks-rw">'
    + '<div class="dks-mglow fx-deco" aria-hidden="true"><div class="fx-rays"></div></div>'
    + '<div class="dks-rib"><b>' + esc(title) + '</b></div>'
    + '<div class="dks-items' + (items.length > 5 ? ' many' : '') + '">' + items.map(dksItemHTML).join('') + '</div>'
    + (sub ? '<p class="dks-msub">' + esc(sub) + '</p>' : '')
    + '<div class="dks-mbtns"><button class="dkbtn gd dks-b fx-primary" data-act="ok"><i class="dks-sh"></i>受け取る</button></div>'
    + '</div>';
  var p = modal(html);
  setTimeout(function(){
    try{
      var m = document.querySelector('#modalBody .dks-rw');
      if(m){ fxBurst(m.querySelector('.dks-items') || m, { kind:'conf', n:26, power:1.2 }); dksSfx('confetti'); }
    }catch(e){}
  }, 240);
  return p;
}

/* ══════════ ショップの画面 ══════════ */
function dksPic(g, crop){
  if(g.art === 'tk') return '<div class="pic art tkbg" style="--c:' + DKS_TKCOL[g.tk] + '">' + dksArt('tk', { c:DKS_TKCOL[g.tk] })
    + '<em class="dks-tkl fx-deco">' + ({ biz:'BUSINESS', first:'FIRST', dia:'DIAMOND' })[g.tk] + '</em>'
    + (g.n > 1 ? '<em class="dks-pb">×' + g.n + '</em>' : '') + '</div>';
  var map = { card:'goods-card', cardS:'goods-card', gem:'goods-gem', gold:'goods-gold' };
  var n = g.act === 'card3' ? 3 : g.act === 'card5' ? 5 : g.act === 'card10' ? 10 : 0;
  var u = (!n && map[g.art]) ? dkU(map[g.art]) : '';
  var badge = (g.art === 'cardS') ? '<em class="dks-pb s">S以上</em>'
            : n ? '<em class="dks-pb">×' + n + '</em>'
            : g.act === 'gem3' ? '<em class="dks-pb">×3</em>' : '';
  if(u) return '<div class="pic' + (crop ? ' crop' : '') + (g.art === 'cardS' ? ' saura' : '') + '" style="background-image:url(' + u + ')">' + badge + '</div>';
  /* 複数枚のチケットは、同じ絵を並べずに扇に広げたカードで描く */
  if(n) return '<div class="pic art fan">' + dksArt('fan') + badge + '</div>';
  var art = (g.art === 'pend') ? dksArt('pend', { c:'#B07CE8', ic:'？' }) : dksArt(g.art || 'card');
  return '<div class="pic art' + (g.art === 'pend' ? ' velvet' : '') + '">' + art + badge + '</div>';
}
/* 品物の札。limited（日替わり）は絵の焼き込みの「限定」をそのまま見せ、.tag は重ねない */
function dksGoodHTML(g, i, opt){
  opt = opt || {};
  var cls = 'dks-good st-' + g.state + (g.limited ? ' lim' : '') + (g.run ? ' run' : '')
          + (DKS_focus && DKS_focus === g.key ? ' dks-focus' : '');
  var price = '<div class="pr">' + (g.off ? '<s class="was">' + dksPrice(g.pay, g.base) + '</s>' : '')
            + '<b class="now ' + g.pay + '">' + dksPrice(g.pay, g.cost) + '</b></div>';
  var act = (g.state === 'done')
    ? '<div class="dks-sold"><i class="dks-stamp">済</i><span>' + esc(opt.soldTx || '購入済み') + '</span></div>'
    : '<button class="dkbtn gr dks-b' + (g.state === 'short' ? ' short' : '') + '" data-dks-buy="' + g.key + '"><i class="dks-sh"></i>購入</button>';
  return '<div class="' + cls + '" data-fx="deal">'
    + '<i class="dks-gl" aria-hidden="true"></i>'
    + dksPic(g, !g.limited)
    + (g.off ? '<span class="dks-off">' + (g.run ? '<small>連続</small>' : '') + '<b>−' + g.off + '%</b></span>' : '')
    + '<div class="nm">' + esc(g.nm) + '</div>'
    + '<div class="ds">' + esc(g.ds || '') + '</div>'
    + price + act + '</div>';
}
function dksStrip(t, c, extra){
  return '<div class="dks-strip" data-fx="pop"><span class="t">' + t + '</span><span class="c">' + c + '</span>' + (extra || '') + '</div>';
}
function dksCd(t, long){
  return '<b class="dks-cd" data-dks-cd="' + t + '"' + (long ? ' data-dks-long="1"' : '') + '>'
    + (long ? dksLong(t - Date.now()) : dksHMS(t - Date.now())) + '</b>';
}
function dksWait(t, long, lbl){ return '<div class="dks-wait"><span>' + (lbl || 'つぎまで') + '</span>' + dksCd(t, long) + '</div>'; }
/* むりょうの札の中身：たまり具合のバー／届くまでの日数 */
function dksMeter(lbl, k){
  k = Math.max(0, Math.min(1, +k || 0));
  return '<div class="dks-meter"><div class="lb"><span>' + lbl + '</span><b>' + Math.round(k * 100) + '%</b></div>'
    + '<span class="dkbar gd"><i style="width:' + (k * 100).toFixed(1) + '%"></i></span></div>';
}
function dksPips(lbl, on, n, tail){
  var h = '';
  for(var i = 0; i < n; i++) h += '<i class="' + (i < on ? 'on' : '') + '"></i>';
  return '<div class="dks-meter"><div class="lb"><span>' + lbl + '</span><b>' + tail + '</b></div><div class="dks-pips" aria-hidden="true">' + h + '</div></div>';
}

function dksPaneOsusume(ped){
  var pl = ped ? '<button class="dks-pedlink" data-dktab="peddler">' + dksArt('lantern') + '<span>行商人 あと</span>' + dksCd(ped.until) + '</button>' : '';
  return dksStrip('日替わり 4品', '入れ替えまで ' + dksCd(dksNextReset()), pl)
    + '<div class="dks-goods n4">' + dkGoods('osusume').map(function(g, i){ return dksGoodHTML(g, i); }).join('') + '</div>';
}
function dksPaneCard(){
  return dksStrip('キャラクターカード', '同じ品を続けて買うと 2個目から <b>20%OFF</b>', '<button class="dks-pedlink dks-golink" data-dkgo="gacha">ガチャを引く</button>')
    + '<div class="dks-goods n3">' + dkGoods('card').map(function(g, i){ return dksGoodHTML(g, i); }).join('') + '</div>';
}
function dksPaneDice(){
  var list = dkGoods('dice'), h = '';
  for(var i = 0; i < list.length; i += 2){
    var a = list[i], b = list[i + 1], d = dieById(a.id), r = dkNormRar(d.rar), own = (a.state === 'done');
    h += '<div class="dks-die r' + r + (own ? ' own' : '') + '" data-fx="deal">'
      + '<i class="dks-gl" aria-hidden="true"></i>'
      + '<div class="art">' + (r === 'SS' ? '<div class="fx-rays fx-deco"></div>' : '') + dksArt('die', { c:d.col }) + '</div>'
      + '<span class="dks-rr">' + (r === 'SS' ? 'S+' : r) + '</span>'
      + '<div class="nm">' + esc(d.nm) + '</div>'
      + '<div class="ds">' + esc(d.ds) + '</div>'
      + (own
        ? '<div class="dks-sold"><i class="dks-stamp">所持</i><span>所持済み</span></div>'
          + '<button class="dkbtn gd dks-b" data-dks-go="dice"><i class="dks-sh"></i>強化へ</button>'
        : '<div class="dks-two">'
          + '<button class="dkbtn gr dks-b' + (a.state === 'short' ? ' short' : '') + '" data-dks-buy="' + a.key + '"><i class="dks-sh"></i>' + dksPrice('gem', a.cost) + '</button>'
          + '<button class="dkbtn gd dks-b' + (b.state === 'short' ? ' short' : '') + '" data-dks-buy="' + b.key + '"'
          +   (b.state === 'lock' ? ' disabled' : '') + '><i class="dks-sh"></i>' + dksPrice('gold', b.cost) + '</button>'
          + '</div>'
          + '<div class="why' + (b.state === 'lock' ? ' lock' : '') + '">'
          +   (b.state === 'lock' ? '🔒 ' + esc(b.why) : 'Lv' + b.lv + '到達でゴールドでも買える') + '</div>')
      + '</div>';
  }
  return dksStrip('サイコロ', 'ダイヤですぐ／Lvが上がるとゴールドでも（いま <b>Lv' + (SV.lv | 0) + '</b>）')
    + '<div class="dks-dice">' + h + '</div>';
}
function dksPaneGem(){
  var list = dkGoods('gem'), buy = list.filter(function(g){ return g.act === 'ex_g2d'; })[0];
  var gi = '<i class="dkgem dks-ci"></i>';
  var rows = list.filter(function(g){ return g.act === 'ex_d2g'; }).map(function(g){
    return '<div class="dks-exrow">'
      + '<span class="a">' + dksArt('gem') + '<b>×' + g.n + '</b></span><span class="ar" aria-hidden="true"></span>'
      + '<span class="b">' + dksArt('coin') + '<b>' + dksN(g.give) + '</b></span>'
      + '<button class="dkbtn gr dks-b' + (g.state === 'short' ? ' short' : '') + '" data-dks-buy="' + g.key + '"><i class="dks-sh"></i>交換</button></div>';
  }).join('');
  var n = buy.n, right;
  if(buy.state === 'done'){
    right = '<div class="dks-exdone"><i class="dks-stamp">済</i><b>今日の交換はおしまい</b>' + dksWait(dksNextReset(), false, '朝5時まで') + '</div>';
  } else {
    right = '<div class="dks-step"><button class="dks-sb" data-dks-step="-1"' + (n <= 1 ? ' disabled' : '') + ' aria-label="へらす">−</button>'
      + '<span class="q">' + dksArt('gem') + '<b>×' + n + '</b></span>'
      + '<button class="dks-sb" data-dks-step="1"' + (n >= DKS_G2D_MAX ? ' disabled' : '') + ' aria-label="ふやす">＋</button></div>'
      + '<div class="dks-excost">' + dksPrice('gold', buy.cost) + '</div>'
      + '<button class="dkbtn gd dks-b fx-primary' + (buy.state === 'short' ? ' short' : '') + '" data-dks-buy="ex:g2d"><i class="dks-sh"></i>交換する</button>';
  }
  var info = '<div class="dks-exinfo"><div><span>今日の交換</span><b>' + (buy.state === 'done' ? 1 : 0) + ' / 1 回</b></div>'
    + '<div><span>売ってから買い戻すと</span><b>5分の1</b></div></div>';
  var use = '<div class="dks-exuse"><span>ダイヤの使い道</span><b>ガチャ</b><b>入場券</b><b>サイコロ</b></div>';
  return dksStrip('財貨', '行ったり来たりしても増えないしくみ')
    + '<div class="dks-ex">'
    + '<div class="dks-exbox sell" data-fx="riseL"><div class="dks-exhd"><b>ダイヤ → ゴールド</b><span>1' + gi + ' = 6,000G</span></div>' + rows + use + '</div>'
    + '<div class="dks-exbox buy" data-fx="riseR"><div class="dks-exhd"><b>ゴールド → ダイヤ</b><span>1' + gi + ' = 30,000G</span></div>'
    +   '<div class="dks-exlim">1日1回・5個まで</div>' + info + right + '</div>'
    + '</div>';
}
function dksPaneFree(){
  var f = dksFreeState(), now = Date.now(), dot = '<i class="dks-dot big" aria-hidden="true"></i>';
  var pot = '<div class="dks-free pot' + (f.pot ? ' ready' : '') + '" data-fx="deal"><i class="dks-gl" aria-hidden="true"></i>' + (f.pot ? dot : '')
    + '<div class="art">' + (f.pot ? '<div class="fx-rays fx-deco"></div>' : '') + dksArt('pot') + '</div>'
    + '<div class="nm">金貨のつぼ</div><div class="ds">4時間ごとに 800G がたまる</div>'
    + dksMeter('たまり具合', Math.min(1, 1 - f.potLeft / DKS_POT_MS))
    + (f.pot ? '<button class="dkbtn gd dks-b fx-primary" data-dks-free="pot"><i class="dks-sh"></i>受け取る ' + dksPrice('gold', DKS_POT_G) + '</button>'
             : dksWait(now + f.potLeft))
    + '</div>';
  var mineAct;
  if(f.mine){
    var pre = '';
    for(var j = 0; j < DKS_PICKS; j++) pre += '<span class="dks-rock lock"><b>？</b></span>';
    mineAct = '<div class="dks-rocks">' + pre + '</div><div class="dks-picks">入ると つるはしで <b>' + DKS_PICKS + '</b> 回掘れる</div>'
      + '<button class="dkbtn gd dks-b" data-dks-free="mine"><i class="dks-sh"></i>鉱山に入る ' + dksPrice('gem', DKS_MINE_D) + '</button>';
  } else {
    var rocks = '';
    for(var i = 0; i < DKS_PICKS; i++){
      if(i < f.rocks.length){
        var hit = f.rocks.charAt(i) === '1';
        rocks += '<span class="dks-rock done ' + (hit ? 'hit' : 'miss') + '">' + (hit ? dksArt('gem') + '<b>+1</b>' : '<b>石</b>') + '</span>';
      } else rocks += '<button class="dks-rock" data-dks-free="pick" aria-label="つるはしで掘る"><i class="dks-pk fx-deco" aria-hidden="true"></i><b>掘る</b></button>';
    }
    mineAct = '<div class="dks-rocks">' + rocks + '</div>'
      + (f.picks > 0 ? '<div class="dks-picks">つるはし あと <b>' + f.picks + '</b> 回</div>'
                     : '<div class="dks-picks">今日は <b>' + (DKS_MINE_D + f.mineGot) + '</b> 個 掘れた</div>');
  }
  var mine = '<div class="dks-free mine' + ((f.mine || f.picks > 0) ? ' ready' : '') + '" data-fx="deal"><i class="dks-gl" aria-hidden="true"></i>'
    + ((f.mine || f.picks > 0) ? dot : '')
    + '<div class="art">' + dksArt('mine') + '</div>'
    + '<div class="nm">ダイヤ鉱山</div><div class="ds">1日1回 ダイヤ2個＋つるはし3回</div>' + mineAct + '</div>';
  var map = '<div class="dks-free map' + (f.map ? ' ready' : '') + '" data-fx="deal"><i class="dks-gl" aria-hidden="true"></i>' + (f.map ? dot : '')
    + '<div class="art">' + (f.map ? '<div class="fx-rays fx-deco"></div>' : '') + dksArt('map') + '</div>'
    + '<div class="nm">宝の地図</div><div class="ds">7日ごとに S以上のカードが1枚</div>'
    + dksPips('地図が届くまで', f.map ? 7 : Math.max(0, Math.min(7, Math.floor((DKS_MAP_MS - f.mapLeft) / DKS_DAYMS))), 7,
        f.map ? 'とどいた！' : 'あと' + Math.max(1, Math.ceil(f.mapLeft / DKS_DAYMS)) + '日')
    + (f.map ? '<button class="dkbtn gd dks-b" data-dks-free="map"><i class="dks-sh"></i>宝を掘り出す</button>'
             : dksWait(now + f.mapLeft, true))
    + '</div>';
  return dksStrip('むりょう', 'ためておける無料の宝。赤い印はいま受け取れる合図')
    + '<div class="dks-frees">' + pot + mine + map + '</div>';
}
/* 入場券（C22）。持っている枚数も出す */
function dksPaneTicket(){
  var t = (SV.tickets && typeof SV.tickets === 'object') ? SV.tickets : {};
  return dksStrip('入場券', 'いま ビジネス <b>' + (t.biz | 0) + '</b>・ファースト <b>' + (t.first | 0) + '</b>・ダイヤモンド <b>' + (t.dia | 0) + '</b> 枚')
    + '<div class="dks-goods n4">' + dkGoods('ticket').map(function(g, i){ return dksGoodHTML(g, i); }).join('') + '</div>';
}
function dksPanePed(ped){
  return '<div class="dks-pedbar" data-fx="pop">' + dksArt('lantern')
    + '<div class="tx"><b>旅の行商人</b><span>相場の半値前後。1品につき1回だけ</span></div>'
    + '<div class="tm"><span>去るまで</span>' + dksCd(ped.until) + '</div>' + dksArt('lantern') + '</div>'
    + '<div class="dks-goods n3 ped">' + dkGoods('peddler').map(function(g, i){ return dksGoodHTML(g, i, { soldTx:'買いました' }); }).join('') + '</div>';
}
/* 左の列：看板と店員。店員の絵に焼き込まれた「本日のおすすめ」の上に、本物の日替わりを重ねる */
function dksLeftHTML(tab, ped){
  if(tab === 'peddler' && ped){
    return '<div class="dks-left ped"><div class="dks-tent" data-fx="hero">'
      + '<i class="dks-curtain l" aria-hidden="true"></i><i class="dks-curtain r" aria-hidden="true"></i>'
      + '<div class="dks-lamps" aria-hidden="true">' + dksArt('lantern') + dksArt('lantern') + dksArt('lantern') + '</div>'
      + '<div class="dks-tsign"><b>旅の行商人</b><span>めずらしい品を30分だけ</span></div>'
      + '<i class="dks-orb" aria-hidden="true"><b></b></i><i class="dks-orbst" aria-hidden="true"></i>'
      + '<div class="dks-trunk" aria-hidden="true"><i></i></div>'
      + '</div></div>';
  }
  var clerk = dkU('hero-clerk'), deals = dkGoods('osusume'), pick = null;
  deals.forEach(function(g){ if(g.state !== 'done' && (!pick || g.off > pick.off)) pick = g; });
  var pk = pick
    ? '<div class="dks-pick">'
      + '<div class="hd"><i class="dks-gift fx-deco" aria-hidden="true"></i><b>本日の<br>おすすめ</b></div>'
      + '<div class="pa">' + dksPic(pick, true) + '</div>'
      + '<div class="pn">' + esc(pick.nm) + '</div>'
      + '<div class="pp"><s>' + dksPrice(pick.pay, pick.base) + '</s><b>' + dksPrice(pick.pay, pick.cost) + '</b></div>'
      + '<button class="dks-pbtn" data-dks-go="' + pick.key + '"><b>−' + pick.off + '%</b>見る</button>'
      + '</div>'
    : '<div class="dks-pick none"><div class="hd"><i class="dks-gift fx-deco" aria-hidden="true"></i><b>本日の<br>おすすめ</b></div>'
      + '<div class="pn">今日の4品は<br>ぜんぶ購入済み</div><div class="pp">また明日！</div></div>';
  return '<div class="dks-left">'
    + '<div class="dks-sign" data-fx="riseL"><i class="dks-chain l" aria-hidden="true"></i><i class="dks-chain r" aria-hidden="true"></i>'
    +   '<b>王宮商店</b><span>' + (ped ? '行商人 あと ' + dksCd(ped.until) : '対戦のあと行商人が来ることも') + '</span></div>'
    + '<div class="dks-clerk' + (clerk ? '' : ' noimg') + '" data-fx="hero"' + (clerk ? ' style="background-image:url(' + clerk + ')"' : '') + '>' + pk + '</div>'
    + '</div>';
}
function dksTabsHTML(tab, ped, fr){
  var list = DKS_TABS.slice();
  if(ped) list.push(DKS_PED_TAB);
  return '<div class="dks-tabs">' + list.map(function(t){
    var dot = (t.id === 'free' && fr) || t.id === 'peddler';
    return '<button class="dks-tab' + (t.id === tab ? ' on' : '') + (t.id === 'peddler' ? ' ped' : '') + '" data-dktab="' + t.id + '" data-fx="pop">'
      + '<span class="ic" aria-hidden="true">' + t.ic + '</span><span class="tx">' + t.nm + '</span>'
      + (dot ? '<i class="dks-dot" aria-hidden="true"></i>' : '') + '</button>';
  }).join('') + '</div>';
}
function dksShopSig(){
  var f = dksFreeState(), p = dksPeddler();
  return [dksShop().day, f.pot, f.map, f.mine, f.picks, p ? p.until : 0].join('|');
}
function dksTickCd(root){
  var now = Date.now();
  (root || document).querySelectorAll('[data-dks-cd]').forEach(function(e){
    var ms = (+e.getAttribute('data-dks-cd')) - now;
    var tx = e.hasAttribute('data-dks-long') ? dksLong(ms) : dksHMS(ms);
    if(e.textContent !== tx) e.textContent = tx;
  });
}
function dksShopTick(){
  if(dksOn() !== 'shop'){ dkEvery('dks-shop', null); return; }
  dksTickCd(document.getElementById('shop'));
  if(!DKS_busy && dksShopSig() !== DKS_ready && !document.querySelector('#modalWrap.on')) showShop(DKS_tab);
}
/* おすすめの札・強化へのボタン */
function dksGoKey(k){
  k = String(k || '');
  if(k === 'dice'){ if(typeof showDice === 'function') showDice(); return; }
  if(k.indexOf('deal:') === 0){
    DKS_focus = k; showShop('osusume');
    var c = document.querySelector('#shop .dks-good.dks-focus');
    if(c) fxBurst(c, { kind:'star', n:12, power:0.7 });
    return;
  }
  showShop(k);
}
/* tab: 'osusume'|'free'|'dice'|'card'|'gem'|'peddler'（省略すると今のタブ） */
function showShop(tab){
  var ped = dksPeddler(), asked = (typeof tab === 'string' && tab) ? tab : '';
  if(asked){
    if(asked !== DKS_tab){ DKS_run = null; if(asked !== 'osusume') DKS_focus = ''; }
    DKS_tab = asked;
  }
  if(DKS_tab === 'peddler' && !ped){
    DKS_tab = 'osusume';
    if(asked === 'peddler') try{ toast('L', '🏮', '行商人は去ってしまいました', '対戦のあとに、また来ることがあります', 2000); }catch(e){}
  }
  if(DKS_tab !== 'peddler' && !DKS_TABS.some(function(t){ return t.id === DKS_tab; })) DKS_tab = 'osusume';
  try{ dkShopTab = (DKS_tab === 'peddler') ? 'osusume' : DKS_tab; }catch(e){}
  var t = DKS_tab;
  var body = t === 'free' ? dksPaneFree() : t === 'dice' ? dksPaneDice() : t === 'card' ? dksPaneCard()
           : t === 'gem' ? dksPaneGem() : t === 'ticket' ? dksPaneTicket() : t === 'peddler' ? dksPanePed(ped) : dksPaneOsusume(ped);
  var el = dkhAmb(dkMake('shop', 'shop', dkHead('shop', {})
    + '<div class="dks-shop' + (t === 'peddler' ? ' is-ped' : '') + '">'
    + dksLeftHTML(t, ped)
    + '<div class="dks-main">' + dksTabsHTML(t, ped, dksFreeReady())
    + '<div class="dks-pane p-' + t + '" data-fx-step="70">' + body + '</div></div>'
    + '</div>'));
  el.classList.add('dks-scr');
  el.classList.toggle('dks-pedscr', t === 'peddler');
  dkWire(el, function(id){ showShop(id); });
  el.querySelectorAll('[data-dks-buy]').forEach(function(b){
    b.onclick = function(){ if(DKS_busy) return; dkBuy(b.getAttribute('data-dks-buy'), 0, '', b); };
  });
  el.querySelectorAll('[data-dks-free]').forEach(function(b){
    b.onclick = function(){ if(DKS_busy) return; dksClaim(b.getAttribute('data-dks-free'), b); };
  });
  el.querySelectorAll('[data-dks-step]').forEach(function(b){
    b.onclick = function(){
      dksSfx('click');
      DKS_g2dN = Math.max(1, Math.min(DKS_G2D_MAX, (DKS_g2dN | 0) + (+b.getAttribute('data-dks-step') || 0)));
      showShop('gem');
    };
  });
  el.querySelectorAll('[data-dks-go]').forEach(function(b){
    b.onclick = function(){ dksSfx('click'); dksGoKey(b.getAttribute('data-dks-go')); };
  });
  DKS_ready = dksShopSig();
  screenTo('shop');
  /* タイマーは screenTo のあと（画面が変わると DKFX.stopTimers が前の画面のタイマーを止めるため） */
  dkEvery('dks-shop', dksShopTick, 1000);
  dkhGlint(el, '.dks-good > .dks-gl, .dks-die > .dks-gl, .dks-free > .dks-gl', 'dks-glint', '::after');
  return el;
}

/* ══════════ ミッション（デイリー・ウィークリー・限定ミッション） ══════════ */
function dksQCtx(){ return { t:dksToday(), w:dksWeek(), st:dksStat() }; }
/* qdone の鍵：デイリー d_{日付}_id ／ ウィークリー w_{週}_id ／ 限定 L_{系統}_{段} */
function dksQKey(tab, id){
  if(tab === 'daily') return 'd_' + todayKey() + '_' + id;
  if(tab === 'weekly') return 'w_' + weekIndex() + '_' + id;
  return 't_' + id;
}
function dksTabOfQ(id){ id = String(id || ''); return id.indexOf('d_') === 0 ? 'daily' : id.indexOf('w_') === 0 ? 'weekly' : 'limit'; }
/* 過ぎた日・週の受取記録を捨てる（増え続けないように）。限定 L_・旧実績 t_ は消さない */
function dksQPrune(){
  var dp = 'd_' + todayKey() + '_', wp = 'w_' + weekIndex() + '_', q = SV.qdone || (SV.qdone = {}), n = 0;
  Object.keys(q).forEach(function(k){
    if((k.indexOf('d_') === 0 && k.indexOf(dp) !== 0) || (k.indexOf('w_') === 0 && k.indexOf(wp) !== 0)){ delete q[k]; n++; }
  });
  return n;
}
/* 限定ミッションの段（SV.lmq）。初めての時だけ旧「実績」の受取記録から進める */
function dksLmq(){
  var q = SV.lmq;
  if(!q || typeof q !== 'object' || Array.isArray(q)) q = SV.lmq = {};
  if(!SV.lmqMig){
    SV.lmqMig = 1;
    var d = SV.qdone || {};
    Object.keys(DKS_LMOLD).forEach(function(t){ var m = DKS_LMOLD[t]; if(d['t_' + t]) q[m[0]] = Math.max(q[m[0]] | 0, m[1] + 1); });
  }
  return q;
}
function dksLmRow(L, i, q, lock){
  var need = L.st[i], key = 'L_' + L.s + '_' + i;
  var get = function(){ return Math.max(0, Math.min(need, (L.get(dksQCtx()) | 0) || 0)); };
  var cur = lock ? 0 : get();
  return { id:key, qid:L.s + i, tab:'limit', s:L.s, step:i, lock:!!lock, nm:L.nm.replace('%', need),
    ds:lock ? 'ひとつ前の段のあとに挑戦できます' : (i + 1) + '段目／全' + L.st.length + '段', ic:L.ic, need:need, unit:L.unit, go:L.go, rw:L.rw[i],
    cur:cur, ok:!lock && cur >= need, got:!!q[key], get:get };
}
/* 系統ごとに「今の段」と、その次の段（🔒）を1行ずつ。全部クリアした系統はコンプリートの行 */
function dksLmList(q){
  var lm = dksLmq(), out = [];
  DKS_LM.forEach(function(L){
    var i = Math.max(0, lm[L.s] | 0);
    if(i >= L.st.length){
      var r = dksLmRow(L, L.st.length - 1, q, false);
      r.got = true; r.ok = true; r.cur = r.need; r.ds = 'コンプリート';
      out.push(r); return;
    }
    out.push(dksLmRow(L, i, q, false));
    if(i + 1 < L.st.length) out.push(dksLmRow(L, i + 1, q, true));
  });
  return out;
}
/* タブの一覧 {id(=qdone の鍵), qid, nm, ds, ic, need, unit, go, rw, cur, ok, got, lock, get(SV)} */
function dkQuestList(tab){
  tab = tab || DKS_qtab;
  var q = SV.qdone || (SV.qdone = {});
  if(tab === 'limit' || tab === 'trophy') return dksLmList(q);
  var src = tab === 'weekly' ? DKS_QW : DKS_QD, ctx = dksQCtx();
  return src.map(function(d){
    var need = d.need;
    var cur = Math.max(0, Math.min(need, (d.get(ctx) | 0) || 0));
    var key = dksQKey(tab, d.id);
    return { id:key, qid:d.id, tab:tab, nm:d.nm, ds:d.ds, ic:d.ic, need:need, unit:d.unit, go:d.go, rw:d.rw,
             cur:cur, ok:cur >= need, got:!!q[key], lock:false,
             get:function(){ return Math.max(0, Math.min(need, (d.get(dksQCtx()) | 0) || 0)); } };
  });
}
function dksQCount(tab){ return dkQuestList(tab).filter(function(q){ return q.ok && !q.got && !q.lock; }).length; }
function dksChestState(){
  var list = dkQuestList('daily'), got = list.filter(function(q){ return q.got; }).length;
  return { got:got, n:list.length, all:got >= list.length, taken:SV.qchest === todayKey() };
}
function dksChestReady(){ var c = dksChestState(); return c.all && !c.taken; }
/* 受け取れる物がある時だけ true（ホームの縦のボタンの「!」） */
function questReady(){
  try{
    if(dksChestReady()) return true;
    return ['daily', 'weekly', 'limit'].some(function(t){ return dksQCount(t) > 0; });
  }catch(e){ return false; }
}
/* 1つ受け取る。list と quiet は旧版と同じ引数。戻り値は手に入れた物（受け取れなければ null） */
function dkTakeQuest(id, list, quiet){
  list = list || dkQuestList(dksTabOfQ(id));
  var q = list.find(function(x){ return x.id === id; });
  if(!SV.qdone) SV.qdone = {};
  if(!q || q.lock || SV.qdone[q.id]) return null;
  if((q.get(SV) | 0) < q.need) return null;
  var before = { gold:SV.gold, gem:SV.gem }, got = dksNewGot(), rw = q.rw || {};
  SV.qdone[q.id] = 1;
  if(rw.g){ SV.gold += rw.g; got.gold += rw.g; }
  if(rw.d){ SV.gem += rw.d; got.gem += rw.d; }
  if(rw.pend){
    var pool = PENDANTS.filter(function(p){ return p.rar === rw.pend; });
    var p = pool[(Math.random() * pool.length) | 0];
    if(p) got.pend.push({ p:p, r:dkGivePend(p.id) });
  }
  if(rw.tk && dkhGrant({ kind:'ticket', id:rw.tk, n:1 })) got.tk.push({ id:rw.tk, n:1 });
  if(rw.fr && dkhGrant({ kind:'frame', id:rw.fr, n:1 })) got.fr.push(rw.fr);
  if(q.tab === 'limit'){ var lm = dksLmq(); lm[q.s] = Math.max(lm[q.s] | 0, q.step + 1); }
  saveNow();
  if(!quiet) dksTakeFx(null, q, got, before);
  return got;
}
async function dksTakeFx(btn, q, got, before){
  DKS_busy = true;
  try{
    var row = document.querySelector('#quest .dks-q[data-q="' + q.id + '"]');
    if(row) row.classList.add('fx-claim');
    dksSfx('coin');
    var at = dksAt(row ? (row.querySelector('.rw') || row) : btn);
    fxBurst(at, { kind:got.gem && !got.gold ? 'gem' : 'coin', n:12 });
    fxPopText(at, got.gold ? '+' + dksN(got.gold) + 'G' : got.gem ? '💎+' + got.gem : '達成！', { tone:'gold', size:34 });
    await dksAfter(at, got, before, q.tab === 'limit' ? '限定ミッション達成' : 'ミッション達成', function(){ if(dksOn() === 'quest') showQuest(); });
  }catch(e){ console.error('[WP16b]', e); }
  DKS_busy = false;
}
function dksTakeUI(btn, id){
  if(DKS_busy) return;
  var list = dkQuestList(dksTabOfQ(id)), q = list.find(function(x){ return x.id === id; });
  var before = { gold:SV.gold, gem:SV.gem };
  var got = dkTakeQuest(id, list, true);
  if(!got){ dksNo(btn, '📜', 'まだ受け取れません', ''); return; }
  dksTakeFx(btn, q, got, before);
}
/* 一括受け取り：120ms 間隔で1つずつ判子を押していく（限定ミッションは次の段が開くので1巡だけ） */
async function dksAllUI(btn){
  if(DKS_busy) return;
  var list = dkQuestList(DKS_qtab).filter(function(q){ return q.ok && !q.got && !q.lock; });
  if(!list.length){ dksNo(btn, '🎁', '受け取れる報酬がありません', ''); return; }
  DKS_busy = true;
  var before = { gold:SV.gold, gem:SV.gem }, total = dksNewGot();
  try{
    for(var i = 0; i < list.length; i++){
      var g = dkTakeQuest(list[i].id, null, true);
      if(!g) continue;
      total.gold += g.gold; total.gem += g.gem;
      total.pend = total.pend.concat(g.pend); total.tk = total.tk.concat(g.tk); total.fr = total.fr.concat(g.fr);
      var row = document.querySelector('#quest .dks-q[data-q="' + list[i].id + '"]');
      if(row){
        row.classList.add('fx-claim', 'got');
        var b2 = row.querySelector('[data-dks-take]');
        if(b2){ b2.insertAdjacentHTML('afterend', '<div class="dks-qdone"><i class="dks-stamp new">済</i><span>受取済</span></div>'); b2.remove(); }
        var at = dksAt(row.querySelector('.rw') || row), gem = !!(g.gem && !g.gold);
        fxCoins(at, fxWalletEl(gem ? 'gem' : 'gold'), { kind:gem ? 'gem' : 'coin', n:6, dur:560 });
      }
      dksSfx('coin');
      await fxWait(120);
    }
    await fxWait(620);
    if(dksOn() === 'quest') showQuest();
    dksShowWallet(before); dkWallet();
    if(total.pend.length || total.tk.length || total.fr.length) await dksRewardModal('ミッション達成', dksItemsOf(total), '');
    else try{ toast('R', '🎁', 'まとめて受け取りました',
      (total.gold ? dksN(total.gold) + 'G' : '') + (total.gold && total.gem ? '・' : '') + (total.gem ? 'ダイヤ' + total.gem + '個' : ''), 1800); }catch(e){}
  }catch(e){ console.error('[WP16b]', e); }
  DKS_busy = false;
}
/* デイリーコンプリートの宝箱（1日1回） */
async function dksChestUI(btn){
  if(DKS_busy) return;
  var c = dksChestState();
  if(!c.all){ dksNo(btn, '🎁', 'デイリーを全部クリアすると開けられます', 'いま ' + c.got + '/' + c.n); return; }
  if(c.taken){ dksNo(btn, '🎁', '今日の宝箱は受け取りました', '明日また開けられます'); return; }
  var before = { gold:SV.gold, gem:SV.gem };
  SV.qchest = todayKey(); SV.gold += DKS_CHEST.g; SV.gem += DKS_CHEST.d; saveNow();
  var got = dksNewGot(); got.gold = DKS_CHEST.g; got.gem = DKS_CHEST.d;
  DKS_busy = true;
  try{
    var box = document.querySelector('#quest .dks-chest');
    if(box){ box.classList.add('shake'); fxShake(box, 380); }
    await fxWait(380);
    fxFlash(); dksSfx('gachaRare');
    var at = box ? fxPt(box) : { x:1380, y:430 };
    fxBurst(at, { kind:'coin', n:24, power:1.3 }); fxBurst(at, { kind:'star', n:16, power:1.2 });
    await dksAfter(at, got, before, '', function(){ if(dksOn() === 'quest') showQuest(); }, true);
    await dksRewardModal('デイリーコンプリート', dksItemsOf(got), '毎日0時に宝箱がもどります');
  }catch(e){ console.error('[WP16b]', e); }
  DKS_busy = false;
}
/* 「進行中」を押した時：あと何回か＋その場所への案内 */
function dksPlace(go){
  if(go === 'play') return (typeof dkFlowStart === 'function') ? dkFlowStart() : screenTo('setup');
  if(go === 'cards' && typeof showCards === 'function') return showCards();
  if(go === 'pend' && typeof showPend === 'function') return showPend();
  if(go === 'dice' && typeof showDice === 'function') return showDice();
  if(go === 'gacha' && typeof showGacha === 'function') return showGacha();
  if(go === 'diceshop') return showShop('dice');
  return showShop('osusume');
}
function dksLeftTx(q){
  var n = Math.max(0, q.need - q.cur);
  return q.unit === 'Lv' ? 'あと ' + n + ' Lv' : q.unit === '段' ? 'あと ' + n + ' 段' : 'あと ' + n + ' ' + q.unit;
}
function dksGuide(q){
  var pl = DKS_PLACE[q.go] || DKS_PLACE.play, n = Math.max(0, q.need - q.cur);
  var unit = q.unit === 'Lv' ? ' Lv' : q.unit === '段' ? ' 段' : ' ' + q.unit;
  var html = '<div class="modal dks-modal dks-guide">'
    + '<div class="dks-rib blue"><b>ミッションの案内</b></div>'
    + '<div class="dks-gbody">'
    +   '<div class="dks-gmedal fx-deco" aria-hidden="true">' + q.ic + '</div>'
    +   '<div class="dks-gtx"><div class="t">' + esc(q.nm) + '</div>'
    +     '<div class="big">あと <em>' + n + '</em>' + unit + '</div>'
    +     '<div class="prog"><span class="dkbar bl"><i style="width:' + (q.cur / q.need * 100).toFixed(1) + '%"></i></span>'
    +       '<b>' + q.cur + '/' + q.need + '</b></div>'
    +     '<p>' + esc(pl.tip) + '</p></div>'
    + '</div>'
    + '<div class="dks-mbtns"><button class="dkbtn dks-b dks-wood" data-act="x"><i class="dks-sh"></i>閉じる</button>'
    +   '<button class="dkbtn gr dks-b fx-primary green" data-act="go"><i class="dks-sh"></i>' + esc(pl.nm) + '</button></div>'
    + '</div>';
  dksSfx('click');
  return modal(html).then(function(a){ if(a === 'go') dksPlace(q.go); return a; });
}
/* 報酬の小さな札（ゴールド・ダイヤ・ペンダント・入場券・名札の枠） */
function dksRwHTML(rw){
  rw = rw || {};
  return (rw.g ? '<span class="c">' + dksArt('coin') + '<b>' + dksN(rw.g) + '</b></span>' : '')
    + (rw.d ? '<span class="c">' + dksArt('gem') + '<b>' + rw.d + '</b></span>' : '')
    + (rw.pend ? '<span class="c">' + dksArt('pend', { c:'#F2C230', ic:'✦' }) + '<b>S+</b></span>' : '')
    + (rw.tk ? '<span class="c" title="' + dkhTkNm(rw.tk) + '">' + dksArt('tk', { c:DKS_TKCOL[rw.tk] }) + '<b>券</b></span>' : '')
    + (rw.fr ? '<span class="c" title="' + dkhFrNm(rw.fr) + '">' + dksArt('frame', { c:DKS_FRCOL[rw.fr] }) + '<b>枠</b></span>' : '');
}
function dksQRow(q){
  var rw = dksRwHTML(q.rw);
  if(q.lock){
    return '<div class="dks-q lock" data-q="' + q.id + '" data-fx="riseR">'
      + '<div class="ic" aria-hidden="true"><span>🔒</span></div>'
      + '<div class="mid"><div class="nm">' + esc(q.nm) + '</div><div class="ds">' + esc(q.ds) + '</div></div>'
      + '<div class="rw">' + rw + '</div><div class="dks-qlock"><i class="dks-stamp">🔒</i><span>クリアすると開きます</span></div></div>';
  }
  var st = q.got ? 'got' : q.ok ? 'ok' : 'wip';
  var act = q.got ? '<div class="dks-qdone"><i class="dks-stamp">済</i><span>' + (q.ds === 'コンプリート' ? 'コンプリート' : '受取済') + '</span></div>'
          : q.ok  ? '<button class="dkbtn gr dks-b green" data-dks-take="' + q.id + '"><i class="dks-sh"></i>受け取る</button>'
          : '<button class="dkbtn dks-b dks-wip" data-dks-guide="' + q.id + '"><i class="dks-sh"></i><b>進行中</b><small>' + dksLeftTx(q) + '</small></button>';
  var num = (q.unit === '段') ? '+' + q.cur + '/+' + q.need : q.cur + '/' + q.need;
  return '<div class="dks-q ' + st + '" data-q="' + q.id + '" data-fx="riseR">'
    + '<div class="ic" aria-hidden="true"><span>' + q.ic + '</span></div>'
    + '<div class="mid"><div class="nm">' + esc(q.nm) + '</div><div class="ds">' + esc(q.ds) + '</div>'
    +   '<div class="prog"><span class="dkbar' + (q.ok ? ' gd' : ' bl') + '"><i style="width:' + (q.cur / q.need * 100).toFixed(1) + '%"></i></span>'
    +   '<b>' + num + '</b></div></div>'
    + '<div class="rw">' + rw + '</div>' + act + '</div>';
}
function dksQSig(){ return todayKey() + '|' + weekIndex(); }
var DKS_qsig = '';
/* tab を渡すとそのタブで開く（省略すると今のタブ。旧名 'trophy' は限定ミッション） */
function showQuest(tab){
  if(typeof tab === 'string' && tab) DKS_qtab = (tab === 'trophy') ? 'limit' : tab;
  if(!DKS_QTABS.some(function(t){ return t.id === DKS_qtab; })) DKS_qtab = 'daily';
  try{ dkQuestTab = DKS_qtab; }catch(e){}
  if(dksQPrune()) saveNow();
  var list = dkQuestList(DKS_qtab), ch = dksChestState(), ready = ch.all && !ch.taken;
  var tabs = DKS_QTABS.map(function(t){ var n = dksQCount(t.id); return Object.assign({}, t, { badge:n ? String(n) : '' }); });
  var head = DKS_qtab === 'daily'  ? ['デイリーミッション', '毎日0時にリセット　あと ' + dksCd(dksNextMidnight())]
           : DKS_qtab === 'weekly' ? ['ウィークリーミッション', '毎週 月曜 朝5時に入れ替え　あと ' + dksCd(dkhWeekStart(1), true)]
           : ['限定ミッション', '1つずつ進みます。クリアすると次の段が開きます'];
  var any = list.some(function(q){ return q.ok && !q.got && !q.lock; });
  var img = dkU('hero-chest');
  var side = '<div class="dkdark dks-qside" data-fx="riseR">'
    + '<div class="dks-rib gold"><b>デイリーコンプリート</b></div>'
    + '<p class="dks-qsp">デイリー5つクリアで開く宝箱</p>'
    + '<div class="dks-chestbox' + (ready ? ' ready' : '') + (ch.taken ? ' taken' : '') + '">'
    +   (ready ? '<div class="fx-rays fx-deco"></div>' : '')
    +   '<div class="dks-chest' + (img ? '' : ' noimg') + '"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '></div>'
    +   (ch.taken ? '<i class="dks-stamp big">済</i>' : '')
    + '</div>'
    + '<div class="dks-chrw"><span class="c">' + dksArt('gem') + '<b>' + DKS_CHEST.d + '</b></span>'
    +   '<span class="c">' + dksArt('coin') + '<b>' + dksN(DKS_CHEST.g) + '</b></span></div>'
    + '<div class="dks-chprog"><span class="dkbar gd"><i style="width:' + (ch.got / ch.n * 100).toFixed(1) + '%"></i></span>'
    +   '<b>' + ch.got + '/' + ch.n + '</b></div>'
    + (ch.taken ? '<div class="dks-chmsg">今日の宝箱は受け取りました</div>'
       : '<button class="dkbtn gd dks-b' + (ready ? ' fx-primary' : ' dim') + '" data-dks-chest="1"><i class="dks-sh"></i>'
         + (ready ? '宝箱を開ける' : 'あと ' + (ch.n - ch.got) + 'つ') + '</button>')
    + '</div>';
  var el = dkhAmb(dkMake('quest', 'quest', dkHead('quest', {}) + dkTabs(tabs, DKS_qtab)
    + '<div class="dkbody dks-qbody">'
    +   '<div class="dkpar dks-qbox">'
    +     '<div class="dks-qhd"><div class="dks-rib"><b>' + head[0] + '</b></div><span class="c">' + head[1] + '</span></div>'
    +     '<div class="dks-qlist" data-fx-step="50">' + list.map(dksQRow).join('') + '</div>'
    +     '<button class="dkbtn gd dks-b dks-all' + (any ? ' fx-primary' : '') + '" id="dkAll"' + (any ? '' : ' disabled') + '>'
    +       '<i class="dks-sh"></i>一括受け取り</button>'
    +   '</div>'
    +   side
    + '</div>'));
  el.classList.add('dks-scr');
  dkWire(el, function(id){ showQuest(id); });
  el.querySelectorAll('[data-dks-take]').forEach(function(b){
    b.onclick = function(){ dksTakeUI(b, b.getAttribute('data-dks-take')); };
  });
  el.querySelectorAll('[data-dks-guide]').forEach(function(b){
    b.onclick = function(){
      var q = dkQuestList(dksTabOfQ(b.getAttribute('data-dks-guide'))).find(function(x){ return x.id === b.getAttribute('data-dks-guide'); });
      if(q) dksGuide(q);
    };
  });
  var all = el.querySelector('#dkAll');
  if(all) all.onclick = function(){ dksAllUI(all); };
  var cb = el.querySelector('[data-dks-chest]');
  if(cb) cb.onclick = function(){ dksChestUI(cb); };
  DKS_qsig = dksQSig();
  screenTo('quest');
  dkEvery('dks-quest', function(){
    if(dksOn() !== 'quest'){ dkEvery('dks-quest', null); return; }
    dksTickCd(document.getElementById('quest'));
    if(!DKS_busy && dksQSig() !== DKS_qsig && !document.querySelector('#modalWrap.on')) showQuest();
  }, 1000);
  return el;
}

/* ══════════ 出席簿（J41：28日。7・14・21・28日目は金の枠と放射光） ══════════
   1日1回。取り逃しても次の日に続きから（SV.dailyN＝次に受け取る日の番号 0〜27。28日目のあとは0）。数字は当作 */
var DKS_D28 = [
  { k:'g', v:1000 }, { k:'g', v:1500 }, { k:'d', v:2 }, { k:'g', v:2000 }, { k:'tk', v:1, id:'biz' }, { k:'g', v:2500 }, { k:'card', v:1, r:'S' },
  { k:'g', v:2000 }, { k:'d', v:3 }, { k:'g', v:3000 }, { k:'pend', v:1 }, { k:'g', v:3000 }, { k:'tk', v:1, id:'biz' }, { k:'d', v:20 },
  { k:'g', v:3000 }, { k:'d', v:3 }, { k:'g', v:4000 }, { k:'card', v:1 }, { k:'g', v:4000 }, { k:'tk', v:1, id:'first' }, { k:'g', v:30000 },
  { k:'g', v:4000 }, { k:'d', v:5 }, { k:'g', v:5000 }, { k:'pend', v:1 }, { k:'g', v:5000 }, { k:'tk', v:1, id:'first' }, { k:'card', v:1, r:'SS' }
];
function dksD28Nm(d){
  return d.k === 'g' ? 'ゴールド' : d.k === 'd' ? 'ダイヤ' : d.k === 'tk' ? dkhTkNm(d.id) : d.k === 'pend' ? 'ペンダント'
       : d.r === 'SS' ? 'S+カード確定' : d.r === 'S' ? 'S以上カード' : 'カード';
}
function dksD28Art(d){
  if(d.k === 'g') return dksArt('coin');
  if(d.k === 'd') return dksArt('gem');
  if(d.k === 'tk') return dksArt('tk', { c:DKS_TKCOL[d.id] });
  if(d.k === 'pend') return dksArt('pend', { c:'#B07CE8', ic:'？' });
  return dksArt('card');
}
function dksDailyView(){
  var n = ((SV.dailyN | 0) % 28 + 28) % 28, can = canDaily();
  return { day:n, can:can, full:(!can && n === 0 && !!SV.daily28 && SV.daily28 === SV.dailyAt) };   // full＝28日目を受け取った日
}
function dksDailySig(){ return todayKey() + '|' + canDaily(); }
var DKS_dsig = '';
function showDaily(){
  var v = dksDailyView(), gold = -1;
  for(var j = v.day; j < 28 && gold < 0; j++) if((j + 1) % 7 === 0) gold = j;      // 次の豪華な日だけ光を回す
  var cells = DKS_D28.map(function(d, i){
    var got = v.full || i < v.day, now = (i === v.day && v.can), big = ((i + 1) % 7 === 0);
    return '<div class="dks-day' + (got ? ' got' : '') + (now ? ' now' : '') + (big ? ' d7' : '') + '" data-i="' + i + '">'
      + (big ? '<div class="dks-d7rays fx-deco' + (i === gold && !v.full ? ' spin' : '') + '" aria-hidden="true"><div class="fx-rays"></div></div>' : '')
      + ((big || now) ? '<i class="dks-gl" aria-hidden="true"></i>' : '')
      + '<div class="dd"><b>' + (i + 1) + '日目</b></div>'
      + '<div class="di">' + dksD28Art(d) + '</div>'
      + '<div class="dv">' + (d.k === 'g' ? dksN(d.v) : '×' + d.v) + '</div>'
      + '<div class="dn">' + esc(dksD28Nm(d)) + '</div>'
      + (got ? '<i class="dks-stamp">済</i>' : '')
      + (now ? '<span class="dks-today">今日</span>' : '')
      + (big ? '<span class="dks-crown fx-deco" aria-hidden="true"></span>' : '')
      + '</div>';
  }).join('');
  var info = v.can ? '今日は <b>' + (v.day + 1) + '日目</b>'
           : v.full ? '<b>28日</b>そろいました！明日から1日目にもどります'
           : '<b>' + v.day + '日目</b>まで受け取り済み';
  var el = dkhAmb(dkMake('daily', 'quest', dkHead('daily', { title:'出席簿' })
    + '<div class="dkbody dks-dbody">'
    +   '<div class="dkpar dks-daily">'
    +     '<div class="dks-dhd"><div class="dks-rib"><b>毎日ログインで28日ぶんの報酬</b></div><span class="c">7日ごとに豪華・' + info + '</span></div>'
    +     '<div class="dks-days" data-fx="rise">' + cells + '</div>'
    +     (v.can
        ? '<button class="dkbtn gd dks-b fx-primary dks-dget" id="dGet"><i class="dks-sh"></i>今日のぶんを受け取る</button>'
        : '<div class="dks-dnext"><i class="dks-stamp">済</i><b>今日は受け取りました</b>' + dksWait(dksNextMidnight(), false, '次の報酬まで') + '</div>')
    +   '</div>'
    + '</div>'));
  el.classList.add('dks-scr');
  dkWire(el);
  var b = el.querySelector('#dGet');
  if(b) b.onclick = function(){ dksDailyClaim(b); };
  DKS_dsig = dksDailySig();
  screenTo('daily');
  dkEvery('dks-daily', function(){
    if(dksOn() !== 'daily'){ dkEvery('dks-daily', null); return; }
    dksTickCd(document.getElementById('daily'));
    if(!DKS_busy && dksDailySig() !== DKS_dsig && !document.querySelector('#modalWrap.on')) showDaily();
  }, 1000);
  dkhGlint(el, '.dks-day > .dks-gl', 'dks-glint', '::after');
  return el;
}
/* 受け取る：判子を押す → 粒 → お金は財布へ → 王宮の報酬モーダル */
async function dksDailyClaim(btn){
  if(DKS_busy) return null;
  if(!canDaily()){ dksNo(btn, '📅', '今日はもう受け取りました', '明日また来てね'); return null; }
  var idx = ((SV.dailyN | 0) % 28 + 28) % 28, d = DKS_D28[idx], before = { gold:SV.gold, gem:SV.gem }, got = dksNewGot();
  SV.dailyAt = todayKey(); SV.dailyN = (idx + 1) % 28;
  if(idx === 27) SV.daily28 = SV.dailyAt;
  if(d.k === 'g'){ SV.gold += d.v; got.gold = d.v; }
  else if(d.k === 'd'){ SV.gem += d.v; got.gem = d.v; }
  else if(d.k === 'tk'){ if(dkhGrant({ kind:'ticket', id:d.id, n:d.v })) got.tk.push({ id:d.id, n:d.v }); }
  else if(d.k === 'pend'){ var p = PENDANTS[(Math.random() * PENDANTS.length) | 0]; got.pend.push({ p:p, r:dkGivePend(p.id) }); }
  else dksGiveCards(1, d.r || false, got);
  saveNow();
  DKS_busy = true;
  try{
    if(btn && btn.nodeType === 1) btn.disabled = true;
    var cell = document.querySelector('#daily .dks-day[data-i="' + idx + '"]');
    if(cell){
      cell.classList.add('stamping');
      cell.insertAdjacentHTML('beforeend', '<i class="dks-stamp new">済</i>');
      await fxWait(250);
      dksSfx('build');
      fxShake(cell, 180);
      fxBurst(cell, { kind:(idx + 1) % 7 === 0 ? 'star' : 'conf', n:(idx + 1) % 7 === 0 ? 22 : 10, power:0.8 });
      await fxWait(160);
    }
    var at = cell ? fxPt(cell) : { x:800, y:450 };
    await dksAfter(at, got, before, '', function(){ if(dksOn() === 'daily') showDaily(); }, true);
    await dksRewardModal('出席簿 ' + (idx + 1) + '日目', dksItemsOf(got),
      idx === 27 ? '28日そろいました！明日から1日目にもどります' : (idx + 1) % 7 === 0 ? '7日ごとの豪華な報酬です' : '明日もログインしてね');
  }catch(e){ console.error('[WP16b]', e); }
  DKS_busy = false;
  return got;
}

/* ══════════ 起動（イベントの購読と grantRewards の包み） ══════════ */
(function(){
  try{
    dkOn('match:end', dksOnMatch);
    dkOn('card:up', dksOnCardUp);
    dkOn('pend:up', dksOnPendUp);
    dkOn('dice:up', dksOnDiceUp);
    dkOn('shop:buy', dksOnBuy);
    dkOn('screen', function(e){ if(e && e.id !== 'shop'){ DKS_run = null; DKS_focus = ''; } });
    /* match:end を送らない古い grantRewards の間だけ、ここで数える（送る版なら何もしない）。
       2回目の呼び出し（G.rewarded 済み）でも数えない。引数・戻り値の Promise はそのまま通す */
    DKS_gr0 = (typeof grantRewards === 'function') ? grantRewards : null;
    if(DKS_gr0){
      grantRewards = function(won){
        var s0 = DKS_mseq, again = !!(typeof G === 'object' && G && G.rewarded);
        var hum = (typeof G === 'object' && G && G.players) ? G.players.filter(function(p){ return p && p.kind !== 'cpu'; }).length : 1;
        var r = DKS_gr0.apply(this, arguments);
        var chk = function(){
          try{ if(!again && DKS_mseq === s0) dksOnMatch({ won:!!won, humans:hum, fallback:true }); }
          catch(err){ console.error('[WP8]', err); }
        };
        if(r && typeof r.then === 'function') r.then(chk, chk); else chk();
        return r;
      };
    }
  }catch(e){ console.error('[WP8]', e); }
})();
