import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, Smile, X, AlertCircle } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
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
      } else {
        setPickerSize({
          width: 350,
          height: 420,
        });
      }
    };

    updatePickerSize();

    window.addEventListener("resize", updatePickerSize);

    return () => {
      window.removeEventListener("resize", updatePickerSize);
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
  ------------------------------------------------------- */
  const handleEmojiClick = (emojiData) => {
    setText((currentText) => {
      const input = inputRef.current;

      if (!input) {
        return currentText + emojiData.emoji;
      }

      const start = input.selectionStart ?? currentText.length;
      const end = input.selectionEnd ?? currentText.length;

      return (
        currentText.slice(0, start) +
        emojiData.emoji +
        currentText.slice(end)
      );
    });

    /*
      After selecting emoji, keep the input focused.
      This allows continuous typing just like WhatsApp.
    */
    requestAnimationFrame(() => {
      inputRef.current?.focus();
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
        border-t border-white/5
        bg-sidebar/60
        backdrop-blur
        px-3 py-2.5
        sm:px-4 sm:py-3
      "
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
              flex items-center gap-2
              bg-red-500/10
              border border-red-500/20
              text-red-300
              text-xs
              rounded-lg
              px-3 py-2
              mb-2
            "
          >
            <AlertCircle
              size={14}
              className="flex-shrink-0"
            />

            <span className="flex-1 min-w-0">
              {uploadError}
            </span>

            <button
              onClick={() => setUploadError("")}
              className="
                flex-shrink-0
                hover:text-red-100
              "
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
              flex items-center
              justify-between
              bg-chat
              rounded-lg
              px-3 py-2
              mb-2
              border-l-2
              border-ember
            "
          >
            <div
              className="
                text-sm
                text-muted
                truncate
                min-w-0
                pr-2
              "
            >
              Replying to{" "}
              <span className="text-ink">
                {replyTo.text || "attachment"}
              </span>
            </div>

            <button
              onClick={onCancelReply}
              className="
                text-muted
                hover:text-ink
                flex-shrink-0
              "
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
          gap-1.5
          sm:gap-2
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
          "
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip size={20} />
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
              px-3.5 py-2.5
              sm:px-4
              text-ink
              placeholder:text-muted
              transition-colors
              max-h-32
              min-h-[42px]
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
          <Smile size={20} />
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
          "
          title="Send"
          aria-label="Send message"
        >
          <Send size={18} />
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
            {/* Mobile backdrop */}
            {isMobile && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                onClick={() => {
                  setShowEmoji(false);

                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 80);
                }}
                className="
                  fixed
                  inset-0
                  z-[55]
                  bg-black/10
                  sm:hidden
                "
              />
            )}

            <motion.div
              initial={{
                opacity: 0,
                y: 12,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 8,
                scale: 0.96,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 28,
              }}
              className={`
                z-[60]
                ${
                  isMobile
                    ? `
                      fixed
                      left-1/2
                      -translate-x-1/2
                      bottom-[76px]
                    `
                    : `
                      absolute
                      right-3
                      bottom-[72px]
                    `
                }
              `}
            >
              <div
                className="
                  rounded-2xl
                  overflow-hidden
                  shadow-2xl
                  border border-white/10
                "
              >
                <EmojiPicker
                  onEmojiClick={
                    handleEmojiClick
                  }
                  theme="dark"
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  lazyLoadEmojis
                  width={pickerSize.width}
                  height={pickerSize.height}
                  previewConfig={{
                    showPreview: false,
                  }}
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
