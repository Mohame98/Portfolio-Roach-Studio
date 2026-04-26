import { Head, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/components/Toast/ToastProvider';
import styles from './Index.module.css';

interface CategoryRow {
  id: number;
  slug: string;
  name: string;
  accent: string;
  sort_order: number;
  post_count: number;
}

interface CategoriesIndexProps {
  categories: CategoryRow[];
}

const BLANK_FORM = { name: '', slug: '', accent: '#7c8cff', sort_order: 0 } as const;

export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
  // Edits are keyed by slug because BlogCategory::getRouteKeyName() returns
  // 'slug' — the route /admin/categories/{category} resolves by slug, not id.
  // Tracking the original slug lets us still rename the slug in the form.
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const form = useForm<{ name: string; slug: string; accent: string; sort_order: number }>({ ...BLANK_FORM });
  const { element: confirmEl, ask } = useConfirm();
  const toast = useToast();

  function startCreate() {
    setEditingSlug(null);
    form.setData({ ...BLANK_FORM });
  }

  function startEdit(cat: CategoryRow) {
    setEditingSlug(cat.slug);
    form.setData({
      name: cat.name,
      slug: cat.slug,
      accent: cat.accent,
      sort_order: cat.sort_order,
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();

    if (editingSlug !== null) {
      router.put(`/admin/categories/${editingSlug}`, form.data, {
        preserveScroll: true,
        onSuccess: () => {
          form.setData({ ...BLANK_FORM });
          setEditingSlug(null);
        },
        onError: () => toast.error('Please fix the errors and try again.', { title: 'Save failed' }),
      });
    } else {
      router.post('/admin/categories', form.data, {
        preserveScroll: true,
        onSuccess: () => form.setData({ ...BLANK_FORM }),
        onError: () => toast.error('Please fix the errors and try again.', { title: 'Save failed' }),
      });
    }
  }

  async function destroy(cat: CategoryRow) {
    const result = await ask({
      title: 'Delete this category?',
      description: cat.post_count > 0
        ? `"${cat.name}" still has ${cat.post_count} post${cat.post_count === 1 ? '' : 's'} attached. Those posts will become uncategorised but will not be deleted.`
        : `"${cat.name}" will be removed.`,
      confirmLabel: 'Delete category',
      danger: true,
    });
    if (!result.ok) return;
    router.delete(`/admin/categories/${cat.slug}`, { preserveScroll: true });
  }

  return (
    <AdminLayout title="Categories">
      <Head title="Admin — Categories" />
      {confirmEl}

      <div className={styles.topbar}>
        <div>
          <h1 className={styles.heading}>Categories</h1>
          <p className={styles.sub}>Tags shown on the public blog list and at the top of each post.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Accent</th>
                <th>Order</th>
                <th>Posts</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.muted}>No categories yet.</td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className={styles.catPill} style={{ ['--pill' as string]: c.accent }}>{c.name}</span>
                    </td>
                    <td className={styles.muted}><code>{c.slug}</code></td>
                    <td>
                      <span className={styles.swatch} style={{ background: c.accent }} />
                      <span className={styles.muted}> {c.accent}</span>
                    </td>
                    <td className={styles.muted}>{c.sort_order}</td>
                    <td className={styles.muted}>{c.post_count}</td>
                    <td className={styles.actions}>
                      <button type="button" className={styles.actionLink} onClick={() => startEdit(c)}>Edit</button>
                      <button type="button" className={styles.actionDanger} onClick={() => destroy(c)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <aside className={styles.formCard}>
          <h2 className={styles.cardHeading}>{editingSlug !== null ? 'Edit category' : 'New category'}</h2>
          <form onSubmit={submit} className={styles.form} noValidate>
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input
                type="text"
                className={styles.input}
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                required
                maxLength={80}
              />
              {form.errors.name ? <span className={styles.error}>{form.errors.name}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Slug</span>
              <input
                type="text"
                className={styles.input}
                value={form.data.slug}
                onChange={(e) => form.setData('slug', e.target.value)}
                required
                pattern="[a-z0-9-]+"
                maxLength={80}
              />
              {form.errors.slug ? <span className={styles.error}>{form.errors.slug}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Accent colour</span>
              <input
                type="color"
                className={styles.colorInput}
                value={form.data.accent}
                onChange={(e) => form.setData('accent', e.target.value)}
              />
              {form.errors.accent ? <span className={styles.error}>{form.errors.accent}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Sort order</span>
              <input
                type="number"
                className={styles.input}
                value={form.data.sort_order}
                onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                min={0}
                max={999}
              />
              {form.errors.sort_order ? <span className={styles.error}>{form.errors.sort_order}</span> : null}
            </label>

            <div className={styles.formActions}>
              {editingSlug !== null ? (
                <button type="button" className={styles.ghost} onClick={startCreate}>Cancel</button>
              ) : null}
              <button type="submit" className={styles.primary} disabled={form.processing}>
                {editingSlug !== null ? 'Save changes' : 'Create category'}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </AdminLayout>
  );
}
