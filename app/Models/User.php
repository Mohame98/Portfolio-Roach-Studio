<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Application user.
 *
 * Roles (see Role::class):
 *   - writer       can draft + submit their own posts; cannot publish
 *   - admin        can publish, review pending posts, manage categories
 *   - super_admin  can do everything + manage users and invitations
 *
 * Deactivation vs deletion: an account can be temporarily disabled
 * (disabled_at) without destroying its authored content; hard-deletion is
 * a separate SoftDeletes step so content can be reassigned or restored.
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'invited_by_id',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'disabled_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function blogPosts(): HasMany
    {
        return $this->hasMany(BlogPost::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_id');
    }

    public function sentInvitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'created_by_id');
    }

    /* ------------------------------- roles ------------------------------- */

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    /**
     * Any authenticated, enabled user that holds one of the three roles.
     * Used as the coarse gate for /admin/* — more specific policy checks
     * then layer on top.
     */
    public function isStaff(): bool
    {
        return Role::isValid((string) $this->role) && ! $this->isDisabled();
    }

    public function isWriter(): bool
    {
        return $this->role === Role::WRITER;
    }

    public function isAdmin(): bool
    {
        return Role::isAtLeast((string) $this->role, Role::ADMIN);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === Role::SUPER_ADMIN;
    }

    /**
     * True iff the account is disabled. Disabled users are still
     * authenticated through Fortify, then kicked out by the `active`
     * middleware — this keeps the disable/restore flow clean without
     * requiring a custom guard.
     */
    public function isDisabled(): bool
    {
        return $this->disabled_at !== null;
    }
}
