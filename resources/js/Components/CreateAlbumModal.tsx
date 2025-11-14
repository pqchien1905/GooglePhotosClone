import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  defaultName?: string;
}

export default function CreateAlbumModal({ isOpen, onClose, onCreate, defaultName }: Props) {
  const [name, setName] = useState(defaultName ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName ?? '');
      // Small delay so autofocus works after mount
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen, defaultName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Tạo album mới</h2>
        <form onSubmit={submit}>
          <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">Tên album</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên album"
            className="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">Hủy</button>
            <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Tạo</button>
          </div>
        </form>
      </div>
    </div>
  );
}
