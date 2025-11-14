<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Photo>
 */
class PhotoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'path' => 'photos/' . fake()->uuid() . '.jpg',
            'thumb_path' => 'photos/thumbs/' . fake()->uuid() . '.jpg',
            'size' => fake()->numberBetween(100000, 5000000),
            'mime' => 'image/jpeg',
            'sha256' => fake()->sha256(),
            'visibility' => 'private',
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
