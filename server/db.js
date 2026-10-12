import { createClient } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS submissions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    submitted_at   TEXT NOT NULL,
    name           TEXT NOT NULL,
    phone          TEXT NOT NULL,
    email          TEXT NOT NULL,
    age            TEXT NOT NULL,
    language       TEXT,
    total_score    INTEGER NOT NULL,
    result         TEXT NOT NULL,
    section_scores TEXT NOT NULL,
    answers        TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS login_attempts (
    ip           TEXT PRIMARY KEY,
    count        INTEGER NOT NULL,
    locked_until INTEGER NOT NULL
  );
`

// Hosted database (Turso) when TURSO_DATABASE_URL is set, otherwise a local SQLite file
function createDbClient() {
  if (process.env.TURSO_DATABASE_URL) {
    return createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  }
  if (process.env.VERCEL) {
    throw new Error('Database not configured: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN')
  }
  mkdirSync(DATA_DIR, { recursive: true })
  return createClient({ url: 'file:' + path.join(DATA_DIR, 'health-survey.db') })
}

let ready
function db() {
  ready ??= (async () => {
    const client = createDbClient()
    await client.executeMultiple(SCHEMA)
    return client
  })().catch((e) => {
    ready = undefined
    throw e
  })
  return ready
}

const parseRow = (row) => ({
  ...row,
  section_scores: JSON.parse(row.section_scores),
  answers: JSON.parse(row.answers),
})

// sectionScore: [{ label, score }], userSelect: [{ resultLabel, option: [{ value }] }]
export async function insertSubmission({
  name,
  phone,
  email,
  age,
  language,
  totalScore,
  result,
  sectionScore,
  userSelect,
}) {
  const answers = userSelect.map((section) => section.option.map((opt) => opt.value))
  const res = await (
    await db()
  ).execute({
    sql: `INSERT INTO submissions
            (submitted_at, name, phone, email, age, language, total_score, result, section_scores, answers)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      new Date().toISOString(),
      String(name),
      String(phone),
      String(email),
      String(age),
      language ? String(language) : null,
      totalScore,
      result,
      JSON.stringify(sectionScore.map((s) => s.score)),
      JSON.stringify(answers),
    ],
  })
  return Number(res.lastInsertRowid)
}

export async function allSubmissions() {
  const res = await (await db()).execute('SELECT * FROM submissions ORDER BY id')
  return res.rows.map(parseRow)
}

export async function getSubmission(id) {
  const res = await (await db()).execute({ sql: 'SELECT * FROM submissions WHERE id = ?', args: [id] })
  return res.rows[0] ? parseRow(res.rows[0]) : null
}

export async function getLoginAttempt(ip) {
  const res = await (await db()).execute({ sql: 'SELECT * FROM login_attempts WHERE ip = ?', args: [ip] })
  return res.rows[0] ? { count: Number(res.rows[0].count), lockedUntil: Number(res.rows[0].locked_until) } : null
}

export async function setLoginAttempt(ip, count, lockedUntil) {
  await (
    await db()
  ).execute({
    sql: `INSERT INTO login_attempts (ip, count, locked_until) VALUES (?, ?, ?)
          ON CONFLICT(ip) DO UPDATE SET count = excluded.count, locked_until = excluded.locked_until`,
    args: [ip, count, lockedUntil],
  })
}

export async function clearLoginAttempt(ip) {
  await (await db()).execute({ sql: 'DELETE FROM login_attempts WHERE ip = ?', args: [ip] })
}
