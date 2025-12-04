import { useEffect, useRef, useState, useCallback } from 'react'
import ePub, { Book, Rendition, Contents } from 'epubjs'

interface EPUBViewerProps {
  filePath: string
  initialLocation?: string
  onLocationChange?: (location: string, page: number, totalPages: number) => void
  onTextSelect?: (text: string, position: { x: number; y: number }) => void
  onTocLoad?: (toc: TocItem[]) => void
}

export interface TocItem {
  id: string
  href: string
  label: string
  subitems?: TocItem[]
}

export function EPUBViewer({
  filePath,
  initialLocation,
  onLocationChange,
  onTextSelect,
  onTocLoad
}: EPUBViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<string>('')

  // Initialize EPUB
  useEffect(() => {
    if (!viewerRef.current) return

    const initBook = async () => {
      try {
        setLoading(true)
        setError(null)

        // Clean up previous book
        if (bookRef.current) {
          bookRef.current.destroy()
        }

        // Create new book - use custom protocol for local file access
        const book = ePub(`local-file://${encodeURIComponent(filePath)}`)
        bookRef.current = book

        // Wait for book to be ready
        await book.ready

        // Get TOC
        const toc = book.navigation.toc
        const tocItems: TocItem[] = toc.map((item) => ({
          id: item.id,
          href: item.href,
          label: item.label,
          subitems: item.subitems?.map((sub) => ({
            id: sub.id,
            href: sub.href,
            label: sub.label
          }))
        }))
        onTocLoad?.(tocItems)

        // Create rendition with two-page spread
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'always',
          flow: 'paginated'
        })
        renditionRef.current = rendition

        // Set up themes
        rendition.themes.default({
          'body': {
            'font-family': "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
            'font-size': '16px',
            'line-height': '1.6',
            'color': '#333'
          },
          'p': {
            'margin-bottom': '1em'
          }
        })

        // Handle location changes
        rendition.on('relocated', (location: { start: { cfi: string; displayed: { page: number; total: number } } }) => {
          const { cfi, displayed } = location.start
          setCurrentLocation(cfi)
          setCurrentPage(displayed.page)
          setTotalPages(displayed.total)
          onLocationChange?.(cfi, displayed.page, displayed.total)
        })

        // Handle text selection
        rendition.on('selected', (cfiRange: string, contents: Contents) => {
          const selection = contents.window.getSelection()
          if (selection && selection.toString().trim()) {
            const text = selection.toString().trim()
            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            
            // Get iframe position
            const iframe = viewerRef.current?.querySelector('iframe')
            const iframeRect = iframe?.getBoundingClientRect()
            
            if (iframeRect) {
              onTextSelect?.(text, {
                x: iframeRect.left + rect.left + rect.width / 2,
                y: iframeRect.top + rect.bottom
              })
            }
          }
        })

        // Display initial location or first page
        if (initialLocation) {
          await rendition.display(initialLocation)
        } else {
          await rendition.display()
        }

        // Generate locations for page numbers
        await book.locations.generate(1024)
        
        setLoading(false)
      } catch (err) {
        console.error('EPUB load error:', err)
        setError('EPUB 파일을 불러오는데 실패했습니다.')
        setLoading(false)
      }
    }

    initBook()

    return () => {
      if (bookRef.current) {
        bookRef.current.destroy()
        bookRef.current = null
      }
    }
  }, [filePath, initialLocation, onLocationChange, onTextSelect, onTocLoad])

  // Navigation functions
  const goToPrev = useCallback(() => {
    renditionRef.current?.prev()
  }, [])

  const goToNext = useCallback(() => {
    renditionRef.current?.next()
  }, [])

  const goToLocation = useCallback((location: string) => {
    renditionRef.current?.display(location)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrev, goToNext])

  return (
    <div className="epub-viewer">
      <div className="epub-container">
        {loading && (
          <div className="epub-loading">
            <div className="loading-spinner" />
            <span>EPUB 불러오는 중...</span>
          </div>
        )}

        {error && (
          <div className="epub-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div 
          ref={viewerRef} 
          className="epub-content"
          style={{ visibility: loading ? 'hidden' : 'visible' }}
        />
      </div>

      {/* Page Navigation */}
      <div className="epub-navigation">
        <button 
          className="nav-button"
          onClick={goToPrev}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          ←
        </button>
        
        <div className="page-info">
          <span className="page-current">{currentPage}</span>
          <span className="page-total">/ {totalPages}</span>
        </div>

        <button 
          className="nav-button"
          onClick={goToNext}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          →
        </button>
      </div>

      <style>{`
        .epub-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }

        .epub-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          background-color: var(--color-bg-tertiary);
        }

        .epub-content {
          width: 100%;
          height: 100%;
        }

        .epub-content iframe {
          border: none;
        }

        .epub-loading,
        .epub-error {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          color: var(--color-text-secondary);
          background-color: var(--color-bg-tertiary);
        }

        .epub-error {
          color: #ef4444;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .epub-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background-color: var(--color-bg-secondary);
          border-top: 1px solid var(--color-border);
        }

        .nav-button {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-size: 18px;
          transition: all var(--transition-fast);
        }

        .nav-button:hover:not(:disabled) {
          background-color: var(--color-bg-tertiary);
        }

        .nav-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 14px;
        }

        .page-current {
          font-weight: 500;
        }

        .page-total {
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  )
}

