<?php

namespace Tests\Unit;

use App\Jobs\ExtractMetadata;
use App\Jobs\ReverseGeocodeLocation;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExtractMetadataJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_extract_metadata_job_instantiates_with_photo(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $user->id]);

        $job = new ExtractMetadata($photo);

        $this->assertInstanceOf(ExtractMetadata::class, $job);
        $this->assertEquals($photo->id, $job->photo->id);
    }

    public function test_extract_metadata_job_handles_missing_file_gracefully(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/nonexistent.jpg',
        ]);

        $job = new ExtractMetadata($photo);
        
        // Should not throw exception for missing files
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle missing files gracefully');
        }
    }

    public function test_extract_metadata_job_handles_no_exif_data(): void
    {
        Storage::fake('public');
        Queue::fake();

        $user = User::factory()->create();
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
        ]);

        // Create a fake file without EXIF data
        Storage::disk('public')->put($photo->path, 'fake image content');

        $job = new ExtractMetadata($photo);
        
        // Should not throw exception when no EXIF data
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle missing EXIF data gracefully');
        }
        
        // Should not dispatch ReverseGeocodeLocation when no GPS data
        Queue::assertNotPushed(ReverseGeocodeLocation::class);
    }
}

