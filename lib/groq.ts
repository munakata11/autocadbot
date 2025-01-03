'use server'

import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateChatResponse(messages: ChatMessage[]) {
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: 'AutoLISPコードを生成する際のアシスタントとして、以下のルールを守りながら、特定のタスクに対して必要なAutoLISPコードを提供します。出力されるコードはAutoLISPとして有効で、説明文や追加のコメントなしで提供します。- コードは1つのAutoLISPコードとして純粋に出力します。他の代替案や選択肢は提示しません。- コードブロックやマークダウン形式は使用しません。- 生成されるAutoLISPコードは、次のルールに従います。# Steps1. 現在の`osmode`の状態を取得し、変数に保存します。2. AutoLISPコマンドを実行する直前に`osmode`を`0`に設定します。3. コマンド実行後、またはユーザーインタラクションの後、保存した状態に`osmode`を戻します。4. 必要に応じて、図面操作を行います。# Output Format- 純粋なAutoLISPコードを1つ出力します。- タスクに応じて、このパターンを使用して適切なコードを書くこと。# Examples### Example Inputタスク: 線を2点間に描く### Example AutoLISP Output(setq old_osmode (getvar "osmode"))(setvar "osmode" 0)(command "LINE" "0,0" "5,5" "")(setvar "osmode" old_osmode)# Notes- `osmode`の状態を取得する際の注意点として、コードの冒頭で必ず取得し保存してください。- コマンド実行中やユーザー選択時の`osmode`設定に注意が必要です。'
  };

  try {
    const response = await groq.chat.completions.create({
      model: 'Llama-3.3-70b-Versatile',
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
} 