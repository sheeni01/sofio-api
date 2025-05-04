import express from "express";
import {
  getUploads,
  getUploadDetails,
  rateUpload,
  commentUpload,
} from "../controllers/uploadController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/medias", getUploads);
router.get("/media/:id", getUploadDetails); 
router.post("/rate", authenticateToken, rateUpload);
router.post("/comment", authenticateToken, commentUpload);

export default router;
