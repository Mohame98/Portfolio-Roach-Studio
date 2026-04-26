<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Registration invite issued by a super admin.
 *
 * The plain token is never persisted — only its sha256 hash sits in
 * `token_hash`. The plain token is:
 *   1. generated in InvitationManager::issue()
 *   2. returned once to the caller (controller → email/URL)
 *   3. looked up by hashing whatever the user presents and comparing
 *
 * An invitation is "usable" iff: not used, not revoked, not expired.
 */
class Invitation extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'role',
        'token_hash',
        'expires_at',
        'used_at',
        'revoked_at',
        'created_by_id',
        'accepted_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function acceptedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_user_id');
    }

    /**
     * Still valid — not used, not revoked, not expired.
     */
    public function scopeActive(Builder $q): Builder
    {
        return $q->whereNull('used_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());
    }

    public function isUsable(): bool
    {
        return $this->used_at === null
            && $this->revoked_at === null
            && $this->expires_at !== null
            && $this->expires_at->isFuture();
    }

    public function status(): string
    {
        if ($this->used_at !== null) {
            return 'accepted';
        }

        if ($this->revoked_at !== null) {
            return 'revoked';
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return 'expired';
        }

        return 'pending';
    }

    public static function hashToken(string $plain): string
    {
        return hash('sha256', $plain);
    }
}
