/* ══════════════════════════════════════════════════════════════════════════
   dvJingle — ダイスボヤージュ ジングル（短い曲）エンジン v1
   建設・ランドマーク・買収・破産・独占・レベルアップの6本。音源ファイル不使用。

   BGM との住み分け
     dvMusic2 … 16小節をループする「曲」（場面ごとに切り替える）
     dvJingle … 1〜3秒の「決まり文句」。鳴っている間だけ BGM を -9dB へ下げ（ダッキング）、
                終わったら 0.35秒かけて元に戻す。曲を止めないので場面が途切れない。

   厚みの作り方は dvMusic2 と同じ考え方
     ① 1音＝3オシレータ（±7centデチューン2枚＋オクターブ下のサイン）
     ② 音ごとに BiquadFilter の frequency をエンベロープで開閉する
     ③ 和音・サブベース・ベル（非整数倍音）・ノイズ層を重ねる

   使い方（推奨＝ファクトリ。共有ノードを1回だけ作る）
     var J = dvJingle(ac);
     J.play('landmark', MUSIC);      // 第2引数に BGM を渡すとダッキングする
     J.setVolume(0.8); J.dispose();
   使い捨て（1回だけ鳴らす。名前を渡すとその場で鳴って自動で片付く）
     dvJingle(ac, 'build', MUSIC);

   制約: Math.random / Date.now / new Date は使わない（毎回まったく同じ音）。
         変数はすべてこの関数の中。ノードは onended で必ず disconnect。
   ══════════════════════════════════════════════════════════════════════════ */
