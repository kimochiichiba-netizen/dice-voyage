/* ══════════════════════════════════════════════
   ダイスキングダム — 音と投擲（自動生成）
   ══════════════════════════════════════════════ */

/* ───── ae18c989d55e1d125 ───── */
/* dice-voyage / サイコロ投擲モーション（純計算・描画なし・乱数も時刻も使わない） */
var dvThrow = (function () {
  'use strict';

  var DV_TAU = Math.PI * 2;
  var DV_T_WIND = 180;                              // 溜め終わり
  var DV_T_FLY = 900;                               // 放物線終わり＝1回目の着地
  var DV_T_BOUNCE = 1350;                           // 跳ね終わり＝静止開始
  var DV_FLY_LEN = DV_T_FLY - DV_T_WIND;            // 720
  var DV_BOUNCE_LEN = DV_T_BOUNCE - DV_T_FLY;       // 450
  var DV_H1 = 0.38;                                 // 1回目の跳ねの高さ比
  var DV_H2 = 0.14;                                 // 2回目の跳ねの高さ比
  var DV_FRICTION = 6.0;                            // 跳ね中の回転減衰係数(1/s)
  var DV_FACE_STEP = 2.2;                           // 目が切り替わる回転量(rad)
  var DV_QUARTER = Math.PI / 2;                     // 静止角のスナップ単位

  function dv_clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function dv_lerp(a, b, t) { return a + (b - a) * t; }
  function dv_easeOut3(t) { var m = 1 - t; return 1 - m * m * m; }

  // 衝撃エンベロープ: 立ち上がり rise[ms] で 0→1、その後 tau[ms] で減衰。dt=0 で必ず 0（境界を飛ばさない）
  function dv_impulse(dt, rise, tau) {
    if (dt <= 0) return 0;
    if (dt < rise) return dt / rise;
    return Math.exp(-(dt - rise) / tau);
  }

  // 静止の揺り戻し: s=0 で 1、s=1 で 0、途中で1回だけ符号が反転（＝行き過ぎて戻る）
  function dv_settleEnv(s) {
    var m = 1 - s;
    return m * m * Math.cos(DV_TAU * 0.75 * s);
  }

  // seed から作る決定的な擬似乱数（mulberry32）
  function dv_rng(seed) {
    var n = (typeof seed === 'number' && isFinite(seed)) ? seed : 0;
    var s = (Math.imul(Math.round(n * 1000) | 0, 2654435761) ^ 0x9E3779B9) | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 1..6 の並びを seed でシャッフル（転がり中に見える目の順番）
  function dv_perm6(rnd) {
    var p = [1, 2, 3, 4, 5, 6], i, j, t;
    for (i = 5; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1));
      t = p[i]; p[i] = p[j]; p[j] = t;
    }
    return p;
  }

  function dv_face(die, rot) {
    var k = Math.floor(rot / DV_FACE_STEP) + die.faceOff;
    return die.perm[((k % 6) + 6) % 6];
  }

  return function dvThrow(seed, a, b) {
    var rnd = dv_rng(seed);
    var targets = [
      dv_clamp(Math.round(a) || 1, 1, 6),
      dv_clamp(Math.round(b) || 1, 1, 6)
    ];

    var dur = 1500 + Math.floor(rnd() * 401);       // 1500..1900ms
    var settleLen = dur - DV_T_BOUNCE;              // 150..550ms
    var dice = [];
    var i;

    for (i = 0; i < 2; i++) {
      var dir = (i === 0) ? -1 : 1;                 // 左右に散らす向き
      var H = 152 + rnd() * 44;                     // 放り上げ高さ
      var flyRev = 6 + rnd() * 3;                   // 飛行中 毎秒6〜9回転
      var wRev = 1.1 + rnd() * 0.6;                 // 溜め終わりの回転速度
      var shape = 0.94 + rnd() * 0.12;              // 放物線のピーク位置ずらし（位相差）
      var b1 = 268 + rnd() * 24;                    // 1回目の跳ねに使う時間
      var fx = dir * (40 + rnd() * 18);             // 最終着地X（左右に開く）
      var fy = 10 + rnd() * 16;                     // 最終着地Y
      var ix = dir * (9 + rnd() * 9);               // 1回目の着地X（まだ中央寄り＝ぶつかる位置）
      var iy = fy * 0.45 + rnd() * 6;
      var wx = -dir * (4 + rnd() * 5);              // 溜めで引く量（進行と逆向き）
      var wy = 13 + rnd() * 7;

      // --- 回転角の累積（各フェーズ境界で連続になるよう積分値を持ち回す） ---
      // 溜め: ω(u)=wRev*u [rev/s], 0.18秒 → 0.09*wRev 回転
      var rotW = DV_TAU * 0.09 * wRev;
      // 飛行: ω(u)=flyRev+(wRev-flyRev)*(1-u)^3 [rev/s], 0.72秒
      var rotF = rotW + DV_TAU * 0.72 * (flyRev + (wRev - flyRev) * 0.25);
      // 跳ね: ω(τ)=flyRev*exp(-k τ) [rev/s], 0.45秒
      var bRevs = flyRev * (1 - Math.exp(-DV_FRICTION * 0.45)) / DV_FRICTION;
      var rotB = rotF + DV_TAU * bRevs;
      var spinEnd = flyRev * Math.exp(-DV_FRICTION * 0.45);   // 跳ね終わりの回転速度[rev/s]
      // 静止: 一番近い直角へ収める（A は最大でも±45°ぶん）
      var rFinal = Math.round(rotB / DV_QUARTER) * DV_QUARTER;

      dice.push({
        dir: dir, H: H, shape: shape, b1: b1,
        wRev: wRev, flyRev: flyRev, spinEnd: spinEnd,
        wx: wx, wy: wy, ix: ix, iy: iy, fx: fx, fy: fy,
        rotW: rotW, rotF: rotF, rotB: rotB, rFinal: rFinal,
        amp: rotB - rFinal,
        perm: dv_perm6(rnd), faceOff: Math.floor(rnd() * 6),
        target: targets[i]
      });
    }
    // 2回目の着地時刻は2個の中間（閃光・目の確定をここに合わせる）
    var t2 = DV_T_FLY + (dice[0].b1 + dice[1].b1) * 0.5;
    var tLock = t2;                                 // この瞬間に目が a,b へ確定（閃光で切替を隠す）

    function dv_state(tRaw) {
      var t = dv_clamp(tRaw, 0, dur);
      var phase = t < DV_T_WIND ? 'wind'
        : t < DV_T_FLY ? 'fly'
        : t < DV_T_BOUNCE ? 'bounce'
        : (tRaw >= dur ? 'done' : 'settle');

      var out = [];
      for (var n = 0; n < 2; n++) {
        var D = dice[n];
        var x, y, z, rot, spin, scaleBase, u, e, s;

        if (t < DV_T_WIND) {
          // 溜め: 手前下へ引き、少し縮む
          u = t / DV_T_WIND;
          e = dv_easeOut3(u);
          x = D.wx * e; y = D.wy * e; z = 0;
          rot = DV_TAU * 0.09 * D.wRev * u * u;
          spin = D.wRev * u;
          scaleBase = 1 - 0.06 * e;
        } else if (t < DV_T_FLY) {
          // 飛行: z は放物線、回転は最速
          u = (t - DV_T_WIND) / DV_FLY_LEN;
          e = Math.pow(u, 0.92);
          x = dv_lerp(D.wx, D.ix, e);
          y = dv_lerp(D.wy, D.iy, e);
          var up = Math.pow(u, D.shape);
          z = D.H * 4 * up * (1 - up);
          rot = D.rotW + DV_TAU * 0.72 * (D.flyRev * u + (D.wRev - D.flyRev) * (1 - Math.pow(1 - u, 4)) * 0.25);
          spin = D.flyRev + (D.wRev - D.flyRev) * Math.pow(1 - u, 3);
          scaleBase = 0.94 + 0.06 * Math.min(1, u / 0.25);
        } else if (t < DV_T_BOUNCE) {
          // 跳ね: 38% → 14% の2回。横は摩擦で減速しながら左右に開く
          var tb = t - DV_T_FLY;
          u = tb / DV_BOUNCE_LEN;
          e = 1 - Math.pow(1 - u, 2.2);
          x = dv_lerp(D.ix, D.fx, e);
          y = dv_lerp(D.iy, D.fy, e);
          if (tb < D.b1) {
            var q1 = tb / D.b1;
            z = D.H * DV_H1 * 4 * q1 * (1 - q1);
          } else {
            var len2 = DV_BOUNCE_LEN - D.b1;
            var q2 = (tb - D.b1) / len2;
            z = D.H * DV_H2 * 4 * q2 * (1 - q2);
          }
          var ts = tb / 1000;
          rot = D.rotF + DV_TAU * D.flyRev * (1 - Math.exp(-DV_FRICTION * ts)) / DV_FRICTION;
          spin = D.flyRev * Math.exp(-DV_FRICTION * ts);
          scaleBase = 1;
        } else {
          // 静止: コトンと行き過ぎてから正面へ。微小な跳ね（2px）だけ残す
          s = settleLen > 0 ? (t - DV_T_BOUNCE) / settleLen : 1;
          var slide = 2.4 * D.dir * Math.sin(Math.PI * s) * (1 - s);
          x = D.fx + slide;
          y = D.fy + 1.2 * Math.sin(Math.PI * s) * (1 - s);
          z = 2.2 * Math.sin(Math.PI * s) * (1 - s);
          rot = D.rFinal + D.amp * dv_settleEnv(s);
          spin = D.spinEnd * (1 - s) * (1 - s) * (1 + 0.6 * Math.sin(Math.PI * s));
          scaleBase = 1;
        }

        var face = (t >= tLock) ? D.target : dv_face(D, rot);
        out.push({
          x: x, y: y, z: z,
          rot: rot,
          spin: spin,
          face: face,
          scale: scaleBase * (1 + z * 0.0016),
          blur: dv_clamp(spin / 8, 0, 1)
        });
      }

      // 着地の衝撃（1回目0.9 / 2回目0.45 / コトン0.18）。溜めの微振動も足す
      var wu = dv_clamp(t / DV_T_WIND, 0, 1);
      var windShake = (t < DV_T_WIND) ? 0.14 * Math.pow(Math.sin(Math.PI * wu), 2) : 0;
      var shake = windShake
        + 0.90 * dv_impulse(t - DV_T_FLY, 18, 95)
        + 0.45 * dv_impulse(t - t2, 18, 85)
        + 0.18 * dv_impulse(t - DV_T_BOUNCE, 16, 70);
      var flash = 0.90 * dv_impulse(t - DV_T_FLY, 12, 90)
        + 0.45 * dv_impulse(t - t2, 12, 80)
        + 0.15 * dv_impulse(t - DV_T_BOUNCE, 10, 60);
      var dust = 1.00 * dv_impulse(t - DV_T_FLY, 32, 300)
        + 0.50 * dv_impulse(t - t2, 32, 260)
        + 0.22 * dv_impulse(t - DV_T_BOUNCE, 28, 220);

      return {
        phase: phase,
        d: out,
        shake: dv_clamp(shake, 0, 1),
        flash: dv_clamp(flash, 0, 1),
        dust: dv_clamp(dust, 0, 1)
      };
    }

    return { dur: dur, at: dv_state };
  };
})();

