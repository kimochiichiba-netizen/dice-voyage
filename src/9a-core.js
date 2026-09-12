
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — セーブ土台と共通の関数（9a-core.js / v9 WP0 → v10 WP12a）
   ──────────────────────────────────────────────────────────────
   ・セーブの器（defaultSave / fixSave・移行 v1 と v2）と、ほかの班が使う共通の関数
     （割合 dkRate・クラス係数 dkScale・チーム戦 dkAlly/dkTeamOf・対戦の初期化 dkInitPlayers・
       能力 dkSkillRoll・サイコロの能力 dkDieAb・能力値 dkStatSplit/dkStatLabels・ペンダント枠 dkPendSlots・
       キューブと品物 dkGiveCube/dkOpenCube/dkGrantItem・本日のマップ dkTodayMap・名札の枠 dkFrameOf）。
   ・5-meta.js の defaultSave / fixSave / grant / cardStats、4-game.js の dieOf / pendOf / timeUp、
     3-core.js の hasTriple / hasLine を宣言し直す（関数宣言は後勝ち。全JSが1つの script 要素なので全呼び出し元に効く）。
   ・種類を増やす（DKCORE_ensureData）：ペンダント 8→16種（A7・S6・S+3）、サイコロ 5→8種。
     キューブの中身は等級の表をカード用・ペンダント用で分ける（DKCORE_cubeRar・DKCORE_cubeOdds）。
   ・社長専用リンク ?boss=kimochi（DKCORE_bossGift・SV.vip）。ふつうのリンクには何も起きない。
   ・注意：defaultSave / fixSave は 5-meta.js の読み込み中（loadSave）に呼ばれる。
     その時点ではこのファイルのトップレベル var はまだ undefined。
     だから両関数の中では、このファイルの変数を使わず、関数宣言と
     それより前のファイルの定数（DICE, PENDANTS, CARDPOOL, RAR, MAPS …）だけを使う。
   ══════════════════════════════════════════════════════════════ */

/* ── いまのセーブの版（移行 v1）。v10 の移行は別の印 migV2 で数える
      （凍結中の検証道具の save が migV===1 を見るので、migV は 1 のまま） ── */
function DKCORE_migV(){ return 1; }
function DKCORE_migV2(){ return 1; }
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
function DKCORE_counts(){ return { key:'', plays:0, wins:0, cup:0, pup:0, buy:0, rp:0 }; }
/* 重ならない id（Math.random を使わない＝自動対戦・オンラインの乱数の順番を乱さない） */
function DKCORE_uid(pre){
  DKCORE_uid.n = ((DKCORE_uid.n | 0) + 1) % 1679616;
  return (pre || 'x') + Date.now().toString(36) + DKCORE_uid.n.toString(36);
}
function DKCORE_online(){ return !!(typeof window !== 'undefined' && window.DV_OL && window.DV_OL.started); }

/* ══════════ 種類を増やす（ペンダント 16種・サイコロ 8種） ══════════
   PENDANTS（5-meta.js）と DICE（3-core.js）は const だが、中身（配列の要素）は足せる。
   defaultSave / fixSave は 5-meta.js の読み込み中に呼ばれるので、足すのはこの関数の中だけで行い、
   両関数の先頭から呼ぶ（その時点ではこのファイルのトップレベル var はまだ undefined なので、表は関数の中に置く）。
   ・ペンダントの効果は pendFire（9h-board.js）が id（p1〜p8）で分ける。新しいペンダントは eff に
     既存の効果の id を持ち、pendOf が返す写しの id をその効果の id にする
     （名前・絵・等級・確率・発動の種類は新しいペンダントのまま＝本家の「同じ系統で強さ違い」と同じ形）。
   ・等級の配分は本家の幸運アイテムに寄せて A 7・S 6・S+ 3。同じ trg は実効確率が高い1つだけ発動する。 */
function DKCORE_moreP(){
  return [
    { id:'p9',  nm:'颶風のペンダント', ic:'🌪', rar:'A',  trg:'onRoll',     p:0.28, eff:'p8',
      ds:'サイコロを振るとき、ダブルが出る' },
    { id:'p10', nm:'霧氷のペンダント', ic:'❄️', rar:'A',  trg:'onSameTile', p:0.30, eff:'p7',
      ds:'相手と同じマスに止まったとき、相手のマーブルの20%を奪う' },
    { id:'p11', nm:'羅針のペンダント', ic:'🧭', rar:'A',  trg:'onOwnLand',  p:0.30, eff:'p6',
      ds:'自分の都市に止まったとき、同じ辺の自分の別の都市へ跳ぶ' },
    { id:'p12', nm:'礎石のペンダント', ic:'🧱', rar:'A',  trg:'onBuild',    p:0.24, eff:'p4',
      ds:'建物を3棟以上持っているとき、スタートへ移動して給料を受け取る' },
    { id:'p13', nm:'隼のペンダント',   ic:'🪶', rar:'S',  trg:'onTravel',   p:0.42, eff:'p5',
      ds:'ワープのマスで、選ばずに一番得なマスへ即座に移動する' },
    { id:'p14', nm:'金環のペンダント', ic:'💍', rar:'S',  trg:'onOwnLand',  p:0.46, eff:'p6',
      ds:'自分の都市に止まったとき、同じ辺の自分の別の都市へ跳ぶ' },
    { id:'p15', nm:'呪縛のペンダント', ic:'🕸', rar:'S',  trg:'onTollGet',  p:0.40, eff:'p2',
      ds:'相手が自分のランドマークに止まったとき束縛し、次の移動でもう一度通行料を取る' },
    { id:'p16', nm:'天穹のペンダント', ic:'🌌', rar:'SS', trg:'onBuild',    p:0.72, eff:'p3',
      ds:'建設したとき、自分の別の都市の建物がもう1段上がる' }
  ];
}
/* サイコロ（J42）：ダブルの確率・大きい目の補正は本家に無いので dbl・big は 0。
   能力の上乗せは DKCORE_DIEAB（下）で種類ごとに組み合わせを変える */
function DKCORE_moreD(){
  return [
    { id:'d5', nm:'星降りのサイコロ', ic:'🌠', rar:'S',  col:'#9FC6FF',
      ds:'ゲージインパクトと偶数奇数の回数が伸びる。', gauge:0, dbl:0, big:0 },
    { id:'d6', nm:'商神のサイコロ',   ic:'⚖️', rar:'S',  col:'#FFC58A',
      ds:'買収費用割引・ゴールドボーナス・RPボーナスが伸びる。', gauge:0, dbl:0, big:0 },
    { id:'d7', nm:'匠のサイコロ',     ic:'🔨', rar:'S+', col:'#A8DFA0',
      ds:'建設費用割引・ミニゲーム勝利・黄金フォーチュンが伸びる。', gauge:0, dbl:0, big:0 }
  ];
}
/* 1回だけ足す（同じ id は足さないので、二重に呼ばれても増えない）。
   PENDANTS・DICE は const（TDZ）なので、まだ作られていない時に触ると例外になる。
   その時は done を立てず、次に呼ばれた時にもう一度試す */
function DKCORE_ensureData(){
  if(DKCORE_ensureData.done) return;
  var okP = false, okD = false;
  var add = function(list, more){
    more.forEach(function(o){
      for(var i = 0; i < list.length; i++) if(list[i] && list[i].id === o.id) return;
      list.push(o);
    });
  };
  try{ if(Array.isArray(PENDANTS)){ add(PENDANTS, DKCORE_moreP()); okP = true; } }catch(e){ okP = false; }
  try{ if(Array.isArray(DICE)){ add(DICE, DKCORE_moreD()); okD = true; } }catch(e){ okD = false; }
  if(okP && okD) DKCORE_ensureData.done = 1;
}

