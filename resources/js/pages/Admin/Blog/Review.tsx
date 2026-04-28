import { Head, Link, router } from '@inertiajs/react';
import type { BlogPostStatus, Paginator, UserRole } from '@/types';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './Index.module.css';

interface PendingPost {
  id: number;
  slug: string;
  title: string;
  status: BlogPostStatus;
  submitted_at: string | null;
  updated_at: string | null;
  category: { slug: string; name: string; accent: string } | null;
  author: { id: number; name: string; role: UserRole } | null;
}

interface ReviewQueueProps {
  posts: Paginator<PendingPost>;
}

export default function ReviewQueue({ posts }: ReviewQueueProps) {
  const { element: confirmEl, ask } = useConfirm();

  function approve(slug: string) {
    router.post(`/admin/blog-posts/${slug}/approve`, {}, { preserveScroll: true });
  }

  async function publish(slug: string, title: string) {
    const result = await ask({
      title: 'Publish now?',
      description: `"${title}" will go live on the public blog immediately.`,
      confirmLabel: 'Publish',
    });
    if (!result.ok) return;
    router.post(`/admin/blog-posts/${slug}/publish`, {}, { preserveScroll: true });
  }

  async function reject(slug: string, title: string) {
    const result = await ask({
      title: 'Reject this submission?',
      description: `"${title}" returns to draft so the writer can revise. Optionally leave a note.`,
      confirmLabel: 'Reject',
      danger: true,
      promptLabel: 'Note for the writer (optional)',
      promptPlaceholder: 'What needs to change?',
    });
    if (!result.ok) return;
    router.post(
      `/admin/blog-posts/${slug}/reject`,
      { note: result.note ?? '' },
      { preserveScroll: true },
    );
  }

  return (
    <AdminLayout title="Review queue">
      <Head title="Admin — Review queue" />
      {confirmEl}

      <div className={styles.topbar}>
        <div>
          <h1 className={styles.heading}>Review queue</h1>
          <p className={styles.sub}>
            Posts awaiting editorial approval. Approve to mark ready, publish to push live, reject to send back.
          </p>
        </div>
      </div>

      {posts.data.length === 0 ? (
        <div className={styles.empty}>
          <p>Nothing pending review. Nice.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table} data-admin-table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Submitted</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.data.map((p) => (
                <tr key={p.id}>
                  <td data-label="Title">
                    <Link href={`/admin/blog-posts/${p.slug}/edit`} className={styles.titleLink}>
                      {p.title}
                    </Link>
                  </td>
                  <td data-label="Author">
                    {p.author ? (
                      <span className={styles.authorCell}>
                        <span className={styles.authorName}>{p.author.name}</span>
                        <span className={styles.roleBadge} data-role={p.author.role}>
                          {p.author.role.replace('_', ' ')}
                        </span>
                      </span>
                    ) : <span className={styles.muted}>—</span>}
                  </td>
                  <td data-label="Category">
                    {p.category ? (
                      <span className={styles.catPill} style={{ ['--pill' as string]: p.category.accent }}>
                        {p.category.name}
                      </span>
                    ) : <span className={styles.muted}>—</span>}
                  </td>
                  <td className={styles.muted} data-label="Submitted">
                    {p.submitted_at
                      ? new Date(p.submitted_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'}
                  </td>
                  <td className={styles.actions} data-label="Actions">
                    <Link href={`/admin/blog-posts/${p.slug}/edit`} className={styles.actionLink}>
                      Open
                    </Link>
                    <button type="button" className={styles.actionLink} onClick={() => approve(p.slug)}>
                      Approve
                    </button>
                    <button type="button" className={styles.actionLink} onClick={() => publish(p.slug, p.title)}>
                      Publish
                    </button>
                    <button type="button" className={styles.actionDanger} onClick={() => reject(p.slug, p.title)}>
                      Reject
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
          ) : <span className={styles.pageDisabled}>← Previous</span>}
          <span>Page {posts.current_page} of {posts.last_page}</span>
          {posts.next_page_url ? (
            <Link href={posts.next_page_url} className={styles.pageLink}>Next →</Link>
          ) : <span className={styles.pageDisabled}>Next →</span>}
        </nav>
      ) : null}
    </AdminLayout>
  );
}
