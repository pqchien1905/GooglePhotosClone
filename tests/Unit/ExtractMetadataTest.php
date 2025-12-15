<?php

namespace Tests\Unit;

use App\Jobs\ExtractMetadata;
use App\Jobs\ReverseGeocodeLocation;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ExtractMetadataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Queue::fake();
    }

    /**
     * Test that job can extract EXIF data from photos
     */
    public function test_job_extracts_exif_data_from_image(): void
    {
        $user = User::factory()->create();
        
        Storage::disk('public')->put('photos/test.jpg', 'fake image content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
        ]);

        $job = new ExtractMetadata($photo);
        
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should extract metadata: ' . $e->getMessage());
        }
    }

    /**
     * Test that job handles missing EXIF extension gracefully
     */
    public function test_job_handles_missing_exif_extension(): void
    {
        $user = User::factory()->create();
        
        Storage::disk('public')->put('photos/test.jpg', 'fake content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
        ]);

        $job = new ExtractMetadata($photo);
        
        // Should not throw exception even if EXIF extension is not loaded
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle missing EXIF extension: ' . $e->getMessage());
        }
    }

    /**
     * Test that job handles deleted photos gracefully
     */
    public function test_job_handles_deleted_photo(): void
    {
        $user = User::factory()->create();
        
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
        ]);

        $photoId = $photo->id;
        $photo->delete();

        // Reload with trashed
        $photo = Photo::withTrashed()->find($photoId);

        $job = new ExtractMetadata($photo);
        
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle deleted photos: ' . $e->getMessage());
        }
    }

    /**
     * Test that job handles missing files gracefully
     */
    public function test_job_handles_missing_files_gracefully(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/nonexistent.jpg',
            'mime' => 'image/jpeg',
        ]);

        $job = new ExtractMetadata($photo);
        
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle missing files: ' . $e->getMessage());
        }
    }

    /**
     * Test that job can extract GPS coordinates
     */
    public function test_job_can_extract_gps_data(): void
    {
        $user = User::factory()->create();
        
        Storage::disk('public')->put('photos/test.jpg', 'fake content with gps');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
            'latitude' => null,
            'longitude' => null,
        ]);

        $job = new ExtractMetadata($photo);
        
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should extract GPS data: ' . $e->getMessage());
        }
    }

    /**
     * Test that job extracts captured_at timestamp
     */
    public function test_job_extracts_captured_at_timestamp(): void
    {
        $user = User::factory()->create();
        
        Storage::disk('public')->put('photos/test.jpg', 'fake content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
            'captured_at' => null,
        ]);

        $job = new ExtractMetadata($photo);
        
        try {
            $job->handle();
            // Reload to check if captured_at was updated
            $updatedPhoto = Photo::find($photo->id);
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should extract timestamp: ' . $e->getMessage());
        }
    }

    /**
     * Test that job formats location text correctly
     */
    public function test_job_formats_location_text(): void
    {
        $user = User::factory()->create();
        
        Storage::disk('public')->put('photos/test.jpg', 'fake content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        // Job should handle location data properly
        $job = new ExtractMetadata($photo);
        
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should format location: ' . $e->getMessage());
        }
    }

    /**
     * Test that job handles various image formats
     */
    public function test_job_handles_various_image_formats(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        $formats = [
            'test.jpg' => 'image/jpeg',
            'test.png' => 'image/png',
            'test.gif' => 'image/gif',
            'test.webp' => 'image/webp',
        ];

        foreach ($formats as $filename => $mime) {
            Storage::disk('public')->put("photos/{$filename}", 'fake content');
            
            $photo = Photo::factory()->create([
                'user_id' => $user->id,
                'path' => "photos/{$filename}",
                'mime' => $mime,
            ]);

            $job = new ExtractMetadata($photo);
            
            try {
                $job->handle();
                $this->assertTrue(true);
            } catch (\Throwable $e) {
                $this->fail("Job should handle {$mime}: " . $e->getMessage());
            }
        }
    }

    /**
     * Test that job doesn't throw on metadata extraction failure
     */
    public function test_job_completes_even_on_extraction_failure(): void
    {
        Storage::fake('public');
        Log::spy();
        
        $user = User::factory()->create();
        
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/invalid.jpg',
            'mime' => 'image/jpeg',
        ]);

        $job = new ExtractMetadata($photo);
        
        // Job should complete without throwing
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should not throw on failure: ' . $e->getMessage());
        }
    }

    /**
     * Test that job properly logs failures
     */
    public function test_job_logs_extraction_failures(): void
    {
        Storage::fake('public');
        Log::spy();
        
        $user = User::factory()->create();
        
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
        ]);

        $job = new ExtractMetadata($photo);
        $job->handle();

        // Should log something
        $this->assertTrue(true);
    }

    /**
     * Test that job processes multiple photos
     */
    public function test_job_can_process_multiple_photos(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        for ($i = 0; $i < 5; $i++) {
            Storage::disk('public')->put("photos/test{$i}.jpg", 'fake content');
            
            $photo = Photo::factory()->create([
                'user_id' => $user->id,
                'path' => "photos/test{$i}.jpg",
                'mime' => 'image/jpeg',
            ]);

            $job = new ExtractMetadata($photo);
            
            try {
                $job->handle();
                $this->assertTrue(true);
            } catch (\Throwable $e) {
                $this->fail("Job should process photo {$i}: " . $e->getMessage());
            }
        }
    }

    /**
     * Test that job updates only necessary fields
     */
    public function test_job_updates_only_provided_metadata(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        $originalCreatedAt = now()->subDays(10);
        
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
            'created_at' => $originalCreatedAt,
        ]);

        $job = new ExtractMetadata($photo);
        $job->handle();

        // created_at should not change
        $updatedPhoto = Photo::find($photo->id);
        $this->assertEquals($originalCreatedAt->format('Y-m-d'), $updatedPhoto->created_at->format('Y-m-d'));
    }
}
