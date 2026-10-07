import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'What do I get after purchase?', a: 'You receive the complete source code as a ZIP file. Clean, well-documented, and ready to deploy on Vercel or any other platform.' },
  { q: 'Can I use the projects commercially?', a: 'Yes! All purchased projects come with a commercial license — use them for client work, your startup, or personal projects.' },
  { q: 'Do you offer refunds?', a: 'Because the products are digital downloads, refunds are not available once the source code has been downloaded. You can preview every project first.' },
  { q: 'What technologies are used?', a: 'Modern stacks: React, Next.js, TypeScript, Tailwind CSS, Supabase, and more. Each listing shows its exact tech stack.' },
  { q: 'Do you provide support?', a: 'Yes — email support for setup, deployment, and basic customization questions on every purchased project.' },
  { q: 'Can I preview projects before buying?', a: 'Absolutely. Every project has a "Preview" button that opens the live app in a popup so you can explore it.' },
];

export default function FAQSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section ref={ref} id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-ink">Frequently asked <span className="gradient-text">questions</span></h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15 }} className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-xl border border-border px-6 shadow-card">
                <AccordionTrigger className="font-display font-bold text-left hover:no-underline hover:text-fire text-ink">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
