import * as React from 'react';
import PhotoCard from '@/Components/PhotoCard';

export type GalleryPhoto = {
  id: number;
  src: string; // full-size
  thumb?: string | null; // optional thumb
  title?: string | null;
  favorite?: boolean;
  width?: number;
  height?: number;
  mime?: string;
  metadata?: Record<string, any>;
};

export interface GalleryProps {
  photos: GalleryPhoto[];
  onOpen?: (index: number) => void;
}

export default function Gallery({ photos, onOpen }: GalleryProps) {
  // Recalculate spans when container resizes (optional)
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div ref={containerRef} className="[grid-auto-rows:4px] grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((p, i) => (
        <PhotoCard key={p.id} photo={p} onClick={() => onOpen?.(i)} />
      ))}
    </div>
  );
}
