import { hexToRgbList, ionicPrimaryVars } from '@utils/ionic-colors/ionic-colors.util';

describe('ionic colours', () => {
  it('converts hex to an rgb list', () => {
    expect(hexToRgbList('#2f5d3a')).toBe('47, 93, 58');
  });

  it('computes the Ionic primary set as hex/rgb', () => {
    expect(ionicPrimaryVars('#2f5d3a')).toEqual({
      '--ion-color-primary': '#2f5d3a',
      '--ion-color-primary-rgb': '47, 93, 58',
      '--ion-color-primary-contrast': '#ffffff',
      '--ion-color-primary-contrast-rgb': '255, 255, 255',
      '--ion-color-primary-shade': '#295233',
      '--ion-color-primary-tint': '#446d4e',
    });
  });

  it('uses black text on a light primary', () => {
    expect(ionicPrimaryVars('#ffee88')['--ion-color-primary-contrast']).toBe('#000000');
  });
});
