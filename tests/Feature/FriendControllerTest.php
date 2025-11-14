<?php

namespace Tests\Feature;

use App\Models\Friend;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FriendControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_friend_request(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $response = $this->actingAs($user1)->post('/friends', [
            'email' => $user2->email,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('friends', [
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'pending',
        ]);
    }

    public function test_user_can_accept_friend_request(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $request = Friend::factory()->create([
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user2)->patch("/friends/{$request->id}");

        $response->assertRedirect();
        $this->assertDatabaseHas('friends', [
            'id' => $request->id,
            'status' => 'accepted',
        ]);
    }

    public function test_user_can_reject_friend_request(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $request = Friend::factory()->create([
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'pending',
        ]);

        // Controller deletes on reject, so we'll test deletion instead
        $response = $this->actingAs($user2)->delete("/friends/{$request->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('friends', [
            'id' => $request->id,
        ]);
    }

    public function test_user_can_block_friend(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $friendship = Friend::factory()->create([
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'accepted',
        ]);

        $response = $this->actingAs($user1)->post("/friends/{$friendship->id}/block");

        $response->assertRedirect();
        $this->assertDatabaseHas('friends', [
            'id' => $friendship->id,
            'status' => 'blocked',
        ]);
    }

    public function test_user_can_remove_friend(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $friendship = Friend::factory()->create([
            'requester_id' => $user1->id,
            'addressee_id' => $user2->id,
            'status' => 'accepted',
        ]);

        $response = $this->actingAs($user1)->delete("/friends/{$friendship->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('friends', ['id' => $friendship->id]);
    }
}
