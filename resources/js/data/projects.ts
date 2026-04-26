import type { Project } from '@/types';

export const projects: Project[] = [
  {
    id: 'outcastbrands',
    title: 'OutcastBrands',
    tagline: 'Product Discovery platform',
    summary:
      'A Laravel-powered community app where users post, vote, comment, and filter submissions. Built around a clean REST API, authenticated sessions, and email verification.',
    role: 'Full-stack developer',
    year: '2024',
    status: 'Shipped',
    tech: ['Laravel', 'JavaScript', 'CSS', 'MySQL', 'Blade', 'REST API'],
    highlights: [
      'REST API serving posts, comments, and votes with resource transformers.',
      'Email verification flow and role-based authorization policies.',
      'Filterable feed with query-scoped Eloquent builders and cached counts.',
      'Moderation tooling for flagged content and soft-deleted posts.',
    ],
    images: [
      {
        label: 'Home',
        caption: 'Featured post, most popular, and similar-posts rails.',
        palette: ['#0c0d10', '#16181d'],
        src: '/images/projects/outcastbrands-home.webp',
        focus: 'top',
      },
      {
        label: 'Auth',
        caption: 'Filtered listing with email-verified signup modal.',
        palette: ['#0c0d10', '#16181d'],
        src: '/images/projects/outcastbrands-auth.webp',
        focus: 'top',
      },
      {
        label: 'Post',
        caption: 'Submission detail — screenshot carousel and metadata.',
        palette: ['#0c0d10', '#16181d'],
        src: '/images/projects/outcastbrands-detail.webp',
        focus: 'top',
      },
    ],
    links: [
      { label: 'Live site', href: 'https://outcastbrands.mohameroach.com/', kind: 'live' },
      { label: 'Source', href: 'https://github.com/Mohame98/OutcastBrands', kind: 'source' },
    ],
  },
  {
    id: 'scribblenews',
    title: 'ScribbleNews',
    tagline: 'Art and culture blog',
    summary:
      'A custom WordPress theme focused on speed: Javascript paginated feeds, a live search index, and a fully responsive reading experience across devices.',
    role: 'Web Developer/Designer',
    year: '2023',
    status: 'Shipped',
    tech: ['WordPress', 'SCSS', 'JavaScript', 'PHP', ],
    highlights: [
      'Infinite pagination via JavaScript without layout shift.',
      'Live-search index built on top of WP_Query with debounced requests.',
      'Custom block patterns for editors to compose long-form articles.',
      'Image pipeline tuned for Core Web Vitals.',
    ],
    images: [
      {
        label: 'Home',
        caption: 'Magazine home — featured lead, category rails, and newsletter CTA.',
        palette: ['#05070a', '#0e1218'],
        src: '/images/projects/scribblenews-home.webp',
        focus: 'top',
      },
      {
        label: 'Search',
        caption: 'Live search with keyboard navigation, debounced against WP_Query.',
        palette: ['#05070a', '#0e1218'],
        src: '/images/projects/scribblenews-search.webp',
        focus: 'top',
      },
      {
        label: 'Article',
        caption: 'Article layout — typographic, distraction-free, with related posts.',
        palette: ['#05070a', '#0e1218'],
        src: '/images/projects/scribblenews-article.webp',
        focus: 'top',
      },
    ],
    links: [
      { label: 'Live site', href: 'https://mediumseagreen-reindeer-234422.hostingersite.com/', kind: 'live' },
      { label: 'Source', href: 'https://github.com/Mohame98/ScribbleNews', kind: 'source' },
    ],
  },
  {
    id: 'splitboard',
    title: 'Splitboard',
    tagline: 'Weekly training planner for lifters and runners',
    summary:
      'A drag-and-drop weekly board for push/pull/legs + endurance splits. Strength and cardio blocks share a typed schema, so each card knows whether to render sets×reps or heart-rate zones and distance.',
    role: 'Full-stack engineer',
    year: '2026',
    status: 'In progress',
    tech: ['Laravel', 'React', 'TypeScript', 'PostgreSQL'],
    highlights: [
      'Polymorphic exercise blocks — strength (sets, reps, warmups) vs. cardio (HR zone, distance, duration) — typed end-to-end through Inertia.',
      'Drag-and-drop reordering across days with fractional-index positions to avoid full reshuffles on each move.',
      'Per-user abbreviation glossary (DB, BB, RDL…) editable inline, so the schedule stays readable for any training vocabulary.',
      'Light/dark theme with persisted preference and a print-friendly view for taking the week to the gym.',
    ],
    images: [
      {
        label: 'Weekly board',
        caption: 'Push/pull/legs + endurance laid out across the week.',
        palette: ['#f1ede4', '#e6e1d4'],
        src: '/images/projects/splitboard-board.webp',
        focus: 'top',
      },
      {
        label: 'Edit block',
        caption: 'Inline editor — drag to reorder, click to edit, × to remove.',
        palette: ['#f1ede4', '#e6e1d4'],
        motif: 'editor',
      },
      {
        label: 'Cardio day',
        caption: 'Cardio cards swap sets/reps for HR zone and distance.',
        palette: ['#f1ede4', '#e6e1d4'],
        motif: 'chart',
      },
    ],
    links: [{ label: 'Request access', href: '#contact', kind: 'case-study' }],
  },
];
