<?php

namespace App\Jobs;

use App\Models\Photo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ExtractMetadata implements ShouldQueue
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
        $fullPath = Storage::disk('public')->path($this->photo->path);

        if (!file_exists($fullPath)) {
            return;
        }

        $exif = @exif_read_data($fullPath);

        if (!$exif) {
            return;
        }

        $metadata = [];
        $capturedAt = null;
        $latitude = null;
        $longitude = null;
        $locationText = null;

        // Extract date
        if (!empty($exif['DateTimeOriginal'])) {
            $capturedAt = \DateTime::createFromFormat('Y:m:d H:i:s', $exif['DateTimeOriginal']);
        } elseif (!empty($exif['DateTime'])) {
            $capturedAt = \DateTime::createFromFormat('Y:m:d H:i:s', $exif['DateTime']);
        }

        // Extract GPS
        if (isset($exif['GPSLatitude']) && isset($exif['GPSLongitude'])) {
            $latitude = $this->getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef'] ?? 'N');
            $longitude = $this->getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef'] ?? 'E');

            // Optional: reverse geocode to get location text (would require external API)
            $locationText = sprintf('%.6f, %.6f', $latitude, $longitude);
        }

        $this->photo->update([
            'exif' => $exif,
            'captured_at' => $capturedAt,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'location_text' => $locationText,
        ]);

        // Dispatch geocoding job if GPS data exists
        if ($latitude && $longitude) {
            ReverseGeocodeLocation::dispatch($this->photo);
        }
    }

    private function getGps(array $coordinate, string $ref): float
    {
        $degrees = $this->gpsToDecimal($coordinate[0]);
        $minutes = $this->gpsToDecimal($coordinate[1]);
        $seconds = $this->gpsToDecimal($coordinate[2]);

        $decimal = $degrees + ($minutes / 60) + ($seconds / 3600);

        if (in_array($ref, ['S', 'W'])) {
            $decimal *= -1;
        }

        return $decimal;
    }

    private function gpsToDecimal(string $coordinate): float
    {
        $parts = explode('/', $coordinate);
        if (count($parts) <= 0) {
            return 0;
        }

        if (count($parts) == 1) {
            return (float) $parts[0];
        }

        return (float) $parts[0] / (float) $parts[1];
    }
}
