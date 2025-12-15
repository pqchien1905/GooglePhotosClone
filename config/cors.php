<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        // LAN access for local devices
        'http://192.168.1.11:3000',
        'http://192.168.1.8:3000',
    ],

    'allowed_origins_patterns' => [
        // Allow other LAN hosts on port 3000
        '#^http://192\.168\.[0-9]{1,3}\.[0-9]{1,3}:3000$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Set to false for token-based auth (no cookies)
    'supports_credentials' => false,

];
