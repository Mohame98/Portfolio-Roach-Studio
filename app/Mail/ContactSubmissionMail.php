<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\ContactSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Queued so Gmail SMTP's 2–30s handshake never blocks the HTTP response. The
 * `database` queue driver keeps jobs durable across restarts — run one
 * `php artisan queue:work` process (or a scheduled `queue:work --once`) to
 * flush. Jobs retry up to `tries` times before landing in `failed_jobs`.
 */
class ContactSubmissionMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /** Fail fast rather than blocking the worker on a stuck SMTP socket. */
    public int $timeout = 30;

    public int $tries = 3;

    public function __construct(public readonly ContactSubmission $submission) {}

    public function envelope(): Envelope
    {
        $subject = sprintf(
            '[Portfolio] New inquiry from %s — %s',
            $this->submission->name,
            $this->budgetLabel($this->submission->budget),
        );

        return new Envelope(
            subject: $subject,
            replyTo: [new Address($this->submission->email, $this->submission->name)],
            tags: ['contact-form'],
            metadata: ['submission_id' => (string) $this->submission->id],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.contact-submission',
            text: 'mail.contact-submission-text',
            with: [
                'submission' => $this->submission,
                'budgetLabel' => $this->budgetLabel($this->submission->budget),
                'timelineLabel' => $this->timelineLabel($this->submission->timeline),
            ],
        );
    }

    private function budgetLabel(string $value): string
    {
        return match ($value) {
            'under-2k' => 'Under $2,000',
            '2k-5k' => '$2,000 – $5,000',
            '5k-10k' => '$5,000 – $10,000',
            '10k-25k' => '$10,000 – $25,000',
            '25k-plus' => '$25,000+',
            default => 'Not specified',
        };
    }

    private function timelineLabel(string $value): string
    {
        return match ($value) {
            'asap' => 'ASAP',
            '1-month' => 'Within 1 month',
            '1-3-months' => '1 – 3 months',
            '3-plus-months' => '3+ months',
            default => 'Flexible',
        };
    }
}