/* ───── ae5a1c745530f7879 ───── */
/* ══════════════════════════════════════════════════════════════
   dvSfx(ac) — ダイスキングダム 効果音ライブラリ
   ・音源ファイル無し（すべて Web Audio API で合成）
   ・AudioContext は呼び出し側が渡す（自動再生ブロック対策）
   ・1音を2〜4層重ねて質感を出す
   使い方: var S = dvSfx(myAudioContext); S.click();
   ══════════════════════════════════════════════════════════════ */
function dvSfx(ac){
  'use strict';
  if(!ac || !ac.createGain) return null;

  var _dvEPS = 0.0001;                      // 0 への ramp は禁止なのでこの値まで落としてから stop

  /* ── 出力段（1度だけ作る） ── */
  var _dvOut = ac.createGain();
  _dvOut.gain.value = 1;
  _dvOut.connect(ac.destination);

  /* ── 白ノイズ 2秒。全効果音で使い回す（毎回 createBuffer しない） ── */
  var _dvNSEC = 2;
  var _dvNoise = ac.createBuffer(1, Math.floor(ac.sampleRate * _dvNSEC), ac.sampleRate);
  (function(){
    var d = _dvNoise.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;
  })();

  /* ── 残響用インパルス応答（減衰ノイズ＋一次ローパスで暗く） ── */
  function _dvIR(sec, decay, dark){
    var len = Math.max(1, Math.floor(ac.sampleRate * sec));
    var b = ac.createBuffer(2, len, ac.sampleRate);
    for(var ch=0; ch<2; ch++){
      var d = b.getChannelData(ch), y = 0;
      for(var i=0;i<len;i++){
        y += ((Math.random()*2-1) - y) * dark;           // 高域を削って自然な響きに
        d[i] = y * Math.pow(1 - i/len, decay);
      }
    }
    return b;
  }
  var _dvRevS  = ac.createConvolver(); _dvRevS.buffer = _dvIR(0.40, 3.4, 0.45); // 短い残響
  var _dvRevSg = ac.createGain(); _dvRevSg.gain.value = 0.85;
  _dvRevS.connect(_dvRevSg); _dvRevSg.connect(_dvOut);
  var _dvRevL  = ac.createConvolver(); _dvRevL.buffer = _dvIR(2.4, 2.2, 0.30);  // 長い残響
  var _dvRevLg = ac.createGain(); _dvRevLg.gain.value = 0.70;
  _dvRevL.connect(_dvRevLg); _dvRevLg.connect(_dvOut);

  /* ── 軽い歪み（濁らせる）用カーブ。1度だけ作る ── */
  function _dvCurve(k){
    var n = 1024, c = new Float32Array(n);
    for(var i=0;i<n;i++){ var x = i*2/n - 1; c[i] = (1+k)*x / (1 + k*Math.abs(x)); }
    return c;
  }
  var _dvCurveSoft = _dvCurve(6);

  var _dvOn = true;                                     // ミュート用
  function _dvT(){                                      // 開始時刻（必要なら resume）
    if(ac.state === 'suspended' && ac.resume){ try{ ac.resume(); }catch(e){} }
    return ac.currentTime + 0.002;
  }
  function _dvR(a,b){ return a + Math.random()*(b-a); }

  /* 残響への送り。終了時に切るので溜まらない */
  function _dvSend(node, amt, long){
    var g = ac.createGain(); g.gain.value = amt;
    node.connect(g); g.connect(long ? _dvRevL : _dvRevS);
    return g;
  }

  /* ── 1層ぶんの音程レイヤー ──
     o = {t,dur,type,f,f2,gt,v,a,hold,detune,lp,lpTo,lpQ,drive,rev,long,dest} */
  function _dvOsc(o){
    var t0 = o.t, dur = o.dur, atk = o.a || 0.005;
    var n = ac.createOscillator(), g = ac.createGain();
    var sh = null, lp = null, sg = null;
    n.type = o.type || 'sine';
    n.frequency.setValueAtTime(o.f, t0);
    if(o.f2) n.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + (o.gt || dur));
    if(o.detune) n.detune.setValueAtTime(o.detune, t0);

    /* ADSR：立ち上がり →（保持）→ 0.0001 へ落としてから stop */
    g.gain.setValueAtTime(_dvEPS, t0);
    g.gain.exponentialRampToValueAtTime(o.v, t0 + atk);
    if(o.hold) g.gain.setValueAtTime(o.v, t0 + atk + o.hold);
    g.gain.exponentialRampToValueAtTime(_dvEPS, t0 + dur);

    var head = n;
    if(o.drive){ sh = ac.createWaveShaper(); sh.curve = _dvCurveSoft; head.connect(sh); head = sh; }
    if(o.lp){
      lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(o.lp, t0);
      if(o.lpTo) lp.frequency.exponentialRampToValueAtTime(Math.max(60, o.lpTo), t0 + dur);
      lp.Q.value = o.lpQ || 0.7;
      head.connect(lp); head = lp;
    }
    head.connect(g);
    g.connect(o.dest || _dvOut);
    if(o.rev) sg = _dvSend(g, o.rev, o.long);

    n.start(t0); n.stop(t0 + dur + 0.02);
    n.onended = function(){                              // 溜めないよう必ず全部切る
      try{ n.disconnect(); if(sh) sh.disconnect(); if(lp) lp.disconnect();
           if(sg) sg.disconnect(); g.disconnect(); }catch(e){}
    };
  }

  /* ── 1層ぶんのノイズレイヤー ──
     o = {t,dur,v,a,hold,type,f,f2,fSeq,Q,rate,rev,long,dest} */
  function _dvNz(o){
    var t0 = o.t, dur = o.dur, atk = o.a || 0.003;
    var s = ac.createBufferSource(); s.buffer = _dvNoise; s.loop = true;
    s.playbackRate.value = o.rate || 1;
    var g = ac.createGain(), flt = null, sg = null;

    g.gain.setValueAtTime(_dvEPS, t0);
    g.gain.exponentialRampToValueAtTime(o.v, t0 + atk);
    if(o.hold) g.gain.setValueAtTime(o.v, t0 + atk + o.hold);
    g.gain.exponentialRampToValueAtTime(_dvEPS, t0 + dur);

    if(o.type){
      flt = ac.createBiquadFilter(); flt.type = o.type;
      if(o.Q != null) flt.Q.value = o.Q;
      if(o.fSeq){                                        // 複数点のスイープ
        flt.frequency.setValueAtTime(o.fSeq[0][1], t0);
        for(var i=1;i<o.fSeq.length;i++)
          flt.frequency.exponentialRampToValueAtTime(Math.max(40, o.fSeq[i][1]), t0 + o.fSeq[i][0]);
      }else{
        flt.frequency.setValueAtTime(o.f, t0);
        if(o.f2) flt.frequency.exponentialRampToValueAtTime(Math.max(40, o.f2), t0 + dur);
      }
      s.connect(flt); flt.connect(g);
    }else{
      s.connect(g);
    }
    g.connect(o.dest || _dvOut);
    if(o.rev) sg = _dvSend(g, o.rev, o.long);

    s.start(t0, _dvR(0, _dvNSEC - 0.6), dur + 0.05);     // 読み出し位置をずらし同じ質感の連続を避ける
    s.stop(t0 + dur + 0.05);
    s.onended = function(){
      try{ s.disconnect(); if(flt) flt.disconnect(); if(sg) sg.disconnect(); g.disconnect(); }catch(e){}
    };
  }

  /* ── 鐘らしさ＝基音＋非整数倍音（2.76倍・5.40倍） ── */
  function _dvBell(t0, f, dur, v, rev, long){
    _dvOsc({ t:t0, dur:dur,      type:'sine', f:f,      v:v,      a:0.004, rev:rev, long:long });
    _dvOsc({ t:t0, dur:dur*0.72, type:'sine', f:f*2.76, v:v*0.30, a:0.003, rev:rev, long:long });
    _dvOsc({ t:t0, dur:dur*0.45, type:'sine', f:f*5.40, v:v*0.14, a:0.002, rev:rev, long:long });
  }

  /* ── きらめき（高音のランダム連打） ── */
  function _dvSparkle(t0, n, lo, hi, spread, v, rev){
    for(var i=0;i<n;i++){
      var f = _dvR(lo, hi);
      _dvOsc({ t:t0 + _dvR(0, spread), dur:_dvR(0.06, 0.13), type:'sine',
               f:f, f2:f*1.6, v:v, a:0.004, rev:(rev==null?0.18:rev) });
    }
  }

  /* ══════════ 効果音本体 ══════════ */
  var API = {

    /* click：3層／木の胴 420→300Hz・硬いアタック1.8kHz・共鳴900Hz／0.055秒 */
    click: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvOsc({ t:t, dur:0.055, type:'triangle', f:420, f2:300, v:0.11, a:0.002 });
      _dvNz ({ t:t, dur:0.020, type:'bandpass', f:1800, Q:1.6,  v:0.07, a:0.001 });
      _dvOsc({ t:t, dur:0.035, type:'sine',     f:900, f2:760,  v:0.05, a:0.002 });
    },

    /* hover：2層／1250→1550Hz と その1.5倍／0.055秒 */
    hover: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvOsc({ t:t, dur:0.055, type:'sine',     f:1250, f2:1550, v:0.10,  a:0.010 });
      _dvOsc({ t:t, dur:0.035, type:'triangle', f:1875, f2:2100, v:0.035, a:0.008 });
    },

    /* diceShake：粒5〜8個×2層（1.2-2.6kHzノイズ＋木鳴り280-520Hz）／間隔0.045-0.11秒・全体約0.45秒 */
    diceShake: function(power){
      if(!_dvOn) return; var t = _dvT();
      var n = 5 + Math.floor(Math.random()*4);           // 5〜8粒
      var v = 0.11 + 0.06*(power==null?0.6:power);
      var at = 0;
      for(var i=0;i<n;i++){
        var tt = t + at;
        _dvNz ({ t:tt, dur:0.030, type:'bandpass', f:_dvR(1200,2600), Q:_dvR(5,12), v:v, a:0.001 });
        _dvOsc({ t:tt, dur:0.045, type:'triangle', f:_dvR(280,520), f2:_dvR(180,300), v:v*0.55, a:0.002 });
        at += _dvR(0.045, 0.11);
      }
    },

    /* diceThrow：3層／バンドパス300→2100→700Hzスイープ・低域ボディ・風のうなり150→70Hz／0.32秒 */
    diceThrow: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvNz ({ t:t, dur:0.32, type:'bandpass', Q:1.1, v:0.14, a:0.05,
               fSeq:[[0,300],[0.18,2100],[0.32,700]] });
      _dvNz ({ t:t, dur:0.30, type:'lowpass',  f:900, f2:420, Q:0.7, v:0.05, a:0.06 });
      _dvOsc({ t:t, dur:0.28, type:'sine',     f:150, f2:70,  v:0.06, a:0.05 });
    },

    /* diceLand：4層／アタック1.5kHz・胴鳴り150→95Hz・木の倍音320Hz・芯640Hz＋短い残響0.4秒／本体0.22秒 */
    diceLand: function(power){
      if(!_dvOn) return; var t = _dvT();
      var k = (power==null?0.7:power);
      _dvNz ({ t:t, dur:0.030, type:'bandpass', f:1500, f2:700, Q:1.0, v:0.09+0.05*k, a:0.001, rev:0.20 });
      _dvOsc({ t:t, dur:0.220, type:'sine',     f:150, f2:95,  v:0.16+0.05*k, a:0.004, rev:0.25 });
      _dvOsc({ t:t, dur:0.120, type:'triangle', f:320, f2:250, v:0.07, a:0.003, rev:0.18 });
      _dvOsc({ t:t, dur:0.070, type:'sine',     f:640, f2:520, v:0.04, a:0.002 });
    },

    /* diceDouble：上昇2音（660→990Hz・各2層）＋きらめき8粒（1.6-2.8kHz）／全体約0.8秒 */
    diceDouble: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvOsc({ t:t,      dur:0.17, type:'triangle', f:660,  v:0.15, a:0.006, rev:0.16 });
      _dvOsc({ t:t,      dur:0.13, type:'sine',     f:990,  v:0.05, a:0.006 });
      _dvOsc({ t:t+0.13, dur:0.26, type:'triangle', f:990,  v:0.15, a:0.006, rev:0.20 });
      _dvOsc({ t:t+0.13, dur:0.20, type:'sine',     f:1485, v:0.05, a:0.006 });
      _dvSparkle(t+0.20, 8, 1600, 2800, 0.38, 0.05, 0.22);
    },

    /* step：2層／620→920Hz と 2倍音／0.06秒 */
    step: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvOsc({ t:t, dur:0.060, type:'sine',     f:620,  f2:920,  v:0.12, a:0.004 });
      _dvOsc({ t:t, dur:0.030, type:'triangle', f:1240, f2:1600, v:0.04, a:0.003 });
    },

    /* land：3層／300→150Hz・900Hzノイズのアタック・200Hzの余韻／0.15秒 */
    land: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvOsc({ t:t, dur:0.110, type:'sine',     f:300, f2:150, v:0.16, a:0.004, rev:0.12 });
      _dvNz ({ t:t, dur:0.040, type:'bandpass', f:900, f2:400, Q:1.2, v:0.08, a:0.001 });
      _dvOsc({ t:t, dur:0.150, type:'triangle', f:200, f2:130, v:0.05, a:0.005 });
    },

    /* coin：3音（880/1174/1396Hz）×各3層（基音＋2.76倍＋5.40倍）＝9層／55msずらし・全体約0.43秒 */
    coin: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvBell(t,         880,  0.20, 0.13, 0.16);
      _dvBell(t + 0.055, 1174, 0.20, 0.12, 0.16);
      _dvBell(t + 0.105, 1396, 0.32, 0.12, 0.22);
    },

    /* pay：4層／歪ませたノコギリ220→70Hz・223Hzずらしで濁り・サブ110→55Hz・擦れノイズ500→180Hz／0.45秒 */
    pay: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvOsc({ t:t, dur:0.45, type:'sawtooth', f:220, f2:70, v:0.11, a:0.008, drive:1, lp:900, lpTo:300 });
      _dvOsc({ t:t, dur:0.45, type:'sawtooth', f:223, f2:71, v:0.06, a:0.008, drive:1, lp:800, lpTo:280, detune:-8 });
      _dvOsc({ t:t, dur:0.42, type:'sine',     f:110, f2:55, v:0.10, a:0.010 });
      _dvNz ({ t:t, dur:0.25, type:'bandpass', f:500, f2:180, Q:1.0, v:0.05, a:0.010 });
    },

    /* build：木槌3連打（各3層）を0.14秒間隔＋0.46秒からベル784Hz（3層）／全体約1.4秒 */
    build: function(){
      if(!_dvOn) return; var t = _dvT();
      for(var i=0;i<3;i++){
        var tt = t + i*0.14;
        _dvNz ({ t:tt, dur:0.025, type:'bandpass', f:1400, f2:600, Q:1.4, v:0.09, a:0.001 });
        _dvOsc({ t:tt, dur:0.090, type:'triangle', f:260, f2:190, v:0.13, a:0.003, rev:0.12 });
        _dvOsc({ t:tt, dur:0.050, type:'sine',     f:520, f2:400, v:0.05, a:0.002 });
      }
      _dvBell(t + 0.46, 784, 0.90, 0.12, 0.30);
    },

    /* landmark：和音4声（262/330/392/523Hz・立ち上がり0.15秒）＋サブ131Hz＋ベル1046Hz3層＋長い残響／全体約3.2秒 */
    landmark: function(){
      if(!_dvOn) return; var t = _dvT();
      var ch = [262, 330, 392, 523];
      for(var i=0;i<ch.length;i++){
        _dvOsc({ t:t + i*0.05, dur:1.70, type:'triangle', f:ch[i], v:0.055,
                 a:0.15, hold:0.35, detune:(i%2?4:-4), rev:0.35, long:true });
      }
      _dvOsc({ t:t, dur:1.60, type:'sine', f:131, v:0.10, a:0.12, hold:0.30, rev:0.20, long:true });
      _dvBell(t + 0.35, 1046, 1.60, 0.10, 0.40, true);
      _dvSparkle(t + 0.55, 6, 1500, 2600, 0.60, 0.04, 0.30);
    },

    /* buy：紙めくり2枚（バンドパス1.2→2.6→1.5kHz）＋0.28秒から判子3層（120→65Hz他）／全体約0.6秒 */
    buy: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvNz({ t:t,      dur:0.13, type:'bandpass', Q:0.8, v:0.09, a:0.02,
              fSeq:[[0,1200],[0.07,2600],[0.13,1500]] });
      _dvNz({ t:t+0.10, dur:0.12, type:'bandpass', Q:0.8, v:0.07, a:0.02,
              fSeq:[[0,1400],[0.06,2400],[0.12,1300]] });
      var s = t + 0.28;                                   // 判子の「ドン」
      _dvNz ({ t:s, dur:0.045, type:'bandpass', f:420, f2:200, Q:1.0, v:0.10, a:0.001, rev:0.18 });
      _dvOsc({ t:s, dur:0.260, type:'sine',     f:120, f2:65,  v:0.17, a:0.004, rev:0.22 });
      _dvOsc({ t:s, dur:0.120, type:'triangle', f:240, f2:160, v:0.06, a:0.003 });
    },

    /* skill：上昇スイープ180→1400Hz＋ノイズ300→2500Hz＋きらめき7粒＋0.45秒から低音90→45Hz／全体約0.95秒 */
    skill: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvOsc({ t:t, dur:0.50, type:'sawtooth', f:180, f2:1400, v:0.10, a:0.03, lp:500, lpTo:2600 });
      _dvNz ({ t:t, dur:0.50, type:'bandpass', f:300, f2:2500, Q:2.0, v:0.06, a:0.05 });
      _dvSparkle(t + 0.34, 7, 1400, 2600, 0.34, 0.045, 0.22);
      _dvOsc({ t:t+0.45, dur:0.40, type:'sine',    f:90,   f2:45,  v:0.18, a:0.006, rev:0.20 });
      _dvNz ({ t:t+0.45, dur:0.09, type:'lowpass', f:1200, f2:300, Q:0.8, v:0.08, a:0.002 });
    },

    /* gachaRoll：6音の上昇（440Hz×1.12^n＝440→775Hz）各3層／0.07秒間隔・全体約0.5秒 */
    gachaRoll: function(power){
      if(!_dvOn) return; var t = _dvT();
      var base = 440 * (1 + 0.25*(power==null?0:power));
      for(var i=0;i<6;i++){
        var f = base * Math.pow(1.12, i), tt = t + i*0.07;
        _dvOsc({ t:tt, dur:0.095, type:'triangle', f:f, f2:f*1.05, v:0.12, a:0.004 });
        _dvOsc({ t:tt, dur:0.060, type:'sine',     f:f*2, v:0.04, a:0.003 });
        _dvNz ({ t:tt, dur:0.020, type:'bandpass', f:2000, Q:8, v:0.04, a:0.001 });
      }
    },

    /* gachaRare：ファンファーレ4音（523/659/784/1046Hz・各3層）＋サブ131Hz＋ベル1568Hz＋きらめきの雨18粒／全体約2.6秒 */
    gachaRare: function(){
      if(!_dvOn) return; var t = _dvT();
      var nt = [523, 659, 784, 1046], tm = [0, 0.12, 0.24, 0.40];
      for(var i=0;i<4;i++){
        var last = (i===3), d = last ? 1.10 : 0.30, tt = t + tm[i];
        _dvOsc({ t:tt, dur:d,     type:'triangle', f:nt[i], v:0.11, a:0.008,
                 hold:(last?0.25:0.06), rev:0.28, long:last });
        _dvOsc({ t:tt, dur:d*0.8, type:'sawtooth', f:nt[i], v:0.04, a:0.010, lp:2200, detune:6 });
        _dvOsc({ t:tt, dur:d*0.7, type:'sine',     f:nt[i]*1.5, v:0.04, a:0.008 });
      }
      _dvOsc({ t:t, dur:1.40, type:'sine', f:131, v:0.11, a:0.02, hold:0.5, rev:0.18, long:true });
      _dvBell(t + 0.40, 1568, 1.30, 0.09, 0.35, true);
      _dvSparkle(t + 0.35, 18, 1200, 2800, 1.20, 0.045, 0.28);
    },

    /* win：明るい和音4つ（C-F-G-C・各3声triangle）0.30秒間隔＋0.90秒からベル1046Hz／全体約2.0秒 */
    win: function(){
      if(!_dvOn) return; var t = _dvT();
      var chords = [[523,659,784],[349,440,523],[392,494,587],[523,659,1046]];
      for(var c=0;c<chords.length;c++){
        var last = (c===3), tt = t + c*0.30, d = last ? 0.95 : 0.42;
        for(var i=0;i<3;i++){
          _dvOsc({ t:tt, dur:d, type:'triangle', f:chords[c][i], v:0.065,
                   a:0.010, hold:(last?0.20:0.05), detune:(i-1)*3, rev:0.22, long:last });
        }
      }
      _dvBell(t + 0.90, 1046, 1.00, 0.10, 0.30, true);
    },

    /* lose：短調の下降和音3つ（Am→Fm→Cm相当・各3声）＋サブ110→55Hz／0.34秒間隔・全体約1.6秒 */
    lose: function(){
      if(!_dvOn) return; var t = _dvT();
      var chords = [[440,523,659],[349,415,523],[262,311,392]];
      for(var c=0;c<chords.length;c++){
        var last = (c===2), tt = t + c*0.34, d = last ? 0.90 : 0.50;
        for(var i=0;i<3;i++){
          _dvOsc({ t:tt, dur:d, type:'sawtooth', f:chords[c][i], f2:chords[c][i]*0.97,
                   v:0.06, a:0.020, lp:1400, lpTo:500, detune:(i-1)*5, rev:0.18 });
        }
      }
      _dvOsc({ t:t, dur:1.40, type:'sine', f:110, f2:55, v:0.12, a:0.03 });
    },

    /* tick：2層／2.2kHzノイズ0.015秒＋1600Hzの芯／全体0.035秒 */
    tick: function(){
      if(!_dvOn) return; var t = _dvT();
      _dvNz ({ t:t, dur:0.015, type:'bandpass', f:2200, Q:9, v:0.10, a:0.001 });
      _dvOsc({ t:t, dur:0.035, type:'triangle', f:1600, f2:1200, v:0.06, a:0.002 });
    },

    /* warn：2回×2層（矩形480Hzをローパス1.2kHzで丸める＋320Hzの下支え）／0.20秒間隔・全体0.33秒 */
    warn: function(){
      if(!_dvOn) return; var t = _dvT();
      for(var i=0;i<2;i++){
        var tt = t + i*0.20;
        _dvOsc({ t:tt, dur:0.13, type:'square',   f:480, v:0.11, a:0.008, hold:0.05, lp:1200, lpTo:800 });
        _dvOsc({ t:tt, dur:0.13, type:'triangle', f:320, v:0.07, a:0.008, hold:0.05 });
      }
    },

    /* ── 補助 ── */
    setVolume: function(v){ _dvOut.gain.value = Math.max(0, Math.min(1, v)); },
    setEnabled: function(on){ _dvOn = !!on; },
    isEnabled:  function(){ return _dvOn; },
    dispose: function(){                                  // 使い終わったら共有ノードも切る
      try{ _dvOut.disconnect(); _dvRevS.disconnect(); _dvRevSg.disconnect();
           _dvRevL.disconnect(); _dvRevLg.disconnect(); }catch(e){}
    }
  };
  return API;
}

