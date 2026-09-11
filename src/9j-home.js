
/* ══════════════════════════════════════════════════════════════
   ダイスキングダム — ホームまわり（9j-home.js / v9 WP9 → v10 WP16b）
   ──────────────────────────────────────────────────────────────
   ・ホーム・ランキング（友だち＝毎週／全体＝5等級×5段・毎月のシーズン）・プレゼントボックス・
     マイレージガチャ・名札の枠・イベント・友達・設定・常設バー。オンライン画面とタイトルの「オンラインで遊ぶ」も。
   ・宣言し直す関数：showHome, dkGo, dkRank, showNews, walletHTML, showMail, showFriends, dkhSettings, weekIndex。
     包む関数：mkScreen（'online' と 'olroom' の時だけ）。WEEKLY の中身（ダイス増量など）もここで持つ（C28）。
   ・トップレベルは function 宣言と DKH_ 付きの var、最後の初期化 IIFE だけ。
   ・演出の乱数は DKFX.rnd()。ゲームの抽選（マイレージガチャ）だけ Math.random。
   ・常時アニメは各画面8個まで。光の筋は dkhGlint が1本ずつ順に流す（無限のアニメを増やさない）。
   ══════════════════════════════════════════════════════════════ */

/* ══════════ 定数（var にするのは、読み込み途中に呼ばれても TDZ で落ちないため） ══════════ */
var DKH_MILE = 20;                       // マイレージ20でゴールドキー1個
var DKH_RP_WIN = 40, DKH_RP_LOSE = 10;   // 勝ち +40×クラスの倍率 ／ 負け −10（0より下にしない）
var DKH_WEEK_MS = 604800000;
/* 表は関数で持つ（9d-flow.js の起動処理が walletHTML→dkhTier を先に呼ぶため）。st＝1段の幅（5段で次の等級） */
function dkhTierTable(){
  return [
    { id:'bronze', nm:'ブロンズ', min:0,    st:40,  col:'#D08A4E', dk:'#6B3A12', rw:{ g:3000,  d:0  } },
    { id:'silver', nm:'シルバー', min:200,  st:80,  col:'#D5DEE8', dk:'#56657A', rw:{ g:8000,  d:2  } },
    { id:'gold',   nm:'ゴールド', min:600,  st:120, col:'#FFD44A', dk:'#8A5E06', rw:{ g:20000, d:5  } },
    { id:'plat',   nm:'プラチナ', min:1200, st:160, col:'#8FF0DC', dk:'#1E6B62', rw:{ g:40000, d:10 } },
    { id:'dia',    nm:'ダイヤ',   min:2000, st:200, col:'#9ED8FF', dk:'#1B4E9E', rw:{ g:80000, d:20 } }
  ];
}
var DKH_TIERS = dkhTierTable();
/* 全体ランキングの相手。サーバが無いので「CPU」と明示する。点数は日付だけで決まる（ゴールドを使っても動かない） */
var DKH_RIVALS = [
  { nm:'CPU ガル', card:'c03', base:60,  per:8  },
  { nm:'CPU リノ', card:'c05', base:210, per:13 },
  { nm:'CPU ゼニ', card:'c07', base:470, per:19 },
  { nm:'CPU ミラ', card:'c10', base:20,  per:5  },
  { nm:'CPU ドグ', card:'c12', base:820, per:27 }
];
/* 友だちランキング（毎週）の相手。週の番号で強さが少し変わり、週が進むほど点が伸びる */
var DKH_WRIVALS = [
  { nm:'CPU ルナ',   card:'c04', w:90  },
  { nm:'CPU ボルト', card:'c08', w:170 },
  { nm:'CPU アマネ', card:'c11', w:280 },
  { nm:'CPU ギル',   card:'c15', w:430 }
];
/* 友だちランキングの報酬（1位・2位・3位・4位以下。当作の数字） */
var DKH_WRW = [
  { g:20000, d:10, it:{ kind:'ticket', id:'first' } },
  { g:12000, d:5,  it:{ kind:'ticket', id:'biz' } },
  { g:8000,  d:3 },
  { g:3000,  d:0 }
];
/* ホームの縦のボタン（本家ロビーの文言） */
var DKH_LEFT = [
  { id:'cards', ic:'card', nm:'キャラクター<br>カード', m:'ruby'  },
  { id:'dice',  ic:'dice', nm:'サイコロ',   m:'amber' },
  { id:'pend',  ic:'pend', nm:'ペンダント', m:'emer'  },
  { id:'cube',  ic:'cube', nm:'キューブ',   m:'sapph' },
  { id:'gacha', ic:'shop', nm:'ガチャ<br>/ショップ', m:'amet' }
];
var DKH_RIGHT = [
  { id:'quest',    ic:'scroll', nm:'ミッション', m:'amber' },
  { id:'news',     ic:'horn',   nm:'イベント',   m:'ruby'  },
  { id:'daily',    ic:'cal',    nm:'出席簿',     m:'sapph' },
  { id:'friends',  ic:'duo',    nm:'友達',       m:'emer'  },
  { id:'guide',    ic:'book',   nm:'ガイド',     m:'amet'  },
  { id:'settings', ic:'gear',   nm:'設定',       m:'wood'  }
];
var DKH_NTABS = [
  { id:'week', ic:'horn',   nm:'今週' },
  { id:'info', ic:'scroll', nm:'お知らせ' },
  { id:'tips', ic:'book',   nm:'ガイド' }
];
var DKH_SPEEDS = [ { v:1.4, nm:'ゆっくり' }, { v:1, nm:'ふつう' }, { v:0.62, nm:'はやい' } ];
var DKH_ARTS   = [ { v:'human', nm:'手描き風' }, { v:'gem', nm:'宝石の守護獣' }, { v:'anime', nm:'アニメ風' } ];
/* 品物の名前（C21・C22・C24） */
var DKH_TKNM = { biz:'ビジネス入場券', first:'ファースト入場券', dia:'ダイヤモンド入場券' };
var DKH_FRAMES = [ { id:'bronze', nm:'銅の名札枠' }, { id:'silver', nm:'銀の名札枠' }, { id:'gold', nm:'金の名札枠' } ];
var DKH_CUBENM = { wood:'ウッド', silver:'シルバー', gold:'ゴールド', dia:'ダイヤ' };
/* マイレージガチャ（本家：ノーマル🔑1・大当たり🔑5）。[重み, 種類, 値]。中身の数字は当作 */
var DKH_MG = {
  n:{ nm:'ノーマルガチャ', key:1, t:[[30,'g',1000],[22,'g',2000],[10,'g',5000],[14,'d',2],[6,'d',5],[12,'card','A'],[4,'pend'],[2,'tk','biz']] },
  j:{ nm:'大当たりガチャ', key:5, t:[[22,'g',10000],[8,'g',30000],[18,'d',10],[6,'d',30],[1.5,'d',100],[25,'card','S'],[5,'card','SS'],[8,'pend'],[5,'tk','first'],[1.5,'tk','dia']] }
};
var DKH_homeTab = 'friends';
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
      + '<path d="M24 13v8" stroke="#FFF6D0" stroke-width="3" stroke-linecap="round"/></svg>',
  book: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 16c-6-5-15-6-23-4v38c8-2 17-1 23 4 6-5 15-6 23-4V12c-8-2-17-1-23 4z" fill="#FFF6E2" stroke="#3A2405" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M32 16v38" stroke="#3A2405" stroke-width="3"/><path d="M15 23c4-1 9-1 12 1M15 31c4-1 9-1 12 1M15 39c4-1 9-1 12 1" stroke="#8A6A34" stroke-width="2.6" stroke-linecap="round"/>'
      + '<path d="M42 10v16l5-4 5 4V10" fill="#E8483A" stroke="#3A2405" stroke-width="2.4" stroke-linejoin="round"/></svg>'
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

/* ══════════ 週（日本時間の月曜 朝5時で区切る。C33） ══════════
   起点は 1970-01-05(月) 05:00 JST ＝ Date.UTC(1970,0,4,20)。旧 weekIndex（月曜 06:00 UTC＝15:00 JST 起点）とは
   月曜 5:00〜15:00 の10時間だけ番号が1つ進み、それ以外は同じ番号。読み込み途中にも呼ばれるので var を使わない */
function weekIndex(t){
  var now = (typeof t === 'number') ? t : Date.now();
  return Math.floor((now - Date.UTC(1970, 0, 4, 20, 0, 0)) / 604800000);
}
/* k 週あとの週の始まり（月曜 朝5時） */
function dkhWeekStart(k, t){ return Date.UTC(1970, 0, 4, 20, 0, 0) + (weekIndex(t) + (k | 0)) * 604800000; }
/* 残り時間「0日13時間9分」 */
function dkhLeftTxt(ms){
  ms = Math.max(0, ms);
  return Math.floor(ms / 864e5) + '日' + Math.floor(ms % 864e5 / 36e5) + '時間' + Math.floor(ms % 36e5 / 6e4) + '分';
}
function dkhWeekLeft(){ return dkhLeftTxt(dkhWeekStart(1) - Date.now()); }

