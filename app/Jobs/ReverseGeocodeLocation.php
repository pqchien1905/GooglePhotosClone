<?php

namespace App\Jobs;

use App\Models\Photo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReverseGeocodeLocation implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Photo $photo
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!$this->photo->latitude || !$this->photo->longitude) {
            return;
        }

        $provider = config('services.geocoding.provider', 'nominatim');

        if ($provider === 'nominatim') {
            $this->handleNominatim();
        }
    }

    protected function handleNominatim(): void
    {
        $url = config('services.geocoding.nominatim_url', 'https://nominatim.openstreetmap.org');
        $email = config('services.geocoding.nominatim_email');

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => "GooglePhotosClone/{$email}",
                ])
                ->get("{$url}/reverse", [
                    'lat' => $this->photo->latitude,
                    'lon' => $this->photo->longitude,
                    'format' => 'json',
                    'addressdetails' => 1,
                    'zoom' => 14, // city/town level
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $locationName = $this->formatNominatimAddress($data);
                
                $this->photo->update([
                    'location_name' => $locationName,
                ]);

                Log::info("Geocoded photo {$this->photo->id}: {$locationName}");
            } else {
                Log::warning("Geocoding failed for photo {$this->photo->id}: {$response->status()}");
            }
        } catch (\Exception $e) {
            Log::error("Geocoding error for photo {$this->photo->id}: {$e->getMessage()}");
        }
    }

    protected function formatNominatimAddress(array $data): string
    {
        $address = $data['address'] ?? [];
        
        // Priority: city > town > village > county > state > country
        $parts = [];
        
        if (!empty($address['city'])) {
            $parts[] = $address['city'];
        } elseif (!empty($address['town'])) {
            $parts[] = $address['town'];
        } elseif (!empty($address['village'])) {
            $parts[] = $address['village'];
        } elseif (!empty($address['county'])) {
            $parts[] = $address['county'];
        }
        
        if (!empty($address['state'])) {
            $parts[] = $address['state'];
        }
        
        if (!empty($address['country'])) {
            $parts[] = $address['country'];
        }

        return implode(', ', $parts) ?: ($data['display_name'] ?? 'Unknown Location');
    }
}
