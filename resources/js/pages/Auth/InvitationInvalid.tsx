import { Head } from '@inertiajs/react';
import styles from './Login.module.css';

interface InvitationInvalidProps {
  reason: 'unknown' | 'pending' | 'accepted' | 'expired' | 'revoked';
}

const COPY: Record<InvitationInvalidProps['reason'], { title: string; body: string }> = {
  unknown: {
    title: 'Invitation not found',
    body: 'This link is invalid. Double-check the URL or ask the person who invited you to send a fresh link.',
  },
  expired: {
    title: 'Invitation expired',
    body: 'This invitation has expired. Ask the person who invited you to send a fresh one.',
  },
  accepted: {
    title: 'Already used',
    body: 'This invitation has already been used. If that wasn\'t you, get in touch with the site owner immediately.',
  },
  revoked: {
    title: 'Invitation revoked',
    body: 'This invitation has been revoked. Ask the person who invited you for a new one if you still need access.',
  },
  pending: {
    title: 'Invitation unavailable',
    body: 'This invitation is not currently usable.',
  },
};

export default function InvitationInvalid({ reason }: InvitationInvalidProps) {
  const copy = COPY[reason] ?? COPY.unknown;

  return (
    <>
      <Head title="Invitation unavailable" />

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

          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.subtitle}>{copy.body}</p>

          <p className={styles.helper}>
            <a href="/" className={styles.link}>← Back to home</a>
          </p>
        </div>
      </main>
    </>
  );
}
