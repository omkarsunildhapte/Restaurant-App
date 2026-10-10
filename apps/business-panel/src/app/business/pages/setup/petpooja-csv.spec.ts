import { describe, expect, it } from 'vitest';
import { parsePetpoojaCsv } from './petpooja-csv';

describe('parsePetpoojaCsv', () => {
  it('groups variations into one item with sizes', () => {
    const csv =
      'Item Name,Category Name,Price,Variation,Item Type,GST %,Description\n' +
      'Dal Makhani,Main Course,160,Half,Veg,5,Slow-cooked black lentils\n' +
      'Dal Makhani,Main Course,260,Full,Veg,5,\n' +
      'Chicken 65,Starters,310,,Non-Veg,5,\n' +
      'Masala Omelette,Breakfast,"₹1,20",,Egg,,\n';
    const { items, problems } = parsePetpoojaCsv(csv);
    expect(problems).toEqual([]);
    expect(items).toEqual([
      {
        category: 'Main Course',
        name: 'Dal Makhani',
        diet: 'veg',
        gst: 5,
        description: 'Slow-cooked black lentils',
        price: 160,
        variants: [
          { name: 'Half', price: 160 },
          { name: 'Full', price: 260 },
        ],
      },
      { category: 'Starters', name: 'Chicken 65', diet: 'non_veg', gst: 5, description: null, price: 310, variants: [] },
      { category: 'Breakfast', name: 'Masala Omelette', diet: 'egg', gst: null, description: null, price: 120, variants: [] },
    ]);
  });

  it('reads attribute codes (1 veg, 2 non-veg, 3 egg) and CGST + SGST columns', () => {
    const csv = 'itemname,category,price,attribute,CGST %,SGST %\nPaneer Tikka,Starters,280,1,2.5,2.5\nFish Fry,Starters,350,2,2.5,2.5\n';
    const { items } = parsePetpoojaCsv(csv);
    expect(items.map((i) => [i.name, i.diet, i.gst])).toEqual([
      ['Paneer Tikka', 'veg', 5],
      ['Fish Fry', 'non_veg', 5],
    ]);
  });

  it('uses a separate Variation Price column when present', () => {
    const csv = 'Item Name,Category,Price,Variation,Variation Price\nPizza,Pizza,0,Regular,299\nPizza,Pizza,0,Large,499\n';
    expect(parsePetpoojaCsv(csv).items[0]!.variants).toEqual([
      { name: 'Regular', price: 299 },
      { name: 'Large', price: 499 },
    ]);
  });

  it('reports bad rows and keeps the good ones', () => {
    const csv = 'Item Name,Category,Price,Item Type,GST %\nGood,Snacks,30,veg,5\n,Snacks,30,veg,5\nBad,Snacks,abc,veg,5\nOdd,Snacks,30,vegan,5\nHigh,Snacks,30,veg,40\n';
    const { items, problems } = parsePetpoojaCsv(csv);
    expect(items.map((i) => i.name)).toEqual(['Good']);
    expect(problems).toHaveLength(4);
    expect(problems[0]).toMatch(/Line 3/);
  });

  it('explains a file that is not a Petpooja export', () => {
    expect(parsePetpoojaCsv('foo,bar\n1,2\n').problems[0]).toMatch(/Petpooja/);
  });
});
