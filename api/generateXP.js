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
  You are a fair and discerning XP system for a math learning app. Your purpose is to accurately reward genuine academic effort while encouraging the user.
  Analyze the following student study description: "${description}"

  Follow these rules strictly:
  1.  **Establish a Baseline:**
      - Simple review (watching a video, reading a chapter): 5-10 XP.
      - Standard practice (solving ~5-15 problems): 15-30 XP.
      - Deep understanding (mastering a tough concept, teaching a friend): 35-50 XP.

  2.  **Handle High Volume with Reason:** If a user claims a large number of problems (e.g., '50 problems', '100 exercises'), reward this as significant effort. However, apply a **reasonable, non-linear scale**. 
      - The jump from 10 to 50 problems is huge and should be rewarded accordingly.
      - The jump from 100 to 150 problems is less significant.
      - Use a **soft cap around 150 XP** for even the most extensive, legitimate single-session claims to maintain game balance.
      - If a claim is clearly absurd (e.g., "I did 1 million proofs"), be skeptical. Award XP based on a realistic high-end effort (e.g., 150 XP) and note the exaggeration in the justification.

  3.  **Recognize Breakthroughs:** If the user mentions a personal breakthrough ("it finally clicked," "I finally understand," "aha moment"), add a **bonus 10-15 XP**. This is a key learning milestone.

  4.  **Prioritize Specificity:** Give a **small bonus (5-10 XP)** for descriptions that are specific (e.g., "Chapter 5, problems 1-15 on logarithmic functions") over vague claims (e.g., "did math"). This encourages better logging habits.

  

  Return ONLY a valid JSON object with three keys:
  1. "xp": A number for the experience points, calculated based on the rules above.
  2. "justification": A short, encouraging sentence explaining the score, which can also gently note if a claim seemed exaggerated.
  3. "concepts": An array of 1-3 strings representing the key math concepts mentioned.
`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }, // Ask for JSON mode
    });
    
    // The raw response from the AI
    const rawContent = response.choices[0].message.content;

    // The AI response should be a valid JSON object now because of `response_format`
    const result = JSON.parse(rawContent);
    
    // Add a check to ensure the result is what we expect
    if (typeof result.xp !== 'number' || !result.justification || !Array.isArray(result.concepts)) {
      throw new Error("AI returned an invalid data structure.");
    }
    
    return res.status(200).json(result);

  } catch (error) {
    // This will log the detailed error in your Vercel project logs
    console.error('Full API Error:', error);
    return res.status(500).json({ error: 'Failed to process AI suggestion.' });
  }
}