/* ══════════ 全体ランキング（5等級×5段。シーズン＝月） ══════════ */
function dkhTier(rp){
  rp = Math.max(0, rp | 0);
  var T = DKH_TIERS || dkhTierTable();   // 9d-flow.js の起動処理（walletHTML）から、表の var より先に呼ばれることがある
  var i = 0;
  for(var k = 0; k < T.length; k++) if(rp >= T[k].min) i = k;
  var t = T[i], nx = T[i + 1] || null;
  var j = Math.min(4, Math.floor((rp - t.min) / t.st)), lo = t.min + j * t.st;
  var hi = (j < 4) ? lo + t.st : (nx ? nx.min : 0);
  return { i:i, id:t.id, nm:t.nm, col:t.col, dk:t.dk, rw:t.rw, min:t.min, next:nx, dv:5 - j, dn:t.nm + (5 - j), lv:i * 5 + j,
    prog: hi ? Math.min(1, (rp - lo) / (hi - lo)) : 1, left: hi ? hi - rp : 0 };
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
/* 月が変わっていたら、前のシーズンの報酬をプレゼントボックスへ送り、RP を半分にする */
function dkhSeasonCheck(t){
  if(typeof SV !== 'object' || !SV) return null;
  var k = dkhSeasonKey(t);
  if(!SV.season){ SV.season = k; saveNow(); return null; }
  if(SV.season === k) return null;
  var old = SV.season, rp = SV.rp | 0, tier = dkhTier(rp), out = { from:old, to:k, tier:tier.dn, rp:rp, half:Math.floor(rp / 2) };
  if(rp > 0) out.mail = dkMail({ ic:'🏆', nm:'全体ランキング ' + dkhSeasonName(old) + 'シーズンの報酬（' + tier.dn + '）', g:tier.rw.g, d:tier.rw.d });
  SV.rp = Math.floor(rp / 2);
  SV.season = k;
  saveNow();
  return out;
}
/* 全体ランキングの相手（CPU）の点数：月の何日目かだけで決まる */
function dkhRivalRp(r, t){
  var d = new Date(typeof t === 'number' ? t : Date.now()).getDate();
  return r.base + r.per * d;
}

/* ══════════ 友だちランキング（毎週。今週の RP＝SV.wk.rp） ══════════ */
function dkhWkRp(){ var w = SV.wk; return (w && w.key === weekIndex()) ? Math.max(0, w.rp | 0) : 0; }
function dkhWkFrac(t){
  var now = (typeof t === 'number') ? t : Date.now();
  return Math.max(0, Math.min(1, (now - dkhWeekStart(0, now)) / DKH_WEEK_MS));
}
/* 週 key の CPU i の点（k＝週の経過の割合 0〜1。週の番号で ±20% ゆらぐ） */
function dkhWkCpu(i, key, k){
  var h = (Math.imul((key | 0) + 1013, -1640531535) ^ Math.imul(i + 7, 40503)) >>> 0;
  return Math.round(DKH_WRIVALS[i].w * (0.8 + (h % 41) / 100) * k);
}
/* 順位表。tab='friends'＝今週の友だちランキング、'all'＝全体ランキング（通算の RP） */
function dkRank(tab){
  var me = { nm:(SV.name || 'あなた'), me:true, card:SV.equip }, list = [];
  if(tab === 'friends'){
    var key = weekIndex(), k = dkhWkFrac();
    me.rp = dkhWkRp();
    DKH_WRIVALS.forEach(function(r, i){ list.push({ nm:r.nm, rp:dkhWkCpu(i, key, k), cpu:true, card:r.card }); });
    (SV.friends || []).forEach(function(f){
      if(f && f.wk && f.wk.key === key) list.push({ nm:f.name, rp:f.wk.rp | 0, friend:true, card:f.card || null });
    });
  } else {
    me.rp = SV.rp | 0;
    DKH_RIVALS.forEach(function(r){ list.push({ nm:r.nm, rp:dkhRivalRp(r), cpu:true, card:r.card }); });
    (SV.friends || []).forEach(function(f){
      if(f && typeof f.rp === 'number') list.push({ nm:f.name, rp:f.rp | 0, friend:true, card:f.card || null });
    });
  }
  list.push(me);
  return list.sort(function(a, b){ return (b.rp - a.rp) || (a.me ? -1 : b.me ? 1 : 0); });
}
/* 締めた週 key での順位（CPU は週の終わりの点） */
function dkhWeekRank(key, rp){
  var n = 1;
  DKH_WRIVALS.forEach(function(r, i){ if(dkhWkCpu(i, key, 1) > rp) n++; });
  (SV.friends || []).forEach(function(f){ if(f && f.wk && f.wk.key === key && (f.wk.rp | 0) > rp) n++; });
  return n;
}
/* 前の週の友だちランキングの報酬をプレゼントボックスへ（1週に1回。SV.wkRw で二重に送らない。遊んでいない週は無し） */
function dkhWeekReward(prev){
  if(!prev || typeof prev.key !== 'number' || prev.key < 0 || prev.key >= weekIndex()) return null;
  if(SV.wkRw === prev.key) return null;
  SV.wkRw = prev.key;
  var rp = Math.max(0, prev.rp | 0), m = null;
  if(rp > 0){
    var no = dkhWeekRank(prev.key, rp), rw = DKH_WRW[Math.min(no, DKH_WRW.length) - 1];
    m = dkMail({ ic:'🏅', nm:'友だちランキング報酬（' + no + '位）', g:rw.g, d:rw.d, item:rw.it || null });
  }
  saveNow();
  return m;
}
/* 週が変わっていたら報酬を送る。前の週の RP は自分で覚えた SV.wkMine から読む（SV.wk を誰が作り直しても失わない） */
function dkhWeekCheck(){
  var m = SV.wkMine;
  if(m && typeof m.key === 'number' && m.key !== weekIndex()){ dkhWeekReward(m); SV.wkMine = null; saveNow(); }
}
/* 'week:roll'（C33・WP12 の DKCORE_week）でも同じ処理 */
function dkhOnWeekRoll(e){
  var p = e && e.prev, m = SV.wkMine;
  if(!p || typeof p.key !== 'number') return;
  dkhWeekReward({ key:p.key, rp:Math.max(p.rp | 0, (m && m.key === p.key) ? (m.rp | 0) : 0) });
  if(m && m.key === p.key){ SV.wkMine = null; saveNow(); }
}

/* ══════════ 品物（C21・C22・C24）とプレゼントボックス ══════════ */
function dkhTkNm(id){ return DKH_TKNM[id] || '入場券'; }
function dkhFrame(id){ for(var i = 0; i < DKH_FRAMES.length; i++) if(DKH_FRAMES[i].id === id) return DKH_FRAMES[i]; return null; }
function dkhFrNm(id){ var f = dkhFrame(id); return f ? f.nm : '名札の枠'; }
function dkhFrOwn(id){ var o = SV.frames && SV.frames.own; return !!(o && (Array.isArray(o) ? o.indexOf(id) >= 0 : o[id])); }
function dkhFrEq(){ var e = SV.frames && SV.frames.eq; return (e && dkhFrame(e) && dkhFrOwn(e)) ? e : ''; }
function dkhItemNm(it){
  if(!it || !it.kind) return '';
  var k = it.kind, id = String(it.id || ''), o = null;
  try{
    if(k === 'card') o = cardById(id);
    else if(k === 'pend') o = pendById(id);
    else if(k === 'die' && DICE.some(function(x){ return x.id === id; })) o = dieById(id);
  }catch(e){ o = null; }
  if(o) return o.nm;
  return k === 'key' ? 'ゴールドキー' : k === 'ticket' ? dkhTkNm(id) : k === 'frame' ? dkhFrNm(id)
       : k === 'cube' ? (DKH_CUBENM[id] || '') + 'キューブ' : '';
}
/* 品物を渡す。C21 の dkGrantItem を先に使い、仮の部品（false を返す）の間だけここで渡す。渡せたら true。
   キューブは WP12 の本物が要る（ここでは渡さず false） */
function dkhGrant(it){
  if(!it || !it.kind) return false;
  var k = String(it.kind), id = String(it.id || ''), n = Math.max(1, it.n | 0), r = false, i;
  try{ if(typeof dkGrantItem === 'function') r = dkGrantItem({ kind:k, id:id, n:n }); }catch(e){ console.error('[WP16b]', e); r = false; }
  if(r !== false) return true;
  if(k === 'card' && cardById(id)){ for(i = 0; i < n; i++) grant(cardById(id)); return true; }
  if(k === 'pend' && pendById(id)){ for(i = 0; i < n; i++) dkGivePend(id); return true; }
  if(k === 'die' && DICE.some(function(x){ return x.id === id; })){ SV.dice[id] = Math.max(1, SV.dice[id] | 0); return true; }
  if(k === 'key'){ SV.keys = (SV.keys | 0) + n; return true; }
  if(k === 'ticket' && DKH_TKNM[id]){
    if(!SV.tickets || typeof SV.tickets !== 'object') SV.tickets = { biz:0, first:0, dia:0 };
    SV.tickets[id] = (SV.tickets[id] | 0) + n;
    return true;
  }
  if(k === 'frame' && dkhFrame(id)){
    var f = (SV.frames && typeof SV.frames === 'object') ? SV.frames : (SV.frames = { own:[], eq:'' });
    if(Array.isArray(f.own)){ if(f.own.indexOf(id) < 0) f.own.push(id); }
    else { if(!f.own || typeof f.own !== 'object') f.own = {}; f.own[id] = true; }
    return true;
  }
  return false;
}
function dkhMailList(){
  var now = Date.now();
  if(!Array.isArray(SV.mail)) SV.mail = [];
  var keep = SV.mail.filter(function(m){ return m && (m.exp || 0) > now; });
  if(keep.length !== SV.mail.length){ SV.mail = keep; saveNow(); }
  return SV.mail;
}
function dkhMailCount(){ return dkhMailList().length; }
/* 1通ぶんを受け取る。渡せない品物はプレゼントボックスに残す（{kept:true}）。受け取った中身を返す */
function dkhTakeMail(m){
  var it = m.item;
  if(it && it.kind && !dkhGrant({ kind:it.kind, id:it.id, n:it.n })) return { g:0, d:0, item:null, kept:true };
  var got = { g:m.g | 0, d:m.d | 0, item:(it && it.kind) ? (dkhItemNm(it) || null) : null, kept:false };
  SV.gold += got.g; SV.gem += got.d;
  var i = SV.mail.indexOf(m);
  if(i >= 0) SV.mail.splice(i, 1);
  return got;
}

/* ══════════ 対戦が終わった時（RP・友だちランキング・マイレージ・ともだち） ══════════ */
/* サイコロの RP ボーナス（C05 dkDieAb(pi).rp。1以上は％、1未満は割合として読む） */
function dkhDieRp(pi){
  var v = 0;
  try{ if(typeof dkDieAb === 'function' && typeof pi === 'number' && pi >= 0) v = +((dkDieAb(pi) || {}).rp) || 0; }catch(e){ v = 0; }
  return v >= 1 ? v / 100 : Math.max(0, v);
}
/* 相手の RP。人間は分かる時だけ。CPU は強さで：よわい 0.7・ふつう 1.0・つよい 1.3 ×自分の RP（最低200） */
function dkhFoeRp(p, mine){
  if(p && typeof p.rp === 'number') return p.rp;
  if(!p || p.kind !== 'cpu') return mine;
  var ai = (typeof cfg === 'object' && cfg) ? Math.max(0, Math.min(2, cfg.ai | 0)) : 1;
  return Math.round(Math.max(200, mine) * [0.7, 1, 1.3][ai]);
}
function dkhBeatHigh(me, mine){
  try{
    if(!G || !G.players || typeof me !== 'number') return false;
    return G.players.some(function(p, i){
      return i !== me && !(typeof dkAlly === 'function' && dkAlly(me, i)) && dkhFoeRp(p, mine) > mine;
    });
  }catch(e){ return false; }
}
/* match:end（C20）。勝ち RP＝40×クラスの倍率×(1＋サイコロの RP)、本日のマップ +20%、ポイントが高い相手 +30%。
   負け −10（0より下にしない。'rp:guard' で戻す）。SV.wk.rp にも足す。chips は短く（WP4#4：8文字程度） */
function dkhOnMatchEnd(p){
  if(!p || typeof SV !== 'object') return;
  if(typeof p.me === 'number' && p.me < 0) return;           // 人間のいない観戦
  dkhSeasonCheck(); dkhWeekCheck();
  var x = +p.x;
  if(!(x > 0)){ try{ x = +(dkClassOf(p.cls || SV.cls) || {}).x; }catch(e){ x = 1; } }
  if(!(x > 0)) x = 1;
  var before = SV.rp | 0, d, mapB = 0, hiB = 0;
  if(p.won){
    var d0 = Math.round(DKH_RP_WIN * x * (1 + dkhDieRp(p.me))), today = '';
    try{ today = (typeof dkTodayMap === 'function') ? dkTodayMap() : ''; }catch(e){ today = ''; }
    if(p.mapId && today && p.mapId === today) mapB = Math.round(d0 * 0.2);
    if(dkhBeatHigh(p.me, before)) hiB = Math.round(d0 * 0.3);
    d = d0 + mapB + hiB;
  } else d = -Math.min(DKH_RP_LOSE, before);
  SV.rp = Math.max(0, before + d);
  var w = (typeof DKCORE_week === 'function') ? DKCORE_week() : SV.wk, wd = 0;
  if(w){ var w0 = w.rp | 0; w.rp = Math.max(0, w0 + d); wd = w.rp - w0; SV.wkMine = { key:w.key, rp:w.rp }; }
  SV.rpLast = (d < 0) ? { d:d, wd:wd, wk:w ? w.key : -1 } : null;
  var t0 = dkhTier(before), t1 = dkhTier(SV.rp);
  if(t1.i > t0.i) SV.tierUp = { from:t0.id, to:t1.id };
  /* マイレージ */
  SV.mile = (SV.mile | 0) + 1;
  var key = false;
  if(SV.mile >= DKH_MILE){ SV.mile -= DKH_MILE; SV.keys = (SV.keys | 0) + 1; key = true; }
  if(p.online) dkhNoteFriends(p);
  saveNow();
  if(!Array.isArray(p.chips)) return;
  var add = [{ ic:'🏆', label:'RP', v:(d >= 0 ? '+' : '') + d, k:'rp' }];
  if(mapB) add.push({ ic:'🗺️', label:'本日のマップ', v:'+20%', k:'map' });
  if(hiB) add.push({ ic:'⚔️', label:'格上に勝利！', v:'+30%', k:'high', ds:'ポイントが高い相手の勝利！ 30%' });
  if(t1.i > t0.i) add.push({ ic:'👑', label:'昇格', v:t1.nm, k:'tier', from:t0.dn, to:t1.dn });
  else if(t1.lv !== t0.lv) add.push({ ic:t1.lv > t0.lv ? '⬆️' : '⬇️', label:t1.lv > t0.lv ? '昇段' : '降段', v:t1.dn, k:'div', from:t0.dn, to:t1.dn });
  add.push(key ? { ic:'🔑', label:'ゴールドキー', v:'+1', k:'key' } : { ic:'🎫', label:'マイレージ', v:SV.mile + '/' + DKH_MILE, k:'mile' });
  /* 行商人の行（9i が先に足す）は最後へ */
  var ped = [];
  for(var i = p.chips.length - 1; i >= 0; i--) if(p.chips[i] && p.chips[i].k === 'ped') ped.unshift(p.chips.splice(i, 1)[0]);
  Array.prototype.push.apply(p.chips, add.concat(ped));
}
/* 'rp:guard'（C20）：直前の負けの −10 を戻す（1回だけ。その週の友だちランキングの分も） */
function dkhOnRpGuard(){
  var L = SV.rpLast;
  if(!L || !(L.d < 0)) return;
  SV.rp = (SV.rp | 0) - L.d;
  var w = SV.wk;
  if(w && w.key === L.wk && L.wd){ w.rp = Math.max(0, (w.rp | 0) - L.wd); SV.wkMine = { key:w.key, rp:w.rp }; }
  SV.rpLast = null;
  saveNow();
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
      if(typeof o.prof.wkrp === 'number') f.wk = { key:weekIndex(), rp:o.prof.wkrp | 0 };
      if(o.prof.cardId && cardById(o.prof.cardId)) f.card = o.prof.cardId;
    }
  });
  if(SV.friends.length > 100) SV.friends.length = 100;
}

