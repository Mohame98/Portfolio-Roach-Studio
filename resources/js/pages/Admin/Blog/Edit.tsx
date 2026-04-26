import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import type { BlogPostStatus, SharedProps } from '@/types';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { BlogEditor } from '@/components/BlogEditor/BlogEditor';
import { useToast } from '@/components/Toast/ToastProvider';
import { useConfirm } from '@/hooks/useConfirm';
import styles from './Edit.module.css';

interface PostAbilities {
  submit: boolean;
  approve: boolean;
  reject: boolean;
  publish: boolean;
  unpublish: boolean;
  delete: boolean;
}

interface EditPostShape {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string;
  status: BlogPostStatus;
  published_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  blog_category_id: number | null;
  author: { id: number; name: string } | null;
  reviewer: { id: number; name: string } | null;
  publisher: { id: number; name: string } | null;
  abilities: PostAbilities;
}

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  accent: string;
}

interface AdminBlogEditProps {
  post: EditPostShape | null;
  categories: CategoryOption[];
}

export default function AdminBlogEdit({ post, categories }: AdminBlogEditProps) {
  const isEditing = post !== null;
  const toast = useToast();
  const { props } = usePage<SharedProps>();
  const isEditor = props.auth.user?.is_admin ?? false;
  const { element: confirmEl, ask } = useConfirm();

  const form = useForm<{
    title: string;
    excerpt: string;
    body_html: string;
    blog_category_id: number | '';
    status: BlogPostStatus;
    published_at: string;
  }>({
    title: post?.title ?? '',
    excerpt: post?.excerpt ?? '',
    body_html: post?.body_html ?? '',
    blog_category_id: post?.blog_category_id ?? '',
    status: post?.status ?? 'draft',
    published_at: post?.published_at
      ? new Date(post.published_at).toISOString().slice(0, 16)
      : '',
  });

  // Status options narrow by role: writers cannot select published.
  const statusOptions: Array<{ value: BlogPostStatus; label: string }> = isEditor
    ? [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_review', label: 'Pending review' },
        { value: 'published', label: 'Published' },
      ]
    : [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_review', label: 'Pending review' },
      ];

  function submit(e: FormEvent) {
    e.preventDefault();

    const transformed = {
      title: form.data.title,
      excerpt: form.data.excerpt || null,
      body_html: form.data.body_html,
      blog_category_id:
        form.data.blog_category_id === '' ? null : form.data.blog_category_id,
      status: form.data.status,
      published_at: form.data.published_at || null,
    };

    if (isEditing && post) {
      router.put(`/admin/blog-posts/${post.slug}`, transformed, {
        preserveScroll: true,
        onSuccess: () => toast.success('Changes saved', { title: 'Post updated' }),
        onError: () => toast.error('Please fix the errors and try again.', { title: 'Save failed' }),
      });
    } else {
      router.post('/admin/blog-posts', transformed, {
        preserveScroll: true,
        onSuccess: () => toast.success('Post created', { title: 'Saved' }),
        onError: () => toast.error('Please fix the errors and try again.', { title: 'Save failed' }),
      });
    }
  }

  async function workflow(action: 'submit' | 'approve' | 'reject' | 'publish' | 'unpublish') {
    if (!post) return;

    // Each transition gets a tailored confirmation. Reject collects an
    // optional note that the writer will see in the audit trail.
    if (action === 'reject') {
      const result = await ask({
        title: 'Reject this submission?',
        description: 'The post returns to draft and the writer can pick it up again. Optionally leave a note explaining what to change.',
        confirmLabel: 'Reject',
        danger: true,
        promptLabel: 'Note for the writer (optional)',
        promptPlaceholder: 'What needs to change before this can be published?',
      });
      if (!result.ok) return;
      router.post(
        `/admin/blog-posts/${post.slug}/reject`,
        { note: result.note ?? '' },
        {
          preserveScroll: true,
          onSuccess: () => toast.success('Sent back to draft', { title: 'Rejected' }),
        },
      );
      return;
    }

    if (action === 'publish') {
      const result = await ask({
        title: 'Publish this post?',
        description: 'It will be visible on the public blog immediately (or at the scheduled time, if one is set).',
        confirmLabel: 'Publish now',
      });
      if (!result.ok) return;
    }

    if (action === 'unpublish') {
      const result = await ask({
        title: 'Unpublish this post?',
        description: 'The post reverts to draft and disappears from the public blog. Existing URLs will 404 until republished.',
        confirmLabel: 'Unpublish',
        danger: true,
      });
      if (!result.ok) return;
    }

    router.post(`/admin/blog-posts/${post.slug}/${action}`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Done', { title: 'Workflow updated' }),
    });
  }

  return (
    <AdminLayout title={isEditing ? 'Edit post' : 'New post'}>
      <Head title={isEditing ? `Edit — ${post?.title}` : 'New post'} />
      {confirmEl}

      <form onSubmit={submit} className={styles.form} noValidate>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.heading}>
              {isEditing ? 'Edit post' : 'New post'}
            </h1>
            {isEditing && post ? (
              <p className={styles.sub}>
                <code>/blog/{post.slug}</code>
              </p>
            ) : null}
          </div>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => router.visit('/admin/blog-posts')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primary}
              disabled={form.processing}
            >
              {form.processing ? 'Saving…' : isEditing ? 'Save changes' : 'Create post'}
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.main}>
            <label className={styles.field}>
              <span className={styles.label}>Title</span>
              <input
                type="text"
                className={styles.titleInput}
                value={form.data.title}
                onChange={(e) => form.setData('title', e.target.value)}
                placeholder="The interview process, broken down honestly"
                required
                maxLength={180}
              />
              {form.errors.title ? (
                <span className={styles.error}>{form.errors.title}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Excerpt</span>
              <textarea
                className={styles.textarea}
                value={form.data.excerpt}
                onChange={(e) => form.setData('excerpt', e.target.value)}
                placeholder="One or two sentences. Appears on the blog list and in social previews."
                rows={3}
                maxLength={500}
              />
              {form.errors.excerpt ? (
                <span className={styles.error}>{form.errors.excerpt}</span>
              ) : null}
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Body</span>
              <BlogEditor
                value={form.data.body_html}
                onChange={(html) => form.setData('body_html', html)}
              />
              {form.errors.body_html ? (
                <span className={styles.error}>{form.errors.body_html}</span>
              ) : null}
              <p className={styles.hint}>
                HTML is sanitised server-side before it&apos;s stored — only
                a safe allowlist of tags survives.
              </p>
            </div>
          </section>

          <aside className={styles.side}>
            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Publishing</h2>

              <label className={styles.field}>
                <span className={styles.label}>Status</span>
                <select
                  className={styles.select}
                  value={form.data.status}
                  onChange={(e) =>
                    form.setData('status', e.target.value as BlogPostStatus)
                  }
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {form.errors.status ? (
                  <span className={styles.error}>{form.errors.status}</span>
                ) : null}
              </label>

              {isEditor ? (
                <label className={styles.field}>
                  <span className={styles.label}>Publish date</span>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    value={form.data.published_at}
                    onChange={(e) => form.setData('published_at', e.target.value)}
                  />
                  <span className={styles.hint}>
                    Leave blank to auto-stamp now when status flips to Published.
                  </span>
                  {form.errors.published_at ? (
                    <span className={styles.error}>{form.errors.published_at}</span>
                  ) : null}
                </label>
              ) : null}
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Category</h2>
              <label className={styles.field}>
                <span className="visually-hidden">Category</span>
                <select
                  className={styles.select}
                  value={form.data.blog_category_id}
                  onChange={(e) =>
                    form.setData(
                      'blog_category_id',
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                >
                  <option value="">— none —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {form.errors.blog_category_id ? (
                  <span className={styles.error}>{form.errors.blog_category_id}</span>
                ) : null}
              </label>
            </div>

            {isEditing && post ? (
              <div className={styles.card}>
                <h2 className={styles.cardHeading}>Workflow</h2>
                <ul className={styles.workflowMeta}>
                  {post.author ? <li>Author: <strong>{post.author.name}</strong></li> : null}
                  {post.submitted_at ? (
                    <li>Submitted {new Date(post.submitted_at).toLocaleString()}</li>
                  ) : null}
                  {post.reviewed_at ? (
                    <li>
                      Reviewed {new Date(post.reviewed_at).toLocaleString()}
                      {post.reviewer ? ` by ${post.reviewer.name}` : null}
                    </li>
                  ) : null}
                  {post.published_at ? (
                    <li>
                      Published {new Date(post.published_at).toLocaleString()}
                      {post.publisher ? ` by ${post.publisher.name}` : null}
                    </li>
                  ) : null}
                </ul>

                <div className={styles.workflowActions}>
                  {post.abilities.submit ? (
                    <button type="button" className={styles.workflowBtn} onClick={() => workflow('submit')}>
                      Submit for review
                    </button>
                  ) : null}
                  {post.abilities.approve ? (
                    <button type="button" className={styles.workflowBtn} onClick={() => workflow('approve')}>
                      Approve
                    </button>
                  ) : null}
                  {post.abilities.reject ? (
                    <button type="button" className={styles.workflowBtnDanger} onClick={() => workflow('reject')}>
                      Reject
                    </button>
                  ) : null}
                  {post.abilities.publish ? (
                    <button type="button" className={styles.workflowBtnPrimary} onClick={() => workflow('publish')}>
                      Publish now
                    </button>
                  ) : null}
                  {post.abilities.unpublish ? (
                    <button type="button" className={styles.workflowBtn} onClick={() => workflow('unpublish')}>
                      Unpublish
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </form>
    </AdminLayout>
  );
}
