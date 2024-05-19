import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FirebaseService } from '../../servies/firebase.service';

@Component({
  selector: 'app-new-food',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    ReactiveFormsModule],
  templateUrl: './new-food.component.html',
  styleUrl: './new-food.component.css',
})
export class NewFoodComponent implements OnInit {
  visible: boolean = false;
  foodServies = inject(FirebaseService);
  fb = inject(FormBuilder)
  newItemForm!: FormGroup;
  isSubmit:boolean=false;
  ngOnInit(): void {
    this.newItemForm = this.fb.group({
      itemName: ['', Validators.required],
      description: ['',Validators.required],
      price: [null, Validators.required],
      discount: [null],
      logoUrl:[null],
      bannerImage:[null]
    });
  }

  onSave() {
    this.isSubmit =true;
    if (this.newItemForm.valid) {
      let rawValue = this.newItemForm.getRawValue();
      rawValue.type='single'
      this.foodServies.addFood(rawValue).subscribe((addValue:any)=>{
        
      })
      this.visible = false;
    } else {
      this.newItemForm.markAllAsTouched();
    }
  }

  onFileSelected(event: Event,controlName:string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
        this.newItemForm.get(controlName)?.setValue(reader.result)
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onCancel() {
    this.visible = false;
  }

}
