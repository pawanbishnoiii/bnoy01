import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const stats = [
  { value: 50, suffix: '+', label: 'Projects Available', icon: '📦' },
  { value: 200, suffix: '+', label: 'Happy Builders', icon: '👨‍💻' },
  { value: 4.9, suffix: '★', label: 'Average Rating', decimals: 1, icon: '⭐' },
  { value: 100, suffix: '%', label: 'Secure Payments', icon: '🔒' },
];

export default function StatsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section ref={ref} className="w-full py-14 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/30">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center px-4"
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-4xl md:text-5xl font-black tracking-tight tabular-nums">
                {inView ? (
                  <CountUp end={s.value} duration={2.2} decimals={s.decimals || 0} />
                ) : '0'}
                <span className="ml-1">{s.suffix}</span>
              </div>
              <div className="text-sm md:text-base text-white/90 font-medium mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
