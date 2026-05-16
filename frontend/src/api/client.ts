import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

export async function runAgent(intent: string, payload: Record<string, unknown>) {
  const res = await api.post('/agents/run', { intent, payload })
  return res.data
}

export async function askAgent(message: string) {
  const res = await api.post('/agents/ask', { message })
  return res.data
}
