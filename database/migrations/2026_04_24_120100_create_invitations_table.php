<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Invitation tokens for the closed-registration flow.
 *
 * Security shape:
 *   - `token_hash` stores sha256(token). The plain token only ever lives in
 *     the invite URL / email — never in the DB. An attacker with read access
 *     to this table still cannot consume an invite.
 *   - `expires_at` caps a token's lifetime (default 72h in the manager).
 *   - `used_at` makes the token single-use — the accept controller rejects
 *     invites where used_at is non-null.
 *   - `revoked_at` lets a super admin kill a pending invite without deleting
 *     the audit trail.
 *   - `(email, used_at)` index supports "does an active invite already exist
 *     for this email?" checks when creating a new one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('role', 20);
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('created_by_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('accepted_user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['email', 'used_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
