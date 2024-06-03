import { Component, inject } from '@angular/core';
import { OrderService } from '../service/order.service';
import { UserService } from '../service/users.service';
import { LoaderComponent } from '../loader/loader.component';
import { SpeedDialModule } from 'primeng/speeddial';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [LoaderComponent,SpeedDialModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent {
  itemList: any[] = [];
  headers = ['Customer Name', 'Food', 'Payment Type', 'Amount', 'Status', 'Action',];
  orderService = inject(OrderService);
  userServies = inject(UserService);
  userList: any[] = [];
  loader: boolean = false;
  ngOnInit(): void {
    this.loader = true;
    this.orderService.getOrder().subscribe((res: any) => {
      this.loader = false;
      this.itemList = res;
      this.loader = true
      this.userServies.getUser().subscribe((res: any) => {
        this.loader = false
        this.userList = res;
      });
    });
  }
  
  getItems(food: any) {
    return [
      {
        icon: 'pi pi-pencil',
        command: () => {
          // this.edit(food);
        },
      },
      {
        icon: 'pi pi-trash',
        command: () => {
          // this.delete(food.id);
        },
      },
    ];
  }
  
  getUserName(id: string) {
    return this.userList.find(e => e.uid == id).displayName
  }
}
