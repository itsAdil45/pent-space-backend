/** @format */

const { prisma } = require("../../configs/prisma");

const {
  serverErrorResponse,
  okResponse,
} = require("../../constants/responses");

const getAllMessagesByChatId = async (req, res) => {
  const { user } = req.user;
  let { chat_id, recipient_id } = req.query;

  try {
    if (recipient_id) {
      const chat =
        await prisma.$queryRaw`SELECT id AS chat_id FROM chats WHERE (user_one_id = ${user.id} AND user_two_id = ${recipient_id}) OR (user_one_id = ${recipient_id} AND user_two_id = ${user.id})`;
      chat_id = chat[0]?.chat_id;
    }
    if (!chat_id) {
      const response = okResponse([], "All messages");
      return res.status(response.status.code).json(response);
    }
    const chat_setting = await prisma.chat_settings.findFirst({
      where: {
        chat_id: Number(chat_id),
        user_id: Number(user.id),
      },
    });
    const all_messages = await prisma.chat_messages.findMany({
      where: {
        chat_id: Number(chat_id),
        id: {
          gt: chat_setting.last_message_id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    await prisma.chat_messages.updateMany({
      data: {
        is_read: true,
      },
      where: {
        chat_id: Number(chat_id),
        is_read: false,
        recipient_id: Number(user.id),
      },
    });

    const response = okResponse(all_messages, "All messages");
    return res.status(response.status.code).json(response);
  } catch (error) {
    const response = serverErrorResponse(error.message);
    return res.status(response.status.code).json(response);
  }
};

module.exports = {
  getAllMessagesByChatId,
};
