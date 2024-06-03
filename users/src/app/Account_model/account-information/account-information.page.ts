import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-account-information',
  templateUrl: './account-information.page.html',
  styleUrls: ['./account-information.page.scss'],
})
export class AccountInformationPage implements OnInit {
  accountForm!: FormGroup;
  isLoader:boolean=true;
  constructor(
    private fb: FormBuilder,
    private userService:UserService,
    private routerLink:RoutingService
  ) {
    
  }
  
  ngOnInit() {
    this.accountForm = this.fb.group({
      createdAt: [''],
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      uid: [''],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      updateAt: [''],
    });
    let uid = localStorage.getItem('uid');
    if(uid){
      this.userService.getuserById(uid).subscribe((res:any)=>{
        this.isLoader = false;
        this.accountForm.get('displayName')?.setValue(res.displayName);
        this.accountForm.get('email')?.setValue(res.email);
        this.accountForm.get('phoneNumber')?.setValue(res.phoneNumber)
      })
    }
  }

  onSubmit() {
    if (this.accountForm.valid) {
      const uid = localStorage.getItem('uid');
      if (uid){
        const rawValue = this.accountForm.getRawValue();
        rawValue.updateAt = new Date();
        this.isLoader = true;
        this.userService.updateAccount(uid,rawValue).subscribe((res:any)=>{
          this.isLoader = false;
          this.routerLink.navigateUrl('/main/account',undefined)
        })
      }
    }
  }

}
