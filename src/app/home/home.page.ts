import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  products: any[] = [];

  constructor(private http: HttpClient) { }
  
  filters = {
    "meal_type":"lunch",
    "cuisine":"indian",
    "distance":"5",
    "popular":"true",
    "priceByOrder":"hightoLow",
    "price":{
      "lowerproce":"5",
    }
  }


 
}
