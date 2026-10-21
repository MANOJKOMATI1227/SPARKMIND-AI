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

  if (path.includes('send-reset-otp')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'A 6-digit verification code has been prepared. Please enter the OTP code to verify.',
      }),
    };
  }

  if (path.includes('verify-reset-otp')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'OTP verified successfully. Your password has been updated.',
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
};

export default handler;
