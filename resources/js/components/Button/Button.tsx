import { Link } from '@inertiajs/react';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show the trailing chevron. Defaults to true. */
  chevron?: boolean;
  /** Optional leading icon node rendered before the label. */
  leadingIcon?: ReactNode;
  /** Stretch to fill its container width. */
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

type AnchorProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

type NativeButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type ButtonProps = AnchorProps | NativeButtonProps;

/**
 * Pill button in two variants:
 *   - primary   = cream/white fill with dark text (main CTA)
 *   - secondary = dark surface with white text and subtle border (alt CTA)
 *
 * Renders an <a> when `href` is provided, otherwise a <button>.
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    chevron = true,
    leadingIcon,
    fullWidth,
    children,
    className,
    ...rest
  } = props;

  const classes = [
    styles.btn,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {leadingIcon && <span className={styles.leading}>{leadingIcon}</span>}
      <span className={styles.label}>{children}</span>
      {chevron && <ChevronIcon />}
    </>
  );

  if ('href' in rest && rest.href !== undefined) {
    const anchorRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    const href = anchorRest.href ?? '';
    const isInternal =
      href.startsWith('/') && !href.startsWith('//') && !anchorRest.target;

    if (isInternal) {
      const { href: _href, ...linkRest } = anchorRest;
      return (
        <Link
          href={href}
          className={classes}
          {...(linkRest as Record<string, unknown>)}
        >
          {content}
        </Link>
      );
    }

    return (
      <a className={classes} {...anchorRest}>
        {content}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} type={buttonRest.type ?? 'button'} {...buttonRest}>
      {content}
    </button>
  );
}

function ChevronIcon() {
  return (
    <svg
      className={styles.chevron}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
