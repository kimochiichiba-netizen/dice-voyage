
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — ホームまわり（9j-home.js / WP9）
   ──────────────────────────────────────────────────────────────
   ・ホーム・イベント・郵便箱・リーグ・マイレージ・設定・ともだち・常設バー。
   ・オンライン画面（#online / #olroom）とタイトルの「オンラインで遊ぶ」を王宮の見た目と動線にそろえる。
   ・宣言し直す関数：showHome, dkGo, dkRank, showNews, walletHTML, showMail, showFriends, dkhSettings。
     包む関数：mkScreen（'online' と 'olroom' の時だけ手を加える）。
   ・トップレベルは function 宣言と DKH_ 付きの var、最後の初期化 IIFE だけ。
     DOM に触る初期化は IIFE の中（1ファイルの例外で後ろの初期化を止めないため）。
   ・演出の乱数は DKFX.rnd()。ゲームの抽選（マイレージキューブ）だけ Math.random。
   ══════════════════════════════════════════════════════════════ */

/* ══════════ 定数（var にするのは、読み込み途中に呼ばれても TDZ で落ちないため） ══════════ */
var DKH_MILE = 20;                       // マイレージ20で🔑1本
var DKH_RP_WIN = 40, DKH_RP_LOSE = 10;   // 勝ち +40×クラス倍率 ／ 負け −10（0より下にしない）
var DKH_TIERS = [
  { id:'bronze', nm:'ブロンズ', min:0,    col:'#D08A4E', dk:'#6B3A12', rw:{ g:3000,  d:0  } },
  { id:'silver', nm:'シルバー', min:200,  col:'#D5DEE8', dk:'#56657A', rw:{ g:8000,  d:2  } },
  { id:'gold',   nm:'ゴールド', min:600,  col:'#FFD44A', dk:'#8A5E06', rw:{ g:20000, d:5  } },
  { id:'plat',   nm:'プラチナ', min:1200, col:'#8FF0DC', dk:'#1E6B62', rw:{ g:40000, d:10 } },
  { id:'dia',    nm:'ダイヤ',   min:2000, col:'#9ED8FF', dk:'#1B4E9E', rw:{ g:80000, d:20 } }
];
/* リーグの相手。サーバが無いので「CPU」と明示する。点数は日付だけで決まる（ゴールドを使っても動かない） */
var DKH_RIVALS = [
  { nm:'CPU ガル', card:'c03', base:60,  per:8  },
  { nm:'CPU リノ', card:'c05', base:210, per:13 },
  { nm:'CPU ゼニ', card:'c07', base:470, per:19 },
  { nm:'CPU ミラ', card:'c10', base:20,  per:5  },
  { nm:'CPU ドグ', card:'c12', base:820, per:27 }
];
var DKH_LEFT = [
  { id:'cards', ic:'card', nm:'カード',     m:'ruby'  },
  { id:'dice',  ic:'dice', nm:'サイコロ',   m:'amber' },
  { id:'pend',  ic:'pend', nm:'ペンダント', m:'emer'  },
  { id:'gacha', ic:'cube', nm:'キューブ',   m:'sapph' },
  { id:'shop',  ic:'shop', nm:'ショップ',   m:'amet'  }
];
var DKH_RIGHT = [
  { id:'quest',   ic:'scroll', nm:'ミッション', m:'amber' },
  { id:'news',    ic:'horn',   nm:'イベント',   m:'ruby'  },
  { id:'daily',   ic:'cal',    nm:'出席簿',     m:'sapph' },
  { id:'friends', ic:'duo',    nm:'ともだち',   m:'emer'  },
  { id:'mail',    ic:'mail',   nm:'郵便箱',     m:'amet'  }
];
var DKH_NTABS = [
  { id:'week', ic:'horn',   nm:'今週' },
  { id:'info', ic:'scroll', nm:'お知らせ' },
  { id:'tips', ic:'card',   nm:'遊び方' }
];
var DKH_SPEEDS = [ { v:1.4, nm:'ゆっくり' }, { v:1, nm:'ふつう' }, { v:0.62, nm:'はやい' } ];
var DKH_ARTS   = [ { v:'human', nm:'手描き風' }, { v:'gem', nm:'宝石の守護獣' }, { v:'anime', nm:'アニメ風' } ];
var DKH_homeTab = 'league';
var DKH_newsTab = 'week';
var DKH_mk0 = null;                      // 包む前の mkScreen
var DKH_boot = Date.now();               // オンラインの読み込み待ちを見分ける

/* ══════════ 絵（CSS と SVG で自作。外の絵・ロゴは使わない） ══════════ */
var DKH_ICON = {
  card: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="9" y="15" width="29" height="39" rx="5" transform="rotate(-13 23 34)" fill="#F4E3BD" stroke="#3A2405" stroke-width="3"/>'
      + '<rect x="24" y="9" width="29" height="39" rx="5" transform="rotate(9 38 28)" fill="#FFF8E6" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M38 18l3 6.6 7.2.7-5.4 4.8 1.6 7-6.4-3.7-6.4 3.7 1.6-7-5.4-4.8 7.2-.7z" fill="#E8483A" stroke="#3A2405" stroke-width="2" stroke-linejoin="round"/></svg>',
  dice: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6l22 12-22 12-22-12z" fill="#FFFBEF" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M10 18l22 12v28L10 46z" fill="#E6CFA0" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M54 18L32 30v28l22-12z" fill="#F6E6C2" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<ellipse cx="32" cy="18" rx="4.4" ry="2.6" fill="#C9302C"/><circle cx="16" cy="30" r="2.8" fill="#3A2405"/><circle cx="26" cy="46" r="2.8" fill="#3A2405"/>'
      + '<circle cx="38" cy="47" r="2.6" fill="#3A2405"/><circle cx="43" cy="40" r="2.6" fill="#3A2405"/><circle cx="48" cy="33" r="2.6" fill="#3A2405"/></svg>',
  pend: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 8c0 17 8 25 19 25s19-8 19-25" fill="none" stroke="#3A2405" stroke-width="7" stroke-linecap="round"/>'
      + '<path d="M13 8c0 17 8 25 19 25s19-8 19-25" fill="none" stroke="#FFE08A" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="4 3"/>'
      + '<path d="M32 30l13 11-13 18-13-18z" fill="#4FC98E" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M32 30l5 11-5 18-5-18z" fill="#BFF7DA"/><circle cx="32" cy="31" r="4.4" fill="#FFD44A" stroke="#3A2405" stroke-width="2.2"/></svg>',
  cube: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5l23 12-23 12L9 17z" fill="#DDF3FF" stroke="#0B2C5E" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M9 17l23 12v30L9 47z" fill="#5DB4F0" stroke="#0B2C5E" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M55 17L32 29v30l23-12z" fill="#2E86D8" stroke="#0B2C5E" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M32 9l2.4 4.6 5 .5-3.8 3.2 1.1 5-4.7-2.6-4.7 2.6 1.1-5-3.8-3.2 5-.5z" fill="#FFD44A" stroke="#7A5206" stroke-width="1.2"/>'
      + '<path d="M16 26l8 4M40 43l8-4" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>',
  shop: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M23 25v-6a9 9 0 0118 0v6" fill="none" stroke="#3A2405" stroke-width="3.4"/>'
      + '<path d="M12 24h40l-3.4 31H15.4z" fill="#FFF6E2" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M12 24h40l-.8 7H12.8z" fill="#E8483A" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<circle cx="32" cy="42" r="7.4" fill="#FFD44A" stroke="#3A2405" stroke-width="2.6"/><path d="M29 42h6" stroke="#8A5E06" stroke-width="2.4" stroke-linecap="round"/></svg>',
  scroll: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="15" y="9" width="34" height="46" rx="4" fill="#FFF6E2" stroke="#3A2405" stroke-width="3"/>'
      + '<rect x="11" y="6" width="42" height="8" rx="4" fill="#E0AE3A" stroke="#3A2405" stroke-width="3"/><rect x="11" y="50" width="42" height="8" rx="4" fill="#E0AE3A" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M22 22h18M22 30h18M22 38h9" stroke="#8A6A34" stroke-width="3" stroke-linecap="round"/>'
      + '<path d="M35 39l5 5 10-12" fill="none" stroke="#2F8A18" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  horn: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 37l4 13h7l-3.4-12" fill="#E6CFA0" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M9 27h11l24-13v36L20 37H9z" fill="#FFF6E2" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<rect x="7" y="26" width="9" height="12" rx="3" fill="#E8483A" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M49 25c3.4 3.2 3.4 10.8 0 14M54 19c6.6 6.4 6.6 20 0 26" fill="none" stroke="#FFD44A" stroke-width="3.4" stroke-linecap="round"/></svg>',
  cal: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="13" width="44" height="41" rx="6" fill="#FFF6E2" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M10 25h44V19a6 6 0 00-6-6H16a6 6 0 00-6 6z" fill="#E8483A" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M21 8v10M43 8v10" stroke="#3A2405" stroke-width="4" stroke-linecap="round"/>'
      + '<path d="M22 39l7 7 13-14" fill="none" stroke="#2F8A18" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  duo: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="43" cy="21" r="8.6" fill="#F4E3BD" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M33 35c3-2 6-3 10-3 8.6 0 14 6.4 14 16H40" fill="#F4E3BD" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<circle cx="24" cy="24" r="10" fill="#FFF8E6" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M7 54c0-11 7.6-17.6 17-17.6S41 43 41 54z" fill="#FFF8E6" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="7" y="15" width="50" height="36" rx="5" fill="#FFF6E2" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M8 18l24 19 24-19" fill="none" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<circle cx="32" cy="36" r="6" fill="#C9302C" stroke="#3A2405" stroke-width="2.4"/><path d="M29.4 36h5.2" stroke="#FFD9CE" stroke-width="1.8"/></svg>',
  gear: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="21" fill="none" stroke="#3A2405" stroke-width="13" stroke-dasharray="8.2 4.995" stroke-dashoffset=".6"/>'
      + '<circle cx="32" cy="32" r="21" fill="none" stroke="#F4E3BD" stroke-width="8.6" stroke-dasharray="7 6.195"/>'
      + '<circle cx="32" cy="32" r="16" fill="#F4E3BD" stroke="#3A2405" stroke-width="3"/><circle cx="32" cy="32" r="6.4" fill="#8A6A34" stroke="#3A2405" stroke-width="3"/></svg>',
  key: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M30 28h26v7h-4v7h-7v-7h-4v6h-6v-6h-5z" fill="#FFD44A" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<circle cx="19" cy="32" r="12" fill="#FFD44A" stroke="#3A2405" stroke-width="3"/><circle cx="19" cy="32" r="4.4" fill="#3A2405"/>'
      + '<path d="M12 26a8 8 0 016-4" stroke="#FFF6D0" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>',
  globe: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="23" fill="#8FD2FF" stroke="#0B2C5E" stroke-width="3"/>'
      + '<path d="M11 32h42M32 9c-9 9-9 37 0 46M32 9c9 9 9 37 0 46M15 20h34M15 44h34" fill="none" stroke="#1656A8" stroke-width="2.6"/>'
      + '<path d="M20 15a24 24 0 0110-5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/></svg>',
  swap: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 26a18 18 0 0132-8l4-5v16H34l6-6a10 10 0 00-18 3z" fill="#FFF6E2" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M50 38a18 18 0 01-32 8l-4 5V35h16l-6 6a10 10 0 0018-3z" fill="#FFF6E2" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/></svg>',
  trophy: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 12h-8c0 11 4.4 15 10 15M44 12h8c0 11-4.4 15-10 15" fill="none" stroke="#3A2405" stroke-width="3.4"/>'
      + '<path d="M19 8h26v15a13 13 0 01-26 0z" fill="#FFD44A" stroke="#3A2405" stroke-width="3"/>'
      + '<path d="M28 36h8v8h7v9H21v-9h7z" fill="#E0AE3A" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M24 13v8" stroke="#FFF6D0" stroke-width="3" stroke-linecap="round"/></svg>'
};
function dkhIcon(k){ return DKH_ICON[k] || ''; }

