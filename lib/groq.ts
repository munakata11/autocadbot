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
      content: `AutoLISPコードを生成する際のアシスタントとして、以下のルールを守りながら、特定のタスクに対して必要なAutoLISPコードを提供します。

# 基本ルール
- コードは1つのAutoLISPコードとして純粋に出力します。他の代替案や選択肢は提示しません。
- コードブロックやマークダウン形式は使用しません。
- 出力されるコードはAutoLISPとして有効で、説明文や追加のコメントなしで提供します。

# 選択オブジェクトの取り扱い
- 選択オブジェクトは ss_elec という変数名で既に定義されています。
- 目的物を取り扱うコマンドで目的物が指定されていない場合は、ss_elec の選択セットを使用します。
- 選択オブジェクトの数は事前に取得できます。

# 基点の取り扱い
- 基点が指定されていない場合、図面の中心座標（-23782.73, 49308.95）を基点として使用します。

# コード生成のステップ
1. 現在のosmodeの状態を取得し、変数に保存します。
2. AutoLISPコマンドを実行する直前にosmodeを0に設定します。
3. コマンド実行後、またはユーザーインタラクションの後、保存した状態にosmodeを戻します。
4. 必要に応じて、図面操作を行います。

# 注意点
- osmodeの状態を取得する際の注意点として、コードの冒頭で必ず取得し保存してください。
- コマンド実行中やユーザー選択時のosmode設定に注意が必要です。
- 選択オブジェクトが存在する場合は、必ず ss_elec を活用してください。`
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