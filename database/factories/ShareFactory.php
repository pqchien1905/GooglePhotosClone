<?php

namespace Database\Factories;

use App\Models\Share;
use App\Models\User;
use App\Models\Photo;
use App\Models\Album;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Share>
 */
class ShareFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sender_id' => User::factory(),
            'receiver_id' => User::factory(),
            'shareable_type' => Photo::class,
            'shareable_id' => Photo::factory(),
            'message' => fake()->optional()->sentence(),
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Indicate that the share is for an album.
     */
    public function forAlbum(): static
    {
        return $this->state(fn (array $attributes) => [
            'shareable_type' => Album::class,
            'shareable_id' => Album::factory(),
        ]);
    }

    /**
     * Indicate that the share is read.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_read' => true,
        ]);
    }
}

