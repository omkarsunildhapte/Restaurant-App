import { environment } from '../../environments/environment';

/**
 * Where the Python marketing API lives (Sales CRM). Set per build configuration in
 * src/environments/. The Node platform API (restaurants, menu, POS) gets its own base URL
 * when Phase 1 starts.
 */
export const API_BASE_URL = environment.marketingApiUrl;
