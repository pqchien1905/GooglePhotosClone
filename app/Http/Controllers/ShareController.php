<?php

namespace App\Http\Controllers;

use App\Models\Share;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShareController extends Controller
{
    /**
     * Shares received (items shared with me)
     */
    public function received(Request $request)
    {
        $shares = Share::with(['sender', 'shareable'])
            ->where('receiver_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Add share link tokens for albums
        $shares->getCollection()->transform(function ($share) {
            if ($share->shareable_type === 'App\Models\Album') {
                $shareLink = \App\Models\ShareLink::where('album_id', $share->shareable_id)
                    ->where('user_id', $share->sender_id)
                    ->first();
                if ($shareLink) {
                    $share->shareable->share_link_token = $shareLink->token;
                }
            }
            return $share;
        });

        return Inertia::render('Shares/Received', [
            'shares' => $shares,
        ]);
    }

    /**
     * Shares sent (items I shared with others)
     */
    public function sent(Request $request)
    {
        $shares = Share::with(['receiver', 'shareable'])
            ->where('sender_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Add share link tokens for albums
        $userId = $request->user()->id;
        $shares->getCollection()->transform(function ($share) use ($userId) {
            if ($share->shareable_type === 'App\Models\Album') {
                $shareLink = \App\Models\ShareLink::where('album_id', $share->shareable_id)
                    ->where('user_id', $userId)
                    ->first();
                if ($shareLink) {
                    $share->shareable->share_link_token = $shareLink->token;
                }
            }
            return $share;
        });

        return Inertia::render('Shares/Sent', [
            'shares' => $shares,
        ]);
    }

    /**
     * Mark share as read
     */
    public function markAsRead(Request $request, Share $share)
    {
        if ($share->receiver_id !== $request->user()->id) {
            abort(403);
        }

        $share->update(['is_read' => true]);

        return back();
    }
}
