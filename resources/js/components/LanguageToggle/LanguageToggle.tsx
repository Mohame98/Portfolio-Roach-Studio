import { LANGUAGES, useTranslation  } from '@/i18n/LanguageProvider';
import type {Language} from '@/i18n/LanguageProvider';
import styles from './LanguageToggle.module.css';

export function LanguageToggle() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div
      className={styles.group}
      role="radiogroup"
      aria-label={t('header.languageGroup')}
    >
      {LANGUAGES.map((opt) => {
        const active = lang === opt.value;
        const aria = t('header.switchLanguageTo', { lang: opt.label });

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={aria}
            title={aria}
            className={styles.btn}
            data-active={active ? 'true' : 'false'}
            onClick={() => setLang(opt.value as Language)}
          >
            {opt.short}
          </button>
        );
      })}
    </div>
  );
}
