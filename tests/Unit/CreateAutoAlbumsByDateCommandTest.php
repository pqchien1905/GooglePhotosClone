<?php

namespace Tests\Unit;

use App\Console\Commands\CreateAutoAlbumsByDate;
use App\Models\Album;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CreateAutoAlbumsByDateCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_creates_albums_for_photos_grouped_by_date(): void
    {
        $user = User::factory()->create();
        
        // Create photos on the same date (more than 5 to trigger album creation)
        $date = now()->format('Y-m-d');
        Photo::factory()->count(6)->create([
            'user_id' => $user->id,
            'captured_at' => $date,
        ]);

        $this->artisan('photos:create-auto-albums', ['--user' => $user->id])
            ->expectsOutput('Bắt đầu tạo album tự động theo ngày...')
            ->assertExitCode(0);

        $this->assertDatabaseHas('albums', [
            'user_id' => $user->id,
        ]);
    }

    public function test_command_skips_dates_with_less_than_5_photos(): void
    {
        $user = User::factory()->create();
        
        // Create only 3 photos (less than threshold of 5)
        $date = now()->format('Y-m-d');
        Photo::factory()->count(3)->create([
            'user_id' => $user->id,
            'captured_at' => $date,
        ]);

        $this->artisan('photos:create-auto-albums', ['--user' => $user->id])
            ->assertExitCode(0);

        // Should not create album for less than 5 photos
        $this->assertDatabaseMissing('albums', [
            'user_id' => $user->id,
        ]);
    }

    public function test_command_uses_created_at_when_captured_at_is_null(): void
    {
        $user = User::factory()->create();
        
        // Create photos without captured_at
        Photo::factory()->count(6)->create([
            'user_id' => $user->id,
            'captured_at' => null,
        ]);

        $this->artisan('photos:create-auto-albums', ['--user' => $user->id])
            ->assertExitCode(0);

        // Should still create album using created_at
        $this->assertDatabaseHas('albums', [
            'user_id' => $user->id,
        ]);
    }

    public function test_command_skips_existing_albums(): void
    {
        $user = User::factory()->create();
        
        $date = now()->format('Y-m-d');
        $parsedDate = \Carbon\Carbon::parse($date);
        $albumName = $parsedDate->locale('vi')->isoFormat('D MMMM YYYY');
        
        // Create existing album
        Album::factory()->create([
            'user_id' => $user->id,
            'name' => $albumName,
        ]);
        
        // Create photos for the same date
        Photo::factory()->count(6)->create([
            'user_id' => $user->id,
            'captured_at' => $date,
        ]);

        $albumCountBefore = Album::where('user_id', $user->id)->count();

        $this->artisan('photos:create-auto-albums', ['--user' => $user->id])
            ->assertExitCode(0);

        // Should not create duplicate album
        $albumCountAfter = Album::where('user_id', $user->id)->count();
        $this->assertEquals($albumCountBefore, $albumCountAfter);
    }

    public function test_command_processes_all_users_when_no_user_option(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        $date = now()->format('Y-m-d');
        
        Photo::factory()->count(6)->create([
            'user_id' => $user1->id,
            'captured_at' => $date,
        ]);
        
        Photo::factory()->count(6)->create([
            'user_id' => $user2->id,
            'captured_at' => $date,
        ]);

        $this->artisan('photos:create-auto-albums')
            ->assertExitCode(0);

        $this->assertDatabaseHas('albums', ['user_id' => $user1->id]);
        $this->assertDatabaseHas('albums', ['user_id' => $user2->id]);
    }

    public function test_command_attaches_photos_to_created_album(): void
    {
        $user = User::factory()->create();
        
        $date = now()->format('Y-m-d');
        $photos = Photo::factory()->count(6)->create([
            'user_id' => $user->id,
            'captured_at' => $date,
        ]);

        $this->artisan('photos:create-auto-albums', ['--user' => $user->id])
            ->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        $this->assertNotNull($album);
        $this->assertCount(6, $album->photos);
    }

    public function test_command_sets_cover_photo_to_first_photo(): void
    {
        $user = User::factory()->create();
        
        $date = now()->format('Y-m-d');
        $photos = Photo::factory()->count(6)->create([
            'user_id' => $user->id,
            'captured_at' => $date,
        ]);

        $this->artisan('photos:create-auto-albums', ['--user' => $user->id])
            ->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        $this->assertNotNull($album);
        $this->assertEquals($photos->first()->id, $album->cover_photo_id);
    }
}

