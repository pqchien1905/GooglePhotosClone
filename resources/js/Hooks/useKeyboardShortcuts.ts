import { useEffect } from 'react';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    callback: () => void;
    description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = shortcut.ctrl === undefined || e.ctrlKey === shortcut.ctrl || e.metaKey === shortcut.ctrl;
                const shiftMatches = shortcut.shift === undefined || e.shiftKey === shortcut.shift;
                const altMatches = shortcut.alt === undefined || e.altKey === shortcut.alt;

                if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                    e.preventDefault();
                    shortcut.callback();
                    break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
}

// Common shortcuts
export const SHORTCUTS = {
    SELECT_ALL: { key: 'a', ctrl: true, description: 'Chọn tất cả' },
    DESELECT: { key: 'Escape', description: 'Bỏ chọn' },
    DELETE: { key: 'Delete', description: 'Xóa' },
    SEARCH: { key: '/', description: 'Tìm kiếm' },
    UPLOAD: { key: 'u', description: 'Tải lên' },
    NEXT: { key: 'ArrowRight', description: 'Ảnh tiếp theo' },
    PREV: { key: 'ArrowLeft', description: 'Ảnh trước' },
    CLOSE: { key: 'Escape', description: 'Đóng' },
};
