# Run backend and frontend tests inside containers
$ErrorActionPreference = "Stop"

docker compose run --rm app bash -lc "php artisan test"

docker compose run --rm node sh -lc "npm test || npm run test"
