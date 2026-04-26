<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Append-only admin action log. Every privileged write goes through
 * AuditLogger::record() so we have a trail for:
 *   - user role changes / disables / deletes
 *   - invitation create/revoke/accept
 *   - blog post publish/unpublish/approve/destroy
 *
 * `user_id` is nullable because public actions (invite acceptance) are
 * logged before the new user exists, and because soft-deleting a user
 * should not cascade-destroy their history.
 *
 * `auditable_type/id` is a polymorphic pointer to the target row when one
 * exists (e.g., the BlogPost being published). For actions with no single
 * target (e.g., a user disables 2FA on themselves) these stay null and the
 * details live in `metadata`.
 *
 * No updated_at — rows are written once and never mutated.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('action', 64)->index();
            $table->string('auditable_type')->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['auditable_type', 'auditable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
