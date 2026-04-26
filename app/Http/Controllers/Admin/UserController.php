<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Super-admin user management: role assignment, enable/disable, soft-delete
 * and restore. Policy rules include self-protection — a super admin cannot
 * change their own role, disable themselves, or delete themselves.
 */
class UserController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->withTrashed()
            ->with('invitedBy:id,name')
            ->orderByDesc('created_at')
            ->paginate(25)
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => (string) $u->role,
                'role_label' => Role::label((string) $u->role),
                'email_verified_at' => $u->email_verified_at?->toIso8601String(),
                'disabled_at' => $u->disabled_at?->toIso8601String(),
                'deleted_at' => $u->deleted_at?->toIso8601String(),
                'created_at' => $u->created_at?->toIso8601String(),
                'invited_by' => $u->invitedBy ? ['id' => $u->invitedBy->id, 'name' => $u->invitedBy->name] : null,
                'is_self' => $u->id === $request->user()?->id,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'assignable_roles' => array_map(
                fn (string $role) => ['value' => $role, 'label' => Role::label($role)],
                Role::assignable(),
            ),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        // Guard "edit at all" — covers name updates. Role changes are
        // gated separately by the changeRole policy below.
        $this->authorize('update', $user);

        $data = $request->validated();

        if (array_key_exists('role', $data) && $data['role'] !== (string) $user->role) {
            $this->authorize('changeRole', $user);
            $previous = (string) $user->role;
            $user->role = $data['role'];

            $this->audit->record('user.role_changed', $request->user(), $user, [
                'from' => $previous,
                'to' => $data['role'],
            ]);
        }

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        $user->save();

        return back()->with('status', 'User updated.');
    }

    public function disable(Request $request, User $user): RedirectResponse
    {
        $this->authorize('disable', $user);

        if ($user->disabled_at === null) {
            $user->forceFill(['disabled_at' => now()])->save();

            // Kill every active session for this user so the account is
            // booted out immediately, not just on next navigation.
            DB::table('sessions')->where('user_id', $user->id)->delete();

            $this->audit->record('user.disabled', $request->user(), $user);
        }

        return back()->with('status', "Disabled {$user->name}.");
    }

    public function enable(Request $request, User $user): RedirectResponse
    {
        $this->authorize('enable', $user);

        if ($user->disabled_at !== null) {
            $user->forceFill(['disabled_at' => null])->save();
            $this->audit->record('user.enabled', $request->user(), $user);
        }

        return back()->with('status', "Enabled {$user->name}.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $user->delete();
        DB::table('sessions')->where('user_id', $user->id)->delete();

        $this->audit->record('user.deleted', $request->user(), $user);

        return back()->with('status', "Deleted {$user->name}. Use Restore to recover.");
    }

    public function restore(Request $request, int $id): RedirectResponse
    {
        $user = User::withTrashed()->findOrFail($id);
        $this->authorize('restore', $user);

        $user->restore();

        $this->audit->record('user.restored', $request->user(), $user);

        return back()->with('status', "Restored {$user->name}.");
    }
}
