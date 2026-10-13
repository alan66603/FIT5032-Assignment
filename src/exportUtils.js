import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

/**
 * Export helpers (BR E.4): turn table rows into a CSV or PDF file.
 *
 * Every export describes its columns the same way:
 *   [{ header: 'Project', value: (row) => row.project }, ...]
 */

// "2026-10-14", for file names like grants-2026-10-14.csv
export const todayStamp = () => new Date().toISOString().slice(0, 10)

// --- CSV ---

// Wrap every value in quotes and double any quotes inside it, so commas,
// quotes and line breaks in the data don't break the columns.
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

export function toCsv(rows, columns) {
  const header = columns.map((column) => csvCell(column.header)).join(',')
  const lines = rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(','))
  return [header, ...lines].join('\r\n')
}

// Make the browser download a file we built in memory.
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadCsv(filename, rows, columns) {
  // "\uFEFF" (a byte order mark) tells Excel the file is UTF-8, so it shows accents and symbols correctly.
  downloadBlob(filename, new Blob(['\uFEFF' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' }))
}

// --- PDF ---

// jsPDF's built-in font only has basic characters, so swap curly quotes and
// dashes for plain ones before they reach the PDF.
const pdfText = (value) =>
  String(value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')

export function buildPdf(title, rows, columns) {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(16)
  doc.text(pdfText(title), 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(`GreenRoots Melbourne - exported ${new Date().toLocaleString('en-AU')} - ${rows.length} rows`, 14, 22)

  // autoTable draws the rows as a table and adds pages when needed.
  autoTable(doc, {
    startY: 27,
    head: [columns.map((column) => pdfText(column.header))],
    body: rows.map((row) => columns.map((column) => pdfText(column.value(row)))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [31, 81, 53] }, // the site's dark green
    alternateRowStyles: { fillColor: [240, 246, 241] },
  })
  return doc
}

export function downloadPdf(filename, title, rows, columns) {
  buildPdf(title, rows, columns).save(filename)
}

// The PDF as base64 text, ready to send as an email attachment.
export function pdfAsBase64(title, rows, columns) {
  return buildPdf(title, rows, columns).output('datauristring').split(',')[1]
}

// --- Columns shared by every grants export ---

const formatIsoDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// Rows need averageRating (0 when there are none) and ratingCount.
export const GRANT_COLUMNS = [
  { header: 'Project', value: (grant) => grant.project },
  { header: 'Suburb', value: (grant) => grant.suburb },
  { header: 'Amount (AUD)', value: (grant) => grant.amount },
  { header: 'Status', value: (grant) => grant.status },
  { header: 'Applied', value: (grant) => formatIsoDate(grant.date) },
  { header: 'Average rating', value: (grant) => (grant.ratingCount ? grant.averageRating.toFixed(1) : '') },
  { header: 'Ratings', value: (grant) => grant.ratingCount },
  { header: 'Description', value: (grant) => grant.description },
]
