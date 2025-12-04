import { useState, useEffect, useCallback, useRef } from 'react'
import { IconSidebar } from './components/layout/IconSidebar'
import { TOCPanel } from './components/layout/TOCPanel'
import { LibraryView, ReaderView } from './views'
import type { ReaderViewRef } from './views'
import { SettingsModal } from './components/settings/SettingsModal'
import type { Book, TocItem } from '@shared/types'

type View = 'library' | 'reader'

function App() {
  const readerRef = useRef<ReaderViewRef>(null)
  
  const [currentView, setCurrentView] = useState<View>('library')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isTocOpen, setIsTocOpen] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tocItems, setTocItems] = useState<TocItem[]>([])

  // Load theme from settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await window.api.getSettings()
        setTheme(settings.theme)
      } catch (err) {
        console.error('Failed to load theme:', err)
      }
    }
    loadTheme()
  }, [])

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book)
    setCurrentView('reader')
    setTocItems([]) // Reset TOC when switching books
  }

  const handleBackToLibrary = () => {
    setCurrentView('library')
    setSelectedBook(null)
    setTocItems([]) // Clear TOC when going back to library
  }

  const handleTocLoad = useCallback((toc: TocItem[]) => {
    setTocItems(toc)
  }, [])

  const handleTocItemClick = useCallback((item: TocItem) => {
    readerRef.current?.navigateToTocItem(item)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    window.api.saveSettings({ theme: newTheme })
  }, [theme])

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false)
    // Reload theme in case it was changed
    window.api.getSettings().then(settings => setTheme(settings.theme))
  }, [])

  return (
    <div className="app-container" data-theme={theme}>
      <IconSidebar 
        onToggleToc={() => setIsTocOpen(!isTocOpen)}
        onToggleTheme={toggleTheme}
        onSettings={handleOpenSettings}
        theme={theme}
      />
      
      <TOCPanel 
        isOpen={isTocOpen}
        view={currentView}
        book={selectedBook}
        tocItems={tocItems}
        onItemClick={handleTocItemClick}
      />
      
      <main className="main-content">
        {currentView === 'library' ? (
          <LibraryView onBookSelect={handleBookSelect} />
        ) : (
          <ReaderView 
            ref={readerRef}
            book={selectedBook!}
            onBack={handleBackToLibrary}
            onTocLoad={handleTocLoad}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: var(--color-bg-primary);
        }
        
        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default App
