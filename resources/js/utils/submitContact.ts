import type {
  ContactFieldError,
  ContactFormValues,
  ContactSubmitResult,
} from '@/types';
import { sanitize } from './validateContact';

/**
 * Contact-form integration layer.
 *
 * The endpoint is read from VITE_CONTACT_ENDPOINT (e.g.
 * "https://api.mohameroach.com/api/contact"). The Laravel backend is the
 * authoritative validator: it MUST re-check every field, verify the
 * Turnstile/reCAPTCHA token, enforce a rate limit by IP, and confirm the
 * honeypot is empty.
 *
 * Expected Laravel response shape:
 *   200 { ok: true }
 *   422 { ok: false, errors: [{ field: "email", message: "..." }] }
 *   429 { ok: false, message: "Too many requests" }
 */

const ENDPOINT =
  (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined) ?? '/api/contact';

interface BackendErrorResponse {
  ok?: boolean;
  message?: string;
  errors?: ContactFieldError[];
}

function readCsrfCookie(): string | null {
  // Laravel Sanctum sets XSRF-TOKEN when same-origin.
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function submitContact(
  values: ContactFormValues,
  turnstileToken?: string,
): Promise<ContactSubmitResult> {
  const payload = {
    name: sanitize(values.name),
    email: sanitize(values.email),
    company: sanitize(values.company),
    message: sanitize(values.message),
    budget: values.budget,
    timeline: values.timeline,
    // Honeypot — real users never fill this.
    website: values.website,
    // Bot-protection token (Cloudflare Turnstile preferred).
    turnstile_token: turnstileToken ?? '',
    // Lightweight fingerprint — backend can use with rate limit.
    locale: navigator.language,
    submitted_at: new Date().toISOString(),
  };

  const csrf = readCsrfCookie();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (csrf) headers['X-XSRF-TOKEN'] = csrf;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    });

    if (res.ok) return { ok: true };

    let data: BackendErrorResponse = {};
    try {
      data = (await res.json()) as BackendErrorResponse;
    } catch {
      /* non-JSON body — fall through */
    }

    if (res.status === 429) {
      return {
        ok: false,
        message:
          data.message ??
          'Too many requests right now. Please try again in a minute.',
      };
    }

    if (res.status === 422 && Array.isArray(data.errors)) {
      return { ok: false, errors: data.errors };
    }

    return {
      ok: false,
      message:
        data.message ??
        'Something went wrong sending your message. Please try again.',
    };
  } catch {
    return {
      ok: false,
      message:
        'Network error. Please check your connection and try again, or email directly.',
    };
  }
}
