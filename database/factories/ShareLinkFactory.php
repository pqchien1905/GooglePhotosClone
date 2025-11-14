<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ShareLink>
 */
class ShareLinkFactory extends Factory
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
            'photo_id' => null,
            'album_id' => null,
            'token' => fake()->sha256(),
            'expires_at' => null,
            'visibility' => 'link',
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}

