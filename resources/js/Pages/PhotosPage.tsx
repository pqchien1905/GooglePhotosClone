import * as React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Gallery, { type GalleryPhoto } from '@/Components/Gallery';
import Lightbox from '@/Components/Lightbox';
import UploadModal from '@/Components/UploadModal';
import Button from '@/Components/ui/button';

interface Photo {
  id: number;
  path: string;
  thumb_path?: string | null;
  created_at: string;
  captured_at?: string | null;
  size?: number;
  mime?: string;
  location_text?: string | null;
  location_name?: string | null;
  exif?: Record<string, any> | null;
}

interface Props {
  photos: Photo[];
}

export default function PhotosPage({ photos }: Props) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  // Map backend photo data to Gallery format
  const galleryPhotos: GalleryPhoto[] = photos.map((p) => ({
    id: p.id,
    src: `/storage/${p.path}`,
    thumb: p.thumb_path ? `/storage/${p.thumb_path}` : null,
    title: p.location_name || p.location_text || null,
    favorite: false,
    mime: p.mime,
    metadata: p.exif || undefined,
  }));

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleUpload = (files: File[]) => {
    console.log('Uploading files:', files);
    // TODO: wire to backend upload endpoint
  };

  return (
    <AppLayout>
      <Head title="Tất cả ảnh" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tất cả ảnh</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <SvgUpload className="mr-2 h-4 w-4" /> Tải lên
        </Button>
      </div>

      <Gallery photos={galleryPhotos} onOpen={handleOpenLightbox} />

      <Lightbox photos={galleryPhotos} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onFilesSelected={handleUpload} />
    </AppLayout>
  );
}

function SvgUpload({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="21"/>
    </svg>
  );
}
