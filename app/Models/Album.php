<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Album extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'name',
        'cover_photo_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coverPhoto(): BelongsTo
    {
        return $this->belongsTo(Photo::class, 'cover_photo_id');
    }

    public function photos(): BelongsToMany
    {
        return $this->belongsToMany(Photo::class, 'album_photo')
            ->withPivot('position')
            ->withTimestamps()
            ->orderBy('position');
    }
}
