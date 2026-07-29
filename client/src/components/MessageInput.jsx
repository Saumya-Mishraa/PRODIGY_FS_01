import React, { useRef, useState, useEffect } from "react";
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
  const [pickerWidth, setPickerWidth] = useState(300);
  const [isMobile, setIsMobile] = useState(false);

  const fileRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRowRef = useRef(null);
  const errorTimeout = useRef(null);
  const sendPulseTimeout = useRef(null);

  /*
   * Responsive Emoji Picker sizing.
   *
   * On mobile:
   * - Keep the picker inside the viewport.
   * - Use almost the full available screen width.
   *
   * On desktop:
   * - Keep the picker at a comfortable fixed width.
   */
  useEffect(() => {
    const measurePicker = () => {
      const viewportWidth = window.innerWidth || 320;
      const mobile = viewportWidth < 640;

      setIsMobile(mobile);

      if (mobile) {
        // Keep a small safe margin on both sides.
        const mobileWidth = Math.min(
          350,
          Math.max(280, viewportWidth - 24)
        );

        setPickerWidth(mobileWidth);
      } else {
        const rowWidth =
          inputRowRef.current?.offsetWidth || 350;

        setPickerWidth(
          Math.min(350, Math.max(300, rowWidth))
        );
      }
    };

    measurePicker();

    window.addEventListener("resize", measurePicker);

    return () => {
      window.removeEventListener("resize", measurePicker);
    };
  }, []);

  /*
   * Clear timers when component unmounts.
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
    /*
     * Enter = Send
     * Shift + Enter = New line
     */
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      submit();
    }
  };

  const MAX_FILE_MB = 15;

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

      /*
       * Allows the user to select the same file again.
       */
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
        ref={inputRowRef}
        className="
          relative
          flex items-end
          gap-1
          sm:gap-2
          min-w-0
        "
      >
        {/* File Upload Button */}
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

        {/* Text Input */}
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
          type="button"
          onClick={() =>
            setShowEmoji(
              (state) => !state
            )
          }
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
            className={`
              z-[60]
              overflow-hidden
              rounded-xl
              shadow-2xl
              ${
                isMobile
                  ? "fixed bottom-[72px] left-1/2 -translate-x-1/2"
                  : "absolute bottom-[72px] right-4"
              }
            `}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
              searchDisabled={false}
              skinTonesDisabled={false}
              lazyLoadEmojis
              width={pickerWidth}
              height={
                isMobile
                  ? Math.min(400, pickerWidth * 1.15)
                  : Math.min(420, pickerWidth * 1.2)
              }
              previewConfig={{
                showPreview: false,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageInput;