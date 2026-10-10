import { Component, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { LoaderComponent } from '../loader/loader.component';
import { FoodsDataService, MenuItemView } from '../service/foods.data';
import { NOT_CONNECTED_TOAST } from '../service/not-connected';
import { NewBuragesComponent } from './new-burages/new-burages.component';
import { SpeedDialComponent, SpeedDialItem } from '../shared/ui/speed-dial.component';
import { ConfirmService } from '../shared/ui/confirm.service';
import { ToastService } from '../shared/ui/toast.service';

@Component({
    selector: 'app-beverage',
    imports: [NewBuragesComponent, SpeedDialComponent, LoaderComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './beverage.component.html'
})
export class BeverageComponent {
  @ViewChild('newValue', { static: false }) newValue!: NewBuragesComponent;
  confirmService = inject(ConfirmService);
  toastService = inject(ToastService);
  readonly itemList = signal([] as MenuItemView[]);
  foodServies = inject(FoodsDataService);
  headers = ['Name', 'Description', 'Price', 'Discount', 'Logo', 'Banner', 'Action',];
  readonly loader = signal(false);
  
  ngOnInit(): void {
    this.getValue();
  }
  
  getValue(){
    this.loader.set(true);
    this.foodServies.list('beverage').subscribe({
      next: (res) => {
        this.loader.set(false);
        this.itemList.set(res);
      },
      error: () => this.loader.set(false),
    });
  }

  getItems(food: any): SpeedDialItem[] {
    return [
      {
        label: 'Edit',
        icon: 'pencil',
        command: () => {
          this.edit(food);
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
      message: 'Do you want to delete this Beverage ?',
      header: 'Delete Confirmation',
      icon: 'info',
      acceptVariant: 'danger',
    });
    if (!accepted) return;
    this.foodServies.remove(id).subscribe({
      next: () => {
        this.getValue();
        this.toastService.add({
        severity: 'info',
        summary: 'Confirmed',
        detail: 'Food deleted',
        });
      },
      error: () => this.toastService.add(NOT_CONNECTED_TOAST),
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
