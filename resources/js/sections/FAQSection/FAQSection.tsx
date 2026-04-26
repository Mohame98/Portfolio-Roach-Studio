import { useState  } from 'react';
import type {ReactNode} from 'react';
import { Reveal } from '@/components/Reveal/Reveal';
import { useTranslation } from '@/i18n/LanguageProvider';
import styles from './FAQSection.module.css';

interface FAQItem {
  id: string;
  questionKey: string;
  answer: ReactNode;
}

const FAQS: FAQItem[] = [
  {
    id: 'services',
    questionKey: 'faq.q_services',
    answer: (
      <>
        <p>
          I build production web applications end-to-end — <strong>Laravel</strong>{' '}
          and <strong>PHP</strong> on the backend, <strong>React</strong> and{' '}
          <strong>TypeScript</strong> on the frontend. Most engagements fall into
          one of three buckets: custom internal tools, marketing sites that need
          real engineering (auth, CMS, payments), and rescue work on existing
          codebases that have drifted.
        </p>
        <p>
          If your stack is WordPress, Next.js, or a PostgreSQL/MySQL-backed API,
          I'm comfortable there too.
        </p>
      </>
    ),
  },
  {
    id: 'process',
    questionKey: 'faq.q_process',
    answer: (
      <>
        <p>
          After a short discovery call I write a one-page scope with fixed
          deliverables, a week-by-week milestone plan, and a clear definition of
          done. You review it, we refine it, and I start.
        </p>
        <p>
          Most projects ship in <strong>2–6 weeks</strong>. Every Friday you get
          a written update with what shipped, what's next, and a live preview
          URL so nothing is a surprise at the end.
        </p>
      </>
    ),
  },
  {
    id: 'pricing',
    questionKey: 'faq.q_pricing',
    answer: (
      <>
        <p>
          I quote flat-rate per milestone, not hourly. That way you pay for
          outcomes, not for me staring at a screen. A typical Full-stack build
          runs <strong>$5k–$25k CAD</strong> depending on scope and integrations.
        </p>
        <p>
          For longer engagements or when scope is genuinely fuzzy, I'll offer a
          weekly retainer instead — same predictability, lower commitment.
        </p>
      </>
    ),
  },
  {
    id: 'team',
    questionKey: 'faq.q_team',
    answer: (
      <>
        <p>
          Often. I've joined teams as a short-term contractor to unblock a
          migration, ship a specific feature, or clean up a Laravel app that has
          grown faster than its architecture. I'm comfortable in other people's
          code — including the parts they'd rather not show you.
        </p>
        <p>
          I work in your tools (Linear, Jira, Slack, GitHub) and review PRs
          against whatever standards your team already follows.
        </p>
      </>
    ),
  },
  {
    id: 'quality',
    questionKey: 'faq.q_quality',
    answer: (
      <>
        <p>
          It means the fundamentals are non-negotiable: typed code end-to-end,
          real tests where they matter, accessibility taken seriously, and a
          deployment pipeline that doesn't rely on me being awake at 2am.
        </p>
        <blockquote className={styles.quote}>
          "Make it work, make it right, make it fast — in that order, and never
          skip the middle step."
        </blockquote>
        <p>
          I'd rather ship one feature that's solid than three that leak into
          production.
        </p>
      </>
    ),
  },
  {
    id: 'after',
    questionKey: 'faq.q_after',
    answer: (
      <>
        <p>
          Every project ends with a handover doc covering the architecture, the
          deploy path, how to rotate secrets, and the gotchas I discovered along
          the way. You also get <strong>30 days of free post-launch support</strong>
          {' '}for bugs and small tweaks.
        </p>
        <p>
          After that, if you want ongoing help, I offer a light monthly retainer
          for maintenance, monitoring, and small features — otherwise we part
          ways cleanly and the code is entirely yours.
        </p>
      </>
    ),
  },
  {
    id: 'getting-started',
    questionKey: 'faq.q_getting_started',
    answer: (
      <>
        <p>
          Send a short note through the contact form with what you're building
          and roughly when you need it. I usually reply within a business day
          with either a <strong>time to chat</strong> or an honest referral if
          it's not a fit.
        </p>
        <p>
          No scope doc required — even a paragraph and a rough budget is enough
          to get the first call going.
        </p>
      </>
    ),
  },
];

export function FAQSection() {
  const { t } = useTranslation();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(['pricing']));

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
next.delete(id);
} else {
next.add(id);
}

      return next;
    });

  return (
    <section
      id="faq"
      className={`section ${styles.section}`}
      aria-labelledby="faq-heading"
    >
      <div className="container">
        <Reveal className={styles.intro}>
          <span className="eyebrow">{t('faq.eyebrow')}</span>
          <h2 id="faq-heading" className={styles.heading}>
            {t('faq.heading')}
          </h2>
          <p className={styles.lede}>{t('faq.lede')}</p>
        </Reveal>

        <div className={styles.list}>
          {FAQS.map((item) => {
            const open = openIds.has(item.id);
            const panelId = `faq-panel-${item.id}`;
            const buttonId = `faq-trigger-${item.id}`;

            return (
              <div
                key={item.id}
                className={styles.item}
                data-open={open ? 'true' : 'false'}
              >
                <h3 className={styles.itemHeading}>
                  <button
                    id={buttonId}
                    type="button"
                    className={styles.trigger}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(item.id)}
                  >
                    <span className={styles.question}>{t(item.questionKey)}</span>
                    <span className={styles.icon} aria-hidden="true">
                      <PlusIcon />
                      <CloseIcon />
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.panel}
                  data-open={open ? 'true' : 'false'}
                  aria-hidden={!open}
                >
                  <div className={styles.panelInner}>{item.answer}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg
      className={styles.iconPlus}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className={styles.iconClose}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
