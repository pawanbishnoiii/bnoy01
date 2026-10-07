"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { FileText } from "lucide-react";

const Page = () => (
  <div className="w-32 h-44 bg-white rounded-md border border-border shadow-sm p-2 flex flex-col gap-1.5">
    <div className="h-2 w-2/3 rounded bg-fire/60" />
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center gap-1">
        <div className="h-1.5 w-1.5 rounded-full bg-sun/70" />
        <div className="h-1.5 flex-1 rounded bg-muted" />
      </div>
    ))}
  </div>
);

export default function FolderInteraction() {
  const [isOpen, setIsOpen] = useState(false);
  const spring = { type: "spring" as const, duration: 0.6 };

  const pages = [
    { initial: { rotate: -3, x: -38, y: 2 }, open: { rotate: -8, x: -70, y: -55 }, t: { ...spring, bounce: 0.15, stiffness: 160, damping: 22 }, z: "z-10 shadow-md" },
    { initial: { rotate: 0, x: 0, y: 0 }, open: { rotate: 1, x: 2, y: -75 }, t: { ...spring, duration: 0.55, bounce: 0.12, stiffness: 190, damping: 24 }, z: "z-20 shadow-lg" },
    { initial: { rotate: 3.5, x: 42, y: 1 }, open: { rotate: 9, x: 75, y: -60 }, t: { ...spring, duration: 0.58, bounce: 0.17, stiffness: 170, damping: 21 }, z: "z-10 shadow-md" },
  ];

  return (
    <div className="grid place-items-center w-full py-12">
      <button onClick={() => setIsOpen(!isOpen)} className="w-80 h-52 relative outline-none" aria-label="Toggle folder">
        <div className="absolute inset-0 flex items-center justify-center">
          {pages.map((p, i) => (
            <motion.div
              key={i}
              initial={p.initial}
              animate={isOpen ? p.open : p.initial}
              transition={p.t}
              className={`absolute ${p.z}`}
            >
              <Page />
            </motion.div>
          ))}
        </div>

        {/* folder body */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: isOpen ? 14 : 0 }}
          transition={spring}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-32 rounded-b-2xl rounded-tr-2xl bg-gradient-to-br from-fire to-[hsl(14_80%_50%)] shadow-card-hover z-30 flex items-end justify-center pb-3"
        >
          <div className="absolute -top-3 left-0 w-32 h-6 rounded-t-2xl bg-fire" />
          <div className="text-white text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Bnoy Vault
          </div>
        </motion.div>
      </button>
    </div>
  );
}
