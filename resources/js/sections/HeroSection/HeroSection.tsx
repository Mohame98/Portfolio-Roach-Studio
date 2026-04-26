import { Button } from '@/components/Button/Button';
import { ShootingStarsGrid } from '@/components/ShootingStarsGrid/ShootingStarsGrid';
import { useTranslation } from '@/i18n/LanguageProvider';
import styles from './HeroSection.module.css';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section id="top" className={styles.section} aria-labelledby="hero-heading">
      <ShootingStarsGrid className={styles.grid} />

      <div className={`container ${styles.inner}`}>
        <span className={`eyebrow ${styles.eyebrow}`}>
          {t('hero.eyebrow')}
        </span>

        <h1 id="hero-heading" className={styles.heading}>
          <span className={styles.accent}> {t('hero.headingAccent')} </span>
          {t('hero.headingTail')}
        </h1>

        <p className={styles.lede}>{t('hero.lede')}</p>

        <div className={styles.ctas}>
          <Button href="#contact" variant="primary" size="lg">
            {t('hero.ctaStart')}
          </Button>
          <Button href="#projects" variant="secondary" size="lg">
            {t('hero.ctaProjects')}
          </Button>
        </div>

        <dl className={styles.stats}>
          <div className={styles.statItem}>
            <dt>{t('hero.statYears')}</dt>
            <dd>{t('hero.statYearsValue')}</dd>
          </div>
          <div className={styles.statItem}>
            <dt>{t('hero.statStack')}</dt>
            <dd>{t('hero.statStackValue')}</dd>
          </div>
          <div className={styles.statItem}>
            <dt>{t('hero.statLocation')}</dt>
            <dd>
              <span className={styles.dot} /> {t('hero.statLocationValue')}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
