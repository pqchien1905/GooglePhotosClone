<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the user.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 20), 100);
        
        // Use Laravel's built-in notification system via User model
        $notifications = $request->user()
            ->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Transform to match old API format
        $data = $notifications->getCollection()->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? $notification->type,
                'title' => $notification->data['message'] ?? '',
                'body' => $notification->data['message'] ?? '',
                'data' => $notification->data,
                'is_read' => !is_null($notification->read_at),
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    /**
     * Get unread notification count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()->unreadNotifications()->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Không tìm thấy thông báo.',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Đã đánh dấu đã đọc.',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'Đã đánh dấu tất cả là đã đọc.',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Không tìm thấy thông báo.',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Đã xóa thông báo.',
        ]);
    }
}
