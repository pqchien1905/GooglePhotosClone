import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import PhotoViewerModal from '@/Components/PhotoViewerModal';
import { Button } from '@/Components/ui/button';
import { FolderOpen, Star, Download, User, Search, Plus, HelpCircle, Settings, Moon, Sun, MoreVertical, Grid3x3 } from 'lucide-react';

interface Photo {
  id: number;
  path: string;
  thumb_path: string | null;
  created_at: string;
  captured_at?: string | null;
  size?: number;
  mime?: string;
  location_text?: string | null;
  location_name?: string | null;
  exif?: Record<string, any> | null;
  is_favorite?: boolean;
}

interface Owner {
  name: string;
  email: string;
}

interface Album {
  id: number;
  name: string;
  cover_photo_id: number | null;
  photos: Photo[];
  owner?: Owner;
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white">
          <svg className="h-5 w-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
          <svg className="h-5 w-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </>
  );
}

export default function SharedAlbum({ album }: { album: Album }) {
  const shareToken = window.location.pathname.split('/').pop();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const handlePhotoClick = (index: number) => {
    console.log('Photo clicked:', index, album.photos[index]);
    setViewerIndex(index);
  };

  const handleDownloadAlbum = () => {
    window.location.href = `/share/${shareToken}/download`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 dark:from-gray-900 dark:to-gray-950">
      <Head title={`Album: ${album.name}`} />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                <FolderOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {album.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {album.photos.length} ảnh
                </p>
                {album.owner && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>
                      Chia sẻ bởi <span className="font-medium text-gray-900 dark:text-gray-100">{album.owner.name}</span>
                      {' '}({album.owner.email})
                    </span>
                  </div>
                )}
              </div>
            </div>
            {album.photos.length > 0 && (
              <Button
                onClick={handleDownloadAlbum}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Tải album
              </Button>
            )}
          </div>
        </div>

        {album.photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-24 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-700">
              <FolderOpen className="h-16 w-16 text-gray-400" />
            </div>
            <p className="mb-2 mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Album trống
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Album này chưa có ảnh nào
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {album.photos.map((photo, index) => {
              const isVideo = (photo.mime ?? '').startsWith('video/');
              
              return (
              <div 
                key={photo.id} 
                className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gray-800 cursor-pointer"
                onClick={() => handlePhotoClick(index)}
              >
                {isVideo && !photo.thumb_path ? (
                  <VideoThumbnail
                    videoPath={photo.path}
                    className="h-full w-full object-cover pointer-events-none"
                  />
                ) : (
                  <img
                    src={`/storage/${photo.thumb_path || photo.path}`}
                    alt=""
                    className="h-full w-full object-cover pointer-events-none"
                  />
                )}
                {album.cover_photo_id === photo.id && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Ảnh bìa
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              </div>
            );
            })}
          </div>
        )}

        {/* Photo Viewer Modal */}
        {viewerIndex !== null && (
          <PhotoViewerModal
            photos={album.photos}
            initialIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
