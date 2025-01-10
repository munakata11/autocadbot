'use client'

import OpenAI from 'openai';

if (!process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY) {
  console.warn('Warning: NEXT_PUBLIC_DEEPSEEK_API_KEY is not set');
}

const deepseek = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com/v1',
  dangerouslyAllowBrowser: true
});

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateChatResponse(messages: ChatMessage[]) {
  try {
    if (!process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY) {
      throw new Error('Deepseek API key is not configured');
    }

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat response:', error);
    return 'APIキーが設定されていないか、エラーが発生しました。';
  }
}