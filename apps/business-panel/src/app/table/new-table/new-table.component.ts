import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TablesDataService } from '../../service/tables.data';
import { NOT_CONNECTED_TOAST } from '../../service/not-connected';
import { ToastService } from '../../shared/ui/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';

@Component({
    selector: 'app-new-table',
    imports: [ModalComponent, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './new-table.component.html'
})
export class NewTableComponent {
  /** Zoneless: async callbacks (save, FileReader) must mark the view for check. */
  private readonly cdr = inject(ChangeDetectorRef);
  visible: boolean = false;
  tableService = inject(TablesDataService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder)
  newItemForm!: FormGroup;
  isSubmit:boolean=false;
  ngOnInit(): void {
    this.newItemForm = this.fb.group({
      itemName: ['', Validators.required],
      description: ['',Validators.required],
      price: [null, Validators.required],
      discount: [null],
      bannerImages: this.fb.array([])
    });
  }

  onSave() {
    this.isSubmit =true;
    if (this.newItemForm.valid) {
      let rawValue = this.newItemForm.getRawValue();
      this.tableService.create(rawValue).subscribe({
        next: () => {
          this.visible = false;
          this.cdr.markForCheck();
        },
        error: () => this.toastService.add(NOT_CONNECTED_TOAST),
      })
    } else {
      this.newItemForm.markAllAsTouched();
    }
  }
  get bannerImages(): FormArray {
    return this.newItemForm.get('bannerImages') as FormArray;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.bannerImages.push(this.fb.group({
              url: [e.target.result]
            }));
            this.cdr.markForCheck();
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }
  
  removeImage(index: number): void {
    this.bannerImages.removeAt(index);
  }

  onCancel() {
    this.visible = false;
  }
}
