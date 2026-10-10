import { addIcons } from 'ionicons';
import {
  book,
  calendar,
  call,
  cashOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  cloudUpload,
  locationOutline,
  lockClosed,
  logOut,
  mail,
  person,
  personOutline,
  star,
} from 'ionicons/icons';

/**
 * Registers exactly the ionicons the templates use (including AccountPage's [name] bindings).
 * Loaded through the build "polyfills" option, so it runs before the main bundle: on SSR routes
 * the server-rendered <ion-icon> elements upgrade as soon as Ionic defines the custom element,
 * and code-splitting can evaluate Ionic before any import in main.ts would run.
 */
addIcons({
  book,
  calendar,
  call,
  cashOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  cloudUpload,
  locationOutline,
  lockClosed,
  logOut,
  mail,
  person,
  personOutline,
  star,
});
