
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — ペンダント＆キューブ（9b-pend.js / WP1）
   ──────────────────────────────────────────────────────────────
   ・宣言し直す関数は showPend / showGacha / doGacha だけ（§5）。
     ほかは dkp で始まる内部関数。状態は DKP_S（使う時に作る）。
   ・ペンダントの4タブ（ペンダント／強化／合成／図鑑）と、キューブの引く演出。
   ・遊びの結果（強化・合成・キューブの抽選）は Math.random。
     見た目だけの乱数は DKFX.rnd()（自動対戦の種を乱さないため）。
   ・DOM に触る初期化は最後の IIFE だけ。
   ══════════════════════════════════════════════════════════════ */

var DKP_S = null;      // 画面の状態
var DKP_N = 0;         // SVG のグラデーション id の連番

function dkpS(){
  if(!DKP_S) DKP_S = { tab:'pend', sel:null, sort:'rar', prevTab:'', upTgt:null, mats:[],
    mixA:null, mixB:null, mixRes:null, busy:false, pull:null, scr:'', after:null };
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
    onTravel:'ワープのマス', onOwnLand:'自分の街に止まった時', onSameTile:'相手と同じマス',
    onRoll:'サイコロを振る時' })[t] || '対戦中';
}
function dkpSrc(r){
  if(r === 'SS') return 'キューブ（スペシャル・プレミアム）／Sの+7を2つ合成';
  if(r === 'S')  return 'キューブ／Aの+7を2つ合成';
  return 'キューブ／出席簿の5日目';
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
  ['pend', 'gacha'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.classList.toggle('dkp-busy', !!on);
  });
}

