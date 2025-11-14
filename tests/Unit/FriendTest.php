<?php

namespace Tests\Unit;

use App\Models\Friend;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FriendTest extends TestCase
{
    use RefreshDatabase;

    public function test_friend_has_requester_relationship(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();
        $friend = Friend::factory()->create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
        ]);

        $this->assertInstanceOf(User::class, $friend->requester);
        $this->assertEquals($requester->id, $friend->requester->id);
    }

    public function test_friend_has_addressee_relationship(): void
    {
        $requester = User::factory()->create();
        $addressee = User::factory()->create();
        $friend = Friend::factory()->create([
            'requester_id' => $requester->id,
            'addressee_id' => $addressee->id,
        ]);

        $this->assertInstanceOf(User::class, $friend->addressee);
        $this->assertEquals($addressee->id, $friend->addressee->id);
    }

    public function test_friend_can_have_pending_status(): void
    {
        $friend = Friend::factory()->create(['status' => 'pending']);

        $this->assertEquals('pending', $friend->status);
    }

    public function test_friend_can_have_accepted_status(): void
    {
        $friend = Friend::factory()->create(['status' => 'accepted']);

        $this->assertEquals('accepted', $friend->status);
    }

    public function test_friend_can_have_blocked_status(): void
    {
        $friend = Friend::factory()->create(['status' => 'blocked']);

        $this->assertEquals('blocked', $friend->status);
    }

    public function test_friend_can_have_different_users(): void
    {
        $requester1 = User::factory()->create();
        $addressee1 = User::factory()->create();
        $requester2 = User::factory()->create();
        $addressee2 = User::factory()->create();

        $friend1 = Friend::factory()->create([
            'requester_id' => $requester1->id,
            'addressee_id' => $addressee1->id,
        ]);

        $friend2 = Friend::factory()->create([
            'requester_id' => $requester2->id,
            'addressee_id' => $addressee2->id,
        ]);

        $this->assertNotEquals($friend1->id, $friend2->id);
        $this->assertEquals($requester1->id, $friend1->requester_id);
        $this->assertEquals($requester2->id, $friend2->requester_id);
    }
}
