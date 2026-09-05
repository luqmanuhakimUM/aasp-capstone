export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0, duration: 0.35 } },
};

// Spread onto a motion.* element to have it float up into place the first
// time it scrolls into view, instead of animating on mount.
export const scrollReveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { type: "spring" as const, bounce: 0, duration: 0.4 },
};
