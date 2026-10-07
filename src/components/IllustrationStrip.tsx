import { motion } from 'framer-motion';
import bot from '@/assets/illustration-bot-chart.png';
import media from '@/assets/illustration-media.png';
import blogger from '@/assets/illustration-blogger.png';
import shield from '@/assets/illustration-shield.png';

const items = [
  { src: bot, title: 'Analytics-grade dashboards', desc: 'Realtime charts, KPIs and growth widgets out of the box.' },
  { src: media, title: 'Media-ready UI kits', desc: 'Players, editors, timelines — every element production tested.' },
  { src: blogger, title: 'AI + Web companions', desc: 'Blogger, AI assistant and content templates baked in.' },
  { src: shield, title: 'Secure & Play-Store ready', desc: 'Auth, RLS, signed URLs, in-app purchases — fully wired.' },
];

export default function IllustrationStrip() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-[11px] font-bold tracking-[0.3em] text-fire uppercase mb-3">What you get</span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-ink">
            Everything for a <span className="gradient-text">launch-ready product</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="relative rounded-3xl bg-gradient-to-br from-warm-bg to-white border border-border p-6 shadow-card overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-fire/10 blur-2xl" />
              <div className="relative aspect-square w-full mb-4 flex items-center justify-center">
                <img src={it.src} alt={it.title} loading="lazy" className="max-h-44 object-contain drop-shadow-xl" />
              </div>
              <h3 className="font-display font-bold text-ink mb-1">{it.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
