
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — メタ（ホーム／カード／ガチャ／ペンダント／VS）
   セーブはこのブラウザの localStorage に保存される
   ══════════════════════════════════════════════════════════════ */
const SAVE_KEY = 'dv_save_v1';
const RAR = {
  A : {nm:'A',  cls:'rA',  mul:1.00, w:68, gold: 60},
  S : {nm:'S',  cls:'rS',  mul:1.15, w:26, gold:180},
  SS: {nm:'S+', cls:'rSS', mul:1.32, w: 6, gold:600}
};

/* ── カード図鑑（24人。art は画像が無いときの下絵、kind が能力の型） ───────
   kind: 0=通行料を無効化 1=出目を選ぶ 2=好きなマスへ移動 3=総資産の一部を現金化
         4=相手から奪う 5=無料で増築 6=臨時収入 7=ゾロ目確定 8=地価高騰
         9=相手を監獄へ 10=宝箱                                              */
const CARDPOOL = [
  {id:'c01', art:3, kind:8, col:'#E0452A', nm:'業火のカイン', role:'炎の賭博師', rar:'SS',
   line:'燃えないものは、賭けに値しない。',
   st:{toll:92,mini:64,special:58,fortune:72,build:70,gauge:88,buyout:66},
   sk:{nm:'獄炎の地脈', ds:'自分の街ぜんぶの通行料が2ターン1.6倍になる', uses:2}},
  {id:'c02', art:0, kind:0, col:'#9FD8F0', nm:'氷華のリーゼ', role:'氷の姫', rar:'S',
   line:'凍れば、痛みも止まります。',
   st:{toll:74,mini:58,special:66,fortune:62,build:68,gauge:70,buyout:60},
   sk:{nm:'氷結の加護', ds:'次に払う通行料が0になる', uses:3}},
  {id:'c03', art:7, kind:4, col:'#F2C230', nm:'雷拳のゴウ', role:'雷の闘士', rar:'S',
   line:'奪う。理由はそれだけだ。',
   st:{toll:68,mini:86,special:52,fortune:54,build:62,gauge:78,buyout:58},
   sk:{nm:'雷鳴の徴収', ds:'相手全員から所持金の16%を奪う', uses:2}},
  {id:'c04', art:6, kind:1, col:'#8F6BC8', nm:'星詠みのセレナ', role:'星の魔女', rar:'SS',
   line:'その目は、もう見えています。',
   st:{toll:66,mini:72,special:78,fortune:94,build:64,gauge:96,buyout:70},
   sk:{nm:'星辰の導き', ds:'次のサイコロの出目を自分で選べる', uses:3}},
  {id:'c05', art:4, kind:9, col:'#5FA38C', nm:'無風のソウマ', role:'剣の老師', rar:'S',
   line:'動くな。斬る。',
   st:{toll:80,mini:60,special:56,fortune:50,build:58,gauge:82,buyout:64},
   sk:{nm:'一閃の威', ds:'一番資産のある相手を監獄へ送る', uses:2}},
  {id:'c06', art:5, kind:5, col:'#E86AA0', nm:'発明家ミリィ', role:'機械技師', rar:'A',
   line:'こわれたら、直せばいいの！',
   st:{toll:52,mini:68,special:62,fortune:58,build:74,gauge:60,buyout:54},
   sk:{nm:'突貫工事', ds:'自分の街をひとつ、ただで一段そだてる', uses:2}},
  {id:'c07', art:1, kind:7, col:'#3E8FE0', nm:'勝負師レイ', role:'賭博王', rar:'S',
   line:'ゾロ目？　出すものだよ。',
   st:{toll:60,mini:74,special:60,fortune:82,build:56,gauge:90,buyout:62},
   sk:{nm:'双六の理', ds:'次のサイコロが必ずゾロ目になる（もう一回振れる）', uses:3}},
  {id:'c08', art:2, kind:10, col:'#C0392B', nm:'怪盗ノワール', role:'宝石泥棒', rar:'S',
   line:'いただくわ。あとで返すかは、気分。',
   st:{toll:64,mini:80,special:70,fortune:76,build:54,gauge:72,buyout:86},
   sk:{nm:'夜想の手', ds:'宝箱をひらく。金額は運しだい（最大2.6倍）', uses:3}},
  {id:'c09', art:7, kind:5, col:'#5E8A3C', nm:'大地のガルド', role:'岩の守人', rar:'A',
   line:'動かぬものが、いちばん強い。',
   st:{toll:70,mini:52,special:54,fortune:46,build:76,gauge:50,buyout:58},
   sk:{nm:'岩盤工事', ds:'自分の街をひとつ、ただで一段そだてる', uses:2}},
  {id:'c10', art:5, kind:0, col:'#F0E0A8', nm:'聖女アルテア', role:'光の導き手', rar:'SS',
   line:'あなたの負債、わたしが背負います。',
   st:{toll:78,mini:66,special:88,fortune:86,build:72,gauge:68,buyout:82},
   sk:{nm:'聖域の盾', ds:'次に払う通行料が0になる（相手の街も凍る）', uses:3}},
  {id:'c11', art:4, kind:2, col:'#6BB2D2', nm:'疾風のシン', role:'影の刺客', rar:'S',
   line:'間合いは、こちらが決める。',
   st:{toll:66,mini:78,special:58,fortune:60,build:54,gauge:92,buyout:66},
   sk:{nm:'影渡り', ds:'好きなマスへ移動する', uses:3}},
  {id:'c12', art:2, kind:6, col:'#4FA86A', nm:'森詠みのフィナ', role:'森の射手', rar:'A',
   line:'風がぜんぶ教えてくれる。',
   st:{toll:56,mini:70,special:64,fortune:68,build:52,gauge:66,buyout:50},
   sk:{nm:'森の恵み', ds:'その場で給料を受け取り、次の給料も2倍になる', uses:2}},
  {id:'c13', art:1, kind:4, col:'#C98A3A', nm:'海賊王バルド', role:'海の商人', rar:'S',
   line:'海の上では、おれが法だ。',
   st:{toll:76,mini:72,special:56,fortune:64,build:60,gauge:70,buyout:88},
   sk:{nm:'略奪の宴', ds:'相手全員から所持金の16%を奪う', uses:2}},
  {id:'c14', art:3, kind:8, col:'#E0405A', nm:'紅竜のヴェル', role:'竜の姫', rar:'SS',
   line:'地価も、わたしが決めるの。',
   st:{toll:96,mini:62,special:60,fortune:58,build:80,gauge:74,buyout:68},
   sk:{nm:'竜脈の高騰', ds:'自分の街ぜんぶの通行料が2ターン1.6倍になる', uses:2}},
  {id:'c15', art:6, kind:1, col:'#B8C0D8', nm:'時計師クロノ', role:'時の管理人', rar:'S',
   line:'一手だけ、巻き戻します。',
   st:{toll:58,mini:64,special:84,fortune:78,build:66,gauge:88,buyout:72},
   sk:{nm:'秒針の停止', ds:'次のサイコロの出目を自分で選べる', uses:3}},
  {id:'c16', art:5, kind:10, col:'#C08AD0', nm:'砂漠のシャハラ', role:'踊る占い師', rar:'S',
   line:'砂は、いつも正直よ。',
   st:{toll:62,mini:82,special:72,fortune:88,build:58,gauge:76,buyout:64},
   sk:{nm:'黄金の砂', ds:'宝箱をひらく。金額は運しだい（最大2.6倍）', uses:3}},
  {id:'c17', art:7, kind:9, col:'#E0762A', nm:'熱血のレン', role:'拳闘士', rar:'A',
   line:'正面から行く。それだけだ。',
   st:{toll:66,mini:74,special:48,fortune:52,build:56,gauge:64,buyout:54},
   sk:{nm:'渾身の一撃', ds:'一番資産のある相手を監獄へ送る', uses:2}},
  {id:'c18', art:0, kind:3, col:'#3EA8E0', nm:'海淵のマリナ', role:'海の女王', rar:'S',
   line:'潮が満ちれば、すべて私のもの。',
   st:{toll:72,mini:60,special:80,fortune:70,build:68,gauge:62,buyout:76},
   sk:{nm:'満ち潮', ds:'総資産の14%を現金で受け取る', uses:2}},
  {id:'c19', art:4, kind:4, col:'#8A3A6A', nm:'夜宴のヴィクター', role:'夜の貴族', rar:'SS',
   line:'いただくのは、血ではなく利子です。',
   st:{toll:88,mini:58,special:74,fortune:80,build:62,gauge:72,buyout:94},
   sk:{nm:'血税の宴', ds:'相手全員から所持金の19%を奪う', uses:2}},
  {id:'c20', art:6, kind:2, col:'#C8CCE8', nm:'月読のルナ', role:'月の巫女', rar:'S',
   line:'月の道を、お通しします。',
   st:{toll:60,mini:66,special:76,fortune:84,build:54,gauge:70,buyout:60},
   sk:{nm:'月の径', ds:'好きなマスへ移動する', uses:3}},
  {id:'c21', art:7, kind:3, col:'#C9A03A', nm:'大商人ドン・バロ', role:'金の亡者', rar:'S',
   line:'ぜんぶ、値段がついてますよ。',
   st:{toll:70,mini:54,special:86,fortune:72,build:78,gauge:52,buyout:90},
   sk:{nm:'資産の換金', ds:'総資産の14%を現金で受け取る', uses:2}},
  {id:'c22', art:5, kind:5, col:'#D8A030', nm:'整備士ハナ', role:'鉄の職人', rar:'A',
   line:'一晩で建てちゃうよ。',
   st:{toll:54,mini:66,special:60,fortune:56,build:80,gauge:58,buyout:52},
   sk:{nm:'突貫の腕', ds:'自分の街をひとつ、ただで一段そだてる', uses:2}},
  {id:'c23', art:6, kind:0, col:'#9A7FE0', nm:'結晶王アメジスト', role:'結晶の支配者', rar:'SS',
   line:'砕けぬものに、税は届かぬ。',
   st:{toll:90,mini:60,special:92,fortune:74,build:84,gauge:66,buyout:78},
   sk:{nm:'結晶の壁', ds:'次に払う通行料が0になる（相手の街も凍る）', uses:3}},
  {id:'c24', art:2, kind:6, col:'#E06A4A', nm:'空賊のエル', role:'空の旅人', rar:'A',
   line:'下を見てる暇はないよ！',
   st:{toll:58,mini:72,special:58,fortune:66,build:50,gauge:74,buyout:56},
   sk:{nm:'追い風', ds:'その場で給料を受け取り、次の給料も2倍になる', uses:2}}
];
const cardById = id => CARDPOOL.find(c=>c.id===id);

