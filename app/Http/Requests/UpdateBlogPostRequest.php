<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\BlogPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Updates are authorized per-post in the controller via $this->authorize().
 * This request just gates "is the user authenticated staff" at the
 * validation layer and enforces which statuses a user can target.
 */
class UpdateBlogPostRequest extends FormRequest
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
        // Writers cannot flip a post to `published` through the generic
        // update endpoint. Use the dedicated `publish` action instead.
        $allowedStatuses = $user !== null && $user->isAdmin()
            ? BlogPost::statuses()
            : [BlogPost::STATUS_DRAFT, BlogPost::STATUS_PENDING_REVIEW];

        return [
            'title' => ['sometimes', 'required', 'string', 'max:180'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body_html' => ['sometimes', 'required', 'string', 'max:120000'],
            'blog_category_id' => ['nullable', 'integer', 'exists:blog_categories,id'],
            'status' => ['sometimes', 'required', Rule::in($allowedStatuses)],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
