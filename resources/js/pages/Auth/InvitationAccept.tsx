import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/Button/Button';
import styles from './Login.module.css';

interface InvitationAcceptProps {
  token: string;
  email: string;
  role_label: string;
  expires_at: string | null;
}

export default function InvitationAccept({
  token,
  email,
  role_label,
  expires_at,
}: InvitationAcceptProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email,
    password: '',
    password_confirmation: '',
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    post(`/register/invite/${token}`, {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  }

  return (
    <>
      <Head title="Accept invitation" />

      <main className={styles.page}>
        <div className={styles.card}>
          <a href="/" className={styles.brand} aria-label="Back to home">
            <span className={styles.brandMark} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 14V4l5 7 5-7v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 4v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <span>Mohame Roach</span>
          </a>

          <h1 className={styles.title}>Accept invitation</h1>
          <p className={styles.subtitle}>
            You&apos;ve been invited as a <strong>{role_label}</strong>. Set a password to finish
            creating your account.
            {expires_at ? (
              <>
                {' '}This link expires{' '}
                <time dateTime={expires_at}>
                  {new Date(expires_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </time>.
              </>
            ) : null}
          </p>

          <form onSubmit={submit} className={styles.form} noValidate>
            <label className={styles.field}>
              <span className={styles.label}>Your name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                className={styles.input}
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
                maxLength={180}
              />
              {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className={styles.input}
                value={data.email}
                readOnly
              />
              {errors.email ? <span className={styles.error}>{errors.email}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                className={styles.input}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
                minLength={12}
              />
              <span className={styles.hint ?? ''} style={{ fontSize: '12.5px', color: 'var(--text-subtle)', marginTop: 4 }}>
                Minimum 12 characters with mixed case, numbers, and a symbol.
                Checked against known breached-password lists.
              </span>
              {errors.password ? <span className={styles.error}>{errors.password}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Confirm password</span>
              <input
                type="password"
                name="password_confirmation"
                autoComplete="new-password"
                className={styles.input}
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                required
                minLength={12}
              />
            </label>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              chevron={false}
              disabled={processing}
            >
              {processing ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
