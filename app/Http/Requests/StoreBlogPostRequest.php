<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\BlogPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Writers can create drafts (status=draft) — but cannot create posts in
 * any other state. The policy will reject anything else; this request
 * mirrors that in the validation layer so the user gets a friendly error
 * instead of a 403.
 */
class StoreBlogPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->isStaff();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user();
        // Writers may only create drafts. Editors may create in any state.
        $allowedStatuses = $user !== null && $user->isAdmin()
            ? [BlogPost::STATUS_DRAFT, BlogPost::STATUS_PUBLISHED]
            : [BlogPost::STATUS_DRAFT];

        return [
            'title' => ['required', 'string', 'max:180'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body_html' => ['required', 'string', 'max:120000'],
            'blog_category_id' => ['nullable', 'integer', 'exists:blog_categories,id'],
            'status' => ['required', Rule::in($allowedStatuses)],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
