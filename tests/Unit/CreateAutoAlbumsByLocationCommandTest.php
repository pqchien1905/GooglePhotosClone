<?php

namespace Tests\Unit;

use App\Console\Commands\CreateAutoAlbumsByLocation;
use App\Models\Album;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateAutoAlbumsByLocationCommandTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that command creates album for clustered photos
     */
    public function test_command_creates_album_for_location_cluster(): void
    {
        $user = User::factory()->create();

        // Create photos at same location (Saigon area)
        Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
            'location_name' => 'Ho Chi Minh City',
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
            '--radius' => 1,
        ])->assertExitCode(0);

        // Should create one album
        $album = Album::where('user_id', $user->id)->first();
        $this->assertNotNull($album);
        $this->assertEquals(5, $album->photos()->count());
    }

    /**
     * Test that command respects radius parameter
     */
    public function test_command_respects_radius_parameter(): void
    {
        $user = User::factory()->create();

        // Create photos at two different locations
        // Location 1: Saigon
        Photo::factory(3)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        // Location 2: Hanoi (far away)
        Photo::factory(3)->create([
            'user_id' => $user->id,
            'latitude' => 21.0285,
            'longitude' => 105.8542,
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
            '--radius' => 1, // 1 km radius should not group Hanoi and Saigon
        ])->assertExitCode(0);

        // Should create 2 albums
        $albums = Album::where('user_id', $user->id)->get();
        $this->assertCount(2, $albums);
    }

    /**
     * Test that command ignores photos without GPS data
     */
    public function test_command_ignores_photos_without_gps(): void
    {
        $user = User::factory()->create();

        // Create photos with GPS
        Photo::factory(3)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        // Create photos without GPS
        Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => null,
            'longitude' => null,
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        // Should only include photos with GPS
        $this->assertEquals(3, $album->photos()->count());
    }

    /**
     * Test that command skips small clusters
     */
    public function test_command_skips_clusters_with_less_than_two_photos(): void
    {
        $user = User::factory()->create();

        // Create only one photo
        Photo::factory(1)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        // Should not create album
        $albums = Album::where('user_id', $user->id)->get();
        $this->assertCount(0, $albums);
    }

    /**
     * Test that command does not duplicate existing albums
     */
    public function test_command_does_not_duplicate_existing_albums(): void
    {
        $user = User::factory()->create();

        // Create photos
        $photos = Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
            'location_name' => 'Ho Chi Minh City',
        ]);

        // Create existing album with same name
        $existingAlbum = Album::create([
            'user_id' => $user->id,
            'name' => 'Ho Chi Minh City',
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        // Should still have only one album
        $albums = Album::where('user_id', $user->id)->get();
        $this->assertCount(1, $albums);
        $this->assertEquals($existingAlbum->id, $albums->first()->id);
    }

    /**
     * Test that command processes multiple users
     */
    public function test_command_processes_multiple_users(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // User 1 photos
        Photo::factory(5)->create([
            'user_id' => $user1->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        // User 2 photos at different location
        Photo::factory(5)->create([
            'user_id' => $user2->id,
            'latitude' => 21.0285,
            'longitude' => 105.8542,
        ]);

        $this->artisan('photos:create-auto-albums-by-location')->assertExitCode(0);

        // Should create 2 albums total
        $totalAlbums = Album::count();
        $this->assertEquals(2, $totalAlbums);
    }

    /**
     * Test that command sets cover photo
     */
    public function test_command_sets_cover_photo_for_album(): void
    {
        $user = User::factory()->create();

        $photos = Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        $this->assertNotNull($album->cover_photo_id);
        
        // Verify cover photo is one of the album photos
        $photoIds = $album->photos()->pluck('photos.id')->toArray();
        $this->assertContains($album->cover_photo_id, $photoIds);
    }

    /**
     * Test that command handles user with no photos
     */
    public function test_command_handles_user_with_no_photos(): void
    {
        $user = User::factory()->create();

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        // Should not crash and create no albums
        $albums = Album::where('user_id', $user->id)->get();
        $this->assertCount(0, $albums);
    }

    /**
     * Test that command uses location_name when available
     */
    public function test_command_uses_location_name_for_album_name(): void
    {
        $user = User::factory()->create();

        Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
            'location_name' => 'Saigon Tower',
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        $this->assertEquals('Saigon Tower', $album->name);
    }

    /**
     * Test that command generates coordinate format name when location_name is empty
     */
    public function test_command_generates_coordinate_name_when_no_location_name(): void
    {
        $user = User::factory()->create();

        Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
            'location_name' => null,
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        // Should contain coordinate format
        $this->assertStringContainsString('°', $album->name);
    }

    /**
     * Test that command orders photos by position in album
     */
    public function test_command_maintains_photo_positions(): void
    {
        $user = User::factory()->create();

        $photos = Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        $albumPhotos = $album->photos()->get();

        // Should have all photos
        $this->assertEquals(5, $albumPhotos->count());
    }

    /**
     * Test that command handles deleted photos
     */
    public function test_command_ignores_deleted_photos(): void
    {
        $user = User::factory()->create();

        $photos = Photo::factory(5)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        // Soft delete some photos
        $photos->slice(0, 2)->each->delete();

        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
        ])->assertExitCode(0);

        $album = Album::where('user_id', $user->id)->first();
        // Should only include non-deleted photos
        $this->assertEquals(3, $album->photos()->count());
    }

    /**
     * Test distance calculation accuracy
     */
    public function test_command_correctly_calculates_distance(): void
    {
        $user = User::factory()->create();

        // Create photos at known locations
        // These are ~1.4 km apart (roughly)
        Photo::factory(2)->create([
            'user_id' => $user->id,
            'latitude' => 10.7769,
            'longitude' => 106.6966,
        ]);

        Photo::factory(2)->create([
            'user_id' => $user->id,
            'latitude' => 10.7850,  // Changed by ~0.0081 degrees ≈ 0.9 km
            'longitude' => 106.6966,
        ]);

        // With 1km radius, should group into clusters
        $this->artisan('photos:create-auto-albums-by-location', [
            '--user' => $user->id,
            '--radius' => 1.5,
        ])->assertExitCode(0);

        // Should create 1 album with 4 photos
        $albums = Album::where('user_id', $user->id)->get();
        $this->assertEquals(1, $albums->count());
        $this->assertEquals(4, $albums->first()->photos()->count());
    }
}