/* ── キューブ（J40）：ウッド＜シルバー＜ゴールド＜ダイヤ。最大7個 ── */
function DKCORE_cubeKinds(){ return ['wood', 'silver', 'gold', 'dia']; }
function DKCORE_cubeMax(){ return 7; }
function DKCORE_cubeInfo(kind){
  var T = { wood:   { nm:'ウッドキューブ',   ic:'🟫', col:'#B98552' },
            silver: { nm:'シルバーキューブ', ic:'⬜', col:'#C9D3DE' },
            gold:   { nm:'ゴールドキューブ', ic:'🟨', col:'#FFD24D' },
            dia:    { nm:'ダイヤキューブ',   ic:'💎', col:'#8FE8FF' } };
  var o = T[kind] || T.wood;
  return { kind:(T[kind] ? kind : 'wood'), nm:o.nm, ic:o.ic, col:o.col };
}
/* 提供割合（合計100）。k＝gold（lo〜hi G）・gem（n 個）・card・pend */
function DKCORE_cubeRows(kind){
  var T = {
    wood:   [ { k:'gold', w:70, lo:300,  hi:800 },  { k:'gem', w:20, n:1 },  { k:'card', w:10 } ],
    silver: [ { k:'gold', w:60, lo:800,  hi:2000 }, { k:'gem', w:20, n:2 },  { k:'card', w:15 }, { k:'pend', w:5 } ],
    gold:   [ { k:'gold', w:45, lo:2000, hi:5000 }, { k:'gem', w:20, n:5 },  { k:'card', w:25 }, { k:'pend', w:10 } ],
    dia:    [ { k:'gem',  w:30, n:10 },              { k:'card', w:50 }, { k:'pend', w:20 } ] };
  return (T[kind] || T.wood).map(function(r){ return Object.assign({}, r); });
}
/* 等級の割合（合計100）。カード用とペンダント用で別の表にする
   （本家もキャラクターカードのほうが上の等級が出やすい）。what＝'card'|'pend' */
function DKCORE_cubeRar(kind, what){
  var C = { wood:{ A:100 }, silver:{ A:88, S:12 }, gold:{ A:60, S:34, SS:6 },  dia:{ S:70, SS:30 } };
  var P = { wood:{ A:100 }, silver:{ A:100 },      gold:{ A:70, S:30 },        dia:{ S:80, SS:20 } };
  var T = (what === 'pend') ? P : C;
  var o = T[kind] || T.wood;
  return Object.keys(o).map(function(r){ return { rar:r, w:o[r] }; });
}
/* 画面用（提供割合の表示）：キューブ kind の中身を [{k, nm, pct, rar?}] で返す */
function DKCORE_cubeOdds(kind){
  var ci = DKCORE_cubeInfo(kind), rows = DKCORE_cubeRows(ci.kind), tot = 0, out = [];
  rows.forEach(function(r){ tot += r.w; });
  if(!tot) tot = 1;
  rows.forEach(function(r){
    var pct = Math.round(r.w / tot * 1000) / 10;
    if(r.k === 'gold'){ out.push({ k:'gold', nm:'ゴールド ' + r.lo.toLocaleString() + '〜' + r.hi.toLocaleString(), pct:pct }); return; }
    if(r.k === 'gem'){ out.push({ k:'gem', nm:'ダイヤ ' + r.n, pct:pct }); return; }
    out.push({ k:r.k, nm:(r.k === 'card' ? 'キャラクターカード' : 'ペンダント'), pct:pct,
      rar: DKCORE_cubeRar(ci.kind, r.k).map(function(x){
        return { rar:(x.rar === 'SS' ? 'S+' : x.rar), pct:Math.round(pct * x.w) / 100 }; }) });
  });
  return { kind:ci.kind, nm:ci.nm, rows:out };
}
/* セーブの cubes をそろえる：配列（文字列 'wood' か {id,kind,at}）か、数（その数のウッド）を受ける */
function DKCORE_cubesNorm(v){
  var K = DKCORE_cubeKinds(), out = [], ids = {};
  var add = function(kind, id, at){
    if(K.indexOf(kind) < 0) kind = 'wood';
    if(typeof id !== 'string' || !id || ids[id]) id = DKCORE_uid('q');
    ids[id] = 1;
    out.push({ id:id, kind:kind, at:DKCORE_num(at, 0) });
  };
  if(typeof v === 'number' && isFinite(v) && v > 0){
    for(var i = 0; i < Math.min(60, Math.floor(v)); i++) add('wood', null, 0);
  } else if(Array.isArray(v)){
    v.slice(0, 60).forEach(function(c){
      if(c === null || c === undefined || c === false) return;
      if(typeof c === 'string') add(c, null, 0);
      else if(typeof c === 'object') add(c.kind, c.id, c.at);
      else add('wood', null, 0);
    });
  }
  return out;
}
/* 持ち込み品（C07）：{oe,sal,dbl,magic} のうち、有効な物だけを残す（空は {}） */
function DKCORE_carryNorm(v){
  var o = DKCORE_obj(v), out = {};
  if(o.oe === true || o.oe === 1) out.oe = true;
  if(o.sal === true || o.sal === 1) out.sal = true;
  if(o.dbl === true || o.dbl === 1) out.dbl = true;
  if(['angel', 'coupon', 'shield', 'escape'].indexOf(o.magic) >= 0) out.magic = o.magic;
  return out;
}
function DKCORE_ticketName(id){
  return ({ biz:'ビジネス入場券', first:'ファースト入場券', dia:'ダイヤモンド入場券' })[id] || '入場券';
}

/* ══════════ 既定のセーブ（§3 のキー＋v10 の C21〜C26） ══════════ */
function defaultSave(){
  DKCORE_ensureData();
  return { gold: 3000, gem: 5, lv: 1, exp: 0, plays: 0, wins: 0,
    dailyAt: '', dailyN: 0, qdone: {}, freeAt: 0,
    cards: { c01:{lv:1,dup:0,exp:0}, c02:{lv:1,dup:0,exp:0} },
    pendants: { p3:{lv:1,dup:0} },
    equip: 'c01', slots: ['p3', null, null, null],
    die: 'd0', dice: { d0:1 }, bag: [],
    locks: {},
    seen: [],
    migV: 0, migV2: 0,
    aim: { pend:null, card:null }, pity: { pend:0, card:0 }, fail: { pend:{} }, kiwami: {},
    book: { claim:{} }, title: '',
    today: DKCORE_counts(),
    wk: (function(){ var w = DKCORE_counts(); w.key = -1; return w; })(),
    wkPrev: null,
    stat: { plays:0, wins:0, cup:0, pup:0, pmix:0, cmix:0, buy:0 },
    qchest: '',
    shop: { day:'', dbought:{}, freeGoldAt:0, mineDay:'', mapAt:0, peddler:null,
            pedDay:'', pedN:0, sellDay:'', sellN:0 },
    mail: [], rp: 0, season: '', friends: [], mile: 0, keys: 0,
    streak: 0, streakAt: 0, lstreak: 0, cheer: 0,
    cls: 'eco', lastMap: 'ice',
    /* J12：既定は本家の30ターン・25分。team・shake・turnTimer は既定オフ（部屋・設定でオン） */
    rules: { turns:30, timeLimit:1500, ai:1, team:false, shake:false, turnTimer:false },
    carry: {}, tickets: { biz:0, first:0, dia:0 }, tutorial: 0,
    cubes: [], luckyMile: 0, lmq: {}, frames: { own:[], eq:'' }, vip: 0 };
}

/* 郵便を1通、セーブ s に足す（fixSave の中からも使うので SV ではなく s を受ける）。
   item＝{kind,id,n}（kind＝card pend die key ticket cube frame） */
function DKCORE_mailTo(s, item){
  item = DKCORE_obj(item);
  var now = Date.now();
  var it = (item.item && typeof item.item === 'object')
    ? { kind:String(item.item.kind || ''), id:String(item.item.id === undefined || item.item.id === null ? '' : item.item.id),
        n:Math.max(1, DKCORE_num(item.item.n, 1)) } : null;
  var m = {
    id: DKCORE_uid('m'),
    ic: DKCORE_str(item.ic, '✉️'), nm: DKCORE_str(item.nm, 'おしらせ'),
    g: DKCORE_num(item.g, 0), d: DKCORE_num(item.d, 0),
    item: it,
    at: now, exp: DKCORE_num(item.exp, now + 30 * 86400000)
  };
  if(!Array.isArray(s.mail)) s.mail = [];
  s.mail.unshift(m);
  if(s.mail.length > 50) s.mail.length = 50;
  return m;
}

