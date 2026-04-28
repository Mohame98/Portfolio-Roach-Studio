import { Head, Link, router } from '@inertiajs/react';
import type { Paginator, UserRole } from '@/types';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './Index.module.css';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  email_verified_at: string | null;
  disabled_at: string | null;
  deleted_at: string | null;
  created_at: string | null;
  invited_by: { id: number; name: string } | null;
  is_self: boolean;
}

interface UsersIndexProps {
  users: Paginator<UserRow>;
  assignable_roles: { value: UserRole; label: string }[];
}

export default function UsersIndex({ users, assignable_roles }: UsersIndexProps) {
  const { element: confirmEl, ask } = useConfirm();

  async function changeRole(user: UserRow, nextRole: UserRole) {
    if (nextRole === user.role) return;
    const result = await ask({
      title: `Change ${user.name}'s role?`,
      description: `Their access changes from ${user.role.replace('_', ' ')} to ${nextRole.replace('_', ' ')} immediately.`,
      confirmLabel: 'Change role',
    });
    if (!result.ok) return;

    router.put(`/admin/users/${user.id}`, { role: nextRole }, { preserveScroll: true });
  }

  async function disable(user: UserRow) {
    const result = await ask({
      title: `Disable ${user.name}?`,
      description: 'They will be signed out from every device immediately and cannot log in until re-enabled. Their posts stay intact.',
      confirmLabel: 'Disable account',
      danger: true,
    });
    if (!result.ok) return;
    router.post(`/admin/users/${user.id}/disable`, {}, { preserveScroll: true });
  }

  function enable(user: UserRow) {
    router.post(`/admin/users/${user.id}/enable`, {}, { preserveScroll: true });
  }

  async function destroy(user: UserRow) {
    const result = await ask({
      title: `Delete ${user.name}?`,
      description: 'The account is soft-deleted — their posts stay authored to them. You can restore the account later.',
      confirmLabel: 'Delete account',
      danger: true,
    });
    if (!result.ok) return;
    router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
  }

  function restore(user: UserRow) {
    router.post(`/admin/users/${user.id}/restore`, {}, { preserveScroll: true });
  }

  function statusOf(user: UserRow): { label: string; tone: 'ok' | 'warn' | 'danger' } {
    if (user.deleted_at) return { label: 'Deleted', tone: 'danger' };
    if (user.disabled_at) return { label: 'Disabled', tone: 'warn' };
    if (!user.email_verified_at) return { label: 'Unverified', tone: 'warn' };
    return { label: 'Active', tone: 'ok' };
  }

  return (
    <AdminLayout title="Users">
      <Head title="Admin — Users" />
      {confirmEl}

      <div className={styles.topbar}>
        <div>
          <h1 className={styles.heading}>Users</h1>
          <p className={styles.sub}>
            Everyone with access to the admin area. Use{' '}
            <Link href="/admin/invitations" className={styles.subLink}>Invitations</Link>{' '}
            to add new accounts.
          </p>
        </div>
        <Link href="/admin/invitations" className={styles.newBtn}>
          + Invite user
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} data-admin-table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Invited by</th>
              <th>Joined</th>
              <th className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((u) => {
              const status = statusOf(u);

              return (
                <tr key={u.id} data-deleted={u.deleted_at ? 'true' : undefined}>
                  <td data-label="Name">
                    <span className={styles.name}>{u.name}</span>
                    {u.is_self ? <span className={styles.youBadge}>you</span> : null}
                  </td>
                  <td data-label="Email">
                    <a
                      href={`mailto:${u.email}`}
                      className={styles.emailLink}
                      title={`Email ${u.name}`}
                    >
                      {u.email}
                    </a>
                  </td>
                  <td data-label="Role">
                    {u.is_self ? (
                      <span className={styles.roleBadge} data-role={u.role}>{u.role_label}</span>
                    ) : (
                      <select
                        className={styles.roleSelect}
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value as UserRole)}
                        disabled={!!u.deleted_at}
                      >
                        {assignable_roles.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td data-label="Status">
                    <span className={styles.statusPill} data-tone={status.tone}>{status.label}</span>
                  </td>
                  <td className={styles.muted} data-label="Invited by">
                    {u.invited_by ? u.invited_by.name : '—'}
                  </td>
                  <td className={styles.muted} data-label="Joined">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
                      : '—'}
                  </td>
                  <td className={styles.actions} data-label="Actions">
                    {u.is_self ? (
                      <span className={styles.muted}>—</span>
                    ) : u.deleted_at ? (
                      <button type="button" className={styles.actionLink} onClick={() => restore(u)}>
                        Restore
                      </button>
                    ) : u.disabled_at ? (
                      <>
                        <button type="button" className={styles.actionLink} onClick={() => enable(u)}>Enable</button>
                        <button type="button" className={styles.actionDanger} onClick={() => destroy(u)}>Delete</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className={styles.actionLink} onClick={() => disable(u)}>Disable</button>
                        <button type="button" className={styles.actionDanger} onClick={() => destroy(u)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.last_page > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination">
          {users.prev_page_url ? (
            <Link href={users.prev_page_url} className={styles.pageLink}>← Previous</Link>
          ) : <span className={styles.pageDisabled}>← Previous</span>}
          <span>Page {users.current_page} of {users.last_page}</span>
          {users.next_page_url ? (
            <Link href={users.next_page_url} className={styles.pageLink}>Next →</Link>
          ) : <span className={styles.pageDisabled}>Next →</span>}
        </nav>
      ) : null}
    </AdminLayout>
  );
}
