import { Head, Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import type { Paginator, UserRole } from '@/types';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/components/Toast/ToastProvider';
import styles from './Index.module.css';

type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

interface InvitationRow {
  id: number;
  email: string;
  role: UserRole;
  role_label: string;
  status: InvitationStatus;
  expires_at: string | null;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string | null;
  creator: { id: number; name: string } | null;
  accepted_user: { id: number; name: string; email: string } | null;
}

interface InvitationsIndexProps {
  invitations: Paginator<InvitationRow>;
  assignable_roles: { value: UserRole; label: string }[];
  default_ttl_hours: number;
}

const STATUS_TONE: Record<InvitationStatus, 'ok' | 'warn' | 'danger' | 'muted'> = {
  pending: 'ok',
  accepted: 'muted',
  expired: 'warn',
  revoked: 'danger',
};

export default function InvitationsIndex({ invitations, assignable_roles, default_ttl_hours }: InvitationsIndexProps) {
  const { element: confirmEl, ask } = useConfirm();
  const toast = useToast();

  const form = useForm<{ email: string; role: UserRole; ttl_hours: number }>({
    email: '',
    role: assignable_roles[0]?.value ?? ('writer' as UserRole),
    ttl_hours: default_ttl_hours,
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    form.post('/admin/invitations', {
      preserveScroll: true,
      onSuccess: () => {
        form.reset('email');
      },
      onError: () => toast.error('Please fix the errors and try again.', { title: 'Could not send invitation' }),
    });
  }

  async function revoke(inv: InvitationRow) {
    const result = await ask({
      title: 'Revoke this invitation?',
      description: `The link sent to ${inv.email} will stop working immediately. The audit-log entry stays for traceability.`,
      confirmLabel: 'Revoke invitation',
      danger: true,
    });
    if (!result.ok) return;
    router.delete(`/admin/invitations/${inv.id}`, { preserveScroll: true });
  }

  return (
    <AdminLayout title="Invitations">
      <Head title="Admin — Invitations" />
      {confirmEl}

      <div className={styles.topbar}>
        <div>
          <h1 className={styles.heading}>Invitations</h1>
          <p className={styles.sub}>
            The only path into the admin panel. The plain token is shown once on creation and then
            never persisted — only its sha256 hash is stored.
          </p>
        </div>
      </div>

      <section className={styles.formCard}>
        <h2 className={styles.cardHeading}>New invitation</h2>
        <form onSubmit={submit} className={styles.form} noValidate>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              className={styles.input}
              value={form.data.email}
              onChange={(e) => form.setData('email', e.target.value)}
              placeholder="writer@example.com"
              required
            />
            {form.errors.email ? <span className={styles.error}>{form.errors.email}</span> : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Role</span>
            <select
              className={styles.select}
              value={form.data.role}
              onChange={(e) => form.setData('role', e.target.value as UserRole)}
            >
              {assignable_roles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {form.errors.role ? <span className={styles.error}>{form.errors.role}</span> : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Expires (hours)</span>
            <input
              type="number"
              className={styles.input}
              value={form.data.ttl_hours}
              onChange={(e) => form.setData('ttl_hours', Number(e.target.value))}
              min={1}
              max={336}
            />
            {form.errors.ttl_hours ? <span className={styles.error}>{form.errors.ttl_hours}</span> : null}
          </label>

          <button type="submit" className={styles.primary} disabled={form.processing}>
            {form.processing ? 'Sending…' : 'Send invitation'}
          </button>
        </form>
      </section>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Invited by</th>
              <th>Accepted by</th>
              <th className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.data.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.muted}>No invitations yet.</td>
              </tr>
            ) : (
              invitations.data.map((inv) => (
                <tr key={inv.id}>
                  <td className={styles.metaPrimary}>{inv.email}</td>
                  <td>{inv.role_label}</td>
                  <td>
                    <span className={styles.statusPill} data-tone={STATUS_TONE[inv.status]}>
                      {inv.status}
                    </span>
                  </td>
                  <td className={styles.muted}>
                    {inv.expires_at
                      ? new Date(inv.expires_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'}
                  </td>
                  <td className={styles.muted}>{inv.creator?.name ?? '—'}</td>
                  <td className={styles.muted}>
                    {inv.accepted_user ? (
                      <Link href="/admin/users" className={styles.subLink}>{inv.accepted_user.name}</Link>
                    ) : '—'}
                  </td>
                  <td className={styles.actions}>
                    {inv.status === 'pending' ? (
                      <button type="button" className={styles.actionDanger} onClick={() => revoke(inv)}>
                        Revoke
                      </button>
                    ) : <span className={styles.muted}>—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {invitations.last_page > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination">
          {invitations.prev_page_url ? (
            <Link href={invitations.prev_page_url} className={styles.pageLink}>← Previous</Link>
          ) : <span className={styles.pageDisabled}>← Previous</span>}
          <span>Page {invitations.current_page} of {invitations.last_page}</span>
          {invitations.next_page_url ? (
            <Link href={invitations.next_page_url} className={styles.pageLink}>Next →</Link>
          ) : <span className={styles.pageDisabled}>Next →</span>}
        </nav>
      ) : null}
    </AdminLayout>
  );
}
