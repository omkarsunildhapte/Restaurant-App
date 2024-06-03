import { Component, ViewChild, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { NewTableComponent } from './new-table/new-table.component';
import { UserService } from '../service/users.service';
import { TableService } from '../service/table.service';
import { LoaderComponent } from '../loader/loader.component';
import { SpeedDialModule } from 'primeng/speeddial';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NewTableComponent, ButtonModule, TabViewModule, LoaderComponent,SpeedDialModule],
  templateUrl: './table.component.html',
  providers: [ConfirmationService, MessageService],
})
export class TableComponent {
  tableService = inject(TableService);
  userServies = inject(UserService);
  confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);
  tableList: any[] = [];
  tableBooking: any[] = [];
  userList: any[] = [];
  loader: boolean = false;
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
    this.loader = true;
    await this.tableService.getTable().subscribe((res: any) => {
      this.loader = false;
      this.tableList = res;
    });
  }
 
  async getTableBookValue(){
    this.loader = true;
   await this.tableService.getTableBook().subscribe((res: any) => {
      this.loader = false;
      this.tableBooking = res;
    });
  }
  async getUsers(){
    this.loader = true;
    await this.userServies.getUser().subscribe((res: any) => {
      this.loader = false;
      this.userList = res;
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
          this.delete(food.id);
        },
      },
    ];
  }

  delete(id: string) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this Food?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      accept: () => {
        if (this.activeTabIndex==0){
          this.tableService.deleteTable(id).subscribe((result: any) => {
            this.getTableValue();
            this.messageService.add({
              severity: 'info',
              summary: 'Confirmed',
              detail: 'Food deleted',
            });
          });
        } else{
          this.tableService.deleteTableBook(id).subscribe((result: any) => {
            this.getTableBookValue();
            this.messageService.add({
              severity: 'info',
              summary: 'Confirmed',
              detail: 'Food deleted',
            });
          });
        }
      },
    });
  }

  getUserName(id: string) {
    if (!id) {
      return ''
    }
    return this.userList.find(e => e.uid == id).displayName
  }

  getTableName(id: string) {
    if (!id) {
      return ''
    }
    return this.tableList.find(e => e.id == id).itemName
  }

  getTablePrice(id: string) {
    if (!id) {
      return ''
    }
    return this.tableList.find(e => e.id == id).price
  }

}
