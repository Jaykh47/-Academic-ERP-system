import { Notification, User } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";

/**
 * NOTIFICATION SERVICE
 *
 * Handles creation, dispatch, and lifecycle of in-app notifications.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CREATE A SINGLE NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export const createNotificationService = async ({
  recipientId,
  title,
  message,
  type,
  relatedEntity,
}) => {
  return await Notification.create({
    recipientId,
    title,
    message,
    type,
    ...(relatedEntity ? { relatedEntity } : {}),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH BULK NOTIFICATIONS (e.g. to all enrolled students)
// ─────────────────────────────────────────────────────────────────────────────
export const createBulkNotificationsService = async (notifications = []) => {
  if (!notifications.length) return [];
  return await Notification.insertMany(notifications, { ordered: false });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET USER NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getUserNotificationsService = async (userId, query = {}) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { recipientId: userId };

  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === "true";
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: userId, isRead: false }),
  ]);

  return {
    unreadCount,
    notifications,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK AS READ
// ─────────────────────────────────────────────────────────────────────────────
export const markNotificationAsReadService = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipientId: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found or does not belong to you.");
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────────────────────────────────────
export const markAllNotificationsAsReadService = async (userId) => {
  const result = await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return { modifiedCount: result.modifiedCount };
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export const deleteNotificationService = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientId: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found or does not belong to you.");
  }

  return { message: "Notification deleted successfully." };
};

