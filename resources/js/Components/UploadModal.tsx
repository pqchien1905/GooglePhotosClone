import * as React from 'react';
import Dialog, { DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog';
import Button from '@/Components/ui/button';
import Progress from '@/Components/ui/progress';

export interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected?: (files: File[]) => void;
}

export default function UploadModal({ open, onOpenChange, onFilesSelected }: UploadModalProps) {
  const [dragging, setDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpload = () => {
    if (!files.length) return;
    setUploading(true);
    // Simulate upload progress
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setUploading(false);
        onFilesSelected?.(files);
        setFiles([]);
        onOpenChange(false);
      }
    }, 200);
  };

  const handleCancel = () => {
    setUploading(false);
    setProgress(0);
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-2">Tải ảnh lên</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <div
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 hover:border-blue-400 dark:border-gray-700'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <SvgUpload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Kéo thả ảnh vào đây, hoặc nhấp để chọn
            </p>
            <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleChange} />
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
            <p className="text-sm font-medium mb-2">Đã chọn {files.length} tệp</p>
            <div className="grid grid-cols-4 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded border border-gray-200 dark:border-gray-800">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                  >
                    <SvgX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && (
          <div className="mb-4">
            <Progress value={progress} />
            <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-300">Đang tải lên... {progress}%</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
            {uploading ? 'Đang tải lên...' : 'Tải lên'}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

function SvgUpload({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="21"/>
    </svg>
  );
}

function SvgX({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
