import { Component, OnInit, inject, output } from '@angular/core';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { FoodService } from '../../service/food.service';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
  selector: 'app-new-combo-maker',
  standalone: true,
  imports: [
    DialogModule,
    MultiSelectModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    ReactiveFormsModule,
    LoaderComponent,
  ],
  templateUrl: './new-combo-maker.component.html',
})
export class NewComboMakerComponent implements OnInit {
  visible: boolean = false;
  foodServies = inject(FoodService);
  fb = inject(FormBuilder);
  newItemForm!: FormGroup;
  isSubmit: boolean = false;
  itemOptions: any[] = [];
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
      this.isSubmit = false;
      this.loader=true;
      let rawValue = this.newItemForm.getRawValue();
      rawValue.type = 'combo';
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
