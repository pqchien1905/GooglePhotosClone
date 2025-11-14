<?php

namespace App\Jobs;

use App\Models\Photo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\Laravel\Facades\Image;
use Symfony\Component\Process\Process;

class GenerateThumbnail implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public Photo $photo)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $fullPath = Storage::disk('public')->path($this->photo->path);

            if (!file_exists($fullPath)) {
                return;
            }

            // Check if it's a video
            $isVideo = str_starts_with($this->photo->mime ?? '', 'video/');

            if ($isVideo) {
                // Try FFmpeg thumbnail extraction when available
                $ffmpeg = env('FFMPEG_PATH', 'ffmpeg');

                $thumbPath = 'videos/thumbs/' . pathinfo($this->photo->path, PATHINFO_FILENAME) . '.jpg';
                $thumbFullPath = Storage::disk('public')->path($thumbPath);

                $dir = dirname($thumbFullPath);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }

                // Extract frame at 1s, scale width to 400, keep aspect ratio
                $process = new Process([
                    $ffmpeg,
                    '-ss', '00:00:01',
                    '-i', $fullPath,
                    '-frames:v', '1',
                    '-vf', 'scale=400:-1',
                    '-y', $thumbFullPath,
                ]);
                $process->setTimeout(60);
                try {
                    $process->run();
                } catch (\Throwable $t) {
                    Log::warning('FFmpeg execution failed: '.$t->getMessage());
                }

                if ($process->isSuccessful() && file_exists($thumbFullPath)) {
                    $this->photo->update(['thumb_path' => $thumbPath]);
                } else {
                    Log::warning('FFmpeg could not generate thumbnail for photo id '.$this->photo->id.': '.$process->getErrorOutput());
                }
                return;
            }

            // Image thumbnail generation
            $image = Image::read($fullPath);

            // Resize to max width 400px, keep aspect ratio, don't upscale
            $image->resize(400, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            $thumbPath = 'photos/thumbs/' . basename($this->photo->path);
            $thumbFullPath = Storage::disk('public')->path($thumbPath);

            // Ensure directory exists
            $dir = dirname($thumbFullPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $image->save($thumbFullPath, 80);

            $this->photo->update(['thumb_path' => $thumbPath]);
        } catch (\Throwable $e) {
            // Log exception so queue failures are visible in storage/logs/laravel.log
            Log::error('GenerateThumbnail job failed for photo id ' . $this->photo->id . ': ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            throw $e;
        }
    }
}
