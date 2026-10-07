import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

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

    const fetchRole = async (userId: string | undefined) => {
      if (!userId) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!data);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore noisy events that don't represent a real auth change
      if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setTimeout(() => fetchRole(session?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      fetchRole(session?.user?.id).finally(() => setAuthReady(true));
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [setUser, setSession, setIsAdmin, setAuthReady]);
}
