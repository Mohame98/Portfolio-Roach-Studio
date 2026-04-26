<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBlogCategoryRequest;
use App\Models\BlogCategory;
use App\Services\AuditLogger;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Editor+ manages the list of blog categories. Small, flat resource —
 * everything happens on the index page.
 */
class BlogCategoryController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): Response
    {
        $this->authorize('viewAny', BlogCategory::class);

        // Relation on BlogCategory is `posts()` (not `blogPosts`) — the
        // withCount alias matches that.
        $categories = BlogCategory::query()
            ->withCount('posts')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'slug', 'name', 'accent', 'sort_order'])
            ->map(fn (BlogCategory $c) => [
                'id' => $c->id,
                'slug' => $c->slug,
                'name' => $c->name,
                'accent' => $c->accent,
                'sort_order' => $c->sort_order,
                'post_count' => $c->posts_count ?? 0,
            ]);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreBlogCategoryRequest $request): RedirectResponse
    {
        $this->authorize('create', BlogCategory::class);

        $data = $request->validated();
        $data['sort_order'] ??= 0;

        $category = BlogCategory::create($data);

        $this->audit->record('category.created', $request->user(), $category, [
            'slug' => $category->slug,
        ]);

        return back()->with('status', 'Category created.');
    }

    public function update(StoreBlogCategoryRequest $request, BlogCategory $category): RedirectResponse
    {
        $this->authorize('update', $category);

        $data = $request->validated();
        $data['sort_order'] ??= 0;

        $category->update($data);

        $this->audit->record('category.updated', $request->user(), $category);

        return back()->with('status', 'Category updated.');
    }

    public function destroy(Request $request, BlogCategory $category): RedirectResponse
    {
        $this->authorize('delete', $category);

        $category->delete();

        $this->audit->record('category.deleted', $request->user(), $category);

        return back()->with('status', 'Category deleted.');
    }
}