/* ══════════ 常設バー（Lv・経験値・ゴールド・ダイヤ・RP） ══════════
   ＋は .dkh-plus[data-dkbuy]（.wp にしないのは 5-meta.js の古いクリック処理に拾わせないため）。
   ショップの無料の宝が受け取れる時はゴールドの＋に赤い印。 */
function walletHTML(){
  var need = playerLvNeed(SV.lv), exp = Math.max(0, SV.exp | 0), k = Math.min(1, exp / Math.max(1, need));
  var t = dkhTier(SV.rp | 0), fr = false;
  try{ fr = (typeof dksFreeReady === 'function') && !!dksFreeReady(); }catch(e){ fr = false; }
  return '<div class="wallet dkh-wallet">'
    + '<div class="dkh-wi dkh-wlv"><span class="dkh-lvb"><i>Lv</i><b id="wLv">' + SV.lv + '</b></span>'
    +   '<span class="dkh-xp"><i style="transform:scaleX(' + k.toFixed(3) + ')"></i><em>' + dkhNum(exp) + ' / ' + dkhNum(need) + '</em></span></div>'
    + '<div class="dkh-wi dkh-wg"><i class="dkh-coin" aria-hidden="true"></i><b id="wGold">' + SV.gold.toLocaleString() + '</b>'
    +   '<button type="button" class="dkh-plus' + (fr ? ' dot' : '') + '" data-dkbuy="gold" aria-label="ショップ">＋</button></div>'
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
    case 'cube':     return showGacha('cube');     // キューブ（報酬の箱の置き場）は WP16a の showGacha('cube')
    case 'pend':     return showPend();
    case 'dice':     return showDice();
    case 'shop':     return showShop();
    case 'quest':    return showQuest();
    case 'daily':    return showDaily();
    case 'news':     return showNews('week');
    case 'info':     return showNews('info');
    case 'guide':    return showNews('tips');
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

/* ══════════ 演出の小道具（常時アニメを増やさない） ══════════ */
/* 光の筋：root の中の sel（.dkh-gl、pe を渡すとその疑似要素）を1本ずつ順に、1.4秒ごとに1回だけ流す
   （el.animate・transform だけ。無限のアニメにしない）。スマホ・控えめ・動きを減らすでは流さない。画面が変わると dkEvery が止まる */
function dkhGlint(root, sel, key, pe){
  if(!root || DKFX.mob || DKFX.lite || DKFX.reduced) return;
  var n = 0, kf = [{ transform:'translateX(-160%) skewX(-16deg)' }, { transform:'translateX(430%) skewX(-16deg)' }];
  dkEvery(key, function(){
    if(!root.isConnected || !root.classList.contains('on') || document.hidden) return;
    var list = root.querySelectorAll(sel);
    if(!list.length) return;
    var g = list[n++ % list.length], o = { duration:900, easing:'ease-in-out' };
    if(pe) o.pseudoElement = pe;
    try{ g.animate(kf, o); }catch(e){}
  }, 1400);
}
/* 画面の背景の光（fxAmbient）を、漂う粒なしで先に作る（粒は1個ずつ無限のアニメになるため） */
function dkhAmb(el){ try{ fxAmbient(el, { motes:0 }); }catch(e){} return el; }

/* ══════════════════════════════════════════════════════════════
   ホーム（本家ロビー：左右の縦のボタン・首から下げたカード・右にランキング）
   ══════════════════════════════════════════════════════════════ */
function dkhRail(list, side){
  return '<div class="dkh-rail ' + side + '">' + list.map(function(t){
    var b = '';
    try{
      if(t.id === 'quest' && questReady()) b = '!';
      else if(t.id === 'daily' && canDaily()) b = '!';
      else if(t.id === 'gacha' && typeof freeLeft === 'function' && freeLeft() === 0) b = '!';
      else if(t.id === 'cube' && Array.isArray(SV.cubes) && SV.cubes.length) b = String(Math.min(7, SV.cubes.length));
    }catch(e){}
    return '<div class="dkh-rb" data-dkgo="' + t.id + '" data-fx="' + (side === 'l' ? 'riseL' : 'riseR') + '" role="button">'
      + '<i class="dkh-med ' + t.m + '">' + dkhIcon(t.ic) + '<i class="dkh-gl" aria-hidden="true"></i></i>'
      + '<b class="dkh-rbt' + (t.nm.indexOf('<br>') > 0 ? ' two' : '') + '">' + t.nm + '</b>'
      + (b ? '<em class="dkh-badge">' + b + '</em>' : '') + '</div>';
  }).join('') + '</div>';
}
function dkhRowHTML(r, no, tab, i){
  var t = dkhTier(r.rp);
  return '<div class="dkh-row' + (no < 3 ? ' top' + (no + 1) : '') + '" style="--i:' + i + '">'
    + '<span class="dkh-no">' + (no < 3 ? '<i class="dkh-medal m' + (no + 1) + '">' + (no + 1) + '</i>' : (no + 1)) + '</span>'
    + dkhFace(r.card || CARDPOOL[0].id)
    + '<span class="dkh-nm">' + esc(r.nm) + (r.cpu ? '<i class="dkh-cpu">CPU</i>' : '') + '</span>'
    + (tab === 'all' ? '<span class="dkh-tier" style="--tc:' + t.col + ';--td:' + t.dk + '">' + t.dn + '</span>' : '')
    + '<b class="dkh-rpv"><i class="dkh-cup" aria-hidden="true"></i>' + dkhNum(r.rp) + '</b></div>';
}
/* 自分の行（いちばん上に固定。✉ と件数でプレゼントボックスへ） */
function dkhMeHTML(rows){
  var i = rows.findIndex(function(r){ return r.me; }), r = rows[i], n = dkhMailCount();
  return '<div class="dkh-me"><span class="dkh-no">' + (i + 1) + '</span>' + dkhFace(r.card || CARDPOOL[0].id)
    + '<span class="dkh-nm">' + esc(r.nm) + '<i class="dkh-you">YOU</i></span>'
    + '<b class="dkh-rpv"><i class="dkh-cup" aria-hidden="true"></i>' + dkhNum(r.rp) + '</b>'
    + '<button type="button" class="dkh-mailb" data-dkgo="mail" aria-label="プレゼントボックス">' + dkhIcon('mail')
    + '<b>' + Math.min(99, n) + '</b></button>' + (n ? '<i class="dkh-new">new</i>' : '') + '</div>';
}
/* 全体ランキングの上の段の札（例「シルバー3」・シーズン・次の段まで） */
function dkhLeagueHTML(){
  var t = dkhTier(SV.rp | 0);
  return '<div class="dkh-lg">' + dkhEmblem(t, 'big')
    + '<div class="dkh-lgt"><b class="dkh-tnm" style="--tc:' + t.col + '">' + t.dn + '</b>'
    +   '<span class="dkh-lgs">' + dkhSeasonName(SV.season || dkhSeasonKey()) + 'シーズン・のこり ' + dkhSeasonLeft() + '日</span></div>'
    + '<div class="dkh-tbar"><span class="dkh-tbg"><i style="transform:scaleX(' + t.prog.toFixed(3) + ');--tc:' + t.col + '"></i></span>'
    +   '<em>' + (t.left ? 'つぎの段まで あと ' + dkhNum(t.left) + ' RP' : '最上位の段です') + '</em></div></div>';
}
function dkhRowsHTML(tab){
  var rows = dkRank(tab), others = rows.filter(function(r){ return !r.me; });
  return (tab === 'all' ? dkhLeagueHTML() : '') + dkhMeHTML(rows)
    + others.slice(0, tab === 'all' ? 4 : 5).map(function(r, i){ return dkhRowHTML(r, rows.indexOf(r), tab, i); }).join('');
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
  dkhSeasonCheck(); dkhWeekCheck(); dkhMailList();
  var c = cardById(SV.equip) || CARDPOOL[0], own = SV.cards[c.id] || { lv:1 };
  var img = dkhImg(c.id), w = thisWeek(), rc = RAR[c.rar] ? RAR[c.rar].cls : 'rA';
  var mails = dkhMailCount(), keys = SV.keys | 0, mile = Math.min(DKH_MILE, SV.mile | 0);
  var logo = dkhUi('logo-home'), pd = dkhPeddler(), fr = dkhFrEq();
  var html = ''
    /* 上段：ロゴ・今週のイベント・お知らせ・メール */
    + '<div class="dkh-top">'
    +   (logo ? '<div class="dkh-logo" style="background-image:url(' + logo + ');--dkh-logo:url(' + logo + ')" data-fx="pop"></div>'
              : '<div class="dkh-logo dkh-logotx" data-fx="pop"><b>ダイスキングダム</b></div>')
    +   '<div class="dkh-ev" data-dkgo="news" data-fx="pop" role="button"><span class="dkh-evtag">今週</span>'
    +     '<i class="dkh-evic">' + w.ic + '</i><b class="dkh-evnm">' + esc(w.nm) + '</b>'
    +     '<span class="dkh-evds">' + esc(w.ds) + '</span><i class="dkh-gl" aria-hidden="true"></i></div>'
    +   '<div class="dkh-tr">'
    +     '<div class="dkh-oshi" data-dkgo="info" data-fx="pop" role="button"><i>!</i><b>お知らせ</b></div>'
    +     '<div class="dkh-ic" data-dkgo="mail" data-fx="pop" role="button" aria-label="プレゼントボックス">' + dkhIcon('mail')
    +       '<b class="dkh-ict">メール</b>' + (mails ? '<em class="dkh-dot">' + Math.min(99, mails) + '</em>' : '') + '</div>'
    +   '</div>'
    + '</div>'
    + dkhRail(DKH_LEFT, 'l') + dkhRail(DKH_RIGHT, 'r')

    /* 中央：首から下げたカード＋入場する */
    + '<div class="dkh-cardcol">'
    +   '<div class="dkh-badgewrap" data-fx="hero">'
    +     '<div class="dkh-strap" aria-hidden="true"><i></i></div>'
    +     '<div class="dkh-card ' + rc + '">'
    +       '<div class="dkh-chd"><span class="dkh-rar">' + esc(RAR[c.rar] ? RAR[c.rar].nm : c.rar) + '</span>'
    +         '<b class="dkh-cnm">' + esc(c.nm) + '</b></div>'
    +       '<div class="dkh-pic"><i class="dkh-glow" aria-hidden="true"></i>'
    +         (img ? '<i class="dkh-art" style="background-image:url(' + img + ')"></i>'
                   : '<b class="dkh-ph">' + esc(c.nm.slice(0, 1)) + '</b>')
    +         '<i class="dkh-gl" aria-hidden="true"></i>'
    +         '<span class="dkh-role">' + esc(c.role) + '</span>'
    +         '<span class="dkh-lv"><i>Lv</i>' + own.lv + '</span></div>'
    +       '<div class="dkh-plate' + (fr ? ' fr-' + fr : '') + '"><span class="dkh-ttl' + (SV.title ? '' : ' none') + '">' + esc(SV.title || '称号なし') + '</span>'
    +         '<b class="dkh-pnm" data-dkh="frame" role="button" aria-label="名札の枠">' + esc(SV.name || 'あなた') + '</b>'
    +         '<span class="dkh-sw" data-dkgo="cards" role="button" aria-label="カードを替える">' + dkhIcon('swap') + '</span></div>'
    +     '</div>'
    +   '</div>'
    +   '<button type="button" class="dkh-enter fx-primary green" id="dkEnter" data-fx="popBig">'
    +     '<span class="dkh-entx">入場する</span><i class="dkh-chev" aria-hidden="true"><b></b><b></b></i></button>'
    + '</div>'

    /* 右：友だちランキング／全体ランキング・マイレージ */
    + '<div class="dkh-side" data-fx="riseR">'
    +   '<div class="dkh-rkh"><div class="dkh-tabs" role="tablist">'
    +     '<button type="button" class="dkh-tab' + (DKH_homeTab === 'friends' ? ' on' : '') + '" data-dkh-tab="friends">友だちランキング</button>'
    +     '<button type="button" class="dkh-tab' + (DKH_homeTab === 'all' ? ' on' : '') + '" data-dkh-tab="all">全体ランキング</button></div>'
    +     '<button type="button" class="dkh-q" data-dkh="help" aria-label="ランキングの報酬">？</button>'
    +     '<span class="dkh-left" id="dkhLeft">' + dkhWeekLeft() + '</span></div>'
    +   '<div class="dkh-list" id="dkhList" data-tab="' + DKH_homeTab + '">' + dkhRowsHTML(DKH_homeTab) + '</div>'
    +   '<div class="dkh-mile">'
    +     '<span class="dkh-mbar"><i class="dkh-mfill" style="transform:scaleX(' + (mile / DKH_MILE).toFixed(3) + ')"></i>'
    +       '<em>' + mile + '/' + DKH_MILE + ' マイレージを貯めてガチャ</em></span>'
    +     '<button type="button" class="dkh-mbtn' + (keys ? ' ready' : '') + '" id="dkhMileBtn">マイレージガチャ'
    +       '<span class="dkh-key">' + dkhIcon('key') + '<b>' + keys + '</b></span></button></div>'
    + '</div>'
    + (pd ? '<div class="dkh-ped" data-dkh="ped" role="button" data-fx="pop"><i class="dkh-lantern" aria-hidden="true"></i>'
          + '<b>行商人が来た！</b><span>のこり ' + pd.min + '分</span></div>' : '')
    + walletHTML();

  var el = dkhAmb(dkMake('home', 'home', html));
  el.classList.add('dkh-home');
  if(pd) el.classList.add('dkh-hasped');
  el.setAttribute('data-fx-step', '40');
  dkWire(el);
  dkhWireHome(el);
  screenTo('home');
  /* タイマーは screenTo のあと（画面が変わる時に DKFX.stopTimers が前の画面のタイマーを止めるため） */
  dkEvery('dkh-left', function(){
    var e = document.getElementById('dkhLeft'), s = dkhWeekLeft();
    if(e && e.isConnected && e.textContent !== s) e.textContent = s;
  }, 20000);
  dkhGlint(el, '.dkh-med > .dkh-gl, .dkh-pic > .dkh-gl, .dkh-ev > .dkh-gl', 'dkh-glint');
  if(SV.tierUp) setTimeout(dkhTierUpFx, 700);
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
  if(q) q.onclick = function(){ try{ SFX.click(); }catch(e){} dkhRankHelp(); };
  var mb = el.querySelector('#dkhMileBtn');
  if(mb) mb.onclick = function(){ dkhMileGacha(); };
  var pd = el.querySelector('[data-dkh="ped"]');
  if(pd) pd.onclick = function(){ try{ SFX.click(); }catch(e){} showShop('peddler'); };
  var fr = el.querySelector('[data-dkh="frame"]');
  if(fr) fr.onclick = function(){ dkhFramePick(); };
}
/* 友だちランキング／全体ランキングの切り替え（画面は作り直さず、表だけ差し替える） */
function dkhHomeTab(tab){
  tab = (tab === 'all') ? 'all' : 'friends';
  try{ SFX.click(); }catch(e){}
  DKH_homeTab = tab;
  var el = document.getElementById('home'); if(!el) return;
  el.querySelectorAll('[data-dkh-tab]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-dkh-tab') === tab); });
  var L = el.querySelector('#dkhList'); if(!L) return;
  L.innerHTML = dkhRowsHTML(tab);
  L.setAttribute('data-tab', tab);
  dkWire(L);
  if(DKFX.reduced) return;
  Array.prototype.forEach.call(L.children, function(r, i){
    try{ r.animate([{ transform:'translateX(28px) scale(.97)' }, { transform:'none' }], { duration:360, delay:i * 40, easing:'cubic-bezier(.16,1,.3,1)', fill:'backwards' }); }catch(e){}
  });
}
/* ？ ランキングの報酬（友だち＝毎週・全体＝毎月のシーズン） */
function dkhRankHelp(){
  var t = dkhTier(SV.rp | 0);
  var wk = DKH_WRW.map(function(r, i){
    return '<div class="dkh-hrow"><b class="dkh-hnm">' + (i < 3 ? (i + 1) + '位' : '4位以下') + '</b>'
      + '<span class="dkh-hrw"><i class="dkh-coin"></i>' + dkhNum(r.g) + (r.d ? '<i class="dkh-gem"></i>' + r.d : '')
      + (r.it ? '<em>' + esc(dkhItemNm(r.it)) + '</em>' : '') + '</span></div>';
  }).join('');
  var rows = DKH_TIERS.map(function(x, i){
    var nx = DKH_TIERS[i + 1];
    return '<div class="dkh-hrow' + (i === t.i ? ' on' : '') + '">' + dkhEmblem(x)
      + '<b class="dkh-hnm">' + x.nm + '</b>'
      + '<span class="dkh-hrange">' + dkhNum(x.min) + (nx ? '〜' + dkhNum(nx.min - 1) : '以上') + '</span>'
      + '<span class="dkh-hrw"><i class="dkh-coin"></i>' + dkhNum(x.rw.g) + (x.rw.d ? '<i class="dkh-gem"></i>' + x.rw.d : '') + '</span>'
      + (i === t.i ? '<em class="dkh-now">' + t.dn + '</em>' : '') + '</div>';
  }).join('');
  modal('<div class="modal dkh-modal dkh-help"><div class="dkh-mhd"><b>ランキングの報酬</b></div>'
    + '<div class="dkh-hcols"><div class="dkh-hcol"><b class="dkh-hsub">友だちランキング（毎週）</b>' + wk
    +   '<p class="dkh-hnote">毎週 月曜 朝5時に締めて、プレゼントボックスに届きます（その週に遊んだ時）。</p></div>'
    + '<div class="dkh-hcol"><b class="dkh-hsub">全体ランキング（毎月）</b>' + rows
    +   '<p class="dkh-hnote">各等級は5段（5→1）。月が変わると報酬が届き、RP は半分になります。</p></div></div>'
    + '<p class="dkh-hnote">勝つと <b>+' + DKH_RP_WIN + '×クラスの倍率</b>（本日のマップ +20%・ポイントが高い相手に勝つと +30%）、負けると <b>−' + DKH_RP_LOSE + '</b>。</p>'
    + '<div class="dkh-mbtns"><button class="dkbtn gd" data-act="ok">閉じる</button></div></div>');
}

