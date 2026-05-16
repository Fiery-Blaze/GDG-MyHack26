import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export interface AgentResponse {
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
  intent?: string;
  agent?: string;
}

export const agentApi = {
  ask: (message: string, context?: Record<string, unknown>) =>
    api.post<AgentResponse>('/agents/ask', { message, context }),

  run: (intent: string, payload: Record<string, unknown>, context?: Record<string, unknown>) =>
    api.post<AgentResponse>('/agents/run', { intent, payload, context }),

  intents: () => api.get<{ intents: string[] }>('/agents/intents'),

  health: () => api.get('/agents/health'),
};

export default api;
