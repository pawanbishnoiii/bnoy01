import Marquee from 'react-fast-marquee';

const items = [
  '⚡ React Projects', '🛒 E-Commerce Sites', '📊 Admin Dashboards',
  '🎨 Portfolio Sites', '💳 Paid & Free', '🔥 Instant Download',
  '🚀 Deploy on Vercel', '💎 Production Ready',
];

export default function MarqueeTicker() {
  return (
    <section className="bg-ink text-white py-4 border-y border-ink">
      <Marquee gradient={false} speed={42} pauseOnHover>
        {items.concat(items).map((t, i) => (
          <span key={i} className="mx-8 text-sm uppercase tracking-[0.2em] font-semibold opacity-90">
            {t} <span className="text-fire mx-2">•</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
