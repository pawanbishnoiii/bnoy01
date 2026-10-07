"use client";
import React from "react";
import { motion } from "framer-motion";

export interface TestimonialItem {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[...new Array(2)].fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${index}-${i}`}
                className="p-8 rounded-3xl border border-border shadow-sm shadow-fire/5 max-w-xs w-full bg-white"
              >
                <div className="text-ink/80 text-sm leading-relaxed">{text}</div>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-fire/30"
                    loading="lazy"
                  />
                  <div className="flex flex-col">
                    <div className="font-semibold tracking-tight leading-5 text-ink">
                      {name}
                    </div>
                    <div className="leading-5 text-muted-foreground tracking-tight text-xs">
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