/* ══════════ セーブの正規化（壊れたセーブでも必ず遊べる形にそろえる） ══════════
   旧版（5-meta.js:156）の処理を写し、§3・v10 の新しいキーを型チェックして既定値で埋める。
   ・知らないキーは消さない（ほかの班が足した項目を守る）。id で引く表だけ知らない id を捨てる。
   ・dice は 1〜10（旧版の dice[id]=1 のバグを直す）。pendants は {lv:1〜8, dup≥0}。
   ・cards に exp を足す。lv は切り下げない（上限 30 だけ守る）。
   ・cubes は最大7。超えた分は捨てずに cube の品物としてプレゼントボックスへ。
   ・migV<1 の時だけ移行 v1、migV2<1 の時だけ移行 v2 を1回ずつ行う。                  */
function fixSave(s){
  DKCORE_ensureData();
  s = DKCORE_obj(s);
  var d = defaultSave();
  var num = DKCORE_num, obj = DKCORE_obj, str = DKCORE_str;
  var now = Date.now();

  s.gold  = num(s.gold, d.gold);   s.gem   = num(s.gem, d.gem);
  s.lv    = Math.max(1, num(s.lv, 1));  s.exp = num(s.exp, 0);
  s.plays = num(s.plays, 0);       s.wins  = num(s.wins, 0);
  s.dailyN= num(s.dailyN, 0) % 28; s.freeAt= num(s.freeAt, 0);     /* 出席簿は28マス（0〜27） */
  s.dailyAt = str(s.dailyAt, '');
  s.qdone = obj(s.qdone);          s.locks = obj(s.locks);
  if(s.name !== undefined && typeof s.name !== 'string') delete s.name;

  var migrate  = num(s.migV, 0) < DKCORE_migV();
  var migrate2 = num(s.migV2, 0) < DKCORE_migV2();

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

  /* ペンダント枠：かならず4枠。持っていない物と二重装備は外す（位置は保つ。開いている枠の数は dkPendSlots が決める） */
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
      plays: num(o.plays, 0), wins: num(o.wins, 0), cup: num(o.cup, 0), pup: num(o.pup, 0), buy: num(o.buy, 0),
      rp: num(o.rp, 0) });
  };
  s.today = cnt(s.today, '');
  s.wk    = cnt(s.wk, -1);
  s.wkPrev = (s.wkPrev && typeof s.wkPrev === 'object' && !Array.isArray(s.wkPrev)) ? cnt(s.wkPrev, -1) : null;
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

  /* ── v10 の新しいキー（C21〜C26） ── */
  var ru = obj(s.rules);
  var v9rules = ru.turns === 12 && ru.timeLimit === 1200;           /* v9 の既定のまま */
  s.rules = Object.assign({}, ru, {
    turns: Math.max(1, num(ru.turns, 30)), timeLimit: num(ru.timeLimit, 1500),
    ai: DKCORE_clamp(num(ru.ai, 1), 0, 2),
    team: ru.team === true, shake: ru.shake === true, turnTimer: ru.turnTimer === true });
  s.carry = DKCORE_carryNorm(s.carry);
  var tk = obj(s.tickets);
  s.tickets = Object.assign({}, tk, { biz: num(tk.biz, 0), first: num(tk.first, 0), dia: num(tk.dia, 0) });
  s.tutorial = num(s.tutorial, 0);
  s.vip = (s.vip === true || num(s.vip, 0) > 0) ? 1 : 0;      /* 社長専用リンクで受け取り済みの印 */
  s.luckyMile = num(s.luckyMile, 0);
  s.cheer = (s.cheer === true || num(s.cheer, 0) > 0) ? 1 : 0;
  s.lmq = obj(s.lmq);
  var fr = obj(s.frames), own = [];
  (Array.isArray(fr.own) ? fr.own : []).forEach(function(id){
    if(typeof id === 'string' && id && own.indexOf(id) < 0) own.push(id);
  });
  s.frames = Object.assign({}, fr, { own: own, eq: (typeof fr.eq === 'string' && own.indexOf(fr.eq) >= 0) ? fr.eq : '' });
  /* キューブ：最大7個。あふれた分は捨てずに cube の品物としてプレゼントボックスへ（損をさせない） */
  var cubes = DKCORE_cubesNorm(s.cubes), cmax = DKCORE_cubeMax();
  if(cubes.length > cmax){
    cubes.slice(cmax).forEach(function(c){
      var ci = DKCORE_cubeInfo(c.kind);
      DKCORE_mailTo(s, { ic: ci.ic, nm: ci.nm + '（持ちきれなかった分）', item: { kind:'cube', id:ci.kind, n:1 } });
    });
    cubes = cubes.slice(0, cmax);
    fixSave._migrated = true;          /* 郵便を足したので起動時に1回だけ保存する */
  }
  s.cubes = cubes;

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

  /* ── 移行 v2（v10・1回だけ） ──
     ・ルールが v9 の既定（12ターン・20分）のままなら本家の既定（30ターン・25分）へ
     ・クラスの Lv 解放をやめる代わりに、Lv に応じた入場券を SV.tickets へ直接足し、お知らせだけの郵便を1通 */
  if(migrate2){
    if(v9rules){ s.rules.turns = 30; s.rules.timeLimit = 1500; }
    var add = { biz: s.lv >= 2 ? 3 : 0, first: s.lv >= 4 ? 3 : 0, dia: s.lv >= 7 ? 1 : 0 };
    s.tickets.biz += add.biz; s.tickets.first += add.first; s.tickets.dia += add.dia;
    var parts = [];
    if(add.biz) parts.push('ビジネス' + add.biz + '枚');
    if(add.first) parts.push('ファースト' + add.first + '枚');
    if(add.dia) parts.push('ダイヤモンド' + add.dia + '枚');
    if(parts.length) DKCORE_mailTo(s, { ic:'🎫', nm:'入場券をお届けしました（' + parts.join('・') + '）' });
    s.migV2 = DKCORE_migV2();
    fixSave._migrated = true;
  } else {
    s.migV2 = Math.max(num(s.migV2, 0), DKCORE_migV2());
  }
  return s;
}

/* ══════════ 割合・クラス係数（C01・C02） ══════════ */
/* 開始額に対する割合 → 円（倍率・割引は呼ぶ側）。1000万で salary 150万・bail 100万・travel/host 25万・
   stake0/1/2 50万/100万/150万・donate 50万・tourLand 50万・tourToll 40万 */
function dkRate(key){
  var R = { salary:.15, bail:.10, travel:.025, host:.025, stake0:.05, stake1:.10, stake2:.15, donate:.05, tourLand:.05, tourToll:.04 };
  return Math.round(cfg.cash * (R[key] || 0));
}
/* 直書きの絶対額に掛ける係数（1000万で 1、200万で 0.2） */
function dkScale(){ return cfg.cash / 10000000; }

/* ══════════ チーム戦（C03・G01・J43） ══════════
   cfg.team の時だけ。席0,2＝チーム0／席1,3＝チーム1。自分自身は味方 */
