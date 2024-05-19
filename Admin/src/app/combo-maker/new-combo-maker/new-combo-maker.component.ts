import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FirebaseService } from '../../servies/firebase.service';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-new-combo-maker',
  standalone: true,
  imports: [ DialogModule,
    MultiSelectModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    ReactiveFormsModule],
  templateUrl: './new-combo-maker.component.html',
  styleUrl: './new-combo-maker.component.css'
})
export class NewComboMakerComponent implements OnInit {
  visible: boolean = false;
  foodServies = inject(FirebaseService);
  fb = inject(FormBuilder)
  newItemForm!: FormGroup;
  isSubmit:boolean=false;
  itemOptions: any[]=[];
  ngOnInit(): void {
    this.newItemForm = this.fb.group({
      itemName: ['', Validators.required],
      itemList: ['', Validators.required],
      description: ['',Validators.required],
      price: [null, Validators.required],
      discount: [null],
      logoUrl:[null, Validators.required],
      bannerImage:[null, Validators.required]
    });
    this.foodServies.getFood().subscribe((res:any)=>{
      this.itemOptions = res.filter((e:any)=>e.type=='single').map((e:any)=>(
        {
          itemName:e.itemName,
          id:e.id
        }));
      });
  }
  onSave() {
    this.isSubmit =true;
    if (this.newItemForm.valid) {
      let rawValue = this.newItemForm.getRawValue();
      rawValue.type='combo'
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
