import { ContactForm } from '@/components/ContactForm/ContactForm';
import { Reveal } from '@/components/Reveal/Reveal';
import { useTranslation } from '@/i18n/LanguageProvider';
import styles from './ContactSection.module.css';

export function ContactSection() {
  const { t } = useTranslation();

  return (
    <section
      id="contact"
      className={`section ${styles.section}`}
      aria-labelledby="contact-heading"
    >
      <div className={`container ${styles.grid}`}>
        <Reveal as="div" className={styles.intro}>
          <span className="eyebrow">{t('contact.eyebrow')}</span>
          <h2 id="contact-heading" className={styles.heading}>
            {t('contact.headingStart')}
            <span className={styles.headingAccent}> {t('contact.headingAccent')}</span>
          </h2>
          <p className={styles.lede}>{t('contact.lede')}</p>

          <ul className={styles.meta}>
            <li>
              <span className={styles.metaLabel}>{t('contact.metaEmail')}</span>
              <a href="mailto:mohamekroach@gmail.com" className={styles.metaValue}>
                mohamekroach@gmail.com
              </a>
            </li>
            <li>
              <span className={styles.metaLabel}>{t('contact.metaLocation')}</span>
              <span className={styles.metaValue}>{t('contact.metaLocationValue')}</span>
            </li>
            <li>
              <span className={styles.metaLabel}>{t('contact.metaAvailability')}</span>
              <span className={styles.metaValue}>
                <span className={styles.dot} aria-hidden="true" />
                {t('contact.metaAvailabilityValue')}
              </span>
            </li>
          </ul>

          <div className={styles.socials}>
            <a
              className={styles.socialLink}
              href="https://github.com/Mohame98"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('contact.github')}
            </a>
            <a
              className={styles.socialLink}
              href="https://www.linkedin.com/in/mohame-roach/"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('contact.linkedin')}
            </a>
          </div>
        </Reveal>

        
        <div className={styles.formCard} aria-hidden="true">
          <ContactForm />
        </div> 
          
      </div>
    </section>
  );
}
