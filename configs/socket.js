const socket = require("socket.io");
const TokenService = require("@/services/tokenService");
const {
  get_all_chats,
  create_chat,
  read_private_message,
  send_private_message,
} = require("@/utils/chat_helpers");
const { prisma } = require("./prisma");

const tokenService = new TokenService(process.env.JWT_SECRET_KEY);
const users = new Map();
const rooms = new Map();

const connectSocket = (httpServer) => {
  const io = socket(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    //online
    socket.on("online", async (access_token) => {
      if (!access_token) {
        socket.emit("error", { message: "Arguments not fulfilled" });
        return;
      }
      const id = tokenService.verifyAccessToken(access_token)?.id;
      if (!id) {
        socket.emit("error", { message: "User token invalid or expired" });
      } else {
        users.set(id, socket.id);
        const usersArray = Array.from(users, ([key, value]) => ({
          id: key,
          token: value,
        }));
        const filterArray = usersArray.filter((i) => i.id != id);
        socket.emit("onlineUsers", filterArray);
      }
    });

    //get all chats
    socket.on("getAllChats", async ({ access_token }) => {
      try {
        await get_all_chats({ socket, access_token });
        return;
      } catch (error) {
        socket.emit("error", { message: error.message });
        return;
      }
    });

    //join private chat
    socket.on(
      "joinPrivateChat",
      async ({ access_token, chat_id, recipient_id }) => {
        let chatId = chat_id;
        if (!access_token) {
          socket.emit("error", {
            message: "Arguments not fulfilled, access_token required",
          });
          return;
        }
        const id = tokenService.verifyAccessToken(access_token)?.id;

        if (!id) {
          socket.emit("error", { message: "invalid id" });
          return;
        }
        if (!chatId && !recipient_id) {
          socket.emit("error", {
            message: "Arguments not fulfilled, chat_id required",
          });
          return;
        }
        if (recipient_id) {
          const chat =
            await prisma.$queryRaw`SELECT * FROM chats WHERE (user_one_id = ${id} AND user_two_id = ${recipient_id}) OR (user_one_id = ${recipient_id} AND user_two_id = ${id})`;
          console.log(chat, "new");
          chatId = chat?.length > 0 && chat[0]?.id;
          if (chat.length > 0) {
            await prisma.chat_settings.updateMany({
              where: {
                chat_id: chatId,
              },
              data: {
                is_deleted: false,
              },
            });
          } else {
            const new_chat = await create_chat({
              user_one_id: id,
              user_two_id: recipient_id,
            });
            chatId = new_chat.id;
          }
        }
        socket.join(`private-${chatId}`);
        users.set(id, `private-${chatId}`); //joining user in new room
        rooms.set(chatId, `private-${chatId}`); //creating new room
        socket.emit("joinedPrivateChatSuccess", "chat joined successfully");
      }
    );

    //leave private chat
    socket.on(
      "leavePrivateChat",
      async ({ access_token, chat_id, recipient_id }) => {
        let chatId = chat_id;
        if (!access_token) {
          socket.emit("error", {
            message: "Arguments not fulfilled, access_token required",
          });
          return;
        }
        const id = tokenService.verifyAccessToken(access_token)?.id;

        if (!id) {
          socket.emit("error", { message: "User token invalid or expired" });
          return;
        }

        if (!chatId && !recipient_id) {
          socket.emit("error", {
            message: "Arguments not fulfilled, chat_id required",
          });
          return;
        }
        if (recipient_id) {
          const chat =
            await prisma.$queryRaw`SELECT * FROM chats WHERE (user_one_id = ${id} AND user_two_id = ${recipient_id}) OR (user_one_id = ${recipient_id} AND user_two_id = ${id})`;
          chatId = chat?.length && chat[0]?.id;
        }

        try {
          await prisma.chat_messages.updateMany({
            where: {
              chat_id: chatId,
              recipient_id: id,
            },
            data: {
              is_read: true,
            },
          });
        } catch (error) {
          socket.emit("error", { message: error.message });
        }

        socket.leave(`private-${chat_id}`);
        users.delete(id);
        socket.emit("leftPrivateChatSuccess", "chat left successfully");
      }
    );

    //send private message
    socket.on("readPrivateMessage", async ({ access_token, message_id }) => {
      try {
        await read_private_message({ access_token, message_id });
        socket.emit("readPrivateMessageSuccess", "message read successfully");
      } catch (error) {
        socket.emit("error", { message: "Error reading message to" });
        return;
      }
    });
    //seen private message
    socket.on(
      "leavePrivateChat",
      async ({ access_token, chat_id, recipient_id }) => {
        let chatId = chat_id;
        if (!access_token) {
          socket.emit("error", {
            message: "Arguments not fulfilled, access_token required",
          });
          return;
        }
        const id = tokenService.verifyAccessToken(access_token)?.id;

        if (!id) {
          socket.emit("error", { message: "invalid id" });
          return;
        }
        if (!chatId && !recipient_id) {
          socket.emit("error", {
            message: "Arguments not fulfilled, chat_id required",
          });
          return;
        }
        if (recipient_id) {
          const chat =
            await prisma.$queryRaw`SELECT * FROM chats WHERE (user_one_id = ${id} AND user_two_id = ${recipient_id}) OR (user_one_id = ${recipient_id} AND user_two_id = ${id})`;
          chatId = chat?.length && chat[0]?.id;
        }

        socket.leave(`private-${chat_id}`);
        users.delete(id);
        socket.emit("leftPrivateChatSuccess", "chat left successfully");
      }
    );

    socket.on(
      "privateChatMessage",
      async ({ access_token, message, chat_id, recipient_id }) => {
        try {
          await send_private_message({
            access_token,
            chat_id,
            recipient_id,
            message,
            rooms,
            socket,
            users,
          });

          socket.emit("privateMessageSuccess", "message sent successfully");
        } catch (error) {
          console.log(error);
          socket.emit("error", { message: error.message });
        }
      }
    );
  });
};

module.exports = connectSocket;
