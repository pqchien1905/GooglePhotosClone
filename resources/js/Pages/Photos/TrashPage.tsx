import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, router } from '@inertiajs/react';
import ConfirmModal from '@/Components/ConfirmModal';
import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, Trash2, Trash } from 'lucide-react';

interface Photo {
    id: number;
    path: string;
    thumb_path: string | null;
    deleted_at: string;
    mime?: string | null;
}

// Component để xử lý video thumbnail
function VideoThumbnail({ videoPath, className }: { videoPath: string; className?: string }) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = `/storage/${videoPath}`;
    video.muted = true;

    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        video.currentTime = Math.min(1, (video.duration || 1) * 0.1);
      }
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 225;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const url = canvas.toDataURL('image/jpeg', 0.85);
          setPosterUrl(url);
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };

    const handleError = () => {
      setLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.src = '';
    };
  }, [videoPath]);

  if (loading || !posterUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 dark:bg-gray-800`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white">
          <svg className="h-6 w-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={posterUrl}
        alt=""
        className={className}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
          <svg className="h-6 w-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </>
  );
}

interface Props {
    photos: {
        data: Photo[];
    };
}

export default function TrashPage({ photos }: Props) {
    const reload = () => router.reload();
    const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);

    const togglePhotoSelection = (id: number) => {
        const next = new Set(selectedPhotos);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedPhotos(next);
    };

    const clearSelection = () => setSelectedPhotos(new Set());

    const selectedCount = selectedPhotos.size;
    const allIds = useMemo(() => photos.data.map(p => p.id), [photos.data]);

    const handleBulkRestore = async () => {
        const ids = Array.from(selectedPhotos);
        await Promise.all(ids.map(id => router.post(`/photos/${id}/restore`, {}, { preserveState: true })));
        setRestoreConfirmOpen(false);
        clearSelection();
        reload();
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedPhotos);
        await Promise.all(ids.map(id => router.delete(`/photos/${id}/force`, { preserveState: true })));
        setDeleteConfirmOpen(false);
        clearSelection();
        reload();
    };

    const handleEmptyTrash = async () => {
        await Promise.all(allIds.map(id => router.delete(`/photos/${id}/force`, { preserveState: true })));
        setEmptyTrashOpen(false);
        clearSelection();
        reload();
    };

    return (
        <GooglePhotosLayout>
            <Head title="Thùng rác" />
            
            {/* Main container with padding */}
            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Sticky header bar */}
                <div className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-900/95 shadow-soft">
                    <div className="mx-auto max-w-7xl px-6 py-4">
                        <div className="flex items-center justify-between animate-fade-in-down">
                            {selectedCount === 0 ? (
                                <>
                                    {/* Normal state */}
                                    <div>
                                        <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-1">
                                            Thùng rác
                                        </h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {photos.data.length} {photos.data.length === 1 ? 'mục' : 'mục'} đã xóa
                                        </p>
                                    </div>
                                    {photos.data.length > 0 && (
                                        <button
                                            onClick={() => setEmptyTrashOpen(true)}
                                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                        >
                                            <Trash className="h-4 w-4" />
                                            Dọn sạch thùng rác
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Selection state */}
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100">
                                            Đã chọn {selectedCount} {selectedCount === 1 ? 'ảnh' : 'ảnh'}
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setDeleteConfirmOpen(true)}
                                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Xóa vĩnh viễn
                                        </button>
                                        <button
                                            onClick={() => setRestoreConfirmOpen(true)}
                                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Khôi phục
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className="mx-auto max-w-7xl px-6 py-6">
                    {photos.data.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300/80 bg-gradient-to-br from-gray-50/50 to-white py-32 text-center dark:border-gray-700/80 dark:from-gray-800/50 dark:to-gray-900/50 animate-fade-in-up">
                            <div className="mb-4 text-6xl animate-scale-in">🗑️</div>
                            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Thùng rác trống
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Các mục bạn xóa sẽ ở đây trong 60 ngày
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Info notice */}
                            <div className="mb-6 rounded-xl bg-blue-50/80 backdrop-blur-sm border border-blue-200/80 p-4 dark:bg-blue-900/20 dark:border-blue-800/80 animate-fade-in">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Các mục trong Thùng rác sẽ bị xóa vĩnh viễn sau 60 ngày.{' '}
                                    <a
                                        href="https://support.google.com/photos/answer/6128858"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                                    >
                                        Tìm hiểu thêm
                                    </a>
                                </p>
                            </div>

                            {/* Photo grid */}
                            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                {photos.data.map((photo, idx) => {
                                    const isVideo = photo.mime?.startsWith('video/') || false;
                                    
                                    return (
                                        <div
                                            key={photo.id}
                                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 shadow-soft transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fade-in-up"
                                            style={{ animationDelay: `${idx * 30}ms` }}
                                            onClick={() => togglePhotoSelection(photo.id)}
                                        >
                                            {isVideo && !photo.thumb_path ? (
                                                <VideoThumbnail
                                                    videoPath={photo.path}
                                                    className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
                                                />
                                            ) : (
                                                <img
                                                    src={`/storage/${photo.thumb_path || photo.path}`}
                                                    alt=""
                                                    className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
                                                />
                                            )}
                                            
                                            {/* Hover overlay */}
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                            
                                            {/* Checkbox circle */}
                                            <div className="absolute left-2 top-2 z-10 transition-all duration-300">
                                                {selectedPhotos.has(photo.id) ? (
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-2 ring-blue-400/50 animate-scale-in">
                                                        <CheckCircle2 className="h-5 w-5 fill-white text-white stroke-2" />
                                                    </div>
                                                ) : (
                                                    <div className="h-7 w-7 rounded-full border-2 border-white bg-black/40 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Confirm: Bulk restore */}
            <ConfirmModal
                isOpen={restoreConfirmOpen}
                onClose={() => setRestoreConfirmOpen(false)}
                onConfirm={handleBulkRestore}
                title="Khôi phục ảnh"
                message={`Bạn có muốn khôi phục ${selectedCount} ảnh đã chọn?`}
                confirmText="Khôi phục"
                cancelText="Hủy"
                variant="primary"
            />

            {/* Confirm: Bulk delete */}
            <ConfirmModal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleBulkDelete}
                title="Xóa vĩnh viễn"
                message={`Xóa vĩnh viễn ${selectedCount} ảnh đã chọn? Hành động này không thể hoàn tác.`}
                confirmText="Xóa vĩnh viễn"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Confirm: Empty trash */}
            <ConfirmModal
                isOpen={emptyTrashOpen}
                onClose={() => setEmptyTrashOpen(false)}
                onConfirm={handleEmptyTrash}
                title="Dọn sạch thùng rác"
                message={`Xóa vĩnh viễn tất cả ${allIds.length} ảnh trong thùng rác? Hành động này không thể hoàn tác.`}
                confirmText="Dọn sạch"
                cancelText="Hủy"
                variant="danger"
            />
        </GooglePhotosLayout>
    );
}
