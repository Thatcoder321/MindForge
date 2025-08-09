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
  
    5. **Group Concepts into Standardized Categories:** You must categorize all math concepts into broad, standardized categories. Choose from the following list ONLY:
       - "Geometry Proofs" (includes ALL proof techniques: AAA theorem, SAS theorem, SSS theorem, AAS theorem, congruent triangles, similar triangles, parallel lines, angle relationships, etc.)
       - "Algebraic Manipulation" (includes solving equations, factoring, expanding, simplifying expressions, systems of equations, inequalities, etc.)
       - "Trigonometric Ratios" (includes sine, cosine, tangent, unit circle, inverse trig functions, trig identities, etc.)
       - "Statistics & Data" (includes mean, median, mode, probability, distributions, data analysis, graphs, etc.)
       - "Calculus Techniques" (includes derivatives, integrals, limits, optimization, related rates, etc.)
       - "Mathematical Reasoning" (includes logic, problem-solving strategies, mathematical communication, proof writing in general, etc.)
       - "Functions & Relations" (includes function notation, domain/range, transformations, graphing functions, etc.)
       - "Number Theory" (includes prime numbers, divisibility, modular arithmetic, sequences, series, etc.)
       - "Other" (only use if the work truly doesn't fit any of the above categories)
  
  **CRITICAL CONCEPT GROUPING RULES:**
        - NEVER use specific theorem names like "AAA Theorem", "SAS Theorem", "SSS Theorem", "AAS Theorem", etc. - these ALL belong under "Geometry Proofs"
        - NEVER use specific technique names like "Quadratic Formula" or "Completing the Square" - these ALL belong under "Algebraic Manipulation"
        - NEVER use specific function names like "Sine Function" or "Cosine Function" - these ALL belong under "Trigonometric Ratios"
        - NEVER use specific rule names like "Chain Rule" or "Product Rule" - these ALL belong under "Calculus Techniques"
        - Always think: "What is the broader mathematical skill being practiced?" and choose the appropriate category
        - If you see triangle congruence work, angle proofs, parallel line theorems, or ANY geometric proof work → use "Geometry Proofs"
        - If you see equation solving, factoring, or algebraic work → use "Algebraic Manipulation"
        - Maximum 3 categories per response, minimum 1 category
        - YOU MUST ONLY USE THE EXACT CATEGORY NAMES FROM THE LIST ABOVE - no variations, no specific theorem names, no technique names
  
    **Examples of Correct Categorization:**
    - Student mentions working on SSS triangle congruence → "Geometry Proofs"
    - Student mentions solving quadratic equations using multiple methods → "Algebraic Manipulation"
    - Student mentions both triangle proofs AND solving linear equations → ["Geometry Proofs", "Algebraic Manipulation"]
    - Student mentions "logarithmic functions" → "Functions & Relations"
    - Student mentions "derivatives and chain rule" → "Calculus Techniques"
  
    Return ONLY a valid JSON object with three keys:
    1. "xp": A number for the experience points, calculated based on the rules above.
    2. "justification": A short, encouraging sentence explaining the score, which can also gently note if a claim seemed exaggerated.
    3. "concepts": An array of 1-3 strings representing the key math concepts mentioned, chosen ONLY from the standardized categories listed above. Do NOT use specific theorem names or technique names.
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