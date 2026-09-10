/* ══════════════════════════════════════════════════════════════
   5-meta.js の showCards / drawCardGrid / drawCardDetail 差し替え版
   「내아이템」レイアウト（左レール＋中央大カード＋右3列グリッド）
   ・kr-item.css を 1c-meta.html の <style> 末尾に貼ってから使う
   ・既存の mkScreen / regPortrait / RAR / CARDPOOL / SV をそのまま使う
   ══════════════════════════════════════════════════════════════ */
let cardSel = null;

function showCards(){
  cardSel = cardSel && SV.cards[cardSel] ? cardSel : SV.equip;
  const el = mkScreen('cards', krItemHTML());
  el.classList.add('kr');                       // 背景を紫トークンに切り替える
  el.querySelector('#krBack').onclick = ()=>{ SFX.click(); showHome(); };
  el.querySelector('#krHome').onclick = ()=>{ SFX.click(); showHome(); };
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
  +     '<div class="b">売却</div><div class="b" id="krUp">強化</div><div class="b">合成</div>'
  +     '<div class="cnt"><em>'+own+'</em><span>/'+all+'</span></div>'
  +     '<div class="add">＋</div>'
  +   '</div>'
  + '</div></div>';
}

/* 右の3列グリッド（1枚 = 幅9.53% / 高さ21.6% / 横間隔0.81% / 縦間隔1.6%） */
function drawKrGrid(){
  const g = document.getElementById('krGrid'); g.innerHTML = '';
  CARDPOOL.forEach(c=>{
    const o = SV.cards[c.id];
    const d = document.createElement('div');
    d.className = 'kr-mini' + (o?'':' locked') + (cardSel===c.id?' on':'');
    d.innerHTML = '<canvas width="150" height="194"></canvas>'
      + '<div class="nb"><span>'+(o?esc(c.nm):'？？？')+'</span></div>'
      + '<span class="rr">'+RAR[c.rar].nm+'</span>'
      + '<span class="st">✹</span>'
      + (SV.equip===c.id?'<span class="eq">装備</span>':'');
    if(o) regPortrait(d.querySelector('canvas'), c.art, c.col);
    d.onclick = ()=>{ if(!o) return; SFX.click(); cardSel=c.id; drawKrGrid(); drawKrLeft(); drawKrCard(); };
    g.appendChild(d);
  });
}

/* 左レール（選択カード＋同レアの手持ちを束にして並べる） */
function drawKrLeft(){
  const c = cardById(cardSel); if(!c) return;
  document.getElementById('krLhd').innerHTML = '<em>'+RAR[c.rar].nm+'</em>'+esc(c.nm);
  const set   = document.getElementById('krSet');
  const other = document.getElementById('krOther');
  const same  = CARDPOOL.filter(x=>SV.cards[x.id] && x.rar===c.rar && x.id!==c.id).slice(0,2);
  const rest  = CARDPOOL.filter(x=>SV.cards[x.id] && x.rar!==c.rar).slice(0,4);
  set.innerHTML = thumb(c,true) + same.map(x=>thumb(x,false,true)).join('') + '<span class="kr-next"></span>';
  other.innerHTML = rest.map(x=>thumb(x,false)).join('');
  [set,other].forEach(box=>box.querySelectorAll('.kr-thumb').forEach(t=>{
    const id = t.dataset.id;
    regPortrait(t.querySelector('canvas'), cardById(id).art, cardById(id).col);
    t.onclick = ()=>{ SFX.click(); cardSel=id; drawKrGrid(); drawKrLeft(); drawKrCard(); };
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
  const c = cardById(cardSel), o = SV.cards[cardSel];
  const card = document.getElementById('krCard'), bar = document.getElementById('krBar');
  if(!c || !o){ card.innerHTML=''; bar.innerHTML=''; return; }
  card.innerHTML = '<span class="rank">'+RAR[c.rar].nm+'</span>'
    + '<div class="art"><canvas id="krPic" width="330" height="437"></canvas>'
    +   '<div class="nameband"><b>'+esc(c.nm)+'</b></div></div>'
    + '<div class="side">'
    +   '<b class="warn" title="'+esc(c.role)+'">▲</b>'
    +   '<b class="lock" title="ロック">🔒</b>'
    +   '<b class="gem"  title="'+esc(c.sk.nm)+'">💎</b>'
    + '</div>'
    + '<span class="kr-star">✹</span>';
  regPortrait(document.getElementById('krPic'), c.art, c.col);
  bar.innerHTML = '<div class="kr-drop"><span class="no">'+o.lv+'</span>'
    +   '<span class="nm">'+esc(c.nm)+'</span><span class="ar">▲</span></div>'
    + '<div class="kr-chip"><span class="ic" style="color:#F2D06A">S</span><b>合成状況</b></div>'
    + '<div class="kr-chip"><span class="ic">✹</span><b>成長状況</b></div>';
}
