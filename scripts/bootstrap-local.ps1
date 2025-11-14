# Bootstrap locally (no Docker): requires PHP 8.3+, Composer, Node 20+
$ErrorActionPreference = "Stop"

if (-Not (Get-Command composer -ErrorAction SilentlyContinue)) { throw "Composer not found. Install Composer first." }
if (-Not (Get-Command php -ErrorAction SilentlyContinue)) { throw "PHP not found. Install PHP 8.3+ and ensure it's on PATH." }

if (-Not (Test-Path .\.env)) {
  if (Test-Path .\.env.example) { Copy-Item .\.env.example .\.env }
}

if (-Not (Test-Path .\database)) { New-Item -ItemType Directory -Force -Path .\database | Out-Null }
if (-Not (Test-Path .\database\database.sqlite)) { New-Item -ItemType File -Path .\database\database.sqlite | Out-Null }

if (-Not (Test-Path .\\artisan)) {
  # If directory is not empty, scaffold in a temp folder then merge
  $isEmpty = -Not (Get-ChildItem -Force | Where-Object { $_.Name -notin @(".", "..") })
  if ($isEmpty) {
    composer create-project laravel/laravel:^12.0 .
  } else {
    $tmp = ".\\.laravel-tmp"
    if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
    composer create-project laravel/laravel:^12.0 $tmp
    # Move contents from tmp into root, preserving existing files
    Get-ChildItem $tmp -Force | ForEach-Object {
      $dest = Join-Path "." $_.Name
      if (Test-Path $dest) {
        # Merge directories, overwrite files if needed
        if ($_.PSIsContainer) {
          Copy-Item -Recurse -Force $_.FullName $dest
        } else {
          Copy-Item -Force $_.FullName $dest
        }
      } else {
        Move-Item $_.FullName $dest
      }
    }
    Remove-Item -Recurse -Force $tmp
  }
}

php artisan key:generate
php artisan storage:link

composer require laravel/breeze --dev
php artisan breeze:install react --typescript

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  pnpm i
} elseif (Get-Command yarn -ErrorAction SilentlyContinue) {
  yarn
} else {
  npm install
}

Write-Host "Bootstrap complete. Run dev with ./scripts/dev-local.ps1"