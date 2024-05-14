import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../servies/auth.service';
import { RoutingService } from '../servies/routing.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  isLoading:boolean = false;
  loginForm!: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private authServies :AuthService,
    public routerLink:RoutingService
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  get f() {
    return this.loginForm.controls;
  }
  async login() {
    const rawValue =  this.loginForm.getRawValue()
    this.authServies.login(
      rawValue.email,
      rawValue.password
    ).subscribe(()=>{
      this.isLoading =false;
      this.routerLink.navigateUrl('/main',undefined);
    },
    (error)=>{
      this.isLoading =false;
    })
  }
}
