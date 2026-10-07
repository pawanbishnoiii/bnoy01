import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

export default function RefundPolicy() {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => (await supabase.from('site_settings').select('*').limit(1).maybeSingle()).data,
  });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">
      <Navbar /><AuthModal />
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold text-ink mb-2">Refund <span className="gradient-text">Policy</span></h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="bg-white rounded-2xl border border-border shadow-card p-8 prose prose-sm max-w-none">
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{data?.refund_policy || 'Loading…'}</p>
          <h3 className="text-ink mt-6">How to request a refund</h3>
          <p className="text-muted-foreground">Email <a href={`mailto:${data?.support_email || 'help@devmarket.in'}`} className="text-fire">{data?.support_email}</a> with your order ID and reason within 7 days of purchase.</p>
        </div>
      </div>
      <Footer />
    </motion.div>
  );
}
