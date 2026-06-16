// 在 Vercel 服务器的运行内存里开辟一个专属的“秘密小抽屉”
let globalStorage = { lastMessage: "系统初始化成功" };

export default async function handler(req, res) {
  // 🟢 允许跨域，保证两台电脑不管在什么网段都能互相访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 📡 专门给【1号中继站】留的特殊后门：如果是 GET 请求并且带了 get_last，直接把抽屉里的字吐给它
  if (req.method === 'GET') {
    const { get_last } = req.query;
    if (get_last === 'true') {
      return res.status(200).json({ last_msg: globalStorage.lastMessage });
    }
    return res.status(200).json({ status: "Vercel 后端运行中" });
  }

  // 💬 处理聊天逻辑（POST 请求）
  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      const { store_last } = req.query;

      // 如果前端发信时带了 store_last，就把用户发的话塞进内存小抽屉里！
      if (store_last === 'true' && message) {
        globalStorage.lastMessage = message;
      }

      // 🤖 模拟 AI 回复（或者你可以换成你原本的 AI 逻辑）
      const aiReply = `Input noted. No action`;

      return res.status(200).json({ reply: aiReply });
    } catch (error) {
      return res.status(500).json({ error: "服务器内部解析错误: " + error.message });
    }
  }

  return res.status(404).json({ error: "Method not allowed" });
}
