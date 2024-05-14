import { Component, ViewChild } from '@angular/core';
import { NewFoodComponent } from './new-food/new-food.component';
import { SpeedDialModule } from 'primeng/speeddial';
import { MenuItem, MessageService } from 'primeng/api';

@Component({
  selector: 'app-foods',
  standalone: true,
  imports: [NewFoodComponent,SpeedDialModule],
  templateUrl: './foods.component.html',
  styleUrl: './foods.component.css',
  providers:[MessageService]
})
export class FoodsComponent {
  @ViewChild('newValue', { static: false })
  childComponent!: NewFoodComponent;
  openDialog(): void {
    this.childComponent.visible =!this.childComponent.visible
  }
  items: any[]=[];
  constructor(private messageService: MessageService) {}
  ngOnInit() {
      this.items = [
          {
              icon: 'pi pi-pencil',
              command: () => {
                  this.messageService.add({ severity: 'info', summary: 'Add', detail: 'Data Added' });
              }
          },
          {
              icon: 'pi pi-refresh',
              command: () => {
                  this.messageService.add({ severity: 'success', summary: 'Update', detail: 'Data Updated' });
              }
          },
          {
              icon: 'pi pi-trash',
              command: () => {
                  this.messageService.add({ severity: 'error', summary: 'Delete', detail: 'Data Deleted' });
              }
          },
          {
              icon: 'pi pi-upload',
              routerLink: ['/fileupload']
          },
          {
              icon: 'pi pi-external-link',
              target:'_blank',
              url: 'http://angular.io'
          }
      ];
  }
}
