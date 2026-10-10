import { Router } from 'express';
import { businessGeocodeController } from '@controller/business/geocode/business.geocode.controller.js';

/** Mounted at /geocode (signed in, so the API is not an open Nominatim proxy). */
const router = Router();

router.get('/search', businessGeocodeController.search);
router.get('/reverse', businessGeocodeController.reverse);

export default router;
