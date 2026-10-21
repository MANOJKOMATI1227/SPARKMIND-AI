interface RateLimitRecord {
  timestamps: number[];
  count: number;
}

const windowMs = 60 * 1000; // 1 minute window
const maxRequestsPerWindow = 40; // 40 requests per minute per IP/User

const clientRequests = new Map<string, RateLimitRecord>();

// Global usage statistics for admin dashboard
export interface GlobalStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  webGroundingCount: number;
  fileGroundingCount: number;
  languagesUsed: Record<string, number>;
  workspacesUsed: Record<string, number>;
  startedAt: number;
}

export const globalStats: GlobalStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitHits: 0,
  webGroundingCount: 0,
  fileGroundingCount: 0,
  languagesUsed: {},
  workspacesUsed: {},
  startedAt: Date.now(),
};

/**
 * Check if the request is within allowable rate limits
 */
export function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = clientRequests.get(clientId) || { timestamps: [], count: 0 };

  // Remove timestamps older than windowMs
  const recentTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (recentTimestamps.length >= maxRequestsPerWindow) {
    globalStats.rateLimitHits++;
    return {
      allowed: false,
      remaining: 0,
    };
  }

  recentTimestamps.push(now);
  clientRequests.set(clientId, {
    timestamps: recentTimestamps,
    count: record.count + 1,
  });

  return {
    allowed: true,
    remaining: maxRequestsPerWindow - recentTimestamps.length,
  };
}

/**
 * Clean up old rate limit entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of clientRequests.entries()) {
    const fresh = value.timestamps.filter((ts) => now - ts < windowMs);
    if (fresh.length === 0) {
      clientRequests.delete(key);
    } else {
      clientRequests.set(key, { timestamps: fresh, count: value.count });
    }
  }
}, 5 * 60 * 1000).unref();
