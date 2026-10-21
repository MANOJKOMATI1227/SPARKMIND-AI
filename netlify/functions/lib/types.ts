export interface AttachmentItem {
  id: string;
  name: string;
  type: string; // mime type
  size: number;
  data?: string; // base64 without prefix if image/audio
  text?: string; // text content if code, markdown, csv, or extracted pdf text
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  attachments?: AttachmentItem[];
  timestamp?: number;
}

export interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
  workspace?: 'general' | 'student' | 'developer' | 'founder' | 'business';
  agent?: string;
  mode?: 'flash' | 'medium' | 'deep';
  model?: string;
  imageQuality?: 'fast' | 'high';
  language?: string; // e.g. 'auto', 'en', 'te', 'hi', 'ta', etc.
  useWebGrounding?: boolean;
  attachments?: AttachmentItem[];
  userId?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface ChatResponseBody {
  success: boolean;
  reply?: string;
  modelUsed?: string;
  reasoningMode?: 'flash' | 'medium' | 'deep';
  detectedLanguage?: string;
  sources?: GroundingSource[];
  groundingType?: 'gemini' | 'file' | 'web';
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  error?: string;
}
