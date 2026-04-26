<?php

declare(strict_types=1);

namespace Tests\Feature\Contact;

use App\Mail\ContactSubmissionMail;
use App\Models\ContactSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ContactControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Clear the rate limiter so tests don't trip 3-per-minute cap.
        RateLimiter::clear('contact:ip:127.0.0.1');
        RateLimiter::clear('contact:ip-hour:127.0.0.1');
        RateLimiter::clear('contact:global');

        // Default config: turnstile off, owner email set.
        config()->set('services.turnstile.secret', '');
        config()->set('services.turnstile.enforce', false);
        config()->set('services.contact.owner_email', 'owner@example.com');
        config()->set('services.contact.owner_name', 'Owner');

        Mail::fake();
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jane Tester',
            'email' => 'jane@example.com',
            'company' => 'Acme Co',
            'message' => 'Hello, I would like to hire you for a project that is real and substantive.',
            'budget' => '5k-10k',
            'timeline' => '1-month',
            'locale' => 'en-CA',
            'submitted_at' => '2026-04-22T12:00:00Z',
            'website' => '',
            'turnstile_token' => '',
        ], $overrides);
    }

    public function test_valid_submission_is_persisted_and_returns_201(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload());

        $response->assertStatus(201)
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['ok', 'id']);

        $this->assertDatabaseCount('contact_submissions', 1);

        $submission = ContactSubmission::first();
        $this->assertSame('Jane Tester', $submission->name);
        $this->assertSame('jane@example.com', $submission->email);
        $this->assertSame('Acme Co', $submission->company);
        $this->assertSame('5k-10k', $submission->budget);
        $this->assertSame('1-month', $submission->timeline);
        $this->assertSame('en-CA', $submission->locale);
        $this->assertTrue($submission->mail_sent);
        $this->assertNotNull($submission->ip_hash);
        $this->assertNotNull($submission->submitted_at);
    }

    public function test_owner_email_is_dispatched_on_success(): void
    {
        $this->postJson('/api/contact', $this->validPayload())->assertStatus(201);

        Mail::assertSent(ContactSubmissionMail::class, function (ContactSubmissionMail $mail) {
            return $mail->hasTo('owner@example.com');
        });
    }

    public function test_email_is_lowercased_before_persisting(): void
    {
        $this->postJson('/api/contact', $this->validPayload([
            'email' => 'MixedCase@Example.COM',
        ]))->assertStatus(201);

        $this->assertSame('mixedcase@example.com', ContactSubmission::first()->email);
    }

    public function test_empty_company_is_stored_as_null(): void
    {
        $this->postJson('/api/contact', $this->validPayload([
            'company' => '',
        ]))->assertStatus(201);

        $this->assertNull(ContactSubmission::first()->company);
    }

    public function test_submission_is_saved_even_when_owner_email_not_configured(): void
    {
        config()->set('services.contact.owner_email', '');

        $this->postJson('/api/contact', $this->validPayload())->assertStatus(201);

        $this->assertDatabaseCount('contact_submissions', 1);
        $this->assertFalse(ContactSubmission::first()->mail_sent);
        Mail::assertNothingSent();
    }

    public function test_missing_name_returns_422_with_structured_error(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'name' => '',
        ]));

        $response->assertStatus(422)
            ->assertJson(['ok' => false])
            ->assertJsonPath('errors.0.field', 'name');

        $this->assertDatabaseCount('contact_submissions', 0);
        Mail::assertNothingSent();
    }

    /**
     * @return array<string, array{array<string, mixed>, string}>
     */
    public static function invalidFieldProvider(): array
    {
        return [
            'name too short' => [['name' => 'J'], 'name'],
            'name missing' => [['name' => ''], 'name'],
            'email missing' => [['email' => ''], 'email'],
            'email malformed' => [['email' => 'not-an-email'], 'email'],
            'message too short' => [['message' => 'hi there'], 'message'],
            'message missing' => [['message' => ''], 'message'],
            'budget missing' => [['budget' => ''], 'budget'],
            'budget not in list' => [['budget' => '100k-plus'], 'budget'],
            'timeline missing' => [['timeline' => ''], 'timeline'],
            'timeline not in list' => [['timeline' => 'next-year'], 'timeline'],
        ];
    }

    #[DataProvider('invalidFieldProvider')]
    public function test_invalid_field_is_rejected(array $override, string $expectedField): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload($override));

        $response->assertStatus(422)->assertJson(['ok' => false]);

        $fields = collect($response->json('errors'))->pluck('field')->all();
        $this->assertContains($expectedField, $fields);
        $this->assertDatabaseCount('contact_submissions', 0);
    }

    public function test_honeypot_field_rejects_submission(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'website' => 'http://spammer.example',
        ]));

        $response->assertStatus(422)->assertJson(['ok' => false]);
        $this->assertDatabaseCount('contact_submissions', 0);
    }

    public function test_message_with_four_links_is_rejected_as_spam(): void
    {
        $message = 'Check these links http://a.com http://b.com http://c.com http://d.com please respond thanks.';

        $response = $this->postJson('/api/contact', $this->validPayload([
            'message' => $message,
        ]));

        $response->assertStatus(422);
        $fields = collect($response->json('errors'))->pluck('field')->all();
        $this->assertContains('message', $fields);
    }

    public function test_message_with_bbcode_is_rejected_as_spam(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'message' => 'Hi please visit [url=http://spam.example]my site[/url] thanks very much indeed.',
        ]));

        $response->assertStatus(422);
    }

    public function test_message_with_long_repeated_chars_is_rejected(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'message' => 'Hi there '.str_repeat('a', 35).' please respond thanks much.',
        ]));

        $response->assertStatus(422);
    }

    public function test_turnstile_verifies_with_cloudflare_when_secret_configured(): void
    {
        config()->set('services.turnstile.secret', 'test-secret');

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => true], 200),
        ]);

        $response = $this->postJson('/api/contact', $this->validPayload([
            'turnstile_token' => 'valid-token-abc',
        ]));

        $response->assertStatus(201);
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'challenges.cloudflare.com')
                && $request['response'] === 'valid-token-abc'
                && $request['secret'] === 'test-secret';
        });
    }

    public function test_turnstile_rejection_returns_form_level_error(): void
    {
        config()->set('services.turnstile.secret', 'test-secret');

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => false, 'error-codes' => ['invalid-input-response']], 200),
        ]);

        $response = $this->postJson('/api/contact', $this->validPayload([
            'turnstile_token' => 'bad-token',
        ]));

        $response->assertStatus(422)
            ->assertJson(['ok' => false])
            ->assertJsonPath('errors.0.field', 'form');

        $this->assertDatabaseCount('contact_submissions', 0);
        Mail::assertNothingSent();
    }

    public function test_turnstile_rejects_empty_token_when_secret_configured(): void
    {
        config()->set('services.turnstile.secret', 'test-secret');

        $response = $this->postJson('/api/contact', $this->validPayload([
            'turnstile_token' => '',
        ]));

        $response->assertStatus(422)
            ->assertJsonPath('errors.0.field', 'form');
    }

    public function test_turnstile_skipped_when_not_configured_and_not_enforced(): void
    {
        config()->set('services.turnstile.secret', '');
        config()->set('services.turnstile.enforce', false);

        $this->postJson('/api/contact', $this->validPayload())->assertStatus(201);
    }

    public function test_turnstile_enforced_blocks_when_secret_missing(): void
    {
        config()->set('services.turnstile.secret', '');
        config()->set('services.turnstile.enforce', true);

        $this->postJson('/api/contact', $this->validPayload())
            ->assertStatus(422)
            ->assertJsonPath('errors.0.field', 'form');
    }

    public function test_rate_limit_after_three_submissions_in_a_minute(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/contact', $this->validPayload([
                'email' => "burst{$i}@example.com",
            ]))->assertStatus(201);
        }

        $this->postJson('/api/contact', $this->validPayload([
            'email' => 'burst4@example.com',
        ]))->assertStatus(429)->assertJson(['ok' => false]);
    }

    public function test_ip_is_hashed_not_stored_plain(): void
    {
        $this->postJson('/api/contact', $this->validPayload())->assertStatus(201);

        $submission = ContactSubmission::first();
        $this->assertNotNull($submission->ip_hash);
        $this->assertNotSame('127.0.0.1', $submission->ip_hash);
        $this->assertSame(64, strlen($submission->ip_hash));
    }

    public function test_locale_falls_back_to_accept_language_header(): void
    {
        $payload = $this->validPayload();
        unset($payload['locale']);

        $this->withHeaders(['Accept-Language' => 'fr-CA,fr;q=0.9'])
            ->postJson('/api/contact', $payload)
            ->assertStatus(201);

        $this->assertStringStartsWith('fr-CA', (string) ContactSubmission::first()->locale);
    }

    public function test_name_longer_than_80_chars_is_rejected(): void
    {
        $this->postJson('/api/contact', $this->validPayload([
            'name' => str_repeat('A', 81),
        ]))->assertStatus(422);
    }

    public function test_message_longer_than_4000_chars_is_rejected(): void
    {
        $this->postJson('/api/contact', $this->validPayload([
            'message' => str_repeat('a longer sentence. ', 250),
        ]))->assertStatus(422);
    }
}
