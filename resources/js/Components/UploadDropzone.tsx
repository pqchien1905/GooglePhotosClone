import { router } from '@inertiajs/react';
import { useCallback, useState, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Upload, X, Image as ImageIcon, Video, Loader2, Zap } from 'lucide-react';
import { Progress } from '@/Components/ui/progress';
import { compressImages, formatFileSize } from '@/utils/imageCompression';

interface UploadDropzoneProps {
    onUploadComplete?: () => void;
    videoOnly?: boolean;
    inertiaPreserveState?: boolean;
    inertiaPreserveScroll?: boolean;
}

export default function UploadDropzone({ onUploadComplete, videoOnly = false, inertiaPreserveState = false, inertiaPreserveScroll = false }: UploadDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [compressing, setCompressing] = useState(false);
    const [compressionStats, setCompressionStats] = useState<{ original: number; compressed: number } | null>(null);

    const handleFiles = useCallback((newFiles: FileList | File[]) => {
        const mediaFiles = Array.from(newFiles).filter((file) => {
            if (videoOnly) {
                return file.type.startsWith('video/');
            }
            return file.type.startsWith('image/') || file.type.startsWith('video/');
        });
        setFiles((prev) => [...prev, ...mediaFiles]);
    }, [videoOnly]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles]
    );

    const handlePaste = useCallback(
        (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const mediaFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/') || items[i].type.startsWith('video/')) {
                    const file = items[i].getAsFile();
                    if (file) mediaFiles.push(file);
                }
            }

            if (mediaFiles.length > 0) {
                handleFiles(mediaFiles);
            }
        },
        [handleFiles]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                handleFiles(e.target.files);
            }
        },
        [handleFiles]
    );

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const uploadFiles = useCallback(async () => {
        if (files.length === 0) return;

        setCompressing(true);
        setUploadProgress(0);

        try {
            // Compress images before upload
            const imageFiles = files.filter(f => f.type.startsWith('image/'));
            const videoFiles = files.filter(f => f.type.startsWith('video/'));
            
            let processedFiles: (File | Blob)[] = [...videoFiles];
            
            if (imageFiles.length > 0) {
                const compressedImages = await compressImages(imageFiles);
                processedFiles = [...compressedImages, ...videoFiles];
            } else {
                processedFiles = files;
            }

            // Calculate compression stats
            const originalSize = files.reduce((sum, f) => sum + f.size, 0);
            const compressedSize = processedFiles.reduce((sum, f) => sum + (f.size || 0), 0);
            if (compressedSize < originalSize) {
                setCompressionStats({
                    original: originalSize,
                    compressed: compressedSize,
                });
            }

            setCompressing(false);
            setUploading(true);

            const formData = new FormData();
            processedFiles.forEach((file) => {
                // Convert Blob to File if needed
                const fileToUpload = file instanceof File 
                    ? file 
                    : new File([file], (file as any).name || 'image.jpg', { type: file.type });
                formData.append('photos[]', fileToUpload);
            });

            // Simulate progress for better UX (Laravel doesn't provide real upload progress)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            router.post('/photos', formData, {
                preserveState: inertiaPreserveState,
                preserveScroll: inertiaPreserveScroll,
                onSuccess: () => {
                    clearInterval(progressInterval);
                    setUploadProgress(100);
                    setTimeout(() => {
                        setFiles([]);
                        setUploadProgress(0);
                        setCompressionStats(null);
                        onUploadComplete?.();
                    }, 500);
                },
                onFinish: () => {
                    clearInterval(progressInterval);
                    setUploading(false);
                },
                onError: () => {
                    clearInterval(progressInterval);
                    setUploading(false);
                    setCompressing(false);
                },
            });
        } catch (error) {
            console.error('Compression error:', error);
            setCompressing(false);
            setUploading(false);
            // Fallback: upload original files
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('photos[]', file);
            });
            router.post('/photos', formData, {
                preserveState: inertiaPreserveState,
                preserveScroll: inertiaPreserveScroll,
                onFinish: () => setUploading(false),
            });
        }
    }, [files, onUploadComplete, inertiaPreserveState, inertiaPreserveScroll]);

    // Attach paste listener
    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    return (
        <div className="w-full space-y-6">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-lg scale-[1.02]'
                        : 'border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-blue-600 dark:hover:bg-gray-900/70'
                }`}
            >
                <input
                    type="file"
                    multiple
                    accept={videoOnly ? "video/*" : "image/*,video/*"}
                    onChange={handleFileInput}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={uploading}
                />
                <div className="pointer-events-none space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 shadow-sm">
                        <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {videoOnly 
                                ? 'Tải lên video'
                                : 'Tải lên ảnh và video'
                            }
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kéo thả vào đây, bấm để chọn, hoặc nhấn <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">Ctrl+V</kbd> để dán
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            {videoOnly
                                ? 'MP4, MOV, AVI, WMV, FLV, WEBM, MKV • Tối đa 200MB/file'
                                : 'JPG, PNG, GIF, WebP, MP4, MOV, AVI, WEBM • Tối đa 200MB/file'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* File Preview & Upload Section */}
            {files.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Sẵn sàng tải lên
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {files.length} tệp • {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
                            </p>
                        </div>
                        <Button
                            onClick={uploadFiles}
                            disabled={uploading || compressing}
                            size="sm"
                            className="gap-2"
                        >
                            {(uploading || compressing) ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {compressing ? 'Đang nén...' : 'Đang tải lên...'}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    Tải lên tất cả
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Compression Stats */}
                    {compressionStats && (
                        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 px-3 py-2">
                            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                                <Zap className="h-4 w-4" />
                                <span>
                                    Đã nén: {formatFileSize(compressionStats.original)} → {formatFileSize(compressionStats.compressed)} 
                                    ({Math.round((1 - compressionStats.compressed / compressionStats.original) * 100)}% giảm)
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {(compressing || uploading) && (
                        <div className="mb-4 space-y-2">
                            <Progress value={compressing ? 50 : uploadProgress} className="h-2" />
                            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                                {compressing ? 'Đang nén ảnh...' : `${uploadProgress}% hoàn thành`}
                            </p>
                        </div>
                    )}

                    {/* File Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {files.map((file, index) => {
                            const isVideo = file.type.startsWith('video/');
                            return (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                                        {isVideo ? (
                                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                                                <Video className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                                            </div>
                                        ) : (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        )}
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeFile(index)}
                                        disabled={uploading}
                                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg opacity-0 transition-all hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Xóa"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>

                                    {/* File Info */}
                                    <div className="p-2 space-y-0.5">
                                        <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
