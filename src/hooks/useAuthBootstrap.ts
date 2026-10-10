import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { syncVerifiedIdentity } from '@/lib/truecaller.functions';
import { recordLogin } from '@/lib/login-log.functions';
import { toast } from 'sonner';
import { sendWelcomeIfNeeded } from '@/lib/booking.functions';

/**
 * Sets up the global auth listener. Call once in App.
 * - Marks `authReady` after the initial session lookup completes so guards
 *   don't redirect users away during the brief async boot window.
 * - Only updates the admin flag for clear, sticky auth events to prevent
 *   accidental "auto logout" from token-refresh side effects.
 */
export function useAuthBootstrap() {
  const { setUser, setSession, setIsAdmin, setAuthReady } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const log = () => recordLogin({ data: { screen: `${window.screen.width}x${window.screen.height}` } }).then(r => { if (r.suspicious) toast.warning(`New login from ${[r.city, r.country].filter(Boolean).join(', ')} — Was this you?`); }).catch(() => undefined);

    const fetchRole = async (userId: string | undefined) => {
      if (!userId) { setIsAdmin(false); return; }
      for (const delay of [0, 250, 750]) {
        if (delay) await new Promise(resolve => window.setTimeout(resolve, delay));
        const role = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
        if (!role.error) {
          if (!cancelled) setIsAdmin(!!role.data);
          return !!role.data;
        }
      }
      const fallback = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
      if (!cancelled) setIsAdmin(!!fallback.data);
      return !!fallback.data;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore noisy events that don't represent a real auth change
      if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setTimeout(() => {
        fetchRole(session?.user?.id).then(admin => {
          // Admins land on the dashboard right after signing in.
          if (admin && event === 'SIGNED_IN' && ['/login', '/signup', '/onboarding'].includes(window.location.pathname)) {
            window.location.replace('/admin');
          }
        });
      }, 0);
      if (session && ['SIGNED_IN', 'USER_UPDATED'].includes(event)) setTimeout(() => { syncVerifiedIdentity().catch(() => undefined); }, 0);
      if (session && event === 'SIGNED_IN') setTimeout(() => { log(); sendWelcomeIfNeeded().catch(() => undefined); }, 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      fetchRole(session?.user?.id).finally(() => setAuthReady(true));
      if (session) setTimeout(log, 0);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [setUser, setSession, setIsAdmin, setAuthReady]);
}
