import { useMemo } from 'react';
import styles from './ShootingStarsGrid.module.css';

interface ShootingStarsGridProps {
  starCount?: number;
  className?: string;
}

const BLUE_SHADES = [
  '#3a6dff',
  '#5a8bff',
  '#7aa7ff',
  '#92b8ff',
  '#4f9fff',
  '#1f4dd8',
  '#82c5ff',
  '#b6d4ff',
];

export function ShootingStarsGrid({
  starCount = 14,
  className,
}: ShootingStarsGridProps) {
  const stars = useMemo(() => {
    const gridSize = 56;
    const directions = ['down', 'up', 'right', 'left'] as const;

    return Array.from({ length: starCount }, (_, i) => {
      const direction = directions[i % directions.length];

      const column = Math.floor(Math.random() * 24);
      const row = Math.floor(Math.random() * 14);

      const isVertical = direction === 'down' || direction === 'up';

      const left = isVertical ? column * gridSize : -80 - Math.random() * 120;
      const top = isVertical ? -80 - Math.random() * 120 : row * gridSize;

      const duration = 4 + Math.random() * 4;
      const delay = -Math.random() * duration;
      const length = 90 + Math.random() * 180;
      const color = BLUE_SHADES[i % BLUE_SHADES.length];

      return {
        id: i,
        style: {
          top: `${top}px`,
          left: `${left}px`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          ['--trail-length' as string]: `${length}px`,
          ['--star-color' as string]: color,
          ['--direction' as string]: direction,

          ['--from-x' as string]:
            direction === 'right' ? '-20vw' :
            direction === 'left' ? '20vw' : '0px',

          ['--from-y' as string]:
            direction === 'down' ? '-20vh' :
            direction === 'up' ? '20vh' : '0px',

          ['--to-x' as string]:
            direction === 'right' ? '120vw' :
            direction === 'left' ? '-120vw' : '0px',

          ['--to-y' as string]:
            direction === 'down' ? '120vh' :
            direction === 'up' ? '-120vh' : '0px',

        },
      };
    });
  }, [starCount]);

  return (
    <div
      className={`${styles.wrap} ${className ?? ''}`}
      aria-hidden="true"
    >
      <div className={styles.grid} />
      <div className={styles.stars}>
        {stars.map((s) => (
          <span key={s.id} className={styles.star} style={s.style} />
        ))}
      </div>
    </div>
  );
}
