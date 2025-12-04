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

// Build the prompt with base context
const buildPrompt = (baseContext: string, userMessage: string): string => {
  return `다음 텍스트를 기반으로 질문에 답해주세요.

[선택된 텍스트]
${baseContext}

[질문]
${userMessage}

답변을 한국어로 제공해주세요. 명확하고 이해하기 쉽게 설명해주세요.`
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

  // Build conversation history
  const contents: GeminiMessage[] = []

  // Add chat history
  for (const msg of chatHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    })
  }

  // Add current message with context
  const prompt = chatHistory.length === 0 
    ? buildPrompt(baseContext, userMessage)
    : userMessage

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  })

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

