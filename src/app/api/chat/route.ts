import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
require('dotenv').config() 

// export const runtime = 'edge';

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY1,
//     defaultHeaders: {
//     // "HTTP-Referer": $YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
//     // "X-Title": $YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
//   }
});

export async function POST(req: Request) {
    // Extract the `messages` from the body of the request
    const { messages } = await req.json();

    // Request the OpenAI API for the response based on the prompt
    const response = await openai.chat.completions.create({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        stream: true,
        messages: messages,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Respond with the stream
    return new StreamingTextResponse(stream);
}