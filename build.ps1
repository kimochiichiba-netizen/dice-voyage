# ダイスボヤージュ ビルド
# src/ を結合して game.html（Artifact用）と index.html（単体で開ける版）を作る
#
# v9 の決まり（WP0）
#  ・$parts は spec-v9 の build_parts_order どおり。WP 用の新しいファイルは、無ければ警告だけ出して飛ばす。
#  ・8-dk.js を読む時だけ、末尾の </script> をメモリ上で外す（8-dk.js 本体は編集しない）。
#    最後の 9z-end.html（中身は </script> だけ）で JS を閉じる。
#    こうしないと 9-*.js が 8-dk.js より後ろに並ばず、関数の宣言し直しが効かない。
#  ・連結後の本文で <script> と </script> がそれぞれ1個かを確かめる。
#  ・JS の中身を一時ファイルに書き出して node --check を通す。
#    失敗したら html を書き出さずに exit 1（const/let の二重宣言で全画面が真っ白になる事故を止める）。
#
# v10 の決まり（波0）
#  ・$parts に 1u-maps.html・1v-perf.html・9k-maps.js・9l-perf.js を足した（無ければ skip）。build.ps1 を触るのは波0と WP18 だけ。
#  ・連結後の JS（<script> 1個）と CSS（<style>）からコメントと行頭の字下げを落とす（圧縮）。
#    文字列・テンプレート・正規表現・url(...) の中は触らない字句解析を下の node スクリプトで行う（%TEMP% に書き出して動かす）。
#    2回目にかけても変わらないこと・文字列の並びが同じことを自分で確かめ、圧縮後の JS も node --check に通す。
#  ・圧縮しないビルドは -NoMin（例: powershell -NoProfile -ExecutionPolicy Bypass -File build.ps1 -NoMin）。
param([switch]$NoMin)
$ErrorActionPreference = 'Stop'
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$enc = New-Object System.Text.UTF8Encoding($false)

# 既存のファイル（無ければビルド失敗）
$base = @("1-style.html","1b-ui.html","1c-meta.html","1d-polish.html","1e-dk.html","1f-dk2.html",
          "1g-room.html","1h-board.html","1i-title.html","1j-fast.html","2-body.html",
          "3-core.js","3b-art.js","3e-style.js",
          "6-audio.js","6b-bgm.js","6c-bgm2.js","6d-jingle.js","4-game.js","7-online.js","5-meta.js","8-dk.js",
          "9z-end.html")
# 並び順（build_parts_order）
$parts = @("1-style.html","1b-ui.html","1c-meta.html","1d-polish.html","1e-dk.html","1f-dk2.html","1g-room.html",
           "1h-board.html","1i-title.html","1j-fast.html",
           "1k-fx.html","1l-pend.html","1m-cards.html","1n-flow.html","1o-match.html","1p-tiles.html",
           "1q-turn.html","1r-board.html","1s-shop.html","1t-home.html",
           "1u-maps.html","1v-perf.html","1w-skin.html",
           "2-body.html",
           "3-core.js","3b-art.js","3e-style.js",
           "6-audio.js","6b-bgm.js","6c-bgm2.js","6d-jingle.js","4-game.js","7-online.js","5-meta.js","8-dk.js",
           "8b-skin.js",
           "9-fx.js","9a-core.js","9b-pend.js","9c-cards.js","9d-flow.js","9e-match.js","9f-tiles.js",
           "9g-turn.js","9h-board.js","9i-shop.js","9j-home.js",
           "9k-maps.js","9l-perf.js",
           "9z-end.html")

$sb = New-Object System.Text.StringBuilder
$used = @()
foreach($p in $parts){
  $f = Join-Path "$d\src" $p
  if(-not (Test-Path $f)){
    if($base -contains $p){ Write-Host "ERROR: missing: $p" -ForegroundColor Red; exit 1 }
    Write-Warning "skip (まだ無い): $p"
    continue
  }
  $txt = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
  if($p -eq "8-dk.js"){
    # 末尾の </script> をメモリ上で外す（後ろに 9-*.js を続けるため）
    $txt2 = [regex]::Replace($txt, '(?is)</script\s*>\s*$', '')
    if($txt2.Length -eq $txt.Length){ Write-Warning "8-dk.js の末尾に </script> が見つかりません" }
    $txt = $txt2
  }
  [void]$sb.AppendLine($txt)
  $used += $p
}
$body = $sb.ToString()

