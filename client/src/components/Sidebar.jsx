import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquarePlus,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import Avatar from "./Avatar.jsx";
import OnlineIndicator from "./OnlineIndicator.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const timeAgo = (date) => {
  if (!date) return "";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "";

  const diff = Math.max(
    0,
    (Date.now() - timestamp) / 1000
  );

  if (diff < 60) return "now";
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h`;
  }

  return `${Math.floor(diff / 86400)}d`;
};

const conversationLabel = (
  conversation,
  currentUserId
) => {
  if (!conversation) return "Unknown";

  if (conversation.isGroup) {
    return conversation.name || "Unnamed group";
  }

  const other = conversation.members?.find(
    (member) =>
      String(member.id || member._id) !==
      String(currentUserId)
  );

  return other?.name || "Unknown";
};

const Sidebar = ({
  conversations = [],
  activeId,
  onSelect,
  onlineUserIds = new Set(),
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  const normalizedQuery = query
    .trim()
    .toLowerCase();

  const filtered = conversations.filter(
    (conversation) =>
      conversationLabel(
        conversation,
        user?.id
      )
        .toLowerCase()
        .includes(normalizedQuery)
  );

  return (
    <aside
      className="
        w-full
        sm:w-80
        lg:w-[21rem]
        flex-shrink-0
        bg-sidebar
        border-r border-white/5
        flex
        flex-col
        h-full
        min-h-0
        overflow-hidden
      "
    >
      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          px-4
          sm:px-5
          py-4
          sm:py-5
          flex-shrink-0
        "
      >
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="
              w-8
              h-8
              flex-shrink-0
              rounded-xl
              bg-ember
              flex
              items-center
              justify-center
              font-display
              font-bold
              text-bg
              shadow-lg
            "
          >
            V
          </div>

          <span
            className="
              font-display
              font-semibold
              text-lg
              tracking-tight
              truncate
            "
          >
            Velora
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenNewChat}
            title="New chat"
            aria-label="Start a new chat"
            className="
              p-2
              rounded-full
              text-muted
              hover:text-ember
              hover:bg-white/5
              active:scale-95
              transition-all
            "
          >
            <MessageSquarePlus size={18} />
          </button>

          <button
            type="button"
            onClick={onOpenNewGroup}
            title="New group"
            aria-label="Create a new group"
            className="
              p-2
              rounded-full
              text-muted
              hover:text-lavender
              hover:bg-white/5
              active:scale-95
              transition-all
            "
          >
            <Users size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        className="
          px-4
          sm:px-5
          pb-3
          flex-shrink-0
        "
      >
        <div className="relative">
          <Search
            size={16}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-muted
              pointer-events-none
            "
          />

          <input
            type="search"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="
              w-full
              min-w-0
              bg-chat
              border border-white/5
              focus:border-ember/40
              outline-none
              rounded-full
              pl-9
              pr-9
              py-2.5
              text-sm
              text-ink
              placeholder:text-muted
              transition-colors
            "
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="
                absolute
                right-2
                top-1/2
                -translate-y-1/2
                w-6
                h-6
                rounded-full
                flex
                items-center
                justify-center
                text-muted
                hover:text-ink
                hover:bg-white/10
                transition-colors
              "
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div
        className="
          flex-1
          min-h-0
          overflow-y-auto
          overflow-x-hidden
          px-2
          pb-2
          overscroll-contain
        "
      >
        {filtered.length === 0 ? (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              text-center
              text-muted
              text-sm
              mt-12
              sm:mt-16
              px-6
            "
          >
            <div
              className="
                w-12
                h-12
                rounded-2xl
                bg-white/5
                flex
                items-center
                justify-center
                mb-3
              "
            >
              <Search
                size={20}
                className="opacity-60"
              />
            </div>

            <p className="leading-relaxed">
              {conversations.length === 0
                ? "Your conversations start here."
                : "No conversations found."}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map(
              (conversation, index) => {
                const label =
                  conversationLabel(
                    conversation,
                    user?.id
                  );

                const other =
                  !conversation.isGroup
                    ? conversation.members?.find(
                        (member) =>
                          String(
                            member.id ||
                              member._id
                          ) !==
                          String(user?.id)
                      )
                    : null;

                const otherId =
                  other?.id || other?._id;

                const isOnline =
                  Boolean(
                    otherId &&
                      onlineUserIds.has(
                        String(otherId)
                      )
                  );

                const isActive =
                  activeId ===
                  conversation._id;

                return (
                  <motion.button
                    key={conversation._id}
                    type="button"
                    initial={{
                      opacity: 0,
                      x: -12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.03,
                    }}
                    onClick={() =>
                      onSelect(conversation)
                    }
                    className={`
                      relative
                      w-full
                      flex
                      items-center
                      gap-3
                      px-3
                      py-3
                      rounded-xl
                      mb-1
                      text-left
                      transition-colors
                      overflow-hidden
                      ${
                        isActive
                          ? "bg-ember/10"
                          : "hover:bg-white/5"
                      }
                    `}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="active-conversation"
                        className="
                          absolute
                          left-0
                          top-2
                          bottom-2
                          w-1
                          rounded-full
                          bg-ember
                        "
                      />
                    )}

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        name={label}
                        src={
                          conversation.isGroup
                            ? conversation.avatar
                            : other?.avatar
                        }
                        size={44}
                      />

                      {!conversation.isGroup && (
                        <OnlineIndicator
                          online={isOnline}
                          className="
                            absolute
                            -bottom-0.5
                            -right-0.5
                          "
                        />
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div
                      className="
                        flex-1
                        min-w-0
                        overflow-hidden
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          min-w-0
                        "
                      >
                        <span
                          className="
                            font-medium
                            truncate
                            min-w-0
                            flex-1
                          "
                        >
                          {label}
                        </span>

                        <span
                          className="
                            text-[10px]
                            sm:text-xs
                            text-muted
                            flex-shrink-0
                          "
                        >
                          {timeAgo(
                            conversation
                              .lastMessage
                              ?.createdAt ||
                              conversation.updatedAt
                          )}
                        </span>
                      </div>

                      <p
                        className="
                          text-sm
                          text-muted
                          truncate
                          mt-0.5
                        "
                      >
                        {conversation.lastMessage
                          ?.text ||
                          (conversation.lastMessage
                            ? "Attachment"
                            : "No messages yet")}
                      </p>
                    </div>
                  </motion.button>
                );
              }
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Current User Footer */}
      <div
        className="
          px-3
          sm:px-5
          py-3
          sm:py-4
          border-t border-white/5
          flex
          items-center
          gap-2.5
          sm:gap-3
          flex-shrink-0
        "
      >
        <Avatar
          name={user?.name}
          src={user?.avatar}
          size={38}
        />

        <div
          className="
            flex-1
            min-w-0
            overflow-hidden
          "
        >
          <p
            className="
              font-medium
              truncate
              text-sm
            "
          >
            {user?.name}
          </p>

          <p
            className="
              text-xs
              text-muted
              truncate
            "
          >
            @{user?.username}
          </p>
        </div>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open settings"
          className="
            p-2
            rounded-full
            text-muted
            hover:text-ink
            hover:bg-white/5
            active:scale-95
            transition-all
            flex-shrink-0
          "
        >
          <Settings size={18} />
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          title="Logout"
          aria-label="Log out"
          className="
            p-2
            rounded-full
            text-muted
            hover:text-red-400
            hover:bg-white/5
            active:scale-95
            transition-all
            flex-shrink-0
          "
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;