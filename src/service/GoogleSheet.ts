/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/fetchGoogleSheetData.ts
export interface SheetRow {
  [key: string]: string;
}

function sanitizeKey(s: string): string {
  return s
    .toString()
    .replace(/\r?\n|\t/g, " ")
    .trim()
    .replace(/\s+/g, "_")        // spaces -> underscore
    .replace(/[^a-zA-Z0-9_\-.]/g, ""); // keep alnum, underscore, dash, dot
}

export async function fetchGoogleSheetData(sheetName: string): Promise<SheetRow[]> {
  const SHEET_ID = import.meta.env.VITE_SHEET_ID;
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    throw new Error("Missing SHEET_ID or GOOGLE_API_KEY in .env");
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    sheetName
  )}?key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const json = await res.json();

  const values: string[][] = json.values || [];
  if (values.length < 6) return []; 

  // header ada di row ke-6 (index 5)
  const headerRow: string[] = (values[5] || []).map((c: any) =>
    c == null ? "" : String(c)
  );


  const numCols = Math.max(
    headerRow.length,
    ...values.map((r: any[]) => (r ? r.length : 0))
  );

  // bangun key/headers
  const headers: string[] = [];
  for (let i = 0; i < numCols; i++) {
    if (i === 0) {
      headers[i] = "No";                
    } else if (i === 1) {
      headers[i] = "Nama_Desa";        
    } else {
      const raw = (headerRow[i] ?? "").toString().trim();
      headers[i] = raw ? sanitizeKey(raw) : `Column${i + 1}`;
    }
  }
  // data rows mulai dari row ke-7 (index 6)
  const dataRows = values.slice(6);

  const result: SheetRow[] = dataRows.map((row: any[]) => {
    const obj: SheetRow = {};
    for (let i = 0; i < numCols; i++) {
      const key = headers[i] ?? `Column${i + 1}`;
      obj[key] = row && row[i] != null ? String(row[i]) : "";
    }
    return obj;
  });

  return result;
}
