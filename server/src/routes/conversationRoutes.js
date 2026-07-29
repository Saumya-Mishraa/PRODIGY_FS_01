import express from "express";
import {
  getConversations,
  startPrivateConversation,
  createGroup,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getConversations);
router.post("/private", startPrivateConversation);
router.post("/group", createGroup);
router.patch("/group/:id", updateGroup);
router.post("/group/:id/members", addMembers);
router.post("/group/:id/remove-member", removeMember);
router.post("/group/:id/leave", leaveGroup);

export default router;