/* 等級の紋章（盾＋星）。<defs> のグラデは隠れた画面にあると描かれないので、平塗り＋ハイライトだけで描く */
function dkhEmblem(t, cls){
  var dia = t.id === 'dia';
  return '<svg class="dkh-emb' + (cls ? ' ' + cls : '') + '" viewBox="0 0 64 72" aria-hidden="true">'
    + '<path d="M32 3l26 9v22c0 17-11 29-26 35C17 63 6 51 6 34V12z" fill="' + t.col + '" stroke="#2A1604" stroke-width="3.4" stroke-linejoin="round"/>'
    + '<path d="M32 3l26 9v22c0 17-11 29-26 35z" fill="' + t.dk + '" opacity=".32"/>'
    + '<path d="M32 9l20 7v18c0 4-1 8-3 11H15c-2-3-3-7-3-11V16z" fill="#FFFFFF" opacity=".22"/>'
    + (dia
      ? '<path d="M32 20l11 9-11 17-11-17z" fill="#FFFFFF" stroke="#1B4E9E" stroke-width="2.4" stroke-linejoin="round"/><path d="M21 29h22" stroke="#1B4E9E" stroke-width="2"/>'
      : '<path d="M32 19l3.8 7.8 8.6.9-6.4 5.8 1.9 8.4L32 37.6l-7.9 4.3 1.9-8.4-6.4-5.8 8.6-.9z" fill="#FFF8E0" stroke="#2A1604" stroke-width="2.2" stroke-linejoin="round"/>')
    + '</svg>';
}

/* ══════════ 小道具 ══════════ */
function dkhNum(v){ return (Math.round(+v || 0)).toLocaleString(); }
function dkhImg(id){ try{ return (window.DV_CHARIMG || {})[id] || ''; }catch(e){ return ''; } }
function dkhUi(k){ try{ return (window.DV_UI || {})[k] || ''; }catch(e){ return ''; } }
function dkhFace(id){
  var u = dkhImg(id);
  return '<span class="dkh-face"' + (u ? ' style="background-image:url(' + u + ')"' : '') + '>'
    + (u ? '' : '<b>' + esc(((cardById(id) || CARDPOOL[0]).nm || '?').slice(0, 1)) + '</b>') + '</span>';
}
function dkhNow(){ return Date.now(); }
function dkhOnlineOK(){ return !!(window.DV_OL && window.DV_OL.lib && window.DV_OL_API && !window.claude); }
function dkhSay(side, ic, t, s, ms){ try{ toast(side || 'R', ic, t, s || '', ms || 2200); }catch(e){} }

/* ══════════ リーグ ══════════ */
function dkhTier(rp){
  rp = Math.max(0, rp | 0);
  var i = 0;
  for(var k = 0; k < DKH_TIERS.length; k++) if(rp >= DKH_TIERS[k].min) i = k;
  var t = DKH_TIERS[i], nx = DKH_TIERS[i + 1] || null;
  return { i:i, id:t.id, nm:t.nm, col:t.col, dk:t.dk, rw:t.rw, min:t.min, next:nx,
    prog: nx ? Math.min(1, (rp - t.min) / (nx.min - t.min)) : 1, left: nx ? nx.min - rp : 0 };
}
/* シーズン＝月。t を渡すとその時刻で（渡さなければ今） */
function dkhSeasonKey(t){
  var d = new Date(typeof t === 'number' ? t : Date.now());
  var m = d.getMonth() + 1;
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m;
}
function dkhSeasonName(key){
  var m = /^(\d+)-(\d+)$/.exec(String(key || ''));
  return m ? (+m[2]) + '月' : '';
}
function dkhSeasonLeft(t){
  var now = typeof t === 'number' ? t : Date.now(), d = new Date(now);
  var end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}
/* 月が変わっていたら、前のシーズンの報酬を郵便で送り、RP を半分にする。何か起きたら結果を返す */
function dkhSeasonCheck(t){
  if(typeof SV !== 'object' || !SV) return null;
  var k = dkhSeasonKey(t);
  if(!SV.season){ SV.season = k; saveNow(); return null; }
  if(SV.season === k) return null;
  var old = SV.season, rp = SV.rp | 0, tier = dkhTier(rp), out = { from:old, to:k, tier:tier.nm, rp:rp, half:Math.floor(rp / 2) };
  if(rp > 0){
    out.mail = dkMail({ ic:'🏆', nm:'リーグ ' + dkhSeasonName(old) + ' の報酬（' + tier.nm + '）', g:tier.rw.g, d:tier.rw.d });
  }
  SV.rp = Math.floor(rp / 2);
  SV.season = k;
  saveNow();
  return out;
}
/* ライバル（CPU）の点数：月の何日目かだけで決まる */
function dkhRivalRp(r, t){
  var d = new Date(typeof t === 'number' ? t : Date.now()).getDate();
  return r.base + r.per * d;
}
/* 順位表。tab='league' は自分＋CPU＋RP の分かっているともだち、'friends' はともだちだけ */
function dkRank(tab){
  var me = { nm:(SV.name || 'あなた'), rp:SV.rp | 0, me:true, cpu:false, card:SV.equip };
  if(tab === 'friends'){
    return (SV.friends || []).slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); }).map(function(f){
      return { nm:f.name, rp:(typeof f.rp === 'number' ? f.rp : null), n:f.n | 0, at:f.at || 0, card:f.card || null, friend:true };
    });
  }
  var list = DKH_RIVALS.map(function(r){ return { nm:r.nm, rp:dkhRivalRp(r), cpu:true, card:r.card }; });
  (SV.friends || []).forEach(function(f){
    if(typeof f.rp === 'number') list.push({ nm:f.name, rp:f.rp | 0, friend:true, card:f.card || null });
  });
  list.push(me);
  return list.sort(function(a, b){ return (b.rp - a.rp) || (a.me ? -1 : b.me ? 1 : 0); });
}

