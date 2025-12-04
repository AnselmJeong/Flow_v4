import { app, dialog } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Get app data directory
const getAppDataPath = () => {
  return path.join(app.getPath('userData'), 'books')
}

// Ensure books directory exists
const ensureBooksDirectory = async () => {
  const booksPath = getAppDataPath()
  try {
    await fs.mkdir(booksPath, { recursive: true })
  } catch (err) {
    console.error('Failed to create books directory:', err)
  }
  return booksPath
}

export interface ImportedBook {
  id: string
  title: string
  author: string
  filePath: string
  coverPath?: string
  fileType: 'pdf' | 'epub'
  totalPages?: number
  createdAt: string
  updatedAt: string
}

// Open file dialog
export const openFileDialog = async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'eBooks', extensions: ['pdf', 'epub'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'EPUB', extensions: ['epub'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

// Import a file
export const importFile = async (sourcePath: string): Promise<ImportedBook> => {
  const booksPath = await ensureBooksDirectory()
  const bookId = uuidv4()
  const bookDir = path.join(booksPath, bookId)
  
  // Create book directory
  await fs.mkdir(bookDir, { recursive: true })

  // Get file extension and name
  const ext = path.extname(sourcePath).toLowerCase().slice(1) as 'pdf' | 'epub'
  const originalName = path.basename(sourcePath)
  const destPath = path.join(bookDir, originalName)

  // Copy file to app data
  await fs.copyFile(sourcePath, destPath)

  // Extract metadata
  const metadata = await extractMetadata(destPath, ext)

  const now = new Date().toISOString()

  return {
    id: bookId,
    title: metadata.title || path.basename(sourcePath, path.extname(sourcePath)),
    author: metadata.author || 'Unknown Author',
    filePath: destPath,
    coverPath: metadata.coverPath,
    fileType: ext,
    totalPages: metadata.totalPages,
    createdAt: now,
    updatedAt: now
  }
}

// Extract metadata from PDF or EPUB
const extractMetadata = async (
  filePath: string, 
  fileType: 'pdf' | 'epub'
): Promise<{
  title?: string
  author?: string
  coverPath?: string
  totalPages?: number
}> => {
  try {
    if (fileType === 'pdf') {
      return extractPdfMetadata(filePath)
    } else {
      return extractEpubMetadata(filePath)
    }
  } catch (err) {
    console.error('Failed to extract metadata:', err)
    return {}
  }
}

// Extract PDF metadata (basic implementation)
const extractPdfMetadata = async (filePath: string): Promise<{
  title?: string
  author?: string
  totalPages?: number
}> => {
  // For now, return basic info
  // Full implementation would use pdf-parse or similar
  const fileName = path.basename(filePath, '.pdf')
  return {
    title: fileName,
    author: undefined,
    totalPages: undefined
  }
}

// Extract EPUB metadata (basic implementation)
const extractEpubMetadata = async (filePath: string): Promise<{
  title?: string
  author?: string
  coverPath?: string
}> => {
  // For now, return basic info
  // Full implementation would parse the EPUB's OPF file
  const fileName = path.basename(filePath, '.epub')
  return {
    title: fileName,
    author: undefined,
    coverPath: undefined
  }
}

// Delete a book
export const deleteBook = async (bookId: string, filePath: string): Promise<boolean> => {
  try {
    const bookDir = path.dirname(filePath)
    await fs.rm(bookDir, { recursive: true, force: true })
    return true
  } catch (err) {
    console.error('Failed to delete book:', err)
    return false
  }
}

