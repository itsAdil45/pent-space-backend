const { prisma } = require("@/configs/prisma");
const sendPrivateChatMessageNotification = require("@/notifications/private_chat");
const TokenService = require("@/services/tokenService");
const tokenService = new TokenService(process.env.JWT_SECRET_KEY);

const read_private_message = async ({ access_token, message_id }) => {
  console.log(message_id, "message_id");
  if (!access_token) {
    socket.emit("error", {
      message: "Arguments not fulfilled, access_token required",
    });
    return;
  }

  recipient_id = tokenService.verifyAccessToken(access_token)?.id;
  console.log(recipient_id, "recipient_id");

  if (!recipient_id) {
    socket.emit("error", { message: "User token invalid or expired" });
    return;
  }
  try {
    const message = await prisma.chat_messages.update({
      data: {
        is_read: true,
      },
      where: {
        recipient_id: Number(recipient_id),
        id: Number(message_id),
      },
    });
    console.log(message, "message");
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const get_all_chats = async ({ socket, access_token, id }) => {
  if (!access_token && !id) {
    socket.emit("error", {
      message: "Arguments not fulfilled, access_token required",
    });
    return;
  }

  let user_id = id;
  if (!user_id) {
    user_id = tokenService.verifyAccessToken(access_token)?.id;

    if (!user_id) {
      socket.emit("error", { message: "User token invalid or expired" });
      return;
    }
  }
  try {
    let all_chats = await prisma.$queryRaw`
    SELECT c.id AS chat_id,c.*,
        u.*, 
        (
            SELECT CAST(COUNT(cm.id) AS FLOAT) 
            FROM chat_messages AS cm 
            WHERE cm.recipient_id = ${user_id} 
              AND cm.is_read = false 
              AND cm.chat_id = c.id 
              AND cm.id > (SELECT last_message_id FROM chat_settings WHERE chat_id = cm.chat_id AND user_id = ${user_id})
        ) AS unread_messages,
        (SELECT CASE WHEN CAST(COUNT(id) AS FLOAT) > 0 THEN 1 ELSE 0 END from block_user WHERE (blocked_user_id  = u.id AND blocked_by_id = ${user_id}) ) as is_blocked,(SELECT CASE WHEN CAST(COUNT(id) AS FLOAT) > 0 THEN 1 ELSE 0 END from block_user WHERE (blocked_user_id  = ${user_id} AND blocked_by_id = u.id) ) as iam_blocked,
        (
            SELECT cm.message 
            FROM chat_messages AS cm 
            WHERE cm.chat_id = c.id 
            ORDER BY cm.createdAt DESC 
            LIMIT 1
        ) AS last_message,
        (
            SELECT cm.createdAt 
            FROM chat_messages AS cm 
            WHERE cm.chat_id = c.id 
            ORDER BY cm.createdAt DESC 
            LIMIT 1
        ) AS last_message_timestamp
    FROM chats AS c 
    JOIN users AS u ON u.id = 
        CASE 
            WHEN c.user_one_id = ${user_id} THEN c.user_two_id 
            ELSE c.user_one_id 
        END
    WHERE c.user_one_id = ${user_id} OR c.user_two_id = ${user_id} 
    ORDER BY c.updatedAt DESC
    `;
    all_chats = all_chats.map((chat) => ({
      ...chat,
      is_blocked: Number(chat.is_blocked),
      iam_blocked: Number(chat.iam_blocked),
    }));
    if (id) {
      console.log(all_chats);
      socket.broadcast.emit(`allChats-user_id-${user_id}`, all_chats);
    } else {
      socket.emit(`allChats-user_id-${user_id}`, all_chats);
    }
    console.log("emitted");
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};
const create_chat = async ({ user_one_id, user_two_id }) => {
  try {
    await prisma.$transaction(async (tx) => {
      const chat = await tx.chats.create({
        data: {
          user_one_id,
          user_two_id,
        },
      });
      await tx.chat_settings.create({
        data: {
          chat_id: chat.id,
          user_id: user_one_id,
          is_deleted: false,
        },
      });
      await tx.chat_settings.create({
        data: {
          chat_id: chat.id,
          user_id: user_two_id,
          is_deleted: false,
        },
      });
      return chat;
    });
    return chat;
  } catch (error) {
    return error;
  }
};

const send_private_message = async ({
  access_token,
  message,
  chat_id,
  recipient_id,
  socket,
  rooms,
  users,
}) => {
  if (!access_token) {
    socket.emit("error", {
      message: "Arguments not fulfilled, access_token required",
    });
    return;
  }

  if (typeof message !== "string") {
    socket.emit("error", {
      message: "Arguments not fulfilled, messgae must be a string",
    });
    return;
  }

  if (!chat_id && !recipient_id) {
    socket.emit("error", {
      message: "Arguments not fulfilled, recipient_id or chat_id required",
    });
    return;
  }

  const id = tokenService.verifyAccessToken(access_token)?.id;
  if (!id) {
    socket.emit("error", { message: "invalid id" });
    return;
  }
  let chatId = chat_id;
  if (!chatId) {
    const chat =
      await prisma.$queryRaw`SELECT * FROM chats WHERE (user_one_id = ${id} AND user_two_id = ${recipient_id}) OR (user_one_id = ${recipient_id} AND user_two_id = ${id})`;
    chatId = chat?.length && chat[0].id;
    if (chat.length > 0) {
      await prisma.chat_settings.updateMany({
        where: {
          chat_id: chat[0].id,
        },
        data: {
          is_deleted: false,
        },
      });
    }
  }
  socket.join(`private-${chatId}`);
  users.set(id, `private-${chatId}`); //joining user in new room
  rooms.set(chatId, `private-${chatId}`); //creating new room
  socket.emit("joinedPrivateChatSuccess", chatId);
  const { fcm_token, message_id, receiver_id } = await create_chat_message({
    message,
    sender_id: id,
    chat_id: chatId,
  });
  if (message_id) {
    await send_message({
      chat_id: chatId,
      fcm_token,
      message_id,
      message,
      rooms,
      sender_id: id,
      socket,
      users,
      recipient_id: receiver_id,
    });
    await get_all_chats({ socket, id: receiver_id });
  }
};

const create_chat_message = async ({ message, sender_id, chat_id }) => {
  const chat_setting = await prisma.chat_settings.findFirst({
    where: {
      chat_id,
      user_id: { not: sender_id },
    },
  });
  const blocked = await prisma.block_user.findFirst({
    where: {
      OR: [
        {
          blocked_by_id: Number(sender_id),
          blocked_user_id: chat_setting.user_id,
        },
        {
          blocked_by_id: chat_setting.user_id,
          blocked_user_id: Number(sender_id),
        },
      ],
    },
  });
  if (blocked) {
    throw new Error("User blocked");
  }
  const recipient = await prisma.users.findFirst({
    where: {
      id: chat_setting.user_id,
    },
  });
  const newMessage = await prisma.chat_messages.create({
    data: {
      message,
      sender_id,
      chat_id,
      recipient_id: recipient.id,
      is_read: false,
    },
  });
  return {
    message_id: newMessage.id,
    fcm_token: recipient.fcm_token,
    receiver_id: recipient.id,
  };
};

const send_message = async ({
  rooms,
  chat_id,
  message,
  sender_id,
  socket,
  message_id,
  fcm_token,
  recipient_id,
  users,
}) => {
  if (users && users.has(recipient_id)) {
    socket
      .to(`private-${chat_id}`)
      .emit("privateMessage", { message_id, message, sender_id, recipient_id });
  } else {
    //send notification to sender_id
    console.log("notification");
    sendPrivateChatMessageNotification({
      message,
      sender: sender_id,
      fcm_token,
    });
  }
};

module.exports = {
  get_all_chats,
  send_private_message,
  create_chat,
  read_private_message,
};
