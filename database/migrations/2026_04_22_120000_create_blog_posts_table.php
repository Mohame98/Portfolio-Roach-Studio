<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('blog_category_id')
                ->nullable()
                ->constrained('blog_categories')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            // Unique public identifier. Generated from the title + dedupe
            // suffix if necessary (see BlogPost::generateUniqueSlug).
            $table->string('slug')->unique();
            $table->string('title');

            // Short summary shown on the list page and used for <meta
            // description>. Capped in the FormRequest, not the column.
            $table->text('excerpt')->nullable();

            // `body_html` is the *already sanitised* HTML that is safe to
            // render via dangerouslySetInnerHTML. Raw editor output is
            // never stored here — it always passes through HtmlSanitizer.
            $table->longText('body_html');

            // Extracted headings (<h2>/<h3>) for the sticky TOC. Stored
            // as JSON [{ id, text, level }] so the frontend doesn't need
            // to re-parse the HTML. Regenerated alongside body_html.
            $table->json('toc')->nullable();

            // draft | published — `scheduled` could be added later by
            // looking at (published_at > now()).
            $table->string('status', 16)->default('draft')->index();
            $table->timestamp('published_at')->nullable()->index();

            // Pre-computed on save so list queries stay cheap.
            $table->unsignedSmallInteger('reading_minutes')->default(1);

            $table->timestamps();

            // Index for the two hot list queries: newest-first and
            // category-scoped newest-first.
            $table->index(['status', 'published_at']);
            $table->index(['blog_category_id', 'status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
