<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class BlogPost extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_PUBLISHED = 'published';

    /**
     * @return list<string>
     */
    public static function statuses(): array
    {
        return [self::STATUS_DRAFT, self::STATUS_PENDING_REVIEW, self::STATUS_PUBLISHED];
    }

    /**
     * Mass-assignable. `body_html` is explicitly here because the controller
     * only ever assigns an *already-sanitised* string to it — raw editor
     * output never reaches this model. Workflow columns (reviewer_id,
     * submitted_at, etc.) are intentionally guarded: they are only ever
     * mutated by the workflow actions on BlogPostController.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'blog_category_id',
        'slug',
        'title',
        'excerpt',
        'body_html',
        'toc',
        'status',
        'published_at',
        'reading_minutes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'toc' => 'array',
            'published_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /* ------------------------------ scopes ------------------------------ */

    /**
     * Only posts visible to the public — published AND the scheduled time
     * has passed. SoftDeletes is already applied globally by the trait.
     */
    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PUBLISHED)
            ->where('published_at', '<=', now());
    }

    /**
     * Posts waiting for editorial approval — fed into the /admin/review
     * queue.
     */
    public function scopePendingReview(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PENDING_REVIEW);
    }

    /**
     * Free-text filter over title + excerpt. Simple LIKE — fine at
     * portfolio scale. Swap to full-text if the table grows past a few
     * thousand rows.
     */
    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $q;
        }

        $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $term).'%';

        return $q->where(function (Builder $sub) use ($like) {
            $sub->where('title', 'like', $like)
                ->orWhere('excerpt', 'like', $like);
        });
    }

    public function scopeOrdered(Builder $q, string $direction = 'desc'): Builder
    {
        $direction = strtolower($direction) === 'asc' ? 'asc' : 'desc';

        return $q->orderBy('published_at', $direction)->orderBy('id', $direction);
    }

    /* ---------------------------- slug helpers ---------------------------- */

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'post';
        $slug = $base;
        $suffix = 1;

        while (self::query()
            ->withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q, $id) => $q->where('id', '!=', $id))
            ->exists()
        ) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }

    /* --------------------------- status helpers --------------------------- */

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPendingReview(): bool
    {
        return $this->status === self::STATUS_PENDING_REVIEW;
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }
}
