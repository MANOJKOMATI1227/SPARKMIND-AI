import { processChatWithGemini } from './lib/gemini.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { ChatRequestBody } from './lib/types.js';

/**
 * Robust Netlify Function handler for SparkMind Chat API
 */
export const handler = async (event: any, context?: any) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-email',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Support GET as a health check
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        service: 'SparkMind Chat Function',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Reject unsupported HTTP methods
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method Not Allowed. Only POST requests are supported.',
      }),
    };
  }

  // Extract client identifier for rate limiting
  const clientIp =
    event.headers?.['x-forwarded-for'] ||
    event.headers?.['client-ip'] ||
    event.headers?.['x-user-id'] ||
    event.headers?.['x-user-email'] ||
    'anonymous-client';

  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Too many requests. Please wait a moment before sending another message.',
      }),
    };
  }

  // Parse and validate request body with base64 decoding support
  let body: ChatRequestBody;
  try {
    let raw = event.body;
    if (event.isBase64Encoded && typeof raw === 'string') {
      raw = Buffer.from(raw, 'base64').toString('utf-8');
    }
    body = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (parseError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Invalid JSON request payload.',
      }),
    };
  }

  // Process chat with Gemini or Neural Visual Engine securely on the server
  try {
    const result = await processChatWithGemini(body);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error('Server execution error in chat function:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: err?.message || 'Server error occurred while processing message.',
      }),
    };
  }
};

// Also export default for modern Netlify Functions (v2 syntax)
export default async function (req: Request) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-email',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', service: 'SparkMind Chat Function', timestamp: new Date().toISOString() }),
      { status: 200, headers }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed. Only POST requests are supported.' }),
      { status: 405, headers }
    );
  }

  try {
    const body: ChatRequestBody = await req.json();
    const result = await processChatWithGemini(body);
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Invalid request or server error.' }),
      { status: 200, headers }
    );
  }
}
