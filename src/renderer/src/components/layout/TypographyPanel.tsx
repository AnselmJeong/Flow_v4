import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { ReaderSettings } from '@shared/types'

interface TypographyPanelProps {
  isOpen: boolean
  fileType: 'pdf' | 'epub'
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
}

const FONT_FAMILIES = [
  'System Default',
  'Pretendard',
  'SF Pro Text',
  'Noto Sans KR',
  'Nanum Gothic',
  'Malgun Gothic',
  'Arial',
  'Times New Roman',
  'Georgia',
  'Courier New'
]

const DEFAULT_SETTINGS: ReaderSettings = {
  pageView: 'double',
  fontFamily: 'System Default',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5
}

export function TypographyPanel({ 
  isOpen, 
  fileType,
  settings,
  onSettingsChange 
}: TypographyPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [localSettings, setLocalSettings] = useState<ReaderSettings>(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const updateSetting = <K extends keyof ReaderSettings>(
    key: K,
    value: ReaderSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const adjustValue = (key: 'fontSize' | 'fontWeight' | 'lineHeight', delta: number) => {
    const current = localSettings[key]
    if (key === 'lineHeight') {
      const newValue = Math.max(0.5, Math.min(3.0, current + delta * 0.1))
      updateSetting(key, Number(newValue.toFixed(1)))
    } else if (key === 'fontSize') {
      const newValue = Math.max(8, Math.min(48, current + delta))
      updateSetting(key, newValue)
    } else {
      const newValue = Math.max(100, Math.min(900, current + delta * 100))
      updateSetting(key, newValue)
    }
  }

  const resetValue = (key: 'fontSize' | 'fontWeight' | 'lineHeight') => {
    updateSetting(key, DEFAULT_SETTINGS[key])
  }

  if (!isOpen) return null

  const isEPUB = fileType === 'epub'

  return (
    <aside className="typography-panel">
      <div className="typography-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="typography-title">TYPOGRAPHY</span>
        {isExpanded ? (
          <ChevronUpIcon className="chevron-icon" />
        ) : (
          <ChevronDownIcon className="chevron-icon" />
        )}
      </div>

      {isExpanded && (
        <div className="typography-content">
          {/* Page View */}
          <div className="setting-group">
            <label className="setting-label">Page View</label>
            <div className="page-view-buttons">
              <button
                className={`page-view-btn ${localSettings.pageView === 'single' ? 'active' : ''}`}
                onClick={() => updateSetting('pageView', 'single')}
              >
                Single
              </button>
              <button
                className={`page-view-btn ${localSettings.pageView === 'double' ? 'active' : ''}`}
                onClick={() => updateSetting('pageView', 'double')}
              >
                Double
              </button>
            </div>
          </div>

          {/* Font Family - EPUB only */}
          {isEPUB && (
            <div className="setting-group">
              <label className="setting-label">Font Family</label>
              <div className="select-wrapper">
                <select
                  className="font-family-select"
                  value={localSettings.fontFamily}
                  onChange={(e) => updateSetting('fontFamily', e.target.value)}
                >
                  {FONT_FAMILIES.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Font Size */}
          {isEPUB && (
            <div className="setting-group">
              <label className="setting-label">Font Size</label>
              <div className="number-input-group">
                <input
                  type="text"
                  className="number-input"
                  value={localSettings.fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || DEFAULT_SETTINGS.fontSize
                    updateSetting('fontSize', Math.max(8, Math.min(48, val)))
                  }}
                  placeholder="default"
                />
                <div className="number-controls">
                  <button
                    className="number-btn"
                    onClick={() => adjustValue('fontSize', -1)}
                  >
                    −
                  </button>
                  <button
                    className="number-btn"
                    onClick={() => adjustValue('fontSize', 1)}
                  >
                    +
                  </button>
                  <button
                    className="number-btn reset"
                    onClick={() => resetValue('fontSize')}
                    title="Reset"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Font Weight - EPUB only */}
          {isEPUB && (
            <div className="setting-group">
              <label className="setting-label">Font Weight</label>
              <div className="number-input-group">
                <input
                  type="text"
                  className="number-input"
                  value={localSettings.fontWeight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || DEFAULT_SETTINGS.fontWeight
                    updateSetting('fontWeight', Math.max(100, Math.min(900, val)))
                  }}
                  placeholder="default"
                />
                <div className="number-controls">
                  <button
                    className="number-btn"
                    onClick={() => adjustValue('fontWeight', -1)}
                  >
                    −
                  </button>
                  <button
                    className="number-btn"
                    onClick={() => adjustValue('fontWeight', 1)}
                  >
                    +
                  </button>
                  <button
                    className="number-btn reset"
                    onClick={() => resetValue('fontWeight')}
                    title="Reset"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Line Height - EPUB only */}
          {isEPUB && (
            <div className="setting-group">
              <label className="setting-label">Line Height</label>
              <div className="number-input-group">
                <input
                  type="text"
                  className="number-input"
                  value={localSettings.lineHeight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || DEFAULT_SETTINGS.lineHeight
                    updateSetting('lineHeight', Math.max(0.5, Math.min(3.0, Number(val.toFixed(1)))))
                  }}
                  placeholder="default"
                />
                <div className="number-controls">
                  <button
                    className="number-btn"
                    onClick={() => adjustValue('lineHeight', -1)}
                  >
                    −
                  </button>
                  <button
                    className="number-btn"
                    onClick={() => adjustValue('lineHeight', 1)}
                  >
                    +
                  </button>
                  <button
                    className="number-btn reset"
                    onClick={() => resetValue('lineHeight')}
                    title="Reset"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isEPUB && (
            <div className="epub-only-notice">
              Font settings are only available for EPUB files.
            </div>
          )}
        </div>
      )}

      <style>{`
        .typography-panel {
          width: var(--toc-panel-width);
          height: 100%;
          background-color: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
        }

        .typography-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          user-select: none;
        }

        .typography-header:hover {
          background-color: var(--color-bg-tertiary);
        }

        .typography-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chevron-icon {
          width: 16px;
          height: 16px;
          color: var(--color-text-secondary);
        }

        .typography-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .setting-group {
          margin-bottom: var(--spacing-lg);
        }

        .setting-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .page-view-buttons {
          display: flex;
          gap: var(--spacing-xs);
        }

        .page-view-btn {
          flex: 1;
          padding: var(--spacing-sm);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 13px;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .page-view-btn:hover {
          background-color: var(--color-bg-tertiary);
        }

        .page-view-btn.active {
          background-color: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
        }

        .select-wrapper {
          position: relative;
        }

        .font-family-select {
          width: 100%;
          padding: var(--spacing-sm);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 13px;
          color: var(--color-text-primary);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          padding-right: 28px;
        }

        .font-family-select:focus {
          outline: none;
          border-color: var(--color-accent);
        }

        .number-input-group {
          display: flex;
          gap: var(--spacing-xs);
          align-items: center;
        }

        .number-input {
          flex: 1;
          padding: var(--spacing-sm);
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 13px;
          color: var(--color-text-primary);
        }

        .number-input:focus {
          outline: none;
          border-color: var(--color-accent);
        }

        .number-input::placeholder {
          color: var(--color-text-muted);
        }

        .number-controls {
          display: flex;
          gap: 2px;
        }

        .number-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-size: 16px;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .number-btn:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .number-btn.reset {
          font-size: 18px;
        }

        .epub-only-notice {
          padding: var(--spacing-md);
          text-align: center;
          font-size: 12px;
          color: var(--color-text-muted);
          font-style: italic;
        }
      `}</style>
    </aside>
  )
}

