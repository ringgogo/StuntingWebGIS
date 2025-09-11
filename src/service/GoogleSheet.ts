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
  if (values.length === 0) return [];

  // header rows (may be shorter/longer); fallback to empty arrays
  const headerRow1: string[] = (values[0] || []).map((c: any) => (c == null ? "" : String(c)));
  const headerRow2: string[] = (values[1] || []).map((c: any) => (c == null ? "" : String(c)));

  // compute number of columns from all rows so we don't miss columns
  const numCols = Math.max(
    headerRow1.length,
    headerRow2.length,
    ...values.map((r: any[]) => (r ? r.length : 0))
  );

  // default children order for the 5 parent blocks (7 children)
  const defaultChildren = ["Suntik", "Pil", "Kondom", "Implan", "IUD", "MOP", "MOW"];

  // parent blocks (0-based indices): C-I, J-P, Q-W, X-AD, AE-AK
  // A=0, B=1, C=2 ...
  const parentBlocks: { start: number; end: number }[] = [
    { start: 2, end: 8 },   // C-I  => KBPP
    { start: 9, end: 15 },  // J-P  => KB BARU
    { start: 16, end: 22 }, // Q-W  => GANTI CARA
    { start: 23, end: 29 }, // X-AD => ULANGAN
    { start: 30, end: 36 }, // AE-AK => KB AKTIF
  ];

  // Build headers array
  const headers: string[] = [];
  for (let i = 0; i < numCols; i++) {
    // raw texts (may be undefined)
    const topRaw = (headerRow1[i] ?? "").toString().trim();
    const childRaw = (headerRow2[i] ?? "").toString().trim();

    // check if this index belongs to one of the special parent blocks
    const block = parentBlocks.find((b) => i >= b.start && i <= b.end);

    if (block) {
      // prefer the parent label located at the block start (if any), else fallback to topRaw
      const parentLabel = (headerRow1[block.start] ?? "").toString().trim() || topRaw;
      // child label prefer childRaw, otherwise fallback to defaultChildren based on relative position
      const childLabel =
        childRaw ||
        defaultChildren[i - block.start] ||
        `child${i - block.start + 1}`;

      const key =
        parentLabel && parentLabel.length > 0
          ? `${parentLabel}_${childLabel}`
          : childLabel;

      headers[i] = sanitizeKey(key);
      continue;
    }

    // non-special columns: reuse previous behavior (top + child => combined)
    if (topRaw && childRaw) {
      headers[i] = sanitizeKey(`${topRaw}_${childRaw}`);
    } else if (childRaw) {
      headers[i] = sanitizeKey(childRaw);
    } else if (topRaw) {
      headers[i] = sanitizeKey(topRaw);
    } else {
      headers[i] = `Column${i + 1}`;
    }
  }

  // Data rows start from row index 2 (zero-based) — i.e. values.slice(2)
  const dataRows = values.slice(2);

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
