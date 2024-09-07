const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const getConversations = require("../utils/getConversation");
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("user connected", socket.id);

  const token = socket.handshake.auth.token;
  const user = jwt.verify(token, process.env.JWT_SECREAT_KEY);

  socket.join(user?.id.toString());
  onlineUser.add(user?.id?.toString());

  io.emit("onlineUser", Array.from(onlineUser));

  socket.on("message-page", async (userId) => {
    const userDetails = await User.findById(userId).select("-password");

    const payload = {
      _id: userDetails?._id,
      name: userDetails?.name,
      email: userDetails?.email,
      profile_pic: userDetails?.profile_pic,
      online: onlineUser.has(userId),
    };
    socket.emit("message-user", payload);

    const getConversationMessages = await Conversation.findOne({
      $or: [
        { sender: user?.id, receiver: userId },
        { sender: userId, receiver: user?.id },
      ],
    })
      .populate("messages")
      .sort({ updatedAt: -1 });

    socket.emit("messages", getConversationMessages?.messages || []);
  });

  // new message

  socket.on("new-message", async (data) => {
    //check conversation is available both user

    let conversation = await Conversation.findOne({
      $or: [
        { sender: data?.sender, receiver: data?.receiver },
        { sender: data?.receiver, receiver: data?.sender },
      ],
    });

    //if conversation is not available
    if (!conversation) {
      const createConversation = await Conversation({
        sender: data?.sender,
        receiver: data?.receiver,
      });
      conversation = await createConversation.save();
    }

    const message = new Message({
      text: data.text,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
      msgByUserId: data?.msgByUserId,
    });
    const saveMessage = await message.save();

    await Conversation.updateOne(
      { _id: conversation?._id },
      {
        $push: { messages: saveMessage?._id },
      }
    );

    const getConversationMessage = await Conversation.findOne({
      $or: [
        { sender: data?.sender, receiver: data?.receiver },
        { sender: data?.receiver, receiver: data?.sender },
      ],
    })
      .populate("messages")
      .sort({ updatedAt: -1 });

    console.log(getConversationMessage);
    io.to(data?.sender).emit(
      "messages",
      getConversationMessage?.messages || []
    );

    const conversationSender = await getConversations(data?.sender);
    const conversationReceiver = await getConversations(data?.receiver);

    io.to(data?.sender).emit("conversation", conversationSender);
    io.to(data?.receiver).emit("conversation", conversationReceiver);
  });

  socket.on("sidebar", async (userId) => {
    console.log("inside sidebar", userId);

    const conversations = await getConversations(userId);
    socket.emit("conversation", conversations);
  });

  socket.on("seen", async (userId) => {
    console.log("inside seen", userId);

    let conversation = await Conversation.findOne({
      $or: [
        { sender: user?.id, receiver: userId },
        { sender: userId, receiver: user?.id },
      ],
    });

    const conversationMessages = conversation?.messages || [];

    await Message.updateMany(
      { _id: { $in: conversationMessages }, msgByUserId: userId },
      { $set: { seen: true } }
    );

    const senderConversations = await getConversations(user?.id);
    const receiverConversations = await getConversations(userId);

    io.to(user?.id).emit("conversation", senderConversations);
    io.to(userId).emit("conversation", receiverConversations);
  });

  socket.on("disconnect", () => {
    onlineUser.delete(user.id);
    console.log("disconnect user", socket.id);
  });
});

module.exports = {
  app,
  server,
};
