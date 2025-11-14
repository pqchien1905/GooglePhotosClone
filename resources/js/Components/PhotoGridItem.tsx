import { useEffect, useRef, useState, memo } from 'react';

interface Props {
    photo: {
        id: number;
        path: string;
        thumb_path: string | null;
        mime?: string;
        is_favorite?: boolean;
    };
    isSelected: boolean;
    showCheckbox: boolean;
    onClick: (e: React.MouseEvent) => void;
    onToggleSelect: (e: React.MouseEvent) => void;
    onToggleFavorite?: (e: React.MouseEvent) => void;
    // Display mode: masonry (variable heights) vs uniform (fixed aspect)
    mode?: 'masonry' | 'uniform';
    // Tailwind aspect utility when mode='uniform' (e.g., 'aspect-square', 'aspect-[4/3]')
    aspectClass?: string;
}

function PhotoGridItem({ 
    photo, 
    isSelected, 
    showCheckbox, 
    onClick, 
    onToggleSelect,
    onToggleFavorite,
    mode = 'masonry',
    aspectClass = 'aspect-square'
}: Props) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [posterUrl, setPosterUrl] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [inView, setInView] = useState(false);
    const isVideo = (photo.mime ?? '').startsWith('video/');
    const isUniform = mode === 'uniform';
    // Clamp item height for better aesthetics (avoid super tall or super flat tiles)
    const MAX_H_OVER_W = 1.45; // cap portraits (~4:3 to 5:7 feel)
    const MIN_H_OVER_W = 0.75; // avoid ultra-flat wide tiles

    // Helper: set grid row span based on a desired pixel height
    const setGridSpan = (height: number) => {
        const container = containerRef.current;
        if (!container) return;
        if (isUniform) return; // no row span in uniform mode
        const rowHeight = 4; // matches [grid-auto-rows:4px]
        const gap = 4; // gap-1 => 4px
        const span = Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));
        container.style.gridRowEnd = `span ${span}`;
    };

    // Observe visibility to improve lazy behavior (especially for video poster capture)
    // Optimized for mobile: smaller rootMargin, better threshold
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        
        // Adjust rootMargin based on viewport size (smaller on mobile)
        const isMobile = window.innerWidth < 640;
        const rootMargin = isMobile ? '100px' : '200px';
        
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setInView(true);
                    // once visible, unobserve to avoid churn
                    io.unobserve(el);
                }
            },
            { root: null, rootMargin, threshold: 0.01 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setImageLoaded(true);
        setImageError(false);
        if (isUniform) return;
        const img = e.currentTarget;
        const container = containerRef.current;
        if (!container) return;
        // Masonry-like grid row span calculation
        const rowHeight = 4; // matches [grid-auto-rows:4px]
        const gap = 4; // gap-1 => 4px
        const width = container.clientWidth;
        if (!width || img.naturalWidth === 0) return;
        const ratio = img.naturalHeight / img.naturalWidth;
        const unclamped = Math.round(width * ratio);
        const clamped = Math.max(Math.round(width * MIN_H_OVER_W), Math.min(unclamped, Math.round(width * MAX_H_OVER_W)));
        const height = clamped;
        const span = Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));
        container.style.gridRowEnd = `span ${span}`;
    };

    const onImageError = () => {
        setImageError(true);
        setImageLoaded(true); // Stop showing loading skeleton
    };

    // For videos without thumbnails, compute a reasonable placeholder height (16:9)
    useEffect(() => {
    if (!isVideo) return; // images handled by onLoad
        if (photo.thumb_path) return; // image load handles
    if (!inView) return; // defer poster work until in viewport
        const container = containerRef.current;
        if (!container) return;

        let naturalRatio: number | null = null;
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = `/storage/${photo.path}`;
        video.muted = true;

        const captureFrame = () => {
            try {
                const canvas = document.createElement('canvas');
                const vw = video.videoWidth || 400;
                const vh = video.videoHeight || 225;
                const targetW = 400;
                const rawH = (vh / vw) * targetW;
                const targetH = Math.round(Math.max(targetW * MIN_H_OVER_W, Math.min(rawH, targetW * MAX_H_OVER_W)));
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, targetW, targetH);
                    const url = canvas.toDataURL('image/jpeg', 0.85);
                    setPosterUrl(url);
                }
            } catch {}
        };

        const onLoadedMetadata = () => {
            if (video.videoWidth && video.videoHeight) {
                naturalRatio = video.videoHeight / video.videoWidth;
                const width = container.clientWidth;
                if (width) {
                    const unclamped = Math.round(width * naturalRatio);
                    const clamped = Math.max(Math.round(width * MIN_H_OVER_W), Math.min(unclamped, Math.round(width * MAX_H_OVER_W)));
                    setGridSpan(clamped);
                }
            }
            // try to seek a little to avoid black first frame
            video.currentTime = Math.min(1, (video.duration || 1) * 0.1);
        };

        const onSeeked = () => {
            captureFrame();
            setImageLoaded(true);
        };

        const onError = () => {
            // fallback to 16:9 if metadata cannot be read
            const width = container.clientWidth;
            if (width) setGridSpan(Math.round(width * (9 / 16)));
            setImageLoaded(true);
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);

        const onResize = () => {
            const width = container.clientWidth;
            if (!width) return;
            const ratio = naturalRatio ?? (9 / 16);
            const unclamped = Math.round(width * ratio);
            const clamped = Math.max(Math.round(width * MIN_H_OVER_W), Math.min(unclamped, Math.round(width * MAX_H_OVER_W)));
            setGridSpan(clamped);
        };
        window.addEventListener('resize', onResize);
        // Initial calculation while waiting metadata
        onResize();

        return () => {
            window.removeEventListener('resize', onResize);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            video.src = '';
        };
    }, [isVideo, photo.thumb_path, photo.path, inView]);

    return (
        <div
            ref={containerRef}
            className={`group relative cursor-pointer overflow-hidden transition-opacity duration-150 ${isUniform ? aspectClass : ''} ${
                isSelected ? 'ring-2 ring-blue-600 dark:ring-blue-500' : ''
            }`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`${isVideo ? 'Video' : 'Ảnh'} ${photo.id}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(e as any);
                }
            }}
        >
            {isVideo ? (
                (photo.thumb_path || posterUrl) && !imageError ? (
                    <>
                        <img
                            src={photo.thumb_path ? `/storage/${photo.thumb_path}` : posterUrl!}
                            alt=""
                            loading="lazy"
                            onLoad={onImageLoad}
                            onError={onImageError}
                            className={`transition-opacity duration-200 ${
                                imageLoaded ? 'opacity-100' : 'opacity-0'
                            } ${
                                isSelected ? 'opacity-70' : 'group-hover:opacity-90'
                            }`}
                            style={isUniform ? { position: 'absolute', inset: 0, objectFit: 'cover' } as any : { objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                        {/* play icon overlay */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                                <svg className="h-6 w-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={`relative flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800 ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white">
                            <svg className="h-6 w-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                )
            ) : (
                imageError ? (
                    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                        <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">Không thể tải ảnh</span>
                        </div>
                    </div>
                ) : (
                    <img
                        src={`/storage/${photo.thumb_path || photo.path}`}
                        alt={`Ảnh ${photo.id}`}
                        loading="lazy"
                        decoding="async"
                        fetchpriority={inView ? 'high' : 'low'}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 20vw, 16vw"
                        onLoad={onImageLoad}
                        onError={onImageError}
                        className={`transition-opacity duration-200 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        } ${
                            isSelected ? 'opacity-70' : 'group-hover:opacity-90'
                        }`}
                        style={isUniform ? { position: 'absolute', inset: 0, objectFit: 'cover' } as any : { objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                )
            )}
            
            {/* Loading skeleton */}
            {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 pointer-events-none"></div>
            )}
            
                    {/* Checkbox Overlay */}
                    <div
                        className={`absolute left-2 top-2 z-20 transition-opacity duration-150 ${
                            isSelected || showCheckbox
                                ? 'opacity-100'
                                : 'opacity-0 md:group-hover:opacity-100'
                        }`}
                    >
                        <button
                            onClick={onToggleSelect}
                            aria-label={isSelected ? `Bỏ chọn ảnh ${photo.id}` : `Chọn ảnh ${photo.id}`}
                            aria-pressed={isSelected}
                            role="checkbox"
                            tabIndex={showCheckbox ? 0 : -1}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                isSelected
                                    ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500'
                                    : 'border-white bg-white/90 dark:border-gray-800 dark:bg-gray-800/90'
                            }`}
                        >
                            {isSelected && (
                                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Favorite Button */}
                    {onToggleFavorite && (
                        <div className={`absolute right-2 top-2 z-20 transition-opacity duration-150 ${
                            photo.is_favorite 
                                ? 'opacity-100' 
                                : 'opacity-0 group-hover:opacity-100'
                        }`}>
                            <button
                                onClick={onToggleFavorite}
                                aria-label={photo.is_favorite ? `Bỏ yêu thích ảnh ${photo.id}` : `Thêm vào yêu thích ảnh ${photo.id}`}
                                aria-pressed={photo.is_favorite}
                                tabIndex={0}
                                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                    photo.is_favorite 
                                        ? 'bg-red-500 dark:bg-red-500' 
                                        : 'bg-white/90 dark:bg-gray-800/90'
                                }`}
                            >
                                <svg 
                                    className={`h-4 w-4 ${
                                        photo.is_favorite 
                                            ? 'fill-white text-white' 
                                            : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                    viewBox="0 0 24 24" 
                                    fill={photo.is_favorite ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                        </div>
                    )}

            {/* Video badge */}
            {isVideo && (
                <div className="absolute bottom-2 left-2 rounded px-2 py-1 bg-black/60 text-white text-xs font-medium">
                    <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        VIDEO
                    </span>
                </div>
            )}
        </div>
    );
}

export default memo(PhotoGridItem, (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
        prevProps.photo.id === nextProps.photo.id &&
        prevProps.photo.thumb_path === nextProps.photo.thumb_path &&
        prevProps.photo.is_favorite === nextProps.photo.is_favorite &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.showCheckbox === nextProps.showCheckbox &&
        prevProps.mode === nextProps.mode &&
        prevProps.aspectClass === nextProps.aspectClass
    );
});
