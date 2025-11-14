import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from '@/Components/ConfirmModal';
import { Button } from '@/Components/ui/button';
import { useFocusTrap } from '@/Hooks/useFocusTrap';
import { X, Info, Heart, Trash2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

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

interface PhotoViewerModalProps {
    photos: Photo[];
    initialIndex: number;
    onClose: () => void;
    onDelete?: (id: number) => void;
    onToggleFavorite?: (id: number) => void;
}

export default function PhotoViewerModal({
    photos,
    initialIndex,
    onClose,
    onDelete,
    onToggleFavorite,
}: PhotoViewerModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showDetails, setShowDetails] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Zoom/Pan state for images
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<{ x: number; y: number } | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    const currentPhoto = photos[currentIndex];
    const isVideo = (currentPhoto?.mime ?? '').startsWith('video/');

    // Focus trap for modal
    useFocusTrap(true, modalRef);

    // Reset load and zoom when index changes
    useEffect(() => {
        setImageLoaded(false);
        setImageError(false);
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    }, [currentIndex]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 200);
    };

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    }, [photos.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    }, [photos.length]);

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 5;
    const ZOOM_STEP = 0.2;

    // Clamp pan to prevent dragging too far from viewport
    const clampTranslate = (tx: number, ty: number, currentScale: number) => {
        if (!imgRef.current || !containerRef.current) return { x: tx, y: ty };
        const img = imgRef.current;
        const container = containerRef.current;
        const imgWidth = img.naturalWidth * currentScale;
        const imgHeight = img.naturalHeight * currentScale;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // If image is smaller than container, center it (no panning needed)
        if (imgWidth <= containerWidth && imgHeight <= containerHeight) {
            return { x: 0, y: 0 };
        }

        // Allow panning but keep at least a portion visible
        const maxX = imgWidth > containerWidth ? (imgWidth - containerWidth) / 2 : 0;
        const maxY = imgHeight > containerHeight ? (imgHeight - containerHeight) / 2 : 0;

        return {
            x: clamp(tx, -maxX, maxX),
            y: clamp(ty, -maxY, maxY),
        };
    };

    const zoomIn = () =>
        setScale((s) => {
            const newScale = clamp(s + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX);
            // Re-clamp translate for new scale
            setTranslate((t) => clampTranslate(t.x, t.y, newScale));
            return newScale;
        });
    const zoomOut = () =>
        setScale((s) => {
            const newScale = clamp(s - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX);
            setTranslate((t) => clampTranslate(t.x, t.y, newScale));
            return newScale;
        });
    const resetZoom = () => {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    };

    const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
        if (isVideo) return; // zoom only for images
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        setScale((s) => {
            const newScale = clamp(s + direction * ZOOM_STEP, ZOOM_MIN, ZOOM_MAX);
            setTranslate((t) => clampTranslate(t.x, t.y, newScale));
            return newScale;
        });
    };

    const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (isVideo) return;
        if (e.button !== 0) return;
        setIsPanning(true);
        panStartRef.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
    };
    const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (!isPanning || isVideo) return;
        if (!panStartRef.current) return;
        const { x, y } = panStartRef.current;
        const newTranslate = clampTranslate(e.clientX - x, e.clientY - y, scale);
        setTranslate(newTranslate);
    };
    const endPan = () => {
        setIsPanning(false);
        panStartRef.current = null;
    };

    const handleDoubleClick: React.MouseEventHandler<HTMLDivElement> = () => {
        if (isVideo) return;
        setScale((s) => (s === 1 ? 2 : 1));
        if (scale === 1) {
            // when zooming in by dblclick, keep current center; user can pan
        } else {
            setTranslate({ x: 0, y: 0 });
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `/storage/${currentPhoto.path}`;
        link.download = currentPhoto.path.split('/').pop() || 'photo';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            } else if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'i' || e.key === 'I') {
                setShowDetails((prev) => !prev);
            } else if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                handleDownload();
            } else if (!isVideo) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    zoomIn();
                } else if (e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    zoomOut();
                } else if (e.key === '0') {
                    e.preventDefault();
                    resetZoom();
                } else if (e.key === '1') {
                    e.preventDefault();
                    setScale(1);
                    setTranslate({ x: 0, y: 0 });
                } else if (e.key === '2') {
                    e.preventDefault();
                    setScale(2);
                    setTranslate((t) => clampTranslate(t.x, t.y, 2));
                } else if (e.key.toLowerCase() === 'f') {
                    e.preventDefault();
                    resetZoom();
                }
            }
        },
        [handleClose, goToPrevious, goToNext, isVideo]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Không rõ';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const handleDelete = () => {
        if (!onDelete) return;
        setDeleteOpen(true);
    };

    return (
        <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Xem ${isVideo ? 'video' : 'ảnh'} ${currentIndex + 1} trong ${photos.length}`}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-200 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
        >
            {/* Top control bar */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-black/60 p-3">
                <div className="flex items-center gap-2">
                    {photos.length > 1 && (
                        <div className="px-3 py-1.5 text-sm font-medium text-white">
                            {currentIndex + 1} / {photos.length}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Zoom controls for images */}
                    {!isVideo && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={zoomOut}
                                disabled={scale <= ZOOM_MIN}
                                className="h-9 w-9 rounded-full text-white hover:bg-white/10 disabled:opacity-30"
                                title="Thu nhỏ (-)"
                            >
                                <ZoomOut className="h-5 w-5" />
                            </Button>
                            <div className="px-3 py-1.5 text-sm font-medium text-white min-w-[60px] text-center">
                                {Math.round(scale * 100)}%
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={zoomIn}
                                disabled={scale >= ZOOM_MAX}
                                className="h-9 w-9 rounded-full text-white hover:bg-white/10 disabled:opacity-30"
                                title="Phóng to (+)"
                            >
                                <ZoomIn className="h-5 w-5" />
                            </Button>
                            {scale !== 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={resetZoom}
                                    className="h-9 w-9 rounded-full text-white hover:bg-white/10"
                                    title="Đặt lại (0)"
                                >
                                    <RotateCcw className="h-5 w-5" />
                                </Button>
                            )}
                        </>
                    )}
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                        className="h-9 w-9 rounded-full text-white hover:bg-white/10"
                        title="Tải về (D)"
                    >
                        <Download className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDetails(!showDetails)}
                        className={`h-9 w-9 rounded-full text-white hover:bg-white/10 ${showDetails ? 'bg-white/20' : ''}`}
                        title="Bật/tắt thông tin (I)"
                    >
                        <Info className="h-5 w-5" />
                    </Button>
                    
                    {onToggleFavorite && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleFavorite(currentPhoto.id)}
                            className={`h-9 w-9 rounded-full text-white hover:bg-white/10 ${
                                currentPhoto.is_favorite 
                                    ? 'text-red-500 hover:text-red-400' 
                                    : ''
                            }`}
                            title={currentPhoto.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}
                        >
                            <Heart className={`h-5 w-5 ${currentPhoto.is_favorite ? 'fill-current' : ''}`} />
                        </Button>
                    )}
                    
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="h-9 w-9 rounded-full text-white hover:bg-white/10"
                            title="Xóa"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    )}
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        aria-label="Đóng"
                        className="h-9 w-9 rounded-full text-white hover:bg-white/10"
                        title="Đóng (Esc)"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            {/* Navigation buttons */}
            {photos.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevious}
                        aria-label="Ảnh trước"
                        className="absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200"
                        title="Trước (←)"
                    >
                        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        aria-label="Ảnh tiếp theo"
                        className="absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200"
                        title="Tiếp (→)"
                    >
                        <ChevronRight className="h-6 w-6" aria-hidden="true" />
                    </Button>
                </>
            )}

            {/* Main media with zoom/pan for images */}
            <div
                ref={containerRef}
                className="relative flex h-full w-full select-none items-center justify-center p-16"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={endPan}
                onMouseLeave={endPan}
                onDoubleClick={handleDoubleClick}
                style={{ cursor: !isVideo && scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
            >
                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-white shadow-2xl"></div>
                    </div>
                )}
                {imageError ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white">
                        <div className="rounded-full bg-red-500/20 p-6">
                            <svg className="h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">Không thể tải {isVideo ? 'video' : 'ảnh'}</h3>
                            <p className="text-gray-400 text-sm">File có thể đã bị xóa hoặc không tồn tại</p>
                        </div>
                    </div>
                ) : isVideo ? (
                    <video
                        src={`/storage/${currentPhoto.path}`}
                        controls
                        aria-label={`Video ${currentIndex + 1} trong ${photos.length}`}
                        onLoadedData={() => {
                            setImageLoaded(true);
                            setImageError(false);
                        }}
                        onError={() => {
                            setImageLoaded(true);
                            setImageError(true);
                        }}
                        className={`max-h-full max-w-full transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                ) : (
                    <img
                        ref={imgRef}
                        src={`/storage/${currentPhoto.path}`}
                        alt={`Ảnh ${currentIndex + 1} trong ${photos.length}${currentPhoto.location_name ? ` - ${currentPhoto.location_name}` : ''}`}
                        onLoad={() => {
                            setImageLoaded(true);
                            setImageError(false);
                        }}
                        onError={() => {
                            setImageLoaded(true);
                            setImageError(true);
                        }}
                        className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                            willChange: 'transform',
                            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                        }}
                    />
                )}
            </div>



            {/* Details sidebar */}
            <div className={`absolute bottom-0 right-0 top-0 w-80 overflow-y-auto bg-gray-900 text-white transition-transform duration-200 border-l border-gray-800 ${
                showDetails ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-medium pb-3 border-b border-gray-800">Chi tiết ảnh</h3>

                    <div className="space-y-4 text-sm">
                        <div>
                            <div className="text-xs text-gray-400 mb-1">Đã tải lên</div>
                            <div className="text-sm font-normal text-white">{formatDate(currentPhoto.created_at)}</div>
                        </div>

                        {currentPhoto.captured_at && (
                            <div>
                                <div className="text-xs text-gray-400 mb-1">Ngày chụp</div>
                                <div className="text-sm font-normal text-white">{formatDate(currentPhoto.captured_at)}</div>
                            </div>
                        )}

                        {currentPhoto.size && (
                            <div>
                                <div className="text-xs text-gray-400 mb-1">Kích thước</div>
                                <div className="text-sm font-normal text-white">{formatBytes(currentPhoto.size)}</div>
                            </div>
                        )}

                        {currentPhoto.mime && (
                            <div>
                                <div className="text-xs text-gray-400 mb-1">Định dạng</div>
                                <div className="text-sm font-mono text-white">{currentPhoto.mime}</div>
                            </div>
                        )}

                        {(currentPhoto.location_name || currentPhoto.location_text) && (
                            <div>
                                <div className="text-xs text-gray-400 mb-1">Vị trí</div>
                                <div className="text-sm font-normal text-white">{currentPhoto.location_name || currentPhoto.location_text}</div>
                            </div>
                        )}

                        {currentPhoto.exif && Object.keys(currentPhoto.exif).length > 0 && (
                            <div>
                                <div className="text-xs text-gray-400 mb-2">Thông tin máy ảnh</div>
                                <div className="space-y-2 text-sm">
                                    {currentPhoto.exif.Make && (
                                        <div className="flex justify-between items-center pb-1.5 border-b border-gray-800">
                                            <span className="text-gray-400">Hãng</span>
                                            <span className="text-white">{currentPhoto.exif.Make}</span>
                                        </div>
                                    )}
                                    {currentPhoto.exif.Model && (
                                        <div className="flex justify-between items-center pb-1.5 border-b border-gray-800">
                                            <span className="text-gray-400">Mẫu</span>
                                            <span className="text-white">{currentPhoto.exif.Model}</span>
                                        </div>
                                    )}
                                    {currentPhoto.exif.FocalLength && (
                                        <div className="flex justify-between items-center pb-1.5 border-b border-gray-800">
                                            <span className="text-gray-400">Tiêu cự</span>
                                            <span className="text-white">{currentPhoto.exif.FocalLength}</span>
                                        </div>
                                    )}
                                    {currentPhoto.exif.FNumber && (
                                        <div className="flex justify-between items-center pb-1.5 border-b border-gray-800">
                                            <span className="text-gray-400">Khẩu độ</span>
                                            <span className="text-white">f/{currentPhoto.exif.FNumber}</span>
                                        </div>
                                    )}
                                    {currentPhoto.exif.ExposureTime && (
                                        <div className="flex justify-between items-center pb-1.5 border-b border-gray-800">
                                            <span className="text-gray-400">Tốc độ màn trập</span>
                                            <span className="text-white">{currentPhoto.exif.ExposureTime}s</span>
                                        </div>
                                    )}
                                    {currentPhoto.exif.ISOSpeedRatings && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">ISO</span>
                                            <span className="text-white">{currentPhoto.exif.ISOSpeedRatings}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        {/* Confirm: delete from viewer */}
        <ConfirmModal
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={() => {
                router.delete(`/photos/${currentPhoto.id}`, {
                    preserveState: true,
                    onSuccess: () => {
                        setDeleteOpen(false);
                        if (photos.length > 1) {
                            goToNext();
                        } else {
                            onClose();
                        }
                    },
                    onError: () => setDeleteOpen(false),
                });
            }}
            title="Xóa ảnh"
            message="Chuyển ảnh này vào thùng rác?"
            confirmText="Xóa"
            cancelText="Hủy"
            variant="danger"
        />
        </div>
    );
}
