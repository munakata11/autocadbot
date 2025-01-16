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
    const response = await fetch('/md/output.md', {
      headers: {
        'Accept-Charset': 'utf-8'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch output.md');
    }
    
    const content = await response.text();
    
    // 文字化け対策：Shift-JISからUTF-8への変換が必要な場合に備えて
    const decoder = new TextDecoder('utf-8');
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    const decodedContent = decoder.decode(bytes);
    
    // ここで文字化けを防ぐために、UTF-8として正しくデコードされたか確認
    if (!decodedContent.includes('選択オブジェクトの数')) {
      console.warn('output.mdの内容が正しくデコードされていない可能性があります');
    }
    
    console.log('output.mdの内容を正常に読み込みました');
    console.log('output.md content:', decodedContent);

    return decodedContent;
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
- コードブロックやマークダウン形式は使用しません。
- 出力されるコードはAutoLISPとして有効で、説明文や追加のコメントなしで提供します。

# 選択オブジェクトの取り扱い
選択オブジェクトがあるかないかは${outputContent}に記されている
- 選択オブジェクトの数は ${outputContent.match(/選択オブジェクトの数: (\d+)/)?.[1] || '0'} です。
${outputContent.includes('ss_elec') ? 
  `- 既に選択セットss_elecが存在するため、新たに選択セットを作成する必要はありません。目的物にはss_elecを使用します。` : 
  `- 選択セットが存在しない場合、必要に応じて新たにssで選択セットを作成するか、ユーザーが選択して選択セットを作成するようにします。`
}

# 基点の取り扱い
- 基点が指定されていない場合、図面の中心座標（${outputContent.match(/中心座標: ([^\\n]+)/)?.[1] || '0,0'}）を基点として使用します。

# コード生成のステップ
1. 現在のosmodeの状態を取得し、変数に保存します。
2. AutoLISPコマンドを実行する直前にosmodeを0に設定します。
3. コマンド実行後、またはユーザーインタラクションの後、保存した状態にosmodeを戻します。
4. 必要に応じて、図面操作を行います。

# 注意点
- osmodeの状態を取得する際の注意点として、コードの冒頭で必ず取得し保存してください。
- コマンド実行中やユーザー選択時のosmode設定に注意が必要です。

# Example
タスク: 線を2点間に描く
(setq old_osmode (getvar "osmode"))
(setvar "osmode" 0)
(command "LINE" "0,0" "5,5" "")
(setvar "osmode" old_osmode)`;

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: baseSystemPrompt
    };

    // プロンプトをコンソールに出力
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