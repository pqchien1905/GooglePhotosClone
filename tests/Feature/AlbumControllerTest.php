<?php

namespace Tests\Feature;

use App\Models\Album;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlbumControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_album(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/albums', [
            'name' => 'Test Album',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('albums', [
            'user_id' => $user->id,
            'name' => 'Test Album',
        ]);
    }

    public function test_user_can_add_photos_to_album(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);
        $photo = Photo::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->post("/albums/{$album->id}/photos", [
            'photo_ids' => [$photo->id],
        ]);

        $response->assertRedirect();
        $this->assertTrue($album->photos()->where('photo_id', $photo->id)->exists());
    }

    public function test_user_can_remove_photos_from_album(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);
        $photo = Photo::factory()->create(['user_id' => $user->id]);
        $album->photos()->attach($photo->id);

        $response = $this->actingAs($user)->delete("/albums/{$album->id}/photos/{$photo->id}");

        $response->assertRedirect();
        $this->assertFalse($album->photos()->where('photo_id', $photo->id)->exists());
    }

    public function test_user_can_delete_album(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->delete("/albums/{$album->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('albums', ['id' => $album->id]);
    }

    public function test_user_cannot_delete_other_users_album(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user1->id]);

        $response = $this->actingAs($user2)->delete("/albums/{$album->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('albums', ['id' => $album->id]);
    }
}
