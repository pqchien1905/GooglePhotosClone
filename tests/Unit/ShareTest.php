<?php

namespace Tests\Unit;

use App\Models\Share;
use App\Models\User;
use App\Models\Photo;
use App\Models\Album;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShareTest extends TestCase
{
    use RefreshDatabase;

    public function test_share_has_sender_relationship(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $sender->id]);
        
        $share = Share::factory()->create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'shareable_type' => Photo::class,
            'shareable_id' => $photo->id,
        ]);

        $this->assertInstanceOf(User::class, $share->sender);
        $this->assertEquals($sender->id, $share->sender->id);
    }

    public function test_share_has_receiver_relationship(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $sender->id]);
        
        $share = Share::factory()->create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'shareable_type' => Photo::class,
            'shareable_id' => $photo->id,
        ]);

        $this->assertInstanceOf(User::class, $share->receiver);
        $this->assertEquals($receiver->id, $share->receiver->id);
    }

    public function test_share_can_share_photo(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $photo = Photo::factory()->create(['user_id' => $sender->id]);
        
        $share = Share::factory()->create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'shareable_type' => Photo::class,
            'shareable_id' => $photo->id,
        ]);

        $this->assertInstanceOf(Photo::class, $share->shareable);
        $this->assertEquals($photo->id, $share->shareable->id);
    }

    public function test_share_can_share_album(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $album = Album::factory()->create(['user_id' => $sender->id]);
        
        $share = Share::factory()->create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'shareable_type' => Album::class,
            'shareable_id' => $album->id,
        ]);

        $this->assertInstanceOf(Album::class, $share->shareable);
        $this->assertEquals($album->id, $share->shareable->id);
    }

    public function test_share_has_is_read_as_boolean(): void
    {
        $share = Share::factory()->create(['is_read' => false]);
        
        $this->assertIsBool($share->is_read);
        $this->assertFalse($share->is_read);
    }

    public function test_share_can_have_message(): void
    {
        $share = Share::factory()->create([
            'message' => 'Check out these photos!',
        ]);

        $this->assertEquals('Check out these photos!', $share->message);
    }
}

