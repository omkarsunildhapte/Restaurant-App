import { parseCsv } from './import';

describe('parseCsv', () => {
  it('splits rows and columns', () => {
    expect(parseCsv('name,phone\nCafe One,9822012345\n')).toEqual([
      ['name', 'phone'],
      ['Cafe One', '9822012345'],
    ]);
  });

  it('keeps commas, quotes and line breaks inside quoted fields', () => {
    const csv = 'name,address\n"Brew, Leaf & Co","Shop 4, ""Sai"" Complex\nBaner"\n';
    expect(parseCsv(csv)).toEqual([
      ['name', 'address'],
      ['Brew, Leaf & Co', 'Shop 4, "Sai" Complex\nBaner'],
    ]);
  });

  it('handles Windows line endings and skips blank lines', () => {
    expect(parseCsv('a,b\r\n\r\n1,2\r\n,\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps the last row when the file has no trailing newline', () => {
    expect(parseCsv('a\nlast')).toEqual([['a'], ['last']]);
  });
});
