"use client"

import ChatInterface from '@/components/chat-interface'
import { useState } from 'react'

interface ChatItem {
  id: number;
  text: string;
  fullText: string;
}

export default function Home() {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([
    {
      id: 1,
      text: "図面の寸法入力について質問しました...",
      fullText: "図面の寸法入力について質問しました。寸法スタイルの設定方法や、関連寸法の作成方法などについて詳しく確認しました。"
    },
    {
      id: 2,
      text: "ブロックの作成方法を確認しました...",
      fullText: "ブロックの作成方法を確認しました。属性の設定や動的ブロックの作成手順について学びました。"
    },
    {
      id: 3,
      text: "印刷設定の手順を確認しました...",
      fullText: "印刷設定の手順を確認しました。用紙サイズやスケール、線の太さなどの設定方法を確認しました。"
    }
  ]);

  const [pinnedMessages, setPinnedMessages] = useState<ChatItem[]>([
    {
      id: 1,
      text: "よく使うショートカットキー一覧...",
      fullText: "よく使うショートカットキー一覧：移動(M)、コピー(CO)、トリム(TR)、延長(EX)、オフセット(O)など、作図効率を上げる重要なコマンド"
    },
    {
      id: 2,
      text: "図面テンプレートの保存場所...",
      fullText: "図面テンプレートの保存場所：C:\\Users\\[ユーザー名]\\AppData\\Local\\Autodesk\\AutoCAD 2024\\R24.0\\[言語]\\Template"
    },
    {
      id: 3,
      text: "プリンター設定の初期値...",
      fullText: "プリンター設定の初期値：用紙サイズ(A3)、尺度(1:50)、線の太さ(0.5mm)、モノクロ印刷設定"
    }
  ]);

  const handlePin = (chatItem: ChatItem) => {
    if (pinnedMessages.length < 5) {
      setPinnedMessages([...pinnedMessages, {
        id: Date.now(),
        text: chatItem.text,
        fullText: chatItem.fullText
      }]);
      setChatHistory(chatHistory.filter(item => item.id !== chatItem.id));
    } else {
      alert('ピン留めは5件までです。既存のピン留めを削除してから試してください。');
    }
  };

  const handleUnpin = (pinnedItem: ChatItem) => {
    setPinnedMessages(pinnedMessages.filter(item => item.id !== pinnedItem.id));
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        backgroundImage: 'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/haikei1-VBjFENRnUMVqm56SaO4P7NIOgitqL9.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="relative min-h-[500px]">
            <div className="pt-8">
              <h1 className="text-4xl font-bold text-blue-900 mb-4 text-center">
                AutoCAD Assistant
              </h1>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-3 border border-blue-900/20 rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">最近のチャット履歴</h3>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => {
                      const chat = chatHistory[index];
                      return (
                        <div key={chat ? chat.id : `empty-${index}`} className="flex items-center gap-2">
                          {chat ? (
                            <>
                              <div 
                                className="flex-1 bg-blue-50/80 hover:bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 overflow-hidden cursor-help transition-colors"
                                title={chat.fullText}
                              >
                                <div className="px-3 py-2 truncate">
                                  {chat.text}
                                </div>
                              </div>
                              <button 
                                onClick={() => handlePin(chat)}
                                className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                title="このメッセージをピン留めする"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="12" y1="17" x2="12" y2="22"/>
                                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                                </svg>
                              </button>
                            </>
                          ) : (
                            <div 
                              className="flex-1 bg-blue-50/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 opacity-50 overflow-hidden"
                            >
                              <div className="px-3 py-2 truncate">
                                &nbsp;
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3 border border-blue-900/20 rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">ピン留めメッセージ</h3>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => {
                      const pinned = pinnedMessages[index];
                      return (
                        <div key={pinned ? pinned.id : `empty-pinned-${index}`} className="flex items-center gap-2">
                          {pinned ? (
                            <>
                              <div 
                                className="flex-1 bg-blue-100/80 hover:bg-blue-200/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200 overflow-hidden cursor-help transition-colors"
                                title={pinned.fullText}
                              >
                                <div className="px-3 py-2 truncate">
                                  {pinned.text}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleUnpin(pinned)}
                                className="text-red-600 hover:text-red-800 flex-shrink-0"
                                title="ピン留めを解除"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18"/>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                              </button>
                            </>
                          ) : (
                            <div 
                              className="flex-1 bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200 opacity-50 overflow-hidden"
                            >
                              <div className="px-3 py-2 truncate">
                                &nbsp;
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-24 w-[17rem] h-[17rem] -mb-32">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/character-6ovD0VT18sKKqEYONeI08uvB1Oq3AH.png"
                alt="AI Assistant Character"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="relative">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  )
}

