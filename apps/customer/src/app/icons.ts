import { addIcons } from 'ionicons';
import { addOutline, book, calendar, call, callOutline, card, cart, cartOutline, chevronBackOutline, eye, fastFoodOutline, flag, heart, homeOutline, hourglassOutline, location, lockClosed, mail, navigate, person, personOutline, removeOutline, search, star, starOutline, storefrontOutline } from 'ionicons/icons';

/**
 * Registers the ionicons the templates use (Rule 27). Loaded through the build's "polyfills"
 * entry (written without .ts), so it runs before the code-split chunks and server-rendered
 * <ion-icon> elements find their SVGs on upgrade. Also imported by main.server.ts.
 * Add a name here when a template starts using a new icon.
 */
addIcons({ 'add-outline': addOutline, 'book': book, 'calendar': calendar, 'call': call, 'call-outline': callOutline, 'card': card, 'cart': cart, 'cart-outline': cartOutline, 'chevron-back-outline': chevronBackOutline, 'eye': eye, 'fast-food-outline': fastFoodOutline, 'flag': flag, 'heart': heart, 'home-outline': homeOutline, 'hourglass-outline': hourglassOutline, 'location': location, 'lock-closed': lockClosed, 'mail': mail, 'navigate': navigate, 'person': person, 'person-outline': personOutline, 'remove-outline': removeOutline, 'search': search, 'star': star, 'star-outline': starOutline, 'storefront-outline': storefrontOutline });