/* ══════════ マイレージガチャ（J56） ══════════ */
function dkhMgDraw(kind){
  var T = DKH_MG[kind].t, sum = 0, i;
  for(i = 0; i < T.length; i++) sum += T[i][0];
  var r = Math.random() * sum, e = T[T.length - 1];
  for(i = 0; i < T.length; i++){ r -= T[i][0]; if(r < 0){ e = T[i]; break; } }
  var o = { k:e[1], v:e[2] };
  if(o.k === 'card'){
    var pool = CARDPOOL.filter(function(c){ return c.rar === o.v; });
    if(!pool.length) pool = CARDPOOL;
    o.c = pool[(Math.random() * pool.length) | 0];
  } else if(o.k === 'pend') o.p = PENDANTS[(Math.random() * PENDANTS.length) | 0];
  return o;
}
function dkhMgGive(o){
  if(o.k === 'g') SV.gold += o.v;
  else if(o.k === 'd') SV.gem += o.v;
  else if(o.k === 'card'){
    var r = grant(o.c); o.fresh = !!(r && r.card && r.card.fresh);
    try{ dkEmit('gacha:pull', { lane:'mile', n:1, got:[o.c.id] }); }catch(e){}
  }
  else if(o.k === 'pend'){ var q = dkGivePend(o.p.id); o.fresh = !!(q && q.fresh); }
  else if(o.k === 'tk') dkhGrant({ kind:'ticket', id:o.v, n:1 });
}
function dkhMgIn(o){
  var art, nm, sub;
  if(o.k === 'g'){ art = '<i class="dkh-coin"></i>'; nm = dkhNum(o.v); sub = 'ゴールド'; }
  else if(o.k === 'd'){ art = '<i class="dkh-gem"></i>'; nm = '×' + o.v; sub = 'ダイヤ'; }
  else if(o.k === 'card'){ art = dkhFace(o.c.id); nm = o.c.nm; sub = (RAR[o.c.rar] ? RAR[o.c.rar].nm : o.c.rar) + 'カード'; }
  else if(o.k === 'pend'){ art = '<i class="dkh-pem">' + esc(o.p.ic || '📿') + '</i>'; nm = o.p.nm; sub = 'ペンダント'; }
  else { art = '<i class="dkh-tk"></i>'; nm = dkhTkNm(o.v); sub = '入場券'; }
  return '<span class="dkh-bart">' + art + '</span><b class="dkh-bnm">' + esc(nm) + '</b>'
    + '<span class="dkh-bsub">' + sub + (o.fresh ? '・NEW' : '') + '</span>';
}
/* ［ノーマルガチャ 🔑1個］［大当たりガチャ 🔑5個］を選ぶ */
function dkhMileGacha(){
  try{ SFX.click(); }catch(e){}
  var keys = SV.keys | 0, mile = Math.min(DKH_MILE, SV.mile | 0);
  var opt = function(k){
    var g = DKH_MG[k];
    return '<button type="button" class="dkh-mgo ' + k + (keys >= g.key ? '' : ' short') + '" data-act="' + k + '">'
      + '<i class="dkh-chest ' + k + '" aria-hidden="true"></i><b>' + g.nm + '</b>'
      + '<span class="dkh-mgk">' + dkhIcon('key') + '<b>' + g.key + '個</b></span></button>';
  };
  return modal('<div class="modal dkh-modal dkh-mg"><div class="dkh-mhd"><b>マイレージガチャ</b></div>'
    + '<p class="dkh-mgnote">マイレージが' + DKH_MILE + 'ポイントごとにゴールドキー1個獲得！'
    +   '<span>いま ' + mile + '/' + DKH_MILE + '・ゴールドキー <b>' + keys + '</b>個</span></p>'
    + '<div class="dkh-mgos">' + opt('n') + opt('j') + '</div>'
    + '<div class="dkh-mbtns"><button class="dkbtn dkh-wood" data-act="x">閉じる</button></div></div>')
  .then(function(a){ if(a === 'n' || a === 'j') dkhMileOpen(a); return a; });
}
/* 「箱を選んでください！」：結果は押した時に決まっている。残りの2箱も同じ抽選表から実際に引いた中身を見せる */
function dkhMileOpen(kind){
  var g = DKH_MG[kind];
  if(!g) return null;
  if((SV.keys | 0) < g.key){
    try{ if(SFX.warn) SFX.warn(); }catch(e){}
    dkhSay('L', dkhIcon('key'), 'ゴールドキーが足りません', 'マイレージを' + DKH_MILE + '貯めるとゴールドキーが1個もらえます', 2400);
    return null;
  }
  SV.keys = (SV.keys | 0) - g.key;
  var got = dkhMgDraw(kind), rest = [dkhMgDraw(kind), dkhMgDraw(kind)];
  dkhMgGive(got);
  saveNow();
  var box = function(i){
    return '<button type="button" class="dkh-box ' + kind + '" data-i="' + i + '" aria-label="箱' + (i + 1) + '">'
      + '<i class="dkh-chest ' + kind + '" aria-hidden="true"></i><span class="dkh-bin"></span></button>';
  };
  var p = modal('<div class="modal dkh-modal dkh-mg dkh-mgpick"><div class="dkh-mhd"><b>' + g.nm + '</b></div>'
    + '<p class="dkh-mgq">箱を選んでください！</p><div class="dkh-boxes">' + box(0) + box(1) + box(2) + '</div>'
    + '<div class="dkh-mbtns"><button class="dkbtn gd" data-act="ok" hidden>確認</button></div></div>');
  var body = document.getElementById('modalBody'), picked = false;
  body.querySelectorAll('.dkh-box').forEach(function(b){
    b.onclick = function(){
      if(picked) return;
      picked = true;
      var j = +b.getAttribute('data-i'), k = 0;
      body.querySelectorAll('.dkh-box').forEach(function(x, i){
        var o = (i === j) ? got : rest[k++];
        var fin = function(){
          var s = x.querySelector('.dkh-bin'); if(s) s.innerHTML = dkhMgIn(o);
          x.classList.add('open'); if(i !== j) x.classList.add('dim');
        };
        if(i !== j){ setTimeout(fin, 520); return; }
        fin();
        try{ fxRays(x, { tone:'gold' }); fxBurst(x, { kind:'star', n:22, power:1.1 }); SFX.coin(); }catch(e){}
      });
      var hd = body.querySelector('.dkh-mgq'); if(hd) hd.textContent = 'おめでとうございます！';
      var ok = body.querySelector('[data-act="ok"]'); if(ok) setTimeout(function(){ ok.hidden = false; }, 620);
    };
  });
  p.then(function(){ if(document.querySelector('#home.on')) showHome(); });
  return got;
}

