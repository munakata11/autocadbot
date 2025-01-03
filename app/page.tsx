import ChatInterface from '@/components/chat-interface'

export default function Home() {
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
                    <div 
                      className="bg-blue-50/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900"
                      title="図面の寸法入力について質問しました。寸法スタイルの設定方法や、関連寸法の作成方法などについて詳しく確認しました。"
                    >
                      <div className="px-2 py-2 truncate">
                        図面の寸法入力について質問しました...
                      </div>
                    </div>
                    <div 
                      className="bg-blue-50/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900"
                      title="ブロックの作成方法を確認しました。属性の設定や動的ブロックの作成手順について学びました。"
                    >
                      <div className="px-2 py-2 truncate">
                        ブロックの作成方法を確認しました...
                      </div>
                    </div>
                    <div 
                      className="bg-blue-50/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900"
                      title="印刷設定の手順を確認しました。用紙サイズやスケール、線の太さなどの設定方法を確認しました。"
                    >
                      <div className="px-2 py-2 truncate">
                        印刷設定の手順を確認しました...
                      </div>
                    </div>
                    <div 
                      className="bg-blue-50/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 opacity-50"
                    >
                      <div className="px-2 py-2 truncate">
                        &nbsp;
                      </div>
                    </div>
                    <div 
                      className="bg-blue-50/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 opacity-50"
                    >
                      <div className="px-2 py-2 truncate">
                        &nbsp;
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 border border-blue-900/20 rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">ピン留めメッセージ</h3>
                  <div className="space-y-2">
                    <div 
                      className="bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200"
                      title="よく使うショートカットキー一覧：移動(M)、コピー(CO)、トリム(TR)、延長(EX)、オフセット(O)など、作図効率を上げる重要なコマンド"
                    >
                      <div className="px-2 py-2 truncate">
                        よく使うショートカットキー一覧...
                      </div>
                    </div>
                    <div 
                      className="bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200"
                      title="図面テンプレートの保存場所：C:\Users\[ユーザー名]\AppData\Local\Autodesk\AutoCAD 2024\R24.0\[言語]\Template"
                    >
                      <div className="px-2 py-2 truncate">
                        図面テンプレートの保存場所...
                      </div>
                    </div>
                    <div 
                      className="bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200"
                      title="プリンター設定の初期値：用紙サイズ(A3)、尺度(1:50)、線の太さ(0.5mm)、モノクロ印刷設定"
                    >
                      <div className="px-2 py-2 truncate">
                        プリンター設定の初期値...
                      </div>
                    </div>
                    <div 
                      className="bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200 opacity-50"
                    >
                      <div className="px-2 py-2 truncate">
                        &nbsp;
                      </div>
                    </div>
                    <div 
                      className="bg-blue-100/80 backdrop-blur-sm rounded-lg h-[34px] text-sm text-blue-900 border border-blue-200 opacity-50"
                    >
                      <div className="px-2 py-2 truncate">
                        &nbsp;
                      </div>
                    </div>
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

