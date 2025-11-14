<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'reset_link' => session('reset_link'),
            'email_error' => session('email_error'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        try {
            // We will send the password reset link to this user. Once we have attempted
            // to send the link, we will examine the response then see the message we
            // need to show to the user. Finally, we'll send out a proper response.
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status == Password::RESET_LINK_SENT) {
                // Email đã được gửi thành công, không hiển thị link trên trang
                return back()->with('status', 'Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.');
            }

            // Map status to Vietnamese messages
            $messages = [
                Password::INVALID_USER => 'Chúng tôi không thể tìm thấy người dùng với địa chỉ email này.',
                Password::INVALID_TOKEN => 'Token đặt lại mật khẩu này không hợp lệ.',
                Password::RESET_THROTTLED => 'Vui lòng đợi trước khi thử lại.',
            ];

            $errorMessage = $messages[$status] ?? trans('passwords.user');

            throw ValidationException::withMessages([
                'email' => [$errorMessage],
            ]);
        } catch (\Symfony\Component\Mailer\Exception\TransportException $e) {
            // If email sending fails (e.g., SMTP config error), log error and show message
            Log::error('Email sending failed: ' . $e->getMessage());
            
            // Only show link in development if email completely fails
            if (app()->environment(['local', 'development'])) {
                $user = \App\Models\User::where('email', $request->email)->first();
                if ($user) {
                    // Use Password broker to create token properly (Laravel handles hashing internally)
                    $broker = Password::broker();
                    $token = $broker->createToken($user);
                    
                    if ($token) {
                        $resetUrl = route('password.reset', ['token' => $token, 'email' => $request->email]);
                        
                        return back()
                            ->with('status', 'Link đặt lại mật khẩu đã được tạo. (Lưu ý: Gửi email thất bại, vui lòng kiểm tra cấu hình SMTP)')
                            ->with('reset_link', $resetUrl)
                            ->with('email_error', 'Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP trong file .env');
                    }
                }
            }
            
            return back()->withErrors([
                'email' => 'Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP hoặc thử lại sau.',
            ]);
        }
    }
}
