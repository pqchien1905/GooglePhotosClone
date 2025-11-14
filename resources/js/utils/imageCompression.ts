/**
 * Client-side image compression utility
 * Compresses images before upload to reduce file size and upload time
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    maxSizeMB: 5,
};

/**
 * Compress an image file
 * @param file Original image file
 * @param options Compression options
 * @returns Compressed file as Blob
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<Blob> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Skip compression for non-image files
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Skip if file is already small enough
    const maxSizeBytes = opts.maxSizeMB * 1024 * 1024;
    if (file.size <= maxSizeBytes) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                const aspectRatio = width / height;

                if (width > opts.maxWidth) {
                    width = opts.maxWidth;
                    height = width / aspectRatio;
                }

                if (height > opts.maxHeight) {
                    height = opts.maxHeight;
                    width = height * aspectRatio;
                }

                // Create canvas and compress
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Compression failed'));
                            return;
                        }

                        // If compressed file is larger than original, return original
                        if (blob.size >= file.size) {
                            resolve(file);
                            return;
                        }

                        resolve(blob);
                    },
                    file.type,
                    opts.quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            if (typeof e.target?.result === 'string') {
                img.src = e.target.result;
            } else {
                reject(new Error('Failed to read file'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Compress multiple image files
 * @param files Array of files to compress
 * @param options Compression options
 * @returns Array of compressed files (Blob or original File)
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {}
): Promise<(File | Blob)[]> {
    const results = await Promise.allSettled(
        files.map((file) => compressImage(file, options))
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            // Convert Blob to File if needed
            if (result.value instanceof Blob && !(result.value instanceof File)) {
                const originalFile = files[index];
                return new File([result.value], originalFile.name, {
                    type: originalFile.type,
                    lastModified: originalFile.lastModified,
                });
            }
            return result.value;
        } else {
            // Return original file if compression failed
            console.warn('Compression failed for file:', files[index].name, result.reason);
            return files[index];
        }
    });
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

