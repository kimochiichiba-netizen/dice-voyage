
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — セーブ土台（9a-core.js / WP0）
   ──────────────────────────────────────────────────────────────
   ・強化したレベルが盤面に効き、再読み込みしても消えないセーブの器。
   ・5-meta.js の defaultSave / fixSave / grant と 4-game.js の dieOf / pendOf を
     宣言し直す（関数宣言は後勝ち。全JSが1つの script 要素なので全呼び出し元に効く）。
   ・注意：defaultSave / fixSave は 5-meta.js の読み込み中（loadSave）に呼ばれる。
     その時点ではこのファイルのトップレベル var はまだ undefined。
     だから両関数の中では、このファイルの変数を使わず、関数宣言と
     それより前のファイルの定数（DICE, PENDANTS, CARDPOOL, RAR, MAPS …）だけを使う。
   ══════════════════════════════════════════════════════════════ */

/* ── いまのセーブの版（移行 v1） ── */
function DKCORE_migV(){ return 1; }
function DKCORE_num(v, dv){ return (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.floor(v) : dv; }
function DKCORE_obj(v){ return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
function DKCORE_str(v, dv){ return (typeof v === 'string') ? v : dv; }
function DKCORE_clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function DKCORE_isId(id){
  if(typeof id !== 'string') return false;
  if(id.charAt(0) === 'c') return !!cardById(id);
  if(id.charAt(0) === 'p') return !!pendById(id);
  if(id.charAt(0) === 'd') return DICE.some(function(x){ return x.id === id; });
  return false;
}
function DKCORE_counts(){ return { key:'', plays:0, wins:0, cup:0, pup:0, buy:0 }; }

/* ══════════ 既定のセーブ（§3 のキーをすべて持つ） ══════════ */
function defaultSave(){
  return { gold: 3000, gem: 5, lv: 1, exp: 0, plays: 0, wins: 0,
    dailyAt: '', dailyN: 0, qdone: {}, freeAt: 0,
    cards: { c01:{lv:1,dup:0,exp:0}, c02:{lv:1,dup:0,exp:0} },
    pendants: { p3:{lv:1,dup:0} },
    equip: 'c01', slots: ['p3', null, null, null],
    die: 'd0', dice: { d0:1 }, bag: [],
    locks: {},
    seen: [],
    migV: 0,
    aim: { pend:null, card:null }, pity: { pend:0, card:0 }, fail: { pend:{} }, kiwami: {},
    book: { claim:{} }, title: '',
    today: DKCORE_counts(),
    wk: (function(){ var w = DKCORE_counts(); w.key = -1; return w; })(),
    stat: { plays:0, wins:0, cup:0, pup:0, pmix:0, cmix:0, buy:0 },
    qchest: '',
    shop: { day:'', dbought:{}, freeGoldAt:0, mineDay:'', mapAt:0, peddler:null,
            pedDay:'', pedN:0, sellDay:'', sellN:0 },
    mail: [], rp: 0, season: '', friends: [], mile: 0, keys: 0,
    streak: 0, streakAt: 0, lstreak: 0,
    cls: 'eco', lastMap: 'ice', rules: { turns:12, timeLimit:1200, ai:1 } };
}

/* 郵便を1通、セーブ s に足す（fixSave の中からも使うので SV ではなく s を受ける） */
function DKCORE_mailTo(s, item){
  item = DKCORE_obj(item);
  var now = Date.now();
  var m = {
    id: 'm' + now.toString(36) + ((Math.random() * 1e6) | 0).toString(36),
    ic: DKCORE_str(item.ic, '✉️'), nm: DKCORE_str(item.nm, 'おしらせ'),
    g: DKCORE_num(item.g, 0), d: DKCORE_num(item.d, 0),
    item: (item.item && typeof item.item === 'object') ? { kind:String(item.item.kind || ''), id:String(item.item.id || '') } : null,
    at: now, exp: DKCORE_num(item.exp, now + 30 * 86400000)
  };
  if(!Array.isArray(s.mail)) s.mail = [];
  s.mail.unshift(m);
  if(s.mail.length > 50) s.mail.length = 50;
  return m;
}

/* ══════════ セーブの正規化（壊れたセーブでも必ず遊べる形にそろえる） ══════════
   旧版（5-meta.js:156）の処理を写し、§3 の新しいキーを型チェックして既定値で埋める。
   ・知らないキーは消さない（ほかの班が足した項目を守る）。id で引く表だけ知らない id を捨てる。
   ・dice は 1〜10（旧版の dice[id]=1 のバグを直す）。pendants は {lv:1〜8, dup≥0}。
   ・cards に exp を足す。lv は切り下げない（上限 30 だけ守る）。
   ・migV<1 の時だけ移行 v1 を1回行う。                                            */
function fixSave(s){
  s = DKCORE_obj(s);
  var d = defaultSave();
  var num = DKCORE_num, obj = DKCORE_obj, str = DKCORE_str;
  var now = Date.now();

  s.gold  = num(s.gold, d.gold);   s.gem   = num(s.gem, d.gem);
  s.lv    = Math.max(1, num(s.lv, 1));  s.exp = num(s.exp, 0);
  s.plays = num(s.plays, 0);       s.wins  = num(s.wins, 0);
  s.dailyN= num(s.dailyN, 0);      s.freeAt= num(s.freeAt, 0);
  s.dailyAt = str(s.dailyAt, '');
  s.qdone = obj(s.qdone);          s.locks = obj(s.locks);
  if(s.name !== undefined && typeof s.name !== 'string') delete s.name;

  var migrate = num(s.migV, 0) < DKCORE_migV();

  /* カード：知らないIDは捨てる。lv は 1〜30（等級の上限より上でも切り下げない）、重なり・経験値は 0 以上 */
  var cards = {};
  Object.keys(obj(s.cards)).forEach(function(id){
    if(!cardById(id)) return;
    var o = obj(s.cards[id]);
    cards[id] = Object.assign({}, o, {
      lv: Math.min(30, Math.max(1, num(o.lv, 1))), dup: num(o.dup, 0), exp: num(o.exp, 0) });
  });
  if(!Object.keys(cards).length) Object.keys(d.cards).forEach(function(id){ cards[id] = {lv:1, dup:0, exp:0}; });
  s.cards = cards;

  /* ペンダント：{lv:1〜8, dup≥0}（文字列や NaN は 1、8 を超えたら 8） */
  var pend = {}, refund = 0;
  Object.keys(obj(s.pendants)).forEach(function(id){
    if(!pendById(id)) return;
    var o = obj(s.pendants[id]);
    var lv = Math.max(1, num(o.lv, 1));
    if(lv > 8){ if(migrate) refund += (lv - 8) * 2000; lv = 8; }
    pend[id] = Object.assign({}, o, { lv: lv, dup: num(o.dup, 0) });
  });
  s.pendants = pend;

  /* ロックは持っているカードのぶんだけ残す */
  Object.keys(s.locks).forEach(function(id){ if(!cards[id]) delete s.locks[id]; });

  /* 装備カード：持っていないカードは装備できない */
  if(!cards[s.equip]) s.equip = Object.keys(cards)[0];

  /* ペンダント枠：かならず4枠。持っていない物と二重装備は外す（位置は保つ） */
  var src = Array.isArray(s.slots) ? s.slots : [];
  var slots = [null, null, null, null];
  for(var i = 0; i < 4; i++){
    var sid = src[i];
    if(sid && pend[sid] && slots.indexOf(sid) < 0) slots[i] = sid;
  }
  s.slots = slots;

  /* サイコロ：{id: 1〜10}。ふつうの1個（d0）はかならず持っている。旧形式がオブジェクトなら lv を拾う */
  var dice = {};
  Object.keys(obj(s.dice)).forEach(function(id){
    if(!DICE.some(function(x){ return x.id === id; })) return;
    var v = s.dice[id];
    if(v && typeof v === 'object') v = v.lv;
    dice[id] = DKCORE_clamp(num(v, 1), 1, 10);
  });
  dice.d0 = Math.max(1, dice.d0 || 1);
  s.dice = dice;
  if(typeof s.die !== 'string' || !dice[s.die]) s.die = 'd0';

  /* 持ち込みアイテム：知らないIDは捨て、上限（3個）まで */
  s.bag = (Array.isArray(s.bag) ? s.bag : []).filter(function(id){ return itemById(id); }).slice(0, 3);

  /* ── §3 の新しいキー ── */
  var seen = [];
  (Array.isArray(s.seen) ? s.seen : []).forEach(function(id){
    if(DKCORE_isId(id) && seen.indexOf(id) < 0) seen.push(id);
  });
  s.seen = seen;

  var aim = obj(s.aim);
  s.aim = Object.assign({}, aim, {
    pend: (typeof aim.pend === 'string' && pendById(aim.pend)) ? aim.pend : null,
    card: (typeof aim.card === 'string' && cardById(aim.card)) ? aim.card : null });
  var pity = obj(s.pity);
  s.pity = Object.assign({}, pity, { pend: num(pity.pend, 0), card: num(pity.card, 0) });
  var fail = obj(s.fail), fp = {};
  Object.keys(obj(fail.pend)).forEach(function(k){ var v = num(fail.pend[k], -1); if(v >= 0) fp[k] = v; });
  s.fail = Object.assign({}, fail, { pend: fp });
  var kw = {};
  Object.keys(obj(s.kiwami)).forEach(function(id){
    var v = s.kiwami[id];
    if(DICE.some(function(x){ return x.id === id; }) && (v === 'atk' || v === 'def')) kw[id] = v;
  });
  s.kiwami = kw;

  var book = obj(s.book);
  s.book = Object.assign({}, book, { claim: obj(book.claim) });
  s.title = str(s.title, '');

  var cnt = function(o, keyDv){
    o = obj(o);
    return Object.assign({}, o, {
      key: (keyDv === -1) ? (typeof o.key === 'number' && isFinite(o.key) ? Math.floor(o.key) : -1) : str(o.key, ''),
      plays: num(o.plays, 0), wins: num(o.wins, 0), cup: num(o.cup, 0), pup: num(o.pup, 0), buy: num(o.buy, 0) });
  };
  s.today = cnt(s.today, '');
  s.wk    = cnt(s.wk, -1);
  var st = obj(s.stat);
  s.stat = Object.assign({}, st, { plays: num(st.plays, 0), wins: num(st.wins, 0), cup: num(st.cup, 0),
    pup: num(st.pup, 0), pmix: num(st.pmix, 0), cmix: num(st.cmix, 0), buy: num(st.buy, 0) });
  s.qchest = str(s.qchest, '');

  var sh = obj(s.shop);
  s.shop = Object.assign({}, sh, {
    day: str(sh.day, ''), dbought: obj(sh.dbought), freeGoldAt: num(sh.freeGoldAt, 0),
    mineDay: str(sh.mineDay, ''), mapAt: num(sh.mapAt, 0),
    peddler: (sh.peddler && typeof sh.peddler === 'object') ? sh.peddler : null,
    pedDay: str(sh.pedDay, ''), pedN: num(sh.pedN, 0), sellDay: str(sh.sellDay, ''), sellN: num(sh.sellN, 0) });

  /* 郵便：30日を過ぎたものは捨てる。最大50件（新しい順） */
  var mail = (Array.isArray(s.mail) ? s.mail : []).filter(function(m){
    return m && typeof m === 'object' && typeof m.id === 'string';
  }).map(function(m){
    var at = num(m.at, now);
    return Object.assign({}, m, { ic: str(m.ic, '✉️'), nm: str(m.nm, 'おしらせ'),
      g: num(m.g, 0), d: num(m.d, 0),
      item: (m.item && typeof m.item === 'object') ? m.item : null,
      at: at, exp: num(m.exp, at + 30 * 86400000) });
  }).filter(function(m){ return m.exp > now; });
  mail.sort(function(a, b){ return b.at - a.at; });
  s.mail = mail.slice(0, 50);

  s.rp = num(s.rp, 0); s.season = str(s.season, '');
  s.friends = (Array.isArray(s.friends) ? s.friends : []).filter(function(f){
    return f && typeof f === 'object' && typeof f.name === 'string';
  }).map(function(f){ return Object.assign({}, f, { at: num(f.at, 0), n: num(f.n, 0) }); }).slice(0, 100);
  s.mile = num(s.mile, 0); s.keys = num(s.keys, 0);
  s.streak = num(s.streak, 0); s.streakAt = num(s.streakAt, 0); s.lstreak = num(s.lstreak, 0);
  s.cls = (['eco','biz','first','dia'].indexOf(s.cls) >= 0) ? s.cls : 'eco';
  s.lastMap = (typeof s.lastMap === 'string' && MAPS.some(function(m){ return m.id === s.lastMap; })) ? s.lastMap : 'ice';
  var ru = obj(s.rules);
  s.rules = Object.assign({}, ru, {
    turns: Math.max(1, num(ru.turns, 12)), timeLimit: num(ru.timeLimit, 1200),
    ai: DKCORE_clamp(num(ru.ai, 1), 0, 2) });

  /* ── 移行 v1（1回だけ） ──
     ・d0 以外の所持サイコロを Lv4 に（係数 k(1)=0.25 で弱くなるぶんの救済）＋お詫び 10,000G を郵便で
     ・ペンダント lv が 8 を超えていた分は ×2,000G を郵便で返す（上で 8 に丸め済み）
     ・カードは切り下げない。これまでの対戦数・勝ち数を実績用の stat に写す */
  if(migrate){
    var hadDie = false;
    Object.keys(dice).forEach(function(id){
      if(id === 'd0') return;
      hadDie = true;
      dice[id] = Math.max(dice[id], 4);
    });
    if(hadDie) DKCORE_mailTo(s, { ic:'🎲', nm:'サイコロ調整のおわび', g:10000 });
    if(refund > 0) DKCORE_mailTo(s, { ic:'📿', nm:'ペンダント強化の上限変更による返金', g:refund });
    s.stat.plays = Math.max(s.stat.plays, s.plays);
    s.stat.wins  = Math.max(s.stat.wins, s.wins);
    s.migV = DKCORE_migV();
    fixSave._migrated = true;          // 起動時の初期化で1回だけ保存する（まだ SV に入っていないため）
  } else {
    s.migV = Math.max(num(s.migV, 0), DKCORE_migV());
  }
  return s;
}

/* ══════════ サイコロ ══════════ */
/* 本家LEDサイコロの能力値 5/7/9/10/12/14/15/17/19/20 を20で割った比。カタログ値＝Lv10の値 */
function dkDieK(lv){
  var K = [0.25, 0.35, 0.45, 0.5, 0.6, 0.7, 0.75, 0.85, 0.95, 1];
  var i = DKCORE_clamp((lv | 0) || 1, 1, 10) - 1;
  return K[i];
}
function DKCORE_r(x){ return Math.round(x * 10000) / 10000; }
/* DICE のコピーを返す（DICE の中身は書き換えない）。Lv10 なら極の効果も入れる。
   kw を渡すとその極で計算する（省略時は SV.kiwami） */
function dkDieStats(id, lv, kw){
  var d = dieById(id);
  lv = DKCORE_clamp((lv | 0) || 1, 1, 10);
  var k = dkDieK(lv);
  var o = Object.assign({}, d, {
    gauge: DKCORE_r((d.gauge || 0) * k), dbl: DKCORE_r((d.dbl || 0) * k), big: DKCORE_r((d.big || 0) * k),
    lv: lv, k: k, kiwami: null });
  if(lv >= 10){
    var w = (kw !== undefined) ? kw : ((typeof SV === 'object' && SV && SV.kiwami) ? SV.kiwami[d.id] : null);
    if(w === 'atk'){ o.big = DKCORE_r(o.big * 1.15); o.kiwami = 'atk'; }
    else if(w === 'def'){ o.gauge = DKCORE_r(o.gauge + 2); o.kiwami = 'def'; }
  }
  return o;
}
/* 装備しているサイコロ。CPU と未所持は DICE[0]。
   人間は p.dieId/p.dieLv（newGame のラッパ／オンラインは WP6 が配る）→ 無ければ SV */
function dieOf(pi){
  var p = G && G.players && G.players[pi];
  if(!p || p.kind === 'cpu') return DICE[0];
  if(p.dieId && DICE.some(function(x){ return x.id === p.dieId; })) return dkDieStats(p.dieId, p.dieLv || 1);
  if(!(SV.dice && SV.dice[SV.die])) return DICE[0];
  return dkDieStats(SV.die, SV.dice[SV.die]);
}

/* ══════════ ペンダント ══════════ */
function dkPendMul(lv){
  lv = DKCORE_clamp((lv | 0) || 1, 1, 8);
  return Math.round((1 + 0.05 * (lv - 1)) * 100) / 100;
}
/* そのプレイヤーのペンダント lv：p.pendLv[id] → 人間なら SV → CPU は 1。
   オンライン中に p.pendLv が無い時は 1（端末ごとに SV が違うと確率がずれて同期が崩れるため） */
function DKCORE_pendLv(p, id){
  if(p && p.pendLv && p.pendLv[id]) return DKCORE_clamp(p.pendLv[id] | 0, 1, 8);
  if(!p || p.kind === 'cpu') return 1;
  if(window.DV_OL && window.DV_OL.started) return 1;
  var o = SV.pendants && SV.pendants[id];
  return DKCORE_clamp((o && o.lv) | 0 || 1, 1, 8);
}
/* 同じ trg の中で実効確率が最大の1つを返す（本家「同じ系統は高い方だけ発動」）。
   PENDANTS の実体ではなくコピーを返す。id を残すので pendFire の分岐はそのまま動く */
function pendOf(pi, trg){
  var p = G && G.players && G.players[pi];
  if(!p || !p.pend) return null;
  var best = null, bp = -1;
  for(var i = 0; i < p.pend.length; i++){
    var it = p.pend[i];
    if(!it || it.trg !== trg) continue;
    var lv = DKCORE_pendLv(p, it.id);
    var pr = Math.min(0.95, it.p * dkPendMul(lv));
    if(pr > bp){ bp = pr; best = Object.assign({}, it, { p: pr, lv: lv }); }
  }
  return best;
}

/* ══════════ 入手 ══════════ */
function dkNormRar(r){ return r === 'S+' ? 'SS' : r; }
/* ペンダントを1つ渡す。持っていれば重なり（dup+1） → {id, dup, fresh} */
function dkGivePend(id){
  if(!pendById(id)) return null;
  var o = SV.pendants[id];
  var fresh = !o;
  if(o){ o.dup = ((o.dup | 0) || 0) + 1; if(!o.lv) o.lv = 1; }
  else { o = SV.pendants[id] = { lv:1, dup:0 }; }
  saveNow();
  return { id:id, dup:o.dup, fresh:fresh };
}
/* まだ持っていないサイコロを、弱い順にひとつ（Lv1）開ける */
function DKCORE_newDie(){
  for(var i = 0; i < DICE.length; i++){
    if(!SV.dice[DICE[i].id]){ SV.dice[DICE[i].id] = 1; return DICE[i]; }
  }
  return null;
}
/* カードを1枚渡す。重複は dup+1。18% でペンダント（dkGivePend）。4% で未所持のサイコロ（全部あれば 2,000G）。
   戻り値 {card:{id,fresh,dup}, pend:null|{id,dup,fresh}, die:null|{id,fresh}, gold:0|2000} */
function grant(c){
  var out = { card:null, pend:null, die:null, gold:0 };
  if(!c || !cardById(c.id)) return out;
  var had = !!SV.cards[c.id];
  if(had){ var o = SV.cards[c.id]; o.dup = ((o.dup | 0) || 0) + 1; }
  else SV.cards[c.id] = { lv:1, dup:0, exp:0 };
  out.card = { id:c.id, fresh:!had, dup:SV.cards[c.id].dup };
  if(Math.random() < 0.18){
    var p = PENDANTS[(Math.random() * PENDANTS.length) | 0];
    out.pend = dkGivePend(p.id);
  }
  if(Math.random() < 0.04){
    var dd = DKCORE_newDie();
    if(dd) out.die = { id:dd.id, fresh:true };
    else { SV.gold += 2000; out.gold = 2000; }
  }
  saveNow();
  return out;
}

/* ══════════ 図鑑・郵便 ══════════ */
/* 初めて見た時だけ true。200G を渡して 'seen' を送る */
function dkMarkSeen(id){
  if(!DKCORE_isId(id)) return false;
  if(!Array.isArray(SV.seen)) SV.seen = [];
  if(SV.seen.indexOf(id) >= 0) return false;
  SV.seen.push(id);
  SV.gold += 200;
  saveNow();
  dkEmit('seen', { id:id, fresh:true });
  return true;
}
/* 'unseen'|'seen'|'own'（頭文字 c/p/d で種類を見分ける） */
function dkBookState(id){
  if(typeof id !== 'string') return 'unseen';
  var k = id.charAt(0);
  if(k === 'c' && SV.cards && SV.cards[id]) return 'own';
  if(k === 'p' && SV.pendants && SV.pendants[id]) return 'own';
  if(k === 'd' && SV.dice && SV.dice[id]) return 'own';
  return (Array.isArray(SV.seen) && SV.seen.indexOf(id) >= 0) ? 'seen' : 'unseen';
}
/* 郵便を1通送る。item = {ic, nm, g, d, item:{kind,id}|null, exp?} → 作った郵便を返す */
function dkMail(item){
  var m = DKCORE_mailTo(SV, item);
  saveNow();
  dkEmit('mail', { n: SV.mail.length });
  return m;
}
/* 日替わり・週替わりの回数（キーが変わっていたら0から）。WP の中で使ってよい */
function DKCORE_today(){
  var k = todayKey();
  if(!SV.today || SV.today.key !== k){ SV.today = DKCORE_counts(); SV.today.key = k; }
  return SV.today;
}
function DKCORE_week(){
  var k = weekIndex();
  if(!SV.wk || SV.wk.key !== k){ SV.wk = DKCORE_counts(); SV.wk.key = k; }
  return SV.wk;
}

/* ══════════ newGame のラッパ：人間の p.pendLv / p.dieId / p.dieLv を入れる ══════════ */
var DKCORE_newGame0 = (typeof newGame === 'function') ? newGame : null;
if(DKCORE_newGame0){
  newGame = function(){
    var r = DKCORE_newGame0.apply(this, arguments);
    try{
      if(G && G.players) G.players.forEach(function(p){
        if(!p || p.kind === 'cpu') return;
        if(!p.pendLv){
          p.pendLv = {};
          (p.pend || []).forEach(function(it){
            if(!it) return;
            var o = SV.pendants && SV.pendants[it.id];
            p.pendLv[it.id] = DKCORE_clamp((o && o.lv) | 0 || 1, 1, 8);
          });
        }
        if(!p.dieId && SV.dice && SV.dice[SV.die]){ p.dieId = SV.die; p.dieLv = SV.dice[SV.die]; }
      });
    }catch(e){ console.error('[WP0]', e); }
    return r;
  };
}

/* ══════════ 起動時 ══════════ */
(function(){
  try{
    var raw = null;
    try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){ raw = null; }
    /* はじめて遊ぶ人（保存が無い）は、最初から今の版。移行もお詫びも要らない */
    if(raw === null && SV && !(SV.migV >= DKCORE_migV())) SV.migV = DKCORE_migV();
    /* 読み込み時に移行したら、ここで1回だけ保存する（二重に郵便が届かないように） */
    if(fixSave._migrated){ fixSave._migrated = false; saveNow(); }
  }catch(e){ console.error('[WP0]', e); }
})();
