import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { KeyRound } from 'lucide-react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Đặt lại mật khẩu" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 dark:from-gray-900 dark:to-gray-950">
                <div className="w-full max-w-md space-y-6">
                    <div className="flex justify-center">
                        <div className="rounded-2xl bg-blue-100 p-4 dark:bg-blue-900/30">
                            <KeyRound className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Đặt lại mật khẩu
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Nhập mật khẩu mới của bạn để tiếp tục
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
                        <div>
                            <InputLabel htmlFor="email" value="Email" className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Mật khẩu mới" className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                autoComplete="new-password"
                                isFocused={true}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Xác nhận mật khẩu"
                                className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                            />
                            <TextInput
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button type="submit" disabled={processing} className="w-full">
                            Đặt lại mật khẩu
                        </Button>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
