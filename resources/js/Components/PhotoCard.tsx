import * as React from 'react';

export interface PhotoCardProps {
  photo: {
    id: number;
    src: string;
    thumb?: string | null;
    title?: string | null;
    favorite?: boolean;
    width?: number;
    height?: number;
    mime?: string;
  };
  onClick?: () => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    // Compute masonry grid row-span
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container || !img.naturalWidth) return;
    const rowHeight = 4; // [grid-auto-rows:4px]
    const gap = 4; // gap-1
    const width = container.clientWidth;
    const ratio = img.naturalHeight / img.naturalWidth;
    const height = Math.round(width * ratio);
    const span = Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));
    container.style.gridRowEnd = `span ${span}`;
  };

  const isVideo = (photo.mime ?? '').startsWith('video/');

  return (
    <div
      ref={containerRef}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow hover:shadow-lg transition-all duration-200 dark:border-gray-800 dark:bg-gray-900"
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative w-full">
        {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800" />}
        {isVideo ? (
          <div className="flex h-48 items-center justify-center bg-black">
            <SvgPlay className="h-12 w-12 text-white opacity-80" />
          </div>
        ) : (
          <img
            src={photo.thumb || photo.src}
            alt={photo.title || ''}
            loading="lazy"
            onLoad={handleImageLoad}
            className={`w-full object-cover transition-all duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${isHovering ? 'scale-105' : 'scale-100'}`}
          />
        )}
        {/* Hover overlay */}
        {isHovering && (
          <div className="absolute inset-0 bg-black/10 transition-opacity duration-200">
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-sm text-white truncate">{photo.title || 'Untitled'}</span>
              <div className="flex items-center gap-2">
                <button className="rounded-full p-1 hover:bg-white/20 transition">
                  {photo.favorite ? <SvgHeartFilled className="h-5 w-5 text-red-500" /> : <SvgHeart className="h-5 w-5 text-white" />}
                </button>
                <button className="rounded-full p-1 hover:bg-white/20 transition">
                  <SvgMenu className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SvgHeart({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function SvgHeartFilled({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function SvgMenu({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  );
}
function SvgPlay({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}
