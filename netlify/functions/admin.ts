export const handler = async (event: any, context?: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path || '';

  // Admin stats
  if (path.includes('stats')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalRequests: 124,
        totalTokens: 25420,
        activeKeyIndex: 1,
        key1QuotaReached: false,
        key2InUse: false,
        key1FailureCount: 0,
        key2FailureCount: 0,
        cacheHitRate: '94.2%',
        uptime: '99.98%',
      }),
    };
  }

  // Admin API Keys summary
  if (path.includes('api-keys')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        key1Configured: true,
        key2Configured: true,
        key1Masked: 'AIzaSy...Xe4w',
        key2Masked: 'AIzaSy...7B9q',
        activeKeyIndex: 1,
        key1Status: 'active',
        key2Status: 'standby',
        lastFailoverAt: null,
      }),
    };
  }

  // Admin Notifications
  if (path.includes('notifications')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        notifications: [
          {
            id: 'notif_welcome_admin',
            title: 'SparkMind Console Ready',
            message: 'All Gemini API and Firestore telemetry systems are operational.',
            type: 'info',
            timestamp: new Date().toISOString(),
            read: true,
          },
        ],
      }),
    };
  }

  // Admin verify credentials
  if (path.includes('verify-credentials')) {
    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {}
    const username = (body.username || '').toLowerCase().trim();
    const password = (body.password || '').trim();

    const isMatch =
      (username === 'admin@sparkmind.ai' || username === 'admin' || username === 'komatimanojkumar1227@gmail.com') &&
      password === 'sparkmind2026';

    if (isMatch) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, username }),
      };
    }

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid administrator credentials' }),
    };
  }

  // Default admin response
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
};

export default handler;
