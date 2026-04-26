import { Head } from '@inertiajs/react';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/i18n/LanguageProvider';
import { ContactSection } from '@/sections/ContactSection/ContactSection';
import { FAQSection } from '@/sections/FAQSection/FAQSection';
import { HeroSection } from '@/sections/HeroSection/HeroSection';
import { ProjectsSection } from '@/sections/ProjectsSection/ProjectsSection';
import { ResumeSection } from '@/sections/ResumeSection/ResumeSection';

export default function Home() {
  const { preference, setPreference } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Head title={t('meta.homeTitle')} />
      <a href="#main" className="visually-hidden">
        {t('meta.skipToContent')}
      </a>
      <Header />
      <main id="main">
        <HeroSection />
        <ProjectsSection />
        <ResumeSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer preference={preference} onSelectPreference={setPreference} />
    </>
  );
}
