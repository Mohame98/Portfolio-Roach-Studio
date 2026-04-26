import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { Carousel  } from '@/components/Carousel/Carousel';
import type {CarouselHandle} from '@/components/Carousel/Carousel';
import { Modal } from '@/components/Modal/Modal';
import { ProjectVisual } from '@/components/ProjectVisual/ProjectVisual';
import { Reveal } from '@/components/Reveal/Reveal';
import { projects } from '@/data/projects';
import { useTranslation } from '@/i18n/LanguageProvider';
import type { Project } from '@/types';
import styles from './ProjectsSection.module.css';

export function ProjectsSection() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? projects[activeIndex] : null;
  const carouselRef = useRef<CarouselHandle | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const [keyHintUsed, setKeyHintUsed] = useState(false);

  const handleClose = useCallback(() => setActiveIndex(null), []);
  const handlePrev = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null ? null : (i - 1 + projects.length) % projects.length,
      ),
    [],
  );
  const handleNext = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null ? null : (i + 1) % projects.length,
      ),
    [],
  );

  // Track whether the projects section is on screen, so the global
  // arrow-key listener only steals focus while it's visible.
  useEffect(() => {
    const node = sectionRef.current;

    if (!node) {
return;
}

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setInView(e.isIntersecting));
      },
      { threshold: 0.25 },
    );
    io.observe(node);

    return () => io.disconnect();
  }, []);

  // Arrow keys move the carousel from anywhere on the page while the
  // projects section is in view and no modal/input is consuming them.
  useEffect(() => {
    if (!inView || activeIndex !== null) {
return;
}

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
return;
}

      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;

      if (tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable) {
return;
}

      e.preventDefault();

      if (e.key === 'ArrowLeft') {
carouselRef.current?.prev();
} else {
carouselRef.current?.next();
}

      setKeyHintUsed(true);
    };
    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, [inView, activeIndex]);

  const slides = projects.map((project, i) => (
    <ProjectCard
      key={project.id}
      project={project}
      onOpen={() => setActiveIndex(i)}
      t={t}
    />
  ));

  return (
    <section
      id="projects"
      ref={sectionRef}
      className={`section ${styles.section}`}
      aria-labelledby="projects-heading"
    >
      <div className="container">
        <Reveal className={styles.intro}>
          <span className="eyebrow">{t('projects.eyebrow')}</span>
          <h2 id="projects-heading" className={styles.heading}>
            {t('projects.heading')}
          </h2>
          <p className={styles.lede}>{t('projects.lede')}</p>

          <div
            className={styles.keyHint}
            data-dismissed={keyHintUsed}
            aria-hidden="true"
          >
            <kbd className={styles.kbd}>
              <ArrowKey direction="left" />
            </kbd>
            <kbd className={styles.kbd}>
              <ArrowKey direction="right" />
            </kbd>
            <span className={styles.keyHintLabel}>{t('projects.arrowKeysLabel')}</span>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120} className={styles.carouselWrap}>
        <Carousel
          ref={carouselRef}
          items={slides}
          ariaLabel={t('projects.carouselAria')}
          peek
          controls="below"
          showDots={false}
          autoPlayMs={0}
          initialIndex={0}
        />
      </Reveal>

      <Modal
        open={active !== null}
        onClose={handleClose}
        title={active?.title ?? ''}
        subtitle={active?.tagline}
        size="xl"
        onPrev={projects.length > 1 ? handlePrev : undefined}
        onNext={projects.length > 1 ? handleNext : undefined}
        prevLabel={t('projects.prevProject')}
        nextLabel={t('projects.nextProject')}
        actions={
          active && active.links[0] ? (
            <Button
              href={active.links[0].href}
              variant="primary"
              size="sm"
              target={
                active.links[0].href.startsWith('#') ? undefined : '_blank'
              }
              rel="noreferrer noopener"
              onClick={
                active.links[0].href.startsWith('#') ? handleClose : undefined
              }
            >
              {active.links[0].label}
            </Button>
          ) : null
        }
      >
        {active && <ProjectCaseStudy project={active} t={t} onCloseModal={handleClose} />}
      </Modal>
    </section>
  );
}

