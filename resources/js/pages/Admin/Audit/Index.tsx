import { Head, Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import type { Paginator, UserRole } from '@/types';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import styles from './Index.module.css';

interface AuditRow {
  id: number;
  action: string;
  auditable_type: string | null;
  auditable_id: number | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | null;
  actor: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

interface AuditIndexProps {
  logs: Paginator<AuditRow>;
  actions: string[];
  filters: { action?: string | null; user_id?: number | null };
}

export default function AuditIndex({ logs, actions, filters }: AuditIndexProps) {
  const [action, setAction] = useState<string>(filters.action ?? '');

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    router.get('/admin/audit-log', { action: action || undefined }, {
      preserveScroll: true,
      preserveState: true,
    });
  }

  function clearFilters() {
    setAction('');
    router.get('/admin/audit-log', {}, { preserveScroll: true, preserveState: true });
  }

  return (
    <AdminLayout title="Audit log">
      <Head title="Admin — Audit log" />

      <div className={styles.topbar}>
        <div>
          <h1 className={styles.heading}>Audit log</h1>
          <p className={styles.sub}>
            Append-only record of every privileged admin action. Rows are immutable — there is no edit or delete.
          </p>
        </div>
      </div>

      <form className={styles.filters} onSubmit={applyFilters}>
        <label className={styles.field}>
          <span className={styles.label}>Action</span>
          <select className={styles.select} value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles.primary}>Filter</button>
        {filters.action ? (
          <button type="button" className={styles.ghost} onClick={clearFilters}>Clear</button>
        ) : null}
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.data.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.muted}>No log entries match.</td>
              </tr>
            ) : (
              logs.data.map((row) => (
                <tr key={row.id}>
                  <td className={styles.muted}>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })
                      : '—'}
                  </td>
                  <td>
                    {row.actor ? (
                      <span className={styles.actor}>
                        <span className={styles.actorName}>{row.actor.name}</span>
                        <span className={styles.actorRole} data-role={row.actor.role}>
                          {row.actor.role.replace('_', ' ')}
                        </span>
                      </span>
                    ) : <span className={styles.muted}>system</span>}
                  </td>
                  <td><code className={styles.action}>{row.action}</code></td>
                  <td className={styles.muted}>
                    {row.auditable_type
                      ? `${shortType(row.auditable_type)}#${row.auditable_id}`
                      : '—'}
                  </td>
                  <td>
                    {row.metadata && Object.keys(row.metadata).length > 0 ? (
                      <pre className={styles.metadata}>{JSON.stringify(row.metadata, null, 2)}</pre>
                    ) : <span className={styles.muted}>—</span>}
                  </td>
                  <td className={styles.muted}><code>{row.ip_address ?? '—'}</code></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {logs.last_page > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination">
          {logs.prev_page_url ? (
            <Link href={logs.prev_page_url} className={styles.pageLink}>← Previous</Link>
          ) : <span className={styles.pageDisabled}>← Previous</span>}
          <span>Page {logs.current_page} of {logs.last_page}</span>
          {logs.next_page_url ? (
            <Link href={logs.next_page_url} className={styles.pageLink}>Next →</Link>
          ) : <span className={styles.pageDisabled}>Next →</span>}
        </nav>
      ) : null}
    </AdminLayout>
  );
}

/** Strip the namespace from "App\\Models\\BlogPost" → "BlogPost". */
function shortType(t: string): string {
  const parts = t.split('\\');
  return parts[parts.length - 1] ?? t;
}
