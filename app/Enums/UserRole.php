<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The three roles an authenticated user can hold. Stored as a string on
 * users.role so extending this enum (e.g. adding a "guest author" role)
 * only touches the application layer, not the database schema.
 *
 * Ordering from least to most privileged:
 *   Writer  <  Admin  <  SuperAdmin
 *
 * Role capability is intentionally centralised here rather than spread
 * across policies — when a new role is added, there's exactly one list
 * that needs to learn about it.
 */
enum UserRole: string
{
    case Writer = 'writer';
    case Admin = 'admin';
    case SuperAdmin = 'super_admin';

    public function label(): string
    {
        return match ($this) {
            self::Writer => 'Writer',
            self::Admin => 'Editor',
            self::SuperAdmin => 'Super admin',
        };
    }

    /**
     * Plain-English description shown in role-picker UIs so a super admin
     * doesn't have to remember which role does what.
     */
    public function description(): string
    {
        return match ($this) {
            self::Writer => 'Can create drafts and submit them for review. Cannot publish.',
            self::Admin => 'Can publish, review drafts from writers, and manage categories.',
            self::SuperAdmin => 'Full access: manage users, invitations, and every post.',
        };
    }

    /**
     * Roles a super admin is allowed to assign through the admin UI. Mirrors
     * the enum cases exactly today — exists as its own method so later we
     * can hide a role (e.g. a seeded "owner" role) from the picker.
     *
     * @return list<self>
     */
    public static function assignable(): array
    {
        return [self::Writer, self::Admin, self::SuperAdmin];
    }
}
