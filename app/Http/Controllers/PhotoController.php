<?php

namespace App\Http\Controllers;

use App\Jobs\ExtractMetadata;
use App\Jobs\GenerateThumbnail;
use App\Jobs\OptimizeImage;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PhotoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        
        // Build cache key based on filters and sort
        $cacheKey = 'photos_index_' . $userId . '_' . md5(json_encode([
            'q' => $request->get('q'),
            'type' => $request->get('type'),
            'from' => $request->get('from'),
            'to' => $request->get('to'),
            'sort' => $request->get('sort', 'newest'),
            'size' => $request->get('size'),
            'format' => $request->get('format'),
            'page' => $request->get('page', 1),
        ]));
        
        // Cache for 5 minutes (300 seconds)
        $photos = Cache::remember($cacheKey, 300, function () use ($request, $userId) {
            $builder = Photo::query()
                ->where('user_id', $userId)
                ->whereNull('deleted_at');

            // Filters
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

            // Filters for size
            if ($size = $request->get('size')) {
                switch ($size) {
                    case 'small':
                        $builder->where('size', '<', 1 * 1024 * 1024); // < 1MB
                        break;
                    case 'medium':
                        $builder->whereBetween('size', [1 * 1024 * 1024, 5 * 1024 * 1024]); // 1MB - 5MB
                        break;
                    case 'large':
                        $builder->where('size', '>', 5 * 1024 * 1024); // > 5MB
                        break;
                }
            }

            // Filters for format
            if ($format = $request->get('format')) {
                $builder->where('mime', 'like', "%{$format}%");
            }

            // Sorting
            $sort = $request->get('sort', 'newest'); // default: newest
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
                    // For MySQL compatibility, use COALESCE to handle NULLs
                    $builder->orderByRaw('COALESCE(captured_at, created_at) ASC, id ASC');
                    break;
                case 'captured_desc':
                    // For MySQL compatibility, use COALESCE to handle NULLs
                    $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC');
                    break;
                case 'newest':
                default:
                    $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC');
                    break;
            }

            $result = $builder
                ->select(['id', 'path', 'thumb_path', 'created_at', 'captured_at', 'size', 'mime', 'is_favorite', 'location_text', 'location_name', 'exif'])
                ->paginate(50)
                ->appends($request->only(['q','type','from','to','sort','size','format']));
            
            return $result;
        });
        
        // Clear cache when photos are modified (handled in store/destroy methods)
        
        return Inertia::render('Photos/Index', [
            'photos' => $photos,
            'filters' => $request->only(['q','type','from','to','sort','size','format'])
        ]);
    }

    /**
     * Display videos only.
     */
    public function videos(Request $request)
    {
        $builder = Photo::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('deleted_at')
            ->where('mime', 'like', 'video/%');

        // Filters
        if ($q = trim((string) $request->get('q', ''))) {
            $builder->where(function ($qq) use ($q) {
                $qq->where('path', 'like', "%{$q}%")
                   ->orWhere('location_text', 'like', "%{$q}%");
            });
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

        $videos = $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC')
            ->paginate(50)
            ->appends($request->only(['q','from','to']));

        return Inertia::render('Videos/Index', [
            'videos' => $videos,
            'filters' => $request->only(['q','from','to'])
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'required|file|mimes:jpeg,jpg,png,gif,bmp,webp,svg,mp4,mov,avi,wmv,flv,webm,mkv|max:204800', // 200MB max for videos
        ]);

        $user = $request->user();
        
        // Calculate total size of files to upload (excluding duplicates and restored)
        $totalNewSize = 0;

        foreach ($request->file('photos') as $file) {
            $hash = hash_file('sha256', $file->getRealPath());
            $mime = $file->getMimeType();
            $isVideo = str_starts_with($mime, 'video/');
            
            // Check for existing (including trashed) for this user
            $existing = Photo::withTrashed()
                ->where('user_id', $user->id)
                ->where('sha256', $hash)
                ->first();

            if ($existing) {
                // Skip if duplicate or will be restored (restore doesn't increase storage)
                continue;
            }

            // Add to total size calculation
            $totalNewSize += $file->getSize();
        }

        // Check storage quota before processing
        if ($totalNewSize > 0 && $user->storage_used + $totalNewSize > $user->storage_quota) {
            $available = $user->storage_quota - $user->storage_used;
            $quotaFormatted = $user->storage_quota_human;
            $usedFormatted = $user->storage_used_human;
            
            // Format available bytes manually
            $units = ['B', 'KB', 'MB', 'GB', 'TB'];
            $bytes = max($available, 0);
            $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
            $pow = min($pow, count($units) - 1);
            $bytes /= pow(1024, $pow);
            $availableFormatted = round($bytes, 2) . ' ' . $units[$pow];
            
            return back()->withErrors([
                'photos' => "Dung lượng lưu trữ không đủ. Bạn đã sử dụng {$usedFormatted} / {$quotaFormatted}. Còn lại {$availableFormatted}. Vui lòng xóa ảnh cũ hoặc nâng cấp gói."
            ]);
        }

        $uploaded = [];
        $restored = 0;
        $duplicates = 0;

        foreach ($request->file('photos') as $file) {
            $hash = hash_file('sha256', $file->getRealPath());
            $mime = $file->getMimeType();
            $isVideo = str_starts_with($mime, 'video/');
            
            // Check for existing (including trashed) for this user
            $existing = Photo::withTrashed()
                ->where('user_id', $request->user()->id)
                ->where('sha256', $hash)
                ->first();

            if ($existing) {
                if ($existing->trashed()) {
                    // Restore previously deleted identical photo/video
                    $existing->restore();
                    // Ensure thumbnail generation if missing
                    if (!$existing->thumb_path) {
                        GenerateThumbnail::dispatch($existing);
                    }
                    $restored++;
                } else {
                    // Duplicate already exists, skip creating new
                    $duplicates++;
                }
                continue;
            }

            $path = $file->store($isVideo ? 'videos' : 'photos', 'public');

            $fileSize = $file->getSize();

            $photo = Photo::create([
                'user_id' => $request->user()->id,
                'path' => $path,
                'size' => $fileSize,
                'mime' => $mime,
                'sha256' => $hash,
                'visibility' => 'private',
            ]);

            // Update user storage
            $request->user()->increment('storage_used', $fileSize);

            // Dispatch jobs - optimize only for images
            if (!$isVideo) {
                OptimizeImage::dispatch($photo);
            }
            GenerateThumbnail::dispatch($photo);
            ExtractMetadata::dispatch($photo);

            $uploaded[] = $photo;
        }

        $parts = [];
        if (count($uploaded) > 0) {
            $parts[] = 'đã tải ' . count($uploaded) . ' ảnh';
        }
        if ($restored > 0) {
            $parts[] = 'khôi phục ' . $restored . ' ảnh trùng trước đó';
        }
        if ($duplicates > 0) {
            $parts[] = $duplicates . ' ảnh đã tồn tại, bỏ qua';
        }
        $message = 'Hoàn tất: ' . (count($parts) ? implode(', ', $parts) : 'không có ảnh mới');

        // Clear cache for this user's photo listings
        // Note: For better performance, use Redis with tags support
        Cache::flush();

        return back()->with('success', ucfirst($message) . '.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Photo $photo)
    {
        $this->authorize('view', $photo);

        return response()->json($photo);
    }

    /**
     * Remove the specified resource from storage (soft delete).
     */
    public function destroy(Photo $photo)
    {
        $this->authorize('delete', $photo);

        $userId = $photo->user_id;
        $photo->delete();

        // Clear cache for this user's photo listings
        // Note: For better performance, use Redis with tags support
        // For now, we'll clear all cache (in production, implement selective cache clearing)
        Cache::flush();

        return back()->with('success', 'Đã chuyển ảnh vào thùng rác.');
    }

    /**
     * Restore a photo from trash.
     */
    public function restore($id)
    {
        $photo = Photo::withTrashed()->findOrFail($id);
        $this->authorize('restore', $photo);

        $userId = $photo->user_id;
        $photo->restore();

        // Clear cache for this user's photo listings
        // Note: For better performance, use Redis with tags support
        // For now, we'll clear all cache (in production, implement selective cache clearing)
        Cache::flush();

        return back()->with('success', 'Đã khôi phục ảnh.');
    }

    /**
     * Toggle favorite status.
     */
    public function toggleFavorite($id)
    {
        $photo = Photo::findOrFail($id);
        $this->authorize('update', $photo);

        $userId = $photo->user_id;
        $photo->is_favorite = !$photo->is_favorite;
        $photo->save();

        // Clear cache for this user's photo listings
        // Note: For better performance, use Redis with tags support
        // For now, we'll clear all cache (in production, implement selective cache clearing)
        Cache::flush();

        return back()->with('success', $photo->is_favorite ? 'Đã thêm vào yêu thích.' : 'Đã bỏ yêu thích.');
    }

    /**
     * Display favorite photos only.
     */
    public function favorites(Request $request)
    {
        $builder = Photo::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('deleted_at')
            ->where('is_favorite', true);

        // Filters
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

        $photos = $builder->orderByRaw('COALESCE(captured_at, created_at) DESC, id DESC')
            ->paginate(50)
            ->appends($request->only(['q','type','from','to']));

        return Inertia::render('Favorites/Index', [
            'photos' => $photos,
            'filters' => $request->only(['q','type','from','to'])
        ]);
    }

    /**
     * Permanently delete a photo.
     */
    public function forceDestroy($id)
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

        // Update user storage
        if ($user) {
            $user->decrement('storage_used', $fileSize);
        }

    return back()->with('success', 'Đã xóa vĩnh viễn ảnh.');
    }

    /**
     * Share photos via email
     */
    public function shareEmail(Request $request)
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

        // Verify ownership
        $photos = Photo::whereIn('id', $photoIds)
            ->where('user_id', $user->id)
            ->get();

        if ($photos->count() !== count($photoIds)) {
            return back()->withErrors(['photo_ids' => 'Một hoặc nhiều ảnh không tồn tại hoặc không thuộc quyền sở hữu của bạn.']);
        }

        // Prepare photo data for email
        $photoData = $photos->map(function ($photo) {
            return [
                'id' => $photo->id,
                'path' => $photo->path,
                'thumb_path' => $photo->thumb_path,
            ];
        })->toArray();

        // Send email to each recipient
        foreach ($emails as $email) {
            try {
                \Illuminate\Support\Facades\Mail::to($email)->send(
                    new \App\Mail\SharePhotosMail($user, $photoData, $message)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to send share email to ' . $email . ': ' . $e->getMessage());
                // Continue sending to other emails even if one fails
            }
        }

        return back()->with('success', 'Đã gửi email chia sẻ đến ' . count($emails) . ' địa chỉ email.');
    }

    /**
     * Share videos via email
     */
    public function shareVideosEmail(Request $request)
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

        // Verify ownership and that they are videos
        $videos = Photo::whereIn('id', $videoIds)
            ->where('user_id', $user->id)
            ->where('mime', 'like', 'video/%')
            ->get();

        if ($videos->count() !== count($videoIds)) {
            return back()->withErrors(['video_ids' => 'Một hoặc nhiều video không tồn tại hoặc không thuộc quyền sở hữu của bạn.']);
        }

        // Prepare video data for email
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

        // Send email to each recipient
        foreach ($emails as $email) {
            try {
                \Illuminate\Support\Facades\Mail::to($email)->send(
                    new \App\Mail\ShareVideosMail($user, $videoData, $message)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to send share email to ' . $email . ': ' . $e->getMessage());
                // Continue sending to other emails even if one fails
            }
        }

        return back()->with('success', 'Đã gửi email chia sẻ đến ' . count($emails) . ' địa chỉ email.');
    }
}
