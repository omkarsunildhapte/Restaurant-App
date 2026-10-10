
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
    selector: 'app-comman-layout',
    imports: [RouterOutlet, RouterLink],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './comman-layout.component.html'
})
export class CommanLayoutComponent {
authServies=inject(AuthService)
router=inject(Router)
  menu: boolean = true;
  navItems = [
    { name: 'Dashboard', link: './dashboard', isActive: true },
    { name: 'Foods', link: './foods', isActive: false },
    { name: 'Combo', link: './combo-maker', isActive: false },
    { name: 'Beverage', link: './beverage', isActive: false },
    { name: 'Order', link: './order', isActive: false },
    { name: 'Table', link: './table', isActive: false },
  ];
show:boolean=false ;
  get displayName(): string {
    return this.authServies.user()?.email ?? '';
  }
async logout() {
  try {
    await this.authServies.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
  this.router.navigate(['/']);
  }
}
