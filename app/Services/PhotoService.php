<?php

namespace App\Services;

use App\Jobs\ExtractMetadata;
use App\Jobs\GenerateThumbnail;
use App\Jobs\OptimizeImage;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class PhotoService
{
    /**
     * Get paginated photos for a user with filters.
     */
    public function getPhotos(User $user, array $filters = []): array
    {
        $cacheKey = 'photos_' . $user->id . '_' . md5(json_encode($filters));
        
        return Cache::remember($cacheKey, 300, function () use ($user, $filters) {
            $builder = Photo::query()
                ->where('user_id', $user->id)
                ->whereNull('deleted_at');

            $this->applyFilters($builder, $filters);
            $this->applySorting($builder, $filters['sort'] ?? 'newest');

            $perPage = min((int) ($filters['per_page'] ?? 50), 100);
            
            return $builder
                ->select(['id', 'path', 'thumb_path', 'created_at', 'captured_at', 'size', 'mime', 'is_favorite', 'location_text', 'location_name', 'exif'])
                ->paginate($perPage)
                ->toArray();
        });
    }

    /**
     * Upload photos for a user.
     */
    public function uploadPhotos(User $user, array $files): array
    {
        $totalNewSize = $this->calculateNewSize($user, $files);

        // Check storage quota
        if ($totalNewSize > 0 && $user->storage_used + $totalNewSize > $user->storage_quota) {
            return [
                'success' => false,
                'error' => 'storage_exceeded',
                'storage' => [
                    'used' => $user->storage_used,
                    'quota' => $user->storage_quota,
                    'available' => max(0, $user->storage_quota - $user->storage_used),
                ],
            ];
        }

        $uploaded = [];
        $restored = 0;
        $duplicates = 0;

        foreach ($files as $file) {
            $result = $this->processFile($user, $file);
            
            if ($result['status'] === 'uploaded') {
                $uploaded[] = $result['photo'];
            } elseif ($result['status'] === 'restored') {
                $restored++;
            } else {
                $duplicates++;
            }
        }

        $this->clearUserCache($user->id);

        return [
            'success' => true,
            'uploaded' => $uploaded,
            'uploaded_count' => count($uploaded),
            'restored' => $restored,
            'duplicates' => $duplicates,
        ];
    }

    /**
     * Soft delete a photo.
     */
    public function deletePhoto(Photo $photo): bool
    {
        $photo->delete();
        $this->clearUserCache($photo->user_id);
        return true;
    }

    /**
     * Restore a photo from trash.
     */
    public function restorePhoto(Photo $photo): bool
    {
        $photo->restore();
        $this->clearUserCache($photo->user_id);
        return true;
    }

    /**
     * Permanently delete a photo.
     */
    public function forceDeletePhoto(Photo $photo): bool
    {
        $user = $photo->user;
        $fileSize = $photo->size ?? 0;

        if ($photo->path) {
            Storage::disk('public')->delete($photo->path);
        }
        if ($photo->thumb_path) {
            Storage::disk('public')->delete($photo->thumb_path);
        }

        $photo->forceDelete();

        if ($user) {
            $user->decrement('storage_used', $fileSize);
        }

        $this->clearUserCache($photo->user_id);
        return true;
    }

    /**
     * Toggle favorite status.
     */
    public function toggleFavorite(Photo $photo): bool
    {
        $photo->is_favorite = !$photo->is_favorite;
        $photo->save();
        $this->clearUserCache($photo->user_id);
        return $photo->is_favorite;
    }

    /**
     * Apply filters to query builder.
     */
    protected function applyFilters($builder, array $filters): void
    {
        if (!empty($filters['q'])) {
            $q = trim($filters['q']);
            $builder->where(function ($qq) use ($q) {
                $qq->where('path', 'like', "%{$q}%")
                   ->orWhere('location_text', 'like', "%{$q}%");
            });
        }

        if (!empty($filters['type'])) {
            if ($filters['type'] === 'image') {
                $builder->where('mime', 'like', 'image/%');
            } elseif ($filters['type'] === 'video') {
                $builder->where('mime', 'like', 'video/%');
            }
        }

        if (!empty($filters['from'])) {
            $builder->where(function ($qq) use ($filters) {
                $qq->whereDate('captured_at', '>=', $filters['from'])
                   ->orWhere(function ($q2) use ($filters) {
                       $q2->whereNull('captured_at')->whereDate('created_at', '>=', $filters['from']);
                   });
            });
        }

        if (!empty($filters['to'])) {
            $builder->where(function ($qq) use ($filters) {
                $qq->whereDate('captured_at', '<=', $filters['to'])
                   ->orWhere(function ($q2) use ($filters) {
                       $q2->whereNull('captured_at')->whereDate('created_at', '<=', $filters['to']);
                   });
            });
        }

        if (!empty($filters['size'])) {
            switch ($filters['size']) {
                case 'small':
                    $builder->where('size', '<', 1 * 1024 * 1024);
                    break;
                case 'medium':
                    $builder->whereBetween('size', [1 * 1024 * 1024, 5 * 1024 * 1024]);
                    break;
                case 'large':
                    $builder->where('size', '>', 5 * 1024 * 1024);
                    break;
            }
        }

        if (!empty($filters['format'])) {
            $builder->where('mime', 'like', "%{$filters['format']}%");
        }

        if (!empty($filters['favorites_only'])) {
            $builder->where('is_favorite', true);
        }

        if (!empty($filters['videos_only'])) {
            $builder->where('mime', 'like', 'video/%');
        }
    }

    /**
     * Apply sorting to query builder.
     */
    protected function applySorting($builder, string $sort): void
    {
        switch ($sort) {
            case 'oldest':
                $builder->orderByRaw('COALESCE(captured_at, created_at) ASC, id ASC');
                break;
            case 'name_asc':
                $builder->orderBy('path', 'ASC');
                break;
            case 'name_desc':
                $builder->orderBy('path', 'DESC');
                break;
            case 'size_asc':
                $builder->orderBy('size', 'ASC')->orderBy('id', 'ASC');
                break;
            case 'size_desc':
                $builder->orderBy('size', 'DESC')->orderBy('id', 'DESC');
                break;
            case 'captured_asc':
                $builder->orderByRaw('COALESCE(captured_at, created_at) ASC, id ASC');
                break;
            case 'captured_desc':
                $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC');
                break;
            case 'newest':
            default:
                $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC');
                break;
        }
    }

    /**
     * Calculate total size of new files.
     */
    protected function calculateNewSize(User $user, array $files): int
    {
        $totalNewSize = 0;

        foreach ($files as $file) {
            $hash = hash_file('sha256', $file->getRealPath());
            
            $existing = Photo::withTrashed()
                ->where('user_id', $user->id)
                ->where('sha256', $hash)
                ->first();

            if (!$existing) {
                $totalNewSize += $file->getSize();
            }
        }

        return $totalNewSize;
    }

    /**
     * Process a single uploaded file.
     */
    protected function processFile(User $user, UploadedFile $file): array
    {
        $hash = hash_file('sha256', $file->getRealPath());
        $mime = $file->getMimeType();
        $isVideo = str_starts_with($mime, 'video/');

        $existing = Photo::withTrashed()
            ->where('user_id', $user->id)
            ->where('sha256', $hash)
            ->first();

        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
                if (!$existing->thumb_path) {
                    GenerateThumbnail::dispatch($existing);
                }
                return ['status' => 'restored', 'photo' => $existing];
            }
            return ['status' => 'duplicate', 'photo' => $existing];
        }

        $path = $file->store($isVideo ? 'videos' : 'photos', 'public');
        $fileSize = $file->getSize();

        $photo = Photo::create([
            'user_id' => $user->id,
            'path' => $path,
            'size' => $fileSize,
            'mime' => $mime,
            'sha256' => $hash,
            'visibility' => 'private',
        ]);

        $user->increment('storage_used', $fileSize);

        if (!$isVideo) {
            OptimizeImage::dispatch($photo);
        }
        GenerateThumbnail::dispatch($photo);
        ExtractMetadata::dispatch($photo);

        return ['status' => 'uploaded', 'photo' => $photo];
    }

    /**
     * Clear cache for a user.
     */
    protected function clearUserCache(int $userId): void
    {
        // In production, use Redis with tags for selective cache clearing
        Cache::flush();
    }
}
