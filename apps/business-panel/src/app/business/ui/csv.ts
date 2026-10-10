/** One CSV cell: quoted when it holds a comma, quote or line break (Excel-compatible). */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows to CSV text with a header row. A BOM is added so Excel reads ₹ and Indian names correctly. */
export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** Hands the CSV to the browser as a download. */
export function downloadCsv(filename: string, header: readonly string[], rows: readonly (readonly unknown[])[]): void {
  const url = URL.createObjectURL(new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
