import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, authIntent } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Check your email to confirm and finish signing in.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'Welcome back!' });
      }
      setShowAuthModal(false);
      setEmail(''); setPassword(''); setName('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) {
      toast({ title: 'Sign-in failed', description: String(result.error.message || result.error), variant: 'destructive' });
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    setShowAuthModal(false);
    setLoading(false);
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={(o) => setShowAuthModal(o)}>
      <DialogContent className="bg-background border-border p-0 overflow-hidden max-w-md">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-6">
          <h2 className="font-display text-2xl font-bold gradient-text mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {authIntent || (mode === 'login' ? 'Sign in to access your purchases.' : 'Join DevMarket to buy & download projects.')}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button type="button" variant="outline" disabled={loading} onClick={() => oauth('google')} className="border-border">
              <GoogleIcon /> <span className="ml-2">Google</span>
            </Button>
            <Button type="button" variant="outline" disabled={loading} onClick={() => oauth('apple')} className="border-border">
              <AppleIcon /> <span className="ml-2">Apple</span>
            </Button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-fire-strong text-white hover:opacity-95 glow-fire">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.3 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.4 4.5 9.9 8.8 6.3 14.1z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13.1-5.1l-6-5c-2 1.4-4.5 2.1-7.1 2.1-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.7 38.9 16.3 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.4l6 5c-.4.4 6.3-4.6 6.3-14.4 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.46 2.232-1.21 3.026-.79.852-2.04 1.515-3.118 1.43-.13-1.082.41-2.232 1.16-3.026.79-.853 2.13-1.515 3.168-1.43zM20.5 17.31c-.55 1.27-.81 1.84-1.52 2.96-.99 1.55-2.39 3.49-4.12 3.5-1.54 0-1.94-.99-4.04-.98-2.1.01-2.55.99-4.09.97-1.73-.01-3.05-1.76-4.04-3.31C.94 17.5.31 13.6 1.96 10.95c1.17-1.88 3.02-2.99 4.76-2.99 1.77 0 2.88 1.01 4.34 1.01 1.41 0 2.27-1.01 4.32-1.01 1.55 0 3.19.84 4.36 2.3-3.83 2.1-3.21 7.56.76 9.05z"/>
    </svg>
  );
}
