import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('leaves plain values alone and empties null/undefined', () => {
    expect(csvCell('Milk')).toBe('Milk');
    expect(csvCell(42.5)).toBe('42.5');
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('Dal, Makhani')).toBe('"Dal, Makhani"');
    expect(csvCell('Chef "Special"')).toBe('"Chef ""Special"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
  });

  it('builds rows with a header, CRLF line ends and a BOM for Excel', () => {
    expect(toCsv(['item', 'amount'], [['Milk', 100], ['Paneer, fresh', 450]])).toBe(
      '﻿item,amount\r\nMilk,100\r\n"Paneer, fresh",450\r\n',
    );
  });
});
