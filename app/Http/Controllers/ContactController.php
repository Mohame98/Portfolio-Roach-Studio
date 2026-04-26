<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\SubmitContactForm;
use App\Http\Requests\StoreContactRequest;
use App\Services\TurnstileVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function __invoke(
        StoreContactRequest $request,
        TurnstileVerifier $turnstile,
        SubmitContactForm $submit,
    ): JsonResponse {
        $ok = $turnstile->verify(
            $request->string('turnstile_token')->toString(),
            $request->ip(),
        );

        if (! $ok) {
            return response()->json([
                'ok' => false,
                'errors' => [[
                    'field' => 'form',
                    'message' => 'Bot check failed. Please refresh the page and try again.',
                ]],
            ], 422);
        }

        try {
            $submission = $submit->execute($request->validated(), $request);
        } catch (\Throwable $e) {
            Log::error('Contact submission failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'message' => 'Something went wrong sending your message. Please try again shortly.',
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'id' => $submission->id,
        ], 201);
    }
}
