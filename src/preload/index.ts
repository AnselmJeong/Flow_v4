import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // File operations
  importFile: (filePath: string) => ipcRenderer.invoke('import-file', filePath),
  
  // Book operations
  getBooks: () => ipcRenderer.invoke('get-books'),
  getBook: (id: string) => ipcRenderer.invoke('get-book', id),
  deleteBook: (id: string) => ipcRenderer.invoke('delete-book', id),
  updateBookProgress: (id: string, page: number) => 
    ipcRenderer.invoke('update-book-progress', id, page),
  
  // Chat session operations
  createChatSession: (bookId: string, baseContext: string) => 
    ipcRenderer.invoke('create-chat-session', bookId, baseContext),
  getChatSessions: (bookId: string) => 
    ipcRenderer.invoke('get-chat-sessions', bookId),
  getChatMessages: (sessionId: string) => 
    ipcRenderer.invoke('get-chat-messages', sessionId),
  addChatMessage: (sessionId: string, role: 'user' | 'assistant', message: string) => 
    ipcRenderer.invoke('add-chat-message', sessionId, role, message),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, unknown>) => 
    ipcRenderer.invoke('save-settings', settings),
  
  // Dialog
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // Gemini API
  callGemini: (sessionId: string, userMessage: string) => 
    ipcRenderer.invoke('call-gemini', sessionId, userMessage)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

