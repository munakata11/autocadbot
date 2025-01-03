'use client'

import { useState } from 'react'
import { Send, Mic } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { generateChatResponse, ChatMessage } from '@/lib/groq'

type MessageSender = 'user' | 'bot'

interface Message {
  id: number
  content: string
  sender: MessageSender
}

const SYSTEM_PROMPT = `あなたはAutoCADのエキスパートアシスタントです。
AutoCADの使用方法、図面作成のテクニック、トラブルシューティングなどについて、
わかりやすく丁寧に説明することができます。
専門用語を使用する際は、初心者にもわかるように補足説明を加えてください。`

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "こんにちは！AutoCADについて、ご質問がございましたらお気軽にどうぞ。",
      sender: 'bot'
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      content: input,
      sender: 'user'
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        } as ChatMessage)),
        { role: 'user', content: input }
      ]

      const response = await generateChatResponse(chatMessages)

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: response || "申し訳ありません。エラーが発生しました。",
        sender: 'bot'
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: "申し訳ありません。エラーが発生しました。",
        sender: 'bot'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleShortcutClick = (text: string) => {
    setInput(text)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center space-x-2">
            <Checkbox id="check1" />
            <Label htmlFor="check1" className="text-sm text-blue-900 font-medium">前面固定</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="check2" />
            <Label htmlFor="check2" className="text-sm text-blue-900 font-medium">コード表示</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="check3" />
            <Label htmlFor="check3" className="text-sm text-blue-900 font-medium">チャット応答</Label>
          </div>
        </div>
      </div>
      <Card className="w-full bg-white/20 backdrop-blur-sm shadow-lg border-0">
        <div className="h-[380px] p-4 overflow-y-auto bg-white">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 flex-shrink-0">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/character-6ovD0VT18sKKqEYONeI08uvB1Oq3AH.png"
                      alt="AI Assistant"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-blue-400/80 backdrop-blur-sm text-white'
                      : 'bg-blue-50 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-white/20 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力..."
              className="bg-blue-50 border-white/20 placeholder:text-gray-600"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-blue-400/80 hover:bg-blue-500/80 backdrop-blur-sm"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">送信</span>
            </Button>
            <Button 
              type="button" 
              size="icon" 
              className="bg-blue-400/80 hover:bg-blue-500/80 backdrop-blur-sm"
              onClick={() => {
                alert('音声入力機能は現在開発中です。')
              }}
              disabled={isLoading}
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
                onClick={() => handleShortcutClick("基本的な使い方を教えて")}
                disabled={isLoading}
              >
                使い方
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("図面の作成方法を教えて")}
                disabled={isLoading}
              >
                図面作成
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("寸法の入力方法は？")}
                disabled={isLoading}
              >
                寸法入力
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("レイヤーの使い方は？")}
                disabled={isLoading}
              >
                レイヤー
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("印刷の設定方法は？")}
                disabled={isLoading}
              >
                印刷設定
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("ブロックの作成方法は？")}
                disabled={isLoading}
              >
                ブロック
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("外部参照の使い方は？")}
                disabled={isLoading}
              >
                外部参照
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-full text-sm"
                onClick={() => handleShortcutClick("トラブルシューティング")}
                disabled={isLoading}
              >
                対処方法
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChatInterface
