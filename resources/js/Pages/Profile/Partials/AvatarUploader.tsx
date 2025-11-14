import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Upload, User } from 'lucide-react';

export default function AvatarUploader() {
  const { auth } = usePage().props as any;
  const current = auth?.user?.avatar_path ? `/storage/${auth.user.avatar_path}` : null;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    setUploading(true);
    router.post(route('profile.avatar'), fd, {
      onFinish: () => setUploading(false),
      onSuccess: () => {
        setFile(null);
        setPreview(null);
      },
    });
  };

  return (
    <section className="max-w-xl">
      <header>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ảnh đại diện</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Chọn ảnh mới, hệ thống sẽ tự cắt vuông và tối ưu.</p>
      </header>

      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-gray-700">
          {preview ? (
            <img src={preview} className="h-full w-full object-cover" alt="Preview" />
          ) : current ? (
            <img src={current} className="h-full w-full object-cover" alt="Avatar" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <User className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        <div className="space-y-3">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Chọn ảnh
              </span>
            </Button>
            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
          </label>
          {file && (
            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={uploading}>
                {uploading ? 'Đang lưu...' : 'Lưu ảnh'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { setFile(null); setPreview(null); }}
              >
                Hủy
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
