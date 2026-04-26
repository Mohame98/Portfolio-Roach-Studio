<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates /admin/* routes by role.
 *
 * Usage in routes:
 *   ->middleware('role')                   any authenticated staff member
 *   ->middleware('role:admin,super_admin') admin or super admin
 *   ->middleware('role:super_admin')       super admin only
 *
 * Assumes `auth` has already run (otherwise the guard would redirect first).
 * Also denies disabled accounts — a disabled user who still holds a session
 * cookie is booted out here, not just on login.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // Unauthenticated / no user attached — 403 rather than 404 so the
        // shape of the admin URL isn't a secret, but the response itself is.
        abort_unless($user !== null, 403);

        // Disabled accounts are logged out and sent home. We nuke the
        // session so a stolen cookie can't keep the account alive.
        if ($user->isDisabled()) {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            abort(403, 'Account disabled.');
        }

        // No specific role requested → any staff member passes.
        if ($roles === []) {
            abort_unless($user->isStaff(), 403);

            return $next($request);
        }

        foreach ($roles as $role) {
            if (! Role::isValid($role)) {
                throw new \InvalidArgumentException("Unknown role in middleware: {$role}");
            }
        }

        abort_unless($user->hasRole(...$roles), 403);

        return $next($request);
    }
}
