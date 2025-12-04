import { 
  ListBulletIcon, 
  MagnifyingGlassIcon,
  UnderlineIcon,
  PhotoIcon,
  ChartBarIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

interface IconSidebarProps {
  onToggleToc: () => void
  onToggleTheme: () => void
  onSettings: () => void
  theme: 'light' | 'dark'
}

const iconButtons = [
  { id: 'toc', icon: ListBulletIcon, label: 'Table of Contents' },
  { id: 'search', icon: MagnifyingGlassIcon, label: 'Search' },
  { id: 'underline', icon: UnderlineIcon, label: 'Highlights' },
  { id: 'images', icon: PhotoIcon, label: 'Images' },
  { id: 'chart', icon: ChartBarIcon, label: 'Statistics' },
  { id: 'font', icon: LanguageIcon, label: 'Font Settings' },
]

export function IconSidebar({ onToggleToc, onToggleTheme, onSettings, theme }: IconSidebarProps) {
  const handleClick = (id: string) => {
    if (id === 'toc') {
      onToggleToc()
    }
    // Other handlers will be added later
  }

  return (
    <aside className="icon-sidebar">
      <div className="icon-sidebar-top">
        {iconButtons.map(({ id, icon: Icon, label }) => (
          <button 
            key={id}
            className="icon-button"
            onClick={() => handleClick(id)}
            title={label}
            aria-label={label}
          >
            <Icon className="icon" />
          </button>
        ))}
      </div>
      
      <div className="icon-sidebar-bottom">
        <button 
          className="icon-button"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <MoonIcon className="icon" />
          ) : (
            <SunIcon className="icon" />
          )}
        </button>
        <button 
          className="icon-button"
          title="Settings"
          aria-label="Settings"
          onClick={onSettings}
        >
          <Cog6ToothIcon className="icon" />
        </button>
      </div>

      <style>{`
        .icon-sidebar {
          width: var(--icon-sidebar-width);
          height: 100%;
          background-color: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--spacing-sm) 0;
          flex-shrink: 0;
        }
        
        .icon-sidebar-top,
        .icon-sidebar-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .icon-button {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }
        
        .icon-button:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }
        
        .icon-button:active {
          transform: scale(0.95);
        }
        
        .icon {
          width: 22px;
          height: 22px;
        }
      `}</style>
    </aside>
  )
}

