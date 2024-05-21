import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FirebaseService } from '../../servies/firebase.service';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-new-table',
  standalone: true,
  imports: [ DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    ReactiveFormsModule],
  templateUrl: './new-table.component.html',
  styleUrl: './new-table.component.css'
})
export class NewTableComponent {
  visible: boolean = false;
  tableService = inject(FirebaseService);
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
