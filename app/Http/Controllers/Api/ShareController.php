<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Share;
use App\Models\ShareLink;
use App\Models\Photo;
use App\Models\Album;
use App\Models\User;
use App\Notifications\ShareReceived;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShareController extends Controller
{
    /**
     * Create shares with friends.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'friend_ids' => 'required|array',
            'friend_ids.*' => 'integer|exists:users,id',
            'photo_ids' => 'nullable|array',
            'photo_ids.*' => 'integer|exists:photos,id',
            'album_id' => 'nullable|integer|exists:albums,id',
            'message' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        // Validate all photos belong to the user
        if (!empty($data['photo_ids'])) {
            $photoCount = Photo::where('user_id', $user->id)
                ->whereIn('id', $data['photo_ids'])
                ->count();
            
            if ($photoCount !== count($data['photo_ids'])) {
                return response()->json([
                    'message' => 'Một hoặc nhiều ảnh không thuộc về bạn.',
                ], 422);
            }
        }

        // Validate album belongs to the user
        if (!empty($data['album_id'])) {
            $album = Album::where('user_id', $user->id)
                ->where('id', $data['album_id'])
                ->first();
            
            if (!$album) {
                return response()->json([
                    'message' => 'Album không tồn tại hoặc không thuộc về bạn.',
                ], 422);
            }
        }

        $sharesCount = 0;

        // Share photos with friends
        if (!empty($data['photo_ids'])) {
            foreach ($data['photo_ids'] as $photoId) {
                $photo = Photo::find($photoId);
                foreach ($data['friend_ids'] as $friendId) {
                    $share = Share::create([
                        'sender_id' => $user->id,
                        'receiver_id' => $friendId,
                        'shareable_type' => 'App\\Models\\Photo',
                        'shareable_id' => $photoId,
                        'message' => $data['message'] ?? null,
                    ]);
                    $sharesCount++;

                    // Send notification
                    $receiver = User::find($friendId);
                    if ($receiver) {
                        $receiver->notify(new ShareReceived(
                            $share,
                            $user->name,
                            'ảnh',
                            $photo->original_filename ?? 'Ảnh'
                        ));
                    }
                }
            }
        }

        // Share album with friends
        if (!empty($data['album_id'])) {
            $album = Album::find($data['album_id']);
            foreach ($data['friend_ids'] as $friendId) {
                $share = Share::create([
                    'sender_id' => $user->id,
                    'receiver_id' => $friendId,
                    'shareable_type' => 'App\\Models\\Album',
                    'shareable_id' => $data['album_id'],
                    'message' => $data['message'] ?? null,
                ]);
                $sharesCount++;

                // Send notification
                $receiver = User::find($friendId);
                if ($receiver) {
                    $receiver->notify(new ShareReceived(
                        $share,
                        $user->name,
                        'album',
                        $album->name ?? 'Album'
                    ));
                }
            }
        }

        return response()->json([
            'message' => "Đã chia sẻ {$sharesCount} mục thành công.",
            'shares_count' => $sharesCount,
        ], 201);
    }

    /**
     * Get shares received by the user.
     */
    public function received(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 20), 100);
        
        $shares = Share::with(['sender', 'shareable'])
            ->where('receiver_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Add share link tokens for albums
        $shares->getCollection()->transform(function ($share) {
            if ($share->shareable_type === 'App\Models\Album' && $share->shareable) {
                $shareLink = ShareLink::where('album_id', $share->shareable_id)
                    ->where('user_id', $share->sender_id)
                    ->first();
                if ($shareLink) {
                    $share->shareable->share_link_token = $shareLink->token;
                }
            }
            return $share;
        });

        return response()->json([
            'data' => $shares->items(),
            'meta' => [
                'current_page' => $shares->currentPage(),
                'last_page' => $shares->lastPage(),
                'per_page' => $shares->perPage(),
                'total' => $shares->total(),
            ],
        ]);
    }

    /**
     * Get shares sent by the user.
     */
    public function sent(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 20), 100);
        $userId = $request->user()->id;
        
        $shares = Share::with(['receiver', 'shareable'])
            ->where('sender_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Add share link tokens for albums
        $shares->getCollection()->transform(function ($share) use ($userId) {
            if ($share->shareable_type === 'App\Models\Album' && $share->shareable) {
                $shareLink = ShareLink::where('album_id', $share->shareable_id)
                    ->where('user_id', $userId)
                    ->first();
                if ($shareLink) {
                    $share->shareable->share_link_token = $shareLink->token;
                }
            }
            return $share;
        });

        return response()->json([
            'data' => $shares->items(),
            'meta' => [
                'current_page' => $shares->currentPage(),
                'last_page' => $shares->lastPage(),
                'per_page' => $shares->perPage(),
                'total' => $shares->total(),
            ],
        ]);
    }

    /**
     * Get a specific share by ID.
     */
    public function show(Request $request, Share $share): JsonResponse
    {
        // Check if user is the receiver or sender
        if ($share->receiver_id !== $request->user()->id && $share->sender_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Không có quyền truy cập chia sẻ này.',
            ], 403);
        }

        // Load the shareable content (Photo or Album)
        $share->load(['sender', 'receiver', 'shareable']);

        // For albums, also load photos
        if ($share->shareable_type === 'App\Models\Album' && $share->shareable) {
            $share->shareable->load(['photos']);
        }

        return response()->json([
            'data' => $share,
        ]);
    }

    /**
     * Mark a share as read.
     */
    public function markAsRead(Request $request, Share $share): JsonResponse
    {
        if ($share->receiver_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Không có quyền thao tác này.',
            ], 403);
        }

        $share->update(['is_read' => true]);

        return response()->json([
            'message' => 'Đã đánh dấu đã đọc.',
        ]);
    }
}
