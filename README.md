# 📸 Google Photos Clone

Ứng dụng quản lý ảnh và video cá nhân với giao diện giống Google Photos, được xây dựng bằng Laravel 12, Inertia.js, React 19 và TypeScript.

![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat&logo=laravel)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)
![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat&logo=php)

## ✨ Tính năng chính

### 📷 Quản lý Ảnh & Video
- ✅ **Upload đa phương tiện**: Hỗ trợ ảnh (JPG, PNG, GIF, WebP) và video (MP4, MOV, AVI, WMV, FLV, WEBM, MKV)
- ✅ **Xem dạng lưới**: Grid layout responsive với masonry layout tự động
- ✅ **Xem chi tiết**: Modal viewer với navigation, EXIF data, metadata
- ✅ **Thùng rác**: Soft delete, restore, xóa vĩnh viễn
- ✅ **Yêu thích**: Đánh dấu và lọc ảnh/video yêu thích
- ✅ **Video thumbnails**: Tự động tạo thumbnail cho video

### 📁 Albums
- ✅ **Tạo album**: Tạo album mới, thêm/xóa ảnh, đặt ảnh bìa
- ✅ **Quản lý album**: Đổi tên, xóa album
- ✅ **Album tự động**: Tự động tạo album theo ngày chụp (artisan command)
- ✅ **Xem album**: Grid layout với thông tin chi tiết

### 🔗 Chia sẻ
- ✅ **Link công khai**: Tạo link chia sẻ với token, hỗ trợ hết hạn
- ✅ **Chia sẻ bạn bè**: Chia sẻ ảnh/album với bạn bè trong hệ thống
- ✅ **Chia sẻ email**: Gửi email với link chia sẻ và preview
- ✅ **Theo dõi chia sẻ**: Xem danh sách đã gửi và đã nhận
- ✅ **Xem chia sẻ**: Trang công khai để xem nội dung được chia sẻ

### 👥 Bạn bè
- ✅ **Kết bạn**: Gửi/yêu cầu kết bạn
- ✅ **Quản lý**: Chấp nhận, từ chối, xóa, chặn bạn bè
- ✅ **Danh sách**: Xem tất cả bạn bè và yêu cầu đang chờ

### 🔔 Thông báo
- ✅ **Real-time**: Thông báo khi nhận chia sẻ hoặc yêu cầu kết bạn
- ✅ **Inbox**: Trang quản lý thông báo với đánh dấu đã đọc

### 🎨 Giao diện
- ✅ **Google Photos Style**: Layout giống Google Photos với sidebar, search bar, user menu
- ✅ **Dark Mode**: Hỗ trợ dark/light theme
- ✅ **Responsive**: Tối ưu cho mobile, tablet, desktop
- ✅ **Vietnamese UI**: Giao diện tiếng Việt hoàn chỉnh

### ⚙️ Tính năng nâng cao
- ✅ **Storage quota**: Theo dõi dung lượng lưu trữ (mặc định 10GB/user)
- ✅ **Metadata extraction**: Tự động trích xuất EXIF, location, date
- ✅ **Image optimization**: Tối ưu ảnh tự động với Intervention Image
- ✅ **Thumbnail generation**: Tự động tạo thumbnail cho ảnh
- ✅ **Queue system**: Xử lý background jobs cho image processing
- ✅ **Caching**: Query caching để tăng hiệu suất
- ✅ **Search & Filters**: Tìm kiếm và lọc theo ngày, kích thước, định dạng

## 🛠️ Công nghệ sử dụng

### Backend
- **Framework**: Laravel 12.x
- **PHP**: 8.2+
- **Database**: MySQL/SQLite
- **Xử lý ảnh**: Intervention Image v3
- **Queue**: Database/Redis queue system
- **Xác thực**: Laravel Breeze

### Frontend
- **Framework**: React 19
- **Ngôn ngữ**: TypeScript
- **SSR**: Inertia.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Headless UI
- **Icons**: Lucide React
- **Build Tool**: Vite

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Process Manager**: Supervisor (production)

## 📋 Yêu cầu hệ thống

