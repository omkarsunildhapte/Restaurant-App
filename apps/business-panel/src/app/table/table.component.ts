import { Component, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { NewTableComponent } from './new-table/new-table.component';
import { ProfilesDataService, UserView } from '../service/profiles.data';
import { DiningTableView, TableBookingView, TablesDataService } from '../service/tables.data';
import { NOT_CONNECTED_TOAST } from '../service/not-connected';
import { LoaderComponent } from '../loader/loader.component';
import { TabsComponent, TabPanelComponent } from '../shared/ui/tabs.component';
import { SpeedDialComponent, SpeedDialItem } from '../shared/ui/speed-dial.component';
import { ConfirmService } from '../shared/ui/confirm.service';
import { ToastService } from '../shared/ui/toast.service';

@Component({
    selector: 'app-table',
    imports: [NewTableComponent, TabsComponent, TabPanelComponent, LoaderComponent, SpeedDialComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './table.component.html'
})
export class TableComponent {
  tableService = inject(TablesDataService);
  userServies = inject(ProfilesDataService);
  confirmService = inject(ConfirmService);
  toastService = inject(ToastService);
  readonly tableList = signal([] as DiningTableView[]);
  readonly tableBooking = signal([] as TableBookingView[]);
  readonly userList = signal([] as UserView[]);
  readonly loader = signal(false);
  activeTabIndex:number=0;
  @ViewChild('newValue', { static: false }) newValue!: NewTableComponent;
  headers1 = ['Name', 'Description', 'Price', 'Discount', 'Image', 'Action'];
  headers = ['User Name', 'Table Name', 'Price', 'No of Guests', 'Time', 'Date', 'Action'];
  ngOnInit(): void {
    this.getTableValue();
    this.getTableBookValue();
    this.getUsers();
  }
  
  async getTableValue(){
    this.loader.set(true);
    await this.tableService.list().subscribe((res) => {
      this.loader.set(false);
      this.tableList.set(res);
    });
  }
 
  async getTableBookValue(){
    this.loader.set(true);
   await this.tableService.listBookings().subscribe((res) => {
      this.loader.set(false);
      this.tableBooking.set(res);
    });
  }
  async getUsers(){
    this.loader.set(true);
    await this.userServies.list().subscribe((res) => {
      this.loader.set(false);
      this.userList.set(res);
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
          this.delete(food.id);
        },
      },
    ];
  }

  async delete(id: string) {
    const accepted = await this.confirmService.confirm({
      message: 'Do you want to delete this Food?',
      header: 'Delete Confirmation',
      icon: 'info',
      acceptVariant: 'danger',
    });
    if (!accepted) return;
    if (this.activeTabIndex==0){
      this.tableService.remove(id).subscribe({
        next: () => {
          this.getTableValue();
          this.toastService.add({
          severity: 'info',
          summary: 'Confirmed',
          detail: 'Food deleted',
          });
        },
        error: () => this.toastService.add(NOT_CONNECTED_TOAST),
      });
    } else{
      this.tableService.removeBooking(id).subscribe({
        next: () => {
          this.getTableBookValue();
          this.toastService.add({
          severity: 'info',
          summary: 'Confirmed',
          detail: 'Food deleted',
          });
        },
        error: () => this.toastService.add(NOT_CONNECTED_TOAST),
      });
    }
  }

  getUserName(id: string) {
    if (!id) {
      return ''
    }
    return this.userList().find(e => e.uid == id)?.displayName ?? ''
  }

  getTableName(id: string) {
    if (!id) {
      return ''
    }
    return this.tableList().find(e => e.id == id)?.itemName ?? ''
  }

  getTablePrice(id: string) {
    if (!id) {
      return ''
    }
    return this.tableList().find(e => e.id == id)?.price ?? ''
  }

}
