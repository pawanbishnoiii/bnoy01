import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setEmail('');
  };

  return (
    <section ref={ref} className="py-24 bg-secondary/20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Stay <span className="gradient-text">Updated</span></h2>
          <p className="text-muted-foreground mb-8">Get notified when we launch new premium projects and exclusive deals.</p>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border flex-1" required />
            <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
              {submitted ? <CheckCircle className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
