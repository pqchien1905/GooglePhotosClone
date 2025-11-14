$phpIni = 'C:\xampp\php\php.ini'
$content = Get-Content $phpIni
$newContent = $content -replace ';extension=gd', 'extension=gd'
Set-Content -Path $phpIni -Value $newContent
Write-Host "GD extension enabled in php.ini"