### Development
- PHP 8.2 hoặc cao hơn
- Composer 2.x
- Node.js 20.x hoặc cao hơn
- npm hoặc yarn
- SQLite (mặc định) hoặc MySQL 8.0+
- FFmpeg (tùy chọn, cho video processing)

### Production
- Server Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- PHP 8.2+ với các extensions: gd, exif, pdo, mbstring, xml, curl, zip, bcmath
- MySQL 8.0+ hoặc PostgreSQL
- Nginx hoặc Apache
- Tối thiểu 2GB RAM, 20GB disk space
- Domain name (cho SSL)

## 🚀 Cài đặt

### Bước 1: Clone Repository

```bash
git clone https://github.com/yourusername/googlephotos.git
cd googlephotos
```

### Bước 2: Cài đặt Dependencies

```bash
# Cài đặt PHP dependencies
composer install

# Cài đặt Node.js dependencies
npm install
```

### Bước 3: Cấu hình Environment

```bash
# Copy file .env
cp .env.example .env

# Tạo application key
php artisan key:generate
```

**Chỉnh sửa file `.env`:**

```env
APP_NAME="Google Photos Clone"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (SQLite - đơn giản cho development)
DB_CONNECTION=sqlite
# Hoặc MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=photos
# DB_USERNAME=root
# DB_PASSWORD=

# Queue
QUEUE_CONNECTION=database

# Mail (tùy chọn)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"

# Storage
FILESYSTEM_DISK=local
```

**Trên Windows, chỉnh sửa `.env` bằng:**
```powershell
notepad .env
# hoặc
code .env
```

**Trên Linux/Mac:**
```bash
nano .env
# hoặc
code .env
```

### Bước 4: Setup Database

**Với SQLite (đơn giản nhất):**

```bash
# Tạo file database
touch database/database.sqlite
# Hoặc trên Windows PowerShell:
New-Item -ItemType File -Path database\database.sqlite
```

**Với MySQL:**

```sql
CREATE DATABASE photos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'photos'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON photos.* TO 'photos'@'localhost';
FLUSH PRIVILEGES;
```

### Bước 5: Chạy Migrations

```bash
php artisan migrate
```

### Bước 6: Tạo Storage Link

```bash
php artisan storage:link
```

### Bước 7: Build Frontend Assets

