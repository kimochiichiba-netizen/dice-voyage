# ダイスボヤージュ ビルド
# src/ を結合して game.html（Artifact用）と index.html（単体で開ける版）を作る
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$enc = New-Object System.Text.UTF8Encoding($false)
$parts = @("1-style.html","1b-ui.html","1c-meta.html","1d-polish.html","2-body.html",
           "3-core.js","3b-art.js","3c-chars.js","3d-gems.js","3e-style.js","3f-anime.js","3g-opm.js",
           "6-audio.js","6b-bgm.js","6c-bgm2.js","6d-jingle.js","4-game.js","5-meta.js")
$sb = New-Object System.Text.StringBuilder
foreach($p in $parts){
  $f = Join-Path "$d\src" $p
  if(-not (Test-Path $f)){ Write-Error "missing: $p"; exit 1 }
  [void]$sb.AppendLine([System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8))
}
$body = $sb.ToString()

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
for($i=1; $i -le 11; $i++){ $cnames += ("c{0:d2}" -f $i) }
for($i=1; $i -le 11; $i++){ $cnames += ("t{0:d2}" -f $i) }
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

[System.IO.File]::WriteAllText("$d\game.html", (BgmBlock $dat) + (CharBlock $cdatUse) + $body, $enc)
$head = "<!doctype html>`n<html lang=`"ja`">`n<head>`n<meta charset=`"utf-8`">`n" +
        "<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no`">`n" +
        "<meta name=`"description`" content=`"ダイスボヤージュ — 横画面で遊ぶボードゲーム`">`n"
$full = $head + (BgmBlock $rel) + (CharBlock $crel) + $body + "`n</html>"
$full = $full -replace '(?s)^(.*?)(<div id="viewport">)', '$1</head><body>$2'
[System.IO.File]::WriteAllText("$d\index.html", $full, $enc)
Write-Output ("game.html  = " + [math]::Round((Get-Item "$d\game.html").Length/1024) + " KB")
Write-Output ("index.html = " + [math]::Round((Get-Item "$d\index.html").Length/1024) + " KB")
if((Get-Item "$d\game.html").Length -gt 15MB){
  Write-Warning "game.html が 15MB 超。Artifactの上限は16MBです。BGMを軽くしてください。"
}
