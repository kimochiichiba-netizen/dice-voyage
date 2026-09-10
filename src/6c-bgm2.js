/* ══════════════════════════════════════════════════════════════════════════
   dvMusic2 — ダイスキングダム BGM エンジン v2（音源ファイル不使用）
   「薄い・楽器に聞こえない・抑揚がない」を潰すために作り直した合成音楽エンジン。

   厚みの作り方（この3つが v1 との違い）
     ① 1つの音を 2〜3 個のオシレータで作る（±7cent デチューン＋オクターブ下）
     ② 音ごとに BiquadFilter の frequency をエンベロープで開閉する（＝楽器らしさ）
     ③ 16小節を A(静か)→B(足す)→A'(戻す)→C(盛り上げ) に分け、パートを出し入れする
   さらに全体にコーラス（LFOで揺れる短いディレイ2本）、キック連動のサイドチェーン
   （0.12秒で戻るダッキング）、ディレイ、リバーブを掛けている。

   使い方:
     var bgm = dvMusic2(ac);
     bgm.play('lobby'|'game'|'tense'|'win');   // 0.8秒クロスフェード
     bgm.stop(0.8); bgm.setVolume(0.8); bgm.current;

   制約: Math.random / Date.now / new Date は使わない（曲は毎回同じ）。
         変数はすべてこの関数の中。ノードは onended で必ず disconnect。
   ══════════════════════════════════════════════════════════════════════════ */
