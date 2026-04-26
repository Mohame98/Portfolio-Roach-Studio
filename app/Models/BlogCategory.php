<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BlogCategory extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'accent',
        'sort_order',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(BlogPost::class);
    }

    /**
     * Used when generating URLs — Laravel's route-model binding will
     * resolve categories by slug instead of id.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
