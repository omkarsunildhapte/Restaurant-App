import { Page, Route } from '@playwright/test';
import { environment } from '@environments/environment';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { SUPABASE_RPC, SUPABASE_TABLES } from '@constants/supabase.constants';
import { TRACK_MAP_PAGE } from '@constants/track-map.constants';
import { E2E_RIDER, E2E_WORKSPACE } from '../data/session';
import { ALERT } from '../data/selectors';
import { expect, test } from '../fixtures/test';

/**
 * A rider's whole delivery against a stateful stand-in for the delivery functions: the offer
 * is accepted, opened, moved to picked up, and handed over with the OTP and the cash. Each call
 * changes what `my_deliveries` returns next, the way the database would.
 */
const SUPABASE = environment.supabase.url;
const OTP = '4821';
const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

test.use({ geolocation: { latitude: 18.5601, longitude: 73.7801 }, permissions: ['geolocation'] });

function job(status: string) {
  return {
    job_id: 'job-1', status, attempt_no: 1, offered_at: '2026-10-10T07:30:00Z', accepted_at: null, finished_at: null,
    cod_amount: 230, cod_collected: null, outlet_id: 'outlet-1', outlet_name: 'Brew & Leaf Baner', outlet_address: 'Baner Road, Pune', outlet_phone: '+91 98220 11111',
    outlet_lat: 18.559, outlet_lng: 73.7867, order_id: 'order-1', order_no: 17, customer_name: 'Meera', customer_phone: '+91 90000 00001',
    delivery_address: 'Flat 4, Balewadi High Street', delivery_lat: 18.57, delivery_lng: 73.77, order_notes: 'Ring twice', order_total: 230,
    items: [{ name: 'Cold coffee', variant: null, quantity: 2 }],
  };
}

const rider = { id: 'rider-row-1', tenant_id: E2E_WORKSPACE.tenant_id, user_id: E2E_RIDER.id, full_name: 'Test Rider', phone: '9822033333', vehicle_type: 'scooter', vehicle_number: 'MH12AB1234', licence_number: null, upi_id: null, verification: 'verified', rejection_reason: null, is_active: true, is_online: false };

/** Registers the stand-in and returns its state, so a test can check what was sent. */
async function mockDelivery(page: Page) {
  const state = { status: 'offered', sent: [] as { fn: string; body: Record<string, unknown> }[] };
  const rpc = (fn: string, handle: (body: Record<string, unknown>) => { status?: number; data: unknown }) =>
    page.route(`${SUPABASE}/rest/v1/rpc/${fn}**`, (route: Route) => {
      const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
      state.sent.push({ fn, body });
      const { status, data } = handle(body);
      return route.fulfill(json(data, status));
    });
  await page.route(`${SUPABASE}/rest/v1/${SUPABASE_TABLES.RIDERS}**`, (route) => route.fulfill(json(route.request().method() === 'GET' ? [rider] : null)));
  await rpc(SUPABASE_RPC.MY_DELIVERIES, (body) => ({ data: body['p_open_only'] && ['delivered', 'failed', 'cancelled'].includes(state.status) ? [] : [job(state.status)] }));
  await rpc(SUPABASE_RPC.RESPOND_TO_DELIVERY, (body) => ((state.status = body['p_accept'] ? 'assigned' : 'cancelled'), { data: state.status }));
  await rpc(SUPABASE_RPC.ADVANCE_DELIVERY, (body) => ((state.status = String(body['p_status'])), { data: null }));
  await rpc(SUPABASE_RPC.COMPLETE_DELIVERY, (body) => (body['p_otp'] === OTP ? ((state.status = 'delivered'), { data: null }) : { status: 400, data: { code: '22023', message: 'Wrong OTP' } }));
  await rpc(SUPABASE_RPC.SET_RIDER_ONLINE, () => ({ data: null }));
  await rpc(SUPABASE_RPC.REPORT_RIDER_LOCATION, () => ({ data: null }));
  return state;
}

async function closeAlert(page: Page) {
  await page.locator(ALERT.OK).first().click();
  await expect(page.locator(ALERT.ROOT)).toHaveCount(0);
}

test.describe('A delivery, start to finish', () => {
  test('goes online, accepts, picks up and hands over with the OTP and cash', async ({ page }) => {
    const state = await mockDelivery(page);
    await page.goto(APP_ROUTE_LINKS.ORDER);

    await page.getByTestId('online-toggle').click();
    await expect(page.getByTestId('online-toggle')).toContainText('Online');
    await expect.poll(() => state.sent.some((s) => s.fn === SUPABASE_RPC.SET_RIDER_ONLINE && s.body['p_online'] === true)).toBe(true);

    await page.getByTestId('job-accept').click();
    await expect(page.getByTestId('job-open')).toBeVisible();
    await page.getByTestId('job-open').click();
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.TRACK_MAP}$`));
    await expect(page.getByTestId('nav-drop')).toHaveAttribute('href', 'geo:18.57,73.77?q=18.57,73.77');

    await page.getByTestId('track-next').click();
    await expect(page.getByTestId('track-next')).toContainText(TRACK_MAP_PAGE.NEXT_STEP.at_pickup?.label ?? '');
    await page.getByTestId('track-next').click();
    await expect(page.getByTestId('track-deliver')).toBeVisible();

    await page.getByTestId('track-deliver').click();
    await page.locator('[data-testid="deliver-otp"] input.native-input:not(.cloned-input)').fill('1111');
    await page.getByTestId('deliver-submit').click();
    await expect(page.locator(ALERT.MESSAGE)).toHaveText('Wrong OTP');
    await closeAlert(page);

    await page.locator('[data-testid="deliver-otp"] input.native-input:not(.cloned-input)').fill(OTP);
    await expect(page.locator('[data-testid="deliver-cash"] input.native-input:not(.cloned-input)')).toHaveValue('230');
    await page.getByTestId('deliver-submit').click();
    await expect(page.locator(ALERT.MESSAGE)).toHaveText(TRACK_MAP_PAGE.DELIVERED_MESSAGE);
    await closeAlert(page);
    await expect(page).toHaveURL(new RegExp(`${APP_ROUTE_LINKS.ORDER}$`));

    const handOver = state.sent.filter((s) => s.fn === SUPABASE_RPC.COMPLETE_DELIVERY).at(-1)?.body;
    expect(handOver).toMatchObject({ p_job: 'job-1', p_otp: OTP, p_cod_collected: 230 });
    expect(state.sent.filter((s) => s.fn === SUPABASE_RPC.ADVANCE_DELIVERY).map((s) => s.body['p_status'])).toEqual(['at_pickup', 'picked_up']);
  });

  test('returns an order to the restaurant with a reason', async ({ page }) => {
    const state = await mockDelivery(page);
    state.status = 'at_drop';
    await page.goto(APP_ROUTE_LINKS.TRACK_MAP);

    await page.getByTestId('track-fail').click();
    await page.getByTestId('fail-submit').click();
    await expect(page.getByText('Choose what went wrong.')).toBeVisible();
    await expect.poll(() => state.sent.some((s) => s.fn === SUPABASE_RPC.FAIL_DELIVERY)).toBe(false);
  });
});
