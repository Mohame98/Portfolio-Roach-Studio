<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extends blog_posts for the writer/editor review workflow.
 *
 * Status now has three values:
 *   - draft          owned by the writer, invisible to the public
 *   - pending_review writer has submitted for editorial approval
 *   - published      publicly visible (subject to published_at scheduling)
 *
 * Soft-delete is added so a super admin can recover a deleted post instead
 * of losing it forever. Public queries already gate on status+published_at,
 * so they naturally ignore trashed rows via the SoftDeletes trait.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->timestamp('submitted_at')->nullable()->after('published_at');
            $table->timestamp('reviewed_at')->nullable()->after('submitted_at');

            $table->foreignId('reviewer_id')
                ->nullable()
                ->after('reviewed_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('published_by_id')
                ->nullable()
                ->after('reviewer_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropForeign(['reviewer_id']);
            $table->dropForeign(['published_by_id']);
            $table->dropSoftDeletes();
            $table->dropColumn(['submitted_at', 'reviewed_at', 'reviewer_id', 'published_by_id']);
        });
    }
};
