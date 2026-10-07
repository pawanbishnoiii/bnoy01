import { motion } from 'framer-motion';
import { Search, ShieldCheck, Download } from 'lucide-react';

const features = [
  { icon: Search, title: 'Browse & Preview', desc: 'Explore 50+ live demos. Try every project before you buy.' },
  { icon: ShieldCheck, title: 'Secure Razorpay Checkout', desc: 'Industry-grade payments. Your money is fully protected.' },
  { icon: Download, title: 'Instant Source Code', desc: 'Download a clean ZIP and ship to Vercel in minutes.' },
];

export default function FeatureCards() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 reveal-stagger">
        {features.map((f, i) => (
          <motion.div key={f.title} whileHover={{ scale: 1.04 }}
            className="reveal-item bg-white rounded-2xl p-6 shadow-card border border-border border-t-4 border-t-fire">
            <div className="w-14 h-14 rounded-2xl gradient-fire-strong text-white flex items-center justify-center mb-4 animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
