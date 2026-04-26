export type Theme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface ContactFormValues {
  name: string;
  email: string;
  company: string;
  message: string;
  budget: BudgetRange;
  timeline: TimelineRange;
  /** Honeypot field — real users leave this empty. */
  website: string;
}

export type BudgetRange =
  | 'under-2k'
  | '2k-5k'
  | '5k-10k'
  | '10k-25k'
  | '25k-plus'
  | 'not-sure';

export type TimelineRange =
  | 'asap'
  | '1-month'
  | '1-3-months'
  | '3-plus-months'
  | 'flexible';

export type ContactField = keyof ContactFormValues;

export interface ContactFieldError {
  field: ContactField | 'form';
  message: string;
}

export interface ContactSubmitResult {
  ok: boolean;
  errors?: ContactFieldError[];
  message?: string;
}

export interface ProjectImage {
  label: string;
  caption: string;
  /** Background palette used behind the image and in the browser chrome. */
  palette: [string, string];
  /** Optional real screenshot under /public. When absent, the programmatic
   *  `motif` placeholder is rendered instead. */
  src?: string;
  /** Optional CSS object-position for the image (e.g. "top", "center 20%"). */
  focus?: string;
  /**
   * Programmatic preview — rendered inline via CSS for projects that don't
   * yet have a real screenshot. Ignored when `src` is provided.
   */
  motif?: 'code' | 'dashboard' | 'auth' | 'editor' | 'feed' | 'chart';
}

export interface ProjectLink {
  label: string;
  href: string;
  kind: 'live' | 'source' | 'case-study';
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  role: string;
  year: string;
  status: 'Shipped' | 'In progress' | 'Archived';
  tech: string[];
  highlights: string[];
  images: ProjectImage[];
  links: ProjectLink[];
}

/* ---------------------------------------------------------------------- *
 * Inertia shared props — anything AppServiceProvider / HandleInertiaRequests
 * shares on every response lands on these shapes. Keep them minimal; prefer
 * per-page props over globals.
 * ---------------------------------------------------------------------- */

export type UserRole = 'writer' | 'admin' | 'super_admin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  is_writer: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  disabled_at: string | null;
}

export interface SharedProps {
  auth: { user: AuthUser | null };
  flash: { status?: string | null; error?: string | null };
  turnstile?: { site_key?: string | null };
  [key: string]: unknown;
}

/* ---------------------------- Blog --------------------------------------- */

export type BlogPostStatus = 'draft' | 'pending_review' | 'published';

export interface BlogCategory {
  id: number;
  slug: string;
  name: string;
  accent: string;
}

export interface BlogAuthor {
  name: string;
}

export interface BlogTocItem {
  id: string;
  text: string;
  level: number;
}

export interface BlogCardData {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  reading_minutes: number;
  category: Pick<BlogCategory, 'slug' | 'name' | 'accent'> | null;
}

export interface BlogPostDetail {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string;
  toc: BlogTocItem[];
  published_at: string | null;
  reading_minutes: number;
  status: BlogPostStatus;
  is_preview: boolean;
  author: BlogAuthor | null;
  category: Pick<BlogCategory, 'slug' | 'name' | 'accent'> | null;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface Paginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginationLink[];
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface BlogIndexFilters {
  category: string | null;
  q: string | null;
  sort: 'newest' | 'oldest';
}
