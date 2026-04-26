<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\Invitation;
use App\Models\User;
use App\Policies\BlogCategoryPolicy;
use App\Policies\BlogPostPolicy;
use App\Policies\InvitationPolicy;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Policies registered explicitly so reorganising the App\Policies
     * namespace later doesn't silently turn off authorization.
     *
     * @var array<class-string, class-string>
     */
    private array $policies = [
        BlogPost::class => BlogPostPolicy::class,
        BlogCategory::class => BlogCategoryPolicy::class,
        User::class => UserPolicy::class,
        Invitation::class => InvitationPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('contact', function (Request $request) {
            $ip = $request->ip() ?? '0.0.0.0';

            return [
                Limit::perMinute(3)->by('contact:ip:'.$ip)
                    ->response(fn () => response()->json([
                        'ok' => false,
                        'message' => 'Too many submissions. Please wait a minute and try again.',
                    ], 429)),

                Limit::perHour(10)->by('contact:ip-hour:'.$ip)
                    ->response(fn () => response()->json([
                        'ok' => false,
                        'message' => 'Hourly submission limit reached. Please try again later.',
                    ], 429)),

                Limit::perHour(100)->by('contact:global')
                    ->response(fn () => response()->json([
                        'ok' => false,
                        'message' => 'Service is busy. Please try again shortly.',
                    ], 429)),
            ];
        });
    }
}
