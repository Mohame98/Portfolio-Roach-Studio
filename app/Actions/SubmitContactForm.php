<?php

declare(strict_types=1);

namespace App\Actions;

use App\Mail\ContactSubmissionMail;
use App\Models\ContactSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Persist a contact submission and dispatch the owner-notification email.
 *
 * Kept intentionally thin — Turnstile verification and validation happen
 * upstream in the request pipeline. This action is the place where the
 * submission becomes durable state.
 */
class SubmitContactForm
{
    /**
     * @param  array<string, mixed>  $data  Validated request data.
     */
    public function execute(array $data, Request $request): ContactSubmission
    {
        return DB::transaction(function () use ($data, $request): ContactSubmission {
            $submission = ContactSubmission::create([
                'name' => (string) $data['name'],
                'email' => Str::lower((string) $data['email']),
                'company' => isset($data['company']) && $data['company'] !== ''
                    ? (string) $data['company']
                    : null,
                'message' => (string) $data['message'],
                'budget' => (string) $data['budget'],
                'timeline' => (string) $data['timeline'],
                'locale' => $this->truncate($data['locale'] ?? $request->header('Accept-Language'), 16),
                'ip_hash' => $this->hashIp((string) ($request->ip() ?? '')),
                'user_agent' => $this->truncate($request->userAgent(), 512),
                'cf_ray' => $this->truncate($request->header('CF-Ray'), 64),
                'cf_country' => $this->truncate($request->header('CF-IPCountry'), 8),
                'submitted_at' => Carbon::now(),
                'mail_sent' => false,
            ]);

            $ownerEmail = (string) config('services.contact.owner_email', '');
            if ($ownerEmail === '') {
                Log::warning('Contact submission saved but no owner email configured', [
                    'submission_id' => $submission->id,
                ]);

                return $submission;
            }

            // Queue (don't send) — Gmail SMTP can take 2–30s and must not
            // block the HTTP response. The `mail_sent` flag is left false
            // here; the queue worker flips it after successful delivery via
            // `MarkContactSubmissionMailed` (wired in an `$afterCommit`
            // listener on the Mailable if needed). For now it's just a best-
            // effort flag — the persisted row is the source of truth.
            Mail::to($ownerEmail, (string) config('services.contact.owner_name'))
                ->queue(new ContactSubmissionMail($submission));

            return $submission;
        });
    }

    private function hashIp(string $ip): ?string
    {
        if ($ip === '') {
            return null;
        }

        // App key is already stable + secret; good salt for a non-reversible hash.
        return hash_hmac('sha256', $ip, (string) config('app.key'));
    }

    private function truncate(mixed $value, int $max): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        return mb_substr($value, 0, $max);
    }
}
