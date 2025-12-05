<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'storage_used' => $user->storage_used,
                'storage_quota' => $user->storage_quota,
                'storage_used_human' => $user->storage_used_human,
                'storage_quota_human' => $user->storage_quota_human,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return response()->json([
            'message' => 'Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_path' => $user->avatar_path,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    /**
     * Update the user's avatar.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $file = $request->file('avatar');

        $manager = new ImageManager(new Driver());
        $image = $manager->read($file->getPathname());
        $image = $image->cover(512, 512);

        $path = 'avatars/' . $user->id . '/avatar_' . time() . '.jpg';
        Storage::disk('public')->put($path, (string) $image->toJpeg(85));

        // Delete old avatar if exists
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->avatar_path = $path;
        $user->save();

        return response()->json([
            'message' => 'Cáº­p nháº­t áº£nh Ä‘áº¡i diá»‡n thÃ nh cÃ´ng.',
            'avatar_path' => $path,
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();
        
        // Revoke all tokens
        $user->tokens()->delete();
        
        // Delete user
        $user->delete();

        return response()->json([
            'message' => 'TÃ i khoáº£n Ä‘Ã£ Ä‘Æ°á»£c xÃ³a.',
        ]);
    }

    /**
     * Get storage statistics.
     */
    public function storage(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'storage' => [
                'used' => $user->storage_used,
                'quota' => $user->storage_quota,
                'available' => max(0, $user->storage_quota - $user->storage_used),
                'used_human' => $user->storage_used_human,
                'quota_human' => $user->storage_quota_human,
                'percentage' => $user->storage_quota > 0 
                    ? round(($user->storage_used / $user->storage_quota) * 100, 2) 
                    : 0,
            ],
        ]);
    }
}
