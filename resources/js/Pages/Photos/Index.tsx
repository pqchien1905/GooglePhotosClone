import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import PhotoViewerModal from '@/Components/PhotoViewerModal';
import PhotoGridItem from '@/Components/PhotoGridItem';
import SharePhotosModal from '@/Components/SharePhotosModal';
import CreateAlbumModal from '@/Components/CreateAlbumModal';
import AddToAlbumModal from '@/Components/AddToAlbumModal';
import ConfirmModal from '@/Components/ConfirmModal';
import KeyboardShortcutsModal from '@/Components/KeyboardShortcutsModal';
import { PhotoGridSkeleton } from '@/Components/SkeletonLoader';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/Hooks/useKeyboardShortcuts';
import { X, Trash2, FolderPlus, Share2, Calendar, Image, Folder, Plus, ArrowUpDown, Filter, HelpCircle, Heart, Loader2 } from 'lucide-react';

type MediaType = '' | 'image' | 'video';

interface Photo {
    id: number;
    path: string;
    thumb_path: string | null;
    created_at: string;
    captured_at?: string | null;
    size?: number;
    mime?: string;
    is_favorite?: boolean;
    location_text?: string | null;
    location_name?: string | null;
    exif?: Record<string, any> | null;
}

interface Props {
    photos: {
        data: Photo[];
        current_page: number;
        last_page: number;
    };
    filters?: {
        q?: string;
        type?: 'image' | 'video';
        from?: string;
        to?: string;
        sort?: string;
        size?: 'small' | 'medium' | 'large';
        format?: string;
    }
}

interface PhotoGroup {
    date: string;
    label: string;
    photos: Photo[];
}

interface LocationGroup {
    key: string;
    label: string;
    photos: Photo[];
}

