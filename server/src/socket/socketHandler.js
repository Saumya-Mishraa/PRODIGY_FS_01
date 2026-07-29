import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// userId -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

const addSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeSocket = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true; // fully offline now
  }
  return false;
};

export const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));
      socket.userId = String(user._id);
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    addSocket(userId, socket.id);

    await User.findByIdAndUpdate(userId, { status: "online" });
    socket.broadcast.emit("presence:update", { userId, status: "online" });

    // Join a room per conversation the user belongs to, so we can
    // broadcast to exactly the right people.
    const conversations = await Conversation.find({ members: userId }).select("_id");
    conversations.forEach((c) => socket.join(`conversation:${c._id}`));

    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", { conversationId, userId });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", { conversationId, userId });
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const { conversationId, text = "", type = "text", attachment = null, replyTo = null } = payload;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.members.some((m) => String(m) === userId)) {
          return ack?.({ error: "Not a member of this conversation." });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          type,
          text,
          attachment,
          replyTo,
          readBy: [userId],
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populated = await message.populate("sender", "name username avatar");

        io.to(`conversation:${conversationId}`).emit("message:new", populated);
        ack?.({ message: populated });
      } catch (err) {
        ack?.({ error: err.message });
      }
    });

    socket.on("message:read", async ({ conversationId }) => {
      await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      io.to(`conversation:${conversationId}`).emit("message:read", { conversationId, userId });
    });

    socket.on("message:react", async ({ messageId, emoji }) => {
      const message = await Message.findById(messageId);
      if (!message) return;
      const idx = message.reactions.findIndex((r) => String(r.user) === userId);
      if (idx >= 0) {
        if (message.reactions[idx].emoji === emoji) message.reactions.splice(idx, 1);
        else message.reactions[idx].emoji = emoji;
      } else {
        message.reactions.push({ user: userId, emoji });
      }
      await message.save();
      io.to(`conversation:${message.conversation}`).emit("message:reaction", {
        messageId,
        reactions: message.reactions,
      });
    });

    socket.on("disconnect", async () => {
      const fullyOffline = removeSocket(userId, socket.id);
      if (fullyOffline) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { status: "offline", lastSeen });
        io.emit("presence:update", { userId, status: "offline", lastSeen });
      }
    });
  });
};

export const isUserOnline = (userId) => onlineUsers.has(String(userId));