/* ───── aa574a2817cec4a0d ───── */
/* ══════════════════════════════════════════════════════════════
   dvMusic — ダイスキングダム BGM エンジン（音源ファイル不使用）
   すべて Web Audio API の合成。AudioContext は呼び出し側が渡す。
     var bgm = dvMusic(ac);
     bgm.play('lobby'|'game'|'tense'|'win');  // 0.6秒クロスフェード
     bgm.stop(0.6); bgm.setVolume(0.8); bgm.current;
   ══════════════════════════════════════════════════════════════ */
function dvMusic(ac){
  if(!ac) return null;

  /* ══ 定数 ══ */
  var MASTER_BASE = 0.16;  // マスター音量の基準（効果音を邪魔しない）
  var LOOKAHEAD   = 0.10;  // 先読み秒（この先までのノートを予約）
  var TICK_MS     = 25;    // スケジューラ周期
  var XFADE       = 0.6;   // 曲切替のクロスフェード秒
  var REV_SEND    = 0.22;  // リバーブ送り量

  /* ══ 音名 → 周波数 ══ */
  var PC = {C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
  function mid(nm){                    // 'C#4' → MIDIノート番号
    var t = /^([A-G][#b]?)(-?\d+)$/.exec(nm);
    if(!t) return 60;
    return PC[t[1]] + (parseInt(t[2],10)+1)*12;
  }
  function fq(mi){ return 440*Math.pow(2,(mi-69)/12); }   // MIDI → Hz
  function hz(nm){ return fq(mid(nm)); }

  /* ══ 共有バッファ（1回だけ生成して使い回す）══ */
  // ホワイトノイズ（スネア・ハイハット用）
  var noiseBuf = (function(){
    var n = Math.floor(ac.sampleRate*2), b = ac.createBuffer(1,n,ac.sampleRate), d = b.getChannelData(0);
    for(var i=0;i<n;i++) d[i] = Math.random()*2-1;
    return b;
  })();
  // インパルス応答（ノイズを指数減衰 → 短いリバーブ 1.2秒）
  var irBuf = (function(){
    var len = Math.floor(ac.sampleRate*1.2), b = ac.createBuffer(2,len,ac.sampleRate);
    for(var c=0;c<2;c++){
      var d = b.getChannelData(c), pre = Math.floor(ac.sampleRate*0.012);
      for(var i=0;i<len;i++){
        var e = Math.pow(1-i/len, 3.0);
        d[i] = i<pre ? 0 : (Math.random()*2-1)*e*0.7;
      }
    }
    return b;
  })();
  // ベース用ソフトクリップ曲線（tanh 型の軽い歪み）
  var driveCurve = (function(){
    var n = 1024, c = new Float32Array(n), k = 1.9;
    for(var i=0;i<n;i++){ var x = i/(n-1)*2-1; c[i] = Math.tanh(k*x)/Math.tanh(k); }
    return c;
  })();

  /* ══ 出力チェーン ══ */
  var master = ac.createGain();
  master.gain.value = MASTER_BASE;
  master.connect(ac.destination);

  var conv = ac.createConvolver(); conv.buffer = irBuf;
  var revSend = ac.createGain(); revSend.gain.value = REV_SEND;
  var revRet  = ac.createGain(); revRet.gain.value  = 0.9;
  revSend.connect(conv); conv.connect(revRet); revRet.connect(master);

  /* ══════════ 曲データ ══════════
     mel: [開始拍, 長さ拍, 音名]   1小節=4拍・1曲=8小節=32拍でぴったり閉じる
     bassPat: 各拍のルートからの半音オフセット（null=休符）
  ══════════════════════════════════ */
  function ch(bass, pad){ return {bass:bass, pad:pad}; }

  var SONGS = {
    /* ── ロビー：明るい I–V–vi–IV / 96BPM ── */
    lobby:{
      bpm:96, bars:8, dly:0.26,
      melWave:'triangle', melCut:2600, padWave:'triangle', padCut:1300,
      vol:{bass:0.30, pad:0.052, mel:0.20, kick:0.42, snare:0.16, hat:0.05},
      chords:[ ch('C2',['E4','G4','C5']), ch('G2',['D4','G4','B4']),
               ch('A2',['E4','A4','C5']), ch('F2',['F4','A4','C5']),
               ch('C2',['E4','G4','C5']), ch('G2',['D4','G4','B4']),
               ch('A2',['E4','A4','C5']), ch('F2',['F4','A4','C5']) ],
      bassPat:[0,7,0,4],
      drum:{kick:[0,2.5], snare:[1,3], hatStep:0.5, open:[3.5]},
      fill:null,
      mel:[
        [0,1,'E4'],   [1,0.5,'G4'], [1.5,0.5,'A4'], [2,1.5,'G4'], [3.5,0.5,'E4'],
        [4,1,'D4'],   [5,1,'G4'],   [6,1.5,'B4'],   [7.5,0.5,'A4'],
        [8,1,'C5'],   [9,0.5,'B4'], [9.5,0.5,'A4'], [10,2,'E4'],
        [12,1,'F4'],  [13,1,'A4'],  [14,1,'C5'],    [15,1,'A4'],
        [16,1,'G4'],  [17,0.5,'E5'],[17.5,0.5,'D5'],[18,1.5,'C5'], [19.5,0.5,'B4'],
        [20,1,'D5'],  [21,1,'B4'],  [22,2,'G4'],
        [24,1,'A4'],  [25,1,'C5'],  [26,1,'E5'],    [27,1,'D5'],
        [28,1.5,'C5'],[29.5,0.5,'A4'],[30,1,'G4'],  [31,1,'D4']    /* D4→先頭E4へ滑らかに戻る */
      ]
    },

    /* ── ゲーム中：少し緊張感のある vi–IV–I–V / 110BPM ── */
    game:{
      bpm:110, bars:8, dly:0.22,
      melWave:'triangle', melCut:3000, padWave:'sawtooth', padCut:1100,
      vol:{bass:0.32, pad:0.042, mel:0.20, kick:0.50, snare:0.20, hat:0.06},
      chords:[ ch('A2',['E4','A4','C5']), ch('F2',['F4','A4','C5']),
               ch('C2',['E4','G4','C5']), ch('G2',['D4','G4','B4']),
               ch('A2',['E4','A4','C5']), ch('F2',['F4','A4','C5']),
               ch('C2',['E4','G4','C5']), ch('G2',['D4','G4','B4']) ],
      bassPat:[0,0,12,7],
      drum:{kick:[0,0.75,2.5], snare:[1,3], hatStep:0.5, open:[3.5]},
      fill:{bar:7, snare:[[3,0.16],[3.25,0.2],[3.5,0.24],[3.75,0.3]]},
      mel:[
        [0,0.5,'A4'],   [0.5,0.5,'C5'], [1,1,'E5'],     [2,0.5,'C5'], [2.5,0.5,'A4'], [3,1,'B4'],
        [4,0.5,'A4'],   [4.5,0.5,'C5'], [5,1,'F5'],     [6,1,'C5'],   [7,1,'A4'],
        [8,0.5,'G4'],   [8.5,0.5,'C5'], [9,1,'E5'],     [10,0.5,'D5'],[10.5,0.5,'C5'],[11,1,'G4'],
        [12,0.5,'B4'],  [12.5,0.5,'D5'],[13,1,'G5'],    [14,1,'D5'],  [15,1,'B4'],
        [16,1,'E5'],    [17,0.5,'C5'],  [17.5,0.5,'A4'],[18,1,'C5'],  [19,1,'E5'],
        [20,1,'F5'],    [21,0.5,'E5'],  [21.5,0.5,'C5'],[22,2,'A4'],
        [24,0.5,'G4'],  [24.5,0.5,'E5'],[25,0.5,'D5'],  [25.5,0.5,'C5'],[26,1,'E5'],[27,1,'G5'],
        [28,0.5,'F5'],  [28.5,0.5,'D5'],[29,1,'B4'],    [30,1,'D5'],  [31,0.5,'B4'] /* B4→先頭A4へ解決 */
      ]
    },

    /* ── 緊迫：短調 ii–V–i（Bm7b5–E7–Am–F）/ 128BPM ── */
    tense:{
      bpm:128, bars:8, dly:0.18,
      melWave:'triangle', melCut:2400, padWave:'sawtooth', padCut:900,
      vol:{bass:0.34, pad:0.040, mel:0.18, kick:0.52, snare:0.18, hat:0.05},
      chords:[ ch('B2',['D4','F4','A4']),  ch('E2',['E4','G#4','D5']),
               ch('A2',['E4','A4','C5']),  ch('F2',['F4','A4','C5']),
               ch('B2',['D4','F4','A4']),  ch('E2',['E4','G#4','D5']),
               ch('A2',['E4','A4','C5']),  ch('F2',['F4','A4','C5']) ],
      bassPat:[0,7,0,7],
      drum:{kick:[0,2,3.75], snare:[1,3], hatStep:0.25, open:[]},
      fill:{bar:7, snare:[[3,0.14],[3.25,0.18],[3.5,0.22],[3.75,0.28]]},
      mel:[
        [0,0.5,'D5'],  [0.5,0.5,'F5'], [2,1,'D5'],     [3,0.5,'B4'],
        [4,0.5,'E5'],  [4.5,0.5,'D5'], [5,1,'B4'],     [6,1,'G#4'],  [7,0.5,'B4'],
        [8,1,'A4'],    [9,0.5,'C5'],   [9.5,0.5,'E5'], [10,1.5,'A5'],
        [12,1,'F5'],   [13,1,'E5'],    [14,2,'C5'],
        [16,0.5,'F5'], [16.5,0.5,'A5'],[17,1,'F5'],    [18,1,'D5'],  [19,0.5,'B4'],
        [20,0.5,'G#5'],[20.5,0.5,'B5'],[21,1,'E5'],    [22,1,'D5'],  [23,0.5,'B4'],
        [24,1,'A5'],   [25,0.5,'G5'],  [25.5,0.5,'E5'],[26,1,'C5'],  [27,1,'A4'],
        [28,1,'F5'],   [29,1,'E5'],    [30,1,'D5'],    [31,0.5,'C5'] /* C5→先頭D5へ */
      ]
    },

    /* ── 勝利：華やかなファンファーレ C–F–G–C / 140BPM ── */
    win:{
      bpm:140, bars:8, dly:0.20,
      melWave:'sawtooth', melCut:3400, padWave:'triangle', padCut:1600,
      vol:{bass:0.30, pad:0.050, mel:0.20, kick:0.48, snare:0.22, hat:0.06},
      chords:[ ch('C2',['E4','G4','C5']), ch('F2',['F4','A4','C5']),
               ch('G2',['D4','G4','B4']), ch('C2',['E4','G4','C5']),
               ch('A2',['E4','A4','C5']), ch('F2',['F4','A4','C5']),
               ch('G2',['D4','G4','B4']), ch('C2',['E4','G4','C5']) ],
      bassPat:[0,0,7,12],
      drum:{kick:[0,1,2,3], snare:[1,3,3.5], hatStep:0.5, open:[3.5]},
      fill:{bar:3, snare:[[3.5,0.2],[3.75,0.26]]},
      mel:[
        [0,0.5,'G4'],  [0.5,0.5,'C5'], [1,0.5,'E5'],   [1.5,1.5,'G5'],[3,0.5,'E5'], [3.5,0.5,'G5'],
        [4,1,'A5'],    [5,0.5,'F5'],   [5.5,0.5,'A5'], [6,1.5,'C6'],  [7.5,0.5,'A5'],
        [8,1,'B5'],    [9,0.5,'G5'],   [9.5,0.5,'D5'], [10,1,'G5'],   [11,1,'B5'],
        [12,2,'C6'],   [14,1,'G5'],    [15,1,'E5'],
        [16,0.5,'A4'], [16.5,0.5,'C5'],[17,1,'E5'],    [18,1.5,'A5'], [19.5,0.5,'G5'],
        [20,1,'F5'],   [21,1,'A5'],    [22,1.5,'C6'],  [23.5,0.5,'A5'],
        [24,1,'B5'],   [25,1,'D6'],    [26,1,'G5'],    [27,1,'B5'],
        [28,2,'C6'],   [30.5,0.5,'E5'],[31,1,'D5']     /* D5→先頭G4へ */
      ]
    }
  };

  /* ══ 曲データ → 時刻順のイベント列に展開（初回のみ）══ */
  function buildEvents(s){
    var ev = [], i, j, b;
    for(b=0;b<s.bars;b++){
      var c = s.chords[b % s.chords.length], root = mid(c.bass);
      /* ② コード（パッド）：1小節ごと */
      ev.push({t:b*4, k:'p', ns:c.pad, d:4});
      /* ① ベース：1拍ずつ */
      for(j=0;j<4;j++){
        var off = s.bassPat[j];
        if(off===null || off===undefined) continue;
        ev.push({t:b*4+j, k:'b', f:fq(root+off), d:0.85});
      }
      /* ④ パーカッション */
      for(i=0;i<s.drum.kick.length;i++)  ev.push({t:b*4+s.drum.kick[i],  k:'k', v:s.vol.kick});
      for(i=0;i<s.drum.snare.length;i++) ev.push({t:b*4+s.drum.snare[i], k:'s', v:s.vol.snare});
      for(var p=0;p<4;p+=s.drum.hatStep){
        var isOpen = s.drum.open.indexOf(p) >= 0;
        ev.push({t:b*4+p, k:'h', v:s.vol.hat*(p===Math.floor(p)?1.35:1), o:isOpen});
      }
      if(s.fill && s.fill.bar===b){
        for(i=0;i<s.fill.snare.length;i++)
          ev.push({t:b*4+s.fill.snare[i][0], k:'s', v:s.fill.snare[i][1]});
      }
    }
    /* ③ メロディ */
    for(i=0;i<s.mel.length;i++)
      ev.push({t:s.mel[i][0], k:'m', f:hz(s.mel[i][2]), d:s.mel[i][1]});
    ev.sort(function(a,z){ return a.t - z.t; });
    return ev;
  }
  for(var nm in SONGS){ SONGS[nm].ev = buildEvents(SONGS[nm]); }

  /* ══════════ 音色（すべて使い捨て・onended で必ず解放）══════════ */
  function cleanup(node, list){
    node.onended = function(){
      for(var i=0;i<list.length;i++){ try{ list[i].disconnect(); }catch(e){} }
      node.onended = null;
    };
  }

  /* ① ベース：サイン波＋軽い歪み＋ローパス */
  function vBass(it, t, f, dur, vol){
    var o = ac.createOscillator(), sh = ac.createWaveShaper(),
        lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t);
    sh.curve = driveCurve; sh.oversample = '2x';
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(320, t); lp.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t+0.02);          // アタック 20ms
    g.gain.exponentialRampToValueAtTime(vol*0.6, t+dur*0.55);  // ディケイ
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);        // リリース
    o.connect(sh); sh.connect(lp); lp.connect(g); g.connect(it.out);
    o.start(t); o.stop(t+dur+0.03);
    cleanup(o, [o, sh, lp, g]);
  }

  /* ② コード：2〜3声のゆるいアタックのパッド */
  function vPad(it, t, notes, dur, s){
    var lp = ac.createBiquadFilter(), g = ac.createGain(), oscs = [], all = [lp, g];
    lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(s.padCut*0.6, t);
    lp.frequency.linearRampToValueAtTime(s.padCut, t+dur*0.5);  // ゆるく開く
    var peak = s.vol.pad;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t+0.35);          // アタック 350ms
    g.gain.exponentialRampToValueAtTime(peak*0.75, t+dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur+0.45);    // リリース 450ms
    for(var i=0;i<notes.length;i++){
      var o = ac.createOscillator();
      o.type = s.padWave;
      o.frequency.setValueAtTime(hz(notes[i]), t);
      o.detune.setValueAtTime((i-1)*6, t);                      // ±6cent のデチューン
      o.connect(lp); o.start(t); o.stop(t+dur+0.5);
      oscs.push(o); all.push(o);
    }
    lp.connect(g); g.connect(it.out);
    if(!oscs.length){ lp.disconnect(); g.disconnect(); return; }
    cleanup(oscs[oscs.length-1], all);   // 最後に止まる声で全部まとめて解放
  }

  /* ③ メロディ：丸みのあるプラック（ディレイ送りあり）*/
  function vMel(it, t, f, dur, s){
    var o = ac.createOscillator(), lp = ac.createBiquadFilter(),
        g = ac.createGain(), sub = ac.createOscillator(), sg = ac.createGain();
    var len = Math.max(0.18, dur);
    o.type = s.melWave; o.frequency.setValueAtTime(f, t);
    sub.type = 'sine';  sub.frequency.setValueAtTime(f, t);     // 芯を足すサイン層
    sg.gain.value = 0.45;
    lp.type = 'lowpass'; lp.Q.value = 1.0;
    lp.frequency.setValueAtTime(s.melCut, t);
    lp.frequency.exponentialRampToValueAtTime(700, t+0.22);     // 立ち上がりで閉じる＝プラック
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(s.vol.mel, t+0.012);    // アタック 12ms
    g.gain.exponentialRampToValueAtTime(0.0001, t+len+0.12);    // 減衰
    o.connect(lp); sub.connect(sg); sg.connect(lp); lp.connect(g);
    g.connect(it.out); g.connect(it.send);                      // dry ＋ ディレイ送り
    o.start(t); sub.start(t);
    o.stop(t+len+0.15); sub.stop(t+len+0.15);
    cleanup(o, [o, sub, sg, lp, g]);
  }

  /* ④-a キック：サイン波のピッチ落とし */
  function vKick(it, t, vol){
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(135, t);
    o.frequency.exponentialRampToValueAtTime(45, t+0.10);       // 135→45Hz
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t+0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.26);
    o.connect(g); g.connect(it.out);
    o.start(t); o.stop(t+0.30);
    cleanup(o, [o, g]);
  }

  /* ④-b スネア：ノイズ＋バンドパス＋胴鳴りのサイン */
  function vSnare(it, t, vol){
    var n = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain(),
        o = ac.createOscillator(), og = ac.createGain();
    n.buffer = noiseBuf; n.loop = true;
    bp.type = 'bandpass'; bp.frequency.setValueAtTime(1900, t); bp.Q.value = 1.1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t+0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.17);        // 減衰 170ms
    o.type = 'triangle';
    o.frequency.setValueAtTime(195, t);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(vol*0.5, t+0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t+0.09);
    n.connect(bp); bp.connect(g); g.connect(it.out);
    o.connect(og); og.connect(it.out);
    n.start(t); n.stop(t+0.20);
    o.start(t); o.stop(t+0.12);
    cleanup(n, [n, bp, g]);
    cleanup(o, [o, og]);
  }

  /* ④-c ハイハット：ノイズ＋ハイパス */
  function vHat(it, t, vol, open){
    var n = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
    var len = open ? 0.16 : 0.045;
    n.buffer = noiseBuf; n.loop = true;
    n.playbackRate.value = 1 + Math.random()*0.1;               // 毎回わずかに表情を変える
    hp.type = 'highpass'; hp.frequency.setValueAtTime(7200, t); hp.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t+0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t+len);
    n.connect(hp); hp.connect(g); g.connect(it.out);
    n.start(t); n.stop(t+len+0.02);
    cleanup(n, [n, hp, g]);
  }

  /* ══════════ 曲インスタンス（クロスフェード用に複数同時に持てる）══════════ */
  var insts = [], timer = null, curName = null, vol = 1;

  function makeInst(name){
    var s = SONGS[name], spb = 60/s.bpm;
    var out = ac.createGain(); out.gain.value = 0;
    out.connect(master); out.connect(revSend);
    /* メロディ用の薄いディレイ（付点8分）*/
    var dly = ac.createDelay(1.5), fb = ac.createGain(), dlp = ac.createBiquadFilter(),
        send = ac.createGain();
    dly.delayTime.value = spb*0.75;
    fb.gain.value = 0.28;
    dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    send.gain.value = s.dly;
    send.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(out);
    return { name:name, song:s, spb:spb, out:out, send:send,
             nodes:[out, send, dly, fb, dlp],
             t0:0, idx:0, loop:0, dead:false, killAt:Infinity };
  }

  function destroy(it){
    for(var i=0;i<it.nodes.length;i++){ try{ it.nodes[i].disconnect(); }catch(e){} }
    it.nodes.length = 0;
  }

  function fadeOut(it, sec){
    var now = ac.currentTime;
    try{ it.out.gain.cancelAndHoldAtTime(now); }
    catch(e){ it.out.gain.cancelScheduledValues(now); it.out.gain.setValueAtTime(it.out.gain.value, now); }
    it.out.gain.linearRampToValueAtTime(0, now+sec);
    it.dead = true;
    it.killAt = now + sec;   // これ以降のノートは予約しない
  }

  function fire(it, ev, t){
    var s = it.song, spb = it.spb;
    if(ev.k==='b')      vBass(it, t, ev.f, ev.d*spb, s.vol.bass);
    else if(ev.k==='p') vPad(it, t, ev.ns, ev.d*spb, s);
    else if(ev.k==='m') vMel(it, t, ev.f, ev.d*spb, s);
    else if(ev.k==='k') vKick(it, t, ev.v);
    else if(ev.k==='s') vSnare(it, t, ev.v);
    else if(ev.k==='h') vHat(it, t, ev.v, ev.o);
  }

  /* 先読みスケジューラ：25ms ごとに 100ms 先までを ac.currentTime 基準で予約 */
  function tick(){
    var now = ac.currentTime;
    for(var i=insts.length-1;i>=0;i--){
      var it = insts[i];
      if(it.dead && now > it.killAt + 0.05){ destroy(it); insts.splice(i,1); continue; }
      var loopBeats = it.song.bars*4, ev = it.song.ev, guard = 0;
      while(guard++ < 512){
        var e = ev[it.idx];
        var t = it.t0 + (it.loop*loopBeats + e.t)*it.spb;
        if(t >= now + LOOKAHEAD) break;
        if(t < now - 0.25){ it.t0 += (now - t); t = now; }   // タブ復帰などの遅れを吸収
        if(!(it.dead && t > it.killAt)) fire(it, e, t);
        it.idx++;
        if(it.idx >= ev.length){ it.idx = 0; it.loop++; }    // ← 8小節でイベント列の先頭に戻る
      }
    }
    if(!insts.length && timer){ clearInterval(timer); timer = null; }
  }

  /* ══════════ 公開 API ══════════ */
  return {
    /* 曲を鳴らす（切替は 0.6 秒クロスフェード）*/
    play: function(name){
      if(!SONGS[name]) return;
      if(ac.state === 'suspended'){ try{ ac.resume(); }catch(e){} }
      if(curName === name){
        for(var k=0;k<insts.length;k++) if(insts[k].name===name && !insts[k].dead) return;
      }
      for(var i=0;i<insts.length;i++) if(!insts[i].dead) fadeOut(insts[i], XFADE);
      var it = makeInst(name), now = ac.currentTime;
      it.t0 = now + 0.06;                       // わずかな余裕をとって開始
      it.out.gain.setValueAtTime(0, now);
      it.out.gain.linearRampToValueAtTime(1, now + XFADE);
      insts.push(it);
      curName = name;
      if(!timer) timer = setInterval(tick, TICK_MS);
      tick();
    },
    /* 止める（既定 0.6 秒フェード。0 なら即停止）*/
    stop: function(fade){
      var f = (fade===undefined) ? XFADE : fade;
      for(var i=insts.length-1;i>=0;i--){
        if(f <= 0){ destroy(insts[i]); insts.splice(i,1); }
        else fadeOut(insts[i], f);
      }
      curName = null;
      if(!insts.length && timer){ clearInterval(timer); timer = null; }
    },
    /* 音量 0〜1（基準 0.16 に対する倍率）*/
    setVolume: function(v){
      vol = Math.max(0, Math.min(1, v));
      var now = ac.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(MASTER_BASE*vol, now+0.08);
    },
    get volume(){ return vol; },
    get current(){ return curName; }
  };
}
