import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@app/core/auth.store';
import { TeamStore } from '@app/core/team.store';
import { shortDate, type TeamMember } from '@app/core/crm';

/** The sales team: who works leads, and how each person is doing. */
@Component({
  selector: 'app-team',
  imports: [FormsModule],
  templateUrl: './team.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Team implements OnInit {
  protected readonly team = inject(TeamStore);
  protected readonly auth = inject(AuthStore);
  protected readonly shortDate = shortDate;

  protected readonly adding = signal(false);
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly role = signal<'admin' | 'sales'>('sales');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  public ngOnInit(): void {
    this.team.loadUsers();
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.team
      .createUser({ name: this.name().trim(), email: this.email().trim(), password: this.password(), role: this.role() })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.adding.set(false);
          this.name.set('');
          this.email.set('');
          this.password.set('');
          this.role.set('sales');
        },
        error: (e: Error) => {
          this.error.set(e.message);
          this.saving.set(false);
        },
      });
  }

  protected toggle(member: TeamMember): void {
    this.team.setUserActive(member.id, !member.isActive).subscribe({ error: (e: Error) => this.error.set(e.message) });
  }
}
