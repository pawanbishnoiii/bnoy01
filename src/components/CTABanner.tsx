import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router';

export default function CTABanner() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl gradient-fire-strong p-10 md:p-14 text-center text-white">
          <svg className="absolute -top-10 -left-10 w-64 opacity-20" viewBox="0 0 200 200" aria-hidden><circle cx="100" cy="100" r="100" fill="white" /></svg>
          <svg className="absolute -bottom-10 -right-10 w-72 opacity-20" viewBox="0 0 200 200" aria-hidden><circle cx="100" cy="100" r="100" fill="white" /></svg>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold relative">Ready to launch your next project?</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto relative">Skip the boilerplate. Buy a battle-tested codebase and ship to production today.</p>
          <div className="mt-7 flex justify-center gap-3 relative">
            <Link to="/marketplace">
              <Button size="lg" variant="secondary" className="bg-white text-fire hover:bg-white/90 font-bold">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
