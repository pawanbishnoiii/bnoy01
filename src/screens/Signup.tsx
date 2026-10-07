import { useState } from 'react';
import { Link, useLocation, useNavigate } from '@/lib/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { signInWithGoogle } from '@/lib/google-signin';

/**
 * Premium Crextio-inspired auth screen. Mirrors the reference layout:
 *  ▸ Soft rounded outer card
 *  ▸ Left: cream gradient form panel with pill inputs + yellow CTA
 *  ▸ Right: warm team meeting image with floating UI stickers
 */
export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>(isLogin ? 'login' : 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

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
        toast({ title: 'Account created ✨', description: 'Check your email to confirm and finish signing in.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'Welcome back!' });
        navigate('/');
      }
    } catch (err: any) {
      toast({ title: 'Auth error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    const r = await signInWithGoogle(provider);
    if (r.error) {
      toast({ title: 'Sign-in failed', description: r.error, variant: 'destructive' });
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email) return toast({ title: 'Enter your email first', description: 'Type your email above, then tap "Forgot password".' });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    toast(error ? { title: 'Could not send', description: error.message, variant: 'destructive' } : { title: 'Check your inbox', description: 'We sent you a link to set a new password.' });
  };

  return (
    <div className="min-h-screen w-full bg-[#dadde2] flex items-center justify-center p-3 md:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}
      className="signup-card w-full max-w-[1080px] grid lg:grid-cols-2 rounded-[28px] overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(20,20,40,0.25)]"
      >
        {/* LEFT — Form */}
        <div className="signup-form-panel relative flex flex-col bg-gradient-to-b from-white via-[#fdf6e6] to-[#f6e9c7] p-6 md:p-8 min-h-[570px]">
          <Link to="/" className="inline-flex items-center justify-center self-start rounded-full border border-zinc-300/80 bg-white/60 backdrop-blur px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-white transition">
            Bnoy Studios
          </Link>

          <div className="signup-form-content flex-1 flex flex-col justify-center max-w-sm mx-auto w-full mt-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-center mb-5"
              >
                <h1 className="font-serif text-[34px] leading-tight font-medium text-zinc-900">
                  {mode === 'signup' ? 'Create an account' : 'Welcome back'}
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  {mode === 'signup' ? 'Sign up to buy, preview and download projects' : 'Sign in to continue to Bnoy Studios'}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <Field label="Full name">
                  <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </Field>
              <Field label="Password">
                <input
                  type={showPwd ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="text-zinc-400 hover:text-zinc-600">
                  {showPwd ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </Field>
              {mode === 'login' && (
                <div className="text-right -mt-2">
                  <button type="button" onClick={forgot} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 underline-offset-2 hover:underline">
                    Forgot password? (also for returning members)
                  </button>
                </div>
              )}

              <Button
                type="submit" disabled={loading}
                className="w-full h-12 mt-2 rounded-full bg-[#f5d048] hover:bg-[#f0c63a] text-zinc-900 font-semibold text-[15px] shadow-[0_8px_20px_-8px_rgba(245,208,72,0.6)] transition"
              >
                {loading ? 'Please wait…' : mode === 'signup' ? 'Submit' : 'Sign in'} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" disabled={loading} onClick={() => oauth('apple')}
                  className="h-11 rounded-full border border-zinc-300 bg-white/60 backdrop-blur text-sm font-medium text-zinc-700 hover:bg-white transition inline-flex items-center justify-center gap-2">
                  <AppleGlyph /> Apple
                </button>
                <button type="button" disabled={loading} onClick={() => oauth('google')}
                  className="h-11 rounded-full border border-zinc-300 bg-white/60 backdrop-blur text-sm font-medium text-zinc-700 hover:bg-white transition inline-flex items-center justify-center gap-2">
                  <GoogleGlyph /> Google
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between text-xs text-zinc-500 mt-5">
            <span>
              {mode === 'signup' ? 'Have any account?' : 'New here?'}{' '}
              <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="underline text-zinc-700 hover:text-zinc-900">
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </span>
            <Link to="/refund" className="underline hover:text-zinc-700">Terms & Conditions</Link>
          </div>
        </div>

        {/* RIGHT — Image with floating UI cards */}
        <div className="relative hidden lg:block bg-gradient-to-br from-[#fde9b8] to-[#f4cf78]">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80"
            alt="Team collaborating in a sunlit office"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* close icon */}
          <Link to="/" aria-label="Close" className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/90 backdrop-blur hover:bg-white shadow-md flex items-center justify-center text-zinc-700 text-xl">×</Link>

          {/* floating sticker — task review */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="absolute top-8 left-8 max-w-[230px] rounded-2xl bg-[#f5d048] shadow-lg p-3"
          >
            <p className="text-[13px] font-semibold text-zinc-900 leading-tight">Task Review With Team</p>
            <p className="text-[11px] text-zinc-700/80">09:30am–10:00am</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="absolute top-[88px] left-14 max-w-[220px] rounded-xl bg-zinc-900/80 backdrop-blur text-white px-3 py-1.5 text-[11px]"
          >
            09:30am–10:00am
          </motion.div>

          {/* avatars */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2"
          >
            {[
              'https://i.pravatar.cc/64?img=47',
              'https://i.pravatar.cc/64?img=32',
              'https://i.pravatar.cc/64?img=12',
            ].map((src) => (
              <img key={src} src={src} alt="" className="w-11 h-11 rounded-full border-2 border-white shadow" />
            ))}
          </motion.div>

          {/* week strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 rounded-2xl bg-white/85 backdrop-blur px-4 py-2 flex gap-3 text-center"
          >
            {[['Sun', 22], ['Mon', 23], ['Tue', 24], ['Wed', 25], ['Thu', 26], ['Fri', 27], ['Sat', 28]].map(([d, n]) => (
              <div key={d as string} className="text-[10px] text-zinc-600">
                <p>{d}</p>
                <p className="text-zinc-900 font-bold text-sm">{n}</p>
              </div>
            ))}
          </motion.div>

          {/* daily meeting card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            className="absolute bottom-10 left-10 rounded-2xl bg-white shadow-xl p-3 min-w-[210px]"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-zinc-900">Daily Meeting</p>
              <span className="w-2 h-2 rounded-full bg-[#f5d048]" />
            </div>
            <p className="text-[11px] text-zinc-500">12:00pm–01:00pm</p>
            <div className="flex -space-x-2 mt-2">
              {['img=14', 'img=22', 'img=33', 'img=45'].map((q) => (
                <img key={q} src={`https://i.pravatar.cc/40?${q}`} alt="" className="w-6 h-6 rounded-full border-2 border-white" />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 ml-4 mb-1 block">{label}</label>
      <div className="flex items-center gap-2 h-12 rounded-full bg-white/85 border border-zinc-200 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_4px_-2px_rgba(0,0,0,0.05)] focus-within:border-[#f5d048] focus-within:ring-2 focus-within:ring-[#f5d048]/30 transition">
        {children}
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.3 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.4 4.5 9.9 8.8 6.3 14.1z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13.1-5.1l-6-5c-2 1.4-4.5 2.1-7.1 2.1-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.7 38.9 16.3 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.4l6 5c-.4.4 6.3-4.6 6.3-14.4 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
function AppleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.46 2.232-1.21 3.026-.79.852-2.04 1.515-3.118 1.43-.13-1.082.41-2.232 1.16-3.026.79-.853 2.13-1.515 3.168-1.43zM20.5 17.31c-.55 1.27-.81 1.84-1.52 2.96-.99 1.55-2.39 3.49-4.12 3.5-1.54 0-1.94-.99-4.04-.98-2.1.01-2.55.99-4.09.97-1.73-.01-3.05-1.76-4.04-3.31C.94 17.5.31 13.6 1.96 10.95c1.17-1.88 3.02-2.99 4.76-2.99 1.77 0 2.88 1.01 4.34 1.01 1.41 0 2.27-1.01 4.32-1.01 1.55 0 3.19.84 4.36 2.3-3.83 2.1-3.21 7.56.76 9.05z"/>
    </svg>
  );
}
