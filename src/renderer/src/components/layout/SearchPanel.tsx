import { useState, useCallback, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { SearchResult } from '@shared/types'

interface SearchPanelProps {
  isOpen: boolean
  fileType: 'pdf' | 'epub'
  onClose: () => void
  onResultClick: (result: SearchResult) => void
  onSearch?: (query: string) => Promise<SearchResult[]>
}

export function SearchPanel({ 
  isOpen, 
  fileType,
  onClose,
  onResultClick,
  onSearch
}: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setHasSearched(false)
    }
  }, [isOpen])

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !onSearch) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const searchResults = await onSearch(query.trim())
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [query, onSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [handleSearch, onClose])

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick(result)
  }, [onResultClick])

  if (!isOpen) return null

  return (
    <aside className="search-panel">
      <div className="search-header">
        <div className="search-input-wrapper">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search in document..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {query && (
            <button
              className="clear-button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <XMarkIcon className="clear-icon" />
            </button>
          )}
        </div>
        <button
          className="search-button"
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close search"
        >
          <XMarkIcon className="close-icon" />
        </button>
      </div>

      <div className="search-results">
        {hasSearched && !isSearching && (
          <>
            {results.length > 0 ? (
              <>
                <div className="results-header">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
                <ul className="results-list">
                  {results.map((result) => (
                    <li
                      key={result.id}
                      className="result-item"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="result-excerpt">
                        {result.excerpt}
                      </div>
                      {result.pageNumber && (
                        <div className="result-page">
                          Page {result.pageNumber}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="no-results">
                No results found for "{query}"
              </div>
            )}
          </>
        )}
        {!hasSearched && (
          <div className="search-hint">
            Enter a search term and press Enter or click Search
          </div>
        )}
      </div>

      <style>{`
        .search-panel {
          width: var(--toc-panel-width);
          height: 100%;
          background-color: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
        }

        .search-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: var(--spacing-sm);
          width: 18px;
          height: 18px;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 36px;
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 13px;
          color: var(--color-text-primary);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-accent);
        }

        .clear-button {
          position: absolute;
          right: var(--spacing-sm);
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          border-radius: 4px;
        }

        .clear-button:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .clear-icon {
          width: 14px;
          height: 14px;
        }

        .search-button {
          width: 100%;
          padding: var(--spacing-sm);
          background-color: var(--color-accent);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .search-button:hover:not(:disabled) {
          background-color: var(--color-accent-hover);
        }

        .search-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .close-button {
          width: 100%;
          padding: var(--spacing-xs);
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .close-icon {
          width: 16px;
          height: 16px;
        }

        .search-results {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-sm);
        }

        .results-header {
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .results-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .result-item {
          padding: var(--spacing-sm) var(--spacing-md);
          margin-bottom: var(--spacing-xs);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .result-item:hover {
          background-color: var(--color-bg-tertiary);
          border-color: var(--color-accent);
        }

        .result-excerpt {
          font-size: 13px;
          color: var(--color-text-primary);
          line-height: 1.5;
          margin-bottom: var(--spacing-xs);
        }

        .result-page {
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .no-results,
        .search-hint {
          padding: var(--spacing-lg);
          text-align: center;
          font-size: 13px;
          color: var(--color-text-muted);
        }
      `}</style>
    </aside>
  )
}

