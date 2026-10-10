import { IONIC_SHADES } from '@constants/theme.constants';
import { contrast, mix } from '@utils/theme/theme.util';

/** `#rrggbb` → `r, g, b` (for Ionic's `-rgb` variables). */
export function hexToRgbList(hex: string): string {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
}

/** Ionic's primary colour set for a hex primary (hex/rgb only, no color-mix). */
export function ionicPrimaryVars(primary: string): Record<string, string> {
  const contrastColor = contrast(IONIC_SHADES.WHITE, primary) >= IONIC_SHADES.CONTRAST_MIN ? IONIC_SHADES.WHITE : IONIC_SHADES.BLACK;
  return {
    '--ion-color-primary': primary,
    '--ion-color-primary-rgb': hexToRgbList(primary),
    '--ion-color-primary-contrast': contrastColor,
    '--ion-color-primary-contrast-rgb': hexToRgbList(contrastColor),
    '--ion-color-primary-shade': mix(primary, IONIC_SHADES.BLACK, IONIC_SHADES.SHADE_AMOUNT),
    '--ion-color-primary-tint': mix(primary, IONIC_SHADES.WHITE, IONIC_SHADES.TINT_AMOUNT),
  };
}
