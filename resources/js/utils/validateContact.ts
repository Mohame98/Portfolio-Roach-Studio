import type {
  ContactFieldError,
  ContactFormValues,
  ContactField,
} from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /https?:\/\//i;

export const BUDGET_OPTIONS: ReadonlyArray<{
  value: ContactFormValues['budget'];
  labelKey: string;
}> = [
  { value: 'under-2k', labelKey: 'form.budget_under2k' },
  { value: '2k-5k', labelKey: 'form.budget_2k5k' },
  { value: '5k-10k', labelKey: 'form.budget_5k10k' },
  { value: '10k-25k', labelKey: 'form.budget_10k25k' },
  { value: '25k-plus', labelKey: 'form.budget_25kplus' },
  { value: 'not-sure', labelKey: 'form.budget_notsure' },
];

export const TIMELINE_OPTIONS: ReadonlyArray<{
  value: ContactFormValues['timeline'];
  labelKey: string;
}> = [
  { value: 'asap', labelKey: 'form.timeline_asap' },
  { value: '1-month', labelKey: 'form.timeline_1month' },
  { value: '1-3-months', labelKey: 'form.timeline_1to3' },
  { value: '3-plus-months', labelKey: 'form.timeline_3plus' },
  { value: 'flexible', labelKey: 'form.timeline_flexible' },
];

export const EMPTY_CONTACT: ContactFormValues = {
  name: '',
  email: '',
  company: '',
  message: '',
  budget: 'not-sure',
  timeline: 'flexible',
  website: '',
};

export function sanitize(value: string): string {
  return value.replace(/\u0000/g, '').trim();
}

/**
 * Client-side validation — UX only. The Laravel backend MUST re-validate
 * every field, re-check the honeypot, and verify the Turnstile/reCAPTCHA
 * token before accepting a submission.
 *
 * Returns error objects whose `message` field holds an i18n key (e.g.
 * `form.err_email_invalid`). The form component translates the key before
 * showing it. Server errors come back as plain strings and are passed
 * through untranslated.
 */
export function validateContact(
  values: ContactFormValues,
): ContactFieldError[] {
  const errors: ContactFieldError[] = [];
  const push = (field: ContactField, key: string) =>
    errors.push({ field, message: key });

  const name = sanitize(values.name);

  if (name.length < 2) {
push('name', 'form.err_name_short');
}

  if (name.length > 80) {
push('name', 'form.err_name_long');
}

  const email = sanitize(values.email);

  if (!email) {
push('email', 'form.err_email_required');
} else if (!EMAIL_RE.test(email)) {
push('email', 'form.err_email_invalid');
} else if (email.length > 160) {
push('email', 'form.err_email_long');
}

  const message = sanitize(values.message);

  if (message.length < 20) {
push('message', 'form.err_message_short');
}

  if (message.length > 4000) {
push('message', 'form.err_message_long');
}

  if (URL_RE.test(message) && message.match(/https?:\/\//gi)!.length > 3) {
push('message', 'form.err_message_links');
}

  const company = sanitize(values.company);

  if (company.length > 120) {
push('company', 'form.err_company_long');
}

  // Honeypot — must be empty. If filled, treat as spam silently on client too.
  if (values.website.trim().length > 0) {
push('website', 'form.err_spam');
}

  return errors;
}

export function errorsFor(
  errors: ContactFieldError[],
  field: ContactField | 'form',
): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

/**
 * Translate an error message if it's a known i18n key; otherwise pass it
 * through unchanged (used for raw server-side messages).
 */
export function translateError(
  message: string | undefined,
  t: (key: string) => string,
): string | undefined {
  if (!message) {
return undefined;
}

  if (message.startsWith('form.err_')) {
    const translated = t(message);

    return translated === message ? message : translated;
  }

  return message;
}
