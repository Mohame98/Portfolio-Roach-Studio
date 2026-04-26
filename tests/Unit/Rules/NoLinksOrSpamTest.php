<?php

declare(strict_types=1);

namespace Tests\Unit\Rules;

use App\Rules\NoLinksOrSpam;
use PHPUnit\Framework\TestCase;

class NoLinksOrSpamTest extends TestCase
{
    private function validate(mixed $value): ?string
    {
        $rule = new NoLinksOrSpam;
        $failure = null;

        $rule->validate('message', $value, function (string $message) use (&$failure): void {
            $failure = $message;
        });

        return $failure;
    }

    public function test_passes_on_clean_message(): void
    {
        $this->assertNull($this->validate('Hello, this is a normal inquiry from a real person.'));
    }

    public function test_passes_on_message_with_one_link(): void
    {
        $this->assertNull($this->validate('Here is my portfolio: https://example.com — looking forward.'));
    }

    public function test_passes_on_message_with_three_links(): void
    {
        $this->assertNull($this->validate(
            'Links: https://a.com https://b.com https://c.com — please take a look.'
        ));
    }

    public function test_fails_on_four_or_more_links(): void
    {
        $failure = $this->validate(
            'Links: https://a.com https://b.com https://c.com https://d.com.'
        );

        $this->assertNotNull($failure);
        $this->assertStringContainsString('too many links', $failure);
    }

    public function test_fails_on_bbcode_url(): void
    {
        $failure = $this->validate('Check [url=http://spam.example]here[/url] please.');

        $this->assertNotNull($failure);
        $this->assertStringContainsString('disallowed markup', $failure);
    }

    public function test_fails_on_self_closing_bbcode_url(): void
    {
        $this->assertNotNull($this->validate('[url]http://spam.example[/url]'));
    }

    public function test_fails_on_long_repeated_characters(): void
    {
        $failure = $this->validate('Hello '.str_repeat('x', 35).' end.');

        $this->assertNotNull($failure);
        $this->assertStringContainsString('looks like spam', $failure);
    }

    public function test_ignores_non_string_values(): void
    {
        $this->assertNull($this->validate(null));
        $this->assertNull($this->validate(123));
        $this->assertNull($this->validate([]));
    }

    public function test_uppercase_protocol_still_counted(): void
    {
        $failure = $this->validate(
            'HTTPS://a.com HTTP://b.com https://c.com HTTPS://d.com.'
        );

        $this->assertNotNull($failure);
    }
}
