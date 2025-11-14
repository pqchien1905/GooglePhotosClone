# Bootstrap the Laravel + Inertia + React + TS app inside Docker
param(
  [switch]$WithBreeze
)

$ErrorActionPreference = "Stop"

Write-Host "Building containers..."
docker compose build

# Ensure storage and database folders exist
New-Item -ItemType Directory -Force -Path .\storage | Out-Null
New-Item -ItemType Directory -Force -Path .\database | Out-Null

# Create SQLite file for quick local runs
if (-Not (Test-Path .\database\database.sqlite)) {
  New-Item -ItemType File -Path .\database\database.sqlite | Out-Null
}

# Copy env if missing
if (-Not (Test-Path .\.env)) {
  Copy-Item .\.env.example .\.env
}

Write-Host "Creating Laravel project (this may take a while)..."
docker compose run --rm app bash -lc "\
  if [ ! -f artisan ]; then \
    composer create-project laravel/laravel:^12.0 .; \
  fi && \
  php artisan key:generate && \
  php artisan storage:link"

if ($WithBreeze) {
  Write-Host "Installing Breeze (Inertia React + TS)..."
  docker compose run --rm app bash -lc "\
    composer require laravel/breeze --dev && \
    php artisan breeze:install react --typescript && \
    npm ci || npm install"
}

Write-Host "Upgrading Tailwind and Shadcn UI base..."
docker compose run --rm node sh -lc "\
  npm i -D tailwindcss postcss autoprefixer class-variance-authority tailwind-merge lucide-react @radix-ui/react-icons && \
  npm i sonner @tanstack/react-virtual @tanstack/react-query axios"

Write-Host "Done. Next: docker compose up -d; then open http://localhost:8080"
