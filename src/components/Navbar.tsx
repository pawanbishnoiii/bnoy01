import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@/lib/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import bnoyLogoFallback from '@/assets/bnoy-logo.png';
import { UserDropdown } from '@/components/ui/user-dropdown';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';


export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { user, isAdmin, setShowAuthModal } = useAuthStore();
  const navigate = useNavigate();
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });
  const { data: profile } = useQuery({
    queryKey: ['my-profile-avatar', user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from('profiles').select('avatar_url').eq('id', user!.id).maybeSingle()).data,
  });
  const bnoyLogo = (settings as any)?.logo_url || bnoyLogoFallback;
  const brandName = settings?.brand_name?.split(' ')[0] || 'Bnoy';
  const brandSuffix = settings?.brand_name?.split(' ').slice(1).join(' ') || 'Studios';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) navigate(`/marketplace?q=${encodeURIComponent(q)}`);
  };

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Apps', href: '/apps' },
    { label: 'Windows', href: '/windows' },
    { label: 'How it works', href: '/#how' },
    { label: 'FAQ', href: '/#faq' },
  ];

  return (
    <motion.nav
      animate={{ paddingTop: scrolled ? 8 : 18, paddingBottom: scrolled ? 8 : 18 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors ${scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-border shadow-card' : 'bg-transparent'}`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={bnoyLogo} alt={settings?.brand_name || 'Bnoy Studios'} width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="font-display text-xl font-extrabold text-ink tracking-tight">
            {brandName}<span className="gradient-text">.{brandSuffix}</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          {links.map((l) => (
            <Link key={l.label} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-fire transition-colors">{l.label}</Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <AnimatePresence>
            {searchOpen && (
              <motion.input
                initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                autoFocus value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
                placeholder="Search projects…"
                className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-fire/40"
              />
            )}
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <UserDropdown
              isAdmin={isAdmin}
              user={{
                name: user.user_metadata?.name || user.user_metadata?.full_name || (user.email?.split('@')[0] ?? 'You'),
                email: user.email ?? undefined,
                avatar: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
                initials: (user.user_metadata?.name || user.email || 'U').slice(0, 2).toUpperCase(),
                status: 'online',
              }}
              onAction={(a) => {
                if (a === 'dashboard') navigate('/dashboard');
                else if (a === 'admin') navigate('/admin');
                else if (a === 'purchases') navigate('/dashboard?tab=purchases');
                else if (a === 'wishlist') navigate('/dashboard?tab=wishlist');
                else if (a === 'help') navigate('/refund');
                else if (a === 'upgrade') navigate('/marketplace');
                else if (a === 'logout') setConfirmLogout(true);
              }}
            />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(true)}><LogIn className="h-5 w-5 mr-2" />Login</Button>
              <Button size="sm" className="gradient-fire-strong text-white hover:opacity-95" onClick={() => navigate('/signup')}><UserPlus className="h-5 w-5 mr-2" />Sign Up</Button>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="lg:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden bg-background border-t border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search projects…"
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm mb-2"
            />
            {links.map((l) => (
              <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{l.label}</Link>
            ))}
            {user ? (
              <>
                {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm py-2">Admin Panel</Link>}
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm py-2">Dashboard</Link>
                <button onClick={() => { setMobileOpen(false); setConfirmLogout(true); }} className="text-sm py-2 text-left text-destructive">Logout</button>
              </>
            ) : (
              <Button size="sm" className="gradient-fire-strong text-white" onClick={() => { setShowAuthModal(true); setMobileOpen(false); }}>Login / Sign Up</Button>
            )}
          </div>
        </motion.div>
      )}

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Bnoy Studios?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be signed out and returned to the home page. Any in-progress work in this tab will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { setConfirmLogout(false); await handleLogout(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Yes, log me out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.nav>
  );
}
