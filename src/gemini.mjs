// Author: Hj

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let { pathname, search } = url;

    if (request.method === 'OPTIONS') {
      return handleOPTIONS();
    }

    const errHandler = (err) => {
      console.error(err);
      return new Response(
        JSON.stringify({
          error: {
            message: err.message,
            code: err.status || 500,
            status: 'PROXY_ERROR',
          },
        }),
        fixCors({
          status: err.status ?? 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    };

    try {
      let apiKey =
        request.headers.get('x-goog-api-key') ||
        request.headers.get('Authorization')?.split(' ')[1];

      if (apiKey && apiKey.includes(',')) {
        const apiKeys = apiKey
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k);
        apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
        console.log(`Gemini Native Selected API Key: ${apiKey}`);
      }

      let bodyToForward = null;
      if (request.method === 'POST') {
        const body = await request.json();
        if (body.model) {
          pathname = pathname.replace(
            /\/models\/[^/:]+/,
            `/models/${body.model}`,
          );
          delete body.model;
        }
        bodyToForward = JSON.stringify(body);
      } else {
        bodyToForward = request.body;
      }

      const targetUrl = `https://generativelanguage.googleapis.com${pathname}${search}`;

      const headers = new Headers(request.headers);
      headers.set('Host', 'generativelanguage.googleapis.com');
      if (apiKey) {
        headers.set('x-goog-api-key', apiKey);
      }

      const toDelete = [
        'cf-ray',
        'cf-connecting-ip',
        'cf-visitor',
        'x-forwarded-for',
        'x-real-ip',
        'content-length',
      ];
      toDelete.forEach((h) => headers.delete(h));

      console.log(`Forwarding to Gemini: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: bodyToForward,
        redirect: 'follow',
      });

      const responseHeaders = new Headers(response.headers);
      const unsafeHeaders = [
        'transfer-encoding',
        'connection',
        'keep-alive',
        'content-encoding',
      ];
      unsafeHeaders.forEach((h) => responseHeaders.delete(h));

      return new Response(
        response.body,
        fixCors({
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        }),
      );
    } catch (err) {
      return errHandler(err);
    }
  },
};

const fixCors = ({ headers, status, statusText }) => {
  headers = new Headers(headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  headers.set('Access-Control-Allow-Headers', '*');
  return { headers, status, statusText };
};

const handleOPTIONS = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
};