function dvJingle(ac, name, bgm){
  if(!ac || !ac.createGain) return null;

  /* ══════════ 全体設定 ══════════ */
  var MASTER_BASE = 0.62;   // ジングルの基準音量（効果音と同じくらいの前に出る）
  var DUCK_AMT    = 0.3548; // -9dB ＝ 10^(-9/20)
  var DUCK_BACK   = 0.35;   // BGM を戻すのにかける秒数
  var EPS         = 0.0001; // 0 への ramp は禁止なのでここまで落としてから止める

  /* ══════════ 決定的な擬似乱数（ノイズ生成用。曲は毎回同じ）══════════ */
  function rng(seed){
    var s = seed >>> 0; if(!s) s = 1;
    return function(){
      s ^= (s << 13); s = s >>> 0;
      s ^= (s >>> 17);
      s ^= (s << 5);  s = s >>> 0;
      return s / 4294967296;
    };
  }

  /* ══════════ 音名 → 周波数 ══════════ */
  var PC = {C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
  function mid(nm){
    var t = /^([A-G][#b]?)(-?\d+)$/.exec(nm);
    if(!t) return 60;
    return PC[t[1]] + (parseInt(t[2],10)+1)*12;
  }
  function fq(m){ return 440*Math.pow(2,(m-69)/12); }
  function hz(nm){ return (typeof nm === 'number') ? nm : fq(mid(nm)); }

  /* ══════════ 共有バッファ（エンジンごとに1回だけ）══════════ */
  var noiseBuf = (function(){
    var r = rng(20260911), n = Math.floor(ac.sampleRate*2),
        b = ac.createBuffer(1,n,ac.sampleRate), d = b.getChannelData(0), i;
    for(i=0;i<n;i++) d[i] = r()*2-1;
    return b;
  })();
  var irBuf = (function(){                       // リバーブ 1.2秒（左右で種を変える）
    var len = Math.floor(ac.sampleRate*1.2), b = ac.createBuffer(2,len,ac.sampleRate), c, i;
    for(c=0;c<2;c++){
      var r = rng(c ? 553117 : 118837), d = b.getChannelData(c),
          pre = Math.floor(ac.sampleRate*0.012);
      for(i=0;i<len;i++){
        var e = Math.pow(1-i/len, 2.4);
        d[i] = i<pre ? 0 : (r()*2-1)*e*0.60;
      }
    }
    return b;
  })();
  var driveCurve = (function(){                  // サブベース用ソフトクリップ
    var n = 2048, c = new Float32Array(n), k = 2.2, i;
    for(i=0;i<n;i++){ var x = i/(n-1)*2-1; c[i] = Math.tanh(k*x)/Math.tanh(k); }
    return c;
  })();

  /* ══════════ 出力チェーン ══════════
     各音 → out ─┬─ dry
                 ├─ rev（リバーブ 1.2秒）
                 └─ dly（0.26秒ディレイ・戻し28%）
     out → comp（軽く糊付け）→ master → destination                          */
  var out    = ac.createGain(); out.gain.value = 1;
  var comp   = ac.createDynamicsCompressor();
  try{
    comp.threshold.value = -6; comp.knee.value = 14; comp.ratio.value = 2.4;
    comp.attack.value = 0.004; comp.release.value = 0.22;
  }catch(e){}
  var master = ac.createGain(); master.gain.value = MASTER_BASE;
  out.connect(comp); comp.connect(master); master.connect(ac.destination);

  var rev  = ac.createGain(); rev.gain.value = 1;
  var conv = ac.createConvolver(); conv.buffer = irBuf;
  var rret = ac.createGain(); rret.gain.value = 0.80;
  rev.connect(conv); conv.connect(rret); rret.connect(out);

  var dly = ac.createGain(); dly.gain.value = 1;
  var dl  = ac.createDelay(1.0); dl.delayTime.value = 0.26;
  var dfb = ac.createGain(); dfb.gain.value = 0.28;
  var dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
  dly.connect(dl); dl.connect(dlp); dlp.connect(dfb); dfb.connect(dl); dlp.connect(out);

  var shared = [out, comp, master, rev, conv, rret, dly, dl, dfb, dlp];

  /* ══════════ 部品 ══════════ */
  function bye(node, bag){                        // 鳴り終わったらまとめて解放
    node.onended = function(){
      for(var i=0;i<bag.length;i++){ try{ bag[i].disconnect(); }catch(e){} }
      node.onended = null;
      bag.length = 0;
    };
  }
  function osc(type, f, cents, t, stopAt, lvl, dest, bag){
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if(cents) o.detune.setValueAtTime(cents, t);
    g.gain.value = lvl;
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(stopAt);
    bag.push(o); bag.push(g);
    return o;
  }
  function tap(src, dest, amt, bag){
    var g = ac.createGain(); g.gain.value = amt;
    src.connect(g); g.connect(dest); bag.push(g);
    return g;
  }

  /* ① 主音：3オシレータ＋フィルタ開閉。ジングルの「歌」の部分 ───────────── */
  function jTone(t, f, dur, wave, v, o){
    var op = o || {};
    var lp = ac.createBiquadFilter(), g = ac.createGain(), bag = [lp,g];
    var len = Math.max(0.10, dur), atk = op.atk || 0.012, end = t+len+0.30;
    var c0 = op.c0 || 4200, c1 = op.c1 || 1100;
    lp.type = 'lowpass'; lp.Q.value = op.q || 3.2;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.exponentialRampToValueAtTime(c1, t+0.20);      // 200ms で閉じる＝弾いた感じ
    lp.frequency.exponentialRampToValueAtTime(c1*0.65, t+len);
    g.gain.setValueAtTime(EPS, t);
    g.gain.exponentialRampToValueAtTime(v, t+atk);
    g.gain.exponentialRampToValueAtTime(v*0.74, t+Math.min(0.28, len*0.6));
    g.gain.exponentialRampToValueAtTime(EPS, t+len+0.22);
    osc(wave, f, -7, t, end, 0.42, lp, bag);
    osc(wave, f, +7, t, end, 0.42, lp, bag);
    var o3 = osc('sine', f/2, 0, t, end, 0.46, lp, bag);        // オクターブ下＝芯
    lp.connect(g); g.connect(out);
    tap(g, rev, op.rev == null ? 0.42 : op.rev, bag);
    tap(g, dly, op.dly == null ? 0.20 : op.dly, bag);
    bye(o3, bag);
  }

  /* ② ベル：基音＋非整数倍音（2.76倍・5.40倍）＝金属の響き ─────────────── */
  function jBell(t, f, dur, v){
    var g = ac.createGain(), bag = [g], end = t+dur+0.10;
    g.gain.value = 1; g.connect(out);
    tap(g, rev, 0.55, bag);
    tap(g, dly, 0.25, bag);
    function part(mul, dv, dd){
      var pg = ac.createGain(); pg.gain.setValueAtTime(EPS, t);
      pg.gain.exponentialRampToValueAtTime(v*dv, t+0.005);
      pg.gain.exponentialRampToValueAtTime(EPS, t+dur*dd);
      pg.connect(g); bag.push(pg);
      return osc('sine', f*mul, 0, t, end, 1, pg, bag);
    }
    part(2.76, 0.30, 0.72);
    part(5.40, 0.14, 0.45);
    bye(part(1.00, 1.00, 1.00), bag);
  }

  /* ③ サブベース：サイン＋鋸2枚を歪ませてローパス。下から支える ─────────── */
  function jSub(t, f, f2, dur, v){
    var sh = ac.createWaveShaper(), lp = ac.createBiquadFilter(),
        g = ac.createGain(), bag = [sh,lp,g], end = t+dur+0.10;
    sh.curve = driveCurve; sh.oversample = '2x';
    lp.type = 'lowpass'; lp.Q.value = 1.0;
    lp.frequency.setValueAtTime(1100, t);
    lp.frequency.exponentialRampToValueAtTime(180, t+Math.min(0.40, dur));
    g.gain.setValueAtTime(EPS, t);
    g.gain.exponentialRampToValueAtTime(v, t+0.014);
    g.gain.exponentialRampToValueAtTime(v*0.55, t+dur*0.65);
    g.gain.exponentialRampToValueAtTime(EPS, t+dur);
    var o1 = ac.createOscillator(), og = ac.createGain();
    o1.type = 'sine'; o1.frequency.setValueAtTime(f, t);
    if(f2) o1.frequency.exponentialRampToValueAtTime(Math.max(24, f2), t+dur*0.92);
    og.gain.value = 0.92; o1.connect(og); og.connect(sh);
    o1.start(t); o1.stop(end);
    bag.push(o1); bag.push(og);
    osc('sawtooth', f, +7, t, end, 0.30, sh, bag);
    osc('sawtooth', f, -7, t, end, 0.30, sh, bag);
    sh.connect(lp); lp.connect(g); g.connect(out);
    bye(o1, bag);
  }

  /* ④ ノイズ層：布ずれ・シャーン・落下音。fSeq で周波数を折れ線で動かす ──── */
  function jNz(t, dur, type, fSeq, q, v, atk, rv, rate){
    var n = ac.createBufferSource(), flt = ac.createBiquadFilter(),
        g = ac.createGain(), bag = [n,flt,g], i;
    n.buffer = noiseBuf; n.loop = true;
    n.playbackRate.value = rate || 1;
    flt.type = type; flt.Q.value = q;
    flt.frequency.setValueAtTime(fSeq[0][1], t);
    for(i=1;i<fSeq.length;i++)
      flt.frequency.exponentialRampToValueAtTime(Math.max(40, fSeq[i][1]), t+fSeq[i][0]);
    g.gain.setValueAtTime(EPS, t);
    g.gain.exponentialRampToValueAtTime(v, t+(atk || 0.004));
    g.gain.exponentialRampToValueAtTime(EPS, t+dur);
    n.connect(flt); flt.connect(g); g.connect(out);
    if(rv) tap(g, rev, rv, bag);
    n.start(t); n.stop(t+dur+0.04);
    bye(n, bag);
  }

  /* ⑤ 太鼓：ピッチを落とすサイン＋アタックのクリック ─────────────────── */
  function jHit(t, f, f2, v){
    var o = ac.createOscillator(), g = ac.createGain(), bag = [o,g];
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f2, t+0.09);
    g.gain.setValueAtTime(EPS, t);
    g.gain.exponentialRampToValueAtTime(v, t+0.005);
    g.gain.exponentialRampToValueAtTime(EPS, t+0.30);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t+0.32);
    bye(o, bag);
    jNz(t, 0.022, 'highpass', [[0,1500]], 0.7, v*0.30, 0.001, 0);
  }

  /* ⑥ きらめき：固定の周波数表を順に鳴らす（乱数を使わない）───────────── */
  var SPK = [1568,2093,1760,2637,1976,2349,2794,1318,3136,2489];
  function jSparkle(t, n, spread, v, step){
    var i, k = step || 0;
    for(i=0;i<n;i++){
      var f = SPK[(i*3+k) % SPK.length];
      var st = t + spread*(i/Math.max(1,n-1));
      jBell(st, f, 0.26 + 0.10*((i%3)/2), v);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     ジングル定義（すべて「開始秒・音名・長さ秒・波形・音量」で書く）
       tone : [開始, 音名, 長さ, 波形, 音量, フィルタ開始Hz, フィルタ到達Hz]
       bell : [開始, 音名, 長さ, 音量]
       sub  : [開始, 音名, 到達音名(null=そのまま), 長さ, 音量]
       nz   : [開始, 長さ, 種類, 折れ線, Q, 音量, アタック, リバーブ送り]
       hit  : [開始, 開始Hz, 到達Hz, 音量]
       spk  : [開始, 粒数, 広がり秒, 音量, 表の読み始め]
       dur  : ジングルの長さ（この間ずっと BGM を下げる）
     ══════════════════════════════════════════════════════════════ */
  var JINGLES = {

    /* ① 建設完了 1.2秒：木槌トントン → ドレミの上がり（C-E-G）→ ベル */
    build:{
      dur:1.20,
      hit :[[0.00, 190, 74, 0.20]],
      nz  :[[0.00,0.030,'bandpass',[[0,1500],[0.03,620]],1.4,0.10,0.001,0.12],
            [0.12,0.026,'bandpass',[[0,1320],[0.026,560]],1.4,0.07,0.001,0.10]],
      tone:[[0.00,'C5',0.16,'triangle',0.150,3600,1000],
            [0.12,'E5',0.16,'triangle',0.150,3800,1050],
            [0.24,'G5',0.62,'triangle',0.170,4200,1150]],
      bell:[[0.30,'C6',0.80,0.095]],
      sub :[[0.00,'C3','C2',0.34,0.150]]
    },

    /* ② ランドマーク 2.4秒（一番豪華）：シャーン＋ファンファーレ4音＋和音＋ベル2つ＋きらめき6粒 */
    landmark:{
      dur:2.40,
      nz  :[[0.00,1.30,'highpass',[[0,4200],[1.30,2600]],0.6,0.085,0.006,0.50],
            [0.36,0.50,'bandpass',[[0,900],[0.50,300]],0.8,0.045,0.010,0.30]],
      hit :[[0.00, 210, 60, 0.24],[0.36, 180, 56, 0.18]],
      tone:[[0.00,'G4',0.14,'sawtooth',0.130,4000,1000],
            [0.12,'C5',0.14,'sawtooth',0.140,4200,1050],
            [0.24,'E5',0.14,'sawtooth',0.145,4400,1100],
            [0.36,'G5',0.95,'sawtooth',0.165,5000,1300],
            /* 支えの和音（ゆっくり立ち上がるパッド代わり）*/
            [0.36,'C4',1.70,'triangle',0.070,1800,760],
            [0.40,'E4',1.66,'triangle',0.065,1800,760],
            [0.44,'G4',1.62,'triangle',0.065,1900,780],
            [0.48,'C5',1.58,'triangle',0.060,2000,800],
            /* 締めの2音 */
            [1.42,'A5',0.24,'sawtooth',0.140,4600,1200],
            [1.66,'C6',0.72,'sawtooth',0.160,5200,1400]],
      bell:[[0.50,'C6',1.50,0.100],[0.92,'G6',1.10,0.075],[1.70,'E6',0.90,0.080]],
      sub :[[0.00,'C2',null,1.90,0.185]],
      spk :[[0.60,6,0.90,0.045,0],[1.72,4,0.50,0.040,5]]
    },

    /* ③ 買収成立 1.4秒：判子のドン → A-C-F（長調へ解決）→ ベル */
    buyout:{
      dur:1.40,
      nz  :[[0.00,0.050,'bandpass',[[0,440],[0.05,190]],1.0,0.110,0.001,0.18],
            [0.32,0.220,'bandpass',[[0,1600],[0.22,700]],0.9,0.045,0.010,0.14]],
      hit :[[0.00, 165, 52, 0.22]],
      tone:[[0.00,'A4',0.20,'sawtooth',0.140,3000,860],
            [0.16,'C5',0.20,'sawtooth',0.145,3200,900],
            [0.32,'F5',0.72,'sawtooth',0.170,4000,1150],
            [0.32,'A5',0.68,'triangle',0.075,4200,1200]],
      bell:[[0.56,'A5',0.72,0.090]],
      sub :[[0.00,'A2','A1',0.60,0.180],[0.32,'F2',null,0.72,0.150]]
    },

    /* ④ 破産 1.8秒：G-Eb-C-A の下降＋110→38Hz へ落ちるサブ＋沈むノイズ */
    bankrupt:{
      dur:1.80,
      tone:[[0.00,'G4',0.24,'sawtooth',0.135,2400,620],
            [0.18,'Eb4',0.26,'sawtooth',0.130,2200,560],
            [0.36,'C4',0.30,'sawtooth',0.125,2000,500],
            [0.54,'A3',0.95,'sawtooth',0.150,1800,420],
            [0.54,'Eb4',0.90,'sawtooth',0.070,1600,380]],   /* 減5度＝不安な響き */
      nz  :[[0.00,1.40,'lowpass',[[0,1800],[1.40,200]],0.9,0.070,0.030,0.22]],
      hit :[[0.54, 120, 40, 0.20]],
      sub :[[0.00,'A2','D1',1.45,0.190]]
    },

    /* ⑤ 独占成立 2.6秒（ファンファーレ）：G-C-E-G → E-G → C6 伸ばし＋ロール＋ベル3連 */
    mono:{
      dur:2.60,
      nz  :[[0.00,1.60,'highpass',[[0,4600],[1.60,2800]],0.6,0.090,0.006,0.52],
            /* 締めへ押し出すロール（4連） */
            [1.18,0.10,'bandpass',[[0,1900]],0.9,0.055,0.002,0.20],
            [1.30,0.10,'bandpass',[[0,1900]],0.9,0.065,0.002,0.20],
            [1.42,0.10,'bandpass',[[0,1900]],0.9,0.080,0.002,0.20],
            [1.54,0.14,'bandpass',[[0,1900]],0.9,0.100,0.002,0.26]],
      hit :[[0.00, 220, 62, 0.24],[0.60, 190, 56, 0.18],[1.66, 230, 60, 0.26]],
      tone:[[0.00,'G4',0.14,'sawtooth',0.135,4000,1000],
            [0.12,'C5',0.14,'sawtooth',0.140,4200,1050],
            [0.24,'E5',0.14,'sawtooth',0.145,4400,1100],
            [0.36,'G5',0.36,'sawtooth',0.165,4800,1250],
            [0.72,'E5',0.16,'sawtooth',0.145,4400,1100],
            [0.88,'G5',0.16,'sawtooth',0.150,4600,1150],
            [1.04,'C6',0.14,'sawtooth',0.155,5000,1300],
            /* 締めの和音（3声＋伸ばし） */
            [1.66,'C6',0.90,'sawtooth',0.170,5200,1400],
            [1.66,'E5',0.86,'triangle',0.085,3000,900],
            [1.66,'G5',0.86,'triangle',0.085,3200,950],
            [1.66,'C5',0.90,'triangle',0.080,2600,820]],
      bell:[[0.40,'C6',1.00,0.085],[1.70,'G6',0.90,0.080],[1.90,'C7',0.70,0.060]],
      sub :[[0.00,'C2',null,1.30,0.180],[1.66,'C2',null,0.94,0.195]],
      spk :[[1.74,6,0.66,0.045,2]]
    },

    /* ⑥ レベルアップ 1.6秒：C-D-E-G-A の5音上がり → C6 伸ばし＋きらめき */
    levelup:{
      dur:1.60,
      tone:[[0.00,'C5',0.12,'triangle',0.130,3400,950],
            [0.08,'D5',0.12,'triangle',0.135,3500,975],
            [0.16,'E5',0.12,'triangle',0.140,3600,1000],
            [0.24,'G5',0.12,'triangle',0.145,3800,1050],
            [0.32,'A5',0.12,'triangle',0.150,4000,1100],
            [0.42,'C6',0.80,'triangle',0.170,4600,1250],
            [0.42,'E5',0.76,'triangle',0.070,2800,880]],
      nz  :[[0.00,0.46,'bandpass',[[0,600],[0.42,3200]],1.6,0.050,0.040,0.20]],
      bell:[[0.44,'C6',0.90,0.095],[0.62,'G6',0.70,0.060]],
      sub :[[0.42,'C2',null,0.80,0.165]],
      spk :[[0.50,5,0.60,0.042,4]]
    }
  };

  /* ══════════ ダッキング：ジングルの間だけ BGM を -9dB に ══════════
     dvMusic2 / dvMusicFiles の duck() があればそれを使う（マスターを直接触るので確実）。
     無ければ setVolume と volume で代用し、途中で音量を変えられたら手を引く。      */
  function duckBgm(m, sec){
    if(!m) return;
    if(typeof m.duck === 'function'){ try{ m.duck(DUCK_AMT, sec); return; }catch(e){} }
    if(typeof m.setVolume !== 'function' || typeof m.volume !== 'number') return;
    var base = m.volume;
    if(base <= 0) return;
    var mark = base*DUCK_AMT;
    try{ m.setVolume(mark); }catch(e){}
    var steps = [[sec,0.55],[sec+DUCK_BACK*0.34,0.78],
                 [sec+DUCK_BACK*0.68,0.93],[sec+DUCK_BACK,1]], i;
    for(i=0;i<steps.length;i++){
      (function(st){
        setTimeout(function(){
          if(Math.abs(m.volume - mark) > 0.002) return;   // 途中で音量を変えられたら触らない
          mark = base*st[1];
          try{ m.setVolume(mark); }catch(e){}
        }, st[0]*1000);
      })(steps[i]);
    }
  }

  /* ══════════ 再生 ══════════ */
  var live = true;
  function playOne(nm, m){
    if(!live) return 0;
    var J = JINGLES[nm];
    if(!J) return 0;
    if(ac.state === 'suspended'){ try{ ac.resume(); }catch(e){} }
    var t = ac.currentTime + 0.02, i, a;

    if(J.hit)  for(i=0;i<J.hit.length;i++){ a = J.hit[i];  jHit(t+a[0], a[1], a[2], a[3]); }
    if(J.nz)   for(i=0;i<J.nz.length;i++){  a = J.nz[i];
                 jNz(t+a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]); }
    if(J.sub)  for(i=0;i<J.sub.length;i++){ a = J.sub[i];
                 jSub(t+a[0], hz(a[1]), a[2] ? hz(a[2]) : 0, a[3], a[4]); }
    if(J.tone) for(i=0;i<J.tone.length;i++){ a = J.tone[i];
                 jTone(t+a[0], hz(a[1]), a[2], a[3], a[4], {c0:a[5], c1:a[6]}); }
    if(J.bell) for(i=0;i<J.bell.length;i++){ a = J.bell[i]; jBell(t+a[0], hz(a[1]), a[2], a[3]); }
    if(J.spk)  for(i=0;i<J.spk.length;i++){  a = J.spk[i];  jSparkle(t+a[0], a[1], a[2], a[3], a[4]); }

    duckBgm(m, J.dur);
    return J.dur;
  }

  var API = {
    /* 鳴らす。第2引数に BGM（dvMusic2 等）を渡すと鳴っている間 -9dB に下がる */
    play: function(nm, m){ return playOne(nm, m || bgm); },
    /* 鳴らせる名前の一覧 */
    list: function(){ var a = [], k; for(k in JINGLES) a.push(k); return a; },
    /* 長さ（秒）を知りたいとき */
    length: function(nm){ return JINGLES[nm] ? JINGLES[nm].dur : 0; },
    /* 音量 0〜1（基準 0.62 に対する倍率）*/
    setVolume: function(v){
      var x = Math.max(0, Math.min(1, v)), now = ac.currentTime;
      try{
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(MASTER_BASE*x, now+0.08);
      }catch(e){ master.gain.value = MASTER_BASE*x; }
    },
    /* 共有ノードを片付ける（音を出さなくなる）*/
    dispose: function(){
      live = false;
      for(var i=0;i<shared.length;i++){ try{ shared[i].disconnect(); }catch(e){} }
      shared.length = 0;
    }
  };

  /* 使い捨て呼び出し：dvJingle(ac,'build',MUSIC) → 鳴らして、余韻が消えたら自分で片付く */
  if(typeof name === 'string'){
    var sec = API.play(name, bgm);
    setTimeout(function(){ API.dispose(); }, (sec + 2.2)*1000);
  }
  return API;
}
