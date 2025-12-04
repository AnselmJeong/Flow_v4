import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Settings } from '@shared/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    model: 'gemini-2.5-flash-preview-05-20',
    geminiApiKey: ''
  })
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  // Load settings
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.api.getSettings()
      setSettings(loadedSettings)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.api.saveSettings(settings)
      onClose()
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 className="modal-title">설정</h2>
          <button className="close-button" onClick={onClose}>
            <XMarkIcon className="close-icon" />
          </button>
        </header>

        <div className="modal-body">
          {/* API Key Section */}
          <section className="settings-section">
            <h3 className="section-title">Gemini API</h3>
            
            <div className="form-group">
              <label className="form-label">API Key</label>
              <div className="api-key-input">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.geminiApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="Gemini API Key를 입력하세요"
                  className="form-input"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className="form-hint">
                API Key는{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google AI Studio
                </a>
                에서 발급받을 수 있습니다.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">모델</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="form-select"
              >
                <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash (Preview)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
          </section>

          {/* Theme Section */}
          <section className="settings-section">
            <h3 className="section-title">테마</h3>
            
            <div className="form-group">
              <div className="theme-options">
                <label className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={settings.theme === 'light'}
                    onChange={() => setSettings({ ...settings, theme: 'light' })}
                  />
                  <span className="theme-icon">☀️</span>
                  <span className="theme-label">라이트</span>
                </label>
                <label className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={settings.theme === 'dark'}
                    onChange={() => setSettings({ ...settings, theme: 'dark' })}
                  />
                  <span className="theme-icon">🌙</span>
                  <span className="theme-label">다크</span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <footer className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            취소
          </button>
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </footer>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.15s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-content {
            background-color: var(--color-bg-primary);
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.15s ease-out;
          }

          @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-md) var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
          }

          .modal-title {
            font-size: 18px;
            font-weight: 600;
          }

          .close-button {
            padding: var(--spacing-xs);
            border-radius: 6px;
            color: var(--color-text-muted);
          }

          .close-button:hover {
            background-color: var(--color-bg-tertiary);
            color: var(--color-text-primary);
          }

          .close-icon {
            width: 20px;
            height: 20px;
          }

          .modal-body {
            padding: var(--spacing-lg);
            overflow-y: auto;
          }

          .settings-section {
            margin-bottom: var(--spacing-lg);
          }

          .settings-section:last-child {
            margin-bottom: 0;
          }

          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-md);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .form-group {
            margin-bottom: var(--spacing-md);
          }

          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: var(--spacing-xs);
          }

          .form-input,
          .form-select {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            background-color: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            font-size: 14px;
          }

          .form-input:focus,
          .form-select:focus {
            border-color: var(--color-accent);
            outline: none;
          }

          .api-key-input {
            display: flex;
            gap: var(--spacing-sm);
          }

          .api-key-input .form-input {
            flex: 1;
          }

          .toggle-visibility {
            padding: var(--spacing-sm) var(--spacing-md);
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            font-size: 13px;
            white-space: nowrap;
          }

          .toggle-visibility:hover {
            background-color: var(--color-bg-secondary);
          }

          .form-hint {
            font-size: 12px;
            color: var(--color-text-muted);
            margin-top: var(--spacing-xs);
          }

          .form-hint a {
            color: var(--color-accent);
          }

          .form-hint a:hover {
            text-decoration: underline;
          }

          .theme-options {
            display: flex;
            gap: var(--spacing-md);
          }

          .theme-option {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-md);
            border: 2px solid var(--color-border);
            border-radius: 12px;
            cursor: pointer;
            transition: all var(--transition-fast);
          }

          .theme-option:hover {
            border-color: var(--color-accent);
          }

          .theme-option.active {
            border-color: var(--color-accent);
            background-color: var(--color-accent-light);
          }

          .theme-option input {
            display: none;
          }

          .theme-icon {
            font-size: 24px;
          }

          .theme-label {
            font-size: 14px;
            font-weight: 500;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-sm);
            padding: var(--spacing-md) var(--spacing-lg);
            border-top: 1px solid var(--color-border);
          }

          .cancel-button,
          .save-button {
            padding: var(--spacing-sm) var(--spacing-lg);
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all var(--transition-fast);
          }

          .cancel-button {
            background-color: var(--color-bg-tertiary);
          }

          .cancel-button:hover {
            background-color: var(--color-bg-secondary);
          }

          .save-button {
            background-color: var(--color-accent);
            color: white;
          }

          .save-button:hover:not(:disabled) {
            background-color: var(--color-accent-hover);
          }

          .save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  )
}

