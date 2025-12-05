# Google Photos Clone - Backend API

REST API backend built with Laravel 12 + Sanctum.

## Tech Stack
- Laravel 12
- SQLite/MySQL
- Laravel Sanctum (API Authentication)
- Intervention Image v3

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

## API Documentation
- Postman Collection: `postman/Google_Photos_Clone_API.postman_collection.json`
- API runs on: `http://localhost:8000/api`

## Frontend
Frontend is in a separate repository: [gpc-frontend](https://github.com/pqchien1905/gpc-frontend)

## Documentation
- [API Documentation](docs/api/API_DOCUMENTATION.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)
- [Task Assignment](docs/TASK_ASSIGNMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
