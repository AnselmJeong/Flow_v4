import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, PlusIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import type { Book } from '@shared/types'

interface LibraryViewProps {
  onBookSelect: (book: Book) => void
}

export function LibraryView({ onBookSelect }: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  // Load books from database
  const loadBooks = useCallback(async () => {
    try {
      const loadedBooks = await window.api.getBooks()
      setBooks(loadedBooks)
    } catch (err) {
      console.error('Failed to load books:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleImport = async () => {
    try {
      const filePath = await window.api.openFileDialog()
      if (filePath) {
        const result = await window.api.importFile(filePath)
        if (result.success) {
          // Reload books
          loadBooks()
        } else {
          console.error('Import failed:', result.error)
        }
      }
    } catch (err) {
      console.error('Import error:', err)
    }
  }

  return (
    <div className="library-view">
      <header className="library-header">
        <h1 className="library-title">My Library</h1>
        
        <div className="library-actions">
          <div className="search-box">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder="책 제목이나 저자를 검색하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button className="select-button">
            Select
          </button>
          
          <button className="import-button" onClick={handleImport}>
            <PlusIcon className="button-icon" />
            Import Books
          </button>
        </div>
      </header>

      <div className="library-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>책을 불러오는 중...</span>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>라이브러리가 비어있습니다</h3>
            <p>Import Books 버튼을 눌러 PDF나 EPUB 파일을 추가하세요.</p>
          </div>
        ) : (
          <>
            {/* Recently Added - show last 5 books */}
            <section className="book-section">
              <h2 className="section-title">Recently Added</h2>
              <div className="book-grid">
                {filteredBooks.slice(0, 5).map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onClick={() => onBookSelect(book)} 
                  />
                ))}
              </div>
            </section>

            {/* All Books */}
            <section className="book-section">
              <h2 className="section-title">All Books</h2>
              <div className="book-grid">
                {filteredBooks.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onClick={() => onBookSelect(book)} 
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Floating chat button */}
      <button className="floating-chat-button" title="AI Chat">
        <ChatBubbleLeftIcon className="chat-icon" />
      </button>

      <style>{`
        .library-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: var(--spacing-lg);
          overflow-y: auto;
          position: relative;
        }
        
        .library-header {
          margin-bottom: var(--spacing-xl);
        }
        
        .library-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: var(--spacing-md);
          color: var(--color-text-primary);
        }
        
        .library-actions {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
        }
        
        .search-box {
          flex: 1;
          max-width: 400px;
          display: flex;
          align-items: center;
          background-color: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 0 var(--spacing-md);
        }
        
        .search-icon {
          width: 18px;
          height: 18px;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
        
        .search-input {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-sm);
          font-size: 14px;
        }
        
        .search-input::placeholder {
          color: var(--color-text-muted);
        }
        
        .select-button {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          background-color: var(--color-bg-primary);
          transition: all var(--transition-fast);
        }
        
        .select-button:hover {
          background-color: var(--color-bg-secondary);
        }
        
        .import-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--color-accent);
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition-fast);
        }
        
        .import-button:hover {
          background-color: var(--color-accent-hover);
        }
        
        .button-icon {
          width: 18px;
          height: 18px;
        }
        
        .library-content {
          flex: 1;
        }
        
        .book-section {
          margin-bottom: var(--spacing-xl);
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--color-text-primary);
        }
        
        .book-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: var(--spacing-lg);
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl) * 2;
          color: var(--color-text-secondary);
          text-align: center;
          min-height: 300px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: var(--spacing-md);
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .empty-state p {
          font-size: 14px;
          color: var(--color-text-muted);
        }
        
        .floating-chat-button {
          position: fixed;
          bottom: var(--spacing-lg);
          right: var(--spacing-lg);
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        
        .floating-chat-button:hover {
          transform: scale(1.05);
          box-shadow: var(--shadow-lg);
        }
        
        .chat-icon {
          width: 24px;
          height: 24px;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  )
}

// Book Card Component
function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const progress = book.totalPages 
    ? Math.round((book.lastPage / book.totalPages) * 100)
    : 0

  return (
    <div className="book-card" onClick={onClick}>
      <div className="book-cover">
        {book.coverPath ? (
          <img src={book.coverPath} alt={book.title} />
        ) : (
          <div className="book-cover-placeholder">
            <span className="book-initial">{book.title[0]}</span>
          </div>
        )}
        {progress > 0 && (
          <div className="book-progress">{progress}%</div>
        )}
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <span className="book-source">Local</span>
      </div>

      <style>{`
        .book-card {
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .book-card:hover {
          transform: translateY(-4px);
        }
        
        .book-cover {
          position: relative;
          aspect-ratio: 3 / 4;
          border-radius: 8px;
          overflow: hidden;
          background-color: var(--color-bg-tertiary);
          margin-bottom: var(--spacing-sm);
        }
        
        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .book-cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .book-initial {
          font-size: 48px;
          font-weight: 700;
          color: white;
          opacity: 0.8;
        }
        
        .book-progress {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          padding: 4px 8px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 4px;
        }
        
        .book-info {
          padding: 0 var(--spacing-xs);
        }
        
        .book-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .book-author {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
        }
        
        .book-source {
          font-size: 11px;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  )
}

