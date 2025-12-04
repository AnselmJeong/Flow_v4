import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  importFile: (filePath: string) => Promise<{ success: boolean; book?: Book; error?: string }>
  getBooks: () => Promise<Book[]>
  getBook: (id: string) => Promise<Book | null>
  deleteBook: (id: string) => Promise<boolean>
  updateBookProgress: (id: string, page: number) => Promise<boolean>
  createChatSession: (bookId: string, baseContext: string) => Promise<ChatSession>
  getChatSessions: (bookId: string) => Promise<ChatSession[]>
  getChatMessages: (sessionId: string) => Promise<ChatMessage[]>
  addChatMessage: (sessionId: string, role: 'user' | 'assistant', message: string) => Promise<ChatMessage>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Partial<Settings>) => Promise<boolean>
  openFileDialog: () => Promise<string | null>
  callGemini: (sessionId: string, userMessage: string) => Promise<{ success: boolean; response?: string; error?: string }>
}

interface Book {
  id: string
  title: string
  author: string
  filePath: string
  coverPath?: string
  fileType: 'pdf' | 'epub'
  lastPage: number
  totalPages?: number
  createdAt: string
  updatedAt: string
}

interface ChatSession {
  id: string
  bookId: string
  baseContext: string
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  message: string
  createdAt: string
}

interface Settings {
  geminiApiKey?: string
  theme: 'light' | 'dark'
  model: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}

