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
  const [characterMessage, setCharacterMessage] = useState("AutoCADの操作をお手伝いします！");
  const [defaultMessage] = useState("AutoCADの操作をお手伝いします！");

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
      setCharacterMessage("コードを生成しています！");
    };

    const handleDeepseekResponse = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      isWaitingForDeepseek.current = false;
      setCharacterImage("/images/character/character2.png");
      setCharacterMessage("コードの説明をしますね！");
      timerRef.current = setTimeout(() => {
        setCharacterImage("/images/character/character.png");
        setCharacterMessage("AutoCADの操作をお手伝いします！");
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
        setCharacterMessage("AutoCADの操作をお手伝いします！");
        timerRef.current = null;
      }, 3000);
    };

    const handleHoverMessage = (event: CustomEvent<{ message: string }>) => {
      setCharacterMessage(event.detail.message);
    };

    const handleHoverEnd = () => {
      if (!isWaitingForDeepseek.current) {
        setCharacterMessage(defaultMessage);
      }
    };

    window.addEventListener('newChat' as any, handleNewChat);
    window.addEventListener('deepseekResponse' as any, handleDeepseekResponse);
    window.addEventListener('responseComplete' as any, handleResponseComplete);
    window.addEventListener('shortcutHover' as any, handleHoverMessage);
    window.addEventListener('shortcutHoverEnd' as any, handleHoverEnd);
    
    return () => {
      window.removeEventListener('newChat' as any, handleNewChat);
      window.removeEventListener('deepseekResponse' as any, handleDeepseekResponse);
      window.removeEventListener('responseComplete' as any, handleResponseComplete);
      window.removeEventListener('shortcutHover' as any, handleHoverMessage);
      window.removeEventListener('shortcutHoverEnd' as any, handleHoverEnd);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [defaultMessage]);

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
              <h1 className="text-4xl font-bold text-blue-400 mb-4 text-center [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                <span className="text-red-500">A</span>utoCAD Assistant
              </h1>
              <div className="grid grid-cols-2 gap-4 mb-4 mt-6">
                <div className="space-y-3 border-2 border-black rounded-2xl p-4 bg-blue-50/30 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <span>最近のチャット履歴</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </h3>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => {
                      const chat = chatHistory[index];
                      return (
                        <div key={chat ? chat.id : `empty-${index}`} className="flex items-center gap-2">
                          {chat ? (
                            <>
                              <div 
                                className="flex-1 bg-blue-50/80 hover:bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-black overflow-hidden cursor-help transition-colors"
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
                                title="このメッセージをブックマークする"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
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
                <div className="space-y-3 border-2 border-black rounded-2xl p-4 bg-blue-50/30 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <span>ブックマーク</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </h3>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => {
                      const pinned = pinnedMessages[index];
                      return (
                        <div key={pinned ? pinned.id : `empty-pinned-${index}`} className="flex items-center gap-2">
                          {pinned ? (
                            <>
                              <div 
                                className="flex-1 bg-blue-100/80 hover:bg-blue-200/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-black border border-blue-200 overflow-hidden cursor-help transition-colors"
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
                                className="text-rose-500 hover:text-rose-700 flex-shrink-0"
                                title="ブックマークを解除"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6L6 18"></path>
                                  <path d="M6 6l12 12"></path>
                                </svg>
                              </button>
                            </>
                          ) : (
                            <div 
                              className="flex-1 bg-blue-100/60 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200 opacity-50 overflow-hidden"
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
            <div className="absolute bottom-0 -left-6 flex items-end">
              <div className="w-[17rem] h-[17rem] -mb-[7.875rem]">
                <img
                  src={characterImage}
                  alt="AI Assistant Character"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="relative mb-10 -ml-10 mr-4">
                <div className="bg-white rounded-2xl p-3 shadow-lg border-2 border-black w-[200px]">
                  <div className="absolute left-0 bottom-4 transform -translate-x-2 rotate-45 w-4 h-4 bg-white border-l-2 border-b-2 border-black"></div>
                  <p className="text-blue-800 text-sm break-words">{characterMessage}</p>
                </div>
              </div>
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