/* ══════════ 名札の枠（G22。能力は付かない飾り。SV.frames={own,eq}） ══════════ */
function dkhFramePick(){
  try{ SFX.click(); }catch(e){}
  var eq = dkhFrEq(), nm = esc(SV.name || 'あなた');
  var opts = [{ id:'', nm:'なし' }].concat(DKH_FRAMES).map(function(f){
    var own = !f.id || dkhFrOwn(f.id);
    return '<button type="button" class="dkh-fro' + (f.id ? ' fr-' + f.id : '') + (f.id === eq ? ' on' : '') + '"'
      + (own ? ' data-act="f:' + f.id + '"' : ' disabled') + '>'
      + '<span class="dkh-frs">' + nm + '</span><b>' + (own ? '' : '🔒 ') + esc(f.nm) + '</b></button>';
  }).join('');
  return modal('<div class="modal dkh-modal dkh-frm"><div class="dkh-mhd"><b>名札の枠</b></div>'
    + '<p class="dkh-hnote">能力は変わりません。ホームの名札と対戦中の肖像に出ます。<br>銅・銀・金の枠は限定ミッションとアルバムで手に入ります。</p>'
    + '<div class="dkh-fros">' + opts + '</div>'
    + '<div class="dkh-mbtns"><button class="dkbtn dkh-wood" data-act="x">閉じる</button></div></div>')
  .then(function(a){
    if(typeof a !== 'string' || a.indexOf('f:') !== 0) return a;
    if(!SV.frames || typeof SV.frames !== 'object') SV.frames = { own:[], eq:'' };
    SV.frames.eq = a.slice(2);
    saveNow();
    if(document.querySelector('#home.on')) showHome();
    return a;
  });
}

