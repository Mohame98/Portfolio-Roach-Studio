<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Issues, consumes, and revokes registration invitations.
 *
 * Token lifecycle:
 *   - issue()   generates a 64-char random token, stores sha256(token), and
 *               returns the plain token to the caller (controller → email
 *               link). The plain token is never logged or persisted.
 *   - findByToken() looks up by hash. Returns null for any invalid token.
 *   - consume() flips used_at, links the created user, and returns the
 *               marked invitation. Idempotent-safe: a second call is a
 *               no-op because the "active" guard rejects used invites.
 *   - revoke()  sets revoked_at without touching used_at, so accepted
 *               invites stay auditable.
 */
class InvitationManager
{
    /** Plain-token length in bytes (before base64) — 32 bytes = 256 bits. */
    private const TOKEN_BYTES = 32;

    /**
     * Default TTL for a new invitation. 72h is the upper end of what
     * feels reasonable — gives a writer a full weekend to accept without
     * leaving a usable link floating indefinitely.
     */
    public const DEFAULT_TTL_HOURS = 72;

    /**
     * @return array{invitation: Invitation, plain_token: string}
     */
    public function issue(
        string $email,
        string $role,
        User $creator,
        ?int $ttlHours = null,
    ): array {
        if (! Role::isValid($role)) {
            throw new \InvalidArgumentException("Unknown role: {$role}");
        }

        $plain = $this->generateToken();
        $invite = Invitation::create([
            'email' => mb_strtolower($email),
            'role' => $role,
            'token_hash' => Invitation::hashToken($plain),
            'expires_at' => now()->addHours($ttlHours ?? self::DEFAULT_TTL_HOURS),
            'created_by_id' => $creator->id,
        ]);

        return ['invitation' => $invite, 'plain_token' => $plain];
    }

    public function findByToken(string $plain): ?Invitation
    {
        if ($plain === '') {
            return null;
        }

        return Invitation::query()
            ->where('token_hash', Invitation::hashToken($plain))
            ->first();
    }

    /**
     * Mark an invitation as consumed by the given user. Caller is responsible
     * for verifying the invitation is usable first (policy/controller).
     */
    public function consume(Invitation $invite, User $acceptedUser): Invitation
    {
        $invite->forceFill([
            'used_at' => now(),
            'accepted_user_id' => $acceptedUser->id,
        ])->save();

        return $invite;
    }

    public function revoke(Invitation $invite): Invitation
    {
        if ($invite->revoked_at === null && $invite->used_at === null) {
            $invite->forceFill(['revoked_at' => now()])->save();
        }

        return $invite;
    }

    /**
     * Cryptographically-random URL-safe token. base64url over 32 random
     * bytes → 43 chars, comfortably shorter than the 64-char token_hash
     * column. 256 bits of entropy is overkill for a 72h one-use token
     * but the cost is nil.
     */
    private function generateToken(): string
    {
        $raw = random_bytes(self::TOKEN_BYTES);

        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }
}
