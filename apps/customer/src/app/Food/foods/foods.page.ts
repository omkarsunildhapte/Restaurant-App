import { IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonSearchbar, IonToolbar } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FoodService } from 'src/app/service/food.service';
import { RoutingService } from 'src/app/service/routing.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-foods',
    templateUrl: './foods.page.html',
    styleUrls: ['./foods.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonList, IonSearchbar, IonToolbar, LoadingComponent]
})
export class FoodsPage implements OnInit {
 readonly itemList = signal<any[]>([]);
 readonly isLoader = signal<boolean>(true);
  constructor(
    private foodService :FoodService,
    public routerLink : RoutingService
  ) { }

  ngOnInit() {
    this.isLoader.set(true);
    this.foodService.getFood().subscribe((res:any)=>{
      this.isLoader.set(false);
      this.itemList.set(res);
    })  
  }
  navigateUrl(value:any){
    const selected= {
      id:value.id
    }
    this.routerLink.navigateUrl('/main/food-review',selected);
  }
}
