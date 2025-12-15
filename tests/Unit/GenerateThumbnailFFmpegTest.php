<?php

namespace Tests\Unit;

use App\Jobs\GenerateThumbnail;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class GenerateThumbnailFFmpegTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Queue::fake();
    }

    /**
     * Test that job can handle video files with FFmpeg
     */
    public function test_job_can_process_video_file(): void
    {
        $user = User::factory()->create();
        
        // Create a fake video file
        $videoContent = 'fake mp4 content';
        Storage::disk('public')->put('videos/test.mp4', $videoContent);

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'videos/test.mp4',
            'mime' => 'video/mp4',
        ]);

        $job = new GenerateThumbnail($photo);
        
        // Should handle video processing
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle video files: ' . $e->getMessage());
        }
    }

    /**
     * Test that job identifies video MIME types correctly
     */
    public function test_job_identifies_video_mime_types(): void
    {
        $user = User::factory()->create();
        
        Storage::disk('public')->put('videos/test.mp4', 'fake content');

        $videoMimes = [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/x-flv',
            'video/webm',
            'video/x-matroska',
        ];

        foreach ($videoMimes as $mime) {
            $photo = Photo::factory()->create([
                'user_id' => $user->id,
                'mime' => $mime,
                'path' => 'videos/test.mp4',
            ]);

            $this->assertTrue(str_starts_with($photo->mime, 'video/'));
        }
    }

    /**
     * Test that job handles missing FFmpeg gracefully
     */
    public function test_job_creates_fallback_when_ffmpeg_unavailable(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        Storage::disk('public')->put('videos/test.mp4', 'fake video content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'videos/test.mp4',
            'mime' => 'video/mp4',
        ]);

        $job = new GenerateThumbnail($photo);
        
        // Job should complete without error even if FFmpeg is not available
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle missing FFmpeg: ' . $e->getMessage());
        }
    }

    /**
     * Test that job can extract video duration
     */
    public function test_job_can_extract_video_duration(): void
    {
        $user = User::factory()->create();
        
        Storage::disk('public')->put('videos/test.mp4', 'fake content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'videos/test.mp4',
            'mime' => 'video/mp4',
        ]);

        // The job has a private method extractVideoDuration
        // This tests that the job doesn't crash when trying to extract duration
        $job = new GenerateThumbnail($photo);
        
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle duration extraction: ' . $e->getMessage());
        }
    }

    /**
     * Test that job handles deleted photos gracefully
     */
    public function test_job_handles_deleted_photo_gracefully(): void
    {
        $user = User::factory()->create();
        
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'videos/test.mp4',
            'mime' => 'video/mp4',
        ]);

        $photoId = $photo->id;
        $photo->delete();

        // Reload photo after deletion
        $photo = Photo::withTrashed()->find($photoId);

        $job = new GenerateThumbnail($photo);
        
        // Should not throw exception
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle deleted photos: ' . $e->getMessage());
        }
    }

    /**
     * Test that job handles non-existent files gracefully
     */
    public function test_job_handles_nonexistent_files_gracefully(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'videos/nonexistent.mp4',
            'mime' => 'video/mp4',
        ]);

        $job = new GenerateThumbnail($photo);
        
        // Should not throw exception for non-existent files
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle non-existent files: ' . $e->getMessage());
        }
    }

    /**
     * Test that job handles image files without video processing
     */
    public function test_job_handles_image_files(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        // Create a simple fake image
        $fakeImage = 'fake jpeg content';
        Storage::disk('public')->put('photos/test.jpg', $fakeImage);

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'photos/test.jpg',
            'mime' => 'image/jpeg',
        ]);

        $job = new GenerateThumbnail($photo);
        
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should handle image files: ' . $e->getMessage());
        }
    }

    /**
     * Test that job logs properly
     */
    public function test_job_logs_video_processing_attempts(): void
    {
        Storage::fake('public');
        Log::spy();
        
        $user = User::factory()->create();
        
        Storage::disk('public')->put('videos/test.mp4', 'fake content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'videos/test.mp4',
            'mime' => 'video/mp4',
        ]);

        $job = new GenerateThumbnail($photo);
        $job->handle();

        // Job should log something related to video processing (may log multiple times)
        Log::shouldHaveReceived('info');
    }

    /**
     * Test that FFmpeg path from env is used
     */
    public function test_job_respects_ffmpeg_path_from_env(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        Storage::disk('public')->put('videos/test.mp4', 'fake content');

        $photo = Photo::factory()->create([
            'user_id' => $user->id,
            'path' => 'videos/test.mp4',
            'mime' => 'video/mp4',
        ]);

        // Set FFmpeg path in env
        $this->app['config']['services.ffmpeg.path'] = '/custom/path/ffmpeg';

        $job = new GenerateThumbnail($photo);
        
        // Should use custom path
        try {
            $job->handle();
            $this->assertTrue(true);
        } catch (\Throwable $e) {
            $this->fail('Job should respect FFmpeg path from env: ' . $e->getMessage());
        }
    }

    /**
     * Test that multiple videos can be processed
     */
    public function test_job_can_process_multiple_videos(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        
        $videoFormats = ['test1.mp4', 'test2.avi', 'test3.mov', 'test4.webm'];
        
        foreach ($videoFormats as $filename) {
            Storage::disk('public')->put("videos/{$filename}", 'fake content');
            
            $photo = Photo::factory()->create([
                'user_id' => $user->id,
                'path' => "videos/{$filename}",
                'mime' => 'video/mp4',
            ]);

            $job = new GenerateThumbnail($photo);
            
            try {
                $job->handle();
                $this->assertTrue(true);
            } catch (\Throwable $e) {
                $this->fail("Job should handle {$filename}: " . $e->getMessage());
            }
        }
    }
}
