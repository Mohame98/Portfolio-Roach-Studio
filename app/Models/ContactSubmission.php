<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $company
 * @property string $message
 * @property string $budget
 * @property string $timeline
 * @property string|null $locale
 * @property string|null $ip_hash
 * @property string|null $user_agent
 * @property string|null $cf_ray
 * @property string|null $cf_country
 * @property bool $mail_sent
 * @property Carbon|null $submitted_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class ContactSubmission extends Model
{
    protected $fillable = [
        'name',
        'email',
        'company',
        'message',
        'budget',
        'timeline',
        'locale',
        'ip_hash',
        'user_agent',
        'cf_ray',
        'cf_country',
        'mail_sent',
        'submitted_at',
    ];

    protected $casts = [
        'mail_sent' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    protected $hidden = [
        'ip_hash',
        'user_agent',
    ];
}
