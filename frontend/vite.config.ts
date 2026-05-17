import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function readEnvFile(): Record<string, string> {
  const envPath = path.resolve(__dirname, '.env')
  if (!fs.existsSync(envPath)) return {}
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf16le').replace(/^﻿/, '')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#') && line.includes('='))
      .map(line => {
        const [key, ...rest] = line.split('=')
        return [key.trim(), rest.join('=').trim()]
      })
  )
}

const env = readEnvFile()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      env.VITE_GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
    ),
  },
})
