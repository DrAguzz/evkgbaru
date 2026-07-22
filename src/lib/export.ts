import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (row: T) => string | number;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cell<T>(row: T, col: ExportColumn<T>): string {
  const raw = col.format ? col.format(row) : (row as Record<string, unknown>)[col.key as string];
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

export function exportCSV<T>(rows: T[], cols: ExportColumn<T>[], filename: string) {
  const header = cols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
  const body = rows
    .map((r) => cols.map((c) => `"${cell(r, c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const csv = `${header}\n${body}`;
  download(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export function exportExcel<T>(rows: T[], cols: ExportColumn<T>[], filename: string, sheet = "Report") {
  const data = rows.map((r) => {
    const out: Record<string, string | number> = {};
    cols.forEach((c) => {
      const raw = c.format ? c.format(r) : (r as Record<string, unknown>)[c.key as string];
      out[c.header] = (raw as string | number) ?? "";
    });
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 30));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF<T>(
  rows: T[],
  cols: ExportColumn<T>[],
  filename: string,
  meta: { title: string; subtitle?: string },
) {
  const doc = new jsPDF({ orientation: cols.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text("EVRide", 14, 16);
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(meta.title, 14, 22);
  if (meta.subtitle) {
    doc.setFontSize(9);
    doc.text(meta.subtitle, 14, 27);
  }
  autoTable(doc, {
    startY: 32,
    head: [cols.map((c) => c.header)],
    body: rows.map((r) => cols.map((c) => cell(r, c))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
    theme: "grid",
  });
  doc.save(`${filename}.pdf`);
}
