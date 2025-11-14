import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Xóa tài khoản
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Khi tài khoản của bạn bị xóa, tất cả tài nguyên và dữ liệu sẽ bị xóa vĩnh viễn. Trước khi xóa tài khoản, vui lòng tải xuống bất kỳ dữ liệu nào bạn muốn giữ lại.
                </p>
            </header>

            <Button 
                onClick={confirmUserDeletion}
                variant="destructive"
                className="flex items-center gap-2"
            >
                <AlertTriangle className="h-4 w-4" />
                Xóa tài khoản
            </Button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Bạn có chắc chắn muốn xóa tài khoản?
                        </h2>
                    </div>

                    <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                        Khi tài khoản của bạn bị xóa, tất cả tài nguyên và dữ liệu sẽ bị xóa vĩnh viễn. Vui lòng nhập mật khẩu của bạn để xác nhận bạn muốn xóa tài khoản vĩnh viễn.
                    </p>

                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="Mật khẩu"
                            className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="block w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            isFocused
                            placeholder="Nhập mật khẩu của bạn"
                        />
                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button 
                            type="button"
                            variant="outline"
                            onClick={closeModal}
                        >
                            Hủy
                        </Button>

                        <Button 
                            type="submit"
                            variant="destructive"
                            disabled={processing}
                        >
                            Xóa tài khoản
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
