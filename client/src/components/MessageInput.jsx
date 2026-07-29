import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, Smile, X, AlertCircle } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import api from "../services/api.js";

const MessageInput = ({ onSend, onTyping, replyTo, onCancelReply }) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [sendPulse, setSendPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pickerSize, setPickerSize] = useState({
    width: 320,
    height: 360,
  });

  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const inputRowRef = useRef(null);
  const typingTimeout = useRef(null);
  const errorTimeout = useRef(null);

  const MAX_FILE_MB = 15;

  /* -------------------------------------------------------
     Detect mobile viewport
  ------------------------------------------------------- */
  useEffect(() => {
    const updateMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    updateMobile();

    window.addEventListener("resize", updateMobile);

    return () => {
      window.removeEventListener("resize", updateMobile);
    };
  }, []);

  /* -------------------------------------------------------
     Responsive emoji picker sizing
  ------------------------------------------------------- */
  useEffect(() => {
    const updatePickerSize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (viewportWidth < 640) {
        const width = Math.min(
          360,
          Math.max(280, viewportWidth - 24)
        );

        const height = Math.min(
          390,
          Math.max(300, viewportHeight * 0.48)
        );

        setPickerSize({
          width,
          height,
        });
      } else if (viewportWidth < 1024) {
        setPickerSize({
          width: 340,
          height: 400,
        });
      } else {
        setPickerSize({
          width: 350,
          height: 420,
        });
      }
    };

    updatePickerSize();

    window.addEventListener("resize", updatePickerSize);
    window.addEventListener("orientationchange", updatePickerSize);

    return () => {
      window.removeEventListener("resize", updatePickerSize);
      window.removeEventListener("orientationchange", updatePickerSize);
    };
  }, []);

  /* -------------------------------------------------------
     Cleanup
  ------------------------------------------------------- */
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeout.current);
      clearTimeout(errorTimeout.current);
    };
  }, []);

  /* -------------------------------------------------------
     Escape / Back behaviour
     If emoji picker is open, close it first.
  ------------------------------------------------------- */
  useEffect(() => {
    if (!showEmoji) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowEmoji(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEmoji]);

  /* -------------------------------------------------------
     Error helper
  ------------------------------------------------------- */
  const flashError = (msg) => {
    setUploadError(msg);

    clearTimeout(errorTimeout.current);

    errorTimeout.current = setTimeout(() => {
      setUploadError("");
    }, 5000);
  };

  /* -------------------------------------------------------
     Text input
  ------------------------------------------------------- */
  const handleChange = (e) => {
    const value = e.target.value;

    setText(value);

    onTyping?.(true);

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      onTyping?.(false);
    }, 1200);
  };

  /* -------------------------------------------------------
     Emoji selection
     Inserts at the last known cursor position and keeps
     the picker open so multiple emoji can be chosen in a row,
     exactly like WhatsApp / Telegram.
  ------------------------------------------------------- */
  const handleEmojiClick = (emojiData) => {
    const emojiChar = emojiData?.native || emojiData?.emoji || "";

    setText((currentText) => {
      const input = inputRef.current;

      if (!input) {
        return currentText + emojiChar;
      }

      const start = input.selectionStart ?? currentText.length;
      const end = input.selectionEnd ?? currentText.length;

      const nextText =
        currentText.slice(0, start) +
        emojiChar +
        currentText.slice(end);

      /*
        Restore cursor right after the inserted emoji on the
        next tick so consecutive picks land in the right spot.
      */
      requestAnimationFrame(() => {
        const pos = start + emojiChar.length;
        input.setSelectionRange?.(pos, pos);
      });

      return nextText;
    });
  };

  /* -------------------------------------------------------
     Open emoji picker
  ------------------------------------------------------- */
  const openEmojiPicker = () => {
    const nextState = !showEmoji;

    setShowEmoji(nextState);

    if (nextState) {
      /*
        Hide native keyboard when opening emoji picker.
        blur() is intentionally used only here.
      */
      inputRef.current?.blur();
    } else {
      /*
        Closing emoji picker returns focus to input,
        which opens the native mobile keyboard.
      */
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  };

  /* -------------------------------------------------------
     Submit text message
  ------------------------------------------------------- */
  const submit = () => {
    if (!text.trim() || uploading) return;

    onSend({
      type: "text",
      text: text.trim(),
      replyTo: replyTo?._id || null,
    });

    setText("");

    setShowEmoji(false);

    setSendPulse(true);

    setTimeout(() => {
      setSendPulse(false);
    }, 220);

    onCancelReply?.();

    /*
      Keep input focused after sending.
      Native keyboard stays open on mobile,
      exactly like modern chat apps.
    */
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  /* -------------------------------------------------------
     Enter = Send
     Shift + Enter = New line
  ------------------------------------------------------- */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  /* -------------------------------------------------------
     File upload
  ------------------------------------------------------- */
  const handleFile = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      flashError(
        `"${file.name}" is over the ${MAX_FILE_MB}MB limit.`
      );

      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const { data } = await api.post(
        "/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },

          onUploadProgress: (evt) => {
            if (!evt.total) return;

            setUploadProgress(
              Math.round(
                (evt.loaded / evt.total) * 100
              )
            );
          },
        }
      );

      const type = file.type.startsWith("image/")
        ? "image"
        : "file";

      onSend({
        type,
        attachment: data,
        replyTo: replyTo?._id || null,
      });

      onCancelReply?.();

      /*
        Return focus to input after attachment upload.
      */
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message;

      flashError(
        serverMessage ||
          "Upload failed. Check your connection and try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);

      e.target.value = "";
    }
  };

  return (
    <div
      className="
        relative
        w-full
        max-w-full
        border-t border-white/5
        bg-sidebar/60
        backdrop-blur
        px-2.5 py-2
        xs:px-3 xs:py-2.5
        sm:px-4 sm:py-3
        overflow-hidden
      "
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 0.625rem)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 0.625rem)",
      }}
    >
      {/* -------------------------------------------------
          Upload Error
      ------------------------------------------------- */}
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
              flex items-start gap-2
              bg-red-500/10
              border border-red-500/20
              text-red-300
              text-xs
              rounded-lg
              px-3 py-2
              mb-2
              max-w-full
            "
          >
            <AlertCircle
              size={14}
              className="flex-shrink-0 mt-0.5"
            />

            <span className="flex-1 min-w-0 break-words">
              {uploadError}
            </span>

            <button
              onClick={() => setUploadError("")}
              className="
                flex-shrink-0
                hover:text-red-100
              "
              aria-label="Dismiss error"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------
          Upload Progress
      ------------------------------------------------- */}
      {uploading && (
        <div
          className="
            h-0.5
            w-full
            bg-white/5
            rounded-full
            mb-2
            overflow-hidden
          "
        >
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

      {/* -------------------------------------------------
          Reply Preview
      ------------------------------------------------- */}
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
              flex items-start
              justify-between
              gap-2
              bg-chat
              rounded-lg
              px-3 py-2
              mb-2
              border-l-2
              border-ember
              max-w-full
            "
          >
            <div
              className="
                text-sm
                text-muted
                min-w-0
                pr-2
                line-clamp-2
                break-words
              "
            >
              Replying to{" "}
              <span className="text-ink break-words">
                {replyTo.text || "attachment"}
              </span>
            </div>

            <button
              onClick={onCancelReply}
              className="
                text-muted
                hover:text-ink
                flex-shrink-0
                mt-0.5
              "
              aria-label="Cancel reply"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------
          Main Input Row
      ------------------------------------------------- */}
      <div
        ref={inputRowRef}
        className="
          flex
          items-end
          gap-1
          xs:gap-1.5
          sm:gap-2
          w-full
          max-w-full
        "
      >
        {/* File Upload */}
        <button
          type="button"
          onClick={() =>
            fileRef.current?.click()
          }
          disabled={uploading}
          className="
            p-2
            rounded-full
            text-muted
            hover:text-ember
            hover:bg-white/5
            transition-colors
            flex-shrink-0
            disabled:opacity-40
            touch-manipulation
          "
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip size={20} className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileRef}
          className="hidden"
          onChange={handleFile}
        />

        {/* -------------------------------------------------
            Text Input
        ------------------------------------------------- */}
        <div className="relative flex-1 min-w-0">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              /*
                When user taps the input,
                emoji picker should close and
                native mobile keyboard should open.
              */
              if (showEmoji) {
                setShowEmoji(false);
              }
            }}
            rows={1}
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
            spellCheck="true"
            placeholder={
              uploading
                ? `Uploading… ${uploadProgress}%`
                : "Type a message"
            }
            className="
              w-full
              resize-none
              bg-chat
              border border-white/5
              focus:border-ember/50
              outline-none
              rounded-2xl
              px-3 py-2.5
              xs:px-3.5
              sm:px-4
              text-sm
              sm:text-base
              text-ink
              placeholder:text-muted
              transition-colors
              max-h-32
              min-h-[42px]
              leading-relaxed
              break-words
            "
          />
        </div>

        {/* -------------------------------------------------
            Emoji Button
        ------------------------------------------------- */}
        <button
          type="button"
          onClick={openEmojiPicker}
          className={`
            p-2
            rounded-full
            transition-colors
            flex-shrink-0
            touch-manipulation
            ${
              showEmoji
                ? "text-ember bg-white/10"
                : "text-muted hover:text-amber hover:bg-white/5"
            }
          `}
          title="Emoji"
          aria-label="Emoji"
          aria-expanded={showEmoji}
        >
          <Smile size={20} className="w-5 h-5" />
        </button>

        {/* -------------------------------------------------
            Send Button
        ------------------------------------------------- */}
        <motion.button
          type="button"
          animate={{
            scale: sendPulse ? 0.85 : 1,
          }}
          onClick={submit}
          disabled={!text.trim() || uploading}
          className="
            p-2.5
            rounded-full
            bg-ember
            text-bg
            hover:brightness-110
            transition-all
            disabled:opacity-40
            flex-shrink-0
            touch-manipulation
          "
          title="Send"
          aria-label="Send message"
        >
          <Send size={18} className="w-[18px] h-[18px]" />
        </motion.button>
      </div>

      {/* -------------------------------------------------
          Emoji Picker
          IMPORTANT:
          It is rendered outside the input's relative
          container to prevent clipping and weird positioning.
      ------------------------------------------------- */}
      <AnimatePresence>
        {showEmoji && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-[9998]"
                onClick={() => setShowEmoji(false)}
              />
            )}

            <motion.div
              initial={
                isMobile
                  ? { y: "100%" }
                  : { opacity: 0, scale: 0.95 }
              }
              animate={
                isMobile
                  ? { y: 0 }
                  : { opacity: 1, scale: 1 }
              }
              exit={
                isMobile
                  ? { y: "100%" }
                  : { opacity: 0, scale: 0.95 }
              }
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
              }}
              className={
                isMobile
                  ? `
                    fixed
                    left-0
                    right-0
                    bottom-0
                    z-[9999]
                    rounded-t-3xl
                    overflow-hidden
                    max-w-full
                    flex
                    justify-center
                  `
                  : `
                    absolute
                    bottom-14
                    right-0
                    z-50
                    max-w-[calc(100vw-2rem)]
                    overflow-hidden
                    rounded-xl
                    shadow-xl
                  `
              }
              style={
                isMobile
                  ? {
                      paddingBottom:
                        "env(safe-area-inset-bottom, 0px)",
                      width: "100%",
                    }
                  : undefined
              }
            >
              <div
                style={{
                  width: pickerSize.width,
                  maxWidth: "100%",
                  height: pickerSize.height,
                }}
              >
                <Picker
                  data={data}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                  navPosition="top"
                  perLine={isMobile ? 8 : 9}
                  emojiSize={22}
                  dynamicWidth={true}
                  onEmojiSelect={handleEmojiClick}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageInput;