type TFn = (path: string, vars?: Record<string, string | number>) => string;

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  t: TFn;
}

function ProjectCard({ project, onOpen, t }: ProjectCardProps) {
  const cover = project.images[0];

  return (
    <button
      type="button"
      className={styles.card}
      onClick={onOpen}
      aria-label={t('projects.openCaseStudy', { title: project.title })}
    >
      <div className={styles.cardFrame}>
        <ProjectVisual image={cover} title={project.title} compact />

        <div className={styles.cardOverlay}>
          <div className={styles.cardBadgeRow}>
            <span className={styles.status} data-status={project.status}>
              {project.status}
            </span>
            <span className={styles.year}>{project.year}</span>
          </div>

          <div className={styles.cardMeta}>
            <h3 className={styles.cardTitle}>{project.title}</h3>
            <p className={styles.cardTagline}>{project.tagline}</p>

            <ul className={styles.tech}>
              {project.tech.slice(0, 5).map((t) => (
                <li key={t} className={styles.techTag}>
                  {t}
                </li>
              ))}
              {project.tech.length > 5 && (
                <li className={styles.techMore}>+{project.tech.length - 5}</li>
              )}
            </ul>
          </div>

          <span className={styles.cardHint} aria-hidden="true">
            {t('projects.viewCaseStudy')}
            <ArrowIcon />
          </span>
        </div>
      </div>
    </button>
  );
}

function ProjectCaseStudy({
  project,
  t,
  onCloseModal,
}: {
  project: Project;
  t: TFn;
  onCloseModal: () => void;
}) {
  const liveLink = project.links.find((l) => l.kind === 'live');
  const items = project.images.map((image) => {
    const visual = (
      <ProjectVisual image={image} title={project.title} />
    );

    if (!liveLink) {
return <div key={image.label}>{visual}</div>;
}

    return (
      <a
        key={image.label}
        href={liveLink.href}
        target="_blank"
        rel="noreferrer noopener"
        className={styles.caseImageLink}
        aria-label={t('projects.openLiveSite', { title: project.title })}
        data-tooltip={`${t('projects.visitLiveTooltip')}${liveLink.label ? ` — ${liveLink.label}` : ''}`}
        data-tooltip-placement="bottom"
      >
        {visual}
        <span className={styles.caseImageBadge} aria-hidden="true">
          <ExternalLinkIcon />
          {t('projects.visitLive')}
        </span>
      </a>
    );
  });

  return (
    <div className={styles.case}>
      <div className={styles.caseCarousel}>
        <Carousel
          items={items}
          ariaLabel={t('projects.screenshotsAria', { title: project.title })}
          aspectRatio="16 / 10"
          autoPlayMs={0}
        />
      </div>

      <div className={styles.caseGrid}>
        <div>
          <h4 className={styles.caseHeading}>{t('projects.overview')}</h4>
          <p className={styles.caseBody}>{project.summary}</p>

          <h4 className={styles.caseHeading}>{t('projects.highlights')}</h4>
          <ul className={styles.caseList}>
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>

        <aside className={styles.caseAside}>
          <dl className={styles.dl}>
            <dt>{t('projects.role')}</dt>
            <dd>{project.role}</dd>
            <dt>{t('projects.year')}</dt>
            <dd>{project.year}</dd>
            <dt>{t('projects.status')}</dt>
            <dd>{project.status}</dd>
          </dl>

          <div className={styles.caseTechWrap}>
            <span className={styles.caseAsideLabel}>{t('projects.stack')}</span>
            <ul className={styles.caseTech}>
              {project.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          {project.links.length > 0 && (
            <div className={styles.caseLinks}>
              {project.links.map((link) => (
                <Button
                  key={link.label}
                  href={link.href}
                  variant="secondary"
                  size="sm"
                  fullWidth
                  target={link.href.startsWith('#') ? undefined : '_blank'}
                  rel="noreferrer noopener"
                  onClick={
                    link.href.startsWith('#') ? onCloseModal : undefined
                  }
                >
                  {link.label}
                </Button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function ArrowKey({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: direction === 'left' ? 'rotate(180deg)' : undefined,
      }}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
