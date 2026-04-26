<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Invitation;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->isSuperAdmin();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:254'],
            'role' => ['required', Rule::in(Role::assignable())],
            // Match the manager's clamp — 1h to 14 days.
            'ttl_hours' => ['nullable', 'integer', 'min:1', 'max:336'],
        ];
    }

    /**
     * Reject when there's already a pending invite OR an existing non-deleted
     * user with this email. We do this in withValidator() so both the UI and
     * the policy-layer see the same message.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $email = mb_strtolower((string) $this->input('email'));

            if ($email === '') {
                return;
            }

            $activeInvite = Invitation::query()
                ->where('email', $email)
                ->active()
                ->exists();

            if ($activeInvite) {
                $v->errors()->add('email', 'An active invitation already exists for this email.');
            }

            $existingUser = \App\Models\User::query()
                ->where('email', $email)
                ->exists();

            if ($existingUser) {
                $v->errors()->add('email', 'A user with this email already exists.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }
}
