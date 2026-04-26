<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Reject messages with more than a few links or obvious spam signals.
 *
 * Legitimate inquiries may include one or two links (portfolio, GitHub);
 * four or more, or long walls of non-breaking characters, are near-exclusively
 * scraper/spammer traffic. Keep this conservative — front-line protection is
 * Turnstile; this is defense-in-depth.
 */
class NoLinksOrSpam implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $linkCount = preg_match_all('~https?://~i', $value);
        if ($linkCount >= 4) {
            $fail('The :attribute contains too many links.');

            return;
        }

        $bbcodeCount = preg_match_all('~\[url[=\]]~i', $value);
        if ($bbcodeCount > 0) {
            $fail('The :attribute contains disallowed markup.');

            return;
        }

        if (preg_match('~(.)\1{30,}~u', $value)) {
            $fail('The :attribute looks like spam.');
        }
    }
}
