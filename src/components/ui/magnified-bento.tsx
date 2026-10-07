"use client";
import React from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import {
  Search, Users, GitBranch, User, RotateCcw, Settings, Cpu, Code, BarChart3,
  Zap, Link as LinkIcon, Smartphone, Cloud, Database, Lock,
} from "lucide-react";

const TAG_ROWS = [
  [
    { id: "discovery", icon: Search, label: "Discovery" },
    { id: "client-review", icon: Users, label: "Client Review" },
    { id: "system-design", icon: GitBranch, label: "System Design" },
    { id: "devops", icon: User, label: "DevOps Integration" },
    { id: "post-launch", icon: RotateCcw, label: "Post-Launch Support" },
  ],
  [
    { id: "qa", icon: Settings, label: "QA & Optimization" },
    { id: "launch", icon: Cpu, label: "Launch & Deploy" },
    { id: "full-stack", icon: Code, label: "Full-Stack Development" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "mvp", icon: Zap, label: "MVP Engineering" },
  ],
  [
    { id: "api", icon: LinkIcon, label: "API & Backend" },
    { id: "mobile", icon: Smartphone, label: "Mobile Development" },
    { id: "cloud", icon: Cloud, label: "Cloud Infrastructure" },
    { id: "database", icon: Database, label: "Database Design" },
    { id: "security", icon: Lock, label: "Security" },
  ],
];

const CONFIG = {
  title: "Intelligent Workflows",
  description:
    "Every Bnoy build maps real engineering phases — from discovery through launch — so you ship faster without skipping the basics.",
  lensSize: 92,
};

export default function MagnifiedBento() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);
  const [active, setActive] = React.useState(false);

  const clipPath = useMotionTemplate`circle(46px at calc(50% + ${lensX}px) calc(50% + ${lensY}px))`;
  const lensLeft = useMotionTemplate`calc(50% + ${lensX}px)`;
  const lensTop = useMotionTemplate`calc(50% + ${lensY}px)`;


  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const el = containerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const p = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    lensX.set(p.clientX - r.left - r.width / 2);
    lensY.set(p.clientY - r.top - r.height / 2);
  };

  const Row = ({ row, highlight }: { row: typeof TAG_ROWS[number]; highlight?: boolean }) => (
    <div className="flex gap-3 whitespace-nowrap">
      {[...row, ...row, ...row].map((item, idx) => (
        <span
          key={`${item.id}-${idx}`}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
            highlight
              ? "border-fire/40 bg-gradient-to-br from-fire to-sun text-white shadow-[0_6px_20px_-8px_hsl(14_100%_57%/0.6)]"
              : "border-border bg-white text-ink/70"
          }`}
        >
          <item.icon className="h-3.5 w-3.5" /> {item.label}
        </span>
      ))}
    </div>
  );

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-5 gap-8 items-center rounded-3xl border border-border bg-white shadow-card overflow-hidden p-6 lg:p-10">
        <div
          ref={containerRef}
          onMouseMove={onMove}
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
          onTouchMove={onMove}
          onTouchStart={() => setActive(true)}
          onTouchEnd={() => setActive(false)}
          className="relative lg:col-span-3 h-[220px] sm:h-[260px] rounded-2xl bg-warm-bg/60 overflow-hidden border border-border cursor-crosshair"
        >
          {/* base layer (muted) */}
          <div className="absolute inset-0 flex flex-col justify-center gap-3 px-4">
            {TAG_ROWS.map((r, i) => (
              <div key={i} style={{ transform: `translateX(${i % 2 ? "-3%" : "3%"})` }}>
                <Row row={r} />
              </div>
            ))}
          </div>

          {/* reveal layer */}
          <motion.div
            className="absolute inset-0 flex flex-col justify-center gap-3 px-4 pointer-events-none"
            style={{ clipPath: active ? clipPath : ("circle(0px at 50% 50%)" as any) }}
          >
            {TAG_ROWS.map((r, i) => (
              <div key={i} style={{ transform: `translateX(${i % 2 ? "-3%" : "3%"})` }}>
                <Row row={r} highlight />
              </div>
            ))}
          </motion.div>

          {/* lens ring */}
          {active && (
            <motion.div
              className="pointer-events-none absolute h-[92px] w-[92px] -ml-[46px] -mt-[46px] rounded-full border-2 border-fire/70 shadow-[0_0_0_2px_white,0_10px_30px_-8px_hsl(14_100%_57%/0.6)]"
              style={{ left: lensLeft, top: lensTop }}
            />
          )}

        </div>

        <div className="lg:col-span-2">
          <span className="inline-block text-[11px] font-bold tracking-[0.3em] text-fire uppercase mb-3">Bento Workflow</span>
          <h3 className="font-display text-3xl md:text-4xl font-extrabold text-ink leading-tight">{CONFIG.title}</h3>
          <p className="text-muted-foreground mt-3">{CONFIG.description}</p>
          <p className="text-xs text-muted-foreground/70 mt-4">Hover or drag across the panel to magnify.</p>
        </div>
      </div>
    </section>
  );
}
