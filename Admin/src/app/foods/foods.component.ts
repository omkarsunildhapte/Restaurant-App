import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SpeedDialModule } from 'primeng/speeddial';
import { ToastModule } from 'primeng/toast';
import { NewFoodComponent } from './new-food/new-food.component';
import { FoodService } from '../service/food.service';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-foods',
  standalone: true,
  imports: [
    NewFoodComponent,
    ButtonModule,
    SpeedDialModule,
    ConfirmDialogModule,
    ToastModule,
    LoaderComponent,
  ],
  templateUrl: './foods.component.html',
  providers: [ConfirmationService, MessageService],
})
export class FoodsComponent implements OnInit {
  confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);
  loader: boolean = false;
  @ViewChild('newValue', { static: false }) newValue!: NewFoodComponent;
  itemList: any[] = [];
  foodServies = inject(FoodService);
  headers = [
    'Name',
    'Description',
    'Price',
    'Discount',
    'Logo Image',
    'Image',
    'Action',
  ];
  ngOnInit(): void {
    this.getValue();
  }
  getValue() {
    this.loader = true;
    this.foodServies.getFood().subscribe((res: any) => {
      this.loader = false;
      this.itemList = res.filter((e: any) => e.type == 'single');
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
