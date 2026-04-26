import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  title: string;
  /** Body copy. Plain string or any node. */
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true the confirm button is rendered in the danger color. */
  danger?: boolean;
  /**
   * When provided, renders a textarea so the operator can attach a note.
   * The note is passed to onConfirm(). Useful for "reject post" flows where
   * the writer benefits from a reason.
   */
  promptLabel?: string;
  promptPlaceholder?: string;
  promptRequired?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Minimal confirmation dialog with the same chrome as the Login card —
 * purposely simpler than `Modal` (no prev/next, no large header). Focus
 * is trapped, Esc closes, Enter confirms (unless focus is in the textarea).
 *
 * Used in place of window.confirm / window.prompt so admin actions get a
 * UI that matches the rest of the app instead of an OS-style alert.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  promptLabel,
  promptPlaceholder,
  promptRequired = false,
}: ConfirmDialogProps) {
  const headingId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [note, setNote] = useState<string>('');

  // Reset the note each time the dialog reopens — old text from a previous
  // prompt should never leak into the next one.
  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  const handleConfirm = useCallback(() => {
    if (promptLabel && promptRequired && note.trim() === '') {
      textareaRef.current?.focus();
      return;
    }
    onConfirm(promptLabel ? note : undefined);
  }, [note, onConfirm, promptLabel, promptRequired]);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    document.body.dataset.modalOpen = 'true';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        // Don't hijack Enter while typing in the textarea — let it newline.
        if (tag !== 'TEXTAREA') {
          e.preventDefault();
          handleConfirm();
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
    // Focus the panel after paint so the entrance animation doesn't fight
    // the focus call. If we have a prompt, focus the textarea instead so
    // the operator can start typing immediately.
    const raf = requestAnimationFrame(() => {
      if (promptLabel && textareaRef.current) {
        textareaRef.current.focus();
      } else {
        panelRef.current?.focus();
      }
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
      delete document.body.dataset.modalOpen;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose, handleConfirm, promptLabel]);

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
      >
        <h3 id={headingId} className={styles.title}>{title}</h3>
        {description ? (
          <p id={descId} className={styles.description}>{description}</p>
        ) : null}

        {promptLabel ? (
          <label className={styles.field}>
            <span className={styles.label}>{promptLabel}</span>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={promptPlaceholder}
              rows={3}
            />
          </label>
        ) : null}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? styles.danger : styles.confirm}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
