<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Verifies Cloudflare Turnstile tokens server-side.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Verification is enforced only when a secret is configured. Set
 * `TURNSTILE_ENFORCE=true` to refuse submissions when the secret is missing —
 * recommended in production so a misconfiguration cannot silently disable
 * bot protection. Locally, the widget can be left unconfigured for easier
 * end-to-end testing.
 */
class TurnstileVerifier
{
    private const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function verify(?string $token, ?string $remoteIp): bool
    {
        $secret = (string) config('services.turnstile.secret', '');

        if ($secret === '') {
            return ! (bool) config('services.turnstile.enforce', false);
        }

        if (! is_string($token) || $token === '') {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(5)
                ->connectTimeout(3)
                ->retry(1, 250)
                ->post(self::ENDPOINT, array_filter([
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $remoteIp,
                ]));
        } catch (\Throwable $e) {
            Log::warning('Turnstile verify request failed', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        if (! $response->successful()) {
            Log::warning('Turnstile verify non-2xx response', [
                'status' => $response->status(),
            ]);

            return false;
        }

        $data = $response->json();
        $ok = is_array($data) && ($data['success'] ?? false) === true;

        if (! $ok) {
            Log::info('Turnstile rejected token', [
                'errors' => $data['error-codes'] ?? null,
            ]);
        }

        return $ok;
    }
}
