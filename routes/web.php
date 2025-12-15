<?php

use App\Http\Controllers\Api\ShareLinkController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All routes are handled by Next.js frontend + API endpoints.
| This file serves a redirect page for users who access backend URL.
|
*/

// Redirect page for users accessing backend directly
Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

// Auth routes (kept for backwards compatibility - mostly empty now)
require __DIR__.'/auth.php';
