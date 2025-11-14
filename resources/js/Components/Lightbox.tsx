import * as React from 'react';
import Button from '@/Components/ui/button';

export interface LightboxProps {
  photos: Array<{
    id: number;
    src: string;
    title?: string | null;
    metadata?: Record<string, any>;
  }>;
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export default function Lightbox({ photos, initialIndex, open, onClose }: LightboxProps) {
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((prev) => Math.min(photos.length - 1, prev + 1));
      if (e.key === 'ArrowLeft') setIndex((prev) => Math.max(0, prev - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, photos.length, onClose]);

  if (!open || !photos[index]) return null;

  const current = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 animate-fadeIn">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10 transition">
        <SvgX className="h-6 w-6" />
      </button>

      {hasPrev && (
        <button onClick={() => setIndex(index - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition">
          <SvgChevronLeft className="h-8 w-8" />
        </button>
      )}

      {hasNext && (
        <button onClick={() => setIndex(index + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition">
          <SvgChevronRight className="h-8 w-8" />
        </button>
      )}

      <div className="flex h-full w-full flex-col items-center justify-center p-8">
        <img src={current.src} alt={current.title || ''} className="max-h-full max-w-full object-contain transition-opacity duration-300" />
        <div className="absolute bottom-4 left-4 text-white">
          {current.title && <p className="text-lg font-medium">{current.title}</p>}
          {current.metadata && (
            <div className="mt-2 text-xs text-gray-300">
              <div>Photo {index + 1} of {photos.length}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SvgX({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function SvgChevronLeft({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function SvgChevronRight({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