/* ══════════ 郵便 ══════════ */
function dkhMailList(){
  var now = Date.now();
  if(!Array.isArray(SV.mail)) SV.mail = [];
  var keep = SV.mail.filter(function(m){ return m && (m.exp || 0) > now; });
  if(keep.length !== SV.mail.length){ SV.mail = keep; saveNow(); }
  return SV.mail;
}
function dkhMailCount(){ return dkhMailList().length; }
/* 1通ぶんを受け取る（アイテムも渡す）。受け取った中身を返す */
function dkhTakeMail(m){
  var got = { g:m.g | 0, d:m.d | 0, item:null };
  SV.gold += got.g; SV.gem += got.d;
  var it = m.item;
  if(it && it.kind){
    try{
      if(it.kind === 'card' && cardById(it.id)){ grant(cardById(it.id)); got.item = cardById(it.id).nm; }
      else if(it.kind === 'pend' && pendById(it.id)){ dkGivePend(it.id); got.item = pendById(it.id).nm; }
      else if(it.kind === 'die' && typeof dieById === 'function'){
        var dd = dieById(it.id); if(dd){ SV.dice[dd.id] = Math.max(1, SV.dice[dd.id] || 0); got.item = dd.nm; } }
      else if(it.kind === 'key'){ SV.keys = (SV.keys | 0) + 1; got.item = '🔑'; }
    }catch(e){ console.error('[WP9]', e); }
  }
  var i = SV.mail.indexOf(m);
  if(i >= 0) SV.mail.splice(i, 1);
  return got;
}

/* ══════════ 対戦が終わった時（リーグ・マイレージ・ともだち） ══════════ */
function dkhOnMatchEnd(p){
  if(!p || typeof SV !== 'object') return;
  if(typeof p.me === 'number' && p.me < 0) return;           // 人間のいない観戦
  dkhSeasonCheck();
  /* マイレージ */
  SV.mile = (SV.mile | 0) + 1;
  var key = false;
  if(SV.mile >= DKH_MILE){ SV.mile -= DKH_MILE; SV.keys = (SV.keys | 0) + 1; key = true; }
  /* リーグ */
  var x = +p.x;
  if(!(x > 0)){ try{ x = +(dkClassOf(p.cls || SV.cls) || {}).x; }catch(e){ x = 1; } }
  if(!(x > 0)) x = 1;
  var before = SV.rp | 0, d = p.won ? Math.round(DKH_RP_WIN * x) : -Math.min(DKH_RP_LOSE, before);
  SV.rp = Math.max(0, before + d);
  var t0 = dkhTier(before), t1 = dkhTier(SV.rp);
  /* オンラインで遊んだ相手をともだちに */
  if(p.online) dkhNoteFriends(p);
  saveNow();
  if(Array.isArray(p.chips)){
    p.chips.push({ ic:'🏆', label:'リーグ ' + t1.nm, v:(d >= 0 ? '+' : '') + d + ' RP' });
    if(t1.i > t0.i) p.chips.push({ ic:'👑', label:'リーグ昇格', v:t1.nm });
    p.chips.push({ ic:'🎫', label:'マイレージ', v:key ? '🔑+1' : (SV.mile + '/' + DKH_MILE) });
  }
}
function dkhNoteFriends(p){
  var OL = window.DV_OL, now = Date.now(), names = [];
  if(OL && Array.isArray(OL.seats)){
    OL.seats.forEach(function(s){
      if(!s || s.kind === 'cpu') return;
      if(s.pid && OL.me && s.pid === OL.me) return;           // 自分の端末の席
      names.push({ nm:String(s.name || '').slice(0, 10), prof:s.prof || null });
    });
  } else if(Array.isArray(p.humans)){
    p.humans.forEach(function(n){ if(typeof n === 'string') names.push({ nm:n.slice(0, 10), prof:null }); });
  }
  if(!Array.isArray(SV.friends)) SV.friends = [];
  names.forEach(function(o){
    if(!o.nm) return;
    var f = SV.friends.find(function(x){ return x.name === o.nm; });
    if(!f){ f = { name:o.nm, at:0, n:0 }; SV.friends.unshift(f); }
    f.at = now; f.n = (f.n | 0) + 1;
    if(o.prof){
      if(typeof o.prof.rp === 'number') f.rp = o.prof.rp | 0;
      if(o.prof.cardId && cardById(o.prof.cardId)) f.card = o.prof.cardId;
    }
  });
  if(SV.friends.length > 100) SV.friends.length = 100;
}

/* ══════════ 常設バー（Lv・経験値・ゴールド・ダイヤ・RP） ══════════
   ＋は .dkh-plus[data-dkbuy]（.wp にしないのは 5-meta.js の古いクリック処理に拾わせないため）。
   dkWire(el) が showShop('osusume'|'gem') につなぐ。つながれていない画面でも、下の IIFE の委任で開く。 */
function walletHTML(){
  var need = playerLvNeed(SV.lv), exp = Math.max(0, SV.exp | 0), k = Math.min(1, exp / Math.max(1, need));
  var t = dkhTier(SV.rp | 0);
  return '<div class="wallet dkh-wallet">'
    + '<div class="dkh-wi dkh-wlv"><span class="dkh-lvb"><i>Lv</i><b id="wLv">' + SV.lv + '</b></span>'
    +   '<span class="dkh-xp"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i><em>' + dkhNum(exp) + ' / ' + dkhNum(need) + '</em></span></div>'
    + '<div class="dkh-wi dkh-wg"><i class="dkh-coin" aria-hidden="true"></i><b id="wGold">' + SV.gold.toLocaleString() + '</b>'
    +   '<button type="button" class="dkh-plus" data-dkbuy="gold" aria-label="ゴールドをふやす">＋</button></div>'
    + '<div class="dkh-wi dkh-wd"><i class="dkh-gem" aria-hidden="true"></i><b id="wGem">' + SV.gem.toLocaleString() + '</b>'
    +   '<button type="button" class="dkh-plus" data-dkbuy="gem" aria-label="ダイヤをふやす">＋</button></div>'
    + '<div class="dkh-wi dkh-wr">' + dkhEmblem(t) + '<b id="wRp">' + dkhNum(SV.rp) + '</b><i class="dkh-rpu">RP</i></div>'
    + '</div>';
}

/* ══════════ 画面の行き先 ══════════ */
function dkGo(id){
  try{ SFX.click(); }catch(e){}
  switch(id){
    case 'home':     return showHome();
    case 'cards':    return showCards();
    case 'gacha':    return showGacha();
    case 'pend':     return showPend();
    case 'dice':     return showDice();
    case 'shop':     return showShop();
    case 'quest':    return showQuest();
    case 'daily':    return showDaily();
    case 'news':     return showNews();
    case 'mail':     return showMail();
    case 'friends':  return showFriends();
    case 'online':   return dkhOpenOnline(true);
    case 'settings': return dkhSettings();
    case 'play':     return dkFlowStart();
    case 'title':    return screenTo('title');
  }
}
/* オンライン画面を開く。使えない版では理由をトーストで出す（押しても無反応、を作らない） */
function dkhOpenOnline(quiet){
  if(!quiet){ try{ SFX.click(); }catch(e){} }
  try{ ac(); }catch(e){}
  if(dkhOnlineOK()){ window.DV_OL_API.open(); return true; }
  if(window.claude || !window.DV_OL){
    dkhSay('R', dkhIcon('globe'), 'この版ではオンライン対戦は使えません', 'GitHub Pages 版で遊べます', 2800);
  } else if(Date.now() - DKH_BOOT_T() < 8000){
    dkhSay('R', dkhIcon('globe'), 'つなぐ用意をしています', '数秒たってから、もう一度押してください', 2400);
  } else {
    dkhSay('R', dkhIcon('globe'), 'オンライン対戦につながりません', 'ネットの接続を確かめて、ページを読み込み直してください', 2800);
  }
  return false;
}
function DKH_BOOT_T(){ return (typeof DKH_boot === 'number') ? DKH_boot : 0; }

/* ══════════════════════════════════════════════════════════════
   ホーム（本家ロビー G/v2/f002 の組み方：左右レール・首から下げたカード・右にリーグ）
   ══════════════════════════════════════════════════════════════ */
