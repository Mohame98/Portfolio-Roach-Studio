import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { useToast } from '@/components/Toast/ToastProvider';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useTranslation } from '@/i18n/LanguageProvider';
import type {
  ContactField,
  ContactFieldError,
  ContactFormValues,
} from '@/types';
import { submitContact } from '@/utils/submitContact';
import {
  BUDGET_OPTIONS,
  EMPTY_CONTACT,
  TIMELINE_OPTIONS,
  errorsFor,
  translateError,
  validateContact,
} from '@/utils/validateContact';
import styles from './ContactForm.module.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm() {
  const baseId = useId();
  const toast = useToast();
  const { t } = useTranslation();

  const [values, setValues] = useState<ContactFormValues>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactFieldError[]>([]);
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>(
    {},
  );
  const [status, setStatus] = useState<Status>('idle');

  const turnstile = useTurnstile({
    siteKey: TURNSTILE_SITE_KEY,
    action: 'contact',
  });

  const showError = (field: ContactField): string | undefined => {
    if (!touched[field] && status !== 'error') {
return undefined;
}

    return translateError(errorsFor(errors, field), t);
  };

  const update =
    <K extends ContactField>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const next = e.target.value as ContactFormValues[K];
      setValues((v) => ({ ...v, [field]: next }));
    };

  const markTouched = (field: ContactField) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  const charCount = values.message.length;
  const charLimit = 4000;

  const submitDisabled = status === 'submitting' || status === 'success';

  const ids = useMemo(
    () => ({
      name: `${baseId}-name`,
      email: `${baseId}-email`,
      company: `${baseId}-company`,
      message: `${baseId}-message`,
      budget: `${baseId}-budget`,
      timeline: `${baseId}-timeline`,
      website: `${baseId}-website`,
    }),
    [baseId],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitDisabled) {
return;
}

    const nextErrors = validateContact(values);
    setErrors(nextErrors);
    setTouched({
      name: true,
      email: true,
      company: true,
      message: true,
      budget: true,
      timeline: true,
      website: true,
    });

    if (nextErrors.length > 0) {
      setStatus('error');
      toast.error(t('form.toastCheckMsg'), {
        title: t('form.toastCheckTitle'),
      });

      return;
    }

    if (TURNSTILE_SITE_KEY && !turnstile.token) {
      setStatus('error');
      toast.error(turnstile.error ?? t('form.toastBotMsg'), {
        title: t('form.toastBotTitle'),
      });

      return;
    }

    setStatus('submitting');

    const result = await submitContact(values, turnstile.token ?? undefined);

    if (result.ok) {
      setStatus('success');
      toast.success(t('form.toastSentMsg'), {
        title: t('form.toastSentTitle'),
      });
      setValues(EMPTY_CONTACT);
      setTouched({});
      setErrors([]);
      turnstile.reset();

      return;
    }

    setStatus('error');
    turnstile.reset();

    if (result.errors && result.errors.length > 0) {
      setErrors(result.errors);
      toast.error(t('form.toastCheckMsg'), {
        title: t('form.toastCheckTitle'),
      });
    } else {
      toast.error(result.message ?? t('form.toastErrMsg'), {
        title: t('form.toastErrTitle'),
      });
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.grid}>
        <Field
          id={ids.name}
          label={t('form.nameLabel')}
          error={showError('name')}
          className={styles.colHalf}
        >
          <input
            id={ids.name}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            value={values.name}
            onChange={update('name')}
            onBlur={markTouched('name')}
            aria-invalid={Boolean(showError('name'))}
            className={styles.input}
            placeholder={t('form.namePlaceholder')}
          />
        </Field>

        <Field
          id={ids.email}
          label={t('form.emailLabel')}
          error={showError('email')}
          className={styles.colHalf}
        >
          <input
            id={ids.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={160}
            value={values.email}
            onChange={update('email')}
            onBlur={markTouched('email')}
            aria-invalid={Boolean(showError('email'))}
            className={styles.input}
            placeholder={t('form.emailPlaceholder')}
          />
        </Field>

        <Field
          id={ids.company}
          label={t('form.companyLabel')}
          hint={t('form.companyHint')}
          error={showError('company')}
          className={styles.colFull}
        >
          <input
            id={ids.company}
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={120}
            value={values.company}
            onChange={update('company')}
            onBlur={markTouched('company')}
            aria-invalid={Boolean(showError('company'))}
            className={styles.input}
            placeholder={t('form.companyPlaceholder')}
          />
        </Field>

        <Field
          id={ids.budget}
          label={t('form.budgetLabel')}
          className={styles.colHalf}
        >
          <select
            id={ids.budget}
            name="budget"
            value={values.budget}
            onChange={update('budget')}
            className={styles.select}
          >
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </Field>

        <Field id={ids.timeline} label={t('form.timelineLabel')} className={styles.colHalf}>
          <select
            id={ids.timeline}
            name="timeline"
            value={values.timeline}
            onChange={update('timeline')}
            className={styles.select}
          >
            {TIMELINE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={ids.message}
          label={t('form.messageLabel')}
          hint={`${charCount} / ${charLimit}`}
          error={showError('message')}
          className={styles.colFull}
        >
          <textarea
            id={ids.message}
            name="message"
            required
            rows={6}
            maxLength={charLimit}
            value={values.message}
            onChange={update('message')}
            onBlur={markTouched('message')}
            aria-invalid={Boolean(showError('message'))}
            className={styles.textarea}
            placeholder={t('form.messagePlaceholder')}
          />
        </Field>

        {/* Honeypot — visually and a11y-hidden. Real users never fill this. */}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={ids.website}>{t('form.honeypotLabel')}</label>
          <input
            id={ids.website}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={update('website')}
          />
        </div>
      </div>

      {TURNSTILE_SITE_KEY && (
        <div
          ref={turnstile.ref}
          className={styles.turnstile}
          data-ready={turnstile.ready}
          aria-label={t('form.botCheckAria')}
        />
      )}

      <div className={styles.footer}>
        <Button
          type="submit"
          variant="primary"
          size="md"
          chevron={status === 'idle' || status === 'error'}
          disabled={submitDisabled}
          data-status={status}
          className={styles.submit}
        >
          {status === 'submitting'
            ? t('form.submitSending')
            : status === 'success'
              ? t('form.submitSent')
              : t('form.submitIdle')}
        </Button>
        <p className={styles.privacy}>{t('form.privacy')}</p>
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

function Field({ id, label, hint, error, className, children }: FieldProps) {
  return (
    <div
      className={[styles.field, className, error ? styles.fieldError : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && (
          <span className={styles.errorMsg} id={`${id}-error`} role="alert">
            {error}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

