import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { OrderView, OrdersDataService } from '../service/orders.data';
import { ProfilesDataService, UserView } from '../service/profiles.data';
import { LoaderComponent } from '../loader/loader.component';
import { SpeedDialComponent, SpeedDialItem } from '../shared/ui/speed-dial.component';

@Component({
    selector: 'app-order-list',
    imports: [LoaderComponent, SpeedDialComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './order-list.component.html'
})
export class OrderListComponent {
  readonly itemList = signal([] as OrderView[]);
  headers = ['Customer Name', 'Food', 'Payment Type', 'Amount', 'Status', 'Action',];
  orderService = inject(OrdersDataService);
  userServies = inject(ProfilesDataService);
  readonly userList = signal([] as UserView[]);
  readonly loader = signal(false);
  ngOnInit(): void {
    this.loader.set(true);
    this.orderService.list().subscribe((res) => {
      this.loader.set(false);
      this.itemList.set(res);
      this.loader.set(true);
      this.userServies.list().subscribe((res) => {
        this.loader.set(false);
        this.userList.set(res);
      });
    });
  }
  
  getItems(food: any): SpeedDialItem[] {
    return [
      {
        label: 'Edit',
        icon: 'pencil',
        command: () => {
          // this.edit(food);
        },
      },
      {
        label: 'Delete',
        icon: 'trash',
        command: () => {
          // this.delete(food.id);
        },
      },
    ];
  }
  
  getUserName(id: string | null) {
    return this.userList().find(e => e.uid == id)?.displayName ?? ''
  }
}
