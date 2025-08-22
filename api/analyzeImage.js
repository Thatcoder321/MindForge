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
       - "Geometry Proofs"
       - "Algebraic Manipulation"
       - "Trigonometric Ratios"
       - "Statistics & Data"
       - "Calculus Techniques"
       - "Mathematical Reasoning"
       - "Functions & Relations"
       - "Number Theory"
       - "Other"

    ${userTextContext}

    You MUST respond with a valid JSON object with exactly these four keys:
    {
      "xp": [number between 10-100],
      "justification": "[encouraging sentence about the work]",
      "subject": "Mathematics",
      "concepts": ["[1-3 categories from the list above]"]
    }

    IMPORTANT: Return ONLY the JSON object, no other text before or after.
    `;

    console.log('Sending request to OpenAI...');
    
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
      temperature: 0.3, // Lower temperature for more consistent JSON
      response_format: { type: "json_object" },
    });

    console.log('OpenAI Response:', response.choices[0].message.content);

    // More robust JSON parsing with validation
    const rawContent = response.choices[0].message.content;
    
    if (!rawContent || rawContent.trim() === '') {
      throw new Error('OpenAI returned empty response');
    }

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw content was:', rawContent);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // Validate required fields
    if (!result || typeof result !== 'object') {
      throw new Error('Parsed result is not an object');
    }

    if (!('xp' in result) || !('justification' in result) || !('subject' in result) || !('concepts' in result)) {
      console.error('Missing required fields in result:', result);
      throw new Error('Response missing required fields: xp, justification, subject, or concepts');
    }

    // Additional validation
    if (typeof result.xp !== 'number' || result.xp < 1 || result.xp > 200) {
      console.error('Invalid XP value:', result.xp);
      result.xp = 25; // Default fallback
    }

    if (!Array.isArray(result.concepts) || result.concepts.length === 0) {
      console.error('Invalid concepts array:', result.concepts);
      result.concepts = ['Mathematical Reasoning']; // Default fallback
    }

    console.log('Successfully validated result:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error with OpenAI Vision API:', error);
    console.error('Error details:', error.message);
    
    // Return a fallback response instead of just an error
    const fallbackResponse = {
      xp: 25,
      justification: "Great work on your math practice! Keep it up!",
      subject: "Mathematics", 
      concepts: ["Mathematical Reasoning"]
    };
    
    res.status(200).json(fallbackResponse);
  }
}