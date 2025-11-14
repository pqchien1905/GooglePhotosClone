<?php

namespace App\Console\Commands;

use App\Models\Photo;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeTrashedPhotos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'photos:purge-trash';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete photos that have been in trash for more than 30 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoff = now()->subDays(30);

        $photos = Photo::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff)
            ->get();

        $count = 0;

        foreach ($photos as $photo) {
            if ($photo->path) {
                Storage::disk('public')->delete($photo->path);
            }
            if ($photo->thumb_path) {
                Storage::disk('public')->delete($photo->thumb_path);
            }

            $photo->forceDelete();
            $count++;
        }

        $this->info("Purged {$count} photo(s) from trash.");

        return Command::SUCCESS;
    }
}
