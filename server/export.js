// Exports every stored response to a spreadsheet in data/exports.
//   npm run export            -> .xlsx
//   npm run export -- --csv   -> .csv
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DATA_DIR } from './db.js'
import { buildWorkbook, exportFileName } from './workbook.js'

const asCsv = process.argv.includes('--csv')
const { workbook, count } = await buildWorkbook()

const exportDir = path.join(DATA_DIR, 'exports')
mkdirSync(exportDir, { recursive: true })
const file = path.join(exportDir, exportFileName(asCsv ? 'csv' : 'xlsx'))

if (asCsv) await workbook.csv.writeFile(file)
else await workbook.xlsx.writeFile(file)

console.log(`Exported ${count} response(s) to ${file}`)
