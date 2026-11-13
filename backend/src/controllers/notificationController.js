import ApiResponse from "../utils/ApiResponse.js";
import {
  getUserNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
} from "../services/notificationService.js";

/**
 * NOTIFICATION CONTROLLER
 *
 * REST endpoints for viewing and managing in-app notifications.
 */

export const getMyNotifications = async (req, res, next) => {
  try {
    const result = await getUserNotificationsService(req.user._id, req.query);
    res.status(200).json(
      new ApiResponse(200, "Notifications fetched successfully.", result)
    );
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await markNotificationAsReadService(notificationId, req.user._id);

    res.status(200).json(
      new ApiResponse(200, "Notification marked as read.", { notification })
    );
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await markAllNotificationsAsReadService(req.user._id);
    res.status(200).json(
      new ApiResponse(200, "All notifications marked as read.", result)
    );
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const result = await deleteNotificationService(notificationId, req.user._id);
    res.status(200).json(new ApiResponse(200, result.message));
  } catch (error) {
    next(error);
  }
};

