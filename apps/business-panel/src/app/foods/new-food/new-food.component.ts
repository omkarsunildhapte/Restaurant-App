import { Observable } from 'rxjs';
import { Component, OnInit, Output, inject, output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FoodsDataService } from '../../service/foods.data';
import { NOT_CONNECTED_TOAST } from '../../service/not-connected';
import { ToastService } from '../../shared/ui/toast.service';
import { LoaderComponent } from '../../loader/loader.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
    selector: 'app-new-food',
    imports: [ModalComponent, ReactiveFormsModule, LoaderComponent, IconComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './new-food.component.html'
})
export class NewFoodComponent implements OnInit {
  /** Zoneless: async callbacks (save, FileReader) must mark the view for check. */
  private readonly cdr = inject(ChangeDetectorRef);
  visible: boolean = false;
  foodServies = inject(FoodsDataService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  newItemForm!: FormGroup;
  onNameChange = output<string>();
  isSubmit: boolean = false;
  editFlag: boolean = false;
  loader: boolean = false;
  id: string = '';
  ngOnInit(): void {
    this.newItemForm = this.fb.group({
      itemName: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, Validators.required],
      discount: [null],
      logoUrl: [null],
      bannerImage: [null],
    });
  }

  onSave() {
    this.isSubmit = true;
    if (this.newItemForm.valid) {
      const rawValue = { ...this.newItemForm.getRawValue(), type: 'single' };
      this.loader = true;
      const request: Observable<unknown> = this.editFlag && this.id
        ? this.foodServies.update(this.id, rawValue)
        : this.foodServies.create(rawValue);
      request.subscribe({
        next: () => {
          this.isSubmit = false;
          this.loader = this.visible = false;
          this.onNameChange.emit('');
          this.cdr.markForCheck();
        },
        error: () => {
          this.loader = false;
          this.toastService.add(NOT_CONNECTED_TOAST);
          this.cdr.markForCheck();
        },
      });
    } else {
      this.newItemForm.markAllAsTouched();
    }
  }

  reset(formControl: string) {
    this.newItemForm.get(formControl)?.reset();
  }

  onFileSelected(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.newItemForm.get(controlName)?.setValue(reader.result);
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onCancel() {
    this.visible = false;
  }
}
