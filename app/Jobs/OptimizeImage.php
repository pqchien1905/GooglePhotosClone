<?php

namespace App\Jobs;

use App\Models\Photo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\Laravel\Facades\Image;

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
            $fullPath = Storage::disk('public')->path($this->photo->path);

            if (!file_exists($fullPath)) {
                return;
            }

            // Only optimize if file is larger than 2MB
            if (filesize($fullPath) < 2 * 1024 * 1024) {
                return;
            }

            $image = Image::read($fullPath);

            // Limit max dimension to 2048px
            if ($image->width() > 2048 || $image->height() > 2048) {
                $image->resize(2048, 2048, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }

            // Save with optimized quality
            $image->save($fullPath, 85);

            // Update file size
            $this->photo->update(['size' => filesize($fullPath)]);
        } catch (\Throwable $e) {
            Log::error('OptimizeImage job failed for photo id ' . $this->photo->id . ': ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            throw $e;
        }
    }
}
