
/* ══════════════════════════════════════════════════════════════
   絵柄の切り替え
   「アニメ風のキャラ」と「宝石の守護獣」の2つを持ち、設定で選べるようにする。
   どちらの描画関数も読み込まれているので、切り替えは即座に反映される。
   ══════════════════════════════════════════════════════════════ */
/* 既定は人物のアニメ立ち絵（dvAnime）。社長の指定は「かわいい女性・いい男性」なので、
   宝石の守護獣は「別の絵柄」として残すだけにする。 */
/* 既定は人物の立ち絵。画像を assets/chars/ に置けばそちらが優先される */
let ART_STYLE = 'human';
try{ const _a = localStorage.getItem('dv_art'); if(_a==='anime'||_a==='gem'||_a==='human') ART_STYLE = _a; }catch(e){}
function setArtStyle(v){
  ART_STYLE = (v==='anime') ? 'anime' : (v==='gem') ? 'gem' : 'human';
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
/* ══════════════════════════════════════════════════════════════
   キャラ画像の差しかえ（assets/chars/）
   ・ビルドが window.DV_CHARIMG に {"c01":"...","t01":"...", ...} を入れる
     - index.html は "assets/chars/c01.png" のような相対パス
     - game.html（Artifact）は data URI（外部ファイルを読めないため）
   ・画像が無いカードは、これまでどおり手続き描画のまま
   ・読み込みが終わるまでも手続き描画を出すので、絵が消える瞬間は無い
   ══════════════════════════════════════════════════════════════ */
const _DV_IMG = Object.create(null);
function _dvImgSrc(key){
  try{
    const g = (typeof globalThis!=='undefined') ? globalThis : window;
    const m = g && g.DV_CHARIMG;
    return (m && typeof m[key] === 'string' && m[key]) ? m[key] : '';
  }catch(e){ return ''; }
}
/* 読み込み済みで実際に絵がある時だけ Image を返す。それ以外は null（＝手続き描画） */
function _dvImg(key){
  if(!key) return null;
  let rec = _DV_IMG[key];
  if(rec === undefined){
    const src = _dvImgSrc(key);
    if(!src || typeof Image === 'undefined'){ _DV_IMG[key] = null; return null; }
    rec = { im:null, ok:false, bad:false };
    try{
      const im = new Image();
      rec.im = im;
      im.onload  = function(){
        if(im.naturalWidth > 0 && im.naturalHeight > 0) rec.ok = true; else rec.bad = true;
        try{ refreshArt(); }catch(e){}
      };
      im.onerror = function(){ rec.bad = true; };
      im.src = src;
    }catch(e){ rec.bad = true; }
    _DV_IMG[key] = rec;
  }
  if(!rec || rec.bad || !rec.ok) return null;
  return rec.im;
}
/* カードIDから画像の名前を作る。立ち絵は c01、盤のコマは t01 */
function _dvKeyPort(cardId){
  const v = (typeof cardId === 'string') ? cardId : '';
  return /^c\d\d+$/.test(v) ? v : '';
}
function _dvKeyTok(cardId){
  const v = _dvKeyPort(cardId);
  return v ? ('t' + v.slice(1)) : '';
}
/* 箱いっぱいに、縦横比を保って中央でトリミングして描く（CSSの object-fit: cover と同じ） */
function _dvCover(ctx, im, bx, by, bw, bh){
  const iw = im.naturalWidth, ih = im.naturalHeight;
  if(!iw || !ih) return false;
  const s = Math.max(bw/iw, bh/ih);
  const dw = iw*s, dh = ih*s;
  ctx.save();
  ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  try{ ctx.drawImage(im, bx + (bw-dw)/2, by + (bh-dh)/2, dw, dh); }
  catch(e){ ctx.restore(); return false; }
  ctx.restore();
  return true;
}
/* 縦横比を保って箱に収める（はみ出さない）。コマ用 */
function _dvContain(ctx, im, bx, by, bw, bh){
  const iw = im.naturalWidth, ih = im.naturalHeight;
  if(!iw || !ih) return false;
  const s = Math.min(bw/iw, bh/ih);
  const dw = iw*s, dh = ih*s;
  try{ ctx.drawImage(im, bx + (bw-dw)/2, by + (bh-dh), dw, dh); }
  catch(e){ return false; }
  return true;
}
/* 盤のコマの描画枠：接地点が原点（0,0）で、上へ TOK_H px */
const TOK_W = 104, TOK_H = 92;

/* カードID（c01…c11）から人物の番号（0…10）を出す。無ければ art の番号を使う */
function _dvHuman(cardId, fallback){
  const m = /^c(d+)$/.exec(String(cardId||''));
  if(m){ const k = parseInt(m[1],10) - 1; if(k >= 0) return k % 11; }
  return ((fallback|0) % 11 + 11) % 11;
}
/* 肖像：240x340 の箱に描く（左上原点） */

/* ── 絵が無いときの控え（軽い手描き） ──────────────────
   手描きキャラの部品を読み込まない構成でも、真っ白にならないようにする。
   カードの色で塗って、名前の頭文字を置くだけ。処理は一瞬で終わる。 */
function _dvCardOf(cardId){
  try{ return (typeof cardById === 'function') ? cardById(cardId) : null; }catch(e){ return null; }
}
function _dvPlain(ctx, w, h, col, ch){
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, _dkMix(col, '#ffffff', 0.42));
  g.addColorStop(0.55, col);
  g.addColorStop(1, _dkMix(col, '#000000', 0.45));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.16; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.34, w * 0.34, h * 0.26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if(ch){
    ctx.save();
    ctx.font = '900 ' + Math.round(h * 0.42) + 'px system-ui,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, h * 0.035); ctx.strokeStyle = 'rgba(20,12,4,.72)';
    ctx.strokeText(ch, w * 0.5, h * 0.52);
    ctx.fillStyle = 'rgba(255,246,222,.94)';
    ctx.fillText(ch, w * 0.5, h * 0.52);
    ctx.restore();
  }
}
function _dkMix(a, b, t){
  const p = (x) => [parseInt(x.slice(1,3),16), parseInt(x.slice(3,5),16), parseInt(x.slice(5,7),16)];
  try{
    const A = p(a), B = p(b);
    const h = (n) => ('0' + Math.round(n).toString(16)).slice(-2);
    return '#' + h(A[0]+(B[0]-A[0])*t) + h(A[1]+(B[1]-A[1])*t) + h(A[2]+(B[2]-A[2])*t);
  }catch(e){ return a; }
}
/* 盤の駒の控え：色つきのカプセル */
function _dvPawn(ctx, col){
  ctx.save();
  ctx.translate(0, -34);
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0, 36, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(0, -34, 0, 34);
  g.addColorStop(0, _dkMix(col, '#ffffff', 0.5));
  g.addColorStop(0.5, col);
  g.addColorStop(1, _dkMix(col, '#000000', 0.4));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-13, 30); ctx.quadraticCurveTo(-15, -10, 0, -34);
  ctx.quadraticCurveTo(15, -10, 13, 30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(24,14,4,.6)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.34)';
  ctx.beginPath(); ctx.ellipse(-4, -14, 4.5, 8, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function dvPort(id, ctx, T, cardId){
  _dvSets();
  const i = ((id|0)%8+8)%8;
  const pim = _dvImg(_dvKeyPort(cardId));
  if(pim && _dvCover(ctx, pim, 0, 0, 240, 340)) return;
  if(ART_STYLE === 'human'){
    const h = _dvFn('dvOpm');
    if(h){ try{ h(ctx, _dvHuman(cardId, i), T||0); return; }catch(e){} }
  }
  if(ART_STYLE === 'anime'){
    const a = _dvFn('dvAnime');
    if(a){ try{ a(ctx, i, T||0); return; }catch(e){} }
  }
  const set = (ART_STYLE==='gem' && _PORT_GEM) ? _PORT_GEM : (_PORT_ANIME || _PORT_GEM);
  if(!set){
    const c = _dvCardOf(cardId);
    _dvPlain(ctx, 240, 340, (c && c.col) || '#7A6BB8', c && c.nm ? c.nm.slice(0,1) : '');
    return;
  }
  try{ set[i](ctx, T||0); }catch(e){}
}
/* ── 盤のコマを「札」ではなく「立ち絵」にする ─────────────────
   t01…t24 の絵は白フチの肖像カードなので、そのまま置くと盤にカードが立って見える。
   外枠を切り落としたうえで、周りの下地を消して人物だけを抜く。
   ・まず縁から同じ色をたどって消す（下地の抜き）。人物の白い髪や服は縁とつながらないので残る。
   ・file:// で画素を読めない時は、楕円でぼかして角を消す（どちらでもカードの形は消える）。
   1枚だけ作って使い回すので、毎コマの重さは今までと同じ（drawImage 1回）。 */
const _DV_TOKCUT = Object.create(null);
function _dvTokKey(im, W, H){
  const iw = im.naturalWidth, ih = im.naturalHeight;
  const mx = iw * 0.075, my = ih * 0.075, sw = iw - mx * 2, sh = ih - my * 2;
  const s = Math.min(W / sw, H / sh), dw = sw * s, dh = sh * s;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, mx, my, sw, sh, (W - dw) / 2, H - dh, dw, dh);
  return { cv: cv, g: g };
}
/* 縁から同じ色をたどって透明にする（下地の抜き） */
function _dvTokKeyOut(g, W, H){
  const im = g.getImageData(0, 0, W, H), d = im.data;
  const at = (x, y) => (y * W + x) * 4;
  let br = 0, bg = 0, bb = 0, n = 0;
  const corners = [[0,0],[W-1,0],[0,H-1],[W-1,H-1],[(W>>1),0],[0,(H>>1)]];
  for(const c of corners){ const k = at(c[0], c[1]); if(d[k+3] < 8) continue; br += d[k]; bg += d[k+1]; bb += d[k+2]; n++; }
  if(!n) return false;
  br /= n; bg /= n; bb /= n;
  const tol = 40, seen = new Uint8Array(W * H), st = [];
  const push = (x, y) => {
    if(x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x; if(seen[p]) return;
    const k = p * 4;
    if(d[k+3] > 8 && (Math.abs(d[k]-br) > tol || Math.abs(d[k+1]-bg) > tol || Math.abs(d[k+2]-bb) > tol)) return;
    seen[p] = 1; st.push(p);
  };
  for(let x = 0; x < W; x++){ push(x, 0); push(x, H - 1); }
  for(let y = 0; y < H; y++){ push(0, y); push(W - 1, y); }
  let cut = 0;
  while(st.length){
    const p = st.pop(), x = p % W, y = (p / W) | 0;
    d[p * 4 + 3] = 0; cut++;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  if(cut < W * H * 0.12) return false;      // ほとんど消えないなら抜けていない
  g.putImageData(im, 0, 0);
  return true;
}
/* 画素を読めない時の控え：楕円でぼかして角（＝カードの形）を消す */
function _dvTokFeather(g, W, H){
  g.globalCompositeOperation = 'destination-in';
  g.save();
  g.translate(W * 0.5, H * 0.46);
  g.scale(1, (H * 0.56) / (W * 0.50));
  const rg = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.50);
  rg.addColorStop(0,    'rgba(0,0,0,1)');
  rg.addColorStop(0.64, 'rgba(0,0,0,1)');
  rg.addColorStop(0.86, 'rgba(0,0,0,0.45)');
  rg.addColorStop(1,    'rgba(0,0,0,0)');
  g.fillStyle = rg;
  g.fillRect(-W * 2, -H * 2, W * 4, H * 4);
  g.restore();
  g.globalCompositeOperation = 'source-over';
}
function _dvTokCut(key, im){
  let c = _DV_TOKCUT[key];
  if(c !== undefined) return c;
  c = null;
  try{
    if(im.naturalWidth > 0 && im.naturalHeight > 0){
      const W = TOK_W * 2, H = TOK_H * 2, o = _dvTokKey(im, W, H);
      let ok = false;
      try{ ok = _dvTokKeyOut(o.g, W, H); }catch(e){ ok = false; }
      if(!ok) _dvTokFeather(o.g, W, H);
      c = o.cv;
    }
  }catch(e){ c = null; }
  _DV_TOKCUT[key] = c;
  return c;
}
/* 盤の駒：接地点原点・上へ約70px */
function dvChar(ctx, id, col, T, facing, cardId){
  _dvSets();
  const i = ((id|0)%8+8)%8;
  const tk = _dvKeyTok(cardId);
  const tim = _dvImg(tk);
  if(tim){
    const cut = _dvTokCut(tk, tim);
    ctx.save();
    /* 接地影（影が無いと絵のコマが盤から浮いた札に見える） */
    ctx.fillStyle = 'rgba(6,14,26,0.34)';
    ctx.beginPath(); ctx.ellipse(0, 0, 21, 6.5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(6,14,26,0.15)';
    ctx.beginPath(); ctx.ellipse(0, 0.8, 29, 9.5, 0, 0, 6.283); ctx.fill();
    if((facing|0) < 0) ctx.scale(-1, 1);
    let done = false;
    if(cut){ try{ ctx.drawImage(cut, -TOK_W / 2, -TOK_H, TOK_W, TOK_H); done = true; }catch(e){ done = false; } }
    if(!done) done = _dvContain(ctx, tim, -TOK_W/2, -TOK_H, TOK_W, TOK_H);
    ctx.restore();
    if(done) return;
  }
  if(ART_STYLE === 'human'){
    const h = _dvFn('dvOpmTok');
    if(h){ try{ h(ctx, _dvHuman(cardId, i), col, T||0, facing||1); return; }catch(e){} }
  }
  const set = (ART_STYLE==='gem' && _TOK_GEM) ? _TOK_GEM : (_TOK_ANIME || _TOK_GEM);
  if(!set){ _dvPawn(ctx, col || '#7A6BB8'); return; }
  try{ set[i](ctx, col, T||0, facing||1); }catch(e){}
}
/* 絵柄が変わったら、キャッシュしている盤と肖像を描き直させる */
function refreshArt(){
  try{ if(typeof boardChanged === 'function') boardChanged(); }catch(e){}
  try{ portAt = -1e9; }catch(e){}
}
