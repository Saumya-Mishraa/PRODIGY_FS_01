import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Send,
  Smile,
  X,
  AlertCircle,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import api from "../services/api.js";

const MessageInput = ({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
}) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [sendPulse, setSendPulse] = useState(false);

  const [emojiPosition, setEmojiPosition] = useState({
    top: 0,
    left: 0,
    width: 320,
    height: 380,
  });

  const fileRef = useRef(null);
  const typingTimeout = useRef(null);
  const errorTimeout = useRef(null);
  const sendPulseTimeout = useRef(null);
  const emojiBtnRef = useRef(null);

  const MAX_FILE_MB = 15;

  /*
   * Calculate the emoji picker's position from the actual emoji button.
   *
   * The picker is rendered with position: fixed, so it is positioned
   * relative to the browser viewport instead of the chat/input container.
   *
   * This prevents mobile overflow when:
   * - The chat panel is narrow
   * - A sidebar is visible
   * - The browser viewport is small
   * - The input is inside another positioned element
   */
  const updateEmojiPosition = () => {
    const button = emojiBtnRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const horizontalPadding = 8;
    const verticalPadding = 8;
    const gap = 10;

    /*
     * Responsive picker width.
     *
     * Small phones:
     *  - Use almost the full viewport width.
     *
     * Larger phones/tablets/desktops:
     *  - Maximum 350px.
     */
    const pickerWidth = Math.min(
      350,
      Math.max(260, viewportWidth - horizontalPadding * 2)
    );

    /*
     * Responsive height.
     *
     * Prevent the picker from becoming taller than the available
     * viewport space.
     */
    const pickerHeight = Math.min(
      420,
      Math.max(280, viewportHeight * 0.55)
    );

    /*
     * Try to align the picker to the right edge of the emoji button.
     */
    let left = rect.right - pickerWidth;

    /*
     * Keep picker inside the viewport horizontally.
     */
    left = Math.max(
      horizontalPadding,
      Math.min(
        left,
        viewportWidth - pickerWidth - horizontalPadding
      )
    );

    /*
     * Default: open ABOVE the emoji button.
     */
    let top = rect.top - pickerHeight - gap;

    /*
     * If there isn't enough space above,
     * open BELOW the emoji button instead.
     */
    if (top < verticalPadding) {
      top = rect.bottom + gap;
    }

    /*
     * Keep picker inside the viewport vertically.
     */
    if (
      top + pickerHeight >
      viewportHeight - verticalPadding
    ) {
      top =
        viewportHeight -
        pickerHeight -
        verticalPadding;
    }

    /*
     * Final safety check for very short screens.
     */
    top = Math.max(verticalPadding, top);

    setEmojiPosition({
      top,
      left,
      width: pickerWidth,
      height: pickerHeight,
    });
  };

  /*
   * Recalculate picker position whenever it opens.
   */
  useLayoutEffect(() => {
    if (!showEmoji) return;

    updateEmojiPosition();

    const handleResize = () => {
      updateEmojiPosition();
    };

    const handleScroll = () => {
      updateEmojiPosition();
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    window.addEventListener(
      "orientationchange",
      handleResize
    );

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      window.removeEventListener(
        "orientationchange",
        handleResize
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [showEmoji]);

  /*
   * Close emoji picker when clicking outside.
   *
   * The picker itself is rendered through the same component tree,
   * so clicks inside it are ignored.
   */
  useEffect(() => {
    if (!showEmoji) return;

    const handlePointerDown = (event) => {
      const button = emojiBtnRef.current;

      if (
        button &&
        button.contains(event.target)
      ) {
        return;
      }

      const picker = document.querySelector(
        ".velora-emoji-picker"
      );

      if (
        picker &&
        picker.contains(event.target)
      ) {
        return;
      }

      setShowEmoji(false);
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [showEmoji]);

  /*
   * Clear timers on unmount.
   */
  useEffect(() => {
    return () => {
      clearTimeout(errorTimeout.current);
      clearTimeout(typingTimeout.current);
      clearTimeout(sendPulseTimeout.current);
    };
  }, []);

  const flashError = (message) => {
    setUploadError(message);

    clearTimeout(errorTimeout.current);

    errorTimeout.current = setTimeout(() => {
      setUploadError("");
    }, 5000);
  };

  const handleChange = (event) => {
    const value = event.target.value;

    setText(value);

    onTyping?.(true);

    clearTimeout(typingTimeout.current);

    if (!value.trim()) {
      onTyping?.(false);
      return;
    }

    typingTimeout.current = setTimeout(() => {
      onTyping?.(false);
    }, 1200);
  };

  const handleEmojiClick = (emojiData) => {
    setText(
      (currentText) =>
        currentText + emojiData.emoji
    );
  };

  const submit = () => {
    const trimmedText = text.trim();

    if (!trimmedText || uploading) {
      return;
    }

    onSend({
      type: "text",
      text: trimmedText,
      replyTo: replyTo?._id || null,
    });

    setText("");
    setShowEmoji(false);

    clearTimeout(typingTimeout.current);
    onTyping?.(false);

    setSendPulse(true);

    clearTimeout(sendPulseTimeout.current);

    sendPulseTimeout.current = setTimeout(() => {
      setSendPulse(false);
    }, 220);

    onCancelReply?.();
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      submit();
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.size >
      MAX_FILE_MB * 1024 * 1024
    ) {
      flashError(
        `"${file.name}" is over the ${MAX_FILE_MB}MB limit.`
      );

      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError("");
    setShowEmoji(false);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const { data } = await api.post(
        "/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) {
              return;
            }

            setUploadProgress(
              Math.round(
                (progressEvent.loaded /
                  progressEvent.total) *
                  100
              )
            );
          },
        }
      );

      const type = file.type.startsWith(
        "image/"
      )
        ? "image"
        : "file";

      onSend({
        type,
        attachment: data,
        replyTo: replyTo?._id || null,
      });

      onCancelReply?.();
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message;

      flashError(
        serverMessage ||
          "Upload failed. Check your connection and try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);

      event.target.value = "";
    }
  };

  return (
    <div className="relative flex-shrink-0 border-t border-white/5 bg-sidebar/60 backdrop-blur px-2.5 py-2.5 sm:px-4 sm:py-3">

      {/* Upload Error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
              height: 0,
            }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="
              flex items-center gap-2
              bg-red-500/10
              border border-red-500/20
              text-red-300
              text-xs
              rounded-lg
              px-3 py-2
              mb-2
              overflow-hidden
            "
          >
            <AlertCircle
              size={14}
              className="flex-shrink-0"
            />

            <span className="flex-1 min-w-0 break-words">
              {uploadError}
            </span>

            <button
              type="button"
              onClick={() =>
                setUploadError("")
              }
              aria-label="Dismiss error"
              className="
                flex-shrink-0
                p-1
                rounded-full
                hover:bg-white/10
                hover:text-red-100
                transition-colors
              "
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      {uploading && (
        <div className="h-0.5 bg-white/5 rounded-full mb-2 overflow-hidden">
          <motion.div
            className="h-full bg-ember"
            initial={{
              width: 0,
            }}
            animate={{
              width: `${uploadProgress}%`,
            }}
            transition={{
              ease: "easeOut",
            }}
          />
        </div>
      )}

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 8,
            }}
            className="
              flex items-center gap-2
              bg-chat
              rounded-lg
              px-3 py-2
              mb-2
              border-l-2 border-ember
              min-w-0
            "
          >
            <div className="flex-1 min-w-0 text-sm text-muted truncate">
              Replying to{" "}
              <span className="text-ink">
                {replyTo.text || "attachment"}
              </span>
            </div>

            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancel reply"
              className="
                flex-shrink-0
                p-1
                rounded-full
                text-muted
                hover:text-ink
                hover:bg-white/5
                transition-colors
              "
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Row */}
      <div
        className="
          relative
          flex items-end
          gap-1
          sm:gap-2
          min-w-0
        "
      >
        {/* File Upload */}
        <button
          type="button"
          onClick={() =>
            fileRef.current?.click()
          }
          disabled={uploading}
          aria-label="Attach file"
          title="Attach file"
          className="
            flex-shrink-0
            flex items-center justify-center
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            text-muted
            hover:text-ember
            hover:bg-white/5
            active:bg-white/10
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition-colors
          "
        >
          <Paperclip size={19} />
        </button>

        <input
          type="file"
          ref={fileRef}
          className="hidden"
          onChange={handleFile}
        />

        {/* Message Input */}
        <div className="relative flex-1 min-w-0">
          <textarea
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={uploading}
            placeholder={
              uploading
                ? `Uploading… ${uploadProgress}%`
                : "Type a message"
            }
            aria-label="Message"
            className="
              block
              w-full
              resize-none
              bg-chat
              border border-white/5
              focus:border-ember/50
              outline-none
              rounded-2xl
              px-3
              py-2.5
              sm:px-4
              text-sm
              sm:text-base
              text-ink
              placeholder:text-muted
              transition-colors
              max-h-32
              overflow-y-auto
              disabled:opacity-60
            "
          />
        </div>

        {/* Emoji Button */}
        <button
          ref={emojiBtnRef}
          type="button"
          onClick={() => {
            setShowEmoji((state) => !state);
          }}
          disabled={uploading}
          aria-label="Open emoji picker"
          title="Emoji"
          className={`
            flex-shrink-0
            flex items-center justify-center
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            transition-colors
            disabled:opacity-40
            disabled:cursor-not-allowed
            ${
              showEmoji
                ? "text-ember bg-white/10"
                : "text-muted hover:text-amber hover:bg-white/5"
            }
          `}
        >
          <Smile size={19} />
        </button>

        {/* Send Button */}
        <motion.button
          type="button"
          animate={{
            scale: sendPulse ? 0.85 : 1,
          }}
          onClick={submit}
          disabled={
            !text.trim() || uploading
          }
          aria-label="Send message"
          title="Send"
          className="
            flex-shrink-0
            flex items-center justify-center
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            bg-ember
            text-bg
            hover:brightness-110
            active:scale-95
            transition-all
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >
          <Send size={17} />
        </motion.button>
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: 10,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
            className="velora-emoji-picker"
            style={{
              position: "fixed",
              top: emojiPosition.top,
              left: emojiPosition.left,
              width: emojiPosition.width,
              maxWidth: "calc(100vw - 16px)",
              zIndex: 9999,
              transformOrigin: "bottom right",
            }}
          >
            <div className="w-full overflow-hidden rounded-2xl shadow-2xl">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                searchDisabled={false}
                skinTonesDisabled={false}
                lazyLoadEmojis
                width={emojiPosition.width}
                height={emojiPosition.height}
                previewConfig={{
                  showPreview: false,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageInput;
