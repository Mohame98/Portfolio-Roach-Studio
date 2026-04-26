<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\BlogCategoryController as AdminBlogCategoryController;
use App\Http\Controllers\Admin\BlogPostController as AdminBlogPostController;
use App\Http\Controllers\Admin\InvitationController as AdminInvitationController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\InvitationRegistrationController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\ContactController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Home'))->name('home');

Route::post('/api/contact', ContactController::class)
    ->middleware('throttle:contact')
    ->name('contact.store');

/*
|--------------------------------------------------------------------------
| Public blog
|--------------------------------------------------------------------------
*/
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{post}', [BlogController::class, 'show'])->name('blog.show');

/*
|--------------------------------------------------------------------------
| Invitation acceptance — the ONLY public account-creation entry point
|--------------------------------------------------------------------------
| Throttled because a leaked or guessed token attempt is a security event.
| The token itself is 256 bits of entropy so brute-forcing is infeasible,
| but the throttle keeps a buggy client from spamming the endpoint.
*/
Route::middleware('throttle:6,1')->group(function () {
    Route::get('/register/invite/{token}', [InvitationRegistrationController::class, 'show'])
        ->name('invitation.show');
    Route::post('/register/invite/{token}', [InvitationRegistrationController::class, 'store'])
        ->name('invitation.store');
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
| Stack: `auth` → `verified` → `role:...`. Each role layer narrows the gate:
|   /admin/blog-posts  any staff role (writers see only their own in the controller)
|   /admin/review      admin or super_admin only
|   /admin/categories  admin or super_admin only
|   /admin/users       super_admin only
|   /admin/invitations super_admin only
|   /admin/audit-log   super_admin only
*/
Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Any staff member: browse + manage their own posts.
        Route::middleware('role')->group(function () {
            Route::get('/', fn () => redirect()->route('admin.blog-posts.index'))->name('home');

            // Workflow transitions live as their own POST endpoints so each
            // action has a discoverable route name + dedicated audit entry.
            Route::post('blog-posts/{blogPost}/submit', [AdminBlogPostController::class, 'submit'])
                ->name('blog-posts.submit');

            Route::resource('blog-posts', AdminBlogPostController::class)->except(['show']);
        });

        // Editor or super admin: review queue, publish actions, categories.
        Route::middleware('role:admin,super_admin')->group(function () {
            Route::get('review', [AdminBlogPostController::class, 'reviewQueue'])->name('review');

            Route::post('blog-posts/{blogPost}/approve', [AdminBlogPostController::class, 'approve'])
                ->name('blog-posts.approve');
            Route::post('blog-posts/{blogPost}/reject', [AdminBlogPostController::class, 'reject'])
                ->name('blog-posts.reject');
            Route::post('blog-posts/{blogPost}/publish', [AdminBlogPostController::class, 'publish'])
                ->name('blog-posts.publish');
            Route::post('blog-posts/{blogPost}/unpublish', [AdminBlogPostController::class, 'unpublish'])
                ->name('blog-posts.unpublish');

            Route::get('categories', [AdminBlogCategoryController::class, 'index'])->name('categories.index');
            Route::post('categories', [AdminBlogCategoryController::class, 'store'])->name('categories.store');
            Route::put('categories/{category}', [AdminBlogCategoryController::class, 'update'])->name('categories.update');
            Route::delete('categories/{category}', [AdminBlogCategoryController::class, 'destroy'])->name('categories.destroy');
        });

        // Super admin only: users, invitations, audit log.
        Route::middleware('role:super_admin')->group(function () {
            Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
            Route::put('users/{user}', [AdminUserController::class, 'update'])->name('users.update');
            Route::post('users/{user}/disable', [AdminUserController::class, 'disable'])->name('users.disable');
            Route::post('users/{user}/enable', [AdminUserController::class, 'enable'])->name('users.enable');
            Route::delete('users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
            Route::post('users/{id}/restore', [AdminUserController::class, 'restore'])->name('users.restore');

            Route::get('invitations', [AdminInvitationController::class, 'index'])->name('invitations.index');
            Route::post('invitations', [AdminInvitationController::class, 'store'])->name('invitations.store');
            Route::delete('invitations/{invitation}', [AdminInvitationController::class, 'destroy'])->name('invitations.destroy');

            Route::get('audit-log', [AuditLogController::class, 'index'])->name('audit.index');
        });
    });
