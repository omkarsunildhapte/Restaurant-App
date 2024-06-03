import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../service/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,ReactiveFormsModule,HttpClientModule
  ],

  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  fb = inject(FormBuilder);
  http = inject (HttpClient);
  router = inject (Router);
  authServies = inject (AuthService);
  form = this.fb.nonNullable.group({
   email:['',[Validators.required,Validators.email]],
   password:['',[Validators.required,Validators.minLength(8)]]
  })

  onSubmit():void{
    const rawValue  = this.form.getRawValue()
    if (this.form.valid){
      this.authServies.login(
        rawValue.email,
        rawValue.password
      ).subscribe((res:any)=>{
        this.router.navigateByUrl('/main/dashboard')
      })
    }
   }
}
