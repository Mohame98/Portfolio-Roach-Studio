import { useState } from 'react';
import { Button } from '@/components/Button/Button';
import { Modal } from '@/components/Modal/Modal';
import { Reveal } from '@/components/Reveal/Reveal';
import { useTranslation } from '@/i18n/LanguageProvider';
import styles from './ResumeSection.module.css';

const RESUME_URL = '/Mohame_Roach_Resume.pdf';
const RESUME_FILENAME = 'Mohame_Roach_Resume.pdf';

const HIGHLIGHT_KEYS = [
  'resume.highlight1',
  'resume.highlight2',
  'resume.highlight3',
  'resume.highlight4',
] as const;

export function ResumeSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <section
      id="resume"
      className={`section ${styles.section}`}
      aria-labelledby="resume-heading"
    >
      <div className={`container ${styles.inner}`}>
        <Reveal className={styles.copy}>
          <span className="eyebrow">{t('resume.eyebrow')}</span>
          <h2 id="resume-heading" className={styles.heading}>
            {t('resume.headingStart')}{' '}
            <span className={styles.dim}>{t('resume.headingEnd')}</span>
          </h2>
          <p className={styles.lede}>{t('resume.lede')}</p>

          <ul className={styles.highlights}>
            {HIGHLIGHT_KEYS.map((key) => (
              <li key={key}>
                <CheckIcon />
                {t(key)}
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Button variant="primary" size="md" onClick={() => setOpen(true)}>
              {t('resume.viewFull')}
            </Button>
            <Button
              href={RESUME_URL}
              variant="secondary"
              size="md"
              chevron={false}
              leadingIcon={<DownloadIcon />}
              download={RESUME_FILENAME}
              rel="noreferrer noopener"
            >
              {t('resume.downloadPdf')}
            </Button>
          </div>
        </Reveal>

        <Reveal delay={120} variant="slide-right" className={styles.previewWrap}>
          <button
            type="button"
            className={styles.preview}
            onClick={() => setOpen(true)}
            aria-label={t('resume.openFull')}
          >
            <div className={styles.previewFrame}>
              <iframe
                src={`${RESUME_URL}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                title={t('resume.previewTitle')}
                className={styles.previewPdf}
                loading="lazy"
                aria-hidden="true"
                tabIndex={-1}
              />
              <div className={styles.previewFallback} aria-hidden="true">
                <div className={styles.previewDocLine} style={{ width: '60%' }} />
                <div className={styles.previewDocLine} style={{ width: '85%' }} />
                <div className={styles.previewDocLine} style={{ width: '75%' }} />
                <div className={styles.previewDocLine} style={{ width: '90%' }} />
                <div className={styles.previewDocLine} style={{ width: '70%' }} />
                <div className={styles.previewDocLine} style={{ width: '82%' }} />
              </div>
            </div>
            <div className={styles.previewOverlay}>
              <span className={styles.previewBadge}>
                <ExpandIcon />
                {t('resume.clickExpand')}
              </span>
              <span className={styles.previewMeta}>
                <span className={styles.previewDot} />
                {t('resume.pdfMeta')}
              </span>
            </div>
          </button>
        </Reveal>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('resume.modalTitle')}
        subtitle={t('resume.modalSubtitle')}
        size="xl"
        actions={
          <Button
            href={RESUME_URL}
            variant="primary"
            size="sm"
            chevron={false}
            leadingIcon={<DownloadIcon />}
            download={RESUME_FILENAME}
            rel="noreferrer noopener"
          >
            {t('resume.download')}
          </Button>
        }
      >
        <div className={styles.modalViewer}>
          <object
            data={`${RESUME_URL}#view=FitH&toolbar=1`}
            type="application/pdf"
            className={styles.modalPdf}
            aria-label={t('resume.pdfAria')}
          >
            <iframe
              src={`${RESUME_URL}#view=FitH`}
              title={t('resume.iframeTitle')}
              className={styles.modalPdf}
              loading="lazy"
            />
            <div className={styles.modalFallback}>
              <p>
                {t('resume.fallbackIntro')}
                <a href={RESUME_URL} target="_blank" rel="noreferrer noopener">
                  {t('resume.fallbackOpenTab')}
                </a>
                {t('resume.fallbackOr')}
                <a href={RESUME_URL} download={RESUME_FILENAME}>
                  {t('resume.fallbackDownload')}
                </a>
                {t('resume.fallbackEnd')}
              </p>
            </div>
          </object>
        </div>
      </Modal>
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
