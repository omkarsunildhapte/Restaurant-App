import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../servies/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink,HttpClientModule,ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
   fb = inject(FormBuilder);
   http = inject (HttpClient);
   router = inject (Router);
   authServies = inject (AuthService);
   form = this.fb.nonNullable.group({
    name: ['',[Validators.required,Validators.minLength(3)]],
    email:['',[Validators.required,Validators.email]],
    password:['',[Validators.required,Validators.minLength(8)]]
   })
   
   onSubmit():void{
    const rawValue  = this.form.getRawValue()
    if (this.form.valid){
      this.authServies.register(
        rawValue.name,
        rawValue.email,
        rawValue.password
      ).subscribe((res:any)=>{
        this.router.navigateByUrl('/mains/dashboard')
      })
    }
   }
}
