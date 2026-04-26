import { Head, Link } from '@inertiajs/react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { useTheme } from '@/hooks/useTheme';
import type { BlogCardData, BlogPostDetail } from '@/types';
import styles from './Show.module.css';

interface BlogShowProps {
  post: BlogPostDetail;
  related: Array<Pick<BlogCardData, 'slug' | 'title' | 'excerpt' | 'published_at' | 'reading_minutes'>>;
}

const HEADER_OFFSET = 96;

export default function BlogShow({ post, related }: BlogShowProps) {
  const { preference, setPreference } = useTheme();
  const articleRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(
    post.toc[0]?.id ?? null,
  );

  // Scroll-spy.
  //
  // Active heading = the LAST heading (in document order) whose top edge has
  // crossed the reading line (HEADER_OFFSET px below the viewport top). We
  // measure with getBoundingClientRect on every scroll frame so the result
  // is correct even when a section is taller than the viewport — between
  // headings, the previous one stays active until the next one reaches
  // the line.
  //
  // We scope queries to articleRef.current (the .prose container) so we
  // don't accidentally hit a same-id element elsewhere on the page (e.g.
  // a sidebar widget). And we re-resolve the headings inside updateActive
  // so they're still correct if the article's HTML mounted asynchronously
  // after this effect first ran.
  //
  // While the user is scrolling programmatically (via a TOC click), we
  // suppress the spy with `lockUntil` so the highlight doesn't flicker
  // through every intermediate heading mid-flight.
  useEffect(() => {
    if (!post.toc.length) return;

    const root = articleRef.current ?? document;

    const findHeadings = (): HTMLElement[] =>
      post.toc
        .map((item) => root.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`))
        .filter((el): el is HTMLElement => el !== null);

    let frameId: number | null = null;

    const updateActive = () => {
      if (Date.now() < lockUntilRef.current) return;

      const headings = findHeadings();
      if (!headings.length) return;

      // Default rule: last heading whose top is at or above the reading line.
      let currentId = headings[0].id;
      for (const heading of headings) {
        const top = heading.getBoundingClientRect().top;
        if (top - HEADER_OFFSET <= 1) {
          currentId = heading.id;
        } else {
          break;
        }
      }

      // Edge case: when the final section is so short that the page can't
      // scroll far enough for its heading to physically reach the reading
      // line, the rule above keeps highlighting the previous heading even
      // when the user is clearly reading the last one.
      //
      // Pin to the last heading only when we're truly at the document
      // bottom (within 2px of it — strict so we don't fire while the
      // second-to-last section is still being read) AND the last heading
      // is visible somewhere in the viewport.
      const distanceToBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);

      if (distanceToBottom <= 2) {
        const last = headings[headings.length - 1];
        const lastTop = last.getBoundingClientRect().top;
        if (lastTop >= 0 && lastTop < window.innerHeight) {
          currentId = last.id;
        }
      }

      setActiveId((prev) => (prev === currentId ? prev : currentId));
    };

    const onScroll = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        updateActive();
        frameId = null;
      });
    };

    updateActive();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [post.toc, post.body_html]);

  // Suppress the scroll-spy briefly after a TOC click so the smooth-scroll
  // animation doesn't flicker the highlight through every passing heading.
  const lockUntilRef = useRef(0);

  const handleTocClick = useCallback(
    (e: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const heading = (articleRef.current ?? document).querySelector<HTMLElement>(
        `#${CSS.escape(id)}`,
      );
      if (!heading) return;

      const top = heading.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

      setActiveId(id);
      lockUntilRef.current = Date.now() + 700;
      window.history.replaceState(null, '', `#${id}`);
      window.scrollTo({ top, behavior: 'smooth' });
    },
    [],
  );

  const publishedDate = useMemo(() => {
    if (!post.published_at) {
      return null;
    }
    return new Date(post.published_at).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [post.published_at]);

  return (
    <>
      <Head title={post.title}>
        {post.excerpt ? <meta name="description" content={post.excerpt} /> : null}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        {post.excerpt ? (
          <meta property="og:description" content={post.excerpt} />
        ) : null}
      </Head>

      <Header />

      <main id="main" className={styles.page}>
        {post.is_preview ? (
          <div className={styles.previewBanner} role="status">
            You&apos;re viewing a draft. Only you (the author) and admins can see it.
          </div>
        ) : null}

        <article className={styles.article} aria-labelledby="post-title">
          <header className={styles.hero}>
            <div className={`container ${styles.heroInner}`}>
              <Link href="/blog" className={styles.back}>
                <span aria-hidden="true" className={styles.backArrow}>←</span>
                Back to Blog
              </Link>

              <h1 id="post-title" className={styles.title}>
                {post.title}
              </h1>

              {post.excerpt ? (
                <p className={styles.excerpt}>{post.excerpt}</p>
              ) : null}

              <div className={styles.meta}>
                {post.author ? <span>By {post.author.name}</span> : null}
                {post.author && publishedDate ? (
                  <span aria-hidden="true">·</span>
                ) : null}
                {publishedDate ? (
                  <time dateTime={post.published_at ?? ''}>
                    {publishedDate}
                  </time>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{post.reading_minutes} min read</span>
              </div>
            </div>
          </header>

          <div className={`container ${styles.body}`}>
            <div className={styles.bodyGrid}>
              <aside className={styles.tocColumn}>
                <div className={styles.tocSticky}>
                  {post.category ? (
                    <Link
                      href={`/blog?category=${post.category.slug}`}
                      className={styles.categoryPill}
                      style={{ '--pill-accent': post.category.accent } as CSSProperties}
                    >
                      <span className={styles.categoryDot} aria-hidden="true" />
                      {post.category.name}
                    </Link>
                  ) : null}

                  {post.toc.length > 0 ? (
                    <>
                      <p className={styles.tocHeading}>On this page</p>
                      <nav className={styles.tocNav} aria-label="Table of contents">
                        <ul className={styles.tocList}>
                          {post.toc.map((item) => (
                            <li
                              key={item.id}
                              className={styles.tocItem}
                              data-level={item.level}
                            >
                              <a
                                href={`#${item.id}`}
                                className={styles.tocLink}
                                data-active={activeId === item.id}
                                onClick={(e) => handleTocClick(e, item.id)}
                              >
                                <span className={styles.tocIndicator} aria-hidden="true" />
                                <span className={styles.tocText}>{item.text}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </>
                  ) : null}
                </div>
              </aside>

              <div
                ref={articleRef}
                className={styles.prose}
                // Body was sanitised server-side (HtmlSanitizer) before it
                // ever touched the DB. Rendering it as HTML is safe here.
                dangerouslySetInnerHTML={{ __html: post.body_html }}
              />
            </div>

            {related.length > 0 ? (
              <section
                className={styles.related}
                aria-labelledby="related-heading"
              >
                <h2 id="related-heading" className={styles.relatedHeading}>
                  Keep reading
                </h2>
                <ol className={styles.relatedList}>
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/blog/${r.slug}`}
                        className={styles.relatedCard}
                      >
                        <h3 className={styles.relatedTitle}>{r.title}</h3>
                        {r.excerpt ? (
                          <p className={styles.relatedExcerpt}>{r.excerpt}</p>
                        ) : null}
                        <span className={styles.relatedMeta}>
                          {r.reading_minutes} min read
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        </article>
      </main>

      <Footer preference={preference} onSelectPreference={setPreference} />
    </>
  );
}
