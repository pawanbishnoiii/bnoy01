"use client";
import React, { useState, useEffect, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ContainerTextFlipProps {
  words?: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  animationDuration?: number;
}

export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 2800,
  className,
  textClassName,
  animationDuration = 700,
}: ContainerTextFlipProps) {
  const id = useId();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [width, setWidth] = useState(100);
  const textRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) setWidth(textRef.current.scrollWidth + 30);
  }, [currentWordIndex]);

  useEffect(() => {
    const t = setInterval(() => setCurrentWordIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words, interval]);

  return (
    <motion.span
      layout
      layoutId={`words-${id}`}
      animate={{ width }}
      transition={{ duration: animationDuration / 2000 }}
      className={cn(
        "relative inline-block rounded-xl px-3 pt-1 pb-2 text-center font-extrabold align-middle",
        "bg-gradient-to-b from-fire to-[hsl(14_80%_50%)] text-white",
        "shadow-[inset_0_-2px_hsl(14_80%_42%),inset_0_0_0_1px_hsl(14_80%_42%),0_8px_22px_-6px_hsl(14_100%_57%/0.55)]",
        className,
      )}
      key={words[currentWordIndex]}
    >
      <motion.span
        transition={{ duration: animationDuration / 1000, ease: "easeInOut" }}
        className={cn("inline-block whitespace-nowrap", textClassName)}
        ref={textRef as any}
        layoutId={`word-${words[currentWordIndex]}-${id}`}
      >
        {words[currentWordIndex].split("").map((letter, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: index * 0.025 }}
            className="inline-block"
          >
            {letter}
          </motion.span>
        ))}
      </motion.span>
    </motion.span>
  );
}

export default ContainerTextFlip;
