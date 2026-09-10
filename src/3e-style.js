
/* ══════════════════════════════════════════════════════════════
   絵柄の切り替え
   「アニメ風のキャラ」と「宝石の守護獣」の2つを持ち、設定で選べるようにする。
   どちらの描画関数も読み込まれているので、切り替えは即座に反映される。
   ══════════════════════════════════════════════════════════════ */
/* 既定は人物のアニメ立ち絵（dvAnime）。社長の指定は「かわいい女性・いい男性」なので、
   宝石の守護獣は「別の絵柄」として残すだけにする。 */
let ART_STYLE = 'gem';
try{ const _a = localStorage.getItem('dv_art'); if(_a==='anime' || _a==='gem') ART_STYLE = _a; }catch(e){}
function setArtStyle(v){
  ART_STYLE = (v==='anime') ? 'anime' : 'gem';
  try{ localStorage.setItem('dv_art', ART_STYLE); }catch(e){}
}
/* 関数名から実体を引く（未定義でも例外にならない） */
function _dvFn(n){
  try{ const g = (typeof globalThis!=='undefined') ? globalThis : window;
       return (g && typeof g[n]==='function') ? g[n] : null; }catch(e){ return null; }
}
function _dvSet(prefix){
  const out = [];
  for(let i=0;i<8;i++){ const f = _dvFn(prefix+i); if(!f) return null; out.push(f); }
  return out;
}
let _PORT_ANIME=null,_PORT_GEM=null,_TOK_ANIME=null,_TOK_GEM=null,_setsReady=false;
function _dvSets(){
  if(_setsReady) return;
  _PORT_ANIME = _dvSet('dvP'); _PORT_GEM = _dvSet('dvG');
  _TOK_ANIME  = _dvSet('dvT'); _TOK_GEM  = _dvSet('dvS');
  _setsReady = true;
}
/* 肖像：240x340 の箱に描く（左上原点） */
function dvPort(id, ctx, T){
  _dvSets();
  const i = ((id|0)%8+8)%8;
  if(ART_STYLE !== 'gem'){
    const a = _dvFn('dvAnime');
    if(a){ try{ a(ctx, i, T||0); return; }catch(e){} }
  }
  const set = (ART_STYLE==='gem' && _PORT_GEM) ? _PORT_GEM : (_PORT_ANIME || _PORT_GEM);
  if(!set) return;
  try{ set[i](ctx, T||0); }catch(e){}
}
/* 盤の駒：接地点原点・上へ約70px */
function dvChar(ctx, id, col, T, facing){
  _dvSets();
  const i = ((id|0)%8+8)%8;
  const set = (ART_STYLE==='gem' && _TOK_GEM) ? _TOK_GEM : (_TOK_ANIME || _TOK_GEM);
  if(!set) return;
  try{ set[i](ctx, col, T||0, facing||1); }catch(e){}
}
/* 絵柄が変わったら、キャッシュしている盤と肖像を描き直させる */
function refreshArt(){
  try{ if(typeof boardChanged === 'function') boardChanged(); }catch(e){}
  try{ portAt = -1e9; }catch(e){}
}
