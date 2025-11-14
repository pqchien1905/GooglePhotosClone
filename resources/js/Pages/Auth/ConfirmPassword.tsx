import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Xác nhận mật khẩu" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 dark:from-gray-900 dark:to-gray-950">
                <div className="w-full max-w-md space-y-6">
                    <div className="flex justify-center">
                        <div className="rounded-2xl bg-amber-100 p-4 dark:bg-amber-900/30">
                            <ShieldCheck className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Xác nhận mật khẩu
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Đây là khu vực bảo mật. Vui lòng xác nhận mật khẩu của bạn để tiếp tục.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
                        <div>
                            <InputLabel htmlFor="password" value="Mật khẩu" className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="block w-full rounded-lg border-gray-300 focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                isFocused={true}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <Button type="submit" disabled={processing} className="w-full bg-amber-600 hover:bg-amber-700">
                            Xác nhận
                        </Button>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
