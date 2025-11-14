import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, router } from '@inertiajs/react';
import ShareButton from '@/Components/ShareButton';
import ConfirmModal from '@/Components/ConfirmModal';
import PhotoViewerModal from '@/Components/PhotoViewerModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Share2, Edit, MoreVertical, Trash2, Star, Image as ImageIcon, Calendar, Plus } from 'lucide-react';
import axios from 'axios';
import UploadDropzone from '@/Components/UploadDropzone';

interface Photo {
  id: number;
  path: string;
  thumb_path: string | null;
  captured_at?: string | null;
  created_at: string;
  size?: number;
  mime?: string;
  location_text?: string | null;
  location_name?: string | null;
  exif?: Record<string, any> | null;
  is_favorite?: boolean;
}

interface Album {
  id: number;
  name: string;
  cover_photo_id: number | null;
  created_at?: string;
}

interface Props {
  album: Album;
  photos: { data: Photo[] };
}

// Component để xử lý video thumbnail
function VideoThumbnail({ videoPath, className, onClick }: { videoPath: string; className?: string; onClick?: () => void }) {
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
        onClick={onClick}
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

export default function AlbumShow({ album, photos }: Props) {
  const [confirmAlbumOpen, setConfirmAlbumOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(album.name);
  const [addPhotosOpen, setAddPhotosOpen] = useState(false);
  const [libLoading, setLibLoading] = useState(false);
  const [libPhotos, setLibPhotos] = useState<Photo[]>([]);
  const [libSelected, setLibSelected] = useState<Set<number>>(new Set());
  const [libPage, setLibPage] = useState(1);
  const [libHasMore, setLibHasMore] = useState(true);
  const [addTab, setAddTab] = useState<'library' | 'upload'>('library');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const setAsCover = (photoId: number) => {
    router.patch(`/albums/${album.id}`, { cover_photo_id: photoId }, { preserveScroll: true });
  };

  const removeFromAlbum = (photoId: number) => {
    setConfirmRemoveId(photoId);
  };

  const deleteAlbum = () => {
    setConfirmAlbumOpen(true);
  };

  const doRename = () => {
    const name = newName.trim();
    if (!name || name === album.name) {
      setRenameOpen(false);
      return;
    }
    router.patch(`/albums/${album.id}`, { name }, {
      preserveScroll: true,
      onSuccess: () => setRenameOpen(false)
    });
  };

  const openAddPhotos = async () => {
    setAddPhotosOpen(true);
    setAddTab('library');
    if (libPhotos.length === 0) {
      await fetchLibrary(1, true);
    }
  };

  const fetchLibrary = async (page: number, replace = false) => {
    setLibLoading(true);
    try {
      const { data } = await axios.get(`/api/photos?page=${page}`);
      const list: Photo[] = data.data || [];
      setLibPhotos((prev) => (replace ? list : [...prev, ...list]));
      setLibPage(data.current_page || page);
      setLibHasMore((data.current_page || page) < (data.last_page || page));
    } finally {
      setLibLoading(false);
    }
  };

  const toggleLibSelect = (id: number) => {
    setLibSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submitAddPhotos = () => {
    if (libSelected.size === 0) {
      setAddPhotosOpen(false);
      return;
    }
    router.post(`/albums/${album.id}/photos`, { photo_ids: Array.from(libSelected) }, {
      preserveScroll: true,
      onSuccess: () => {
        setAddPhotosOpen(false);
        setLibSelected(new Set());
        router.reload({ only: ['album','photos'] });
      }
    });
  };

  const { titleText, subtitleText } = useMemo(() => {
    const count = photos.data.length;
    // Compute date range from photo timestamps
    const times = photos.data
      .map((p) => (p.captured_at ? Date.parse(p.captured_at) : (p.created_at ? Date.parse(p.created_at) : NaN)))
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b);
    let subtitle = '';
    if (times.length >= 2) {
      const first = new Date(times[0]);
      const last = new Date(times[times.length - 1]);
      const firstStr = first.toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' });
      const lastStr = last.toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' });
      subtitle = `${firstStr} – ${lastStr}`;
    } else if (times.length === 1) {
      const only = new Date(times[0]);
      subtitle = only.toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (album.created_at) {
      const created = new Date(album.created_at);
      subtitle = created.toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    const countText = `${count} ảnh`;
    return { titleText: album.name, subtitleText: subtitle ? `${subtitle} • ${countText}` : countText };
  }, [album.created_at, album.name, photos.data]);

  return (
    <GooglePhotosLayout>
      <Head title={album.name} />

      <div className="space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-10 -mx-4 mb-2 border-b border-gray-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">{titleText}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>{subtitleText}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShareButton
                type="album"
                id={album.id}
                iconOnly
                size="icon"
                variant="ghost"
                asModal
              />
              <Button variant="ghost" size="icon" onClick={() => setRenameOpen(true)} title="Đổi tên">
                <Edit className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={openAddPhotos} title="Thêm ảnh">
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Tùy chọn">
                <MoreVertical className="h-5 w-5" />
              </Button>
              <Button variant="destructive" size="icon" onClick={deleteAlbum} title="Xóa album">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {photos.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-28 text-center shadow-sm dark:bg-gray-900">
            <div className="rounded-full bg-gray-100 p-8 dark:bg-gray-800">
              <ImageIcon className="h-16 w-16 text-gray-400" />
            </div>
            <p className="mb-2 mt-6 text-2xl font-normal text-gray-900 dark:text-gray-100">Album trống</p>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Hãy thêm ảnh để bắt đầu</p>
            <Button onClick={openAddPhotos} className="bg-blue-600 hover:bg-blue-700">Thêm ảnh</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
            {photos.data.map((photo, index) => {
              const isVideo = (photo.mime ?? '').startsWith('video/');
              
              return (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 transition-transform duration-300 hover:scale-[1.03] dark:bg-gray-800">
                  {isVideo && !photo.thumb_path ? (
                    <VideoThumbnail
                      videoPath={photo.path}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onClick={() => setViewerIndex(index)}
                    />
                  ) : (
                    <img
                      src={`/storage/${photo.thumb_path || photo.path}`}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onClick={() => setViewerIndex(index)}
                    />
                  )}

                  {/* Gradient overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                  {/* Action buttons */}
                  <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 pointer-events-none">
                    {/* Set as cover button */}
                    {album.cover_photo_id !== photo.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsCover(photo.id);
                        }}
                        title="Đặt làm ảnh bìa"
                        aria-label="Đặt làm ảnh bìa"
                        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-lg backdrop-blur hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}

                    {/* Remove from album button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromAlbum(photo.id);
                      }}
                      title="Xóa khỏi album"
                      aria-label="Xóa khỏi album"
                      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cover badge */}
                  {album.cover_photo_id === photo.id && (
                    <div className="absolute left-2 bottom-2 rounded-full bg-blue-600/90 px-2 py-1 text-xs text-white shadow">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Ảnh bìa
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        

        {/* Confirm delete album */}
        <ConfirmModal
          isOpen={confirmAlbumOpen}
          onClose={() => setConfirmAlbumOpen(false)}
          onConfirm={() => router.delete(`/albums/${album.id}`)}
          title="Xóa album"
          message="Xóa album này? Ảnh sẽ không bị xóa khỏi thư viện."
          confirmText="Xóa album"
          variant="danger"
        />

        {/* Confirm remove photo from album */}
        <ConfirmModal
          isOpen={confirmRemoveId !== null}
          onClose={() => setConfirmRemoveId(null)}
          onConfirm={() => {
            if (confirmRemoveId !== null) {
              router.delete(`/albums/${album.id}/photos/${confirmRemoveId}`, { preserveScroll: true });
            }
            setConfirmRemoveId(null);
          }}
          title="Xóa khỏi album"
          message="Bạn có chắc muốn xóa ảnh này khỏi album? Ảnh vẫn còn trong thư viện."
          confirmText="Xóa khỏi album"
          variant="danger"
        />
      </div>

      {/* Rename Modal */}
      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRenameOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Đổi tên album</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              placeholder="Tên album"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setRenameOpen(false)}>Hủy</Button>
              <Button onClick={doRename} className="bg-blue-600 hover:bg-blue-700">Lưu</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Photos Modal */}
      {addPhotosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddPhotosOpen(false)} />
          <div className="relative z-10 mx-4 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            {/* Header + Tabs */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className={`px-2 py-1 text-sm font-medium ${addTab === 'library' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                  onClick={() => setAddTab('library')}
                >
                  Thư viện
                </button>
                <button
                  className={`px-2 py-1 text-sm font-medium ${addTab === 'upload' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                  onClick={() => setAddTab('upload')}
                >
                  Tải lên
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{libSelected.size} đã chọn</div>
            </div>

            {addTab === 'library' ? (
              <>
                <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                  {libLoading && libPhotos.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-gray-400">Đang tải ảnh...</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                      {libPhotos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleLibSelect(p.id)}
                          className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 focus:outline-none dark:bg-gray-800"
                          title={`Ảnh #${p.id}`}
                        >
                          <img
                            src={`/storage/${p.thumb_path || p.path}`}
                            alt="photo"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className={`absolute inset-0 ${libSelected.has(p.id) ? 'ring-2 ring-blue-500' : ''}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {libHasMore ? (
                    <Button variant="secondary" disabled={libLoading} onClick={() => fetchLibrary(libPage + 1)}>
                      {libLoading ? 'Đang tải...' : 'Tải thêm'}
                    </Button>
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setAddPhotosOpen(false)}>Hủy</Button>
                    <Button onClick={submitAddPhotos} className="bg-blue-600 hover:bg-blue-700">
                      {libSelected.size > 0 ? `Thêm ${libSelected.size} ảnh` : 'Xong'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="max-h-[60vh] overflow-auto rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
                  <UploadDropzone
                    inertiaPreserveState
                    inertiaPreserveScroll
                    onUploadComplete={async () => {
                      await fetchLibrary(1, true);
                      setAddTab('library');
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <Button variant="ghost" onClick={() => setAddPhotosOpen(false)}>Đóng</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewerIndex !== null && (
        <PhotoViewerModal
          photos={photos.data}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onDelete={(id) => {
            router.delete(`/albums/${album.id}/photos/${id}`, {
              preserveScroll: true,
              onSuccess: () => {
                setViewerIndex(null);
                router.reload({ only: ['photos'] });
              }
            });
          }}
        />
      )}
    </GooglePhotosLayout>
  );
}
