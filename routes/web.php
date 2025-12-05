<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\AlbumController;
use App\Http\Controllers\ShareLinkController;
use App\Http\Controllers\FriendController;
use App\Models\Photo;
use App\Models\Album;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect('/photos');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::resource('photos', PhotoController::class)->only(['index', 'store', 'show', 'destroy']);
    Route::post('/photos/share-email', [PhotoController::class, 'shareEmail'])->name('photos.share-email');
    Route::post('/photos/{id}/restore', [PhotoController::class, 'restore'])->name('photos.restore');
    Route::delete('/photos/{id}/force', [PhotoController::class, 'forceDestroy'])->name('photos.forceDestroy');
    
    // Videos page (filter by video mime type)
    Route::get('/videos', [PhotoController::class, 'videos'])->name('videos.index');
    Route::post('/videos/share-email', [PhotoController::class, 'shareVideosEmail'])->name('videos.share-email');
    
    // Favorites
    Route::get('/favorites', [PhotoController::class, 'favorites'])->name('favorites.index');
    Route::post('/photos/{id}/favorite', [PhotoController::class, 'toggleFavorite'])->name('photos.favorite');
    
    // Albums
    Route::get('/albums', [AlbumController::class, 'index'])->name('albums.index');
    // Create album page (UI only) - keeps existing store logic/routes
    Route::get('/albums/create', function () {
        return Inertia::render('Albums/Create');
    })->name('albums.create');
    Route::get('/albums/{album}', [AlbumController::class, 'show'])->name('albums.show');
    Route::post('/albums', [AlbumController::class, 'store'])->name('albums.store');
    Route::post('/albums/share-email', [AlbumController::class, 'shareEmail'])->name('albums.share-email');
    Route::patch('/albums/{album}', [AlbumController::class, 'update'])->name('albums.update');
    Route::delete('/albums/{album}', [AlbumController::class, 'destroy'])->name('albums.destroy');
    Route::post('/albums/{album}/photos', [AlbumController::class, 'addPhotos'])->name('albums.addPhotos');
    Route::delete('/albums/{album}/photos/{photo}', [AlbumController::class, 'removePhoto'])->name('albums.removePhoto');
    
    // API for albums list (for modal) - INERTIA ONLY
    Route::get('/inertia-api/albums', function (Request $request) {
        $albums = Album::with(['coverPhoto'])
            ->where('user_id', $request->user()->id)
            ->withCount('photos')
            ->orderBy('name')
            ->get();
        return response()->json(['data' => $albums]);
    });

    // API for user's photos (for album create picker) - INERTIA ONLY
    Route::get('/inertia-api/photos', function (Request $request) {
        $photos = Photo::where('user_id', $request->user()->id)
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'desc')
            ->select(['id', 'path', 'thumb_path', 'mime as mime_type', 'created_at'])
            ->paginate(60);
        return response()->json($photos);
    });

    // Tạo link chia sẻ
    Route::post('/share', [ShareLinkController::class, 'store'])->name('share.store');

    // Friends
    Route::get('/friends', [FriendController::class, 'index'])->name('friends.index');
    Route::post('/friends', [FriendController::class, 'store'])->name('friends.store');
    Route::patch('/friends/{friend}', [FriendController::class, 'update'])->name('friends.update');
    Route::delete('/friends/{friend}', [FriendController::class, 'destroy'])->name('friends.destroy');
    Route::post('/friends/{friend}/block', [FriendController::class, 'block'])->name('friends.block');
    Route::post('/friends/{friend}/unblock', [FriendController::class, 'unblock'])->name('friends.unblock');
    Route::get('/friends/list', [FriendController::class, 'list'])->name('friends.list');
    Route::post('/friends/share', [FriendController::class, 'share'])->name('friends.share');

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
    Route::get('/notifications/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount'])->name('notifications.unreadCount');

    // Shares
    Route::get('/shares/received', [\App\Http\Controllers\ShareController::class, 'received'])->name('shares.received');
    Route::get('/shares/sent', [\App\Http\Controllers\ShareController::class, 'sent'])->name('shares.sent');
    Route::post('/shares/{share}/read', [\App\Http\Controllers\ShareController::class, 'markAsRead'])->name('shares.read');
    
    Route::get('/trash', function (Request $request) {
        $photos = Photo::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->orderBy('deleted_at', 'desc')
            ->select(['id', 'path', 'thumb_path', 'deleted_at', 'mime'])
            ->get();

        return Inertia::render('Photos/TrashPage', [
            'photos' => ['data' => $photos],
        ]);
    })->name('trash.index');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

// Trang công khai xem ảnh/album qua token
Route::get('/share/{token}', [ShareLinkController::class, 'show'])->name('share.show');
Route::get('/share/{token}/download', [ShareLinkController::class, 'downloadAlbum'])->name('share.download');
