import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Info, Wifi, WifiOff, Loader2 } from "lucide-react";
import Avatar from "./Avatar.jsx";
import OnlineIndicator from "./OnlineIndicator.jsx";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import api from "../services/api.js";

const otherMember = (conversation, userId) =>
  conversation && !conversation.isGroup
    ? conversation.members.find((m) => (m.id || m._id) !== userId)
    : null;

const ChatWindow = ({
  conversation,
  onlineUserIds,
  onBack,
  onOpenGroupDetails,
}) => {
  const { user } = useAuth();
  const { socket, connectionState } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUser, setTypingUser] = useState(null);

  const bottomRef = useRef(null);
  const typingClearTimeout = useRef(null);

  useEffect(() => {
    if (!conversation) return;

    setLoading(true);
    setMessages([]);
    setReplyTo(null);
    setTypingUser(null);

    api
      .get(`/messages/${conversation._id}`)
      .then(({ data }) => {
        setMessages(data.messages || []);
      })
      .catch((error) => {
        console.error("Failed to load messages:", error);
        setMessages([]);
      })
      .finally(() => {
        setLoading(false);
      });

    socket?.emit("conversation:join", conversation._id);
    socket?.emit("message:read", {
      conversationId: conversation._id,
    });

    return () => {
      clearTimeout(typingClearTimeout.current);
    };
  }, [conversation, socket]);

  useEffect(() => {
    if (!socket || !conversation || !user) return;

    const handleNew = (message) => {
      const messageConversationId =
        message.conversation?._id ||
        message.conversation?.id ||
        message.conversation;

      if (String(messageConversationId) !== String(conversation._id)) {
        return;
      }

      setMessages((prev) => [...prev, message]);

      socket.emit("message:read", {
        conversationId: conversation._id,
      });
    };

    const handleTypingStart = ({ conversationId, userId }) => {
      if (
        String(conversationId) !== String(conversation._id) ||
        String(userId) === String(user.id)
      ) {
        return;
      }

      const other = otherMember(conversation, user.id);

      setTypingUser(other?.name || "Someone");

      clearTimeout(typingClearTimeout.current);

      typingClearTimeout.current = setTimeout(() => {
        setTypingUser(null);
      }, 3000);
    };

    const handleTypingStop = ({ conversationId, userId }) => {
      if (
        String(conversationId) !== String(conversation._id) ||
        String(userId) === String(user.id)
      ) {
        return;
      }

      setTypingUser(null);
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? {
                ...message,
                reactions,
              }
            : message
        )
      );
    };

    socket.on("message:new", handleNew);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:reaction", handleReaction);

    return () => {
      socket.off("message:new", handleNew);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:reaction", handleReaction);
    };
  }, [socket, conversation, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, typingUser]);

  if (!conversation) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center px-6 text-muted bg-chat">
        <div className="text-center max-w-sm">
          <p className="font-display text-lg sm:text-xl mb-1">
            Select a conversation
          </p>

          <p className="text-sm leading-relaxed">
            Choose a chat from the sidebar to start messaging.
          </p>
        </div>
      </div>
    );
  }

  const other = otherMember(conversation, user?.id);

  const label = conversation.isGroup
    ? conversation.name || "Group"
    : other?.name || "Unknown User";

  const isOnline =
    other &&
    onlineUserIds?.has(String(other.id || other._id));

  const send = (payload) => {
    if (!socket || !conversation?._id) return;

    socket.emit("message:send", {
      conversationId: conversation._id,
      ...payload,
    });
  };

  const handleTyping = (isTyping) => {
    if (!socket || !conversation?._id) return;

    socket.emit(
      isTyping ? "typing:start" : "typing:stop",
      {
        conversationId: conversation._id,
      }
    );
  };

  const handleDelete = async (message) => {
    try {
      await api.delete(`/messages/single/${message._id}`);

      setMessages((prev) =>
        prev.map((m) =>
          m._id === message._id
            ? {
                ...m,
                deleted: true,
                text: "",
              }
            : m
        )
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleReact = (message, emoji) => {
    if (!socket) return;

    socket.emit("message:react", {
      messageId: message._id,
      emoji,
    });
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 bg-chat overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-white/5">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="sm:hidden flex-shrink-0 p-2 -ml-1 rounded-full text-muted hover:text-ink hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            name={label}
            src={
              conversation.isGroup
                ? conversation.avatar
                : other?.avatar
            }
            size={40}
          />

          {!conversation.isGroup && (
            <OnlineIndicator
              online={isOnline}
              className="absolute -bottom-0.5 -right-0.5"
            />
          )}
        </div>

        {/* User / Group Information */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm sm:text-base">
            {label}
          </p>

          <p className="text-xs text-muted truncate mt-0.5">
            {conversation.isGroup
              ? `${conversation.members?.length || 0} members`
              : isOnline
              ? "Online"
              : other?.lastSeen
              ? `Last seen ${new Date(
                  other.lastSeen
                ).toLocaleString()}`
              : "Offline"}
          </p>
        </div>

        {/* Socket Connection Status */}
        <div
          className="flex items-center justify-center flex-shrink-0 text-xs text-muted"
          title={`Connection: ${connectionState}`}
        >
          {connectionState === "connected" && (
            <Wifi
              size={15}
              className="text-online"
            />
          )}

          {connectionState === "connecting" && (
            <Loader2
              size={15}
              className="animate-spin text-amber"
            />
          )}

          {connectionState === "offline" && (
            <WifiOff
              size={15}
              className="text-muted"
            />
          )}
        </div>

        {/* Group Details */}
        {conversation.isGroup && (
          <button
            type="button"
            onClick={onOpenGroupDetails}
            aria-label="Open group details"
            className="flex-shrink-0 p-2 rounded-full text-muted hover:text-ink hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Info size={18} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 sm:py-4 scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-full px-6 text-muted text-sm">
            <div className="flex items-center gap-2">
              <Loader2
                size={16}
                className="animate-spin"
              />
              <span>Loading messages…</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6 text-muted text-sm text-center">
            <p className="max-w-xs leading-relaxed">
              Say hello and start the conversation.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message._id}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <MessageBubble
                  message={message}
                  isOwn={
                    String(
                      message.sender?._id ||
                        message.sender
                    ) === String(user?.id)
                  }
                  showSender={
                    conversation.isGroup &&
                    (
                      index === 0 ||
                      String(
                        messages[index - 1].sender?._id ||
                          messages[index - 1].sender
                      ) !==
                        String(
                          message.sender?._id ||
                            message.sender
                        )
                    )
                  }
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                  onReact={handleReact}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing Indicator */}
        {typingUser && (
          <TypingIndicator
            name={typingUser}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          onSend={send}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
};

export default ChatWindow;