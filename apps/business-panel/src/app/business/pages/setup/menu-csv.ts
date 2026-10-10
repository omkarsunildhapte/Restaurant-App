import type { DietType } from '../../data/db';

/** One menu row from a spreadsheet: category, name, price, and optionally type, GST %, description. */
export interface CsvMenuRow {
  line: number;
  category: string;
  name: string;
  price: number;
  diet: DietType;
  gst: number | null;
  description: string | null;
}

export interface CsvResult {
  rows: CsvMenuRow[];
  problems: string[];
}

export const CSV_TEMPLATE =
  'category,name,price,type,gst,description\n' +
  'Starters,Paneer Tikka,280,veg,5,Charred cottage cheese\n' +
  'Starters,Chicken 65,310,non-veg,5,\n' +
  'Drinks,Masala Chai,40,veg,5,\n';

/** RFC 4180-style split: commas inside "quotes" and "" escapes. */
export function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export function diet(value: string): DietType | null {
  const v = value.trim().toLowerCase().replace(/[\s_]/g, '-');
  if (!v || v === 'veg' || v === 'v' || v === 'vegetarian') return 'veg';
  if (v === 'egg' || v === 'e' || v === 'eggetarian') return 'egg';
  if (['non-veg', 'nonveg', 'nv', 'n', 'non-vegetarian'].includes(v)) return 'non_veg';
  return null;
}

/** Reads the spreadsheet text; the first row must hold the column names. */
export function parseMenuCsv(text: string): CsvResult {
  const table = splitCsv(text.replace(/^﻿/, ''));
  const problems: string[] = [];
  if (table.length < 2) return { rows: [], problems: ['The file has no menu rows under the header.'] };

  const header = table[0]!.map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const c = {
    category: col('category', 'section'),
    name: col('name', 'item', 'item name'),
    price: col('price', 'rate', 'mrp'),
    diet: col('type', 'diet', 'veg'),
    gst: col('gst', 'gst %', 'tax'),
    description: col('description', 'details'),
  };
  if (c.category < 0 || c.name < 0 || c.price < 0) {
    return { rows: [], problems: ['The first row must name the columns: category, name, price (type, gst and description are optional).'] };
  }

  const rows: CsvMenuRow[] = [];
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (index: number) => (index >= 0 ? (cells[index] ?? '').trim() : '');
    const category = get(c.category);
    const name = get(c.name);
    const price = Number(get(c.price).replace(/[₹,\s]/g, ''));
    const d = diet(get(c.diet));
    const gstText = get(c.gst).replace('%', '');
    const gst = gstText ? Number(gstText) : null;

    if (!category || !name) return problems.push(`Line ${line}: category and name are required.`);
    if (!Number.isFinite(price) || price < 0) return problems.push(`Line ${line} (${name}): price "${get(c.price)}" is not a number.`);
    if (!d) return problems.push(`Line ${line} (${name}): type must be veg, egg or non-veg.`);
    if (gst !== null && (!Number.isFinite(gst) || gst < 0 || gst > 28)) return problems.push(`Line ${line} (${name}): GST must be 0 to 28.`);
    rows.push({ line, category, name, price, diet: d, gst, description: get(c.description) || null });
    return undefined;
  });
  return { rows, problems };
}
