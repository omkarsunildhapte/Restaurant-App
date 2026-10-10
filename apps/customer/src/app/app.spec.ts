import { App } from '@app/app';
import { renderPage } from '@testing/test-providers';

describe('App', () => {
  it('renders the Ionic app with its router outlet', async () => {
    const { element, ui } = await renderPage(App);
    expect(element.querySelector('ion-app')).not.toBeNull();
    expect(element.querySelector('ion-router-outlet')).not.toBeNull();
    // Development has a Supabase config, so no configuration warning.
    expect(ui.alerts.present).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute('data-app-ready')).toBe('true');
  });
});
