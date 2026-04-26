<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public blog endpoints. Everything this controller exposes renders the
 * *sanitised* body_html that came out of HtmlSanitizer — we never reach
 * for raw editor input here.
 */
class BlogController extends Controller
{
    /**
     * GET /blog
     *
     * Query params:
     *   ?category=dev          filter to a single category (by slug)
     *   ?q=something           free-text search across title + excerpt
     *   ?sort=newest|oldest    default newest
     */
    public function index(Request $request): Response
    {
        $data = $request->validate([
            'category' => ['nullable', 'string', 'max:80'],
            'q' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', 'in:newest,oldest'],
        ]);

        $sort = $data['sort'] ?? 'newest';
        $categorySlug = $data['category'] ?? null;
        $search = $data['q'] ?? null;

        $categories = BlogCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'slug', 'name', 'accent']);

        $activeCategory = $categorySlug
            ? $categories->firstWhere('slug', $categorySlug)
            : null;

        $posts = BlogPost::query()
            ->published()
            ->with(['author:id,name', 'category:id,slug,name,accent'])
            ->when($activeCategory, fn ($q) => $q->where('blog_category_id', $activeCategory->id))
            ->search($search)
            ->ordered($sort === 'oldest' ? 'asc' : 'desc')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (BlogPost $p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'title' => $p->title,
                'excerpt' => $p->excerpt,
                'published_at' => $p->published_at?->toIso8601String(),
                'reading_minutes' => $p->reading_minutes,
                'category' => $p->category ? [
                    'slug' => $p->category->slug,
                    'name' => $p->category->name,
                    'accent' => $p->category->accent,
                ] : null,
            ]);

        return Inertia::render('Blog/Index', [
            'categories' => $categories,
            'posts' => $posts,
            'filters' => [
                'category' => $categorySlug,
                'q' => $search,
                'sort' => $sort,
            ],
        ]);
    }

    /**
     * GET /blog/{slug}
     *
     * Route-model binding resolves by slug (see BlogPost::getRouteKeyName).
     * Drafts 404 unless the viewer is the author or an admin — this keeps
     * link-previewing safely gated.
     */
    public function show(Request $request, BlogPost $post): Response
    {
        $user = $request->user();
        // Regular admins can only preview their own drafts — super admins
        // can preview any draft, just like they see every post in /admin.
        $canPreview = $user !== null
            && ($user->isSuperAdmin() || $user->id === $post->user_id);

        if (! $canPreview) {
            abort_unless(
                $post->status === BlogPost::STATUS_PUBLISHED
                    && $post->published_at !== null
                    && $post->published_at->isPast(),
                404
            );
        }

        $post->loadMissing([
            'author:id,name',
            'category:id,slug,name,accent',
        ]);

        // Related posts — same category, newest first, exclude self.
        $related = BlogPost::query()
            ->published()
            ->where('id', '!=', $post->id)
            ->when(
                $post->blog_category_id,
                fn ($q) => $q->where('blog_category_id', $post->blog_category_id)
            )
            ->ordered('desc')
            ->limit(3)
            ->get(['id', 'slug', 'title', 'excerpt', 'published_at', 'reading_minutes'])
            ->map(fn (BlogPost $r) => [
                'slug' => $r->slug,
                'title' => $r->title,
                'excerpt' => $r->excerpt,
                'published_at' => $r->published_at?->toIso8601String(),
                'reading_minutes' => $r->reading_minutes,
            ]);

        return Inertia::render('Blog/Show', [
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title' => $post->title,
                'excerpt' => $post->excerpt,
                'body_html' => $post->body_html,
                'toc' => $post->toc ?? [],
                'published_at' => $post->published_at?->toIso8601String(),
                'reading_minutes' => $post->reading_minutes,
                'status' => $post->status,
                'is_preview' => $post->status !== BlogPost::STATUS_PUBLISHED,
                'author' => $post->author ? ['name' => $post->author->name] : null,
                'category' => $post->category ? [
                    'slug' => $post->category->slug,
                    'name' => $post->category->name,
                    'accent' => $post->category->accent,
                ] : null,
            ],
            'related' => $related,
        ]);
    }
}
