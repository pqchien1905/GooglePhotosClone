<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetJsonContentTypeCharset
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        if ($response instanceof \Illuminate\Http\JsonResponse) {
            $response->header('Content-Type', 'application/json; charset=utf-8');
        }
        
        return $response;
    }
}
