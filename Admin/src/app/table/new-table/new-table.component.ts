import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableService } from '../../service/table.service';

@Component({
  selector: 'app-new-table',
  standalone: true,
  imports: [ DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    ReactiveFormsModule],
  templateUrl: './new-table.component.html'
})
export class NewTableComponent {
  visible: boolean = false;
  tableService = inject(TableService);
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
      this.tableService.addTable(rawValue).subscribe((addValue:any)=>{
        this.visible = false;
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
