import React from "react";
import { motion } from "framer-motion";

// Three animated particles with slightly offset timing.
// Each dot rises, scales, fades, and subtly blurs to create
// a soft, natural typing animation instead of a generic bounce.
const dotVariants = {
  animate: (index) => ({
    y: [0, -6, 0],
    scale: [0.85, 1.15, 0.85],
    opacity: [0.45, 1, 0.45],
    filter: [
      "blur(0px)",
      "blur(0.3px)",
      "blur(0px)",
    ],
    transition: {
      duration: 1.1,
      repeat: Infinity,
      repeatType: "loop",
      delay: index * 0.18,
      ease: "easeInOut",
    },
  }),
};

const TypingIndicator = ({ name }) => {
  return (
    <div
      className="
        flex
        items-center
        gap-2
        px-3
        sm:px-4
        py-2
        min-w-0
        text-muted
        text-xs
        sm:text-sm
      "
      aria-live="polite"
      aria-label={name ? `${name} is typing` : "Someone is typing"}
    >
      {/* Animated typing bubble */}
      <div
        className="
          flex
          items-center
          justify-center
          gap-1
          flex-shrink-0
          bg-chat
          border
          border-white/5
          rounded-full
          px-3
          py-2
          shadow-sm
        "
      >
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            custom={index}
            variants={dotVariants}
            animate="animate"
            className="
              inline-block
              w-1.5
              h-1.5
              rounded-full
              bg-ember
              flex-shrink-0
            "
          />
        ))}
      </div>

      {/* Typing text */}
      {name && (
        <span
          className="
            min-w-0
            truncate
            max-w-[55vw]
            sm:max-w-xs
          "
        >
          {name} is typing…
        </span>
      )}
    </div>
  );
};

export default TypingIndicator;