function dkAlly(a, b){
  if(a === b) return true;
  if(!cfg.team || !G || !G.players) return false;
  var A = G.players[a], B = G.players[b];
  return !!(A && B && A.team !== undefined && A.team === B.team);
}
function dkTeamOf(pi){
  var p = G && G.players ? G.players[pi] : null;
  if(p && p.team !== undefined) return p.team;
  return cfg.team ? (pi % 2) : pi;
}
/* 盤 g の上で、持ち主 o が pi 本人か味方か */
function DKCORE_allyIn(g, o, pi){
  if(o === pi) return true;
  if(!cfg.team || !(o >= 0) || !(pi >= 0) || !g || !g.players) return false;
  var A = g.players[o], B = g.players[pi];
  return !!(A && B && A.team !== undefined && A.team === B.team);
}
/* 色の3都市（2都市の組もある）がすべて自分か味方のもの（独占は味方の所有を合わせて数える） */
function hasTriple(G, pi, g){
  var s = CITY_SLOTS[g];
  if(!s || !G || !G.tiles) return false;
  for(var k = 0; k < s.length; k++){
    var t = G.tiles[s[k]];
    if(!t || !DKCORE_allyIn(G, t.owner, pi)) return false;
  }
  return true;
}
/* 1辺の都市（観光地も含む）がすべて自分か味方のもの */
function hasLine(G, pi, side){
  if(!G || !G.tiles) return false;
  var any = false;
  for(var k = 1; k < 8; k++){
    var t = G.tiles[side * 8 + k];
    if(!t || t.type !== 'city') continue;
    any = true;
    if(!DKCORE_allyIn(G, t.owner, pi)) return false;
  }
  return any;
}
/* 時間切れ（制限ターン・時間）：個人戦は総資産1位、チーム戦はチームの合計資産 */
function timeUp(){
  if(!G || !G.players || G.over) return false;
  var rk = rank();
  if(cfg.team){
    var sum = {};
    G.players.forEach(function(p, i){
      var t = dkTeamOf(i);
      sum[t] = (sum[t] || 0) + (p.out ? 0 : Math.max(0, assetOf(G, i)));
    });
    var best = null;
    Object.keys(sum).forEach(function(t){ if(best === null || sum[t] > sum[best]) best = t; });
    var tie = Object.keys(sum).filter(function(t){ return sum[t] === sum[best]; });
    if(tie.length > 1) best = String(dkTeamOf(rk[0].i));
    var win = rk.filter(function(r){ return String(dkTeamOf(r.i)) === String(best); })[0];
    return finish(win ? win.i : rk[0].i, 'ターン終了・チームの合計資産');
  }
  return finish(rk[0].i, 'ターン終了・総資産1位');
}
/* 相手チームが全員破産していたら、残ったチームの1位の勝ち（決着は1回だけ） */
function DKCORE_teamBust(){
  if(!cfg.team || !G || !G.players || G.over) return false;
  var alive = {};
  G.players.forEach(function(p, i){ if(!p.out) alive[dkTeamOf(i)] = true; });
  if(Object.keys(alive).length !== 1) return false;
  var rk = rank().filter(function(r){ return !G.players[r.i].out; });
  if(!rk.length) return false;
  return finish(rk[0].i, 'チーム破産勝ち');
}

/* ══════════ サイコロ ══════════ */
/* 本家LEDサイコロの能力値 5/7/9/10/12/14/15/17/19/20 を20で割った比。カタログ値＝Lv10の値 */
function dkDieK(lv){
  var K = [0.25, 0.35, 0.45, 0.5, 0.6, 0.7, 0.75, 0.85, 0.95, 1];
  var i = DKCORE_clamp((lv | 0) || 1, 1, 10) - 1;
  return K[i];
}
function DKCORE_r(x){ return Math.round(x * 10000) / 10000; }
/* DICE のコピーを返す（DICE の中身は書き換えない）。gauge はゲージの精度（ゲージインパクトの誤差・当たり）。
   J42：本家のサイコロの能力にダブルの確率・大きい目の補正は無いので dbl・big は 0。
   Lv10 の極：守（def）は精度 +2 として残す。攻（atk）は dkDieAb の能力の上乗せ ×1.15。
   kw を渡すとその極で計算する（省略時は SV.kiwami） */
function dkDieStats(id, lv, kw){
  var d = dieById(id);
  lv = DKCORE_clamp((lv | 0) || 1, 1, 10);
  var k = dkDieK(lv);
  var o = Object.assign({}, d, {
    gauge: DKCORE_r((d.gauge || 0) * k), dbl: 0, big: 0,
    lv: lv, k: k, kiwami: null });
  if(lv >= 10){
    var w = (kw !== undefined) ? kw : ((typeof SV === 'object' && SV && SV.kiwami) ? SV.kiwami[d.id] : null);
    if(w === 'atk'){ o.kiwami = 'atk'; }
    else if(w === 'def'){ o.gauge = DKCORE_r(o.gauge + 2); o.kiwami = 'def'; }
  }
  return o;
}
/* 装備しているサイコロ。CPU と未所持は DICE[0]。
   人間は p.dieId/p.dieLv（newGame のラッパ／オンラインは WP13 が配る）→ 無ければ SV */
function dieOf(pi){
  var p = G && G.players && G.players[pi];
  if(!p || p.kind === 'cpu') return DICE[0];
  if(p.dieId && DICE.some(function(x){ return x.id === p.dieId; })) return dkDieStats(p.dieId, p.dieLv || 1);
  if(!(SV.dice && SV.dice[SV.die])) return DICE[0];
  return dkDieStats(SV.die, SV.dice[SV.die]);
}
/* ── サイコロの能力（J42・C05）：カードの能力値への上乗せ（青い「+N」）と、ゴールド・RP の％・奇数/偶数の回数 ──
   表の値は [Lv1値, Lv10値]。途中の Lv は dkDieK の曲線で結ぶ（本家の「8 / 30p」「5 / 20%」と同じ比） */
var DKCORE_DIEAB = {
  d0: {},
  d1: { fortune:[5, 20], gauge:[6, 25] },                  /* 黄金のサイコロ：黄金フォーチュン・ゲージインパクト */
  d2: { build:[5, 20], gauge:[5, 20], gold:[5, 20] },      /* LEDサイコロ：建設費用割引・ゲージインパクト・ゴールドボーナス */
  d3: { mini:[8, 30], oddeven:[1, 1] },                    /* トランプサイコロ：ミニゲーム勝利・偶数奇数（回数+1） */
  d4: { buyout:[6, 25], rp:[5, 20] },                      /* 亡者のサイコロ：買収費用割引・RPボーナス */
  d5: { gauge:[6, 22], oddeven:[1, 1] },                   /* 星降りのサイコロ：ゲージインパクト・偶数奇数（回数+1） */
  d6: { buyout:[5, 18], gold:[4, 16], rp:[4, 16] },        /* 商神のサイコロ：買収費用割引・ゴールドボーナス・RPボーナス */
  d7: { build:[6, 22], mini:[6, 22], fortune:[4, 16] }     /* 匠のサイコロ：建設費用割引・ミニゲーム勝利・黄金フォーチュン */
};
function DKCORE_abZero(){ return { mini:0, fortune:0, build:0, gauge:0, buyout:0, gold:0, rp:0, oddeven:0 }; }
/* 能力の名前と単位（画面用）：[[key, 名, 単位]] */
function DKCORE_dieAbNames(){
  return [['mini', 'ミニゲーム勝利', 'p'], ['fortune', '黄金フォーチュン', 'p'], ['build', '建設費用割引', 'p'],
          ['gauge', 'ゲージインパクト', 'p'], ['buyout', '買収費用割引', 'p'], ['gold', 'ゴールドボーナス', '%'],
          ['rp', 'RPボーナス', '%'], ['oddeven', '偶数奇数', '回']];
}
/* サイコロ id の表（{key:[Lv1値, Lv10値]} のコピー）。画面の「Lv1値 / MAX値」に使う */
function DKCORE_dieAbRange(id){
  var T = (typeof DKCORE_DIEAB === 'object' && DKCORE_DIEAB) ? DKCORE_DIEAB[id] : null, o = {};
  Object.keys(T || {}).forEach(function(k){ o[k] = T[k].slice(); });
  return o;
}
/* サイコロ id・Lv・極 → 8項目の値 */
function DKCORE_dieAbAt(id, lv, kw){
  var o = DKCORE_abZero();
  var T = (typeof DKCORE_DIEAB === 'object' && DKCORE_DIEAB) ? DKCORE_DIEAB[id] : null;
  if(!T) return o;
  lv = DKCORE_clamp((lv | 0) || 1, 1, 10);
  var k = dkDieK(lv), t = (k - 0.25) / 0.75;
  var atk = lv >= 10 && kw === 'atk';
  Object.keys(T).forEach(function(key){
    var a = T[key][0], b = T[key][1], v = a + (b - a) * t;
    if(atk && key !== 'oddeven') v *= 1.15;
    o[key] = Math.round(v);
  });
  return o;
}
/* プレイヤー p のサイコロの能力（CPU・未所持はふつうのサイコロ＝すべて0） */
function DKCORE_abOfPlayer(p){
  if(!p || p.kind === 'cpu') return DKCORE_abZero();
  var id = null, lv = 1, kw = null;
  if(p.dieId && DICE.some(function(x){ return x.id === p.dieId; })){
    id = p.dieId; lv = p.dieLv || 1;
    kw = (p.dieKw !== undefined) ? p.dieKw
       : (DKCORE_online() ? null : ((typeof SV === 'object' && SV && SV.kiwami) ? (SV.kiwami[id] || null) : null));
  } else if(!DKCORE_online() && typeof SV === 'object' && SV && SV.dice && SV.dice[SV.die]){
    id = SV.die; lv = SV.dice[SV.die]; kw = (SV.kiwami && SV.kiwami[id]) || null;
  }
  return id ? DKCORE_dieAbAt(id, lv, kw) : DKCORE_abZero();
}
/* C05 dkDieAb(pi)→{mini,fortune,build,gauge,buyout,gold,rp,oddeven}
   gold・rp は勝った時の％（WP15・WP16 が掛ける）、oddeven は奇数/偶数の回数+、残りは能力値の上乗せ */