/* ── ペンダント（装備すると盤面のルールが変わる） ──────────────
   本家と同じく「一定の確率で発動して、その場の決まりを書き換える」装備。
   trg = いつ判定するか / p = 発動確率 / rar = 等級
   ────────────────────────────────────────────────── */
const PENDANTS = [
  {id:'p1', nm:'稲妻放電器',       ic:'⚡', rar:'SS', trg:'onLandmark', p:0.85,
   ds:'ランドマークを建てたとき、同じ辺にいる相手を自分のマスへ引き寄せる'},
  {id:'p2', nm:'シュプリューデル', ic:'💧', rar:'SS', trg:'onTollGet',  p:0.60,
   ds:'相手が自分のランドマークに止まったとき束縛し、次の移動でもう一度通行料を取る'},
  {id:'p3', nm:'概要設計図面',     ic:'📐', rar:'S',  trg:'onBuild',    p:0.50,
   ds:'建設したとき、自分の別の街の建物がもう1段上がる'},
  {id:'p4', nm:'大家の建物基礎',   ic:'🧱', rar:'S',  trg:'onBuild',    p:0.31,
   ds:'建物を3棟以上持っているとき、スタートへ移動して給料を受け取る'},
  {id:'p5', nm:'黄金フリーパス',   ic:'🎫', rar:'S',  trg:'onTravel',   p:0.30,
   ds:'ワープのマスで、選ばずに一番得なマスへ即座に移動する'},
  {id:'p6', nm:'幸運のトランポリン',ic:'🤸', rar:'A',  trg:'onOwnLand',  p:0.38,
   ds:'自分の街に止まったとき、同じ辺の自分の別の街へ跳ぶ'},
  {id:'p7', nm:'催眠の香水',       ic:'🧴', rar:'A',  trg:'onSameTile', p:0.45,
   ds:'相手と同じマスに止まったとき、相手の所持金の20%を奪う'},
  {id:'p8', nm:'栄光の光',         ic:'✨', rar:'A',  trg:'onRoll',     p:0.37,
   ds:'サイコロを振るとき、ゾロ目が出る'}
];
const PEND_RAR = { A:{nm:'A', c:'#8FB2D8'}, S:{nm:'S', c:'#D8B6F0'}, SS:{nm:'S+', c:'#F2C230'} };
const pendById = id => PENDANTS.find(p=>p.id===id);

/* ── セーブ ─────────────────────────────────────────── */
function defaultSave(){
  return { gold: 3000, gem: 5, lv: 1, exp: 0, plays: 0, wins: 0,
    dailyAt: '', dailyN: 0, qdone: {}, freeAt: 0,
    cards: { c01:{lv:1,dup:0}, c02:{lv:1,dup:0} },
    pendants: { p3:{} },
    equip: 'c01', slots: ['p3', null, null, null],
    die: 'd0', dice: { d0:1 }, bag: [],
    locks: {},
    seen: [] };
}
let SV = defaultSave();
function loadSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw){ const o = JSON.parse(raw); if(o && o.cards) SV = Object.assign(defaultSave(), o); }
  }catch(e){}
}
function saveNow(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(SV)); }catch(e){} }
loadSave();

/* ── ステータス計算 ─────────────────────────────────── */
const STAT_KEYS = ['toll','mini','special','fortune','build','gauge','buyout'];
function cardStats(cardId, lv, slots){
  const c = cardById(cardId); if(!c) return null;
  const mul = RAR[c.rar].mul;
  const out = {};
  STAT_KEYS.forEach(k=>{
    let v = Math.round(c.st[k]*mul) + Math.round((lv-1)*1.15);
    out[k] = Math.min(120, v);
  });
  // ペンダントはステータスを盛らない。代わりに盤面のルールを書き換える（pendFire）。
  // 等級ぶんのごく小さな底上げだけ残す（S+ で +6）。
  (slots||[]).forEach(pid=>{
    const p = pendById(pid); if(!p) return;
    const up = p.rar==='SS' ? 6 : p.rar==='S' ? 4 : 2;
    STAT_KEYS.forEach(k=> out[k] = Math.min(120, out[k]+up));
  });
  return out;
}
function ownedCards(){ return CARDPOOL.filter(c=>SV.cards[c.id]); }
function equippedCard(){ return cardById(SV.equip) || CARDPOOL[0]; }
function myStats(){ return cardStats(SV.equip, (SV.cards[SV.equip]||{lv:1}).lv, SV.slots); }
function playerLvNeed(lv){ return 60 + lv*40; }

/* ── 画面を作る ─────────────────────────────────────── */
function mkScreen(id, innerHTML){
  let el = document.getElementById(id);
  if(!el){ el = document.createElement('div'); el.id=id; $('#stage').appendChild(el); }
  el.className = 'screen meta' + (el.classList.contains('on') ? ' on' : '');
  el.innerHTML = innerHTML;
  return el;
}
/* 左右の縦アイコンレール（本家は画面の外周を額縁として全部使う） */
const META_TABS = [
  {id:'play',  ic:'🎲', nm:'対戦',       go:()=>screenTo('setup')},
  {id:'home',  ic:'🏠', nm:'ホーム',     go:()=>showHome()},
  {id:'cards', ic:'🎴', nm:'カード',     go:()=>showCards()},
  {id:'gacha', ic:'✨', nm:'ガチャ',     go:()=>showGacha()},
  {id:'pend',  ic:'📿', nm:'ペンダント', go:()=>showPend()}
];
const SIDE_TABS = [
  {id:'daily',  ic:'📅', nm:'出席簿',   go:()=>showDaily()},
  {id:'quest',  ic:'🎯', nm:'ミッション', go:()=>showQuest()},
  {id:'news',   ic:'📣', nm:'お知らせ', go:()=>showNews()},
  {id:'title',  ic:'⏏️', nm:'タイトル', go:()=>screenTo('title')}
];
function railHTML(active){
  const badge = t =>
    (t.id==='daily' && canDaily()) ? '<span class="n">!</span>' :
    (t.id==='quest' && questReady()) ? '<span class="n">!</span>' : '';
  return '<div class="rail left">'
    + META_TABS.map(t=>'<div class="rb'+(t.id===active?' on':'')+'" data-tab="'+t.id+'">'
        + '<span class="ic">'+t.ic+'</span><span class="tx">'+t.nm+'</span></div>').join('')
    + '</div>'
    + '<div class="rail right">'
    + SIDE_TABS.map(t=>'<div class="rb" data-tab="'+t.id+'">'
        + '<span class="ic">'+t.ic+'</span><span class="tx">'+t.nm+'</span>'+badge(t)+'</div>').join('')
    + '</div>';
}
function tabsHTML(active){ return railHTML(active); }
function wireTabs(root){
  root.querySelectorAll('[data-tab]').forEach(el=>{
    el.onclick = ()=>{
      SFX.click();
      const id = el.dataset.tab;
      const t = META_TABS.find(x=>x.id===id) || SIDE_TABS.find(x=>x.id===id);
      if(t) t.go();
    };
  });
}

