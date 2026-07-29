import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const isMember = (conversation, userId) =>
  conversation.members.some((m) => String(m) === String(userId));

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { before, limit = 30 } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !isMember(conversation, req.user._id)) {
      return res.status(403).json({ message: "Not a member of this conversation." });
    }

    const query = { conversation: conversationId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("sender", "name username avatar")
      .populate("replyTo");

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ message: "Failed to load messages.", error: err.message });
  }
};

// Used by the REST fallback (e.g. attaching a file). Real-time delivery
// still happens over the socket - see socket/socketHandler.js.
export const createMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text = "", type = "text", replyTo = null, attachment = null } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !isMember(conversation, req.user._id)) {
      return res.status(403).json({ message: "Not a member of this conversation." });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      type,
      text,
      attachment,
      replyTo,
      readBy: [req.user._id],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await message.populate("sender", "name username avatar");
    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message.", error: err.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found." });
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }
    message.deleted = true;
    message.text = "";
    message.attachment = undefined;
    await message.save();
    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete message.", error: err.message });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found." });

    const existingIdx = message.reactions.findIndex(
      (r) => String(r.user) === String(req.user._id)
    );
    if (existingIdx >= 0) {
      if (message.reactions[existingIdx].emoji === emoji) {
        message.reactions.splice(existingIdx, 1); // toggle off
      } else {
        message.reactions[existingIdx].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();
    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: "Failed to react.", error: err.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ message: "Marked as read." });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read.", error: err.message });
  }
};
