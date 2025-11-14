import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Image as ImageIcon, Check } from 'lucide-react';
import axios from 'axios';
import UploadDropzone from '@/Components/UploadDropzone';

type Photo = {
  id: number;
  path: string;
  thumb_path: string | null;
  mime_type?: string;
};

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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
          <svg className="h-4 w-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
          <svg className="h-4 w-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </>
  );
}

export default function AlbumsCreate() {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = async () => {
    // Cho phép mở trình chọn ảnh ngay cả khi chưa nhập tiêu đề
    setPickerOpen(true);
    setActiveTab('library');
    if (photos.length === 0) {
      await fetchPhotos(1, true);
    }
  };

  const fetchPhotos = async (nextPage: number, replace = false) => {
    setLoadingPhotos(true);
    try {
      const { data } = await axios.get(`/api/photos?page=${nextPage}`);
      const list: Photo[] = data.data || [];
      setPhotos((prev) => (replace ? list : [...prev, ...list]));
      setPage(data.current_page || nextPage);
      setHasMore((data.current_page || nextPage) < (data.last_page || nextPage));
    } catch (e) {
      // ignore
    } finally {
      setLoadingPhotos(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submitCreate = () => {
    if (!title.trim()) {
      inputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    const payload: any = { name: title.trim() };
    if (selected.size > 0) payload.photo_ids = Array.from(selected);
    router.post('/albums', payload, {
      onSuccess: () => {
        router.visit('/albums');
      },
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <GooglePhotosLayout>
      <Head title="Tạo album" />

      <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-gray-900">
        {/* Thin top border line */}
        <div className="h-px w-full border-t border-gray-200 dark:border-gray-800" />

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Large title input */}
          <div className="mx-auto w-full max-w-3xl pt-8">
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thêm tiêu đề"
              className="w-full border-0 bg-transparent text-3xl sm:text-4xl font-normal text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <div className="mt-3 h-px w-full border-b border-gray-200 dark:border-gray-800" />
          </div>

          {/* Centered empty state */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-gray-100 p-10 shadow-sm dark:bg-gray-800">
                <ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="mb-2 text-2xl font-normal text-gray-900 dark:text-gray-100">Album trống</h2>
              <p className="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400">
                Hãy thêm ảnh để bắt đầu tạo album của bạn
              </p>

              <Button
                onClick={openPicker}
                disabled={submitting}
                className="transform gap-2 bg-blue-600 px-6 py-5 text-base hover:scale-[1.02] hover:bg-blue-700 hover:shadow-md active:scale-[0.99]"
              >
                Thêm ảnh
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Photo Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPickerOpen(false)} />
          <div className="relative z-10 mx-4 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            {/* Header with tabs */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className={`px-2 py-1 text-sm font-medium ${activeTab === 'library' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                  onClick={() => setActiveTab('library')}
                >
                  Thư viện
                </button>
                <button
                  className={`px-2 py-1 text-sm font-medium ${activeTab === 'upload' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                  onClick={() => setActiveTab('upload')}
                >
                  Tải lên
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{selected.size} đã chọn</div>
            </div>

            {activeTab === 'library' ? (
              <>
                <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                  {loadingPhotos && photos.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-gray-400">Đang tải ảnh...</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                      {photos.map((p) => {
                        const isVideo = p.mime_type?.startsWith('video/') || false;
                        
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleSelect(p.id)}
                            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 focus:outline-none dark:bg-gray-800"
                            title={`${isVideo ? 'Video' : 'Ảnh'} #${p.id}`}
                          >
                            {isVideo && !p.thumb_path ? (
                              <VideoThumbnail
                                videoPath={p.path}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <img
                                src={`/storage/${p.thumb_path || p.path}`}
                                alt="photo"
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            )}
                            <div className={`absolute inset-0 flex items-start justify-end p-1 ${selected.has(p.id) ? 'bg-blue-600/30' : 'bg-transparent'}`}>
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-white ${selected.has(p.id) ? 'border-blue-700 bg-blue-600' : 'border-white/70 bg-black/40'}`}>
                                <Check className="h-4 w-4" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {hasMore ? (
                    <Button variant="secondary" disabled={loadingPhotos} onClick={() => fetchPhotos(page + 1)}>
                      {loadingPhotos ? 'Đang tải...' : 'Tải thêm'}
                    </Button>
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setPickerOpen(false)}>Hủy</Button>
                    <Button onClick={submitCreate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                      {selected.size > 0 ? `Thêm ${selected.size} ảnh` : 'Tạo album trống'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="max-h-[60vh] overflow-auto rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
                  <UploadDropzone
                    onUploadComplete={async () => {
                      // Sau khi tải xong, làm mới thư viện và chuyển về tab Thư viện
                      await fetchPhotos(1, true);
                      setActiveTab('library');
                    }}
                    inertiaPreserveState
                    inertiaPreserveScroll
                  />
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <Button variant="ghost" onClick={() => setPickerOpen(false)}>Đóng</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </GooglePhotosLayout>
  );
}
