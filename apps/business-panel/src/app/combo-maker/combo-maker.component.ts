import { Component, ViewChild, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { NewComboMakerComponent } from './new-combo-maker/new-combo-maker.component';
import { ComboItemRef, CombosDataService, ComboView } from '../service/combos.data';
import { FoodsDataService } from '../service/foods.data';
import { NOT_CONNECTED_TOAST } from '../service/not-connected';
import { LoaderComponent } from '../loader/loader.component';
import { SpeedDialComponent, SpeedDialItem } from '../shared/ui/speed-dial.component';
import { ConfirmService } from '../shared/ui/confirm.service';
import { ToastService } from '../shared/ui/toast.service';

@Component({
    selector: 'app-combo-maker',
    imports: [NewComboMakerComponent, LoaderComponent, SpeedDialComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './combo-maker.component.html'
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
  readonly itemList = signal([] as ComboView[]);
  readonly foodOptions = signal([] as ComboItemRef[]);
  foodServies = inject(FoodsDataService);
  combosData = inject(CombosDataService);
  readonly loader = signal(false);
  confirmService = inject(ConfirmService);
  toastService = inject(ToastService);
  ngOnInit(): void {
    this.getValue()
  }

  getValue(){
    this.loader.set(true);
    this.combosData.list().subscribe({
      next: (res) => {
        this.loader.set(false);
        this.itemList.set(res);
      },
      error: () => this.loader.set(false),
    });
    this.foodServies.list('food').subscribe((foods) => {
      this.foodOptions.set(foods.map((e) => ({
        itemName: e.itemName,
        id: e.id,
      })));
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
    this.combosData.remove(id).subscribe({
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
