# Run dev servers (nginx + php-fpm + queue + scheduler + Vite)
$ErrorActionPreference = "Stop"

docker compose up -d web app db queue scheduler

docker compose run --rm node sh -lc "npm run dev"
