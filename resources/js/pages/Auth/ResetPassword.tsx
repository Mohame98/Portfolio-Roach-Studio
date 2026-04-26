import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/Button/Button';
import styles from './Login.module.css';

interface ResetPasswordProps {
  token: string;
  email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password: '',
    password_confirmation: '',
  });

  function submit(e: FormEvent) {
    e.preventDefault();

    // Fortify's POST /reset-password validates the token+email against the
    // password-resets table. On success it logs the user in and redirects.
    post('/reset-password', {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  }

  return (
    <>
      <Head title="Reset password" />

      <main className={styles.page}>
        <div className={styles.card}>
          <a href="/login" className={styles.brand} aria-label="Back to sign in">
            <span className={styles.brandMark} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
            <span>Mohame Roach</span>
          </a>

          <h1 className={styles.title}>Choose a new password</h1>
          <p className={styles.subtitle}>
            Pick something you haven&apos;t used elsewhere. After saving you
            will be signed in automatically.
          </p>

          <form onSubmit={submit} className={styles.form} noValidate>
            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className={styles.input}
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
                readOnly
              />
              {errors.email ? (
                <span className={styles.error}>{errors.email}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>New password</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                className={styles.input}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
                minLength={8}
                autoFocus
              />
              {errors.password ? (
                <span className={styles.error}>{errors.password}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Confirm new password</span>
              <input
                type="password"
                name="password_confirmation"
                autoComplete="new-password"
                className={styles.input}
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                required
                minLength={8}
              />
              {errors.password_confirmation ? (
                <span className={styles.error}>{errors.password_confirmation}</span>
              ) : null}
            </label>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              chevron={false}
              disabled={processing}
            >
              {processing ? 'Saving…' : 'Reset password'}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
