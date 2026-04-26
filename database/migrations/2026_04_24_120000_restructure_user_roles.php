<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Collapses the two boolean role flags (is_admin, is_super_admin) into a
 * single `role` enum and adds the soft-delete + deactivation infrastructure
 * the invite flow needs.
 *
 * Roles (string, intentionally not a DB enum so it's trivial to extend):
 *   - writer       can create drafts and submit them for review
 *   - admin        can publish, review, and manage categories
 *   - super_admin  can do everything + manage users and invites
 *
 * `disabled_at` deactivates an account without losing its posts/history.
 * `deleted_at` is the standard SoftDeletes column for real removal.
 * `invited_by_id` records provenance — useful for the audit trail.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('writer')->after('password');
            $table->timestamp('disabled_at')->nullable()->after('remember_token');
            $table->foreignId('invited_by_id')
                ->nullable()
                ->after('disabled_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->softDeletes()->after('updated_at');

            $table->index('role');
        });

        // Backfill role from the legacy boolean flags before we drop them.
        // Order matters: super first (so someone with both flags ends up super).
        DB::table('users')->where('is_super_admin', true)->update(['role' => 'super_admin']);
        DB::table('users')->where('is_super_admin', false)->where('is_admin', true)->update(['role' => 'admin']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_admin', 'is_super_admin']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
            $table->boolean('is_super_admin')->default(false)->after('is_admin');
        });

        DB::table('users')->where('role', 'super_admin')->update(['is_admin' => true, 'is_super_admin' => true]);
        DB::table('users')->where('role', 'admin')->update(['is_admin' => true]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['invited_by_id']);
            $table->dropIndex(['role']);
            $table->dropSoftDeletes();
            $table->dropColumn(['role', 'disabled_at', 'invited_by_id']);
        });
    }
};
