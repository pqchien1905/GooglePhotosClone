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
        Schema::table('users', function (Blueprint $table) {
            $table->bigInteger('storage_used')->default(0)->after('email_verified_at')->comment('Storage used in bytes');
            $table->bigInteger('storage_quota')->default(16106127360)->after('storage_used')->comment('Storage quota in bytes (default 15GB)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['storage_used', 'storage_quota']);
        });
    }
};
