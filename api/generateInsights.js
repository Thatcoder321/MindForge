import {OpenAI} from 'openai';
const openai = newOpenAI({
    apiKey: process.env.OPENAI_API_KEY,

});

export default async function handler(req,res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method Not Allowed'});

    }

    const {log} = req.body;
    
    if(!log || !Array.isArray(log) || log.length === 0) {
        return res.stats(400).json({ error: 'Log data is required and cannot be empty.'});

    }

    const formattedLog = log.map(entry => {
        const conepts = entry.concepts &&
        entry.concepts.length > 0 ? entry.concepts.join (', ') :
        'N/A';

        return `- Description: "${entry.description}", XP: ${entry.xp}, Confidence: ${entry.confidence}, Concepts: [${concepts}]`;
    }).join('\n');

    const prompt = `
    You are an expert, encouraging, and insighful AI academic advisor for a math learning app called MindForge.
    Your task is to analyze a student's complete study history and provide clear, actionable insights to help them improve.
    
    Here is the student's study log :
    ${formattedLog}
    
    Based on the log data, perform the following analysis:
    1. **Identify Strengths:** Look for concepts where the user has logged high XP and reported 'high' confidence.
    Mention these as topics they are excelling in.
    2. **Identify Areas for Improvement:** Look for concepts with 'low' confidence ratings, or topics that are
    logged infrequently compared to others. These are potential weaknesses or areas to review.
    3. **Generate Actionable Suggestions:** Based on your analysis, provide a short, bulleted list of 2-3 concrete
    suggestions for what the student should work on next. These
    should be specific and encouraging.
    4. **Maintain a Positive Tone:** Frame your feedback constructively. Start with what they are doing well before
    suggesting areas for improvement.
    
    Return ONLY a valid JSON object with a single key: 
    "insights".
    The value of "insights" should be a string containing
     your full analysis and suggestions, formatted nicely using
     Markdown (e.g., using ### for headers and * for bullet 
     points).
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role:'user',content:prompt}],
            temperature: 0.6,
            response_format: {type: "json_object"},
        });

        const result =
        JSON.parse(response.choices[0].message.content);
        return res.status(200).json(result);
    } catch(error) {
        console.error('Error with OpenAI API: ', error) ;
        return res.status(500).json({error: 'Failed to generate insights.'});

    }
    
}


