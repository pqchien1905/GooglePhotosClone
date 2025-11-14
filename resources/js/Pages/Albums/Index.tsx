import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import CreateAlbumModal from '@/Components/CreateAlbumModal';
import ShareAlbumsModal from '@/Components/ShareAlbumsModal';
import { Plus, Image as ImageIcon, Share2 } from 'lucide-react';

interface Album {
  id: number;
  name: string;
  cover_photo_id: number | null;
  photos_count: number;
  cover_photo?: { id: number; path: string; thumb_path: string | null; mime?: string | null };
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
  albums: { data: Album[]; current_page?: number; last_page?: number };
}

export default function AlbumsIndex({ albums }: Props) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedAlbums, setSelectedAlbums] = useState<Set<number>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleCreateAlbum = (name: string) => {
    router.post('/albums', { name }, {
      onSuccess: () => {
        setCreateAlbumOpen(false);
        router.reload();
      }
    });
  };

  useEffect(() => {
    if (!albums.current_page || !albums.last_page) return;
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && (albums.current_page ?? 1) < (albums.last_page ?? 1)) {
        setIsLoadingMore(true);
        router.get(
          route('albums.index'),
          { page: (albums.current_page ?? 1) + 1 },
          {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoadingMore(false),
          }
        );
      }
    }, { threshold: 0.1 });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [albums.current_page, albums.last_page, isLoadingMore]);

  return (
    <GooglePhotosLayout>
      <Head title="Album" />
      
      {/* Google Photos Style Layout */}
      <div className="space-y-6 animate-fade-in relative z-0">
        {/* Top Bar with Title and Create Button */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <div>
            <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-1">
              Album
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tổ chức ảnh của bạn thành các bộ sưu tập
            </p>
          </div>
          <Button
            onClick={() => router.visit('/albums/create')}
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Tạo album
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex rounded-xl border border-gray-300/80 bg-white/80 backdrop-blur-sm p-1 shadow-soft dark:border-gray-600/80 dark:bg-gray-800/80 animate-fade-in">
          <button
            onClick={() => setActiveFilter('all')}
            className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-md dark:from-blue-900/40 dark:to-blue-800/30 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-gray-700/50'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveFilter('mine')}
            className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeFilter === 'mine'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-md dark:from-blue-900/40 dark:to-blue-800/30 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-gray-700/50'
            }`}
          >
            Album của tôi
          </button>
          <button
            onClick={() => setActiveFilter('shared')}
            className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeFilter === 'shared'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-md dark:from-blue-900/40 dark:to-blue-800/30 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-gray-700/50'
            }`}
          >
            Được chia sẻ với tôi
          </button>
        </div>

        {/* Albums Grid - Google Photos Style */}
        {albums.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300/80 bg-gradient-to-br from-gray-50/50 to-white py-32 text-center dark:border-gray-700/80 dark:from-gray-800/50 dark:to-gray-900/50 animate-fade-in-up">
            <div className="mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-8 dark:from-gray-700 dark:to-gray-800 shadow-lg animate-scale-in">
              <ImageIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Chưa có album nào
            </h2>
            <p className="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400">
              Hãy bắt đầu tổ chức ảnh của bạn bằng cách tạo album
            </p>
            <Button
              onClick={() => router.visit('/albums/create')}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Tạo album đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
            {albums.data.map((album, idx) => (
              <div
                key={album.id}
                className="group relative block overflow-hidden rounded-lg bg-white dark:bg-[#202124] transition-opacity duration-150 hover:opacity-90"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <a
                  href={`/albums/${album.id}`}
                  className="block no-underline"
                >
                  {/* Album Cover */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-t-lg">
                    {album.cover_photo ? (
                      (() => {
                        const isVideo = album.cover_photo.mime?.startsWith('video/') || false;
                        const hasThumb = !!album.cover_photo.thumb_path;
                        
                        if (isVideo && !hasThumb) {
                          return (
                            <VideoThumbnail
                              videoPath={album.cover_photo.path}
                              className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-110"
                            />
                          );
                        } else {
                          return (
                            <img
                              src={`/storage/${album.cover_photo.thumb_path || album.cover_photo.path}`}
                              alt={album.name}
                              className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-110"
                              draggable="false"
                            />
                          );
                        }
                      })()
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"></div>
                    {/* Photo count badge */}
                    <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 pointer-events-none">
                      {album.photos_count} {album.photos_count === 1 ? 'ảnh' : 'ảnh'}
                    </div>
                  </div>
                  
                  {/* Album Info */}
                  <div className="p-4 bg-white dark:bg-[#202124]">
                    <h3 className="mb-1 truncate text-base font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {album.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {album.photos_count} {album.photos_count === 1 ? 'ảnh' : 'ảnh'}
                    </p>
                  </div>
                </a>
                {/* Share button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedAlbums(new Set([album.id]));
                    setShareOpen(true);
                  }}
                  className="absolute top-3 right-3 rounded-lg bg-black/70 backdrop-blur-md p-2 text-white shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-black/90 pointer-events-auto z-10"
                  title="Chia sẻ album"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {/* Infinite Scroll Trigger */}
            {albums.current_page && albums.last_page && albums.current_page < albums.last_page && (
              <div ref={loadMoreRef} className="col-span-full flex justify-center py-8 animate-fade-in">
                {isLoadingMore ? (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"></div>
                    <span className="text-sm font-medium">Đang tải thêm...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                    <span>Cuộn xuống để tải thêm</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Album Modal (kept for other pages; not used here after page route) */}
      {false && (
        <CreateAlbumModal
          isOpen={createAlbumOpen}
          onClose={() => setCreateAlbumOpen(false)}
          onCreate={handleCreateAlbum}
        />
      )}

      {/* Share Albums Modal */}
      <ShareAlbumsModal
        isOpen={shareOpen}
        onClose={() => {
          setShareOpen(false);
          setSelectedAlbums(new Set());
        }}
        albumIds={Array.from(selectedAlbums)}
        albums={albums.data.filter(a => selectedAlbums.has(a.id))}
      />
    </GooglePhotosLayout>
  );
}
