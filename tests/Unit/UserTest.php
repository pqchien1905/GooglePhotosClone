<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Photo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_photos_relationship(): void
    {
        $user = User::factory()->create();
        $photo1 = Photo::factory()->create(['user_id' => $user->id]);
        $photo2 = Photo::factory()->create(['user_id' => $user->id]);

        $this->assertCount(2, $user->photos);
        $this->assertTrue($user->photos->contains($photo1));
        $this->assertTrue($user->photos->contains($photo2));
    }

    public function test_user_storage_used_human_attribute(): void
    {
        $user = User::factory()->create(['storage_used' => 1024]);
        
        $this->assertEquals('1 KB', $user->storage_used_human);
    }

    public function test_user_storage_quota_human_attribute(): void
    {
        $user = User::factory()->create(['storage_quota' => 10737418240]); // 10GB
        
        $this->assertEquals('10 GB', $user->storage_quota_human);
    }

    public function test_user_storage_percentage_calculation(): void
    {
        $user = User::factory()->create([
            'storage_used' => 5368709120, // 5GB
            'storage_quota' => 10737418240, // 10GB
        ]);
        
        $this->assertEquals(50.0, $user->storage_percentage);
    }

    public function test_user_storage_percentage_returns_zero_when_quota_is_zero(): void
    {
        $user = User::factory()->create([
            'storage_used' => 1024,
            'storage_quota' => 0,
        ]);
        
        $this->assertEquals(0, $user->storage_percentage);
    }

    public function test_user_storage_percentage_handles_negative_quota(): void
    {
        $user = User::factory()->create([
            'storage_used' => 1024,
            'storage_quota' => -1,
        ]);
        
        $this->assertEquals(0, $user->storage_percentage);
    }

    public function test_user_format_bytes_converts_correctly(): void
    {
        $user = new User();
        
        // Test B
        $this->assertEquals('500 B', $this->invokeMethod($user, 'formatBytes', [500]));
        
        // Test KB
        $this->assertEquals('1 KB', $this->invokeMethod($user, 'formatBytes', [1024]));
        
        // Test MB
        $this->assertEquals('1 MB', $this->invokeMethod($user, 'formatBytes', [1048576]));
        
        // Test GB
        $this->assertEquals('1 GB', $this->invokeMethod($user, 'formatBytes', [1073741824]));
        
        // Test TB
        $this->assertEquals('1 TB', $this->invokeMethod($user, 'formatBytes', [1099511627776]));
    }

    public function test_user_format_bytes_handles_zero(): void
    {
        $user = new User();
        $this->assertEquals('0 B', $this->invokeMethod($user, 'formatBytes', [0]));
    }

    public function test_user_format_bytes_handles_negative(): void
    {
        $user = new User();
        $this->assertEquals('0 B', $this->invokeMethod($user, 'formatBytes', [-100]));
    }

    public function test_user_password_is_hashed(): void
    {
        $user = User::factory()->create(['password' => 'plaintext']);
        
        $this->assertNotEquals('plaintext', $user->password);
        $this->assertTrue(\Hash::check('plaintext', $user->password));
    }

    /**
     * Call protected/private method of a class.
     */
    protected function invokeMethod(&$object, $methodName, array $parameters = [])
    {
        $reflection = new \ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);

        return $method->invokeArgs($object, $parameters);
    }
}
