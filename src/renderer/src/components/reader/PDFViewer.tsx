import { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { DocumentCallback } from 'react-pdf/dist/cjs/shared/types'

// 1. Worker 설정 (필수) - 로컬 파일 사용 (Electron 앱용)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// 2. CSS import (텍스트/캔버스 레이어 동기화 핵심)
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

interface PDFViewerProps {
  filePath: string
  initialPage?: number
  onPageChange?: (page: number, totalPages: number) => void
  onTextSelect?: (text: string, position: { x: number; y: number }) => void
  twoPageView?: boolean
}

export function PDFViewer({
  filePath,
  initialPage = 1,
  onPageChange,
  onTextSelect,
  twoPageView = true
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [pageHeight, setPageHeight] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate page height to fit container (height-based scaling for full view)
  useEffect(() => {
    const calculateSize = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight
        // Leave some padding
        const availableHeight = containerHeight - 40
        setPageHeight(availableHeight)
      }
    }

    calculateSize()
    window.addEventListener('resize', calculateSize)
    
    // Also observe container size changes
    const resizeObserver = new ResizeObserver(calculateSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', calculateSize)
      resizeObserver.disconnect()
    }
  }, [])

  const onDocumentLoadSuccess: DocumentCallback = useCallback(({ numPages: total }) => {
    setNumPages(total)
    setLoading(false)
    setError(null)
    onPageChange?.(currentPage, total)
  }, [currentPage, onPageChange])

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF load error:', err)
    setError('PDF 파일을 불러오는데 실패했습니다.')
    setLoading(false)
  }, [])

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, numPages))
    // In two-page view, ensure we start on odd page
    const adjustedPage = twoPageView && validPage % 2 === 0 ? validPage - 1 : validPage
    setCurrentPage(adjustedPage)
    onPageChange?.(adjustedPage, numPages)
  }, [numPages, twoPageView, onPageChange])

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - (twoPageView ? 2 : 1))
  }, [currentPage, twoPageView, goToPage])

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + (twoPageView ? 2 : 1))
  }, [currentPage, twoPageView, goToPage])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      onTextSelect?.(text, {
        x: rect.left + rect.width / 2,
        y: rect.bottom
      })
    }
  }, [onTextSelect])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        goToPrevPage()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        goToNextPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevPage, goToNextPage])

  // Get pages to render
  const pagesToRender = twoPageView 
    ? [currentPage, currentPage + 1].filter(p => p <= numPages)
    : [currentPage]

  return (
    <div className="pdf-viewer" onMouseUp={handleMouseUp}>
      <div className="pdf-container" ref={containerRef}>
        {loading && (
          <div className="pdf-loading">
            <div className="loading-spinner" />
            <span>PDF 불러오는 중...</span>
          </div>
        )}

        {error && (
          <div className="pdf-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <Document
          file={`local-file://${encodeURIComponent(filePath)}`}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className="pdf-document"
        >
          <div className="pdf-pages">
            {pagesToRender.map((pageNum) => (
              <div key={pageNum} className="pdf-page-wrapper">
                <Page
                  pageNumber={pageNum}
                  height={pageHeight}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="page-loading">
                      <div className="loading-spinner small" />
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </Document>
      </div>

      {/* Page Navigation */}
      <div className="pdf-navigation">
        <button 
          className="nav-button"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          ←
        </button>
        
        <div className="page-info">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            min={1}
            max={numPages}
            className="page-input"
          />
          <span className="page-total">/ {numPages}</span>
        </div>

        <button 
          className="nav-button"
          onClick={goToNextPage}
          disabled={currentPage >= numPages - (twoPageView ? 1 : 0)}
          aria-label="Next page"
        >
          →
        </button>
      </div>

      <style>{`
        .pdf-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        .pdf-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          background-color: var(--color-bg-tertiary);
        }

        .pdf-document {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .pdf-pages {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: center;
        }

        .pdf-page-wrapper {
          background-color: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        /* 핵심: 텍스트 레이어 동기화를 위한 CSS */
        .pdf-page-wrapper .react-pdf__Page {
          position: relative !important;
        }

        .pdf-page-wrapper .react-pdf__Page__canvas {
          display: block;
        }

        /* 텍스트 레이어가 캔버스와 정확히 일치하도록 */
        .pdf-page-wrapper .react-pdf__Page__textContent {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          overflow: hidden;
          line-height: 1.0;
          user-select: text !important;
          -webkit-user-select: text !important;
        }

        .pdf-page-wrapper .react-pdf__Page__textContent span {
          color: transparent !important;
          position: absolute;
          white-space: pre;
          transform-origin: 0% 0%;
          cursor: text;
          user-select: text !important;
          -webkit-user-select: text !important;
        }

        .pdf-page-wrapper .react-pdf__Page__textContent span::selection {
          background-color: rgba(37, 99, 235, 0.4) !important;
          color: transparent !important;
        }

        .pdf-page-wrapper .react-pdf__Page__textContent span::-moz-selection {
          background-color: rgba(37, 99, 235, 0.4) !important;
          color: transparent !important;
        }

        /* 어노테이션 레이어 */
        .pdf-page-wrapper .react-pdf__Page__annotations {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }

        .pdf-loading,
        .pdf-error {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          color: var(--color-text-secondary);
        }

        .pdf-error {
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

        .loading-spinner.small {
          width: 24px;
          height: 24px;
          border-width: 2px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          min-width: 300px;
        }

        .pdf-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm);
          background-color: var(--color-bg-secondary);
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .nav-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-size: 16px;
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
        }

        .page-input {
          width: 50px;
          padding: 4px 8px;
          text-align: center;
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-size: 13px;
        }

        .page-input:focus {
          border-color: var(--color-accent);
        }

        .page-total {
          color: var(--color-text-secondary);
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}
