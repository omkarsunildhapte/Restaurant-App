import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-comman-layout',
  standalone: true,
  imports: [RouterOutlet,CommonModule,RouterLink],
  templateUrl: './comman-layout.component.html',
})
export class CommanLayoutComponent {
authServies=inject(AuthService)
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
  displayName: string ='';
logout() {
  this.authServies.logout();
  }
  constructor(){
    if (typeof localStorage !== 'undefined') {
      let value = localStorage.getItem('displayName');
      if (value){
        this.displayName = value 
      }
    }
  }
}
