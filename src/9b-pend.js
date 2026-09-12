
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — ペンダント＆キューブ（9b-pend.js / WP1）
   ──────────────────────────────────────────────────────────────
   ・宣言し直す関数は showPend / showGacha / doGacha だけ（§5）。
     ほかは dkp で始まる内部関数。状態は DKP_S（使う時に作る）。
   ・ペンダントの4タブ（ペンダント／強化／合成／図鑑）。
   ・v10（WP16a）: ガチャ＝タブ「キャラクターカード」「ペンダント」（J39）、各レーンの［提供割合］と
     「あと n 回で確定」（G13）、ラッキーマイレージ、キューブ＝対戦の報酬の箱（J40。showGacha('cube')）。
     キューブの中身は WP12a の dkGiveCube / dkOpenCube（C21）、SV.luckyMile は C26。
   ・遊びの結果（強化・合成・ガチャの抽選）は Math.random。
     見た目だけの乱数は DKFX.rnd()（自動対戦の種を乱さないため）。
   ・DOM に触る初期化は最後の IIFE だけ。
   ══════════════════════════════════════════════════════════════ */

var DKP_S = null;      // 画面の状態
var DKP_N = 0;         // SVG のグラデーション id の連番
/* ペンダントガチャ（本家の値段。等級の割合は当作の数字＝［提供割合］で全部見せる） */
var DKP_PL = {
  pspecial: { nm:'スペシャルペンダント', cur:'💎', one:40, five:180, w:{ A:0.30, S:0.50, SS:0.20 }, col:'special', feat:true,
              ds:'今週の注目ペンダントが出やすい' },
  pnormal:  { nm:'ノーマルペンダント', cur:'🪙', one:10000, five:40000, w:{ A:0.88, S:0.12, SS:0 }, col:'normal',
              ds:'Aクラス以上のペンダントから1個獲得' },
  ppremium: { nm:'プレミアムペンダント', cur:'💎', one:25, five:100, w:{ A:0.60, S:0.34, SS:0.06 }, col:'premium', lucky:true,
              ds:'Sクラス以上が出やすい・1個ごとにラッキーマイレージ +1点' }
};
/* カードパックの説明（値段と割合は 5-meta.js の LANES） */
var DKP_LDS = { normal:'Aクラス以上のカードから1枚獲得', special:'S+クラスが出るカードパック', premium:'Sクラス以上が出やすい・4時間ごとに1回無料' };
/* ラッキーマイレージの交換（10点の段が一番上の等級になるよう S+ 確定） */
var DKP_LUCKY = [
  { k:'l1',  need:1,  nm:'Aクラス以上確定',  w:{ A:0.70, S:0.25, SS:0.05 } },
  { k:'l3',  need:3,  nm:'Sクラス以上確定',  w:{ A:0,    S:0.85, SS:0.15 } },
  { k:'l10', need:10, nm:'S+クラス確定',     w:{ A:0,    S:0,    SS:1 } }
];
/* キューブの種類（ウッド＜シルバー＜ゴールド＜ダイヤ） */
var DKP_CUBEK = {
  wood:   { nm:'ウッドキューブ',   s:'ウッド',   c:['#F0CD98', '#B9814A', '#6E4418'], e:'#FBE3B8' },
  silver: { nm:'シルバーキューブ', s:'シルバー', c:['#FAFCFF', '#C3D0DE', '#6E8196'], e:'#FFFFFF' },
  gold:   { nm:'ゴールドキューブ', s:'ゴールド', c:['#FFF5C8', '#F0B92C', '#A56C06'], e:'#FFF6D0' },
  dia:    { nm:'ダイヤキューブ',   s:'ダイヤ',   c:['#EDFCFF', '#86DAF7', '#2A78BC'], e:'#F2FDFF' }
};
/* 等級ごとの閃光の色と音（ガチャの開封・キューブの開封で等級が一目で分かるように） */
var DKP_RARFX = {
  A:  { c:'#8FD2FF', nm:'A',  sfx:'coin',      burst:'star', n:10, pow:.7 },
  S:  { c:'#C9A0F0', nm:'S',  sfx:'diceDouble', burst:'star', n:18, pow:1 },
  SS: { c:'#FFD24D', nm:'S+', sfx:'gachaRare', burst:'conf', n:28, pow:1.3 }
};

/* ══════════════════════════════════════════════════════════════
   属性（社長のご要望 2026-09-12）
   ──────────────────────────────────────────────────────────────
   ペンダントは「等級＝枠」「属性＝宝石の色・紋・発動の光と音」で見分ける。
   DKP_EL  属性ごとの色・名前・紋・音の系統
   DKP_PE  ペンダント id → 属性（p1〜p8 の色は今までと同じ値にそろえてある）
   DKP_ADD 8種→16種に増やすぶん（PENDANTS へ足す。すでにある時は何もしない）
   DKP_ALIAS 増やしたぶんの「効き目」を、既にある7つの仕掛けのどれに載せるか
             （pendFire＝9h-board.js／WP14 は it.id で分岐するので、pendOf の戻り値の id だけ差し替える。
              本当の id は pid に残す。WP14 が新しい id の分岐を足したら、この差し替えは外してよい）
   ══════════════════════════════════════════════════════════════ */
var DKP_EL = {
  thunder:{ nm:'雷', c:['#FFF7B8','#FFC21F','#9A5A00'], s:'crack' },
  water:  { nm:'水', c:['#DDF6FF','#35B0F0','#0A3F80'], s:'chime' },
  wind:   { nm:'風', c:['#E2FFD6','#38C067','#0C4F24'], s:'whoosh' },
  earth:  { nm:'地', c:['#FFE6C2','#C98636','#4E2A0C'], s:'thud' },
  sun:    { nm:'陽', c:['#FFF0C0','#FF962A','#9A3404'], s:'bell' },
  bloom:  { nm:'花', c:['#FFE4EF','#F07BAC','#84224F'], s:'soft' },
  moon:   { nm:'月', c:['#ECE6FF','#8A72E2','#2A1B66'], s:'low' },
  flame:  { nm:'炎', c:['#FFD6C6','#E6402A','#700B04'], s:'roar' },
  storm:  { nm:'嵐', c:['#E8EEFF','#6C7BE0','#1B2470'], s:'crack' },
  ice:    { nm:'氷', c:['#EAFEFF','#6FE0F0','#0B5E76'], s:'chime' },
  lava:   { nm:'熔', c:['#FFE0B0','#FF6A18','#6B1A02'], s:'roar' },
  dark:   { nm:'闇', c:['#D8D2E8','#5A4A86','#150E2A'], s:'low' },
  light:  { nm:'光', c:['#FFFFFF','#FFE9A8','#A88A2A'], s:'bell' },
  steel:  { nm:'鋼', c:['#F2F6FA','#9AAEC0','#3A4A5A'], s:'thud' },
  star:   { nm:'星', c:['#FFF6FF','#C9A8FF','#4A2A8A'], s:'chime' },
  sand:   { nm:'砂', c:['#FFF4D8','#DCB463','#7A5210'], s:'whoosh' }
};
var DKP_PE = { p1:'thunder', p2:'water', p3:'wind', p4:'earth', p5:'sun', p6:'bloom', p7:'moon', p8:'flame',
               p9:'storm', p10:'ice', p11:'lava', p12:'dark', p13:'light', p14:'steel', p15:'star', p16:'sand' };
var DKP_ADD = [
  { id:'p9',  nm:'嵐雲のペンダント', ic:'🌪', rar:'SS', trg:'onRoll',     p:0.55,
    ds:'サイコロを振るとき、ダブルが出る' },
  { id:'p10', nm:'氷華のペンダント', ic:'❄️', rar:'SS', trg:'onSameTile', p:0.70,
    ds:'相手と同じマスに止まったとき、相手のマーブルの20%を奪う' },
  { id:'p11', nm:'熔岩のペンダント', ic:'🌋', rar:'S',  trg:'onLandmark', p:0.55,
    ds:'ランドマークを建てたとき、同じ辺にいる相手を自分のマスへ引き寄せる' },
  { id:'p12', nm:'常闇のペンダント', ic:'🌑', rar:'S',  trg:'onTollGet',  p:0.42,
    ds:'相手が自分のランドマークに止まったとき束縛し、次の移動でもう一度 通行料を取る' },
  { id:'p13', nm:'聖光のペンダント', ic:'🔆', rar:'S',  trg:'onOwnLand',  p:0.46,
    ds:'自分の都市に止まったとき、同じ辺の自分の別の都市へ跳ぶ' },
  { id:'p14', nm:'鋼鉄のペンダント', ic:'⚙️', rar:'A',  trg:'onBuild',    p:0.34,
    ds:'建設したとき、自分の別の都市の建物がもう1段上がる' },
  { id:'p15', nm:'星屑のペンダント', ic:'🌠', rar:'A',  trg:'onTravel',   p:0.36,
    ds:'ワープのマスで、選ばずに一番得なマスへ即座に移動する' },
  { id:'p16', nm:'砂嵐のペンダント', ic:'🏜', rar:'A',  trg:'onBuild',    p:0.28,
    ds:'建物を3棟以上持っているとき、スタートへ移動して給料を受け取る' }
];
var DKP_ALIAS = { p9:'p8', p10:'p7', p11:'p1', p12:'p2', p13:'p6', p14:'p3', p15:'p5', p16:'p4' };

/* 増やしたペンダントを PENDANTS へ足し、読み込みのときに落ちた分をセーブへ戻す。
   （5-meta.js の loadSave は 9b より前に走るので、その時点では新しい id が「知らない id」として捨てられている） */
function dkpAddPend(){
  if(typeof PENDANTS === 'undefined' || !Array.isArray(PENDANTS)) return;
  var added = 0;
  DKP_ADD.forEach(function(o){
    if(pendById(o.id)) return;
    PENDANTS.push({ id:o.id, nm:o.nm, ic:o.ic, rar:o.rar, trg:o.trg, p:o.p, ds:o.ds });
    added++;
  });
  if(!added) return;
  var raw = (typeof DKP_RAW0 === 'string') ? DKP_RAW0 : null;
  if(!raw) return;
  var o = null;
  try{ o = JSON.parse(raw); }catch(e){ o = null; }
  if(!o || typeof o !== 'object') return;
  var ok = function(id){ return typeof id === 'string' && DKP_ALIAS[id] && pendById(id); }, ch = false;
  var src = (o.pendants && typeof o.pendants === 'object') ? o.pendants : {};
  Object.keys(src).forEach(function(id){
    if(!ok(id) || (SV.pendants && SV.pendants[id])) return;
    var v = src[id] || {};
    SV.pendants[id] = { lv:Math.max(1, Math.min(8, (+v.lv) | 0 || 1)), dup:Math.max(0, (+v.dup) | 0) };
    ch = true;
  });
  var sl = Array.isArray(o.slots) ? o.slots : [];
  for(var i = 0; i < 4; i++){
    if(SV.slots[i] || !ok(sl[i]) || !SV.pendants[sl[i]] || SV.slots.indexOf(sl[i]) >= 0) continue;
    SV.slots[i] = sl[i]; ch = true;
  }
  var bm = (o.book && o.book.pmax && typeof o.book.pmax === 'object') ? o.book.pmax : {};
  Object.keys(bm).forEach(function(id){
    if(!ok(id)) return;
    if(!SV.book.pmax || typeof SV.book.pmax !== 'object') SV.book.pmax = {};
    if(!(SV.book.pmax[id] >= 1)){ SV.book.pmax[id] = Math.max(1, Math.min(8, (+bm[id]) | 0 || 1)); ch = true; }
  });
  if(o.aim && ok(o.aim.pend) && !SV.aim.pend){ SV.aim.pend = o.aim.pend; ch = true; }
  var fp = (o.fail && o.fail.pend && typeof o.fail.pend === 'object') ? o.fail.pend : {};
  Object.keys(fp).forEach(function(id){
    if(!ok(id) || SV.fail.pend[id] >= 0) return;
    var v = (+fp[id]) | 0; if(v > 0){ SV.fail.pend[id] = v; ch = true; }
  });
  (Array.isArray(o.seen) ? o.seen : []).forEach(function(id){
    if(ok(id) && SV.seen.indexOf(id) < 0){ SV.seen.push(id); ch = true; }
  });
  if(ch) saveNow();
}
/* pendOf のラッパ：増やしたペンダントの id を、pendFire（WP14）が知っている id に見せかける。
   名前・絵文字・等級・確率は本物のまま（帯やパネルの表示は正しい）。本当の id は pid に残す */
var DKP_pendOf0 = (typeof pendOf === 'function') ? pendOf : null;
if(DKP_pendOf0){
  pendOf = function(pi, trg){
    var it = DKP_pendOf0.apply(this, arguments);
    if(!it || !DKP_ALIAS[it.id]) return it;
    var o = Object.assign({}, it);
    o.pid = it.id; o.el = DKP_PE[it.id] || '';
    o.id = DKP_ALIAS[it.id];
    return o;
  };
}
/* 読み込んだ直後のセーブの写し。9b（ペンダント）と 9c（サイコロ）の修理が、
   おたがいの saveNow で相手の分を消してしまわないように、書き換える前に1回だけ取っておく */
var DKP_RAW0 = (function(){ try{ return localStorage.getItem(SAVE_KEY); }catch(e){ return null; } })();
try{ dkpAddPend(); }catch(e){ console.error('[WP16a]', e); }
/* 属性（WP14 が発動の演出を属性ごとに変える時は typeof dkpElem === 'function' で確かめて呼ぶ）
   → {key, nm, c:[明,中,暗], s:音の系統} ／ 知らない id は id の文字で散らして必ず何かを返す */
