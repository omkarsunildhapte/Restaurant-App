import { RiderVehicle, VehicleTypeOption } from '@appTypes/rider.types';

/** Vehicle details screen (values mirror the `vehicle_type` enum in supabase/migrations). */
export const VEHICLE_DETAILS_PAGE = {
  ALERT_TITLE: 'Vehicle Details',
  SAVE_OPERATION: 'save vehicle details',
  EMPTY_FORM: { vehicleType: '', vehicleNumber: '' } satisfies RiderVehicle,
  VEHICLE_TYPES: [
    { value: 'bicycle', label: 'Bicycle' },
    { value: 'scooter', label: 'Scooter' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'ev_scooter', label: 'EV scooter' },
    { value: 'on_foot', label: 'On foot' },
  ] as readonly VehicleTypeOption[],
} as const;
