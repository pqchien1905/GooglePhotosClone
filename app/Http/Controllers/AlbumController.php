<?php

namespace App\Http\Controllers;

use App\Models\Album;
use App\Models\Photo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlbumController extends Controller
{
    public function index(Request $request)
    {
        $albums = Album::with(['coverPhoto' => function ($query) {
            $query->select(['id', 'path', 'thumb_path', 'mime']);
        }])
            ->where('user_id', $request->user()->id)
            ->withCount('photos')
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return Inertia::render('Albums/Index', [
            'albums' => $albums,
        ]);
    }

    public function show(Request $request, Album $album)
    {
        if ($album->user_id !== $request->user()->id) {
            abort(403);
        }

        $album->load(['photos' => function ($q) {
            $q->orderBy('album_photo.position');
        }, 'coverPhoto']);

        return Inertia::render('Albums/Show', [
            'album' => $album,
            'photos' => [ 'data' => $album->photos ],
        ]);
    }

    public function store(Request $request)
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
            if (!$album->cover_photo_id) {
                $album->cover_photo_id = $photos->first()->id ?? null;
                $album->save();
            }
        }

        return back()->with('success', 'Đã tạo album và thêm ảnh.');
    }

    public function update(Request $request, Album $album)
    {
        if ($album->user_id !== $request->user()->id) {
            abort(403);
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

        return back()->with('success', 'Đã cập nhật album.');
    }

    public function destroy(Request $request, Album $album)
    {
        if ($album->user_id !== $request->user()->id) {
            abort(403);
        }

        $album->photos()->detach();
        $album->delete();

        return redirect()->route('albums.index')->with('success', 'Đã xóa album.');
    }

    /**
     * Share albums via email
     */
    public function shareEmail(Request $request)
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

        // Verify ownership
        $albums = Album::whereIn('id', $albumIds)
            ->where('user_id', $user->id)
            ->with('coverPhoto')
            ->get();

        if ($albums->count() !== count($albumIds)) {
            return back()->withErrors(['album_ids' => 'Một hoặc nhiều album không tồn tại hoặc không thuộc quyền sở hữu của bạn.']);
        }

        // Prepare album data for email
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

        // Send email to each recipient
        foreach ($emails as $email) {
            try {
                \Illuminate\Support\Facades\Mail::to($email)->send(
                    new \App\Mail\ShareAlbumsMail($user, $albumData, $message)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to send share email to ' . $email . ': ' . $e->getMessage());
                // Continue sending to other emails even if one fails
            }
        }

        return back()->with('success', 'Đã gửi email chia sẻ đến ' . count($emails) . ' địa chỉ email.');
    }

    public function removePhoto(Request $request, Album $album, Photo $photo)
    {
        if ($album->user_id !== $request->user()->id) {
            abort(403);
        }

        $album->photos()->detach($photo->id);
        if ($album->cover_photo_id === $photo->id) {
            $album->cover_photo_id = optional($album->photos()->first())->id;
            $album->save();
        }
        return back()->with('success', 'Đã xóa ảnh khỏi album.');
    }

    public function addPhotos(Request $request, Album $album)
    {
        $data = $request->validate([
            'photo_ids' => 'required|array',
            'photo_ids.*' => 'integer',
        ]);

        if ($album->user_id !== $request->user()->id) {
            abort(403);
        }

        $photoIds = collect($data['photo_ids'])->unique()->values();
        $photos = Photo::whereIn('id', $photoIds)
            ->where('user_id', $request->user()->id)
            ->get();
        $album->photos()->syncWithoutDetaching($photos->pluck('id'));

        if (!$album->cover_photo_id) {
            $album->cover_photo_id = $photos->first()->id ?? $album->cover_photo_id;
            $album->save();
        }

        return back()->with('success', 'Đã thêm ảnh vào album.');
    }
}
