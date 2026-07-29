import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

/**
 * Full-screen lightbox for viewing shared chat images.
 * Closes on backdrop click or Escape key.
 */
const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    if (!src) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="
            fixed inset-0
            z-[1000]
            flex items-center justify-center
            bg-black/85
            backdrop-blur-sm
            p-3
            sm:p-6
            md:p-8
            overflow-hidden
          "
        >
          {/* Image */}
          <motion.img
            key={src}
            src={src}
            alt={alt || "Shared image"}
            initial={{
              opacity: 0,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 30,
            }}
            onClick={(event) => event.stopPropagation()}
            className="
              block
              max-w-full
              max-h-[calc(100vh-96px)]
              sm:max-h-[calc(100vh-112px)]
              md:max-h-[calc(100vh-128px)]
              w-auto
              h-auto
              rounded-lg
              sm:rounded-xl
              object-contain
              shadow-2xl
              select-none
            "
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="
              absolute
              top-3 right-3
              sm:top-5 sm:right-5
              md:top-6 md:right-6
              flex items-center justify-center
              w-10 h-10
              sm:w-11 sm:h-11
              rounded-full
              bg-black/50
              text-white
              hover:bg-black/70
              active:bg-black/80
              backdrop-blur-sm
              transition-colors
              z-10
            "
          >
            <X size={20} />
          </button>

          {/* Download Button */}
          <a
            href={src}
            download
            onClick={(event) => event.stopPropagation()}
            aria-label="Download image"
            className="
              absolute
              top-3 left-3
              sm:top-5 sm:left-5
              md:top-6 md:left-6
              flex items-center justify-center
              w-10 h-10
              sm:w-11 sm:h-11
              rounded-full
              bg-black/50
              text-white
              hover:bg-black/70
              active:bg-black/80
              backdrop-blur-sm
              transition-colors
              z-10
            "
          >
            <Download size={20} />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;