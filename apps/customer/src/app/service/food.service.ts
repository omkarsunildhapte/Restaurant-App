import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { notImplemented } from '../core/data/not-implemented';

export interface FoodItem {
  id: string;
  itemName: string;
  description?: string;
  price: number;
  category?: string;
  type?: 'single' | 'combo' | 'beverage' | string;
  logoUrl?: string;
  bannerImage?: string;
  [key: string]: unknown;
}

export interface CartSubItem {
  name: string;
  price: number;
  totalNumber: number;
  image?: string;
}

export interface CartItem {
  id?: string;
  name: string;
  price: number;
  totalNumber: number;
  image?: string;
  subItem: CartSubItem[];
}

export interface FoodOrder {
  id?: string;
  items: { name: string; image?: string; amount: number; subItems: { name: string; image?: string; amount: number }[] }[];
  paymentType: string;
  totalValue: number;
  voucher: string;
  userId: string;
  status: string;
  createDate: Date;
}

/**
 * Food / cart / order data. Firestore was removed; every method is a stub until the
 * customer side is wired to Supabase (Phase 8). Reads return empty results, writes
 * fail with NotImplementedError (pages show a "Not connected yet" toast).
 */
@Injectable({
  providedIn: 'root'
})
export class FoodService {

  // TODO(Phase 8): Supabase table menu_items
  getFood(): Observable<FoodItem[]> {
    return of([]);
  }

  // TODO(Phase 8): Supabase table menu_items
  getFoodById(_id: string): Observable<FoodItem | null> {
    return of(null);
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  addToCart(_userId: string, _itemData: CartItem): Observable<void> {
    return notImplemented('add to cart');
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  getCartItems(_userId: string): Observable<CartItem[]> {
    return of([]);
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  deleteAllFromCart(_userId: string): Observable<void> {
    return notImplemented('clear cart');
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  updateCartItemsByIds(_userId: string, _itemUpdates: CartItem[]): Observable<void> {
    return notImplemented('update cart');
  }

  // TODO(Phase 8): Supabase table orders
  addToUserOrder(_userId: string, _itemData: FoodOrder): Observable<void> {
    return notImplemented('save order to user history');
  }

  // TODO(Phase 8): Supabase table orders / order_items
  addOrder(_order: FoodOrder): Observable<void> {
    return notImplemented('place order');
  }

  // TODO(Phase 8): Supabase table orders
  getUserOrder(_userId: string): Observable<FoodOrder[]> {
    return of([]);
  }
}
