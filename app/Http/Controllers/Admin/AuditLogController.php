<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only audit log viewer. Super-admin only (route middleware).
 *
 * The page is paginated and supports a simple action filter. No write
 * endpoints exist — audit_logs rows are immutable by design.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'action' => ['nullable', 'string', 'max:64'],
            'user_id' => ['nullable', 'integer'],
        ]);

        $logs = AuditLog::query()
            ->with('actor:id,name,email,role')
            ->when($filters['action'] ?? null, fn ($q, $a) => $q->where('action', $a))
            ->when($filters['user_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'auditable_type' => $log->auditable_type,
                'auditable_id' => $log->auditable_id,
                'metadata' => $log->metadata,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toIso8601String(),
                'actor' => $log->actor ? [
                    'id' => $log->actor->id,
                    'name' => $log->actor->name,
                    'email' => $log->actor->email,
                    'role' => (string) $log->actor->role,
                ] : null,
            ]);

        // Small cap on distinct action values so the filter dropdown stays
        // snappy. If an admin ever creates 500 distinct action names
        // through custom code, they'll want to rework the filter anyway.
        $actions = AuditLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->limit(100)
            ->pluck('action');

        return Inertia::render('Admin/Audit/Index', [
            'logs' => $logs,
            'actions' => $actions,
            'filters' => $filters,
        ]);
    }
}
