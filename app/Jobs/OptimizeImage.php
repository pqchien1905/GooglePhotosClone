<?php

namespace App\Jobs;

use App\Models\Photo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\App;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class OptimizeImage implements ShouldQueue
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
            // Check if photo still exists
            if (!$this->photo || !$this->photo->exists) {
                Log::warning('Photo not found or has been deleted. Skipping image optimization.');
                return;
            }

            $fullPath = Storage::disk('public')->path($this->photo->path);

            if (!file_exists($fullPath)) {
                return;
            }

            // Only optimize if file is larger than 2MB
            if (filesize($fullPath) < 2 * 1024 * 1024) {
                return;
            }

            // Check if GD extension is available
            if (!extension_loaded('gd') && !extension_loaded('imagick')) {
                Log::warning('GD or Imagick extension not available. Skipping optimization for photo id ' . $this->photo->id);
                return;
            }

            try {
                $manager = App::has('image') ? App::make('image') : new ImageManager(new Driver());
                $image = $manager->read($fullPath);

                // Limit max dimension to 2048px
                if ($image->width() > 2048 || $image->height() > 2048) {
                    $image->scaleDown(width: 2048, height: 2048);
                }

                $image->save($fullPath, 85);
                $this->photo->update(['size' => filesize($fullPath)]);
                Log::info('Image optimized for photo id ' . $this->photo->id);
            } catch (\Throwable $e) {
                Log::warning('Image optimization failed for photo id ' . $this->photo->id . ': ' . $e->getMessage());
            }
        } catch (\Throwable $e) {
            Log::warning('OptimizeImage job failed for photo id ' . $this->photo->id . ': ' . $e->getMessage());
        }
    }

    /**
     * Handle a failed job
     */
    public function failed(\Throwable $exception): void
    {
        // If it's a ModelNotFoundException, just log and forget
        if ($exception instanceof ModelNotFoundException) {
            Log::info('OptimizeImage job skipped - Photo model not found (likely deleted)');
            return;
        }

        Log::error('OptimizeImage job failed: ' . $exception->getMessage());
    }
}

