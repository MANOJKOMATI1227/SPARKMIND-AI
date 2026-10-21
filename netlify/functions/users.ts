export const handler = async (event: any, context?: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path || '';

  if (path.includes('heartbeat')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
    };
  }

  if (path.includes('check-access')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ allowed: true }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
};

export default handler;
