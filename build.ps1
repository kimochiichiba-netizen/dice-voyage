# ダイスボヤージュ ビルド
# src/ を結合して game.html（Artifact用）と index.html（単体で開ける版）を作る
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$enc = New-Object System.Text.UTF8Encoding($false)
$parts = @("1-style.html","1b-ui.html","1c-meta.html","1d-polish.html","2-body.html","3-core.js","3b-art.js","3c-chars.js","6-audio.js","4-game.js","5-meta.js")
$sb = New-Object System.Text.StringBuilder
foreach($p in $parts){
  $f = Join-Path "$d\src" $p
  if(-not (Test-Path $f)){ Write-Error "missing: $p"; exit 1 }
  [void]$sb.AppendLine([System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8))
}
[System.IO.File]::WriteAllText("$d\game.html", $sb.ToString(), $enc)
$full = "<!doctype html>`n<html lang=`"ja`">`n<head>`n<meta charset=`"utf-8`">`n<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no`">`n" + $sb.ToString() + "`n</html>"
$full = $full -replace '(?s)^(.*?)(<div id="viewport">)', '$1</head><body>$2'
[System.IO.File]::WriteAllText("$d\index.html", $full, $enc)
Write-Output ("game.html  = " + [math]::Round((Get-Item "$d\game.html").Length/1024) + " KB")
Write-Output ("index.html = " + [math]::Round((Get-Item "$d\index.html").Length/1024) + " KB")
