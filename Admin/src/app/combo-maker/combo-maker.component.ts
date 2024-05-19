import { Component, ViewChild, inject } from '@angular/core';
import { NewComboMakerComponent } from './new-combo-maker/new-combo-maker.component';
import { ButtonModule } from 'primeng/button';
import { FirebaseService } from '../servies/firebase.service';

@Component({
  selector: 'app-combo-maker',
  standalone: true,
  imports: [ButtonModule,NewComboMakerComponent],
  templateUrl: './combo-maker.component.html',
  styleUrl: './combo-maker.component.css'
})
export class ComboMakerComponent {
  @ViewChild('newValue', { static: false }) newValue!: NewComboMakerComponent;
  headers = ['Name', 'Description','Product', 'Price','Discount', 'Logo Image','Image','Action', ];
  itemList:any[]=[];
  foodServies = inject(FirebaseService);
  ngOnInit(): void {
    this.foodServies.getFood().subscribe((res:any)=>{
      debugger
    this.itemList = res.filter((e:any)=>e.type=='combo');
    });
   }
}
