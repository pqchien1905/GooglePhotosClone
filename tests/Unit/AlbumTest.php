<?php

namespace Tests\Unit;

use App\Models\Album;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlbumTest extends TestCase
{
    use RefreshDatabase;

    public function test_album_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $album->user);
        $this->assertEquals($user->id, $album->user->id);
    }

    public function test_album_has_cover_photo(): void
    {
        $user = User::factory()->create();
        $coverPhoto = Photo::factory()->create(['user_id' => $user->id]);
        $album = Album::factory()->create([
            'user_id' => $user->id,
            'cover_photo_id' => $coverPhoto->id,
        ]);

        $this->assertInstanceOf(Photo::class, $album->coverPhoto);
        $this->assertEquals($coverPhoto->id, $album->coverPhoto->id);
    }

    public function test_album_can_have_multiple_photos(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);
        $photo1 = Photo::factory()->create(['user_id' => $user->id]);
        $photo2 = Photo::factory()->create(['user_id' => $user->id]);
        $photo3 = Photo::factory()->create(['user_id' => $user->id]);

        $album->photos()->attach([$photo1->id, $photo2->id, $photo3->id]);

        $this->assertCount(3, $album->photos);
        $this->assertTrue($album->photos->contains($photo1));
        $this->assertTrue($album->photos->contains($photo2));
        $this->assertTrue($album->photos->contains($photo3));
    }

    public function test_album_photos_have_position_pivot(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);
        $photo = Photo::factory()->create(['user_id' => $user->id]);

        $album->photos()->attach($photo->id, ['position' => 5]);

        $this->assertEquals(5, $album->photos->first()->pivot->position);
    }

    public function test_album_photos_are_ordered_by_position(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);
        $photo1 = Photo::factory()->create(['user_id' => $user->id]);
        $photo2 = Photo::factory()->create(['user_id' => $user->id]);
        $photo3 = Photo::factory()->create(['user_id' => $user->id]);

        $album->photos()->attach($photo1->id, ['position' => 3]);
        $album->photos()->attach($photo2->id, ['position' => 1]);
        $album->photos()->attach($photo3->id, ['position' => 2]);

        $photos = $album->photos;
        $this->assertEquals($photo2->id, $photos[0]->id);
        $this->assertEquals($photo3->id, $photos[1]->id);
        $this->assertEquals($photo1->id, $photos[2]->id);
    }
}

