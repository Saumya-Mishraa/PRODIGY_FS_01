import express from "express";
import { upload } from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const router = express.Router();

// Local-disk uploads must resolve to an absolute, publicly reachable URL —
// never a bare "/uploads/..." path. A relative path resolves against
// whatever origin the browser currently has loaded (the frontend), not the
// backend that actually serves the file, so as soon as frontend and
// backend are deployed as separate origins (as in production), the image
// 404s and the chat shows a broken-image icon.
//
// SERVER_URL can be set explicitly (recommended for production); otherwise
// we fall back to deriving it from the incoming request. This fallback
// only matters for local-disk mode — Cloudinary always returns its own
// absolute secure_url regardless.
const resolveServerOrigin = (req) => {
  if (process.env.SERVER_URL) return process.env.SERVER_URL.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
};

// Returns a URL usable in a message's `attachment.url` field. Uses local
// disk storage by default; if USE_CLOUDINARY=true, uploads to Cloudinary
// instead and removes the local temp file.
//
// IMPORTANT for production on Render: local disk storage is ephemeral —
// files vanish on every restart/redeploy. USE_CLOUDINARY=true is strongly
// recommended (required, really) for anything deployed there. Local disk
// is fine for local development only.
router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided." });

    if (process.env.USE_CLOUDINARY === "true") {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "velora",
        resource_type: "auto",
      });
      fs.unlink(req.file.path, () => {});
      return res.status(201).json({
        url: result.secure_url,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    }

    res.status(201).json({
      url: `${resolveServerOrigin(req)}/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    // Surface the real reason (bad Cloudinary credentials, unsupported
    // resource type, disk write failure, etc.) instead of a silent
    // fallback — the frontend shows this to the user rather than quietly
    // pretending the upload worked.
    console.error("Upload failed:", err);
    res.status(500).json({ message: "Upload failed. Please try again.", error: err.message });
  }
});

export default router;
