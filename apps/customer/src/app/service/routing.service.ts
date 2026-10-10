import { Injectable } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  constructor(
    private navController: NavController,
    private platform: Platform
  ){}

  navigateUrl(url: string, queryMap: any) {
    this.navController.navigateForward(url, { queryParams: queryMap });
  }
  
  goBack() {
    if (this.platform.is('android') || this.platform.is('ios')) {
      this.navController.back();
    } else {
      this.navController.pop();
    }
  } 
}
