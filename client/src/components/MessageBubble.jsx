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

const REACTIONS = ["❤️", "😂", "👍", "😮", "😢","🐣"];

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const fileIconFor = (mimeType = "") => {
  if (mimeType.includes("zip")) return FileArchive;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
  return FileText;
};

const MessageBubble = ({ message, isOwn, onReply, onDelete, onReact, showSender }) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  if (message.deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3 sm:px-4`}>
        <div className="italic text-muted text-sm px-4 py-2">This message was deleted.</div>
      </div>
    );
  }

  const isRead = message.readBy && message.readBy.length > 1;
  const FileIcon = fileIconFor(message.attachment?.mimeType);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3 sm:px-4 py-1 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[75%] lg:max-w-[65%] ${isOwn ? "flex-row-reverse" : ""}`}>
        {!isOwn && showSender && <Avatar name={message.sender?.name} size={28} />}

        <div className="relative min-w-0">
          {message.replyTo && (
            <div className="text-xs text-muted border-l-2 border-ember/50 pl-2 mb-1 opacity-80 truncate">
              {message.replyTo.text || "Attachment"}
            </div>
          )}

          <div
            className={`rounded-2xl px-3.5 py-2 sm:px-4 ${
              isOwn
                ? "bg-ember text-bg rounded-br-sm"
                : "bg-chat border border-white/5 text-ink rounded-bl-sm"
            }`}
          >
            {message.type === "image" && message.attachment?.url && (
              imgError ? (
                <button
                  type="button"
                  onClick={() => {
                    setImgError(false);
                    setImgLoaded(false);
                  }}
                  className={`w-full max-w-[240px] sm:max-w-xs flex flex-col items-center justify-center gap-1.5 rounded-lg mb-1 py-6 text-center ${
                    isOwn ? "bg-black/15" : "bg-black/20"
                  }`}
                >
                  <ImageOff size={22} className="opacity-70" />
                  <span className="text-xs opacity-80">Image failed to load — tap to retry</span>
                </button>
              ) : (
                <div className="relative w-full max-w-[240px] sm:max-w-xs mb-1">
                  {!imgLoaded && (
                    <div className="absolute inset-0 rounded-lg bg-black/10 animate-pulse" style={{ aspectRatio: "4 / 3" }} />
                  )}
                  <motion.img
                    src={message.attachment.url}
                    alt={message.attachment.name || "Shared image"}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                    onClick={() => setLightboxSrc(message.attachment.url)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imgLoaded ? 1 : 0 }}
                    transition={{ duration: 0.35 }}
                    className="w-full h-auto rounded-lg cursor-zoom-in object-cover"
                    loading="lazy"
                  />
                </div>
              )
            )}

            {message.type === "file" && message.attachment?.url && (
              <motion.a
                href={message.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                download={message.attachment.name}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 bg-black/20 rounded-lg px-3 py-2 mb-1 hover:bg-black/30 transition-colors w-full max-w-[240px] sm:max-w-xs"
              >
                <FileIcon size={18} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{message.attachment.name}</div>
                  <div className="text-xs opacity-70">{formatSize(message.attachment.size)}</div>
                </div>
                <Download size={16} className="flex-shrink-0" />
              </motion.a>
            )}

            {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

            <div
              className={`flex items-center gap-1 mt-1 text-[10px] ${
                isOwn ? "text-bg/70 justify-end" : "text-muted"
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isOwn && (isRead ? <CheckCheck size={12} /> : <Check size={12} />)}
            </div>
          </div>

          {message.reactions?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.reactions.map((r, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="text-xs bg-chat border border-white/10 rounded-full px-1.5 py-0.5"
                >
                  {r.emoji}
                </motion.span>
              ))}
            </div>
          )}

          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute -top-8 ${isOwn ? "right-0" : "left-0"} flex items-center gap-1 bg-sidebar border border-white/10 rounded-full px-1.5 py-1 shadow-lg z-10`}
            >
              <button
                onClick={() => setShowReactions((s) => !s)}
                className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-ember transition"
                title="React"
              >
                <Smile size={14} />
              </button>
              <button
                onClick={() => onReply?.(message)}
                className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-ember transition"
                title="Reply"
              >
                <Reply size={14} />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(message.text || "")}
                className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-ember transition"
                title="Copy"
              >
                <Copy size={14} />
              </button>
              {isOwn && (
                <button
                  onClick={() => onDelete?.(message)}
                  className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-red-400 transition"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-10 left-0 flex gap-1 bg-sidebar border border-white/10 rounded-full px-2 py-1"
                >
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact?.(message, emoji);
                        setShowReactions(false);
                      }}
                      className="hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <ImageLightbox
        src={lightboxSrc}
        alt={message.attachment?.name}
        onClose={() => setLightboxSrc(null)}
      />
    </motion.div>
  );
};

export default MessageBubble;
