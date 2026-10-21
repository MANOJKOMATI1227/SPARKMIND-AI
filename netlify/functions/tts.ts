import { generateSpeechAudio } from './lib/gemini.js';

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    let raw = event.body;
    if (event.isBase64Encoded && typeof raw === 'string') {
      raw = Buffer.from(raw, 'base64').toString('utf-8');
    }
    const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const { text, voice } = body || {};

    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Text is required for TTS synthesis.' }),
      };
    }

    const result = await generateSpeechAudio(text, voice);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: err?.message || 'TTS synthesis error occurred.',
      }),
    };
  }
};

export default async function (req: Request) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Text is required.' }), { status: 400, headers });
    }
    const result = await generateSpeechAudio(text, voice);
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'TTS error' }), { status: 200, headers });
  }
}
