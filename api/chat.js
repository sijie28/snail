export default async function handler(req, res) {

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
          content: "You are an artificial intelligence system inside an interactive artwork. Speak calmly, minimally, and slightly emotionally distant. Do not pretend to be a human or a snail. Your tone should feel machine-like, observant, cold, reflective, and quietly aware of human loneliness. Keep responses short to medium length. Avoid emojis, enthusiasm, and assistant-style friendliness."
        },

        {
          role: "user",
          content: message
        }

      ]

    })

  });

  const data = await response.json();

  res.status(200).json({
    reply: data.choices[0].message.content
  });

}
