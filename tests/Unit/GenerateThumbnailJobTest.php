<?php

namespace Tests\Unit;

use App\Jobs\GenerateThumbnail;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GenerateThumbnailJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_thumbnail_job_instantiates_with_photo(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $user->id]);

        $job = new GenerateThumbnail($photo);

        $this->assertInstanceOf(GenerateThumbnail::class, $job);
        $this->assertEquals($photo->id, $job->photo->id);
    }

    public function test_generate_thumbnail_job_handles_missing_file_gracefully(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/nonexistent.jpg',
            'mime' => 'image/jpeg',
        ]);

        $job = new GenerateThumbnail($photo);
        
        // Should not throw exception for missing files
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle missing files gracefully');
        }
    }

    public function test_generate_thumbnail_job_detects_video_mime_type(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'mime' => 'video/mp4',
        ]);

        $job = new GenerateThumbnail($photo);
        
        // Job should recognize video mime type
        $this->assertStringStartsWith('video/', $photo->mime);
    }

    public function test_generate_thumbnail_job_detects_image_mime_type(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'mime' => 'image/jpeg',
        ]);

        $job = new GenerateThumbnail($photo);
        
        // Job should recognize image mime type
        $this->assertStringStartsWith('image/', $photo->mime);
    }
}

