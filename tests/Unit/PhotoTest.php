<?php

namespace Tests\Unit;

use App\Models\Photo;
use App\Models\User;
use App\Models\Album;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhotoTest extends TestCase
{
    use RefreshDatabase;

    public function test_photo_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $photo->user);
        $this->assertEquals($user->id, $photo->user->id);
    }

    public function test_photo_can_belong_to_multiple_albums(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $user->id]);
        $album1 = Album::factory()->create(['user_id' => $user->id]);
        $album2 = Album::factory()->create(['user_id' => $user->id]);

        $photo->albums()->attach($album1->id);
        $photo->albums()->attach($album2->id);

        $this->assertCount(2, $photo->albums);
        $this->assertTrue($photo->albums->contains($album1));
        $this->assertTrue($photo->albums->contains($album2));
    }

    public function test_photo_has_exif_as_array(): void
    {
        $photo = Photo::factory()->create([
            'exif' => ['Camera' => 'Canon', 'ISO' => 400],
        ]);

        $this->assertIsArray($photo->exif);
        $this->assertEquals('Canon', $photo->exif['Camera']);
    }

    public function test_photo_has_captured_at_as_datetime(): void
    {
        $photo = Photo::factory()->create([
            'captured_at' => '2025-01-15 10:30:00',
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $photo->captured_at);
    }

    public function test_photo_has_size_as_integer(): void
    {
        $photo = Photo::factory()->create(['size' => 1024000]);

        $this->assertIsInt($photo->size);
        $this->assertEquals(1024000, $photo->size);
    }

    public function test_photo_uses_soft_deletes(): void
    {
        $photo = Photo::factory()->create();
        $photoId = $photo->id;

        $photo->delete();

        $this->assertSoftDeleted('photos', ['id' => $photoId]);
        $this->assertNull(Photo::find($photoId));
        $this->assertNotNull(Photo::withTrashed()->find($photoId));
    }

    public function test_photo_can_be_favorited(): void
    {
        $photo = Photo::factory()->create(['is_favorite' => false]);
        
        $this->assertFalse($photo->is_favorite);
        
        $photo->update(['is_favorite' => true]);
        
        $this->assertTrue($photo->fresh()->is_favorite);
    }

    public function test_photo_has_location_data(): void
    {
        $photo = Photo::factory()->create([
            'latitude' => 10.762622,
            'longitude' => 106.660172,
            'location_text' => 'Ho Chi Minh City',
            'location_name' => 'Ho Chi Minh City, Vietnam',
        ]);

        $this->assertEquals(10.762622, $photo->latitude);
        $this->assertEquals(106.660172, $photo->longitude);
        $this->assertEquals('Ho Chi Minh City', $photo->location_text);
        $this->assertEquals('Ho Chi Minh City, Vietnam', $photo->location_name);
    }

    public function test_photo_has_mime_type(): void
    {
        $imagePhoto = Photo::factory()->create(['mime' => 'image/jpeg']);
        $videoPhoto = Photo::factory()->create(['mime' => 'video/mp4']);

        $this->assertEquals('image/jpeg', $imagePhoto->mime);
        $this->assertEquals('video/mp4', $videoPhoto->mime);
    }

    public function test_photo_has_sha256_hash(): void
    {
        $photo = Photo::factory()->create(['sha256' => 'abc123def456']);
        
        $this->assertEquals('abc123def456', $photo->sha256);
    }
}

