<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Photo;
use App\Models\ShareLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShareLinkController extends Controller
{
    /**
     * Create a share link for a photo or album.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:photo,album',
            'id' => 'required|integer',
            'expires_in_days' => 'nullable|integer|min:1|max:365',
        ]);

        $type = $request->type;
        $id = $request->id;
        $userId = $request->user()->id;

        // Verify ownership
        if ($type === 'photo') {
            $item = Photo::where('id', $id)->where('user_id', $userId)->first();
            if (!$item) {
                return response()->json([
                    'message' => 'Ảnh không tồn tại hoặc không thuộc quyền sở hữu của bạn.',
                ], 404);
            }
        } else {
            $item = Album::where('id', $id)->where('user_id', $userId)->first();
            if (!$item) {
                return response()->json([
                    'message' => 'Album không tồn tại hoặc không thuộc quyền sở hữu của bạn.',
                ], 404);
            }
        }

        // Calculate expiry
        $expiresAt = null;
        if ($request->filled('expires_in_days')) {
            $expiresAt = now()->addDays($request->expires_in_days);
        }

        // Create or get share link
        if ($type === 'photo') {
            $shareLink = ShareLink::firstOrCreate([
                'photo_id' => $id,
                'user_id' => $userId,
            ], [
                'token' => Str::random(32),
                'expires_at' => $expiresAt,
            ]);
        } else {
            $shareLink = ShareLink::firstOrCreate([
                'album_id' => $id,
                'user_id' => $userId,
            ], [
                'token' => Str::random(32),
                'expires_at' => $expiresAt,
            ]);
        }

        return response()->json([
            'url' => route('share.show', $shareLink->token),
            'token' => $shareLink->token,
            'expires_at' => $shareLink->expires_at,
        ]);
    }

    /**
     * Get shared content by token (public endpoint).
     */
    public function show($token): JsonResponse
    {
        $shareLink = ShareLink::where('token', $token)->first();

        if (!$shareLink) {
            return response()->json([
                'message' => 'Link chia sẻ không tồn tại.',
            ], 404);
        }

        // Check if link has expired
        if ($shareLink->expires_at && $shareLink->expires_at < now()) {
            return response()->json([
                'message' => 'Link chia sẻ đã hết hạn.',
                'expired' => true,
            ], 410);
        }

        if ($shareLink->photo_id) {
            $photo = Photo::find($shareLink->photo_id);
            if (!$photo) {
                return response()->json([
                    'message' => 'Ảnh không còn tồn tại.',
                ], 404);
            }
            
            return response()->json([
                'type' => 'photo',
                'data' => $photo,
            ]);
        } elseif ($shareLink->album_id) {
            $album = Album::with(['photos' => function($q) {
                $q->orderBy('album_photo.created_at');
            }, 'user'])->find($shareLink->album_id);
            
            if (!$album) {
                return response()->json([
                    'message' => 'Album không còn tồn tại.',
                ], 404);
            }

            $albumData = [
                'id' => $album->id,
                'name' => $album->name,
                'created_at' => $album->created_at,
                'owner' => [
                    'name' => $album->user->name,
                    'email' => $album->user->email,
                ],
                'photos' => $album->photos->map(function($photo) {
                    return [
                        'id' => $photo->id,
                        'path' => $photo->path,
                        'thumb_path' => $photo->thumb_path,
                        'created_at' => $photo->created_at?->toISOString(),
                        'captured_at' => $photo->captured_at?->toISOString(),
                        'size' => $photo->size,
                        'mime' => $photo->mime,
                        'location_text' => $photo->location_text,
                        'location_name' => $photo->location_name,
                        'exif' => $photo->exif,
                        'is_favorite' => $photo->is_favorite ?? false,
                    ];
                })->values(),
            ];
            
            return response()->json([
                'type' => 'album',
                'data' => $albumData,
            ]);
        }

        return response()->json([
            'message' => 'Link chia sẻ không hợp lệ.',
        ], 404);
    }

    /**
     * Download album as ZIP (public endpoint).
     */
    public function downloadAlbum($token)
    {
        $shareLink = ShareLink::where('token', $token)->first();

        if (!$shareLink) {
            return response()->json([
                'message' => 'Link chia sẻ không tồn tại.',
            ], 404);
        }

        // Check if link has expired
        if ($shareLink->expires_at && $shareLink->expires_at < now()) {
            return response()->json([
                'message' => 'Link chia sẻ đã hết hạn.',
            ], 410);
        }

        if (!$shareLink->album_id) {
            return response()->json([
                'message' => 'Không tìm thấy album.',
            ], 404);
        }

        $album = Album::with('photos')->find($shareLink->album_id);

        if (!$album || $album->photos->isEmpty()) {
            return response()->json([
                'message' => 'Album không có ảnh.',
            ], 404);
        }

        // Create ZIP file
        $zipFileName = Str::slug($album->name) . '-' . time() . '.zip';
        $zipPath = storage_path('app/temp/' . $zipFileName);

        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return response()->json([
                'message' => 'Không thể tạo file ZIP.',
            ], 500);
        }

        foreach ($album->photos as $index => $photo) {
            $filePath = storage_path('app/public/' . $photo->path);
            if (file_exists($filePath)) {
                $fileName = ($index + 1) . '-' . basename($photo->path);
                $zip->addFile($filePath, $fileName);
            }
        }

        $zip->close();

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    /**
     * Delete a share link.
     */
    public function destroy(Request $request, ShareLink $shareLink): JsonResponse
    {
        if ($shareLink->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Không có quyền xóa link này.',
            ], 403);
        }

        $shareLink->delete();

        return response()->json([
            'message' => 'Đã xóa link chia sẻ.',
        ]);
    }

    /**
     * Get all share links for the user.
     */
    public function index(Request $request): JsonResponse
    {
        $shareLinks = ShareLink::with(['photo', 'album'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($link) {
                return [
                    'id' => $link->id,
                    'token' => $link->token,
                    'url' => route('share.show', $link->token),
                    'type' => $link->photo_id ? 'photo' : 'album',
                    'item' => $link->photo_id ? $link->photo : $link->album,
                    'expires_at' => $link->expires_at,
                    'is_expired' => $link->expires_at && $link->expires_at < now(),
                    'created_at' => $link->created_at,
                ];
            });

        return response()->json([
            'data' => $shareLinks,
        ]);
    }
}
