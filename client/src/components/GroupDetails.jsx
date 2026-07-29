import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, LogOut } from "lucide-react";
import Avatar from "./Avatar.jsx";
import OnlineIndicator from "./OnlineIndicator.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const GroupDetails = ({
  conversation,
  open,
  onClose,
  onLeft,
  onlineUserIds,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!conversation) return null;

  const currentUserId = String(user?.id || user?._id || "");

  const isAdmin =
    conversation.admins?.some(
      (admin) =>
        String(admin?.id || admin?._id || admin) === currentUserId
    ) || false;

  const leave = async () => {
    try {
      await api.post(
        `/conversations/group/${conversation._id}/leave`
      );

      onLeft(conversation._id);
      onClose();
    } catch (error) {
      console.error("Failed to leave group:", error);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile Backdrop */}
          <motion.div
            key="group-details-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
          />

          {/* Group Details Panel */}
          <motion.div
            key="group-details-panel"
            initial={{
              x: "100%",
              opacity: 0,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              x: "100%",
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 32,
            }}
            className="
              fixed inset-y-0 right-0
              w-full max-w-[380px]
              sm:static sm:w-80 sm:max-w-none
              flex-shrink-0
              h-full min-h-0
              flex flex-col
              bg-sidebar
              border-l border-white/5
              z-50
              overflow-hidden
            "
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/5">
              <h3 className="font-display font-semibold text-sm sm:text-base truncate">
                Group info
              </h3>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close group details"
                className="
                  flex-shrink-0
                  p-2
                  -mr-1
                  rounded-full
                  text-muted
                  hover:text-ink
                  hover:bg-white/5
                  active:bg-white/10
                  transition-colors
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Group Information */}
            <div className="flex-shrink-0 flex flex-col items-center py-5 sm:py-6 px-4 border-b border-white/5">
              <Avatar
                name={conversation.name || "Group"}
                src={conversation.avatar}
                size={72}
              />

              <p className="font-display font-semibold mt-3 text-center max-w-full truncate px-4">
                {conversation.name || "Group"}
              </p>

              <p className="text-xs text-muted mt-1">
                {conversation.members?.length || 0} members
              </p>

              {conversation.description && (
                <p className="text-sm text-muted text-center mt-2 px-2 max-w-sm leading-relaxed break-words">
                  {conversation.description}
                </p>
              )}
            </div>

            {/* Members List */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3">
              <p className="text-xs text-muted px-4 sm:px-5 mb-2 uppercase tracking-wide">
                Members
              </p>

              {conversation.members?.map((member) => {
                const id = member.id || member._id;
                const memberId = String(id);

                const isMemberAdmin =
                  conversation.admins?.some(
                    (admin) =>
                      String(
                        admin?.id ||
                          admin?._id ||
                          admin
                      ) === memberId
                  ) || false;

                const isOnline =
                  onlineUserIds?.has(memberId) || false;

                return (
                  <div
                    key={memberId}
                    className="
                      flex items-center gap-3
                      px-4 sm:px-5 py-2.5
                      hover:bg-white/5
                      transition-colors
                    "
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        name={member.name || "User"}
                        src={member.avatar}
                        size={36}
                      />

                      <OnlineIndicator
                        online={isOnline}
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {member.name || "Unknown User"}
                      </p>

                      {member.username && (
                        <p className="text-xs text-muted truncate mt-0.5">
                          @{member.username}
                        </p>
                      )}
                    </div>

                    {/* Admin Badge */}
                    {isMemberAdmin && (
                      <div
                        className="flex-shrink-0"
                        title="Group admin"
                        aria-label="Group admin"
                      >
                        <Crown
                          size={14}
                          className="text-amber"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leave Group */}
            <div className="flex-shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 border-t border-white/5 bg-sidebar">
              <button
                type="button"
                onClick={leave}
                className="
                  w-full
                  flex items-center justify-center gap-2
                  text-red-400
                  hover:bg-red-400/10
                  active:bg-red-400/15
                  rounded-full
                  py-2.5
                  px-4
                  transition-colors
                  text-sm
                "
              >
                <LogOut size={16} />
                <span>Leave group</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GroupDetails;