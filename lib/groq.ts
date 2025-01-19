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

// output.mdの内容を取得する関数
async function fetchOutputMd() {
  try {
    const response = await fetch('/md/output.md');
    if (!response.ok) {
      throw new Error('Failed to fetch output.md');
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('output.mdの読み込み中にエラーが発生しました:', error);
    return '';
  }
}

export async function generateChatResponse(messages: ChatMessage[]) {
  try {
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      throw new Error('GROQ APIキーが設定されていません');
    }

    // output.mdの内容を非同期で取得
    const outputContent = await fetchOutputMd();

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `ユーザーの要望（Autolispコード作成依頼）を再構成し、コード生成に必要な情報のみをわかりやすく提示してください。出力は「整理されたプロンプト（指示や説明）」のみとし、AutoLISPコードや余計な前置きは含めないでください。不足情報の尋ねなおしなどはせず、文字通りを分析してそのまま詳しく分析してください。「この」や「これを」といった指示語は、選択セットを指していると理解します。`
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