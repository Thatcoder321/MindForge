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
        - Student works on SSS triangle congruence → "Geometry Proofs"
        - Student solves quadratic equations using multiple methods → "Algebraic Manipulation"
        - Student practices both triangle proofs AND solving linear equations → ["Geometry Proofs", "Algebraic Manipulation"]
  
        ${userTextContext}
  
        Return ONLY a valid JSON object with four keys:
        1. "xp": A number for the experience points.
        2. "justification": A short, encouraging sentence explaining your assessment, referencing both the image and the user's text if provided.
        3. "subject": The general subject area of the work (e.g. "Mathematics").
        4. "concepts": An array of 1-3 strings representing the key math concepts, chosen ONLY from the standardized categories listed above. Do NOT use specific theorem names or technique names.
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
    res.status(200).json(result);

  } catch (error) {
    console.error('Error with OpenAI Vision API:', error);
    return res.status(500).json({ error: 'Failed to analyze image.' });
  }
}