export default function PhotosIndex({ photos, filters }: Props) {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
    const [groupBy, setGroupBy] = useState<'date' | 'location'>(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('gp.groupBy') : null;
        return (saved === 'location' || saved === 'date') ? (saved as 'date'|'location') : 'date';
    });
    const [sortBy, setSortBy] = useState<string>(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('gp.sortBy') : null;
        const value = saved || (filters?.sort || 'newest');
        // Ensure value is a valid option
        const validOptions = ['newest', 'oldest', 'captured_desc', 'captured_asc', 'name_asc', 'name_desc', 'size_desc', 'size_asc'];
        return validOptions.includes(value) ? value : 'newest';
    });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
    const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
    const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [sizeFilter, setSizeFilter] = useState<string>(() => {
        const value = filters?.size;
        return (typeof value === 'string' ? value : '');
    });
    const [formatFilter, setFormatFilter] = useState<string>(() => {
        const value = filters?.format;
        return (typeof value === 'string' ? value : '');
    });
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const reload = () => router.reload();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const openFilePicker = () => fileInputRef.current?.click();
    const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const formData = new FormData();
        Array.from(files).forEach((f) => formData.append('photos[]', f));
        router.post('/photos', formData, {
            preserveScroll: true,
            onSuccess: () => {
                // reset input to allow re-selecting same files
                e.target.value = '';
                reload();
            },
            onError: () => {
                e.target.value = '';
            }
        });
    };

    // Infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current || photos.current_page >= photos.last_page) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    router.get(
                        route('photos.index'),
                        {
                            page: photos.current_page + 1,
                            sort: sortBy,
                            size: sizeFilter || undefined,
                            format: formatFilter || undefined,
                            ...filters,
                        },
                        {
                            preserveState: true,
                            preserveScroll: true,
                            onSuccess: () => setIsLoadingMore(false),
                            onError: () => setIsLoadingMore(false),
                        }
                    );
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(loadMoreRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [photos.current_page, photos.last_page, isLoadingMore, sortBy, filters]);

        // Keyboard shortcuts
        useKeyboardShortcuts([
            {
                key: 'a',
                ctrl: true,
                callback: () => {
                    if (photos.data.length > 0 && viewerIndex === null) {
                        const allIds = new Set(photos.data.map(p => p.id));
                        setSelectedPhotos(allIds);
                    }
                },
                description: 'Chọn tất cả'
            },
            {
                key: 'Escape',
                callback: () => {
                    if (selectedPhotos.size > 0) {
                        setSelectedPhotos(new Set());
                    }
                    if (showFilters) {
                        setShowFilters(false);
                    }
                    if (showShortcuts) {
                        setShowShortcuts(false);
                    }
                },
                description: 'Bỏ chọn / Đóng'
            },
            {
                key: 'Delete',
                callback: () => {
                    if (selectedPhotos.size > 0 && viewerIndex === null) {
                        deleteSelectedPhotos();
                    }
                },
                description: 'Xóa ảnh đã chọn'
            },
            {
                key: 'u',
                callback: () => {
                    if (viewerIndex === null) {
                        openFilePicker();
                    }
                },
                description: 'Tải lên ảnh'
            },
            {
                key: '?',
                callback: () => {
                    setShowShortcuts(true);
                },
                description: 'Hiển thị phím tắt'
            },
            {
                key: 'f',
                ctrl: true,
                callback: () => {
                    if (viewerIndex === null) {
                        setShowFilters(!showFilters);
                    }
                },
                description: 'Mở/đóng bộ lọc'
            }
        ], true);

    // Group photos by date (captured_at or created_at)
    const groupedByDate = useMemo(() => {
        const groups: Record<string, PhotoGroup> = {};
        
        photos.data.forEach(photo => {
            const date = new Date(photo.captured_at || photo.created_at);
            const dateKey = date.toISOString().split('T')[0];
            
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: dateKey,
                    label: formatDateLabel(date),
                    photos: []
                };
            }
            
            groups[dateKey].photos.push(photo);
        });
        
        return Object.values(groups).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [photos.data]);

    // Group photos by location
    const groupedByLocation = useMemo<LocationGroup[]>(() => {
        const groups: Record<string, LocationGroup> = {};

        photos.data.forEach(photo => {
            // Prefer location_name (geocoded) over location_text (raw coords)
            const displayLocation = photo.location_name || photo.location_text;
            const key = (displayLocation && displayLocation.trim()) || 'unknown';
            if (!groups[key]) {
                groups[key] = {
                    key,
                    label: key === 'unknown' ? 'Không rõ địa điểm' : displayLocation!,
                    photos: []
                };
            }
            groups[key].photos.push(photo);
        });

        return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }, [photos.data]);

    function formatDateLabel(date: Date): string {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
    if (dateStr === todayStr) return 'Hôm nay';
    if (dateStr === yesterdayStr) return 'Hôm qua';
        
        const now = Date.now();
        const diff = now - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days < 7) {
            return date.toLocaleDateString('vi-VN', { weekday: 'long' });
        }
        
        return date.toLocaleDateString('vi-VN', { 
            month: 'long',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }

    const deletePhoto = (id: number) => {
        // Open confirm modal for single delete
        setSingleDeleteId(id);
    };

    const togglePhotoSelection = (photoId: number) => {
        const newSelection = new Set(selectedPhotos);
        if (newSelection.has(photoId)) {
            newSelection.delete(photoId);
        } else {
            newSelection.add(photoId);
        }
        setSelectedPhotos(newSelection);
    };

    const deleteSelectedPhotos = () => {
        if (selectedPhotos.size === 0) return;
        setBulkDeleteOpen(true);
    };

    const addSelectedToAlbum = () => {
        if (selectedPhotos.size === 0) return;
        setCreateAlbumOpen(true);
    };

    const handleCreateAlbum = (name: string) => {
        router.post('/albums', { name, photo_ids: Array.from(selectedPhotos) }, {
            onSuccess: () => {
                setSelectedPhotos(new Set());
                setCreateAlbumOpen(false);
            },
            onError: () => {
                // Keep modal open for user to retry/adjust
            }
        });
    };

    const toggleFavorite = (id: number) => {
        router.post(`/photos/${id}/favorite`, {}, {
            preserveScroll: true,
            onSuccess: () => reload(),
        });
    };

    const handleBatchFavorite = () => {
        if (selectedPhotos.size === 0) return;
        setIsProcessingBatch(true);
        const ids = Array.from(selectedPhotos);
        const promises = ids.map(id => 
            router.post(`/photos/${id}/favorite`, {}, { preserveState: true })
        );
        Promise.all(promises).then(() => {
            setSelectedPhotos(new Set());
            setIsProcessingBatch(false);
            reload();
        }).catch(() => {
            setIsProcessingBatch(false);
        });
    };

    return (
        <GooglePhotosLayout>
            <Head title="Ảnh" />

            {/* Upload FAB (bottom-right) */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={onFilesSelected}
                className="hidden"
            />
            <button
                onClick={openFilePicker}
                title="Tải lên"
                aria-label="Tải lên"
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Selection Actions Bar */}
            {selectedPhotos.size > 0 && (
                <div className="sticky top-0 z-10 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 rounded-lg bg-blue-600 dark:bg-blue-700 text-white shadow-lg px-3 sm:px-4 py-2 sm:py-3 animate-fade-in-down">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPhotos(new Set())}
                            disabled={isProcessingBatch}
                            className="h-8 w-8 rounded-full text-white hover:bg-blue-500 dark:hover:bg-blue-600 flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold flex-1 sm:flex-none">
                            {selectedPhotos.size} đã chọn
                        </span>
                        {isProcessingBatch && (
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 -mx-2 sm:mx-0 px-2 sm:px-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBatchFavorite}
                            disabled={isProcessingBatch}
                            className="h-8 text-white hover:bg-blue-500 dark:hover:bg-blue-600 flex-shrink-0 text-xs sm:text-sm"
                        >
                            <Heart className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Yêu thích</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShareOpen(true)}
                            disabled={isProcessingBatch}
                            className="h-8 text-white hover:bg-blue-500 dark:hover:bg-blue-600 flex-shrink-0 text-xs sm:text-sm"
                        >
                            <Share2 className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Chia sẻ</span>
                        </Button>
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddToAlbumOpen(true)}
                            disabled={isProcessingBatch}
                            className="h-8 text-white hover:bg-blue-500 dark:hover:bg-blue-600 flex-shrink-0 text-xs sm:text-sm"
                        >
                            <Folder className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Thêm vào album</span>
                        </Button>
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={addSelectedToAlbum}
                            disabled={isProcessingBatch}
                            className="h-8 text-white hover:bg-blue-500 dark:hover:bg-blue-600 flex-shrink-0 text-xs sm:text-sm"
                        >
                            <FolderPlus className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Tạo album mới</span>
                        </Button>
                        <div className="h-6 w-px bg-white/30 mx-1 hidden sm:block" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={deleteSelectedPhotos}
                            disabled={isProcessingBatch}
                            className="h-8 text-white hover:bg-red-500 dark:hover:bg-red-600 flex-shrink-0 text-xs sm:text-sm"
                        >
                            <Trash2 className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Xóa</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Grouping, Sorting, and Filters Controls */}
            <div className="mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#202124] p-0.5">
                    <Button
                        variant={groupBy === 'date' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setGroupBy('date'); window.localStorage.setItem('gp.groupBy', 'date'); }}
                            className="rounded-md h-8"
                    >
                        <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">Theo ngày</span>
                            <span className="sm:hidden">Ngày</span>
                    </Button>
                    <Button
                        variant={groupBy === 'location' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => { setGroupBy('location'); window.localStorage.setItem('gp.groupBy', 'location'); }}
                            className="rounded-md h-8"
                    >
                            <span className="hidden sm:inline">Theo địa điểm</span>
                            <span className="sm:hidden">Địa điểm</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Filters Button */}
                        <Button
                            variant={showFilters ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2 h-8"
                            title="Bộ lọc (Ctrl+F)"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Bộ lọc</span>
                        </Button>

                        {/* Shortcuts Help */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowShortcuts(true)}
                            className="gap-2 h-8"
                            title="Phím tắt (?)"
                        >
                            <HelpCircle className="h-4 w-4" />
                        </Button>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <ArrowUpDown className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <select
                                value={String(sortBy || 'newest')}
                                onChange={(e) => {
                                    const newSort = e.target.value;
                                    setSortBy(newSort);
                                    window.localStorage.setItem('gp.sortBy', newSort);
                                    router.get(
                                        route('photos.index'),
                                        {
                                            ...filters,
                                            sort: newSort,
                                            size: sizeFilter || undefined,
                                            format: formatFilter || undefined,
                                        },
                                        {
                                            preserveState: false,
                                            preserveScroll: false,
                                        }
                                    );
                                }}
                                className="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                                <option value="captured_desc">Ngày chụp (mới → cũ)</option>
                                <option value="captured_asc">Ngày chụp (cũ → mới)</option>
                                <option value="name_asc">Tên (A → Z)</option>
                                <option value="name_desc">Tên (Z → A)</option>
                                <option value="size_desc">Kích thước (lớn → nhỏ)</option>
                                <option value="size_asc">Kích thước (nhỏ → lớn)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#202124] p-3 sm:p-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Bộ lọc nâng cao</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowFilters(false);
                                    setSizeFilter('');
                                    setFormatFilter('');
                                    router.get(
                                        route('photos.index'),
                                        {
                                            ...filters,
                                            sort: sortBy,
                                            size: undefined,
                                            format: undefined,
                                        },
                                        { preserveState: false }
                                    );
                                }}
                                className="h-6 text-xs"
                            >
                                Xóa bộ lọc
                    </Button>
                </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {/* Size Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Kích thước
                                </label>
                                <select
                                    value={String(sizeFilter || '')}
                                    onChange={(e) => {
                                        const newSize = e.target.value;
                                        setSizeFilter(newSize);
                                        router.get(
                                            route('photos.index'),
                                            {
                                                ...filters,
                                                sort: sortBy,
                                                size: newSize || undefined,
                                                format: formatFilter || undefined,
                                            },
                                            { preserveState: false }
                                        );
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                >
                                    <option value="">Tất cả kích thước</option>
                                    <option value="small">Nhỏ (&lt; 1MB)</option>
                                    <option value="medium">Trung bình (1MB - 5MB)</option>
                                    <option value="large">Lớn (&gt; 5MB)</option>
                                </select>
                            </div>

                            {/* Format Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Định dạng
                                </label>
                                <select
                                    value={String(formatFilter || '')}
                                    onChange={(e) => {
                                        const newFormat = e.target.value;
                                        setFormatFilter(newFormat);
                                        router.get(
                                            route('photos.index'),
                                            {
                                                ...filters,
                                                sort: sortBy,
                                                size: sizeFilter || undefined,
                                                format: newFormat || undefined,
                                            },
                                            { preserveState: false }
                                        );
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                >
                                    <option value="">Tất cả định dạng</option>
                                    <option value="jpg">JPG</option>
                                    <option value="png">PNG</option>
                                    <option value="gif">GIF</option>
                                    <option value="webp">WebP</option>
                                    <option value="mp4">MP4</option>
                                    <option value="mov">MOV</option>
                                    <option value="avi">AVI</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Photos Grid */}
            {photos.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mb-4">
                        <Image className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="mb-2 mt-6 text-lg font-medium text-gray-900 dark:text-gray-100">
                        Chưa có ảnh nào
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nhấn nút dấu cộng ở góc dưới bên phải để thêm ảnh hoặc video đầu tiên của bạn
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {(groupBy === 'date' ? groupedByDate : groupedByLocation).map((group, idx) => (
                        <div key={groupBy === 'date' ? (group as PhotoGroup).date : (group as LocationGroup).key}>
                            {/* Group Header */}
                            <div className="mb-3 py-2">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    {groupBy === 'date' ? (
                                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    ) : (
                                        <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                        </svg>
                                    )}
                                    {groupBy === 'date' ? (group as PhotoGroup).label : (group as LocationGroup).label}
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                        ({group.photos.length})
                                    </span>
                                </h3>
                            </div>

                            {/* Photo Grid - Masonry with clamped heights */}
                            <div className="grid grid-cols-2 gap-1 [grid-auto-rows:4px] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                                {group.photos.map((photo) => {
                                    const globalIndex = photos.data.findIndex(p => p.id === photo.id);
                                    const isSelected = selectedPhotos.has(photo.id);
                                    
                                    return (
                                        <PhotoGridItem
                                            key={photo.id}
                                            photo={photo}
                                            isSelected={isSelected}
                                            showCheckbox={selectedPhotos.size > 0}
                                            onClick={(e) => {
                                                // Allow Ctrl/Meta/Shift click to toggle selection directly
                                                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                                    togglePhotoSelection(photo.id);
                                                    return;
                                                }
                                                if (selectedPhotos.size > 0) {
                                                    togglePhotoSelection(photo.id);
                                                } else {
                                                    setViewerIndex(globalIndex);
                                                }
                                            }}
                                            onToggleSelect={(e) => {
                                                e.stopPropagation();
                                                togglePhotoSelection(photo.id);
                                            }}
                                            onToggleFavorite={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(photo.id);
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Infinite Scroll Trigger */}
                    {photos.current_page < photos.last_page && (
                        <div ref={loadMoreRef} className="py-8">
                            {isLoadingMore ? (
                                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 [grid-auto-rows:4px]">
                                    <PhotoGridSkeleton count={12} />
                                </div>
                            ) : (
                                <div className="flex justify-center items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                                    <span>Cuộn xuống để tải thêm</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {viewerIndex !== null && (
                <PhotoViewerModal
                    photos={photos.data}
                    initialIndex={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    onDelete={deletePhoto}
                    onToggleFavorite={toggleFavorite}
                />
            )}

            {/* Share photos modal */}
            <SharePhotosModal
                isOpen={shareOpen}
                onClose={() => {
                    setShareOpen(false);
                    setSelectedPhotos(new Set());
                }}
                photoIds={Array.from(selectedPhotos)}
                photos={photos.data.filter(p => selectedPhotos.has(p.id))}
            />

            {/* Create Album modal */}
            <CreateAlbumModal
                isOpen={createAlbumOpen}
                onClose={() => setCreateAlbumOpen(false)}
                onCreate={handleCreateAlbum}
            />

            {/* Add to Album modal */}
            <AddToAlbumModal
                isOpen={addToAlbumOpen}
                onClose={() => {
                    setAddToAlbumOpen(false);
                    setSelectedPhotos(new Set());
                    reload();
                }}
                photoIds={Array.from(selectedPhotos)}
            />

            {/* Confirm: Single delete */}
            <ConfirmModal
                isOpen={singleDeleteId !== null}
                onClose={() => setSingleDeleteId(null)}
                onConfirm={() => {
                    if (singleDeleteId === null) return;
                    router.delete(`/photos/${singleDeleteId}`, {
                        onSuccess: () => {
                            setViewerIndex(null);
                            setSingleDeleteId(null);
                            reload();
                        },
                        onError: () => {
                            setSingleDeleteId(null);
                        }
                    });
                }}
                title="Xóa ảnh"
                message="Chuyển ảnh này vào thùng rác?"
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Confirm: Bulk delete */}
            <ConfirmModal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={() => {
                    const ids = Array.from(selectedPhotos);
                    const promises = ids.map(id => router.delete(`/photos/${id}`, { preserveState: true }));
                    Promise.all(promises).then(() => {
                        setBulkDeleteOpen(false);
                        setSelectedPhotos(new Set());
                        reload();
                    }).catch(() => setBulkDeleteOpen(false));
                }}
                title="Xóa ảnh đã chọn"
                message={`Chuyển ${selectedPhotos.size} ảnh vào thùng rác?`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                open={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />
        </GooglePhotosLayout>
    );
}
