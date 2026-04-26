import { Link, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedProps } from '@/types';
import { useFlashToasts } from '@/hooks/useFlashToasts';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

interface NavLinkSpec {
  href: string;
  label: string;
  /** A link is shown only if the predicate returns true. */
  visible: (auth: SharedProps['auth']['user']) => boolean;
  /** Sub-page paths that should still light up this link as active. */
  match?: (path: string) => boolean;
}

const NAV_LINKS: NavLinkSpec[] = [
  {
    href: '/admin/blog-posts',
    label: 'Posts',
    visible: () => true,
    match: (p) => p.startsWith('/admin/blog-posts'),
  },
  {
    href: '/admin/review',
    label: 'Review queue',
    visible: (u) => !!u && u.is_admin,
    match: (p) => p.startsWith('/admin/review'),
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    visible: (u) => !!u && u.is_admin,
    match: (p) => p.startsWith('/admin/categories'),
  },
  {
    href: '/admin/users',
    label: 'Users',
    visible: (u) => !!u && u.is_super_admin,
    match: (p) => p.startsWith('/admin/users'),
  },
  {
    href: '/admin/invitations',
    label: 'Invitations',
    visible: (u) => !!u && u.is_super_admin,
    match: (p) => p.startsWith('/admin/invitations'),
  },
  {
    href: '/admin/audit-log',
    label: 'Audit log',
    visible: (u) => !!u && u.is_super_admin,
    match: (p) => p.startsWith('/admin/audit-log'),
  },
];

/**
 * Admin chrome with a role-aware sidebar. Links the user has no permission
 * for are not even rendered — the server still authoritatively gates each
 * route, this is purely a UX shortcut.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { props, url } = usePage<SharedProps>();
  const user = props.auth.user;
  const path = url.split('?')[0] ?? '/';

  // Server-side flash messages (back()->with('status'|'error', ...)) become
  // toasts globally so individual pages don't each need their own banner.
  useFlashToasts();

  function logout() {
    router.post('/logout');
  }

  const visibleLinks = NAV_LINKS.filter((l) => l.visible(user));

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link href="/admin" className={styles.brand}>
            <span className={styles.mark} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 14V4l5 7 5-7v10"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 4v10"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Admin</span>
          </Link>

          <div className={styles.user}>
            {user ? (
              <span className={styles.userMeta}>
                <span className={styles.userName}>{user.name}</span>
                <span
                  className={styles.roleBadge}
                  data-role={user.role}
                  title={user.role_label}
                >
                  <span className={styles.roleDot} aria-hidden="true" />
                  {user.role_label}
                </span>
              </span>
            ) : null}
            <Link href="/blog" className={styles.viewSite}>View site</Link>
            <button type="button" onClick={logout} className={styles.logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar} aria-label="Admin navigation">
          <nav className={styles.nav}>
            {visibleLinks.map((link) => {
              const active = link.match
                ? link.match(path)
                : path === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.navLink}
                  data-active={active ? 'true' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className={styles.main}>
          <div className={styles.container}>{children}</div>
        </main>
      </div>
    </div>
  );
}
