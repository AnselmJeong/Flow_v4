import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { Book } from '@shared/types'

interface TOCPanelProps {
  isOpen: boolean
  view: 'library' | 'reader'
  book: Book | null
}

// Placeholder TOC items for demo
const demoTocItems = [
  { id: '1', title: 'Title Page', level: 0 },
  { id: '2', title: 'Copyright Page', level: 0 },
  { id: '3', title: 'Dedication', level: 0 },
  { id: '4', title: 'Contents', level: 0 },
  { id: '5', title: 'List of Abbreviations', level: 0 },
  { id: '6', title: 'Introducing Henri Bergson', level: 0 },
  { id: '7', title: '1. Taking Time Seriously', level: 1 },
  { id: '8', title: '2. Making Memory Matter', level: 1 },
  { id: '9', title: '3. Elan Vital', level: 1 },
  { id: '10', title: '4. Open and Closed', level: 1 },
  { id: '11', title: 'Conclusion', level: 0 },
  { id: '12', title: 'Notes', level: 0 },
  { id: '13', title: 'Index', level: 0 },
]

export function TOCPanel({ isOpen, view, book }: TOCPanelProps) {
  if (!isOpen) return null

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
          <ul className="toc-list">
            {demoTocItems.map((item) => (
              <li 
                key={item.id}
                className={`toc-item level-${item.level}`}
              >
                <button className="toc-item-button">
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
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
        
        .toc-list {
          list-style: none;
        }
        
        .toc-item {
          margin: 2px 0;
        }
        
        .toc-item.level-1 {
          padding-left: var(--spacing-md);
        }
        
        .toc-item.level-2 {
          padding-left: calc(var(--spacing-md) * 2);
        }
        
        .toc-item-button {
          width: 100%;
          text-align: left;
          padding: var(--spacing-sm) var(--spacing-sm);
          font-size: 13px;
          color: var(--color-text-secondary);
          border-radius: 4px;
          transition: all var(--transition-fast);
        }
        
        .toc-item-button:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }
      `}</style>
    </aside>
  )
}

