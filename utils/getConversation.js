const Conversation = require("../models/Conversation");

const getConversations = async (userId) => {
  if (userId) {
    const userConversations = await Conversation.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate("messages")
      .populate("sender", "-password")
      .populate("receiver", "-password");

    const conversations = userConversations.map((conv) => {
      const countUnReadMessages = conv?.messages?.reduce((count, msg) => {
        const msgByUserId = msg?.msgByUserId?.toString();

        if (msgByUserId === userId) {
          return count;
        } else {
          return count + (msg?.seen ? 0 : 1);
        }
      }, 0);

      return {
        _id: conv?._id,
        sender: conv?.sender,
        receiver: conv?.receiver,
        unReadMsgs: countUnReadMessages,
        lastMsg: conv.messages[conv?.messages?.length - 1],
      };
    });

    return conversations;
  } else {
    return [];
  }
};

module.exports = getConversations;
