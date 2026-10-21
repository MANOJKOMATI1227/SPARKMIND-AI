import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

/**
 * =========================================================================
 * 🔑 1. FIRST / PRIMARY GEMINI API KEY
 * =========================================================================
 */
export const PRIMARY_GEMINI_API_KEY_IN_CODE = process.env.GEMINI_API_KEY || '';

/**
 * =========================================================================
 * 🔑 2. SPARE / BACKUP GEMINI API KEYS
 * =========================================================================
 * Failover backup keys configured in environment variables.
 */
export const SPARE_GEMINI_API_KEYS_IN_CODE: string[] = [
  process.env.GEMINI_API_KEY_2 || '',
  process.env.GEMINI_API_KEY_3 || '',
].filter(Boolean);

export const SPARE_GEMINI_API_KEY_IN_CODE = SPARE_GEMINI_API_KEYS_IN_CODE[0] || '';
export const SPARE_GEMINI_API_KEY_2_IN_CODE = SPARE_GEMINI_API_KEYS_IN_CODE[1] || '';

export interface ApiKeyRecord {
  index: number; // 1 = Primary, 2 = Spare
  name: string;
  rawKey: string;
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

const DATA_DIR = path.resolve(process.cwd(), '.data');
const KEYS_FILE = path.join(DATA_DIR, 'admin_keys.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'admin_notifications.json');

function maskApiKey(key?: string): string {
  if (!key || key.length < 8) return '';
  if (key === 'MY_GEMINI_API_KEY') return 'NOT_SET';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

class ApiKeyManager {
  private key1: string = '';
  private key2: string = '';
  private spareKeys: string[] = [];
  private activeKeyIndex: number = 1;
  private key1Stats = {
    quotaHits: 0,
    totalRequests: 0,
    successfulRequests: 0,
    status: 'active' as 'active' | 'quota_exhausted' | 'standby' | 'not_configured',
    lastUsedAt: undefined as string | undefined,
    lastQuotaHitAt: undefined as string | undefined,
    lastErrorMessage: undefined as string | undefined,
  };
  private key2Stats = {
    quotaHits: 0,
    totalRequests: 0,
    successfulRequests: 0,
    status: 'standby' as 'active' | 'quota_exhausted' | 'standby' | 'not_configured',
    lastUsedAt: undefined as string | undefined,
    lastQuotaHitAt: undefined as string | undefined,
    lastErrorMessage: undefined as string | undefined,
  };
  private notifications: AdminNotification[] = [];
  private clients: Map<string, GoogleGenAI> = new Map();

  constructor() {
    this.initDirectories();
    this.loadState();
  }

  private initDirectories() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('[ApiKeyManager] Failed to create data dir:', e);
    }
  }

  private loadState() {
    // 1. Resolve keys from environment variables and in-code constants
    const envKey1 = (
      PRIMARY_GEMINI_API_KEY_IN_CODE ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      ''
    ).trim();

    const spareList = [
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      ...SPARE_GEMINI_API_KEYS_IN_CODE,
    ]
      .filter(Boolean)
      .map((k) => k!.trim())
      .filter((k, idx, arr) => k && k !== 'MY_GEMINI_API_KEY' && arr.indexOf(k) === idx);

    this.spareKeys = spareList;
    this.key1 = envKey1;
    this.key2 = this.spareKeys[0] || '';

    // 2. Load custom admin keys if saved
    try {
      if (fs.existsSync(KEYS_FILE)) {
        const raw = fs.readFileSync(KEYS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.key1) this.key1 = parsed.key1;
        if (parsed.key2) this.key2 = parsed.key2;
        if (parsed.activeKeyIndex) this.activeKeyIndex = parsed.activeKeyIndex;
        if (parsed.key1Stats) this.key1Stats = { ...this.key1Stats, ...parsed.key1Stats };
        if (parsed.key2Stats) this.key2Stats = { ...this.key2Stats, ...parsed.key2Stats };
      }
    } catch (e) {
      console.warn('[ApiKeyManager] Failed to load keys from file:', e);
    }

    // 3. Load notifications
    try {
      if (fs.existsSync(NOTIFICATIONS_FILE)) {
        const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
        this.notifications = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[ApiKeyManager] Failed to load notifications from file:', e);
    }

    // Update statuses based on whether keys are set
    if (!this.key1 || this.key1 === 'MY_GEMINI_API_KEY') {
      this.key1Stats.status = 'not_configured';
    } else if (this.key1Stats.status !== 'quota_exhausted') {
      this.key1Stats.status = 'active';
    }

    if (!this.key2 || this.key2 === 'MY_GEMINI_API_KEY') {
      this.key2Stats.status = 'not_configured';
    } else if (this.key1Stats.status === 'quota_exhausted') {
      this.key2Stats.status = 'active';
      this.activeKeyIndex = 2;
    } else {
      this.key2Stats.status = 'standby';
    }
  }

  private persistState() {
    try {
      this.initDirectories();
      fs.writeFileSync(
        KEYS_FILE,
        JSON.stringify(
          {
            key1: this.key1,
            key2: this.key2,
            activeKeyIndex: this.activeKeyIndex,
            key1Stats: this.key1Stats,
            key2Stats: this.key2Stats,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (e) {
      console.warn('[ApiKeyManager] Failed to save keys file:', e);
    }
  }

  private persistNotifications() {
    try {
      this.initDirectories();
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(this.notifications, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[ApiKeyManager] Failed to save notifications file:', e);
    }
  }

  public getClientForKey(rawKey: string): GoogleGenAI {
    if (!this.clients.has(rawKey)) {
      this.clients.set(rawKey, new GoogleGenAI({ apiKey: rawKey }));
    }
    return this.clients.get(rawKey)!;
  }

  public isQuotaError(err: any): boolean {
    if (!err) return false;
    const str = String(err?.message || err?.status || err?.code || err).toLowerCase();
    // 503 Service Unavailable / High Demand is temporary upstream model capacity, NOT a key quota limit
    if (str.includes('503') || str.includes('high demand') || str.includes('unavailable')) {
      return false;
    }
    return (
      str.includes('429') ||
      str.includes('resource_exhausted') ||
      str.includes('quota') ||
      str.includes('rate_limit') ||
      str.includes('too many requests') ||
      str.includes('exhausted')
    );
  }

  public addNotification(notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>): AdminNotification {
    const full: AdminNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    this.notifications.unshift(full);
    // Keep last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    this.persistNotifications();
    return full;
  }

  public getNotifications(): AdminNotification[] {
    return this.notifications;
  }

  public markNotificationsRead(ids?: string[]) {
    if (!ids || ids.length === 0) {
      this.notifications.forEach((n) => (n.read = true));
    } else {
      const set = new Set(ids);
      this.notifications.forEach((n) => {
        if (set.has(n.id)) n.read = true;
      });
    }
    this.persistNotifications();
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.persistNotifications();
  }

  public clearAllNotifications() {
    this.notifications = [];
    this.persistNotifications();
  }

  public recordKeyQuotaHit(keyIndex: number, errorMsg: string) {
    const timeStr = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (keyIndex === 1) {
      this.key1Stats.status = 'quota_exhausted';
      this.key1Stats.quotaHits++;
      this.key1Stats.lastQuotaHitAt = timeStr;
      this.key1Stats.lastErrorMessage = errorMsg;

      const hasSpare = !!(this.key2 && this.key2 !== 'MY_GEMINI_API_KEY');
      if (hasSpare) {
        this.activeKeyIndex = 2;
        this.key2Stats.status = 'active';
      }

      console.warn(`[ApiKeyManager] ⚠️ Gemini API rate limit hit at ${formattedTime}! Failover triggered: ${hasSpare ? 'Engaging backup key in code' : 'No spare key in code'}`);

      // Send alert notification to the Admin Console
      this.addNotification({
        type: 'key_quota_hit',
        severity: 'critical',
        title: '⚠️ API Rate Limit / Quota Exceeded (429)',
        message: hasSpare
          ? `Gemini API rate limit or quota exceeded (429 RESOURCE_EXHAUSTED) at ${formattedTime}. Spare key included in code automatically engaged to maintain uninterrupted user service.`
          : `Gemini API rate limit or quota exceeded (429 RESOURCE_EXHAUSTED) at ${formattedTime}.`,
        metadata: {
          error: errorMsg.slice(0, 300),
        },
      });
    } else {
      this.key2Stats.status = 'quota_exhausted';
      this.key2Stats.quotaHits++;
      this.key2Stats.lastQuotaHitAt = timeStr;
      this.key2Stats.lastErrorMessage = errorMsg;

      console.warn(`[ApiKeyManager] ⚠️ Spare Gemini API Key also hit quota limit at ${formattedTime}!`);

      this.addNotification({
        type: 'key_quota_hit',
        severity: 'critical',
        title: '🚨 Backup API Quota Exceeded',
        message: `Backup API limit reached at ${formattedTime}. All configured quota capacities have been exhausted.`,
        metadata: {
          error: errorMsg.slice(0, 300),
        },
      });
    }

    this.persistState();
  }

  public resetKeyQuotaStatus(keyIndex?: number) {
    if (!keyIndex || keyIndex === 1) {
      if (this.key1 && this.key1 !== 'MY_GEMINI_API_KEY') {
        this.key1Stats.status = 'active';
      }
      this.activeKeyIndex = 1;
      if (this.key2 && this.key2 !== 'MY_GEMINI_API_KEY') {
        this.key2Stats.status = 'standby';
      }
    }
    if (!keyIndex || keyIndex === 2) {
      if (this.key2 && this.key2 !== 'MY_GEMINI_API_KEY') {
        this.key2Stats.status = this.activeKeyIndex === 2 ? 'active' : 'standby';
      }
    }

    this.addNotification({
      type: 'key_recovered',
      severity: 'info',
      title: '✅ API Key Status Reset',
      message: `Admin manually reset API Key statuses. Primary Key #1 is now set to Active.`,
      metadata: {
        activeKeyIndex: this.activeKeyIndex,
      },
    });

    this.persistState();
  }

  public updateKeys(newKey1?: string, newKey2?: string) {
    if (newKey1 !== undefined) {
      this.key1 = newKey1.trim();
      process.env.GEMINI_API_KEY = this.key1;
      if (this.key1 && this.key1 !== 'MY_GEMINI_API_KEY') {
        this.key1Stats.status = 'active';
        this.activeKeyIndex = 1;
      } else {
        this.key1Stats.status = 'not_configured';
      }
    }

    if (newKey2 !== undefined) {
      this.key2 = newKey2.trim();
      process.env.GEMINI_API_KEY_2 = this.key2;
      if (this.key2 && this.key2 !== 'MY_GEMINI_API_KEY') {
        this.key2Stats.status = this.activeKeyIndex === 2 ? 'active' : 'standby';
      } else {
        this.key2Stats.status = 'not_configured';
      }
    }

    this.addNotification({
      type: 'system',
      severity: 'info',
      title: '🔑 API Keys Updated',
      message: `Administrator updated Gemini API keys in the Admin Console. Primary Key: ${this.key1 ? maskApiKey(this.key1) : 'None'}, Spare Key: ${this.key2 ? maskApiKey(this.key2) : 'None'}.`,
    });

    this.persistState();
  }

  public getKeysSummary(): {
    keys: ApiKeyRecord[];
    activeKeyIndex: number;
    hasSpareKey: boolean;
    failoverActive: boolean;
    unreadNotificationsCount: number;
  } {
    const k1Configured = !!(this.key1 && this.key1 !== 'MY_GEMINI_API_KEY');
    const k2Configured = !!(this.key2 && this.key2 !== 'MY_GEMINI_API_KEY');

    const keys: ApiKeyRecord[] = [
      {
        index: 1,
        name: 'Primary API Key (#1)',
        rawKey: this.key1,
        maskedKey: maskApiKey(this.key1),
        isConfigured: k1Configured,
        status: !k1Configured ? 'not_configured' : this.key1Stats.status,
        quotaHits: this.key1Stats.quotaHits,
        totalRequests: this.key1Stats.totalRequests,
        successfulRequests: this.key1Stats.successfulRequests,
        lastUsedAt: this.key1Stats.lastUsedAt,
        lastQuotaHitAt: this.key1Stats.lastQuotaHitAt,
        lastErrorMessage: this.key1Stats.lastErrorMessage,
      },
      {
        index: 2,
        name: 'Spare API Key (#2)',
        rawKey: this.key2,
        maskedKey: maskApiKey(this.key2),
        isConfigured: k2Configured,
        status: !k2Configured
          ? 'not_configured'
          : this.activeKeyIndex === 2
          ? 'active'
          : this.key2Stats.status,
        quotaHits: this.key2Stats.quotaHits,
        totalRequests: this.key2Stats.totalRequests,
        successfulRequests: this.key2Stats.successfulRequests,
        lastUsedAt: this.key2Stats.lastUsedAt,
        lastQuotaHitAt: this.key2Stats.lastQuotaHitAt,
        lastErrorMessage: this.key2Stats.lastErrorMessage,
      },
    ];

    const unreadCount = this.notifications.filter((n) => !n.read).length;

    return {
      keys,
      activeKeyIndex: this.activeKeyIndex,
      hasSpareKey: k2Configured,
      failoverActive: this.activeKeyIndex === 2 && this.key1Stats.status === 'quota_exhausted',
      unreadNotificationsCount: unreadCount,
    };
  }

  /**
   * Returns keys in execution order:
   * If Key 1 is quota exhausted and Key 2 is available, Key 2 is tried first.
   * Otherwise Key 1 is tried first, with Key 2 as fallback.
   */
  public getCandidateKeys(): Array<{ key: string; index: number; masked: string }> {
    const list: Array<{ key: string; index: number; masked: string }> = [];

    const k1Valid = !!(this.key1 && this.key1 !== 'MY_GEMINI_API_KEY');
    const validSpareKeys = this.spareKeys.filter((k) => k && k !== 'MY_GEMINI_API_KEY');

    // Check if Key 1 quota hit was recent (within 5 minutes)
    const k1HitRecently =
      this.key1Stats.status === 'quota_exhausted' &&
      this.key1Stats.lastQuotaHitAt &&
      Date.now() - new Date(this.key1Stats.lastQuotaHitAt).getTime() < 5 * 60 * 1000;

    if (k1HitRecently && validSpareKeys.length > 0) {
      // Prioritize spare keys during cooldown
      validSpareKeys.forEach((k, idx) => {
        list.push({ key: k, index: idx + 2, masked: maskApiKey(k) });
      });
      if (k1Valid) {
        list.push({ key: this.key1, index: 1, masked: maskApiKey(this.key1) });
      }
    } else {
      if (k1Valid) {
        list.push({ key: this.key1, index: 1, masked: maskApiKey(this.key1) });
      }
      validSpareKeys.forEach((k, idx) => {
        list.push({ key: k, index: idx + 2, masked: maskApiKey(k) });
      });
    }

    return list;
  }

  public recordRequest(index: number, success: boolean) {
    const now = new Date().toISOString();
    if (index === 1) {
      this.key1Stats.totalRequests++;
      this.key1Stats.lastUsedAt = now;
      if (success) this.key1Stats.successfulRequests++;
    } else if (index === 2) {
      this.key2Stats.totalRequests++;
      this.key2Stats.lastUsedAt = now;
      if (success) this.key2Stats.successfulRequests++;
    }
  }
}

export const apiKeyManager = new ApiKeyManager();
