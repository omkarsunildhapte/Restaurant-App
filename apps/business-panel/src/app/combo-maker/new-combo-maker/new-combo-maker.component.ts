import { Observable } from 'rxjs';
import { Component, OnInit, inject, input, output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ComboItemRef, CombosDataService } from '../../service/combos.data';
import { NOT_CONNECTED_TOAST } from '../../service/not-connected';
import { ToastService } from '../../shared/ui/toast.service';
import { LoaderComponent } from '../../loader/loader.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { MultiSelectComponent } from '../../shared/ui/multi-select.component';

@Component({
    selector: 'app-new-combo-maker',
    imports: [ModalComponent, MultiSelectComponent, ReactiveFormsModule, LoaderComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './new-combo-maker.component.html'
})
export class NewComboMakerComponent implements OnInit {
  /** Zoneless: async callbacks (save, FileReader) must mark the view for check. */
  private readonly cdr = inject(ChangeDetectorRef);
  visible: boolean = false;
  combosData = inject(CombosDataService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  newItemForm!: FormGroup;
  isSubmit: boolean = false;
  readonly itemOptions = input<ComboItemRef[]>([]);
  loader: boolean = false;
  editFlag: boolean = false;
  id: string = '';
  onNameChange = output<string>();
  ngOnInit(): void {
    this.newItemForm = this.fb.group({
      itemName: ['', Validators.required],
      itemList: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, Validators.required],
      discount: [null],
      logoUrl: [null, Validators.required],
      bannerImage: [null, Validators.required],
    });
  }

  onSave() {
    this.isSubmit = true;
    if (this.newItemForm.valid) {
      const rawValue = { ...this.newItemForm.getRawValue(), type: 'combo' };
      this.loader = true;
      const request: Observable<unknown> = this.editFlag && this.id
        ? this.combosData.update(this.id, rawValue)
        : this.combosData.create(rawValue);
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
