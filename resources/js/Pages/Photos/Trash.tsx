// This file has been replaced by TrashPage.tsx
import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, router } from '@inertiajs/react';
import ConfirmModal from '@/Components/ConfirmModal';
import { useMemo, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Trash2, RotateCcw, Trash, X, CheckSquare, AlertTriangle } from 'lucide-react';

interface Photo {
    id: number;
    path: string;
    thumb_path: string | null;
    deleted_at: string;
}

interface Props {
    photos: {
        data: Photo[];
    };
}

export default function TrashPage({ photos }: Props) {
    const reload = () => router.reload();
    const [restoreId, setRestoreId] = useState<number | null>(null);
    const [forceDeleteId, setForceDeleteId] = useState<number | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
    const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [restoreAllOpen, setRestoreAllOpen] = useState(false);
    const [deleteAllOpen, setDeleteAllOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartSelection, setDragStartSelection] = useState<Set<number>>(new Set());

    const confirmRestore = () => {
        if (restoreId === null) return;
        router.post(`/photos/${restoreId}/restore`, {}, {
            onSuccess: () => reload(),
            onFinish: () => setRestoreId(null),
        });
    };

    const confirmForceDelete = () => {
        if (forceDeleteId === null) return;
        router.delete(`/photos/${forceDeleteId}/force`, {
            onSuccess: () => reload(),
            onFinish: () => setForceDeleteId(null),
        });
    };

    const togglePhotoSelection = (id: number) => {
        const next = new Set(selectedPhotos);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedPhotos(next);
    };

    const clearSelection = () => setSelectedPhotos(new Set());
    const selectAll = () => setSelectedPhotos(new Set(photos.data.map(p => p.id)));

    // Drag-to-select handlers
    const handleMouseDown = (id: number, e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left mouse button
        setIsDragging(true);
        setDragStartSelection(new Set(selectedPhotos));
        togglePhotoSelection(id);
    };

    const handleMouseEnter = (id: number) => {
        if (!isDragging) return;
        // Toggle from the original state at drag start
        const next = new Set(selectedPhotos);
        if (dragStartSelection.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedPhotos(next);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const selectedCount = selectedPhotos.size;
    const allIds = useMemo(() => photos.data.map(p => p.id), [photos.data]);

    const handleBulkRestore = async () => {
        const ids = Array.from(selectedPhotos);
        await Promise.all(ids.map(id => router.post(`/photos/${id}/restore`, {}, { preserveState: true })));
        setBulkRestoreOpen(false);
        clearSelection();
        reload();
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedPhotos);
        await Promise.all(ids.map(id => router.delete(`/photos/${id}/force`, { preserveState: true })));
        setBulkDeleteOpen(false);
        clearSelection();
        reload();
    };

    const handleRestoreAll = async () => {
        await Promise.all(allIds.map(id => router.post(`/photos/${id}/restore`, {}, { preserveState: true })));
        setRestoreAllOpen(false);
        clearSelection();
        reload();
    };

    const handleDeleteAll = async () => {
        await Promise.all(allIds.map(id => router.delete(`/photos/${id}/force`, { preserveState: true })));
        setDeleteAllOpen(false);
        clearSelection();
        reload();
    };


    return (
        <GooglePhotosLayout>
            <Head title="Thùng rác" />
            {/* ...existing code... */}
        </GooglePhotosLayout>
    );
}
