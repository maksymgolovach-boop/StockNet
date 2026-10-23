/** RFC 4180 quoting; a BOM makes Excel open UTF-8 (diacritics) correctly. */
export function toCsv(rows: (string | number)[][], separator: ',' | ';'): string {
  const cell = (v: string | number) => {
    const s = String(v)
    return /["\n\r,;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + rows.map((r) => r.map(cell).join(separator)).join('\r\n')
}

export function downloadText(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
