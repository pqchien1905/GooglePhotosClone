<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            // Drop global unique on sha256
            try {
                $table->dropUnique('photos_sha256_unique');
            } catch (Throwable $e) {
                // ignore if index does not exist (different drivers may name it differently)
            }

            // Add composite unique (user_id, sha256)
            $table->unique(['user_id', 'sha256'], 'photos_user_sha256_unique');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            try {
                $table->dropUnique('photos_user_sha256_unique');
            } catch (Throwable $e) {
                // ignore
            }

            $table->unique('sha256');
        });
    }
};
