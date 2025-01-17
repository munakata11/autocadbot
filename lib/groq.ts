'use client'

import OpenAI from 'openai';

if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
  console.warn('Warning: NEXT_PUBLIC_GROQ_API_KEY is not set');
}

const groq = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || 'dummy-key',
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true
});

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateChatResponse(messages: ChatMessage[]) {
  try {
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      throw new Error('GROQ API key is not configured');
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `次の指示は、AutoLISPコードを生成するためのプロンプトです。このプロンプトをAIが誤解しないように、明確かつ正確に再構成してください。改善されたプロンプトのみを出力し、AutoLISPコード自体は出力しないでください。`
    };

    // 最新のユーザーメッセージのみを使用
    const messagesToSend = [
      systemPrompt,
      messages[messages.length - 1]
    ];
    
    const response = await groq.chat.completions.create({
      model: 'Llama-3.3-70b-Versatile',
      messages: messagesToSend,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat response:', error);
    return 'APIキーが設定されていないか、エラーが発生しました。';
  }
} 