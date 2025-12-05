<?php

use App\Http\Controllers\Api\AlbumController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FriendController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ShareController;
use App\Http\Controllers\Api\ShareLinkController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| REST API endpoints for Google Photos Clone
|
*/

// ==========================================================================
// PUBLIC ROUTES (No authentication required)
// ==========================================================================

// Authentication
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Public share links (view shared content)
Route::get('/share/{token}', [ShareLinkController::class, 'show']);
Route::get('/share/{token}/download', [ShareLinkController::class, 'downloadAlbum']);

// ==========================================================================
// PROTECTED ROUTES (Authentication required)
// ==========================================================================

Route::middleware('auth:sanctum')->group(function () {
    
    // --------------------------------------------------------------------
    // Auth & Profile
    // --------------------------------------------------------------------
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
        Route::post('/email/verify/send', [AuthController::class, 'sendVerificationEmail']);
    });

    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::patch('/', [ProfileController::class, 'update']);
        Route::post('/avatar', [ProfileController::class, 'updateAvatar']);
        Route::delete('/', [ProfileController::class, 'destroy']);
        Route::get('/storage', [ProfileController::class, 'storage']);
    });

    // --------------------------------------------------------------------
    // Photos
    // --------------------------------------------------------------------
    Route::prefix('photos')->group(function () {
        Route::get('/', [PhotoController::class, 'index']);
        Route::post('/', [PhotoController::class, 'store']);
        Route::get('/favorites', [PhotoController::class, 'favorites']);
        Route::get('/trash', [PhotoController::class, 'trash']);
        Route::get('/{photo}', [PhotoController::class, 'show']);
        Route::delete('/{photo}', [PhotoController::class, 'destroy']);
        Route::post('/{id}/restore', [PhotoController::class, 'restore']);
        Route::delete('/{id}/force', [PhotoController::class, 'forceDestroy']);
        Route::post('/{id}/favorite', [PhotoController::class, 'toggleFavorite']);
        Route::post('/share-email', [PhotoController::class, 'shareEmail']);
    });

    // --------------------------------------------------------------------
    // Videos
    // --------------------------------------------------------------------
    Route::prefix('videos')->group(function () {
        Route::get('/', [PhotoController::class, 'videos']);
        Route::post('/share-email', [PhotoController::class, 'shareVideosEmail']);
    });

    // --------------------------------------------------------------------
    // Albums
    // --------------------------------------------------------------------
    Route::prefix('albums')->group(function () {
        Route::get('/', [AlbumController::class, 'index']);
        Route::get('/list', [AlbumController::class, 'list']);
        Route::post('/', [AlbumController::class, 'store']);
        Route::get('/{album}', [AlbumController::class, 'show']);
        Route::patch('/{album}', [AlbumController::class, 'update']);
        Route::delete('/{album}', [AlbumController::class, 'destroy']);
        Route::post('/{album}/photos', [AlbumController::class, 'addPhotos']);
        Route::delete('/{album}/photos/{photo}', [AlbumController::class, 'removePhoto']);
        Route::post('/share-email', [AlbumController::class, 'shareEmail']);
    });

    // --------------------------------------------------------------------
    // Friends
    // --------------------------------------------------------------------
    Route::prefix('friends')->group(function () {
        Route::get('/', [FriendController::class, 'index']);
        Route::get('/list', [FriendController::class, 'list']);
        Route::post('/', [FriendController::class, 'store']);
        Route::patch('/{friend}', [FriendController::class, 'update']);
        Route::delete('/{friend}', [FriendController::class, 'destroy']);
        Route::post('/{friend}/block', [FriendController::class, 'block']);
        Route::post('/{friend}/unblock', [FriendController::class, 'unblock']);
        Route::post('/share', [FriendController::class, 'share']);
    });

    // --------------------------------------------------------------------
    // Shares
    // --------------------------------------------------------------------
    Route::prefix('shares')->group(function () {
        Route::get('/received', [ShareController::class, 'received']);
        Route::get('/sent', [ShareController::class, 'sent']);
        Route::post('/{share}/read', [ShareController::class, 'markAsRead']);
    });

    // --------------------------------------------------------------------
    // Share Links
    // --------------------------------------------------------------------
    Route::prefix('share-links')->group(function () {
        Route::get('/', [ShareLinkController::class, 'index']);
        Route::post('/', [ShareLinkController::class, 'store']);
        Route::delete('/{shareLink}', [ShareLinkController::class, 'destroy']);
    });

    // --------------------------------------------------------------------
    // Notifications
    // --------------------------------------------------------------------
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
    });
});
