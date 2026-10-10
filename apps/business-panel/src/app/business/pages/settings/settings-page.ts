import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { ToastService } from '../../../shared/ui/toast.service';
import { BusinessService, type BusinessDetails } from '../../data/business.service';
import { errorText } from '../../data/db';
import { MenuService, type TaxRate } from '../../data/menu.service';
import { WorkspaceStore } from '../../data/workspace.store';

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const FSSAI = /^[0-9]{14}$/;

/** Business details printed on bills, and GST rates. Owners and admins only. */
@Component({
  selector: 'bp-settings-page',
  imports: [FormsModule],
  templateUrl: './settings-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(BusinessService);
  private readonly menu = inject(MenuService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly details = signal<BusinessDetails | null>(null);
  protected readonly slug = signal('');
  protected readonly rates = signal<TaxRate[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly rateName = signal('');
  protected readonly rateValue = signal<number | null>(null);
  protected readonly rateBusy = signal(false);

  protected readonly problem = computed(() => {
    const d = this.details();
    if (!d) return null;
    if (!d.name.trim()) return 'The business needs a name.';
    if (d.gstin?.trim() && !GSTIN.test(d.gstin.trim().toUpperCase())) return 'GSTIN should be 15 characters, like 27AABFB1234C1Z5.';
    if (d.fssai_number?.trim() && !FSSAI.test(d.fssai_number.trim())) return 'FSSAI licence number is 14 digits.';
    if (!(Number(d.packaging_charge) >= 0)) return 'Packaging charge cannot be negative.';
    return null;
  });

  public ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    this.error.set(null);
    try {
      const [t, rates] = await Promise.all([this.api.tenant(tenant), this.menu.taxRates(tenant)]);
      this.details.set({
        name: t.name,
        legal_name: t.legal_name ?? '',
        gstin: t.gstin ?? '',
        fssai_number: t.fssai_number ?? '',
        phone: t.phone ?? '',
        email: t.email ?? '',
        address: t.address ?? '',
        prices_include_tax: t.prices_include_tax,
        round_off: t.round_off,
        packaging_charge: Number(t.packaging_charge),
      });
      this.slug.set(t.slug);
      this.rates.set(rates);
    } catch (e) {
      this.error.set(errorText(e));
    }
  }

  protected patch(change: Partial<BusinessDetails>): void {
    this.details.update((d) => (d ? { ...d, ...change } : d));
  }

  protected async save(): Promise<void> {
    const d = this.details();
    const tenant = this.ws.tenantId();
    if (!d || !tenant || this.problem()) return;
    this.saving.set(true);
    try {
      await this.api.saveDetails(tenant, d);
      this.toast.success('Business details saved.');
      await this.ws.reload();
    } catch (e) {
      this.toast.error(errorText(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected async addRate(): Promise<void> {
    const tenant = this.ws.tenantId();
    const rate = Number(this.rateValue());
    if (!tenant || !this.rateName().trim() || !(rate >= 0 && rate <= 28)) {
      this.toast.error('Give the rate a name and a percentage from 0 to 28.');
      return;
    }
    this.rateBusy.set(true);
    try {
      await this.menu.saveTaxRate(tenant, null, { name: this.rateName().trim(), rate });
      this.rateName.set('');
      this.rateValue.set(null);
      this.rates.set(await this.menu.taxRates(tenant));
    } catch (e) {
      this.toast.error(errorText(e));
    } finally {
      this.rateBusy.set(false);
    }
  }

  protected async makeDefault(r: TaxRate): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    try {
      await this.menu.setDefaultTaxRate(tenant, r.id);
      this.rates.set(await this.menu.taxRates(tenant));
      this.toast.success(`${r.name} is now the default for items without their own rate.`);
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected async removeRate(r: TaxRate): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    if (r.is_default) {
      this.toast.info('Make another rate the default first.', 'Default rate');
      return;
    }
    const ok = await this.confirm.confirm({
      header: 'Delete GST rate',
      message: `Delete "${r.name}"? Items using it switch to the default rate.`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.menu.deleteTaxRate(r.id);
      this.rates.set(await this.menu.taxRates(tenant));
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }
}
