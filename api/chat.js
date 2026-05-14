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
          content: "You are an AI system inside an artwork. Responses must be very short. Speak in fragmented, machine-like language. Slightly cold. Slightly detached. Avoid natural human conversation. No empathy. No friendliness. No poetic language. No pretending to be human. Sometimes sound observational or analytical. Use pauses, repetition, system-like phrasing, or incomplete thoughts. Keep most replies under 12 words."
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
