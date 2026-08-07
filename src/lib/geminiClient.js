// Gemini calls now go through our Express server — the API key never leaves the backend.
// No VITE_GEMINI_API_KEY needed in the frontend at all.

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Send a multi-turn conversation to Gemini via our secure backend proxy.
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {Promise<string>} The assistant's reply text
 */
export async function askGemini(messages) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Server error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.text) throw new Error('Empty response from server.');
  return data.text;
}