# ── <script> / </script> がそれぞれ1個か ──
$nOpen  = ([regex]::Matches($body, '(?i)<script\b[^>]*>')).Count
$nClose = ([regex]::Matches($body, '(?i)</script\s*>')).Count
if($nOpen -ne 1 -or $nClose -ne 1){
  Write-Host ("ERROR: <script> が " + $nOpen + " 個、</script> が " + $nClose + " 個（どちらも1個のはず）") -ForegroundColor Red
  exit 1
}

# ── JS を取り出して node --check ──
$m = [regex]::Match($body, '(?is)<script\b[^>]*>(.*)</script\s*>')
$js = $m.Groups[1].Value
$node = Get-Command node -ErrorAction SilentlyContinue
if($node){
  # 9班が同時にビルドするので、一時ファイル名はプロセスごとに分ける（.cjs = CommonJS として構文だけ見る）
  $tmp = Join-Path $env:TEMP ("dv-check-" + $PID + ".cjs")
  [System.IO.File]::WriteAllText($tmp, $js, $enc)
  # node のエラー出力（stderr）を例外にしないよう、ここだけ Continue にして文字列で受ける
  $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try{
    $out = & $node.Source --check $tmp 2>&1 | ForEach-Object { "$_" } |
           Where-Object { $_ -notmatch '^System\.Management\.Automation\.RemoteException$' }
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $eap
    try{ [System.IO.File]::Delete($tmp) }catch{}
  }
  if($code -ne 0){
    Write-Host "ERROR: node --check に失敗しました（html は書き出していません）" -ForegroundColor Red
    $out | ForEach-Object { Write-Host ("  " + $_) }
    exit 1
  }
  Write-Output ("node --check: OK（" + [math]::Round($js.Length/1024) + " KB の JS）")
} else {
  Write-Warning "node が見つからないので構文チェックを飛ばしました"
}

