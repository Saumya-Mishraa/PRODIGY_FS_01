import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquarePlus, Users, Settings, LogOut } from "lucide-react";
import Avatar from "./Avatar.jsx";
import OnlineIndicator from "./OnlineIndicator.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const timeAgo = (date) => {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const conversationLabel = (conversation, currentUserId) => {
  if (conversation.isGroup) return conversation.name;
  const other = conversation.members.find((m) => m.id !== currentUserId && m._id !== currentUserId);
  return other?.name || "Unknown";
};

const Sidebar = ({
  conversations,
  activeId,
  onSelect,
  onlineUserIds,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((c) =>
    conversationLabel(c, user?.id).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <aside className="w-full sm:w-80 flex-shrink-0 bg-sidebar border-r border-white/5 flex flex-col h-full">
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-ember flex items-center justify-center font-display font-bold text-bg">
            V
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Velora</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChat}
            title="New chat"
            className="p-2 rounded-full text-muted hover:text-ember hover:bg-white/5 transition-colors"
          >
            <MessageSquarePlus size={18} />
          </button>
          <button
            onClick={onOpenNewGroup}
            title="New group"
            className="p-2 rounded-full text-muted hover:text-lavender hover:bg-white/5 transition-colors"
          >
            <Users size={18} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-chat border border-white/5 focus:border-ember/40 outline-none rounded-full pl-9 pr-3 py-2 text-sm placeholder:text-muted transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 ? (
          <div className="text-center text-muted text-sm mt-16 px-6">
            {conversations.length === 0
              ? "Your conversations start here."
              : "No conversations found."}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((c, i) => {
              const label = conversationLabel(c, user?.id);
              const other = !c.isGroup && c.members.find((m) => (m.id || m._id) !== user?.id);
              const isOnline = other && onlineUserIds.has(String(other.id || other._id));
              const isActive = activeId === c._id;

              return (
                <motion.button
                  key={c._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelect(c)}
                  className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-left transition-colors ${
                    isActive ? "bg-ember/10" : "hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-conversation"
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-ember"
                    />
                  )}
                  <div className="relative">
                    <Avatar name={label} src={c.isGroup ? c.avatar : other?.avatar} size={44} />
                    {!c.isGroup && (
                      <OnlineIndicator
                        online={isOnline}
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{label}</span>
                      <span className="text-xs text-muted flex-shrink-0">
                        {timeAgo(c.lastMessage?.createdAt || c.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted truncate">
                      {c.lastMessage?.text || (c.lastMessage ? "Attachment" : "No messages yet")}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="px-5 py-4 border-t border-white/5 flex items-center gap-3">
        <Avatar name={user?.name} src={user?.avatar} size={38} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{user?.name}</p>
          <p className="text-xs text-muted truncate">@{user?.username}</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-muted hover:text-ink hover:bg-white/5 transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={logout}
          className="p-2 rounded-full text-muted hover:text-red-400 hover:bg-white/5 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
