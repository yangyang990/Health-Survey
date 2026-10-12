// Local / self-hosted entry point. On Vercel the app is served through api/index.js instead.
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './app.js'
import { adminEnabled } from './admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')

// In dev, PORT belongs to the Vite server, so the API only looks at API_PORT.
// In production the host assigns PORT and this one process serves everything.
const DEV = process.argv.includes('--dev')
const PORT = (DEV ? undefined : process.env.PORT) || process.env.API_PORT || 3001

// Production: serve the built client, with index.html for client-side routes
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.use((req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
  console.log(adminEnabled ? 'Admin page enabled at /admin' : 'Admin page disabled (set ADMIN_PASSWORD to enable)')
})
