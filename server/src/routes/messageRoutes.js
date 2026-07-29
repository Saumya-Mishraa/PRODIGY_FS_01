import express from "express";
import {
  getMessages,
  createMessage,
  deleteMessage,
  reactToMessage,
  markRead,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/:conversationId", getMessages);
router.post("/:conversationId", createMessage);
router.post("/:conversationId/read", markRead);
router.delete("/single/:id", deleteMessage);
router.post("/single/:id/react", reactToMessage);

export default router;
