import { Link, Head, useForm } from '@inertiajs/react';
import { useEffect, type FormEvent } from 'react';
import { Button } from '@/components/Button/Button';
import { useToast } from '@/components/Toast/ToastProvider';
import styles from './Login.module.css';

const LOGIN_STORAGE_KEY = 'portfolio:login-remember';

function readRememberedEmail(): string {
  if (typeof window === 'undefined') return '';

  try {
    const saved = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    if (!saved) return '';

    const parsed = JSON.parse(saved) as { email?: unknown };
    return typeof parsed.email === 'string' ? parsed.email : '';
  } catch {
    return '';
  }
}

interface ForgotPasswordProps {
  status?: string | null;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
  const toast = useToast();

  const { data, setData, post, processing, errors, clearErrors } = useForm('forgot-password', {
    email: readRememberedEmail(),
  });

  useEffect(() => {
    clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();

    // Fortify redirects back through Inertia, so the Network tab usually ends
    // on 200 OK even when the SMTP transport failed. Read the returned page
    // props and show the exact outcome to the user.
    post('/forgot-password', {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page.props.flash as { status?: string | null; error?: string | null } | undefined;

        if (flash?.error) {
          toast.error(flash.error);
          return;
        }

        toast.success(flash?.status ?? status ?? 'If that email is registered, a reset link has been sent.');
      },
      onError: (validationErrors) => {
        const message = typeof validationErrors.email === 'string'
          ? validationErrors.email
          : 'We could not send the reset email. Please check the email address and mail settings.';

        toast.error(message);
      },
    });
  }

  return (
    <>
      <Head title="Forgot password" />

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

          <h1 className={styles.title}>Forgot your password?</h1>
          <p className={styles.subtitle}>
            Enter the email on your admin account and we&apos;ll send a reset
            link. The link expires after 60 minutes.
          </p>

          {status ? <p className={styles.status} role="status">{status}</p> : null}

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
                autoFocus
              />
              {errors.email ? (
                <span className={styles.error}>{errors.email}</span>
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
              {processing ? 'Sending...' : 'Email reset link'}
            </Button>

            <p className={styles.helper}>
              <Link href="/login" className={styles.link}>
                Back to sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
