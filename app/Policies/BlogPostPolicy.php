<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BlogPost;
use App\Models\Role;
use App\Models\User;

/**
 * Blog-post authorization for the three-role model.
 *
 *   Writer:      can CRUD their own drafts, submit them, but not publish
 *   Admin:       can review, approve, publish, edit any post's content,
 *                and delete any non-published (or their own) post
 *   Super admin: bypasses every check
 *
 * Disabled users never pass this policy (before() short-circuits them to
 * false) so a disabled admin cannot keep editing after being deactivated.
 */
class BlogPostPolicy
{
    /**
     * Super admins bypass per-method checks entirely. Disabled users are
     * denied everything. Everyone else falls through to the individual
     * methods below.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isDisabled()) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isStaff();
    }

    public function view(User $user, BlogPost $post): bool
    {
        // Any editor can view any post. Writers can only view their own.
        return $user->isAdmin() || $user->id === $post->user_id;
    }

    public function create(User $user): bool
    {
        return $user->isStaff();
    }

    /**
     * Who can edit the content of a post?
     *   - Writers: only their own, and only while it's a draft OR still
     *     awaiting review. Once it's published, the writer has to ask an
     *     editor to unpublish it first.
     *   - Editors/admins: any post.
     */
    public function update(User $user, BlogPost $post): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->id !== $post->user_id) {
            return false;
        }

        return $post->isDraft() || $post->isPendingReview();
    }

    /**
     * Writers can only delete their own drafts. Editors can delete anything
     * (SoftDeletes keeps the row recoverable by a super admin).
     */
    public function delete(User $user, BlogPost $post): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->id === $post->user_id && $post->isDraft();
    }

    /**
     * Restoring a trashed post is a super-admin-only action (handled by
     * before()). This explicit denial makes the intent visible on the
     * policy surface.
     */
    public function restore(User $user, BlogPost $post): bool
    {
        return false;
    }

    /* ------------------------- workflow transitions ------------------------- */

    /**
     * Writer submits their own draft for review.
     */
    public function submit(User $user, BlogPost $post): bool
    {
        return $user->id === $post->user_id && $post->isDraft();
    }

    /**
     * Editor approves a pending-review post (does NOT publish it). Paired
     * with `publish` so an editor can approve now and schedule publication
     * later.
     */
    public function approve(User $user, BlogPost $post): bool
    {
        return $user->isAdmin() && $post->isPendingReview();
    }

    /**
     * Editor rejects a pending-review post — sends it back to draft.
     */
    public function reject(User $user, BlogPost $post): bool
    {
        return $user->isAdmin() && $post->isPendingReview();
    }

    /**
     * Publish — flip status to published and stamp published_at if unset.
     * Only editors+ can publish; writers never can, even on their own post.
     */
    public function publish(User $user, BlogPost $post): bool
    {
        return $user->isAdmin() && ! $post->isPublished();
    }

    public function unpublish(User $user, BlogPost $post): bool
    {
        return $user->isAdmin() && $post->isPublished();
    }
}
