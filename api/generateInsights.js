import {OpenAI} from 'openai';
const ipRequestCount = {};
const RATE_LIMIT = 3;
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,

});

export default async function handler(req,res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method Not Allowed'});

    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (ip) {
      const today = new Date().toISOString().split('T')[0];
      const ipKey = `${ip}_${today}`; 
  

      const currentCount = ipRequestCount[ipKey] || 0;
      
      if (currentCount >= RATE_LIMIT) {
       
        console.warn(`Rate limit exceeded for IP: ${ip}`);

        return res.status(429).json({ error: 'You have reached your daily limit for AI insights. Please try again tomorrow.' });
      }
      ipRequestCount[ipKey] = currentCount + 1;
    console.log(`Request #${ipRequestCount[ipKey]} for IP: ${ip}`);
  }
      
    const {log} = req.body;
    
    if(!log || !Array.isArray(log) || log.length === 0) {
        return res.stats(400).json({ error: 'Log data is required and cannot be empty.'});

    }

    const formattedLog = log.map(entry => {
        // Ensure entry and its properties exist to prevent crashes
        const description = entry.description || 'No description';
        const xp = entry.xp || 0;
        const confidence = entry.confidence || 'not_picked';
        
        // Check for the 'concepts' array, and format it safely
        const conceptsString = (entry.concepts && Array.isArray(entry.concepts) && entry.concepts.length > 0)
          ? entry.concepts.join(', ')
          : 'N/A';
      
        return `- Description: "${description}", XP: ${xp}, Confidence: ${confidence}, Concepts: [${conceptsString}]`;
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


