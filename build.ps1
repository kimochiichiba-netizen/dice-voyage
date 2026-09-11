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
           "2-body.html",
           "3-core.js","3b-art.js","3e-style.js",
           "6-audio.js","6b-bgm.js","6c-bgm2.js","6d-jingle.js","4-game.js","7-online.js","5-meta.js","8-dk.js",
           "9-fx.js","9a-core.js","9b-pend.js","9c-cards.js","9d-flow.js","9e-match.js","9f-tiles.js",
           "9g-turn.js","9h-board.js","9i-shop.js","9j-home.js",
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
Write-Output ("連結: " + $used.Count + " ファイル（" + ($used -join ", ") + "）")
[System.IO.File]::WriteAllText("$d\game.html",  (BgmBlock $dat) + (CharBlock $cdatUse) + (UiBlock $udat) + $body, $enc)
$head = "<!doctype html>`n<html lang=`"ja`">`n<head>`n<meta charset=`"utf-8`">`n" +
        "<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no`">`n" +
        "<meta name=`"description`" content=`"ダイスボヤージュ — 横画面で遊ぶボードゲーム`">`n"
$full = $head + (BgmBlock $rel) + (CharBlock $crel) + (UiBlock $urel) + $body + "`n</html>"
$full = $full -replace '(?s)^(.*?)(<div id="viewport">)', '$1</head><body>$2'
[System.IO.File]::WriteAllText("$d\index.html", $full, $enc)
Write-Output ("game.html  = " + [math]::Round((Get-Item "$d\game.html").Length/1024) + " KB")
Write-Output ("index.html = " + [math]::Round((Get-Item "$d\index.html").Length/1024) + " KB")
if((Get-Item "$d\game.html").Length -gt 15MB){
  Write-Warning "game.html が 15MB 超。Artifactの上限は16MBです。BGMを軽くしてください。"
}
exit 0
