<?php

namespace Tests\Unit;

use App\Models\ShareLink;
use App\Models\User;
use App\Models\Photo;
use App\Models\Album;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class ShareLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_share_link_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $shareLink = ShareLink::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $shareLink->user);
        $this->assertEquals($user->id, $shareLink->user->id);
    }

    public function test_share_link_can_belong_to_photo(): void
    {
        $user = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $user->id]);
        $shareLink = ShareLink::factory()->create([
            'user_id' => $user->id,
            'photo_id' => $photo->id,
        ]);

        $this->assertInstanceOf(Photo::class, $shareLink->photo);
        $this->assertEquals($photo->id, $shareLink->photo->id);
    }

    public function test_share_link_can_belong_to_album(): void
    {
        $user = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $user->id]);
        $shareLink = ShareLink::factory()->create([
            'user_id' => $user->id,
            'album_id' => $album->id,
        ]);

        $this->assertInstanceOf(Album::class, $shareLink->album);
        $this->assertEquals($album->id, $shareLink->album->id);
    }

    public function test_share_link_has_expires_at_as_datetime(): void
    {
        $shareLink = ShareLink::factory()->create([
            'expires_at' => '2025-12-31 23:59:59',
        ]);

        $this->assertInstanceOf(Carbon::class, $shareLink->expires_at);
    }

    public function test_share_link_can_be_created_without_expiry(): void
    {
        $shareLink = ShareLink::factory()->create(['expires_at' => null]);

        $this->assertNull($shareLink->expires_at);
    }

    public function test_share_link_has_unique_token(): void
    {
        $shareLink1 = ShareLink::factory()->create();
        $shareLink2 = ShareLink::factory()->create();

        $this->assertNotEquals($shareLink1->token, $shareLink2->token);
        $this->assertNotEmpty($shareLink1->token);
        $this->assertNotEmpty($shareLink2->token);
    }
}
