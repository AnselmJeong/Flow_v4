import { useState, useEffect, useCallback, useRef } from 'react'
import { PaperAirplaneIcon, Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { ChatSession, ChatMessage } from '@shared/types'

interface ChatPanelProps {
  bookId: string
  selectedSession: ChatSession | null
  onSessionSelect: (session: ChatSession) => void
  onNewSession?: () => void
  initialMessage?: string
  onClearInitialMessage?: () => void
}

export function ChatPanel({
  bookId,
  selectedSession,
  onSessionSelect,
  onNewSession,
  initialMessage,
  onClearInitialMessage
}: ChatPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const loadedSessions = await window.api.getChatSessions(bookId)
      setSessions(loadedSessions)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    }
  }, [bookId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Load messages when session changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedSession) {
        setMessages([])
        return
      }

      try {
        const loadedMessages = await window.api.getChatMessages(selectedSession.id)
        setMessages(loadedMessages)
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }

    loadMessages()
  }, [selectedSession])

  // Handle initial message
  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage)
      onClearInitialMessage?.()
    }
  }, [initialMessage, onClearInitialMessage])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedSession) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    try {
      // Add user message
      const newUserMessage = await window.api.addChatMessage(
        selectedSession.id,
        'user',
        userMessage
      )
      setMessages(prev => [...prev, newUserMessage])

      // Call Gemini API
      const result = await window.api.callGemini(selectedSession.id, userMessage)
      
      if (result.success && result.response) {
        // Add assistant response
        const assistantMessage = await window.api.addChatMessage(
          selectedSession.id,
          'assistant',
          result.response
        )
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Add error message
        const errorMessage = await window.api.addChatMessage(
          selectedSession.id,
          'assistant',
          `오류: ${result.error || '응답을 받지 못했습니다.'}`
        )
        setMessages(prev => [...prev, errorMessage])
      }

      // Reload sessions to update order
      loadSessions()
    } catch (err) {
      console.error('Failed to send message:', err)
      // Add error message
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류'
      await window.api.addChatMessage(
        selectedSession.id,
        'assistant',
        `오류: ${errorMsg}`
      )
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <aside className="chat-panel">
      <header className="chat-header">
        <h2 className="chat-title">AI에게 질문하세요</h2>
        <div className="chat-actions">
          <button className="chat-action-btn active" title="Chat">
            💬
          </button>
          <button className="chat-action-btn" title="Settings">
            <Cog6ToothIcon className="action-icon" />
          </button>
          <button 
            className="chat-action-btn" 
            title="New Chat"
            onClick={onNewSession}
          >
            <PlusIcon className="action-icon" />
          </button>
        </div>
      </header>

      {/* Session List */}
      <div className="chat-sessions">
        <h3 className="sessions-title">대화 기록</h3>
        {sessions.length === 0 ? (
          <p className="sessions-empty">텍스트를 선택하여 새 대화를 시작하세요</p>
        ) : (
          <ul className="session-list">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`session-item ${selectedSession?.id === session.id ? 'active' : ''}`}
                onClick={() => onSessionSelect(session)}
              >
                <div className="session-context">
                  "{truncateText(session.baseContext, 40)}"
                </div>
                <div className="session-meta">
                  <span className="session-label">근처 - AI 채팅</span>
                  <span className="session-date">{formatDate(session.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Messages */}
      {selectedSession ? (
        <div className="chat-messages">
          {/* Base Context */}
          <div className="base-context">
            <div className="context-label">선택된 텍스트</div>
            <div className="context-text">{selectedSession.baseContext}</div>
          </div>

          {/* Messages */}
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role}`}
              >
                <div className="message-content">{message.message}</div>
                <div className="message-time">{formatDate(message.createdAt)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : (
        <div className="chat-mascot">
          <div className="mascot-image">🤖</div>
          <h4 className="mascot-title">AI에게 질문하세요</h4>
          <p className="mascot-subtitle">무엇이든 질문해보세요!</p>
          <p className="mascot-hint">텍스트를 선택하면 AI와 대화할 수 있습니다</p>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <input
          type="text"
          placeholder="AI에게 질문하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          className="chat-input"
          disabled={!selectedSession || loading}
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!input.trim() || !selectedSession || loading}
        >
          {loading ? (
            <div className="loading-spinner-small" />
          ) : (
            <PaperAirplaneIcon className="send-icon" />
          )}
        </button>
      </div>

      <style>{`
        .chat-panel {
          width: var(--chat-panel-width);
          display: flex;
          flex-direction: column;
          background-color: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .chat-title {
          font-size: 16px;
          font-weight: 600;
        }

        .chat-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .chat-action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 16px;
          transition: all var(--transition-fast);
        }

        .chat-action-btn:hover {
          background-color: var(--color-bg-tertiary);
        }

        .chat-action-btn.active {
          background-color: var(--color-accent);
          color: white;
        }

        .action-icon {
          width: 18px;
          height: 18px;
        }

        .chat-sessions {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          max-height: 250px;
          overflow-y: auto;
          flex-shrink: 0;
        }

        .sessions-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .sessions-empty {
          font-size: 12px;
          color: var(--color-text-muted);
          text-align: center;
          padding: var(--spacing-md);
        }

        .session-list {
          list-style: none;
        }

        .session-item {
          padding: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .session-item:hover {
          background-color: var(--color-bg-tertiary);
        }

        .session-item.active {
          background-color: var(--color-accent-light);
        }

        .session-context {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }

        .session-meta {
          display: flex;
          gap: var(--spacing-sm);
          font-size: 11px;
        }

        .session-label {
          color: var(--color-accent);
        }

        .session-date {
          color: var(--color-text-muted);
        }

        .chat-messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .base-context {
          padding: var(--spacing-md);
          background-color: var(--color-bg-tertiary);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .context-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-muted);
          text-transform: uppercase;
          margin-bottom: var(--spacing-xs);
        }

        .context-text {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          max-height: 80px;
          overflow-y: auto;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .message {
          margin-bottom: var(--spacing-md);
          max-width: 90%;
        }

        .message.user {
          margin-left: auto;
        }

        .message.assistant {
          margin-right: auto;
        }

        .message-content {
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        .message.user .message-content {
          background-color: var(--color-accent);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.assistant .message-content {
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-bottom-left-radius: 4px;
        }

        .message-time {
          font-size: 10px;
          color: var(--color-text-muted);
          margin-top: 4px;
          text-align: right;
        }

        .message.assistant .message-time {
          text-align: left;
        }

        .chat-mascot {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          text-align: center;
        }

        .mascot-image {
          font-size: 64px;
          margin-bottom: var(--spacing-md);
        }

        .mascot-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .mascot-subtitle {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .mascot-hint {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .chat-input-area {
          display: flex;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .chat-input {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          font-size: 14px;
        }

        .chat-input:focus {
          border-color: var(--color-accent);
        }

        .chat-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .send-button {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-accent);
          color: white;
          border-radius: 50%;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          background-color: var(--color-accent-hover);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-icon {
          width: 18px;
          height: 18px;
        }

        .loading-spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  )
}

