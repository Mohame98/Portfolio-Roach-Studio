<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Symfony\Component\Mailer\Exception\TransportException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Cloudflare fronts the site in production. Trust its proxy headers
        // so Request::ip() returns the real client IP for rate limiting.
        $middleware->trustProxies(
            at: env('TRUSTED_PROXIES', '*'),
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Role-based gates for /admin/*. Usage in routes:
        //   middleware('role')                   - any authenticated staff member
        //   middleware('role:admin,super_admin') - admin or super admin
        //   middleware('role:super_admin')       - super admin only
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Mail transport failures (SMTP unreachable, auth refused, etc.)
        // should be visible to Inertia forms. Adding a validation error lets
        // the client run its onError path, while the flash supports global toasts.
        // The framework still reports the underlying exception through its default channels.
        $exceptions->render(function (TransportException $e, Request $request) {
            $message = 'We could not connect to the mail server, so no reset email was sent. Please try again after checking the mail settings.';

            return back()
                ->withInput($request->except('password', 'password_confirmation'))
                ->withErrors(['email' => $message])
                ->with('error', $message);
        });
    })->create();
