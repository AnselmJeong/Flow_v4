import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import type { Book, ChatSession, ChatMessage, Settings } from '@shared/types'

let db: Database.Database | null = null

// Initialize database
export const initDatabase = (): Database.Database => {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'flow-reader.db')
  db = new Database(dbPath)
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  
  // Create tables
  createTables()
  
  return db
}

// Create tables
const createTables = () => {
  if (!db) return

  // Books table
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      file_path TEXT NOT NULL,
      cover_path TEXT,
      file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'epub')),
      last_page INTEGER DEFAULT 1,
      total_pages INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // Chat sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      base_context TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `)

  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )
  `)

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_book_id ON chat_sessions(book_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
  `)
}

// Book operations
export const getBooks = (): Book[] => {
  if (!db) return []
  
  const stmt = db.prepare(`
    SELECT id, title, author, file_path as filePath, cover_path as coverPath,
           file_type as fileType, last_page as lastPage, total_pages as totalPages,
           created_at as createdAt, updated_at as updatedAt
    FROM books
    ORDER BY updated_at DESC
  `)
  
  return stmt.all() as Book[]
}

export const getBook = (id: string): Book | null => {
  if (!db) return null
  
  const stmt = db.prepare(`
    SELECT id, title, author, file_path as filePath, cover_path as coverPath,
           file_type as fileType, last_page as lastPage, total_pages as totalPages,
           created_at as createdAt, updated_at as updatedAt
    FROM books
    WHERE id = ?
  `)
  
  return stmt.get(id) as Book | null
}

export const insertBook = (book: Book): void => {
  if (!db) return
  
  const stmt = db.prepare(`
    INSERT INTO books (id, title, author, file_path, cover_path, file_type, last_page, total_pages, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    book.id,
    book.title,
    book.author,
    book.filePath,
    book.coverPath || null,
    book.fileType,
    book.lastPage || 1,
    book.totalPages || null,
    book.createdAt,
    book.updatedAt
  )
}

export const updateBookProgress = (id: string, lastPage: number): boolean => {
  if (!db) return false
  
  const stmt = db.prepare(`
    UPDATE books SET last_page = ?, updated_at = ? WHERE id = ?
  `)
  
  const result = stmt.run(lastPage, new Date().toISOString(), id)
  return result.changes > 0
}

export const deleteBookFromDb = (id: string): boolean => {
  if (!db) return false
  
  const stmt = db.prepare('DELETE FROM books WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// Chat session operations
export const getChatSessions = (bookId: string): ChatSession[] => {
  if (!db) return []
  
  const stmt = db.prepare(`
    SELECT id, book_id as bookId, base_context as baseContext,
           created_at as createdAt, updated_at as updatedAt
    FROM chat_sessions
    WHERE book_id = ?
    ORDER BY updated_at DESC
  `)
  
  return stmt.all(bookId) as ChatSession[]
}

export const getChatSession = (id: string): ChatSession | null => {
  if (!db) return null
  
  const stmt = db.prepare(`
    SELECT id, book_id as bookId, base_context as baseContext,
           created_at as createdAt, updated_at as updatedAt
    FROM chat_sessions
    WHERE id = ?
  `)
  
  return stmt.get(id) as ChatSession | null
}

export const createChatSession = (bookId: string, baseContext: string): ChatSession => {
  if (!db) throw new Error('Database not initialized')
  
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  const stmt = db.prepare(`
    INSERT INTO chat_sessions (id, book_id, base_context, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  stmt.run(id, bookId, baseContext, now, now)
  
  return {
    id,
    bookId,
    baseContext,
    createdAt: now,
    updatedAt: now
  }
}

export const deleteChatSession = (id: string): boolean => {
  if (!db) return false
  
  const stmt = db.prepare('DELETE FROM chat_sessions WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// Chat message operations
export const getChatMessages = (sessionId: string): ChatMessage[] => {
  if (!db) return []
  
  const stmt = db.prepare(`
    SELECT id, session_id as sessionId, role, message, created_at as createdAt
    FROM chat_messages
    WHERE session_id = ?
    ORDER BY created_at ASC
  `)
  
  return stmt.all(sessionId) as ChatMessage[]
}

export const addChatMessage = (
  sessionId: string, 
  role: 'user' | 'assistant', 
  message: string
): ChatMessage => {
  if (!db) throw new Error('Database not initialized')
  
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  const stmt = db.prepare(`
    INSERT INTO chat_messages (id, session_id, role, message, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  stmt.run(id, sessionId, role, message, now)
  
  // Update session's updated_at
  const updateSessionStmt = db.prepare(`
    UPDATE chat_sessions SET updated_at = ? WHERE id = ?
  `)
  updateSessionStmt.run(now, sessionId)
  
  return {
    id,
    sessionId,
    role,
    message,
    createdAt: now
  }
}

// Settings operations
export const getSettings = (): Settings => {
  if (!db) return { theme: 'light', model: 'gemini-2.5-flash' }
  
  const stmt = db.prepare('SELECT key, value FROM settings')
  const rows = stmt.all() as { key: string; value: string }[]
  
  const settings: Settings = {
    theme: 'light',
    model: 'gemini-2.5-flash'
  }
  
  for (const row of rows) {
    if (row.key === 'geminiApiKey') settings.geminiApiKey = row.value
    if (row.key === 'theme') settings.theme = row.value as 'light' | 'dark'
    if (row.key === 'model') settings.model = row.value
  }
  
  return settings
}

export const saveSetting = (key: string, value: string): boolean => {
  if (!db) return false
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
  `)
  
  const result = stmt.run(key, value)
  return result.changes > 0
}

export const saveSettings = (settings: Partial<Settings>): boolean => {
  if (!db) return false
  
  const transaction = db.transaction(() => {
    if (settings.geminiApiKey !== undefined) {
      saveSetting('geminiApiKey', settings.geminiApiKey)
    }
    if (settings.theme !== undefined) {
      saveSetting('theme', settings.theme)
    }
    if (settings.model !== undefined) {
      saveSetting('model', settings.model)
    }
  })
  
  try {
    transaction()
    return true
  } catch {
    return false
  }
}

// Close database
export const closeDatabase = () => {
  if (db) {
    db.close()
    db = null
  }
}

