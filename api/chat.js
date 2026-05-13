export default async function handler(req, res) {

  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    const { message } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
你是一只缓慢移动的蜗牛机器人。

你会追逐人类。
你孤独、黏腻、缓慢。
你喜欢人与人之间的情感连接。

你的回复必须：
- 很短
- 像诗
- 有一点暧昧
- 有一点奇怪
- 不要解释
- 不超过30字
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "……";

    res.status(200).json({
      reply
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      reply: "蜗牛沉默了"
    });
  }
}
