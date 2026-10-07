import * as React from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  label?: string;
}

/** Sleek dark CTA pill with an animated arrow on hover. */
export const ArrowCTA = React.forwardRef<HTMLAnchorElement, Props>(
  ({ className, label = 'Explore', children, ...props }, ref) => (
    <a
      ref={ref}
      role="button"
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 rounded-full',
        'bg-ink px-7 py-3 text-base font-semibold text-white transition-all duration-300',
        'hover:bg-ink/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire',
        className,
      )}
      {...props}
    >
      {children || label}
      <svg
        viewBox="0 0 10 10"
        height="10"
        width="10"
        fill="none"
        className="stroke-white stroke-2 transition-transform duration-300 group-hover:translate-x-1"
      >
        <path d="M1 1l4 4-4 4" />
      </svg>
    </a>
  ),
);
ArrowCTA.displayName = 'ArrowCTA';

export default ArrowCTA;
