import { Component, ViewChild, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NewComboMakerComponent } from './new-combo-maker/new-combo-maker.component';
import { FoodService } from '../service/food.service';
import { LoaderComponent } from '../loader/loader.component';
import { SpeedDialModule } from 'primeng/speeddial';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-combo-maker',
  standalone: true,
  imports: [ButtonModule, NewComboMakerComponent, LoaderComponent, SpeedDialModule],
  templateUrl: './combo-maker.component.html',
  providers:[ConfirmationService,MessageService]
})
export class ComboMakerComponent {
  @ViewChild('newValue', { static: false }) newValue!: NewComboMakerComponent;
  headers = [
    'Name',
    'Description',
    'Product',
    'Price',
    'Discount',
    'Logo Image',
    'Image',
    'Action',
  ];
  itemList: any[] = [];
  foodServies = inject(FoodService);
  loader: boolean = false;
  confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);
  ngOnInit(): void {
    this.getValue()
  }

  getValue(){
    this.loader = true;
    this.foodServies.getFood().subscribe((res: any) => {
      this.loader = false;
      this.itemList = res.filter((e: any) => e.type == 'combo');
      this.newValue.itemOptions = res
      .filter((e: any) => e.type == 'single')
      .map((e: any) => ({
        itemName: e.itemName,
        id: e.id,
      }));
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
      message: 'Do you want to delete this Food?',
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
      itemList:food.itemList,
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
