export type WorkspaceType = 'general' | 'student' | 'developer' | 'founder' | 'business';

export type ReasoningMode = 'flash' | 'medium' | 'deep';

export type AgentType =
  | 'auto'
  | 'general'
  | 'tutor'
  | 'developer'
  | 'researcher'
  | 'analyst'
  | 'startup'
  | 'marketing'
  | 'writer'
  | 'pitch';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: string; // base64 payload
  text?: string; // extracted text content
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: AttachmentItem[];
  sources?: GroundingSource[];
  groundingType?: 'gemini' | 'file' | 'web';
  reasoningMode?: ReasoningMode;
  detectedLanguage?: string;
  liked?: boolean;
  disliked?: boolean;
  saved?: boolean;
  isPinned?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  workspace: WorkspaceType;
  agent: AgentType;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isTemporary?: boolean;
}

export type ImageQualityMode = 'fast' | 'high';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'email' | 'google' | 'github' | 'guest';
  preferredLanguage: string;
  preferredWorkspace: WorkspaceType;
  theme: 'light' | 'dark' | 'system';
  preferredModel?: string;
  imageQuality?: ImageQualityMode;
  createdAt: number;
}

export interface SavedAnswer {
  id: string;
  conversationId?: string;
  question: string;
  answer: string;
  timestamp: number;
  workspace: WorkspaceType;
  sources?: GroundingSource[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'study' | 'coding' | 'startup' | 'business' | 'writing' | 'translation' | 'career';
  prompt: string;
  description: string;
  workspace: WorkspaceType;
}

export interface ApiKeyRecord {
  index: number;
  name: string;
  maskedKey: string;
  isConfigured: boolean;
  status: 'active' | 'quota_exhausted' | 'standby' | 'not_configured';
  quotaHits: number;
  totalRequests: number;
  successfulRequests: number;
  lastUsedAt?: string;
  lastQuotaHitAt?: string;
  lastErrorMessage?: string;
}

export interface AdminNotification {
  id: string;
  type: 'key_quota_hit' | 'failover_activated' | 'key_recovered' | 'system';
  severity: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    failedKeyIndex?: number;
    failedKeyMasked?: string;
    activeKeyIndex?: number;
    activeKeyMasked?: string;
    model?: string;
    error?: string;
  };
}

export interface ApiKeysSummary {
  keys: ApiKeyRecord[];
  activeKeyIndex: number;
  hasSpareKey: boolean;
  failoverActive: boolean;
  unreadNotificationsCount: number;
}
