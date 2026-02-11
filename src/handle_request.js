import { handleVerification } from './verify_keys.js';
import openai from './openai.mjs';
import gemini from './gemini.mjs';

export async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/' || pathname === '/index.html') {
    return new Response(
      'Proxy is Running! More Details: https://github.com/boyxs/gemini-proxy',
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      },
    );
  }

  if (pathname === '/verify' && request.method === 'POST') {
    return handleVerification(request);
  }

  if (
    pathname.endsWith('/chat/completions') ||
    pathname.endsWith('/completions') ||
    pathname.endsWith('/embeddings') ||
    pathname.endsWith('/models')
  ) {
    return openai.fetch(request);
  }
  if (pathname.startsWith('/v1')) {
    return gemini.fetch(request);
  }

  return new Response('Not Found', { status: 404 });
}
