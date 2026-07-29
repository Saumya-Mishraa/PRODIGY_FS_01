import React, { useRef, useState, useEffect } from "react";
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
  const [pickerWidth, setPickerWidth] = useState(320);

  const fileRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRowRef = useRef(null);
  const errorTimeout = useRef(null);

  // The emoji picker library only accepts a fixed pixel width, so on
  // narrow phones (320-390px) a hardcoded 350px would overflow the
  // viewport. Size it to the input row instead, capped at a sensible max.
  useEffect(() => {
    const measure = () => {
      const rowWidth = inputRowRef.current?.offsetWidth || 320;
      setPickerWidth(Math.max(260, Math.min(350, rowWidth)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => () => clearTimeout(errorTimeout.current), []);

  const flashError = (msg) => {
    setUploadError(msg);
    clearTimeout(errorTimeout.current);
    errorTimeout.current = setTimeout(() => setUploadError(""), 5000);
  };

  const handleChange = (e) => {
    setText(e.target.value);

    onTyping?.(true);

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      onTyping?.(false);
    }, 1200);
  };

  const handleEmojiClick = (emojiData) => {
    setText((currentText) => currentText + emojiData.emoji);
  };

  const submit = () => {
    if (!text.trim()) return;

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
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const MAX_FILE_MB = 15;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      flashError(`"${file.name}" is over the ${MAX_FILE_MB}MB limit.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      const type = file.type.startsWith("image/") ? "image" : "file";

      onSend({
        type,
        attachment: data,
        replyTo: replyTo?._id || null,
      });

      onCancelReply?.();
    } catch (err) {
      // Root-cause fix (see server/src/routes/uploadRoutes.js): the server
      // now always reports a real error here instead of silently
      // succeeding with a broken URL, so this message is trustworthy.
      const serverMessage = err?.response?.data?.message;
      flashError(serverMessage || "Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  return (
    <div className="border-t border-white/5 bg-sidebar/60 backdrop-blur px-3 py-2.5 sm:px-4 sm:py-3">
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg px-3 py-2 mb-2"
          >
            <AlertCircle size={14} className="flex-shrink-0" />
            <span className="flex-1 min-w-0">{uploadError}</span>
            <button onClick={() => setUploadError("")} className="flex-shrink-0 hover:text-red-100">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {uploading && (
        <div className="h-0.5 bg-white/5 rounded-full mb-2 overflow-hidden">
          <motion.div
            className="h-full bg-ember"
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      )}

      {replyTo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-chat rounded-lg px-3 py-2 mb-2 border-l-2 border-ember"
        >
          <div className="text-sm text-muted truncate">
            Replying to{" "}
            <span className="text-ink">
              {replyTo.text || "attachment"}
            </span>
          </div>

          <button
            onClick={onCancelReply}
            className="text-muted hover:text-ink"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      <div ref={inputRowRef} className="flex items-end gap-1.5 sm:gap-2">

        {/* File Upload */}
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 rounded-full text-muted hover:text-ember hover:bg-white/5 transition-colors flex-shrink-0"
          title="Attach file"
          disabled={uploading}
        >
          <Paperclip size={20} />
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
            placeholder={
              uploading
                ? `Uploading… ${uploadProgress}%`
                : "Type a message"
            }
            className="w-full resize-none bg-chat border border-white/5 focus:border-ember/50 outline-none rounded-2xl px-3.5 py-2.5 sm:px-4 text-ink placeholder:text-muted transition-colors max-h-32"
          />

          {/* Full Emoji Picker */}
          {showEmoji && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 24,
              }}
              className="absolute bottom-14 right-0 z-50 max-w-[calc(100vw-1.5rem)]"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                searchDisabled={false}
                skinTonesDisabled={false}
                lazyLoadEmojis
                width={pickerWidth}
                height={Math.min(420, pickerWidth * 1.2)}
                previewConfig={{
                  showPreview: false,
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmoji((s) => !s)}
          className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            showEmoji
              ? "text-ember bg-white/10"
              : "text-muted hover:text-amber hover:bg-white/5"
          }`}
          title="Emoji"
        >
          <Smile size={20} />
        </button>

        {/* Send Button */}
        <motion.button
          animate={{
            scale: sendPulse ? 0.85 : 1,
          }}
          onClick={submit}
          className="p-2.5 rounded-full bg-ember text-bg hover:brightness-110 transition-all disabled:opacity-40 flex-shrink-0"
          disabled={!text.trim()}
          title="Send"
        >
          <Send size={18} />
        </motion.button>

      </div>
    </div>
  );
};

export default MessageInput;
