import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const ThemeSelector = () => {
  const { themeId, themes = [], setTheme } = useTheme();

  const pick = (id) => (event) => {
    setTheme(id, {
      x: event.clientX,
      y: event.clientY,
    });
  };

  if (!themes.length) {
    return (
      <div className="w-full py-4 text-center">
        <p className="text-sm text-muted">
          No themes available.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Description */}
      <p
        className="
          text-xs
          sm:text-sm
          text-muted
          mb-4
          leading-relaxed
        "
      >
        Pick the mood for your whole workspace — chat,
        sidebar, modals and more update together.
      </p>

      {/* Theme Grid */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          gap-3
          w-full
        "
      >
        {themes.map((theme) => {
          const active =
            theme.id === themeId;

          return (
            <motion.button
              key={theme.id}
              type="button"
              onClick={pick(theme.id)}
              aria-pressed={active}
              aria-label={`Select ${theme.name} theme`}
              whileTap={{ scale: 0.98 }}
              className={`
                relative
                w-full
                min-w-0
                text-left
                rounded-2xl
                p-3
                sm:p-3.5
                border
                bg-chat/50
                hover:bg-chat
                transition-colors
                overflow-hidden
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-ember/60
                focus-visible:ring-offset-2
                focus-visible:ring-offset-sidebar
                ${
                  active
                    ? "border-ember/50"
                    : "border-white/5 hover:border-white/10"
                }
              `}
            >
              {/* Active Theme Ring */}
              {active && (
                <motion.div
                  layoutId="theme-active-ring"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 32,
                  }}
                  className="
                    absolute
                    inset-0
                    rounded-2xl
                    ring-2
                    ring-ember/60
                    pointer-events-none
                  "
                />
              )}

              {/* Theme Header */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  mb-3
                  min-w-0
                "
              >
                {/* Colour Swatches */}
                <div
                  className="
                    flex
                    items-center
                    -space-x-1.5
                    min-w-0
                  "
                  aria-hidden="true"
                >
                  {(theme.swatch || []).map(
                    (colour, index) => (
                      <span
                        key={`${theme.id}-swatch-${index}`}
                        style={{
                          background: colour,
                        }}
                        className="
                          w-5
                          h-5
                          sm:w-6
                          sm:h-6
                          rounded-full
                          border-2
                          border-sidebar
                          block
                          flex-shrink-0
                        "
                      />
                    )
                  )}
                </div>

                {/* Active Check */}
                {active && (
                  <motion.span
                    initial={{
                      scale: 0,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 22,
                    }}
                    className="
                      w-5
                      h-5
                      rounded-full
                      bg-ember
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                    "
                  >
                    <Check
                      size={12}
                      className="text-bg"
                      strokeWidth={3}
                    />
                  </motion.span>
                )}
              </div>

              {/* Theme Name */}
              <p
                className="
                  font-display
                  text-sm
                  font-semibold
                  truncate
                "
              >
                {theme.name}
              </p>

              {/* Theme Tagline */}
              <p
                className="
                  text-xs
                  text-muted
                  mt-1
                  leading-relaxed
                  break-words
                "
              >
                {theme.tagline}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;