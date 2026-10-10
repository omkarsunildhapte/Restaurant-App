import { describe, expect, it } from 'vitest';
import { CSV_TEMPLATE, parseMenuCsv } from './menu-csv';

describe('parseMenuCsv', () => {
  it('reads the example file', () => {
    const { rows, problems } = parseMenuCsv(CSV_TEMPLATE);
    expect(problems).toEqual([]);
    expect(rows.map((r) => [r.category, r.name, r.price, r.diet, r.gst])).toEqual([
      ['Starters', 'Paneer Tikka', 280, 'veg', 5],
      ['Starters', 'Chicken 65', 310, 'non_veg', 5],
      ['Drinks', 'Masala Chai', 40, 'veg', 5],
    ]);
    expect(rows[0]!.description).toBe('Charred cottage cheese');
  });

  it('handles quotes, commas, ₹ signs, Excel BOM and Windows line endings', () => {
    const text = '﻿Name,Category,Price\r\n"Dal, Makhani",Main Course,"₹1,260"\r\n"Chef ""Special""",Main Course,99\r\n';
    const { rows, problems } = parseMenuCsv(text);
    expect(problems).toEqual([]);
    expect(rows.map((r) => [r.name, r.price])).toEqual([
      ['Dal, Makhani', 1260],
      ['Chef "Special"', 99],
    ]);
    expect(rows.every((r) => r.diet === 'veg' && r.gst === null)).toBe(true);
  });

  it('accepts common spellings of the food type', () => {
    const text = 'category,name,price,type\nA,One,1,NV\nA,Two,1,egg\nA,Three,1,Non Veg\nA,Four,1,\n';
    expect(parseMenuCsv(text).rows.map((r) => r.diet)).toEqual(['non_veg', 'egg', 'non_veg', 'veg']);
  });

  it('reports bad rows by line number and keeps the good ones', () => {
    const text = 'category,name,price,type,gst\nA,Good,10,veg,5\n,No category,10,veg,\nA,Bad price,abc,veg,\nA,Bad type,10,vegan,\nA,Bad gst,10,veg,40\n';
    const { rows, problems } = parseMenuCsv(text);
    expect(rows.map((r) => r.name)).toEqual(['Good']);
    expect(problems).toEqual([
      'Line 3: category and name are required.',
      'Line 4 (Bad price): price "abc" is not a number.',
      'Line 5 (Bad type): type must be veg, egg or non-veg.',
      'Line 6 (Bad gst): GST must be 0 to 28.',
    ]);
  });

  it('explains a missing header', () => {
    expect(parseMenuCsv('Paneer,280\nChai,40\n').problems[0]).toMatch(/category, name, price/);
    expect(parseMenuCsv('category,name,price\n').problems[0]).toMatch(/no menu rows/);
  });
});
