<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BlogCategory;
use App\Models\User;

/**
 * Category management is editor-or-higher. Writers don't own categories.
 */
class BlogCategoryPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isDisabled()) {
            return false;
        }

        return $user->isSuperAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, BlogCategory $category): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, BlogCategory $category): bool
    {
        return $user->isAdmin();
    }
}