function dkDieAb(pi){
  var p = G && G.players ? G.players[pi] : null;
  return DKCORE_abOfPlayer(p);
}

/* ══════════ 能力値（J58・C05） ══════════
   基本値：カードの等級の倍率×カタログ値＋Lv×1.15（上限120）。ペンダントは能力値に足さない（本家と同じ）。
   Aクラスの1本目は「孤立地域脱出成功」（escape）で通行料割引は無い（toll 0）。S・S+ は通行料割引（escape 0） */
function cardStats(cardId, lv, slots){
  var c = cardById(cardId); if(!c) return null;
  var mul = (RAR[c.rar] || RAR.A).mul;
  var up = Math.round((Math.max(1, (lv | 0) || 1) - 1) * 1.15);
  var out = {};
  STAT_KEYS.forEach(function(k){
    out[k] = Math.min(120, Math.round((c.st[k] || 0) * mul) + up);
  });
  if(c.rar === 'A'){ out.escape = out.toll; out.toll = 0; }
  else out.escape = 0;
  return out;
}
/* C05 dkStatLabels(cardId)→[[key, 名]] の7本（1本目が等級で変わる） */
function dkStatLabels(cardId){
  var c = cardById(cardId);
  var first = (c && c.rar === 'A') ? ['escape', '孤立地域脱出成功'] : ['toll', '通行料割引'];
  return [first].concat(STAT_LABELS.slice(1).map(function(kl){ return [kl[0], kl[1]]; }));
}
/* C05 dkStatSplit(pi)→[{key, base, plus}]（base＝カードの基本値、plus＝サイコロの上乗せ）。
   pi にカードの id（文字列）を渡すと、対戦の外（カード画面）で SV のサイコロの上乗せを出す */
function dkStatSplit(pi){
  var cid, lv, ab;
  if(typeof pi === 'string'){
    cid = pi;
    lv = (SV.cards && SV.cards[cid] && SV.cards[cid].lv) || 1;
    ab = (SV.dice && SV.dice[SV.die]) ? DKCORE_dieAbAt(SV.die, SV.dice[SV.die], (SV.kiwami && SV.kiwami[SV.die]) || null) : DKCORE_abZero();
  } else {
    var p = G && G.players ? G.players[pi] : null;
    if(!p) return [];
    cid = p.card; lv = p.cardLv || 1; ab = DKCORE_abOfPlayer(p);
  }
  var base = cardStats(cid, lv) || {};
  return dkStatLabels(cid).map(function(kl){
    return { key:kl[0], base:(base[kl[0]] | 0), plus:(ab[kl[0]] | 0) };
  });
}

/* ══════════ ペンダント ══════════ */
/* C06・J38：装着枠はカードの等級で開く（Aクラス 2・S/S+ クラス 4） */
function dkPendSlots(cardId){
  var c = cardById(cardId);
  return (c && c.rar === 'A') ? 2 : 4;
}
function dkPendMul(lv){
  lv = DKCORE_clamp((lv | 0) || 1, 1, 8);
  return Math.round((1 + 0.05 * (lv - 1)) * 100) / 100;
}
/* そのプレイヤーのペンダント lv：p.pendLv[id] → 人間なら SV → CPU は 1。
   オンライン中に p.pendLv が無い時は 1（端末ごとに SV が違うと確率がずれて同期が崩れるため） */
function DKCORE_pendLv(p, id){
  if(p && p.pendLv && p.pendLv[id]) return DKCORE_clamp(p.pendLv[id] | 0, 1, 8);
  if(!p || p.kind === 'cpu') return 1;
  if(DKCORE_online()) return 1;
  var o = SV.pendants && SV.pendants[id];
  return DKCORE_clamp((o && o.lv) | 0 || 1, 1, 8);
}
/* 同じ trg の中で実効確率が最大の1つを返す（本家「同じ系統は高い方だけ発動」）。
   開いている枠（dkPendSlots）より後ろのペンダントは見ない（J38）。
   PENDANTS の実体ではなくコピーを返す。pendFire（9h-board.js）は id で効果を分けるので、
   写しの id は「効果の id」（eff があればそれ・無ければ自分の id）にし、本当の id は pid に残す。
   こうすると、新しいペンダントも名前・絵・等級・確率は自分の物のまま、効果は既存の仕組みで動く */
function pendOf(pi, trg){
  var p = G && G.players && G.players[pi];
  if(!p || !p.pend) return null;
  var n = Math.min(p.pend.length, (typeof p.pendSlots === 'number') ? p.pendSlots : dkPendSlots(p.card));
  var best = null, bp = -1;
  for(var i = 0; i < n; i++){
    var it = p.pend[i];
    if(!it || it.trg !== trg) continue;
    var lv = DKCORE_pendLv(p, it.id);
    var pr = Math.min(0.95, it.p * dkPendMul(lv));
    if(pr > bp){ bp = pr; best = Object.assign({}, it, { p: pr, lv: lv, pid: it.id, id: (it.eff || it.id) }); }
  }
  return best;
}

/* ══════════ キャラの能力（J33・C04） ══════════
   魔力ゲージをやめ、カードの型（kind 0〜10）ごとに決まった時機で確率で自動発動する。CPU も同じ。
   率は Aクラス 20%・Sクラス 27%・S+クラス 35% ＋ p.skillP（外れるたびに +0.02・上限 0.2・発動で 0）。
   when（呼ぶ班）: toll＝払う人・own＝通行料を受け取る持ち主・salary（WP14）／start＝手番の最初・arrive＝止まった時（WP13）／
                  build・buyout（WP11）。発動したら呼ぶ側が x を掛ける（toll・own・salary・build・buyout は金額×x、
                  arrive の steal は target の所持マーブル×x を奪う・jail は target を孤立地域へ）。start は eff で分ける
                  （eye＝このターン出目を選べる・warp＝希望する都市へ移動・double＝次のサイコロがダブル） */
