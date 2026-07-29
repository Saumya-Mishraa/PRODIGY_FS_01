import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import NewChatModal from "../components/NewChatModal.jsx";
import NewGroupModal from "../components/NewGroupModal.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import GroupDetails from "../components/GroupDetails.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import api from "../services/api.js";

// Below the `sm` breakpoint (640px, matches Tailwind's default and the
// rest of this app's responsive classes) the sidebar and the chat window
// occupy the full viewport one at a time instead of sitting side by side.
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && !window.matchMedia("(min-width: 640px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = () => setIsMobile(!mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  useEffect(() => {
    api.get("/conversations").then(({ data }) => setConversations(data.conversations));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handlePresence = ({ userId, status }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      });
    };
    socket.on("presence:update", handlePresence);

    const handleNewMessage = (message) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === message.conversation);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], lastMessage: message, updatedAt: message.createdAt };
        const rest = prev.filter((c) => c._id !== message.conversation);
        return [updated, ...rest];
      });
    };
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("presence:update", handlePresence);
      socket.off("message:new", handleNewMessage);
    };
  }, [socket]);

  const upsertConversation = (conversation) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c._id === conversation._id);
      if (exists) return prev.map((c) => (c._id === conversation._id ? conversation : c));
      return [conversation, ...prev];
    });
    setActive(conversation);
    setShowSidebarMobile(false);
  };

  const handleLeftGroup = (conversationId) => {
    setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    setActive(null);
  };

  const showSidebarPane = !isMobile || showSidebarMobile;
  const showChatPane = !isMobile || !showSidebarMobile;

  return (
    <div className="h-screen flex bg-bg text-ink overflow-hidden">
      <AnimatePresence initial={false} mode={isMobile ? "wait" : "sync"}>
        {showSidebarPane && (
          <motion.div
            key="sidebar-pane"
            initial={isMobile ? { x: -32, opacity: 0 } : false}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: -32, opacity: 0, transition: { duration: 0.15 } } : undefined}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="w-full sm:w-auto h-full flex"
          >
            <Sidebar
              conversations={conversations}
              activeId={active?._id}
              onSelect={(c) => {
                setActive(c);
                setShowSidebarMobile(false);
              }}
              onlineUserIds={onlineUserIds}
              onOpenNewChat={() => setShowNewChat(true)}
              onOpenNewGroup={() => setShowNewGroup(true)}
              onOpenSettings={() => setShowSettings(true)}
            />
          </motion.div>
        )}

        {showChatPane && (
          <motion.div
            key="chat-pane"
            initial={isMobile ? { x: 32, opacity: 0 } : false}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: 32, opacity: 0, transition: { duration: 0.15 } } : undefined}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="w-full sm:w-auto sm:flex-1 h-full flex min-w-0"
          >
            <ChatWindow
              conversation={active}
              onlineUserIds={onlineUserIds}
              onBack={() => setShowSidebarMobile(true)}
              onOpenGroupDetails={() => setShowGroupDetails(true)}
            />
            <GroupDetails
              conversation={active?.isGroup ? active : null}
              open={showGroupDetails && active?.isGroup}
              onClose={() => setShowGroupDetails(false)}
              onLeft={handleLeftGroup}
              onlineUserIds={onlineUserIds}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <NewChatModal open={showNewChat} onClose={() => setShowNewChat(false)} onCreated={upsertConversation} />
      <NewGroupModal open={showNewGroup} onClose={() => setShowNewGroup(false)} onCreated={upsertConversation} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default Dashboard;
