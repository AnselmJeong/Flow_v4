import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PDFViewer, EPUBViewer } from '../components/reader'
import type { PDFViewerRef, EPUBViewerRef } from '../components/reader'
import { SelectionBubble } from '../components/ui/SelectionBubble'
import { ResizableSplitter } from '../components/ui/ResizableSplitter'
import { ChatPanel } from '../components/chat/ChatPanel'
import type { Book, ChatSession, TocItem, ReaderSettings, SearchResult } from '@shared/types'

interface ReaderViewProps {
  book: Book
  onBack: () => void
  onTocLoad?: (toc: TocItem[]) => void
  settings?: ReaderSettings
}

export interface ReaderViewRef {
  navigateToTocItem: (item: TocItem) => void
  navigateToSearchResult: (result: SearchResult) => void
  search: (query: string) => Promise<SearchResult[]>
}

export const ReaderView = forwardRef<ReaderViewRef, ReaderViewProps>(function ReaderView({ 
  book, 
  onBack,
  onTocLoad,
  settings
}, ref) {
  const pdfViewerRef = useRef<PDFViewerRef>(null)
  const epubViewerRef = useRef<EPUBViewerRef>(null)
  
  const [currentPage, setCurrentPage] = useState(book.lastPage || 1)
  const [totalPages, setTotalPages] = useState(book.totalPages || 0)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [selectedText, setSelectedText] = useState<{ text: string; position: { x: number; y: number } } | null>(null)

  // Navigate to TOC item
  const navigateToTocItem = useCallback((item: TocItem) => {
    if (book.fileType === 'pdf' && item.pageNumber) {
      pdfViewerRef.current?.goToPage(item.pageNumber)
    } else if (book.fileType === 'epub' && item.href) {
      epubViewerRef.current?.goToLocation(item.href)
    }
  }, [book.fileType])

  // Navigate to search result
  const navigateToSearchResult = useCallback((result: SearchResult) => {
    if (book.fileType === 'pdf' && result.pageNumber) {
      pdfViewerRef.current?.goToPage(result.pageNumber)
    } else if (book.fileType === 'epub' && result.cfi) {
      epubViewerRef.current?.goToLocation(result.cfi)
    }
  }, [book.fileType])

  // Search function
  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (book.fileType === 'pdf') {
      return pdfViewerRef.current?.search(query) || []
    } else if (book.fileType === 'epub') {
      return epubViewerRef.current?.search(query) || []
    }
    return []
  }, [book.fileType])

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    navigateToTocItem,
    navigateToSearchResult,
    search
  }), [navigateToTocItem, navigateToSearchResult, search])

  const handlePageChange = useCallback((page: number, total: number) => {
    setCurrentPage(page)
    setTotalPages(total)
    // Save progress to DB
    window.api.updateBookProgress(book.id, page)
  }, [book.id])

  const handleTextSelect = useCallback((text: string, position: { x: number; y: number }) => {
    setSelectedText({ text, position })
  }, [])

  const handleTocLoad = useCallback((toc: TocItem[]) => {
    onTocLoad?.(toc)
  }, [onTocLoad])

  const handleSummarize = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) return
    const session = await window.api.createChatSession(book.id, text)
    setChatInput('선택된 텍스트를 핵심을 알기 쉽게 요약해주세요.')
    setSelectedText(null)
    setSelectedSession(session)
  }, [book.id])

  const handleTranslate = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) return
    const session = await window.api.createChatSession(book.id, text)
    setChatInput('선택된 텍스트를 한국어로 번역해주세요.')
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
      <ResizableSplitter
        left={
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
                  ref={pdfViewerRef}
                  filePath={book.filePath}
                  initialPage={currentPage}
                  onPageChange={handlePageChange}
                  onTextSelect={handleTextSelect}
                  onTocLoad={handleTocLoad}
                  settings={settings}
                />
              ) : book.fileType === 'epub' ? (
                <EPUBViewer
                  ref={epubViewerRef}
                  filePath={book.filePath}
                  onLocationChange={(_, page, total) => handlePageChange(page, total)}
                  onTextSelect={handleTextSelect}
                  onTocLoad={handleTocLoad}
                  settings={settings}
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
        }
        right={
          <ChatPanel
            bookId={book.id}
            selectedSession={selectedSession}
            onSessionSelect={handleSessionSelect}
            initialMessage={chatInput}
            onClearInitialMessage={handleClearInitialMessage}
          />
        }
        initialLeftWidth={70}
        minLeftWidth={30}
        maxLeftWidth={90}
        minRightWidth={20}
        maxRightWidth={70}
        direction="horizontal"
      />

      <style>{`
        .reader-view {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .reader-area {
          width: 100%;
          height: 100%;
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
})