function dvMusic2(ac){
  if(!ac) return null;

  /* ══════════ 全体設定 ══════════ */
  var MASTER_BASE = 0.16;   // マスター音量の基準（効果音を邪魔しない）
  var LOOKAHEAD   = 0.12;   // 先読み秒：この先 120ms 分のノートを予約する
  var TICK_MS     = 25;     // スケジューラ周期 25ms
  var XFADE       = 0.8;    // 曲切替のクロスフェード秒
  var BEATS_BAR   = 4;      // 4/4拍子
  var BARS        = 16;     // 1曲＝16小節（＝64拍）

  /* ══════════ 決定的な擬似乱数（Math.random の代わり／毎回同じ波形）══════════ */
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
  function hz(nm){ return fq(mid(nm)); }

  /* ══════════ 共有バッファ（生成は1回だけ）══════════ */
  /* ホワイトノイズ 2秒：スネア/ハイハット/クラップ/クラッシュの素 */
  var noiseBuf = (function(){
    var r = rng(20260911), n = Math.floor(ac.sampleRate*2),
        b = ac.createBuffer(1,n,ac.sampleRate), d = b.getChannelData(0), i;
    for(i=0;i<n;i++) d[i] = r()*2-1;
    return b;
  })();
  /* リバーブのインパルス応答 1.8秒（左右で種を変えて広がりを出す）*/
  var irBuf = (function(){
    var len = Math.floor(ac.sampleRate*1.8), b = ac.createBuffer(2,len,ac.sampleRate), c, i;
    for(c=0;c<2;c++){
      var r = rng(c ? 777211 : 190213), d = b.getChannelData(c),
          pre = Math.floor(ac.sampleRate*0.014);
      for(i=0;i<len;i++){
        var e = Math.pow(1-i/len, 2.6);
        d[i] = i<pre ? 0 : (r()*2-1)*e*0.62;
      }
    }
    return b;
  })();
  /* ベース用ソフトクリップ（tanh 型）：歪ませてからローパスに通す */
  var driveCurve = (function(){
    var n = 2048, c = new Float32Array(n), k = 2.6, i;
    for(i=0;i<n;i++){ var x = i/(n-1)*2-1; c[i] = Math.tanh(k*x)/Math.tanh(k); }
    return c;
  })();

  /* ══════════ 出力チェーン ══════════
     各曲 → mix → コンプ（軽く糊付け）→ master(0.16) → destination            */
  var mix = ac.createGain(); mix.gain.value = 1;
  var comp = ac.createDynamicsCompressor();
  try{
    comp.threshold.value = -4; comp.knee.value = 12; comp.ratio.value = 2.0;
    comp.attack.value = 0.006; comp.release.value = 0.25;
  }catch(e){}
  var master = ac.createGain(); master.gain.value = MASTER_BASE;
  mix.connect(comp); comp.connect(master); master.connect(ac.destination);

  /* ══════════════════════════════════════════════════════════════
     共有パターン表（曲データはこの名前を指すだけ＝データを小さく保つ）
     ══════════════════════════════════════════════════════════════ */

  /* コード刻み：[開始拍, 長さ拍] */
  var KEYS = {
    soft : [[0,2.0],[2,2.0]],                                  // 白玉2つ
    push : [[0,0.9],[1.5,0.4],[2.5,0.9],[3.5,0.4]],            // 裏に食い込む
    four : [[0,0.9],[1,0.9],[2,0.9],[3,0.9]],                  // 4つ打ち
    stab : [[0,0.4],[0.75,0.4],[1.5,0.4],[2.25,0.4],[3,0.9]],  // 細かい刻み
    horn : [[0,0.45],[0.5,0.45],[1,1.4],[2.5,0.45],[3,0.9]]    // ファンファーレ
  };
  /* ベース：[開始拍, 長さ拍, ルートからの半音] */
  var BASS = {
    half : [[0,1.7,0],[2,1.7,0]],
    walk : [[0,0.9,0],[1,0.9,7],[2,0.9,0],[3,0.9,12]],
    push : [[0,0.65,0],[0.75,0.2,0],[1.5,0.4,0],[2,0.65,0],[2.75,0.2,12],[3.5,0.4,7]],
    drive: [[0,0.42,0],[0.5,0.42,0],[1,0.42,0],[1.5,0.42,7],
            [2,0.42,0],[2.5,0.42,0],[3,0.42,0],[3.5,0.42,12]],
    pulse: [[0,0.22,0],[0.5,0.22,0],[1,0.22,0],[1.5,0.22,0],
            [2,0.22,0],[2.5,0.22,0],[3,0.22,0],[3.5,0.22,0]],
    oct  : [[0,0.42,0],[0.5,0.42,12],[1,0.42,0],[1.5,0.42,12],
            [2,0.42,0],[2.5,0.42,12],[3,0.42,0],[3.5,0.42,12]]
  };
  /* ドラム：hs=ハイハット刻み幅（拍）、op=オープンハットの位置 */
  var DRUM = {
    none : {kick:[],           snare:[],        clap:[],    hs:0,    op:[]},
    lite : {kick:[0],          snare:[],        clap:[],    hs:1,    op:[]},
    mid  : {kick:[0,2.5],      snare:[3],       clap:[],    hs:0.5,  op:[3.5]},
    full : {kick:[0,2.5],      snare:[1,3],     clap:[3],   hs:0.5,  op:[3.5]},
    big  : {kick:[0,1.5,2.5],  snare:[1,3],     clap:[1,3], hs:0.25, op:[3.75]},
    four : {kick:[0,1,2,3],    snare:[1,3],     clap:[1,3], hs:0.5,  op:[3.5]},
    d16  : {kick:[0,2],        snare:[1,3],     clap:[],    hs:0.25, op:[]}
  };
  /* アルペジオ：コード構成音のインデックス列（len 超えは1オクターブ上）*/
  var ARP = {
    up   : [0,1,2,3,2,1,2,3],
    updn : [0,1,2,1,3,2,1,0],
    run  : [0,2,1,3,2,4,3,5],
    trip : [0,1,2,0,1,2,3,2]
  };
  /* ハイハットの表情（毎回同じ順で再生速度を微妙に変える。乱数を使わない）*/
  var HVAR = [1.00,1.05,0.96,1.02,0.99,1.06,0.97,1.03];

  /* ══════════════════════════════════════════════════════════════
     曲データ（4曲・各16小節）
       plan : 16小節ぶんのセクション名。A(静か)→B(足す)→A'(戻す)→C(盛り上げ)
       sec  : セクションごとに「どのパートが」「どれくらいの音量で」鳴るか
       prog : 1小節1コード（b=ベースのルート、n=コード構成音）
       mel  : [開始拍, 長さ拍, 音名]（1曲＝64拍。B と C のときだけ書く）
       cut  : フィルタの開始/到達周波数 [Hz開始, Hz到達]
     ══════════════════════════════════════════════════════════════ */
  var SONGS = {

    /* ───────── ロビー：暖かい C メジャー / 92BPM ───────── */
    lobby:{
      bpm:92, arpOct:1, dly:0.22, rev:0.28, cho:0.50, vib:5.2, keyPat:'push',
      wave:{pad:'sawtooth', keys:'triangle', lead:'sawtooth', arp:'triangle'},
      cut :{pad:[240,1500], keys:[3200,850], lead:[3800,1000], arp:[5000,1100], bass:[1100,170]},
      vol :{pad:0.052, keys:0.075, bass:0.30, lead:0.155, arp:0.075,
            kick:0.40, snare:0.16, clap:0.12, hat:0.045, crash:0.085},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.58, pad:1.00, keys:0.00, bass:0.80, bp:'half',  lead:0, arp:0.00, ap:'updn', as:0.5, drum:'lite', dk:0.35},
        B :{lvl:0.85, pad:0.80, keys:0.90, bass:1.00, bp:'push',  lead:1, arp:0.00, ap:'updn', as:0.5, drum:'full', dk:0.55},
        A2:{lvl:0.72, pad:0.90, keys:0.35, bass:0.90, bp:'walk',  lead:0, arp:0.90, ap:'updn', as:0.5, drum:'mid',  dk:0.45},
        C :{lvl:1.00, pad:0.70, keys:1.00, bass:1.00, bp:'drive', lead:1, arp:0.70, ap:'up',   as:0.5, drum:'big',  dk:0.60}
      },
      prog:[
        {b:'C2',n:['E4','G4','C5']},      {b:'A2',n:['E4','A4','C5']},
        {b:'F2',n:['F4','A4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'C2',n:['E4','G4','C5']},      {b:'A2',n:['E4','A4','C5']},
        {b:'F2',n:['F4','A4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'E2',n:['E4','G4','B4','D5']}, {b:'A2',n:['E4','A4','C5']},
        {b:'D2',n:['D4','F4','A4','C5']}, {b:'G2',n:['D4','G4','B4']},
        {b:'F2',n:['F4','A4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'E2',n:['E4','G4','B4']},      {b:'A2',n:['E4','A4','C5']}
      ],
      mel:[
        /* B（5〜8小節目）*/
        [16,1,'G4'],   [17,0.5,'E4'], [17.5,0.5,'G4'],[18,1.5,'C5'], [19.5,0.5,'B4'],
        [20,1,'A4'],   [21,1,'C5'],   [22,2,'G4'],
        [24,1,'F4'],   [25,0.5,'A4'], [25.5,0.5,'C5'],[26,1.5,'A4'], [27.5,0.5,'G4'],
        [28,1,'B4'],   [29,1,'D5'],   [30,2,'G4'],
        /* C（13〜16小節目）*/
        [48,1,'C5'],   [49,0.5,'A4'], [49.5,0.5,'C5'],[50,1.5,'F5'], [51.5,0.5,'E5'],
        [52,1,'D5'],   [53,1,'B4'],   [54,1,'G5'],    [55,1,'D5'],
        [56,1,'E5'],   [57,0.5,'B4'], [57.5,0.5,'D5'],[58,2,'G4'],
        [60,1,'A4'],   [61,1,'C5'],   [62,1,'E5'],    [63,1,'C5']   /* C5→先頭E4へ滑らかに戻る */
      ],
      fill:[7,15], crash:[0,4,8,12]
    },

    /* ───────── 対戦中：軽快な A マイナー / 112BPM ───────── */
    game:{
      bpm:112, arpOct:1, dly:0.18, rev:0.22, cho:0.45, vib:5.6, keyPat:'push',
      wave:{pad:'sawtooth', keys:'triangle', lead:'sawtooth', arp:'square'},
      cut :{pad:[220,1300], keys:[3600,900], lead:[4200,1150], arp:[5400,1300], bass:[1200,180]},
      vol :{pad:0.046, keys:0.070, bass:0.32, lead:0.160, arp:0.062,
            kick:0.46, snare:0.19, clap:0.15, hat:0.050, crash:0.090},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.58, pad:1.00, keys:0.00, bass:0.85, bp:'walk',  lead:0, arp:0.00, ap:'updn', as:0.5,  drum:'lite', dk:0.40},
        B :{lvl:0.85, pad:0.75, keys:0.85, bass:1.00, bp:'push',  lead:1, arp:0.00, ap:'updn', as:0.5,  drum:'full', dk:0.60},
        A2:{lvl:0.72, pad:0.85, keys:0.30, bass:0.90, bp:'oct',   lead:0, arp:1.00, ap:'run',  as:0.25, drum:'mid',  dk:0.50},
        C :{lvl:1.00, pad:0.65, keys:1.00, bass:1.00, bp:'drive', lead:1, arp:0.80, ap:'up',   as:0.25, drum:'big',  dk:0.65}
      },
      prog:[
        {b:'A2',n:['E4','A4','C5']},      {b:'F2',n:['F4','A4','C5']},
        {b:'C2',n:['E4','G4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'A2',n:['E4','A4','C5']},      {b:'F2',n:['F4','A4','C5']},
        {b:'C2',n:['E4','G4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'A2',n:['E4','A4','C5','G5']}, {b:'F2',n:['F4','A4','C5','E5']},
        {b:'D2',n:['D4','F4','A4','C5']}, {b:'E2',n:['E4','G#4','B4','D5']},
        {b:'F2',n:['F4','A4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'A2',n:['E4','A4','C5']},      {b:'G2',n:['D4','G4','B4']}
      ],
      mel:[
        /* B */
        [16,0.5,'A4'], [16.5,0.5,'C5'],[17,1,'E5'],    [18,0.5,'D5'], [18.5,0.5,'C5'],[19,1,'A4'],
        [20,0.5,'F4'], [20.5,0.5,'A4'],[21,1,'C5'],    [22,1.5,'A4'], [23.5,0.5,'G4'],
        [24,0.5,'E4'], [24.5,0.5,'G4'],[25,1,'C5'],    [26,1,'E5'],   [27,1,'G4'],
        [28,0.5,'B4'], [28.5,0.5,'D5'],[29,1.5,'G5'],  [30.5,0.5,'D5'],[31,1,'B4'],
        /* C */
        [48,0.5,'C5'], [48.5,0.5,'F5'],[49,1,'A5'],    [50,1,'F5'],   [51,1,'C5'],
        [52,0.5,'D5'], [52.5,0.5,'G5'],[53,1,'B5'],    [54,1,'G5'],   [55,1,'D5'],
        [56,1,'E5'],   [57,0.5,'C5'],  [57.5,0.5,'A4'],[58,1,'C5'],   [59,1,'E5'],
        [60,0.5,'D5'], [60.5,0.5,'B4'],[61,1,'G4'],    [62,1,'B4'],   [63,1,'D5'] /* D5→先頭A4へ */
      ],
      fill:[7,15], crash:[0,4,8,12]
    },

    /* ───────── 緊迫：16分で押す A マイナー / 132BPM ───────── */
    tense:{
      bpm:132, arpOct:1, dly:0.14, rev:0.18, cho:0.40, vib:6.0, keyPat:'stab',
      wave:{pad:'sawtooth', keys:'sawtooth', lead:'square', arp:'sawtooth'},
      cut :{pad:[180,1000], keys:[2600,700], lead:[3400,900], arp:[4600,1000], bass:[1400,200]},
      vol :{pad:0.044, keys:0.058, bass:0.34, lead:0.150, arp:0.058,
            kick:0.50, snare:0.20, clap:0.15, hat:0.044, crash:0.095},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.58, pad:1.00, keys:0.00, bass:0.90, bp:'pulse', lead:0, arp:0.00, ap:'updn', as:0.25, drum:'d16',  dk:0.45},
        B :{lvl:0.85, pad:0.75, keys:0.80, bass:1.00, bp:'pulse', lead:1, arp:0.00, ap:'updn', as:0.25, drum:'full', dk:0.62},
        A2:{lvl:0.72, pad:0.85, keys:0.35, bass:0.95, bp:'oct',   lead:0, arp:1.00, ap:'trip', as:0.25, drum:'d16',  dk:0.52},
        C :{lvl:1.00, pad:0.60, keys:1.00, bass:1.00, bp:'pulse', lead:1, arp:0.85, ap:'run',  as:0.25, drum:'big',  dk:0.68}
      },
      prog:[
        {b:'A2',n:['A4','C5','E5']},      {b:'A2',n:['A4','C5','E5']},
        {b:'F2',n:['F4','A4','C5']},      {b:'E2',n:['E4','G#4','B4','D5']},
        {b:'A2',n:['A4','C5','E5']},      {b:'A2',n:['A4','C5','E5']},
        {b:'F2',n:['F4','A4','C5']},      {b:'E2',n:['E4','G#4','B4','D5']},
        {b:'D2',n:['D4','F4','A4']},      {b:'D2',n:['D4','F4','A4']},
        {b:'A2',n:['A4','C5','E5']},      {b:'A2',n:['A4','C5','E5']},
        {b:'F2',n:['F4','A4','C5']},      {b:'G2',n:['G4','B4','D5']},
        {b:'E2',n:['E4','G#4','B4']},     {b:'E2',n:['E4','G#4','B4','D5']}
      ],
      mel:[
        /* B */
        [16,0.5,'A4'], [16.5,0.5,'B4'],[17,1,'C5'],    [18,0.5,'E5'], [18.5,0.5,'C5'],[19,1,'A4'],
        [20,1,'E5'],   [21,0.5,'D5'],  [21.5,0.5,'C5'],[22,2,'B4'],
        [24,0.5,'F5'], [24.5,0.5,'E5'],[25,1,'C5'],    [26,1,'A4'],   [27,1,'F5'],
        [28,1,'E5'],   [29,0.5,'G#4'], [29.5,0.5,'B4'],[30,2,'E5'],
        /* C */
        [48,0.5,'F5'], [48.5,0.5,'A5'],[49,1,'C6'],    [50,1,'A5'],   [51,1,'F5'],
        [52,0.5,'G5'], [52.5,0.5,'B5'],[53,1,'D6'],    [54,1,'B5'],   [55,1,'G5'],
        [56,1,'G#5'],  [57,1,'B5'],    [58,1,'E5'],    [59,1,'D5'],
        [60,1,'C5'],   [61,1,'B4'],    [62,2,'G#4']   /* G#4→先頭A4へ解決 */
      ],
      fill:[7,15], crash:[0,4,8,12]
    },

    /* ───────── 勝利：華やかな C メジャー / 146BPM ───────── */
    win:{
      bpm:146, arpOct:1, dly:0.20, rev:0.30, cho:0.55, vib:5.0, keyPat:'horn',
      wave:{pad:'sawtooth', keys:'sawtooth', lead:'sawtooth', arp:'triangle'},
      cut :{pad:[260,1700], keys:[3000,1000], lead:[4600,1300], arp:[5600,1400], bass:[1300,190]},
      vol :{pad:0.050, keys:0.080, bass:0.30, lead:0.165, arp:0.070,
            kick:0.46, snare:0.21, clap:0.17, hat:0.050, crash:0.105},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.70, pad:1.00, keys:0.85, bass:0.90, bp:'walk',  lead:0, arp:0.00, ap:'up',   as:0.5,  drum:'mid',  dk:0.45},
        B :{lvl:0.88, pad:0.80, keys:0.55, bass:1.00, bp:'push',  lead:1, arp:0.00, ap:'up',   as:0.5,  drum:'four', dk:0.60},
        A2:{lvl:0.78, pad:0.90, keys:0.40, bass:0.90, bp:'oct',   lead:0, arp:1.00, ap:'run',  as:0.25, drum:'full', dk:0.50},
        C :{lvl:1.00, pad:0.70, keys:1.00, bass:1.00, bp:'drive', lead:1, arp:0.75, ap:'up',   as:0.25, drum:'big',  dk:0.66}
      },
      prog:[
        {b:'C2',n:['E4','G4','C5']},      {b:'F2',n:['F4','A4','C5']},
        {b:'G2',n:['D4','G4','B4']},      {b:'C2',n:['E4','G4','C5']},
        {b:'C2',n:['E4','G4','C5']},      {b:'A2',n:['E4','A4','C5']},
        {b:'F2',n:['F4','A4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'A2',n:['E4','A4','C5']},      {b:'F2',n:['F4','A4','C5']},
        {b:'C2',n:['E4','G4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'F2',n:['F4','A4','C5']},      {b:'G2',n:['D4','G4','B4']},
        {b:'C2',n:['E4','G4','C5']},      {b:'C2',n:['E4','G4','C5','G5']}
      ],
      mel:[
        /* B */
        [16,0.5,'G4'], [16.5,0.5,'C5'],[17,0.5,'E5'],  [17.5,1.5,'G5'],[19,1,'E5'],
        [20,1,'A5'],   [21,0.5,'G5'],  [21.5,0.5,'E5'],[22,2,'C5'],
        [24,0.5,'F5'], [24.5,0.5,'A5'],[25,1.5,'C6'],  [26.5,0.5,'A5'],[27,1,'F5'],
        [28,1,'D5'],   [29,1,'G5'],    [30,1,'B5'],    [31,1,'D6'],
        /* C */
        [48,1,'C6'],   [49,1,'A5'],    [50,1,'F5'],    [51,1,'A5'],
        [52,1,'D5'],   [53,1,'G5'],    [54,1,'B5'],    [55,1,'D6'],
        [56,2,'C6'],   [58,1,'G5'],    [59,1,'E5'],
        [60,0.5,'G5'], [60.5,0.5,'C6'],[61,1,'E6'],    [62,2,'C6']   /* C6→先頭G4へ */
      ],
      fill:[7,15], crash:[0,4,8,12]
    },

    /* ───────── 待機部屋：落ち着いた期待感の F メジャー / 88BPM ─────────
       A はドラム無し（パッドとベースだけ）。B でハイハットと歌が入り、
       A' でアルペジオ、C で初めてスネアが入る＝「そろそろ始まる」感を作る。 */
    room:{
      bpm:88, arpOct:1, dly:0.24, rev:0.34, cho:0.55, vib:4.6, keyPat:'push',
      wave:{pad:'sawtooth', keys:'triangle', lead:'triangle', arp:'triangle'},
      cut :{pad:[200,1250], keys:[2800,780], lead:[3000,880], arp:[4400,980], bass:[1000,160]},
      vol :{pad:0.056, keys:0.068, bass:0.27, lead:0.140, arp:0.072,
            kick:0.34, snare:0.13, clap:0.09, hat:0.038, crash:0.070},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.50, pad:1.00, keys:0.00, bass:0.70, bp:'half',  lead:0, arp:0.00, ap:'updn', as:0.5, drum:'none', dk:0.00},
        B :{lvl:0.78, pad:0.85, keys:0.80, bass:0.95, bp:'walk',  lead:1, arp:0.00, ap:'updn', as:0.5, drum:'lite', dk:0.30},
        A2:{lvl:0.64, pad:0.95, keys:0.30, bass:0.85, bp:'half',  lead:0, arp:0.85, ap:'updn', as:0.5, drum:'lite', dk:0.28},
        C :{lvl:0.92, pad:0.80, keys:0.95, bass:1.00, bp:'push',  lead:1, arp:0.65, ap:'up',   as:0.5, drum:'mid',  dk:0.45}
      },
      prog:[
        {b:'F2',n:['A4','C5','F5']},       {b:'D2',n:['A4','D5','F5']},
        {b:'Bb2',n:['F4','Bb4','D5']},     {b:'C2',n:['E4','G4','C5']},
        {b:'F2',n:['A4','C5','E5']},       {b:'D2',n:['A4','C5','D5','F5']},
        {b:'G2',n:['D4','G4','Bb4']},      {b:'C2',n:['E4','G4','C5']},
        {b:'Bb2',n:['F4','A4','Bb4','D5']},{b:'C2',n:['E4','G4','C5']},
        {b:'A2',n:['G4','A4','C5','E5']},  {b:'D2',n:['A4','D5','F5']},
        {b:'Bb2',n:['F4','Bb4','D5']},     {b:'C2',n:['E4','G4','C5']},
        {b:'F2',n:['A4','C5','F5']},       {b:'C2',n:['F4','G4','C5']}
      ],
      mel:[
        /* B（5〜8小節目）*/
        [16,1,'F4'],   [17,1,'A4'],    [18,2,'C5'],
        [20,1,'D5'],   [21,0.5,'C5'],  [21.5,0.5,'A4'],[22,2,'F4'],
        [24,1,'G4'],   [25,1,'Bb4'],   [26,1.5,'D5'],  [27.5,0.5,'C5'],
        [28,1,'E4'],   [29,1,'G4'],    [30,2,'C5'],
        /* C（13〜16小節目）*/
        [48,1,'D5'],   [49,0.5,'F5'],  [49.5,0.5,'D5'],[50,2,'Bb4'],
        [52,1,'C5'],   [53,1,'E5'],    [54,1.5,'G5'],  [55.5,0.5,'E5'],
        [56,2,'F5'],   [58,1,'C5'],    [59,1,'A4'],
        [60,1,'G4'],   [61,1,'C5'],    [62,2,'A4']    /* A4→先頭のFへ滑らかに戻る */
      ],
      fill:[7,15], crash:[0,8,12]
    },

    /* ───────── ガチャ：きらびやかで軽い D メジャー / 120BPM ─────────
       アルペジオを A から鳴らしっぱなしにして「回っている」感じを出し、
       C だけ4つ打ち（drum:'four'）にして当たりの瞬間を持ち上げる。 */
    gacha:{
      bpm:120, arpOct:1, dly:0.19, rev:0.26, cho:0.52, vib:5.4, keyPat:'stab',
      wave:{pad:'sawtooth', keys:'triangle', lead:'triangle', arp:'triangle'},
      cut :{pad:[260,1600], keys:[3800,1050], lead:[4400,1250], arp:[6000,1600], bass:[1200,180]},
      vol :{pad:0.048, keys:0.078, bass:0.30, lead:0.150, arp:0.082,
            kick:0.42, snare:0.17, clap:0.14, hat:0.052, crash:0.100},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.60, pad:1.00, keys:0.00, bass:0.85, bp:'walk',  lead:0, arp:0.85, ap:'up',   as:0.5,  drum:'lite', dk:0.35},
        B :{lvl:0.86, pad:0.75, keys:0.90, bass:1.00, bp:'push',  lead:1, arp:0.55, ap:'up',   as:0.5,  drum:'full', dk:0.55},
        A2:{lvl:0.74, pad:0.85, keys:0.35, bass:0.90, bp:'oct',   lead:0, arp:1.00, ap:'run',  as:0.25, drum:'mid',  dk:0.48},
        C :{lvl:1.00, pad:0.70, keys:1.00, bass:1.00, bp:'drive', lead:1, arp:0.90, ap:'trip', as:0.25, drum:'four', dk:0.62}
      },
      prog:[
        {b:'D2',n:['F#4','A4','D5']},      {b:'A2',n:['E4','A4','C#5']},
        {b:'B2',n:['F#4','B4','D5']},      {b:'G2',n:['G4','B4','D5']},
        {b:'D2',n:['F#4','A4','D5']},      {b:'A2',n:['E4','A4','C#5']},
        {b:'G2',n:['F#4','G4','B4','D5']}, {b:'A2',n:['E4','G4','A4','D5']},
        {b:'B2',n:['F#4','B4','D5']},      {b:'G2',n:['G4','B4','D5']},
        {b:'D2',n:['F#4','A4','D5']},      {b:'A2',n:['E4','A4','C#5']},
        {b:'G2',n:['G4','B4','D5']},       {b:'A2',n:['E4','A4','C#5']},
        {b:'B2',n:['F#4','B4','D5']},      {b:'A2',n:['E4','A4','C#5','G5']}
      ],
      mel:[
        /* B */
        [16,0.5,'D5'], [16.5,0.5,'F#5'],[17,1,'A5'],    [18,1,'F#5'],  [19,1,'D5'],
        [20,0.5,'C#5'],[20.5,0.5,'E5'], [21,1,'A5'],    [22,1.5,'E5'], [23.5,0.5,'C#5'],
        [24,0.5,'B4'], [24.5,0.5,'D5'], [25,1,'G5'],    [26,1,'D5'],   [27,1,'B4'],
        [28,1,'A4'],   [29,1,'D5'],     [30,1,'E5'],    [31,1,'G5'],
        /* C */
        [48,0.5,'G5'], [48.5,0.5,'B5'], [49,1,'D6'],    [50,1,'B5'],   [51,1,'G5'],
        [52,0.5,'A5'], [52.5,0.5,'C#6'],[53,1,'E6'],    [54,1,'C#6'],  [55,1,'A5'],
        [56,1,'F#5'],  [57,1,'B5'],     [58,1,'D6'],    [59,1,'F#6'],
        [60,0.5,'E6'], [60.5,0.5,'C#6'],[61,1,'A5'],    [62,1,'G5'],   [63,1,'E5'] /* E5→先頭D5へ */
      ],
      fill:[7,15], crash:[0,4,8,12]
    },

    /* ───────── 独占リーチ：切迫した D マイナー / 138BPM ─────────
       ベースは全編16分の刻み（pulse）。tense より半音低い調で作り、
       tense と続けて鳴っても「別の曲」に聞こえるようにしている。 */
    boss:{
      bpm:138, arpOct:1, dly:0.13, rev:0.16, cho:0.38, vib:6.4, keyPat:'stab',
      wave:{pad:'sawtooth', keys:'sawtooth', lead:'square', arp:'sawtooth'},
      cut :{pad:[170,960], keys:[2400,640], lead:[3200,860], arp:[4400,940], bass:[1500,210]},
      vol :{pad:0.046, keys:0.056, bass:0.36, lead:0.152, arp:0.056,
            kick:0.52, snare:0.21, clap:0.16, hat:0.046, crash:0.100},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.62, pad:1.00, keys:0.00, bass:0.95, bp:'pulse', lead:0, arp:0.00, ap:'trip', as:0.25, drum:'d16',  dk:0.50},
        B :{lvl:0.88, pad:0.70, keys:0.85, bass:1.00, bp:'pulse', lead:1, arp:0.00, ap:'run',  as:0.25, drum:'big',  dk:0.66},
        A2:{lvl:0.76, pad:0.85, keys:0.40, bass:1.00, bp:'oct',   lead:0, arp:1.00, ap:'run',  as:0.25, drum:'d16',  dk:0.56},
        C :{lvl:1.00, pad:0.60, keys:1.00, bass:1.00, bp:'pulse', lead:1, arp:0.90, ap:'trip', as:0.25, drum:'big',  dk:0.72}
      },
      prog:[
        {b:'D2',n:['D4','F4','A4']},       {b:'D2',n:['D4','F4','A4']},
        {b:'Bb2',n:['D4','F4','Bb4']},     {b:'A2',n:['E4','G4','C#5']},
        {b:'D2',n:['D4','F4','A4']},       {b:'D2',n:['D4','F4','A4']},
        {b:'G2',n:['D4','G4','Bb4']},      {b:'A2',n:['E4','G4','C#5']},
        {b:'Bb2',n:['D4','F4','Bb4']},     {b:'C2',n:['E4','G4','C5']},
        {b:'D2',n:['D4','F4','A4']},       {b:'D2',n:['D4','F4','A4']},
        {b:'Bb2',n:['D4','F4','Bb4']},     {b:'C2',n:['E4','G4','C5']},
        {b:'A2',n:['E4','G4','C#5']},      {b:'A2',n:['E4','G4','A4','C#5']}
      ],
      mel:[
        /* B */
        [16,0.5,'D5'], [16.5,0.5,'E5'], [17,1,'F5'],    [18,0.5,'A5'], [18.5,0.5,'F5'],[19,1,'D5'],
        [20,1,'A5'],   [21,0.5,'G5'],   [21.5,0.5,'F5'],[22,2,'E5'],
        [24,0.5,'Bb5'],[24.5,0.5,'A5'], [25,1,'G5'],    [26,1,'D5'],   [27,1,'Bb4'],
        [28,1,'C#5'],  [29,0.5,'E5'],   [29.5,0.5,'G5'],[30,2,'A5'],
        /* C */
        [48,0.5,'Bb5'],[48.5,0.5,'D6'], [49,1,'F6'],    [50,1,'D6'],   [51,1,'Bb5'],
        [52,0.5,'C6'], [52.5,0.5,'E6'], [53,1,'G6'],    [54,1,'E6'],   [55,1,'C6'],
        [56,1,'C#6'],  [57,1,'A5'],     [58,1,'G5'],    [59,1,'E5'],
        [60,0.5,'A5'], [60.5,0.5,'G5'], [61,1,'E5'],    [62,2,'C#5']  /* C#5→先頭D5へ解決 */
      ],
      fill:[7,15], crash:[0,4,8,12]
    },

    /* ───────── 結果発表：しっとりした C メジャー7th / 82BPM ─────────
       刻みは全編 soft（白玉）固定。ドラムは C でようやく mid まで。
       勝っても負けても流せるよう、明るすぎない 7th 中心の和音にしている。 */
    result:{
      bpm:82, arpOct:1, dly:0.26, rev:0.38, cho:0.58, vib:4.4, keyPat:'soft',
      wave:{pad:'sawtooth', keys:'triangle', lead:'triangle', arp:'sine'},
      cut :{pad:[190,1050], keys:[2400,700], lead:[2600,820], arp:[3800,900], bass:[900,150]},
      vol :{pad:0.058, keys:0.062, bass:0.26, lead:0.135, arp:0.066,
            kick:0.32, snare:0.12, clap:0.08, hat:0.034, crash:0.065},
      plan:['A','A','A','A', 'B','B','B','B', 'A2','A2','A2','A2', 'C','C','C','C'],
      sec:{
        A :{lvl:0.48, pad:1.00, keys:0.00, bass:0.65, bp:'half', lead:0, arp:0.00, ap:'updn', as:0.5, drum:'none', dk:0.00},
        B :{lvl:0.74, pad:0.90, keys:0.75, bass:0.90, bp:'half', lead:1, arp:0.00, ap:'updn', as:0.5, drum:'lite', dk:0.26},
        A2:{lvl:0.60, pad:1.00, keys:0.30, bass:0.80, bp:'walk', lead:0, arp:0.80, ap:'updn', as:0.5, drum:'lite', dk:0.24},
        C :{lvl:0.90, pad:0.85, keys:0.90, bass:1.00, bp:'walk', lead:1, arp:0.60, ap:'up',   as:0.5, drum:'mid',  dk:0.40}
      },
      prog:[
        {b:'A2',n:['G4','A4','C5','E5']},  {b:'D2',n:['A4','C5','D5','F5']},
        {b:'G2',n:['F4','G4','B4','D5']},  {b:'C2',n:['E4','G4','B4','C5']},
        {b:'F2',n:['A4','C5','E5','F5']},  {b:'E2',n:['G4','B4','D5','E5']},
        {b:'D2',n:['A4','C5','D5','F5']},  {b:'G2',n:['F4','G4','B4','D5']},
        {b:'C2',n:['E4','G4','B4','C5']},  {b:'A2',n:['G4','A4','C5','E5']},
        {b:'F2',n:['A4','C5','E5','F5']},  {b:'G2',n:['F4','G4','B4','D5']},
        {b:'E2',n:['G4','B4','D5','E5']},  {b:'A2',n:['G4','A4','C5','E5']},
        {b:'D2',n:['A4','C5','D5','F5']},  {b:'G2',n:['F4','G4','C5','D5']}
      ],
      mel:[
        /* B */
        [16,2,'A4'],   [18,1,'C5'],    [19,1,'E5'],
        [20,1.5,'D5'], [21.5,0.5,'B4'],[22,2,'G4'],
        [24,1,'A4'],   [25,1,'C5'],    [26,2,'D5'],
        [28,1,'B4'],   [29,1,'D5'],    [30,2,'G4'],
        /* C */
        [48,1,'B4'],   [49,1,'E5'],    [50,2,'G5'],
        [52,1,'E5'],   [53,1,'C5'],    [54,2,'A4'],
        [56,1,'D5'],   [57,1,'F5'],    [58,1.5,'A5'], [59.5,0.5,'F5'],
        [60,1,'E5'],   [61,1,'D5'],    [62,2,'C5']    /* C5→先頭 Am7 へ */
      ],
      fill:[15], crash:[0,8]
    }
  };

  /* ══════════════════════════════════════════════════════════════
     曲データ → 時刻順のイベント列に展開（構築時に1回だけ）
       k: 'pad' 'key' 'bass' 'lead' 'arp'
          'k'(キック) 's'(スネア) 'c'(クラップ) 'h'(ハイハット) 'z'(クラッシュ)
     ══════════════════════════════════════════════════════════════ */
  function buildEvents(s){
    var ev = [], b, i, j, p;
    for(b=0;b<BARS;b++){
      var nm = s.plan[b], sc = s.sec[nm], ch = s.prog[b],
          t0 = b*BEATS_BAR, root = mid(ch.b);

      /* ⓪ セクション音量：A=0.55 / B=0.85 / A'=0.70 / C=1.00 に 0.3秒で移る */
      ev.push({t:t0, k:'lvl', v:sc.lvl});

      /* ① パッド：1小節ぶんの白玉（ゆっくり開くフィルタで支える）*/
      if(sc.pad > 0) ev.push({t:t0, k:'pad', ns:ch.n, d:BEATS_BAR, v:sc.pad});

      /* ② コード刻み：静かな所は白玉、盛り上がる所は食い込むリズム */
      if(sc.keys > 0){
        p = KEYS[(nm === 'B' || nm === 'C') ? s.keyPat : 'soft'];
        for(i=0;i<p.length;i++) ev.push({t:t0+p[i][0], k:'key', ns:ch.n, d:p[i][1], v:sc.keys});
      }

      /* ③ ベース */
      if(sc.bass > 0){
        p = BASS[sc.bp];
        for(i=0;i<p.length;i++)
          ev.push({t:t0+p[i][0], k:'bass', f:fq(root+p[i][2]), d:p[i][1], v:sc.bass});
      }

      /* ④ アルペジオ：コード構成音を順に拾う */
      if(sc.arp > 0){
        var pat = ARP[sc.ap], step = sc.as, n = ch.n.length, cnt = 0;
        for(j=0;j<BEATS_BAR;j+=step){
          var ix = pat[cnt % pat.length];
          var m2 = mid(ch.n[ix % n]) + 12*Math.floor(ix/n) + 12*s.arpOct;
          ev.push({t:t0+j, k:'arp', f:fq(m2), d:step*0.95, v:sc.arp*((cnt % 2) ? 0.72 : 1)});
          cnt++;
        }
      }

      /* ⑤ ドラム */
      var dr = DRUM[sc.drum];
      for(i=0;i<dr.kick.length;i++)  ev.push({t:t0+dr.kick[i],  k:'k', v:s.vol.kick, dk:sc.dk});
      for(i=0;i<dr.snare.length;i++) ev.push({t:t0+dr.snare[i], k:'s', v:s.vol.snare});
      for(i=0;i<dr.clap.length;i++)  ev.push({t:t0+dr.clap[i],  k:'c', v:s.vol.clap});
      if(dr.hs > 0){
        var hi = 0;
        for(j=0;j<BEATS_BAR;j+=dr.hs){
          var open = dr.op.indexOf(j) >= 0;
          ev.push({t:t0+j, k:'h', v:s.vol.hat*((j === Math.floor(j)) ? 1.30 : 0.62),
                   o:open, r:HVAR[(b*8+hi) % HVAR.length]});
          hi++;
        }
      }

      /* ⑥ セクション頭のクラッシュ（場面が変わった合図）*/
      if(s.crash.indexOf(b) >= 0) ev.push({t:t0, k:'z', v:s.vol.crash});

      /* ⑦ フィル：16分のスネアロールで次のセクションへ押し出す */
      if(s.fill.indexOf(b) >= 0){
        var fv = [0.45,0.60,0.78,1.00];
        for(i=0;i<4;i++) ev.push({t:t0+3+i*0.25, k:'s', v:s.vol.snare*fv[i]});
      }
    }

    /* ⑧ メロディ：B と C のときだけ鳴る（＝抑揚の主役）*/
    for(i=0;i<s.mel.length;i++){
      var bar = Math.floor(s.mel[i][0]/BEATS_BAR), lv = s.sec[s.plan[bar]].lead;
      if(lv <= 0) continue;
      ev.push({t:s.mel[i][0], k:'lead', f:hz(s.mel[i][2]), d:s.mel[i][1], v:lv});
    }

    ev.sort(function(a,z){ return a.t - z.t; });
    return ev;
  }
  for(var _sn in SONGS){ SONGS[_sn].name = _sn; SONGS[_sn].ev = buildEvents(SONGS[_sn]); }

  /* ══════════════════════════════════════════════════════════════
     音色（すべて使い捨て。onended で必ず disconnect する）
     ══════════════════════════════════════════════════════════════ */

  /* 鳴り終わったノードをまとめて解放する */
  function bye(node, bag){
    node.onended = function(){
      for(var i=0;i<bag.length;i++){ try{ bag[i].disconnect(); }catch(e){} }
      node.onended = null;
      bag.length = 0;
    };
  }
  /* オシレータ1本＝「波形・周波数・デチューン(cent)・音量」を指定して生やす */
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
  /* 送り（リバーブ／コーラス）を任意の量でぶら下げる */
  function tap(src, dest, amt, bag){
    var g = ac.createGain(); g.gain.value = amt;
    src.connect(g); g.connect(dest); bag.push(g);
    return g;
  }

  /* ① パッド：和音を「±7centデチューン2枚＋オクターブ下」で支える土台 ─────────
     フィルタ：cut[0]Hz から始めて小節の45%地点で cut[1]Hz まで開き、
               リリースで cut[0]*1.6Hz まで閉じる（＝息づかいが出る）        */
  function vPad(it, t, ns, dur, s, lv){
    var lp = ac.createBiquadFilter(), g = ac.createGain(), bag = [lp,g], i, last = null;
    var c0 = s.cut.pad[0], c1 = s.cut.pad[1], peak = s.vol.pad*lv, end = t+dur+0.85;
    lp.type = 'lowpass'; lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.linearRampToValueAtTime(c1, t+dur*0.45);
    lp.frequency.linearRampToValueAtTime(c0*1.6, t+dur+0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t+0.55);          // アタック 550ms
    g.gain.exponentialRampToValueAtTime(peak*0.80, t+dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur+0.80);    // リリース 800ms
    for(i=0;i<ns.length;i++){
      var m = mid(ns[i]), f = fq(m);
      osc(s.wave.pad, f, -7, t, end, 0.34, lp, bag);            // 本体（-7cent）
      osc(s.wave.pad, f, +7, t, end, 0.34, lp, bag);            // 重ね（+7cent）
      last = osc('triangle', fq(m-12), 0, t, end, 0.42, lp, bag);// オクターブ下
    }
    if(!last){ try{ lp.disconnect(); g.disconnect(); }catch(e){} return; }
    lp.connect(g);
    g.connect(it.duck);                                         // ← サイドチェーンを通る
    tap(g, it.cho, 0.9, bag);
    tap(g, it.rev, 0.9, bag);
    bye(last, bag);
  }

  /* ② コード刻み：エレピ／ブラス寄りの短い和音。フィルタを速く閉じて粒を出す */
  function vKeys(it, t, ns, dur, s, lv){
    var lp = ac.createBiquadFilter(), g = ac.createGain(), bag = [lp,g], i, last = null;
    var c0 = s.cut.keys[0], c1 = s.cut.keys[1], peak = s.vol.keys*lv, end = t+dur+0.30;
    lp.type = 'lowpass'; lp.Q.value = 1.6;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.exponentialRampToValueAtTime(c1, t+0.22);      // 220ms で閉じる
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t+0.008);         // アタック 8ms
    g.gain.exponentialRampToValueAtTime(peak*0.32, t+0.30);     // ディケイ
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur+0.18);
    for(i=0;i<ns.length;i++){
      var m = mid(ns[i]), f = fq(m);
      osc(s.wave.keys, f, -7, t, end, 0.40, lp, bag);
      osc(s.wave.keys, f, +7, t, end, 0.40, lp, bag);
      last = osc('sine', fq(m-12), 0, t, end, 0.38, lp, bag);   // オクターブ下で芯を足す
    }
    if(!last){ try{ lp.disconnect(); g.disconnect(); }catch(e){} return; }
    lp.connect(g);
    g.connect(it.duck);
    tap(g, it.cho, 0.7, bag);
    tap(g, it.rev, 0.6, bag);
    bye(last, bag);
  }

  /* ③ メロディ：3層（±7cent＋オクターブ下サイン）＋ビブラート＋ディレイ送り */
  function vLead(it, t, f, dur, s, lv){
    var lp = ac.createBiquadFilter(), g = ac.createGain(), bag = [lp,g];
    var len = Math.max(0.22, dur), end = t+len+0.30;
    var c0 = s.cut.lead[0], c1 = s.cut.lead[1], peak = s.vol.lead*lv;
    lp.type = 'lowpass'; lp.Q.value = 4.0;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.exponentialRampToValueAtTime(c1, t+0.25);      // 250ms で c0→c1（プラック）
    lp.frequency.exponentialRampToValueAtTime(c1*0.7, t+len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t+0.015);         // アタック 15ms
    g.gain.exponentialRampToValueAtTime(peak*0.72, t+0.30);
    g.gain.exponentialRampToValueAtTime(0.0001, t+len+0.18);    // リリース 180ms
    var o1 = osc(s.wave.lead, f, -7, t, end, 0.42, lp, bag);
    var o2 = osc(s.wave.lead, f, +7, t, end, 0.42, lp, bag);
    var o3 = osc('sine', f/2, 0, t, end, 0.50, lp, bag);        // オクターブ下＝芯
    /* ビブラート：180ms後から7centの揺れを足す（長い音が生きる）*/
    var lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.type = 'sine'; lfo.frequency.setValueAtTime(s.vib, t);
    lg.gain.setValueAtTime(0.0001, t);
    lg.gain.setValueAtTime(0.0001, t+0.18);
    lg.gain.linearRampToValueAtTime(7, t+0.50);
    lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
    lfo.start(t); lfo.stop(end);
    bag.push(lfo); bag.push(lg);
    lp.connect(g);
    g.connect(it.duck);
    tap(g, it.dly, 1.0, bag);                                   // 付点8分のディレイへ
    tap(g, it.cho, 0.8, bag);
    tap(g, it.rev, 0.8, bag);
    bye(o3, bag);
  }

  /* ④ アルペジオ：短いプラック。コード構成音を刻んで隙間を埋める */
  function vArp(it, t, f, dur, s, lv){
    var lp = ac.createBiquadFilter(), g = ac.createGain(), bag = [lp,g];
    var len = Math.max(0.12, dur), end = t+len+0.22;
    var c0 = s.cut.arp[0], c1 = s.cut.arp[1], peak = s.vol.arp*lv;
    lp.type = 'lowpass'; lp.Q.value = 3.0;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.exponentialRampToValueAtTime(c1, t+0.12);      // 120ms で閉じる
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t+0.006);         // アタック 6ms
    g.gain.exponentialRampToValueAtTime(0.0001, t+len+0.12);
    osc(s.wave.arp, f, -7, t, end, 0.45, lp, bag);
    osc(s.wave.arp, f, +7, t, end, 0.45, lp, bag);
    var o3 = osc('sine', f/2, 0, t, end, 0.32, lp, bag);
    lp.connect(g);
    g.connect(it.duck);
    tap(g, it.dly, 0.5, bag);
    tap(g, it.cho, 0.9, bag);
    tap(g, it.rev, 0.5, bag);
    bye(o3, bag);
  }

  /* ⑤ ベース：サイン＋鋸2枚 →（歪ませてから）→ ローパス。低音は太く短く */
  function vBass(it, t, f, dur, s, lv){
    var sh = ac.createWaveShaper(), lp = ac.createBiquadFilter(),
        g = ac.createGain(), bag = [sh,lp,g];
    var len = Math.max(0.16, dur), end = t+len+0.12;
    var c0 = s.cut.bass[0], c1 = s.cut.bass[1], peak = s.vol.bass*lv;
    sh.curve = driveCurve; sh.oversample = '2x';                // ← 先に歪ませる
    lp.type = 'lowpass'; lp.Q.value = 1.1;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.exponentialRampToValueAtTime(c1, t+0.18);      // 180ms で c0→c1
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t+0.012);         // アタック 12ms
    g.gain.exponentialRampToValueAtTime(peak*0.62, t+len*0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t+len+0.06);
    osc('sine', f, 0, t, end, 0.90, sh, bag);
    osc('sawtooth', f, +7, t, end, 0.42, sh, bag);
    var o3 = osc('sawtooth', f, -7, t, end, 0.42, sh, bag);
    sh.connect(lp); lp.connect(g); g.connect(it.arr);           // ベースはダッキングしない（セクション音量には従う）
    bye(o3, bag);
  }

  /* ⑥-a キック：135→45Hz のピッチ落とし＋アタックのクリック */
  function vKick(it, t, v){
    var o = ac.createOscillator(), g = ac.createGain(), bag = [o,g];
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t+0.09);       // 90ms で 150→48Hz
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t+0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.30);        // 300ms で消える
    o.connect(g); g.connect(it.drum);
    o.start(t); o.stop(t+0.32);
    bye(o, bag);
    /* クリック（ノイズ 20ms）*/
    var n = ac.createBufferSource(), hp = ac.createBiquadFilter(), ng = ac.createGain(),
        bag2 = [n,hp,ng];
    n.buffer = noiseBuf; n.loop = true;
    hp.type = 'highpass'; hp.frequency.setValueAtTime(1400, t);
    ng.gain.setValueAtTime(v*0.30, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t+0.020);
    n.connect(hp); hp.connect(ng); ng.connect(it.drum);
    n.start(t); n.stop(t+0.04);
    bye(n, bag2);
  }

  /* ⑥-b スネア：バンドパスのノイズ＋胴鳴り2音（190Hz / 278Hz）*/
  function vSnare(it, t, v){
    var n = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain(),
        bag = [n,bp,g];
    n.buffer = noiseBuf; n.loop = true;
    bp.type = 'bandpass'; bp.frequency.setValueAtTime(1850, t); bp.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t+0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.16);        // 160ms
    n.connect(bp); bp.connect(g); g.connect(it.drum);
    tap(g, it.rev, 0.35, bag);
    n.start(t); n.stop(t+0.19);
    bye(n, bag);
    var o = ac.createOscillator(), o2 = ac.createOscillator(), og = ac.createGain(),
        bag2 = [o,o2,og];
    o.type = 'triangle';  o.frequency.setValueAtTime(190, t);
    o2.type = 'triangle'; o2.frequency.setValueAtTime(278, t);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(v*0.55, t+0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t+0.08);       // 80ms
    o.connect(og); o2.connect(og); og.connect(it.drum);
    o.start(t); o.stop(t+0.10); o2.start(t); o2.stop(t+0.10);
    bye(o, bag2);
  }

  /* ⑥-c クラップ：12ms ずらしの3連バースト＋残りの尾 */
  function vClap(it, t, v){
    var bp = ac.createBiquadFilter(), g = ac.createGain(), bag = [bp,g], i, last = null;
    bp.type = 'bandpass'; bp.frequency.setValueAtTime(1350, t); bp.Q.value = 1.5;
    g.gain.value = 1;
    bp.connect(g); g.connect(it.drum);
    tap(g, it.rev, 0.45, bag);
    var off = [0, 0.012, 0.026];
    for(i=0;i<off.length;i++){
      var n = ac.createBufferSource(), ng = ac.createGain();
      n.buffer = noiseBuf; n.loop = true;
      var st = t+off[i];
      ng.gain.setValueAtTime(v*(1-i*0.18), st);
      ng.gain.exponentialRampToValueAtTime(0.0001, st+0.022);   // 22ms のパチッ
      n.connect(ng); ng.connect(bp);
      n.start(st); n.stop(st+0.03);
      bag.push(n); bag.push(ng);
    }
    var n2 = ac.createBufferSource(), ng2 = ac.createGain();
    n2.buffer = noiseBuf; n2.loop = true;
    ng2.gain.setValueAtTime(v*0.55, t+0.034);
    ng2.gain.exponentialRampToValueAtTime(0.0001, t+0.16);      // 尾 130ms
    n2.connect(ng2); ng2.connect(bp);
    n2.start(t+0.034); n2.stop(t+0.19);
    bag.push(n2); bag.push(ng2);
    bye(n2, bag);          /* 尾が鳴り終わったら3連バーストごと解放 */
  }

  /* ⑥-d ハイハット：ハイパス 8200Hz。閉じ 45ms／開き 220ms */
  function vHat(it, t, v, open, rate){
    var n = ac.createBufferSource(), hp = ac.createBiquadFilter(),
        bp = ac.createBiquadFilter(), g = ac.createGain(), bag = [n,hp,bp,g];
    var len = open ? 0.22 : 0.045;
    n.buffer = noiseBuf; n.loop = true;
    n.playbackRate.value = rate || 1;                           /* 固定表を使う（乱数不使用）*/
    hp.type = 'highpass'; hp.frequency.setValueAtTime(8200, t); hp.Q.value = 0.7;
    bp.type = 'bandpass'; bp.frequency.setValueAtTime(11000, t); bp.Q.value = 0.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t+0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t+len);
    n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(it.drum);
    n.start(t); n.stop(t+len+0.02);
    bye(n, bag);
  }

  /* ⑥-e クラッシュ：セクションの頭に置く 1.4秒のシャーン */
  function vCrash(it, t, v){
    var n = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain(),
        bag = [n,hp,g];
    n.buffer = noiseBuf; n.loop = true;
    n.playbackRate.value = 0.85;
    hp.type = 'highpass'; hp.frequency.setValueAtTime(4200, t); hp.Q.value = 0.6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t+0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t+1.40);        // 1.4秒で消える
    n.connect(hp); hp.connect(g); g.connect(it.drum);
    tap(g, it.rev, 0.5, bag);
    n.start(t); n.stop(t+1.45);
    bye(n, bag);
  }

  /* ══════════════════════════════════════════════════════════════
     曲インスタンス（クロスフェード中は2つ同時に生きる）
       out ─┬─ duck（パッド/コード/メロ/アルペ）… キックで一瞬下がる
            ├─ drum（ドラム）
            ├─ cho（コーラス：LFOで揺れる短いディレイ2本）
            ├─ dly（付点8分のディレイ）
            └─ rev（リバーブ 1.8秒）
     ══════════════════════════════════════════════════════════════ */
  var insts = [], timer = null, curName = null, vol = 1;

  function makeInst(name){
    var s = SONGS[name], spb = 60/s.bpm, bag = [];
    var out = ac.createGain(); out.gain.value = 0; out.connect(mix); bag.push(out);
    /* arr＝セクション音量。A(静か)〜C(盛り上げ)でここが上下する＝抑揚の背骨 */
    var arr = ac.createGain(); arr.gain.value = s.sec[s.plan[0]].lvl;
    arr.connect(out); bag.push(arr);
    var duck = ac.createGain(); duck.gain.value = 1; duck.connect(arr); bag.push(duck);
    var drum = ac.createGain(); drum.gain.value = 1; drum.connect(arr); bag.push(drum);

    /* コーラス：13.5ms と 20.5ms のディレイを 0.33Hz / 0.21Hz の LFO で揺らす */
    var cho = ac.createGain(); cho.gain.value = s.cho; bag.push(cho);
    var lfos = [], i;
    var cd = [[0.0135, 0.33, 0.0022, 0.55], [0.0205, 0.21, 0.0031, -0.55]];
    for(i=0;i<cd.length;i++){
      var dn = ac.createDelay(0.08); dn.delayTime.value = cd[i][0];
      var lf = ac.createOscillator(); lf.type = 'sine'; lf.frequency.value = cd[i][1];
      var lg = ac.createGain(); lg.gain.value = cd[i][2];
      var cg = ac.createGain(); cg.gain.value = cd[i][3];       /* 片方は逆相＝広がる */
      lf.connect(lg); lg.connect(dn.delayTime);
      cho.connect(dn); dn.connect(cg); cg.connect(arr);
      lf.start(ac.currentTime);
      lfos.push(lf); bag.push(lf); bag.push(dn); bag.push(lg); bag.push(cg);
    }

    /* ディレイ：付点8分（spb*0.75）・戻し 30%・2400Hz でローパス */
    var dly = ac.createGain(); dly.gain.value = s.dly;
    var dl = ac.createDelay(1.5); dl.delayTime.value = spb*0.75;
    var fb = ac.createGain(); fb.gain.value = 0.30;
    var dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400;
    dly.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(arr);
    bag.push(dly); bag.push(dl); bag.push(fb); bag.push(dlp);

    /* リバーブ 1.8秒 */
    var rev = ac.createGain(); rev.gain.value = s.rev;
    var conv = ac.createConvolver(); conv.buffer = irBuf;
    var rret = ac.createGain(); rret.gain.value = 0.85;
    rev.connect(conv); conv.connect(rret); rret.connect(arr);
    bag.push(rev); bag.push(conv); bag.push(rret);

    return { name:name, song:s, spb:spb, out:out, arr:arr, duck:duck, drum:drum,
             cho:cho, dly:dly, rev:rev, nodes:bag, lfos:lfos, lvl:s.sec[s.plan[0]].lvl,
             t0:0, idx:0, loop:0, dead:false, killAt:Infinity };
  }

  function destroy(it){
    var i;
    for(i=0;i<it.lfos.length;i++){ try{ it.lfos[i].stop(); }catch(e){} }
    for(i=0;i<it.nodes.length;i++){ try{ it.nodes[i].disconnect(); }catch(e){} }
    it.nodes.length = 0; it.lfos.length = 0;
  }

  function fadeOut(it, sec){
    var now = ac.currentTime;
    try{ it.out.gain.cancelAndHoldAtTime(now); }
    catch(e){
      try{ it.out.gain.cancelScheduledValues(now);
           it.out.gain.setValueAtTime(it.out.gain.value, now); }catch(e2){}
    }
    it.out.gain.linearRampToValueAtTime(0, now+sec);
    it.dead = true;
    it.killAt = now + sec;      // これ以降のノートは予約しない
  }

  /* サイドチェーン：キックの瞬間に一段下げて 0.12秒かけて戻す */
  function duckAt(it, t, depth){
    var g = it.duck.gain, lo = Math.max(0.05, 1-depth);
    try{
      g.setValueAtTime(lo, t);
      g.linearRampToValueAtTime(1, t+0.12);
    }catch(e){}
  }

  function fire(it, e, t){
    var s = it.song, spb = it.spb;
    if(e.k === 'lvl'){                       // セクション音量を 0.3秒かけて移す
      try{
        it.arr.gain.setValueAtTime(it.lvl, t);
        it.arr.gain.linearRampToValueAtTime(e.v, t+0.30);
      }catch(err){ it.arr.gain.value = e.v; }
      it.lvl = e.v;
      return;
    }
    if(e.k === 'pad')       vPad(it, t, e.ns, e.d*spb, s, e.v);
    else if(e.k === 'key')  vKeys(it, t, e.ns, e.d*spb, s, e.v);
    else if(e.k === 'bass') vBass(it, t, e.f, e.d*spb, s, e.v);
    else if(e.k === 'lead') vLead(it, t, e.f, e.d*spb, s, e.v);
    else if(e.k === 'arp')  vArp(it, t, e.f, e.d*spb, s, e.v);
    else if(e.k === 'k'){   vKick(it, t, e.v); duckAt(it, t, e.dk); }
    else if(e.k === 's')    vSnare(it, t, e.v);
    else if(e.k === 'c')    vClap(it, t, e.v);
    else if(e.k === 'h')    vHat(it, t, e.v, e.o, e.r);
    else if(e.k === 'z')    vCrash(it, t, e.v);
  }

  /* 先読みスケジューラ：25ms ごとに 120ms 先までを ac.currentTime 基準で予約 */
  function tick(){
    var now = ac.currentTime, i;
    for(i=insts.length-1;i>=0;i--){
      var it = insts[i];
      if(it.dead && now > it.killAt + 1.6){ destroy(it); insts.splice(i,1); continue; }
      var loopBeats = BARS*BEATS_BAR, ev = it.song.ev, guard = 0;
      while(guard++ < 1024){
        var e = ev[it.idx];
        if(!e) break;
        var t = it.t0 + (it.loop*loopBeats + e.t)*it.spb;
        if(t >= now + LOOKAHEAD) break;
        if(t < now - 0.25){ it.t0 += (now - t); t = now; }   // タブ復帰などの遅れを吸収
        if(!(it.dead && t > it.killAt)) fire(it, e, t);
        it.idx++;
        if(it.idx >= ev.length){ it.idx = 0; it.loop++; }    // 16小節でイベント列の先頭に戻る
      }
    }
    if(!insts.length && timer){ clearInterval(timer); timer = null; }
  }

  /* ══════════════════════════════════════════════════════════════
     公開 API
     ══════════════════════════════════════════════════════════════ */
  return {
    /* 曲を鳴らす（切替は 0.8 秒クロスフェード）*/
    play: function(name){
      if(!SONGS[name]) return;
      if(ac.state === 'suspended'){ try{ ac.resume(); }catch(e){} }
      var i;
      if(curName === name){
        for(i=0;i<insts.length;i++) if(insts[i].name === name && !insts[i].dead) return;
      }
      for(i=0;i<insts.length;i++) if(!insts[i].dead) fadeOut(insts[i], XFADE);
      var it = makeInst(name), now = ac.currentTime;
      it.t0 = now + 0.06;
      it.out.gain.setValueAtTime(0, now);
      it.out.gain.linearRampToValueAtTime(1, now+XFADE);
      insts.push(it);
      curName = name;
      if(!timer) timer = setInterval(tick, TICK_MS);
      tick();
    },
    /* 止める（既定 0.8 秒フェード。0 なら即停止）*/
    stop: function(fade){
      var f = (fade === undefined) ? XFADE : fade, i;
      for(i=insts.length-1;i>=0;i--){
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
      try{
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(MASTER_BASE*vol, now+0.08);
      }catch(e){ master.gain.value = MASTER_BASE*vol; }
    },
    /* ジングルの間だけ music を下げる（amt=倍率・-9dB なら 0.355、sec=下げたままの秒数）
       曲は止めずにマスターだけ動かすので、戻したときに演奏がずれない。         */
    duck: function(amt, sec){
      var a = Math.max(0.02, Math.min(1, amt || 1)), hold = Math.max(0, sec || 0),
          now = ac.currentTime, base = MASTER_BASE*vol, g = master.gain;
      try{
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(base*a, now+0.06);              // 60ms で下げる
        g.setValueAtTime(base*a, now+0.06+hold);
        g.linearRampToValueAtTime(base, now+0.06+hold+0.35);      // 350ms で戻す
      }catch(e){ g.value = base; }
    },
    get volume(){ return vol; },
    get current(){ return curName; }
  };
}
