import React, { useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const danger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 rounded-full p-3 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            {danger ? (
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            ) : (
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1 pt-1">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
