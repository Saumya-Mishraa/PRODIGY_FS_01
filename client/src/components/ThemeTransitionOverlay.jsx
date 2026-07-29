import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext.jsx";

/**
 * Soft radial colour wipe that expands from the point where
 * the user selected a theme.
 *
 * The overlay is purely decorative and never blocks interaction.
 */
const ThemeTransitionOverlay = () => {
  const { transition } = useTheme();

  if (!transition) {
    return null;
  }

  const {
    x = 0,
    y = 0,
    color = "transparent",
  } = transition;

  const transitionKey = `${x}-${y}-${color}`;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={transitionKey}
        initial={{
          clipPath: `circle(0px at ${x}px ${y}px)`,
          WebkitClipPath: `circle(0px at ${x}px ${y}px)`,
          opacity: 0.55,
        }}
        animate={{
          clipPath: `circle(160% at ${x}px ${y}px)`,
          WebkitClipPath: `circle(160% at ${x}px ${y}px)`,
          opacity: 0.28,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          clipPath: {
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          },
          WebkitClipPath: {
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          },
          opacity: {
            duration: 0.25,
            ease: "easeOut",
          },
        }}
        style={{
          background: color,
          willChange: "clip-path, opacity",
        }}
        className="
          fixed
          inset-0
          z-[999]
          pointer-events-none
          select-none
          overflow-hidden
          mix-blend-soft-light
        "
        aria-hidden="true"
      />
    </AnimatePresence>
  );
};

export default ThemeTransitionOverlay;