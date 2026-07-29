import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  Reply,
  Trash2,
  Copy,
  Smile,
  FileText,
  FileArchive,
  FileSpreadsheet,
  Download,
  ImageOff,
} from "lucide-react";
import Avatar from "./Avatar.jsx";
import ImageLightbox from "./ImageLightbox.jsx";

const REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🐣"];

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const fileIconFor = (mimeType = "") => {
  if (mimeType.includes("zip")) return FileArchive;

  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel")
  ) {
    return FileSpreadsheet;
  }

  return FileText;
};

const MessageBubble = ({
  message,
  isOwn,
  onReply,
  onDelete,
  onReact,
  showSender,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  if (message.deleted) {
    return (
      <div
        className={`flex ${
          isOwn ? "justify-end" : "justify-start"
        } px-3 sm:px-4 py-1`}
      >
        <div className="italic text-muted text-sm px-4 py-2">
          This message was deleted.
        </div>
      </div>
    );
  }

  const isRead =
    message.readBy &&
    message.readBy.length > 1;

  const FileIcon = fileIconFor(
    message.attachment?.mimeType
  );

  const handleCopy = async () => {
    if (!message.text) return;

    try {
      await navigator.clipboard.writeText(
        message.text
      );
    } catch (error) {
      console.error(
        "Failed to copy message:",
        error
      );
    }
  };

  const handleImageRetry = () => {
    setImgError(false);
    setImgLoaded(false);
  };

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 12,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 32,
      }}
      className={`flex ${
        isOwn ? "justify-end" : "justify-start"
      } px-3 sm:px-4 py-1 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div
        className={`
          flex items-end gap-2
          max-w-[92%]
          xs:max-w-[90%]
          sm:max-w-[75%]
          lg:max-w-[65%]
          min-w-0
          ${isOwn ? "flex-row-reverse" : ""}
        `}
      >
        {/* Sender Avatar */}
        {!isOwn && showSender && (
          <div className="flex-shrink-0">
            <Avatar
              name={
                message.sender?.name ||
                "User"
              }
              size={28}
            />
          </div>
        )}

        {/* Message Content */}
        <div className="relative min-w-0 max-w-full">
          {/* Reply Preview */}
          {message.replyTo && (
            <div className="text-xs text-muted border-l-2 border-ember/50 pl-2 mb-1 opacity-80 truncate max-w-full">
              {message.replyTo.text ||
                "Attachment"}
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`
              rounded-2xl
              px-3 py-2
              sm:px-4
              max-w-full
              overflow-hidden
              ${
                isOwn
                  ? "bg-ember text-bg rounded-br-sm"
                  : "bg-chat border border-white/5 text-ink rounded-bl-sm"
              }
            `}
          >
            {/* Image Attachment */}
            {message.type === "image" &&
              message.attachment?.url &&
              (imgError ? (
                <button
                  type="button"
                  onClick={handleImageRetry}
                  className={`
                    w-full
                    max-w-[240px]
                    sm:max-w-xs
                    min-w-[160px]
                    flex flex-col
                    items-center
                    justify-center
                    gap-1.5
                    rounded-lg
                    mb-1
                    py-6
                    px-4
                    text-center
                    ${
                      isOwn
                        ? "bg-black/15"
                        : "bg-black/20"
                    }
                  `}
                >
                  <ImageOff
                    size={22}
                    className="opacity-70"
                  />

                  <span className="text-xs opacity-80 leading-relaxed">
                    Image failed to load
                  </span>

                  <span className="text-[10px] opacity-60">
                    Tap to retry
                  </span>
                </button>
              ) : (
                <div className="relative w-full max-w-[240px] sm:max-w-xs mb-1 overflow-hidden rounded-lg">
                  {/* Image Loading Placeholder */}
                  {!imgLoaded && (
                    <div
                      className="
                        absolute
                        inset-0
                        rounded-lg
                        bg-black/10
                        animate-pulse
                      "
                      style={{
                        aspectRatio: "4 / 3",
                      }}
                    />
                  )}

                  <motion.img
                    src={
                      message.attachment.url
                    }
                    alt={
                      message.attachment.name ||
                      "Shared image"
                    }
                    onLoad={() =>
                      setImgLoaded(true)
                    }
                    onError={() =>
                      setImgError(true)
                    }
                    onClick={() =>
                      setLightboxSrc(
                        message.attachment.url
                      )
                    }
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: imgLoaded
                        ? 1
                        : 0,
                    }}
                    transition={{
                      duration: 0.35,
                    }}
                    className="
                      block
                      w-full
                      h-auto
                      max-h-[320px]
                      sm:max-h-[380px]
                      rounded-lg
                      cursor-zoom-in
                      object-cover
                      select-none
                    "
                    loading="lazy"
                  />
                </div>
              ))}

            {/* File Attachment */}
            {message.type === "file" &&
              message.attachment?.url && (
                <motion.a
                  href={
                    message.attachment.url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  download={
                    message.attachment.name
                  }
                  whileHover={{
                    scale: 1.015,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="
                    flex items-center gap-2.5
                    bg-black/20
                    rounded-lg
                    px-3 py-2
                    mb-1
                    hover:bg-black/30
                    transition-colors
                    w-full
                    max-w-[240px]
                    sm:max-w-xs
                    min-w-0
                  "
                >
                  <FileIcon
                    size={18}
                    className="flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">
                      {
                        message.attachment
                          .name
                      }
                    </div>

                    <div className="text-xs opacity-70">
                      {formatSize(
                        message.attachment
                          .size
                      )}
                    </div>
                  </div>

                  <Download
                    size={16}
                    className="flex-shrink-0"
                  />
                </motion.a>
              )}

            {/* Text Message */}
            {message.text && (
              <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed">
                {message.text}
              </p>
            )}

            {/* Message Time & Read Status */}
            <div
              className={`
                flex items-center
                gap-1
                mt-1
                text-[10px]
                ${
                  isOwn
                    ? "text-bg/70 justify-end"
                    : "text-muted"
                }
              `}
            >
              <span>
                {formatTime(
                  message.createdAt
                )}
              </span>

              {isOwn &&
                (isRead ? (
                  <CheckCheck size={12} />
                ) : (
                  <Check size={12} />
                ))}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map(
                (reaction, index) => (
                  <motion.span
                    key={`${reaction.emoji}-${index}`}
                    initial={{
                      scale: 0,
                      rotate: -15,
                    }}
                    animate={{
                      scale: 1,
                      rotate: 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                    }}
                    className="
                      text-xs
                      bg-chat
                      border border-white/10
                      rounded-full
                      px-1.5 py-0.5
                    "
                  >
                    {reaction.emoji}
                  </motion.span>
                )
              )}
            </div>
          )}

          {/* Desktop / Hover Actions */}
          {showActions && (
            <motion.div
              initial={{
                opacity: 0,
                y: -4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className={`
                absolute
                -top-9
                ${
                  isOwn
                    ? "right-0"
                    : "left-0"
                }
                flex items-center
                gap-0.5
                bg-sidebar
                border border-white/10
                rounded-full
                px-1.5 py-1
                shadow-lg
                z-20
              `}
            >
              {/* React */}
              <button
                type="button"
                onClick={() =>
                  setShowReactions(
                    (state) => !state
                  )
                }
                className="
                  p-1.5
                  rounded-full
                  hover:bg-white/10
                  text-muted
                  hover:text-ember
                  transition
                "
                title="React"
                aria-label="React to message"
              >
                <Smile size={14} />
              </button>

              {/* Reply */}
              <button
                type="button"
                onClick={() =>
                  onReply?.(message)
                }
                className="
                  p-1.5
                  rounded-full
                  hover:bg-white/10
                  text-muted
                  hover:text-ember
                  transition
                "
                title="Reply"
                aria-label="Reply to message"
              >
                <Reply size={14} />
              </button>

              {/* Copy */}
              {message.text && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="
                    p-1.5
                    rounded-full
                    hover:bg-white/10
                    text-muted
                    hover:text-ember
                    transition
                  "
                  title="Copy"
                  aria-label="Copy message"
                >
                  <Copy size={14} />
                </button>
              )}

              {/* Delete */}
              {isOwn && (
                <button
                  type="button"
                  onClick={() =>
                    onDelete?.(message)
                  }
                  className="
                    p-1.5
                    rounded-full
                    hover:bg-white/10
                    text-muted
                    hover:text-red-400
                    transition
                  "
                  title="Delete"
                  aria-label="Delete message"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {/* Reaction Picker */}
              {showReactions && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className={`
                    absolute
                    -top-10
                    ${
                      isOwn
                        ? "right-0"
                        : "left-0"
                    }
                    flex items-center
                    gap-1
                    bg-sidebar
                    border border-white/10
                    rounded-full
                    px-2 py-1
                    shadow-lg
                  `}
                >
                  {REACTIONS.map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          onReact?.(
                            message,
                            emoji
                          );
                          setShowReactions(
                            false
                          );
                        }}
                        className="
                          p-0.5
                          hover:scale-125
                          active:scale-110
                          transition-transform
                        "
                        aria-label={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Preview */}
      <ImageLightbox
        src={lightboxSrc}
        alt={
          message.attachment?.name ||
          "Shared image"
        }
        onClose={() =>
          setLightboxSrc(null)
        }
      />
    </motion.div>
  );
};

export default MessageBubble;