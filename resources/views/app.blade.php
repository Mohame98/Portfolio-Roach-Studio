<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0b0d12" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#f7f7f8" media="(prefers-color-scheme: light)" />

    <title inertia>Mohame Roach | Full-Stack Web Developer</title>
    <meta
      name="description"
      content="Mohame Roach is a full-stack web developer in Montreal building Laravel backends, custom websites, and scalable web applications. Available for freelance and contract work."
    />
    <meta name="author" content="Mohame Roach" />
    <meta
      name="keywords"
      content="full-stack developer Montreal, Laravel developer, React developer, custom websites, web applications, freelance developer"
    />
    <link rel="canonical" href="https://mohameroach.com/" />

    {{-- Open Graph --}}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Mohame Roach" />
    <meta property="og:title" content="Mohame Roach | Full-Stack Web Developer in Montreal" />
    <meta
      property="og:description"
      content="Laravel, React, and scalable web applications. Freelance and contract work based in Montreal."
    />
    <meta property="og:url" content="https://mohameroach.com/" />
    <meta property="og:image" content="/og-image.png" />

    {{-- Twitter --}}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Mohame Roach | Full-Stack Web Developer in Montreal" />
    <meta
      name="twitter:description"
      content="Laravel, React, and scalable web applications. Freelance and contract work based in Montreal."
    />
    <meta name="twitter:image" content="/og-image.png" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">

    <script>
      // Inline theme bootstrap to prevent flash of wrong theme
      (function () {
        try {
          var stored = localStorage.getItem('mr-theme');
          var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          var pref = stored === 'light' || stored === 'dark' || stored === 'system'
            ? stored
            : 'system';
          var theme = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
          document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      })();
    </script>

    <script type="application/ld+json">
    @verbatim  
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Mohame Roach",
        "jobTitle": "Full-Stack Web Developer",
        "url": "https://mohameroach.com/",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Montreal",
          "addressRegion": "QC",
          "addressCountry": "CA"
        },
        "knowsAbout": [
          "Laravel",
          "PHP",
          "React",
          "TypeScript",
          "JavaScript",
          "WordPress",
          "PostgreSQL",
          "MySQL"
        ]
      }
    @endverbatim  
    </script>

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
  </head>
  <body>
    @inertia
  </body>
</html>
