import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import PhotoViewerModal from '@/Components/PhotoViewerModal';
import { useState, useEffect } from 'react';
import { Share2, Image as ImageIcon, FolderOpen, User, Clock, MoreVertical, Play } from 'lucide-react';

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
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
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

interface User {
  id: number;
  name: string;
  email: string;
}

interface Shareable {
  id: number;
  name?: string;
  path?: string;
  thumb_path?: string | null;
  title?: string;
  created_at?: string;
  captured_at?: string | null;
  size?: number;
  mime?: string;
  location_text?: string | null;
  location_name?: string | null;
  exif?: Record<string, any> | null;
  is_favorite?: boolean;
  share_link_token?: string;
}

interface Share {
  id: number;
  receiver: User;
  shareable_type: string;
  shareable: Shareable;
  message: string | null;
  created_at: string;
}

interface Props {
  shares: {
    data: Share[];
    current_page: number;
    last_page: number;
  };
}

export default function SharesSent({ shares }: Props) {
  const [viewerPhoto, setViewerPhoto] = useState<Shareable | null>(null);

  const isVideo = (mime: string | undefined) => {
    return mime?.includes('video');
  };

  return (
    <GooglePhotosLayout>
      <Head title="Chia sẻ" />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section - Google Photos Style */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-2">
              Chia sẻ
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {shares.data.length} mục bạn đã chia sẻ
            </p>
          </div>

          {/* Tabs - Google Photos Style */}
          <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-800 mb-8 pb-1">
            <Link
              href={route('shares.received')}
              className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              Nhận được
            </Link>
            <Link
              href={route('shares.sent')}
              className="relative pb-3 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors"
            >
              Đã gửi
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
            </Link>
          </div>

          {shares.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="text-center max-w-md">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-light text-gray-900 dark:text-gray-100 mb-2">
                  Chưa có nội dung chia sẻ
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bạn chưa chia sẻ nội dung nào với bạn bè
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Content Grid - Google Photos Style */}
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {shares.data.map((share) => (
                  <div
                    key={share.id}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer"
                  >
                    {/* Media Content */}
                    {share.shareable_type.includes('Photo') && share.shareable.path ? (
                      <div
                        className="w-full h-full relative"
                        onClick={() => {
                          setViewerPhoto(share.shareable);
                        }}
                      >
                        {isVideo(share.shareable.mime) && !share.shareable.thumb_path ? (
                          <VideoThumbnail
                            videoPath={share.shareable.path}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <img
                            src={`/storage/${share.shareable.thumb_path || share.shareable.path}`}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        {isVideo(share.shareable.mime) && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <Play className="h-6 w-6 text-white fill-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : share.shareable_type.includes('Album') ? (
                      <div
                        className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => {
                          if (share.shareable.share_link_token) {
                            window.location.href = `/share/${share.shareable.share_link_token}`;
                          }
                        }}
                      >
                        <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-xs font-medium text-white truncate">
                            Đến: {share.receiver.name}
                          </span>
                        </div>
                        {share.message && (
                          <p className="text-xs text-white/90 line-clamp-1">
                            "{share.message}"
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-white/80">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(share.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {shares.last_page > shares.current_page && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => router.get(route('shares.sent'), { page: shares.current_page + 1 }, { preserveState: true, preserveScroll: true })}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Tải thêm
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Photo Viewer Modal */}
        {viewerPhoto && viewerPhoto.path && (
          <PhotoViewerModal
            photos={[{
              id: viewerPhoto.id,
              path: viewerPhoto.path,
              thumb_path: viewerPhoto.thumb_path || null,
              created_at: viewerPhoto.created_at || new Date().toISOString(),
              captured_at: viewerPhoto.captured_at,
              size: viewerPhoto.size,
              mime: viewerPhoto.mime,
              location_text: viewerPhoto.location_text,
              location_name: viewerPhoto.location_name,
              exif: viewerPhoto.exif,
              is_favorite: viewerPhoto.is_favorite,
            }]}
            initialIndex={0}
            onClose={() => setViewerPhoto(null)}
          />
        )}
      </div>
    </GooglePhotosLayout>
  );
}
