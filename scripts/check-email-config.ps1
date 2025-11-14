# Script kiểm tra cấu hình email
Write-Host "=== KIỂM TRA CẤU HÌNH EMAIL ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Không tìm thấy file .env" -ForegroundColor Red
    exit 1
}

Write-Host "📧 Đang đọc file .env..." -ForegroundColor Yellow
Write-Host ""

# Read .env file
$envLines = Get-Content ".env"

$mailConfig = @{}
foreach ($line in $envLines) {
    if ($line -match "^MAIL_") {
        $parts = $line -split "=", 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            $mailConfig[$key] = $value
        }
    }
}

# Display configuration
Write-Host "Cấu hình hiện tại:" -ForegroundColor Green
Write-Host ""

$checks = @{
    "MAIL_MAILER" = @{
        "value" = if ($mailConfig.ContainsKey("MAIL_MAILER")) { $mailConfig["MAIL_MAILER"] } else { "NOT SET" }
        "expected" = "smtp"
    }
    "MAIL_HOST" = @{
        "value" = if ($mailConfig.ContainsKey("MAIL_HOST")) { $mailConfig["MAIL_HOST"] } else { "NOT SET" }
        "expected" = "smtp.gmail.com"
    }
    "MAIL_PORT" = @{
        "value" = if ($mailConfig.ContainsKey("MAIL_PORT")) { $mailConfig["MAIL_PORT"] } else { "NOT SET" }
        "expected" = "587"
    }
    "MAIL_USERNAME" = @{
        "value" = if ($mailConfig.ContainsKey("MAIL_USERNAME")) { $mailConfig["MAIL_USERNAME"] } else { "NOT SET" }
        "expected" = "your_email@gmail.com"
    }
    "MAIL_PASSWORD" = @{
        "value" = if ($mailConfig.ContainsKey("MAIL_PASSWORD")) { 
            $pass = $mailConfig["MAIL_PASSWORD"]
            if ($pass -match "your_app_password|your_16_char|placeholder|example") {
                "⚠️ CHƯA CẤU HÌNH (đang dùng placeholder)"
            } elseif ($pass.Length -eq 0) {
                "⚠️ RỖNG"
            } elseif ($pass.Length -ne 16) {
                "⚠️ Độ dài: $($pass.Length) ký tự (cần 16)"
            } else {
                "✅ ĐÃ CẤU HÌNH (16 ký tự)"
            }
        } else { 
            "❌ NOT SET" 
        }
        "expected" = "16 ký tự App Password"
    }
    "MAIL_ENCRYPTION" = @{
        "value" = if ($mailConfig.ContainsKey("MAIL_ENCRYPTION")) { $mailConfig["MAIL_ENCRYPTION"] } else { "NOT SET" }
        "expected" = "tls"
    }
    "MAIL_FROM_ADDRESS" = @{
        "value" = if ($mailConfig.ContainsKey("MAIL_FROM_ADDRESS")) { $mailConfig["MAIL_FROM_ADDRESS"] } else { "NOT SET" }
        "expected" = "your_email@gmail.com"
    }
}

foreach ($key in $checks.Keys) {
    $check = $checks[$key]
    $value = $check.value
    $expected = $check.expected
    
    $color = "White"
    if ($value -match "NOT SET|CHƯA CẤU HÌNH|RỖNG|⚠️") {
        $color = "Red"
    } elseif ($value -match "✅") {
        $color = "Green"
    } elseif ($value -match "⚠️") {
        $color = "Yellow"
    }
    
    Write-Host "  $key" -ForegroundColor Cyan -NoNewline
    Write-Host " = " -NoNewline
    Write-Host $value -ForegroundColor $color
    if ($value -match "NOT SET|CHƯA CẤU HÌNH|RỖNG|⚠️") {
        Write-Host "    → Cần: $expected" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== HƯỚNG DẪN SỬA LỖI ===" -ForegroundColor Cyan
Write-Host ""

# Check specific issues
$hasIssues = $false

if ($mailConfig.ContainsKey("MAIL_PASSWORD")) {
    $pass = $mailConfig["MAIL_PASSWORD"]
    if ($pass -match "your_app_password|your_16_char|placeholder|example" -or $pass.Length -eq 0) {
        $hasIssues = $true
        Write-Host "❌ MAIL_PASSWORD chưa được cấu hình đúng!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Các bước cần làm:" -ForegroundColor Yellow
        Write-Host "  1. Bật 2-Step Verification:" -ForegroundColor White
        Write-Host "     → https://myaccount.google.com/security" -ForegroundColor Cyan
        Write-Host "  2. Tạo App Password:" -ForegroundColor White
        Write-Host "     → https://myaccount.google.com/apppasswords" -ForegroundColor Cyan
        Write-Host "  3. Copy App Password 16 ký tự (BỎ KHOẢNG TRẮNG)" -ForegroundColor White
        Write-Host "  4. Cập nhật .env:" -ForegroundColor White
        Write-Host "     MAIL_PASSWORD=abcdefghijklmnop" -ForegroundColor Green
        Write-Host "  5. Clear cache:" -ForegroundColor White
        Write-Host "     php artisan config:clear" -ForegroundColor Green
        Write-Host ""
    } elseif ($pass.Length -ne 16) {
        $hasIssues = $true
        Write-Host "⚠️  MAIL_PASSWORD có độ dài $($pass.Length) ký tự (cần 16)" -ForegroundColor Yellow
        Write-Host "   → Đảm bảo đã bỏ hết khoảng trắng trong App Password" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    $hasIssues = $true
    Write-Host "❌ MAIL_PASSWORD chưa được cấu hình!" -ForegroundColor Red
    Write-Host "   → Thêm dòng MAIL_PASSWORD=... vào file .env" -ForegroundColor Yellow
    Write-Host ""
}

if (-not $hasIssues) {
    Write-Host "✅ Cấu hình email có vẻ đúng!" -ForegroundColor Green
    Write-Host "   → Chạy: php artisan email:test your_email@gmail.com" -ForegroundColor Cyan
    Write-Host ""
}

