# ダイスボヤージュ ビルド
# src/ の4ファイルを結合して game.html（Artifact用）と index.html（単体で開ける版）を作る
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$enc = New-Object System.Text.UTF8Encoding($false)
$sb = New-Object System.Text.StringBuilder
foreach($p in @("1-style.html","2-body.html","3-core.js","4-game.js")){
  [void]$sb.AppendLine([System.IO.File]::ReadAllText((Join-Path "$d\src" $p), [System.Text.Encoding]::UTF8))
}
[System.IO.File]::WriteAllText("$d\game.html", $sb.ToString(), $enc)
$full = "<!doctype html>`n<html lang=`"ja`">`n<head>`n<meta charset=`"utf-8`">`n<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no`">`n" + $sb.ToString() + "`n</html>"
$full = $full -replace '(?s)^(.*?)(<div id="viewport">)', '$1</head><body>$2'
[System.IO.File]::WriteAllText("$d\index.html", $full, $enc)
Write-Output ("game.html  = " + (Get-Item "$d\game.html").Length + " bytes")
Write-Output ("index.html = " + (Get-Item "$d\index.html").Length + " bytes")
