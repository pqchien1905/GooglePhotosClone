<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friend;
use App\Models\Notification;
use App\Models\Share;
use App\Models\User;
use App\Notifications\FriendRequestReceived;
use App\Notifications\FriendRequestAccepted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FriendController extends Controller
{
    /**
     * Get all friend relationships.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $friends = Friend::with(['requester', 'addressee'])
            ->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhere('addressee_id', $user->id);
            })
            ->where('status', 'accepted')
            ->where(function ($q) use ($user) {
                // Exclude friends blocked by current user
                $q->whereNull('blocked_by_user_id')
                  ->orWhere('blocked_by_user_id', '!=', $user->id);
            })
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($f) use ($user) {
                $other = $f->requester_id === $user->id ? $f->addressee : $f->requester;
                return [
                    'id' => $f->id,
                    'user' => [
                        'id' => $other->id,
                        'name' => $other->name,
                        'email' => $other->email,
                        'avatar' => $other->avatar_path,
                    ],
                    'created_at' => $f->created_at,
                    'updated_at' => $f->updated_at,
                ];
            });

        $incoming = Friend::with(['requester'])
            ->where('addressee_id', $user->id)
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'user' => [
                        'id' => $f->requester->id,
                        'name' => $f->requester->name,
                        'email' => $f->requester->email,
                        'avatar' => $f->requester->avatar_path,
                    ],
                    'created_at' => $f->created_at,
                ];
            });

        $outgoing = Friend::with(['addressee'])
            ->where('requester_id', $user->id)
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'friend' => [
                        'id' => $f->addressee->id,
                        'name' => $f->addressee->name,
                        'email' => $f->addressee->email,
                        'avatar' => $f->addressee->avatar_path,
                    ],
                    'created_at' => $f->created_at,
                ];
            });

        $blocked = Friend::with(['requester', 'addressee'])
            ->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhere('addressee_id', $user->id);
            })
            ->where('blocked_by_user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($f) use ($user) {
                $other = $f->requester_id === $user->id ? $f->addressee : $f->requester;
                return [
                    'id' => $f->id,
                    'user' => [
                        'id' => $other->id,
                        'name' => $other->name,
                        'email' => $other->email,
                    ],
                    'updated_at' => $f->updated_at,
                ];
            });

        return response()->json([
            'friends' => $friends,
            'incoming' => $incoming,
            'outgoing' => $outgoing,
            'blocked' => $blocked,
        ]);
    }

    /**
     * Get simple list of accepted friends (for share picker).
     */
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $rows = Friend::with(['requester:id,name,email,avatar_path', 'addressee:id,name,email,avatar_path'])
            ->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhere('addressee_id', $user->id);
            })
            ->where('status', 'accepted')
            ->where(function ($q) use ($user) {
                // Exclude friends blocked by current user
                $q->whereNull('blocked_by_user_id')
                  ->orWhere('blocked_by_user_id', '!=', $user->id);
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        $friends = $rows->map(function ($f) use ($user) {
            $other = $f->requester_id === $user->id ? $f->addressee : $f->requester;
            return [
                'id' => $other->id,
                'name' => $other->name,
                'email' => $other->email,
                'avatar' => $other->avatar_path,
            ];
        })->values()->unique('id')->values();

        return response()->json([
            'data' => $friends,
        ]);
    }

    /**
     * Send a friend request.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $user = $request->user();
        $target = User::where('email', $data['email'])->first();

        if (!$target) {
            return response()->json([
                'message' => 'Không tìm thấy người dùng với email này.',
            ], 404);
        }
        
        if ($target->id === $user->id) {
            return response()->json([
                'message' => 'Bạn không thể kết bạn với chính mình.',
            ], 422);
        }

        $existing = Friend::where(function ($q) use ($user, $target) {
            $q->where('requester_id', $user->id)->where('addressee_id', $target->id)
              ->orWhere('requester_id', $target->id)->where('addressee_id', $user->id);
        })->first();

        if ($existing) {
            if ($existing->status === 'blocked') {
                return response()->json([
                    'message' => 'Không thể kết bạn với người dùng này.',
                ], 403);
            }
            return response()->json([
                'message' => 'Đã tồn tại mối quan hệ với người dùng này.',
            ], 422);
        }

        $friend = Friend::create([
            'requester_id' => $user->id,
            'addressee_id' => $target->id,
            'status' => 'pending',
        ]);

        // Send notification to the target user
        $target->notify(new FriendRequestReceived($user->name, $user->email, $friend->id));

        return response()->json([
            'message' => 'Đã gửi lời mời kết bạn.',
            'data' => $friend,
        ], 201);
    }

    /**
     * Accept a friend request.
     */
    public function update(Request $request, Friend $friend): JsonResponse
    {
        $user = $request->user();
        
        if ($friend->addressee_id !== $user->id) {
            return response()->json([
                'message' => 'Không có quyền chấp nhận lời mời này.',
            ], 403);
        }
        
        if ($friend->status !== 'pending') {
            return response()->json([
                'message' => 'Lời mời này không còn ở trạng thái chờ.',
            ], 422);
        }
        
        $friend->status = 'accepted';
        $friend->save();

        // Send notification to the requester that their request was accepted
        $friend->requester->notify(new FriendRequestAccepted($user->name, $user->email));

        return response()->json([
            'message' => 'Đã chấp nhận lời mời.',
            'data' => $friend,
        ]);
    }

    /**
     * Delete a friend relationship or cancel a request.
     */
    public function destroy(Request $request, Friend $friend): JsonResponse
    {
        $user = $request->user();
        
        if ($friend->requester_id !== $user->id && $friend->addressee_id !== $user->id) {
            return response()->json([
                'message' => 'Không có quyền xóa mối quan hệ này.',
            ], 403);
        }
        
        $friend->delete();
        
        return response()->json([
            'message' => 'Đã xóa mối quan hệ bạn bè / hủy lời mời.',
        ]);
    }

    /**
     * Block a user.
     */
    public function block(Request $request, Friend $friend): JsonResponse
    {
        $user = $request->user();
        
        if ($friend->requester_id !== $user->id && $friend->addressee_id !== $user->id) {
            return response()->json([
                'message' => 'Không có quyền chặn người dùng này.',
            ], 403);
        }
        
        // Only update if not already blocked by this user
        if ($friend->blocked_by_user_id !== $user->id) {
            $friend->blocked_by_user_id = $user->id;
            $friend->save();
        }
        
        return response()->json([
            'message' => 'Đã chặn người dùng.',
        ]);
    }

    /**
     * Unblock a user.
     */
    public function unblock(Request $request, Friend $friend): JsonResponse
    {
        $user = $request->user();
        
        if ($friend->requester_id !== $user->id && $friend->addressee_id !== $user->id) {
            return response()->json([
                'message' => 'Không có quyền bỏ chặn người dùng này.',
            ], 403);
        }
        
        // Only unblock if this user blocked them
        if ($friend->blocked_by_user_id === $user->id) {
            $friend->blocked_by_user_id = null;
            $friend->save();
        }
        
        return response()->json([
            'message' => 'Đã bỏ chặn người dùng.',
        ]);
    }

    /**
     * Share photos/albums with friends.
     */
    public function share(Request $request): JsonResponse
    {
        $data = $request->validate([
            'friend_ids' => 'required|array',
            'friend_ids.*' => 'exists:users,id',
            'photo_ids' => 'nullable|array',
            'photo_ids.*' => 'exists:photos,id',
            'album_id' => 'nullable|exists:albums,id',
            'message' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        
        // Verify all friend_ids are actual friends
        $friendUserIds = Friend::where(function ($q) use ($user) {
            $q->where('requester_id', $user->id)
              ->orWhere('addressee_id', $user->id);
        })
        ->where('status', 'accepted')
        ->get()
        ->map(function ($f) use ($user) {
            return $f->requester_id === $user->id ? $f->addressee_id : $f->requester_id;
        });

        foreach ($data['friend_ids'] as $friendId) {
            if (!$friendUserIds->contains($friendId)) {
                return response()->json([
                    'message' => 'Một hoặc nhiều người nhận không phải là bạn bè của bạn.',
                ], 422);
            }
        }

        $sharesCount = 0;
        
        if (!empty($data['album_id'])) {
            foreach ($data['friend_ids'] as $friendId) {
                Share::create([
                    'sender_id' => $user->id,
                    'receiver_id' => $friendId,
                    'shareable_type' => 'App\Models\Album',
                    'shareable_id' => $data['album_id'],
                    'message' => $data['message'] ?? null,
                ]);
                
                Notification::create([
                    'user_id' => $friendId,
                    'type' => 'album_shared',
                    'data' => [
                        'from_user_id' => $user->id,
                        'from_user_name' => $user->name,
                        'album_id' => $data['album_id'],
                    ],
                ]);
                
                $sharesCount++;
            }
        }

        if (!empty($data['photo_ids'])) {
            foreach ($data['photo_ids'] as $photoId) {
                foreach ($data['friend_ids'] as $friendId) {
                    Share::create([
                        'sender_id' => $user->id,
                        'receiver_id' => $friendId,
                        'shareable_type' => 'App\Models\Photo',
                        'shareable_id' => $photoId,
                        'message' => $data['message'] ?? null,
                    ]);
                    $sharesCount++;
                }
                
                Notification::create([
                    'user_id' => $data['friend_ids'][0],
                    'type' => 'photo_shared',
                    'data' => [
                        'from_user_id' => $user->id,
                        'from_user_name' => $user->name,
                        'photo_count' => count($data['photo_ids']),
                    ],
                ]);
            }
        }

        return response()->json([
            'message' => 'Đã chia sẻ thành công.',
            'shares_count' => $sharesCount,
        ]);
    }
}
