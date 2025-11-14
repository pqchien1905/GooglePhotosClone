<?php

namespace App\Providers;

use App\Models\Photo;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Inertia::share('storage', function () {
            $user = Auth::user();
            if (!$user) return null;
            $used = Photo::where('user_id', $user->id)->sum('size');
            $limit = 15 * 1024 * 1024 * 1024; // 15 GB
            return [
                'used' => $used,
                'limit' => $limit,
            ];
        });
    }
}
