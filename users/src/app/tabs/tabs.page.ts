import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage  {
  selectedTab:number=1;
  constructor(private router: Router) {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        const urlSegments = event.urlAfterRedirects.split('/');
        this.getSegment(urlSegments[urlSegments.length - 1])
      }
    });
  }

  getSegment(segment:string){
    switch(segment){
      case'home':
      this.selectedTab =1;
      break;
      case'foods': case 'food-review': case 'track':
      this.selectedTab = 2;
      break;
      case'table': case 'table-details': case 'table-confirm':
      this.selectedTab = 3;
      break;
      case'add-cart':
      this.selectedTab =4;
      break;
      case 'account':case'account-information': case 'change-password': case 'payment-method': case 'histroy':
        this.selectedTab =5
      break;
    }
  }
}