/* ══════════ 等級が上がった時だけ、メダルが入れ替わる演出（G16） ══════════ */
function dkhTierUpFx(){
  var u = SV.tierUp;
  if(!u || !document.querySelector('#home.on') || document.querySelector('#modalWrap.on')) return;
  SV.tierUp = null; saveNow();
  var a = null, b = null;
  DKH_TIERS.forEach(function(x){ if(x.id === u.from) a = x; if(x.id === u.to) b = x; });
  if(!a || !b) return;
  modal('<div class="modal dkh-modal dkh-up"><div class="dkh-mhd"><b>昇格！</b></div>'
    + '<div class="dkh-upst"><span class="dkh-upa">' + dkhEmblem(a) + '</span><i class="dkh-uparr" aria-hidden="true"></i>'
    +   '<span class="dkh-upb">' + dkhEmblem(b) + '</span></div>'
    + '<b class="dkh-upnm">' + a.nm + ' → ' + b.nm + '</b>'
    + '<span class="dkh-upsub">シーズンの報酬が ' + dkhNum(b.rw.g) + 'G' + (b.rw.d ? '・ダイヤ' + b.rw.d : '') + ' に上がりました</span>'
    + '<div class="dkh-mbtns"><button class="dkbtn gd" data-act="ok">確認</button></div></div>');
  try{
    var st = document.querySelector('#modalBody .dkh-upst'), nb = document.querySelector('#modalBody .dkh-upb');
    if(st) fxRays(st, { tone:'gold' });
    setTimeout(function(){ if(nb) fxBurst(nb, { kind:'star', n:24, power:1.1 }); try{ SFX.gachaRare(); }catch(e){} }, 380);
  }catch(e){}
}

