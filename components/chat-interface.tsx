'use client'

import { useState, useRef, useEffect } from 'react'
import { generateUniqueId } from '@/lib/utils'
import { Send, Mic } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { generateChatResponse as generateGroqResponse, ChatMessage } from '@/lib/deepseek_generate'
import { generateChatResponse as generateDeepseekResponse } from '@/lib/deepseek'

type MessageSender = 'user' | 'bot'

interface Message {
  id: string
  content: string
  sender: MessageSender
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-message',
      content: "AutoCADで実行したい動作を入力してください！",
      sender: 'bot'
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCode, setShowCode] = useState(true)
  const [showChat, setShowChat] = useState(true)
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // input値が変更されたときに入力欄を更新
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = input;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(input.length, input.length);
    }
  }, [input]);

  useEffect(() => {
    const handleCustomMessage = (event: CustomEvent) => {
      setMessages([{
        id: generateUniqueId(),
        content: "AutoCADで実行したい動作を入力してください！",
        sender: 'bot'
      }]);
    };

    const handleUpdateInput = (event: CustomEvent<{ value: string }>) => {
      const newValue = event.detail.value;
      setInput(newValue);
    };

    window.addEventListener('clearChat' as any, handleCustomMessage);
    window.addEventListener('updateInput' as any, handleUpdateInput);
    
    return () => {
      window.removeEventListener('clearChat' as any, handleCustomMessage);
      window.removeEventListener('updateInput' as any, handleUpdateInput);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // チャット履歴に追加するイベントを発火
    const newChatEvent = new CustomEvent('newChat', {
      detail: { message: input.trim() }
    });
    window.dispatchEvent(newChatEvent);

    const userMessage: Message = {
      id: generateUniqueId(),
      content: input,
      sender: 'user'
    }

    setMessages(messages => [...messages, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // 新しいメッセージのみを送信
      const chatMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `AutoLISPコードを生成する際のアシスタントとして、以下のルールを守りながら、特定のタスクに対して必要なAutoLISPコードを提供します。出力されるコードはAutoLISPとして有効で、説明文や追加のコメントなしで提供します。

- コードは1つのAutoLISPコードとして純粋に出力します。他の代替案や選択肢は提示しません。
- コードブロックやマークダウン形式は使用しません。
- 生成されるAutoLISPコードは、次のルールに従います。

# Steps
1. 現在のosmodeの状態を取得し、変数に保存します。
2. AutoLISPコマンドを実行する直前にosmodeを0に設定します。
3. コマンド実行後、またはユーザーインタラクションの後、保存した状態にosmodeを戻します。
4. 必要に応じて、図面操作を行います。

# Output Format
- 純粋なAutoLISPコードを1つ出力します。
- タスクに応じて、このパターンを使用して適切なコードを書くこと。`
        },
        { role: 'user', content: input }
      ]

      const codeResponse = await generateGroqResponse(chatMessages)
       
      if (codeResponse) {
        if (showCode) {
          // Groqレスポンス完了時にイベントを発火
          const groqEvent = new CustomEvent('groqResponse');
          window.dispatchEvent(groqEvent);
          
          setMessages(messages => [...messages, {
            id: generateUniqueId(),
            content: codeResponse,
            sender: 'bot' as const
          }])
        }

        if (showChat) {
          const explanationMessages: ChatMessage[] = [
            {
              role: 'system',
              content: `あなたはとても明るいコード実行アシスタントです。
以下のルールに従って、AutoLISPコードの説明を簡潔に行ってください：

1. 読みやすく改行を入れてください。
2. 図形の基本的な説明を行います。
3. サイズや座標などの具体的な情報を含めます。
4. 最後は必ず「このコードを実行しました！」で締めくくってください。

注意点：
- ほどよく！を使って明るい文章にしてください
- コードの説明以外の感想は不要です
- 技術的な解説や設定への言及は避けてください
- 「このAutoLISPコードを実行すると、」などの前置きは使わないでください
- OSNAPなどの設定変更にはふれず、コマンドの動作中心に説明してください
- 例えなどはいりません。 `

            },
            { 
              role: 'user', 
              content: codeResponse 
            }
          ]
          
          const explanationResponse = await generateDeepseekResponse(explanationMessages)
          
          if (explanationResponse) {
            // Deepseekレスポンス時にイベントを発火
            const deepseekEvent = new CustomEvent('deepseekResponse');
            window.dispatchEvent(deepseekEvent);
            
            setMessages(messages => [...messages, {
              id: generateUniqueId(),
              content: explanationResponse,
              sender: 'bot' as const
            }])
          }
        } else {
          // チャット応答がオフの場合、応答完了イベントを発火
          const responseCompleteEvent = new CustomEvent('responseComplete');
          window.dispatchEvent(responseCompleteEvent);
        }
      } else {
        setMessages(messages => [...messages, {
          id: generateUniqueId(),
          content: "申し訳ありません。コードの生成中にエラーが発生しました。",
          sender: 'bot' as const
        }])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(messages => [...messages, {
        id: generateUniqueId(),
        content: "申し訳ありません。エラーが発生しました。",
        sender: 'bot' as const
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleShortcutClick = (text: string) => {
    const buttonText = text
    setInput(current => current + (current.length > 0 ? ' ' : '') + buttonText)
    setTimeout(() => {
      inputRef.current?.focus()
      const length = inputRef.current?.value.length || 0
      inputRef.current?.setSelectionRange(length, length)
    }, 0)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleAlwaysOnTop = async (checked: boolean) => {
    try {
      if (window.electron) {
        const result = await window.electron.setAlwaysOnTop(checked);
        if (result.success) {
          setIsAlwaysOnTop(checked);
        } else {
          console.error('前面固定の設定に失敗しました:', result.error);
          setIsAlwaysOnTop(false);
        }
      }
    } catch (e) {
      console.error('前面固定の設定中にエラーが発生しました:', e);
      setIsAlwaysOnTop(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center space-x-2">
            <div
              className="flex items-center space-x-2"
              onMouseEnter={() => {
                const event = new CustomEvent('shortcutHover', {
                  detail: { message: 'ウィンドウを常に最前面に表示します' }
                });
                window.dispatchEvent(event);
              }}
              onMouseLeave={() => {
                window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
              }}
            >
              <Checkbox 
                id="check1" 
                checked={isAlwaysOnTop}
                className="text-rose-700 border-rose-700 data-[state=checked]:bg-rose-700"
                onCheckedChange={handleAlwaysOnTop}
              />
              <Label htmlFor="check1" className="text-sm text-black font-medium">前面固定</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="flex items-center space-x-2"
              onMouseEnter={() => {
                const event = new CustomEvent('shortcutHover', {
                  detail: { message: 'AutoLISPコードの表示/非表示を切り替えます' }
                });
                window.dispatchEvent(event);
              }}
              onMouseLeave={() => {
                window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
              }}
            >
              <Checkbox 
                id="check2" 
                checked={showCode}
                onCheckedChange={(checked) => setShowCode(checked as boolean)}
                className="text-rose-700 border-rose-700 data-[state=checked]:bg-rose-700"
              />
              <Label htmlFor="check2" className="text-sm text-black font-medium">コード表示</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="flex items-center space-x-2"
              onMouseEnter={() => {
                const event = new CustomEvent('shortcutHover', {
                  detail: { message: 'アシスタントの応答メッセージの表示/非表示を切り替えます' }
                });
                window.dispatchEvent(event);
              }}
              onMouseLeave={() => {
                window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
              }}
            >
              <Checkbox 
                id="check3"
                checked={showChat}
                onCheckedChange={(checked) => setShowChat(checked as boolean)}
                className="text-rose-700 border-rose-700 data-[state=checked]:bg-rose-700"
              />
              <Label htmlFor="check3" className="text-sm text-black font-medium">チャット応答</Label>
            </div>
          </div>
        </div>
      </div>
      <Card className="w-full bg-white/20 backdrop-blur-sm shadow-lg border-2 border-black rounded-3xl overflow-hidden">
        <div className="h-[380px] p-4 overflow-y-auto bg-white">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {message.sender === 'bot' && (
                  message.content.includes('！') || (!message.content.includes('(')) ? (
                    <div className="w-12 h-12 flex-shrink-0">
                      <img
                        src="/images/character/character.png"
                        alt="AI Assistant"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0" />
                  )
                )}
                <div
                  className={`rounded-3xl px-4 py-2 max-w-[80%] whitespace-pre-wrap ${
                    message.sender === 'user'
                      ? 'bg-blue-600/80 backdrop-blur-sm text-white'
                      : message.content.includes('(') && !message.content.includes('！')
                        ? 'bg-gray-100 text-[#000080] font-mono text-sm p-4 shadow-lg border border-gray-200'
                        : 'bg-blue-50 text-black'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-white/20 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力..."
              className="bg-blue-50 border-white/20 placeholder:text-gray-600 pl-4"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-blue-400/80 hover:bg-blue-500/80 backdrop-blur-sm"
              disabled={isLoading}
              onMouseEnter={() => {
                const event = new CustomEvent('shortcutHover', {
                  detail: { message: 'メッセージを送信します' }
                });
                window.dispatchEvent(event);
              }}
              onMouseLeave={() => {
                window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
              }}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">送信</span>
            </Button>
            <Button 
              type="button" 
              size="icon" 
              className="bg-blue-400/80 hover:bg-blue-500/80 backdrop-blur-sm"
              onClick={() => {
                setInput("")
                inputRef.current?.focus()
              }}
              disabled={isLoading}
              onMouseEnter={() => {
                const event = new CustomEvent('shortcutHover', {
                  detail: { message: '入力内容をクリアします' }
                });
                window.dispatchEvent(event);
              }}
              onMouseLeave={() => {
                window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
              <span className="sr-only">クリア</span>
            </Button>
            <Button 
              type="button" 
              size="icon" 
              className="bg-blue-400/80 hover:bg-blue-500/80 backdrop-blur-sm"
              onClick={() => {
                alert('音声入力機能は現在開発中です。')
              }}
              disabled={isLoading}
              onMouseEnter={() => {
                const event = new CustomEvent('shortcutHover', {
                  detail: { message: '音声入力モードに切り替えます（開発中）' }
                });
                window.dispatchEvent(event);
              }}
              onMouseLeave={() => {
                window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
              }}
            >
              <Mic className="h-4 w-4" />
              <span className="sr-only">音声入力</span>
            </Button>
          </form>
          <div className="mt-4 bg-blue-50 p-3 rounded-xl space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("ユーザー選択")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「ユーザー選択」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
               ユーザー選択 
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("原点(0,0)")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「原点(0,0)」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
               原点(0,0)
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("四角形")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「四角形」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
               四角形 
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("円")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「円」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
                円
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("選択し")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「選択し」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
              選択し 
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("描いて")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「描いて」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
               描いて 
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("画層")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「画層」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
               画層 
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("寸法")}
                onMouseEnter={() => {
                  const event = new CustomEvent('shortcutHover', {
                    detail: { message: 'メッセージボックスに「寸法」を入力します' }
                  });
                  window.dispatchEvent(event);
                }}
                onMouseLeave={() => {
                  window.dispatchEvent(new CustomEvent('shortcutHoverEnd'));
                }}
                disabled={isLoading}
              >
              寸法 
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChatInterface