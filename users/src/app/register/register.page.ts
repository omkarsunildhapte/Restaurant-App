import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../servies/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registrationForm!: FormGroup;
  isLoading:boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authServies: AuthService
  ) { }

  ngOnInit() {
    this.registrationForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

  }

  get f() {
    return this.registrationForm.controls;
  }

  onSubmit(): void {
    this.isLoading = true;
    const rawValue = this.registrationForm.getRawValue()
    if (this.registrationForm.valid) {
      this.authServies.register(
        rawValue.name,
        rawValue.email,
        rawValue.password
      ).subscribe((res: any) => {
        this.isLoading =false;
        this.router.navigateByUrl('/login');
      },
      (error)=>{
        this.isLoading =false;
      })
    }
  }
  
  async signInWithGoogle() {
  }

  async signInWithFacebook() {
   
  }
}
