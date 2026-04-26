<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvitationRequest;
use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\Role;
use App\Services\AuditLogger;
use App\Services\InvitationManager;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Super-admin invitation CRUD. Invitations are the ONLY way to create a
 * user account in the system — there is no public /register.
 *
 * Flow:
 *   store()  → generates token, mails link, audit-logs. Plain token is
 *              NEVER persisted; only its hash lives in the DB.
 *   destroy()→ revokes a pending invite (used invites are immutable).
 */
class InvitationController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly InvitationManager $invitations,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Invitation::class);

        $invitations = Invitation::query()
            ->with(['creator:id,name', 'acceptedUser:id,name,email'])
            ->orderByDesc('created_at')
            ->paginate(25)
            ->through(fn (Invitation $i) => [
                'id' => $i->id,
                'email' => $i->email,
                'role' => $i->role,
                'role_label' => Role::label($i->role),
                'status' => $i->status(),
                'expires_at' => $i->expires_at?->toIso8601String(),
                'used_at' => $i->used_at?->toIso8601String(),
                'revoked_at' => $i->revoked_at?->toIso8601String(),
                'created_at' => $i->created_at?->toIso8601String(),
                'creator' => $i->creator ? ['id' => $i->creator->id, 'name' => $i->creator->name] : null,
                'accepted_user' => $i->acceptedUser ? [
                    'id' => $i->acceptedUser->id,
                    'name' => $i->acceptedUser->name,
                    'email' => $i->acceptedUser->email,
                ] : null,
            ]);

        return Inertia::render('Admin/Invitations/Index', [
            'invitations' => $invitations,
            'assignable_roles' => array_map(
                fn (string $role) => [
                    'value' => $role,
                    'label' => Role::label($role),
                ],
                Role::assignable(),
            ),
            'default_ttl_hours' => InvitationManager::DEFAULT_TTL_HOURS,
        ]);
    }

    public function store(StoreInvitationRequest $request): RedirectResponse
    {
        $this->authorize('create', Invitation::class);

        $data = $request->validated();

        ['invitation' => $invite, 'plain_token' => $plainToken] = $this->invitations->issue(
            email: $data['email'],
            role: $data['role'],
            creator: $request->user(),
            ttlHours: $data['ttl_hours'] ?? null,
        );

        // The plain token is only ever returned here, never persisted. Build
        // the accept URL once and surface it back to the super admin —
        // whether email delivery succeeds or not, they need to be able to
        // share the link manually as a fallback.
        $acceptUrl = route('invitation.show', ['token' => $plainToken]);

        $this->audit->record('invitation.created', $request->user(), $invite, [
            'email' => $invite->email,
            'role' => $invite->role,
        ]);

        // Try to actually send the email. Failures are NOT swallowed — we
        // surface the underlying error so a misconfigured SMTP setup is
        // obvious instead of looking like a successful send. The invite is
        // still valid in the DB; the admin just has to share the URL by
        // other means until SMTP is fixed.
        try {
            Mail::to($invite->email)->send(new InvitationMail($invite, $acceptUrl));
        } catch (\Throwable $e) {
            report($e);

            $reason = class_basename($e).': '.$e->getMessage();

            return back()->with('error', sprintf(
                "Invitation saved but the email could not be sent (%s). Share this link manually:\n%s",
                $reason,
                $acceptUrl,
            ));
        }

        return back()->with('status', sprintf(
            "Invitation sent to %s. Accept link (also emailed):\n%s",
            $invite->email,
            $acceptUrl,
        ));
    }

    public function destroy(Request $request, Invitation $invitation): RedirectResponse
    {
        $this->authorize('revoke', $invitation);

        $this->invitations->revoke($invitation);

        $this->audit->record('invitation.revoked', $request->user(), $invitation);

        return back()->with('status', 'Invitation revoked.');
    }
}
