let globalStorage = {
  lastMessage: "系统初始化成功",
  lastReply: "等待 AI 回复"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const { get_last } = req.query;

    if (get_last === "true") {
      return res.status(200).json({
        user_msg: globalStorage.lastMessage,
        ai_msg: globalStorage.lastReply,
        last_msg: globalStorage.lastMessage,
        reply: globalStorage.lastReply
      });
    }

    return res.status(200).json({
      status: "Vercel 后端运行中",
      user_msg: globalStorage.lastMessage,
      ai_msg: globalStorage.lastReply
    });
  }

  if (req.method === "POST") {
    try {
      const { message } = req.body || {};
      const { store_last } = req.query;

      if (!message) {
        return res.status(400).json({
          error: "缺少 message"
        });
      }

      if (store_last === "true") {
        globalStorage.lastMessage = message;
      }

      const aiReply = `我收到了：${message}`;

      globalStorage.lastReply = aiReply;

      return res.status(200).json({
        user_msg: globalStorage.lastMessage,
        ai_msg: aiReply,
        last_msg: globalStorage.lastMessage,
        reply: aiReply
      });
    } catch (error) {
      return res.status(500).json({
        error: "服务器内部解析错误: " + error.message
      });
    }
  }

  return res.status(404).json({
    error: "Method not allowed"
  });
}
