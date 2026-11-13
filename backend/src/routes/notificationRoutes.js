import express from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { param } from "express-validator";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);

router.patch(
  "/:notificationId/read",
  param("notificationId").isMongoId().withMessage("Invalid notification ID"),
  validate,
  markAsRead
);

router.delete(
  "/:notificationId",
  param("notificationId").isMongoId().withMessage("Invalid notification ID"),
  validate,
  deleteNotification
);

export default router;

