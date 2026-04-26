import type { CSSProperties, ReactNode } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type Variant = 'rise' | 'fade' | 'slide-left' | 'slide-right' | 'scale';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  variant?: Variant;
  as?: 'div' | 'section' | 'article' | 'header' | 'li' | 'span';
  className?: string;
  style?: CSSProperties;
}

export function Reveal({
  children,
  delay = 0,
  variant = 'rise',
  as = 'div',
  className,
  style,
}: RevealProps) {
  const ref = useScrollReveal<HTMLElement>();
  const Tag = as as React.ElementType;

  const mergedStyle: CSSProperties = {
    ...(style ?? {}),
    ...({ ['--reveal-delay' as string]: `${delay}ms` } as CSSProperties),
  };

  return (
    <Tag
      ref={ref}
      className={['reveal', className].filter(Boolean).join(' ')}
      data-variant={variant === 'rise' ? undefined : variant}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}
