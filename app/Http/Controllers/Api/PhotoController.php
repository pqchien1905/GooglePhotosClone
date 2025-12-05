<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ExtractMetadata;
use App\Jobs\GenerateThumbnail;
use App\Jobs\OptimizeImage;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    /**
     * Get paginated list of photos.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        
        $cacheKey = 'photos_index_' . $userId . '_' . md5(json_encode([
            'q' => $request->get('q'),
            'type' => $request->get('type'),
            'from' => $request->get('from'),
            'to' => $request->get('to'),
            'sort' => $request->get('sort', 'newest'),
            'size' => $request->get('size'),
            'format' => $request->get('format'),
            'page' => $request->get('page', 1),
            'per_page' => $request->get('per_page', 50),
        ]));
        
        $photos = Cache::remember($cacheKey, 300, function () use ($request, $userId) {
            $builder = Photo::query()
                ->where('user_id', $userId)
                ->whereNull('deleted_at');

            // Search filter
            if ($q = trim((string) $request->get('q', ''))) {
                $builder->where(function ($qq) use ($q) {
                    $qq->where('path', 'like', "%{$q}%")
                       ->orWhere('location_text', 'like', "%{$q}%");
                });
            }

            // Type filter (image/video)
            if ($type = $request->get('type')) {
                if ($type === 'image') {
                    $builder->where('mime', 'like', 'image/%');
                } elseif ($type === 'video') {
                    $builder->where('mime', 'like', 'video/%');
                }
            }

            // Date range
            if ($from = $request->get('from')) {
                $builder->where(function ($qq) use ($from) {
                    $qq->whereDate('captured_at', '>=', $from)
                       ->orWhere(function ($q2) use ($from) {
                           $q2->whereNull('captured_at')->whereDate('created_at', '>=', $from);
                       });
                });
            }

            if ($to = $request->get('to')) {
                $builder->where(function ($qq) use ($to) {
                    $qq->whereDate('captured_at', '<=', $to)
                       ->orWhere(function ($q2) use ($to) {
                           $q2->whereNull('captured_at')->whereDate('created_at', '<=', $to);
                       });
                });
            }

            // Size filter
            if ($size = $request->get('size')) {
                switch ($size) {
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

            // Format filter
            if ($format = $request->get('format')) {
                $builder->where('mime', 'like', "%{$format}%");
            }

            // Sorting
            $sort = $request->get('sort', 'newest');
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

            $perPage = min((int) $request->get('per_page', 50), 100);
            
            return $builder
                ->select(['id', 'path', 'thumb_path', 'created_at', 'captured_at', 'size', 'mime', 'is_favorite', 'location_text', 'location_name', 'exif'])
                ->paginate($perPage)
                ->appends($request->only(['q', 'type', 'from', 'to', 'sort', 'size', 'format', 'per_page']));
        });
        
        return response()->json([
            'data' => $photos->items(),
            'meta' => [
                'current_page' => $photos->currentPage(),
                'last_page' => $photos->lastPage(),
                'per_page' => $photos->perPage(),
                'total' => $photos->total(),
            ],
            'filters' => $request->only(['q', 'type', 'from', 'to', 'sort', 'size', 'format']),
        ]);
    }

    /**
     * Get videos only.
     */
    public function videos(Request $request): JsonResponse
    {
        $builder = Photo::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('deleted_at')
            ->where('mime', 'like', 'video/%');

        if ($q = trim((string) $request->get('q', ''))) {
            $builder->where(function ($qq) use ($q) {
                $qq->where('path', 'like', "%{$q}%")
                   ->orWhere('location_text', 'like', "%{$q}%");
            });
        }

        if ($from = $request->get('from')) {
            $builder->where(function ($qq) use ($from) {
                $qq->whereDate('captured_at', '>=', $from)
                   ->orWhere(function ($q2) use ($from) {
                       $q2->whereNull('captured_at')->whereDate('created_at', '>=', $from);
                   });
            });
        }

        if ($to = $request->get('to')) {
            $builder->where(function ($qq) use ($to) {
                $qq->whereDate('captured_at', '<=', $to)
                   ->orWhere(function ($q2) use ($to) {
                       $q2->whereNull('captured_at')->whereDate('created_at', '<=', $to);
                   });
            });
        }

        $perPage = min((int) $request->get('per_page', 50), 100);
        
        $videos = $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC')
            ->paginate($perPage)
            ->appends($request->only(['q', 'from', 'to', 'per_page']));

        return response()->json([
            'data' => $videos->items(),
            'meta' => [
                'current_page' => $videos->currentPage(),
                'last_page' => $videos->lastPage(),
                'per_page' => $videos->perPage(),
                'total' => $videos->total(),
            ],
            'filters' => $request->only(['q', 'from', 'to']),
        ]);
    }

    /**
     * Get favorite photos.
     */
    public function favorites(Request $request): JsonResponse
    {
        $builder = Photo::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('deleted_at')
            ->where('is_favorite', true);

        if ($q = trim((string) $request->get('q', ''))) {
            $builder->where(function ($qq) use ($q) {
                $qq->where('path', 'like', "%{$q}%")
                   ->orWhere('location_text', 'like', "%{$q}%");
            });
        }

        if ($type = $request->get('type')) {
            if ($type === 'image') {
                $builder->where('mime', 'like', 'image/%');
            } elseif ($type === 'video') {
                $builder->where('mime', 'like', 'video/%');
            }
        }

        if ($from = $request->get('from')) {
            $builder->where(function ($qq) use ($from) {
                $qq->whereDate('captured_at', '>=', $from)
                   ->orWhere(function ($q2) use ($from) {
                       $q2->whereNull('captured_at')->whereDate('created_at', '>=', $from);
                   });
            });
        }

        if ($to = $request->get('to')) {
            $builder->where(function ($qq) use ($to) {
                $qq->whereDate('captured_at', '<=', $to)
                   ->orWhere(function ($q2) use ($to) {
                       $q2->whereNull('captured_at')->whereDate('created_at', '<=', $to);
                   });
            });
        }

        $perPage = min((int) $request->get('per_page', 50), 100);
        
        $photos = $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC')
            ->paginate($perPage)
            ->appends($request->only(['q', 'type', 'from', 'to', 'per_page']));

        return response()->json([
            'data' => $photos->items(),
            'meta' => [
                'current_page' => $photos->currentPage(),
                'last_page' => $photos->lastPage(),
                'per_page' => $photos->perPage(),
                'total' => $photos->total(),
            ],
            'filters' => $request->only(['q', 'type', 'from', 'to']),
        ]);
    }

    /**
     * Get trash (soft deleted photos).
     */
    public function trash(Request $request): JsonResponse
    {
        $photos = Photo::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->orderBy('deleted_at', 'desc')
            ->select(['id', 'path', 'thumb_path', 'deleted_at', 'mime'])
            ->get();

        return response()->json([
            'data' => $photos,
        ]);
    }

    /**
     * Upload photos/videos.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'required|file|mimes:jpeg,jpg,png,gif,bmp,webp,svg,mp4,mov,avi,wmv,flv,webm,mkv|max:204800',
        ]);

        $user = $request->user();
        
        // Calculate total size of new files
        $totalNewSize = 0;
        foreach ($request->file('photos') as $file) {
            $hash = hash_file('sha256', $file->getRealPath());
            
            $existing = Photo::withTrashed()
                ->where('user_id', $user->id)
                ->where('sha256', $hash)
                ->first();

            if (!$existing) {
                $totalNewSize += $file->getSize();
            }
        }

        // Check storage quota
        if ($totalNewSize > 0 && $user->storage_used + $totalNewSize > $user->storage_quota) {
            $available = $user->storage_quota - $user->storage_used;
            
            return response()->json([
                'message' => 'Dung lÆ°á»£ng lÆ°u trá»¯ khÃ´ng Ä‘á»§.',
                'storage' => [
                    'used' => $user->storage_used,
                    'quota' => $user->storage_quota,
                    'available' => max(0, $available),
                    'used_human' => $user->storage_used_human,
                    'quota_human' => $user->storage_quota_human,
                ],
            ], 422);
        }

        $uploaded = [];
        $restored = 0;
        $duplicates = 0;

        foreach ($request->file('photos') as $file) {
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
                    $restored++;
                } else {
                    $duplicates++;
                }
                continue;
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

            $uploaded[] = $photo;
        }

        Cache::flush();

        return response()->json([
            'message' => 'Upload thÃ nh cÃ´ng.',
            'uploaded' => count($uploaded),
            'restored' => $restored,
            'duplicates' => $duplicates,
            'data' => $uploaded,
        ], 201);
    }

    /**
     * Get single photo details.
     */
    public function show(Request $request, Photo $photo): JsonResponse
    {
        $this->authorize('view', $photo);

        return response()->json([
            'data' => $photo,
        ]);
    }

    /**
     * Soft delete a photo (move to trash).
     */
    public function destroy(Request $request, Photo $photo): JsonResponse
    {
        $this->authorize('delete', $photo);

        $photo->delete();
        Cache::flush();

        return response()->json([
            'message' => 'ÄÃ£ chuyá»ƒn áº£nh vÃ o thÃ¹ng rÃ¡c.',
        ]);
    }

    /**
     * Restore a photo from trash.
     */
    public function restore(Request $request, $id): JsonResponse
    {
        $photo = Photo::withTrashed()->findOrFail($id);
        $this->authorize('restore', $photo);

        $photo->restore();
        Cache::flush();

        return response()->json([
            'message' => 'ÄÃ£ khÃ´i phá»¥c áº£nh.',
            'data' => $photo,
        ]);
    }

    /**
     * Permanently delete a photo.
     */
    public function forceDestroy(Request $request, $id): JsonResponse
    {
        $photo = Photo::withTrashed()->findOrFail($id);
        $this->authorize('forceDelete', $photo);

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

        Cache::flush();

        return response()->json([
            'message' => 'ÄÃ£ xÃ³a vÄ©nh viá»…n áº£nh.',
        ]);
    }

    /**
     * Toggle favorite status.
     */
    public function toggleFavorite(Request $request, $id): JsonResponse
    {
        $photo = Photo::findOrFail($id);
        $this->authorize('update', $photo);

        $photo->is_favorite = !$photo->is_favorite;
        $photo->save();

        Cache::flush();

        return response()->json([
            'message' => $photo->is_favorite ? 'ÄÃ£ thÃªm vÃ o yÃªu thÃ­ch.' : 'ÄÃ£ bá» yÃªu thÃ­ch.',
            'is_favorite' => $photo->is_favorite,
        ]);
    }

    /**
     * Share photos via email.
     */
    public function shareEmail(Request $request): JsonResponse
    {
        $request->validate([
            'photo_ids' => 'required|array',
            'photo_ids.*' => 'exists:photos,id',
            'emails' => 'required|array',
            'emails.*' => 'email',
            'message' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $photoIds = $request->photo_ids;
        $emails = $request->emails;
        $message = $request->message;

        $photos = Photo::whereIn('id', $photoIds)
            ->where('user_id', $user->id)
            ->get();

        if ($photos->count() !== count($photoIds)) {
            return response()->json([
                'message' => 'Má»™t hoáº·c nhiá»u áº£nh khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng thuá»™c quyá»n sá»Ÿ há»¯u cá»§a báº¡n.',
            ], 403);
        }

        $photoData = $photos->map(function ($photo) {
            return [
                'id' => $photo->id,
                'path' => $photo->path,
                'thumb_path' => $photo->thumb_path,
            ];
        })->toArray();

        $sent = 0;
        $failed = 0;

        foreach ($emails as $email) {
            try {
                \Illuminate\Support\Facades\Mail::to($email)->send(
                    new \App\Mail\SharePhotosMail($user, $photoData, $message)
                );
                $sent++;
            } catch (\Exception $e) {
                Log::error('Failed to send share email to ' . $email . ': ' . $e->getMessage());
                $failed++;
            }
        }

        return response()->json([
            'message' => "ÄÃ£ gá»­i email chia sáº» Ä‘áº¿n {$sent} Ä‘á»‹a chá»‰ email.",
            'sent' => $sent,
            'failed' => $failed,
        ]);
    }

    /**
     * Share videos via email.
     */
    public function shareVideosEmail(Request $request): JsonResponse
    {
        $request->validate([
            'video_ids' => 'required|array',
            'video_ids.*' => 'exists:photos,id',
            'emails' => 'required|array',
            'emails.*' => 'email',
            'message' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $videoIds = $request->video_ids;
        $emails = $request->emails;
        $message = $request->message;

        $videos = Photo::whereIn('id', $videoIds)
            ->where('user_id', $user->id)
            ->where('mime', 'like', 'video/%')
            ->get();

        if ($videos->count() !== count($videoIds)) {
            return response()->json([
                'message' => 'Má»™t hoáº·c nhiá»u video khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng thuá»™c quyá»n sá»Ÿ há»¯u cá»§a báº¡n.',
            ], 403);
        }

        $videoData = $videos->map(function ($video) {
            $data = [
                'id' => $video->id,
                'path' => $video->path,
            ];
            if ($video->thumb_path) {
                $data['thumb_path'] = $video->thumb_path;
            }
            return $data;
        })->toArray();

        $sent = 0;
        $failed = 0;

        foreach ($emails as $email) {
            try {
                \Illuminate\Support\Facades\Mail::to($email)->send(
                    new \App\Mail\ShareVideosMail($user, $videoData, $message)
                );
                $sent++;
            } catch (\Exception $e) {
                Log::error('Failed to send share email to ' . $email . ': ' . $e->getMessage());
                $failed++;
            }
        }

        return response()->json([
            'message' => "ÄÃ£ gá»­i email chia sáº» Ä‘áº¿n {$sent} Ä‘á»‹a chá»‰ email.",
            'sent' => $sent,
            'failed' => $failed,
        ]);
    }
}

