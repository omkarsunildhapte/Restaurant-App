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

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
    this.http.get<any>('https://dummyjson.com/products')
      .subscribe(
        data => {
          this.products = data.products;
        },
        error => {
          console.error('Error fetching data:', error);
        }
      );
  }
}
