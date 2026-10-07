import { motion } from 'framer-motion';
import { TestimonialsColumn, type TestimonialItem } from '@/components/ui/testimonials-columns-1';

const testimonials: TestimonialItem[] = [
  { text: "Bought the SaaS dashboard — saved 3 weeks dev time. Production-grade TypeScript, clean architecture.", image: "https://randomuser.me/api/portraits/men/32.jpg", name: "Arjun Sharma", role: "Founder · TechLaunch IN" },
  { text: "E-commerce starter is incredible. Razorpay already integrated, responsive on every device. Worth every rupee.", image: "https://randomuser.me/api/portraits/women/44.jpg", name: "Priya Mehta", role: "Freelance Developer" },
  { text: "Team used 3 templates this quarter. Clean code, excellent Tailwind structure, deploy in minutes.", image: "https://randomuser.me/api/portraits/men/45.jpg", name: "Rahul Verma", role: "CTO · BuildFast" },
  { text: "Beautiful UI + working backend in minutes. As a designer who codes, these are exactly what I need.", image: "https://randomuser.me/api/portraits/women/68.jpg", name: "Sneha Patel", role: "UI/UX Designer" },
  { text: "Portfolio template landed me 2 new clients. Simple, animated, modern — exactly what clients want.", image: "https://randomuser.me/api/portraits/men/76.jpg", name: "Karan Joshi", role: "Indie Developer" },
  { text: "Cleanest marketplace UI I've seen. Preview before buying is a game-changer.", image: "https://randomuser.me/api/portraits/women/65.jpg", name: "Divya Nair", role: "Product Manager" },
  { text: "Razorpay + Supabase wired up perfectly. Shipped my MVP the same weekend.", image: "https://randomuser.me/api/portraits/men/23.jpg", name: "Vikram Iyer", role: "Indie Hacker · Bengaluru" },
  { text: "The code structure is genuinely senior-engineer quality. Easy to extend, no spaghetti.", image: "https://randomuser.me/api/portraits/women/12.jpg", name: "Anika Reddy", role: "Senior Engineer · Hyderabad" },
  { text: "Tried 5 marketplaces, this one actually delivers. Source code clean, support responsive.", image: "https://randomuser.me/api/portraits/men/85.jpg", name: "Mohit Singh", role: "Agency Owner · Delhi" },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-orange-50/40 via-white to-white py-20 relative">
      <div className="container mx-auto px-4 z-10 flex flex-col items-center justify-center max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fire/20 bg-fire/5">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-fire">Testimonials</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-ink mt-5 leading-tight">
            What our <span className="gradient-text">builders</span> say
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg">Hand-picked reviews from Indian developers, founders & agencies shipping with DevMarket.</p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[640px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
          <TestimonialsColumn testimonials={secondColumn} duration={22} className="hidden md:block" />
          <TestimonialsColumn testimonials={thirdColumn} duration={20} className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
