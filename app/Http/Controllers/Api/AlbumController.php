<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AlbumController extends Controller
{
    /**
     * Get all albums for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 30), 100);
        
        $albums = Album::with(['coverPhoto' => function ($query) {
            $query->select(['id', 'path', 'thumb_path', 'mime', 'duration']);
        }])
            ->where('user_id', $request->user()->id)
            ->withCount('photos')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $albums->items(),
            'meta' => [
                'current_page' => $albums->currentPage(),
                'last_page' => $albums->lastPage(),
                'per_page' => $albums->perPage(),
                'total' => $albums->total(),
            ],
        ]);
    }

    /**
     * Get all albums (simple list for modals/pickers).
     */
    public function list(Request $request): JsonResponse
    {
        $albums = Album::with(['coverPhoto'])
            ->where('user_id', $request->user()->id)
            ->withCount('photos')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $albums,
        ]);
    }

    /**
     * Get a single album with photos.
     */
    public function show(Request $request, Album $album): JsonResponse
    {
        if ($album->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'KhÃ´ng cÃ³ quyá»n truy cáº­p album nÃ y.',
            ], 403);
        }

        $album->load(['photos' => function ($q) {
            $q->orderBy('album_photo.position');
        }, 'coverPhoto']);

        return response()->json([
            'data' => [
                'album' => $album,
                'photos' => $album->photos,
            ],
        ]);
    }

    /**
     * Create a new album.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'photo_ids' => 'array',
            'photo_ids.*' => 'integer',
        ]);

        $album = Album::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
        ]);

        $photoIds = collect($data['photo_ids'] ?? [])->unique()->values();
        if ($photoIds->isNotEmpty()) {
            $photos = Photo::whereIn('id', $photoIds)
                ->where('user_id', $request->user()->id)
                ->get();
            $album->photos()->attach($photos->pluck('id'));
            
            if (!$album->cover_photo_id && $photos->first()) {
                $album->cover_photo_id = $photos->first()->id;
                $album->save();
            }
        }

        $album->load('coverPhoto');
        $album->loadCount('photos');

        return response()->json([
            'message' => 'ÄÃ£ táº¡o album vÃ  thÃªm áº£nh.',
            'data' => $album,
        ], 201);
    }

    /**
     * Update an album.
     */
    public function update(Request $request, Album $album): JsonResponse
    {
        if ($album->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'KhÃ´ng cÃ³ quyá»n chá»‰nh sá»­a album nÃ y.',
            ], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'cover_photo_id' => 'nullable|integer',
        ]);

        if (array_key_exists('name', $data)) {
            $album->name = $data['name'];
        }
        if (array_key_exists('cover_photo_id', $data)) {
            $album->cover_photo_id = $data['cover_photo_id'];
        }
        $album->save();

        $album->load('coverPhoto');
        $album->loadCount('photos');

        return response()->json([
            'message' => 'ÄÃ£ cáº­p nháº­t album.',
            'data' => $album,
        ]);
    }

    /**
     * Delete an album.
     */
    public function destroy(Request $request, Album $album): JsonResponse
    {
        if ($album->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'KhÃ´ng cÃ³ quyá»n xÃ³a album nÃ y.',
            ], 403);
        }

        $album->photos()->detach();
        $album->delete();

        return response()->json([
            'message' => 'ÄÃ£ xÃ³a album.',
        ]);
    }

    /**
     * Add photos to an album.
     */
    public function addPhotos(Request $request, Album $album): JsonResponse
    {
        if ($album->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'KhÃ´ng cÃ³ quyá»n thÃªm áº£nh vÃ o album nÃ y.',
            ], 403);
        }

        $data = $request->validate([
            'photo_ids' => 'required|array',
            'photo_ids.*' => 'integer',
        ]);

        $photoIds = collect($data['photo_ids'])->unique()->values();
        $photos = Photo::whereIn('id', $photoIds)
            ->where('user_id', $request->user()->id)
            ->get();
        
        $album->photos()->syncWithoutDetaching($photos->pluck('id'));

        if (!$album->cover_photo_id && $photos->first()) {
            $album->cover_photo_id = $photos->first()->id;
            $album->save();
        }

        $album->load('coverPhoto');
        $album->loadCount('photos');

        return response()->json([
            'message' => 'ÄÃ£ thÃªm áº£nh vÃ o album.',
            'data' => $album,
        ]);
    }

    /**
     * Remove a photo from an album.
     */
    public function removePhoto(Request $request, Album $album, Photo $photo): JsonResponse
    {
        if ($album->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'KhÃ´ng cÃ³ quyá»n xÃ³a áº£nh khá»i album nÃ y.',
            ], 403);
        }

        $album->photos()->detach($photo->id);
        
        if ($album->cover_photo_id === $photo->id) {
            $album->cover_photo_id = optional($album->photos()->first())->id;
            $album->save();
        }

        $album->load('coverPhoto');
        $album->loadCount('photos');

        return response()->json([
            'message' => 'ÄÃ£ xÃ³a áº£nh khá»i album.',
            'data' => $album,
        ]);
    }

    /**
     * Share albums via email.
     */
    public function shareEmail(Request $request): JsonResponse
    {
        $request->validate([
            'album_ids' => 'required|array',
            'album_ids.*' => 'exists:albums,id',
            'emails' => 'required|array',
            'emails.*' => 'email',
            'message' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $albumIds = $request->album_ids;
        $emails = $request->emails;
        $message = $request->message;

        $albums = Album::whereIn('id', $albumIds)
            ->where('user_id', $user->id)
            ->with('coverPhoto')
            ->get();

        if ($albums->count() !== count($albumIds)) {
            return response()->json([
                'message' => 'Má»™t hoáº·c nhiá»u album khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng thuá»™c quyá»n sá»Ÿ há»¯u cá»§a báº¡n.',
            ], 403);
        }

        $albumData = $albums->map(function ($album) {
            $data = [
                'id' => $album->id,
                'name' => $album->name,
                'photos_count' => $album->photos()->count(),
            ];
            
            if ($album->coverPhoto) {
                $data['cover_photo'] = [
                    'id' => $album->coverPhoto->id,
                    'path' => $album->coverPhoto->path,
                    'thumb_path' => $album->coverPhoto->thumb_path,
                ];
            }
            
            return $data;
        })->toArray();

        $sent = 0;
        $failed = 0;

        foreach ($emails as $email) {
            try {
                Mail::to($email)->send(
                    new \App\Mail\ShareAlbumsMail($user, $albumData, $message)
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
     * Set cover photo for an album.
     */
    public function setCover(Request $request, Album $album): JsonResponse
    {
        if ($album->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Không có quyền chỉnh sửa album này.',
            ], 403);
        }

        $data = $request->validate([
            'photo_id' => 'required|integer|exists:photos,id',
        ]);

        $photo = Photo::findOrFail($data['photo_id']);

        // Check if photo belongs to user
        if ($photo->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Ảnh không thuộc quyền sở hữu của bạn.',
            ], 403);
        }

        // Check if photo is in the album
        if (!$album->photos()->where('photos.id', $photo->id)->exists()) {
            return response()->json([
                'message' => 'Ảnh không có trong album này.',
            ], 422);
        }

        $album->cover_photo_id = $photo->id;
        $album->save();

        $album->load('coverPhoto');
        $album->loadCount('photos');

        return response()->json([
            'message' => 'Đã đặt ảnh bìa cho album.',
            'data' => $album,
        ]);
    }

    /**
     * Create albums automatically based on metadata.
     * Groups photos by date (captured_at) or location (location_text).
     */
    public function createAutoAlbums(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|string|in:date,location',
            'min_photos' => 'nullable|integer|min:1|max:100',
        ]);

        $userId = $request->user()->id;
        $type = $data['type'];
        $minPhotos = $data['min_photos'] ?? 1; // Minimum photos per album (changed from 3 to 1)
        $createdCount = 0;
        $updatedCount = 0;

        // Get all user's photos that are not in any album (or all photos for auto-album creation)
        $photosQuery = Photo::where('user_id', $userId)
            ->whereNull('deleted_at');

        if ($type === 'date') {
            // Group by captured_at date (or created_at if captured_at is null)
            $photos = $photosQuery
                ->orderByRaw('COALESCE(captured_at, created_at)')
                ->get();

            // Group photos by date
            $groups = $photos->groupBy(function ($photo) {
                $date = $photo->captured_at ?? $photo->created_at;
                return $date ? $date->format('Y-m-d') : 'unknown';
            })->filter(function ($group, $dateKey) use ($minPhotos) {
                return $dateKey !== 'unknown' && $group->count() >= $minPhotos;
            });

            foreach ($groups as $dateKey => $groupPhotos) {
                $date = \Carbon\Carbon::parse($dateKey);
                $albumName = $date->format('d/m/Y');

                // Check if album already exists
                $existingAlbum = Album::where('user_id', $userId)
                    ->where('name', $albumName)
                    ->first();

                if ($existingAlbum) {
                    // Add photos to existing album if not already in it
                    $newPhotoIds = $groupPhotos->pluck('id')->diff($existingAlbum->photos()->pluck('photos.id'));
                    if ($newPhotoIds->isNotEmpty()) {
                        $existingAlbum->photos()->attach($newPhotoIds);
                        if (!$existingAlbum->cover_photo_id) {
                            $existingAlbum->cover_photo_id = $groupPhotos->first()->id;
                            $existingAlbum->save();
                        }
                        $updatedCount++;
                    }
                } else {
                    // Create new album
                    $album = Album::create([
                        'user_id' => $userId,
                        'name' => $albumName,
                        'cover_photo_id' => $groupPhotos->first()->id,
                    ]);
                    $album->photos()->attach($groupPhotos->pluck('id'));
                    $createdCount++;
                }
            }
        } elseif ($type === 'location') {
            // Group by location_text (or 'Chưa được gắn tag' for null location)
            $photos = $photosQuery
                ->orderBy('location_text')
                ->get();

            // Group photos by location
            $groups = $photos->groupBy(function ($photo) {
                return $photo->location_text ?? 'Chưa được gắn tag';
            })->filter(function ($group) use ($minPhotos) {
                return $group->count() >= $minPhotos;
            });

            foreach ($groups as $locationText => $groupPhotos) {
                $albumName = $locationText === 'Chưa được gắn tag' ? $locationText : '📍 ' . $locationText;

                // Check if album already exists
                $existingAlbum = Album::where('user_id', $userId)
                    ->where('name', $albumName)
                    ->first();

                if ($existingAlbum) {
                    // Add photos to existing album if not already in it
                    $newPhotoIds = $groupPhotos->pluck('id')->diff($existingAlbum->photos()->pluck('photos.id'));
                    if ($newPhotoIds->isNotEmpty()) {
                        $existingAlbum->photos()->attach($newPhotoIds);
                        if (!$existingAlbum->cover_photo_id) {
                            $existingAlbum->cover_photo_id = $groupPhotos->first()->id;
                            $existingAlbum->save();
                        }
                        $updatedCount++;
                    }
                } else {
                    // Create new album
                    $album = Album::create([
                        'user_id' => $userId,
                        'name' => $albumName,
                        'cover_photo_id' => $groupPhotos->first()->id,
                    ]);
                    $album->photos()->attach($groupPhotos->pluck('id'));
                    $createdCount++;
                }
            }
        }

        return response()->json([
            'message' => "Đã tạo {$createdCount} album mới và cập nhật {$updatedCount} album.",
            'created' => $createdCount,
            'updated' => $updatedCount,
            'type' => $type,
        ]);
    }
}
