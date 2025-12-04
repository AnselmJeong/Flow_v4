import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import type { Book, TocItem } from '@shared/types'

interface TOCPanelProps {
  isOpen: boolean
  view: 'library' | 'reader'
  book: Book | null
  tocItems: TocItem[]
  onItemClick?: (item: TocItem) => void
}

// Recursive component for rendering TOC items with children
function TocItemComponent({ 
  item, 
  level = 0, 
  onItemClick 
}: { 
  item: TocItem
  level?: number
  onItemClick?: (item: TocItem) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = item.children && item.children.length > 0

  return (
    <li className="toc-item-container">
      <div className={`toc-item level-${level}`}>
        {hasChildren && (
          <button 
            className="toc-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="expand-icon" />
            ) : (
              <ChevronRightIcon className="expand-icon" />
            )}
          </button>
        )}
        <button 
          className={`toc-item-button ${!hasChildren ? 'no-children' : ''}`}
          onClick={() => onItemClick?.(item)}
        >
          {item.label}
        </button>
      </div>
      {hasChildren && isExpanded && (
        <ul className="toc-sublist">
          {item.children!.map((child) => (
            <TocItemComponent 
              key={child.id} 
              item={child} 
              level={level + 1}
              onItemClick={onItemClick}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function TOCPanel({ isOpen, view, book, tocItems, onItemClick }: TOCPanelProps) {
  if (!isOpen) return null

  const hasToc = tocItems && tocItems.length > 0

  return (
    <aside className="toc-panel">
      <div className="toc-header">
        <ChevronDownIcon className="toc-icon" />
        <span className="toc-title">TOC</span>
      </div>
      
      <nav className="toc-content">
        {view === 'library' ? (
          <div className="toc-empty">
            <p>Select a book to view its table of contents</p>
          </div>
        ) : book ? (
          hasToc ? (
            <ul className="toc-list">
              {tocItems.map((item) => (
                <TocItemComponent 
                  key={item.id} 
                  item={item}
                  onItemClick={onItemClick}
                />
              ))}
            </ul>
          ) : (
            <div className="toc-empty">
              <p>No table of contents available</p>
            </div>
          )
        ) : null}
      </nav>

      <style>{`
        .toc-panel {
          width: var(--toc-panel-width);
          height: 100%;
          background-color: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .toc-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }
        
        .toc-icon {
          width: 16px;
          height: 16px;
          color: var(--color-text-secondary);
        }
        
        .toc-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .toc-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-sm);
        }
        
        .toc-empty {
          padding: var(--spacing-md);
          text-align: center;
          color: var(--color-text-muted);
          font-size: 13px;
        }
        
        .toc-list,
        .toc-sublist {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .toc-sublist {
          margin-left: var(--spacing-sm);
        }
        
        .toc-item-container {
          margin: 2px 0;
        }
        
        .toc-item {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .toc-item.level-1 {
          padding-left: var(--spacing-sm);
        }
        
        .toc-item.level-2 {
          padding-left: calc(var(--spacing-sm) * 2);
        }
        
        .toc-item.level-3 {
          padding-left: calc(var(--spacing-sm) * 3);
        }
        
        .toc-expand-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          padding: 0;
          flex-shrink: 0;
          border-radius: 4px;
          color: var(--color-text-muted);
        }
        
        .toc-expand-btn:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }
        
        .expand-icon {
          width: 12px;
          height: 12px;
        }
        
        .toc-item-button {
          flex: 1;
          text-align: left;
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 13px;
          color: var(--color-text-secondary);
          border-radius: 4px;
          transition: all var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .toc-item-button.no-children {
          margin-left: 22px;
        }
        
        .toc-item-button:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }
      `}</style>
    </aside>
  )
}
