<?php

declare(strict_types=1);

namespace App\Models;

/**
 * Central definition of the three roles the app ships with. Kept as string
 * constants on a PHP class (rather than a DB enum or Spatie package) because
 * the permission surface is small and static — every check goes through the
 * relevant policy method, not a generic hasPermission() lookup.
 *
 * Ordering (writer < admin < super_admin) matters for `isAtLeast()`, which
 * a handful of policies use instead of listing all eligible roles.
 */
final class Role
{
    public const WRITER = 'writer';
    public const ADMIN = 'admin';
    public const SUPER_ADMIN = 'super_admin';

    /** @var array<string, int> */
    private const WEIGHT = [
        self::WRITER => 1,
        self::ADMIN => 2,
        self::SUPER_ADMIN => 3,
    ];

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [self::WRITER, self::ADMIN, self::SUPER_ADMIN];
    }

    /**
     * Roles a super admin is allowed to assign through the admin UI.
     *
     * @return list<string>
     */
    public static function assignable(): array
    {
        return [self::WRITER, self::ADMIN, self::SUPER_ADMIN];
    }

    public static function isValid(string $role): bool
    {
        return in_array($role, self::all(), true);
    }

    public static function weight(string $role): int
    {
        return self::WEIGHT[$role] ?? 0;
    }

    public static function isAtLeast(string $role, string $minimum): bool
    {
        return self::weight($role) >= self::weight($minimum);
    }

    public static function label(string $role): string
    {
        return match ($role) {
            self::WRITER => 'Writer',
            self::ADMIN => 'Admin',
            self::SUPER_ADMIN => 'Super admin',
            default => $role,
        };
    }
}
