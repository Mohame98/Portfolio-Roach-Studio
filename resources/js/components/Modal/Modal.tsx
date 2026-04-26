import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  /** Optional actions rendered in the header. */
  actions?: React.ReactNode;
  /** When provided, renders prev/next buttons (and binds arrow keys)
   *  for cycling the modal's subject — e.g. the next project. */
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
}

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable=true]';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'lg',
  children,
  actions,
  onPrev,
  onNext,
  prevLabel = 'Previous',
  nextLabel = 'Next',
}: ModalProps) {
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement;
    document.body.dataset.modalOpen = 'true';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && onPrev && !e.defaultPrevented) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          onPrev();
          return;
        }
      }
      if (e.key === 'ArrowRight' && onNext && !e.defaultPrevented) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          onNext();
          return;
        }
      }
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const nodes = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (nodes.length === 0) {
          e.preventDefault();
          panel.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    // Focus the panel after paint so transition doesn't fight it.
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
      delete document.body.dataset.modalOpen;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose, onPrev, onNext]);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={onBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={panelRef}
        className={styles.panel}
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div className={styles.headingStack}>
            <h3 id={headingId} className={styles.title}>
              {title}
            </h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.headerActions}>
            {actions}
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close dialog"
              data-tooltip="Close"
              data-tooltip-placement="bottom"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <div className={styles.body}>{children}</div>
      </div>

      {onPrev && (
        <button
          type="button"
          className={`${styles.nav} ${styles.navPrev}`}
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label={prevLabel}
          data-tooltip={prevLabel}
          data-tooltip-placement="bottom"
        >
          <ArrowIcon direction="left" />
        </button>
      )}
      {onNext && (
        <button
          type="button"
          className={`${styles.nav} ${styles.navNext}`}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label={nextLabel}
          data-tooltip={nextLabel}
          data-tooltip-placement="bottom"
        >
          <ArrowIcon direction="right" />
        </button>
      )}
    </div>,
    document.body,
  );
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: direction === 'left' ? 'rotate(180deg)' : undefined,
      }}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
