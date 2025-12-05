<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Share;
use App\Models\ShareLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShareController extends Controller
{
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
