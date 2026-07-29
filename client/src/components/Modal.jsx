import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const Modal = ({
  open,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="
            fixed inset-0
            z-50
            flex items-center justify-center
            bg-black/60
            backdrop-blur-sm
            px-3
            py-4
            sm:px-4
            sm:py-6
            overflow-y-auto
          "
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 8,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-label={title || "Dialog"}
            className="
              relative
              bg-sidebar
              border border-white/10
              rounded-xl
              sm:rounded-2xl
              w-full
              max-w-md
              max-h-[calc(100vh-2rem)]
              sm:max-h-[85vh]
              flex flex-col
              p-4
              sm:p-6
              shadow-2xl
              overflow-hidden
              my-auto
            "
          >
            {/* Modal Header */}
            <div className="
              flex items-center
              justify-between
              gap-3
              mb-4
              flex-shrink-0
            ">
              <h3 className="
                font-display
                text-base
                sm:text-lg
                font-semibold
                truncate
                min-w-0
              ">
                {title}
              </h3>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="
                  flex-shrink-0
                  flex items-center justify-center
                  w-9 h-9
                  rounded-full
                  text-muted
                  hover:text-ink
                  hover:bg-white/5
                  active:bg-white/10
                  transition-colors
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="
              flex-1
              min-h-0
              overflow-y-auto
              overflow-x-hidden
              -mx-1
              px-1
              overscroll-contain
            ">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;