**Development (với hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
```

### Bước 8: Khởi động Server

**Option 1: Sử dụng scripts có sẵn (Windows PowerShell)**

```powershell
# Development với hot reload
.\scripts\dev-local.ps1
```

**Option 2: Manual**

```bash
# Terminal 1: PHP server
php artisan serve

# Terminal 2: Vite dev server (hot reload)
npm run dev

# Terminal 3: Queue worker (xử lý background jobs)
php artisan queue:work
```

Mở trình duyệt: **http://localhost:8000**

## 🐳 Cài đặt với Docker

### Yêu cầu
- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Docker Compose

### Quick Start

```bash
# Build và start containers
docker-compose up -d

# Chạy migrations
docker-compose exec app php artisan migrate

# Tạo storage link
docker-compose exec app php artisan storage:link

# Build frontend (development)
docker-compose run --rm node npm run dev
```

Truy cập: **http://localhost:8080**

### Production với Docker

Xem chi tiết trong file `DEPLOYMENT.md` (nếu có) hoặc:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Chạy migrations
docker-compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

## 📖 Hướng dẫn sử dụng

### Đăng ký & Đăng nhập

1. Truy cập **http://localhost:8000/register**
2. Điền thông tin và tạo tài khoản
3. Đăng nhập tại **http://localhost:8000/login**

### Upload Ảnh/Video

1. Vào trang **Photos** (`/photos`)
2. Kéo thả file vào vùng upload hoặc click để chọn
3. Hỗ trợ upload nhiều file cùng lúc
4. Ảnh/video sẽ được xử lý tự động (tạo thumbnail, tối ưu, extract metadata)

### Tạo Album

1. Vào trang **Albums** (`/albums`)
2. Click **Tạo album mới**
3. Chọn ảnh/video từ thư viện
4. Đặt tên album và lưu

### Chia sẻ

**Tạo link công khai:**
1. Chọn ảnh/album cần chia sẻ
2. Click nút **Chia sẻ**
3. Chọn tab **Link**
4. Copy link và gửi cho người khác

**Chia sẻ với bạn bè:**
1. Chọn ảnh/album
2. Click **Chia sẻ** → tab **Bạn bè**
3. Chọn bạn bè và gửi

**Chia sẻ qua email:**
1. Chọn ảnh/album
2. Click **Chia sẻ** → tab **Email**
3. Nhập email và gửi

### Kết bạn

1. Vào trang **Bạn bè** (`/friends`)
2. Tìm kiếm người dùng
3. Gửi yêu cầu kết bạn
4. Chấp nhận/từ chối yêu cầu trong tab **Yêu cầu**

### Xem Thông báo

1. Vào trang **Thông báo** (`/notifications`)
2. Xem danh sách thông báo
3. Click để xem chi tiết hoặc đánh dấu đã đọc

## 🔧 Cấu hình nâng cao

### Queue Workers

Để xử lý background jobs (image processing, metadata extraction):

```bash
# Development
php artisan queue:work

# Production (với supervisor)
# Xem cấu hình trong DEPLOYMENT.md
```

### Scheduler

Tự động tạo album theo ngày:

```bash
# Thêm vào crontab hoặc task scheduler
php artisan photos:create-auto-albums
```

### Storage Quota

Mặc định mỗi user có 10GB. Có thể thay đổi trong:
- Migration: `database/migrations/..._add_storage_used_to_users_table.php`
- Model: `app/Models/User.php`

### Image Optimization

Cấu hình trong `.env`:
```env
# Kích thước thumbnail
THUMBNAIL_WIDTH=400
THUMBNAIL_HEIGHT=400

# Chất lượng ảnh
IMAGE_QUALITY=85
```

## 🧪 Testing

```bash
# Chạy tests
php artisan test

# Với coverage
php artisan test --coverage
```

## 📦 Triển khai Production

### Checklist

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` đã được set
- [ ] Database đã migrate
- [ ] Storage link đã tạo
- [ ] Frontend assets đã build (`npm run build`)
- [ ] Queue workers đang chạy
- [ ] Scheduler đã cấu hình
- [ ] SSL certificate đã cài đặt
- [ ] Backup strategy đã setup

### Commands

```bash
# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize autoloader
composer install --optimize-autoloader --no-dev
```

Xem chi tiết trong `DEPLOYMENT.md` (nếu có).

## 📁 Cấu trúc Project

```
googlephotos/
├── app/
│   ├── Http/Controllers/     # Controllers
│   ├── Models/                # Eloquent models
│   ├── Jobs/                  # Background jobs
│   ├── Mail/                  # Email templates
│   └── Policies/              # Authorization policies
├── database/
│   ├── migrations/            # Database migrations
│   └── factories/             # Model factories
├── resources/
│   ├── js/
│   │   ├── Pages/             # React pages
│   │   ├── Components/        # Reusable components
│   │   └── Layouts/           # Layout components
│   └── css/                   # Stylesheets
├── routes/
│   ├── web.php                # Web routes
│   └── auth.php               # Auth routes
├── public/                     # Public assets
├── storage/                    # Storage (uploads, cache)
├── docker/                     # Docker configs
├── scripts/                    # Helper scripts
└── tests/                      # Tests
```

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo Pull Request.

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/TinhNangMoi`)
3. Commit thay đổi (`git commit -m 'Thêm tính năng mới'`)
4. Push lên branch (`git push origin feature/TinhNangMoi`)
5. Tạo Pull Request

## 📝 Giấy phép

Dự án này được phát hành dưới giấy phép [MIT](https://opensource.org/licenses/MIT).

## 🙏 Lời cảm ơn

- [Laravel](https://laravel.com) - PHP Framework
- [Inertia.js](https://inertiajs.com) - Modern monoliths
- [React](https://react.dev) - Thư viện cho web và native UI
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Intervention Image](https://image.intervention.io) - Xử lý ảnh PHP

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Issues](https://github.com/yourusername/googlephotos/issues)
2. Tạo issue mới nếu chưa có
3. Hoặc liên hệ qua email

---

**Được tạo với ❤️ bằng Laravel & React**
#   G o o g l e P h o t o s C l o n e 
 
 