function dkhRail(list, side){
  return '<div class="dkh-rail ' + side + '">' + list.map(function(t){
    var b = '';
    try{
      if(t.id === 'quest' && questReady()) b = '!';
      if(t.id === 'daily' && canDaily()) b = '!';
      if(t.id === 'gacha' && typeof freeLeft === 'function' && freeLeft() === 0) b = '!';
      if(t.id === 'mail'){ var n = dkhMailCount(); if(n) b = String(Math.min(99, n)); }
    }catch(e){}
    return '<div class="dkh-rb" data-dkgo="' + t.id + '" data-fx="' + (side === 'l' ? 'riseL' : 'riseR') + '">'
      + '<i class="dkh-med ' + t.m + '">' + dkhIcon(t.ic) + '</i><b class="dkh-rbt">' + t.nm + '</b>'
      + (b ? '<em class="dkh-badge">' + b + '</em>' : '') + '</div>';
  }).join('') + '</div>';
}
function dkhRowsHTML(tab){
  var rows = dkRank(tab);
  if(tab === 'friends'){
    if(!rows.length){
      return '<div class="dkh-empty"><i class="dkh-emptyic">' + dkhIcon('duo') + '</i>'
        + '<b>オンラインで遊んだ相手が、ここに並びます</b>'
        + '<span>あいことばを伝えるだけで、はなれた友だちと同じ盤で遊べます</span>'
        + '<button type="button" class="dkbtn gr dkh-go-ol" data-dkgo="online">オンラインで遊ぶ</button></div>';
    }
    return rows.slice(0, 6).map(function(r, i){
      var d = r.at ? new Date(r.at) : null;
      return '<div class="dkh-row fr" style="--i:' + i + '">'
        + (r.card ? dkhFace(r.card) : '<span class="dkh-face dkh-noface">' + dkhIcon('duo') + '</span>')
        + '<span class="dkh-nm">' + esc(r.nm) + '</span>'
        + '<span class="dkh-meta">いっしょに ' + r.n + '回' + (d ? '・' + (d.getMonth() + 1) + '/' + d.getDate() : '') + '</span>'
        + (r.rp != null ? '<b class="dkh-rpv">' + dkhNum(r.rp) + '<i>RP</i></b>' : '')
        + '</div>';
    }).join('');
  }
  var meI = rows.findIndex(function(r){ return r.me; });
  var show = rows.slice(0, 6);
  if(meI >= 6) show[5] = rows[meI];
  return show.map(function(r, i){
    var no = r === rows[meI] ? meI : i;
    var t = dkhTier(r.rp);
    return '<div class="dkh-row' + (r.me ? ' me' : '') + (no < 3 ? ' top' + (no + 1) : '') + '" style="--i:' + i + '">'
      + '<span class="dkh-no">' + (no < 3 ? '<i class="dkh-medal m' + (no + 1) + '">' + (no + 1) + '</i>' : (no + 1)) + '</span>'
      + dkhFace(r.card || CARDPOOL[0].id)
      + '<span class="dkh-nm">' + esc(r.nm) + (r.cpu ? '<i class="dkh-cpu">CPU</i>' : '') + (r.me ? '<i class="dkh-you">YOU</i>' : '') + '</span>'
      + '<span class="dkh-tier" style="--tc:' + t.col + ';--td:' + t.dk + '">' + t.nm + '</span>'
      + '<b class="dkh-rpv">' + dkhNum(r.rp) + '<i>RP</i></b>'
      + '</div>';
  }).join('');
}
function dkhPeddler(){
  try{
    var pd = SV.shop && SV.shop.peddler;
    if(!pd || typeof pd !== 'object') return null;
    var now = Date.now(), until = +pd.until || +pd.end || (+pd.at ? +pd.at + 30 * 60000 : 0);
    if(!(until > now)) return null;
    return { min: Math.max(1, Math.ceil((until - now) / 60000)) };
  }catch(e){ return null; }
}
function showHome(){
  dkhSeasonCheck();
  dkhMailList();
  var c = cardById(SV.equip) || CARDPOOL[0], own = SV.cards[c.id] || { lv:1 };
  var img = dkhImg(c.id), w = thisWeek(), t = dkhTier(SV.rp | 0);
  var mails = dkhMailCount(), keys = SV.keys | 0, mile = Math.min(DKH_MILE, SV.mile | 0);
  var logo = dkhUi('logo-home'), pd = dkhPeddler();
  var ticks = '';
  for(var i = 5; i < DKH_MILE; i += 5) ticks += '<i style="left:' + (i / DKH_MILE * 100).toFixed(2) + '%"></i>';

  var html = ''
    /* 上段：ロゴ・今週のイベント・郵便・設定 */
    + '<div class="dkh-top">'
    +   (logo ? '<div class="dkh-logo" style="background-image:url(' + logo + ');--dkh-logo:url(' + logo + ')" data-fx="pop"></div>'
              : '<div class="dkh-logo dkh-logotx" data-fx="pop"><b>ダイスキングダム</b></div>')
    +   '<div class="dkh-ev" data-dkgo="news" data-fx="pop"><span class="dkh-evtag">今週</span>'
    +     '<i class="dkh-evic">' + w.ic + '</i><b class="dkh-evnm">' + esc(w.nm) + '</b>'
    +     '<span class="dkh-evds">' + esc(w.ds) + '</span>'
    +     '<span class="dkh-evtime">のこり ' + weekEndsIn() + '</span><i class="dkh-evshine" aria-hidden="true"></i></div>'
    +   '<div class="dkh-tr">'
    +     '<div class="dkh-ic" data-dkgo="mail" data-fx="pop" role="button" aria-label="郵便箱">' + dkhIcon('mail')
    +       (mails ? '<em class="dkh-dot">' + Math.min(99, mails) + '</em>' : '') + '</div>'
    +     '<div class="dkh-ic" data-dkgo="settings" data-fx="pop" role="button" aria-label="設定">' + dkhIcon('gear') + '</div>'
    +   '</div>'
    + '</div>'
    + dkhRail(DKH_LEFT, 'l') + dkhRail(DKH_RIGHT, 'r')

    /* 中央：首から下げたカード＋入場する */
    + '<div class="dkh-cardcol">'
    +   '<div class="dkh-badgewrap" data-fx="hero">'
    +     '<div class="dkh-strap" aria-hidden="true"><i></i></div>'
    +     '<div class="dkh-card ' + (RAR[c.rar] ? RAR[c.rar].cls : 'rA') + '">'
    +       '<div class="dkh-chd"><span class="dkh-rar">' + esc(RAR[c.rar] ? RAR[c.rar].nm : c.rar) + '</span>'
    +         '<b class="dkh-cnm">' + esc(c.nm) + '</b></div>'
    +       '<div class="dkh-pic"><i class="dkh-glow" aria-hidden="true"></i>'
    +         (img ? '<i class="dkh-art" style="background-image:url(' + img + ')"></i>'
                   : '<b class="dkh-ph">' + esc(c.nm.slice(0, 1)) + '</b>')
    +         '<i class="dkh-gloss" aria-hidden="true"></i>'
    +         '<span class="dkh-role">' + esc(c.role) + '</span>'
    +         '<span class="dkh-lv"><i>Lv</i>' + own.lv + '</span></div>'
    +       '<div class="dkh-plate"><span class="dkh-ttl' + (SV.title ? '' : ' none') + '">' + esc(SV.title || '称号なし') + '</span>'
    +         '<b class="dkh-pnm">' + esc(SV.name || 'あなた') + '</b>'
    +         '<span class="dkh-sw" data-dkgo="cards" role="button" aria-label="カードを替える">' + dkhIcon('swap') + '</span></div>'
    +     '</div>'
    +   '</div>'
    +   '<button type="button" class="dkh-enter fx-primary green" id="dkEnter" data-fx="popBig">'
    +     '<span class="dkh-entx">入場する</span><i class="dkh-chev" aria-hidden="true"><b></b><b></b></i></button>'
    + '</div>'

    /* 右：リーグ（リーグ／ともだち）とマイレージ */
    + '<div class="dkh-side" data-fx="riseR">'
    +   '<div class="dkh-lgh">' + dkhEmblem(t, 'big')
    +     '<div class="dkh-lgt"><b class="dkh-tnm" style="--tc:' + t.col + '">' + t.nm + 'リーグ</b>'
    +       '<span class="dkh-lgs">' + dkhSeasonName(SV.season || dkhSeasonKey()) + 'シーズン・のこり ' + dkhSeasonLeft() + '日</span></div>'
    +     '<div class="dkh-lgrp"><b id="dkhRp">' + dkhNum(SV.rp) + '</b><i>RP</i></div>'
    +     '<button type="button" class="dkh-q" data-dkh="help" aria-label="等級と報酬">？</button></div>'
    +   '<div class="dkh-tbar"><span class="dkh-tbg"><i style="transform:scaleX(' + t.prog.toFixed(3) + ');--tc:' + t.col + '"></i></span>'
    +     '<em>' + (t.next ? '次の' + t.next.nm + 'まで あと ' + dkhNum(t.left) + ' RP' : '最上位の等級です') + '</em></div>'
    +   '<div class="dkh-tabs" role="tablist">'
    +     '<button type="button" class="dkh-tab' + (DKH_homeTab === 'league' ? ' on' : '') + '" data-dkh-tab="league">リーグ</button>'
    +     '<button type="button" class="dkh-tab' + (DKH_homeTab === 'friends' ? ' on' : '') + '" data-dkh-tab="friends">ともだち</button></div>'
    +   '<div class="dkh-list" id="dkhList" data-tab="' + DKH_homeTab + '">' + dkhRowsHTML(DKH_homeTab) + '</div>'
    +   '<div class="dkh-mile">'
    +     '<span class="dkh-ml">マイレージ</span>'
    +     '<span class="dkh-mbar"><i class="dkh-mfill" style="transform:scaleX(' + (mile / DKH_MILE).toFixed(3) + ')"></i>' + ticks
    +       '<em>' + mile + ' / ' + DKH_MILE + '</em></span>'
    +     '<span class="dkh-key">' + dkhIcon('key') + '<b>×' + keys + '</b></span>'
    +     '<button type="button" class="dkh-mbtn' + (keys ? ' ready' : '') + '" id="dkhMileBtn">キューブ</button></div>'
    + '</div>'
    + (pd ? '<div class="dkh-ped" data-dkh="ped" role="button" data-fx="pop"><i class="dkh-lantern" aria-hidden="true"></i>'
          + '<b>行商人が来た！</b><span>のこり ' + pd.min + '分</span></div>' : '')
    + walletHTML();

  var el = dkMake('home', 'home', html);
  el.classList.add('dkh-home');
  if(pd) el.classList.add('dkh-hasped');
  el.setAttribute('data-fx-step', '40');
  dkWire(el);
  dkhWireHome(el);
  screenTo('home');
  try{ bgm('lobby'); }catch(e){}
  return el;
}
function dkhWireHome(el){
  var go = el.querySelector('#dkEnter');
  if(go) go.onclick = function(){
    if(go._busy) return; go._busy = 1;
    setTimeout(function(){ go._busy = 0; }, 900);
    try{ SFX.click(); ac(); }catch(e){}
    try{ fxBurst(go, { kind:'star', n:14, power:.8 }); }catch(e){}
    dkFlowStart();
  };
  el.querySelectorAll('[data-dkh-tab]').forEach(function(b){
    b.onclick = function(){ dkhHomeTab(b.getAttribute('data-dkh-tab')); };
  });
  var q = el.querySelector('[data-dkh="help"]');
  if(q) q.onclick = function(){ try{ SFX.click(); }catch(e){} dkhLeagueHelp(); };
  var mb = el.querySelector('#dkhMileBtn');
  if(mb) mb.onclick = function(){ dkhMileCube(mb); };
  var pd = el.querySelector('[data-dkh="ped"]');
  if(pd) pd.onclick = function(){ try{ SFX.click(); }catch(e){} showShop('peddler'); };
}
/* リーグ／ともだちの切り替え（画面は作り直さず、表だけ差し替える） */
function dkhHomeTab(tab){
  tab = (tab === 'friends') ? 'friends' : 'league';
  try{ SFX.click(); }catch(e){}
  DKH_homeTab = tab;
  var el = document.getElementById('home'); if(!el) return;
  el.querySelectorAll('[data-dkh-tab]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-dkh-tab') === tab); });
  var L = el.querySelector('#dkhList'); if(!L) return;
  L.innerHTML = dkhRowsHTML(tab);
  L.setAttribute('data-tab', tab);
  L.classList.remove('swap'); void L.offsetWidth; L.classList.add('swap');
  dkWire(L);
}
/* ❓ 等級と報酬の表 */
function dkhLeagueHelp(){
  var t = dkhTier(SV.rp | 0);
  var rows = DKH_TIERS.map(function(x, i){
    var nx = DKH_TIERS[i + 1];
    return '<div class="dkh-hrow' + (i === t.i ? ' on' : '') + '">' + dkhEmblem(x)
      + '<b class="dkh-hnm">' + x.nm + '</b>'
      + '<span class="dkh-hrange">' + dkhNum(x.min) + (nx ? '〜' + dkhNum(nx.min - 1) : '以上') + ' RP</span>'
      + '<span class="dkh-hrw"><i class="dkh-coin"></i>' + dkhNum(x.rw.g) + (x.rw.d ? '<i class="dkh-gem"></i>' + x.rw.d : '') + '</span>'
      + (i === t.i ? '<em class="dkh-now">いまここ</em>' : '') + '</div>';
  }).join('');
  modal('<div class="modal dkh-modal dkh-help"><div class="dkh-mhd"><b>等級と報酬</b></div>'
    + '<div class="dkh-hrows">' + rows + '</div>'
    + '<p class="dkh-hnote">勝つと <b>+' + DKH_RP_WIN + '×クラスの倍率</b>、負けると <b>−' + DKH_RP_LOSE + '</b>（0より下にはなりません）。'
    + '月が変わると、その時の等級の報酬が郵便箱に届き、RP は半分になります。</p>'
    + '<div class="dkh-mbtns"><button class="dkbtn gd" data-act="ok">とじる</button></div></div>');
}
/* マイレージキューブ：🔑1本で S 以上のカードを1枚 */
function dkhMileCube(btn){
  if((SV.keys | 0) < 1){
    try{ SFX.warn && SFX.warn(); }catch(e){}
    try{ fxShake(btn, 220); }catch(e){}
    dkhSay('L', dkhIcon('key'), '🔑が足りません', 'マイレージを' + DKH_MILE + 'ためると🔑が1本もらえます', 2200);
    return;
  }
  try{ SFX.click(); }catch(e){}
  SV.keys = (SV.keys | 0) - 1;
  var rar = Math.random() < 0.2 ? 'SS' : 'S';
  var pool = CARDPOOL.filter(function(c){ return c.rar === rar; });
  if(!pool.length) pool = CARDPOOL.filter(function(c){ return c.rar === 'S' || c.rar === 'SS'; });
  var c = pool[(Math.random() * pool.length) | 0];
  var r = grant(c);
  saveNow();
  try{ dkEmit('gacha:pull', { lane:'mile', n:1, got:[c.id] }); }catch(e){}
  var fresh = r && r.card && r.card.fresh, img = dkhImg(c.id);
  var p = modal('<div class="modal dkh-modal dkh-rev ' + (RAR[c.rar] ? RAR[c.rar].cls : '') + '">'
    + '<div class="dkh-mhd"><b>マイレージキューブ</b></div>'
    + '<div class="dkh-revstage"><div class="dkh-revcard ' + (RAR[c.rar] ? RAR[c.rar].cls : '') + '">'
    +   '<span class="dkh-rar">' + esc(RAR[c.rar].nm) + '</span>'
    +   '<div class="dkh-revpic"><i class="dkh-revart"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '></i></div>'
    +   (fresh ? '<em class="dkh-new">NEW!</em>' : '') + '</div></div>'
    + '<b class="dkh-revnm">' + esc(c.nm) + '</b>'
    + '<span class="dkh-revsub">' + (fresh ? 'はじめて手に入れた！' : '重なりが1枚ふえました（強化に使えます）') + '</span>'
    + '<div class="dkh-mbtns"><button class="dkbtn gd" data-act="ok">受け取る</button></div></div>');
  try{
    var st = document.querySelector('#modalBody .dkh-revstage');
    if(st) fxRays(st, { tone:'gold', fast:c.rar === 'SS' });
    var card = document.querySelector('#modalBody .dkh-revcard');
    setTimeout(function(){
      if(card) fxBurst(card, { kind:'star', n:c.rar === 'SS' ? 30 : 18, power:1.2 });
      if(c.rar === 'SS'){ fxFlash(); try{ SFX.gachaRare(); }catch(e){} } else { try{ SFX.coin(); }catch(e){} }
    }, 260);
  }catch(e){}
  p.then(function(){ if(document.querySelector('#home.on')) showHome(); });
  return c;
}

