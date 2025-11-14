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
        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('thumb_path')->nullable();
            $table->unsignedBigInteger('size');
            $table->string('mime', 100);
            $table->json('exif')->nullable();
            $table->dateTime('captured_at')->nullable();
            $table->string('location_text')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->enum('visibility', ['private', 'friends', 'link'])->default('private');
            $table->string('sha256', 64)->unique();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'deleted_at']);
            $table->index(['captured_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
