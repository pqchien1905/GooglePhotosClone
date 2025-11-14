<?php
namespace App\Http\Controllers;

use App\Models\ShareLink;
use App\Models\Photo;
use App\Models\Album;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ShareLinkController extends Controller
{
    // Tạo link chia sẻ cho ảnh hoặc album
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:photo,album',
            'id' => 'required|integer',
            'expires_in_days' => 'nullable|integer|min:1|max:365',
        ]);

        $type = $request->type;
        $id = $request->id;
        $userId = $request->user()->id;

        // Kiểm tra quyền sở hữu
        if ($type === 'photo') {
            $item = Photo::where('id', $id)->where('user_id', $userId)->firstOrFail();
        } else {
            $item = Album::where('id', $id)->where('user_id', $userId)->firstOrFail();
        }

        // Calculate expiry
        $expiresAt = null;
        if ($request->filled('expires_in_days')) {
            $expiresAt = now()->addDays($request->expires_in_days);
        }

        // Tạo hoặc lấy link chia sẻ
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

    // Trang công khai xem ảnh/album qua token
    public function show($token)
    {
        $shareLink = ShareLink::where('token', $token)->firstOrFail();

        // Check if link has expired
        if ($shareLink->expires_at && $shareLink->expires_at < now()) {
            return Inertia::render('Shared/Expired');
        }

        if ($shareLink->photo_id) {
            $photo = Photo::findOrFail($shareLink->photo_id);
            return Inertia::render('Shared/Photo', [
                'photo' => $photo,
            ]);
        } elseif ($shareLink->album_id) {
            $album = Album::with(['photos' => function($q) {
                $q->orderBy('album_photo.created_at')
                  ->select('photos.*'); // Ensure all photo fields are selected
            }, 'user'])->findOrFail($shareLink->album_id);
            
            // Đảm bảo trả về mảng cho photos với tất cả các trường
            $albumArr = $album->toArray();
            $albumArr['photos'] = $album->photos->map(function($photo) {
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
            })->values()->toArray();
            
            // Add owner info
            $albumArr['owner'] = [
                'name' => $album->user->name,
                'email' => $album->user->email,
            ];
            
            return Inertia::render('Shared/Album', [
                'album' => $albumArr,
            ]);
        } else {
            abort(404);
        }
    }

    // Tải về toàn bộ album dưới dạng ZIP
    public function downloadAlbum($token)
    {
        $shareLink = ShareLink::where('token', $token)->firstOrFail();

        // Check if link has expired
        if ($shareLink->expires_at && $shareLink->expires_at < now()) {
            abort(403, 'Link đã hết hạn');
        }

        if (!$shareLink->album_id) {
            abort(404, 'Không tìm thấy album');
        }

        $album = Album::with('photos')->findOrFail($shareLink->album_id);

        if ($album->photos->isEmpty()) {
            abort(404, 'Album không có ảnh');
        }

        // Tạo file ZIP
        $zipFileName = \Illuminate\Support\Str::slug($album->name) . '-' . time() . '.zip';
        $zipPath = storage_path('app/temp/' . $zipFileName);

        // Tạo thư mục temp nếu chưa có
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Không thể tạo file ZIP');
        }

        foreach ($album->photos as $index => $photo) {
            $filePath = storage_path('app/public/' . $photo->path);
            if (file_exists($filePath)) {
                $extension = pathinfo($photo->path, PATHINFO_EXTENSION);
                $fileName = ($index + 1) . '-' . basename($photo->path);
                $zip->addFile($filePath, $fileName);
            }
        }

        $zip->close();

        // Trả về file ZIP và xóa sau khi download
        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }
}
