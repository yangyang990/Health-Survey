import express from 'express'
import { calculateResult } from '../src/lib/scoring.js'
import { insertSubmission } from './db.js'
import adminRouter from './admin.js'

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i

async function verifyCaptcha(token) {
  if (!RECAPTCHA_SECRET) return true
  if (!token) return false
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
  })
  const body = await res.json()
  return body.success === true
}

function validateForm(form) {
  if (!form || typeof form !== 'object') return 'Invalid form'
  if (!form.name || !form.phone || form.age === '' || form.age == null) return 'Missing required field'
  if (!EMAIL_RE.test(form.email || '')) return 'Invalid email address'
  if (!Array.isArray(form.userSelect) || form.userSelect.length === 0) return 'Invalid form'
  for (const section of form.userSelect) {
    if (!Array.isArray(section.option)) return 'Invalid form'
    for (const opt of section.option) {
      if (!Number.isInteger(opt.value) || opt.value < 0 || opt.value > 4) return 'Please select an option'
    }
  }
  return null
}

const app = express()
// Behind a host's proxy: needed for the real visitor IP (login lockout) and https detection
if (process.env.TRUST_PROXY || process.env.VERCEL) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1)
app.use(express.json({ limit: '200kb' }))

app.post('/api/form/submit', async (req, res) => {
  try {
    const { form, captcha } = req.body || {}

    const invalid = validateForm(form)
    if (invalid) return res.json({ success: false, message: invalid })

    if (!(await verifyCaptcha(captcha))) {
      return res.json({ success: false, message: 'Captcha verification failed' })
    }

    const { totalScore, sectionScore, resultTxt } = calculateResult(form)
    await insertSubmission({
      name: form.name,
      phone: form.phone,
      email: form.email,
      age: form.age,
      language: form.language,
      totalScore,
      result: resultTxt,
      sectionScore,
      userSelect: form.userSelect,
    })

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.json({ success: false, message: 'Connection Error' })
  }
})

app.use('/api/admin', adminRouter)

app.use('/api', (err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, message: 'Connection Error' })
})

export default app
