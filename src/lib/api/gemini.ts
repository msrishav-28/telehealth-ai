import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Gemini features will be disabled.');
}

// Initialize the Gemini API
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Safety settings for medical content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH, // Lower threshold for medical content
  },
];

// Generation config for consistent responses
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

/**
 * Get Gemini model instance
 */
export function getGeminiModel() {
  if (!genAI) {
    throw new Error('Gemini API is not initialized. Please set GEMINI_API_KEY.');
  }
  
  return genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig,
    safetySettings,
  });
}

/**
 * Generate text using Gemini
 */
export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel();
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    if (error.message?.includes('SAFETY')) {
      throw new Error('Content was blocked by safety filters. Please rephrase your question.');
    }
    if (error.message?.includes('API_KEY')) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    }
    throw error;
  }
}

/**
 * Generate streaming text using Gemini
 */
export async function generateStreamingText(
  prompt: string,
  onChunk: (text: string) => void | Promise<void>
): Promise<void> {
  const model = getGeminiModel();
  
  try {
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      await onChunk(chunkText);
    }
  } catch (error: any) {
    if (error.message?.includes('SAFETY')) {
      throw new Error('Content was blocked by safety filters. Please rephrase your question.');
    }
    throw error;
  }
}

/**
 * Count tokens in text (approximation for Gemini)
 */
export async function countTokens(text: string): Promise<number> {
  const model = getGeminiModel();
  
  try {
    const result = await model.countTokens(text);
    return result.totalTokens;
  } catch (error) {
    // Fallback to rough estimation if count fails
    return Math.ceil(text.length / 4);
  }
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
  return !!GEMINI_API_KEY && !!genAI;
}

/**
 * Format prompt for medical context
 */
export function formatMedicalPrompt(
  systemPrompt: string,
  userMessage: string,
  context?: string
): string {
  return `
${systemPrompt}

${context ? `Context:\n${context}\n` : ''}

User Question: ${userMessage}

Please provide a helpful, accurate, and empathetic response following the medical guidelines above.
`;
}