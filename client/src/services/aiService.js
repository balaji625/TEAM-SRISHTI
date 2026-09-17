/**
 * aiService — CarePath AI
 *
 * Client-side wrapper for the AI chat API endpoint.
 * POST /api/user/ai/chat
 */

import api from './api';

/**
 * sendChatMessage
 * @param {string} message        - The user's question
 * @param {Array}  history        - Previous messages [{role, content}] for context
 * @param {string} lang           - Current language code: 'en' | 'hi' | 'te'
 * @returns {Promise<{answer: string, source: string}>}
 */
export const sendChatMessage = (message, history = [], lang = 'en') =>
  api.post('/user/ai/chat', { message, history, lang }).then((r) => r.data);
