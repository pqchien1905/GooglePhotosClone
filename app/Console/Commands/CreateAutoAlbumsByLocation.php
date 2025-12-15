<?php

namespace App\Console\Commands;

use App\Models\Album;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateAutoAlbumsByLocation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'photos:create-auto-albums-by-location {--user= : User ID to process (default: all users)} {--radius=1 : Radius in km to group photos by location}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động tạo album theo địa điểm chụp (dựa trên GPS data)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Bắt đầu tạo album tự động theo địa điểm...');

        $userQuery = User::query();
        if ($userId = $this->option('user')) {
            $userQuery->where('id', $userId);
        }

        $radius = (float) $this->option('radius');
        $this->info("Sử dụng radius: {$radius} km");

        $users = $userQuery->get();
        $totalAlbums = 0;

        foreach ($users as $user) {
            $this->info("Xử lý user: {$user->name} (ID: {$user->id})");

            // Get photos with GPS data
            $photos = Photo::where('user_id', $user->id)
                ->whereNull('deleted_at')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->orderBy('created_at', 'desc')
                ->get();

            if ($photos->isEmpty()) {
                $this->line("  Không có ảnh có GPS data, bỏ qua.");
                continue;
            }

            // Group photos by location (using clustering)
            $clusters = $this->clusterPhotosByLocation($photos, $radius);

            foreach ($clusters as $clusterKey => $clusterPhotos) {
                if ($clusterPhotos->count() < 2) {
                    // Skip clusters with less than 2 photos
                    continue;
                }

                $locationName = $this->getLocationName($clusterPhotos);
                
                // Check if album already exists
                $existingAlbum = Album::where('user_id', $user->id)
                    ->where('name', $locationName)
                    ->first();

                if ($existingAlbum) {
                    $this->line("  Album '{$locationName}' đã tồn tại, bỏ qua.");
                    continue;
                }

                // Create album
                $album = Album::create([
                    'user_id' => $user->id,
                    'name' => $locationName,
                ]);

                // Add photos to album with position
                $photoIds = [];
                foreach ($clusterPhotos as $position => $photo) {
                    $photoIds[$photo->id] = ['position' => $position];
                }

                $album->photos()->sync($photoIds);

                // Set first photo as cover if not already set
                if (!$album->cover_photo_id) {
                    $album->update(['cover_photo_id' => $clusterPhotos->first()->id]);
                }

                $this->line("  Tạo album '{$locationName}' với {$clusterPhotos->count()} ảnh");
                $totalAlbums++;
            }
        }

        $this->info("✓ Tạo xong {$totalAlbums} album theo địa điểm");
    }

    /**
     * Cluster photos by location using simple distance algorithm
     * Uses Haversine formula to calculate distance between coordinates
     *
     * @param \Illuminate\Database\Eloquent\Collection $photos
     * @param float $radiusKm Radius in kilometers
     * @return array Array of photo collections grouped by location
     */
    private function clusterPhotosByLocation($photos, float $radiusKm = 1.0): array
    {
        $clusters = [];
        $processed = [];

        foreach ($photos as $photo) {
            if (isset($processed[$photo->id])) {
                continue;
            }

            $cluster = collect([$photo]);
            $processed[$photo->id] = true;

            // Find all photos within radius
            foreach ($photos as $otherPhoto) {
                if (isset($processed[$otherPhoto->id])) {
                    continue;
                }

                $distance = $this->calculateDistance(
                    $photo->latitude,
                    $photo->longitude,
                    $otherPhoto->latitude,
                    $otherPhoto->longitude
                );

                if ($distance <= $radiusKm) {
                    $cluster->push($otherPhoto);
                    $processed[$otherPhoto->id] = true;
                }
            }

            $clusters[] = $cluster;
        }

        return $clusters;
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     *
     * @param float $lat1 Latitude 1
     * @param float $lon1 Longitude 1
     * @param float $lat2 Latitude 2
     * @param float $lon2 Longitude 2
     * @return float Distance in kilometers
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadiusKm = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusKm * $c;
    }

    /**
     * Get location name from cluster of photos
     * Uses location_name or reverse geocoded name if available,
     * otherwise uses coordinate format
     *
     * @param \Illuminate\Database\Eloquent\Collection $photos
     * @return string Location name
     */
    private function getLocationName($photos): string
    {
        // Try to find a location name from the cluster
        foreach ($photos as $photo) {
            if (!empty($photo->location_name)) {
                return $photo->location_name;
            }
        }

        // Fallback: use average coordinates
        $avgLat = $photos->avg('latitude');
        $avgLon = $photos->avg('longitude');

        return sprintf('%.4f°N, %.4f°E', abs($avgLat), abs($avgLon));
    }
}
