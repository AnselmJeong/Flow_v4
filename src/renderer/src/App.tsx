import { useState, useEffect, useCallback, useRef } from 'react'
import { IconSidebar } from './components/layout/IconSidebar'
import { TOCPanel } from './components/layout/TOCPanel'
import { SearchPanel } from './components/layout/SearchPanel'
import { TypographyPanel } from './components/layout/TypographyPanel'
import { LibraryView, ReaderView } from './views'
import type { ReaderViewRef } from './views'
import { SettingsModal } from './components/settings/SettingsModal'
import type { Book, TocItem, ReaderSettings, SearchResult } from '@shared/types'

type View = 'library' | 'reader'
type PanelType = 'toc' | 'search' | 'typography' | null

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  pageView: 'double',
  fontFamily: 'System Default',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5
}

function App() {
  const readerRef = useRef<ReaderViewRef>(null)
  
  const [currentView, setCurrentView] = useState<View>('library')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [activePanel, setActivePanel] = useState<PanelType>('toc')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS)

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
    setActivePanel('toc') // Reset to TOC panel
  }

  const handleBackToLibrary = () => {
    setCurrentView('library')
    setSelectedBook(null)
    setTocItems([]) // Clear TOC when going back to library
    setActivePanel(null) // Close panels in library view
  }

  const handleTocLoad = useCallback((toc: TocItem[]) => {
    setTocItems(toc)
  }, [])

  const handleTocItemClick = useCallback((item: TocItem) => {
    readerRef.current?.navigateToTocItem(item)
  }, [])

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    readerRef.current?.navigateToSearchResult(result)
  }, [])

  const handleSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!readerRef.current) return []
    return await readerRef.current.search(query)
  }, [])

  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel)
  }, [activePanel])

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

  const handleSettingsChange = useCallback((settings: ReaderSettings) => {
    setReaderSettings(settings)
  }, [])

  return (
    <div className="app-container" data-theme={theme}>
      <IconSidebar 
        onToggleToc={() => togglePanel('toc')}
        onToggleSearch={() => togglePanel('search')}
        onToggleTypography={() => togglePanel('typography')}
        onToggleTheme={toggleTheme}
        onSettings={handleOpenSettings}
        theme={theme}
        activePanel={activePanel}
      />
      
      {activePanel === 'toc' && (
        <TOCPanel 
          isOpen={true}
          view={currentView}
          book={selectedBook}
          tocItems={tocItems}
          onItemClick={handleTocItemClick}
        />
      )}

      {activePanel === 'search' && currentView === 'reader' && selectedBook && (
        <SearchPanel
          isOpen={true}
          fileType={selectedBook.fileType}
          onClose={() => setActivePanel(null)}
          onResultClick={handleSearchResultClick}
          onSearch={handleSearch}
        />
      )}

      {activePanel === 'typography' && currentView === 'reader' && selectedBook && (
        <TypographyPanel
          isOpen={true}
          fileType={selectedBook.fileType}
          settings={readerSettings}
          onSettingsChange={handleSettingsChange}
        />
      )}
      
      <main className="main-content">
        {currentView === 'library' ? (
          <LibraryView onBookSelect={handleBookSelect} />
        ) : (
          <ReaderView 
            ref={readerRef}
            book={selectedBook!}
            onBack={handleBackToLibrary}
            onTocLoad={handleTocLoad}
            settings={readerSettings}
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
