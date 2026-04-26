<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\InvitationManager;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The single, public-facing entry point into account creation. There is
 * NO open /register — every account starts as an invitation issued by a
 * super admin (see Admin\InvitationController).
 *
 * GET  /register/invite/{token}  → renders the form (after validating the token)
 * POST /register/invite/{token}  → consumes the token, creates the user
 *
 * Token validation:
 *   - sha256 hash lookup (never compared against the plain token)
 *   - rejects used / revoked / expired invites with the same generic
 *     "invalid or expired" message so a probing attacker can't tell
 *     which failure mode they hit
 *   - on success, the invitation row is marked used in the same DB
 *     transaction as the user create, so a race between two concurrent
 *     accepts can't both win
 */
class InvitationRegistrationController extends Controller
{
    public function __construct(
        private readonly InvitationManager $invitations,
        private readonly AuditLogger $audit,
    ) {}

    public function show(Request $request, string $token): Response
    {
        $invite = $this->invitations->findByToken($token);

        if ($invite === null || ! $invite->isUsable()) {
            return Inertia::render('Auth/InvitationInvalid', [
                'reason' => $invite === null ? 'unknown' : $invite->status(),
            ]);
        }

        return Inertia::render('Auth/InvitationAccept', [
            'token' => $token,
            'email' => $invite->email,
            'role_label' => \App\Models\Role::label($invite->role),
            'expires_at' => $invite->expires_at?->toIso8601String(),
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $invite = $this->invitations->findByToken($token);

        if ($invite === null || ! $invite->isUsable()) {
            return redirect()
                ->route('invitation.show', ['token' => $token])
                ->with('error', 'This invitation is no longer valid.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            // Email is fixed by the invite — the form sends it back so we
            // can show a clean error if someone tampered with it client-side.
            'email' => ['required', 'email', Rule::in([$invite->email])],
            'password' => [
                'required',
                'confirmed',
                // 12 chars + mixed case + numbers + symbol. Aligns with the
                // OWASP "modern" guidance and is meaningfully stronger than
                // Laravel's bare default.
                Password::min(12)->mixedCase()->numbers()->symbols()->uncompromised(),
            ],
        ]);

        $user = DB::transaction(function () use ($invite, $data, $request) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $invite->email,
                'password' => $data['password'],
                'role' => $invite->role,
                'invited_by_id' => $invite->created_by_id,
            ]);

            // The email coming through the invite is implicitly verified —
            // a super admin already knows where the link landed.
            $user->forceFill(['email_verified_at' => now()])->save();

            $this->invitations->consume($invite, $user);

            return $user;
        });

        // Fire Registered so any downstream listeners (welcome notifications,
        // analytics) get the event. Email verification is already done
        // above so the standard "verify your email" mail won't fire.
        event(new Registered($user));

        $this->audit->record('invitation.accepted', $user, $invite, [
            'email' => $user->email,
            'role' => (string) $user->role,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/admin/blog-posts')
            ->with('status', "Welcome, {$user->name}.");
    }
}
