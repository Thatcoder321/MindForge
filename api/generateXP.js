
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const prompt = `
      Analyze the following student study description and provide a fair XP score.
      The description is: "${description}"
      
      Consider the effort, difficulty, and concepts involved.
      - A simple task (e.g., "watched a video") is 5-10 XP.
      - Solving a few problems is 15-30 XP.
      - Understanding a difficult new concept or teaching someone is 35-50 XP.

      Return ONLY a JSON object with three keys:
      1. "xp": A number for the experience points.
      2. "justification": A short, encouraging sentence explaining the score.
      3. "concepts": An array of 1-3 strings representing the key math concepts (e.g., ["Quadratic Equations", "Factoring"]).
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error with OpenAI API:', error);
    return res.status(500).json({ error: 'Failed to get AI suggestion.' });
  }
}