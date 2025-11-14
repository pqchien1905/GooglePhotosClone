<?php

namespace App\Http\Controllers;

use App\Models\Friend;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FriendController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $friends = Friend::with(['requester', 'addressee'])
            ->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhere('addressee_id', $user->id);
            })
            ->where('status', 'accepted')
            ->orderBy('updated_at', 'desc')
            ->get();

        $incoming = Friend::with(['requester'])
            ->where('addressee_id', $user->id)
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        $outgoing = Friend::with(['addressee'])
            ->where('requester_id', $user->id)
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        $blocked = Friend::with(['requester', 'addressee'])
            ->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhere('addressee_id', $user->id);
            })
            ->where('status', 'blocked')
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('Friends/Index', [
            'friends' => ['data' => $friends],
            'incoming' => ['data' => $incoming],
            'outgoing' => ['data' => $outgoing],
            'blocked' => ['data' => $blocked],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $user = $request->user();
        $target = User::where('email', $data['email'])->first();

        if (!$target) {
            return back()->withErrors(['email' => 'Không tìm thấy người dùng với email này.']);
        }
        if ($target->id === $user->id) {
            return back()->withErrors(['email' => 'Bạn không thể kết bạn với chính mình.']);
        }

        $existing = Friend::where(function ($q) use ($user, $target) {
            $q->where('requester_id', $user->id)->where('addressee_id', $target->id)
              ->orWhere('requester_id', $target->id)->where('addressee_id', $user->id);
        })->first();

        if ($existing) {
            if ($existing->status === 'blocked') {
                return back()->withErrors(['email' => 'Không thể kết bạn với người dùng này.']);
            }
            return back()->withErrors(['email' => 'Đã tồn tại mối quan hệ với người dùng này.']);
        }

        Friend::create([
            'requester_id' => $user->id,
            'addressee_id' => $target->id,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Đã gửi lời mời kết bạn.');
    }

    public function update(Request $request, Friend $friend)
    {
        $user = $request->user();
        if ($friend->addressee_id !== $user->id) {
            abort(403);
        }
        if ($friend->status !== 'pending') {
            return back();
        }
        $friend->status = 'accepted';
        $friend->save();
        return back()->with('success', 'Đã chấp nhận lời mời.');
    }

    public function destroy(Request $request, Friend $friend)
    {
        $user = $request->user();
        if ($friend->requester_id !== $user->id && $friend->addressee_id !== $user->id) {
            abort(403);
        }
        $friend->delete();
        return back()->with('success', 'Đã xóa mối quan hệ bạn bè / hủy lời mời.');
    }

    public function block(Request $request, Friend $friend)
    {
        $user = $request->user();
        if ($friend->requester_id !== $user->id && $friend->addressee_id !== $user->id) {
            abort(403);
        }
        $friend->status = 'blocked';
        $friend->save();
        return back()->with('success', 'Đã chặn người dùng.');
    }

    public function unblock(Request $request, Friend $friend)
    {
        $user = $request->user();
        if ($friend->requester_id !== $user->id && $friend->addressee_id !== $user->id) {
            abort(403);
        }
        $friend->delete(); // Remove the blocked relationship
        return back()->with('success', 'Đã bỏ chặn người dùng.');
    }

    /**
     * JSON list of accepted friends (minimal for share picker)
     */
    public function list(Request $request)
    {
        $user = $request->user();
        $rows = Friend::with(['requester:id,name,email', 'addressee:id,name,email'])
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
            ];
        })->values()->unique('id')->values();

        return response()->json(['data' => $friends]);
    }

    public function share(Request $request)
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
                    return back()->withErrors(['friend_ids' => 'Một hoặc nhiều người nhận không phải là bạn bè của bạn.']);
                }
            }

            // Store shares and create notifications
            $sharesCount = 0;
            
            if (!empty($data['album_id'])) {
                // Share album
                foreach ($data['friend_ids'] as $friendId) {
                    \App\Models\Share::create([
                        'sender_id' => $user->id,
                        'receiver_id' => $friendId,
                        'shareable_type' => 'App\\Models\\Album',
                        'shareable_id' => $data['album_id'],
                        'message' => $data['message'] ?? null,
                    ]);
                    
                    \App\Models\Notification::create([
                        'user_id' => $friendId,
                        'type' => 'share_received',
                        'title' => $user->name . ' đã chia sẻ một album với bạn',
                        'body' => $data['message'] ?? null,
                        'data' => ['album_id' => $data['album_id'], 'sender_id' => $user->id],
                    ]);
                    
                    $sharesCount++;
                }
            } elseif (!empty($data['photo_ids'])) {
                // Share photos
                foreach ($data['friend_ids'] as $friendId) {
                    foreach ($data['photo_ids'] as $photoId) {
                        \App\Models\Share::create([
                            'sender_id' => $user->id,
                            'receiver_id' => $friendId,
                            'shareable_type' => 'App\\Models\\Photo',
                            'shareable_id' => $photoId,
                            'message' => $data['message'] ?? null,
                        ]);
                    }
                    
                    $count = count($data['photo_ids']);
                    \App\Models\Notification::create([
                        'user_id' => $friendId,
                        'type' => 'share_received',
                        'title' => $user->name . ' đã chia sẻ ' . $count . ' ảnh với bạn',
                        'body' => $data['message'] ?? null,
                        'data' => ['photo_ids' => $data['photo_ids'], 'sender_id' => $user->id],
                    ]);
                    
                    $sharesCount++;
                }
            }
        
            return back()->with('success', 'Đã chia sẻ với ' . $sharesCount . ' bạn bè.');
        }
}
