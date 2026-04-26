import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast/ToastProvider';
import type { SharedProps } from '@/types';

/**
 * Subscribes to Inertia shared `flash` props and surfaces them as toasts.
 *
 * Flash messages are set server-side via `back()->with('status', ...)` or
 * `->with('error', ...)`. The same string can fire on every navigation
 * (Inertia preserves shared props on partial reloads), so we de-dupe by
 * value: only fire when the message *changes* across renders. The empty
 * value resets the guard so the same message can fire again later.
 */
export function useFlashToasts(statusMessage?: string | null): void {
  const { props } = usePage<SharedProps>();
  const toast = useToast();
  const lastStatus = useRef<string | null>(null);
  const lastError = useRef<string | null>(null);

  useEffect(() => {
    const status = props.flash?.status ?? statusMessage ?? null;
    if (status && status !== lastStatus.current) {
      toast.success(status);
    }
    lastStatus.current = status;
  }, [props.flash?.status, statusMessage, toast]);

  useEffect(() => {
    const error = props.flash?.error ?? null;
    if (error && error !== lastError.current) {
      toast.error(error);
    }
    lastError.current = error;
  }, [props.flash?.error, toast]);
}

