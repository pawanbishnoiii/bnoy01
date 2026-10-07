import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, CreditCard, Rocket } from 'lucide-react';

const steps = [
  { icon: Search, title: 'Browse Projects', desc: 'Explore our curated catalog of premium React, Next.js and Vercel-ready apps.' },
  { icon: CreditCard, title: 'Buy Securely', desc: 'Pay safely with Razorpay. Free projects unlock for instant download.' },
  { icon: Rocket, title: 'Download & Deploy', desc: 'Get the source code as a ZIP and ship to Vercel in minutes.' },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section ref={ref} id="how" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-ink">How it <span className="gradient-text">works</span></h2>
          <p className="text-muted-foreground mt-3">Three simple steps from browsing to launching.</p>
        </motion.div>
        <div className="relative grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Connector line */}
          <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-fire/20 via-fire to-sun/20" />
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.18, duration: 0.5 }}
              className="relative bg-white rounded-2xl p-6 border border-border shadow-card text-center"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full gradient-fire-strong text-white font-display font-bold text-sm flex items-center justify-center glow-fire">{i + 1}</div>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-fire/10 text-fire mt-4 mb-4">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
