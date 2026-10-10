import { Component, OnInit, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { NewFoodComponent } from './new-food/new-food.component';
import { FoodsDataService, MenuItemView } from '../service/foods.data';
import { NOT_CONNECTED_TOAST } from '../service/not-connected';
import { LoaderComponent } from '../loader/loader.component';
import { SpeedDialComponent, SpeedDialItem } from '../shared/ui/speed-dial.component';
import { ConfirmService } from '../shared/ui/confirm.service';
import { ToastService } from '../shared/ui/toast.service';

@Component({
    selector: 'app-foods',
    imports: [NewFoodComponent, SpeedDialComponent, LoaderComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './foods.component.html'
})
export class FoodsComponent implements OnInit {
  confirmService = inject(ConfirmService);
  toastService = inject(ToastService);
  readonly loader = signal(false);
  @ViewChild('newValue', { static: false }) newValue!: NewFoodComponent;
  readonly itemList = signal([] as MenuItemView[]);
  foodServies = inject(FoodsDataService);
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
    this.loader.set(true);
    this.foodServies.list('food').subscribe({
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
      message: 'Do you want to delete this Food?',
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
