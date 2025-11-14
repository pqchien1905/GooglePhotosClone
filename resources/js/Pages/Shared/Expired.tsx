import { Head, Link } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';

export default function ShareExpired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-900 dark:to-gray-950">
      <Head title="Link đã hết hạn" />
      
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-red-100 p-4 dark:bg-red-900/30">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Link đã hết hạn
          </h1>
          
          <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
            Link chia sẻ này đã hết hạn và không thể truy cập được nữa. 
            Vui lòng liên hệ với người đã chia sẻ để được cấp link mới.
          </p>

          <Link href="/">
            <Button className="w-full">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
