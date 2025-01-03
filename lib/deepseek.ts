'use server'

import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateChatResponse(messages: ChatMessage[]) {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}