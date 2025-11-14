<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['share', 'friend_request', 'album_shared']),
            'title' => fake()->sentence(),
            'body' => fake()->paragraph(),
            'data' => [],
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Indicate that the notification is read.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_read' => true,
        ]);
    }

    /**
     * Indicate that the notification is for a share.
     */
    public function share(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'share',
            'title' => 'Bạn đã nhận được chia sẻ mới',
            'body' => fake()->sentence(),
            'data' => ['photo_id' => fake()->numberBetween(1, 100)],
        ]);
    }

    /**
     * Indicate that the notification is for a friend request.
     */
    public function friendRequest(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'friend_request',
            'title' => 'Yêu cầu kết bạn mới',
            'body' => fake()->sentence(),
            'data' => ['user_id' => fake()->numberBetween(1, 100)],
        ]);
    }
}