var DKCORE_SKILL = [
  /* 0 通行料を無効化 */ { when:'toll',   eff:'free',     x:0,    ic:'🛡', nm:'通行料免除',        txt:'通行料が免除されます' },
  /* 1 出目を選ぶ     */ { when:'start',  eff:'eye',      x:1,    ic:'🎯', nm:'出目を選ぶ',        txt:'このターンはサイコロの目を選べます' },
  /* 2 好きなマスへ   */ { when:'start',  eff:'warp',     x:1,    ic:'🌀', nm:'好きな都市へ移動',  txt:'希望する都市へ移動できます' },
  /* 3 換金           */ { when:'buyout', eff:'buyCut',   x:0.5,  ic:'💰', nm:'買収費用 50%割引',  txt:'買収費用が50%割引になります' },
  /* 4 相手から奪う   */ { when:'arrive', eff:'steal',    x:0.15, ic:'💸', nm:'マーブル強奪',      txt:'相手の所持マーブルの15%を奪います' },
  /* 5 無料で増築     */ { when:'build',  eff:'buildCut', x:0.5,  ic:'🏗', nm:'建設費用 50%割引',  txt:'建設費用が50%割引になります' },
  /* 6 臨時収入       */ { when:'salary', eff:'salary',   x:1.2,  ic:'💴', nm:'給料 120%',         txt:'スタート地点を通過すると給料の120%を獲得' },
  /* 7 ダブル確定     */ { when:'start',  eff:'double',   x:1,    ic:'✌️', nm:'ダブル確定',        txt:'次のサイコロがダブルになります' },
  /* 8 地価高騰       */ { when:'own',    eff:'tollUp',   x:1.15, ic:'📈', nm:'通行料 15%値上げ',  txt:'所有している地域の通行料が15%値上げ' },
  /* 9 相手を送る     */ { when:'arrive', eff:'jail',     x:1,    ic:'⛓', nm:'{jail}送り',        txt:'相手を{jail}へ送ります' },
  /* 10 宝箱          */ { when:'salary', eff:'chest',    x:1.5,  ic:'🎁', nm:'宝箱',              txt:'宝箱で給料が{x}倍になります' }
];
function DKCORE_skillBase(card){
  var r = card && card.rar;
  return r === 'SS' ? 0.35 : r === 'S' ? 0.27 : 0.20;
}
/* arrive の相手：info.target → 同じマスにいる相手（味方・破産・対象外は除く）→ 止まった都市の持ち主 */
function DKCORE_skillTarget(pi, eff, info){
  var P = G.players, me = P[pi];
  var ok = function(j){
    var q = P[j];
    if(j === pi || !q || q.out || dkAlly(pi, j)) return false;
    if(eff === 'jail' && q.jail > 0) return false;
    if(eff === 'steal' && !(q.cash > 0)) return false;
    return true;
  };
  if(info && typeof info.target === 'number') return ok(info.target) ? info.target : -1;
  for(var k = 1; k < P.length; k++){
    var j = (pi + k) % P.length;
    if(P[j] && P[j].pos === me.pos && ok(j)) return j;
  }
  var t = G.tiles && G.tiles[me.pos];
  if(t && t.type === 'city' && t.owner >= 0 && ok(t.owner)) return t.owner;
  return -1;
}
/* C04 dkSkillRoll(pi, when[, info])→{fired, kind, p, label}＋{when, eff, x, target, icon, name, title, sub}
   ・カードの時機が when と違う時（と arrive で相手がいない時）は判定しない：{fired:false, kind:null, p:0, label:''}
   ・判定した時は kind＝カードの型の番号。title/sub は dkNotify にそのまま渡せる
     （発動「<キャラ名>のスペシャル能力」／外れ「スキル未発動」「2%成長します」） */
function dkSkillRoll(pi, when, info){
  var none = { fired:false, kind:null, p:0, label:'' };
  var p = G && G.players ? G.players[pi] : null;
  if(!p || p.out) return none;
  var card = cardById(p.card);
  var kind = (typeof p.skillKind === 'number') ? p.skillKind : (card && typeof card.kind === 'number' ? card.kind : -1);
  var S = DKCORE_SKILL[kind];
  if(!S || S.when !== when) return none;
  var target = -1;
  if(S.when === 'arrive'){ target = DKCORE_skillTarget(pi, S.eff, info); if(target < 0) return none; }
  var add = (typeof p.skillP === 'number' && isFinite(p.skillP)) ? DKCORE_clamp(p.skillP, 0, 0.2) : 0;
  var pr = Math.round((DKCORE_skillBase(card) + add) * 1000) / 1000;
  var fired = Math.random() < pr;
  var x = S.x;
  if(fired){
    p.skillP = 0;
    if(S.eff === 'chest') x = [1.3, 1.5, 2][(Math.random() * 3) | 0];
  } else {
    p.skillP = Math.min(0.2, Math.round((add + 0.02) * 100) / 100);
  }
  var nm = card ? card.nm : (p.name || '');
  var jail = (G.map && G.map.corners && G.map.corners[1]) || '孤立地域';
  var txt = S.txt.replace('{jail}', jail).replace('{x}', String(x));
  return { fired:fired, kind:kind, p:pr, label:S.nm.replace('{jail}', jail),
           when:when, eff:S.eff, x:x, target:target, icon:S.ic, name:nm,
           title: fired ? nm + 'のスペシャル能力' : 'スキル未発動',
           sub: fired ? txt : '2%成長します' };
}

/* ══════════ 対戦の初期化（C07） ══════════
   newGame のラッパ（下）と WP13 の olNewGame が呼ぶ。carryBySeat[席]＝{oe,sal,dbl,magic}（人間の席だけ）。
   ・人間：p.odd=p.even=(oe? 3＋サイコロの偶数奇数 : 0)＋(ダイス増量週 1)・p.carry・p.forceDouble=dbl?1:0・p.fcard=magic||null
   ・CPU：cfg.ai===2 の時だけ oe を持つ扱い
   ・全員：p.items=[]・skillP=0・auto=false・pay2=0・p.stats＝基本値＋サイコロ・開いている枠だけのペンダント。G.oeShared=true
   ・cfg.team の時 p.team（席0,2＝0／1,3＝1） */
