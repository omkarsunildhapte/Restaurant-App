import { Component, OnInit, Output, inject, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FoodService } from '../../service/food.service';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
  selector: 'app-new-food',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    ReactiveFormsModule,
    LoaderComponent,
  ],
  templateUrl: './new-food.component.html',
})
export class NewFoodComponent implements OnInit {
  visible: boolean = false;
  foodServies = inject(FoodService);
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
      let rawValue = this.newItemForm.getRawValue();
      rawValue.type = 'single';
      this.loader = true;
      if (this.editFlag) {
        this.foodServies.addFood(rawValue).subscribe((addValue: any) => {
          this.loader = this.visible = false;
          this.onNameChange.emit('');
        });
      } else {
        if (this.id) {
          this.foodServies
            .updateFood(this.id, rawValue)
            .subscribe((res: any) => {
              this.loader = this.visible = false;
              this.onNameChange.emit('');
            });
        }
      }
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
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onCancel() {
    this.visible = false;
  }
}
