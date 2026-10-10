export type LocationErrorKind = 'permission-denied' | 'timeout' | 'unavailable' | 'unknown';

export interface DevicePosition {
  lat: number;
  lng: number;
  accuracy: number;
}