# ── 圧縮（v10 波0）：連結後の JS/CSS からコメントと行頭の字下げを落とす ──
#   下の node スクリプトを %TEMP% に書き出して動かす（新しいプロジェクトファイルは作らない）。
#   失敗・自己点検の不一致・圧縮後の node --check の失敗は、html を書き出さずに exit 1。-NoMin なら圧縮しない。
if(-not $NoMin){
  if(-not $node){ Write-Host "ERROR: 圧縮には node が要ります（圧縮しないなら -NoMin）" -ForegroundColor Red; exit 1 }
  $minSrc = @'
'use strict';
/* dv-min (build.ps1 step): strip comments and indentation from the single <script> block and the <style> blocks.
   Strings, template literals, regex literals and unquoted url(...) are copied verbatim.
   Self-check: the literal list must be identical and a second pass must change nothing.
   usage: node dv-min.cjs <in.html> <out.html> <out-js.cjs> <stats.json>   (ASCII only: embedded in build.ps1) */
const fs = require('fs');

const KW_EXPR = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const KW_PAREN = new Set(['if', 'while', 'for', 'with']);
const isIdStart = c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$' || c > '\x7f';
const isIdPart = c => isIdStart(c) || (c >= '0' && c <= '9');
const isNl = c => c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
const isSp = c => c === ' ' || c === '\t' || c === '\v' || c === '\f' || c === '\u00a0' || c === '\ufeff';

function minJS(s){
  const out = [], lits = [], stack = [];
  const n = s.length;
  let i = 0, atLS = true, sp = false, prev = '', lastPunct = '', lastWord = '';
  const where = k => { const a = s.lastIndexOf('\n', k); return 'line ' + (s.slice(0, k).split('\n').length) + ': ' + s.slice(a + 1, a + 90).replace(/\s+/g, ' '); };
  const emit = t => { if (sp && !atLS) out.push(' '); sp = false; out.push(t); atLS = false; };
  const nl = () => { sp = false; if (!atLS){ out.push('\n'); atLS = true; } };
  const tmpl = j => {                       // j = first char of a template chunk; returns end and whether it stopped at ${
    let k = j;
    while (k < n){
      const c = s[k];
      if (c === '\\'){ k += 2; continue; }
      if (c === '`') return { end: k + 1, open: false };
      if (c === '$' && s[k + 1] === '{') return { end: k + 2, open: true };
      k++;
    }
    throw new Error('unterminated template: ' + where(j));
  };
  const lit = (t, x) => { emit(t); lits.push(t); prev = 'x'; lastPunct = ''; lastWord = ''; };
  while (i < n){
    const c = s[i];
    if (c === '\r'){ nl(); i++; if (s[i] === '\n') i++; continue; }
    if (isNl(c)){ nl(); i++; continue; }
    if (isSp(c)){ sp = true; i++; continue; }
    if (c === '/' && s[i + 1] === '/'){
      let k = i + 2; while (k < n && !isNl(s[k])) k++;
      i = k; sp = true; continue;
    }
    if (c === '/' && s[i + 1] === '*'){
      const k = s.indexOf('*/', i + 2);
      if (k < 0) throw new Error('unterminated comment: ' + where(i));
      if (/[\n\r\u2028\u2029]/.test(s.slice(i + 2, k))) nl(); else sp = true;
      i = k + 2; continue;
    }
    if (c === '"' || c === "'"){
      let k = i + 1;
      while (k < n && s[k] !== c){
        if (s[k] === '\\'){ k += 2; continue; }
        if (s[k] === '\n' || s[k] === '\r') throw new Error('unterminated string: ' + where(i));
        k++;
      }
      if (k >= n) throw new Error('unterminated string: ' + where(i));
      lit(s.slice(i, k + 1)); i = k + 1; continue;
    }
    if (c === '`'){
      const r = tmpl(i + 1);
      const t = s.slice(i, r.end);
      emit(t); lits.push(t); i = r.end; lastWord = '';
      if (r.open){ stack.push('T'); prev = 'r'; lastPunct = '{'; } else { prev = 'x'; lastPunct = ''; }
      continue;
    }
    if (c === '/'){
      if (prev !== 'x'){
        let k = i + 1, cls = false, ok = false;
        while (k < n){
          const d = s[k];
          if (d === '\\'){ k += 2; continue; }
          if (isNl(d)) break;
          if (cls){ if (d === ']') cls = false; }
          else if (d === '[') cls = true;
          else if (d === '/'){ ok = true; break; }
          k++;
        }
        if (ok){
          k++; while (k < n && isIdPart(s[k])) k++;
          lit(s.slice(i, k)); i = k; continue;
        }
      }
      emit('/'); i++; prev = 'r'; lastPunct = '/'; lastWord = ''; continue;
    }
    if (isIdStart(c)){
      let k = i + 1; while (k < n && isIdPart(s[k])) k++;
      const w = s.slice(i, k), member = lastPunct === '.';
      emit(w); i = k;
      prev = (!member && KW_EXPR.has(w)) ? 'r' : 'x';
      lastWord = member ? '' : w; lastPunct = '';
      continue;
    }
    if ((c >= '0' && c <= '9') || (c === '.' && s[i + 1] >= '0' && s[i + 1] <= '9')){
      let k = i + 1; while (k < n && (isIdPart(s[k]) || s[k] === '.')) k++;
      emit(s.slice(i, k)); i = k; prev = 'x'; lastPunct = ''; lastWord = ''; continue;
    }
    if (c === '{'){ emit('{'); stack.push('{'); i++; prev = 'r'; lastPunct = '{'; lastWord = ''; continue; }
    if (c === '}'){
      const top = stack.pop();
      if (top === 'T'){
        const r = tmpl(i + 1);
        const t = s.slice(i, r.end);
        emit(t); lits.push(t); i = r.end; lastWord = '';
        if (r.open){ stack.push('T'); prev = 'r'; lastPunct = '{'; } else { prev = 'x'; lastPunct = ''; }
        continue;
      }
      if (top !== '{') throw new Error('unbalanced } : ' + where(i));
      emit('}'); i++; prev = 'r'; lastPunct = '}'; lastWord = ''; continue;
    }
    if (c === '('){ emit('('); stack.push(KW_PAREN.has(lastWord) ? 'K' : '('); i++; prev = 'r'; lastPunct = '('; lastWord = ''; continue; }
    if (c === ')'){
      const top = stack.pop();
      if (top !== '(' && top !== 'K') throw new Error('unbalanced ) : ' + where(i));
      emit(')'); i++; prev = top === 'K' ? 'r' : 'x'; lastPunct = ')'; lastWord = ''; continue;
    }
    if (c === ']'){ emit(']'); i++; prev = 'x'; lastPunct = ']'; lastWord = ''; continue; }
    if ((c === '+' || c === '-') && s[i + 1] === c){ emit(c + c); i += 2; prev = 'x'; lastPunct = c; lastWord = ''; continue; }
    emit(c); i++; prev = 'r'; lastPunct = c; lastWord = '';
  }
  if (stack.length) throw new Error('unclosed ' + stack.join('') + ' at end');
  return { out: out.join(''), lits };
}

function minCSS(s){
  const out = [], lits = [];
  const n = s.length;
  let i = 0, sp = false, last = '';
  const hard = c => c === '{' || c === '}' || c === ';' || c === ',';
  const emit = t => {
    if (sp && last !== '' && !hard(last) && !hard(t[0])) out.push(' ');
    sp = false; out.push(t); last = t[t.length - 1];
  };
  const ws = c => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';
  while (i < n){
    const c = s[i];
    if (c === '/' && s[i + 1] === '*'){
      const k = s.indexOf('*/', i + 2);
      if (k < 0) throw new Error('css: unterminated comment');
      const before = i > 0 ? s[i - 1] : ' ', after = k + 2 < n ? s[k + 2] : ' ';
      if (ws(before) || ws(after) || hard(before) || hard(after) || sp) sp = true;
      else emit('/**/');                     // x/**/y: keep the tokens apart
      i = k + 2; continue;
    }
    if (ws(c)){ sp = true; i++; continue; }
    if (c === '"' || c === "'"){
      let k = i + 1;
      while (k < n && s[k] !== c){
        if (s[k] === '\\'){ k += 2; continue; }
        if (s[k] === '\n') throw new Error('css: unterminated string');
        k++;
      }
      const t = s.slice(i, k + 1); emit(t); lits.push(t); i = k + 1; continue;
    }
    if (c === '\\'){ emit(s.slice(i, i + 2)); i += 2; continue; }
    if ((c === 'u' || c === 'U') && /^url\(/i.test(s.slice(i, i + 4)) && !(i > 0 && /[\w-]/.test(s[i - 1]))){
      let k = i + 4; while (k < n && ws(s[k])) k++;
      if (s[k] !== '"' && s[k] !== "'"){
        const e = s.indexOf(')', k);
        if (e < 0) throw new Error('css: unterminated url(');
        const t = s.slice(i, e + 1); emit(t); lits.push(t); i = e + 1; continue;
      }
    }
    emit(c); i++;
  }
  return { out: out.join(''), lits };
}

function twice(fn, src, name){
  const a = fn(src), b = fn(a.out);
  if (a.lits.length !== b.lits.length || a.lits.some((x, k) => x !== b.lits[k])) throw new Error(name + ': literal list changed on the 2nd pass');
  if (a.out !== b.out) throw new Error(name + ': 2nd pass is not identical');
  return a.out;
}

const [inF, outF, jsF, stF] = process.argv.slice(2);
const body = fs.readFileSync(inF, 'utf8');
const mo = /<script\b[^>]*>/i.exec(body);
if (!mo) throw new Error('no <script>');
const js0 = mo.index + mo[0].length;
const mc = /<\/script\s*>/i.exec(body.slice(js0));
if (!mc) throw new Error('no </script>');
const js1 = js0 + mc.index;
const B = x => Buffer.byteLength(x, 'utf8');
const st = { js_before: 0, js_after: 0, css_before: 0, css_after: 0, style_blocks: 0 };
const cssPart = part => part.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (m, a, css, z) => {
  const o = twice(minCSS, css, 'css#' + (++st.style_blocks));
  st.css_before += B(css); st.css_after += B(o);
  return a + o + z;
});
const jsIn = body.slice(js0, js1);
const jsOut = twice(minJS, jsIn, 'js');
st.js_before = B(jsIn); st.js_after = B(jsOut);
const outBody = cssPart(body.slice(0, js0)) + jsOut + cssPart(body.slice(js1));
st.total_before = st.js_before + st.css_before;
st.total_after = st.js_after + st.css_after;
st.cut_pct = Math.round((1 - st.total_after / st.total_before) * 1000) / 10;
fs.writeFileSync(outF, outBody, 'utf8');
fs.writeFileSync(jsF, jsOut, 'utf8');
fs.writeFileSync(stF, JSON.stringify(st), 'utf8');
process.stdout.write('min: JS ' + Math.round(st.js_before / 1024) + '->' + Math.round(st.js_after / 1024) + ' KB, CSS '
  + Math.round(st.css_before / 1024) + '->' + Math.round(st.css_after / 1024) + ' KB (' + st.style_blocks + ' blocks), JS+CSS -' + st.cut_pct + '%\n');
'@
  $mtag = Join-Path $env:TEMP ("dv-min-" + $PID)
  $mjs = $mtag + ".cjs"; $min_in = $mtag + "-in.html"; $min_out = $mtag + "-out.html"; $min_js = $mtag + "-js.cjs"; $min_st = $mtag + "-st.json"
  [System.IO.File]::WriteAllText($mjs, $minSrc, $enc)
  [System.IO.File]::WriteAllText($min_in, $body, $enc)
  $body2 = $null; $mst = $null; $mout = @(); $cout = @(); $mcode = -1; $ccode = -1
  $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try{
    $mout = & $node.Source $mjs $min_in $min_out $min_js $min_st 2>&1 | ForEach-Object { "$_" } |
            Where-Object { $_ -notmatch '^System\.Management\.Automation\.RemoteException$' }
    $mcode = $LASTEXITCODE
    if($mcode -eq 0){
      $cout = & $node.Source --check $min_js 2>&1 | ForEach-Object { "$_" } |
              Where-Object { $_ -notmatch '^System\.Management\.Automation\.RemoteException$' }
      $ccode = $LASTEXITCODE
      if($ccode -eq 0){
        $body2 = [System.IO.File]::ReadAllText($min_out, [System.Text.Encoding]::UTF8)
        $mst = [System.IO.File]::ReadAllText($min_st, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
      }
    }
  } finally {
    $ErrorActionPreference = $eap
    foreach($f in @($mjs, $min_in, $min_out, $min_js, $min_st)){ try{ [System.IO.File]::Delete($f) }catch{} }
  }
  if($mcode -ne 0){
    Write-Host "ERROR: 圧縮に失敗しました（html は書き出していません。-NoMin なら圧縮なしでビルドできます）" -ForegroundColor Red
    $mout | ForEach-Object { Write-Host ("  " + $_) }
    exit 1
  }
  if($ccode -ne 0){
    Write-Host "ERROR: 圧縮後の JS が node --check に通りません（html は書き出していません。-NoMin なら圧縮なし）" -ForegroundColor Red
    $cout | ForEach-Object { Write-Host ("  " + $_) }
    exit 1
  }
  $n2o = ([regex]::Matches($body2, '(?i)<script\b[^>]*>')).Count
  $n2c = ([regex]::Matches($body2, '(?i)</script\s*>')).Count
  if($n2o -ne 1 -or $n2c -ne 1){ Write-Host "ERROR: 圧縮後の <script> / </script> の数が合いません" -ForegroundColor Red; exit 1 }
  $body = $body2
  Write-Output ("圧縮: JS " + [math]::Round($mst.js_before/1024) + " -> " + [math]::Round($mst.js_after/1024) + " KB、CSS " +
                [math]::Round($mst.css_before/1024) + " -> " + [math]::Round($mst.css_after/1024) + " KB（JS+CSS -" + $mst.cut_pct +
                "%、圧縮後の node --check: OK）")
} else {
  Write-Output "圧縮: しない（-NoMin）"
}

# ── BGM：assets/bgm/ にファイルがあれば自動で組み込む ──
#   index.html は相対パス、game.html(Artifact) は外部ファイルを読めないので data URI
$names = @("lobby","game","tense","win","room","gacha","boss","result")
$exts  = @("mp3","ogg","m4a","wav")
$rel = @{}; $dat = @{}; $total = 0
foreach($n in $names){
  foreach($e in $exts){
    $f = Join-Path "$d\assets\bgm" "$n.$e"
    if(Test-Path $f){
      $rel[$n] = "assets/bgm/$n.$e"
      $bytes = [System.IO.File]::ReadAllBytes($f)
      $total += $bytes.Length
      $mime = switch($e){ "mp3"{"audio/mpeg"} "ogg"{"audio/ogg"} "m4a"{"audio/mp4"} default{"audio/wav"} }
      $dat[$n] = "data:$mime;base64," + [Convert]::ToBase64String($bytes)
      break
    }
  }
}
function BgmBlock($map){
  if($map.Count -eq 0){ return "" }
  $pairs = ($map.GetEnumerator() | ForEach-Object { '"' + $_.Key + '":"' + $_.Value + '"' }) -join ","
  return "<script>window.DV_BGM={$pairs};</script>`n"
}
if($rel.Count -gt 0){
  Write-Output ("BGM: " + ($rel.Keys -join ", ") + "  (合計 " + [math]::Round($total/1MB,1) + " MB)")
} else {
  Write-Output "BGM: ファイル無し → 合成音で動きます（assets/bgm/README.md 参照）"
}


# ── キャラ画像：assets/chars/ にファイルがあれば自動で差しかえる ──
#   c01…c11 = 立ち絵 / t01…t11 = 盤のコマ。CARDPOOL のカードID と同じ名前
#   index.html は相対パス、game.html(Artifact) は外部ファイルを読めないので data URI
$cnames = @()
for($i=1; $i -le 24; $i++){ $cnames += ("c{0:d2}" -f $i) }
for($i=1; $i -le 24; $i++){ $cnames += ("t{0:d2}" -f $i) }
$cexts = @("png","webp","jpg","jpeg")
$crel = @{}; $cdat = @{}; $ctotal = 0
foreach($n in $cnames){
  foreach($e in $cexts){
    $f = Join-Path "$d\assets\chars" "$n.$e"
    if(Test-Path $f){
      $crel[$n] = "assets/chars/$n.$e"
      $bytes = [System.IO.File]::ReadAllBytes($f)
      $ctotal += $bytes.Length
      $mime = switch($e){ "png"{"image/png"} "webp"{"image/webp"} default{"image/jpeg"} }
      $cdat[$n] = "data:$mime;base64," + [Convert]::ToBase64String($bytes)
      break
    }
  }
}
function CharBlock($map){
  if($map.Count -eq 0){ return "" }
  $pairs = ($map.GetEnumerator() | ForEach-Object { '"' + $_.Key + '":"' + $_.Value + '"' }) -join ","
  return "<script>window.DV_CHARIMG={$pairs};</script>`n"
}
$cdatUse = $cdat
if($crel.Count -gt 0){
  Write-Output ("キャラ画像: " + (($crel.Keys | Sort-Object) -join ", ") + "  (合計 " + [math]::Round($ctotal/1MB,2) + " MB)")
  if($ctotal -gt 10MB){
    $cdatUse = @{}
    Write-Warning ("キャラ画像の合計が 10MB を超えています（" + [math]::Round($ctotal/1MB,2) + " MB）。game.html への埋め込みをやめました。index.html だけ画像を使います。画像を小さくしてください（推奨 立ち絵480×680px・コマ200×280px）。")
  }
} else {
  Write-Output "キャラ画像: ファイル無し → これまでどおりの手続き描画で動きます（assets/chars/README.md 参照）"
}

# 2 画面素材：assets/ui/ の画像（社長が用意した絵から切り出したもの）
#   ロゴ・背景・主役の絵。window.DV_UI に「名前 -> URL」で入る
$urel = @{}; $udat = @{}; $utotal = 0
$udir = "$d/assets/ui"
if(Test-Path $udir){
  foreach($f in (Get-ChildItem $udir -File)){
    if($f.Extension -notmatch "^[.](png|webp|jpg|jpeg)$"){ continue }
    $n = $f.BaseName
    $urel[$n] = "assets/ui/" + $f.Name
    $ub = [System.IO.File]::ReadAllBytes($f.FullName)
    $utotal += $ub.Length
    $umime = switch($f.Extension){ ".png"{"image/png"} ".webp"{"image/webp"} default{"image/jpeg"} }
    $udat[$n] = "data:$umime;base64," + [Convert]::ToBase64String($ub)
  }
}
function UiBlock($map){
  if($map.Count -eq 0){ return "" }
  $pairs = ($map.GetEnumerator() | ForEach-Object { '"' + $_.Key + '":"' + $_.Value + '"' }) -join ","
  return "<script>window.DV_UI={$pairs};</script>`n"
}
if($urel.Count -gt 0){
  Write-Output ("画面素材: " + $urel.Count + " 点  (合計 " + [math]::Round($utotal/1MB,2) + " MB)")
}
# 2b 共通スキンの素材：assets/ui2/ の画像（お手本の絵から切り出した背景・金の彫り枠・主役の絵）
#   window.DV_UI2 に「名前 -> URL」で入る。当て方は src/1w-skin.html（.sk-）と src/8b-skin.js（dkskApply）
#   index.html は相対パス、game.html(Artifact) は外部ファイルを読めないので data URI
$u2rel = @{}; $u2dat = @{}; $u2total = 0
$u2dir = "$d/assets/ui2"
if(Test-Path $u2dir){
  foreach($f in (Get-ChildItem $u2dir -File)){
    if($f.Extension -notmatch "^[.](png|webp|jpg|jpeg)$"){ continue }
    $n = $f.BaseName
    $u2rel[$n] = "assets/ui2/" + $f.Name
    $ub2 = [System.IO.File]::ReadAllBytes($f.FullName)
    $u2total += $ub2.Length
    $u2mime = switch($f.Extension){ ".png"{"image/png"} ".webp"{"image/webp"} default{"image/jpeg"} }
    $u2dat[$n] = "data:$u2mime;base64," + [Convert]::ToBase64String($ub2)
  }
}
function Ui2Block($map){
  if($map.Count -eq 0){ return "" }
  $pairs = ($map.GetEnumerator() | ForEach-Object { '"' + $_.Key + '":"' + $_.Value + '"' }) -join ","
  return "<script>window.DV_UI2={$pairs};</script>`n"
}
if($u2rel.Count -gt 0){
  Write-Output ("共通スキンの素材: " + $u2rel.Count + " 点  (合計 " + [math]::Round($u2total/1KB) + " KB)")
  if($u2total -gt 1.5MB){
    Write-Warning ("assets/ui2 の合計が 1.5MB を超えています（" + [math]::Round($u2total/1MB,2) + " MB）。game.html は素材を data URI で埋め込むので、絵を小さく（または品質を下げて）ください。")
  }
}
Write-Output ("連結: " + $used.Count + " ファイル（" + ($used -join ", ") + "）")
[System.IO.File]::WriteAllText("$d\game.html",  (BgmBlock $dat) + (CharBlock $cdatUse) + (UiBlock $udat) + (Ui2Block $u2dat) + $body, $enc)
$head = "<!doctype html>`n<html lang=`"ja`">`n<head>`n<meta charset=`"utf-8`">`n" +
        "<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no`">`n" +
        "<meta name=`"description`" content=`"ダイスボヤージュ — 横画面で遊ぶボードゲーム`">`n"
$full = $head + (BgmBlock $rel) + (CharBlock $crel) + (UiBlock $urel) + (Ui2Block $u2rel) + $body + "`n</html>"
$full = $full -replace '(?s)^(.*?)(<div id="viewport">)', '$1</head><body>$2'
[System.IO.File]::WriteAllText("$d\index.html", $full, $enc)
Write-Output ("game.html  = " + [math]::Round((Get-Item "$d\game.html").Length/1024) + " KB")
Write-Output ("index.html = " + [math]::Round((Get-Item "$d\index.html").Length/1024) + " KB")
if((Get-Item "$d\game.html").Length -gt 15MB){
  Write-Warning "game.html が 15MB 超。Artifactの上限は16MBです。BGMを軽くしてください。"
}
exit 0
