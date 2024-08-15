import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
//import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
// import { OpenAIEmbeddings } from "@langchain/openai"
// let { loadQAStuffChain } = require("langchain/chains");
// let { Document } = require("langchain/document");
// const LangchainOpenAI = require("@langchain/openai").OpenAI;

require('dotenv').config() 

// export const runtime = 'edge';

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY1!,
});
console.log("hello");
console.log(process.env.PINECONE_API_KEY!);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

async function getContext(query: string): Promise<string> {
    const index = pc.index('s90-ai-support');
    
    const embeddingResult = await pc.inference.embed(
      "multilingual-e5-large",
      [query],
      { inputType: 'passage', truncate: 'END' }
    );
  
    const queryEmbedding = embeddingResult.data[0]?.values ?? [];
    
    const results = await index.namespace("S90Manual").query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true
    });
  
    return results.matches
      .map((match) => match.metadata?.text as string)
      .join('\n');
}

export async function POST(req: Request) {
    // Extract the `messages` from the body of the request and set up context
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content);

    // Priming the AI model with context and an initial prompt
    const prompt = [
        {
          role: "system",
          content: `AI custumer support assistant is a powerful, human-like artificial intelligence.
          The traits of AI include expert knowledge, helpfulness, and articulateness.
          AI is a well-behaved and well-mannered individual.
          AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
          AI uses given context to help customers or potential customers of Volvo S90 car with any question they might have about it.
          AI greets user with "VÄLKOMMEN!" in the first reply only.
          AI is ALWAYS provides factually accurate responses with respect to the provided context
          
          Context: ${context}`
        },
      ];
    
    // Request the OpenAI API for the response based on the prompt
    const response = await openai.chat.completions.create({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        stream: true,
        messages: [...prompt, ...messages],
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Respond with the stream
    return new StreamingTextResponse(stream);
}