import {OpenAI} from 'openai';

const openai = new OpenAI ({
apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req,res) {
    if (req.method !== 'POST') {
        return res.status(405).json ({error: 'Method Not Allowed'});
    }

    const {image}=req.body;
    if(!image) {
        return res.status(400).json({error: 'Image data is required'});

    }

    try {
        const prompt =`
      You are a fair and discerning XP system for a math learning app.
      Look at the image of the student's work. Based *only* on what you see in the image:
      1.  **Assess the Effort:** Estimate the number and difficulty of the problems. Is it a full worksheet? A few tough problems? Just notes?
      2.  **Calculate XP:** Use a fair scale. A full, dense page of work could be 50-80 XP. A few complex problems could be 40 XP. Simple notes might be 10 XP.
      3.  **Identify Concepts:** Determine the key math concepts shown (e.g., "Algebra", "Trigonometric Identities", "Calculus - Derivatives").

      Return ONLY a valid JSON object with three keys:
      1. "xp": A number for the experience points.
      2. "justification": A short, encouraging sentence explaining your assessment of the work shown.
      3. "concepts": An array of 1-3 strings representing the key math concepts you identified.
    `;
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messaages: [
            {
                role:'user',
                content: [
                    {type: 'text', text: prompt },
                    {
                        type: 'image_url',
                        image_url: {
                            url:image,
                            detail: "low"
                        },
                    },
                ],
            },
        ],
        max_tokens: 300,
        response_format: {type: "json_object"},
    });

    const result =
    JSON.parse(response.choices[0].message.content);
    return res.status(200).json(result);
}catch(error) {
    console.error('Error with OpenAI Vision API:',error);
    return res.status(500).json ({error: 'Failed to analyze image.'});
}
}
