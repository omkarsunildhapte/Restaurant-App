import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '@app/layout/header/header';
import { Sidebar } from '@app/layout/sidebar/sidebar';
import { LayoutStore } from '@app/core/layout.store';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly layout = inject(LayoutStore);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.layout.closeMobile();
  }
}
