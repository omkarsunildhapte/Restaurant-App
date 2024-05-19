import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-comman-layout',
  standalone: true,
  imports: [RouterOutlet,CommonModule,RouterLink],
  templateUrl: './comman-layout.component.html',
})
export class CommanLayoutComponent {
  menu: boolean = true;
  navItems = [
    { name: 'Dashboard', link: './dashboard', isActive: true },
    { name: 'Foods', link: './foods', isActive: false },
    { name: 'Combo', link: './combo-maker', isActive: false },
    { name: 'Order', link: './order', isActive: false },
    { name: 'Table', link: './table', isActive: false },
    { name: 'Chat', link: './chats', isActive: false },
  ];
}