/* ══════════════════════════════════════════════════════════════
   イベント（今週のイベント／お知らせ／遊び方）
   ══════════════════════════════════════════════════════════════ */
var DKH_WEEK_MS = 7 * 24 * 3600 * 1000;
function dkhWeekStart(k){               // k 週あとの週の始まり（月曜 朝6時）
  return Date.UTC(1970, 0, 5, 6, 0, 0) + (weekIndex() + (k | 0)) * DKH_WEEK_MS;
}
function dkhWeekLeftTxt(){
  var ms = Math.max(0, dkhWeekStart(1) - Date.now());
  var d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000);
  var m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  var z = function(v){ return (v < 10 ? '0' : '') + v; };
  return d + '日 ' + z(h) + ':' + z(m) + ':' + z(s);
}
function dkhMD(t){ var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); }
function dkhFeatCard(c, tag, sub, cls){
  var img = dkhImg(c.id);
  return '<div class="dkh-fc ' + (RAR[c.rar] ? RAR[c.rar].cls : '') + (cls ? ' ' + cls : '') + '" data-fx="deal">'
    + '<span class="dkh-fctag">' + tag + '</span>'
    + '<div class="dkh-fcpic"><i class="dkh-fcart"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '></i>'
    +   '<span class="dkh-rar">' + esc(RAR[c.rar] ? RAR[c.rar].nm : c.rar) + '</span><i class="dkh-gloss" aria-hidden="true"></i></div>'
    + '<b class="dkh-fcnm">' + esc(c.nm) + '</b><span class="dkh-fcsub">' + sub + '</span></div>';
}
function dkhNewsWeek(){
  var w = thisWeek(), f = featureCard(), nt = dkhWeekStart(1), f2 = featureCard(nt + 3600000);
  var sched = '';
  for(var k = 0; k < 4; k++){
    var t0 = dkhWeekStart(k), wk = thisWeek(t0 + 3600000);
    sched += '<div class="dkh-sc' + (k === 0 ? ' now' : '') + '"><span class="dkh-scwhen">'
      + ['今週', '来週', '再来週', '3週間後'][k] + '</span><i class="dkh-scic">' + wk.ic + '</i>'
      + '<b class="dkh-scnm">' + esc(wk.nm) + '</b><span class="dkh-scd">' + dkhMD(t0) + '〜</span></div>';
  }
  return '<div class="dkh-wkban" data-fx="pop"><span class="dkh-wkrib"><b>今週のイベント</b></span>'
    + '<div class="dkh-wkmain"><i class="dkh-wkic">' + w.ic + '</i>'
    +   '<div class="dkh-wktx"><b class="dkh-wknm">' + esc(w.nm) + '</b><p class="dkh-wkds">' + esc(w.ds) + '</p></div></div>'
    + '<div class="dkh-wkleft"><span>のこり</span><b id="dkhWeekLeft">' + dkhWeekLeftTxt() + '</b>'
    +   '<em>毎週 月曜 朝6時に切り替わります</em></div><i class="dkh-evshine" aria-hidden="true"></i></div>'
    + '<div class="dkh-wkrow">'
    +   '<div class="dkh-feats">'
    +     dkhFeatCard(f, '今週の注目', 'キューブで出やすさ ×2', 'now')
    +     dkhFeatCard(f2, '来週の注目', dkhMD(nt) + ' から ×2', 'next')
    +     '<button type="button" class="dkbtn gd dkh-togacha fx-primary" data-dkgo="gacha" data-fx="pop">キューブを引く</button>'
    +   '</div>'
    +   '<div class="dkh-sched fx-panel" data-fx="riseR"><b class="dkh-schd">イベントの予定</b>' + sched + '</div>'
    + '</div>';
}
function dkhNewsInfo(){
  var n = dkhMailCount(), t = dkhTier(SV.rp | 0);
  var items = [
    { ic:'trophy', nm:'リーグ ' + dkhSeasonName(SV.season || dkhSeasonKey()) + 'シーズン',
      ds:'いまは ' + t.nm + '（' + dkhNum(SV.rp) + ' RP）。のこり ' + dkhSeasonLeft() + '日。月が変わると、その時の等級の報酬が郵便箱に届きます。',
      go:'home', bt:'ホームへ' },
    { ic:'key', nm:'マイレージ',
      ds:'対戦1回で1たまり、' + DKH_MILE + 'で🔑が1本。🔑を使うと、S 以上のカードが必ず出るマイレージキューブを引けます。',
      go:'home', bt:'ホームへ' },
    { ic:'mail', nm:'郵便箱' + (n ? '（' + n + '通）' : ''),
      ds:'報酬やおわびは郵便箱に届きます。届いてから30日で消えるので、早めに受け取ってください。',
      go:'mail', bt:'ひらく' },
    { ic:'globe', nm:'オンライン対戦',
      ds:'4文字の あいことば を伝えるだけで、はなれた友だちと同じ盤で遊べます。遊んだ相手は「ともだち」に並びます。',
      go:'friends', bt:'ともだち' },
    { ic:'horn', nm:'週替わりイベント',
      ds:'毎週 月曜 朝6時に、盤のルールが少し変わるイベントと、注目カードが切り替わります。',
      go:'news', bt:'今週を見る', tab:'week' }
  ];
  return '<div class="dkh-info dkh-parch" data-fx="rise" data-fx-step="50">' + items.map(function(it){
    return '<div class="dkh-inrow" data-fx="riseR"><i class="dkh-inic">' + dkhIcon(it.ic) + '</i>'
      + '<div class="dkh-intx"><b>' + esc(it.nm) + '</b><p>' + esc(it.ds) + '</p></div>'
      + '<button type="button" class="dkbtn gr dkh-ingo"' + (it.tab ? ' data-dkh-ntab="' + it.tab + '"' : ' data-dkgo="' + it.go + '"') + '>'
      + it.bt + '</button></div>';
  }).join('') + '</div>';
}
function dkhNewsTips(){
  var seen = {}, list = [];
  (typeof TIPS !== 'undefined' && Array.isArray(TIPS) ? TIPS : []).forEach(function(t){
    var k = String(t).replace(/（[^）]*）/g, '').replace(/で(その場で)?勝ちです.*$/, '');
    if(seen[k]) return; seen[k] = 1; list.push(String(t));
  });
  return '<div class="dkh-tips dkh-parch" data-fx="rise"><div class="dkh-tiphd"><b>遊び方のコツ</b></div><ol class="dkh-tipl">'
    + list.map(function(t, i){ return '<li><i>' + (i + 1) + '</i><span>' + esc(t) + '</span></li>'; }).join('')
    + '</ol></div>';
}
function showNews(tab){
  if(typeof tab === 'string' && /^(week|info|tips)$/.test(tab)) DKH_newsTab = tab;
  var T = DKH_newsTab;
  var tabs = DKH_NTABS.map(function(t){ return { id:t.id, ic:dkhIcon(t.ic), nm:t.nm }; });
  var body = (T === 'info') ? dkhNewsInfo() : (T === 'tips') ? dkhNewsTips() : dkhNewsWeek();
  var el = dkMake('news', 'quest', dkHead('news', { title:'イベント' }) + dkTabs(tabs, T)
    + '<div class="dkh-nbody" data-tab="' + T + '">' + body + '</div>');
  el.classList.add('dkh-news');
  dkWire(el, function(id){ showNews(id); });
  el.querySelectorAll('[data-dkh-ntab]').forEach(function(b){
    b.onclick = function(){ try{ SFX.click(); }catch(e){} showNews(b.getAttribute('data-dkh-ntab')); };
  });
  if(T === 'week'){
    dkEvery('dkh-week', function(){
      var e = document.getElementById('dkhWeekLeft');
      if(e && e.isConnected) e.textContent = dkhWeekLeftTxt();
    }, 1000);
  } else { dkEvery('dkh-week', null); }
  screenTo('news');
  return el;
}

