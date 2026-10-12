import ExcelJS from 'exceljs'
import { QUESTIONS, SELECTION } from '../src/data/questions.js'
import { allSubmissions } from './db.js'

const HEADERS = [
  'ID',
  'Submitted At',
  'Name',
  'Phone',
  'Email',
  'Age',
  'Language',
  'Total Score',
  'Result',
  ...QUESTIONS.map((group) => `${group.resultLabel} (total)`),
  ...QUESTIONS.flatMap((group) => group.question.map((q) => `${group.resultLabel}: ${q}`)),
]

// One row per stored response: details, totals, then every symptom rating
export async function buildWorkbook() {
  const rows = (await allSubmissions()).map((s) => [
    s.id,
    s.submitted_at,
    s.name,
    s.phone,
    s.email,
    s.age,
    s.language,
    s.total_score,
    s.result,
    ...s.section_scores,
    ...s.answers.flat(),
  ])

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Responses')
  sheet.addRow(HEADERS).font = { bold: true }
  rows.forEach((row) => sheet.addRow(row))
  sheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 1 }]
  sheet.columns.forEach((column, i) => (column.width = i < 9 ? 22 : 14))

  return { workbook, count: rows.length }
}

// A single response laid out top to bottom: details, then every symptom with its rating
export function buildResponseWorkbook(submission) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Response')
  const bold = (row) => (row.font = { bold: true })

  bold(sheet.addRow(['MSQ - MEDICAL SYMPTOM / TOXICITY QUESTIONNAIRE']))
  sheet.addRow([])
  for (const [label, value] of [
    ['ID', submission.id],
    ['Submitted At', submission.submitted_at],
    ['Name', submission.name],
    ['Phone', submission.phone],
    ['Email', submission.email],
    ['Age', submission.age],
    ['Language', submission.language],
    ['Total Score', submission.total_score],
    ['Result', submission.result],
  ]) {
    sheet.addRow([label, value]).getCell(1).font = { bold: true }
  }
  sheet.addRow([])
  bold(sheet.addRow(['Section', 'Symptom', 'Rating', 'Meaning']))

  QUESTIONS.forEach((group, t) => {
    group.question.forEach((symptom, a) => {
      const rating = submission.answers[t]?.[a]
      sheet.addRow([group.resultLabel, symptom, rating, SELECTION[rating] ?? ''])
    })
    bold(sheet.addRow([group.resultLabel, 'Section total', submission.section_scores[t]]))
  })

  sheet.columns.forEach((column, i) => (column.width = [22, 62, 12, 44][i]))
  sheet.eachRow((row) => (row.alignment = { horizontal: 'left' }))
  return workbook
}

export function responseFileName(submission) {
  const name = String(submission.name)
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `msq-response-${submission.id}${name ? '-' + name : ''}.xlsx`
}

export function exportFileName(extension) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `msq-responses-${stamp}.${extension}`
}
