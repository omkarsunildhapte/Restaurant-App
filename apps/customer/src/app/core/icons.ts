import { addIcons } from 'ionicons';
import {
  addOutline,
  book,
  calendar,
  call,
  callOutline,
  card,
  cart,
  cartOutline,
  chevronBackOutline,
  eye,
  fastFoodOutline,
  flag,
  heart,
  homeOutline,
  hourglassOutline,
  location,
  lockClosed,
  mail,
  navigate,
  person,
  personOutline,
  pin,
  removeOutline,
  search,
  star,
  starOutline,
  storefrontOutline,
} from 'ionicons/icons';

/**
 * Registers only the ionicons the templates use (standalone Ionic does not load icons by name).
 * Static <ion-icon name="..."> names plus the dynamic ones from AccountPage's menu lists.
 * Add a name here when a template starts using a new icon.
 */
export function registerIcons(): void {
  addIcons({
    'add-outline': addOutline,
    'book': book,
    'calendar': calendar,
    'call': call,
    'call-outline': callOutline,
    'card': card,
    'cart': cart,
    'cart-outline': cartOutline,
    'chevron-back-outline': chevronBackOutline,
    'eye': eye,
    'fast-food-outline': fastFoodOutline,
    'flag': flag,
    'heart': heart,
    'home-outline': homeOutline,
    'hourglass-outline': hourglassOutline,
    'location': location,
    'lock-closed': lockClosed,
    'mail': mail,
    'navigate': navigate,
    'person': person,
    'person-outline': personOutline,
    'pin': pin,
    'remove-outline': removeOutline,
    'search': search,
    'star': star,
    'star-outline': starOutline,
    'storefront-outline': storefrontOutline,
  });
}
