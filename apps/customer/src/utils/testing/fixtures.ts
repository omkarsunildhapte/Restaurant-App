import { CartItem, FoodItem, FoodOrder } from '@appTypes/food.types';
import { DiningTable, TableBooking } from '@appTypes/table.types';

/** Sample rows for page specs (the real services are stubs that return nothing). */
export const FOOD_THALI: FoodItem = { id: 'f1', itemName: 'Veg Thali', description: 'Full meal', price: 200, category: 'Meals', type: 'single', logoUrl: 'thali.png', bannerImage: 'thali-banner.png' };
export const FOOD_COMBO: FoodItem = { id: 'f2', itemName: 'Burger Combo', description: 'Burger and fries', price: 300, category: 'Combos', type: 'combo', logoUrl: 'combo.png', bannerImage: 'combo-banner.png' };
export const FOOD_LASSI: FoodItem = { id: 'f3', itemName: 'Lassi', description: 'Sweet lassi', price: 50, category: 'Drinks', type: 'beverage', logoUrl: 'lassi.png', bannerImage: 'lassi-banner.png' };
export const MENU: FoodItem[] = [FOOD_THALI, FOOD_COMBO, FOOD_LASSI];

export const CART: CartItem[] = [{ id: 'c1', name: 'Veg Thali', price: 200, totalNumber: 2, image: 'thali.png', subItem: [{ name: 'Lassi', price: 50, totalNumber: 1, image: 'lassi.png' }] }];

export const ORDER: FoodOrder = { id: 'o1', items: [{ name: 'Veg Thali', image: 'thali.png', amount: 400, subItems: [] }], paymentType: 'cash', totalValue: 410, voucher: '', userId: 'u1', status: 'pending', createDate: '2026-10-10T10:00:00Z' };

export const TABLE: DiningTable = { id: 't1', itemName: 'Window Table', description: 'Seats four', price: 100, availability: 'Available', bannerImages: [{ url: 'table.png' }] };

export const BOOKING: TableBooking = { id: 'b1', tableId: 't1', userId: 'u1', guests: 2, date: '2030-05-01', time: '19:30', firstName: 'Asha', lastName: 'Rao', email: 'asha@example.com', notes: '' };
