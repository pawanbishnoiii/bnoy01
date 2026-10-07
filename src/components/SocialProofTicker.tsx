import Marquee from 'react-fast-marquee';

const items = ['⭐ 5-star rating','✅ 200+ buyers','🚀 Production-ready code','🔒 Secure payments','📦 Instant download'];

export default function SocialProofTicker() {
  return (
    <section className="bg-[#FFF3E0] py-3 border-y border-fire/10">
      <Marquee speed={40} gradient={false} pauseOnHover>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="mx-6 text-sm text-ink/80 font-medium">{t}</span>
        ))}
      </Marquee>
    </section>
  );
}
