/** @format */

const sendAdminUserNotification = require("@/notifications/admin_user_notification");
const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
} = require("../../constants/responses");

const readNotifications = async (req, res) => {
  const { user } = req.user;
  const { id } = req.params;
  try {
    const result = await prisma.notifications.update({
      data: {
        is_read: true,
      },
      where: {
        user_id: user.id,
        id: Number(id),
      },
    });
    const response = okResponse(result, "Successfully Read");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

const sendNotificationToAll = async (req, res, next) => {
  const { receiver_type } = req.query;
  const { message, title } = req.body;
  try {
    const receivers = await prisma.users.findMany({
      where: {
        is_notification: true,
        is_completed: true,
        is_deleted: false,
        user_type: receiver_type,
      },
    });

    //send notifications
    await Promise.all(
      receivers.map(async (receiver) => {
        await sendAdminUserNotification({
          token: receiver.fcm_token,
          title,
          message,
          user_id: receiver.id,
        });
      })
    );

    const response = okResponse(
      null,
      `Notification has been sent to all ${receiver_type}.`
    );
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};

const getAllNotifications = async (req, res) => {
  const { user } = req.user;
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        senders: true,
      },
    });

    const unread_notifications = await prisma.notifications.findMany({
      where: {
        user_id: user.id,
        is_read: false,
      },
    });

    const response = okResponse(
      { notifications, unread_notifications: unread_notifications.length || 0 },
      "Notifications"
    );

    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  getAllNotifications,
  readNotifications,
  sendNotificationToAll,
};
