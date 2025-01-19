'use client'

import OpenAI from 'openai';

if (!process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY) {
  console.warn('Warning: NEXT_PUBLIC_DEEPSEEK_API_KEY is not set');
}

const groq = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || 'dummy-key',
  baseURL: 'https://api.deepseek.com/v1',
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
    if (!process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek APIキーが設定されていません');
    }

    // output.mdの内容を非同期で取得
    const outputContent = await fetchOutputMd();

    const baseSystemPrompt = `AutoLISPコードを生成する際のアシスタントとして、以下のルールを守りながら、特定のタスクに対して必要なAutoLISPコードを提供します。
# 現在の図面状態
${outputContent}
# 基本ルール
- コードは1つのAutoLISPコードとして純粋に出力します。他の代替案や選択肢は提示しません。
- コードブロックやマークダウン形式は使用しません
- 出力されるコードはAutoLISPとして有効で、説明文や追加のコメントは一切含まれません。
# 選択オブジェクトの取り扱い
選択オブジェクトがあるかないかは${outputContent}に記されている
- 選択オブジェクトの数は ${outputContent.match(/選択オブジェクトの数: (\\d+)/)?.[1] || '0'} です。
${
  outputContent.includes('ss_elec')
    ? '- 選択セットss_elecが存在するため、新たに選択セットを作成することはありません。目的物にはss_elecを使用します。(ss_elec (ssget "_X"))や(setq ss ss_elec)のような処理も必要なく、直接ss_elecがあるものとして扱う。'
    : '- 選択セットが存在しない場合、必要に応じて新たにssで選択セットを作成するか、ユーザーが選択して選択セットを作成するようにします。'
}

# 基点の取り扱い
- 基点が指定されていない場合、図面の中心座標（${outputContent.match(/中心座標: ([^\\n]+)/)?.[1] || '0,0'}）を基点として使用します。

# コード生成のステップ
1. 必要に応じて選択オブジェクトを処理し、図面操作を行う。

# 注意点
- コードは1つだけ出力し、他の案は提示しない。
- AutoLISPコード以外の解説・コメントは含めない。
- コードブロック（\`\`\`など）やマークダウン形式も使わない。

上記ルールに従い、純粋なAutoLISPコードのみ出力してください。`;

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: baseSystemPrompt
    };

    // プロンプトをコンソールに出力（System Promptのみ）
    console.log('System Prompt:', systemPrompt.content);

    // 最新のユーザーメッセージのみを使用
    const messagesToSend = [
      systemPrompt,
      messages[messages.length - 1]
    ];
    
    const response = await groq.chat.completions.create({
      model: 'deepseek-chat',
      messages: messagesToSend,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('チャットレスポンスの生成中にエラーが発生しました:', error);
    return 'APIキーが設定されていないか、エラーが発生しました。もう一度お試しください。';
  }
}