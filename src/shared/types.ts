// Book types
export interface Book {
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

// Chat types
export interface ChatSession {
  id: string
  bookId: string
  baseContext: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  message: string
  createdAt: string
}

// Settings types
export interface Settings {
  geminiApiKey?: string
  theme: 'light' | 'dark'
  model: string
}

// TOC (Table of Contents) types
export interface TocItem {
  id: string
  label: string
  pageNumber?: number  // PDF용
  href?: string        // EPUB용
  children?: TocItem[]
}

// IPC Channel names
export const IPC_CHANNELS = {
  // File operations
  IMPORT_FILE: 'import-file',
  OPEN_FILE_DIALOG: 'open-file-dialog',
  
  // Book operations
  GET_BOOKS: 'get-books',
  GET_BOOK: 'get-book',
  DELETE_BOOK: 'delete-book',
  UPDATE_BOOK_PROGRESS: 'update-book-progress',
  
  // Chat session operations
  CREATE_CHAT_SESSION: 'create-chat-session',
  GET_CHAT_SESSIONS: 'get-chat-sessions',
  GET_CHAT_MESSAGES: 'get-chat-messages',
  ADD_CHAT_MESSAGE: 'add-chat-message',
  
  // Settings
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings'
} as const

