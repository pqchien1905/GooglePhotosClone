<?php

namespace App\Jobs;

use App\Models\Photo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\App;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
            // Check if photo still exists
            if (!$this->photo || !$this->photo->exists) {
                Log::warning('Photo not found or has been deleted. Skipping thumbnail generation.');
                return;
            }

            $fullPath = Storage::disk('public')->path($this->photo->path);

            if (!file_exists($fullPath)) {
                return;
            }

            // Check if it's a video
            $isVideo = str_starts_with($this->photo->mime ?? '', 'video/');

            if ($isVideo) {
                // Try FFmpeg thumbnail extraction when available
                $ffmpeg = env('FFMPEG_PATH', 'ffmpeg');
                Log::info('Processing video: FFmpeg path = ' . $ffmpeg);
                $thumbPath = null;
                
                // Check if ffmpeg exists on Windows
                if (stripos(PHP_OS, 'WIN') === 0) {
                    // On Windows, try to find ffmpeg.exe
                    Log::info('Windows OS detected, checking if ffmpeg exists...');
                    if (!$this->commandExists($ffmpeg)) {
                        Log::info('FFmpeg not in PATH, searching common locations...');
                        $ffmpeg = $this->findFfmpeg();
                        if (!$ffmpeg) {
                            Log::warning('FFmpeg not found. Using fallback thumbnail for video id ' . $this->photo->id);
                            $thumbPath = $this->createFallbackThumbnail();
                        } else {
                            Log::info('FFmpeg found at: ' . $ffmpeg);
                        }
                    } else {
                        Log::info('FFmpeg found in PATH');
                    }
                }

                // If we have FFmpeg, extract thumbnail
                if ($ffmpeg && !$thumbPath) {
                    // Extract duration first
                    $duration = $this->extractVideoDuration($fullPath, $ffmpeg);

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

                    $updateData = [];
                    if ($process->isSuccessful() && file_exists($thumbFullPath)) {
                        $updateData['thumb_path'] = $thumbPath;
                    } else {
                        Log::warning('FFmpeg could not generate thumbnail for photo id '.$this->photo->id.': '.$process->getErrorOutput());
                        // Fallback to placeholder
                        $thumbPath = $this->createFallbackThumbnail();
                        $updateData['thumb_path'] = $thumbPath;
                    }

                    if (isset($duration) && $duration !== null) {
                        $updateData['duration'] = $duration;
                    }

                    if (!empty($updateData)) {
                        $this->photo->update($updateData);
                    }
                } elseif ($thumbPath) {
                    // Use fallback thumbnail
                    $this->photo->update(['thumb_path' => $thumbPath]);
                }
                return;
            }

            // Image thumbnail generation
            // Check if GD extension is available
            if (!extension_loaded('gd') && !extension_loaded('imagick')) {
                Log::warning('GD or Imagick extension not available. Skipping thumbnail generation for photo id ' . $this->photo->id);
                return; // Don't fail, just skip thumbnail generation
            }

            try {
                // Try to get manager from container or create new instance
                $manager = App::has('image') ? App::make('image') : new ImageManager(new Driver());
                $image = $manager->read($fullPath);

                // Resize to max width 400px, keep aspect ratio, don't upscale
                $image->scaleDown(width: 400);

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
                // Log the image processing error
                Log::warning('Image processing failed for photo id ' . $this->photo->id . ': ' . $e->getMessage(), [
                    'exception' => $e,
                ]);
            }
        } catch (\Throwable $e) {
            // Log warning but don't fail the job - frontend will fallback to original image
            Log::warning('GenerateThumbnail job failed for photo id ' . $this->photo->id . ': ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            // Don't throw - allow job to complete successfully
            // Frontend will use original image if thumb_path is not available
        }
    }

    /**
     * Extract video duration using FFmpeg
     *
     * @param string $filePath Path to video file
     * @param string $ffmpeg FFmpeg executable path
     * @return int|null Duration in seconds, or null if extraction fails
     */
    private function extractVideoDuration(string $filePath, string $ffmpeg): ?int
    {
        try {
            $process = new Process([
                $ffmpeg,
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1:noprint_wrappers=1',
                $filePath,
            ]);
            $process->setTimeout(30);
            $process->run();

            if ($process->isSuccessful()) {
                $output = trim($process->getOutput());
                if (is_numeric($output)) {
                    return (int) round((float) $output);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Could not extract video duration for ' . $filePath . ': ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Check if a command exists in the system PATH
     *
     * @param string $command Command name or path
     * @return bool
     */
    private function commandExists(string $command): bool
    {
        $isWin = stripos(PHP_OS, 'WIN') === 0;
        $testCmd = $isWin ? "where $command" : "which $command";
        
        try {
            $process = new Process([$isWin ? 'cmd' : '/bin/sh', $isWin ? '/c' : '-c', $testCmd]);
            $process->run();
            return $process->isSuccessful();
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Find FFmpeg executable on Windows
     *
     * @return string|null Path to ffmpeg or null if not found
     */
    private function findFfmpeg(): ?string
    {
        if (stripos(PHP_OS, 'WIN') !== 0) {
            return null;
        }

        // Common paths where FFmpeg might be installed on Windows
        $possiblePaths = [
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\tools\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\Red Giant\\Trapcode Suite\\Tools\\ffmpeg.exe',
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Create a fallback thumbnail for video when FFmpeg is not available
     *
     * @return string|null Path to fallback thumbnail or null if failed
     */
    private function createFallbackThumbnail(): ?string
    {
        try {
            // Create a solid color placeholder thumbnail (400x300px, dark gray with play icon)
            $thumbPath = 'videos/thumbs/' . pathinfo($this->photo->path, PATHINFO_FILENAME) . '.jpg';
            $thumbFullPath = Storage::disk('public')->path($thumbPath);

            $dir = dirname($thumbFullPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            // Create simple placeholder image
            $width = 400;
            $height = 300;
            
            if (function_exists('imagecreatetruecolor')) {
                // Use GD if available
                $image = imagecreatetruecolor($width, $height);
                $darkGray = imagecolorallocate($image, 60, 60, 60);
                $white = imagecolorallocate($image, 255, 255, 255);
                
                // Fill background
                imagefilledrectangle($image, 0, 0, $width, $height, $darkGray);
                
                // Draw play icon (triangle)
                $points = [
                    $width / 2 - 30, $height / 2 - 25, // top-left
                    $width / 2 - 30, $height / 2 + 25, // bottom-left
                    $width / 2 + 40, $height / 2,      // right
                ];
                imagefilledpolygon($image, $points, $white);
                
                imagejpeg($image, $thumbFullPath, 80);
                imagedestroy($image);
                
                Log::info('Fallback thumbnail created for video id ' . $this->photo->id);
                return $thumbPath;
            }
        } catch (\Throwable $e) {
            Log::warning('Could not create fallback thumbnail: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Handle a failed job
     */
    public function failed(\Throwable $exception): void
    {
        // If it's a ModelNotFoundException, just log and forget
        if ($exception instanceof ModelNotFoundException) {
            Log::info('GenerateThumbnail job skipped - Photo model not found (likely deleted)');
            return;
        }

        Log::error('GenerateThumbnail job failed: ' . $exception->getMessage(), [
            'exception' => $exception,
        ]);
    }
}


