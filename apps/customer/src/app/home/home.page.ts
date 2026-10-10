import { IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonToolbar } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { RoutingService } from '../service/routing.service';
import { FoodService } from '../service/food.service';
import { LoadingComponent } from '../loader/loader.component';
@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonToolbar, LoadingComponent]
})
export class HomePage implements OnInit {
  readonly products = signal<any[]>([]);
  bestProduct:any[]=[];
  readonly comboProducts = signal<any[]>([]);
  readonly isLoader = signal<boolean>(true);

  constructor(
    public routerLink :RoutingService,
    public fireBaseService :FoodService
  ){}
  
  ngOnInit(): void {
    this.isLoader.set(true);
    this.fireBaseService.getFood().subscribe((res:any)=>{
      this.isLoader.set(false);
      this.products.set(res.filter((e:any)=>e.type=='single'));
      this.comboProducts.set(res.filter((e:any)=>e.type=='combo'));
    })      
  }

  navigateUrl(value:any){
    const selected= {
      id:value.id
    }
    this.routerLink.navigateUrl('/main/food-review',selected);
  }

}

