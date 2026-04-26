<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

/**
 * User management is super-admin only. Admins can publish posts; they
 * cannot change other people's accounts.
 *
 * Self-protection rules live here rather than in the controller so the
 * UI and the server are guaranteed to agree:
 *   - You cannot change your own role.
 *   - You cannot disable or delete yourself.
 * (A super admin stripping themselves of privileges or locking themselves
 * out is a support ticket waiting to happen.)
 */
class UserPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isDisabled()) {
            return false;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function view(User $user, User $target): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, User $target): bool
    {
        return $user->isSuperAdmin();
    }

    public function changeRole(User $user, User $target): bool
    {
        return $user->isSuperAdmin() && $user->id !== $target->id;
    }

    public function disable(User $user, User $target): bool
    {
        return $user->isSuperAdmin() && $user->id !== $target->id;
    }

    public function enable(User $user, User $target): bool
    {
        return $user->isSuperAdmin() && $user->id !== $target->id;
    }

    public function delete(User $user, User $target): bool
    {
        return $user->isSuperAdmin() && $user->id !== $target->id;
    }

    public function restore(User $user, User $target): bool
    {
        return $user->isSuperAdmin();
    }
}
