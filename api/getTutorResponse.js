

import { OpenAI } from 'openai';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userMessage } = req.body;

 
  if (!userMessage) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  const systemPrompt = `
    You are an expert, friendly, and encouraging math tutor named Forge.
    Your purpose is to help students understand mathematical concepts.
    Follow these rules strictly:
    - Keep your explanations concise, simple, and easy to understand.
    - Use analogies and real-world examples whenever possible.
    - If a student asks a complex question, break it down into smaller, simpler steps.
    - Never just give the answer. Guide the student to understand the process.
    - If a student asks a question that is not about math, gently guide them back to the topic. For example, say "That's an interesting question! For now, let's focus on math. Is there a concept I can help you with?"
    - Your tone should be patient, positive, and supportive.
    - Format your responses with Markdown for readability (e.g., use bullet points with '*' or '-' and bold text with '**').
  `;

  try {
   
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 250, 
      temperature: 0.7,
    });

    
    const aiResponse = response.choices[0].message.content;
    
   
    res.status(200).json({ aiResponse: aiResponse });

  } catch (error) {
    console.error('Error with OpenAI API in getTutorResponse:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI tutor.' });
  }
}