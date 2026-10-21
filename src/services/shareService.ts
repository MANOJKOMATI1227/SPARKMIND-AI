import { Conversation } from '../types/index.js';

export interface SharedChatRecord {
  id: string;
  title: string;
  conversation: Conversation;
  sharedBy?: string;
  sharedAt: number;
  messageCount: number;
}

const STORAGE_PREFIX = 'sparkmind_shared_chat_';

/**
 * Generate a clean unique share ID
 */
export function generateShareId(): string {
  return `share_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Save a shared conversation to server and localStorage
 */
export async function createShareLink(
  conversation: Conversation,
  options?: { sharedBy?: string }
): Promise<{ shareId: string; shareUrl: string }> {
  const shareId = generateShareId();
  const record: SharedChatRecord = {
    id: shareId,
    title: conversation.title || 'SparkMind AI Conversation',
    conversation: {
      ...conversation,
      id: shareId,
    },
    sharedBy: options?.sharedBy,
    sharedAt: Date.now(),
    messageCount: conversation.messages.length,
  };

  // 1. Save to local storage for local immediate lookup
  try {
    localStorage.setItem(STORAGE_PREFIX + shareId, JSON.stringify(record));
  } catch (err) {
    console.warn('Could not cache shared chat locally:', err);
  }

  // 2. Save to Express server endpoint
  try {
    await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch (err) {
    console.warn('Could not post shared chat to server:', err);
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
  return { shareId, shareUrl };
}

/**
 * Fetch a shared chat by ID
 */
export async function getSharedChat(shareId: string): Promise<SharedChatRecord | null> {
  // 1. Try server first
  try {
    const res = await fetch(`/api/share/${encodeURIComponent(shareId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.record) {
        return data.record;
      }
    }
  } catch (err) {
    console.warn('Server fetch for shared chat failed, checking local cache:', err);
  }

  // 2. Try localStorage
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + shareId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed parsing local shared chat:', err);
  }

  return null;
}

/**
 * Format conversation as clean Markdown
 */
export function formatChatToMarkdown(conversation: Conversation): string {
  const dateStr = new Date(conversation.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  let md = `# ${conversation.title || 'SparkMind AI Chat'}\n`;
  md += `*Shared on ${dateStr} • Workspace: ${conversation.workspace || 'General'}*\n\n---\n\n`;

  for (const msg of conversation.messages) {
    const roleName = msg.role === 'user' ? '🧑 **User**' : '⚡ **SparkMind AI**';
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    md += `### ${roleName} *(${time})*\n\n`;
    md += `${msg.content}\n\n`;

    if (msg.sources && msg.sources.length > 0) {
      md += `**Sources:**\n`;
      msg.sources.forEach((s) => {
        md += `- [${s.title}](${s.url})\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  }

  return md;
}

/**
 * Download text content as a file
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
