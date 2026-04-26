import { Link, usePage } from '@inertiajs/react';
import type { ReactElement } from 'react';
import { useTranslation } from '@/i18n/LanguageProvider';
import type { ThemePreference } from '@/types';
import styles from './Footer.module.css';

interface FooterProps {
  preference: ThemePreference;
  onSelectPreference: (next: ThemePreference) => void;
}

const RESUME_URL = '/Mohame_Roach_Resume.pdf';
const RESUME_FILENAME = 'Mohame_Roach_Resume.pdf';

interface FooterLink {
  labelKey: string;
  href: string;
  external?: boolean;
  download?: string;
}

const CONNECT_LINKS: FooterLink[] = [
  { labelKey: 'footer.link_contact', href: '#contact' },
  { labelKey: 'footer.link_email', href: 'mailto:mohamekroach@gmail.com', external: true },
  { labelKey: 'footer.link_github', href: 'https://github.com/Mohame98', external: true },
  {
    labelKey: 'footer.link_linkedin',
    href: 'https://www.linkedin.com/in/mohame-roach/',
    external: true,
  },
  // { labelKey: 'footer.link_x', href: 'https://x.com/', external: true },
];

const SITE_LINKS: FooterLink[] = [
  { labelKey: 'footer.link_projects', href: '#projects' },
  { labelKey: 'footer.link_resume', href: '#resume' },
  { labelKey: 'footer.link_faq', href: '#faq' },
  { labelKey: 'footer.link_start', href: '#contact' },
];

const RESOURCE_LINKS: FooterLink[] = [
  {
    labelKey: 'footer.link_downloadCv',
    href: RESUME_URL,
    external: true,
    download: RESUME_FILENAME,
  },
  {
    labelKey: 'footer.link_source',
    href: 'https://github.com/Mohame98',
    external: true,
  },
  // { labelKey: 'footer.link_colophon', href: '#faq' },
  { labelKey: 'footer.link_privacy', href: '#contact' },
];

export function Footer({ preference, onSelectPreference }: FooterProps) {
  const { t } = useTranslation();
  const { url } = usePage();
  const year = new Date().getFullYear();

  // On pages other than the home route, section anchors have to prefix
  // with `/` so the browser navigates home first instead of appending
  // `#projects` to the current URL.
  const isHome = url === '/' || url.startsWith('/?') || url.startsWith('/#');

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandCol}>
          <Link href="/" className={styles.brand} aria-label={t('footer.brandAria')}>
            <span className={styles.mark} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
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
            <span className={styles.brandName}>Mohame Roach</span>
          </Link>
          <p className={styles.tag}>{t('footer.tag')}</p>
          <p className={styles.copy}>
            {t('footer.copyright', { year })}
          </p>

          <ThemeSwitcher
            preference={preference}
            onSelect={onSelectPreference}
          />
        </div>

        <nav
          className={styles.linksGrid}
          aria-label={t('footer.footerNavAria')}
        >
          <FooterColumn titleKey="footer.col_connect" links={CONNECT_LINKS} isHome={isHome} />
          <FooterColumn titleKey="footer.col_site" links={SITE_LINKS} isHome={isHome} />
          <FooterColumn titleKey="footer.col_resources" links={RESOURCE_LINKS} isHome={isHome} />
        </nav>
      </div>
    </footer>
  );
}

function FooterColumn({
  titleKey,
  links,
  isHome,
}: {
  titleKey: string;
  links: FooterLink[];
  isHome: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className={styles.column}>
      <h3 className={styles.columnTitle}>{t(titleKey)}</h3>
      <ul className={styles.columnList}>
        {links.map((link) => {
          // Section anchors (#contact, #projects…) only resolve in-place on
          // the home route. Anywhere else, prefix `/` so the browser
          // navigates home first instead of grafting the hash onto the
          // current URL. External / download links are left untouched.
          const href =
            !link.external && link.href.startsWith('#') && !isHome
              ? `/${link.href}`
              : link.href;

          // Use Inertia's Link for in-app navigations so we get an SPA
          // transition. Plain <a> for: external links, downloads, and pure
          // in-page anchors (hash on home) — Link would intercept those
          // and we want native browser behavior.
          const useInertia =
            !link.external && !link.download && !href.startsWith('#');

          return (
            <li key={`${titleKey}-${link.labelKey}`}>
              {useInertia ? (
                <Link href={href} className={styles.columnLink}>
                  {t(link.labelKey)}
                </Link>
              ) : (
                <a
                  href={href}
                  className={styles.columnLink}
                  {...(link.external
                    ? { target: '_blank', rel: 'noreferrer noopener' }
                    : {})}
                  {...(link.download ? { download: link.download } : {})}
                >
                  {t(link.labelKey)}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ----- 3-state theme switcher (System · Light · Dark) ----- */

interface ThemeSwitcherProps {
  preference: ThemePreference;
  onSelect: (next: ThemePreference) => void;
}

function ThemeSwitcher({ preference, onSelect }: ThemeSwitcherProps) {
  const { t } = useTranslation();
  const options: {
    value: ThemePreference;
    labelKey: string;
    icon: ReactElement;
  }[] = [
    { value: 'system', labelKey: 'footer.theme_system', icon: <SystemIcon /> },
    { value: 'light', labelKey: 'footer.theme_light', icon: <SunIcon /> },
    { value: 'dark', labelKey: 'footer.theme_dark', icon: <MoonIcon /> },
  ];

  return (
    <div
      className={styles.themeSwitcher}
      role="radiogroup"
      aria-label={t('footer.themeGroup')}
    >
      {options.map((opt) => {
        const label = t(opt.labelKey);

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={preference === opt.value}
            aria-label={label}
            title={label}
            className={styles.themeBtn}
            data-active={preference === opt.value ? 'true' : 'false'}
            onClick={() => onSelect(opt.value)}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}

function SystemIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

