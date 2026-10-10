import type { DietType } from '../../data/db';
import { diet as parseDiet, splitCsv } from './menu-csv';

/**
 * Petpooja menu export → Thaliyo menu.
 *
 * Built from Petpooja's commonly documented menu-export columns (Item Name, Category, Price,
 * Variation, Item Type / Attribute, GST %, Description). The exact headers vary by account and
 * export version, so several spellings are accepted; CHECK THE MAPPING AGAINST A REAL EXPORT
 * from a pilot café before relying on it. Excel files must be saved as CSV first.
 *
 * Rows with the same item name in the same category are one item; their Variation rows
 * (Half / Full, Regular / Large) become its sizes.
 */

export interface PetpoojaItem {
  category: string;
  name: string;
  diet: DietType;
  gst: number | null;
  description: string | null;
  /** Price when the item has no variations. */
  price: number;
  variants: { name: string; price: number }[];
}

export interface PetpoojaResult {
  items: PetpoojaItem[];
  problems: string[];
  /** Header names we recognised, for the preview ("Item Name → name"). */
  recognised: string[];
}

const COLUMNS = {
  name: ['item name', 'itemname', 'item', 'name', 'item_name'],
  category: ['category', 'category name', 'categoryname', 'category_name', 'item category'],
  price: ['price', 'item price', 'rate', 'base price', 'mrp'],
  variation: ['variation', 'variation name', 'variant', 'variant name', 'variation_name'],
  variationPrice: ['variation price', 'variant price', 'variation_price'],
  diet: ['item type', 'itemtype', 'attribute', 'item attribute', 'dietary', 'veg/non veg', 'veg/non-veg', 'type', 'food type'],
  gst: ['gst %', 'gst', 'gst(%)', 'gst percentage', 'tax %', 'tax', 'tax rate'],
  cgst: ['cgst %', 'cgst', 'cgst(%)'],
  sgst: ['sgst %', 'sgst', 'sgst(%)'],
  description: ['description', 'item description', 'item_description'],
} as const;

/** Petpooja attribute codes seen in exports: 1 veg, 2 non-veg, 3 egg. */
function petpoojaDiet(value: string): DietType | null {
  const v = value.trim();
  if (v === '1') return 'veg';
  if (v === '2') return 'non_veg';
  if (v === '3') return 'egg';
  return parseDiet(v);
}

function money(value: string): number {
  return Number(value.replace(/[₹,\s]|rs\.?/gi, ''));
}

function percent(value: string): number | null {
  const v = value.replace('%', '').trim();
  return v === '' ? null : Number(v);
}

export function parsePetpoojaCsv(text: string): PetpoojaResult {
  const table = splitCsv(text.replace(/^﻿/, ''));
  if (table.length < 2) return { items: [], problems: ['The file has no rows under the header.'], recognised: [] };

  const header = table[0]!.map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '));
  const find = (names: readonly string[]) => header.findIndex((h) => names.includes(h));
  const col = Object.fromEntries(Object.entries(COLUMNS).map(([k, names]) => [k, find(names)])) as Record<keyof typeof COLUMNS, number>;
  const recognised = (Object.keys(COLUMNS) as (keyof typeof COLUMNS)[])
    .filter((k) => col[k] >= 0)
    .map((k) => `${table[0]![col[k]]!.trim()} → ${k}`);

  if (col.name < 0 || col.category < 0 || (col.price < 0 && col.variationPrice < 0)) {
    return {
      items: [],
      problems: ['This does not look like a Petpooja menu export: it needs Item Name, Category and Price columns.'],
      recognised,
    };
  }

  const problems: string[] = [];
  const byKey = new Map<string, PetpoojaItem>();

  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (index: number) => (index >= 0 ? (cells[index] ?? '').trim() : '');
    const name = get(col.name);
    const category = get(col.category);
    if (!name && !category) return; // blank row
    if (!name || !category) {
      problems.push(`Line ${line}: item name and category are required.`);
      return;
    }

    const variation = get(col.variation);
    const priceText = (variation && get(col.variationPrice)) || get(col.price) || get(col.variationPrice);
    const price = money(priceText);
    if (!Number.isFinite(price) || price < 0 || priceText === '') {
      problems.push(`Line ${line} (${name}): price "${priceText}" is not a number.`);
      return;
    }

    const dietText = get(col.diet);
    const d = dietText ? petpoojaDiet(dietText) : 'veg';
    if (!d) {
      problems.push(`Line ${line} (${name}): item type "${dietText}" should be veg, non-veg or egg.`);
      return;
    }

    let gst = col.gst >= 0 ? percent(get(col.gst)) : null;
    if (gst === null && (col.cgst >= 0 || col.sgst >= 0)) {
      const c = percent(get(col.cgst)) ?? 0;
      const s = percent(get(col.sgst)) ?? 0;
      gst = c + s > 0 ? c + s : null;
    }
    if (gst !== null && (!Number.isFinite(gst) || gst < 0 || gst > 28)) {
      problems.push(`Line ${line} (${name}): GST "${get(col.gst)}" must be 0 to 28.`);
      return;
    }

    const key = `${category.toLowerCase()}|${name.toLowerCase()}`;
    let item = byKey.get(key);
    if (!item) {
      item = { category, name, diet: d, gst, description: get(col.description) || null, price: 0, variants: [] };
      byKey.set(key, item);
    }
    if (variation) {
      if (item.variants.some((v) => v.name.toLowerCase() === variation.toLowerCase())) {
        problems.push(`Line ${line} (${name}): size "${variation}" appears twice; the first one is kept.`);
      } else {
        item.variants.push({ name: variation, price });
      }
    } else {
      item.price = price;
    }
  });

  // An item that only came as variations still needs a base price for listing; use its cheapest.
  for (const item of byKey.values()) {
    if (item.variants.length && !item.price) item.price = Math.min(...item.variants.map((v) => v.price));
  }
  return { items: [...byKey.values()], problems, recognised };
}
