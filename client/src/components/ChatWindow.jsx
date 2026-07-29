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

const ChatWindow = ({ conversation, onlineUserIds, onBack, onOpenGroupDetails }) => {
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
    api
      .get(`/messages/${conversation._id}`)
      .then(({ data }) => setMessages(data.messages))
      .finally(() => setLoading(false));

    socket?.emit("conversation:join", conversation._id);
    socket?.emit("message:read", { conversationId: conversation._id });
  }, [conversation, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (message) => {
      if (message.conversation !== conversation?._id) return;
      setMessages((prev) => [...prev, message]);
      socket.emit("message:read", { conversationId: conversation._id });
    };

    const handleTypingStart = ({ conversationId, userId }) => {
      if (conversationId !== conversation?._id || userId === user.id) return;
      const other = otherMember(conversation, user.id);
      setTypingUser(other?.name || "Someone");
      clearTimeout(typingClearTimeout.current);
      typingClearTimeout.current = setTimeout(() => setTypingUser(null), 3000);
    };

    const handleTypingStop = ({ conversationId, userId }) => {
      if (conversationId !== conversation?._id || userId === user.id) return;
      setTypingUser(null);
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        <div className="text-center">
          <p className="font-display text-xl mb-1">Select a conversation</p>
          <p className="text-sm">Choose a chat from the sidebar to start messaging.</p>
        </div>
      </div>
    );
  }

  const other = otherMember(conversation, user.id);
  const label = conversation.isGroup ? conversation.name : other?.name;
  const isOnline = other && onlineUserIds.has(String(other.id || other._id));

  const send = (payload) => {
    socket?.emit("message:send", { conversationId: conversation._id, ...payload });
  };

  const handleTyping = (isTyping) => {
    socket?.emit(isTyping ? "typing:start" : "typing:stop", { conversationId: conversation._id });
  };

  const handleDelete = async (message) => {
    await api.delete(`/messages/single/${message._id}`);
    setMessages((prev) =>
      prev.map((m) => (m._id === message._id ? { ...m, deleted: true, text: "" } : m))
    );
  };

  const handleReact = (message, emoji) => {
    socket?.emit("message:react", { messageId: message._id, emoji });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-chat">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <button onClick={onBack} className="sm:hidden text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div className="relative">
          <Avatar name={label} src={conversation.isGroup ? conversation.avatar : other?.avatar} size={40} />
          {!conversation.isGroup && (
            <OnlineIndicator online={isOnline} className="absolute -bottom-0.5 -right-0.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{label}</p>
          <p className="text-xs text-muted truncate">
            {conversation.isGroup
              ? `${conversation.members.length} members`
              : isOnline
              ? "Online"
              : other?.lastSeen
              ? `Last seen ${new Date(other.lastSeen).toLocaleString()}`
              : "Offline"}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted mr-2">
          {connectionState === "connected" && <Wifi size={14} className="text-online" />}
          {connectionState === "connecting" && (
            <Loader2 size={14} className="animate-spin text-amber" />
          )}
          {connectionState === "offline" && <WifiOff size={14} className="text-muted" />}
        </div>

        {conversation.isGroup && (
          <button
            onClick={onOpenGroupDetails}
            className="p-2 rounded-full text-muted hover:text-ink hover:bg-white/5 transition-colors"
          >
            <Info size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted text-sm text-center px-8">
            Say hello and start the conversation.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <MessageBubble
                key={m._id}
                message={m}
                isOwn={(m.sender?._id || m.sender) === user.id}
                showSender={
                  conversation.isGroup &&
                  (i === 0 || messages[i - 1].sender?._id !== m.sender?._id)
                }
                onReply={setReplyTo}
                onDelete={handleDelete}
                onReact={handleReact}
              />
            ))}
          </AnimatePresence>
        )}
        {typingUser && <TypingIndicator name={typingUser} />}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={send}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default ChatWindow;
