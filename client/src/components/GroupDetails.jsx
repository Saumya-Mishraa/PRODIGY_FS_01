import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, LogOut } from "lucide-react";
import Avatar from "./Avatar.jsx";
import OnlineIndicator from "./OnlineIndicator.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const GroupDetails = ({ conversation, open, onClose, onLeft, onlineUserIds }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!conversation) return null;

  const isAdmin = conversation.admins?.some((a) => (a.id || a._id || a) === user.id);

  const leave = async () => {
    await api.post(`/conversations/group/${conversation._id}/leave`);
    onLeft(conversation._id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile-only backdrop — the panel itself is inline (not an
              overlay) from the sm breakpoint up, so this only renders
              below it. */}
          <motion.div
            key="group-details-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          />

          <motion.div
            key="group-details-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm sm:static sm:w-80 sm:max-w-none flex-shrink-0 bg-sidebar border-l border-white/5 h-full flex flex-col z-50"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="font-display font-semibold">Group info</h3>
              <button onClick={onClose} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center py-6 border-b border-white/5">
              <Avatar name={conversation.name} src={conversation.avatar} size={72} />
              <p className="font-display font-semibold mt-3">{conversation.name}</p>
              <p className="text-xs text-muted mt-1">{conversation.members.length} members</p>
              {conversation.description && (
                <p className="text-sm text-muted text-center mt-2 px-4">{conversation.description}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              <p className="text-xs text-muted px-5 mb-2 uppercase tracking-wide">Members</p>
              {conversation.members.map((m) => {
                const id = m.id || m._id;
                const isMemberAdmin = conversation.admins?.some((a) => (a.id || a._id || a) === id);
                return (
                  <div key={id} className="flex items-center gap-3 px-5 py-2 hover:bg-white/5 transition-colors">
                    <div className="relative">
                      <Avatar name={m.name} src={m.avatar} size={36} />
                      <OnlineIndicator
                        online={onlineUserIds.has(String(id))}
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted truncate">@{m.username}</p>
                    </div>
                    {isMemberAdmin && <Crown size={14} className="text-amber" />}
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-white/5">
              <button
                onClick={leave}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-400/10 rounded-full py-2.5 transition-colors text-sm"
              >
                <LogOut size={16} /> Leave group
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GroupDetails;
