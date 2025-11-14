# syntax=docker/dockerfile:1
FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git curl zip unzip bash icu-dev oniguruma-dev libpng-dev libjpeg-turbo-dev libwebp-dev libzip-dev \
    libxml2-dev freetype-dev libjpeg-turbo libpng libwebp \
    ffmpeg nodejs npm

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) gd exif pcntl bcmath intl pdo pdo_mysql pdo_pgsql zip

# Composer
ENV COMPOSER_HOME=/usr/local/composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Recommended PHP settings
COPY ./../php/php.ini /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/html

# Create a non-root user (optional)
RUN addgroup -S laravel && adduser -S laravel -G laravel \
    && chown -R laravel:laravel /var/www/html
USER laravel

# Default command
CMD ["php-fpm"]
