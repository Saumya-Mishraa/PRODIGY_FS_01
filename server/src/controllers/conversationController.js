import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const populateOpts = [
  { path: "members", select: "name username avatar status lastSeen" },
  { path: "admins", select: "name username avatar" },
  { path: "lastMessage" },
];

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ members: req.user._id })
      .populate(populateOpts)
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: "Failed to load conversations.", error: err.message });
  }
};

// Get or create a 1:1 conversation with another user.
export const startPrivateConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required." });
    if (userId === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself." });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId], $size: 2 },
    }).populate(populateOpts);

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        members: [req.user._id, userId],
      });
      conversation = await conversation.populate(populateOpts);
    }

    res.status(201).json({ conversation });
  } catch (err) {
    res.status(500).json({ message: "Failed to start conversation.", error: err.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds = [], avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required." });
    }

    const members = Array.from(new Set([...memberIds, String(req.user._id)]));

    const conversation = await Conversation.create({
      isGroup: true,
      name: name.trim(),
      description: description || "",
      avatar: avatar || "",
      members,
      admins: [req.user._id],
    });

    const populated = await conversation.populate(populateOpts);
    res.status(201).json({ conversation: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create group.", error: err.message });
  }
};

const requireGroupAdmin = (conversation, userId) => {
  if (!conversation.isGroup) return false;
  return conversation.admins.some((a) => String(a) === String(userId));
};

export const updateGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    if (!requireGroupAdmin(conversation, req.user._id)) {
      return res.status(403).json({ message: "Only group admins can update the group." });
    }

    const { name, description, avatar } = req.body;
    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (avatar !== undefined) conversation.avatar = avatar;

    await conversation.save();
    const populated = await conversation.populate(populateOpts);
    res.json({ conversation: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update group.", error: err.message });
  }
};

export const addMembers = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    if (!requireGroupAdmin(conversation, req.user._id)) {
      return res.status(403).json({ message: "Only group admins can add members." });
    }
    const { memberIds = [] } = req.body;
    conversation.members = Array.from(new Set([...conversation.members.map(String), ...memberIds]));
    await conversation.save();
    const populated = await conversation.populate(populateOpts);
    res.json({ conversation: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to add members.", error: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    if (!requireGroupAdmin(conversation, req.user._id)) {
      return res.status(403).json({ message: "Only group admins can remove members." });
    }
    const { memberId } = req.body;
    conversation.members = conversation.members.filter((m) => String(m) !== String(memberId));
    conversation.admins = conversation.admins.filter((a) => String(a) !== String(memberId));
    await conversation.save();
    const populated = await conversation.populate(populateOpts);
    res.json({ conversation: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove member.", error: err.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found." });
    }
    conversation.members = conversation.members.filter((m) => String(m) !== String(req.user._id));
    conversation.admins = conversation.admins.filter((a) => String(a) !== String(req.user._id));
    await conversation.save();
    res.json({ message: "Left group." });
  } catch (err) {
    res.status(500).json({ message: "Failed to leave group.", error: err.message });
  }
};
