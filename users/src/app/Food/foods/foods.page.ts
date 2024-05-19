import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/servies/firebase.service';

@Component({
  selector: 'app-foods',
  templateUrl: './foods.page.html',
  styleUrls: ['./foods.page.scss'],
})
export class FoodsPage implements OnInit {
 itemList:any[]=[];
  constructor(
    public fireBaseService :FirebaseService
  ) { }

  ngOnInit() {
    this.fireBaseService.getFood().subscribe((res:any)=>{
      this.itemList = res;
    })  
  }

}
