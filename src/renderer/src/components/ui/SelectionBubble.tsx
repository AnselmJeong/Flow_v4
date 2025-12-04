import { useEffect, useRef } from 'react'

interface SelectionBubbleProps {
  text: string
  position: { x: number; y: number }
  onSummarize: (text: string) => void
  onTranslate: (text: string) => void
  onAsk: (text: string) => void
  onClose: () => void
}

export function SelectionBubble({
  text,
  position,
  onSummarize,
  onTranslate,
  onAsk,
  onClose
}: SelectionBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Close on escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 60)
  }

  return (
    <div
      ref={bubbleRef}
      className="selection-bubble"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      <button 
        className="bubble-action"
        onClick={() => onSummarize(text)}
        title="선택한 텍스트 요약"
      >
        <span className="action-icon">📝</span>
        <span className="action-label">요약</span>
      </button>
      
      <button 
        className="bubble-action"
        onClick={() => onTranslate(text)}
        title="선택한 텍스트 번역"
      >
        <span className="action-icon">🌐</span>
        <span className="action-label">번역</span>
      </button>
      
      <button 
        className="bubble-action primary"
        onClick={() => onAsk(text)}
        title="AI에게 질문하기"
      >
        <span className="action-icon">💬</span>
        <span className="action-label">질문하기</span>
      </button>

      <style>{`
        .selection-bubble {
          position: fixed;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          padding: 6px;
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          animation: bubbleIn 0.15s ease-out;
        }

        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .bubble-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .bubble-action:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .bubble-action.primary {
          background-color: var(--color-accent);
          color: white;
        }

        .bubble-action.primary:hover {
          background-color: var(--color-accent-hover);
        }

        .action-icon {
          font-size: 16px;
        }

        .action-label {
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}

