import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './Carousel.module.css';

export interface CarouselHandle {
  prev: () => void;
  next: () => void;
  goTo: (i: number) => void;
  getIndex: () => number;
}

interface CarouselProps {
  items: ReactNode[];
  ariaLabel: string;
  /** Aspect ratio of each slide frame, e.g. "16 / 9". */
  aspectRatio?: string;
  /** Auto-advance interval in ms. 0 disables auto-advance. */
  autoPlayMs?: number;
  className?: string;
  /** Where to place prev/next controls. */
  controls?: 'overlay' | 'below';
  /** Show the dots pagination strip. */
  showDots?: boolean;
  /**
   * When true, slides take ~88% of the container width and snap to center
   * so the neighbouring slides "peek" into view.
   */
  peek?: boolean;
  /** Notified whenever the active slide changes. */
  onIndexChange?: (i: number) => void;
  /** Slide that should be active on first paint. Defaults to 0. */
  initialIndex?: number;
}

export const Carousel = forwardRef<CarouselHandle, CarouselProps>(function Carousel(
  {
    items,
    ariaLabel,
    aspectRatio = '16 / 10',
    autoPlayMs = 5000,
    className,
    controls = 'overlay',
    showDots = true,
    peek = false,
    onIndexChange,
    initialIndex = 0,
  },
  ref,
) {
  const trackRef = useRef<HTMLUListElement | null>(null);
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(items.length - 1, next));
      const slide = track.children[clamped] as HTMLElement | undefined;
      if (!slide) return;
      // Use scrollIntoView so `scroll-snap-align: center` lands correctly.
      slide.scrollIntoView({
        behavior: 'smooth',
        inline: peek ? 'center' : 'start',
        block: 'nearest',
      });
    },
    [items.length, peek],
  );

  const prev = useCallback(
    () => scrollTo((index - 1 + items.length) % items.length),
    [index, items.length, scrollTo],
  );
  const next = useCallback(
    () => scrollTo((index + 1) % items.length),
    [index, items.length, scrollTo],
  );

  useImperativeHandle(
    ref,
    () => ({
      prev,
      next,
      goTo: scrollTo,
      getIndex: () => index,
    }),
    [prev, next, scrollTo, index],
  );

  // Jump to the requested initial slide before paint, by setting
  // scrollLeft directly so we don't disturb the document scroll
  // (scrollIntoView would also scroll ancestor pages into view).
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || initialIndex <= 0) return;
    const idx = Math.min(initialIndex, items.length - 1);
    const slide = track.children[idx] as HTMLElement | undefined;
    if (!slide) return;
    const target = peek
      ? slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2
      : slide.offsetLeft;
    const prevBehavior = track.style.scrollBehavior;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = target;
    track.style.scrollBehavior = prevBehavior;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active-slide detection: the slide whose center is closest to the
  // track's viewport center. Robust under peek/mask layouts where
  // intersectionRatio for the centered slide can stay below 1.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const compute = () => {
      const slides = Array.from(track.children) as HTMLElement[];
      if (slides.length === 0) return;
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let bestIndex = 0;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const dist = Math.abs(c - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      });
      setIndex((cur) => (cur === bestIndex ? cur : bestIndex));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    compute();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items.length]);

  // Notify parent when the active index changes.
  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  // Pointer-drag (mouse/pen) for swipe. Touch keeps native scroll-snap
  // since it already feels right and avoids preventing vertical scroll.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragMoved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      // Don't hijack drags that begin on a button (e.g. card click).
      if ((e.target as HTMLElement).closest('button, a')) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      dragMoved = false;
      track.style.scrollBehavior = 'auto';
      track.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!dragMoved && Math.abs(dx) > 5) {
        dragMoved = true;
        track.setPointerCapture(pointerId);
      }
      if (dragMoved) {
        track.scrollLeft = startScroll - dx;
      }
    };

    const finish = (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const wasDragged = dragMoved;
      try {
        track.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      pointerId = null;
      track.style.scrollBehavior = '';
      track.style.cursor = '';
      if (wasDragged) {
        // Snap to the slide closest to the current center.
        const slides = Array.from(track.children) as HTMLElement[];
        const trackRect = track.getBoundingClientRect();
        const center = trackRect.left + trackRect.width / 2;
        let bestIndex = 0;
        let bestDist = Infinity;
        slides.forEach((slide, i) => {
          const r = slide.getBoundingClientRect();
          const c = r.left + r.width / 2;
          const dist = Math.abs(c - center);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
          }
        });
        scrollTo(bestIndex);
        // Suppress the click that follows a drag-release on the card.
        const swallow = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        track.addEventListener('click', swallow, { capture: true, once: true });
      }
    };

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', finish);
    track.addEventListener('pointercancel', finish);
    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', finish);
      track.removeEventListener('pointercancel', finish);
    };
  }, [scrollTo]);

  useEffect(() => {
    if (!autoPlayMs || items.length <= 1 || paused) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((i) => {
        const n = (i + 1) % items.length;
        scrollTo(n);
        return n;
      });
    }, autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, items.length, paused, scrollTo]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  };

  const showArrows = items.length > 1;

  return (
    <div
      className={[
        styles.root,
        peek ? styles.peek : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-controls={controls}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className={styles.viewport}>
        <ul
          ref={trackRef}
          className={styles.track}
          style={{ ['--slide-aspect' as string]: aspectRatio }}
        >
          {items.map((item, i) => (
            <li
              key={i}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${items.length}`}
              aria-hidden={i === index ? 'false' : 'true'}
              data-active={i === index ? 'true' : 'false'}
            >
              {item}
            </li>
          ))}
        </ul>

        {showArrows && controls === 'overlay' && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.prev}`}
              onClick={prev}
              aria-label="Previous slide"
              data-tooltip="Previous"
              data-tooltip-placement="bottom"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              onClick={next}
              aria-label="Next slide"
              data-tooltip="Next"
              data-tooltip-placement="bottom"
            >
              <ArrowIcon direction="right" />
            </button>
          </>
        )}
      </div>

      {showArrows && controls === 'below' && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrowRound}
            onClick={prev}
            aria-label="Previous slide"
            data-tooltip="Previous"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            className={styles.arrowRound}
            onClick={next}
            aria-label="Next slide"
            data-tooltip="Next"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      )}

      {showArrows && showDots && (
        <div className={styles.dots} role="tablist" aria-label="Slides">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={styles.dot}
              data-active={i === index ? 'true' : 'false'}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
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
