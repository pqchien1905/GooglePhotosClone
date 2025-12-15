$user = App\Models\User::firstOrCreate(
    ['email' => 'test@example.com'],
    [
        'name' => 'Test User',
        'password' => bcrypt('password'),
        'email_verified_at' => now(),
    ]
);
echo "User: " . $user->email . "\n";
