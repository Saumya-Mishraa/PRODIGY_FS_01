import express from "express";
import { searchUsers, updateProfile, getUserById } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/search", searchUsers);
router.patch("/me", updateProfile);
router.get("/:id", getUserById);

export default router;
