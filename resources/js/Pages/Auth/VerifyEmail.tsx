import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { MailCheck } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Xác thực email" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 dark:from-gray-900 dark:to-gray-950">
                <div className="w-full max-w-md space-y-6">
                    <div className="flex justify-center">
                        <div className="rounded-2xl bg-green-100 p-4 dark:bg-green-900/30">
                            <MailCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Xác thực email
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Cảm ơn bạn đã đăng ký! Trước khi bắt đầu, vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào liên kết mà chúng tôi vừa gửi cho bạn.
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
                        {status === 'verification-link-sent' && (
                            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                    Một liên kết xác thực mới đã được gửi đến địa chỉ email bạn đã đăng ký.
                                </p>
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <Button type="submit" disabled={processing} className="w-full bg-green-600 hover:bg-green-700">
                                Gửi lại email xác thực
                            </Button>

                            <div className="text-center">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="text-sm text-gray-600 underline transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                >
                                    Đăng xuất
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
