<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'turnstile' => [
                'site_key' => config('services.turnstile.site_key'),
            ],
            // Auth payload — minimal user object plus pre-computed
            // capability flags so the client can hide UI it can't use
            // without re-deriving the rules. Server still authoritatively
            // enforces every action; these are display hints.
            'auth' => [
                'user' => function () use ($request) {
                    $user = $request->user();

                    if ($user === null) {
                        return null;
                    }

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => (string) $user->role,
                        'role_label' => Role::label((string) $user->role),
                        'is_writer' => $user->isWriter(),
                        'is_admin' => $user->isAdmin(),
                        'is_super_admin' => $user->isSuperAdmin(),
                        'disabled_at' => $user->disabled_at?->toIso8601String(),
                    ];
                },
            ],
            // Laravel's session flash bag, surfaced as simple strings.
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
