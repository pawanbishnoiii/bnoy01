import { toast } from 'sonner';

/** Internal dedupe map so rapid identical events collapse into one toast. */
const lastFired = new Map<string, number>();
const DEDUPE_MS = 1500;

function shouldFire(key: string) {
  const now = Date.now();
  const prev = lastFired.get(key) || 0;
  if (now - prev < DEDUPE_MS) return false;
  lastFired.set(key, now);
  return true;
}

function confettiBurst(colors: string[], count = 28) {
  if (typeof window === 'undefined') return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const layer = document.createElement('div');
  layer.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const size = 6 + Math.random() * 8;
    p.style.cssText = `position:absolute;top:30%;left:${20 + Math.random() * 60}%;width:${size}px;height:${size}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};opacity:0;transform:translateY(0) rotate(0deg);transition:transform 1.2s cubic-bezier(.2,.8,.3,1),opacity 1.2s`;
    layer.appendChild(p);
    requestAnimationFrame(() => {
      p.style.opacity = '1';
      p.style.transform = `translate(${(Math.random() - 0.5) * 400}px, ${300 + Math.random() * 400}px) rotate(${Math.random() * 720}deg)`;
    });
  }
  setTimeout(() => layer.remove(), 1600);
}

/** Generic success celebration (kept for backward compatibility). */
export function celebrate(title: string, description?: string) {
  if (!shouldFire(`celebrate:${title}`)) return;
  toast.success(title, { description, duration: 4500, icon: '🎉' });
  confettiBurst(['#FF5722', '#FFC107', '#22c55e', '#0ea5e9', '#a855f7']);
}

/** Distinct toast for "added to cart / wishlist / unlocked free" — soft, no big confetti. */
export function celebrateCart(title: string, description?: string) {
  if (!shouldFire(`cart:${title}`)) return;
  toast(title, {
    description,
    duration: 3200,
    icon: '🛒',
    className: 'bnoy-toast-cart',
  });
  confettiBurst(['#FF9800', '#FFC107', '#FF5722'], 14);
}

/** Distinct toast for completed purchases — rich confetti + longer duration. */
export function celebratePurchase(title: string, description?: string) {
  if (!shouldFire(`purchase:${title}`)) return;
  toast.success(title, {
    description,
    duration: 6000,
    icon: '🎉',
    className: 'bnoy-toast-purchase',
  });
  confettiBurst(['#FF5722', '#FFC107', '#22c55e', '#0ea5e9', '#a855f7', '#ec4899'], 48);
}
