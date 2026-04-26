import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { LanguageToggle } from '@/components/LanguageToggle/LanguageToggle';
import { useTranslation } from '@/i18n/LanguageProvider';
import type { SharedProps } from '@/types';
import styles from './Header.module.css';

/** Inertia navigates for paths that stay inside the app (e.g. /blog),
 *  but hash anchors inside the current document need a plain <a>. */
type NavLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<Element>) => void;
} & React.AriaAttributes;

function NavLink({
  href,
  className,
  children,
  onClick,
  ...props
}: NavLinkProps) {
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} onClick={onClick} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick} {...props}>
      {children}
    </Link>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { props, url } = usePage<SharedProps>();
  const auth = props.auth;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const togglerRef = useRef<HTMLButtonElement | null>(null);

  // On pages other than the home route, section anchors have to prefix
  // with `/` so the browser navigates home first instead of appending
  // `#projects` to the current URL.
  const isHome = url === '/' || url.startsWith('/?') || url.startsWith('/#');
  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`);

  const navLinks = useMemo(
    () => [
      { href: sectionHref('#projects'), label: t('header.projects') },
      { href: sectionHref('#resume'), label: t('header.resume') },
      { href: sectionHref('#faq'), label: t('header.faq') },
      { href: '/blog', label: t('header.blog') },
      { href: sectionHref('#contact'), label: t('header.contact') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isHome, t],
  );

  // Close on Escape, route change (hash), or outside click.
  useEffect(() => {
    if (!open) {
return;
}

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        togglerRef.current?.focus();
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        togglerRef.current &&
        !togglerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onHash = () => setOpen(false);

    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    window.addEventListener('hashchange', onHash);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHash);
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={t('header.brandAria')}>
          <span className={styles.mark} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
          <span className={styles.name}>Mohame Roach</span>
        </Link>

        <nav aria-label={t('header.primaryNavAria')} className={styles.nav}>
          {navLinks.slice(0, 4).map((link) => {
            const hasPreview =
              link.href.includes('#projects') || link.href === '/blog';
              const isBlog = link.href === '/blog';

              const isActive =
                link.href === '/blog'
                  ? url.startsWith('/blog')
                  : url === link.href || url.startsWith(link.href);

            return (
              <div key={link.href} className={styles.navItem}>
                <NavLink href={link.href} className={styles.navLink}
                  aria-current={isActive ? 'page' : undefined}>
                  {link.label}
                </NavLink>

                {hasPreview ? (
                  <div className={styles.navPreview}>
                    <div className={styles.previewCard}>
                      <div className={styles.previewTop}>
                        <span className={styles.previewLabel}>
                          {link.href === '/blog' ? 'Featured Post' : 'Projects'}
                        </span>

                        <NavLink
                          href={link.href}
                          className={styles.previewImage}
                        >
                          <img
                            src={
                              isBlog
                                ? '/images/preview/blog-preview.png'
                                : '/images/preview/project-preview.png'
                            }
                            alt={isBlog ? 'Featured blog post' : 'Project preview'}
                          />
                        </NavLink>
                      </div>

                      <NavLink href={link.href} className={styles.previewMainLink}>
                        {link.href === '/blog' ? 'View blog' : 'View Projects'}
                        <span aria-hidden="true">›</span>
                      </NavLink>
                    </div>

                    <NavLink href={link.href} className={styles.previewAllLink}>
                      {link.href === '/blog' ? 'All posts' : 'Open Projects'}
                      <span aria-hidden="true">›</span>
                    </NavLink>
                  </div>
                ) : null}
              </div>
            );
          })}

          {auth.user?.is_admin ? (
            <Link href="/admin/blog-posts" className={styles.navLink}>
              {t('header.admin')}
            </Link>
          ) : null}
        </nav>

        <div className={styles.actions}>
          <LanguageToggle />
          <Button
            href={sectionHref('#contact')}
            variant="primary"
            size="sm"
            className={styles.cta}
          >
            {t('header.contact')}
          </Button>

          <button
            ref={togglerRef}
            type="button"
            className={styles.menuToggle}
            aria-label={open ? t('header.closeMenu') : t('header.openMenu')}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.bars} data-open={open} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        <div
          id="site-menu"
          ref={menuRef}
          className={styles.mobileMenu}
          data-open={open}
          aria-hidden={!open}
        >
          <nav
            aria-label={t('header.mobileNavAria')}
            className={styles.mobileNav}
            inert={!open}
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                className={styles.mobileLink}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {auth.user?.is_admin ? (
              <Link
                href="/admin/blog-posts"
                className={styles.mobileLink}
                onClick={() => setOpen(false)}
              >
                {t('header.admin')}
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}


