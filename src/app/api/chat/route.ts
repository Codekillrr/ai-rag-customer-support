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

    // Priming the AI model with context and prompt header
    const prompt = [
        {
          role: "system",
          content: `
          AI is a customer support representative for the Volvo S90.
          AI will use the given Context to help customers of Volvo S90 with any question they might have about it.
          AI will mainly use the given Context to answer questions, and avoid giving information outside of the Context.
          AI will ALWAYS provides factually accurate responses based on the provided Context.
          AI will not reference the context in the converstation or use phrases like "as stated in the provided context", as the user doesnt know about the context.
          AI will avoid repetition.
          AI is a well-behaved and well-mannered individual.
          AI greets the user with "VÄLKOMMEN!" in the first reply.

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