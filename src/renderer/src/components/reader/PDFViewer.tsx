import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { TocItem, ReaderSettings, SearchResult } from '@shared/types'

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
  onTocLoad?: (toc: TocItem[]) => void
  settings?: ReaderSettings
}

export interface PDFViewerRef {
  goToPage: (page: number) => void
  search: (query: string) => Promise<SearchResult[]>
}

// PDF outline item 타입
interface PDFOutlineItem {
  title: string
  dest: string | unknown[] | null
  items?: PDFOutlineItem[]
}

export const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(function PDFViewer({
  filePath,
  initialPage = 1,
  onPageChange,
  onTextSelect,
  onTocLoad,
  settings
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<unknown>(null)
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

  const twoPageView = settings?.pageView === 'double' ?? true

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, numPages))
    // In two-page view, ensure we start on odd page
    const adjustedPage = twoPageView && validPage % 2 === 0 ? validPage - 1 : validPage
    setCurrentPage(adjustedPage)
    onPageChange?.(adjustedPage, numPages)
  }, [numPages, twoPageView, onPageChange])

  // Search function
  const searchInPDF = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!pdfDocRef.current) return []

    const pdf = pdfDocRef.current as PDFDocumentProxy
    const results: SearchResult[] = []
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')

    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine all text items
        const fullText = textContent.items
          .map((item: { str?: string }) => item.str || '')
          .join(' ')

        // Find all matches
        let match
        while ((match = searchRegex.exec(fullText)) !== null) {
          const start = Math.max(0, match.index - 50)
          const end = Math.min(fullText.length, match.index + match[0].length + 50)
          const excerpt = fullText.substring(start, end).trim()
          
          results.push({
            id: `pdf-search-${pageNum}-${results.length}`,
            text: match[0],
            pageNumber: pageNum,
            excerpt: excerpt || match[0]
          })
        }
      }
    } catch (error) {
      console.error('PDF search error:', error)
    }

    return results
  }, [])

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    goToPage,
    search: searchInPDF
  }), [goToPage, searchInPDF])

  // Convert PDF outline to TocItem format
  const convertOutlineToTocItems = useCallback(async (
    outline: PDFOutlineItem[], 
    pdf: { getDestination: (dest: string) => Promise<unknown[]>; getPageIndex: (ref: unknown) => Promise<number> }
  ): Promise<TocItem[]> => {
    const result: TocItem[] = []
    
    for (let i = 0; i < outline.length; i++) {
      const item = outline[i]
      let pageNumber: number | undefined

      try {
        if (item.dest) {
          let dest = item.dest
          // dest can be a string (named destination) or array
          if (typeof dest === 'string') {
            dest = await pdf.getDestination(dest)
          }
          if (Array.isArray(dest) && dest[0]) {
            const pageIndex = await pdf.getPageIndex(dest[0])
            pageNumber = pageIndex + 1 // Convert to 1-based page number
          }
        }
      } catch (e) {
        console.warn('Failed to get page number for outline item:', item.title, e)
      }

      const tocItem: TocItem = {
        id: `pdf-toc-${i}-${item.title}`,
        label: item.title,
        pageNumber
      }

      if (item.items && item.items.length > 0) {
        tocItem.children = await convertOutlineToTocItems(item.items, pdf)
      }

      result.push(tocItem)
    }
    
    return result
  }, [])

  const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    const total = pdf.numPages
    setNumPages(total)
    setLoading(false)
    setError(null)
    onPageChange?.(currentPage, total)
    
    // Store pdf reference for later use
    pdfDocRef.current = pdf

    // Extract outline (TOC) - use Promise chain instead of async/await
    pdf.getOutline()
      .then(async (outline) => {
        if (outline && outline.length > 0) {
          const tocItems = await convertOutlineToTocItems(outline as PDFOutlineItem[], pdf as unknown as { 
            getDestination: (dest: string) => Promise<unknown[]>
            getPageIndex: (ref: unknown) => Promise<number> 
          })
          onTocLoad?.(tocItems)
        } else {
          onTocLoad?.([])
        }
      })
      .catch((e) => {
        console.error('Failed to load PDF outline:', e)
        onTocLoad?.([])
      })
  }, [currentPage, onPageChange, onTocLoad, convertOutlineToTocItems])

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF load error:', err)
    setError('PDF 파일을 불러오는데 실패했습니다.')
    setLoading(false)
  }, [])

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - (twoPageView ? 2 : 1))
  }, [currentPage, twoPageView, goToPage])

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + (twoPageView ? 2 : 1))
  }, [currentPage, twoPageView, goToPage])

  // Handle text selection with validation - use browser default selection but verify continuity
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()
    
    if (!text) return
    
    // Get the PDF page container
    const pdfContainer = e.currentTarget.closest('.pdf-page-wrapper')
    if (!pdfContainer) return
    
    // Get text content layer
    const textContent = pdfContainer.querySelector('.react-pdf__Page__textContent')
    if (!textContent) return
    
    // Find all spans that are within the selection range
    const allSpans = textContent.querySelectorAll('span')
    const selectedSpans: Array<{ element: Element; rect: DOMRect; text: string }> = []
    
    allSpans.forEach((span) => {
      const spanRect = span.getBoundingClientRect()
      const selectionRect = range.getBoundingClientRect()
      
      // Check if span overlaps with selection (with small margin for edge cases)
      const margin = 2
      const overlaps = !(
        spanRect.right < selectionRect.left - margin ||
        spanRect.left > selectionRect.right + margin ||
        spanRect.bottom < selectionRect.top - margin ||
        spanRect.top > selectionRect.bottom + margin
      )
      
      if (overlaps && span.textContent) {
        selectedSpans.push({
          element: span,
          rect: spanRect,
          text: span.textContent
        })
      }
    })
    
    if (selectedSpans.length === 0) {
      selection.removeAllRanges()
      return
    }
    
    // Sort spans by position (top to bottom, left to right)
    selectedSpans.sort((a, b) => {
      const yDiff = a.rect.top - b.rect.top
      if (Math.abs(yDiff) > 5) { // Different lines (5px threshold)
        return yDiff
      }
      return a.rect.left - b.rect.left // Same line, sort by x
    })
    
    // Filter to only include continuous blocks
    // Two spans are continuous if they're on the same line and close horizontally
    const continuousSpans: typeof selectedSpans = []
    const lineThreshold = 5 // pixels - consider same line if within this
    
    for (let i = 0; i < selectedSpans.length; i++) {
      const current = selectedSpans[i]
      
      if (continuousSpans.length === 0) {
        continuousSpans.push(current)
        continue
      }
      
      const last = continuousSpans[continuousSpans.length - 1]
      const sameLine = Math.abs(current.rect.top - last.rect.top) < lineThreshold
      const horizontalGap = current.rect.left - last.rect.right
      
      // Include if same line and reasonable gap (less than 3x average character width)
      const avgCharWidth = last.rect.width / (last.text.length || 1)
      const maxGap = Math.max(avgCharWidth * 3, 20) // At least 20px, or 3x char width
      
      if (sameLine && horizontalGap >= -5 && horizontalGap < maxGap) {
        // Same line, reasonable gap - include
        continuousSpans.push(current)
      } else if (!sameLine) {
        // New line - check if it's directly below the previous line
        const verticalGap = current.rect.top - last.rect.bottom
        const lineHeight = last.rect.height
        if (verticalGap >= -2 && verticalGap < lineHeight * 1.5) {
          // Directly below - include
          continuousSpans.push(current)
        } else {
          // Too far - stop here (only use continuous blocks)
          break
        }
      } else {
        // Same line but gap too large - stop
        break
      }
    }
    
    // Only use filtered result if it contains at least 50% of original spans
    // This prevents selecting disconnected text blocks
    const finalSpans = continuousSpans.length >= selectedSpans.length * 0.5 
      ? continuousSpans 
      : []
    
    if (finalSpans.length === 0) {
      selection.removeAllRanges()
      return
    }
    
    // Build text from continuous spans
    const finalText = finalSpans.map(s => s.text).join('').trim()
    
    if (finalText && finalText.length > 0) {
      const finalRect = finalSpans[0].rect
      
      onTextSelect?.(finalText, {
        x: finalRect.left + finalRect.width / 2,
        y: finalRect.bottom
      })
    }
    
    // Clear selection after a short delay to show it was selected
    setTimeout(() => {
      selection.removeAllRanges()
    }, 100)
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
              <div key={pageNum} className="pdf-page-wrapper" data-page-number={pageNum}>
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
          pointer-events: auto !important;
        }

        .pdf-page-wrapper .react-pdf__Page__textContent span {
          color: transparent !important;
          position: absolute;
          white-space: pre;
          transform-origin: 0% 0%;
          cursor: text;
          user-select: text !important;
          -webkit-user-select: text !important;
          pointer-events: auto !important;
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
})
