import { useState, useRef, useCallback, useEffect } from 'react'

interface ResizableSplitterProps {
  left: React.ReactNode
  right: React.ReactNode
  initialLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
  minRightWidth?: number
  maxRightWidth?: number
  direction?: 'horizontal' | 'vertical'
}

export function ResizableSplitter({
  left,
  right,
  initialLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  minRightWidth = 20,
  maxRightWidth = 80,
  direction = 'horizontal'
}: ResizableSplitterProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const splitterRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      
      if (direction === 'horizontal') {
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
        const newRightWidth = 100 - newLeftWidth

        if (
          newLeftWidth >= minLeftWidth &&
          newLeftWidth <= maxLeftWidth &&
          newRightWidth >= minRightWidth &&
          newRightWidth <= maxRightWidth
        ) {
          setLeftWidth(newLeftWidth)
        }
      } else {
        const newLeftWidth = ((e.clientY - containerRect.top) / containerRect.height) * 100
        const newRightWidth = 100 - newLeftWidth

        if (
          newLeftWidth >= minLeftWidth &&
          newLeftWidth <= maxLeftWidth &&
          newRightWidth >= minRightWidth &&
          newRightWidth <= maxRightWidth
        ) {
          setLeftWidth(newLeftWidth)
        }
      }
    },
    [isDragging, minLeftWidth, maxLeftWidth, minRightWidth, maxRightWidth, direction]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction])

  return (
    <div
      ref={containerRef}
      className={`resizable-splitter-container ${direction}`}
      style={{ display: 'flex', height: '100%', width: '100%' }}
    >
      <div
        className="resizable-splitter-left"
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${leftWidth}%`,
          [direction === 'horizontal' ? 'height' : 'width']: '100%',
          overflow: 'hidden'
        }}
      >
        {left}
      </div>
      <div
        ref={splitterRef}
        className={`resizable-splitter-handle ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: '4px',
          [direction === 'horizontal' ? 'height' : 'width']: '100%',
          cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
          flexShrink: 0
        }}
      />
      <div
        className="resizable-splitter-right"
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${100 - leftWidth}%`,
          [direction === 'horizontal' ? 'height' : 'width']: '100%',
          overflow: 'hidden'
        }}
      >
        {right}
      </div>
      <style>{`
        .resizable-splitter-container {
          position: relative;
        }

        .resizable-splitter-handle {
          background-color: var(--color-border);
          transition: background-color 0.2s;
          z-index: 10;
        }

        .resizable-splitter-handle:hover {
          background-color: var(--color-accent);
        }

        .resizable-splitter-handle.dragging {
          background-color: var(--color-accent);
        }

        .resizable-splitter-left,
        .resizable-splitter-right {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  )
}

