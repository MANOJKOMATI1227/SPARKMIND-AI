import { Conversation, SavedAnswer, UserProfile, WorkspaceType } from '../types/index.js';

const STORAGE_PREFIX = 'sparkmind_';

export function getStorageKey(key: string, userId: string = 'guest'): string {
  return `${STORAGE_PREFIX}${userId}_${key}`;
}

export function loadConversations(userId: string): Conversation[] {
  try {
    // 1. Primary check for this userId
    const primaryRaw = localStorage.getItem(getStorageKey('conversations', userId));
    if (primaryRaw) {
      const parsed = JSON.parse(primaryRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // 2. Fallbacks: check common keys
    const fallbackKeys = [
      getStorageKey('conversations', 'guest_user'),
      getStorageKey('conversations', 'guest'),
      `${STORAGE_PREFIX}conversations`,
      'sparkmind_conversations',
    ];

    for (const fbKey of fallbackKeys) {
      const fbRaw = localStorage.getItem(fbKey);
      if (fbRaw) {
        try {
          const parsed = JSON.parse(fbRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Mirror to current user key
            if (userId) {
              localStorage.setItem(getStorageKey('conversations', userId), JSON.stringify(parsed));
            }
            return parsed;
          }
        } catch {}
      }
    }

    // 3. Scan localStorage for any key ending in _conversations
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && key.endsWith('_conversations')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch {}
        }
      }
    }

    return [];
  } catch (e) {
    console.error('Failed to load conversations from localStorage:', e);
    return [];
  }
}

export function saveConversations(userId: string, conversations: Conversation[]): void {
  try {
    // Filter out temporary conversations before saving
    const persistent = conversations.filter((c) => !c.isTemporary);
    const json = JSON.stringify(persistent);
    if (userId) {
      localStorage.setItem(getStorageKey('conversations', userId), json);
    }
    // Also mirror to global backup key so conversations persist across login state changes
    localStorage.setItem(`${STORAGE_PREFIX}conversations`, json);
  } catch (e) {
    console.error('Failed to save conversations to localStorage:', e);
  }
}

export function loadSavedAnswers(userId: string): SavedAnswer[] {
  try {
    const raw = localStorage.getItem(getStorageKey('saved_answers', userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveSavedAnswers(userId: string, answers: SavedAnswer[]): void {
  try {
    localStorage.setItem(getStorageKey('saved_answers', userId), JSON.stringify(answers));
  } catch (e) {
    console.error('Failed to save saved answers:', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}active_user`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Default guest profile
  return {
    id: 'guest_user',
    name: 'SparkMind Explorer',
    email: 'guest@sparkmind.ai',
    provider: 'guest',
    preferredLanguage: 'en',
    preferredWorkspace: 'general',
    theme: 'dark',
    preferredModel: 'gemini-3.8-flash',
    imageQuality: 'high',
    createdAt: Date.now(),
  };
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}active_user`, JSON.stringify(profile));
  } catch (e) {}
}

export function clearUserConversations(userId: string): void {
  try {
    localStorage.removeItem(getStorageKey('conversations', userId));
  } catch (e) {}
}
