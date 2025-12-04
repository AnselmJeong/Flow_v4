import { getSettings } from './database'

interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[]
    }
  }[]
}

// Build first message with baseContext included
const buildFirstMessage = (baseContext: string, userMessage: string): string => {
  if (!baseContext || baseContext.trim().length === 0) {
    console.warn('baseContext is empty!')
    return userMessage
  }

  return `[참고할 텍스트]
${baseContext}

[질문]
${userMessage}

위의 "참고할 텍스트"를 반드시 참고하여 질문에 답변해주세요. 모든 요청(요약, 번역, 질문 등)은 위의 텍스트를 대상으로 합니다. 답변은 한국어로 제공해주세요.`
}

// Call Gemini API
export const callGeminiAPI = async (
  baseContext: string,
  userMessage: string,
  chatHistory: { role: 'user' | 'assistant'; message: string }[] = []
): Promise<string> => {
  const settings = getSettings()
  
  if (!settings.geminiApiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  }

  const model = settings.model || 'gemini-2.5-flash-preview-05-20'
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.geminiApiKey}`

  // Validate baseContext
  if (!baseContext || baseContext.trim().length === 0) {
    console.error('baseContext is empty in callGeminiAPI!')
    throw new Error('선택된 텍스트가 없습니다.')
  }

  // Build conversation history
  const contents: GeminiMessage[] = []

  if (chatHistory.length === 0) {
    // First message: include baseContext directly in the message
    const firstPrompt = buildFirstMessage(baseContext, userMessage)
    contents.push({
      role: 'user',
      parts: [{ text: firstPrompt }]
    })
    console.log('First message with baseContext, length:', firstPrompt.length)
  } else {
    // Subsequent messages: reconstruct conversation with baseContext in first message
    // Reconstruct the first user message with baseContext
    const firstUserMsg = chatHistory[0]
    if (firstUserMsg && firstUserMsg.role === 'user') {
      // First message with baseContext
      const firstPrompt = buildFirstMessage(baseContext, firstUserMsg.message)
      contents.push({
        role: 'user',
        parts: [{ text: firstPrompt }]
      })
      
      // Add all subsequent messages from history
      for (let i = 1; i < chatHistory.length; i++) {
        contents.push({
          role: chatHistory[i].role === 'user' ? 'user' : 'model',
          parts: [{ text: chatHistory[i].message }]
        })
      }
    } else {
      // Fallback: if first message is not user, just add all history
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.message }]
        })
      }
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    })
    
    console.log('Subsequent message, chat history length:', chatHistory.length)
    console.log('Current user message:', userMessage)
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API error:', errorData)
      throw new Error(errorData.error?.message || 'API 요청에 실패했습니다.')
    }

    const data = await response.json() as GeminiResponse

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('응답을 생성할 수 없습니다.')
    }

    const responseText = data.candidates[0].content.parts
      .map(part => part.text)
      .join('')

    return responseText
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Gemini API 호출 중 오류가 발생했습니다.')
  }
}

