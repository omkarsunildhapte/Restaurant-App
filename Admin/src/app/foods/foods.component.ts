import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FirebaseService } from '../servies/firebase.service';
import { NewFoodComponent } from './new-food/new-food.component';

@Component({
  selector: 'app-foods',
  standalone: true,
  imports: [NewFoodComponent,ButtonModule],
  templateUrl: './foods.component.html',
  styleUrl: './foods.component.css',
})
export class FoodsComponent implements OnInit {
  @ViewChild('newValue', { static: false }) newValue!: NewFoodComponent;
  itemList: any[]=[];
  foodServies = inject(FirebaseService);
  headers = ['Name', 'Description', 'Price','Discount', 'Logo Image','Image','Action', ];
  ngOnInit(): void {
   this.foodServies.getFood().subscribe((res:any)=>{
    this.itemList = res.filter((e:any)=>e.type=='single');
   });
  }
}
