<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBlogPostRequest;
use App\Http\Requests\UpdateBlogPostRequest;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Services\AuditLogger;
use App\Services\HtmlSanitizer;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin blog CRUD + workflow.
 *
 * Routes split into two classes of action:
 *   - CRUD:      index/create/store/edit/update/destroy (RESTful)
 *   - Workflow:  submit/approve/reject/publish/unpublish (POST verbs)
 *
 * Every write passes `body_html` through HtmlSanitizer before it touches
 * the database — raw editor output is never persisted. Every workflow
 * transition records an entry in the audit log.
 *
 * Authorization is layered: the route group gates on any staff role, then
 * each method calls $this->authorize(), which dispatches to BlogPostPolicy.
 */
class BlogPostController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly HtmlSanitizer $sanitizer,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', BlogPost::class);

        $user = $request->user();

        $posts = BlogPost::query()
            ->with([
                'category:id,slug,name,accent',
                'author:id,name,role',
            ])
            // Writers see only their own posts. Editors and super admins see
            // every post — editorial visibility is part of the job.
            ->when(
                $user !== null && ! $user->isAdmin(),
                fn ($q) => $q->where('user_id', $user->id),
            )
            ->orderByDesc('updated_at')
            ->paginate(20)
            ->through(fn (BlogPost $p) => $this->transformCardPost($p));

        return Inertia::render('Admin/Blog/Index', [
            'posts' => $posts,
        ]);
    }

    /**
     * GET /admin/review — pending-review queue. Editor-only by policy.
     */
    public function reviewQueue(Request $request): Response
    {
        $this->authorize('viewAny', BlogPost::class);

        $user = $request->user();
        abort_unless($user !== null && $user->isAdmin(), 403);

        $posts = BlogPost::query()
            ->with(['author:id,name', 'category:id,slug,name,accent'])
            ->pendingReview()
            ->orderBy('submitted_at')
            ->paginate(20)
            ->through(fn (BlogPost $p) => $this->transformCardPost($p));

        return Inertia::render('Admin/Blog/Review', [
            'posts' => $posts,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', BlogPost::class);

        return Inertia::render('Admin/Blog/Edit', [
            'post' => null,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function store(StoreBlogPostRequest $request): RedirectResponse
    {
        $this->authorize('create', BlogPost::class);

        $data = $request->validated();
        $sanitised = $this->sanitizer->sanitize($data['body_html']);

        $post = new BlogPost([
            'title' => $data['title'],
            'excerpt' => $data['excerpt'] ?? Str::limit(strip_tags($sanitised['html']), 200),
            'body_html' => $sanitised['html'],
            'toc' => $sanitised['toc'],
            'blog_category_id' => $data['blog_category_id'] ?? null,
            'status' => $data['status'],
            'published_at' => $this->resolvePublishedAt($data),
            'reading_minutes' => $this->estimateReadingMinutes($sanitised['html']),
        ]);

        $post->user_id = $request->user()->id;
        $post->slug = BlogPost::generateUniqueSlug($data['title']);

        if ($post->status === BlogPost::STATUS_PUBLISHED) {
            $post->published_by_id = $request->user()->id;
        }

        $post->save();

        $this->audit->record('blog_post.created', $request->user(), $post, [
            'status' => $post->status,
        ]);

        return redirect()
            ->route('admin.blog-posts.edit', $post)
            ->with('status', 'Post created.');
    }

    public function edit(BlogPost $blogPost): Response
    {
        $this->authorize('update', $blogPost);

        $blogPost->loadMissing(['author:id,name', 'reviewer:id,name', 'publisher:id,name']);

        return Inertia::render('Admin/Blog/Edit', [
            'post' => [
                'id' => $blogPost->id,
                'slug' => $blogPost->slug,
                'title' => $blogPost->title,
                'excerpt' => $blogPost->excerpt,
                'body_html' => $blogPost->body_html,
                'status' => $blogPost->status,
                'published_at' => $blogPost->published_at?->toIso8601String(),
                'submitted_at' => $blogPost->submitted_at?->toIso8601String(),
                'reviewed_at' => $blogPost->reviewed_at?->toIso8601String(),
                'blog_category_id' => $blogPost->blog_category_id,
                'author' => $blogPost->author ? ['id' => $blogPost->author->id, 'name' => $blogPost->author->name] : null,
                'reviewer' => $blogPost->reviewer ? ['id' => $blogPost->reviewer->id, 'name' => $blogPost->reviewer->name] : null,
                'publisher' => $blogPost->publisher ? ['id' => $blogPost->publisher->id, 'name' => $blogPost->publisher->name] : null,
                'abilities' => [
                    'submit' => request()->user()?->can('submit', $blogPost) ?? false,
                    'approve' => request()->user()?->can('approve', $blogPost) ?? false,
                    'reject' => request()->user()?->can('reject', $blogPost) ?? false,
                    'publish' => request()->user()?->can('publish', $blogPost) ?? false,
                    'unpublish' => request()->user()?->can('unpublish', $blogPost) ?? false,
                    'delete' => request()->user()?->can('delete', $blogPost) ?? false,
                ],
            ],
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(UpdateBlogPostRequest $request, BlogPost $blogPost): RedirectResponse
    {
        $this->authorize('update', $blogPost);

        $data = $request->validated();

        if (array_key_exists('body_html', $data)) {
            $sanitised = $this->sanitizer->sanitize($data['body_html']);
            $blogPost->body_html = $sanitised['html'];
            $blogPost->toc = $sanitised['toc'];
            $blogPost->reading_minutes = $this->estimateReadingMinutes($sanitised['html']);
        }

        if (array_key_exists('title', $data) && $data['title'] !== $blogPost->title) {
            $blogPost->title = $data['title'];
            $blogPost->slug = BlogPost::generateUniqueSlug($data['title'], $blogPost->id);
        }

        if (array_key_exists('excerpt', $data)) {
            $blogPost->excerpt = $data['excerpt'];
        }

        if (array_key_exists('blog_category_id', $data)) {
            $blogPost->blog_category_id = $data['blog_category_id'];
        }

        $previousStatus = $blogPost->status;
        if (array_key_exists('status', $data)) {
            $blogPost->status = $data['status'];
        }

        $blogPost->published_at = $this->resolvePublishedAt($data, $blogPost);

        // If an editor directly flips status to published via the form (not
        // the dedicated publish action), still stamp who published it.
        if ($previousStatus !== BlogPost::STATUS_PUBLISHED && $blogPost->status === BlogPost::STATUS_PUBLISHED) {
            $blogPost->published_by_id = $request->user()->id;
        }

        $blogPost->save();

        $this->audit->record('blog_post.updated', $request->user(), $blogPost, [
            'changed_status' => $previousStatus !== $blogPost->status
                ? ['from' => $previousStatus, 'to' => $blogPost->status]
                : null,
        ]);

        return redirect()
            ->route('admin.blog-posts.edit', $blogPost)
            ->with('status', 'Post updated.');
    }

    public function destroy(Request $request, BlogPost $blogPost): RedirectResponse
    {
        $this->authorize('delete', $blogPost);

        $blogPost->delete();

        $this->audit->record('blog_post.deleted', $request->user(), $blogPost);

        return redirect()
            ->route('admin.blog-posts.index')
            ->with('status', 'Post deleted.');
    }

    /* ------------------------- workflow transitions ------------------------- */

    public function submit(Request $request, BlogPost $blogPost): RedirectResponse
    {
        $this->authorize('submit', $blogPost);

        $blogPost->forceFill([
            'status' => BlogPost::STATUS_PENDING_REVIEW,
            'submitted_at' => now(),
        ])->save();

        $this->audit->record('blog_post.submitted', $request->user(), $blogPost);

        return back()->with('status', 'Submitted for review.');
    }

    public function approve(Request $request, BlogPost $blogPost): RedirectResponse
    {
        $this->authorize('approve', $blogPost);

        // Approve does not publish — it just marks that an editor has
        // signed off. Flip to draft+reviewed_at so a writer could tweak
        // one more time if the editor leaves a comment out-of-band.
        $blogPost->forceFill([
            'status' => BlogPost::STATUS_DRAFT,
            'reviewed_at' => now(),
            'reviewer_id' => $request->user()->id,
        ])->save();

        $this->audit->record('blog_post.approved', $request->user(), $blogPost);

        return back()->with('status', 'Approved — ready to publish.');
    }

    public function reject(Request $request, BlogPost $blogPost): RedirectResponse
    {
        $this->authorize('reject', $blogPost);

        $blogPost->forceFill([
            'status' => BlogPost::STATUS_DRAFT,
            'reviewed_at' => now(),
            'reviewer_id' => $request->user()->id,
        ])->save();

        $this->audit->record('blog_post.rejected', $request->user(), $blogPost);

        return back()->with('status', 'Sent back to draft.');
    }

    public function publish(Request $request, BlogPost $blogPost): RedirectResponse
    {
        $this->authorize('publish', $blogPost);

        $blogPost->forceFill([
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => $blogPost->published_at ?? now(),
            'published_by_id' => $request->user()->id,
        ])->save();

        $this->audit->record('blog_post.published', $request->user(), $blogPost);

        return back()->with('status', 'Published.');
    }

    public function unpublish(Request $request, BlogPost $blogPost): RedirectResponse
    {
        $this->authorize('unpublish', $blogPost);

        $blogPost->forceFill([
            'status' => BlogPost::STATUS_DRAFT,
        ])->save();

        $this->audit->record('blog_post.unpublished', $request->user(), $blogPost);

        return back()->with('status', 'Unpublished — reverted to draft.');
    }

    /* --------------------------- private helpers --------------------------- */

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolvePublishedAt(array $data, ?BlogPost $existing = null): ?Carbon
    {
        if (array_key_exists('published_at', $data) && $data['published_at'] !== null) {
            return Carbon::parse($data['published_at']);
        }

        $status = $data['status'] ?? $existing?->status;
        $current = $existing?->published_at;

        if ($status === BlogPost::STATUS_PUBLISHED && $current === null) {
            return now();
        }

        return $current;
    }

    private function estimateReadingMinutes(string $html): int
    {
        $text = strip_tags($html);
        $words = preg_match_all('/\S+/u', $text, $m) ?: 0;

        return max(1, (int) round($words / 230));
    }

    /**
     * @return array<int, array{id:int,name:string,slug:string,accent:string}>
     */
    private function categoryOptions(): array
    {
        return BlogCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'accent'])
            ->toArray();
    }

    /**
     * @return array<string, mixed>
     */
    private function transformCardPost(BlogPost $p): array
    {
        return [
            'id' => $p->id,
            'slug' => $p->slug,
            'title' => $p->title,
            'status' => $p->status,
            'published_at' => $p->published_at?->toIso8601String(),
            'submitted_at' => $p->submitted_at?->toIso8601String(),
            'updated_at' => $p->updated_at?->toIso8601String(),
            'category' => $p->category ? [
                'slug' => $p->category->slug,
                'name' => $p->category->name,
                'accent' => $p->category->accent,
            ] : null,
            'author' => $p->author ? [
                'id' => $p->author->id,
                'name' => $p->author->name,
                'role' => (string) $p->author->role,
            ] : null,
        ];
    }
}