/* ── 出席簿（1日1回のログインボーナス） ─────────────── */
function todayKey(){ const d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function canDaily(){ return SV.dailyAt !== todayKey(); }
const DAILY = [
  {ic:'🪙', nm:'ゴールド', v:1200}, {ic:'🪙', nm:'ゴールド', v:1600},
  {ic:'💎', nm:'ダイヤ',   v:3},    {ic:'🪙', nm:'ゴールド', v:2400},
  {ic:'📿', nm:'ペンダント', v:1},  {ic:'🪙', nm:'ゴールド', v:3200},
  {ic:'✨', nm:'ガチャ1回', v:1}
];
function showDaily(){
  const day = (SV.dailyN || 0) % 7;
  const el = mkScreen('daily',
    railHTML('')
    + '<div class="inner"><div class="metahd"><h2>出席簿</h2>'
    + '<span class="note">1日1回、受け取れます。7日そろうと最初に戻ります。</span></div>'
    + '<div class="dgrid">'
    + DAILY.map((d,i)=>'<div class="dcell'+(i<day?' got':'')+(i===day&&canDaily()?' now':'')+'">'
        + '<div class="dd">'+(i+1)+'日目</div><div class="di">'+d.ic+'</div>'
        + '<div class="dn">'+d.nm+' ×'+d.v+'</div>'
        + (i<day?'<div class="dchk">受取済</div>':'')+'</div>').join('')
    + '</div>'
    + '<div style="text-align:center;margin-top:18px">'
    + '<button class="btn gold" id="dGet" style="font-size:22px;padding:13px 44px"'
    +   (canDaily()?'':' disabled')+'>'+(canDaily()?'今日のぶんを受け取る':'今日はもう受け取りました')+'</button>'
    + '</div></div>' + walletHTML());
  wireTabs(el);
  const b = $('#dGet');
  if(b) b.onclick = async ()=>{
    if(!canDaily()) return;
    const d = DAILY[day];
    SV.dailyAt = todayKey(); SV.dailyN = (SV.dailyN||0) + 1;
    if(d.ic==='🪙') SV.gold += d.v;
    if(d.ic==='💎') SV.gem  += d.v;
    if(d.ic==='📿'){ const p = PENDANTS[(Math.random()*PENDANTS.length)|0];
                     if(!SV.pendants[p.id]) SV.pendants[p.id] = {}; }
    if(d.ic==='✨'){ const c = drawOne(); grant(c); }
    saveNow(); SFX.coin();
    await modal('<div class="modal"><div class="reward"><div class="in">'
      + '<h3>出席ボーナス</h3><div class="items"><div class="it">'
      + '<div class="ic">'+d.ic+'</div><div class="v">×'+d.v+'</div><div class="l">'+esc(d.nm)+'</div>'
      + '</div></div><div class="btnrow" style="justify-content:center;margin-top:12px">'
      + '<button class="btn gold" data-act="ok">受け取る</button></div></div></div></div>');
    showDaily();
  };
  screenTo('daily');
}

/* ── ミッション（達成すると報酬） ─────────────────── */
const QUESTS = [
  {id:'q1', nm:'3回 対戦する',            need:3,  get:p=>p.plays, rw:{g:2000}},
  {id:'q2', nm:'1回 勝つ',                need:1,  get:p=>p.wins,  rw:{g:3000}},
  {id:'q3', nm:'カードを4枚あつめる',      need:4,  get:()=>ownedCards().length, rw:{d:5}},
  {id:'q4', nm:'カードをLv.5まで育てる',   need:5,
   get:()=>Math.max(1, ...CARDPOOL.map(c=>(SV.cards[c.id]||{lv:0}).lv)), rw:{g:5000}},
  {id:'q5', nm:'ペンダントを4つ装備する',  need:4,
   get:()=>SV.slots.filter(Boolean).length, rw:{d:8}}
];
function questReady(){
  return QUESTS.some(q => !(SV.qdone||{})[q.id] && q.get(SV) >= q.need);
}
function showQuest(){
  const el = mkScreen('quest',
    railHTML('')
    + '<div class="inner"><div class="metahd"><h2>ミッション</h2>'
    + '<span class="note">達成すると報酬がもらえます</span></div>'
    + '<div class="qlist">'
    + QUESTS.map(q=>{
        const cur = Math.min(q.need, q.get(SV));
        const done = (SV.qdone||{})[q.id];
        const ready = !done && cur >= q.need;
        return '<div class="qrow'+(done?' done':'')+(ready?' ready':'')+'">'
          + '<span class="qn">'+esc(q.nm)+'</span>'
          + '<span class="qb"><i style="width:'+(cur/q.need*100)+'%"></i></span>'
          + '<span class="qc">'+cur+' / '+q.need+'</span>'
          + '<span class="qr">'+(q.rw.g?('🪙'+q.rw.g):('💎'+q.rw.d))+'</span>'
          + '<button class="btn '+(ready?'gold':'ghost')+' qbtn" data-q="'+q.id+'"'
          +   (ready?'':' disabled')+'>'+(done?'受取済':'受け取る')+'</button></div>';
      }).join('')
    + '</div></div>' + walletHTML());
  wireTabs(el);
  el.querySelectorAll('.qbtn').forEach(b=>{
    b.onclick = ()=>{
      const q = QUESTS.find(x=>x.id===b.dataset.q); if(!q) return;
      if(q.get(SV) < q.need) return;
      SV.qdone = SV.qdone || {};
      if(SV.qdone[q.id]) return;
      SV.qdone[q.id] = 1;
      if(q.rw.g) SV.gold += q.rw.g;
      if(q.rw.d) SV.gem  += q.rw.d;
      saveNow(); SFX.coin();
      toast('R','🎯','ミッション達成', q.nm+' の報酬を受け取りました', 2400);
      showQuest();
    };
  });
  screenTo('quest');
}

/* ── お知らせ ───────────────────────────────────── */
function showNews(){
  const w = thisWeek();
  const el = mkScreen('news',
    railHTML('')
    + '<div class="inner"><div class="metahd"><h2>お知らせ</h2></div>'
    + '<div class="pan"><div class="in">'
    + '<h3>'+w.ic+' 今週のイベント：'+esc(w.nm)+'</h3>'
    + '<p style="font-size:14px;line-height:1.9">'+esc(w.ds)+'<br>'
    + '残り '+weekEndsIn()+'（毎週 月曜 朝6時に切り替わります）<br>'
    + '注目カード：<b>'+esc(featureCard().nm)+'</b>（ガチャで出やすくなっています）</p>'
    + '</div></div>'
    + '<div class="pan" style="margin-top:14px"><div class="in">'
    + '<h3>遊び方</h3><p style="font-size:13.5px;line-height:2">'
    + TIPS.map(t=>'・'+esc(t)).join('<br>')
    + '</p></div></div>'
    + '</div>' + walletHTML());
  wireTabs(el);
  screenTo('news');
}

/* ── セーブの初期値を足す ───────────────────────── */
function walletHTML(){
  const need = playerLvNeed(SV.lv);
  return '<div class="wallet">'
    + '<div class="cur"><span>🪙</span><b id="wGold">'+SV.gold.toLocaleString()+'</b></div>'
    + '<div class="cur"><span>💎</span><b id="wGem">'+SV.gem+'</b></div>'
    + '<div class="cur"><span>🎴</span><b>'+ownedCards().length+'/'+CARDPOOL.length+'</b></div>'
    + '<div class="lvl"><span style="font-size:12px;font-weight:900;color:#9FB6CC">Lv.</span>'
    + '<b style="font-family:var(--pop);font-size:19px;color:#FFE9B5">'+SV.lv+'</b>'
    + '<span class="xp"><i style="width:'+Math.min(100, SV.exp/need*100)+'%"></i></span></div>'
    + '</div>';
}
function statRows(st, cmp){
  return STAT_LABELS.map(([k,l])=>{
    const v = st[k], d = cmp ? v - cmp[k] : 0;
    return '<div class="strow"><span class="l">'+l+'</span>'
      + '<span class="bar"><i style="width:'+Math.min(100,v)+'%"></i></span>'
      + '<span class="v">'+v+(d>0?'<em> +'+d+'</em>':'')+'</span></div>';
  }).join('');
}

/* ── ホーム ─────────────────────────────────────────── */
function showHome(){
  const c = equippedCard(), own = SV.cards[c.id]||{lv:1};
  const st = myStats();
  const el = mkScreen('home',
    tabsHTML('home')
    + '<div class="inner">'
    + '<div class="hero hero3">'
    +   '<div class="heroPic"><span class="rk">'+RAR[c.rar].nm+' CLASS</span>'
    +     '<canvas id="homePic" width="320" height="450"></canvas></div>'
    +   '<div class="heroInfo">'
    +     '<h1>ダイスキングダム</h1><div class="cap">DICE KINGDOM</div>'
    +     '<div class="who"><b>'+esc(c.nm)+'</b>（'+esc(c.role)+'） Lv.'+own.lv
    +       '　「'+esc(c.line)+'」</div>'
    +     '<div class="stats dark-st">'+statRows(st, cardStats(c.id, own.lv, []))+'</div>'
    +     '<div class="modes">'
    +       '<div class="modebtn big" id="mPlay"><div class="ic">🎲</div><div class="nm">ゲーム開始</div>'
    +         '<div class="ds">CPU・ともだちと 最大4人で対戦</div></div>'
    +       '<div class="modebtn" id="mGacha"><div class="ic">✨</div><div class="nm">ガチャ</div>'
    +         '<div class="ds">新しいキャラを<br>引き当てる</div>'
    +         (SV.gold>=800?'<span class="badge">引ける</span>':'')+'</div>'
    +       '<div class="modebtn" id="mCards"><div class="ic">🎴</div><div class="nm">カード強化</div>'
    +         '<div class="ds">ステータスを<br>上げる</div></div>'
    +     '</div>'
    +   '</div>'
    +   rankPaneHTML()
    + '</div>'
    + weekBannerHTML()
    + '</div>' + walletHTML());
  regPortrait($('#homePic'), c.art, c.col, c.id);
  wireTabs(el);
  $('#mPlay').onclick  = ()=>{ SFX.click(); screenTo('setup'); };
  $('#mCards').onclick = ()=>{ SFX.click(); showCards(); };
  $('#mGacha').onclick = ()=>{ SFX.click(); showGacha(); };
  bgm('lobby');                 // ホームに戻ったらロビーの曲へ戻す
  screenTo('home');
}

/* ── ランキング（本家ロビーの右半分） ─────────────────── */
const RIVALS = [
  {nm:'ボン・クレー', a:31914200, like:214}, {nm:'しゅう',      a:28776500, like:188},
  {nm:'あんぱん',     a:24310900, like:151}, {nm:'たなか',      a:21085400, like:133},
  {nm:'みっちゃん',   a:18702300, like:117}, {nm:'ジェイド',    a:16240800, like: 96},
  {nm:'くり',         a:14118600, like: 82}, {nm:'れっちゃん',  a:12903100, like: 71}
];
function rankPaneHTML(){
  const me = { nm:'あなた', a: SV.gold*180 + SV.lv*900000, like: SV.wins*7+3, me:1 };
  const rows = RIVALS.concat([me]).sort((x,y)=>y.a-x.a);
  const rank = rows.findIndex(r=>r.me) + 1;
  const medal = i => i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : (i+1);
  return '<div class="rankpane">'
    + '<div class="rtab"><span class="on">全体ランキング</span><span>ともだち</span></div>'
    + '<div class="rlist">'
    + rows.slice(0,7).map((r,i)=>
        '<div class="rrow'+(r.me?' me':'')+'">'
        + '<span class="rk">'+medal(i)+'</span>'
        + '<span class="nm">'+esc(r.nm)+'</span>'
        + '<span class="as">'+yen(r.a)+'</span>'
        + '<span class="lk">👍 '+r.like+'</span></div>').join('')
    + '</div>'
    + '<div class="mileage"><b>マイレージ</b>'
    + '<span class="bar"><i style="width:'+Math.min(100, (SV.plays%10)*10)+'%"></i></span>'
    + '<span class="n">'+(SV.plays%10)+'/10</span></div>'
    + '<div class="rfoot">あなたは <b>'+rank+'位</b>　／　10戦ごとにマイレージガチャが引けます</div>'
    + '</div>';
}

/* ── カード ─────────────────────────────────────────── */
let cardSel = null;
function showCards(){
  cardSel = cardSel && SV.cards[cardSel] ? cardSel : SV.equip;
  const el = mkScreen('cards',
    tabsHTML('cards')
    + '<div class="inner">'
    + '<div class="metahd"><h2>カード</h2>'
    +   '<span class="note">同じカードが重なると強化に使えます</span></div>'
    + '<div class="cardwrap"><div id="cardDetail"></div>'
    +   '<div class="cardgrid" id="cardGrid"></div></div>'
    + '</div>' + walletHTML());
  wireTabs(el);
  drawCardGrid(); drawCardDetail();
  screenTo('cards');
}
function drawCardGrid(){
  const g = $('#cardGrid'); g.innerHTML = '';
  CARDPOOL.forEach(c=>{
    const o = SV.cards[c.id];
    const d = document.createElement('div');
    d.className = 'minicard ' + RAR[c.rar].cls + (o?'':' locked') + (cardSel===c.id?' sel':'');
    d.innerHTML = '<span class="rr">'+RAR[c.rar].nm+'</span>'
      + (SV.equip===c.id?'<span class="eq">装備</span>':'')
      + '<canvas width="150" height="150"></canvas>'
      + '<div class="b"><div class="n">'+(o?esc(c.nm):'？？？')+'</div>'
      + '<div class="l">'+(o?('Lv.'+o.lv+(o.dup?' ×'+o.dup:'')):'未所持')+'</div></div>';
    if(o) regPortrait(d.querySelector('canvas'), c.art, c.col, c.id);
    d.onclick = ()=>{ if(!o) return; SFX.click(); cardSel = c.id; drawCardGrid(); drawCardDetail(); };
    g.appendChild(d);
  });
}
function upCost(lv){ return 300 + lv*260; }
function drawCardDetail(){
  const c = cardById(cardSel), o = SV.cards[cardSel];
  if(!c || !o){ $('#cardDetail').innerHTML=''; return; }
  const st = cardStats(c.id, o.lv, SV.equip===c.id ? SV.slots : []);
  const cost = upCost(o.lv), canUp = o.lv<30 && o.dup>0 && SV.gold>=cost;
  $('#cardDetail').innerHTML =
    '<div class="cardDetail"><div class="in">'
    + '<canvas id="cdPic" width="330" height="420"></canvas>'
    + '<h3>'+esc(c.nm)+' <span style="font-size:16px;color:#FFD24D">Lv.'+o.lv+'</span></h3>'
    + '<div class="role">'+RAR[c.rar].nm+' CLASS ／ '+esc(c.role)+'</div>'
    + '<div class="skill"><b>'+esc(c.sk.nm)+'（1ゲーム'+c.sk.uses+'回）</b>'+esc(c.sk.ds)+'</div>'
    + '<div style="margin-top:9px">'+statRows(st)+'</div>'
    + '<div style="display:flex;gap:9px;margin-top:12px">'
    +   '<button class="btn ghost" id="cdEquip" style="flex:1;font-size:16px;padding:9px 0"'
    +     (SV.equip===c.id?' disabled':'')+'>'+(SV.equip===c.id?'装備中':'装備する')+'</button>'
    +   '<button class="btn gold" id="cdUp" style="flex:1.3;font-size:16px;padding:9px 0"'
    +     (canUp?'':' disabled')+'>強化 🪙'+cost+' ／ 同カード×1</button>'
    + '</div>'
    + '<div style="font-size:11.5px;color:#8FA9C4;margin-top:6px;text-align:center">'
    +   (o.lv>=30 ? 'レベル最大' : (o.dup>0 ? '重なり '+o.dup+' 枚' : 'ガチャで同じカードを引くと強化できます'))+'</div>'
    + '</div></div>';
  regPortrait($('#cdPic'), c.art, c.col, c.id);
  $('#cdEquip').onclick = ()=>{ SV.equip = c.id; saveNow(); SFX.click(); drawCardGrid(); drawCardDetail(); };
  $('#cdUp').onclick = ()=>{
    if(!canUp) return;
    SV.gold -= cost; o.dup--; o.lv++;
    saveNow(); SFX.build(); drawCardGrid(); drawCardDetail();
    const w = $('#wGold'); if(w) w.textContent = SV.gold.toLocaleString();
    toast('R','⬆','強化成功', c.nm+' が Lv.'+o.lv+' になりました', 2200);
  };
}

/* ── ガチャ ─────────────────────────────────────────── */
function rollRarity(){
  const t = RAR.A.w + RAR.S.w + RAR.SS.w;
  let r = Math.random()*t;
  if((r -= RAR.SS.w) < 0) return 'SS';
  if((r -= RAR.S.w) < 0) return 'S';
  return 'A';
}
function drawOne(){
  const rar = rollRarity();
  const f = featureCard();
  // 今週の注目カードは出やすさ2倍（同レアリティの中で2枚ぶんとして数える）
  const pool = CARDPOOL.filter(c=>c.rar===rar);
  if(f.rar===rar) pool.push(f);
  return pool[(Math.random()*pool.length)|0];
}
function grant(c){
  if(SV.cards[c.id]) SV.cards[c.id].dup++;
  else SV.cards[c.id] = {lv:1, dup:0};
  // 低確率でペンダントも
  if(Math.random()<0.18){
    const p = PENDANTS[(Math.random()*PENDANTS.length)|0];
    if(!SV.pendants[p.id]) SV.pendants[p.id] = {};
  }
}
const LANES = {
  normal:  {nm:'ノーマル',   cur:'🪙', one:10000, five:40000, w:{A:0.90,S:0.10,SS:0.00},
            ds:'A中心。数を集めて強化に回す'},
  special: {nm:'スペシャル', cur:'💎', one:40,    five:180,   w:{A:0.62,S:0.32,SS:0.06},
            ds:'S+ が出る。5連は1割引き'},
  premium: {nm:'プレミアム', cur:'💎', one:25,    five:100,   w:{A:0.40,S:0.50,SS:0.10},
            ds:'S以上が出やすい。4時間ごとに1回無料'}
};
function freeLeft(){
  const ms = 4*3600*1000 - (Date.now() - (SV.freeAt||0));
  return ms <= 0 ? 0 : ms;
}
function mmss(ms){
  const h = Math.floor(ms/3600000), m = Math.floor(ms%3600000/60000), s2 = Math.floor(ms%60000/1000);
  return (h?h+':':'') + String(m).padStart(2,'0') + ':' + String(s2).padStart(2,'0');
}
let gachaTimer = null;
function showGacha(){
  const el = mkScreen('gacha',
    railHTML('gacha')
    + '<div class="inner">'
    + '<div class="metahd"><h2>ガチャ</h2>'
    +   '<span class="note">ペンダントも一定確率で手に入ります</span></div>'
    + '<div class="stage" id="gStage"><div class="orb"></div></div>'
    + '<div class="lanes">'
    + Object.keys(LANES).map(k=>{
        const L = LANES[k];
        const free = (k==='premium' && freeLeft()===0);
        return '<div class="lane l-'+k+'">'
          + '<div class="lh">'+esc(L.nm)+'</div>'
          + '<div class="ld">'+esc(L.ds)+'</div>'
          + '<div class="lrate">S+ '+Math.round(L.w.SS*100)+'%　S '+Math.round(L.w.S*100)+'%　'
          +   'A '+Math.round(L.w.A*100)+'%</div>'
          + '<div class="lbtns">'
          +   '<button class="btn ghost" data-lane="'+k+'" data-n="1">'
          +     (free ? '無料で1回' : '1回 '+L.cur+L.one.toLocaleString())+'</button>'
          +   '<button class="btn gold" data-lane="'+k+'" data-n="5">5連 '+L.cur+L.five.toLocaleString()
          +   '</button>'
          + '</div>'
          + (k==='premium'
              ? '<div class="lfree" id="gFree">'+(free?'いま無料で引けます':'次の無料まで '+mmss(freeLeft()))+'</div>'
              : '')
          + '</div>';
      }).join('')
    + '</div>'
    + '<div class="rates">すでに持っているカードは「重なり」になり、カードの強化に使えます。</div>'
    + '</div>' + walletHTML());
  wireTabs(el);
  el.querySelectorAll('[data-lane]').forEach(b=>{
    b.onclick = ()=>doGacha(b.dataset.lane, +b.dataset.n);
  });
  if(gachaTimer) clearInterval(gachaTimer);
  gachaTimer = setInterval(()=>{
    const f = $('#gFree'); if(!f){ clearInterval(gachaTimer); gachaTimer = null; return; }
    const ms = freeLeft();
    f.textContent = ms===0 ? 'いま無料で引けます' : '次の無料まで ' + mmss(ms);
  }, 1000);
  bgm('gacha');                 // ガチャ画面はきらびやかな曲へ
  screenTo('gacha');
}
function rollLane(w){
  const r = Math.random();
  if(r < w.SS) return 'SS';
  if(r < w.SS + w.S) return 'S';
  return 'A';
}
async function doGacha(lane, n){
  const L = LANES[lane] || LANES.normal;
  const free = (lane==='premium' && n===1 && freeLeft()===0);
  const cost = free ? 0 : (n===1 ? L.one : L.five);
  const isGem = L.cur === '💎';
  const have = isGem ? SV.gem : SV.gold;
  if(!free && have < cost){
    toast('R', L.cur, (isGem?'ダイヤ':'ゴールド')+'が足りません',
          isGem?'出席簿とミッションで増やせます':'ゲームに勝つと増えます', 2400);
    SFX.bad(); return;
  }
  if(!free){ if(isGem) SV.gem -= cost; else SV.gold -= cost; }
  if(free) SV.freeAt = Date.now();
  const got = [];
  for(let i=0;i<n;i++){
    const rar = rollLane(L.w);
    const pool = CARDPOOL.filter(c=>c.rar===rar);
    const f = featureCard();
    if(f.rar===rar) pool.push(f);
    const c = pool.length ? pool[(Math.random()*pool.length)|0] : CARDPOOL[0];
    grant(c); got.push(c);
  }
  saveNow();
  const st = $('#gStage');
  st.innerHTML = '<div class="orb"></div>';
  SFX.gachaRoll();
  await wait(600);
  st.innerHTML = '<div class="pulls" id="gPulls"></div>';
  const box = $('#gPulls');
  for(let i=0;i<got.length;i++){
    const c = got[i];
    const d = document.createElement('div');
    d.className = 'pullcard ' + RAR[c.rar].cls;
    d.style.animationDelay = (i*70)+'ms';
    d.innerHTML = '<canvas width="150" height="180"></canvas>'
      + '<div class="b">'+esc(c.nm)+'<i>'+RAR[c.rar].nm+'</i></div>';
    regPortrait(d.querySelector('canvas'), c.art, c.col, c.id);
    box.appendChild(d);
    if(c.rar==='SS'){ SFX.gachaRare(); } else SFX.coin();
    await wait(130);
  }
  const wg = $('#wGold'); if(wg) wg.textContent = SV.gold.toLocaleString();
  const wm = $('#wGem');  if(wm) wm.textContent = SV.gem;
}
/* ── ペンダント ─────────────────────────────────────── */
function showPend(){
  const el = mkScreen('pend',
    tabsHTML('pend')
    + '<div class="inner">'
    + '<div class="metahd"><h2>ペンダント</h2>'
    +   '<span class="note">4つまで装備できます</span></div>'
    + '<div class="pendwrap">'
    +   '<div><div class="slots" id="pSlots"></div>'
    +     '<div style="margin-top:14px" id="pStats"></div></div>'
    +   '<div class="pendgrid" id="pGrid"></div>'
    + '</div>'
    + '</div>' + walletHTML());
  wireTabs(el);
  drawPend();
  screenTo('pend');
}
function drawPend(){
  const s = $('#pSlots'); s.innerHTML = '';
  SV.slots.forEach((pid,i)=>{
    const p = pendById(pid);
    const d = document.createElement('div');
    d.className = 'slot' + (p?' on':'');
    d.innerHTML = p
      ? ('<span class="pr">'+PEND_RAR[p.rar].nm+'</span><div class="ic">'+p.ic+'</div>'
         + '<span class="nm">'+esc(p.nm)+'</span><span class="pp">'+Math.round(p.p*100)+'%</span>')
      : '＋';
    d.onclick = ()=>{ if(!p) return; SV.slots[i]=null; saveNow(); SFX.click(); drawPend(); };
    s.appendChild(d);
  });
  const g = $('#pGrid'); g.innerHTML = '';
  PENDANTS.forEach(p=>{
    const have = !!SV.pendants[p.id];
    const eq = SV.slots.indexOf(p.id)>=0;
    const d = document.createElement('div');
    d.className = 'pend' + (have?'':' no') + (eq?' eq':'') + ' r'+p.rar;
    d.innerHTML = '<span class="pr">'+PEND_RAR[p.rar].nm+'</span>'
      + '<div class="ic">'+p.ic+'</div><div class="nm">'+esc(have?p.nm:'？？？')+'</div>'
      + '<div class="pp">'+Math.round(p.p*100)+'%</div>'
      + '<div class="ef">'+(have?esc(p.ds):'未所持')+'</div>';
    d.onclick = ()=>{
      if(!have || eq) return;
      const k = SV.slots.indexOf(null);
      if(k<0){ toast('R','📿','枠がいっぱいです','外してから付けてください',1900); return; }
      SV.slots[k] = p.id; saveNow(); SFX.click(); drawPend();
    };
    g.appendChild(d);
  });
  const c = equippedCard(), o = SV.cards[c.id]||{lv:1};
  $('#pStats').innerHTML = '<div class="pan"><div class="in">'
    + '<h3>'+esc(c.nm)+' の合計ステータス</h3>'
    + statRows(cardStats(c.id,o.lv,SV.slots), cardStats(c.id,o.lv,[])) + '</div></div>';
}

/* ── VS 画面 ─────────────────────────────────────────── */
const VS_TIPS = [
  'ペンダントはあなたの勝利の女神様！　4つ全部つけて挑もう。',
  '同じ数字の目を出すと「ダブル」が発生し、続けてサイコロを振れます。',
  '旅行のマスに止まると、行きたいところへ移動できます。',
  '相手がキャッチする時にじゃまができます。',
  'トリプル独占をそろえると、その場で勝ちになります。'
];
async function vsScreen(){
  const el = $('#vs');
  const me = cfg.seats.find(s=>s.kind!=='cpu') || cfg.seats[0];
  const foe = cfg.seats.slice(0,cfg.n).find(s=>s!==me) || cfg.seats[1];
  const cm = cardById(me.cardId)||CARDPOOL[0], cf = cardById(foe.cardId)||CARDPOOL[1];
  el.innerHTML =
    '<div class="row">'
    + '<div class="side"><canvas id="vsA" width="300" height="330"></canvas>'
    +   '<div class="nm">'+esc(me.name)+'</div><div class="rl">'+esc(cm.nm)+' ／ '+esc(cm.role)+'</div></div>'
    + '<div class="vsmark">VS</div>'
    + '<div class="side r"><canvas id="vsB" width="300" height="330"></canvas>'
    +   '<div class="nm">'+esc(foe.name)+'</div><div class="rl">'+esc(cf.nm)+' ／ '+esc(cf.role)+'</div></div>'
    + '</div>'
    + '<div class="tip"><b>TIP</b>'+esc(VS_TIPS[(Math.random()*VS_TIPS.length)|0])+'</div>';
  regPortrait($('#vsA'), cm.art, cm.col, cm.id);
  regPortrait($('#vsB'), cf.art, cf.col, cf.id);
  el.classList.add('on');
  SFX.skill();
  await wait(2000);
  el.classList.remove('on');
}

/* ── 対戦後の報酬 ───────────────────────────────────── */
async function grantRewards(won){
  const gold = won ? 1400 : 480;
  const exp  = won ? 40 : 14;
  SV.gold += gold; SV.exp += exp; SV.plays++; if(won) SV.wins++;
  let up = 0;
  while(SV.exp >= playerLvNeed(SV.lv)){ SV.exp -= playerLvNeed(SV.lv); SV.lv++; up++; }
  if(up) jingle('levelup');
  let pend = null;
  if(Math.random() < (won?0.35:0.15)){
    const p = PENDANTS[(Math.random()*PENDANTS.length)|0];
    if(!SV.pendants[p.id]){ SV.pendants[p.id] = {}; pend = p; }
  }
  saveNow();
  await modal('<div class="modal"><div class="reward"><div class="in">'
    + '<h3>'+(won?'勝利報酬':'参加報酬')+'</h3>'
    + '<div class="items">'
    +   '<div class="it"><div class="ic">🪙</div><div class="v">+'+gold.toLocaleString()+'</div>'
    +     '<div class="l">ゴールド</div></div>'
    +   '<div class="it"><div class="ic">⭐</div><div class="v">+'+exp+'</div><div class="l">経験値</div></div>'
    +   (up?'<div class="it"><div class="ic">🆙</div><div class="v">Lv.'+SV.lv+'</div>'
    +     '<div class="l">レベルアップ</div></div>':'')
    +   (pend?'<div class="it"><div class="ic">'+pend.ic+'</div><div class="v" style="font-size:14px">'
    +     esc(pend.nm)+'</div><div class="l">ペンダント</div></div>':'')
    + '</div>'
    + '<div class="btnrow" style="justify-content:center;margin-top:14px">'
    + '<button class="btn gold" data-act="ok">受け取る</button></div>'
    + '</div></div></div>');
}

/* ══════════════════════════════════════════════════════════════
   週替わりイベント
   毎週【月曜 朝6時】を境に、今週のイベントと注目カードが自動で切り替わる。
   サーバも定期実行も要らない（端末の日付から週番号を出しているだけ）。
   ══════════════════════════════════════════════════════════════ */
function weekIndex(){
  // 1970-01-05(月) 06:00 を起点にした通し週番号
  const base = Date.UTC(1970,0,5,6,0,0);
  return Math.floor((Date.now() - base) / (7*24*3600*1000));
}
const WEEKLY = [
  {id:'gold',  ic:'🪙', nm:'ゴールドラッシュ', ds:'スタート通過の給料が2倍になる週',
   apply:g=>{ g.ev = {salaryX:2}; }},
  {id:'sale',  ic:'🏗', nm:'建設バーゲン',     ds:'建設費用が2割引きになる週',
   apply:g=>{ g.ev = {buildX:0.8}; }},
  {id:'toll',  ic:'💰', nm:'通行料値上げ',     ds:'すべての通行料が1.3倍になる週',
   apply:g=>{ g.ev = {tollX:1.3}; }},
  {id:'luck',  ic:'🍀', nm:'幸運のフォーチュン', ds:'チャンスカードで良い効果が出やすい週',
   apply:g=>{ g.ev = {luck:0.45}; }},
  {id:'mini',  ic:'🕯️', nm:'洞窟フィーバー',   ds:'ミニゲームの倍率が最初から×4の週',
   apply:g=>{ g.ev = {miniX:2}; }},
  {id:'dice',  ic:'🎲', nm:'ダイス増量',       ds:'奇数・偶数ボタンが2回ずつ増える週',
   apply:g=>{ g.ev = {}; g.players.forEach(p=>{ p.odd+=2; p.even+=2; }); }},
  {id:'mono',  ic:'👑', nm:'独占ウィーク',     ds:'トリプル独占の通行料がさらに1.5倍の週',
   apply:g=>{ g.ev = {monoX:1.5}; }}
];
function thisWeek(){ return WEEKLY[((weekIndex()%WEEKLY.length)+WEEKLY.length)%WEEKLY.length]; }
function featureCard(){ return CARDPOOL[((weekIndex()*3)%CARDPOOL.length+CARDPOOL.length)%CARDPOOL.length]; }
function weekEndsIn(){
  const base = Date.UTC(1970,0,5,6,0,0);
  const ms = (weekIndex()+1)*(7*24*3600*1000) + base - Date.now();
  const d = Math.floor(ms/86400000), h = Math.floor(ms%86400000/3600000);
  return d+'日'+h+'時間';
}
function weekBannerHTML(){
  const w = thisWeek(), f = featureCard();
  return '<div style="display:flex;align-items:center;gap:14px;margin-top:16px;padding:11px 16px;'
    + 'border-radius:14px;border:2px solid #D3A22C;'
    + 'background:linear-gradient(90deg,rgba(107,78,18,.9),rgba(28,20,6,.85))">'
    + '<span style="font-size:32px">'+w.ic+'</span>'
    + '<span style="flex:1"><b style="display:block;font-size:16px;color:#FFE9B5">今週のイベント：'
    +   esc(w.nm)+'</b>'
    + '<i style="font-style:normal;font-size:12.5px;color:#CBDCEE">'+esc(w.ds)
    +   '　／　残り '+weekEndsIn()+'（毎週 月曜 朝6時に切替）</i></span>'
    + '<span style="text-align:center;padding:5px 12px;border-radius:10px;background:rgba(6,14,26,.7);'
    +   'border:1px solid #3D5578">'
    + '<b style="display:block;font-size:11px;color:#8FA9C4">注目カード</b>'
    + '<i style="font-style:normal;font-size:14px;font-weight:900;color:#FFD24D">'+esc(f.nm)+' ×2</i></span>'
    + '</div>';
}

/* ── 既存フローへの接続 ─────────────────────────────── */
$('#toSetup').onclick = ()=>{ SFX.click(); ac(); showHome(); };
$('#backTitle').onclick = ()=>{ SFX.click(); showHome(); };
$('#againSetup').onclick = ()=>{ SFX.click(); showHome(); };

/* ══════════════════════════════════════════════════════════════
   試合前の待機部屋
   なぜ要るか: 本家は「部屋に入る → 装備を見直す → アイテムを買う →
   顔ぶれを見る → 開始」という助走がある。これが無いと、
   育てたカードやペンダントが「いつ役に立ったのか」分からないまま
   試合が終わってしまい、育てる意味が消える。
   ══════════════════════════════════════════════════════════════ */
const SHOP = [
  { id:'angel',  g:520 }, { id:'half',   g:420 }, { id:'double', g:640 },
  { id:'salary', g:380 }, { id:'freeze', g:560 }, { id:'warp',   g:470 },
  { id:'dice',   g:700 }
];
const BAG_MAX = 3;
function shopPrice(id){ const o = SHOP.find(s=>s.id===id); return o ? o.g : 500; }

function roomPhase(){
  return new Promise(resolve=>{
    const el = mkScreen('room', '');
    el.className = 'screen';                 // meta 用の余白は使わない
    const map = MAPS.find(m=>m.id===cfg.mapId) || MAPS[0];

    function render(){
      const me = cfg.seats.slice(0,cfg.n).find(s=>s.kind!=='cpu') || cfg.seats[0];
      const c  = cardById(me.cardId) || CARDPOOL[0];
      const o  = SV.cards[c.id] || {lv:1};
      const st = cardStats(c.id, o.lv, SV.slots);
      const die = dieById(SV.die);

      /* 左ページ：装備 */
      let L = '<div class="rsec">装備しているカード</div>'
        + '<div class="meBox"><canvas id="roomPic" width="240" height="340"></canvas>'
        + '<div class="meInfo">'
        +   '<div class="nm">' + esc(c.nm) + '</div>'
        +   '<div class="rl">' + esc(c.role) + '</div>'
        +   '<div><span class="lvtag">' + RAR[c.rar].nm + ' ／ Lv.' + o.lv + '</span></div>'
        +   '<div class="sk"><b>' + esc(c.sk.nm) + '（' + c.sk.uses + '回）</b><br>' + esc(c.sk.ds) + '</div>'
        + '</div></div>'
        + '<div style="margin-top:11px">' + statRows(st) + '</div>'
        + '<div class="rsec" style="margin-top:14px">ペンダント（4枠）</div>'
        + '<div class="slotrow">';
      for(let k=0;k<4;k++){
        const p = pendById(SV.slots[k]);
        L += '<div class="pslot' + (p?' on':'') + '" data-slot="' + k + '">'
          + (p ? '<div class="ic">' + p.ic + '</div><div class="nm">' + esc(p.nm) + '</div>'
               : '<div class="ic" style="opacity:.35">＋</div><div class="em">空き</div>')
          + '</div>';
      }
      L += '</div>'
        + '<div class="rsec" style="margin-top:14px">サイコロ</div>'
        + '<div class="dicerow">';
      DICE.forEach(d=>{
        const have = !!(SV.dice && SV.dice[d.id]);
        L += '<div class="dcard' + (have?' have':'') + (SV.die===d.id?' on':'') + '" data-die="' + d.id + '">'
          + '<div class="ic">' + d.ic + '</div>'
          + '<div class="rr">' + d.rar + '</div>'
          + '<div class="nm">' + esc(d.nm) + '</div></div>';
      });
      L += '</div><div class="dds">' + esc(die.ds)
        + (SV.dice && SV.dice[SV.die] ? '' : '　<b style="color:#E8747E">未所持</b>') + '</div>';

      /* 右ページ：部屋の顔ぶれ＋売り場 */
      let Rr = '<div><div class="rsec">この部屋のプレイヤー（' + cfg.n + '人）</div><div class="seats">';
      for(let i=0;i<4;i++){
        if(i >= cfg.n){
          Rr += '<div class="seat" style="opacity:.3;justify-content:center">'
             + '<div class="cd" style="font-size:12px">空席</div></div>';
          continue;
        }
        const s = cfg.seats[i], cc = cardById(s.cardId) || CARDPOOL[i % CARDPOOL.length];
        const isMe = s.kind !== 'cpu';
        Rr += '<div class="seat' + (isMe?' me':'') + '">'
          + '<canvas class="sp" data-art="' + cc.art + '" data-col="' + cc.col + '" data-card="' + cc.id + '" width="240" height="340"></canvas>'
          + '<div class="nm">' + esc(s.name) + '</div>'
          + '<div class="cd">' + esc(cc.nm) + '</div>'
          + '<div class="st' + (isMe?'':' cpu') + '">' + (isMe ? '準備OK' : 'CPU') + '</div>'
          + '</div>';
      }
      Rr += '</div></div>';

      Rr += '<div><div class="rsec">おすすめアイテム（持ち込みは ' + BAG_MAX + ' 個まで）</div>'
         + '<div class="shop">';
      SHOP.forEach(s=>{
        const it = itemById(s.id);
        if(!it) return;
        const full = SV.bag.length >= BAG_MAX;
        const poor = SV.gold < s.g;
        Rr += '<div class="sitem' + ((full||poor)?' no':'') + '" data-buy="' + s.id + '">'
          + '<div class="t"><span class="ic">' + it.ic + '</span><b>' + esc(it.nm) + '</b></div>'
          + '<div class="d">' + esc(it.desc) + '</div>'
          + '<div class="p">🪙 ' + s.g.toLocaleString() + '</div></div>';
      });
      Rr += '</div></div>';

      Rr += '<div><div class="rsec">マップ</div><div class="maprow">'
         + MAPS.map(function(m){ return '<div class="mcard' + (cfg.mapId===m.id?' on':'') + '" data-map="' + m.id + '">'
             + '<span class="em">' + m.emoji + '</span>'
             + '<b>' + esc(m.name) + '</b><i>' + esc(m.sub) + '</i></div>'; }).join('')
         + '</div></div>';

      Rr += '<div class="bagrow"><span class="lb">持ち込み</span>'
         + (SV.bag.length
             ? SV.bag.map((id,k)=>{ const it = itemById(id);
                 return '<span class="bagchip" data-drop="' + k + '">' + (it?it.ic:'') + ' '
                      + esc(it?it.nm:id) + ' <b style="color:#E8747E">×</b></span>'; }).join('')
             : '<span class="lb" style="opacity:.6">まだ何も買っていません（無くても遊べます）</span>')
         + '</div>';

      el.innerHTML = '<div class="roomwrap">'
        + '<div class="roomhd"><h2>待機部屋</h2>'
        +   '<span class="mp">' + map.emoji + ' ' + esc(map.name) + '　／　のこり ' + cfg.turns + ' ターン</span>'
        +   '<span class="sp"></span>' + walletHTML() + '</div>'
        + '<div class="roombd"><div class="roomL">' + L + '</div><div class="roomR">' + Rr + '</div></div>'
        + '<div class="roomft">'
        +   '<button class="btn ghost" id="roomBack">もどる</button>'
        +   '<span class="hint">ペンダントの枠を押すと装備を替えられます。サイコロは持っているものだけ選べます。</span>'
        +   '<button class="btn gold" id="roomGo">ゲームスタート</button>'
        + '</div></div>';

      regPortrait(el.querySelector('#roomPic'), c.art, c.col, c.id);
      el.querySelectorAll('.seat canvas.sp').forEach(cv=>{
        regPortrait(cv, +cv.dataset.art, cv.dataset.col, cv.dataset.card);
      });

      el.querySelectorAll('.pslot').forEach(b=>{
        b.onclick = ()=>{ SFX.click(); slotPicker(+b.dataset.slot, render); };
      });
      el.querySelectorAll('.dcard').forEach(b=>{
        b.onclick = ()=>{
          const d = dieById(b.dataset.die);
          if(!(SV.dice && SV.dice[d.id])){
            SFX.warn();
            toast('R','🎲','まだ持っていません', esc(d.nm) + ' はガチャで手に入ります', 2200);
            return;
          }
          SFX.click(); SV.die = d.id; saveNow(); render();
        };
      });
      el.querySelectorAll('.mcard').forEach(b=>{
        b.onclick = ()=>{ SFX.click(); cfg.mapId = b.dataset.map; render(); };
      });
      el.querySelectorAll('.sitem').forEach(b=>{
        b.onclick = ()=>{
          const id = b.dataset.buy, g = shopPrice(id);
          if(SV.bag.length >= BAG_MAX){ SFX.warn(); toast('R','🎒','いっぱいです','持ち込みは ' + BAG_MAX + ' 個までです',2000); return; }
          if(SV.gold < g){ SFX.warn(); toast('R','🪙','ゴールドが足りません','対戦するとたまります',2000); return; }
          SV.gold -= g; SV.bag.push(id); saveNow(); SFX.buy(); render();
        };
      });
      el.querySelectorAll('.bagchip').forEach(b=>{
        b.onclick = ()=>{
          const k = +b.dataset.drop, id = SV.bag[k];
          SV.bag.splice(k,1); SV.gold += Math.round(shopPrice(id)*0.7);   // 返品は7割
          saveNow(); SFX.click(); render();
        };
      });
      el.querySelector('#roomGo').onclick = ()=>{ SFX.click(); resolve(true); };
      el.querySelector('#roomBack').onclick = ()=>{ SFX.click(); resolve(false); };
    }

    render();
    bgm('room');
    screenTo('room');
  });
}

/* ── カード画面のボタンを実際に動かす ───────────────────────
   押して何も起きないボタンが一番の不信になるので、未実装の所も必ず一言返す */
function krRedraw(){ drawKrGrid(); drawKrLeft(); drawKrCard(); }
function krSellPrice(c, o){ return Math.round(RAR[c.rar].gold * 0.5 + (o.lv-1) * 90); }
function krNextRar(r){ return r==='A' ? 'S' : r==='S' ? 'SS' : null; }

function krWireFoot(el){
  const q = function(id){ return el.querySelector(id); };

  /* 強化：同じカードの重なりを1枚使ってレベルを上げる */
  const up = q('#krUp');
  if(up) up.onclick = function(){
    const c = cardById(krCardSel), o = SV.cards[krCardSel];
    if(!c || !o) return;
    const cost = upCost(o.lv);
    if(o.lv >= 30){ SFX.warn(); toast('R','⬆','レベル最大', c.nm+' はこれ以上あがりません', 2000); return; }
    if(o.dup <= 0){ SFX.warn(); toast('R','⬆','素材が足りません','同じカードをもう1枚引くと強化できます', 2400); return; }
    if(SV.gold < cost){ SFX.warn(); toast('R','🪙','ゴールドが足りません','あと '+(cost-SV.gold).toLocaleString()+' 必要です', 2400); return; }
    SV.gold -= cost; o.dup--; o.lv++; saveNow(); SFX.build(); jingle('levelup');
    krRedraw();
    toast('R','⬆','強化成功', c.nm+' が Lv.'+o.lv+' になりました', 2200);
  };

  /* 売却：ゴールドに換える。装備中と最後の1枚は売らせない */
  const sell = q('#krSell');
  if(sell) sell.onclick = async function(){
    const c = cardById(krCardSel), o = SV.cards[krCardSel];
    if(!c || !o) return;
    if(SV.equip === c.id){ SFX.warn(); toast('R','🚫','装備中は売れません','ほかのカードを装備してからにしてください', 2400); return; }
    if(SV.locks && SV.locks[c.id]){ SFX.warn(); toast('R','🔒','ロック中です','カードの🔓を押すと外せます', 2200); return; }
    if(ownedCards().length <= 1){ SFX.warn(); toast('R','🚫','最後の1枚は売れません','', 2000); return; }
    const g = krSellPrice(c, o);
    const yes = (await modal('<div class="modal"><div class="dark">'
      + '<h3>カードを売りますか？</h3>'
      + '<p>'+esc(c.nm)+'（'+RAR[c.rar].nm+' ／ Lv.'+o.lv+'）</p>'
      + '<div class="big">🪙 '+g.toLocaleString()+'</div>'
      + '<p style="font-size:13px;color:#9FBBD6">売ると元には戻せません</p>'
      + '<div class="btnrow" style="justify-content:center">'
      + '<button class="btn ghost" data-act="no">やめる</button>'
      + '<button class="btn red" data-act="ok">売る</button></div>'
      + '</div></div>')) === 'ok';
    if(!yes) return;
    delete SV.cards[c.id]; SV.gold += g; saveNow(); SFX.coin();
    krCardSel = SV.equip;
    showCards();
    toast('R','🪙','売却しました','+'+g.toLocaleString()+' ゴールド', 2200);
  };

  /* 合成：同じ等級を2枚つかって、1つ上の等級のカードを1枚つくる */
  const fu = q('#krFuse');
  if(fu) fu.onclick = async function(){
    const c = cardById(krCardSel), o = SV.cards[krCardSel];
    if(!c || !o) return;
    if(SV.locks && SV.locks[c.id]){ SFX.warn(); toast('R','🔒','ロック中です','カードの🔓を押すと外せます', 2200); return; }
    const nx = krNextRar(c.rar);
    if(!nx){ SFX.warn(); toast('R','✨','これ以上の等級はありません', RAR[c.rar].nm+' が最高です', 2400); return; }
    const mates = ownedCards().filter(function(x){
      return x.rar === c.rar && x.id !== c.id && SV.equip !== x.id && !(SV.locks && SV.locks[x.id]); });
    if(!mates.length){ SFX.warn();
      toast('R','✨','素材が足りません','同じ '+RAR[c.rar].nm+' のカードがもう1枚要ります', 2600); return; }
    const need = 12000 * (c.rar==='A' ? 1 : 4);
    if(SV.gold < need){ SFX.warn(); toast('R','🪙','ゴールドが足りません','合成には '+need.toLocaleString()+' 必要です', 2600); return; }
    const mate = mates[0];
    const pool = CARDPOOL.filter(function(x){ return x.rar === nx && !SV.cards[x.id]; });
    const got  = pool.length ? pool[(Math.random()*pool.length)|0]
                             : CARDPOOL.filter(function(x){ return x.rar === nx; })[0];
    if(!got){ SFX.warn(); toast('R','✨','合成できる相手がいません','', 2200); return; }
    const yes = (await modal('<div class="modal"><div class="dark">'
      + '<h3>合成しますか？</h3>'
      + '<p>'+esc(c.nm)+' ＋ '+esc(mate.nm)+'</p>'
      + '<div class="big">→ '+RAR[nx].nm+' が1枚</div>'
      + '<p style="font-size:13px;color:#9FBBD6">素材の2枚は無くなります ／ 🪙 '+need.toLocaleString()+'</p>'
      + '<div class="btnrow" style="justify-content:center">'
      + '<button class="btn ghost" data-act="no">やめる</button>'
      + '<button class="btn gold" data-act="ok">合成する</button></div>'
      + '</div></div>')) === 'ok';
    if(!yes) return;
    delete SV.cards[c.id]; delete SV.cards[mate.id]; SV.gold -= need;
    if(SV.cards[got.id]) SV.cards[got.id].dup++; else SV.cards[got.id] = {lv:1, dup:0};
    saveNow(); SFX.gachaRare(); jingle('levelup');
    krCardSel = got.id; showCards();
    toast('R','✨','合成成功！', RAR[nx].nm+' '+got.nm+' を手に入れました', 2800);
  };

  /* 枠の拡張 */
  const plus = q('#krPlus');
  if(plus) plus.onclick = function(){ SFX.click();
    toast('R','🎴','カード枠','いまは全'+CARDPOOL.length+'種類ぶん持てます（拡張は不要です）', 2600); };

  /* 種別タブ。いまはキャラだけなので、それ以外は正直に返す */
  const tabName = ['並べ替え','キャラ','武器','サイコロ','衣装','宝石'];
  Array.prototype.forEach.call(el.querySelectorAll('.kr-tabs .tb'), function(t, i){
    t.onclick = function(){
      SFX.click();
      if(i === 0){ krSortDesc = !krSortDesc; krRedraw();
        toast('R','↕','並べ替え', krSortDesc ? '強い順' : '手に入れた順', 1800); return; }
      if(i === 1){ Array.prototype.forEach.call(el.querySelectorAll('.kr-tabs .tb'),
        function(x){ x.classList.remove('on'); }); t.classList.add('on'); krRedraw(); return; }
      toast('R','🚧', tabName[i]+'はまだありません', 'いまはキャラクターカードだけです', 2400);
    };
  });

  /* 絞り込みのチェック */
  Array.prototype.forEach.call(el.querySelectorAll('.kr-checks label'), function(lb, i){
    lb.onclick = function(ev){
      if(i === 0){ ev.preventDefault(); return; }   // キャラは常に表示
      ev.preventDefault(); SFX.click();
      toast('R','🚧','まだありません','イベントカードとその他は今後追加します', 2400);
    };
  });
}
let krSortDesc = true;

/* ペンダントの付け替え */
function slotPicker(slot, after){
  const owned = PENDANTS.filter(p=>SV.pendants[p.id]);
  let html = '<div class="modal"><div class="deed" style="max-width:660px"><div class="dhd">'
    + '<b>' + (slot+1) + ' 番目の枠に付けるペンダント</b></div><div class="dbd">';
  if(!owned.length){
    html += '<p style="color:#6b5a3c;margin:6px 0 12px">まだペンダントを持っていません。'
         + 'ガチャか対戦の報酬で手に入ります。</p>';
  } else {
    html += '<div class="slotrow" style="grid-template-columns:repeat(4,1fr)">';
    html += '<div class="pslot" data-p="" style="background:rgba(0,0,0,.25)">'
         + '<div class="ic" style="opacity:.4">✕</div><div class="em">外す</div></div>';
    owned.forEach(p=>{
      const used = SV.slots.indexOf(p.id);
      html += '<div class="pslot' + (used===slot?' on':'') + '" data-p="' + p.id + '"'
        + (used>=0 && used!==slot ? ' style="opacity:.4"' : '') + '>'
        + '<div class="ic">' + p.ic + '</div><div class="nm">' + esc(p.nm) + '</div>'
        + (used>=0 && used!==slot ? '<div class="em">' + (used+1) + '番に装備中</div>' : '')
        + '</div>';
    });
    html += '</div>';
    html += '<p style="font-size:12px;color:#6b5a3c;margin-top:10px">'
         + (pendById(SV.slots[slot]) ? esc(pendById(SV.slots[slot]).ds) : '空き枠です') + '</p>';
  }
  html += '<div class="btnrow"><button class="btn gold" data-act="ok">閉じる</button></div>'
       + '</div></div></div>';

  const wrap = $('#modalWrap'), body = $('#modalBody');
  body.innerHTML = html; wrap.classList.add('on');
  body.querySelectorAll('.pslot').forEach(b=>{
    b.onclick = ()=>{
      const id = b.dataset.p || null;
      if(id && SV.slots.indexOf(id) >= 0 && SV.slots.indexOf(id) !== slot){
        SFX.warn(); return;                    // 二重装備はさせない
      }
      SV.slots[slot] = id; saveNow(); SFX.click();
      wrap.classList.remove('on'); after && after();
    };
  });
  body.querySelectorAll('[data-act]').forEach(b=>{
    b.onclick = ()=>{ SFX.click(); wrap.classList.remove('on'); after && after(); };
  });
}


/* ══════════ 韓国版「내아이템」に寄せたカード画面（後勝ちで差し替え） ══════════ */
/* ══════════════════════════════════════════════════════════════
   5-meta.js の showCards / drawCardGrid / drawCardDetail 差し替え版
   「내아이템」レイアウト（左レール＋中央大カード＋右3列グリッド）
   ・kr-item.css を 1c-meta.html の <style> 末尾に貼ってから使う
   ・既存の mkScreen / regPortrait / RAR / CARDPOOL / SV をそのまま使う
   ══════════════════════════════════════════════════════════════ */
let krCardSel = null;

function showCards(){
  krCardSel = krCardSel && SV.cards[krCardSel] ? krCardSel : SV.equip;
  const el = mkScreen('cards', krItemHTML());
  el.classList.add('kr');                       // 背景を紫トークンに切り替える
  el.querySelector('#krBack').onclick = ()=>{ SFX.click(); showHome(); };
  el.querySelector('#krHome').onclick = ()=>{ SFX.click(); showHome(); };
  krWireFoot(el);
  drawKrGrid(); drawKrLeft(); drawKrCard();
  screenTo('cards');
}

function krItemHTML(){
  const own = ownedCards().length, all = CARDPOOL.length;
  return ''
  + '<div class="kr-wrap">'
  /* ── 上部バー ── */
  + '<div class="kr-top">'
  +   '<span class="kr-back" id="krBack">❮</span>'
  +   '<span class="kr-title">マイアイテム</span>'
  +   '<div class="kr-cur">'
  +     '<span class="kr-pill blue"><span class="ic">💎</span><b>'+SV.gem+'</b></span>'
  +     '<span class="kr-pill"><span class="ic">🪙</span><b id="wGold">'+SV.gold.toLocaleString()+'</b></span>'
  +     '<span class="kr-pill"><span class="ic">🃏</span><b>'+own+'/'+all+'</b></span>'
  +     '<span class="kr-pill star"><span class="ic">⭐</span><b>Lv.'+SV.lv+'</b></span>'
  +   '</div>'
  +   '<div class="kr-sys"><i>⚑</i><i>▦<em></em></i><i id="krHome">🏠</i></div>'
  + '</div>'
  /* ── 左カラム ── */
  + '<div class="kr-left"><div class="kr-lhd" id="krLhd"></div>'
  +   '<div class="kr-lgroup" id="krSet"><span class="kr-next"></span></div>'
  +   '<div class="kr-lgroup" id="krOther"></div>'
  + '</div>'
  /* ── 中央 ── */
  + '<div class="kr-stage">'
  +   '<div style="position:relative;display:grid;place-items:center;width:100%;height:100%">'
  +     '<div class="kr-deco">'
  +       '<span style="left:20%;top:4%">💕</span>'
  +       '<span style="left:31%;top:1%;font-size:3vh">❤️</span>'
  +       '<span style="left:57%;top:2%">🎁</span>'
  +       '<span style="left:66%;top:8%;font-size:5vh">⭐</span>'
  +       '<span style="left:16%;top:62%">🎁</span>'
  +       '<span style="left:69%;top:47%">💖</span>'
  +       '<span style="left:72%;top:64%;font-size:3vh">🕶️</span>'
  +       '<span style="left:78%;top:57%;font-size:2.4vh">🎉</span>'
  +     '</div>'
  +     '<div class="kr-card" id="krCard"></div>'
  +   '</div>'
  +   '<div class="kr-cardbar" id="krBar"></div>'
  + '</div>'
  /* ── 右パネル ── */
  + '<div class="kr-right">'
  +   '<div class="kr-tabs">'
  +     '<div class="tb sort">≡↓</div>'
  +     '<div class="tb on">👤<span class="new">NEW</span></div>'
  +     '<div class="tb">🗡<span class="new">NEW</span></div>'
  +     '<div class="tb">🎲</div>'
  +     '<div class="tb">👕<span class="new">NEW</span></div>'
  +     '<div class="tb">💎<span class="new">NEW</span></div>'
  +   '</div>'
  +   '<div class="kr-checks">'
  +     '<label><input type="checkbox" checked><i>✓</i>キャラ</label>'
  +     '<label><input type="checkbox"><i>✓</i>イベント</label>'
  +     '<label><input type="checkbox"><i>✓</i>その他</label>'
  +   '</div>'
  +   '<div class="kr-grid" id="krGrid"></div>'
  +   '<div class="kr-foot">'
  +     '<div class="b" id="krSell">売却</div><div class="b" id="krUp">強化</div>'
  +     '<div class="b" id="krFuse">合成</div>'
  +     '<div class="cnt"><em>'+own+'</em><span>/'+all+'</span></div>'
  +     '<div class="add" id="krPlus">＋</div>'
  +   '</div>'
  + '</div></div>';
}

/* 右の3列グリッド（1枚 = 幅9.53% / 高さ21.6% / 横間隔0.81% / 縦間隔1.6%） */
function drawKrGrid(){
  const g = document.getElementById('krGrid'); g.innerHTML = '';
  CARDPOOL.forEach(c=>{
    const o = SV.cards[c.id];
    const d = document.createElement('div');
    d.className = 'kr-mini' + (o?'':' locked') + (krCardSel===c.id?' on':'');
    d.innerHTML = '<canvas width="150" height="194"></canvas>'
      + '<div class="nb"><span>'+(o?esc(c.nm):'？？？')+'</span></div>'
      + '<span class="rr">'+RAR[c.rar].nm+'</span>'
      + '<span class="st">✹</span>'
      + (SV.equip===c.id?'<span class="eq">装備</span>':'');
    if(o) regPortrait(d.querySelector('canvas'), c.art, c.col, c.id);
    d.onclick = ()=>{ if(!o) return; SFX.click(); krCardSel=c.id; drawKrGrid(); drawKrLeft(); drawKrCard(); };
    g.appendChild(d);
  });
}

/* 左レール（選択カード＋同レアの手持ちを束にして並べる） */
function drawKrLeft(){
  const c = cardById(krCardSel); if(!c) return;
  document.getElementById('krLhd').innerHTML = '<em>'+RAR[c.rar].nm+'</em>'+esc(c.nm);
  const set   = document.getElementById('krSet');
  const other = document.getElementById('krOther');
  const same  = CARDPOOL.filter(x=>SV.cards[x.id] && x.rar===c.rar && x.id!==c.id).slice(0,2);
  const rest  = CARDPOOL.filter(x=>SV.cards[x.id] && x.rar!==c.rar).slice(0,4);
  set.innerHTML = thumb(c,true) + same.map(x=>thumb(x,false,true)).join('') + '<span class="kr-next"></span>';
  other.innerHTML = rest.map(x=>thumb(x,false)).join('');
  [set,other].forEach(box=>box.querySelectorAll('.kr-thumb').forEach(t=>{
    const id = t.dataset.id;
    regPortrait(t.querySelector('canvas'), cardById(id).art, cardById(id).col, id);
    t.onclick = ()=>{ SFX.click(); krCardSel=id; drawKrGrid(); drawKrLeft(); drawKrCard(); };
  }));
}
function thumb(c, on, gold){
  const o = SV.cards[c.id]||{lv:1,dup:0};
  return '<div class="kr-thumb'+(on?' on':'')+(gold?' gold':'')+'" data-id="'+c.id+'">'
    + '<canvas width="150" height="126"></canvas>'
    + '<span class="rr">'+RAR[c.rar].nm+'</span>'
    + '<span class="lv">'+o.lv+'</span>'
    + (o.dup>0?'<span class="pl">+'+o.dup+'</span>':'')
    + '</div>';
}

/* 中央の大カード（実測 350×463px = 幅26.9% / 高さ62.4%） */
function drawKrCard(){
  const c = cardById(krCardSel), o = SV.cards[krCardSel];
  const card = document.getElementById('krCard'), bar = document.getElementById('krBar');
  if(!c || !o){ card.innerHTML=''; bar.innerHTML=''; return; }
  card.innerHTML = '<span class="rank">'+RAR[c.rar].nm+'</span>'
    + '<div class="art"><canvas id="krPic" width="330" height="437"></canvas>'
    +   '<div class="nameband"><b>'+esc(c.nm)+'</b></div></div>'
    + '<div class="side">'
    +   '<b class="warn" id="krEquip" title="このカードを装備する">'
    +     (SV.equip===c.id ? '★' : '▲')+'</b>'
    +   '<b class="lock" id="krLock" title="売却・合成から守る">'
    +     ((SV.locks&&SV.locks[c.id]) ? '🔒' : '🔓')+'</b>'
    +   '<b class="gem" id="krGem" title="宝石">💎</b>'
    + '</div>'
    + '<span class="kr-star">✹</span>';
  regPortrait(document.getElementById('krPic'), c.art, c.col, c.id);
  const eq = document.getElementById('krEquip');
  if(eq) eq.onclick = function(){
    if(SV.equip === c.id){ SFX.warn(); toast('R','★','すでに装備中です','', 1800); return; }
    SV.equip = c.id; saveNow(); SFX.click();
    krRedraw(); toast('R','★','装備しました', c.nm+' で対戦します', 2200);
  };
  const lk = document.getElementById('krLock');
  if(lk) lk.onclick = function(){
    if(!SV.locks) SV.locks = {};
    if(SV.locks[c.id]) delete SV.locks[c.id]; else SV.locks[c.id] = 1;
    saveNow(); SFX.click(); drawKrCard();
    toast('R', SV.locks[c.id] ? '🔒' : '🔓', SV.locks[c.id] ? 'ロックしました' : 'ロックを外しました',
      SV.locks[c.id] ? '売却と合成の素材になりません' : '', 2000);
  };
  const gm = document.getElementById('krGem');
  if(gm) gm.onclick = function(){ SFX.click();
    toast('R','💎','宝石はまだありません','カードに嵌めて能力を足す仕組みは今後追加します', 2600); };
  // 本家（日本版）のカード画面は7つのステータスバーが主役。ここが無いと育てる意味が見えない
  const st = cardStats(c.id, o.lv, SV.equip===c.id ? SV.slots : []);
  bar.innerHTML = '<div class="kr-drop"><span class="no">'+o.lv+'</span>'
    +   '<span class="nm">'+esc(c.nm)+'</span><span class="ar">▲</span></div>'
    + '<div class="kr-stats">'+statRows(st)+'</div>'
    + '<div class="kr-skill"><b>'+esc(c.sk.nm)+'（'+c.sk.uses+'回）</b>'+esc(c.sk.ds)+'</div>'
    + '<div class="kr-chiprow">'
    +   '<div class="kr-chip"><span class="ic" style="color:#F2D06A">S</span><b>合成状況</b></div>'
    +   '<div class="kr-chip"><span class="ic">✹</span><b>成長状況</b></div></div>';
}

</script>
