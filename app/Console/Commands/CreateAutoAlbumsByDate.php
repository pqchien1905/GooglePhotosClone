<?php

namespace App\Console\Commands;

use App\Models\Album;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateAutoAlbumsByDate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'photos:create-auto-albums {--user= : User ID to process (default: all users)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động tạo album theo ngày chụp hoặc ngày upload';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Bắt đầu tạo album tự động theo ngày...');

        $userQuery = User::query();
        if ($userId = $this->option('user')) {
            $userQuery->where('id', $userId);
        }

        $users = $userQuery->get();
        $totalAlbums = 0;

        foreach ($users as $user) {
            $this->info("Xử lý user: {$user->name} (ID: {$user->id})");

            // Group photos by date (captured_at or created_at)
            $photos = Photo::where('user_id', $user->id)
                ->whereNull('deleted_at')
                ->orderBy('captured_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            $groupedByDate = $photos->groupBy(function ($photo) {
                $date = $photo->captured_at ?? $photo->created_at;
                return $date->format('Y-m-d');
            });

            foreach ($groupedByDate as $date => $datePhotos) {
                // Skip if less than 5 photos (configurable threshold)
                if ($datePhotos->count() < 5) {
                    continue;
                }

                $albumName = $date; // e.g., "2025-11-05"
                $parsedDate = \Carbon\Carbon::parse($date);
                $albumName = $parsedDate->locale('vi')->isoFormat('D MMMM YYYY'); // e.g., "5 tháng 11 2025"

                // Check if album already exists
                $existingAlbum = Album::where('user_id', $user->id)
                    ->where('name', $albumName)
                    ->first();

                if ($existingAlbum) {
                    $this->line("  Album '{$albumName}' đã tồn tại, bỏ qua.");
                    continue;
                }

                // Create album
                $album = Album::create([
                    'user_id' => $user->id,
                    'name' => $albumName,
                    'cover_photo_id' => $datePhotos->first()->id,
                ]);

                // Attach photos
                $album->photos()->attach($datePhotos->pluck('id'));

                $this->info("  ✓ Tạo album '{$albumName}' với {$datePhotos->count()} ảnh");
                $totalAlbums++;
            }
        }

        $this->info("Hoàn thành! Tạo tổng cộng {$totalAlbums} album.");
        return 0;
    }
}
