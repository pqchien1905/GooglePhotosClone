# Script test email configuration
Write-Host "=== KIỂM TRA CẤU HÌNH EMAIL ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Không tìm thấy file .env" -ForegroundColor Red
    exit 1
}

Write-Host "📧 Đang kiểm tra cấu hình mail trong .env..." -ForegroundColor Yellow
Write-Host ""

# Read .env file
$envContent = Get-Content ".env" -Raw

# Check mail configuration
$mailConfig = @{
    "MAIL_MAILER" = if ($envContent -match "MAIL_MAILER=(.+)") { $matches[1].Trim() } else { "NOT SET" }
    "MAIL_HOST" = if ($envContent -match "MAIL_HOST=(.+)") { $matches[1].Trim() } else { "NOT SET" }
    "MAIL_PORT" = if ($envContent -match "MAIL_PORT=(.+)") { $matches[1].Trim() } else { "NOT SET" }
    "MAIL_USERNAME" = if ($envContent -match "MAIL_USERNAME=(.+)") { $matches[1].Trim() } else { "NOT SET" }
    "MAIL_PASSWORD" = if ($envContent -match "MAIL_PASSWORD=(.+)") { 
        $pass = $matches[1].Trim()
        if ($pass -eq "your_app_password" -or $pass -eq "") { "⚠️ CHƯA CẤU HÌNH" } else { "✅ ĐÃ CẤU HÌNH (ẩn)" }
    } else { "NOT SET" }
    "MAIL_ENCRYPTION" = if ($envContent -match "MAIL_ENCRYPTION=(.+)") { $matches[1].Trim() } else { "NOT SET" }
    "MAIL_FROM_ADDRESS" = if ($envContent -match "MAIL_FROM_ADDRESS=(.+)") { $matches[1].Trim() } else { "NOT SET" }
}

Write-Host "Cấu hình hiện tại:" -ForegroundColor Green
foreach ($key in $mailConfig.Keys) {
    $value = $mailConfig[$key]
    $color = if ($value -match "NOT SET|CHƯA CẤU HÌNH") { "Red" } else { "Green" }
    Write-Host "  $key = $value" -ForegroundColor $color
}

Write-Host ""
Write-Host "=== HƯỚNG DẪN ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Bật 2-Step Verification: https://myaccount.google.com/security" -ForegroundColor Yellow
Write-Host "2. Tạo App Password: https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
Write-Host "3. Cập nhật .env với App Password 16 ký tự" -ForegroundColor Yellow
Write-Host "4. Chạy: php artisan config:clear" -ForegroundColor Yellow
Write-Host ""

