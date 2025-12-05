<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friend;
use App\Models\Notification;
use App\Models\Share;
use App\Models\User;
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
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($f) use ($user) {
                $other = $f->requester_id === $user->id ? $f->addressee : $f->requester;
                return [
                    'id' => $f->id,
                    'friend' => [
                        'id' => $other->id,
                        'name' => $other->name,
                        'email' => $other->email,
                        'avatar_path' => $other->avatar_path,
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
                    'from' => [
                        'id' => $f->requester->id,
                        'name' => $f->requester->name,
                        'email' => $f->requester->email,
                        'avatar_path' => $f->requester->avatar_path,
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
                    'to' => [
                        'id' => $f->addressee->id,
                        'name' => $f->addressee->name,
                        'email' => $f->addressee->email,
                        'avatar_path' => $f->addressee->avatar_path,
                    ],
                    'created_at' => $f->created_at,
                ];
            });

        $blocked = Friend::with(['requester', 'addressee'])
            ->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhere('addressee_id', $user->id);
            })
            ->where('status', 'blocked')
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
            ->orderBy('updated_at', 'desc')
            ->get();

        $friends = $rows->map(function ($f) use ($user) {
            $other = $f->requester_id === $user->id ? $f->addressee : $f->requester;
            return [
                'id' => $other->id,
                'name' => $other->name,
                'email' => $other->email,
                'avatar_path' => $other->avatar_path,
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
                'message' => 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng vá»›i email nÃ y.',
            ], 404);
        }
        
        if ($target->id === $user->id) {
            return response()->json([
                'message' => 'Báº¡n khÃ´ng thá»ƒ káº¿t báº¡n vá»›i chÃ­nh mÃ¬nh.',
            ], 422);
        }

        $existing = Friend::where(function ($q) use ($user, $target) {
            $q->where('requester_id', $user->id)->where('addressee_id', $target->id)
              ->orWhere('requester_id', $target->id)->where('addressee_id', $user->id);
        })->first();

        if ($existing) {
            if ($existing->status === 'blocked') {
                return response()->json([
                    'message' => 'KhÃ´ng thá»ƒ káº¿t báº¡n vá»›i ngÆ°á»i dÃ¹ng nÃ y.',
                ], 403);
            }
            return response()->json([
                'message' => 'ÄÃ£ tá»“n táº¡i má»‘i quan há»‡ vá»›i ngÆ°á»i dÃ¹ng nÃ y.',
            ], 422);
        }

        $friend = Friend::create([
            'requester_id' => $user->id,
            'addressee_id' => $target->id,
            'status' => 'pending',
        ]);

        // Create notification for target user
        Notification::create([
            'user_id' => $target->id,
            'type' => 'friend_request',
            'data' => [
                'from_user_id' => $user->id,
                'from_user_name' => $user->name,
                'friend_id' => $friend->id,
            ],
        ]);

        return response()->json([
            'message' => 'ÄÃ£ gá»­i lá»i má»i káº¿t báº¡n.',
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
                'message' => 'KhÃ´ng cÃ³ quyá»n cháº¥p nháº­n lá»i má»i nÃ y.',
            ], 403);
        }
        
        if ($friend->status !== 'pending') {
            return response()->json([
                'message' => 'Lá»i má»i nÃ y khÃ´ng cÃ²n á»Ÿ tráº¡ng thÃ¡i chá».',
            ], 422);
        }
        
        $friend->status = 'accepted';
        $friend->save();

        // Create notification for requester
        Notification::create([
            'user_id' => $friend->requester_id,
            'type' => 'friend_accepted',
            'data' => [
                'from_user_id' => $user->id,
                'from_user_name' => $user->name,
            ],
        ]);

        return response()->json([
            'message' => 'ÄÃ£ cháº¥p nháº­n lá»i má»i.',
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
                'message' => 'KhÃ´ng cÃ³ quyá»n xÃ³a má»‘i quan há»‡ nÃ y.',
            ], 403);
        }
        
        $friend->delete();
        
        return response()->json([
            'message' => 'ÄÃ£ xÃ³a má»‘i quan há»‡ báº¡n bÃ¨ / há»§y lá»i má»i.',
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
                'message' => 'KhÃ´ng cÃ³ quyá»n cháº·n ngÆ°á»i dÃ¹ng nÃ y.',
            ], 403);
        }
        
        $friend->status = 'blocked';
        $friend->save();
        
        return response()->json([
            'message' => 'ÄÃ£ cháº·n ngÆ°á»i dÃ¹ng.',
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
                'message' => 'KhÃ´ng cÃ³ quyá»n bá» cháº·n ngÆ°á»i dÃ¹ng nÃ y.',
            ], 403);
        }
        
        $friend->delete();
        
        return response()->json([
            'message' => 'ÄÃ£ bá» cháº·n ngÆ°á»i dÃ¹ng.',
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
                    'message' => 'Má»™t hoáº·c nhiá»u ngÆ°á»i nháº­n khÃ´ng pháº£i lÃ  báº¡n bÃ¨ cá»§a báº¡n.',
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
            'message' => "ÄÃ£ chia sáº» thÃ nh cÃ´ng.",
            'shares_count' => $sharesCount,
        ]);
    }
}
