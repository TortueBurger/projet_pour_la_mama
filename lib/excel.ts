import * as XLSX from "xlsx";
import { MatchRow } from "./ocr";

/**
 * Builds an Excel workbook with:
 *   Column G = club + "----"
 *   Column H = "MANQUE DELEGUE MATCH " + match
 *
 * Columns A–F are intentionally left empty so the output
 * matches the layout described by the user.
 */
export function buildExcelBuffer(rows: MatchRow[]): Buffer {
  const worksheetData: (string | null)[][] = [
    // Header row
    [null, null, null, null, null, null, "G", "H"],
    // Data rows
    ...rows.map((row) => [
      null,
      null,
      null,
      null,
      null,
      null,
      `${row.club}----`,
      `MANQUE DELEGUE MATCH ${row.match}`,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for readability
  worksheet["!cols"] = [
    { wch: 5 },  // A
    { wch: 5 },  // B
    { wch: 5 },  // C
    { wch: 5 },  // D
    { wch: 5 },  // E
    { wch: 5 },  // F
    { wch: 18 }, // G
    { wch: 38 }, // H
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Délégués");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}
