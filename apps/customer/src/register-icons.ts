// Side-effect module, loaded as the build's polyfills entry (runs before main and its chunks): registers the ionicons before any Ionic
// component code runs, so <ion-icon> elements from the server HTML find their SVGs on upgrade.
import { registerIcons } from './app/core/icons';

registerIcons();
