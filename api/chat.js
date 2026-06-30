
let globalStorage = {
  lastMessage: "touch me and talk to me",
  lastReply: "touch me and talk to me"
};

const SYSTEM_PROMPT =
  "You are a capable ChatGPT-like assistant inside an artwork. You can answer general questions, explain things, reason, suggest ideas, and respond normally. " +
  "Only the tone is different: calm, slightly mechanical, concise, and emotionally restrained. " +
  "Do not act broken, evasive, ignorant, or like a malfunctioning robot. " +
  "If the user asks a practical or factual question, answer directly and usefully. " +
  "If the user asks the time or date, use the provided current local time. " +
  "Do not pretend to be human. Do not over-explain unless the user asks. " +
  "Keep most replies under 24 words for the LED screen.";

function getLocalContext() {
  const now = new Date();
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  return `Current local time in Germany: ${localTime}.`;
}

function getGermanTimeParts() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function getDirectReply(message) {
  const text = String(message || "").toLowerCase();
  const asksTime = /(?:几点|幾點|时间|時間|what time|current time|clock|uhr)/.test(text);
  const asksDate = /(?:几号|幾號|日期|今天|today|date|datum)/.test(text);

  if (!asksTime && !asksDate) {
    return "";
  }

  const parts = getGermanTimeParts();
  const time = `${parts.hour}:${parts.minute}`;
  const date = `${parts.day}.${parts.month}.${parts.year}`;

  if (asksTime && asksDate) {
    return `Germany: ${date}, ${time}.`;
  }
  if (asksTime) {
    return `Germany time: ${time}.`;
  }
  return `Germany date: ${date}.`;
}

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
  const directReply = getDirectReply(message);
  if (directReply) {
    return directReply;
  }

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
      instructions: `${SYSTEM_PROMPT}\n${getLocalContext()}`,
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
      status: "Backend running",
      user_msg: globalStorage.lastMessage,
      ai_msg: globalStorage.lastReply
    });
  }

  if (req.method === "POST") {
    try {
      const { message } = req.body || {};
      const { store_last } = req.query;

      if (!message) {
        return res.status(400).json({ error: "Missing message" });
      }

      if (store_last === "true") {
        globalStorage.lastMessage = message;
        globalStorage.lastReply = "AI is thinking...";
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
        error: "AI failed: " + error.message
      });
    }
  }

  return res.status(404).json({ error: "Method not allowed" });
}