function DKCORE_diceWeek(g){
  if(g && g.ev && g.ev.dice) return true;
  try{ var w = (typeof thisWeek === 'function') ? thisWeek() : null; return !!(w && w.id === 'dice'); }catch(e){ return false; }
}
function dkInitPlayers(g, carryBySeat){
  if(!g || !g.players) return g;
  var cb = Array.isArray(carryBySeat) ? carryBySeat : [];
  var wk = DKCORE_diceWeek(g) ? 1 : 0;
  g.players.forEach(function(p, i){
    if(!p) return;
    var human = p.kind !== 'cpu';
    var c = human ? DKCORE_carryNorm(cb[i]) : {};
    if(!human && cfg.ai === 2) c.oe = true;
    if(cfg.team) p.team = i % 2;
    p.carry = human ? c : null;   /* 持ち込みは人間の席だけ（CPU は null。読む側は p.carry && … で守っている） */
    p.items = [];
    p.skillP = 0; p.auto = false; p.autoWeak = false; p.pay2 = 0;
    p.fcard = (human && c.magic) ? c.magic : null;
    p.forceDouble = c.dbl ? 1 : 0;
    /* ペンダント：開いている枠だけ（人間は枠の位置どおり＝p.slots があれば使う） */
    var n = dkPendSlots(p.card);
    p.pendSlots = n;
    if(human && Array.isArray(p.slots)) p.pend = p.slots.slice(0, n).map(pendById).filter(Boolean);
    else if(Array.isArray(p.pend) && p.pend.length > n) p.pend = p.pend.slice(0, n);
    /* 能力値＝カードの基本値＋サイコロの上乗せ */
    var base = cardStats(p.card, p.cardLv || 1) || p.stats || {};
    var ab = DKCORE_abOfPlayer(p), stats = {};
    Object.keys(base).forEach(function(k){ stats[k] = Math.min(120, (base[k] | 0) + (ab[k] | 0)); });
    p.statsBase = Object.assign({}, base);
    p.stats = stats;
    /* 奇数/偶数：共通の回数（WP13 が振った時に両方減らす） */
    var oe = (c.oe ? 3 + (human ? (ab.oddeven | 0) : 0) : 0) + wk;
    p.odd = oe; p.even = oe;
  });
  g.oeShared = true;
  return g;
}
/* 奇数と偶数は常に同じ回数（片方だけ減った時は少ない方にそろえる＝共通の回数を1回使った） */
function DKCORE_oeSync(pi){
  if(!G || !G.oeShared || !G.players) return;
  var p = G.players[pi];
  if(!p || p.odd === p.even) return;
  var v = Math.max(0, Math.min(p.odd | 0, p.even | 0));
  p.odd = v; p.even = v;
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
/* カードを1枚だけ渡す（おまけの抽選なし）。重複は dup+1 → {id, fresh, dup} */
function DKCORE_giveCard(id){
  var had = !!SV.cards[id];
  if(had){ var o = SV.cards[id]; o.dup = ((o.dup | 0) || 0) + 1; }
  else SV.cards[id] = { lv:1, dup:0, exp:0 };
  return { id:id, fresh:!had, dup:SV.cards[id].dup };
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
  out.card = DKCORE_giveCard(c.id);
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
/* 表 list（CARDPOOL・PENDANTS）から、キューブ kind の等級の割合（DKCORE_cubeRar）で1つ選ぶ。
   what＝'card'|'pend'。その等級が1つも無い時は、その等級を抜いて選び直す */
function DKCORE_pick(list, kind, what){
  var rows = DKCORE_cubeRar(kind, what), tot = 0, i;
  var have = rows.filter(function(r){
    r.pool = list.filter(function(x){ return dkNormRar(x.rar) === r.rar; });
    return r.pool.length > 0;
  });
  if(!have.length) return null;
  have.forEach(function(r){ tot += r.w; });
  if(!tot) tot = have.length;
  var roll = Math.random() * tot, row = have[have.length - 1];
  for(i = 0; i < have.length; i++){ roll -= have[i].w; if(roll < 0){ row = have[i]; break; } }
  return row.pool[(Math.random() * row.pool.length) | 0];
}

/* ══════════ キューブ（C21・J40） ══════════ */
/* キューブを1つ渡す。7個持っていたら、一番古い箱を開けて中身を渡してから入れる（損をさせない）
   → {id, kind, opened:null|dkOpenCube の戻り値} */
function dkGiveCube(kind){
  if(DKCORE_cubeKinds().indexOf(kind) < 0) kind = 'wood';
  if(!Array.isArray(SV.cubes)) SV.cubes = [];
  var opened = null;
  while(SV.cubes.length >= DKCORE_cubeMax()) opened = DKCORE_openAt(0);
  var c = { id:DKCORE_uid('q'), kind:kind, at:Date.now() };
  SV.cubes.push(c);
  saveNow();
  return { id:c.id, kind:kind, opened:opened };
}
/* キューブを開ける（待ち時間・クローバーなし）。提供割合は DKCORE_cubeRows
   → {kind, card:null|{id,fresh,dup}, pend:null|{id,dup,fresh}, die:null, gold, gem}（grant と同じ形＋kind・gem） */
function dkOpenCube(id){
  if(!Array.isArray(SV.cubes)) SV.cubes = [];
  for(var i = 0; i < SV.cubes.length; i++) if(SV.cubes[i] && SV.cubes[i].id === id) return DKCORE_openAt(i);
  return { kind:null, card:null, pend:null, die:null, gold:0, gem:0 };
}
/* 並びの i 番目の箱を開ける（id が壊れた箱でも必ず1つ減る＝あふれた時に止まらない） */
function DKCORE_openAt(at){
  var out = { kind:null, card:null, pend:null, die:null, gold:0, gem:0 };
  if(!Array.isArray(SV.cubes) || at < 0 || at >= SV.cubes.length) return out;
  var cube = SV.cubes.splice(at, 1)[0] || {};
  out.kind = DKCORE_cubeInfo(cube.kind).kind;
  var rows = DKCORE_cubeRows(out.kind), tot = 0;
  rows.forEach(function(r){ tot += r.w; });
  var roll = Math.random() * tot, row = rows[rows.length - 1];
  for(var k = 0; k < rows.length; k++){ roll -= rows[k].w; if(roll < 0){ row = rows[k]; break; } }
  if(row.k === 'card'){
    var cd = DKCORE_pick(CARDPOOL, out.kind, 'card');
    if(cd) out.card = DKCORE_giveCard(cd.id);
    else row = { k:'gold', lo:1000, hi:1000 };
  } else if(row.k === 'pend'){
    var pd = DKCORE_pick(PENDANTS, out.kind, 'pend');
    if(pd) out.pend = dkGivePend(pd.id);
    else row = { k:'gold', lo:1000, hi:1000 };
  }
  if(row.k === 'gold'){
    var g = Math.round((row.lo + Math.random() * (row.hi - row.lo)) / 100) * 100;
    SV.gold += g; out.gold = g;
  } else if(row.k === 'gem'){
    SV.gem += row.n; out.gem = row.n;
  }
  saveNow();
  return out;
}

/* ══════════ 品物（C21・C22・C24） ══════════
   dkGrantItem({kind, id, n}) を SV の正しい所へ。kind＝card pend die key ticket cube frame（＋gold gem）。
   できたら {ok:true, kind, id, n, nm}、できない物なら false。プレゼントボックスの受け取り（WP16）とミッション・報酬が使う */
function dkGrantItem(it){
  it = DKCORE_obj(it);
  var kind = String(it.kind || ''), id = (it.id === undefined || it.id === null) ? '' : String(it.id);
  var n = Math.max(1, DKCORE_num(it.n, 1) || 1), cnt = Math.min(99, n);
  var ok = false, nm = '', k;
  if(kind === 'card' && cardById(id)){
    for(k = 0; k < cnt; k++) DKCORE_giveCard(id);
    ok = true; nm = cardById(id).nm;
  } else if(kind === 'pend' && pendById(id)){
    for(k = 0; k < cnt; k++) dkGivePend(id);
    ok = true; nm = pendById(id).nm;
  } else if(kind === 'die' && DICE.some(function(x){ return x.id === id; })){
    SV.dice[id] = Math.max(1, SV.dice[id] || 0);
    ok = true; nm = dieById(id).nm;
  } else if(kind === 'key'){
    SV.keys = (SV.keys | 0) + cnt; ok = true; nm = 'ゴールドキー';
  } else if(kind === 'ticket' && ['biz', 'first', 'dia'].indexOf(id) >= 0){
    if(!SV.tickets || typeof SV.tickets !== 'object') SV.tickets = { biz:0, first:0, dia:0 };
    SV.tickets[id] = (SV.tickets[id] | 0) + cnt; ok = true; nm = DKCORE_ticketName(id);
  } else if(kind === 'cube'){
    var ck = DKCORE_cubeInfo(id).kind;
    for(k = 0; k < cnt; k++) dkGiveCube(ck);
    ok = true; nm = DKCORE_cubeInfo(ck).nm; id = ck;
  } else if(kind === 'frame' && id){
    if(!SV.frames || typeof SV.frames !== 'object') SV.frames = { own:[], eq:'' };
    if(!Array.isArray(SV.frames.own)) SV.frames.own = [];
    if(SV.frames.own.indexOf(id) < 0) SV.frames.own.push(id);
    ok = true; nm = '名札の枠';
  } else if(kind === 'gold'){
    SV.gold += n; ok = true; nm = 'ゴールド';
  } else if(kind === 'gem'){
    SV.gem += n; ok = true; nm = 'ダイヤ';
  }
  if(!ok) return false;
  saveNow();
  return { ok:true, kind:kind, id:id, n:n, nm:nm };
}

/* ══════════ 本日のマップ（C23）・名札の枠（C24） ══════════ */
/* 日本時間の朝5時で切り替わる（週の区切りと同じ5時）。t を渡すとその時刻で */
function dkTodayMap(t){
  var now = (typeof t === 'number') ? t : Date.now();
  var day = Math.floor((now + 4 * 3600000) / 86400000);        /* UTC+9 − 5時間 */
  var L = MAPS.length || 1;
  return MAPS[((day % L) + L) % L].id;
}
/* 名札の枠：p.frame（オンラインは配られた値）→ この端末の人間は SV.frames.eq → '' */
function dkFrameOf(pi){
  var p = G && G.players ? G.players[pi] : null;
  if(!p) return '';
  if(typeof p.frame === 'string') return p.frame;
  if(p.kind === 'cpu' || DKCORE_online()) return '';
  return (SV.frames && typeof SV.frames.eq === 'string') ? SV.frames.eq : '';
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
/* 郵便を1通送る。item = {ic, nm, g, d, item:{kind,id,n}|null, exp?} → 作った郵便を返す */
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
/* C33：週が進んだら、前の週（SV.wk・rp を含む）を SV.wkPrev に残して dkEmit('week:roll',{prev,key}) を1回。
   週の番号が戻った時（時計・オンラインの host の週）は今の週のまま（行ったり来たりしない） */
function DKCORE_week(){
  var k = weekIndex();
  var w = SV.wk;
  var had = !!(w && typeof w.key === 'number' && isFinite(w.key));
  if(had && w.key >= k) return w;
  var prev = (had && w.key >= 0) ? Object.assign({}, w) : null;
  SV.wk = DKCORE_counts(); SV.wk.key = k;
  if(prev){
    SV.wkPrev = prev;
    try{ saveNow(); }catch(e){}
    dkEmit('week:roll', { prev:prev, key:k });
  }
  return SV.wk;
}

/* ══════════ newGame のラッパ：人間の p.pendLv / p.dieId / p.dieLv と、対戦の初期化（C07） ══════════ */
var DKCORE_newGame0 = (typeof newGame === 'function') ? newGame : null;
if(DKCORE_newGame0){
  newGame = function(){
    var r = DKCORE_newGame0.apply(this, arguments);
    try{
      if(G && G.players){
        var carry = DKCORE_carryNorm(SV.carry), had = Object.keys(DKCORE_obj(SV.carry)).length > 0;
        var cb = [], given = false;
        G.players.forEach(function(p, i){
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
          if(p.dieKw === undefined) p.dieKw = (p.dieId && SV.kiwami && SV.kiwami[p.dieId]) || null;
          if(!Array.isArray(p.slots)) p.slots = (Array.isArray(SV.slots) ? SV.slots : []).slice(0, 4);
          if(p.frame === undefined) p.frame = (SV.frames && typeof SV.frames.eq === 'string') ? SV.frames.eq : '';
          if(!given){ cb[i] = carry; given = true; }          /* 持ち込みは この端末の1人目の人間だけ */
        });
        dkInitPlayers(G, cb);
        SV.carry = {};
        if(had) saveNow();
      }
    }catch(e){ console.error('[WP12a]', e); }
    return r;
  };
}

/* ══════════ doRoll のラッパ：奇数/偶数を共通の回数にそろえる（G.oeShared の時だけ） ══════════
   振る直前（奇数/偶数を減らしたあと）に呼ばれるので、片方だけ減らす古い処理でも「共通の回数を1回使った」になる。
   両方減らす処理（WP13）の時は何もしない */
var DKCORE_doRoll0 = (typeof doRoll === 'function') ? doRoll : null;
if(DKCORE_doRoll0){
  doRoll = function(pi){
    try{ DKCORE_oeSync(pi); }catch(e){ console.error('[WP12a]', e); }
    return DKCORE_doRoll0.apply(this, arguments);
  };
}

/* ══════════ bankrupt・checkWin のラッパ：チーム戦は「相手チーム全員の破産」で決着 ══════════ */
var DKCORE_bankrupt0 = (typeof bankrupt === 'function') ? bankrupt : null;
if(DKCORE_bankrupt0){
  bankrupt = function(pi, toPi){
    var r = DKCORE_bankrupt0.apply(this, arguments);
    return Promise.resolve(r).then(function(v){
      try{ DKCORE_teamBust(); }catch(e){ console.error('[WP12a]', e); }
      return v;
    });
  };
}
var DKCORE_checkWin0 = (typeof checkWin === 'function') ? checkWin : null;
if(DKCORE_checkWin0){
  checkWin = function(){
    try{ if(DKCORE_teamBust()) return true; }catch(e){ console.error('[WP12a]', e); }
    return DKCORE_checkWin0.apply(this, arguments);
  };
}

/* ══════════ 社長専用リンク（?boss=kimochi） ══════════
   このリンクで開いた時だけ、初回に1度だけゴールド 9,999,999・ダイヤ 9,999 を入れ、SV.vip=1 で覚える
   （2回目からは足さない）。ふつうのリンクには何も起きない。仕掛けはこのファイルの中だけで完結する。 */
function DKCORE_bossLink(){
  try{
    var q = (typeof location === 'object' && location) ? String(location.search || '') : '';
    if(!q) return false;
    var a = q.replace(/^\?/, '').split('&');
    for(var i = 0; i < a.length; i++){
      var kv = a[i].split('=');
      if(decodeURIComponent(kv[0] || '') === 'boss' && decodeURIComponent(kv[1] || '') === 'kimochi') return true;
    }
  }catch(e){}
  return false;
}
function DKCORE_bossGift(){
  if(!(typeof SV === 'object' && SV) || SV.vip) return false;
  if(!DKCORE_bossLink()) return false;
  SV.vip = 1;
  SV.gold = Math.max((+SV.gold || 0), 9999999);
  SV.gem  = Math.max((+SV.gem  || 0), 9999);
  saveNow();
  try{ dkMail({ ic:'👑', nm:'VIP のお迎え（ゴールド 9,999,999・ダイヤ 9,999）' }); }catch(e){}
  try{ dkWallet(); }catch(e){}
  return true;
}
/* ホームの名札の横の小さな「VIP」（ホームの画面は WP16b。ここは印を1つ足すだけ）。
   二重に足さない・見つからなければ何もしない */
function DKCORE_vipMark(el){
  if(!(typeof SV === 'object' && SV) || !SV.vip) return;
  var root = (el && el.querySelector) ? el : (typeof document === 'object' ? document.getElementById('home') : null);
  if(!root || !root.querySelector || root.querySelector('.dkcore-vip')) return;
  var nm = root.querySelector('.dkh-pnm');
  if(!nm || !nm.parentNode) return;
  var b = document.createElement('span');
  b.className = 'dkcore-vip';
  b.textContent = 'VIP';
  b.title = '社長専用リンクの特典（ゴールドとダイヤが最初から満タン）';
  b.setAttribute('style', 'flex:0 0 auto;margin-left:6px;padding:0 7px;border-radius:7px;font-size:16px;font-weight:900;'
    + 'line-height:1.3;color:#4A2E02;background:linear-gradient(180deg,#FFF3C4,#F5CC4E 55%,#D99C12);'
    + 'border:1px solid rgba(74,46,2,.55);box-shadow:0 1px 0 rgba(255,255,255,.7) inset;letter-spacing:.03em;white-space:nowrap');
  nm.parentNode.insertBefore(b, nm.nextSibling);
}
/* showHome のラッパ（宣言し直しではないので所有表に触らない） */
var DKCORE_showHome0 = (typeof showHome === 'function') ? showHome : null;
if(DKCORE_showHome0){
  showHome = function(){
    var r = DKCORE_showHome0.apply(this, arguments);
    try{ DKCORE_vipMark(r); }catch(e){ console.error('[WP12a]', e); }
    return r;
  };
}

/* ══════════ 起動時 ══════════ */
(function(){
  try{
    var raw = null;
    try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){ raw = null; }
    /* はじめて遊ぶ人（保存が無い）は、最初から今の版。移行もお詫びも要らない */
    if(raw === null && SV){
      if(!(SV.migV >= DKCORE_migV())) SV.migV = DKCORE_migV();
      if(!(SV.migV2 >= DKCORE_migV2())) SV.migV2 = DKCORE_migV2();
    }
    /* 読み込み時に移行・あふれたキューブの郵便があったら、ここで1回だけ保存する（二重に郵便が届かないように） */
    if(fixSave._migrated){ fixSave._migrated = false; saveNow(); }
    /* J12：対戦の既定（30ターン・25分）をセーブのルールから */
    if(SV && SV.rules && typeof cfg === 'object' && cfg){
      if(SV.rules.turns > 0) cfg.turns = SV.rules.turns;
      if(SV.rules.timeLimit >= 0) cfg.timeLimit = SV.rules.timeLimit;
    }
  }catch(e){ console.error('[WP12a]', e); }
  /* 週替わり（'week:roll'）は、後ろのファイルの受け手がそろってから1回見る */
  setTimeout(function(){
    try{ if(typeof SV === 'object' && SV) DKCORE_week(); }catch(e){ console.error('[WP12a]', e); }
    try{ DKCORE_bossGift(); }catch(e){ console.error('[WP12a]', e); }
  }, 0);
})();
