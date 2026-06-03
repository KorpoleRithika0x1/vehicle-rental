import { apiClient } from './client';

export async function sendChatMessage({ message, conversationHistory }) {
  const { data } = await apiClient.post(
    '/chat',
    {
      message,
      conversation_history: conversationHistory,
    },
    { timeout: 90000 },
  );
  return data;
}
