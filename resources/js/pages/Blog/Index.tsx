import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { useTheme } from '@/hooks/useTheme';
import type {
  BlogCardData,
  BlogCategory,
  BlogIndexFilters,
  Paginator,
} from '@/types';
import styles from './Index.module.css';

interface BlogIndexProps {
  categories: BlogCategory[];
  posts: Paginator<BlogCardData>;
  filters: BlogIndexFilters;
}

export default function BlogIndex({ categories, posts, filters }: BlogIndexProps) {
  const { preference, setPreference } = useTheme();

  const [search, setSearch] = useState(filters.q ?? '');
  const debounceRef = useRef<number | null>(null);

  // Debounced search — pushes into the URL so deep links stay shareable and
  // the back button rewinds through filter states.
  useEffect(() => {
    if (search === (filters.q ?? '')) {
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      applyFilter({ q: search || null });
    }, 280);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function applyFilter(partial: Partial<BlogIndexFilters>) {
    const next = {
      category: filters.category ?? undefined,
      q: filters.q ?? undefined,
      sort: filters.sort,
      ...Object.fromEntries(
        Object.entries(partial).map(([k, v]) => [k, v ?? undefined]),
      ),
    };

    router.get('/blog', next, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  }

  const heading = useMemo(() => {
    if (filters.category) {
      const c = categories.find((x) => x.slug === filters.category);
      return c ? `${c.name} writing` : 'Writing';
    }
    return 'Writing';
  }, [filters.category, categories]);

  return (
    <>
      <Head title="Blog">
        <meta
          name="description"
          content="Essays, notes, and case studies on full-stack engineering, design, and the craft of shipping software."
        />
      </Head>
      <Header />

      <main id="main" className={styles.page}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <p className={styles.eyebrow}>Blog</p>
            <h1 className={styles.heading}>{heading}</h1>
            <p className={styles.lede}>
              Short-form notes and longer pieces on the engineering behind the
              things I build — what worked, what didn&apos;t, and why.
            </p>
          </div>
        </section>

        <section className={styles.filters}>
          <div className={`container ${styles.filtersInner}`}>
            <div
              role="tablist"
              aria-label="Filter by category"
              className={styles.tabs}
            >
              <button
                role="tab"
                aria-selected={filters.category === null}
                type="button"
                className={styles.tab}
                data-active={filters.category === null}
                onClick={() => applyFilter({ category: null })}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  role="tab"
                  aria-selected={filters.category === c.slug}
                  key={c.slug}
                  type="button"
                  className={styles.tab}
                  data-active={filters.category === c.slug}
                  style={{ ['--tab-accent' as string]: c.accent }}
                  onClick={() => applyFilter({ category: c.slug })}
                >
                  {/* <span className={styles.tabDot} aria-hidden="true" /> */}
                  {c.name}
                </button>
              ))}
            </div>

            <div className={styles.controls}>
              <label className={styles.searchLabel}>
                <span className="visually-hidden">Search titles</span>
                <SearchIcon />
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search titles…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              <label className={styles.sortLabel}>
                <span className="visually-hidden">Sort</span>
                <select
                  className={styles.sortSelect}
                  value={filters.sort}
                  onChange={(e) =>
                    applyFilter({
                      sort: e.target.value as BlogIndexFilters['sort'],
                    })
                  }
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <ChevronIcon />
              </label>
            </div>
          </div>
        </section>

        <section className={styles.list}>
          <div className={`container ${styles.listInner}`}>
            {posts.data.length === 0 ? (
              <p className={styles.empty}>
                Nothing here yet for those filters. Try clearing the search or
                picking a different category.
              </p>
            ) : (
              <ol className={styles.cards}>
                {posts.data.map((p) => (
                  <li key={p.id} className={styles.cardWrap}>
                    <BlogCard post={p} />
                  </li>
                ))}
              </ol>
            )}

            {posts.last_page > 1 ? (
              <nav className={styles.pagination} aria-label="Pagination">
                {posts.prev_page_url ? (
                  <Link
                    href={posts.prev_page_url}
                    className={styles.pageLink}
                    preserveScroll
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className={styles.pageLinkDisabled}>← Previous</span>
                )}
                <span className={styles.pageInfo}>
                  Page {posts.current_page} of {posts.last_page}
                </span>
                {posts.next_page_url ? (
                  <Link
                    href={posts.next_page_url}
                    className={styles.pageLink}
                    preserveScroll
                  >
                    Next →
                  </Link>
                ) : (
                  <span className={styles.pageLinkDisabled}>Next →</span>
                )}
              </nav>
            ) : null}
          </div>
        </section>
      </main>

      <Footer preference={preference} onSelectPreference={setPreference} />
    </>
  );
}

function BlogCard({ post }: { post: BlogCardData }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const accent = post.category?.accent ?? 'var(--text-muted)';

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={styles.card}
      style={{ ['--card-accent' as string]: accent }}
    >
      {/* <span className={styles.cardBar} aria-hidden="true" /> */}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          {date ? <time dateTime={post.published_at ?? ''}>{date}</time> : null}
          {post.category ? (
            <>
              <span aria-hidden="true">·</span>
              <span className={styles.cardCategory}>{post.category.name}</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{post.reading_minutes} min read</span>
        </div>
        <h2 className={styles.cardTitle}>{post.title}</h2>
        {post.excerpt ? (
          <p className={styles.cardExcerpt}>{post.excerpt}</p>
        ) : null}
        <span className={styles.cardCta} aria-hidden="true">
          Read more
          <span className={styles.cardCtaArrow}>→</span>
        </span>
      </div>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={styles.sortChevron}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
