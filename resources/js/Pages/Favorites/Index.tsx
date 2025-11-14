import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import PhotoViewerModal from '@/Components/PhotoViewerModal';
import PhotoGridItem from '@/Components/PhotoGridItem';
import ShareToFriendsModal from '@/Components/ShareToFriendsModal';
import CreateAlbumModal from '@/Components/CreateAlbumModal';
import AddToAlbumModal from '@/Components/AddToAlbumModal';
import ConfirmModal from '@/Components/ConfirmModal';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/Hooks/useKeyboardShortcuts';
import { X, Trash2, FolderPlus, Share2, Calendar, Heart, Folder } from 'lucide-react';

type MediaType = '' | 'image' | 'video';

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
    }
}

interface PhotoGroup {
    date: string;
    label: string;
    photos: Photo[];
}

export default function FavoritesIndex({ photos, filters }: Props) {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
    const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
    const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const reload = () => router.reload();

    // Infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current || photos.current_page >= photos.last_page) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    router.get(
                        route('favorites.index'),
                        {
                            page: photos.current_page + 1,
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
    }, [photos.current_page, photos.last_page, isLoadingMore]);

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 'a',
            ctrl: true,
            callback: () => {
                if (photos.data.length > 0) {
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
            },
            description: 'Bỏ chọn'
        },
        {
            key: 'Delete',
            callback: () => {
                if (selectedPhotos.size > 0) {
                    deleteSelectedPhotos();
                }
            },
            description: 'Xóa ảnh đã chọn'
        }
    ], viewerIndex === null);

    // Group photos by date
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

    return (
        <GooglePhotosLayout>
            <Head title="Yêu thích" />

            {/* Selection Actions Bar */}
            {selectedPhotos.size > 0 && (
                <div className="sticky top-0 z-10 mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-6 py-4 text-white shadow-2xl backdrop-blur-md animate-fade-in-down border border-blue-400/30">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPhotos(new Set())}
                            className="h-9 w-9 rounded-full text-white hover:bg-white/20 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <Badge variant="secondary" className="bg-white/20 text-white text-base font-semibold px-4 py-2 hover:bg-white/30">
                            {selectedPhotos.size} đã chọn
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={deleteSelectedPhotos}
                            className="text-white hover:bg-white/20 hover:text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa
                        </Button>
                        <Button 
                            variant="ghost"
                            onClick={() => setAddToAlbumOpen(true)} 
                            className="text-white hover:bg-white/20 hover:text-white"
                        >
                            <Folder className="h-4 w-4" />
                            Thêm vào album
                        </Button>
                        <Button 
                            variant="ghost"
                            onClick={addSelectedToAlbum} 
                            className="text-white hover:bg-white/20 hover:text-white"
                        >
                            <FolderPlus className="h-4 w-4" />
                            Tạo album mới
                        </Button>
                        <Button 
                            variant="ghost"
                            onClick={() => setShareOpen(true)} 
                            className="text-white hover:bg-white/20 hover:text-white"
                        >
                            <Share2 className="h-4 w-4" />
                            Chia sẻ
                        </Button>
                    </div>
                </div>
            )}

            {/* Photos Grid */}
            {photos.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300/80 bg-gradient-to-br from-pink-50/50 via-red-50/50 to-white py-24 text-center dark:border-gray-700/80 dark:from-pink-900/20 dark:via-red-900/20 dark:to-gray-900/50 animate-fade-in-up">
                    <div className="rounded-full bg-gradient-to-br from-pink-100 to-red-100 p-6 dark:from-pink-900/30 dark:to-red-900/30 shadow-lg mb-4 animate-scale-in">
                        <Heart className="h-16 w-16 text-pink-500 dark:text-pink-400 fill-pink-500 dark:fill-pink-400" />
                    </div>
                    <p className="mb-2 mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Chưa có ảnh yêu thích
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Đánh dấu ảnh yêu thích bằng cách nhấn vào icon trái tim
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {groupedByDate.map((group, idx) => (
                        <div key={group.date} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Group Header */}
                            <div className="sticky top-0 z-10 mb-4 bg-white/95 backdrop-blur-md py-3 -mx-2 px-2 rounded-xl dark:bg-gray-900/95 shadow-soft border-b border-gray-200/50 dark:border-gray-700/50">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                    <span>{group.label}</span>
                                    <Badge variant="secondary" className="ml-auto bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                                        {group.photos.length}
                                    </Badge>
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
                        <div ref={loadMoreRef} className="flex justify-center py-8 animate-fade-in">
                            {isLoadingMore ? (
                                <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600 dark:border-pink-800 dark:border-t-pink-400"></div>
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

            {viewerIndex !== null && (
                <PhotoViewerModal
                    photos={photos.data}
                    initialIndex={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    onDelete={deletePhoto}
                    onToggleFavorite={toggleFavorite}
                />
            )}

            {/* Share to friends modal */}
            <ShareToFriendsModal
                isOpen={shareOpen}
                onClose={() => {
                    setShareOpen(false);
                    setSelectedPhotos(new Set());
                }}
                photoIds={Array.from(selectedPhotos)}
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
        </GooglePhotosLayout>
    );
}
