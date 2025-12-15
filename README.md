# Google Photos Clone - Backend API

REST API backend cho ứng dụng Google Photos Clone, được xây dựng bằng Laravel 12.

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)
- [Queue Workers](#queue-workers)
- [Testing](#testing)
- [Deployment](#deployment)
- [Frontend](#frontend)

## 📖 Giới thiệu

Đây là backend API REST cho ứng dụng Google Photos Clone, cung cấp các chức năng:

- ✅ Authentication & Authorization (Laravel Sanctum)
- ✅ Quản lý ảnh và video (upload, delete, favorite, trash)
- ✅ Album management
- ✅ Friend system (kết bạn, block)
- ✅ Chia sẻ (share với bạn bè, share link công khai)
- ✅ Thông báo real-time
- ✅ Storage quota tracking
- ✅ Background jobs (thumbnail generation, image optimization, metadata extraction)

## 🔧 Yêu cầu hệ thống

- PHP >= 8.2
- Composer
- MySQL >= 8.0 hoặc SQLite >= 3
- Node.js >= 18 (cho frontend assets nếu có)
- FFmpeg (tùy chọn, cho video thumbnail extraction)
- PHP Extensions:
  - GD hoặc Imagick (cho image processing)
  - EXIF (cho metadata extraction)

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd GooglePhotos
```

### 2. Cài đặt dependencies

```bash
composer install
```

### 3. Cấu hình môi trường

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Cấu hình database trong `.env`

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=photos
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

Hoặc sử dụng SQLite:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

### 5. Chạy migrations

```bash
php artisan migrate
```

### 6. Tạo symbolic link cho storage

```bash
php artisan storage:link
```

## ⚙️ Cấu hình

### Environment Variables quan trọng

```env
# Application
APP_NAME="Google Photos Clone"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=photos
DB_USERNAME=root
DB_PASSWORD=

# Storage
FILESYSTEM_DISK=public

# Queue
QUEUE_CONNECTION=database

# Frontend URL (cho CORS)
FRONTEND_URL=http://localhost:3000

# FFmpeg path (tùy chọn)
FFMPEG_PATH=ffmpeg

# Storage quota (bytes)
DEFAULT_STORAGE_QUOTA=10737418240  # 10GB
```

### Cấu hình CORS

File `config/cors.php` đã được cấu hình để cho phép frontend từ:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://192.168.1.8:3000` (LAN access)

Có thể thêm domain khác trong file này hoặc thông qua `.env`:

```env
FRONTEND_URL=http://localhost:3000,http://192.168.1.8:3000
```

## 🏃 Chạy ứng dụng

### Development server

```bash
php artisan serve
```

Server sẽ chạy tại `http://localhost:8000`

### Chạy trên tất cả network interfaces (cho LAN access)

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

### Queue Worker (quan trọng!)

Queue worker xử lý các background jobs như:
- Generate thumbnail
- Optimize images
- Extract metadata

```bash
php artisan queue:work
```

Hoặc với retry và timeout:

```bash
php artisan queue:work --tries=3 --timeout=90
```

**Lưu ý**: Queue worker phải chạy song song với server để các job được xử lý.

## 📁 Cấu trúc dự án

```
GooglePhotos/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/          # API Controllers
│   │           ├── AlbumController.php
│   │           ├── AuthController.php
│   │           ├── FriendController.php
│   │           ├── NotificationController.php
│   │           ├── PhotoController.php
│   │           ├── ProfileController.php
│   │           ├── ShareController.php
│   │           └── ShareLinkController.php
│   ├── Jobs/                 # Background Jobs
│   │   ├── ExtractMetadata.php
│   │   ├── GenerateThumbnail.php
│   │   └── OptimizeImage.php
│   ├── Models/               # Eloquent Models
│   └── Services/             # Business Logic
├── config/
│   ├── cors.php              # CORS configuration
│   └── sanctum.php           # Sanctum configuration
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
├── routes/
│   ├── api.php               # API routes
│   └── web.php               # Web routes (minimal)
├── storage/
│   └── app/
│       └── public/           # Uploaded files
├── docker-compose.yml        # Docker configuration
└── README.md
```

## 📚 API Documentation

### Base URL

```
http://localhost:8000/api
```

### Authentication

API sử dụng Laravel Sanctum với Bearer Token authentication.

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "data": {
    "user": { ... },
    "token": "1|xxxxx"
  }
}
```

**Sử dụng token:**
```http
Authorization: Bearer 1|xxxxx
```

### Main Endpoints

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/user` - Lấy thông tin user

- `GET /api/photos` - Danh sách ảnh
- `POST /api/photos` - Upload ảnh/video
- `GET /api/photos/{id}` - Chi tiết ảnh
- `DELETE /api/photos/{id}` - Xóa ảnh
- `POST /api/photos/{id}/favorite` - Toggle favorite
- `GET /api/photos/{id}/download` - Download ảnh

- `GET /api/albums` - Danh sách albums
- `POST /api/albums` - Tạo album
- `GET /api/albums/{id}` - Chi tiết album
- `PUT /api/albums/{id}/cover` - Đặt ảnh bìa

- `GET /api/friends` - Danh sách bạn bè
- `POST /api/friends` - Gửi yêu cầu kết bạn
- `PATCH /api/friends/{id}` - Chấp nhận yêu cầu

- `GET /api/share-links` - Danh sách share links
- `POST /api/share-links` - Tạo share link
- `DELETE /api/share-links/{id}` - Xóa share link

Xem thêm trong Postman Collection: `postman/Google_Photos_Clone_API.postman_collection.json`

## 🔄 Queue Workers

### Jobs trong hệ thống

1. **GenerateThumbnail** - Tạo thumbnail cho ảnh/video
2. **OptimizeImage** - Tối ưu kích thước ảnh
3. **ExtractMetadata** - Trích xuất metadata từ ảnh (EXIF, GPS)

### Chạy Queue Worker

```bash
php artisan queue:work
```

### Xem failed jobs

```bash
php artisan queue:failed
```

### Retry failed jobs

```bash
php artisan queue:retry all
```

## 🧪 Testing

```bash
php artisan test
```

Hoặc với PHPUnit:

```bash
./vendor/bin/phpunit
```

## 🐳 Deployment với Docker

### Sử dụng Docker Compose

```bash
docker-compose up -d
```

Docker Compose sẽ chạy:
- **app** - Laravel application
- **web** - Nginx server (port 8080)
- **db** - MySQL database (port 3307)
- **queue** - Queue worker
- **scheduler** - Task scheduler

### Truy cập

- Application: `http://localhost:8080`
- Database: `localhost:3307`

## 🌐 Frontend

Frontend là một ứng dụng Next.js riêng biệt. Xem repository:

[gpc-frontend](https://github.com/pqchien1905/gpc-frontend)

## 📝 Notes

### Storage

- Files được lưu trong `storage/app/public/`
- Symbolic link từ `public/storage` -> `storage/app/public`
- Cần chạy `php artisan storage:link` sau khi clone

### Thumbnails

- Thumbnails được tự động tạo khi upload
- Lưu trong `storage/app/public/photos/thumbs/` (ảnh)
- Lưu trong `storage/app/public/videos/thumbs/` (video)
- Video thumbnails yêu cầu FFmpeg

### Storage Quota

- Mỗi user có storage quota mặc định (10GB)
- Quota được kiểm tra khi upload
- Có thể cấu hình trong `.env`: `DEFAULT_STORAGE_QUOTA`

## 🤝 Contributing

1. Tạo branch mới từ `main`
2. Commit changes
3. Tạo Pull Request

Xem [Git Workflow](docs/GIT_WORKFLOW.md) để biết thêm chi tiết.

## 📄 License

MIT

## 🔗 Links

- [API Documentation](docs/api/API_DOCUMENTATION.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)
- [Task Assignment](docs/TASK_ASSIGNMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
