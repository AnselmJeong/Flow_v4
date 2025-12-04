import { app, shell, BrowserWindow, ipcMain, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { openFileDialog, importFile, deleteBook as deleteBookFiles } from './services/fileService'
import {
  initDatabase,
  closeDatabase,
  getBooks,
  getBook,
  insertBook,
  updateBookProgress,
  deleteBookFromDb,
  getChatSessions,
  getChatSession,
  createChatSession,
  getChatMessages,
  addChatMessage,
  getSettings,
  saveSettings
} from './services/database'
import { callGeminiAPI } from './services/geminiService'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Register custom protocol for local file access
  protocol.handle('local-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))
    return net.fetch(pathToFileURL(filePath).toString())
  })

  // Initialize database
  initDatabase()
  
  electronApp.setAppUserModelId('com.flow.reader')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers
  ipcMain.on('ping', () => console.log('pong'))

  // File operations
  ipcMain.handle('open-file-dialog', async () => {
    return await openFileDialog()
  })

  ipcMain.handle('import-file', async (_, filePath: string) => {
    try {
      const book = await importFile(filePath)
      // Save to database
      insertBook({
        ...book,
        lastPage: 1
      })
      return { success: true, book }
    } catch (error) {
      console.error('Import error:', error)
      return { success: false, error: String(error) }
    }
  })

  // Book operations
  ipcMain.handle('get-books', () => {
    return getBooks()
  })

  ipcMain.handle('get-book', (_, id: string) => {
    return getBook(id)
  })

  ipcMain.handle('delete-book', async (_, id: string) => {
    const book = getBook(id)
    if (book) {
      await deleteBookFiles(id, book.filePath)
      deleteBookFromDb(id)
      return true
    }
    return false
  })

  ipcMain.handle('update-book-progress', (_, id: string, page: number) => {
    return updateBookProgress(id, page)
  })

  // Chat session operations
  ipcMain.handle('create-chat-session', (_, bookId: string, baseContext: string) => {
    return createChatSession(bookId, baseContext)
  })

  ipcMain.handle('get-chat-sessions', (_, bookId: string) => {
    return getChatSessions(bookId)
  })

  ipcMain.handle('get-chat-messages', (_, sessionId: string) => {
    return getChatMessages(sessionId)
  })

  ipcMain.handle('add-chat-message', (_, sessionId: string, role: 'user' | 'assistant', message: string) => {
    return addChatMessage(sessionId, role, message)
  })

  // Settings operations
  ipcMain.handle('get-settings', () => {
    return getSettings()
  })

  ipcMain.handle('save-settings', (_, settings: Record<string, unknown>) => {
    return saveSettings(settings)
  })

  // Gemini API
  ipcMain.handle('call-gemini', async (_, sessionId: string, userMessage: string) => {
    try {
      // Get session and its base context
      const session = getChatSession(sessionId)
      if (!session) {
        throw new Error('세션을 찾을 수 없습니다.')
      }

      // Validate baseContext
      if (!session.baseContext || session.baseContext.trim().length === 0) {
        console.error('baseContext is empty for session:', sessionId)
        throw new Error('선택된 텍스트가 없습니다. 텍스트를 선택한 후 다시 시도해주세요.')
      }

      // Get chat history
      const messages = getChatMessages(sessionId)
      const chatHistory = messages.map(m => ({
        role: m.role,
        message: m.message
      }))

      console.log('Calling Gemini API with baseContext length:', session.baseContext.length)
      console.log('User message:', userMessage)
      console.log('Chat history length:', chatHistory.length)

      // Call Gemini API
      const response = await callGeminiAPI(session.baseContext, userMessage, chatHistory)
      
      return { success: true, response }
    } catch (error) {
      console.error('Gemini API error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

