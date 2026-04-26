<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Super admin updating a user — currently only name + role. Email stays
 * on the user's own profile flow (Fortify) so we don't ship a back-door
 * for changing someone's email without their consent.
 */
class UpdateUserRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:180'],
            'role' => ['sometimes', 'required', Rule::in(Role::assignable())],
        ];
    }
}
