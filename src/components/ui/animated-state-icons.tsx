"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface StateIconProps {
  size?: number;
  color?: string;
  className?: string;
  duration?: number;
}

function useAutoToggle(interval: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), interval);
    return () => clearInterval(id);
  }, [interval]);
  return on;
}

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/* 1. LOADING → SUCCESS */
export function SuccessIcon({ size = 40, color = "currentColor", className, duration = 2200 }: StateIconProps) {
  const done = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <motion.circle cx="12" cy="12" r="10" animate={{ pathLength: done ? 1 : 0.3, rotate: done ? 0 : 360 }} transition={{ duration: 0.8, repeat: done ? 0 : Infinity, ease: "linear" }} />
      <AnimatePresence>
        {done && (
          <motion.path d="M8 12l3 3 5-6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ pathLength: 0 }} transition={{ duration: 0.4 }} />
        )}
      </AnimatePresence>
    </svg>
  );
}

/* 2. MENU → CLOSE */
export function MenuCloseIcon({ size = 40, color = "currentColor", className, duration = 2000 }: StateIconProps) {
  const open = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <motion.line x1="4" y1="6" x2="20" y2="6" animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }} style={{ originX: 0.5, originY: 0.25 }} />
      <motion.line x1="4" y1="12" x2="20" y2="12" animate={{ opacity: open ? 0 : 1 }} />
      <motion.line x1="4" y1="18" x2="20" y2="18" animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }} style={{ originX: 0.5, originY: 0.75 }} />
    </svg>
  );
}

/* 3. PLAY → PAUSE */
export function PlayPauseIcon({ size = 40, color = "currentColor", className, duration = 2400 }: StateIconProps) {
  const playing = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} fill={color} className={cn(className)}>
      <AnimatePresence mode="wait">
        {playing ? (
          <motion.g key="pause" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </motion.g>
        ) : (
          <motion.polygon key="play" points="6,4 20,12 6,20" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} />
        )}
      </AnimatePresence>
    </svg>
  );
}

/* 4. LOCK → UNLOCK */
export function LockUnlockIcon({ size = 40, color = "currentColor", className, duration = 2600 }: StateIconProps) {
  const unlocked = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <motion.path d="M8 11V7a4 4 0 018 0v4" animate={{ y: unlocked ? -4 : 0, rotate: unlocked ? -15 : 0 }} style={{ originX: 0.2 }} />
      <circle cx="12" cy="16" r="1.2" fill={color} />
    </svg>
  );
}

/* 5. COPY → COPIED */
export function CopiedIcon({ size = 40, color = "currentColor", className, duration = 2200 }: StateIconProps) {
  const copied = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
      <AnimatePresence>
        {copied && <motion.path d="M11 14l2 2 4-4" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>
    </svg>
  );
}

/* 6. BELL → NOTIFICATION */
export function NotificationIcon({ size = 40, color = "currentColor", className, duration = 2800 }: StateIconProps) {
  const notif = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <motion.path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" animate={{ rotate: notif ? [0, -10, 10, -6, 0] : 0 }} style={{ originX: 0.5, originY: 0.2 }} />
      <path d="M10 21a2 2 0 004 0" />
      <AnimatePresence>{notif && <motion.circle cx="18" cy="6" r="3" fill="hsl(14 100% 56%)" stroke="none" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} />}</AnimatePresence>
    </svg>
  );
}

/* 7. HEART → FILLED */
export function HeartIcon({ size = 40, color = "currentColor", className, duration = 2000 }: StateIconProps) {
  const filled = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <motion.path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z" animate={{ fill: filled ? color : "transparent", scale: filled ? [1, 1.15, 1] : 1 }} transition={{ duration: 0.4 }} style={{ originX: 0.5, originY: 0.5 }} />
    </svg>
  );
}

/* 8. DOWNLOAD → DONE */
export function DownloadDoneIcon({ size = 40, color = "currentColor", className, duration = 2400 }: StateIconProps) {
  const done = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      <AnimatePresence mode="wait">
        {done ? (
          <motion.path key="ok" d="M8 12l3 3 5-6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ pathLength: 0 }} />
        ) : (
          <motion.g key="dl" initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 4, opacity: 0 }}>
            <line x1="12" y1="3" x2="12" y2="15" />
            <polyline points="7,10 12,15 17,10" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

/* 9. SEND */
export function SendIcon({ size = 40, color = "currentColor", className, duration = 2600 }: StateIconProps) {
  const sent = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <motion.g animate={{ x: sent ? 12 : 0, y: sent ? -12 : 0, opacity: sent ? 0 : 1 }} transition={{ duration: 0.6 }}>
        <path d="M3 11l18-8-8 18-2-8-8-2z" />
      </motion.g>
    </svg>
  );
}

/* 10. TOGGLE */
export function ToggleIcon({ size = 40, color = "currentColor", className, duration = 1800 }: StateIconProps) {
  const on = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <rect x="2" y="7" width="20" height="10" rx="5" fill={on ? color : "transparent"} fillOpacity={on ? 0.15 : 0} />
      <motion.circle cx="7" cy="12" r="3" fill={color} stroke="none" animate={{ cx: on ? 17 : 7 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
    </svg>
  );
}

/* 11. EYE → HIDDEN */
export function EyeToggleIcon({ size = 40, color = "currentColor", className, duration = 2200 }: StateIconProps) {
  const hidden = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <motion.line x1="3" y1="3" x2="21" y2="21" animate={{ pathLength: hidden ? 1 : 0 }} transition={{ duration: 0.3 }} />
    </svg>
  );
}

/* 12. VOLUME */
export function VolumeIcon({ size = 40, color = "currentColor", className, duration = 2400 }: StateIconProps) {
  const muted = useAutoToggle(duration);
  return (
    <svg {...baseProps(size)} stroke={color} className={cn(className)}>
      <polygon points="4,9 9,9 14,4 14,20 9,15 4,15" fill={color} />
      <AnimatePresence mode="wait">
        {muted ? (
          <motion.g key="mute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <line x1="17" y1="9" x2="22" y2="14" /><line x1="22" y1="9" x2="17" y2="14" />
          </motion.g>
        ) : (
          <motion.g key="wave" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <path d="M17 8a5 5 0 010 8" /><path d="M19 5a9 9 0 010 14" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
