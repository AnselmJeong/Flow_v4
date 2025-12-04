import { useState, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PDFViewer } from '../components/reader/PDFViewer'
import { EPUBViewer } from '../components/reader/EPUBViewer'
import { SelectionBubble } from '../components/ui/SelectionBubble'
import { ChatPanel } from '../components/chat/ChatPanel'
import type { Book, ChatSession } from '@shared/types'

interface ReaderViewProps {
  book: Book
  onBack: () => void
}

export function ReaderView({ book, onBack }: ReaderViewProps) {
  const [currentPage, setCurrentPage] = useState(book.lastPage || 1)
  const [totalPages, setTotalPages] = useState(book.totalPages || 0)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [selectedText, setSelectedText] = useState<{ text: string; position: { x: number; y: number } } | null>(null)

  const handlePageChange = useCallback((page: number, total: number) => {
    setCurrentPage(page)
    setTotalPages(total)
    // Save progress to DB
    window.api.updateBookProgress(book.id, page)
  }, [book.id])

  const handleTextSelect = useCallback((text: string, position: { x: number; y: number }) => {
    setSelectedText({ text, position })
  }, [])

  const handleSummarize = useCallback(async (text: string) => {
    const session = await window.api.createChatSession(book.id, text)
    setChatInput('이 텍스트를 요약해주세요.')
    setSelectedText(null)
    setSelectedSession(session)
  }, [book.id])

  const handleTranslate = useCallback(async (text: string) => {
    const session = await window.api.createChatSession(book.id, text)
    setChatInput('이 텍스트를 한국어로 번역해주세요.')
    setSelectedText(null)
    setSelectedSession(session)
  }, [book.id])

  const handleAsk = useCallback(async (text: string) => {
    const session = await window.api.createChatSession(book.id, text)
    setSelectedText(null)
    setSelectedSession(session)
  }, [book.id])

  const handleCloseSelection = useCallback(() => {
    setSelectedText(null)
  }, [])

  const handleSessionSelect = useCallback((session: ChatSession) => {
    setSelectedSession(session)
  }, [])

  const handleClearInitialMessage = useCallback(() => {
    setChatInput('')
  }, [])

  return (
    <div className="reader-view">
      {/* Reader Area */}
      <div className="reader-area">
        <header className="reader-header">
          <div className="reader-tabs">
            <div className="reader-tab active">
              <span className="tab-icon">📄</span>
              <span className="tab-title">{book.title}</span>
              <button className="tab-close" onClick={onBack}>
                <XMarkIcon className="close-icon" />
              </button>
            </div>
          </div>
          <div className="reader-page-info">
            {currentPage} / {totalPages || '?'}
          </div>
        </header>

        <div className="reader-content">
          {book.fileType === 'pdf' ? (
            <PDFViewer
              filePath={book.filePath}
              initialPage={currentPage}
              onPageChange={handlePageChange}
              onTextSelect={handleTextSelect}
              twoPageView={true}
            />
          ) : book.fileType === 'epub' ? (
            <EPUBViewer
              filePath={book.filePath}
              onLocationChange={(_, page, total) => handlePageChange(page, total)}
              onTextSelect={handleTextSelect}
            />
          ) : (
            <div className="reader-placeholder">
              <p>Unsupported file type: {book.fileType}</p>
            </div>
          )}

          {/* Floating selection bubble */}
          {selectedText && (
            <SelectionBubble
              text={selectedText.text}
              position={selectedText.position}
              onSummarize={handleSummarize}
              onTranslate={handleTranslate}
              onAsk={handleAsk}
              onClose={handleCloseSelection}
            />
          )}
        </div>

        <footer className="reader-footer">
          <span className="footer-file">{book.filePath.split('/').pop()}</span>
          <span className="footer-progress">
            {totalPages ? `${Math.round((currentPage / totalPages) * 100)}%` : '-'}
          </span>
        </footer>
      </div>

      {/* Chat Panel */}
      <ChatPanel
        bookId={book.id}
        selectedSession={selectedSession}
        onSessionSelect={handleSessionSelect}
        initialMessage={chatInput}
        onClearInitialMessage={handleClearInitialMessage}
      />

      <style>{`
        .reader-view {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .reader-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--color-bg-primary);
          overflow: hidden;
        }
        
        .reader-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background-color: var(--color-bg-secondary);
          flex-shrink: 0;
        }
        
        .reader-tabs {
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .reader-tab {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          background-color: var(--color-bg-primary);
          border-radius: 6px;
          font-size: 13px;
        }
        
        .tab-icon {
          font-size: 14px;
        }
        
        .tab-title {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tab-close {
          padding: 2px;
          border-radius: 4px;
          color: var(--color-text-muted);
        }
        
        .tab-close:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }
        
        .close-icon {
          width: 14px;
          height: 14px;
        }
        
        .reader-page-info {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        
        .reader-content {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
        
        .reader-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
        }
        
        .reader-footer {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-sm) var(--spacing-md);
          border-top: 1px solid var(--color-border);
          font-size: 12px;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
