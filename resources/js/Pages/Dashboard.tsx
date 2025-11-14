import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <GooglePhotosLayout>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-4xl">
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="p-6 text-gray-900">
                        <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>
                        <p>You're logged in!</p>
                    </div>
                </div>
            </div>
        </GooglePhotosLayout>
    );
}
