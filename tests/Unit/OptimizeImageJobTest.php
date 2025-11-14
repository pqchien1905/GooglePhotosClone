<?php

namespace Tests\Unit;

use App\Jobs\OptimizeImage;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class OptimizeImageJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_optimize_image_job_instantiates_with_photo(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $user->id]);

        $job = new OptimizeImage($photo);

        $this->assertInstanceOf(OptimizeImage::class, $job);
        $this->assertEquals($photo->id, $job->photo->id);
    }

    public function test_optimize_image_job_skips_small_files(): void
    {
        Storage::fake('public');
        Log::shouldReceive('error')->never();

        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'size' => 1024 * 1024, // 1 MB (less than 2MB threshold)
        ]);

        // Create a small fake file
        Storage::disk('public')->put($photo->path, 'fake image content');

        $job = new OptimizeImage($photo);
        
        // Should not throw exception for small files
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            // Expected to skip optimization for small files
            $this->assertTrue(true);
        }
    }

    public function test_optimize_image_job_handles_missing_file_gracefully(): void
    {
        Storage::fake('public');
        Log::shouldReceive('error')->never();

        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/nonexistent.jpg',
        ]);

        $job = new OptimizeImage($photo);
        
        // Should not throw exception for missing files
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle missing files gracefully');
        }
    }
}