/* ══════════════════════════════════════════════════════════════
   郵便箱（受け取る／すべて受け取る・30日で消える）
   ══════════════════════════════════════════════════════════════ */
function dkhMailRow(m){
  var now = Date.now(), days = Math.max(0, Math.ceil(((m.exp || 0) - now) / 86400000));
  var it = '';
  if(m.item && m.item.kind){
    var k = m.item.kind, id = m.item.id, nm = '';
    try{
      if(k === 'card' && cardById(id)) nm = cardById(id).nm;
      else if(k === 'pend' && pendById(id)) nm = pendById(id).nm;
      else if(k === 'die' && typeof dieById === 'function' && dieById(id)) nm = dieById(id).nm;
      else if(k === 'key') nm = '🔑';
    }catch(e){}
    if(nm) it = '<span class="dkh-chip it">' + esc(nm) + '</span>';
  }
  return '<div class="dkh-mrow' + (days <= 3 ? ' soon' : '') + '" data-fx="riseR">'
    + '<i class="dkh-mic">' + esc(m.ic || '✉️') + '</i>'
    + '<div class="dkh-mmid"><b class="dkh-mnm">' + esc(m.nm || 'おしらせ') + '</b>'
    +   '<span class="dkh-mdate">' + dkhMD(m.at || now) + ' に届きました・<em>のこり ' + days + '日</em></span></div>'
    + '<div class="dkh-mrw">'
    +   ((m.g | 0) ? '<span class="dkh-chip g"><i class="dkh-coin"></i>' + dkhNum(m.g) + '</span>' : '')
    +   ((m.d | 0) ? '<span class="dkh-chip d"><i class="dkh-gem"></i>' + dkhNum(m.d) + '</span>' : '')
    +   it + '</div>'
    + '<button type="button" class="dkbtn gr dkh-take" data-dkh-take="' + esc(m.id) + '">受け取る</button></div>';
}
function showMail(){
  dkhSeasonCheck();
  var list = dkhMailList().slice();
  var sg = 0, sd = 0, ni = 0;
  var soon = 0, now = Date.now();
  list.forEach(function(m){ sg += m.g | 0; sd += m.d | 0; if(m.item && m.item.kind) ni++; if((m.exp || 0) - now <= 3 * 86400000) soon++; });
  var rows = list.map(dkhMailRow).join('');
  var el = dkMake('mail', 'quest', dkHead('mail', { title:'郵便箱' })
    + '<div class="dkh-mb">'
    +   '<div class="dkh-mlist dkh-parch" data-fx="rise"><div class="dkh-lhd"><b>とどいた郵便</b><span>' + list.length + '通</span></div>'
    +     '<div class="dkh-mrows" data-fx-step="40">' + (rows || ('<div class="dkh-empty"><i class="dkh-emptyic">' + dkhIcon('mail') + '</i>'
    +       '<b>郵便は届いていません</b><span>リーグの報酬やおわびは、ここに届きます</span></div>')) + '</div></div>'
    +   '<div class="dkh-mside fx-panel" data-fx="riseR"><i class="dkh-msic">' + dkhIcon('mail') + '</i>'
    +     '<b class="dkh-mst">受け取れる報酬</b>'
    +     '<div class="dkh-msum"><span><i class="dkh-coin"></i><b>' + dkhNum(sg) + '</b></span>'
    +       '<span><i class="dkh-gem"></i><b>' + dkhNum(sd) + '</b></span>'
    +       (ni ? '<span class="dkh-msit">アイテム ' + ni + 'こ</span>' : '') + '</div>'
    +     (soon ? '<span class="dkh-msoon">もうすぐ消える郵便 ' + soon + '通</span>' : '')
    +     '<button type="button" class="dkbtn gd dkh-all fx-primary" id="dkhAll"' + (list.length ? '' : ' disabled') + '>すべて受け取る</button>'
    +     '<p class="dkh-mnote">郵便は届いてから30日で消えます</p></div>'
    + '</div>');
  el.classList.add('dkh-mail');
  dkWire(el);
  el.querySelectorAll('[data-dkh-take]').forEach(function(b){
    b.onclick = function(){ dkhClaim(b.getAttribute('data-dkh-take'), b); };
  });
  var all = el.querySelector('#dkhAll');
  if(all) all.onclick = function(){ dkhClaimAll(all); };
  screenTo('mail');
  return el;
}
function dkhClaimFx(from, g, d){
  var ps = [];
  try{
    if(g) ps.push(fxCoins(from, fxWalletEl('gold'), { kind:'coin', n:Math.min(16, 6 + ((g / 2000) | 0)) }));
    if(d) ps.push(fxCoins(from, fxWalletEl('gem'), { kind:'gem', n:Math.min(10, 3 + d) }));
  }catch(e){}
  try{ dkWallet(); }catch(e){}
  return Promise.all(ps);
}
function dkhClaim(id, btn){
  var m = (SV.mail || []).find(function(x){ return x.id === id; });
  if(!m || (btn && btn._busy)) return null;
  if(btn){ btn._busy = 1; btn.disabled = true; }
  var row = btn ? btn.closest('.dkh-mrow') : null;
  var got = dkhTakeMail(m);
  saveNow();
  if(row) row.classList.add('fx-claim', 'dkh-taken');
  try{ SFX.coin(); }catch(e){}
  dkhSay('R', '<i class="dkh-tic">' + esc(m.ic || '✉️') + '</i>', '受け取りました',
    [got.g ? dkhNum(got.g) + ' ゴールド' : '', got.d ? 'ダイヤ ' + got.d : '', got.item || ''].filter(Boolean).join('・') || esc(m.nm), 1800);
  dkhClaimFx(row ? (row.querySelector('.dkh-mrw') || row) : null, got.g, got.d).then(function(){
    if(document.querySelector('#mail.on')) showMail();
  });
  return got;
}
function dkhClaimAll(btn){
  var list = dkhMailList().slice();
  if(!list.length || (btn && btn._busy)) return null;
  if(btn){ btn._busy = 1; btn.disabled = true; }
  var g = 0, d = 0, items = [];
  list.forEach(function(m){ var r = dkhTakeMail(m); g += r.g; d += r.d; if(r.item) items.push(r.item); });
  saveNow();
  document.querySelectorAll('#mail .dkh-mrow').forEach(function(r, i){
    setTimeout(function(){ r.classList.add('fx-claim', 'dkh-taken'); }, i * 60);
  });
  try{ SFX.coinBurst ? SFX.coinBurst() : SFX.coin(); }catch(e){}
  dkhSay('R', '<i class="dkh-tic">🎁</i>', 'まとめて受け取りました',
    [g ? dkhNum(g) + ' ゴールド' : '', d ? 'ダイヤ ' + d : '', items.length ? 'アイテム ' + items.length + 'こ' : ''].filter(Boolean).join('・'), 2200);
  dkhClaimFx(document.querySelector('#mail .dkh-mrows') || btn, g, d).then(function(){
    if(document.querySelector('#mail.on')) showMail();
  });
  return { g:g, d:d, items:items };
}

