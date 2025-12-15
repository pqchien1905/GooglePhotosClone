<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Photo extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'path',
        'thumb_path',
        'size',
        'mime',
        'exif',
        'captured_at',
        'location_text',
        'location_name',
        'latitude',
        'longitude',
        'visibility',
        'sha256',
        'is_favorite',
        'duration',
    ];

    protected $casts = [
        'exif' => 'array',
        'captured_at' => 'datetime',
        'size' => 'integer',
        'duration' => 'integer',
    ];

    protected $appends = [
        'original_filename',
        'mime_type',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function albums(): BelongsToMany
    {
        return $this->belongsToMany(Album::class, 'album_photo')
            ->withPivot('position')
            ->withTimestamps();
    }

    /**
     * Get the original filename from the path.
     */
    public function getOriginalFilenameAttribute(): string
    {
        return basename($this->path ?? '');
    }

    /**
     * Alias for mime field (backward compatibility).
     */
    public function getMimeTypeAttribute(): ?string
    {
        return $this->mime;
    }
}

