import { Component, ViewChild, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SpeedDialModule } from 'primeng/speeddial';
import { LoaderComponent } from '../loader/loader.component';
import { FoodService } from '../service/food.service';
import { NewBuragesComponent } from './new-burages/new-burages.component';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-beverage',
  standalone: true,
  imports: [NewBuragesComponent, ButtonModule,SpeedDialModule,LoaderComponent],
  templateUrl: './beverage.component.html',
  providers:[ConfirmationService,MessageService]
})
export class BeverageComponent {
  @ViewChild('newValue', { static: false }) newValue!: NewBuragesComponent;
  confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);
  itemList: any[] = [];
  foodServies = inject(FoodService);
  headers = ['Name', 'Description', 'Price', 'Discount', 'Logo', 'Banner', 'Action',];
  loader :boolean =false;
  
  ngOnInit(): void {
    this.getValue();
  }
  
  getValue(){
    this.loader =true;
    this.foodServies.getFood().subscribe((res: any) => {
      this.loader =false;
      this.itemList = res.filter((e: any) => e.type == 'beverage');
    });
  }

  getItems(food: any) {
    return [
      {
        icon: 'pi pi-pencil',
        command: () => {
          this.edit(food);
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
      message: 'Do you want to delete this Beverage ?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      accept: () => {
        this.foodServies.deleteFood(id).subscribe((result: any) => {
          this.getValue();
          this.messageService.add({
            severity: 'info',
            summary: 'Confirmed',
            detail: 'Food deleted',
          });
        });
      },
    });
  }
  
  edit(food: any) {
    this.newValue.newItemForm.patchValue({
      itemName: food.itemName,
      description: food.description,
      price: food.price,
      discount: food.discount,
      logoUrl: food.logoUrl,
      bannerImage: food.bannerImage,
    });
    this.newValue.id = food.id;
    this.newValue.editFlag = this.newValue.visible = true;
  }
}
