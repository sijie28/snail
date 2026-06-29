

let globalStorage = {
  lastMessage: "系统初始化成功",
  lastReply: "等待 AI 回复"
};

const SYSTEM_PROMPT =
  "You are an AI system inside an artwork. Responses must be very short. " +
  "Speak in fragmented, machine-like language. Slightly cold. Slightly detached. " +
  "Avoid natural human conversation, empathy, friendliness, and poetic language. " +
  "Do not pretend to be human. Sometimes sound observational or analytical. " +
  "Use pauses, repetition, system-like phrasing, or incomplete thoughts. " +
  "Keep most replies under 12 words.";

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data.output || []) {
    if (typeof item.text === "string") {
      parts.push(item.text);
    }

    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join(" ").trim();
}

async function generateAiReply(message) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM_PROMPT,
      input: message,
      max_output_tokens: 80
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI request failed");
  }

  return extractResponseText(data) || "Signal unclear.";
}

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
        return res.status(400).json({ error: "缺少 message" });
      }

      if (store_last === "true") {
        globalStorage.lastMessage = message;
        globalStorage.lastReply = "AI 正在思考...";
      }

      const aiReply = await generateAiReply(message);
      globalStorage.lastReply = aiReply;

      return res.status(200).json({
        user_msg: globalStorage.lastMessage,
        ai_msg: aiReply,
        last_msg: globalStorage.lastMessage,
        reply: aiReply
      });
    } catch (error) {
      const fallback = "Signal interrupted.";
      globalStorage.lastReply = fallback;

      return res.status(500).json({
        user_msg: globalStorage.lastMessage,
        ai_msg: fallback,
        last_msg: globalStorage.lastMessage,
        reply: fallback,
        error: "AI 生成失败: " + error.message
      });
    }
  }

  return res.status(404).json({ error: "Method not allowed" });
}
