# Production Deployment Guide - Google Photos Clone

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn deploy:
- **Backend (Laravel)**: REST API server
- **Frontend (Next.js)**: React application

---

## 🖥️ Yêu cầu Server

### Backend Server
- **OS**: Ubuntu 20.04+ / CentOS 8+
- **RAM**: Tối thiểu 2GB
- **CPU**: 2 cores+
- **Storage**: 50GB+ (tùy thuộc vào lượng ảnh)
- **Software**:
  - PHP 8.2+
  - Composer
  - MySQL 8.0+ hoặc PostgreSQL 13+
  - Nginx hoặc Apache
  - Redis (optional, cho queue)
  - Supervisor (cho queue worker)

### Frontend Server
- **RAM**: Tối thiểu 1GB
- **CPU**: 1 core+
- **Software**:
  - Node.js 18+
  - npm/yarn
  - PM2 (process manager)

---

## 🚀 Deploy Backend (Laravel)

### 1. Chuẩn bị server

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt các gói cần thiết
sudo apt install -y nginx mysql-server redis-server supervisor git unzip curl

# Cài đặt PHP 8.2
sudo add-apt-repository ppa:ondrej/php
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml \
    php8.2-bcmath php8.2-curl php8.2-zip php8.2-gd php8.2-redis php8.2-imagick

# Cài đặt Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 2. Clone và cấu hình project

```bash
# Tạo thư mục
sudo mkdir -p /var/www/gpc-api
sudo chown -R $USER:www-data /var/www/gpc-api

# Clone code
cd /var/www/gpc-api
git clone https://github.com/pqchien1905/GooglePhotosClone.git .

# Cài đặt dependencies
composer install --optimize-autoloader --no-dev

# Copy và cấu hình .env
cp .env.example .env
nano .env
```

### 3. Cấu hình .env cho production

```env
APP_NAME="Google Photos Clone"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gpc_production
DB_USERNAME=gpc_user
DB_PASSWORD=your_strong_password

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

FILESYSTEM_DISK=local
# Hoặc dùng S3
# FILESYSTEM_DISK=s3
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_DEFAULT_REGION=
# AWS_BUCKET=

# CORS cho frontend
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
SESSION_DOMAIN=.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 4. Khởi tạo ứng dụng

```bash
# Generate app key
php artisan key:generate

# Tạo database
mysql -u root -p
> CREATE DATABASE gpc_production;
> CREATE USER 'gpc_user'@'localhost' IDENTIFIED BY 'your_strong_password';
> GRANT ALL PRIVILEGES ON gpc_production.* TO 'gpc_user'@'localhost';
> FLUSH PRIVILEGES;
> EXIT;

# Chạy migrations
php artisan migrate --force

# Tạo storage link
php artisan storage:link

# Cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Phân quyền
sudo chown -R www-data:www-data /var/www/gpc-api/storage
sudo chmod -R 775 /var/www/gpc-api/storage
sudo chmod -R 775 /var/www/gpc-api/bootstrap/cache
```

### 5. Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/gpc-api
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;
    root /var/www/gpc-api/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    # Tăng giới hạn upload
    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
# Kích hoạt site
sudo ln -s /etc/nginx/sites-available/gpc-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Cấu hình SSL với Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### 7. Cấu hình Queue Worker (Supervisor)

```bash
sudo nano /etc/supervisor/conf.d/gpc-worker.conf
```

```ini
[program:gpc-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/gpc-api/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/gpc-api/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start gpc-worker:*
```

---

## 🎨 Deploy Frontend (Next.js)

### Option 1: Deploy trên Vercel (Khuyến nghị)

1. Push code lên GitHub
2. Truy cập [vercel.com](https://vercel.com)
3. Import project từ GitHub
4. Thêm Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```
5. Deploy

### Option 2: Self-hosted với PM2

```bash
# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Cài đặt PM2
sudo npm install -g pm2

# Clone và build
cd /var/www
git clone https://github.com/pqchien1905/gpc-frontend.git
cd gpc-frontend

# Cấu hình environment
cp .env.example .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

```bash
# Build
npm install
npm run build

# Chạy với PM2
pm2 start npm --name "gpc-frontend" -- start
pm2 save
pm2 startup
```

### Cấu hình Nginx cho Frontend

```bash
sudo nano /etc/nginx/sites-available/gpc-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/gpc-frontend /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

---

## 🐳 Deploy với Docker (Alternative)

### docker-compose.prod.yml đã có sẵn trong repo

```bash
# Cấu hình .env
cp .env.example .env
nano .env

# Build và chạy
docker-compose -f docker-compose.prod.yml up -d

# Chạy migrations
docker-compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

---

## 📊 Monitoring & Maintenance

### Kiểm tra logs

```bash
# Laravel logs
tail -f /var/www/gpc-api/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Queue worker logs
tail -f /var/www/gpc-api/storage/logs/worker.log
```

### Cập nhật code

```bash
# Backend
cd /var/www/gpc-api
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo supervisorctl restart gpc-worker:*

# Frontend
cd /var/www/gpc-frontend
git pull origin main
npm install
npm run build
pm2 restart gpc-frontend
```

### Backup Database

```bash
# Tạo script backup
nano /home/user/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"
mysqldump -u gpc_user -p'your_password' gpc_production | gzip > $BACKUP_DIR/gpc_$DATE.sql.gz

# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "gpc_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /home/user/backup-db.sh

# Thêm vào crontab (chạy hàng ngày lúc 2h sáng)
crontab -e
0 2 * * * /home/user/backup-db.sh
```

---

## 🔒 Security Checklist

- [ ] APP_DEBUG=false
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured (UFW)
- [ ] MySQL chỉ cho localhost access
- [ ] Regular security updates
- [ ] Backup tự động
- [ ] Giới hạn rate limiting cho API
- [ ] Không expose .env file

```bash
# Cấu hình UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 🆘 Troubleshooting

### Lỗi 500 Internal Server Error
```bash
# Kiểm tra logs
tail -100 /var/www/gpc-api/storage/logs/laravel.log

# Kiểm tra permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Queue không hoạt động
```bash
sudo supervisorctl status
sudo supervisorctl restart gpc-worker:*
```

### Hình ảnh không hiển thị
```bash
# Kiểm tra storage link
php artisan storage:link

# Kiểm tra permissions
ls -la /var/www/gpc-api/public/storage
```

---

## 📞 Liên hệ hỗ trợ

Nếu gặp vấn đề, liên hệ:
- Email: support@yourdomain.com
- GitHub Issues: [Link to repo]