/* ══════════════════════════════════════════════════════════════
   ともだち（オンラインで遊んだ相手の一覧）
   ══════════════════════════════════════════════════════════════ */
function showFriends(){
  var fr = (SV.friends || []).slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
  var ok = dkhOnlineOK();
  var rows = fr.map(function(f){
    return '<div class="dkh-frrow" data-fx="riseR">'
      + (f.card ? dkhFace(f.card) : '<span class="dkh-face dkh-noface">' + dkhIcon('duo') + '</span>')
      + '<div class="dkh-frmid"><b>' + esc(f.name) + '</b><span>いっしょに遊んだ回数 ' + (f.n | 0) + '回</span></div>'
      + '<div class="dkh-frlast"><span>最後に遊んだ日</span><b>' + (f.at ? dkhMD(f.at) : '—') + '</b></div>'
      + (typeof f.rp === 'number' ? '<b class="dkh-rpv">' + dkhNum(f.rp) + '<i>RP</i></b>' : '')
      + '</div>';
  }).join('');
  var el = dkMake('friends', 'home', dkHead('friends', { title:'ともだち' })
    + '<div class="dkh-fb">'
    +   '<div class="dkh-frlist dkh-parch" data-fx="rise"><div class="dkh-lhd"><b>ゲーム友だち</b><span>' + fr.length + '人</span></div>'
    +     '<div class="dkh-frrows" data-fx-step="40">' + (rows || ('<div class="dkh-empty"><i class="dkh-emptyic">' + dkhIcon('duo') + '</i>'
    +       '<b>オンラインで遊んだ相手が、ここに並びます</b><span>名前・いっしょに遊んだ回数・最後に遊んだ日を覚えておきます</span></div>')) + '</div></div>'
    +   '<div class="dkh-frside fx-panel" data-fx="riseR">'
    +     '<div class="dkh-globe" aria-hidden="true"><i class="dkh-orbit"></i>' + dkhIcon('globe') + '</div>'
    +     '<b class="dkh-frst">オンラインで遊ぶ</b>'
    +     '<ol class="dkh-steps"><li><i>1</i><span>「部屋をつくる」を押す</span></li>'
    +       '<li><i>2</i><span>出てきた4文字の あいことば を友だちに伝える</span></li>'
    +       '<li><i>3</i><span>友だちが4文字を入れたら「はじめる」</span></li></ol>'
    +     '<button type="button" class="dkbtn gr dkh-olbtn fx-primary green" data-dkgo="online">オンラインで遊ぶ</button>'
    +     '<p class="dkh-frnote">' + (ok ? '遊んだ相手は、自動でここに並びます'
                                        : (window.claude ? 'この版ではオンライン対戦が使えません（GitHub Pages 版で遊べます）'
                                                         : 'ネットにつながると、オンライン対戦が使えます')) + '</p></div>'
    + '</div>');
  el.classList.add('dkh-friends');
  dkWire(el);
  screenTo('friends');
  return el;
}

/* ══════════════════════════════════════════════════════════════
   設定（音量・アニメの速さ・キャラの絵柄・演出・タイトルへ）
   ══════════════════════════════════════════════════════════════ */
