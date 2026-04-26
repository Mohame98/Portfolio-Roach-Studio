<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

/**
 * Invitations are super-admin only. Admins can't invite; only the site
 * owner(s) decide who joins.
 */
class InvitationPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isDisabled()) {
            return false;
        }

        return $user->isSuperAdmin() ? null : false;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function revoke(User $user, Invitation $invite): bool
    {
        return $invite->used_at === null;
    }
}