function dkpElem(id){
  var k = DKP_PE[id];
  if(!k){
    var ks = Object.keys(DKP_EL), n = 0, s = String(id || '');
    for(var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    k = ks[n % ks.length];
  }
  var e = DKP_EL[k];
  return { key:k, nm:e.nm, c:e.c.slice(), s:e.s };
}

function dkpS(){
  if(!DKP_S) DKP_S = { tab:'pend', sel:null, sort:'rar', prevTab:'', upTgt:null, mats:[],
    mixA:null, mixB:null, mixRes:null, busy:false, pull:null, scr:'', after:null, gtab:'card', cres:null };
  return DKP_S;
}

/* ══════════ 小道具 ══════════ */
function dkpSfx(n, a){ try{ if(typeof SFX === 'object' && SFX && typeof SFX[n] === 'function') SFX[n](a); }catch(e){} }
function dkpFmt(v){ return (Math.round(+v) || 0).toLocaleString(); }
function dkpPct(v){ return Math.round((+v || 0) * 100); }
function dkpRank(r){ return r === 'SS' ? 3 : r === 'S' ? 2 : 1; }
function dkpRarNm(r){ return r === 'SS' ? 'S+' : (r || 'A'); }
function dkpShort(p){ return String(p && p.nm || '').replace(/のペンダント$/, ''); }
function dkpTrg(t){
  return ({ onLandmark:'ランドマークを建てた時', onTollGet:'通行料を受け取る時', onBuild:'建設した時',
    onTravel:'ワープのマス', onOwnLand:'自分の都市に止まった時', onSameTile:'相手と同じマス',
    onRoll:'サイコロを振る時' })[t] || '対戦中';
}
function dkpSrc(r){
  if(r === 'SS') return 'ペンダントガチャ（スペシャル・プレミアム）／Sの+7を2つ合成';
  if(r === 'S')  return 'ペンダントガチャ／Aの+7を2つ合成';
  return 'ペンダントガチャ／カードパックのおまけ';
}
/* ══════════ 属性の発動演出（すべて一度きり。常時アニメは1つも増やさない） ══════════ */
var DKP_NZ = null;
/* 属性ごとの音（今の効果音の音程とフィルタを変えた合成。音が止めてある時は黙る） */
function dkpElemSnd(key){
  try{
    if(typeof soundOn !== 'undefined' && !soundOn) return;
    var a = (typeof AC !== 'undefined') ? AC : null;
    if(!a || !a.createOscillator || a.state === 'closed') return;
    var t = a.currentTime + 0.01, out = a.createGain();
    out.gain.value = (typeof sfxVol === 'number') ? sfxVol : 0.7;
    out.connect(a.destination);
    var tone = function(type, f, f2, dur, v, at){
      var o = a.createOscillator(), gn = a.createGain(), t0 = t + (at || 0);
      o.type = type; o.frequency.setValueAtTime(f, t0);
      if(f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(v, t0 + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gn); gn.connect(out); o.start(t0); o.stop(t0 + dur + 0.02);
    };
    var nz = function(f, q, dur, v, at){
      var b = DKP_NZ;
      if(!b || b.sampleRate !== a.sampleRate){
        b = a.createBuffer(1, Math.floor(a.sampleRate * 0.6), a.sampleRate);
        var ch = b.getChannelData(0);
        for(var i = 0; i < ch.length; i++) ch[i] = DKFX.rnd() * 2 - 1;
        DKP_NZ = b;
      }
      var s = a.createBufferSource(), fl = a.createBiquadFilter(), gn = a.createGain(), t0 = t + (at || 0);
      s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
      gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(v, t0 + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(fl); fl.connect(gn); gn.connect(out); s.start(t0); s.stop(t0 + dur + 0.02);
    };
    var s = (DKP_EL[key] || {}).s || 'bell';
    if(s === 'crack'){ nz(2600, 0.9, 0.06, 0.16); tone('square', 180, 60, 0.22, 0.08, 0.02); nz(1200, 0.6, 0.2, 0.06, 0.04); }
    else if(s === 'chime'){ tone('sine', 1568, 0, 0.5, 0.13); tone('sine', 2349, 0, 0.38, 0.07, 0.06); tone('sine', 3136, 0, 0.28, 0.04, 0.12); }
    else if(s === 'whoosh'){ nz(900, 0.5, 0.34, 0.12); nz(2200, 0.8, 0.2, 0.07, 0.08); }
    else if(s === 'thud'){ tone('sine', 110, 55, 0.34, 0.18); nz(300, 0.7, 0.09, 0.09); }
    else if(s === 'bell'){ tone('triangle', 1046, 0, 0.6, 0.12); tone('sine', 1568, 0, 0.45, 0.06, 0.05); tone('sine', 2093, 0, 0.3, 0.03, 0.1); }
    else if(s === 'soft'){ tone('sine', 784, 988, 0.34, 0.1); tone('sine', 1319, 0, 0.26, 0.05, 0.08); }
    else if(s === 'low'){ tone('sine', 220, 82, 0.66, 0.13); tone('triangle', 110, 55, 0.7, 0.07); nz(420, 0.6, 0.4, 0.04); }
    else { tone('sawtooth', 180, 90, 0.4, 0.1); nz(700, 0.5, 0.3, 0.08); tone('sine', 330, 140, 0.3, 0.05, 0.06); }
    setTimeout(function(){ try{ out.disconnect(); }catch(e){} }, 1500);
  }catch(e){}
}
/* 属性ごとの発動の見せ方（雷＝閃光、氷＝結晶、炎＝火の粉…）。粒と WAAPI の一度きりだけ */
function dkpElemPlay(at, id){
  var e = dkpElem(id), p = fxPt(at);
  dkpElemSnd(e.key);
  if(DKFX.reduced) return;
  fxBurst(p, { kind:(e.s === 'chime' || e.s === 'bell') ? 'star' : 'conf',
    n:(DKFX.mob ? 10 : 20), power:1.1, color:e.c[1] });
  var d = document.createElement('i');
  d.className = 'dkp-elfx dkp-f-' + e.s;
  d.style.left = p.x.toFixed(1) + 'px'; d.style.top = p.y.toFixed(1) + 'px';
  d.style.setProperty('--e1', e.c[0]); d.style.setProperty('--e2', e.c[1]); d.style.setProperty('--e3', e.c[2]);
  DKFX.layer().appendChild(d);
  var kill = function(){ if(d.parentNode) d.parentNode.removeChild(d); };
  try{
    var an = d.animate([{ transform:'translate(-50%,-50%) scale(.35) rotate(0deg)', opacity:0 },
                        { transform:'translate(-50%,-50%) scale(1) rotate(10deg)', opacity:1, offset:.3 },
                        { transform:'translate(-50%,-50%) scale(1.5) rotate(24deg)', opacity:0 }],
                       { duration:(DKFX.skip ? 220 : 760), easing:'cubic-bezier(.2,.8,.4,1)', fill:'both' });
    an.onfinish = kill;
  }catch(err){}
  setTimeout(kill, 1600);
}
/* 等級・キューブの種類ごとの閃光（一度きり。画面いっぱいの常時アニメは足さない） */
function dkpFlashCol(hostId, col){
  var st = document.getElementById(hostId);
  if(!st || DKFX.reduced) return;
  var f = st.querySelector(':scope > .dkp-gfl');
  if(!f){ f = document.createElement('i'); f.className = 'dkp-gfl'; f.setAttribute('aria-hidden', 'true'); st.appendChild(f); }
  f.style.setProperty('--gc', col);
  try{ f.animate([{ opacity:0 }, { opacity:.9, offset:.16 }, { opacity:0 }], { duration:(DKFX.skip ? 140 : 420), easing:'ease-out' }); }catch(e){}
}
/* 属性の札（一覧・詳細・図鑑・開封で共通） */
function dkpElChip(p, cls){
  if(!p) return '';
  var e = dkpElem(p.id);
  return '<span class="dkp-elc dkp-e-' + e.key + (cls ? ' ' + cls : '')
    + '" style="--e1:' + e.c[0] + ';--e2:' + e.c[1] + ';--e3:' + e.c[2] + '">'
    + '<i class="dkp-eli"><svg viewBox="0 0 40 40" aria-hidden="true">' + dkpEmblem(p.id) + '</svg></i>'
    + '<b>' + esc(e.nm) + '</b></span>';
}

/* 装着中のカードで開いている枠の数（C06 dkPendSlots。A2・S/S+4） */
function dkpSlotsOpen(){
  var n = 4;
  try{ if(typeof dkPendSlots === 'function') n = dkPendSlots(SV.equip); }catch(e){ n = 4; }
  n = Math.floor(+n);
  return (n >= 0 && n <= 4) ? n : 4;
}
/* 枠 i を開けるのに要る等級の文言（例「Sクラス以上のカードで開放」） */
function dkpLockTx(i){
  var rs = ['A', 'S', 'SS'];
  for(var k = 0; k < rs.length; k++){
    var c = CARDPOOL.filter(function(x){ return x.rar === rs[k]; })[0], n = 4;
    try{ if(c && typeof dkPendSlots === 'function') n = +dkPendSlots(c.id); }catch(e){}
    if(c && n > i) return dkpRarNm(rs[k]) + 'クラス以上のカードで開放';
  }
  return 'この枠は使えません';
}
function dkpLuckyN(){ var v = +SV.luckyMile; return (v > 0 && isFinite(v)) ? Math.floor(v) : 0; }
/* プレミアムペンダントの無料（4時間ごと。カードパックの SV.freeAt とは別） */
function dkpPFreeLeft(){
  var at = +SV.pfreeAt; if(!(at > 0) || !isFinite(at)) at = 0;
  var ms = 4 * 3600 * 1000 - (Date.now() - at);
  return ms <= 0 ? 0 : ms;
}
function dkpOwn(id){ return !!(SV.pendants && SV.pendants[id] && pendById(id)); }
function dkpLv(id){
  var o = SV.pendants && SV.pendants[id], v = o ? (o.lv | 0) : 1;
  return Math.max(1, Math.min(8, v || 1));
}
function dkpDup(id){ var o = SV.pendants && SV.pendants[id]; return o ? Math.max(0, o.dup | 0) : 0; }
function dkpEffP(id, lv){
  var p = pendById(id); if(!p) return 0;
  return Math.min(0.95, p.p * dkPendMul(lv || dkpLv(id)));
}
function dkpOwnList(sort){
  var L = PENDANTS.filter(function(p){ return dkpOwn(p.id); });
  var ix = function(p){ return PENDANTS.indexOf(p); };
  L.sort(function(a, b){
    if(sort === 'lv')  return (dkpLv(b.id) - dkpLv(a.id)) || (dkpRank(b.rar) - dkpRank(a.rar)) || (ix(a) - ix(b));
    if(sort === 'dup') return (dkpDup(b.id) - dkpDup(a.id)) || (dkpRank(b.rar) - dkpRank(a.rar)) || (ix(a) - ix(b));
    return (dkpRank(b.rar) - dkpRank(a.rar)) || (dkpLv(b.id) - dkpLv(a.id)) || (ix(a) - ix(b));
  });
  return L;
}
/* 画面が目の前にあるか（ワイプ中でも行き先で判断する） */
function dkpOnScr(id){
  var S = dkpS();
  if(S.scr) return S.scr === id;
  var el = document.getElementById(id);
  return !!(el && el.classList.contains('on'));
}
function dkpBusy(on){
  var S = dkpS(); S.busy = !!on;
  ['pend', 'gacha', 'cube'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.classList.toggle('dkp-busy', !!on);
  });
}

/* ══════════ 絵（SVG で自作） ══════════ */
/* 宝石の色は属性で決まる（p1〜p8 は今までと同じ値） */
function dkpGem(id){ return dkpElem(id).c; }
function dkpStar(cx, cy, ro, ri, n){
  var s = '';
  for(var i = 0; i < n * 2; i++){
    var a = Math.PI * i / n - Math.PI / 2, r = (i % 2) ? ri : ro;
    s += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1) + ' ';
  }
  return s + 'Z';
}
/* 属性ごとの紋（40×40 の枠）。16種が一目で見分けられるように形を変える */
function dkpEmblem(id){
  var st = ' fill="#FFFDF4" stroke="rgba(40,20,4,.55)" stroke-width="1.6" stroke-linejoin="round"';
  var k = dkpElem(id).key;
  if(k === 'thunder') return '<path' + st + ' d="M24 2 L8 23 H18 L14 38 L33 14 H22 L27 2 Z"/>';
  if(k === 'water') return '<path' + st + ' d="M20 3 L35 18 L20 37 L5 18 Z"/>'
    + '<path d="M5 18 H35 M20 3 L14 18 L20 37 L26 18 Z" fill="none" stroke="rgba(40,20,4,.45)" stroke-width="1.3"/>';
  if(k === 'wind') return '<g' + st + '><circle cx="20" cy="11" r="8"/><circle cx="11" cy="23" r="8"/><circle cx="29" cy="23" r="8"/></g>'
    + '<path d="M20 24 Q22 32 16 38" fill="none" stroke="#FFFDF4" stroke-width="3.2" stroke-linecap="round"/>';
  if(k === 'earth') return '<path' + st + ' d="M2 34 L14 13 L20 22 L27 9 L38 34 Z"/><path d="M24 15 L27 9 L30 15 Z" fill="rgba(150,110,60,.7)"/>';
  if(k === 'sun') return '<path' + st + ' d="' + dkpStar(20, 20, 19, 11, 8) + '"/>'
    + '<circle cx="20" cy="20" r="7.5" fill="#FFC45A" stroke="rgba(40,20,4,.45)" stroke-width="1.3"/>';
  if(k === 'bloom') return '<g' + st + '>' + [0, 72, 144, 216, 288].map(function(a){
      return '<ellipse cx="20" cy="10.5" rx="6.6" ry="9.5" transform="rotate(' + a + ' 20 20)"/>'; }).join('')
    + '</g><circle cx="20" cy="20" r="4" fill="#FFD24D"/>';
  if(k === 'moon') return '<path' + st + ' d="M25 3 A17 17 0 1 0 37 29 A13 13 0 1 1 25 3 Z"/>';
  if(k === 'flame') return '<path' + st + ' d="M20 2 C24 11 34 16 31 27 C29 34 24 38 20 38 C13 38 8 33 9 25 C10 18 15 16 16 9 C19 13 18 18 21 20 C23 14 21 8 20 2 Z"/>';
  /* ここから増やしたぶん（8種） */
  if(k === 'storm') return '<path d="M6 14 Q6 6 14 6 Q18 1 24 3 Q33 3 34 11 Q39 13 38 19 Q37 24 31 24 H11 Q5 23 6 14 Z"' + st + '/>'
    + '<path d="M22 22 L14 34 H20 L17 39 L28 27 H21 L24 22 Z" fill="#FFE9A8" stroke="rgba(40,20,4,.5)" stroke-width="1.3" stroke-linejoin="round"/>';
  if(k === 'ice') return '<g fill="none" stroke="#FFFDF4" stroke-width="3" stroke-linecap="round">'
    + [0, 60, 120].map(function(a){ return '<path d="M20 2 V38" transform="rotate(' + a + ' 20 20)"/>'; }).join('')
    + [0, 60, 120, 180, 240, 300].map(function(a){ return '<path d="M20 8 l-5 5 M20 8 l5 5" transform="rotate(' + a + ' 20 20)"/>'; }).join('')
    + '</g><circle cx="20" cy="20" r="3.6" fill="#FFFDF4"/>';
  if(k === 'lava') return '<path' + st + ' d="M3 36 L15 15 L20 22 L26 11 L37 36 Z"/>'
    + '<path d="M26 11 C29 16 24 18 26 23 C30 20 33 24 32 28" fill="none" stroke="#FF8A3A" stroke-width="2.6" stroke-linecap="round"/>'
    + '<circle cx="26" cy="8" r="3.4" fill="#FFD24D" stroke="rgba(40,20,4,.5)" stroke-width="1.2"/>';
  if(k === 'dark') return '<circle cx="20" cy="20" r="16" fill="#1A1228" stroke="#FFFDF4" stroke-width="2.4"/>'
    + '<path d="M20 4 A16 16 0 0 1 20 36 A11 11 0 0 0 20 4 Z" fill="#FFFDF4" opacity=".9"/>'
    + '<circle cx="20" cy="20" r="4.2" fill="#C8B8F0"/>';
  if(k === 'light') return '<g fill="#FFFDF4" stroke="rgba(40,20,4,.45)" stroke-width="1.2">'
    + [0, 45, 90, 135].map(function(a){ return '<rect x="18.4" y="1" width="3.2" height="38" rx="1.6" transform="rotate(' + a + ' 20 20)"/>'; }).join('')
    + '</g><circle cx="20" cy="20" r="8.5" fill="#FFFDF4" stroke="rgba(40,20,4,.55)" stroke-width="1.6"/>'
    + '<circle cx="20" cy="20" r="4" fill="#FFD24D"/>';
  if(k === 'steel') return '<path' + st + ' d="' + dkpStar(20, 20, 19, 13.5, 8) + '"/>'
    + '<circle cx="20" cy="20" r="8" fill="#2A3442" stroke="rgba(40,20,4,.5)" stroke-width="1.4"/>'
    + '<circle cx="20" cy="20" r="3.4" fill="#CFDCE8"/>';
  if(k === 'star') return '<path' + st + ' d="' + dkpStar(20, 19, 18, 7.5, 5) + '"/>'
    + '<path d="M20 26 L20 38" fill="none" stroke="#FFFDF4" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>';
  if(k === 'sand') return '<path' + st + ' d="M8 3 H32 L22 20 L32 37 H8 L18 20 Z"/>'
    + '<path d="M12 7 H28 L20 20 Z" fill="#DCB463"/><path d="M20 20 L27 33 H13 Z" fill="#DCB463"/>';
  return '';
}
/* ペンダントの絵（金の縁・宝石・紋）。opt={size, plus, rt, cls, svg} */
function dkpMedalSVG(p){
  var n = ++DKP_N, id = 'dkpm' + n, el = dkpElem(p.id), c = el.c;
  /* 枠は等級（A＝銀・S＝金銀・S+＝金）。台座の粒は属性の色（等級と種類を一度に見分ける） */
  var rim = p.rar === 'SS' ? ['#FFF7D6', '#F5CC4E', '#A36F0B', '#4A2E02']
          : p.rar === 'S'  ? ['#FFF1C8', '#DDB04E', '#86591A', '#35230A']
          :                  ['#F4F8FF', '#B9CCE2', '#62809F', '#1E2C40'];
  var dots = '', i, a;
  if(p.rar === 'SS'){
    for(i = 0; i < 8; i++){
      a = Math.PI * i / 4 + Math.PI / 8;
      dots += '<circle cx="' + (60 + 50 * Math.cos(a)).toFixed(1) + '" cy="' + (72 + 50 * Math.sin(a)).toFixed(1)
        + '" r="3.6" fill="' + (i % 2 ? c[0] : c[1]) + '" stroke="#FFF3C8" stroke-width="1.2"/>';
    }
  } else {
    for(i = 0; i < 4; i++){
      a = Math.PI * i / 2 + Math.PI / 4;
      dots += '<circle cx="' + (60 + 50 * Math.cos(a)).toFixed(1) + '" cy="' + (72 + 50 * Math.sin(a)).toFixed(1)
        + '" r="3" fill="' + (p.rar === 'S' ? c[1] : c[0]) + '" stroke="' + rim[3] + '" stroke-width="1"/>';
    }
  }
  return '<svg viewBox="0 0 120 130" aria-hidden="true" focusable="false"><defs>'
    + '<radialGradient id="' + id + 'g" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/>'
    +   '<stop offset=".16" stop-color="' + c[0] + '"/><stop offset=".55" stop-color="' + c[1] + '"/>'
    +   '<stop offset="1" stop-color="' + c[2] + '"/></radialGradient>'
    + '<linearGradient id="' + id + 'm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + rim[0] + '"/>'
    +   '<stop offset=".3" stop-color="' + rim[1] + '"/><stop offset=".62" stop-color="' + rim[2] + '"/>'
    +   '<stop offset=".85" stop-color="' + rim[1] + '"/><stop offset="1" stop-color="' + rim[0] + '"/></linearGradient>'
    + '</defs>'
    + '<rect x="51" y="3" width="18" height="18" rx="9" fill="none" stroke="url(#' + id + 'm)" stroke-width="5"/>'
    + '<circle cx="60" cy="72" r="55" fill="url(#' + id + 'm)" stroke="' + rim[3] + '" stroke-width="3"/>'
    + '<circle cx="60" cy="72" r="46.5" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.4"/>'
    + dots
    + '<circle cx="60" cy="72" r="43" fill="' + rim[3] + '"/>'
    + '<path d="M42 38 H78 L94 54 V90 L78 106 H42 L26 90 V54 Z" fill="url(#' + id + 'g)" stroke="rgba(255,255,255,.6)" stroke-width="2"/>'
    + '<path d="M44 46 H76 L86 56 V88 L76 98 H44 L34 88 V56 Z" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.32)" stroke-width="1.2"/>'
    + '<path d="M42 38 H78 L70 50 H50 Z" fill="rgba(255,255,255,.42)"/>'
    + '<path d="M94 54 V90 L82 84 V60 Z" fill="rgba(0,0,0,.16)"/>'
    + '<path d="M42 106 H78 L70 94 H50 Z" fill="rgba(0,0,0,.22)"/>'
    + '<path d="M26 54 V90 L38 84 V60 Z" fill="rgba(255,255,255,.14)"/>'
    + '<g transform="translate(40 52)">' + dkpEmblem(p.id) + '</g>'
    + '<path d="M37 45 l2.2 6 6 2.2 -6 2.2 -2.2 6 -2.2 -6 -6 -2.2 6 -2.2z" fill="#FFFFFF" opacity=".92"/>'
    + '</svg>';
}
function dkpMedal(p, opt){
  opt = opt || {};
  if(!p) return '';
  var sz = opt.size || 96, e = dkpElem(p.id);
  var plus = (typeof opt.plus === 'number') ? '<b class="dkp-plus' + (opt.plus >= 7 ? ' mx' : '') + '">+' + opt.plus + '</b>' : '';
  var rt = opt.rt ? '<i class="dkp-rt r' + p.rar + '">' + dkpRarNm(p.rar) + '</i>' : '';
  return '<span class="dkp-medal r' + p.rar + ' dkp-e-' + e.key + (opt.cls ? ' ' + opt.cls : '')
    + '" style="--ms:' + sz + 'px;--e1:' + e.c[0] + ';--e2:' + e.c[1] + ';--e3:' + e.c[2] + '">'
    + dkpMedalSVG(p) + rt + plus + '</span>';
}
/* 王冠とサイコロの紋章（カードの裏・見出しの飾り） */
function dkpCrest(){
  var n = ++DKP_N, g = 'dkpc' + n;
  return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>'
    + '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7DC"/>'
    + '<stop offset=".45" stop-color="#F0C04A"/><stop offset="1" stop-color="#8A5A08"/></linearGradient></defs>'
    + '<circle cx="50" cy="50" r="45" fill="rgba(40,24,4,.35)" stroke="url(#' + g + ')" stroke-width="4"/>'
    + '<circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,240,200,.45)" stroke-width="1.5" stroke-dasharray="3 4"/>'
    + '<path d="M22 56 L26 30 L38 42 L50 22 L62 42 L74 30 L78 56 Z" fill="url(#' + g + ')" stroke="#4A2E02" stroke-width="2.4" stroke-linejoin="round"/>'
    + '<rect x="22" y="58" width="56" height="10" rx="3" fill="url(#' + g + ')" stroke="#4A2E02" stroke-width="2.4"/>'
    + '<circle cx="50" cy="44" r="4" fill="#E8402A" stroke="#FFF3C8" stroke-width="1.2"/>'
    + '<circle cx="34" cy="48" r="3" fill="#3FA0F0"/><circle cx="66" cy="48" r="3" fill="#3FA0F0"/>'
    + '<rect x="40" y="72" width="20" height="20" rx="4" fill="#FFFDF4" stroke="#4A2E02" stroke-width="2" transform="rotate(12 50 82)"/>'
    + '<circle cx="45" cy="78" r="2" fill="#4A2E02"/><circle cx="50" cy="83" r="2" fill="#C9302C"/><circle cx="55" cy="88" r="2" fill="#4A2E02"/>'
    + '</svg>';
}
function dkpGoldDefs(g){
  return '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C8"/>'
    + '<stop offset=".45" stop-color="#F0C04A"/><stop offset="1" stop-color="#9A6A12"/></linearGradient></defs>';
}
function dkpTabIcon(k){
  var n = ++DKP_N, g = 'dkpt' + n, s = ' fill="url(#' + g + ')" stroke="#2E1C04" stroke-width="2.6" stroke-linejoin="round"';
  if(k === 'pend') return dkpMedalSVG(PENDANTS[1]);
  if(k === 'up') return '<svg viewBox="0 0 60 60" aria-hidden="true">' + dkpGoldDefs(g)
    + '<path' + s + ' d="M8 46 H52 L47 54 H13 Z"/><path' + s + ' d="M12 38 H48 Q50 44 44 46 H16 Q10 44 12 38 Z"/>'
    + '<g transform="rotate(-38 30 22)"><rect x="16" y="6" width="28" height="12" rx="3"' + s + '/>'
    + '<rect x="27" y="17" width="6" height="22" rx="3" fill="#8A5A2A" stroke="#2E1C04" stroke-width="2.4"/></g>'
    + '<path d="M47 24 l6 -4 M49 31 l7 1 M44 18 l2 -7" stroke="#FFE08A" stroke-width="3" stroke-linecap="round"/></svg>';
  if(k === 'mix') return '<svg viewBox="0 0 60 60" aria-hidden="true">' + dkpGoldDefs(g)
    + '<path d="M8 20 L15 12 L22 20 L15 30 Z" fill="#6FC6F5" stroke="#2E1C04" stroke-width="2.2" stroke-linejoin="round"/>'
    + '<path d="M38 20 L45 12 L52 20 L45 30 Z" fill="#6FC6F5" stroke="#2E1C04" stroke-width="2.2" stroke-linejoin="round"/>'
    + '<path d="M17 30 Q30 42 43 30" fill="none" stroke="#FFE08A" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 4"/>'
    + '<path' + s + ' d="M19 42 L30 32 L41 42 L30 57 Z"/><path d="M30 32 L27 42 L30 57 M19 42 H41" fill="none" stroke="#2E1C04" stroke-width="1.4"/></svg>';
  if(k === 'book') return '<svg viewBox="0 0 60 60" aria-hidden="true">' + dkpGoldDefs(g)
    + '<path d="M6 14 Q18 9 30 16 Q42 9 54 14 V48 Q42 43 30 50 Q18 43 6 48 Z" fill="#F4E4C0" stroke="#2E1C04" stroke-width="2.6" stroke-linejoin="round"/>'
    + '<path d="M30 16 V50" stroke="#2E1C04" stroke-width="2.4"/>'
    + '<path d="M12 22 Q20 19 26 23 M12 30 Q20 27 26 31 M34 23 Q40 19 48 22 M34 31 Q40 27 48 30" fill="none" stroke="#A9761A" stroke-width="2" stroke-linecap="round"/>'
    + '<path' + s + ' d="M24 46 L36 46 L36 58 L30 54 L24 58 Z"/></svg>';
  return '';
}
function dkpLaneCol(k){
  if(k === 'normal')  return { a:'#F4F9FF', b:'#A9C4E0', c:'#4E6A88', gem:'#8FD2FF', glow:'rgba(150,200,255,.34)' };
  if(k === 'special') return { a:'#FFB4A6', b:'#D8392C', c:'#7A120A', gem:'#FFD24D', glow:'rgba(255,96,72,.3)' };
  return { a:'#FFF3BE', b:'#F0B92C', c:'#9A6406', gem:'#FF6A5E', glow:'rgba(255,208,96,.4)' };
}
function dkpStar4(x, y, r){
  var q = (r * 0.28).toFixed(1);
  return '<path d="M' + x + ' ' + (y - r) + ' L' + (x + +q) + ' ' + (y - +q) + ' L' + (x + r) + ' ' + y + ' L' + (x + +q) + ' ' + (y + +q)
    + ' L' + x + ' ' + (y + r) + ' L' + (x - +q) + ' ' + (y + +q) + ' L' + (x - r) + ' ' + y + ' L' + (x - +q) + ' ' + (y - +q) + ' Z" fill="#FFFFFF"/>';
}
/* カードパック（ギザギザの封・後ろにカード2枚・王冠の紋） */
function dkpPackSVG(k){
  var n = ++DKP_N, g = 'dkpk' + n, c = dkpLaneCol(k), top = 'M22 27', bot = '', i, w = 7.6;
  for(i = 0; i < 10; i++) top += ' L' + (22 + w * (i + .5)).toFixed(1) + ' 20 L' + (22 + w * (i + 1)).toFixed(1) + ' 27';
  for(i = 10; i > 0; i--) bot += ' L' + (22 + w * (i - .5)).toFixed(1) + ' 131 L' + (22 + w * (i - 1)).toFixed(1) + ' 124';
  return '<svg viewBox="0 0 120 140" aria-hidden="true" focusable="false"><defs>'
    + '<linearGradient id="' + g + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.a + '"/><stop offset=".48" stop-color="' + c.b + '"/><stop offset="1" stop-color="' + c.c + '"/></linearGradient>'
    + '<linearGradient id="' + g + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7DC"/><stop offset=".5" stop-color="#E7B94A"/><stop offset="1" stop-color="#8A5A08"/></linearGradient></defs>'
    + '<rect x="18" y="18" width="60" height="90" rx="7" transform="rotate(-16 48 63)" fill="#F4E3BD" stroke="#4A2E06" stroke-width="3"/>'
    + '<rect x="42" y="16" width="60" height="90" rx="7" transform="rotate(14 72 61)" fill="#FBEFD2" stroke="#4A2E06" stroke-width="3"/>'
    + '<path d="' + top + ' L98 124' + bot + ' Z" fill="url(#' + g + 'a)" stroke="#2A1604" stroke-width="3.2" stroke-linejoin="round"/>'
    + '<rect x="22" y="27" width="76" height="9" fill="url(#' + g + 'b)"/><rect x="22" y="115" width="76" height="9" fill="url(#' + g + 'b)"/>'
    + '<path d="M22 64 L58 36 L76 36 L22 92 Z" fill="#FFFFFF" opacity=".2"/>'
    + '<circle cx="60" cy="76" r="25" fill="rgba(24,12,2,.55)" stroke="url(#' + g + 'b)" stroke-width="3.4"/>'
    + '<path d="M45 84 L47 66 L55 74 L60 60 L65 74 L73 66 L75 84 Z" fill="url(#' + g + 'b)" stroke="#3A2405" stroke-width="2" stroke-linejoin="round"/>'
    + '<circle cx="60" cy="77" r="3.4" fill="' + c.gem + '" stroke="#FFF3C8" stroke-width="1.2"/>'
    + dkpStar4(90, 46, 7) + '</svg>';
}
/* 宝箱（ペンダントガチャ。帯の色でレーンを見分ける） */
function dkpChestSVG(k){
  var n = ++DKP_N, g = 'dkpx' + n, c = dkpLaneCol(k);
  return '<svg viewBox="0 0 140 130" aria-hidden="true" focusable="false"><defs>'
    + '<linearGradient id="' + g + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B07A44"/><stop offset=".55" stop-color="#7A4C22"/><stop offset="1" stop-color="#4A2C10"/></linearGradient>'
    + '<linearGradient id="' + g + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.a + '"/><stop offset=".5" stop-color="' + c.b + '"/><stop offset="1" stop-color="' + c.c + '"/></linearGradient>'
    + '<radialGradient id="' + g + 'g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".45" stop-color="rgba(255,220,130,.55)"/><stop offset="1" stop-color="rgba(255,200,90,0)"/></radialGradient></defs>'
    + '<ellipse cx="70" cy="52" rx="60" ry="42" fill="url(#' + g + 'g)"/>'
    + '<path d="M18 60 Q18 22 70 20 Q122 22 122 60 Z" fill="url(#' + g + 'w)" stroke="#2A1604" stroke-width="3" stroke-linejoin="round"/>'
    + '<path d="M33 60 L33 32 Q37 26 44 24 L44 60 Z M96 24 Q103 26 107 32 L107 60 L96 60 Z" fill="url(#' + g + 'b)" stroke="#2A1604" stroke-width="2"/>'
    + '<rect x="15" y="56" width="110" height="10" rx="3" fill="url(#' + g + 'b)" stroke="#2A1604" stroke-width="2.4"/>'
    + '<rect x="20" y="66" width="100" height="46" rx="5" fill="url(#' + g + 'w)" stroke="#2A1604" stroke-width="3"/>'
    + '<path d="M20 80 H120 M20 96 H120" stroke="rgba(30,14,2,.35)" stroke-width="2"/>'
    + '<rect x="33" y="66" width="11" height="46" fill="url(#' + g + 'b)"/><rect x="96" y="66" width="11" height="46" fill="url(#' + g + 'b)"/>'
    + '<rect x="15" y="108" width="110" height="10" rx="3" fill="url(#' + g + 'b)" stroke="#2A1604" stroke-width="2.4"/>'
    + '<rect x="58" y="58" width="24" height="30" rx="5" fill="url(#' + g + 'b)" stroke="#2A1604" stroke-width="2.4"/>'
    + '<circle cx="70" cy="70" r="4" fill="#2A1604"/><rect x="68.5" y="72" width="3" height="9" rx="1.5" fill="#2A1604"/>'
    + '<circle cx="70" cy="39" r="9" fill="' + c.gem + '" stroke="#FFF3C8" stroke-width="2.4"/><circle cx="67" cy="36" r="3" fill="#FFFFFF" opacity=".7"/>'
    + dkpStar4(26, 28, 7) + dkpStar4(116, 38, 6) + '</svg>';
}
/* キューブ（報酬の箱。種類で色が変わる） */
function dkpCubeSVG(kind, dim){
  var K = DKP_CUBEK[kind] || DKP_CUBEK.wood, c = dim ? ['#5A4A36', '#3A2E20', '#241A10'] : K.c, e = dim ? '#8A7250' : K.e;
  var hex = 'M30 5 L53 17.5 V42.5 L30 55 L7 42.5 V17.5 Z';
  return '<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">'
    + '<path d="' + hex + '" fill="#2A1604" stroke="#2A1604" stroke-width="5" stroke-linejoin="round"/>'
    + '<path d="M30 5 L53 17.5 L30 30 L7 17.5 Z" fill="' + c[0] + '"/>'
    + '<path d="M7 17.5 L30 30 V55 L7 42.5 Z" fill="' + c[1] + '"/>'
    + '<path d="M53 17.5 L30 30 V55 L53 42.5 Z" fill="' + c[2] + '"/>'
    + (kind === 'wood' && !dim ? '<path d="M11 26 L26 34 M11 33 L26 41 M34 34 L49 26 M34 41 L49 33" stroke="rgba(80,44,12,.45)" stroke-width="1.6"/>' : '')
    + (kind === 'dia' && !dim ? '<path d="M30 5 L30 30 M18.5 11.2 L41.5 23.7 M41.5 11.2 L18.5 23.7" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>' : '')
    + '<path d="' + hex + '" fill="none" stroke="' + e + '" stroke-width="2.2" stroke-linejoin="round"/>'
    + '<path d="M7 17.5 L30 30 L53 17.5 M30 30 V55" fill="none" stroke="' + e + '" stroke-width="1.3" opacity=".8"/>'
    + (dim ? '' : dkpStar4(21, 14, 4.2)) + '</svg>';
}
/* 文字ロゴの両脇の小さなサイコロ（絵のロゴと同じ飾り） */
function dkpDieMini(){
  return '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20 3 L36 11 L20 19 L4 11 Z" fill="#FFF7E6" stroke="#3A2405" stroke-width="2"/>'
    + '<path d="M4 11 L20 19 V37 L4 29 Z" fill="#E8CFA8" stroke="#3A2405" stroke-width="2"/><path d="M36 11 L20 19 V37 L36 29 Z" fill="#C9A070" stroke="#3A2405" stroke-width="2"/>'
    + '<ellipse cx="20" cy="11" rx="3" ry="1.8" fill="#C9302C"/><circle cx="9" cy="19" r="1.8" fill="#3A2405"/><circle cx="15" cy="29" r="1.8" fill="#3A2405"/>'
    + '<circle cx="25" cy="22" r="1.8" fill="#3A2405"/><circle cx="31" cy="27" r="1.8" fill="#3A2405"/></svg>';
}
/* 文字ロゴ（素材の無い画面：ガチャ・キューブ・キャラクターカード）を絵のロゴに寄せる */
function dkpLogo(el, main, sub){
  var lg = el && el.querySelector('.dkhd .dklogo.dktext'); if(!lg) return;
  lg.classList.add('dkp-lg');
  lg.innerHTML = '<span class="dkp-lgd">' + dkpDieMini() + '</span><span class="dkp-lgw">'
    + (sub ? '<small>' + esc(sub) + '</small>' : '') + '<b>' + esc(main) + '</b><i>DICE KINGDOM</i></span>'
    + '<span class="dkp-lgd r">' + dkpDieMini() + '</span>';
}
function dkpDieIcon(){
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="5" width="30" height="30" rx="7" fill="#FFFDF4" stroke="#3A2405" stroke-width="2.6"/>'
    + '<circle cx="13" cy="13" r="3" fill="#3A2405"/><circle cx="20" cy="20" r="3.2" fill="#C9302C"/><circle cx="27" cy="27" r="3" fill="#3A2405"/></svg>';
}
function dkpLockSVG(){
  return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M15 21V15a9 9 0 0118 0v6" fill="none" stroke="#C8952F" stroke-width="4.2" stroke-linecap="round"/>'
    + '<rect x="10" y="20" width="28" height="22" rx="5" fill="#E7B94A" stroke="#2A1604" stroke-width="2.4"/>'
    + '<circle cx="24" cy="29" r="3" fill="#3A2405"/><path d="M24 30V36" stroke="#3A2405" stroke-width="3" stroke-linecap="round"/></svg>';
}
function dkpCrack(){
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6 L44 28 L57 40 L40 57 L53 69 L46 94 M44 28 L26 34 M57 40 L76 35 M40 57 L20 66 M53 69 L72 79"'
    + ' fill="none" stroke="#F2F2F2" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/* ══════════ 強化のきまり ══════════ */
function dkpBaseRate(tgtRar, matRar){
  var t = dkpRank(tgtRar), m = dkpRank(matRar);
  if(t === 1) return 1;
  if(t === 2) return m >= 2 ? 1 : 0.6;
  return m >= 3 ? 1 : (m === 2 ? 0.6 : 0.3);
}
function dkpFail(id){
  var f = SV.fail && SV.fail.pend, v = f ? f[id] : 0;
  return (typeof v === 'number' && v > 0) ? Math.floor(v) : 0;
}
function dkpRate(tgtId, matId){
  var t = pendById(tgtId), m = pendById(matId);
  if(!t || !m) return 0;
  return Math.min(1, dkpBaseRate(t.rar, m.rar) + 0.08 * dkpFail(tgtId));
}
function dkpCostTable(r){
  if(r === 'SS') return [750, 1400, 3600, 5500, 6400, 6900, 6900];
  if(r === 'S')  return [600, 1250, 3100, 5000, 5750, 6300, 6300];
  return [500, 1000, 1750, 2750, 3500, 5000, 5000];
}
function dkpDisc(){ return !!(SV.book && SV.book.claim && SV.book.claim.pb8); }
/* 次の1段の費用（+7 なら 0） */
function dkpCost(tgtId){
  var t = pendById(tgtId); if(!t || !dkpOwn(tgtId)) return 0;
  var lv = dkpLv(tgtId); if(lv >= 8) return 0;
  var c = dkpCostTable(t.rar)[lv - 1];
  return dkpDisc() ? Math.round(c * 0.8) : c;
}
/* +5→+6 と +6→+7 は、対象と同じ等級以上の素材だけ */
function dkpMatOk(tgtId, matId){
  var t = pendById(tgtId), m = pendById(matId);
  if(!t || !m) return false;
  if(dkpLv(tgtId) >= 6) return dkpRank(m.rar) >= dkpRank(t.rar);
  return true;
}
/* 置いてある素材を持っている数に合わせる（売った・使った後に古い置き方が残らないように） */
function dkpMatsFix(){
  var S = dkpS(), used = {};
  S.mats = (S.mats || []).filter(function(id){
    if(!pendById(id)) return false;
    used[id] = (used[id] || 0) + 1;
    return used[id] <= dkpDup(id);
  }).slice(0, 5);
  return S.mats;
}
function dkpFirstMat(tgtId, mats){
  for(var i = 0; i < mats.length; i++) if(dkpMatOk(tgtId, mats[i])) return mats[i];
  return null;
}
/* 押せない理由（押せるなら ''） */
function dkpUpWhy(tgtId, mats){
  var t = pendById(tgtId);
  if(!t || !dkpOwn(tgtId)) return 'ペンダントをえらんでください';
  if(dkpLv(tgtId) >= 8) return 'この +7 が上限です';
  if(!mats || !mats.length) return '下の「重なり」から素材を置いてください';
  if(!dkpFirstMat(tgtId, mats)) return '+5 から先は、対象と同じ等級（' + dkpRarNm(t.rar) + '）以上の素材だけ使えます';
  var c = dkpCost(tgtId);
  if(SV.gold < c) return 'ゴールドが足りません（あと ' + dkpFmt(c - SV.gold) + 'G）';
  return '';
}
/* 素材1つで1回だけ試す（見た目なし）。戻り値 {ok, lv, cost, rate} か {why} */
function dkpUpTry(tgtId, matId){
  var t = pendById(tgtId), m = pendById(matId);
  if(!t || !m || !dkpOwn(tgtId)) return { why:'none' };
  var lv = dkpLv(tgtId);
  if(lv >= 8) return { why:'max' };
  if(dkpDup(matId) <= 0) return { why:'nomat' };
  if(!dkpMatOk(tgtId, matId)) return { why:'grade' };
  var cost = dkpCost(tgtId);
  if(SV.gold < cost) return { why:'gold', cost:cost };
  var rate = dkpRate(tgtId, matId);
  SV.gold -= cost;
  SV.pendants[matId].dup = dkpDup(matId) - 1;
  var ok = Math.random() < rate;
  if(!SV.fail || typeof SV.fail !== 'object') SV.fail = { pend:{} };
  if(!SV.fail.pend || typeof SV.fail.pend !== 'object') SV.fail.pend = {};
  if(ok){ SV.pendants[tgtId].lv = lv + 1; SV.fail.pend[tgtId] = 0; dkpBookMax(tgtId); }
  else SV.fail.pend[tgtId] = dkpFail(tgtId) + 1;
  /* 回数はここで数えない（WP1#2）：'pend:up' の ok を見て、ミッション側が ptry＝試行・pup＝成功で数える（二重に数えない） */
  saveNow();
  dkEmit('pend:up', { id:tgtId, lv:dkpLv(tgtId), ok:ok });
  return { ok:ok, lv:dkpLv(tgtId), cost:cost, rate:rate, mat:matId };
}

/* ══════════ 合成のきまり ══════════ */
function dkpMixCost(r){ return r === 'A' ? 6000 : (r === 'S' ? 12000 : 0); }
function dkpMixWhy(a, b){
  var pa = pendById(a), pb = pendById(b);
  if(!pa || !pb || !dkpOwn(a) || !dkpOwn(b)) return '+7 のペンダントを2つ置いてください';
  if(a === b) return '別のペンダントを2つ置いてください';
  if(pa.rar !== pb.rar) return '同じ等級の2つを置いてください';
  if(pa.rar === 'SS') return 'S+ はこれ以上の等級がありません';
  if(dkpLv(a) < 8 || dkpLv(b) < 8) return '2つとも +7 まで強化してください';
  if(SV.gold < dkpMixCost(pa.rar)) return 'ゴールドが足りません（あと ' + dkpFmt(dkpMixCost(pa.rar) - SV.gold) + 'G）';
  return '';
}
function dkpAim(){
  var a = SV.aim && SV.aim.pend, p = pendById(a);
  return (p && p.rar === 'SS') ? a : null;
}
/* S→S+ で狙いが出る確率（k 回目）。10回目で確定。
   ただし「狙いなし」より損にならないよう、等分の確率を下回らない */
function dkpAimChance(){
  var pool = PENDANTS.filter(function(p){ return p.rar === 'SS'; }).length || 1;
  var k = (SV.pity && SV.pity.pend | 0) + 1;
  if(k >= 10) return 1;
  return Math.max(k * 0.1, 1 / pool);
}
/* 合成する（見た目なし）。戻り値 {id, fresh, aimHit, cost} か {why} */
function dkpMix(a, b){
  var why = dkpMixWhy(a, b); if(why) return { why:why };
  var pa = pendById(a), cost = dkpMixCost(pa.rar), up = pa.rar === 'A' ? 'S' : 'SS';
  SV.gold -= cost;
  [a, b].forEach(function(id){
    var o = SV.pendants[id];
    if((o.dup | 0) > 0){ o.dup = (o.dup | 0) - 1; o.lv = 1; }
    else {
      delete SV.pendants[id];
      for(var i = 0; i < SV.slots.length; i++) if(SV.slots[i] === id) SV.slots[i] = null;
    }
    if(SV.fail && SV.fail.pend) SV.fail.pend[id] = 0;
  });
  var pool = PENDANTS.filter(function(p){ return p.rar === up; }), res = null, aimHit = false;
  var aim = (up === 'SS') ? dkpAim() : null;
  if(!SV.pity || typeof SV.pity !== 'object') SV.pity = { pend:0, card:0 };
  if(aim){
    var ch = dkpAimChance();
    if(Math.random() < ch){ res = aim; aimHit = true; SV.pity.pend = 0; }
    else {
      var others = pool.filter(function(p){ return p.id !== aim; });
      res = (others.length ? others[(Math.random() * others.length) | 0] : pool[0]).id;
      SV.pity.pend = (SV.pity.pend | 0) + 1;
    }
  } else res = pool[(Math.random() * pool.length) | 0].id;
  var g = dkGivePend(res) || { id:res, fresh:false, dup:0 };
  dkpBookMax(res);
  if(SV.stat) SV.stat.pmix = (SV.stat.pmix | 0) + 1;
  saveNow();
  dkEmit('pend:mix', { a:a, b:b, id:res, rar:up, aim:aimHit, pity:SV.pity.pend | 0 });
  return { id:res, fresh:!!g.fresh, aimHit:aimHit, cost:cost, rar:up };
}

/* ══════════ 装備・売却 ══════════ */
function dkpEquip(id, slot){
  if(!dkpOwn(id)) return false;
  if(SV.slots.indexOf(id) >= 0) return true;
  var open = dkpSlotsOpen();
  if(slot === undefined || slot === null){
    slot = -1;
    for(var i = 0; i < open; i++) if(!pendById(SV.slots[i])){ slot = i; break; }
    if(slot < 0) return false;
  }
  slot = slot | 0; if(slot < 0 || slot >= open) return false;
  SV.slots[slot] = id; saveNow();
  return true;
}
function dkpUnequip(slot){
  slot = slot | 0; if(slot < 0 || slot > 3) return;
  SV.slots[slot] = null; saveNow();
}
function dkpSellPrice(id){ var p = pendById(id); return !p ? 0 : p.rar === 'SS' ? 2000 : p.rar === 'S' ? 800 : 300; }
/* 売る。重なりから先に。戻り値 {gold, removed} */
function dkpSell(id){
  var o = SV.pendants && SV.pendants[id]; if(!o || !pendById(id)) return null;
  var price = dkpSellPrice(id), removed = false;
  if((o.dup | 0) > 0) o.dup = (o.dup | 0) - 1;
  else {
    delete SV.pendants[id]; removed = true;
    for(var i = 0; i < SV.slots.length; i++) if(SV.slots[i] === id) SV.slots[i] = null;
  }
  SV.gold += price;
  saveNow();
  return { gold:price, removed:removed };
}

/* ══════════ 図鑑 ══════════ */
function dkpBookMax(id){
  if(!SV.book || typeof SV.book !== 'object') SV.book = { claim:{} };
  var m = SV.book.pmax;
  if(!m || typeof m !== 'object' || Array.isArray(m)) m = SV.book.pmax = {};
  var lv = dkpLv(id);
  if(!(m[id] >= lv)){ m[id] = lv; return true; }
  return false;
}
function dkpBookSync(){
  var ch = false;
  PENDANTS.forEach(function(p){ if(dkpOwn(p.id) && dkpBookMax(p.id)) ch = true; });
  if(ch) saveNow();
}
function dkpBookHas(id){ return dkpOwn(id) || !!(SV.book && SV.book.pmax && SV.book.pmax[id] >= 1); }
function dkpBookCount(){ return PENDANTS.filter(function(p){ return dkpBookHas(p.id); }).length; }
function dkpClaimed(k){ return !!(SV.book && SV.book.claim && SV.book.claim[k]); }
function dkpRewards(){
  var all = PENDANTS.length;
  var L = [ { k:'pb3', need:3, nm:'3種 登録', ic:'gold', v:'3,000G' },
            { k:'pb5', need:5, nm:'5種 登録', ic:'gem',  v:'ダイヤ 8' },
            { k:'pb8', need:8, nm:'8種 登録', ic:'up',   v:'強化費 −20%（ずっと）' },
            { k:'pb12', need:12, nm:'12種 登録', ic:'gem',  v:'ダイヤ 20' },
            { k:'pb16', need:16, nm:'16種 登録', ic:'gold', v:'30,000G' } ];
  return L.filter(function(r){ return r.need <= all; });
}
function dkpClaimReady(){
  var n = dkpBookCount();
  return dkpRewards().some(function(r){ return n >= r.need && !dkpClaimed(r.k); });
}
function dkpClaim(k){
  var r = dkpRewards().filter(function(x){ return x.k === k; })[0];
  if(!r || dkpClaimed(k) || dkpBookCount() < r.need) return false;
  if(!SV.book || typeof SV.book !== 'object') SV.book = { claim:{} };
  if(!SV.book.claim || typeof SV.book.claim !== 'object') SV.book.claim = {};
  SV.book.claim[k] = 1;
  if(k === 'pb3') SV.gold += 3000;
  if(k === 'pb5') SV.gem += 8;
  if(k === 'pb12') SV.gem += 20;
  if(k === 'pb16') SV.gold += 30000;
  saveNow();
  return true;
}

/* ══════════ ペンダント画面 ══════════ */
function dkpTabs(){
  return [ { id:'pend', ic:dkpTabIcon('pend'), nm:'ペンダント' },
           { id:'up',   ic:dkpTabIcon('up'),   nm:'強化' },
           { id:'mix',  ic:dkpTabIcon('mix'),  nm:'合成' },
           { id:'book', ic:dkpTabIcon('book'), nm:'図鑑', badge:(dkpClaimReady() ? '!' : '') } ];
}
function showPend(tab){
  var S = dkpS();
  if(typeof tab === 'string' && /^(pend|up|mix|book)$/.test(tab) && !S.busy) S.tab = tab;
  if(!/^(pend|up|mix|book)$/.test(S.tab)) S.tab = 'pend';
  dkpBookSync();
  var body = S.tab === 'up' ? dkpBodyUp() : S.tab === 'mix' ? dkpBodyMix() : S.tab === 'book' ? dkpBodyBook() : dkpBodyPend();
  var tabIn = !!(S.prevTab && S.prevTab !== S.tab);
  S.prevTab = S.tab;
  var el = dkMake('pend', 'pend',
      dkHead('pend', {})
    + dkTabs(dkpTabs(), S.tab)
    + '<div class="dkbody dkp-body dkp-t-' + S.tab + (tabIn ? ' dkp-tabin' : '') + '">' + body + '</div>');
  el.classList.add('dkp-scr');
  el.classList.toggle('dkp-busy', !!S.busy);
  dkWire(el, function(id){ var s = dkpS(); if(s.busy) return; s.tab = id; s.mixRes = null; showPend(); });
  el.onclick = dkpPendClick;
  var tabs = el.querySelector('.dktabs');
  if(tabs) tabs.insertAdjacentHTML('beforeend', '<button class="dkp-lkchip" data-dkp-act="pgacha" data-fx="riseL"><i>ラッキー<br>マイレージ</i>'
    + '<b>×' + dkpLuckyN() + '<small>点</small></b></button>');
  dkpFxTag(el);
  dkpWheelAll(el);
  screenTo('pend');
  var fn = S.after; S.after = null;
  if(fn) setTimeout(function(){ try{ fn(); }catch(e){ console.error('[WP1]', e); } }, 60);
}
/* 画面が変わった時だけの入場（WP0 の fxEnter が使う印） */
function dkpFxTag(el){
  el.querySelectorAll('.dkhd > *').forEach(function(n){ n.setAttribute('data-fx', 'pop'); });
  el.querySelectorAll('.dktab').forEach(function(n){ n.setAttribute('data-fx', 'riseL'); });
}
function dkpEmptyInv(msg){
  var hero = dkU('hero-pend');
  return '<section class="fx-panel dkp-inv dkp-none" data-fx="riseR"><i class="fx-edge"></i>'
    + '<div class="dkp-hero"><i class="fx-halo dkp-halo"></i>'
    +   (hero ? '<div class="dkp-heroimg" style="background-image:url(' + hero + ')"></div>'
              : '<div class="dkp-heromed">' + dkpMedal(PENDANTS[1], { size:220, cls:'dkp-float' }) + '</div>')
    + '</div>'
    + '<div class="dkp-nonetx"><b class="dkp-ttl">' + esc(msg) + '</b>'
    +   '<p>ガチャの「ペンダント」で手に入ります。カードパックからも、1枚ごとに 18% の確率でいっしょに出ます。</p>'
    +   '<button class="dkbtn gd fx-primary dkp-big" data-dkp-act="pgacha">ペンダントガチャへ</button></div>'
    + '</section>';
}
function dkpTrgWarn(){
  var by = {}, msg = '', open = dkpSlotsOpen();
  SV.slots.forEach(function(id, i){ var p = pendById(id); if(!p || i >= open) return; (by[p.trg] = by[p.trg] || []).push(p); });
  Object.keys(by).some(function(k){
    if(by[k].length < 2) return false;
    msg = by[k].map(dkpShort).join('と') + 'は同じ「' + dkpTrg(k) + '」の系統です。確率の高い方だけ発動します';
    return true;
  });
  return msg;
}
function dkpBodyPend(){
  var S = dkpS(), own = dkpOwnList(S.sort);
  if(S.sel && !dkpOwn(S.sel)) S.sel = null;
  if(!S.sel && own.length) S.sel = own[0].id;
  var open = dkpSlotsOpen(), card = cardById(SV.equip), face = card ? (dkCharImg('t' + card.id.slice(1)) || dkCharImg(card.id)) : '';
  var slots = SV.slots.map(function(pid, i){
    var p = pendById(pid), lock = i >= open;
    if(!p && lock) return '<div class="dkp-slot dkp-empty dkp-lock" data-fx="riseL"><span class="dkp-sno">' + (i + 1) + '</span>'
      + '<span class="dkp-hole dkp-lk">' + dkpLockSVG() + '</span><div class="dkp-si"><b class="dkp-snm">ロック中</b>'
      + '<p class="dkp-sds">' + esc(dkpLockTx(i)) + '</p></div></div>';
    if(!p) return '<div class="dkp-slot dkp-empty" data-fx="riseL"><span class="dkp-sno">' + (i + 1) + '</span>'
      + '<span class="dkp-hole"><i></i></span><div class="dkp-si"><b class="dkp-snm">空き枠</b>'
      + '<p class="dkp-sds">右の一覧からえらんで［装着］</p></div></div>';
    var lv = dkpLv(p.id);
    return '<div class="dkp-slot r' + p.rar + (p.id === S.sel ? ' on' : '') + (lock ? ' dkp-lock' : '') + '" data-dkp-act="sel" data-dkp-id="' + p.id + '" data-fx="riseL" id="dkpSlot' + i + '">'
      + '<span class="dkp-sno">' + (i + 1) + '</span>'
      + dkpMedal(p, { size:92, plus:lv - 1 }) + (lock ? '<span class="dkp-lkon">' + dkpLockSVG() + '</span>' : '')
      + '<div class="dkp-si"><div class="dkp-snr"><span class="dkp-rtag sm r' + p.rar + '">' + dkpRarNm(p.rar) + '</span><b class="dkp-snm">' + esc(p.nm) + '</b></div>'
      +   '<p class="dkp-sds">' + esc(lock ? 'この枠は今のカードでは効果が出ません（' + dkpLockTx(i) + '）' : p.ds) + '</p>'
      +   (lock ? '' : '<span class="dkp-sp"><i>' + esc(dkpTrg(p.trg)) + '</i>発動 <b>' + dkpPct(dkpEffP(p.id, lv)) + '%</b></span>') + '</div>'
      + '<button class="dkbtn dkp-off" data-dkp-act="off" data-dkp-slot="' + i + '">解除</button>'
      + '</div>';
  }).join('');
  var warn = dkpTrgWarn();
  var left = '<section class="fx-panel dkp-eqp" data-fx="riseL"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><span class="dkp-eqf"' + (face ? ' style="background-image:url(' + face + ')"' : '') + '>' + (face ? '' : dkpCrest()) + '</span>'
    +   '<b class="dkp-ttl">' + (card ? dkpRarNm(card.rar) + ' クラス装着中' : 'カード未装着') + '</b>'
    +   '<span class="dkp-cnt">スロット <b>' + open + '</b>個開放</span></header>'
    + '<div class="dkp-slots">' + slots + '</div>'
    + (warn ? '<p class="dkp-warn">' + esc(warn) + '</p>'
            : '<p class="dkp-hint">同じ系統のペンダントは、確率の高い方だけが発動します</p>')
    + '</section>';
  if(!own.length) return left + dkpEmptyInv('ペンダントをまだ持っていません');

  var seg = [['rar', '等級'], ['lv', '強化'], ['dup', '重なり']];
  var si = Math.max(0, seg.map(function(x){ return x[0]; }).indexOf(S.sort));
  var cells = own.map(function(p){
    var eq = SV.slots.indexOf(p.id) >= 0, d = dkpDup(p.id), lv = dkpLv(p.id);
    return '<div class="dkp-cell r' + p.rar + (p.id === S.sel ? ' on' : '') + (eq ? ' eq' : '') + '" data-dkp-act="sel" data-dkp-id="' + p.id + '" data-fx="pop">'
      + (p.rar === 'SS' ? '<i class="dkp-gl"></i>' : '')
      + dkpMedal(p, { size:84, plus:lv - 1, rt:true })
      + (d ? '<span class="dkp-dup">×' + d + '</span>' : '')
      + (eq ? '<span class="dkp-eqtag">着用中</span>' : '')
      + '<b class="dkp-cnm">' + esc(dkpShort(p)) + '</b></div>';
  }).join('');
  var right = '<section class="fx-panel dkp-inv" data-fx="riseR"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><div class="fx-seg dkp-seg" style="--si:' + si + '"><i class="thumb"></i>'
    +   seg.map(function(x){ return '<button aria-pressed="' + (x[0] === S.sort) + '" data-dkp-act="sort" data-dkp-v="' + x[0] + '">' + x[1] + '</button>'; }).join('')
    +   '</div><span class="dkp-own">所有 <b>' + own.length + '</b> / ' + PENDANTS.length + '</span>'
    +   '<button class="dkbtn gd dkp-mini" data-dkp-act="pgacha">ペンダントガチャ</button></header>'
    + '<div class="dkp-grid" data-fx-step="30">' + cells + '</div>'
    + dkpDetail(pendById(S.sel))
    + '</section>';
  return left + right;
}
function dkpDetail(p){
  if(!p) return '';
  var lv = dkpLv(p.id), slot = SV.slots.indexOf(p.id), now = dkpEffP(p.id, lv), max = dkpEffP(p.id, 8);
  var d = dkpDup(p.id), price = dkpSellPrice(p.id);
  var same = SV.slots.map(pendById).filter(function(x){ return x && x.id !== p.id && x.trg === p.trg; })[0];
  return '<div class="dkp-det r' + p.rar + '" data-fx="rise">'
    + '<div class="dkp-show"><i class="fx-halo dkp-halo"></i><i class="dkp-ped"></i>'
    +   dkpMedal(p, { size:150, plus:lv - 1, cls:'dkp-float' }) + '</div>'
    + '<div class="dkp-dinfo">'
    +   '<div class="dkp-dhd"><span class="dkp-rtag r' + p.rar + '">' + dkpRarNm(p.rar) + '</span>'
    +     '<b class="dkp-dnm">' + esc(p.nm) + '</b></div>'
    +   '<p class="dkp-dds">' + esc(p.ds) + '</p>'
    +   '<div class="dkp-drate"><span class="dkp-dl">発動率（+' + (lv - 1) + '）</span>'
    +     '<span class="dkp-bar"><i style="--w:' + dkpPct(now) + '%"></i><em style="--x:' + dkpPct(max) + '%"></em></span>'
    +     '<b>' + dkpPct(now) + '%</b></div>'
    +   '<p class="dkp-dmax">+7 にすると <b>' + dkpPct(max) + '%</b>　・　' + esc(dkpTrg(p.trg)) + '　・　重なり ' + d + '</p>'
    +   '<div class="dkp-elrow">' + dkpElChip(p, 'big')
    +     '<span class="dkp-elds">' + esc(dkpElem(p.id).nm) + 'の力　' + esc(dkpTrg(p.trg)) + 'に発動します</span>'
    +     '<button class="dkbtn dkp-wood dkp-elbtn" data-dkp-act="efx" data-dkp-id="' + p.id + '">発動演出</button></div>'
    +   (same && slot < 0 ? '<p class="dkp-warn sm">装備中の' + esc(dkpShort(same)) + 'と同じ系統です（高い方だけ発動）</p>' : '')
    +   '<div class="dkp-dbtns">'
    +     (slot >= 0 ? '<button class="dkbtn dkp-off" data-dkp-act="off" data-dkp-slot="' + slot + '">解除</button>'
                     : '<button class="dkbtn gr fx-primary green" data-dkp-act="eq" data-dkp-id="' + p.id + '">装着</button>')
    +     '<button class="dkbtn gd" data-dkp-act="goup" data-dkp-id="' + p.id + '"' + (lv >= 8 ? ' disabled' : '') + '>' + (lv >= 8 ? '+7 最大' : '強化へ') + '</button>'
    +     '<button class="dkbtn dkp-sell" data-dkp-act="sell" data-dkp-id="' + p.id + '">売却 <i class="dkcoin dkp-ci"></i>' + dkpFmt(price) + '</button>'
    +   '</div>'
    + '</div></div>';
}

/* ── 強化タブ ── */
function dkpPoolList(tgtId){
  var S = dkpS(), placed = {};
  S.mats.forEach(function(id){ placed[id] = (placed[id] || 0) + 1; });
  return dkpOwnList('rar').filter(function(p){ return dkpDup(p.id) > 0; }).map(function(p){
    return { p:p, left:dkpDup(p.id) - (placed[p.id] || 0), ok:dkpMatOk(tgtId, p.id) };
  });
}
function dkpBodyUp(){
  var S = dkpS(), own = dkpOwnList('rar');
  if(!own.length) return '<section class="fx-panel dkp-forge" data-fx="riseL"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><b class="dkp-ttl">強化</b></header>'
    + '<p class="dkp-hint big">強化するペンダントがありません。<br>まずはペンダントガチャで手に入れましょう。</p></section>'
    + dkpEmptyInv('強化するペンダントがありません');
  if(!S.upTgt || !dkpOwn(S.upTgt)) S.upTgt = (S.sel && dkpOwn(S.sel)) ? S.sel : own[0].id;
  dkpMatsFix();
  var t = pendById(S.upTgt), lv = dkpLv(t.id), max = lv >= 8;
  var why = dkpUpWhy(t.id, S.mats), fm = dkpFirstMat(t.id, S.mats);
  var rate = fm ? dkpRate(t.id, fm) : 0, cost = dkpCost(t.id), fail = dkpFail(t.id);

  var left = '<section class="fx-panel dkp-forge" data-fx="riseL"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><span class="dkp-rtag r' + t.rar + '">' + dkpRarNm(t.rar) + '</span>'
    +   '<b class="dkp-ttl dkp-fnm">' + esc(t.nm) + '</b></header>'
    + '<div class="dkp-altar" id="dkpAltar"><i class="fx-halo dkp-halo"></i><i class="dkp-ped"></i>'
    +   dkpMedal(t, { size:176, cls:'dkp-float' })
    +   '<i class="dkp-crack">' + dkpCrack() + '</i><i class="dkp-okfl"></i></div>'
    + '<div class="dkp-lvrow"><b class="dkp-lvn" id="dkpLvA">+' + (lv - 1) + '</b>'
    +   (max ? '<span class="dkp-maxtag">MAX</span>' : '<i class="dkp-arw"></i><b class="dkp-lvn nx" id="dkpLvB">+' + lv + '</b>') + '</div>'
    + (max
      ? '<p class="dkp-hint big">+7 に到達しました。<br>合成タブで、1段上の等級に生まれ変われます。</p>'
      : '<div class="dkp-rate"><span class="dkp-rl">成功率</span><b class="dkp-ratev" id="dkpRate">' + (fm ? dkpPct(rate) : '--') + '<small>%</small></b>'
        + (fail ? '<em class="dkp-fb" id="dkpFb">失敗ボーナス +' + (fail * 8) + '%</em>' : '<em class="dkp-fb" id="dkpFb"></em>') + '</div>'
        + '<div class="dkp-cost"><i class="dkcoin dkp-ci"></i><b id="dkpCost">' + dkpFmt(cost) + '</b><span>G ／ 1回</span>'
        +   (dkpDisc() ? '<em>図鑑ボーナス −20%</em>' : '') + '</div>'
        + '<button class="dkbtn gd fx-primary dkp-go" data-dkp-act="upgo" id="dkpUpGo"' + (why ? ' disabled' : '') + '>強化する</button>'
        + '<p class="dkp-why' + (why ? ' on' : '') + '" id="dkpWhy">' + esc(why || '素材は置いた順に1つずつ試します') + '</p>')
    + '</section>';

  var strip = own.map(function(p){
    return '<div class="dkp-cell dkp-sm r' + p.rar + (p.id === t.id ? ' on' : '') + '" data-dkp-act="tgt" data-dkp-id="' + p.id + '">'
      + dkpMedal(p, { size:62, plus:dkpLv(p.id) - 1 }) + '<b class="dkp-cnm">' + esc(dkpShort(p)) + '</b></div>';
  }).join('');
  var mats = [0, 1, 2, 3, 4].map(function(i){
    var m = S.mats[i];
    if(!m) return '<div class="dkp-mslot dkp-mempty"><span>' + (i + 1) + '</span></div>';
    var mp = pendById(m), ok = dkpMatOk(t.id, m);
    return '<div class="dkp-mslot r' + mp.rar + (ok ? '' : ' ng') + '" data-dkp-act="unmat" data-dkp-v="' + i + '" id="dkpM' + i + '">'
      + dkpMedal(mp, { size:58, rt:true }) + '<b class="dkp-mrate">' + (ok ? dkpPct(dkpRate(t.id, m)) + '%' : '不可') + '</b>'
      + '<i class="dkp-mx fx-deco">×</i></div>';
  }).join('');
  var pool = dkpPoolList(t.id), poolH = pool.length ? pool.map(function(o){
      var can = o.left > 0 && !max;
      return '<div class="dkp-pitem r' + o.p.rar + (can ? '' : ' dkp-dim') + '"' + (can ? ' data-dkp-act="mat" data-dkp-id="' + o.p.id + '"' : '') + '>'
        + dkpMedal(o.p, { size:56, rt:true }) + '<b class="dkp-pn">×' + Math.max(0, o.left) + '</b>'
        + '<em class="dkp-pr' + (o.ok ? '' : ' ng') + '">' + (o.ok ? '成功 ' + dkpPct(dkpRate(t.id, o.p.id)) + '%' : '+5から不可') + '</em></div>';
    }).join('')
    : '<p class="dkp-hint">重なり（同じペンダントの2つ目から）がありません。ペンダントガチャで集めましょう。</p>';
  var right = '<section class="fx-panel dkp-upr" data-fx="riseR"><i class="fx-edge"></i>'
    + '<h4 class="dkp-sub">強化するペンダント</h4>'
    + '<div class="dkp-sw"><div class="dkp-strip" data-dkp-wheel="1">' + strip + '</div></div>'
    + '<h4 class="dkp-sub">素材（5つまで）' + (S.mats.length ? '<button class="dkbtn dkp-wood dkp-clr" data-dkp-act="clrmat">全部もどす</button>' : '') + '</h4>'
    + '<div class="dkp-mats">' + mats + '</div>'
    + '<h4 class="dkp-sub">素材にできる重なり</h4>'
    + '<div class="dkp-pool">' + poolH + '</div>'
    + '<ul class="dkp-rules dkp-uprules"><li>失敗しても段は下がりません（素材だけが消えます）</li>'
    +   '<li>失敗1回ごとに、次の成功率 +8%（成功すると元にもどる）</li>'
    +   '<li>+5→+6 と +6→+7 は、同じ等級以上の素材だけ使えます</li></ul>'
    + '</section>';
  return left + right;
}

/* ── 合成タブ ── */
function dkpMixFix(){
  var S = dkpS();
  if(S.mixA && (!dkpOwn(S.mixA) || dkpLv(S.mixA) < 8)) S.mixA = null;
  if(S.mixB && (!dkpOwn(S.mixB) || dkpLv(S.mixB) < 8)) S.mixB = null;
  if(!S.mixA && S.mixB){ S.mixA = S.mixB; S.mixB = null; }
}
function dkpSocket(p, key){
  if(!p) return '<div class="dkp-sock dkp-sempty"><span class="dkp-hole"><i></i></span><em>+7 を置く</em></div>';
  return '<div class="dkp-sock r' + p.rar + '" data-dkp-act="mixun" data-dkp-v="' + key + '" id="dkpSock' + key + '">'
    + dkpMedal(p, { size:118, plus:7, rt:true }) + '<b class="dkp-cnm">' + esc(dkpShort(p)) + '</b><i class="dkp-mx fx-deco">×</i></div>';
}
function dkpBodyMix(){
  var S = dkpS();
  dkpMixFix();
  var a = pendById(S.mixA), b = pendById(S.mixB), rar = a ? a.rar : null;
  var up = rar === 'A' ? 'S' : rar === 'S' ? 'SS' : null, why = dkpMixWhy(S.mixA, S.mixB);
  var res = S.mixRes ? pendById(S.mixRes.id) : null;
  var orb = res
    ? '<div class="dkp-orb dkp-got r' + res.rar + '" id="dkpOrb"><i class="fx-halo dkp-halo"></i>' + dkpMedal(res, { size:150, plus:0, rt:true, cls:'dkp-float' })
      + '<b class="dkp-cnm">' + esc(dkpShort(res)) + '</b>' + (S.mixRes.fresh ? '<span class="fx-new">NEW!</span>' : '') + '</div>'
    : '<div class="dkp-orb' + (up ? ' r' + up : '') + '" id="dkpOrb"><i class="fx-halo dkp-halo"></i><span class="dkp-q">?</span>'
      + '<b class="dkp-orbl">' + (up ? dkpRarNm(up) + ' が生まれる' : '1段上の等級') + '</b></div>';
  var left = '<section class="fx-panel dkp-alt" data-fx="riseL"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><b class="dkp-ttl">合成</b><span class="dkp-note">+7 の同じ等級を2つ → 1段上を1つ</span>'
    +   '<button class="dkp-oddsb" data-dkp-act="odds" data-dkp-v="pmix">提供割合</button></header>'
    + '<div class="dkp-altar2" id="dkpAltar2">' + dkpSocket(a, 'a') + orb + dkpSocket(b, 'b') + '</div>'
    + '<p class="dkp-mwarn">合成すると <b>+0</b> にもどります。いまの2つより弱くなります</p>'
    + '<div class="dkp-cost"><i class="dkcoin dkp-ci"></i><b>' + (rar ? dkpFmt(dkpMixCost(rar)) : '6,000 ／ 12,000') + '</b><span>G</span>'
    +   '<em>' + (rar ? (rar === 'A' ? 'A → S' : 'S → S+') : 'A → S ／ S → S+') + '</em></div>'
    + dkpLeftLine(up)
    + '<button class="dkbtn gd fx-primary dkp-go" data-dkp-act="mixgo"' + (why ? ' disabled' : '') + '>合成する</button>'
    + '<p class="dkp-why' + (why ? ' on' : '') + '">' + esc(why || '2つとも使います（重なりがあれば +0 の1つが残ります）') + '</p>'
    + '</section>';

  var cands = dkpOwnList('rar').filter(function(p){ return dkpLv(p.id) >= 8 && p.rar !== 'SS'; });
  var row = function(r){
    var L = cands.filter(function(p){ return p.rar === r; });
    if(!L.length) return '<p class="dkp-hint">' + dkpRarNm(r) + ' の +7 はまだありません</p>';
    return '<div class="dkp-sw"><div class="dkp-strip" data-dkp-wheel="1">' + L.map(function(p){
      var on = (p.id === S.mixA || p.id === S.mixB);
      return '<div class="dkp-cell dkp-sm r' + p.rar + (on ? ' on' : '') + '" data-dkp-act="mixpick" data-dkp-id="' + p.id + '">'
        + dkpMedal(p, { size:62, plus:7 }) + '<b class="dkp-cnm">' + esc(dkpShort(p)) + '</b>'
        + (dkpDup(p.id) ? '<span class="dkp-dup">×' + dkpDup(p.id) + '</span>' : '') + '</div>';
    }).join('') + '</div></div>';
  };
  var aim = dkpAim(), pity = (SV.pity && SV.pity.pend) | 0;
  var aims = PENDANTS.filter(function(p){ return p.rar === 'SS'; }).map(function(p){
    return '<div class="dkp-aimc' + (aim === p.id ? ' on' : '') + '" data-dkp-act="aim" data-dkp-id="' + p.id + '">'
      + dkpMedal(p, { size:72 }) + '<div><b>' + esc(dkpShort(p)) + '</b><em>' + (aim === p.id ? '狙い中' : 'タップで狙う') + '</em></div></div>';
  }).join('');
  var dots = '';
  for(var i = 0; i < 10; i++) dots += '<i class="' + (aim && i < pity ? 'on' : '') + (i === 9 ? ' last' : '') + '"></i>';
  var right = '<section class="fx-panel dkp-mixr" data-fx="riseR"><i class="fx-edge"></i>'
    + '<h4 class="dkp-sub">A の +7（→ S）</h4>' + row('A')
    + '<h4 class="dkp-sub">S の +7（→ S+）</h4>' + row('S')
    + '<h4 class="dkp-sub">S+ の狙い</h4>'
    + '<div class="dkp-aim">' + aims + '</div>'
    + '<div class="dkp-pity"><div class="dkp-dots">' + dots + '</div>'
    +   '<p>' + (aim ? '狙いが出る確率 <b>' + dkpPct(dkpAimChance()) + '%</b>　・　あと <b>' + Math.max(1, 10 - pity) + '</b> 回で確定'
                     : '狙いを決めると、10回目の S+ 合成で必ず出ます') + '</p></div>'
    + '<ul class="dkp-rules"><li>+7 の同じ等級を2つ（別のペンダント）使います</li>'
    +   '<li>A → S は 6,000G、S → S+ は 12,000G</li>'
    +   '<li>生まれたペンダントは +0 から。重なりがあれば +0 の1つが残ります</li></ul>'
    + '</section>';
  return left + right;
}

/* ── 図鑑タブ ── */
function dkpBodyBook(){
  var n = dkpBookCount(), hero = dkU('hero-pend');
  var list = PENDANTS.slice().sort(function(a, b){ return (dkpRank(b.rar) - dkpRank(a.rar)) || (PENDANTS.indexOf(a) - PENDANTS.indexOf(b)); });
  var cells = list.map(function(p){
    var st = dkpBookHas(p.id) ? 'own' : (dkBookState(p.id) === 'seen' ? 'seen' : 'unseen');
    var mx = (SV.book && SV.book.pmax && SV.book.pmax[p.id]) || dkpLv(p.id);
    return '<div class="dkp-bk ' + st + ' r' + p.rar + '" data-fx="pop">'
      + dkpMedal(p, { size:104, cls:(st === 'own' ? '' : 'dkp-' + st) })
      + '<span class="dkp-rtag r' + p.rar + '">' + dkpRarNm(p.rar) + '</span>'
      + (st === 'unseen' ? '' : dkpElChip(p, 'bk'))
      + '<b class="dkp-bnm">' + (st === 'unseen' ? '？？？' : esc(dkpShort(p))) + '</b>'
      + (st === 'own'
        ? '<em class="dkp-bmx">最高 +' + (Math.max(1, Math.min(8, mx | 0)) - 1) + '</em>'
          + (dkpOwn(p.id) ? '' : '<em class="dkp-bno">いまは持っていません</em>')
        : st === 'seen' ? '<em class="dkp-bsrc">' + esc(dkpSrc(p.rar)) + '</em>'
        : '<em class="dkp-bsrc">まだ出会っていません</em>')
      + '</div>';
  }).join('');
  var rws = dkpRewards().map(function(r){
    var got = dkpClaimed(r.k), ok = n >= r.need;
    var ic = r.ic === 'gold' ? '<i class="dkcoin dkp-ci"></i>' : r.ic === 'gem' ? '<i class="dkgem dkp-ci"></i>' : '<span class="dkp-upic">' + dkpTabIcon('up') + '</span>';
    return '<div class="dkp-rw' + (got ? ' got' : ok ? ' ready' : '') + '"><div class="dkp-rwt"><span class="dkp-rwn">' + r.nm + '</span>'
      + '<span class="dkp-rwv">' + ic + '<b>' + r.v + '</b></span></div>'
      + (got ? '<b class="dkp-rwst">受取済</b>'
         : ok ? '<button class="dkbtn gr fx-primary green" data-dkp-act="claim" data-dkp-v="' + r.k + '">受け取る</button>'
         : '<b class="dkp-rwst">あと ' + (r.need - n) + ' 種</b>')
      + '</div>';
  }).join('');
  return '<section class="fx-panel dkp-bookg" data-fx="riseL"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><b class="dkp-ttl">ペンダント図鑑</b><span class="dkp-note">持つと色がつき、いちばん高く育てた段が残ります</span></header>'
    + '<div class="dkp-bgrid" data-fx-step="40">' + cells + '</div></section>'
    + '<section class="fx-panel dkp-bookr" data-fx="riseR"><i class="fx-edge"></i>'
    + '<div class="dkp-hero sm"><i class="fx-halo dkp-halo"></i>'
    +   (hero ? '<div class="dkp-heroimg" style="background-image:url(' + hero + ')"></div>' : '<div class="dkp-heromed">' + dkpMedal(PENDANTS[1], { size:170, cls:'dkp-float' }) + '</div>')
    + '</div>'
    + '<div class="dkp-bcnt"><span>登録</span><b>' + n + '</b><i>/ ' + PENDANTS.length + '</i></div>'
    + '<div class="dkp-rws">' + rws + '</div>'
    + '<p class="dkp-hint dkp-bhint">一度でも持ったペンダントは、売ったり合成したりしても図鑑に残ります</p></section>';
}

/* ── 横スクロールの帯：縦ホイールを横へ・端に「続き」 ── */
function dkpWheelAll(el){
  el.querySelectorAll('[data-dkp-wheel]').forEach(function(box){ dkpWheelX(box); });
}
function dkpWheelX(box){
  if(!box || box._dkpW) return;
  box._dkpW = 1;
  box.addEventListener('wheel', function(e){
    if(Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    var max = box.scrollWidth - box.clientWidth; if(max <= 0) return;
    var b = box.scrollLeft;
    box.scrollLeft = Math.max(0, Math.min(max, b + e.deltaY * (e.deltaMode === 1 ? 40 : 1)));
    if(box.scrollLeft !== b) e.preventDefault();
    dkpFade(box);
  }, { passive:false });
  box.addEventListener('scroll', function(){ dkpFade(box); }, { passive:true });
  dkpFade(box);
  setTimeout(function(){ dkpFade(box); }, 80);
}
function dkpFade(box){
  var w = box.parentNode; if(!w || !w.classList) return;
  var max = box.scrollWidth - box.clientWidth;
  w.classList.toggle('dkp-more-l', box.scrollLeft > 4);
  w.classList.toggle('dkp-more-r', box.scrollLeft < max - 4);
}

/* ── クリック（画面の根元でまとめて受ける） ── */
function dkpPendClick(e){
  var S = dkpS(); if(S.busy) return;
  var t = (e.target && e.target.closest) ? e.target.closest('[data-dkp-act]') : null;
  if(!t || t.disabled || !this.contains(t)) return;
  var a = t.getAttribute('data-dkp-act'), id = t.getAttribute('data-dkp-id'), v = t.getAttribute('data-dkp-v');
  if(a === 'sel'){ if(S.sel !== id){ S.sel = id; dkpSfx('click'); showPend(); } return; }
  if(a === 'off'){ dkpDoOff(+t.getAttribute('data-dkp-slot'), t); return; }
  if(a === 'eq'){ dkpDoEquip(id); return; }
  if(a === 'sell'){ dkpDoSell(id, t); return; }
  if(a === 'sort'){ if(S.sort !== v){ S.sort = v; dkpSfx('click'); showPend(); } return; }
  if(a === 'gacha'){ dkpSfx('click'); showGacha(); return; }
  if(a === 'pgacha'){ dkpSfx('click'); showGacha('pend'); return; }
  if(a === 'odds'){ dkpSfx('click'); dkpOdds(v); return; }
  if(a === 'goup'){ dkpSfx('click'); S.tab = 'up'; S.upTgt = id; S.mats = []; showPend(); return; }
  if(a === 'tgt'){ if(S.upTgt !== id){ dkpSfx('click'); S.upTgt = id; S.mats = []; showPend(); } return; }
  if(a === 'mat'){ dkpAddMat(id); return; }
  if(a === 'unmat'){ dkpSfx('click'); S.mats.splice(+v, 1); showPend(); return; }
  if(a === 'clrmat'){ dkpSfx('click'); S.mats = []; showPend(); return; }
  if(a === 'upgo'){ dkpUpRun(); return; }
  if(a === 'mixpick'){ dkpMixPick(id); return; }
  if(a === 'mixun'){ dkpSfx('click'); if(v === 'a') S.mixA = null; else S.mixB = null; S.mixRes = null; showPend(); return; }
  if(a === 'aim'){ dkpSfx('click'); if(!SV.aim || typeof SV.aim !== 'object') SV.aim = { pend:null, card:null };
    SV.aim.pend = (SV.aim.pend === id) ? null : id; saveNow(); showPend(); return; }
  if(a === 'mixgo'){ dkpMixRun(); return; }
  if(a === 'claim'){ dkpDoClaim(v, t); return; }
  if(a === 'efx'){
    var pe = pendById(id) || pendById(S.sel);
    if(pe) dkpElemPlay(document.querySelector('#pend .dkp-show .dkp-medal') || t, pe.id);
    return;
  }
}
function dkpDoOff(slot, btn){
  var p = pendById(SV.slots[slot]); if(!p) return;
  dkpUnequip(slot);
  dkpSfx('click');
  toast('R', '📿', p.nm, (slot + 1) + '番の枠から解除しました', 1500);
  showPend();
}
function dkpSlotModal(p){
  return '<div class="modal"><div class="fx-panel dkp-modal">'
    + '<h3 class="dkp-mh">入れ替える枠をえらんでください</h3>'
    + '<p class="dkp-mp">「' + esc(p.nm) + '」と入れ替わります（えらんだ枠のペンダントは解除されます）</p>'
    + '<div class="dkp-mslots">' + SV.slots.slice(0, dkpSlotsOpen()).map(function(id, i){
        var q = pendById(id);
        return '<button class="dkp-mbtn" data-act="s' + i + '"><span class="dkp-sno">' + (i + 1) + '</span>'
          + (q ? dkpMedal(q, { size:72, plus:dkpLv(q.id) - 1 }) + '<b>' + esc(dkpShort(q)) + '</b>' : '<b>空き</b>') + '</button>';
      }).join('') + '</div>'
    + '<div class="dkp-mrow"><button class="dkbtn dkp-wood" data-act="no">やめる</button></div>'
    + '</div></div>';
}
async function dkpDoEquip(id){
  var S = dkpS(), p = pendById(id);
  if(!p || !dkpOwn(id) || SV.slots.indexOf(id) >= 0) return;
  var k = -1, open = dkpSlotsOpen();
  for(var i = 0; i < open; i++) if(!pendById(SV.slots[i])){ k = i; break; }
  if(open <= 0){ dkpSfx('warn'); toast('R', '📿', 'ペンダントの枠がありません', dkpLockTx(0), 2000); return; }
  if(k < 0){
    dkpSfx('click');
    dkpBusy(true);
    var act = null;
    try{ act = await modal(dkpSlotModal(p)); } finally { dkpBusy(false); }
    if(!act || act.charAt(0) !== 's') return;
    k = +act.slice(1);
  }
  if(!dkpEquip(id, k)) return;
  dkpSfx('buy');
  S.after = function(){
    var s = document.getElementById('dkpSlot' + k); if(!s) return;
    s.classList.add('dkp-pop');
    fxBurst(s.querySelector('.dkp-medal') || s, { kind:'star', n:16, power:.8 });
  };
  showPend();
}
async function dkpDoSell(id, btn){
  var S = dkpS(), p = pendById(id), o = SV.pendants[id];
  if(!p || !o) return;
  var price = dkpSellPrice(id);
  if((o.dup | 0) <= 0){
    dkpBusy(true);
    var act = null;
    try{
      act = await modal('<div class="modal"><div class="fx-panel dkp-modal">'
        + '<h3 class="dkp-mh">最後の1つを売りますか？</h3>'
        + '<div class="dkp-mone">' + dkpMedal(p, { size:96, plus:dkpLv(id) - 1, rt:true }) + '<p class="dkp-mp">「' + esc(p.nm) + '」を '
        +   dkpFmt(price) + 'G で売ります。<br>所持から消えます（装備中なら外れます）。</p></div>'
        + '<div class="dkp-mrow"><button class="dkbtn dkp-wood" data-act="no">やめる</button>'
        + '<button class="dkbtn dkp-sell" data-act="yes">売却</button></div></div></div>');
    } finally { dkpBusy(false); }
    if(act !== 'yes') return;
  }
  var from = btn ? fxPt(btn) : { x:900, y:700 };
  var r = dkpSell(id);
  if(!r) return;
  dkpSfx('coin');
  if(r.removed && S.sel === id) S.sel = null;
  showPend();
  fxCoins(from, fxWalletEl('gold'), { kind:'coin', n:8 });
  dkWallet();
  toast('R', '🪙', p.nm + ' を売りました', '+' + dkpFmt(price) + 'G' + (r.removed ? '（所持から外れました）' : '（重なり のこり ' + dkpDup(id) + '）'), 2000);
}
function dkpAddMat(id){
  var S = dkpS();
  dkpMatsFix();
  if(S.mats.length >= 5){ dkpSfx('warn'); toast('R', '⚒', '素材は5つまでです', '置いた素材を押すと、もどせます', 1600); return; }
  var placed = S.mats.filter(function(x){ return x === id; }).length;
  if(placed >= dkpDup(id)) return;
  S.mats.push(id);
  dkpSfx('click');
  showPend();
}
async function dkpUpRun(){
  var S = dkpS(); if(S.busy) return;
  var tgt = S.upTgt;
  dkpMatsFix();
  var why = dkpUpWhy(tgt, S.mats);
  if(why){ dkpSfx('warn'); toast('R', '⚒', '強化できません', why, 2000); return; }
  var t = pendById(tgt), mats = S.mats.slice(), used = [], okN = 0, tried = 0, spent = 0, lv0 = dkpLv(tgt), stop = '';
  dkpBusy(true);
  try{
    for(var i = 0; i < mats.length; i++){
      if(dkpLv(tgt) >= 8){ stop = 'max'; break; }
      var mid = mats[i];
      if(!dkpMatOk(tgt, mid) || dkpDup(mid) <= 0) continue;
      if(SV.gold < dkpCost(tgt)){ stop = 'gold'; break; }
      await dkpFxFly(i);
      var r = dkpUpTry(tgt, mid);
      if(r.why){ stop = r.why; break; }
      used.push(i); tried++; spent += r.cost; if(r.ok) okN++;
      dkWallet();
      await dkpFxUp(r, i, tgt);
    }
  } catch(e){ console.error('[WP1]', e); }
  finally {
    dkpBusy(false);
    S.mats = mats.filter(function(m, i){ return used.indexOf(i) < 0; });
    if(dkpLv(tgt) >= 8) S.mats = [];
    if(dkpOnScr('pend')) showPend();
    dkWallet();
  }
  if(tried){
    toast('R', okN ? '✨' : '⚒', t.nm + '：' + tried + '回 試して ' + okN + '回 成功',
      '+' + (lv0 - 1) + ' → +' + (dkpLv(tgt) - 1) + '　使ったゴールド ' + dkpFmt(spent) + 'G', 2600);
  }
  if(stop === 'gold') toast('R', '🪙', 'ゴールドが足りなくなりました', '残りの素材はそのままです', 2000);
}
/* 素材が祭壇へ飛ぶ */
async function dkpFxFly(i){
  var src = document.getElementById('dkpM' + i), alt = document.getElementById('dkpAltar');
  if(!src || !alt || DKFX.reduced){ await fxWait(120); return; }
  var a = fxPt(src.querySelector('.dkp-medal') || src), b = fxPt(alt);
  var ghost = document.createElement('div');
  ghost.className = 'dkp-ghost';
  ghost.innerHTML = src.querySelector('.dkp-medal') ? src.querySelector('.dkp-medal').outerHTML : '';
  ghost.style.left = a.x.toFixed(1) + 'px'; ghost.style.top = a.y.toFixed(1) + 'px';
  DKFX.layer().appendChild(ghost);
  src.classList.add('used');
  dkpSfx('cardIn');
  var dx = b.x - a.x, dy = b.y - a.y, ms = DKFX.skip ? 110 : 360;
  try{
    ghost.animate([{ transform:'translate(-50%,-50%) scale(1)' },
                   { transform:'translate(calc(-50% + ' + (dx * .5).toFixed(1) + 'px),calc(-50% + ' + (dy * .5 - 90).toFixed(1) + 'px)) scale(1.15)', offset:.5 },
                   { transform:'translate(calc(-50% + ' + dx.toFixed(1) + 'px),calc(-50% + ' + dy.toFixed(1) + 'px)) scale(.5)' }],
                  { duration:ms, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards' });
  }catch(e){}
  await fxWait(ms);
  if(ghost.parentNode) ghost.parentNode.removeChild(ghost);
}
/* 1回の結果を見せる */
async function dkpFxUp(r, i, tgt){
  var alt = document.getElementById('dkpAltar');
  if(alt){
    /* 再生し直しは el.animate（void offsetWidth でレイアウトを起こさない） */
    alt.classList.toggle('dkp-ng', !r.ok);
    var md = alt.querySelector('.dkp-medal'), fl = alt.querySelector('.dkp-okfl'), ck = alt.querySelector('.dkp-crack');
    try{
      if(r.ok){
        if(fl && fl.animate) fl.animate([{ opacity:1, transform:'scale(.6)' }, { opacity:0, transform:'scale(1.35)' }], { duration:620, easing:'cubic-bezier(.4,0,1,1)' });
        if(md && md.animate) md.animate([{ transform:'scale(1)' }, { transform:'scale(1.16)' }, { transform:'scale(1)' }], { duration:320, easing:'cubic-bezier(.34,1.56,.64,1)' });
      } else if(ck && ck.animate){
        ck.animate([{ opacity:1, transform:'scale(1.08)' }, { opacity:1, transform:'scale(1)', offset:.7 }, { opacity:0, transform:'scale(1)' }], { duration:560, easing:'linear' });
      }
    }catch(e){}
    if(r.ok){
      fxFlash();
      fxBurst(md || alt, { kind:'star', n:24, power:1.15 });
      fxPopText(alt, '+' + (r.lv - 1) + ' 成功！', { tone:'gold', size:52 });
      dkpSfx('gaugeOk');
    } else {
      fxShake(alt, 300);
      fxPopText(alt, '失敗…', { tone:'ruby', size:46 });
      dkpSfx('gaugeNg');
    }
    var A = document.getElementById('dkpLvA'), B = document.getElementById('dkpLvB');
    if(A){ A.textContent = '+' + (r.lv - 1); if(r.ok) DKFX.bumpNum(A, true); }
    if(B) B.textContent = r.lv >= 8 ? 'MAX' : '+' + r.lv;
    var R = document.getElementById('dkpRate'), fb = document.getElementById('dkpFb');
    var nx = dkpFirstMat(tgt, dkpS().mats.slice(i + 1));
    if(R) R.innerHTML = (nx && r.lv < 8 ? dkpPct(dkpRate(tgt, nx)) : '--') + '<small>%</small>';
    if(fb) fb.textContent = dkpFail(tgt) ? '失敗ボーナス +' + (dkpFail(tgt) * 8) + '%' : '';
    var C = document.getElementById('dkpCost'); if(C) C.textContent = dkpFmt(dkpCost(tgt));
  }
  await fxWait(r.ok ? 620 : 560);
  if(alt) alt.classList.remove('dkp-ok', 'dkp-ng');
}
function dkpMixPick(id){
  var S = dkpS(), p = pendById(id); if(!p) return;
  S.mixRes = null;
  dkpSfx('click');
  if(S.mixA === id){ S.mixA = S.mixB; S.mixB = null; showPend(); return; }
  if(S.mixB === id){ S.mixB = null; showPend(); return; }
  var a = pendById(S.mixA);
  if(!a || a.rar !== p.rar){ S.mixA = id; S.mixB = null; }
  else S.mixB = id;
  showPend();
}
async function dkpMixRun(){
  var S = dkpS(); if(S.busy) return;
  var why = dkpMixWhy(S.mixA, S.mixB);
  if(why){ dkpSfx('warn'); toast('R', '⚗️', '合成できません', why, 2000); return; }
  dkpBusy(true);
  var res = null;
  try{
    var alt = document.getElementById('dkpAltar2'), orb = document.getElementById('dkpOrb');
    ['a', 'b'].forEach(function(k){
      var s = document.getElementById('dkpSock' + k);
      if(s) s.classList.add('dkp-in');
    });
    dkpSfx('gachaRoll', 0.6);
    if(orb) orb.classList.add('dkp-charge');
    await fxWait(DKFX.reduced ? 0 : 620);
    res = dkpMix(S.mixA, S.mixB);
    if(res.why){ toast('R', '⚗️', '合成できません', res.why, 2000); return; }
    S.mixA = null; S.mixB = null; S.mixRes = { id:res.id, fresh:res.fresh, aimHit:res.aimHit };
    fxFlash();
    if(orb){ fxBurst(orb, { kind:res.rar === 'SS' ? 'conf' : 'star', n:30, power:1.3 }); }
    dkpSfx(res.rar === 'SS' ? 'gachaRare' : 'landmark');
    if(alt) alt.classList.add('dkp-done');
  } catch(e){ console.error('[WP1]', e); }
  finally {
    dkpBusy(false);
    dkWallet();
    if(dkpOnScr('pend')) showPend();
  }
  if(res && !res.why){
    var p = pendById(res.id);
    var o2 = document.getElementById('dkpOrb');
    if(o2) fxPopText(o2, dkpRarNm(res.rar) + ' 誕生！', { tone:'gold', size:52 });
    toast('R', '⚗️', p.nm + ' が生まれました', (res.aimHit ? '狙いどおり！　' : '') + '+0 から育てられます', 2600);
  }
}
function dkpDoClaim(k, btn){
  var from = btn ? fxPt(btn) : { x:1200, y:600 };
  var rw = dkpRewards().filter(function(x){ return x.k === k; })[0];
  if(!dkpClaim(k)) return;
  dkpSfx('coin');
  fxBurst(from, { kind:'conf', n:22 });
  if(k === 'pb3' || k === 'pb16') fxCoins(from, fxWalletEl('gold'), { kind:'coin', n:12 });
  if(k === 'pb5' || k === 'pb12') fxCoins(from, fxWalletEl('gem'), { kind:'gem', n:8 });
  toast('R', '📖', '図鑑の報酬を受け取りました', rw ? rw.v : '', 2400);
  showPend();
  dkWallet();
}

/* ══════════ ガチャ（J39・G13）：タブ「キャラクターカード」「ペンダント」 ══════════ */
function dkpIsPL(k){ return !!DKP_PL[k]; }
function dkpLaneOf(k){ return DKP_PL[k] || LANES[k] || null; }
function dkpLaneNm(k){ return DKP_PL[k] ? DKP_PL[k].nm : (LANES[k] ? LANES[k].nm + 'カードパック' : ''); }
function dkpLaneKeys(tab){ return tab === 'pend' ? ['pspecial', 'pnormal', 'ppremium'] : ['special', 'normal', 'premium']; }
function dkpFreeMs(k){ return k === 'premium' ? freeLeft() : k === 'ppremium' ? dkpPFreeLeft() : -1; }
function dkpCur(L){ return L.cur === '💎' ? '<i class="dkgem dkp-ci"></i>' : '<i class="dkcoin dkp-ci"></i>'; }
/* 今週の注目ペンダント（S と S+ から週替わり。スペシャルで同じ等級の中の2倍） */
function dkpFeatPend(){
  var L = PENDANTS.filter(function(p){ return p.rar !== 'A'; }), i = 0;
  try{ i = weekIndex(); }catch(e){ i = 0; }
  return L[((i % L.length) + L.length) % L.length];
}
function dkpTile(k){
  var L = dkpLaneOf(k), pl = dkpIsPL(k), col = pl ? L.col : k, ms = dkpFreeMs(k), free = ms === 0;
  var off = Math.round((1 - L.five / (L.one * 5)) * 100);
  var rt = ['SS', 'S', 'A'].filter(function(r){ return (L.w[r] || 0) > 0; }).map(function(r){
    return '<span class="dkp-tr r' + r + '"><i>' + dkpRarNm(r) + '</i>' + dkpPct(L.w[r]) + '%</span>'; }).join('');
  var fp = (pl && L.feat) ? dkpFeatPend() : null;
  return '<section class="dkp-tile dkp-c-' + col + '" data-fx="deal">'
    + '<header class="dkp-tth"><b>' + esc(dkpLaneNm(k)) + '</b></header>'
    + '<div class="dkp-tart"><i class="dkp-tglow"></i>' + (pl ? dkpChestSVG(col) : dkpPackSVG(col))
    +   (fp ? '<span class="dkp-tfeat">' + dkpMedal(fp, { size:58 }) + '<em>注目</em></span>' : '')
    +   '<button class="dkp-oddsb dkp-toddsb" data-dkp-act="odds" data-dkp-v="' + k + '">提供割合</button></div>'
    + '<p class="dkp-tds">' + esc(pl ? L.ds : (DKP_LDS[k] || '')) + '</p>'
    + '<div class="dkp-trates">' + rt + '</div>'
    + (ms >= 0 ? '<div class="dkp-tfr' + (free ? ' dkp-now' : '') + '" id="' + (pl ? 'gFreeP' : 'gFree') + '">' + (free ? 'いま無料で引けます' : '無料まで ' + mmss(ms)) + '</div>' : '')
    + '<div class="dkp-tbtns">'
    +   '<button class="dkbtn ' + (free ? 'gr fx-primary green' : 'gd') + ' dkp-t1" data-lane="' + k + '" data-n="1">' + (free ? '無料で1回' : '1回 ' + dkpCur(L) + dkpFmt(L.one)) + '</button>'
    +   '<span class="dkp-t5w"><button class="dkbtn gd dkp-t5" data-lane="' + k + '" data-n="5">5連 ' + dkpCur(L) + dkpFmt(L.five) + '</button>'
    +   (off > 0 ? '<em class="dkp-off5">' + off + '%お得</em>' : '') + '</span></div>'
    + '</section>';
}
function dkpCardBar(){
  var f = featureCard(), fimg = dkCharImg(f.id);
  var top = CARDPOOL.filter(function(c){ return c.rar === 'SS'; });
  return '<section class="dkp-gbar dkp-cbar" data-fx="rise">'
    + '<div class="dkp-feat"><span class="dkp-fthumb"' + (fimg ? ' style="background-image:url(' + fimg + ')"' : '') + '></span>'
    +   '<div><i>今週の注目カード</i><b>' + esc(f.nm) + '</b></div><em>同じ等級で2倍</em></div>'
    + '<p class="dkp-bonus">カード1枚ごとに、ペンダント <b>18%</b>・サイコロ <b>4%</b> もいっしょに出ます</p>'
    + '<div class="dkp-line"><span class="dkp-linet">S+ の顔ぶれ</span><div class="dkp-lthumbs">' + top.slice(0, 6).map(function(c){
        var img = dkCharImg(c.id);
        return '<span class="dkp-lth r' + c.rar + '"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>' + (img ? '' : '<b>' + esc(c.nm.slice(0, 1)) + '</b>') + '</span>';
      }).join('') + '</div></div>'
    + '</section>';
}
function dkpLuckyBar(){
  var n = dkpLuckyN(), pips = '', i;
  for(i = 0; i < 10; i++) pips += '<i class="' + (i < n ? 'on' : '') + (i === 0 || i === 2 || i === 9 ? ' mk' : '') + '"></i>';
  return '<section class="dkp-gbar dkp-lucky" data-fx="rise">'
    + '<div class="dkp-lkh"><b>ラッキーマイレージ</b><span>×<em id="dkpLuckyN">' + n + '</em>点</span>'
    +   '<button class="dkp-oddsb" data-dkp-act="odds" data-dkp-v="lucky">提供割合</button></div>'
    + '<div class="dkp-lkm"><div class="dkp-lkp">' + pips + '</div><p>プレミアムペンダントを1個引くたびに +1点</p></div>'
    + '<div class="dkp-lkbtns">' + DKP_LUCKY.map(function(x){
        var ok = n >= x.need;
        return '<button class="dkbtn ' + (ok ? 'gr' : 'gd') + ' dkp-lkb" data-dkp-act="lucky" data-dkp-v="' + x.k + '"' + (ok ? '' : ' disabled') + '>'
          + '<b>' + x.need + '点</b><span>' + esc(x.nm) + '</span></button>';
      }).join('') + '</div></section>';
}
/* showGacha(arg)：arg なし＝いまのタブ／'card'・'pend'＝タブ／LANES・DKP_PL のキー＝そのタブ／'cube'＝キューブ画面（J40） */
function showGacha(arg){
  var S = dkpS();
  if(arg === 'cube') return dkpShowCube();
  if(typeof arg === 'string' && !S.busy){
    if(arg === 'card' || arg === 'pend'){ S.gtab = arg; S.pull = null; }
    else if(DKP_PL[arg] || arg === 'lucky'){ S.gtab = 'pend'; S.pull = null; }
    else if(LANES[arg]){ S.gtab = 'card'; S.pull = null; }
  }
  var tab = S.gtab === 'pend' ? 'pend' : 'card';
  if(!S.busy && S.pull && S.pull.phase !== 'done') S.pull = null;
  var tabs = [ { id:'card', ic:dkpPackSVG('premium'), nm:'キャラクター<br>カード', badge:(freeLeft() === 0 ? '!' : '') },
               { id:'pend', ic:dkpMedalSVG(PENDANTS[1]), nm:'ペンダント', badge:((dkpPFreeLeft() === 0 || dkpLuckyN() >= 1) ? '!' : '') } ];
  var el = dkMake('gacha', 'quest', dkHead('gacha', { title:'ガチャ' }) + dkTabs(tabs, tab)
    + '<div class="dkbody dkp-body dkp-gbody dkp-g' + tab + '"><div class="dkp-tiles">' + dkpLaneKeys(tab).map(dkpTile).join('') + '</div>'
    + (tab === 'pend' ? dkpLuckyBar() : dkpCardBar()) + '<div class="dkp-rvst" id="gStage"></div></div>');
  el.classList.add('dkp-scr');
  el.classList.toggle('dkp-busy', !!S.busy);
  dkWire(el, function(id){ var s = dkpS(); if(s.busy) return; s.pull = null; s.gtab = (id === 'pend') ? 'pend' : 'card'; showGacha(); });
  el.onclick = dkpGachaClick;
  dkpLogo(el, 'ガチャ');
  dkpFxTag(el);
  if(typeof gachaTimer !== 'undefined' && gachaTimer){ clearInterval(gachaTimer); gachaTimer = null; }
  try{ bgm('gacha'); }catch(e){}
  screenTo('gacha');
  dkEvery('dkpFree', dkpFreeTick, 1000);
  if(S.pull) dkpRevSync();
}
function dkpFreeTick(){
  var S = dkpS(), re = false;
  [['gFree', freeLeft], ['gFreeP', dkpPFreeLeft]].forEach(function(o){
    var f = document.getElementById(o[0]); if(!f) return;
    var ms = o[1](), txt = ms === 0 ? 'いま無料で引けます' : '無料まで ' + mmss(ms);
    if(f.textContent !== txt) f.textContent = txt;
    if(ms === 0 && !f.classList.contains('dkp-now')) re = true;
  });
  if(re && !S.busy && !S.pull && dkpOnScr('gacha')) showGacha();
}
function dkpGachaClick(e){
  var S = dkpS();
  var t = (e.target && e.target.closest) ? e.target.closest('[data-dkp-act],[data-lane]') : null;
  if(S.busy){
    if(e.target && e.target.closest && e.target.closest('#gStage') && S.pull){ DKFX.skip = true; dkpRevSync(); }
    return;
  }
  if(!t || t.disabled || !this.contains(t)) return;
  if(t.hasAttribute('data-lane')){ doGacha(t.getAttribute('data-lane'), +t.getAttribute('data-n'), t); return; }
  var a = t.getAttribute('data-dkp-act'), v = t.getAttribute('data-dkp-v');
  if(a === 'odds'){ dkpSfx('click'); dkpOdds(v); return; }
  if(a === 'lucky'){ doGacha('lucky:' + v, 1, t); return; }
  if(a === 'again' && S.pull){ doGacha(S.pull.lane, S.pull.n, t); return; }
  if(a === 'close'){ dkpSfx('click'); S.pull = null; showGacha(); return; }
}

/* ══════════ 提供割合（G13）：合計がちょうど 100.00% になるよう最大剰余で丸める ══════════ */
function dkpRound(ps){
  var bp = ps.map(function(p){ return Math.max(0, +p || 0) * 10000; }), fl = bp.map(Math.floor);
  var tot = ps.reduce(function(a, b){ return a + Math.max(0, +b || 0); }, 0);
  if(Math.abs(tot - 1) > 1e-6) return bp.map(function(v){ return Math.round(v) / 100; });
  var left = 10000 - fl.reduce(function(a, b){ return a + b; }, 0);
  var ord = bp.map(function(v, i){ return [v - fl[i], i]; }).sort(function(a, b){ return b[0] - a[0]; });
  for(var i = 0; i < ord.length && left > 0; i++, left--) fl[ord[i][1]]++;
  return fl.map(function(v){ return v / 100; });
}
function dkpP2(v){ return (+v).toFixed(2) + '%'; }
/* レーン k の1個ごとの確率（注目の2倍を入れた後の数字） */
function dkpOddsItems(k){
  var pl = dkpIsPL(k), L = dkpLaneOf(k), out = [];
  if(!L) return out;
  var src = pl ? PENDANTS : CARDPOOL, f = pl ? (L.feat ? dkpFeatPend() : null) : featureCard();
  ['SS', 'S', 'A'].forEach(function(r){
    var w = L.w[r] || 0, pool = src.filter(function(x){ return x.rar === r; });
    if(!pool.length || !(w > 0)) return;
    var fin = !!(f && f.rar === r), tot = pool.length + (fin ? 1 : 0);
    pool.forEach(function(x){
      var isF = fin && x.id === f.id;
      out.push({ kind:pl ? 'pend' : 'card', id:x.id, nm:x.nm, rar:r, p:w * (isF ? 2 : 1) / tot, feat:isF });
    });
  });
  return out;
}
function dkpAimRows(pool, cur){
  var rows = [];
  for(var k = 1; k <= 10; k++){
    var p = k >= 10 ? 1 : Math.max(k * 0.1, 1 / Math.max(1, pool));
    rows.push({ c:[k + '回目', (Math.round(p * 1000) / 10) + '%'], on:k === cur });
  }
  return rows;
}
function dkpOddsHTML(o){
  var h = '<div class="modal"><div class="fx-panel dkp-modal dkp-odds">'
    + '<h3 class="dkp-mh">' + esc(o.title) + '</h3>' + (o.sub ? '<p class="dkp-mp">' + esc(o.sub) + '</p>' : '')
    + '<div class="dkp-obody">';
  (o.blocks || []).forEach(function(b){
    h += '<section class="dkp-oblk">' + (b.hd ? '<h4 class="dkp-sub">' + esc(b.hd) + '</h4>' : '');
    if(b.grades){
      var gr = dkpRound(b.grades.map(function(x){ return x[1]; }));
      h += '<div class="dkp-ogr">' + b.grades.map(function(x, i){
        return '<span class="dkp-og"><span class="dkp-rtag sm r' + x[0] + '">' + dkpRarNm(x[0]) + '</span>クラス<b>' + dkpP2(gr[i]) + '</b></span>'; }).join('') + '</div>';
    }
    if(b.items){
      var ip = dkpRound(b.items.map(function(x){ return x.p; }));
      h += '<div class="dkp-oitems">' + b.items.map(function(x, i){
        var pp = x.kind === 'pend' ? pendById(x.id) : null, img = pp ? '' : (dkCharImg('t' + String(x.id).slice(1)) || dkCharImg(x.id));
        var ic = pp ? dkpMedal(pp, { size:40 }) : '<span class="dkp-oth"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '></span>';
        return '<div class="dkp-oi r' + x.rar + '" data-p="' + ip[i].toFixed(2) + '">' + ic
          + '<span class="dkp-oinm"><span class="dkp-rtag sm r' + x.rar + '">' + dkpRarNm(x.rar) + '</span>' + esc(pp ? dkpShort(pp) : x.nm) + (x.feat ? '<em>注目 ×2</em>' : '') + '</span>'
          + '<b>' + dkpP2(ip[i]) + '</b></div>';
      }).join('') + '</div><p class="dkp-osum">合計 <b>' + dkpP2(ip.reduce(function(a, c){ return a + c; }, 0)) + '</b></p>';
    }
    if(b.table){
      h += '<table class="dkp-otbl"><tr>' + b.table.head.map(function(x){ return '<th>' + esc(x) + '</th>'; }).join('') + '</tr>'
        + b.table.rows.map(function(r){ return '<tr' + (r.on ? ' class="on"' : '') + '>' + r.c.map(function(x){ return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
    }
    if(b.notes) h += '<ul class="dkp-rules">' + b.notes.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    h += '</section>';
  });
  return h + '</div><div class="dkp-mrow"><button class="dkbtn dkp-wood" data-act="ok">閉じる</button></div></div></div>';
}
/* 提供割合の表を開く（レーン・ラッキーマイレージ・ペンダント合成） */
function dkpOdds(v){
  var o = null, L, pl;
  if(DKP_PL[v] || LANES[v]){
    pl = dkpIsPL(v); L = dkpLaneOf(v);
    var notes = pl ? ['同じペンダントが出たら「重なり」になり、強化の素材に使えます']
                   : ['カード1枚ごとに、ペンダント 18%（8種から等しく・各 2.25%）とサイコロ 4%（まだ持っていないサイコロ。全部持っていれば 2,000G）がいっしょに出ます',
                      '持っているカードが出たら「重なり」になり、強化の素材に使えます'];
    if(!pl) notes.unshift('今週の注目カード「' + featureCard().nm + '」は、同じ等級の中で2倍出やすくなっています（表の数字に入っています）');
    if(pl && L.feat) notes.unshift('今週の注目ペンダント「' + dkpFeatPend().nm + '」は、同じ等級の中で2倍出やすくなっています（表の数字に入っています）');
    if(pl && L.lucky) notes.push('1個引くたびにラッキーマイレージが1点たまります');
    notes.push('1回でも5連でも、無料でも、同じ割合です');
    o = { title:dkpLaneNm(v) + '　提供割合', blocks:[
      { hd:'等級ごと', grades:['SS', 'S', 'A'].map(function(r){ return [r, L.w[r] || 0]; }) },
      { hd:(pl ? 'ペンダントごと' : 'カードごと'), items:dkpOddsItems(v) }, { notes:notes } ] };
  } else if(v === 'lucky'){
    o = { title:'ラッキーマイレージ　提供割合', blocks:DKP_LUCKY.map(function(x){
      var its = [];
      ['SS', 'S', 'A'].forEach(function(r){
        var pool = PENDANTS.filter(function(p){ return p.rar === r; });
        pool.forEach(function(p){ if(x.w[r] > 0) its.push({ kind:'pend', id:p.id, nm:p.nm, rar:r, p:x.w[r] / pool.length }); });
      });
      return { hd:x.need + '点　' + x.nm, grades:['SS', 'S', 'A'].filter(function(r){ return x.w[r] > 0; }).map(function(r){ return [r, x.w[r]]; }), items:its };
    }).concat([{ notes:['プレミアムペンダントを1個引くたびに1点たまります', '交換すると、その点数が減ります'] }]) };
  } else if(v === 'pmix'){
    var pS = PENDANTS.filter(function(p){ return p.rar === 'S'; }), pSS = PENDANTS.filter(function(p){ return p.rar === 'SS'; });
    o = { title:'ペンダント合成　提供割合', blocks:[
      { hd:'A → S', items:pS.map(function(p){ return { kind:'pend', id:p.id, nm:p.nm, rar:'S', p:1 / pS.length }; }) },
      { hd:'S → S+（狙いなし）', items:pSS.map(function(p){ return { kind:'pend', id:p.id, nm:p.nm, rar:'SS', p:1 / pSS.length }; }) },
      { hd:'S → S+ の狙い', table:{ head:['回数', '狙いが出る確率'], rows:dkpAimRows(pSS.length, dkpAim() ? ((SV.pity && SV.pity.pend) | 0) + 1 : 0) },
        notes:['k 回目に狙いが出る確率 ＝ k × 10% と 1 ÷ ' + pSS.length + '（S+ の種類数）の大きい方', '10回目は必ず狙いが出ます。狙いが出たら数え直します',
               '狙いが出なかった時は、狙い以外の S+ から等しく出ます'] } ] };
  }
  if(o) modal(dkpOddsHTML(o));
}
/* 合成ボタンの上の「あと n 回で確定」（S → S+ だけ） */
function dkpLeftLine(up){
  var aim = dkpAim(), pity = (SV.pity && SV.pity.pend) | 0;
  if(up !== 'SS' && !aim) return '';
  return '<p class="dkp-left">' + (aim ? 'あと <b>' + Math.max(1, 10 - pity) + '</b> 回で確定（今回 <b>' + dkpPct(dkpAimChance()) + '%</b>）'
                                       : '狙いを決めると、10回目で確定') + '</p>';
}
/* ══════════ 引く ══════════
   カードパックは料金・抽選・grant・saveNow を 5-meta.js の doGacha と同じ順に呼ぶ（乱数の順番をそろえる）。
   lane＝LANES のキー（カード）／DKP_PL のキー（ペンダント）／'lucky:l1'・'lucky:l3'・'lucky:l10'（ラッキーマイレージの交換） */
async function doGacha(lane, n, btn){
  var S = dkpS();
  if(S.busy) return;
  var lk = null;
  if(typeof lane === 'string' && lane.indexOf('lucky:') === 0){
    lk = DKP_LUCKY.filter(function(x){ return 'lucky:' + x.k === lane; })[0];
    if(!lk) return;
  }
  var pl = !lk && !!DKP_PL[lane];
  if(!lk && !pl && !LANES[lane]) lane = 'normal';
  n = lk ? 1 : ((+n === 5) ? 5 : 1);
  var L = lk ? { nm:'ラッキーマイレージ', w:lk.w, cur:'', one:0, five:0 } : dkpLaneOf(lane);
  var free = !lk && n === 1 && ((lane === 'premium' && freeLeft() === 0) || (lane === 'ppremium' && dkpPFreeLeft() === 0));
  var cost = (lk || free) ? 0 : (n === 1 ? L.one : L.five);
  var isGem = L.cur === '💎';
  if(lk && dkpLuckyN() < lk.need){
    toast('R', '🍀', 'ラッキーマイレージが足りません', 'あと ' + (lk.need - dkpLuckyN()) + '点（プレミアムペンダント1個で1点）', 2400);
    dkpSfx('bad'); if(btn && btn.nodeType === 1) fxShake(btn, 260); return;
  }
  if(!lk && !free && (isGem ? SV.gem : SV.gold) < cost){
    toast('R', L.cur, (isGem ? 'ダイヤ' : 'ゴールド') + 'が足りません', isGem ? '出席簿とミッションで増やせます' : 'ゲームに勝つと増えます', 2400);
    dkpSfx('bad'); if(btn && btn.nodeType === 1) fxShake(btn, 260); return;
  }
  dkpBusy(true);
  var got = [];
  try{
    if(lk) SV.luckyMile = dkpLuckyN() - lk.need;
    else if(!free){ if(isGem) SV.gem -= cost; else SV.gold -= cost; }
    if(free){ if(pl) SV.pfreeAt = Date.now(); else SV.freeAt = Date.now(); }
    for(var i = 0; i < n; i++){
      var rar = rollLane(L.w);
      if(pl || lk){
        var pp = PENDANTS.filter(function(p){ return p.rar === rar; }), fp = (pl && L.feat) ? dkpFeatPend() : null;
        if(fp && fp.rar === rar) pp.push(fp);
        var pd = pp.length ? pp[(Math.random() * pp.length) | 0] : PENDANTS[0];
        got.push({ kind:'pend', id:pd.id, rar:pd.rar, p:pd, g:(dkGivePend(pd.id) || { id:pd.id, fresh:false, dup:0 }) });
      } else {
        var pool = CARDPOOL.filter(function(c){ return c.rar === rar; }), f = featureCard();
        if(f.rar === rar) pool.push(f);
        var c = pool.length ? pool[(Math.random() * pool.length) | 0] : CARDPOOL[0];
        got.push({ kind:'card', id:c.id, rar:c.rar, c:c, g:(grant(c) || {}) });
      }
    }
    if(pl && L.lucky) SV.luckyMile = dkpLuckyN() + n;
    saveNow();
    dkEmit('gacha:pull', { lane:lane, n:n, kind:(pl || lk) ? 'pend' : 'card', got:got.map(function(o){
      return o.kind === 'pend' ? { id:o.id, rar:o.rar, card:null, pend:o.g, die:null, gold:0 }
                               : { id:o.id, rar:o.rar, card:o.g.card || null, pend:o.g.pend || null, die:o.g.die || null, gold:o.g.gold || 0 }; }) });
  } catch(e){
    console.error('[WP16a]', e);
    dkpBusy(false);
    return;
  }
  var best = got.some(function(o){ return o.rar === 'SS'; }) ? 'SS' : got.some(function(o){ return o.rar === 'S'; }) ? 'S' : 'A';
  var P = { lane:lane, n:n, got:got, best:best, phase:'charge', flipped:0, free:free, cost:cost, kind:lk ? '' : (isGem ? 'gem' : 'coin'),
            pl:!!(pl || lk), col:lk ? 'premium' : (pl ? L.col : lane), lucky:lk ? lk.k : '' };
  S.pull = P;
  S.gtab = P.pl ? 'pend' : 'card';
  try{ await dkpReveal(P); }
  catch(e){ console.error('[WP16a]', e); }
  finally {
    DKFX.skip = false;
    if(S.pull === P){ P.phase = 'done'; P.flipped = P.n; }
    dkpBusy(false);
    if(S.pull === P) dkpRevSync();
    dkpSeenAll(got);
    dkWallet();
  }
}
/* 図鑑に「見た」を付ける（初めての物だけ 200G） */
function dkpSeenAll(got){
  var fresh = 0;
  got.forEach(function(o){
    if(dkMarkSeen(o.id)) fresh++;
    if(o.kind === 'card' && o.g && o.g.pend && dkMarkSeen(o.g.pend.id)) fresh++;
    if(o.kind === 'card' && o.g && o.g.die && dkMarkSeen(o.g.die.id)) fresh++;
  });
  if(fresh) toast('R', '📖', '図鑑に新しく登録', fresh + '件　+' + dkpFmt(fresh * 200) + 'G', 2400);
}
function dkpGEl(sel){ var st = document.getElementById('gStage'); return st ? st.querySelector(sel) : null; }
async function dkpReveal(P){
  var S = dkpS();
  var alive = function(){ return S.pull === P && dkpOnScr('gacha') && !!document.getElementById('gStage'); };
  showGacha();
  if(!alive()) return;
  if(DKFX.reduced){ P.phase = 'done'; P.flipped = P.n; dkpRevSync(); return; }
  var art = dkpGEl('.dkp-rvart');
  if(P.kind && !P.free) fxCoins(fxWalletEl(P.kind), art || { x:800, y:470 }, { kind:P.kind, n:(P.n === 5 ? 10 : 6), spread:50 });
  dkWallet();
  dkpSfx('gachaRoll', P.best === 'SS' ? 1 : P.best === 'S' ? 0.5 : 0);
  await fxWait(450);
  if(!alive()) return;
  P.phase = 'burst'; dkpRevSync();
  var at = dkpGEl('.dkp-rvart') || { x:800, y:470 };
  fxFlash();
  fxBurst(at, { kind:'star', n:28, power:1.4 });
  if(P.best === 'SS'){
    await fxWait(160);
    fxFlash();
    fxBurst(at, { kind:'conf', n:34, power:1.2 });
    dkpSfx('gachaRare');
  } else dkpSfx('coinBurst');
  await fxWait(260);
  if(!alive()) return;
  P.phase = 'deal0'; dkpRevSync();
  await fxWait(30);
  P.phase = 'deal'; dkpRevSync();
  dkpSfx('cardIn');
  await fxWait(340 + 90 * (P.n - 1) + 80);
  P.phase = 'flip';
  for(var i = 0; i < P.n; i++){
    if(!alive()) return;
    var it = P.got[i];
    if(it.rar === 'SS' && !DKFX.skip){
      var sl = dkpGEl('.dkp-ps[data-i="' + i + '"] .pullcard');
      if(sl) fxShake(sl, 300);
      dkpSfx('diceShake', 1);
      await fxWait(300);
      if(!alive()) return;
    }
    P.flipped = i + 1; dkpRevSync();
    var card = dkpGEl('.dkp-ps[data-i="' + i + '"] .pullcard');
    if(card){
      /* 等級で閃光の色と音を変える（A＝青・S＝紫・S+＝金） */
      var R = DKP_RARFX[it.rar] || DKP_RARFX.A;
      dkpFlashCol('gStage', R.c);
      fxBurst(card, { kind:R.burst, n:R.n, power:R.pow, color:R.c });
      if(it.rar === 'SS'){ fxBurst(card, { kind:'star', n:14, power:.9 }); fxPopText(card, 'S+ 獲得！', { tone:'gold', size:54 }); }
      else if(it.rar === 'S') fxBurst(card, { kind:'star', n:10, power:.8 });
      dkpSfx(R.sfx);
      /* ペンダントは、そのうえで属性ごとの光と音（16種を見分ける） */
      if(it.kind === 'pend' && it.p) dkpElemPlay(card, it.p.id);
    }
    await fxWait(380 + 140);
  }
  if(!alive()) return;
  P.phase = 'done'; dkpRevSync();
}
function dkpFresh(o){ return !!(o && (o.kind === 'pend' ? (o.g && o.g.fresh) : (o.g && o.g.card && o.g.card.fresh))); }
/* 引いた結果の層を、状態 P から作る・合わせる（何度呼んでもよい。作り直された画面にも追いつく） */
function dkpRevSync(){
  var S = dkpS(), P = S.pull, g = document.getElementById('gacha'), st = document.getElementById('gStage');
  if(!g || !st) return;
  var on = !!P;
  g.classList.toggle('dkp-rev', on);
  g.classList.toggle('dkp-fast', !!(on && DKFX.skip));
  if(!on){ if(st.firstChild) st.innerHTML = ''; st.className = 'dkp-rvst'; return; }
  var ph = P.phase;
  st.classList.toggle('dkp-charge', ph === 'charge');
  st.classList.toggle('dkp-burst', ph === 'burst');
  st.classList.toggle('dkp-gone', ph !== 'charge' && ph !== 'burst');
  st.classList.toggle('dkp-ss', P.best === 'SS' && ph !== 'charge');
  var art = st.querySelector(':scope > .dkp-rvart');
  if(!art || art._dkpP !== P){
    if(art) art.remove();
    art = document.createElement('div');
    art.className = 'dkp-rvart';
    art._dkpP = P;
    art.innerHTML = '<i class="dkp-rvglow"></i>' + (P.pl ? dkpChestSVG(P.col) : dkpPackSVG(P.col));
    st.appendChild(art);
  }
  var rv = st.querySelector(':scope > .dkp-rv');
  if(!rv || rv._dkpP !== P){
    if(rv) rv.remove();
    rv = document.createElement('div');
    rv.className = 'dkp-rv n' + P.n;
    rv._dkpP = P;
    rv.innerHTML = dkpRevHTML(P);
    st.appendChild(rv);
  }
  var shown = (ph === 'deal0' || ph === 'deal' || ph === 'flip' || ph === 'done');
  rv.classList.toggle('dkp-d0', shown);
  rv.classList.toggle('dkp-dealt', ph === 'deal' || ph === 'flip' || ph === 'done');
  rv.classList.toggle('dkp-done', ph === 'done');
  rv.querySelectorAll('.dkp-ps').forEach(function(ps){
    var i = +ps.getAttribute('data-i'), fl = i < P.flipped || ph === 'done';
    var pc = ps.querySelector('.pullcard');
    if(pc && fl && !pc.classList.contains('flipped')){
      pc.classList.add('flipped');
      if(dkpFresh(P.got[i]) && !pc.querySelector('.fx-new')){
        var nw = document.createElement('span'); nw.className = 'fx-new dkp-new'; nw.textContent = 'NEW!';
        pc.querySelector('.fx-front').appendChild(nw);
      }
      ps.classList.add('dkp-open');
    }
  });
}
function dkpRevHTML(P){
  var w = P.n === 1 ? 250 : 214, gap = 26;
  var cards = P.got.map(function(o, i){
    var dx = ((P.n - 1) / 2 - i) * (w + gap), chips = '', front;
    if(o.kind === 'pend'){
      var p = o.p;
      if(o.g && !o.g.fresh) chips += '<span class="dkp-chip dup">重なり +1</span>';
      front = '<div class="fx-face fx-front dkp-pfr"><i class="dkp-pfrays"></i><div class="dkp-pfm">' + dkpMedal(p, { size:(P.n === 1 ? 176 : 146) }) + '</div>'
        + '<span class="dkp-pcrt r' + p.rar + '">' + dkpRarNm(p.rar) + '</span>'
        + '<div class="dkp-pcnm"><b>' + esc(dkpShort(p)) + '</b><i>' + esc(dkpTrg(p.trg)) + '</i></div></div>';
    } else {
      var c = o.c, img = dkCharImg(c.id);
      if(o.g && o.g.card && !o.g.card.fresh) chips += '<span class="dkp-chip dup">重なり +1</span>';
      if(o.g && o.g.pend){ var pp = pendById(o.g.pend.id);
        if(pp) chips += '<span class="dkp-chip pd">' + dkpMedal(pp, { size:34 }) + '<b>' + esc(dkpShort(pp)) + '</b>' + (o.g.pend.fresh ? '<em>NEW</em>' : '<em>重なり</em>') + '</span>'; }
      if(o.g && o.g.die){ var dd = dieById(o.g.die.id);
        chips += '<span class="dkp-chip di">' + dkpDieIcon() + '<b>' + esc(String(dd.nm).replace(/の?サイコロ$/, '') || dd.nm) + '</b><em>NEW</em></span>'; }
      if(o.g && o.g.gold) chips += '<span class="dkp-chip go"><i class="dkcoin dkp-ci"></i><b>+' + dkpFmt(o.g.gold) + 'G</b></span>';
      front = '<div class="fx-face fx-front">'
        + (img ? '<div class="dkp-pcart" style="background-image:url(' + img + ')"></div>' : '<div class="dkp-pcart dkp-pcph"><b>' + esc(c.nm.slice(0, 1)) + '</b></div>')
        + (c.rar === 'SS' ? '<i class="dkp-pcsh"></i>' : '')
        + '<span class="dkp-pcrt r' + c.rar + '">' + (RAR[c.rar] ? RAR[c.rar].nm : c.rar) + '</span>'
        + '<div class="dkp-pcnm"><b>' + esc(c.nm) + '</b><i>' + esc(c.role) + '</i></div></div>';
    }
    return '<div class="dkp-ps" data-i="' + i + '" style="--dx:' + dx.toFixed(1) + 'px;--dr:' + ((i - (P.n - 1) / 2) * -4).toFixed(1) + 'deg;--i:' + i + '">'
      + '<div class="pullcard fx-flip3d r' + o.rar + '"><div class="fx-face fx-back">' + dkpCrest() + '</div>' + front + '</div>'
      + '<div class="dkp-px">' + chips + '</div></div>';
  }).join('');
  var nNew = P.got.filter(dkpFresh).length, nDup = P.got.length - nNew, again = '';
  if(P.lucky){
    var lk = DKP_LUCKY.filter(function(x){ return x.k === P.lucky; })[0];
    if(lk && dkpLuckyN() >= lk.need) again = '<button class="dkbtn gd fx-primary dkp-again" data-dkp-act="again">もう1回 ' + lk.need + '点</button>';
  } else {
    var L = dkpLaneOf(P.lane) || LANES.normal, isGem = L.cur === '💎';
    again = '<button class="dkbtn gd fx-primary dkp-again" data-dkp-act="again">もう1回 ' + (isGem ? '<i class="dkgem dkp-ci"></i>' : '<i class="dkcoin dkp-ci"></i>')
      + dkpFmt(P.n === 1 ? L.one : L.five) + '</button>';
  }
  var head = P.best === 'SS' ? 'S+ 獲得！' : P.lucky ? 'ラッキーマイレージ' : (dkpLaneNm(P.lane) + (P.pl ? ' 獲得' : ' 開封'));
  return '<div class="dkp-rvhd"><div class="fx-ribbon ' + (P.best === 'SS' ? 'red' : 'gold') + '"><b>' + esc(head) + '</b></div></div>'
    + '<div class="dkp-row">' + cards + '</div>'
    + '<div class="dkp-rvft"><span class="dkp-sum">NEW <b>' + nNew + '</b>　重なり <b>' + nDup + '</b></span>' + again
    + '<button class="dkbtn dkp-wood" data-dkp-act="close">閉じる</button></div>';
}
/* ══════════ キューブ（J40）：対戦の報酬の箱。押すとすぐ開く（待ち時間・クローバーなし） ══════════
   SV.cubes と中身は WP12a（C21 dkGiveCube / dkOpenCube。最大7個）。ここは置き場と開ける演出だけ */
function dkpCubeKind(k){ return DKP_CUBEK[k] ? k : ((k === 'diamond' || k === 'dk') ? 'dia' : 'wood'); }
function dkpCubes(){
  var a = Array.isArray(SV.cubes) ? SV.cubes : [];
  return a.map(function(c, i){
    if(c && typeof c === 'object') return { id:(c.id !== undefined && c.id !== null) ? c.id : i, kind:dkpCubeKind(c.kind) };
    if(typeof c === 'string') return { id:i, kind:dkpCubeKind(c) };
    return null;
  }).filter(function(c){ return !!c; }).slice(0, 7);
}
function dkpShowCube(){
  var S = dkpS(), list = dkpCubes(), res = S.cres, slots = '', i;
  for(i = 0; i < 7; i++){
    var c = list[i];
    if(!c){ slots += '<div class="dkp-cslot dkp-cempty"><span class="dkp-cico">' + dkpCubeSVG('wood', true) + '</span><b>空き</b></div>'; continue; }
    slots += '<button class="dkp-cslot dkp-k-' + c.kind + '" data-dkp-act="copen" data-dkp-v="' + i + '" id="dkpCs' + i + '">'
      + '<span class="dkp-cico">' + dkpCubeSVG(c.kind) + '</span><b>' + esc(DKP_CUBEK[c.kind].s) + '</b><em>タップで開ける</em></button>';
  }
  var none = !list.length && !res, big = res ? res.kind : (list[0] ? list[0].kind : 'wood');
  var stage = '<section class="fx-panel dkp-cstage' + (res ? ' dkp-cdone' : '') + '" data-fx="riseL"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><b class="dkp-ttl">キューブオープン</b><span class="dkp-note">待ち時間なし・すぐ開きます</span></header>'
    + '<div class="dkp-cped" id="dkpCPed"><i class="fx-halo dkp-halo"></i><i class="dkp-cfloor"></i>'
    +   '<div class="dkp-cbig' + (none ? ' dkp-cnone' : '') + '" id="dkpCBig">' + dkpCubeSVG(big, none) + '</div></div>'
    + (res ? dkpCubeResHTML(res) : '<p class="dkp-ctx">' + (list.length ? '右のキューブを押すと、その場で開きます' : 'キューブはプレイ後の結果報酬として獲得できます') + '</p>')
    + '</section>';
  var shelf = '<section class="fx-panel dkp-cshelf" data-fx="riseR"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><b class="dkp-ttl">所持キューブ</b><span class="dkp-cnt"><b>' + list.length + '</b> / 7</span></header>'
    + '<div class="dkp-cgrid">' + slots + '</div>'
    + '<ul class="dkp-rules"><li>最大7個まで持てます。8個目が届くと、いちばん古いキューブを自動で開けて中身を受け取ります</li>'
    +   '<li>ウッド＜シルバー＜ゴールド＜ダイヤの順に、良いアイテムが出やすくなります</li></ul></section>';
  var el = dkMake('cube', 'quest', dkHead('cube', { title:'キューブ' })
    + dkTabs([ { id:'cube', ic:dkpCubeSVG('gold'), nm:'キューブ' }, { id:'gacha', ic:dkpPackSVG('premium'), nm:'ガチャ' } ], 'cube')
    + '<div class="dkbody dkp-body dkp-cbody">' + stage + shelf + '</div>');
  el.classList.add('dkp-scr');
  el.classList.toggle('dkp-busy', !!S.busy);
  dkWire(el, function(id){ var s = dkpS(); if(s.busy) return; if(id === 'gacha'){ s.cres = null; showGacha(); } });
  el.onclick = dkpCubeClick;
  dkpLogo(el, 'キューブ');
  dkpFxTag(el);
  try{ bgm('gacha'); }catch(e){}
  screenTo('cube');
}
function dkpCubeClick(e){
  var S = dkpS(); if(S.busy) return;
  var t = (e.target && e.target.closest) ? e.target.closest('[data-dkp-act]') : null;
  if(!t || t.disabled || !this.contains(t)) return;
  var a = t.getAttribute('data-dkp-act');
  if(a === 'copen'){ dkpCubeOpen(+t.getAttribute('data-dkp-v'), t); return; }
  if(a === 'cok'){ dkpSfx('click'); S.cres = null; dkpShowCube(); return; }
}
function dkpItemNm(it){
  var k = String(it.kind || '');
  return ({ key:'ゴールドキー', ticket:'入場券', frame:'名札の枠', cube:'キューブ', card:'キャラクターカード', pend:'ペンダント', die:'サイコロ' })[k] || k;
}
/* 中身の札（dkOpenCube の戻り値は grant と同じ形。gem・items があっても出す） */
function dkpCubeResHTML(res){
  var o = res.got || {}, ch = [], cd = o.card && cardById(o.card.id), pd = o.pend && pendById(o.pend.id);
  if(cd){
    var img = dkCharImg('t' + cd.id.slice(1)) || dkCharImg(cd.id);
    ch.push('<div class="dkp-crw r' + cd.rar + '"><span class="dkp-crimg"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '></span>'
      + '<div><b>' + esc(cd.nm) + '</b><em>' + dkpRarNm(cd.rar) + 'クラス・' + (o.card.fresh ? 'NEW' : '重なり +1') + '</em></div></div>');
  }
  if(pd) ch.push('<div class="dkp-crw r' + pd.rar + '">' + dkpMedal(pd, { size:64 }) + '<div><b>' + esc(dkpShort(pd)) + '</b><em>'
    + dkpRarNm(pd.rar) + 'ペンダント・' + (o.pend.fresh ? 'NEW' : '重なり +1') + '</em></div></div>');
  if(o.die && o.die.id){ var dd = dieById(o.die.id); ch.push('<div class="dkp-crw"><span class="dkp-crdie">' + dkpDieIcon() + '</span><div><b>' + esc(dd.nm) + '</b><em>サイコロ・NEW</em></div></div>'); }
  if(+o.gold > 0) ch.push('<div class="dkp-crw"><i class="dkcoin dkp-crcur"></i><div><b>' + dkpFmt(o.gold) + ' ゴールド</b><em>ゴールド</em></div></div>');
  if(+o.gem > 0) ch.push('<div class="dkp-crw"><i class="dkgem dkp-crcur"></i><div><b>ダイヤ ' + dkpFmt(o.gem) + '</b><em>ダイヤ</em></div></div>');
  (Array.isArray(o.items) ? o.items : []).forEach(function(it){
    if(it && it.kind) ch.push('<div class="dkp-crw"><span class="dkp-crdie">' + dkpCubeSVG('gold') + '</span><div><b>' + esc(dkpItemNm(it)) + '</b><em>×' + ((it.n | 0) || 1) + '</em></div></div>');
  });
  if(!ch.length) ch.push('<div class="dkp-crw"><div><b>中身は空でした</b><em>次のキューブに期待しましょう</em></div></div>');
  return '<div class="dkp-cres"><div class="fx-ribbon gold dkp-crib"><b>キューブオープン！</b></div>'
    + '<div class="dkp-crws">' + ch.join('') + '</div>'
    + '<button class="dkbtn gd fx-primary dkp-cok" data-dkp-act="cok">確認</button></div>';
}
/* 開ける：先に dkOpenCube（中身の付与とセーブは WP12a）→ 箱が台座へ飛ぶ・揺れる・光って中身 */
async function dkpCubeOpen(i, btn){
  var S = dkpS(); if(S.busy) return;
  var c = dkpCubes()[i]; if(!c) return;
  var r = null;
  try{ r = (typeof dkOpenCube === 'function') ? dkOpenCube(c.id) : null; }catch(e){ console.error('[WP16a]', e); r = null; }
  if(!r || typeof r !== 'object'){ dkpSfx('warn'); toast('R', '📦', 'キューブを開けられませんでした', 'もう一度お試しください', 1800); dkpShowCube(); return; }
  dkpBusy(true);
  try{
    var big = document.getElementById('dkpCBig'), from = btn ? fxPt(btn.querySelector('.dkp-cico') || btn) : null;
    if(big){ big.innerHTML = dkpCubeSVG(c.kind); big.classList.remove('dkp-cnone'); }
    if(btn) btn.classList.add('dkp-cused');
    if(from && big && big.animate && !DKFX.reduced){
      var to = fxPt(big);
      try{ big.animate([{ transform:'translate(' + (from.x - to.x).toFixed(1) + 'px,' + (from.y - to.y).toFixed(1) + 'px) scale(.35)' }, { transform:'translate(0,0) scale(1)' }],
        { duration:380, easing:'cubic-bezier(.16,1,.3,1)' }); }catch(e){}
      dkpSfx('cardIn');
      await fxWait(380);
    }
    dkpSfx('gachaRoll', c.kind === 'dia' ? 1 : c.kind === 'gold' ? 0.6 : 0.2);
    if(big && big.animate && !DKFX.reduced){
      try{ big.animate([{ transform:'rotate(0)' }, { transform:'rotate(-7deg) scale(.95)' }, { transform:'rotate(7deg) scale(.93)' },
        { transform:'rotate(-6deg) scale(.92)' }, { transform:'rotate(5deg) scale(.92)' }, { transform:'rotate(0) scale(1.1)' }], { duration:520, easing:'linear' }); }catch(e){}
      await fxWait(520);
    }
    /* キューブの種類で閃光の色と音を変える（ウッド＜シルバー＜ゴールド＜ダイヤ） */
    var CK = DKP_CUBEK[c.kind] || DKP_CUBEK.wood, hi = (c.kind === 'gold' || c.kind === 'dia');
    dkpFlashCol('dkpCPed', CK.c[0]);
    if(hi) fxFlash();
    fxBurst(big || { x:560, y:430 }, { kind:'star', n:(hi ? 28 : 18), power:(hi ? 1.35 : 1.05) });
    fxBurst(big || { x:560, y:430 }, { kind:'conf', n:(hi ? 30 : 14), power:1.2, color:CK.c[1] });
    dkpSfx(hi ? 'gachaRare' : 'coinBurst');
  } catch(e){ console.error('[WP16a]', e); }
  finally {
    S.cres = { kind:c.kind, got:r };
    dkpBusy(false);
  }
  dkpShowCube();
  var box = document.querySelector('#cube .dkp-crws');
  if(+(r.gold || 0) > 0 && box) fxCoins(box, fxWalletEl('gold'), { kind:'coin', n:10 }).then(function(){ dkWallet(); });
  else dkWallet();
  try{ if(r.card && r.card.id) dkMarkSeen(r.card.id); if(r.pend && r.pend.id) dkMarkSeen(r.pend.id); if(r.die && r.die.id) dkMarkSeen(r.die.id); }catch(e){}
}

/* ══════════ 起動 ══════════ */
(function(){
  try{
    dkOn('screen', function(o){
      var S = dkpS();
      S.scr = (o && o.id) || '';
      if(S.scr !== 'gacha' && !S.busy) S.pull = null;
      if(S.scr !== 'cube' && !S.busy) S.cres = null;
    });
  }catch(e){ console.error('[WP16a]', e); }
})();
