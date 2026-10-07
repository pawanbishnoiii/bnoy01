import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Smartphone, Download, Lock, Apple, Monitor, Laptop, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

const platformMeta: Record<string, { color: string; icon: any; label: string }> = {
  android: { color: 'bg-green-100 text-green-700 border-green-200', icon: Smartphone, label: 'Android' },
  ios: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Apple, label: 'iOS' },
  windows: { color: 'bg-sky-100 text-sky-700 border-sky-200', icon: Monitor, label: 'Windows' },
  mac: { color: 'bg-gray-200 text-gray-700 border-gray-300', icon: Laptop, label: 'macOS' },
  linux: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Package, label: 'Linux' },
};

const tabs = ['all', 'android', 'ios', 'windows', 'mac', 'linux'];

export default function AppsPage() {
  const [filter, setFilter] = useState<string>('all');
  const { user, setShowAuthModal } = useAuthStore();
  const { openPayment } = useRazorpay();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const { data } = await supabase.from('apps').select('*').eq('status', 'published').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['app-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('purchases').select('project_id').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const ownedIds = new Set(purchases.map((p: any) => p.project_id));
  const filtered = filter === 'all' ? apps : apps.filter((a: any) => a.platform === filter);

  const downloadApp = async (app: any) => {
    try {
      if (app.apk_url?.startsWith('http')) {
        window.open(app.apk_url, '_blank', 'noopener');
      } else {
        const path = app.apk_url || `${app.id}/app.apk`;
        const { data, error } = await supabase.storage.from('app-files').createSignedUrl(path, 60);
        if (error) throw error;
        window.open(data.signedUrl, '_blank', 'noopener');
      }
      await supabase.from('apps').update({ download_count: (app.download_count || 0) + 1 }).eq('id', app.id);
      qc.invalidateQueries({ queryKey: ['apps'] });
    } catch (e: any) {
      toast({ title: 'Download failed', description: e.message, variant: 'destructive' });
    }
  };

  // Free apps download instantly. Paid apps require a purchase.
  const handleGet = async (app: any) => {
    if (!user) { setShowAuthModal(true, `Sign in to download ${app.name}`); return; }
    const isFree = !app.price || app.price === 0;
    if (isFree || ownedIds.has(app.id)) {
      downloadApp(app);
      return;
    }
    openPayment({
      amount: app.price,
      name: app.name,
      description: `Purchase: ${app.name}`,
      prefill: { email: user.email || '', name: user.user_metadata?.name || '' },
      onSuccess: async (paymentId) => {
        const { error } = await supabase.from('purchases').insert({
          user_id: user.id, project_id: app.id, amount: app.price, razorpay_payment_id: paymentId,
        });
        if (error) {
          toast({ title: 'Could not save purchase', description: error.message, variant: 'destructive' });
          return;
        }
        qc.invalidateQueries({ queryKey: ['app-purchases', user.id] });
        toast({ title: 'Payment successful — downloading…' });
        downloadApp(app);
      },
      onFailure: () => toast({ title: 'Payment cancelled', variant: 'destructive' }),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
      <Navbar /><AuthModal />
      <div className="container mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <div className="relative text-center mb-12 overflow-hidden py-12">
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-orange-100/60 via-transparent to-red-100/40 blur-3xl" />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-ink">
            Mobile & Desktop <span className="gradient-text">Apps</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Download our companion apps for the best experience.
          </p>
        </div>

        {/* Platform tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`relative px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                filter === t ? 'bg-fire text-white shadow-card' : 'bg-white border border-border text-muted-foreground hover:border-fire/40'
              }`}
            >
              {t === 'all' ? 'All Apps' : platformMeta[t]?.label || t}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">📱</div>
            <h3 className="font-display text-xl font-bold text-ink">No apps yet</h3>
            <p className="text-muted-foreground mt-2">Check back soon — admin will upload apps shortly.</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((app: any, i: number) => {
            const meta = platformMeta[app.platform] || platformMeta.android;
            const owned = ownedIds.has(app.id);
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="flex items-start gap-4 mb-3">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={app.name} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl gradient-fire-strong flex items-center justify-center shadow-md">
                      <meta.icon className="h-7 w-7 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg text-ink truncate">{app.name}</h3>
                      <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-600">v{app.version}</Badge>
                    </div>
                    <Badge className={`mt-1 ${meta.color} border`}>
                      <meta.icon className="h-3 w-3 mr-1" /> {meta.label}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{app.description}</p>

                {app.screenshots_urls && app.screenshots_urls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                    {app.screenshots_urls.slice(0, 4).map((src: string, idx: number) => (
                      <img key={idx} src={src} alt="" className="h-20 rounded-lg border border-border flex-shrink-0" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  {app.file_size && <span>📦 {app.file_size}</span>}
                  <span>⬇️ {(app.download_count || 0).toLocaleString()} downloads</span>
                </div>

                <div className="mt-auto space-y-2">
                  {(() => {
                    const isFree = !app.price || app.price === 0;
                    const owned = ownedIds.has(app.id);
                    if (!user) {
                      return (
                        <Button onClick={() => setShowAuthModal(true)} variant="outline" className="w-full border-fire text-fire hover:bg-fire/5">
                          <Lock className="h-4 w-4 mr-2" /> Login to {isFree ? 'Download' : 'Buy'}
                        </Button>
                      );
                    }
                    if (isFree || owned) {
                      return (
                        <Button onClick={() => handleGet(app)} className="w-full bg-green-600 hover:bg-green-700 text-white">
                          <Download className="h-4 w-4 mr-2" /> {owned && !isFree ? 'Download (owned)' : 'Download Free'}
                        </Button>
                      );
                    }
                    return (
                      <Button onClick={() => handleGet(app)} className="w-full gradient-fire-strong text-white">
                        Buy ₹{app.price.toLocaleString('en-IN')}
                      </Button>
                    );
                  })()}
                  <p className="text-xs text-center text-muted-foreground">
                    {!app.price || app.price === 0 ? 'FREE • No payment required' : ownedIds.has(app.id) ? 'You own this app' : 'Secure Razorpay payment'}
                  </p>
                </div>

                {app.changelog && (
                  <Accordion type="single" collapsible className="mt-3">
                    <AccordionItem value="cl" className="border-0">
                      <AccordionTrigger className="text-xs py-2 hover:no-underline">What's New in v{app.version}</AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground whitespace-pre-line">{app.changelog}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
      <BackToTop />
    </motion.div>
  );
}
