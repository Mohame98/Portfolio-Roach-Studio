import { Head, Link, router, usePage } from '@inertiajs/react';
import type { BlogPostStatus, Paginator, SharedProps, UserRole } from '@/types';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './Index.module.css';



interface AdminPostRow {
  id: number;
  slug: string;
  title: string;
  status: BlogPostStatus;
  updated_at: string | null;
  submitted_at: string | null;
  published_at: string | null;
  category: { slug: string; name: string; accent: string } | null;
  author: { id: number; name: string; role: UserRole } | null;
}

interface AdminBlogIndexProps {
  posts: Paginator<AdminPostRow>;
}

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  published: 'Published',
};

export default function AdminBlogIndex({ posts }: AdminBlogIndexProps) {
  const { props } = usePage<SharedProps>();
  const user = props.auth.user;
  const isEditor = user?.is_admin ?? false;
  const { element: confirmEl, ask } = useConfirm();

  async function destroy(slug: string, title: string) {
    const result = await ask({
      title: 'Delete this post?',
      description: `"${title}" will be soft-deleted. A super admin can restore it from the database, but it will no longer appear in any list.`,
      confirmLabel: 'Delete post',
      danger: true,
    });
    if (!result.ok) return;

    router.delete(`/admin/blog-posts/${slug}`, { preserveScroll: true });
  }

  return (
    <AdminLayout title="Posts">
      <Head title="Admin — Posts" />
      {confirmEl}

      <div className={styles.topbar}>
        <div>
          <h1 className={styles.heading}>Posts</h1>
          <p className={styles.sub}>
            {isEditor
              ? 'All drafts, pending reviews, and published posts.'
              : 'Your drafts and submitted posts.'}
          </p>
        </div>
        <Link href="/admin/blog-posts/create" className={styles.newBtn}>
          + New post
        </Link>
      </div>

      {posts.data.length === 0 ? (
        <div className={styles.empty}>
          <p>No posts yet.</p>
          <Link href="/admin/blog-posts/create" className={styles.newBtn}>
            Create your first post
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                {isEditor ? <th>Author</th> : null}
                <th>Status</th>
                <th>Updated</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/admin/blog-posts/${p.slug}/edit`}
                      className={styles.titleLink}
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td>
                    {p.category ? (
                      <span
                        className={styles.catPill}
                        style={{ ['--pill' as string]: p.category.accent }}
                      >
                        {p.category.name}
                      </span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  {isEditor ? (
                    <td>
                      {p.author ? (
                        <span className={styles.authorCell}>
                          <span className={styles.authorName}>{p.author.name}</span>
                          <span className={styles.roleBadge} data-role={p.author.role}>
                            {p.author.role.replace('_', ' ')}
                          </span>
                        </span>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                  ) : null}
                  <td>
                    <span className={styles.status} data-status={p.status}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className={styles.muted}>
                    {p.updated_at
                      ? new Date(p.updated_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </td>
                  <td className={styles.actions}>
                    {p.status === 'published' ? (
                      <Link href={`/blog/${p.slug}`} className={styles.actionLink}>
                        View
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/blog-posts/${p.slug}/edit`}
                      className={styles.actionLink}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={styles.actionDanger}
                      onClick={() => destroy(p.slug, p.title)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {posts.last_page > 1 ? (
        <nav className={styles.pagination} aria-label="Pagination">
          {posts.prev_page_url ? (
            <Link href={posts.prev_page_url} className={styles.pageLink}>← Previous</Link>
          ) : (
            <span className={styles.pageDisabled}>← Previous</span>
          )}
          <span>Page {posts.current_page} of {posts.last_page}</span>
          {posts.next_page_url ? (
            <Link href={posts.next_page_url} className={styles.pageLink}>Next →</Link>
          ) : (
            <span className={styles.pageDisabled}>Next →</span>
          )}
        </nav>
      ) : null}
    </AdminLayout>
  );
}
