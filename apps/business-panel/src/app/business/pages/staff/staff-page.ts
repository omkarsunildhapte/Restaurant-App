import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { ToastService } from '../../../shared/ui/toast.service';
import { BusinessService, type Invitation, type Member } from '../../data/business.service';
import { errorText, type TenantRole } from '../../data/db';
import { ROLE_LABEL, WorkspaceStore } from '../../data/workspace.store';

const ROLE_HELP: Record<TenantRole, string> = {
  admin: 'Everything, including other Admins (brand head office)',
  owner: 'Everything except Admins: staff, outlets, settings, menu',
  manager: 'Menu, tables and reports; sees the team',
  cashier: 'Billing and payments (POS)',
  waiter: 'Takes orders at tables',
  kitchen: 'Kitchen screen: moves orders to ready',
  delivery: 'Delivers orders (rider app)',
};

/** Team of the business: members, their role and outlet, and pending invitations. */
@Component({
  selector: 'bp-staff-page',
  imports: [FormsModule, ModalComponent],
  templateUrl: './staff-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly auth = inject(AuthService);
  private readonly api = inject(BusinessService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly members = signal<Member[]>([]);
  protected readonly invitations = signal<Invitation[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly roleLabel = ROLE_LABEL;
  protected readonly roleHelp = ROLE_HELP;
  protected readonly me = computed(() => this.auth.user()?.id ?? null);

  /** Roles this person may hand out: only an Admin creates Admins. */
  protected readonly assignableRoles = computed<TenantRole[]>(() => {
    const all = Object.keys(ROLE_LABEL) as TenantRole[];
    return this.ws.role() === 'admin' ? all : all.filter((r) => r !== 'admin');
  });

  protected readonly outletName = computed(() => {
    const names = new Map(this.ws.outlets().map((o) => [o.id, o.name]));
    return (id: string | null) => (id ? (names.get(id) ?? 'Another outlet') : 'All outlets');
  });

  protected readonly activeCount = computed(() => this.members().filter((m) => m.is_active).length);

  // Invite form
  protected readonly inviting = signal(false);
  protected readonly email = signal('');
  protected readonly fullName = signal('');
  protected readonly role = signal<TenantRole>('waiter');
  protected readonly outlet = signal('');
  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  public ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [members, invitations] = await Promise.all([
        this.api.members(tenant),
        this.ws.isOwner() ? this.api.invitations(tenant) : Promise.resolve([]),
      ]);
      this.members.set(members);
      this.invitations.set(invitations);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  /** Can the signed-in person change this member? Mirrors the database rules. */
  protected canEdit(m: Member): boolean {
    if (!this.ws.canManage() || m.user_id === this.me()) return false;
    return m.role !== 'admin' || this.ws.role() === 'admin';
  }

  protected openInvite(): void {
    this.email.set('');
    this.fullName.set('');
    this.role.set('waiter');
    this.outlet.set(this.ws.outlets().length > 1 ? (this.ws.outletId() ?? '') : '');
    this.formError.set(null);
    this.inviting.set(true);
  }

  protected async invite(): Promise<void> {
    const tenant = this.ws.tenantId();
    const email = this.email().trim();
    if (!tenant) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.formError.set('Enter a valid email address.');
      return;
    }
    this.busy.set(true);
    this.formError.set(null);
    try {
      const status = await this.api.invite(tenant, {
        email,
        role: this.role(),
        outletId: this.outlet() || null,
        fullName: this.fullName().trim() || undefined,
      });
      this.inviting.set(false);
      this.toast.success(
        status === 'invited'
          ? `Invitation emailed to ${email}.`
          : status === 'added'
            ? `${email} already had an account and has been added.`
            : `${email} is already on the team.`,
      );
      await this.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async change(m: Member, change: Partial<Pick<Member, 'role' | 'outlet_id' | 'is_active'>>): Promise<void> {
    try {
      await this.api.updateMember(m.id, change);
      this.members.update((list) => list.map((x) => (x.id === m.id ? { ...x, ...change } : x)));
      this.toast.success('Saved.');
    } catch (e) {
      this.toast.error(errorText(e));
      await this.load();
    }
  }

  protected async remove(m: Member): Promise<void> {
    const who = m.profiles?.full_name || m.profiles?.email || 'this person';
    const ok = await this.confirm.confirm({
      header: 'Remove from team',
      message: `Remove ${who} from ${this.ws.current()?.tenant_name}? Their account stays; they just lose access to this business.`,
      icon: 'warning',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.removeMember(m.id);
      await this.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected async resend(i: Invitation): Promise<void> {
    try {
      await this.api.resendInvitation(i.id);
      this.toast.success(`Invitation sent again to ${i.email}.`);
      await this.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected async cancel(i: Invitation): Promise<void> {
    try {
      await this.api.cancelInvitation(i.id);
      this.invitations.update((list) => list.filter((x) => x.id !== i.id));
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected expired(i: Invitation): boolean {
    return new Date(i.expires_at).getTime() < Date.now();
  }
}
