# Run dev locally (no Docker)
$ErrorActionPreference = "Stop"

if (-Not (Test-Path .\artisan)) { throw "artisan not found. Run scripts/bootstrap-local.ps1 first." }

Start-Process -NoNewWindow -FilePath powershell -ArgumentList "php artisan serve"

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  pnpm run dev
} elseif (Get-Command yarn -ErrorAction SilentlyContinue) {
  yarn dev
} else {
  npm run dev
}