function dkhSeg(key, list, cur){
  return '<div class="fx-seg dkh-seg" data-dkh-seg="' + key + '">' + list.map(function(o){
    return '<button type="button" data-v="' + o.v + '" aria-pressed="' + (String(o.v) === String(cur) ? 'true' : 'false') + '">' + o.nm + '</button>';
  }).join('') + '<i class="thumb" aria-hidden="true"></i></div>';
}
function dkhSegThumb(seg){
  var b = seg.querySelector('button[aria-pressed="true"]') || seg.querySelector('button');
  var th = seg.querySelector('i.thumb');
  if(!b || !th) return;
  th.style.setProperty('--x', (b.offsetLeft - 4) + 'px');
  th.style.setProperty('--w', b.offsetWidth + 'px');
}
function dkhSetRow(label, ctl){
  return '<div class="dkh-srow"><span class="dkh-sl">' + label + '</span><div class="dkh-sc">' + ctl + '</div></div>';
}
function dkhSetSpeed(v){
  v = +v; if(!DKH_SPEEDS.some(function(o){ return o.v === v; })) v = 1;
  cfg.speed = v; SPEED = v;
  try{ localStorage.setItem('dv_speed', String(v)); }catch(e){}
  var os = document.getElementById('optSpeed'); if(os) os.value = String(v);
  return v;
}
function dkhSettings(){
  var bv = Math.round(((typeof bgmOn !== 'undefined' && !bgmOn) ? 0 : bgmVol) * 100), sv = Math.round(sfxVol * 100);
  var p = modal('<div class="modal dkh-modal dkh-set"><div class="dkh-mhd"><b>設定</b></div><div class="dkh-srows">'
    + dkhSetRow('音楽', '<input type="range" class="dkh-range" id="dkhBgm" min="0" max="100" value="' + bv + '" aria-label="音楽の大きさ"><b class="dkh-rv" id="dkhBgmV">' + bv + '</b>')
    + dkhSetRow('効果音', '<input type="range" class="dkh-range" id="dkhSfx" min="0" max="100" value="' + sv + '" aria-label="効果音の大きさ"><b class="dkh-rv" id="dkhSfxV">' + sv + '</b>')
    + dkhSetRow('アニメの速さ', dkhSeg('speed', DKH_SPEEDS, cfg.speed))
    + dkhSetRow('キャラの絵柄', dkhSeg('art', DKH_ARTS, (typeof ART_STYLE === 'string') ? ART_STYLE : 'human'))
    + dkhSetRow('演出', dkhSeg('fx', [{ v:'std', nm:'標準' }, { v:'lite', nm:'控えめ' }], DKFX.lite ? 'lite' : 'std'))
    + '</div><div class="dkh-mbtns"><button class="dkbtn dkh-wood" data-act="title">タイトルへ</button>'
    + '<button class="dkbtn gd" data-act="ok">とじる</button></div></div>');
  var body = document.getElementById('modalBody');
  try{
    var rg = function(id, set){
      var r = body.querySelector('#' + id), lab = body.querySelector('#' + id + 'V');
      if(!r) return;
      r.oninput = function(){ var v = Math.max(0, Math.min(100, +r.value || 0)); if(lab) lab.textContent = v; set(v / 100); };
      r.onchange = function(){ try{ SFX.click(); }catch(e){} };
    };
    rg('dkhBgm', function(v){
      bgmVol = v; bgmOn = v > 0.001;
      var o = document.getElementById('bgmVol'); if(o) o.value = Math.round(v * 100);
      applyAudioPrefs();
    });
    rg('dkhSfx', function(v){
      sfxVol = v;
      var o = document.getElementById('sfxVol'); if(o) o.value = Math.round(v * 100);
      applyAudioPrefs();
    });
    body.querySelectorAll('[data-dkh-seg]').forEach(function(seg){
      var key = seg.getAttribute('data-dkh-seg');
      dkhSegThumb(seg);
      seg.querySelectorAll('button').forEach(function(b){
        b.onclick = function(){
          seg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          dkhSegThumb(seg);
          var v = b.getAttribute('data-v');
          if(key === 'speed') dkhSetSpeed(v);
          else if(key === 'art'){
            try{ setArtStyle(v); refreshArt(); }catch(e){}
            var oa = document.getElementById('optArt'); if(oa) oa.value = v;
          }
          else if(key === 'fx') DKFX.setLite(v === 'lite');
          try{ SFX.click(); }catch(e){}
        };
      });
    });
    requestAnimationFrame(function(){ body.querySelectorAll('[data-dkh-seg]').forEach(dkhSegThumb); });
  }catch(e){ console.error('[WP9]', e); }
  p.then(function(a){ if(a === 'title') screenTo('title'); });
  return p;
}

/* ══════════════════════════════════════════════════════════════
   オンライン画面（7-online.js の mkScreen('online'|'olroom') を王宮に）
   ・7-online.js は編集しない。見た目は 1t-home.html のセレクタ＋!important。
   ・もどる／やめる は、7-online.js が onclick を付けた「あと」（マイクロタスク）で付け直す。
   ══════════════════════════════════════════════════════════════ */
function dkhOnlineSkin(el, id){
  el.className = 'screen meta dk dkh-online ' + (id === 'olroom' ? 'dkh-olroom' : 'dkh-olent') + (el.classList.contains('on') ? ' on' : '');
  el.setAttribute('style', dkBgCss('home'));
  var cr = document.createElement('div');
  cr.className = 'dkh-olcrest fx-deco'; cr.setAttribute('aria-hidden', 'true');
  cr.innerHTML = '<i class="dkh-olring"></i>' + dkhIcon('globe');
  el.insertBefore(cr, el.firstChild);
  var h2 = el.querySelector('h2'); if(h2) h2.setAttribute('data-fx', 'popBig');
  el.querySelectorAll('.btn').forEach(function(b){ b.setAttribute('data-fx', 'pop'); });
  try{ fxAmbient(el); }catch(e){}
  Promise.resolve().then(function(){ dkhOnlineWire(el); });
}
function dkhOnlineWire(el){
  ['#olBack', '#olQuit'].forEach(function(sel){
    var b = el.querySelector(sel); if(!b) return;
    b.onclick = function(){
      try{ SFX.click(); }catch(e){}
      try{ if(window.DV_OL_API) window.DV_OL_API.leave(false); }catch(e){ console.error('[WP9]', e); }
      showHome();
    };
  });
  var lb = el.querySelector('label'), inp = el.querySelector('#olName');
  if(lb && inp && !lb.htmlFor) lb.htmlFor = 'olName';
}

/* ══════════ タイトルの「オンラインで遊ぶ」（どの版でも押せば必ず反応する） ══════════ */
function dkhTitleOnline(){
  var go = document.querySelector('#title .go');
  if(!go || document.getElementById('toOnline')) return;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'btn ghost'; b.id = 'toOnline'; b.textContent = 'オンラインで遊ぶ';
  b.onclick = function(){ dkhOpenOnline(false); };
  go.appendChild(b);
}

/* ══════════ 画面が変わったら、前の画面のトーストを片付ける ══════════
   たった今（250ms 以内）出たトーストは、行き先の画面のためのお知らせなので残す。 */
function dkhOnScreen(p){
  if(!p || !p.changed) return;
  var now = Date.now();
  ['toastL', 'toastR'].forEach(function(id){
    var box = document.getElementById(id); if(!box) return;
    Array.prototype.slice.call(box.children).forEach(function(t){
      if(!t._dkhAt || now - t._dkhAt < 250) return;
      t.classList.add('out');
      setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 180);
    });
  });
}

/* ══════════ 起動 ══════════ */
(function(){
  try{
    DKH_boot = Date.now();
    /* アニメの速さ（F5 のあとも残す） */
    try{
      var sp = parseFloat(localStorage.getItem('dv_speed'));
      if(DKH_SPEEDS.some(function(o){ return o.v === sp; })) dkhSetSpeed(sp);
    }catch(e){}
    /* mkScreen を包む（'online' と 'olroom' の時だけ手を加える） */
    if(typeof mkScreen === 'function' && !DKH_mk0){
      DKH_mk0 = mkScreen;
      mkScreen = function(id){
        var el = DKH_mk0.apply(this, arguments);
        if(id === 'online' || id === 'olroom'){ try{ dkhOnlineSkin(el, id); }catch(e){ console.error('[WP9]', e); } }
        return el;
      };
    }
    dkOn('match:end', dkhOnMatchEnd);
    dkOn('screen', dkhOnScreen);
    /* トーストに「出た時刻」を付ける（画面が変わった時の片付けに使う） */
    var mo = new MutationObserver(function(recs){
      var now = Date.now();
      recs.forEach(function(r){ r.addedNodes.forEach(function(n){ if(n.nodeType === 1 && !n._dkhAt) n._dkhAt = now; }); });
    });
    ['toastL', 'toastR'].forEach(function(id){ var b = document.getElementById(id); if(b) mo.observe(b, { childList:true }); });
    /* タイトルの「オンラインで遊ぶ」：読み込み時と3秒後 */
    dkhTitleOnline();
    setTimeout(function(){ try{ dkhTitleOnline(); }catch(e){ console.error('[WP9]', e); } }, 3000);
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dkhTitleOnline);
    /* シーズンの切り替え（前の月の報酬は郵便へ） */
    dkhSeasonCheck();
    /* dkWire されていない画面の常設バーの＋（例：旧・待機部屋） */
    var st = document.getElementById('stage');
    if(st) st.addEventListener('click', function(e){
      var b = e.target && e.target.closest ? e.target.closest('.dkh-plus[data-dkbuy]') : null;
      if(!b || b.onclick) return;
      try{ SFX.click(); }catch(_){}
      var tab = (b.getAttribute('data-dkbuy') === 'gem') ? 'gem' : 'osusume';
      if(showShop.length === 0 && typeof dkShopTab !== 'undefined') dkShopTab = tab;
      showShop(tab);
    });
  }catch(e){ console.error('[WP9]', e); }
})();
