<?php

namespace Tests\Unit;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $notification->user);
        $this->assertEquals($user->id, $notification->user->id);
    }

    public function test_notification_has_is_read_as_boolean(): void
    {
        $notification = Notification::factory()->create(['is_read' => false]);
        
        $this->assertIsBool($notification->is_read);
        $this->assertFalse($notification->is_read);
    }

    public function test_notification_has_data_as_array(): void
    {
        $notification = Notification::factory()->create([
            'data' => ['photo_id' => 123, 'album_id' => 456],
        ]);

        $this->assertIsArray($notification->data);
        $this->assertEquals(123, $notification->data['photo_id']);
        $this->assertEquals(456, $notification->data['album_id']);
    }

    public function test_notification_mark_as_read_method(): void
    {
        $notification = Notification::factory()->create(['is_read' => false]);
        
        $this->assertFalse($notification->is_read);
        
        $notification->markAsRead();
        
        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_notification_can_have_different_types(): void
    {
        $user = User::factory()->create();
        
        $shareNotification = Notification::factory()->create([
            'user_id' => $user->id,
            'type' => 'share',
        ]);
        
        $friendNotification = Notification::factory()->create([
            'user_id' => $user->id,
            'type' => 'friend_request',
        ]);

        $this->assertEquals('share', $shareNotification->type);
        $this->assertEquals('friend_request', $friendNotification->type);
    }

    public function test_notification_has_title_and_body(): void
    {
        $notification = Notification::factory()->create([
            'title' => 'New Share',
            'body' => 'You have received a new share',
        ]);

        $this->assertEquals('New Share', $notification->title);
        $this->assertEquals('You have received a new share', $notification->body);
    }
}

