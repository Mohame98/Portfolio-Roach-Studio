import { useCallback, useState } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/ConfirmDialog/ConfirmDialog';

type AskOptions = Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'>;

interface PendingPrompt extends AskOptions {
  resolve: (value: { ok: true; note?: string } | { ok: false }) => void;
}

/**
 * useConfirm() returns:
 *   - element: the dialog node — render once near the page root
 *   - ask:     async function that opens the dialog and resolves with the
 *              user's choice (and any optional note from a prompt textarea)
 *
 * Usage:
 *   const { element, ask } = useConfirm();
 *   ...
 *   const result = await ask({ title: 'Delete?', danger: true });
 *   if (!result.ok) return;
 *   // proceed
 *
 * One hook = one dialog, queued by overwrite. Open a second confirm before
 * the first resolves and the first is cancelled — fine for our simple needs.
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingPrompt | null>(null);

  const ask = useCallback(
    (options: AskOptions): Promise<{ ok: true; note?: string } | { ok: false }> => {
      return new Promise((resolve) => {
        // If something was already open, cancel it before opening the next.
        setPending((prev) => {
          prev?.resolve({ ok: false });
          return { ...options, resolve };
        });
      });
    },
    [],
  );

  const onClose = useCallback(() => {
    setPending((prev) => {
      prev?.resolve({ ok: false });
      return null;
    });
  }, []);

  const onConfirm = useCallback((note?: string) => {
    setPending((prev) => {
      prev?.resolve({ ok: true, note });
      return null;
    });
  }, []);

  const element = pending ? (
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title={pending.title}
      description={pending.description}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      danger={pending.danger}
      promptLabel={pending.promptLabel}
      promptPlaceholder={pending.promptPlaceholder}
      promptRequired={pending.promptRequired}
    />
  ) : null;

  return { element, ask };
}
