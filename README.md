# Google Photos Clone

Ứng dụng quản lý ảnh & video cá nhân với giao diện tương tự **Google Photos**, được xây dựng bằng **Laravel 12**, **Inertia.js**, **React 19** và **TypeScript**.

---

<p align="center">
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat&logo=laravel" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript" />
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat&logo=php" />
</p>

## ✨ Tóm tắt

Ứng dụng này cung cấp trải nghiệm quản lý ảnh & video cá nhân tương tự Google Photos, gồm upload, xem lưới, viewer modal, album, chia sẻ và chức năng xã hội cơ bản (kết bạn, chia sẻ). Hướng tới hỗ trợ production với Docker, background jobs và tối ưu ảnh.

---

## 📷 Tính năng chính

* **Upload đa phương tiện**: Ảnh (JPG, PNG, GIF, WebP) và video (MP4, MOV, AVI, WMV, FLV, WEBM, MKV) — hỗ trợ upload nhiều file cùng lúc.
* **Grid & Masonry layout**: Responsive, tự động sắp xếp theo kích thước.
* **Viewer modal**: Xem chi tiết, next/prev, hiển thị EXIF & metadata.
* **Thùng rác**: Soft delete, restore và xóa vĩnh viễn.
* **Yêu thích**: Đánh dấu ảnh/video yêu thích và lọc nhanh.
* **Video thumbnails**: Tự động sinh thumbnail cho video.

### Albums

* Tạo/đổi tên/xóa album, thêm/xóa ảnh, đặt ảnh bìa.
* Album tự động theo ngày chụp (artisan command).

### Chia sẻ & Bạn bè

* Link công khai có token, hỗ trợ hết hạn.
* Chia sẻ trong hệ thống (bạn bè) và qua email (preview).
* Gửi/nhận yêu cầu kết bạn, chặn, quản lý danh sách bạn bè.

### Hệ thống & Hiệu năng

* Queue xử lý background jobs (tạo thumbnail, extract metadata).
* Image optimization (Intervention Image), caching và storage quota (mặc định 10GB/user).
* Dark mode, responsive, giao diện tiếng Việt.

---

## 🛠️ Công nghệ

**Backend**: Laravel 12.x, PHP 8.2+, MySQL/SQLite, Intervention Image, Queue (database/Redis), Laravel Breeze (Auth).

**Frontend**: React 19 + TypeScript, Inertia.js (SSR), Tailwind CSS, Radix UI / Headless UI, Lucide React, Vite.

**DevOps**: Docker & Docker Compose, Nginx, Supervisor (production), FFmpeg (tùy chọn cho video processing).

---

## 📋 Yêu cầu hệ thống

**Development**

* PHP 8.2+
* Composer 2.x
* Node.js 20.x+
* npm / yarn
* SQLite (mặc định) hoặc MySQL 8.0+
* FFmpeg (nếu cần xử lý video)

**Production**

* Ubuntu 20.04+ / Debian 11+ / CentOS 8+
* PHP 8.2+ với extensions: gd, exif, pdo, mbstring, xml, curl, zip, bcmath
* MySQL 8.0+ hoặc PostgreSQL
* Nginx hoặc Apache
* Tối thiểu 2GB RAM, 20GB disk

---

## 🚀 Cài đặt nhanh (Local)

```bash
# Clone
git clone https://github.com/yourusername/googlephotos.git
cd googlephotos

# PHP deps
composer install

# Node deps
npm install
# hoặc
# yarn
```

### Cấu hình environment

```bash
cp .env.example .env
php artisan key:generate
# chỉnh .env theo môi trường (DB, MAIL, FILESYSTEM, ...)
```

### Database (SQLite - development)

```bash
# Tạo file database
touch database/database.sqlite
# hoặc (Windows PowerShell)
# New-Item -ItemType File -Path database\database.sqlite
```

### Migrate & Storage

```bash
php artisan migrate
php artisan storage:link
```

### Chạy ứng dụng

**Development**

```bash
# Terminal 1: Laravel
php artisan serve

# Terminal 2: Vite
npm run dev

# Terminal 3: Queue worker
php artisan queue:work
```

Mở trình duyệt: [http://localhost:8000](http://localhost:8000)

---

## 🐳 Docker (Quick Start)

```bash
# Build & start
docker-compose up -d

# Migrate
docker-compose exec app php artisan migrate

# Storage link
docker-compose exec app php artisan storage:link

# Build frontend (nếu cần)
docker-compose run --rm node npm run dev
```

Truy cập: [http://localhost:8080](http://localhost:8080)

---

## ⚙️ Cấu hình nâng cao

* **Queue workers**: `php artisan queue:work` (production dùng supervisor)
* **Scheduler**: Thêm cron để chạy `php artisan photos:create-auto-albums`
* **Storage quota**: Điều chỉnh migration + `User` model
* **Image settings** (.env)

```env
THUMBNAIL_WIDTH=400
THUMBNAIL_HEIGHT=400
IMAGE_QUALITY=85
```

---

## 🧪 Testing

```bash
php artisan test
# với coverage
php artisan test --coverage
```

---

## 📦 Triển khai Production — Checklist

* `APP_ENV=production`
* `APP_DEBUG=false`
* `APP_KEY` đã set
* Database đã migrate
* Storage link đã tạo
* Frontend đã build (`npm run build`)
* Queue workers & scheduler đã chạy
* SSL certificate đã cài
* Backup strategy đã thiết lập

Commands

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer install --optimize-autoloader --no-dev
```

---

## 🧭 Cấu trúc dự án (tóm tắt)

```
googlephotos/
├── app/
├── database/
├── resources/
│   ├── js/ (React + Inertia)
│   └── css/
├── routes/
├── public/
├── storage/
├── docker/
├── scripts/
└── tests/
```

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch: `git checkout -b feature/TinhNangMoi`
3. Commit & push
4. Tạo Pull Request

Vui lòng mô tả rõ thay đổi và kèm screenshots nếu có.

---

## 📝 License

Bản quyền dự án: MIT License. Xem file `LICENSE`.

---

## 🙏 Lời cảm ơn

Cảm ơn các dự án mã nguồn mở và thư viện sau: **Laravel**, **Inertia.js**, **React**, **Tailwind CSS**, **Intervention Image**.
