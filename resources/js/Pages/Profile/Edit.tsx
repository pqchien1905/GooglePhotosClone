import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import AvatarUploader from './Partials/AvatarUploader';
import { User } from 'lucide-react';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <GooglePhotosLayout>
            <Head title="Hồ sơ" />

            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                        <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hồ sơ</h2>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700 sm:p-8">
                    <AvatarUploader />
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700 sm:p-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700 sm:p-8">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700 sm:p-8">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </GooglePhotosLayout>
    );
}
