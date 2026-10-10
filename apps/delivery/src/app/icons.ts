import { addIcons } from 'ionicons';
import { book, calendar, cashOutline, chevronForwardOutline, cloudUpload, locationOutline, lockClosed, logOut, mail, person, star } from 'ionicons/icons';

/**
 * Registers exactly the ionicons the templates use, including the account page's [name] bindings
 * from ACCOUNT_PAGE (Rule 27). ion-back-button passes its own icon data, so it needs no entry.
 *
 * Loaded through the build "polyfills" option (written without `.ts`), so it runs before the
 * main bundle: on SSR routes the server-rendered <ion-icon> elements upgrade as soon as Ionic
 * defines the custom element, and code-splitting can evaluate Ionic before main.ts would run.
 */
addIcons({ book, calendar, cashOutline, chevronForwardOutline, cloudUpload, locationOutline, lockClosed, logOut, mail, person, star });
