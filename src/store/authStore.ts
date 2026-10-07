import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  authReady: boolean;
  showAuthModal: boolean;
  authIntent: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsAdmin: (v: boolean) => void;
  setAuthReady: (v: boolean) => void;
  setShowAuthModal: (show: boolean, intent?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAdmin: false,
  authReady: false,
  showAuthModal: false,
  authIntent: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsAdmin: (v) => set({ isAdmin: v }),
  setAuthReady: (v) => set({ authReady: v }),
  setShowAuthModal: (show, intent = null) => set({ showAuthModal: show, authIntent: intent }),
  logout: () => set({ user: null, session: null, isAdmin: false }),
}));
