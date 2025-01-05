"use client"

import ChatInterface from '@/components/chat-interface'
import { useState, useEffect, useRef } from 'react'

interface ChatItem {
  id: number;
  text: string;
  fullText: string;
}

export default function Home() {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);

  const [pinnedMessages, setPinnedMessages] = useState<ChatItem[]>([]);

  const [characterImage, setCharacterImage] = useState("/images/character/character.png");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isWaitingForDeepseek = useRef(false);

  useEffect(() => {
    const handleNewChat = (event: CustomEvent<{ message: string }>) => {
      const newChat: ChatItem = {
        id: Date.now(),
        text: event.detail.message,
        fullText: event.detail.message
      };

      setChatHistory(prevHistory => {
        const newHistory = [newChat, ...prevHistory].slice(0, 5);
        return newHistory;
      });
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      isWaitingForDeepseek.current = true;
      setCharacterImage("/images/character/character3.png");
    };

    const handleDeepseekResponse = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      isWaitingForDeepseek.current = false;
      setCharacterImage("/images/character/character2.png");
      timerRef.current = setTimeout(() => {
        setCharacterImage("/images/character/character.png");
        timerRef.current = null;
      }, 3000);
    };

    const handleResponseComplete = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      isWaitingForDeepseek.current = false;
      timerRef.current = setTimeout(() => {
        setCharacterImage("/images/character/character.png");
        timerRef.current = null;
      }, 3000);
    };

    window.addEventListener('newChat' as any, handleNewChat);
    window.addEventListener('deepseekResponse' as any, handleDeepseekResponse);
    window.addEventListener('responseComplete' as any, handleResponseComplete);
    
    return () => {
      window.removeEventListener('newChat' as any, handleNewChat);
      window.removeEventListener('deepseekResponse' as any, handleDeepseekResponse);
      window.removeEventListener('responseComplete' as any, handleResponseComplete);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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

  const handleMessageClick = (message: ChatItem) => {
    const updateEvent = new CustomEvent('updateInput', { 
      detail: { value: message.fullText }
    });
    window.dispatchEvent(updateEvent);
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        backgroundImage: 'url("/images/background/haikei1.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="relative min-h-[500px]">
            <div className="pt-0">
              <h1 className="text-4xl font-bold text-purple-800 mb-4 text-center">
                AutoCAD Assistant
              </h1>
              <div className="grid grid-cols-2 gap-4 mb-4 mt-4">
                <div className="space-y-3 border border-blue-900/20 rounded-2xl p-4 bg-purple-50/30 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-purple-800 mb-2">最近のチャット履歴</h3>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => {
                      const chat = chatHistory[index];
                      return (
                        <div key={chat ? chat.id : `empty-${index}`} className="flex items-center gap-2">
                          {chat ? (
                            <>
                              <div 
                                className="flex-1 bg-purple-50/80 hover:bg-purple-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-black overflow-hidden cursor-help transition-colors"
                                title={chat.fullText}
                                onClick={() => handleMessageClick(chat)}
                                style={{ cursor: 'pointer' }}
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
                              className="flex-1 bg-purple-50/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 opacity-50 overflow-hidden"
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
                <div className="space-y-3 border border-blue-900/20 rounded-2xl p-4 bg-purple-50/30 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-purple-800 mb-2">ピン留めメッセージ</h3>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => {
                      const pinned = pinnedMessages[index];
                      return (
                        <div key={pinned ? pinned.id : `empty-pinned-${index}`} className="flex items-center gap-2">
                          {pinned ? (
                            <>
                              <div 
                                className="flex-1 bg-purple-100/80 hover:bg-purple-200/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-black border border-purple-200 overflow-hidden cursor-help transition-colors"
                                title={pinned.fullText}
                                onClick={() => handleMessageClick(pinned)}
                                style={{ cursor: 'pointer' }}
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
                              className="flex-1 bg-purple-100/60 backdrop-blur-sm rounded-lg h-[34px] text-sm text-purple-900 border border-purple-200 opacity-50 overflow-hidden"
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
            <div className="absolute bottom-0 left-20 w-[17rem] h-[17rem] -mb-28">
              <img
                src={characterImage}
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

