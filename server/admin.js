import { Router } from 'express'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { allSubmissions, clearLoginAttempt, getLoginAttempt, getSubmission, setLoginAttempt } from './db.js'
import { buildResponseWorkbook, buildWorkbook, exportFileName, responseFileName } from './workbook.js'

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const MIN_PASSWORD_LENGTH = 10
const COOKIE = 'msq_admin'
const SESSION_MS = 8 * 60 * 60 * 1000
const MAX_FAILURES = 5
const LOCKOUT_MS = 15 * 60 * 1000

export const adminEnabled = ADMIN_PASSWORD.length >= MIN_PASSWORD_LENGTH
if (ADMIN_PASSWORD && !adminEnabled) {
  console.warn(`ADMIN_PASSWORD is shorter than ${MIN_PASSWORD_LENGTH} characters - admin page stays disabled.`)
}

const sha256 = (value) => createHash('sha256').update(String(value)).digest()
const passwordMatches = (input) => timingSafeEqual(sha256(input), sha256(ADMIN_PASSWORD))

// Sessions are stateless (no server memory to rely on when serverless): the cookie is
// "<expiry>.<signature>", signed with a key derived from the admin password.
const SESSION_KEY = sha256('msq-admin-session:' + ADMIN_PASSWORD)
const sign = (expiry) => createHmac('sha256', SESSION_KEY).update(String(expiry)).digest('hex')

function isAuthenticated(req) {
  const match = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([a-f0-9]{64})(?:;|$)`))
  if (!match) return false
  const [, expiry, signature] = match
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(expiry)))) return false
  return Number(expiry) > Date.now()
}

function setCookie(req, res, value, maxAgeSeconds) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https'
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`,
  )
}

function requireAdmin(req, res, next) {
  if (!adminEnabled || !isAuthenticated(req)) return res.status(401).json({ success: false, message: 'Not signed in' })
  next()
}

const router = Router()

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

router.get('/session', (req, res) => {
  res.json({ enabled: adminEnabled, authenticated: adminEnabled && isAuthenticated(req) })
})

router.post('/login', async (req, res) => {
  if (!adminEnabled) return res.status(403).json({ success: false, message: 'Admin page is not enabled' })

  const now = Date.now()
  const ip = req.ip || 'unknown'
  const attempts = await getLoginAttempt(ip)
  if (attempts && attempts.lockedUntil > now) {
    return res.status(429).json({ success: false, message: 'Too many attempts. Try again in 15 minutes.' })
  }

  if (!passwordMatches(req.body?.password ?? '')) {
    // A lock that has expired starts the count again
    const count = (attempts && attempts.lockedUntil === 0 ? attempts.count : 0) + 1
    await setLoginAttempt(ip, count, count >= MAX_FAILURES ? now + LOCKOUT_MS : 0)
    return res.status(401).json({ success: false, message: 'Incorrect password' })
  }

  if (attempts) await clearLoginAttempt(ip)
  const expiry = now + SESSION_MS
  setCookie(req, res, `${expiry}.${sign(expiry)}`, SESSION_MS / 1000)
  res.json({ success: true })
})

router.post('/logout', (req, res) => {
  setCookie(req, res, '', 0)
  res.json({ success: true })
})

router.get('/submissions', requireAdmin, async (req, res) => {
  res.json({ success: true, data: (await allSubmissions()).reverse() })
})

router.get('/submissions/:id/export', requireAdmin, async (req, res) => {
  const submission = await getSubmission(Number(req.params.id))
  if (!submission) return res.status(404).json({ success: false, message: 'Response not found' })
  const buffer = Buffer.from(await buildResponseWorkbook(submission).xlsx.writeBuffer())
  res.setHeader('Content-Type', XLSX_TYPE)
  res.setHeader('Content-Disposition', `attachment; filename="${responseFileName(submission)}"`)
  res.send(buffer)
})

router.get('/export', requireAdmin, async (req, res) => {
  const csv = req.query.format === 'csv'
  const { workbook } = await buildWorkbook()
  const buffer = Buffer.from(await (csv ? workbook.csv.writeBuffer() : workbook.xlsx.writeBuffer()))
  res.setHeader('Content-Type', csv ? 'text/csv; charset=utf-8' : XLSX_TYPE)
  res.setHeader('Content-Disposition', `attachment; filename="${exportFileName(csv ? 'csv' : 'xlsx')}"`)
  res.send(buffer)
})

export default router
