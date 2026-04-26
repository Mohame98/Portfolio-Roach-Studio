<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\NoLinksOrSpam;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
{
    /** @var list<string> */
    private const BUDGETS = [
        'under-2k', '2k-5k', '5k-10k', '10k-25k', '25k-plus', 'not-sure',
    ];

    /** @var list<string> */
    private const TIMELINES = [
        'asap', '1-month', '1-3-months', '3-plus-months', 'flexible',
    ];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['required', 'string', 'email:rfc,strict', 'max:160'],
            'company' => ['nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'min:20', 'max:4000', new NoLinksOrSpam],
            'budget' => ['required', 'string', Rule::in(self::BUDGETS)],
            'timeline' => ['required', 'string', Rule::in(self::TIMELINES)],
            'locale' => ['nullable', 'string', 'max:16'],
            'submitted_at' => ['nullable', 'string', 'max:40'],

            // Honeypot — must be empty. Bots happily fill every visible field.
            'website' => ['present', 'string', 'max:0'],

            // Cloudflare Turnstile token (required in non-local env; see authorize flow).
            'turnstile_token' => ['nullable', 'string', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'website.max' => 'Spam detected.',
            'website.present' => 'Spam detected.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // ConvertEmptyStringsToNull middleware turns "" into null before
        // validation. For the honeypot we need to tell "key missing" apart from
        // "bot filled it with text", so restore empty strings explicitly.
        $this->merge([
            'name' => $this->cleanString($this->input('name')),
            'email' => $this->cleanString($this->input('email')),
            'company' => $this->cleanString($this->input('company')),
            'message' => $this->cleanString($this->input('message'), preserveNewlines: true),
            'website' => (string) ($this->input('website') ?? ''),
            'turnstile_token' => (string) ($this->input('turnstile_token') ?? ''),
        ]);
    }

    /**
     * Return validation errors in the { ok, errors: [{field, message}] } shape
     * the SPA expects.
     */
    protected function failedValidation(Validator $validator): void
    {
        $errors = [];
        foreach ($validator->errors()->messages() as $field => $messages) {
            foreach ($messages as $message) {
                $errors[] = ['field' => $field, 'message' => $message];
            }
        }

        throw new HttpResponseException(
            response()->json([
                'ok' => false,
                'errors' => $errors,
            ], 422)
        );
    }

    private function cleanString(mixed $value, bool $preserveNewlines = false): ?string
    {
        if (! is_string($value)) {
            return $value === null ? null : '';
        }

        $value = str_replace("\0", '', $value);
        $value = preg_replace(
            $preserveNewlines ? '/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/u' : '/[\x00-\x1F\x7F]/u',
            '',
            $value,
        ) ?? '';

        return trim($value);
    }
}
