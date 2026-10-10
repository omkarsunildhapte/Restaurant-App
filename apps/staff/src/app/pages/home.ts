import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore } from '@app/core/session.store';

/** Sends each role to its first screen (waiter → tables, kitchen → KDS, others → POS). */
@Component({ selector: 'app-home', changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
export class Home implements OnInit {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  public ngOnInit(): void {
    void this.router.navigateByUrl(this.session.home(), { replaceUrl: true });
  }
}
