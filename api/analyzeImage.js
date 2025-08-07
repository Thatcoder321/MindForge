import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }


  const { image, text } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    // Dynamically create the context part of the prompt
    const userTextContext = text 
        ? `The user also provided this text context: "${text}"`
        : "The user did not provide any extra text context.";

    const prompt = `
      You are a fair and discerning XP system for a math learning app.
      Your task is to analyze a student's work based on two sources: an uploaded image AND an optional text description from the user.

      1.  **Image is Primary Evidence:** Use the image as the main source of truth for the work completed. Assess the density, difficulty, and number of problems.
      2.  **Text Provides Context:** Use the student's text to understand their thought process, difficulty, or breakthroughs. If the user says "it was easy," be more conservative with XP. If they say "it finally clicked" or "this was very hard," award bonus XP for the breakthrough.
      3.  **Calculate XP:** Based on BOTH the image and text, calculate a fair XP score. A dense worksheet is 50-80 XP. A few complex problems are 40 XP. Notes are 10 XP. Apply bonuses or reductions based on the text.
      4.  **Identify Concepts:** Determine the key math concepts shown in the image.

      ${userTextContext}

      Return ONLY a valid JSON object with three keys:
      1. "xp": A number for the experience points.
      2. "justification": A short, encouraging sentence explaining your assessment, referencing both the image and the user's text if provided.
      3. "concepts": An array of 1-3 strings representing the key math concepts.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image, detail: "high" } },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error with OpenAI Vision API:', error);
    return res.status(500).json({ error: 'Failed to analyze image.' });
  }
}