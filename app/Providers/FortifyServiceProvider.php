<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

/**
 * Wires Fortify up to the Inertia layer + locks down the auth surface.
 *
 * Public registration is disabled — the only way to create an account is
 * through an invitation link (see Auth\InvitationRegistrationController).
 *
 * Fortify provides:
 *   - login + logout
 *   - password reset
 *   - email verification (already done at invite-accept time, but still
 *     wired so reverification works after an email change)
 *   - 2FA (optional per-user, recommended for admins)
 */
class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        Fortify::loginView(fn () => Inertia::render('Auth/Login', [
            'status' => session('status'),
        ]));

        Fortify::requestPasswordResetLinkView(fn () => Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]));

        // Token comes from the email link path; email is appended as a query
        // string by the password broker. Both are forwarded to the Inertia
        // page so the form can submit them back to POST /reset-password.
        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('Auth/ResetPassword', [
            'token' => $request->route('token'),
            'email' => $request->query('email', ''),
        ]));

        // Disabled accounts must not be able to authenticate. Fortify's
        // default authentication callback returns the user iff the
        // password matches; layering an isDisabled() check here makes the
        // failure look identical to a wrong-password attempt — no
        // information leak about which accounts are deactivated.
        Fortify::authenticateUsing(function (Request $request) {
            $email = mb_strtolower((string) $request->input(Fortify::username()));
            $user = User::query()->where('email', $email)->first();

            if ($user === null || $user->isDisabled()) {
                return null;
            }

            if (! Hash::check((string) $request->input('password'), $user->password)) {
                return null;
            }

            return $user;
        });

        // Rate-limit login attempts per IP+email and globally per IP.
        // Stops credential-stuffing from grinding through a leaked list.
        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input(Fortify::username());
            $ip = $request->ip() ?? '0.0.0.0';

            return [
                Limit::perMinute(5)->by(Str::transliterate(Str::lower($email).'|'.$ip)),
                Limit::perMinute(20)->by($ip),
            ];
        });

        RateLimiter::for('two-factor', fn (Request $request) => Limit::perMinute(5)->by(
            $request->session()->get('login.id'),
        ));
    }
}

