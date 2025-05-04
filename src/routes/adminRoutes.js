import express from "express";
import {
  createAdmin,
  uploadMedia,
  getAllUploads,
} from "../controllers/adminController.js";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post(
  "/create-admin",
  authenticateToken,
  authorizeRole("admin"),
  createAdmin
);
router.post(
  "/upload",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("file"),
  uploadMedia
); // Generic upload
router.get(
  "/uploads",
  authenticateToken,
  authorizeRole("admin"),
  getAllUploads
);

export default router;
