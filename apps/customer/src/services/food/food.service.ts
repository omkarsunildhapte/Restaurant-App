import { Injectable } from '@angular/core';
import { CartItem, FoodItem, FoodOrder, NewCartItem } from '@appTypes/food.types';
import { STUB_OPERATIONS } from '@constants/messages.constants';
import { notImplemented } from '@utils/not-implemented/not-implemented.util';

/**
 * Menu, cart and order data. Every method is a stub until the customer side is wired to Supabase
 * (Phase 8): reads resolve empty (screens show empty states), writes reject with NotImplementedError
 * (screens show a "Not connected yet" toast). Reads are Promises so screens use resource() (Rule 8).
 */
@Injectable({ providedIn: 'root' })
export class FoodService {
  // TODO(Phase 8): Supabase table menu_items
  listFoods(): Promise<FoodItem[]> {
    return Promise.resolve([]);
  }

  // TODO(Phase 8): Supabase table menu_items
  getFood(_id: string): Promise<FoodItem | null> {
    return Promise.resolve(null);
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  listCart(_userId: string): Promise<CartItem[]> {
    return Promise.resolve([]);
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  addToCart(_userId: string, _item: NewCartItem): Promise<void> {
    return notImplemented(STUB_OPERATIONS.ADD_TO_CART);
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  updateCart(_userId: string, _items: CartItem[]): Promise<void> {
    return notImplemented(STUB_OPERATIONS.UPDATE_CART);
  }

  // TODO(Phase 8): Supabase table <cart> (no cart table exists yet)
  clearCart(_userId: string): Promise<void> {
    return notImplemented(STUB_OPERATIONS.CLEAR_CART);
  }

  // TODO(Phase 8): Supabase tables orders / order_items
  placeOrder(_order: FoodOrder): Promise<void> {
    return notImplemented(STUB_OPERATIONS.PLACE_ORDER);
  }

  // TODO(Phase 8): Supabase table orders
  listOrders(_userId: string): Promise<FoodOrder[]> {
    return Promise.resolve([]);
  }
}
