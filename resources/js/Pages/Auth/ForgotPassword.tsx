import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { Mail } from 'lucide-react';

export default function ForgotPassword({ status, reset_link, email_error }: { status?: string; reset_link?: string; email_error?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8 dark:from-gray-900 dark:to-gray-950">
            <Head title="Quên mật khẩu" />

            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                        <Mail className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Quên mật khẩu?
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Không vấn đề gì. Hãy cho chúng tôi biết địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết đặt lại mật khẩu.
                    </p>
                </div>

                {status && (
                    <div className={`rounded-xl p-4 text-sm border ${
                        email_error 
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                            : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    }`}>
                        <div className="mb-2">{status}</div>
                        {email_error && (
                            <>
                                <div className="mb-3 text-xs text-yellow-600 dark:text-yellow-500">
                                    ⚠️ {email_error}
                                </div>
                                {reset_link && (
                                    <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mb-2 font-medium">
                                            🔗 Link đặt lại mật khẩu (chỉ hiển thị khi email thất bại):
                                        </p>
                                        <a 
                                            href={reset_link}
                                            className="text-xs break-all text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {reset_link}
                                        </a>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                                            ⚠️ Link này được hiển thị vì gửi email thất bại. Vui lòng cấu hình SMTP đúng cách.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <form onSubmit={submit} className="mt-8 space-y-6 rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900/80 dark:border dark:border-gray-800">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                            placeholder="Địa chỉ email"
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5"
                        >
                            {processing ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
                        </Button>
                    </div>

                    <div className="text-center pt-2">
                        <Link
                            href={route('login')}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
