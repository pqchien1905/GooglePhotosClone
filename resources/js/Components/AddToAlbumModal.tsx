import { Dialog, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Loader2, ImageIcon, Search } from 'lucide-react';

interface Album {
    id: number;
    name: string;
    photos_count: number;
    cover_photo?: {
        id: number;
        path: string;
        thumb_path: string | null;
    } | null;
}

interface AddToAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    photoIds: number[];
}

export default function AddToAlbumModal({ isOpen, onClose, photoIds }: AddToAlbumModalProps) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    // Fetch albums when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/api/albums')
                .then(res => res.json())
                .then(data => {
                    setAlbums(data.data || []);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
    }, [isOpen]);

    const filteredAlbums = albums.filter(album => 
        album.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddToAlbum = (albumId: number) => {
        setAdding(albumId);
        
        router.post(`/albums/${albumId}/photos`, {
            photo_ids: photoIds
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setAdding(null);
                onClose();
            },
            onError: () => {
                setAdding(null);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <div className="flex flex-col max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        Thêm vào album
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 overflow-hidden p-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm album..."
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                        />
                    </div>

                    {/* Albums List */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="mt-3 text-sm text-gray-500">Đang tải album...</p>
                        </div>
                    ) : filteredAlbums.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-700">
                                <FolderOpen className="h-10 w-10 text-gray-400" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {search ? 'Không tìm thấy album' : 'Chưa có album nào'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {search ? 'Thử tìm kiếm với từ khóa khác' : 'Tạo album mới để bắt đầu'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                            {filteredAlbums.map((album) => (
                                <button
                                    key={album.id}
                                    onClick={() => handleAddToAlbum(album.id)}
                                    disabled={adding !== null}
                                    className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-blue-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-400"
                                >
                                    {/* Album Cover */}
                                    <div className="flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                        {album.cover_photo ? (
                                            <img
                                                src={`/storage/${album.cover_photo.thumb_path || album.cover_photo.path}`}
                                                alt={album.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <ImageIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Album Info */}
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {album.name}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <ImageIcon className="h-3 w-3" />
                                            {album.photos_count} ảnh
                                        </div>
                                    </div>

                                    {/* Add Button */}
                                    {adding === album.id ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    ) : (
                                        <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {photoIds.length} ảnh sẽ được thêm vào album
                    </p>
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
