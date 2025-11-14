<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class TestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email : Email address to send test email to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email configuration by sending a test email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $this->info('=== KIỂM TRA CẤU HÌNH EMAIL ===');
        $this->newLine();
        
        // Display current mail configuration
        $this->info('Cấu hình hiện tại:');
        $this->line('  MAIL_MAILER: ' . config('mail.default'));
        $this->line('  MAIL_HOST: ' . config('mail.mailers.smtp.host'));
        $this->line('  MAIL_PORT: ' . config('mail.mailers.smtp.port'));
        $this->line('  MAIL_USERNAME: ' . config('mail.mailers.smtp.username'));
        $this->line('  MAIL_FROM_ADDRESS: ' . config('mail.from.address'));
        $this->newLine();
        
        // Check if using placeholder values
        $username = config('mail.mailers.smtp.username');
        if (str_contains($username, 'your_email') || str_contains($username, 'example.com')) {
            $this->error('⚠️  MAIL_USERNAME vẫn đang dùng giá trị placeholder!');
            $this->error('   Vui lòng cập nhật .env với email Gmail thật của bạn.');
            return 1;
        }
        
        $password = config('mail.mailers.smtp.password');
        if (empty($password) || str_contains($password, 'your_app_password') || str_contains($password, 'your_16_char_app_password')) {
            $this->error('⚠️  MAIL_PASSWORD chưa được cấu hình hoặc đang dùng placeholder!');
            $this->newLine();
            $this->warn('Các bước cần làm:');
            $this->line('   1. Bật 2-Step Verification: https://myaccount.google.com/security');
            $this->line('   2. Tạo App Password: https://myaccount.google.com/apppasswords');
            $this->line('   3. Copy App Password 16 ký tự (BỎ KHOẢNG TRẮNG)');
            $this->line('   4. Cập nhật .env: MAIL_PASSWORD=your_16_char_password');
            $this->line('   5. Chạy: php artisan config:clear');
            $this->newLine();
            return 1;
        }
        
        // Check password length (App Password should be 16 characters)
        if (strlen($password) !== 16) {
            $this->warn('⚠️  MAIL_PASSWORD có độ dài ' . strlen($password) . ' ký tự.');
            $this->warn('   App Password của Gmail phải có đúng 16 ký tự.');
            $this->warn('   Đảm bảo đã bỏ hết khoảng trắng trong App Password.');
            $this->newLine();
        }
        
        $this->info('Đang gửi email test đến: ' . $email);
        $this->newLine();
        
        try {
            Mail::raw('Đây là email test từ Google Photos Clone. Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động đúng!', function ($message) use ($email) {
                $message->to($email)
                        ->subject('Test Email - Google Photos Clone');
            });
            
            $this->info('✅ Email đã được gửi thành công!');
            $this->info('   Vui lòng kiểm tra hộp thư của bạn (có thể trong thư mục Spam).');
            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Lỗi khi gửi email:');
            $this->error('   ' . $e->getMessage());
            $this->newLine();
            
            // Check if it's authentication error
            if (str_contains($e->getMessage(), 'Username and Password not accepted') || 
                str_contains($e->getMessage(), '535')) {
                $this->warn('🔍 Đây là lỗi xác thực (Authentication Error)');
                $this->newLine();
                $this->warn('Các bước sửa:');
                $this->line('   1. ✅ Đảm bảo đã BẬT 2-Step Verification');
                $this->line('      → https://myaccount.google.com/security');
                $this->line('   2. ✅ Tạo App Password mới');
                $this->line('      → https://myaccount.google.com/apppasswords');
                $this->line('   3. ✅ Copy App Password 16 ký tự (BỎ KHOẢNG TRẮNG)');
                $this->line('   4. ✅ Cập nhật .env: MAIL_PASSWORD=your_16_char_password');
                $this->line('   5. ✅ Chạy: php artisan config:clear');
                $this->newLine();
                $this->info('📖 Xem hướng dẫn chi tiết: FIX_EMAIL_AUTH_ERROR.md');
            } else {
                $this->warn('Các nguyên nhân có thể:');
                $this->line('   1. App Password không đúng');
                $this->line('   2. Chưa bật 2-Step Verification');
                $this->line('   3. Cấu hình SMTP sai');
                $this->line('   4. Gmail chặn đăng nhập từ ứng dụng');
                $this->newLine();
                $this->info('Xem hướng dẫn chi tiết tại: CAU_HINH_GMAIL_SMTP.md');
            }
            return 1;
        }
    }
}
