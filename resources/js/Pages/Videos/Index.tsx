import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import PhotoViewerModal from '@/Components/PhotoViewerModal';
import PhotoGridItem from '@/Components/PhotoGridItem';
import ShareVideosModal from '@/Components/ShareVideosModal';
import CreateAlbumModal from '@/Components/CreateAlbumModal';
import AddToAlbumModal from '@/Components/AddToAlbumModal';
import ConfirmModal from '@/Components/ConfirmModal';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/Hooks/useKeyboardShortcuts';
import { X, Trash2, FolderPlus, Share2, Calendar, Video, Folder, Plus } from 'lucide-react';

interface Video {
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
}

interface Props {
    videos: {
        data: Video[];
        current_page: number;
        last_page: number;
    };
    filters?: {
        q?: string;
        from?: string;
        to?: string;
    }
}

interface VideoGroup {
    date: string;
    label: string;
    videos: Video[];
}

export default function VideosIndex({ videos, filters }: Props) {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
    const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
    const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const reload = () => router.reload();

    // Upload via native file picker (videos only)
    const openFilePicker = () => fileInputRef.current?.click();
    const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('photos[]', file));
        router.post('/photos', formData, {
            forceFormData: true,
            onSuccess: () => reload(),
        });
    };

    // Infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current || videos.current_page >= videos.last_page) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    setIsLoadingMore(true);
                    router.get(
                        route('videos.index'),
                        {
                            page: videos.current_page + 1,
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
    }, [videos.current_page, videos.last_page, isLoadingMore]);

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 'a',
            ctrl: true,
            callback: () => {
                if (videos.data.length > 0) {
                    const allIds = new Set(videos.data.map(v => v.id));
                    setSelectedVideos(allIds);
                }
            },
            description: 'Chọn tất cả'
        },
        {
            key: 'Escape',
            callback: () => {
                if (selectedVideos.size > 0) {
                    setSelectedVideos(new Set());
                }
            },
            description: 'Bỏ chọn'
        },
        {
            key: 'Delete',
            callback: () => {
                if (selectedVideos.size > 0) {
                    deleteSelectedVideos();
                }
            },
            description: 'Xóa video đã chọn'
        }
    ], viewerIndex === null); // Only enable when viewer is closed

    // Group videos by date
    const groupedByDate = useMemo(() => {
        const groups: Record<string, VideoGroup> = {};
        
        videos.data.forEach(video => {
            const date = new Date(video.captured_at || video.created_at);
            const dateKey = date.toISOString().split('T')[0];
            
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: dateKey,
                    label: formatDateLabel(date),
                    videos: []
                };
            }
            
            groups[dateKey].videos.push(video);
        });
        
        return Object.values(groups).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [videos.data]);

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

    const deleteVideo = (id: number) => {
        // Open confirm modal for single delete
        setSingleDeleteId(id);
    };

    const toggleVideoSelection = (videoId: number) => {
        const newSelection = new Set(selectedVideos);
        if (newSelection.has(videoId)) {
            newSelection.delete(videoId);
        } else {
            newSelection.add(videoId);
        }
        setSelectedVideos(newSelection);
    };

    const deleteSelectedVideos = () => {
        if (selectedVideos.size === 0) return;
        setBulkDeleteOpen(true);
    };

    const addSelectedToAlbum = () => {
        if (selectedVideos.size === 0) return;
        setCreateAlbumOpen(true);
    };

    const handleCreateAlbum = (name: string) => {
        router.post('/albums', { name, photo_ids: Array.from(selectedVideos) }, {
            onSuccess: () => {
                setSelectedVideos(new Set());
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
            <Head title="Video" />

            {/* Hidden file input for native video upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={onFilesSelected}
            />

            {/* Selection Actions Bar */}
            {selectedVideos.size > 0 && (
                <div className="sticky top-0 z-10 mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-6 py-4 text-white shadow-2xl backdrop-blur-md animate-fade-in-down border border-blue-400/30">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedVideos(new Set())}
                            className="h-9 w-9 rounded-full text-white hover:bg-white/20 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <Badge variant="secondary" className="bg-white/20 text-white text-base font-semibold px-4 py-2 hover:bg-white/30">
                            {selectedVideos.size} đã chọn
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={deleteSelectedVideos}
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

            {/* Videos Grid */}
            {videos.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300/80 bg-gradient-to-br from-gray-50/50 to-white py-24 text-center dark:border-gray-700/80 dark:from-gray-800/50 dark:to-gray-900/50 animate-fade-in-up">
                    <div className="rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-6 dark:from-gray-700 dark:to-gray-800 shadow-lg mb-4 animate-scale-in">
                        <Video className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="mb-2 mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Chưa có video nào
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nhấn nút dấu cộng ở góc dưới bên phải để tải video đầu tiên
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {groupedByDate.map((group, idx) => (
                        <div key={group.date} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Group Header */}
                            <div className="sticky top-0 z-10 mb-4 bg-white/95 backdrop-blur-md py-3 -mx-2 px-2 rounded-xl dark:bg-gray-900/95 shadow-soft border-b border-gray-200/50 dark:border-gray-700/50">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>{group.label}</span>
                                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        {group.videos.length}
                                    </Badge>
                                </h3>
                            </div>

                            {/* Video Grid - Masonry with clamped heights */}
                            <div className="grid grid-cols-2 gap-1 [grid-auto-rows:4px] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                                {group.videos.map((video) => {
                                    const globalIndex = videos.data.findIndex(v => v.id === video.id);
                                    const isSelected = selectedVideos.has(video.id);
                                    
                                    return (
                                        <PhotoGridItem
                                            key={video.id}
                                            photo={video}
                                            isSelected={isSelected}
                                            showCheckbox={selectedVideos.size > 0}
                                            onClick={(e) => {
                                                // Allow Ctrl/Meta/Shift click to toggle selection directly
                                                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                                    toggleVideoSelection(video.id);
                                                    return;
                                                }
                                                if (selectedVideos.size > 0) {
                                                    toggleVideoSelection(video.id);
                                                } else {
                                                    setViewerIndex(globalIndex);
                                                }
                                            }}
                                            onToggleSelect={(e) => {
                                                e.stopPropagation();
                                                toggleVideoSelection(video.id);
                                            }}
                                            onToggleFavorite={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(video.id);
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Infinite Scroll Trigger */}
                    {videos.current_page < videos.last_page && (
                        <div ref={loadMoreRef} className="flex justify-center py-8 animate-fade-in">
                            {isLoadingMore ? (
                                <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
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

            {viewerIndex !== null && (
                <PhotoViewerModal
                    photos={videos.data}
                    initialIndex={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    onDelete={deleteVideo}
                    onToggleFavorite={toggleFavorite}
                />
            )}

            {/* Share videos modal */}
            <ShareVideosModal
                isOpen={shareOpen}
                onClose={() => {
                    setShareOpen(false);
                    setSelectedVideos(new Set());
                }}
                videoIds={Array.from(selectedVideos)}
                videos={videos.data.filter(v => selectedVideos.has(v.id))}
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
                    setSelectedVideos(new Set());
                    reload();
                }}
                photoIds={Array.from(selectedVideos)}
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
                title="Xóa video"
                message="Chuyển video này vào thùng rác?"
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Confirm: Bulk delete */}
            <ConfirmModal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={() => {
                    const ids = Array.from(selectedVideos);
                    const promises = ids.map(id => router.delete(`/photos/${id}`, { preserveState: true }));
                    Promise.all(promises).then(() => {
                        setBulkDeleteOpen(false);
                        setSelectedVideos(new Set());
                        reload();
                    }).catch(() => setBulkDeleteOpen(false));
                }}
                title="Xóa video đã chọn"
                message={`Chuyển ${selectedVideos.size} video vào thùng rác?`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
            />

            {/* Floating action button: upload videos */}
            <button
                onClick={openFilePicker}
                title="Tải video"
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-glow-lg hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 dark:ring-offset-gray-900 active:scale-95 animate-fade-in-up"
            >
                <Plus className="h-7 w-7 transition-transform duration-300 group-hover:rotate-90" />
            </button>
        </GooglePhotosLayout>
    );
}
