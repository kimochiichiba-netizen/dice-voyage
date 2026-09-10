
/* ══════════════════════════════════════════════════════════════
   BGM：音楽ファイルがあればそれを鳴らし、無ければ合成音に落ちる
   ファイルの置き場所: assets/bgm/lobby.mp3 / game.mp3 / tense.mp3 / win.mp3
   （ビルド時に window.DV_BGM へ URL か data URI が入る）
   ══════════════════════════════════════════════════════════════ */
function dvMusicFiles(ac, srcMap){
  const src = srcMap || {};
  const names = ['lobby','game','tense','win','room','gacha','boss','result'];
  if(!names.some(n => src[n])) return null;          // 1曲も無ければ使わない

  const el = {}, node = {}, gain = {};
  let master = null, cur = null, vol = 0.55, dead = false;

  try{
    master = ac.createGain();
    master.gain.value = vol;
    master.connect(ac.destination);
  }catch(e){ return null; }

  function ensure(n){
    if(el[n] || !src[n]) return el[n] || null;
    try{
      const a = new Audio();
      a.src = src[n];
      a.loop = true;
      a.preload = 'auto';
      const g = ac.createGain();
      g.gain.value = 0;
      const mn = ac.createMediaElementSource(a);
      mn.connect(g); g.connect(master);
      el[n] = a; node[n] = mn; gain[n] = g;
      return a;
    }catch(e){ return null; }
  }
  function ramp(n, to, sec){
    const g = gain[n]; if(!g) return;
    const t = ac.currentTime;
    try{
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.linearRampToValueAtTime(to, t + sec);
    }catch(e){ g.gain.value = to; }
  }
  return {
    play(n){
      if(dead || !src[n]) return;
      if(cur === n) return;
      if(ac.state === 'suspended'){ try{ ac.resume(); }catch(e){} }
      if(cur && el[cur]){
        const prev = cur;
        ramp(prev, 0.0001, 0.6);
        setTimeout(()=>{ try{ if(cur !== prev) el[prev].pause(); }catch(e){} }, 700);
      }
      const a = ensure(n);
      if(!a){ cur = null; return; }
      try{ a.currentTime = 0; const p = a.play(); if(p && p.catch) p.catch(()=>{}); }catch(e){}
      ramp(n, 1, 0.6);
      cur = n;
    },
    stop(fade){
      const f = (fade === undefined) ? 0.6 : fade;
      names.forEach(n=>{
        if(!el[n]) return;
        ramp(n, 0.0001, Math.max(0.01, f));
        setTimeout(()=>{ try{ el[n].pause(); }catch(e){} }, f*1000 + 60);
      });
      cur = null;
    },
    setVolume(v){
      vol = Math.max(0, Math.min(1, v));
      try{ master.gain.setTargetAtTime(vol, ac.currentTime, 0.05); }
      catch(e){ master.gain.value = vol; }
    },
    /* ジングルの間だけ下げる（dvJingle が呼ぶ。合成音版 dvMusic2 と同じ形）*/
    duck(amt, sec){
      const a = Math.max(0.02, Math.min(1, amt || 1)), hold = Math.max(0, sec || 0);
      const now = ac.currentTime, g = master.gain;
      try{
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(vol*a, now + 0.06);
        g.setValueAtTime(vol*a, now + 0.06 + hold);
        g.linearRampToValueAtTime(vol, now + 0.06 + hold + 0.35);
      }catch(e){ g.value = vol; }
    },
    get volume(){ return vol; },
    get current(){ return cur; }
  };
}
