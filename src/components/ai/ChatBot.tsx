'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createBrowserClient } from '@supabase/ssr'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'こんにちは！原価管理システムのAIアシスタントです。システムの操作方法について何でもお聞きください。',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // チャットボットを開いた時にフォーカス
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // 認証状態を確認（クライアントサイド）
  const checkClientAuthStatus = async () => {
    try {
      console.log('🔍 ChatBot: クライアント認証状態確認開始')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ ChatBot: クライアント認証エラー:', error)
        return false
      }
      
      console.log('✅ ChatBot: クライアント認証状態:', user ? { id: user.id, email: user.email } : null)
      return !!user
    } catch (error) {
      console.error('❌ ChatBot: クライアント認証状態確認エラー:', error)
      return false
    }
  }

  // 認証状態を確認（サーバーサイド）
  const checkServerAuthStatus = async () => {
    try {
      console.log('🔍 ChatBot: サーバー認証状態確認開始')
      const response = await fetch('/api/debug-auth', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ ChatBot: サーバー認証状態:', data)
        return data.success && data.user
      } else {
        console.error('❌ ChatBot: サーバー認証状態確認失敗:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ ChatBot: サーバー認証状態確認エラー:', error)
      return false
    }
  }

  // OpenAI APIを呼び出し
  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true)
      console.log('🔍 ChatBot: メッセージ送信開始:', content)
      
      // 認証状態を確認（クライアントサイド）
      const clientAuth = await checkClientAuthStatus()
      console.log('🔍 ChatBot: クライアント認証結果:', clientAuth)
      
      // 認証状態を確認（サーバーサイド）
      const serverAuth = await checkServerAuthStatus()
      console.log('🔍 ChatBot: サーバー認証結果:', serverAuth)
      
      if (!clientAuth || !serverAuth) {
        throw new Error('認証が必要です。ログインし直してください。')
      }
      
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
        credentials: 'include'
      })

      console.log('📡 ChatBot: APIレスポンス:', response.status, response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ ChatBot: APIエラー:', response.status, errorData)
        throw new Error(errorData.error || `API request failed (${response.status})`)
      }

      const data = await response.json()
      console.log('✅ ChatBot: APIレスポンス取得成功')
      
      const newMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, newMessage])
    } catch (error) {
      console.error('❌ ChatBot: チャットエラー:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `申し訳ございません。エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}。しばらく待ってから再度お試しください。`,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    await sendMessage(inputValue)
  }

  return (
    <>
      {/* フローティングボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-40 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="AIアシスタントを開く"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* チャットウィンドウ */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-medium">AIアシスタント</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm">
                    {message.role === 'assistant' ? (
                      <div className="markdown-content">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">回答を生成中...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="原価管理システムについて質問してください..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
