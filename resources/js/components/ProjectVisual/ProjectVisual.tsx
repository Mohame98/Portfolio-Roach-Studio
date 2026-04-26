import type { ProjectImage } from '@/types';
import styles from './ProjectVisual.module.css';

interface ProjectVisualProps {
  image: ProjectImage;
  title: string;
  compact?: boolean;
}

/**
 * Renders a framed project "screenshot". When `image.src` is provided the
 * real asset is shown with object-fit: cover; otherwise a programmatic
 * motif is rendered inline. Chrome is a generic, unbranded browser frame
 * (no macOS traffic lights, no `.app` URL bar).
 */
export function ProjectVisual({ image, title, compact }: ProjectVisualProps) {
  const [bg, fg] = image.palette;
  const hasImage = Boolean(image.src);

  return (
    <figure
      className={[styles.frame, compact ? styles.compact : ''].join(' ')}
      style={{
        ['--visual-bg' as string]: bg,
        ['--visual-fg' as string]: fg,
      }}
    >
      <div className={styles.chrome} aria-hidden="true">
        <span className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
        <span className={styles.urlbar}>{title.toLowerCase()}</span>
      </div>

      <div className={[styles.canvas, hasImage ? styles.canvasImage : ''].join(' ')}>
        {hasImage ? (
          <img
            src={image.src}
            alt={`${title} — ${image.label}`}
            className={styles.image}
            style={{ objectPosition: image.focus ?? 'center top' }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Motif motif={image.motif} />
        )}
        <div className={styles.labelTag}>
          <span className={styles.labelDot} />
          {image.label}
        </div>
      </div>

      {!compact && <figcaption className={styles.caption}>{image.caption}</figcaption>}
    </figure>
  );
}

function Motif({ motif }: { motif: ProjectImage['motif'] }) {
  switch (motif) {
    case 'code':
      return <CodeMotif />;
    case 'dashboard':
      return <DashboardMotif />;
    case 'auth':
      return <AuthMotif />;
    case 'editor':
      return <EditorMotif />;
    case 'feed':
      return <FeedMotif />;
    case 'chart':
      return <ChartMotif />;
    default:
      return null;
  }
}

function Bar({ w, className }: { w: number; className?: string }) {
  return (
    <span
      className={[styles.bar, className].filter(Boolean).join(' ')}
      style={{ width: `${w}%` }}
    />
  );
}

function CodeMotif() {
  return (
    <div className={styles.code}>
      <div className={styles.codeLine}>
        <span className={styles.kw}>const</span>{' '}
        <span className={styles.id}>user</span> ={' '}
        <span className={styles.fn}>auth</span>.<span className={styles.id}>user</span>();
      </div>
      <div className={styles.codeLine}>
        <span className={styles.kw}>if</span> (!
        <span className={styles.id}>user</span>-&gt;
        <span className={styles.fn}>verified</span>) {'{'}
      </div>
      <div className={styles.codeLine} style={{ paddingLeft: 16 }}>
        <span className={styles.kw}>return</span>{' '}
        <span className={styles.str}>'401'</span>;
      </div>
      <div className={styles.codeLine}>{'}'}</div>
      <div className={styles.codeLine}>
        <span className={styles.kw}>return</span>{' '}
        <span className={styles.id}>Post</span>::
        <span className={styles.fn}>feed</span>($user);
      </div>
      <div className={`${styles.codeLine} ${styles.caret}`}>&nbsp;</div>
    </div>
  );
}

function DashboardMotif() {
  return (
    <div className={styles.dash}>
      <div className={styles.dashRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>MRR</span>
          <span className={styles.statValue}>$42.1k</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Users</span>
          <span className={styles.statValue}>1,284</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Retention</span>
          <span className={styles.statValue}>92%</span>
        </div>
      </div>
      <div className={styles.dashChart}>
        {[60, 45, 72, 58, 80, 65, 88, 74, 92].map((h, i) => (
          <span
            key={i}
            className={styles.chartBar}
            style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function AuthMotif() {
  return (
    <div className={styles.auth}>
      <div className={styles.authCard}>
        <div className={styles.authTitle}>Sign in</div>
        <div className={styles.authField}>
          <span className={styles.authLabel}>Email</span>
          <Bar w={90} />
        </div>
        <div className={styles.authField}>
          <span className={styles.authLabel}>Password</span>
          <Bar w={70} />
        </div>
        <div className={styles.authButton}>Continue</div>
      </div>
    </div>
  );
}

function EditorMotif() {
  return (
    <div className={styles.editor}>
      <Bar w={70} className={styles.barH1} />
      <Bar w={40} className={styles.barMeta} />
      <Bar w={95} />
      <Bar w={88} />
      <Bar w={92} />
      <Bar w={60} />
      <Bar w={80} />
    </div>
  );
}

function FeedMotif() {
  return (
    <div className={styles.feed}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.feedItem}>
          <span className={styles.avatar} />
          <div className={styles.feedLines}>
            <Bar w={55} className={styles.barTitle} />
            <Bar w={88} />
            <Bar w={72} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartMotif() {
  return (
    <svg
      viewBox="0 0 320 180"
      className={styles.chart}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 60, 90, 120, 150].map((y) => (
        <line
          key={y}
          x1="0"
          x2="320"
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeDasharray="2 4"
        />
      ))}
      <path
        d="M0 140 L40 120 L80 130 L120 90 L160 105 L200 70 L240 55 L280 40 L320 30 L320 180 L0 180 Z"
        fill="url(#area)"
      />
      <path
        d="M0 140 L40 120 L80 130 L120 90 L160 105 L200 70 L240 55 L280 40 L320 30"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