/* ══════════════════════════════════════════════════════════════
   イベント（今週のイベント／お知らせ／ガイド）
   ══════════════════════════════════════════════════════════════ */
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
    +   '<span class="dkh-rar">' + esc(RAR[c.rar] ? RAR[c.rar].nm : c.rar) + '</span></div>'
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
    +   '<em>毎週 月曜 朝5時に切り替わります</em></div></div>'
    + '<div class="dkh-wkrow">'
    +   '<div class="dkh-feats">'
    +     dkhFeatCard(f, '今週の注目', 'ガチャで出やすさ ×2', 'now')
    +     dkhFeatCard(f2, '来週の注目', dkhMD(nt) + ' から ×2', 'next')
    +     '<button type="button" class="dkbtn gd dkh-togacha fx-primary" data-dkgo="gacha" data-fx="pop">ガチャを引く</button>'
    +   '</div>'
    +   '<div class="dkh-sched fx-panel" data-fx="riseR"><b class="dkh-schd">イベントの予定</b>' + sched + '</div>'
    + '</div>';
}
function dkhNewsInfo(){
  var n = dkhMailCount(), t = dkhTier(SV.rp | 0);
  var items = [
    { ic:'trophy', nm:'友だちランキング・全体ランキング',
      ds:'友だちランキングは毎週 月曜 朝5時に締めます。全体ランキングは月ごとのシーズンで、いまは ' + t.dn + '（' + dkhNum(SV.rp) + ' RP）。報酬はプレゼントボックスに届きます。',
      go:'home', bt:'ホームへ' },
    { ic:'key', nm:'マイレージガチャ',
      ds:'対戦1回でマイレージが1たまり、' + DKH_MILE + 'でゴールドキーが1個。ノーマルガチャはキー1個、大当たりガチャはキー5個で回せます。',
      go:'home', bt:'ホームへ' },
    { ic:'mail', nm:'プレゼントボックス' + (n ? '（' + n + '件）' : ''),
      ds:'報酬やおわびはプレゼントボックスに届きます。保管期限は30日間なので、早めに受け取ってください。',
      go:'mail', bt:'ひらく' },
    { ic:'globe', nm:'オンライン対戦',
      ds:'4文字の あいことば を伝えるだけで、はなれた友だちと同じ盤で遊べます。遊んだ相手は「ゲーム友だち」に並びます。',
      go:'friends', bt:'友達' },
    { ic:'horn', nm:'週替わりイベント',
      ds:'毎週 月曜 朝5時に、盤のルールが少し変わるイベントと、注目カードが切り替わります。',
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
  return '<div class="dkh-tips dkh-parch" data-fx="rise"><div class="dkh-tiphd"><b>ゲームガイド</b></div><ol class="dkh-tipl">'
    + list.map(function(t, i){ return '<li><i>' + (i + 1) + '</i><span>' + esc(t) + '</span></li>'; }).join('')
    + '</ol></div>';
}
function showNews(tab){
  if(typeof tab === 'string' && /^(week|info|tips)$/.test(tab)) DKH_newsTab = tab;
  var T = DKH_newsTab;
  var tabs = DKH_NTABS.map(function(t){ return { id:t.id, ic:dkhIcon(t.ic), nm:t.nm }; });
  var body = (T === 'info') ? dkhNewsInfo() : (T === 'tips') ? dkhNewsTips() : dkhNewsWeek();
  var el = dkhAmb(dkMake('news', 'quest', dkHead('news', { title:'イベント' }) + dkTabs(tabs, T)
    + '<div class="dkh-nbody" data-tab="' + T + '">' + body + '</div>'));
  el.classList.add('dkh-news');
  dkWire(el, function(id){ showNews(id); });
  el.querySelectorAll('[data-dkh-ntab]').forEach(function(b){
    b.onclick = function(){ try{ SFX.click(); }catch(e){} showNews(b.getAttribute('data-dkh-ntab')); };
  });
  screenTo('news');
  if(T === 'week'){
    dkEvery('dkh-week', function(){
      var e = document.getElementById('dkhWeekLeft');
      if(e && e.isConnected) e.textContent = dkhWeekLeftTxt();
    }, 1000);
  } else { dkEvery('dkh-week', null); }
  return el;
}

/* ══════════════════════════════════════════════════════════════
   プレゼントボックス（受け取る／すべて受け取る・保管期限30日）
   ══════════════════════════════════════════════════════════════ */
function dkhMailRow(m){
  var now = Date.now(), days = Math.max(0, Math.ceil(((m.exp || 0) - now) / 86400000));
  var nm = (m.item && m.item.kind) ? dkhItemNm(m.item) : '';
  return '<div class="dkh-mrow' + (days <= 3 ? ' soon' : '') + '" data-fx="riseR">'
    + '<i class="dkh-mic">' + esc(m.ic || '✉️') + '</i>'
    + '<div class="dkh-mmid"><b class="dkh-mnm">' + esc(m.nm || 'おしらせ') + '</b>'
    +   '<span class="dkh-mdate">ダイスキングダム運営・' + dkhMD(m.at || now) + ' に届きました・<em>のこり ' + days + '日</em></span></div>'
    + '<div class="dkh-mrw">'
    +   ((m.g | 0) ? '<span class="dkh-chip g"><i class="dkh-coin"></i>' + dkhNum(m.g) + '</span>' : '')
    +   ((m.d | 0) ? '<span class="dkh-chip d"><i class="dkh-gem"></i>' + dkhNum(m.d) + '</span>' : '')
    +   (nm ? '<span class="dkh-chip it">' + esc(nm) + '</span>' : '') + '</div>'
    + '<button type="button" class="dkbtn gr dkh-take" data-dkh-take="' + esc(m.id) + '">受け取る</button></div>';
}
function showMail(){
  dkhSeasonCheck(); dkhWeekCheck();
  var list = dkhMailList().slice();
  var sg = 0, sd = 0, ni = 0, soon = 0, now = Date.now();
  list.forEach(function(m){ sg += m.g | 0; sd += m.d | 0; if(m.item && m.item.kind) ni++; if((m.exp || 0) - now <= 3 * 86400000) soon++; });
  var rows = list.map(dkhMailRow).join('');
  var el = dkhAmb(dkMake('mail', 'quest', dkHead('mail', { title:'プレゼントボックス' })
    + '<div class="dkh-mb">'
    +   '<div class="dkh-mlist dkh-parch" data-fx="rise"><div class="dkh-lhd"><b>プレゼント</b><span>' + list.length + '件</span>'
    +     '<em class="dkh-mwarn">プレゼントの保管期限は30日間です</em></div>'
    +     '<div class="dkh-mrows" data-fx-step="40">' + (rows || ('<div class="dkh-empty"><i class="dkh-emptyic">' + dkhIcon('mail') + '</i>'
    +       '<b>プレゼントは届いていません</b><span>ランキングの報酬や、対戦で獲得したアイテムはここに届きます</span></div>')) + '</div></div>'
    +   '<div class="dkh-mside fx-panel" data-fx="riseR"><i class="dkh-msic">' + dkhIcon('mail') + '</i>'
    +     '<b class="dkh-mst">受け取れる報酬</b>'
    +     '<div class="dkh-msum"><span><i class="dkh-coin"></i><b>' + dkhNum(sg) + '</b></span>'
    +       '<span><i class="dkh-gem"></i><b>' + dkhNum(sd) + '</b></span>'
    +       (ni ? '<span class="dkh-msit">アイテム ' + ni + '個</span>' : '') + '</div>'
    +     (soon ? '<span class="dkh-msoon">もうすぐ期限が切れるプレゼント ' + soon + '件</span>' : '')
    +     '<button type="button" class="dkbtn gd dkh-all fx-primary" id="dkhAll"' + (list.length ? '' : ' disabled') + '>すべて受け取る</button>'
    +     '<p class="dkh-mnote">獲得したアイテムはここから受け取れます</p></div>'
    + '</div>'));
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
  var got = dkhTakeMail(m);
  if(got.kept){
    dkhSay('R', '<i class="dkh-tic">🎁</i>', 'まだ受け取れません', 'このプレゼントは、あとで受け取れます', 2000);
    return got;
  }
  if(btn){ btn._busy = 1; btn.disabled = true; }
  var row = btn ? btn.closest('.dkh-mrow') : null;
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
  var g = 0, d = 0, items = [], kept = 0;
  list.forEach(function(m){ var r = dkhTakeMail(m); if(r.kept){ kept++; return; } g += r.g; d += r.d; if(r.item) items.push(r.item); });
  saveNow();
  document.querySelectorAll('#mail .dkh-mrow').forEach(function(r, i){
    setTimeout(function(){ r.classList.add('fx-claim', 'dkh-taken'); }, i * 60);
  });
  try{ if(SFX.coinBurst) SFX.coinBurst(); else SFX.coin(); }catch(e){}
  dkhSay('R', '<i class="dkh-tic">🎁</i>', 'まとめて受け取りました',
    [g ? dkhNum(g) + ' ゴールド' : '', d ? 'ダイヤ ' + d : '', items.length ? 'アイテム ' + items.length + '個' : '',
     kept ? 'あとで受け取れる物 ' + kept + '件' : ''].filter(Boolean).join('・'), 2200);
  dkhClaimFx(document.querySelector('#mail .dkh-mrows') || btn, g, d).then(function(){
    if(document.querySelector('#mail.on')) showMail();
  });
  return { g:g, d:d, items:items, kept:kept };
}

/* ══════════════════════════════════════════════════════════════
   友達（オンラインで遊んだゲーム友だちの一覧）
   ══════════════════════════════════════════════════════════════ */
function showFriends(){
  var fr = (SV.friends || []).slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
  var ok = dkhOnlineOK();
  var rows = fr.map(function(f){
    return '<div class="dkh-frrow" data-fx="riseR">'
      + (f.card ? dkhFace(f.card) : '<span class="dkh-face dkh-noface">' + dkhIcon('duo') + '</span>')
      + '<div class="dkh-frmid"><b>' + esc(f.name) + '</b><span>いっしょに遊んだ回数 ' + (f.n | 0) + '回</span></div>'
      + '<div class="dkh-frlast"><span>最後に遊んだ日</span><b>' + (f.at ? dkhMD(f.at) : '—') + '</b></div>'
      + (typeof f.rp === 'number' ? '<b class="dkh-rpv"><i class="dkh-cup" aria-hidden="true"></i>' + dkhNum(f.rp) + '</b>' : '')
      + '</div>';
  }).join('');
  var el = dkhAmb(dkMake('friends', 'home', dkHead('friends', { title:'友達' })
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
    + '</div>'));
  el.classList.add('dkh-friends');
  dkWire(el);
  screenTo('friends');
  return el;
}

/* ══════════════════════════════════════════════════════════════
   設定（音楽・効果音・アニメの速さ・キャラの絵柄・演出・時間切れで自動・タイトルへ）
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
  var tt = (SV.rules && SV.rules.turnTimer) ? '1' : '0';
  var p = modal('<div class="modal dkh-modal dkh-set"><div class="dkh-mhd"><b>設定</b></div><div class="dkh-srows">'
    + dkhSetRow('音楽', '<input type="range" class="dkh-range" id="dkhBgm" min="0" max="100" value="' + bv + '" aria-label="音楽の大きさ"><b class="dkh-rv" id="dkhBgmV">' + bv + '</b>')
    + dkhSetRow('効果音', '<input type="range" class="dkh-range" id="dkhSfx" min="0" max="100" value="' + sv + '" aria-label="効果音の大きさ"><b class="dkh-rv" id="dkhSfxV">' + sv + '</b>')
    + dkhSetRow('アニメの速さ', dkhSeg('speed', DKH_SPEEDS, cfg.speed))
    + dkhSetRow('キャラの絵柄', dkhSeg('art', DKH_ARTS, (typeof ART_STYLE === 'string') ? ART_STYLE : 'human'))
    + dkhSetRow('演出', dkhSeg('fx', [{ v:'std', nm:'標準' }, { v:'lite', nm:'控えめ' }], DKFX.lite ? 'lite' : 'std'))
    + dkhSetRow('時間切れで自動', dkhSeg('tt', [{ v:'0', nm:'オフ' }, { v:'1', nm:'オン' }], tt)
      + '<span class="dkh-shint">手番の時間が切れたら自動で進めます</span>')
    + '</div><div class="dkh-mbtns"><button class="dkbtn dkh-wood" data-act="title">タイトルへ</button>'
    + '<button class="dkbtn gd" data-act="ok">閉じる</button></div></div>');
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
          else if(key === 'tt'){
            if(!SV.rules || typeof SV.rules !== 'object') SV.rules = {};
            SV.rules.turnTimer = (v === '1');
            saveNow();
          }
          try{ SFX.click(); }catch(e){}
        };
      });
    });
    requestAnimationFrame(function(){ body.querySelectorAll('[data-dkh-seg]').forEach(dkhSegThumb); });
  }catch(e){ console.error('[WP16b]', e); }
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
    /* 週替わりイベントの中身（C28：WEEKLY の持ち主）。ダイス増量は奇数・偶数を直接ふやさず g.ev={dice:1} だけ
       （+1 は WP12 の dkInitPlayers が thisWeek().id==='dice' を見て足す）。説明文は本家の言葉に */
    if(typeof WEEKLY !== 'undefined' && Array.isArray(WEEKLY)){
      var ds = { luck:'フォーチュンカードで良い効果が出やすい週', mini:'ボーナスゲームの倍率が最初から×4の週',
                 dice:'奇数・偶数アイテムが1回ずつ増える週' };
      WEEKLY.forEach(function(w){
        if(ds[w.id]) w.ds = ds[w.id];
        if(w.id === 'dice') w.apply = function(g){ g.ev = { dice:1 }; };
      });
    }
    /* mkScreen を包む（'online' と 'olroom' の時だけ手を加える） */
    if(typeof mkScreen === 'function' && !DKH_mk0){
      DKH_mk0 = mkScreen;
      mkScreen = function(id){
        var el = DKH_mk0.apply(this, arguments);
        if(id === 'online' || id === 'olroom'){ try{ dkhOnlineSkin(el, id); }catch(e){ console.error('[WP16b]', e); } }
        return el;
      };
    }
    dkOn('match:end', dkhOnMatchEnd);
    dkOn('rp:guard', dkhOnRpGuard);
    dkOn('week:roll', dkhOnWeekRoll);
    dkOn('screen', dkhOnScreen);
    /* トーストに「出た時刻」を付ける（画面が変わった時の片付けに使う） */
    var mo = new MutationObserver(function(recs){
      var now = Date.now();
      recs.forEach(function(r){ r.addedNodes.forEach(function(n){ if(n.nodeType === 1 && !n._dkhAt) n._dkhAt = now; }); });
    });
    ['toastL', 'toastR'].forEach(function(id){ var b = document.getElementById(id); if(b) mo.observe(b, { childList:true }); });
    /* タイトルの「オンラインで遊ぶ」：読み込み時と3秒後 */
    dkhTitleOnline();
    setTimeout(function(){ try{ dkhTitleOnline(); }catch(e){ console.error('[WP16b]', e); } }, 3000);
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dkhTitleOnline);
    /* シーズン・週の切り替え（前の月・前の週の報酬はプレゼントボックスへ） */
    dkhSeasonCheck();
    dkhWeekCheck();
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
  }catch(e){ console.error('[WP16b]', e); }
})();
