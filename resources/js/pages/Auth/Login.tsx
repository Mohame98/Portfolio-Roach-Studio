import { Link, Head, useForm } from '@inertiajs/react';
import { useEffect, type FormEvent } from 'react';
import { Button } from '@/components/Button/Button';
import { useFlashToasts } from '@/hooks/useFlashToasts';
import styles from './Login.module.css';

type RememberedLogin = {
  email: string;
  remember: boolean;
};

const LOGIN_STORAGE_KEY = 'portfolio:login-remember';

function readRememberedLogin(): RememberedLogin {
  if (typeof window === 'undefined') {
    return { email: '', remember: false };
  }

  try {
    const saved = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    if (!saved) return { email: '', remember: false };

    const parsed = JSON.parse(saved) as Partial<RememberedLogin>;
    return {
      email: typeof parsed.email === 'string' ? parsed.email : '',
      remember: parsed.remember === true,
    };
  } catch {
    return { email: '', remember: false };
  }
}

function saveRememberedLogin(email: string, remember: boolean): void {
  if (typeof window === 'undefined') return;

  if (!remember) {
    window.localStorage.removeItem(LOGIN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify({ email, remember }));
}

interface LoginProps {
  status?: string | null;
}

export default function Login({ status }: LoginProps) {
  useFlashToasts(status);

  const rememberedLogin = readRememberedLogin();
  const { data, setData, post, processing, errors, reset, clearErrors, dontRemember } = useForm('login', {
    email: rememberedLogin.email,
    password: '',
    remember: rememberedLogin.remember,
  });

  useEffect(() => {
    dontRemember('password');
    reset('password');
    clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveRememberedLogin(data.email, data.remember);
  }, [data.email, data.remember]);

  function submit(e: FormEvent) {
    e.preventDefault();

    // Fortify's session controller lives at POST /login. On success it
    // redirects to the configured `home` (/dashboard by default) — we can
    // land admins on /admin/blog-posts by following up manually if needed,
    // but Fortify will handle the 302 itself.
    post('/login', {
      onFinish: () => reset('password'),
    });
  }

  return (
    <>
      <Head title="Sign in" />

      <main className={styles.page}>
        <div className={styles.card}>
          <Link href="/" className={styles.brand} aria-label="Back to home">
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
          </Link>

          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.subtitle}>
            Admin access for authoring blog posts. Not a public sign-up —
            there&apos;s no account to create.
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
              />
              {errors.email ? (
                <span className={styles.error}>{errors.email}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className={styles.input}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
              />
              {errors.password ? (
                <span className={styles.error}>{errors.password}</span>
              ) : null}
            </label>

            <label className={styles.remember}>
              <input
                type="checkbox"
                name="remember"
                value="1"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
              />
              <span>Remember me on this device</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              chevron={false}
              disabled={processing}
            >
              {processing ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className={styles.helper}>
              <Link href="/forgot-password" className={styles.link}>
                Forgot your password?
              </Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}




