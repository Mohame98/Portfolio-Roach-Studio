<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Thin recorder for the audit_logs table.
 *
 * Every privileged admin write should call AuditLogger::record() — the
 * point is an append-only trail of who did what, when, and from where.
 * Deliberately does not throw: an audit-log write must never block the
 * real action. Failures are swallowed and logged via the framework logger
 * instead.
 */
class AuditLogger
{
    public function __construct(private readonly Request $request) {}

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(
        string $action,
        ?User $actor,
        ?Model $target = null,
        array $metadata = [],
    ): void {
        try {
            AuditLog::create([
                'user_id' => $actor?->id,
                'action' => $action,
                'auditable_type' => $target !== null ? $target::class : null,
                'auditable_id' => $target?->getKey(),
                'metadata' => $metadata,
                'ip_address' => $this->request->ip(),
                'user_agent' => mb_substr((string) $this->request->userAgent(), 0, 1000),
            ]);
        } catch (\Throwable $e) {
            // Log and swallow. An audit-log failure must never cascade into
            // the caller's transaction.
            report($e);
        }
    }
}
