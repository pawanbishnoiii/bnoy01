import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { enablePush, pushConfigured, isSubscribedLocally, markDismissed, dismissedAt, listenForeground } from '@/lib/push';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const DISMISS_COOLDOWN = 1000 * 60 * 60 * 24 * 3; // 3 days

export default function NotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!pushConfigured()) return;
    if (isSubscribedLocally()) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return;
    if (Date.now() - dismissedAt() < DISMISS_COOLDOWN) return;
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Foreground notifications become toasts.
  useEffect(() => {
    let off: (() => void) | undefined;
    listenForeground(({ title, body }) => {
      toast({ title, description: body });
    }).then((fn) => { off = fn; });
    return () => off?.();
  }, [toast]);

  const subscribe = async () => {
    setBusy(true);
    const res = await enablePush();
    setBusy(false);
    if (res.status === 'registered') {
      toast({ title: 'Notifications on 🔔', description: "You'll get updates about new projects and releases." });
      setOpen(false);
      return;
    }
    const messages: Record<string, string> = {
      'not-configured': 'Push notifications are not configured yet.',
      unsupported: 'This browser does not support web push notifications.',
      'open-in-new-tab': 'Open the site in its own browser tab to allow notifications.',
      denied: 'Notifications are blocked. Enable them in your browser site settings.',
      error: res.message || 'Something went wrong. Please try again.',
    };
    toast({ title: 'Could not enable notifications', description: messages[res.status], variant: 'destructive' });
  };

  const dismiss = () => { markDismissed(); setOpen(false); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: reduced ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[360px] max-w-[calc(100vw-2rem)]"
          role="dialog"
          aria-label="Enable notifications"
        >
          <div className="relative rounded-2xl border border-border bg-white shadow-2xl p-5 overflow-hidden">
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 blur-2xl" />
            <button
              onClick={dismiss}
              aria-label="Dismiss notification prompt"
              className="absolute top-3 right-3 text-muted-foreground hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative flex items-start gap-3">
              <motion.div
                animate={reduced ? undefined : { rotate: [0, -12, 12, -8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3 }}
                className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white"
              >
                <Bell className="h-5 w-5" />
              </motion.div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-ink leading-tight">Get instant updates</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  New projects, version releases and offers — straight to your device.
                </p>
              </div>
            </div>
            <div className="relative flex gap-2 mt-4">
              <Button onClick={subscribe} disabled={busy} className="flex-1 rounded-xl">
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enabling…</> : 'Allow notifications'}
              </Button>
              <Button variant="ghost" onClick={dismiss} className="rounded-xl">Not now</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