/* ══════════ 絵（SVG で自作） ══════════ */
function dkpGem(id){
  var T = { p1:['#FFF7B8','#FFC21F','#9A5A00'], p2:['#DDF6FF','#35B0F0','#0A3F80'],
            p3:['#E2FFD6','#38C067','#0C4F24'], p4:['#FFE6C2','#C98636','#4E2A0C'],
            p5:['#FFF0C0','#FF962A','#9A3404'], p6:['#FFE4EF','#F07BAC','#84224F'],
            p7:['#ECE6FF','#8A72E2','#2A1B66'], p8:['#FFD6C6','#E6402A','#700B04'] };
  return T[id] || T.p3;
}
function dkpStar(cx, cy, ro, ri, n){
  var s = '';
  for(var i = 0; i < n * 2; i++){
    var a = Math.PI * i / n - Math.PI / 2, r = (i % 2) ? ri : ro;
    s += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1) + ' ';
  }
  return s + 'Z';
}
/* ペンダントごとの紋（40×40 の枠） */
function dkpEmblem(id){
  var st = ' fill="#FFFDF4" stroke="rgba(40,20,4,.55)" stroke-width="1.6" stroke-linejoin="round"';
  if(id === 'p1') return '<path' + st + ' d="M24 2 L8 23 H18 L14 38 L33 14 H22 L27 2 Z"/>';
  if(id === 'p2') return '<path' + st + ' d="M20 3 L35 18 L20 37 L5 18 Z"/>'
    + '<path d="M5 18 H35 M20 3 L14 18 L20 37 L26 18 Z" fill="none" stroke="rgba(40,20,4,.45)" stroke-width="1.3"/>';
  if(id === 'p3') return '<g' + st + '><circle cx="20" cy="11" r="8"/><circle cx="11" cy="23" r="8"/><circle cx="29" cy="23" r="8"/></g>'
    + '<path d="M20 24 Q22 32 16 38" fill="none" stroke="#FFFDF4" stroke-width="3.2" stroke-linecap="round"/>';
  if(id === 'p4') return '<path' + st + ' d="M2 34 L14 13 L20 22 L27 9 L38 34 Z"/><path d="M24 15 L27 9 L30 15 Z" fill="rgba(150,110,60,.7)"/>';
  if(id === 'p5') return '<path' + st + ' d="' + dkpStar(20, 20, 19, 11, 8) + '"/>'
    + '<circle cx="20" cy="20" r="7.5" fill="#FFC45A" stroke="rgba(40,20,4,.45)" stroke-width="1.3"/>';
  if(id === 'p6') return '<g' + st + '>' + [0, 72, 144, 216, 288].map(function(a){
      return '<ellipse cx="20" cy="10.5" rx="6.6" ry="9.5" transform="rotate(' + a + ' 20 20)"/>'; }).join('')
    + '</g><circle cx="20" cy="20" r="4" fill="#FFD24D"/>';
  if(id === 'p7') return '<path' + st + ' d="M25 3 A17 17 0 1 0 37 29 A13 13 0 1 1 25 3 Z"/>';
  if(id === 'p8') return '<path' + st + ' d="M20 2 C24 11 34 16 31 27 C29 34 24 38 20 38 C13 38 8 33 9 25 C10 18 15 16 16 9 C19 13 18 18 21 20 C23 14 21 8 20 2 Z"/>';
  return '';
}
/* ペンダントの絵（金の縁・宝石・紋）。opt={size, plus, rt, cls, svg} */
function dkpMedalSVG(p){
  var n = ++DKP_N, id = 'dkpm' + n, c = dkpGem(p.id);
  var rim = p.rar === 'SS' ? ['#FFF7D6', '#F5CC4E', '#A36F0B', '#4A2E02']
          : p.rar === 'S'  ? ['#FFF1C8', '#DDB04E', '#86591A', '#35230A']
          :                  ['#F4F8FF', '#B9CCE2', '#62809F', '#1E2C40'];
  var dots = '', i, a;
  if(p.rar === 'SS'){
    for(i = 0; i < 8; i++){
      a = Math.PI * i / 4 + Math.PI / 8;
      dots += '<circle cx="' + (60 + 50 * Math.cos(a)).toFixed(1) + '" cy="' + (72 + 50 * Math.sin(a)).toFixed(1)
        + '" r="3.6" fill="' + (i % 2 ? '#3FA0F0' : '#E8402A') + '" stroke="#FFF3C8" stroke-width="1.2"/>';
    }
  } else {
    for(i = 0; i < 4; i++){
      a = Math.PI * i / 2 + Math.PI / 4;
      dots += '<circle cx="' + (60 + 50 * Math.cos(a)).toFixed(1) + '" cy="' + (72 + 50 * Math.sin(a)).toFixed(1)
        + '" r="3" fill="' + (p.rar === 'S' ? '#B67CF0' : '#E6F0FA') + '" stroke="' + rim[3] + '" stroke-width="1"/>';
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
  var sz = opt.size || 96;
  var plus = (typeof opt.plus === 'number') ? '<b class="dkp-plus' + (opt.plus >= 7 ? ' mx' : '') + '">+' + opt.plus + '</b>' : '';
  var rt = opt.rt ? '<i class="dkp-rt r' + p.rar + '">' + dkpRarNm(p.rar) + '</i>' : '';
  return '<span class="dkp-medal r' + p.rar + (opt.cls ? ' ' + opt.cls : '') + '" style="--ms:' + sz + 'px">'
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
  if(k === 'normal')  return { top:'#F2F8FF', left:'#A9C4E0', right:'#5E7A98', glow:'rgba(150,200,255,.34)' };
  if(k === 'special') return { top:'#FFB4A6', left:'#D8392C', right:'#86160E', glow:'rgba(255,96,72,.3)' };
  return { top:'#FFF3BE', left:'#F0B92C', right:'#A56C06', glow:'rgba(255,208,96,.4)' };
}
function dkpCubeIcon(k){
  var c = dkpLaneCol(k);
  return '<svg viewBox="0 0 60 60" aria-hidden="true">'
    + '<path d="M30 6 L52 18 L30 30 L8 18 Z" fill="' + c.top + '"/>'
    + '<path d="M8 18 L30 30 V54 L8 42 Z" fill="' + c.left + '"/>'
    + '<path d="M52 18 L30 30 V54 L52 42 Z" fill="' + c.right + '"/>'
    + '<path d="M30 6 L52 18 V42 L30 54 L8 42 V18 Z" fill="none" stroke="#FFE08A" stroke-width="2.6" stroke-linejoin="round"/>'
    + '<path d="M8 18 L30 30 L52 18 M30 30 V54" fill="none" stroke="#FFE08A" stroke-width="1.6"/>'
    + '<path d="M30 12 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#FFFFFF"/></svg>';
}
function dkpCubeFace(k){
  if(k === 'premium') return dkpCrest();
  if(k === 'special') return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10 L86 42 L50 92 L14 42 Z" fill="#FFE0D6" stroke="#5A0A06" stroke-width="4" stroke-linejoin="round"/>'
    + '<path d="M14 42 H86 M50 10 L36 42 L50 92 L64 42 Z" fill="none" stroke="#5A0A06" stroke-width="2.6" stroke-linejoin="round"/>'
    + '<path d="M50 10 L36 42 H64 Z" fill="rgba(255,255,255,.55)"/></svg>';
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 L86 29 V71 L50 92 L14 71 V29 Z" fill="rgba(255,255,255,.35)" stroke="#1E3656" stroke-width="4" stroke-linejoin="round"/>'
    + '<path d="M50 8 V92 M14 29 L86 71 M86 29 L14 71" stroke="#1E3656" stroke-width="3" opacity=".75"/>'
    + '<circle cx="50" cy="50" r="12" fill="#FFFFFF" stroke="#1E3656" stroke-width="3"/></svg>';
}
function dkpDieIcon(){
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="5" width="30" height="30" rx="7" fill="#FFFDF4" stroke="#3A2405" stroke-width="2.6"/>'
    + '<circle cx="13" cy="13" r="3" fill="#3A2405"/><circle cx="20" cy="20" r="3.2" fill="#C9302C"/><circle cx="27" cy="27" r="3" fill="#3A2405"/></svg>';
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
  try{ var td = DKCORE_today(); td.pup = (td.pup | 0) + 1; }catch(e){}
  if(SV.stat) SV.stat.pup = (SV.stat.pup | 0) + 1;
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
  if(slot === undefined || slot === null){ slot = SV.slots.indexOf(null); if(slot < 0) return false; }
  slot = slot | 0; if(slot < 0 || slot > 3) return false;
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
  return [ { k:'pb3', need:3, nm:'3種 登録', ic:'gold', v:'3,000G' },
           { k:'pb5', need:5, nm:'5種 登録', ic:'gem',  v:'ダイヤ 8' },
           { k:'pb8', need:8, nm:'8種 登録', ic:'up',   v:'強化費 −20%（ずっと）' } ];
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
    +   '<p>キューブ（ガチャ）でカードを引くと、1枚ごとに 18% の確率でペンダントもいっしょに手に入ります。出席簿の5日目にももらえます。</p>'
    +   '<button class="dkbtn gd fx-primary dkp-big" data-dkp-act="gacha">キューブへ</button></div>'
    + '</section>';
}
function dkpTrgWarn(){
  var by = {}, msg = '';
  SV.slots.forEach(function(id){ var p = pendById(id); if(!p) return; (by[p.trg] = by[p.trg] || []).push(p); });
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
  var nEq = SV.slots.filter(function(x){ return !!pendById(x); }).length;
  var slots = SV.slots.map(function(pid, i){
    var p = pendById(pid);
    if(!p) return '<div class="dkp-slot dkp-empty" data-fx="riseL"><span class="dkp-sno">' + (i + 1) + '</span>'
      + '<span class="dkp-hole"><i></i></span><div class="dkp-si"><b class="dkp-snm">空き枠</b>'
      + '<p class="dkp-sds">右の一覧からえらんで［装備する］</p></div></div>';
    var lv = dkpLv(p.id);
    return '<div class="dkp-slot r' + p.rar + (p.id === S.sel ? ' on' : '') + '" data-dkp-act="sel" data-dkp-id="' + p.id + '" data-fx="riseL" id="dkpSlot' + i + '">'
      + '<span class="dkp-sno">' + (i + 1) + '</span>'
      + dkpMedal(p, { size:92, plus:lv - 1 })
      + '<div class="dkp-si"><div class="dkp-snr"><span class="dkp-rtag sm r' + p.rar + '">' + dkpRarNm(p.rar) + '</span><b class="dkp-snm">' + esc(p.nm) + '</b></div>'
      +   '<p class="dkp-sds">' + esc(p.ds) + '</p>'
      +   '<span class="dkp-sp"><i>' + esc(dkpTrg(p.trg)) + '</i>発動 <b>' + dkpPct(dkpEffP(p.id, lv)) + '%</b></span></div>'
      + '<button class="dkbtn dkp-off" data-dkp-act="off" data-dkp-slot="' + i + '">外す</button>'
      + '</div>';
  }).join('');
  var warn = dkpTrgWarn();
  var left = '<section class="fx-panel dkp-eqp" data-fx="riseL"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><span class="dkp-crest">' + dkpCrest() + '</span><b class="dkp-ttl">装備スロット</b>'
    +   '<span class="dkp-cnt"><b>' + nEq + '</b> / 4</span></header>'
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
      + (eq ? '<span class="dkp-eqtag">装備中</span>' : '')
      + '<b class="dkp-cnm">' + esc(dkpShort(p)) + '</b></div>';
  }).join('');
  var right = '<section class="fx-panel dkp-inv" data-fx="riseR"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><div class="fx-seg dkp-seg" style="--si:' + si + '"><i class="thumb"></i>'
    +   seg.map(function(x){ return '<button aria-pressed="' + (x[0] === S.sort) + '" data-dkp-act="sort" data-dkp-v="' + x[0] + '">' + x[1] + '</button>'; }).join('')
    +   '</div><span class="dkp-own">所有 <b>' + own.length + '</b> / ' + PENDANTS.length + '</span>'
    +   '<button class="dkbtn gd dkp-mini" data-dkp-act="gacha">キューブ</button></header>'
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
    +   (same && slot < 0 ? '<p class="dkp-warn sm">装備中の' + esc(dkpShort(same)) + 'と同じ系統です（高い方だけ発動）</p>' : '')
    +   '<div class="dkp-dbtns">'
    +     (slot >= 0 ? '<button class="dkbtn dkp-off" data-dkp-act="off" data-dkp-slot="' + slot + '">外す</button>'
                     : '<button class="dkbtn gr fx-primary green" data-dkp-act="eq" data-dkp-id="' + p.id + '">装備する</button>')
    +     '<button class="dkbtn gd" data-dkp-act="goup" data-dkp-id="' + p.id + '"' + (lv >= 8 ? ' disabled' : '') + '>' + (lv >= 8 ? '+7 最大' : '強化へ') + '</button>'
    +     '<button class="dkbtn dkp-sell" data-dkp-act="sell" data-dkp-id="' + p.id + '">売る <i class="dkcoin dkp-ci"></i>' + dkpFmt(price) + '</button>'
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
    + '<p class="dkp-hint big">強化するペンダントがありません。<br>まずはキューブで手に入れましょう。</p></section>'
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
    : '<p class="dkp-hint">重なり（同じペンダントの2つ目から）がありません。キューブで集めましょう。</p>';
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
    + '<header class="dkp-ph"><b class="dkp-ttl">合成</b><span class="dkp-note">+7 の同じ等級を2つ → 1段上を1つ</span></header>'
    + '<div class="dkp-altar2" id="dkpAltar2">' + dkpSocket(a, 'a') + orb + dkpSocket(b, 'b') + '</div>'
    + '<p class="dkp-mwarn">合成すると <b>+0</b> にもどります。いまの2つより弱くなります</p>'
    + '<div class="dkp-cost"><i class="dkcoin dkp-ci"></i><b>' + (rar ? dkpFmt(dkpMixCost(rar)) : '6,000 ／ 12,000') + '</b><span>G</span>'
    +   '<em>' + (rar ? (rar === 'A' ? 'A → S' : 'S → S+') : 'A → S ／ S → S+') + '</em></div>'
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
}
function dkpDoOff(slot, btn){
  var p = pendById(SV.slots[slot]); if(!p) return;
  dkpUnequip(slot);
  dkpSfx('click');
  toast('R', '📿', p.nm, (slot + 1) + '番の枠から外しました', 1500);
  showPend();
}
function dkpSlotModal(p){
  return '<div class="modal"><div class="fx-panel dkp-modal">'
    + '<h3 class="dkp-mh">入れ替える枠をえらんでください</h3>'
    + '<p class="dkp-mp">「' + esc(p.nm) + '」と入れ替わります（えらんだ枠は外れます）</p>'
    + '<div class="dkp-mslots">' + SV.slots.map(function(id, i){
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
  var k = SV.slots.indexOf(null);
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
        + '<button class="dkbtn dkp-sell" data-act="yes">売る</button></div></div></div>');
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
    alt.classList.remove('dkp-ok', 'dkp-ng'); void alt.offsetWidth;
    alt.classList.add(r.ok ? 'dkp-ok' : 'dkp-ng');
    var md = alt.querySelector('.dkp-medal');
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
  if(!dkpClaim(k)) return;
  dkpSfx('coin');
  fxBurst(from, { kind:'conf', n:22 });
  if(k === 'pb3') fxCoins(from, fxWalletEl('gold'), { kind:'coin', n:12 });
  if(k === 'pb5') fxCoins(from, fxWalletEl('gem'), { kind:'gem', n:8 });
  toast('R', '📖', '図鑑の報酬を受け取りました', k === 'pb8' ? 'これからずっと、ペンダントの強化費が −20%' : (k === 'pb3' ? '+3,000G' : 'ダイヤ +8'), 2400);
  showPend();
  dkWallet();
}

/* ══════════ キューブ（ガチャ） ══════════ */
function dkpLaneKey(k){ return (typeof LANES === 'object' && LANES[k]) ? k : 'premium'; }
function dkpCur(L){ return L.cur === '💎' ? '<i class="dkgem dkp-ci"></i>' : '<i class="dkcoin dkp-ci"></i>'; }
function showGacha(lane){
  var S = dkpS();
  if(typeof lane === 'string' && LANES[lane] && !S.busy){ dkLane = lane; S.pull = null; }
  dkLane = dkpLaneKey(dkLane);
  if(!S.busy && S.pull && S.pull.phase !== 'done') S.pull = null;
  var k = dkLane, L = LANES[k], free = (k === 'premium' && freeLeft() === 0), c = dkpLaneCol(k);
  var tabs = Object.keys(LANES).map(function(x){ return { id:x, ic:dkpCubeIcon(x), nm:LANES[x].nm }; });
  var f = featureCard(), fimg = dkCharImg(f.id);
  var fOk = (L.w[f.rar] || 0) > 0;
  var faces = '';
  for(var i = 1; i <= 6; i++) faces += '<i class="dkp-f' + i + '">' + dkpCubeFace(k) + '</i>';
  var vault = '<div class="dkp-vault" id="gStage" data-fx="rise" style="--dkp-lglow:' + c.glow + '">'
    + '<i class="dkp-arch"></i><div class="fx-rays"></div><i class="dkp-rainbow"></i>'
    + '<div class="fx-ribbon ' + (k === 'special' ? 'red' : k === 'normal' ? 'blue' : 'gold') + ' dkp-vt"><b>' + esc(L.nm) + 'キューブ</b></div>'
    + '<div class="dkp-cubepos"><i class="dkp-cglow"></i><div class="dkp-cubefl"><div class="dkp-cube">' + faces + '</div></div></div>'
    + '<i class="dkp-floor"></i>'
    + (fOk ? '<div class="dkp-feat"><span class="dkp-fthumb"' + (fimg ? ' style="background-image:url(' + fimg + ')"' : '') + '></span>'
      + '<div><i>今週の注目カード</i><b>' + esc(f.nm) + '</b></div><em>出やすさ 2倍</em></div>' : '')
    + '<p class="dkp-tap">タップで早送り</p>'
    + '</div>';
  var rows = [['SS', 'S+'], ['S', 'S'], ['A', 'A']].map(function(r){
    var w = L.w[r[0]] || 0;
    return '<div class="dkp-rr r' + r[0] + '"><span class="dkp-rtag r' + r[0] + '">' + r[1] + '</span>'
      + '<span class="dkp-bar"><i style="--w:' + Math.max(w > 0 ? 3 : 0, dkpPct(w)) + '%"></i></span><b>' + dkpPct(w) + '%</b></div>';
  }).join('');
  var off = Math.round((1 - L.five / (L.one * 5)) * 100);
  var panel = '<section class="fx-panel dkp-lane" data-fx="riseR"><i class="fx-edge"></i>'
    + '<header class="dkp-ph"><span class="dkp-lic">' + dkpCubeIcon(k) + '</span><b class="dkp-ttl">' + esc(L.nm) + '</b>'
    +   '<span class="dkp-lcur">' + dkpCur(L) + (L.cur === '💎' ? 'ダイヤ' : 'ゴールド') + 'で引く</span></header>'
    + '<p class="dkp-lds">' + esc(L.ds) + '</p>'
    + '<div class="dkp-rates">' + rows + '</div>'
    + dkpOdds(L)
    + '<p class="dkp-bonus">カード1枚ごとに、ペンダント <b>18%</b>・サイコロ <b>4%</b> のおまけ</p>'
    + dkpLineup(k)
    + (k === 'premium'
      ? '<div class="dkp-free' + (free ? ' dkp-now' : '') + '" id="gFree">' + (free ? 'いま無料で引けます' : '次の無料まで ' + mmss(freeLeft())) + '</div>'
      : '<div class="dkp-free dkp-nf">持っているカードが出たら「重なり」になり、強化に使えます</div>')
    + '<div class="dkp-lbtns">'
    +   '<button class="dkbtn ' + (free ? 'gr fx-primary green dkp-free1' : 'gr') + ' dkp-b1" data-lane="' + k + '" data-n="1">'
    +     (free ? '無料で1回' : '1回 ' + dkpCur(L) + dkpFmt(L.one)) + '</button>'
    +   '<div class="dkp-b5w"><button class="dkbtn gd fx-primary dkp-b5" data-lane="' + k + '" data-n="5">5連 ' + dkpCur(L) + dkpFmt(L.five) + '</button>'
    +     (off > 0 ? '<em class="dkp-off5">' + off + '%お得</em>' : '') + '</div>'
    + '</div>'
    + '</section>';
  var el = dkMake('gacha', 'quest',
      dkHead('gacha', { title:'キューブ' })
    + dkTabs(tabs, k)
    + '<div class="dkbody dkp-body dkp-gbody">' + vault + panel + '</div>');
  el.classList.add('dkp-scr', 'dkp-l-' + k);
  el.classList.toggle('dkp-busy', !!S.busy);
  dkWire(el, function(id){ var s = dkpS(); if(s.busy) return; s.pull = null; dkLane = id; showGacha(); });
  el.onclick = dkpGachaClick;
  dkpFxTag(el);
  if(typeof gachaTimer !== 'undefined' && gachaTimer){ clearInterval(gachaTimer); gachaTimer = null; }
  try{ bgm('gacha'); }catch(e){}
  screenTo('gacha');
  dkEvery('dkpFree', dkpFreeTick, 1000);
  if(S.pull) dkpRevSync();
}
/* 5連で、いちばん上の等級が1枚以上出る確率（うそのない数字を見せる） */
function dkpOdds(L){
  var top = (L.w.SS > 0) ? 'SS' : 'S', w = L.w[top] || 0, p5 = 1 - Math.pow(1 - w, 5);
  return '<p class="dkp-odds">5連で ' + dkpRarNm(top) + ' が1枚以上出る確率 <b>' + dkpPct(p5) + '%</b></p>';
}
/* そのキューブでいちばん上の等級に出るカード（顔ぶれを見せる） */
function dkpLineup(k){
  var L = LANES[k], top = (L.w.SS > 0) ? 'SS' : 'S';
  var list = CARDPOOL.filter(function(c){ return c.rar === top; });
  var more = Math.max(0, list.length - 6);
  return '<div class="dkp-line"><span class="dkp-linet">' + dkpRarNm(top) + ' の顔ぶれ</span><div class="dkp-lthumbs">'
    + list.slice(0, 6).map(function(c){
        var img = dkCharImg(c.id);
        return '<span class="dkp-lth r' + c.rar + '"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>'
          + (img ? '' : '<b>' + esc(c.nm.slice(0, 1)) + '</b>') + '</span>';
      }).join('')
    + (more ? '<span class="dkp-lmore">ほか ' + more + '人</span>' : '') + '</div></div>';
}
function dkpFreeTick(){
  var f = document.getElementById('gFree'); if(!f) return;
  var ms = freeLeft(), txt = ms === 0 ? 'いま無料で引けます' : '次の無料まで ' + mmss(ms);
  if(f.textContent !== txt) f.textContent = txt;
  var S = dkpS();
  if(ms === 0 && !f.classList.contains('dkp-now') && !S.busy && !S.pull && dkpOnScr('gacha')) showGacha();
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
  var a = t.getAttribute('data-dkp-act');
  if(a === 'again' && S.pull){ doGacha(S.pull.lane, S.pull.n, t); return; }
  if(a === 'close'){ dkpSfx('click'); S.pull = null; showGacha(); return; }
}
/* 引く。料金・抽選・grant・saveNow は 5-meta.js の doGacha と同じ順に呼ぶ（乱数の順番をそろえる） */
async function doGacha(lane, n, btn){
  var S = dkpS();
  if(S.busy) return;
  lane = LANES[lane] ? lane : 'normal';
  n = (+n === 5) ? 5 : 1;
  var L = LANES[lane] || LANES.normal;
  var free = (lane === 'premium' && n === 1 && freeLeft() === 0);
  var cost = free ? 0 : (n === 1 ? L.one : L.five);
  var isGem = L.cur === '💎';
  var have = isGem ? SV.gem : SV.gold;
  if(!free && have < cost){
    toast('R', L.cur, (isGem ? 'ダイヤ' : 'ゴールド') + 'が足りません',
          isGem ? '出席簿とミッションで増やせます' : 'ゲームに勝つと増えます', 2400);
    dkpSfx('bad');
    if(btn && btn.nodeType === 1) fxShake(btn, 260);
    return;
  }
  dkpBusy(true);
  var got = [];
  try{
    if(!free){ if(isGem) SV.gem -= cost; else SV.gold -= cost; }
    if(free) SV.freeAt = Date.now();
    for(var i = 0; i < n; i++){
      var rar = rollLane(L.w);
      var pool = CARDPOOL.filter(function(c){ return c.rar === rar; });
      var f = featureCard();
      if(f.rar === rar) pool.push(f);
      var c = pool.length ? pool[(Math.random() * pool.length) | 0] : CARDPOOL[0];
      var g = grant(c) || {};
      got.push({ c:c, g:g });
    }
    saveNow();
    dkEmit('gacha:pull', { lane:lane, n:n, got:got.map(function(o){ return { id:o.c.id, rar:o.c.rar, card:o.g.card || null,
      pend:o.g.pend || null, die:o.g.die || null, gold:o.g.gold || 0 }; }) });
  } catch(e){
    console.error('[WP1]', e);
    dkpBusy(false);
    return;
  }
  var best = got.some(function(o){ return o.c.rar === 'SS'; }) ? 'SS' : got.some(function(o){ return o.c.rar === 'S'; }) ? 'S' : 'A';
  var P = { lane:lane, n:n, got:got, best:best, phase:'charge', flipped:0, free:free, kind:isGem ? 'gem' : 'coin',
            from:(S.pull && S.pull.phase === 'done') ? 'again' : 'idle' };
  S.pull = P;
  dkLane = lane;
  try{ await dkpReveal(P); }
  catch(e){ console.error('[WP1]', e); }
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
    if(dkMarkSeen(o.c.id)) fresh++;
    if(o.g && o.g.pend && dkMarkSeen(o.g.pend.id)) fresh++;
    if(o.g && o.g.die && dkMarkSeen(o.g.die.id)) fresh++;
  });
  if(fresh) toast('R', '📖', '図鑑に新しく登録', fresh + '件　+' + dkpFmt(fresh * 200) + 'G', 2400);
}
function dkpGEl(sel){ var st = document.getElementById('gStage'); return st ? st.querySelector(sel) : null; }
async function dkpReveal(P){
  var S = dkpS();
  var alive = function(){ return S.pull === P && dkpOnScr('gacha') && !!document.getElementById('gStage'); };
  var cube0 = dkpGEl('.dkp-cubepos'), r0 = (cube0 && P.from === 'idle' && dkpOnScr('gacha')) ? cube0.getBoundingClientRect() : null;
  showGacha();
  if(!alive()) return;
  if(DKFX.reduced){ P.phase = 'done'; P.flipped = P.n; dkpRevSync(); return; }
  var cube = dkpGEl('.dkp-cubepos');
  if(cube && r0){
    var r1 = cube.getBoundingClientRect(), k = DKFX.scale() || 1;
    var dx = (r0.left - r1.left) / k, dy = (r0.top - r1.top) / k;
    if(Math.abs(dx) + Math.abs(dy) > 2 && cube.animate){
      try{ cube.animate([{ transform:'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)' }, { transform:'translate(0,0)' }],
                        { duration:420, easing:'cubic-bezier(.16,1,.3,1)' }); }catch(e){}
    }
  }
  if(!P.free) fxCoins(fxWalletEl(P.kind), cube || { x:800, y:470 }, { kind:P.kind, n:(P.n === 5 ? 10 : 6), spread:50 });
  dkWallet();
  dkpSfx('gachaRoll', P.best === 'SS' ? 1 : P.best === 'S' ? 0.5 : 0);
  await fxWait(450);
  if(!alive()) return;
  P.phase = 'burst'; dkpRevSync();
  var at = dkpGEl('.dkp-cubepos') || { x:800, y:470 };
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
  var rv = dkpGEl('.dkp-rv'); if(rv) void rv.offsetWidth;
  await fxWait(30);
  P.phase = 'deal'; dkpRevSync();
  dkpSfx('cardIn');
  await fxWait(340 + 90 * (P.n - 1) + 80);
  P.phase = 'flip';
  for(var i = 0; i < P.n; i++){
    if(!alive()) return;
    var it = P.got[i];
    if(it.c.rar === 'SS' && !DKFX.skip){
      var sl = dkpGEl('.dkp-ps[data-i="' + i + '"] .pullcard');
      if(sl) fxShake(sl, 300);
      dkpSfx('diceShake', 1);
      await fxWait(300);
      if(!alive()) return;
    }
    P.flipped = i + 1; dkpRevSync();
    var card = dkpGEl('.dkp-ps[data-i="' + i + '"] .pullcard');
    if(card){
      if(it.c.rar === 'SS'){
        fxBurst(card, { kind:'conf', n:26, power:1.1 });
        fxBurst(card, { kind:'star', n:14, power:.9 });
        fxPopText(card, 'S+ 獲得！', { tone:'gold', size:54 });
        dkpSfx('gachaRare');
      } else if(it.c.rar === 'S'){
        fxBurst(card, { kind:'star', n:16, power:.9, color:'#C9A0F0' });
        dkpSfx('diceDouble');
      } else {
        fxBurst(card, { kind:'star', n:8, power:.6 });
        dkpSfx('coin');
      }
    }
    await fxWait(380 + 140);
  }
  if(!alive()) return;
  P.phase = 'done'; dkpRevSync();
}
/* 引いた結果の層を、状態 P から作る・合わせる（何度呼んでもよい。作り直された画面にも追いつく） */
function dkpRevSync(){
  var S = dkpS(), P = S.pull, g = document.getElementById('gacha'), st = document.getElementById('gStage');
  if(!g || !st) return;
  var on = !!P;
  g.classList.toggle('dkp-rev', on);
  g.classList.toggle('dkp-fast', !!(on && DKFX.skip));
  if(!on){ var old = st.querySelector(':scope > .dkp-rv'); if(old) old.remove(); st.className = 'dkp-vault'; return; }
  var ph = P.phase;
  st.classList.toggle('dkp-charge', ph === 'charge');
  st.classList.toggle('dkp-burst', ph === 'burst');
  st.classList.toggle('dkp-gone', ph !== 'charge' && ph !== 'burst');
  st.classList.toggle('dkp-ss', P.best === 'SS' && ph !== 'charge');
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
      var it = P.got[i];
      if(it && it.g && it.g.card && it.g.card.fresh && !pc.querySelector('.fx-new')){
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
    var c = o.c, img = dkCharImg(c.id), dx = ((P.n - 1) / 2 - i) * (w + gap);
    var chips = '';
    if(o.g && o.g.card && !o.g.card.fresh) chips += '<span class="dkp-chip dup">重なり +1</span>';
    if(o.g && o.g.pend){ var pp = pendById(o.g.pend.id);
      if(pp) chips += '<span class="dkp-chip pd">' + dkpMedal(pp, { size:34 }) + '<b>' + esc(dkpShort(pp)) + '</b>' + (o.g.pend.fresh ? '<em>NEW</em>' : '<em>重なり</em>') + '</span>'; }
    if(o.g && o.g.die){ var dd = dieById(o.g.die.id);
      chips += '<span class="dkp-chip di">' + dkpDieIcon() + '<b>' + esc(String(dd.nm).replace(/の?サイコロ$/, '') || dd.nm) + '</b><em>NEW</em></span>'; }
    if(o.g && o.g.gold) chips += '<span class="dkp-chip go"><i class="dkcoin dkp-ci"></i><b>+' + dkpFmt(o.g.gold) + 'G</b></span>';
    return '<div class="dkp-ps" data-i="' + i + '" style="--dx:' + dx.toFixed(1) + 'px;--dr:' + ((i - (P.n - 1) / 2) * -4).toFixed(1) + 'deg;--i:' + i + '">'
      + '<div class="pullcard fx-flip3d r' + c.rar + '">'
      +   '<div class="fx-face fx-back">' + dkpCrest() + '</div>'
      +   '<div class="fx-face fx-front">'
      +     (img ? '<div class="dkp-pcart" style="background-image:url(' + img + ')"></div>'
                 : '<div class="dkp-pcart dkp-pcph"><b>' + esc(c.nm.slice(0, 1)) + '</b></div>')
      +     (c.rar === 'SS' ? '<i class="dkp-pcsh"></i>' : '')
      +     '<span class="dkp-pcrt r' + c.rar + '">' + (RAR[c.rar] ? RAR[c.rar].nm : c.rar) + '</span>'
      +     '<div class="dkp-pcnm"><b>' + esc(c.nm) + '</b><i>' + esc(c.role) + '</i></div>'
      +   '</div>'
      + '</div>'
      + '<div class="dkp-px">' + chips + '</div>'
      + '</div>';
  }).join('');
  var L = LANES[P.lane] || LANES.normal, isGem = L.cur === '💎';
  var nNew = P.got.filter(function(o){ return o.g && o.g.card && o.g.card.fresh; }).length;
  var nDup = P.got.length - nNew;
  var price = P.n === 1 ? L.one : L.five;
  return '<div class="dkp-rvhd"><div class="fx-ribbon ' + (P.best === 'SS' ? 'red' : 'gold') + '"><b>' + (P.best === 'SS' ? 'S+ 獲得！' : L.nm + 'キューブ 開封') + '</b></div></div>'
    + '<div class="dkp-row">' + cards + '</div>'
    + '<div class="dkp-rvft"><span class="dkp-sum">NEW <b>' + nNew + '</b>　重なり <b>' + nDup + '</b></span>'
    +   '<button class="dkbtn gd fx-primary dkp-again" data-dkp-act="again">もう1回 ' + (isGem ? '<i class="dkgem dkp-ci"></i>' : '<i class="dkcoin dkp-ci"></i>') + dkpFmt(price) + '</button>'
    +   '<button class="dkbtn dkp-wood" data-dkp-act="close">とじる</button></div>';
}

/* ══════════ 起動 ══════════ */
(function(){
  try{
    dkOn('screen', function(o){
      var S = dkpS();
      S.scr = (o && o.id) || '';
      if(S.scr !== 'gacha' && !S.busy) S.pull = null;
    });
  }catch(e){ console.error('[WP1]', e); }
})();
