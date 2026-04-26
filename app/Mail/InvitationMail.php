<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Invitation;
use App\Models\Role;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The single email a new user ever receives from the system before they
 * have an account: a one-time accept link.
 *
 * The plain token is never stored — it lives on this mailable instance
 * just long enough to be rendered into the email body.
 */
class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invitation $invitation,
        public string $acceptUrl,
    ) {}

    public function envelope(): Envelope
    {
        $appName = config('app.name', 'Site');

        return new Envelope(
            subject: "You're invited to {$appName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invitation',
            with: [
                'roleLabel' => Role::label($this->invitation->role),
                'acceptUrl' => $this->acceptUrl,
                'expiresAt' => $this->invitation->expires_at,
            ],
        );
    }
}
