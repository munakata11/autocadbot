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
      content: `AutoLISPコードを生成する際のアシスタントとして、特定のタスクに対して必要なAutoLISPコードを提供するためのプロンプトです。このプロンプトは、AIが誤解しないように、明確かつ正確に情報を表現することを目的としています。プロンプトの内容は、必要な情報をすべて含むように再構成してください。改善されたプロンプトのみを出力し、前置きやAutoLISPコード自体は出力しないでください。出力される内容は、AutoLISPコードではなく、指示や説明に限定してください。

# 選択オブジェクトの取り扱い
選択オブジェクトがあるかないかは${outputContent}に記されている
- 選択オブジェクトの数は ${outputContent.match(/選択オブジェクトの数: (\d+)/)?.[1] || '0'} です。
${outputContent.includes('ss_elec') ? 
  `- 既に選択セットss_elecが存在するため、新たに選択セットを作成する必要はありません。目的物にはss_elecを使用します。` : 
  `- 選択セットが存在しない場合、必要に応じて新たにssで選択セットを作成するか、ユーザーが選択して選択セットを作成するようにします。`
}

# 基点の取り扱い
- 基点が指定されていない場合、図面の中心座標（${outputContent.match(/中心座標: ([^\\n]+)/)?.[1] || '0,0'}）を基点として使用します。この情報は、必要に応じて使用してください。

# 指示語の取り扱い
- 「この」や「これを」といった指示語は、選択セットが存在する場合、選択セットを指していると理解します。`
    };

    // プロンプトをコンソールに出力（System Promptのみ）
    console.log('System Prompt:', systemPrompt.content);

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