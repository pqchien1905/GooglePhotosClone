import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface Shortcut {
    keys: string[];
    description: string;
    category: string;
}

const shortcuts: Shortcut[] = [
    { keys: ['Ctrl', 'A'], description: 'Chọn tất cả ảnh', category: 'Chọn' },
    { keys: ['Escape'], description: 'Bỏ chọn / Đóng', category: 'Chọn' },
    { keys: ['Delete'], description: 'Xóa ảnh đã chọn', category: 'Chọn' },
    { keys: ['U'], description: 'Tải lên ảnh', category: 'Hành động' },
    { keys: ['/'], description: 'Tìm kiếm', category: 'Điều hướng' },
    { keys: ['Ctrl', 'F'], description: 'Mở/đóng bộ lọc', category: 'Điều hướng' },
    { keys: ['?'], description: 'Hiển thị phím tắt', category: 'Trợ giúp' },
    { keys: ['→'], description: 'Ảnh tiếp theo (khi xem)', category: 'Xem ảnh' },
    { keys: ['←'], description: 'Ảnh trước (khi xem)', category: 'Xem ảnh' },
    { keys: ['I'], description: 'Hiển thị thông tin (khi xem)', category: 'Xem ảnh' },
    { keys: ['+'], description: 'Phóng to (khi xem)', category: 'Xem ảnh' },
    { keys: ['-'], description: 'Thu nhỏ (khi xem)', category: 'Xem ảnh' },
    { keys: ['0'], description: 'Reset zoom (khi xem)', category: 'Xem ảnh' },
];

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
    if (!open) return null;

    const grouped = shortcuts.reduce((acc, shortcut) => {
        if (!acc[shortcut.category]) {
            acc[shortcut.category] = [];
        }
        acc[shortcut.category].push(shortcut);
        return acc;
    }, {} as Record<string, Shortcut[]>);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Phím tắt bàn phím
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto px-6 py-4 max-h-[calc(80vh-80px)]">
                    {Object.entries(grouped).map(([category, items]) => (
                        <div key={category} className="mb-6 last:mb-0">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                {category}
                            </h3>
                            <div className="space-y-2">
                                {items.map((shortcut, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3"
                                    >
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <React.Fragment key={keyIdx}>
                                                    <kbd className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                                                        {key}
                                                    </kbd>
                                                    {keyIdx < shortcut.keys.length - 1 && (
                                                        <span className="text-xs text-gray-400">+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Nhấn <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">Escape</kbd> để đóng
                    </p>
                </div>
            </div>
        </div>
    );
}

