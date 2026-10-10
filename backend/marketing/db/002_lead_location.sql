-- Where the restaurant is, captured on a visit with the browser's Geolocation API
-- (the salesperson taps "Use my current location" while standing at the restaurant).
-- Used to plan visit routes; addresses are looked up from it through the platform's
-- Nominatim endpoint, never Google Maps.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS latitude         numeric(9,6) CHECK (latitude BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS longitude        numeric(9,6) CHECK (longitude BETWEEN -180 AND 180),
  -- GPS accuracy in metres as the phone reported it, so a 2 km fix is not trusted like a 10 m one.
  ADD COLUMN IF NOT EXISTS location_accuracy_m integer CHECK (location_accuracy_m >= 0);

-- Both or neither: half a coordinate is a bug.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lat_lng_pair;
ALTER TABLE leads ADD CONSTRAINT leads_lat_lng_pair CHECK ((latitude IS NULL) = (longitude IS NULL));
