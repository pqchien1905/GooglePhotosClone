<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            // Add indexes for frequently queried columns
            $table->index('mime');
            $table->index('size');
            $table->index('is_favorite');
            $table->index(['user_id', 'is_favorite', 'deleted_at']);
            $table->index(['user_id', 'mime', 'deleted_at']);
            $table->index(['user_id', 'size', 'deleted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropIndex(['mime']);
            $table->dropIndex(['size']);
            $table->dropIndex(['is_favorite']);
            $table->dropIndex(['user_id', 'is_favorite', 'deleted_at']);
            $table->dropIndex(['user_id', 'mime', 'deleted_at']);
            $table->dropIndex(['user_id', 'size', 'deleted_at']);
        });
    }
};

